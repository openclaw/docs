---
read_when:
    - Você está adicionando um assistente de configuração a um Plugin
    - Você precisa entender setup-entry.ts em comparação com index.ts
    - Você está definindo esquemas de configuração de Plugin ou metadados openclaw em package.json
sidebarTitle: Setup and config
summary: Assistentes de configuração, setup-entry.ts, esquemas de configuração e metadados de package.json
title: Instalação e configuração do Plugin
x-i18n:
    generated_at: "2026-05-02T21:03:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a89e113952b1809bc19b0535d0895b1f0e13ee7c57446a9f27817c03a8e6000
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Referência para empacotamento de plugins (metadados de `package.json`), manifestos (`openclaw.plugin.json`), entradas de configuração e esquemas de configuração.

<Tip>
**Procurando um passo a passo?** Os guias práticos abordam o empacotamento em contexto: [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins#step-1-package-and-manifest) e [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins#step-1-package-and-manifest).
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
  Entrada leve somente para configuração (opcional).
</ParamField>
<ParamField path="channel" type="object">
  Metadados de catálogo de canal para superfícies de configuração, seletor, início rápido e status.
</ParamField>
<ParamField path="providers" type="string[]">
  IDs de provedor registrados por este plugin.
</ParamField>
<ParamField path="install" type="object">
  Dicas de instalação: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Flags de comportamento de inicialização.
</ParamField>

### `openclaw.channel`

`openclaw.channel` são metadados leves de pacote para descoberta de canais e superfícies de configuração antes do runtime carregar.

| Campo                                  | Tipo       | O que significa                                                               |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | ID canônico do canal.                                                         |
| `label`                                | `string`   | Rótulo principal do canal.                                                    |
| `selectionLabel`                       | `string`   | Rótulo do seletor/configuração quando deve diferir de `label`.                |
| `detailLabel`                          | `string`   | Rótulo de detalhe secundário para catálogos de canal e superfícies de status mais ricos. |
| `docsPath`                             | `string`   | Caminho da documentação para links de configuração e seleção.                 |
| `docsLabel`                            | `string`   | Rótulo de substituição usado para links de documentação quando deve diferir do ID do canal. |
| `blurb`                                | `string`   | Descrição curta de onboarding/catálogo.                                       |
| `order`                                | `number`   | Ordem de classificação em catálogos de canal.                                 |
| `aliases`                              | `string[]` | Aliases extras de consulta para seleção de canal.                             |
| `preferOver`                           | `string[]` | IDs de plugin/canal de prioridade mais baixa que este canal deve superar.     |
| `systemImage`                          | `string`   | Nome opcional de ícone/imagem do sistema para catálogos de UI de canal.       |
| `selectionDocsPrefix`                  | `string`   | Texto de prefixo antes de links de documentação em superfícies de seleção.    |
| `selectionDocsOmitLabel`               | `boolean`  | Mostra o caminho da documentação diretamente em vez de um link de documentação rotulado no texto de seleção. |
| `selectionExtras`                      | `string[]` | Strings curtas extras anexadas ao texto de seleção.                           |
| `markdownCapable`                      | `boolean`  | Marca o canal como compatível com markdown para decisões de formatação de saída. |
| `exposure`                             | `object`   | Controles de visibilidade do canal para configuração, listas configuradas e superfícies de documentação. |
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

`exposure` oferece suporte a:

- `configured`: inclui o canal em superfícies de listagem configuradas/estilo status
- `setup`: inclui o canal em seletores interativos de setup/configuração
- `docs`: marca o canal como voltado ao público em superfícies de documentação/navegação

<Note>
`showConfigured` e `showInSetup` continuam com suporte como aliases legados. Prefira `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` são metadados de pacote, não metadados de manifesto.

| Campo                        | Tipo                                | O que significa                                                                 |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Especificação canônica do ClawHub para fluxos de instalação/atualização e instalação sob demanda no onboarding. |
| `npmSpec`                    | `string`                            | Especificação npm canônica para fluxos de fallback de instalação/atualização.      |
| `localPath`                  | `string`                            | Caminho local de desenvolvimento ou instalação empacotada.                        |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Fonte de instalação preferida quando várias fontes estão disponíveis.             |
| `minHostVersion`             | `string`                            | Versão mínima compatível do OpenClaw no formato `>=x.y.z` ou `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | String de integridade esperada do dist do npm, geralmente `sha512-...`, para instalações fixadas. |
| `allowInvalidConfigRecovery` | `boolean`                           | Permite que fluxos de reinstalação de plugin empacotado se recuperem de falhas específicas de configuração obsoleta. |

<AccordionGroup>
  <Accordion title="Comportamento de onboarding">
    O onboarding interativo também usa `openclaw.install` para superfícies de instalação sob demanda. Se seu plugin expõe opções de autenticação de provedor ou metadados de configuração/catálogo de canal antes do runtime carregar, o onboarding pode mostrar essa opção, solicitar instalação via ClawHub, npm ou local, instalar ou habilitar o plugin e então continuar o fluxo selecionado. As opções de onboarding do ClawHub usam `clawhubSpec` e são preferidas quando presentes; opções npm exigem metadados de catálogo confiáveis com um `npmSpec` de registro; versões exatas e `expectedIntegrity` são pins npm opcionais. Se `expectedIntegrity` estiver presente, fluxos de instalação/atualização o aplicam para npm. Mantenha os metadados de "o que mostrar" em `openclaw.plugin.json` e os metadados de "como instalar" em `package.json`.
  </Accordion>
  <Accordion title="Aplicação de minHostVersion">
    Se `minHostVersion` estiver definido, tanto a instalação quanto o carregamento do registro de manifestos não empacotados o aplicam. Hosts mais antigos pulam plugins externos; strings de versão inválidas são rejeitadas. Plugins de código-fonte empacotados são considerados coversionados com o checkout do host.
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
    `allowInvalidConfigRecovery` não é um bypass geral para configurações quebradas. Ele serve apenas para recuperação restrita de plugins empacotados, para que reinstalação/setup possa reparar sobras conhecidas de atualização, como um caminho ausente de plugin empacotado ou uma entrada obsoleta `channels.<id>` para esse mesmo plugin. Se a configuração estiver quebrada por motivos não relacionados, a instalação ainda falha de forma fechada e instrui o operador a executar `openclaw doctor --fix`.
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

Quando habilitado, o OpenClaw carrega apenas `setupEntry` durante a fase de inicialização pré-listen, mesmo para canais já configurados. A entrada completa carrega depois que o gateway começa a escutar.

<Warning>
Habilite o carregamento adiado somente quando seu `setupEntry` registra tudo de que o gateway precisa antes de começar a escutar (registro de canal, rotas HTTP, métodos de gateway). Se a entrada completa possui capacidades de inicialização obrigatórias, mantenha o comportamento padrão.
</Warning>

Se sua entrada de setup/completa registra métodos RPC de gateway, mantenha-os em um prefixo específico do plugin. Namespaces administrativos centrais reservados (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) continuam pertencendo ao core e sempre resolvem para `operator.admin`.

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

Consulte [Manifesto de plugin](/pt-BR/plugins/manifest) para a referência completa do schema.

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

O arquivo `setup-entry.ts` é uma alternativa leve ao `index.ts` que o OpenClaw carrega quando precisa apenas de superfícies de configuração (integração, reparo de configuração, inspeção de canal desabilitado).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Isso evita carregar código pesado de runtime (bibliotecas de criptografia, registros de CLI, serviços em segundo plano) durante fluxos de configuração.

Canais do workspace incluídos que mantêm exportações seguras para configuração em módulos auxiliares podem usar `defineBundledChannelSetupEntry(...)` de `openclaw/plugin-sdk/channel-entry-contract` em vez de `defineSetupPluginEntry(...)`. Esse contrato incluído também oferece suporte a uma exportação `runtime` opcional para que a ligação de runtime no momento da configuração permaneça leve e explícita.

<AccordionGroup>
  <Accordion title="When OpenClaw uses setupEntry instead of the full entry">
    - O canal está desabilitado, mas precisa de superfícies de configuração/integração.
    - O canal está habilitado, mas não configurado.
    - O carregamento adiado está habilitado (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="What setupEntry must register">
    - O objeto de Plugin do canal (via `defineSetupPluginEntry`).
    - Quaisquer rotas HTTP necessárias antes de o gateway começar a escutar.
    - Quaisquer métodos de gateway necessários durante a inicialização.

    Esses métodos de gateway de inicialização ainda devem evitar namespaces reservados de administração do núcleo, como `config.*` ou `update.*`.

  </Accordion>
  <Accordion title="What setupEntry should NOT include">
    - Registros de CLI.
    - Serviços em segundo plano.
    - Importações pesadas de runtime (criptografia, SDKs).
    - Métodos de Gateway necessários apenas após a inicialização.

  </Accordion>
</AccordionGroup>

### Importações restritas de helpers de configuração

Para caminhos de configuração rápida, somente de configuração, prefira os seams restritos de helpers de configuração ao guarda-chuva mais amplo `plugin-sdk/setup` quando precisar apenas de parte da superfície de configuração:

| Caminho de importação              | Use para                                                                                  | Principais exportações                                                                                                                                                                                                                                                                       |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helpers de runtime em tempo de configuração que permanecem disponíveis em `setupEntry` / inicialização adiada de canal | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adaptadores de configuração de conta sensíveis ao ambiente                                | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | helpers de CLI/arquivo/docs para configuração/instalação                                  | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Use o seam mais amplo `plugin-sdk/setup` quando quiser o conjunto completo de ferramentas compartilhadas de configuração, incluindo helpers de patch de configuração como `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Os adaptadores de patch de configuração permanecem seguros para hot-path na importação. A consulta incluída de superfície de contrato de promoção de conta única é lazy, portanto importar `plugin-sdk/setup-runtime` não carrega antecipadamente a descoberta de superfície de contrato incluída antes que o adaptador seja realmente usado.

### Promoção de conta única controlada pelo canal

Quando um canal é atualizado de uma configuração de nível superior de conta única para `channels.<id>.accounts.*`, o comportamento compartilhado padrão é mover valores promovidos com escopo de conta para `accounts.default`.

Canais incluídos podem restringir ou substituir essa promoção por meio da superfície de contrato de configuração:

- `singleAccountKeysToMove`: chaves extras de nível superior que devem ser movidas para a conta promovida
- `namedAccountPromotionKeys`: quando contas nomeadas já existem, apenas essas chaves são movidas para a conta promovida; chaves compartilhadas de política/entrega permanecem na raiz do canal
- `resolveSingleAccountPromotionTarget(...)`: escolhe qual conta existente recebe os valores promovidos

<Note>
Matrix é o exemplo incluído atual. Se exatamente uma conta Matrix nomeada já existir, ou se `defaultAccount` apontar para uma chave não canônica existente, como `Ops`, a promoção preserva essa conta em vez de criar uma nova entrada `accounts.default`.
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

Se você já cria o contrato como JSON Schema ou TypeBox, use o helper direto para que o OpenClaw possa pular a conversão de Zod para JSON Schema em caminhos de metadados:

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

Para plugins de terceiros, o contrato de cold-path ainda é o manifesto do Plugin: espelhe o JSON Schema gerado em `openclaw.plugin.json#channelConfigs` para que o esquema de configuração, a configuração e as superfícies de UI possam inspecionar `channels.<id>` sem carregar código de runtime.

## Assistentes de configuração

Plugins de canal podem fornecer assistentes de configuração interativos para `openclaw onboard`. O assistente é um objeto `ChannelSetupWizard` no `ChannelPlugin`:

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

O tipo `ChannelSetupWizard` oferece suporte a `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` e mais. Veja os pacotes de Plugin incluídos (por exemplo, o Plugin do Discord `src/channel.setup.ts`) para exemplos completos.

<AccordionGroup>
  <Accordion title="Shared allowFrom prompts">
    Para prompts de lista de permissões de DM que precisam apenas do fluxo padrão `note -> prompt -> parse -> merge -> patch`, prefira os helpers de configuração compartilhados de `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` e `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standard channel setup status">
    Para blocos de status de configuração de canal que variam apenas por rótulos, pontuações e linhas extras opcionais, prefira `createStandardChannelSetupStatus(...)` de `openclaw/plugin-sdk/setup` em vez de criar manualmente o mesmo objeto `status` em cada Plugin.
  </Accordion>
  <Accordion title="Optional channel setup surface">
    Para superfícies de configuração opcionais que devem aparecer apenas em certos contextos, use `createOptionalChannelSetupSurface` de `openclaw/plugin-sdk/channel-setup`:

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

    O adaptador/assistente opcional gerado falha fechado em gravações reais de configuração. Eles reutilizam uma mensagem de instalação obrigatória em `validateInput`, `applyAccountConfig` e `finalize`, e acrescentam um link de documentação quando `docsPath` está definido.

  </Accordion>
  <Accordion title="Binary-backed setup helpers">
    Para UIs de configuração apoiadas por binário, prefira os helpers delegados compartilhados em vez de copiar a mesma cola de binário/status em cada canal:

    - `createDetectedBinaryStatus(...)` para blocos de status que variam apenas por rótulos, dicas, pontuações e detecção de binário
    - `createCliPathTextInput(...)` para entradas de texto apoiadas por caminho
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` e `createDelegatedResolveConfigured(...)` quando `setupEntry` precisa encaminhar lazy para um assistente completo mais pesado
    - `createDelegatedTextInputShouldPrompt(...)` quando `setupEntry` só precisa delegar uma decisão `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Publicação e instalação

**Plugins externos:** publique no [ClawHub](/pt-BR/tools/clawhub) e então instale:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Especificações de pacote simples instalam a partir do npm durante a transição de lançamento.

  </Tab>
  <Tab title="ClawHub only">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm package spec">
    Use npm quando um pacote ainda não tiver migrado para o ClawHub, ou quando você precisar de um
    caminho direto de instalação npm durante a migração:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugins no repositório:** coloque-os sob a árvore de áreas de trabalho de Plugins integrados e eles serão descobertos automaticamente durante a compilação.

**Usuários podem instalar:**

```bash
openclaw plugins install <package-name>
```

<Info>
Para instalações originadas do npm, `openclaw plugins install` instala o pacote em `~/.openclaw/npm` com scripts de ciclo de vida desativados. Mantenha as árvores de dependências dos Plugins em JS/TS puro e evite pacotes que exigem compilações de `postinstall`.
</Info>

<Note>
A inicialização do Gateway não instala dependências de Plugins. Os fluxos de instalação via npm/git/ClawHub são responsáveis pela convergência de dependências; Plugins locais já devem ter suas dependências instaladas.
</Note>

Os metadados de pacotes integrados são explícitos, não inferidos do JavaScript compilado na inicialização do gateway. Dependências de runtime pertencem ao pacote de Plugin que as possui; a inicialização do OpenClaw empacotado nunca repara nem espelha dependências de Plugins.

## Relacionado

- [Criando Plugins](/pt-BR/plugins/building-plugins) — guia passo a passo para começar
- [Manifesto de Plugin](/pt-BR/plugins/manifest) — referência completa do esquema do manifesto
- [Pontos de entrada do SDK](/pt-BR/plugins/sdk-entrypoints) — `definePluginEntry` e `defineChannelPluginEntry`
