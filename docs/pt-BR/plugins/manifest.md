---
read_when:
    - Você está criando um Plugin do OpenClaw
    - Você precisa enviar um schema de configuração do Plugin ou depurar erros de validação do Plugin
summary: Manifesto de Plugin + requisitos do schema JSON (validação estrita de configuração)
title: Manifesto de Plugin
x-i18n:
    generated_at: "2026-04-26T11:34:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: b86920ad774c5ef4ace7b546ef44e5b087a8ca694dea622ddb440258ffff4237
    source_path: plugins/manifest.md
    workflow: 15
---

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
raízes de Skills declaradas, raízes de comandos do Claude, padrões de `settings.json` do bundle Claude,
padrões de LSP do bundle Claude e pacotes de hook compatíveis quando o layout corresponde
às expectativas de runtime do OpenClaw.

Todo Plugin nativo do OpenClaw **deve** incluir um arquivo `openclaw.plugin.json` na
**raiz do Plugin**. O OpenClaw usa esse manifesto para validar a configuração
**sem executar código do Plugin**. Manifestos ausentes ou inválidos são tratados como
erros de Plugin e bloqueiam a validação da configuração.

Consulte o guia completo do sistema de Plugins: [Plugins](/pt-BR/tools/plugin).
Para o modelo nativo de capability e a orientação atual de compatibilidade externa:
[Modelo de capability](/pt-BR/plugins/architecture#public-capability-model).

## O que este arquivo faz

`openclaw.plugin.json` é o metadado que o OpenClaw lê **antes de carregar o
código do seu Plugin**. Tudo abaixo precisa ser barato o suficiente para inspecionar sem iniciar
o runtime do Plugin.

**Use-o para:**

- identidade do Plugin, validação de configuração e dicas de UI de configuração
- metadados de auth, onboarding e configuração (alias, auto-enable, variáveis de ambiente do provedor, opções de auth)
- dicas de ativação para superfícies do plano de controle
- propriedade abreviada de família de modelos
- snapshots estáticos de propriedade de capability (`contracts`)
- metadados de runner de QA que o host compartilhado `openclaw qa` pode inspecionar
- metadados de configuração específicos de canal mesclados em catálogo e superfícies de validação

**Não o use para:** registrar comportamento de runtime, declarar code entrypoints
ou metadados de instalação npm. Isso pertence ao código do seu Plugin e ao `package.json`.

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

| Campo                                | Obrigatório | Tipo                             | O que significa                                                                                                                                                                                                                    |
| ------------------------------------ | ----------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Sim         | `string`                         | ID canônico do Plugin. Este é o id usado em `plugins.entries.<id>`.                                                                                                                                                               |
| `configSchema`                       | Sim         | `object`                         | JSON Schema inline para a configuração deste Plugin.                                                                                                                                                                               |
| `enabledByDefault`                   | Não         | `true`                           | Marca um Plugin incluído como ativado por padrão. Omita-o ou defina qualquer valor diferente de `true` para deixar o Plugin desativado por padrão.                                                                               |
| `legacyPluginIds`                    | Não         | `string[]`                       | IDs legados que são normalizados para este ID canônico de Plugin.                                                                                                                                                                  |
| `autoEnableWhenConfiguredProviders`  | Não         | `string[]`                       | IDs de provedor que devem ativar automaticamente este Plugin quando auth, configuração ou refs de modelo os mencionarem.                                                                                                          |
| `kind`                               | Não         | `"memory"` \| `"context-engine"` | Declara um tipo exclusivo de Plugin usado por `plugins.slots.*`.                                                                                                                                                                   |
| `channels`                           | Não         | `string[]`                       | IDs de canal controlados por este Plugin. Usados para descoberta e validação de configuração.                                                                                                                                      |
| `providers`                          | Não         | `string[]`                       | IDs de provedor controlados por este Plugin.                                                                                                                                                                                       |
| `providerDiscoveryEntry`             | Não         | `string`                         | Caminho leve de módulo de descoberta de provedor, relativo à raiz do Plugin, para metadados de catálogo de provedor no escopo do manifesto que possam ser carregados sem ativar o runtime completo do Plugin.                  |
| `modelSupport`                       | Não         | `object`                         | Metadados abreviados de família de modelos controlados pelo manifesto, usados para carregar automaticamente o Plugin antes do runtime.                                                                                             |
| `modelCatalog`                       | Não         | `object`                         | Metadados declarativos de catálogo de modelos para provedores controlados por este Plugin. Este é o contrato do plano de controle para futura listagem somente leitura, onboarding, seletores de modelo, aliases e supressão sem carregar o runtime do Plugin. |
| `providerEndpoints`                  | Não         | `object[]`                       | Metadados de host/baseUrl de endpoint controlados pelo manifesto para rotas de provedor que o core precisa classificar antes de o runtime do provedor ser carregado.                                                              |
| `cliBackends`                        | Não         | `string[]`                       | IDs de backend de inferência por CLI controlados por este Plugin. Usados para ativação automática no startup a partir de refs explícitas de configuração.                                                                          |
| `syntheticAuthRefs`                  | Não         | `string[]`                       | Refs de provedor ou backend de CLI cujo hook sintético de auth controlado pelo Plugin deve ser verificado durante a descoberta fria de modelos antes de o runtime ser carregado.                                                   |
| `nonSecretAuthMarkers`               | Não         | `string[]`                       | Valores placeholder de chave de API controlados por Plugin incluído que representam estado de credencial local, OAuth ou de ambiente, sem segredo.                                                                                |
| `commandAliases`                     | Não         | `object[]`                       | Nomes de comando controlados por este Plugin que devem produzir diagnósticos de configuração e CLI conscientes do Plugin antes de o runtime ser carregado.                                                                         |
| `providerAuthEnvVars`                | Não         | `Record<string, string[]>`       | Metadados legados e obsoletos de env de compatibilidade para lookup de auth/status do provedor. Prefira `setup.providers[].envVars` para novos Plugins; o OpenClaw ainda lê isso durante a janela de descontinuação.          |
| `providerAuthAliases`                | Não         | `Record<string, string>`         | IDs de provedor que devem reutilizar outro ID de provedor para lookup de auth, por exemplo um provedor de coding que compartilha a chave de API e perfis de auth do provedor base.                                                |
| `channelEnvVars`                     | Não         | `Record<string, string[]>`       | Metadados leves de env de canal que o OpenClaw pode inspecionar sem carregar código do Plugin. Use isso para superfícies de configuração de canal ou auth orientadas por env que helpers genéricos de startup/config devem enxergar. |
| `providerAuthChoices`                | Não         | `object[]`                       | Metadados leves de escolha de auth para seletores de onboarding, resolução de provedor preferido e ligação simples de flags de CLI.                                                                                               |
| `activation`                         | Não         | `object`                         | Metadados leves de planejador de ativação para carregamento acionado por provedor, comando, canal, rota e capability. Apenas metadados; o runtime do Plugin ainda controla o comportamento real.                                  |
| `setup`                              | Não         | `object`                         | Descritores leves de configuração/onboarding que superfícies de descoberta e configuração podem inspecionar sem carregar o runtime do Plugin.                                                                                      |
| `qaRunners`                          | Não         | `object[]`                       | Descritores leves de runner de QA usados pelo host compartilhado `openclaw qa` antes de o runtime do Plugin ser carregado.                                                                                                        |
| `contracts`                          | Não         | `object`                         | Snapshot estático de capability incluída para hooks externos de auth, fala, transcrição em tempo real, voz em tempo real, entendimento de mídia, geração de imagem, geração de música, geração de vídeo, web-fetch, pesquisa web e propriedade de ferramentas. |
| `mediaUnderstandingProviderMetadata` | Não         | `Record<string, object>`         | Padrões leves de entendimento de mídia para IDs de provedor declarados em `contracts.mediaUnderstandingProviders`.                                                                                                                 |
| `channelConfigs`                     | Não         | `Record<string, object>`         | Metadados de configuração de canal controlados pelo manifesto, mesclados em superfícies de descoberta e validação antes de o runtime ser carregado.                                                                               |
| `skills`                             | Não         | `string[]`                       | Diretórios de Skill a carregar, relativos à raiz do Plugin.                                                                                                                                                                        |
| `name`                               | Não         | `string`                         | Nome legível do Plugin.                                                                                                                                                                                                            |
| `description`                        | Não         | `string`                         | Resumo curto mostrado nas superfícies de Plugin.                                                                                                                                                                                   |
| `version`                            | Não         | `string`                         | Versão informativa do Plugin.                                                                                                                                                                                                      |
| `uiHints`                            | Não         | `Record<string, object>`         | Labels, placeholders e dicas de sensibilidade de UI para campos de configuração.                                                                                                                                                   |

## Referência de `providerAuthChoices`

Cada entrada `providerAuthChoices` descreve uma escolha de onboarding ou auth.
O OpenClaw lê isso antes de o runtime do provedor ser carregado.
Listas de configuração de provedor usam essas escolhas de manifesto, escolhas de
configuração derivadas de descritor e metadados de catálogo de instalação sem carregar o runtime do provedor.

| Campo                 | Obrigatório | Tipo                                            | O que significa                                                                                         |
| --------------------- | ----------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `provider`            | Sim         | `string`                                        | ID do provedor ao qual esta escolha pertence.                                                           |
| `method`              | Sim         | `string`                                        | ID do método de auth para encaminhamento.                                                               |
| `choiceId`            | Sim         | `string`                                        | ID estável de escolha de auth usado por fluxos de onboarding e CLI.                                     |
| `choiceLabel`         | Não         | `string`                                        | Label voltado ao usuário. Se omitido, o OpenClaw faz fallback para `choiceId`.                         |
| `choiceHint`          | Não         | `string`                                        | Texto curto de ajuda para o seletor.                                                                    |
| `assistantPriority`   | Não         | `number`                                        | Valores menores são ordenados antes em seletores interativos orientados por assistente.                |
| `assistantVisibility` | Não         | `"visible"` \| `"manual-only"`                  | Oculta a escolha dos seletores do assistente, mas ainda permite seleção manual pela CLI.              |
| `deprecatedChoiceIds` | Não         | `string[]`                                      | IDs legados de escolha que devem redirecionar usuários para esta escolha substituta.                   |
| `groupId`             | Não         | `string`                                        | ID opcional de grupo para agrupar escolhas relacionadas.                                                |
| `groupLabel`          | Não         | `string`                                        | Label voltado ao usuário para esse grupo.                                                               |
| `groupHint`           | Não         | `string`                                        | Texto curto de ajuda para o grupo.                                                                      |
| `optionKey`           | Não         | `string`                                        | Chave de opção interna para fluxos simples de auth com uma única flag.                                 |
| `cliFlag`             | Não         | `string`                                        | Nome da flag de CLI, como `--openrouter-api-key`.                                                      |
| `cliOption`           | Não         | `string`                                        | Formato completo da opção de CLI, como `--openrouter-api-key <key>`.                                   |
| `cliDescription`      | Não         | `string`                                        | Descrição usada na ajuda da CLI.                                                                        |
| `onboardingScopes`    | Não         | `Array<"text-inference" \| "image-generation">` | Em quais superfícies de onboarding esta escolha deve aparecer. Se omitido, o padrão é `["text-inference"]`. |

## Referência de `commandAliases`

Use `commandAliases` quando um Plugin controla um nome de comando de runtime que os usuários podem
colocar por engano em `plugins.allow` ou tentar executar como um comando de CLI raiz. O OpenClaw
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

| Campo        | Obrigatório | Tipo              | O que significa                                                          |
| ------------ | ----------- | ----------------- | ------------------------------------------------------------------------ |
| `name`       | Sim         | `string`          | Nome do comando que pertence a este Plugin.                              |
| `kind`       | Não         | `"runtime-slash"` | Marca o alias como um comando slash de chat em vez de um comando CLI raiz. |
| `cliCommand` | Não         | `string`          | Comando CLI raiz relacionado a sugerir para operações de CLI, se existir. |

## Referência de `activation`

Use `activation` quando o Plugin puder declarar de forma barata quais eventos do plano de controle
devem incluí-lo em um plano de ativação/carregamento.

Este bloco é metadado do planejador, não uma API de ciclo de vida. Ele não registra
comportamento de runtime, não substitui `register(...)` e não promete que o
código do Plugin já foi executado. O planejador de ativação usa esses campos para
restringir Plugins candidatos antes de fazer fallback para metadados de propriedade já existentes
no manifesto, como `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` e hooks.

Prefira o metadado mais restrito que já descreve a propriedade. Use
`providers`, `channels`, `commandAliases`, descritores de setup ou `contracts`
quando esses campos expressarem a relação. Use `activation` para dicas extras do planejador
que não possam ser representadas por esses campos de propriedade.
Use `cliBackends` de nível superior para aliases de runtime de CLI como `claude-cli`,
`codex-cli` ou `google-gemini-cli`; `activation.onAgentHarnesses` é apenas para
IDs embutidos de harness de agente que ainda não tenham um campo de propriedade.

Este bloco contém apenas metadados. Ele não registra comportamento de runtime e não
substitui `register(...)`, `setupEntry` ou outros entrypoints de runtime/Plugin.
Consumidores atuais o usam como uma dica de restrição antes de um carregamento mais amplo de Plugin, então
metadados de ativação ausentes normalmente só custam desempenho; eles não devem
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

| Campo              | Obrigatório | Tipo                                                 | O que significa                                                                                                                                    |
| ------------------ | ----------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onProviders`      | Não         | `string[]`                                           | IDs de provedor que devem incluir este Plugin em planos de ativação/carregamento.                                                                 |
| `onAgentHarnesses` | Não         | `string[]`                                           | IDs de runtime de harness embutido de agente que devem incluir este Plugin em planos de ativação/carregamento. Use `cliBackends` de nível superior para aliases de backend de CLI. |
| `onCommands`       | Não         | `string[]`                                           | IDs de comando que devem incluir este Plugin em planos de ativação/carregamento.                                                                  |
| `onChannels`       | Não         | `string[]`                                           | IDs de canal que devem incluir este Plugin em planos de ativação/carregamento.                                                                    |
| `onRoutes`         | Não         | `string[]`                                           | Tipos de rota que devem incluir este Plugin em planos de ativação/carregamento.                                                                   |
| `onCapabilities`   | Não         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Dicas amplas de capability usadas pelo planejamento de ativação do plano de controle. Prefira campos mais restritos quando possível.             |

Consumidores live atuais:

- o planejamento de CLI acionado por comando faz fallback para
  `commandAliases[].cliCommand` ou `commandAliases[].name` legados
- o planejamento de startup de runtime de agente usa `activation.onAgentHarnesses` para
  harnesses embutidos e `cliBackends[]` de nível superior para aliases de runtime de CLI
- o planejamento acionado por canal de setup/canal faz fallback para a propriedade
  legada `channels[]` quando metadados explícitos de ativação de canal estiverem ausentes
- o planejamento acionado por provedor de setup/runtime faz fallback para a propriedade
  legada `providers[]` e `cliBackends[]` de nível superior quando metadados explícitos
  de ativação de provedor estiverem ausentes

Diagnósticos do planejador podem distinguir dicas explícitas de ativação de fallback
de propriedade do manifesto. Por exemplo, `activation-command-hint` significa que
`activation.onCommands` correspondeu, enquanto `manifest-command-alias` significa que o
planejador usou a propriedade de `commandAliases` em vez disso. Esses rótulos de motivo são para
diagnósticos e testes do host; autores de Plugins devem continuar declarando os metadados
que melhor descrevem a propriedade.

## Referência de `qaRunners`

Use `qaRunners` quando um Plugin contribuir com um ou mais runners de transporte sob
a raiz compartilhada `openclaw qa`. Mantenha esses metadados baratos e estáticos; o
runtime do Plugin ainda controla o registro real da CLI por meio de uma superfície leve
`runtime-api.ts` que exporta `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Executa a trilha live de QA Matrix com suporte Docker contra um homeserver descartável"
    }
  ]
}
```

| Campo         | Obrigatório | Tipo     | O que significa                                                     |
| ------------- | ----------- | -------- | ------------------------------------------------------------------- |
| `commandName` | Sim         | `string` | Subcomando montado sob `openclaw qa`, por exemplo `matrix`.         |
| `description` | Não         | `string` | Texto de ajuda fallback usado quando o host compartilhado precisa de um comando stub. |

## Referência de `setup`

Use `setup` quando superfícies de configuração e onboarding precisarem de metadados leves controlados pelo Plugin
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

`cliBackends` de nível superior continua válido e segue descrevendo backends de inferência
de CLI. `setup.cliBackends` é a superfície de descritor específica de setup para
fluxos de plano de controle/setup que devem permanecer apenas como metadados.

Quando presentes, `setup.providers` e `setup.cliBackends` são a superfície preferida
de lookup descriptor-first para descoberta de setup. Se o descritor apenas restringir o Plugin candidato e o setup ainda precisar de hooks de runtime mais ricos em tempo de setup, defina `requiresRuntime: true` e mantenha `setup-api` como caminho de execução de fallback.

O OpenClaw também inclui `setup.providers[].envVars` em lookups genéricos de auth de provedor e de variáveis de ambiente. `providerAuthEnvVars` continua compatível por meio de um adaptador de compatibilidade durante a janela de descontinuação, mas Plugins não incluídos que ainda o usem recebem um diagnóstico de manifesto. Novos Plugins devem colocar metadados de env de setup/status em `setup.providers[].envVars`.

O OpenClaw também pode derivar escolhas simples de setup a partir de `setup.providers[].authMethods`
quando nenhuma entrada de setup estiver disponível, ou quando `setup.requiresRuntime: false`
declarar desnecessário um runtime de setup. Entradas explícitas `providerAuthChoices` continuam preferidas para labels personalizadas, flags de CLI, escopo de onboarding e metadados de assistente.

Defina `requiresRuntime: false` apenas quando esses descritores forem suficientes para a
superfície de setup. O OpenClaw trata `false` explícito como um contrato somente de descritor
e não executará `setup-api` nem `openclaw.setupEntry` para lookup de setup. Se
um Plugin somente de descritor ainda incluir uma dessas entradas de runtime de setup,
o OpenClaw reportará um diagnóstico aditivo e continuará ignorando-o. Omitir
`requiresRuntime` mantém o comportamento legado de fallback para que Plugins existentes que adicionaram
descritores sem a flag não quebrem.

Como o lookup de setup pode executar código `setup-api` controlado pelo Plugin, valores normalizados
de `setup.providers[].id` e `setup.cliBackends[]` devem permanecer exclusivos entre Plugins descobertos. Propriedade ambígua falha de forma fechada em vez de escolher um
vencedor pela ordem de descoberta.

Quando o runtime de setup é executado, diagnósticos do registro de setup reportam
desvio de descritor se `setup-api` registrar um provedor ou backend de CLI que os
descritores do manifesto não declaram, ou se um descritor não tiver um registro
correspondente em runtime. Esses diagnósticos são aditivos e não rejeitam Plugins legados.

### Referência de `setup.providers`

| Campo         | Obrigatório | Tipo       | O que significa                                                                        |
| ------------- | ----------- | ---------- | -------------------------------------------------------------------------------------- |
| `id`          | Sim         | `string`   | ID de provedor exposto durante setup ou onboarding. Mantenha IDs normalizados globalmente exclusivos. |
| `authMethods` | Não         | `string[]` | IDs de método de setup/auth que este provedor oferece sem carregar o runtime completo. |
| `envVars`     | Não         | `string[]` | Variáveis de env que superfícies genéricas de setup/status podem verificar antes de o runtime do Plugin ser carregado. |

### Campos de `setup`

| Campo              | Obrigatório | Tipo       | O que significa                                                                                      |
| ------------------ | ----------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `providers`        | Não         | `object[]` | Descritores de setup de provedor expostos durante setup e onboarding.                                |
| `cliBackends`      | Não         | `string[]` | IDs de backend em tempo de setup usados para lookup descriptor-first de setup. Mantenha IDs normalizados globalmente exclusivos. |
| `configMigrations` | Não         | `string[]` | IDs de migração de configuração controlados pela superfície de setup deste Plugin.                   |
| `requiresRuntime`  | Não         | `boolean`  | Se o setup ainda precisa de execução de `setup-api` após o lookup por descritor.                    |

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

| Campo         | Tipo       | O que significa                            |
| ------------- | ---------- | ------------------------------------------ |
| `label`       | `string`   | Label do campo voltado ao usuário.         |
| `help`        | `string`   | Texto curto de ajuda.                      |
| `tags`        | `string[]` | Tags opcionais de UI.                      |
| `advanced`    | `boolean`  | Marca o campo como avançado.               |
| `sensitive`   | `boolean`  | Marca o campo como secreto ou sensível.    |
| `placeholder` | `string`   | Texto de placeholder para entradas de formulário. |

## Referência de `contracts`

Use `contracts` apenas para metadados estáticos de propriedade de capability que o OpenClaw possa
ler sem importar o runtime do Plugin.

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

| Campo                            | Tipo       | O que significa                                                          |
| -------------------------------- | ---------- | ------------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | IDs de fábrica de extensão do servidor de app Codex, atualmente `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | IDs de runtime para os quais um Plugin incluído pode registrar middleware de resultado de ferramenta. |
| `externalAuthProviders`          | `string[]` | IDs de provedor cujo hook externo de perfil de auth é controlado por este Plugin. |
| `speechProviders`                | `string[]` | IDs de provedor de fala controlados por este Plugin.                     |
| `realtimeTranscriptionProviders` | `string[]` | IDs de provedor de transcrição em tempo real controlados por este Plugin. |
| `realtimeVoiceProviders`         | `string[]` | IDs de provedor de voz em tempo real controlados por este Plugin.        |
| `memoryEmbeddingProviders`       | `string[]` | IDs de provedor de embedding de memória controlados por este Plugin.     |
| `mediaUnderstandingProviders`    | `string[]` | IDs de provedor de entendimento de mídia controlados por este Plugin.    |
| `imageGenerationProviders`       | `string[]` | IDs de provedor de geração de imagem controlados por este Plugin.        |
| `videoGenerationProviders`       | `string[]` | IDs de provedor de geração de vídeo controlados por este Plugin.         |
| `webFetchProviders`              | `string[]` | IDs de provedor de web-fetch controlados por este Plugin.                |
| `webSearchProviders`             | `string[]` | IDs de provedor de pesquisa web controlados por este Plugin.             |
| `tools`                          | `string[]` | Nomes de ferramentas do agente controlados por este Plugin para verificações de contrato incluídas. |

