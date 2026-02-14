/**
 * FeedbackModal
 *
 * Shown when user thumbs-down a prompt. Asks what they didn't like
 * (subject, medium, or twist) and offers to update their preferences.
 */

import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Prompt } from '@/lib/schemas/prompts';
import { MEDIUM_OPTIONS, SUBJECT_OPTIONS } from '@/lib/constants/preferences';

type FeedbackReason = 'subject' | 'medium' | 'twist' | 'other';

type Props = {
  visible: boolean;
  prompt: Prompt;
  onSubmit: (reasons: FeedbackReason[], updatePrefs: boolean) => void;
  onCancel: () => void;
};

function getLabel(options: { id: string; label: string }[], id: string): string {
  return options.find(o => o.id === id)?.label || id;
}

export default function FeedbackModal({ visible, prompt, onSubmit, onCancel }: Props) {
  const [selectedReasons, setSelectedReasons] = useState<FeedbackReason[]>([]);

  const toggleReason = (reason: FeedbackReason) => {
    setSelectedReasons(prev =>
      prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
    );
  };

  const handleSubmit = (updatePrefs: boolean) => {
    onSubmit(selectedReasons.length > 0 ? selectedReasons : ['other'], updatePrefs);
    setSelectedReasons([]);
  };

  const handleCancel = () => {
    setSelectedReasons([]);
    onCancel();
  };

  const mediumLabel = getLabel(MEDIUM_OPTIONS, prompt.medium);
  const subjectLabel = getLabel(SUBJECT_OPTIONS, prompt.subject);

  const reasons: { key: FeedbackReason; label: string; detail: string }[] = [
    {
      key: 'subject',
      label: `Not into "${subjectLabel}"`,
      detail: `We'll add "${subjectLabel}" to your exclusions`,
    },
    {
      key: 'medium',
      label: `Don't want "${mediumLabel}"`,
      detail: `We'll remove "${mediumLabel}" from your mediums`,
    },
  ];

  if (prompt.twist) {
    reasons.push({
      key: 'twist',
      label: "Don't like the twist",
      detail: "We'll skip twists more often",
    });
  }

  reasons.push({
    key: 'other',
    label: 'Just not feeling it',
    detail: "No worries, we'll generate a new one",
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <View className="flex-1 bg-black/40 justify-end">
        <View className="bg-white rounded-t-3xl px-6 pt-6 pb-10">
          <Text className="text-lg font-bold text-gray-900 mb-1">
            What didn't you like?
          </Text>
          <Text className="text-sm text-gray-500 mb-5">
            Select all that apply — we'll update your preferences.
          </Text>

          {reasons.map(({ key, label, detail }) => {
            const selected = selectedReasons.includes(key);
            return (
              <TouchableOpacity
                key={key}
                onPress={() => toggleReason(key)}
                className="mb-3 rounded-xl border p-4"
                style={{
                  borderColor: selected ? '#7C9A72' : '#E5E7EB',
                  backgroundColor: selected ? '#F0F5EE' : '#FFFFFF',
                }}
              >
                <Text
                  className="font-semibold text-base"
                  style={{ color: selected ? '#7C9A72' : '#374151' }}
                >
                  {label}
                </Text>
                <Text className="text-xs text-gray-400 mt-1">{detail}</Text>
              </TouchableOpacity>
            );
          })}

          {/* Action buttons */}
          <TouchableOpacity
            onPress={() => handleSubmit(true)}
            style={{ backgroundColor: '#7C9A72' }}
            className="rounded-xl py-4 mt-4"
            disabled={selectedReasons.length === 0}
          >
            <Text className="text-white text-center font-semibold text-base">
              Update Preferences & Generate New
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleSubmit(false)}
            className="rounded-xl py-3 mt-2 border border-gray-200"
          >
            <Text className="text-gray-600 text-center font-medium text-sm">
              Just generate a new one
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleCancel} className="mt-3 py-2">
            <Text className="text-gray-400 text-center text-sm">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
