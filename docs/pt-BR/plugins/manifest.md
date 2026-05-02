---
read_when:
    - Você está criando um Plugin do OpenClaw
    - Você precisa publicar um esquema de configuração de Plugin ou depurar erros de validação de Plugin
summary: Manifesto do Plugin + requisitos do esquema JSON (validação estrita da configuração)
title: Manifesto do Plugin
x-i18n:
    generated_at: "2026-05-02T05:52:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 371a7364374df57c0b4a55229b86beea24140d0b352a54e8281e103bf66f5662
    source_path: plugins/manifest.md
    workflow: 16
---

Esta página é apenas para o **manifesto de plugin nativo do OpenClaw**.

Para layouts de pacotes compatíveis, consulte [Pacotes de Plugin](/pt-BR/plugins/bundles).

Formatos de pacote compatíveis usam arquivos de manifesto diferentes:

- Pacote Codex: `.codex-plugin/plugin.json`
- Pacote Claude: `.claude-plugin/plugin.json` ou o layout padrão de componente Claude
  sem um manifesto
- Pacote Cursor: `.cursor-plugin/plugin.json`

O OpenClaw também detecta automaticamente esses layouts de pacote, mas eles não são validados
contra o esquema `openclaw.plugin.json` descrito aqui.

Para pacotes compatíveis, o OpenClaw atualmente lê os metadados do pacote mais as raízes de
Skills declaradas, raízes de comandos Claude, padrões de `settings.json` do pacote Claude,
padrões de LSP do pacote Claude e pacotes de hooks compatíveis quando o layout corresponde
às expectativas de runtime do OpenClaw.

Todo plugin nativo do OpenClaw **deve** distribuir um arquivo `openclaw.plugin.json` na
**raiz do plugin**. O OpenClaw usa este manifesto para validar a configuração
**sem executar código do plugin**. Manifestos ausentes ou inválidos são tratados como
erros de plugin e bloqueiam a validação de configuração.

