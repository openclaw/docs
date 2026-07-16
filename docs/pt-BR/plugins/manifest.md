---
read_when:
    - Você está criando um plugin do OpenClaw
    - É necessário disponibilizar um esquema de configuração de Plugin ou depurar erros de validação de Plugin
summary: Requisitos de manifesto do Plugin + esquema JSON (validação estrita da configuração)
title: Manifesto do Plugin
x-i18n:
    generated_at: "2026-07-16T12:42:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4a858e0bba9ee47dd7ce96413f744818d721420549a0c9af82b72a5572e758c7
    source_path: plugins/manifest.md
    workflow: 16
---

Esta página aborda o **manifesto nativo de Plugin do OpenClaw**, `openclaw.plugin.json`. Para layouts de pacotes compatíveis (Codex, Claude, Cursor), consulte [Pacotes de Plugins](/pt-BR/plugins/bundles).

Os formatos de pacotes compatíveis usam seus próprios arquivos de manifesto:

- Pacote do Codex: `.codex-plugin/plugin.json`
- Pacote do Claude: `.claude-plugin/plugin.json`, ou o layout padrão de componentes do Claude sem manifesto
- Pacote do Cursor: `.cursor-plugin/plugin.json`

O OpenClaw detecta esses layouts automaticamente, mas não os valida em relação ao esquema `openclaw.plugin.json` abaixo. Para um pacote compatível, o OpenClaw lê os metadados do pacote, as raízes de Skills declaradas, as raízes de comandos do Claude, os padrões de `settings.json` do Claude, os padrões de LSP do Claude e os pacotes de hooks compatíveis, quando o layout corresponde às expectativas de runtime do OpenClaw.

Todo Plugin nativo do OpenClaw **deve** incluir `openclaw.plugin.json` na **raiz do Plugin**. O OpenClaw o lê para validar a configuração **sem executar o código do Plugin**. Um manifesto ausente ou inválido bloqueia a validação da configuração e é tratado como um erro do Plugin.

