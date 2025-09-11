import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const client = await prisma.client.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, email, phone, company, address, description, notes } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check if client exists and belongs to user
    const existingClient = await prisma.client.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Check if another client with this email exists (excluding current client)
    const emailConflict = await prisma.client.findFirst({
      where: {
        email,
        userId: user.id,
        NOT: {
          id,
        },
      },
    });

    if (emailConflict) {
      return NextResponse.json(
        { error: 'Another client with this email already exists' },
        { status: 400 }
      );
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        name,
        email,
        phone: phone || null,
        company: company || null,
        address: address || null,
        description: description || null,
        notes: notes || null,
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if client exists and belongs to user
    const existingClient = await prisma.client.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get all projects associated with this client
    const associatedProjects = await prisma.project.findMany({
      where: { clientId: id },
      include: {
        invoices: true
      }
    });

    // Use a transaction to delete everything in the correct order
    await prisma.$transaction(async (tx) => {
      // First, delete all invoices for all projects of this client
      for (const project of associatedProjects) {
        if (project.invoices.length > 0) {
          await tx.invoice.deleteMany({
            where: { projectId: project.id }
          });
        }
      }
      
      // Then delete all projects of this client
      if (associatedProjects.length > 0) {
        await tx.project.deleteMany({
          where: { clientId: id }
        });
      }
      
      // Finally, delete the client
      await tx.client.delete({
        where: { id },
      });
    });

    return NextResponse.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}