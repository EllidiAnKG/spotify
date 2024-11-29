"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../utils/supabase/client';

const ProfilePage = () => {
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        try {
            const { data, error } = await supabase.auth.getUser();
            if (error) throw error;
            if (data.user) {
                const { data: profileData, error: profileError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();
                if (profileError) throw profileError;
                setUser({ ...data.user, ...profileData });
                setName(profileData.name || '');
                setEmail(profileData.email || '');
            } else {
                router.push('/login');
            }
        } catch (error) {
            setError(`Ошибка при загрузке профиля: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const updates = { name, email };
            if (password) {
                const { error: updateError } = await supabase.auth.updateUser({ email, password });
                if (updateError) throw updateError;
            }
            if (user) {
                const { error: userUpdateError } = await supabase
                    .from('auth.users')
                    .update(updates)
                    .eq('id', user.id);
                if (userUpdateError) throw userUpdateError;
            }
            if (image) {
                const { data, error: storageError } = await supabase.storage
                    .from('avatars')
                    .upload(`${user?.id}.jpg`, image);
                if (storageError) throw storageError;
                const publicURL = `https://ndcvronhgjgzgxelnlaa.supabase.co/storage/v1/object/public/avatar_image/${user?.id}.jpg`;
                if (user) {
                    await supabase
                        .from('users')
                        .update({ image_url: publicURL })
                        .eq('id', user.id);
                }
            }
            alert('Профиль обновлен!');
            fetchProfileData();
        } catch (error) {
            setError(`Ошибка обновления профиля: ${error}`);
        }
    };

    if (loading) return <div>Загрузка...</div>;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;
    if (!user) return <div>Пользователь не найден</div>;

    return (
        <div>
            <h1>Профиль</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="name">Имя:</label>
                    <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                    <label htmlFor="email">Электронная почта:</label>
                    <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                    <label htmlFor="password">Пароль:</label>
                    <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div>
                    <label htmlFor="image">Аватар:</label>
                    <input type="file" id="image" accept="image/*" onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                            setImage(e.target.files[0]);
                        }
                    }} 
                />
                </div>
                <button type="submit">Обновить профиль</button>
            </form>
            {user.image_url && <img src={user.image_url} alt="Аватар" width="100" />}
        </div>
    );
};

export default ProfilePage;
