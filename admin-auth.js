exports.login = async (req, res) => {
  const { username, password } = req.body;
  console.log('Login Attempt:', { username, password }); // Add this line

  if (username !== ADMIN_USER) {
    console.log('Username did not match');
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, ADMIN_PASS_HASH);
  console.log('Password valid:', valid); // Add this line

  if (!valid) {
    console.log('Password did not match');
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ username: ADMIN_USER }, JWT_SECRET, { expiresIn: '2h' });
  res.json({ token });
};
