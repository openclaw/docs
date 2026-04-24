---
read_when:
    - Você está criando um Plugin do OpenClaw
    - Você precisa enviar um schema de configuração do Plugin ou depurar erros de validação do Plugin
summary: Manifesto de Plugin + requisitos de schema JSON (validação estrita de configuração)
title: Manifesto de Plugin
x-i18n:
    generated_at: "2026-04-24T06:02:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: d27765f1efc9720bd68c73d3ede796a91e9afec479f89eda531dd14adc708e53
    source_path: plugins/manifest.md
    workflow: 15
---

Esta página é apenas para o **manifesto nativo de Plugin do OpenClaw**.

Para layouts de bundle compatíveis, consulte [Plugin bundles](/pt-BR/plugins/bundles).

Formatos de bundle compatíveis usam arquivos de manifesto diferentes:

- Bundle do Codex: `.codex-plugin/plugin.json`
- Bundle do Claude: `.claude-plugin/plugin.json` ou o layout padrão de componente do Claude
  sem manifesto
- Bundle do Cursor: `.cursor-plugin/plugin.json`

O OpenClaw também detecta automaticamente esses layouts de bundle, mas eles não são validados
contra o schema `openclaw.plugin.json` descrito aqui.

Para bundles compatíveis, o OpenClaw atualmente lê metadados do bundle mais raízes declaradas
de Skills, raízes de comandos do Claude, padrões de `settings.json` do bundle do Claude,
padrões de LSP do bundle do Claude e hook packs compatíveis quando o layout corresponde
às expectativas de runtime do OpenClaw.

Todo Plugin nativo do OpenClaw **deve** incluir um arquivo `openclaw.plugin.json` na
**raiz do Plugin**. O OpenClaw usa esse manifesto para validar configuração
**sem executar código do Plugin**. Manifestos ausentes ou inválidos são tratados como
erros de Plugin e bloqueiam a validação de configuração.

