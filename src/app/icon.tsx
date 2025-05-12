import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          // Transparent background for PNG
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24" // SVG's internal width
          height="24" // SVG's internal height
          viewBox="0 0 24 24" // The viewBox for the SVG
          fill="none"
          stroke="#008080" // Teal color (primary theme color) for the icon stroke
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="4 17 10 11 4 5" />
          <line x1="12" x2="20" y1="17" y2="17" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
