---
read_when:
    - Você está criando um Plugin do OpenClaw
    - Você precisa entregar um schema de configuração de plugin ou depurar erros de validação de plugin
summary: Manifesto de Plugin + requisitos de schema JSON (validação estrita de configuração)
title: Manifesto de Plugin
x-i18n:
    generated_at: "2026-04-25T13:51:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa96930c3c9b890194869eb793c65a0af9db43f8f8b1f78d3c3d6ef18b70be6e
    source_path: plugins/manifest.md
    workflow: 15
---

Esta página é apenas para o **manifesto nativo de Plugin do OpenClaw**.

Para layouts de bundle compatíveis, consulte [Plugin bundles](/pt-BR/plugins/bundles).

Formatos de bundle compatíveis usam arquivos de manifesto diferentes:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` ou o layout padrão de componente Claude
  sem manifesto
- Bundle Cursor: `.cursor-plugin/plugin.json`

O OpenClaw também detecta automaticamente esses layouts de bundle, mas eles não são validados
contra o schema `openclaw.plugin.json` descrito aqui.

Para bundles compatíveis, o OpenClaw atualmente lê metadados do bundle mais
raízes declaradas de Skills, raízes de comandos Claude, padrões de `settings.json` do bundle Claude,
padrões de LSP do bundle Claude e hook packs compatíveis quando o layout corresponde
às expectativas de runtime do OpenClaw.

Todo Plugin nativo do OpenClaw **deve** incluir um arquivo `openclaw.plugin.json` na
**raiz do plugin**. O OpenClaw usa esse manifesto para validar configuração
**sem executar código do plugin**. Manifestos ausentes ou inválidos são tratados como
erros de plugin e bloqueiam a validação de configuração.

Consulte o guia completo do sistema de plugins: [Plugins](/pt-BR/tools/plugin).
Para o modelo nativo de capability e a orientação atual de compatibilidade externa:
[Capability model](/pt-BR/plugins/architecture#public-capability-model).

## O que esse arquivo faz

`openclaw.plugin.json` são os metadados que o OpenClaw lê **antes de carregar o
código do seu plugin**. Tudo abaixo precisa ser barato o suficiente para inspecionar sem iniciar
o runtime do plugin.

**Use para:**

- identidade do plugin, validação de configuração e dicas de UI de configuração
- metadados de autenticação, onboarding e configuração (alias, ativação automática, env vars do provedor, opções de autenticação)
- dicas de ativação para superfícies do plano de controle
- propriedade abreviada de famílias de modelos
- snapshots estáticos de propriedade de capability (`contracts`)
- metadados do runner de QA que o host compartilhado `openclaw qa` pode inspecionar
- metadados de configuração específicos de canal mesclados ao catálogo e às superfícies de validação

**Não use para:** registrar comportamento de runtime, declarar entrypoints de código
ou metadados de instalação npm. Isso pertence ao código do seu plugin e ao `package.json`.

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

| Campo                                | Obrigatório | Tipo                             | O que significa                                                                                                                                                                                                                   |
| ------------------------------------ | ----------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Sim         | `string`                         | Id canônico do plugin. Esse é o id usado em `plugins.entries.<id>`.                                                                                                                                                              |
| `configSchema`                       | Sim         | `object`                         | JSON Schema inline para a configuração desse plugin.                                                                                                                                                                              |
| `enabledByDefault`                   | Não         | `true`                           | Marca um plugin incluído como ativado por padrão. Omita-o ou defina qualquer valor diferente de `true` para deixar o plugin desativado por padrão.                                                                              |
| `legacyPluginIds`                    | Não         | `string[]`                       | IDs legados que são normalizados para este id canônico de plugin.                                                                                                                                                                 |
| `autoEnableWhenConfiguredProviders`  | Não         | `string[]`                       | IDs de provedor que devem ativar automaticamente este plugin quando autenticação, configuração ou refs de modelo os mencionarem.                                                                                                 |
| `kind`                               | Não         | `"memory"` \| `"context-engine"` | Declara um tipo exclusivo de plugin usado por `plugins.slots.*`.                                                                                                                                                                  |
| `channels`                           | Não         | `string[]`                       | IDs de canal pertencentes a este plugin. Usado para descoberta e validação de configuração.                                                                                                                                      |
| `providers`                          | Não         | `string[]`                       | IDs de provedor pertencentes a este plugin.                                                                                                                                                                                       |
| `providerDiscoveryEntry`             | Não         | `string`                         | Caminho de módulo leve de descoberta de provedor, relativo à raiz do plugin, para metadados de catálogo de provedor com escopo de manifesto que podem ser carregados sem ativar o runtime completo do plugin.                 |
| `modelSupport`                       | Não         | `object`                         | Metadados abreviados de família de modelo pertencentes ao manifesto, usados para carregamento automático do plugin antes do runtime.                                                                                            |
| `modelCatalog`                       | Não         | `object`                         | Metadados declarativos de catálogo de modelo para provedores pertencentes a este plugin. Este é o contrato do plano de controle para futura listagem somente leitura, onboarding, seletores de modelo, aliases e supressão sem carregar o runtime do plugin. |
| `providerEndpoints`                  | Não         | `object[]`                       | Metadados de host/baseUrl de endpoint pertencentes ao manifesto para rotas de provedor que o núcleo precisa classificar antes de o runtime do provedor ser carregado.                                                           |
| `cliBackends`                        | Não         | `string[]`                       | IDs de backend de inferência por CLI pertencentes a este plugin. Usado para ativação automática na inicialização a partir de refs explícitas de configuração.                                                                   |
| `syntheticAuthRefs`                  | Não         | `string[]`                       | Refs de provedor ou backend CLI cujo hook de autenticação sintética pertencente ao plugin deve ser testado durante a descoberta fria de modelo antes de o runtime ser carregado.                                                |
| `nonSecretAuthMarkers`               | Não         | `string[]`                       | Valores placeholder de chave de API pertencentes a plugins incluídos que representam estado não secreto local, OAuth ou de credenciais do ambiente.                                                                             |
| `commandAliases`                     | Não         | `object[]`                       | Nomes de comando pertencentes a este plugin que devem produzir configuração com reconhecimento de plugin e diagnósticos da CLI antes de o runtime ser carregado.                                                                |
| `providerAuthEnvVars`                | Não         | `Record<string, string[]>`       | Metadados env de compatibilidade obsoleta para lookup de autenticação/status de provedor. Prefira `setup.providers[].envVars` para plugins novos; o OpenClaw ainda lê isso durante a janela de descontinuação.               |
| `providerAuthAliases`                | Não         | `Record<string, string>`         | IDs de provedor que devem reutilizar outro id de provedor para lookup de autenticação, por exemplo um provedor de coding que compartilha a chave de API e os perfis de autenticação do provedor base.                        |
| `channelEnvVars`                     | Não         | `Record<string, string[]>`       | Metadados env leves de canal que o OpenClaw pode inspecionar sem carregar código do plugin. Use isso para superfícies de configuração ou autenticação de canal dirigidas por env que helpers genéricos de inicialização/configuração devem enxergar. |
| `providerAuthChoices`                | Não         | `object[]`                       | Metadados leves de escolha de autenticação para seletores de onboarding, resolução de provedor preferido e ligação simples de flags da CLI.                                                                                     |
| `activation`                         | Não         | `object`                         | Metadados leves do planejador de ativação para carregamento disparado por provedor, comando, canal, rota e capability. Apenas metadados; o runtime do plugin continua sendo dono do comportamento real.                      |
| `setup`                              | Não         | `object`                         | Descritores leves de configuração/onboarding que superfícies de descoberta e configuração podem inspecionar sem carregar o runtime do plugin.                                                                                   |
| `qaRunners`                          | Não         | `object[]`                       | Descritores leves de runner de QA usados pelo host compartilhado `openclaw qa` antes de o runtime do plugin ser carregado.                                                                                                      |
| `contracts`                          | Não         | `object`                         | Snapshot estático de capability incluída para hooks externos de autenticação, fala, transcrição em tempo real, voz em tempo real, media-understanding, geração de imagem, geração de música, geração de vídeo, web-fetch, busca na web e propriedade de ferramentas. |
| `mediaUnderstandingProviderMetadata` | Não         | `Record<string, object>`         | Padrões leves de media-understanding para IDs de provedor declarados em `contracts.mediaUnderstandingProviders`.                                                                                                                 |
| `channelConfigs`                     | Não         | `Record<string, object>`         | Metadados de configuração de canal pertencentes ao manifesto, mesclados às superfícies de descoberta e validação antes de o runtime ser carregado.                                                                              |
| `skills`                             | Não         | `string[]`                       | Diretórios de Skills a carregar, relativos à raiz do plugin.                                                                                                                                                                      |
| `name`                               | Não         | `string`                         | Nome legível do plugin.                                                                                                                                                                                                           |
| `description`                        | Não         | `string`                         | Resumo curto exibido em superfícies de plugin.                                                                                                                                                                                    |
| `version`                            | Não         | `string`                         | Versão informativa do plugin.                                                                                                                                                                                                     |
| `uiHints`                            | Não         | `Record<string, object>`         | Rótulos de UI, placeholders e dicas de sensibilidade para campos de configuração.                                                                                                                                                 |

## Referência de `providerAuthChoices`

Cada entrada de `providerAuthChoices` descreve uma escolha de onboarding ou autenticação.
O OpenClaw lê isso antes de o runtime do provedor ser carregado.
O fluxo de configuração do provedor prefere essas escolhas do manifesto e depois faz fallback para
metadados do wizard em runtime e escolhas do catálogo de instalação para compatibilidade.

| Campo                 | Obrigatório | Tipo                                            | O que significa                                                                                          |
| --------------------- | ----------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Sim         | `string`                                        | Id do provedor ao qual esta escolha pertence.                                                            |
| `method`              | Sim         | `string`                                        | Id do método de autenticação para encaminhar.                                                            |
| `choiceId`            | Sim         | `string`                                        | Id estável de escolha de autenticação usado por onboarding e fluxos da CLI.                             |
| `choiceLabel`         | Não         | `string`                                        | Rótulo voltado ao usuário. Se omitido, o OpenClaw usa `choiceId` como fallback.                         |
| `choiceHint`          | Não         | `string`                                        | Texto curto de ajuda para o seletor.                                                                     |
| `assistantPriority`   | Não         | `number`                                        | Valores menores aparecem primeiro em seletores interativos guiados pelo assistente.                     |
| `assistantVisibility` | Não         | `"visible"` \| `"manual-only"`                  | Oculta a escolha dos seletores do assistente, mas ainda permite seleção manual pela CLI.                |
| `deprecatedChoiceIds` | Não         | `string[]`                                      | IDs legados de escolha que devem redirecionar usuários para esta escolha substituta.                    |
| `groupId`             | Não         | `string`                                        | Id opcional de grupo para agrupar escolhas relacionadas.                                                 |
| `groupLabel`          | Não         | `string`                                        | Rótulo voltado ao usuário para esse grupo.                                                               |
| `groupHint`           | Não         | `string`                                        | Texto curto de ajuda para o grupo.                                                                       |
| `optionKey`           | Não         | `string`                                        | Chave de opção interna para fluxos simples de autenticação com uma única flag.                           |
| `cliFlag`             | Não         | `string`                                        | Nome da flag da CLI, como `--openrouter-api-key`.                                                        |
| `cliOption`           | Não         | `string`                                        | Formato completo da opção de CLI, como `--openrouter-api-key <key>`.                                    |
| `cliDescription`      | Não         | `string`                                        | Descrição usada na ajuda da CLI.                                                                         |
| `onboardingScopes`    | Não         | `Array<"text-inference" \| "image-generation">` | Em quais superfícies de onboarding esta escolha deve aparecer. Se omitido, o padrão é `["text-inference"]`. |

## Referência de `commandAliases`

Use `commandAliases` quando um plugin for dono de um nome de comando de runtime que usuários podem
colocar por engano em `plugins.allow` ou tentar executar como um comando raiz da CLI. O OpenClaw
usa esses metadados para diagnósticos sem importar código de runtime do plugin.

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
| `name`       | Sim         | `string`          | Nome de comando que pertence a este plugin.                               |
| `kind`       | Não         | `"runtime-slash"` | Marca o alias como um comando de barra de chat, e não como um comando raiz da CLI. |
| `cliCommand` | Não         | `string`          | Comando raiz relacionado da CLI a sugerir para operações de CLI, se existir. |

## Referência de `activation`

Use `activation` quando o plugin puder declarar de forma leve quais eventos do plano de controle
devem incluí-lo em um plano de ativação/carregamento.

Este bloco é metadado de planejador, não uma API de ciclo de vida. Ele não registra
comportamento de runtime, não substitui `register(...)` e não promete que o
código do plugin já tenha sido executado. O planejador de ativação usa esses campos para
restringir plugins candidatos antes de recorrer a metadados de propriedade já existentes no manifesto,
como `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` e hooks.

Prefira o metadado mais restrito que já descreva a propriedade. Use
`providers`, `channels`, `commandAliases`, descritores de setup ou `contracts`
quando esses campos expressarem a relação. Use `activation` para dicas extras
ao planejador que não possam ser representadas por esses campos de propriedade.

Este bloco contém apenas metadados. Ele não registra comportamento de runtime e não
substitui `register(...)`, `setupEntry` nem outros entrypoints de runtime/plugin.
Consumidores atuais o usam como uma dica de restrição antes de um carregamento mais amplo do plugin, então
metadados de ativação ausentes normalmente só custam desempenho; isso não deve
mudar a correção enquanto ainda existirem fallbacks legados de propriedade no manifesto.

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

| Campo            | Obrigatório | Tipo                                                 | O que significa                                                                                         |
| ---------------- | ----------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `onProviders`    | Não         | `string[]`                                           | IDs de provedor que devem incluir este plugin em planos de ativação/carregamento.                      |
| `onCommands`     | Não         | `string[]`                                           | IDs de comando que devem incluir este plugin em planos de ativação/carregamento.                       |
| `onChannels`     | Não         | `string[]`                                           | IDs de canal que devem incluir este plugin em planos de ativação/carregamento.                         |
| `onRoutes`       | Não         | `string[]`                                           | Tipos de rota que devem incluir este plugin em planos de ativação/carregamento.                        |
| `onCapabilities` | Não         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Dicas amplas de capability usadas pelo planejamento de ativação do plano de controle. Prefira campos mais restritos quando possível. |

Consumidores live atuais:

- o planejamento de CLI disparado por comando recorre ao legado
  `commandAliases[].cliCommand` ou `commandAliases[].name`
- o planejamento de setup/canal disparado por canal recorre ao legado `channels[]`
  quando faltam metadados explícitos de ativação de canal
- o planejamento de setup/runtime disparado por provedor recorre ao legado
  `providers[]` e à propriedade de nível superior `cliBackends[]` quando faltam
  metadados explícitos de ativação de provedor

Diagnósticos do planejador podem distinguir dicas explícitas de ativação de
fallbacks de propriedade do manifesto. Por exemplo, `activation-command-hint` significa
que `activation.onCommands` correspondeu, enquanto `manifest-command-alias` significa que o
planejador usou a propriedade `commandAliases` em vez disso. Esses rótulos de motivo são para
diagnósticos e testes do host; autores de plugins devem continuar declarando os metadados
que melhor descrevem a propriedade.

## Referência de `qaRunners`

Use `qaRunners` quando um plugin contribuir com um ou mais runners de transporte abaixo
da raiz compartilhada `openclaw qa`. Mantenha esses metadados leves e estáticos; o
runtime do plugin continua sendo dono do registro real da CLI por meio de uma
superfície leve `runtime-api.ts` que exporta `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Executa a lane live de QA do Matrix com backend Docker contra um homeserver descartável"
    }
  ]
}
```

| Campo         | Obrigatório | Tipo     | O que significa                                                    |
| ------------- | ----------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Sim         | `string` | Subcomando montado abaixo de `openclaw qa`, por exemplo `matrix`.  |
| `description` | Não         | `string` | Texto de ajuda de fallback usado quando o host compartilhado precisa de um comando stub. |

## Referência de `setup`

Use `setup` quando superfícies de configuração e onboarding precisarem de metadados leves pertencentes ao plugin
antes de o runtime ser carregado.

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

O `cliBackends` de nível superior continua válido e continua descrevendo
backends de inferência por CLI. `setup.cliBackends` é a superfície de descritor específica de setup para
fluxos de configuração/plano de controle que devem permanecer somente metadados.

Quando presentes, `setup.providers` e `setup.cliBackends` são a superfície preferida
de lookup orientada a descritor para descoberta de setup. Se o descritor apenas restringir o plugin candidato e o setup ainda precisar de hooks de runtime mais ricos em tempo de setup, defina `requiresRuntime: true` e mantenha `setup-api` como caminho de execução de fallback.

O OpenClaw também inclui `setup.providers[].envVars` em lookups genéricos de autenticação de provedor e env vars. `providerAuthEnvVars` continua compatível por meio de um adaptador de compatibilidade durante a janela de descontinuação, mas plugins não incluídos que ainda o usem recebem um diagnóstico de manifesto. Plugins novos devem colocar metadados env de setup/status em `setup.providers[].envVars`.

O OpenClaw também pode derivar escolhas simples de setup a partir de `setup.providers[].authMethods`
quando não houver entrada de setup disponível, ou quando `setup.requiresRuntime: false`
declarar que o runtime de setup é desnecessário. Entradas explícitas `providerAuthChoices` continuam preferidas para rótulos personalizados, flags de CLI, escopo de onboarding e metadados do assistente.

Defina `requiresRuntime: false` somente quando esses descritores forem suficientes para a
superfície de setup. O OpenClaw trata `false` explícito como um contrato somente de descritor
e não executará `setup-api` nem `openclaw.setupEntry` para lookup de setup. Se
um plugin somente de descritor ainda incluir uma dessas entradas de runtime de setup,
o OpenClaw relata um diagnóstico aditivo e continua ignorando-a. Omissão de
`requiresRuntime` mantém o comportamento legado de fallback para que plugins existentes que adicionaram
descritores sem a flag não quebrem.

Como o lookup de setup pode executar código `setup-api` pertencente ao plugin, valores normalizados de
`setup.providers[].id` e `setup.cliBackends[]` devem permanecer únicos entre plugins descobertos. Propriedade ambígua falha de forma fechada em vez de escolher um vencedor pela ordem de descoberta.

Quando o runtime de setup é executado, os diagnósticos do registro de setup relatam divergência de descritor
se `setup-api` registrar um provedor ou backend CLI que os descritores do manifesto não declarem, ou se um descritor não tiver registro de runtime correspondente. Esses diagnósticos são aditivos e não rejeitam plugins legados.

### Referência de `setup.providers`

| Campo         | Obrigatório | Tipo       | O que significa                                                                    |
| ------------- | ----------- | ---------- | ---------------------------------------------------------------------------------- |
| `id`          | Sim         | `string`   | Id do provedor exposto durante setup ou onboarding. Mantenha IDs normalizados globalmente únicos. |
| `authMethods` | Não         | `string[]` | IDs de método de setup/autenticação compatíveis com este provedor sem carregar o runtime completo. |
| `envVars`     | Não         | `string[]` | Env vars que superfícies genéricas de setup/status podem verificar antes de o runtime do plugin ser carregado. |

### Campos de `setup`

| Campo              | Obrigatório | Tipo       | O que significa                                                                                     |
| ------------------ | ----------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | Não         | `object[]` | Descritores de setup de provedor expostos durante setup e onboarding.                              |
| `cliBackends`      | Não         | `string[]` | IDs de backend em tempo de setup usados para lookup de setup orientado primeiro por descritor. Mantenha IDs normalizados globalmente únicos. |
| `configMigrations` | Não         | `string[]` | IDs de migração de configuração pertencentes à superfície de setup deste plugin.                   |
| `requiresRuntime`  | Não         | `boolean`  | Se o setup ainda precisa de execução de `setup-api` após o lookup por descritor.                   |

## Referência de `uiHints`

`uiHints` é um mapa de nomes de campo de configuração para pequenas dicas de renderização.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "Chave de API",
      "help": "Usada para requisições ao OpenRouter",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Cada dica de campo pode incluir:

| Campo         | Tipo       | O que significa                         |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Rótulo de campo voltado ao usuário.     |
| `help`        | `string`   | Texto curto de ajuda.                   |
| `tags`        | `string[]` | Tags opcionais de UI.                   |
| `advanced`    | `boolean`  | Marca o campo como avançado.            |
| `sensitive`   | `boolean`  | Marca o campo como secreto ou sensível. |
| `placeholder` | `string`   | Texto placeholder para entradas de formulário. |

## Referência de `contracts`

Use `contracts` apenas para metadados estáticos de propriedade de capability que o OpenClaw possa
ler sem importar o runtime do plugin.

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["pi", "codex"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
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

| Campo                            | Tipo       | O que significa                                                        |
| -------------------------------- | ---------- | ---------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | IDs de fábrica de extension do app-server Codex, atualmente `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | IDs de runtime para os quais um plugin incluído pode registrar middleware de resultado de ferramenta. |
| `externalAuthProviders`          | `string[]` | IDs de provedor cujo hook de perfil de autenticação externo pertence a este plugin. |
| `speechProviders`                | `string[]` | IDs de provedor de fala pertencentes a este plugin.                    |
| `realtimeTranscriptionProviders` | `string[]` | IDs de provedor de transcrição em tempo real pertencentes a este plugin. |
| `realtimeVoiceProviders`         | `string[]` | IDs de provedor de voz em tempo real pertencentes a este plugin.       |
| `memoryEmbeddingProviders`       | `string[]` | IDs de provedor de embedding de memória pertencentes a este plugin.    |
| `mediaUnderstandingProviders`    | `string[]` | IDs de provedor de media-understanding pertencentes a este plugin.     |
| `imageGenerationProviders`       | `string[]` | IDs de provedor de geração de imagem pertencentes a este plugin.       |
| `videoGenerationProviders`       | `string[]` | IDs de provedor de geração de vídeo pertencentes a este plugin.        |
| `webFetchProviders`              | `string[]` | IDs de provedor de web-fetch pertencentes a este plugin.               |
| `webSearchProviders`             | `string[]` | IDs de provedor de busca na web pertencentes a este plugin.            |
| `tools`                          | `string[]` | Nomes de ferramentas de agente pertencentes a este plugin para verificações de contrato incluído. |

