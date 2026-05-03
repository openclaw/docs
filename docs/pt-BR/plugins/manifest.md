---
read_when:
    - Você está criando um Plugin do OpenClaw
    - Você precisa disponibilizar um esquema de configuração de Plugin ou depurar erros de validação de Plugin
summary: Requisitos de manifesto do Plugin + esquema JSON (validação rigorosa de configuração)
title: Manifesto do Plugin
x-i18n:
    generated_at: "2026-05-03T21:36:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 13adec905bd86407b9aa911d66e68299fec348bd74579a6a32a2fd5e19b22b8c
    source_path: plugins/manifest.md
    workflow: 16
---

Esta página é somente para o **manifesto de Plugin nativo do OpenClaw**.

Para layouts de pacotes compatíveis, consulte [Pacotes de Plugin](/pt-BR/plugins/bundles).

Formatos de pacote compatíveis usam arquivos de manifesto diferentes:

- Pacote Codex: `.codex-plugin/plugin.json`
- Pacote Claude: `.claude-plugin/plugin.json` ou o layout padrão de componentes Claude
  sem manifesto
- Pacote Cursor: `.cursor-plugin/plugin.json`

O OpenClaw também detecta automaticamente esses layouts de pacote, mas eles não são validados
contra o esquema `openclaw.plugin.json` descrito aqui.

Para pacotes compatíveis, o OpenClaw atualmente lê metadados do pacote mais raízes de
Skills declaradas, raízes de comandos Claude, padrões de `settings.json` do pacote Claude,
padrões de LSP do pacote Claude e pacotes de hooks compatíveis quando o layout corresponde
às expectativas de tempo de execução do OpenClaw.

Todo Plugin nativo do OpenClaw **deve** distribuir um arquivo `openclaw.plugin.json` na
**raiz do Plugin**. O OpenClaw usa esse manifesto para validar a configuração
**sem executar código do Plugin**. Manifestos ausentes ou inválidos são tratados como
erros de Plugin e bloqueiam a validação da configuração.

