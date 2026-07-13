'use client'

import { useState } from 'react'

interface Comment {
  id: string
  name: string
  text: string
}

// Local-only for now — nothing is persisted or sent anywhere. Wire this
// up to a real backend when one exists; the shape (name + text, newest
// last) is deliberately simple to make that swap easy.
export default function ArticleComments() {
  const [comments, setComments] = useState<Comment[]>([])
  const [name, setName] = useState('')
  const [text, setText] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    setComments(prev => [...prev, { id: crypto.randomUUID(), name: name.trim() || 'Anonymous', text: trimmed }])
    setText('')
  }

  return (
    <section className="comments">
      <h2 className="comments-heading">What Do You Think</h2>

      <form className="comments-form" onSubmit={handleSubmit}>
        <input
          className="comments-name-input"
          type="text"
          placeholder="Name (optional)"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={60}
        />
        <textarea
          className="comments-text-input"
          placeholder="Share your thoughts…"
          value={text}
          onChange={e => setText(e.target.value)}
          rows={3}
          maxLength={2000}
          required
        />
        <button type="submit" className="comments-submit">Post</button>
      </form>

      <div className="comments-list">
        {comments.length === 0 ? (
          <p className="comments-empty">Be the first to share your thoughts.</p>
        ) : (
          comments.map(c => (
            <div key={c.id} className="comment-item">
              <span className="comment-name">{c.name}</span>
              <p className="comment-text">{c.text}</p>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
