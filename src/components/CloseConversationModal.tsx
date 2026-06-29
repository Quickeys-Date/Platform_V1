'use client'

export function CloseConversationModal({ onArchive, onUnmatch, onCancel }: {
  onArchive: () => void
  onUnmatch: () => void
  onCancel: () => void
}) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', zIndex: 50 }} onClick={onCancel}>
      <div style={{
        width: '100%', background: 'linear-gradient(160deg, #061B1E, #0A0A0A)',
        borderTop: '1px solid rgba(15,183,191,0.2)',
        borderRadius: '24px 24px 0 0', padding: '24px 20px 36px',
        animation: 'slideUp 0.25s ease',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, margin: '0 auto 20px' }} />
        <h2 style={{ fontWeight: 700, fontSize: 18, color: 'white', textAlign: 'center', marginBottom: 20 }}>
          What would you like to do?
        </h2>

        <button onClick={onArchive} style={{
          width: '100%', padding: 16, textAlign: 'left', marginBottom: 10,
          background: 'rgba(15,183,191,0.08)', border: '1px solid rgba(15,183,191,0.2)',
          borderRadius: 14, cursor: 'pointer',
        }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: '#0FB7BF', marginBottom: 4 }}>Archive conversation</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
            Ends the conversation and saves it to your archive. You can still view the chat history and their profile later.
          </div>
        </button>

        <button onClick={onUnmatch} style={{
          width: '100%', padding: 16, textAlign: 'left', marginBottom: 16,
          background: 'rgba(255,80,80,0.06)', border: '1px solid rgba(255,80,80,0.2)',
          borderRadius: 14, cursor: 'pointer',
        }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: '#ff6b6b', marginBottom: 4 }}>Unmatch</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
            Permanently removes this match for both of you. This cannot be undone.
          </div>
        </button>

        <button onClick={onCancel} style={{ width: '100%', padding: '12px 0', color: 'rgba(255,255,255,0.35)', fontSize: 14, fontWeight: 500, cursor: 'pointer', background: 'transparent', border: 'none' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export function UnmatchConfirmModal({ onConfirm, onCancel }: {
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', zIndex: 50 }} onClick={onCancel}>
      <div style={{
        width: '100%', background: 'linear-gradient(160deg, #061B1E, #0A0A0A)',
        borderTop: '1px solid rgba(255,80,80,0.2)',
        borderRadius: '24px 24px 0 0', padding: '24px 20px 36px',
        animation: 'slideUp 0.25s ease',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, margin: '0 auto 20px' }} />
        <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 12 }}>⚠️</div>
        <h2 style={{ fontWeight: 700, fontSize: 18, color: 'white', textAlign: 'center', marginBottom: 8 }}>Unmatch?</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center', lineHeight: 1.6, marginBottom: 24 }}>
          This will permanently remove this match for both of you. Neither of you will be able to message each other again. This cannot be undone.
        </p>
        <button onClick={onConfirm} style={{
          width: '100%', padding: 16, borderRadius: 14, marginBottom: 10,
          background: 'linear-gradient(135deg, #c0392b, #e74c3c)',
          color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer', border: 'none',
        }}>
          Confirm — Unmatch
        </button>
        <button onClick={onCancel} style={{ width: '100%', padding: '12px 0', color: 'rgba(255,255,255,0.35)', fontSize: 14, fontWeight: 500, cursor: 'pointer', background: 'transparent', border: 'none' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}
