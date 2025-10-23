import React, { useState, useEffect } from 'react';
import { WellnessIcon, RefreshIcon, PlayIcon, PauseIcon, NewCommentIcon, ArrowLeftIcon, ArrowRightIcon, SparklesIcon } from '@hopper-ui/icons';
import { Avatar } from '@hopper-ui/components';
import { GoodVibe, GoodVibesResponse } from './types';
import './CarouselAnimations.css';

const API_BASE_URL = 'https://goodvibes-backend-f5yb.onrender.com';

const GoodVibesCarousel: React.FC = () => {
  const [vibes, setVibes] = useState<GoodVibe[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [autoPlay, setAutoPlay] = useState<boolean>(false);
  const [loadingReplies, setLoadingReplies] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const autoPlayInterval = 5000;

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
        setCurrentIndex((prev) => (prev + 1) % vibes.length);
      }, autoPlayInterval);
      return () => clearInterval(timer);
    }
  }, [autoPlay, vibes.length, currentIndex]);

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
  };

  const prevVibe = (): void => {
    setCurrentIndex((prev) => (prev - 1 + vibes.length) % vibes.length);
  };

  const toggleAutoPlay = (): void => {
    setAutoPlay(!autoPlay);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
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
                    `"${vibes[currentIndex].message}"`
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

                {/* Scenario 1: Replies + Reactions - Show divider and full section */}
                {vibes[currentIndex].replyCount > 0 && (
                  <div style={{ 
                    borderTop: '1px solid var(--hop-neutral-border-weak)',
                    paddingTop: 'var(--hop-space-stack-xl)'
                  }}>

                  <div style={{ marginTop: 'var(--hop-space-stack-xl)' }}>
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
                    {vibes[currentIndex].replies && vibes[currentIndex].replies!.length > 0 && (
                      <div style={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--hop-space-stack-sm)',
                        maxHeight: '16rem',
                        overflowY: 'auto',
                        paddingRight: 'var(--hop-space-inline-sm)'
                      }}>
                        {vibes[currentIndex].replies!.map((reply, idx) => (
                          <div key={idx} style={{ 
                            backgroundColor: `var(--hop-${getVibeColor(currentIndex)}-surface-weakest)`,
                            borderRadius: 'var(--hop-shape-rounded-lg)',
                            padding: 'var(--hop-space-inset-md)',
                            borderLeft: `3px solid var(--hop-${getVibeColor(currentIndex)}-border)`
                          }}>
                            <p style={{ 
                              fontSize: 'var(--hop-body-sm-font-size)',
                              lineHeight: 'var(--hop-body-sm-line-height)',
                              color: 'var(--hop-neutral-text)',
                              marginBottom: 'var(--hop-space-stack-sm)'
                            }}>"{reply.message}"</p>
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
                    )}
                  </div>

                  {/* Reactions in the replies section */}
                  {vibes[currentIndex].reactions && vibes[currentIndex].reactions.length > 0 && (
                    <div className="flex items-center" style={{ 
                      marginTop: 'var(--hop-space-stack-lg)',
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

                  </div>
                )}

                {/* Scenario 2: Only Reactions (no replies) - Show reactions directly below content */}
                {vibes[currentIndex].replyCount === 0 && vibes[currentIndex].reactions && vibes[currentIndex].reactions.length > 0 && (
                  <div className="flex items-center" style={{ 
                    marginTop: 'var(--hop-space-stack-lg)',
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
                  marginTop: 'var(--hop-space-stack-lg)',
                  paddingTop: 'var(--hop-space-stack-md)',
                  borderTop: '1px solid var(--hop-neutral-border-weak)',
                  fontSize: 'var(--hop-body-xs-font-size)',
                  color: 'var(--hop-neutral-text-weak)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--hop-space-stack-xs)' }}>
                    {vibes[currentIndex].recipients && vibes[currentIndex].recipients.length > 0 && (
                      <div className="flex items-center" style={{ gap: 'var(--hop-space-inline-xs)' }}>
                        <span style={{ fontWeight: 'var(--hop-body-xs-semibold-font-weight)' }}>To:</span>
                        {vibes[currentIndex].recipients.map((recipient, idx) => (
                          <React.Fragment key={idx}>
                            <Avatar 
                              name={recipient.displayName} 
                              size="xs"
                              src={recipient.avatarUrl || undefined}
                            />
                            <span style={{ fontWeight: 'var(--hop-body-xs-semibold-font-weight)' }}>
                              {recipient.displayName}
                            </span>
                            {idx < vibes[currentIndex].recipients.length - 1 && <span>,</span>}
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center" style={{ gap: 'var(--hop-space-inline-xs)' }}>
                      <span>From:</span>
                      <Avatar 
                        name={vibes[currentIndex].senderUser.displayName} 
                        size="xs"
                        src={vibes[currentIndex].senderUser.avatarUrl || undefined}
                      />
                      <span>
                        {vibes[currentIndex].senderUser.displayName}
                      </span>
                    </div>
                  </div>
                  <div>
                    {formatDate(vibes[currentIndex].creationDate)}
                  </div>
                </div>
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
  );
};

export default GoodVibesCarousel;