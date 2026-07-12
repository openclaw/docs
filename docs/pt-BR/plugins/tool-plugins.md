---
read_when:
    - Você quer criar um Plugin simples do OpenClaw que apenas adicione ferramentas de agente
    - Você quer usar defineToolPlugin em vez de escrever manualmente os metadados do manifesto do plugin
    - Você precisa criar a estrutura, gerar, validar, testar ou publicar um plugin somente de ferramentas
sidebarTitle: Tool Plugins
summary: Crie ferramentas de agente tipadas simples com defineToolPlugin e openclaw plugins init/build/validate
title: Plugins de ferramentas
x-i18n:
    generated_at: "2026-07-12T00:17:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 231eba96d4927b7411cb17d79b96e6df09ed111fc8a54eac0ca7717e58803d26
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin` cria um plugin que adiciona apenas ferramentas que podem ser chamadas pelo agente: sem
canal, provedor de modelo, hook, serviço ou backend de configuração. Ele gera os
metadados do manifesto necessários para que o OpenClaw descubra ferramentas sem carregar o código
de runtime do plugin.

Para plugins de provedor, canal, hook, serviço ou com recursos mistos, comece por
[Criação de plugins](/pt-BR/plugins/building-plugins), [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins)
ou [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins).

## Requisitos

- Node 22.19+, Node 23.11+ ou Node 24+.
- Saída de pacote TypeScript ESM.
- `typebox` em `dependencies` (não apenas em `devDependencies` — o plugin gerado
  o importa em runtime).
- `openclaw >=2026.5.17`, a primeira versão que exporta
  `openclaw/plugin-sdk/tool-plugin`.
- Uma raiz de pacote que distribua `dist/`, `openclaw.plugin.json` e
  `package.json`.

## Início rápido

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

`plugins init` cria a estrutura básica:

| Arquivo                 | Finalidade                                                         |
| ----------------------- | ------------------------------------------------------------------ |
| `src/index.ts`          | Entrada de `defineToolPlugin` com uma ferramenta `echo`            |
| `src/index.test.ts`     | Teste de metadados que verifica a lista de ferramentas             |
| `tsconfig.json`         | Saída TypeScript NodeNext para `dist/`                             |
| `vitest.config.ts`      | Configuração do Vitest para `src/**/*.test.ts`                     |
| `package.json`          | Scripts, dependências de runtime, `openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json`  | Metadados de manifesto gerados para a ferramenta inicial           |

`npm run plugin:build` executa `npm run build` (tsc) e depois
`openclaw plugins build --entry ./dist/index.js`. `npm run plugin:validate`
recompila e executa `openclaw plugins validate --entry ./dist/index.js`.
Uma validação bem-sucedida exibe:

```text
Plugin stock-quotes is valid.
```

Opções de `openclaw plugins init <id>`:

| Flag                 | Padrão                      | Efeito                                 |
| -------------------- | --------------------------- | -------------------------------------- |
| `--directory <path>` | `<id>`                      | Diretório de saída                     |
| `--name <name>`      | `<id>` com iniciais maiúsculas | Nome de exibição                    |
| `--type <type>`      | `tool`                      | Tipo de estrutura: `tool` ou `provider` |
| `--force`            | desativado                  | Sobrescreve um diretório de saída existente |

## Escrever uma ferramenta

`defineToolPlugin` recebe a identidade do plugin, um schema de configuração opcional e uma
lista estática de ferramentas. Os tipos dos parâmetros e da configuração são inferidos dos
schemas TypeBox.

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

Os nomes das ferramentas constituem a API estável. Escolha nomes exclusivos, em letras minúsculas e
específicos o suficiente para evitar colisões com ferramentas do núcleo ou de outros plugins.

## Ferramentas opcionais e baseadas em fábrica

Defina `optional: true` quando os usuários precisarem adicionar explicitamente a ferramenta à lista de permissões antes que ela
seja enviada a um modelo. `openclaw plugins build` grava a entrada de manifesto
`toolMetadata.<tool>.optional` correspondente, permitindo que o OpenClaw identifique que a
ferramenta é opcional sem carregar o código de runtime do plugin.

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

Use `factory` quando uma ferramenta precisar do contexto de ferramentas do runtime antes que possa ser
criada — para não participar de uma execução específica, inspecionar o estado do sandbox ou vincular
helpers do runtime. Os metadados permanecem estáticos, mesmo que a ferramenta concreta seja criada
em runtime.

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

As fábricas ainda declaram antecipadamente um nome fixo de ferramenta. Use `definePluginEntry`
diretamente quando o plugin calcular nomes de ferramentas dinamicamente ou combinar ferramentas
com hooks, serviços, provedores ou comandos.

## Valores de retorno

`defineToolPlugin` encapsula valores de retorno simples no formato de resultado de ferramenta
do OpenClaw:

- Retorne uma string quando o modelo precisar ver exatamente esse texto.
- Retorne um valor compatível com JSON quando quiser que o modelo veja JSON formatado
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

Use uma ferramenta baseada em fábrica quando precisar de um `AgentToolResult` personalizado ou quiser reutilizar uma
implementação existente de `api.registerTool`.

## Configuração

`configSchema` é opcional. Omita-o e o OpenClaw aplicará um schema estrito de objeto vazio;
o manifesto gerado ainda incluirá `configSchema`.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

Com um `configSchema`, o segundo argumento de `execute` é tipado a partir dele:

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

O OpenClaw lê a configuração do plugin na entrada correspondente ao plugin na configuração do Gateway. Não
grave segredos diretamente no código-fonte nem em exemplos da documentação; use configuração, variáveis de
ambiente ou SecretRefs conforme o modelo de segurança do plugin.

## Metadados gerados

O OpenClaw precisa ler o manifesto do plugin antes de importar o código de runtime do plugin.
`defineToolPlugin` expõe metadados estáticos para isso, e
`openclaw plugins build` os grava no pacote. Execute novamente o gerador após
alterar o ID, o nome, a descrição, o schema de configuração, a ativação ou os nomes das
ferramentas do plugin:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Manifesto gerado para um plugin com uma ferramenta:

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

`contracts.tools` é o contrato de descoberta importante: ele informa ao OpenClaw qual
plugin é proprietário de cada ferramenta sem carregar o runtime de todos os plugins instalados. Um
manifesto desatualizado pode fazer com que uma ferramenta não seja encontrada na descoberta ou que um erro de registro
seja atribuído ao plugin errado.

## Metadados do pacote

`openclaw plugins build` também alinha o `package.json` à entrada de runtime
selecionada:

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

Distribua o JavaScript compilado (`./dist/index.js`), não uma entrada de código-fonte TypeScript.
Entradas de código-fonte funcionam apenas para desenvolvimento local no workspace.

## Validar na CI

`plugins build --check` falha sem reescrever arquivos quando os metadados gerados
estão desatualizados:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` verifica se:

