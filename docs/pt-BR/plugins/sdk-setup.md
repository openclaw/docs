---
read_when:
    - Você está adicionando um assistente de configuração a um plugin
    - Você precisa entender setup-entry.ts em comparação com index.ts
    - Você está definindo esquemas de configuração de plugins ou metadados `openclaw` no `package.json`
sidebarTitle: Setup and config
summary: Assistentes de configuração, setup-entry.ts, esquemas de configuração e metadados de package.json
title: Configuração e ajustes do Plugin
x-i18n:
    generated_at: "2026-07-12T15:30:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
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
          "label": "Meu canal",
          "blurb": "Breve descrição do canal."
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
A publicação externa no ClawHub exige `compat` e `build`. Os trechos canônicos de publicação estão em `docs/snippets/plugin-publish/`.
</Note>

### Campos de `openclaw`

<ParamField path="extensions" type="string[]">
  Arquivos de ponto de entrada (relativos à raiz do pacote). Entradas de origem válidas para desenvolvimento em workspace e checkout do git.
</ParamField>
<ParamField path="runtimeExtensions" type="string[]">
  Arquivos JavaScript compilados correspondentes a `extensions`, preferidos quando o OpenClaw carrega um pacote npm instalado. Consulte [Pontos de entrada do SDK](/pt-BR/plugins/sdk-entrypoints) para ver a ordem de resolução entre origem e arquivos compilados.