Consulte [Plugins](/pt-BR/tools/plugin) para ver o guia completo do sistema de Plugins e [Modelo de capacidades](/pt-BR/plugins/architecture#public-capability-model) para conhecer o modelo nativo de capacidades e as orientações atuais de compatibilidade externa.

## O que este arquivo faz

`openclaw.plugin.json` contém metadados que o OpenClaw lê **antes de carregar o código do seu Plugin**. Tudo nele deve ser simples o suficiente para ser inspecionado sem inicializar o runtime do Plugin.

**Use-o para:**

- identidade do Plugin, validação da configuração e dicas para a interface de configuração
- metadados de autenticação, integração inicial e configuração (alias, ativação automática, variáveis de ambiente do provedor e opções de autenticação)
- dicas de ativação para superfícies do plano de controle
- propriedade de famílias de modelos por forma abreviada
- snapshots estáticos de propriedade de capacidades (`contracts`)
- metadados do executor de QA que o host compartilhado `openclaw qa` pode inspecionar
- metadados de configuração específicos do canal, mesclados às superfícies de catálogo e validação

**Não o use para:** registrar comportamentos de runtime, declarar pontos de entrada de código ou metadados de instalação do npm. Esses elementos pertencem ao código do seu Plugin e ao `package.json`.

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
  "description": "Plugin do provedor OpenRouter",
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

| Campo                                | Obrigatório | Tipo                         | O que significa                                                                                                                                                                                                                                                              |
| ------------------------------------ | ----------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Sim      | `string`                     | ID canônico do plugin. Este é o ID usado em `plugins.entries.<id>`.                                                                                                                                                                                                        |
| `configSchema`                       | Sim      | `object`                     | JSON Schema embutido para a configuração deste plugin.                                                                                                                                                                                                                               |
| `requiresPlugins`                    | Não       | `string[]`                   | IDs de plugins que também devem estar instalados para que este plugin tenha efeito. A descoberta mantém o plugin carregável, mas emite um aviso quando algum plugin obrigatório está ausente.                                                                                                               |
| `enabledByDefault`                   | Não       | `true`                       | Marca um plugin incluído no pacote como habilitado por padrão. Omita-o ou defina qualquer valor diferente de `true` para deixar o plugin desabilitado por padrão.                                                                                                                                               |
| `enabledByDefaultOnPlatforms`        | Não       | `string[]`                   | Marca um plugin incluído no pacote como habilitado por padrão somente nas plataformas Node.js listadas, por exemplo, `["darwin"]`. A configuração explícita ainda prevalece.                                                                                                                                   |
| `legacyPluginIds`                    | Não       | `string[]`                   | IDs legados que são normalizados para este ID canônico de plugin.                                                                                                                                                                                                                     |
| `autoEnableWhenConfiguredProviders`  | Não       | `string[]`                   | IDs de provedores que devem habilitar este plugin automaticamente quando forem mencionados por referências de autenticação, configuração ou modelo.                                                                                                                                                                            |
| `kind`                               | Não       | `PluginKind \| PluginKind[]` | Declara um ou mais tipos exclusivos de plugin (`"memory"`, `"context-engine"`) usados por `plugins.slots.*`. Um plugin que controla ambos os slots declara ambos os tipos em um único array.                                                                                                    |
| `channels`                           | Não       | `string[]`                   | IDs de canais controlados por este plugin. Usados para descoberta e validação da configuração.                                                                                                                                                                                                |
| `providers`                          | Não       | `string[]`                   | IDs de provedores controlados por este plugin.                                                                                                                                                                                                                                         |
| `providerCatalogEntry`               | Não       | `string`                     | Caminho do módulo leve do catálogo de provedores, relativo à raiz do plugin, para metadados de catálogo de provedores com escopo de manifesto que podem ser carregados sem ativar todo o runtime do plugin.                                                                                        |
| `modelSupport`                       | Não       | `object`                     | Metadados abreviados da família de modelos, pertencentes ao manifesto, usados para carregar automaticamente o plugin antes do runtime.                                                                                                                                                                                |
| `modelCatalog`                       | Não       | `object`                     | Metadados declarativos do catálogo de modelos para provedores controlados por este plugin. Este é o contrato do plano de controle para futuras listagens somente leitura, integração inicial, seletores de modelos, aliases e supressão sem carregar o runtime do plugin.                                                |
| `modelPricing`                       | Não       | `object`                     | Política de consulta de preços externos controlada pelo provedor. Use-a para excluir provedores locais/auto-hospedados de catálogos remotos de preços ou mapear referências de provedores para IDs de catálogo do OpenRouter/LiteLLM sem codificar IDs de provedores diretamente no núcleo.                                                    |
| `modelIdNormalization`               | Não       | `object`                     | Limpeza de aliases/prefixos de IDs de modelo controlada pelo provedor, que deve ser executada antes do carregamento do runtime do provedor.                                                                                                                                                                                  |
| `providerEndpoints`                  | Não       | `object[]`                   | Metadados de host/baseUrl de endpoint pertencentes ao manifesto para rotas de provedores que o núcleo deve classificar antes do carregamento do runtime do provedor.                                                                                                                                                   |
| `providerRequest`                    | Não       | `object`                     | Metadados leves de família de provedores e compatibilidade de solicitações usados pela política genérica de solicitações antes do carregamento do runtime do provedor.                                                                                                                                                     |
| `secretProviderIntegrations`         | Não       | `Record<string, object>`     | Predefinições declarativas de provedores de execução SecretRef que as interfaces de configuração ou instalação podem oferecer sem codificar diretamente no núcleo integrações específicas de provedores.                                                                                                                            |
| `cliBackends`                        | Não       | `string[]`                   | IDs de backends de inferência da CLI controlados por este plugin. Usados para ativação automática na inicialização com base em referências explícitas de configuração.                                                                                                                                                                |
| `syntheticAuthRefs`                  | Não       | `string[]`                   | Referências de provedores ou backends da CLI cujo hook de autenticação sintética, controlado pelo plugin, deve ser sondado durante a descoberta de modelos a frio, antes do carregamento do runtime.                                                                                                                                     |
| `nonSecretAuthMarkers`               | Não       | `string[]`                   | Valores de chave de API de placeholder controlados por plugins incluídos no pacote que representam estado de credenciais locais, OAuth ou de ambiente que não contém segredos.                                                                                                                                                       |
| `commandAliases`                     | Não       | `object[]`                   | Nomes de comandos controlados por este plugin que devem produzir diagnósticos de configuração e da CLI cientes do plugin antes do carregamento do runtime.                                                                                                                                                       |
| `providerAuthEnvVars`                | Não       | `Record<string, string[]>`   | Metadados de ambiente de compatibilidade obsoletos para consulta de autenticação/status do provedor. Prefira `setup.providers[].envVars` para novos plugins; o OpenClaw ainda lê esses metadados durante o período de descontinuação.                                                                                        |
| `providerUsageAuthEnvVars`           | Não       | `Record<string, string[]>`   | Credenciais de provedores exclusivas para uso/faturamento. O OpenClaw usa esses nomes para descoberta de uso e remoção de segredos, mas nunca para autenticação de inferência.                                                                                                                                  |
| `providerAuthAliases`                | Não       | `Record<string, string>`     | IDs de provedores que devem reutilizar outro ID de provedor para consulta de autenticação, por exemplo, um provedor de programação que compartilha a chave de API e os perfis de autenticação do provedor base.                                                                                                                 |
| `channelEnvVars`                     | Não       | `Record<string, string[]>`   | Metadados leves de ambiente do canal que o OpenClaw pode inspecionar sem carregar o código do plugin. Use-os para interfaces de configuração ou autenticação de canais orientadas pelo ambiente que os auxiliares genéricos de inicialização/configuração devem detectar.                                                                                   |
| `providerAuthChoices`                | Não       | `object[]`                   | Metadados leves de opções de autenticação para seletores de integração inicial, resolução do provedor preferencial e vinculação simples de flags da CLI.                                                                                                                                                              |
| `activation`                         | Não       | `object`                     | Metadados leves do planejador de ativação para carregamento acionado por inicialização, provedor, comando, canal, rota e capacidade. Apenas metadados; o runtime do plugin ainda controla o comportamento real.                                                                                              |
| `setup`                              | Não       | `object`                     | Descritores leves de configuração/integração inicial que as interfaces de descoberta e configuração podem inspecionar sem carregar o runtime do plugin.                                                                                                                                                           |
| `qaRunners`                          | Não       | `object[]`                   | Descritores leves do executor de QA usados pelo host compartilhado `openclaw qa` antes do carregamento do runtime do plugin.                                                                                                                                                                             |
| `contracts`                          | Não       | `object`                     | Instantâneo estático da propriedade de capacidades para hooks de autenticação externos, embeddings, fala, transcrição em tempo real, voz em tempo real, compreensão de mídia, geração de imagens/vídeos/música, busca de conteúdo web, pesquisa na web, provedores de workers, extração de conteúdo de documentos/web e propriedade de ferramentas. |
| `configContracts`                    | Não       | `object`                     | Comportamento de configuração definido pelo manifesto e consumido por auxiliares genéricos do núcleo: detecção de sinalizadores perigosos, destinos de migração de SecretRef e restrição de caminhos de configuração legados. Consulte a [referência de configContracts](#configcontracts-reference).                                                     |
| `mediaUnderstandingProviderMetadata` | Não       | `Record<string, object>`     | Padrões econômicos de compreensão de mídia para IDs de provedores declarados em `contracts.mediaUnderstandingProviders`.                                                                                                                                                                   |
| `imageGenerationProviderMetadata`    | Não       | `Record<string, object>`     | Metadados econômicos de autenticação para geração de imagens referentes a IDs de provedores declarados em `contracts.imageGenerationProviders`, incluindo aliases de autenticação definidos pelo provedor e proteções de URL base.                                                                                                         |
| `videoGenerationProviderMetadata`    | Não       | `Record<string, object>`     | Metadados econômicos de autenticação para geração de vídeos referentes a IDs de provedores declarados em `contracts.videoGenerationProviders`, incluindo aliases de autenticação definidos pelo provedor e proteções de URL base.                                                                                                         |
| `musicGenerationProviderMetadata`    | Não       | `Record<string, object>`     | Metadados econômicos de autenticação para geração de música referentes a IDs de provedores declarados em `contracts.musicGenerationProviders`, incluindo aliases de autenticação definidos pelo provedor e proteções de URL base.                                                                                                         |
| `toolMetadata`                       | Não       | `Record<string, object>`     | Metadados econômicos de disponibilidade para ferramentas pertencentes ao plugin declaradas em `contracts.tools`. Use-os quando uma ferramenta não deve carregar o runtime sem que existam evidências de configuração, ambiente ou autenticação.                                                                                                  |
| `channelConfigs`                     | Não       | `Record<string, object>`     | Metadados de configuração de canal definidos pelo manifesto e mesclados às superfícies de descoberta e validação antes do carregamento do runtime.                                                                                                                                                                 |
| `skills`                             | Não       | `string[]`                   | Diretórios de Skills a serem carregados, relativos à raiz do plugin.                                                                                                                                                                                                                    |
| `name`                               | Não       | `string`                     | Nome legível do plugin.                                                                                                                                                                                                                                                |
| `description`                        | Não       | `string`                     | Resumo curto exibido nas superfícies do plugin.                                                                                                                                                                                                                                    |
| `catalog`                            | Não       | `object`                     | Dicas opcionais de apresentação para superfícies do catálogo de plugins. Esses metadados não instalam, habilitam nem concedem confiança a um plugin.                                                                                                                                               |
| `icon`                               | Não       | `string`                     | URL HTTPS da imagem para cartões do marketplace/catálogo. O ClawHub aceita qualquer URL `https://` válida e usa o ícone padrão do plugin quando ela é omitida ou inválida.                                                                                                         |
| `version`                            | Não       | `string`                     | Versão informativa do plugin.                                                                                                                                                                                                                                              |
| `uiHints`                            | Não       | `Record<string, object>`     | Rótulos da UI, textos de espaço reservado e indicações de sensibilidade para campos de configuração.                                                                                                                                                                                                          |

## referência do catálogo

`catalog` fornece dicas opcionais de exibição para navegadores de plugins. Os hosts podem ignorar essas dicas. Elas nunca instalam nem habilitam o plugin e não alteram seu comportamento em tempo de execução nem seu nível de confiança.

```json
{
  "catalog": {
    "featured": true,
    "order": 10
  }
}
```

| Campo      | Tipo      | O que significa                                                            |
| ---------- | --------- | -------------------------------------------------------------------------- |
| `featured` | `boolean` | Se as superfícies do catálogo devem destacar este plugin.                  |
| `order`    | `number`  | Dica de exibição em ordem crescente entre plugins selecionados; valores menores aparecem primeiro. |

## referência dos metadados de provedores de geração

Os campos de metadados de provedores de geração descrevem sinais estáticos de autenticação para os provedores declarados na lista `contracts.*GenerationProviders` correspondente. O OpenClaw lê esses campos antes do carregamento do runtime do provedor para que as ferramentas do núcleo possam determinar se um provedor de geração está disponível sem importar todos os plugins de provedores.

Use esses campos somente para fatos declarativos de baixo custo. Transporte, transformações de solicitações, renovação de tokens, validação de credenciais e o comportamento efetivo de geração permanecem no runtime do plugin.

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

| Campo                  | Obrigatório | Tipo       | O que significa                                                                                                                                       |
| ---------------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | Não       | `string[]` | IDs adicionais de provedores que devem contar como aliases estáticos de autenticação para o provedor de geração.                                                       |
| `authProviders`        | Não       | `string[]` | IDs de provedores cujos perfis de autenticação configurados devem contar como autenticação para este provedor de geração.                                                      |
| `configSignals`        | Não       | `object[]` | Sinais de disponibilidade de baixo custo, baseados somente em configuração, para provedores locais ou auto-hospedados que podem ser configurados sem perfis de autenticação nem variáveis de ambiente.                 |
| `authSignals`          | Não       | `object[]` | Sinais explícitos de autenticação. Quando presentes, substituem o conjunto padrão de sinais proveniente do ID do provedor, de `aliases` e de `authProviders`.                     |
| `referenceAudioInputs` | Não       | `boolean`  | Somente para geração de vídeo. Defina como `true` quando o provedor aceitar ativos de áudio de referência; caso contrário, `video_generate` oculta os parâmetros de referência de áudio. |

Cada entrada `configSignals` oferece suporte a:

| Campo            | Obrigatório | Tipo       | O que significa                                                                                                                                                                             |
| ---------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | Sim      | `string`   | Caminho com pontos até o objeto de configuração pertencente ao plugin que deve ser inspecionado, por exemplo, `plugins.entries.example.config`.                                                                                      |
| `overlayPath`    | Não       | `string`   | Caminho com pontos dentro da configuração raiz cujo objeto deve ser sobreposto ao objeto raiz antes da avaliação do sinal. Use-o para configurações específicas de recursos, como `image`, `video` ou `music`.   |
| `overlayMapPath` | Não       | `string`   | Caminho com pontos dentro da configuração raiz cujos valores de objeto devem, cada um, ser sobrepostos ao objeto raiz. Use-o para mapas de contas nomeadas, como `accounts`, nos quais qualquer conta configurada deve se qualificar. |
| `required`       | Não       | `string[]` | Caminhos com pontos dentro da configuração efetiva que devem ter valores configurados. Strings não podem estar vazias; objetos e arrays não podem estar vazios.                                                  |
| `requiredAny`    | Não       | `string[]` | Caminhos com pontos dentro da configuração efetiva dos quais pelo menos um deve ter um valor configurado.                                                                                                    |
| `mode`           | Não       | `object`   | Proteção opcional de modo de string dentro da configuração efetiva. Use-a quando a disponibilidade baseada somente em configuração se aplicar apenas a um modo.                                                                  |

Cada proteção `mode` oferece suporte a:

| Campo        | Obrigatório | Tipo       | O que significa                                                                      |
| ------------ | -------- | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | Não       | `string`   | Caminho com pontos dentro da configuração efetiva. O padrão é `mode`.                          |
| `default`    | Não       | `string`   | Valor de modo a ser usado quando a configuração omitir o caminho.                                  |
| `allowed`    | Não       | `string[]` | Se presente, o sinal será aprovado somente quando o modo efetivo for um destes valores. |
| `disallowed` | Não       | `string[]` | Se presente, o sinal falhará quando o modo efetivo for um destes valores.       |

Cada entrada `authSignals` oferece suporte a:

| Campo             | Obrigatório | Tipo     | O que significa                                                                                                                                                                 |
| ----------------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sim      | `string` | ID do provedor a ser verificado nos perfis de autenticação configurados.                                                                                                                             |
| `providerBaseUrl` | Não       | `object` | Proteção opcional que faz o sinal contar somente quando o provedor configurado referenciado usa uma URL base permitida. Use-a quando um alias de autenticação for válido apenas para determinadas APIs. |

Cada proteção `providerBaseUrl` oferece suporte a:

| Campo             | Obrigatório | Tipo       | O que significa                                                                                                                                        |
| ----------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sim      | `string`   | ID de configuração do provedor cujo `baseUrl` deve ser verificado.                                                                                                |
| `defaultBaseUrl`  | Não       | `string`   | URL base a ser presumida quando a configuração do provedor omitir `baseUrl`.                                                                                         |
| `allowedBaseUrls` | Sim      | `string[]` | URLs base permitidas para este sinal de autenticação. O sinal será ignorado quando a URL base configurada ou padrão não corresponder a um destes valores normalizados. |

## referência dos metadados de ferramentas

`toolMetadata` usa os mesmos formatos de `configSignals` e `authSignals` que os metadados de provedores de geração, indexados pelo nome da ferramenta. `contracts.tools` declara a propriedade. `toolMetadata` declara evidências de disponibilidade de baixo custo para que o OpenClaw possa evitar importar o runtime de um plugin apenas para que a fábrica de sua ferramenta retorne `null`.

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

As entradas `toolMetadata` também aceitam `optional` (marca a ferramenta como não obrigatória para a ativação do plugin) e `replaySafe` (marca a execução da ferramenta como segura para repetição após um turno incompleto do modelo), além dos campos compartilhados `configSignals`/`authSignals` acima.

Se uma ferramenta não tiver `toolMetadata`, o OpenClaw preservará o comportamento existente e carregará o plugin proprietário quando o contrato da ferramenta corresponder à política. Para ferramentas de caminhos críticos cuja fábrica dependa de autenticação/configuração, os autores de plugins devem declarar `toolMetadata` em vez de fazer o núcleo importar o runtime para consultá-lo.

## referência de providerAuthChoices

Cada entrada `providerAuthChoices` descreve uma opção de integração inicial ou autenticação. O OpenClaw lê isso antes do carregamento do runtime do provedor. As listas de configuração de provedores usam essas opções do manifesto, opções de configuração derivadas de descritores e metadados do catálogo de instalação sem carregar o runtime do provedor.

| Campo                 | Obrigatório | Tipo                                                                  | O que significa                                                                                             |
| --------------------- | -------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | Sim      | `string`                                                              | ID do provedor ao qual esta opção pertence.                                                                       |
| `method`              | Sim      | `string`                                                              | ID do método de autenticação ao qual encaminhar.                                                                            |
| `choiceId`            | Sim      | `string`                                                              | ID estável da opção de autenticação usado pelos fluxos de integração inicial e da CLI.                                                   |
| `choiceLabel`         | Não       | `string`                                                              | Rótulo exibido ao usuário. Se omitido, o OpenClaw usa `choiceId` como alternativa.                                         |
| `choiceHint`          | Não       | `string`                                                              | Texto breve de ajuda para o seletor.                                                                         |
| `assistantPriority`   | Não       | `number`                                                              | Valores menores aparecem primeiro nos seletores interativos conduzidos pelo assistente.                                        |
| `assistantVisibility` | Não       | `"visible"` \| `"manual-only"`                                        | Oculta a opção dos seletores do assistente, mas ainda permite a seleção manual pela CLI.                         |
| `deprecatedChoiceIds` | Não       | `string[]`                                                            | IDs de opções legadas que devem redirecionar os usuários para esta opção substituta.                                  |
| `groupId`             | Não       | `string`                                                              | ID de grupo opcional para agrupar opções relacionadas.                                                           |
| `groupLabel`          | Não       | `string`                                                              | Rótulo exibido ao usuário para esse grupo.                                                                         |
| `groupHint`           | Não       | `string`                                                              | Texto breve de ajuda para o grupo.                                                                          |
| `onboardingFeatured`  | Não       | `boolean`                                                             | Exibe este grupo no nível de destaque do seletor interativo de integração inicial, antes da entrada "More...". |
| `optionKey`           | Não       | `string`                                                              | Chave interna da opção para fluxos simples de autenticação com um único sinalizador.                                                       |
| `cliFlag`             | Não       | `string`                                                              | Nome do sinalizador da CLI, como `--openrouter-api-key`.                                                            |
| `cliOption`           | Não       | `string`                                                              | Formato completo da opção da CLI, como `--openrouter-api-key <key>`.                                              |
| `cliDescription`      | Não       | `string`                                                              | Descrição usada na ajuda da CLI.                                                                             |
| `appGuidedSecret`     | Não       | `boolean`                                                             | Um segredo colado junto com os padrões do provedor é suficiente para a configuração orientada pelo aplicativo.                              |
| `appGuidedDiscovery`  | Não       | `boolean`                                                             | O método de autenticação de runtime correspondente controla a descoberta local somente leitura por meio de `appGuidedSetup`.                 |
| `appGuidedAuth`       | Não       | `"oauth"` \| `"device-code"`                                          | Login interativo controlado pelo provedor que os clientes de configuração nativos podem renderizar genericamente.                        |
| `onboardingScopes`    | Não       | `Array<"text-inference" \| "image-generation" \| "music-generation">` | Em quais superfícies de integração inicial esta opção deve aparecer. Se omitido, o padrão é `["text-inference"]`.  |

Quando `appGuidedDiscovery` for verdadeiro, o método de autenticação do provedor correspondente deverá expor
`appGuidedSetup.detect` e `appGuidedSetup.prepare`. A detecção deverá ser
somente leitura: sem login, obtenção de modelo, download ou gravação de configuração. A preparação verifica novamente
o modelo exato selecionado e retorna uma proposta de configuração; o OpenClaw testa essa
proposta em tempo real, de forma isolada, e só a confirma após o sucesso.

## Referência de commandAliases

Use `commandAliases` quando um plugin controlar um nome de comando de runtime que os usuários possam colocar por engano em `plugins.allow` ou tentar executar como um comando raiz da CLI. O OpenClaw usa esses metadados para diagnósticos sem importar o código de runtime do plugin.

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
| `kind`       | Não       | `"runtime-slash"` | Marca o alias como um comando de barra do chat, em vez de um comando raiz da CLI. |
| `cliCommand` | Não       | `string`          | Comando raiz relacionado da CLI a ser sugerido para operações da CLI, se houver.  |

## Referência de activation

Use `activation` quando o plugin puder declarar com baixo custo quais eventos do plano de controle devem incluí-lo em um plano de ativação/carregamento.

Este bloco contém metadados do planejador, não uma API de ciclo de vida. Ele não registra comportamento de runtime, não substitui `register(...)` e não garante que o código do plugin já tenha sido executado. O planejador de ativação usa esses campos para restringir os plugins candidatos antes de recorrer aos metadados existentes de propriedade do manifesto, como `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` e hooks.

Prefira os metadados mais específicos que já descrevam a propriedade. Use `providers`, `channels`, `commandAliases`, descritores de configuração ou `contracts` quando esses campos expressarem a relação. Use `activation` para dicas adicionais ao planejador que não possam ser representadas por esses campos de propriedade. Use `cliBackends` no nível superior para aliases de runtime da CLI, como `claude-cli`, `my-cli` ou `google-gemini-cli`; `activation.onAgentHarnesses` destina-se apenas a IDs de ambientes de agente incorporados que ainda não tenham um campo de propriedade.

Todo plugin deve definir `activation.onStartup` intencionalmente. Defina-o como `true` somente quando o plugin precisar ser executado durante a inicialização do Gateway. Defina-o como `false` quando o plugin estiver inerte na inicialização e só deva ser carregado por gatilhos mais específicos. Omitir `onStartup` não faz mais com que o plugin seja carregado implicitamente na inicialização; use metadados explícitos de ativação para gatilhos de inicialização, canal, configuração, ambiente de agente, memória ou outros gatilhos de ativação mais específicos.

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
| `onStartup`        | Não       | `boolean`                                            | Ativação explícita na inicialização do Gateway. Todo plugin deve definir este campo. `true` importa o plugin durante a inicialização; `false` mantém o carregamento tardio na inicialização, a menos que outro gatilho correspondente exija o carregamento. |
| `onProviders`      | Não       | `string[]`                                           | IDs de provedores que devem incluir este plugin nos planos de ativação/carregamento.                                                                                                                      |
| `onAgentHarnesses` | Não       | `string[]`                                           | IDs de runtime de ambientes de agente incorporados que devem incluir este plugin nos planos de ativação/carregamento. Use `cliBackends` no nível superior para aliases de back-end da CLI.                                           |
| `onCommands`       | Não       | `string[]`                                           | IDs de comandos que devem incluir este plugin nos planos de ativação/carregamento.                                                                                                                       |
| `onChannels`       | Não       | `string[]`                                           | IDs de canais que devem incluir este plugin nos planos de ativação/carregamento.                                                                                                                       |
| `onRoutes`         | Não       | `string[]`                                           | Tipos de rotas que devem incluir este plugin nos planos de ativação/carregamento.                                                                                                                       |
| `onConfigPaths`    | Não       | `string[]`                                           | Caminhos de configuração relativos à raiz que devem incluir este plugin nos planos de inicialização/carregamento quando o caminho estiver presente e não estiver explicitamente desativado.                                                      |
| `onCapabilities`   | Não       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Indicações amplas de recursos usadas pelo planejamento de ativação do plano de controle. Prefira campos mais específicos quando possível.                                                                                     |

Consumidores ativos atuais:

- O planejamento de inicialização do Gateway usa `activation.onStartup` para importação explícita na inicialização.
- O planejamento da CLI acionado por comando recorre aos legados `commandAliases[].cliCommand` ou `commandAliases[].name`.
- O planejamento de inicialização do runtime do agente usa `activation.onAgentHarnesses` para harnesses incorporados e `cliBackends[]` de nível superior para aliases de runtime da CLI.
- O planejamento de configuração/canal acionado por canal recorre à propriedade legada de `channels[]` quando faltam metadados explícitos de ativação do canal.
- O planejamento de Plugins na inicialização usa `activation.onConfigPaths` para superfícies de configuração raiz que não são de canal, como o bloco `browser` do Plugin de navegador incluído.
- O planejamento de configuração/runtime acionado por provedor recorre à propriedade legada de `providers[]` e `cliBackends[]` de nível superior quando faltam metadados explícitos de ativação do provedor.

Os diagnósticos do planejador podem distinguir indicações explícitas de ativação do fallback de propriedade do manifesto. Por exemplo, `activation-command-hint` significa que `activation.onCommands` correspondeu, enquanto `manifest-command-alias` significa que o planejador usou a propriedade de `commandAliases`. Esses rótulos de motivo destinam-se a diagnósticos do host e testes; autores de Plugins devem continuar declarando os metadados que melhor descrevem a propriedade.

## Referência de qaRunners

Use `qaRunners` quando um Plugin fornecer um ou mais executores de transporte sob
a raiz compartilhada `openclaw qa`. Mantenha esses metadados leves e estáticos; o runtime
do Plugin ainda é responsável pelo registro efetivo da CLI por meio de uma superfície leve
`runtime-api.ts` que exporta `qaRunnerCliRegistrations` correspondentes. Um
`adapterFactory` opcional expõe o transporte a cenários compartilhados de QA sem
alterar o executor do comando registrado.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Execute a pista de QA ao vivo do Matrix baseada em Docker em um homeserver descartável"
    }
  ]
}
```

| Campo         | Obrigatório | Tipo     | O que significa                                                      |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Sim      | `string` | Subcomando montado sob `openclaw qa`, por exemplo, `matrix`.    |
| `description` | Não       | `string` | Texto de ajuda de fallback usado quando o host compartilhado precisa de um comando provisório. |

O id `adapterFactory` deve corresponder a `commandName`. Não exporte registros
para comandos ausentes do manifesto.

## Referência de setup

Use `setup` quando as superfícies de configuração e integração inicial precisarem de metadados leves pertencentes ao Plugin antes do carregamento do runtime.

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
            "source": "credenciais locais da openai"
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

O `cliBackends` de nível superior continua válido e descrevendo backends de inferência da CLI. `setup.cliBackends` é a superfície de descritores específica de configuração para fluxos de plano de controle/configuração que devem permanecer somente como metadados.

Quando presentes, `setup.providers` e `setup.cliBackends` são a superfície preferencial de consulta baseada primeiro em descritores para a descoberta de configuração. Se o descritor apenas restringir o Plugin candidato e a configuração ainda precisar de hooks de runtime mais completos durante a configuração, defina `requiresRuntime: true` e mantenha `setup-api` como caminho de execução de fallback.

O OpenClaw também inclui `setup.providers[].envVars` em consultas genéricas de autenticação de provedores e variáveis de ambiente. `providerAuthEnvVars` continua compatível por meio de um adaptador de compatibilidade durante o período de descontinuação, mas Plugins não incluídos que ainda o utilizam recebem um diagnóstico de manifesto. Novos Plugins devem colocar os metadados de ambiente de configuração/status em `setup.providers[].envVars`.

Use `providerUsageAuthEnvVars` quando uma credencial de cobrança ou em nível de organização precisar ativar `resolveUsageAuth` sem se tornar uma credencial de inferência. Esses nomes passam a integrar o bloqueio do dotenv do workspace, a remoção em processos filhos do ACP, a filtragem de segredos do sandbox e a remoção ampla de segredos. O runtime do provedor ainda lê e classifica o valor dentro de `resolveUsageAuth`.

O OpenClaw também pode derivar opções simples de configuração de `setup.providers[].authMethods` quando nenhuma entrada de configuração estiver disponível ou quando `setup.requiresRuntime: false` declarar que o runtime de configuração é desnecessário. Entradas explícitas de `providerAuthChoices` continuam sendo preferidas para rótulos personalizados, flags da CLI, escopo de integração inicial e metadados do assistente.

Defina `requiresRuntime: false` somente quando esses descritores forem suficientes para a superfície de configuração. O OpenClaw trata `false` explícito como um contrato somente de descritores e não executará `setup-api` nem `openclaw.setupEntry` para a consulta de configuração. Se um Plugin somente de descritores ainda fornecer uma dessas entradas de runtime de configuração, o OpenClaw relatará um diagnóstico adicional e continuará ignorando-a. A omissão de `requiresRuntime` mantém o comportamento de fallback legado para que Plugins existentes que adicionaram descritores sem a flag não deixem de funcionar.

Como a consulta de configuração pode executar código `setup-api` pertencente ao Plugin, os valores normalizados de `setup.providers[].id` e `setup.cliBackends[]` devem permanecer exclusivos entre os Plugins descobertos. A propriedade ambígua falha de forma fechada, em vez de escolher um vencedor com base na ordem de descoberta.

Quando o runtime de configuração é executado, os diagnósticos do registro de configuração relatam divergência de descritores se `setup-api` registrar um provedor ou backend da CLI que os descritores do manifesto não declaram, ou se um descritor não tiver um registro de runtime correspondente. Esses diagnósticos são adicionais e não rejeitam Plugins legados.

### Referência de setup.providers

| Campo          | Obrigatório | Tipo       | O que significa                                                                                    |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | Sim      | `string`   | Id do provedor exposto durante a configuração ou integração inicial. Mantenha os ids normalizados globalmente exclusivos.             |
| `authMethods`  | Não       | `string[]` | Ids de métodos de configuração/autenticação compatíveis com este provedor sem carregar o runtime completo.                       |
| `envVars`      | Não       | `string[]` | Variáveis de ambiente que superfícies genéricas de configuração/status podem verificar antes do carregamento do runtime do Plugin.               |
| `authEvidence` | Não       | `object[]` | Verificações leves de evidências locais de autenticação para provedores que podem autenticar por meio de marcadores não secretos. |

`authEvidence` destina-se a marcadores de credenciais locais pertencentes ao provedor que podem ser verificados sem carregar código de runtime. Essas verificações devem permanecer leves e locais: sem chamadas de rede, sem leituras do chaveiro ou de gerenciadores de segredos, sem comandos de shell e sem sondagens da API do provedor.

Entradas de evidência compatíveis:

| Campo              | Obrigatório | Tipo       | O que significa                                                                                                  |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | Sim      | `string`   | Atualmente, `local-file-with-env`.                                                                               |
| `fileEnvVar`       | Não       | `string`   | Variável de ambiente que contém um caminho explícito para o arquivo de credenciais.                                                           |
| `fallbackPaths`    | Não       | `string[]` | Caminhos de arquivos de credenciais locais verificados quando `fileEnvVar` está ausente ou vazio. Compatível com `${HOME}` e `${APPDATA}`. |
| `requiresAnyEnv`   | Não       | `string[]` | Pelo menos uma variável de ambiente listada deve estar preenchida para que a evidência seja válida.                                    |
| `requiresAllEnv`   | Não       | `string[]` | Todas as variáveis de ambiente listadas devem estar preenchidas para que a evidência seja válida.                                           |
| `credentialMarker` | Sim      | `string`   | Marcador não secreto retornado quando a evidência está presente.                                                       |
| `source`           | Não       | `string`   | Rótulo de origem voltado ao usuário para a saída de autenticação/status.                                                               |

### Campos de setup

| Campo              | Obrigatório | Tipo       | O que significa                                                                                       |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | Não       | `object[]` | Descritores de configuração de provedores expostos durante a configuração e integração inicial.                                     |
| `cliBackends`      | Não       | `string[]` | Ids de backends usados durante a configuração para a consulta baseada primeiro em descritores. Mantenha os ids normalizados globalmente exclusivos. |
| `configMigrations` | Não       | `string[]` | Ids de migração de configuração pertencentes à superfície de configuração deste Plugin.                                          |
| `requiresRuntime`  | Não       | `boolean`  | Indica se a configuração ainda precisa executar `setup-api` após a consulta de descritores.                            |

## Referência de uiHints

`uiHints` é um mapa de nomes de campos de configuração para pequenas dicas de renderização. As chaves podem usar pontos para campos de configuração aninhados, mas nenhum segmento de caminho pode ser `__proto__`, `constructor` ou `prototype`; a configuração rejeita esses nomes.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "Chave de API",
      "help": "Usada para solicitações ao OpenRouter",
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
| `help`        | `string`   | Texto auxiliar curto.                      |
| `tags`        | `string[]` | Tags opcionais da interface.                       |
| `advanced`    | `boolean`  | Marca o campo como avançado.            |
| `sensitive`   | `boolean`  | Marca o campo como secreto ou sensível. |
| `placeholder` | `string`   | Texto de placeholder para entradas de formulário.       |

## Referência de contracts

Use `contracts` somente para metadados estáticos de propriedade de recursos que o OpenClaw possa ler sem importar o runtime do Plugin.

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
    "musicGenerationProviders": ["stability-audio"],
    "documentExtractors": ["example-docs"],
    "webContentExtractors": ["firecrawl"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "workerProviders": ["example-worker"],
    "usageProviders": ["acme-ai"],
    "migrationProviders": ["hermes"],
    "gatewayMethodDispatch": ["authenticated-request"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Cada lista é opcional:

| Campo                            | Tipo       | O que significa                                                                                                                        |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | IDs de fábrica de extensões do app-server do Codex, atualmente `codex-app-server`.                                                                |
| `agentToolResultMiddleware`      | `string[]` | IDs de runtime para os quais este plugin pode registrar middleware de resultado de ferramenta.                                                                     |
| `trustedToolPolicies`            | `string[]` | IDs de políticas locais confiáveis de pré-ferramenta do plugin que um plugin instalado pode registrar. Plugins incluídos podem registrar políticas sem este campo. |
| `externalAuthProviders`          | `string[]` | IDs de provedores cujo hook de perfil de autenticação externa pertence a este plugin.                                                                      |
| `embeddingProviders`             | `string[]` | IDs de provedores gerais de embeddings que pertencem a este plugin para uso reutilizável de embeddings vetoriais, incluindo memória.                                 |
| `speechProviders`                | `string[]` | IDs de provedores de fala que pertencem a este plugin.                                                                                                |
| `realtimeTranscriptionProviders` | `string[]` | IDs de provedores de transcrição em tempo real que pertencem a este plugin.                                                                                |
| `realtimeVoiceProviders`         | `string[]` | IDs de provedores de voz em tempo real que pertencem a este plugin.                                                                                        |
| `memoryEmbeddingProviders`       | `string[]` | IDs obsoletos de provedores de embeddings específicos de memória que pertencem a este plugin.                                                                  |
| `mediaUnderstandingProviders`    | `string[]` | IDs de provedores de compreensão de mídia que pertencem a este plugin.                                                                                   |
| `transcriptSourceProviders`      | `string[]` | IDs de provedores de fontes de transcrição que pertencem a este plugin.                                                                                     |
| `documentExtractors`             | `string[]` | IDs de provedores de extração de documentos (por exemplo, PDF) que pertencem a este plugin.                                                                  |
| `imageGenerationProviders`       | `string[]` | IDs de provedores de geração de imagens que pertencem a este plugin.                                                                                      |
| `videoGenerationProviders`       | `string[]` | IDs de provedores de geração de vídeos que pertencem a este plugin.                                                                                      |
| `musicGenerationProviders`       | `string[]` | IDs de provedores de geração de música que pertencem a este plugin.                                                                                      |
| `webContentExtractors`           | `string[]` | IDs de provedores de extração de conteúdo de páginas da Web que pertencem a este plugin.                                                                           |
| `webFetchProviders`              | `string[]` | IDs de provedores de busca de conteúdo da Web que pertencem a este plugin.                                                                                             |
| `webSearchProviders`             | `string[]` | IDs de provedores de pesquisa na Web que pertencem a este plugin.                                                                                            |
| `workerProviders`                | `string[]` | IDs de provedores de workers na nuvem que pertencem a este plugin para provisionamento e ciclo de vida de concessões respaldado por perfil.                                      |
| `usageProviders`                 | `string[]` | IDs de provedores cujos hooks de autenticação de uso e de snapshot de uso pertencem a este plugin.                                                             |
| `migrationProviders`             | `string[]` | IDs de provedores de importação que pertencem a este plugin para `openclaw migrate`.                                                                         |
| `gatewayMethodDispatch`          | `string[]` | Direito reservado para rotas HTTP autenticadas de plugins que despacham métodos do Gateway no processo.                                  |
| `tools`                          | `string[]` | Nomes de ferramentas de agente que pertencem a este plugin.                                                                                                   |

`contracts.embeddedExtensionFactories` é mantido para fábricas de extensões incluídas exclusivamente para o app-server do Codex. As transformações incluídas de resultados de ferramentas devem declarar `contracts.agentToolResultMiddleware` e, em vez disso, registrar-se com `api.registerAgentToolResultMiddleware(...)`. Plugins instalados podem usar o mesmo ponto de integração de middleware somente quando explicitamente habilitados e apenas para os runtimes que declaram em `contracts.agentToolResultMiddleware`.

Plugins instalados que precisam da camada de políticas de pré-ferramenta confiável pelo host devem declarar cada ID local registrado em `contracts.trustedToolPolicies` e ser explicitamente habilitados. Plugins incluídos mantêm o caminho existente de políticas confiáveis, mas plugins instalados com IDs de políticas não declarados são rejeitados antes do registro. Os IDs de políticas têm escopo restrito ao plugin que os registra, portanto, dois plugins podem declarar e registrar `workflow-budget`; um único plugin não pode registrar o mesmo ID local duas vezes.

Os registros de `api.registerTool(...)` do runtime devem corresponder a `contracts.tools`. A descoberta de ferramentas usa essa lista para carregar somente os runtimes de plugin que podem ser responsáveis pelas ferramentas solicitadas.

Plugins de provedores que implementam `resolveExternalAuthProfiles` devem declarar `contracts.externalAuthProviders`; hooks de autenticação externa não declarados são ignorados.

Plugins de provedores que implementam tanto `resolveUsageAuth` quanto `fetchUsageSnapshot` devem declarar cada ID de provedor descoberto automaticamente em `contracts.usageProviders`. A descoberta de uso lê esse contrato antes de carregar o código de runtime e, depois, verifica ambos os hooks após carregar somente os responsáveis declarados.

Provedores gerais de embeddings devem declarar `contracts.embeddingProviders` para cada adaptador registrado com `api.registerEmbeddingProvider(...)`. Use o contrato geral para geração reutilizável de vetores, incluindo provedores consumidos pela pesquisa de memória. `contracts.memoryEmbeddingProviders` é uma compatibilidade obsoleta específica de memória e permanece apenas enquanto os provedores existentes migram para o ponto de integração genérico de provedores de embeddings.

Provedores de workers devem declarar cada ID de `api.registerWorkerProvider(...)` em `contracts.workerProviders`. O núcleo persiste a intenção durável antes de chamar `provision`; os provedores validam suas configurações antes da alocação externa, e chamadas repetidas com o mesmo ID de operação devem adotar a mesma concessão. O núcleo também persiste esse snapshot das configurações validadas e o passa com `leaseId` para `inspect({ leaseId, profile })` e `destroy({ leaseId, profile })`, inclusive após o perfil nomeado ser alterado ou removido. A destruição é idempotente, a inspeção retorna a união fechada de status `active` / `destroyed` / `unknown`, e o material da chave privada SSH é referenciado somente por meio de `SecretRef`. Endpoints SSH provisionados também devem incluir um `hostKey` público proveniente da saída confiável de provisionamento exatamente como `algorithm base64`, sem nome de host ou comentário, para que o núcleo possa fixar o host antes de se conectar. Provedores que geram referências de identidade dinâmicas podem implementar o `resolveSshIdentity({ leaseId, profile, keyRef })` autoritativo; provedores sem ele usam o resolvedor genérico de segredos do núcleo. Um `unknown` autoritativo torna órfão um registro local ativo; após uma solicitação de destruição persistida, ele confirma o desmonte.

`contracts.gatewayMethodDispatch` atualmente aceita `"authenticated-request"`. Ele é uma barreira de higiene de API para rotas HTTP nativas de plugins que despacham intencionalmente métodos do plano de controle do Gateway no processo, não um sandbox contra plugins nativos maliciosos. Use-o somente para superfícies incluídas/de operador submetidas a análise rigorosa que já exigem autenticação HTTP do Gateway. Uma rota autorizada permanece acessível enquanto a admissão de trabalho raiz do Gateway está fechada somente quando também declara `auth: "gateway"` e o `gatewayRuntimeScopeSurface: "trusted-operator"` específico da rota; rotas irmãs comuns do mesmo plugin permanecem atrás do limite de admissão. Isso mantém o status de suspensão e a retomada acessíveis sem conceder a todo o plugin uma forma de contornar a admissão. Mantenha a análise e a formatação da resposta limitadas fora do despacho; trabalhos substanciais ou mutáveis devem passar pelo despacho de métodos do Gateway, que é responsável pela aplicação da admissão e do escopo.

## Referência de configContracts

Use `configContracts` para comportamentos de configuração pertencentes ao manifesto que os auxiliares genéricos do núcleo precisam acessar sem importar o runtime do plugin: detecção de sinalizadores perigosos, destinos de migração de SecretRef e restrição de caminhos de configuração legados.

```json
{
  "configContracts": {
    "compatibilityMigrationPaths": ["legacyProvider"],
    "compatibilityRuntimePaths": ["legacyProvider.webhook"],
    "dangerousFlags": [
      {
        "path": "accounts.*.allowUnverifiedSenders",
        "equals": true
      }
    ],
    "secretInputs": {
      "bundledDefaultEnabled": false,
      "paths": [
        {
          "path": "apiKey",
          "expected": "string"
        }
      ]
    }
  }
}
```

| Campo                         | Obrigatório | Tipo       | O que significa                                                                                                                                                                                                                          |
| ----------------------------- | -------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compatibilityMigrationPaths` | Não       | `string[]` | Caminhos de configuração relativos à raiz que indicam que as migrações de compatibilidade deste plugin durante a configuração podem ser aplicáveis. Permite que leituras genéricas de configuração do runtime ignorem todas as superfícies de configuração de plugins quando a configuração nunca faz referência ao plugin.                 |
| `compatibilityRuntimePaths`   | Não       | `string[]` | Caminhos de compatibilidade relativos à raiz que este plugin pode atender durante o runtime antes que o código do plugin seja totalmente ativado. Use isso para superfícies legadas que devem restringir os conjuntos de candidatos incluídos sem importar o runtime de todos os plugins compatíveis. |
| `dangerousFlags`              | Não       | `object[]` | Literais de configuração que `openclaw doctor` deve sinalizar como inseguros ou perigosos quando habilitados. Veja abaixo.                                                                                                                                   |
| `secretInputs`                | Não       | `object`   | Caminhos de configuração em `plugins.entries.<id>.config` que o registro de destinos de migração/auditoria de SecretRef deve tratar como strings com formato de segredo. Veja abaixo.                                                                                  |

