---
read_when:
    - Você está criando um plugin do OpenClaw
    - Você precisa distribuir um esquema de configuração de plugin ou depurar erros de validação de plugin
summary: Manifesto de plugin + requisitos de esquema JSON (validação estrita de configuração)
title: Manifesto de plugin
x-i18n:
    generated_at: "2026-04-07T05:29:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22d41b9f8748b1b1b066ee856be4a8f41e88b9a8bc073d74fc79d2bb0982f01a
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifesto de plugin (openclaw.plugin.json)

Esta página é apenas para o **manifesto nativo de plugin do OpenClaw**.

Para layouts de bundle compatíveis, consulte [Bundles de plugin](/pt-BR/plugins/bundles).

Formatos de bundle compatíveis usam arquivos de manifesto diferentes:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` ou o layout padrão de componente Claude
  sem manifesto
- Bundle Cursor: `.cursor-plugin/plugin.json`

O OpenClaw também detecta automaticamente esses layouts de bundle, mas eles não são validados
em relação ao esquema `openclaw.plugin.json` descrito aqui.

Para bundles compatíveis, o OpenClaw atualmente lê metadados do bundle mais as
raízes de skill declaradas, raízes de comando Claude, padrões de `settings.json` do bundle Claude,
padrões de LSP do bundle Claude e pacotes de hook compatíveis quando o layout corresponde
às expectativas de runtime do OpenClaw.

Todo plugin nativo do OpenClaw **deve** incluir um arquivo `openclaw.plugin.json` na
**raiz do plugin**. O OpenClaw usa esse manifesto para validar a configuração
**sem executar código do plugin**. Manifestos ausentes ou inválidos são tratados como
erros de plugin e bloqueiam a validação da configuração.

Consulte o guia completo do sistema de plugins: [Plugins](/pt-BR/tools/plugin).
Para o modelo nativo de capacidades e a orientação atual de compatibilidade externa:
[Modelo de capacidades](/pt-BR/plugins/architecture#public-capability-model).

## O que esse arquivo faz

`openclaw.plugin.json` são os metadados que o OpenClaw lê antes de carregar o
código do seu plugin.

Use-o para:

- identidade do plugin
- validação de configuração
- metadados de autenticação e onboarding que devem estar disponíveis sem iniciar o runtime
  do plugin
- metadados de alias e ativação automática que devem ser resolvidos antes que o runtime do plugin seja carregado
- metadados abreviados de propriedade de família de modelos que devem ativar automaticamente o
  plugin antes do carregamento do runtime
- snapshots estáticos de propriedade de capacidades usados para wiring de compatibilidade empacotada e
  cobertura de contratos
- metadados de configuração específicos de canal que devem ser mesclados em superfícies de catálogo e validação
  sem carregar o runtime
- dicas de UI de configuração

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
  "description": "Plugin de provedor OpenRouter",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "cliBackends": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
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

| Field                               | Required | Type                             | What it means                                                                                                                                                                                                |
| ----------------------------------- | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Yes      | `string`                         | Id canônico do plugin. Este é o id usado em `plugins.entries.<id>`.                                                                                                                                         |
| `configSchema`                      | Yes      | `object`                         | Esquema JSON inline para a configuração deste plugin.                                                                                                                                                       |
| `enabledByDefault`                  | No       | `true`                           | Marca um plugin empacotado como habilitado por padrão. Omita-o, ou defina qualquer valor diferente de `true`, para deixar o plugin desabilitado por padrão.                                              |
| `legacyPluginIds`                   | No       | `string[]`                       | Ids legados que são normalizados para este id canônico de plugin.                                                                                                                                           |
| `autoEnableWhenConfiguredProviders` | No       | `string[]`                       | Ids de provedor que devem habilitar automaticamente este plugin quando autenticação, configuração ou referências de modelo os mencionarem.                                                                  |
| `kind`                              | No       | `"memory"` \| `"context-engine"` | Declara um tipo exclusivo de plugin usado por `plugins.slots.*`.                                                                                                                                            |
| `channels`                          | No       | `string[]`                       | Ids de canal pertencentes a este plugin. Usados para descoberta e validação de configuração.                                                                                                                |
| `providers`                         | No       | `string[]`                       | Ids de provedor pertencentes a este plugin.                                                                                                                                                                 |
| `modelSupport`                      | No       | `object`                         | Metadados abreviados de família de modelos pertencentes ao manifesto usados para carregar automaticamente o plugin antes do runtime.                                                                        |
| `cliBackends`                       | No       | `string[]`                       | Ids de backends de inferência da CLI pertencentes a este plugin. Usados para ativação automática na inicialização a partir de referências explícitas de configuração.                                       |
| `providerAuthEnvVars`               | No       | `Record<string, string[]>`       | Metadados leves de variáveis de ambiente de autenticação de provedor que o OpenClaw pode inspecionar sem carregar o código do plugin.                                                                      |
| `channelEnvVars`                    | No       | `Record<string, string[]>`       | Metadados leves de ambiente de canal que o OpenClaw pode inspecionar sem carregar o código do plugin. Use isso para configuração de canal orientada por env ou superfícies de autenticação que helpers genéricos de inicialização/configuração devam enxergar. |
| `providerAuthChoices`               | No       | `object[]`                       | Metadados leves de escolhas de autenticação para seletores de onboarding, resolução de provedor preferido e wiring simples de flags da CLI.                                                                |
| `contracts`                         | No       | `object`                         | Snapshot estático de capacidades empacotadas para speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search e propriedade de ferramentas. |
| `channelConfigs`                    | No       | `Record<string, object>`         | Metadados de configuração de canal pertencentes ao manifesto, mesclados em superfícies de descoberta e validação antes do carregamento do runtime.                                                         |
| `skills`                            | No       | `string[]`                       | Diretórios de Skills a carregar, relativos à raiz do plugin.                                                                                                                                                |
| `name`                              | No       | `string`                         | Nome legível do plugin.                                                                                                                                                                                     |
| `description`                       | No       | `string`                         | Resumo curto exibido em superfícies de plugin.                                                                                                                                                              |
| `version`                           | No       | `string`                         | Versão informativa do plugin.                                                                                                                                                                               |
| `uiHints`                           | No       | `Record<string, object>`         | Rótulos de UI, placeholders e dicas de sensibilidade para campos de configuração.                                                                                                                           |

## Referência de `providerAuthChoices`

Cada entrada de `providerAuthChoices` descreve uma escolha de onboarding ou autenticação.
O OpenClaw lê isso antes do carregamento do runtime do provedor.

| Field                 | Required | Type                                            | What it means                                                                                            |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Yes      | `string`                                        | Id do provedor ao qual esta escolha pertence.                                                            |
| `method`              | Yes      | `string`                                        | Id do método de autenticação para encaminhamento.                                                        |
| `choiceId`            | Yes      | `string`                                        | Id estável de escolha de autenticação usado por fluxos de onboarding e CLI.                             |
| `choiceLabel`         | No       | `string`                                        | Rótulo visível ao usuário. Se omitido, o OpenClaw usa `choiceId` como fallback.                         |
| `choiceHint`          | No       | `string`                                        | Texto auxiliar curto para o seletor.                                                                     |
| `assistantPriority`   | No       | `number`                                        | Valores menores são ordenados antes em seletores interativos conduzidos pelo assistente.                |
| `assistantVisibility` | No       | `"visible"` \| `"manual-only"`                  | Oculta a escolha dos seletores do assistente, mas ainda permite seleção manual pela CLI.                |
| `deprecatedChoiceIds` | No       | `string[]`                                      | Ids legados de escolha que devem redirecionar usuários para esta escolha substituta.                     |
| `groupId`             | No       | `string`                                        | Id opcional de grupo para agrupar escolhas relacionadas.                                                 |
| `groupLabel`          | No       | `string`                                        | Rótulo visível ao usuário para esse grupo.                                                               |
| `groupHint`           | No       | `string`                                        | Texto auxiliar curto para o grupo.                                                                       |
| `optionKey`           | No       | `string`                                        | Chave interna de opção para fluxos simples de autenticação com uma única flag.                           |
| `cliFlag`             | No       | `string`                                        | Nome da flag da CLI, como `--openrouter-api-key`.                                                        |
| `cliOption`           | No       | `string`                                        | Formato completo da opção da CLI, como `--openrouter-api-key <key>`.                                     |
| `cliDescription`      | No       | `string`                                        | Descrição usada na ajuda da CLI.                                                                         |
| `onboardingScopes`    | No       | `Array<"text-inference" \| "image-generation">` | Em quais superfícies de onboarding esta escolha deve aparecer. Se omitido, o padrão é `["text-inference"]`. |

## Referência de `uiHints`

`uiHints` é um mapa de nomes de campo de configuração para pequenas dicas de renderização.

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

| Field         | Type       | What it means                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Rótulo do campo visível ao usuário.     |
| `help`        | `string`   | Texto auxiliar curto.                   |
| `tags`        | `string[]` | Tags de UI opcionais.                   |
| `advanced`    | `boolean`  | Marca o campo como avançado.            |
| `sensitive`   | `boolean`  | Marca o campo como secreto ou sensível. |
| `placeholder` | `string`   | Texto de placeholder para entradas de formulário. |

## Referência de `contracts`

Use `contracts` apenas para metadados estáticos de propriedade de capacidades que o OpenClaw pode
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

| Field                            | Type       | What it means                                                  |
| -------------------------------- | ---------- | -------------------------------------------------------------- |
| `speechProviders`                | `string[]` | Ids de provedor de fala pertencentes a este plugin.            |
| `realtimeTranscriptionProviders` | `string[]` | Ids de provedor de transcrição em tempo real pertencentes a este plugin. |
| `realtimeVoiceProviders`         | `string[]` | Ids de provedor de voz em tempo real pertencentes a este plugin. |
| `mediaUnderstandingProviders`    | `string[]` | Ids de provedor de compreensão de mídia pertencentes a este plugin. |
| `imageGenerationProviders`       | `string[]` | Ids de provedor de geração de imagem pertencentes a este plugin. |
| `videoGenerationProviders`       | `string[]` | Ids de provedor de geração de vídeo pertencentes a este plugin. |
| `webFetchProviders`              | `string[]` | Ids de provedor de busca web pertencentes a este plugin.       |
| `webSearchProviders`             | `string[]` | Ids de provedor de pesquisa web pertencentes a este plugin.    |
| `tools`                          | `string[]` | Nomes de ferramentas do agente pertencentes a este plugin para verificações de contrato empacotado. |

## Referência de `channelConfigs`

Use `channelConfigs` quando um plugin de canal precisar de metadados leves de configuração antes
do carregamento do runtime.

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

| Field         | Type                     | What it means                                                                             |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Esquema JSON para `channels.<id>`. Obrigatório para cada entrada declarada de configuração de canal. |
| `uiHints`     | `Record<string, object>` | Rótulos/placeholders/dicas de sensibilidade de UI opcionais para essa seção de configuração do canal. |
| `label`       | `string`                 | Rótulo do canal mesclado em superfícies de seleção e inspeção quando os metadados de runtime não estiverem prontos. |
| `description` | `string`                 | Descrição curta do canal para superfícies de inspeção e catálogo.                         |
| `preferOver`  | `string[]`               | Ids legados ou de menor prioridade de plugin que este canal deve superar em superfícies de seleção. |

## Referência de `modelSupport`

Use `modelSupport` quando o OpenClaw deve inferir seu plugin de provedor a partir de
ids abreviados de modelo como `gpt-5.4` ou `claude-sonnet-4.6` antes do carregamento do runtime do plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

O OpenClaw aplica esta precedência:

- referências explícitas `provider/model` usam os metadados de manifesto `providers`
  pertencentes ao plugin
- `modelPatterns` têm precedência sobre `modelPrefixes`
- se um plugin não empacotado e um plugin empacotado corresponderem ao mesmo tempo, o plugin não empacotado
  vence
- a ambiguidade restante é ignorada até que o usuário ou a configuração especifique um provedor

Campos:

| Field           | Type       | What it means                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefixos correspondidos com `startsWith` em relação a ids abreviados de modelo. |
| `modelPatterns` | `string[]` | Fontes de regex correspondidas com ids abreviados de modelo após remoção do sufixo de perfil. |

Chaves legadas de capacidade em nível superior estão obsoletas. Use `openclaw doctor --fix` para
mover `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` e `webSearchProviders` para `contracts`; o carregamento normal
do manifesto não trata mais esses campos de nível superior como propriedade de
capacidade.

## Manifesto versus package.json

Os dois arquivos têm funções diferentes:

| File                   | Use it for                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Descoberta, validação de configuração, metadados de escolha de autenticação e dicas de UI que devem existir antes da execução do código do plugin |
| `package.json`         | Metadados npm, instalação de dependências e o bloco `openclaw` usado para entrypoints, controle de instalação, setup ou metadados de catálogo |

Se você não tiver certeza de onde um metadado deve ficar, use esta regra:

- se o OpenClaw precisar conhecê-lo antes de carregar o código do plugin, coloque-o em `openclaw.plugin.json`
- se ele estiver relacionado a empacotamento, arquivos de entrada ou comportamento de instalação npm, coloque-o em `package.json`

### Campos de package.json que afetam a descoberta

Alguns metadados de plugin pré-runtime intencionalmente ficam em `package.json`, dentro do
bloco `openclaw`, em vez de `openclaw.plugin.json`.

Exemplos importantes:

| Field                                                             | What it means                                                                                                                                |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Declara entrypoints nativos de plugin.                                                                                                       |
| `openclaw.setupEntry`                                             | Entrypoint leve apenas para setup, usado durante onboarding e inicialização adiada de canal.                                                |
| `openclaw.channel`                                                | Metadados leves de catálogo de canal, como rótulos, caminhos de documentação, aliases e texto de seleção.                                  |
| `openclaw.channel.configuredState`                                | Metadados leves de verificação de estado configurado que podem responder "já existe uma configuração apenas por env?" sem carregar o runtime completo do canal. |
| `openclaw.channel.persistedAuthState`                             | Metadados leves de verificação de autenticação persistida que podem responder "já existe algo autenticado?" sem carregar o runtime completo do canal. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Dicas de instalação/atualização para plugins empacotados e publicados externamente.                                                         |
| `openclaw.install.defaultChoice`                                  | Caminho de instalação preferido quando múltiplas fontes de instalação estão disponíveis.                                                     |
| `openclaw.install.minHostVersion`                                 | Versão mínima compatível do host OpenClaw, usando um piso semver como `>=2026.3.22`.                                                        |
| `openclaw.install.allowInvalidConfigRecovery`                     | Permite um caminho de recuperação restrito de reinstalação de plugin empacotado quando a configuração é inválida.                           |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permite que superfícies de canal apenas de setup sejam carregadas antes do plugin de canal completo durante a inicialização.                |

`openclaw.install.minHostVersion` é aplicado durante a instalação e o carregamento do registro
de manifesto. Valores inválidos são rejeitados; valores válidos mais novos fazem com que o
plugin seja ignorado em hosts mais antigos.

`openclaw.install.allowInvalidConfigRecovery` é intencionalmente restrito. Ele não
torna instaláveis configurações arbitrariamente quebradas. Hoje ele apenas permite que
fluxos de instalação se recuperem de falhas específicas de upgrade de plugin empacotado desatualizado, como
um caminho de plugin empacotado ausente ou uma entrada `channels.<id>` obsoleta para esse mesmo
plugin empacotado. Erros de configuração não relacionados continuam bloqueando a instalação e direcionam operadores
para `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` é metadado de pacote para um módulo minúsculo
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

Use-o quando fluxos de setup, doctor ou estado configurado precisarem de uma sonda barata de autenticação
sim/não antes do carregamento do plugin de canal completo. A exportação alvo deve ser uma pequena
função que leia apenas o estado persistido; não a encaminhe pelo barrel completo
do runtime do canal.

`openclaw.channel.configuredState` segue o mesmo formato para verificações leves de
configuração apenas por env:

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

Use-o quando um canal puder responder o estado configurado a partir de env ou outras entradas mínimas
que não dependam do runtime. Se a verificação precisar de resolução completa de configuração ou do
runtime real do canal, mantenha essa lógica no hook `config.hasConfiguredState` do plugin.

## Requisitos de esquema JSON

- **Todo plugin deve incluir um JSON Schema**, mesmo que não aceite configuração.
- Um esquema vazio é aceitável (por exemplo, `{ "type": "object", "additionalProperties": false }`).
- Os esquemas são validados no momento de leitura/gravação da configuração, não em runtime.

## Comportamento de validação

- Chaves desconhecidas em `channels.*` são **erros**, a menos que o id do canal seja declarado por
  um manifesto de plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*`
  devem referenciar ids de plugin **detectáveis**. Ids desconhecidos são **erros**.