Consulte o guia completo do sistema de Plugins: [Plugins](/pt-BR/tools/plugin).
Para o modelo nativo de capacidade e a orientação atual de compatibilidade externa:
[Capability model](/pt-BR/plugins/architecture#public-capability-model).

## O que este arquivo faz

`openclaw.plugin.json` são os metadados que o OpenClaw lê **antes de carregar o
código do seu Plugin**. Tudo abaixo deve ser barato o suficiente para inspecionar sem iniciar
o runtime do Plugin.

**Use para:**

- identidade do Plugin, validação de configuração e dicas de UI de configuração
- metadados de autenticação, onboarding e configuração (alias, auto-enable, variáveis de env de provedor, escolhas de autenticação)
- dicas de ativação para superfícies do plano de controle
- propriedade abreviada de famílias de modelos
- snapshots estáticos de propriedade de capacidade (`contracts`)
- metadados do executor de QA que o host compartilhado `openclaw qa` pode inspecionar
- metadados de configuração específicos de canal mesclados em catálogo e superfícies de validação

**Não use para:** registrar comportamento de runtime, declarar entrypoints de código
ou metadados de instalação npm. Isso pertence ao código do Plugin e ao `package.json`.

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
| `id`                                 | Sim         | `string`                         | ID canônico do Plugin. Este é o ID usado em `plugins.entries.<id>`.                                                                                                                                                               |
| `configSchema`                       | Sim         | `object`                         | JSON Schema inline para a configuração deste Plugin.                                                                                                                                                                               |
| `enabledByDefault`                   | Não         | `true`                           | Marca um Plugin empacotado como habilitado por padrão. Omita-o, ou defina qualquer valor diferente de `true`, para deixar o Plugin desabilitado por padrão.                                                                      |
| `legacyPluginIds`                    | Não         | `string[]`                       | IDs legados que são normalizados para este ID canônico de Plugin.                                                                                                                                                                  |
| `autoEnableWhenConfiguredProviders`  | Não         | `string[]`                       | IDs de provedor que devem habilitar automaticamente este Plugin quando autenticação, configuração ou referências de modelo os mencionarem.                                                                                         |
| `kind`                               | Não         | `"memory"` \| `"context-engine"` | Declara um tipo exclusivo de Plugin usado por `plugins.slots.*`.                                                                                                                                                                   |
| `channels`                           | Não         | `string[]`                       | IDs de canal pertencentes a este Plugin. Usado para descoberta e validação de configuração.                                                                                                                                       |
| `providers`                          | Não         | `string[]`                       | IDs de provedor pertencentes a este Plugin.                                                                                                                                                                                        |
| `providerDiscoveryEntry`             | Não         | `string`                         | Caminho leve de módulo de descoberta de provedor, relativo à raiz do Plugin, para metadados de catálogo de provedor com escopo de manifesto que podem ser carregados sem ativar o runtime completo do Plugin.                 |
| `modelSupport`                       | Não         | `object`                         | Metadados abreviados de família de modelos pertencentes ao manifesto usados para carregar automaticamente o Plugin antes do runtime.                                                                                              |
| `providerEndpoints`                  | Não         | `object[]`                       | Metadados de manifesto sobre host/baseUrl de endpoint para rotas de provedor que o core precisa classificar antes que o runtime do provedor seja carregado.                                                                      |
| `cliBackends`                        | Não         | `string[]`                       | IDs de backend de inferência da CLI pertencentes a este Plugin. Usado para autoativação na inicialização a partir de referências explícitas de configuração.                                                                     |
| `syntheticAuthRefs`                  | Não         | `string[]`                       | Referências de provedor ou backend da CLI cujo hook de autenticação sintética pertencente ao Plugin deve ser sondado durante a descoberta fria de modelos antes de o runtime carregar.                                         |
| `nonSecretAuthMarkers`               | Não         | `string[]`                       | Valores placeholder de chave de API pertencentes a Plugin empacotado que representam estado local, OAuth ou credenciais de ambiente sem segredo.                                                                                 |
| `commandAliases`                     | Não         | `object[]`                       | Nomes de comando pertencentes a este Plugin que devem produzir diagnósticos conscientes do Plugin para configuração e CLI antes de o runtime carregar.                                                                           |
| `providerAuthEnvVars`                | Não         | `Record<string, string[]>`       | Metadados leves de env para autenticação de provedor que o OpenClaw pode inspecionar sem carregar código do Plugin.                                                                                                             |
| `providerAuthAliases`                | Não         | `Record<string, string>`         | IDs de provedor que devem reutilizar outro ID de provedor para busca de autenticação, por exemplo um provedor de coding que compartilha a chave de API e perfis de autenticação do provedor base.                              |
| `channelEnvVars`                     | Não         | `Record<string, string[]>`       | Metadados leves de env de canal que o OpenClaw pode inspecionar sem carregar código do Plugin. Use isso para superfícies de configuração ou autenticação de canal dirigidas por env que helpers genéricos de inicialização/configuração devem enxergar. |
| `providerAuthChoices`                | Não         | `object[]`                       | Metadados leves de escolhas de autenticação para seletores de onboarding, resolução de provedor preferido e ligação simples de flags de CLI.                                                                                   |
| `activation`                         | Não         | `object`                         | Metadados leves do planejador de ativação para carregamento acionado por provedor, comando, canal, rota e capacidade. Apenas metadados; o runtime do Plugin continua sendo responsável pelo comportamento real.                |
| `setup`                              | Não         | `object`                         | Descritores leves de configuração/onboarding que superfícies de descoberta e configuração podem inspecionar sem carregar o runtime do Plugin.                                                                                   |
| `qaRunners`                          | Não         | `object[]`                       | Descritores leves de executores de QA usados pelo host compartilhado `openclaw qa` antes de o runtime do Plugin carregar.                                                                                                      |
| `contracts`                          | Não         | `object`                         | Snapshot estático de capacidade empacotada para hooks externos de autenticação, fala, transcrição em tempo real, voz em tempo real, entendimento de mídia, geração de imagem, geração de música, geração de vídeo, web-fetch, web search e propriedade de ferramentas. |
| `mediaUnderstandingProviderMetadata` | Não         | `Record<string, object>`         | Padrões leves de entendimento de mídia para IDs de provedor declarados em `contracts.mediaUnderstandingProviders`.                                                                                                             |
| `channelConfigs`                     | Não         | `Record<string, object>`         | Metadados de configuração de canal pertencentes ao manifesto mesclados em superfícies de descoberta e validação antes de o runtime carregar.                                                                                   |
| `skills`                             | Não         | `string[]`                       | Diretórios de Skills a carregar, relativos à raiz do Plugin.                                                                                                                                                                      |
| `name`                               | Não         | `string`                         | Nome legível por humanos do Plugin.                                                                                                                                                                                               |
| `description`                        | Não         | `string`                         | Resumo curto mostrado em superfícies de Plugin.                                                                                                                                                                                   |
| `version`                            | Não         | `string`                         | Versão informativa do Plugin.                                                                                                                                                                                                     |
| `uiHints`                            | Não         | `Record<string, object>`         | Rótulos de UI, placeholders e dicas de sensibilidade para campos de configuração.                                                                                                                                                |

## Referência de `providerAuthChoices`

Cada entrada `providerAuthChoices` descreve uma escolha de onboarding ou autenticação.
O OpenClaw lê isso antes que o runtime do provedor carregue.

| Campo                | Obrigatório | Tipo                                            | O que significa                                                                                          |
| -------------------- | ----------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`           | Sim         | `string`                                        | ID do provedor ao qual esta escolha pertence.                                                            |
| `method`             | Sim         | `string`                                        | ID do método de autenticação para despacho.                                                              |
| `choiceId`           | Sim         | `string`                                        | ID estável da escolha de autenticação usado por fluxos de onboarding e CLI.                              |
| `choiceLabel`        | Não         | `string`                                        | Rótulo voltado para o usuário. Se omitido, o OpenClaw usa `choiceId` como fallback.                     |
| `choiceHint`         | Não         | `string`                                        | Texto curto de ajuda para o seletor.                                                                     |
| `assistantPriority`  | Não         | `number`                                        | Valores menores aparecem antes em seletores interativos dirigidos por assistente.                        |
| `assistantVisibility`| Não         | `"visible"` \| `"manual-only"`                  | Oculta a escolha dos seletores do assistente, mas ainda permite seleção manual pela CLI.                |
| `deprecatedChoiceIds`| Não         | `string[]`                                      | IDs legados de escolha que devem redirecionar usuários para esta escolha substituta.                     |
| `groupId`            | Não         | `string`                                        | ID opcional de grupo para agrupar escolhas relacionadas.                                                 |
| `groupLabel`         | Não         | `string`                                        | Rótulo voltado para o usuário desse grupo.                                                               |
| `groupHint`          | Não         | `string`                                        | Texto curto de ajuda para o grupo.                                                                       |
| `optionKey`          | Não         | `string`                                        | Chave interna de opção para fluxos simples de autenticação com uma única flag.                           |
| `cliFlag`            | Não         | `string`                                        | Nome da flag da CLI, como `--openrouter-api-key`.                                                        |
| `cliOption`          | Não         | `string`                                        | Forma completa da opção da CLI, como `--openrouter-api-key <key>`.                                       |
| `cliDescription`     | Não         | `string`                                        | Descrição usada na ajuda da CLI.                                                                         |
| `onboardingScopes`   | Não         | `Array<"text-inference" \| "image-generation">` | Em quais superfícies de onboarding esta escolha deve aparecer. Se omitido, o padrão é `["text-inference"]`. |

## Referência de `commandAliases`

Use `commandAliases` quando um Plugin possui um nome de comando de runtime que os usuários podem
colocar por engano em `plugins.allow` ou tentar executar como comando raiz da CLI. O OpenClaw
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
| `kind`       | Não         | `"runtime-slash"` | Marca o alias como um comando slash de chat, e não como um comando raiz da CLI. |
| `cliCommand` | Não         | `string`          | Comando raiz da CLI relacionado a sugerir para operações da CLI, se existir. |

## Referência de `activation`

Use `activation` quando o Plugin puder declarar de forma barata quais eventos do plano de controle
devem incluí-lo em um plano de ativação/carregamento.

Este bloco é metadado do planejador, não uma API de ciclo de vida. Ele não registra
comportamento de runtime, não substitui `register(...)` e não promete que
o código do Plugin já tenha sido executado. O planejador de ativação usa esses campos para
reduzir os Plugins candidatos antes de recorrer a metadados existentes de propriedade do manifesto,
como `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` e hooks.

Prefira os metadados mais estreitos que já descrevem a propriedade. Use
`providers`, `channels`, `commandAliases`, descritores de setup ou `contracts`
quando esses campos expressarem a relação. Use `activation` para dicas extras do planejador
que não possam ser representadas por esses campos de propriedade.

Este bloco é apenas metadado. Ele não registra comportamento de runtime e não
substitui `register(...)`, `setupEntry` ou outros entrypoints de runtime/plugin.
Consumidores atuais o usam como dica de redução antes de um carregamento mais amplo de Plugin, então
metadados ausentes de ativação normalmente só impactam desempenho; não devem
mudar a correção enquanto os fallbacks legados de propriedade do manifesto ainda existirem.

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

| Campo            | Obrigatório | Tipo                                                 | O que significa                                                                                           |
| ---------------- | ----------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `onProviders`    | Não         | `string[]`                                           | IDs de provedor que devem incluir este Plugin em planos de ativação/carregamento.                         |
| `onCommands`     | Não         | `string[]`                                           | IDs de comando que devem incluir este Plugin em planos de ativação/carregamento.                          |
| `onChannels`     | Não         | `string[]`                                           | IDs de canal que devem incluir este Plugin em planos de ativação/carregamento.                            |
| `onRoutes`       | Não         | `string[]`                                           | Tipos de rota que devem incluir este Plugin em planos de ativação/carregamento.                           |
| `onCapabilities` | Não         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Dicas amplas de capacidade usadas pelo planejamento de ativação do plano de controle. Prefira campos mais estreitos quando possível. |

Consumidores ativos atuais:

- o planejamento de CLI acionado por comando usa fallback para
  `commandAliases[].cliCommand` ou `commandAliases[].name` legados
- o planejamento de setup/canal acionado por canal usa fallback para a propriedade
  legada `channels[]` quando metadados explícitos de ativação de canal estão ausentes
- o planejamento de setup/runtime acionado por provedor usa fallback para a propriedade
  legada `providers[]` e `cliBackends[]` de nível superior quando metadados explícitos
  de ativação de provedor estão ausentes

Diagnósticos do planejador podem distinguir entre dicas explícitas de ativação e
fallback de propriedade do manifesto. Por exemplo, `activation-command-hint` significa que
`activation.onCommands` correspondeu, enquanto `manifest-command-alias` significa que o
planejador usou a propriedade de `commandAliases`. Esses rótulos de motivo são para
diagnósticos e testes do host; autores de Plugin devem continuar declarando os metadados
que melhor descrevem a propriedade.

## Referência de `qaRunners`

Use `qaRunners` quando um Plugin contribuir com um ou mais executores de transporte sob
a raiz compartilhada `openclaw qa`. Mantenha esses metadados baratos e estáticos; o
runtime do Plugin continua sendo responsável pelo registro real na CLI por meio de uma superfície
leve `runtime-api.ts` que exporta `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Executa a lane de QA ao vivo do Matrix com suporte de Docker contra um homeserver descartável"
    }
  ]
}
```

| Campo         | Obrigatório | Tipo     | O que significa                                                     |
| ------------- | ----------- | -------- | ------------------------------------------------------------------- |
| `commandName` | Sim         | `string` | Subcomando montado sob `openclaw qa`, por exemplo `matrix`.         |
| `description` | Não         | `string` | Texto de ajuda de fallback usado quando o host compartilhado precisa de um comando stub. |

## Referência de `setup`

Use `setup` quando superfícies de setup e onboarding precisarem de metadados baratos pertencentes ao Plugin
antes que o runtime carregue.

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

`cliBackends` de nível superior continua válido e segue descrevendo backends
de inferência da CLI. `setup.cliBackends` é a superfície de descritor específica de setup para
fluxos de plano de controle/setup que devem permanecer apenas como metadados.

Quando presentes, `setup.providers` e `setup.cliBackends` são a superfície preferida
de lookup orientada por descritor para descoberta de setup. Se o descritor apenas
reduzir o Plugin candidato e o setup ainda precisar de hooks mais ricos de runtime em tempo de setup, defina `requiresRuntime: true` e mantenha `setup-api` como
caminho de execução de fallback.

Como o lookup de setup pode executar código `setup-api` pertencente ao Plugin, os valores normalizados
de `setup.providers[].id` e `setup.cliBackends[]` devem permanecer exclusivos entre
Plugins descobertos. Propriedade ambígua falha de forma segura em vez de escolher
um vencedor pela ordem de descoberta.

### Referência de `setup.providers`

| Campo         | Obrigatório | Tipo       | O que significa                                                                       |
| ------------- | ----------- | ---------- | ------------------------------------------------------------------------------------- |
| `id`          | Sim         | `string`   | ID do provedor exposto durante setup ou onboarding. Mantenha IDs normalizados globalmente únicos. |
| `authMethods` | Não         | `string[]` | IDs de método de setup/autenticação que esse provedor suporta sem carregar o runtime completo. |
| `envVars`     | Não         | `string[]` | Variáveis de env que superfícies genéricas de setup/status podem verificar antes de o runtime do Plugin carregar. |

### Campos de `setup`

| Campo              | Obrigatório | Tipo       | O que significa                                                                                      |
| ------------------ | ----------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `providers`        | Não         | `object[]` | Descritores de setup de provedor expostos durante setup e onboarding.                                |
| `cliBackends`      | Não         | `string[]` | IDs de backend em tempo de setup usados para lookup de setup orientado por descritor. Mantenha IDs normalizados globalmente únicos. |
| `configMigrations` | Não         | `string[]` | IDs de migração de configuração pertencentes à superfície de setup deste Plugin.                     |
| `requiresRuntime`  | Não         | `boolean`  | Se o setup ainda precisa de execução de `setup-api` após o lookup do descritor.                     |

## Referência de `uiHints`

`uiHints` é um mapa de nomes de campo de configuração para pequenas dicas de renderização.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "Chave de API",
      "help": "Usada para requests do OpenRouter",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Cada dica de campo pode incluir:

| Campo         | Tipo       | O que significa                         |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Rótulo do campo voltado para o usuário. |
| `help`        | `string`   | Texto curto de ajuda.                   |
| `tags`        | `string[]` | Tags opcionais de UI.                   |
| `advanced`    | `boolean`  | Marca o campo como avançado.            |
| `sensitive`   | `boolean`  | Marca o campo como secreto ou sensível. |
| `placeholder` | `string`   | Texto placeholder para entradas de formulário. |

## Referência de `contracts`

Use `contracts` apenas para metadados estáticos de propriedade de capacidade que o OpenClaw possa
ler sem importar o runtime do Plugin.

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
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

| Campo                            | Tipo       | O que significa                                                     |
| -------------------------------- | ---------- | ------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | IDs de runtime embutido para os quais um Plugin empacotado pode registrar factories. |
| `externalAuthProviders`          | `string[]` | IDs de provedor cujo hook de perfil de autenticação externa pertence a este Plugin.   |
| `speechProviders`                | `string[]` | IDs de provedor de fala pertencentes a este Plugin.                 |
| `realtimeTranscriptionProviders` | `string[]` | IDs de provedor de transcrição em tempo real pertencentes a este Plugin. |
| `realtimeVoiceProviders`         | `string[]` | IDs de provedor de voz em tempo real pertencentes a este Plugin.    |
| `memoryEmbeddingProviders`       | `string[]` | IDs de provedor de embedding de memória pertencentes a este Plugin. |
| `mediaUnderstandingProviders`    | `string[]` | IDs de provedor de entendimento de mídia pertencentes a este Plugin. |
| `imageGenerationProviders`       | `string[]` | IDs de provedor de geração de imagem pertencentes a este Plugin.    |
| `videoGenerationProviders`       | `string[]` | IDs de provedor de geração de vídeo pertencentes a este Plugin.     |
| `webFetchProviders`              | `string[]` | IDs de provedor de web-fetch pertencentes a este Plugin.            |
| `webSearchProviders`             | `string[]` | IDs de provedor de web search pertencentes a este Plugin.           |
| `tools`                          | `string[]` | Nomes de ferramentas do agente pertencentes a este Plugin para verificações de contrato empacotadas. |

Plugins de provedor que implementam `resolveExternalAuthProfiles` devem declarar
`contracts.externalAuthProviders`. Plugins sem essa declaração ainda passam por um fallback de compatibilidade obsoleto, mas esse fallback é mais lento e
será removido após a janela de migração.

Provedores empacotados de embedding de memória devem declarar
`contracts.memoryEmbeddingProviders` para cada ID de adaptador que expõem, incluindo
adaptadores integrados como `local`. Caminhos autônomos da CLI usam esse contrato de manifesto para carregar apenas o Plugin proprietário antes que o runtime completo do Gateway tenha registrado os provedores.

## Referência de `mediaUnderstandingProviderMetadata`

Use `mediaUnderstandingProviderMetadata` quando um provedor de entendimento de mídia tiver
modelos padrão, prioridade de fallback automática de autenticação ou suporte nativo a documentos que
helpers genéricos do core precisem antes que o runtime carregue. As chaves também devem ser declaradas em
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
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capacidades de mídia expostas por este provedor.                             |
| `defaultModels`        | `Record<string, string>`            | Padrões de capacidade para modelo usados quando a configuração não especifica um modelo. |
| `autoPriority`         | `Record<string, number>`            | Números menores aparecem antes em fallback automático de provedor baseado em credencial. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Entradas nativas de documento compatíveis pelo provedor.                     |

## Referência de `channelConfigs`

Use `channelConfigs` quando um Plugin de canal precisar de metadados baratos de configuração antes
que o runtime carregue.

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

| Campo         | Tipo                     | O que significa                                                                            |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| `schema`      | `object`                 | JSON Schema para `channels.<id>`. Obrigatório para cada entrada declarada de configuração de canal. |
| `uiHints`     | `Record<string, object>` | Rótulos/placeholders/dicas de sensibilidade opcionais de UI para essa seção de configuração de canal. |
| `label`       | `string`                 | Rótulo de canal mesclado em superfícies de seletor e inspeção quando os metadados de runtime ainda não estiverem prontos. |
| `description` | `string`                 | Descrição curta do canal para superfícies de inspeção e catálogo.                          |
| `preferOver`  | `string[]`               | IDs legados ou de menor prioridade de Plugin que este canal deve superar em superfícies de seleção. |

## Referência de `modelSupport`

Use `modelSupport` quando o OpenClaw deve inferir seu Plugin de provedor a partir de
IDs abreviados de modelo como `gpt-5.5` ou `claude-sonnet-4.6` antes que o runtime do Plugin
carregue.

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
- `modelPatterns` vencem `modelPrefixes`
- se um Plugin não empacotado e um Plugin empacotado corresponderem, o Plugin não empacotado vence
- ambiguidades restantes são ignoradas até que o usuário ou a configuração especifique um provedor

Campos:

| Campo           | Tipo       | O que significa                                                                 |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefixos correspondidos com `startsWith` em IDs abreviados de modelo.           |
| `modelPatterns` | `string[]` | Fontes regex correspondidas com IDs abreviados de modelo após remoção do sufixo de perfil. |

Chaves legadas de capacidade de nível superior estão obsoletas. Use `openclaw doctor --fix` para
mover `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` e `webSearchProviders` para `contracts`; o
carregamento normal de manifesto não trata mais esses campos de nível superior como
propriedade de capacidade.

## Manifesto versus package.json

Os dois arquivos têm funções diferentes:

| Arquivo                | Use para                                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json` | Descoberta, validação de configuração, metadados de escolha de autenticação e dicas de UI que devem existir antes de o código do Plugin rodar |
| `package.json`         | Metadados npm, instalação de dependências e o bloco `openclaw` usado para entrypoints, controle de instalação, setup ou metadados de catálogo |

