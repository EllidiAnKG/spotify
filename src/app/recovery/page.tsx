"use client"
import { useState } from 'react';
import { supabase } from '../../../utils/supabase/client';
import styles from '../recovery/recovery.module.css'

const PasswordRecoveryForm = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const handleRecovery = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      setMessage('Ошибка: ' + error.message);
    } else {
      setMessage('Пожалуйста, проверьте свою электронную почту для восстановления пароля.');
    }
  };

  return (
    <div className={styles.container}>
    <form  className={styles.formContainer} onSubmit={handleRecovery}>
      <div className={styles.module}>
      <h2>Восстановление пароля</h2>
      {message && <p>{message}</p>}
      <input
      className={styles.input}
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button className={styles.reset} type="submit">Восстановить пароль</button>
      </div>
    </form>
    </div>
  );
};

export default PasswordRecoveryForm;
