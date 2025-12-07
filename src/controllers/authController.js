const supabase = require('../config/supabase');

exports.register = async (req, res) => {
  const { email, password, username, full_name } = req.body;

  try {
    if (username) {
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existingUser) {
        return res.status(400).json({ status: 'gagal', message: 'Username sudah digunakan' });
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          full_name: full_name
        }
      }
    });

    if (error) throw error;

    res.status(201).json({
      status: 'sukses',
      message: 'Registrasi berhasil',
      data: {
        user: data.user
      }
    });

  } catch (err) {
    res.status(400).json({ status: 'gagal', message: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    let targetEmail = email;

    if (!email.includes('@')) {
      const { data: userRecord, error: uErr } = await supabase
        .from('users')
        .select('email')
        .eq('username', email)
        .maybeSingle();

      if (uErr) throw uErr;
      if (!userRecord) {
        return res.status(404).json({ status: 'gagal', message: 'Username tidak ditemukan' });
      }
      targetEmail = userRecord.email;
    } else {
      const { data: userRecord, error: eErr } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (eErr) throw eErr;
      if (!userRecord) {
        return res.status(404).json({ status: 'gagal', message: 'Email tidak ditemukan' });
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password,
    });

    if (error) {
      return res.status(401).json({ status: 'gagal', message: 'Password salah' });
    }

    res.status(200).json({
      status: 'sukses',
      message: 'Login berhasil',
      token: data.session?.access_token ?? null,
      user: data.user
    });

  } catch (err) {
    res.status(500).json({ status: 'gagal', message: 'Terjadi kesalahan server' });
  }
};