- `openclaw.plugin.json` existe e passa pelo carregador normal de manifestos.
- A entrada atual exporta metadados de `defineToolPlugin`.
- Os campos gerados do manifesto correspondem aos metadados da entrada.
- `contracts.tools` corresponde aos nomes declarados das ferramentas.
- `package.json` aponta `openclaw.extensions` para a entrada de runtime selecionada.

## Instalar e inspecionar localmente

Em outro checkout do OpenClaw ou em uma CLI instalada, instale o caminho do pacote:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

Para um teste rápido do pacote, primeiro gere o pacote e instale o tarball:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

Após a instalação, reinicie ou recarregue o Gateway e peça ao agente para usar a
ferramenta. Se a ferramenta não estiver visível, inspecione o runtime do plugin e o catálogo efetivo
de ferramentas antes de alterar o código (consulte [Solução de problemas](#troubleshooting)).

## Publicar

Publique pelo ClawHub quando o pacote estiver pronto. `clawhub package publish`
recebe uma origem: uma pasta local, um repositório do GitHub (`owner/repo[@ref]`) ou uma
URL de tarball.

```bash
clawhub package publish ./stock-quotes --dry-run
clawhub package publish ./stock-quotes
```

Instale com um localizador explícito do ClawHub:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

Especificações simples de pacotes npm ainda são instaladas pelo npm durante a transição do lançamento, mas
o ClawHub é a superfície preferencial de descoberta e distribuição para plugins do OpenClaw.
Consulte [Publicação no ClawHub](/pt-BR/clawhub/publishing) para informações sobre o escopo do proprietário e a
revisão da versão.

## Solução de problemas

### `plugin entry not found: ./dist/index.js`

O arquivo de entrada selecionado não existe. Execute `npm run build` e depois execute novamente
`openclaw plugins build --entry ./dist/index.js` ou
`openclaw plugins validate --entry ./dist/index.js`.

### `plugin entry does not expose defineToolPlugin metadata`

A entrada não exportou um valor criado por `defineToolPlugin`. Confirme se a
exportação padrão do módulo é o resultado de `defineToolPlugin(...)` ou forneça a
entrada correta com `--entry`.

### `openclaw.plugin.json generated metadata is stale`

O manifesto não corresponde mais aos metadados da entrada. Execute:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Inclua no commit as alterações em `openclaw.plugin.json` e `package.json`.

### `package.json openclaw.extensions must include ./dist/index.js`

Os metadados do pacote apontam para uma entrada de runtime diferente. Execute
`openclaw plugins build --entry ./dist/index.js` para que o gerador alinhe
os metadados do pacote à entrada que você pretende distribuir.

### `Cannot find package 'typebox'`

O plugin compilado importa `typebox` em runtime. Mantenha-o em `dependencies`,
reinstale, recompile e execute novamente a validação.

### A ferramenta não aparece após a instalação

Verifique estes itens na ordem:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` contém `contracts.tools` com os nomes de ferramentas esperados.
4. `package.json` contém `openclaw.extensions: ["./dist/index.js"]`.
5. O Gateway foi reiniciado ou recarregado após a instalação do Plugin.

## Consulte também

- [Como criar Plugins](/pt-BR/plugins/building-plugins)
- [Pontos de entrada de Plugins](/pt-BR/plugins/sdk-entrypoints)
- [Subcaminhos do SDK de Plugins](/pt-BR/plugins/sdk-subpaths)
- [Manifesto do Plugin](/pt-BR/plugins/manifest)
- [CLI de Plugins](/pt-BR/cli/plugins)
- [Publicação no ClawHub](/pt-BR/clawhub/publishing)
