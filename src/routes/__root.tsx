import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "~/styles/app.css?url";
import Sidebar from "~/components/Sidebar";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Axessa - AI-Powered Study Platform" },
      { name: "description", content: "All-in-one AI-powered study platform for students. Write notes, generate reviewers, and manage your study schedule." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" },
    ],
  }),
  notFoundComponent: () => (
    <div className="min-h-dvh flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-6xl font-bold gradient-brand bg-clip-text text-transparent">404</h1>
        <p className="text-gray-500 mt-2">Page not found</p>
        <a href="/" className="inline-block mt-4 px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium hover:shadow-lg transition-all">
          Go Home
        </a>
      </div>
    </div>
  ),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <HeadContent />
        <style>{`
          body { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        `}</style>
      </head>
      <body className="h-full bg-gray-50">
        <div className="flex min-h-dvh">
          <Sidebar />
          <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 overflow-x-hidden">
            {children}
          </main>
        </div>
        <Scripts />
      </body>
    </html>
  );
}