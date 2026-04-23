---
read_when:
    - Você está criando um Plugin do OpenClaw
    - Você precisa fornecer um schema de configuração de Plugin ou depurar erros de validação de Plugin
summary: Manifesto do Plugin + requisitos de schema JSON (validação estrita de configuração)
title: Manifesto do Plugin
x-i18n:
    generated_at: "2026-04-23T14:04:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: d48810f604aa0c3ff8553528cfa4cb735d1d5e7a15b1bbca6152070d6c8f9cce
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifesto do Plugin (openclaw.plugin.json)

Esta página é apenas para o **manifesto nativo de Plugin do OpenClaw**.

Para layouts de bundle compatíveis, veja [Bundles de Plugin](/pt-BR/plugins/bundles).

Formatos de bundle compatíveis usam arquivos de manifesto diferentes:

- Bundle do Codex: `.codex-plugin/plugin.json`
- Bundle do Claude: `.claude-plugin/plugin.json` ou o layout padrão de componente do Claude
  sem manifesto
- Bundle do Cursor: `.cursor-plugin/plugin.json`

O OpenClaw também detecta automaticamente esses layouts de bundle, mas eles não são validados
em relação ao schema de `openclaw.plugin.json` descrito aqui.

Para bundles compatíveis, o OpenClaw atualmente lê os metadados do bundle mais raízes declaradas
de Skills, raízes de comandos do Claude, padrões de `settings.json` de bundle do Claude,
padrões de LSP de bundle do Claude e pacotes de hook compatíveis quando o layout corresponde
às expectativas de runtime do OpenClaw.

Todo Plugin nativo do OpenClaw **deve** fornecer um arquivo `openclaw.plugin.json` na
**raiz do Plugin**. O OpenClaw usa esse manifesto para validar a configuração
**sem executar o código do Plugin**. Manifestos ausentes ou inválidos são tratados como
erros de Plugin e bloqueiam a validação da configuração.

