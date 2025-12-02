import { Link } from "wouter";
import { Hotel, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Hotel className="h-8 w-8 text-primary" />
              <span className="font-serif text-xl font-semibold">Grand Horizon</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Experience luxury and comfort at Grand Horizon Hotel. 
              Your perfect getaway awaits with stunning views and world-class amenities.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/rooms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Our Rooms
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  My Bookings
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Contact Info</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>123 Ocean Drive, Paradise Bay, CA 90210</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                <span>info@grandhorizon.com</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Hours</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Check-in: 3:00 PM</li>
              <li>Check-out: 11:00 AM</li>
              <li>Reception: 24/7</li>
              <li>Restaurant: 7:00 AM - 10:00 PM</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Grand Horizon Hotel. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
