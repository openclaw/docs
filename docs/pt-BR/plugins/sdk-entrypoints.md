---
read_when:
    - Você precisa da assinatura de tipo exata de defineToolPlugin, definePluginEntry ou defineChannelPluginEntry
    - Você quer entender o modo de registro (completo vs. configuração vs. metadados da CLI)
    - Você está consultando as opções de ponto de entrada
sidebarTitle: Entry Points
summary: Referência para defineToolPlugin, definePluginEntry, defineChannelPluginEntry e defineSetupPluginEntry
title: Pontos de entrada de Plugins
x-i18n:
    generated_at: "2026-07-16T12:49:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8b2133dbe4ee650b27e110d472b38284d557f715829e3f0d73f8dc6c910c7c99
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Todo plugin exporta um objeto de entrada padrão. O SDK fornece um auxiliar para
cada formato de entrada: `defineToolPlugin`, `definePluginEntry`,
`defineChannelPluginEntry`, `defineSetupPluginEntry`.

<Tip>
  **Procurando um passo a passo?** Consulte [Plugins de ferramentas](/pt-BR/plugins/tool-plugins),
  [Plugins de canais](/pt-BR/plugins/sdk-channel-plugins) ou
  [Plugins de provedores](/pt-BR/plugins/sdk-provider-plugins) para ver guias passo a passo.
</Tip>

## Entradas do pacote

Os plugins instalados apontam os campos `package.json` `openclaw` tanto para as entradas de origem quanto para
as compiladas:

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
  instalados: eles permitem que pacotes npm dispensem a compilação de TypeScript em tempo de execução.
- `runtimeExtensions`, quando presente, deve corresponder a `extensions` no tamanho do array
  (as entradas são pareadas por posição). `runtimeSetupEntry` requer `setupEntry`.
- Se um artefato `runtimeExtensions`/`runtimeSetupEntry` for declarado, mas
  estiver ausente, a instalação/descoberta falhará com um erro de empacotamento; o OpenClaw não
  recorrerá silenciosamente ao código-fonte. O fallback para o código-fonte (abaixo) só se aplica quando nenhuma
  entrada de runtime é declarada.
- Se um pacote instalado declarar apenas uma entrada de origem TypeScript, o OpenClaw
  procurará um par compilado correspondente `dist/*.js` (ou `.mjs`/`.cjs`) e o utilizará;
  caso contrário, recorrerá à origem TypeScript.
- Todos os caminhos de entrada devem permanecer dentro do diretório do pacote do plugin. Entradas de runtime
  e pares de JavaScript compilado inferidos não tornam válido um caminho de origem `extensions` ou
  `setupEntry` que saia desse diretório.

## `defineToolPlugin`

**Importação:** `openclaw/plugin-sdk/tool-plugin`

Para plugins que apenas adicionam ferramentas de agente. Mantém o código-fonte pequeno, infere os tipos de configuração
e dos parâmetros da ferramenta a partir de esquemas TypeBox, encapsula valores de retorno simples no
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

- `configSchema` é opcional; omiti-lo utiliza um esquema estrito de objeto vazio
  (o manifesto gerado ainda inclui `configSchema`).
- `execute` retorna uma string simples ou um valor serializável em JSON; o auxiliar
  o encapsula como um resultado textual de ferramenta, com `details` definido como o valor de retorno
  original (não convertido em string).
- Para resultados personalizados de ferramentas, `openclaw/plugin-sdk/tool-results` exporta
  `textResult` e `jsonResult`.
- Os nomes das ferramentas são estáticos, portanto `openclaw plugins build` deriva
  `contracts.tools` das ferramentas declaradas, sem duplicar manualmente os nomes.
- O carregamento em runtime permanece estrito: plugins instalados ainda precisam de
  `openclaw.plugin.json` e `package.json` `openclaw.extensions`. O OpenClaw
  nunca executa o código do plugin para inferir dados ausentes do manifesto.

## `definePluginEntry`

**Importação:** `openclaw/plugin-sdk/plugin-entry`

Para plugins de provedores, plugins avançados de ferramentas, plugins de hooks e qualquer item que
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

