---
read_when:
    - Você precisa da assinatura de tipo exata de definePluginEntry ou defineChannelPluginEntry
    - Você quer entender o modo de registro (completo versus configuração versus metadados da CLI)
    - Você está consultando opções de ponto de entrada
sidebarTitle: Entry Points
summary: Referência para definePluginEntry, defineChannelPluginEntry e defineSetupPluginEntry
title: Pontos de entrada do Plugin
x-i18n:
    generated_at: "2026-05-06T09:08:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 296fded1572c4f95cc6c2eb8a7069a310ec05cce673003f81e86a916708cc85c
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Todo plugin exporta um objeto de entrada padrão. O SDK fornece três auxiliares para
criá-los.

Para plugins instalados, `package.json` deve direcionar o carregamento em tempo
de execução para JavaScript compilado quando disponível:

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

`extensions` e `setupEntry` continuam sendo entradas de código-fonte válidas para
desenvolvimento em workspace e checkout do git. `runtimeExtensions` e
`runtimeSetupEntry` são preferidas quando o OpenClaw carrega um pacote instalado e
permitem que pacotes npm evitem compilação TypeScript em tempo de execução.
Entradas explícitas de tempo de execução são obrigatórias: `runtimeSetupEntry`
requer `setupEntry`, e artefatos `runtimeExtensions` ou `runtimeSetupEntry`
ausentes fazem a instalação/descoberta falhar em vez de voltar silenciosamente
para o código-fonte. Se um pacote instalado declarar apenas uma entrada de
código-fonte TypeScript, o OpenClaw usará um par `dist/*.js` compilado
correspondente quando existir, depois voltará para o código-fonte TypeScript.

Todos os caminhos de entrada devem permanecer dentro do diretório do pacote do
plugin. Entradas de tempo de execução e pares JavaScript compilados inferidos não
tornam válido um caminho de código-fonte `extensions` ou `setupEntry` que escape
do pacote.

<Tip>
  **Procurando um passo a passo?** Consulte [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins)
  ou [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins) para guias passo a passo.
</Tip>

## `definePluginEntry`

**Importação:** `openclaw/plugin-sdk/plugin-entry`

Para plugins de provedor, plugins de ferramenta, plugins de hook e qualquer coisa
que **não** seja um canal de mensagens.

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
  de esquema caros só são executados uma vez.

## `defineChannelPluginEntry`

**Importação:** `openclaw/plugin-sdk/channel-core`

Encapsula `definePluginEntry` com fiação específica de canal. Chama
automaticamente `api.registerChannel({ plugin })`, expõe uma seam opcional de
metadados de CLI da ajuda raiz e bloqueia `registerFull` com base no modo de
registro.

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
  Use-o como o local canônico para descritores de CLI pertencentes ao canal, para
  que a ajuda raiz permaneça sem ativação, snapshots de descoberta incluam
  metadados estáticos de comando, e o registro normal de comandos da CLI continue
  compatível com carregamentos completos de plugin.
- O registro de descoberta é sem ativação, não livre de importações. O OpenClaw
  pode avaliar a entrada do plugin confiável e o módulo do plugin de canal para
  criar o snapshot, então mantenha importações de nível superior sem efeitos
  colaterais e coloque sockets, clientes, workers e serviços atrás de caminhos
  somente `"full"`.
- `registerFull` só é executado quando `api.registrationMode === "full"`. Ele é
  ignorado durante carregamento somente de configuração.
- Assim como `definePluginEntry`, `configSchema` pode ser uma fábrica preguiçosa e
  o OpenClaw memoiza o esquema resolvido no primeiro acesso.
- Para comandos de CLI raiz pertencentes ao plugin, prefira `api.registerCli(..., { descriptors: [...] })`
  quando quiser que o comando permaneça carregado de forma preguiçosa sem
  desaparecer da árvore de análise da CLI raiz. Para plugins de canal, prefira
  registrar esses descritores a partir de `registerCliMetadata(...)` e mantenha
  `registerFull(...)` focado em trabalho somente de runtime.
- Se `registerFull(...)` também registrar métodos RPC do Gateway, mantenha-os em
  um prefixo específico do plugin. Namespaces reservados de administração do
  núcleo (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) são sempre
  coagidos para `operator.admin`.

## `defineSetupPluginEntry`

**Importação:** `openclaw/plugin-sdk/channel-core`

Para o arquivo leve `setup-entry.ts`. Retorna apenas `{ plugin }`, sem fiação de
runtime ou CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

