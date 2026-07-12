---
read_when:
    - Você precisa da assinatura de tipo exata de defineToolPlugin, definePluginEntry ou defineChannelPluginEntry
    - Você quer entender o modo de registro (completo vs. configuração vs. metadados da CLI)
    - Você está consultando as opções de ponto de entrada
sidebarTitle: Entry Points
summary: Referência para defineToolPlugin, definePluginEntry, defineChannelPluginEntry e defineSetupPluginEntry
title: Pontos de entrada de Plugin
x-i18n:
    generated_at: "2026-07-12T15:33:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fba10e51604d6b83b5da265530565fddf3129c5a6e69c4f1a65d5455fe99ad83
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Todo plugin exporta um objeto de entrada padrão. O SDK fornece um auxiliar para
cada formato de entrada: `defineToolPlugin`, `definePluginEntry`,
`defineChannelPluginEntry`, `defineSetupPluginEntry`.

<Tip>
  **Procurando um passo a passo?** Consulte [Plugins de ferramentas](/pt-BR/plugins/tool-plugins),
  [Plugins de canais](/pt-BR/plugins/sdk-channel-plugins) ou
  [Plugins de provedores](/pt-BR/plugins/sdk-provider-plugins) para ver guias detalhados.
</Tip>

## Entradas do pacote

Os plugins instalados apontam os campos `openclaw` do `package.json` tanto para as entradas
de origem quanto para as compiladas:

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

- `extensions` e `setupEntry` são entradas de origem, usadas no desenvolvimento em workspace e em
  checkout do git.
- `runtimeExtensions` e `runtimeSetupEntry` são preferíveis para pacotes
  instalados: permitem que pacotes npm dispensem a compilação de TypeScript em tempo de execução.
- `runtimeExtensions`, quando presente, deve corresponder a `extensions` no tamanho do array
  (as entradas são pareadas por posição). `runtimeSetupEntry` exige `setupEntry`.
- Se um artefato `runtimeExtensions`/`runtimeSetupEntry` for declarado, mas
  estiver ausente, a instalação/descoberta falhará com um erro de empacotamento; o OpenClaw não
  retorna silenciosamente para a origem. O fallback para a origem (abaixo) só se aplica quando nenhuma
  entrada de runtime é declarada.
- Se um pacote instalado declarar apenas uma entrada de origem TypeScript, o OpenClaw
  procurará um arquivo compilado correspondente em `dist/*.js` (ou `.mjs`/`.cjs`) e o utilizará;
  caso contrário, retornará para a origem TypeScript.
- Todos os caminhos de entrada devem permanecer dentro do diretório do pacote do plugin. Entradas de
  runtime e arquivos JavaScript compilados correspondentes inferidos não tornam válido um caminho de origem
  `extensions` ou `setupEntry` que escape do diretório.

## `defineToolPlugin`

**Importação:** `openclaw/plugin-sdk/tool-plugin`

Para plugins que apenas adicionam ferramentas de agente. Mantém o código-fonte pequeno, infere os tipos de configuração
e dos parâmetros das ferramentas a partir de esquemas TypeBox, encapsula valores de retorno simples no
formato de resultado de ferramenta do OpenClaw e expõe metadados estáticos que
`openclaw plugins build` grava no manifesto do plugin (`contracts.tools`,
`configSchema`).

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

- `configSchema` é opcional; omiti-lo usa um esquema estrito de objeto vazio
  (o manifesto gerado ainda inclui `configSchema`).
- `execute` retorna uma string simples ou um valor serializável em JSON; o auxiliar
  o encapsula como um resultado textual de ferramenta, com `details` definido como o valor de retorno
  original (não convertido em string).
- Para resultados de ferramenta personalizados, `openclaw/plugin-sdk/tool-results` exporta
  `textResult` e `jsonResult`.
- Os nomes das ferramentas são estáticos, portanto `openclaw plugins build` deriva
  `contracts.tools` das ferramentas declaradas sem duplicar manualmente os nomes.
