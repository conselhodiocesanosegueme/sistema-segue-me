"use client";

import { useState } from 'react';
import { Plus } from '@phosphor-icons/react';
import { NewEncounterModal } from './new-encounter-modal';

interface EncountersHeaderActionsProps {
  defaultParish?: string | null;
}

export function EncountersHeaderActions({ defaultParish }: EncountersHeaderActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="button button-primary"
      >
        <Plus size={18} />
        Cadastrar Encontro
      </button>

      <NewEncounterModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        defaultParish={defaultParish}
      />
    </>
  );
}
