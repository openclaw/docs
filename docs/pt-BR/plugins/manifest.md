---
read_when:
    - Você está criando um Plugin do OpenClaw
    - Você precisa fornecer um schema de configuração do plugin ou depurar erros de validação do plugin
summary: Manifest do Plugin + requisitos do schema JSON (validação estrita de configuração)
title: Manifest do Plugin
x-i18n:
    generated_at: "2026-04-12T23:28:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 93b57c7373e4ccd521b10945346db67991543bd2bed4cc8b6641e1f215b48579
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifest do Plugin (`openclaw.plugin.json`)

Esta página é apenas para o **manifest nativo de Plugin do OpenClaw**.

Para layouts de bundle compatíveis, consulte [Bundles de Plugin](/pt-BR/plugins/bundles).

Formatos de bundle compatíveis usam arquivos de manifest diferentes:

- Bundle do Codex: `.codex-plugin/plugin.json`
- Bundle do Claude: `.claude-plugin/plugin.json` ou o layout padrão de componente do Claude
  sem um manifest
- Bundle do Cursor: `.cursor-plugin/plugin.json`

O OpenClaw também detecta automaticamente esses layouts de bundle, mas eles não são validados
com base no schema de `openclaw.plugin.json` descrito aqui.

Para bundles compatíveis, o OpenClaw atualmente lê metadados do bundle mais as raízes de
Skills declaradas, raízes de comandos do Claude, padrões de `settings.json` do bundle Claude,
padrões de LSP do bundle Claude e pacotes de hooks suportados quando o layout corresponde
às expectativas de runtime do OpenClaw.

Todo Plugin nativo do OpenClaw **deve** incluir um arquivo `openclaw.plugin.json` na
**raiz do plugin**. O OpenClaw usa esse manifest para validar a configuração
**sem executar o código do plugin**. Manifests ausentes ou inválidos são tratados como
erros do plugin e bloqueiam a validação da configuração.

