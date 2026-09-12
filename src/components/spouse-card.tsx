"use client";

import { useState } from 'react';
import Link from 'next/link';
import {
  Heart,
  Phone,
  WhatsappLogo,
  UserCheck,
  Plus,
  PencilSimple,
  ArrowUpRight,
  ShieldCheck,
  Church
} from '@phosphor-icons/react';
import type { Person, SpouseInfo } from '@/lib/types';
import { ManageSpouseModal } from './manage-spouse-modal';

interface SpouseCardProps {
  person: Person;
  couple?: {
    id: string;
    legacy_id?: string | null;
    start_text?: string | null;
    end_text?: string | null;
    notes?: string | null;
    spouse?: SpouseInfo | null;
  } | null;
  isStaff: boolean;
}

export function SpouseCard({ person, couple, isStaff }: SpouseCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const spouse = couple?.spouse;

  // Formatar link para WhatsApp se tiver número
  const whatsappUrl = spouse?.phone
    ? `https://wa.me/55${spouse.phone.replace(/\D/g, '')}`
    : null;

  return (
    <section className="panel" style={{ padding: '20px' }}>
      <div className="panel-heading" style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span className="section-kicker">FAMÍLIA & MATRIMÔNIO</span>
          <h2 style={{ fontSize: '1.15rem', margin: '2px 0 0 0' }}>Vínculo Conjugal</h2>
        </div>

        {isStaff && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="button button-secondary"
            style={{ fontSize: '0.78rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            {spouse ? (
              <>
                <PencilSimple size={14} /> Alterar Cônjuge
              </>
            ) : (
              <>
                <Plus size={14} /> Vincular Cônjuge
              </>
            )}
          </button>
        )}
      </div>

      {spouse ? (
        <div
          style={{
            background: 'linear-gradient(to bottom, #fdf8f6 0%, #ffffff 100%)',
            border: '1px solid #fed7aa',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#fef2f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #fecaca',
                }}
              >
                <Heart size={22} weight="fill" color="#dc2626" />
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase' }}>
                  CÔNJUGE REGISTRADO
                </span>
                <h3 style={{ fontSize: '1.1rem', margin: '2px 0 0 0', color: 'var(--text-main)' }}>
                  <Link
                    href={`/pessoas/${spouse.id}`}
                    style={{ color: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    {spouse.name}
                    <ArrowUpRight size={15} color="var(--brand-primary)" />
                  </Link>
                </h3>
              </div>
            </div>

            {couple?.legacy_id && (
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  background: 'var(--brand-light)',
                  color: 'var(--brand-text)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                }}
              >
                {couple.legacy_id}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            {spouse.legacy_id && (
              <div>
                <strong>Código:</strong> {spouse.legacy_id}
              </div>
            )}

            {spouse.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={14} /> {spouse.phone}
                </span>
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '0.74rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#15803d',
                      background: '#f0fdf4',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      fontWeight: 600,
                    }}
                  >
                    <WhatsappLogo size={14} weight="fill" /> WhatsApp
                  </a>
                )}
              </div>
            )}

            {spouse.parish && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Church size={14} /> {spouse.parish}
              </div>
            )}

            {couple?.start_text && (
              <div style={{ marginTop: '4px', fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                Vínculo ativo desde {couple.start_text}
              </div>
            )}

            {couple?.notes && (
              <div style={{ fontSize: '0.76rem', color: 'var(--text-subtle)', fontStyle: 'italic', marginTop: '2px' }}>
                Obs: {couple.notes}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: '20px',
            textAlign: 'center',
            background: 'var(--bg-canvas)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-base)',
          }}
        >
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
            Nenhum cônjuge vinculado neste cadastro.
          </p>
          {isStaff && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="button button-secondary"
              style={{ fontSize: '0.8rem' }}
            >
              <Plus size={15} /> Vincular Cônjuge
            </button>
          )}
        </div>
      )}

      {/* Modal de gerenciamento */}
      <ManageSpouseModal
        person={person}
        currentCouple={couple}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </section>
  );
}
