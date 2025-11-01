import React, { useState, useEffect } from 'react';
import { Avatar, useColorSchemeContext } from '@hopper-ui/components';
import { StarIcon, ThumbsUpIcon, AngleDownIcon, AngleUpIcon, ApplauseIcon, SparklesIcon } from '@hopper-ui/icons';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

interface LeaderboardUser {
  user: {
    userId: string;
    displayName: string;
    avatarUrl?: string;
  };
  count: number;
}

interface CollectionItem {
  name: string;
  count: number;
}

interface LeaderboardData {
  topSenders: LeaderboardUser[];
  topRecipients: LeaderboardUser[];
  topCollections: CollectionItem[];
  year: number;
  month: number;
}

interface MonthlyLeaderboardProps {
  currentVibeDate: Date | null;
}

const MonthlyLeaderboard: React.FC<MonthlyLeaderboardProps> = ({ currentVibeDate }) => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRecipientsCollapsed, setIsRecipientsCollapsed] = useState<boolean>(false);
  const [isSendersCollapsed, setIsSendersCollapsed] = useState<boolean>(false);
  const [isCollectionsCollapsed, setIsCollectionsCollapsed] = useState<boolean>(false);
  const { colorScheme } = useColorSchemeContext();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Fetch leaderboard when current vibe date changes
  useEffect(() => {
    if (currentVibeDate) {
      const year = currentVibeDate.getFullYear();
      const month = currentVibeDate.getMonth() + 1; // getMonth() returns 0-11
      fetchLeaderboard(year, month);
    }
  }, [currentVibeDate]);

  const fetchLeaderboard = async (year: number, month: number): Promise<void> => {
    setLoading(true);
    try {
      const [sendersResponse, recipientsResponse, collectionsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/stats/monthly/top-senders?year=${year}&month=${month}&limit=3`),
        fetch(`${API_BASE_URL}/api/stats/monthly/top-recipients?year=${year}&month=${month}&limit=3`),
        fetch(`${API_BASE_URL}/api/stats/monthly/top-collections?year=${year}&month=${month}&limit=3`)
      ]);

      if (sendersResponse.ok && recipientsResponse.ok && collectionsResponse.ok) {
        const sendersData = await sendersResponse.json();
        const recipientsData = await recipientsResponse.json();
        const collectionsData = await collectionsResponse.json();

        setLeaderboardData({
          topSenders: sendersData.topSenders || [],
          topRecipients: recipientsData.topRecipients || [],
          topCollections: collectionsData.topCollections || [],
          year: sendersData.year,
          month: sendersData.month
        });
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: 'var(--hop-neutral-surface)',
      borderRadius: 'var(--hop-shape-rounded-lg)',
      boxShadow: 'var(--hop-elevation-lifted)',
      padding: 'var(--hop-space-inset-lg)',
      width: '100%',
      maxWidth: '400px',
      border: '1px solid var(--hop-neutral-border-weak)'
    }}>
      {/* Month header */}
      <div style={{
        marginBottom: 'var(--hop-space-stack-lg)',
        borderBottom: '2px solid var(--hop-primary-border)',
        paddingBottom: 'var(--hop-space-stack-md)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--hop-space-inline-xs)',
          marginBottom: 'var(--hop-space-stack-xs)'
        }}>
          <StarIcon style={{ width: '1.5rem', height: '1.5rem', color: 'var(--hop-primary-icon)' }} />
          <h2 style={{
            fontSize: 'var(--hop-heading-sm-font-size)',
            fontWeight: 'var(--hop-heading-sm-font-weight)',
            color: 'var(--hop-neutral-text)',
            margin: 0
          }}>
            All-Stars
          </h2>
        </div>
        {currentVibeDate && (
          <p style={{
            fontSize: 'var(--hop-body-sm-font-size)',
            fontWeight: 'var(--hop-body-sm-semibold-font-weight)',
            color: 'var(--hop-neutral-text-weak)',
            margin: 0
          }}>
            {monthNames[currentVibeDate.getMonth()]} {currentVibeDate.getFullYear()}
          </p>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 'var(--hop-space-inset-xl)' }}>
          <div className="inline-block animate-spin rounded-full h-8 w-8" style={{
            borderWidth: '3px',
            borderStyle: 'solid',
            borderColor: 'var(--hop-neutral-border-weak)',
            borderTopColor: 'var(--hop-primary-border)'
          }}></div>
        </div>
      )}

      {!loading && leaderboardData && (
        <>
          {/* Most Appreciated */}
          <div style={{ marginBottom: 'var(--hop-space-stack-xl)' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: isRecipientsCollapsed ? '0' : 'var(--hop-space-stack-md)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--hop-space-inline-xs)'
              }}>
                <ApplauseIcon style={{ width: '1.25rem', height: '1.25rem', color: 'var(--hop-neutral-icon)' }} />
                <h3 style={{
                  fontSize: 'var(--hop-body-md-font-size)',
                  fontWeight: 'var(--hop-body-md-semibold-font-weight)',
                  color: 'var(--hop-neutral-text)',
                  margin: 0
                }}>
                  Most Appreciated
                </h3>
              </div>
              <button
                onClick={() => setIsRecipientsCollapsed(!isRecipientsCollapsed)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 'var(--hop-space-inset-xs)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'var(--hop-shape-rounded-md)',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--hop-neutral-surface-weak)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                aria-label={isRecipientsCollapsed ? 'Expand Most Appreciated' : 'Collapse Most Appreciated'}
              >
                {isRecipientsCollapsed ? (
                  <AngleDownIcon style={{ width: '1.25rem', height: '1.25rem', color: 'var(--hop-primary-icon)' }} />
                ) : (
                  <AngleUpIcon style={{ width: '1.25rem', height: '1.25rem', color: 'var(--hop-primary-icon)' }} />
                )}
              </button>
            </div>

            {!isRecipientsCollapsed && (
              leaderboardData.topRecipients.length === 0 ? (
                <p style={{
                  fontSize: 'var(--hop-body-sm-font-size)',
                  color: 'var(--hop-neutral-text-weak)',
                  fontStyle: 'italic',
                  marginLeft: 'var(--hop-space-inset-lg)'
                }}>
                  No data for this month
                </p>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--hop-space-stack-sm)'
                }}>
                  {leaderboardData.topRecipients.map((item, index) => (
                  <div
                    key={item.user.userId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--hop-space-inline-sm)',
                      padding: 'var(--hop-space-inset-sm)',
                      borderRadius: 'var(--hop-shape-rounded-md)',
                      borderLeft: index === 0 ? '3px solid var(--hop-decorative-option5-border)' : 'none',
                      paddingLeft: index === 0 ? 'var(--hop-space-inset-sm)' : 'calc(var(--hop-space-inset-sm) + 3px)',
                      backgroundColor: index === 0
                        ? (colorScheme === 'light'
                          ? 'var(--hop-decorative-option5-surface-weakest)'
                          : 'rgba(255, 152, 0, 0.08)')
                        : 'transparent'
                    }}
                  >
                    <span style={{
                      fontSize: 'var(--hop-body-md-font-size)',
                      fontWeight: 'var(--hop-body-md-semibold-font-weight)',
                      color: 'var(--hop-neutral-text-weak)',
                      minWidth: '1.5rem'
                    }}>
                      {index + 1}.
                    </span>
                    <Avatar
                      name={item.user.displayName}
                      size="sm"
                      src={item.user.avatarUrl || undefined}
                    />
                    <span style={{
                      flex: 1,
                      fontSize: 'var(--hop-body-sm-font-size)',
                      fontWeight: 'var(--hop-body-sm-medium-font-weight)',
                      color: 'var(--hop-neutral-text)'
                    }}>
                      {item.user.displayName}
                    </span>
                    <span style={{
                      fontSize: 'var(--hop-body-sm-font-size)',
                      fontWeight: 'var(--hop-body-sm-semibold-font-weight)',
                      color: 'var(--hop-neutral-text-weak)'
                    }}>
                      {item.count}
                    </span>
                  </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Top Praisers */}
          <div style={{ marginBottom: 'var(--hop-space-stack-xl)' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: isSendersCollapsed ? '0' : 'var(--hop-space-stack-md)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--hop-space-inline-xs)'
              }}>
                <ThumbsUpIcon style={{ width: '1.25rem', height: '1.25rem', color: 'var(--hop-neutral-icon)' }} />
                <h3 style={{
                  fontSize: 'var(--hop-body-md-font-size)',
                  fontWeight: 'var(--hop-body-md-semibold-font-weight)',
                  color: 'var(--hop-neutral-text)',
                  margin: 0
                }}>
                  Top Praisers
                </h3>
              </div>
              <button
                onClick={() => setIsSendersCollapsed(!isSendersCollapsed)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 'var(--hop-space-inset-xs)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'var(--hop-shape-rounded-md)',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--hop-neutral-surface-weak)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                aria-label={isSendersCollapsed ? 'Expand Top Praisers' : 'Collapse Top Praisers'}
              >
                {isSendersCollapsed ? (
                  <AngleDownIcon style={{ width: '1.25rem', height: '1.25rem', color: 'var(--hop-primary-icon)' }} />
                ) : (
                  <AngleUpIcon style={{ width: '1.25rem', height: '1.25rem', color: 'var(--hop-primary-icon)' }} />
                )}
              </button>
            </div>

            {!isSendersCollapsed && (leaderboardData.topSenders.length === 0 ? (
              <p style={{
                fontSize: 'var(--hop-body-sm-font-size)',
                color: 'var(--hop-neutral-text-weak)',
                fontStyle: 'italic',
                marginLeft: 'var(--hop-space-inset-lg)'
              }}>
                No data for this month
              </p>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--hop-space-stack-sm)'
              }}>
                {leaderboardData.topSenders.map((item, index) => (
                  <div
                    key={item.user.userId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--hop-space-inline-sm)',
                      padding: 'var(--hop-space-inset-sm)',
                      borderRadius: 'var(--hop-shape-rounded-md)',
                      borderLeft: index === 0 ? '3px solid var(--hop-decorative-option3-border)' : 'none',
                      paddingLeft: index === 0 ? 'var(--hop-space-inset-sm)' : 'calc(var(--hop-space-inset-sm) + 3px)',
                      backgroundColor: index === 0
                        ? (colorScheme === 'light'
                          ? 'var(--hop-decorative-option3-surface-weakest)'
                          : 'rgba(0, 150, 136, 0.08)')
                        : 'transparent'
                    }}
                  >
                    <span style={{
                      fontSize: 'var(--hop-body-md-font-size)',
                      fontWeight: 'var(--hop-body-md-semibold-font-weight)',
                      color: 'var(--hop-neutral-text-weak)',
                      minWidth: '1.5rem'
                    }}>
                      {index + 1}.
                    </span>
                    <Avatar
                      name={item.user.displayName}
                      size="sm"
                      src={item.user.avatarUrl || undefined}
                    />
                    <span style={{
                      flex: 1,
                      fontSize: 'var(--hop-body-sm-font-size)',
                      fontWeight: 'var(--hop-body-sm-medium-font-weight)',
                      color: 'var(--hop-neutral-text)'
                    }}>
                      {item.user.displayName}
                    </span>
                    <span style={{
                      fontSize: 'var(--hop-body-sm-font-size)',
                      fontWeight: 'var(--hop-body-sm-semibold-font-weight)',
                      color: 'var(--hop-neutral-text-weak)'
                    }}>
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Most Popular Collections */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: isCollectionsCollapsed ? '0' : 'var(--hop-space-stack-md)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--hop-space-inline-xs)'
              }}>
                <SparklesIcon style={{ width: '1.25rem', height: '1.25rem', color: 'var(--hop-neutral-icon)' }} />
                <h3 style={{
                  fontSize: 'var(--hop-body-md-font-size)',
                  fontWeight: 'var(--hop-body-md-semibold-font-weight)',
                  color: 'var(--hop-neutral-text)',
                  margin: 0
                }}>
                  Most Popular Collections
                </h3>
              </div>
              <button
                onClick={() => setIsCollectionsCollapsed(!isCollectionsCollapsed)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 'var(--hop-space-inset-xs)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'var(--hop-shape-rounded-md)',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--hop-neutral-surface-weak)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                aria-label={isCollectionsCollapsed ? 'Expand Most Popular Collections' : 'Collapse Most Popular Collections'}
              >
                {isCollectionsCollapsed ? (
                  <AngleDownIcon style={{ width: '1.25rem', height: '1.25rem', color: 'var(--hop-primary-icon)' }} />
                ) : (
                  <AngleUpIcon style={{ width: '1.25rem', height: '1.25rem', color: 'var(--hop-primary-icon)' }} />
                )}
              </button>
            </div>

            {!isCollectionsCollapsed && (leaderboardData.topCollections.length === 0 ? (
              <p style={{
                fontSize: 'var(--hop-body-sm-font-size)',
                color: 'var(--hop-neutral-text-weak)',
                fontStyle: 'italic',
                marginLeft: 'var(--hop-space-inset-lg)'
              }}>
                No data for this month
              </p>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--hop-space-stack-sm)'
              }}>
                {leaderboardData.topCollections.map((item, index) => (
                  <div
                    key={`${item.name}-${index}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--hop-space-inline-sm)',
                      padding: 'var(--hop-space-inset-sm)',
                      borderRadius: 'var(--hop-shape-rounded-md)',
                      borderLeft: index === 0 ? '3px solid var(--hop-decorative-option1-border)' : 'none',
                      paddingLeft: index === 0 ? 'var(--hop-space-inset-sm)' : 'calc(var(--hop-space-inset-sm) + 3px)',
                      backgroundColor: index === 0
                        ? (colorScheme === 'light'
                          ? 'var(--hop-decorative-option1-surface-weakest)'
                          : 'rgba(186, 104, 200, 0.08)')
                        : 'transparent'
                    }}
                  >
                    <span style={{
                      fontSize: 'var(--hop-body-md-font-size)',
                      fontWeight: 'var(--hop-body-md-semibold-font-weight)',
                      color: 'var(--hop-neutral-text-weak)',
                      minWidth: '1.5rem'
                    }}>
                      {index + 1}.
                    </span>
                    <span style={{
                      flex: 1,
                      fontSize: 'var(--hop-body-sm-font-size)',
                      fontWeight: 'var(--hop-body-sm-medium-font-weight)',
                      color: 'var(--hop-neutral-text)'
                    }}>
                      {item.name}
                    </span>
                    <span style={{
                      fontSize: 'var(--hop-body-sm-font-size)',
                      fontWeight: 'var(--hop-body-sm-semibold-font-weight)',
                      color: 'var(--hop-neutral-text-weak)'
                    }}>
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MonthlyLeaderboard;