Veja o guia completo do sistema de Plugins: [Plugins](/pt-BR/tools/plugin).
Para o modelo nativo de capacidades e a orientação atual de compatibilidade externa:
[Modelo de capacidades](/pt-BR/plugins/architecture#public-capability-model).

## O que este arquivo faz

`openclaw.plugin.json` são os metadados que o OpenClaw lê antes de carregar o código
do seu Plugin.

Use-o para:

- identidade do Plugin
- validação de configuração
- metadados de autenticação e onboarding que devem estar disponíveis sem inicializar o runtime do Plugin
- dicas leves de ativação que superfícies do plano de controle podem inspecionar antes do carregamento do runtime
- descritores leves de configuração que superfícies de configuração/onboarding podem inspecionar antes do carregamento do runtime
- metadados de alias e ativação automática que devem ser resolvidos antes do carregamento do runtime do Plugin
- metadados abreviados de propriedade de família de modelo que devem ativar automaticamente o
  Plugin antes do carregamento do runtime
- snapshots estáticos de propriedade de capacidades usados para compat wiring integrado e
  cobertura de contrato
- metadados leves do executor de QA que o host compartilhado `openclaw qa` pode inspecionar
  antes do carregamento do runtime do Plugin
- metadados de configuração específicos de canal que devem ser mesclados em superfícies de catálogo e validação sem carregar o runtime
- dicas de UI de configuração

Não o use para:

- registrar comportamento de runtime
- declarar entrypoints de código
- metadados de instalação npm

Esses pertencem ao código do seu Plugin e ao `package.json`.

## Exemplo mínimo

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

## Exemplo completo

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "Plugin de provedor OpenRouter",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "providerEndpoints": [
    {
      "endpointClass": "xai-native",
      "hosts": ["api.x.ai"]
    }
  ],
  "cliBackends": ["openrouter-cli"],
  "syntheticAuthRefs": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
  },
  "providerAuthAliases": {
    "openrouter-coding": "openrouter"
  },
  "channelEnvVars": {
    "openrouter-chatops": ["OPENROUTER_CHATOPS_TOKEN"]
  },
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "Chave de API do OpenRouter",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "Chave de API do OpenRouter",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "Chave de API",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string"
      }
    }
  }
}
```

## Referência de campos de nível superior

| Field                                | Required | Type                             | What it means                                                                                                                                                                                                                     |
| ------------------------------------ | -------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Sim      | `string`                         | ID canônico do Plugin. Este é o ID usado em `plugins.entries.<id>`.                                                                                                                                                              |
| `configSchema`                       | Sim      | `object`                         | JSON Schema inline para a configuração deste Plugin.                                                                                                                                                                              |
| `enabledByDefault`                   | Não      | `true`                           | Marca um Plugin integrado como ativado por padrão. Omita-o, ou defina qualquer valor diferente de `true`, para deixar o Plugin desativado por padrão.                                                                           |
| `legacyPluginIds`                    | Não      | `string[]`                       | IDs legados que são normalizados para este ID canônico de Plugin.                                                                                                                                                                 |
| `autoEnableWhenConfiguredProviders`  | Não      | `string[]`                       | IDs de provedores que devem ativar automaticamente este Plugin quando autenticação, configuração ou refs de modelo os mencionarem.                                                                                               |
| `kind`                               | Não      | `"memory"` \| `"context-engine"` | Declara um tipo exclusivo de Plugin usado por `plugins.slots.*`.                                                                                                                                                                  |
| `channels`                           | Não      | `string[]`                       | IDs de canais pertencentes a este Plugin. Usado para descoberta e validação de configuração.                                                                                                                                     |
| `providers`                          | Não      | `string[]`                       | IDs de provedores pertencentes a este Plugin.                                                                                                                                                                                     |
| `modelSupport`                       | Não      | `object`                         | Metadados abreviados de família de modelo pertencentes ao manifesto usados para carregar automaticamente o Plugin antes do runtime.                                                                                              |
| `providerEndpoints`                  | Não      | `object[]`                       | Metadados de host/baseUrl de endpoint pertencentes ao manifesto para rotas de provedor que o core deve classificar antes do carregamento do runtime do provedor.                                                                |
| `cliBackends`                        | Não      | `string[]`                       | IDs de backend de inferência da CLI pertencentes a este Plugin. Usado para ativação automática na inicialização a partir de refs explícitas de configuração.                                                                    |
| `syntheticAuthRefs`                  | Não      | `string[]`                       | Refs de provedor ou backend de CLI cujo hook de autenticação sintética pertencente ao Plugin deve ser sondado durante a descoberta fria de modelo antes do carregamento do runtime.                                             |
| `nonSecretAuthMarkers`               | Não      | `string[]`                       | Valores placeholder de chave de API pertencentes a Plugin integrado que representam estado de credencial não secreta local, OAuth ou de ambiente.                                                                               |
| `commandAliases`                     | Não      | `object[]`                       | Nomes de comando pertencentes a este Plugin que devem produzir configuração com reconhecimento de Plugin e diagnósticos de CLI antes do carregamento do runtime.                                                                 |
| `providerAuthEnvVars`                | Não      | `Record<string, string[]>`       | Metadados leves de env de autenticação de provedor que o OpenClaw pode inspecionar sem carregar o código do Plugin.                                                                                                             |
| `providerAuthAliases`                | Não      | `Record<string, string>`         | IDs de provedores que devem reutilizar outro ID de provedor para busca de autenticação, por exemplo um provedor de codificação que compartilha a chave de API e os perfis de autenticação do provedor base.                    |
| `channelEnvVars`                     | Não      | `Record<string, string[]>`       | Metadados leves de env de canal que o OpenClaw pode inspecionar sem carregar o código do Plugin. Use isso para superfícies de configuração ou autenticação de canal orientadas por env que auxiliares genéricos de inicialização/configuração devem enxergar. |
| `providerAuthChoices`                | Não      | `object[]`                       | Metadados leves de escolhas de autenticação para seletores de onboarding, resolução de provedor preferido e ligação simples de flags da CLI.                                                                                    |
| `activation`                         | Não      | `object`                         | Dicas leves de ativação para carregamento acionado por provedor, comando, canal, rota e capacidade. Apenas metadados; o runtime do Plugin continua sendo dono do comportamento real.                                            |
| `setup`                              | Não      | `object`                         | Descritores leves de configuração/onboarding que superfícies de descoberta e configuração podem inspecionar sem carregar o runtime do Plugin.                                                                                   |
| `qaRunners`                          | Não      | `object[]`                       | Descritores leves de executor de QA usados pelo host compartilhado `openclaw qa` antes do carregamento do runtime do Plugin.                                                                                                    |
| `contracts`                          | Não      | `object`                         | Snapshot estático de capacidade integrada para hooks de autenticação externa, fala, transcrição em tempo real, voz em tempo real, media-understanding, geração de imagem, geração de música, geração de vídeo, web-fetch, pesquisa na web e propriedade de ferramenta. |
| `mediaUnderstandingProviderMetadata` | Não      | `Record<string, object>`         | Padrões leves de media-understanding para IDs de provedores declarados em `contracts.mediaUnderstandingProviders`.                                                                                                               |
| `channelConfigs`                     | Não      | `Record<string, object>`         | Metadados de configuração de canal pertencentes ao manifesto mesclados em superfícies de descoberta e validação antes do carregamento do runtime.                                                                               |
| `skills`                             | Não      | `string[]`                       | Diretórios de Skills a carregar, relativos à raiz do Plugin.                                                                                                                                                                      |
| `name`                               | Não      | `string`                         | Nome legível por humanos do Plugin.                                                                                                                                                                                               |
| `description`                        | Não      | `string`                         | Resumo curto exibido em superfícies de Plugin.                                                                                                                                                                                    |
| `version`                            | Não      | `string`                         | Versão informativa do Plugin.                                                                                                                                                                                                     |
| `uiHints`                            | Não      | `Record<string, object>`         | Rótulos de UI, placeholders e dicas de sensibilidade para campos de configuração.                                                                                                                                                |

## Referência de `providerAuthChoices`

Cada entrada de `providerAuthChoices` descreve uma escolha de onboarding ou autenticação.
O OpenClaw lê isso antes do carregamento do runtime do provedor.

| Field                 | Required | Type                                            | What it means                                                                                              |
| --------------------- | -------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `provider`            | Sim      | `string`                                        | ID do provedor ao qual esta escolha pertence.                                                              |
| `method`              | Sim      | `string`                                        | ID do método de autenticação para encaminhamento.                                                          |
| `choiceId`            | Sim      | `string`                                        | ID estável da escolha de autenticação usado por fluxos de onboarding e CLI.                               |
| `choiceLabel`         | Não      | `string`                                        | Rótulo voltado ao usuário. Se omitido, o OpenClaw recorre a `choiceId`.                                   |
| `choiceHint`          | Não      | `string`                                        | Texto curto de ajuda para o seletor.                                                                       |
| `assistantPriority`   | Não      | `number`                                        | Valores menores são ordenados antes em seletores interativos guiados por assistente.                      |
| `assistantVisibility` | Não      | `"visible"` \| `"manual-only"`                  | Oculta a escolha dos seletores do assistente, mas ainda permite seleção manual pela CLI.                  |
| `deprecatedChoiceIds` | Não      | `string[]`                                      | IDs legados de escolha que devem redirecionar usuários para esta escolha substituta.                      |
| `groupId`             | Não      | `string`                                        | ID opcional de grupo para agrupar escolhas relacionadas.                                                   |
| `groupLabel`          | Não      | `string`                                        | Rótulo voltado ao usuário para esse grupo.                                                                 |
| `groupHint`           | Não      | `string`                                        | Texto curto de ajuda para o grupo.                                                                         |
| `optionKey`           | Não      | `string`                                        | Chave interna de opção para fluxos simples de autenticação com uma única flag.                             |
| `cliFlag`             | Não      | `string`                                        | Nome da flag da CLI, como `--openrouter-api-key`.                                                          |
| `cliOption`           | Não      | `string`                                        | Formato completo da opção da CLI, como `--openrouter-api-key <key>`.                                      |
| `cliDescription`      | Não      | `string`                                        | Descrição usada na ajuda da CLI.                                                                           |
| `onboardingScopes`    | Não      | `Array<"text-inference" \| "image-generation">` | Em quais superfícies de onboarding esta escolha deve aparecer. Se omitido, o padrão é `["text-inference"]`. |

## Referência de `commandAliases`

Use `commandAliases` quando um Plugin é dono de um nome de comando de runtime que usuários podem
por engano colocar em `plugins.allow` ou tentar executar como um comando raiz da CLI. O OpenClaw
usa esses metadados para diagnósticos sem importar o código de runtime do Plugin.

```json
{
  "commandAliases": [
    {
      "name": "dreaming",
      "kind": "runtime-slash",
      "cliCommand": "memory"
    }
  ]
}
```

| Field        | Required | Type              | What it means                                                                |
| ------------ | -------- | ----------------- | ---------------------------------------------------------------------------- |
| `name`       | Sim      | `string`          | Nome do comando que pertence a este Plugin.                                  |
| `kind`       | Não      | `"runtime-slash"` | Marca o alias como um comando de barra do chat, em vez de um comando raiz da CLI. |
| `cliCommand` | Não      | `string`          | Comando raiz relacionado da CLI a sugerir para operações de CLI, se existir. |

## Referência de `activation`

Use `activation` quando o Plugin puder declarar de forma leve quais eventos do plano de controle
devem ativá-lo depois.

## Referência de `qaRunners`

Use `qaRunners` quando um Plugin contribuir com um ou mais executores de transporte sob
a raiz compartilhada `openclaw qa`. Mantenha esses metadados leves e estáticos; o
runtime do Plugin continua sendo dono do registro real da CLI por meio de uma superfície leve
`runtime-api.ts` que exporta `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Executar a faixa de QA ao vivo do Matrix com suporte de Docker contra um homeserver descartável"
    }
  ]
}
```

| Field         | Required | Type     | What it means                                                            |
| ------------- | -------- | -------- | ------------------------------------------------------------------------ |
| `commandName` | Sim      | `string` | Subcomando montado sob `openclaw qa`, por exemplo `matrix`.              |
| `description` | Não      | `string` | Texto de ajuda fallback usado quando o host compartilhado precisa de um comando stub. |

Este bloco é apenas metadados. Ele não registra comportamento de runtime e não
substitui `register(...)`, `setupEntry` nem outros entrypoints de runtime/Plugin.
Consumidores atuais o usam como uma dica de restrição antes de um carregamento mais amplo de Plugin, então
metadados de ativação ausentes normalmente só custam desempenho; isso não deve
mudar a correção enquanto ainda existirem fallbacks legados de propriedade do manifesto.

```json
{
  "activation": {
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| Field            | Required | Type                                                 | What it means                                                          |
| ---------------- | -------- | ---------------------------------------------------- | ---------------------------------------------------------------------- |
| `onProviders`    | Não      | `string[]`                                           | IDs de provedores que devem ativar este Plugin quando solicitados.     |
| `onCommands`     | Não      | `string[]`                                           | IDs de comandos que devem ativar este Plugin.                          |
| `onChannels`     | Não      | `string[]`                                           | IDs de canais que devem ativar este Plugin.                            |
| `onRoutes`       | Não      | `string[]`                                           | Tipos de rota que devem ativar este Plugin.                            |
| `onCapabilities` | Não      | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Dicas amplas de capacidade usadas pelo planejamento de ativação do plano de controle. |

Consumidores ativos atuais:

- o planejamento de CLI acionado por comando recorre ao legado
  `commandAliases[].cliCommand` ou `commandAliases[].name`
- o planejamento de configuração/canal acionado por canal recorre à propriedade
  legada `channels[]` quando faltam metadados explícitos de ativação de canal
- o planejamento de configuração/runtime acionado por provedor recorre à propriedade
  legada `providers[]` e `cliBackends[]` de nível superior quando faltam metadados explícitos
  de ativação de provedor

## Referência de `setup`

Use `setup` quando superfícies de configuração e onboarding precisarem de metadados leves
pertencentes ao Plugin antes do carregamento do runtime.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

`cliBackends` de nível superior continua válido e continua descrevendo backends
de inferência da CLI. `setup.cliBackends` é a superfície de descritor específica de configuração para
fluxos de configuração/plano de controle que devem permanecer somente metadados.

Quando presentes, `setup.providers` e `setup.cliBackends` são a superfície preferida
de busca baseada primeiro em descritor para descoberta de configuração. Se o descritor apenas
restringir o Plugin candidato e a configuração ainda precisar de hooks de runtime mais ricos em tempo de configuração,
defina `requiresRuntime: true` e mantenha `setup-api` no lugar como o
caminho de execução fallback.

Como a busca de configuração pode executar código `setup-api` pertencente ao Plugin, os valores
normalizados de `setup.providers[].id` e `setup.cliBackends[]` devem continuar únicos entre os Plugins
descobertos. Propriedade ambígua falha de forma fechada em vez de escolher um
vencedor pela ordem de descoberta.

### Referência de `setup.providers`

| Field         | Required | Type       | What it means                                                                             |
| ------------- | -------- | ---------- | ----------------------------------------------------------------------------------------- |
| `id`          | Sim      | `string`   | ID do provedor exposto durante configuração ou onboarding. Mantenha IDs normalizados globalmente únicos. |
| `authMethods` | Não      | `string[]` | IDs de métodos de configuração/autenticação que este provedor oferece sem carregar o runtime completo. |
| `envVars`     | Não      | `string[]` | Variáveis de ambiente que superfícies genéricas de configuração/status podem verificar antes do carregamento do runtime do Plugin. |

### Campos de `setup`

| Field              | Required | Type       | What it means                                                                                          |
| ------------------ | -------- | ---------- | ------------------------------------------------------------------------------------------------------ |
| `providers`        | Não      | `object[]` | Descritores de configuração de provedor expostos durante configuração e onboarding.                    |
| `cliBackends`      | Não      | `string[]` | IDs de backend em tempo de configuração usados para busca baseada primeiro em descritor. Mantenha IDs normalizados globalmente únicos. |
| `configMigrations` | Não      | `string[]` | IDs de migração de configuração pertencentes à superfície de configuração deste Plugin.                |
| `requiresRuntime`  | Não      | `boolean`  | Se a configuração ainda precisa da execução de `setup-api` após a busca por descritor.                |

## Referência de `uiHints`

`uiHints` é um mapa de nomes de campos de configuração para pequenas dicas de renderização.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "Used for OpenRouter requests",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Cada dica de campo pode incluir:

| Field         | Type       | What it means                             |
| ------------- | ---------- | ----------------------------------------- |
| `label`       | `string`   | Rótulo do campo voltado ao usuário.       |
| `help`        | `string`   | Texto curto de ajuda.                     |
| `tags`        | `string[]` | Tags opcionais de UI.                     |
| `advanced`    | `boolean`  | Marca o campo como avançado.              |
| `sensitive`   | `boolean`  | Marca o campo como secreto ou sensível.   |
| `placeholder` | `string`   | Texto placeholder para entradas de formulário. |

## Referência de `contracts`

Use `contracts` apenas para metadados estáticos de propriedade de capacidade que o OpenClaw pode
ler sem importar o runtime do Plugin.

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "mediaUnderstandingProviders": ["openai", "openai-codex"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Cada lista é opcional:

| Field                            | Type       | What it means                                                          |
| -------------------------------- | ---------- | ---------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | IDs de runtime integrado para os quais um Plugin integrado pode registrar fábricas. |
| `externalAuthProviders`          | `string[]` | IDs de provedores cujo hook de perfil de autenticação externa pertence a este Plugin. |
| `speechProviders`                | `string[]` | IDs de provedores de fala pertencentes a este Plugin.                  |
| `realtimeTranscriptionProviders` | `string[]` | IDs de provedores de transcrição em tempo real pertencentes a este Plugin. |
| `realtimeVoiceProviders`         | `string[]` | IDs de provedores de voz em tempo real pertencentes a este Plugin.     |
| `mediaUnderstandingProviders`    | `string[]` | IDs de provedores de media-understanding pertencentes a este Plugin.   |
| `imageGenerationProviders`       | `string[]` | IDs de provedores de geração de imagem pertencentes a este Plugin.     |
| `videoGenerationProviders`       | `string[]` | IDs de provedores de geração de vídeo pertencentes a este Plugin.      |
| `webFetchProviders`              | `string[]` | IDs de provedores de web-fetch pertencentes a este Plugin.             |
| `webSearchProviders`             | `string[]` | IDs de provedores de pesquisa na web pertencentes a este Plugin.       |
| `tools`                          | `string[]` | Nomes de ferramentas do agente pertencentes a este Plugin para verificações de contrato integrado. |

Plugins de provedor que implementam `resolveExternalAuthProfiles` devem declarar
`contracts.externalAuthProviders`. Plugins sem essa declaração ainda são executados
por meio de um fallback de compatibilidade obsoleto, mas esse fallback é mais lento e
será removido após a janela de migração.

## Referência de `mediaUnderstandingProviderMetadata`

Use `mediaUnderstandingProviderMetadata` quando um provedor de media-understanding tiver
modelos padrão, prioridade de fallback de autenticação automática ou suporte nativo a documentos que
auxiliares genéricos do core precisem antes do carregamento do runtime. As chaves também devem ser declaradas em
`contracts.mediaUnderstandingProviders`.

```json
{
  "contracts": {
    "mediaUnderstandingProviders": ["example"]
  },
  "mediaUnderstandingProviderMetadata": {
    "example": {
      "capabilities": ["image", "audio"],
      "defaultModels": {
        "image": "example-vision-latest",
        "audio": "example-transcribe-latest"
      },
      "autoPriority": {
        "image": 40
      },
      "nativeDocumentInputs": ["pdf"]
    }
  }
}
```

Cada entrada de provedor pode incluir:

| Field                  | Type                                | What it means                                                                 |
| ---------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capacidades de mídia expostas por este provedor.                              |
| `defaultModels`        | `Record<string, string>`            | Padrões de capacidade para modelo usados quando a configuração não especifica um modelo. |
| `autoPriority`         | `Record<string, number>`            | Números menores são ordenados antes para fallback automático de provedor baseado em credenciais. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Entradas nativas de documento compatíveis com o provedor.                     |

## Referência de `channelConfigs`

Use `channelConfigs` quando um Plugin de canal precisar de metadados leves de configuração antes do
carregamento do runtime.

```json
{
  "channelConfigs": {
    "matrix": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "homeserverUrl": { "type": "string" }
        }
      },
      "uiHints": {
        "homeserverUrl": {
          "label": "URL do homeserver",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Conexão com homeserver Matrix",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Cada entrada de canal pode incluir:

| Field         | Type                     | What it means                                                                                  |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema para `channels.<id>`. Obrigatório para cada entrada declarada de configuração de canal. |
| `uiHints`     | `Record<string, object>` | Rótulos/placeholders/dicas de sensibilidade de UI opcionais para essa seção de configuração do canal. |
| `label`       | `string`                 | Rótulo do canal mesclado em superfícies de seleção e inspeção quando os metadados de runtime ainda não estiverem prontos. |
| `description` | `string`                 | Descrição curta do canal para superfícies de inspeção e catálogo.                              |
| `preferOver`  | `string[]`               | IDs de Plugin legados ou de menor prioridade que este canal deve superar em superfícies de seleção. |

## Referência de `modelSupport`

Use `modelSupport` quando o OpenClaw deve inferir seu Plugin de provedor a partir de
IDs abreviados de modelo como `gpt-5.4` ou `claude-sonnet-4.6` antes do carregamento do runtime
do Plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

O OpenClaw aplica esta precedência:

- refs explícitas `provider/model` usam os metadados de manifesto `providers` do respectivo proprietário
- `modelPatterns` têm precedência sobre `modelPrefixes`
- se um Plugin não integrado e um Plugin integrado corresponderem ao mesmo tempo, o Plugin não integrado vence
- a ambiguidade restante é ignorada até que o usuário ou a configuração especifique um provedor

Campos:

| Field           | Type       | What it means                                                                        |
| --------------- | ---------- | ------------------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | Prefixos correspondidos com `startsWith` em relação a IDs abreviados de modelo.      |
| `modelPatterns` | `string[]` | Fontes de regex correspondidas em relação a IDs abreviados de modelo após remoção do sufixo do perfil. |

Chaves legadas de capacidade de nível superior estão obsoletas. Use `openclaw doctor --fix` para
mover `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` e `webSearchProviders` para `contracts`; o carregamento normal
do manifesto não trata mais esses campos de nível superior como
propriedade de capacidade.

## Manifesto versus package.json

Os dois arquivos têm funções diferentes:

| File                   | Use it for                                                                                                                          |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Descoberta, validação de configuração, metadados de escolha de autenticação e dicas de UI que precisam existir antes da execução do código do Plugin |
| `package.json`         | Metadados npm, instalação de dependências e o bloco `openclaw` usado para entrypoints, controle de instalação, configuração ou metadados de catálogo |

Se você não tiver certeza de onde um metadado deve ficar, use esta regra:

- se o OpenClaw precisar conhecê-lo antes de carregar o código do Plugin, coloque-o em `openclaw.plugin.json`
- se ele for sobre empacotamento, arquivos de entrada ou comportamento de instalação npm, coloque-o em `package.json`

### Campos de `package.json` que afetam a descoberta

Alguns metadados de Plugin em pré-runtime vivem intencionalmente em `package.json` sob o
bloco `openclaw`, em vez de `openclaw.plugin.json`.

Exemplos importantes:

| Field                                                             | What it means                                                                                                                                                                         |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Declara entrypoints nativos de Plugin. Deve permanecer dentro do diretório do pacote do Plugin.                                                                                      |
| `openclaw.runtimeExtensions`                                      | Declara entrypoints de runtime em JavaScript já compilado para pacotes instalados. Deve permanecer dentro do diretório do pacote do Plugin.                                         |
| `openclaw.setupEntry`                                             | Entrypoint leve somente de configuração usado durante onboarding, inicialização adiada de canal e descoberta somente leitura de status de canal/SecretRef. Deve permanecer dentro do diretório do pacote do Plugin. |
| `openclaw.runtimeSetupEntry`                                      | Declara o entrypoint de configuração em JavaScript já compilado para pacotes instalados. Deve permanecer dentro do diretório do pacote do Plugin.                                   |
| `openclaw.channel`                                                | Metadados leves de catálogo de canal, como rótulos, caminhos de documentação, aliases e texto de seleção.                                                                            |
| `openclaw.channel.configuredState`                                | Metadados leves de verificação de estado configurado que podem responder "já existe configuração somente por env?" sem carregar o runtime completo do canal.                         |
| `openclaw.channel.persistedAuthState`                             | Metadados leves de verificação de autenticação persistida que podem responder "já existe algo autenticado?" sem carregar o runtime completo do canal.                                |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Dicas de instalação/atualização para Plugins integrados e publicados externamente.                                                                                                    |
| `openclaw.install.defaultChoice`                                  | Caminho de instalação preferido quando várias fontes de instalação estão disponíveis.                                                                                                 |
| `openclaw.install.minHostVersion`                                 | Versão mínima compatível do host OpenClaw, usando um piso de semver como `>=2026.3.22`.                                                                                              |
| `openclaw.install.expectedIntegrity`                              | String esperada de integridade do dist npm, como `sha512-...`; fluxos de instalação e atualização verificam o artefato obtido em relação a ela.                                     |
| `openclaw.install.allowInvalidConfigRecovery`                     | Permite um caminho estreito de recuperação por reinstalação de Plugin integrado quando a configuração está inválida.                                                                  |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permite que superfícies de canal somente de configuração sejam carregadas antes do Plugin completo do canal durante a inicialização.                                                 |

Os metadados do manifesto decidem quais escolhas de provedor/canal/configuração aparecem no
onboarding antes do carregamento do runtime. `package.json#openclaw.install` informa ao
onboarding como obter ou ativar esse Plugin quando o usuário escolhe uma dessas
opções. Não mova dicas de instalação para `openclaw.plugin.json`.

`openclaw.install.minHostVersion` é aplicado durante a instalação e o carregamento do
registro de manifesto. Valores inválidos são rejeitados; valores válidos, porém mais novos, ignoram o
Plugin em hosts mais antigos.

A fixação exata de versão npm já vive em `npmSpec`, por exemplo
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Combine isso com
`expectedIntegrity` quando quiser que fluxos de atualização falhem de forma fechada se o artefato
npm obtido não corresponder mais à versão fixada. O onboarding interativo
oferece npm specs de registro confiável, incluindo nomes simples de pacote e dist-tags.
Quando `expectedIntegrity` está presente, os fluxos de instalação/atualização o aplicam; quando
ele é omitido, a resolução do registro é registrada sem um pin de integridade.

Plugins de canal devem fornecer `openclaw.setupEntry` quando status, lista de canais
ou varreduras de SecretRef precisarem identificar contas configuradas sem carregar o runtime
completo. O entrypoint de configuração deve expor metadados de canal mais adaptadores seguros
de configuração, status e segredos; mantenha clientes de rede, listeners de Gateway e
runtimes de transporte no entrypoint principal da extensão.

Campos de entrypoint de runtime não substituem verificações de limite de pacote para
campos de entrypoint de origem. Por exemplo, `openclaw.runtimeExtensions` não pode tornar
carregável um caminho de `openclaw.extensions` que escape do pacote.

`openclaw.install.allowInvalidConfigRecovery` é intencionalmente estreito. Isso
não torna configurações arbitrariamente quebradas instaláveis. Hoje ele só permite que fluxos
de instalação se recuperem de falhas específicas e obsoletas de upgrade de Plugin integrado, como um
caminho ausente de Plugin integrado ou uma entrada obsoleta `channels.<id>` para esse mesmo
Plugin integrado. Erros de configuração não relacionados ainda bloqueiam a instalação e enviam operadores
para `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` é metadado de pacote para um pequeno módulo
de verificação:

```json
{
  "openclaw": {
    "channel": {
      "id": "whatsapp",
      "persistedAuthState": {
        "specifier": "./auth-presence",
        "exportName": "hasAnyWhatsAppAuth"
      }
    }
  }
}
```

Use isso quando fluxos de configuração, doctor ou estado configurado precisarem de uma
sonda leve de autenticação sim/não antes do carregamento do Plugin completo do canal. A exportação de destino deve ser uma função pequena
que leia apenas o estado persistido; não a encaminhe pelo barrel completo
de runtime do canal.

`openclaw.channel.configuredState` segue o mesmo formato para verificações leves de
estado configurado somente por env:

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "specifier": "./configured-state",
        "exportName": "hasTelegramConfiguredState"
      }
    }
  }
}
```

Use isso quando um canal puder responder ao estado configurado a partir de env ou de outras entradas
mínimas que não sejam de runtime. Se a verificação precisar da resolução completa de configuração ou do
runtime real do canal, mantenha essa lógica no hook `config.hasConfiguredState` do Plugin.

## Precedência de descoberta (IDs de Plugin duplicados)

O OpenClaw descobre Plugins em várias raízes (integrados, instalação global, workspace, caminhos explicitamente selecionados pela configuração). Se duas descobertas compartilharem o mesmo `id`, apenas o manifesto de **maior precedência** é mantido; duplicatas de precedência inferior são descartadas em vez de serem carregadas ao lado dele.

Precedência, da maior para a menor:

1. **Selecionado pela configuração** — um caminho explicitamente fixado em `plugins.entries.<id>`
2. **Integrado** — Plugins distribuídos com o OpenClaw
3. **Instalação global** — Plugins instalados na raiz global de Plugins do OpenClaw
4. **Workspace** — Plugins descobertos em relação ao workspace atual

Implicações:

- Um fork ou cópia obsoleta de um Plugin integrado no workspace não irá sombrear a build integrada.
- Para realmente substituir um Plugin integrado por um local, fixe-o via `plugins.entries.<id>` para que ele vença por precedência em vez de depender da descoberta no workspace.
- Descartes de duplicatas são registrados em log para que o Doctor e os diagnósticos de inicialização possam apontar para a cópia descartada.

## Requisitos de JSON Schema

- **Todo Plugin deve fornecer um JSON Schema**, mesmo que não aceite configuração.
- Um schema vazio é aceitável (por exemplo, `{ "type": "object", "additionalProperties": false }`).
- Schemas são validados no momento de leitura/gravação da configuração, não em runtime.

## Comportamento de validação

- Chaves desconhecidas em `channels.*` são **erros**, a menos que o ID do canal seja declarado por
  um manifesto de Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*`
  devem referenciar IDs de Plugin **descobráveis**. IDs desconhecidos são **erros**.
