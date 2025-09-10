import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">FreelancePro</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                  Manage Your Freelance Business with Ease
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  All-in-one client and project management platform designed specifically for freelancers.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/register">
                  <Button size="lg" className="w-full min-[400px]:w-auto">
                    Get Started
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="w-full min-[400px]:w-auto">
                    Login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3">
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Client Management</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Organize all your client information in one place with easy access to contact details and project history.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Project Tracking</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Track project progress, deadlines, and status updates to ensure you deliver on time, every time.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Invoice Generation</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Create professional invoices directly from your projects and track payment status effortlessly.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Expense Tracking</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Monitor project-related expenses to maintain profitability and prepare for tax season.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Business Analytics</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Gain insights into your freelance business with visual reports on revenue, project status, and client distribution.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Time Management</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Optimize your workflow and track billable hours to maximize productivity and profitability.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-8">
        <div className="container mx-auto flex flex-col items-center justify-center gap-4 md:flex-row md:gap-8">
          <p className="text-center text-sm leading-loose text-gray-500 md:text-left dark:text-gray-400">
            © 2023 FreelancePro. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
