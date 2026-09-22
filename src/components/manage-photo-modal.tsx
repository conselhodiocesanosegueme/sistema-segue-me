'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Trash, UploadSimple, CircleNotch, WarningCircle, CheckCircle, X } from '@phosphor-icons/react';
import { Avatar } from '@/components/ui';

interface ManagePhotoModalProps {
  personId: string;
  personName: string;
  currentPhotoUrl?: string | null;
  buttonLabel?: string;
  compact?: boolean;
}

export function ManagePhotoModal({
  personId,
  personName,
  currentPhotoUrl,
  buttonLabel,
  compact = false,
}: ManagePhotoModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activePhoto = previewUrl || currentPhotoUrl;

  const handleOpen = () => {
    setFile(null);
    setPreviewUrl(null);
    setError(null);
    setSuccess(null);
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isUploading) return;
    setIsOpen(false);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(null);
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith('image/')) {
      setError('Por favor, selecione um arquivo de imagem válido (JPG, PNG ou WebP).');
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 5MB.');
      return;
    }

    setFile(selected);
    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Selecione uma imagem antes de salvar.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await fetch(`/api/people/${personId}/photo`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao enviar foto.');
      }

      setSuccess('Foto de perfil salva com sucesso!');
      router.refresh();
      setTimeout(() => {
        setIsOpen(false);
        window.location.reload();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Falha ao salvar a imagem. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Deseja realmente remover esta foto de perfil?')) return;

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('action', 'remove');

      const res = await fetch(`/api/people/${personId}/photo`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao remover foto.');
      }

      setPreviewUrl(null);
      setFile(null);
      setSuccess('Foto de perfil removida com sucesso.');
      router.refresh();
      setTimeout(() => {
        setIsOpen(false);
        window.location.reload();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Falha ao remover a foto.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      {/* Botão de disparo */}
      {compact ? (
        <button
          type="button"
          onClick={handleOpen}
          className="button button-subtle"
          style={{
            padding: '6px 10px',
            fontSize: '0.82rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            borderRadius: '20px',
          }}
          title="Alterar foto de perfil"
        >
          <Camera size={16} weight="bold" />
          <span>{buttonLabel || (currentPhotoUrl ? 'Alterar foto' : 'Adicionar foto')}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleOpen}
          className="button button-subtle"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.88rem',
            fontWeight: 600,
            borderRadius: 'var(--radius-md)',
            padding: '8px 14px',
          }}
        >
          <Camera size={18} weight="bold" style={{ color: 'var(--brand-primary)' }} />
          <span>{buttonLabel || (currentPhotoUrl ? 'Alterar Foto' : 'Adicionar Foto de Perfil')}</span>
        </button>
      )}

      {/* Modal de Gerenciamento */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          onClick={handleClose}
        >
          <div
            style={{
              backgroundColor: 'var(--surface-primary, #ffffff)',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              animation: 'fadeIn 0.2s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fechar */}
            <button
              onClick={handleClose}
              disabled={isUploading}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-subtle)',
                padding: '4px',
              }}
              aria-label="Fechar modal"
            >
              <X size={20} />
            </button>

            {/* Cabeçalho */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--text-main)', margin: '0 0 6px' }}>
                Foto de Perfil
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
                {personName}
              </p>
            </div>

            {/* Preview do Avatar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '20px 0' }}>
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  border: '3px solid var(--brand-primary, #b45309)',
                  padding: '3px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 4px 12px rgba(180, 83, 9, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {activePhoto ? (
                  <img
                    src={activePhoto}
                    alt={personName}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '50%',
                      aspectRatio: '1 / 1',
                      display: 'block',
                    }}
                  />
                ) : (
                  <Avatar name={personName} large />
                )}
              </div>

              {previewUrl && (
                <span style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', fontWeight: 600, marginTop: '8px' }}>
                  Prévia da nova foto selecionada
                </span>
              )}
            </div>

            {/* Seleção de Arquivo */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="button button-subtle"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '12px',
                  gap: '8px',
                  border: '1.5px dashed var(--border-medium)',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                }}
              >
                <UploadSimple size={20} />
                <span>{file ? 'Escolher outra imagem…' : 'Selecionar imagem do dispositivo'}</span>
              </button>

              <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textAlign: 'center', margin: 0 }}>
                Formatos aceitos: JPG, PNG ou WebP (máx. 5MB). O recorte será ajustado automaticamente em formato circular.
              </p>
            </div>

            {/* Mensagens de Feedback */}
            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  marginBottom: '16px',
                }}
              >
                <WarningCircle size={18} weight="bold" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#15803d',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  marginBottom: '16px',
                }}
              >
                <CheckCircle size={18} weight="bold" />
                <span>{success}</span>
              </div>
            )}

            {/* Ações */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
              {currentPhotoUrl && !file && (
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={isUploading}
                  className="button button-subtle"
                  style={{
                    color: 'var(--status-danger, #dc2626)',
                    borderColor: 'transparent',
                    marginRight: 'auto',
                    padding: '10px 14px',
                    fontSize: '0.85rem',
                    gap: '6px',
                  }}
                >
                  <Trash size={16} />
                  <span>Remover foto</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleClose}
                disabled={isUploading}
                className="button button-subtle"
                style={{ padding: '10px 16px', fontSize: '0.9rem' }}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="button button-primary"
                style={{
                  padding: '10px 20px',
                  fontSize: '0.9rem',
                  gap: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                {isUploading ? <CircleNotch size={18} className="spin" /> : <CheckCircle size={18} />}
                <span>{isUploading ? 'Salvando…' : 'Salvar Foto'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