</ParamField>
<ParamField path="setupEntry" type="string">
  Entrada leve usada somente para configuração (opcional).
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
  Dicas de instalação: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`, `requiredPlatformPackages`.
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
| `selectionLabel`                       | `string`   | Rótulo de seleção/configuração quando deve ser diferente de `label`.           |
| `detailLabel`                          | `string`   | Rótulo secundário de detalhes para catálogos de canais e superfícies de status mais completos. |
| `docsPath`                             | `string`   | Caminho da documentação para links de configuração e seleção.                  |
| `docsLabel`                            | `string`   | Rótulo substituto usado em links da documentação quando deve ser diferente do id do canal. |
| `blurb`                                | `string`   | Breve descrição de integração inicial/catálogo.                                |
| `order`                                | `number`   | Ordem de classificação nos catálogos de canais.                                |
| `aliases`                              | `string[]` | Aliases adicionais de pesquisa para seleção de canais.                         |
| `preferOver`                           | `string[]` | Ids de plugins/canais de menor prioridade sobre os quais este canal deve ter precedência. |
| `systemImage`                          | `string`   | Nome opcional de ícone/imagem do sistema para catálogos da interface de canais. |
| `selectionDocsPrefix`                  | `string`   | Texto de prefixo antes dos links da documentação nas superfícies de seleção.   |
| `selectionDocsOmitLabel`               | `boolean`  | Exibe diretamente o caminho da documentação em vez de um link rotulado na mensagem de seleção. |
| `selectionExtras`                      | `string[]` | Strings curtas adicionais acrescentadas à mensagem de seleção.                |
| `markdownCapable`                      | `boolean`  | Marca o canal como compatível com Markdown para decisões de formatação de saída. |
| `exposure`                             | `object`   | Controles de visibilidade do canal para configuração, listas configuradas e superfícies da documentação. |
| `quickstartAllowFrom`                  | `boolean`  | Inclui este canal no fluxo de configuração padrão `allowFrom` do início rápido. |
| `forceAccountBinding`                  | `boolean`  | Exige vinculação explícita da conta mesmo quando existe apenas uma conta.      |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Prefere a pesquisa de sessão ao resolver destinos de anúncio para este canal.  |

Exemplo:

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "Meu canal",
      "selectionLabel": "Meu canal (auto-hospedado)",
      "detailLabel": "Bot do meu canal",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Integração de chat auto-hospedada baseada em Webhook.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Guia:",
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

- `configured`: inclui o canal em superfícies de listagem de canais configurados/status
- `setup`: inclui o canal nos seletores interativos de configuração
- `docs`: marca o canal como público nas superfícies de documentação/navegação

<Note>
`showConfigured` e `showInSetup` continuam sendo compatíveis como aliases legados. Prefira `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` contém metadados do pacote, não metadados do manifesto.

| Campo                        | Tipo                                | Significado                                                                       |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Especificação canônica do ClawHub para fluxos de instalação/atualização e instalação sob demanda durante a integração inicial. |
| `npmSpec`                    | `string`                            | Especificação canônica do npm para fluxos alternativos de instalação/atualização. |
| `localPath`                  | `string`                            | Caminho de desenvolvimento local ou instalação integrada.                        |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Origem de instalação preferida quando várias origens estão disponíveis.           |
| `minHostVersion`             | `string`                            | Versão mínima compatível do OpenClaw, `>=x.y.z` ou `>=x.y.z-prerelease`.           |
| `expectedIntegrity`          | `string`                            | String de integridade esperada da distribuição npm, geralmente `sha512-...`, para instalações fixadas. |
| `allowInvalidConfigRecovery` | `boolean`                           | Permite que fluxos de reinstalação de plugins integrados se recuperem de falhas específicas de configuração obsoleta. |
| `requiredPlatformPackages`   | `string[]`                          | Aliases npm específicos da plataforma obrigatórios, verificados durante a instalação do npm. |

<AccordionGroup>
  <Accordion title="Comportamento da integração inicial">
    A integração inicial interativa usa `openclaw.install` nas superfícies de instalação sob demanda: se o plugin expõe opções de autenticação do provedor ou metadados de configuração/catálogo do canal antes do carregamento do runtime, a integração inicial pode solicitar a instalação via ClawHub, npm ou origem local, instalar ou ativar o plugin e continuar o fluxo selecionado. As opções do ClawHub usam `clawhubSpec` e são preferidas quando presentes; as opções do npm exigem metadados de catálogo confiáveis com um `npmSpec` do registro (versões exatas e `expectedIntegrity` são fixações opcionais, aplicadas durante a instalação/atualização quando definidas). Mantenha "o que exibir" em `openclaw.plugin.json` e "como instalar" em `package.json`.
  </Accordion>
  <Accordion title="Aplicação de minHostVersion">
    Se `minHostVersion` estiver definido, tanto a instalação quanto o carregamento de plugins não integrados pelo registro de manifestos o aplicarão. Hosts mais antigos ignoram plugins externos; strings de versão inválidas são rejeitadas. Presume-se que plugins de origem integrados tenham a mesma versão do checkout do host.
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
    `allowInvalidConfigRecovery` não é um mecanismo geral para ignorar configurações inválidas. Ele se destina somente à recuperação restrita de plugins integrados, permitindo que a reinstalação/configuração corrija resíduos conhecidos de atualizações, como a ausência do caminho de um plugin integrado ou uma entrada `channels.<id>` obsoleta desse mesmo plugin. Se a configuração estiver inválida por motivos não relacionados, a instalação ainda falhará de forma segura e orientará o operador a executar `openclaw doctor --fix`.
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

Quando ativado, o OpenClaw carrega somente `setupEntry` durante a fase de inicialização anterior ao início da escuta, mesmo para canais já configurados. A entrada completa é carregada depois que o Gateway começa a escutar.

<Warning>
Ative o carregamento adiado somente quando `setupEntry` registrar tudo de que o Gateway precisa antes de começar a escutar (registro do canal, rotas HTTP, métodos do Gateway). Se a entrada completa for responsável por recursos obrigatórios de inicialização, mantenha o comportamento padrão.
</Warning>

Se a entrada de configuração/completa registrar métodos RPC do Gateway, mantenha-os sob um prefixo específico do plugin. Os namespaces administrativos reservados do núcleo (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) permanecem sob responsabilidade do núcleo e sempre são normalizados para `operator.admin`.

## Manifesto do plugin

Todo plugin nativo deve incluir um `openclaw.plugin.json` na raiz do pacote. O OpenClaw usa esse arquivo para validar a configuração sem executar o código do plugin.

```json
{
  "id": "my-plugin",
  "name": "Meu Plugin",
  "description": "Adiciona recursos do Meu Plugin ao OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Segredo de verificação do Webhook"
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

Mesmo os plugins sem configuração devem incluir um esquema. Um esquema vazio é válido:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Consulte [Manifesto de plugin](/pt-BR/plugins/manifest) para ver a referência completa do esquema.

## Publicação no ClawHub

Pacotes de Skills e de plugins usam comandos de publicação separados no ClawHub. Para pacotes de plugins, use o comando específico para pacotes:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
`clawhub skill publish <path>` é um comando diferente, usado para publicar uma pasta de skill, e não um pacote de plugin. Consulte [Publicação no ClawHub](/pt-BR/clawhub/publishing).
</Note>

## Entrada de configuração

`setup-entry.ts` é uma alternativa leve a `index.ts` que o OpenClaw carrega quando precisa apenas das superfícies de configuração (integração inicial, reparo da configuração, inspeção de canais desabilitados):

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Isso evita carregar código de runtime pesado (bibliotecas criptográficas, registros da CLI, serviços em segundo plano) durante os fluxos de configuração.

Os canais incluídos no workspace que mantêm exportações seguras para configuração em módulos auxiliares podem usar `defineBundledChannelSetupEntry(...)` de `openclaw/plugin-sdk/channel-entry-contract` em vez de `defineSetupPluginEntry(...)`. Esse contrato para componentes incluídos também aceita uma exportação opcional `runtime`, para que a vinculação do runtime durante a configuração permaneça leve e explícita.

<AccordionGroup>
  <Accordion title="Quando o OpenClaw usa setupEntry em vez da entrada completa">
    - O canal está desabilitado, mas precisa de superfícies de configuração/integração inicial.
    - O canal está habilitado, mas não está configurado.
    - O carregamento adiado está habilitado (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="O que setupEntry deve registrar">
    - O objeto do plugin de canal (por meio de `defineSetupPluginEntry`).
    - Todas as rotas HTTP necessárias antes de o gateway começar a escutar.
    - Todos os métodos do gateway necessários durante a inicialização.

    Esses métodos do gateway usados na inicialização ainda devem evitar namespaces administrativos reservados do núcleo, como `config.*` ou `update.*`.

  </Accordion>
  <Accordion title="O que setupEntry NÃO deve incluir">
    - Registros da CLI.
    - Serviços em segundo plano.
    - Importações pesadas de runtime (criptografia, SDKs).
    - Métodos do gateway necessários somente após a inicialização.

  </Accordion>
</AccordionGroup>

### Importações restritas de auxiliares de configuração

Para caminhos críticos usados somente na configuração, prefira as interfaces restritas de auxiliares de configuração em vez do módulo abrangente `plugin-sdk/setup` quando precisar apenas de parte da superfície de configuração:

| Caminho de importação              | Use para                                                                                          | Principais exportações                                                                                                                                                                                                                                                                                                 |
| ---------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | auxiliares de runtime durante a configuração que permanecem disponíveis em `setupEntry`/inicialização adiada do canal | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | alias de compatibilidade obsoleto; use `plugin-sdk/setup-runtime`                                 | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | auxiliares de configuração/instalação para CLI, arquivos compactados e documentação              | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

Use a interface mais abrangente `plugin-sdk/setup` quando quiser o conjunto completo de ferramentas compartilhadas de configuração, incluindo auxiliares de modificação da configuração, como `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Use `createSetupTranslator(...)` para textos fixos do assistente de configuração. Ele segue a localidade do assistente da CLI (`OPENCLAW_LOCALE`, seguida pelas variáveis de localidade do sistema) e recorre ao inglês como fallback. Mantenha o texto de configuração específico do plugin no código pertencente ao plugin e use chaves compartilhadas do catálogo apenas para rótulos comuns de configuração, textos de status e textos de configuração dos plugins oficiais incluídos.

Os adaptadores de patch de configuração permanecem seguros para o caminho crítico durante a importação. A consulta à superfície de contrato de promoção de conta única incluída é adiada, portanto, importar `plugin-sdk/setup-runtime` não carrega antecipadamente a descoberta da superfície de contrato incluída antes que o adaptador seja efetivamente usado.

### Promoção de conta única pertencente ao canal

Quando um canal migra de uma configuração de nível superior com conta única para `channels.<id>.accounts.*`, o comportamento compartilhado padrão move os valores promovidos com escopo de conta para `accounts.default`.

Os canais incluídos podem restringir ou substituir essa promoção por meio de sua superfície de contrato de configuração:

- `singleAccountKeysToMove`: chaves adicionais de nível superior que devem ser movidas para a conta promovida
- `namedAccountPromotionKeys`: quando já existem contas nomeadas, somente essas chaves são movidas para a conta promovida; as chaves compartilhadas de política/entrega permanecem na raiz do canal
- `resolveSingleAccountPromotionTarget(...)`: escolhe qual conta existente recebe os valores promovidos

<Note>
Matrix é o exemplo incluído atual. Se já existir exatamente uma conta nomeada do Matrix ou se `defaultAccount` apontar para uma chave não canônica existente, como `Ops`, a promoção preservará essa conta em vez de criar uma nova entrada `accounts.default`.
</Note>

## Esquema de configuração

A configuração do plugin é validada em relação ao JSON Schema do seu manifesto. Os usuários configuram plugins por meio de:

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

### Criação de esquemas de configuração de canal

Use `buildChannelConfigSchema` para converter um esquema Zod no wrapper `ChannelConfigSchema` usado pelos artefatos de configuração pertencentes ao plugin:

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

Se você já cria o contrato como JSON Schema ou TypeBox, use o auxiliar direto para que o OpenClaw possa ignorar a conversão de Zod para JSON Schema nos caminhos de metadados:

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

Para plugins de terceiros, o contrato do caminho frio continua sendo o manifesto do plugin: replique o JSON Schema gerado em `openclaw.plugin.json#channelConfigs` para que as superfícies de esquema de configuração, configuração e UI possam inspecionar `channels.<id>` sem carregar o código de runtime.

## Assistentes de configuração

Os plugins de canal podem fornecer assistentes de configuração interativos para `openclaw onboard`. O assistente é um objeto `ChannelSetupWizard` em `ChannelPlugin`:

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
      inputPrompt: "Insira o token do seu bot:",
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

`ChannelSetupWizard` também oferece suporte a `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` e outros recursos. Consulte `src/setup-core.ts` do plugin do Discord para ver um exemplo completo incluído.

<AccordionGroup>
  <Accordion title="Prompts allowFrom compartilhados">
    Para prompts de lista de permissões de DM que precisam apenas do fluxo padrão `note -> prompt -> parse -> merge -> patch`, prefira os auxiliares de configuração compartilhados de `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` e `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Status padrão de configuração do canal">
    Para blocos de status de configuração do canal que variam apenas por rótulos, pontuações e linhas adicionais opcionais, prefira `createStandardChannelSetupStatus(...)` de `openclaw/plugin-sdk/setup` em vez de criar manualmente o mesmo objeto `status` em cada plugin.
  </Accordion>
  <Accordion title="Superfície opcional de configuração do canal">
    Para superfícies opcionais de configuração que devem aparecer apenas em determinados contextos, use `createOptionalChannelSetupSurface` de `openclaw/plugin-sdk/channel-setup`:

    ```typescript
    import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

    const setupSurface = createOptionalChannelSetupSurface({
      channel: "my-channel",
      label: "Meu canal",
      npmSpec: "@myorg/openclaw-my-channel",
      docsPath: "/channels/my-channel",
    });
    // Retorna { setupAdapter, setupWizard }
    ```

    `plugin-sdk/channel-setup` também expõe os construtores de nível inferior `createOptionalChannelSetupAdapter(...)` e `createOptionalChannelSetupWizard(...)` quando você precisa apenas de uma das partes dessa superfície de instalação opcional.

    O adaptador/assistente opcional gerado falha de forma segura em gravações reais de configuração. Ele reutiliza uma única mensagem de instalação obrigatória em `validateInput`, `applyAccountConfig` e `finalize`, e acrescenta um link para a documentação quando `docsPath` está definido.

  </Accordion>
  <Accordion title="Auxiliares de configuração baseados em binários">
    Para interfaces de configuração baseadas em binários, prefira os auxiliares compartilhados com delegação em vez de copiar a mesma lógica de integração de binário/status em cada canal:

    - `createDetectedBinaryStatus(...)` para blocos de status que variam apenas por rótulos, dicas, pontuações e detecção de binário
    - `createCliPathTextInput(...)` para entradas de texto baseadas em caminho
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` e `createDelegatedResolveConfigured(...)` quando `setupEntry` precisar encaminhar de forma adiada para um assistente completo mais robusto
    - `createDelegatedTextInputShouldPrompt(...)` quando `setupEntry` precisar apenas delegar uma decisão de `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Publicação e instalação

**Plugins externos:** publique no [ClawHub](/clawhub) e, depois, instale:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Especificações simples de pacote são instaladas pelo npm durante a transição de inicialização, a menos que o nome corresponda ao id de um plugin incluído ou oficial; nesse caso, o OpenClaw usa essa cópia local/oficial. Use `clawhub:`, `npm:`, `git:` ou `npm-pack:` para uma seleção determinística da origem — consulte [Gerenciar plugins](/pt-BR/plugins/manage-plugins).

  </Tab>
  <Tab title="Somente ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Especificação de pacote npm">
    Use o npm quando um pacote ainda não tiver migrado para o ClawHub ou quando você precisar de um
    caminho direto de instalação pelo npm durante a migração:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugins no repositório:** coloque-os na árvore do workspace de plugins incluídos; eles são descobertos automaticamente durante a compilação.

<Info>
Para instalações originadas do npm, `openclaw plugins install` instala o pacote em um projeto por plugin em `~/.openclaw/npm/projects`, com os scripts de ciclo de vida desativados (`--ignore-scripts`). Mantenha as árvores de dependências dos plugins exclusivamente em JS/TS e evite pacotes que exijam compilações em `postinstall`.
</Info>

<Note>
A inicialização do Gateway não instala dependências de plugins. Os fluxos de instalação por npm/git/ClawHub são responsáveis pela convergência das dependências; plugins locais já devem ter suas dependências instaladas.
</Note>

Os metadados de pacotes incluídos são explícitos, não inferidos do JavaScript compilado durante a inicialização do Gateway. As dependências de runtime pertencem ao pacote do plugin que as possui; a inicialização do OpenClaw empacotado nunca repara nem espelha as dependências de plugins.

## Relacionado

- [Criação de plugins](/pt-BR/plugins/building-plugins) — guia de introdução passo a passo
- [Manifesto do plugin](/pt-BR/plugins/manifest) — referência completa do esquema do manifesto
- [Pontos de entrada do SDK](/pt-BR/plugins/sdk-entrypoints) — `definePluginEntry` e `defineChannelPluginEntry`
