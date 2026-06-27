---
read_when:
    - Você precisa da assinatura de tipo exata de defineToolPlugin, definePluginEntry ou defineChannelPluginEntry
    - Você quer entender o modo de registro (completo vs. configuração vs. metadados da CLI)
    - Você está consultando opções de ponto de entrada
sidebarTitle: Entry Points
summary: Referência para defineToolPlugin, definePluginEntry, defineChannelPluginEntry e defineSetupPluginEntry
title: Pontos de entrada do Plugin
x-i18n:
    generated_at: "2026-06-27T17:57:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 49c024020202b754bde9bfa3f2a880332f1a5b4b19b397e59ae83c2673871211
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Todo plugin exporta um objeto de entrada padrão. O SDK fornece auxiliares para
criá-los.

Para plugins instalados, `package.json` deve apontar o carregamento em tempo de
execução para JavaScript compilado quando disponível:

```json
{
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "setupEntry": "./src/setup-entry.ts",
    "runtimeSetupEntry": "./dist/setup-entry.js"
  }
}
```

`extensions` e `setupEntry` continuam sendo entradas de código-fonte válidas
para desenvolvimento em workspace e checkout git. `runtimeExtensions` e
`runtimeSetupEntry` são preferidos quando o OpenClaw carrega um pacote instalado
e permitem que pacotes npm evitem compilação TypeScript em tempo de execução.
Entradas de runtime explícitas são obrigatórias: `runtimeSetupEntry` requer
`setupEntry`, e artefatos `runtimeExtensions` ou `runtimeSetupEntry` ausentes
fazem a instalação/descoberta falhar em vez de voltar silenciosamente ao
código-fonte. Se um pacote instalado declarar apenas uma entrada de código-fonte
TypeScript, o OpenClaw usará um par `dist/*.js` compilado correspondente quando
ele existir e, depois, voltará ao código-fonte TypeScript.

Todos os caminhos de entrada devem permanecer dentro do diretório do pacote do
plugin. Entradas de runtime e pares JavaScript compilados inferidos não tornam
válido um caminho de código-fonte `extensions` ou `setupEntry` que escape do
diretório.

<Tip>
  **Procurando um passo a passo?** Veja [Plugins de ferramentas](/pt-BR/plugins/tool-plugins),
  [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) ou
  [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins) para guias passo a passo.
</Tip>

## `defineToolPlugin`

**Importação:** `openclaw/plugin-sdk/tool-plugin`

Para plugins simples que apenas adicionam ferramentas de agente. `defineToolPlugin`
mantém o código-fonte de autoria pequeno, infere tipos de configuração e de
parâmetros de ferramenta a partir de esquemas TypeBox, envolve valores de retorno
simples no formato de resultado de ferramenta do OpenClaw e expõe metadados
estáticos que `openclaw plugins build` grava no manifesto do plugin.

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quotes.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "API key." })),
  }),
  tools: (tool) => [
    tool({
      name: "quote",
      label: "Quote",
      description: "Fetch a quote.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol." }),
      }),
      execute: async ({ symbol }, config) => ({ symbol, hasKey: Boolean(config.apiKey) }),
    }),
  ],
});
```

- `configSchema` é opcional. Quando omitido, o OpenClaw usa um esquema de objeto
  vazio estrito e o manifesto gerado ainda inclui `configSchema`.
- `execute` retorna uma string simples ou um valor serializável em JSON. O auxiliar
  o envolve como um resultado de ferramenta de texto com `details`.
- Os nomes de ferramentas são estáticos. `openclaw plugins build` deriva
  `contracts.tools` das ferramentas declaradas, para que autores não dupliquem
  nomes manualmente.
- O carregamento em runtime continua estrito. Plugins instalados ainda precisam de
  `openclaw.plugin.json` e `openclaw.extensions` em `package.json`; o OpenClaw
  não executa código do plugin para inferir dados de manifesto ausentes.

## `definePluginEntry`

**Importação:** `openclaw/plugin-sdk/plugin-entry`

Para plugins de provedor, plugins de ferramenta avançados, plugins de hook e
qualquer coisa que **não** seja um canal de mensagens.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
  },
});
```

| Campo          | Tipo                                                             | Obrigatório | Padrão                  |
| -------------- | ---------------------------------------------------------------- | ----------- | ----------------------- |
| `id`           | `string`                                                         | Sim         | -                       |
| `name`         | `string`                                                         | Sim         | -                       |
| `description`  | `string`                                                         | Sim         | -                       |
| `kind`         | `string`                                                         | Não         | -                       |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Não         | Esquema de objeto vazio |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Sim         | -                       |

- `id` deve corresponder ao seu manifesto `openclaw.plugin.json`.
- `kind` é para slots exclusivos: `"memory"` ou `"context-engine"`.
- `configSchema` pode ser uma função para avaliação preguiçosa.
- O OpenClaw resolve e memoiza esse esquema no primeiro acesso, então construtores
  de esquema caros são executados apenas uma vez.

