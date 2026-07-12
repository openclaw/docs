---
read_when:
    - Você está criando um plugin do OpenClaw
    - Você precisa disponibilizar um esquema de configuração de Plugin ou depurar erros de validação de Plugin
summary: Requisitos do manifesto do Plugin + esquema JSON (validação estrita da configuração)
title: Manifesto do Plugin
x-i18n:
    generated_at: "2026-07-12T00:10:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd4ab5b10108585abb9a83a416b129e6f6351023016064b5d64b66aeabd04b2f
    source_path: plugins/manifest.md
    workflow: 16
---

Esta página aborda o **manifesto nativo de Plugin do OpenClaw**, `openclaw.plugin.json`. Para layouts de pacotes compatíveis (Codex, Claude, Cursor), consulte [Pacotes de Plugins](/pt-BR/plugins/bundles).

Os formatos de pacote compatíveis usam seus próprios arquivos de manifesto:

- Pacote do Codex: `.codex-plugin/plugin.json`
- Pacote do Claude: `.claude-plugin/plugin.json` ou o layout padrão de componentes do Claude sem manifesto
- Pacote do Cursor: `.cursor-plugin/plugin.json`

O OpenClaw detecta esses layouts automaticamente, mas não os valida de acordo com o esquema de `openclaw.plugin.json` abaixo. Para um pacote compatível, o OpenClaw lê os metadados do pacote, as raízes de Skills declaradas, as raízes de comandos do Claude, os padrões de `settings.json` do Claude, os padrões de LSP do Claude e os pacotes de hooks compatíveis, quando o layout corresponde às expectativas de runtime do OpenClaw.

Todo Plugin nativo do OpenClaw **deve** incluir `openclaw.plugin.json` na **raiz do Plugin**. O OpenClaw o lê para validar a configuração **sem executar o código do Plugin**. Um manifesto ausente ou inválido impede a validação da configuração e é tratado como um erro do Plugin.

