// src/lib/pax.ts
// PAX CONTENT LIBRARY — V1
// Responses displayed verbatim. No AI modification permitted in V1.

export const PAX_RESPONSES: Record<string, { label: string; emoji: string; text: string }> = {
  PAX_NOT_GREAT: {
    label: 'Not Great',
    emoji: '😔',
    text: "When a conversation fades or feels off, it can be easy to assign meaning where there may not be any. Some interactions simply don't gain traction — and that reflects the dynamic, not your worth. The clarity you're looking for may not be in the conversation. It may be in deciding what you're willing to invest in next.",
  },
  PAX_GOOD: {
    label: 'Good',
    emoji: '🙂',
    text: "A conversation that feels natural is worth noticing. It doesn't guarantee anything — but it does tell you something about what ease can feel like. The goal isn't to hold onto that feeling. It's to recognize it, and use that recognition to inform what you choose to pursue.",
  },
  PAX_NEUTRAL: {
    label: 'Neutral',
    emoji: '😐',
    text: "Not every interaction leaves a clear impression — and that's information too. Neutrality often means there wasn't enough signal yet to form a real read. Before drawing conclusions, it's worth asking: was there enough exchange to actually evaluate? Sometimes neutral simply means incomplete.",
  },
  PAX_CONFUSED: {
    label: 'Confused',
    emoji: '🤔',
    text: "When someone's words and behavior don't align, confusion is a reasonable response. The gap between what people say and what they do is often where the most important information lives. Rather than resolving the confusion by choosing one over the other, stay with the question: what is this person actually showing you?",
  },
  PAX_DISAPPOINTED: {
    label: 'Disappointed',
    emoji: '😞',
    text: "Disappointment usually means you arrived with something — an expectation, a hope, an image of how this could go. That's not a flaw. But it's worth separating what you expected from what was actually there. The distance between those two things is where the real evaluation happens.",
  },
  PAX_INTRO_ORIENTATION: {
    label: 'Introduction',
    emoji: '✨',
    text: "When we're disappointed, it's easy to make ourselves the explanation. Sometimes the most useful first step is recognizing there may not be enough information yet to draw a conclusion.",
  },
}

export const EMOTION_OPTIONS = [
  { id: 'PAX_GOOD', label: 'Good', emoji: '🙂' },
  { id: 'PAX_NEUTRAL', label: 'Neutral', emoji: '😐' },
  { id: 'PAX_NOT_GREAT', label: 'Not Great', emoji: '😔' },
  { id: 'PAX_CONFUSED', label: 'Confused', emoji: '🤔' },
  { id: 'PAX_DISAPPOINTED', label: 'Disappointed', emoji: '😞' },
]
