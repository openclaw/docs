---
read_when:
    - Você está criando um Plugin OpenClaw
    - Você precisa entregar um esquema de configuração de Plugin ou depurar erros de validação de Plugin
summary: Manifesto do Plugin + requisitos de esquema JSON (validação estrita da configuração)
title: Manifesto do Plugin
x-i18n:
    generated_at: "2026-04-30T09:59:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: e71bc192e10504b59dbf587138cfeb3d53ef31e7cbe35d6a8f0672960d318e2d
    source_path: plugins/manifest.md
    workflow: 16
---

Esta página é apenas para o **manifesto de Plugin nativo do OpenClaw**.

Para layouts de pacote compatíveis, consulte [Pacotes de Plugin](/pt-BR/plugins/bundles).

Formatos de pacote compatíveis usam arquivos de manifesto diferentes:

- Pacote Codex: `.codex-plugin/plugin.json`
- Pacote Claude: `.claude-plugin/plugin.json` ou o layout padrão de componente Claude
  sem um manifesto
- Pacote Cursor: `.cursor-plugin/plugin.json`

O OpenClaw também detecta automaticamente esses layouts de pacote, mas eles não são validados
contra o esquema `openclaw.plugin.json` descrito aqui.

Para pacotes compatíveis, o OpenClaw atualmente lê metadados do pacote mais raízes de
Skills declaradas, raízes de comandos Claude, padrões de `settings.json` do pacote Claude,
padrões de LSP do pacote Claude e pacotes de hooks compatíveis quando o layout corresponde
às expectativas de runtime do OpenClaw.

Todo Plugin nativo do OpenClaw **deve** incluir um arquivo `openclaw.plugin.json` na
**raiz do Plugin**. O OpenClaw usa esse manifesto para validar a configuração
**sem executar código do Plugin**. Manifestos ausentes ou inválidos são tratados como
erros de Plugin e bloqueiam a validação de configuração.

