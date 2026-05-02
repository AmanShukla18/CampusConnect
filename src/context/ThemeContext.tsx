import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

export type FontScale = 'small' | 'medium' | 'large' | 'xl';
export type ThemePreset = 'Violet' | 'Ocean' | 'Forest' | 'Sunset' | 'Midnight';

export type ThemeColors = {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
    background: string;
    card: string;
    cardBorder: string;
    inputBg: string;
    navBg: string;
    text: string;
    subText: string;
    border: string; // compatibility
};

export type TypographySize = {
    xs: number; sm: number; base: number; lg: number;
    xl: number; '2xl': number; '3xl': number; '4xl': number;
};

export type ThemeTokens = {
    colors: ThemeColors;
    typography: {
        fontFamily: string;
        size: TypographySize;
        weights: {
            regular: '400';
            medium: '500';
            semibold: '600';
            bold: '700';
        };
    };
    spacing: {
        2: number; 4: number; 6: number; 8: number; 12: number;
        16: number; 20: number; 24: number; 32: number; 40: number;
        48: number; 64: number;
    };
    borderRadius: {
        sm: number; md: number; lg: number; xl: number; full: number;
    };
    shadows: {
        sm: any; md: any; lg: any; xl: any;
    };
};

type ThemeContextType = {
    isDark: boolean;
    toggleTheme: () => void;
    fontScale: FontScale;
    setFontScale: (scale: FontScale) => void;
    themePreset: ThemePreset;
    setThemePreset: (preset: ThemePreset) => void;
    theme: ThemeTokens;
    colors: ThemeColors; // for backward compatibility
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const PRESET_COLORS: Record<ThemePreset, { primary: string, primaryLight: string, primaryDark: string }> = {
    Violet: { primary: '#6C5CE7', primaryLight: '#A29BFE', primaryDark: '#4834D4' },
    Ocean:  { primary: '#0984E3', primaryLight: '#74B9FF', primaryDark: '#0058A3' },
    Forest: { primary: '#00B894', primaryLight: '#55EFC4', primaryDark: '#008B6B' },
    Sunset: { primary: '#E17055', primaryLight: '#FAB1A0', primaryDark: '#C14B36' },
    Midnight:{ primary: '#2D3436', primaryLight: '#636E72', primaryDark: '#1E2325' },
};

const sharedColors = {
    secondary: '#00CEC9',
    accent: '#FD79A8',
    success: '#00B894',
    warning: '#FDCB6E',
    danger: '#E17055',
    info: '#74B9FF',
};

const generateColors = (isDark: boolean, preset: ThemePreset): ThemeColors => {
    const presetPalette = PRESET_COLORS[preset];
    return {
        ...sharedColors,
        ...presetPalette,
        background: isDark ? '#0D0D1A' : '#F8F7FF',
        card: isDark ? '#1A1A2E' : '#FFFFFF',
        cardBorder: isDark ? '#2D2D4A' : '#EEECFF',
        inputBg: isDark ? '#16213E' : '#F3F2FF',
        navBg: isDark ? '#0D0D1A' : '#FFFFFF',
        text: isDark ? '#F9FAFB' : '#1F2937',
        subText: isDark ? '#9CA3AF' : '#6B7280',
        border: isDark ? '#2D2D4A' : '#EEECFF', // compatibility alias
    };
};

const fontScalingMap: Record<FontScale, number> = {
    small: 0.9,
    medium: 1.0,
    large: 1.15,
    xl: 1.3,
};

const generateTypography = (scale: FontScale) => {
    const mult = fontScalingMap[scale];
    return {
        fontFamily: 'System',
        size: {
            xs: Math.round(11 * mult),
            sm: Math.round(13 * mult),
            base: Math.round(15 * mult),
            lg: Math.round(17 * mult),
            xl: Math.round(20 * mult),
            '2xl': Math.round(24 * mult),
            '3xl': Math.round(30 * mult),
            '4xl': Math.round(36 * mult),
        },
        weights: {
            regular: '400' as const,
            medium: '500' as const,
            semibold: '600' as const,
            bold: '700' as const,
        }
    };
};

const sharedTokens = {
    spacing: { 2: 2, 4: 4, 6: 6, 8: 8, 12: 12, 16: 16, 20: 20, 24: 24, 32: 32, 40: 40, 48: 48, 64: 64 },
    borderRadius: { sm: 6, md: 10, lg: 16, xl: 24, full: 9999 },
    shadows: {
        sm: { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2 },
        md: { elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4 },
        lg: { elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.16, shadowRadius: 8 },
        xl: { elevation: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.20, shadowRadius: 16 },
    }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemScheme = useColorScheme();
    const [isDark, setIsDark] = useState(systemScheme === 'dark');
    const [fontScale, _setFontScale] = useState<FontScale>('medium');
    const [themePreset, _setThemePreset] = useState<ThemePreset>('Violet');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const [storedTheme, storedFont, storedPreset] = await Promise.all([
                AsyncStorage.getItem('app_theme'),
                AsyncStorage.getItem('app_font_scale'),
                AsyncStorage.getItem('app_theme_preset')
            ]);
            
            if (storedTheme) setIsDark(storedTheme === 'dark');
            if (storedFont) _setFontScale(storedFont as FontScale);
            if (storedPreset) _setThemePreset(storedPreset as ThemePreset);
        } catch (e) {
            console.error('Failed to load theme settings', e);
        }
    };

    const toggleTheme = async () => {
        const newMode = !isDark;
        setIsDark(newMode);
        await AsyncStorage.setItem('app_theme', newMode ? 'dark' : 'light');
    };

    const setFontScale = async (scale: FontScale) => {
        _setFontScale(scale);
        await AsyncStorage.setItem('app_font_scale', scale);
    };

    const setThemePreset = async (preset: ThemePreset) => {
        _setThemePreset(preset);
        await AsyncStorage.setItem('app_theme_preset', preset);
    };

    const colors = generateColors(isDark, themePreset);
    const theme: ThemeTokens = {
        colors,
        typography: generateTypography(fontScale),
        spacing: sharedTokens.spacing,
        borderRadius: sharedTokens.borderRadius,
        shadows: sharedTokens.shadows,
    };

    return (
        <ThemeContext.Provider value={{
            isDark, toggleTheme,
            fontScale, setFontScale,
            themePreset, setThemePreset,
            theme, colors
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
