---
read_when:
    - Você está criando um plugin do OpenClaw
    - Você precisa entregar um schema de configuração de plugin ou depurar erros de validação de plugin
summary: Manifesto de plugin + requisitos do schema JSON (validação estrita de configuração)
title: Manifesto de plugin
x-i18n:
    generated_at: "2026-04-11T02:46:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6b254c121d1eb5ea19adbd4148243cf47339c960442ab1ca0e0bfd52e0154c88
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifesto de plugin (`openclaw.plugin.json`)

Esta página é apenas para o **manifesto nativo de plugin do OpenClaw**.

Para layouts de bundle compatíveis, veja [Plugin bundles](/pt-BR/plugins/bundles).

Formatos de bundle compatíveis usam arquivos de manifesto diferentes:

- Bundle do Codex: `.codex-plugin/plugin.json`
- Bundle do Claude: `.claude-plugin/plugin.json` ou o layout padrão de componente do Claude
  sem manifesto
- Bundle do Cursor: `.cursor-plugin/plugin.json`

O OpenClaw também detecta automaticamente esses layouts de bundle, mas eles não são validados
em relação ao schema de `openclaw.plugin.json` descrito aqui.

Para bundles compatíveis, o OpenClaw atualmente lê os metadados do bundle mais as
raízes de Skill declaradas, raízes de comandos do Claude, padrões de `settings.json` do bundle do Claude,
padrões de LSP do bundle do Claude e pacotes de hooks compatíveis quando o layout corresponde
às expectativas de runtime do OpenClaw.

Todo plugin nativo do OpenClaw **deve** incluir um arquivo `openclaw.plugin.json` na
**raiz do plugin**. O OpenClaw usa esse manifesto para validar a configuração
**sem executar código do plugin**. Manifestos ausentes ou inválidos são tratados como
erros de plugin e bloqueiam a validação da configuração.

