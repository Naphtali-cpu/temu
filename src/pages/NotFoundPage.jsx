import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { Button, EmptyState } from '../components/ui.jsx';

export default function NotFoundPage() {
  return (
    <div className="shell py-24">
      <EmptyState
        icon={Compass}
        title="This page has moved on"
        description="The link may be old, or the property may have been withdrawn from the market. Our current portfolio is a click away."
        action={
          <Button as={Link} to="/">
            <ArrowLeft className="h-4 w-4" /> Back to the collection
          </Button>
        }
      />
    </div>
  );
}
