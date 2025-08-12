export const Theme = {
  colors: {
    textPrimary: '#101417',
    textSecondary: '#5A6472',
    background: '#FFFFFF',
    inputBg: '#FFFFFF',
    inputBorder: '#E4E7EB',
    inputBorderFocused: '#0B74E5',
    inputBorderHover: '#D1D5DB',
    inputPlaceholder: '#9AA4B2',
    inputPlaceholderFocused: '#6B7280',
    primary: '#0B74E5',
    primaryPressed: '#095EC0',
    link: '#0B74E5',
    muted: '#C8CCD2',
    switchTrack: '#D3D6DC',
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 20,
    xl: 28,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  typography: {
    title: 24,
    heading: 20,
    body: 16,
    small: 14,
  },
};

export type AppTheme = typeof Theme;

