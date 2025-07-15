"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Home, Folder, Package, Compass, ChevronDown, ChevronRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  active: boolean;
}
export interface FolderItem {
  id: string;
  name: string;
  isExpanded: boolean;
  children?: FolderItem[];
}
export interface SidebarNavigationProps {
  collapsed?: boolean;
  activeTab?: string;
  navigationItems?: NavigationItem[];
  folders?: FolderItem[];
  onCollapseToggle?: () => void;
  onTabChange?: (tabId: string) => void;
  onFolderToggle?: (folderId: string) => void;
  onProfileClick?: () => void;
  profileAvatarUrl?: string;
  profileName?: string;
}
const defaultNavigationItems: NavigationItem[] = [{
  id: "home",
  label: "Home",
  icon: Home,
  active: true
}, {
  id: "folders",
  label: "Folder Tree",
  icon: Folder,
  active: false
}, {
  id: "packs",
  label: "Packs",
  icon: Package,
  active: false
}, {
  id: "discover",
  label: "Discover",
  icon: Compass,
  active: false
}];
const defaultFolders: FolderItem[] = [{
  id: "1",
  name: "My Collections",
  isExpanded: true,
  children: [{
    id: "1-1",
    name: "Favorites",
    isExpanded: false
  }, {
    id: "1-2",
    name: "Work Projects",
    isExpanded: false
  }]
}, {
  id: "2",
  name: "Shared",
  isExpanded: false,
  children: [{
    id: "2-1",
    name: "Team Assets",
    isExpanded: false
  }]
}];
export default function SidebarNavigation({
  collapsed = false,
  activeTab = "home",
  navigationItems = defaultNavigationItems,
  folders = defaultFolders,
  onCollapseToggle,
  onTabChange,
  onFolderToggle,
  onProfileClick,
  profileAvatarUrl,
  profileName = "User"
}: SidebarNavigationProps) {
  // Update navigation items with active state
  const updatedNavigationItems = navigationItems.map(item => ({
    ...item,
    active: item.id === activeTab
  }));

  // Handle navigation item click
  const handleNavClick = (itemId: string) => {
    onTabChange?.(itemId);
  };

  // Handle folder toggle
  const handleFolderToggle = (folderId: string) => {
    onFolderToggle?.(folderId);
  };

  // Handle profile click
  const handleProfileClick = () => {
    onProfileClick?.();
  };

  // Render folder tree recursively
  const renderFolderTree = (folders: FolderItem[], level = 0) => {
    return folders.map(folder => <li key={folder.id} className={cn("select-none", level > 0 && "ml-4")}>
        <button onClick={() => handleFolderToggle(folder.id)} className="flex items-center gap-2 w-full p-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring" aria-expanded={folder.children ? folder.isExpanded : undefined} aria-label={`${folder.isExpanded ? 'Collapse' : 'Expand'} ${folder.name} folder`}>
          {folder.children && (folder.isExpanded ? <ChevronDown className="h-4 w-4" aria-hidden="true" /> : <ChevronRight className="h-4 w-4" aria-hidden="true" />)}
          <Folder className="h-4 w-4" aria-hidden="true" />
          <span>
            {folder.name}
          </span>
        </button>
        <AnimatePresence>
          {folder.isExpanded && folder.children && <motion.ul initial={{
          height: 0,
          opacity: 0
        }} animate={{
          height: "auto",
          opacity: 1
        }} exit={{
          height: 0,
          opacity: 0
        }} transition={{
          duration: 0.2,
          ease: "easeInOut"
        }} className="overflow-hidden" role="group" aria-label={`${folder.name} subfolders`}>
              {renderFolderTree(folder.children, level + 1)}
            </motion.ul>}
        </AnimatePresence>
      </li>);
  };
  return <motion.aside initial={false} animate={{
    width: collapsed ? 60 : 240,
    transition: {
      duration: 0.3,
      ease: "easeInOut"
    }
  }} className="bg-sidebar border-r border-sidebar-border flex flex-col shadow-lg" role="complementary" aria-label="Main navigation">
      {/* Sidebar Header */}
      <header className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          {!collapsed && <h2 className="text-lg font-semibold text-sidebar-foreground">
              SREF Manager
            </h2>}
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onCollapseToggle} className="text-sidebar-foreground hover:bg-sidebar-accent focus:ring-2 focus:ring-ring" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
                {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">
                <p>Expand sidebar</p>
              </TooltipContent>}
          </Tooltip>
        </div>
      </header>

      {/* Navigation */}
      <ScrollArea className="flex-1 p-2">
        <nav role="navigation" aria-label="Main navigation">
          <ul className="space-y-1" role="list">
            {updatedNavigationItems.map(item => <li key={item.id} role="listitem">
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button onClick={() => handleNavClick(item.id)} className={cn("flex items-center gap-3 w-full p-3 text-sm rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring", item.active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")} aria-current={item.active ? "page" : undefined} aria-label={item.label}>
                      <item.icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                      {!collapsed && <span>
                          {item.label}
                        </span>}
                    </button>
                  </TooltipTrigger>
                  {collapsed && <TooltipContent side="right">
                      <p>
                        {item.label}
                      </p>
                    </TooltipContent>}
                </Tooltip>
              </li>)}
          </ul>
        </nav>

        {/* Folder Tree (when folders tab is active and not collapsed) */}
        {activeTab === "folders" && !collapsed && folders.length > 0 && <section className="mt-6" aria-labelledby="folder-tree-heading">
            <Separator className="mb-4" />
            <h3 id="folder-tree-heading" className="sr-only">
              Folder Tree
            </h3>
            <ul className="space-y-1" role="tree" aria-label="Folder tree">
              {renderFolderTree(folders)}
            </ul>
          </section>}
      </ScrollArea>

      {/* Profile/Avatar Menu Item at Bottom */}
      <footer className="p-4 border-t border-sidebar-border mt-auto">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button onClick={handleProfileClick} className={cn("flex items-center w-full gap-3 p-3 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring", "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", "border border-sidebar-border hover:border-sidebar-accent-foreground/20", collapsed ? "justify-center" : "justify-start")} aria-label="Profile settings">
              <Avatar className="h-8 w-8 border-2 border-sidebar-border shadow-sm">
                {profileAvatarUrl ? <AvatarImage src={profileAvatarUrl} alt={`${profileName}'s profile picture`} /> : <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground font-semibold text-sm">
                    {profileName.charAt(0).toUpperCase()}
                  </AvatarFallback>}
              </Avatar>
              {!collapsed && <div className="flex flex-col items-start min-w-0">
                  <span className="text-sm font-medium text-sidebar-foreground truncate">
                    Profile
                  </span>
                  <span className="text-xs text-sidebar-foreground/70 truncate">
                    {profileName}
                  </span>
                </div>}
            </button>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">
              <div className="text-center">
                <p className="font-medium">Profile</p>
                <p className="text-xs text-muted-foreground">{profileName}</p>
              </div>
            </TooltipContent>}
        </Tooltip>
      </footer>
    </motion.aside>;
}