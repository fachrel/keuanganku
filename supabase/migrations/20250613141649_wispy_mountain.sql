/*
  # Kategori Default untuk Pengguna Baru

  Fungsi untuk membuat kategori default ketika pengguna baru mendaftar
*/

-- Fungsi untuk membuat kategori default
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  -- Kategori Pengeluaran Default
  INSERT INTO categories (name, color, type, user_id) VALUES
    ('Makanan & Minuman', '#10B981', 'expense', NEW.id),
    ('Transportasi', '#F59E0B', 'expense', NEW.id),
    ('Tagihan & Utilitas', '#EF4444', 'expense', NEW.id),
    ('Hiburan', '#8B5CF6', 'expense', NEW.id),
    ('Kesehatan', '#EC4899', 'expense', NEW.id),
    ('Belanja', '#06B6D4', 'expense', NEW.id),
    ('Pendidikan', '#84CC16', 'expense', NEW.id),
    ('Lain-lain', '#6B7280', 'expense', NEW.id);
  
  -- Kategori Pemasukan Default
  INSERT INTO categories (name, color, type, user_id) VALUES
    ('Gaji', '#059669', 'income', NEW.id),
    ('Freelance', '#0D9488', 'income', NEW.id),
    ('Investasi', '#7C3AED', 'income', NEW.id),
    ('Bonus', '#DC2626', 'income', NEW.id),
    ('Lain-lain', '#374151', 'income', NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger untuk membuat kategori default saat pengguna baru mendaftar
DROP TRIGGER IF EXISTS create_default_categories_trigger ON auth.users;
CREATE TRIGGER create_default_categories_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_categories();