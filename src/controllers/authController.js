const supabase = require('../config/supabase');

exports.register = async (req, res) => {
  const { email, password, username, full_name } = req.body;

  try {
    if (username) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single();
      
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

    const isVerifyRequired = !data.session;

    res.status(201).json({
      status: 'sukses',
      message: isVerifyRequired ? 'Cek email untuk verifikasi' : 'Registrasi berhasil',
      data: {
        user: data.user,
        require_verify: isVerifyRequired
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
      const { data: userRecord } = await supabase
        .from('users')
        .select('email')
        .eq('username', email)
        .single();

      if (!userRecord) {
        return res.status(401).json({ status: 'gagal', message: 'Username tidak ditemukan' });
      }
      targetEmail = userRecord.email;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password,
    });

    if (error) throw error;

    res.status(200).json({
      status: 'sukses',
      message: 'Login berhasil',
      token: data.session.access_token,
      user: data.user
    });

  } catch (err) {
    res.status(401).json({ status: 'gagal', message: 'Email/Username atau password salah' });
  }
};