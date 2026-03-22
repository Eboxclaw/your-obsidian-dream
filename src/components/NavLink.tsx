import { forwardRef, type MouseEventHandler, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';
import type { ViewMode } from '@/lib/types';

interface NavLinkCompatProps {
  className?: string;
  activeClassName?: string;
  to: ViewMode;
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

const NavLink = forwardRef<HTMLButtonElement, NavLinkCompatProps>(
  ({ className, activeClassName, to, children, onClick }, ref) => {
    const { ui, navigate } = useStore();
    const isActive = ui.activeView === to;

    return (
      <button
        ref={ref}
        type="button"
        className={cn(className, isActive && activeClassName)}
        onClick={(event) => {
          navigate(to);
          if (onClick) {
            onClick(event);
          }
        }}
      >
        {children}
      </button>
    );
  },
);

NavLink.displayName = 'NavLink';

export { NavLink };
