/**
 * MODAL REUTILIZABLE - Para dialogs, formularios, etc
 * Componente versátil para modals profesionales
 */

'use client';

import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: ReactNode;
}

export function Modal({
  isOpen,
  title,
  onClose,
  children,
  size = 'md',
  footer,
}: ModalProps) {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className={`bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border-2 border-slate-700 ${sizes[size]} w-full animate-fade-in`}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-slate-700 flex gap-3 justify-end bg-slate-900 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
