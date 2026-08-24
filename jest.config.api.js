// Config separada de la que usa CRA (react-scripts test) para no chocar
// con ella — este archivo solo corre los tests de backend en tests/.
module.exports = {
  testEnvironment: 'node',
  // Nota: <rootDir> puede contener un carácter "|" (nombre de carpeta del
  // proyecto) que rompe el glob de testMatch — se usa testRegex en su lugar.
  testRegex: 'tests/.*\\.test\\.js$',
  testPathIgnorePatterns: ['/node_modules/', '/\\._'],
  setupFiles: ['dotenv/config'],
  testTimeout: 20000,
};
