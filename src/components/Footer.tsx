import React from 'react';
import { Button } from "@/components/ui/button";

interface FooterProps {
  contactUrl: string;
}

const Footer = ({ contactUrl }: FooterProps) => {
  return (
    <footer className="w-full py-6 mt-12 border-t border-zinc-200 dark:border-zinc-800">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            © {new Date().getFullYear()} Gastimator. All rights reserved.
          </p>
          <Button
            variant="outline"
            onClick={() => window.open(contactUrl, '_blank')}
            className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            Contact Me
          </Button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;