## `defineChannelPluginEntry`

**Importação:** `openclaw/plugin-sdk/channel-core`

Envolve `definePluginEntry` com fiação específica de canal. Chama automaticamente
`api.registerChannel({ plugin })`, expõe uma costura opcional de metadados da CLI
de ajuda raiz e bloqueia `registerFull` com base no modo de registro.

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "My Channel",
  description: "Short summary",
  plugin: myChannelPlugin,
  setRuntime: setMyRuntime,
  registerCliMetadata(api) {
    api.registerCli(/* ... */);
  },
  registerFull(api) {
    api.registerGatewayMethod(/* ... */);
  },
});
```

| Campo                 | Tipo                                                             | Obrigatório | Padrão                  |
| --------------------- | ---------------------------------------------------------------- | ----------- | ----------------------- |
| `id`                  | `string`                                                         | Sim         | -                       |
| `name`                | `string`                                                         | Sim         | -                       |
| `description`         | `string`                                                         | Sim         | -                       |
| `plugin`              | `ChannelPlugin`                                                  | Sim         | -                       |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Não         | Esquema de objeto vazio |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Não         | -                       |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Não         | -                       |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Não         | -                       |

- `setRuntime` é chamado durante o registro para que você possa armazenar a
  referência de runtime (normalmente via `createPluginRuntimeStore`). Ele é
  ignorado durante a captura de metadados da CLI.
- `registerCliMetadata` é executado durante `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` e
  `api.registrationMode === "full"`.
  Use-o como o lugar canônico para descritores de CLI pertencentes ao canal, para
  que a ajuda raiz não ative o canal, snapshots de descoberta incluam metadados
  de comandos estáticos e o registro normal de comandos da CLI permaneça compatível
  com carregamentos completos de plugin.
- O registro de descoberta não é ativador, mas não é livre de importação. O
  OpenClaw pode avaliar a entrada do plugin confiável e o módulo do plugin de
  canal para criar o snapshot, então mantenha importações de nível superior sem
  efeitos colaterais e coloque sockets, clientes, workers e serviços atrás de
  caminhos exclusivos de `"full"`.
- `registerFull` só é executado quando `api.registrationMode === "full"`. Ele é
  ignorado durante carregamento somente de setup.
- Assim como `definePluginEntry`, `configSchema` pode ser uma factory preguiçosa
  e o OpenClaw memoiza o esquema resolvido no primeiro acesso.
- Para comandos de CLI raiz pertencentes ao plugin, prefira `api.registerCli(..., { descriptors: [...] })`
  quando quiser que o comando permaneça carregado de forma preguiçosa sem
  desaparecer da árvore de análise da CLI raiz. Para comandos de recurso de nó
  pareados, prefira `api.registerNodeCliFeature(...)` para que o comando fique
  em `openclaw nodes`. Para outros comandos de plugin aninhados, adicione
  `parentPath` e registre comandos no objeto `program` passado ao registrador; o
  OpenClaw o resolve para o comando pai antes de chamar o plugin. Para plugins de
  canal, prefira registrar esses descritores a partir de `registerCliMetadata(...)`
  e mantenha `registerFull(...)` focado em trabalho exclusivo de runtime.
- Se `registerFull(...)` também registrar métodos RPC do Gateway, mantenha-os em
  um prefixo específico do plugin. Namespaces reservados de administração do core
  (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) são sempre forçados
  para `operator.admin`.

## `defineSetupPluginEntry`

**Importação:** `openclaw/plugin-sdk/channel-core`

Para o arquivo leve `setup-entry.ts`. Retorna apenas `{ plugin }`, sem fiação de
runtime ou CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

O OpenClaw carrega isso em vez da entrada completa quando um canal está
desabilitado, não configurado ou quando o carregamento diferido está ativado.
Veja [Setup e configuração](/pt-BR/plugins/sdk-setup#setup-entry) para saber quando
isso importa.

Na prática, combine `defineSetupPluginEntry(...)` com as famílias estreitas de
auxiliares de setup:

- `openclaw/plugin-sdk/setup-runtime` para auxiliares de setup seguros para
  runtime, como `createSetupTranslator`, adaptadores de patch de setup seguros
  para importação, saída de notas de lookup, `promptResolvedAllowFrom`,
  `splitSetupEntries` e proxies de setup delegados
- `openclaw/plugin-sdk/channel-setup` para superfícies de setup de instalação
  opcional
- `openclaw/plugin-sdk/setup-tools` para auxiliares de setup/instalação de
  CLI/arquivo/docs

Mantenha SDKs pesados, registro de CLI e serviços de runtime de longa duração na
entrada completa.

Canais de workspace incluídos no pacote que separam superfícies de setup e de
runtime podem usar `defineBundledChannelSetupEntry(...)` de
`openclaw/plugin-sdk/channel-entry-contract`. Esse contrato permite que a entrada
de setup mantenha exportações de plugin/secrets seguras para setup enquanto ainda
expõe um setter de runtime:

```typescript
import { defineBundledChannelSetupEntry } from "openclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelSetupEntry({
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "myChannelPlugin",
  },
  runtime: {
    specifier: "./runtime-api.js",
    exportName: "setMyChannelRuntime",
  },
  registerSetupRuntime(api) {
    api.registerHttpRoute({
      path: "/my-channel/events",
      auth: "plugin",
      handler: async (req, res) => {
        /* setup-safe route */
      },
    });
  },
});
```

Use esse contrato incluído no pacote apenas quando fluxos de setup realmente
precisarem de um setter de runtime leve ou de uma superfície do Gateway segura
para setup antes de a entrada completa do canal carregar. `registerSetupRuntime`
é executado apenas para carregamentos `"setup-runtime"`; mantenha-o limitado a
rotas ou métodos apenas de configuração que precisam existir antes da ativação
completa diferida.

## Modo de registro

`api.registrationMode` informa ao seu plugin como ele foi carregado:

| Modo              | Quando                              | O que registrar                                                                                                        |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Inicialização normal do Gateway            | Tudo                                                                                                              |
| `"discovery"`     | Descoberta de capacidades somente leitura    | Registro de canal mais descritores estáticos da CLI; o código de entrada pode carregar, mas ignore sockets, workers, clientes e serviços |
| `"setup-only"`    | Canal desabilitado/não configurado     | Apenas registro de canal                                                                                               |
| `"setup-runtime"` | Fluxo de configuração com runtime disponível | Registro de canal mais apenas o runtime leve necessário antes que a entrada completa carregue                               |
| `"cli-metadata"`  | Ajuda raiz / captura de metadados da CLI  | Apenas descritores da CLI                                                                                                    |

`defineChannelPluginEntry` lida com essa divisão automaticamente. Se você usar
`definePluginEntry` diretamente para um canal, verifique o modo por conta própria:

```typescript
register(api) {
  if (
    api.registrationMode === "cli-metadata" ||
    api.registrationMode === "discovery" ||
    api.registrationMode === "full"
  ) {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

O modo de descoberta cria um snapshot de registro sem ativação. Ele ainda pode avaliar
a entrada do Plugin e o objeto de Plugin de canal para que o OpenClaw possa registrar
capacidades de canal e descritores estáticos da CLI. Trate a avaliação de módulo na descoberta como
confiável, mas leve: sem clientes de rede, subprocessos, listeners, conexões de banco de dados,
workers em segundo plano, leituras de credenciais ou outros efeitos colaterais de runtime ativo
no nível superior.

Trate `"setup-runtime"` como a janela em que as superfícies de inicialização apenas de configuração devem
existir sem reentrar no runtime completo do canal empacotado. Boas opções são
registro de canal, rotas HTTP seguras para configuração, métodos do Gateway seguros para configuração e
helpers de configuração delegados. Serviços pesados em segundo plano, registradores da CLI e
bootstraps de SDKs de provedor/cliente ainda pertencem a `"full"`.

Para registradores da CLI especificamente:

- use `descriptors` quando o registrador possuir um ou mais comandos raiz e você
  quiser que o OpenClaw carregue o módulo real da CLI sob demanda na primeira invocação
- certifique-se de que esses descritores cubram cada raiz de comando de nível superior exposta pelo
  registrador
- mantenha nomes de comando de descritores com letras, números, hífen e sublinhado,
  começando com uma letra ou número; o OpenClaw rejeita nomes de descritores fora
  desse formato e remove sequências de controle de terminal das descrições antes de
  renderizar a ajuda
- use apenas `commands` somente para caminhos de compatibilidade ansiosos

## Formatos de Plugin

O OpenClaw classifica plugins carregados pelo comportamento de registro deles:

| Formato                 | Descrição                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Um tipo de capacidade (por exemplo, apenas provedor)           |
| **hybrid-capability** | Vários tipos de capacidade (por exemplo, provedor + fala) |
| **hook-only**         | Apenas hooks, sem capacidades                        |
| **non-capability**    | Ferramentas/comandos/serviços, mas sem capacidades        |

Use `openclaw plugins inspect <id>` para ver o formato de um Plugin.

## Relacionados

- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) - API de registro e referência de subcaminhos
- [Helpers de runtime](/pt-BR/plugins/sdk-runtime) - `api.runtime` e `createPluginRuntimeStore`
- [Configuração e configuração](/pt-BR/plugins/sdk-setup) - manifesto, entrada de configuração, carregamento adiado
- [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) - criação do objeto `ChannelPlugin`
- [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins) - registro de provedor e hooks
