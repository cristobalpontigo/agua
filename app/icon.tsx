import { ImageResponse } from 'next/og';

export const size = {
  width: 512,
  height: 512,
};

export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(140deg, #0ea5e9, #06b6d4 50%, #67e8f9)',
          color: '#082f49',
          fontSize: 128,
          fontWeight: 800,
          letterSpacing: 6,
        }}
      >
        AG
      </div>
    ),
    {
      ...size,
    }
  );
}
