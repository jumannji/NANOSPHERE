'use client'

import { useState, type FormEvent } from 'react'

// Delivers to nanosphere@pm.me via the Formspree form configured for
// that inbox — no server code/secrets needed on our side.
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xlgqeyae'

type Status = 'idle' | 'sending' | 'sent' | 'error'

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setStatus('sending')

    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      })
      if (res.ok) {
        setStatus('sent')
        form.reset()
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div className="contact-form-confirmation">
        Received @ Nanosphere Headquarters
      </div>
    )
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <input
        className="contact-form-input"
        type="email"
        name="email"
        placeholder="Your email"
        aria-label="Your email address"
        required
      />
      <input
        className="contact-form-input"
        type="text"
        name="subject"
        placeholder="Subject"
        aria-label="Subject"
        required
      />
      <textarea
        className="contact-form-textarea"
        name="message"
        placeholder="Your message"
        aria-label="Message"
        rows={6}
        required
      />

      {status === 'error' && (
        <p className="contact-form-error">
          Something went wrong — try again, or email us directly.
        </p>
      )}

      <button type="submit" className="contact-form-submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send'}
      </button>
    </form>
  )
}
