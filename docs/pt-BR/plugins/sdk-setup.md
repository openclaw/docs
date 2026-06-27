---
read_when:
    - Você está adicionando um assistente de configuração a um plugin
    - Você precisa entender setup-entry.ts versus index.ts
    - Você está definindo esquemas de configuração de Plugin ou metadados openclaw de package.json
sidebarTitle: Setup and config
summary: Assistentes de configuração, setup-entry.ts, esquemas de configuração e metadados de package.json
title: Configuração e setup do Plugin
x-i18n:
    generated_at: "2026-06-27T17:58:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a6ca729c40270e9280fb61d8891e53b1c351c0afcc9f894c515be06b02fece95
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Referência para empacotamento de plugins (metadados de `package.json`), manifestos (`openclaw.plugin.json`), entradas de configuração inicial e esquemas de configuração.

<Tip>
**Procurando um passo a passo?** Os guias práticos cobrem empacotamento em contexto: [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins#step-1-package-and-manifest) e [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadados do pacote

Seu `package.json` precisa de um campo `openclaw` que informe ao sistema de plugins o que seu plugin fornece:

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
Se você publicar o plugin externamente no ClawHub, esses campos `compat` e `build` serão obrigatórios. Os snippets de publicação canônicos ficam em `docs/snippets/plugin-publish/`.
</Note>

### Campos de `openclaw`

<ParamField path="extensions" type="string[]">
  Arquivos de ponto de entrada (relativos à raiz do pacote).
</ParamField>
<ParamField path="setupEntry" type="string">
  Entrada leve somente de configuração inicial (opcional).
</ParamField>
<ParamField path="channel" type="object">
  Metadados de catálogo do canal para configuração inicial, seletor, início rápido e superfícies de status.
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

`openclaw.channel` são metadados leves de pacote para descoberta de canais e superfícies de configuração inicial antes do carregamento do runtime.

| Campo                                  | Tipo       | O que significa                                                                 |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------- |
| `id`                                   | `string`   | ID canônico do canal.                                                           |
| `label`                                | `string`   | Rótulo principal do canal.                                                      |
| `selectionLabel`                       | `string`   | Rótulo do seletor/configuração inicial quando deve diferir de `label`.          |
| `detailLabel`                          | `string`   | Rótulo de detalhe secundário para catálogos de canais mais ricos e superfícies de status. |
| `docsPath`                             | `string`   | Caminho da documentação para links de configuração inicial e seleção.           |
| `docsLabel`                            | `string`   | Substitui o rótulo usado em links de documentação quando deve diferir do ID do canal. |
| `blurb`                                | `string`   | Descrição curta de onboarding/catálogo.                                         |
| `order`                                | `number`   | Ordem de classificação em catálogos de canais.                                  |
| `aliases`                              | `string[]` | Aliases extras de pesquisa para seleção de canais.                              |
| `preferOver`                           | `string[]` | IDs de plugins/canais de menor prioridade que este canal deve superar.          |
| `systemImage`                          | `string`   | Nome opcional de ícone/imagem do sistema para catálogos de UI de canais.        |
| `selectionDocsPrefix`                  | `string`   | Texto de prefixo antes dos links de documentação em superfícies de seleção.     |
| `selectionDocsOmitLabel`               | `boolean`  | Mostra o caminho da documentação diretamente em vez de um link de documentação rotulado no texto de seleção. |
| `selectionExtras`                      | `string[]` | Strings curtas extras anexadas ao texto de seleção.                             |
| `markdownCapable`                      | `boolean`  | Marca o canal como compatível com markdown para decisões de formatação de saída. |
| `exposure`                             | `object`   | Controles de visibilidade do canal para configuração inicial, listas configuradas e superfícies de documentação. |
| `quickstartAllowFrom`                  | `boolean`  | Inclui este canal no fluxo padrão de configuração inicial `allowFrom` do início rápido. |
| `forceAccountBinding`                  | `boolean`  | Exige vinculação explícita de conta mesmo quando existe apenas uma conta.       |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Prefere pesquisa de sessão ao resolver destinos de anúncio para este canal.     |

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
- `setup`: inclui o canal em seletores interativos de configuração inicial/configuração
- `docs`: marca o canal como voltado ao público em superfícies de documentação/navegação

<Note>
`showConfigured` e `showInSetup` continuam compatíveis como aliases legados. Prefira `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` são metadados de pacote, não metadados de manifesto.

| Campo                        | Tipo                                | O que significa                                                                     |
| ---------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Especificação canônica do ClawHub para fluxos de instalação/atualização e instalação sob demanda no onboarding. |
| `npmSpec`                    | `string`                            | Especificação npm canônica para fluxos de fallback de instalação/atualização.       |
| `localPath`                  | `string`                            | Caminho de desenvolvimento local ou instalação empacotada.                         |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Fonte de instalação preferida quando há várias fontes disponíveis.                 |
| `minHostVersion`             | `string`                            | Versão mínima compatível do OpenClaw no formato `>=x.y.z` ou `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | String de integridade esperada da distribuição npm, geralmente `sha512-...`, para instalações fixadas. |
| `allowInvalidConfigRecovery` | `boolean`                           | Permite que fluxos de reinstalação de plugins empacotados se recuperem de falhas específicas de configuração obsoleta. |
| `requiredPlatformPackages`   | `string[]`                          | Aliases npm específicos de plataforma obrigatórios verificados durante a instalação npm. |

<AccordionGroup>
  <Accordion title="Comportamento de onboarding">
    O onboarding interativo também usa `openclaw.install` para superfícies de instalação sob demanda. Se seu plugin expõe opções de autenticação de provedor ou metadados de configuração inicial/catálogo de canal antes do carregamento do runtime, o onboarding pode mostrar essa opção, solicitar instalação via ClawHub, npm ou local, instalar ou habilitar o plugin e então continuar o fluxo selecionado. As opções de onboarding do ClawHub usam `clawhubSpec` e são preferidas quando presentes; opções npm exigem metadados de catálogo confiáveis com um `npmSpec` de registro; versões exatas e `expectedIntegrity` são pins npm opcionais. Se `expectedIntegrity` estiver presente, os fluxos de instalação/atualização o aplicam para npm. Mantenha os metadados de "o que mostrar" em `openclaw.plugin.json` e os metadados de "como instalar" em `package.json`.
  </Accordion>
  <Accordion title="Aplicação de minHostVersion">
    Se `minHostVersion` estiver definido, tanto a instalação quanto o carregamento não empacotado do registro de manifestos o aplicam. Hosts mais antigos ignoram plugins externos; strings de versão inválidas são rejeitadas. Presume-se que plugins de código-fonte empacotados tenham a mesma versão do checkout do host.
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
    `allowInvalidConfigRecovery` não é um bypass geral para configurações quebradas. Ele serve apenas para recuperação restrita de plugins empacotados, para que a reinstalação/configuração inicial possa reparar sobras conhecidas de atualização, como um caminho de plugin empacotado ausente ou uma entrada `channels.<id>` obsoleta para esse mesmo plugin. Se a configuração estiver quebrada por motivos não relacionados, a instalação ainda falhará de forma fechada e instruirá o operador a executar `openclaw doctor --fix`.
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

Quando habilitado, o OpenClaw carrega apenas `setupEntry` durante a fase de inicialização anterior à escuta, mesmo para canais já configurados. A entrada completa é carregada depois que o Gateway começa a escutar.

<Warning>
Habilite o carregamento adiado somente quando seu `setupEntry` registrar tudo de que o Gateway precisa antes de começar a escutar (registro de canal, rotas HTTP, métodos do Gateway). Se a entrada completa possuir capacidades de inicialização obrigatórias, mantenha o comportamento padrão.
</Warning>

Se sua entrada de configuração inicial/completa registrar métodos RPC do Gateway, mantenha-os em um prefixo específico do plugin. Namespaces administrativos centrais reservados (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) continuam pertencendo ao core e sempre resolvem para `operator.admin`.

## Manifesto do plugin

Todo plugin nativo deve incluir um `openclaw.plugin.json` na raiz do pacote. O OpenClaw usa isso para validar a configuração sem executar o código do plugin.

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

Consulte [manifesto do Plugin](/pt-BR/plugins/manifest) para a referência completa do esquema.

## Publicação no ClawHub

Para pacotes de Plugin, use o comando do ClawHub específico do pacote:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
O alias legado de publicação exclusivo para Skills é para Skills. Pacotes de Plugin devem sempre usar `clawhub package publish`.
</Note>

## Entrada de configuração

O arquivo `setup-entry.ts` é uma alternativa leve ao `index.ts` que o OpenClaw carrega quando precisa apenas de superfícies de configuração (onboarding, reparo de configuração, inspeção de canal desabilitado).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Isso evita carregar código pesado de runtime (bibliotecas de criptografia, registros de CLI, serviços em segundo plano) durante fluxos de configuração.

Canais do workspace agrupados que mantêm exports seguros para configuração em módulos auxiliares podem usar `defineBundledChannelSetupEntry(...)` de `openclaw/plugin-sdk/channel-entry-contract` em vez de `defineSetupPluginEntry(...)`. Esse contrato agrupado também oferece suporte a um export opcional `runtime`, para que a fiação de runtime no momento da configuração possa permanecer leve e explícita.

<AccordionGroup>
  <Accordion title="Quando o OpenClaw usa setupEntry em vez da entrada completa">
    - O canal está desabilitado, mas precisa de superfícies de configuração/onboarding.
    - O canal está habilitado, mas não configurado.
    - O carregamento adiado está habilitado (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="O que setupEntry deve registrar">
    - O objeto do Plugin de canal (via `defineSetupPluginEntry`).
    - Quaisquer rotas HTTP necessárias antes de o gateway escutar.
    - Quaisquer métodos de gateway necessários durante a inicialização.

    Esses métodos de gateway de inicialização ainda devem evitar namespaces administrativos centrais reservados, como `config.*` ou `update.*`.

  </Accordion>
  <Accordion title="O que setupEntry NÃO deve incluir">
    - Registros de CLI.
    - Serviços em segundo plano.
    - Imports pesados de runtime (criptografia, SDKs).
    - Métodos de Gateway necessários apenas após a inicialização.

  </Accordion>
</AccordionGroup>

### Imports estreitos de helpers de configuração

Para caminhos quentes exclusivos de configuração, prefira as costuras estreitas de helpers de configuração em vez do guarda-chuva mais amplo `plugin-sdk/setup` quando você precisar apenas de parte da superfície de configuração:

| Caminho de import                    | Use para                                                                                  | Principais exports                                                                                                                                                                                                                                                                                                   |
| ------------------------------------ | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`           | helpers de runtime no momento da configuração que continuam disponíveis em `setupEntry` / inicialização adiada de canal | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime`   | alias de compatibilidade obsoleto; use `plugin-sdk/setup-runtime`                         | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`             | helpers de configuração/instalação de CLI/arquivo/docs                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

Use a costura mais ampla `plugin-sdk/setup` quando quiser o conjunto completo compartilhado de ferramentas de configuração, incluindo helpers de patch de configuração como `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Use `createSetupTranslator(...)` para textos fixos do assistente de configuração. Ele segue o
locale do assistente da CLI (`OPENCLAW_LOCALE`, depois as variáveis de locale do sistema) e faz
fallback para inglês. Mantenha o texto de configuração específico do Plugin no código pertencente ao Plugin e use
chaves de catálogo compartilhadas apenas para rótulos comuns de configuração, texto de status e textos de configuração
oficiais de Plugins agrupados.

Os adaptadores de patch de configuração permanecem seguros para caminhos quentes no import. A consulta à superfície de contrato de promoção agrupada de conta única é preguiçosa, então importar `plugin-sdk/setup-runtime` não carrega antecipadamente a descoberta de superfície de contrato agrupada antes de o adaptador ser realmente usado.

### Promoção de conta única pertencente ao canal

Quando um canal faz upgrade de uma configuração de nível superior de conta única para `channels.<id>.accounts.*`, o comportamento compartilhado padrão é mover os valores promovidos com escopo de conta para `accounts.default`.

Canais agrupados podem restringir ou substituir essa promoção por meio de sua superfície de contrato de configuração:

- `singleAccountKeysToMove`: chaves adicionais de nível superior que devem ser movidas para a conta promovida
- `namedAccountPromotionKeys`: quando contas nomeadas já existem, apenas estas chaves são movidas para a conta promovida; chaves compartilhadas de política/entrega permanecem na raiz do canal
- `resolveSingleAccountPromotionTarget(...)`: escolhe qual conta existente recebe os valores promovidos

<Note>
Matrix é o exemplo integrado atual. Se exatamente uma conta Matrix nomeada já existir, ou se `defaultAccount` apontar para uma chave não canônica existente, como `Ops`, a promoção preservará essa conta em vez de criar uma nova entrada `accounts.default`.
</Note>

## Esquema de configuração

A configuração do Plugin é validada em relação ao JSON Schema no seu manifesto. Usuários configuram plugins via:

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

Para configuração específica de canal, use a seção de configuração de canal em vez disso:

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

Use `buildChannelConfigSchema` para converter um esquema Zod no wrapper `ChannelConfigSchema` usado por artefatos de configuração pertencentes ao plugin:

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

Para plugins de terceiros, o contrato de caminho frio ainda é o manifesto do plugin: espelhe o JSON Schema gerado em `openclaw.plugin.json#channelConfigs` para que o esquema de configuração, a configuração inicial e as superfícies de UI possam inspecionar `channels.<id>` sem carregar código de runtime.

## Assistentes de configuração inicial

Plugins de canal podem fornecer assistentes interativos de configuração inicial para `openclaw onboard`. O assistente é um objeto `ChannelSetupWizard` no `ChannelPlugin`:

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

O tipo `ChannelSetupWizard` oferece suporte a `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` e mais. Veja os pacotes de plugins integrados (por exemplo, o plugin Discord `src/channel.setup.ts`) para exemplos completos.

<AccordionGroup>
  <Accordion title="Prompts allowFrom compartilhados">
    Para prompts de lista de permissão de DM que só precisam do fluxo padrão `note -> prompt -> parse -> merge -> patch`, prefira os helpers compartilhados de configuração inicial de `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` e `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Status padrão de configuração inicial de canal">
    Para blocos de status de configuração inicial de canal que variam apenas por rótulos, pontuações e linhas adicionais opcionais, prefira `createStandardChannelSetupStatus(...)` de `openclaw/plugin-sdk/setup` em vez de criar manualmente o mesmo objeto `status` em cada plugin.
  </Accordion>
  <Accordion title="Superfície opcional de configuração inicial de canal">
    Para superfícies opcionais de configuração inicial que só devem aparecer em certos contextos, use `createOptionalChannelSetupSurface` de `openclaw/plugin-sdk/channel-setup`:

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

    `plugin-sdk/channel-setup` também expõe os construtores de nível mais baixo `createOptionalChannelSetupAdapter(...)` e `createOptionalChannelSetupWizard(...)` quando você precisa de apenas uma metade dessa superfície de instalação opcional.

    O adaptador/assistente opcional gerado falha de forma fechada em gravações reais de configuração. Eles reutilizam uma única mensagem de instalação necessária em `validateInput`, `applyAccountConfig` e `finalize`, e anexam um link para a documentação quando `docsPath` está definido.

  </Accordion>
  <Accordion title="Helpers de configuração inicial baseados em binário">
    Para UIs de configuração inicial baseadas em binário, prefira os helpers delegados compartilhados em vez de copiar a mesma integração de binário/status para cada canal:

    - `createDetectedBinaryStatus(...)` para blocos de status que variam apenas por rótulos, dicas, pontuações e detecção de binário
    - `createCliPathTextInput(...)` para entradas de texto baseadas em caminho
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` e `createDelegatedResolveConfigured(...)` quando `setupEntry` precisa encaminhar para um assistente completo mais pesado de forma preguiçosa
    - `createDelegatedTextInputShouldPrompt(...)` quando `setupEntry` só precisa delegar uma decisão `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Publicação e instalação

**Plugins externos:** publique no [ClawHub](/pt-BR/clawhub) e depois instale:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Especificações de pacote simples instalam a partir do npm durante a transição de lançamento.

  </Tab>
  <Tab title="Apenas ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Especificação de pacote npm">
    Use npm quando um pacote ainda não tiver migrado para o ClawHub ou quando você precisar de um
    caminho direto de instalação via npm durante a migração:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugins no repositório:** coloque-os na árvore de workspace de plugins incluídos, e eles serão descobertos automaticamente durante a build.

**Os usuários podem instalar:**

```bash
openclaw plugins install <package-name>
```

<Info>
Para instalações originadas do npm, `openclaw plugins install` instala o pacote em um projeto por Plugin em `~/.openclaw/npm/projects`, com scripts de ciclo de vida desativados. Mantenha as árvores de dependências do Plugin puras em JS/TS e evite pacotes que exijam builds de `postinstall`.
</Info>

<Note>
A inicialização do Gateway não instala dependências de Plugins. Os fluxos de instalação por npm/git/ClawHub são responsáveis pela convergência de dependências; Plugins locais já devem ter suas dependências instaladas.
</Note>

Os metadados de pacotes incluídos são explícitos, não inferidos a partir do JavaScript compilado na inicialização do Gateway. Dependências de runtime pertencem ao pacote do Plugin que as possui; a inicialização do OpenClaw empacotado nunca repara nem espelha dependências de Plugins.

## Relacionados

- [Criação de plugins](/pt-BR/plugins/building-plugins) — guia passo a passo para começar
- [Manifesto do Plugin](/pt-BR/plugins/manifest) — referência completa do esquema de manifesto
- [Pontos de entrada do SDK](/pt-BR/plugins/sdk-entrypoints) — `definePluginEntry` e `defineChannelPluginEntry`
