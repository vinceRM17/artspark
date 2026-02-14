/**
 * Branded share card preview
 *
 * Renders a capturable card view with prompt text, artwork image,
 * ArtSpark branding, and botanical accents.
 */

import React, { forwardRef } from 'react';
import { View, Text, Image } from 'react-native';

type ShareCardPreviewProps = {
  promptText: string;
  imageUri: string;
  format: 'story' | 'post';
};

const ShareCardPreview = forwardRef<View, ShareCardPreviewProps>(
  ({ promptText, imageUri, format }, ref) => {
    const isStory = format === 'story';
    const cardWidth = 340;
    const cardHeight = isStory ? 604 : 340; // 9:16 or 1:1

    return (
      <View
        ref={ref}
        collapsable={false}
        style={{
          width: cardWidth,
          height: cardHeight,
          backgroundColor: '#FFF8F0',
          borderRadius: 20,
          overflow: 'hidden',
        }}
      >
        {/* Top accent bar */}
        <View
          style={{
            height: 4,
            backgroundColor: '#7C9A72',
          }}
        />

        {/* Artwork image */}
        <View
          style={{
            flex: 1,
            margin: 16,
            marginBottom: 8,
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <Image
            source={{ uri: imageUri }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        </View>

        {/* Prompt text */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 4 }}>
          <Text
            style={{
              fontSize: 14,
              fontStyle: 'italic',
              color: '#374151',
              textAlign: 'center',
            }}
            numberOfLines={2}
          >
            "{promptText}"
          </Text>
        </View>

        {/* Footer with branding */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: 16,
            paddingTop: 8,
          }}
        >
          {/* Leaf accent */}
          <Text style={{ fontSize: 14, color: '#7C9A72', marginRight: 6 }}>
            {'\uD83C\uDF3F'}
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: '#7C9A72',
              letterSpacing: 1,
            }}
          >
            ArtSpark
          </Text>
          <Text style={{ fontSize: 14, color: '#7C9A72', marginLeft: 6 }}>
            {'\uD83C\uDF3F'}
          </Text>
        </View>
      </View>
    );
  }
);

ShareCardPreview.displayName = 'ShareCardPreview';

export default ShareCardPreview;
