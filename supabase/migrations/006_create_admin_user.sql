CREATE OR REPLACE FUNCTION public.create_admin_user(admin_email TEXT, admin_password TEXT)
RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id FROM auth.users WHERE email = admin_email;
  IF user_id IS NULL THEN
    user_id := extensions.uuid_generate_v4();
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
    VALUES (user_id, admin_email, crypt(admin_password, gen_salt('bf')), NOW(), NOW(), NOW());
    INSERT INTO public.profiles (id, email, tokens, created_at)
    VALUES (user_id, admin_email, 999999, NOW());
  END IF;
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