Se você não tiver certeza de onde um pedaço de metadado pertence, use esta regra:

- se o OpenClaw precisa conhecê-lo antes de carregar o código do Plugin, coloque em `openclaw.plugin.json`
- se for sobre empacotamento, arquivos de entrada ou comportamento de instalação do npm, coloque em `package.json`

### Campos de `package.json` que afetam descoberta

Alguns metadados pré-runtime do Plugin intencionalmente ficam em `package.json`, sob o
bloco `openclaw`, em vez de `openclaw.plugin.json`.

Exemplos importantes:

| Campo                                                            | O que significa                                                                                                                                                                     |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                            | Declara entrypoints nativos de Plugin. Devem permanecer dentro do diretório do pacote do Plugin.                                                                                  |
| `openclaw.runtimeExtensions`                                     | Declara entrypoints de runtime JavaScript já gerados para pacotes instalados. Devem permanecer dentro do diretório do pacote do Plugin.                                         |
| `openclaw.setupEntry`                                            | Entrypoint leve apenas de setup usado durante onboarding, inicialização adiada de canal e descoberta somente leitura de status de canal/SecretRef. Deve permanecer dentro do diretório do pacote do Plugin. |
| `openclaw.runtimeSetupEntry`                                     | Declara o entrypoint de setup em JavaScript já gerado para pacotes instalados. Deve permanecer dentro do diretório do pacote do Plugin.                                         |
| `openclaw.channel`                                               | Metadados baratos de catálogo de canal, como rótulos, caminhos de documentação, aliases e texto de seleção.                                                                       |
| `openclaw.channel.configuredState`                               | Metadados leves de verificador de estado configurado que conseguem responder "já existe configuração apenas por env?" sem carregar o runtime completo do canal.                  |
| `openclaw.channel.persistedAuthState`                            | Metadados leves de verificador de autenticação persistida que conseguem responder "já existe algo autenticado?" sem carregar o runtime completo do canal.                        |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`        | Dicas de instalação/atualização para Plugins empacotados e publicados externamente.                                                                                               |
| `openclaw.install.defaultChoice`                                 | Caminho de instalação preferido quando várias fontes de instalação estão disponíveis.                                                                                              |
| `openclaw.install.minHostVersion`                                | Versão mínima compatível do host OpenClaw, usando um piso semver como `>=2026.3.22`.                                                                                              |
| `openclaw.install.expectedIntegrity`                             | String esperada de integridade do dist npm, como `sha512-...`; fluxos de instalação e atualização verificam o artefato obtido contra ela.                                       |
| `openclaw.install.allowInvalidConfigRecovery`                    | Permite um caminho estreito de recuperação por reinstalação de Plugin empacotado quando a configuração é inválida.                                                                |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`| Permite que superfícies de canal apenas de setup carreguem antes do Plugin completo do canal durante a inicialização.                                                             |

