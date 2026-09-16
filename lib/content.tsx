import { createContext, useContext, type ReactNode } from 'react';
import { list, text, useContent, type ContentField, type ContentValues } from '@kit';
import manifest from '../site.manifest.json';

/** Contenus éditables du site (app Rekvo → Site & CMS → Contenus). */
export const MANIFEST = manifest as ContentField[];

const Ctx = createContext<ContentValues>({});

export function ContentProvider({ children }: { children: ReactNode }) {
  const values = useContent(MANIFEST);
  return <Ctx.Provider value={values}>{children}</Ctx.Provider>;
}

export function useSiteContent() {
  const v = useContext(Ctx);
  return { c: (key: string) => text(v, key), cl: (key: string) => list(v, key) };
}