- Se um Plugin estiver instalado, mas tiver um manifesto ou schema ausente ou quebrado,
  a validação falha e o Doctor relata o erro do Plugin.
- Se a configuração do Plugin existir, mas o Plugin estiver **desativado**, a configuração é mantida e
  um **aviso** é exibido no Doctor + logs.

Veja [Referência de configuração](/pt-BR/gateway/configuration) para o schema completo de `plugins.*`.

## Observações

- O manifesto é **obrigatório para Plugins nativos do OpenClaw**, incluindo carregamentos do sistema de arquivos local.
- O runtime ainda carrega separadamente o módulo do Plugin; o manifesto é apenas para
  descoberta + validação.
- Manifestos nativos são analisados com JSON5, então comentários, vírgulas finais e
  chaves sem aspas são aceitos, desde que o valor final ainda seja um objeto.
- Apenas campos documentados do manifesto são lidos pelo carregador de manifesto. Evite adicionar
  chaves de nível superior personalizadas aqui.
- `providerAuthEnvVars` é o caminho leve de metadados para sondas de autenticação, validação
  de marcador env e superfícies semelhantes de autenticação de provedor que não devem inicializar o runtime
  do Plugin apenas para inspecionar nomes de env.
- `providerAuthAliases` permite que variantes de provedor reutilizem as variáveis env de autenticação,
  perfis de autenticação, autenticação baseada em configuração e escolha de onboarding de chave de API
  de outro provedor sem codificar rigidamente essa relação no core.
