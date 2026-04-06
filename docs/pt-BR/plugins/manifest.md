---
read_when:
    - Você está criando um plugin do OpenClaw
    - Você precisa distribuir um schema de configuração de plugin ou depurar erros de validação de plugin
summary: Manifesto de plugin + requisitos de JSON schema (validação estrita de configuração)
title: Manifesto de plugin
x-i18n:
    generated_at: "2026-04-06T03:09:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: f6f915a761cdb5df77eba5d2ccd438c65445bd2ab41b0539d1200e63e8cf2c3a
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifesto de plugin (openclaw.plugin.json)

Esta página é apenas para o **manifesto nativo de plugin do OpenClaw**.

Para layouts de bundle compatíveis, consulte [Bundles de plugins](/pt-BR/plugins/bundles).

Formatos de bundle compatíveis usam arquivos de manifesto diferentes:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` ou o layout padrão de componente Claude
  sem manifesto
- Bundle Cursor: `.cursor-plugin/plugin.json`

O OpenClaw também detecta automaticamente esses layouts de bundle, mas eles não são validados
em relação ao schema `openclaw.plugin.json` descrito aqui.

Para bundles compatíveis, o OpenClaw atualmente lê os metadados do bundle mais
as raízes declaradas de skill, raízes de comandos Claude, padrões `settings.json` de bundle Claude,
padrões LSP de bundle Claude e pacotes de hook compatíveis quando o layout corresponde
às expectativas de runtime do OpenClaw.

Todo plugin nativo do OpenClaw **deve** incluir um arquivo `openclaw.plugin.json` na
**raiz do plugin**. O OpenClaw usa esse manifesto para validar a configuração
**sem executar código do plugin**. Manifestos ausentes ou inválidos são tratados como
erros de plugin e bloqueiam a validação da configuração.

Consulte o guia completo do sistema de plugins: [Plugins](/pt-BR/tools/plugin).
Para o modelo nativo de capacidades e a orientação atual de compatibilidade externa:
[Modelo de capacidades](/pt-BR/plugins/architecture#public-capability-model).

## O que este arquivo faz

`openclaw.plugin.json` são os metadados que o OpenClaw lê antes de carregar o
código do seu plugin.

Use-o para:

- identidade do plugin
- validação de configuração
- metadados de autenticação e onboarding que devem estar disponíveis sem iniciar o
  runtime do plugin
- metadados de alias e ativação automática que devem ser resolvidos antes de o runtime do plugin carregar
- metadados resumidos de posse de família de modelos que devem ativar automaticamente o
  plugin antes de o runtime carregar
- snapshots estáticos de posse de capacidades usados para compatibilidade integrada e
  cobertura de contrato
- metadados de configuração específicos de canal que devem ser mesclados em
  superfícies de catálogo e validação sem carregar o runtime
- dicas de UI para configuração

Não o use para:

- registrar comportamento de runtime
- declarar entrypoints de código
- metadados de instalação npm

Esses itens pertencem ao código do seu plugin e ao `package.json`.

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
  "description": "Plugin de provider OpenRouter",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
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

| Campo                               | Obrigatório | Tipo                             | O que significa                                                                                                                                                                                               |
| ----------------------------------- | ----------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                | Sim         | `string`                         | ID canônico do plugin. Este é o id usado em `plugins.entries.<id>`.                                                                                                                                          |
| `configSchema`                      | Sim         | `object`                         | JSON Schema inline para a configuração deste plugin.                                                                                                                                                          |
| `enabledByDefault`                  | Não         | `true`                           | Marca um plugin integrado como habilitado por padrão. Omita-o, ou defina qualquer valor diferente de `true`, para deixar o plugin desabilitado por padrão.                                                |
| `legacyPluginIds`                   | Não         | `string[]`                       | IDs legados que são normalizados para este ID canônico de plugin.                                                                                                                                            |
| `autoEnableWhenConfiguredProviders` | Não         | `string[]`                       | IDs de provider que devem habilitar automaticamente este plugin quando autenticação, configuração ou referências de modelo os mencionarem.                                                                  |
| `kind`                              | Não         | `"memory"` \| `"context-engine"` | Declara um tipo exclusivo de plugin usado por `plugins.slots.*`.                                                                                                                                             |
| `channels`                          | Não         | `string[]`                       | IDs de canal pertencentes a este plugin. Usado para descoberta e validação de configuração.                                                                                                                 |
| `providers`                         | Não         | `string[]`                       | IDs de provider pertencentes a este plugin.                                                                                                                                                                   |
| `modelSupport`                      | Não         | `object`                         | Metadados resumidos de família de modelos de posse do manifesto usados para carregar automaticamente o plugin antes do runtime.                                                                             |
| `providerAuthEnvVars`               | Não         | `Record<string, string[]>`       | Metadados baratos de env de autenticação de provider que o OpenClaw pode inspecionar sem carregar código do plugin.                                                                                         |
| `providerAuthChoices`               | Não         | `object[]`                       | Metadados baratos de opções de autenticação para seletores de onboarding, resolução de provider preferido e ligação simples de flags da CLI.                                                               |
| `contracts`                         | Não         | `object`                         | Snapshot estático de capacidades integradas para speech, transcrição em tempo real, voz em tempo real, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search e posse de ferramentas. |
| `channelConfigs`                    | Não         | `Record<string, object>`         | Metadados de configuração de canal de posse do manifesto mesclados em superfícies de descoberta e validação antes de o runtime carregar.                                                                    |
| `skills`                            | Não         | `string[]`                       | Diretórios de Skills para carregar, relativos à raiz do plugin.                                                                                                                                              |
| `name`                              | Não         | `string`                         | Nome legível do plugin.                                                                                                                                                                                       |
| `description`                       | Não         | `string`                         | Resumo curto exibido em superfícies de plugin.                                                                                                                                                                |
| `version`                           | Não         | `string`                         | Versão informativa do plugin.                                                                                                                                                                                 |
| `uiHints`                           | Não         | `Record<string, object>`         | Rótulos de UI, placeholders e dicas de sensibilidade para campos de configuração.                                                                                                                            |

## Referência de providerAuthChoices

Cada entrada `providerAuthChoices` descreve uma opção de onboarding ou autenticação.
O OpenClaw lê isso antes de o runtime do provider carregar.

| Campo                 | Obrigatório | Tipo                                            | O que significa                                                                                          |
| --------------------- | ----------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Sim         | `string`                                        | ID do provider ao qual esta opção pertence.                                                              |
| `method`              | Sim         | `string`                                        | ID do método de autenticação para encaminhamento.                                                        |
| `choiceId`            | Sim         | `string`                                        | ID estável da opção de autenticação usado por fluxos de onboarding e CLI.                               |
| `choiceLabel`         | Não         | `string`                                        | Rótulo exibido ao usuário. Se omitido, o OpenClaw usa `choiceId` como fallback.                         |
| `choiceHint`          | Não         | `string`                                        | Texto curto de ajuda para o seletor.                                                                     |
| `assistantPriority`   | Não         | `number`                                        | Valores menores são ordenados primeiro em seletores interativos conduzidos pelo assistente.             |
| `assistantVisibility` | Não         | `"visible"` \| `"manual-only"`                  | Oculta a opção dos seletores do assistente, mas ainda permite seleção manual pela CLI.                  |
| `deprecatedChoiceIds` | Não         | `string[]`                                      | IDs legados de opção que devem redirecionar usuários para esta opção substituta.                        |
| `groupId`             | Não         | `string`                                        | ID opcional de grupo para agrupar opções relacionadas.                                                   |
| `groupLabel`          | Não         | `string`                                        | Rótulo exibido ao usuário para esse grupo.                                                               |
| `groupHint`           | Não         | `string`                                        | Texto curto de ajuda para o grupo.                                                                       |
| `optionKey`           | Não         | `string`                                        | Chave interna de opção para fluxos simples de autenticação com uma única flag.                           |
| `cliFlag`             | Não         | `string`                                        | Nome da flag da CLI, como `--openrouter-api-key`.                                                        |
| `cliOption`           | Não         | `string`                                        | Formato completo da opção da CLI, como `--openrouter-api-key <key>`.                                     |
| `cliDescription`      | Não         | `string`                                        | Descrição usada na ajuda da CLI.                                                                         |
| `onboardingScopes`    | Não         | `Array<"text-inference" \| "image-generation">` | Em quais superfícies de onboarding esta opção deve aparecer. Se omitido, o padrão é `["text-inference"]`. |

## Referência de uiHints

`uiHints` é um mapa de nomes de campo de configuração para pequenas dicas de renderização.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "Chave de API",
      "help": "Usada para requisições do OpenRouter",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Cada dica de campo pode incluir:

| Campo         | Tipo       | O que significa                         |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Rótulo do campo exibido ao usuário.     |
| `help`        | `string`   | Texto curto de ajuda.                   |
| `tags`        | `string[]` | Tags opcionais de UI.                   |
| `advanced`    | `boolean`  | Marca o campo como avançado.            |
| `sensitive`   | `boolean`  | Marca o campo como secreto ou sensível. |
| `placeholder` | `string`   | Texto de placeholder para entradas de formulário. |

## Referência de contracts

Use `contracts` apenas para metadados estáticos de posse de capacidades que o OpenClaw pode
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

| Campo                            | Tipo       | O que significa                                             |
| -------------------------------- | ---------- | ----------------------------------------------------------- |
| `speechProviders`                | `string[]` | IDs de provider de fala pertencentes a este plugin.         |
| `realtimeTranscriptionProviders` | `string[]` | IDs de provider de transcrição em tempo real pertencentes a este plugin. |
| `realtimeVoiceProviders`         | `string[]` | IDs de provider de voz em tempo real pertencentes a este plugin. |
| `mediaUnderstandingProviders`    | `string[]` | IDs de provider de entendimento de mídia pertencentes a este plugin. |
| `imageGenerationProviders`       | `string[]` | IDs de provider de geração de imagem pertencentes a este plugin. |
| `videoGenerationProviders`       | `string[]` | IDs de provider de geração de vídeo pertencentes a este plugin. |
| `webFetchProviders`              | `string[]` | IDs de provider de busca web pertencentes a este plugin.    |
| `webSearchProviders`             | `string[]` | IDs de provider de pesquisa web pertencentes a este plugin. |
| `tools`                          | `string[]` | Nomes de ferramentas do agente pertencentes a este plugin para verificações de contrato integradas. |

## Referência de channelConfigs

Use `channelConfigs` quando um plugin de canal precisar de metadados baratos de configuração antes
de o runtime carregar.

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

| Campo         | Tipo                     | O que significa                                                                                |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema para `channels.<id>`. Obrigatório para cada entrada declarada de configuração de canal. |
| `uiHints`     | `Record<string, object>` | Rótulos/placeholders/dicas de sensibilidade opcionais de UI para essa seção de configuração de canal. |
| `label`       | `string`                 | Rótulo do canal mesclado em superfícies de seletor e inspeção quando os metadados de runtime não estão prontos. |
| `description` | `string`                 | Descrição curta do canal para superfícies de inspeção e catálogo.                              |
| `preferOver`  | `string[]`               | IDs de plugin legados ou de menor prioridade que este canal deve superar em superfícies de seleção. |

## Referência de modelSupport

Use `modelSupport` quando o OpenClaw precisar inferir seu plugin de provider a partir de
IDs resumidos de modelo como `gpt-5.4` ou `claude-sonnet-4.6` antes de o runtime do plugin
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

- referências explícitas `provider/model` usam os metadados `providers` de posse do manifesto
- `modelPatterns` prevalecem sobre `modelPrefixes`
- se um plugin não integrado e um plugin integrado corresponderem, o plugin não integrado
  vence
- ambiguidades restantes são ignoradas até que o usuário ou a configuração especifique um provider

Campos:

| Campo           | Tipo       | O que significa                                                                  |
| --------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefixos correspondidos com `startsWith` em IDs resumidos de modelo.            |
| `modelPatterns` | `string[]` | Fontes regex correspondidas com IDs resumidos de modelo após a remoção do sufixo de perfil. |

Chaves legadas de capacidade de nível superior estão obsoletas. Use `openclaw doctor --fix` para
mover `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` e `webSearchProviders` para `contracts`; o carregamento normal
do manifesto não trata mais esses campos de nível superior como
posse de capacidades.

## Manifesto versus package.json

Os dois arquivos servem para tarefas diferentes:

| Arquivo                | Use para                                                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Descoberta, validação de configuração, metadados de opção de autenticação e dicas de UI que precisam existir antes da execução do código do plugin |
| `package.json`         | Metadados npm, instalação de dependências e o bloco `openclaw` usado para entrypoints, bloqueio de instalação, setup ou metadados de catálogo |

Se você não tiver certeza de onde um metadado deve ficar, use esta regra:

- se o OpenClaw precisa conhecê-lo antes de carregar o código do plugin, coloque-o em `openclaw.plugin.json`
- se for sobre empacotamento, arquivos de entrada ou comportamento de instalação npm, coloque-o em `package.json`

### Campos de package.json que afetam a descoberta

Alguns metadados de plugin pré-runtime intencionalmente ficam em `package.json` sob o
bloco `openclaw` em vez de `openclaw.plugin.json`.

Exemplos importantes:

| Campo                                                             | O que significa                                                                                                                               |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Declara entrypoints nativos de plugin.                                                                                                        |
| `openclaw.setupEntry`                                             | Entrypoint leve apenas de setup usado durante onboarding e inicialização adiada de canal.                                                     |
| `openclaw.channel`                                                | Metadados baratos de catálogo de canal como rótulos, caminhos de docs, aliases e texto de seleção.                                          |
| `openclaw.channel.configuredState`                                | Metadados leves de verificação de estado configurado que podem responder “a configuração só por env já existe?” sem carregar o runtime completo do canal. |
| `openclaw.channel.persistedAuthState`                             | Metadados leves de verificação de autenticação persistida que podem responder “já existe alguma sessão autenticada?” sem carregar o runtime completo do canal. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Dicas de instalação/atualização para plugins integrados e publicados externamente.                                                            |
| `openclaw.install.defaultChoice`                                  | Caminho de instalação preferido quando há várias fontes de instalação disponíveis.                                                            |
| `openclaw.install.minHostVersion`                                 | Versão mínima compatível do host OpenClaw, usando um piso semver como `>=2026.3.22`.                                                         |
| `openclaw.install.allowInvalidConfigRecovery`                     | Permite um caminho estreito de recuperação por reinstalação de plugin integrado quando a configuração é inválida.                            |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permite que superfícies de canal apenas de setup carreguem antes do plugin completo de canal durante a inicialização.                        |

`openclaw.install.minHostVersion` é aplicado durante a instalação e o carregamento do registro
de manifestos. Valores inválidos são rejeitados; valores válidos, porém mais novos, ignoram o
plugin em hosts mais antigos.

`openclaw.install.allowInvalidConfigRecovery` é intencionalmente estreito. Ele
não torna configurações arbitrariamente quebradas instaláveis. Hoje ele só permite que
fluxos de instalação se recuperem de falhas específicas obsoletas de upgrade de plugin integrado, como
um caminho ausente de plugin integrado ou uma entrada `channels.<id>` obsoleta para esse mesmo
plugin integrado. Erros de configuração não relacionados ainda bloqueiam a instalação e enviam os operadores
para `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` é metadado de pacote para um minúsculo
módulo verificador:

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

Use isso quando fluxos de setup, doctor ou estado configurado precisarem de uma sonda barata de autenticação sim/não
antes de o plugin completo de canal carregar. A exportação de destino deve ser uma pequena
função que leia apenas o estado persistido; não a direcione pelo barrel completo
do runtime do canal.

`openclaw.channel.configuredState` segue o mesmo formato para verificações baratas de
estado configurado apenas por env:

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

Use isso quando um canal puder responder o estado configurado a partir de env ou de outras entradas
mínimas não ligadas ao runtime. Se a verificação precisar da resolução completa de configuração ou do
runtime real do canal, mantenha essa lógica no hook `config.hasConfiguredState` do plugin.

## Requisitos de JSON Schema

- **Todo plugin deve incluir um JSON Schema**, mesmo que não aceite configuração.
- Um schema vazio é aceitável (por exemplo, `{ "type": "object", "additionalProperties": false }`).
- Os schemas são validados no momento de leitura/gravação da configuração, não em runtime.

## Comportamento de validação

- Chaves desconhecidas em `channels.*` são **erros**, a menos que o id do canal seja declarado por
  um manifesto de plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*`
  devem referenciar IDs de plugin **descobertos**. IDs desconhecidos são **erros**.