Consulte [Plugins](/pt-BR/tools/plugin) para ver o guia completo do sistema de Plugins e [Modelo de capacidades](/pt-BR/plugins/architecture#public-capability-model) para conhecer o modelo nativo de capacidades e as orientações atuais de compatibilidade externa.

## O que este arquivo faz

`openclaw.plugin.json` contém metadados que o OpenClaw lê **antes de carregar o código do seu Plugin**. Tudo nele deve ser leve o suficiente para ser inspecionado sem iniciar o runtime do Plugin.

**Use-o para:**

- identidade do Plugin, validação da configuração e dicas para a interface de configuração
- metadados de autenticação, integração inicial e configuração (alias, ativação automática, variáveis de ambiente do provedor, opções de autenticação)
- dicas de ativação para superfícies do plano de controle
- atribuição abreviada de famílias de modelos
- instantâneos estáticos de atribuição de capacidades (`contracts`)
- metadados do executor de controle de qualidade que o host compartilhado `openclaw qa` pode inspecionar
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

## Referência dos campos de nível superior

| Campo                                | Obrigatório | Tipo                         | O que significa                                                                                                                                                                                                                                                                                    |
| ------------------------------------ | ----------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Sim         | `string`                     | ID canônico do Plugin. Este é o ID usado em `plugins.entries.<id>`.                                                                                                                                                                                                                                 |
| `configSchema`                       | Sim         | `object`                     | Esquema JSON embutido para a configuração deste Plugin.                                                                                                                                                                                                                                            |
| `requiresPlugins`                    | Não         | `string[]`                   | IDs de Plugins que também devem estar instalados para que este Plugin tenha efeito. A descoberta mantém o Plugin carregável, mas emite um aviso quando algum Plugin obrigatório está ausente.                                                                                                       |
| `enabledByDefault`                   | Não         | `true`                       | Marca um Plugin incluído no pacote como habilitado por padrão. Omita-o ou defina qualquer valor diferente de `true` para deixar o Plugin desabilitado por padrão.                                                                                                                                   |
| `enabledByDefaultOnPlatforms`        | Não         | `string[]`                   | Marca um Plugin incluído no pacote como habilitado por padrão somente nas plataformas Node.js listadas, por exemplo, `["darwin"]`. A configuração explícita ainda tem precedência.                                                                                                                  |
| `legacyPluginIds`                    | Não         | `string[]`                   | IDs legados que são normalizados para este ID canônico de Plugin.                                                                                                                                                                                                                                  |
| `autoEnableWhenConfiguredProviders`  | Não         | `string[]`                   | IDs de provedores que devem habilitar automaticamente este Plugin quando referências de autenticação, configuração ou modelo os mencionarem.                                                                                                                                                      |
| `kind`                               | Não         | `PluginKind \| PluginKind[]` | Declara um ou mais tipos exclusivos de Plugin (`"memory"`, `"context-engine"`) usados por `plugins.slots.*`. Um Plugin que controla ambos os slots declara os dois tipos em uma única matriz.                                                                                                        |
| `channels`                           | Não         | `string[]`                   | IDs de canais controlados por este Plugin. Usados para descoberta e validação da configuração.                                                                                                                                                                                                     |
| `providers`                          | Não         | `string[]`                   | IDs de provedores controlados por este Plugin.                                                                                                                                                                                                                                                      |
| `providerCatalogEntry`               | Não         | `string`                     | Caminho leve do módulo de catálogo de provedores, relativo à raiz do Plugin, para metadados do catálogo de provedores com escopo de manifesto que podem ser carregados sem ativar todo o runtime do Plugin.                                                                                           |
| `modelSupport`                       | Não         | `object`                     | Metadados abreviados de famílias de modelos controlados pelo manifesto, usados para carregar automaticamente o Plugin antes do runtime.                                                                                                                                                            |
| `modelCatalog`                       | Não         | `object`                     | Metadados declarativos do catálogo de modelos para provedores controlados por este Plugin. Este é o contrato do plano de controle para futuras listagens somente leitura, integração inicial, seletores de modelos, aliases e supressão sem carregar o runtime do Plugin.                             |
| `modelPricing`                       | Não         | `object`                     | Política de consulta de preços externos controlada pelo provedor. Use-a para excluir provedores locais/auto-hospedados de catálogos remotos de preços ou mapear referências de provedores para IDs de catálogo do OpenRouter/LiteLLM sem codificar IDs de provedores diretamente no núcleo.            |
| `modelIdNormalization`               | Não         | `object`                     | Limpeza de aliases/prefixos de IDs de modelos controlada pelo provedor, que deve ser executada antes do carregamento do runtime do provedor.                                                                                                                                                        |
| `providerEndpoints`                  | Não         | `object[]`                   | Metadados de host/baseUrl de endpoints controlados pelo manifesto para rotas de provedores que o núcleo deve classificar antes do carregamento do runtime do provedor.                                                                                                                             |
| `providerRequest`                    | Não         | `object`                     | Metadados leves de família de provedores e compatibilidade de solicitações, usados pela política genérica de solicitações antes do carregamento do runtime do provedor.                                                                                                                            |
| `secretProviderIntegrations`         | Não         | `Record<string, object>`     | Predefinições declarativas de provedores de execução SecretRef que as interfaces de configuração ou instalação podem oferecer sem codificar diretamente no núcleo integrações específicas de provedores.                                                                                           |
| `cliBackends`                        | Não         | `string[]`                   | IDs de backends de inferência da CLI controlados por este Plugin. Usados para ativação automática na inicialização com base em referências explícitas da configuração.                                                                                                                             |
| `syntheticAuthRefs`                  | Não         | `string[]`                   | Referências de provedores ou backends da CLI cujo gancho de autenticação sintética controlado pelo Plugin deve ser sondado durante a descoberta a frio de modelos antes do carregamento do runtime.                                                                                                  |
| `nonSecretAuthMarkers`               | Não         | `string[]`                   | Valores de chave de API de espaço reservado, controlados por Plugins incluídos no pacote, que representam um estado de credenciais locais, OAuth ou do ambiente que não é secreto.                                                                                                                |
| `commandAliases`                     | Não         | `object[]`                   | Nomes de comandos controlados por este Plugin que devem produzir diagnósticos de configuração e da CLI cientes do Plugin antes do carregamento do runtime.                                                                                                                                        |
| `providerAuthEnvVars`                | Não         | `Record<string, string[]>`   | Metadados obsoletos de variáveis de ambiente de compatibilidade para consulta de autenticação/status do provedor. Prefira `setup.providers[].envVars` para novos Plugins; o OpenClaw ainda os lê durante o período de descontinuação.                                                                  |
| `providerUsageAuthEnvVars`           | Não         | `Record<string, string[]>`   | Credenciais de provedores usadas apenas para uso/faturamento. O OpenClaw usa esses nomes para descoberta de uso e remoção de segredos, mas nunca para autenticação de inferência.                                                                                                                   |
| `providerAuthAliases`                | Não         | `Record<string, string>`     | IDs de provedores que devem reutilizar outro ID de provedor para consulta de autenticação, por exemplo, um provedor de programação que compartilha a chave de API e os perfis de autenticação do provedor base.                                                                                      |
| `channelEnvVars`                     | Não         | `Record<string, string[]>`   | Metadados leves de variáveis de ambiente de canais que o OpenClaw pode inspecionar sem carregar o código do Plugin. Use-os para configuração de canais orientada por variáveis de ambiente ou interfaces de autenticação que os auxiliares genéricos de inicialização/configuração devem reconhecer. |
| `providerAuthChoices`                | Não         | `object[]`                   | Metadados leves de opções de autenticação para seletores da integração inicial, resolução do provedor preferencial e associação simples de flags da CLI.                                                                                                                                           |
| `activation`                         | Não         | `object`                     | Metadados leves do planejador de ativação para carregamento acionado por inicialização, provedor, comando, canal, rota e capacidade. Apenas metadados; o runtime do Plugin ainda controla o comportamento efetivo.                                                                                   |
| `setup`                              | Não         | `object`                     | Descritores leves de configuração/integração inicial que a descoberta e as interfaces de configuração podem inspecionar sem carregar o runtime do Plugin.                                                                                                                                        |
| `qaRunners`                          | Não         | `object[]`                   | Descritores leves de executores de QA usados pelo host compartilhado `openclaw qa` antes do carregamento do runtime do Plugin.                                                                                                                                                                    |
| `contracts`                          | Não         | `object`                     | Instantâneo estático da propriedade de capacidades para ganchos de autenticação externos, embeddings, fala, transcrição em tempo real, voz em tempo real, compreensão de mídia, geração de imagens/vídeos/música, busca de recursos web, pesquisa na web, provedores de workers, extração de documentos/conteúdo web e propriedade de ferramentas. |
| `configContracts`                    | Não         | `object`                     | Comportamento de configuração controlado pelo manifesto e consumido por auxiliares genéricos do núcleo: detecção de flags perigosas, destinos de migração de SecretRef e restrição de caminhos de configuração legados. Consulte a [referência de configContracts](#configcontracts-reference).        |
| `mediaUnderstandingProviderMetadata` | Não      | `Record<string, object>`     | Padrões econômicos de compreensão de mídia para os IDs de provedores declarados em `contracts.mediaUnderstandingProviders`.                                                                                                                                                  |
| `imageGenerationProviderMetadata`    | Não      | `Record<string, object>`     | Metadados econômicos de autenticação para geração de imagens para os IDs de provedores declarados em `contracts.imageGenerationProviders`, incluindo aliases de autenticação pertencentes ao provedor e proteções para a URL base.                                            |
| `videoGenerationProviderMetadata`    | Não      | `Record<string, object>`     | Metadados econômicos de autenticação para geração de vídeos para os IDs de provedores declarados em `contracts.videoGenerationProviders`, incluindo aliases de autenticação pertencentes ao provedor e proteções para a URL base.                                              |
| `musicGenerationProviderMetadata`    | Não      | `Record<string, object>`     | Metadados econômicos de autenticação para geração de música para os IDs de provedores declarados em `contracts.musicGenerationProviders`, incluindo aliases de autenticação pertencentes ao provedor e proteções para a URL base.                                              |
| `toolMetadata`                       | Não      | `Record<string, object>`     | Metadados econômicos de disponibilidade para ferramentas pertencentes ao plugin declaradas em `contracts.tools`. Use-os quando uma ferramenta não deve carregar o ambiente de execução, a menos que existam evidências de configuração, variável de ambiente ou autenticação. |
| `channelConfigs`                     | Não      | `Record<string, object>`     | Metadados de configuração de canal pertencentes ao manifesto, mesclados às superfícies de descoberta e validação antes do carregamento do ambiente de execução.                                                                                                              |
| `skills`                             | Não      | `string[]`                   | Diretórios de Skills a serem carregados, relativos à raiz do plugin.                                                                                                                                                                                                        |
| `name`                               | Não      | `string`                     | Nome legível do plugin.                                                                                                                                                                                                                                                      |
| `description`                        | Não      | `string`                     | Resumo curto exibido nas superfícies do plugin.                                                                                                                                                                                                                             |
| `catalog`                            | Não      | `object`                     | Indicações opcionais de apresentação para as superfícies do catálogo de plugins. Esses metadados não instalam, habilitam nem concedem confiança a um plugin.                                                                                                                 |
| `icon`                               | Não      | `string`                     | URL HTTPS da imagem para cartões do marketplace/catálogo. O ClawHub aceita qualquer URL `https://` válida e usa o ícone padrão do plugin quando este campo é omitido ou inválido.                                                                                             |
| `version`                            | Não      | `string`                     | Versão informativa do plugin.                                                                                                                                                                                                                                               |
| `uiHints`                            | Não      | `Record<string, object>`     | Rótulos da interface, textos de exemplo e indicações de sensibilidade para campos de configuração.                                                                                                                                                                          |

## referência de `catalog`

`catalog` fornece dicas opcionais de exibição para navegadores de Plugins. Os hosts podem ignorar essas dicas. Elas nunca instalam nem habilitam o Plugin e não alteram seu comportamento em tempo de execução nem seu nível de confiança.

```json
{
  "catalog": {
    "featured": true,
    "order": 10
  }
}
```

| Campo      | Tipo      | O que significa                                                                                     |
| ---------- | --------- | --------------------------------------------------------------------------------------------------- |
| `featured` | `boolean` | Indica se as superfícies do catálogo devem dar destaque a este Plugin.                              |
| `order`    | `number`  | Dica de ordem crescente de exibição entre Plugins selecionados; valores menores aparecem primeiro. |

## Referência de metadados de provedores de geração

Os campos de metadados de provedores de geração descrevem sinais estáticos de autenticação para os provedores declarados na lista `contracts.*GenerationProviders` correspondente. O OpenClaw lê esses campos antes do carregamento do tempo de execução do provedor, permitindo que as ferramentas centrais determinem se um provedor de geração está disponível sem importar todos os Plugins de provedor.

Use esses campos apenas para fatos declarativos de baixo custo. Transporte, transformações de solicitações, renovação de tokens, validação de credenciais e o comportamento efetivo de geração permanecem no tempo de execução do Plugin.

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

| Campo                  | Obrigatório | Tipo       | O que significa                                                                                                                                                                            |
| ---------------------- | ----------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `aliases`              | Não         | `string[]` | IDs adicionais de provedor que devem ser considerados aliases estáticos de autenticação do provedor de geração.                                                                            |
| `authProviders`        | Não         | `string[]` | IDs de provedores cujos perfis de autenticação configurados devem ser considerados como autenticação para este provedor de geração.                                                        |
| `configSignals`        | Não         | `object[]` | Sinais de disponibilidade de baixo custo, baseados apenas em configuração, para provedores locais ou auto-hospedados que podem ser configurados sem perfis de autenticação nem variáveis de ambiente. |
| `authSignals`          | Não         | `object[]` | Sinais explícitos de autenticação. Quando presentes, substituem o conjunto padrão de sinais derivado do ID do provedor, de `aliases` e de `authProviders`.                                  |
| `referenceAudioInputs` | Não         | `boolean`  | Somente geração de vídeo. Defina como `true` quando o provedor aceitar recursos de áudio de referência; caso contrário, `video_generate` ocultará os parâmetros de referência de áudio.     |

Cada entrada de `configSignals` oferece suporte a:

| Campo            | Obrigatório | Tipo       | O que significa                                                                                                                                                                                                   |
| ---------------- | ----------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | Sim         | `string`   | Caminho com pontos até o objeto de configuração pertencente ao Plugin que será inspecionado, por exemplo, `plugins.entries.example.config`.                                                                        |
| `overlayPath`    | Não         | `string`   | Caminho com pontos dentro da configuração raiz cujo objeto deve ser sobreposto ao objeto raiz antes da avaliação do sinal. Use-o para configurações específicas de recursos, como `image`, `video` ou `music`.     |
| `overlayMapPath` | Não         | `string`   | Caminho com pontos dentro da configuração raiz cujos valores de objeto devem ser sobrepostos individualmente ao objeto raiz. Use-o para mapas de contas nomeadas, como `accounts`, nos quais qualquer conta configurada deve ser válida. |
| `required`       | Não         | `string[]` | Caminhos com pontos dentro da configuração efetiva que devem ter valores configurados. Strings não podem estar vazias; objetos e arrays também não podem estar vazios.                                             |
| `requiredAny`    | Não         | `string[]` | Caminhos com pontos dentro da configuração efetiva, dos quais pelo menos um deve ter um valor configurado.                                                                                                         |
| `mode`           | Não         | `object`   | Restrição opcional de modo em formato de string dentro da configuração efetiva. Use-a quando a disponibilidade baseada apenas na configuração se aplicar somente a um modo.                                       |

Cada restrição `mode` oferece suporte a:

| Campo        | Obrigatório | Tipo       | O que significa                                                                                          |
| ------------ | ----------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| `path`       | Não         | `string`   | Caminho com pontos dentro da configuração efetiva. O padrão é `mode`.                                    |
| `default`    | Não         | `string`   | Valor de modo a ser usado quando a configuração omitir o caminho.                                        |
| `allowed`    | Não         | `string[]` | Se presente, o sinal será válido somente quando o modo efetivo for um desses valores.                     |
| `disallowed` | Não         | `string[]` | Se presente, o sinal falhará quando o modo efetivo for um desses valores.                                |

Cada entrada de `authSignals` oferece suporte a:

| Campo             | Obrigatório | Tipo     | O que significa                                                                                                                                                                                   |
| ----------------- | ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sim         | `string` | ID do provedor a verificar nos perfis de autenticação configurados.                                                                                                                               |
| `providerBaseUrl` | Não         | `object` | Restrição opcional que faz o sinal ser considerado somente quando o provedor configurado referenciado usa uma URL base permitida. Use-a quando um alias de autenticação for válido apenas para determinadas APIs. |

Cada restrição `providerBaseUrl` oferece suporte a:

| Campo             | Obrigatório | Tipo       | O que significa                                                                                                                                                      |
| ----------------- | ----------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sim         | `string`   | ID da configuração do provedor cujo `baseUrl` deve ser verificado.                                                                                                   |
| `defaultBaseUrl`  | Não         | `string`   | URL base a ser presumida quando a configuração do provedor omitir `baseUrl`.                                                                                          |
| `allowedBaseUrls` | Sim         | `string[]` | URLs base permitidas para este sinal de autenticação. O sinal será ignorado quando a URL base configurada ou padrão não corresponder a um desses valores normalizados. |

## Referência de metadados de ferramentas

`toolMetadata` usa os mesmos formatos de `configSignals` e `authSignals` que os metadados de provedores de geração, indexados pelo nome da ferramenta. `contracts.tools` declara a propriedade. `toolMetadata` declara evidências de disponibilidade de baixo custo para que o OpenClaw possa evitar importar o tempo de execução de um Plugin apenas para que sua fábrica de ferramentas retorne `null`.

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

As entradas de `toolMetadata` também aceitam `optional` (marca a ferramenta como não obrigatória para a ativação do Plugin) e `replaySafe` (marca a execução da ferramenta como segura para repetição após um turno incompleto do modelo), além dos campos compartilhados de `configSignals`/`authSignals` acima.

Se uma ferramenta não tiver `toolMetadata`, o OpenClaw preservará o comportamento existente e carregará o Plugin proprietário quando o contrato da ferramenta corresponder à política. Para ferramentas em caminhos críticos cuja fábrica depende de autenticação/configuração, os autores de Plugins devem declarar `toolMetadata` em vez de fazer o núcleo importar o tempo de execução para consultá-lo.

## Referência de `providerAuthChoices`

Cada entrada de `providerAuthChoices` descreve uma opção de integração inicial ou autenticação. O OpenClaw lê essa informação antes do carregamento do tempo de execução do provedor. As listas de configuração de provedores usam essas opções do manifesto, opções de configuração derivadas de descritores e metadados do catálogo de instalação sem carregar o tempo de execução do provedor.

| Campo                 | Obrigatório | Tipo                                                                  | O que significa                                                                                                                    |
| --------------------- | ----------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `provider`            | Sim         | `string`                                                              | ID do provedor ao qual esta opção pertence.                                                                                         |
| `method`              | Sim         | `string`                                                              | ID do método de autenticação para o qual encaminhar.                                                                                |
| `choiceId`            | Sim         | `string`                                                              | ID estável da opção de autenticação usado nos fluxos de integração e da CLI.                                                        |
| `choiceLabel`         | Não         | `string`                                                              | Rótulo exibido ao usuário. Se omitido, o OpenClaw usa `choiceId` como alternativa.                                                  |
| `choiceHint`          | Não         | `string`                                                              | Texto curto de ajuda para o seletor.                                                                                                |
| `assistantPriority`   | Não         | `number`                                                              | Valores menores aparecem primeiro em seletores interativos controlados pelo assistente.                                            |
| `assistantVisibility` | Não         | `"visible"` \| `"manual-only"`                                        | Oculta a opção dos seletores do assistente, mas ainda permite a seleção manual pela CLI.                                            |
| `deprecatedChoiceIds` | Não         | `string[]`                                                            | IDs de opções legadas que devem redirecionar os usuários para esta opção substituta.                                                |
| `groupId`             | Não         | `string`                                                              | ID de grupo opcional para agrupar opções relacionadas.                                                                              |
| `groupLabel`          | Não         | `string`                                                              | Rótulo exibido ao usuário para esse grupo.                                                                                           |
| `groupHint`           | Não         | `string`                                                              | Texto curto de ajuda para o grupo.                                                                                                  |
| `onboardingFeatured`  | Não         | `boolean`                                                             | Exibe este grupo no nível de destaque do seletor interativo de integração, antes da entrada "Mais...".                              |
| `optionKey`           | Não         | `string`                                                              | Chave de opção interna para fluxos simples de autenticação com um único sinalizador.                                                |
| `cliFlag`             | Não         | `string`                                                              | Nome do sinalizador da CLI, como `--openrouter-api-key`.                                                                            |
| `cliOption`           | Não         | `string`                                                              | Formato completo da opção da CLI, como `--openrouter-api-key <key>`.                                                                |
| `cliDescription`      | Não         | `string`                                                              | Descrição usada na ajuda da CLI.                                                                                                    |
| `onboardingScopes`    | Não         | `Array<"text-inference" \| "image-generation" \| "music-generation">` | Em quais áreas da integração esta opção deve aparecer. Se omitido, o padrão é `["text-inference"]`.                                 |

## Referência de commandAliases

Use `commandAliases` quando um plugin for responsável por um nome de comando de runtime que os usuários possam inserir por engano em `plugins.allow` ou tentar executar como um comando raiz da CLI. O OpenClaw usa esses metadados para diagnósticos sem importar o código de runtime do plugin.

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

| Campo        | Obrigatório | Tipo              | O que significa                                                                 |
| ------------ | ----------- | ----------------- | ------------------------------------------------------------------------------- |
| `name`       | Sim         | `string`          | Nome do comando que pertence a este plugin.                                     |
| `kind`       | Não         | `"runtime-slash"` | Marca o alias como um comando de barra do chat, em vez de um comando raiz da CLI. |
| `cliCommand` | Não         | `string`          | Comando raiz relacionado da CLI a sugerir para operações da CLI, caso exista.   |

## Referência de activation

Use `activation` quando o plugin puder declarar de forma econômica quais eventos do plano de controle devem incluí-lo em um plano de ativação/carregamento.

Este bloco contém metadados do planejador, não uma API de ciclo de vida. Ele não registra comportamentos de runtime, não substitui `register(...)` e não garante que o código do plugin já tenha sido executado. O planejador de ativação usa esses campos para restringir os plugins candidatos antes de recorrer aos metadados de propriedade existentes no manifesto, como `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` e hooks.

Prefira os metadados mais específicos que já descrevam a propriedade. Use `providers`, `channels`, `commandAliases`, descritores de configuração ou `contracts` quando esses campos expressarem a relação. Use `activation` para dicas adicionais ao planejador que não possam ser representadas por esses campos de propriedade. Use `cliBackends` no nível superior para aliases de runtime da CLI, como `claude-cli`, `my-cli` ou `google-gemini-cli`; `activation.onAgentHarnesses` destina-se somente a IDs de harnesses de agente incorporados que ainda não tenham um campo de propriedade.

Todo plugin deve definir `activation.onStartup` intencionalmente. Defina-o como `true` somente quando o plugin precisar ser executado durante a inicialização do Gateway. Defina-o como `false` quando o plugin estiver inerte na inicialização e só deva ser carregado por gatilhos mais específicos. Omitir `onStartup` não faz mais com que o plugin seja carregado implicitamente na inicialização; use metadados de ativação explícitos para gatilhos de inicialização, canal, configuração, harness de agente, memória ou outros gatilhos mais específicos.

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

| Campo              | Obrigatório | Tipo                                                 | O que significa                                                                                                                                                                                        |
| ------------------ | ----------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `onStartup`        | Não         | `boolean`                                            | Ativação explícita na inicialização do Gateway. Todo plugin deve definir este campo. `true` importa o plugin durante a inicialização; `false` mantém o carregamento tardio na inicialização, a menos que outro gatilho correspondente exija o carregamento. |
| `onProviders`      | Não         | `string[]`                                           | IDs de provedores que devem incluir este plugin nos planos de ativação/carregamento.                                                                                                                    |
| `onAgentHarnesses` | Não         | `string[]`                                           | IDs de runtime de harnesses de agente incorporados que devem incluir este plugin nos planos de ativação/carregamento. Use `cliBackends` no nível superior para aliases de backends da CLI.                |
| `onCommands`       | Não         | `string[]`                                           | IDs de comandos que devem incluir este plugin nos planos de ativação/carregamento.                                                                                                                      |
| `onChannels`       | Não         | `string[]`                                           | IDs de canais que devem incluir este plugin nos planos de ativação/carregamento.                                                                                                                        |
| `onRoutes`         | Não         | `string[]`                                           | Tipos de rotas que devem incluir este plugin nos planos de ativação/carregamento.                                                                                                                       |
| `onConfigPaths`    | Não         | `string[]`                                           | Caminhos de configuração relativos à raiz que devem incluir este plugin nos planos de inicialização/carregamento quando o caminho estiver presente e não estiver explicitamente desativado.             |
| `onCapabilities`   | Não         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Dicas amplas de recursos usadas pelo planejamento de ativação do plano de controle. Prefira campos mais específicos quando possível.                                                                    |

Consumidores ativos atuais:

- O planejamento da inicialização do Gateway usa `activation.onStartup` para a importação explícita na inicialização.
- O planejamento da CLI acionado por comandos recorre ao legado `commandAliases[].cliCommand` ou `commandAliases[].name`.
- O planejamento da inicialização do runtime do agente usa `activation.onAgentHarnesses` para harnesses incorporados e `cliBackends[]` no nível superior para aliases de runtime da CLI.
- O planejamento de configuração/canal acionado por canal recorre à propriedade legada `channels[]` quando faltam metadados explícitos de ativação de canal.
- O planejamento de plugins na inicialização usa `activation.onConfigPaths` para áreas de configuração raiz que não sejam de canal, como o bloco `browser` do plugin de navegador incluído.
- O planejamento de configuração/runtime acionado por provedor recorre à propriedade legada `providers[]` e `cliBackends[]` no nível superior quando faltam metadados explícitos de ativação de provedor.

Os diagnósticos do planejador podem distinguir dicas explícitas de ativação do uso alternativo da propriedade do manifesto. Por exemplo, `activation-command-hint` significa que `activation.onCommands` correspondeu, enquanto `manifest-command-alias` significa que o planejador usou a propriedade de `commandAliases`. Esses rótulos de motivo destinam-se a diagnósticos e testes do host; os autores de plugins devem continuar declarando os metadados que melhor descrevem a propriedade.

## Referência de qaRunners

Use `qaRunners` quando um plugin fornecer um ou mais executores de transporte sob
a raiz compartilhada `openclaw qa`. Mantenha esses metadados leves e estáticos; o
runtime do plugin continua responsável pelo registro efetivo da CLI por meio de uma
interface leve `runtime-api.ts` que exporta `qaRunnerCliRegistrations` correspondentes. Um
`adapterFactory` opcional expõe o transporte a cenários compartilhados de QA sem
alterar o executor do comando registrado.

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

| Campo         | Obrigatório | Tipo     | O que significa                                                                 |
| ------------- | ----------- | -------- | ------------------------------------------------------------------------------- |
| `commandName` | Sim         | `string` | Subcomando montado sob `openclaw qa`, por exemplo, `matrix`.                    |
| `description` | Não         | `string` | Texto de ajuda alternativo usado quando o host compartilhado precisa de um comando provisório. |

O id de `adapterFactory` deve corresponder a `commandName`. Não exporte registros
para comandos ausentes do manifesto.

## Referência de setup

Use `setup` quando as interfaces de configuração e integração inicial precisarem de metadados econômicos pertencentes ao plugin antes do carregamento do runtime.

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

O `cliBackends` de nível superior continua válido e descrevendo backends de inferência da CLI. `setup.cliBackends` é a interface de descritores específica de configuração para fluxos do plano de controle e de configuração que devem permanecer baseados apenas em metadados.

Quando presentes, `setup.providers` e `setup.cliBackends` são a interface preferencial de consulta que prioriza descritores para a descoberta de configuração. Se o descritor apenas restringir o plugin candidato e a configuração ainda precisar de hooks de runtime mais completos durante a configuração, defina `requiresRuntime: true` e mantenha `setup-api` como caminho de execução alternativo.

O OpenClaw também inclui `setup.providers[].envVars` nas consultas genéricas de autenticação de provedores e de variáveis de ambiente. `providerAuthEnvVars` continua compatível por meio de um adaptador durante o período de descontinuação, mas plugins não integrados que ainda o utilizam recebem um diagnóstico de manifesto. Novos plugins devem colocar metadados de ambiente de configuração/status em `setup.providers[].envVars`.

Use `providerUsageAuthEnvVars` quando uma credencial de faturamento ou de nível organizacional precisar ativar `resolveUsageAuth` sem se tornar uma credencial de inferência. Esses nomes são adicionados ao bloqueio do dotenv do espaço de trabalho, à remoção em processos filhos ACP, à filtragem de segredos do sandbox e à limpeza ampla de segredos. O runtime do provedor ainda lê e classifica o valor dentro de `resolveUsageAuth`.

O OpenClaw também pode derivar opções simples de configuração de `setup.providers[].authMethods` quando nenhuma entrada de configuração estiver disponível ou quando `setup.requiresRuntime: false` declarar que o runtime de configuração é desnecessário. As entradas explícitas de `providerAuthChoices` continuam sendo preferidas para rótulos personalizados, flags da CLI, escopo de integração inicial e metadados do assistente.

Defina `requiresRuntime: false` somente quando esses descritores forem suficientes para a interface de configuração. O OpenClaw trata o valor `false` explícito como um contrato baseado apenas em descritores e não executará `setup-api` nem `openclaw.setupEntry` para a consulta de configuração. Se um plugin baseado apenas em descritores ainda incluir uma dessas entradas de runtime de configuração, o OpenClaw emitirá um diagnóstico adicional e continuará ignorando-a. A omissão de `requiresRuntime` mantém o comportamento legado de fallback para não interromper plugins existentes que adicionaram descritores sem a flag.

Como a consulta de configuração pode executar código `setup-api` pertencente ao plugin, os valores normalizados de `setup.providers[].id` e `setup.cliBackends[]` devem permanecer únicos entre os plugins descobertos. Em caso de propriedade ambígua, o processo falha de forma segura em vez de escolher um vencedor com base na ordem de descoberta.

Quando o runtime de configuração é executado, os diagnósticos do registro de configuração informam divergências de descritores caso `setup-api` registre um provedor ou backend da CLI que os descritores do manifesto não declarem, ou caso um descritor não tenha um registro correspondente no runtime. Esses diagnósticos são adicionais e não rejeitam plugins legados.

### Referência de setup.providers

| Campo          | Obrigatório | Tipo       | Significado                                                                                                      |
| -------------- | ----------- | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| `id`           | Sim         | `string`   | ID do provedor exposto durante a configuração ou integração inicial. Mantenha os IDs normalizados globalmente únicos. |
| `authMethods`  | Não         | `string[]` | IDs dos métodos de configuração/autenticação compatíveis com este provedor sem carregar o runtime completo.      |
| `envVars`      | Não         | `string[]` | Variáveis de ambiente que interfaces genéricas de configuração/status podem verificar antes de carregar o runtime do plugin. |
| `authEvidence` | Não         | `object[]` | Verificações econômicas de evidências locais de autenticação para provedores que podem autenticar por marcadores não secretos. |

`authEvidence` destina-se a marcadores locais de credenciais pertencentes ao provedor que podem ser verificados sem carregar código de runtime. Essas verificações devem permanecer econômicas e locais: sem chamadas de rede, leituras de chaveiros ou gerenciadores de segredos, comandos do shell nem sondagens da API do provedor.

Entradas de evidência compatíveis:

| Campo              | Obrigatório | Tipo       | Significado                                                                                                           |
| ------------------ | ----------- | ---------- | --------------------------------------------------------------------------------------------------------------------- |
| `type`             | Sim         | `string`   | Atualmente, `local-file-with-env`.                                                                                    |
| `fileEnvVar`       | Não         | `string`   | Variável de ambiente que contém o caminho explícito de um arquivo de credenciais.                                     |
| `fallbackPaths`    | Não         | `string[]` | Caminhos locais de arquivos de credenciais verificados quando `fileEnvVar` está ausente ou vazia. Aceita `${HOME}` e `${APPDATA}`. |
| `requiresAnyEnv`   | Não         | `string[]` | Pelo menos uma das variáveis de ambiente listadas deve conter um valor para que a evidência seja válida.              |
| `requiresAllEnv`   | Não         | `string[]` | Todas as variáveis de ambiente listadas devem conter um valor para que a evidência seja válida.                       |
| `credentialMarker` | Sim         | `string`   | Marcador não secreto retornado quando a evidência está presente.                                                      |
| `source`           | Não         | `string`   | Rótulo da origem exibido ao usuário na saída de autenticação/status.                                                  |

### Campos de setup

| Campo              | Obrigatório | Tipo       | Significado                                                                                                     |
| ------------------ | ----------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| `providers`        | Não         | `object[]` | Descritores de configuração de provedores expostos durante a configuração e a integração inicial.              |
| `cliBackends`      | Não         | `string[]` | IDs de backends usados durante a configuração para consultas que priorizam descritores. Mantenha os IDs normalizados globalmente únicos. |
| `configMigrations` | Não         | `string[]` | IDs de migrações de configuração pertencentes à interface de configuração deste plugin.                        |
| `requiresRuntime`  | Não         | `boolean`  | Indica se a configuração ainda precisa executar `setup-api` após a consulta de descritores.                    |

## Referência de uiHints

`uiHints` é um mapa dos nomes dos campos de configuração para pequenas dicas de renderização. As chaves podem usar pontos para campos de configuração aninhados, mas nenhum segmento do caminho pode ser `__proto__`, `constructor` ou `prototype`; a configuração rejeita esses nomes.

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

| Campo         | Tipo       | Significado                                  |
| ------------- | ---------- | -------------------------------------------- |
| `label`       | `string`   | Rótulo do campo exibido ao usuário.          |
| `help`        | `string`   | Texto de ajuda curto.                        |
| `tags`        | `string[]` | Tags opcionais da interface do usuário.      |
| `advanced`    | `boolean`  | Marca o campo como avançado.                 |
| `sensitive`   | `boolean`  | Marca o campo como secreto ou confidencial.  |
| `placeholder` | `string`   | Texto de placeholder para campos de formulário. |

## Referência de contracts

Use `contracts` somente para metadados estáticos de propriedade de recursos que o OpenClaw possa ler sem importar o runtime do plugin.

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

| Campo                            | Tipo       | O que significa                                                                                                                                                    |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | IDs de fábrica de extensões do servidor de aplicativos do Codex, atualmente `codex-app-server`.                                                                    |
| `agentToolResultMiddleware`      | `string[]` | IDs de runtime para os quais este Plugin pode registrar middleware de resultados de ferramentas.                                                                   |
| `trustedToolPolicies`            | `string[]` | IDs locais do Plugin para políticas confiáveis pré-ferramenta que um Plugin instalado pode registrar. Plugins integrados podem registrar políticas sem este campo. |
| `externalAuthProviders`          | `string[]` | IDs de provedores cujos hooks de perfil de autenticação externa pertencem a este Plugin.                                                                            |
| `embeddingProviders`             | `string[]` | IDs de provedores gerais de embeddings que pertencem a este Plugin para uso reutilizável de embeddings vetoriais, inclusive em memória.                             |
| `speechProviders`                | `string[]` | IDs de provedores de fala que pertencem a este Plugin.                                                                                                              |
| `realtimeTranscriptionProviders` | `string[]` | IDs de provedores de transcrição em tempo real que pertencem a este Plugin.                                                                                         |
| `realtimeVoiceProviders`         | `string[]` | IDs de provedores de voz em tempo real que pertencem a este Plugin.                                                                                                 |
| `memoryEmbeddingProviders`       | `string[]` | IDs obsoletos de provedores de embeddings específicos de memória que pertencem a este Plugin.                                                                       |
| `mediaUnderstandingProviders`    | `string[]` | IDs de provedores de compreensão de mídia que pertencem a este Plugin.                                                                                              |
| `transcriptSourceProviders`      | `string[]` | IDs de provedores de fontes de transcrição que pertencem a este Plugin.                                                                                             |
| `documentExtractors`             | `string[]` | IDs de provedores de extração de documentos (por exemplo, PDF) que pertencem a este Plugin.                                                                         |
| `imageGenerationProviders`       | `string[]` | IDs de provedores de geração de imagens que pertencem a este Plugin.                                                                                                |
| `videoGenerationProviders`       | `string[]` | IDs de provedores de geração de vídeos que pertencem a este Plugin.                                                                                                 |
| `musicGenerationProviders`       | `string[]` | IDs de provedores de geração de música que pertencem a este Plugin.                                                                                                 |
| `webContentExtractors`           | `string[]` | IDs de provedores de extração de conteúdo de páginas da Web que pertencem a este Plugin.                                                                            |
| `webFetchProviders`              | `string[]` | IDs de provedores de busca de conteúdo da Web que pertencem a este Plugin.                                                                                          |
| `webSearchProviders`             | `string[]` | IDs de provedores de pesquisa na Web que pertencem a este Plugin.                                                                                                   |
| `workerProviders`                | `string[]` | IDs de provedores de workers em nuvem que pertencem a este Plugin para provisionamento e ciclo de vida de concessões respaldadas por perfil.                         |
| `usageProviders`                 | `string[]` | IDs de provedores cujos hooks de autenticação de uso e de instantâneo de uso pertencem a este Plugin.                                                               |
| `migrationProviders`             | `string[]` | IDs de provedores de importação que pertencem a este Plugin para `openclaw migrate`.                                                                                 |
| `gatewayMethodDispatch`          | `string[]` | Permissão reservada para rotas HTTP autenticadas de Plugins que despacham métodos do Gateway no processo.                                                           |
| `tools`                          | `string[]` | Nomes de ferramentas de agente que pertencem a este Plugin.                                                                                                        |

`contracts.embeddedExtensionFactories` é mantido para fábricas integradas de extensões exclusivas do servidor de aplicativos do Codex. As transformações integradas de resultados de ferramentas devem declarar `contracts.agentToolResultMiddleware` e, em vez disso, registrar-se com `api.registerAgentToolResultMiddleware(...)`. Plugins instalados podem usar o mesmo ponto de integração de middleware somente quando explicitamente habilitados e apenas para os runtimes que declaram em `contracts.agentToolResultMiddleware`.

Plugins instalados que precisam da camada de políticas pré-ferramenta confiáveis pelo host devem declarar cada ID local registrado em `contracts.trustedToolPolicies` e ser explicitamente habilitados. Plugins integrados mantêm o caminho existente de políticas confiáveis, mas Plugins instalados com IDs de política não declarados são rejeitados antes do registro. Os IDs de política têm escopo restrito ao Plugin que os registra; portanto, dois Plugins podem declarar e registrar `workflow-budget`, mas um único Plugin não pode registrar duas vezes o mesmo ID local.

Os registros de `api.registerTool(...)` no runtime devem corresponder a `contracts.tools`. A descoberta de ferramentas usa essa lista para carregar apenas os runtimes de Plugins que podem ser responsáveis pelas ferramentas solicitadas.

Plugins de provedores que implementam `resolveExternalAuthProfiles` devem declarar `contracts.externalAuthProviders`; hooks de autenticação externa não declarados são ignorados.

Plugins de provedores que implementam tanto `resolveUsageAuth` quanto `fetchUsageSnapshot` devem declarar cada ID de provedor descoberto automaticamente em `contracts.usageProviders`. A descoberta de uso lê esse contrato antes de carregar o código de runtime e, depois, verifica ambos os hooks após carregar apenas os responsáveis declarados.

Provedores gerais de embeddings devem declarar `contracts.embeddingProviders` para cada adaptador registrado com `api.registerEmbeddingProvider(...)`. Use o contrato geral para a geração reutilizável de vetores, incluindo provedores consumidos pela pesquisa de memória. `contracts.memoryEmbeddingProviders` é uma compatibilidade obsoleta específica de memória e permanece apenas enquanto os provedores existentes migram para o ponto de integração genérico de provedores de embeddings.

Provedores de workers devem declarar cada ID de `api.registerWorkerProvider(...)` em `contracts.workerProviders`. O núcleo persiste a intenção durável antes de chamar `provision`; os provedores validam suas configurações antes da alocação externa, e chamadas repetidas com o mesmo ID de operação devem adotar a mesma concessão. O núcleo também persiste esse instantâneo das configurações validadas e o passa com `leaseId` para `inspect({ leaseId, profile })` e `destroy({ leaseId, profile })`, inclusive depois que o perfil nomeado é alterado ou removido. A destruição é idempotente, a inspeção retorna a união fechada de status `active` / `destroyed` / `unknown`, e o material de chave privada SSH é referenciado somente por meio de `SecretRef`. Endpoints SSH provisionados também devem incluir uma `hostKey` pública proveniente de uma saída de provisionamento confiável, exatamente no formato `algorithm base64`, sem nome de host nem comentário, para que o núcleo possa fixar a chave do host antes de se conectar. Provedores que criam referências dinâmicas de identidade podem implementar o método autoritativo `resolveSshIdentity({ leaseId, profile, keyRef })`; provedores sem ele usam o resolvedor genérico de segredos do núcleo. Um resultado autoritativo `unknown` torna órfão um registro local ativo; após uma solicitação de destruição persistida, ele confirma o encerramento.

Atualmente, `contracts.gatewayMethodDispatch` aceita `"authenticated-request"`. Trata-se de uma barreira de higiene da API para rotas HTTP nativas de Plugins que despacham intencionalmente métodos do plano de controle do Gateway no processo, e não de uma sandbox contra Plugins nativos mal-intencionados. Use-o somente para superfícies integradas ou de operador rigorosamente revisadas que já exigem autenticação HTTP do Gateway. Uma rota com essa permissão permanece acessível enquanto a admissão de trabalhos raiz do Gateway está fechada somente quando também declara `auth: "gateway"` e o `gatewayRuntimeScopeSurface: "trusted-operator"` específico da rota; as rotas irmãs comuns do mesmo Plugin permanecem atrás do limite de admissão. Isso mantém o status de suspensão e a retomada acessíveis sem conceder a todo o Plugin uma exceção à admissão. Mantenha a análise e a formatação da resposta limitadas fora do despacho; trabalhos substanciais ou que alterem estado devem passar pelo despacho de métodos do Gateway, responsável por impor a admissão e o escopo.

## Referência de configContracts

Use `configContracts` para comportamentos de configuração pertencentes ao manifesto dos quais os auxiliares genéricos do núcleo precisam sem importar o runtime do Plugin: detecção de indicadores perigosos, destinos de migração de `SecretRef` e restrição de caminhos de configuração legados.

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

| Campo                         | Obrigatório | Tipo       | O que significa                                                                                                                                                                                                                                                              |
| ----------------------------- | ----------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compatibilityMigrationPaths` | Não         | `string[]` | Caminhos de configuração relativos à raiz que indicam que as migrações de compatibilidade deste Plugin durante a configuração podem ser aplicáveis. Permite que leituras genéricas de configuração no runtime ignorem todas as superfícies de configuração de Plugins quando a configuração nunca referencia o Plugin. |
| `compatibilityRuntimePaths`   | Não         | `string[]` | Caminhos de compatibilidade relativos à raiz que este Plugin pode atender durante o runtime antes que o código do Plugin seja totalmente ativado. Use isso para superfícies legadas que devem restringir os conjuntos de candidatos integrados sem importar o runtime de cada Plugin compatível. |
| `dangerousFlags`              | Não         | `object[]` | Literais de configuração que `openclaw doctor` deve sinalizar como inseguros ou perigosos quando habilitados. Veja abaixo.                                                                                                                                                     |
| `secretInputs`                | Não         | `object`   | Caminhos de configuração em `plugins.entries.<id>.config` que o registro de destinos de migração/auditoria de `SecretRef` deve tratar como strings com formato de segredo. Veja abaixo.                                                                                        |

Cada entrada de `dangerousFlags` oferece suporte a:

| Campo    | Obrigatório | Tipo                                  | O que significa                                                                                                                     |
| -------- | ----------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `path`   | Sim         | `string`                              | Caminho de configuração separado por pontos, relativo a `plugins.entries.<id>.config`. Oferece suporte a curingas `*` para segmentos de mapas/matrizes. |
| `equals` | Sim         | `string \| number \| boolean \| null` | Literal exato que marca esse valor de configuração como perigoso.                                                                   |

`secretInputs` oferece suporte a:

| Campo                   | Obrigatório | Tipo       | O que significa                                                                                                                                                                                                                  |
| ----------------------- | ----------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled` | Não         | `boolean`  | Substitui a ativação padrão do plugin incluído ao decidir se esta superfície SecretRef está ativa. Use isto quando o plugin estiver incluído, mas a superfície deva permanecer inativa até ser explicitamente ativada na configuração. |
| `paths`                 | Sim         | `object[]` | Caminhos de configuração no formato de segredo, cada um com `path` (separado por pontos, relativo a `plugins.entries.<id>.config`, aceita curingas `*`) e `expected` opcional (atualmente, apenas `"string"`).                           |

## Referência de mediaUnderstandingProviderMetadata

Use `mediaUnderstandingProviderMetadata` quando um provedor de compreensão de mídia tiver modelos padrão, prioridade de fallback de autenticação automática ou suporte nativo a documentos de que os auxiliares genéricos do núcleo precisem antes do carregamento do runtime. As chaves também devem ser declaradas em `contracts.mediaUnderstandingProviders`.

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

| Campo                  | Tipo                                                             | O que significa                                                                                                                             |
| ---------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]`                              | Recursos de mídia expostos por este provedor.                                                                                               |
| `defaultModels`        | `Record<string, string>`                                         | Padrões de modelo por recurso usados quando a configuração não especifica um modelo.                                                        |
| `autoPriority`         | `Record<string, number>`                                         | Números menores são ordenados primeiro no fallback automático de provedor baseado em credenciais.                                           |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | Entradas nativas de documentos compatíveis com o provedor.                                                                                  |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | Substituições de modelo por tipo de documento. Defina `image: false` para desativar a extração baseada em imagens para esse tipo de documento. |

## Referência de channelConfigs

Use `channelConfigs` quando um plugin de canal precisar de metadados leves de configuração antes do carregamento do runtime. A descoberta somente leitura de configuração/status do canal pode usar esses metadados diretamente para canais externos configurados quando nenhuma entrada de configuração inicial estiver disponível ou quando `setup.requiresRuntime: false` declarar que o runtime de configuração inicial é desnecessário.

`channelConfigs` são metadados do manifesto do plugin, não uma nova seção de configuração de usuário de nível superior. Os usuários ainda configuram instâncias de canal em `channels.<channel-id>`. O OpenClaw lê os metadados do manifesto para decidir qual plugin é responsável por esse canal configurado antes da execução do código de runtime do plugin.

Para um plugin de canal, `configSchema` e `channelConfigs` descrevem caminhos diferentes:

- `configSchema` valida `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valida `channels.<channel-id>`

Plugins não incluídos que declaram `channels[]` também devem declarar entradas `channelConfigs` correspondentes. Sem elas, o OpenClaw ainda pode carregar o plugin, mas as superfícies de esquema de configuração do caminho frio, configuração inicial e Control UI não podem conhecer o formato das opções pertencentes ao canal até que o runtime do plugin seja executado.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` e `nativeSkillsAutoEnabled` podem declarar padrões estáticos de `auto` para verificações da configuração de comandos executadas antes do carregamento do runtime do canal. Canais incluídos também podem publicar os mesmos padrões por meio de `package.json#openclaw.channel.commands`, juntamente com seus outros metadados do catálogo de canais pertencentes ao pacote.

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
          "label": "URL do servidor doméstico",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Conexão com o servidor doméstico Matrix",
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

| Campo         | Tipo                     | O que significa                                                                                                              |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema para `channels.<id>`. Obrigatório para cada entrada declarada de configuração de canal.                          |
| `uiHints`     | `Record<string, object>` | Rótulos, espaços reservados e indicações de conteúdo sensível opcionais na UI para essa seção de configuração do canal.      |
| `label`       | `string`                 | Rótulo do canal incorporado às superfícies de seleção e inspeção quando os metadados do runtime ainda não estão disponíveis. |
| `description` | `string`                 | Breve descrição do canal para as superfícies de inspeção e catálogo.                                                         |
| `commands`    | `object`                 | Padrões automáticos estáticos para comandos nativos e Skills nativas em verificações de configuração anteriores ao runtime.  |
| `preferOver`  | `string[]`               | IDs de plugins legados ou de menor prioridade que este canal deve superar nas superfícies de seleção.                        |

### Substituição de outro plugin de canal

Use `preferOver` quando seu plugin for o responsável preferencial por um ID de canal que outro plugin também possa fornecer. Casos comuns incluem um ID de plugin renomeado, um plugin independente que substitui um plugin incluído ou uma bifurcação mantida que preserva o mesmo ID de canal para compatibilidade de configuração.

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

Quando `channels.chat` está configurado, o OpenClaw considera tanto o ID do canal quanto o ID do plugin preferencial. Se o plugin de menor prioridade tiver sido selecionado apenas por estar incluído ou ativado por padrão, o OpenClaw o desativará na configuração efetiva do runtime, de modo que um único plugin seja responsável pelo canal e por suas ferramentas. A seleção explícita do usuário ainda prevalece: se o usuário ativar explicitamente ambos os plugins (por meio de `plugins.allow` ou de uma configuração substancial em `plugins.entries`), o OpenClaw preservará essa escolha e relatará diagnósticos de canais/ferramentas duplicados, em vez de alterar silenciosamente o conjunto de plugins solicitado.

Mantenha `preferOver` restrito a IDs de plugins que realmente possam fornecer o mesmo canal. Ele não é um campo geral de prioridade e não renomeia chaves de configuração do usuário.

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

- referências explícitas `provider/model` usam os metadados do manifesto `providers` do responsável
- `modelPatterns` prevalecem sobre `modelPrefixes`
- se um plugin não incluído e um plugin incluído corresponderem, o plugin não incluído prevalecerá
- qualquer ambiguidade restante será ignorada até que o usuário ou a configuração especifique um provedor

Campos:

| Campo           | Tipo       | O que significa                                                                                      |
| --------------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefixos comparados com `startsWith` em relação a IDs abreviados de modelos.                         |
| `modelPatterns` | `string[]` | Fontes de expressões regulares comparadas a IDs abreviados de modelos após a remoção do sufixo de perfil. |

As entradas de `modelPatterns` são compiladas por meio de `compileSafeRegex`, que rejeita padrões contendo repetição aninhada (por exemplo, `(a+)+$`). Padrões que não passam na verificação de segurança são ignorados silenciosamente, assim como expressões regulares sintaticamente inválidas. Mantenha os padrões simples e evite quantificadores aninhados.

## Referência de modelCatalog

Use `modelCatalog` quando o OpenClaw precisar conhecer os metadados dos modelos do provedor antes de carregar o runtime do plugin. Esta é a fonte pertencente ao manifesto para linhas fixas do catálogo, aliases de provedores, regras de supressão e modo de descoberta. A atualização do runtime continua pertencendo ao código de runtime do provedor, mas o manifesto informa ao núcleo quando o runtime é necessário.

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

| Campo            | Tipo                                                     | O que significa                                                                                                                             |
| ---------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | Linhas do catálogo para IDs de provedores pertencentes a este plugin. As chaves também devem aparecer em `providers` no nível superior.      |
| `aliases`        | `Record<string, object>`                                 | Aliases de provedores que devem ser resolvidos para um provedor pertencente ao plugin no planejamento de catálogo ou supressão.              |
| `suppressions`   | `object[]`                                               | Linhas de modelos de outra origem que este plugin suprime por um motivo específico do provedor.                                             |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | Indica se o catálogo do provedor pode ser lido dos metadados do manifesto, atualizado no cache ou se exige o ambiente de execução.           |
| `runtimeAugment` | `boolean`                                                | Defina como `true` somente quando o ambiente de execução do provedor precisar acrescentar linhas ao catálogo após o planejamento do manifesto/configuração. |

`aliases` participa da consulta de propriedade do provedor para o planejamento do catálogo de modelos. Os destinos dos aliases devem ser provedores de nível superior pertencentes ao mesmo plugin. Quando uma lista filtrada por provedor usa um alias, o OpenClaw pode ler o manifesto proprietário e aplicar substituições de API/URL base do alias sem carregar o ambiente de execução do provedor. Os aliases não expandem listagens de catálogo sem filtro; listas abrangentes emitem somente as linhas do provedor canônico proprietário.

`suppressions` substitui o antigo gancho `suppressBuiltInModel` do ambiente de execução do provedor. As entradas de supressão são respeitadas somente quando o provedor pertence ao plugin ou é declarado como uma chave de `modelCatalog.aliases` que aponta para um provedor pertencente ao plugin. Os ganchos de supressão do ambiente de execução não são mais chamados durante a resolução de modelos.

Campos do provedor:

| Campo                 | Tipo                     | O que significa                                                                                                                                                                                                                                                             |
| --------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`             | `string`                 | URL base padrão opcional para os modelos neste catálogo de provedor.                                                                                                                                                                                                         |
| `api`                 | `ModelApi`               | Adaptador de API padrão opcional para os modelos neste catálogo de provedor.                                                                                                                                                                                                 |
| `headers`             | `Record<string, string>` | Cabeçalhos estáticos opcionais aplicáveis a este catálogo de provedor.                                                                                                                                                                                                        |
| `defaultUtilityModel` | `string`                 | ID opcional de modelo pequeno recomendado pelo provedor para tarefas utilitárias internas curtas (títulos, narração de progresso). Usado quando `agents.defaults.utilityModel` não está definido e este provedor atende ao modelo principal do agente.                           |
| `models`              | `object[]`               | Linhas de modelos obrigatórias. Linhas sem um `id` são ignoradas.                                                                                                                                                                                                             |

Campos do modelo:

| Campo              | Tipo                                                           | O que significa                                                                                   |
| ------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `id`               | `string`                                                       | ID de modelo local do provedor, sem o prefixo `provider/`.                                        |
| `name`             | `string`                                                       | Nome de exibição opcional.                                                                        |
| `api`              | `ModelApi`                                                     | Substituição opcional da API por modelo.                                                          |
| `baseUrl`          | `string`                                                       | Substituição opcional da URL base por modelo.                                                     |
| `headers`          | `Record<string, string>`                                       | Cabeçalhos estáticos opcionais por modelo.                                                        |
| `input`            | `Array<"text" \| "image" \| "document">`                       | Modalidades aceitas pelo modelo. Outros valores são descartados silenciosamente.                 |
| `reasoning`        | `boolean`                                                      | Indica se o modelo oferece comportamento de raciocínio.                                           |
| `contextWindow`    | `number`                                                       | Janela de contexto nativa do provedor.                                                            |
| `contextTokens`    | `number`                                                       | Limite efetivo opcional de contexto em tempo de execução quando diferente de `contextWindow`.     |
| `maxTokens`        | `number`                                                       | Número máximo de tokens de saída, quando conhecido.                                               |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | Substituições opcionais de ID de modelo ou parâmetro por nível de raciocínio.                      |
| `cost`             | `object`                                                       | Preço opcional em USD por milhão de tokens, incluindo `tieredPricing` opcional.                    |
| `compat`           | `object`                                                       | Sinalizadores de compatibilidade opcionais correspondentes à compatibilidade da configuração de modelos do OpenClaw. |
| `mediaInput`       | `object`                                                       | Configuração opcional de entrada por modalidade, atualmente somente para imagens.                 |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Status da listagem. Suprima somente quando a linha não puder aparecer de forma alguma.             |
| `statusReason`     | `string`                                                       | Motivo opcional exibido com um status diferente de disponível.                                    |
| `replaces`         | `string[]`                                                     | IDs locais de modelos mais antigos do provedor que este modelo substitui.                          |
| `replacedBy`       | `string`                                                       | ID local do modelo substituto do provedor para linhas obsoletas.                                  |
| `tags`             | `string[]`                                                     | Tags estáveis usadas por seletores e filtros.                                                      |

Campos de supressão:

| Campo                      | Tipo       | O que significa                                                                                                                |
| -------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | ID do provedor da linha de origem a ser suprimida. Deve pertencer a este plugin ou ser declarado como um alias pertencente a ele. |
| `model`                    | `string`   | ID local do modelo do provedor a ser suprimido.                                                                                  |
| `reason`                   | `string`   | Mensagem opcional exibida quando a linha suprimida é solicitada diretamente.                                                     |
| `when.baseUrlHosts`        | `string[]` | Lista opcional de hosts efetivos da URL base do provedor exigidos para que a supressão seja aplicada.                            |
| `when.providerConfigApiIn` | `string[]` | Lista opcional de valores `api` exatos da configuração do provedor exigidos para que a supressão seja aplicada.                  |

Não coloque dados disponíveis somente em tempo de execução em `modelCatalog`. Use `static` somente quando as linhas do manifesto forem completas o suficiente para que listas filtradas por provedor e interfaces de seleção possam ignorar a descoberta por registro/ambiente de execução. Use `refreshable` quando as linhas do manifesto forem sementes ou complementos úteis para listagem, mas uma atualização/cache puder adicionar mais linhas posteriormente; linhas atualizáveis não são autoritativas por si só. Use `runtime` quando o OpenClaw precisar carregar o ambiente de execução do provedor para conhecer a lista.

## Referência de modelIdNormalization

Use `modelIdNormalization` para a normalização simples de IDs de modelos pertencentes ao provedor que deve ocorrer antes do carregamento do ambiente de execução do provedor. Isso mantém aliases, como nomes curtos de modelos, IDs locais legados do provedor e regras de prefixos de proxy, no manifesto do plugin proprietário, em vez de nas tabelas principais de seleção de modelos.

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

| Campo                                | Tipo                    | O que significa                                                                                         |
| ------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Aliases exatos de IDs de modelos, sem diferenciação entre maiúsculas e minúsculas. Os valores são retornados como escritos. |
| `stripPrefixes`                      | `string[]`              | Prefixos a serem removidos antes da consulta de aliases, úteis para duplicação legada de provedor/modelo. |
| `prefixWhenBare`                     | `string`                | Prefixo a ser adicionado quando o ID normalizado do modelo ainda não contém `/`.                         |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Regras condicionais de prefixo para IDs sem prefixo após a consulta de aliases, indexadas por `modelPrefix` e `prefix`. |

## Referência de providerEndpoints

Use `providerEndpoints` para a classificação de endpoints que a política genérica de solicitações deve conhecer antes do carregamento do ambiente de execução do provedor. O núcleo continua responsável pelo significado de cada `endpointClass`; os manifestos dos plugins são responsáveis pelos metadados de host e URL base.

Plugins de provedores oficialmente externalizados são excluídos da distribuição principal, portanto,
seus manifestos permanecem invisíveis até serem instalados. Seus `providerEndpoints` também devem
ser espelhados em `scripts/lib/official-external-provider-catalog.json` para que
a classificação de endpoints continue funcionando sem o plugin; um teste de contrato
garante o espelhamento.

Campos do endpoint:

| Campo                          | Tipo       | O que significa                                                                                              |
| ------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------ |
| `endpointClass`                | `string`   | Classe de endpoint conhecida do núcleo, como `openrouter`, `moonshot-native` ou `google-vertex`.             |
| `hosts`                        | `string[]` | Nomes de host exatos que correspondem à classe de endpoint.                                                  |
| `hostSuffixes`                 | `string[]` | Sufixos de host que correspondem à classe de endpoint. Prefixe com `.` para corresponder apenas a sufixos de domínio. |
| `baseUrls`                     | `string[]` | URLs base HTTP(S) normalizadas exatas que correspondem à classe de endpoint.                                 |
| `googleVertexRegion`           | `string`   | Região estática do Google Vertex para hosts globais exatos.                                                  |
| `googleVertexRegionHostSuffix` | `string`   | Sufixo a remover dos hosts correspondentes para expor o prefixo de região do Google Vertex.                  |

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

| Campo                 | Tipo         | O que significa                                                                                         |
| --------------------- | ------------ | ------------------------------------------------------------------------------------------------------- |
| `family`              | `string`     | Rótulo da família do provedor usado por decisões genéricas de compatibilidade de solicitações e diagnósticos. |
| `compatibilityFamily` | `"moonshot"` | Grupo opcional de compatibilidade da família do provedor para auxiliares compartilhados de solicitações. |
| `openAICompletions`   | `object`     | Sinalizadores de solicitação de conclusões compatíveis com OpenAI, atualmente `supportsStreamingUsage`. |

## Referência de secretProviderIntegrations

Use `secretProviderIntegrations` quando um plugin puder publicar uma predefinição reutilizável de provedor exec do SecretRef. O OpenClaw lê esses metadados antes de carregar o runtime do plugin, armazena a propriedade do plugin em `secrets.providers.<alias>.pluginIntegration` e deixa a resolução efetiva do segredo para o runtime do SecretRef. As predefinições são expostas somente para plugins incluídos no pacote e plugins instalados descobertos nas raízes gerenciadas de instalação de plugins, como instalações via git e ClawHub.

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

A chave do mapa é o ID da integração. Se `providerAlias` for omitido, o OpenClaw usará o ID da integração como alias do provedor SecretRef. Os aliases de provedor devem corresponder ao padrão normal de alias de provedor SecretRef, por exemplo, `team-secrets` ou `onepassword-work`.

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

Na inicialização ou recarga, o OpenClaw resolve esse provedor carregando os metadados atuais do manifesto do plugin, verificando se o plugin proprietário está instalado e ativo e materializando o comando exec a partir do manifesto. Desabilitar ou remover o plugin revoga o provedor para SecretRefs ativos. Operadores que desejam uma configuração exec autônoma ainda podem definir provedores manuais com `command`/`args` diretamente.

Atualmente, somente predefinições com `source: "exec"` são compatíveis. `command` deve ser `${node}`, e `args[0]` deve ser um script resolvedor relativo à raiz do plugin iniciado por `./`. Na inicialização ou recarga, o OpenClaw o materializa como o executável atual do Node e o caminho absoluto do script dentro do plugin. Opções do Node como `--require`, `--import`, `--loader`, `--env-file`, `--eval` e `--print` não fazem parte do contrato de predefinição do manifesto. Operadores que precisam de comandos que não sejam do Node podem configurar diretamente provedores exec manuais autônomos.

O OpenClaw deriva `trustedDirs` para predefinições do manifesto a partir da raiz do plugin e, para predefinições `${node}`, do diretório do executável atual do Node. Valores `trustedDirs` definidos pelo manifesto são ignorados. Outras opções do provedor exec, como `timeoutMs`, `noOutputTimeoutMs`, `maxOutputBytes`, `jsonOnly`, `env`, `passEnv` e `allowInsecurePath`, são repassadas para a configuração normal do provedor exec do SecretRef.

## Referência de modelPricing

Use `modelPricing` quando um provedor precisar controlar o comportamento de preços do plano de controle antes do carregamento do runtime. O cache de preços do Gateway lê esses metadados sem importar o código de runtime do provedor.

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

| Campo        | Tipo              | O que significa                                                                                               |
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Defina como `false` para provedores locais ou auto-hospedados que nunca devem buscar preços do OpenRouter ou LiteLLM. |
| `openRouter` | `false \| object` | Mapeamento de consulta de preços do OpenRouter. `false` desabilita a consulta ao OpenRouter para esse provedor. |
| `liteLLM`    | `false \| object` | Mapeamento de consulta de preços do LiteLLM. `false` desabilita a consulta ao LiteLLM para esse provedor.      |

Campos da fonte:

| Campo                      | Tipo               | O que significa                                                                                                             |
| -------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | ID do provedor no catálogo externo quando difere do ID do provedor no OpenClaw, por exemplo, `z-ai` para um provedor `zai`. |
| `passthroughProviderModel` | `boolean`          | Trata IDs de modelo que contêm barras como referências aninhadas de provedor/modelo, útil para provedores proxy como o OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Variantes adicionais de ID de modelo do catálogo externo. `version-dots` tenta IDs de versão com pontos, como `claude-opus-4.6`. |

### Índice de Provedores do OpenClaw

O Índice de Provedores do OpenClaw consiste em metadados de pré-visualização pertencentes ao OpenClaw para provedores cujos plugins talvez ainda não estejam instalados. Ele não faz parte do manifesto de um plugin. Os manifestos de plugins continuam sendo a autoridade para plugins instalados. O Índice de Provedores é o contrato interno de contingência que futuras interfaces de seleção de modelos e provedores instaláveis antes da instalação consumirão quando um plugin de provedor não estiver instalado.

Ordem de autoridade do catálogo:

1. Configuração do usuário.
2. `modelCatalog` do manifesto do plugin instalado.
3. Cache do catálogo de modelos proveniente de uma atualização explícita.
4. Linhas de pré-visualização do Índice de Provedores do OpenClaw.

O Índice de Provedores não deve conter segredos, estado de habilitação, hooks de runtime nem dados de modelos específicos de contas em tempo real. Seus catálogos de pré-visualização usam o mesmo formato de linha de provedor de `modelCatalog` que os manifestos de plugins, mas devem se limitar a metadados estáveis de exibição, a menos que campos do adaptador de runtime, como `api`, `baseUrl`, preços ou sinalizadores de compatibilidade, sejam intencionalmente mantidos alinhados ao manifesto do plugin instalado. Provedores com descoberta de `/models` em tempo real devem gravar linhas atualizadas pelo caminho explícito do cache do catálogo de modelos, em vez de fazer com que a listagem normal ou a integração inicial chame APIs de provedores.

As entradas do Índice de Provedores também podem incluir metadados de plugins instaláveis para provedores cujo plugin tenha sido movido para fora do núcleo ou ainda não esteja instalado por outro motivo. Esses metadados espelham o padrão do catálogo de canais: nome do pacote, especificação de instalação npm, integridade esperada e rótulos simples de opções de autenticação são suficientes para mostrar uma opção de configuração instalável. Depois que o plugin é instalado, seu manifesto prevalece, e a entrada do Índice de Provedores é ignorada para esse provedor.

`openclaw doctor --fix` migra um conjunto pequeno e fechado de chaves legadas de capacidade do manifesto no nível superior para `contracts.*`: `speechProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders` e `tools`. Nenhuma delas, nem qualquer outra lista de capacidades, é mais lida como campo de manifesto no nível superior; o carregamento normal do manifesto só as reconhece em `contracts`.

## Manifesto em comparação com package.json

Os dois arquivos têm funções diferentes:

| Arquivo                | Use-o para                                                                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Descoberta, validação de configuração, metadados de opções de autenticação e dicas de interface que devem existir antes da execução do código do plugin |
| `package.json`         | Metadados npm, instalação de dependências e o bloco `openclaw` usado para pontos de entrada, controle de instalação, configuração ou metadados de catálogo |

Se você não tiver certeza de onde um metadado deve ficar, use esta regra:

- se o OpenClaw precisar conhecê-lo antes de carregar o código do plugin, coloque-o em `openclaw.plugin.json`
- se ele estiver relacionado ao empacotamento, arquivos de entrada ou comportamento de instalação do npm, coloque-o em `package.json`

### Campos de package.json que afetam a descoberta

Alguns metadados de plugin anteriores ao runtime residem intencionalmente em `package.json`, no bloco `openclaw`, em vez de `openclaw.plugin.json`. `openclaw.bundle` e `openclaw.bundle.json` não são contratos de plugin do OpenClaw; plugins nativos devem usar `openclaw.plugin.json` junto aos campos compatíveis de `package.json#openclaw` abaixo.

Exemplos importantes:

| Campo                                                                                      | O que significa                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | Declara pontos de entrada de plugins nativos. Deve permanecer dentro do diretório do pacote do plugin.                                                                                                           |
| `openclaw.runtimeExtensions`                                                               | Declara pontos de entrada de runtime JavaScript compilados para pacotes instalados. Deve permanecer dentro do diretório do pacote do plugin.                                                                      |
| `openclaw.setupEntry`                                                                      | Ponto de entrada leve, exclusivo para configuração, usado durante a integração inicial, a inicialização adiada de canais e a descoberta de status de canal/SecretRef somente leitura. Deve permanecer dentro do diretório do pacote do plugin. |
| `openclaw.runtimeSetupEntry`                                                               | Declara o ponto de entrada de configuração JavaScript compilado para pacotes instalados. Requer `setupEntry`, deve existir e permanecer dentro do diretório do pacote do plugin.                                   |
| `openclaw.channel`                                                                         | Metadados leves do catálogo de canais, como rótulos, caminhos da documentação, aliases e texto de seleção.                                                                                                       |
| `openclaw.channel.commands`                                                                | Metadados estáticos de comandos nativos e padrões automáticos de Skills nativas usados pela configuração, auditoria e superfícies de listagem de comandos antes do carregamento do runtime do canal.              |
| `openclaw.channel.configuredState`                                                         | Metadados leves do verificador de estado configurado que podem responder "já existe uma configuração somente por variáveis de ambiente?" sem carregar o runtime completo do canal.                              |
| `openclaw.channel.persistedAuthState`                                                      | Metadados leves do verificador de autenticação persistida que podem responder "já há alguma sessão iniciada?" sem carregar o runtime completo do canal.                                                           |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Indicações de instalação/atualização para plugins incluídos e publicados externamente.                                                                                                                           |
| `openclaw.install.defaultChoice`                                                           | Caminho de instalação preferencial quando várias fontes de instalação estão disponíveis.                                                                                                                        |
| `openclaw.install.minHostVersion`                                                          | Versão mínima compatível do host OpenClaw, usando um limite inferior semver como `>=2026.3.22` ou `>=2026.5.1-beta.1`.                                                                                            |
| `openclaw.compat.pluginApi`                                                                | Faixa mínima da API de plugins do OpenClaw exigida por este pacote, usando um limite inferior semver como `>=2026.5.27`.                                                                                         |
| `openclaw.install.expectedIntegrity`                                                       | String de integridade esperada da distribuição npm, como `sha512-...`; os fluxos de instalação e atualização verificam o artefato obtido em relação a ela.                                                       |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Permite um caminho restrito de recuperação por reinstalação de plugin incluído quando a configuração é inválida.                                                                                                |
| `openclaw.install.requiredPlatformPackages`                                                | Aliases de pacotes npm que devem ser materializados quando as restrições de plataforma no arquivo de lock correspondem ao host atual.                                                                            |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Permite que as superfícies de canal do runtime de configuração sejam carregadas antes da escuta e, em seguida, adia o plugin completo do canal configurado até a ativação posterior ao início da escuta.          |

Os metadados do manifesto determinam quais opções de provedor/canal/configuração aparecem na integração inicial antes do carregamento do runtime. `package.json#openclaw.install` informa à integração inicial como obter ou habilitar esse plugin quando o usuário escolhe uma dessas opções. Não mova as indicações de instalação para `openclaw.plugin.json`.

`openclaw.install.minHostVersion` é aplicado durante a instalação e o carregamento do registro de manifestos para fontes de plugins não incluídos. Valores inválidos são rejeitados; valores mais recentes, porém válidos, fazem com que plugins externos sejam ignorados em hosts mais antigos. Presume-se que plugins incluídos como código-fonte tenham a mesma versão do checkout do host.

`openclaw.install.requiredPlatformPackages` destina-se a pacotes npm que expõem binários nativos obrigatórios por meio de aliases opcionais e específicos de plataforma. Liste o nome simples do pacote npm para cada alias de plataforma compatível. Durante a instalação via npm, o OpenClaw verifica apenas o alias declarado cujas restrições no arquivo de lock correspondem ao host atual. Se o npm informar sucesso, mas omitir esse alias, o OpenClaw tenta novamente uma vez com um cache novo e reverte a instalação se o alias continuar ausente.

`openclaw.compat.pluginApi` é aplicado durante a instalação de pacotes para fontes de plugins não incluídos. Use-o para definir o limite inferior da API do SDK/runtime de plugins do OpenClaw para a qual o pacote foi compilado. Ele pode ser mais restritivo que `minHostVersion` quando um pacote de plugin precisa de uma API mais recente, mas ainda mantém uma indicação de instalação inferior para outros fluxos. Por padrão, a sincronização oficial de versões do OpenClaw eleva os limites inferiores existentes da API de plugins oficiais para a versão da distribuição do OpenClaw, mas distribuições exclusivas de plugins podem manter um limite inferior quando o pacote oferece compatibilidade intencional com hosts mais antigos. Não use apenas a versão do pacote como contrato de compatibilidade. `peerDependencies.openclaw` continua sendo metadado do pacote npm; o OpenClaw usa o contrato `openclaw.compat.pluginApi` para decisões de compatibilidade de instalação.

Os metadados oficiais de instalação sob demanda devem usar `clawhubSpec` quando o plugin for publicado no ClawHub; a integração inicial trata essa opção como a fonte remota preferencial e registra informações do artefato do ClawHub após a instalação. `npmSpec` continua sendo a alternativa de compatibilidade para pacotes que ainda não migraram para o ClawHub.

A fixação exata da versão npm já fica em `npmSpec`, por exemplo, `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. As entradas oficiais do catálogo externo devem combinar especificações exatas com `expectedIntegrity` para que os fluxos de atualização falhem de forma segura se o artefato npm obtido deixar de corresponder à versão fixada. Para compatibilidade, a integração inicial interativa ainda oferece especificações npm de registros confiáveis, incluindo nomes simples de pacotes e dist-tags. Os diagnósticos do catálogo podem distinguir fontes exatas, flutuantes, fixadas por integridade, sem integridade, com incompatibilidade de nome de pacote e com opção padrão inválida. Eles também avisam quando `expectedIntegrity` está presente, mas não há uma fonte npm válida à qual possa ser vinculado. Quando `expectedIntegrity` está presente, os fluxos de instalação/atualização o aplicam; quando é omitido, a resolução do registro é registrada sem uma fixação de integridade.

Os plugins de canal devem fornecer `openclaw.setupEntry` quando as verificações de status, lista de canais ou SecretRef precisarem identificar contas configuradas sem carregar o runtime completo. O ponto de entrada de configuração deve expor os metadados do canal, além de adaptadores de configuração, status e segredos seguros para configuração; mantenha clientes de rede, listeners do Gateway e runtimes de transporte no ponto de entrada principal da extensão.

Os campos de ponto de entrada do runtime não substituem as verificações dos limites do pacote aplicadas aos campos de ponto de entrada do código-fonte. Por exemplo, `openclaw.runtimeExtensions` não pode tornar carregável um caminho de `openclaw.extensions` que saia do pacote.

`openclaw.install.allowInvalidConfigRecovery` é intencionalmente restrito. Ele não torna instaláveis configurações arbitrariamente corrompidas. Atualmente, ele apenas permite que os fluxos de instalação se recuperem de falhas específicas e obsoletas de atualização de plugins incluídos, como a ausência do caminho de um plugin incluído ou uma entrada `channels.<id>` obsoleta referente ao mesmo plugin incluído. Erros de configuração não relacionados ainda bloqueiam a instalação e encaminham os operadores para `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` é um metadado de pacote para um pequeno módulo verificador:

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

Use-o quando os fluxos de configuração, Doctor, status ou verificação de presença somente leitura precisarem de uma sondagem simples de autenticação com resposta sim/não antes do carregamento completo do plugin de canal. O estado de autenticação persistida não é o estado configurado do canal: não use esses metadados para habilitar plugins automaticamente, reparar dependências de runtime ou decidir se um runtime de canal deve ser carregado. A exportação de destino deve ser uma função pequena que leia apenas o estado persistido; não a encaminhe pelo barrel completo do runtime do canal.

`openclaw.channel.configuredState` segue a mesma estrutura para verificações simples do estado configurado somente por variáveis de ambiente:

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

Use-o quando um canal puder determinar o estado configurado a partir de variáveis de ambiente ou de outras entradas mínimas que não dependam do runtime. Se a verificação exigir a resolução completa da configuração ou o runtime real do canal, mantenha essa lógica no hook `config.hasConfiguredState` do plugin.

## Precedência de descoberta (IDs de plugin duplicados)

O OpenClaw descobre plugins em três raízes, verificadas nesta ordem: plugins incluídos distribuídos com o OpenClaw, a raiz de instalação global (`~/.openclaw/extensions`) e a raiz do espaço de trabalho atual (`<workspace>/.openclaw/extensions`), além de quaisquer entradas explícitas em `plugins.load.paths`.

Se duas descobertas compartilharem o mesmo `id`, somente o manifesto de **maior precedência** será mantido; as duplicatas de menor precedência serão descartadas em vez de carregadas junto com ele. Precedência, da maior para a menor:

1. **Selecionado pela configuração** — um caminho fixado explicitamente em `plugins.entries.<id>`
2. **Instalação global correspondente a um registro de instalação rastreado** — um plugin instalado por meio de `openclaw plugin install`/`openclaw plugin update` que o rastreamento de instalações do OpenClaw reconheça para o mesmo ID, mesmo quando o ID também pertença a um plugin incluído
3. **Incluído** — plugins distribuídos com o OpenClaw
4. **Espaço de trabalho** — plugins descobertos em relação ao espaço de trabalho atual
5. Qualquer outro candidato descoberto

Implicações:

- Uma cópia derivada ou obsoleta de um plugin incluído, presente sem rastreamento no espaço de trabalho ou na raiz global, não substituirá a compilação incluída.
- Para substituir um plugin incluído, execute `openclaw plugin install` para esse ID, de modo que a instalação global rastreada tenha precedência sobre a cópia incluída, ou fixe um caminho específico por meio de `plugins.entries.<id>`, para que ele prevaleça pela precedência de seleção por configuração.
- Os descartes de duplicatas são registrados em log para que os diagnósticos do Doctor e da inicialização possam indicar a cópia descartada.
- As substituições de duplicatas selecionadas pela configuração são descritas como substituições explícitas nos diagnósticos, mas ainda geram avisos para que cópias derivadas obsoletas e sombreamentos acidentais permaneçam visíveis.

## Requisitos do JSON Schema

- **Todo plugin deve incluir um JSON Schema**, mesmo que não aceite nenhuma configuração.
- Um schema vazio é aceitável (por exemplo, `{ "type": "object", "additionalProperties": false }`).
- Os schemas são validados durante a leitura/gravação da configuração, não em tempo de execução.
- Ao estender ou criar um fork de um plugin incluído com novas chaves de configuração, atualize simultaneamente o `configSchema` do `openclaw.plugin.json` desse plugin. Os schemas dos plugins incluídos são estritos; portanto, adicionar `plugins.entries.<id>.config.myNewKey` à configuração do usuário sem adicionar `myNewKey` a `configSchema.properties` será rejeitado antes que o runtime do plugin seja carregado.

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

- Chaves `channels.*` desconhecidas são **erros**, a menos que o ID do canal seja declarado pelo manifesto de um plugin. Se o mesmo ID também aparecer em `plugins.allow`, `plugins.entries` ou `plugins.installs` (um plugin referenciado, mas que não pode ser descoberto no momento), o OpenClaw rebaixa isso para um **aviso**.
- Referências a IDs de plugins desconhecidos em `plugins.entries.<id>`, `plugins.allow` e `plugins.deny` são **avisos** ("entrada de configuração obsoleta ignorada"), não erros, para que atualizações e plugins removidos/renomeados não impeçam a inicialização do Gateway.
- A referência de `plugins.slots.memory` a um ID de plugin desconhecido é um **erro**, exceto para o plugin externo oficial conhecido `memory-lancedb`, que gera um aviso.
- Se um plugin estiver instalado, mas tiver um manifesto ou schema ausente ou inválido, a validação falhará e o Doctor informará o erro do plugin.
- Se houver configuração para um plugin, mas ele estiver **desativado**, a configuração será mantida e um **aviso** será exibido no Doctor e nos logs.

Consulte a [Referência de configuração](/pt-BR/gateway/configuration) para ver o schema completo de `plugins.*`.

## Observações

- O manifesto é **obrigatório para plugins nativos do OpenClaw**, incluindo carregamentos do sistema de arquivos local. O runtime ainda carrega o módulo do plugin separadamente; o manifesto serve apenas para descoberta e validação.
- Manifestos nativos são analisados com JSON5; portanto, comentários, vírgulas finais e chaves sem aspas são aceitos, desde que o valor final ainda seja um objeto.
- Somente os campos documentados do manifesto são lidos pelo carregador de manifestos. Evite chaves personalizadas no nível superior.
- `channels`, `providers`, `cliBackends` e `skills` podem ser omitidos quando um plugin não precisar deles.
- `providerCatalogEntry` deve permanecer leve e não deve importar código amplo de runtime; use-o para metadados estáticos do catálogo de provedores ou descritores de descoberta específicos, não para execução durante solicitações.
- Tipos exclusivos de plugins são selecionados por meio de `plugins.slots.*`: `kind: "memory"` via `plugins.slots.memory` (padrão: `memory-core`) e `kind: "context-engine"` via `plugins.slots.contextEngine` (padrão: `legacy`).
- Declare o tipo exclusivo do plugin neste manifesto. `OpenClawPluginDefinition.kind` da entrada de runtime foi descontinuado e permanece apenas como fallback de compatibilidade para plugins mais antigos.
- Os metadados de variáveis de ambiente (`setup.providers[].envVars`, o obsoleto `providerAuthEnvVars` e `channelEnvVars`) são apenas declarativos. O status, a auditoria, a validação de entrega do Cron e outras superfícies somente leitura ainda aplicam a confiança do plugin e a política de ativação efetiva antes de considerar uma variável de ambiente configurada.
- Para metadados do assistente de runtime que exigem código do provedor, consulte [Hooks de runtime do provedor](/pt-BR/plugins/architecture-internals#provider-runtime-hooks).
- Se o seu plugin depender de módulos nativos, documente as etapas de compilação e todos os requisitos de lista de permissões do gerenciador de pacotes (por exemplo, `allow-build-scripts` do pnpm + `pnpm rebuild <package>`).

## Conteúdo relacionado

<CardGroup cols={3}>
  <Card title="Criação de plugins" href="/pt-BR/plugins/building-plugins" icon="rocket">
    Introdução aos plugins.
  </Card>
  <Card title="Arquitetura de plugins" href="/pt-BR/plugins/architecture" icon="diagram-project">
    Arquitetura interna e modelo de recursos.
  </Card>
  <Card title="Visão geral do SDK" href="/pt-BR/plugins/sdk-overview" icon="book">
    Referência do SDK de plugins e importações de subcaminhos.
  </Card>
</CardGroup>
