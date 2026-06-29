'use client'
// CloseConversationModal — CR#1 & CR#2
// Archive = keeps profile accessible, read-only chat history
// Unmatch = permanent block for both users
// Two distinct functions, two distinct outcomes

export function CloseConversationModal({
  onArchive,
  onUnmatch,
  onCancel,
}: {
  onArchive: () => void
  onUnmatch: () => void
  onCancel: () => void
}) {
  return (
    <div className="absolute inset-0 bg-black/50 flex items-end z-50" onClick={onCancel}>
      <div className="w-full bg-white rounded-t-3xl p-6 pb-10 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="w-9 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <h2 className="font-bold text-lg text-center mb-6">What would you like to do?</h2>

        {/* Archive option */}
        <button onClick={onArchive}
          className="w-full border-[1.5px] border-gray-200 rounded-xl p-4 text-left mb-3 hover:border-gray-400 transition-colors">
          <div className="font-semibold text-sm mb-1">Archive conversation</div>
          <div className="text-xs text-gray-500 leading-relaxed">
            Ends the conversation and saves it to your archive. You can still view the chat history and their profile later.
          </div>
        </button>

        {/* Unmatch option */}
        <button onClick={onUnmatch}
          className="w-full border-[1.5px] border-red-100 rounded-xl p-4 text-left mb-4 hover:border-red-300 transition-colors">
          <div className="font-semibold text-sm mb-1 text-red-600">Unmatch</div>
          <div className="text-xs text-gray-500 leading-relaxed">
            Permanently removes this match for both of you. This cannot be undone.
          </div>
        </button>

        <button onClick={onCancel} className="w-full py-3 text-gray-500 font-medium text-sm">
          Cancel
        </button>
      </div>
    </div>
  )
}

export function UnmatchConfirmModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="absolute inset-0 bg-black/50 flex items-end z-50" onClick={onCancel}>
      <div className="w-full bg-white rounded-t-3xl p-6 pb-10 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="w-9 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <div className="text-3xl text-center mb-3">⚠️</div>
        <h2 className="font-bold text-lg text-center mb-2">Unmatch?</h2>
        <p className="text-gray-500 text-sm text-center leading-relaxed mb-7">
          This will permanently remove this match for both of you. Neither of you will be able to message each other again. This cannot be undone.
        </p>
        <button onClick={onConfirm}
          className="w-full bg-red-500 text-white py-4 rounded-xl font-semibold mb-3">
          Confirm — Unmatch
        </button>
        <button onClick={onCancel} className="w-full py-3 text-gray-500 font-medium">
          Cancel
        </button>
      </div>
    </div>
  )
}
