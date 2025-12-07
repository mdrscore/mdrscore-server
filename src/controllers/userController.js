const supabase = require('../config/supabase');

exports.getMyProfile = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
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
    'target_sleep_hours', 'target_water_ml', 'currency_code', 'timezone'
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
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select()
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

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: publicData, error: publicErr } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    if (publicErr) throw publicErr;

    const { data: updatedUser, error: dbError } = await supabase
      .from('users')
      .update({ avatar_url: publicData?.publicUrl })
      .eq('id', req.user.id)
      .select()
      .maybeSingle();

    if (dbError) throw dbError;

    res.status(200).json({
      status: 'sukses',
      message: 'Avatar berhasil diupload',
      data: { avatar_url: publicData?.publicUrl, user: updatedUser }
    });

  } catch (err) {
    res.status(500).json({ status: 'gagal', message: err.message });
  }
};

exports.updateAccountSettings = async (req, res) => {
  const { email, password } = req.body;
  const authUpdates = {};

  if (email) authUpdates.email = email;
  if (password) authUpdates.password = password;

  try {
    if (Object.keys(authUpdates).length > 0) {
      const { data, error } = await supabase.auth.admin.updateUserById(req.user.id, authUpdates);
      if (error) throw error;
    }

    if (email) {
      const { data: updateEmailData, error: updateEmailErr } = await supabase
        .from('users')
        .update({ email })
        .eq('id', req.user.id)
        .select()
        .maybeSingle();
      if (updateEmailErr) throw updateEmailErr;
    }

    res.status(200).json({ status: 'sukses', message: 'Pengaturan akun diperbarui' });
  } catch (err) {
    res.status(500).json({ status: 'gagal', message: err.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const { error } = await supabase.auth.admin.deleteUser(req.user.id);
    if (error) throw error;
    res.status(200).json({ status: 'sukses', message: 'Akun berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ status: 'gagal', message: err.message });
  }
};