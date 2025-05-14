function generateGroupCode(prefix = 'GRP', length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}-${code}`;
  }
  
  // Example usage
  const groupCode = generateGroupCode();
  console.log('Generated group code:', groupCode);
  
  // You can export it too if needed
  module.exports = { generateGroupCode };