- Se um plugin estiver instalado, mas tiver um manifesto ou esquema quebrado ou ausente,
  a validação falhará e o Doctor relatará o erro do plugin.
- Se a configuração do plugin existir, mas o plugin estiver **desabilitado**, a configuração será mantida e
  um **aviso** será exibido no Doctor + logs.

Consulte [Configuration reference](/pt-BR/gateway/configuration) para o esquema completo de `plugins.*`.

## Observações

- O manifesto é **obrigatório para plugins nativos do OpenClaw**, incluindo carregamentos locais do sistema de arquivos.
- O runtime ainda carrega o módulo do plugin separadamente; o manifesto serve apenas para
  descoberta + validação.
- Manifestos nativos são analisados com JSON5, portanto comentários, vírgulas finais e
  chaves sem aspas são aceitos desde que o valor final ainda seja um objeto.
- Apenas os campos documentados do manifesto são lidos pelo carregador de manifesto. Evite adicionar
  chaves personalizadas de nível superior aqui.
- `providerAuthEnvVars` é o caminho leve de metadados para sondas de autenticação, validação de marcador de env
  e superfícies semelhantes de autenticação de provedor que não devem iniciar o runtime do plugin
  apenas para inspecionar nomes de variáveis de ambiente.
- `channelEnvVars` é o caminho leve de metadados para fallback de env do shell, prompts de setup
  e superfícies semelhantes de canal que não devem iniciar o runtime do plugin
  apenas para inspecionar nomes de variáveis de ambiente.
- `providerAuthChoices` é o caminho leve de metadados para seletores de escolha de autenticação,
  resolução de `--auth-choice`, mapeamento de provedor preferido e registro simples de flags de CLI
  antes do carregamento do runtime do provedor. Para metadados de assistente de runtime
  que exigem código do provedor, consulte
  [Hooks de runtime do provedor](/pt-BR/plugins/architecture#provider-runtime-hooks).
- Tipos exclusivos de plugin são selecionados por `plugins.slots.*`.
  - `kind: "memory"` é selecionado por `plugins.slots.memory`.
  - `kind: "context-engine"` é selecionado por `plugins.slots.contextEngine`
    (padrão: `legacy` integrado).
- `channels`, `providers`, `cliBackends` e `skills` podem ser omitidos quando um
  plugin não precisar deles.
- Se seu plugin depender de módulos nativos, documente as etapas de build e quaisquer
  requisitos de allowlist do gerenciador de pacotes (por exemplo, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Relacionado

- [Criando plugins](/pt-BR/plugins/building-plugins) — introdução a plugins
- [Arquitetura de plugins](/pt-BR/plugins/architecture) — arquitetura interna
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência do Plugin SDK