- `providerEndpoints` permite que Plugins de provedor sejam donos de metadados simples de
  correspondência de host/baseUrl de endpoint. Use isso apenas para classes de endpoint que o core já oferece suporte;
  o Plugin continua sendo dono do comportamento de runtime.
- `syntheticAuthRefs` é o caminho leve de metadados para hooks de autenticação
  sintética pertencentes ao provedor que precisam ficar visíveis para a descoberta fria de modelo antes da existência do registro de runtime. Liste apenas refs cujo provedor de runtime ou backend de CLI realmente
  implemente `resolveSyntheticAuth`.
- `nonSecretAuthMarkers` é o caminho leve de metadados para chaves de API placeholder
  pertencentes a Plugins integrados, como marcadores de credenciais locais, OAuth ou de ambiente.
  O core trata essas chaves como não secretas para exibição de autenticação e auditorias de segredo sem
  codificar rigidamente o provedor proprietário.
- `channelEnvVars` é o caminho leve de metadados para fallback de env de shell, prompts de configuração
  e superfícies semelhantes de canal que não devem inicializar o runtime do Plugin
  apenas para inspecionar nomes de env. Nomes de env são metadados, não ativação por
  si só: status, auditoria, validação de entrega de Cron e outras superfícies somente leitura ainda
  aplicam confiança de Plugin e política de ativação efetiva antes de
  tratar uma variável de ambiente como um canal configurado.
- `providerAuthChoices` é o caminho leve de metadados para seletores de escolha de autenticação,
  resolução de `--auth-choice`, mapeamento de provedor preferido e registro simples
  de flag de CLI de onboarding antes do carregamento do runtime do provedor. Para metadados do assistente em runtime
  que exigem código do provedor, veja
  [Hooks de runtime do provedor](/pt-BR/plugins/architecture#provider-runtime-hooks).
- Tipos exclusivos de Plugin são selecionados por `plugins.slots.*`.
  - `kind: "memory"` é selecionado por `plugins.slots.memory`.
  - `kind: "context-engine"` é selecionado por `plugins.slots.contextEngine`
    (padrão: `legacy` integrado).
- `channels`, `providers`, `cliBackends` e `skills` podem ser omitidos quando um
  Plugin não precisar deles.
- Se o seu Plugin depender de módulos nativos, documente as etapas de build e quaisquer
  requisitos de allowlist do gerenciador de pacotes (por exemplo, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Relacionado

- [Criando Plugins](/pt-BR/plugins/building-plugins) — introdução aos Plugins
- [Arquitetura de Plugin](/pt-BR/plugins/architecture) — arquitetura interna
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência do SDK de Plugin
