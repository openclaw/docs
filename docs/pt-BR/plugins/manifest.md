---
read_when:
    - Você está criando um Plugin do OpenClaw
    - Você precisa publicar um esquema de configuração de Plugin ou depurar erros de validação de Plugin
summary: Requisitos do manifesto do Plugin + esquema JSON (validação estrita de configuração)
title: Manifesto do Plugin
x-i18n:
    generated_at: "2026-06-27T17:48:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62f6684ab074e4f14ce5c833fe8c8c624a2750f80215bdeffd972e27dd6bfc9c
    source_path: plugins/manifest.md
    workflow: 16
---

Esta página é apenas para o **manifesto de Plugin nativo do OpenClaw**.

Para layouts de pacotes compatíveis, consulte [Pacotes de Plugin](/pt-BR/plugins/bundles).

Formatos de pacote compatíveis usam arquivos de manifesto diferentes:

- Pacote Codex: `.codex-plugin/plugin.json`
- Pacote Claude: `.claude-plugin/plugin.json` ou o layout padrão de componente
  Claude sem manifesto
- Pacote Cursor: `.cursor-plugin/plugin.json`

O OpenClaw também detecta automaticamente esses layouts de pacote, mas eles não são validados
contra o esquema `openclaw.plugin.json` descrito aqui.

Para pacotes compatíveis, o OpenClaw atualmente lê os metadados do pacote, além das raízes de
Skills declaradas, raízes de comandos Claude, padrões do `settings.json` do pacote Claude,
padrões de LSP do pacote Claude e pacotes de hooks compatíveis quando o layout corresponde
às expectativas de runtime do OpenClaw.

Todo Plugin nativo do OpenClaw **deve** incluir um arquivo `openclaw.plugin.json` na
**raiz do Plugin**. O OpenClaw usa este manifesto para validar a configuração
**sem executar código do Plugin**. Manifestos ausentes ou inválidos são tratados como
erros de Plugin e bloqueiam a validação da configuração.

