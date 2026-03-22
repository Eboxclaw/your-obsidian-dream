import { useStore } from '@/lib/store';

const NotFound = () => {
  const { navigate } = useStore();

  return (
    <div className="flex min-h-full items-center justify-center bg-muted px-4 py-8">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">View not found</h1>
        <p className="mb-4 text-base text-muted-foreground">
          The current view is unavailable. Return to Home to continue.
        </p>
        <button
          type="button"
          onClick={() => navigate('dashboard')}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;
