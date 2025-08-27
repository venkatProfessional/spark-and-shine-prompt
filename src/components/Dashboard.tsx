import React from 'react';
import { Layout } from './Layout';
import { PromptEditor } from './PromptEditor';

export const Dashboard: React.FC = () => {
  return (
    <Layout>
      <PromptEditor />
    </Layout>
  );
};