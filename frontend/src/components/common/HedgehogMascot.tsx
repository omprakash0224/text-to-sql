/**
 * DataSpeak — PostHog Hedgehog Mascot Component (HedgehogMascot.tsx)
 * Hand-drawn sketchbook style vector illustrations representing PostHog's signature mascot.
 * Used across hero decks, card marginalia, empty states, and safety badges.
 */

import React from 'react';

export type MascotPose =
  | 'logo'
  | 'scientist'
  | 'terminal'
  | 'shield'
  | 'detective'
  | 'lounge'
  | 'warning';

interface HedgehogMascotProps {
  pose?: MascotPose;
  className?: string;
  size?: number;
}

export const HedgehogMascot: React.FC<HedgehogMascotProps> = ({
  pose = 'logo',
  className = '',
  size = 40,
}) => {
  switch (pose) {
    case 'logo':
      // Compact Hedgehog Icon for Wordmark / Topbar
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Spines / Quills */}
          <path
            d="M12 40C8 34 8 24 14 16C20 8 32 6 42 10C50 14 54 22 56 30C58 38 52 46 44 50C36 54 20 54 12 40Z"
            fill="#33342D"
          />
          <path
            d="M16 14L8 10M26 8L24 2M38 8L42 2M48 14L54 8M54 24L62 22M56 34L62 38"
            stroke="#23251D"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Face & Snout */}
          <ellipse cx="28" cy="38" rx="20" ry="14" fill="#F7A501" />
          <path d="M12 36C8 38 4 40 4 42C4 44 8 46 12 44L18 42Z" fill="#DD9001" />
          {/* Nose */}
          <circle cx="5" cy="42" r="3.5" fill="#23251D" />
          {/* Eye */}
          <circle cx="20" cy="34" r="3" fill="#23251D" />
          <circle cx="21" cy="33" r="1" fill="#FFFFFF" />
          {/* Smile */}
          <path
            d="M14 43C16 45 20 45 22 43"
            stroke="#23251D"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Cute Cheek Blush */}
          <ellipse cx="25" cy="40" rx="3" ry="1.5" fill="#CD4239" opacity="0.6" />
        </svg>
      );

    case 'scientist':
      // Hedgehog in Lab Coat with Beaker (AI Query Generator / Schema Scientist)
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Spines */}
          <path
            d="M30 65C18 55 18 35 28 20C40 8 62 6 78 18C90 28 94 45 92 60C90 70 80 80 68 84C55 88 38 82 30 65Z"
            fill="#33342D"
          />
          <path
            d="M32 18L24 10M48 10L48 2M68 12L74 4M86 24L96 18M92 42L100 42M90 60L98 66"
            stroke="#23251D"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Snout */}
          <ellipse cx="45" cy="50" rx="26" ry="20" fill="#F7A501" />
          <path d="M22 48C14 50 8 52 8 55C8 58 14 60 22 57L30 54Z" fill="#DD9001" />
          <circle cx="9" cy="55" r="4" fill="#23251D" />
          {/* Eye with Geeky Glasses */}
          <circle cx="34" cy="45" r="8" stroke="#23251D" strokeWidth="2.5" fill="#FFFFFF" fillOpacity="0.4" />
          <circle cx="35" cy="45" r="3.5" fill="#23251D" />
          <circle cx="36.5" cy="43.5" r="1.2" fill="#FFFFFF" />
          <path d="M26 45L18 48" stroke="#23251D" strokeWidth="2" />
          {/* Lab Coat */}
          <path
            d="M36 62C36 62 44 60 56 60C68 60 76 65 76 85C76 87 40 88 36 85Z"
            fill="#FFFFFF"
            stroke="#BFC1B7"
            strokeWidth="2.5"
          />
          <path d="M52 62V85M44 68L52 74L60 68" stroke="#23251D" strokeWidth="2" strokeLinecap="round" />
          {/* Erlenmeyer Flask with Bubbling Blue Liquid */}
          <path
            d="M20 72L26 84C27 86 25 88 23 88H13C11 88 9 86 10 84L16 72V66H20V72Z"
            fill="#DCEAF6"
            stroke="#2C84E0"
            strokeWidth="2"
          />
          <path d="M12 82C15 80 20 84 24 82L25 86H11L12 82Z" fill="#2C84E0" />
          <circle cx="17" cy="76" r="1.5" fill="#2C84E0" />
          <circle cx="21" cy="74" r="1" fill="#2C84E0" />
        </svg>
      );

    case 'shield':
      // Hedgehog with Safety Shield & Hard Hat (Read-only AST Guardrails)
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Spines */}
          <path
            d="M32 65C20 55 20 35 30 20C42 8 64 6 80 18C92 28 96 45 94 60C92 70 82 80 70 84C57 88 40 82 32 65Z"
            fill="#33342D"
          />
          <path
            d="M36 16L28 8M72 10L78 2M90 22L100 16M94 40L100 40M92 58L100 64"
            stroke="#23251D"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Face */}
          <ellipse cx="48" cy="52" rx="26" ry="20" fill="#F7A501" />
          <path d="M26 50C18 52 12 54 12 57C12 60 18 62 26 59L34 56Z" fill="#DD9001" />
          <circle cx="13" cy="57" r="4" fill="#23251D" />
          {/* Eye */}
          <circle cx="38" cy="46" r="3.5" fill="#23251D" />
          <circle cx="39.5" cy="44.5" r="1.2" fill="#FFFFFF" />
          {/* Safety Hard Hat */}
          <path
            d="M30 36C30 24 45 16 62 18C72 20 78 28 80 36H28Z"
            fill="#F7A501"
            stroke="#23251D"
            strokeWidth="2.5"
          />
          <path d="M26 36H82C84 36 84 39 82 39H26C24 39 24 36 26 36Z" fill="#DD9001" />
          {/* Green Safety Shield */}
          <path
            d="M12 62C12 62 28 58 40 62C40 76 30 88 26 92C22 88 12 76 12 62Z"
            fill="#D9EDDF"
            stroke="#2C8C66"
            strokeWidth="3"
          />
          <path
            d="M20 74L24 78L32 68"
            stroke="#2C8C66"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'terminal':
      // Hedgehog typing SQL on Laptop / Terminal
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Spines */}
          <path
            d="M28 60C18 50 18 32 28 18C40 6 60 4 75 16C87 26 90 42 88 56C86 66 76 76 65 80C52 84 36 78 28 60Z"
            fill="#33342D"
          />
          <path
            d="M32 16L24 8M50 8L50 0M70 10L76 2M85 22L95 16M88 38L96 38"
            stroke="#23251D"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Face */}
          <ellipse cx="44" cy="46" rx="24" ry="18" fill="#F7A501" />
          <circle cx="15" cy="48" r="3.5" fill="#23251D" />
          <circle cx="34" cy="40" r="3" fill="#23251D" />
          <circle cx="35.5" cy="38.5" r="1" fill="#FFFFFF" />
          {/* Concentrating Eyebrow */}
          <path d="M30 35L38 37" stroke="#23251D" strokeWidth="2" strokeLinecap="round" />
          {/* Laptop Body */}
          <rect x="36" y="52" width="38" height="24" rx="2" fill="#23251D" stroke="#33342D" strokeWidth="2" />
          <rect x="40" y="55" width="30" height="18" rx="1" fill="#23251d" />
          {/* Terminal Screen Prompts */}
          <path d="M43 60L46 63L43 66M48 66H54" stroke="#62AEF0" strokeWidth="1.5" strokeLinecap="round" />
          {/* Keyboard Base */}
          <path d="M30 76H80L84 82H26L30 76Z" fill="#4D4F46" />
          {/* Paws on Keyboard */}
          <ellipse cx="42" cy="74" rx="4" ry="3" fill="#DD9001" />
          <ellipse cx="60" cy="74" rx="4" ry="3" fill="#DD9001" />
        </svg>
      );

    case 'detective':
      // Hedgehog with Magnifying Glass (Schema Explorer & Table Inspector)
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Spines */}
          <path
            d="M32 65C20 55 20 35 30 20C42 8 64 6 80 18C92 28 96 45 94 60C92 70 82 80 70 84C57 88 40 82 32 65Z"
            fill="#33342D"
          />
          {/* Face */}
          <ellipse cx="48" cy="52" rx="26" ry="20" fill="#F7A501" />
          <circle cx="15" cy="56" r="4" fill="#23251D" />
          {/* Detective Fedora Hat */}
          <ellipse cx="52" cy="30" rx="32" ry="8" fill="#4D4F46" stroke="#23251D" strokeWidth="2" />
          <path d="M34 30C34 18 42 12 54 12C66 12 70 18 70 30Z" fill="#33342D" stroke="#23251D" strokeWidth="2" />
          <path d="M34 26H70" stroke="#F7A501" strokeWidth="3" />
          {/* Big Eye behind Magnifying Glass */}
          <circle cx="34" cy="52" r="14" stroke="#23251D" strokeWidth="3.5" fill="#E5E7E0" fillOpacity="0.5" />
          <circle cx="34" cy="52" r="5" fill="#23251D" />
          <circle cx="36" cy="50" r="1.5" fill="#FFFFFF" />
          {/* Glass Handle */}
          <path d="M24 62L12 76" stroke="#B17816" strokeWidth="5" strokeLinecap="round" />
        </svg>
      );

    case 'lounge':
      // Hedgehog Lounging with Coffee (Empty State / Welcome)
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Spines */}
          <path
            d="M25 70C15 58 16 38 28 25C42 10 65 10 78 22C90 34 92 52 88 68C84 78 72 86 60 88C46 90 32 82 25 70Z"
            fill="#33342D"
          />
          {/* Snout */}
          <ellipse cx="48" cy="50" rx="26" ry="20" fill="#F7A501" />
          <circle cx="16" cy="52" r="4" fill="#23251D" />
          {/* Cool Sunglasses */}
          <path
            d="M26 40H64L62 48C60 52 52 54 48 50L44 48L40 50C36 54 28 52 26 48Z"
            fill="#23251D"
          />
          <path d="M30 42L36 46M48 42L54 46" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
          {/* Big Relaxed Smile */}
          <path d="M28 58C34 64 44 64 50 58" stroke="#23251D" strokeWidth="2.5" strokeLinecap="round" />
          {/* Coffee Mug */}
          <rect x="68" y="58" width="16" height="18" rx="3" fill="#E5E7E0" stroke="#4D4F46" strokeWidth="2" />
          <path d="M84 62C88 62 90 66 90 70C90 74 88 78 84 78" stroke="#4D4F46" strokeWidth="2" />
          {/* Steam */}
          <path d="M72 52C72 48 76 46 76 42M78 52C78 48 82 46 82 42" stroke="#BFC1B7" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'warning':
      // Hedgehog with Red Stop Sign (Blocked Modification Attempt)
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Spines Alert */}
          <path
            d="M30 65C18 55 18 35 28 20C40 8 62 6 78 18C90 28 94 45 92 60C90 70 80 80 68 84C55 88 38 82 30 65Z"
            fill="#33342D"
          />
          <path
            d="M26 12L18 4M46 6L46 -2M72 8L80 0M92 20L102 14M96 38L104 38"
            stroke="#CD4239"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Face with Surprised Eyes */}
          <ellipse cx="46" cy="50" rx="25" ry="20" fill="#F7A501" />
          <circle cx="16" cy="52" r="4" fill="#23251D" />
          <circle cx="34" cy="44" r="5" fill="#23251D" />
          <circle cx="35.5" cy="42" r="2" fill="#FFFFFF" />
          {/* Surprised O mouth */}
          <circle cx="28" cy="56" r="3.5" fill="#23251D" />
          {/* Red Hexagon Stop Sign */}
          <polygon
            points="65,42 77,42 85,50 85,62 77,70 65,70 57,62 57,50"
            fill="#CD4239"
            stroke="#FFFFFF"
            strokeWidth="2.5"
          />
          <path d="M63 56H79" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
  }
};
