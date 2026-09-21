"use client";

import React, { useState, useRef } from 'react';
import {
  IdentificationCard,
  PaperPlaneTilt,
  ShieldCheck,
  User,
  Phone,
  Church,
  CalendarBlank,
  Heart,
  Sparkle,
  Info,
  Camera,
  UploadSimple,
  Trash,
} from '@phosphor-icons/react';
import { SubmitButton, Feedback, post } from '@/components/ui';
import { DIOCESAN_SECTORS } from '@/lib/sectors';

interface IdentityRequestFormProps {
  defaultName?: string;
}

export function IdentityRequestForm({ defaultName = '' }: IdentityRequestFormProps = {}) {
  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState('');
  const [parish, setParish] = useState('');
  const [condition, setCondition] = useState<'Jovem' | 'Casal'>('Jovem');
  const [spouseName, setSpouseName] = useState('');

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState('1ª Etapa');
  const [vivenciouParish, setVivenciouParish] = useState('');
  const [vivenciouYear, setVivenciouYear] = useState('');
  const [circleColor, setCircleColor] = useState('');

  const [workedSummary, setWorkedSummary] = useState('');
  const [mandatesSummary, setMandatesSummary] = useState('');
  const [notes, setNotes] = useState('');
  const [lgpdAccepted, setLgpdAccepted] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Lista de paróquias conhecidas com cidade para autocompletar
  const allParishes = Array.from(
    new Set(
      DIOCESAN_SECTORS.flatMap((s) =>
        s.parishes.map((p) => {
          const cleanCity = p.city.replace(/ - GO/g, '').replace(/\/GO/g, '');
          return `${p.name} — ${cleanCity}`;
        })
      )
    )
  ).sort();

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione uma imagem válida (JPEG, PNG ou WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('A foto de perfil deve ter no máximo 5MB.');
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');

    try {
      const nameParts = name.trim().split(/\s+/).filter(Boolean);
      if (nameParts.length < 2) {
        throw new Error('Por favor, informe seu nome e sobrenome completos (como costumava constar no quadrante ou crachá).');
      }

      if (condition === 'Casal') {
        const spouseParts = spouseName.trim().split(/\s+/).filter(Boolean);
        if (spouseParts.length < 2) {
          throw new Error('Por favor, informe o nome e sobrenome completos do seu cônjuge.');
        }
      }

      if (!vivenciouParish.trim()) throw new Error('Informe a paróquia onde você vivenciou o Segue-me.');
      if (!vivenciouYear.trim()) throw new Error('Informe o ano em que você vivenciou o encontro.');
      if (!lgpdAccepted) throw new Error('É necessário concordar com os termos da LGPD para enviar seu histórico.');

      let uploadedPhotoUrl = '';

      if (photoFile) {
        try {
          const photoFormData = new FormData();
          photoFormData.append('photo', photoFile);

          const photoRes = await fetch('/api/upload-avatar', {
            method: 'POST',
            body: photoFormData,
          });

          if (photoRes.ok) {
            const photoData = await photoRes.json();
            uploadedPhotoUrl = photoData.url || '';
          }
        } catch (uploadErr) {
          console.warn('Falha no upload da foto, continuando envio do cadastro:', uploadErr);
        }
      }

      await post('/api/identity', {
        name: name.trim(),
        phone: phone.trim(),
        parish: parish.trim(),
        condition,
        spouse_name: condition === 'Casal' ? spouseName.trim() : undefined,
        vivenciou_stage: stage,
        vivenciou_parish: vivenciouParish.trim(),
        vivenciou_year: vivenciouYear.trim(),
        vivenciou_circle: circleColor.trim(),
        worked_history: workedSummary.trim(),
        mandates_history: mandatesSummary.trim(),
        notes: notes.trim(),
        photo_url: uploadedPhotoUrl,
        lgpd_accepted: true,
      });

      setSuccess('Solicitação enviada com sucesso! O Conselho Diocesano fará a conferência nos quadrantes oficiais. Você receberá um e-mail de notificação assim que seu histórico for validado.');
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar solicitação.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Feedback message={error} error />
      <Feedback message={success} />

      {/* BLOCO 1: DADOS PESSOAIS */}
      <div style={{ background: '#ffffff', border: '1px solid var(--border-base)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
          <User size={20} color="var(--brand-primary)" weight="bold" />
          <h3 style={{ margin: 0, fontSize: '0.96rem', color: 'var(--text-main)' }}>1. Seus Dados Pessoais</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* UPLOAD DE FOTO DE ROSTO DA GALERIA */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid var(--border-base)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  border: photoPreview ? '3px solid var(--brand-primary)' : '2px dashed var(--brand-primary)',
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
                title="Clique para escolher foto da galeria"
              >
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Foto de perfil"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--brand-primary)' }}>
                    <Camera size={28} />
                    <span style={{ fontSize: '0.68rem', fontWeight: 600, marginTop: '2px' }}>Foto</span>
                  </div>
                )}
              </div>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoSelect}
                  style={{ display: 'none' }}
                />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="button button-secondary"
                    style={{ fontSize: '0.76rem', padding: '5px 12px', height: 'auto', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <UploadSimple size={14} />
                    {photoPreview ? 'Trocar Foto' : 'Escolher Foto da Galeria'}
                  </button>
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="button button-secondary"
                      style={{ fontSize: '0.76rem', padding: '5px 10px', height: 'auto', color: '#dc2626' }}
                      title="Remover foto"
                    >
                      <Trash size={14} />
                    </button>
                  )}
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', display: 'block', marginTop: '6px' }}>
                  📸 Sua foto de rosto ajuda o Conselho a reconhecer você e validar seu histórico com agilidade.
                </span>
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '5px' }}>
              Nome Completo *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite seu nome e sobrenomes completos"
              required
              className="filter-input"
              style={{ width: '100%' }}
            />
            {name.trim() && name.trim().split(/\s+/).filter(Boolean).length < 2 && (
              <span style={{ fontSize: '0.75rem', color: '#b45309', display: 'block', marginTop: '4px', fontWeight: 500 }}>
                ⚠️ Por favor, informe seu nome e sobrenome completos.
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '5px' }}>
                WhatsApp / Telefone *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(62) 99999-9999"
                required
                className="filter-input"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '5px' }}>
                Paróquia que Frequenta Atualmente
              </label>
              <input
                type="text"
                list="parishes-list"
                value={parish}
                onChange={(e) => setParish(e.target.value)}
                placeholder="Ex: São Francisco de Assis"
                className="filter-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
              Condição no Movimento
            </label>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.86rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="condition"
                  checked={condition === 'Jovem'}
                  onChange={() => setCondition('Jovem')}
                />
                ⚡ Jovem
              </label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.86rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="condition"
                  checked={condition === 'Casal'}
                  onChange={() => setCondition('Casal')}
                />
                💍 Casal (Casado na Igreja)
              </label>
            </div>
          </div>

          {condition === 'Casal' && (
            <div style={{ padding: '12px', background: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '5px' }}>
                Nome do Esposo / Esposa *
              </label>
              <input
                type="text"
                value={spouseName}
                onChange={(e) => setSpouseName(e.target.value)}
                placeholder="Nome e sobrenome completos do cônjuge"
                required={condition === 'Casal'}
                className="filter-input"
                style={{ width: '100%' }}
              />
              {spouseName.trim() && spouseName.trim().split(/\s+/).filter(Boolean).length < 2 && (
                <span style={{ fontSize: '0.75rem', color: '#b45309', display: 'block', marginTop: '4px', fontWeight: 500 }}>
                  ⚠️ Por favor, informe o nome e sobrenome completos do cônjuge.
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* BLOCO 2: ENCONTRO VIVENCIADO */}
      <div style={{ background: '#ffffff', border: '1px solid var(--border-base)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
          <Sparkle size={20} color="var(--brand-primary)" weight="bold" />
          <h3 style={{ margin: 0, fontSize: '0.96rem', color: 'var(--text-main)' }}>2. Onde e Quando Vivenciou</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '5px' }}>
                Etapa do Encontro *
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="filter-input"
                style={{ width: '100%' }}
              >
                <option value="1ª Etapa">1ª Etapa (Paroquial)</option>
                <option value="2ª Etapa">2ª Etapa (Diocesano)</option>
                <option value="Retiro Mariano">Retiro Mariano (Diocesano)</option>
                <option value="Congresso Eucarístico">Congresso Eucarístico</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '5px' }}>
                Ano em que Vivenciou *
              </label>
              <input
                type="number"
                min="1970"
                max="2030"
                value={vivenciouYear}
                onChange={(e) => setVivenciouYear(e.target.value)}
                placeholder="Ex: 2018"
                required
                className="filter-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '5px' }}>
                Paróquia onde Vivenciou *
              </label>
              <input
                type="text"
                list="parishes-list"
                value={vivenciouParish}
                onChange={(e) => setVivenciouParish(e.target.value)}
                placeholder="Ex: São Benedito e Imaculado Coração de Maria — Nerópolis"
                required
                className="filter-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '5px' }}>
                Círculo em que ficou (Opcional)
              </label>
              <input
                type="text"
                value={circleColor}
                onChange={(e) => setCircleColor(e.target.value)}
                placeholder="Ex: Círculo Vermelho"
                className="filter-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* BLOCO 3: ENCONTROS TRABALHADOS & MANDATOS */}
      <div style={{ background: '#ffffff', border: '1px solid var(--border-base)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
          <Church size={20} color="var(--brand-primary)" weight="bold" />
          <h3 style={{ margin: 0, fontSize: '0.96rem', color: 'var(--text-main)' }}>3. Encontros em que Trabalhou (Se houver)</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '5px' }}>
              Equipes de Trabalho que Serviu
            </label>
            <textarea
              value={workedSummary}
              onChange={(e) => setWorkedSummary(e.target.value)}
              placeholder="Ex: Trabalhei na Cozinha em 2019 na São Francisco; trabalhei na Sala em 2021 em Nerópolis; Animação em 2022..."
              rows={3}
              className="filter-input"
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '5px' }}>
              Mandatos de Liderança (Equipe Dirigente, Setorial ou Conselho)
            </label>
            <input
              type="text"
              value={mandatesSummary}
              onChange={(e) => setMandatesSummary(e.target.value)}
              placeholder="Ex: Fui da Equipe Dirigente da São Pedro em 2020-2021, Jovem Setorial em 2022..."
              className="filter-input"
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>

      {/* BLOCO 4: TERMO DE CONSCIENTIZAÇÃO E SEGURANÇA */}
      <div
        style={{
          background: '#fffbeb',
          border: '1.5px solid #fde68a',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 20px',
          boxShadow: '0 2px 6px rgba(180, 83, 9, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <ShieldCheck size={26} color="#b45309" weight="fill" />
          <strong style={{ fontSize: '0.95rem', color: '#92400e' }}>
            Conferência Obrigatória pela Coordenação Diocesana
          </strong>
        </div>

        <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#78350f', lineHeight: '1.5' }}>
          O Sistema Segue-me da Diocese de Anápolis é a base histórica oficial e seu acesso é <strong>estritamente restrito a quem vivenciou o encontro</strong>.
        </p>

        <p style={{ margin: 0, fontSize: '0.83rem', color: '#92400e', lineHeight: '1.5' }}>
          🔍 Todos os dados que você preencheu serão <strong>conferidos minuciosamente com os quadrantes originais arquivados</strong> pelo Conselho Diocesano antes de liberar seu acesso. Assim que a conferência for concluída, você receberá um <strong>e-mail oficial confirmando a liberação do seu histórico</strong>.
        </p>
      </div>

      {/* TERMO LGPD */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid var(--border-base)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-start',
        }}
      >
        <input
          type="checkbox"
          id="lgpd-consent-identity"
          checked={lgpdAccepted}
          onChange={(e) => setLgpdAccepted(e.target.checked)}
          style={{ marginTop: '3px', cursor: 'pointer' }}
          required
        />
        <label
          htmlFor="lgpd-consent-identity"
          style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: '1.4', cursor: 'pointer' }}
        >
          Concordo com o tratamento dos meus dados cadastrais e imagem nos termos da Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018), exclusivamente para fins de localização, conferência histórica e identificação no Movimento Segue-me da Diocese de Anápolis.
        </label>
      </div>

      {/* BOTÃO DE ENVIO */}
      <div style={{ display: 'flex' }}>
        <SubmitButton busy={busy} type="submit" className="button-primary" disabled={busy || !lgpdAccepted}>
          <PaperPlaneTilt size={18} />
          Enviar meu histórico para validação do Conselho Diocesano
        </SubmitButton>
      </div>

      {/* Datalist com paróquias para facilitar preenchimento */}
      <datalist id="parishes-list">
        {allParishes.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
    </form>
  );
}
