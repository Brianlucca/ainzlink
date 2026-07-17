const AUTH_MESSAGES = {
  'auth/popup-blocked': 'O navegador bloqueou a janela de login. Permita pop-ups e tente novamente.',
  'auth/popup-closed-by-user': 'O login foi cancelado antes de ser concluído.',
  'auth/cancelled-popup-request': 'Já existe uma tentativa de login em andamento.',
  'auth/network-request-failed': 'Não foi possível conectar ao serviço de login. Verifique sua conexão.',
  'auth/too-many-requests': 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.',
  'auth/user-disabled': 'Esta conta não está disponível para acesso.',
  'auth/unauthorized-domain': 'O login não está disponível neste endereço.',
};

export const getAuthErrorMessage = (error) => (
  error?.code === 'auth/user-facing'
    ? error.message
    : AUTH_MESSAGES[error?.code] || 'Não foi possível entrar com o Google. Tente novamente.'
);
