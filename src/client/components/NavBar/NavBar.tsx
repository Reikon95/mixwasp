import { LogIn, Menu } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Link as ReactRouterLink } from "react-router";
import { useAuth } from "wasp/client/auth";
import { Link as WaspRouterLink, routes } from "wasp/client/router";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../../client/components/ui/sheet";
import { throttleWithTrailingInvocation } from "../../../shared/utils";
import { UserDropdown } from "../../../user/UserDropdown";
import { UserMenuItems } from "../../../user/UserMenuItems";
import logo from "../../static/mixwaspnobg.png";
import { cn } from "../../utils";
import { DarkModeSwitcher } from "../DarkModeSwitcher";

export interface NavigationItem {
  name: string;
  to: string;
}

export function NavBar({
  navigationItems,
}: {
  navigationItems: NavigationItem[];
}) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const throttledHandler = throttleWithTrailingInvocation(() => {
      setIsScrolled(window.scrollY > 0);
    }, 50);

    window.addEventListener("scroll", throttledHandler);

    return () => {
      window.removeEventListener("scroll", throttledHandler);
      throttledHandler.cancel();
    };
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        isScrolled && "top-3",
      )}
    >
      <div
        className={cn("transition-all duration-300", {
          "nav-terminal nav-terminal--scrolled mx-3 rounded-sm md:mx-12":
            isScrolled,
          "nav-terminal mx-0": !isScrolled,
        })}
      >
        <nav
          className={cn(
            "flex items-center justify-between transition-all duration-300",
            {
              "px-3 py-2.5 lg:px-5": isScrolled,
              "px-4 py-4 sm:px-6 lg:px-8": !isScrolled,
            },
          )}
          aria-label="Global"
        >
          <div className="flex items-center gap-5">
            <WaspRouterLink
              to={routes.MixesRoute.to}
              className="group flex items-center gap-2.5 transition-opacity hover:opacity-90"
            >
              <NavLogo isScrolled={isScrolled} />
              <span
                className={cn(
                  "brand-wordmark hidden sm:inline",
                  isScrolled ? "text-sm" : "text-base",
                )}
              >
                MixWasp
              </span>
            </WaspRouterLink>

            <ul className="ml-2 hidden items-center gap-1 lg:flex">
              {renderNavigationItems(navigationItems)}
            </ul>
          </div>
          <NavBarMobileMenu
            isScrolled={isScrolled}
            navigationItems={navigationItems}
          />
          <NavBarDesktopUserDropdown isScrolled={isScrolled} />
        </nav>
      </div>
    </header>
  );
}

function NavBarDesktopUserDropdown({ isScrolled }: { isScrolled: boolean }) {
  const { data: user, isLoading: isUserLoading } = useAuth();

  return (
    <div className="hidden items-center justify-end gap-3 lg:flex lg:flex-1">
      <DarkModeSwitcher />
      {isUserLoading ? null : !user ? (
        <WaspRouterLink
          to={routes.LoginRoute.to}
          className={cn(
            "border-primary/40 text-primary hover:bg-primary/10 hover:border-primary inline-flex items-center gap-1.5 border px-3 py-1.5 font-medium tracking-wider uppercase transition-colors",
            isScrolled ? "text-xs" : "text-sm",
          )}
        >
          Log in
          <LogIn size={isScrolled ? "0.9rem" : "1rem"} aria-hidden />
        </WaspRouterLink>
      ) : (
        <UserDropdown user={user} />
      )}
    </div>
  );
}

function NavBarMobileMenu({
  isScrolled,
  navigationItems,
}: {
  isScrolled: boolean;
  navigationItems: NavigationItem[];
}) {
  const { data: user, isLoading: isUserLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex lg:hidden">
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className="text-primary hover:bg-primary/10 border-primary/30 inline-flex items-center justify-center rounded-sm border p-1 transition-colors"
          >
            <span className="sr-only">Open main menu</span>
            <Menu
              className={cn("transition-all duration-300", {
                "size-7 p-0.5": !isScrolled,
                "size-6 p-0.5": isScrolled,
              })}
              aria-hidden="true"
            />
          </button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="border-border bg-background/95 w-[300px] backdrop-blur-md sm:w-[400px]"
        >
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <WaspRouterLink
                to={routes.MixesRoute.to}
                className="flex items-center gap-2"
              >
                <NavLogo isScrolled={false} />
                <span className="brand-wordmark text-sm">MixWasp</span>
              </WaspRouterLink>
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 flow-root">
            <div className="divide-border -my-6 divide-y">
              <ul className="space-y-1 py-6">
                {renderNavigationItems(navigationItems, setMobileMenuOpen)}
              </ul>
              <div className="py-6">
                {isUserLoading ? null : !user ? (
                  <WaspRouterLink to={routes.LoginRoute.to}>
                    <div className="text-primary flex items-center justify-end tracking-wider uppercase transition-colors">
                      Log in <LogIn size="1.1rem" className="ml-1" />
                    </div>
                  </WaspRouterLink>
                ) : (
                  <ul className="space-y-2">
                    <UserMenuItems
                      user={user}
                      onItemClick={() => setMobileMenuOpen(false)}
                    />
                  </ul>
                )}
              </div>
              <div className="py-6">
                <DarkModeSwitcher />
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function renderNavigationItems(
  navigationItems: NavigationItem[],
  setMobileMenuOpen?: Dispatch<SetStateAction<boolean>>,
) {
  const menuStyles = cn({
    "block rounded-sm px-3 py-2 text-sm font-medium tracking-wider uppercase text-foreground hover:bg-primary/10 hover:text-primary transition-colors":
      !!setMobileMenuOpen,
    "px-3 py-1.5 text-xs font-medium tracking-wider uppercase text-muted-foreground duration-300 ease-in-out hover:text-primary transition-colors":
      !setMobileMenuOpen,
  });

  return navigationItems.map((item) => {
    return (
      <li key={item.name}>
        <ReactRouterLink
          to={item.to}
          className={menuStyles}
          onClick={setMobileMenuOpen && (() => setMobileMenuOpen(false))}
          target={item.to.startsWith("http") ? "_blank" : undefined}
        >
          {item.name}
        </ReactRouterLink>
      </li>
    );
  });
}

function NavLogo({ isScrolled }: { isScrolled: boolean }) {
  return (
    <img
      className={cn("transition-all duration-500", {
        "size-9": !isScrolled,
        "size-8": isScrolled,
      })}
      src={logo}
      alt=""
      aria-hidden
    />
  );
}
