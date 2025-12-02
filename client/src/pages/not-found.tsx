import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Hotel } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center px-4">
        <Hotel className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
        <h1 className="text-4xl font-serif font-bold mb-2">404</h1>
        <h2 className="text-xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Oops! The page you're looking for doesn't exist. 
          Let us help you find your way back.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild>
            <Link href="/" data-testid="link-go-home">Go Home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/rooms" data-testid="link-browse-rooms">Browse Rooms</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
