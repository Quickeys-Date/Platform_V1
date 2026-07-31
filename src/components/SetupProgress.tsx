const STEPS = ['Welcome', 'Create Account', 'Verify Age', 'Basic Info', 'Meet Pax']

export function SetupProgress({ active }: { active: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <ol className="setup-progress" aria-label="Account setup progress">
      {STEPS.map((step, index) => {
        const number = index + 1
        const state = number === active ? 'is-active' : number < active ? 'is-complete' : ''
        return (
          <li key={step} className={state} aria-current={number === active ? 'step' : undefined}>
            <span>{number}</span>
            <small>{step}</small>
          </li>
        )
      })}
    </ol>
  )
}
