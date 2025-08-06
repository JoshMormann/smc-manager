'use client';

import * as React from 'react';
import { useState, useMemo, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Library,
  Heart,
  Settings,
  Package,
  Compass,
  Search,
  Tag,
  Plus,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { useSREFCodes } from '@/hooks/useSREFCodes';
import { useTags } from '@/hooks/useTags';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import StorageDebugPanel from '@/components/debug/StorageDebugPanel';
import { SREFCode as DatabaseSREFCode } from '@/lib/database';
import SREFCardGrid from '@/components/sref/SREFCardGrid';

// Lazy load the edit modal since it's only used when editing
const SREFEditModal = lazy(() => import('@/components/sref/SREFEditModal'));

// Types - Union type to handle both database and UI representations
export type SREFCode =
  | DatabaseSREFCode
  | {
      id: string;
      title: string;
      code: string;
      code_value?: string;
      version: 'SV4' | 'SV6';
      sv_version?: number;
      images: Array<{ id: string; image_url: string; position: number }>;
      tags: string[];
      createdAt: Date;
    };
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
const defaultSREFCodes: SREFCode[] = [
  {
    id: '1',
    title: "90's comic book",
    code: '--sref 1234567890',
    version: 'SV6',
    images: [
      {
        id: '1',
        image_url:
          'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop',
        position: 0,
      },
      {
        id: '2',
        image_url:
          'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop',
        position: 1,
      },
      {
        id: '3',
        image_url:
          'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop',
        position: 2,
      },
    ],
    tags: ['comic', 'retro', 'colorful'],
    createdAt: new Date(),
  },
  {
    id: '2',
    title: 'Cyberpunk neon',
    code: '--sref 9876543210',
    version: 'SV4',
    images: [
      {
        id: '4',
        image_url:
          'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=200&fit=crop',
        position: 0,
      },
      {
        id: '5',
        image_url:
          'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=200&fit=crop',
        position: 1,
      },
      {
        id: '6',
        image_url:
          'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=200&fit=crop',
        position: 2,
      },
    ],
    tags: ['cyberpunk', 'neon', 'futuristic'],
    createdAt: new Date(),
  },
  {
    id: '3',
    title: 'Vintage photography',
    code: '--sref 5555555555',
    version: 'SV6',
    images: [
      {
        id: '7',
        image_url:
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop',
        position: 0,
      },
      {
        id: '8',
        image_url:
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop',
        position: 1,
      },
      {
        id: '9',
        image_url:
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop',
        position: 2,
      },
    ],
    tags: ['vintage', 'photography', 'sepia'],
    createdAt: new Date(),
  },
];
const defaultTags = [
  'comic',
  'retro',
  'colorful',
  'cyberpunk',
  'neon',
  'futuristic',
  'vintage',
  'photography',
  'sepia',
];
const defaultFolders: FolderItem[] = [
  {
    id: '1',
    name: 'My Collections',
    isExpanded: true,
    children: [
      {
        id: '1-1',
        name: 'Favorites',
        isExpanded: false,
      },
      {
        id: '1-2',
        name: 'Work Projects',
        isExpanded: false,
      },
    ],
  },
  {
    id: '2',
    name: 'Shared',
    isExpanded: false,
    children: [
      {
        id: '2-1',
        name: 'Team Assets',
        isExpanded: false,
      },
    ],
  },
];
export default function SREFManagementDashboard({
  initialCodes = defaultSREFCodes,
  initialTags = defaultTags,
  initialFolders: _initialFolders = defaultFolders,
}: SREFManagementDashboardProps) {
  // Authentication
  const { user, signOut } = useAuth();
  const { profile: _profile } = useUserProfile(user);

  // Real data hooks
  const {
    srefCodes: realSrefCodes,
    loading: srefLoading,
    error: srefError,
    searchSREFCodes: _searchSREFCodes,
    deleteSREFCode,
    refreshSREFCodes,
  } = useSREFCodes();

  const { tags: realTags, loading: _tagsLoading, refreshTags } = useTags();

  // State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  type EditingCodeType = {
    id: string;
    title: string;
    code_value: string;
    version: 'SV4' | 'SV6';
    tags: string[];
    images?: string[];
  };

  const [editingCode, setEditingCode] = useState<EditingCodeType | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Use real data when user is authenticated, fallback to mock data
  const srefCodes = user ? realSrefCodes : initialCodes;
  const availableTags = user ? realTags : initialTags;
  const isLoading = user ? srefLoading : false;
  const error = user ? srefError : null;

  // Filtered codes based on search and tags
  const filteredCodes = useMemo(() => {
    return srefCodes.filter(code => {
      const codeValue = code.code_value || '';
      const matchesSearch =
        code.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        codeValue.toLowerCase().includes(searchQuery.toLowerCase());
      const codeTags = code.tags || [];
      const matchesTags =
        selectedTags.length === 0 || selectedTags.some(tag => codeTags.includes(tag));
      return matchesSearch && matchesTags;
    });
  }, [srefCodes, searchQuery, selectedTags]);

  // Handle tag toggle
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]));
  };

  // Handle card click - copy is now handled by the card component itself
  const handleCardClick = (code: string) => {
    // No clipboard operation needed here - SREFCard handles the complete copy
    // This function is kept for potential future use
  };

  // Handle card edit
  const handleCardEdit = (id: string) => {
    const code = srefCodes.find(c => c.id === id);
    if (code) {
      setEditingCode({
        id: code.id,
        title: code.title,
        code_value: code.code_value || '',
        version: code.sv_version === 6 ? 'SV6' : 'SV4',
        tags: code.tags || [],
        images: code.images?.map(img => (typeof img === 'string' ? img : img.image_url)) || [],
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
    // Refresh both SREF codes and tags to update the tag cloud
    refreshSREFCodes();
    refreshTags();
  };

  // Handle card delete
  const handleCardDelete = async (id: string) => {
    if (!user) return;

    try {
      const result = await deleteSREFCode(id);
      if (result.success) {
        toast.success('SREF code deleted', {
          duration: 2000,
          position: 'bottom-right',
        });
      } else {
        toast.error(result.error || 'Failed to delete SREF code', {
          duration: 3000,
          position: 'bottom-right',
        });
      }
    } catch (_error) {
      toast.error('An unexpected error occurred', {
        duration: 3000,
        position: 'bottom-right',
      });
    }
  };

  // Sidebar navigation items
  const navigationItems: NavigationItem[] = [
    {
      id: 'library',
      label: 'Library',
      icon: Library,
      active: activeTab === 'library',
    },
    {
      id: 'discover',
      label: 'Discover',
      icon: Compass,
      active: activeTab === 'discover',
    },
    {
      id: 'favorites',
      label: 'Favorites',
      icon: Heart,
      active: activeTab === 'favorites',
    },
    {
      id: 'packs',
      label: 'Packs',
      icon: Package,
      active: activeTab === 'packs',
    },
  ];

  // Account settings items (shown at bottom of sidebar)
  const accountItems: NavigationItem[] = [
    {
      id: 'settings',
      label: 'Account Settings',
      icon: Settings,
      active: activeTab === 'settings',
    },
  ];

  return (
    <TooltipProvider>
      <div className="flex min-h-screen bg-background text-foreground">
        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{
            width: sidebarCollapsed ? 60 : 240,
            transition: {
              duration: 0.3,
              ease: 'easeInOut',
            },
          }}
          className="bg-sidebar border-r border-sidebar-border flex flex-col"
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <h1 className="text-lg font-semibold text-sidebar-foreground">SREF Manager</h1>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-sidebar-foreground hover:bg-sidebar-accent"
              >
                {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 p-2">
            <nav className="space-y-1">
              {navigationItems.map(item => (
                <Tooltip key={item.id} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActiveTab(item.id)}
                      className={cn(
                        'flex items-center gap-3 w-full p-3 text-sm rounded-md transition-colors',
                        item.active
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      )}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </button>
                  </TooltipTrigger>
                  {sidebarCollapsed && (
                    <TooltipContent side="right">
                      <p>{item.label}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              ))}
            </nav>
          </ScrollArea>

          {/* Account Settings at Bottom */}
          <div className="p-2 border-t border-sidebar-border">
            {accountItems.map(item => (
              <Tooltip key={item.id} delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      'flex items-center gap-3 w-full p-3 text-sm rounded-md transition-colors',
                      item.active
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    )}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </button>
                </TooltipTrigger>
                {sidebarCollapsed && (
                  <TooltipContent side="right">
                    <p>{item.label}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </div>
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
                  <Input
                    placeholder="Search SREF codes..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10 bg-card border-input focus:ring-2 focus:ring-ring"
                  />
                </div>
                {/* Action Buttons */}
                {user && activeTab === 'library' && (
                  <div className="flex items-center gap-4 ml-4">
                    <Button
                      onClick={handleAddNew}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add SREF Code
                    </Button>
                  </div>
                )}
              </div>

              {/* Tag Cloud Filter */}
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? 'default' : 'secondary'}
                    className={cn(
                      'cursor-pointer transition-colors hover:bg-primary/80',
                      selectedTags.includes(tag) && 'bg-primary text-primary-foreground'
                    )}
                    onClick={() => toggleTag(tag)}
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
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
            {error && (
              <Alert className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Render content based on active tab */}
            {activeTab === 'library' && (
              <SREFCardGrid
                codes={filteredCodes}
                isLoading={isLoading}
                error={error}
                variant="library"
                showEmptyCard={user !== null}
                onCardClick={handleCardClick}
                onCardEdit={handleCardEdit}
                onCardDelete={handleCardDelete}
                onCreateNew={handleAddNew}
              />
            )}

            {activeTab === 'discover' && (
              <div className="p-6">
                <div className="text-center py-12">
                  <Compass className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Discover Community Codes</h3>
                  <p className="text-muted-foreground">
                    Browse and discover SREF codes shared by the community. Coming soon!
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'favorites' && (
              <div className="p-6">
                <div className="text-center py-12">
                  <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Your Favorites</h3>
                  <p className="text-muted-foreground">
                    Community SREF codes you've liked will appear here. Coming soon!
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'packs' && (
              <div className="p-6">
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">SREF Packs</h3>
                  <p className="text-muted-foreground">
                    Curated collections of SREF codes will be available here. Coming soon!
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="p-6">
                <div className="text-center py-12">
                  <Settings className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Account Settings</h3>
                  <p className="text-muted-foreground mb-4">
                    Manage your profile, subscription, and account preferences.
                  </p>
                  {user && (
                    <div className="space-y-4 max-w-md mx-auto">
                      <div className="text-sm text-muted-foreground">
                        Signed in as: {user.email}
                      </div>
                      <Button
                        variant="outline"
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
              </div>
            )}
          </div>
        </main>

        <Toaster />

        {isEditModalOpen && (
          <Suspense fallback={null}>
            <SREFEditModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              editingCode={editingCode || undefined}
              onSuccess={handleEditSuccess}
            />
          </Suspense>
        )}
      </div>
    </TooltipProvider>
  );
}
