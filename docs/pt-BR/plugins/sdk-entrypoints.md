---
read_when:
    - Você precisa da assinatura de tipo exata de definePluginEntry ou defineChannelPluginEntry
    - Você quer entender o modo de registro (full vs setup vs metadados de CLI)
    - Você está consultando opções de ponto de entrada
sidebarTitle: Entry Points
summary: Referência para definePluginEntry, defineChannelPluginEntry e defineSetupPluginEntry
title: Pontos de entrada de Plugin
x-i18n:
    generated_at: "2026-04-24T06:03:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 517559e16416cbf9d152a0ca2e09f57de92ff65277fec768cbaf38d9de62e051
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

Todo Plugin exporta um objeto de entrada padrão. O SDK fornece três helpers para
criá-los.

Para Plugins instalados, `package.json` deve apontar o carregamento de runtime para
JavaScript compilado quando disponível:

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

`extensions` e `setupEntry` continuam sendo entradas de source válidas para
desenvolvimento em workspace e checkout git. `runtimeExtensions` e
`runtimeSetupEntry` são preferidos quando o OpenClaw carrega um pacote instalado e
permitem que pacotes npm evitem compilação TypeScript em runtime. Se um pacote instalado
declarar apenas uma entrada de source TypeScript, o OpenClaw usará um peer
`dist/*.js` compilado correspondente quando existir e, em seguida, usará o source TypeScript como fallback.

Todos os caminhos de entrada devem permanecer dentro do diretório do pacote do plugin. Entradas de runtime
e peers inferidos de JavaScript compilado não tornam válido um caminho de source
`extensions` ou `setupEntry` que escape desse diretório.

<Tip>
  **Procurando um passo a passo?** Consulte [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins)
  ou [Plugins de provider](/pt-BR/plugins/sdk-provider-plugins) para guias passo a passo.
</Tip>

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

Para plugins de provider, plugins de tool, plugins de hook e qualquer coisa que **não** seja
um canal de mensagens.

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

| Campo          | Tipo                                                             | Obrigatório | Padrão              |
| -------------- | ---------------------------------------------------------------- | ----------- | ------------------- |
| `id`           | `string`                                                         | Sim         | —                   |
| `name`         | `string`                                                         | Sim         | —                   |
| `description`  | `string`                                                         | Sim         | —                   |
| `kind`         | `string`                                                         | Não         | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Não         | Schema de objeto vazio |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Sim         | —                   |

- `id` deve corresponder ao seu manifesto `openclaw.plugin.json`.
- `kind` é para slots exclusivos: `"memory"` ou `"context-engine"`.
- `configSchema` pode ser uma função para avaliação lazy.
- O OpenClaw resolve e memoiza esse schema no primeiro acesso, então builders de schema
  caros executam apenas uma vez.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Encapsula `definePluginEntry` com wiring específico de canal. Chama automaticamente
`api.registerChannel({ plugin })`, expõe uma interface opcional de metadados de CLI de root-help e
controla `registerFull` pelo modo de registro.

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

| Campo                 | Tipo                                                             | Obrigatório | Padrão              |
| --------------------- | ---------------------------------------------------------------- | ----------- | ------------------- |
| `id`                  | `string`                                                         | Sim         | —                   |
| `name`                | `string`                                                         | Sim         | —                   |
| `description`         | `string`                                                         | Sim         | —                   |
| `plugin`              | `ChannelPlugin`                                                  | Sim         | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Não         | Schema de objeto vazio |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Não         | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Não         | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Não         | —                   |

- `setRuntime` é chamado durante o registro para que você possa armazenar a referência de runtime
  (normalmente via `createPluginRuntimeStore`). Ele é ignorado durante a captura
  de metadados de CLI.
- `registerCliMetadata` é executado tanto quando `api.registrationMode === "cli-metadata"`
  quanto quando `api.registrationMode === "full"`.
  Use-o como o local canônico para descritores de CLI pertencentes ao canal, para que a ajuda de root
  permaneça sem ativação, enquanto o registro normal de comandos CLI continua compatível
  com carregamentos completos do plugin.
- `registerFull` só é executado quando `api.registrationMode === "full"`. Ele é ignorado
  durante o carregamento apenas de setup.
- Como em `definePluginEntry`, `configSchema` pode ser uma factory lazy, e o OpenClaw
  memoiza o schema resolvido no primeiro acesso.
- Para comandos CLI de root pertencentes ao plugin, prefira `api.registerCli(..., { descriptors: [...] })`
  quando quiser que o comando permaneça com lazy-load sem desaparecer da
  árvore de parse da CLI root. Para plugins de canal, prefira registrar esses descritores
  em `registerCliMetadata(...)` e mantenha `registerFull(...)` focado em trabalho apenas de runtime.
