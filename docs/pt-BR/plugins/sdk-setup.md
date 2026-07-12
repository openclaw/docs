---
read_when:
    - Você está adicionando um assistente de configuração a um plugin
    - Você precisa entender setup-entry.ts em comparação com index.ts
    - Você está definindo esquemas de configuração de Plugin ou metadados `openclaw` do `package.json`
sidebarTitle: Setup and config
summary: Assistentes de configuração, setup-entry.ts, esquemas de configuração e metadados do package.json
title: Configuração e ajustes do Plugin
x-i18n:
    generated_at: "2026-07-12T00:16:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b47e1f18a92871c442980168e302c82d7aa9a38b38bbbeed4add9dd6479365b
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Referência para empacotamento de plugins (metadados de `package.json`), manifestos (`openclaw.plugin.json`), entradas de configuração e esquemas de configuração.

<Tip>
**Procurando um passo a passo?** Os guias práticos abordam o empacotamento em contexto: [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins#step-1-package-and-manifest) e [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins#step-1-package-and-manifest).
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
A publicação externa no ClawHub exige `compat` e `build`. Os trechos canônicos de publicação ficam em `docs/snippets/plugin-publish/`.
</Note>

### Campos de `openclaw`

<ParamField path="extensions" type="string[]">
  Arquivos de ponto de entrada (relativos à raiz do pacote). Entradas de código-fonte válidas para desenvolvimento no workspace e em checkouts do git.
</ParamField>
<ParamField path="runtimeExtensions" type="string[]">
  Arquivos JavaScript compilados correspondentes a `extensions`, preferidos quando o OpenClaw carrega um pacote npm instalado. Consulte [Pontos de entrada do SDK](/pt-BR/plugins/sdk-entrypoints) para ver a ordem de resolução entre código-fonte e código compilado.
</ParamField>
<ParamField path="setupEntry" type="string">
  Entrada leve usada apenas para configuração (opcional).
</ParamField>
<ParamField path="runtimeSetupEntry" type="string">
  Arquivo JavaScript compilado correspondente a `setupEntry`. Exige que `setupEntry` também esteja definido.
</ParamField>
<ParamField path="plugin" type="object">
  Identidade alternativa do plugin no formato `{ id, label }`, usada quando um plugin não tem metadados de canal/provedor dos quais derivar um id ou rótulo.
</ParamField>
<ParamField path="channel" type="object">
  Metadados do catálogo de canais para superfícies de configuração, seleção, início rápido e status.
</ParamField>
<ParamField path="install" type="object">
  Indicações de instalação: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`, `requiredPlatformPackages`.
</ParamField>
<ParamField path="startup" type="object">
  Sinalizadores de comportamento de inicialização.
</ParamField>
<ParamField path="compat" type="object">
  Intervalo de versões de `pluginApi` compatível com este plugin. Obrigatório para publicações externas no ClawHub.
</ParamField>

<Note>
Os ids de provedores (`providers: string[]`) são metadados do manifesto, não metadados do pacote. Declare-os em `openclaw.plugin.json`, não aqui — consulte [Manifesto do plugin](/pt-BR/plugins/manifest).
</Note>

### `openclaw.channel`

`openclaw.channel` contém metadados leves do pacote para descoberta de canais e superfícies de configuração antes do carregamento do runtime.

| Campo                                  | Tipo       | Significado                                                                    |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `id`                                   | `string`   | Id canônico do canal.                                                          |
| `label`                                | `string`   | Rótulo principal do canal.                                                     |
| `selectionLabel`                       | `string`   | Rótulo de seleção/configuração quando precisar ser diferente de `label`.       |
| `detailLabel`                          | `string`   | Rótulo de detalhes secundário para catálogos de canais e superfícies de status mais completos. |
| `docsPath`                             | `string`   | Caminho da documentação para links de configuração e seleção.                  |
| `docsLabel`                            | `string`   | Rótulo alternativo usado em links da documentação quando precisar ser diferente do id do canal. |
| `blurb`                                | `string`   | Descrição curta de integração inicial/catálogo.                                |
| `order`                                | `number`   | Ordem de classificação nos catálogos de canais.                                |
| `aliases`                              | `string[]` | Aliases adicionais de pesquisa para seleção de canais.                         |
| `preferOver`                           | `string[]` | Ids de plugins/canais de menor prioridade que este canal deve superar.         |
| `systemImage`                          | `string`   | Nome opcional de ícone/imagem do sistema para catálogos da interface do canal. |
| `selectionDocsPrefix`                  | `string`   | Texto de prefixo antes dos links da documentação nas superfícies de seleção.   |
| `selectionDocsOmitLabel`               | `boolean`  | Exibe diretamente o caminho da documentação em vez de um link rotulado na descrição de seleção. |
| `selectionExtras`                      | `string[]` | Strings curtas adicionais acrescentadas à descrição de seleção.                |
| `markdownCapable`                      | `boolean`  | Indica que o canal é compatível com Markdown para decisões de formatação de saída. |
| `exposure`                             | `object`   | Controles de visibilidade do canal para configuração, listas configuradas e superfícies da documentação. |
| `quickstartAllowFrom`                  | `boolean`  | Inclui este canal no fluxo padrão de configuração `allowFrom` do início rápido. |
| `forceAccountBinding`                  | `boolean`  | Exige vinculação explícita da conta mesmo quando existe apenas uma conta.      |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Prefere a pesquisa de sessão ao resolver destinos de anúncio para este canal.  |

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

- `configured`: inclui o canal em superfícies de listagem de canais configurados/status
- `setup`: inclui o canal nos seletores interativos de configuração
- `docs`: marca o canal como público nas superfícies de documentação/navegação

<Note>
`showConfigured` e `showInSetup` continuam disponíveis como aliases legados. Prefira `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` contém metadados do pacote, não metadados do manifesto.

| Campo                        | Tipo                                | Significado                                                                       |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Especificação canônica do ClawHub para fluxos de instalação/atualização e instalação sob demanda durante a integração inicial. |
| `npmSpec`                    | `string`                            | Especificação canônica do npm para fluxos alternativos de instalação/atualização. |
| `localPath`                  | `string`                            | Caminho de desenvolvimento local ou de instalação incluída.                       |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Fonte de instalação preferida quando várias fontes estão disponíveis.             |
| `minHostVersion`             | `string`                            | Versão mínima compatível do OpenClaw, `>=x.y.z` ou `>=x.y.z-prerelease`.           |
| `expectedIntegrity`          | `string`                            | String de integridade esperada da distribuição npm, geralmente `sha512-...`, para instalações fixadas. |
| `allowInvalidConfigRecovery` | `boolean`                           | Permite que fluxos de reinstalação de plugins incluídos se recuperem de falhas específicas causadas por configurações obsoletas. |
| `requiredPlatformPackages`   | `string[]`                          | Aliases npm obrigatórios e específicos da plataforma, verificados durante a instalação via npm. |

<AccordionGroup>
  <Accordion title="Comportamento da integração inicial">
    A integração inicial interativa usa `openclaw.install` para superfícies de instalação sob demanda: se seu plugin expõe opções de autenticação de provedor ou metadados de configuração/catálogo de canais antes do carregamento do runtime, a integração inicial pode solicitar uma instalação pelo ClawHub, npm ou local, instalar ou habilitar o plugin e então continuar o fluxo selecionado. As opções do ClawHub usam `clawhubSpec` e são preferidas quando presentes; as opções do npm exigem metadados confiáveis de catálogo com um `npmSpec` do registro (versões exatas e `expectedIntegrity` são fixações opcionais, aplicadas na instalação/atualização quando definidas). Mantenha "o que exibir" em `openclaw.plugin.json` e "como instalar" em `package.json`.
  </Accordion>
  <Accordion title="Aplicação de minHostVersion">
    Se `minHostVersion` estiver definido, tanto a instalação quanto o carregamento pelo registro de manifestos não incluídos o aplicarão. Hosts mais antigos ignoram plugins externos; strings de versão inválidas são rejeitadas. Presume-se que plugins de código-fonte incluídos tenham a mesma versão do checkout do host.
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
    `allowInvalidConfigRecovery` não é um mecanismo geral para ignorar configurações inválidas. Ele se destina apenas à recuperação restrita de plugins incluídos, permitindo que a reinstalação/configuração corrija resíduos conhecidos de atualizações, como a ausência do caminho de um plugin incluído ou uma entrada `channels.<id>` obsoleta desse mesmo plugin. Se a configuração estiver inválida por motivos não relacionados, a instalação ainda falhará de forma segura e instruirá o operador a executar `openclaw doctor --fix`.
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

Quando habilitado, o OpenClaw carrega apenas `setupEntry` durante a fase de inicialização anterior à escuta, mesmo para canais já configurados. A entrada completa é carregada depois que o Gateway começa a escutar.

<Warning>
Habilite o carregamento adiado somente quando seu `setupEntry` registrar tudo de que o Gateway precisa antes de começar a escutar (registro do canal, rotas HTTP, métodos do Gateway). Se a entrada completa for responsável por recursos obrigatórios de inicialização, mantenha o comportamento padrão.
</Warning>

Se sua entrada de configuração/completa registrar métodos RPC do Gateway, mantenha-os sob um prefixo específico do plugin. Os namespaces administrativos reservados do núcleo (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) permanecem sob responsabilidade do núcleo e sempre são normalizados para `operator.admin`.

## Manifesto do plugin

Todo plugin nativo deve incluir um `openclaw.plugin.json` na raiz do pacote. O OpenClaw usa esse arquivo para validar a configuração sem executar o código do plugin.

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

Para plugins de canal, adicione `channels` (e, para plugins de provedor, adicione `providers`):

```json
{
  "id": "my-channel",
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

Consulte [Manifesto do plugin](/pt-BR/plugins/manifest) para ver a referência completa do esquema.

## Publicação no ClawHub

Skills e pacotes de plugins usam comandos de publicação distintos no ClawHub. Para pacotes de plugins, use o comando específico para pacotes:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
`clawhub skill publish <path>` é um comando diferente, usado para publicar uma pasta de Skill, não um pacote de plugin. Consulte [Publicação no ClawHub](/pt-BR/clawhub/publishing).
</Note>

## Entrada de configuração

`setup-entry.ts` é uma alternativa leve ao `index.ts`, carregada pelo OpenClaw quando ele precisa apenas das superfícies de configuração inicial (integração inicial, reparo de configuração e inspeção de canais desativados):

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Isso evita carregar código pesado de execução (bibliotecas criptográficas, registros da CLI e serviços em segundo plano) durante os fluxos de configuração inicial.

Canais incluídos no espaço de trabalho que mantêm exportações seguras para configuração inicial em módulos auxiliares podem usar `defineBundledChannelSetupEntry(...)` de `openclaw/plugin-sdk/channel-entry-contract` em vez de `defineSetupPluginEntry(...)`. Esse contrato incluído também aceita uma exportação opcional `runtime`, permitindo que a vinculação da execução durante a configuração permaneça leve e explícita.

<AccordionGroup>
  <Accordion title="Quando o OpenClaw usa setupEntry em vez da entrada completa">
    - O canal está desativado, mas precisa de superfícies de configuração inicial ou integração inicial.
    - O canal está ativado, mas não configurado.
    - O carregamento adiado está ativado (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="O que setupEntry deve registrar">
    - O objeto do plugin de canal (por meio de `defineSetupPluginEntry`).
    - Todas as rotas HTTP necessárias antes de o Gateway começar a escutar.
    - Todos os métodos do Gateway necessários durante a inicialização.

    Esses métodos de inicialização do Gateway ainda devem evitar namespaces administrativos reservados do núcleo, como `config.*` ou `update.*`.

  </Accordion>
  <Accordion title="O que setupEntry NÃO deve incluir">
    - Registros da CLI.
    - Serviços em segundo plano.
    - Importações pesadas de execução (criptografia, SDKs).
    - Métodos do Gateway necessários somente após a inicialização.

  </Accordion>
</AccordionGroup>

### Importações específicas de auxiliares de configuração

Para caminhos críticos usados apenas na configuração inicial, prefira as interfaces específicas de auxiliares de configuração em vez da interface abrangente `plugin-sdk/setup` quando precisar somente de parte da superfície de configuração:

| Caminho de importação                | Use para                                                                                                    | Principais exportações                                                                                                                                                                                                                                                                                                 |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`           | auxiliares de execução da configuração que permanecem disponíveis em `setupEntry` ou na inicialização adiada do canal | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime`   | alias de compatibilidade obsoleto; use `plugin-sdk/setup-runtime`                                           | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`             | auxiliares de CLI, instalação, arquivos compactados e documentação para configuração                       | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

Use a interface mais abrangente `plugin-sdk/setup` quando quiser o conjunto completo de ferramentas compartilhadas de configuração, incluindo auxiliares de alteração da configuração, como `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Use `createSetupTranslator(...)` para textos fixos do assistente de configuração. Ele segue a localidade do assistente da CLI (`OPENCLAW_LOCALE` e, em seguida, as variáveis de localidade do sistema) e usa o inglês como alternativa. Mantenha o texto de configuração específico do plugin no código pertencente ao plugin e use chaves compartilhadas do catálogo somente para rótulos comuns de configuração, textos de status e textos de configuração dos plugins oficiais incluídos.

Os adaptadores de alteração da configuração continuam seguros para importação em caminhos críticos. A consulta à superfície do contrato incluído de promoção de conta única é preguiçosa; portanto, importar `plugin-sdk/setup-runtime` não carrega antecipadamente a descoberta das superfícies de contrato incluídas antes de o adaptador ser efetivamente usado.

### Promoção de conta única pertencente ao canal

Quando um canal migra de uma configuração de nível superior com uma única conta para `channels.<id>.accounts.*`, o comportamento compartilhado padrão move os valores promovidos com escopo de conta para `accounts.default`.

Canais incluídos podem restringir ou substituir essa promoção por meio de sua superfície de contrato de configuração:

- `singleAccountKeysToMove`: chaves adicionais de nível superior que devem ser movidas para a conta promovida
- `namedAccountPromotionKeys`: quando já existem contas nomeadas, somente essas chaves são movidas para a conta promovida; as chaves compartilhadas de política e entrega permanecem na raiz do canal
- `resolveSingleAccountPromotionTarget(...)`: escolhe qual conta existente recebe os valores promovidos

<Note>
Matrix é o exemplo incluído atual. Se já existir exatamente uma conta nomeada do Matrix, ou se `defaultAccount` apontar para uma chave não canônica existente, como `Ops`, a promoção preservará essa conta em vez de criar uma nova entrada `accounts.default`.
</Note>

## Esquema de configuração

A configuração do plugin é validada em relação ao JSON Schema do manifesto. Os usuários configuram plugins por meio de:

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

Para configurações específicas do canal, use a seção de configuração do canal:

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

### Criação de esquemas de configuração de canais

Use `buildChannelConfigSchema` para converter um esquema Zod no invólucro `ChannelConfigSchema` usado pelos artefatos de configuração pertencentes ao plugin:

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

Se você já define o contrato como JSON Schema ou TypeBox, use o auxiliar direto para que o OpenClaw possa ignorar a conversão de Zod para JSON Schema nos caminhos de metadados:

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

Para plugins de terceiros, o contrato do caminho não crítico ainda é o manifesto do plugin: replique o JSON Schema gerado em `openclaw.plugin.json#channelConfigs` para que as superfícies de esquema de configuração, configuração inicial e interface possam inspecionar `channels.<id>` sem carregar o código de execução.

## Assistentes de configuração

Plugins de canal podem fornecer assistentes interativos de configuração para `openclaw onboard`. O assistente é um objeto `ChannelSetupWizard` no `ChannelPlugin`:

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

`ChannelSetupWizard` também aceita `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` e outros recursos. Consulte `src/setup-core.ts` do plugin do Discord para ver um exemplo completo incluído.

<AccordionGroup>
  <Accordion title="Solicitações compartilhadas de allowFrom">
    Para solicitações de lista de permissões de mensagens diretas que precisam apenas do fluxo padrão `note -> prompt -> parse -> merge -> patch`, prefira os auxiliares compartilhados de configuração de `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` e `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Status padrão da configuração do canal">
    Para blocos de status da configuração do canal que variam somente em rótulos, pontuações e linhas adicionais opcionais, prefira `createStandardChannelSetupStatus(...)` de `openclaw/plugin-sdk/setup` em vez de criar manualmente o mesmo objeto `status` em cada plugin.
  </Accordion>
  <Accordion title="Superfície opcional de configuração do canal">
    Para superfícies opcionais de configuração que devem aparecer somente em determinados contextos, use `createOptionalChannelSetupSurface` de `openclaw/plugin-sdk/channel-setup`:

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

    `plugin-sdk/channel-setup` também expõe os construtores de nível mais baixo `createOptionalChannelSetupAdapter(...)` e `createOptionalChannelSetupWizard(...)` quando você precisa apenas de uma das partes dessa superfície de instalação opcional.

    O adaptador/assistente opcional gerado falha de forma segura em gravações reais de configuração. Eles reutilizam uma única mensagem de instalação obrigatória em `validateInput`, `applyAccountConfig` e `finalize`, e acrescentam um link para a documentação quando `docsPath` está definido.

  </Accordion>
  <Accordion title="Auxiliares de configuração baseados em binários">
    Para interfaces de configuração baseadas em binários, prefira os auxiliares compartilhados de delegação em vez de copiar a mesma lógica de integração de binário/status para cada canal:

    - `createDetectedBinaryStatus(...)` para blocos de status que variam apenas por rótulos, dicas, pontuações e detecção de binário
    - `createCliPathTextInput(...)` para entradas de texto baseadas em caminhos
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` e `createDelegatedResolveConfigured(...)` quando `setupEntry` precisar encaminhar de forma adiada para um assistente completo mais robusto
    - `createDelegatedTextInputShouldPrompt(...)` quando `setupEntry` precisar apenas delegar uma decisão de `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Publicação e instalação

**Plugins externos:** publique no [ClawHub](/pt-BR/clawhub) e depois instale:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Especificações simples de pacotes são instaladas pelo npm durante a transição de inicialização, a menos que o nome corresponda ao ID de um plugin incluído ou oficial; nesse caso, o OpenClaw usa a respectiva cópia local/oficial. Use `clawhub:`, `npm:`, `git:` ou `npm-pack:` para selecionar a origem de forma determinística — consulte [Gerenciar plugins](/pt-BR/plugins/manage-plugins).

  </Tab>
  <Tab title="Somente ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Especificação de pacote npm">
    Use o npm quando um pacote ainda não tiver migrado para o ClawHub ou quando você precisar de um
    caminho de instalação direta pelo npm durante a migração:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugins no repositório:** coloque-os na árvore do espaço de trabalho de plugins incluídos; eles são descobertos automaticamente durante a compilação.

<Info>
Para instalações com origem no npm, `openclaw plugins install` instala o pacote em um projeto específico do plugin em `~/.openclaw/npm/projects`, com os scripts de ciclo de vida desativados (`--ignore-scripts`). Mantenha as árvores de dependências dos plugins exclusivamente em JS/TS e evite pacotes que exijam compilações em `postinstall`.
</Info>

<Note>
A inicialização do Gateway não instala dependências de plugins. Os fluxos de instalação via npm/git/ClawHub são responsáveis pela convergência das dependências; plugins locais já devem ter suas dependências instaladas.
</Note>

Os metadados dos pacotes incluídos são explícitos, não inferidos do JavaScript compilado durante a inicialização do Gateway. As dependências de tempo de execução devem estar no pacote do plugin que as possui; a inicialização do OpenClaw empacotado nunca repara nem espelha dependências de plugins.

## Relacionado

- [Criação de plugins](/pt-BR/plugins/building-plugins) — guia de introdução passo a passo
- [Manifesto de plugin](/pt-BR/plugins/manifest) — referência completa do esquema do manifesto
- [Pontos de entrada do SDK](/pt-BR/plugins/sdk-entrypoints) — `definePluginEntry` e `defineChannelPluginEntry`
