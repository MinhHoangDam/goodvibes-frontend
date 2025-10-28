import React, { useState } from 'react';
import GoodVibesCarousel from './GoodVibesCarousel';
import MonthlyLeaderboard from './MonthlyLeaderboard';
import { useColorSchemeContext } from '@hopper-ui/components';

function App() {
  const [currentVibeDate, setCurrentVibeDate] = useState<Date | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(true);
  const { colorScheme } = useColorSchemeContext();

  return (
    <div style={{
      minHeight: '100vh',
      padding: 'var(--hop-space-inset-xl)',
      backgroundColor: 'var(--hop-neutral-surface-weakest)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decorations at viewport edges */}
      <img
        src="/decorations/bang.svg"
        alt=""
        style={{
          position: 'absolute',
          top: '8%',
          right: '10%',
          width: '125px',
          height: '125px',
          opacity: colorScheme === 'light' ? 0.25 : 0.6,
          pointerEvents: 'none',
          color: colorScheme === 'light' ? 'var(--hop-decorative-option1-icon)' : 'var(--hop-decorative-option1-surface-strong)',
          zIndex: 0
        }}
      />
      <img
        src="/decorations/lightning.svg"
        alt=""
        style={{
          position: 'absolute',
          top: '50%',
          right: '5%',
          transform: 'translateY(-50%)',
          width: '140px',
          height: '140px',
          opacity: colorScheme === 'light' ? 0.25 : 0.6,
          pointerEvents: 'none',
          color: colorScheme === 'light' ? 'var(--hop-decorative-option5-icon)' : 'var(--hop-decorative-option5-surface-strong)',
          zIndex: 0
        }}
      />
      <img
        src="/decorations/vector.svg"
        alt=""
        style={{
          position: 'absolute',
          bottom: '15%',
          right: '30%',
          width: '225px',
          height: '112px',
          opacity: colorScheme === 'light' ? 0.25 : 0.6,
          pointerEvents: 'none',
          color: colorScheme === 'light' ? 'var(--hop-decorative-option3-icon)' : 'var(--hop-decorative-option3-surface-strong)',
          zIndex: 0
        }}
      />
      <img
        src="/decorations/group6.svg"
        alt=""
        style={{
          position: 'absolute',
          top: '30%',
          left: '9%',
          transform: 'translateY(-50%)',
          width: '200px',
          height: '110px',
          opacity: colorScheme === 'light' ? 0.2 : 0.5,
          pointerEvents: 'none',
          color: colorScheme === 'light' ? 'var(--hop-decorative-option2-icon)' : 'var(--hop-decorative-option2-surface-strong)',
          zIndex: 0
        }}
      />

      <div style={{
        display: 'flex',
        gap: 'var(--hop-space-inline-xl)',
        alignItems: 'flex-start',
        justifyContent: 'center',
        transition: 'all 0.3s ease',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          flex: 1,
          maxWidth: '56rem',
          margin: showLeaderboard ? '0' : '0 auto'
        }}>
          <GoodVibesCarousel
            onVibeChange={setCurrentVibeDate}
            showLeaderboard={showLeaderboard}
            onToggleLeaderboard={() => setShowLeaderboard(!showLeaderboard)}
          />
        </div>
        {showLeaderboard && (
          <div style={{
            width: '400px',
            flexShrink: 0,
            marginTop: '4.5rem',
            animation: 'fadeIn 0.3s ease-in'
          }}>
            <MonthlyLeaderboard currentVibeDate={currentVibeDate} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;