Cada entrada de `dangerousFlags` é compatível com:

| Campo    | Obrigatório | Tipo                                  | O que significa                                                                                                       |
| -------- | -------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `path`   | Sim      | `string`                              | Caminho de configuração separado por pontos relativo a `plugins.entries.<id>.config`. Aceita curingas `*` para segmentos de mapa/matriz. |
| `equals` | Sim      | `string \| number \| boolean \| null` | Literal exato que marca este valor de configuração como perigoso.                                                            |

`secretInputs` é compatível com:

| Campo                   | Obrigatório | Tipo       | O que significa                                                                                                                                                                                                   |
| ----------------------- | ----------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled` | Não       | `boolean`  | Substitui a habilitação padrão do plugin incluído ao decidir se esta superfície SecretRef está ativa. Use isto quando o plugin estiver incluído, mas a superfície precisar permanecer inativa até ser explicitamente habilitada na configuração. |
| `paths`                 | Sim      | `object[]` | Caminhos de configuração em formato de segredo, cada um com `path` (separado por pontos, relativo a `plugins.entries.<id>.config`, compatível com curingas `*`) e `expected` opcional (atualmente apenas `"string"`).                            |

## Referência de mediaUnderstandingProviderMetadata

Use `mediaUnderstandingProviderMetadata` quando um provedor de compreensão de mídia tiver modelos padrão, prioridade de fallback de autenticação automática ou suporte nativo a documentos de que os auxiliares genéricos do núcleo precisam antes do carregamento do runtime. As chaves também devem ser declaradas em `contracts.mediaUnderstandingProviders`.

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
      "nativeDocumentInputs": ["pdf"],
      "documentModels": {
        "pdf": {
          "textExtraction": "example-doc-text-latest",
          "image": "example-doc-vision-latest"
        }
      }
    }
  }
}
```