Consulte o guia completo do sistema de plugins: [Plugins](/pt-BR/tools/plugin).
Para o modelo de capacidades nativo e a orientação atual de compatibilidade externa:
[Modelo de capacidades](/pt-BR/plugins/architecture#public-capability-model).

## O que este arquivo faz

`openclaw.plugin.json` são os metadados que o OpenClaw lê antes de carregar o
código do seu plugin.

Use-o para:

- identidade do plugin
- validação de configuração
- metadados de autenticação e onboarding que devem estar disponíveis sem iniciar o runtime do plugin
- dicas baratas de ativação que superfícies do plano de controle podem inspecionar antes de o runtime carregar
- descritores baratos de setup que superfícies de setup/onboarding podem inspecionar antes de o runtime carregar
- metadados de alias e auto-habilitação que devem ser resolvidos antes de o runtime do plugin carregar
- metadados abreviados de propriedade de família de modelos que devem autoativar o plugin antes de o runtime carregar
- snapshots estáticos de propriedade de capacidades usados para wiring de compatibilidade de bundles e cobertura de contrato
- metadados de configuração específicos de canal que devem ser mesclados em superfícies de catálogo e validação sem carregar o runtime
- dicas de UI para configuração

Não o use para:

- registrar comportamento de runtime
- declarar entrypoints de código
- metadados de instalação npm

Esses pertencem ao código do seu plugin e ao `package.json`.

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
  "description": "Plugin provider do OpenRouter",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "cliBackends": ["openrouter-cli"],
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

## Referência dos campos de nível superior

| Campo                               | Obrigatório | Tipo                             | O que significa                                                                                                                                                                                              |
| ----------------------------------- | ----------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Sim         | `string`                         | ID canônico do plugin. Este é o ID usado em `plugins.entries.<id>`.                                                                                                                                         |
| `configSchema`                      | Sim         | `object`                         | Schema JSON inline para a configuração deste plugin.                                                                                                                                                         |
| `enabledByDefault`                  | Não         | `true`                           | Marca um plugin empacotado como habilitado por padrão. Omita-o ou defina qualquer valor diferente de `true` para deixar o plugin desabilitado por padrão.                                                   |
| `legacyPluginIds`                   | Não         | `string[]`                       | IDs legados que são normalizados para este ID canônico de plugin.                                                                                                                                            |
| `autoEnableWhenConfiguredProviders` | Não         | `string[]`                       | IDs de provider que devem auto-habilitar este plugin quando autenticação, configuração ou referências de modelo os mencionarem.                                                                              |
| `kind`                              | Não         | `"memory"` \| `"context-engine"` | Declara um tipo exclusivo de plugin usado por `plugins.slots.*`.                                                                                                                                             |
| `channels`                          | Não         | `string[]`                       | IDs de canal pertencentes a este plugin. Usados para descoberta e validação de configuração.                                                                                                                |
| `providers`                         | Não         | `string[]`                       | IDs de provider pertencentes a este plugin.                                                                                                                                                                  |
| `modelSupport`                      | Não         | `object`                         | Metadados abreviados de família de modelos pertencentes ao manifest usados para carregar automaticamente o plugin antes do runtime.                                                                          |
| `cliBackends`                       | Não         | `string[]`                       | IDs de backend de inferência da CLI pertencentes a este plugin. Usados para autoativação na inicialização a partir de referências explícitas na configuração.                                               |
| `commandAliases`                    | Não         | `object[]`                       | Nomes de comando pertencentes a este plugin que devem produzir diagnósticos de configuração e CLI conscientes do plugin antes de o runtime carregar.                                                         |
| `providerAuthEnvVars`               | Não         | `Record<string, string[]>`       | Metadados baratos de env de autenticação de provider que o OpenClaw pode inspecionar sem carregar o código do plugin.                                                                                       |
| `providerAuthAliases`               | Não         | `Record<string, string>`         | IDs de provider que devem reutilizar outro ID de provider para busca de autenticação, por exemplo um provider de coding que compartilha a chave de API do provider base e perfis de autenticação.         |
| `channelEnvVars`                    | Não         | `Record<string, string[]>`       | Metadados baratos de env de canal que o OpenClaw pode inspecionar sem carregar o código do plugin. Use isso para superfícies de setup ou autenticação de canal orientadas por env que helpers genéricos de inicialização/configuração devem enxergar. |
| `providerAuthChoices`               | Não         | `object[]`                       | Metadados baratos de escolhas de autenticação para seletores de onboarding, resolução de provider preferido e wiring simples de flags da CLI.                                                               |
| `activation`                        | Não         | `object`                         | Dicas baratas de ativação para carregamento acionado por provider, comando, canal, rota e capacidade. Apenas metadados; o runtime do plugin ainda é dono do comportamento real.                            |
| `setup`                             | Não         | `object`                         | Descritores baratos de setup/onboarding que superfícies de descoberta e setup podem inspecionar sem carregar o runtime do plugin.                                                                            |
| `contracts`                         | Não         | `object`                         | Snapshot estático de capacidades empacotadas para speech, transcrição em tempo real, voz em tempo real, media-understanding, geração de imagem, geração de música, geração de vídeo, web-fetch, busca na web e propriedade de ferramentas. |
| `channelConfigs`                    | Não         | `Record<string, object>`         | Metadados de configuração de canal pertencentes ao manifest mesclados em superfícies de descoberta e validação antes de o runtime carregar.                                                                  |
| `skills`                            | Não         | `string[]`                       | Diretórios de Skills a serem carregados, relativos à raiz do plugin.                                                                                                                                         |
| `name`                              | Não         | `string`                         | Nome legível do plugin.                                                                                                                                                                                      |
| `description`                       | Não         | `string`                         | Resumo curto exibido nas superfícies do plugin.                                                                                                                                                              |
| `version`                           | Não         | `string`                         | Versão informativa do plugin.                                                                                                                                                                                |
| `uiHints`                           | Não         | `Record<string, object>`         | Rótulos de UI, placeholders e dicas de sensibilidade para campos de configuração.                                                                                                                            |

## Referência de `providerAuthChoices`

Cada entrada de `providerAuthChoices` descreve uma escolha de onboarding ou autenticação.
O OpenClaw lê isso antes de o runtime do provider carregar.

| Campo                 | Obrigatório | Tipo                                            | O que significa                                                                                          |
| --------------------- | ----------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Sim         | `string`                                        | ID do provider ao qual esta escolha pertence.                                                            |
| `method`              | Sim         | `string`                                        | ID do método de autenticação para direcionamento.                                                        |
| `choiceId`            | Sim         | `string`                                        | ID estável de escolha de autenticação usado pelos fluxos de onboarding e CLI.                            |
| `choiceLabel`         | Não         | `string`                                        | Rótulo voltado ao usuário. Se omitido, o OpenClaw usa `choiceId` como fallback.                          |
| `choiceHint`          | Não         | `string`                                        | Texto curto de ajuda para o seletor.                                                                     |
| `assistantPriority`   | Não         | `number`                                        | Valores menores aparecem antes em seletores interativos guiados pelo assistant.                          |
| `assistantVisibility` | Não         | `"visible"` \| `"manual-only"`                  | Oculta a escolha dos seletores do assistant, enquanto ainda permite seleção manual pela CLI.             |
| `deprecatedChoiceIds` | Não         | `string[]`                                      | IDs legados de escolha que devem redirecionar os usuários para esta escolha substituta.                  |
| `groupId`             | Não         | `string`                                        | ID opcional de grupo para agrupar escolhas relacionadas.                                                 |
| `groupLabel`          | Não         | `string`                                        | Rótulo voltado ao usuário para esse grupo.                                                               |
| `groupHint`           | Não         | `string`                                        | Texto curto de ajuda para o grupo.                                                                       |
| `optionKey`           | Não         | `string`                                        | Chave de opção interna para fluxos simples de autenticação com uma única flag.                           |
| `cliFlag`             | Não         | `string`                                        | Nome da flag da CLI, como `--openrouter-api-key`.                                                        |
| `cliOption`           | Não         | `string`                                        | Formato completo da opção da CLI, como `--openrouter-api-key <key>`.                                     |
| `cliDescription`      | Não         | `string`                                        | Descrição usada na ajuda da CLI.                                                                         |
| `onboardingScopes`    | Não         | `Array<"text-inference" \| "image-generation">` | Em quais superfícies de onboarding esta escolha deve aparecer. Se omitido, o padrão é `["text-inference"]`. |

## Referência de `commandAliases`

Use `commandAliases` quando um plugin é dono de um nome de comando de runtime que os usuários podem
colocar por engano em `plugins.allow` ou tentar executar como um comando raiz da CLI. O OpenClaw
usa esses metadados para diagnósticos sem importar o código de runtime do plugin.

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

| Campo        | Obrigatório | Tipo              | O que significa                                                         |
| ------------ | ----------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | Sim         | `string`          | Nome do comando que pertence a este plugin.                             |
| `kind`       | Não         | `"runtime-slash"` | Marca o alias como um comando slash de chat em vez de um comando raiz da CLI. |
| `cliCommand` | Não         | `string`          | Comando raiz relacionado da CLI a ser sugerido para operações da CLI, se existir. |

## Referência de `activation`

Use `activation` quando o plugin puder declarar de forma barata quais eventos do plano de controle
devem ativá-lo depois.

Este bloco contém apenas metadados. Ele não registra comportamento de runtime e não
substitui `register(...)`, `setupEntry` nem outros entrypoints de runtime/plugin.
Os consumidores atuais o usam como uma dica de restrição antes de um carregamento mais amplo de plugins, então
a ausência de metadados de ativação normalmente só custa desempenho; ela não deve
mudar a correção enquanto ainda existirem fallbacks legados de propriedade no manifest.

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

| Campo            | Obrigatório | Tipo                                                 | O que significa                                                  |
| ---------------- | ----------- | ---------------------------------------------------- | ---------------------------------------------------------------- |
| `onProviders`    | Não         | `string[]`                                           | IDs de provider que devem ativar este plugin quando solicitados. |
| `onCommands`     | Não         | `string[]`                                           | IDs de comando que devem ativar este plugin.                     |
| `onChannels`     | Não         | `string[]`                                           | IDs de canal que devem ativar este plugin.                       |
| `onRoutes`       | Não         | `string[]`                                           | Tipos de rota que devem ativar este plugin.                      |
| `onCapabilities` | Não         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Dicas amplas de capacidade usadas pelo planejamento de ativação do plano de controle. |

Consumidores ativos atuais:

- o planejamento da CLI acionado por comando recorre a
  `commandAliases[].cliCommand` ou `commandAliases[].name` legados
- o planejamento de setup/canal acionado por canal recorre à propriedade legada de `channels[]`
  quando metadados explícitos de ativação de canal estão ausentes
- o planejamento de setup/runtime acionado por provider recorre à propriedade legada de
  `providers[]` e `cliBackends[]` de nível superior quando metadados explícitos de ativação de provider
  estão ausentes

## Referência de `setup`

Use `setup` quando as superfícies de setup e onboarding precisarem de metadados baratos pertencentes ao plugin
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

`cliBackends` de nível superior continua válido e continua descrevendo backends
de inferência da CLI. `setup.cliBackends` é a superfície de descritor específica de setup para
fluxos de setup/plano de controle que devem permanecer somente em metadados.

Quando presentes, `setup.providers` e `setup.cliBackends` são a superfície preferida
de busca baseada primeiro em descritor para descoberta de setup. Se o descritor apenas restringir
o plugin candidato e o setup ainda precisar de hooks de runtime mais ricos em tempo de setup,
defina `requiresRuntime: true` e mantenha `setup-api` como o caminho de execução de fallback.

Como a busca de setup pode executar código `setup-api` pertencente ao plugin, os valores normalizados de
`setup.providers[].id` e `setup.cliBackends[]` devem permanecer únicos entre os
plugins descobertos. Propriedade ambígua falha de forma conservadora em vez de escolher um
vencedor pela ordem de descoberta.

### Referência de `setup.providers`

| Campo         | Obrigatório | Tipo       | O que significa                                                                         |
| ------------- | ----------- | ---------- | --------------------------------------------------------------------------------------- |
| `id`          | Sim         | `string`   | ID do provider exposto durante setup ou onboarding. Mantenha IDs normalizados globalmente únicos. |
| `authMethods` | Não         | `string[]` | IDs de método de setup/autenticação que este provider suporta sem carregar o runtime completo. |
| `envVars`     | Não         | `string[]` | Variáveis de ambiente que superfícies genéricas de setup/status podem verificar antes de o runtime do plugin carregar. |

### Campos de `setup`

| Campo              | Obrigatório | Tipo       | O que significa                                                                                         |
| ------------------ | ----------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| `providers`        | Não         | `object[]` | Descritores de setup de provider expostos durante setup e onboarding.                                   |
| `cliBackends`      | Não         | `string[]` | IDs de backend em tempo de setup usados para busca de setup baseada primeiro em descritor. Mantenha IDs normalizados globalmente únicos. |
| `configMigrations` | Não         | `string[]` | IDs de migração de configuração pertencentes à superfície de setup deste plugin.                        |
| `requiresRuntime`  | Não         | `boolean`  | Se o setup ainda precisa da execução de `setup-api` após a busca por descritor.                         |

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

| Campo         | Tipo       | O que significa                        |
| ------------- | ---------- | -------------------------------------- |
| `label`       | `string`   | Rótulo do campo voltado ao usuário.    |
| `help`        | `string`   | Texto curto de ajuda.                  |
| `tags`        | `string[]` | Tags opcionais de UI.                  |
| `advanced`    | `boolean`  | Marca o campo como avançado.           |
| `sensitive`   | `boolean`  | Marca o campo como secreto ou sensível. |
| `placeholder` | `string`   | Texto de placeholder para entradas de formulário. |

## Referência de `contracts`

Use `contracts` apenas para metadados estáticos de propriedade de capacidade que o OpenClaw pode
ler sem importar o runtime do plugin.

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

| Campo                            | Tipo       | O que significa                                                  |
| -------------------------------- | ---------- | ---------------------------------------------------------------- |
| `speechProviders`                | `string[]` | IDs de provider de speech pertencentes a este plugin.            |
| `realtimeTranscriptionProviders` | `string[]` | IDs de provider de transcrição em tempo real pertencentes a este plugin. |
| `realtimeVoiceProviders`         | `string[]` | IDs de provider de voz em tempo real pertencentes a este plugin. |
| `mediaUnderstandingProviders`    | `string[]` | IDs de provider de media-understanding pertencentes a este plugin. |
| `imageGenerationProviders`       | `string[]` | IDs de provider de geração de imagem pertencentes a este plugin. |
| `videoGenerationProviders`       | `string[]` | IDs de provider de geração de vídeo pertencentes a este plugin.  |
| `webFetchProviders`              | `string[]` | IDs de provider de web-fetch pertencentes a este plugin.         |
| `webSearchProviders`             | `string[]` | IDs de provider de busca na web pertencentes a este plugin.      |
| `tools`                          | `string[]` | Nomes de ferramentas do agente pertencentes a este plugin para verificações de contrato empacotado. |

## Referência de `channelConfigs`

Use `channelConfigs` quando um plugin de canal precisar de metadados baratos de configuração antes de
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
          "label": "Homeserver URL",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Matrix homeserver connection",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Cada entrada de canal pode incluir:

| Campo         | Tipo                     | O que significa                                                                              |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Schema JSON para `channels.<id>`. Obrigatório para cada entrada declarada de configuração de canal. |
| `uiHints`     | `Record<string, object>` | Rótulos/placeholders/dicas de sensibilidade de UI opcionais para essa seção de configuração de canal. |
| `label`       | `string`                 | Rótulo do canal mesclado em superfícies de seleção e inspeção quando os metadados de runtime ainda não estiverem prontos. |
| `description` | `string`                 | Descrição curta do canal para superfícies de inspeção e catálogo.                            |
| `preferOver`  | `string[]`               | IDs de plugin legados ou de menor prioridade sobre os quais este canal deve ter precedência nas superfícies de seleção. |

## Referência de `modelSupport`

Use `modelSupport` quando o OpenClaw precisar inferir seu plugin de provider a partir de
IDs abreviados de modelo como `gpt-5.4` ou `claude-sonnet-4.6` antes de o runtime do plugin
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

- referências explícitas `provider/model` usam os metadados de manifest `providers` do plugin proprietário
- `modelPatterns` têm precedência sobre `modelPrefixes`
- se um plugin não empacotado e um plugin empacotado corresponderem, o plugin não empacotado
  vence
- ambiguidades restantes são ignoradas até que o usuário ou a configuração especifique um provider

Campos:

| Campo           | Tipo       | O que significa                                                                   |
| --------------- | ---------- | --------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefixos comparados com `startsWith` em relação a IDs abreviados de modelo.       |
| `modelPatterns` | `string[]` | Fontes de regex comparadas com IDs abreviados de modelo após a remoção do sufixo de perfil. |

As chaves legadas de capacidade de nível superior estão obsoletas. Use `openclaw doctor --fix` para
mover `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` e `webSearchProviders` para `contracts`; o carregamento normal
do manifest não trata mais esses campos de nível superior como propriedade
de capacidade.

## Manifest versus package.json

Os dois arquivos têm funções diferentes:

| Arquivo                | Use para                                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Descoberta, validação de configuração, metadados de escolha de autenticação e dicas de UI que precisam existir antes de o código do plugin rodar |
| `package.json`         | Metadados npm, instalação de dependências e o bloco `openclaw` usado para entrypoints, controle de instalação, setup ou metadados de catálogo |

Se você não tiver certeza de onde uma informação deve ficar, use esta regra:

- se o OpenClaw precisar conhecê-la antes de carregar o código do plugin, coloque-a em `openclaw.plugin.json`
- se for sobre empacotamento, arquivos de entrada ou comportamento de instalação do npm, coloque-a em `package.json`

### Campos de `package.json` que afetam a descoberta

Alguns metadados de plugin de pré-runtime intencionalmente ficam em `package.json` sob o bloco
`openclaw`, em vez de `openclaw.plugin.json`.

Exemplos importantes:

| Campo                                                             | O que significa                                                                                                                                |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Declara entrypoints de Plugin nativos.                                                                                                         |
| `openclaw.setupEntry`                                             | Entrypoint leve apenas de setup usado durante o onboarding e a inicialização adiada de canais.                                                |
| `openclaw.channel`                                                | Metadados baratos de catálogo de canal, como rótulos, caminhos de docs, aliases e textos de seleção.                                         |
| `openclaw.channel.configuredState`                                | Metadados leves do verificador de estado configurado que podem responder "já existe setup somente por env?" sem carregar o runtime completo do canal. |
| `openclaw.channel.persistedAuthState`                             | Metadados leves do verificador de autenticação persistida que podem responder "já existe algo autenticado?" sem carregar o runtime completo do canal. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Dicas de instalação/atualização para plugins empacotados e publicados externamente.                                                           |
| `openclaw.install.defaultChoice`                                  | Caminho de instalação preferido quando múltiplas fontes de instalação estão disponíveis.                                                       |
| `openclaw.install.minHostVersion`                                 | Versão mínima suportada do host OpenClaw, usando um piso semver como `>=2026.3.22`.                                                           |
| `openclaw.install.allowInvalidConfigRecovery`                     | Permite um caminho restrito de recuperação por reinstalação de plugin empacotado quando a configuração é inválida.                            |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permite que superfícies de canal apenas de setup sejam carregadas antes do plugin de canal completo durante a inicialização.                  |

`openclaw.install.minHostVersion` é aplicado durante a instalação e o carregamento do
registro de manifests. Valores inválidos são rejeitados; valores mais novos, mas válidos, fazem o
plugin ser ignorado em hosts mais antigos.

`openclaw.install.allowInvalidConfigRecovery` é intencionalmente restrito. Ele não torna
configurações quebradas arbitrárias instaláveis. Hoje, ele só permite que fluxos de instalação
se recuperem de falhas específicas e obsoletas de upgrade de plugin empacotado, como um
caminho ausente de plugin empacotado ou uma entrada obsoleta `channels.<id>` para esse mesmo
plugin empacotado. Erros de configuração não relacionados ainda bloqueiam a instalação e direcionam os
operadores para `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` é um metadado de pacote para um pequeno módulo
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

Use-o quando fluxos de setup, doctor ou estado configurado precisarem de uma sondagem barata de autenticação
sim/não antes de o plugin de canal completo carregar. A exportação de destino deve ser uma
função pequena que leia apenas o estado persistido; não a encaminhe pelo barrel completo
do runtime do canal.

`openclaw.channel.configuredState` segue o mesmo formato para verificações baratas de estado
configurado apenas por env:

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

Use-o quando um canal puder responder ao estado configurado a partir de env ou de outras pequenas
entradas não relacionadas ao runtime. Se a verificação precisar da resolução completa de configuração ou do
runtime real do canal, mantenha essa lógica no hook `config.hasConfiguredState` do plugin.

## Requisitos do schema JSON

- **Todo plugin deve fornecer um schema JSON**, mesmo que ele não aceite configuração.
- Um schema vazio é aceitável (por exemplo, `{ "type": "object", "additionalProperties": false }`).
- Os schemas são validados no momento de leitura/gravação da configuração, não em runtime.

## Comportamento de validação

- Chaves desconhecidas em `channels.*` são **erros**, a menos que o ID do canal seja declarado por
  um manifest de plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*`
  devem referenciar IDs de plugin **descobertos**. IDs desconhecidos são **erros**.
- Se um plugin estiver instalado, mas tiver um manifest ou schema quebrado ou ausente,
  a validação falha e o Doctor relata o erro do plugin.
- Se a configuração do plugin existir, mas o plugin estiver **desabilitado**, a configuração é mantida e
  um **aviso** é exibido no Doctor + logs.

Consulte a [Referência de configuração](/pt-BR/gateway/configuration) para todo o schema `plugins.*`.

## Observações

- O manifest é **obrigatório para Plugins nativos do OpenClaw**, incluindo carregamentos locais do sistema de arquivos.
- O runtime ainda carrega o módulo do plugin separadamente; o manifest serve apenas para
  descoberta + validação.
- Manifests nativos são analisados com JSON5, então comentários, vírgulas finais e
  chaves sem aspas são aceitos, desde que o valor final ainda seja um objeto.
- Apenas os campos de manifest documentados são lidos pelo carregador de manifest. Evite adicionar
  chaves personalizadas de nível superior aqui.
- `providerAuthEnvVars` é o caminho barato de metadados para sondagens de autenticação, validação
  de marcadores de env e superfícies semelhantes de autenticação de provider que não devem iniciar o runtime do plugin
  apenas para inspecionar nomes de env.
- `providerAuthAliases` permite que variantes de provider reutilizem as variáveis de ambiente de autenticação,
  perfis de autenticação, autenticação baseada em configuração e escolha de onboarding por chave de API de outro provider
  sem codificar essa relação diretamente no core.
- `channelEnvVars` é o caminho barato de metadados para fallback de env do shell, prompts de setup
  e superfícies semelhantes de canal que não devem iniciar o runtime do plugin
  apenas para inspecionar nomes de env.
- `providerAuthChoices` é o caminho barato de metadados para seletores de escolha de autenticação,
  resolução de `--auth-choice`, mapeamento de provider preferido e registro simples de flags de CLI de onboarding
  antes de o runtime do provider carregar. Para metadados de assistente de runtime
  que exigem código do provider, consulte
  [Hooks de runtime do provider](/pt-BR/plugins/architecture#provider-runtime-hooks).
- Tipos exclusivos de plugin são selecionados por meio de `plugins.slots.*`.
  - `kind: "memory"` é selecionado por `plugins.slots.memory`.
  - `kind: "context-engine"` é selecionado por `plugins.slots.contextEngine`
    (padrão: `legacy` builtin).
- `channels`, `providers`, `cliBackends` e `skills` podem ser omitidos quando um
  plugin não precisar deles.
- Se seu plugin depender de módulos nativos, documente as etapas de build e quaisquer
  requisitos de allowlist do gerenciador de pacotes (por exemplo, `allow-build-scripts` do pnpm
  - `pnpm rebuild <package>`).

## Relacionado

- [Criando Plugins](/pt-BR/plugins/building-plugins) — introdução a plugins
- [Arquitetura de Plugins](/pt-BR/plugins/architecture) — arquitetura interna
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência do Plugin SDK
