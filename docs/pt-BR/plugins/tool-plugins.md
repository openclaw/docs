---
read_when:
    - Você quer criar um Plugin simples do OpenClaw que apenas adiciona ferramentas de agente
    - Você quer usar defineToolPlugin em vez de escrever manualmente os metadados do manifesto do plugin
    - Você precisa criar a estrutura inicial, gerar, validar, testar ou publicar um plugin somente de ferramenta
sidebarTitle: Tool Plugins
summary: Crie ferramentas de agente tipadas simples com defineToolPlugin e openclaw plugins init/build/validate
title: Plugins de ferramentas
x-i18n:
    generated_at: "2026-06-27T18:00:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e0ead3e9162b0e9e930a7a69dcd4a72a78063dae09a173efb70d0db32f73c9a
    source_path: plugins/tool-plugins.md
    workflow: 16
---

Os plugins de ferramenta adicionam ferramentas chamáveis pelo agente ao OpenClaw sem adicionar um canal,
provedor de modelo, hook, serviço ou backend de configuração. Use `defineToolPlugin` quando o
plugin possuir uma lista fixa de ferramentas e você quiser que o OpenClaw gere os metadados
do manifesto que mantêm essas ferramentas descobríveis sem carregar código de runtime.

O fluxo recomendado é:

1. Crie o esqueleto de um pacote com `openclaw plugins init`.
2. Escreva ferramentas com `defineToolPlugin`.
3. Gere JavaScript.
4. Gere os metadados de `openclaw.plugin.json` e `package.json` com
   `openclaw plugins build`.
5. Valide os metadados gerados antes de publicar ou instalar.

Para plugins de provedor, canal, hook, serviço ou capacidade mista, comece com
[Como criar plugins](/pt-BR/plugins/building-plugins), [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins)
ou [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins).

## Requisitos

- Node >= 22.
- Saída de pacote TypeScript ESM.
- `typebox` para esquemas de configuração e parâmetros de ferramenta.
- `openclaw >=2026.5.17`, a primeira versão do OpenClaw que exporta
  `openclaw/plugin-sdk/tool-plugin`.
- Uma raiz de pacote que possa distribuir `dist/`, `openclaw.plugin.json` e
  `package.json`.

O plugin gerado importa `typebox` em runtime, então mantenha `typebox` em
`dependencies`, não apenas em `devDependencies`.

## Início rápido

Crie um novo pacote de plugin:

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

O esqueleto cria:

- `src/index.ts`: uma entrada `defineToolPlugin` com uma ferramenta `echo`.
- `src/index.test.ts`: um pequeno teste de metadados.
- `tsconfig.json`: saída TypeScript NodeNext para `dist/`.
- `package.json`: scripts, dependências de runtime e
  `openclaw.extensions: ["./dist/index.js"]`.
- `openclaw.plugin.json`: metadados de manifesto gerados para a ferramenta inicial.

Saída de validação esperada:

```text
Plugin stock-quotes is valid.
```

## Escreva uma ferramenta