`contracts.embeddedExtensionFactories` é mantido para fábricas de extensão
apenas do servidor de app Codex incluído. Transformações incluídas de resultado de ferramenta devem
declarar `contracts.agentToolResultMiddleware` e registrar com
`api.registerAgentToolResultMiddleware(...)` em vez disso. Plugins externos não podem
registrar middleware de resultado de ferramenta porque a superfície pode reescrever saídas
de ferramenta de alta confiança antes que o modelo as veja.

Plugins de provedor que implementam `resolveExternalAuthProfiles` devem declarar
`contracts.externalAuthProviders`. Plugins sem a declaração ainda passam
por um fallback de compatibilidade obsoleto, mas esse fallback é mais lento e
será removido após a janela de migração.

Provedores incluídos de embedding de memória devem declarar
`contracts.memoryEmbeddingProviders` para cada id de adaptador que expõem, incluindo
adaptadores internos como `local`. Caminhos autônomos de CLI usam esse contrato
de manifesto para carregar apenas o Plugin proprietário antes que o runtime completo do Gateway tenha
registrado provedores.

## Referência de `mediaUnderstandingProviderMetadata`

Use `mediaUnderstandingProviderMetadata` quando um provedor de entendimento de mídia tiver
modelos padrão, prioridade de fallback automático de auth ou suporte nativo a documentos que
helpers genéricos do core precisem antes de o runtime ser carregado. As chaves também devem ser declaradas em
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
| `autoPriority`         | `Record<string, number>`            | Números menores são ordenados antes para fallback automático de provedor baseado em credencial. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Entradas nativas de documento compatíveis com o provedor.                    |

