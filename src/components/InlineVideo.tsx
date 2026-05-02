import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';

export function InlineVideo({ uri, style }: { uri: string; style?: StyleProp<ViewStyle> }) {
  const player = useVideoPlayer({ uri });

  return (
    <VideoView
      player={player}
      style={style}
      contentFit="cover"
      allowsFullscreen
      allowsPictureInPicture
    />
  );
}
