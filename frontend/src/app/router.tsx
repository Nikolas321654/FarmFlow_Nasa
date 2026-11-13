import { Route, Routes } from 'react-router-dom';
import { AddFieldPage } from '@/pages/add-field';
import { FieldExplorerPage } from '@/pages/field-explorer';
import { FieldInsightsPage } from '@/pages/field-insights';
import { NotFoundPage } from '@/pages/not-found';
import { AppShell } from '@/widgets/app-shell';

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<FieldExplorerPage />} />
        <Route path="fields/new" element={<AddFieldPage />} />
        <Route path="fields/:id" element={<FieldInsightsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