| Campo                     | Tipo                                                             | Obrigatório | Padrão             |
| ------------------------- | ---------------------------------------------------------------- | ----------- | ------------------ |
| `id`                      | `string`                                                         | Sim         | -                  |
| `name`                    | `string`                                                         | Sim         | -                  |
| `description`             | `string`                                                         | Sim         | -                  |
| `kind`                    | `string` (obsoleto, consulte abaixo)                             | Não         | -                  |
| `configSchema`            | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Não         | Esquema de objeto vazio |
| `reload`                  | `OpenClawPluginReloadRegistration`                               | Não         | -                  |
| `nodeHostCommands`        | `OpenClawPluginNodeHostCommand[]`                                | Não         | -                  |
| `securityAuditCollectors` | `OpenClawPluginSecurityAuditCollector[]`                         | Não         | -                  |
| `register`                | `(api: OpenClawPluginApi) => void`                               | Sim         | -                  |

- `id` deve corresponder ao seu manifesto `openclaw.plugin.json`.
- Catálogos de sessões externas usam
  `openclaw/plugin-sdk/session-catalog` e
  `api.registerSessionCatalog({ id, label, list, read, continueSession?, archive? })`.
  O núcleo é responsável pelos métodos do Gateway `sessions.catalog.*`; os provedores retornam projeções de host,
  sessão e transcrição normalizada sem registrar RPCs.
- `kind` está obsoleto: declare um slot exclusivo (`"memory"` ou
  `"context-engine"`) no campo `kind` do manifesto `openclaw.plugin.json`
  em vez disso. `kind` da entrada de runtime permanece apenas como fallback de compatibilidade para
  plugins mais antigos.
- `configSchema` pode ser uma função para avaliação adiada. O OpenClaw resolve e
  memoriza o esquema no primeiro acesso, de modo que construtores de esquemas dispendiosos sejam executados apenas
  uma vez.
- Um descritor `nodeHostCommands` pode definir `isAvailable({ config, env })`.
  Retornar `false` omite esse comando e seu recurso da declaração do Gateway do Node
  sem interface gráfica. O OpenClaw o avalia em relação à configuração de inicialização local do Node;
  os manipuladores de comandos ainda devem validar a disponibilidade quando
  forem invocados.

## `defineChannelPluginEntry`

**Importação:** `openclaw/plugin-sdk/channel-core`

Encapsula `definePluginEntry` com integração específica do canal: chama automaticamente
`api.registerChannel({ plugin })`, expõe uma interface opcional de metadados da CLI para a ajuda raiz
e condiciona `registerFull` ao modo de registro.

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

| Campo                 | Tipo                                                             | Obrigatório | Padrão             |
| --------------------- | ---------------------------------------------------------------- | ----------- | ------------------ |
| `id`                  | `string`                                                         | Sim         | -                  |
| `name`                | `string`                                                         | Sim         | -                  |
| `description`         | `string`                                                         | Sim         | -                  |
| `plugin`              | `ChannelPlugin`                                                  | Sim         | -                  |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Não         | Esquema de objeto vazio |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Não         | -                  |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Não         | -                  |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Não         | -                  |