O OpenClaw carrega isto em vez da entrada completa quando um canal está
desabilitado, não configurado ou quando o carregamento adiado está habilitado.
Consulte [Configuração e setup](/pt-BR/plugins/sdk-setup#setup-entry) para saber quando
isso importa.

Na prática, combine `defineSetupPluginEntry(...)` com as famílias estreitas de
auxiliares de setup:

- `openclaw/plugin-sdk/setup-runtime` para auxiliares de setup seguros em runtime,
  como adaptadores de patch de setup seguros para importação, saída de nota de
  lookup, `promptResolvedAllowFrom`, `splitSetupEntries` e proxies de setup
  delegados
- `openclaw/plugin-sdk/channel-setup` para superfícies de setup de instalação
  opcional
- `openclaw/plugin-sdk/setup-tools` para auxiliares de setup/instalação da
  CLI/arquivo/docs

Mantenha SDKs pesados, registro de CLI e serviços de runtime de longa duração na
entrada completa.

Canais empacotados do workspace que separam superfícies de setup e runtime podem
usar `defineBundledChannelSetupEntry(...)` de
`openclaw/plugin-sdk/channel-entry-contract`. Esse contrato permite que a entrada
de setup mantenha exportações de plugin/segredos seguras para setup enquanto
ainda expõe um setter de runtime:

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

Use esse contrato empacotado somente quando fluxos de setup realmente precisarem
de um setter de runtime leve antes que a entrada completa do canal carregue.

## Modo de registro

`api.registrationMode` informa ao seu plugin como ele foi carregado:

| Modo              | Quando                               | O que registrar                                                                                                             |
| ----------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Inicialização normal do Gateway      | Tudo                                                                                                                        |
| `"discovery"`     | Descoberta de capacidades somente leitura | Registro de canal mais descritores estáticos de CLI; o código de entrada pode carregar, mas ignore sockets, workers, clientes e serviços |
| `"setup-only"`    | Canal desabilitado/não configurado   | Apenas registro de canal                                                                                                    |
| `"setup-runtime"` | Fluxo de setup com runtime disponível | Registro de canal mais apenas o runtime leve necessário antes que a entrada completa carregue                               |
| `"cli-metadata"`  | Ajuda raiz / captura de metadados da CLI | Apenas descritores de CLI                                                                                                   |

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

O modo de descoberta cria um snapshot de registro sem ativação. Ele ainda pode
avaliar a entrada do plugin e o objeto do plugin de canal para que o OpenClaw
possa registrar capacidades de canal e descritores estáticos de CLI. Trate a
avaliação de módulo na descoberta como confiável, mas leve: sem clientes de rede,
subprocessos, listeners, conexões de banco de dados, workers em segundo plano,
leituras de credenciais ou outros efeitos colaterais vivos de runtime no nível
superior.

Trate `"setup-runtime"` como a janela em que superfícies de inicialização somente
de setup devem existir sem reentrar no runtime completo do canal empacotado. Boas
opções são registro de canal, rotas HTTP seguras para setup, métodos de Gateway
seguros para setup e auxiliares de setup delegados. Serviços pesados em segundo
plano, registradores de CLI e inicializações de SDK de provedor/cliente ainda
pertencem a `"full"`.

Para registradores de CLI especificamente:

- use `descriptors` quando o registrador possuir um ou mais comandos raiz e você
  quiser que o OpenClaw carregue de forma preguiçosa o módulo real de CLI na
  primeira invocação
- garanta que esses descritores cubram cada raiz de comando de nível superior
  exposta pelo registrador
- mantenha nomes de comandos de descritor restritos a letras, números, hífen e
  sublinhado, começando com uma letra ou número; o OpenClaw rejeita nomes de
  descritor fora desse formato e remove sequências de controle de terminal das
  descrições antes de renderizar a ajuda
- use apenas `commands` somente para caminhos de compatibilidade ansiosos

## Formatos de plugin

OpenClaw classifica os plugins carregados pelo comportamento de registro deles:

| Formato              | Descrição                                           |
| -------------------- | --------------------------------------------------- |
| **plain-capability**  | Um tipo de capability (por exemplo, somente provider) |
| **hybrid-capability** | Vários tipos de capability (por exemplo, provider + speech) |
| **hook-only**         | Somente hooks, sem capabilities                     |
| **non-capability**    | Ferramentas/comandos/serviços, mas sem capabilities |

Use `openclaw plugins inspect <id>` para ver o formato de um plugin.

## Relacionados

- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) - API de registro e referência de subcaminhos
- [Auxiliares de runtime](/pt-BR/plugins/sdk-runtime) - `api.runtime` e `createPluginRuntimeStore`
- [Configuração e Config](/pt-BR/plugins/sdk-setup) - manifesto, entrada de configuração, carregamento adiado
- [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) - criação do objeto `ChannelPlugin`
- [Plugins de provider](/pt-BR/plugins/sdk-provider-plugins) - registro de provider e hooks
