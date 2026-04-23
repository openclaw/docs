---
read_when:
    - Você está adicionando um assistente de configuração a um Plugin
    - Você precisa entender `setup-entry.ts` vs `index.ts`
    - Você está definindo schemas de configuração de Plugin ou metadados `openclaw` no `package.json`
sidebarTitle: Setup and Config
summary: Assistentes de configuração, `setup-entry.ts`, schemas de configuração e metadados de `package.json`
title: Configuração inicial e configuração de Plugin
x-i18n:
    generated_at: "2026-04-23T14:04:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 110cf9aa1bfaeb286d38963cfba2006502e853dd603a126d1c179cbc9b60aea1
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Configuração inicial e configuração de Plugin

Referência para empacotamento de plugin (metadados do `package.json`), manifestos
(`openclaw.plugin.json`), entradas de configuração inicial e schemas de configuração.

<Tip>
  **Está procurando um passo a passo?** Os guias práticos cobrem empacotamento em contexto:
  [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins#step-1-package-and-manifest) e
  [Plugins de provider](/pt-BR/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadados do pacote

Seu `package.json` precisa de um campo `openclaw` que informa ao sistema de plugins o que
seu plugin fornece:

**Plugin de canal:**

```json
{
  "name": "@myorg/openclaw-my-channel",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "blurb": "Short description of the channel."
    }
  }
}
```

**Plugin de provider / base de publicação no ClawHub:**

```json openclaw-clawhub-package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

Se você publicar o plugin externamente no ClawHub, esses campos `compat` e `build`
serão obrigatórios. Os snippets canônicos de publicação ficam em
`docs/snippets/plugin-publish/`.

### Campos `openclaw`

| Campo        | Tipo       | Descrição                                                                                                                 |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | Arquivos de ponto de entrada (relativos à raiz do pacote)                                                                 |
| `setupEntry` | `string`   | Entrada leve apenas para configuração inicial (opcional)                                                                   |
| `channel`    | `object`   | Metadados do catálogo de canais para superfícies de configuração inicial, seletor, início rápido e status                 |
| `providers`  | `string[]` | IDs de provider registrados por este plugin                                                                               |
| `install`    | `object`   | Dicas de instalação: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Sinalizadores de comportamento na inicialização                                                                           |

### `openclaw.channel`

`openclaw.channel` são metadados baratos de pacote para descoberta e superfícies
de configuração inicial de canal antes do carregamento em runtime.

| Campo                                  | Tipo       | O que significa                                                                |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `id`                                   | `string`   | ID canônico do canal.                                                          |
| `label`                                | `string`   | Rótulo principal do canal.                                                     |
| `selectionLabel`                       | `string`   | Rótulo do seletor/configuração inicial quando deve diferir de `label`.         |
| `detailLabel`                          | `string`   | Rótulo secundário de detalhe para catálogos de canal e superfícies de status mais ricos. |
| `docsPath`                             | `string`   | Caminho da documentação para links de configuração inicial e seleção.          |
| `docsLabel`                            | `string`   | Rótulo de substituição usado em links de documentação quando deve diferir do ID do canal. |
| `blurb`                                | `string`   | Descrição curta de onboarding/catálogo.                                        |
| `order`                                | `number`   | Ordem de classificação em catálogos de canal.                                  |
| `aliases`                              | `string[]` | Aliases extras de busca para seleção de canal.                                 |
| `preferOver`                           | `string[]` | IDs de plugin/canal de menor prioridade que este canal deve superar.           |
| `systemImage`                          | `string`   | Nome opcional de ícone/system-image para catálogos de interface de canal.      |
| `selectionDocsPrefix`                  | `string`   | Texto de prefixo antes de links de documentação em superfícies de seleção.     |
| `selectionDocsOmitLabel`               | `boolean`  | Mostra o caminho da documentação diretamente em vez de um link rotulado em cópia de seleção. |
| `selectionExtras`                      | `string[]` | Strings curtas extras acrescentadas na cópia de seleção.                       |
| `markdownCapable`                      | `boolean`  | Marca o canal como compatível com Markdown para decisões de formatação de saída. |
| `exposure`                             | `object`   | Controles de visibilidade do canal para configuração inicial, listas configuradas e superfícies de documentação. |
| `quickstartAllowFrom`                  | `boolean`  | Inclui este canal no fluxo padrão de configuração inicial `allowFrom`.         |
| `forceAccountBinding`                  | `boolean`  | Exige binding explícito de conta mesmo quando existe apenas uma conta.          |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Prefere consulta de sessão ao resolver destinos de anúncio para este canal.     |

Exemplo:

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel (self-hosted)",
      "detailLabel": "My Channel Bot",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Webhook-based self-hosted chat integration.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Guide:",
      "selectionExtras": ["Markdown"],
      "markdownCapable": true,
      "exposure": {
        "configured": true,
        "setup": true,
        "docs": true
      },
      "quickstartAllowFrom": true
    }
  }
}
```

`exposure` oferece suporte a:

- `configured`: inclui o canal em superfícies de listagem de estilo configurado/status
- `setup`: inclui o canal em seletores interativos de configuração inicial/configuração
- `docs`: marca o canal como voltado ao público em superfícies de documentação/navegação

`showConfigured` e `showInSetup` continuam compatíveis como aliases legados. Prefira
`exposure`.

### `openclaw.install`

`openclaw.install` são metadados de pacote, não metadados de manifesto.

| Campo                        | Tipo                 | O que significa                                                                    |
| ---------------------------- | -------------------- | ---------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Especificação npm canônica para fluxos de instalação/atualização.                  |
| `localPath`                  | `string`             | Caminho local de desenvolvimento ou instalação integrada.                          |
| `defaultChoice`              | `"npm"` \| `"local"` | Fonte de instalação preferida quando ambas estiverem disponíveis.                  |
| `minHostVersion`             | `string`             | Versão mínima compatível do OpenClaw no formato `>=x.y.z`.                         |
| `expectedIntegrity`          | `string`             | String esperada de integridade do npm dist, normalmente `sha512-...`, para instalações fixadas. |
| `allowInvalidConfigRecovery` | `boolean`            | Permite que fluxos de reinstalação de plugin integrado recuperem falhas específicas de configuração obsoleta. |

O onboarding interativo também usa `openclaw.install` para superfícies de
instalação sob demanda. Se o seu plugin expõe escolhas de autenticação de provider ou metadados
de configuração/catálogo de canal antes do carregamento em runtime, o onboarding pode mostrar essa opção,
solicitar npm vs instalação local, instalar ou habilitar o plugin e depois continuar o fluxo selecionado.
As opções npm de onboarding exigem metadados confiáveis de catálogo com um `npmSpec` do registro;
versões exatas e `expectedIntegrity` são fixações opcionais. Se
`expectedIntegrity` estiver presente, fluxos de instalação/atualização o aplicarão. Mantenha os metadados de “o que
mostrar” em `openclaw.plugin.json` e os metadados de “como instalar”
em `package.json`.

Se `minHostVersion` estiver definido, tanto a instalação quanto o carregamento do registro de manifestos
o aplicarão. Hosts mais antigos ignoram o plugin; strings de versão inválidas são rejeitadas.

Para instalações npm fixadas, mantenha a versão exata em `npmSpec` e adicione a
integridade esperada do artefato:

```json
{
  "openclaw": {
    "install": {
      "npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3",
      "expectedIntegrity": "sha512-REPLACE_WITH_NPM_DIST_INTEGRITY",
      "defaultChoice": "npm"
    }
  }
}
```

`allowInvalidConfigRecovery` não é um bypass geral para configurações quebradas. Ele existe
apenas para recuperação restrita de plugins integrados, para que reinstalação/configuração inicial possam reparar
resíduos conhecidos de upgrade, como um caminho ausente de plugin integrado ou uma entrada `channels.<id>`
obsoleta para esse mesmo plugin. Se a configuração estiver quebrada por motivos não relacionados, a instalação
ainda falha em modo fechado e informa ao operador para executar `openclaw doctor --fix`.

### Adiamento do carregamento completo

Plugins de canal podem optar por carregamento adiado com:

```json
{
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

Quando habilitado, o OpenClaw carrega apenas `setupEntry` durante a fase de
inicialização anterior ao listen, mesmo para canais já configurados. A entrada completa é carregada depois que o
gateway começa a escutar.

<Warning>
  Habilite o carregamento adiado apenas quando seu `setupEntry` registrar tudo o que o
  gateway precisa antes de começar a escutar (registro de canal, rotas HTTP,
  métodos de gateway). Se a entrada completa for proprietária de recursos de inicialização obrigatórios, mantenha
  o comportamento padrão.
</Warning>

Se sua entrada de configuração inicial/completa registrar métodos RPC do gateway, mantenha-os em um
prefixo específico do plugin. Namespaces reservados de administração do core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) continuam pertencendo ao core e sempre são resolvidos
para `operator.admin`.

## Manifesto do plugin

Todo plugin nativo deve incluir um `openclaw.plugin.json` na raiz do pacote.
O OpenClaw usa isso para validar a configuração sem executar código do plugin.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds My Plugin capabilities to OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook verification secret"
      }
    }
  }
}
```

Para plugins de canal, adicione `kind` e `channels`:

```json
{
  "id": "my-channel",
  "kind": "channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

Mesmo plugins sem configuração precisam incluir um schema. Um schema vazio é válido:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Veja [Manifesto de plugin](/pt-BR/plugins/manifest) para a referência completa do schema.

## Publicação no ClawHub

Para pacotes de plugin, use o comando específico do ClawHub para pacotes:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

O alias legado de publicação somente para skill é para Skills. Pacotes de plugin
devem sempre usar `clawhub package publish`.

## Entrada de configuração inicial

O arquivo `setup-entry.ts` é uma alternativa leve a `index.ts` que
o OpenClaw carrega quando precisa apenas de superfícies de configuração inicial (onboarding, reparo de configuração,
inspeção de canal desabilitado).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Isso evita carregar código pesado de runtime (bibliotecas de criptografia, registros de CLI,
serviços em segundo plano) durante fluxos de configuração inicial.

Canais integrados do workspace que mantêm exportações seguras para configuração inicial em módulos auxiliares podem
usar `defineBundledChannelSetupEntry(...)` de
`openclaw/plugin-sdk/channel-entry-contract` em vez de
`defineSetupPluginEntry(...)`. Esse contrato integrado também oferece suporte a uma
exportação `runtime` opcional para que a ligação de runtime no momento da configuração inicial permaneça leve e explícita.

**Quando o OpenClaw usa `setupEntry` em vez da entrada completa:**

- O canal está desabilitado, mas precisa de superfícies de configuração inicial/onboarding
- O canal está habilitado, mas não configurado
- O carregamento adiado está habilitado (`deferConfiguredChannelFullLoadUntilAfterListen`)

**O que `setupEntry` deve registrar:**

- O objeto do plugin de canal (via `defineSetupPluginEntry`)
- Quaisquer rotas HTTP exigidas antes de o gateway começar a escutar
- Quaisquer métodos de gateway necessários durante a inicialização

Esses métodos de gateway de inicialização ainda devem evitar namespaces
reservados de administração do core, como `config.*` ou `update.*`.

**O que `setupEntry` NÃO deve incluir:**

- Registros de CLI
- Serviços em segundo plano
- Imports pesados de runtime (criptografia, SDKs)
- Métodos de gateway necessários apenas após a inicialização

### Imports auxiliares restritos para configuração inicial

Para caminhos quentes apenas de configuração inicial, prefira as interfaces auxiliares restritas de configuração inicial em vez da interface mais ampla
`plugin-sdk/setup` quando você precisar apenas de parte da superfície de configuração inicial:

| Caminho de importação                | Use para                                                                                 | Principais exportações                                                                                                                                                                                                                                                                       |
| ------------------------------------ | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`           | auxiliares de runtime no momento da configuração inicial que permanecem disponíveis em `setupEntry` / inicialização adiada de canal | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime`   | adaptadores de configuração inicial de conta sensíveis ao ambiente                       | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                         |
| `plugin-sdk/setup-tools`             | auxiliares de CLI/instalação/arquivo/documentação para configuração inicial              | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                               |

Use a interface mais ampla `plugin-sdk/setup` quando quiser a caixa de ferramentas completa e compartilhada de configuração inicial,
incluindo auxiliares de patch de configuração como
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Os adaptadores de patch de configuração inicial continuam seguros para importação em caminhos quentes.
A busca pela superfície de contrato integrada para promoção de conta única é lazy, então importar
`plugin-sdk/setup-runtime` não carrega de forma ansiosa a descoberta da superfície de contrato integrada antes de o adaptador ser realmente usado.

### Promoção de conta única de propriedade do canal

Quando um canal é atualizado de uma configuração de nível superior de conta única para
`channels.<id>.accounts.*`, o comportamento compartilhado padrão é mover valores promovidos com escopo de conta para `accounts.default`.

Canais integrados podem restringir ou substituir essa promoção por meio de sua
superfície de contrato de configuração inicial:

- `singleAccountKeysToMove`: chaves extras de nível superior que devem ser movidas para a
  conta promovida
- `namedAccountPromotionKeys`: quando contas nomeadas já existem, apenas essas
  chaves são movidas para a conta promovida; chaves compartilhadas de política/entrega permanecem na
  raiz do canal
- `resolveSingleAccountPromotionTarget(...)`: escolhe qual conta existente
  recebe os valores promovidos

Matrix é o exemplo integrado atual. Se exatamente uma conta Matrix nomeada já existir,
ou se `defaultAccount` apontar para uma chave existente não canônica
como `Ops`, a promoção preserva essa conta em vez de criar uma nova
entrada `accounts.default`.

## Schema de configuração

A configuração do Plugin é validada em relação ao JSON Schema no seu manifesto. Os usuários
configuram plugins por meio de:

```json5
{
  plugins: {
    entries: {
      "my-plugin": {
        config: {
          webhookSecret: "abc123",
        },
      },
    },
  },
}
```

Seu plugin recebe essa configuração como `api.pluginConfig` durante o registro.

Para configuração específica do canal, use a seção de configuração do canal:

```json5
{
  channels: {
    "my-channel": {
      token: "bot-token",
      allowFrom: ["user1", "user2"],
    },
  },
}
```

### Criando schemas de configuração de canal

Use `buildChannelConfigSchema` de `openclaw/plugin-sdk/core` para converter um
schema Zod no wrapper `ChannelConfigSchema` que o OpenClaw valida:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/core";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

## Assistentes de configuração inicial

Plugins de canal podem fornecer assistentes de configuração inicial interativos para `openclaw onboard`.
O assistente é um objeto `ChannelSetupWizard` no `ChannelPlugin`:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Connected",
    unconfiguredLabel: "Not configured",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot token",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Use MY_CHANNEL_BOT_TOKEN from environment?",
      keepPrompt: "Keep current token?",
      inputPrompt: "Enter your bot token:",
      inspect: ({ cfg, accountId }) => {
        const token = (cfg.channels as any)?.["my-channel"]?.token;
        return {
          accountConfigured: Boolean(token),
          hasConfiguredValue: Boolean(token),
        };
      },
    },
  ],
};
```

O tipo `ChannelSetupWizard` oferece suporte a `credentials`, `textInputs`,
`dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` e mais.
Veja pacotes de plugins integrados (por exemplo, o plugin do Discord em `src/channel.setup.ts`) para
exemplos completos.

Para prompts de allowlist de DM que precisam apenas do fluxo padrão
`note -> prompt -> parse -> merge -> patch`, prefira os auxiliares compartilhados de configuração inicial
de `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` e
`createNestedChannelParsedAllowFromPrompt(...)`.

Para blocos de status de configuração inicial de canal que variam apenas por rótulos, pontuações e linhas extras opcionais,
prefira `createStandardChannelSetupStatus(...)` de
`openclaw/plugin-sdk/setup` em vez de escrever manualmente o mesmo objeto `status` em
cada plugin.

Para superfícies opcionais de configuração inicial que só devem aparecer em determinados contextos, use
`createOptionalChannelSetupSurface` de `openclaw/plugin-sdk/channel-setup`:

```typescript
import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

const setupSurface = createOptionalChannelSetupSurface({
  channel: "my-channel",
  label: "My Channel",
  npmSpec: "@myorg/openclaw-my-channel",
  docsPath: "/channels/my-channel",
});
// Returns { setupAdapter, setupWizard }
```

`plugin-sdk/channel-setup` também expõe os construtores de nível mais baixo
`createOptionalChannelSetupAdapter(...)` e
`createOptionalChannelSetupWizard(...)` quando você precisa apenas de uma metade
dessa superfície opcional de instalação.

O adaptador/assistente opcional gerado falha em modo fechado em gravações reais de configuração. Eles
reutilizam uma única mensagem de instalação obrigatória em `validateInput`,
`applyAccountConfig` e `finalize`, e acrescentam um link de documentação quando `docsPath` está
definido.

Para interfaces de configuração inicial baseadas em binários, prefira os auxiliares delegados compartilhados em vez de
copiar a mesma cola de binário/status em cada canal:

- `createDetectedBinaryStatus(...)` para blocos de status que variam apenas por rótulos,
  dicas, pontuações e detecção de binário
- `createCliPathTextInput(...)` para entradas de texto baseadas em caminho
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` e
  `createDelegatedResolveConfigured(...)` quando `setupEntry` precisa encaminhar de forma lazy para
  um assistente completo mais pesado
- `createDelegatedTextInputShouldPrompt(...)` quando `setupEntry` só precisa
  delegar uma decisão `textInputs[*].shouldPrompt`

## Publicação e instalação

**Plugins externos:** publique no [ClawHub](/pt-BR/tools/clawhub) ou no npm e depois instale:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

O OpenClaw tenta primeiro o ClawHub e recorre ao npm automaticamente. Você também pode
forçar explicitamente o ClawHub:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # somente ClawHub
```

Não existe um override `npm:` correspondente. Use a especificação normal de pacote npm quando
quiser o caminho do npm após o fallback do ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins no repositório:** coloque-os na árvore de workspace de plugins integrados e eles serão descobertos automaticamente
durante a compilação.

**Os usuários podem instalar:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Para instalações vindas do npm, `openclaw plugins install` executa
  `npm install --ignore-scripts` (sem scripts de ciclo de vida). Mantenha as árvores
  de dependência do plugin puras em JS/TS e evite pacotes que exijam compilações em `postinstall`.
</Info>

Plugins integrados de propriedade do OpenClaw são a única exceção de reparo na inicialização: quando uma
instalação empacotada encontra um plugin habilitado por configuração de plugin, configuração legada de canal ou
seu manifesto integrado habilitado por padrão, a inicialização instala as dependências de runtime ausentes desse plugin antes do import. Plugins de terceiros não devem depender de instalações na inicialização; continue usando o instalador explícito de plugins.

## Relacionado

- [Pontos de entrada do SDK](/pt-BR/plugins/sdk-entrypoints) -- `definePluginEntry` e `defineChannelPluginEntry`
- [Manifesto de plugin](/pt-BR/plugins/manifest) -- referência completa do schema do manifesto
- [Criando plugins](/pt-BR/plugins/building-plugins) -- guia passo a passo para começar
