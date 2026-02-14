/**
 * Share modal with format toggle and preview
 *
 * Allows choosing between Story (9:16) and Post (1:1) formats,
 * shows a preview of the branded share card, and shares it.
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import ShareCardPreview from './ShareCardPreview';
import { generateAndShareCard } from '@/lib/services/shareCard';
import { hapticSuccess } from '@/lib/utils/haptics';

type ShareModalProps = {
  visible: boolean;
  onClose: () => void;
  promptText: string;
  imageUri: string;
};

export default function ShareModal({
  visible,
  onClose,
  promptText,
  imageUri,
}: ShareModalProps) {
  const [format, setFormat] = useState<'story' | 'post'>('story');
  const [sharing, setSharing] = useState(false);
  const cardRef = useRef<View>(null);

  const handleShare = async () => {
    try {
      setSharing(true);
      await generateAndShareCard(cardRef);
      await hapticSuccess();
      onClose();
    } catch (err) {
      Alert.alert(
        'Share Error',
        err instanceof Error ? err.message : 'Failed to share'
      );
    } finally {
      setSharing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: '#FFF8F0' }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 12,
          }}
        >
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: '#7C9A72', fontSize: 16 }}>Cancel</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 17, fontWeight: '600', color: '#111827' }}>
            Share Card
          </Text>
          <View style={{ width: 50 }} />
        </View>

        {/* Format toggle */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            marginBottom: 20,
            gap: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => setFormat('story')}
            style={{
              paddingHorizontal: 20,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: format === 'story' ? '#7C9A72' : '#F3F4F6',
            }}
          >
            <Text
              style={{
                color: format === 'story' ? '#FFFFFF' : '#6B7280',
                fontWeight: '600',
                fontSize: 13,
              }}
            >
              Story 9:16
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFormat('post')}
            style={{
              paddingHorizontal: 20,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: format === 'post' ? '#7C9A72' : '#F3F4F6',
            }}
          >
            <Text
              style={{
                color: format === 'post' ? '#FFFFFF' : '#6B7280',
                fontWeight: '600',
                fontSize: 13,
              }}
            >
              Post 1:1
            </Text>
          </TouchableOpacity>
        </View>

        {/* Preview */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ShareCardPreview
            ref={cardRef}
            promptText={promptText}
            imageUri={imageUri}
            format={format}
          />
        </View>

        {/* Share button */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 16 }}>
          <TouchableOpacity
            onPress={handleShare}
            disabled={sharing}
            style={{
              backgroundColor: '#7C9A72',
              borderRadius: 14,
              paddingVertical: 16,
              opacity: sharing ? 0.7 : 1,
            }}
          >
            {sharing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text
                style={{
                  color: '#FFFFFF',
                  textAlign: 'center',
                  fontSize: 17,
                  fontWeight: '600',
                }}
              >
                Share
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