Os callbacks são executados de acordo com o modo de registro (tabela completa em
[Modo de registro](#registration-mode)):

- `setRuntime` é executado em todos os modos, exceto `"cli-metadata"` e
  `"tool-discovery"`. Armazene aqui a referência ao runtime, normalmente por meio de
  `createPluginRuntimeStore`.
- `registerCliMetadata` é executado para `"cli-metadata"`, `"discovery"` e
  `"full"`. Use-o como o local canônico para descritores da CLI pertencentes ao canal,
  para que a ajuda raiz permaneça sem ativação, os snapshots de descoberta incluam metadados estáticos
  de comandos e o registro normal da CLI permaneça compatível com carregamentos completos
  do plugin.
- `registerFull` é executado somente para `"full"` e `"tool-discovery"`. Para
  `"tool-discovery"`, ele é executado _em vez do_ registro do canal: o OpenClaw
  ignora completamente `registerChannel`/`setRuntime` e chama apenas
  `registerFull`, portanto qualquer registro de provedor/ferramenta de que o canal precise para
  descoberta ou execução independente de ferramentas deve ficar ali, e não atrás da configuração normal
  do canal.
- O registro de descoberta não é ativador, mas não dispensa importações: o OpenClaw pode
  avaliar a entrada confiável do plugin e o módulo do plugin de canal para criar o
  snapshot. Mantenha as importações de nível superior sem efeitos colaterais e coloque sockets,
  clientes, workers e serviços somente em caminhos protegidos por `"full"`.
- Assim como `definePluginEntry`, `configSchema` pode ser uma fábrica adiada; o OpenClaw
  memoriza o esquema resolvido no primeiro acesso.

Registro da CLI:

- Use `api.registerCli(..., { descriptors: [...] })` para comandos raiz
  da CLI pertencentes ao plugin que devem ser carregados sob demanda sem desaparecer da árvore de análise
  da CLI raiz. Os nomes dos descritores devem corresponder a letras, números, hífen e
  sublinhado, começando com uma letra ou um número; o OpenClaw rejeita outros
  formatos e remove sequências de controle do terminal das descrições antes de
  renderizar a ajuda. Abranja cada raiz de comando de nível superior exposta pelo registrador.
  Apenas `commands` permanece no caminho de compatibilidade com carregamento antecipado.
- Use `api.registerNodeCliFeature(...)` para comandos de recursos de Nodes pareados, para que
  eles sejam inseridos em `openclaw nodes` (equivalente a
  `registerCli(registrar, { parentPath: ["nodes"], ... })`).
- Para outros comandos aninhados do plugin, adicione `parentPath` e registre os comandos
  no objeto `program` passado ao registrador; o OpenClaw o resolve para
  o comando pai antes de chamar o plugin.
- Para plugins de canais, registre descritores da CLI por meio de `registerCliMetadata`
  e mantenha `registerFull` concentrado apenas no trabalho de runtime.
- Se `registerFull` também registrar métodos RPC do Gateway, mantenha-os em um
  prefixo específico do plugin. Os namespaces administrativos reservados do núcleo (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) sempre são convertidos em
  `operator.admin`.

## `defineSetupPluginEntry`

**Importação:** `openclaw/plugin-sdk/channel-core`

Para o arquivo leve `setup-entry.ts`. Retorna apenas `{ plugin }`, sem
integração de runtime ou CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

O OpenClaw carrega esta entrada em vez da entrada completa quando um canal está desabilitado,
não configurado ou quando o carregamento adiado está habilitado. Consulte
[Configuração](/pt-BR/plugins/sdk-setup#setup-entry) para saber quando isso é relevante.

Combine `defineSetupPluginEntry(...)` com as famílias de auxiliares de configuração específicos:

| Importação                          | Uso                                                                                                                                                                                |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/setup-runtime` | Auxiliares de configuração seguros para o runtime: `createSetupTranslator`, adaptadores de patches de configuração seguros para importação, saída de notas de consulta, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies de configuração delegada |
| `openclaw/plugin-sdk/channel-setup` | Superfícies de configuração de instalação opcional                                                                                                                                |
| `openclaw/plugin-sdk/setup-tools`   | Auxiliares de configuração/instalação da CLI, arquivos e documentação                                                                                                             |

Mantenha SDKs pesados, o registro da CLI e serviços de runtime de longa duração na
entrada completa.

Canais incluídos no workspace que separam as superfícies de configuração e runtime podem usar
`defineBundledChannelSetupEntry(...)` de
`openclaw/plugin-sdk/channel-entry-contract`. Isso permite que a entrada de configuração
mantenha exportações de plugin/segredos seguras para configuração e ainda exponha um setter de
runtime:

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
superfície segura do Gateway para configuração antes que a entrada completa do canal seja carregada.
`registerSetupRuntime` é executado somente em carregamentos `"setup-runtime"`; mantenha-o
limitado a rotas ou métodos exclusivos de configuração que precisem existir antes da
ativação completa adiada.

## Modo de registro

`api.registrationMode` informa ao seu plugin como ele foi carregado:

| Modo               | Quando                                             | O que registrar                                                                                                           |
| ------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `"full"`           | Inicialização normal do Gateway                    | Tudo                                                                                                                      |
| `"discovery"`      | Descoberta de recursos somente leitura             | Registro de canal mais descritores estáticos da CLI; o código da entrada pode ser carregado, mas ignore sockets, workers, clientes e serviços |
| `"tool-discovery"` | Carregamento com escopo para listar ou executar ferramentas de plugins específicos | Somente registro de recursos/ferramentas; sem ativação do canal                                                           |
| `"setup-only"`     | Canal desabilitado/não configurado                 | Somente registro de canal                                                                                                 |
| `"setup-runtime"`  | Fluxo de configuração com runtime disponível       | Registro de canal mais apenas o runtime leve necessário antes do carregamento da entrada completa                         |
| `"cli-metadata"`   | Captura de ajuda raiz/metadados da CLI             | Somente descritores da CLI                                                                                                |

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
    // Registre superfícies exclusivas de recursos (provedores/ferramentas), sem canal.
    return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Registros pesados exclusivos de runtime
  api.registerService(/* ... */);
}
```

Serviços de longa duração podem emitir pequenos eventos de invalidação ou ciclo de vida por meio
do contexto do serviço:

```typescript
api.registerService({
  id: "index-events",
  start(ctx) {
    ctx.gatewayEvents?.emit("changed", { revision: 1 }, { scope: "operator.read" });
  },
});
```

O OpenClaw adiciona o namespace `plugin.<plugin-id>.changed`. Os nomes dos eventos têm um
único segmento em letras minúsculas, os payloads devem ser JSON de tamanho limitado e o escopo deve ser
`operator.read`, `operator.write` ou `operator.admin`. O emissor existe somente
durante o ciclo de vida do serviço e é revogado após a interrupção ou uma falha na inicialização. Prefira
payloads de versão ou invalidação em vez de registros completos, para que os clientes autorizados releiam
o estado canônico por meio dos métodos com escopo do Gateway do plugin.

O modo de descoberta cria um snapshot não ativador do registro. Ele ainda pode
avaliar a entrada do plugin e o objeto de plugin do canal para que o OpenClaw possa
registrar recursos do canal e descritores estáticos da CLI. Trate a avaliação do módulo
durante a descoberta como confiável, porém leve: nada de clientes de rede,
subprocessos, listeners, conexões de banco de dados, workers em segundo plano,
leituras de credenciais ou outros efeitos colaterais ativos de runtime no nível superior.

Trate `"setup-runtime"` como a janela em que superfícies de inicialização exclusivas da configuração devem
existir sem reentrar no runtime completo do canal incluído. Opções adequadas são
registro de canal, rotas HTTP seguras para configuração, métodos do Gateway seguros para configuração
e auxiliares de configuração delegada. Serviços pesados em segundo plano, registradores da CLI e
inicializações de SDKs de provedores/clientes ainda pertencem a `"full"`.

## Formatos de plugin

O OpenClaw classifica os plugins carregados conforme seu comportamento de registro:

| Formato               | Descrição                                              |
| --------------------- | ------------------------------------------------------ |
| **recurso-simples**   | Um tipo de recurso (por exemplo, somente provedor)     |
| **recurso-híbrido**   | Vários tipos de recurso (por exemplo, provedor + fala) |
| **somente-hook**      | Somente hooks, sem recursos                            |
| **sem-recurso**       | Ferramentas/comandos/serviços, mas sem recursos        |

Use `openclaw plugins inspect <id>` para consultar o formato de um plugin.

## Relacionados

- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) - API de registro e referência de subcaminhos
- [Auxiliares de runtime](/pt-BR/plugins/sdk-runtime) - `api.runtime` e `createPluginRuntimeStore`
- [Configuração](/pt-BR/plugins/sdk-setup) - manifesto, entrada de configuração, carregamento adiado
- [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) - criação do objeto `ChannelPlugin`
- [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins) - registro de provedores e hooks