## Referência de `channelConfigs`

Use `channelConfigs` quando um Plugin de canal precisar de metadados leves de configuração antes de
o runtime ser carregado. Descoberta de setup/status de canal somente leitura pode usar esses metadados
diretamente para canais externos configurados quando nenhuma entrada de setup estiver disponível, ou
quando `setup.requiresRuntime: false` declarar desnecessário um runtime de setup.

`channelConfigs` é metadado de manifesto do Plugin, não uma nova seção de configuração
de usuário em nível superior. Usuários ainda configuram instâncias de canal em `channels.<channel-id>`.
O OpenClaw lê metadados do manifesto para decidir qual Plugin controla esse
canal configurado antes de o código de runtime do Plugin ser executado.

Para um Plugin de canal, `configSchema` e `channelConfigs` descrevem caminhos diferentes:

- `configSchema` valida `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valida `channels.<channel-id>`

Plugins não incluídos que declaram `channels[]` também devem declarar entradas
correspondentes em `channelConfigs`. Sem isso, o OpenClaw ainda pode carregar o Plugin, mas
superfícies de schema de configuração em caminho frio, setup e UI de Controle não conseguem conhecer o formato de opção controlado pelo canal até que o runtime do Plugin seja executado.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` e
`nativeSkillsAutoEnabled` podem declarar padrões estáticos `auto` para verificações
de configuração de comando executadas antes de o runtime do canal ser carregado. Canais incluídos também podem publicar os mesmos padrões via `package.json#openclaw.channel.commands` junto com seus outros metadados de catálogo de canal controlados por pacote.

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
      "commands": {
        "nativeCommandsAutoEnabled": true,
        "nativeSkillsAutoEnabled": true
      },
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Cada entrada de canal pode incluir:

