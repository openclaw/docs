---
read_when:
    - Você está adicionando um assistente de configuração a um Plugin
    - Você precisa entender `setup-entry.ts` vs `index.ts`
    - Você está definindo schemas de config de Plugin ou metadados `openclaw` no `package.json`
sidebarTitle: Setup and config
summary: Assistentes de configuração, `setup-entry.ts`, schemas de config e metadados de `package.json`
title: Setup e config de Plugin
x-i18n:
    generated_at: "2026-04-26T11:35:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5ac08bf43af0a15e4ed797eb3a732d15f24f67304efbac7d74e6f24ffe67af9
    source_path: plugins/sdk-setup.md
    workflow: 15
---

Referência para empacotamento de Plugin (metadados do `package.json`), manifestos (`openclaw.plugin.json`), entradas de setup e esquemas de configuração.

<Tip>
**Procurando um passo a passo?** Os guias práticos cobrem o empacotamento em contexto: [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins#step-1-package-and-manifest) e [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadados do pacote

Seu `package.json` precisa de um campo `openclaw` que informa ao sistema de Plugin o que seu Plugin fornece:

<Tabs>
  <Tab title="Plugin de canal">
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
  </Tab>
  <Tab title="Plugin de provedor / linha de base do ClawHub">
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
  </Tab>
</Tabs>

<Note>
Se você publicar o Plugin externamente no ClawHub, esses campos `compat` e `build` são obrigatórios. Os snippets de publicação canônicos ficam em `docs/snippets/plugin-publish/`.
</Note>

### Campos `openclaw`

<ParamField path="extensions" type="string[]">
  Arquivos de ponto de entrada (relativos à raiz do pacote).
</ParamField>
<ParamField path="setupEntry" type="string">
  Entrada leve apenas para setup (opcional).
</ParamField>
<ParamField path="channel" type="object">
  Metadados do catálogo de canais para superfícies de setup, seletor, início rápido e status.
</ParamField>
<ParamField path="providers" type="string[]">
  IDs de provedores registrados por este Plugin.
</ParamField>
<ParamField path="install" type="object">
  Dicas de instalação: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Sinalizadores de comportamento de inicialização.
</ParamField>

### `openclaw.channel`

`openclaw.channel` é um metadado barato de pacote para descoberta de canais e superfícies de setup antes do carregamento em tempo de execução.

| Campo                                  | Tipo       | O que significa                                                               |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | ID canônico do canal.                                                         |
| `label`                                | `string`   | Rótulo principal do canal.                                                    |
| `selectionLabel`                       | `string`   | Rótulo do seletor/setup quando ele deve diferir de `label`.                   |
| `detailLabel`                          | `string`   | Rótulo de detalhe secundário para catálogos de canais mais ricos e superfícies de status. |
| `docsPath`                             | `string`   | Caminho da documentação para links de setup e seleção.                        |
| `docsLabel`                            | `string`   | Rótulo de substituição usado para links da documentação quando ele deve diferir do ID do canal. |
| `blurb`                                | `string`   | Descrição curta de onboarding/catálogo.                                       |
| `order`                                | `number`   | Ordem de classificação em catálogos de canais.                                |
| `aliases`                              | `string[]` | Aliases adicionais de busca para seleção de canal.                            |
| `preferOver`                           | `string[]` | IDs de Plugin/canal de menor prioridade que este canal deve superar.          |
| `systemImage`                          | `string`   | Nome opcional de ícone/system-image para catálogos de UI do canal.            |
| `selectionDocsPrefix`                  | `string`   | Texto de prefixo antes de links de documentação em superfícies de seleção.    |
| `selectionDocsOmitLabel`               | `boolean`  | Exibe o caminho da documentação diretamente em vez de um link de documentação com rótulo no texto de seleção. |
| `selectionExtras`                      | `string[]` | Strings curtas extras anexadas ao texto de seleção.                           |
| `markdownCapable`                      | `boolean`  | Marca o canal como compatível com markdown para decisões de formatação de saída. |
| `exposure`                             | `object`   | Controles de visibilidade do canal para setup, listas configuradas e superfícies de documentação. |
| `quickstartAllowFrom`                  | `boolean`  | Inclui este canal no fluxo padrão de setup `allowFrom` de início rápido.      |
| `forceAccountBinding`                  | `boolean`  | Exige vínculo explícito de conta mesmo quando existe apenas uma conta.        |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Prefere busca de sessão ao resolver destinos de anúncio para este canal.      |

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

- `configured`: inclui o canal em superfícies de listagem configuradas/estilo status
- `setup`: inclui o canal em seletores interativos de setup/configuração
- `docs`: marca o canal como voltado ao público em superfícies de documentação/navegação

<Note>
`showConfigured` e `showInSetup` continuam com suporte como aliases legados. Prefira `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` é metadado de pacote, não metadado de manifesto.

| Campo                        | Tipo                 | O que significa                                                                 |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Especificação npm canônica para fluxos de instalação/atualização.               |
| `localPath`                  | `string`             | Caminho de instalação local de desenvolvimento ou empacotada.                   |
| `defaultChoice`              | `"npm"` \| `"local"` | Fonte de instalação preferida quando ambas estão disponíveis.                   |
| `minHostVersion`             | `string`             | Versão mínima compatível do OpenClaw no formato `>=x.y.z`.                      |
| `expectedIntegrity`          | `string`             | String de integridade esperada do dist npm, normalmente `sha512-...`, para instalações fixadas. |
| `allowInvalidConfigRecovery` | `boolean`            | Permite que fluxos de reinstalação de Plugin empacotado recuperem falhas específicas de configuração obsoleta. |

<AccordionGroup>
  <Accordion title="Comportamento de onboarding">
    O onboarding interativo também usa `openclaw.install` para superfícies de instalação sob demanda. Se seu Plugin expõe opções de autenticação de provedor ou metadados de setup/catálogo de canal antes do carregamento em tempo de execução, o onboarding pode mostrar essa escolha, solicitar npm vs instalação local, instalar ou habilitar o Plugin e então continuar o fluxo selecionado. Escolhas de onboarding com npm exigem metadados confiáveis de catálogo com um `npmSpec` de registro; versões exatas e `expectedIntegrity` são pins opcionais. Se `expectedIntegrity` estiver presente, os fluxos de instalação/atualização a impõem. Mantenha os metadados de "o que mostrar" em `openclaw.plugin.json` e os metadados de "como instalá-lo" em `package.json`.
  </Accordion>
  <Accordion title="Aplicação de minHostVersion">
    Se `minHostVersion` estiver definido, tanto a instalação quanto o carregamento do registro de manifesto o aplicam. Hosts mais antigos ignoram o Plugin; strings de versão inválidas são rejeitadas.
  </Accordion>
  <Accordion title="Instalações npm fixadas">
    Para instalações npm fixadas, mantenha a versão exata em `npmSpec` e adicione a integridade esperada do artefato:

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

  </Accordion>
  <Accordion title="Escopo de allowInvalidConfigRecovery">
    `allowInvalidConfigRecovery` não é um bypass geral para configurações quebradas. Ele existe apenas para recuperação limitada de Plugin empacotado, para que a reinstalação/setup possa reparar resíduos de upgrade conhecidos, como um caminho ausente de Plugin empacotado ou uma entrada `channels.<id>` obsoleta para esse mesmo Plugin. Se a configuração estiver quebrada por motivos não relacionados, a instalação ainda falha de forma segura e informa ao operador para executar `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### Carregamento completo adiado

Plugins de canal podem optar pelo carregamento adiado com:

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

Quando habilitado, o OpenClaw carrega apenas `setupEntry` durante a fase de inicialização pré-listen, mesmo para canais já configurados. A entrada completa é carregada depois que o gateway começa a escutar.

<Warning>
Habilite o carregamento adiado apenas quando seu `setupEntry` registrar tudo de que o gateway precisa antes de começar a escutar (registro de canal, rotas HTTP, métodos do gateway). Se a entrada completa possuir recursos de inicialização obrigatórios, mantenha o comportamento padrão.
</Warning>

Se sua entrada de setup/completa registra métodos RPC do gateway, mantenha-os em um prefixo específico do Plugin. Os namespaces administrativos centrais reservados (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) permanecem sob posse do core e sempre resolvem para `operator.admin`.

## Manifesto do Plugin

Todo Plugin nativo deve incluir um `openclaw.plugin.json` na raiz do pacote. O OpenClaw usa isso para validar a configuração sem executar código do Plugin.

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

Mesmo Plugins sem configuração devem incluir um esquema. Um esquema vazio é válido:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Consulte [Manifesto do Plugin](/pt-BR/plugins/manifest) para a referência completa do esquema.

## Publicação no ClawHub

Para pacotes de Plugin, use o comando específico do ClawHub para pacotes:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
O alias legado de publicação apenas para skill é para Skills. Pacotes de Plugin devem sempre usar `clawhub package publish`.
</Note>

## Entrada de setup

O arquivo `setup-entry.ts` é uma alternativa leve a `index.ts` que o OpenClaw carrega quando precisa apenas de superfícies de setup (onboarding, reparo de configuração, inspeção de canal desabilitado).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Isso evita carregar código pesado de runtime (bibliotecas de criptografia, registros de CLI, serviços em segundo plano) durante os fluxos de setup.

Canais empacotados do workspace que mantêm exportações seguras para setup em módulos sidecar podem usar `defineBundledChannelSetupEntry(...)` de `openclaw/plugin-sdk/channel-entry-contract` em vez de `defineSetupPluginEntry(...)`. Esse contrato empacotado também oferece suporte a uma exportação opcional `runtime`, para que a configuração do runtime no momento do setup permaneça leve e explícita.

<AccordionGroup>
  <Accordion title="Quando o OpenClaw usa setupEntry em vez da entrada completa">
    - O canal está desabilitado, mas precisa de superfícies de setup/onboarding.
    - O canal está habilitado, mas não configurado.
    - O carregamento adiado está habilitado (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="O que setupEntry deve registrar">
    - O objeto do Plugin de canal (via `defineSetupPluginEntry`).
    - Quaisquer rotas HTTP necessárias antes de o gateway começar a escutar.
    - Quaisquer métodos de gateway necessários durante a inicialização.

    Esses métodos de gateway de inicialização ainda devem evitar namespaces administrativos centrais reservados, como `config.*` ou `update.*`.

  </Accordion>
  <Accordion title="O que setupEntry NÃO deve incluir">
    - Registros de CLI.
    - Serviços em segundo plano.
    - Importações pesadas de runtime (criptografia, SDKs).
    - Métodos de gateway necessários apenas após a inicialização.

  </Accordion>
</AccordionGroup>

### Importações restritas de helpers de setup

Para caminhos quentes apenas de setup, prefira as interfaces restritas de helper de setup em vez do guarda-chuva mais amplo `plugin-sdk/setup` quando você precisar apenas de parte da superfície de setup:

| Caminho de importação               | Use para                                                                                  | Exportações principais                                                                                                                                                                                                                                                                       |
| ----------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`          | helpers de runtime no momento do setup que permanecem disponíveis em `setupEntry` / inicialização adiada do canal | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime`  | adaptadores de setup de conta com reconhecimento de ambiente                              | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`            | helpers de CLI/arquivo/documentação para setup/instalação                                 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                              |

Use a interface mais ampla `plugin-sdk/setup` quando quiser a caixa de ferramentas compartilhada completa de setup, incluindo helpers de patch de configuração, como `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Os adaptadores de patch de setup continuam seguros para importação em caminho quente. A busca empacotada da superfície de contrato para promoção de conta única é lazy, portanto importar `plugin-sdk/setup-runtime` não carrega antecipadamente a descoberta da superfície de contrato empacotada antes de o adaptador realmente ser usado.

### Promoção de conta única de propriedade do canal

Quando um canal faz upgrade de uma configuração de nível superior de conta única para `channels.<id>.accounts.*`, o comportamento compartilhado padrão é mover os valores promovidos com escopo de conta para `accounts.default`.

Canais empacotados podem restringir ou sobrescrever essa promoção por meio de sua superfície de contrato de setup:

- `singleAccountKeysToMove`: chaves adicionais de nível superior que devem ser movidas para a conta promovida
- `namedAccountPromotionKeys`: quando contas nomeadas já existem, apenas estas chaves são movidas para a conta promovida; chaves compartilhadas de política/entrega permanecem na raiz do canal
- `resolveSingleAccountPromotionTarget(...)`: escolhe qual conta existente recebe os valores promovidos

<Note>
Matrix é o exemplo empacotado atual. Se já existir exatamente uma conta Matrix nomeada ou se `defaultAccount` apontar para uma chave não canônica existente, como `Ops`, a promoção preserva essa conta em vez de criar uma nova entrada `accounts.default`.
</Note>

## Esquema de configuração

A configuração do Plugin é validada em relação ao JSON Schema no seu manifesto. Os usuários configuram Plugins via:

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

### Criando esquemas de configuração de canal

Use `buildChannelConfigSchema` para converter um esquema Zod no wrapper `ChannelConfigSchema` usado por artefatos de configuração pertencentes ao Plugin:

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

Para Plugins de terceiros, o contrato de caminho frio ainda é o manifesto do Plugin: espelhe o JSON Schema gerado em `openclaw.plugin.json#channelConfigs` para que o esquema de configuração, o setup e as superfícies de UI possam inspecionar `channels.<id>` sem carregar código de runtime.

## Assistentes de setup

Plugins de canal podem fornecer assistentes de setup interativos para `openclaw onboard`. O assistente é um objeto `ChannelSetupWizard` no `ChannelPlugin`:

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

O tipo `ChannelSetupWizard` oferece suporte a `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` e mais. Veja pacotes de Plugin empacotados (por exemplo, o Plugin do Discord `src/channel.setup.ts`) para exemplos completos.

<AccordionGroup>
  <Accordion title="Prompts compartilhados de allowFrom">
    Para prompts de allowlist de DM que precisam apenas do fluxo padrão `note -> prompt -> parse -> merge -> patch`, prefira os helpers compartilhados de setup de `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` e `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Status padrão de setup de canal">
    Para blocos de status de setup de canal que variam apenas por rótulos, pontuações e linhas extras opcionais, prefira `createStandardChannelSetupStatus(...)` de `openclaw/plugin-sdk/setup` em vez de montar manualmente o mesmo objeto `status` em cada Plugin.
  </Accordion>
  <Accordion title="Superfície opcional de setup de canal">
    Para superfícies opcionais de setup que devem aparecer apenas em certos contextos, use `createOptionalChannelSetupSurface` de `openclaw/plugin-sdk/channel-setup`:

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

    `plugin-sdk/channel-setup` também expõe os builders de nível mais baixo `createOptionalChannelSetupAdapter(...)` e `createOptionalChannelSetupWizard(...)` quando você precisa apenas de uma metade dessa superfície de instalação opcional.

    O adaptador/assistente opcional gerado falha de forma segura em gravações reais de configuração. Eles reutilizam uma mensagem única de instalação obrigatória em `validateInput`, `applyAccountConfig` e `finalize`, e acrescentam um link de documentação quando `docsPath` está definido.

  </Accordion>
  <Accordion title="Helpers de setup com backend binário">
    Para UIs de setup com backend binário, prefira os helpers delegados compartilhados em vez de copiar a mesma cola binário/status para cada canal:

    - `createDetectedBinaryStatus(...)` para blocos de status que variam apenas por rótulos, dicas, pontuações e detecção de binário
    - `createCliPathTextInput(...)` para entradas de texto baseadas em caminho
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` e `createDelegatedResolveConfigured(...)` quando `setupEntry` precisa encaminhar lazy para um assistente completo mais pesado
    - `createDelegatedTextInputShouldPrompt(...)` quando `setupEntry` precisa apenas delegar uma decisão de `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Publicação e instalação

**Plugins externos:** publique no [ClawHub](/pt-BR/tools/clawhub) ou no npm e depois instale:

<Tabs>
  <Tab title="Automático (ClawHub e depois npm)">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    O OpenClaw tenta primeiro o ClawHub e recorre ao npm automaticamente.

  </Tab>
  <Tab title="Somente ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Especificação de pacote npm">
    Não existe uma substituição `npm:` correspondente. Use a especificação normal de pacote npm quando quiser o caminho do npm após o fallback do ClawHub:

    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugins no repositório:** coloque-os na árvore de workspace de Plugin empacotado e eles serão descobertos automaticamente durante a build.

**Os usuários podem instalar:**

```bash
openclaw plugins install <package-name>
```

<Info>
Para instalações originadas do npm, `openclaw plugins install` executa `npm install --ignore-scripts` local ao projeto (sem scripts de ciclo de vida), ignorando configurações globais herdadas de instalação do npm. Mantenha as árvores de dependência do Plugin em JS/TS puro e evite pacotes que exijam builds em `postinstall`.
</Info>

<Note>
Plugins empacotados de propriedade do OpenClaw são a única exceção de reparo na inicialização: quando uma instalação empacotada encontra um habilitado por configuração de Plugin, configuração legada de canal ou seu manifesto empacotado com habilitação padrão, a inicialização instala as dependências de runtime ausentes desse Plugin antes da importação. Plugins de terceiros não devem depender de instalações na inicialização; continue usando o instalador explícito de Plugin.
</Note>

## Relacionado

- [Criando Plugins](/pt-BR/plugins/building-plugins) — guia passo a passo de introdução
- [Manifesto do Plugin](/pt-BR/plugins/manifest) — referência completa do esquema de manifesto
- [Pontos de entrada do SDK](/pt-BR/plugins/sdk-entrypoints) — `definePluginEntry` e `defineChannelPluginEntry`
