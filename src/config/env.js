function getEnv(key, defaultValue) {
  const value = process.env[key];

  if (value === undefined || value === "") return defaultValue;
  return value;
}

const env = {
  port: Number(getEnv("PORT", 4000)),
  nodeEnv: getEnv("NODE_ENV", "development"),
};

module.exports = env;