Veja o guia completo do sistema de plugins: [Plugins](/pt-BR/tools/plugin).
Para o modelo nativo de capacidades e a orientação atual de compatibilidade externa:
[Modelo de capacidades](/pt-BR/plugins/architecture#public-capability-model).

## O que este arquivo faz

`openclaw.plugin.json` são os metadados que o OpenClaw lê antes de carregar o
código do seu plugin.

Use-o para:

- identidade do plugin
- validação de configuração
- metadados de auth e onboarding que devem estar disponíveis sem iniciar o runtime do plugin
- metadados de alias e autoativação que devem ser resolvidos antes de o runtime do plugin ser carregado
- metadados abreviados de posse de família de modelos que devem autoativar o
  plugin antes de o runtime ser carregado
- snapshots estáticos de posse de capacidades usados para compatibilidade de bundles e cobertura de contrato
- metadados de configuração específicos de canal que devem ser mesclados nas superfícies de catálogo e validação sem carregar o runtime
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
  "description": "OpenRouter provider plugin",
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
      "choiceLabel": "OpenRouter API key",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API key",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API key",
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
| `id`                                | Sim         | `string`                         | ID canônico do plugin. Esse é o ID usado em `plugins.entries.<id>`.                                                                                                                                          |
| `configSchema`                      | Sim         | `object`                         | JSON Schema inline para a configuração deste plugin.                                                                                                                                                         |
| `enabledByDefault`                  | Não         | `true`                           | Marca um plugin incluído como ativado por padrão. Omita-o ou defina qualquer valor diferente de `true` para manter o plugin desativado por padrão.                                                       |
| `legacyPluginIds`                   | Não         | `string[]`                       | IDs legados que são normalizados para este ID canônico de plugin.                                                                                                                                            |
| `autoEnableWhenConfiguredProviders` | Não         | `string[]`                       | IDs de provedores que devem autoativar este plugin quando auth, configuração ou referências de modelo os mencionarem.                                                                                       |
| `kind`                              | Não         | `"memory"` \| `"context-engine"` | Declara um tipo exclusivo de plugin usado por `plugins.slots.*`.                                                                                                                                             |
| `channels`                          | Não         | `string[]`                       | IDs de canais pertencentes a este plugin. Usado para descoberta e validação de configuração.                                                                                                                |
| `providers`                         | Não         | `string[]`                       | IDs de provedores pertencentes a este plugin.                                                                                                                                                                |
| `modelSupport`                      | Não         | `object`                         | Metadados abreviados de família de modelos de posse do manifesto usados para carregar automaticamente o plugin antes do runtime.                                                                            |
| `cliBackends`                       | Não         | `string[]`                       | IDs de backends de inferência da CLI pertencentes a este plugin. Usado para autoativação na inicialização a partir de referências explícitas de configuração.                                              |
| `commandAliases`                    | Não         | `object[]`                       | Nomes de comandos pertencentes a este plugin que devem produzir configuração sensível ao plugin e diagnósticos de CLI antes de o runtime ser carregado.                                                    |
| `providerAuthEnvVars`               | Não         | `Record<string, string[]>`       | Metadados simples de env de auth do provedor que o OpenClaw pode inspecionar sem carregar código do plugin.                                                                                                 |
| `providerAuthAliases`               | Não         | `Record<string, string>`         | IDs de provedores que devem reutilizar outro ID de provedor para busca de auth, por exemplo um provedor de coding que compartilha a chave de API do provedor base e perfis de auth.                       |
| `channelEnvVars`                    | Não         | `Record<string, string[]>`       | Metadados simples de env de canal que o OpenClaw pode inspecionar sem carregar código do plugin. Use isso para superfícies de configuração ou auth de canal orientadas por env que helpers genéricos de inicialização/configuração devem enxergar. |
| `providerAuthChoices`               | Não         | `object[]`                       | Metadados simples de escolhas de auth para seletores de onboarding, resolução de provedor preferido e wiring simples de flags da CLI.                                                                      |
| `contracts`                         | Não         | `object`                         | Snapshot estático de capacidades de bundle para fala, transcrição em tempo real, voz em tempo real, entendimento de mídia, geração de imagem, geração de música, geração de vídeo, web-fetch, busca na web e posse de ferramentas. |
| `channelConfigs`                    | Não         | `Record<string, object>`         | Metadados de configuração de canal pertencentes ao manifesto mesclados nas superfícies de descoberta e validação antes de o runtime ser carregado.                                                         |
| `skills`                            | Não         | `string[]`                       | Diretórios de Skills para carregar, relativos à raiz do plugin.                                                                                                                                              |
| `name`                              | Não         | `string`                         | Nome legível do plugin.                                                                                                                                                                                      |
| `description`                       | Não         | `string`                         | Resumo curto mostrado nas superfícies de plugin.                                                                                                                                                             |
| `version`                           | Não         | `string`                         | Versão informativa do plugin.                                                                                                                                                                                |
| `uiHints`                           | Não         | `Record<string, object>`         | Rótulos de UI, placeholders e dicas de sensibilidade para campos de configuração.                                                                                                                            |

## Referência de `providerAuthChoices`

Cada entrada de `providerAuthChoices` descreve uma escolha de onboarding ou auth.
O OpenClaw lê isso antes de o runtime do provedor ser carregado.

| Campo                 | Obrigatório | Tipo                                            | O que significa                                                                                          |
| --------------------- | ----------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Sim         | `string`                                        | ID do provedor ao qual esta escolha pertence.                                                            |
| `method`              | Sim         | `string`                                        | ID do método de auth para o qual encaminhar.                                                             |
| `choiceId`            | Sim         | `string`                                        | ID estável da escolha de auth usado pelos fluxos de onboarding e CLI.                                    |
| `choiceLabel`         | Não         | `string`                                        | Rótulo voltado ao usuário. Se omitido, o OpenClaw usa `choiceId` como fallback.                         |
| `choiceHint`          | Não         | `string`                                        | Texto auxiliar curto para o seletor.                                                                     |
| `assistantPriority`   | Não         | `number`                                        | Valores menores são ordenados antes em seletores interativos orientados pelo assistente.                |
| `assistantVisibility` | Não         | `"visible"` \| `"manual-only"`                  | Oculta a escolha dos seletores do assistente, mas ainda permite seleção manual pela CLI.                |
| `deprecatedChoiceIds` | Não         | `string[]`                                      | IDs legados de escolha que devem redirecionar usuários para esta escolha substituta.                     |
| `groupId`             | Não         | `string`                                        | ID opcional de grupo para agrupar escolhas relacionadas.                                                 |
| `groupLabel`          | Não         | `string`                                        | Rótulo voltado ao usuário para esse grupo.                                                               |
| `groupHint`           | Não         | `string`                                        | Texto auxiliar curto para o grupo.                                                                       |
| `optionKey`           | Não         | `string`                                        | Chave interna de opção para fluxos simples de auth com uma única flag.                                   |
| `cliFlag`             | Não         | `string`                                        | Nome da flag da CLI, como `--openrouter-api-key`.                                                        |
| `cliOption`           | Não         | `string`                                        | Formato completo da opção da CLI, como `--openrouter-api-key <key>`.                                     |
| `cliDescription`      | Não         | `string`                                        | Descrição usada na ajuda da CLI.                                                                         |
| `onboardingScopes`    | Não         | `Array<"text-inference" \| "image-generation">` | Em quais superfícies de onboarding esta escolha deve aparecer. Se omitido, o padrão é `["text-inference"]`. |

## Referência de `commandAliases`

Use `commandAliases` quando um plugin possui um nome de comando de runtime que os usuários podem
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

| Campo        | Obrigatório | Tipo              | O que significa                                                              |
| ------------ | ----------- | ----------------- | ---------------------------------------------------------------------------- |
| `name`       | Sim         | `string`          | Nome do comando que pertence a este plugin.                                  |
| `kind`       | Não         | `"runtime-slash"` | Marca o alias como um comando de barra do chat em vez de um comando raiz da CLI. |
| `cliCommand` | Não         | `string`          | Comando raiz relacionado da CLI a sugerir para operações na CLI, se existir. |

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
| `help`        | `string`   | Texto auxiliar curto.                  |
| `tags`        | `string[]` | Tags opcionais de UI.                  |
| `advanced`    | `boolean`  | Marca o campo como avançado.           |
| `sensitive`   | `boolean`  | Marca o campo como secreto ou sensível. |
| `placeholder` | `string`   | Texto de placeholder para entradas de formulário. |

## Referência de `contracts`

Use `contracts` apenas para metadados estáticos de posse de capacidade que o OpenClaw pode
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

| Campo                            | Tipo       | O que significa                                                 |
| -------------------------------- | ---------- | --------------------------------------------------------------- |
| `speechProviders`                | `string[]` | IDs de provedores de fala pertencentes a este plugin.           |
| `realtimeTranscriptionProviders` | `string[]` | IDs de provedores de transcrição em tempo real pertencentes a este plugin. |
| `realtimeVoiceProviders`         | `string[]` | IDs de provedores de voz em tempo real pertencentes a este plugin. |
| `mediaUnderstandingProviders`    | `string[]` | IDs de provedores de entendimento de mídia pertencentes a este plugin. |
| `imageGenerationProviders`       | `string[]` | IDs de provedores de geração de imagem pertencentes a este plugin. |
| `videoGenerationProviders`       | `string[]` | IDs de provedores de geração de vídeo pertencentes a este plugin. |
| `webFetchProviders`              | `string[]` | IDs de provedores de web-fetch pertencentes a este plugin.      |
| `webSearchProviders`             | `string[]` | IDs de provedores de busca na web pertencentes a este plugin.   |
| `tools`                          | `string[]` | Nomes de ferramentas do agente pertencentes a este plugin para verificações de contrato de bundles. |

## Referência de `channelConfigs`

Use `channelConfigs` quando um plugin de canal precisa de metadados baratos de configuração antes
de o runtime ser carregado.

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

| Campo         | Tipo                     | O que significa                                                                        |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema para `channels.<id>`. Obrigatório para cada entrada declarada de configuração de canal. |
| `uiHints`     | `Record<string, object>` | Rótulos/placeholders/dicas de sensibilidade opcionais de UI para essa seção de configuração do canal. |
| `label`       | `string`                 | Rótulo do canal mesclado às superfícies de seletor e inspeção quando os metadados de runtime não estão prontos. |
| `description` | `string`                 | Descrição curta do canal para superfícies de inspeção e catálogo.                      |
| `preferOver`  | `string[]`               | IDs de plugins legados ou de menor prioridade que este canal deve superar nas superfícies de seleção. |

## Referência de `modelSupport`

Use `modelSupport` quando o OpenClaw deve inferir seu plugin de provedor a partir de
IDs abreviados de modelo como `gpt-5.4` ou `claude-sonnet-4.6` antes de o runtime do plugin
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

- referências explícitas `provider/model` usam os metadados de manifesto `providers` do proprietário
- `modelPatterns` têm precedência sobre `modelPrefixes`
- se um plugin não incluído e um plugin incluído corresponderem, o plugin não incluído
  vence
- ambiguidades restantes são ignoradas até que o usuário ou a configuração especifique um provedor

Campos:

| Campo           | Tipo       | O que significa                                                                  |
| --------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefixos comparados com `startsWith` em relação a IDs abreviados de modelo.      |
| `modelPatterns` | `string[]` | Sources de regex comparados com IDs abreviados de modelo após a remoção do sufixo do perfil. |

Chaves legadas de capacidade no nível superior estão obsoletas. Use `openclaw doctor --fix` para
mover `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` e `webSearchProviders` para `contracts`; o carregamento normal
do manifesto não trata mais esses campos de nível superior como
posse de capacidade.

## Manifesto versus `package.json`

Os dois arquivos têm funções diferentes:

| Arquivo                | Use para                                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Descoberta, validação de configuração, metadados de escolha de auth e dicas de UI que devem existir antes de o código do plugin ser executado |
| `package.json`         | Metadados npm, instalação de dependências e o bloco `openclaw` usado para entrypoints, gating de instalação, setup ou metadados de catálogo |

Se você não tiver certeza sobre onde uma parte dos metadados deve ficar, use esta regra:

- se o OpenClaw precisar conhecê-la antes de carregar o código do plugin, coloque-a em `openclaw.plugin.json`
- se for sobre empacotamento, arquivos de entrada ou comportamento de instalação npm, coloque-a em `package.json`

### Campos de `package.json` que afetam a descoberta

Alguns metadados de plugin anteriores ao runtime ficam intencionalmente em `package.json` no bloco
`openclaw` em vez de `openclaw.plugin.json`.

Exemplos importantes:

| Campo                                                             | O que significa                                                                                                                             |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Declara entrypoints nativos de plugin.                                                                                                      |
| `openclaw.setupEntry`                                             | Entrypoint leve apenas para setup usado durante onboarding e inicialização adiada de canal.                                                 |
| `openclaw.channel`                                                | Metadados simples de catálogo de canal, como rótulos, caminhos de docs, aliases e texto de seleção.                                        |
| `openclaw.channel.configuredState`                                | Metadados leves de verificador de estado configurado que podem responder "já existe configuração apenas por env?" sem carregar o runtime completo do canal. |
| `openclaw.channel.persistedAuthState`                             | Metadados leves de verificador de auth persistida que podem responder "já existe algo autenticado?" sem carregar o runtime completo do canal. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Dicas de instalação/atualização para plugins incluídos e publicados externamente.                                                           |
| `openclaw.install.defaultChoice`                                  | Caminho de instalação preferido quando várias fontes de instalação estão disponíveis.                                                       |
| `openclaw.install.minHostVersion`                                 | Versão mínima compatível do host OpenClaw, usando um piso semver como `>=2026.3.22`.                                                       |
| `openclaw.install.allowInvalidConfigRecovery`                     | Permite um caminho restrito de recuperação por reinstalação de plugin incluído quando a configuração é inválida.                           |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permite que superfícies de canal apenas de setup sejam carregadas antes do plugin completo do canal durante a inicialização.               |

`openclaw.install.minHostVersion` é aplicado durante a instalação e o carregamento do registro
de manifestos. Valores inválidos são rejeitados; valores válidos, mas mais novos, ignoram o
plugin em hosts mais antigos.

`openclaw.install.allowInvalidConfigRecovery` é intencionalmente restrito. Ele não
torna configurações quebradas arbitrárias instaláveis. Hoje ele só permite que fluxos de instalação
se recuperem de falhas específicas e antigas de upgrade de plugin incluído, como um
caminho ausente de plugin incluído ou uma entrada antiga `channels.<id>` para esse mesmo
plugin incluído. Erros de configuração não relacionados ainda bloqueiam a instalação e direcionam os
operadores para `openclaw doctor --fix`.

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

Use-o quando fluxos de setup, doctor ou estado configurado precisarem de uma
sondagem barata de auth sim/não antes de o plugin completo do canal ser carregado. O export de destino deve ser uma pequena
função que leia apenas o estado persistido; não o encaminhe pelo barrel completo de runtime do canal.

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

Use-o quando um canal puder responder ao estado configurado a partir de env ou de outras entradas pequenas
não ligadas ao runtime. Se a verificação precisar de resolução completa de configuração ou do
runtime real do canal, mantenha essa lógica no hook `config.hasConfiguredState` do plugin.

## Requisitos do JSON Schema

- **Todo plugin deve incluir um JSON Schema**, mesmo que não aceite configuração.
- Um schema vazio é aceitável (por exemplo, `{ "type": "object", "additionalProperties": false }`).
- Os schemas são validados no momento de leitura/gravação da configuração, não em runtime.

## Comportamento de validação

- Chaves desconhecidas em `channels.*` são **erros**, a menos que o ID do canal seja declarado por
  um manifesto de plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*`
  devem referenciar IDs de plugin **detectáveis**. IDs desconhecidos são **erros**.
- Se um plugin estiver instalado, mas tiver um manifesto ou schema quebrado ou ausente,
  a validação falhará e o Doctor relatará o erro do plugin.
- Se a configuração do plugin existir, mas o plugin estiver **desativado**, a configuração será mantida e
  um **aviso** será exibido no Doctor + logs.

Veja [Referência de configuração](/pt-BR/gateway/configuration) para o schema completo de `plugins.*`.

## Observações

- O manifesto é **obrigatório para plugins nativos do OpenClaw**, incluindo carregamentos locais do sistema de arquivos.
- O runtime ainda carrega o módulo do plugin separadamente; o manifesto serve apenas para
  descoberta + validação.
- Manifestos nativos são analisados com JSON5, então comentários, vírgulas finais e
  chaves sem aspas são aceitos, desde que o valor final continue sendo um objeto.
- Apenas os campos documentados do manifesto são lidos pelo carregador de manifesto. Evite adicionar
  chaves personalizadas de nível superior aqui.
- `providerAuthEnvVars` é o caminho de metadados simples para sondagens de auth, validação de marcadores de env
  e superfícies semelhantes de auth de provedor que não devem iniciar o runtime do plugin
  apenas para inspecionar nomes de env.
- `providerAuthAliases` permite que variantes de provedor reutilizem a auth de outro
  provedor, incluindo env vars de auth, perfis de auth, auth baseada em configuração e escolha de onboarding por chave de API,
  sem hardcoding dessa relação no core.
- `channelEnvVars` é o caminho de metadados simples para fallback por shell-env, prompts de setup
  e superfícies semelhantes de canal que não devem iniciar o runtime do plugin
  apenas para inspecionar nomes de env.
- `providerAuthChoices` é o caminho de metadados simples para seletores de escolha de auth,
  resolução de `--auth-choice`, mapeamento de provedor preferido e registro simples de flags de CLI de onboarding
  antes de o runtime do provedor ser carregado. Para metadados do assistente de runtime
  que exigem código do provedor, veja
  [Hooks de runtime do provedor](/pt-BR/plugins/architecture#provider-runtime-hooks).
- Tipos exclusivos de plugin são selecionados por meio de `plugins.slots.*`.
  - `kind: "memory"` é selecionado por `plugins.slots.memory`.
  - `kind: "context-engine"` é selecionado por `plugins.slots.contextEngine`
    (padrão: `legacy` incluído).
- `channels`, `providers`, `cliBackends` e `skills` podem ser omitidos quando um
  plugin não precisa deles.
- Se seu plugin depender de módulos nativos, documente as etapas de build e quaisquer
  requisitos de allowlist do gerenciador de pacotes (por exemplo, `allow-build-scripts` do pnpm
  - `pnpm rebuild <package>`).

## Relacionado

- [Criando plugins](/pt-BR/plugins/building-plugins) — primeiros passos com plugins
- [Plugin Architecture](/pt-BR/plugins/architecture) — arquitetura interna
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência do Plugin SDK