Consulte o guia completo do sistema de Plugins: [Plugins](/pt-BR/tools/plugin).
Para o modelo de capacidades nativo e a orientação atual de compatibilidade externa:
[Modelo de capacidades](/pt-BR/plugins/architecture#public-capability-model).

## O que este arquivo faz

`openclaw.plugin.json` são os metadados que o OpenClaw lê **antes de carregar o código do seu
Plugin**. Tudo abaixo deve ser barato o suficiente para ser inspecionado sem inicializar
o runtime do Plugin.

**Use-o para:**

- identidade do Plugin, validação de configuração e dicas de UI de configuração
- metadados de autenticação, onboarding e configuração inicial (alias, ativação automática, variáveis de ambiente do provedor, opções de autenticação)
- dicas de ativação para superfícies do plano de controle
- propriedade abreviada de famílias de modelos
- snapshots estáticos de propriedade de capacidades (`contracts`)
- metadados do executor de QA que o host compartilhado `openclaw qa` pode inspecionar
- metadados de configuração específicos de canal mesclados em superfícies de catálogo e validação

**Não use-o para:** registrar comportamento de runtime, declarar pontos de entrada de código
ou metadados de instalação npm. Eles pertencem ao código do seu Plugin e ao `package.json`.

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
  "setup": {
    "providers": [
      {
        "id": "openrouter",
        "envVars": ["OPENROUTER_API_KEY"]
      }
    ]
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

| Campo                                | Obrigatório | Tipo                             | O que significa                                                                                                                                                                                                                                      |
| ------------------------------------ | ----------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Sim         | `string`                         | ID canônico do Plugin. Este é o ID usado em `plugins.entries.<id>`.                                                                                                                                                                                  |
| `configSchema`                       | Sim         | `object`                         | JSON Schema inline para a configuração deste Plugin.                                                                                                                                                                                                 |
| `requiresPlugins`                    | Não         | `string[]`                       | IDs de Plugins que também precisam estar instalados para este Plugin ter efeito. A descoberta mantém o Plugin carregável, mas avisa quando algum Plugin obrigatório está ausente.                                                                    |
| `enabledByDefault`                   | Não         | `true`                           | Marca um Plugin empacotado como habilitado por padrão. Omita, ou defina qualquer valor diferente de `true`, para deixar o Plugin desabilitado por padrão.                                                                                            |
| `enabledByDefaultOnPlatforms`        | Não         | `string[]`                       | Marca um Plugin empacotado como habilitado por padrão somente nas plataformas Node.js listadas, por exemplo `["darwin"]`. A configuração explícita ainda tem prioridade.                                                                            |
| `legacyPluginIds`                    | Não         | `string[]`                       | IDs legados que são normalizados para este ID canônico de Plugin.                                                                                                                                                                                     |
| `autoEnableWhenConfiguredProviders`  | Não         | `string[]`                       | IDs de provedores que devem habilitar automaticamente este Plugin quando autenticação, configuração ou referências de modelo os mencionarem.                                                                                                          |
| `kind`                               | Não         | `"memory"` \| `"context-engine"` | Declara um tipo exclusivo de Plugin usado por `plugins.slots.*`.                                                                                                                                                                                     |
| `channels`                           | Não         | `string[]`                       | IDs de canais pertencentes a este Plugin. Usado para descoberta e validação de configuração.                                                                                                                                                         |
| `providers`                          | Não         | `string[]`                       | IDs de provedores pertencentes a este Plugin.                                                                                                                                                                                                        |
| `providerCatalogEntry`               | Não         | `string`                         | Caminho leve do módulo de catálogo de provedores, relativo à raiz do Plugin, para metadados do catálogo de provedores no escopo do manifesto que podem ser carregados sem ativar todo o runtime do Plugin.                                           |
| `modelSupport`                       | Não         | `object`                         | Metadados abreviados de famílias de modelos pertencentes ao manifesto, usados para carregar automaticamente o Plugin antes do runtime.                                                                                                                |
| `modelCatalog`                       | Não         | `object`                         | Metadados declarativos do catálogo de modelos para provedores pertencentes a este Plugin. Este é o contrato do plano de controle para futura listagem somente leitura, configuração inicial, seletores de modelo, aliases e supressão sem carregar o runtime do Plugin. |
| `modelPricing`                       | Não         | `object`                         | Política de consulta de preços externos pertencente ao provedor. Use-a para excluir provedores locais/auto-hospedados de catálogos de preços remotos ou mapear referências de provedores para IDs de catálogo OpenRouter/LiteLLM sem hardcodar IDs de provedores no core. |
| `modelIdNormalization`               | Não         | `object`                         | Limpeza de aliases/prefixos de IDs de modelo pertencente ao provedor, que deve ser executada antes do carregamento do runtime do provedor.                                                                                                           |
| `providerEndpoints`                  | Não         | `object[]`                       | Metadados de host/baseUrl de endpoint pertencentes ao manifesto para rotas de provedor que o core deve classificar antes do carregamento do runtime do provedor.                                                                                     |
| `providerRequest`                    | Não         | `object`                         | Metadados baratos de família de provedor e compatibilidade de requisição usados pela política genérica de requisição antes do carregamento do runtime do provedor.                                                                                   |
| `secretProviderIntegrations`         | Não         | `Record<string, object>`         | Presets declarativos de provedores SecretRef exec que as superfícies de configuração ou instalação podem oferecer sem hardcodar integrações específicas de provedor no core.                                                                         |
| `cliBackends`                        | Não         | `string[]`                       | IDs de backends de inferência da CLI pertencentes a este Plugin. Usado para autoativação na inicialização a partir de referências explícitas de configuração.                                                                                        |
| `syntheticAuthRefs`                  | Não         | `string[]`                       | Referências de provedor ou backend de CLI cujo hook de autenticação sintética pertencente ao Plugin deve ser sondado durante a descoberta fria de modelos antes do carregamento do runtime.                                                          |
| `nonSecretAuthMarkers`               | Não         | `string[]`                       | Valores de chave de API placeholder pertencentes a Plugins empacotados que representam estado de credenciais locais não secretas, OAuth ou ambiente.                                                                                                 |
| `commandAliases`                     | Não         | `object[]`                       | Nomes de comandos pertencentes a este Plugin que devem produzir configuração e diagnósticos de CLI cientes do Plugin antes do carregamento do runtime.                                                                                               |
| `providerAuthEnvVars`                | Não         | `Record<string, string[]>`       | Metadados de ambiente de compatibilidade obsoletos para consulta de autenticação/status do provedor. Prefira `setup.providers[].envVars` para novos Plugins; o OpenClaw ainda lê isto durante a janela de descontinuação.                          |
| `providerAuthAliases`                | Não         | `Record<string, string>`         | IDs de provedores que devem reutilizar outro ID de provedor para consulta de autenticação, por exemplo um provedor de codificação que compartilha a chave de API e os perfis de autenticação do provedor base.                                       |
| `channelEnvVars`                     | Não         | `Record<string, string[]>`       | Metadados baratos de ambiente de canal que o OpenClaw pode inspecionar sem carregar código de Plugin. Use isto para configuração de canal orientada por ambiente ou superfícies de autenticação que auxiliares genéricos de inicialização/configuração devem ver. |
| `providerAuthChoices`                | Não         | `object[]`                       | Metadados baratos de escolhas de autenticação para seletores de configuração inicial, resolução de provedor preferido e ligação simples de flags da CLI.                                                                                             |
| `activation`                         | Não         | `object`                         | Metadados baratos do planejador de ativação para carregamento acionado por inicialização, provedor, comando, canal, rota e capacidade. Apenas metadados; o runtime do Plugin ainda controla o comportamento real.                                   |
| `setup`                              | Não         | `object`                         | Descritores baratos de configuração/configuração inicial que a descoberta e as superfícies de configuração podem inspecionar sem carregar o runtime do Plugin.                                                                                       |
| `qaRunners`                          | Não         | `object[]`                       | Descritores baratos de executores de QA usados pelo host compartilhado `openclaw qa` antes do carregamento do runtime do Plugin.                                                                                                                    |
| `contracts`                          | Não         | `object`                         | Snapshot estático de propriedade de capacidades para hooks de autenticação externos, embeddings, fala, transcrição em tempo real, voz em tempo real, compreensão de mídia, geração de imagens, geração de música, geração de vídeo, busca na web e propriedade de ferramentas. |
| `mediaUnderstandingProviderMetadata` | Não         | `Record<string, object>`         | Padrões baratos de compreensão de mídia para IDs de provedores declarados em `contracts.mediaUnderstandingProviders`.                                                                                                                               |
| `imageGenerationProviderMetadata`    | Não         | `Record<string, object>`         | Metadados baratos de autenticação de geração de imagens para IDs de provedores declarados em `contracts.imageGenerationProviders`, incluindo aliases de autenticação pertencentes ao provedor e proteções de URL base.                             |
| `videoGenerationProviderMetadata`    | Não         | `Record<string, object>`         | Metadados baratos de autenticação de geração de vídeo para IDs de provedores declarados em `contracts.videoGenerationProviders`, incluindo aliases de autenticação pertencentes ao provedor e proteções de URL base.                               |
| `musicGenerationProviderMetadata`    | Não         | `Record<string, object>`         | Metadados baratos de autenticação de geração de música para IDs de provedores declarados em `contracts.musicGenerationProviders`, incluindo aliases de autenticação pertencentes ao provedor e proteções de URL base.                              |
| `toolMetadata`                       | Não      | `Record<string, object>`         | Metadados baratos de disponibilidade para ferramentas pertencentes ao Plugin declaradas em `contracts.tools`. Use-os quando uma ferramenta não deve carregar o runtime, a menos que existam evidências de configuração, env ou autenticação.                                                                       |
| `channelConfigs`                     | Não      | `Record<string, object>`         | Metadados de configuração de canal pertencentes ao manifesto, mesclados às superfícies de descoberta e validação antes do carregamento do runtime.                                                                                                                                      |
| `skills`                             | Não      | `string[]`                       | Diretórios de Skills a carregar, relativos à raiz do Plugin.                                                                                                                                                                                         |
| `name`                               | Não      | `string`                         | Nome do Plugin legível por humanos.                                                                                                                                                                                                                     |
| `description`                        | Não      | `string`                         | Resumo curto exibido nas superfícies de Plugin.                                                                                                                                                                                                         |
| `icon`                               | Não      | `string`                         | URL HTTPS da imagem para cartões de marketplace/catálogo. O ClawHub aceita qualquer URL `https://` válida e recorre ao ícone padrão do Plugin quando ela é omitida ou inválida.                                                                              |
| `version`                            | Não      | `string`                         | Versão informativa do Plugin.                                                                                                                                                                                                                   |
| `uiHints`                            | Não      | `Record<string, object>`         | Rótulos de UI, placeholders e dicas de sensibilidade para campos de configuração.                                                                                                                                                                               |

## Referência de metadados de provedor de geração

Os campos de metadados de provedor de geração descrevem sinais estáticos de autenticação para
provedores declarados na lista `contracts.*GenerationProviders` correspondente.
O OpenClaw lê esses campos antes que o runtime do provedor seja carregado, para que as ferramentas
do core possam decidir se um provedor de geração está disponível sem importar todos os
plugins de provedor.

Use estes campos apenas para fatos baratos e declarativos. Transporte, transformações de
requisição, atualização de tokens, validação de credenciais e o comportamento real de geração
permanecem no runtime do Plugin.

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

| Campo                  | Obrigatório | Tipo       | O que significa                                                                                                                                       |
| ---------------------- | ----------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | Não         | `string[]` | IDs adicionais de provedor que devem contar como aliases estáticos de autenticação para o provedor de geração.                                        |
| `authProviders`        | Não         | `string[]` | IDs de provedor cujos perfis de autenticação configurados devem contar como autenticação para este provedor de geração.                               |
| `configSignals`        | Não         | `object[]` | Sinais baratos de disponibilidade somente por configuração para provedores locais ou auto-hospedados que podem ser configurados sem perfis de autenticação ou variáveis de ambiente. |
| `authSignals`          | Não         | `object[]` | Sinais explícitos de autenticação. Quando presentes, eles substituem o conjunto padrão de sinais vindo do ID do provedor, `aliases` e `authProviders`. |
| `referenceAudioInputs` | Não         | `boolean`  | Somente geração de vídeo. Defina como `true` quando o provedor aceitar ativos de áudio de referência; caso contrário, `video_generate` oculta parâmetros de referência de áudio. |

Cada entrada de `configSignals` aceita:

| Campo            | Obrigatório | Tipo       | O que significa                                                                                                                                                                             |
| ---------------- | ----------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | Sim         | `string`   | Caminho em pontos para o objeto de configuração pertencente ao Plugin a ser inspecionado, por exemplo `plugins.entries.example.config`.                                                     |
| `overlayPath`    | Não         | `string`   | Caminho em pontos dentro da configuração raiz cujo objeto deve sobrepor o objeto raiz antes de avaliar o sinal. Use isto para configurações específicas de capacidade, como `image`, `video` ou `music`. |
| `overlayMapPath` | Não         | `string`   | Caminho em pontos dentro da configuração raiz cujos valores de objeto devem, cada um, sobrepor o objeto raiz. Use isto para mapas de contas nomeadas, como `accounts`, em que qualquer conta configurada deve qualificar. |
| `required`       | Não         | `string[]` | Caminhos em pontos dentro da configuração efetiva que devem ter valores configurados. Strings não podem estar vazias; objetos e arrays não podem estar vazios.                              |
| `requiredAny`    | Não         | `string[]` | Caminhos em pontos dentro da configuração efetiva em que pelo menos um deve ter um valor configurado.                                                                                        |
| `mode`           | Não         | `object`   | Guarda opcional de modo string dentro da configuração efetiva. Use isto quando a disponibilidade somente por configuração se aplicar a apenas um modo.                                      |

Cada guarda de `mode` aceita:

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
| `providerBaseUrl` | Não         | `object` | Guarda opcional que faz o sinal contar somente quando o provedor configurado referenciado usa uma URL base permitida. Use isto quando um alias de autenticação é válido apenas para certas APIs. |

Cada guarda de `providerBaseUrl` aceita:

| Campo             | Obrigatório | Tipo       | O que significa                                                                                                                                          |
| ----------------- | ----------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sim         | `string`   | ID de configuração do provedor cujo `baseUrl` deve ser verificado.                                                                                       |
| `defaultBaseUrl`  | Não         | `string`   | URL base a assumir quando a configuração do provedor omite `baseUrl`.                                                                                    |
| `allowedBaseUrls` | Sim         | `string[]` | URLs base permitidas para este sinal de autenticação. O sinal é ignorado quando a URL base configurada ou padrão não corresponde a um destes valores normalizados. |

## Referência de metadados de ferramenta

`toolMetadata` usa os mesmos formatos de `configSignals` e `authSignals` que os
metadados de provedor de geração, indexados por nome da ferramenta. `contracts.tools` declara
propriedade. `toolMetadata` declara evidência barata de disponibilidade para que o OpenClaw possa
evitar importar o runtime de um Plugin apenas para que sua factory de ferramenta retorne `null`.

```json
{
  "setup": {
    "providers": [
      {
        "id": "example",
        "envVars": ["EXAMPLE_API_KEY"]
      }
    ]
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
de hot path cuja factory depende de autenticação/configuração, autores de plugins devem declarar
`toolMetadata` em vez de fazer o core importar o runtime para perguntar.

## Referência de providerAuthChoices

Cada entrada de `providerAuthChoices` descreve uma opção de onboarding ou autenticação.
O OpenClaw lê isto antes que o runtime do provedor seja carregado.
As listas de configuração de provedor usam estas opções do manifesto, opções de configuração
derivadas de descritor e metadados de catálogo de instalação sem carregar o runtime do provedor.

| Campo                 | Obrigatório | Tipo                                                                  | O que significa                                                                                              |
| --------------------- | ----------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `provider`            | Sim         | `string`                                                              | ID do provedor ao qual esta escolha pertence.                                                                |
| `method`              | Sim         | `string`                                                              | ID do método de autenticação para o qual despachar.                                                          |
| `choiceId`            | Sim         | `string`                                                              | ID estável da escolha de autenticação usado pelos fluxos de onboarding e CLI.                                |
| `choiceLabel`         | Não         | `string`                                                              | Rótulo exibido ao usuário. Se omitido, o OpenClaw usa `choiceId` como fallback.                              |
| `choiceHint`          | Não         | `string`                                                              | Texto auxiliar curto para o seletor.                                                                         |
| `assistantPriority`   | Não         | `number`                                                              | Valores menores aparecem antes em seletores interativos orientados pelo assistente.                          |
| `assistantVisibility` | Não         | `"visible"` \| `"manual-only"`                                        | Oculta a escolha dos seletores do assistente, mas ainda permite a seleção manual pela CLI.                   |
| `deprecatedChoiceIds` | Não         | `string[]`                                                            | IDs de escolha legados que devem redirecionar usuários para esta escolha substituta.                         |
| `groupId`             | Não         | `string`                                                              | ID de grupo opcional para agrupar escolhas relacionadas.                                                     |
| `groupLabel`          | Não         | `string`                                                              | Rótulo exibido ao usuário para esse grupo.                                                                   |
| `groupHint`           | Não         | `string`                                                              | Texto auxiliar curto para o grupo.                                                                           |
| `optionKey`           | Não         | `string`                                                              | Chave de opção interna para fluxos de autenticação simples com uma única flag.                               |
| `cliFlag`             | Não         | `string`                                                              | Nome da flag da CLI, como `--openrouter-api-key`.                                                            |
| `cliOption`           | Não         | `string`                                                              | Forma completa da opção da CLI, como `--openrouter-api-key <key>`.                                           |
| `cliDescription`      | Não         | `string`                                                              | Descrição usada na ajuda da CLI.                                                                             |
| `onboardingScopes`    | Não         | `Array<"text-inference" \| "image-generation" \| "music-generation">` | Em quais superfícies de onboarding esta escolha deve aparecer. Se omitido, o padrão é `["text-inference"]`. |

## Referência de commandAliases

Use `commandAliases` quando um plugin possui um nome de comando de runtime que os usuários podem
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

| Campo        | Obrigatório | Tipo              | O que significa                                                                      |
| ------------ | ----------- | ----------------- | ------------------------------------------------------------------------------------ |
| `name`       | Sim         | `string`          | Nome do comando que pertence a este plugin.                                          |
| `kind`       | Não         | `"runtime-slash"` | Marca o alias como um comando de barra do chat, em vez de um comando raiz da CLI.    |
| `cliCommand` | Não         | `string`          | Comando raiz da CLI relacionado a sugerir para operações de CLI, se existir algum.   |

## Referência de activation

Use `activation` quando o plugin puder declarar de forma barata quais eventos do plano de controle
devem incluí-lo em um plano de ativação/carregamento.

Este bloco é metadado do planejador, não uma API de ciclo de vida. Ele não registra
comportamento de runtime, não substitui `register(...)` e não promete que o
código do plugin já foi executado. O planejador de ativação usa estes campos para
restringir plugins candidatos antes de recorrer aos metadados existentes de propriedade no manifesto,
como `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` e hooks.

Prefira os metadados mais específicos que já descrevem a propriedade. Use
`providers`, `channels`, `commandAliases`, descritores de setup ou `contracts`
quando esses campos expressarem a relação. Use `activation` para dicas extras do planejador
que não podem ser representadas por esses campos de propriedade.
Use `cliBackends` de nível superior para aliases de runtime da CLI, como `claude-cli`,
`my-cli` ou `google-gemini-cli`; `activation.onAgentHarnesses` é apenas para
IDs de harness de agente embutidos que ainda não têm um campo de propriedade.

Este bloco é apenas metadado. Ele não registra comportamento de runtime e não
substitui `register(...)`, `setupEntry` nem outros pontos de entrada de runtime/plugin.
Os consumidores atuais o usam como uma dica de restrição antes de um carregamento mais amplo de plugins, portanto
a ausência de metadados de ativação fora da inicialização geralmente só afeta a performance; ela
não deve alterar a correção enquanto ainda existirem fallbacks de propriedade do manifesto.

Todo plugin deve definir `activation.onStartup` intencionalmente. Defina como `true`
somente quando o plugin precisar executar durante a inicialização do Gateway. Defina como `false` quando
o plugin for inerte na inicialização e só deva carregar a partir de gatilhos mais específicos.
Omitir `onStartup` não faz mais o plugin ser carregado implicitamente na inicialização; use metadados de
ativação explícitos para gatilhos de ativação de inicialização, canal, configuração, harness de agente, memória ou
outros gatilhos mais específicos.

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

| Campo              | Obrigatório | Tipo                                                 | O que significa                                                                                                                                                                                         |
| ------------------ | ----------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Não         | `boolean`                                            | Ativação explícita na inicialização do Gateway. Todo plugin deve definir isto. `true` importa o plugin durante a inicialização; `false` o mantém lazy na inicialização, a menos que outro gatilho correspondente exija carregamento. |
| `onProviders`      | Não         | `string[]`                                           | IDs de provedor que devem incluir este plugin em planos de ativação/carregamento.                                                                                                                        |
| `onAgentHarnesses` | Não         | `string[]`                                           | IDs de runtime de harnesses de agente embutidos que devem incluir este plugin em planos de ativação/carregamento. Use `cliBackends` de nível superior para aliases de backend da CLI.                  |
| `onCommands`       | Não         | `string[]`                                           | IDs de comando que devem incluir este plugin em planos de ativação/carregamento.                                                                                                                         |
| `onChannels`       | Não         | `string[]`                                           | IDs de canal que devem incluir este plugin em planos de ativação/carregamento.                                                                                                                           |
| `onRoutes`         | Não         | `string[]`                                           | Tipos de rota que devem incluir este plugin em planos de ativação/carregamento.                                                                                                                          |
| `onConfigPaths`    | Não         | `string[]`                                           | Caminhos de configuração relativos à raiz que devem incluir este plugin em planos de inicialização/carregamento quando o caminho está presente e não está explicitamente desabilitado.                  |
| `onCapabilities`   | Não         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Dicas amplas de capacidade usadas pelo planejamento de ativação do plano de controle. Prefira campos mais específicos quando possível.                                                                   |

Consumidores ativos atuais:

- O planejamento de inicialização do Gateway usa `activation.onStartup` para importação
  explícita na inicialização
- o planejamento da CLI acionado por comandos recorre aos legados
  `commandAliases[].cliCommand` ou `commandAliases[].name`
- o planejamento de inicialização do runtime de agente usa `activation.onAgentHarnesses` para
  harnesses embutidos e `cliBackends[]` de nível superior para aliases de runtime da CLI
- o planejamento de setup/canal acionado por canal recorre à propriedade legada `channels[]`
  quando metadados explícitos de ativação de canal estão ausentes
- o planejamento de plugins na inicialização usa `activation.onConfigPaths` para superfícies de configuração
  raiz que não são de canal, como o bloco `browser` do plugin de navegador incluído
- o planejamento de setup/runtime acionado por provedor recorre à propriedade legada
  `providers[]` e `cliBackends[]` de nível superior quando metadados explícitos de
  ativação de provedor estão ausentes

Os diagnósticos do planejador podem distinguir dicas explícitas de ativação do fallback de
propriedade do manifesto. Por exemplo, `activation-command-hint` significa que
`activation.onCommands` correspondeu, enquanto `manifest-command-alias` significa que o
planejador usou a propriedade de `commandAliases` em vez disso. Esses rótulos de motivo são para
diagnósticos do host e testes; autores de plugins devem continuar declarando os metadados
que melhor descrevem a propriedade.

## Referência de qaRunners

Use `qaRunners` quando um plugin contribui com um ou mais runners de transporte abaixo
da raiz compartilhada `openclaw qa`. Mantenha estes metadados baratos e estáticos; o runtime do plugin
ainda é dono do registro real da CLI por meio de uma superfície leve
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
| `commandName` | Sim         | `string` | Subcomando montado sob `openclaw qa`, por exemplo `matrix`.          |
| `description` | Não         | `string` | Texto de ajuda de fallback usado quando o host compartilhado precisa de um comando stub. |

## referência de setup

Use `setup` quando as superfícies de configuração e onboarding precisarem de metadados baratos de propriedade do plugin
antes que o runtime seja carregado.

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

`cliBackends` no nível superior permanece válido e continua descrevendo backends de inferência da CLI. `setup.cliBackends` é a superfície descritora específica de setup para
fluxos de plano de controle/setup que devem permanecer apenas como metadados.

Quando presentes, `setup.providers` e `setup.cliBackends` são a superfície preferencial de consulta baseada primeiro em descritores para descoberta de setup. Se o descritor apenas
restringir o plugin candidato e o setup ainda precisar de hooks de runtime mais ricos no momento do setup, defina `requiresRuntime: true` e mantenha `setup-api` no lugar como o
caminho de execução de fallback.

OpenClaw também inclui `setup.providers[].envVars` em autenticação genérica de provedor e
consultas de variáveis de ambiente. `providerAuthEnvVars` continua com suporte por meio de um adaptador de compatibilidade durante a janela de descontinuação, mas plugins não incluídos no bundle que ainda o usam
recebem um diagnóstico de manifesto. Novos plugins devem colocar metadados de ambiente de setup/status
em `setup.providers[].envVars`.

OpenClaw também pode derivar escolhas simples de setup a partir de `setup.providers[].authMethods`
quando nenhuma entrada de setup estiver disponível, ou quando `setup.requiresRuntime: false`
declarar que o runtime de setup é desnecessário. Entradas explícitas de `providerAuthChoices` continuam
preferidas para rótulos personalizados, flags de CLI, escopo de onboarding e metadados do assistente.

Defina `requiresRuntime: false` somente quando esses descritores forem suficientes para a
superfície de setup. OpenClaw trata `false` explícito como um contrato somente de descritor
e não executará `setup-api` nem `openclaw.setupEntry` para consulta de setup. Se
um plugin somente de descritor ainda distribuir uma dessas entradas de runtime de setup,
OpenClaw relata um diagnóstico aditivo e continua ignorando-a. A omissão de
`requiresRuntime` mantém o comportamento de fallback legado para que plugins existentes que adicionaram
descritores sem a flag não quebrem.

Como a consulta de setup pode executar código `setup-api` de propriedade do plugin, os valores normalizados de
`setup.providers[].id` e `setup.cliBackends[]` devem permanecer únicos entre
os plugins descobertos. Propriedade ambígua falha fechada em vez de escolher um
vencedor pela ordem de descoberta.

Quando o runtime de setup é executado, os diagnósticos do registro de setup relatam desvio de descritor se `setup-api` registrar um provedor ou backend de CLI que os descritores do manifesto
não declaram, ou se um descritor não tiver registro de runtime correspondente. Esses diagnósticos são aditivos e não rejeitam plugins legados.

### referência de setup.providers

| Campo          | Obrigatório | Tipo       | O que significa                                                                                    |
| -------------- | ----------- | ---------- | -------------------------------------------------------------------------------------------------- |
| `id`           | Sim         | `string`   | ID do provedor exposto durante setup ou onboarding. Mantenha IDs normalizados globalmente únicos.  |
| `authMethods`  | Não         | `string[]` | IDs de método de setup/autenticação que este provedor aceita sem carregar o runtime completo.      |
| `envVars`      | Não         | `string[]` | Variáveis de ambiente que superfícies genéricas de setup/status podem verificar antes de o runtime do plugin carregar. |
| `authEvidence` | Não         | `object[]` | Verificações baratas de evidência local de autenticação para provedores que podem autenticar por marcadores não secretos. |

`authEvidence` é para marcadores de credenciais locais de propriedade do provedor que podem ser
verificados sem carregar código de runtime. Essas verificações devem permanecer baratas e locais:
sem chamadas de rede, sem leituras de keychain ou gerenciador de segredos, sem comandos de shell e sem
sondagens de API de provedor.

Entradas de evidência compatíveis:

| Campo              | Obrigatório | Tipo       | O que significa                                                                                                  |
| ------------------ | ----------- | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| `type`             | Sim         | `string`   | Atualmente `local-file-with-env`.                                                                               |
| `fileEnvVar`       | Não         | `string`   | Variável de ambiente contendo um caminho explícito de arquivo de credenciais.                                    |
| `fallbackPaths`    | Não         | `string[]` | Caminhos locais de arquivos de credenciais verificados quando `fileEnvVar` está ausente ou vazio. Suporta `${HOME}` e `${APPDATA}`. |
| `requiresAnyEnv`   | Não         | `string[]` | Pelo menos uma variável de ambiente listada deve não estar vazia antes que a evidência seja válida.             |
| `requiresAllEnv`   | Não         | `string[]` | Todas as variáveis de ambiente listadas devem não estar vazias antes que a evidência seja válida.               |
| `credentialMarker` | Sim         | `string`   | Marcador não secreto retornado quando a evidência está presente.                                                |
| `source`           | Não         | `string`   | Rótulo de origem voltado ao usuário para saída de autenticação/status.                                          |

### campos de setup

| Campo              | Obrigatório | Tipo       | O que significa                                                                                       |
| ------------------ | ----------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `providers`        | Não         | `object[]` | Descritores de setup de provedor expostos durante setup e onboarding.                                |
| `cliBackends`      | Não         | `string[]` | IDs de backend em tempo de setup usados para consulta de setup baseada primeiro em descritores. Mantenha IDs normalizados globalmente únicos. |
| `configMigrations` | Não         | `string[]` | IDs de migração de configuração pertencentes à superfície de setup deste plugin.                     |
| `requiresRuntime`  | Não         | `boolean`  | Se setup ainda precisa da execução de `setup-api` após a consulta de descritores.                    |

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
| ------------- | ---------- | ----------------------------------------- |
| `label`       | `string`   | Rótulo de campo voltado ao usuário.       |
| `help`        | `string`   | Texto auxiliar curto.                     |
| `tags`        | `string[]` | Tags opcionais da UI.                     |
| `advanced`    | `boolean`  | Marca o campo como avançado.              |
| `sensitive`   | `boolean`  | Marca o campo como secreto ou sensível.   |
| `placeholder` | `string`   | Texto de placeholder para entradas de formulário. |

## referência de contracts

Use `contracts` apenas para metadados estáticos de propriedade de capacidade que OpenClaw pode
ler sem importar o runtime do plugin.

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["openclaw", "codex"],
    "trustedToolPolicies": ["workflow-budget"],
    "externalAuthProviders": ["acme-ai"],
    "embeddingProviders": ["openai-compatible"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
    "mediaUnderstandingProviders": ["openai"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "migrationProviders": ["hermes"],
    "gatewayMethodDispatch": ["authenticated-request"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Cada lista é opcional:

| Campo                            | Tipo       | O que significa                                                                                                                       |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | IDs de fábrica de extensões do servidor de aplicativo Codex, atualmente `codex-app-server`.                                           |
| `agentToolResultMiddleware`      | `string[]` | IDs de tempo de execução para os quais este plugin pode registrar middleware de resultado de ferramenta.                               |
| `trustedToolPolicies`            | `string[]` | IDs de políticas locais confiáveis de pré-ferramenta que um plugin instalado pode registrar. Plugins integrados podem registrar políticas sem este campo. |
| `externalAuthProviders`          | `string[]` | IDs de provedores cujo gancho de perfil de autenticação externa este plugin possui.                                                     |
| `embeddingProviders`             | `string[]` | IDs de provedores gerais de embeddings que este plugin possui para uso reutilizável de embeddings vetoriais, incluindo memória.         |
| `speechProviders`                | `string[]` | IDs de provedores de fala que este plugin possui.                                                                                      |
| `realtimeTranscriptionProviders` | `string[]` | IDs de provedores de transcrição em tempo real que este plugin possui.                                                                 |
| `realtimeVoiceProviders`         | `string[]` | IDs de provedores de voz em tempo real que este plugin possui.                                                                         |
| `memoryEmbeddingProviders`       | `string[]` | IDs obsoletos de provedores de embeddings específicos de memória que este plugin possui.                                                |
| `mediaUnderstandingProviders`    | `string[]` | IDs de provedores de compreensão de mídia que este plugin possui.                                                                      |
| `transcriptSourceProviders`      | `string[]` | IDs de provedores de fonte de transcrição que este plugin possui.                                                                      |
| `imageGenerationProviders`       | `string[]` | IDs de provedores de geração de imagens que este plugin possui.                                                                        |
| `videoGenerationProviders`       | `string[]` | IDs de provedores de geração de vídeo que este plugin possui.                                                                          |
| `webFetchProviders`              | `string[]` | IDs de provedores de busca na web que este plugin possui.                                                                              |
| `webSearchProviders`             | `string[]` | IDs de provedores de pesquisa na web que este plugin possui.                                                                           |
| `migrationProviders`             | `string[]` | IDs de provedores de importação que este plugin possui para `openclaw migrate`.                                                        |
| `gatewayMethodDispatch`          | `string[]` | Direito reservado para rotas HTTP autenticadas de plugin que despacham métodos do Gateway dentro do processo.                          |
| `tools`                          | `string[]` | Nomes de ferramentas de agente que este plugin possui.                                                                                 |

`contracts.embeddedExtensionFactories` é mantido para fábricas de extensões integradas
somente do servidor de aplicativo Codex. Transformações integradas de resultado de ferramenta devem
declarar `contracts.agentToolResultMiddleware` e registrar com
`api.registerAgentToolResultMiddleware(...)` em vez disso. Plugins instalados podem usar
a mesma interface de middleware somente quando habilitados explicitamente e somente para tempos de execução que eles
declaram em `contracts.agentToolResultMiddleware`.

Plugins instalados que precisam da camada de políticas pré-ferramenta confiável pelo host devem declarar
cada ID local registrado em `contracts.trustedToolPolicies` e ser habilitados explicitamente.
Plugins integrados mantêm o caminho existente de políticas confiáveis, mas plugins instalados
com IDs de política não declarados são rejeitados antes do registro. IDs de política
são escopados ao plugin que faz o registro, então dois plugins podem declarar e
registrar `workflow-budget`; um único plugin não pode registrar o mesmo ID local
duas vezes.

Registros de `api.registerTool(...)` em tempo de execução devem corresponder a `contracts.tools`.
A descoberta de ferramentas usa esta lista para carregar apenas os tempos de execução de plugins que podem possuir as
ferramentas solicitadas.

Plugins de provedor que implementam `resolveExternalAuthProfiles` devem declarar
`contracts.externalAuthProviders`; ganchos de autenticação externa não declarados são ignorados.

Provedores gerais de embeddings devem declarar `contracts.embeddingProviders` para
cada adaptador registrado com `api.registerEmbeddingProvider(...)`. Use o
contrato geral para geração vetorial reutilizável, incluindo provedores consumidos pela
pesquisa de memória. `contracts.memoryEmbeddingProviders` é uma compatibilidade obsoleta
específica de memória e permanece apenas enquanto provedores existentes migram
para a interface genérica de provedor de embeddings.

`contracts.gatewayMethodDispatch` atualmente aceita
`"authenticated-request"`. Ele é uma barreira de higiene de API para rotas HTTP nativas de plugin
que intencionalmente despacham métodos do plano de controle do Gateway dentro do processo, não
um sandbox contra plugins nativos maliciosos. Use-o apenas para superfícies integradas/de operador
rigorosamente revisadas que já exigem autenticação HTTP do Gateway.

## Referência de mediaUnderstandingProviderMetadata

Use `mediaUnderstandingProviderMetadata` quando um provedor de compreensão de mídia tiver
modelos padrão, prioridade de fallback de autenticação automática ou suporte nativo a documentos de que
helpers genéricos do núcleo precisam antes que o tempo de execução carregue. As chaves também devem ser declaradas em
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

| Campo                  | Tipo                                | O que significa                                                             |
| ---------------------- | ----------------------------------- | --------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capacidades de mídia expostas por este provedor.                            |
| `defaultModels`        | `Record<string, string>`            | Padrões de capacidade para modelo usados quando a configuração não especifica um modelo. |
| `autoPriority`         | `Record<string, number>`            | Números menores são ordenados antes para fallback automático de provedor baseado em credenciais. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Entradas de documentos nativos compatíveis com o provedor.                  |

## Referência de channelConfigs

Use `channelConfigs` quando um plugin de canal precisar de metadados de configuração baratos antes que
o tempo de execução carregue. A descoberta somente leitura de configuração/status do canal pode usar esses metadados
diretamente para canais externos configurados quando nenhuma entrada de configuração estiver disponível, ou
quando `setup.requiresRuntime: false` declarar que o tempo de execução de configuração é desnecessário.

`channelConfigs` são metadados do manifesto do plugin, não uma nova seção de configuração
de usuário de nível superior. Usuários ainda configuram instâncias de canal em `channels.<channel-id>`.
O OpenClaw lê metadados do manifesto para decidir qual plugin possui esse canal
configurado antes que o código de tempo de execução do plugin execute.

Para um plugin de canal, `configSchema` e `channelConfigs` descrevem caminhos diferentes:

- `configSchema` valida `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valida `channels.<channel-id>`

Plugins não integrados que declaram `channels[]` também devem declarar entradas
`channelConfigs` correspondentes. Sem elas, o OpenClaw ainda pode carregar o plugin, mas
o esquema de configuração de caminho frio, a configuração e as superfícies da Control UI não conseguem saber o
formato das opções pertencentes ao canal até que o tempo de execução do plugin execute.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` e
`nativeSkillsAutoEnabled` podem declarar padrões estáticos `auto` para verificações de configuração de comandos
que rodam antes que o tempo de execução do canal carregue. Canais integrados também podem publicar
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
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema para `channels.<id>`. Obrigatório para cada entrada declarada de configuração de canal. |
| `uiHints`     | `Record<string, object>` | Rótulos/espaços reservados/dicas sensíveis opcionais de interface para essa seção de configuração de canal. |
| `label`       | `string`                 | Rótulo do canal mesclado nas superfícies de seletor e inspeção quando os metadados de tempo de execução não estão prontos. |
| `description` | `string`                 | Descrição curta do canal para superfícies de inspeção e catálogo.                            |
| `commands`    | `object`                 | Padrões automáticos estáticos de comando nativo e skill nativa para verificações de configuração pré-tempo de execução. |
| `preferOver`  | `string[]`               | IDs de plugins legados ou de prioridade inferior que este canal deve superar nas superfícies de seleção. |

### Substituindo outro plugin de canal

Use `preferOver` quando seu plugin for o proprietário preferido para um ID de canal que
outro plugin também pode fornecer. Casos comuns são um ID de plugin renomeado, um
plugin independente que substitui um plugin integrado, ou um fork mantido que
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

Quando `channels.chat` está configurado, o OpenClaw considera tanto o ID de canal quanto
o ID de plugin preferido. Se o plugin de prioridade inferior foi selecionado apenas porque
é integrado ou habilitado por padrão, o OpenClaw o desabilita na configuração
efetiva de tempo de execução para que um plugin possua o canal e suas ferramentas. A seleção explícita do usuário
ainda vence: se o usuário habilitar explicitamente ambos os plugins, o OpenClaw
preserva essa escolha e relata diagnósticos de canal/ferramenta duplicados em vez de
alterar silenciosamente o conjunto de plugins solicitado.

Mantenha `preferOver` escopado a IDs de plugins que realmente podem fornecer o mesmo canal.
Ele não é um campo de prioridade geral e não renomeia chaves de configuração do usuário.

## Referência de modelSupport

Use `modelSupport` quando o OpenClaw deve inferir seu plugin de provedor a partir de
ids de modelo abreviados como `gpt-5.5` ou `claude-sonnet-4.6` antes que o runtime
do plugin carregue.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

O OpenClaw aplica esta precedência:

- referências explícitas `provider/model` usam os metadados do manifesto `providers` proprietário
- `modelPatterns` têm prioridade sobre `modelPrefixes`
- se um plugin não incluído no pacote e um plugin incluído no pacote corresponderem, o plugin não incluído
  no pacote vence
- ambiguidades restantes são ignoradas até que o usuário ou a configuração especifique um provedor

Campos:

| Campo           | Tipo       | O que significa                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefixos correspondidos com `startsWith` contra ids de modelo abreviados.                 |
| `modelPatterns` | `string[]` | Fontes de regex correspondidas contra ids de modelo abreviados após a remoção do sufixo de perfil. |

As entradas de `modelPatterns` são compiladas por meio de `compileSafeRegex`, que rejeita
padrões que contêm repetição aninhada (por exemplo `(a+)+$`). Padrões que falham
na verificação de segurança são ignorados silenciosamente, assim como regex sintaticamente inválidas.
Mantenha os padrões simples e evite quantificadores aninhados.

## Referência de modelCatalog

Use `modelCatalog` quando o OpenClaw deve conhecer os metadados de modelos do provedor antes de
carregar o runtime do plugin. Esta é a fonte controlada pelo manifesto para linhas fixas de catálogo,
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

| Campo            | Tipo                                                     | O que significa                                                                                               |
| ---------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | Linhas de catálogo para ids de provedor pertencentes a este plugin. As chaves também devem aparecer em `providers` de nível superior.       |
| `aliases`        | `Record<string, object>`                                 | Aliases de provedor que devem resolver para um provedor proprietário para planejamento de catálogo ou supressão.              |
| `suppressions`   | `object[]`                                               | Linhas de modelo de outra fonte que este plugin suprime por um motivo específico do provedor.                  |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | Se o catálogo do provedor pode ser lido dos metadados do manifesto, atualizado no cache ou exige runtime. |
| `runtimeAugment` | `boolean`                                                | Defina como `true` somente quando o runtime do provedor precisar anexar linhas de catálogo após o planejamento de manifesto/configuração.       |

`aliases` participa da busca de propriedade do provedor para planejamento de catálogo de modelos.
Os destinos de alias devem ser provedores de nível superior pertencentes ao mesmo plugin. Quando uma
lista filtrada por provedor usa um alias, o OpenClaw pode ler o manifesto proprietário e
aplicar sobrescritas de API/base URL do alias sem carregar o runtime do provedor.
Aliases não expandem listagens de catálogo não filtradas; listas amplas emitem apenas as linhas
do provedor canônico proprietário.

`suppressions` substitui o hook antigo de runtime do provedor `suppressBuiltInModel`.
Entradas de supressão são respeitadas somente quando o provedor pertence ao plugin ou
é declarado como uma chave `modelCatalog.aliases` que aponta para um provedor proprietário. Hooks
de supressão em runtime não são mais chamados durante a resolução de modelos.

Campos do provedor:

| Campo     | Tipo                     | O que significa                                                     |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | URL base padrão opcional para modelos neste catálogo de provedor.    |
| `api`     | `ModelApi`               | Adaptador de API padrão opcional para modelos neste catálogo de provedor. |
| `headers` | `Record<string, string>` | Cabeçalhos estáticos opcionais que se aplicam a este catálogo de provedor.      |
| `models`  | `object[]`               | Linhas de modelo obrigatórias. Linhas sem um `id` são ignoradas.            |

Campos do modelo:

| Campo           | Tipo                                                           | O que significa                                                               |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Id de modelo local ao provedor, sem o prefixo `provider/`.                    |
| `name`          | `string`                                                       | Nome de exibição opcional.                                                      |
| `api`           | `ModelApi`                                                     | Sobrescrita opcional de API por modelo.                                            |
| `baseUrl`       | `string`                                                       | Sobrescrita opcional de URL base por modelo.                                       |
| `headers`       | `Record<string, string>`                                       | Cabeçalhos estáticos opcionais por modelo.                                          |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalidades que o modelo aceita.                                               |
| `reasoning`     | `boolean`                                                      | Se o modelo expõe comportamento de raciocínio.                               |
| `contextWindow` | `number`                                                       | Janela de contexto nativa do provedor.                                             |
| `contextTokens` | `number`                                                       | Limite efetivo opcional de contexto em runtime quando diferente de `contextWindow`. |
| `maxTokens`     | `number`                                                       | Máximo de tokens de saída quando conhecido.                                           |
| `cost`          | `object`                                                       | Preço opcional em USD por milhão de tokens, incluindo `tieredPricing` opcional. |
| `compat`        | `object`                                                       | Flags opcionais de compatibilidade que correspondem à compatibilidade de configuração de modelo do OpenClaw.  |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Status da listagem. Suprima somente quando a linha não deve aparecer de forma alguma.          |
| `statusReason`  | `string`                                                       | Motivo opcional mostrado com status não disponível.                            |
| `replaces`      | `string[]`                                                     | Ids de modelo locais ao provedor antigos que este modelo substitui.                       |
| `replacedBy`    | `string`                                                       | Id de modelo local ao provedor substituto para linhas obsoletas.                    |
| `tags`          | `string[]`                                                     | Tags estáveis usadas por seletores e filtros.                                    |

Campos de supressão:

| Campo                      | Tipo       | O que significa                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Id do provedor para a linha upstream a suprimir. Deve pertencer a este plugin ou ser declarado como um alias proprietário. |
| `model`                    | `string`   | Id de modelo local ao provedor a suprimir.                                                                      |
| `reason`                   | `string`   | Mensagem opcional mostrada quando a linha suprimida é solicitada diretamente.                                     |
| `when.baseUrlHosts`        | `string[]` | Lista opcional de hosts de URL base efetiva do provedor exigidos antes que a supressão se aplique.               |
| `when.providerConfigApiIn` | `string[]` | Lista opcional de valores exatos de `api` de configuração do provedor exigidos antes que a supressão se aplique.              |

Não coloque dados somente de runtime em `modelCatalog`. Use `static` somente quando as linhas
do manifesto forem completas o suficiente para que superfícies de lista filtrada por provedor e seletores ignorem
a descoberta de registro/runtime. Use `refreshable` quando as linhas do manifesto forem sementes
ou suplementos úteis para listagem, mas uma atualização/cache puder adicionar mais linhas posteriormente;
linhas atualizáveis não são autoritativas por si só. Use `runtime` quando o OpenClaw
precisar carregar o runtime do provedor para conhecer a lista.

## Referência de modelIdNormalization

Use `modelIdNormalization` para limpeza barata, controlada pelo provedor, de ids de modelo que deve
acontecer antes do carregamento do runtime do provedor. Isso mantém aliases como nomes curtos de modelo,
ids legados locais ao provedor e regras de prefixo de proxy no manifesto do plugin proprietário
em vez de em tabelas de seleção de modelo do core.

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
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Aliases exatos de id de modelo sem diferenciar maiúsculas de minúsculas. Os valores são retornados como escritos.                  |
| `stripPrefixes`                      | `string[]`              | Prefixos a remover antes da busca de alias, úteis para duplicação legada de provider/model.     |
| `prefixWhenBare`                     | `string`                | Prefixo a adicionar quando o id de modelo normalizado ainda não contém `/`.                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Regras condicionais de prefixo para id sem provedor após a busca de alias, indexadas por `modelPrefix` e `prefix`. |

## Referência de providerEndpoints

Use `providerEndpoints` para classificação de endpoints que a política genérica de requisição
deve conhecer antes que o runtime do provedor carregue. O core ainda define o significado de cada
`endpointClass`; manifestos de plugin definem os metadados de host e URL base.

Campos de endpoint:

| Campo                          | Tipo       | O que significa                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Classe de endpoint conhecida do núcleo, como `openrouter`, `moonshot-native` ou `google-vertex`.        |
| `hosts`                        | `string[]` | Nomes de host exatos que mapeiam para a classe de endpoint.                                                |
| `hostSuffixes`                 | `string[]` | Sufixos de host que mapeiam para a classe de endpoint. Prefixe com `.` para correspondência somente por sufixo de domínio. |
| `baseUrls`                     | `string[]` | URLs base HTTP(S) normalizadas exatas que mapeiam para a classe de endpoint.                             |
| `googleVertexRegion`           | `string`   | Região estática do Google Vertex para hosts globais exatos.                                            |
| `googleVertexRegionHostSuffix` | `string`   | Sufixo a remover dos hosts correspondentes para expor o prefixo de região do Google Vertex.                 |

## referência de providerRequest

Use `providerRequest` para metadados baratos de compatibilidade de solicitação de que a política
genérica de solicitações precisa sem carregar o runtime do provedor. Mantenha a reescrita de
payload específica de comportamento em hooks de runtime do provedor ou em helpers compartilhados de família de provedores.

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
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | Rótulo da família do provedor usado por decisões genéricas de compatibilidade de solicitação e diagnósticos. |
| `compatibilityFamily` | `"moonshot"` | Bucket opcional de compatibilidade de família de provedores para helpers compartilhados de solicitação.              |
| `openAICompletions`   | `object`     | Flags de solicitação de completions compatíveis com OpenAI, atualmente `supportsStreamingUsage`.       |

## referência de secretProviderIntegrations

Use `secretProviderIntegrations` quando um plugin puder publicar um preset reutilizável de provedor
exec SecretRef. O OpenClaw lê esses metadados antes que o runtime do plugin carregue,
armazena a propriedade do plugin em `secrets.providers.<alias>.pluginIntegration` e
deixa a resolução real do segredo para o runtime SecretRef.
Presets são expostos somente para plugins embutidos e plugins instalados descobertos
a partir das raízes de instalação de plugins gerenciadas, como instalações via git e ClawHub.

```json
{
  "secretProviderIntegrations": {
    "secret-store": {
      "providerAlias": "team-secrets",
      "displayName": "Team secrets",
      "source": "exec",
      "command": "${node}",
      "args": ["./bin/resolve-secrets.mjs"]
    }
  }
}
```

A chave do mapa é o id da integração. Se `providerAlias` for omitido, o OpenClaw usa
o id da integração como o alias de provedor SecretRef. Aliases de provedor devem corresponder
ao padrão normal de alias de provedor SecretRef, por exemplo `team-secrets` ou
`onepassword-work`.

Quando um operador seleciona o preset, o OpenClaw grava uma referência de provedor como:

```json
{
  "secrets": {
    "providers": {
      "team-secrets": {
        "source": "exec",
        "pluginIntegration": {
          "pluginId": "acme-secrets",
          "integrationId": "secret-store"
        }
      }
    }
  }
}
```

Na inicialização/recarregamento, o OpenClaw resolve esse provedor carregando os metadados
atuais do manifesto do plugin, verificando se o plugin proprietário está instalado e ativo, e
materializando o comando exec a partir do manifesto. Desabilitar ou remover o
plugin revoga o provedor para SecretRefs ativos. Operadores que desejam configuração exec
autônoma ainda podem gravar provedores manuais `command`/`args` diretamente.

Somente presets `source: "exec"` são aceitos atualmente. `command` deve ser
`${node}`, e `args[0]` deve ser um script resolvedor relativo à raiz do plugin com `./`.
O OpenClaw o materializa na inicialização/recarregamento para o executável Node atual e
o caminho absoluto do script dentro do plugin. Opções do Node como `--require`, `--import`,
`--loader`, `--env-file`, `--eval` e `--print` não fazem parte do contrato de preset
do manifesto. Operadores que precisam de comandos não Node podem configurar provedores exec
manuais autônomos diretamente.

O OpenClaw deriva `trustedDirs` para presets de manifesto a partir da raiz do plugin e,
para presets `${node}`, do diretório do executável Node atual. `trustedDirs` definidos
pelo manifesto são ignorados. Outras opções de provedor exec, como `timeoutMs`,
`maxOutputBytes`, `jsonOnly`, `env`, `passEnv` e `allowInsecurePath`, são repassadas
para a configuração normal do provedor exec SecretRef.

## referência de modelPricing

Use `modelPricing` quando um provedor precisar de comportamento de preços no plano de controle antes
que o runtime carregue. O cache de preços do Gateway lê esses metadados sem importar
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
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Defina como `false` para provedores locais/auto-hospedados que nunca devem buscar preços do OpenRouter ou LiteLLM. |
| `openRouter` | `false \| object` | Mapeamento de consulta de preços do OpenRouter. `false` desabilita a consulta ao OpenRouter para este provedor.           |
| `liteLLM`    | `false \| object` | Mapeamento de consulta de preços do LiteLLM. `false` desabilita a consulta ao LiteLLM para este provedor.                 |

Campos de origem:

| Campo                      | Tipo               | O que significa                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Id do provedor no catálogo externo quando difere do id do provedor OpenClaw, por exemplo `z-ai` para um provedor `zai`. |
| `passthroughProviderModel` | `boolean`          | Trate ids de modelo que contêm barras como refs aninhadas de provedor/modelo, útil para provedores proxy como OpenRouter.       |
| `modelIdTransforms`        | `"version-dots"[]` | Variantes extras de id de modelo do catálogo externo. `version-dots` tenta ids de versão com pontos, como `claude-opus-4.6`.            |

### Índice de provedores do OpenClaw

O Índice de provedores do OpenClaw é metadado de prévia de propriedade do OpenClaw para provedores
cujos plugins talvez ainda não estejam instalados. Ele não faz parte de um manifesto de plugin.
Manifestos de plugin continuam sendo a autoridade para plugins instalados. O Índice de provedores é
o contrato interno de fallback que futuras superfícies de provedor instalável e seletor de modelo
pré-instalação consumirão quando um plugin de provedor não estiver instalado.

Ordem de autoridade do catálogo:

1. Configuração do usuário.
2. `modelCatalog` do manifesto de plugin instalado.
3. Cache do catálogo de modelos de atualização explícita.
4. Linhas de prévia do Índice de provedores do OpenClaw.

O Índice de provedores não deve conter segredos, estado habilitado, hooks de runtime ou
dados de modelo específicos de conta ativa. Seus catálogos de prévia usam a mesma
forma de linha de provedor `modelCatalog` que os manifestos de plugin, mas devem permanecer limitados
a metadados de exibição estáveis, a menos que campos do adaptador de runtime como `api`,
`baseUrl`, preços ou flags de compatibilidade sejam intencionalmente mantidos alinhados com
o manifesto do plugin instalado. Provedores com descoberta ativa de `/models` devem
gravar linhas atualizadas pelo caminho explícito de cache do catálogo de modelos em vez de
fazer listagens normais ou onboarding chamarem APIs de provedor.

Entradas do Índice de provedores também podem carregar metadados de plugin instalável para provedores
cujo plugin saiu do núcleo ou ainda não está instalado por outro motivo. Esses
metadados espelham o padrão do catálogo de canais: nome do pacote, especificação de instalação npm,
integridade esperada e rótulos baratos de escolha de autenticação são suficientes para mostrar uma
opção de configuração instalável. Depois que o plugin é instalado, seu manifesto prevalece e
a entrada do Índice de provedores é ignorada para esse provedor.

Chaves legadas de capacidade no nível superior foram descontinuadas. Use `openclaw doctor --fix` para
mover `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` e `webSearchProviders` para baixo de `contracts`; o carregamento normal
de manifesto não trata mais esses campos de nível superior como propriedade de capacidade.

## Manifesto versus package.json

Os dois arquivos têm funções diferentes:

| Arquivo                   | Use para                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Descoberta, validação de configuração, metadados de escolha de autenticação e dicas de UI que devem existir antes que o código do plugin execute                         |
| `package.json`         | Metadados npm, instalação de dependências e o bloco `openclaw` usado para entrypoints, bloqueio de instalação, configuração ou metadados de catálogo |

Se você não tiver certeza de onde uma parte dos metadados pertence, use esta regra:

- se o OpenClaw precisa saber antes de carregar o código do plugin, coloque em `openclaw.plugin.json`
- se for sobre empacotamento, arquivos de entrada ou comportamento de instalação npm, coloque em `package.json`

### campos de package.json que afetam a descoberta

Alguns metadados de plugin pré-runtime vivem intencionalmente em `package.json` sob o
bloco `openclaw` em vez de `openclaw.plugin.json`.
`openclaw.bundle` e `openclaw.bundle.json` não são contratos de plugin OpenClaw;
plugins nativos devem usar `openclaw.plugin.json` mais os campos compatíveis de
`package.json#openclaw` abaixo.

Exemplos importantes:

| Campo                                                                                      | O que significa                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | Declara pontos de entrada nativos de Plugin. Deve permanecer dentro do diretório do pacote do Plugin.                                                                                               |
| `openclaw.runtimeExtensions`                                                               | Declara pontos de entrada de tempo de execução JavaScript compilados para pacotes instalados. Deve permanecer dentro do diretório do pacote do Plugin.                                               |
| `openclaw.setupEntry`                                                                      | Ponto de entrada leve somente de configuração usado durante a integração inicial, a inicialização adiada de canais e a descoberta somente leitura de status de canal/SecretRef. Deve permanecer dentro do diretório do pacote do Plugin. |
| `openclaw.runtimeSetupEntry`                                                               | Declara o ponto de entrada de configuração JavaScript compilado para pacotes instalados. Exige `setupEntry`, deve existir e deve permanecer dentro do diretório do pacote do Plugin.                |
| `openclaw.channel`                                                                         | Metadados baratos de catálogo de canais, como rótulos, caminhos de documentação, aliases e texto de seleção.                                                                                        |
| `openclaw.channel.commands`                                                                | Metadados estáticos de comandos nativos e de padrão automático de Skills nativas usados por superfícies de configuração, auditoria e lista de comandos antes do carregamento do runtime do canal.   |
| `openclaw.channel.configuredState`                                                         | Metadados leves do verificador de estado configurado que podem responder "a configuração somente por env já existe?" sem carregar o runtime completo do canal.                                      |
| `openclaw.channel.persistedAuthState`                                                      | Metadados leves do verificador de autenticação persistida que podem responder "já há algo conectado?" sem carregar o runtime completo do canal.                                                     |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Dicas de instalação/atualização para Plugins incluídos e publicados externamente.                                                                                                                    |
| `openclaw.install.defaultChoice`                                                           | Caminho de instalação preferido quando várias fontes de instalação estão disponíveis.                                                                                                                |
| `openclaw.install.minHostVersion`                                                          | Versão mínima compatível do host OpenClaw, usando um piso semver como `>=2026.3.22` ou `>=2026.5.1-beta.1`.                                                                                         |
| `openclaw.compat.pluginApi`                                                                | Intervalo mínimo da API de Plugin do OpenClaw exigido por este pacote, usando um piso semver como `>=2026.5.27`.                                                                                    |
| `openclaw.install.expectedIntegrity`                                                       | String esperada de integridade da distribuição npm, como `sha512-...`; os fluxos de instalação e atualização verificam o artefato buscado contra ela.                                                |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Permite um caminho estreito de recuperação por reinstalação de Plugin incluído quando a configuração é inválida.                                                                                     |
| `openclaw.install.requiredPlatformPackages`                                                | Aliases de pacote npm que devem se materializar quando suas restrições de plataforma no lockfile corresponderem ao host atual.                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Permite que superfícies de canal do runtime de configuração carreguem antes da escuta e, depois, adia o Plugin completo do canal configurado até a ativação pós-escuta.                             |

Os metadados do manifesto decidem quais escolhas de provedor/canal/configuração aparecem na
integração inicial antes que o runtime carregue. `package.json#openclaw.install` informa à
integração inicial como buscar ou habilitar esse Plugin quando o usuário escolhe uma dessas
opções. Não mova dicas de instalação para `openclaw.plugin.json`.

`openclaw.install.minHostVersion` é aplicado durante a instalação e o carregamento do
registro de manifesto para fontes de Plugin não incluídas. Valores inválidos são rejeitados;
valores mais novos, mas válidos, ignoram Plugins externos em hosts mais antigos. Presume-se que
Plugins de origem incluídos estejam versionados junto com o checkout do host.

`openclaw.install.requiredPlatformPackages` é para pacotes npm que expõem
binários nativos obrigatórios por meio de aliases opcionais específicos de plataforma. Liste o
nome simples do pacote npm para cada alias de plataforma compatível. Durante a instalação npm,
o OpenClaw verifica somente o alias declarado cujas restrições no lockfile correspondem ao
host atual. Se o npm relatar sucesso, mas omitir esse alias, o OpenClaw tenta novamente uma vez
com um cache novo e reverte a instalação se o alias ainda estiver ausente.

`openclaw.compat.pluginApi` é aplicado durante a instalação de pacotes para fontes de
Plugin não incluídas. Use-o para o piso da API do SDK/runtime de Plugin do OpenClaw contra o qual
o pacote foi construído. Ele pode ser mais estrito que `minHostVersion` quando um pacote de
Plugin precisa de uma API mais nova, mas ainda mantém uma dica de instalação mais baixa para outros
fluxos. A sincronização de releases oficiais do OpenClaw eleva, por padrão, os pisos existentes da API de
Plugins oficiais para a versão da release do OpenClaw, mas releases apenas de Plugin podem manter um
piso mais baixo quando o pacote oferece suporte intencionalmente a hosts mais antigos. Não use apenas a
versão do pacote como contrato de compatibilidade. `peerDependencies.openclaw`
continua sendo metadado de pacote npm; o OpenClaw usa o contrato `openclaw.compat.pluginApi`
para decisões de compatibilidade de instalação.

Metadados oficiais de instalação sob demanda devem usar `clawhubSpec` quando o Plugin for
publicado no ClawHub; a integração inicial trata isso como a fonte remota preferida e
registra fatos do artefato do ClawHub após a instalação. `npmSpec` continua sendo o fallback de
compatibilidade para pacotes que ainda não migraram para o ClawHub.

A fixação exata da versão npm já fica em `npmSpec`, por exemplo
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Entradas oficiais de catálogo externo
devem combinar especificações exatas com `expectedIntegrity` para que os fluxos de atualização falhem
em modo fechado se o artefato npm buscado não corresponder mais à release fixada.
A integração inicial interativa ainda oferece especificações npm de registro confiável, incluindo
nomes simples de pacote e tags de distribuição, por compatibilidade. Diagnósticos de catálogo podem
distinguir fontes exatas, flutuantes, fixadas por integridade, sem integridade, com incompatibilidade de
nome de pacote e de escolha padrão inválida. Eles também avisam quando
`expectedIntegrity` está presente, mas não há uma fonte npm válida que ela possa fixar.
Quando `expectedIntegrity` está presente,
os fluxos de instalação/atualização a aplicam; quando ela é omitida, a resolução do registro é
registrada sem uma fixação de integridade.

Plugins de canal devem fornecer `openclaw.setupEntry` quando varreduras de status, lista de canais
ou SecretRef precisarem identificar contas configuradas sem carregar o runtime completo.
A entrada de configuração deve expor metadados do canal, além de adaptadores seguros para configuração,
status e segredos; mantenha clientes de rede, listeners do Gateway e
runtimes de transporte no ponto de entrada principal da extensão.

Campos de ponto de entrada de runtime não substituem verificações de limite de pacote para campos de
ponto de entrada de origem. Por exemplo, `openclaw.runtimeExtensions` não pode tornar carregável um
caminho de `openclaw.extensions` que escape do pacote.

`openclaw.install.allowInvalidConfigRecovery` é intencionalmente estreito. Ele não
torna instaláveis configurações arbitrariamente quebradas. Hoje, ele só permite que fluxos de instalação
se recuperem de falhas específicas e obsoletas de upgrade de Plugin incluído, como um
caminho ausente de Plugin incluído ou uma entrada `channels.<id>` obsoleta para esse mesmo
Plugin incluído. Erros de configuração não relacionados ainda bloqueiam a instalação e enviam operadores
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

Use-o quando fluxos de configuração, doctor, status ou presença somente leitura precisarem de uma
sondagem barata de autenticação sim/não antes que o Plugin completo do canal carregue. Estado de autenticação persistido não é
estado configurado do canal: não use estes metadados para habilitar Plugins automaticamente,
reparar dependências de runtime ou decidir se um runtime de canal deve carregar.
A exportação de destino deve ser uma função pequena que lê apenas estado persistido; não
a encaminhe pelo barrel completo do runtime do canal.

`openclaw.channel.configuredState` segue o mesmo formato para verificações baratas de configuração
somente por env:

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

Use-o quando um canal puder responder o estado configurado a partir de env ou outros
insumos mínimos fora do runtime. Se a verificação precisar de resolução completa de configuração ou do
runtime real do canal, mantenha essa lógica no hook `config.hasConfiguredState`
do Plugin.

## Precedência de descoberta (ids de Plugin duplicados)

O OpenClaw descobre Plugins a partir de várias raízes. Para a ordem bruta de varredura do sistema de arquivos,
consulte [Ordem de varredura de Plugins](/pt-BR/gateway/configuration-reference#plugin-scan-order). Se duas descobertas
compartilharem o mesmo `id`, somente o manifesto de **maior precedência** será mantido;
duplicatas de menor precedência são descartadas em vez de serem carregadas ao lado dele.

Precedência, da maior para a menor:

1. **Selecionado por configuração** — um caminho explicitamente fixado em `plugins.entries.<id>`
2. **Incluído** — Plugins enviados com o OpenClaw
3. **Instalação global** — Plugins instalados na raiz global de Plugins do OpenClaw
4. **Workspace** — Plugins descobertos em relação ao workspace atual

Implicações:

- Uma cópia bifurcada ou obsoleta de um Plugin incluído que esteja no workspace não sombreará a compilação incluída.
- Para realmente substituir um Plugin incluído por um local, fixe-o via `plugins.entries.<id>` para que ele vença por precedência, em vez de depender da descoberta no workspace.
- Descartes de duplicatas são registrados em log para que Doctor e diagnósticos de inicialização possam apontar para a cópia descartada.
- Substituições duplicadas selecionadas por configuração são redigidas como substituições explícitas nos diagnósticos, mas ainda avisam para que bifurcações obsoletas e sombreamentos acidentais permaneçam visíveis.

## Requisitos de JSON Schema

- **Todo Plugin deve fornecer um JSON Schema**, mesmo que não aceite configuração.
- Um schema vazio é aceitável (por exemplo, `{ "type": "object", "additionalProperties": false }`).
- Schemas são validados no momento de leitura/gravação da configuração, não em runtime.
- Ao estender ou criar um fork de um Plugin integrado com novas chaves de configuração, atualize o `configSchema` do `openclaw.plugin.json` desse Plugin ao mesmo tempo. Schemas de Plugins integrados são estritos, portanto adicionar `plugins.entries.<id>.config.myNewKey` na configuração do usuário sem adicionar `myNewKey` a `configSchema.properties` será rejeitado antes que o runtime do Plugin seja carregado.

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
  devem referenciar ids de Plugins **detectáveis**. Ids desconhecidos são **erros**.
- Se um Plugin estiver instalado, mas tiver um manifesto ou schema quebrado ou ausente,
  a validação falhará e o Doctor relatará o erro do Plugin.
- Se a configuração do Plugin existir, mas o Plugin estiver **desabilitado**, a configuração será mantida e
  um **aviso** será exibido no Doctor + logs.

Consulte a [referência de configuração](/pt-BR/gateway/configuration) para ver o schema completo de `plugins.*`.

## Observações

- O manifesto é **obrigatório para Plugins nativos do OpenClaw**, incluindo carregamentos do sistema de arquivos local. O runtime ainda carrega o módulo do Plugin separadamente; o manifesto serve apenas para descoberta + validação.
- Manifestos nativos são analisados com JSON5, portanto comentários, vírgulas finais e chaves sem aspas são aceitos desde que o valor final ainda seja um objeto.
- Somente campos de manifesto documentados são lidos pelo carregador de manifesto. Evite chaves personalizadas de nível superior.
- `channels`, `providers`, `cliBackends` e `skills` podem ser omitidos quando um Plugin não precisa deles.
- `providerCatalogEntry` deve permanecer leve e não deve importar código amplo de runtime; use-o para metadados estáticos do catálogo de provedores ou descritores de descoberta restritos, não para execução em tempo de solicitação.
- Tipos exclusivos de Plugin são selecionados por meio de `plugins.slots.*`: `kind: "memory"` via `plugins.slots.memory`, `kind: "context-engine"` via `plugins.slots.contextEngine` (padrão `legacy`).
- Declare o tipo exclusivo de Plugin neste manifesto. O `OpenClawPluginDefinition.kind` da entrada de runtime está obsoleto e permanece apenas como fallback de compatibilidade para Plugins mais antigos.
- Metadados de variáveis de ambiente (`setup.providers[].envVars`, `providerAuthEnvVars` obsoleto e `channelEnvVars`) são apenas declarativos. Status, auditoria, validação de entrega Cron e outras superfícies somente leitura ainda aplicam a confiança do Plugin e a política de ativação efetiva antes de tratar uma variável de ambiente como configurada.
- Para metadados do assistente de runtime que exigem código de provedor, consulte [hooks de runtime de provedor](/pt-BR/plugins/architecture-internals#provider-runtime-hooks).
- Se seu Plugin depender de módulos nativos, documente as etapas de build e quaisquer requisitos de allowlist do gerenciador de pacotes (por exemplo, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Relacionados

<CardGroup cols={3}>
  <Card title="Criação de Plugins" href="/pt-BR/plugins/building-plugins" icon="rocket">
    Primeiros passos com Plugins.
  </Card>
  <Card title="Arquitetura de Plugins" href="/pt-BR/plugins/architecture" icon="diagram-project">
    Arquitetura interna e modelo de capacidades.
  </Card>
  <Card title="Visão geral do SDK" href="/pt-BR/plugins/sdk-overview" icon="book">
    Referência do SDK de Plugin e importações de subcaminhos.
  </Card>
</CardGroup>