Consulte o guia completo do sistema de plugins: [Plugins](/pt-BR/tools/plugin).
Para o modelo de capacidade nativo e a orientação atual de compatibilidade externa:
[Modelo de capacidade](/pt-BR/plugins/architecture#public-capability-model).

## O que este arquivo faz

`openclaw.plugin.json` são os metadados que o OpenClaw lê **antes de carregar o código do seu
plugin**. Tudo abaixo deve ser barato o suficiente para inspecionar sem inicializar
o runtime do plugin.

**Use-o para:**

- identidade do plugin, validação de configuração e dicas de IU de configuração
- metadados de auth, onboarding e configuração inicial (alias, habilitação automática, variáveis de ambiente do provedor, escolhas de auth)
- dicas de ativação para superfícies de plano de controle
- propriedade abreviada de família de modelos
- snapshots estáticos de propriedade de capacidades (`contracts`)
- metadados do executor de QA que o host compartilhado `openclaw qa` pode inspecionar
- metadados de configuração específicos de canal mesclados em superfícies de catálogo e validação

**Não o use para:** registrar comportamento em runtime, declarar entrypoints de código
ou metadados de instalação npm. Esses pertencem ao código do seu plugin e ao `package.json`.

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

## Referência de campos de nível superior

| Campo                                | Obrigatório | Tipo                             | O que significa                                                                                                                                                                                                                             |
| ------------------------------------ | ----------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Sim         | `string`                         | Id canônico do plugin. Este é o id usado em `plugins.entries.<id>`.                                                                                                                                                                         |
| `configSchema`                       | Sim         | `object`                         | JSON Schema inline para a configuração deste plugin.                                                                                                                                                                                        |
| `enabledByDefault`                   | Não         | `true`                           | Marca um plugin incluído como habilitado por padrão. Omita-o, ou defina qualquer valor que não seja `true`, para deixar o plugin desabilitado por padrão.                                                                                    |
| `legacyPluginIds`                    | Não         | `string[]`                       | Ids legados que são normalizados para este id canônico de plugin.                                                                                                                                                                           |
| `autoEnableWhenConfiguredProviders`  | Não         | `string[]`                       | Ids de provedores que devem habilitar automaticamente este plugin quando auth, configuração ou refs de modelo os mencionarem.                                                                                                                |
| `kind`                               | Não         | `"memory"` \| `"context-engine"` | Declara um tipo exclusivo de plugin usado por `plugins.slots.*`.                                                                                                                                                                            |
| `channels`                           | Não         | `string[]`                       | Ids de canais pertencentes a este plugin. Usado para descoberta e validação de configuração.                                                                                                                                                |
| `providers`                          | Não         | `string[]`                       | Ids de provedores pertencentes a este plugin.                                                                                                                                                                                               |
| `providerDiscoveryEntry`             | Não         | `string`                         | Caminho leve do módulo de descoberta de provedores, relativo à raiz do plugin, para metadados de catálogo de provedores com escopo de manifesto que podem ser carregados sem ativar o runtime completo do plugin.                          |
| `modelSupport`                       | Não         | `object`                         | Metadados abreviados de família de modelos pertencentes ao manifesto, usados para carregar automaticamente o plugin antes do runtime.                                                                                                       |
| `modelCatalog`                       | Não         | `object`                         | Metadados declarativos de catálogo de modelos para provedores pertencentes a este plugin. Este é o contrato do plano de controle para futura listagem somente leitura, onboarding, seletores de modelo, aliases e supressão sem carregar o runtime do plugin. |
| `modelPricing`                       | Não         | `object`                         | Política de consulta de preços externos pertencente ao provedor. Use-a para excluir provedores locais/auto-hospedados de catálogos de preços remotos ou mapear refs de provedores para ids de catálogo OpenRouter/LiteLLM sem codificar ids de provedores no núcleo. |
| `modelIdNormalization`               | Não         | `object`                         | Limpeza de alias/prefixo de id de modelo pertencente ao provedor que deve ser executada antes do runtime do provedor carregar.                                                                                                              |
| `providerEndpoints`                  | Não         | `object[]`                       | Metadados de host/baseUrl de endpoints pertencentes ao manifesto para rotas de provedores que o núcleo deve classificar antes do runtime do provedor carregar.                                                                              |
| `providerRequest`                    | Não         | `object`                         | Metadados leves de família de provedores e compatibilidade de requisições usados pela política genérica de requisições antes do runtime do provedor carregar.                                                                               |
| `cliBackends`                        | Não         | `string[]`                       | Ids de backends de inferência da CLI pertencentes a este plugin. Usado para autoativação na inicialização a partir de refs explícitas de configuração.                                                                                      |
| `syntheticAuthRefs`                  | Não         | `string[]`                       | Refs de provedor ou backend da CLI cujo hook de auth sintético pertencente ao plugin deve ser sondado durante a descoberta fria de modelos antes do runtime carregar.                                                                       |
| `nonSecretAuthMarkers`               | Não         | `string[]`                       | Valores de chave de API de placeholder pertencentes ao plugin incluído que representam estado de credenciais não secretas locais, OAuth ou de ambiente.                                                                                     |
| `commandAliases`                     | Não         | `object[]`                       | Nomes de comandos pertencentes a este plugin que devem produzir diagnósticos de configuração e CLI cientes do plugin antes do runtime carregar.                                                                                             |
| `providerAuthEnvVars`                | Não         | `Record<string, string[]>`       | Metadados de env de compatibilidade obsoletos para consulta de auth/status de provedores. Prefira `setup.providers[].envVars` para novos plugins; o OpenClaw ainda lê isto durante a janela de descontinuação.                             |
| `providerAuthAliases`                | Não         | `Record<string, string>`         | Ids de provedores que devem reutilizar outro id de provedor para consulta de auth, por exemplo um provedor de codificação que compartilha a chave de API e os perfis de auth do provedor base.                                            |
| `channelEnvVars`                     | Não         | `Record<string, string[]>`       | Metadados leves de env de canal que o OpenClaw pode inspecionar sem carregar código do plugin. Use isto para configuração de canal orientada por env ou superfícies de auth que helpers genéricos de inicialização/configuração devem ver. |
| `providerAuthChoices`                | Não         | `object[]`                       | Metadados leves de escolhas de auth para seletores de onboarding, resolução de provedor preferido e ligação simples de flags da CLI.                                                                                                       |
| `activation`                         | Não         | `object`                         | Metadados leves do planejador de ativação para carregamento acionado por inicialização, provedor, comando, canal, rota e capability. Apenas metadados; o runtime do plugin ainda detém o comportamento real.                              |
| `setup`                              | Não         | `object`                         | Descritores leves de setup/onboarding que superfícies de descoberta e setup podem inspecionar sem carregar o runtime do plugin.                                                                                                            |
| `qaRunners`                          | Não         | `object[]`                       | Descritores leves de executores de QA usados pelo host compartilhado `openclaw qa` antes do runtime do plugin carregar.                                                                                                                    |
| `contracts`                          | Não         | `object`                         | Snapshot estático de propriedade de capabilities para hooks de auth externos, fala, transcrição em tempo real, voz em tempo real, entendimento de mídia, geração de imagens, geração de música, geração de vídeo, web-fetch, pesquisa na web e propriedade de ferramentas. |
| `mediaUnderstandingProviderMetadata` | Não         | `Record<string, object>`         | Padrões leves de entendimento de mídia para ids de provedores declarados em `contracts.mediaUnderstandingProviders`.                                                                                                                        |
| `imageGenerationProviderMetadata`    | Não         | `Record<string, object>`         | Metadados leves de auth de geração de imagens para ids de provedores declarados em `contracts.imageGenerationProviders`, incluindo aliases de auth e proteções de base-url pertencentes ao provedor.                                     |
| `videoGenerationProviderMetadata`    | Não         | `Record<string, object>`         | Metadados leves de auth de geração de vídeo para ids de provedores declarados em `contracts.videoGenerationProviders`, incluindo aliases de auth e proteções de base-url pertencentes ao provedor.                                       |
| `musicGenerationProviderMetadata`    | Não         | `Record<string, object>`         | Metadados leves de auth de geração de música para ids de provedores declarados em `contracts.musicGenerationProviders`, incluindo aliases de auth e proteções de base-url pertencentes ao provedor.                                     |
| `toolMetadata`                       | Não         | `Record<string, object>`         | Metadados leves de disponibilidade para ferramentas pertencentes ao plugin declaradas em `contracts.tools`. Use-os quando uma ferramenta não deve carregar o runtime a menos que existam evidências de configuração, env ou auth.         |
| `channelConfigs`                     | Não         | `Record<string, object>`         | Metadados de configuração de canal pertencentes ao manifesto, mesclados às superfícies de descoberta e validação antes do runtime carregar.                                                                                                |
| `skills`                             | Não         | `string[]`                       | Diretórios de Skill a carregar, relativos à raiz do plugin.                                                                                                                                                                                |
| `name`                               | Não         | `string`                         | Nome do plugin legível para humanos.                                                                                                                                                                                                       |
| `description`                        | Não      | `string`                         | Resumo curto exibido nas superfícies de Plugin.                                                                                                                                                                                     |
| `version`                            | Não      | `string`                         | Versão informativa do Plugin.                                                                                                                                                                                                       |
| `uiHints`                            | Não      | `Record<string, object>`         | Rótulos da interface, textos de espaço reservado e indicações de sensibilidade para campos de configuração.                                                                                                                         |

## Referência de metadados de provedores de geração

Os campos de metadados de provedores de geração descrevem sinais estáticos de autenticação para
provedores declarados na lista `contracts.*GenerationProviders` correspondente.
O OpenClaw lê esses campos antes que o runtime do provedor seja carregado, para que as ferramentas principais possam
decidir se um provedor de geração está disponível sem importar todos os
Plugins de provedor.

Use esses campos apenas para fatos baratos e declarativos. Transporte, transformações de
requisição, renovação de token, validação de credenciais e comportamento real de geração
ficam no runtime do Plugin.

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

Cada entrada de metadados oferece suporte a:

| Campo           | Obrigatório | Tipo       | O que significa                                                                                                                       |
| --------------- | ----------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | Não         | `string[]` | IDs adicionais de provedor que devem contar como aliases estáticos de autenticação para o provedor de geração.                         |
| `authProviders` | Não         | `string[]` | IDs de provedor cujos perfis de autenticação configurados devem contar como autenticação para este provedor de geração.                |
| `configSignals` | Não         | `object[]` | Sinais baratos de disponibilidade baseados apenas em configuração para provedores locais ou auto-hospedados que podem ser configurados sem perfis de autenticação nem env vars. |
| `authSignals`   | Não         | `object[]` | Sinais explícitos de autenticação. Quando presentes, eles substituem o conjunto de sinais padrão do ID do provedor, `aliases` e `authProviders`. |

Cada entrada de `configSignals` oferece suporte a:

| Campo         | Obrigatório | Tipo       | O que significa                                                                                                                                                                           |
| ------------- | ----------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | Sim         | `string`   | Caminho com pontos para o objeto de configuração pertencente ao Plugin a ser inspecionado, por exemplo `plugins.entries.example.config`.                                                  |
| `overlayPath` | Não         | `string`   | Caminho com pontos dentro da configuração raiz cujo objeto deve sobrepor o objeto raiz antes de avaliar o sinal. Use isto para configuração específica de capacidade, como `image`, `video` ou `music`. |
| `required`    | Não         | `string[]` | Caminhos com pontos dentro da configuração efetiva que precisam ter valores configurados. Strings não podem ser vazias; objetos e arrays não podem ser vazios.                            |
| `requiredAny` | Não         | `string[]` | Caminhos com pontos dentro da configuração efetiva em que pelo menos um precisa ter um valor configurado.                                                                                 |
| `mode`        | Não         | `object`   | Guarda opcional de modo em string dentro da configuração efetiva. Use isto quando a disponibilidade baseada apenas em configuração se aplicar somente a um modo.                          |

Cada guarda de `mode` oferece suporte a:

| Campo        | Obrigatório | Tipo       | O que significa                                                                      |
| ------------ | ----------- | ---------- | ------------------------------------------------------------------------------------ |
| `path`       | Não         | `string`   | Caminho com pontos dentro da configuração efetiva. O padrão é `mode`.                |
| `default`    | Não         | `string`   | Valor de modo a ser usado quando a configuração omite o caminho.                     |
| `allowed`    | Não         | `string[]` | Se presente, o sinal passa somente quando o modo efetivo é um destes valores.        |
| `disallowed` | Não         | `string[]` | Se presente, o sinal falha quando o modo efetivo é um destes valores.                |

Cada entrada de `authSignals` oferece suporte a:

| Campo             | Obrigatório | Tipo     | O que significa                                                                                                                                                                 |
| ----------------- | ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sim         | `string` | ID do provedor a ser verificado nos perfis de autenticação configurados.                                                                                                        |
| `providerBaseUrl` | Não         | `object` | Guarda opcional que faz o sinal contar somente quando o provedor configurado referenciado usa uma URL base permitida. Use isto quando um alias de autenticação é válido apenas para determinadas APIs. |

Cada guarda de `providerBaseUrl` oferece suporte a:

| Campo             | Obrigatório | Tipo       | O que significa                                                                                                                                       |
| ----------------- | ----------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sim         | `string`   | ID de configuração do provedor cujo `baseUrl` deve ser verificado.                                                                                    |
| `defaultBaseUrl`  | Não         | `string`   | URL base a assumir quando a configuração do provedor omite `baseUrl`.                                                                                 |
| `allowedBaseUrls` | Sim         | `string[]` | URLs base permitidas para este sinal de autenticação. O sinal é ignorado quando a URL base configurada ou padrão não corresponde a um destes valores normalizados. |

## Referência de metadados de ferramentas

`toolMetadata` usa os mesmos formatos de `configSignals` e `authSignals` que os
metadados de provedores de geração, indexados pelo nome da ferramenta. `contracts.tools` declara
a propriedade. `toolMetadata` declara evidências baratas de disponibilidade para que o OpenClaw possa
evitar importar um runtime de Plugin apenas para que sua factory de ferramentas retorne `null`.

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
carrega o Plugin proprietário quando o contrato da ferramenta corresponde à política. Para ferramentas de hot-path
cuja factory depende de autenticação/configuração, autores de Plugin devem declarar
`toolMetadata` em vez de fazer o core importar o runtime para perguntar.

## Referência de providerAuthChoices

Cada entrada de `providerAuthChoices` descreve uma escolha de onboarding ou autenticação.
O OpenClaw lê isto antes que o runtime do provedor seja carregado.
Listas de configuração de provedor usam essas escolhas de manifesto, escolhas de configuração
derivadas de descritores e metadados de catálogo de instalação sem carregar o runtime do provedor.

| Campo                 | Obrigatório | Tipo                                            | O que significa                                                                                            |
| --------------------- | ----------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `provider`            | Sim         | `string`                                        | ID do provedor ao qual esta escolha pertence.                                                              |
| `method`              | Sim         | `string`                                        | ID do método de autenticação para o qual despachar.                                                        |
| `choiceId`            | Sim         | `string`                                        | ID estável da escolha de autenticação usado por fluxos de onboarding e CLI.                                |
| `choiceLabel`         | Não         | `string`                                        | Rótulo voltado ao usuário. Se omitido, o OpenClaw usa `choiceId` como fallback.                            |
| `choiceHint`          | Não         | `string`                                        | Texto breve de ajuda para o seletor.                                                                       |
| `assistantPriority`   | Não         | `number`                                        | Valores menores são ordenados antes em seletores interativos conduzidos por assistente.                    |
| `assistantVisibility` | Não         | `"visible"` \| `"manual-only"`                  | Oculta a escolha de seletores de assistente enquanto ainda permite seleção manual pela CLI.                |
| `deprecatedChoiceIds` | Não         | `string[]`                                      | IDs legados de escolha que devem redirecionar usuários para esta escolha substituta.                       |
| `groupId`             | Não         | `string`                                        | ID opcional de grupo para agrupar escolhas relacionadas.                                                   |
| `groupLabel`          | Não         | `string`                                        | Rótulo voltado ao usuário para esse grupo.                                                                 |
| `groupHint`           | Não         | `string`                                        | Texto breve de ajuda para o grupo.                                                                         |
| `optionKey`           | Não         | `string`                                        | Chave de opção interna para fluxos simples de autenticação com uma única flag.                             |
| `cliFlag`             | Não         | `string`                                        | Nome da flag de CLI, como `--openrouter-api-key`.                                                          |
| `cliOption`           | Não         | `string`                                        | Formato completo da opção de CLI, como `--openrouter-api-key <key>`.                                       |
| `cliDescription`      | Não         | `string`                                        | Descrição usada na ajuda da CLI.                                                                           |
| `onboardingScopes`    | Não         | `Array<"text-inference" \| "image-generation">` | Em quais superfícies de onboarding esta escolha deve aparecer. Se omitido, o padrão é `["text-inference"]`. |

## Referência de commandAliases

Use `commandAliases` quando um Plugin possui um nome de comando de tempo de execução que os usuários podem
colocar por engano em `plugins.allow` ou tentar executar como um comando CLI raiz. O OpenClaw
usa esses metadados para diagnósticos sem importar código de tempo de execução do Plugin.

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
| `kind`       | Não         | `"runtime-slash"` | Marca o alias como um comando de barra de chat, em vez de um comando CLI raiz. |
| `cliCommand` | Não         | `string`          | Comando CLI raiz relacionado a sugerir para operações de CLI, se existir. |

## referência de activation

Use `activation` quando o Plugin puder declarar de forma econômica quais eventos do plano de controle
devem incluí-lo em um plano de ativação/carregamento.

Este bloco é metadado do planejador, não uma API de ciclo de vida. Ele não registra
comportamento de tempo de execução, não substitui `register(...)` e não promete que
o código do Plugin já foi executado. O planejador de ativação usa esses campos para
restringir Plugins candidatos antes de recorrer aos metadados de propriedade existentes
do manifesto, como `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` e hooks.

Prefira os metadados mais restritos que já descrevem a propriedade. Use
`providers`, `channels`, `commandAliases`, descritores de setup ou `contracts`
quando esses campos expressarem a relação. Use `activation` para dicas extras do planejador
que não possam ser representadas por esses campos de propriedade.
Use `cliBackends` de nível superior para aliases de tempo de execução da CLI, como `claude-cli`,
`codex-cli` ou `google-gemini-cli`; `activation.onAgentHarnesses` é apenas para
ids de harnesses de agentes incorporados que ainda não tenham um campo de propriedade.

Este bloco é apenas metadado. Ele não registra comportamento de tempo de execução e não
substitui `register(...)`, `setupEntry` ou outros pontos de entrada de tempo de execução/Plugin.
Os consumidores atuais o usam como uma dica de restrição antes de um carregamento mais amplo de Plugins, portanto
metadados de ativação ausentes que não sejam de inicialização geralmente custam apenas desempenho; isso
não deve alterar a correção enquanto os fallbacks de propriedade do manifesto ainda existirem.

Todo Plugin deve definir `activation.onStartup` intencionalmente. Defina como `true`
somente quando o Plugin precisar ser executado durante a inicialização do Gateway. Defina como `false` quando
o Plugin for inerte na inicialização e deve carregar apenas a partir de gatilhos mais restritos.
Omitir `onStartup` não carrega mais o Plugin implicitamente na inicialização; use metadados
de ativação explícitos para gatilhos de ativação de inicialização, canal, configuração, harness de agente, memória ou
outros gatilhos mais restritos.

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
| ------------------ | ----------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Não         | `boolean`                                            | Ativação explícita na inicialização do Gateway. Todo Plugin deve definir isto. `true` importa o Plugin durante a inicialização; `false` o mantém preguiçoso na inicialização, a menos que outro gatilho correspondente exija carregamento. |
| `onProviders`      | Não         | `string[]`                                           | Ids de provedores que devem incluir este Plugin em planos de ativação/carregamento.                                                                                                           |
| `onAgentHarnesses` | Não         | `string[]`                                           | Ids de tempo de execução de harnesses de agentes incorporados que devem incluir este Plugin em planos de ativação/carregamento. Use `cliBackends` de nível superior para aliases de backend de CLI. |
| `onCommands`       | Não         | `string[]`                                           | Ids de comandos que devem incluir este Plugin em planos de ativação/carregamento.                                                                                                             |
| `onChannels`       | Não         | `string[]`                                           | Ids de canais que devem incluir este Plugin em planos de ativação/carregamento.                                                                                                               |
| `onRoutes`         | Não         | `string[]`                                           | Tipos de rotas que devem incluir este Plugin em planos de ativação/carregamento.                                                                                                              |
| `onConfigPaths`    | Não         | `string[]`                                           | Caminhos de configuração relativos à raiz que devem incluir este Plugin em planos de inicialização/carregamento quando o caminho estiver presente e não estiver explicitamente desativado.      |
| `onCapabilities`   | Não         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Dicas amplas de capacidade usadas pelo planejamento de ativação do plano de controle. Prefira campos mais restritos quando possível.                                                           |

Consumidores ativos atuais:

- O planejamento de inicialização do Gateway usa `activation.onStartup` para importação
  explícita na inicialização
- o planejamento de CLI acionado por comando recorre ao legado
  `commandAliases[].cliCommand` ou `commandAliases[].name`
- o planejamento de inicialização do tempo de execução do agente usa `activation.onAgentHarnesses` para
  harnesses incorporados e `cliBackends[]` de nível superior para aliases de tempo de execução de CLI
- o planejamento de setup/canal acionado por canal recorre à propriedade legada de `channels[]`
  quando metadados explícitos de ativação de canal estão ausentes
- o planejamento de Plugins na inicialização usa `activation.onConfigPaths` para superfícies de configuração raiz
  que não sejam de canal, como o bloco `browser` do Plugin de navegador incluído
- o planejamento de setup/tempo de execução acionado por provedor recorre à propriedade legada de
  `providers[]` e `cliBackends[]` de nível superior quando metadados explícitos de ativação de provedor
  estão ausentes

Os diagnósticos do planejador podem distinguir dicas de ativação explícitas do fallback de propriedade
do manifesto. Por exemplo, `activation-command-hint` significa que
`activation.onCommands` correspondeu, enquanto `manifest-command-alias` significa que o
planejador usou a propriedade de `commandAliases` em vez disso. Esses rótulos de motivo são para
diagnósticos e testes do host; autores de Plugins devem continuar declarando os metadados
que melhor descrevem a propriedade.

## referência de qaRunners

Use `qaRunners` quando um Plugin contribuir com um ou mais executores de transporte abaixo
da raiz compartilhada `openclaw qa`. Mantenha esses metadados econômicos e estáticos; o tempo de execução do Plugin
ainda possui o registro real da CLI por meio de uma superfície leve
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
| ------------- | ----------- | -------- | -------------------------------------------------------------------- |
| `commandName` | Sim         | `string` | Subcomando montado abaixo de `openclaw qa`, por exemplo `matrix`.    |
| `description` | Não         | `string` | Texto de ajuda de fallback usado quando o host compartilhado precisa de um comando stub. |

## referência de setup

Use `setup` quando superfícies de setup e onboarding precisarem de metadados baratos pertencentes ao Plugin
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

`cliBackends` de nível superior continua válido e continua descrevendo backends de inferência
de CLI. `setup.cliBackends` é a superfície de descritor específica de setup para
fluxos de plano de controle/setup que devem permanecer apenas como metadados.

Quando presentes, `setup.providers` e `setup.cliBackends` são a superfície de consulta
preferencial baseada em descritor para descoberta de setup. Se o descritor apenas
restringir o Plugin candidato e o setup ainda precisar de hooks de tempo de execução de setup
mais ricos, defina `requiresRuntime: true` e mantenha `setup-api` como o
caminho de execução de fallback.

O OpenClaw também inclui `setup.providers[].envVars` em consultas genéricas de autenticação de provedor e
variáveis de ambiente. `providerAuthEnvVars` continua compatível por meio de um adaptador de compatibilidade
durante a janela de descontinuação, mas Plugins não incluídos que ainda o usam
recebem um diagnóstico de manifesto. Novos Plugins devem colocar metadados de ambiente de setup/status
em `setup.providers[].envVars`.

O OpenClaw também pode derivar escolhas simples de setup a partir de `setup.providers[].authMethods`
quando nenhuma entrada de setup estiver disponível, ou quando `setup.requiresRuntime: false`
declarar que o tempo de execução de setup é desnecessário. Entradas explícitas de `providerAuthChoices` continuam
preferenciais para rótulos personalizados, flags de CLI, escopo de onboarding e metadados do assistente.

Defina `requiresRuntime: false` somente quando esses descritores forem suficientes para a
superfície de setup. O OpenClaw trata `false` explícito como um contrato apenas por descritor
e não executará `setup-api` nem `openclaw.setupEntry` para consulta de setup. Se
um Plugin somente por descritor ainda enviar uma dessas entradas de tempo de execução de setup,
o OpenClaw relata um diagnóstico aditivo e continua ignorando-a. `requiresRuntime`
omitido mantém o comportamento de fallback legado para que Plugins existentes que adicionaram
descritores sem a flag não quebrem.

Como a consulta de setup pode executar código `setup-api` pertencente ao Plugin, os valores normalizados
de `setup.providers[].id` e `setup.cliBackends[]` devem permanecer únicos entre
Plugins descobertos. Propriedade ambígua falha de forma fechada em vez de escolher um
vencedor pela ordem de descoberta.

Quando o tempo de execução de setup é executado, os diagnósticos do registro de setup relatam desvio de descritor
se `setup-api` registrar um provedor ou backend de CLI que os descritores do manifesto
não declaram, ou se um descritor não tiver registro de tempo de execução
correspondente. Esses diagnósticos são aditivos e não rejeitam Plugins legados.

### referência de setup.providers

| Campo          | Obrigatório | Tipo       | O que significa                                                                                    |
| -------------- | ----------- | ---------- | -------------------------------------------------------------------------------------------------- |
| `id`           | Sim         | `string`   | Id de provedor exposto durante setup ou onboarding. Mantenha ids normalizados globalmente únicos.  |
| `authMethods`  | Não         | `string[]` | Ids de métodos de setup/autenticação compatíveis com este provedor sem carregar o tempo de execução completo. |
| `envVars`      | Não         | `string[]` | Variáveis de ambiente que superfícies genéricas de setup/status podem verificar antes do carregamento do tempo de execução do Plugin. |
| `authEvidence` | Não         | `object[]` | Verificações locais baratas de evidência de autenticação para provedores que podem autenticar por meio de marcadores não secretos. |

`authEvidence` é destinado a marcadores locais de credenciais pertencentes ao provedor que podem ser
verificados sem carregar código de tempo de execução. Essas verificações devem permanecer baratas e locais:
sem chamadas de rede, sem leituras de chaveiro ou gerenciador de segredos, sem comandos de shell e sem
sondagens de API de provedor.

Entradas de evidência compatíveis:

| Campo              | Obrigatório | Tipo       | O que significa                                                                                                               |
| ------------------ | ----------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `type`             | Sim         | `string`   | Atualmente `local-file-with-env`.                                                                                             |
| `fileEnvVar`       | Não         | `string`   | Variável de ambiente contendo um caminho explícito de arquivo de credenciais.                                                  |
| `fallbackPaths`    | Não         | `string[]` | Caminhos locais de arquivos de credenciais verificados quando `fileEnvVar` está ausente ou vazia. Compatível com `${HOME}` e `${APPDATA}`. |
| `requiresAnyEnv`   | Não         | `string[]` | Pelo menos uma variável de ambiente listada deve estar não vazia antes que a evidência seja válida.                            |
| `requiresAllEnv`   | Não         | `string[]` | Todas as variáveis de ambiente listadas devem estar não vazias antes que a evidência seja válida.                              |
| `credentialMarker` | Sim         | `string`   | Marcador não secreto retornado quando a evidência está presente.                                                               |
| `source`           | Não         | `string`   | Rótulo de origem voltado ao usuário para saída de autenticação/status.                                                         |

### campos de setup

| Campo              | Obrigatório | Tipo       | O que significa                                                                                                  |
| ------------------ | ----------- | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| `providers`        | Não         | `object[]` | Descritores de setup de provedores expostos durante o setup e a integração.                                      |
| `cliBackends`      | Não         | `string[]` | IDs de backends em tempo de setup usados para busca de setup priorizando descritor. Mantenha IDs normalizados globalmente únicos. |
| `configMigrations` | Não         | `string[]` | IDs de migração de configuração pertencentes à superfície de setup deste plugin.                                 |
| `requiresRuntime`  | Não         | `boolean`  | Se o setup ainda precisa da execução de `setup-api` após a busca por descritor.                                  |

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
| `help`        | `string`   | Texto curto de ajuda.                   |
| `tags`        | `string[]` | Tags opcionais de UI.                   |
| `advanced`    | `boolean`  | Marca o campo como avançado.            |
| `sensitive`   | `boolean`  | Marca o campo como secreto ou sensível. |
| `placeholder` | `string`   | Texto de placeholder para entradas de formulário. |

## referência de contracts

Use `contracts` somente para metadados estáticos de propriedade de capacidades que o OpenClaw pode
ler sem importar o tempo de execução do plugin.

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
| -------------------------------- | ---------- | ----------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | IDs de fábricas de extensão do servidor de app Codex, atualmente `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | IDs de tempo de execução para os quais um plugin incluído pode registrar middleware de resultado de ferramenta. |
| `externalAuthProviders`          | `string[]` | IDs de provedores cujo hook de perfil de autenticação externa pertence a este plugin. |
| `speechProviders`                | `string[]` | IDs de provedores de fala pertencentes a este plugin.                   |
| `realtimeTranscriptionProviders` | `string[]` | IDs de provedores de transcrição em tempo real pertencentes a este plugin. |
| `realtimeVoiceProviders`         | `string[]` | IDs de provedores de voz em tempo real pertencentes a este plugin.      |
| `memoryEmbeddingProviders`       | `string[]` | IDs de provedores de embeddings de memória pertencentes a este plugin.  |
| `mediaUnderstandingProviders`    | `string[]` | IDs de provedores de compreensão de mídia pertencentes a este plugin.   |
| `imageGenerationProviders`       | `string[]` | IDs de provedores de geração de imagem pertencentes a este plugin.      |
| `videoGenerationProviders`       | `string[]` | IDs de provedores de geração de vídeo pertencentes a este plugin.       |
| `webFetchProviders`              | `string[]` | IDs de provedores de busca Web pertencentes a este plugin.              |
| `webSearchProviders`             | `string[]` | IDs de provedores de pesquisa Web pertencentes a este plugin.           |
| `migrationProviders`             | `string[]` | IDs de provedores de importação pertencentes a este plugin para `openclaw migrate`. |
| `tools`                          | `string[]` | Nomes de ferramentas de agente pertencentes a este plugin.              |

`contracts.embeddedExtensionFactories` é mantido para fábricas de extensão incluídas exclusivas do
servidor de app Codex. Transformações incluídas de resultados de ferramentas devem
declarar `contracts.agentToolResultMiddleware` e registrar com
`api.registerAgentToolResultMiddleware(...)` em vez disso. Plugins externos não podem
registrar middleware de resultado de ferramenta porque a interface pode reescrever saída de ferramenta de alta confiança
antes que o modelo a veja.

Registros de tempo de execução `api.registerTool(...)` devem corresponder a `contracts.tools`.
A descoberta de ferramentas usa esta lista para carregar apenas os tempos de execução de plugins que podem ser donos das
ferramentas solicitadas.

Plugins de provedores que implementam `resolveExternalAuthProfiles` devem declarar
`contracts.externalAuthProviders`. Plugins sem a declaração ainda passam
por um fallback de compatibilidade obsoleto, mas esse fallback é mais lento e
será removido após a janela de migração.

Provedores incluídos de embeddings de memória devem declarar
`contracts.memoryEmbeddingProviders` para cada ID de adaptador que expõem, incluindo
adaptadores integrados como `local`. Caminhos de CLI independentes usam este contrato de manifesto
para carregar apenas o plugin proprietário antes que o tempo de execução completo do Gateway tenha
registrado provedores.

## referência de mediaUnderstandingProviderMetadata

Use `mediaUnderstandingProviderMetadata` quando um provedor de compreensão de mídia tiver
modelos padrão, prioridade de fallback de autenticação automática ou suporte nativo a documentos de que
helpers genéricos do núcleo precisam antes do carregamento do tempo de execução. As chaves também devem ser declaradas em
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

| Campo                  | Tipo                                | O que significa                                                                |
| ---------------------- | ----------------------------------- | ------------------------------------------------------------------------------ |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capacidades de mídia expostas por este provedor.                               |
| `defaultModels`        | `Record<string, string>`            | Padrões de capacidade para modelo usados quando a configuração não especifica um modelo. |
| `autoPriority`         | `Record<string, number>`            | Números menores são ordenados antes para fallback automático de provedor baseado em credenciais. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Entradas nativas de documento compatíveis com o provedor.                      |

## referência de channelConfigs

Use `channelConfigs` quando um plugin de canal precisar de metadados baratos de configuração antes que o
tempo de execução carregue. A descoberta somente leitura de setup/status de canal pode usar esses metadados
diretamente para canais externos configurados quando nenhuma entrada de setup está disponível, ou
quando `setup.requiresRuntime: false` declara que o tempo de execução de setup é desnecessário.

`channelConfigs` é metadado de manifesto do plugin, não uma nova seção de configuração de usuário de nível superior.
Usuários ainda configuram instâncias de canal em `channels.<channel-id>`.
O OpenClaw lê metadados de manifesto para decidir qual plugin é dono daquele canal configurado
antes que o código de tempo de execução do plugin execute.

Para um plugin de canal, `configSchema` e `channelConfigs` descrevem caminhos diferentes:

- `configSchema` valida `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valida `channels.<channel-id>`

Plugins não incluídos que declaram `channels[]` também devem declarar entradas
`channelConfigs` correspondentes. Sem elas, o OpenClaw ainda pode carregar o plugin, mas
o esquema de configuração em caminho frio, o setup e as superfícies da Control UI não conseguem saber o
formato das opções pertencentes ao canal até que o tempo de execução do plugin execute.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` e
`nativeSkillsAutoEnabled` podem declarar padrões estáticos `auto` para verificações de configuração de comandos
que rodam antes que o tempo de execução do canal carregue. Canais incluídos também podem publicar
os mesmos padrões por meio de `package.json#openclaw.channel.commands` junto com
seus outros metadados de catálogo de canal pertencentes ao pacote.

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

| Campo         | Tipo                     | O que significa                                                                             |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema para `channels.<id>`. Obrigatório para cada entrada declarada de configuração de canal.         |
| `uiHints`     | `Record<string, object>` | Rótulos/placeholders/dicas de sensibilidade opcionais da UI para essa seção de configuração de canal.          |
| `label`       | `string`                 | Rótulo do canal mesclado nas superfícies de seleção e inspeção quando os metadados de runtime não estão prontos. |
| `description` | `string`                 | Descrição curta do canal para superfícies de inspeção e catálogo.                               |
| `commands`    | `object`                 | Comando nativo estático e padrões automáticos de skill nativa para verificações de configuração pré-runtime.       |
| `preferOver`  | `string[]`               | IDs de plugins legados ou de menor prioridade que este canal deve superar nas superfícies de seleção.    |

### Substituindo outro plugin de canal

Use `preferOver` quando seu plugin for o proprietário preferencial de um ID de canal que
outro plugin também pode fornecer. Casos comuns são um ID de plugin renomeado, um
plugin independente que substitui um plugin empacotado, ou um fork mantido que
mantém o mesmo ID de canal para compatibilidade de configuração.

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

Quando `channels.chat` é configurado, o OpenClaw considera tanto o ID do canal quanto
o ID do plugin preferencial. Se o plugin de menor prioridade foi selecionado apenas porque
ele é empacotado ou habilitado por padrão, o OpenClaw o desabilita na configuração
efetiva de runtime para que um plugin seja proprietário do canal e de suas ferramentas. A seleção
explícita do usuário ainda prevalece: se o usuário habilitar explicitamente ambos os plugins, o OpenClaw
preserva essa escolha e relata diagnósticos de canais/ferramentas duplicados em vez de
alterar silenciosamente o conjunto de plugins solicitado.

Mantenha `preferOver` restrito a IDs de plugins que realmente podem fornecer o mesmo canal.
Ele não é um campo geral de prioridade e não renomeia chaves de configuração do usuário.

## Referência de modelSupport

Use `modelSupport` quando o OpenClaw deve inferir seu plugin de provedor a partir de
IDs abreviados de modelo como `gpt-5.5` ou `claude-sonnet-4.6` antes que o runtime do plugin
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

- referências explícitas `provider/model` usam os metadados de manifesto `providers` do proprietário
- `modelPatterns` prevalecem sobre `modelPrefixes`
- se um plugin não empacotado e um plugin empacotado corresponderem, o plugin não empacotado
  prevalece
- a ambiguidade restante é ignorada até que o usuário ou a configuração especifique um provedor

Campos:

| Campo           | Tipo       | O que significa                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefixos correspondidos com `startsWith` em IDs abreviados de modelo.                 |
| `modelPatterns` | `string[]` | Fontes de regex correspondidas em IDs abreviados de modelo após a remoção do sufixo de perfil. |

## Referência de modelCatalog

Use `modelCatalog` quando o OpenClaw deve conhecer metadados de modelo do provedor antes de
carregar o runtime do plugin. Esta é a fonte pertencente ao manifesto para linhas fixas de catálogo,
aliases de provedor, regras de supressão e modo de descoberta. A atualização em runtime
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

| Campo          | Tipo                                                     | O que significa                                                                                               |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Linhas de catálogo para IDs de provedores pertencentes a este plugin. As chaves também devem aparecer em `providers` de nível superior.       |
| `aliases`      | `Record<string, object>`                                 | Aliases de provedor que devem resolver para um provedor proprietário para planejamento de catálogo ou supressão.              |
| `suppressions` | `object[]`                                               | Linhas de modelo de outra fonte que este plugin suprime por uma razão específica do provedor.                  |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Se o catálogo do provedor pode ser lido dos metadados do manifesto, atualizado no cache ou requer runtime. |

`aliases` participa da busca de propriedade do provedor para planejamento de catálogo de modelos.
Os destinos de alias devem ser provedores de nível superior pertencentes ao mesmo plugin. Quando uma
lista filtrada por provedor usa um alias, o OpenClaw pode ler o manifesto proprietário e
aplicar substituições de API/base URL do alias sem carregar o runtime do provedor.
Aliases não expandem listagens de catálogo sem filtro; listas amplas emitem apenas as linhas do
provedor canônico proprietário.

`suppressions` substitui o antigo hook de runtime do provedor `suppressBuiltInModel`.
As entradas de supressão são respeitadas apenas quando o provedor pertence ao plugin ou é
declarado como uma chave `modelCatalog.aliases` que aponta para um provedor proprietário. Hooks de
supressão de runtime não são mais chamados durante a resolução de modelos.

Campos do provedor:

| Campo     | Tipo                     | O que significa                                                     |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | Base URL padrão opcional para modelos neste catálogo de provedor.    |
| `api`     | `ModelApi`               | Adaptador de API padrão opcional para modelos neste catálogo de provedor. |
| `headers` | `Record<string, string>` | Cabeçalhos estáticos opcionais que se aplicam a este catálogo de provedor.      |
| `models`  | `object[]`               | Linhas de modelo obrigatórias. Linhas sem um `id` são ignoradas.            |

Campos do modelo:

| Campo           | Tipo                                                           | O que significa                                                               |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | ID de modelo local ao provedor, sem o prefixo `provider/`.                    |
| `name`          | `string`                                                       | Nome de exibição opcional.                                                      |
| `api`           | `ModelApi`                                                     | Substituição opcional de API por modelo.                                            |
| `baseUrl`       | `string`                                                       | Substituição opcional de base URL por modelo.                                       |
| `headers`       | `Record<string, string>`                                       | Cabeçalhos estáticos opcionais por modelo.                                          |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalidades que o modelo aceita.                                               |
| `reasoning`     | `boolean`                                                      | Se o modelo expõe comportamento de raciocínio.                               |
| `contextWindow` | `number`                                                       | Janela de contexto nativa do provedor.                                             |
| `contextTokens` | `number`                                                       | Limite efetivo opcional de contexto em runtime quando diferente de `contextWindow`. |
| `maxTokens`     | `number`                                                       | Máximo de tokens de saída quando conhecido.                                           |
| `cost`          | `object`                                                       | Preço opcional em USD por milhão de tokens, incluindo `tieredPricing` opcional. |
| `compat`        | `object`                                                       | Flags opcionais de compatibilidade que correspondem à compatibilidade de configuração de modelo do OpenClaw.  |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Status da listagem. Suprima apenas quando a linha não deve aparecer de forma alguma.          |
| `statusReason`  | `string`                                                       | Razão opcional exibida com status não disponível.                            |
| `replaces`      | `string[]`                                                     | IDs de modelo locais ao provedor mais antigos que este modelo substitui.                       |
| `replacedBy`    | `string`                                                       | ID de modelo local ao provedor substituto para linhas obsoletas.                    |
| `tags`          | `string[]`                                                     | Tags estáveis usadas por seletores e filtros.                                    |

Campos de supressão:

| Campo                      | Tipo       | O que significa                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | ID do provedor para a linha upstream a suprimir. Deve pertencer a este plugin ou ser declarado como um alias proprietário. |
| `model`                    | `string`   | ID de modelo local ao provedor a suprimir.                                                                      |
| `reason`                   | `string`   | Mensagem opcional exibida quando a linha suprimida é solicitada diretamente.                                     |
| `when.baseUrlHosts`        | `string[]` | Lista opcional de hosts efetivos da base URL do provedor necessários antes que a supressão se aplique.               |
| `when.providerConfigApiIn` | `string[]` | Lista opcional de valores exatos `api` de configuração do provedor necessários antes que a supressão se aplique.              |

Não coloque dados somente de runtime em `modelCatalog`. Use `static` somente quando as
linhas do manifesto forem completas o suficiente para que superfícies de lista e
seletor filtradas por provedor possam pular a descoberta por registro/runtime.
Use `refreshable` quando as linhas do manifesto forem sementes listáveis ou
suplementos úteis, mas uma atualização/cache puder adicionar mais linhas depois;
linhas atualizáveis não são autoritativas por si só. Use `runtime` quando o OpenClaw
precisar carregar o runtime do provedor para conhecer a lista.

## Referência de modelIdNormalization

Use `modelIdNormalization` para uma limpeza barata de IDs de modelo controlada
pelo provedor que deve acontecer antes do runtime do provedor carregar. Isso mantém
aliases como nomes curtos de modelo, IDs legados locais do provedor e regras de
prefixo de proxy no manifesto do plugin proprietário, em vez de em tabelas
centrais de seleção de modelo.

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
| `aliases`                            | `Record<string,string>` | Aliases exatos de IDs de modelo sem diferenciação entre maiúsculas e minúsculas. Os valores são retornados como escritos. |
| `stripPrefixes`                      | `string[]`              | Prefixos a remover antes da busca de aliases, úteis para duplicação legada de provedor/modelo. |
| `prefixWhenBare`                     | `string`                | Prefixo a adicionar quando o ID de modelo normalizado ainda não contém `/`.             |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Regras condicionais de prefixo para IDs sem barra após a busca de aliases, indexadas por `modelPrefix` e `prefix`. |

## Referência de providerEndpoints

Use `providerEndpoints` para classificação de endpoints que a política genérica
de requisições deve conhecer antes do runtime do provedor carregar. O núcleo ainda
controla o significado de cada `endpointClass`; os manifestos de plugin controlam
os metadados de host e URL base.

Campos de endpoint:

| Campo                          | Tipo       | O que significa                                                                              |
| ------------------------------ | ---------- | -------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Classe de endpoint conhecida pelo núcleo, como `openrouter`, `moonshot-native` ou `google-vertex`. |
| `hosts`                        | `string[]` | Nomes de host exatos que mapeiam para a classe de endpoint.                                  |
| `hostSuffixes`                 | `string[]` | Sufixos de host que mapeiam para a classe de endpoint. Prefixe com `.` para correspondência apenas por sufixo de domínio. |
| `baseUrls`                     | `string[]` | URLs base HTTP(S) normalizadas exatas que mapeiam para a classe de endpoint.                 |
| `googleVertexRegion`           | `string`   | Região estática do Google Vertex para hosts globais exatos.                                  |
| `googleVertexRegionHostSuffix` | `string`   | Sufixo a remover de hosts correspondentes para expor o prefixo de região do Google Vertex.   |

## Referência de providerRequest

Use `providerRequest` para metadados baratos de compatibilidade de requisições
de que a política genérica de requisições precisa sem carregar o runtime do
provedor. Mantenha reescritas de payload específicas de comportamento em hooks
de runtime do provedor ou helpers compartilhados da família do provedor.

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

| Campo                 | Tipo         | O que significa                                                                      |
| --------------------- | ------------ | ------------------------------------------------------------------------------------ |
| `family`              | `string`     | Rótulo da família do provedor usado por decisões genéricas de compatibilidade de requisições e diagnósticos. |
| `compatibilityFamily` | `"moonshot"` | Bucket opcional de compatibilidade da família do provedor para helpers compartilhados de requisição. |
| `openAICompletions`   | `object`     | Flags de requisições de completions compatíveis com OpenAI, atualmente `supportsStreamingUsage`. |

## Referência de modelPricing

Use `modelPricing` quando um provedor precisar de comportamento de precificação
do plano de controle antes do runtime carregar. O cache de preços do Gateway lê
esses metadados sem importar código de runtime do provedor.

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

| Campo        | Tipo              | O que significa                                                                                  |
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------ |
| `external`   | `boolean`         | Defina como `false` para provedores locais/auto-hospedados que nunca devem buscar preços do OpenRouter ou LiteLLM. |
| `openRouter` | `false \| object` | Mapeamento de busca de preços do OpenRouter. `false` desativa a busca no OpenRouter para este provedor. |
| `liteLLM`    | `false \| object` | Mapeamento de busca de preços do LiteLLM. `false` desativa a busca no LiteLLM para este provedor. |

Campos de origem:

| Campo                      | Tipo               | O que significa                                                                                              |
| -------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------ |
| `provider`                 | `string`           | ID do provedor no catálogo externo quando ele difere do ID do provedor no OpenClaw, por exemplo `z-ai` para um provedor `zai`. |
| `passthroughProviderModel` | `boolean`          | Trate IDs de modelo que contêm barra como referências aninhadas de provedor/modelo, útil para provedores proxy como OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Variantes extras de ID de modelo do catálogo externo. `version-dots` tenta IDs de versão com pontos, como `claude-opus-4.6`. |

### Índice de Provedores do OpenClaw

O Índice de Provedores do OpenClaw é um metadado de pré-visualização controlado
pelo OpenClaw para provedores cujos plugins talvez ainda não estejam instalados.
Ele não faz parte de um manifesto de plugin. Os manifestos de plugin continuam
sendo a autoridade do plugin instalado. O Índice de Provedores é o contrato
interno de fallback que futuras superfícies de seleção de modelo para provedores
instaláveis e pré-instalação consumirão quando um plugin de provedor não estiver
instalado.

Ordem de autoridade do catálogo:

1. Configuração do usuário.
2. `modelCatalog` do manifesto do plugin instalado.
3. Cache de catálogo de modelos de atualização explícita.
4. Linhas de pré-visualização do Índice de Provedores do OpenClaw.

O Índice de Provedores não deve conter segredos, estado habilitado, hooks de
runtime ou dados de modelo específicos de conta em tempo real. Seus catálogos de
pré-visualização usam o mesmo formato de linha de provedor de `modelCatalog` que
os manifestos de plugin, mas devem permanecer limitados a metadados estáveis de
exibição, a menos que campos de adaptador de runtime como `api`, `baseUrl`,
preços ou flags de compatibilidade sejam mantidos intencionalmente alinhados ao
manifesto do plugin instalado. Provedores com descoberta `/models` em tempo real
devem escrever linhas atualizadas pelo caminho explícito de cache de catálogo de
modelos, em vez de fazer listagens normais ou onboarding chamarem APIs do provedor.

Entradas do Índice de Provedores também podem carregar metadados de plugin
instalável para provedores cujo plugin saiu do núcleo ou que, de outra forma,
ainda não esteja instalado. Esses metadados espelham o padrão de catálogo de
canais: nome do pacote, especificação de instalação npm, integridade esperada e
rótulos baratos de escolha de autenticação são suficientes para mostrar uma opção
de configuração instalável. Depois que o plugin é instalado, seu manifesto vence
e a entrada do Índice de Provedores é ignorada para esse provedor.

Chaves legadas de capacidade no nível superior foram descontinuadas. Use
`openclaw doctor --fix` para mover `speechProviders`,
`realtimeTranscriptionProviders`, `realtimeVoiceProviders`,
`mediaUnderstandingProviders`, `imageGenerationProviders`,
`videoGenerationProviders`, `webFetchProviders` e `webSearchProviders` para
dentro de `contracts`; o carregamento normal de manifestos não trata mais esses
campos de nível superior como propriedade de capacidades.

## Manifesto versus package.json

Os dois arquivos têm funções diferentes:

| Arquivo                | Use para                                                                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Descoberta, validação de configuração, metadados de escolha de autenticação e dicas de UI que devem existir antes do código do plugin executar |
| `package.json`         | Metadados npm, instalação de dependências e o bloco `openclaw` usado para pontos de entrada, bloqueio de instalação, configuração ou metadados de catálogo |

Se você não tiver certeza de onde um metadado pertence, use esta regra:

- se o OpenClaw precisar conhecê-lo antes de carregar o código do plugin, coloque-o em `openclaw.plugin.json`
- se for sobre empacotamento, arquivos de entrada ou comportamento de instalação npm, coloque-o em `package.json`

### Campos de package.json que afetam a descoberta

Alguns metadados de plugin pré-runtime ficam intencionalmente em `package.json`
dentro do bloco `openclaw`, em vez de `openclaw.plugin.json`.

Exemplos importantes:

| Campo                                                             | O que significa                                                                                                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Declara pontos de entrada de Plugin nativos. Deve permanecer dentro do diretório do pacote do Plugin.                                                                                                   |
| `openclaw.runtimeExtensions`                                      | Declara pontos de entrada de runtime JavaScript compilados para pacotes instalados. Deve permanecer dentro do diretório do pacote do Plugin.                                                                 |
| `openclaw.setupEntry`                                             | Ponto de entrada leve apenas para configuração, usado durante onboarding, inicialização adiada de canais e descoberta de status de canal/SecretRef somente leitura. Deve permanecer dentro do diretório do pacote do Plugin. |
| `openclaw.runtimeSetupEntry`                                      | Declara o ponto de entrada de configuração JavaScript compilado para pacotes instalados. Requer `setupEntry`, deve existir e deve permanecer dentro do diretório do pacote do Plugin.                         |
| `openclaw.channel`                                                | Metadados baratos de catálogo de canais, como rótulos, caminhos de documentação, aliases e texto de seleção.                                                                                                 |
| `openclaw.channel.commands`                                       | Metadados estáticos de comando nativo e padrão automático de skill nativa usados por configuração, auditoria e superfícies de lista de comandos antes do carregamento do runtime do canal.                                          |
| `openclaw.channel.configuredState`                                | Metadados leves de verificador de estado configurado que conseguem responder "a configuração somente por env já existe?" sem carregar o runtime completo do canal.                                         |
| `openclaw.channel.persistedAuthState`                             | Metadados leves de verificador de autenticação persistida que conseguem responder "algo já está autenticado?" sem carregar o runtime completo do canal.                                               |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Dicas de instalação/atualização para plugins empacotados e publicados externamente.                                                                                                                   |
| `openclaw.install.defaultChoice`                                  | Caminho de instalação preferencial quando várias fontes de instalação estão disponíveis.                                                                                                                  |
| `openclaw.install.minHostVersion`                                 | Versão mínima compatível do host OpenClaw, usando um piso semver como `>=2026.3.22` ou `>=2026.5.1-beta.1`.                                                                             |
| `openclaw.install.expectedIntegrity`                              | String de integridade esperada da distribuição npm, como `sha512-...`; os fluxos de instalação e atualização verificam o artefato obtido contra ela.                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                     | Permite um caminho estreito de recuperação por reinstalação de Plugin empacotado quando a configuração é inválida.                                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permite que superfícies de canal apenas de configuração carreguem antes do Plugin de canal completo durante a inicialização.                                                                                                 |

Os metadados do manifesto decidem quais escolhas de provedor/canal/configuração aparecem no
onboarding antes do carregamento do runtime. `package.json#openclaw.install` informa ao
onboarding como buscar ou habilitar esse Plugin quando o usuário escolhe uma dessas
opções. Não mova dicas de instalação para `openclaw.plugin.json`.

`openclaw.install.minHostVersion` é aplicado durante a instalação e o carregamento do
registro de manifestos para fontes de Plugin não empacotadas. Valores inválidos são rejeitados;
valores mais novos, porém válidos, ignoram plugins externos em hosts mais antigos. Plugins de origem
empacotados são presumidos como co-versionados com o checkout do host.

A fixação exata de versão npm já fica em `npmSpec`, por exemplo
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Entradas oficiais de catálogo externo
devem parear especificações exatas com `expectedIntegrity` para que fluxos de atualização falhem
fechados se o artefato npm obtido não corresponder mais ao lançamento fixado.
O onboarding interativo ainda oferece especificações npm de registro confiável, incluindo nomes
de pacote simples e dist-tags, por compatibilidade. Diagnósticos de catálogo conseguem
distinguir fontes exatas, flutuantes, fixadas por integridade, sem integridade, com incompatibilidade
de nome de pacote e com escolha padrão inválida. Eles também alertam quando
`expectedIntegrity` está presente, mas não há uma fonte npm válida que ele possa fixar.
Quando `expectedIntegrity` está presente,
os fluxos de instalação/atualização o aplicam; quando ele é omitido, a resolução do registro é
registrada sem uma fixação de integridade.

Plugins de canal devem fornecer `openclaw.setupEntry` quando verificações de status, lista de canais
ou SecretRef precisarem identificar contas configuradas sem carregar o runtime completo.
A entrada de configuração deve expor metadados de canal mais adaptadores seguros para configuração,
status e segredos; mantenha clientes de rede, listeners de Gateway e
runtimes de transporte no ponto de entrada principal da extensão.

Campos de ponto de entrada de runtime não substituem verificações de limite de pacote para campos
de ponto de entrada de origem. Por exemplo, `openclaw.runtimeExtensions` não consegue tornar carregável
um caminho `openclaw.extensions` que escape.

`openclaw.install.allowInvalidConfigRecovery` é intencionalmente estreito. Ele não torna
configurações arbitrariamente quebradas instaláveis. Hoje ele só permite que fluxos de instalação
se recuperem de falhas específicas antigas de upgrade de Plugin empacotado, como um
caminho ausente de Plugin empacotado ou uma entrada `channels.<id>` obsoleta para esse mesmo
Plugin empacotado. Erros de configuração não relacionados ainda bloqueiam a instalação e enviam operadores
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
sondagem barata sim/não de autenticação antes que o Plugin de canal completo carregue. Estado de autenticação persistido não é
estado de canal configurado: não use esses metadados para habilitar plugins automaticamente,
reparar dependências de runtime ou decidir se um runtime de canal deve carregar.
A exportação de destino deve ser uma função pequena que leia apenas o estado persistido; não
a roteie pelo barrel do runtime completo do canal.

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

Use-o quando um canal puder responder estado configurado a partir de env ou outras entradas
minúsculas não runtime. Se a verificação precisar de resolução completa de configuração ou do runtime
real do canal, mantenha essa lógica no hook `config.hasConfiguredState`
do Plugin.

## Precedência de descoberta (ids de Plugin duplicados)

O OpenClaw descobre plugins a partir de várias raízes (empacotados, instalação global, workspace, caminhos selecionados explicitamente pela configuração). Se duas descobertas compartilharem o mesmo `id`, somente o manifesto de **maior precedência** será mantido; duplicatas de precedência inferior são descartadas em vez de carregarem ao lado dele.

Precedência, da maior para a menor:

1. **Selecionado pela configuração** — um caminho explicitamente fixado em `plugins.entries.<id>`
2. **Empacotado** — plugins distribuídos com o OpenClaw
3. **Instalação global** — plugins instalados na raiz global de plugins do OpenClaw
4. **Workspace** — plugins descobertos em relação ao workspace atual

Implicações:

- Uma cópia bifurcada ou obsoleta de um Plugin empacotado localizada no workspace não sombreará a build empacotada.
- Para realmente substituir um Plugin empacotado por um local, fixe-o via `plugins.entries.<id>` para que ele vença por precedência em vez de depender da descoberta do workspace.
- Descartes de duplicatas são registrados para que o Doctor e os diagnósticos de inicialização possam apontar para a cópia descartada.

## Requisitos de JSON Schema

- **Todo Plugin deve distribuir um JSON Schema**, mesmo que não aceite configuração.
- Um schema vazio é aceitável (por exemplo, `{ "type": "object", "additionalProperties": false }`).
- Schemas são validados no momento de leitura/gravação da configuração, não em runtime.

## Comportamento de validação

- Chaves `channels.*` desconhecidas são **erros**, a menos que o id do canal seja declarado por
  um manifesto de Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*`
  devem referenciar ids de Plugin **descobríveis**. Ids desconhecidos são **erros**.
- Se um Plugin estiver instalado, mas tiver um manifesto ou schema quebrado ou ausente,
  a validação falha e o Doctor relata o erro do Plugin.
- Se a configuração de Plugin existir, mas o Plugin estiver **desabilitado**, a configuração é mantida e
  um **aviso** é exibido no Doctor + logs.

Consulte a [referência de configuração](/pt-BR/gateway/configuration) para o schema `plugins.*` completo.

## Observações

- O manifesto é **obrigatório para plugins nativos do OpenClaw**, incluindo carregamentos do sistema de arquivos local. O runtime ainda carrega o módulo do Plugin separadamente; o manifesto serve apenas para descoberta + validação.
- Manifestos nativos são analisados com JSON5, portanto comentários, vírgulas finais e chaves sem aspas são aceitos desde que o valor final ainda seja um objeto.
- Somente campos de manifesto documentados são lidos pelo carregador de manifestos. Evite chaves personalizadas de nível superior.
- `channels`, `providers`, `cliBackends` e `skills` podem todos ser omitidos quando um Plugin não precisar deles.
- `providerDiscoveryEntry` deve permanecer leve e não deve importar código amplo de runtime; use-o para metadados estáticos de catálogo de provedores ou descritores estreitos de descoberta, não para execução em tempo de requisição.
- Tipos exclusivos de Plugin são selecionados por meio de `plugins.slots.*`: `kind: "memory"` via `plugins.slots.memory`, `kind: "context-engine"` via `plugins.slots.contextEngine` (padrão `legacy`).
- Declare o tipo exclusivo de Plugin neste manifesto. `OpenClawPluginDefinition.kind` de entrada de runtime está obsoleto e permanece apenas como fallback de compatibilidade para plugins mais antigos.
- Metadados de variáveis de env (`setup.providers[].envVars`, `providerAuthEnvVars` obsoleto e `channelEnvVars`) são apenas declarativos. Status, auditoria, validação de entrega por cron e outras superfícies somente leitura ainda aplicam a confiança do Plugin e a política de ativação efetiva antes de tratar uma variável de env como configurada.
- Para metadados de assistente de runtime que exigem código de provedor, consulte [hooks de runtime de provedor](/pt-BR/plugins/architecture-internals#provider-runtime-hooks).
- Se seu Plugin depender de módulos nativos, documente as etapas de build e quaisquer requisitos de allowlist do gerenciador de pacotes (por exemplo, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Relacionado

<CardGroup cols={3}>
  <Card title="Building plugins" href="/pt-BR/plugins/building-plugins" icon="rocket">
    Primeiros passos com plugins.
  </Card>
  <Card title="Plugin architecture" href="/pt-BR/plugins/architecture" icon="diagram-project">
    Arquitetura interna e modelo de capacidades.
  </Card>
  <Card title="SDK overview" href="/pt-BR/plugins/sdk-overview" icon="book">
    Referência do SDK de Plugin e importações de subcaminhos.
  </Card>
</CardGroup>
