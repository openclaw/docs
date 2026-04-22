---
read_when:
    - Você está criando um Plugin do OpenClaw
    - Você precisa entregar um schema de configuração de Plugin ou depurar erros de validação de Plugin
summary: Manifesto de Plugin + requisitos de schema JSON (validação estrita de configuração)
title: Manifesto de Plugin
x-i18n:
    generated_at: "2026-04-22T04:23:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 52a52f7e2c78bbef2cc51ade6eb12b6edc950237bdfc478f6e82248374c687bf
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifesto de Plugin (openclaw.plugin.json)

Esta página é apenas para o **manifesto nativo de Plugin do OpenClaw**.

Para layouts de bundle compatíveis, consulte [Bundles de Plugin](/pt-BR/plugins/bundles).

Formatos de bundle compatíveis usam arquivos de manifesto diferentes:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` ou o layout padrão de componente Claude
  sem manifesto
- Bundle Cursor: `.cursor-plugin/plugin.json`

O OpenClaw também detecta automaticamente esses layouts de bundle, mas eles não são validados
em relação ao schema `openclaw.plugin.json` descrito aqui.

Para bundles compatíveis, o OpenClaw atualmente lê metadados do bundle mais as
raízes de skill declaradas, raízes de comandos Claude, padrões de `settings.json` do bundle Claude,
padrões de LSP do bundle Claude e pacotes de hooks compatíveis quando o layout corresponde
às expectativas de runtime do OpenClaw.

Todo Plugin nativo do OpenClaw **deve** incluir um arquivo `openclaw.plugin.json` na
**raiz do Plugin**. O OpenClaw usa esse manifesto para validar a configuração
**sem executar o código do Plugin**. Manifestos ausentes ou inválidos são tratados como
erros de Plugin e bloqueiam a validação da configuração.

Consulte o guia completo do sistema de plugins: [Plugins](/pt-BR/tools/plugin).
Para o modelo nativo de capacidades e a orientação atual de compatibilidade externa:
[Modelo de capacidades](/pt-BR/plugins/architecture#public-capability-model).

## O que esse arquivo faz

`openclaw.plugin.json` são os metadados que o OpenClaw lê antes de carregar o código do seu
Plugin.

Use-o para:

- identidade do Plugin
- validação de configuração
- metadados de autenticação e onboarding que devem estar disponíveis sem iniciar o
  runtime do Plugin
- dicas baratas de ativação que superfícies do plano de controle podem inspecionar antes de o runtime
  carregar
- descritores baratos de configuração que superfícies de setup/onboarding podem inspecionar antes de o
  runtime carregar
- metadados de alias e auto-enable que devem ser resolvidos antes de o runtime do Plugin carregar
- metadados abreviados de propriedade de família de modelos que devem ativar automaticamente o
  Plugin antes de o runtime carregar
- instantâneos estáticos de propriedade de capacidades usados para compat wiring bundled e
  cobertura de contrato
- metadados baratos do executor de QA que o host compartilhado `openclaw qa` pode inspecionar
  antes de o runtime do Plugin carregar
- metadados de configuração específicos de canal que devem ser mesclados em superfícies de catálogo e validação
  sem carregar o runtime
- dicas de UI de configuração

Não o use para:

- registrar comportamento de runtime
- declarar entrypoints de código
- metadados de instalação do npm

Esses pertencem ao código do seu Plugin e a `package.json`.

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

| Campo                               | Obrigatório | Tipo                             | O que significa                                                                                                                                                                                              |
| ----------------------------------- | ----------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Sim         | `string`                         | ID canônico do Plugin. Este é o ID usado em `plugins.entries.<id>`.                                                                                                                                         |
| `configSchema`                      | Sim         | `object`                         | Schema JSON inline para a configuração deste Plugin.                                                                                                                                                         |
| `enabledByDefault`                  | Não         | `true`                           | Marca um Plugin bundled como habilitado por padrão. Omita-o, ou defina qualquer valor diferente de `true`, para manter o Plugin desabilitado por padrão.                                                   |
| `legacyPluginIds`                   | Não         | `string[]`                       | IDs legados que são normalizados para este ID canônico de Plugin.                                                                                                                                            |
| `autoEnableWhenConfiguredProviders` | Não         | `string[]`                       | IDs de provedor que devem habilitar automaticamente este Plugin quando autenticação, configuração ou referências de modelo os mencionarem.                                                                  |
| `kind`                              | Não         | `"memory"` \| `"context-engine"` | Declara um tipo exclusivo de Plugin usado por `plugins.slots.*`.                                                                                                                                             |
| `channels`                          | Não         | `string[]`                       | IDs de canal pertencentes a este Plugin. Usado para descoberta e validação de configuração.                                                                                                                 |
| `providers`                         | Não         | `string[]`                       | IDs de provedor pertencentes a este Plugin.                                                                                                                                                                  |
| `modelSupport`                      | Não         | `object`                         | Metadados abreviados de família de modelos pertencentes ao manifesto, usados para carregar automaticamente o Plugin antes do runtime.                                                                       |
| `providerEndpoints`                 | Não         | `object[]`                       | Metadados de host/baseUrl de endpoint pertencentes ao manifesto para rotas de provedor que o core precisa classificar antes de o runtime do provedor carregar.                                            |
| `cliBackends`                       | Não         | `string[]`                       | IDs de backend de inferência CLI pertencentes a este Plugin. Usado para autoativação na inicialização a partir de referências explícitas de configuração.                                                  |
| `syntheticAuthRefs`                 | Não         | `string[]`                       | Referências de provedor ou backend CLI cujo hook sintético de autenticação pertencente ao Plugin deve ser sondado durante a descoberta fria de modelos antes de o runtime carregar.                        |
| `nonSecretAuthMarkers`              | Não         | `string[]`                       | Valores de chave de API placeholder pertencentes a Plugin bundled que representam estado não secreto de credencial local, OAuth ou ambiente.                                                               |
| `commandAliases`                    | Não         | `object[]`                       | Nomes de comando pertencentes a este Plugin que devem produzir diagnósticos de configuração e CLI com reconhecimento do Plugin antes de o runtime carregar.                                                |
| `providerAuthEnvVars`               | Não         | `Record<string, string[]>`       | Metadados baratos de env de autenticação de provedor que o OpenClaw pode inspecionar sem carregar o código do Plugin.                                                                                      |
| `providerAuthAliases`               | Não         | `Record<string, string>`         | IDs de provedor que devem reutilizar outro ID de provedor para lookup de autenticação, por exemplo um provedor de coding que compartilha a chave de API e os perfis de autenticação do provedor base.     |
| `channelEnvVars`                    | Não         | `Record<string, string[]>`       | Metadados baratos de env de canal que o OpenClaw pode inspecionar sem carregar o código do Plugin. Use isto para superfícies de setup ou autenticação de canal orientadas por env que helpers genéricos de inicialização/configuração devem enxergar. |
| `providerAuthChoices`               | Não         | `object[]`                       | Metadados baratos de escolha de autenticação para seletores de onboarding, resolução de provedor preferido e ligação simples de flags de CLI.                                                             |
| `activation`                        | Não         | `object`                         | Dicas baratas de ativação para carregamento acionado por provedor, comando, canal, rota e capacidade. Apenas metadados; o runtime do Plugin continua sendo dono do comportamento real.                   |
| `setup`                             | Não         | `object`                         | Descritores baratos de setup/onboarding que superfícies de descoberta e setup podem inspecionar sem carregar o runtime do Plugin.                                                                          |
| `qaRunners`                         | Não         | `object[]`                       | Descritores baratos de executor de QA usados pelo host compartilhado `openclaw qa` antes de o runtime do Plugin carregar.                                                                                 |
| `contracts`                         | Não         | `object`                         | Instantâneo estático de capacidades bundled para fala, transcrição em tempo real, voz em tempo real, compreensão de mídia, geração de imagens, geração de música, geração de vídeo, web-fetch, busca na web e propriedade de ferramentas. |
| `channelConfigs`                    | Não         | `Record<string, object>`         | Metadados de configuração de canal pertencentes ao manifesto, mesclados em superfícies de descoberta e validação antes de o runtime carregar.                                                             |
| `skills`                            | Não         | `string[]`                       | Diretórios de Skills para carregar, relativos à raiz do Plugin.                                                                                                                                              |
| `name`                              | Não         | `string`                         | Nome legível do Plugin.                                                                                                                                                                                       |
| `description`                       | Não         | `string`                         | Resumo curto mostrado nas superfícies do Plugin.                                                                                                                                                              |
| `version`                           | Não         | `string`                         | Versão informativa do Plugin.                                                                                                                                                                                 |
| `uiHints`                           | Não         | `Record<string, object>`         | Rótulos de UI, placeholders e dicas de sensibilidade para campos de configuração.                                                                                                                            |

## Referência de `providerAuthChoices`

Cada entrada de `providerAuthChoices` descreve uma escolha de onboarding ou autenticação.
O OpenClaw lê isso antes de o runtime do provedor carregar.

| Campo                 | Obrigatório | Tipo                                            | O que significa                                                                                           |
| --------------------- | ----------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | Sim         | `string`                                        | ID do provedor ao qual esta escolha pertence.                                                             |
| `method`              | Sim         | `string`                                        | ID do método de autenticação para despacho.                                                               |
| `choiceId`            | Sim         | `string`                                        | ID estável de escolha de autenticação usado por fluxos de onboarding e CLI.                               |
| `choiceLabel`         | Não         | `string`                                        | Rótulo visível para o usuário. Se omitido, o OpenClaw usa `choiceId` como fallback.                      |
| `choiceHint`          | Não         | `string`                                        | Texto curto de ajuda para o seletor.                                                                      |
| `assistantPriority`   | Não         | `number`                                        | Valores menores são ordenados antes em seletores interativos orientados por assistente.                  |
| `assistantVisibility` | Não         | `"visible"` \| `"manual-only"`                  | Oculta a escolha dos seletores do assistente, ainda permitindo a seleção manual por CLI.                 |
| `deprecatedChoiceIds` | Não         | `string[]`                                      | IDs legados de escolha que devem redirecionar usuários para esta escolha de substituição.                |
| `groupId`             | Não         | `string`                                        | ID opcional de grupo para agrupar escolhas relacionadas.                                                 |
| `groupLabel`          | Não         | `string`                                        | Rótulo visível para o usuário desse grupo.                                                               |
| `groupHint`           | Não         | `string`                                        | Texto curto de ajuda para o grupo.                                                                       |
| `optionKey`           | Não         | `string`                                        | Chave interna de opção para fluxos simples de autenticação com uma única flag.                           |
| `cliFlag`             | Não         | `string`                                        | Nome da flag de CLI, como `--openrouter-api-key`.                                                        |
| `cliOption`           | Não         | `string`                                        | Formato completo da opção de CLI, como `--openrouter-api-key <key>`.                                     |
| `cliDescription`      | Não         | `string`                                        | Descrição usada na ajuda da CLI.                                                                         |
| `onboardingScopes`    | Não         | `Array<"text-inference" \| "image-generation">` | Em quais superfícies de onboarding esta escolha deve aparecer. Se omitido, o padrão é `["text-inference"]`. |

## Referência de `commandAliases`

Use `commandAliases` quando um Plugin for dono de um nome de comando em runtime que usuários podem
colocar por engano em `plugins.allow` ou tentar executar como um comando CLI de raiz. O OpenClaw
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

| Campo        | Obrigatório | Tipo              | O que significa                                                           |
| ------------ | ----------- | ----------------- | ------------------------------------------------------------------------- |
| `name`       | Sim         | `string`          | Nome do comando que pertence a este Plugin.                               |
| `kind`       | Não         | `"runtime-slash"` | Marca o alias como um comando de barra de chat, e não como um comando CLI de raiz. |
| `cliCommand` | Não         | `string`          | Comando CLI de raiz relacionado a sugerir para operações de CLI, se existir. |

## Referência de `activation`

Use `activation` quando o Plugin puder declarar de forma barata quais eventos do plano de controle
devem ativá-lo depois.

## Referência de `qaRunners`

Use `qaRunners` quando um Plugin contribuir com um ou mais executores de transporte sob
a raiz compartilhada `openclaw qa`. Mantenha esses metadados baratos e estáticos; o runtime do Plugin
continua sendo dono do registro real da CLI por meio de uma superfície leve
`runtime-api.ts` que exporta `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Executa a faixa de QA ao vivo do Matrix com Docker contra um homeserver descartável"
    }
  ]
}
```

| Campo         | Obrigatório | Tipo     | O que significa                                                      |
| ------------- | ----------- | -------- | -------------------------------------------------------------------- |
| `commandName` | Sim         | `string` | Subcomando montado sob `openclaw qa`, por exemplo `matrix`.          |
| `description` | Não         | `string` | Texto de ajuda de fallback usado quando o host compartilhado precisa de um comando stub. |

Esse bloco é apenas metadado. Ele não registra comportamento de runtime e não
substitui `register(...)`, `setupEntry` nem outros entrypoints de runtime/Plugin.
Consumidores atuais o usam como dica de refinamento antes de um carregamento mais amplo do Plugin, então
metadados de ativação ausentes normalmente só custam desempenho; isso não deve
alterar a correção enquanto fallbacks legados de propriedade do manifesto ainda existirem.

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

| Campo            | Obrigatório | Tipo                                                 | O que significa                                                     |
| ---------------- | ----------- | ---------------------------------------------------- | ------------------------------------------------------------------- |
| `onProviders`    | Não         | `string[]`                                           | IDs de provedor que devem ativar este Plugin quando solicitados.    |
| `onCommands`     | Não         | `string[]`                                           | IDs de comando que devem ativar este Plugin.                        |
| `onChannels`     | Não         | `string[]`                                           | IDs de canal que devem ativar este Plugin.                          |
| `onRoutes`       | Não         | `string[]`                                           | Tipos de rota que devem ativar este Plugin.                         |
| `onCapabilities` | Não         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Dicas amplas de capacidade usadas pelo planejamento de ativação do plano de controle. |

Consumidores ativos atuais:

- o planejamento de CLI acionado por comando usa fallback para
  `commandAliases[].cliCommand` ou `commandAliases[].name` legados
- o planejamento de setup/canal acionado por canal usa fallback para a propriedade
  legada `channels[]` quando metadados explícitos de ativação de canal estão ausentes
- o planejamento de setup/runtime acionado por provedor usa fallback para a propriedade
  legada `providers[]` e `cliBackends[]` de nível superior quando metadados explícitos de
  ativação de provedor estão ausentes

## Referência de `setup`

Use `setup` quando superfícies de setup e onboarding precisarem de metadados baratos pertencentes ao Plugin
antes de o runtime carregar.

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

`cliBackends` de nível superior continua válido e continua descrevendo
backends de inferência CLI. `setup.cliBackends` é a superfície de descritor específica de setup para
fluxos de plano de controle/setup que devem permanecer apenas como metadados.

Quando presentes, `setup.providers` e `setup.cliBackends` são a superfície
preferida de lookup baseada em descritor para descoberta de setup. Se o descritor apenas
restringir o Plugin candidato e o setup ainda precisar de hooks de runtime mais ricos no momento do setup,
defina `requiresRuntime: true` e mantenha `setup-api` como
caminho de execução de fallback.

Como o lookup de setup pode executar código `setup-api` pertencente ao Plugin, os valores normalizados
de `setup.providers[].id` e `setup.cliBackends[]` devem permanecer únicos entre os
plugins descobertos. Propriedade ambígua falha em modo fechado em vez de escolher um
vencedor com base na ordem de descoberta.

### Referência de `setup.providers`

| Campo         | Obrigatório | Tipo       | O que significa                                                                   |
| ------------- | ----------- | ---------- | --------------------------------------------------------------------------------- |
| `id`          | Sim         | `string`   | ID do provedor exposto durante setup ou onboarding. Mantenha IDs normalizados globalmente únicos. |
| `authMethods` | Não         | `string[]` | IDs de método de setup/autenticação compatíveis com este provedor sem carregar o runtime completo. |
| `envVars`     | Não         | `string[]` | Variáveis de ambiente que superfícies genéricas de setup/status podem verificar antes de o runtime do Plugin carregar. |

### Campos de `setup`

| Campo              | Obrigatório | Tipo       | O que significa                                                                                      |
| ------------------ | ----------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `providers`        | Não         | `object[]` | Descritores de setup de provedor expostos durante setup e onboarding.                                |
| `cliBackends`      | Não         | `string[]` | IDs de backend em tempo de setup usados para lookup de setup orientado por descritor. Mantenha IDs normalizados globalmente únicos. |
| `configMigrations` | Não         | `string[]` | IDs de migração de configuração pertencentes à superfície de setup deste Plugin.                     |
| `requiresRuntime`  | Não         | `boolean`  | Se o setup ainda precisa executar `setup-api` após o lookup do descritor.                            |

## Referência de `uiHints`

`uiHints` é um mapa de nomes de campos de configuração para pequenas dicas de renderização.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "Chave de API",
      "help": "Usada para solicitações do OpenRouter",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Cada dica de campo pode incluir:

| Campo         | Tipo       | O que significa                         |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Rótulo do campo visível para o usuário. |
| `help`        | `string`   | Texto curto de ajuda.                   |
| `tags`        | `string[]` | Tags de UI opcionais.                   |
| `advanced`    | `boolean`  | Marca o campo como avançado.            |
| `sensitive`   | `boolean`  | Marca o campo como secreto ou sensível. |
| `placeholder` | `string`   | Texto de placeholder para entradas de formulário. |

## Referência de `contracts`

Use `contracts` apenas para metadados estáticos de propriedade de capacidades que o OpenClaw possa
ler sem importar o runtime do Plugin.

```json
{
  "contracts": {
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

| Campo                           | Tipo       | O que significa                                                  |
| -------------------------------- | ---------- | -------------------------------------------------------------- |
| `speechProviders`                | `string[]` | IDs de provedor de fala que pertencem a este Plugin.          |
| `realtimeTranscriptionProviders` | `string[]` | IDs de provedor de transcrição em tempo real que pertencem a este Plugin. |
| `realtimeVoiceProviders`         | `string[]` | IDs de provedor de voz em tempo real que pertencem a este Plugin. |
| `mediaUnderstandingProviders`    | `string[]` | IDs de provedor de compreensão de mídia que pertencem a este Plugin. |
| `imageGenerationProviders`       | `string[]` | IDs de provedor de geração de imagem que pertencem a este Plugin. |
| `videoGenerationProviders`       | `string[]` | IDs de provedor de geração de vídeo que pertencem a este Plugin. |
| `webFetchProviders`              | `string[]` | IDs de provedor de web-fetch que pertencem a este Plugin.      |
| `webSearchProviders`             | `string[]` | IDs de provedor de busca na web que pertencem a este Plugin.   |
| `tools`                          | `string[]` | Nomes de ferramentas de agente que pertencem a este Plugin para verificações de contrato bundled. |

## Referência de `channelConfigs`

Use `channelConfigs` quando um Plugin de canal precisar de metadados baratos de configuração antes de
o runtime carregar.

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

| Campo         | Tipo                     | O que significa                                                                             |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Schema JSON para `channels.<id>`. Obrigatório para cada entrada declarada de configuração de canal. |
| `uiHints`     | `Record<string, object>` | Rótulos/placeholders/dicas de sensibilidade opcionais de UI para essa seção de configuração de canal. |
| `label`       | `string`                 | Rótulo do canal mesclado em superfícies de seletor e inspeção quando os metadados de runtime ainda não estão prontos. |
| `description` | `string`                 | Descrição curta do canal para superfícies de inspeção e catálogo.                           |
| `preferOver`  | `string[]`               | IDs de Plugin legados ou de menor prioridade que este canal deve superar em superfícies de seleção. |

## Referência de `modelSupport`

Use `modelSupport` quando o OpenClaw precisar inferir seu Plugin de provedor a partir de
IDs abreviados de modelo como `gpt-5.4` ou `claude-sonnet-4.6` antes de o runtime do Plugin
carregar.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

O OpenClaw aplica esta precedência:

- referências explícitas `provider/model` usam os metadados `providers` do manifesto proprietário
- `modelPatterns` têm precedência sobre `modelPrefixes`
- se um Plugin não bundled e um bundled corresponderem, o Plugin não bundled
  vence
- ambiguidades restantes são ignoradas até que o usuário ou a configuração especifique um provedor

Campos:

| Campo           | Tipo       | O que significa                                                                   |
| --------------- | ---------- | --------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefixos comparados com `startsWith` em IDs abreviados de modelo.                |
| `modelPatterns` | `string[]` | Fontes de regex comparadas com IDs abreviados de modelo após a remoção do sufixo de perfil. |

Chaves legadas de capacidade de nível superior estão obsoletas. Use `openclaw doctor --fix` para
mover `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` e `webSearchProviders` para `contracts`; o carregamento normal
de manifesto não trata mais esses campos de nível superior como
propriedade de capacidade.

## Manifesto versus package.json

Os dois arquivos têm funções diferentes:

| Arquivo                | Use para                                                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Descoberta, validação de configuração, metadados de escolha de autenticação e dicas de UI que precisam existir antes de o código do Plugin rodar |
| `package.json`         | Metadados do npm, instalação de dependências e o bloco `openclaw` usado para entrypoints, controles de instalação, setup ou metadados de catálogo |

Se você não tiver certeza de onde um metadado pertence, use esta regra:

- se o OpenClaw precisar conhecê-lo antes de carregar o código do Plugin, coloque em `openclaw.plugin.json`
- se for sobre empacotamento, arquivos de entrada ou comportamento de instalação do npm, coloque em `package.json`

### Campos de `package.json` que afetam a descoberta

Alguns metadados de Plugin pré-runtime intencionalmente ficam em `package.json` sob o
bloco `openclaw` em vez de `openclaw.plugin.json`.

Exemplos importantes:

| Campo                                                             | O que significa                                                                                                                                                                        |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Declara entrypoints nativos de Plugin. Deve permanecer dentro do diretório do pacote do Plugin.                                                                                       |
| `openclaw.runtimeExtensions`                                      | Declara entrypoints de runtime JavaScript compilados para pacotes instalados. Deve permanecer dentro do diretório do pacote do Plugin.                                               |
| `openclaw.setupEntry`                                             | Entrypoint leve apenas de setup usado durante onboarding, inicialização adiada de canal e descoberta somente leitura de status de canal/SecretRef. Deve permanecer dentro do diretório do pacote do Plugin. |
| `openclaw.runtimeSetupEntry`                                      | Declara o entrypoint de setup JavaScript compilado para pacotes instalados. Deve permanecer dentro do diretório do pacote do Plugin.                                                 |
| `openclaw.channel`                                                | Metadados baratos de catálogo de canal, como rótulos, caminhos de documentação, aliases e texto de seleção.                                                                          |
| `openclaw.channel.configuredState`                                | Metadados leves de verificador de estado configurado que podem responder "já existe setup somente por env?" sem carregar o runtime completo do canal.                               |
| `openclaw.channel.persistedAuthState`                             | Metadados leves de verificador de autenticação persistida que podem responder "já existe algo autenticado?" sem carregar o runtime completo do canal.                               |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Dicas de instalação/atualização para plugins bundled e publicados externamente.                                                                                                       |
| `openclaw.install.defaultChoice`                                  | Caminho de instalação preferido quando várias fontes de instalação estão disponíveis.                                                                                                 |
| `openclaw.install.minHostVersion`                                 | Versão mínima compatível do host OpenClaw, usando um piso semver como `>=2026.3.22`.                                                                                                 |
| `openclaw.install.allowInvalidConfigRecovery`                     | Permite um caminho restrito de recuperação por reinstalação de Plugin bundled quando a configuração é inválida.                                                                      |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permite que superfícies de canal somente de setup carreguem antes do Plugin completo do canal durante a inicialização.                                                               |

`openclaw.install.minHostVersion` é aplicado durante a instalação e o carregamento do
registro de manifesto. Valores inválidos são rejeitados; valores válidos, porém mais novos, ignoram o
Plugin em hosts mais antigos.

Plugins de canal devem fornecer `openclaw.setupEntry` quando status, lista de canais
ou varreduras de SecretRef precisarem identificar contas configuradas sem carregar o runtime completo.
O entry de setup deve expor metadados de canal mais adaptadores seguros para setup de configuração,
status e segredos; mantenha clientes de rede, listeners do gateway e
runtimes de transporte no entrypoint principal da extensão.

Campos de entrypoint de runtime não substituem verificações de limite de pacote para campos
de entrypoint de origem. Por exemplo, `openclaw.runtimeExtensions` não pode tornar
carregável um caminho de `openclaw.extensions` que escape do pacote.

`openclaw.install.allowInvalidConfigRecovery` é intencionalmente restrito. Ele
não torna configurações arbitrariamente quebradas instaláveis. Hoje ele só permite que fluxos de instalação
recuperem falhas específicas de atualização de Plugin bundled obsoleto, como um
caminho ausente de Plugin bundled ou uma entrada obsoleta `channels.<id>` para esse mesmo
Plugin bundled. Erros de configuração não relacionados ainda bloqueiam a instalação e direcionam operators
para `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` é metadado de pacote para um pequeno módulo
verificador:

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

Use-o quando fluxos de setup, doctor ou estado configurado precisarem de uma
sondagem barata de autenticação sim/não antes de o Plugin completo do canal carregar. O export de destino deve ser uma função pequena que leia apenas o estado persistido; não o encaminhe pelo barrel completo
de runtime do canal.

`openclaw.channel.configuredState` segue o mesmo formato para verificações baratas
de estado configurado somente por env:

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

Use-o quando um canal puder responder ao estado configurado a partir de env ou de outras entradas pequenas
fora do runtime. Se a verificação precisar de resolução completa de configuração ou do runtime real
do canal, mantenha essa lógica no hook `config.hasConfiguredState` do Plugin.

## Precedência de descoberta (IDs duplicados de Plugin)

O OpenClaw descobre plugins de várias raízes (bundled, instalação global, workspace, caminhos explicitamente selecionados na configuração). Se duas descobertas compartilharem o mesmo `id`, apenas o manifesto de **maior precedência** é mantido; duplicatas de menor precedência são descartadas em vez de serem carregadas lado a lado.

Precedência, da maior para a menor:

1. **Selecionado na configuração** — um caminho explicitamente fixado em `plugins.entries.<id>`
2. **Bundled** — plugins distribuídos com o OpenClaw
3. **Instalação global** — plugins instalados na raiz global de plugins do OpenClaw
4. **Workspace** — plugins descobertos em relação ao workspace atual

Implicações:

- Uma cópia bifurcada ou desatualizada de um Plugin bundled no workspace não vai sobrescrever a build bundled.
- Para realmente substituir um Plugin bundled por um local, fixe-o por `plugins.entries.<id>` para que ele vença por precedência, em vez de depender da descoberta do workspace.
- Descartes por duplicidade são registrados em log para que o Doctor e os diagnósticos de inicialização possam apontar para a cópia descartada.

## Requisitos de JSON Schema

- **Todo Plugin deve incluir um JSON Schema**, mesmo que não aceite configuração.
- Um schema vazio é aceitável (por exemplo, `{ "type": "object", "additionalProperties": false }`).
- Schemas são validados no momento de leitura/gravação da configuração, não em runtime.

## Comportamento de validação

- Chaves desconhecidas em `channels.*` são **erros**, a menos que o ID do canal seja declarado por
  um manifesto de Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*`
  devem referenciar IDs de Plugin **descobertos**. IDs desconhecidos são **erros**.
- Se um Plugin estiver instalado, mas tiver um manifesto ou schema ausente ou quebrado,
  a validação falha e o Doctor relata o erro do Plugin.
- Se a configuração do Plugin existir, mas o Plugin estiver **desabilitado**, a configuração é mantida e
  um **aviso** é exibido no Doctor + logs.

Consulte [Referência de configuração](/pt-BR/gateway/configuration) para o schema completo de `plugins.*`.

## Observações

- O manifesto é **obrigatório para plugins nativos do OpenClaw**, incluindo carregamentos locais do sistema de arquivos.
- O runtime ainda carrega o módulo do Plugin separadamente; o manifesto é apenas para
  descoberta + validação.
- Manifestos nativos são analisados com JSON5, então comentários, vírgulas finais e
  chaves sem aspas são aceitos, desde que o valor final ainda seja um objeto.
- Apenas campos documentados do manifesto são lidos pelo carregador de manifesto. Evite adicionar
  chaves personalizadas de nível superior aqui.
- `providerAuthEnvVars` é o caminho barato de metadados para sondagens de autenticação, validação
  de marcadores de env e superfícies semelhantes de autenticação de provedor que não devem iniciar o runtime do Plugin
  apenas para inspecionar nomes de env.
- `providerAuthAliases` permite que variantes de provedor reutilizem as variáveis de ambiente de autenticação,
  perfis de autenticação, autenticação respaldada por configuração e escolha de onboarding de chave de API
  de outro provedor sem codificar essa relação no core.
- `providerEndpoints` permite que plugins de provedor sejam donos de metadados simples de
  correspondência de host/baseUrl de endpoint. Use-o apenas para classes de endpoint que o core já suporta;
  o Plugin continua sendo dono do comportamento de runtime.
- `syntheticAuthRefs` é o caminho barato de metadados para hooks sintéticos de autenticação pertencentes ao provedor
  que precisam estar visíveis para a descoberta fria de modelos antes de o registro de runtime existir. Liste apenas referências cujo provedor de runtime ou backend CLI realmente
  implemente `resolveSyntheticAuth`.
- `nonSecretAuthMarkers` é o caminho barato de metadados para chaves de API placeholder pertencentes a Plugin bundled,
  como marcadores de credencial local, OAuth ou ambiente.
  O core trata isso como não segredo para exibição de autenticação e auditorias de segredo, sem
  codificar o provedor proprietário.
- `channelEnvVars` é o caminho barato de metadados para fallback por env de shell, prompts de setup
  e superfícies semelhantes de canal que não devem iniciar o runtime do Plugin
  apenas para inspecionar nomes de env. Nomes de env são metadados, não ativação por
  si só: status, auditoria, validação de entrega de Cron e outras superfícies somente leitura
  ainda aplicam política de confiança de Plugin e ativação efetiva antes de
  tratar uma variável de ambiente como canal configurado.
- `providerAuthChoices` é o caminho barato de metadados para seletores de escolha de autenticação,
  resolução de `--auth-choice`, mapeamento de provedor preferido e registro simples
  de flags de CLI de onboarding antes de o runtime do provedor carregar. Para metadados de wizard
  em runtime que exigem código do provedor, consulte
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

- [Criando Plugins](/pt-BR/plugins/building-plugins) — primeiros passos com plugins
- [Arquitetura de Plugin](/pt-BR/plugins/architecture) — arquitetura interna
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência do SDK de Plugin