- Se `registerFull(...)` também registrar métodos RPC do gateway, mantenha-os em um
  prefixo específico do plugin. Namespaces administrativos reservados do núcleo (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) são sempre coercidos para
  `operator.admin`.

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Para o arquivo leve `setup-entry.ts`. Retorna apenas `{ plugin }` sem
wiring de runtime ou CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

O OpenClaw carrega isso em vez da entrada completa quando um canal está desabilitado,
não configurado ou quando o carregamento adiado está habilitado. Consulte
[Setup e config](/pt-BR/plugins/sdk-setup#setup-entry) para entender quando isso importa.

Na prática, combine `defineSetupPluginEntry(...)` com as famílias estreitas de helper
de setup:

- `openclaw/plugin-sdk/setup-runtime` para helpers de setup seguros em runtime, como
  adaptadores import-safe de patch de setup, saída de lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` e proxies de setup delegados
- `openclaw/plugin-sdk/channel-setup` para superfícies de setup com instalação opcional
- `openclaw/plugin-sdk/setup-tools` para helpers de CLI/setup/install/archive/docs

Mantenha SDKs pesados, registro de CLI e serviços de runtime de longa duração na entrada completa.

Canais integrados do workspace que dividem superfícies de setup e runtime podem usar
`defineBundledChannelSetupEntry(...)` de
`openclaw/plugin-sdk/channel-entry-contract` em vez disso. Esse contrato permite que a
entrada de setup mantenha exports seguros para setup de plugin/secrets, enquanto ainda expõe um
setter de runtime:

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
});
```

Use esse contrato integrado apenas quando fluxos de setup realmente precisarem de um setter de runtime
leve antes do carregamento da entrada completa do canal.

## Modo de registro

`api.registrationMode` informa ao seu plugin como ele foi carregado:

| Modo              | Quando                            | O que registrar                                                                          |
| ----------------- | --------------------------------- | ---------------------------------------------------------------------------------------- |
| `"full"`          | Inicialização normal do gateway   | Tudo                                                                                     |
| `"setup-only"`    | Canal desabilitado/não configurado | Apenas registro de canal                                                                 |
| `"setup-runtime"` | Fluxo de setup com runtime disponível | Registro de canal mais apenas o runtime leve necessário antes do carregamento da entrada completa |
| `"cli-metadata"`  | Root help / captura de metadados da CLI | Apenas descritores de CLI                                                             |

`defineChannelPluginEntry` trata essa divisão automaticamente. Se você usar
`definePluginEntry` diretamente para um canal, verifique o modo por conta própria:

```typescript
register(api) {
  if (api.registrationMode === "cli-metadata" || api.registrationMode === "full") {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Registros pesados apenas de runtime
  api.registerService(/* ... */);
}
```

Trate `"setup-runtime"` como a janela em que superfícies de inicialização apenas de setup devem
existir sem reentrar no runtime completo do canal integrado. Boas opções são
registro de canal, rotas HTTP seguras para setup, métodos de gateway seguros para setup e
helpers de setup delegados. Serviços pesados em segundo plano, registradores de CLI e
bootstraps de SDK de provider/client ainda pertencem a `"full"`.

Especificamente para registradores de CLI:

- use `descriptors` quando o registrador for dono de um ou mais comandos root e você
  quiser que o OpenClaw faça lazy-load do módulo CLI real na primeira invocação
- certifique-se de que esses descritores cubram toda raiz de comando de nível superior exposta pelo
  registrador
- use apenas `commands` somente para caminhos de compatibilidade eager

## Formatos de plugin

O OpenClaw classifica plugins carregados pelo seu comportamento de registro:

| Formato               | Descrição                                         |
| --------------------- | ------------------------------------------------- |
| **plain-capability**  | Um tipo de capacidade (por exemplo, apenas provider) |
| **hybrid-capability** | Vários tipos de capacidade (por exemplo, provider + fala) |
| **hook-only**         | Apenas hooks, sem capacidades                     |
| **non-capability**    | Tools/comandos/serviços, mas sem capacidades      |

Use `openclaw plugins inspect <id>` para ver o formato de um plugin.

## Relacionado

- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — API de registro e referência de subpaths
- [Helpers de runtime](/pt-BR/plugins/sdk-runtime) — `api.runtime` e `createPluginRuntimeStore`
- [Setup e config](/pt-BR/plugins/sdk-setup) — manifesto, entrada de setup, carregamento adiado
- [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) — construção do objeto `ChannelPlugin`
- [Plugins de provider](/pt-BR/plugins/sdk-provider-plugins) — registro de provider e hooks