Consulte o guia completo do sistema de Plugins: [Plugins](/pt-BR/tools/plugin).
Para o modelo de capacidades nativo e as orientações atuais de compatibilidade externa:
[Modelo de capacidades](/pt-BR/plugins/architecture#public-capability-model).

## O que este arquivo faz

`openclaw.plugin.json` são os metadados que o OpenClaw lê **antes de carregar seu
código de Plugin**. Tudo abaixo deve ser barato o suficiente para inspecionar sem inicializar
o tempo de execução do Plugin.

**Use-o para:**

- identidade do Plugin, validação de configuração e dicas de interface de configuração
- metadados de autenticação, onboarding e configuração (alias, ativação automática, variáveis de ambiente de provedor, escolhas de autenticação)
- dicas de ativação para superfícies do plano de controle
- propriedade abreviada de família de modelos
- snapshots estáticos de propriedade de capacidades (`contracts`)
- metadados do executor de QA que o host compartilhado `openclaw qa` pode inspecionar
- metadados de configuração específicos do canal mesclados ao catálogo e às superfícies de validação

**Não o use para:** registrar comportamento de tempo de execução, declarar pontos de entrada de código
ou metadados de instalação npm. Eles pertencem ao seu código de Plugin e ao `package.json`.

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

## Referência dos campos de nível superior

| Campo                                | Obrigatório | Tipo                             | O que significa                                                                                                                                                                                                                       |
| ------------------------------------ | ----------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Sim         | `string`                         | ID canônico do plugin. Este é o ID usado em `plugins.entries.<id>`.                                                                                                                                                                   |
| `configSchema`                       | Sim         | `object`                         | JSON Schema inline para a configuração deste plugin.                                                                                                                                                                                  |
| `enabledByDefault`                   | Não         | `true`                           | Marca um plugin incluído como habilitado por padrão. Omita-o, ou defina qualquer valor diferente de `true`, para deixar o plugin desabilitado por padrão.                                                                              |
| `enabledByDefaultOnPlatforms`        | Não         | `string[]`                       | Marca um plugin incluído como habilitado por padrão apenas nas plataformas Node.js listadas, por exemplo `["darwin"]`. A configuração explícita ainda prevalece.                                                                       |
| `legacyPluginIds`                    | Não         | `string[]`                       | IDs legados que são normalizados para este ID canônico do plugin.                                                                                                                                                                      |
| `autoEnableWhenConfiguredProviders`  | Não         | `string[]`                       | IDs de provedores que devem habilitar automaticamente este plugin quando autenticação, configuração ou referências de modelo os mencionarem.                                                                                            |
| `kind`                               | Não         | `"memory"` \| `"context-engine"` | Declara um tipo exclusivo de plugin usado por `plugins.slots.*`.                                                                                                                                                                      |
| `channels`                           | Não         | `string[]`                       | IDs de canais pertencentes a este plugin. Usado para descoberta e validação de configuração.                                                                                                                                          |
| `providers`                          | Não         | `string[]`                       | IDs de provedores pertencentes a este plugin.                                                                                                                                                                                         |
| `providerDiscoveryEntry`             | Não         | `string`                         | Caminho leve do módulo de descoberta de provedores, relativo à raiz do plugin, para metadados de catálogo de provedores com escopo de manifesto que podem ser carregados sem ativar o runtime completo do plugin.                     |
| `modelSupport`                       | Não         | `object`                         | Metadados abreviados de famílias de modelos pertencentes ao manifesto, usados para carregar automaticamente o plugin antes do runtime.                                                                                                  |
| `modelCatalog`                       | Não         | `object`                         | Metadados declarativos de catálogo de modelos para provedores pertencentes a este plugin. Este é o contrato do plano de controle para listagem futura somente leitura, integração, seletores de modelo, aliases e supressão sem carregar o runtime do plugin. |
| `modelPricing`                       | Não         | `object`                         | Política de consulta de preços externos pertencente ao provedor. Use-a para excluir provedores locais/auto-hospedados de catálogos de preços remotos ou mapear referências de provedores para IDs de catálogo OpenRouter/LiteLLM sem codificar rigidamente IDs de provedores no core. |
| `modelIdNormalization`               | Não         | `object`                         | Limpeza de aliases/prefixos de ID de modelo pertencente ao provedor que deve ser executada antes do carregamento do runtime do provedor.                                                                                                |
| `providerEndpoints`                  | Não         | `object[]`                       | Metadados de host/baseUrl de endpoints pertencentes ao manifesto para rotas de provedores que o core deve classificar antes do carregamento do runtime do provedor.                                                                    |
| `providerRequest`                    | Não         | `object`                         | Metadados leves de família de provedor e compatibilidade de requisição usados pela política genérica de requisições antes do carregamento do runtime do provedor.                                                                      |
| `cliBackends`                        | Não         | `string[]`                       | IDs de backends de inferência da CLI pertencentes a este plugin. Usado para autoativação na inicialização a partir de referências explícitas de configuração.                                                                          |
| `syntheticAuthRefs`                  | Não         | `string[]`                       | Referências de provedor ou backend da CLI cujo hook de autenticação sintética pertencente ao plugin deve ser sondado durante a descoberta fria de modelos antes do carregamento do runtime.                                           |
| `nonSecretAuthMarkers`               | Não         | `string[]`                       | Valores de chave de API de placeholder pertencentes ao plugin incluído que representam estado de credencial local, OAuth ou ambiente que não é secreto.                                                                                |
| `commandAliases`                     | Não         | `object[]`                       | Nomes de comandos pertencentes a este plugin que devem produzir diagnósticos de configuração e CLI cientes do plugin antes do carregamento do runtime.                                                                                 |
| `providerAuthEnvVars`                | Não         | `Record<string, string[]>`       | Metadados de compatibilidade obsoletos de env para consulta de autenticação/status de provedores. Prefira `setup.providers[].envVars` para novos plugins; o OpenClaw ainda lê isto durante a janela de obsolescência.                  |
| `providerAuthAliases`                | Não         | `Record<string, string>`         | IDs de provedores que devem reutilizar outro ID de provedor para consulta de autenticação, por exemplo um provedor de codificação que compartilha a chave de API e os perfis de autenticação do provedor base.                         |
| `channelEnvVars`                     | Não         | `Record<string, string[]>`       | Metadados leves de env de canal que o OpenClaw pode inspecionar sem carregar código do plugin. Use isto para configuração de canal orientada por env ou superfícies de autenticação que auxiliares genéricos de inicialização/configuração devem ver. |
| `providerAuthChoices`                | Não         | `object[]`                       | Metadados leves de opções de autenticação para seletores de integração, resolução de provedor preferido e fiação simples de flags da CLI.                                                                                              |
| `activation`                         | Não         | `object`                         | Metadados leves do planejador de ativação para carregamento acionado por inicialização, provedor, comando, canal, rota e capacidade. Apenas metadados; o runtime do plugin ainda possui o comportamento real.                          |
| `setup`                              | Não         | `object`                         | Descritores leves de configuração/integração que superfícies de descoberta e configuração podem inspecionar sem carregar o runtime do plugin.                                                                                         |
| `qaRunners`                          | Não         | `object[]`                       | Descritores leves de runners de QA usados pelo host compartilhado `openclaw qa` antes do carregamento do runtime do plugin.                                                                                                          |
| `contracts`                          | Não         | `object`                         | Snapshot estático de propriedade de capacidades para hooks externos de autenticação, fala, transcrição em tempo real, voz em tempo real, compreensão de mídia, geração de imagens, geração de música, geração de vídeo, web-fetch, pesquisa na web e propriedade de ferramentas. |
| `mediaUnderstandingProviderMetadata` | Não         | `Record<string, object>`         | Padrões leves de compreensão de mídia para IDs de provedores declarados em `contracts.mediaUnderstandingProviders`.                                                                                                                   |
| `imageGenerationProviderMetadata`    | Não         | `Record<string, object>`         | Metadados leves de autenticação de geração de imagens para IDs de provedores declarados em `contracts.imageGenerationProviders`, incluindo aliases de autenticação pertencentes ao provedor e proteções de URL base.                  |
| `videoGenerationProviderMetadata`    | Não         | `Record<string, object>`         | Metadados leves de autenticação de geração de vídeo para IDs de provedores declarados em `contracts.videoGenerationProviders`, incluindo aliases de autenticação pertencentes ao provedor e proteções de URL base.                    |
| `musicGenerationProviderMetadata`    | Não         | `Record<string, object>`         | Metadados leves de autenticação de geração de música para IDs de provedores declarados em `contracts.musicGenerationProviders`, incluindo aliases de autenticação pertencentes ao provedor e proteções de URL base.                   |
| `toolMetadata`                       | Não         | `Record<string, object>`         | Metadados leves de disponibilidade para ferramentas pertencentes ao plugin declaradas em `contracts.tools`. Use-os quando uma ferramenta não deve carregar o runtime a menos que existam evidências de configuração, env ou autenticação. |
| `channelConfigs`                     | Não         | `Record<string, object>`         | Metadados de configuração de canal pertencentes ao manifesto mesclados em superfícies de descoberta e validação antes do carregamento do runtime.                                                                                      |
| `skills`                             | Não         | `string[]`                       | Diretórios de Skills a carregar, relativos à raiz do plugin.                                                                                                                                                                         |
| `name`                               | Não      | `string`                         | Nome do Plugin legível por humanos.                                                                                                                                                                                                 |
| `description`                        | Não      | `string`                         | Resumo curto exibido nas superfícies de Plugin.                                                                                                                                                                                     |
| `version`                            | Não      | `string`                         | Versão informativa do Plugin.                                                                                                                                                                                                       |
| `uiHints`                            | Não      | `Record<string, object>`         | Rótulos de UI, placeholders e dicas de sensibilidade para campos de configuração.                                                                                                                                                    |

## Referência de metadados de provedores de geração

Os campos de metadados de provedores de geração descrevem sinais estáticos de autenticação para
provedores declarados na lista `contracts.*GenerationProviders` correspondente.
O OpenClaw lê esses campos antes que o tempo de execução do provedor seja carregado, para que as ferramentas centrais possam
decidir se um provedor de geração está disponível sem importar todo
Plugin de provedor.

Use esses campos apenas para fatos declarativos e baratos. Transporte, transformações de
requisição, renovação de token, validação de credenciais e o comportamento real de geração
permanecem no tempo de execução do Plugin.

```json
{
  "contracts": {
    "imageGenerationProviders": ["example-image"]
  },
  "imageGenerationProviderMetadata": {
    "example-image": {
      "aliases": ["example-image-oauth"],
      "authProviders": ["example-image"],
      "configSignals": [
        {
          "rootPath": "plugins.entries.example-image.config",
          "overlayPath": "image",
          "mode": {
            "path": "mode",
            "default": "local",
            "allowed": ["local"]
          },
          "requiredAny": ["workflow", "workflowPath"],
          "required": ["promptNodeId"]
        }
      ],
      "authSignals": [
        {
          "provider": "example-image"
        },
        {
          "provider": "example-image-oauth",
          "providerBaseUrl": {
            "provider": "example-image",
            "defaultBaseUrl": "https://api.example.com/v1",
            "allowedBaseUrls": ["https://api.example.com/v1"]
          }
        }
      ]
    }
  }
}
```

Cada entrada de metadados aceita:

| Campo           | Obrigatório | Tipo       | O que significa                                                                                                                       |
| --------------- | ----------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | Não         | `string[]` | IDs adicionais de provedor que devem contar como aliases estáticos de autenticação para o provedor de geração.                        |
| `authProviders` | Não         | `string[]` | IDs de provedor cujos perfis de autenticação configurados devem contar como autenticação para este provedor de geração.               |
| `configSignals` | Não         | `object[]` | Sinais baratos de disponibilidade apenas por configuração para provedores locais ou auto-hospedados que podem ser configurados sem perfis de autenticação ou variáveis de ambiente. |
| `authSignals`   | Não         | `object[]` | Sinais explícitos de autenticação. Quando presentes, eles substituem o conjunto padrão de sinais do ID do provedor, `aliases` e `authProviders`. |

Cada entrada de `configSignals` aceita:

| Campo         | Obrigatório | Tipo       | O que significa                                                                                                                                                                           |
| ------------- | ----------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | Sim         | `string`   | Caminho em pontos para o objeto de configuração pertencente ao Plugin a ser inspecionado, por exemplo `plugins.entries.example.config`.                                                   |
| `overlayPath` | Não         | `string`   | Caminho em pontos dentro da configuração raiz cujo objeto deve se sobrepor ao objeto raiz antes de avaliar o sinal. Use isto para configuração específica de capacidade, como `image`, `video` ou `music`. |
| `required`    | Não         | `string[]` | Caminhos em pontos dentro da configuração efetiva que devem ter valores configurados. Strings não podem estar vazias; objetos e arrays não podem estar vazios.                             |
| `requiredAny` | Não         | `string[]` | Caminhos em pontos dentro da configuração efetiva em que pelo menos um deve ter um valor configurado.                                                                                      |
| `mode`        | Não         | `object`   | Guarda opcional de modo em string dentro da configuração efetiva. Use isto quando a disponibilidade apenas por configuração se aplicar somente a um modo.                                  |

Cada guarda `mode` aceita:

| Campo        | Obrigatório | Tipo       | O que significa                                                                      |
| ------------ | ----------- | ---------- | ------------------------------------------------------------------------------------ |
| `path`       | Não         | `string`   | Caminho em pontos dentro da configuração efetiva. O padrão é `mode`.                 |
| `default`    | Não         | `string`   | Valor de modo a usar quando a configuração omite o caminho.                          |
| `allowed`    | Não         | `string[]` | Se presente, o sinal passa somente quando o modo efetivo é um destes valores.        |
| `disallowed` | Não         | `string[]` | Se presente, o sinal falha quando o modo efetivo é um destes valores.                |

Cada entrada de `authSignals` aceita:

| Campo             | Obrigatório | Tipo     | O que significa                                                                                                                                                                 |
| ----------------- | ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sim         | `string` | ID do provedor a verificar nos perfis de autenticação configurados.                                                                                                             |
| `providerBaseUrl` | Não         | `object` | Guarda opcional que faz o sinal contar somente quando o provedor configurado referenciado usa uma URL base permitida. Use isto quando um alias de autenticação é válido somente para certas APIs. |

Cada guarda `providerBaseUrl` aceita:

| Campo             | Obrigatório | Tipo       | O que significa                                                                                                                                        |
| ----------------- | ----------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`        | Sim         | `string`   | ID de configuração de provedor cujo `baseUrl` deve ser verificado.                                                                                     |
| `defaultBaseUrl`  | Não         | `string`   | URL base a assumir quando a configuração do provedor omite `baseUrl`.                                                                                  |
| `allowedBaseUrls` | Sim         | `string[]` | URLs base permitidas para este sinal de autenticação. O sinal é ignorado quando a URL base configurada ou padrão não corresponde a um destes valores normalizados. |

## Referência de metadados de ferramentas

`toolMetadata` usa os mesmos formatos de `configSignals` e `authSignals` que os
metadados de provedores de geração, indexados pelo nome da ferramenta. `contracts.tools` declara
propriedade. `toolMetadata` declara evidências baratas de disponibilidade para que o OpenClaw possa
evitar importar o tempo de execução de um Plugin apenas para que a factory da ferramenta retorne `null`.

```json
{
  "providerAuthEnvVars": {
    "example": ["EXAMPLE_API_KEY"]
  },
  "contracts": {
    "tools": ["example_search"]
  },
  "toolMetadata": {
    "example_search": {
      "authSignals": [
        {
          "provider": "example"
        }
      ],
      "configSignals": [
        {
          "rootPath": "plugins.entries.example.config",
          "overlayPath": "search",
          "required": ["apiKey"]
        }
      ]
    }
  }
}
```

Se uma ferramenta não tiver `toolMetadata`, o OpenClaw preserva o comportamento existente e
carrega o Plugin proprietário quando o contrato da ferramenta corresponde à política. Para ferramentas
de caminho quente cuja factory depende de autenticação/configuração, autores de Plugin devem declarar
`toolMetadata` em vez de fazer o núcleo importar o tempo de execução para perguntar.

## Referência de providerAuthChoices

Cada entrada de `providerAuthChoices` descreve uma escolha de onboarding ou autenticação.
O OpenClaw lê isto antes que o tempo de execução do provedor seja carregado.
As listas de configuração de provedor usam estas escolhas de manifesto, escolhas de configuração derivadas de descritor
e metadados de catálogo de instalação sem carregar o tempo de execução do provedor.

| Campo                 | Obrigatório | Tipo                                            | O que significa                                                                                            |
| --------------------- | ----------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `provider`            | Sim         | `string`                                        | ID do provedor ao qual esta escolha pertence.                                                              |
| `method`              | Sim         | `string`                                        | ID do método de autenticação para despachar.                                                               |
| `choiceId`            | Sim         | `string`                                        | ID estável de escolha de autenticação usado por fluxos de onboarding e CLI.                                |
| `choiceLabel`         | Não         | `string`                                        | Rótulo voltado ao usuário. Se omitido, o OpenClaw usa `choiceId` como fallback.                            |
| `choiceHint`          | Não         | `string`                                        | Texto curto de ajuda para o seletor.                                                                       |
| `assistantPriority`   | Não         | `number`                                        | Valores menores são ordenados antes em seletores interativos conduzidos por assistente.                    |
| `assistantVisibility` | Não         | `"visible"` \| `"manual-only"`                  | Oculta a escolha dos seletores do assistente, mas ainda permite seleção manual pela CLI.                   |
| `deprecatedChoiceIds` | Não         | `string[]`                                      | IDs de escolha legados que devem redirecionar usuários para esta escolha substituta.                       |
| `groupId`             | Não         | `string`                                        | ID opcional de grupo para agrupar escolhas relacionadas.                                                   |
| `groupLabel`          | Não         | `string`                                        | Rótulo voltado ao usuário para esse grupo.                                                                 |
| `groupHint`           | Não         | `string`                                        | Texto curto de ajuda para o grupo.                                                                         |
| `optionKey`           | Não         | `string`                                        | Chave interna de opção para fluxos simples de autenticação com uma única flag.                             |
| `cliFlag`             | Não         | `string`                                        | Nome da flag da CLI, como `--openrouter-api-key`.                                                          |
| `cliOption`           | Não         | `string`                                        | Formato completo da opção de CLI, como `--openrouter-api-key <key>`.                                       |
| `cliDescription`      | Não         | `string`                                        | Descrição usada na ajuda da CLI.                                                                           |
| `onboardingScopes`    | Não         | `Array<"text-inference" \| "image-generation">` | Em quais superfícies de onboarding esta escolha deve aparecer. Se omitido, o padrão é `["text-inference"]`. |

## Referência de commandAliases

Use `commandAliases` quando um plugin possui um nome de comando de tempo de execução que os usuários podem
colocar por engano em `plugins.allow` ou tentar executar como um comando CLI raiz. O OpenClaw
usa esses metadados para diagnósticos sem importar o código de tempo de execução do plugin.

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
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | Sim      | `string`          | Nome do comando que pertence a este plugin.                               |
| `kind`       | Não       | `"runtime-slash"` | Marca o alias como um comando de barra de chat em vez de um comando CLI raiz. |
| `cliCommand` | Não       | `string`          | Comando CLI raiz relacionado a sugerir para operações de CLI, se existir.  |

## referência de activation

Use `activation` quando o plugin puder declarar de forma barata quais eventos do plano de controle
devem incluí-lo em um plano de ativação/carregamento.

Esse bloco é metadado do planejador, não uma API de ciclo de vida. Ele não registra
comportamento de tempo de execução, não substitui `register(...)` e não promete que
o código do plugin já foi executado. O planejador de ativação usa esses campos para
reduzir plugins candidatos antes de recorrer aos metadados de propriedade existentes
do manifesto, como `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` e hooks.

Prefira os metadados mais restritos que já descrevem a propriedade. Use
`providers`, `channels`, `commandAliases`, descritores de configuração ou `contracts`
quando esses campos expressarem a relação. Use `activation` para dicas extras do planejador
que não podem ser representadas por esses campos de propriedade.
Use `cliBackends` no nível superior para aliases de tempo de execução de CLI, como `claude-cli`,
`codex-cli` ou `google-gemini-cli`; `activation.onAgentHarnesses` é apenas para
ids de harnesses de agente incorporados que ainda não têm um campo de propriedade.

Esse bloco é apenas metadado. Ele não registra comportamento de tempo de execução e não
substitui `register(...)`, `setupEntry` ou outros pontos de entrada de tempo de execução/plugin.
Os consumidores atuais o usam como uma dica de restrição antes de um carregamento mais amplo de plugins, portanto
a ausência de metadados de ativação fora da inicialização normalmente custa apenas desempenho; ela
não deve alterar a correção enquanto os fallbacks de propriedade do manifesto ainda existirem.

Todo plugin deve definir `activation.onStartup` intencionalmente. Defina como `true`
somente quando o plugin precisar ser executado durante a inicialização do Gateway. Defina como `false` quando
o plugin for inerte na inicialização e deve carregar apenas a partir de gatilhos mais restritos.
Omitir `onStartup` não carrega mais o plugin implicitamente na inicialização; use metadados
de ativação explícitos para inicialização, canal, configuração, harness de agente, memória ou
outros gatilhos de ativação mais restritos.

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

| Campo              | Obrigatório | Tipo                                                 | O que significa                                                                                                                                                                               |
| ------------------ | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Não       | `boolean`                                            | Ativação explícita na inicialização do Gateway. Todo plugin deve definir isto. `true` importa o plugin durante a inicialização; `false` o mantém preguiçoso na inicialização, a menos que outro gatilho correspondente exija carregamento. |
| `onProviders`      | Não       | `string[]`                                           | IDs de provedores que devem incluir este plugin em planos de ativação/carregamento.                                                                                                                      |
| `onAgentHarnesses` | Não       | `string[]`                                           | IDs de tempo de execução de harnesses de agente incorporados que devem incluir este plugin em planos de ativação/carregamento. Use `cliBackends` no nível superior para aliases de backend de CLI.                                           |
| `onCommands`       | Não       | `string[]`                                           | IDs de comandos que devem incluir este plugin em planos de ativação/carregamento.                                                                                                                       |
| `onChannels`       | Não       | `string[]`                                           | IDs de canais que devem incluir este plugin em planos de ativação/carregamento.                                                                                                                       |
| `onRoutes`         | Não       | `string[]`                                           | Tipos de rotas que devem incluir este plugin em planos de ativação/carregamento.                                                                                                                       |
| `onConfigPaths`    | Não       | `string[]`                                           | Caminhos de configuração relativos à raiz que devem incluir este plugin em planos de inicialização/carregamento quando o caminho estiver presente e não estiver explicitamente desabilitado.                                                      |
| `onCapabilities`   | Não       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Dicas amplas de capacidade usadas pelo planejamento de ativação do plano de controle. Prefira campos mais restritos quando possível.                                                                                     |

Consumidores ativos atuais:

- O planejamento de inicialização do Gateway usa `activation.onStartup` para importação
  explícita na inicialização
- o planejamento de CLI acionado por comando recorre aos legados
  `commandAliases[].cliCommand` ou `commandAliases[].name`
- o planejamento de inicialização do tempo de execução do agente usa `activation.onAgentHarnesses` para
  harnesses incorporados e `cliBackends[]` no nível superior para aliases de tempo de execução de CLI
- o planejamento de configuração/canal acionado por canal recorre à propriedade legada `channels[]`
  quando metadados explícitos de ativação de canal estão ausentes
- o planejamento de plugins na inicialização usa `activation.onConfigPaths` para superfícies de configuração raiz
  que não são de canal, como o bloco `browser` do plugin de navegador incluído
- o planejamento de configuração/tempo de execução acionado por provedor recorre à propriedade legada
  `providers[]` e `cliBackends[]` no nível superior quando metadados explícitos de ativação
  de provedor estão ausentes

Os diagnósticos do planejador podem distinguir dicas explícitas de ativação do fallback
de propriedade do manifesto. Por exemplo, `activation-command-hint` significa que
`activation.onCommands` correspondeu, enquanto `manifest-command-alias` significa que o
planejador usou a propriedade de `commandAliases`. Esses rótulos de motivo são para
diagnósticos e testes do host; autores de plugins devem continuar declarando os metadados
que melhor descrevem a propriedade.

## referência de qaRunners

Use `qaRunners` quando um plugin contribuir com um ou mais executores de transporte sob
a raiz compartilhada `openclaw qa`. Mantenha esses metadados baratos e estáticos; o tempo de execução
do plugin ainda possui o registro real de CLI por meio de uma superfície leve
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
| `commandName` | Sim      | `string` | Subcomando montado sob `openclaw qa`, por exemplo `matrix`.    |
| `description` | Não       | `string` | Texto de ajuda de fallback usado quando o host compartilhado precisa de um comando stub. |

## referência de setup

Use `setup` quando superfícies de configuração e integração precisarem de metadados baratos pertencentes ao plugin
antes do carregamento do tempo de execução.

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

`cliBackends` no nível superior continua válido e continua descrevendo backends de inferência
de CLI. `setup.cliBackends` é a superfície de descritor específica de configuração para
fluxos de plano de controle/configuração que devem permanecer apenas metadados.

Quando presentes, `setup.providers` e `setup.cliBackends` são a superfície preferida
de busca orientada por descritor para descoberta de configuração. Se o descritor apenas
restringir o plugin candidato e a configuração ainda precisar de hooks de tempo de execução mais ricos em tempo de configuração,
defina `requiresRuntime: true` e mantenha `setup-api` em vigor como o
caminho de execução de fallback.

O OpenClaw também inclui `setup.providers[].envVars` em buscas genéricas de autenticação de provedor e
variáveis de ambiente. `providerAuthEnvVars` permanece compatível por meio de um adaptador
de compatibilidade durante a janela de descontinuação, mas plugins não incluídos que ainda o usam
recebem um diagnóstico de manifesto. Novos plugins devem colocar metadados de ambiente de configuração/status
em `setup.providers[].envVars`.

O OpenClaw também pode derivar escolhas simples de configuração a partir de `setup.providers[].authMethods`
quando nenhuma entrada de configuração está disponível, ou quando `setup.requiresRuntime: false`
declara que o tempo de execução de configuração é desnecessário. Entradas explícitas de `providerAuthChoices` continuam
preferidas para rótulos personalizados, flags de CLI, escopo de integração e metadados do assistente.

Defina `requiresRuntime: false` somente quando esses descritores forem suficientes para a
superfície de configuração. O OpenClaw trata `false` explícito como um contrato apenas de descritor
e não executará `setup-api` nem `openclaw.setupEntry` para busca de configuração. Se
um plugin apenas de descritor ainda enviar uma dessas entradas de tempo de execução de configuração,
o OpenClaw relata um diagnóstico aditivo e continua ignorando-a. Omitir
`requiresRuntime` mantém o comportamento de fallback legado para que plugins existentes que adicionaram
descritores sem a flag não quebrem.

Como a busca de configuração pode executar código `setup-api` pertencente ao plugin, valores normalizados de
`setup.providers[].id` e `setup.cliBackends[]` devem permanecer únicos entre
plugins descobertos. Propriedade ambígua falha de forma fechada em vez de escolher um
vencedor pela ordem de descoberta.

Quando o tempo de execução de configuração é executado, os diagnósticos do registro de configuração relatam divergência de descritor
se `setup-api` registrar um provedor ou backend de CLI que os descritores
do manifesto não declaram, ou se um descritor não tiver um registro de tempo de execução
correspondente. Esses diagnósticos são aditivos e não rejeitam plugins legados.

### referência de setup.providers

| Campo          | Obrigatório | Tipo       | O que significa                                                                                    |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | Sim      | `string`   | ID do provedor exposto durante a configuração ou integração. Mantenha IDs normalizados globalmente únicos.             |
| `authMethods`  | Não       | `string[]` | IDs de métodos de configuração/autenticação compatíveis com este provedor sem carregar o tempo de execução completo.                       |
| `envVars`      | Não       | `string[]` | Variáveis de ambiente que superfícies genéricas de configuração/status podem verificar antes do carregamento do tempo de execução do plugin.               |
| `authEvidence` | Não       | `object[]` | Verificações baratas de evidência de autenticação local para provedores que podem autenticar por meio de marcadores não secretos. |

`authEvidence` serve para marcadores de credenciais locais pertencentes ao provedor que podem ser
verificados sem carregar código de runtime. Essas verificações devem continuar baratas e locais:
sem chamadas de rede, sem leituras de chaveiro ou gerenciador de segredos, sem comandos de shell e sem
sondagens de API do provedor.

Entradas de evidência compatíveis:

| Campo              | Obrigatório | Tipo       | O que significa                                                                                                  |
| ------------------ | ----------- | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| `type`             | Sim         | `string`   | Atualmente `local-file-with-env`.                                                                                |
| `fileEnvVar`       | Não         | `string`   | Variável de ambiente contendo um caminho explícito para o arquivo de credenciais.                                |
| `fallbackPaths`    | Não         | `string[]` | Caminhos locais de arquivos de credenciais verificados quando `fileEnvVar` está ausente ou vazio. Aceita `${HOME}` e `${APPDATA}`. |
| `requiresAnyEnv`   | Não         | `string[]` | Pelo menos uma variável de ambiente listada deve estar não vazia antes que a evidência seja válida.              |
| `requiresAllEnv`   | Não         | `string[]` | Toda variável de ambiente listada deve estar não vazia antes que a evidência seja válida.                        |
| `credentialMarker` | Sim         | `string`   | Marcador não secreto retornado quando a evidência está presente.                                                 |
| `source`           | Não         | `string`   | Rótulo de origem voltado ao usuário para saída de autenticação/status.                                           |

### campos de setup

| Campo              | Obrigatório | Tipo       | O que significa                                                                                       |
| ------------------ | ----------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `providers`        | Não         | `object[]` | Descritores de setup de provedor expostos durante o setup e a integração.                             |
| `cliBackends`      | Não         | `string[]` | IDs de backends em tempo de setup usados para consulta de setup orientada por descritor. Mantenha IDs normalizados globalmente únicos. |
| `configMigrations` | Não         | `string[]` | IDs de migração de configuração pertencentes à superfície de setup deste plugin.                       |
| `requiresRuntime`  | Não         | `boolean`  | Se o setup ainda precisa de execução de `setup-api` após a consulta por descritor.                     |

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

| Campo         | Tipo       | O que significa                         |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Rótulo de campo voltado ao usuário.     |
| `help`        | `string`   | Texto auxiliar curto.                   |
| `tags`        | `string[]` | Tags opcionais da UI.                   |
| `advanced`    | `boolean`  | Marca o campo como avançado.            |
| `sensitive`   | `boolean`  | Marca o campo como secreto ou sensível. |
| `placeholder` | `string`   | Texto de placeholder para inputs de formulário. |

## referência de contracts

Use `contracts` somente para metadados estáticos de propriedade de capacidade que o OpenClaw pode
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

| Campo                            | Tipo       | O que significa                                                        |
| -------------------------------- | ---------- | ---------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | IDs de fábricas de extensão do servidor de app do Codex, atualmente `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | IDs de runtime para os quais um plugin incluído pode registrar middleware de resultado de ferramenta. |
| `externalAuthProviders`          | `string[]` | IDs de provedor cujo hook de perfil de autenticação externa pertence a este plugin. |
| `speechProviders`                | `string[]` | IDs de provedor de fala pertencentes a este plugin.                    |
| `realtimeTranscriptionProviders` | `string[]` | IDs de provedor de transcrição em tempo real pertencentes a este plugin. |
| `realtimeVoiceProviders`         | `string[]` | IDs de provedor de voz em tempo real pertencentes a este plugin.       |
| `memoryEmbeddingProviders`       | `string[]` | IDs de provedor de embedding de memória pertencentes a este plugin.    |
| `mediaUnderstandingProviders`    | `string[]` | IDs de provedor de compreensão de mídia pertencentes a este plugin.    |
| `imageGenerationProviders`       | `string[]` | IDs de provedor de geração de imagens pertencentes a este plugin.      |
| `videoGenerationProviders`       | `string[]` | IDs de provedor de geração de vídeo pertencentes a este plugin.        |
| `webFetchProviders`              | `string[]` | IDs de provedor de busca Web pertencentes a este plugin.               |
| `webSearchProviders`             | `string[]` | IDs de provedor de pesquisa Web pertencentes a este plugin.            |
| `migrationProviders`             | `string[]` | IDs de provedor de importação pertencentes a este plugin para `openclaw migrate`. |
| `tools`                          | `string[]` | Nomes de ferramentas de agente pertencentes a este plugin.             |

`contracts.embeddedExtensionFactories` é mantido para fábricas de extensão somente do
servidor de app do Codex incluídas. Transformações de resultado de ferramenta incluídas devem
declarar `contracts.agentToolResultMiddleware` e registrar com
`api.registerAgentToolResultMiddleware(...)` em vez disso. Plugins externos não podem
registrar middleware de resultado de ferramenta porque o seam pode reescrever a saída de ferramentas de alta confiança
antes que o modelo a veja.

Registros de runtime `api.registerTool(...)` devem corresponder a `contracts.tools`.
A descoberta de ferramentas usa esta lista para carregar somente os runtimes de plugin que podem ser donos das
ferramentas solicitadas.

Plugins de provedor que implementam `resolveExternalAuthProfiles` devem declarar
`contracts.externalAuthProviders`. Plugins sem a declaração ainda passam por
um fallback de compatibilidade obsoleto, mas esse fallback é mais lento e
será removido após a janela de migração.

Provedores incluídos de embedding de memória devem declarar
`contracts.memoryEmbeddingProviders` para cada ID de adaptador que expõem, incluindo
adaptadores integrados como `local`. Caminhos de CLI autônomos usam este contrato de manifesto
para carregar somente o plugin proprietário antes que o runtime completo do Gateway tenha
registrado provedores.

## referência de mediaUnderstandingProviderMetadata

Use `mediaUnderstandingProviderMetadata` quando um provedor de compreensão de mídia tiver
modelos padrão, prioridade de fallback de autenticação automática ou suporte nativo a documentos de que
helpers genéricos do core precisam antes do carregamento do runtime. As chaves também devem ser declaradas em
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
| `autoPriority`         | `Record<string, number>`            | Números menores são ordenados antes para fallback automático de provedor baseado em credenciais. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Inputs nativos de documento compatíveis com o provedor.                      |

## referência de channelConfigs

Use `channelConfigs` quando um plugin de canal precisar de metadados baratos de configuração antes que
o runtime seja carregado. A descoberta somente leitura de setup/status de canal pode usar esses metadados
diretamente para canais externos configurados quando nenhuma entrada de setup está disponível, ou
quando `setup.requiresRuntime: false` declara que o runtime de setup é desnecessário.

`channelConfigs` é metadado de manifesto de plugin, não uma nova seção de configuração de usuário de nível superior.
Os usuários ainda configuram instâncias de canal em `channels.<channel-id>`.
O OpenClaw lê metadados de manifesto para decidir qual plugin possui esse canal configurado
antes que o código de runtime do plugin execute.

Para um plugin de canal, `configSchema` e `channelConfigs` descrevem caminhos diferentes:

- `configSchema` valida `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valida `channels.<channel-id>`

Plugins não incluídos que declaram `channels[]` também devem declarar entradas
`channelConfigs` correspondentes. Sem elas, o OpenClaw ainda pode carregar o plugin, mas
o schema de configuração em caminho frio, o setup e as superfícies da Control UI não conseguem saber o
formato das opções pertencentes ao canal até que o runtime do plugin execute.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` e
`nativeSkillsAutoEnabled` podem declarar padrões estáticos `auto` para verificações de configuração de comandos
que rodam antes que o runtime do canal seja carregado. Canais incluídos também podem publicar
os mesmos padrões por meio de `package.json#openclaw.channel.commands` junto
com seus outros metadados de catálogo de canais pertencentes ao pacote.

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

| Campo         | Tipo                     | O que significa                                                                            |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| `schema`      | `object`                 | JSON Schema para `channels.<id>`. Obrigatório para cada entrada declarada de config de canal. |
| `uiHints`     | `Record<string, object>` | Rótulos/placeholders/dicas sensíveis opcionais de UI para essa seção de config de canal.   |
| `label`       | `string`                 | Rótulo do canal mesclado nas superfícies de seleção e inspeção quando os metadados de runtime ainda não estão prontos. |
| `description` | `string`                 | Descrição curta do canal para superfícies de inspeção e catálogo.                          |
| `commands`    | `object`                 | Comando nativo estático e padrões automáticos de Skill nativa para verificações de config antes do runtime. |
| `preferOver`  | `string[]`               | IDs de Plugin legados ou de menor prioridade que este canal deve superar nas superfícies de seleção. |

### Substituindo outro Plugin de canal

Use `preferOver` quando seu Plugin for o proprietário preferido para um id de canal que
outro Plugin também pode fornecer. Casos comuns são um id de Plugin renomeado, um
Plugin independente que substitui um Plugin empacotado, ou um fork mantido que
mantém o mesmo id de canal para compatibilidade de config.

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

Quando `channels.chat` está configurado, o OpenClaw considera tanto o id do canal quanto
o id do Plugin preferido. Se o Plugin de menor prioridade só foi selecionado porque
ele é empacotado ou habilitado por padrão, o OpenClaw o desabilita na config de
runtime efetiva para que um Plugin seja proprietário do canal e de suas ferramentas. A seleção explícita do usuário
ainda prevalece: se o usuário habilitar explicitamente ambos os plugins, o OpenClaw
preserva essa escolha e relata diagnósticos de canal/ferramenta duplicados em vez de
alterar silenciosamente o conjunto de plugins solicitado.

Mantenha `preferOver` restrito a ids de Plugin que realmente podem fornecer o mesmo canal.
Ele não é um campo de prioridade geral e não renomeia chaves de config do usuário.

## Referência de modelSupport

Use `modelSupport` quando o OpenClaw deve inferir seu Plugin de provedor a partir de
ids de modelo abreviados como `gpt-5.5` ou `claude-sonnet-4.6` antes que o runtime do Plugin
seja carregado.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

O OpenClaw aplica esta precedência:

- referências explícitas `provider/model` usam os metadados de manifesto `providers` proprietários
- `modelPatterns` têm precedência sobre `modelPrefixes`
- se um Plugin não empacotado e um Plugin empacotado corresponderem, o Plugin não empacotado
  vence
- a ambiguidade restante é ignorada até que o usuário ou a config especifique um provedor

Campos:

| Campo           | Tipo       | O que significa                                                               |
| --------------- | ---------- | ----------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefixos comparados com `startsWith` contra ids de modelo abreviados.         |
| `modelPatterns` | `string[]` | Fontes regex comparadas contra ids de modelo abreviados após remover o sufixo do perfil. |

## Referência de modelCatalog

Use `modelCatalog` quando o OpenClaw deve conhecer metadados de modelo do provedor antes de
carregar o runtime do Plugin. Esta é a fonte pertencente ao manifesto para linhas fixas de catálogo,
aliases de provedor, regras de supressão e modo de descoberta. A atualização de runtime
ainda pertence ao código de runtime do provedor, mas o manifesto informa ao core quando o runtime
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

| Campo          | Tipo                                                     | O que significa                                                                                          |
| -------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Linhas de catálogo para ids de provedor pertencentes a este Plugin. As chaves também devem aparecer em `providers` de nível superior. |
| `aliases`      | `Record<string, object>`                                 | Aliases de provedor que devem resolver para um provedor pertencente para planejamento de catálogo ou supressão. |
| `suppressions` | `object[]`                                               | Linhas de modelo de outra fonte que este Plugin suprime por um motivo específico do provedor.             |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Se o catálogo do provedor pode ser lido dos metadados do manifesto, atualizado no cache, ou exige runtime. |

`aliases` participa da busca de propriedade do provedor para planejamento de catálogo de modelos.
Os destinos de alias devem ser provedores de nível superior pertencentes ao mesmo Plugin. Quando uma
lista filtrada por provedor usa um alias, o OpenClaw pode ler o manifesto proprietário e
aplicar substituições de API/base URL do alias sem carregar o runtime do provedor.
Aliases não expandem listagens de catálogo não filtradas; listas amplas emitem apenas as linhas do
provedor canônico proprietário.

`suppressions` substitui o antigo hook de runtime de provedor `suppressBuiltInModel`.
Entradas de supressão são respeitadas apenas quando o provedor pertence ao Plugin ou é
declarado como uma chave `modelCatalog.aliases` que aponta para um provedor pertencente. Hooks de
supressão de runtime não são mais chamados durante a resolução de modelo.

Campos de provedor:

| Campo     | Tipo                     | O que significa                                                       |
| --------- | ------------------------ | --------------------------------------------------------------------- |
| `baseUrl` | `string`                 | URL base padrão opcional para modelos neste catálogo de provedor.     |
| `api`     | `ModelApi`               | Adaptador de API padrão opcional para modelos neste catálogo de provedor. |
| `headers` | `Record<string, string>` | Cabeçalhos estáticos opcionais que se aplicam a este catálogo de provedor. |
| `models`  | `object[]`               | Linhas de modelo obrigatórias. Linhas sem um `id` são ignoradas.      |

Campos de modelo:

| Campo           | Tipo                                                           | O que significa                                                               |
| --------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Id de modelo local ao provedor, sem o prefixo `provider/`.                    |
| `name`          | `string`                                                       | Nome de exibição opcional.                                                    |
| `api`           | `ModelApi`                                                     | Substituição opcional de API por modelo.                                      |
| `baseUrl`       | `string`                                                       | Substituição opcional de URL base por modelo.                                 |
| `headers`       | `Record<string, string>`                                       | Cabeçalhos estáticos opcionais por modelo.                                    |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalidades que o modelo aceita.                                              |
| `reasoning`     | `boolean`                                                      | Se o modelo expõe comportamento de raciocínio.                                |
| `contextWindow` | `number`                                                       | Janela de contexto nativa do provedor.                                        |
| `contextTokens` | `number`                                                       | Limite de contexto efetivo opcional de runtime quando diferente de `contextWindow`. |
| `maxTokens`     | `number`                                                       | Máximo de tokens de saída quando conhecido.                                   |
| `cost`          | `object`                                                       | Preço opcional em USD por milhão de tokens, incluindo `tieredPricing` opcional. |
| `compat`        | `object`                                                       | Flags de compatibilidade opcionais que correspondem à compatibilidade de config de modelo do OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Status de listagem. Suprima apenas quando a linha não deve aparecer de forma alguma. |
| `statusReason`  | `string`                                                       | Motivo opcional mostrado com status não disponível.                           |
| `replaces`      | `string[]`                                                     | Ids de modelo locais ao provedor mais antigos que este modelo substitui.      |
| `replacedBy`    | `string`                                                       | Id de modelo local ao provedor substituto para linhas obsoletas.              |
| `tags`          | `string[]`                                                     | Tags estáveis usadas por seletores e filtros.                                 |

Campos de supressão:

| Campo                      | Tipo       | O que significa                                                                                       |
| -------------------------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Id do provedor para a linha upstream a suprimir. Deve pertencer a este Plugin ou ser declarado como um alias pertencente. |
| `model`                    | `string`   | Id de modelo local ao provedor a suprimir.                                                            |
| `reason`                   | `string`   | Mensagem opcional mostrada quando a linha suprimida é solicitada diretamente.                         |
| `when.baseUrlHosts`        | `string[]` | Lista opcional de hosts de URL base efetivos do provedor exigidos antes que a supressão se aplique.   |
| `when.providerConfigApiIn` | `string[]` | Lista opcional de valores exatos de `api` da config de provedor exigidos antes que a supressão se aplique. |

Não coloque dados apenas de runtime em `modelCatalog`. Use `static` somente quando as linhas de manifesto forem completas o suficiente para que as superfícies de lista filtrada por provedor e seletor pulem a descoberta por registro/runtime. Use `refreshable` quando as linhas de manifesto forem sementes ou complementos listáveis úteis, mas uma atualização/cache puder adicionar mais linhas depois; linhas refreshable não são autoritativas por si só. Use `runtime` quando o OpenClaw precisar carregar o runtime do provedor para conhecer a lista.

## Referência de modelIdNormalization

Use `modelIdNormalization` para uma limpeza barata de IDs de modelo controlada pelo provedor que deve acontecer antes que o runtime do provedor carregue. Isso mantém aliases como nomes curtos de modelos, IDs legados locais do provedor e regras de prefixo de proxy no manifesto do Plugin proprietário, em vez de em tabelas centrais de seleção de modelo.

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

| Campo                                | Tipo                    | O que significa                                                                         |
| ------------------------------------ | ----------------------- | --------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Aliases exatos de ID de modelo sem diferenciar maiúsculas de minúsculas. Os valores são retornados como escritos. |
| `stripPrefixes`                      | `string[]`              | Prefixos a remover antes da busca de alias, útil para duplicação legada de provedor/modelo. |
| `prefixWhenBare`                     | `string`                | Prefixo a adicionar quando o ID de modelo normalizado ainda não contém `/`.             |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Regras condicionais de prefixo de ID simples após a busca de alias, indexadas por `modelPrefix` e `prefix`. |

## Referência de providerEndpoints

Use `providerEndpoints` para classificação de endpoints que a política genérica de requisição precisa conhecer antes que o runtime do provedor carregue. O core ainda é dono do significado de cada `endpointClass`; manifestos de Plugin são donos dos metadados de host e URL base.

Campos de endpoint:

| Campo                          | Tipo       | O que significa                                                                          |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Classe de endpoint conhecida pelo core, como `openrouter`, `moonshot-native` ou `google-vertex`. |
| `hosts`                        | `string[]` | Nomes de host exatos que mapeiam para a classe de endpoint.                              |
| `hostSuffixes`                 | `string[]` | Sufixos de host que mapeiam para a classe de endpoint. Prefixe com `.` para corresponder apenas a sufixos de domínio. |
| `baseUrls`                     | `string[]` | URLs base HTTP(S) normalizadas exatas que mapeiam para a classe de endpoint.             |
| `googleVertexRegion`           | `string`   | Região estática do Google Vertex para hosts globais exatos.                              |
| `googleVertexRegionHostSuffix` | `string`   | Sufixo a remover de hosts correspondentes para expor o prefixo da região do Google Vertex. |

## Referência de providerRequest

Use `providerRequest` para metadados baratos de compatibilidade de requisição que a política genérica de requisição precisa sem carregar o runtime do provedor. Mantenha reescrita de payload específica de comportamento em hooks de runtime do provedor ou helpers compartilhados da família de provedores.

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
| `family`              | `string`     | Rótulo de família de provedor usado por decisões e diagnósticos genéricos de compatibilidade de requisição. |
| `compatibilityFamily` | `"moonshot"` | Grupo opcional de compatibilidade de família de provedores para helpers compartilhados de requisição. |
| `openAICompletions`   | `object`     | Flags de requisição de completions compatíveis com OpenAI, atualmente `supportsStreamingUsage`. |

## Referência de modelPricing

Use `modelPricing` quando um provedor precisar de comportamento de precificação do plano de controle antes que o runtime carregue. O cache de precificação do Gateway lê esses metadados sem importar código de runtime do provedor.

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
| `openRouter` | `false \| object` | Mapeamento de busca de preços do OpenRouter. `false` desativa a busca no OpenRouter para este provedor. |
| `liteLLM`    | `false \| object` | Mapeamento de busca de preços do LiteLLM. `false` desativa a busca no LiteLLM para este provedor.     |

Campos de origem:

| Campo                      | Tipo               | O que significa                                                                                                        |
| -------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | ID do provedor no catálogo externo quando ele difere do ID do provedor OpenClaw, por exemplo `z-ai` para um provedor `zai`. |
| `passthroughProviderModel` | `boolean`          | Trate IDs de modelo que contêm barra como refs aninhadas de provedor/modelo, útil para provedores de proxy como OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Variantes extras de ID de modelo do catálogo externo. `version-dots` tenta IDs de versão pontuados como `claude-opus-4.6`. |

### Índice de Provedores do OpenClaw

O Índice de Provedores do OpenClaw é um metadado de prévia controlado pelo OpenClaw para provedores cujos plugins talvez ainda não estejam instalados. Ele não faz parte de um manifesto de Plugin. Manifestos de Plugin continuam sendo a autoridade do Plugin instalado. O Índice de Provedores é o contrato interno de fallback que futuras superfícies de provedor instalável e seletor de modelo pré-instalação consumirão quando um Plugin de provedor não estiver instalado.

Ordem de autoridade do catálogo:

1. Configuração do usuário.
2. `modelCatalog` do manifesto do Plugin instalado.
3. Cache de catálogo de modelos de atualização explícita.
4. Linhas de prévia do Índice de Provedores do OpenClaw.

O Índice de Provedores não deve conter segredos, estado habilitado, hooks de runtime nem dados de modelo específicos de conta em tempo real. Seus catálogos de prévia usam o mesmo formato de linha de provedor `modelCatalog` que os manifestos de Plugin, mas devem permanecer limitados a metadados estáveis de exibição, a menos que campos do adaptador de runtime como `api`, `baseUrl`, preços ou flags de compatibilidade sejam mantidos intencionalmente alinhados com o manifesto do Plugin instalado. Provedores com descoberta em tempo real de `/models` devem gravar linhas atualizadas pelo caminho explícito de cache de catálogo de modelos em vez de fazer listagem normal ou onboarding chamar APIs do provedor.

Entradas do Índice de Provedores também podem carregar metadados de Plugin instalável para provedores cujo Plugin saiu do core ou ainda não está instalado por outro motivo. Esses metadados espelham o padrão do catálogo de canais: nome do pacote, especificação de instalação npm, integridade esperada e rótulos baratos de escolha de autenticação bastam para mostrar uma opção de configuração instalável. Depois que o Plugin é instalado, seu manifesto vence e a entrada do Índice de Provedores é ignorada para esse provedor.

Chaves legadas de capacidade no nível superior foram descontinuadas. Use `openclaw doctor --fix` para mover `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` e `webSearchProviders` para dentro de `contracts`; o carregamento normal de manifesto não trata mais esses campos de nível superior como ownership de capacidade.

## Manifesto versus package.json

Os dois arquivos servem a propósitos diferentes:

| Arquivo                | Use para                                                                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Descoberta, validação de configuração, metadados de escolha de autenticação e dicas de UI que devem existir antes que o código do Plugin execute |
| `package.json`         | Metadados npm, instalação de dependências e o bloco `openclaw` usado para entrypoints, bloqueio de instalação, configuração ou metadados de catálogo |

Se você não tiver certeza de onde um metadado pertence, use esta regra:

- se o OpenClaw precisa conhecê-lo antes de carregar código do Plugin, coloque-o em `openclaw.plugin.json`
- se for sobre empacotamento, arquivos de entrada ou comportamento de instalação npm, coloque-o em `package.json`

### Campos de package.json que afetam a descoberta

Alguns metadados de Plugin pré-runtime vivem intencionalmente em `package.json` sob o bloco `openclaw`, em vez de `openclaw.plugin.json`.
`openclaw.bundle` e `openclaw.bundle.json` não são contratos de Plugin do OpenClaw; plugins nativos devem usar `openclaw.plugin.json` mais os campos compatíveis de `package.json#openclaw` abaixo.

Exemplos importantes:

| Campo                                                                                      | O que significa                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | Declara pontos de entrada nativos de Plugin. Deve permanecer dentro do diretório do pacote do Plugin.                                                                                                   |
| `openclaw.runtimeExtensions`                                                               | Declara pontos de entrada de runtime JavaScript compilados para pacotes instalados. Deve permanecer dentro do diretório do pacote do Plugin.                                                                 |
| `openclaw.setupEntry`                                                                      | Ponto de entrada leve somente de configuração usado durante o onboarding, a inicialização adiada de canais e a descoberta de status de canal/SecretRef somente leitura. Deve permanecer dentro do diretório do pacote do Plugin. |
| `openclaw.runtimeSetupEntry`                                                               | Declara o ponto de entrada de configuração JavaScript compilado para pacotes instalados. Requer `setupEntry`, deve existir e deve permanecer dentro do diretório do pacote do Plugin.                         |
| `openclaw.channel`                                                                         | Metadados baratos de catálogo de canais, como rótulos, caminhos de docs, aliases e texto de seleção.                                                                                                 |
| `openclaw.channel.commands`                                                                | Metadados estáticos de comandos nativos e de padrão automático de Skills nativas usados por config, auditoria e superfícies de lista de comandos antes do runtime do canal carregar.                                          |
| `openclaw.channel.configuredState`                                                         | Metadados leves de verificador de estado configurado que podem responder "a configuração somente por env já existe?" sem carregar o runtime completo do canal.                                         |
| `openclaw.channel.persistedAuthState`                                                      | Metadados leves de verificador de autenticação persistida que podem responder "já há algo conectado?" sem carregar o runtime completo do canal.                                               |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Dicas de instalação/atualização para plugins empacotados e publicados externamente.                                                                                                                   |
| `openclaw.install.defaultChoice`                                                           | Caminho de instalação preferido quando várias fontes de instalação estão disponíveis.                                                                                                                  |
| `openclaw.install.minHostVersion`                                                          | Versão mínima compatível do host OpenClaw, usando um piso semver como `>=2026.3.22` ou `>=2026.5.1-beta.1`.                                                                             |
| `openclaw.install.expectedIntegrity`                                                       | String de integridade de dist npm esperada, como `sha512-...`; fluxos de instalação e atualização verificam o artefato obtido em relação a ela.                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Permite um caminho estreito de recuperação por reinstalação de Plugin empacotado quando a config é inválida.                                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Permite que superfícies de canal somente de configuração carreguem antes do Plugin de canal completo durante a inicialização.                                                                                                 |

Os metadados do manifesto decidem quais escolhas de provedor/canal/configuração aparecem no
onboarding antes do runtime carregar. `package.json#openclaw.install` informa ao
onboarding como buscar ou habilitar esse Plugin quando o usuário escolhe uma dessas
opções. Não mova dicas de instalação para `openclaw.plugin.json`.

`openclaw.install.minHostVersion` é aplicado durante a instalação e o carregamento do
registro de manifestos para fontes de Plugin não empacotadas. Valores inválidos são rejeitados;
valores mais novos, mas válidos, ignoram plugins externos em hosts mais antigos. Plugins de origem
empacotados são considerados coversionados com o checkout do host.

Metadados oficiais de instalação sob demanda devem usar `clawhubSpec` quando o Plugin está
publicado no ClawHub; o onboarding trata isso como a fonte remota preferida e
registra fatos do artefato do ClawHub após a instalação. `npmSpec` continua sendo o fallback de
compatibilidade para pacotes que ainda não foram movidos para o ClawHub.

O pinning de versão npm exata já fica em `npmSpec`, por exemplo
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Entradas oficiais de catálogo externo
devem combinar specs exatas com `expectedIntegrity` para que fluxos de atualização falhem
de modo fechado se o artefato npm obtido não corresponder mais ao release fixado.
O onboarding interativo ainda oferece specs npm de registro confiável, incluindo nomes
de pacote simples e dist-tags, para compatibilidade. Diagnósticos de catálogo podem
distinguir fontes exatas, flutuantes, com pin de integridade, sem integridade, com
incompatibilidade de nome de pacote e com escolha padrão inválida. Eles também avisam quando
`expectedIntegrity` está presente, mas não há uma fonte npm válida que ela possa fixar.
Quando `expectedIntegrity` está presente,
fluxos de instalação/atualização a aplicam; quando ela é omitida, a resolução do registro é
registrada sem pin de integridade.

Plugins de canal devem fornecer `openclaw.setupEntry` quando status, lista de canais
ou varreduras de SecretRef precisarem identificar contas configuradas sem carregar o runtime
completo. A entrada de configuração deve expor metadados de canal mais adaptadores de config,
status e segredos seguros para configuração; mantenha clientes de rede, listeners de Gateway e
runtimes de transporte no ponto de entrada principal da extensão.

Campos de ponto de entrada de runtime não substituem as verificações de limite de pacote para
campos de ponto de entrada de origem. Por exemplo, `openclaw.runtimeExtensions` não pode tornar
carregável um caminho `openclaw.extensions` que escapa do pacote.

`openclaw.install.allowInvalidConfigRecovery` é intencionalmente estreito. Ele não
torna instaláveis configs quebradas arbitrárias. Hoje ele só permite que fluxos de instalação
se recuperem de falhas específicas e obsoletas de upgrade de Plugin empacotado, como um
caminho de Plugin empacotado ausente ou uma entrada `channels.<id>` obsoleta para esse mesmo
Plugin empacotado. Erros de config não relacionados ainda bloqueiam a instalação e encaminham operadores
para `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` é metadado de pacote para um módulo verificador
minúsculo:

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

Use-o quando fluxos de configuração, doctor, status ou presença somente leitura precisarem de uma
sondagem barata de autenticação sim/não antes que o Plugin de canal completo carregue. Estado de autenticação persistida não é
estado de canal configurado: não use esses metadados para habilitar plugins automaticamente,
reparar dependências de runtime ou decidir se um runtime de canal deve carregar.
A exportação de destino deve ser uma função pequena que lê apenas estado persistido; não
a encaminhe pelo barrel do runtime completo do canal.

`openclaw.channel.configuredState` segue o mesmo formato para verificações baratas de
configuração somente por env:

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

Use-o quando um canal puder responder o estado configurado a partir de env ou outros inputs
minúsculos fora do runtime. Se a verificação precisar de resolução completa de config ou do runtime
real do canal, mantenha essa lógica no hook `config.hasConfiguredState` do Plugin.

## Precedência de descoberta (ids de Plugin duplicados)

O OpenClaw descobre plugins a partir de várias raízes (empacotados, instalação global, workspace, caminhos selecionados explicitamente na config). Se duas descobertas compartilharem o mesmo `id`, somente o manifesto de **maior precedência** será mantido; duplicatas de menor precedência são descartadas em vez de carregar ao lado dele.

Precedência, da maior para a menor:

1. **Selecionado por config** — um caminho explicitamente fixado em `plugins.entries.<id>`
2. **Empacotado** — plugins enviados com o OpenClaw
3. **Instalação global** — plugins instalados na raiz global de plugins do OpenClaw
4. **Workspace** — plugins descobertos em relação ao workspace atual

Implicações:

- Uma cópia bifurcada ou obsoleta de um Plugin empacotado presente no workspace não sombreará a build empacotada.
- Para realmente substituir um Plugin empacotado por um local, fixe-o via `plugins.entries.<id>` para que ele vença por precedência, em vez de depender da descoberta do workspace.
- Descartes de duplicatas são registrados para que o Doctor e diagnósticos de inicialização possam apontar para a cópia descartada.
- Sobrescritas duplicadas selecionadas por config são descritas como sobrescritas explícitas nos diagnósticos, mas ainda avisam para que forks obsoletos e sombreamentos acidentais permaneçam visíveis.

## Requisitos de JSON Schema

- **Todo Plugin deve enviar um JSON Schema**, mesmo que não aceite config.
- Um schema vazio é aceitável (por exemplo, `{ "type": "object", "additionalProperties": false }`).
- Schemas são validados no momento de leitura/escrita da config, não no runtime.
- Ao estender ou bifurcar um Plugin empacotado com novas chaves de config, atualize o `configSchema` de `openclaw.plugin.json` desse Plugin ao mesmo tempo. Schemas de Plugins empacotados são estritos, então adicionar `plugins.entries.<id>.config.myNewKey` à config do usuário sem adicionar `myNewKey` a `configSchema.properties` será rejeitado antes que o runtime do Plugin carregue.

Exemplo de extensão de schema:

```json
{
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "myNewKey": {
        "type": "string"
      }
    }
  }
}
```

## Comportamento de validação

- Chaves `channels.*` desconhecidas são **erros**, a menos que o id do canal seja declarado por
  um manifesto de Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*`
  devem referenciar ids de Plugin **descobertos**. Ids desconhecidos são **erros**.
- Se um Plugin estiver instalado, mas tiver um manifesto ou schema quebrado ou ausente,
  a validação falhará e o Doctor relatará o erro do Plugin.
- Se a config do Plugin existir, mas o Plugin estiver **desabilitado**, a config será mantida e
  um **aviso** será exibido no Doctor + logs.

Consulte a [referência de configuração](/pt-BR/gateway/configuration) para ver o schema `plugins.*` completo.

## Observações

- O manifesto é **obrigatório para plugins nativos do OpenClaw**, incluindo carregamentos do sistema de arquivos local. O runtime ainda carrega o módulo do plugin separadamente; o manifesto serve apenas para descoberta + validação.
- Manifestos nativos são analisados com JSON5, então comentários, vírgulas finais e chaves sem aspas são aceitos desde que o valor final ainda seja um objeto.
- Apenas campos de manifesto documentados são lidos pelo carregador de manifestos. Evite chaves personalizadas de nível superior.
- `channels`, `providers`, `cliBackends` e `skills` podem ser omitidos quando um plugin não precisa deles.
- `providerDiscoveryEntry` deve permanecer leve e não deve importar código amplo de runtime; use-o para metadados estáticos de catálogo de provedores ou descritores de descoberta restritos, não para execução em tempo de solicitação.
- Tipos exclusivos de plugin são selecionados por meio de `plugins.slots.*`: `kind: "memory"` via `plugins.slots.memory`, `kind: "context-engine"` via `plugins.slots.contextEngine` (padrão `legacy`).
- Declare o tipo exclusivo de plugin neste manifesto. `OpenClawPluginDefinition.kind` da entrada de runtime está obsoleto e permanece apenas como fallback de compatibilidade para plugins mais antigos.
- Metadados de variáveis de ambiente (`setup.providers[].envVars`, `providerAuthEnvVars` obsoleto e `channelEnvVars`) são apenas declarativos. Status, auditoria, validação de entrega por cron e outras superfícies somente leitura ainda aplicam a confiança do plugin e a política de ativação efetiva antes de tratar uma variável de ambiente como configurada.
- Para metadados do assistente de runtime que exigem código de provedor, consulte [hooks de runtime de provedor](/pt-BR/plugins/architecture-internals#provider-runtime-hooks).
- Se o seu plugin depende de módulos nativos, documente as etapas de build e quaisquer requisitos de allowlist do gerenciador de pacotes (por exemplo, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Relacionado

<CardGroup cols={3}>
  <Card title="Criando plugins" href="/pt-BR/plugins/building-plugins" icon="rocket">
    Introdução aos plugins.
  </Card>
  <Card title="Arquitetura de plugins" href="/pt-BR/plugins/architecture" icon="diagram-project">
    Arquitetura interna e modelo de capacidades.
  </Card>
  <Card title="Visão geral do SDK" href="/pt-BR/plugins/sdk-overview" icon="book">
    Referência do SDK de plugins e importações de subcaminhos.
  </Card>
</CardGroup>