`contracts.embeddedExtensionFactories` é mantido para fábricas de extension apenas do app-server
Codex incluído. Transformações de resultado de ferramenta incluídas devem
declarar `contracts.agentToolResultMiddleware` e registrar com
`api.registerAgentToolResultMiddleware(...)`. Plugins externos não podem
registrar middleware de resultado de ferramenta porque essa superfície pode reescrever
saídas de ferramentas de alta confiança antes que o modelo as veja.

Plugins de provedor que implementam `resolveExternalAuthProfiles` devem declarar
`contracts.externalAuthProviders`. Plugins sem essa declaração ainda executam
por meio de um fallback de compatibilidade obsoleto, mas esse fallback é mais lento e
será removido após a janela de migração.

Provedores de embedding de memória incluídos devem declarar
`contracts.memoryEmbeddingProviders` para cada id de adaptador que expuserem, incluindo
adaptadores integrados como `local`. Caminhos independentes da CLI usam esse contrato de manifesto
para carregar apenas o plugin proprietário antes que o runtime completo do Gateway tenha
registrado provedores.

## Referência de `mediaUnderstandingProviderMetadata`

Use `mediaUnderstandingProviderMetadata` quando um provedor de media-understanding tiver
modelos padrão, prioridade de fallback de autenticação automática ou suporte nativo a documentos que
helpers genéricos do núcleo precisem antes de o runtime ser carregado. As chaves também devem ser declaradas em
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

