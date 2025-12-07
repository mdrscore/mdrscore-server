const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');

const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);

const publicSelect = 'id, email, username, full_name, avatar_url, bio, gender, date_of_birth, height_cm, weight_kg, target_sleep_hours, target_water_ml, currency_code, timezone, created_at, updated_at, data_hapsu';

exports.getMyProfile = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(publicSelect)
      .eq('id', req.user.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ status: 'gagal', message: 'Profil tidak ditemukan' });
    res.status(200).json({ status: 'sukses', data });
  } catch (err) {
    res.status(500).json({ status: 'gagal', message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  const allowedFields = [
    'username', 'full_name', 'bio', 'avatar_url', 'gender',
    'date_of_birth', 'height_cm', 'weight_kg',
    'target_sleep_hours', 'target_water_ml', 'currency_code', 'timezone', 'data_hapsu'
  ];

  const updates = {};
  Object.keys(req.body).forEach((key) => {
    if (allowedFields.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ status: 'gagal', message: 'Tidak ada data valid untuk diupdate' });
  }

  try {
    if (updates.username) {
      const { data: exists } = await supabase
        .from('users')
        .select('id')
        .eq('username', updates.username)
        .neq('id', req.user.id)
        .maybeSingle();
      if (exists) return res.status(400).json({ status: 'gagal', message: 'Username sudah digunakan' });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', req.user.id)
      .select(publicSelect)
      .maybeSingle();

    if (error) throw error;
    res.status(200).json({ status: 'sukses', data });
  } catch (err) {
    res.status(500).json({ status: 'gagal', message: err.message });
  }
};

exports.uploadAvatar = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'gagal', message: 'File gambar wajib diupload' });
  }

  try {
    const file = req.file;
    const fileExt = file.originalname.split('.').pop();
    const fileName = `avatar_${Date.now()}.${fileExt}`;
    const filePath = `${req.user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: publicData } = await supabase
      .from('users')
      .update({ avatar_url: supabase.storage.from('avatars').getPublicUrl(filePath).data.publicUrl, updated_at: new Date().toISOString() })
      .eq('id', req.user.id)
      .select(publicSelect)
      .maybeSingle();

    res.status(200).json({
      status: 'sukses',
      message: 'Avatar berhasil diupload',
      data: publicData
    });

  } catch (err) {
    res.status(500).json({ status: 'gagal', message: err.message });
  }
};

exports.updateAccountSettings = async (req, res) => {
  const { email, password } = req.body;
  if (!email && !password) return res.status(400).json({ status: 'gagal', message: 'Tidak ada perubahan' });

  try {
    if (email) {
      const { data: exists } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .neq('id', req.user.id)
        .maybeSingle();
      if (exists) return res.status(400).json({ status: 'gagal', message: 'Email sudah digunakan' });

      const { error: eErr } = await supabase
        .from('users')
        .update({ email, updated_at: new Date().toISOString() })
        .eq('id', req.user.id);
      if (eErr) throw eErr;
    }

    if (password) {
      const hashed = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
      const { error: pErr } = await supabase
        .from('users')
        .update({ hashed_password: hashed, password_changed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', req.user.id);
      if (pErr) throw pErr;
    }

    res.status(200).json({ status: 'sukses', message: 'Pengaturan akun diperbarui' });
  } catch (err) {
    res.status(500).json({ status: 'gagal', message: err.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', req.user.id);

    if (error) throw error;
    res.status(200).json({ status: 'sukses', message: 'Akun berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ status: 'gagal', message: err.message });
  }
};
