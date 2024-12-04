"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../utils/supabase/client';

interface Profile {
    id: string;
    name: string;
    email: string;
    file_url?: string; 
}

const ProfilePage = () => {
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [profile, setProfile] = useState<Profile>({ id:'', name: '', email: '', file_url: '' }); 
    const [image, setImage] = useState<File | null>(null);
    const [password, setPassword] = useState('');


    const router = useRouter();

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        try {
            const { data: authData, error: authError } = await supabase.auth.getUser();
            if (authError) throw new Error(`Authentication error: ${authError.message}`);
            if (!authData.user) {
                router.push('/login');
                return;
            }

            const { data: profileData, error: profileError } = await supabase
               .from('profiles')
               .select('*')
               .eq('id', authData.user.id)
               .single();

                if (profileError) {
                    console.error("Error fetching profile:", profileError);
                    
                    setError('Ошибка загрузки профиля. Попробуйте позже.');
                    return; 
                } else {
                setProfile({ ...profileData, name: profileData.name || authData.user.email, email: profileData.email || authData.user.email });
            }
            setUser(authData.user);

        }catch (error) {
            if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                setError('Ошибка сети: Не удалось загрузить профиль.');
            } else {
                setError(`Ошибка при загрузке профиля: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
            }
            console.error("Error in fetchProfileData:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const updates = { name: profile.name, email: profile.email };
    
            if (password) {
                const { error: updateError } = await supabase.auth.updateUser({ email: profile.email, password });
                if (updateError) throw new Error(`User update error: ${updateError.message}`);
            }
    
            const { error: profileUpdateError } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user?.id);
    
            if (profileUpdateError) throw new Error(`Profile update error: ${profileUpdateError.message}`);
    
            if (image) {
                const fileName = `${user?.id}-${Date.now()}.jpg`;
                try {
                    const { data, error: storageError } = await supabase.storage
                        .from('avatar_image')
                        .upload(fileName, image);
                    if (storageError) {
                        console.error("Storage upload error:", storageError);
                        setError(`Ошибка загрузки файла: ${storageError.message}`);
                        throw storageError;
                    }
            
                    const { data: { publicURL }, error: publicUrlError } = await supabase.storage
                        .from('avatar_image')
                        .getPublicUrl(fileName); 
            
                    if (publicUrlError) {
                        console.error("getPublicUrl error:", publicUrlError);
                        setError(`Ошибка получения URL файла: ${publicUrlError.message}`);
                        throw publicUrlError;
                    }
            
                    console.log("Public URL:", publicURL); //The public URL is now correctly accessed
            
            
                    const { error: fileUrlError } = await supabase
                        .from('profiles')
                        .update({ file_url: publicURL })
                        .eq('id', user?.id);
            
                    if (fileUrlError) {
                        console.error("Profile update error:", fileUrlError);
                        setError(`Ошибка обновления ссылки на аватар: ${fileUrlError.message}`);
                        throw fileUrlError;
                    }
            
                    console.log("Profile updated successfully!");
                    alert('Профиль обновлен!');
                    fetchProfileData();
            
                } catch (error) {
                    setError(`Ошибка обновления профиля: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
                    console.error("Error updating profile:", error);
                }
            }
            
            
            alert('Профиль обновлен!');
            fetchProfileData();
        } catch (error) {
            setError(`Ошибка обновления профиля: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
            console.error("Error in handleSubmit:", error);
        }
    };


    if (loading) return <div>Загрузка...</div>;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;
    if (!user) return <div>Пользователь не найден</div>;

    return (
        <div>
            {profile.file_url && (
            <img src={profile.file_url} alt="Аватар" width="100" />
        )}
        <h1>Профиль</h1>
        <form onSubmit={handleSubmit}>
                    <div>
            <label htmlFor="name">Имя:</label>
            <input
                type="text"
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
        </div>
        <div>
            <label htmlFor="email">Электронная почта:</label>
            <input
                type="email"
                id="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />
        </div>
        <div>
            <label htmlFor="password">Пароль:</label>
            <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
        </div>
        <div>
            <label htmlFor="image">Аватар:</label>
            <input
                type="file"
                id="image"
                accept="image/*"
                onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        setImage(e.target.files[0]);
                    }
                }}
            />
        </div>
        <button type="submit">Обновить профиль</button>

        </form>
    </div>
    );
};

export default ProfilePage;