Cada entrada de provedor pode incluir:

| Campo                  | Tipo                                                             | O que significa                                                                                                   |
| ---------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]`                              | Recursos de mídia disponibilizados por este provedor.                                                                    |
| `defaultModels`        | `Record<string, string>`                                         | Padrões de recurso para modelo usados quando a configuração não especifica um modelo.                                         |
| `autoPriority`         | `Record<string, number>`                                         | Números menores são ordenados primeiro no fallback automático de provedor baseado em credenciais.                                    |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | Entradas nativas de documentos compatíveis com o provedor.                                                               |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | Substituições de modelo por tipo de documento. Defina `image: false` para desabilitar a extração baseada em imagens para esse tipo de documento. |

## Referência de channelConfigs

Use `channelConfigs` quando um plugin de canal precisar de metadados de configuração leves antes do carregamento do runtime. A descoberta somente leitura da configuração e do status do canal pode usar esses metadados diretamente para canais externos configurados quando nenhuma entrada de configuração estiver disponível ou quando `setup.requiresRuntime: false` declarar que o runtime de configuração é desnecessário.

`channelConfigs` são metadados do manifesto do plugin, não uma nova seção de configuração de nível superior para o usuário. Os usuários ainda configuram instâncias de canal em `channels.<channel-id>`. O OpenClaw lê os metadados do manifesto para decidir qual plugin é responsável por esse canal configurado antes que o código do runtime do plugin seja executado.

Para um plugin de canal, `configSchema` e `channelConfigs` descrevem caminhos diferentes:

- `configSchema` valida `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valida `channels.<channel-id>`