| Campo         | Tipo                     | O que significa                                                                                 |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema para `channels.<id>`. Obrigatório para cada entrada declarada de configuração de canal. |
| `uiHints`     | `Record<string, object>` | Labels/placeholders/dicas de sensibilidade opcionais de UI para essa seção de configuração do canal. |
| `label`       | `string`                 | Label do canal mesclada em superfícies de seletor e inspeção quando os metadados de runtime não estiverem prontos. |
| `description` | `string`                 | Descrição curta do canal para superfícies de inspeção e catálogo.                              |
| `commands`    | `object`                 | Padrões automáticos estáticos de comando nativo e Skill nativa para verificações de configuração pré-runtime. |
| `preferOver`  | `string[]`               | IDs legados ou de menor prioridade de Plugin que este canal deve superar em superfícies de seleção. |

### Substituindo outro Plugin de canal

Use `preferOver` quando seu Plugin for o proprietário preferido de um ID de canal que
outro Plugin também possa fornecer. Casos comuns são um ID de Plugin renomeado, um
Plugin independente que substitui um Plugin incluído ou um fork mantido que
mantém o mesmo ID de canal por compatibilidade de configuração.

```json
{
  "id": "acme-chat",
  "channels": ["chat"],
  "channelConfigs": {
    "chat": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "webhookUrl": { "type": "string" }
        }
      },
      "preferOver": ["chat"]
    }
  }
}
```

