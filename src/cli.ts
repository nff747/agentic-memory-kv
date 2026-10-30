export function runCLI(argv: string[]): number {
  const args = argv.slice(2);
  const command = args[0] || 'help';

  switch (command) {
    case 'stats': {
      console.log(JSON.stringify({
        status: 'no live store connected',
        version: '2.0.0-alpha.0'
      }, null, 2));
      return 0;
    }
    case 'help':
    default:
      console.log(`
Agentic Memory KV CLI 🧠
Usage:
  npx agentic-kv stats
      `);
      return 0;
  }
}
