---
read_when:
    - Você está adicionando um wizard de setup a um Plugin
    - Você precisa entender `setup-entry.ts` vs `index.ts`
    - Você está definindo schemas de configuração de Plugin ou metadados `openclaw` em `package.json`
sidebarTitle: Setup and Config
summary: Wizards de setup, `setup-entry.ts`, schemas de configuração e metadados de `package.json`
title: Setup e configuração de Plugin
x-i18n:
    generated_at: "2026-04-25T13:53:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 487cff34e0f9ae307a7c920dfc3cb0a8bbf2cac5e137abd8be4d1fbed19200ca
    source_path: plugins/sdk-setup.md
    workflow: 15
---

Referência para empacotamento de Plugin (metadados em `package.json`), manifests
(`openclaw.plugin.json`), entradas de setup e schemas de configuração.

<Tip>
  **Procurando um passo a passo?** Os guias how-to cobrem empacotamento em contexto:
  [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins#step-1-package-and-manifest) e
  [Plugins de provider](/pt-BR/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadados de pacote

Seu `package.json` precisa de um campo `openclaw` que diga ao sistema de Plugins o que
o seu Plugin fornece:

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

**Plugin de provider / baseline de publicação no ClawHub:**

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

Se você publicar o Plugin externamente no ClawHub, esses campos `compat` e `build`
serão obrigatórios. Os snippets canônicos de publicação ficam em
`docs/snippets/plugin-publish/`.

### Campos `openclaw`

| Campo        | Tipo       | Descrição                                                                                                                |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| `extensions` | `string[]` | Arquivos de ponto de entrada (relativos à raiz do pacote)                                                                |
| `setupEntry` | `string`   | Entrada leve somente para setup (opcional)                                                                               |
| `channel`    | `object`   | Metadados de catálogo de canal para superfícies de setup, seletor, quickstart e status                                  |
| `providers`  | `string[]` | IDs de provider registrados por este Plugin                                                                              |
| `install`    | `object`   | Dicas de instalação: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Flags de comportamento de inicialização                                                                                  |

### `openclaw.channel`

`openclaw.channel` é um metadado barato de pacote para superfícies de descoberta e setup
de canal antes de o runtime ser carregado.

| Campo                                  | Tipo       | O que significa                                                               |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | ID canônico do canal.                                                         |
| `label`                                | `string`   | Label principal do canal.                                                     |
| `selectionLabel`                       | `string`   | Label de seletor/setup quando deve diferir de `label`.                        |
| `detailLabel`                          | `string`   | Label secundário de detalhe para catálogos de canal e superfícies de status mais ricos. |
| `docsPath`                             | `string`   | Caminho de documentação para links de setup e seleção.                        |
| `docsLabel`                            | `string`   | Sobrescreve o label usado para links de documentação quando deve diferir do id do canal. |
| `blurb`                                | `string`   | Descrição curta para onboarding/catálogo.                                     |
| `order`                                | `number`   | Ordem de classificação em catálogos de canal.                                 |
| `aliases`                              | `string[]` | Aliases extras de lookup para seleção de canal.                               |
| `preferOver`                           | `string[]` | IDs de Plugin/canal de prioridade mais baixa que este canal deve superar.     |
| `systemImage`                          | `string`   | Nome opcional de ícone/system-image para catálogos de UI de canal.            |
| `selectionDocsPrefix`                  | `string`   | Texto de prefixo antes de links de documentação em superfícies de seleção.    |
| `selectionDocsOmitLabel`               | `boolean`  | Mostra o caminho da documentação diretamente em vez de um link de documentação rotulado no texto de seleção. |
| `selectionExtras`                      | `string[]` | Strings curtas extras acrescentadas ao texto de seleção.                      |
| `markdownCapable`                      | `boolean`  | Marca o canal como compatível com Markdown para decisões de formatação de saída. |
| `exposure`                             | `object`   | Controles de visibilidade do canal para superfícies de setup, listas configuradas e documentação. |
| `quickstartAllowFrom`                  | `boolean`  | Inclui este canal no fluxo padrão de setup `allowFrom` do quickstart.         |
| `forceAccountBinding`                  | `boolean`  | Exige binding explícito de conta mesmo quando existe apenas uma conta.        |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Prefere lookup de sessão ao resolver alvos de anúncio para este canal.        |

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

- `configured`: inclui o canal em superfícies de listagem configurada/no estilo status
- `setup`: inclui o canal em seletores interativos de setup/configure
- `docs`: marca o canal como público em superfícies de documentação/navegação

`showConfigured` e `showInSetup` continuam compatíveis como aliases legados. Prefira
`exposure`.

### `openclaw.install`

`openclaw.install` é metadado de pacote, não metadado de manifest.

| Campo                        | Tipo                 | O que significa                                                                    |
| ---------------------------- | -------------------- | ---------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Especificação npm canônica para fluxos de instalação/atualização.                  |
| `localPath`                  | `string`             | Caminho local de desenvolvimento ou instalação integrada.                          |
| `defaultChoice`              | `"npm"` \| `"local"` | Origem de instalação preferida quando ambas estão disponíveis.                     |
| `minHostVersion`             | `string`             | Versão mínima compatível do OpenClaw no formato `>=x.y.z`.                         |
| `expectedIntegrity`          | `string`             | String esperada de integridade do dist npm, normalmente `sha512-...`, para instalações fixadas. |
| `allowInvalidConfigRecovery` | `boolean`            | Permite que fluxos de reinstalação de Plugin integrado recuperem falhas específicas de configuração obsoleta. |

O onboarding interativo também usa `openclaw.install` para superfícies de
instalação sob demanda. Se o seu Plugin expõe escolhas de autenticação de provider ou metadados
de setup/catálogo de canal antes do runtime ser carregado, o onboarding pode mostrar essa
escolha, perguntar por npm vs local, instalar ou ativar o Plugin e então continuar o
fluxo selecionado. Escolhas de onboarding por npm exigem metadados de catálogo confiáveis com
um `npmSpec` de registro; versões exatas e `expectedIntegrity` são pins opcionais. Se
`expectedIntegrity` estiver presente, os fluxos de instalação/atualização o aplicam. Mantenha os metadados
de "o que mostrar" em `openclaw.plugin.json` e os metadados de "como instalá-lo"
em `package.json`.

Se `minHostVersion` estiver definido, tanto a instalação quanto o carregamento do registro de manifest
o aplicam. Hosts mais antigos ignoram o Plugin; strings de versão inválidas são rejeitadas.

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

`allowInvalidConfigRecovery` não é um bypass geral para configurações quebradas. Ele é
para recuperação estreita apenas de Plugin integrado, para que reinstalação/setup possa reparar
sobras conhecidas de upgrade, como um caminho ausente de Plugin integrado ou uma entrada
obsoleta `channels.<id>` para esse mesmo Plugin. Se a configuração estiver quebrada por motivos não relacionados, a instalação
ainda falha com fechamento por padrão e informa ao operador para executar `openclaw doctor --fix`.

### Carga completa adiada

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
pré-listen, mesmo para canais já configurados. A entrada completa é carregada depois que o
gateway começa a escutar.

<Warning>
  Só ative o carregamento adiado quando seu `setupEntry` registrar tudo de que o
  gateway precisa antes de começar a escutar (registro de canal, rotas HTTP,
  métodos do gateway). Se a entrada completa for dona de capacidades de inicialização necessárias,
  mantenha o comportamento padrão.
</Warning>

Se sua entrada de setup/completa registra métodos RPC do gateway, mantenha-os em um
prefixo específico do Plugin. Namespaces centrais reservados de admin (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) continuam pertencendo ao núcleo e sempre resolvem
para `operator.admin`.

## Manifest do Plugin

Todo Plugin nativo deve incluir um `openclaw.plugin.json` na raiz do pacote.
O OpenClaw usa isso para validar configuração sem executar código do Plugin.

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

Para Plugins de canal, adicione `kind` e `channels`:

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

Mesmo Plugins sem configuração precisam incluir um schema. Um schema vazio é válido:

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

Para pacotes de Plugin, use o comando do ClawHub específico para pacote:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

O alias legado de publicação apenas para Skills é para Skills. Pacotes de Plugin
devem sempre usar `clawhub package publish`.

## Entrada de setup

O arquivo `setup-entry.ts` é uma alternativa leve a `index.ts` que
o OpenClaw carrega quando precisa apenas de superfícies de setup (onboarding, reparo
de configuração, inspeção de canal desativado).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Isso evita carregar código pesado de runtime (bibliotecas de criptografia, registros de CLI,
serviços em segundo plano) durante fluxos de setup.

Canais integrados do workspace que mantêm exports seguros para setup em módulos sidecar podem
usar `defineBundledChannelSetupEntry(...)` de
`openclaw/plugin-sdk/channel-entry-contract` em vez de
`defineSetupPluginEntry(...)`. Esse contrato integrado também oferece suporte a um export opcional
`runtime`, para que o wiring de runtime em tempo de setup permaneça leve e explícito.

**Quando o OpenClaw usa `setupEntry` em vez da entrada completa:**

- O canal está desativado, mas precisa de superfícies de setup/onboarding
- O canal está ativado, mas não configurado
- O carregamento adiado está ativado (`deferConfiguredChannelFullLoadUntilAfterListen`)

**O que `setupEntry` precisa registrar:**

- O objeto do Plugin de canal (via `defineSetupPluginEntry`)
- Quaisquer rotas HTTP exigidas antes de o gateway começar a escutar
- Quaisquer métodos do gateway necessários durante a inicialização

Esses métodos de gateway da inicialização ainda devem evitar namespaces centrais
reservados de admin, como `config.*` ou `update.*`.

**O que `setupEntry` NÃO deve incluir:**

- Registros de CLI
- Serviços em segundo plano
- Imports pesados de runtime (crypto, SDKs)
- Métodos do gateway necessários apenas depois da inicialização

### Imports estreitos de helpers de setup

Para caminhos quentes somente de setup, prefira seams estreitas de helpers de setup em vez da
umbrella mais ampla `plugin-sdk/setup` quando você precisar apenas de parte da superfície de setup:

| Caminho de importação               | Use para                                                                                | Exports principais                                                                                                                                                                                                                                                                      |
| ----------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`          | helpers de runtime em tempo de setup que continuam disponíveis em `setupEntry` / inicialização adiada de canal | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime`  | adaptadores de setup de conta sensíveis a ambiente                                      | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                   |
| `plugin-sdk/setup-tools`            | helpers de setup/instalação de CLI/arquivo/documentação                                 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                         |

Use a seam mais ampla `plugin-sdk/setup` quando quiser a caixa de ferramentas completa
de setup compartilhado, incluindo helpers de patch de configuração como
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Os adaptadores de patch de setup permanecem seguros para caminho quente no import. O lookup preguiçoso
da superfície de contrato integrada de promoção de conta única significa que importar
`plugin-sdk/setup-runtime` não carrega antecipadamente a descoberta da superfície de contrato integrada antes de o adaptador realmente ser usado.

### Promoção de conta única pertencente ao canal

Quando um canal é atualizado de uma configuração de nível superior com conta única para
`channels.<id>.accounts.*`, o comportamento compartilhado padrão é mover valores promovidos
com escopo de conta para `accounts.default`.

Canais integrados podem restringir ou sobrescrever essa promoção por meio de sua superfície de contrato
de setup:

- `singleAccountKeysToMove`: chaves extras de nível superior que devem ser movidas para a
  conta promovida
- `namedAccountPromotionKeys`: quando contas nomeadas já existem, apenas essas
  chaves são movidas para a conta promovida; chaves compartilhadas de política/entrega permanecem na raiz
  do canal
- `resolveSingleAccountPromotionTarget(...)`: escolhe qual conta existente
  recebe os valores promovidos

Matrix é o exemplo integrado atual. Se existir exatamente uma conta Matrix nomeada,
ou se `defaultAccount` apontar para uma chave não canônica existente, como `Ops`,
a promoção preserva essa conta em vez de criar uma nova entrada
`accounts.default`.

## Schema de configuração

A configuração do Plugin é validada contra o JSON Schema do seu manifest. Usuários
configuram Plugins via:

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

Seu Plugin recebe essa configuração como `api.pluginConfig` durante o registro.

Para configuração específica de canal, use a seção de configuração do canal em vez disso:

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

### Construindo schemas de configuração de canal

Use `buildChannelConfigSchema` para converter um schema Zod no
wrapper `ChannelConfigSchema` usado por artefatos de configuração pertencentes ao Plugin:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

Para Plugins de terceiros, o contrato de caminho frio ainda é o manifest do Plugin:
espelhe o JSON Schema gerado em `openclaw.plugin.json#channelConfigs` para que
schema de configuração, setup e superfícies de UI possam inspecionar `channels.<id>` sem
carregar código de runtime.

## Wizards de setup

Plugins de canal podem fornecer wizards interativos de setup para `openclaw onboard`.
O wizard é um objeto `ChannelSetupWizard` no `ChannelPlugin`:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Conectado",
    unconfiguredLabel: "Não configurado",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Token do bot",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Usar MY_CHANNEL_BOT_TOKEN do ambiente?",
      keepPrompt: "Manter o token atual?",
      inputPrompt: "Digite o token do seu bot:",
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
Consulte pacotes de Plugin integrados (por exemplo, o Plugin Discord em `src/channel.setup.ts`) para
exemplos completos.

Para prompts de allowlist de DM que só precisam do fluxo padrão
`note -> prompt -> parse -> merge -> patch`, prefira os helpers compartilhados de setup
de `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` e
`createNestedChannelParsedAllowFromPrompt(...)`.

Para blocos de status de setup de canal que só variam por labels, pontuações e linhas
extras opcionais, prefira `createStandardChannelSetupStatus(...)` de
`openclaw/plugin-sdk/setup` em vez de recriar manualmente o mesmo objeto `status` em
cada Plugin.

Para superfícies opcionais de setup que só devem aparecer em certos contextos, use
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

`plugin-sdk/channel-setup` também expõe os builders de nível mais baixo
`createOptionalChannelSetupAdapter(...)` e
`createOptionalChannelSetupWizard(...)` quando você só precisa de uma metade
dessa superfície de instalação opcional.

O adaptador/wizard opcional gerado falha com fechamento por padrão em gravações reais de configuração. Eles
reutilizam uma única mensagem de exigência de instalação em `validateInput`,
`applyAccountConfig` e `finalize`, e acrescentam um link de documentação quando `docsPath` está
definido.

Para UIs de setup baseadas em binário, prefira os helpers compartilhados delegados em vez de
copiar o mesmo glue de binário/status em cada canal:

- `createDetectedBinaryStatus(...)` para blocos de status que variam apenas por labels,
  hints, pontuações e detecção de binário
- `createCliPathTextInput(...)` para entradas de texto baseadas em caminho
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` e
  `createDelegatedResolveConfigured(...)` quando `setupEntry` precisa encaminhar
  preguiçosamente para um wizard completo mais pesado
- `createDelegatedTextInputShouldPrompt(...)` quando `setupEntry` só precisa
  delegar uma decisão `textInputs[*].shouldPrompt`

## Publicando e instalando

**Plugins externos:** publique no [ClawHub](/pt-BR/tools/clawhub) ou npm e depois instale:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

O OpenClaw tenta primeiro o ClawHub e faz fallback automático para npm. Você também pode
forçar explicitamente o ClawHub:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # apenas ClawHub
```

Não existe uma sobrescrita correspondente `npm:`. Use a especificação normal de pacote npm quando
quiser o caminho npm após o fallback do ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins no repositório:** coloque-os na árvore de workspace de Plugins integrados e eles serão automaticamente
descobertos durante o build.

**Usuários podem instalar:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Para instalações vindas de npm, `openclaw plugins install` executa
  `npm install --ignore-scripts` (sem scripts de ciclo de vida). Mantenha árvores de dependência
  de Plugin em JS/TS puro e evite pacotes que exijam builds em `postinstall`.
</Info>

Plugins integrados pertencentes ao OpenClaw são a única exceção de reparo na inicialização: quando uma
instalação empacotada vê um deles ativado pela configuração do Plugin, pela configuração legada de canal ou
pelo manifest integrado com ativação padrão, a inicialização instala as dependências de runtime ausentes
desse Plugin antes do import. Plugins de terceiros não devem depender de
instalações na inicialização; continue usando o instalador explícito de Plugin.

## Relacionados

- [Pontos de entrada do SDK](/pt-BR/plugins/sdk-entrypoints) — `definePluginEntry` e `defineChannelPluginEntry`
- [Plugin manifest](/pt-BR/plugins/manifest) — referência completa do schema do manifest
- [Criando plugins](/pt-BR/plugins/building-plugins) — guia passo a passo para começar
