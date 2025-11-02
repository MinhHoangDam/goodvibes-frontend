import React, { useState, useEffect, useRef } from 'react';
import { WellnessIcon, RefreshIcon, PlayIcon, NewCommentIcon, ArrowLeftIcon, ArrowRightIcon, SparklesIcon, LightbulbIcon, StarIcon, GiftIcon, HappinessIcon, ThumbsUpIcon, RocketIcon, CollapseRightIcon, ApplauseIcon } from '@hopper-ui/icons';
import { Avatar, useColorSchemeContext } from '@hopper-ui/components';
import { GoodVibe, GoodVibesResponse } from './types';
import './CarouselAnimations.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

interface GoodVibesCarouselProps {
  onVibeChange?: (date: Date) => void;
  showLeaderboard?: boolean;
  onToggleLeaderboard?: () => void;
  onControlsChange?: (show: boolean) => void;
}

const GoodVibesCarousel: React.FC<GoodVibesCarouselProps> = ({ onVibeChange, showLeaderboard, onToggleLeaderboard, onControlsChange }) => {
  const [vibes, setVibes] = useState<GoodVibe[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [autoPlay, setAutoPlay] = useState<boolean>(false);
  const [loadingReplies, setLoadingReplies] = useState<boolean>(false);
  const [replyStartIndex, setReplyStartIndex] = useState<number>(0); // Track which set of replies to show
  const [hasCompletedReplyCycle, setHasCompletedReplyCycle] = useState<boolean>(false); // Track if we've shown all replies
  const [showControls, setShowControls] = useState<boolean>(false); // Track if controls should be visible
  const [mouseInactivityTimer, setMouseInactivityTimer] = useState<NodeJS.Timeout | null>(null);
  const [autoPlayProgress, setAutoPlayProgress] = useState<number>(0); // Track auto-play progress (0-100%)
  const messageRef = useRef<HTMLParagraphElement>(null); // Ref for auto-scrolling message
  const [backgroundLoadingStatus, setBackgroundLoadingStatus] = useState<string | null>(null); // Track background loading progress

  // Theme management
  const { colorScheme, setColorScheme } = useColorSchemeContext();
  
  const autoPlayInterval = 11000; // 11 seconds
  const maxVisibleReplies = 2; // Show only 2 replies at a time
  const controlsHideDelay = 7000; // 7 seconds

  // Playful color options from Hopper
  const decorativeColors = [
    'decorative-option1', // Purple/Pink
    'decorative-option2', // Blue
    'decorative-option3', // Teal
    'decorative-option5', // Orange
    'decorative-option6', // Green
    'decorative-option7', // Yellow
  ];

  // Get a consistent color for each vibe based on its index
  const getVibeColor = (index: number) => {
    return decorativeColors[index % decorativeColors.length];
  };

  // Get a varied icon for the prompt badge based on content or index
  const getPromptIcon = (vibe: GoodVibe, index: number) => {
    const prompt = vibe.prompt || (vibe.cardPrompt?.[0]?.text || '');
    const message = vibe.message?.toLowerCase() || '';
    const combinedText = (prompt + ' ' + message).toLowerCase();
    
    // Icon keywords mapping
    if (combinedText.includes('thank') || combinedText.includes('appreciate') || combinedText.includes('grateful')) {
      return ThumbsUpIcon;
    }
    if (combinedText.includes('celebrate') || combinedText.includes('congrat') || combinedText.includes('achievement') || combinedText.includes('success')) {
      return StarIcon;
    }
    if (combinedText.includes('gift') || combinedText.includes('present') || combinedText.includes('surprise')) {
      return GiftIcon;
    }
    if (combinedText.includes('happy') || combinedText.includes('joy') || combinedText.includes('smile') || combinedText.includes('fun')) {
      return HappinessIcon;
    }
    if (combinedText.includes('idea') || combinedText.includes('insight') || combinedText.includes('innovation') || combinedText.includes('creative')) {
      return LightbulbIcon;
    }
    if (combinedText.includes('launch') || combinedText.includes('start') || combinedText.includes('new') || combinedText.includes('begin')) {
      return RocketIcon;
    }
    if (combinedText.includes('special') || combinedText.includes('amazing') || combinedText.includes('awesome') || combinedText.includes('outstanding')) {
      return SparklesIcon;
    }
    
    // Fallback to cycling through icons based on index
    const iconCycle = [WellnessIcon, StarIcon, HappinessIcon, ThumbsUpIcon, LightbulbIcon, GiftIcon, RocketIcon, SparklesIcon];
    return iconCycle[index % iconCycle.length];
  };

  useEffect(() => {
    fetchGoodVibes();
  }, []);

  // Notify parent when current vibe changes
  useEffect(() => {
    if (vibes.length > 0 && onVibeChange) {
      const currentVibe = vibes[currentIndex];
      if (currentVibe && currentVibe.creationDate) {
        onVibeChange(new Date(currentVibe.creationDate));
      }
    }
  }, [currentIndex, vibes, onVibeChange]);

  // Notify parent when controls visibility changes
  useEffect(() => {
    if (onControlsChange) {
      onControlsChange(showControls);
    }
  }, [showControls, onControlsChange]);

  // Auto-refresh Good Vibes every hour
  useEffect(() => {
    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
    const refreshTimer = setInterval(() => {
      console.log('Auto-refreshing Good Vibes...');
      fetchGoodVibes();
    }, oneHour);

    return () => clearInterval(refreshTimer);
  }, []);

  // Mouse activity tracking for control visibility
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      
      // Clear existing timer
      if (mouseInactivityTimer) {
        clearTimeout(mouseInactivityTimer);
      }
      
      // Set new timer to hide controls after delay
      const newTimer = setTimeout(() => {
        setShowControls(false);
      }, controlsHideDelay);
      
      setMouseInactivityTimer(newTimer);
    };

    const handleMouseLeave = () => {
      // Hide controls immediately when mouse leaves the container
      setShowControls(false);
      if (mouseInactivityTimer) {
        clearTimeout(mouseInactivityTimer);
        setMouseInactivityTimer(null);
      }
    };

    // Add event listeners to document for mouse movement
    document.addEventListener('mousemove', handleMouseMove);
    
    // Cleanup function
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (mouseInactivityTimer) {
        clearTimeout(mouseInactivityTimer);
      }
    };
  }, [mouseInactivityTimer, controlsHideDelay]);

  useEffect(() => {
    if (autoPlay && vibes.length > 1) {
      const timer = setInterval(() => {
        const currentVibe = vibes[currentIndex];

        // If current vibe has more than maxVisibleReplies, wait for completion flag
        if (currentVibe?.replies && currentVibe.replies.length > maxVisibleReplies) {
          // Move to next vibe immediately when reply cycle is complete
          if (hasCompletedReplyCycle) {
            setCurrentIndex((prev) => (prev + 1) % vibes.length);
            setHasCompletedReplyCycle(false); // Reset for next vibe
            setReplyStartIndex(0); // Reset reply index for next vibe
            setAutoPlayProgress(0); // Reset progress
          }
        } else {
          // No replies or replies <= 2, proceed normally with regular timing
          setCurrentIndex((prev) => (prev + 1) % vibes.length);
          setReplyStartIndex(0); // Reset reply index for next vibe
          setAutoPlayProgress(0); // Reset progress
        }
      }, autoPlayInterval);
      return () => clearInterval(timer);
    }
  }, [autoPlay, vibes.length, currentIndex, hasCompletedReplyCycle]);

  // Update auto-play progress animation
  useEffect(() => {
    if (autoPlay && vibes.length > 1) {
      setAutoPlayProgress(0); // Reset progress when starting
      const startTime = Date.now();
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / autoPlayInterval) * 100, 100);
        setAutoPlayProgress(progress);
      }, 50); // Update every 50ms for smooth animation

      return () => clearInterval(progressInterval);
    } else {
      setAutoPlayProgress(0);
    }
  }, [autoPlay, currentIndex, vibes.length]);

  useEffect(() => {
    // Auto-fetch replies when viewing a Good Vibe that has replies but they haven't been loaded yet
    if (vibes.length > 0 && vibes[currentIndex].replyCount > 0 && !vibes[currentIndex].replies) {
      console.log(`[Reply Fetch] Fetching replies for vibe ${vibes[currentIndex].goodVibeId} (replies not cached)`);
      fetchRepliesForVibe(vibes[currentIndex].goodVibeId);
    } else if (vibes.length > 0 && vibes[currentIndex].replyCount > 0 && vibes[currentIndex].replies) {
      console.log(`[Reply Cache] Using cached replies for vibe ${vibes[currentIndex].goodVibeId} (${vibes[currentIndex].replies?.length || 0} replies)`);
    }
  }, [currentIndex, vibes]);

  // Auto-scroll message content if it overflows
  useEffect(() => {
    // Wait for DOM to update and animations to settle
    const initTimeout = setTimeout(() => {
      const messageElement = messageRef.current;
      if (!messageElement) return;

      // Reset scroll position
      messageElement.scrollTop = 0;

      // Check if content overflows
      const hasOverflow = messageElement.scrollHeight > messageElement.clientHeight;
      if (!hasOverflow) return;

      let scrollInterval: NodeJS.Timeout;
      let pauseTimeout: NodeJS.Timeout;

      const startScrolling = () => {
        // Wait 2 seconds before starting to scroll
        pauseTimeout = setTimeout(() => {
          scrollInterval = setInterval(() => {
            const element = messageRef.current;
            if (!element) return;

            // Scroll down
            element.scrollTop += 1;

            // Check if reached bottom
            if (element.scrollTop + element.clientHeight >= element.scrollHeight - 5) {
              // Pause at bottom for 2 seconds, then scroll back to top
              clearInterval(scrollInterval);
              setTimeout(() => {
                const el = messageRef.current;
                if (el) {
                  el.scrollTo({ top: 0, behavior: 'smooth' });
                  // Wait for scroll to complete, then start scrolling down again
                  setTimeout(startScrolling, 2000);
                }
              }, 2000);
            }
          }, 50); // Scroll speed - lower number = faster
        }, 2000); // Initial pause at top
      };

      startScrolling();

      // Cleanup function
      return () => {
        clearInterval(scrollInterval);
        clearTimeout(pauseTimeout);
      };
    }, 500); // Wait 500ms for animations to complete

    // Cleanup
    return () => {
      clearTimeout(initTimeout);
    };
  }, [currentIndex]);

  // Determine avatar size based on screen dimensions
  const getAvatarSize = (): string => {
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const minDimension = Math.min(screenWidth, screenHeight);

    // For very large displays (100"+ typically 3840x2160 or higher)
    if (minDimension >= 2160) {
      return '256x256'; // 4K+ displays
    }
    // For large displays (60-90" typically 1920x1080 or 2560x1440)
    if (minDimension >= 1440) {
      return '128x128'; // Large HD/2K displays
    }
    // For medium displays (40-50")
    if (minDimension >= 1080) {
      return '64x64'; // Full HD displays
    }
    // For smaller displays (laptops, smaller monitors)
    return '32x32'; // Standard displays
  };

  const fetchGoodVibes = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Determine avatar size based on screen
      const avatarSize = getAvatarSize();
      console.log(`📐 Screen size: ${window.screen.width}x${window.screen.height}, using avatar size: ${avatarSize}`);

      // Progressive loading strategy: First load recent 30 days for fast initial display
      // Include avatars for the initial batch (small enough to be fast, ~1-2 seconds)
      const recentUrl = `${API_BASE_URL}/api/good-vibes/cached?daysBack=30&avatarSize=${avatarSize}`;

      console.log(`🔄 Fetching recent vibes (30 days with avatars): ${recentUrl}`);

      const recentResponse = await fetch(recentUrl);

      if (!recentResponse.ok) {
        throw new Error(`Failed to fetch: ${recentResponse.status} ${recentResponse.statusText}`);
      }

      const recentData: GoodVibesResponse = await recentResponse.json();

      // Check if cache is ready
      if (recentData.metadata && 'cacheReady' in recentData.metadata && !recentData.metadata.cacheReady) {
        console.log('⏳ Cache is still loading, will retry in 2 seconds...');
        // Cache not ready yet, retry after a short delay
        setTimeout(() => {
          fetchGoodVibes();
        }, 2000);
        return;
      }

      const recentVibes = recentData.data || [];

      console.log('✅ Loaded recent vibes:', {
        recentVibes: recentVibes.length,
        totalInCache: recentData.metadata?.totalCount,
        cacheReady: recentData.metadata?.cacheReady
      });

      if (recentVibes.length === 0) {
        setError('No Good Vibes found');
      } else {
        // Display recent vibes immediately
        setVibes(recentVibes);
        setCurrentIndex(0);
        setLoading(false);

        // Load older vibes month by month in the background if there are more
        if (recentData.metadata?.totalCount && recentData.metadata.totalCount > recentVibes.length) {
          console.log('🔄 Loading older vibes month by month in background...');

          // Load additional months incrementally (30-60 days, 60-90 days, etc.)
          const loadNextMonth = async (monthOffset: number) => {
            try {
              const startDay = 30 + (monthOffset * 30);
              const endDay = startDay + 30;

              // Use monthsBack for older data (converts to appropriate month count)
              // Include avatars for each month batch (incremental enrichment)
              const monthsToFetch = Math.ceil(endDay / 30);
              const monthUrl = `${API_BASE_URL}/api/good-vibes/cached?monthsBack=${monthsToFetch}&avatarSize=${avatarSize}`;

              // Update status for user
              setBackgroundLoadingStatus(`Loading older vibes (${startDay}-${endDay} days ago)...`);
              console.log(`📥 Loading month ${monthOffset + 1} (days ${startDay}-${endDay} with avatars)...`);
              const monthResponse = await fetch(monthUrl);

              if (monthResponse.ok) {
                const monthData: GoodVibesResponse = await monthResponse.json();
                const monthVibes = monthData.data || [];

                console.log(`✅ Loaded month ${monthOffset + 1}:`, {
                  vibes: monthVibes.length,
                  totalInCache: monthData.metadata?.totalCount
                });

                // Update vibes with merged data, preserving current index
                setVibes(prevVibes => {
                  // Merge new data with existing, avoiding duplicates
                  const existingIds = new Set(prevVibes.map(v => v.goodVibeId));
                  const newVibes = monthVibes.filter(v => !existingIds.has(v.goodVibeId));

                  // Keep current vibe reference to maintain position
                  const currentVibe = prevVibes[currentIndex];
                  const mergedVibes = [...prevVibes, ...newVibes].sort((a, b) =>
                    new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()
                  );

                  // Update current index to maintain same vibe
                  const newIndex = mergedVibes.findIndex(v => v.goodVibeId === currentVibe?.goodVibeId);
                  if (newIndex >= 0 && newIndex !== currentIndex) {
                    setCurrentIndex(newIndex);
                  }

                  return mergedVibes;
                });

                // Check if there are more vibes to load
                if (monthData.metadata?.totalCount && monthVibes.length < monthData.metadata.totalCount) {
                  // Load next month after a short delay
                  setTimeout(() => loadNextMonth(monthOffset + 1), 2000);
                } else {
                  console.log('✅ All vibes loaded with avatars!');
                  setBackgroundLoadingStatus(null); // Clear loading status
                  // All data loaded incrementally with avatars already included
                }
              }
            } catch (err) {
              console.warn(`Failed to load month ${monthOffset + 1} in background:`, err);
              setBackgroundLoadingStatus(null); // Clear loading status on error
              // Don't show error to user since recent vibes are already loaded
              // Stop loading further months on error
            }
          };

          // Start loading month 2 (days 30-60) after a short delay
          setTimeout(() => loadNextMonth(1), 1000);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const fetchRepliesForVibe = async (goodVibeId: string): Promise<void> => {
    setLoadingReplies(true);
    const startTime = performance.now();

    try {
      const response = await fetch(`${API_BASE_URL}/api/good-vibes/${goodVibeId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch replies: ${response.status} ${response.statusText}`);
      }

      const vibeWithReplies: GoodVibe = await response.json();
      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(0);

      console.log(`[Reply Fetch] Completed in ${duration}ms - fetched ${vibeWithReplies.replies?.length || 0} replies for ${goodVibeId}`);

      // Update the specific vibe in the array with the replies
      setVibes(prevVibes =>
        prevVibes.map(vibe =>
          vibe.goodVibeId === goodVibeId ? { ...vibe, replies: vibeWithReplies.replies } : vibe
        )
      );
    } catch (err) {
      console.error('Failed to fetch replies:', err);
    } finally {
      setLoadingReplies(false);
    }
  };

  const nextVibe = (): void => {
    setCurrentIndex((prev) => (prev + 1) % vibes.length);
    setReplyStartIndex(0); // Reset reply pagination when changing vibes
    setHasCompletedReplyCycle(false); // Reset completion flag
  };

  const prevVibe = (): void => {
    setCurrentIndex((prev) => (prev - 1 + vibes.length) % vibes.length);
    setReplyStartIndex(0); // Reset reply pagination when changing vibes
    setHasCompletedReplyCycle(false); // Reset completion flag
  };

  // Auto-rotation effect for replies when there are more than maxVisibleReplies
  useEffect(() => {
    const currentVibe = vibes[currentIndex];
    if (!currentVibe?.replies || currentVibe.replies.length <= maxVisibleReplies || hasCompletedReplyCycle) {
      return; // Stop rotation if cycle is complete
    }

    const replyRotationInterval = 4000; // 4 seconds
    const interval = setInterval(() => {
      setReplyStartIndex((prev) => {
        const totalReplies = currentVibe.replies?.length || 0;
        const nextIndex = prev + 1;
        
        // Calculate how many unique starting positions we have
        const maxStartIndex = totalReplies - maxVisibleReplies;
        
        // If we've reached the maximum start index, complete the cycle WITHOUT going back to 0
        if (prev >= maxStartIndex) {
          setHasCompletedReplyCycle(true); // Mark that we've completed a full cycle
          return prev; // Stay at current position instead of going back to 0
        }
        
        return nextIndex;
      });
    }, replyRotationInterval);

    return () => clearInterval(interval);
  }, [currentIndex, vibes[currentIndex]?.replies?.length, vibes[currentIndex]?.goodVibeId, hasCompletedReplyCycle]);

  const toggleAutoPlay = (): void => {
    console.log('🎮 Auto-play toggled:', !autoPlay);
    setAutoPlay(!autoPlay);
  };

  const toggleTheme = (): void => {
    setColorScheme(colorScheme === 'light' ? 'dark' : 'light');
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    });
  };

  return (
    <>
      <style>
        {`
          .reply-container {
            overflow: hidden;
            position: relative;
          }
          
          .reply-item {
            transition: all 0.3s ease;
          }
          
          /* Simple slide up animation for new replies */
          @keyframes slideUp {
            from { 
              transform: translateY(20px);
              opacity: 0;
            }
            to { 
              transform: translateY(0);
              opacity: 1;
            }
          }
          
          .reply-entering {
            animation: slideUp 0.6s ease-out;
          }
          
          /* Control overlay styles */
          .controls-overlay {
            transition: opacity 0.3s ease, visibility 0.3s ease;
          }
          
          .controls-hidden {
            opacity: 0;
            visibility: hidden;
          }
          
          .controls-visible {
            opacity: 1;
            visibility: visible;
          }

          /* Hide cursor when controls are hidden */
          .cursor-hidden {
            cursor: none !important;
          }

          .cursor-hidden * {
            cursor: none !important;
          }
        `}
      </style>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'visible'
        }}>
      <div style={{ maxWidth: '56rem', width: '100%', position: 'relative', zIndex: 1 }}>
        <div className="text-center" style={{ marginBottom: 'var(--hop-space-stack-xl)', position: 'relative' }}>
          {/* Control buttons - positioned in top right */}
          <div
            className={`controls-overlay ${showControls ? 'controls-visible' : 'controls-hidden'}`}
            style={{
              position: 'absolute',
              top: '0',
              right: '0',
              display: 'flex',
              gap: 'var(--hop-space-inline-xs)'
            }}
          >
            {/* Theme toggle button */}
            <button
              onClick={toggleTheme}
              className="hover:opacity-80"
              style={{
                backgroundColor: 'var(--hop-neutral-surface)',
                border: '1px solid var(--hop-neutral-border-weak)',
                borderRadius: 'var(--hop-shape-circle)',
                padding: 'var(--hop-space-inset-sm)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                boxShadow: 'var(--hop-elevation-lifted)'
              }}
              aria-label={`Switch to ${colorScheme === 'light' ? 'dark' : 'light'} mode`}
              title={`Switch to ${colorScheme === 'light' ? 'dark' : 'light'} mode`}
            >
              <LightbulbIcon
                style={{
                  width: '1.25rem',
                  height: '1.25rem',
                  color: 'var(--hop-primary-icon)'
                }}
              />
            </button>

            {/* Leaderboard toggle button */}
            {onToggleLeaderboard && (
              <button
                onClick={onToggleLeaderboard}
                className="hover:opacity-80"
                style={{
                  backgroundColor: 'var(--hop-neutral-surface)',
                  border: '1px solid var(--hop-neutral-border-weak)',
                  borderRadius: 'var(--hop-shape-circle)',
                  padding: 'var(--hop-space-inset-sm)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: 'var(--hop-elevation-lifted)'
                }}
                aria-label={showLeaderboard ? 'Hide leaderboard' : 'Show leaderboard'}
                title={showLeaderboard ? 'Hide leaderboard' : 'Show leaderboard'}
              >
                {showLeaderboard ? (
                  <CollapseRightIcon
                    style={{
                      width: '1.25rem',
                      height: '1.25rem',
                      color: 'var(--hop-primary-icon)',
                      transform: 'rotate(180deg)'
                    }}
                  />
                ) : (
                  <ApplauseIcon
                    style={{
                      width: '1.25rem',
                      height: '1.25rem',
                      color: 'var(--hop-primary-icon)'
                    }}
                  />
                )}
              </button>
            )}
          </div>

          <h1 style={{
            fontSize: 'var(--hop-heading-xl-font-size)',
            fontWeight: 'var(--hop-heading-xl-font-weight)',
            lineHeight: 'var(--hop-heading-xl-line-height)',
            color: 'var(--hop-neutral-text)',
            gap: 'var(--hop-space-inline-md)',
            marginBottom: 'var(--hop-space-stack-md)'
          }} className="flex items-center justify-center">
            <SparklesIcon style={{ color: 'var(--hop-primary-icon)', width: '2.5rem', height: '2.5rem' }} />
            Good Vibes Glow Up
          </h1>

        </div>

        {loading && (
          <div className="text-center" style={{ padding: 'var(--hop-space-stack-xl) 0' }}>
            <div className="inline-block animate-spin rounded-full h-12 w-12" style={{ 
              borderWidth: '4px', 
              borderStyle: 'solid',
              borderColor: 'var(--hop-neutral-border-weak)',
              borderTopColor: 'var(--hop-primary-border)'
            }}></div>
            <p style={{ 
              marginTop: 'var(--hop-space-stack-lg)',
              color: 'var(--hop-neutral-text)',
              fontSize: 'var(--hop-body-md-font-size)'
            }}>Loading Good Vibes...</p>
          </div>
        )}

        {error && (
          <div style={{ 
            backgroundColor: 'var(--hop-danger-surface-weak)',
            borderColor: 'var(--hop-danger-border-weak)',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderRadius: 'var(--hop-shape-rounded-lg)',
            padding: 'var(--hop-space-inset-lg)'
          }} className="text-center">
            <p style={{ 
              color: 'var(--hop-danger-text-strong)',
              fontWeight: 'var(--hop-body-md-medium-font-weight)',
              fontSize: 'var(--hop-body-md-font-size)'
            }}>Error: {error}</p>
            <p style={{ 
              color: 'var(--hop-neutral-text)',
              fontSize: 'var(--hop-body-sm-font-size)',
              marginTop: 'var(--hop-space-stack-sm)'
            }}>Make sure the backend server is accessible at {API_BASE_URL}</p>
          </div>
        )}

        {!loading && !error && vibes.length > 0 && (
          <div className="relative vibe-card">
            <div
              key={currentIndex}
              className="vibe-card-inner vibe-enter"
              style={{
              backgroundColor: 'var(--hop-neutral-surface)',
              borderRadius: 'var(--hop-shape-rounded-lg)',
              boxShadow: 'var(--hop-elevation-lifted)',
              padding: 'var(--hop-space-inset-xl)',
              minHeight: '400px',
              borderLeft: `4px solid var(--hop-${getVibeColor(currentIndex)}-border)`,
              borderTop: '1px solid var(--hop-neutral-border-weak)',
              borderRight: '1px solid var(--hop-neutral-border-weak)',
              borderBottom: '1px solid var(--hop-neutral-border-weak)'
            }}>
              {/* Prompt badge in upper left corner - show custom prompt or default cardPrompt */}
              {(vibes[currentIndex].prompt || (vibes[currentIndex].cardPrompt && vibes[currentIndex].cardPrompt!.length > 0)) && (
                <div 
                  className="fade-in-content fade-delay-2 badge-pop"
                  style={{ 
                  position: 'absolute',
                  top: 'var(--hop-space-inset-md)',
                  left: 'var(--hop-space-inset-md)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--hop-space-inline-sm)',
                  backgroundColor: `var(--hop-${getVibeColor(currentIndex)}-surface-weak)`,
                  color: `var(--hop-${getVibeColor(currentIndex)}-text)`,
                  padding: 'var(--hop-space-inset-sm)',
                  borderRadius: 'var(--hop-shape-pill)',
                  fontSize: 'var(--hop-body-sm-font-size)',
                  fontWeight: 'var(--hop-body-sm-medium-font-weight)',
                  lineHeight: 'var(--hop-body-sm-line-height)'
                }}>
                  {(() => {
                    const IconComponent = getPromptIcon(vibes[currentIndex], currentIndex);
                    return (
                      <IconComponent style={{ 
                        width: '1rem', 
                        height: '1rem',
                        color: `var(--hop-${getVibeColor(currentIndex)}-icon)`
                      }} />
                    );
                  })()}
                  {vibes[currentIndex].prompt || (vibes[currentIndex].cardPrompt?.[0]?.text || '')}
                </div>
              )}

              {/* Reactions in upper right corner */}
              {vibes[currentIndex].reactions && vibes[currentIndex].reactions.length > 0 && (
                <div 
                  className="fade-in-content fade-delay-3"
                  style={{ 
                    position: 'absolute',
                    top: 'var(--hop-space-inset-md)',
                    right: 'var(--hop-space-inset-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--hop-space-inline-xs)'
                  }}>
                  {vibes[currentIndex].reactions.map((reaction, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center" 
                      style={{ 
                        gap: 'var(--hop-space-inline-xs)',
                        backgroundColor: 'var(--hop-neutral-surface-weak)',
                        padding: 'var(--hop-space-inset-squish-sm)',
                        borderRadius: 'var(--hop-shape-pill)',
                        fontSize: 'var(--hop-body-sm-font-size)',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease',
                        border: '1px solid var(--hop-neutral-border-weak)'
                      }}
                      title={`${reaction.count} ${reaction.count === 1 ? 'person' : 'people'} reacted with ${reaction.emoji}`}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--hop-neutral-surface)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--hop-neutral-surface-weak)';
                      }}
                    >
                      <span>{reaction.emoji}</span>
                      <span style={{ 
                        color: 'var(--hop-neutral-text)',
                        fontWeight: 'var(--hop-body-sm-medium-font-weight)'
                      }}>{reaction.count}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--hop-space-stack-xl)',
                paddingTop: (vibes[currentIndex].prompt || (vibes[currentIndex].cardPrompt && vibes[currentIndex].cardPrompt!.length > 0))
                  ? 'calc(var(--hop-space-stack-xl) + var(--hop-space-stack-lg))'
                  : '0'
              }}>
                <p
                  ref={messageRef}
                  className="fade-in-content fade-delay-1 vibe-content-unfold hide-scrollbar"
                  style={{
                    fontSize: 'var(--hop-heading-lg-font-size)',
                    fontWeight: 'var(--hop-heading-lg-font-weight)',
                    lineHeight: 'var(--hop-heading-lg-line-height)',
                    color: 'var(--hop-neutral-text)',
                    textAlign: 'center',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    maxHeight: '50vh',
                    overflowY: 'auto',
                    overflowX: 'hidden'
                  }}>
                  {vibes[currentIndex].message.trim() ? (
                    vibes[currentIndex].message
                  ) : vibes[currentIndex].cardPrompt && vibes[currentIndex].cardPrompt!.length > 0 ? (
                    <span style={{ 
                      color: 'var(--hop-neutral-text)',
                      fontStyle: 'italic'
                    }}>"{vibes[currentIndex].cardPrompt![0].text}"</span>
                  ) : vibes[currentIndex].prompt ? (
                    <span style={{ 
                      color: 'var(--hop-neutral-text)',
                      fontStyle: 'italic'
                    }}>"{vibes[currentIndex].prompt}"</span>
                  ) : (
                    <span style={{ 
                      color: 'var(--hop-neutral-text-weak)',
                      fontStyle: 'italic'
                    }}>No message - just good vibes! ✨</span>
                  )}
                </p>

                {/* Recipients above the divider */}
                {vibes[currentIndex].recipients && vibes[currentIndex].recipients.length > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--hop-space-inline-xs)',
                    flexWrap: 'wrap',
                    marginTop: 'var(--hop-space-stack-md)',
                    marginBottom: 'var(--hop-space-stack-xs)',
                    fontSize: 'var(--hop-body-sm-font-size)',
                    color: 'var(--hop-neutral-text-weak)'
                  }}>
                    <span style={{
                      fontWeight: 'var(--hop-body-sm-semibold-font-weight)',
                      fontSize: 'var(--hop-body-sm-font-size)',
                      flexShrink: 0
                    }}>To:</span>
                    {vibes[currentIndex].recipients.map((recipient, idx) => (
                      <React.Fragment key={`${recipient.userId || recipient.displayName}-${idx}`}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 'var(--hop-space-inline-xs)',
                          whiteSpace: 'nowrap'
                        }}>
                          <Avatar
                            name={recipient.displayName}
                            size="sm"
                            src={recipient.avatarUrl || undefined}
                          />
                          <span style={{
                            fontWeight: 'var(--hop-body-sm-semibold-font-weight)',
                            fontSize: 'var(--hop-body-sm-font-size)'
                          }}>
                            {recipient.displayName}
                          </span>
                        </span>
                        {idx < vibes[currentIndex].recipients.length - 1 && <span>,</span>}
                      </React.Fragment>
                    ))}
                  </div>
                )}

                {/* Sender and date info below the divider */}
                <div className="flex items-center justify-between" style={{
                  paddingTop: 'var(--hop-space-stack-sm)',
                  borderTop: '1px solid var(--hop-neutral-border-weak)',
                  fontSize: 'var(--hop-body-xs-font-size)',
                  color: 'var(--hop-neutral-text-weak)'
                }}>
                  <div className="flex items-center" style={{ gap: 'var(--hop-space-inline-xs)' }}>
                    <span style={{
                      fontSize: 'var(--hop-body-xs-font-size)'
                    }}>From:</span>
                    <Avatar
                      name={vibes[currentIndex].senderUser.displayName}
                      size="xs"
                      src={vibes[currentIndex].senderUser.avatarUrl || undefined}
                    />
                    <span style={{
                      fontSize: 'var(--hop-body-xs-font-size)'
                    }}>
                      {vibes[currentIndex].senderUser.displayName}
                    </span>
                  </div>
                  <div style={{
                    fontSize: 'var(--hop-body-xs-font-size)'
                  }}>
                    {formatDate(vibes[currentIndex].creationDate)}
                  </div>
                </div>

                {/* Replies section - moved after sender/recipient info */}
                {vibes[currentIndex].replyCount > 0 && (
                  <div style={{ 
                    marginTop: 'var(--hop-space-stack-md)'
                  }}>
                    <div className="flex items-center" style={{ 
                      gap: 'var(--hop-space-inline-sm)',
                      fontSize: 'var(--hop-body-sm-font-size)',
                      fontWeight: 'var(--hop-body-sm-semibold-font-weight)',
                      color: 'var(--hop-neutral-text)',
                      marginBottom: 'var(--hop-space-stack-md)'
                    }}>
                      <NewCommentIcon style={{ width: '1rem', height: '1rem', color: 'var(--hop-primary-icon)' }} />
                      <span>
                        {vibes[currentIndex].replyCount}{' '}
                        {vibes[currentIndex].replyCount === 1 ? 'Reply' : 'Replies'}
                      </span>
                    </div>
                    {loadingReplies && !vibes[currentIndex].replies && (
                      <div className="text-center" style={{ padding: 'var(--hop-space-stack-md) 0' }}>
                        <div className="inline-block animate-spin rounded-full h-6 w-6" style={{ 
                          borderWidth: '2px',
                          borderStyle: 'solid',
                          borderColor: 'var(--hop-neutral-border-weak)',
                          borderTopColor: 'var(--hop-primary-border)'
                        }}></div>
                        <p style={{ 
                          marginTop: 'var(--hop-space-stack-sm)',
                          color: 'var(--hop-neutral-text-weak)',
                          fontSize: 'var(--hop-body-sm-font-size)'
                        }}>Loading replies...</p>
                      </div>
                    )}
                    {vibes[currentIndex].replies && vibes[currentIndex].replies!.length > 0 && (() => {
                      const currentVibe = vibes[currentIndex];
                      const allReplies = currentVibe.replies!;
                      const totalReplies = allReplies.length;
                      const visibleReplies = allReplies.slice(replyStartIndex, replyStartIndex + maxVisibleReplies);
                      const hasMoreThanMaxVisible = totalReplies > maxVisibleReplies;
                      const currentPage = Math.floor(replyStartIndex / maxVisibleReplies) + 1;
                      const totalPages = Math.ceil(totalReplies / maxVisibleReplies);

                      return (
                        <div>

                          {/* Visible replies */}
                          <div className="reply-container" style={{ 
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--hop-space-stack-sm)'
                          }}>
                            {visibleReplies.map((reply, idx) => (
                              <div 
                                key={`${replyStartIndex + idx}-${reply.authorUser.userId}-${reply.replyDate}`}
                                className="reply-item reply-entering"
                                style={{ 
                                  backgroundColor: colorScheme === 'light' 
                                    ? `var(--hop-${getVibeColor(currentIndex)}-surface-weakest)`
                                    : 'var(--hop-neutral-surface-weak)',
                                  borderRadius: 'var(--hop-shape-rounded-lg)',
                                  padding: 'var(--hop-space-inset-md)',
                                  borderLeft: `3px solid var(--hop-${getVibeColor(currentIndex)}-border)`,
                                  border: '1px solid var(--hop-neutral-border-weak)'
                                }}
                              >
                                <p style={{ 
                                  fontSize: 'var(--hop-body-sm-font-size)',
                                  lineHeight: 'var(--hop-body-sm-line-height)',
                                  color: 'var(--hop-neutral-text)',
                                  marginBottom: 'var(--hop-space-stack-sm)'
                                }}>{reply.message}</p>
                                <div className="flex items-center justify-between" style={{
                                  fontSize: 'var(--hop-body-xs-font-size)',
                                  color: 'var(--hop-neutral-text)'
                                }}>
                                  <div className="flex items-center" style={{ gap: 'var(--hop-space-inline-xs)' }}>
                                    <Avatar
                                      name={reply.authorUser.displayName}
                                      size="xs"
                                      src={reply.authorUser.avatarUrl || undefined}
                                    />
                                    <span style={{ fontWeight: 'var(--hop-body-xs-semibold-font-weight)' }}>{reply.authorUser.displayName}</span>
                                  </div>
                                  <span style={{ color: 'var(--hop-neutral-text-weak)' }}>{formatDate(reply.replyDate)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            {vibes.length > 1 && (
              <div 
                className={`controls-overlay ${showControls ? 'controls-visible' : 'controls-hidden'} flex justify-center items-center`}
                style={{ 
                  gap: 'var(--hop-space-inline-lg)',
                  marginTop: 'var(--hop-space-stack-xl)'
                }}
              >
                {/* Refresh button on the left */}
                <button
                  onClick={fetchGoodVibes}
                  style={{ 
                    color: 'var(--hop-primary-text)',
                    gap: 'var(--hop-space-inline-xs)',
                    fontWeight: 'var(--hop-body-sm-medium-font-weight)',
                    fontSize: 'var(--hop-body-sm-font-size)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  className="flex items-center transition-colors hover:opacity-80"
                  aria-label="Refresh Good Vibes"
                >
                  <RefreshIcon style={{ width: '1rem', height: '1rem' }} />
                  Refresh
                </button>

                <div className="flex items-center" style={{ gap: 'var(--hop-space-inline-md)' }}>
                  <button
                    onClick={prevVibe}
                    style={{ 
                      backgroundColor: 'var(--hop-neutral-surface)',
                      padding: 'var(--hop-space-inset-md)',
                      borderRadius: 'var(--hop-shape-circle)',
                      boxShadow: 'var(--hop-elevation-lifted)',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: 'var(--hop-neutral-border-weak)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    className="hover:opacity-80"
                    aria-label="Previous vibe"
                  >
                    <ArrowLeftIcon style={{ width: '1.5rem', height: '1.5rem', color: 'var(--hop-primary-icon)' }} />
                  </button>
                  <button
                    onClick={nextVibe}
                    style={{ 
                      backgroundColor: 'var(--hop-neutral-surface)',
                      padding: 'var(--hop-space-inset-md)',
                      borderRadius: 'var(--hop-shape-circle)',
                      boxShadow: 'var(--hop-elevation-lifted)',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: 'var(--hop-neutral-border-weak)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    className="hover:opacity-80"
                    aria-label="Next vibe"
                  >
                    <ArrowRightIcon style={{ width: '1.5rem', height: '1.5rem', color: 'var(--hop-primary-icon)' }} />
                  </button>
                </div>

                {/* Auto-play button on the right */}
                <button
                  onClick={(e) => {
                    toggleAutoPlay();
                    // Trigger mouse move to reset the hide timer
                    e.currentTarget.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
                  }}
                  onMouseEnter={(e) => {
                    // Reset hide timer on hover
                    e.currentTarget.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
                  }}
                  style={{ 
                    color: autoPlay ? 'var(--hop-success-text-strong)' : 'var(--hop-primary-text)',
                    gap: 'var(--hop-space-inline-xs)',
                    fontWeight: 'var(--hop-body-sm-medium-font-weight)',
                    fontSize: 'var(--hop-body-sm-font-size)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  className="flex items-center transition-colors hover:opacity-80"
                  aria-label={autoPlay ? 'Pause auto-play' : 'Start auto-play'}
                >
                  {autoPlay ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      style={{ width: '1rem', height: '1rem' }}
                    >
                      {/* Left bar with fill animation */}
                      <rect x="3" y="2" width="4" height="12" rx="1" fill="currentColor" opacity="0.2" />
                      <rect
                        x="3"
                        y="2"
                        width="4"
                        height={`${12 * (autoPlayProgress / 100)}`}
                        rx="1"
                        fill="currentColor"
                      />
                      {/* Right bar with fill animation */}
                      <rect x="9" y="2" width="4" height="12" rx="1" fill="currentColor" opacity="0.2" />
                      <rect
                        x="9"
                        y="2"
                        width="4"
                        height={`${12 * (autoPlayProgress / 100)}`}
                        rx="1"
                        fill="currentColor"
                      />
                    </svg>
                  ) : <PlayIcon style={{ width: '1rem', height: '1rem' }} />}
                  {autoPlay ? 'Pause' : 'Auto-play'}
                </button>
              </div>
            )}

            {/* Navigation for single vibe */}
            {vibes.length === 1 && (
              <div 
                className={`controls-overlay ${showControls ? 'controls-visible' : 'controls-hidden'} flex justify-center`}
                style={{ 
                  marginTop: 'var(--hop-space-stack-xl)'
                }}
              >
                <button
                  onClick={fetchGoodVibes}
                  style={{ 
                    color: 'var(--hop-primary-text)',
                    gap: 'var(--hop-space-inline-xs)',
                    fontWeight: 'var(--hop-body-sm-medium-font-weight)',
                    fontSize: 'var(--hop-body-sm-font-size)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  className="flex items-center transition-colors hover:opacity-80"
                  aria-label="Refresh Good Vibes"
                >
                  <RefreshIcon style={{ width: '1rem', height: '1rem' }} />
                  Refresh
                </button>
              </div>
            )}

            {/* Pagination dots - only show if reasonable number of vibes */}
            {vibes.length <= 50 && (
              <div 
                className={`controls-overlay ${showControls ? 'controls-visible' : 'controls-hidden'} flex justify-center`}
                style={{ 
                  gap: 'var(--hop-space-inline-sm)',
                  marginTop: 'var(--hop-space-stack-xl)'
                }}
              >
                {vibes.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    style={{
                      height: '0.5rem',
                      width: idx === currentIndex ? '2rem' : '0.5rem',
                      backgroundColor: idx === currentIndex 
                        ? 'var(--hop-primary-surface)' 
                        : 'var(--hop-neutral-border-weak)',
                      borderRadius: 'var(--hop-shape-pill)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                    className="hover:opacity-70"
                    aria-label={`Go to vibe ${idx + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Progress bar for large datasets */}
            {vibes.length > 50 && (
              <div 
                className={`controls-overlay ${showControls ? 'controls-visible' : 'controls-hidden'} flex justify-center`}
                style={{ 
                  marginTop: 'var(--hop-space-stack-xl)'
                }}
              >
                <div 
                  style={{
                    width: '20rem',
                    height: '0.75rem',
                    backgroundColor: colorScheme === 'light' 
                      ? 'var(--hop-neutral-surface)' 
                      : 'var(--hop-neutral-border-weak)',
                    borderRadius: 'var(--hop-shape-pill)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    position: 'relative',
                    border: colorScheme === 'light' 
                      ? '1px solid var(--hop-neutral-border)' 
                      : 'none',
                    boxShadow: colorScheme === 'light' 
                      ? 'inset 0 1px 2px rgba(0, 0, 0, 0.1)' 
                      : 'none'
                  }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const percentage = clickX / rect.width;
                    const targetIndex = Math.floor(percentage * vibes.length);
                    const clampedIndex = Math.max(0, Math.min(targetIndex, vibes.length - 1));
                    setCurrentIndex(clampedIndex);
                  }}
                  title={`Click to jump to position in ${vibes.length} Good Vibes`}
                >
                  <div style={{
                    width: `${((currentIndex + 1) / vibes.length) * 100}%`,
                    height: '100%',
                    backgroundColor: colorScheme === 'light' 
                      ? 'var(--hop-primary-text)' 
                      : 'var(--hop-primary-surface)',
                    borderRadius: 'var(--hop-shape-pill)',
                    transition: 'width 0.3s ease',
                    pointerEvents: 'none' // Prevent interference with parent click
                  }} />
                </div>
              </div>
            )}

            {/* Count below the dots */}
            <div
              className={`controls-overlay ${showControls ? 'controls-visible' : 'controls-hidden'} text-center`}
              style={{ marginTop: 'var(--hop-space-stack-md)' }}
            >
              <span style={{
                fontSize: 'var(--hop-body-sm-font-size)',
                color: 'var(--hop-neutral-text-weak)',
                fontWeight: 'var(--hop-body-sm-medium-font-weight)'
              }}>
                {currentIndex + 1} of {vibes.length}
              </span>
            </div>

          </div>
        )}

        {/* Background loading indicator */}
        {backgroundLoadingStatus && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--hop-space-inline-sm)',
            padding: 'var(--hop-space-inset-sm)',
            fontSize: 'var(--hop-body-xs-font-size)',
            color: 'var(--hop-neutral-text-weak)',
            opacity: 0.8
          }}>
            <div
              className="inline-block animate-spin rounded-full"
              style={{
                width: '12px',
                height: '12px',
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: 'var(--hop-neutral-border-weak)',
                borderTopColor: 'var(--hop-primary-border)'
              }}
            />
            <span>{backgroundLoadingStatus}</span>
          </div>
        )}
      </div>
      </div>
    </>
  );
};

export default GoodVibesCarousel;