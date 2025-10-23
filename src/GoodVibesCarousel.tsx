import React, { useState, useEffect } from 'react';
import { WellnessIcon, RefreshIcon, PlayIcon, PauseIcon, NewCommentIcon, ArrowLeftIcon, ArrowRightIcon, SparklesIcon } from '@hopper-ui/icons';
import { Avatar } from '@hopper-ui/components';
import { GoodVibe, GoodVibesResponse } from './types';
import './CarouselAnimations.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const GoodVibesCarousel: React.FC = () => {
  const [vibes, setVibes] = useState<GoodVibe[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [autoPlay, setAutoPlay] = useState<boolean>(false);
  const [loadingReplies, setLoadingReplies] = useState<boolean>(false);
  const [replyStartIndex, setReplyStartIndex] = useState<number>(0); // Track which set of replies to show
  const [hasCompletedReplyCycle, setHasCompletedReplyCycle] = useState<boolean>(false); // Track if we've shown all replies
  const autoPlayInterval = 5000;
  const maxVisibleReplies = 3; // Show only 3 replies at a time

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

  useEffect(() => {
    fetchGoodVibes();
  }, []);

  // Auto-refresh Good Vibes every hour
  useEffect(() => {
    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
    const refreshTimer = setInterval(() => {
      console.log('Auto-refreshing Good Vibes...');
      fetchGoodVibes();
    }, oneHour);

    return () => clearInterval(refreshTimer);
  }, []);

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
          }
        } else {
          // No replies or replies <= 3, proceed normally with regular timing
          setCurrentIndex((prev) => (prev + 1) % vibes.length);
          setReplyStartIndex(0); // Reset reply index for next vibe
        }
      }, autoPlayInterval);
      return () => clearInterval(timer);
    }
  }, [autoPlay, vibes.length, currentIndex, hasCompletedReplyCycle]);

  useEffect(() => {
    // Auto-fetch replies when viewing a Good Vibe that has replies but they haven't been loaded yet
    if (vibes.length > 0 && vibes[currentIndex].replyCount > 0 && !vibes[currentIndex].replies) {
      fetchRepliesForVibe(vibes[currentIndex].goodVibeId);
    }
  }, [currentIndex, vibes]);

  const fetchGoodVibes = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/good-vibes?isPublic=true`);

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }

      const data: GoodVibesResponse = await response.json();
      
      const vibesData = data.data || [];
      
      if (vibesData.length === 0) {
        setError('No Good Vibes found');
      } else {
        setVibes(vibesData);
        setCurrentIndex(0);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchRepliesForVibe = async (goodVibeId: string): Promise<void> => {
    setLoadingReplies(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/good-vibes/${goodVibeId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch replies: ${response.status} ${response.statusText}`);
      }

      const vibeWithReplies: GoodVibe = await response.json();
      
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
    setAutoPlay(!autoPlay);
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
        `}
      </style>
      <div style={{ 
        minHeight: '100vh',
        backgroundColor: 'var(--hop-neutral-surface-weakest)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--hop-space-inset-xl)'
      }}>
      <div style={{ maxWidth: '56rem', width: '100%' }}>
        <div className="text-center" style={{ marginBottom: 'var(--hop-space-stack-xl)' }}>
          <h1 style={{ 
            fontSize: 'var(--hop-heading-xl-font-size)',
            fontWeight: 'var(--hop-heading-xl-font-weight)',
            lineHeight: 'var(--hop-heading-xl-line-height)',
            color: 'var(--hop-neutral-text)',
            gap: 'var(--hop-space-inline-md)',
            marginBottom: 'var(--hop-space-stack-md)'
          }} className="flex items-center justify-center">
            <SparklesIcon style={{ color: 'var(--hop-primary-icon)', width: '2.5rem', height: '2.5rem' }} />
            Surfing the Good Vibes
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
            }}>Make sure the backend server is accessible at https://goodvibes-backend-f5yb.onrender.com</p>
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
                  <WellnessIcon style={{ 
                    width: '1rem', 
                    height: '1rem',
                    color: `var(--hop-${getVibeColor(currentIndex)}-icon)`
                  }} />
                  {vibes[currentIndex].prompt || (vibes[currentIndex].cardPrompt?.[0]?.text || '')}
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
                  className="fade-in-content fade-delay-1 vibe-content-unfold"
                  style={{ 
                    fontSize: 'var(--hop-heading-lg-font-size)',
                    fontWeight: 'var(--hop-heading-lg-font-weight)',
                    lineHeight: 'var(--hop-heading-lg-line-height)',
                    color: 'var(--hop-neutral-text)',
                    textAlign: 'center'
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

                {/* Reactions for vibes with replies - show directly below content */}
                {vibes[currentIndex].replyCount > 0 && vibes[currentIndex].reactions && vibes[currentIndex].reactions.length > 0 && (
                  <div className="flex items-center" style={{ 
                    marginTop: 'var(--hop-space-stack-sm)',
                    gap: 'var(--hop-space-inline-sm)'
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
                          transition: 'background-color 0.2s ease'
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

                {/* Scenario 2: Only Reactions (no replies) - Show reactions directly below content */}
                {vibes[currentIndex].replyCount === 0 && vibes[currentIndex].reactions && vibes[currentIndex].reactions.length > 0 && (
                  <div className="flex items-center" style={{ 
                    marginTop: 'var(--hop-space-stack-sm)',
                    gap: 'var(--hop-space-inline-sm)'
                  }}>
                    {vibes[currentIndex].reactions.map((reaction, idx) => (
                      <div key={idx} className="flex items-center" style={{ 
                        gap: 'var(--hop-space-inline-xs)',
                        backgroundColor: 'var(--hop-neutral-surface-weak)',
                        padding: 'var(--hop-space-inset-squish-sm)',
                        borderRadius: 'var(--hop-shape-pill)',
                        fontSize: 'var(--hop-body-sm-font-size)'
                      }}>
                        <span>{reaction.emoji}</span>
                        <span style={{ 
                          color: 'var(--hop-neutral-text)',
                          fontWeight: 'var(--hop-body-sm-medium-font-weight)'
                        }}>{reaction.count}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sender and recipient info at the bottom */}
                <div className="flex items-center justify-between" style={{ 
                  marginTop: 'var(--hop-space-stack-sm)',
                  paddingTop: 'var(--hop-space-stack-sm)',
                  borderTop: '1px solid var(--hop-neutral-border-weak)',
                  fontSize: 'var(--hop-body-sm-font-size)',
                  color: 'var(--hop-neutral-text-weak)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--hop-space-stack-xs)' }}>
                    {vibes[currentIndex].recipients && vibes[currentIndex].recipients.length > 0 && (
                      <div className="flex items-center" style={{ gap: 'var(--hop-space-inline-xs)' }}>
                        <span style={{ 
                          fontWeight: 'var(--hop-body-sm-semibold-font-weight)',
                          fontSize: 'var(--hop-body-sm-font-size)'
                        }}>To:</span>
                        {vibes[currentIndex].recipients.map((recipient, idx) => (
                          <React.Fragment key={idx}>
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
                            {idx < vibes[currentIndex].recipients.length - 1 && <span>,</span>}
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center" style={{ gap: 'var(--hop-space-inline-xs)' }}>
                      <span style={{ 
                        fontSize: 'var(--hop-body-sm-font-size)'
                      }}>From:</span>
                      <Avatar 
                        name={vibes[currentIndex].senderUser.displayName} 
                        size="sm"
                        src={vibes[currentIndex].senderUser.avatarUrl || undefined}
                      />
                      <span style={{ 
                        fontSize: 'var(--hop-body-sm-font-size)'
                      }}>
                        {vibes[currentIndex].senderUser.displayName}
                      </span>
                    </div>
                  </div>
                  <div>
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
                                  backgroundColor: `var(--hop-${getVibeColor(currentIndex)}-surface-weakest)`,
                                  borderRadius: 'var(--hop-shape-rounded-lg)',
                                  padding: 'var(--hop-space-inset-md)',
                                  borderLeft: `3px solid var(--hop-${getVibeColor(currentIndex)}-border)`
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
              <div className="flex justify-center items-center" style={{ 
                gap: 'var(--hop-space-inline-lg)',
                marginTop: 'var(--hop-space-stack-xl)'
              }}>
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
                  onClick={toggleAutoPlay}
                  style={{ 
                    color: autoPlay ? 'var(--hop-success-text)' : 'var(--hop-primary-text)',
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
                  {autoPlay ? <PauseIcon style={{ width: '1rem', height: '1rem' }} /> : <PlayIcon style={{ width: '1rem', height: '1rem' }} />}
                  {autoPlay ? 'Pause' : 'Auto-play'}
                </button>
              </div>
            )}

            {/* Navigation for single vibe */}
            {vibes.length === 1 && (
              <div className="flex justify-center" style={{ 
                marginTop: 'var(--hop-space-stack-xl)'
              }}>
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

            <div className="flex justify-center" style={{ 
              gap: 'var(--hop-space-inline-sm)',
              marginTop: 'var(--hop-space-stack-xl)'
            }}>
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

            {/* Count below the dots */}
            <div className="text-center" style={{ marginTop: 'var(--hop-space-stack-md)' }}>
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
      </div>
      </div>
    </>
  );
};

export default GoodVibesCarousel;