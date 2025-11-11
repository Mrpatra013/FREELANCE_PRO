import { Prisma } from "@prisma/client";

// Client with relations
export type Client = Prisma.ClientGetPayload<{
  include: {
    projects: true;
  };
}>;

// Client without relations
export type ClientBasic = Prisma.ClientGetPayload<object>;

// Project with relations
export type Project = Prisma.ProjectGetPayload<{
  include: {
    client: true;
  };
}>;

// Project without relations
export type ProjectBasic = Prisma.ProjectGetPayload<object>;

// Invoice with relations
export type Invoice = Prisma.InvoiceGetPayload<{
  include: {
    project: true;
    client: true;
  };
}>;

// Invoice without relations
export type InvoiceBasic = Prisma.InvoiceGetPayload<object>;