Quando `channels.chat` está configurado, o OpenClaw considera tanto o ID do canal quanto
o ID do Plugin preferido. Se o Plugin de prioridade menor foi selecionado apenas porque
está incluído ou ativado por padrão, o OpenClaw o desativa na configuração efetiva
de runtime para que um único Plugin controle o canal e suas ferramentas. A seleção explícita do usuário ainda prevalece: se o usuário ativar explicitamente ambos os Plugins, o OpenClaw
preserva essa escolha e reporta diagnósticos de canal/ferramenta duplicados em vez de
alterar silenciosamente o conjunto de Plugins solicitado.

Mantenha `preferOver` limitado a IDs de Plugin que realmente possam fornecer o mesmo canal.
Ele não é um campo geral de prioridade e não renomeia chaves de configuração do usuário.

## Referência de `modelSupport`

Use `modelSupport` quando o OpenClaw deve inferir seu Plugin de provedor a partir de
IDs abreviados de modelo como `gpt-5.5` ou `claude-sonnet-4.6` antes de o runtime do Plugin
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

- refs explícitas `provider/model` usam os metadados de manifesto `providers` do proprietário
- `modelPatterns` vencem `modelPrefixes`
- se um Plugin não incluído e um Plugin incluído corresponderem, o Plugin não incluído
  vence
- ambiguidade restante é ignorada até que o usuário ou a configuração especifique um provedor

