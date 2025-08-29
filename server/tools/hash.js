import bcrypt from 'bcryptjs';

const [, , password] = process.argv;
if (!password) {
  console.error('Usage: npm run hash -- "your-password"');
  process.exit(1);
}

(async () => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  console.log('\nBCRYPT HASH (paste into AUTH_PASSWORD_HASH env):\n');
  console.log(hash);
  console.log('\n');
})();

