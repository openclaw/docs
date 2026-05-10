---
read_when:
    - Você está adicionando um assistente de configuração a um Plugin
    - Você precisa entender a diferença entre setup-entry.ts e index.ts
    - Você está definindo esquemas de configuração de Plugin ou metadados openclaw do package.json
sidebarTitle: Setup and config
summary: Assistentes de configuração, setup-entry.ts, esquemas de configuração e metadados do package.json
title: Instalação e configuração do Plugin
x-i18n:
    generated_at: "2026-05-10T19:45:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e6c59d7201cc1402cd648a37fc498fbb7e4043a661dcd39c2e62fcf01067879
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Referência para empacotamento de plugins (metadados de `package.json`), manifestos (`openclaw.plugin.json`), entradas de configuração e esquemas de configuração.

<Tip>
**Procurando um passo a passo?** Os guias práticos cobrem empacotamento em contexto: [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins#step-1-package-and-manifest) e [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadados do pacote

Seu `package.json` precisa de um campo `openclaw` que informa ao sistema de plugins o que seu plugin fornece:

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
  Entrada leve apenas de configuração (opcional).
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

`openclaw.channel` é metadado barato de pacote para descoberta de canais e superfícies de configuração antes do runtime carregar.

| Campo                                  | Tipo       | O que significa                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | ID canônico do canal.                                                         |
| `label`                                | `string`   | Rótulo principal do canal.                                                        |
| `selectionLabel`                       | `string`   | Rótulo do seletor/configuração quando deve ser diferente de `label`.                        |
| `detailLabel`                          | `string`   | Rótulo secundário de detalhe para catálogos de canais e superfícies de status mais ricos.       |
| `docsPath`                             | `string`   | Caminho da documentação para links de configuração e seleção.                                      |
| `docsLabel`                            | `string`   | Rótulo substituto usado para links da documentação quando deve ser diferente do ID do canal. |
| `blurb`                                | `string`   | Descrição curta de onboarding/catálogo.                                         |
| `order`                                | `number`   | Ordem de classificação em catálogos de canais.                                               |
| `aliases`                              | `string[]` | Aliases extras de busca para seleção de canal.                                   |
| `preferOver`                           | `string[]` | IDs de plugin/canal de menor prioridade que este canal deve superar.                |
| `systemImage`                          | `string`   | Nome opcional de ícone/imagem do sistema para catálogos de UI de canais.                      |
| `selectionDocsPrefix`                  | `string`   | Texto de prefixo antes dos links da documentação em superfícies de seleção.                          |
| `selectionDocsOmitLabel`               | `boolean`  | Mostra o caminho da documentação diretamente em vez de um link de documentação rotulado no texto de seleção. |
| `selectionExtras`                      | `string[]` | Strings curtas extras anexadas ao texto de seleção.                               |
| `markdownCapable`                      | `boolean`  | Marca o canal como compatível com markdown para decisões de formatação de saída.      |
| `exposure`                             | `object`   | Controles de visibilidade do canal para configuração, listas configuradas e superfícies de documentação.   |
| `quickstartAllowFrom`                  | `boolean`  | Inclui este canal no fluxo padrão de configuração de início rápido `allowFrom`.         |
| `forceAccountBinding`                  | `boolean`  | Exige vinculação explícita de conta mesmo quando existe apenas uma conta.           |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Prefere busca de sessão ao resolver alvos de anúncio para este canal.       |

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

`exposure` é compatível com:

- `configured`: inclui o canal em superfícies de listagem configuradas/de estilo status
- `setup`: inclui o canal em seletores interativos de configuração
- `docs`: marca o canal como público em superfícies de documentação/navegação

<Note>
`showConfigured` e `showInSetup` continuam compatíveis como aliases legados. Prefira `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` é metadado de pacote, não metadado de manifesto.

| Campo                        | Tipo                                | O que significa                                                                     |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Spec canônica do ClawHub para fluxos de instalação/atualização e instalação sob demanda no onboarding. |
| `npmSpec`                    | `string`                            | Spec canônica do npm para fluxos alternativos de instalação/atualização.                             |
| `localPath`                  | `string`                            | Caminho de desenvolvimento local ou instalação empacotada.                                        |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Origem de instalação preferida quando várias origens estão disponíveis.                     |
| `minHostVersion`             | `string`                            | Versão mínima compatível do OpenClaw no formato `>=x.y.z` ou `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | String de integridade esperada do dist do npm, geralmente `sha512-...`, para instalações fixadas.    |
| `allowInvalidConfigRecovery` | `boolean`                           | Permite que fluxos de reinstalação de plugins empacotados se recuperem de falhas específicas de configuração obsoleta.  |

<AccordionGroup>
  <Accordion title="Comportamento de onboarding">
    O onboarding interativo também usa `openclaw.install` para superfícies de instalação sob demanda. Se seu plugin expõe opções de autenticação de provedor ou metadados de configuração/catálogo de canal antes do runtime carregar, o onboarding pode mostrar essa opção, solicitar instalação pelo ClawHub, npm ou local, instalar ou habilitar o plugin e então continuar o fluxo selecionado. As opções de onboarding do ClawHub usam `clawhubSpec` e são preferidas quando presentes; opções npm exigem metadados de catálogo confiáveis com um `npmSpec` de registro; versões exatas e `expectedIntegrity` são pins npm opcionais. Se `expectedIntegrity` estiver presente, os fluxos de instalação/atualização o aplicam para npm. Mantenha os metadados de "o que mostrar" em `openclaw.plugin.json` e os metadados de "como instalar" em `package.json`.
  </Accordion>
  <Accordion title="Aplicação de minHostVersion">
    Se `minHostVersion` estiver definido, a instalação e o carregamento do registro de manifestos não empacotados o aplicam. Hosts mais antigos ignoram plugins externos; strings de versão inválidas são rejeitadas. Plugins de origem empacotados são presumidos como tendo a mesma versão do checkout do host.
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
    `allowInvalidConfigRecovery` não é uma solução geral para contornar configurações quebradas. Ele existe apenas para recuperação restrita de plugins empacotados, para que reinstalação/configuração possa reparar sobras conhecidas de upgrade, como um caminho ausente de plugin empacotado ou uma entrada `channels.<id>` obsoleta para esse mesmo plugin. Se a configuração estiver quebrada por motivos não relacionados, a instalação ainda falha de forma fechada e informa ao operador para executar `openclaw doctor --fix`.
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

Quando ativado, o OpenClaw carrega apenas `setupEntry` durante a fase de inicialização anterior à escuta, mesmo para canais já configurados. A entrada completa carrega depois que o Gateway começa a escutar.

<Warning>
Ative o carregamento adiado apenas quando seu `setupEntry` registrar tudo de que o Gateway precisa antes de começar a escutar (registro de canal, rotas HTTP, métodos do Gateway). Se a entrada completa possuir capacidades de inicialização obrigatórias, mantenha o comportamento padrão.
</Warning>

Se sua entrada de configuração/completa registra métodos RPC do Gateway, mantenha-os em um prefixo específico do plugin. Namespaces administrativos centrais reservados (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) continuam pertencendo ao núcleo e sempre resolvem para `operator.admin`.

## Manifesto de plugin

Todo plugin nativo deve incluir um `openclaw.plugin.json` na raiz do pacote. O OpenClaw usa isso para validar a configuração sem executar código do plugin.

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

Mesmo plugins sem configuração devem incluir um esquema. Um esquema vazio é válido:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Veja [Manifesto de plugin](/pt-BR/plugins/manifest) para a referência completa do esquema.

## Publicação no ClawHub

Para pacotes de plugin, use o comando ClawHub específico do pacote:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
O alias legado de publicação apenas para skills é para skills. Pacotes de Plugin devem sempre usar `clawhub package publish`.
</Note>

## Entrada de configuração

O arquivo `setup-entry.ts` é uma alternativa leve ao `index.ts` que o OpenClaw carrega quando precisa apenas de superfícies de configuração (onboarding, reparo de configuração, inspeção de canal desativado).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Isso evita carregar código pesado de runtime (bibliotecas de criptografia, registros de CLI, serviços em segundo plano) durante fluxos de configuração.

Canais agrupados no workspace que mantêm exports seguros para configuração em módulos auxiliares podem usar `defineBundledChannelSetupEntry(...)` de `openclaw/plugin-sdk/channel-entry-contract` em vez de `defineSetupPluginEntry(...)`. Esse contrato agrupado também aceita um export opcional `runtime`, para que a ligação de runtime em tempo de configuração permaneça leve e explícita.

<AccordionGroup>
  <Accordion title="Quando o OpenClaw usa setupEntry em vez da entrada completa">
    - O canal está desativado, mas precisa de superfícies de configuração/onboarding.
    - O canal está ativado, mas não configurado.
    - O carregamento adiado está ativado (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="O que setupEntry deve registrar">
    - O objeto de Plugin do canal (via `defineSetupPluginEntry`).
    - Quaisquer rotas HTTP necessárias antes do gateway escutar.
    - Quaisquer métodos de gateway necessários durante a inicialização.

    Esses métodos de gateway de inicialização ainda devem evitar namespaces administrativos reservados do núcleo, como `config.*` ou `update.*`.

  </Accordion>
  <Accordion title="O que setupEntry NÃO deve incluir">
    - Registros de CLI.
    - Serviços em segundo plano.
    - Imports pesados de runtime (criptografia, SDKs).
    - Métodos de Gateway necessários apenas após a inicialização.

  </Accordion>
</AccordionGroup>

### Imports estreitos de auxiliares de configuração

Para caminhos quentes somente de configuração, prefira os pontos de integração estreitos de auxiliares de configuração em vez do guarda-chuva mais amplo `plugin-sdk/setup` quando você precisar apenas de parte da superfície de configuração:

| Caminho de import                   | Use para                                                                                  | Exports principais                                                                                                                                                                                                                                                                           |
| ----------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`          | auxiliares de runtime em tempo de configuração que permanecem disponíveis em `setupEntry` / inicialização adiada de canal | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime`  | alias de compatibilidade obsoleto; use `plugin-sdk/setup-runtime`                         | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`            | auxiliares de CLI/arquivo/docs para configuração/instalação                               | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Use o ponto de integração mais amplo `plugin-sdk/setup` quando quiser o conjunto completo compartilhado de ferramentas de configuração, incluindo auxiliares de patch de configuração como `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Os adaptadores de patch de configuração continuam seguros para caminhos quentes no import. A busca de superfície de contrato agrupada para promoção de conta única é lazy, portanto importar `plugin-sdk/setup-runtime` não carrega antecipadamente a descoberta de superfície de contrato agrupada antes que o adaptador seja realmente usado.

### Promoção de conta única controlada pelo canal

Quando um canal faz upgrade de uma configuração de nível superior de conta única para `channels.<id>.accounts.*`, o comportamento compartilhado padrão é mover valores promovidos com escopo de conta para `accounts.default`.

Canais agrupados podem restringir ou substituir essa promoção por meio de sua superfície de contrato de configuração:

- `singleAccountKeysToMove`: chaves adicionais de nível superior que devem ser movidas para a conta promovida
- `namedAccountPromotionKeys`: quando contas nomeadas já existem, apenas essas chaves são movidas para a conta promovida; chaves compartilhadas de política/entrega permanecem na raiz do canal
- `resolveSingleAccountPromotionTarget(...)`: escolher qual conta existente recebe os valores promovidos

<Note>
Matrix é o exemplo agrupado atual. Se exatamente uma conta Matrix nomeada já existir, ou se `defaultAccount` apontar para uma chave não canônica existente, como `Ops`, a promoção preserva essa conta em vez de criar uma nova entrada `accounts.default`.
</Note>

## Esquema de configuração

A configuração do Plugin é validada contra o JSON Schema no seu manifesto. Usuários configuram plugins via:

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

### Criando esquemas de configuração de canal

Use `buildChannelConfigSchema` para converter um esquema Zod no wrapper `ChannelConfigSchema` usado por artefatos de configuração controlados pelo Plugin:

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

Se você já escreve o contrato como JSON Schema ou TypeBox, use o auxiliar direto para que o OpenClaw possa pular a conversão de Zod para JSON Schema em caminhos de metadados:

```typescript
import { Type } from "typebox";
import { buildJsonChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const configSchema = buildJsonChannelConfigSchema(
  Type.Object({
    token: Type.Optional(Type.String()),
    allowFrom: Type.Optional(Type.Array(Type.String())),
  }),
);
```

Para plugins de terceiros, o contrato de caminho frio ainda é o manifesto do Plugin: espelhe o JSON Schema gerado em `openclaw.plugin.json#channelConfigs` para que o esquema de configuração, a configuração e as superfícies de UI possam inspecionar `channels.<id>` sem carregar código de runtime.

## Assistentes de configuração

Plugins de canal podem fornecer assistentes interativos de configuração para `openclaw onboard`. O assistente é um objeto `ChannelSetupWizard` em `ChannelPlugin`:

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

O tipo `ChannelSetupWizard` aceita `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` e mais. Veja pacotes de Plugin agrupados (por exemplo, o Plugin do Discord `src/channel.setup.ts`) para exemplos completos.

<AccordionGroup>
  <Accordion title="Prompts allowFrom compartilhados">
    Para prompts de allowlist de DM que precisam apenas do fluxo padrão `note -> prompt -> parse -> merge -> patch`, prefira os auxiliares de configuração compartilhados de `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` e `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Status padrão de configuração de canal">
    Para blocos de status de configuração de canal que variam apenas por labels, pontuações e linhas extras opcionais, prefira `createStandardChannelSetupStatus(...)` de `openclaw/plugin-sdk/setup` em vez de recriar manualmente o mesmo objeto `status` em cada Plugin.
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

    `plugin-sdk/channel-setup` também expõe os builders de nível mais baixo `createOptionalChannelSetupAdapter(...)` e `createOptionalChannelSetupWizard(...)` quando você precisa apenas de uma metade dessa superfície opcional de instalação.

    O adaptador/assistente opcional gerado falha de modo fechado em gravações reais de configuração. Eles reutilizam uma mensagem de instalação obrigatória em `validateInput`, `applyAccountConfig` e `finalize`, e acrescentam um link de docs quando `docsPath` está definido.

  </Accordion>
  <Accordion title="Auxiliares de configuração baseados em binário">
    Para UIs de configuração baseadas em binário, prefira os auxiliares delegados compartilhados em vez de copiar a mesma ligação de binário/status para cada canal:

    - `createDetectedBinaryStatus(...)` para blocos de status que variam apenas por labels, dicas, pontuações e detecção de binário
    - `createCliPathTextInput(...)` para entradas de texto baseadas em caminho
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` e `createDelegatedResolveConfigured(...)` quando `setupEntry` precisa encaminhar para um assistente completo mais pesado de forma lazy
    - `createDelegatedTextInputShouldPrompt(...)` quando `setupEntry` precisa apenas delegar uma decisão `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Publicação e instalação

**Plugins externos:** publique no [ClawHub](/pt-BR/clawhub), depois instale:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Especificações de pacote simples instalam a partir do npm durante a transição de lançamento.

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

**Plugins no repositório:** coloque sob a árvore de workspace de plugins agrupados e eles serão descobertos automaticamente durante a compilação.

**Usuários podem instalar:**

```bash
openclaw plugins install <package-name>
```

<Info>
Para instalações originadas do npm, `openclaw plugins install` instala o pacote em `~/.openclaw/npm` com scripts de ciclo de vida desabilitados. Mantenha as árvores de dependências dos plugins em JS/TS puro e evite pacotes que exijam compilações de `postinstall`.
</Info>

<Note>
A inicialização do Gateway não instala dependências de plugins. Os fluxos de instalação via npm/git/ClawHub são responsáveis pela convergência de dependências; plugins locais já devem ter suas dependências instaladas.
</Note>

Os metadados de pacotes agrupados são explícitos, não inferidos do JavaScript compilado na inicialização do Gateway. Dependências de runtime pertencem ao pacote do plugin que as possui; a inicialização do OpenClaw empacotado nunca repara nem espelha dependências de plugins.

## Relacionados

- [Criando plugins](/pt-BR/plugins/building-plugins) — guia passo a passo para começar
- [Manifesto do plugin](/pt-BR/plugins/manifest) — referência completa do esquema do manifesto
- [Pontos de entrada do SDK](/pt-BR/plugins/sdk-entrypoints) — `definePluginEntry` e `defineChannelPluginEntry`
