"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Bell, Settings, User } from "lucide-react";
import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        {/* Logo & Branding */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-8 h-8 text-blue-600" />
            <div>
              <div className="text-xl font-bold text-gray-900">QPilot</div>
              <p className="text-xs text-gray-500">AI Complaint Intelligence</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 ml-4">
            v0.1.0
          </Badge>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-gray-900 hover:text-blue-600">
            Dashboard
          </Link>
          <Link
            href="/complaints"
            className="text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            Complaints
          </Link>
          <Link href="/reports" className="text-sm font-medium text-gray-500 hover:text-gray-900">
            Reports
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-5 w-5" aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Settings">
            <Settings className="h-5 w-5" aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="User profile">
            <User className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </header>
  );
}