Campos:

| Campo           | Tipo       | O que significa                                                               |
| --------------- | ---------- | ----------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefixos correspondidos com `startsWith` em IDs abreviados de modelo.         |
| `modelPatterns` | `string[]` | Fontes regex correspondidas em IDs abreviados de modelo após remoção de sufixo de perfil. |

## Referência de `modelCatalog`

Use `modelCatalog` quando o OpenClaw deve conhecer os metadados do modelo do provedor antes de
carregar o runtime do Plugin. Esta é a origem controlada pelo manifesto para linhas fixas
de catálogo, aliases de provedor, regras de supressão e modo de descoberta. A atualização em runtime
continua pertencendo ao código de runtime do provedor, mas o manifesto informa ao core quando o runtime
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
        "reason": "not available on Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

Campos de nível superior:

| Campo          | Tipo                                                     | O que significa                                                                                              |
| -------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `providers`    | `Record<string, object>`                                 | Linhas de catálogo para IDs de provedor controlados por este Plugin. As chaves também devem aparecer em `providers` de nível superior. |
| `aliases`      | `Record<string, object>`                                 | Aliases de provedor que devem resolver para um provedor controlado para planejamento de catálogo ou supressão. |
| `suppressions` | `object[]`                                               | Linhas de modelo de outra origem que este Plugin suprime por um motivo específico de provedor.              |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Se o catálogo do provedor pode ser lido a partir de metadados do manifesto, atualizado em cache ou exige runtime. |

Campos de provedor:

| Campo     | Tipo                     | O que significa                                                    |
| --------- | ------------------------ | ------------------------------------------------------------------ |
| `baseUrl` | `string`                 | URL base padrão opcional para modelos neste catálogo de provedor.  |
| `api`     | `ModelApi`               | Adaptador de API padrão opcional para modelos neste catálogo de provedor. |
| `headers` | `Record<string, string>` | Cabeçalhos estáticos opcionais que se aplicam a este catálogo de provedor. |
| `models`  | `object[]`               | Linhas obrigatórias de modelo. Linhas sem `id` são ignoradas.      |

Campos de modelo:

| Campo           | Tipo                                                           | O que significa                                                              |
| --------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `id`            | `string`                                                       | ID local do modelo no provedor, sem o prefixo `provider/`.                  |
| `name`          | `string`                                                       | Nome de exibição opcional.                                                   |
| `api`           | `ModelApi`                                                     | Substituição opcional de API por modelo.                                     |
| `baseUrl`       | `string`                                                       | Substituição opcional de URL base por modelo.                                |
| `headers`       | `Record<string, string>`                                       | Cabeçalhos estáticos opcionais por modelo.                                   |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalidades que o modelo aceita.                                             |
| `reasoning`     | `boolean`                                                      | Se o modelo expõe comportamento de reasoning.                                |
| `contextWindow` | `number`                                                       | Janela de contexto nativa do provedor.                                       |
| `contextTokens` | `number`                                                       | Limite efetivo opcional de contexto em runtime quando diferente de `contextWindow`. |
| `maxTokens`     | `number`                                                       | Máximo de tokens de saída quando conhecido.                                  |
| `cost`          | `object`                                                       | Preço opcional em USD por milhão de tokens, incluindo `tieredPricing` opcional. |
| `compat`        | `object`                                                       | Flags opcionais de compatibilidade que correspondem à compatibilidade de configuração de modelo do OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Status de listagem. Suprima apenas quando a linha não deve aparecer de forma alguma. |
| `statusReason`  | `string`                                                       | Motivo opcional mostrado com status não disponível.                          |
| `replaces`      | `string[]`                                                     | IDs locais antigos de modelo no provedor que este modelo substitui.          |
| `replacedBy`    | `string`                                                       | ID local do modelo no provedor que substitui linhas obsoletas.               |
| `tags`          | `string[]`                                                     | Tags estáveis usadas por seletores e filtros.                                |

Não coloque dados apenas de runtime em `modelCatalog`. Se um provedor precisar de
estado da conta, uma requisição de API ou descoberta de processo local para conhecer o conjunto completo
de modelos, declare esse provedor como `refreshable` ou `runtime` em `discovery`.

### Índice de Provedores do OpenClaw

O Índice de Provedores do OpenClaw é metadado de preview controlado pelo OpenClaw para provedores
cujos Plugins talvez ainda não estejam instalados. Ele não faz parte do manifesto de um Plugin.
Manifestos de Plugin continuam sendo a autoridade dos Plugins instalados. O Índice de Provedores é
o contrato interno de fallback que futuras superfícies de provedor instalável e seletores de modelo pré-instalação consumirão quando um Plugin de provedor não estiver instalado.

Ordem de autoridade do catálogo:

1. Configuração do usuário.
2. `modelCatalog` do manifesto do Plugin instalado.
3. Cache de catálogo de modelo a partir de atualização explícita.
4. Linhas de preview do Índice de Provedores do OpenClaw.

O Índice de Provedores não deve conter segredos, estado de ativação, hooks de runtime nem
dados live de modelo específicos da conta. Seus catálogos de preview usam o mesmo formato
de linha de provedor `modelCatalog` que os manifestos de Plugin, mas devem se limitar
a metadados estáveis de exibição, a menos que campos de adaptador de runtime como `api`,
`baseUrl`, preço ou flags de compatibilidade sejam mantidos intencionalmente alinhados com
o manifesto do Plugin instalado. Provedores com descoberta live de `/models` devem
gravar linhas atualizadas por meio do caminho explícito de cache de catálogo de modelo em vez de
fazer com que listagem normal ou onboarding chamem APIs do provedor.