- O carregamento em runtime permanece estrito: plugins instalados ainda precisam de
  `openclaw.plugin.json` e de `openclaw.extensions` no `package.json`. O OpenClaw
  nunca executa o código do plugin para inferir dados ausentes do manifesto.

## `definePluginEntry`

**Importação:** `openclaw/plugin-sdk/plugin-entry`

Para plugins de provedores, plugins avançados de ferramentas, plugins de hooks e tudo o que
**não** seja um canal de mensagens.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({/* ... */});
    api.registerTool({/* ... */});
  },
});
```

| Campo                     | Tipo                                                             | Obrigatório | Padrão                  |
| ------------------------- | ---------------------------------------------------------------- | ----------- | ----------------------- |
| `id`                      | `string`                                                         | Sim         | -                       |
| `name`                    | `string`                                                         | Sim         | -                       |
| `description`             | `string`                                                         | Sim         | -                       |
| `kind`                    | `string` (obsoleto, veja abaixo)                                 | Não         | -                       |
| `configSchema`            | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Não         | Esquema de objeto vazio |
| `reload`                  | `OpenClawPluginReloadRegistration`                               | Não         | -                       |
| `nodeHostCommands`        | `OpenClawPluginNodeHostCommand[]`                                | Não         | -                       |
| `securityAuditCollectors` | `OpenClawPluginSecurityAuditCollector[]`                         | Não         | -                       |
| `register`                | `(api: OpenClawPluginApi) => void`                               | Sim         | -                       |

- `id` deve corresponder ao seu manifesto `openclaw.plugin.json`.
- Catálogos de sessões externos usam
  `openclaw/plugin-sdk/session-catalog` e
  `api.registerSessionCatalog({ id, label, list, read, continueSession?, archive? })`.
  O núcleo é responsável pelos métodos `sessions.catalog.*` do Gateway; os provedores retornam projeções
  de host, sessão e transcrição normalizada sem registrar RPCs.
- `kind` está obsoleto: em vez dele, declare um slot exclusivo (`"memory"` ou
  `"context-engine"`) no campo `kind` do manifesto `openclaw.plugin.json`.
  O `kind` da entrada de runtime permanece apenas como fallback de compatibilidade para
  plugins mais antigos.
- `configSchema` pode ser uma função para avaliação tardia. O OpenClaw resolve e
  memoriza o esquema no primeiro acesso, portanto construtores de esquema custosos são executados apenas
  uma vez.
- Um descritor `nodeHostCommands` pode definir `isAvailable({ config, env })`.
  Retornar `false` omite esse comando e sua capacidade da declaração do Gateway
  do Node sem interface gráfica. O OpenClaw o avalia com base na configuração de inicialização local
  do Node; os manipuladores de comandos ainda devem validar a disponibilidade quando
  invocados.

## `defineChannelPluginEntry`

**Importação:** `openclaw/plugin-sdk/channel-core`

Encapsula `definePluginEntry` com a integração específica de canal: chama automaticamente
`api.registerChannel({ plugin })`, expõe uma interface opcional de metadados da CLI
para a ajuda raiz e condiciona `registerFull` ao modo de registro.

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

Os callbacks são executados de acordo com o modo de registro (tabela completa em
[Modo de registro](#registration-mode)):

- `setRuntime` é executado em todos os modos, exceto `"cli-metadata"` e
  `"tool-discovery"`. Armazene aqui a referência ao runtime, normalmente por meio de
  `createPluginRuntimeStore`.
- `registerCliMetadata` é executado para `"cli-metadata"`, `"discovery"` e
  `"full"`. Use-o como o local canônico para descritores da CLI pertencentes ao canal,
  para que a ajuda raiz permaneça sem ativação, os snapshots de descoberta incluam
  metadados estáticos de comandos e o registro normal da CLI permaneça compatível com os carregamentos
  completos do plugin.
- `registerFull` é executado apenas para `"full"` e `"tool-discovery"`. Para
  `"tool-discovery"`, ele é executado _em vez do_ registro do canal: o OpenClaw
  ignora completamente `registerChannel`/`setRuntime` e chama apenas
  `registerFull`; portanto, qualquer registro de provedor/ferramenta de que seu canal precise para
  descoberta ou execução independente de ferramentas deve ficar ali, e não atrás da configuração normal
  do canal.
- O registro de descoberta não realiza ativação, mas não dispensa importações: o OpenClaw pode
  avaliar a entrada confiável do plugin e o módulo do plugin de canal para criar o
  snapshot. Mantenha as importações de nível superior livres de efeitos colaterais e coloque sockets,
  clientes, workers e serviços em caminhos exclusivos de `"full"`.
- Assim como `definePluginEntry`, `configSchema` pode ser uma fábrica de avaliação tardia; o OpenClaw
  memoriza o esquema resolvido no primeiro acesso.

Registro da CLI:

- Use `api.registerCli(..., { descriptors: [...] })` para comandos raiz da
  CLI pertencentes ao plugin que você deseja carregar sob demanda sem que desapareçam da árvore de
  análise da CLI raiz. Os nomes dos descritores devem corresponder a letras, números, hífen e
  sublinhado, começando com uma letra ou um número; o OpenClaw rejeita outros
  formatos e remove sequências de controle de terminal das descrições antes de
  renderizar a ajuda. Abranja cada raiz de comando de nível superior exposta pelo registrador.
  `commands` sozinho permanece no caminho de compatibilidade com carregamento imediato.
- Use `api.registerNodeCliFeature(...)` para comandos de recursos do Node pareado, para
  que apareçam sob `openclaw nodes` (equivalente a
  `registerCli(registrar, { parentPath: ["nodes"], ... })`).
- Para outros comandos aninhados do plugin, adicione `parentPath` e registre os comandos
  no objeto `program` passado ao registrador; o OpenClaw o resolve para
  o comando pai antes de chamar o plugin.
- Para plugins de canais, registre os descritores da CLI a partir de `registerCliMetadata`
  e mantenha `registerFull` concentrado apenas no trabalho de runtime.
- Se `registerFull` também registrar métodos RPC do Gateway, mantenha-os em um
  prefixo específico do plugin. Namespaces administrativos reservados do núcleo (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) sempre são convertidos para
  `operator.admin`.

## `defineSetupPluginEntry`

**Importação:** `openclaw/plugin-sdk/channel-core`

Para o arquivo leve `setup-entry.ts`. Retorna apenas `{ plugin }`, sem
integração de runtime ou da CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

O OpenClaw carrega essa entrada em vez da entrada completa quando um canal está desativado,
não configurado ou quando o carregamento adiado está habilitado. Consulte
[Configuração](/pt-BR/plugins/sdk-setup#setup-entry) para saber quando isso é relevante.

Combine `defineSetupPluginEntry(...)` com as famílias restritas de auxiliares de configuração:

| Importação                          | Usar para                                                                                                                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw/plugin-sdk/setup-runtime` | Auxiliares de configuração seguros para o runtime: `createSetupTranslator`, adaptadores de patches de configuração seguros para importação, saída de notas de pesquisa, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies de configuração delegados |
| `openclaw/plugin-sdk/channel-setup` | Superfícies de configuração de instalação opcional                                                                                                                                                |
| `openclaw/plugin-sdk/setup-tools`   | Auxiliares de CLI de configuração/instalação, arquivos e documentação                                                                                                                             |

