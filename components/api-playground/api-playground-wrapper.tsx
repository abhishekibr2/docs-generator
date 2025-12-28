'use client';

import { ApiPlaygroundProvider, ApiPlayground, CurlCommandSidebar } from './api-playground';
import type { ApiPlaygroundPage } from '@/types';

export { CurlCommandSidebar };

interface ApiPlaygroundWrapperProps {
  page: ApiPlaygroundPage;
  children?: React.ReactNode;
}

export function ApiPlaygroundWrapper({ page, children }: ApiPlaygroundWrapperProps) {
  return (
    <ApiPlaygroundProvider page={page}>
      <ApiPlayground page={page} renderCurlInSidebar={true} />
      {children}
    </ApiPlaygroundProvider>
  );
}