Metadados do manifesto decidem quais escolhas de provedor/canal/setup aparecem no
onboarding antes que o runtime carregue. `package.json#openclaw.install` diz ao
onboarding como buscar ou habilitar esse Plugin quando o usuário escolhe uma dessas
opções. Não mova dicas de instalação para `openclaw.plugin.json`.

`openclaw.install.minHostVersion` é aplicado durante instalação e carregamento do registro
de manifestos. Valores inválidos são rejeitados; valores válidos, porém mais novos, fazem o Plugin ser ignorado em hosts mais antigos.

A fixação exata de versão npm já fica em `npmSpec`, por exemplo
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Combine isso com
`expectedIntegrity` quando quiser que fluxos de atualização falhem de forma segura se o
artefato npm obtido não corresponder mais à versão fixada. O onboarding interativo
oferece especificações npm confiáveis de registro, incluindo nomes simples de pacote e dist-tags.
Quando `expectedIntegrity` está presente, fluxos de instalação/atualização o aplicam; quando
é omitido, a resolução de registro é registrada sem um pin de integridade.

Plugins de canal devem fornecer `openclaw.setupEntry` quando status, lista de canais
ou varreduras de SecretRef precisarem identificar contas configuradas sem carregar o
runtime completo. A entrada de setup deve expor metadados de canal mais adaptadores seguros para setup de
configuração, status e segredos; mantenha clientes de rede, listeners do gateway e
runtimes de transporte no entrypoint principal da extensão.

