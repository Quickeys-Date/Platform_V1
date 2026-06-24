// src/components/CloseConversationModal.tsx
'use client'

export function CloseConversationModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div
      className="absolute inset-0 bg-black/50 flex items-end z-50"
      onClick={onCancel}
    >
      <div
        className="w-full bg-white rounded-t-3xl p-6 pb-10 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-9 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <div className="text-3xl text-center mb-3">💬</div>
        <h2 className="font-bold text-lg text-center mb-2">
          Are you ready to close this conversation?
        </h2>
        <p className="text-gray-500 text-sm text-center leading-relaxed mb-7">
          Once closed, this conversation will be saved to your archive. You can
          read it later but will not be able to continue it.
        </p>
        <button
          onClick={onConfirm}
          className="w-full bg-black text-white py-4 rounded-xl font-semibold mb-3"
        >
          Yes, Close It
        </button>
        <button onClick={onCancel} className="w-full py-3 text-gray-500 font-medium">
          Not Yet
        </button>
      </div>
    </div>
  )
}