| Campo                  | Tipo                                | O que significa                                                              |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capabilities de mídia expostas por este provedor.                            |
| `defaultModels`        | `Record<string, string>`            | Padrões de capability para modelo usados quando a configuração não especifica um modelo. |
| `autoPriority`         | `Record<string, number>`            | Números menores aparecem primeiro no fallback automático de provedor baseado em credenciais. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Entradas nativas de documento compatíveis com o provedor.                    |

## Referência de `channelConfigs`

Use `channelConfigs` quando um plugin de canal precisar de metadados leves de configuração antes
de o runtime ser carregado. Descoberta somente leitura de setup/status de canal pode usar esses metadados
diretamente para canais externos configurados quando nenhuma entrada de setup estiver disponível, ou
quando `setup.requiresRuntime: false` declarar que o runtime de setup é desnecessário.

Para um plugin de canal, `configSchema` e `channelConfigs` descrevem caminhos diferentes:

- `configSchema` valida `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valida `channels.<channel-id>`

Plugins não incluídos que declaram `channels[]` também devem declarar entradas
correspondentes em `channelConfigs`. Sem isso, o OpenClaw ainda pode carregar o plugin, mas
superfícies de schema de configuração em caminho frio, setup e Control UI não conseguem saber o formato
das opções pertencentes ao canal até que o runtime do plugin seja executado.

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

| Campo         | Tipo                     | O que significa                                                                        |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema para `channels.<id>`. Obrigatório para cada entrada declarada de configuração de canal. |
| `uiHints`     | `Record<string, object>` | Rótulos/placeholders/dicas de sensibilidade opcionais de UI para aquela seção de configuração do canal. |
| `label`       | `string`                 | Rótulo do canal mesclado às superfícies de seletor e inspeção quando os metadados de runtime ainda não estiverem prontos. |
| `description` | `string`                 | Descrição curta do canal para superfícies de inspeção e catálogo.                      |
| `preferOver`  | `string[]`               | IDs legados ou de menor prioridade de plugin que este canal deve superar em superfícies de seleção. |

## Referência de `modelSupport`

Use `modelSupport` quando o OpenClaw precisar inferir seu plugin de provedor a partir de
IDs abreviados de modelo como `gpt-5.5` ou `claude-sonnet-4.6` antes de o runtime do plugin
ser carregado.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

O OpenClaw aplica esta precedência:

- refs explícitas `provider/model` usam os metadados de manifesto do dono em `providers`
- `modelPatterns` têm precedência sobre `modelPrefixes`
- se um plugin não incluído e um plugin incluído corresponderem, o plugin não incluído
  vence
- ambiguidades restantes são ignoradas até que o usuário ou a configuração especifique um provedor

Campos:

| Campo           | Tipo       | O que significa                                                                 |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefixos comparados com `startsWith` contra IDs abreviados de modelo.           |
| `modelPatterns` | `string[]` | Fontes regex comparadas com IDs abreviados de modelo após remoção do sufixo de perfil. |

## Referência de `modelCatalog`

Use `modelCatalog` quando o OpenClaw precisar conhecer metadados de modelo de provedor antes de
carregar o runtime do plugin. Esta é a fonte pertencente ao manifesto para linhas fixas
de catálogo, aliases de provedor, regras de supressão e modo de descoberta. A atualização em runtime
continua pertencendo ao código de runtime do provedor, mas o manifesto informa ao núcleo quando o runtime
é necessário.

```json
{
  "providers": ["openai"],
  "modelCatalog": {
    "providers": {
      "openai": {
        "baseUrl": "https://api.openai.com/v1",
        "api": "openai-responses",
        "models": [
          {
            "id": "gpt-5.4",
            "name": "GPT-5.4",
            "input": ["text", "image"],
            "reasoning": true,
            "contextWindow": 256000,
            "maxTokens": 128000,
            "cost": {
              "input": 1.25,
              "output": 10,
              "cacheRead": 0.125
            },
            "status": "available",
            "tags": ["default"]
          }
        ]
      }
    },
    "aliases": {
      "azure-openai-responses": {
        "provider": "openai",
        "api": "azure-openai-responses"
      }
    },
    "suppressions": [
      {
        "provider": "azure-openai-responses",
        "model": "gpt-5.3-codex-spark",
        "reason": "não disponível no Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

Campos de nível superior:

| Campo          | Tipo                                                     | O que significa                                                                                             |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Linhas de catálogo para IDs de provedor pertencentes a este plugin. As chaves também devem aparecer em `providers` no nível superior. |
| `aliases`      | `Record<string, object>`                                 | Aliases de provedor que devem resolver para um provedor pertencente a este plugin para planejamento de catálogo ou supressão. |
| `suppressions` | `object[]`                                               | Linhas de modelo de outra fonte que este plugin suprime por um motivo específico do provedor.              |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Se o catálogo do provedor pode ser lido a partir de metadados do manifesto, atualizado em cache ou se exige runtime. |

Campos de provedor:

| Campo     | Tipo                     | O que significa                                                  |
| --------- | ------------------------ | ---------------------------------------------------------------- |
| `baseUrl` | `string`                 | URL base padrão opcional para modelos neste catálogo de provedor. |
| `api`     | `ModelApi`               | Adaptador de API padrão opcional para modelos neste catálogo de provedor. |
| `headers` | `Record<string, string>` | Cabeçalhos estáticos opcionais que se aplicam a este catálogo de provedor. |
| `models`  | `object[]`               | Linhas de modelo obrigatórias. Linhas sem `id` são ignoradas.    |

Campos de modelo:

| Campo           | Tipo                                                           | O que significa                                                           |
| --------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Id local do modelo no provedor, sem o prefixo `provider/`.               |
| `name`          | `string`                                                       | Nome de exibição opcional.                                                |
| `api`           | `ModelApi`                                                     | Substituição opcional de API por modelo.                                  |
| `baseUrl`       | `string`                                                       | Substituição opcional de URL base por modelo.                             |
| `headers`       | `Record<string, string>`                                       | Cabeçalhos estáticos opcionais por modelo.                                |
| `input`         | `Array<"text" \| "image" \| "document">`                       | Modalidades que o modelo aceita.                                          |
| `reasoning`     | `boolean`                                                      | Se o modelo expõe comportamento de raciocínio.                            |
| `contextWindow` | `number`                                                       | Janela de contexto nativa do provedor.                                    |
| `contextTokens` | `number`                                                       | Limite efetivo opcional de contexto em runtime quando diferente de `contextWindow`. |
| `maxTokens`     | `number`                                                       | Máximo de tokens de saída quando conhecido.                               |
| `cost`          | `object`                                                       | Precificação opcional em USD por milhão de tokens, incluindo `tieredPricing` opcional. |
| `compat`        | `object`                                                       | Flags opcionais de compatibilidade correspondentes à compatibilidade da configuração de modelo do OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Status de listagem. Suprima apenas quando a linha não deve aparecer de forma alguma. |
| `statusReason`  | `string`                                                       | Motivo opcional mostrado com status não disponível.                       |
| `replaces`      | `string[]`                                                     | IDs locais antigos de modelo desse provedor que este modelo substitui.    |
| `replacedBy`    | `string`                                                       | Id local de modelo do provedor que substitui linhas obsoletas.            |
| `tags`          | `string[]`                                                     | Tags estáveis usadas por seletores e filtros.                             |

Não coloque dados apenas de runtime em `modelCatalog`. Se um provedor precisar de
estado de conta, de uma requisição à API ou de descoberta de processo local para conhecer o conjunto completo
de modelos, declare esse provedor como `refreshable` ou `runtime` em `discovery`.

Chaves legadas de capability no nível superior estão obsoletas. Use `openclaw doctor --fix` para
mover `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` e `webSearchProviders` para `contracts`; o carregamento normal
do manifesto não trata mais esses campos de nível superior como propriedade
de capability.

## Manifesto versus package.json

Os dois arquivos servem para trabalhos diferentes:

| Arquivo                | Use para                                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json` | Descoberta, validação de configuração, metadados de escolha de autenticação e dicas de UI que precisam existir antes que o código do plugin seja executado |
| `package.json`         | Metadados npm, instalação de dependências e o bloco `openclaw` usado para entrypoints, gate de instalação, setup ou metadados de catálogo |

Se você não tiver certeza de onde um metadado pertence, use esta regra:

- se o OpenClaw precisar conhecê-lo antes de carregar o código do plugin, coloque-o em `openclaw.plugin.json`
- se ele tratar de empacotamento, arquivos de entrada ou comportamento de instalação npm, coloque-o em `package.json`

### Campos de package.json que afetam a descoberta

Alguns metadados de plugin anteriores ao runtime ficam intencionalmente em `package.json`, no bloco
`openclaw`, em vez de `openclaw.plugin.json`.

Exemplos importantes:

| Campo                                                             | O que significa                                                                                                                                                                      |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Declara entrypoints nativos de plugin. Deve permanecer dentro do diretório do pacote do plugin.                                                                                     |
| `openclaw.runtimeExtensions`                                      | Declara entrypoints de runtime JavaScript compilado para pacotes instalados. Deve permanecer dentro do diretório do pacote do plugin.                                               |
| `openclaw.setupEntry`                                             | Entrypoint leve apenas de setup usado durante onboarding, inicialização adiada de canal e descoberta somente leitura de status de canal/SecretRef. Deve permanecer dentro do diretório do pacote do plugin. |
| `openclaw.runtimeSetupEntry`                                      | Declara o entrypoint de setup JavaScript compilado para pacotes instalados. Deve permanecer dentro do diretório do pacote do plugin.                                               |
| `openclaw.channel`                                                | Metadados leves de catálogo de canal, como rótulos, caminhos de documentação, aliases e texto de seleção.                                                                          |
| `openclaw.channel.configuredState`                                | Metadados leves de verificador de estado configurado que podem responder “já existe configuração apenas por env?” sem carregar o runtime completo do canal.                        |
| `openclaw.channel.persistedAuthState`                             | Metadados leves de verificador de autenticação persistida que podem responder “já existe algo autenticado?” sem carregar o runtime completo do canal.                               |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Dicas de instalação/atualização para plugins incluídos e publicados externamente.                                                                                                   |
| `openclaw.install.defaultChoice`                                  | Caminho de instalação preferido quando várias fontes de instalação estão disponíveis.                                                                                               |
| `openclaw.install.minHostVersion`                                 | Versão mínima compatível do host OpenClaw, usando um piso semver como `>=2026.3.22`.                                                                                               |
| `openclaw.install.expectedIntegrity`                              | String de integridade esperada do dist npm, como `sha512-...`; fluxos de instalação e atualização verificam o artefato buscado contra ela.                                        |
| `openclaw.install.allowInvalidConfigRecovery`                     | Permite um caminho restrito de recuperação por reinstalação de plugin incluído quando a configuração está inválida.                                                                |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permite que superfícies de canal somente de setup sejam carregadas antes do plugin completo do canal durante a inicialização.                                                       |

Os metadados do manifesto decidem quais escolhas de provedor/canal/setup aparecem no
onboarding antes de o runtime ser carregado. `package.json#openclaw.install` informa ao
onboarding como buscar ou ativar esse plugin quando o usuário escolhe uma dessas
opções. Não mova dicas de instalação para `openclaw.plugin.json`.

`openclaw.install.minHostVersion` é aplicado durante a instalação e o carregamento do
registro de manifestos. Valores inválidos são rejeitados; valores mais novos, mas válidos, fazem o
plugin ser ignorado em hosts mais antigos.

O pin exato de versão npm já fica em `npmSpec`, por exemplo
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Entradas oficiais de catálogo externo
devem combinar especificações exatas com `expectedIntegrity` para que fluxos de atualização falhem
de forma fechada se o artefato npm buscado não corresponder mais à release fixada.
O onboarding interativo ainda oferece especificações npm confiáveis do registro, incluindo nomes
simples de pacote e dist-tags, por compatibilidade. Diagnósticos do catálogo podem
distinguir fontes exatas, flutuantes, fixadas por integridade, sem integridade, com incompatibilidade de nome de pacote e default-choice inválida. Eles também avisam quando
`expectedIntegrity` está presente, mas não há uma fonte npm válida que possa fixá-lo.
Quando `expectedIntegrity` está presente,
os fluxos de instalação/atualização o aplicam; quando omitido, a resolução do registro é
registrada sem fixação por integridade.

Plugins de canal devem fornecer `openclaw.setupEntry` quando status, lista de canais
ou varreduras de SecretRef precisarem identificar contas configuradas sem carregar o runtime
completo. A entrada de setup deve expor metadados do canal mais adaptadores de configuração, status e segredos seguros para setup; mantenha clientes de rede, listeners do gateway e runtimes de transporte no entrypoint principal da extension.

Campos de entrypoint de runtime não substituem verificações de limite de pacote para campos
de entrypoint de código-fonte. Por exemplo, `openclaw.runtimeExtensions` não pode tornar
carregável um caminho de escape em `openclaw.extensions`.

`openclaw.install.allowInvalidConfigRecovery` é intencionalmente restrito. Ele
não torna instaláveis configurações quebradas arbitrárias. Hoje ele só permite que fluxos de instalação
se recuperem de falhas específicas e antigas de upgrade de plugins incluídos, como um
caminho ausente de plugin incluído ou uma entrada antiga `channels.<id>` para esse mesmo
plugin incluído. Erros de configuração não relacionados continuam bloqueando a instalação e encaminhando operadores
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

Use isso quando fluxos de setup, doctor ou estado configurado precisarem de uma
sondagem barata de autenticação sim/não antes de o plugin completo do canal ser carregado. A exportação de destino deve ser uma pequena função que leia apenas estado persistido; não a encaminhe pelo barrel completo de runtime do canal.

`openclaw.channel.configuredState` segue o mesmo formato para verificações baratas
de estado configurado apenas por env:

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

Use isso quando um canal puder responder o estado configurado a partir de env ou de outras
entradas pequenas e não ligadas ao runtime. Se a verificação precisar de resolução completa de configuração ou do runtime real do canal, mantenha essa lógica no hook `config.hasConfiguredState` do plugin.

## Precedência de descoberta (IDs duplicados de plugin)

O OpenClaw descobre plugins a partir de várias raízes (incluídos, instalação global, workspace, caminhos explicitamente selecionados pela configuração). Se duas descobertas compartilharem o mesmo `id`, apenas o manifesto de **maior precedência** é mantido; duplicatas de menor precedência são descartadas em vez de serem carregadas ao lado dele.

Precedência, da maior para a menor:

1. **Selecionado por configuração** — um caminho fixado explicitamente em `plugins.entries.<id>`
2. **Incluído** — plugins distribuídos com o OpenClaw
3. **Instalação global** — plugins instalados na raiz global de plugins do OpenClaw
4. **Workspace** — plugins descobertos em relação ao workspace atual

Implicações:

- Uma cópia derivada ou antiga de um plugin incluído parada no workspace não sobrescreverá a build incluída.
- Para realmente substituir um plugin incluído por um local, fixe-o via `plugins.entries.<id>` para que ele vença por precedência em vez de depender da descoberta no workspace.
- Descartes de duplicatas são registrados em log para que Doctor e diagnósticos de inicialização possam apontar a cópia descartada.

## Requisitos de JSON Schema

- **Todo plugin deve incluir um JSON Schema**, mesmo que não aceite configuração.
- Um schema vazio é aceitável (por exemplo, `{ "type": "object", "additionalProperties": false }`).
- Schemas são validados no momento de leitura/gravação da configuração, não em runtime.

## Comportamento de validação

- Chaves desconhecidas em `channels.*` são **erros**, a menos que o id do canal seja declarado por
  um manifesto de plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*`
  devem referenciar IDs de plugin **descobertos**. IDs desconhecidos são **erros**.
- Se um plugin estiver instalado, mas tiver manifesto ou schema quebrado ou ausente,
  a validação falha e o Doctor informa o erro do plugin.
- Se existir configuração do plugin, mas o plugin estiver **desativado**, a configuração é mantida e
  um **aviso** é mostrado no Doctor + logs.

Consulte [Configuration reference](/pt-BR/gateway/configuration) para o schema completo de `plugins.*`.

## Notas

- O manifesto é **obrigatório para plugins nativos do OpenClaw**, incluindo carregamentos locais do sistema de arquivos. O runtime ainda carrega o módulo do plugin separadamente; o manifesto serve apenas para descoberta + validação.
- Manifestos nativos são analisados com JSON5, então comentários, vírgulas finais e chaves sem aspas são aceitos, desde que o valor final ainda seja um objeto.
- Apenas campos documentados do manifesto são lidos pelo carregador de manifesto. Evite chaves personalizadas de nível superior.
- `channels`, `providers`, `cliBackends` e `skills` podem ser omitidos quando um plugin não precisar deles.
- `providerDiscoveryEntry` deve permanecer leve e não deve importar código amplo de runtime; use-o para metadados estáticos de catálogo de provedor ou descritores estreitos de descoberta, não para execução em tempo de requisição.
- Tipos exclusivos de plugin são selecionados por `plugins.slots.*`: `kind: "memory"` via `plugins.slots.memory`, `kind: "context-engine"` via `plugins.slots.contextEngine` (padrão `legacy`).
- Metadados de env var (`setup.providers[].envVars`, o obsoleto `providerAuthEnvVars` e `channelEnvVars`) são apenas declarativos. Status, auditoria, validação de entrega do Cron e outras superfícies somente leitura ainda aplicam confiança no plugin e política de ativação efetiva antes de tratar uma env var como configurada.
- Para metadados de wizard de runtime que exigem código de provedor, consulte [Provider runtime hooks](/pt-BR/plugins/architecture-internals#provider-runtime-hooks).
- Se seu plugin depender de módulos nativos, documente as etapas de build e quaisquer requisitos de lista de permissões do gerenciador de pacotes (por exemplo, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Relacionado

<CardGroup cols={3}>
  <Card title="Criando plugins" href="/pt-BR/plugins/building-plugins" icon="rocket">
    Primeiros passos com plugins.
  </Card>
  <Card title="Arquitetura de plugins" href="/pt-BR/plugins/architecture" icon="diagram-project">
    Arquitetura interna e modelo de capability.
  </Card>
  <Card title="Visão geral do SDK" href="/pt-BR/plugins/sdk-overview" icon="book">
    Referência do SDK de plugins e importações por subcaminho.
  </Card>
</CardGroup>
