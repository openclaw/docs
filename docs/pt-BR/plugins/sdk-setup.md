---
read_when:
    - Você está adicionando um assistente de configuração a um Plugin
    - Você precisa entender setup-entry.ts vs index.ts
    - Você está definindo esquemas de configuração de Plugin ou metadados openclaw em package.json
sidebarTitle: Setup and config
summary: Assistentes de configuração, setup-entry.ts, esquemas de configuração e metadados de package.json
title: Instalação e configuração do Plugin
x-i18n:
    generated_at: "2026-07-04T15:11:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0969ab2cc069389b8957b07e76591bc76fea7bee22125587fa067122d11bb024
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Referência para empacotamento de Plugins (metadados de `package.json`), manifests (`openclaw.plugin.json`), entradas de configuração e esquemas de configuração.

<Tip>
**Procurando um passo a passo?** Os guias práticos abordam empacotamento em contexto: [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins#step-1-package-and-manifest) e [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadados do pacote

Seu `package.json` precisa de um campo `openclaw` que informa ao sistema de Plugins o que seu Plugin fornece:

<Tabs>
  <Tab title="Channel plugin">
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
  <Tab title="Provider plugin / ClawHub baseline">
    ```json openclaw-clawhub-package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
      "dependencies": {
        "typebox": "1.1.39"
      },
      "peerDependencies": {
        "openclaw": ">=2026.3.24-beta.2"
      },
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
Se você publicar o Plugin externamente no ClawHub, esses campos `compat` e `build` serão obrigatórios. Os snippets canônicos de publicação ficam em `docs/snippets/plugin-publish/`.
</Note>

### Campos de `openclaw`

<ParamField path="extensions" type="string[]">
  Arquivos de ponto de entrada (relativos à raiz do pacote).
</ParamField>
<ParamField path="setupEntry" type="string">
  Entrada leve somente para configuração (opcional).
</ParamField>
<ParamField path="channel" type="object">
  Metadados de catálogo de canal para configuração, seletor, guia rápido e superfícies de status.
</ParamField>
<ParamField path="providers" type="string[]">
  IDs de provedor registrados por este Plugin.
</ParamField>
<ParamField path="install" type="object">
  Dicas de instalação: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Flags de comportamento de inicialização.
</ParamField>

### `openclaw.channel`

`openclaw.channel` são metadados leves de pacote para descoberta de canal e superfícies de configuração antes que o tempo de execução seja carregado.

| Campo                                  | Tipo       | O que significa                                                                 |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------- |
| `id`                                   | `string`   | ID canônico do canal.                                                           |
| `label`                                | `string`   | Rótulo principal do canal.                                                      |
| `selectionLabel`                       | `string`   | Rótulo do seletor/configuração quando deve diferir de `label`.                  |
| `detailLabel`                          | `string`   | Rótulo secundário de detalhe para catálogos de canal e superfícies de status mais ricas. |
| `docsPath`                             | `string`   | Caminho da documentação para links de configuração e seleção.                   |
| `docsLabel`                            | `string`   | Substitui o rótulo usado em links de documentação quando deve diferir do ID do canal. |
| `blurb`                                | `string`   | Descrição curta de integração inicial/catálogo.                                 |
| `order`                                | `number`   | Ordem de classificação em catálogos de canal.                                   |
| `aliases`                              | `string[]` | Aliases extras de consulta para seleção de canal.                               |
| `preferOver`                           | `string[]` | IDs de Plugin/canal de prioridade menor que este canal deve superar.            |
| `systemImage`                          | `string`   | Nome opcional de ícone/imagem do sistema para catálogos de interface de canal.  |
| `selectionDocsPrefix`                  | `string`   | Texto de prefixo antes de links da documentação em superfícies de seleção.      |
| `selectionDocsOmitLabel`               | `boolean`  | Mostra diretamente o caminho da documentação em vez de um link de documentação rotulado no texto de seleção. |
| `selectionExtras`                      | `string[]` | Strings curtas extras anexadas ao texto de seleção.                             |
| `markdownCapable`                      | `boolean`  | Marca o canal como compatível com Markdown para decisões de formatação de saída. |
| `exposure`                             | `object`   | Controles de visibilidade do canal para configuração, listas configuradas e superfícies de documentação. |
| `quickstartAllowFrom`                  | `boolean`  | Inclui este canal no fluxo padrão de configuração `allowFrom` do guia rápido.   |
| `forceAccountBinding`                  | `boolean`  | Exige vinculação explícita de conta mesmo quando existe apenas uma conta.       |
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

`exposure` aceita:

- `configured`: inclui o canal em superfícies de listagem configuradas/estilo status
- `setup`: inclui o canal em seletores interativos de configuração
- `docs`: marca o canal como público em superfícies de documentação/navegação

<Note>
`showConfigured` e `showInSetup` continuam sendo compatíveis como aliases legados. Prefira `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` são metadados de pacote, não metadados de manifest.

| Campo                        | Tipo                                | O que significa                                                                     |
| ---------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Especificação canônica do ClawHub para fluxos de instalação/atualização e instalação sob demanda na integração inicial. |
| `npmSpec`                    | `string`                            | Especificação npm canônica para fluxos de fallback de instalação/atualização.        |
| `localPath`                  | `string`                            | Caminho de desenvolvimento local ou instalação empacotada.                          |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Fonte de instalação preferida quando várias fontes estão disponíveis.               |
| `minHostVersion`             | `string`                            | Versão mínima compatível do OpenClaw no formato `>=x.y.z` ou `>=x.y.z-prerelease`.  |
| `expectedIntegrity`          | `string`                            | String de integridade esperada do dist npm, geralmente `sha512-...`, para instalações fixadas. |
| `allowInvalidConfigRecovery` | `boolean`                           | Permite que fluxos de reinstalação de Plugins empacotados recuperem falhas específicas de configuração obsoleta. |
| `requiredPlatformPackages`   | `string[]`                          | Aliases npm específicos da plataforma obrigatórios verificados durante a instalação npm. |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    A integração inicial interativa também usa `openclaw.install` para superfícies de instalação sob demanda. Se seu Plugin expõe opções de autenticação de provedor ou metadados de configuração/catálogo de canal antes que o tempo de execução carregue, a integração inicial pode mostrar essa opção, solicitar instalação via ClawHub, npm ou local, instalar ou habilitar o Plugin e então continuar o fluxo selecionado. As opções de integração inicial do ClawHub usam `clawhubSpec` e são preferidas quando presentes; opções npm exigem metadados de catálogo confiáveis com um `npmSpec` de registro; versões exatas e `expectedIntegrity` são pins npm opcionais. Se `expectedIntegrity` estiver presente, os fluxos de instalação/atualização o impõem para npm. Mantenha os metadados de "o que mostrar" em `openclaw.plugin.json` e os metadados de "como instalar" em `package.json`.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    Se `minHostVersion` estiver definido, tanto a instalação quanto o carregamento de registro de manifests não empacotados o impõem. Hosts mais antigos ignoram Plugins externos; strings de versão inválidas são rejeitadas. Presume-se que Plugins de código-fonte empacotados sejam coversionados com o checkout do host.
  </Accordion>
  <Accordion title="Pinned npm installs">
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
  <Accordion title="allowInvalidConfigRecovery scope">
    `allowInvalidConfigRecovery` não é um bypass geral para configurações quebradas. Ele serve apenas para recuperação estreita de Plugins empacotados, para que reinstalação/configuração possa reparar sobras conhecidas de atualização, como um caminho ausente de Plugin empacotado ou uma entrada obsoleta `channels.<id>` para esse mesmo Plugin. Se a configuração estiver quebrada por motivos não relacionados, a instalação ainda falhará fechada e instruirá o operador a executar `openclaw doctor --fix`.
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

Quando habilitado, o OpenClaw carrega apenas `setupEntry` durante a fase de inicialização antes de escutar, mesmo para canais já configurados. A entrada completa carrega depois que o Gateway começa a escutar.

<Warning>
Habilite o carregamento adiado apenas quando seu `setupEntry` registrar tudo de que o Gateway precisa antes de começar a escutar (registro de canal, rotas HTTP, métodos do Gateway). Se a entrada completa possuir capacidades obrigatórias de inicialização, mantenha o comportamento padrão.
</Warning>

Se sua entrada de configuração/completa registra métodos RPC do Gateway, mantenha-os em um prefixo específico do Plugin. Namespaces reservados de administração do core (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) permanecem de propriedade do core e sempre resolvem para `operator.admin`.

## Manifest do Plugin

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

Mesmo plugins sem configuração precisam enviar um schema. Um schema vazio é válido:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Consulte [manifesto do Plugin](/pt-BR/plugins/manifest) para a referência completa do schema.

## Publicação no ClawHub

Para pacotes de plugin, use o comando do ClawHub específico do pacote:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
O alias legado de publicação somente de skill é para skills. Pacotes de Plugin devem sempre usar `clawhub package publish`.
</Note>

## Entrada de setup

O arquivo `setup-entry.ts` é uma alternativa leve ao `index.ts` que o OpenClaw carrega quando precisa apenas de superfícies de setup (onboarding, reparo de configuração, inspeção de canal desabilitado).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Isso evita carregar código pesado de runtime (bibliotecas de criptografia, registros de CLI, serviços em segundo plano) durante fluxos de setup.

Canais agrupados do workspace que mantêm exports seguros para setup em módulos auxiliares podem usar `defineBundledChannelSetupEntry(...)` de `openclaw/plugin-sdk/channel-entry-contract` em vez de `defineSetupPluginEntry(...)`. Esse contrato agrupado também oferece suporte a um export opcional `runtime`, para que a fiação de runtime em tempo de setup permaneça leve e explícita.

<AccordionGroup>
  <Accordion title="Quando o OpenClaw usa setupEntry em vez da entrada completa">
    - O canal está desabilitado, mas precisa de superfícies de setup/onboarding.
    - O canal está habilitado, mas não configurado.
    - O carregamento adiado está habilitado (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="O que setupEntry deve registrar">
    - O objeto do plugin de canal (via `defineSetupPluginEntry`).
    - Quaisquer rotas HTTP necessárias antes do gateway escutar.
    - Quaisquer métodos de Gateway necessários durante a inicialização.

    Esses métodos de Gateway de inicialização ainda devem evitar namespaces reservados de administração do core, como `config.*` ou `update.*`.

  </Accordion>
  <Accordion title="O que setupEntry NÃO deve incluir">
    - Registros de CLI.
    - Serviços em segundo plano.
    - Imports pesados de runtime (criptografia, SDKs).
    - Métodos de Gateway necessários somente após a inicialização.

  </Accordion>
</AccordionGroup>

### Imports estreitos de helpers de setup

Para caminhos quentes somente de setup, prefira as interfaces estreitas de helpers de setup em vez do guarda-chuva mais amplo `plugin-sdk/setup` quando você só precisar de parte da superfície de setup:

| Caminho de import                    | Use para                                                                                  | Exports principais                                                                                                                                                                                                                                                                                                    |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helpers de runtime em tempo de setup que continuam disponíveis em `setupEntry` / inicialização adiada de canal | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | alias de compatibilidade obsoleto; use `plugin-sdk/setup-runtime`                            | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | helpers de CLI/arquivamento/docs para setup/instalação                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

Use a interface mais ampla `plugin-sdk/setup` quando quiser a caixa de ferramentas compartilhada completa de setup, incluindo helpers de patch de configuração como `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Use `createSetupTranslator(...)` para textos fixos do assistente de setup. Ele segue o
locale do assistente da CLI (`OPENCLAW_LOCALE`, depois variáveis de locale do sistema) e recua
para inglês. Mantenha texto de setup específico do plugin no código pertencente ao plugin e use
chaves de catálogo compartilhadas apenas para rótulos comuns de setup, texto de status e textos de setup de
plugins agrupados oficiais.

Os adaptadores de patch de setup permanecem seguros para caminho quente no import. A consulta de superfície de contrato de promoção de conta única agrupada deles é preguiçosa, então importar `plugin-sdk/setup-runtime` não carrega avidamente a descoberta de superfície de contrato agrupada antes de o adaptador ser realmente usado.

### Promoção de conta única pertencente ao canal

Quando um canal faz upgrade de uma configuração de nível superior de conta única para `channels.<id>.accounts.*`, o comportamento compartilhado padrão é mover valores promovidos com escopo de conta para `accounts.default`.

Canais agrupados podem restringir ou sobrescrever essa promoção por meio da superfície de contrato de setup deles:

- `singleAccountKeysToMove`: chaves extras de nível superior que devem ser movidas para a conta promovida
- `namedAccountPromotionKeys`: quando contas nomeadas já existem, somente estas chaves se movem para a conta promovida; chaves compartilhadas de política/entrega permanecem na raiz do canal
- `resolveSingleAccountPromotionTarget(...)`: escolhe qual conta existente recebe os valores promovidos

<Note>
Matrix é o exemplo agrupado atual. Se exatamente uma conta Matrix nomeada já existir, ou se `defaultAccount` apontar para uma chave não canônica existente, como `Ops`, a promoção preserva essa conta em vez de criar uma nova entrada `accounts.default`.
</Note>

## Schema de configuração

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

Use `buildChannelConfigSchema` para converter um schema Zod no wrapper `ChannelConfigSchema` usado por artefatos de configuração pertencentes ao plugin:

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

Para plugins de terceiros, o contrato de caminho frio ainda é o manifesto do plugin: espelhe o JSON Schema gerado em `openclaw.plugin.json#channelConfigs` para que schema de configuração, setup e superfícies de UI possam inspecionar `channels.<id>` sem carregar código de runtime.

## Assistentes de setup

Plugins de canal podem fornecer assistentes interativos de setup para `openclaw onboard`. O assistente é um objeto `ChannelSetupWizard` no `ChannelPlugin`:

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

O tipo `ChannelSetupWizard` oferece suporte a `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` e mais. Consulte pacotes de plugins agrupados (por exemplo, o plugin Discord `src/channel.setup.ts`) para exemplos completos.

<AccordionGroup>
  <Accordion title="Prompts allowFrom compartilhados">
    Para prompts de lista de permissões de DM que só precisam do fluxo padrão `note -> prompt -> parse -> merge -> patch`, prefira os helpers de setup compartilhados de `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` e `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Status padrão de setup de canal">
    Para blocos de status de setup de canal que variam apenas por rótulos, pontuações e linhas extras opcionais, prefira `createStandardChannelSetupStatus(...)` de `openclaw/plugin-sdk/setup` em vez de criar manualmente o mesmo objeto `status` em cada plugin.
  </Accordion>
  <Accordion title="Superfície opcional de setup de canal">
    Para superfícies opcionais de setup que só devem aparecer em certos contextos, use `createOptionalChannelSetupSurface` de `openclaw/plugin-sdk/channel-setup`:

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

    `plugin-sdk/channel-setup` também expõe os construtores de nível mais baixo `createOptionalChannelSetupAdapter(...)` e `createOptionalChannelSetupWizard(...)` quando você precisa apenas de uma metade dessa superfície de instalação opcional.

    O adaptador/assistente opcional gerado falha fechado em gravações reais de configuração. Eles reutilizam uma mensagem única de instalação necessária em `validateInput`, `applyAccountConfig` e `finalize`, e acrescentam um link de docs quando `docsPath` está definido.

  </Accordion>
  <Accordion title="Helpers de setup baseados em binário">
    Para UIs de setup baseadas em binário, prefira os helpers delegados compartilhados em vez de copiar a mesma cola de binário/status para cada canal:

    - `createDetectedBinaryStatus(...)` para blocos de status que variam apenas por rótulos, dicas, pontuações e detecção binária
    - `createCliPathTextInput(...)` para entradas de texto baseadas em caminho
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` e `createDelegatedResolveConfigured(...)` quando `setupEntry` precisa encaminhar para um assistente completo mais pesado de forma preguiçosa
    - `createDelegatedTextInputShouldPrompt(...)` quando `setupEntry` só precisa delegar uma decisão de `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Publicação e instalação

**Plugins externos:** publique no [ClawHub](/clawhub) e depois instale:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Especificações de pacote sem prefixo são instaladas pelo npm durante a transição de lançamento.

  </Tab>
  <Tab title="Somente ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Especificação de pacote npm">
    Use npm quando um pacote ainda não tiver sido movido para o ClawHub, ou quando você precisar de um
    caminho direto de instalação via npm durante a migração:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugins no repositório:** coloque sob a árvore de workspace de plugins empacotados, e eles serão descobertos automaticamente durante o build.

**Usuários podem instalar:**

```bash
openclaw plugins install <package-name>
```

<Info>
Para instalações originadas do npm, `openclaw plugins install` instala o pacote em um projeto por plugin sob `~/.openclaw/npm/projects` com scripts de ciclo de vida desabilitados. Mantenha as árvores de dependências de plugins puramente JS/TS e evite pacotes que exigem builds de `postinstall`.
</Info>

<Note>
A inicialização do Gateway não instala dependências de plugins. Os fluxos de instalação via npm/git/ClawHub são responsáveis pela convergência de dependências; plugins locais já precisam ter suas dependências instaladas.
</Note>

Os metadados de pacotes empacotados são explícitos, não inferidos a partir do JavaScript compilado na inicialização do gateway. Dependências de runtime pertencem ao pacote do plugin que as possui; a inicialização do OpenClaw empacotado nunca repara nem espelha dependências de plugins.

## Relacionados

- [Criando plugins](/pt-BR/plugins/building-plugins) — guia passo a passo para começar
- [Manifesto do Plugin](/pt-BR/plugins/manifest) — referência completa do esquema do manifesto
- [Pontos de entrada do SDK](/pt-BR/plugins/sdk-entrypoints) — `definePluginEntry` e `defineChannelPluginEntry`
