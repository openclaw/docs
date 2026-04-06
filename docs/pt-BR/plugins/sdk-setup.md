---
read_when:
    - Você está adicionando um assistente de setup a um plugin
    - Você precisa entender setup-entry.ts versus index.ts
    - Você está definindo schemas de configuração de plugin ou metadados openclaw no package.json
sidebarTitle: Setup and Config
summary: Assistentes de setup, setup-entry.ts, schemas de configuração e metadados do package.json
title: Setup e configuração de plugins
x-i18n:
    generated_at: "2026-04-06T03:10:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: eac2586516d27bcd94cc4c259fe6274c792b3f9938c7ddd6dbf04a6dbb988dc9
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Setup e configuração de plugins

Referência para empacotamento de plugin (metadados de `package.json`), manifestos
(`openclaw.plugin.json`), entradas de setup e schemas de configuração.

<Tip>
  **Está procurando um passo a passo?** Os guias práticos cobrem o empacotamento em contexto:
  [Channel Plugins](/pt-BR/plugins/sdk-channel-plugins#step-1-package-and-manifest) e
  [Provider Plugins](/pt-BR/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadados do pacote

Seu `package.json` precisa de um campo `openclaw` que informe ao sistema de plugins o que
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

**Plugin de provedor / baseline de publicação no ClawHub:**

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

| Campo        | Tipo       | Descrição                                                                                                 |
| ------------ | ---------- | --------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | Arquivos de ponto de entrada (relativos à raiz do pacote)                                                 |
| `setupEntry` | `string`   | Entrada leve apenas para setup (opcional)                                                                 |
| `channel`    | `object`   | Metadados do catálogo de canais para superfícies de setup, seletor, quickstart e status                  |
| `providers`  | `string[]` | IDs de provedor registrados por este plugin                                                               |
| `install`    | `object`   | Dicas de instalação: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Flags de comportamento de inicialização                                                                   |

### `openclaw.channel`

`openclaw.channel` são metadados leves de pacote para descoberta de canal e superfícies de setup
antes do carregamento do runtime.

| Campo                                  | Tipo       | O que significa                                                                |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `id`                                   | `string`   | ID canônico do canal.                                                          |
| `label`                                | `string`   | Rótulo principal do canal.                                                     |
| `selectionLabel`                       | `string`   | Rótulo de seletor/setup quando deve diferir de `label`.                        |
| `detailLabel`                          | `string`   | Rótulo de detalhe secundário para catálogos de canal e superfícies de status mais ricos. |
| `docsPath`                             | `string`   | Caminho da documentação para links de setup e seleção.                         |
| `docsLabel`                            | `string`   | Rótulo substituto usado para links de documentação quando deve diferir do id do canal. |
| `blurb`                                | `string`   | Descrição curta de onboarding/catálogo.                                        |
| `order`                                | `number`   | Ordem de classificação em catálogos de canal.                                  |
| `aliases`                              | `string[]` | Aliases extras de lookup para seleção de canal.                                |
| `preferOver`                           | `string[]` | IDs de plugin/canal de prioridade mais baixa sobre os quais este canal deve prevalecer. |
| `systemImage`                          | `string`   | Nome opcional de ícone/system-image para catálogos de UI de canal.             |
| `selectionDocsPrefix`                  | `string`   | Texto de prefixo antes dos links de documentação em superfícies de seleção.    |
| `selectionDocsOmitLabel`               | `boolean`  | Mostra o caminho da documentação diretamente em vez de um link rotulado nas cópias de seleção. |
| `selectionExtras`                      | `string[]` | Strings curtas extras anexadas na cópia de seleção.                            |
| `markdownCapable`                      | `boolean`  | Marca o canal como compatível com Markdown para decisões de formatação de saída. |
| `exposure`                             | `object`   | Controles de visibilidade do canal para superfícies de setup, listas configuradas e documentação. |
| `quickstartAllowFrom`                  | `boolean`  | Inclui este canal no fluxo padrão de setup `allowFrom` do quickstart.          |
| `forceAccountBinding`                  | `boolean`  | Exige vinculação explícita de conta mesmo quando existe apenas uma conta.      |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Prefere lookup de sessão ao resolver destinos de anúncio para este canal.      |

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

- `configured`: inclui o canal em superfícies de listagem configurada/estilo status
- `setup`: inclui o canal em seletores interativos de setup/configuração
- `docs`: marca o canal como público em superfícies de documentação/navegação

`showConfigured` e `showInSetup` continuam aceitos como aliases legados. Prefira
`exposure`.

### `openclaw.install`

`openclaw.install` é metadado de pacote, não metadado de manifesto.

| Campo                        | Tipo                 | O que significa                                                                  |
| ---------------------------- | -------------------- | --------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Especificação npm canônica para fluxos de instalação/atualização.                |
| `localPath`                  | `string`             | Caminho de instalação local de desenvolvimento ou empacotada.                    |
| `defaultChoice`              | `"npm"` \| `"local"` | Origem de instalação preferida quando ambas estão disponíveis.                   |
| `minHostVersion`             | `string`             | Versão mínima compatível do OpenClaw no formato `>=x.y.z`.                       |
| `allowInvalidConfigRecovery` | `boolean`            | Permite que fluxos de reinstalação de plugin empacotado recuperem falhas específicas de configuração obsoleta. |

Se `minHostVersion` estiver definido, tanto a instalação quanto o carregamento do registro de manifestos
o aplicarão. Hosts mais antigos ignoram o plugin; strings de versão inválidas são rejeitadas.

`allowInvalidConfigRecovery` não é um bypass geral para configurações quebradas. Ele existe
apenas para recuperação restrita de plugins empacotados, para que reinstalação/setup possa reparar sobras
conhecidas de upgrades, como um caminho ausente de plugin empacotado ou uma entrada obsoleta `channels.<id>`
para esse mesmo plugin. Se a configuração estiver quebrada por motivos não relacionados, a instalação
ainda falha de forma fechada e orienta o operador a executar `openclaw doctor --fix`.

### Carregamento completo adiado

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

Quando ativado, o OpenClaw carrega apenas `setupEntry` durante a fase de inicialização
pré-listen, mesmo para canais já configurados. A entrada completa carrega depois que o
gateway começa a escutar.

<Warning>
  Ative o carregamento adiado apenas quando seu `setupEntry` registrar tudo de que o
  gateway precisa antes de começar a escutar (registro de canal, rotas HTTP,
  métodos do gateway). Se a entrada completa controlar capacidades obrigatórias de inicialização, mantenha
  o comportamento padrão.
</Warning>

Se sua entrada de setup/completa registrar métodos RPC do gateway, mantenha-os em um
prefixo específico do plugin. Os namespaces administrativos reservados do core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) continuam pertencendo ao core e sempre são resolvidos
para `operator.admin`.

## Manifesto do plugin

Todo plugin nativo deve incluir um `openclaw.plugin.json` na raiz do pacote.
O OpenClaw usa isso para validar a configuração sem executar o código do plugin.

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

Mesmo plugins sem configuração devem incluir um schema. Um schema vazio é válido:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Consulte [Plugin Manifest](/pt-BR/plugins/manifest) para a referência completa do schema.

## Publicação no ClawHub

Para pacotes de plugin, use o comando do ClawHub específico para pacote:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

O alias legado de publicação apenas para skill é para Skills. Pacotes de plugin devem
sempre usar `clawhub package publish`.

## Entrada de setup

O arquivo `setup-entry.ts` é uma alternativa leve ao `index.ts` que o
OpenClaw carrega quando precisa apenas das superfícies de setup (onboarding, reparo de configuração,
inspeção de canal desativado).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Isso evita carregar código pesado de runtime (bibliotecas de criptografia, registros de CLI,
serviços em segundo plano) durante os fluxos de setup.

**Quando o OpenClaw usa `setupEntry` em vez da entrada completa:**

- O canal está desativado, mas precisa de superfícies de setup/onboarding
- O canal está ativado, mas não configurado
- O carregamento adiado está ativado (`deferConfiguredChannelFullLoadUntilAfterListen`)

**O que `setupEntry` deve registrar:**

- O objeto do plugin de canal (via `defineSetupPluginEntry`)
- Quaisquer rotas HTTP necessárias antes do gateway escutar
- Quaisquer métodos de gateway necessários durante a inicialização

Esses métodos de gateway de inicialização ainda devem evitar namespaces administrativos reservados do core
como `config.*` ou `update.*`.

**O que `setupEntry` NÃO deve incluir:**

- Registros de CLI
- Serviços em segundo plano
- Imports pesados de runtime (crypto, SDKs)
- Métodos de gateway necessários apenas após a inicialização

### Imports restritos de helpers de setup

Para caminhos quentes apenas de setup, prefira as interfaces restritas de helper de setup em vez da
interface guarda-chuva mais ampla `plugin-sdk/setup` quando precisar apenas de parte da superfície de setup:

| Caminho de importação                | Use para                                                                                | Exportações principais                                                                                                                                                                                                                                                                              |
| ------------------------------------ | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`           | helpers de runtime em tempo de setup que permanecem disponíveis em `setupEntry` / inicialização adiada de canal | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime`   | adaptadores de setup de conta com reconhecimento de ambiente                            | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                               |
| `plugin-sdk/setup-tools`             | helpers de CLI/arquivo/documentação de setup/instalação                                 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                     |

Use a interface mais ampla `plugin-sdk/setup` quando quiser a caixa de ferramentas completa e compartilhada de setup,
incluindo helpers de patch de configuração, como
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Os adaptadores de patch de setup continuam seguros para importação em caminhos quentes. O lookup preguiçoso
da superfície de contrato empacotada para promoção de conta única significa que importar
`plugin-sdk/setup-runtime` não carrega antecipadamente a descoberta da superfície de contrato empacotada
antes de o adaptador ser realmente usado.

### Promoção de conta única controlada pelo canal

Quando um canal é atualizado de uma configuração de nível superior de conta única para
`channels.<id>.accounts.*`, o comportamento compartilhado padrão é mover valores promovidos
com escopo de conta para `accounts.default`.

Canais empacotados podem restringir ou substituir essa promoção por meio da sua
superfície de contrato de setup:

- `singleAccountKeysToMove`: chaves extras de nível superior que devem ser movidas para a
  conta promovida
- `namedAccountPromotionKeys`: quando contas nomeadas já existem, apenas essas
  chaves são movidas para a conta promovida; chaves compartilhadas de política/entrega permanecem na
  raiz do canal
- `resolveSingleAccountPromotionTarget(...)`: escolhe qual conta existente
  recebe os valores promovidos

Matrix é o exemplo empacotado atual. Se já existir exatamente uma conta Matrix nomeada,
ou se `defaultAccount` apontar para uma chave não canônica existente, como `Ops`,
a promoção preservará essa conta em vez de criar uma nova entrada
`accounts.default`.

## Schema de configuração

A configuração do plugin é validada em relação ao JSON Schema no seu manifesto. Usuários
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

Para configuração específica de canal, use a seção de configuração do canal:

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

## Assistentes de setup

Plugins de canal podem fornecer assistentes interativos de setup para `openclaw onboard`.
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
Consulte pacotes de plugins empacotados (por exemplo o plugin Discord em `src/channel.setup.ts`) para
exemplos completos.

Para prompts de allowlist de DM que precisam apenas do fluxo padrão
`note -> prompt -> parse -> merge -> patch`, prefira os helpers compartilhados de setup
de `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` e
`createNestedChannelParsedAllowFromPrompt(...)`.

Para blocos de status de setup de canal que variam apenas em rótulos, pontuações e linhas extras opcionais,
prefira `createStandardChannelSetupStatus(...)` de
`openclaw/plugin-sdk/setup` em vez de criar manualmente o mesmo objeto `status` em
cada plugin.

Para superfícies de setup opcionais que devem aparecer apenas em certos contextos, use
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

`plugin-sdk/channel-setup` também expõe os builders de nível inferior
`createOptionalChannelSetupAdapter(...)` e
`createOptionalChannelSetupWizard(...)` quando você precisar apenas de metade
dessa superfície de instalação opcional.

O adaptador/assistente opcional gerado falha de forma fechada em gravações reais de configuração. Eles
reutilizam uma única mensagem de instalação obrigatória em `validateInput`,
`applyAccountConfig` e `finalize`, e acrescentam um link de documentação quando `docsPath` estiver
definido.

Para UIs de setup baseadas em binário, prefira os helpers delegados compartilhados em vez de
copiar a mesma cola de binário/status em cada canal:

- `createDetectedBinaryStatus(...)` para blocos de status que variam apenas por rótulos,
  dicas, pontuações e detecção de binário
- `createCliPathTextInput(...)` para entradas de texto baseadas em caminho
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` e
  `createDelegatedResolveConfigured(...)` quando `setupEntry` precisar encaminhar preguiçosamente para
  um assistente completo mais pesado
- `createDelegatedTextInputShouldPrompt(...)` quando `setupEntry` só precisar
  delegar uma decisão de `textInputs[*].shouldPrompt`

## Publicação e instalação

**Plugins externos:** publique no [ClawHub](/pt-BR/tools/clawhub) ou npm e depois instale:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

O OpenClaw tenta primeiro o ClawHub e recorre automaticamente ao npm. Você também pode
forçar o ClawHub explicitamente:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # somente ClawHub
```

Não existe um override correspondente `npm:`. Use a especificação normal de pacote npm quando
quiser o caminho npm após o fallback do ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins no repositório:** coloque-os sob a árvore de workspace de plugins empacotados e eles serão
descobertos automaticamente durante a build.

**Os usuários podem instalar:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Para instalações obtidas do npm, `openclaw plugins install` executa
  `npm install --ignore-scripts` (sem scripts de ciclo de vida). Mantenha as árvores de dependência
  de plugin em JS/TS puro e evite pacotes que exijam builds em `postinstall`.
</Info>

## Relacionado

- [SDK Entry Points](/pt-BR/plugins/sdk-entrypoints) -- `definePluginEntry` e `defineChannelPluginEntry`
- [Plugin Manifest](/pt-BR/plugins/manifest) -- referência completa do schema de manifesto
- [Building Plugins](/pt-BR/plugins/building-plugins) -- guia passo a passo de primeiros passos