Campos de entrypoint de runtime não sobrescrevem verificações de limite de pacote para campos de
entrypoint de código-fonte. Por exemplo, `openclaw.runtimeExtensions` não pode tornar
carregável um caminho escapado de `openclaw.extensions`.

`openclaw.install.allowInvalidConfigRecovery` é intencionalmente estreito. Ele
não torna instaláveis configurações arbitrariamente quebradas. Hoje ele só permite que fluxos
de instalação se recuperem de falhas específicas e obsoletas de atualização de Plugin empacotado, como
um caminho ausente de Plugin empacotado ou uma entrada obsoleta `channels.<id>` para esse mesmo
Plugin empacotado. Erros de configuração não relacionados ainda bloqueiam a instalação e enviam operadores
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

Use isso quando fluxos de setup, doctor ou estado configurado precisarem de uma sonda
barata de autenticação sim/não antes que o Plugin completo do canal carregue. O export alvo deve ser uma função pequena
que leia apenas o estado persistido; não a roteie pelo barrel completo
de runtime do canal.

`openclaw.channel.configuredState` segue o mesmo formato para verificações baratas
de configuração apenas por env:

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

Use isso quando um canal puder responder estado configurado a partir de env ou outros
insumos pequenos que não sejam de runtime. Se a verificação precisar de resolução completa de configuração ou do
runtime real do canal, mantenha essa lógica no hook `config.hasConfiguredState`
do Plugin.

