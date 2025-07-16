"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Home, Folder, Package, Compass, Search, Tag, Plus, ChevronDown, ChevronRight, Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { useSREFCodes } from "@/hooks/useSREFCodes";
import { useTags } from "@/hooks/useTags";
import { useAuth } from "@/hooks/useAuth";
import SREFEditModal from "@/components/sref/SREFEditModal";
import StorageDebugPanel from "@/components/debug/StorageDebugPanel";

// Types
export interface SREFCode {
  id: string;
  title: string;
  code: string;
  code_value?: string;
  version: "SV4" | "SV6";
  sv_version?: number;
  images: string[];
  tags: string[];
  createdAt: Date;
  description?: string;
}
export interface FolderItem {
  id: string;
  name: string;
  isExpanded: boolean;
  children?: FolderItem[];
}
export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}
export interface SREFManagementDashboardProps {
  initialCodes?: SREFCode[];
  initialTags?: string[];
  initialFolders?: FolderItem[];
}

// Mock data
const defaultSREFCodes: SREFCode[] = [{
  id: "1",
  title: "90's comic book",
  code: "--sref 1234567890",
  version: "SV6",
  images: ["https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop", "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop", "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop"],
  tags: ["comic", "retro", "colorful"],
  createdAt: new Date()
}, {
  id: "2",
  title: "Cyberpunk neon",
  code: "--sref 9876543210",
  version: "SV4",
  images: ["https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=200&fit=crop", "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=200&fit=crop", "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=200&fit=crop"],
  tags: ["cyberpunk", "neon", "futuristic"],
  createdAt: new Date()
}, {
  id: "3",
  title: "Vintage photography",
  code: "--sref 5555555555",
  version: "SV6",
  images: ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop", "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop", "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop"],
  tags: ["vintage", "photography", "sepia"],
  createdAt: new Date()
}];
const defaultTags = ["comic", "retro", "colorful", "cyberpunk", "neon", "futuristic", "vintage", "photography", "sepia", "abstract", "minimalist", "dark"];
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
export default function SREFManagementDashboard({
  initialCodes = defaultSREFCodes,
  initialTags = defaultTags,
  initialFolders = defaultFolders
}: SREFManagementDashboardProps) {
  // Authentication
  const { user, signOut } = useAuth();
  
  // Real data hooks
  const { 
    srefCodes: realSrefCodes, 
    loading: srefLoading, 
    error: srefError,
    searchSREFCodes: _searchSREFCodes,
    deleteSREFCode 
  } = useSREFCodes();
  
  const { 
    tags: realTags, 
    loading: _tagsLoading 
  } = useTags();

  // State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>(initialFolders);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<any>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  
  // Use real data when user is authenticated, fallback to mock data
  const srefCodes = user ? realSrefCodes : initialCodes;
  const availableTags = user ? realTags : initialTags;
  const isLoading = user ? srefLoading : false;
  const error = user ? srefError : null;

  // Filtered codes based on search and tags
  const filteredCodes = useMemo(() => {
    return srefCodes.filter(code => {
      const codeValue = (code as any).code_value || (code as any).code;
      const matchesSearch = code.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          codeValue.toLowerCase().includes(searchQuery.toLowerCase());
      const codeTags = code.tags || [];
      const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => codeTags.includes(tag));
      return matchesSearch && matchesTags;
    });
  }, [srefCodes, searchQuery, selectedTags]);

  // Handle tag toggle
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  // Handle folder toggle
  const toggleFolder = (folderId: string) => {
    const updateFolders = (folders: FolderItem[]): FolderItem[] => {
      return folders.map(folder => {
        if (folder.id === folderId) {
          return {
            ...folder,
            isExpanded: !folder.isExpanded
          };
        }
        if (folder.children) {
          return {
            ...folder,
            children: updateFolders(folder.children)
          };
        }
        return folder;
      });
    };
    setFolders(updateFolders(folders));
  };

  // Handle card click (copy SREF code)
  const handleCardClick = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("SREF code copied to clipboard!", {
      duration: 2000,
      position: "bottom-right"
    });
  };

  // Handle card edit
  const handleCardEdit = (id: string) => {
    const code = srefCodes.find(c => c.id === id);
    if (code) {
      const codeRecord = code as any;
      setEditingCode({
        id: codeRecord.id,
        title: codeRecord.title,
        code_value: codeRecord.code_value || codeRecord.code,
        description: codeRecord.description,
        version: codeRecord.version || (codeRecord.sv_version === 6 ? 'SV6' : 'SV4'),
        tags: codeRecord.tags || [],
        images: codeRecord.images || []
      });
      setIsEditModalOpen(true);
    }
  };

  // Handle add new SREF code
  const handleAddNew = () => {
    setEditingCode(null);
    setIsEditModalOpen(true);
  };

  // Handle edit modal success
  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setEditingCode(null);
    // Refresh the SREF codes list to show the new/updated code
    refreshSREFCodes();
  };

  // Handle card delete
  const handleCardDelete = async (id: string) => {
    if (!user) return;
    
    try {
      const result = await deleteSREFCode(id);
      if (result.success) {
        toast.success("SREF code deleted", {
          duration: 2000,
          position: "bottom-right"
        });
      } else {
        toast.error(result.error || "Failed to delete SREF code", {
          duration: 3000,
          position: "bottom-right"
        });
      }
    } catch (_error) {
      toast.error("An unexpected error occurred", {
        duration: 3000,
        position: "bottom-right"
      });
    }
  };

  // Sidebar navigation items
  const navigationItems: NavigationItem[] = [{
    id: "home",
    label: "Home",
    icon: Home,
    active: activeTab === "home"
  }, {
    id: "folders",
    label: "Folder Tree",
    icon: Folder,
    active: activeTab === "folders"
  }, {
    id: "packs",
    label: "Packs",
    icon: Package,
    active: activeTab === "packs"
  }, {
    id: "discover",
    label: "Discover",
    icon: Compass,
    active: activeTab === "discover"
  }];

  // Render folder tree
  const renderFolderTree = (folders: FolderItem[], level = 0) => {
    return folders.map(folder => <div key={folder.id} className={cn("select-none", level > 0 && "ml-4")}>
        <button onClick={() => toggleFolder(folder.id)} className="flex items-center gap-2 w-full p-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors">
          {folder.children && (folder.isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
          <Folder className="h-4 w-4" />
          <span>{folder.name}</span>
        </button>
        <AnimatePresence>
          {folder.isExpanded && folder.children && <motion.div initial={{
          height: 0,
          opacity: 0
        }} animate={{
          height: "auto",
          opacity: 1
        }} exit={{
          height: 0,
          opacity: 0
        }} transition={{
          duration: 0.2
        }} className="overflow-hidden">
              {renderFolderTree(folder.children, level + 1)}
            </motion.div>}
        </AnimatePresence>
      </div>);
  };
  return <TooltipProvider>
      <div className="flex min-h-screen bg-background text-foreground">
        {/* Sidebar */}
        <motion.aside initial={false} animate={{
        width: sidebarCollapsed ? 60 : 240,
        transition: {
          duration: 0.3,
          ease: "easeInOut"
        }
      }} className="bg-sidebar border-r border-sidebar-border flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && <h1 className="text-lg font-semibold text-sidebar-foreground">
                  SREF Manager
                </h1>}
              <Button variant="ghost" size="icon" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="text-sidebar-foreground hover:bg-sidebar-accent">
                {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 p-2">
            <nav className="space-y-1">
              {navigationItems.map(item => <Tooltip key={item.id} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button onClick={() => setActiveTab(item.id)} className={cn("flex items-center gap-3 w-full p-3 text-sm rounded-md transition-colors", item.active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </button>
                  </TooltipTrigger>
                  {sidebarCollapsed && <TooltipContent side="right">
                      <p>{item.label}</p>
                    </TooltipContent>}
                </Tooltip>)}
            </nav>

            {/* Folder Tree (when folders tab is active) */}
            {activeTab === "folders" && !sidebarCollapsed && <div className="mt-6">
                <Separator className="mb-4" />
                <div className="space-y-1">
                  {renderFolderTree(folders)}
                </div>
              </div>}
          </ScrollArea>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Header with Search and Tag Filter */}
          <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                {/* Search Bar */}
                <div className="relative max-w-md flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search SREF codes..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 bg-card border-input focus:ring-2 focus:ring-ring" />
                </div>
                {/* Action Buttons */}
                {user && (
                  <div className="flex items-center gap-4 ml-4">
                    <Button 
                      onClick={handleAddNew}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add SREF Code
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {user.email}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={async () => {
                        try {
                          await signOut();
                        } catch (error) {
                          console.error('Sign out error:', error);
                        }
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                )}
              </div>

              {/* Tag Cloud Filter */}
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => <Badge key={tag} variant={selectedTags.includes(tag) ? "default" : "secondary"} className={cn("cursor-pointer transition-colors hover:bg-primary/80", selectedTags.includes(tag) && "bg-primary text-primary-foreground")} onClick={() => toggleTag(tag)}>
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>)}
              </div>
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 p-6">
            {/* Debug Panel Toggle */}
            {user && (
              <div className="mb-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowDebugPanel(!showDebugPanel)}
                >
                  {showDebugPanel ? 'Hide' : 'Show'} Storage Debug Panel
                </Button>
              </div>
            )}
            
            {/* Debug Panel */}
            {showDebugPanel && user && (
              <div className="mb-6">
                <StorageDebugPanel />
              </div>
            )}
            {error && <Alert className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>}

            {isLoading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({
              length: 6
            }).map((_, i) => <Card key={i} className="overflow-hidden">
                    <CardContent className="p-0">
                      <Skeleton className="h-48 w-full" />
                      <div className="p-4 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </CardContent>
                  </Card>)}
              </div> : filteredCodes.length === 0 ? <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-6 mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No SREF codes found</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  {searchQuery || selectedTags.length > 0 ? "Try adjusting your search or filters to find what you're looking for." : "Get started by adding your first SREF code to organize your style references."}
                </p>
                <Button onClick={handleAddNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add SREF Code
                </Button>
              </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCodes.map(code => <motion.div key={code.id} initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.3
            }}>
                    <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group" onClick={() => handleCardClick((code as any).code_value || (code as any).code)} style={{
                paddingTop: "0px",
                paddingBottom: "0px"
              }}>
                      <CardContent className="p-0">
                        {/* Images */}
                        <div className="grid grid-cols-3 gap-0">
                          {(code.images || []).map((image, index) => <figure key={index} className="aspect-square overflow-hidden">
                              <img src={typeof image === 'string' ? image : image.image_url} alt={`${code.title} reference ${index + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" onError={e => {
                        const target = e.currentTarget;
                        target.onerror = null;
                        target.src = 'data:image/svg+xml;utf8,<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg"><rect fill="%23f3f3f3" width="100%" height="100%"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="20" fill="%23999">Image unavailable</text></svg>';
                      }} />
                            </figure>)}
                        </div>

                        {/* Card Content */}
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">
                              {code.title}
                            </h3>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {(code as any).version || `SV${(code as any).sv_version}`}
                              </Badge>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => {
                                  e.stopPropagation();
                                  handleCardEdit(code.id);
                                }}>
                                  <span className="sr-only">Edit</span>
                                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                  </svg>
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => {
                                  e.stopPropagation();
                                  if (user) {
                                    handleCardDelete(code.id);
                                  }
                                }}>
                                  <span className="sr-only">Delete</span>
                                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                </Button>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground font-mono">
                            {(code as any).code_value || (code as any).code}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(code.tags || []).slice(0, 3).map(tag => <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>)}
                            {(code.tags || []).length > 3 && <Badge variant="secondary" className="text-xs">
                                +{(code.tags || []).length - 3}
                              </Badge>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>)}
              </div>}
          </div>
        </main>

        <Toaster />
        
        <SREFEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          editingCode={editingCode}
          onSuccess={handleEditSuccess}
        />
      </div>
    </TooltipProvider>;
}