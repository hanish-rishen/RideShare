// src/app/details/page.tsx
import React from 'react';
import { Details } from '@/components/CardWithForm';

const DetailsPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-100">
      <Details />
    </div>
  );
};

export default DetailsPage;
