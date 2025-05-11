
"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LivePreview } from "./LivePreview";
import { TerminalComponent } from "./TerminalComponent"; // Renamed to avoid conflicts

export function OutputPane() {
  return (
    <Tabs defaultValue="preview" className="h-full flex flex-col">
      <TabsList className="shrink-0">
        <TabsTrigger value="preview">Preview</TabsTrigger>
        <TabsTrigger value="terminal">Terminal</TabsTrigger>
      </TabsList>
      <TabsContent value="preview" className="flex-grow_h-full_overflow-auto_mt-0"> {/* Ensure content fills space */}
        <LivePreview />
      </TabsContent>
      <TabsContent value="terminal" className="flex-grow_h-full_overflow-auto_mt-0"> {/* Ensure content fills space */}
        <TerminalComponent />
      </TabsContent>
    </Tabs>
  );
}
