const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);

exports.register = async (req, res) => {
  const { email, password, username, full_name } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ status: 'gagal', message: 'Email, username, dan password wajib diisi' });
  }

  try {
    const { data: existingByEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingByEmail) {
      return res.status(400).json({ status: 'gagal', message: 'Email sudah digunakan' });
    }

    const { data: existingByUsername } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existingByUsername) {
      return res.status(400).json({ status: 'gagal', message: 'Username sudah digunakan' });
    }

    const id = crypto.randomUUID();
    const hashed = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const insertPayload = {
      id,
      email,
      username,
      full_name: full_name || null,
      hashed_password: hashed,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: insertError } = await supabase
      .from('users')
      .insert(insertPayload);

    if (insertError) {
      return res.status(500).json({ status: 'gagal', message: insertError.message });
    }

    const token = jwt.sign({ sub: id }, JWT_SECRET, { expiresIn: '7d' });

    const { data: userData } = await supabase
      .from('users')
      .select('id, email, username, full_name, avatar_url, bio, gender, date_of_birth, height_cm, weight_kg, target_sleep_hours, target_water_ml, currency_code, timezone, created_at, updated_at, data_hapsu')
      .eq('id', id)
      .maybeSingle();

    res.status(201).json({
      status: 'sukses',
      message: 'Registrasi berhasil',
      token,
      user: userData
    });

  } catch (err) {
    res.status(500).json({ status: 'gagal', message: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ status: 'gagal', message: 'Email/username dan password wajib diisi' });
  }

  try {
    let userRecord;

    if (email.includes('@')) {
      const { data } = await supabase
        .from('users')
        .select('id, email, username, hashed_password, full_name, avatar_url')
        .eq('email', email)
        .maybeSingle();
      userRecord = data;
    } else {
      const { data } = await supabase
        .from('users')
        .select('id, email, username, hashed_password, full_name, avatar_url')
        .eq('username', email)
        .maybeSingle();
      userRecord = data;
    }

    if (!userRecord) {
      return res.status(404).json({ status: 'gagal', message: 'User tidak ditemukan' });
    }

    const isMatch = await bcrypt.compare(password, userRecord.hashed_password || '');
    if (!isMatch) {
      return res.status(401).json({ status: 'gagal', message: 'Password salah' });
    }

    const token = jwt.sign({ sub: userRecord.id }, JWT_SECRET, { expiresIn: '7d' });

    const { data: userData } = await supabase
      .from('users')
      .select('id, email, username, full_name, avatar_url, bio, gender, date_of_birth, height_cm, weight_kg, target_sleep_hours, target_water_ml, currency_code, timezone, created_at, updated_at, data_hapsu')
      .eq('id', userRecord.id)
      .maybeSingle();

    res.status(200).json({
      status: 'sukses',
      message: 'Login berhasil',
      token,
      user: userData
    });

  } catch (err) {
    res.status(500).json({ status: 'gagal', message: err.message });
  }
};