`defineToolPlugin` recebe a identidade do plugin, um esquema de configuração opcional e uma
lista estática de ferramentas. Os tipos de parâmetros e configuração são inferidos a partir dos
esquemas TypeBox.

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quote snapshots.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "Quote API key." })),
    baseUrl: Type.Optional(Type.String({ description: "Quote API base URL." })),
  }),
  tools: (tool) => [
    tool({
      name: "stock_quote",
      label: "Stock Quote",
      description: "Fetch a stock quote snapshot.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol, for example OPEN." }),
      }),
      async execute({ symbol }, config, context) {
        context.signal?.throwIfAborted();
        return {
          symbol: symbol.toUpperCase(),
          configured: Boolean(config.apiKey),
          baseUrl: config.baseUrl ?? "https://api.example.com",
        };
      },
    }),
  ],
});
```

Os nomes de ferramentas são a API estável. Escolha nomes únicos, em minúsculas e
específicos o suficiente para evitar colisões com ferramentas centrais ou outros plugins.

## Ferramentas opcionais e de fábrica

Defina `optional: true` quando os usuários precisarem permitir explicitamente a ferramenta antes que ela
seja enviada a um modelo:

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

`openclaw plugins build` grava a entrada de manifesto `toolMetadata.<tool>.optional`
correspondente, para que o OpenClaw possa descobrir a ferramenta sem carregar código de
runtime do plugin.

Use `factory` quando uma ferramenta precisa do contexto de ferramenta em runtime antes de poder ser
criada. A fábrica mantém os metadados estáticos enquanto permite que a ferramenta fique de fora de uma
execução específica, inspecione o estado da sandbox ou vincule helpers de runtime.

```typescript
tool({
  name: "local_workflow",
  description: "Run a local workflow outside sandboxed sessions.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  factory({ api, toolContext }) {
    if (toolContext.sandboxed) {
      return null;
    }
    return createLocalWorkflowTool(api);
  },
});
```

Fábricas ainda são para nomes fixos de ferramenta. Use `definePluginEntry` diretamente quando
o plugin calcula nomes de ferramentas dinamicamente ou combina ferramentas com hooks,
serviços, provedores, comandos ou outras superfícies de runtime.

## Valores de retorno

`defineToolPlugin` encapsula valores de retorno simples no formato de resultado de ferramenta do OpenClaw:

- Retorne uma string quando o modelo deve ver exatamente esse texto.
- Retorne um valor compatível com JSON quando você quiser que o modelo veja JSON formatado
  e que o OpenClaw mantenha o valor original em `details`.

```typescript
tool({
  name: "echo_text",
  description: "Echo input text.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => input,
});
```

```typescript
tool({
  name: "echo_json",
  description: "Echo input as structured JSON.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => ({ input, length: input.length }),
});
```

Use uma ferramenta de fábrica quando precisar retornar um `AgentToolResult` personalizado ou reutilizar
uma implementação existente de `api.registerTool`. Use `definePluginEntry` em vez
de `defineToolPlugin` quando precisar de ferramentas totalmente dinâmicas ou capacidades mistas de
plugin.

## Configuração

`configSchema` é opcional. Se você o omitir, o OpenClaw usa um esquema estrito de objeto vazio
e o manifesto gerado ainda inclui `configSchema`.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

Quando você inclui `configSchema`, o segundo argumento de `execute` é tipado a partir do
esquema:

```typescript
const configSchema = Type.Object({
  apiKey: Type.String(),
});

