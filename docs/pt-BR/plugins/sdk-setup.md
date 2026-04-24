---
read_when:
    - Você está adicionando um assistente de setup a um plugin
    - Você precisa entender `setup-entry.ts` vs `index.ts`
    - Você está definindo schemas de configuração de plugin ou metadados `openclaw` em package.json
sidebarTitle: Setup and Config
summary: Assistentes de setup, setup-entry.ts, schemas de configuração e metadados de package.json
title: Setup e configuração de Plugin
x-i18n:
    generated_at: "2026-04-24T06:04:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 25474e56927fa9d60616413191096f721ba542a7088717d80c277dfb34746d10
    source_path: plugins/sdk-setup.md
    workflow: 15
---

Referência para empacotamento de plugin (metadados em `package.json`), manifestos
(`openclaw.plugin.json`), entradas de setup e schemas de configuração.

<Tip>
  **Procurando um passo a passo?** Os guias práticos cobrem empacotamento em contexto:
  [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins#step-1-package-and-manifest) e
  [Plugins de provider](/pt-BR/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadados do pacote

Seu `package.json` precisa de um campo `openclaw` que informe ao sistema de plugins o que
seu plugin oferece:

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

Se você publicar o plugin externamente no ClawHub, esses campos `compat` e `build`
são obrigatórios. Os snippets canônicos de publicação ficam em
`docs/snippets/plugin-publish/`.

### Campos `openclaw`

| Campo        | Tipo       | Descrição                                                                                                                |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| `extensions` | `string[]` | Arquivos de ponto de entrada (relativos à raiz do pacote)                                                               |
| `setupEntry` | `string`   | Entrada leve apenas para setup (opcional)                                                                               |
| `channel`    | `object`   | Metadados de catálogo de canal para superfícies de setup, seletor, quickstart e status                                 |
| `providers`  | `string[]` | IDs de provider registrados por este plugin                                                                             |
| `install`    | `object`   | Dicas de instalação: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Flags de comportamento de inicialização                                                                                 |

### `openclaw.channel`

`openclaw.channel` é um metadado barato de pacote para descoberta de canal e superfícies
de setup antes do carregamento do runtime.

| Campo                                  | Tipo       | O que significa                                                              |
| -------------------------------------- | ---------- | ---------------------------------------------------------------------------- |
| `id`                                   | `string`   | ID canônico do canal.                                                        |
| `label`                                | `string`   | Rótulo principal do canal.                                                   |
| `selectionLabel`                       | `string`   | Rótulo do seletor/setup quando deve diferir de `label`.                      |
| `detailLabel`                          | `string`   | Rótulo secundário de detalhe para catálogos de canal e superfícies de status mais ricos. |
| `docsPath`                             | `string`   | Caminho da documentação para links de setup e seleção.                       |
| `docsLabel`                            | `string`   | Substituição do rótulo usado para links de docs quando deve diferir do id do canal. |
| `blurb`                                | `string`   | Descrição curta de onboarding/catálogo.                                      |
| `order`                                | `number`   | Ordem de classificação em catálogos de canal.                                |
| `aliases`                              | `string[]` | Aliases extras de busca para seleção de canal.                               |
| `preferOver`                           | `string[]` | IDs de plugin/canal de prioridade mais baixa que este canal deve superar.    |
| `systemImage`                          | `string`   | Nome opcional de ícone/system-image para catálogos de UI do canal.           |
| `selectionDocsPrefix`                  | `string`   | Texto prefixo antes de links de docs em superfícies de seleção.              |
| `selectionDocsOmitLabel`               | `boolean`  | Mostra o caminho de docs diretamente em vez de um link rotulado em textos de seleção. |
| `selectionExtras`                      | `string[]` | Strings curtas extras anexadas no texto de seleção.                          |
| `markdownCapable`                      | `boolean`  | Marca o canal como compatível com Markdown para decisões de formatação de saída. |
| `exposure`                             | `object`   | Controles de visibilidade do canal para setup, listas configuradas e superfícies de docs. |
| `quickstartAllowFrom`                  | `boolean`  | Inclui este canal no fluxo padrão de quickstart `allowFrom`.                 |
| `forceAccountBinding`                  | `boolean`  | Exige binding explícito de conta, mesmo quando existe apenas uma conta.      |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Prefere busca de sessão ao resolver alvos de anúncio para este canal.        |

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

- `configured`: incluir o canal em superfícies de listagem no estilo configured/status
- `setup`: incluir o canal em seletores interativos de setup/configure
- `docs`: marcar o canal como voltado ao público em superfícies de docs/navegação

`showConfigured` e `showInSetup` continuam compatíveis como aliases legados. Prefira
`exposure`.

### `openclaw.install`

`openclaw.install` é metadado de pacote, não metadado de manifesto.

| Campo                        | Tipo                 | O que significa                                                                   |
| ---------------------------- | -------------------- | ---------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Especificação npm canônica para fluxos de instalação/update.                       |
| `localPath`                  | `string`             | Caminho de instalação local de desenvolvimento ou integrado.                       |
| `defaultChoice`              | `"npm"` \| `"local"` | Fonte de instalação preferida quando ambas estão disponíveis.                      |
| `minHostVersion`             | `string`             | Versão mínima compatível do OpenClaw no formato `>=x.y.z`.                         |
| `expectedIntegrity`          | `string`             | String esperada de integridade dist do npm, normalmente `sha512-...`, para instalações fixadas. |
| `allowInvalidConfigRecovery` | `boolean`            | Permite que fluxos de reinstalação de plugin integrado recuperem falhas específicas de configuração obsoleta. |

O onboarding interativo também usa `openclaw.install` para superfícies
de instalação sob demanda. Se seu plugin expõe escolhas de autenticação de provider ou metadados
de setup/catálogo de canal antes do carregamento do runtime, o onboarding pode mostrar essa escolha,
solicitar npm vs instalação local, instalar ou habilitar o plugin e então continuar o
fluxo selecionado. Escolhas de onboarding via npm exigem metadados confiáveis de catálogo com um
`npmSpec` de registro; versões exatas e `expectedIntegrity` são pins opcionais. Se
`expectedIntegrity` estiver presente, fluxos de instalação/update o aplicam. Mantenha
os metadados de “o que mostrar” em `openclaw.plugin.json` e os metadados de “como instalar”
em `package.json`.

Se `minHostVersion` estiver definido, tanto instalação quanto carregamento do registro de manifestos o aplicam. Hosts mais antigos ignoram o plugin; strings de versão inválidas são rejeitadas.

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
apenas para recuperação estreita de plugin integrado, de modo que reinstalação/setup possa reparar
restos conhecidos de upgrade, como um caminho ausente de plugin integrado ou uma entrada obsoleta
`channels.<id>` para esse mesmo plugin. Se a configuração estiver quebrada por motivos não relacionados,
a instalação ainda falha em modo fechado e informa ao operador para executar `openclaw doctor --fix`.

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

Quando habilitado, o OpenClaw carrega apenas `setupEntry` durante a fase
de inicialização anterior ao listen, mesmo para canais já configurados. A entrada
completa é carregada depois que o gateway começa a escutar.

<Warning>
  Habilite o carregamento adiado apenas quando seu `setupEntry` registrar tudo de que o
  gateway precisa antes de começar a escutar (registro de canal, rotas HTTP,
  métodos do gateway). Se a entrada completa for dona de capacidades necessárias de inicialização, mantenha
  o comportamento padrão.
</Warning>

Se sua entrada de setup/completa registrar métodos RPC do gateway, mantenha-os em um
prefixo específico do plugin. Namespaces administrativos reservados do núcleo (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) permanecem pertencentes ao núcleo e sempre resolvem
para `operator.admin`.

## Manifesto do plugin

Todo plugin nativo deve incluir um `openclaw.plugin.json` na raiz do pacote.
O OpenClaw usa isso para validar configuração sem executar código do plugin.

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

Consulte [Manifesto de Plugin](/pt-BR/plugins/manifest) para a referência completa do schema.

## Publicação no ClawHub

Para pacotes de plugin, use o comando específico de ClawHub para pacote:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

O alias legado de publicação apenas para skill é para Skills. Pacotes de plugin devem
sempre usar `clawhub package publish`.

## Entrada de setup

O arquivo `setup-entry.ts` é uma alternativa leve a `index.ts` que
o OpenClaw carrega quando precisa apenas de superfícies de setup (onboarding, reparo de config,
inspeção de canal desabilitado).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Isso evita carregar código pesado de runtime (bibliotecas criptográficas, registros de CLI,
serviços em segundo plano) durante fluxos de setup.

Canais integrados do workspace que mantêm exports seguros para setup em módulos sidecar podem
usar `defineBundledChannelSetupEntry(...)` de
`openclaw/plugin-sdk/channel-entry-contract` em vez de
`defineSetupPluginEntry(...)`. Esse contrato integrado também oferece suporte a um export
opcional `runtime`, para que o wiring de runtime em tempo de setup permaneça leve e explícito.

**Quando o OpenClaw usa `setupEntry` em vez da entrada completa:**

- O canal está desabilitado, mas precisa de superfícies de setup/onboarding
- O canal está habilitado, mas não configurado
- O carregamento adiado está habilitado (`deferConfiguredChannelFullLoadUntilAfterListen`)

**O que `setupEntry` deve registrar:**

- O objeto plugin de canal (via `defineSetupPluginEntry`)
- Quaisquer rotas HTTP exigidas antes do listen do gateway
- Quaisquer métodos de gateway necessários durante a inicialização

Esses métodos de gateway de inicialização ainda devem evitar namespaces administrativos
reservados do núcleo, como `config.*` ou `update.*`.

**O que `setupEntry` NÃO deve incluir:**

- Registros de CLI
- Serviços em segundo plano
- Imports pesados de runtime (criptografia, SDKs)
- Métodos de gateway necessários apenas após a inicialização

### Imports estreitos de helpers de setup

Para caminhos quentes apenas de setup, prefira interfaces estreitas de helper de setup em vez da interface mais ampla
`plugin-sdk/setup` quando você precisar apenas de parte da superfície de setup:

| Caminho de importação              | Use para                                                                                | Principais exports                                                                                                                                                                                                                                                                         |
| ---------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `plugin-sdk/setup-runtime`         | helpers de runtime em tempo de setup que permanecem disponíveis em `setupEntry` / inicialização adiada de canal | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adaptadores de setup de conta com reconhecimento de ambiente                            | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                     |
| `plugin-sdk/setup-tools`           | helpers de CLI/setup/install/archive/docs                                               | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                           |

Use a interface mais ampla `plugin-sdk/setup` quando quiser a caixa de ferramentas completa
de setup compartilhado, incluindo helpers de patch de config, como
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Os adaptadores de patch de setup permanecem seguros para importação em caminhos quentes.
Sua busca de superfície de contrato integrada para promoção de conta única é lazy, então importar
`plugin-sdk/setup-runtime` não carrega antecipadamente a descoberta de superfície de contrato integrada
antes que o adaptador seja realmente usado.

### Promoção de conta única pertencente ao canal

Quando um canal faz upgrade de uma configuração de nível superior com conta única para
`channels.<id>.accounts.*`, o comportamento compartilhado padrão é mover valores promovidos
com escopo de conta para `accounts.default`.

Canais integrados podem restringir ou substituir essa promoção por meio de sua superfície de contrato
de setup:

- `singleAccountKeysToMove`: chaves extras de nível superior que devem ser movidas para a
  conta promovida
- `namedAccountPromotionKeys`: quando contas nomeadas já existem, apenas essas
  chaves são movidas para a conta promovida; chaves compartilhadas de política/entrega permanecem na raiz do canal
- `resolveSingleAccountPromotionTarget(...)`: escolhe qual conta existente
  recebe os valores promovidos

O Matrix é o exemplo integrado atual. Se exatamente uma conta Matrix nomeada já existir,
ou se `defaultAccount` apontar para uma chave não canônica existente, como `Ops`,
a promoção preserva essa conta em vez de criar uma nova entrada
`accounts.default`.

## Schema de configuração

A configuração do plugin é validada contra o JSON Schema do seu manifesto. Usuários
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

Plugins de canal podem fornecer assistentes de setup interativos para `openclaw onboard`.
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
Consulte pacotes de plugins integrados (por exemplo o plugin Discord em `src/channel.setup.ts`) para
exemplos completos.

Para prompts de lista de permissões de DM que só precisam do fluxo padrão
`note -> prompt -> parse -> merge -> patch`, prefira os helpers compartilhados de setup
de `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` e
`createNestedChannelParsedAllowFromPrompt(...)`.

Para blocos de status de setup de canal que variam apenas em labels, scores e linhas extras opcionais, prefira `createStandardChannelSetupStatus(...)` de
`openclaw/plugin-sdk/setup` em vez de reimplementar o mesmo objeto `status` em
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
// Retorna { setupAdapter, setupWizard }
```

`plugin-sdk/channel-setup` também expõe os builders de nível mais baixo
`createOptionalChannelSetupAdapter(...)` e
`createOptionalChannelSetupWizard(...)` quando você precisa apenas de metade
dessa superfície de instalação opcional.

O adaptador/assistente opcional gerado falha em modo fechado em gravações reais de configuração. Eles
reutilizam uma única mensagem de instalação necessária em `validateInput`,
`applyAccountConfig` e `finalize`, e acrescentam um link de docs quando `docsPath` estiver
definido.

Para UIs de setup baseadas em binário, prefira os helpers delegados compartilhados em vez de
copiar a mesma cola de binário/status em cada canal:

- `createDetectedBinaryStatus(...)` para blocos de status que variam apenas por labels,
  dicas, scores e detecção de binário
- `createCliPathTextInput(...)` para entradas de texto com caminho
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` e
  `createDelegatedResolveConfigured(...)` quando `setupEntry` precisa encaminhar para
  um assistente completo mais pesado de forma lazy
- `createDelegatedTextInputShouldPrompt(...)` quando `setupEntry` só precisa
  delegar uma decisão `textInputs[*].shouldPrompt`

## Publicação e instalação

**Plugins externos:** publique em [ClawHub](/pt-BR/tools/clawhub) ou npm e então instale:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

O OpenClaw tenta primeiro o ClawHub e faz fallback automático para npm. Você também pode
forçar o ClawHub explicitamente:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # apenas ClawHub
```

Não existe uma substituição correspondente `npm:`. Use a especificação normal do pacote npm quando
quiser o caminho npm após o fallback do ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins no repositório:** coloque-os sob a árvore de workspace de plugins integrados e eles serão automaticamente
descobertos durante o build.

**Usuários podem instalar:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Para instalações vindas de npm, `openclaw plugins install` executa
  `npm install --ignore-scripts` (sem scripts de ciclo de vida). Mantenha as árvores de dependência do plugin em JS/TS puro e evite pacotes que exijam builds em `postinstall`.
</Info>

Plugins integrados pertencentes ao OpenClaw são a única exceção de reparo na inicialização: quando uma
instalação empacotada encontra um deles habilitado por configuração de plugin, configuração legada de canal ou
seu manifesto integrado habilitado por padrão, a inicialização instala as dependências ausentes de runtime
desse plugin antes do import. Plugins de terceiros não devem depender de instalações na inicialização; continue
usando o instalador explícito de plugin.

## Relacionado

- [Pontos de entrada do SDK](/pt-BR/plugins/sdk-entrypoints) -- `definePluginEntry` e `defineChannelPluginEntry`
- [Manifesto de Plugin](/pt-BR/plugins/manifest) -- referência completa do schema do manifesto
- [Criando Plugins](/pt-BR/plugins/building-plugins) -- guia passo a passo para começar
