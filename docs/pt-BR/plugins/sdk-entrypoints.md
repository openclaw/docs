---
read_when:
    - Você precisa da assinatura exata de tipo de `definePluginEntry` ou `defineChannelPluginEntry`
    - Você quer entender o modo de registro (full vs setup vs metadados de CLI)
    - Você está procurando opções de ponto de entrada
sidebarTitle: Entry Points
summary: Referência de `definePluginEntry`, `defineChannelPluginEntry` e `defineSetupPluginEntry`
title: Pontos de entrada de Plugin
x-i18n:
    generated_at: "2026-04-25T13:51:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8253cf0ac43ca11b42c0032027bba6e926c961b54901caaa63da70bd5ff5aab5
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

Todo Plugin exporta um objeto de entrada padrão. O SDK fornece três helpers para
criá-los.

Para Plugins instalados, `package.json` deve apontar o carregamento em runtime para
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

`extensions` e `setupEntry` continuam válidos como entradas de código-fonte para desenvolvimento em workspace e checkout do git.
`runtimeExtensions` e `runtimeSetupEntry` são preferidos
quando o OpenClaw carrega um pacote instalado e permitem que pacotes npm evitem compilação
de TypeScript em runtime. Se um pacote instalado declarar apenas uma entrada de código-fonte TypeScript,
o OpenClaw usará um par compilado correspondente `dist/*.js` quando existir e, em seguida, fará fallback para o código-fonte TypeScript.

Todos os caminhos de entrada devem permanecer dentro do diretório do pacote do Plugin. Entradas de runtime
e pares JavaScript compilados inferidos não tornam válido um caminho de código-fonte `extensions` ou
`setupEntry` que escape desse diretório.

<Tip>
  **Procurando um passo a passo?** Consulte [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins)
  ou [Plugins de provider](/pt-BR/plugins/sdk-provider-plugins) para guias passo a passo.
</Tip>

## `definePluginEntry`

**Importação:** `openclaw/plugin-sdk/plugin-entry`

Para Plugins de provider, Plugins de ferramenta, Plugins de hook e qualquer coisa que **não** seja
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

| Campo          | Tipo                                                             | Obrigatório | Padrão               |
| -------------- | ---------------------------------------------------------------- | ----------- | -------------------- |
| `id`           | `string`                                                         | Sim         | —                    |
| `name`         | `string`                                                         | Sim         | —                    |
| `description`  | `string`                                                         | Sim         | —                    |
| `kind`         | `string`                                                         | Não         | —                    |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Não         | Schema de objeto vazio |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Sim         | —                    |

- `id` deve corresponder ao seu manifest `openclaw.plugin.json`.
- `kind` é para slots exclusivos: `"memory"` ou `"context-engine"`.
- `configSchema` pode ser uma função para avaliação lazy.
- O OpenClaw resolve e memoiza esse schema no primeiro acesso, então builders de schema
  caros são executados apenas uma vez.

## `defineChannelPluginEntry`

**Importação:** `openclaw/plugin-sdk/channel-core`

Encapsula `definePluginEntry` com integração específica de canal. Chama automaticamente
`api.registerChannel({ plugin })`, expõe uma seam opcional de metadados de CLI de ajuda raiz e controla `registerFull` por modo de registro.

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

| Campo                 | Tipo                                                             | Obrigatório | Padrão               |
| --------------------- | ---------------------------------------------------------------- | ----------- | -------------------- |
| `id`                  | `string`                                                         | Sim         | —                    |
| `name`                | `string`                                                         | Sim         | —                    |
| `description`         | `string`                                                         | Sim         | —                    |
| `plugin`              | `ChannelPlugin`                                                  | Sim         | —                    |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Não         | Schema de objeto vazio |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Não         | —                    |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Não         | —                    |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Não         | —                    |

- `setRuntime` é chamado durante o registro para que você possa armazenar a referência de runtime
  (normalmente via `createPluginRuntimeStore`). Ele é ignorado durante a captura
  de metadados de CLI.
- `registerCliMetadata` é executado durante `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` e
  `api.registrationMode === "full"`.
  Use-o como local canônico para descritores de CLI de propriedade do canal, para que a ajuda raiz
  permaneça não ativadora, snapshots de descoberta incluam metadados estáticos de comando e
  o registro normal de comandos CLI permaneça compatível com carregamentos completos de Plugin.
- O registro de descoberta é não ativador, não livre de importação. O OpenClaw pode
  avaliar a entrada de Plugin confiável e o módulo do Plugin de canal para construir o
  snapshot, então mantenha imports de nível superior sem efeitos colaterais e coloque sockets,
  clientes, workers e serviços atrás de caminhos apenas de `"full"`.
- `registerFull` só é executado quando `api.registrationMode === "full"`. Ele é ignorado
  durante carregamento apenas de setup.
- Assim como `definePluginEntry`, `configSchema` pode ser uma fábrica lazy e o OpenClaw
  memoiza o schema resolvido no primeiro acesso.
- Para comandos CLI raiz de propriedade do Plugin, prefira `api.registerCli(..., { descriptors: [...] })`
  quando você quiser que o comando permaneça lazy-loaded sem desaparecer da
  árvore de análise da CLI raiz. Para Plugins de canal, prefira registrar esses descritores
  a partir de `registerCliMetadata(...)` e mantenha `registerFull(...)` focado em trabalho apenas de runtime.