## Precedência de descoberta (IDs de Plugin duplicados)

O OpenClaw descobre Plugins em várias raízes (empacotado, instalação global, workspace, caminhos explicitamente selecionados pela configuração). Se duas descobertas compartilharem o mesmo `id`, apenas o manifesto de **maior precedência** é mantido; duplicatas de menor precedência são descartadas em vez de serem carregadas ao lado dele.

Precedência, da maior para a menor:

1. **Selecionado por configuração** — um caminho explicitamente fixado em `plugins.entries.<id>`
2. **Empacotado** — Plugins distribuídos com o OpenClaw
3. **Instalação global** — Plugins instalados na raiz global de Plugins do OpenClaw
4. **Workspace** — Plugins descobertos em relação ao workspace atual

Implicações:

- Uma cópia bifurcada ou obsoleta de um Plugin empacotado no workspace não sobrescreve o build empacotado.
- Para realmente sobrescrever um Plugin empacotado com um local, fixe-o via `plugins.entries.<id>` para que ele vença por precedência em vez de depender da descoberta no workspace.
- Descartes por duplicidade são registrados em log para que Doctor e diagnósticos de inicialização possam apontar para a cópia descartada.

## Requisitos de JSON Schema

- **Todo Plugin deve incluir um JSON Schema**, mesmo que não aceite configuração.
- Um schema vazio é aceitável (por exemplo, `{ "type": "object", "additionalProperties": false }`).
- Schemas são validados no momento de leitura/gravação da configuração, não em runtime.

