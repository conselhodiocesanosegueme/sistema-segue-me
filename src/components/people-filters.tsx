"use client";

import { useState } from 'react';
import Link from 'next/link';
import { CaretDown, Funnel, MagnifyingGlass, X } from '@phosphor-icons/react';

interface PeopleFiltersProps {
  parishes: string[];
  years: number[];
  filters: Record<string, string>;
  isParochialReviewer: boolean;
  parochialParish: string;
}

const QUICK_FILTERS = [
  { id: '', label: 'Todos' },
  { id: 'youth_vivenciou', label: 'Jovens que Vivenciaram' },
  { id: 'worked', label: 'Trabalharam nas Equipes' },
  { id: 'couples', label: 'Casais Atuantes / Tios' },
  { id: 'musicians', label: 'Músicos & Cantores', icon: '🎵' },
];

export function PeopleFilters({
  parishes,
  years,
  filters,
  isParochialReviewer,
  parochialParish,
}: PeopleFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedQuickFilter, setSelectedQuickFilter] = useState(filters.quickFilter || '');

  // Conta filtros ativos (exceto o q de busca rápida que já fica visível no input)
  const activeFilterKeys = Object.keys(filters).filter((k) => {
    if (k === 'q') return false;
    if (k === 'page') return false;
    if (k === 'pageSize') return false;
    if (isParochialReviewer && k === 'parish') return false;
    return Boolean(filters[k]);
  });
  const activeFilterCount = activeFilterKeys.length;
  const hasActiveFilters = activeFilterCount > 0 || Boolean(filters.q);

  // Monta URL para limpar todos os filtros
  const clearUrl = isParochialReviewer
    ? `/pessoas?parish=${encodeURIComponent(parochialParish)}`
    : '/pessoas';

  // Monta chips individuais para remoção rápida
  const activeChips: { key: string; label: string; removeUrl: string }[] = [];

  if (filters.quickFilter) {
    const qfObj = QUICK_FILTERS.find((q) => q.id === filters.quickFilter);
    const params = new URLSearchParams(filters);
    params.delete('quickFilter');
    params.delete('page');
    const qs = params.toString();
    activeChips.push({
      key: 'quickFilter',
      label: qfObj ? qfObj.label : filters.quickFilter,
      removeUrl: `/pessoas${qs ? `?${qs}` : ''}`,
    });
  }

  if (filters.parish && !isParochialReviewer) {
    const params = new URLSearchParams(filters);
    params.delete('parish');
    params.delete('page');
    const qs = params.toString();
    activeChips.push({
      key: 'parish',
      label: filters.parish,
      removeUrl: `/pessoas${qs ? `?${qs}` : ''}`,
    });
  }

  if (filters.year) {
    const params = new URLSearchParams(filters);
    params.delete('year');
    params.delete('page');
    const qs = params.toString();
    activeChips.push({
      key: 'year',
      label: `Ano: ${filters.year}`,
      removeUrl: `/pessoas${qs ? `?${qs}` : ''}`,
    });
  }

  if (filters.status) {
    const params = new URLSearchParams(filters);
    params.delete('status');
    params.delete('page');
    const qs = params.toString();
    activeChips.push({
      key: 'status',
      label: filters.status,
      removeUrl: `/pessoas${qs ? `?${qs}` : ''}`,
    });
  }

  return (
    <div className="people-filters-wrapper">
      <form method="get" action="/pessoas" className="people-filters-form">
        {/* Barra Principal: Busca + Botão Filtrar */}
        <div className="people-search-bar">
          <div className="people-input-box">
            <MagnifyingGlass size={18} className="people-search-icon" />
            <input
              type="search"
              name="q"
              defaultValue={filters.q || ''}
              placeholder="Buscar por nome ou código PES…"
              className="people-search-input"
              aria-label="Buscar pessoa por nome ou código PES"
            />
            <button type="submit" className="people-submit-btn" title="Buscar">
              <span className="people-btn-text">Buscar</span>
              <MagnifyingGlass size={15} className="people-btn-icon" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`button people-filter-btn ${activeFilterCount > 0 ? 'button-primary' : 'button-secondary'}`}
            aria-expanded={isOpen}
            aria-controls="people-filter-dropdown"
          >
            <Funnel size={16} weight={activeFilterCount > 0 ? 'fill' : 'regular'} />
            <span>Filtrar</span>
            {activeFilterCount > 0 && (
              <span className="people-filter-badge">{activeFilterCount}</span>
            )}
            <CaretDown size={13} className={`people-caret ${isOpen ? 'people-caret-open' : ''}`} />
          </button>
        </div>

        {/* Inputs ocultos para preservar filtros ao dar enter na busca */}
        <input type="hidden" name="quickFilter" value={selectedQuickFilter} />
        {isParochialReviewer && <input type="hidden" name="parish" value={parochialParish} />}

        {/* Painel de Opções Dobrável */}
        {isOpen && (
          <div id="people-filter-dropdown" className="people-filter-panel">
            {/* 1. Categorias / Perfis */}
            <div className="people-filter-section">
              <span className="people-section-title">Categoria / Perfil</span>
              <div className="people-pills-row">
                {QUICK_FILTERS.map((qf) => {
                  const isActive = selectedQuickFilter === qf.id;
                  return (
                    <button
                      key={qf.id}
                      type="button"
                      onClick={() => setSelectedQuickFilter(isActive && qf.id !== '' ? '' : qf.id)}
                      className={`people-pill ${isActive ? 'people-pill-active' : ''}`}
                    >
                      {qf.icon && <span style={{ marginRight: '4px' }}>{qf.icon}</span>}
                      {qf.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Seleções Avançadas */}
            <div className="people-selects-grid">
              {!isParochialReviewer && (
                <div className="people-field">
                  <label className="people-label">Paróquia:</label>
                  <select
                    name="parish"
                    defaultValue={filters.parish || ''}
                    className="filter-input people-select"
                  >
                    <option value="">Todas as paróquias</option>
                    {parishes.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="people-field">
                <label className="people-label">Ano:</label>
                <select
                  name="year"
                  defaultValue={filters.year || ''}
                  className="filter-input people-select"
                >
                  <option value="">Todos os anos</option>
                  {years.map((y) => (
                    <option key={y} value={String(y)}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div className="people-field">
                <label className="people-label">Situação:</label>
                <select
                  name="status"
                  defaultValue={filters.status || ''}
                  className="filter-input people-select"
                >
                  <option value="">Todas as situações</option>
                  <option value="Identificado">Identificado</option>
                  <option value="Dados incompletos">Dados incompletos</option>
                  <option value="Possível duplicidade">Possível duplicidade</option>
                  <option value="Pendente">Pendente</option>
                </select>
              </div>
            </div>

            {/* 3. Rodapé de Ações do Painel */}
            <div className="people-panel-actions">
              <button type="submit" className="button button-primary">
                <Funnel size={16} weight="fill" />
                Aplicar Filtros
              </button>
              {hasActiveFilters && (
                <Link
                  href={clearUrl}
                  className="button button-secondary"
                  onClick={() => setIsOpen(false)}
                >
                  <X size={15} />
                  Limpar
                </Link>
              )}
            </div>
          </div>
        )}
      </form>

      {/* Chips de Filtros Ativos (quando fechado) */}
      {activeChips.length > 0 && !isOpen && (
        <div className="people-chips-container">
          <span className="people-chips-title">Filtros:</span>
          {activeChips.map((chip) => (
            <Link key={chip.key} href={chip.removeUrl} className="people-chip" title="Remover este filtro">
              <span>{chip.label}</span>
              <X size={12} weight="bold" />
            </Link>
          ))}
          <Link href={clearUrl} className="people-chips-clear" title="Remover todos os filtros">
            Limpar tudo
          </Link>
        </div>
      )}
    </div>
  );
}