- Se um plugin estiver instalado, mas tiver um manifesto ou schema ausente ou quebrado,
  a validação falha e o Doctor informa o erro do plugin.
- Se existir configuração de plugin, mas o plugin estiver **desabilitado**, a configuração é mantida e
  um **aviso** é exibido no Doctor + logs.

Consulte [Referência de configuração](/pt-BR/gateway/configuration) para o schema completo de `plugins.*`.

## Observações

- O manifesto é **obrigatório para plugins nativos do OpenClaw**, incluindo carregamentos locais do sistema de arquivos.
- O runtime ainda carrega o módulo do plugin separadamente; o manifesto é apenas para
  descoberta + validação.
- Manifestos nativos são analisados com JSON5, então comentários, vírgulas finais e
  chaves sem aspas são aceitos, desde que o valor final ainda seja um objeto.
- Apenas campos documentados do manifesto são lidos pelo carregador de manifesto. Evite adicionar
  chaves personalizadas de nível superior aqui.
- `providerAuthEnvVars` é o caminho barato de metadados para sondas de autenticação,
  validação de marcadores de env e superfícies semelhantes de autenticação de provider que não devem iniciar o runtime do plugin apenas para inspecionar nomes de env.
- `providerAuthChoices` é o caminho barato de metadados para seletores de opção de autenticação,
  resolução de `--auth-choice`, mapeamento de provider preferido e registro simples
  de flags de CLI de onboarding antes de o runtime do provider carregar. Para metadados
  de assistente em runtime que exigem código do provider, consulte
  [Hooks de runtime do provider](/pt-BR/plugins/architecture#provider-runtime-hooks).
- Tipos exclusivos de plugin são selecionados por meio de `plugins.slots.*`.
  - `kind: "memory"` é selecionado por `plugins.slots.memory`.
  - `kind: "context-engine"` é selecionado por `plugins.slots.contextEngine`
    (padrão: `legacy` integrado).
- `channels`, `providers` e `skills` podem ser omitidos quando um
  plugin não precisar deles.
- Se o seu plugin depender de módulos nativos, documente as etapas de build e quaisquer
  requisitos de allowlist do gerenciador de pacotes (por exemplo, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Relacionado

- [Criando plugins](/pt-BR/plugins/building-plugins) — primeiros passos com plugins
- [Arquitetura de plugins](/pt-BR/plugins/architecture) — arquitetura interna
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência do Plugin SDK