Plugins não incluídos que declaram `channels[]` também devem declarar entradas `channelConfigs` correspondentes. Sem elas, o OpenClaw ainda pode carregar o plugin, mas as superfícies de esquema de configuração no caminho frio, configuração e Control UI não podem conhecer o formato da opção pertencente ao canal até que o runtime do plugin seja executado.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` e `nativeSkillsAutoEnabled` podem declarar padrões estáticos `auto` para verificações de configuração de comandos executadas antes do carregamento do runtime do canal. Canais incluídos também podem publicar os mesmos padrões por meio de `package.json#openclaw.channel.commands`, junto com seus outros metadados de catálogo de canais pertencentes ao pacote.

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
      "description": "Conexão com o homeserver do Matrix",
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
| `schema`      | `object`                 | JSON Schema para `channels.<id>`. Obrigatório para cada entrada declarada de configuração de canal.         |
| `uiHints`     | `Record<string, object>` | Rótulos, espaços reservados e indicações de conteúdo sensível opcionais da interface para essa seção de configuração de canal.          |
| `label`       | `string`                 | Rótulo do canal mesclado às superfícies de seleção e inspeção quando os metadados do runtime não estão prontos. |
| `description` | `string`                 | Descrição curta do canal para superfícies de inspeção e catálogo.                               |
| `commands`    | `object`                 | Padrões automáticos estáticos de comandos nativos e Skills nativas para verificações de configuração anteriores ao runtime.       |
| `preferOver`  | `string[]`               | IDs de plugins legados ou de menor prioridade que este canal deve superar nas superfícies de seleção.    |

### Substituição de outro plugin de canal

Use `preferOver` quando seu plugin for o responsável preferencial por um ID de canal que outro plugin também pode fornecer. Casos comuns são um ID de plugin renomeado, um plugin independente que substitui um plugin incluído ou um fork mantido que preserva o mesmo ID de canal para compatibilidade de configuração.

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

Quando `channels.chat` está configurado, o OpenClaw considera tanto o ID do canal quanto o ID do plugin preferencial. Se o plugin de menor prioridade tiver sido selecionado apenas por estar incluído ou habilitado por padrão, o OpenClaw o desabilita na configuração efetiva do runtime para que um único plugin seja responsável pelo canal e por suas ferramentas. A seleção explícita do usuário ainda prevalece: se o usuário habilitar explicitamente os dois plugins (por meio de `plugins.allow` ou de uma configuração `plugins.entries` significativa), o OpenClaw preservará essa escolha e relatará diagnósticos de canais e ferramentas duplicados, em vez de alterar silenciosamente o conjunto de plugins solicitado.

Mantenha `preferOver` restrito a IDs de plugins que realmente possam fornecer o mesmo canal. Ele não é um campo de prioridade geral e não renomeia as chaves de configuração do usuário.

## Referência de modelSupport

Use `modelSupport` quando o OpenClaw precisar inferir seu plugin de provedor a partir de IDs abreviados de modelos, como `gpt-5.6-sol` ou `claude-sonnet-4.6`, antes do carregamento do runtime do plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

O OpenClaw aplica esta precedência:

- referências `provider/model` explícitas usam os metadados do manifesto `providers` responsável
- `modelPatterns` têm precedência sobre `modelPrefixes`
- se um plugin não incluído e um plugin incluído corresponderem, o plugin não incluído prevalece
- a ambiguidade restante é ignorada até que o usuário ou a configuração especifique um provedor

Campos:

| Campo           | Tipo       | O que significa                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefixos comparados com `startsWith` em IDs abreviados de modelos.                 |
| `modelPatterns` | `string[]` | Fontes de expressões regulares comparadas com IDs abreviados de modelos após a remoção do sufixo do perfil. |