export default defineToolPlugin({
  id: "configured-tools",
  name: "Configured Tools",
  description: "Adds configured tools.",
  configSchema,
  tools: (tool) => [
    tool({
      name: "configured_ping",
      description: "Check whether configuration is available.",
      parameters: Type.Object({}),
      execute: (_params, config) => ({ hasKey: config.apiKey.length > 0 }),
    }),
  ],
});
```

O OpenClaw lê a configuração do plugin a partir da entrada do plugin na configuração do Gateway. Não
codifique segredos diretamente no código-fonte ou em exemplos da documentação. Use configuração, variáveis de
ambiente ou SecretRefs de acordo com o modelo de segurança do plugin.

## Metadados gerados

O OpenClaw descobre plugins instalados a partir de metadados frios. Ele deve conseguir ler
o manifesto do plugin antes de importar código de runtime do plugin. Portanto, `defineToolPlugin`
expõe metadados estáticos, e `openclaw plugins build` grava esses
metadados no pacote.

Execute o gerador depois de alterar id, nome, descrição, esquema de configuração,
ativação ou nomes de ferramentas do plugin:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Para um plugin com uma ferramenta, o manifesto gerado se parece com isto:

```json
{
  "id": "stock-quotes",
  "name": "Stock Quotes",
  "description": "Fetch stock quote snapshots.",
  "version": "0.1.0",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  },
  "activation": {
    "onStartup": true
  },
  "contracts": {
    "tools": ["stock_quote"]
  }
}
```

`contracts.tools` é o contrato de descoberta importante. Ele informa ao OpenClaw qual
plugin possui cada ferramenta sem carregar o runtime de todos os plugins instalados. Se o
manifesto estiver obsoleto, a ferramenta pode não aparecer na descoberta ou o plugin errado
pode ser responsabilizado por um erro de registro.

## Metadados do pacote

Para o fluxo simples de plugin de ferramenta, `openclaw plugins build` alinha
`package.json` à entrada única de runtime selecionada:

```json
{
  "type": "module",
  "files": ["dist", "openclaw.plugin.json", "README.md"],
  "dependencies": {
    "typebox": "^1.1.38"
  },
  "peerDependencies": {
    "openclaw": ">=2026.5.17"
  },
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

Use JavaScript gerado, como `./dist/index.js`, para pacotes instalados. Entradas de
código-fonte são úteis no desenvolvimento em workspace, mas pacotes publicados não devem
depender de carregamento de runtime TypeScript.

## Validar em CI

Use `plugins build --check` para fazer o CI falhar quando os metadados gerados estiverem obsoletos sem
reescrever arquivos:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` verifica que:

- `openclaw.plugin.json` existe e passa pelo carregador normal de manifesto.
- A entrada atual exporta metadados de `defineToolPlugin`.
- Os campos gerados do manifesto correspondem aos metadados da entrada.
- `contracts.tools` corresponde aos nomes de ferramentas declarados.
- `package.json` aponta `openclaw.extensions` para a entrada de runtime selecionada.

## Instalar e inspecionar localmente

A partir de um checkout separado do OpenClaw ou de uma CLI instalada, instale o caminho do pacote:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

Para um smoke empacotado, primeiro empacote e instale o tarball:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

Após a instalação, inicie ou reinicie o Gateway e peça ao agente para usar a
ferramenta. Se estiver depurando a visibilidade da ferramenta, inspecione o runtime do plugin e o
catálogo efetivo de ferramentas antes de alterar o código.

## Publicar

Publique pelo ClawHub quando o pacote estiver pronto:

```bash
clawhub package publish your-org/stock-quotes --dry-run
clawhub package publish your-org/stock-quotes
```

Instale com um localizador ClawHub explícito:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

Especificações simples de pacote npm continuam compatíveis durante a transição de lançamento, mas o ClawHub
é a superfície preferida de descoberta e distribuição para plugins do OpenClaw.

## Solução de problemas

### `plugin entry not found: ./dist/index.js`

O arquivo de entrada selecionado não existe. Execute `npm run build` e depois execute novamente
`openclaw plugins build --entry ./dist/index.js` ou
`openclaw plugins validate --entry ./dist/index.js`.

### `plugin entry does not expose defineToolPlugin metadata`

A entrada não exportou um valor criado por `defineToolPlugin`. Verifique se a
exportação padrão do módulo é o resultado de `defineToolPlugin(...)`, ou passe a entrada correta
com `--entry`.

### `openclaw.plugin.json generated metadata is stale`

O manifesto não corresponde mais aos metadados da entrada. Execute:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Faça commit das alterações em `openclaw.plugin.json` e `package.json`.

### `package.json openclaw.extensions must include ./dist/index.js`

Os metadados do pacote apontam para uma entrada de runtime diferente. Execute
`openclaw plugins build --entry ./dist/index.js` para que o gerador alinhe os
metadados do pacote com a entrada que você pretende distribuir.

### `Cannot find package 'typebox'`

O plugin gerado importa `typebox` em runtime. Mantenha `typebox` em
`dependencies`, reinstale as dependências do pacote, gere novamente e execute a validação de novo.

### A ferramenta não aparece após a instalação

Verifique estes itens em ordem:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` tem `contracts.tools` com os nomes de ferramentas esperados.
4. `package.json` tem `openclaw.extensions: ["./dist/index.js"]`.
5. O Gateway foi reiniciado ou recarregado após a instalação do plugin.

## Veja também

- [Como criar plugins](/pt-BR/plugins/building-plugins)
- [Pontos de entrada de Plugin](/pt-BR/plugins/sdk-entrypoints)
- [Subcaminhos do Plugin SDK](/pt-BR/plugins/sdk-subpaths)
- [Manifesto de Plugin](/pt-BR/plugins/manifest)
- [CLI de plugins](/pt-BR/cli/plugins)
- [Publicação no ClawHub](/pt-BR/clawhub/publishing)
