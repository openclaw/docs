---
read_when:
    - Você está adicionando um assistente de configuração a um Plugin
    - Você precisa entender setup-entry.ts em comparação com index.ts
    - Você está definindo esquemas de configuração de Plugin ou metadados openclaw no package.json
sidebarTitle: Setup and config
summary: Assistentes de configuração, setup-entry.ts, esquemas de configuração e metadados do package.json
title: Instalação e configuração do Plugin
x-i18n:
    generated_at: "2026-04-30T10:02:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: ded93227e0db13311870a9f45f01c2a0892a7204262fab17d09fdecd7c71579a
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Referência para empacotamento de plugins (metadados de `package.json`), manifestos (`openclaw.plugin.json`), entradas de configuração e esquemas de configuração.

<Tip>
**Procurando um passo a passo?** Os guias práticos cobrem o empacotamento em contexto: [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins#step-1-package-and-manifest) e [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadados do pacote

Seu `package.json` precisa de um campo `openclaw` que informa ao sistema de plugins o que o seu plugin fornece:

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
Se você publicar o plugin externamente no ClawHub, esses campos `compat` e `build` serão obrigatórios. Os snippets canônicos de publicação ficam em `docs/snippets/plugin-publish/`.
</Note>

### Campos de `openclaw`

<ParamField path="extensions" type="string[]">
  Arquivos de ponto de entrada (relativos à raiz do pacote).
</ParamField>
<ParamField path="setupEntry" type="string">
  Entrada leve somente de configuração (opcional).
</ParamField>
<ParamField path="channel" type="object">
  Metadados do catálogo de canais para superfícies de configuração, seletor, início rápido e status.
</ParamField>
<ParamField path="providers" type="string[]">
  IDs de provedores registrados por este plugin.
</ParamField>
<ParamField path="install" type="object">
  Dicas de instalação: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Flags de comportamento de inicialização.
</ParamField>

### `openclaw.channel`

`openclaw.channel` são metadados leves de pacote para descoberta de canais e superfícies de configuração antes do carregamento em runtime.

| Campo                                  | Tipo       | O que significa                                                               |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | ID canônico do canal.                                                         |
| `label`                                | `string`   | Rótulo principal do canal.                                                    |
| `selectionLabel`                       | `string`   | Rótulo do seletor/configuração quando deve ser diferente de `label`.          |
| `detailLabel`                          | `string`   | Rótulo de detalhe secundário para catálogos de canais e superfícies de status mais ricas. |
| `docsPath`                             | `string`   | Caminho da documentação para links de configuração e seleção.                 |
| `docsLabel`                            | `string`   | Substitui o rótulo usado em links da documentação quando deve ser diferente do ID do canal. |
| `blurb`                                | `string`   | Descrição curta de onboarding/catálogo.                                       |
| `order`                                | `number`   | Ordem de classificação em catálogos de canais.                                |
| `aliases`                              | `string[]` | Aliases extras de consulta para seleção de canais.                            |
| `preferOver`                           | `string[]` | IDs de plugins/canais de prioridade mais baixa que este canal deve superar.   |
| `systemImage`                          | `string`   | Nome opcional de ícone/imagem do sistema para catálogos de UI de canais.      |
| `selectionDocsPrefix`                  | `string`   | Texto de prefixo antes de links da documentação em superfícies de seleção.    |
| `selectionDocsOmitLabel`               | `boolean`  | Mostra o caminho da documentação diretamente em vez de um link rotulado da documentação no texto de seleção. |
| `selectionExtras`                      | `string[]` | Strings curtas extras anexadas ao texto de seleção.                           |
| `markdownCapable`                      | `boolean`  | Marca o canal como compatível com markdown para decisões de formatação de saída. |
| `exposure`                             | `object`   | Controles de visibilidade do canal para configuração, listas configuradas e superfícies da documentação. |
| `quickstartAllowFrom`                  | `boolean`  | Inclui este canal no fluxo padrão de configuração de início rápido `allowFrom`. |
| `forceAccountBinding`                  | `boolean`  | Exige vinculação explícita de conta mesmo quando existe apenas uma conta.     |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Prefere consulta de sessão ao resolver destinos de anúncio para este canal.   |

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

`exposure` aceita:

- `configured`: inclui o canal em superfícies de listagem configuradas/de estilo status
- `setup`: inclui o canal em seletores interativos de configuração
- `docs`: marca o canal como público em superfícies de documentação/navegação

<Note>
`showConfigured` e `showInSetup` continuam compatíveis como aliases legados. Prefira `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` são metadados de pacote, não metadados de manifesto.

| Campo                        | Tipo                 | O que significa                                                                  |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Especificação npm canônica para fluxos de instalação/atualização.                |
| `localPath`                  | `string`             | Caminho de desenvolvimento local ou instalação empacotada.                       |
| `defaultChoice`              | `"npm"` \| `"local"` | Fonte de instalação preferida quando ambas estão disponíveis.                    |
| `minHostVersion`             | `string`             | Versão mínima compatível do OpenClaw no formato `>=x.y.z`.                       |
| `expectedIntegrity`          | `string`             | String de integridade esperada da distribuição npm, geralmente `sha512-...`, para instalações fixadas. |
| `allowInvalidConfigRecovery` | `boolean`            | Permite que fluxos de reinstalação de plugins empacotados se recuperem de falhas específicas de configuração obsoleta. |

<AccordionGroup>
  <Accordion title="Comportamento de onboarding">
    O onboarding interativo também usa `openclaw.install` para superfícies de instalação sob demanda. Se o seu plugin expõe opções de autenticação de provedor ou metadados de configuração/catálogo de canal antes do carregamento em runtime, o onboarding pode mostrar essa opção, solicitar instalação npm vs local, instalar ou habilitar o plugin e então continuar o fluxo selecionado. Opções de onboarding via npm exigem metadados confiáveis de catálogo com um `npmSpec` de registro; versões exatas e `expectedIntegrity` são pinos opcionais. Se `expectedIntegrity` estiver presente, os fluxos de instalação/atualização o impõem. Mantenha os metadados de "o que mostrar" em `openclaw.plugin.json` e os metadados de "como instalar" em `package.json`.
  </Accordion>
  <Accordion title="Aplicação de minHostVersion">
    Se `minHostVersion` estiver definido, tanto a instalação quanto o carregamento do registro de manifestos o impõem. Hosts mais antigos ignoram o plugin; strings de versão inválidas são rejeitadas.
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
    `allowInvalidConfigRecovery` não é um bypass geral para configurações quebradas. Ele serve apenas para recuperação restrita de plugins empacotados, para que a reinstalação/configuração possa reparar sobras conhecidas de upgrade, como um caminho ausente de plugin empacotado ou uma entrada `channels.<id>` obsoleta desse mesmo plugin. Se a configuração estiver quebrada por motivos não relacionados, a instalação ainda falha fechada e informa ao operador para executar `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

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

Quando habilitado, o OpenClaw carrega apenas `setupEntry` durante a fase de inicialização antes de escutar, mesmo para canais já configurados. A entrada completa carrega depois que o gateway começa a escutar.

<Warning>
Habilite o carregamento adiado somente quando seu `setupEntry` registrar tudo que o gateway precisa antes de começar a escutar (registro de canal, rotas HTTP, métodos do gateway). Se a entrada completa possuir capacidades obrigatórias de inicialização, mantenha o comportamento padrão.
</Warning>

Se sua entrada de configuração/completa registra métodos RPC do gateway, mantenha-os em um prefixo específico do plugin. Namespaces administrativos centrais reservados (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) permanecem pertencentes ao núcleo e sempre resolvem para `operator.admin`.

## Manifesto do plugin

Todo plugin nativo deve fornecer um `openclaw.plugin.json` na raiz do pacote. O OpenClaw usa isso para validar a configuração sem executar código do plugin.

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

Mesmo plugins sem configuração devem fornecer um esquema. Um esquema vazio é válido:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Consulte [Manifesto do plugin](/pt-BR/plugins/manifest) para a referência completa do esquema.

## Publicação no ClawHub

Para pacotes de plugins, use o comando do ClawHub específico para pacotes:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
O alias legado de publicação somente para Skills é para Skills. Pacotes de plugins devem sempre usar `clawhub package publish`.
</Note>

## Entrada de configuração

O arquivo `setup-entry.ts` é uma alternativa leve a `index.ts` que o OpenClaw carrega quando precisa apenas de superfícies de configuração (onboarding, reparo de configuração, inspeção de canal desabilitado).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Isso evita carregar código pesado de tempo de execução (bibliotecas de criptografia, registros de CLI, serviços em segundo plano) durante fluxos de configuração.

Canais incluídos da área de trabalho que mantêm exportações seguras para configuração em módulos auxiliares podem usar `defineBundledChannelSetupEntry(...)` de `openclaw/plugin-sdk/channel-entry-contract` em vez de `defineSetupPluginEntry(...)`. Esse contrato incluído também oferece suporte a uma exportação opcional `runtime`, para que a conexão de tempo de execução em tempo de configuração possa permanecer leve e explícita.

<AccordionGroup>
  <Accordion title="Quando OpenClaw usa setupEntry em vez da entrada completa">
    - O canal está desabilitado, mas precisa de superfícies de configuração/integração inicial.
    - O canal está habilitado, mas não configurado.
    - O carregamento adiado está habilitado (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="O que setupEntry deve registrar">
    - O objeto de plugin do canal (via `defineSetupPluginEntry`).
    - Quaisquer rotas HTTP necessárias antes de o Gateway iniciar a escuta.
    - Quaisquer métodos do Gateway necessários durante a inicialização.

    Esses métodos do Gateway na inicialização ainda devem evitar namespaces reservados de administração do núcleo, como `config.*` ou `update.*`.

  </Accordion>
  <Accordion title="O que setupEntry NÃO deve incluir">
    - Registros de CLI.
    - Serviços em segundo plano.
    - Importações pesadas de tempo de execução (criptografia, SDKs).
    - Métodos do Gateway necessários apenas depois da inicialização.

  </Accordion>
</AccordionGroup>

### Importações focadas de auxiliares de configuração

Para caminhos críticos usados apenas na configuração, prefira os pontos de integração auxiliares de configuração mais focados à interface guarda-chuva mais ampla `plugin-sdk/setup` quando você precisar apenas de parte da superfície de configuração:

| Caminho de importação              | Use-o para                                                                                           | Principais exportações                                                                                                                                                                                                                                                                       |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | auxiliares de tempo de execução em tempo de configuração que permanecem disponíveis em `setupEntry` / inicialização adiada do canal | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adaptadores de configuração de conta cientes do ambiente                                             | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | auxiliares de configuração/instalação para CLI/arquivos compactados/documentação                     | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Use o ponto de integração mais amplo `plugin-sdk/setup` quando quiser o conjunto completo de ferramentas compartilhadas de configuração, incluindo auxiliares de patch de configuração, como `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Os adaptadores de patch de configuração permanecem seguros para o caminho crítico na importação. A busca de superfície de contrato para promoção de conta única incluída neles é sob demanda, então importar `plugin-sdk/setup-runtime` não carrega de forma antecipada a descoberta de superfície de contrato incluída antes de o adaptador ser realmente usado.

### Promoção de conta única controlada pelo canal

Quando um canal migra de uma configuração de nível superior de conta única para `channels.<id>.accounts.*`, o comportamento compartilhado padrão é mover valores promovidos com escopo de conta para `accounts.default`.

Canais incluídos podem restringir ou sobrescrever essa promoção por meio de sua superfície de contrato de configuração:

- `singleAccountKeysToMove`: chaves de nível superior extras que devem ser movidas para a conta promovida
- `namedAccountPromotionKeys`: quando contas nomeadas já existem, somente essas chaves são movidas para a conta promovida; chaves compartilhadas de política/entrega permanecem na raiz do canal
- `resolveSingleAccountPromotionTarget(...)`: escolha qual conta existente recebe os valores promovidos

<Note>
Matrix é o exemplo incluído atual. Se exatamente uma conta Matrix nomeada já existir, ou se `defaultAccount` apontar para uma chave não canônica existente, como `Ops`, a promoção preserva essa conta em vez de criar uma nova entrada `accounts.default`.
</Note>

## Schema de configuração

A configuração do plugin é validada em relação ao JSON Schema no seu manifesto. Usuários configuram plugins por meio de:

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

Use `buildChannelConfigSchema` para converter um schema Zod no encapsulador `ChannelConfigSchema` usado por artefatos de configuração pertencentes ao plugin:

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

Para plugins de terceiros, o contrato de caminho frio ainda é o manifesto do plugin: espelhe o JSON Schema gerado em `openclaw.plugin.json#channelConfigs` para que as superfícies de schema de configuração, configuração inicial e interface de usuário possam inspecionar `channels.<id>` sem carregar código de tempo de execução.

## Assistentes de configuração

Plugins de canal podem fornecer assistentes de configuração interativos para `openclaw onboard`. O assistente é um objeto `ChannelSetupWizard` em `ChannelPlugin`:

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

O tipo `ChannelSetupWizard` oferece suporte a `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` e mais. Consulte os pacotes de plugins incluídos (por exemplo, o plugin do Discord `src/channel.setup.ts`) para ver exemplos completos.

<AccordionGroup>
  <Accordion title="Solicitações allowFrom compartilhadas">
    Para solicitações de lista de permissões de mensagens diretas que precisam apenas do fluxo padrão `note -> prompt -> parse -> merge -> patch`, prefira os auxiliares compartilhados de configuração de `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` e `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Status padrão de configuração de canal">
    Para blocos de status de configuração de canal que variam apenas por rótulos, pontuações e linhas extras opcionais, prefira `createStandardChannelSetupStatus(...)` de `openclaw/plugin-sdk/setup` em vez de criar manualmente o mesmo objeto `status` em cada plugin.
  </Accordion>
  <Accordion title="Superfície opcional de configuração de canal">
    Para superfícies opcionais de configuração que devem aparecer apenas em determinados contextos, use `createOptionalChannelSetupSurface` de `openclaw/plugin-sdk/channel-setup`:

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

    `plugin-sdk/channel-setup` também expõe os construtores de nível mais baixo `createOptionalChannelSetupAdapter(...)` e `createOptionalChannelSetupWizard(...)` quando você só precisa de uma metade dessa superfície de instalação opcional.

    O adaptador/assistente opcional gerado falha em modo fechado em gravações reais de configuração. Eles reutilizam uma única mensagem de instalação obrigatória em `validateInput`, `applyAccountConfig` e `finalize`, e acrescentam um link de documentação quando `docsPath` está definido.

  </Accordion>
  <Accordion title="Auxiliares de configuração baseados em binário">
    Para interfaces de usuário de configuração baseadas em binário, prefira os auxiliares delegados compartilhados em vez de copiar a mesma integração de binário/status para todos os canais:

    - `createDetectedBinaryStatus(...)` para blocos de status que variam apenas por rótulos, dicas, pontuações e detecção de binário
    - `createCliPathTextInput(...)` para entradas de texto baseadas em caminho
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` e `createDelegatedResolveConfigured(...)` quando `setupEntry` precisa encaminhar para um assistente completo mais pesado sob demanda
    - `createDelegatedTextInputShouldPrompt(...)` quando `setupEntry` precisa apenas delegar uma decisão de `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Publicação e instalação

**Plugins externos:** publique no [ClawHub](/pt-BR/tools/clawhub) e depois instale:

<Tabs>
  <Tab title="Automático (ClawHub, depois npm)">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    OpenClaw tenta o ClawHub primeiro e recorre ao npm automaticamente.

  </Tab>
  <Tab title="Somente ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Especificação de pacote npm">
    Use npm quando um pacote ainda não tiver sido movido para o ClawHub, ou quando você precisar de um
    caminho direto de instalação npm durante a migração:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugins no repositório:** coloque-os sob a árvore de área de trabalho de plugins incluídos, e eles serão descobertos automaticamente durante a compilação.

**Usuários podem instalar:**

```bash
openclaw plugins install <package-name>
```

<Info>
Para instalações com origem no npm, `openclaw plugins install` executa `npm install --ignore-scripts` local ao projeto (sem scripts de ciclo de vida), ignorando configurações globais herdadas de instalação do npm. Mantenha as árvores de dependências de plugins formadas apenas por JS/TS e evite pacotes que exigem compilações `postinstall`.
</Info>

<Note>
Plugins empacotados pertencentes ao OpenClaw são a única exceção de reparo na inicialização: quando uma instalação empacotada encontra um deles habilitado pela configuração do plugin, pela configuração legada do canal ou pelo manifesto empacotado habilitado por padrão, a inicialização instala as dependências de runtime ausentes desse plugin antes da importação. Operadores podem inspecionar ou reparar essa etapa com `openclaw plugins deps`. Plugins de terceiros não devem depender de instalações na inicialização; continue usando o instalador explícito de plugins.
</Note>

As dependências de runtime empacotadas em nível de pacote são metadados explícitos, não inferidos a partir do JavaScript compilado na inicialização do Gateway. Se uma dependência raiz compartilhada do OpenClaw precisar estar disponível dentro do espelho de runtime externo do plugin empacotado, declare-a em `openclaw.bundle.mirroredRootRuntimeDependencies` no manifesto do pacote raiz.

## Relacionado

- [Criando plugins](/pt-BR/plugins/building-plugins) — guia passo a passo de introdução
- [Manifesto do Plugin](/pt-BR/plugins/manifest) — referência completa do esquema do manifesto
- [Pontos de entrada do SDK](/pt-BR/plugins/sdk-entrypoints) — `definePluginEntry` e `defineChannelPluginEntry`