As entradas `modelPatterns` são compiladas por meio de `compileSafeRegex`, que rejeita padrões contendo repetição aninhada (por exemplo, `(a+)+$`). Padrões que falham na verificação de segurança são ignorados silenciosamente, da mesma forma que expressões regulares sintaticamente inválidas. Mantenha os padrões simples e evite quantificadores aninhados.

## Referência de modelCatalog

Use `modelCatalog` quando o OpenClaw precisar conhecer os metadados dos modelos do provedor antes de carregar o runtime do plugin. Esta é a fonte pertencente ao manifesto para linhas fixas do catálogo, aliases de provedores, regras de supressão e modo de descoberta. A atualização em runtime ainda pertence ao código do runtime do provedor, mas o manifesto informa ao núcleo quando o runtime é necessário.

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
        "reason": "não disponível no Azure OpenAI Responses"
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
| ---------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | Linhas de catálogo para IDs de provedores pertencentes a este plugin. As chaves também devem aparecer em `providers` no nível superior.       |
| `aliases`        | `Record<string, object>`                                 | Aliases de provedores que devem ser resolvidos para um provedor pertencente ao plugin durante o planejamento do catálogo ou da supressão.              |
| `suppressions`   | `object[]`                                               | Linhas de modelos de outra fonte que este plugin suprime por um motivo específico do provedor.                  |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | Indica se o catálogo do provedor pode ser lido dos metadados do manifesto, atualizado no cache ou se requer o runtime. |
| `runtimeAugment` | `boolean`                                                | Defina como `true` somente quando o runtime do provedor precisar acrescentar linhas ao catálogo após o planejamento do manifesto/configuração.       |

`aliases` participa da busca de propriedade do provedor para o planejamento do catálogo de modelos. Os destinos dos aliases devem ser provedores de nível superior pertencentes ao mesmo plugin. Quando uma lista filtrada por provedor usa um alias, o OpenClaw pode ler o manifesto proprietário e aplicar substituições de API/URL base do alias sem carregar o runtime do provedor. Os aliases não expandem listagens de catálogo não filtradas; listas abrangentes emitem somente as linhas do provedor canônico proprietário.

`suppressions` substitui o antigo hook `suppressBuiltInModel` do runtime do provedor. As entradas de supressão são respeitadas somente quando o provedor pertence ao plugin ou é declarado como uma chave `modelCatalog.aliases` que aponta para um provedor pertencente ao plugin. Hooks de supressão do runtime não são mais chamados durante a resolução de modelos.

Campos do provedor:

| Campo                 | Tipo                     | O que significa                                                                                                                                                                                                     |
| --------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`             | `string`                 | URL base padrão opcional para os modelos deste catálogo de provedor.                                                                                                                                                    |
| `api`                 | `ModelApi`               | Adaptador de API padrão opcional para os modelos deste catálogo de provedor.                                                                                                                                                 |
| `headers`             | `Record<string, string>` | Cabeçalhos estáticos opcionais aplicáveis a este catálogo de provedor.                                                                                                                                                      |
| `defaultUtilityModel` | `string`                 | ID opcional de modelo pequeno recomendado pelo provedor para tarefas utilitárias internas curtas (títulos, narração de progresso). Usado quando `agents.defaults.utilityModel` não está definido e este provedor atende ao modelo principal do agente. |
| `models`              | `object[]`               | Linhas de modelos obrigatórias. Linhas sem um `id` são ignoradas.                                                                                                                                                            |

Campos do modelo:

| Campo              | Tipo                                                           | O que significa                                                               |
| ------------------ | -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `id`               | `string`                                                       | ID de modelo local do provedor, sem o prefixo `provider/`.                    |
| `name`             | `string`                                                       | Nome de exibição opcional.                                                      |
| `api`              | `ModelApi`                                                     | Substituição de API opcional por modelo.                                            |
| `baseUrl`          | `string`                                                       | Substituição de URL base opcional por modelo.                                       |
| `headers`          | `Record<string, string>`                                       | Cabeçalhos estáticos opcionais por modelo.                                          |
| `input`            | `Array<"text" \| "image" \| "document">`                       | Modalidades aceitas pelo modelo. Outros valores são descartados silenciosamente.            |
| `reasoning`        | `boolean`                                                      | Indica se o modelo apresenta comportamento de raciocínio.                               |
| `contextWindow`    | `number`                                                       | Janela de contexto nativa do provedor.                                             |
| `contextTokens`    | `number`                                                       | Limite efetivo opcional de contexto no runtime quando diferente de `contextWindow`. |
| `maxTokens`        | `number`                                                       | Máximo de tokens de saída, quando conhecido.                                           |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | Substituições opcionais do ID do modelo ou de parâmetros por nível de pensamento.                    |
| `cost`             | `object`                                                       | Preço opcional em USD por milhão de tokens, incluindo `tieredPricing` opcional. |
| `compat`           | `object`                                                       | Sinalizadores opcionais de compatibilidade correspondentes à compatibilidade da configuração de modelos do OpenClaw.  |
| `mediaInput`       | `object`                                                       | Configuração de entrada opcional por modalidade, atualmente somente para imagens.                   |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Status da listagem. Suprima somente quando a linha não puder aparecer de forma alguma.          |
| `statusReason`     | `string`                                                       | Motivo opcional exibido com um status de indisponibilidade.                            |
| `replaces`         | `string[]`                                                     | IDs de modelo locais do provedor mais antigos que este modelo substitui.                       |
| `replacedBy`       | `string`                                                       | ID de modelo local do provedor substituto para linhas obsoletas.                    |
| `tags`             | `string[]`                                                     | Tags estáveis usadas por seletores e filtros.                                    |

Campos de supressão:

| Campo                      | Tipo       | O que significa                                                                                             |
| -------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | ID do provedor da linha upstream a ser suprimida. Deve pertencer a este plugin ou ser declarado como um alias pertencente ao plugin. |
| `model`                    | `string`   | ID de modelo local do provedor a ser suprimido.                                                                      |
| `reason`                   | `string`   | Mensagem opcional exibida quando a linha suprimida é solicitada diretamente.                                     |
| `when.baseUrlHosts`        | `string[]` | Lista opcional de hosts efetivos da URL base do provedor necessários para que a supressão seja aplicada.               |
| `when.providerConfigApiIn` | `string[]` | Lista opcional de valores `api` exatos da configuração do provedor necessários para que a supressão seja aplicada.              |

Não inclua dados exclusivos do runtime em `modelCatalog`. Use `static` somente quando as linhas do manifesto forem completas o suficiente para que as superfícies de lista filtrada por provedor e de seleção dispensem a descoberta do registro/runtime. Use `refreshable` quando as linhas do manifesto forem sementes ou complementos úteis e listáveis, mas uma atualização/cache puder adicionar mais linhas posteriormente; linhas atualizáveis não são autoritativas por si só. Use `runtime` quando o OpenClaw precisar carregar o runtime do provedor para conhecer a lista.

## Referência de modelIdNormalization

Use `modelIdNormalization` para a normalização simples de IDs de modelo pertencentes ao provedor que deve ocorrer antes do carregamento do runtime do provedor. Isso mantém aliases como nomes curtos de modelos, IDs locais legados do provedor e regras de prefixo de proxy no manifesto do plugin proprietário, em vez de nas tabelas centrais de seleção de modelos.

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
| `aliases`                            | `Record<string,string>` | Aliases exatos de IDs de modelo sem diferenciação entre maiúsculas e minúsculas. Os valores são retornados conforme escritos.                  |
| `stripPrefixes`                      | `string[]`              | Prefixos a serem removidos antes da busca de aliases, úteis para duplicação legada de provedor/modelo.     |
| `prefixWhenBare`                     | `string`                | Prefixo a ser adicionado quando o ID de modelo normalizado ainda não contiver `/`.                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Regras condicionais de prefixo para IDs sem prefixo após a busca de aliases, indexadas por `modelPrefix` e `prefix`. |

## Referência de providerEndpoints

Use `providerEndpoints` para a classificação de endpoints que a política genérica de solicitações precisa conhecer antes do carregamento do runtime do provedor. O núcleo ainda determina o significado de cada `endpointClass`; os manifestos dos plugins determinam os metadados de host e URL base.

Plugins de provedores oficialmente externalizados são excluídos da distribuição principal, portanto,
seus manifestos ficam invisíveis até serem instalados. Seus `providerEndpoints` também devem
ser espelhados em `scripts/lib/official-external-provider-catalog.json` para que
a classificação de endpoints continue funcionando sem o plugin; um teste de contrato
garante o espelhamento.

Campos do endpoint:

| Campo                          | Tipo       | O que significa                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Classe conhecida de endpoint do núcleo, como `openrouter`, `moonshot-native` ou `google-vertex`.        |
| `hosts`                        | `string[]` | Nomes de host exatos que correspondem à classe de endpoint.                                                |
| `hostSuffixes`                 | `string[]` | Sufixos de host que correspondem à classe de endpoint. Use o prefixo `.` para corresponder somente a sufixos de domínio. |
| `baseUrls`                     | `string[]` | URLs-base HTTP(S) normalizadas exatas que correspondem à classe de endpoint.                             |
| `googleVertexRegion`           | `string`   | Região estática do Google Vertex para hosts globais exatos.                                            |
| `googleVertexRegionHostSuffix` | `string`   | Sufixo a ser removido dos hosts correspondentes para expor o prefixo da região do Google Vertex.                 |

## Referência de providerRequest

Use `providerRequest` para metadados leves de compatibilidade de solicitações necessários à política genérica de solicitações sem carregar o runtime do provedor. Mantenha a reescrita de payload específica de comportamento nos hooks de runtime do provedor ou em auxiliares compartilhados da família de provedores.

```json
{
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
| `family`              | `string`     | Rótulo da família de provedores usado por decisões genéricas de compatibilidade de solicitações e diagnósticos. |
| `compatibilityFamily` | `"moonshot"` | Grupo opcional de compatibilidade da família de provedores para auxiliares compartilhados de solicitações.              |
| `openAICompletions`   | `object`     | Sinalizadores de solicitação de completions compatíveis com OpenAI, atualmente `supportsStreamingUsage`.       |

## Referência de secretProviderIntegrations

Use `secretProviderIntegrations` quando um plugin puder publicar uma predefinição reutilizável de provedor exec de SecretRef. O OpenClaw lê esses metadados antes de o runtime do plugin ser carregado, armazena a propriedade do plugin em `secrets.providers.<alias>.pluginIntegration` e deixa a resolução efetiva de segredos para o runtime de SecretRef. As predefinições são expostas somente para plugins incluídos e plugins instalados descobertos nas raízes gerenciadas de instalação de plugins, como instalações pelo git e pelo ClawHub.

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

A chave do mapa é o id da integração. Se `providerAlias` for omitido, o OpenClaw usará o id da integração como alias do provedor SecretRef. Os aliases de provedor devem corresponder ao padrão normal de aliases de provedor SecretRef, por exemplo, `team-secrets` ou `onepassword-work`.

Quando um operador seleciona a predefinição, o OpenClaw grava uma referência de provedor como:

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

Na inicialização/recarga, o OpenClaw resolve esse provedor carregando os metadados atuais do manifesto do plugin, verificando se o plugin proprietário está instalado e ativo e materializando o comando exec a partir do manifesto. Desabilitar ou remover o plugin revoga o provedor para SecretRefs ativas. Operadores que desejem uma configuração exec independente ainda podem definir diretamente provedores manuais `command`/`args`.

Atualmente, somente predefinições `source: "exec"` são compatíveis. `command` deve ser `${node}`, e `args[0]` deve ser um script de resolução `./` relativo à raiz do plugin. O OpenClaw o materializa na inicialização/recarga usando o executável Node atual e o caminho absoluto do script dentro do plugin. Opções do Node como `--require`, `--import`, `--loader`, `--env-file`, `--eval` e `--print` não fazem parte do contrato de predefinição do manifesto. Operadores que precisem de comandos que não sejam do Node podem configurar diretamente provedores exec manuais independentes.

O OpenClaw deriva `trustedDirs` para predefinições do manifesto a partir da raiz do plugin e, para predefinições `${node}`, do diretório atual do executável Node. Valores `trustedDirs` definidos no manifesto são ignorados. Outras opções do provedor exec, como `timeoutMs`, `noOutputTimeoutMs`, `maxOutputBytes`, `jsonOnly`, `env`, `passEnv` e `allowInsecurePath`, são repassadas para a configuração normal do provedor exec de SecretRef.

## Referência de modelPricing

Use `modelPricing` quando um provedor precisar de comportamento de preços do plano de controle antes que o runtime seja carregado. O cache de preços do Gateway lê esses metadados sem importar o código de runtime do provedor.

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
| `external`   | `boolean`         | Defina como `false` para provedores locais/hospedados pelo próprio usuário que nunca devem buscar preços do OpenRouter ou do LiteLLM. |
| `openRouter` | `false \| object` | Mapeamento de consulta de preços do OpenRouter. `false` desabilita a consulta ao OpenRouter para este provedor.           |
| `liteLLM`    | `false \| object` | Mapeamento de consulta de preços do LiteLLM. `false` desabilita a consulta ao LiteLLM para este provedor.                 |

Campos da fonte:

| Campo                      | Tipo               | O que significa                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Id do provedor no catálogo externo quando for diferente do id do provedor no OpenClaw, por exemplo, `z-ai` para um provedor `zai`. |
| `passthroughProviderModel` | `boolean`          | Trata ids de modelo que contêm barras como referências aninhadas de provedor/modelo, útil para provedores proxy como o OpenRouter.       |
| `modelIdTransforms`        | `"version-dots"[]` | Variantes adicionais de ids de modelo do catálogo externo. `version-dots` tenta ids de versão com pontos, como `claude-opus-4.6`.            |

### Índice de provedores do OpenClaw

O Índice de Provedores do OpenClaw consiste em metadados de pré-visualização pertencentes ao OpenClaw para provedores cujos plugins talvez ainda não estejam instalados. Ele não faz parte do manifesto de um plugin. Os manifestos de plugins continuam sendo a autoridade para plugins instalados. O Índice de Provedores é o contrato interno de fallback que futuras interfaces de seleção de modelos antes da instalação e de provedores instaláveis consumirão quando um plugin de provedor não estiver instalado.

Ordem de autoridade do catálogo:

1. Configuração do usuário.
2. Manifesto do plugin instalado `modelCatalog`.
3. Cache do catálogo de modelos proveniente de uma atualização explícita.
4. Linhas de pré-visualização do Índice de Provedores do OpenClaw.

O Índice de Provedores não deve conter segredos, estado habilitado, hooks de runtime nem dados de modelos específicos de contas ativas. Seus catálogos de pré-visualização usam o mesmo formato de linha de provedor `modelCatalog` dos manifestos de plugins, mas devem permanecer limitados a metadados de exibição estáveis, a menos que campos do adaptador de runtime, como `api`, `baseUrl`, preços ou sinalizadores de compatibilidade, sejam intencionalmente mantidos alinhados ao manifesto do plugin instalado. Provedores com descoberta `/models` em tempo real devem gravar linhas atualizadas pelo caminho explícito do cache do catálogo de modelos, em vez de fazer com que a listagem normal ou a integração inicial chame APIs de provedores.

As entradas do Índice de Provedores também podem conter metadados de plugins instaláveis para provedores cujo plugin tenha sido removido do núcleo ou ainda não esteja instalado por outro motivo. Esses metadados refletem o padrão do catálogo de canais: nome do pacote, especificação de instalação npm, integridade esperada e rótulos simples de opções de autenticação são suficientes para exibir uma opção de configuração instalável. Depois que o plugin é instalado, seu manifesto prevalece, e a entrada do Índice de Provedores é ignorada para esse provedor.

`openclaw doctor --fix` migra um conjunto pequeno e fechado de chaves legadas de capacidade do manifesto no nível superior para `contracts.*`: `speechProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders` e `tools`. Nenhuma delas (nem qualquer outra lista de capacidades) é mais lida como campo de manifesto no nível superior; o carregamento normal do manifesto só as reconhece sob `contracts`.

## Manifesto em comparação com package.json

Os dois arquivos têm finalidades diferentes:

| Arquivo                   | Use-o para                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Descoberta, validação de configuração, metadados de opções de autenticação e dicas de interface que devem existir antes da execução do código do plugin                         |
| `package.json`         | Metadados npm, instalação de dependências e o bloco `openclaw` usado para pontos de entrada, controle de instalação, configuração ou metadados de catálogo |

Se houver dúvida sobre onde um metadado deve ficar, use esta regra:

- se o OpenClaw precisar conhecê-lo antes de carregar o código do plugin, coloque-o em `openclaw.plugin.json`
- se estiver relacionado a empacotamento, arquivos de entrada ou comportamento de instalação do npm, coloque-o em `package.json`

### Campos de package.json que afetam a descoberta

Alguns metadados de plugins anteriores ao runtime ficam intencionalmente em `package.json`, no bloco `openclaw`, em vez de `openclaw.plugin.json`. `openclaw.bundle` e `openclaw.bundle.json` não são contratos de plugins do OpenClaw; plugins nativos devem usar `openclaw.plugin.json` junto com os campos `package.json#openclaw` compatíveis abaixo.

Exemplos importantes:

| Campo                                                                                      | O que significa                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | Declara pontos de entrada nativos do plugin. Devem permanecer dentro do diretório do pacote do plugin.                                                                                                   |
| `openclaw.runtimeExtensions`                                                               | Declara pontos de entrada de runtime JavaScript compilados para pacotes instalados. Devem permanecer dentro do diretório do pacote do plugin.                                                                 |
| `openclaw.setupEntry`                                                                      | Ponto de entrada leve, exclusivo para configuração, usado durante a integração inicial, a inicialização adiada do canal e a descoberta somente leitura do status do canal/SecretRef. Deve permanecer dentro do diretório do pacote do plugin. |
| `openclaw.runtimeSetupEntry`                                                               | Declara o ponto de entrada de configuração JavaScript compilado para pacotes instalados. Requer `setupEntry`, deve existir e deve permanecer dentro do diretório do pacote do plugin.                         |
| `openclaw.channel`                                                                         | Metadados leves do catálogo de canais, como rótulos, caminhos de documentação, aliases e texto de seleção.                                                                                                 |
| `openclaw.channel.commands`                                                                | Metadados estáticos de padrões automáticos de comandos nativos e Skills nativas, usados pelas superfícies de configuração, auditoria e lista de comandos antes do carregamento do runtime do canal.                                          |
| `openclaw.channel.configuredState`                                                         | Metadados leves do verificador de estado configurado, capazes de responder "já existe uma configuração somente por variáveis de ambiente?" sem carregar todo o runtime do canal.                                         |
| `openclaw.channel.persistedAuthState`                                                      | Metadados leves do verificador de autenticação persistida, capazes de responder "já há algo autenticado?" sem carregar todo o runtime do canal.                                               |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Dicas de instalação/atualização para plugins integrados e publicados externamente.                                                                                                                   |
| `openclaw.install.defaultChoice`                                                           | Caminho de instalação preferencial quando várias fontes de instalação estão disponíveis.                                                                                                                  |
| `openclaw.install.minHostVersion`                                                          | Versão mínima compatível do host OpenClaw, usando um limite mínimo semver como `>=2026.3.22` ou `>=2026.5.1-beta.1`.                                                                             |
| `openclaw.compat.pluginApi`                                                                | Intervalo mínimo da API de plugins do OpenClaw exigido por este pacote, usando um limite mínimo semver como `>=2026.5.27`.                                                                                 |
| `openclaw.install.expectedIntegrity`                                                       | String esperada de integridade da distribuição npm, como `sha512-...`; os fluxos de instalação e atualização verificam o artefato obtido em relação a ela.                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Permite um caminho restrito de recuperação por reinstalação de plugin integrado quando a configuração é inválida.                                                                                                       |
| `openclaw.install.requiredPlatformPackages`                                                | Aliases de pacotes npm que devem ser materializados quando suas restrições de plataforma no lockfile correspondem ao host atual.                                                                           |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Permite que as superfícies de canal do runtime de configuração sejam carregadas antes da escuta e, em seguida, adia o plugin de canal totalmente configurado até a ativação posterior à escuta.                                                 |

Os metadados do manifesto determinam quais opções de provedor/canal/configuração aparecem na integração inicial antes do carregamento do runtime. `package.json#openclaw.install` informa à integração inicial como obter ou habilitar esse plugin quando o usuário escolhe uma dessas opções. Não mova as dicas de instalação para `openclaw.plugin.json`.

`openclaw.install.minHostVersion` é aplicado durante a instalação e o carregamento do registro de manifestos para fontes de plugins não integrados. Valores inválidos são rejeitados; valores mais recentes, porém válidos, fazem com que plugins externos sejam ignorados em hosts mais antigos. Presume-se que plugins de origem integrados tenham a mesma versão do checkout do host.

`openclaw.install.requiredPlatformPackages` destina-se a pacotes npm que expõem binários nativos obrigatórios por meio de aliases opcionais e específicos da plataforma. Liste o nome simples do pacote npm para cada alias de plataforma compatível. Durante a instalação pelo npm, o OpenClaw verifica somente o alias declarado cujas restrições no lockfile correspondem ao host atual. Se o npm informar sucesso, mas omitir esse alias, o OpenClaw tentará novamente uma vez com um cache novo e reverterá a instalação se o alias continuar ausente.

`openclaw.compat.pluginApi` é aplicado durante a instalação de pacotes para fontes de plugins não integrados. Use-o para indicar o limite mínimo da API do SDK/runtime de plugins do OpenClaw com a qual o pacote foi compilado. Ele pode ser mais restritivo que `minHostVersion` quando um pacote de plugin precisa de uma API mais recente, mas ainda mantém uma dica de instalação inferior para outros fluxos. Por padrão, a sincronização oficial de versões do OpenClaw eleva os limites mínimos existentes da API de plugins oficiais para a versão do OpenClaw, mas versões exclusivas de plugins podem manter um limite inferior quando o pacote oferece compatibilidade intencional com hosts mais antigos. Não use somente a versão do pacote como contrato de compatibilidade. `peerDependencies.openclaw` continua sendo um metadado do pacote npm; o OpenClaw usa o contrato `openclaw.compat.pluginApi` para decisões de compatibilidade de instalação.

Os metadados oficiais de instalação sob demanda devem usar `clawhubSpec` quando o plugin é publicado no ClawHub; a integração inicial trata essa opção como a fonte remota preferencial e registra os dados do artefato do ClawHub após a instalação. `npmSpec` continua sendo a alternativa de compatibilidade para pacotes que ainda não migraram para o ClawHub.

A fixação exata da versão npm já reside em `npmSpec`, por exemplo, `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. As entradas oficiais do catálogo externo devem combinar especificações exatas com `expectedIntegrity` para que os fluxos de atualização falhem de modo seguro se o artefato npm obtido deixar de corresponder à versão fixada. A integração inicial interativa ainda oferece especificações npm de registros confiáveis, incluindo nomes simples de pacotes e dist-tags, para fins de compatibilidade. Os diagnósticos do catálogo conseguem distinguir fontes exatas, flutuantes, fixadas por integridade, sem integridade, com incompatibilidade de nome de pacote e com opção padrão inválida. Eles também alertam quando `expectedIntegrity` está presente, mas não há uma fonte npm válida que possa ser fixada. Quando `expectedIntegrity` está presente, os fluxos de instalação/atualização o aplicam; quando é omitido, a resolução do registro é registrada sem uma fixação de integridade.

Os plugins de canal devem fornecer `openclaw.setupEntry` quando as verificações de status, lista de canais ou SecretRef precisam identificar contas configuradas sem carregar todo o runtime. A entrada de configuração deve expor os metadados do canal, além de adaptadores de configuração, status e segredos seguros para configuração; mantenha clientes de rede, listeners do Gateway e runtimes de transporte no ponto de entrada principal da extensão.

Os campos de ponto de entrada do runtime não substituem as verificações dos limites do pacote para campos de ponto de entrada de origem. Por exemplo, `openclaw.runtimeExtensions` não pode tornar carregável um caminho `openclaw.extensions` que escape desses limites.

`openclaw.install.allowInvalidConfigRecovery` é intencionalmente restrito. Ele não torna instaláveis configurações arbitrariamente corrompidas. Atualmente, ele permite apenas que os fluxos de instalação se recuperem de falhas específicas e obsoletas na atualização de plugins integrados, como um caminho ausente de plugin integrado ou uma entrada `channels.<id>` obsoleta para esse mesmo plugin integrado. Erros de configuração não relacionados ainda bloqueiam a instalação e encaminham os operadores para `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` é um metadado de pacote para um módulo verificador pequeno:

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

Use-o quando os fluxos de configuração, doctor, status ou presença somente leitura precisarem de uma verificação simples de autenticação do tipo sim/não antes do carregamento de todo o plugin de canal. O estado de autenticação persistido não é o estado configurado do canal: não use esses metadados para habilitar plugins automaticamente, reparar dependências de runtime ou decidir se um runtime de canal deve ser carregado. A exportação de destino deve ser uma função pequena que leia somente o estado persistido; não a encaminhe pelo barrel completo do runtime do canal.

`openclaw.channel.configuredState` permite verificações configuradas de baixo custo. Prefira metadados declarativos de ambiente quando as variáveis de ambiente forem suficientes:

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "env": {
          "allOf": ["TELEGRAM_BOT_TOKEN"]
        }
      }
    }
  }
}
```

Use `env.allOf` quando todas as variáveis listadas forem obrigatórias e `env.anyOf` quando qualquer variável não vazia for suficiente. Se uma pequena verificação fora do runtime precisar de mais do que metadados de ambiente, use `specifier` junto com `exportName`, conforme mostrado para `persistedAuthState`; quando `env` está presente, o OpenClaw o utiliza sem carregar esse módulo. Se a verificação precisar da resolução completa da configuração ou do runtime real do canal, mantenha essa lógica no hook `config.hasConfiguredState` do plugin.

## Precedência da descoberta (IDs de plugins duplicados)

O OpenClaw descobre plugins em três raízes, verificadas nesta ordem: plugins integrados distribuídos com o OpenClaw, a raiz de instalação global (`~/.openclaw/extensions`) e a raiz do espaço de trabalho atual (`<workspace>/.openclaw/extensions`), além de quaisquer entradas explícitas em `plugins.load.paths`.

Se duas descobertas compartilham o mesmo `id`, somente o manifesto de **maior precedência** é mantido; duplicatas de menor precedência são descartadas em vez de serem carregadas ao lado dele. Precedência, da maior para a menor:

1. **Selecionado pela configuração** — um caminho explicitamente fixado em `plugins.entries.<id>`
2. **Instalação global correspondente a um registro de instalação rastreado** — um plugin instalado por meio de `openclaw plugin install`/`openclaw plugin update` que o rastreamento de instalações do OpenClaw reconhece para esse mesmo ID, mesmo quando o ID também pertence a um plugin integrado
3. **Integrado** — plugins distribuídos com o OpenClaw
4. **Espaço de trabalho** — plugins descobertos em relação ao espaço de trabalho atual
5. Qualquer outro candidato descoberto

Implicações:

- Uma cópia bifurcada ou obsoleta de um plugin integrado, sem rastreamento no espaço de trabalho ou na raiz global, não substituirá a compilação integrada.
- Para substituir um plugin integrado, execute `openclaw plugin install` para esse ID, de modo que a instalação global rastreada tenha precedência sobre a cópia integrada, ou fixe um caminho específico por meio de `plugins.entries.<id>`, para que ele prevaleça pela precedência de seleção por configuração.
- Os descartes de duplicatas são registrados em log para que o Doctor e os diagnósticos de inicialização possam indicar a cópia descartada.
- As substituições de duplicatas selecionadas pela configuração são descritas como substituições explícitas nos diagnósticos, mas ainda geram alertas para manter visíveis bifurcações obsoletas e sombreamentos acidentais.

## Requisitos do JSON Schema

- **Todo plugin deve incluir um JSON Schema**, mesmo que não aceite nenhuma configuração.
- Um schema vazio é aceitável (por exemplo, `{ "type": "object", "additionalProperties": false }`).
- Os schemas são validados no momento da leitura/gravação da configuração, não em tempo de execução.
- Ao estender ou criar um fork de um plugin incluído com novas chaves de configuração, atualize também o `openclaw.plugin.json` `configSchema` desse plugin. Os schemas dos plugins incluídos são estritos; portanto, adicionar `plugins.entries.<id>.config.myNewKey` à configuração do usuário sem adicionar `myNewKey` a `configSchema.properties` será rejeitado antes que o runtime do plugin seja carregado.

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

## Comportamento da validação

- Chaves `channels.*` desconhecidas são **erros**, a menos que o ID do canal seja declarado pelo manifesto de um plugin. Se o mesmo ID também aparecer em `plugins.allow`, `plugins.entries` ou `plugins.installs` (um plugin que é referenciado, mas não pode ser descoberto no momento), o OpenClaw rebaixa isso para um **aviso**.
- `plugins.entries.<id>`, `plugins.allow` e `plugins.deny` que referenciam IDs de plugins desconhecidos são **avisos** ("entrada de configuração obsoleta ignorada"), não erros, para que atualizações e plugins removidos/renomeados não impeçam a inicialização do Gateway.
- `plugins.slots.memory` que referencia um ID de plugin desconhecido é um **erro**, exceto no caso do plugin externo oficial conhecido `memory-lancedb`, que gera um aviso.
- Se um plugin estiver instalado, mas tiver um manifesto ou schema ausente ou inválido, a validação falhará e o Doctor informará o erro do plugin.
- Se houver uma configuração de plugin, mas o plugin estiver **desativado**, a configuração será mantida e um **aviso** será exibido no Doctor e nos logs.

Consulte a [Referência de configuração](/pt-BR/gateway/configuration) para ver o schema completo de `plugins.*`.

## Observações

- O manifesto é **obrigatório para plugins nativos do OpenClaw**, incluindo carregamentos do sistema de arquivos local. O runtime ainda carrega o módulo do plugin separadamente; o manifesto serve apenas para descoberta e validação.
- Os manifestos nativos são analisados com JSON5; portanto, comentários, vírgulas finais e chaves sem aspas são aceitos, desde que o valor final continue sendo um objeto.
- Somente os campos de manifesto documentados são lidos pelo carregador de manifestos. Evite chaves personalizadas no nível superior.
- `channels`, `providers`, `cliBackends` e `skills` podem ser omitidos quando um plugin não precisar deles.
- `providerCatalogEntry` deve permanecer leve e não deve importar grandes partes do código do runtime; use-o para metadados estáticos do catálogo de provedores ou descritores específicos de descoberta, não para execução durante o processamento de solicitações.
- Tipos exclusivos de plugins são selecionados por meio de `plugins.slots.*`: `kind: "memory"` por meio de `plugins.slots.memory` (padrão: `memory-core`), `kind: "context-engine"` por meio de `plugins.slots.contextEngine` (padrão: `legacy`).
- Declare o tipo exclusivo do plugin neste manifesto. O `OpenClawPluginDefinition.kind` da entrada do runtime está obsoleto e permanece apenas como fallback de compatibilidade para plugins mais antigos.
- Os metadados de variáveis de ambiente (`setup.providers[].envVars`, o obsoleto `providerAuthEnvVars` e `channelEnvVars`) são apenas declarativos. O status, a auditoria, a validação de entrega do Cron e outras superfícies somente leitura ainda aplicam a confiança do plugin e a política de ativação efetiva antes de considerar uma variável de ambiente configurada.
- Para metadados do assistente em tempo de execução que exigem código do provedor, consulte [Hooks de runtime do provedor](/pt-BR/plugins/architecture-internals#provider-runtime-hooks).
- Se o plugin depender de módulos nativos, documente as etapas de compilação e todos os requisitos de lista de permissões do gerenciador de pacotes (por exemplo, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Conteúdo relacionado

<CardGroup cols={3}>
  <Card title="Desenvolvimento de plugins" href="/pt-BR/plugins/building-plugins" icon="rocket">
    Primeiros passos com plugins.
  </Card>
  <Card title="Arquitetura de plugins" href="/pt-BR/plugins/architecture" icon="diagram-project">
    Arquitetura interna e modelo de recursos.
  </Card>
  <Card title="Visão geral do SDK" href="/pt-BR/plugins/sdk-overview" icon="book">
    Referência do SDK de plugins e importações de subcaminhos.
  </Card>
</CardGroup>