## Comportamento de validação

- Chaves desconhecidas de `channels.*` são **erros**, a menos que o ID do canal seja declarado por
  um manifesto de Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*`
  devem referenciar IDs de Plugin **descobertos**. IDs desconhecidos são **erros**.
- Se um Plugin estiver instalado, mas tiver manifesto ou schema quebrado ou ausente,
  a validação falha e o Doctor reporta o erro do Plugin.
- Se existir configuração do Plugin, mas o Plugin estiver **desabilitado**, a configuração é mantida e
  um **aviso** é exibido no Doctor + logs.

Consulte [Configuration reference](/pt-BR/gateway/configuration) para ver o schema completo de `plugins.*`.

## Observações

- O manifesto é **obrigatório para Plugins nativos do OpenClaw**, incluindo carregamentos do sistema de arquivos local. O runtime ainda carrega separadamente o módulo do Plugin; o manifesto serve apenas para descoberta + validação.
- Manifestos nativos são analisados com JSON5, então comentários, vírgulas finais e chaves sem aspas são aceitos desde que o valor final ainda seja um objeto.
- Apenas os campos documentados do manifesto são lidos pelo carregador de manifesto. Evite chaves personalizadas de nível superior.
- `channels`, `providers`, `cliBackends` e `skills` podem todos ser omitidos quando um Plugin não precisar deles.
- `providerDiscoveryEntry` deve permanecer leve e não deve importar código amplo de runtime; use-o para metadados estáticos de catálogo de provedor ou descritores estreitos de descoberta, não para execução em tempo de request.
- Tipos exclusivos de Plugin são selecionados por `plugins.slots.*`: `kind: "memory"` via `plugins.slots.memory`, `kind: "context-engine"` via `plugins.slots.contextEngine` (padrão `legacy`).
- Metadados de variáveis de env (`providerAuthEnvVars`, `channelEnvVars`) são apenas declarativos. Superfícies de status, auditoria, validação de entrega de Cron e outras superfícies somente leitura ainda aplicam a política de confiança do Plugin e a política efetiva de ativação antes de tratar uma variável de env como configurada.
- Para metadados de assistente de runtime que exigem código do provedor, consulte [Provider runtime hooks](/pt-BR/plugins/architecture-internals#provider-runtime-hooks).
- Se seu Plugin depender de módulos nativos, documente as etapas de build e quaisquer requisitos de allowlist do gerenciador de pacotes (por exemplo, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Relacionados

<CardGroup cols={3}>
  <Card title="Building plugins" href="/pt-BR/plugins/building-plugins" icon="rocket">
    Primeiros passos com Plugins.
  </Card>
  <Card title="Plugin architecture" href="/pt-BR/plugins/architecture" icon="diagram-project">
    Arquitetura interna e modelo de capacidade.
  </Card>
  <Card title="SDK overview" href="/pt-BR/plugins/sdk-overview" icon="book">
    Referência do SDK de Plugin e imports de subcaminho.
  </Card>
</CardGroup>