Mantenha SDKs pesados, o registro da CLI e serviços de runtime de longa duração na
entrada completa.

Canais incluídos no workspace que separam as superfícies de configuração e runtime podem usar
`defineBundledChannelSetupEntry(...)` de
`openclaw/plugin-sdk/channel-entry-contract` como alternativa. Isso permite que a entrada de
configuração mantenha as exportações de plugin/segredos seguras para configuração, enquanto ainda expõe um
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
  registerSetupRuntime(api) {
    api.registerHttpRoute({
      path: "/my-channel/events",
      auth: "plugin",
      handler: async (req, res) => {
        /* rota segura para configuração */
      },
    });
  },
});
```

Use isso somente quando um fluxo de configuração realmente precisar de um setter de runtime leve ou de uma
superfície de Gateway segura para configuração antes que a entrada completa do canal seja carregada.
`registerSetupRuntime` é executado somente em carregamentos `"setup-runtime"`; mantenha-o
limitado a rotas ou métodos somente de configuração que precisem existir antes da
ativação completa adiada.

## Modo de registro

`api.registrationMode` informa ao seu plugin como ele foi carregado:

| Modo               | Quando                                             | O que registrar                                                                                                                        |
| ------------------ | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `"full"`           | Inicialização normal do Gateway                    | Tudo                                                                                                                                    |
| `"discovery"`      | Descoberta de recursos somente leitura             | Registro do canal e descritores estáticos da CLI; o código da entrada pode ser carregado, mas ignore sockets, workers, clientes e serviços |
| `"tool-discovery"` | Carregamento com escopo para listar ou executar ferramentas de plugins específicos | Somente registro de recursos/ferramentas; sem ativação do canal                                                                          |
| `"setup-only"`     | Canal desabilitado/não configurado                 | Somente registro do canal                                                                                                                |
| `"setup-runtime"`  | Fluxo de configuração com runtime disponível       | Registro do canal e somente o runtime leve necessário antes que a entrada completa seja carregada                                       |
| `"cli-metadata"`   | Captura da ajuda raiz/metadados da CLI             | Somente descritores da CLI                                                                                                               |

`defineChannelPluginEntry` gerencia essa separação automaticamente. Se você usar
`definePluginEntry` diretamente para um canal, verifique o modo por conta própria e lembre-se de que
`"tool-discovery"` ignora o registro do canal:

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

  if (api.registrationMode === "tool-discovery") {
    // Registre superfícies somente de recursos (provedores/ferramentas), sem canal.
    return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Registros pesados exclusivos do runtime
  api.registerService(/* ... */);
}
```