Entradas do Índice de Provedores também podem carregar metadados de Plugin instalável para provedores
cujo Plugin saiu do core ou ainda não está instalado. Esses
metadados espelham o padrão do catálogo de canais: nome do pacote, especificação de instalação npm,
integridade esperada e labels leves de escolha de auth são suficientes para mostrar uma
opção de configuração instalável. Quando o Plugin é instalado, o manifesto dele prevalece e
a entrada do Índice de Provedores é ignorada para esse provedor.

Chaves legadas de capability de nível superior estão obsoletas. Use `openclaw doctor --fix` para
mover `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` e `webSearchProviders` para `contracts`; o carregamento normal
de manifesto não trata mais esses campos de nível superior como propriedade
de capability.

## Manifesto versus package.json

Os dois arquivos servem a finalidades diferentes:

| Arquivo                | Use para                                                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Descoberta, validação de configuração, metadados de escolha de auth e dicas de UI que precisam existir antes de o código do Plugin ser executado |
| `package.json`         | Metadados npm, instalação de dependências e o bloco `openclaw` usado para entrypoints, gating de instalação, setup ou metadados de catálogo |

Se você não tiver certeza de onde um metadado pertence, use esta regra:

- se o OpenClaw precisa conhecê-lo antes de carregar o código do Plugin, coloque-o em `openclaw.plugin.json`
- se ele trata de empacotamento, arquivos de entrada ou comportamento de instalação npm, coloque-o em `package.json`

### Campos de package.json que afetam a descoberta

Alguns metadados de Plugin pré-runtime vivem intencionalmente em `package.json` sob o
bloco `openclaw`, em vez de `openclaw.plugin.json`.

Exemplos importantes:

| Campo                                                             | O que significa                                                                                                                                                                       |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Declara entrypoints nativos de Plugin. Deve permanecer dentro do diretório do pacote do Plugin.                                                                                      |
| `openclaw.runtimeExtensions`                                      | Declara entrypoints de runtime JavaScript compilados para pacotes instalados. Deve permanecer dentro do diretório do pacote do Plugin.                                              |
| `openclaw.setupEntry`                                             | Entrypoint leve somente de setup usado durante onboarding, startup diferido de canal e descoberta de status de canal/SecretRef somente leitura. Deve permanecer dentro do diretório do pacote do Plugin. |
| `openclaw.runtimeSetupEntry`                                      | Declara o entrypoint de setup JavaScript compilado para pacotes instalados. Deve permanecer dentro do diretório do pacote do Plugin.                                                 |
| `openclaw.channel`                                                | Metadados leves de catálogo de canal, como labels, caminhos de docs, aliases e textos de seleção.                                                                                    |
| `openclaw.channel.commands`                                       | Metadados estáticos de comando nativo e padrão automático de Skill nativa usados por superfícies de configuração, auditoria e lista de comandos antes de o runtime do canal ser carregado. |
| `openclaw.channel.configuredState`                                | Metadados leves de verificador de estado configurado que podem responder “já existe configuração apenas por env?” sem carregar o runtime completo do canal.                          |
| `openclaw.channel.persistedAuthState`                             | Metadados leves de verificador de auth persistida que podem responder “já existe algo autenticado?” sem carregar o runtime completo do canal.                                        |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Dicas de instalação/atualização para Plugins incluídos e publicados externamente.                                                                                                    |
| `openclaw.install.defaultChoice`                                  | Caminho de instalação preferido quando várias fontes de instalação estão disponíveis.                                                                                                |
| `openclaw.install.minHostVersion`                                 | Versão mínima compatível do host OpenClaw, usando um piso semver como `>=2026.3.22`.                                                                                                 |
| `openclaw.install.expectedIntegrity`                              | String de integridade esperada do dist npm, como `sha512-...`; fluxos de instalação e atualização verificam o artefato obtido em relação a ela.                                     |
| `openclaw.install.allowInvalidConfigRecovery`                     | Permite um caminho restrito de recuperação por reinstalação de Plugin incluído quando a configuração está inválida.                                                                  |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permite que superfícies de canal somente de setup sejam carregadas antes do Plugin completo de canal durante o startup.                                                              |

Os metadados do manifesto decidem quais escolhas de provedor/canal/setup aparecem no
onboarding antes de o runtime ser carregado. `package.json#openclaw.install` informa ao
onboarding como obter ou ativar esse Plugin quando o usuário escolhe uma dessas
opções. Não mova dicas de instalação para `openclaw.plugin.json`.

`openclaw.install.minHostVersion` é aplicado durante a instalação e o carregamento do
registro de manifestos. Valores inválidos são rejeitados; valores válidos, porém mais novos, fazem
o Plugin ser ignorado em hosts mais antigos.

O pin exato de versão npm já vive em `npmSpec`, por exemplo
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Entradas oficiais de catálogo externo
devem combinar specs exatas com `expectedIntegrity` para que fluxos de atualização falhem
de forma fechada se o artefato npm obtido não corresponder mais à release fixada.
O onboarding interativo ainda oferece specs npm de registro confiável, incluindo nomes
simples de pacote e dist-tags, por compatibilidade. Diagnósticos de catálogo podem
distinguir fontes exatas, flutuantes, fixadas por integridade, sem integridade, com incompatibilidade
de nome de pacote e com escolha padrão inválida. Eles também alertam quando
`expectedIntegrity` está presente, mas não há uma fonte npm válida que ele possa fixar.
Quando `expectedIntegrity` está presente,
os fluxos de instalação/atualização o aplicam; quando ele é omitido, a resolução do registro é
registrada sem um pin de integridade.

Plugins de canal devem fornecer `openclaw.setupEntry` quando status, lista de canais,
ou varreduras de SecretRef precisarem identificar contas configuradas sem carregar o runtime completo.
A entrada de setup deve expor metadados do canal mais adaptadores de configuração, status e segredos
seguros para setup; mantenha clientes de rede, listeners do Gateway e
runtimes de transporte no entrypoint principal da extensão.

