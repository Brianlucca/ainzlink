import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/useAuth';
import { userService } from '../services/userService';

export default function UserSessionSync() {
  const { user } = useAuth();
  const synchronizedUser = useRef(null);

  useEffect(() => {
    if (!user || synchronizedUser.current === user.uid) return;
    synchronizedUser.current = user.uid;
    userService.initializeSession().catch(() => {
      console.error('Não foi possível sincronizar as preferências do usuário.');
      synchronizedUser.current = null;
    });
  }, [user]);

  return null;
}