- Se `registerFull(...)` também registrar métodos RPC do Gateway, mantenha-os em um
  prefixo específico do Plugin. Namespaces administrativos centrais reservados (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) sempre são forçados para
  `operator.admin`.

## `defineSetupPluginEntry`

**Importação:** `openclaw/plugin-sdk/channel-core`

Para o arquivo leve `setup-entry.ts`. Retorna apenas `{ plugin }`, sem
integração de runtime ou CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

O OpenClaw carrega isso em vez da entrada completa quando um canal está desativado,
não configurado ou quando o carregamento adiado está ativado. Consulte
[Setup e configuração](/pt-BR/plugins/sdk-setup#setup-entry) para saber quando isso importa.

Na prática, combine `defineSetupPluginEntry(...)` com as famílias estreitas de helpers de setup:

- `openclaw/plugin-sdk/setup-runtime` para helpers de setup seguros em runtime, como
  adaptadores de patch de setup seguros para importação, saída de nota de consulta,
  `promptResolvedAllowFrom`, `splitSetupEntries` e proxies de setup delegados
- `openclaw/plugin-sdk/channel-setup` para superfícies de setup de instalação opcional
- `openclaw/plugin-sdk/setup-tools` para helpers de CLI/arquivo/docs de setup/instalação

Mantenha SDKs pesados, registro de CLI e serviços de runtime de longa duração na entrada
completa.

Canais incluídos em workspace que dividem superfícies de setup e runtime podem usar
`defineBundledChannelSetupEntry(...)` de
`openclaw/plugin-sdk/channel-entry-contract` em vez disso. Esse contrato permite que a
entrada de setup mantenha exports de plugin/segredos seguros para setup e ainda exponha um
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

Use esse contrato incluído apenas quando fluxos de setup realmente precisarem de um setter leve de runtime
antes que a entrada completa do canal seja carregada.

## Modo de registro

`api.registrationMode` informa ao seu Plugin como ele foi carregado:

| Modo              | Quando                              | O que registrar                                                                                                      |
| ----------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Inicialização normal do Gateway     | Tudo                                                                                                                 |
| `"discovery"`     | Descoberta somente leitura de capacidade | Registro de canal mais descritores estáticos de CLI; o código de entrada pode carregar, mas ignore sockets, workers, clientes e serviços |
| `"setup-only"`    | Canal desativado/não configurado    | Apenas registro de canal                                                                                             |
| `"setup-runtime"` | Fluxo de setup com runtime disponível | Registro de canal mais apenas o runtime leve necessário antes de a entrada completa ser carregada                 |
| `"cli-metadata"`  | Ajuda raiz / captura de metadados de CLI | Apenas descritores de CLI                                                                                        |

`defineChannelPluginEntry` trata essa divisão automaticamente. Se você usar
`definePluginEntry` diretamente para um canal, verifique o modo você mesmo:

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

  // Registros pesados apenas de runtime
  api.registerService(/* ... */);
}
```

O modo de descoberta constrói um snapshot de registro não ativador. Ele ainda pode avaliar
a entrada do Plugin e o objeto do Plugin de canal para que o OpenClaw possa registrar
capacidades de canal e descritores estáticos de CLI. Trate a avaliação de módulo em descoberta como
confiável, porém leve: sem clientes de rede, subprocessos, listeners, conexões com banco de dados,
workers em segundo plano, leitura de credenciais ou outros efeitos colaterais ativos de runtime no nível superior.

Trate `"setup-runtime"` como a janela em que superfícies de inicialização somente de setup devem
existir sem reentrar no runtime completo do canal incluído. Bons encaixes são
registro de canal, rotas HTTP seguras para setup, métodos seguros de Gateway para setup e
helpers delegados de setup. Serviços pesados em segundo plano, registradores de CLI e
bootstraps de SDK de provider/cliente ainda pertencem a `"full"`.

Especificamente para registradores de CLI:

- use `descriptors` quando o registrador controla um ou mais comandos raiz e você
  quer que o OpenClaw carregue lazy o módulo real de CLI na primeira invocação
- garanta que esses descritores cubram cada raiz de comando de nível superior exposta pelo
  registrador
- mantenha nomes de comando de descritor com letras, números, hífen e underscore,
  começando com uma letra ou número; o OpenClaw rejeita nomes de descritor fora
  desse formato e remove sequências de controle de terminal das descrições antes de
  renderizar a ajuda
- use apenas `commands` para caminhos de compatibilidade eager

## Formatos de Plugin

O OpenClaw classifica Plugins carregados pelo comportamento de registro deles:

| Formato               | Descrição                                          |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Um tipo de capacidade (por exemplo, apenas provider) |
| **hybrid-capability** | Vários tipos de capacidade (por exemplo, provider + fala) |
| **hook-only**         | Apenas hooks, sem capacidades                      |
| **non-capability**    | Ferramentas/comandos/serviços, mas sem capacidades |

Use `openclaw plugins inspect <id>` para ver o formato de um Plugin.

## Relacionado

- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência da API de registro e subcaminhos
- [Helpers de runtime](/pt-BR/plugins/sdk-runtime) — `api.runtime` e `createPluginRuntimeStore`
- [Setup e configuração](/pt-BR/plugins/sdk-setup) — manifest, setup entry, carregamento adiado
- [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) — criando o objeto `ChannelPlugin`
- [Plugins de provider](/pt-BR/plugins/sdk-provider-plugins) — registro de provider e hooks
