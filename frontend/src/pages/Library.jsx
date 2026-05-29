import React, { useContext } from 'react';
import { BookOpen, Sparkles, Info, Trash2 } from 'lucide-react';
import { AppContext } from '../context/AppContext';

export default function Library() {
  const {
    handleAddBook,
    bookTitle,
    setBookTitle,
    bookAuthor,
    setBookAuthor,
    bookSphere,
    setBookSphere,
    bookGoal,
    setBookGoal,
    bookPages,
    setBookPages,
    bookDepth,
    setBookDepth,
    addingBook,
    bookFilter,
    setBookFilter,
    books,
    loadingBooks,
    handleToggleBook,
    handleDeleteBook
  } = useContext(AppContext);

  return (
    <div className="library-grid">
      {/* Left Column: Add Book Form */}
      <div className="glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={20} style={{ color: 'var(--color-personal)' }} />
          Adicionar Novo Livro
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
          Cadastre um livro para sua biblioteca. A Inteligência Artificial calculará o XP com base na complexidade técnica (Educacional) ou no tamanho e objetivo (Pessoal).
        </p>

        <form onSubmit={handleAddBook} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label htmlFor="bookTitleInput">Título do Livro</label>
            <input
              id="bookTitleInput"
              type="text"
              placeholder="ex: Código Limpo / O Poder do Hábito"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="bookAuthorInput">Autor</label>
            <input
              id="bookAuthorInput"
              type="text"
              placeholder="ex: Robert C. Martin / Charles Duhigg"
              value={bookAuthor}
              onChange={(e) => setBookAuthor(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="bookSphereSelect">Esfera</label>
            <select
              id="bookSphereSelect"
              value={bookSphere}
              onChange={(e) => {
                setBookSphere(e.target.value);
                setBookGoal('');
                setBookPages('');
                setBookDepth('Iniciante');
              }}
            >
              <option value="Pessoal">🟢 Pessoal (Leitura Geral, Hábitos, Hobbies)</option>
              <option value="Educacional">🎓 Educacional (Didáticos, Cursos, Técnicos)</option>
            </select>
          </div>

          {bookSphere === 'Pessoal' ? (
            <>
              <div className="form-group">
                <label htmlFor="bookPagesInput">Número de Páginas</label>
                <input
                  id="bookPagesInput"
                  type="number"
                  placeholder="ex: 350"
                  min="1"
                  value={bookPages}
                  onChange={(e) => setBookPages(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="bookGoalInput">Objetivo Central / Relevância</label>
                <textarea
                  id="bookGoalInput"
                  rows="3"
                  placeholder="ex: Melhorar produtividade e criar rotinas de estudos diárias."
                  value={bookGoal}
                  onChange={(e) => setBookGoal(e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="bookGoalInputEdu">Assunto / Tema Didático</label>
                <input
                  id="bookGoalInputEdu"
                  type="text"
                  placeholder="ex: Estruturas de Dados / Arquitetura de Software"
                  value={bookGoal}
                  onChange={(e) => setBookGoal(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="bookDepthSelect">Grau Técnico / Profundidade</label>
                <select
                  id="bookDepthSelect"
                  value={bookDepth}
                  onChange={(e) => setBookDepth(e.target.value)}
                >
                  <option value="Iniciante">Iniciante (Conceitos básicos, introdução)</option>
                  <option value="Intermediário">Intermediário (Aplicação prática, tópicos comuns)</option>
                  <option value="Avançado / Acadêmico">Avançado / Acadêmico (Pesquisa, algoritmos complexos, denso)</option>
                </select>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={addingBook || !bookTitle}
            className="btn"
            style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Sparkles size={16} />
            {addingBook ? "Calculando XP com IA..." : "Adicionar Livro"}
          </button>
        </form>
      </div>

      {/* Right Column: Books List */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div className="books-filter-tabs">
          <button
            onClick={() => setBookFilter('interesse')}
            className={`books-filter-btn ${bookFilter === 'interesse' ? 'active' : ''}`}
          >
            Quero Ler ({books.filter(b => !b.completed).length})
          </button>
          <button
            onClick={() => setBookFilter('lido')}
            className={`books-filter-btn ${bookFilter === 'lido' ? 'active' : ''}`}
          >
            Lidos ({books.filter(b => b.completed).length})
          </button>
        </div>

        {loadingBooks ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Carregando biblioteca...
          </div>
        ) : books.filter(b => (bookFilter === 'lido' ? b.completed : !b.completed)).length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
            <BookOpen size={32} style={{ color: 'var(--border-highlight)', marginBottom: '12px', opacity: 0.5 }} />
            <p style={{ margin: 0 }}>Nenhum livro nesta categoria.</p>
            {bookFilter === 'interesse' && (
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Cadastre novos títulos à esquerda!
              </p>
            )}
          </div>
        ) : (
          <div className="books-grid">
            {books
              .filter(b => (bookFilter === 'lido' ? b.completed : !b.completed))
              .map((book) => {
                const isPersonal = book.sphere === 'Pessoal';
                return (
                  <div key={book.id} className={`glass-panel book-card ${isPersonal ? 'personal' : 'educational'}`}>
                    <div className="book-info-top">
                      <h4 className="book-title">{book.title}</h4>
                      <p className="book-author">por {book.author || 'Autor desconhecido'}</p>
                      
                      <div className="book-details-box">
                        <div>Esfera: <strong>{book.sphere}</strong></div>
                        {isPersonal ? (
                          <>
                            {book.pages && <div>Páginas: <strong>{book.pages}</strong></div>}
                            {book.goal && <div>Objetivo: <strong>{book.goal}</strong></div>}
                          </>
                        ) : (
                          <>
                            {book.goal && <div>Tema: <strong>{book.goal}</strong></div>}
                            {book.depth && <div>Nível: <strong>{book.depth}</strong></div>}
                          </>
                        )}
                      </div>
                      
                      {book.xp_reason && (
                        <p className="book-reasoning-box">
                          <Info size={12} style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>{book.xp_reason}</span>
                        </p>
                      )}
                    </div>

                    <div className="book-card-footer">
                      <span className={`book-xp-badge-col ${isPersonal ? 'personal' : 'educational'}`}>
                        +{book.xp} XP
                      </span>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          onClick={() => handleToggleBook(book.id, book.completed)}
                          className="btn"
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.8rem',
                            background: book.completed ? 'var(--bg-main)' : (isPersonal ? 'var(--grad-personal)' : 'var(--grad-educational)'),
                            border: book.completed ? '1px solid var(--border-color)' : 'none',
                            color: book.completed ? 'var(--text-secondary)' : 'white'
                          }}
                        >
                          {book.completed ? "Não Lido" : "Lido"}
                        </button>

                        <button
                          onClick={() => handleDeleteBook(book.id)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 8px', color: '#ff4d4d', borderColor: 'hsla(0, 80%, 40%, 0.3)' }}
                          title="Excluir livro"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
