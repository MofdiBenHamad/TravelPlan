import { useEffect, useState, useRef } from 'react'
import { api } from '../../api/client.js'
import Pagination from '../../components/Pagination.jsx'
import './AdminMessages.css'

export default function AdminMessages() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState(null)

  // Pagination (5 messages par page)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5
  const listRef = useRef(null)

  async function load() {
    const res = await api.get('/admin/messages')
    if (res.ok) setMessages(res.data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleOpen(m) {
    setOpenId(openId === m.id ? null : m.id)
    if (!m.read) {
      await api.put(`/admin/messages/${m.id}/read`)
      setMessages((prev) => prev.map((msg) => (msg.id === m.id ? { ...msg, read: true } : msg)))
    }
  }

  const totalItems = messages.length
  const paginatedMessages = messages.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="admin-page-content">
      <div className="admin-page-header">
        <span className="eyebrow">Messagerie</span>
        <h1>Messages reçus</h1>
      </div>
      {loading ? (
        <p>Chargement…</p>
      ) : messages.length === 0 ? (
        <div className="empty-state">
          <p>Aucun message pour le moment.</p>
        </div>
      ) : (
        <>
          <div ref={listRef} className="messages-list">
            {paginatedMessages.map((m) => (
              <div key={m.id} className={`message-card ticket ${!m.read ? 'is-unread' : ''}`}>
                <button className="message-head" onClick={() => handleOpen(m)}>
                  <div>
                    {!m.read && <span className="message-dot" />}
                    <strong>{m.subject}</strong>
                    <span className="message-from">{m.name} — {m.email}</span>
                  </div>
                  <span className="message-date">
                    {new Date(m.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </button>
                {openId === m.id && <p className="message-body">{m.message}</p>}
              </div>
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemLabel="messages"
            tableRef={listRef}
          />
        </>
      )}
    </div>
  )
}