Campos de entrypoint de runtime não substituem verificações de limite de pacote para
campos de entrypoint de código-fonte. Por exemplo, `openclaw.runtimeExtensions` não pode tornar
carregável um caminho de `openclaw.extensions` que escape do pacote.

`openclaw.install.allowInvalidConfigRecovery` é intencionalmente restrito. Ele não
torna instaláveis configurações arbitrárias quebradas. Hoje ele permite apenas que fluxos de instalação se recuperem de falhas específicas de upgrade de Plugin incluído obsoleto, como um
caminho ausente de Plugin incluído ou uma entrada obsoleta `channels.<id>` para esse mesmo
Plugin incluído. Erros de configuração não relacionados ainda bloqueiam a instalação e mandam os operadores para `openclaw doctor --fix`.

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

Use isso quando setup, Doctor ou fluxos de estado configurado precisarem de um probe
barato de auth sim/não antes de o Plugin completo de canal ser carregado. O export de destino deve ser uma pequena
função que leia apenas o estado persistido; não o encaminhe pelo barrel completo
de runtime do canal.

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

Use isso quando um canal puder responder ao estado configurado a partir de env ou de outras entradas
pequenas não ligadas ao runtime. Se a verificação precisar de resolução completa de configuração ou do runtime real
do canal, mantenha essa lógica no hook `config.hasConfiguredState` do Plugin.

## Precedência de descoberta (IDs de Plugin duplicados)

O OpenClaw descobre Plugins a partir de várias raízes (incluídos, instalação global, workspace, caminhos explicitamente selecionados na configuração). Se duas descobertas compartilharem o mesmo `id`, apenas o manifesto de **maior precedência** é mantido; duplicatas de menor precedência são descartadas em vez de serem carregadas lado a lado.

Precedência, da maior para a menor:

1. **Selecionado por configuração** — um caminho fixado explicitamente em `plugins.entries.<id>`
2. **Incluído** — Plugins distribuídos com o OpenClaw
3. **Instalação global** — Plugins instalados na raiz global de Plugins do OpenClaw
4. **Workspace** — Plugins descobertos em relação ao workspace atual

Implicações:

- Uma cópia forkada ou obsoleta de um Plugin incluído que esteja no workspace não substituirá a build incluída.
- Para realmente substituir um Plugin incluído por um local, fixe-o via `plugins.entries.<id>` para que ele vença por precedência em vez de depender da descoberta no workspace.
- Descartes de duplicatas são registrados em log para que o Doctor e os diagnósticos de startup possam apontar para a cópia descartada.

## Requisitos de JSON Schema

- **Todo Plugin deve incluir um JSON Schema**, mesmo que não aceite configuração.
- Um schema vazio é aceitável (por exemplo, `{ "type": "object", "additionalProperties": false }`).
- Schemas são validados no momento da leitura/gravação da configuração, não em runtime.

## Comportamento de validação

- Chaves desconhecidas em `channels.*` são **erros**, a menos que o ID do canal seja declarado por
  um manifesto de Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*`
  devem referenciar IDs de Plugin **detectáveis**. IDs desconhecidos são **erros**.
- Se um Plugin estiver instalado, mas tiver manifesto ou schema ausente ou quebrado,
  a validação falha e o Doctor reporta o erro do Plugin.
- Se existir configuração de Plugin, mas o Plugin estiver **desativado**, a configuração é mantida e
  um **aviso** é exibido no Doctor + logs.

Consulte [Referência de configuração](/pt-BR/gateway/configuration) para o schema completo de `plugins.*`.

## Observações

- O manifesto é **obrigatório para Plugins nativos do OpenClaw**, incluindo carregamentos locais do sistema de arquivos. O runtime ainda carrega separadamente o módulo do Plugin; o manifesto é apenas para descoberta + validação.
- Manifestos nativos são analisados com JSON5, então comentários, vírgulas finais e chaves sem aspas são aceitos, desde que o valor final ainda seja um objeto.
- Apenas os campos documentados do manifesto são lidos pelo carregador de manifesto. Evite chaves personalizadas de nível superior.
- `channels`, `providers`, `cliBackends` e `skills` podem ser omitidos quando um Plugin não precisar deles.
- `providerDiscoveryEntry` deve permanecer leve e não deve importar código amplo de runtime; use-o para metadados estáticos de catálogo de provedor ou descritores restritos de descoberta, não para execução em tempo de requisição.
- Tipos exclusivos de Plugin são selecionados por `plugins.slots.*`: `kind: "memory"` via `plugins.slots.memory`, `kind: "context-engine"` via `plugins.slots.contextEngine` (padrão `legacy`).
- Metadados de variáveis de env (`setup.providers[].envVars`, `providerAuthEnvVars` obsoleto e `channelEnvVars`) são apenas declarativos. Status, auditoria, validação de entrega Cron e outras superfícies somente leitura ainda aplicam política de confiança e ativação efetiva do Plugin antes de tratar uma variável de env como configurada.
- Para metadados de assistente de runtime que exigem código de provedor, consulte [Hooks de runtime de provedor](/pt-BR/plugins/architecture-internals#provider-runtime-hooks).
- Se seu Plugin depender de módulos nativos, documente as etapas de build e quaisquer requisitos de lista de permissões do gerenciador de pacotes (por exemplo, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Relacionado

<CardGroup cols={3}>
  <Card title="Criando Plugins" href="/pt-BR/plugins/building-plugins" icon="rocket">
    Primeiros passos com Plugins.
  </Card>
  <Card title="Arquitetura de Plugins" href="/pt-BR/plugins/architecture" icon="diagram-project">
    Arquitetura interna e modelo de capability.
  </Card>
  <Card title="Visão geral do SDK" href="/pt-BR/plugins/sdk-overview" icon="book">
    Referência do SDK de Plugin e imports de subcaminho.
  </Card>
</CardGroup>
