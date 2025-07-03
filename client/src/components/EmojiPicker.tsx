import React, { useState, useEffect } from 'react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

interface EmojiPickerComponentProps {
  onEmojiSelect: (emoji: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const EmojiPickerComponent: React.FC<EmojiPickerComponentProps> = ({
  onEmojiSelect,
  isOpen,
  onClose
}) => {
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen) {
      // Position picker above the trigger button
      setPickerPosition({
        top: -350, // Height of emoji picker
        left: -150  // Center it
      });
    }
  }, [isOpen]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="absolute z-50 shadow-2xl rounded-lg overflow-hidden"
      style={{ 
        top: pickerPosition.top, 
        left: pickerPosition.left,
        transform: 'translateX(-50%)'
      }}
    >
      <div className="bg-white border border-gray-200 rounded-lg">
        <EmojiPicker
          onEmojiClick={handleEmojiClick}
          width={320}
          height={350}
          previewConfig={{
            showPreview: false
          }}
          skinTonesDisabled
          searchPlaceholder="Search emojis..."
        />
      </div>
      
      {/* Backdrop to close picker when clicking outside */}
      <div 
        className="fixed inset-0 z-[-1]" 
        onClick={onClose}
      />
    </div>
  );
};

// Quick emoji buttons for common emojis
export const QuickEmojiBar: React.FC<{ onEmojiSelect: (emoji: string) => void }> = ({
  onEmojiSelect
}) => {
  const quickEmojis = ['😀', '😂', '❤️', '👍', '👎', '😮', '😢', '😡', '🎉', '🔥'];

  return (
    <div className="flex space-x-1 p-2 bg-gray-50 rounded-lg">
      {quickEmojis.map((emoji, index) => (
        <button
          key={index}
          onClick={() => onEmojiSelect(emoji)}
          className="text-xl hover:bg-gray-200 rounded p-1 transition-colors"
          title={`Add ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

export default EmojiPickerComponent;