O modo de descoberta cria um snapshot do registro sem ativação. Ele ainda pode
avaliar a entrada do plugin e o objeto do plugin de canal para que o OpenClaw possa
registrar os recursos do canal e os descritores estáticos da CLI. Trate a avaliação do
módulo durante a descoberta como confiável, porém leve: sem clientes de rede,
subprocessos, listeners, conexões com bancos de dados, workers em segundo plano,
leituras de credenciais ou outros efeitos colaterais de runtime ativo no nível superior.

Trate `"setup-runtime"` como a janela em que as superfícies de inicialização exclusivas da configuração precisam
existir sem entrar novamente no runtime completo do canal incluído. Bons casos de uso são
o registro de canais, rotas HTTP seguras para configuração, métodos de Gateway seguros para configuração
e auxiliares de configuração delegados. Serviços pesados em segundo plano, registradores da CLI e
inicializações de SDKs de provedores/clientes ainda pertencem a `"full"`.

## Formatos de plugin

O OpenClaw classifica os plugins carregados pelo comportamento de registro:

| Formato               | Descrição                                             |
| --------------------- | ----------------------------------------------------- |
| **plain-capability**  | Um tipo de recurso (por exemplo, somente provedor)    |
| **hybrid-capability** | Vários tipos de recursos (por exemplo, provedor + voz) |
| **hook-only**         | Somente hooks, sem recursos                           |
| **non-capability**    | Ferramentas/comandos/serviços, mas sem recursos       |

Use `openclaw plugins inspect <id>` para ver o formato de um plugin.

## Relacionados

- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) - API de registro e referência de subcaminhos
- [Auxiliares de runtime](/pt-BR/plugins/sdk-runtime) - `api.runtime` e `createPluginRuntimeStore`
- [Configuração e config](/pt-BR/plugins/sdk-setup) - manifesto, entrada de configuração, carregamento adiado
- [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) - criação do objeto `ChannelPlugin`
- [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins) - registro de provedores e hooks
