const supabase = require('../config/supabase');

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token tidak ditemukan' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Format Authorization header tidak valid' });
  }

  const token = parts[1];

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Token tidak valid' });
    }

    req.user = data.user;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Terjadi kesalahan server saat autentikasi' });
  }
};

module.exports = requireAuth;
