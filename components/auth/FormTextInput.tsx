import { forwardRef, useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { Theme } from '@/constants/theme';

type Props = TextInputProps & {
  leftIcon?: React.ReactNode;
};

export const FormTextInput = forwardRef<TextInput, Props>(function FormTextInput(
  { style, leftIcon, placeholderTextColor = Theme.colors.inputPlaceholder, ...rest },
  ref
) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[
      styles.container,
      isFocused && styles.containerFocused
    ]}>
      {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
      <TextInput
        ref={ref}
        style={[styles.input, style]}
        placeholderTextColor={isFocused ? Theme.colors.inputPlaceholderFocused : placeholderTextColor}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...rest}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.inputBg,
    borderWidth: 1.5,
    borderColor: Theme.colors.inputBorder,
    borderRadius: Theme.radius.lg,
    paddingHorizontal: Theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  containerFocused: {
    borderColor: Theme.colors.inputBorderFocused,
    borderWidth: 2,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    marginRight: Theme.spacing.sm,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: Theme.typography.body,
    color: Theme.colors.textPrimary,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
});

