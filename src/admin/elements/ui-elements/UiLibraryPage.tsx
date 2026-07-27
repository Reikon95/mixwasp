import { type AuthUser } from "wasp/auth";
import {
  AlertCircle,
  Bell,
  Heart,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import { MixWaspLoader } from "../../../client/components/MixWaspLoader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../../client/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "../../../client/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "../../../client/components/ui/avatar";
import { Button } from "../../../client/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../client/components/ui/card";
import { Checkbox } from "../../../client/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../client/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../client/components/ui/dropdown-menu";
import { Input } from "../../../client/components/ui/input";
import { Label } from "../../../client/components/ui/label";
import { Progress } from "../../../client/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../client/components/ui/select";
import { Separator } from "../../../client/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../../client/components/ui/sheet";
import { Switch } from "../../../client/components/ui/switch";
import { Textarea } from "../../../client/components/ui/textarea";
import { toast } from "../../../client/hooks/use-toast";
import { Breadcrumb } from "../../layout/Breadcrumb";
import { DefaultLayout } from "../../layout/DefaultLayout";
import { ComponentSection } from "./ComponentSection";

const LIBRARY_SECTIONS = [
  { id: "buttons", label: "Buttons" },
  { id: "inputs", label: "Inputs" },
  { id: "selection", label: "Selection" },
  { id: "cards", label: "Cards" },
  { id: "feedback", label: "Feedback" },
  { id: "overlays", label: "Overlays" },
  { id: "navigation", label: "Navigation" },
  { id: "layout", label: "Layout" },
  { id: "brand", label: "Brand" },
] as const;

export function UiLibraryPage({ user }: { user: AuthUser }) {
  const [checked, setChecked] = useState(true);
  const [notificationsOn, setNotificationsOn] = useState(true);

  return (
    <DefaultLayout user={user}>
      <Breadcrumb pageName="UI Library" />

      <div className="mb-8 max-w-3xl">
        <h2 className="text-foreground text-2xl font-semibold tracking-tight">
          Component library
        </h2>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          Browse every reusable UI primitive in MixWasp. This page is only
          available to logged-in admins.
        </p>
      </div>

      <nav
        aria-label="UI library sections"
        className="mb-8 flex flex-wrap gap-2"
      >
        {LIBRARY_SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="bg-muted text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
          >
            {section.label}
          </a>
        ))}
      </nav>

      <div className="space-y-10 pb-10">
        <ComponentSection
          id="buttons"
          title="Buttons"
          description="Variants, sizes, and icon combinations."
        >
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <Button variant="default">Default</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon" aria-label="Add">
                <Plus />
              </Button>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button>
                <Plus />
                Add mix
              </Button>
              <Button variant="outline">
                <Heart />
                Favourite
              </Button>
              <Button variant="destructive">
                <Trash2 />
                Delete
              </Button>
            </div>
          </div>
        </ComponentSection>

        <ComponentSection
          id="inputs"
          title="Inputs"
          description="Text fields and labels."
        >
          <div className="grid max-w-xl gap-6">
            <div className="space-y-2">
              <Label htmlFor="demo-title">Title</Label>
              <Input id="demo-title" placeholder="Warehouse Soft Open" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-description">Description</Label>
              <Textarea
                id="demo-description"
                placeholder="Rolling house for a slow-build Friday."
                rows={4}
              />
            </div>
          </div>
        </ComponentSection>

        <ComponentSection
          id="selection"
          title="Selection"
          description="Checkboxes, switches, and selects."
        >
          <div className="flex max-w-xl flex-col gap-6">
            <div className="flex items-center gap-3">
              <Checkbox
                id="demo-checkbox"
                checked={checked}
                onCheckedChange={(value) => setChecked(value === true)}
              />
              <Label htmlFor="demo-checkbox">Remember this mix</Label>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-md border px-4 py-3">
              <div>
                <Label htmlFor="demo-switch">Chart notifications</Label>
                <p className="text-muted-foreground text-sm">
                  Email when a mix you favourited moves up.
                </p>
              </div>
              <Switch
                id="demo-switch"
                checked={notificationsOn}
                onCheckedChange={setNotificationsOn}
              />
            </div>
            <div className="space-y-2">
              <Label>Period</Label>
              <Select defaultValue="week">
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue placeholder="Choose a period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This week</SelectItem>
                  <SelectItem value="month">This month</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </ComponentSection>

        <ComponentSection
          id="cards"
          title="Cards"
          description="Surface variants for content grouping."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Default card</CardTitle>
                <CardDescription>
                  Used for mix rows and settings panels.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Peak-time house with a live vocal cut.</p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Action</Button>
              </CardFooter>
            </Card>
            <Card variant="bento">
              <CardHeader>
                <CardTitle>Bento card</CardTitle>
                <CardDescription>Subtle marketing-style surface.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Accent layout for featured content.</p>
              </CardContent>
            </Card>
          </div>
        </ComponentSection>

        <ComponentSection
          id="feedback"
          title="Feedback"
          description="Alerts, progress, and toasts."
        >
          <div className="space-y-6">
            <Alert>
              <Bell className="size-4" />
              <AlertTitle>Heads up</AlertTitle>
              <AlertDescription>
                Demo mixes load automatically when the charts are empty.
              </AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>
                Could not favourite this mix. Try again in a moment.
              </AlertDescription>
            </Alert>
            <div className="max-w-md space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Upload progress</span>
                <span className="text-muted-foreground">68%</span>
              </div>
              <Progress value={68} />
            </div>
            <Button
              variant="outline"
              onClick={() =>
                toast({
                  title: "Mix submitted",
                  description: "Your set is live on the charts.",
                })
              }
            >
              Show toast
            </Button>
          </div>
        </ComponentSection>

        <ComponentSection
          id="overlays"
          title="Overlays"
          description="Dialogs and sheets."
        >
          <div className="flex flex-wrap gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Open dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete mix?</DialogTitle>
                  <DialogDescription>
                    This removes the mix from the charts. This action cannot be
                    undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button variant="destructive">Delete</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Open sheet</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filter charts</SheetTitle>
                  <SheetDescription>
                    Narrow mixes by genre, tag, or promoter.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <Input placeholder="Search genres" />
                  <Input placeholder="Search tags" />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </ComponentSection>

        <ComponentSection
          id="navigation"
          title="Navigation"
          description="Menus and expandable sections."
        >
          <div className="flex flex-wrap items-start gap-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Open menu">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Mix actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Favourite</DropdownMenuItem>
                <DropdownMenuItem>Copy link</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Accordion type="single" collapsible className="w-full max-w-md">
              <AccordionItem value="faq-1">
                <AccordionTrigger>How are charts ranked?</AccordionTrigger>
                <AccordionContent>
                  Mixes are ordered by favourites in the selected time period.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-2">
                <AccordionTrigger>Which links can I submit?</AccordionTrigger>
                <AccordionContent>
                  YouTube, SoundCloud, and Mixcloud URLs with a valid track or
                  set path.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </ComponentSection>

        <ComponentSection
          id="layout"
          title="Layout"
          description="Avatars and dividers."
        >
          <div className="flex flex-wrap items-center gap-6">
            <Avatar>
              <AvatarImage
                src="https://api.dicebear.com/9.x/shapes/svg?seed=MixWasp"
                alt="Demo user"
              />
              <AvatarFallback>MW</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>NV</AvatarFallback>
            </Avatar>
            <div className="min-w-50 flex-1 space-y-3">
              <p className="text-sm font-medium">Section above</p>
              <Separator />
              <p className="text-muted-foreground text-sm">Section below</p>
            </div>
          </div>
        </ComponentSection>

        <ComponentSection
          id="brand"
          title="Brand"
          description="App-specific loading state."
          className="flex justify-center"
        >
          <MixWaspLoader label="Loading demo mixes" />
        </ComponentSection>
      </div>
    </DefaultLayout>
  );
}