Veja o guia completo do sistema de Plugins: [Plugins](/pt-BR/tools/plugin).
Para o modelo de capacidade nativo e a orientação atual de compatibilidade externa:
[Modelo de capacidade](/pt-BR/plugins/architecture#public-capability-model).

## O que este arquivo faz

`openclaw.plugin.json` são os metadados que o OpenClaw lê **antes de carregar seu
código do Plugin**. Tudo abaixo deve ser barato o suficiente para inspecionar sem iniciar
o runtime do Plugin.

**Use-o para:**

- identidade do Plugin, validação de configuração e dicas de UI de configuração
- metadados de autenticação, onboarding e configuração inicial (alias, ativação automática, variáveis de ambiente do provedor, opções de autenticação)
- dicas de ativação para superfícies de plano de controle
- propriedade abreviada de família de modelos
- snapshots estáticos de propriedade de capacidades (`contracts`)
- metadados do executor de QA que o host compartilhado `openclaw qa` pode inspecionar
- metadados de configuração específicos de canal mesclados às superfícies de catálogo e validação

**Não o use para:** registrar comportamento de runtime, declarar pontos de entrada de código
ou metadados de instalação npm. Esses pertencem ao código do seu Plugin e ao `package.json`.

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

## Exemplo rico

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
  "modelIdNormalization": {
    "providers": {
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  },
  "providerEndpoints": [
    {
      "endpointClass": "openrouter",
      "hostSuffixes": ["openrouter.ai"]
    }
  ],
  "providerRequest": {
    "providers": {
      "openrouter": {
        "family": "openrouter"
      }
    }
  },
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

## Referência de campos de nível superior

| Campo                                | Obrigatório | Tipo                             | O que significa                                                                                                                                                                                                                         |
| ------------------------------------ | ------------ | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Sim          | `string`                         | ID canônico do plugin. Este é o ID usado em `plugins.entries.<id>`.                                                                                                                                                                     |
| `configSchema`                       | Sim          | `object`                         | JSON Schema embutido para a configuração deste plugin.                                                                                                                                                                                  |
| `enabledByDefault`                   | Não          | `true`                           | Marca um plugin incluído como habilitado por padrão. Omita-o, ou defina qualquer valor diferente de `true`, para deixar o plugin desabilitado por padrão.                                                                                |
| `legacyPluginIds`                    | Não          | `string[]`                       | IDs legados que são normalizados para este ID canônico de plugin.                                                                                                                                                                       |
| `autoEnableWhenConfiguredProviders`  | Não          | `string[]`                       | IDs de provedores que devem habilitar automaticamente este plugin quando autenticação, configuração ou referências de modelo os mencionarem.                                                                                             |
| `kind`                               | Não          | `"memory"` \| `"context-engine"` | Declara um tipo exclusivo de plugin usado por `plugins.slots.*`.                                                                                                                                                                        |
| `channels`                           | Não          | `string[]`                       | IDs de canais pertencentes a este plugin. Usado para descoberta e validação de configuração.                                                                                                                                             |
| `providers`                          | Não          | `string[]`                       | IDs de provedores pertencentes a este plugin.                                                                                                                                                                                           |
| `providerDiscoveryEntry`             | Não          | `string`                         | Caminho leve do módulo de descoberta de provedor, relativo à raiz do plugin, para metadados de catálogo de provedores com escopo de manifesto que podem ser carregados sem ativar o runtime completo do plugin.                         |
| `modelSupport`                       | Não          | `object`                         | Metadados abreviados de famílias de modelos pertencentes ao manifesto usados para carregar automaticamente o plugin antes do runtime.                                                                                                    |
| `modelCatalog`                       | Não          | `object`                         | Metadados declarativos de catálogo de modelos para provedores pertencentes a este plugin. Este é o contrato do plano de controle para futuras listagens somente leitura, onboarding, seletores de modelos, aliases e supressão sem carregar o runtime do plugin. |
| `modelPricing`                       | Não          | `object`                         | Política de consulta externa de preços pertencente ao provedor. Use-a para excluir provedores locais/auto-hospedados de catálogos remotos de preços ou mapear refs de provedores para IDs de catálogo OpenRouter/LiteLLM sem codificar IDs de provedores no core. |
| `modelIdNormalization`               | Não          | `object`                         | Limpeza de aliases/prefixos de IDs de modelo pertencente ao provedor que deve ser executada antes que o runtime do provedor carregue.                                                                                                    |
| `providerEndpoints`                  | Não          | `object[]`                       | Metadados de host/baseUrl de endpoints pertencentes ao manifesto para rotas de provedor que o core deve classificar antes que o runtime do provedor carregue.                                                                            |
| `providerRequest`                    | Não          | `object`                         | Metadados leves de família de provedor e compatibilidade de requisição usados pela política genérica de requisição antes que o runtime do provedor carregue.                                                                             |
| `cliBackends`                        | Não          | `string[]`                       | IDs de backends de inferência da CLI pertencentes a este plugin. Usado para ativação automática na inicialização a partir de refs explícitas de configuração.                                                                             |
| `syntheticAuthRefs`                  | Não          | `string[]`                       | Refs de provedor ou backend de CLI cujo hook de autenticação sintética pertencente ao plugin deve ser sondado durante a descoberta fria de modelos antes que o runtime carregue.                                                        |
| `nonSecretAuthMarkers`               | Não          | `string[]`                       | Valores de chave de API placeholder pertencentes a plugins incluídos que representam estado de credencial local, OAuth ou ambiente que não é secreto.                                                                                    |
| `commandAliases`                     | Não          | `object[]`                       | Nomes de comandos pertencentes a este plugin que devem produzir diagnósticos de configuração e CLI conscientes do plugin antes que o runtime carregue.                                                                                   |
| `providerAuthEnvVars`                | Não          | `Record<string, string[]>`       | Metadados de env de compatibilidade obsoletos para consulta de autenticação/status do provedor. Prefira `setup.providers[].envVars` para novos plugins; o OpenClaw ainda lê isto durante a janela de descontinuação.                    |
| `providerAuthAliases`                | Não          | `Record<string, string>`         | IDs de provedores que devem reutilizar outro ID de provedor para consulta de autenticação, por exemplo um provedor de codificação que compartilha a chave de API e os perfis de autenticação do provedor base.                            |
| `channelEnvVars`                     | Não          | `Record<string, string[]>`       | Metadados leves de env de canal que o OpenClaw pode inspecionar sem carregar código de plugin. Use isto para configuração de canal orientada por env ou superfícies de autenticação que auxiliares genéricos de inicialização/configuração devem ver. |
| `providerAuthChoices`                | Não          | `object[]`                       | Metadados leves de escolhas de autenticação para seletores de onboarding, resolução de provedor preferencial e conexão simples de flags da CLI.                                                                                          |
| `activation`                         | Não          | `object`                         | Metadados leves do planejador de ativação para carregamento acionado por inicialização, provedor, comando, canal, rota e capacidade. Apenas metadados; o runtime do plugin ainda possui o comportamento real.                            |
| `setup`                              | Não          | `object`                         | Descritores leves de configuração/onboarding que superfícies de descoberta e configuração podem inspecionar sem carregar o runtime do plugin.                                                                                            |
| `qaRunners`                          | Não          | `object[]`                       | Descritores leves de executores de QA usados pelo host compartilhado `openclaw qa` antes que o runtime do plugin carregue.                                                                                                               |
| `contracts`                          | Não          | `object`                         | Snapshot estático de capacidades incluídas para hooks externos de autenticação, fala, transcrição em tempo real, voz em tempo real, compreensão de mídia, geração de imagens, geração de música, geração de vídeo, busca web, pesquisa web e propriedade de ferramentas. |
| `mediaUnderstandingProviderMetadata` | Não          | `Record<string, object>`         | Padrões leves de compreensão de mídia para IDs de provedores declarados em `contracts.mediaUnderstandingProviders`.                                                                                                                     |
| `channelConfigs`                     | Não          | `Record<string, object>`         | Metadados de configuração de canal pertencentes ao manifesto mesclados em superfícies de descoberta e validação antes que o runtime carregue.                                                                                             |
| `skills`                             | Não          | `string[]`                       | Diretórios de Skills a carregar, relativos à raiz do plugin.                                                                                                                                                                           |
| `name`                               | Não          | `string`                         | Nome legível por humanos do plugin.                                                                                                                                                                                                    |
| `description`                        | Não          | `string`                         | Resumo curto mostrado nas superfícies de plugin.                                                                                                                                                                                       |
| `version`                            | Não          | `string`                         | Versão informativa do plugin.                                                                                                                                                                                                          |
| `uiHints`                            | Não          | `Record<string, object>`         | Rótulos de UI, placeholders e dicas de sensibilidade para campos de configuração.                                                                                                                                                       |

## Referência de providerAuthChoices

Cada entrada de `providerAuthChoices` descreve uma opção de onboarding ou autenticação.
O OpenClaw lê isto antes que o runtime do provedor carregue.
Listas de configuração de provedores usam estas escolhas do manifesto, escolhas de
configuração derivadas de descritores e metadados do catálogo de instalação sem
carregar o runtime do provedor.

| Campo                 | Obrigatório | Tipo                                            | O que significa                                                                                                                                                |
| --------------------- | ----------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`            | Sim         | `string`                                        | ID do provedor ao qual esta escolha pertence.                                                                                                                   |
| `method`              | Sim         | `string`                                        | ID do método de autenticação para o qual despachar.                                                                                                             |
| `choiceId`            | Sim         | `string`                                        | ID estável de escolha de autenticação usado por fluxos de integração e da CLI.                                                                                  |
| `choiceLabel`         | Não         | `string`                                        | Rótulo exibido ao usuário. Se omitido, o OpenClaw usa `choiceId` como alternativa.                                                                               |
| `choiceHint`          | Não         | `string`                                        | Texto curto de ajuda para o seletor.                                                                                                                           |
| `assistantPriority`   | Não         | `number`                                        | Valores menores são ordenados antes em seletores interativos conduzidos pelo assistente.                                                                        |
| `assistantVisibility` | Não         | `"visible"` \| `"manual-only"`                  | Oculta a escolha dos seletores do assistente, ainda permitindo a seleção manual pela CLI.                                                                       |
| `deprecatedChoiceIds` | Não         | `string[]`                                      | IDs de escolhas legadas que devem redirecionar usuários para esta escolha substituta.                                                                           |
| `groupId`             | Não         | `string`                                        | ID de grupo opcional para agrupar escolhas relacionadas.                                                                                                       |
| `groupLabel`          | Não         | `string`                                        | Rótulo exibido ao usuário para esse grupo.                                                                                                                      |
| `groupHint`           | Não         | `string`                                        | Texto curto de ajuda para o grupo.                                                                                                                             |
| `optionKey`           | Não         | `string`                                        | Chave interna de opção para fluxos simples de autenticação com uma única flag.                                                                                  |
| `cliFlag`             | Não         | `string`                                        | Nome da flag da CLI, como `--openrouter-api-key`.                                                                                                              |
| `cliOption`           | Não         | `string`                                        | Formato completo da opção da CLI, como `--openrouter-api-key <key>`.                                                                                            |
| `cliDescription`      | Não         | `string`                                        | Descrição usada na ajuda da CLI.                                                                                                                               |
| `onboardingScopes`    | Não         | `Array<"text-inference" \| "image-generation">` | Em quais superfícies de integração esta escolha deve aparecer. Se omitido, o padrão é `["text-inference"]`.                                                     |

## referência de commandAliases

Use `commandAliases` quando um plugin possui um nome de comando de tempo de execução que os usuários podem
colocar por engano em `plugins.allow` ou tentar executar como um comando CLI raiz. O OpenClaw
usa esses metadados para diagnósticos sem importar código de tempo de execução do plugin.

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

| Campo        | Obrigatório | Tipo              | O que significa                                                                         |
| ------------ | ----------- | ----------------- | --------------------------------------------------------------------------------------- |
| `name`       | Sim         | `string`          | Nome do comando que pertence a este plugin.                                             |
| `kind`       | Não         | `"runtime-slash"` | Marca o alias como um comando de barra de chat, e não como um comando CLI raiz.         |
| `cliCommand` | Não         | `string`          | Comando CLI raiz relacionado a sugerir para operações de CLI, se houver um.             |

## referência de activation

Use `activation` quando o plugin puder declarar de forma barata quais eventos do plano de controle
devem incluí-lo em um plano de ativação/carregamento.

Este bloco é metadado do planejador, não uma API de ciclo de vida. Ele não registra
comportamento de tempo de execução, não substitui `register(...)` e não promete que
o código do plugin já foi executado. O planejador de ativação usa estes campos para
restringir plugins candidatos antes de recorrer aos metadados existentes de propriedade no manifesto,
como `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` e hooks.

Prefira os metadados mais restritos que já descrevem a propriedade. Use
`providers`, `channels`, `commandAliases`, descritores de configuração ou `contracts`
quando esses campos expressarem a relação. Use `activation` para dicas extras do planejador
que não podem ser representadas por esses campos de propriedade.
Use `cliBackends` no nível superior para aliases de tempo de execução da CLI, como `claude-cli`,
`codex-cli` ou `google-gemini-cli`; `activation.onAgentHarnesses` é apenas para
IDs de harnesses de agente embutidos que ainda não têm um campo de propriedade.

Este bloco é apenas metadado. Ele não registra comportamento de tempo de execução e não
substitui `register(...)`, `setupEntry` ou outros pontos de entrada de tempo de execução/plugin.
Consumidores atuais o usam como dica de restrição antes de um carregamento mais amplo de plugins, então
metadados de ativação ausentes geralmente custam apenas desempenho; isso não deve
alterar a correção enquanto os recursos alternativos legados de propriedade do manifesto ainda existirem.

Todo plugin deve definir `activation.onStartup` intencionalmente à medida que o OpenClaw se afasta
de importações implícitas na inicialização. Defina como `true` somente quando o plugin precisar
executar durante a inicialização do Gateway. Defina como `false` quando o plugin estiver inerte na
inicialização e deve carregar apenas por gatilhos mais restritos. Omitir `onStartup` mantém
o recurso alternativo legado e obsoleto de sidecar implícito na inicialização para plugins sem
metadados estáticos de capacidade; versões futuras podem deixar de carregar esses
plugins na inicialização, a menos que declarem `activation.onStartup: true`. Relatórios de status e
compatibilidade de plugins avisam com `legacy-implicit-startup-sidecar` quando um plugin
ainda depende desse recurso alternativo.

Para testes de migração, defina
`OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1` para desativar apenas esse
recurso alternativo obsoleto. Esse modo opcional não bloqueia plugins explícitos com
`activation.onStartup: true` nem plugins carregados por canal, configuração,
harness de agente, memória ou outros gatilhos de ativação mais restritos.

```json
{
  "activation": {
    "onStartup": false,
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onConfigPaths": ["browser"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| Campo              | Obrigatório | Tipo                                                 | O que significa                                                                                                                                                                                                                                    |
| ------------------ | ----------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Não         | `boolean`                                            | Ativação explícita na inicialização do Gateway. Todo plugin deve definir isto. `true` importa o plugin durante a inicialização; `false` desativa o recurso alternativo obsoleto de inicialização implícita do sidecar, a menos que outro gatilho correspondente exija o carregamento. |
| `onProviders`      | Não         | `string[]`                                           | IDs de provedores que devem incluir este plugin em planos de ativação/carregamento.                                                                                                                                                                |
| `onAgentHarnesses` | Não         | `string[]`                                           | IDs de tempo de execução de harnesses de agente embutidos que devem incluir este plugin em planos de ativação/carregamento. Use `cliBackends` no nível superior para aliases de backend da CLI.                                                    |
| `onCommands`       | Não         | `string[]`                                           | IDs de comandos que devem incluir este plugin em planos de ativação/carregamento.                                                                                                                                                                  |
| `onChannels`       | Não         | `string[]`                                           | IDs de canais que devem incluir este plugin em planos de ativação/carregamento.                                                                                                                                                                    |
| `onRoutes`         | Não         | `string[]`                                           | Tipos de rota que devem incluir este plugin em planos de ativação/carregamento.                                                                                                                                                                    |
| `onConfigPaths`    | Não         | `string[]`                                           | Caminhos de configuração relativos à raiz que devem incluir este plugin em planos de inicialização/carregamento quando o caminho estiver presente e não estiver explicitamente desativado.                                                           |
| `onCapabilities`   | Não         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Dicas amplas de capacidade usadas pelo planejamento de ativação do plano de controle. Prefira campos mais restritos quando possível.                                                                                                                |

Consumidores ativos atuais:

- O planejamento de inicialização do Gateway usa `activation.onStartup` para importação explícita na inicialização
  e desativação do recurso alternativo obsoleto de inicialização implícita do sidecar
- O planejamento da CLI acionado por comandos recorre aos legados
  `commandAliases[].cliCommand` ou `commandAliases[].name`
- O planejamento de inicialização do tempo de execução de agente usa `activation.onAgentHarnesses` para
  harnesses embutidos e `cliBackends[]` no nível superior para aliases de tempo de execução da CLI
- O planejamento de configuração/canal acionado por canal recorre à propriedade legada `channels[]`
  quando metadados explícitos de ativação de canal estão ausentes
- O planejamento de plugins na inicialização usa `activation.onConfigPaths` para superfícies de configuração raiz
  não relacionadas a canal, como o bloco `browser` do plugin de navegador incluído
- O planejamento de configuração/tempo de execução acionado por provedor recorre à propriedade legada
  `providers[]` e `cliBackends[]` no nível superior quando metadados explícitos de ativação de provedor
  estão ausentes

Diagnósticos do planejador podem distinguir dicas explícitas de ativação de recursos alternativos
de propriedade do manifesto. Por exemplo, `activation-command-hint` significa que
`activation.onCommands` correspondeu, enquanto `manifest-command-alias` significa que o
planejador usou a propriedade `commandAliases` em vez disso. Esses rótulos de motivo são para
diagnósticos e testes do host; autores de plugins devem continuar declarando os metadados
que melhor descrevem a propriedade.

## referência de qaRunners

Use `qaRunners` quando um plugin contribui com um ou mais executores de transporte sob
a raiz compartilhada `openclaw qa`. Mantenha esses metadados baratos e estáticos; o tempo de execução do plugin
ainda é proprietário do registro real da CLI por meio de uma superfície leve
`runtime-api.ts` que exporta `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Run the Docker-backed Matrix live QA lane against a disposable homeserver"
    }
  ]
}
```

| Campo         | Obrigatório | Tipo     | O que significa                                                      |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Sim      | `string` | Subcomando montado abaixo de `openclaw qa`, por exemplo `matrix`.    |
| `description` | Não       | `string` | Texto de ajuda de fallback usado quando o host compartilhado precisa de um comando stub. |

## referência de setup

Use `setup` quando as superfícies de configuração e onboarding precisarem de metadados baratos pertencentes ao plugin
antes dos carregamentos em runtime.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"],
        "authEvidence": [
          {
            "type": "local-file-with-env",
            "fileEnvVar": "OPENAI_CREDENTIALS_FILE",
            "requiresAllEnv": ["OPENAI_PROJECT"],
            "credentialMarker": "openai-local-credentials",
            "source": "openai local credentials"
          }
        ]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

`cliBackends` no nível superior continua válido e segue descrevendo backends de inferência da CLI. `setup.cliBackends` é a superfície descritor específica de setup para
fluxos de plano de controle/setup que devem permanecer somente com metadados.

Quando presentes, `setup.providers` e `setup.cliBackends` são a superfície
preferida de consulta baseada primeiro em descritores para descoberta de setup. Se o descritor apenas
restringir o plugin candidato e o setup ainda precisar de hooks de runtime mais ricos em tempo de setup, defina `requiresRuntime: true` e mantenha `setup-api` em vigor como o
caminho de execução de fallback.

OpenClaw também inclui `setup.providers[].envVars` na autenticação genérica de provedores e nas consultas de variáveis de ambiente. `providerAuthEnvVars` continua com suporte por meio de um adaptador de compatibilidade durante a janela de descontinuação, mas plugins não incluídos que ainda o usam
recebem um diagnóstico de manifesto. Novos plugins devem colocar metadados de ambiente de setup/status
em `setup.providers[].envVars`.

OpenClaw também pode derivar escolhas simples de setup de `setup.providers[].authMethods`
quando nenhuma entrada de setup estiver disponível, ou quando `setup.requiresRuntime: false`
declarar que o runtime de setup é desnecessário. Entradas explícitas de `providerAuthChoices` continuam
preferidas para rótulos personalizados, flags de CLI, escopo de onboarding e metadados do assistente.

Defina `requiresRuntime: false` somente quando esses descritores forem suficientes para a
superfície de setup. OpenClaw trata `false` explícito como um contrato somente com descritores
e não executará `setup-api` nem `openclaw.setupEntry` para consulta de setup. Se
um plugin somente com descritores ainda distribuir uma dessas entradas de runtime de setup,
OpenClaw relata um diagnóstico aditivo e continua ignorando-a. `requiresRuntime`
omitido mantém o comportamento legado de fallback para que plugins existentes que adicionaram
descritores sem a flag não quebrem.

Como a consulta de setup pode executar código `setup-api` pertencente ao plugin, valores normalizados de
`setup.providers[].id` e `setup.cliBackends[]` devem permanecer únicos entre
plugins descobertos. Propriedade ambígua falha de forma fechada em vez de escolher um
vencedor pela ordem de descoberta.

Quando o runtime de setup é executado, os diagnósticos do registro de setup relatam divergência de descritores se `setup-api` registrar um provedor ou backend de CLI que os descritores do manifesto
não declaram, ou se um descritor não tiver registro de runtime
correspondente. Esses diagnósticos são aditivos e não rejeitam plugins legados.

### referência de setup.providers

| Campo          | Obrigatório | Tipo       | O que significa                                                                                    |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | Sim      | `string`   | ID do provedor exposto durante setup ou onboarding. Mantenha IDs normalizados globalmente únicos.             |
| `authMethods`  | Não       | `string[]` | IDs de métodos de setup/autenticação compatíveis com este provedor sem carregar todo o runtime.                       |
| `envVars`      | Não       | `string[]` | Variáveis de ambiente que superfícies genéricas de setup/status podem verificar antes dos carregamentos do runtime do plugin.               |
| `authEvidence` | Não       | `object[]` | Verificações baratas de evidência de autenticação local para provedores que podem autenticar por meio de marcadores não secretos. |

`authEvidence` serve para marcadores de credenciais locais pertencentes ao provedor que podem ser
verificados sem carregar código de runtime. Essas verificações devem permanecer baratas e locais:
sem chamadas de rede, sem leituras de chaveiro ou gerenciador de segredos, sem comandos de shell e sem
sondagens de API do provedor.

Entradas de evidência compatíveis:

| Campo              | Obrigatório | Tipo       | O que significa                                                                                                  |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | Sim      | `string`   | Atualmente `local-file-with-env`.                                                                               |
| `fileEnvVar`       | Não       | `string`   | Variável de ambiente contendo um caminho explícito de arquivo de credenciais.                                                           |
| `fallbackPaths`    | Não       | `string[]` | Caminhos locais de arquivos de credenciais verificados quando `fileEnvVar` está ausente ou vazio. Compatível com `${HOME}` e `${APPDATA}`. |
| `requiresAnyEnv`   | Não       | `string[]` | Pelo menos uma variável de ambiente listada deve estar não vazia antes que a evidência seja válida.                                    |
| `requiresAllEnv`   | Não       | `string[]` | Todas as variáveis de ambiente listadas devem estar não vazias antes que a evidência seja válida.                                           |
| `credentialMarker` | Sim      | `string`   | Marcador não secreto retornado quando a evidência está presente.                                                       |
| `source`           | Não       | `string`   | Rótulo de origem voltado ao usuário para saída de autenticação/status.                                                               |

### campos de setup

| Campo              | Obrigatório | Tipo       | O que significa                                                                                       |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | Não       | `object[]` | Descritores de setup de provedores expostos durante setup e onboarding.                                     |
| `cliBackends`      | Não       | `string[]` | IDs de backend em tempo de setup usados para consulta de setup baseada primeiro em descritores. Mantenha IDs normalizados globalmente únicos. |
| `configMigrations` | Não       | `string[]` | IDs de migração de configuração pertencentes à superfície de setup deste plugin.                                          |
| `requiresRuntime`  | Não       | `boolean`  | Se o setup ainda precisa de execução de `setup-api` após a consulta por descritores.                            |

## referência de uiHints

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

| Campo         | Tipo       | O que significa                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Rótulo de campo voltado ao usuário.                |
| `help`        | `string`   | Texto curto de ajuda.                      |
| `tags`        | `string[]` | Tags opcionais de UI.                       |
| `advanced`    | `boolean`  | Marca o campo como avançado.            |
| `sensitive`   | `boolean`  | Marca o campo como secreto ou sensível. |
| `placeholder` | `string`   | Texto de placeholder para entradas de formulário.       |

## referência de contracts

Use `contracts` somente para metadados estáticos de propriedade de capacidades que OpenClaw pode
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
    "migrationProviders": ["hermes"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Cada lista é opcional:

| Campo                            | Tipo       | O que significa                                                         |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | IDs de fábricas de extensão de app-server do Codex, atualmente `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | IDs de runtime para os quais um plugin incluído pode registrar middleware de resultado de ferramenta. |
| `externalAuthProviders`          | `string[]` | IDs de provedores cujo hook de perfil de autenticação externa este plugin possui.       |
| `speechProviders`                | `string[]` | IDs de provedores de fala que este plugin possui.                                 |
| `realtimeTranscriptionProviders` | `string[]` | IDs de provedores de transcrição em tempo real que este plugin possui.                 |
| `realtimeVoiceProviders`         | `string[]` | IDs de provedores de voz em tempo real que este plugin possui.                         |
| `memoryEmbeddingProviders`       | `string[]` | IDs de provedores de embeddings de memória que este plugin possui.                       |
| `mediaUnderstandingProviders`    | `string[]` | IDs de provedores de compreensão de mídia que este plugin possui.                    |
| `imageGenerationProviders`       | `string[]` | IDs de provedores de geração de imagens que este plugin possui.                       |
| `videoGenerationProviders`       | `string[]` | IDs de provedores de geração de vídeo que este plugin possui.                       |
| `webFetchProviders`              | `string[]` | IDs de provedores de busca Web que este plugin possui.                              |
| `webSearchProviders`             | `string[]` | IDs de provedores de pesquisa Web que este plugin possui.                             |
| `migrationProviders`             | `string[]` | IDs de provedores de importação que este plugin possui para `openclaw migrate`.          |
| `tools`                          | `string[]` | Nomes de ferramentas de agente que este plugin possui para verificações de contrato incluídas.        |

`contracts.embeddedExtensionFactories` é mantido para fábricas de extensão somente do app-server do Codex
incluídas. Transformações de resultado de ferramenta incluídas devem
declarar `contracts.agentToolResultMiddleware` e registrar com
`api.registerAgentToolResultMiddleware(...)` em vez disso. Plugins externos não podem
registrar middleware de resultado de ferramenta porque a costura pode reescrever saída de ferramenta de alta confiança
antes que o modelo a veja.

Plugins de provedor que implementam `resolveExternalAuthProfiles` devem declarar
`contracts.externalAuthProviders`. Plugins sem a declaração ainda são executados
por meio de um fallback de compatibilidade obsoleto, mas esse fallback é mais lento e
será removido após a janela de migração.

Provedores incluídos de embeddings de memória devem declarar
`contracts.memoryEmbeddingProviders` para cada ID de adaptador que expõem, incluindo
adaptadores internos como `local`. Caminhos de CLI autônomos usam este contrato de manifesto
para carregar somente o plugin proprietário antes que todo o runtime do Gateway tenha
registrado provedores.

## referência de mediaUnderstandingProviderMetadata

Use `mediaUnderstandingProviderMetadata` quando um provedor de compreensão de mídia tiver modelos padrão, prioridade de fallback de autenticação automática ou suporte nativo a documentos que os helpers genéricos do core precisam antes do carregamento do runtime. As chaves também devem ser declaradas em `contracts.mediaUnderstandingProviders`.

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
| `autoPriority`         | `Record<string, number>`            | Números menores são ordenados antes para fallback automático de provedor baseado em credenciais. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Entradas nativas de documento compatíveis com o provedor.                    |

## referência de channelConfigs

Use `channelConfigs` quando um Plugin de canal precisar de metadados baratos de configuração antes do carregamento do runtime. A descoberta somente leitura de setup/status do canal pode usar esses metadados diretamente para canais externos configurados quando nenhuma entrada de setup estiver disponível, ou quando `setup.requiresRuntime: false` declarar que o runtime de setup é desnecessário.

`channelConfigs` é metadado do manifesto do Plugin, não uma nova seção de configuração de usuário de nível superior. Os usuários ainda configuram instâncias de canal em `channels.<channel-id>`. O OpenClaw lê os metadados do manifesto para decidir qual Plugin é dono desse canal configurado antes que o código de runtime do Plugin seja executado.

Para um Plugin de canal, `configSchema` e `channelConfigs` descrevem caminhos diferentes:

- `configSchema` valida `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valida `channels.<channel-id>`

Plugins não empacotados que declaram `channels[]` também devem declarar entradas `channelConfigs` correspondentes. Sem elas, o OpenClaw ainda pode carregar o Plugin, mas o esquema de configuração em caminho frio, o setup e as superfícies da Control UI não conseguem conhecer o formato das opções pertencentes ao canal até que o runtime do Plugin seja executado.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` e `nativeSkillsAutoEnabled` podem declarar padrões estáticos `auto` para verificações de configuração de comandos que são executadas antes do carregamento do runtime do canal. Canais empacotados também podem publicar os mesmos padrões por meio de `package.json#openclaw.channel.commands` junto com seus outros metadados de catálogo de canal pertencentes ao pacote.

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

| Campo         | Tipo                     | O que significa                                                                        |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema para `channels.<id>`. Obrigatório para cada entrada declarada de configuração de canal. |
| `uiHints`     | `Record<string, object>` | Rótulos/placeholders/dicas de sensibilidade opcionais de UI para essa seção de configuração de canal. |
| `label`       | `string`                 | Rótulo do canal mesclado ao seletor e às superfícies de inspeção quando os metadados de runtime ainda não estão prontos. |
| `description` | `string`                 | Descrição curta do canal para superfícies de inspeção e catálogo.                      |
| `commands`    | `object`                 | Padrões automáticos estáticos de comando nativo e skill nativa para verificações de configuração pré-runtime. |
| `preferOver`  | `string[]`               | IDs de Plugins legados ou de menor prioridade que este canal deve superar em superfícies de seleção. |

### Substituindo outro Plugin de canal

Use `preferOver` quando seu Plugin for o dono preferido de um id de canal que outro Plugin também pode fornecer. Casos comuns são um id de Plugin renomeado, um Plugin independente que substitui um Plugin empacotado, ou um fork mantido que preserva o mesmo id de canal para compatibilidade de configuração.

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

Quando `channels.chat` está configurado, o OpenClaw considera tanto o id do canal quanto o id do Plugin preferido. Se o Plugin de menor prioridade foi selecionado apenas porque é empacotado ou habilitado por padrão, o OpenClaw o desabilita na configuração efetiva de runtime para que um Plugin seja dono do canal e de suas ferramentas. A seleção explícita do usuário ainda prevalece: se o usuário habilitar explicitamente ambos os Plugins, o OpenClaw preserva essa escolha e relata diagnósticos de canal/ferramenta duplicados em vez de alterar silenciosamente o conjunto de Plugins solicitado.

Mantenha `preferOver` limitado a ids de Plugins que realmente podem fornecer o mesmo canal. Ele não é um campo geral de prioridade e não renomeia chaves de configuração de usuário.

## referência de modelSupport

Use `modelSupport` quando o OpenClaw deve inferir seu Plugin de provedor a partir de ids abreviados de modelo como `gpt-5.5` ou `claude-sonnet-4.6` antes do carregamento do runtime do Plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

O OpenClaw aplica esta precedência:

- refs explícitas `provider/model` usam os metadados de manifesto `providers` do dono
- `modelPatterns` têm precedência sobre `modelPrefixes`
- se um Plugin não empacotado e um Plugin empacotado corresponderem, o Plugin não empacotado vence
- ambiguidades restantes são ignoradas até que o usuário ou a configuração especifique um provedor

Campos:

| Campo           | Tipo       | O que significa                                                                |
| --------------- | ---------- | ------------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | Prefixos comparados com `startsWith` contra ids abreviados de modelo.          |
| `modelPatterns` | `string[]` | Fontes de regex comparadas contra ids abreviados de modelo após a remoção do sufixo de perfil. |

## referência de modelCatalog

Use `modelCatalog` quando o OpenClaw deve conhecer metadados de modelos do provedor antes de carregar o runtime do Plugin. Esta é a fonte pertencente ao manifesto para linhas fixas de catálogo, aliases de provedor, regras de supressão e modo de descoberta. A atualização em runtime ainda pertence ao código de runtime do provedor, mas o manifesto informa ao core quando o runtime é necessário.

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

| Campo          | Tipo                                                     | O que significa                                                                                           |
| -------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Linhas de catálogo para ids de provedores pertencentes a este Plugin. As chaves também devem aparecer em `providers` no nível superior. |
| `aliases`      | `Record<string, object>`                                 | Aliases de provedor que devem resolver para um provedor pertencente ao Plugin para planejamento de catálogo ou supressão. |
| `suppressions` | `object[]`                                               | Linhas de modelo de outra fonte que este Plugin suprime por um motivo específico do provedor.             |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Se o catálogo do provedor pode ser lido a partir dos metadados do manifesto, atualizado no cache ou requer runtime. |

`aliases` participa da busca de propriedade de provedor para planejamento de catálogo de modelos. Os destinos de alias devem ser provedores de nível superior pertencentes ao mesmo Plugin. Quando uma lista filtrada por provedor usa um alias, o OpenClaw pode ler o manifesto do dono e aplicar substituições de API/URL base do alias sem carregar o runtime do provedor.
Aliases não expandem listagens de catálogo não filtradas; listas amplas emitem apenas as linhas do provedor canônico do dono.

`suppressions` substitui o antigo hook de runtime de provedor `suppressBuiltInModel`. As entradas de supressão são respeitadas apenas quando o provedor pertence ao Plugin ou é declarado como uma chave `modelCatalog.aliases` que aponta para um provedor pertencente ao Plugin. Hooks de supressão de runtime não são mais chamados durante a resolução de modelos.

Campos do provedor:

| Campo     | Tipo                     | O que significa                                                       |
| --------- | ------------------------ | --------------------------------------------------------------------- |
| `baseUrl` | `string`                 | URL base padrão opcional para modelos neste catálogo de provedor.     |
| `api`     | `ModelApi`               | Adaptador de API padrão opcional para modelos neste catálogo de provedor. |
| `headers` | `Record<string, string>` | Headers estáticos opcionais que se aplicam a este catálogo de provedor. |
| `models`  | `object[]`               | Linhas de modelo obrigatórias. Linhas sem um `id` são ignoradas.      |

Campos do modelo:

| Campo           | Tipo                                                           | O que significa                                                               |
| --------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `id`            | `string`                                                       | ID de modelo local ao provedor, sem o prefixo `provider/`.                    |
| `name`          | `string`                                                       | Nome de exibição opcional.                                                    |
| `api`           | `ModelApi`                                                     | Substituição opcional de API por modelo.                                      |
| `baseUrl`       | `string`                                                       | Substituição opcional de URL base por modelo.                                 |
| `headers`       | `Record<string, string>`                                       | Cabeçalhos estáticos opcionais por modelo.                                    |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalidades aceitas pelo modelo.                                              |
| `reasoning`     | `boolean`                                                      | Se o modelo expõe comportamento de raciocínio.                                |
| `contextWindow` | `number`                                                       | Janela de contexto nativa do provedor.                                        |
| `contextTokens` | `number`                                                       | Limite efetivo opcional de contexto em runtime quando diferente de `contextWindow`. |
| `maxTokens`     | `number`                                                       | Máximo de tokens de saída quando conhecido.                                   |
| `cost`          | `object`                                                       | Preço opcional em USD por milhão de tokens, incluindo `tieredPricing` opcional. |
| `compat`        | `object`                                                       | Flags opcionais de compatibilidade correspondentes à compatibilidade da configuração de modelo do OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Status da listagem. Suprima apenas quando a linha não deve aparecer de forma alguma. |
| `statusReason`  | `string`                                                       | Motivo opcional mostrado com status não disponível.                           |
| `replaces`      | `string[]`                                                     | IDs de modelo locais ao provedor mais antigos que este modelo substitui.      |
| `replacedBy`    | `string`                                                       | ID do modelo local ao provedor substituto para linhas obsoletas.              |
| `tags`          | `string[]`                                                     | Tags estáveis usadas por seletores e filtros.                                 |

Campos de supressão:

| Campo                      | Tipo       | O que significa                                                                                             |
| -------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | ID do provedor para a linha upstream a suprimir. Deve pertencer a este plugin ou ser declarado como alias próprio. |
| `model`                    | `string`   | ID de modelo local ao provedor a suprimir.                                                                  |
| `reason`                   | `string`   | Mensagem opcional mostrada quando a linha suprimida é solicitada diretamente.                               |
| `when.baseUrlHosts`        | `string[]` | Lista opcional de hosts efetivos de URL base do provedor exigidos antes que a supressão se aplique.         |
| `when.providerConfigApiIn` | `string[]` | Lista opcional de valores exatos de `api` da configuração do provedor exigidos antes que a supressão se aplique. |

Não coloque dados apenas de runtime em `modelCatalog`. Use `static` somente quando as linhas de manifesto
forem completas o bastante para que a lista filtrada por provedor e as superfícies de seleção possam ignorar
a descoberta de registry/runtime. Use `refreshable` quando as linhas de manifesto forem sementes ou complementos
listáveis úteis, mas uma atualização/cache puder adicionar mais linhas posteriormente;
linhas refreshable não são autoritativas por si só. Use `runtime` quando o OpenClaw
precisar carregar o runtime do provedor para conhecer a lista.

## referência de modelIdNormalization

Use `modelIdNormalization` para limpeza barata de IDs de modelo pertencente ao provedor que deve
acontecer antes que o runtime do provedor carregue. Isso mantém aliases como nomes curtos de modelo,
IDs legados locais ao provedor e regras de prefixo de proxy no manifesto do plugin proprietário,
em vez de nas tabelas centrais de seleção de modelo.

```json
{
  "providers": ["anthropic", "openrouter"],
  "modelIdNormalization": {
    "providers": {
      "anthropic": {
        "aliases": {
          "sonnet-4.6": "claude-sonnet-4-6"
        }
      },
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  }
}
```

Campos do provedor:

| Campo                                | Tipo                    | O que significa                                                                             |
| ------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Aliases exatos de ID de modelo sem diferenciar maiúsculas de minúsculas. Os valores são retornados como escritos. |
| `stripPrefixes`                      | `string[]`              | Prefixos a remover antes da busca de alias, útil para duplicação legada de provedor/modelo. |
| `prefixWhenBare`                     | `string`                | Prefixo a adicionar quando o ID de modelo normalizado ainda não contém `/`.                 |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Regras condicionais de prefixo de ID simples após a busca de alias, indexadas por `modelPrefix` e `prefix`. |

## referência de providerEndpoints

Use `providerEndpoints` para classificação de endpoint que a política genérica de requisição
deve conhecer antes que o runtime do provedor carregue. O núcleo ainda define o significado de cada
`endpointClass`; os manifestos de plugin definem os metadados de host e URL base.

Campos de endpoint:

| Campo                          | Tipo       | O que significa                                                                                  |
| ------------------------------ | ---------- | ------------------------------------------------------------------------------------------------ |
| `endpointClass`                | `string`   | Classe de endpoint conhecida pelo núcleo, como `openrouter`, `moonshot-native` ou `google-vertex`. |
| `hosts`                        | `string[]` | Nomes de host exatos que mapeiam para a classe de endpoint.                                      |
| `hostSuffixes`                 | `string[]` | Sufixos de host que mapeiam para a classe de endpoint. Prefixe com `.` para correspondência apenas de sufixo de domínio. |
| `baseUrls`                     | `string[]` | URLs base HTTP(S) normalizadas exatas que mapeiam para a classe de endpoint.                     |
| `googleVertexRegion`           | `string`   | Região estática do Google Vertex para hosts globais exatos.                                     |
| `googleVertexRegionHostSuffix` | `string`   | Sufixo a remover dos hosts correspondentes para expor o prefixo de região do Google Vertex.      |

## referência de providerRequest

Use `providerRequest` para metadados baratos de compatibilidade de requisição de que a política genérica
de requisição precisa sem carregar o runtime do provedor. Mantenha a reescrita de payload específica de comportamento
em hooks de runtime do provedor ou em helpers compartilhados da família de provedores.

```json
{
  "providers": ["vllm"],
  "providerRequest": {
    "providers": {
      "vllm": {
        "family": "vllm",
        "openAICompletions": {
          "supportsStreamingUsage": true
        }
      }
    }
  }
}
```

Campos do provedor:

| Campo                 | Tipo         | O que significa                                                                          |
| --------------------- | ------------ | ---------------------------------------------------------------------------------------- |
| `family`              | `string`     | Rótulo da família do provedor usado por decisões genéricas de compatibilidade de requisição e diagnósticos. |
| `compatibilityFamily` | `"moonshot"` | Grupo opcional de compatibilidade da família do provedor para helpers compartilhados de requisição. |
| `openAICompletions`   | `object`     | Flags de requisição de completions compatíveis com OpenAI, atualmente `supportsStreamingUsage`. |

## referência de modelPricing

Use `modelPricing` quando um provedor precisa de comportamento de precificação do plano de controle antes que
o runtime carregue. O cache de preços do Gateway lê estes metadados sem importar
código de runtime do provedor.

```json
{
  "providers": ["ollama", "openrouter"],
  "modelPricing": {
    "providers": {
      "ollama": {
        "external": false
      },
      "openrouter": {
        "openRouter": {
          "passthroughProviderModel": true
        },
        "liteLLM": false
      }
    }
  }
}
```

Campos do provedor:

| Campo        | Tipo              | O que significa                                                                                      |
| ------------ | ----------------- | ---------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Defina como `false` para provedores locais/auto-hospedados que nunca devem buscar preços do OpenRouter ou LiteLLM. |
| `openRouter` | `false \| object` | Mapeamento de consulta de preços do OpenRouter. `false` desativa a consulta ao OpenRouter para este provedor. |
| `liteLLM`    | `false \| object` | Mapeamento de consulta de preços do LiteLLM. `false` desativa a consulta ao LiteLLM para este provedor. |

Campos de origem:

| Campo                      | Tipo               | O que significa                                                                                                        |
| -------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | ID do provedor no catálogo externo quando difere do ID do provedor no OpenClaw, por exemplo `z-ai` para um provedor `zai`. |
| `passthroughProviderModel` | `boolean`          | Trate IDs de modelo que contêm barra como referências aninhadas de provedor/modelo, útil para provedores de proxy como OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Variantes extras de ID de modelo do catálogo externo. `version-dots` tenta IDs de versão com pontos, como `claude-opus-4.6`. |

### Índice de Provedores do OpenClaw

O Índice de Provedores do OpenClaw é composto por metadados de preview pertencentes ao OpenClaw para provedores
cujos plugins talvez ainda não estejam instalados. Ele não faz parte de um manifesto de plugin.
Os manifestos de plugin continuam sendo a autoridade dos plugins instalados. O Índice de Provedores é
o contrato interno de fallback que futuras superfícies de seleção de modelo de provedores instaláveis e pré-instalação
consumirão quando um plugin de provedor não estiver instalado.

Ordem de autoridade do catálogo:

1. Configuração do usuário.
2. `modelCatalog` do manifesto do plugin instalado.
3. Cache do catálogo de modelos a partir de atualização explícita.
4. Linhas de preview do Índice de Provedores do OpenClaw.

O Índice de Provedores não deve conter segredos, estado habilitado, hooks de runtime ou
dados de modelo específicos de contas ao vivo. Seus catálogos de pré-visualização usam o mesmo
formato de linha de provedor `modelCatalog` dos manifestos de plugin, mas devem permanecer limitados
a metadados de exibição estáveis, a menos que campos do adaptador de runtime como `api`,
`baseUrl`, preços ou flags de compatibilidade sejam mantidos intencionalmente alinhados com
o manifesto do plugin instalado. Provedores com descoberta ao vivo de `/models` devem
gravar linhas atualizadas por meio do caminho explícito de cache do catálogo de modelos, em vez de
fazer a listagem normal ou o onboarding chamar APIs de provedores.

As entradas do Índice de Provedores também podem carregar metadados de plugin instalável para provedores
cujo plugin saiu do core ou ainda não está instalado. Esses
metadados espelham o padrão do catálogo de canais: nome do pacote, especificação de instalação npm,
integridade esperada e rótulos baratos de escolha de autenticação são suficientes para mostrar uma
opção de configuração instalável. Depois que o plugin é instalado, seu manifesto prevalece e
a entrada do Índice de Provedores é ignorada para esse provedor.

Chaves legadas de capacidade no nível superior estão obsoletas. Use `openclaw doctor --fix` para
mover `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` e `webSearchProviders` para dentro de `contracts`; o carregamento
normal de manifestos não trata mais esses campos de nível superior como propriedade
de capacidade.

## Manifesto versus package.json

Os dois arquivos têm funções diferentes:

| Arquivo                | Use-o para                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Descoberta, validação de config, metadados de escolha de autenticação e dicas de UI que precisam existir antes de o código do plugin rodar |
| `package.json`         | Metadados npm, instalação de dependências e o bloco `openclaw` usado para entrypoints, bloqueio de instalação, setup ou metadados de catálogo |

Se você não tiver certeza de onde um metadado deve ficar, use esta regra:

- se o OpenClaw precisar saber disso antes de carregar o código do plugin, coloque em `openclaw.plugin.json`
- se for sobre empacotamento, arquivos de entrada ou comportamento de instalação npm, coloque em `package.json`

### Campos de package.json que afetam a descoberta

Alguns metadados de plugin pré-runtime vivem intencionalmente em `package.json`, dentro do
bloco `openclaw`, em vez de `openclaw.plugin.json`.

Exemplos importantes:

| Campo                                                             | O que significa                                                                                                                                                                      |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Declara entrypoints nativos de plugin. Deve permanecer dentro do diretório do pacote do plugin.                                                                                      |
| `openclaw.runtimeExtensions`                                      | Declara entrypoints de runtime JavaScript compilados para pacotes instalados. Deve permanecer dentro do diretório do pacote do plugin.                                               |
| `openclaw.setupEntry`                                             | Entrypoint leve apenas de setup, usado durante onboarding, inicialização adiada de canal e descoberta somente leitura de status de canal/SecretRef. Deve permanecer dentro do diretório do pacote do plugin. |
| `openclaw.runtimeSetupEntry`                                      | Declara o entrypoint de setup JavaScript compilado para pacotes instalados. Deve permanecer dentro do diretório do pacote do plugin.                                                 |
| `openclaw.channel`                                                | Metadados baratos de catálogo de canais, como rótulos, caminhos de documentação, aliases e texto de seleção.                                                                         |
| `openclaw.channel.commands`                                       | Metadados estáticos de comando nativo e padrão automático de skill nativa usados por superfícies de config, auditoria e lista de comandos antes do carregamento do runtime do canal. |
| `openclaw.channel.configuredState`                                | Metadados leves de verificação de estado configurado que conseguem responder "a configuração apenas por env já existe?" sem carregar o runtime completo do canal.                   |
| `openclaw.channel.persistedAuthState`                             | Metadados leves de verificação de autenticação persistida que conseguem responder "já há algo conectado?" sem carregar o runtime completo do canal.                                  |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Dicas de instalação/atualização para plugins empacotados e publicados externamente.                                                                                                  |
| `openclaw.install.defaultChoice`                                  | Caminho de instalação preferido quando várias fontes de instalação estão disponíveis.                                                                                                |
| `openclaw.install.minHostVersion`                                 | Versão mínima compatível do host OpenClaw, usando um piso semver como `>=2026.3.22`.                                                                                                |
| `openclaw.install.expectedIntegrity`                              | String de integridade esperada do dist npm, como `sha512-...`; fluxos de instalação e atualização verificam o artefato baixado contra ela.                                          |
| `openclaw.install.allowInvalidConfigRecovery`                     | Permite um caminho restrito de recuperação por reinstalação de plugin empacotado quando a config é inválida.                                                                         |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permite que superfícies de canal apenas de setup carreguem antes do plugin completo do canal durante a inicialização.                                                                |

Os metadados do manifesto decidem quais escolhas de provedor/canal/setup aparecem no
onboarding antes que o runtime carregue. `package.json#openclaw.install` informa ao
onboarding como buscar ou habilitar esse plugin quando o usuário escolhe uma dessas
opções. Não mova dicas de instalação para `openclaw.plugin.json`.

`openclaw.install.minHostVersion` é aplicado durante a instalação e o carregamento do
registro de manifestos. Valores inválidos são rejeitados; valores mais novos, mas válidos, ignoram o
plugin em hosts mais antigos.

O pinning de versão npm exata já vive em `npmSpec`, por exemplo
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Entradas oficiais de catálogo externo
devem combinar especificações exatas com `expectedIntegrity` para que fluxos de atualização falhem
fechados se o artefato npm baixado não corresponder mais à versão fixada.
O onboarding interativo ainda oferece especificações npm de registros confiáveis, incluindo nomes
de pacote simples e dist-tags, por compatibilidade. Diagnósticos de catálogo conseguem
distinguir fontes exatas, flutuantes, fixadas por integridade, sem integridade, com incompatibilidade
de nome de pacote e com escolha padrão inválida. Eles também avisam quando
`expectedIntegrity` está presente, mas não há nenhuma fonte npm válida que ela possa fixar.
Quando `expectedIntegrity` está presente,
fluxos de instalação/atualização a aplicam; quando ela é omitida, a resolução do registro é
registrada sem um pin de integridade.

Plugins de canal devem fornecer `openclaw.setupEntry` quando varreduras de status, lista de canais
ou SecretRef precisarem identificar contas configuradas sem carregar o runtime completo.
A entrada de setup deve expor metadados de canal e adaptadores seguros para setup de config,
status e segredos; mantenha clientes de rede, listeners de gateway e
runtimes de transporte no entrypoint principal da extensão.

Campos de entrypoint de runtime não substituem verificações de limite de pacote para campos de
entrypoint de origem. Por exemplo, `openclaw.runtimeExtensions` não consegue tornar carregável um
caminho `openclaw.extensions` que escape do pacote.

`openclaw.install.allowInvalidConfigRecovery` é intencionalmente restrito. Ele não
torna instaláveis configs quebradas arbitrárias. Hoje ele só permite que fluxos de instalação
se recuperem de falhas específicas e obsoletas de atualização de plugin empacotado, como um
caminho ausente de plugin empacotado ou uma entrada `channels.<id>` obsoleta para esse mesmo
plugin empacotado. Erros de config não relacionados ainda bloqueiam a instalação e enviam operadores
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

Use-o quando fluxos de setup, doctor, status ou presença somente leitura precisarem de uma sondagem
barata de autenticação sim/não antes que o plugin completo do canal carregue. Estado de autenticação persistido
não é estado de canal configurado: não use esses metadados para habilitar plugins automaticamente,
reparar dependências de runtime ou decidir se um runtime de canal deve carregar.
A exportação de destino deve ser uma função pequena que lê apenas estado persistido; não a
encaminhe pelo barrel completo do runtime do canal.

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

Use-o quando um canal consegue responder estado configurado a partir de env ou de outras
entradas pequenas que não são de runtime. Se a verificação precisar de resolução completa de config ou do runtime
real do canal, mantenha essa lógica no hook `config.hasConfiguredState`
do plugin.

## Precedência de descoberta (ids de plugin duplicados)

O OpenClaw descobre plugins a partir de várias raízes (empacotados, instalação global, workspace, caminhos selecionados explicitamente na config). Se duas descobertas compartilharem o mesmo `id`, apenas o manifesto de **maior precedência** é mantido; duplicatas de menor precedência são descartadas em vez de carregadas junto com ele.

Precedência, da maior para a menor:

1. **Selecionado pela config** — um caminho explicitamente fixado em `plugins.entries.<id>`
2. **Empacotado** — plugins distribuídos com o OpenClaw
3. **Instalação global** — plugins instalados na raiz global de plugins do OpenClaw
4. **Workspace** — plugins descobertos em relação ao workspace atual

Implicações:

- Uma cópia bifurcada ou obsoleta de um plugin empacotado dentro do workspace não vai sombrear o build empacotado.
- Para de fato substituir um plugin empacotado por um local, fixe-o via `plugins.entries.<id>` para que ele vença por precedência em vez de depender da descoberta do workspace.
- Descartes de duplicatas são registrados em log para que Doctor e diagnósticos de inicialização possam apontar para a cópia descartada.

## Requisitos de JSON Schema

- **Todo plugin deve distribuir um JSON Schema**, mesmo que não aceite config.
- Um schema vazio é aceitável (por exemplo, `{ "type": "object", "additionalProperties": false }`).
- Schemas são validados no momento de leitura/gravação de config, não em runtime.

## Comportamento de validação

- Chaves `channels.*` desconhecidas são **erros**, a menos que o id do canal seja declarado por
  um manifesto de plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*`
  devem referenciar ids de plugin **detectáveis**. Ids desconhecidos são **erros**.
- Se um plugin estiver instalado, mas tiver um manifesto ou esquema quebrado ou ausente,
  a validação falhará e o Doctor reportará o erro do plugin.
- Se a configuração do plugin existir, mas o plugin estiver **desabilitado**, a configuração será mantida e
  um **aviso** será exibido no Doctor + logs.

Consulte a [referência de configuração](/pt-BR/gateway/configuration) para o esquema `plugins.*` completo.

## Observações

- O manifesto é **obrigatório para plugins nativos do OpenClaw**, incluindo carregamentos do sistema de arquivos local. O runtime ainda carrega o módulo do plugin separadamente; o manifesto serve apenas para descoberta + validação.
- Manifestos nativos são analisados com JSON5, portanto comentários, vírgulas finais e chaves sem aspas são aceitos, desde que o valor final ainda seja um objeto.
- Somente campos de manifesto documentados são lidos pelo carregador de manifesto. Evite chaves personalizadas de nível superior.
- `channels`, `providers`, `cliBackends` e `skills` podem ser omitidos quando um plugin não precisar deles.
- `providerDiscoveryEntry` deve permanecer leve e não deve importar código amplo de runtime; use-o para metadados estáticos do catálogo de provedores ou descritores de descoberta restritos, não para execução em tempo de requisição.
- Tipos exclusivos de plugin são selecionados por meio de `plugins.slots.*`: `kind: "memory"` via `plugins.slots.memory`, `kind: "context-engine"` via `plugins.slots.contextEngine` (padrão `legacy`).
- Declare o tipo exclusivo de plugin neste manifesto. `OpenClawPluginDefinition.kind` da entrada de runtime está obsoleto e permanece apenas como fallback de compatibilidade para plugins mais antigos.
- Metadados de variáveis de ambiente (`setup.providers[].envVars`, `providerAuthEnvVars` obsoleto e `channelEnvVars`) são apenas declarativos. Status, auditoria, validação de entrega por cron e outras superfícies somente leitura ainda aplicam a confiança do plugin e a política de ativação efetiva antes de tratar uma variável de ambiente como configurada.
- Para metadados do assistente de runtime que exigem código do provedor, consulte [hooks de runtime do provedor](/pt-BR/plugins/architecture-internals#provider-runtime-hooks).
- Se o seu plugin depender de módulos nativos, documente as etapas de build e quaisquer requisitos de lista de permissões do gerenciador de pacotes (por exemplo, `allow-build-scripts` do pnpm + `pnpm rebuild <package>`).

## Relacionados

<CardGroup cols={3}>
  <Card title="Criando plugins" href="/pt-BR/plugins/building-plugins" icon="rocket">
    Primeiros passos com plugins.
  </Card>
  <Card title="Arquitetura do Plugin" href="/pt-BR/plugins/architecture" icon="diagram-project">
    Arquitetura interna e modelo de capacidades.
  </Card>
  <Card title="Visão geral do SDK" href="/pt-BR/plugins/sdk-overview" icon="book">
    Referência do SDK de Plugin e importações de subcaminhos.
  </Card>
</CardGroup>
