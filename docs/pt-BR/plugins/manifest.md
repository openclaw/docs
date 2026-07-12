---
read_when:
    - Você está criando um plugin do OpenClaw
    - Você precisa disponibilizar um esquema de configuração de Plugin ou depurar erros de validação de Plugin
summary: Requisitos do manifesto do Plugin + esquema JSON (validação estrita da configuração)
title: Manifesto do Plugin
x-i18n:
    generated_at: "2026-07-12T15:24:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cd4ab5b10108585abb9a83a416b129e6f6351023016064b5d64b66aeabd04b2f
    source_path: plugins/manifest.md
    workflow: 16
---

Esta página aborda o **manifesto de plugin nativo do OpenClaw**, `openclaw.plugin.json`. Para layouts de pacotes compatíveis (Codex, Claude, Cursor), consulte [Pacotes de plugins](/pt-BR/plugins/bundles).

Os formatos de pacotes compatíveis usam seus próprios arquivos de manifesto:

- Pacote do Codex: `.codex-plugin/plugin.json`
- Pacote do Claude: `.claude-plugin/plugin.json` ou o layout padrão de componentes do Claude sem manifesto
- Pacote do Cursor: `.cursor-plugin/plugin.json`

O OpenClaw detecta esses layouts automaticamente, mas não os valida em relação ao esquema de `openclaw.plugin.json` abaixo. Para um pacote compatível, o OpenClaw lê os metadados do pacote, as raízes de Skills declaradas, as raízes de comandos do Claude, os padrões de `settings.json` do Claude, os padrões de LSP do Claude e os pacotes de hooks compatíveis, quando o layout corresponde às expectativas de runtime do OpenClaw.

Todo plugin nativo do OpenClaw **deve** incluir `openclaw.plugin.json` na **raiz do plugin**. O OpenClaw lê esse arquivo para validar a configuração **sem executar o código do plugin**. Um manifesto ausente ou inválido impede a validação da configuração e é tratado como um erro do plugin.

Consulte [Plugins](/pt-BR/tools/plugin) para ver o guia completo do sistema de plugins e [Modelo de capacidades](/pt-BR/plugins/architecture#public-capability-model) para conhecer o modelo de capacidades nativo e as orientações atuais sobre compatibilidade externa.

## O que este arquivo faz

`openclaw.plugin.json` contém metadados que o OpenClaw lê **antes de carregar o código do seu plugin**. Tudo nele deve ser simples o suficiente para ser inspecionado sem inicializar o runtime do plugin.

**Use-o para:**

- identidade do plugin, validação da configuração e dicas para a interface de configuração
- metadados de autenticação, integração inicial e configuração (alias, ativação automática, variáveis de ambiente do provedor, opções de autenticação)
- dicas de ativação para superfícies do plano de controle
- atribuição de famílias de modelos por forma abreviada
- snapshots estáticos de atribuição de capacidades (`contracts`)
- metadados do executor de QA que o host compartilhado `openclaw qa` pode inspecionar
- metadados de configuração específicos do canal, mesclados às superfícies de catálogo e validação

**Não o use para:** registrar comportamento de runtime, declarar pontos de entrada de código ou metadados de instalação do npm. Esses elementos pertencem ao código do seu plugin e ao `package.json`.

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

| Campo                                | Obrigatório | Tipo                         | O que significa                                                                                                                                                                                                                                                            |
| ------------------------------------ | ----------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Sim         | `string`                     | ID canônico do plugin. Este é o ID usado em `plugins.entries.<id>`.                                                                                                                                                                                                         |
| `configSchema`                       | Sim         | `object`                     | JSON Schema em linha para a configuração deste plugin.                                                                                                                                                                                                                      |
| `requiresPlugins`                    | Não         | `string[]`                   | IDs de plugins que também devem estar instalados para que este plugin tenha efeito. A descoberta mantém o plugin carregável, mas emite um aviso quando algum plugin obrigatório está ausente.                                                                                |
| `enabledByDefault`                   | Não         | `true`                       | Marca um plugin incluído no pacote como habilitado por padrão. Omita-o ou defina qualquer valor diferente de `true` para deixar o plugin desabilitado por padrão.                                                                                                            |
| `enabledByDefaultOnPlatforms`        | Não         | `string[]`                   | Marca um plugin incluído no pacote como habilitado por padrão somente nas plataformas Node.js listadas, por exemplo, `["darwin"]`. A configuração explícita ainda prevalece.                                                                                                |
| `legacyPluginIds`                    | Não         | `string[]`                   | IDs legados que são normalizados para este ID canônico de plugin.                                                                                                                                                                                                           |
| `autoEnableWhenConfiguredProviders`  | Não         | `string[]`                   | IDs de provedores que devem habilitar automaticamente este plugin quando referências de autenticação, configuração ou modelo os mencionarem.                                                                                                                               |
| `kind`                               | Não         | `PluginKind \| PluginKind[]` | Declara um ou mais tipos exclusivos de plugin (`"memory"`, `"context-engine"`) usados por `plugins.slots.*`. Um plugin que controla ambos os slots declara ambos os tipos em um único array.                                                                                 |
| `channels`                           | Não         | `string[]`                   | IDs de canais controlados por este plugin. Usados para descoberta e validação da configuração.                                                                                                                                                                              |
| `providers`                          | Não         | `string[]`                   | IDs de provedores controlados por este plugin.                                                                                                                                                                                                                              |
| `providerCatalogEntry`               | Não         | `string`                     | Caminho do módulo leve do catálogo de provedores, relativo à raiz do plugin, para metadados do catálogo de provedores com escopo de manifesto que podem ser carregados sem ativar todo o runtime do plugin.                                                                  |
| `modelSupport`                       | Não         | `object`                     | Metadados abreviados da família de modelos, controlados pelo manifesto, usados para carregar automaticamente o plugin antes do runtime.                                                                                                                                     |
| `modelCatalog`                       | Não         | `object`                     | Metadados declarativos do catálogo de modelos para provedores controlados por este plugin. Este é o contrato do plano de controle para futuras listagens somente leitura, integração inicial, seletores de modelos, aliases e supressão sem carregar o runtime do plugin.     |
| `modelPricing`                       | Não         | `object`                     | Política de consulta de preços externos controlada pelo provedor. Use-a para excluir provedores locais/auto-hospedados de catálogos remotos de preços ou mapear referências de provedores para IDs de catálogo do OpenRouter/LiteLLM sem codificar IDs de provedores no core. |
| `modelIdNormalization`               | Não         | `object`                     | Limpeza de aliases/prefixos de IDs de modelo, controlada pelo provedor, que deve ser executada antes do carregamento do runtime do provedor.                                                                                                                                 |
| `providerEndpoints`                  | Não         | `object[]`                   | Metadados de host/baseUrl de endpoints, controlados pelo manifesto, para rotas de provedores que o core deve classificar antes do carregamento do runtime do provedor.                                                                                                      |
| `providerRequest`                    | Não         | `object`                     | Metadados leves da família de provedores e de compatibilidade de solicitações usados pela política genérica de solicitações antes do carregamento do runtime do provedor.                                                                                                   |
| `secretProviderIntegrations`         | Não         | `Record<string, object>`     | Predefinições declarativas de provedores de execução SecretRef que as interfaces de configuração ou instalação podem oferecer sem codificar no core integrações específicas de provedores.                                                                                  |
| `cliBackends`                        | Não         | `string[]`                   | IDs de backends de inferência da CLI controlados por este plugin. Usados para ativação automática na inicialização com base em referências explícitas da configuração.                                                                                                     |
| `syntheticAuthRefs`                  | Não         | `string[]`                   | Referências de provedor ou backend da CLI cujo hook de autenticação sintética, controlado pelo plugin, deve ser sondado durante a descoberta de modelos a frio antes do carregamento do runtime.                                                                              |
| `nonSecretAuthMarkers`               | Não         | `string[]`                   | Valores de placeholder da chave de API controlados pelo plugin incluído no pacote que representam um estado de credencial local, OAuth ou ambiente que não é secreto.                                                                                                      |
| `commandAliases`                     | Não         | `object[]`                   | Nomes de comandos controlados por este plugin que devem produzir diagnósticos de configuração e da CLI cientes do plugin antes do carregamento do runtime.                                                                                                                 |
| `providerAuthEnvVars`                | Não         | `Record<string, string[]>`   | Metadados de ambiente de compatibilidade obsoletos para consulta de autenticação/status do provedor. Para novos plugins, prefira `setup.providers[].envVars`; o OpenClaw ainda lê esses metadados durante o período de descontinuação.                                        |
| `providerUsageAuthEnvVars`           | Não         | `Record<string, string[]>`   | Credenciais do provedor usadas somente para consumo/faturamento. O OpenClaw usa esses nomes para descoberta de consumo e remoção de segredos, mas nunca para autenticação de inferência.                                                                                     |
| `providerAuthAliases`                | Não         | `Record<string, string>`     | IDs de provedores que devem reutilizar outro ID de provedor para consulta de autenticação, por exemplo, um provedor de programação que compartilha a chave de API e os perfis de autenticação do provedor-base.                                                               |
| `channelEnvVars`                     | Não         | `Record<string, string[]>`   | Metadados leves de ambiente do canal que o OpenClaw pode inspecionar sem carregar o código do plugin. Use-os para interfaces de configuração ou autenticação de canais orientadas pelo ambiente que os auxiliares genéricos de inicialização/configuração devem detectar.      |
| `providerAuthChoices`                | Não         | `object[]`                   | Metadados leves de opções de autenticação para seletores da integração inicial, resolução do provedor preferencial e vinculação simples de flags da CLI.                                                                                                                    |
| `activation`                         | Não         | `object`                     | Metadados leves do planejador de ativação para carregamento acionado por inicialização, provedor, comando, canal, rota e recurso. Somente metadados; o runtime do plugin ainda controla o comportamento real.                                                                |
| `setup`                              | Não         | `object`                     | Descritores leves de configuração/integração inicial que a descoberta e as interfaces de configuração podem inspecionar sem carregar o runtime do plugin.                                                                                                                 |
| `qaRunners`                          | Não         | `object[]`                   | Descritores leves de executores de QA usados pelo host compartilhado `openclaw qa` antes do carregamento do runtime do plugin.                                                                                                                                              |
| `contracts`                          | Não         | `object`                     | Retrato estático do controle de recursos para hooks externos de autenticação, embeddings, fala, transcrição em tempo real, voz em tempo real, compreensão de mídia, geração de imagens/vídeos/músicas, busca de conteúdo web, pesquisa web, provedores de workers, extração de documentos/conteúdo web e controle de ferramentas. |
| `configContracts`                    | Não         | `object`                     | Comportamento de configuração controlado pelo manifesto e consumido por auxiliares genéricos do core: detecção de flags perigosas, destinos de migração de SecretRef e restrição de caminhos de configuração legados. Consulte a [referência de configContracts](#configcontracts-reference). |
| `mediaUnderstandingProviderMetadata` | Não      | `Record<string, object>`     | Padrões econômicos de compreensão de mídia para os IDs de provedores declarados em `contracts.mediaUnderstandingProviders`.                                                                                                                                                 |
| `imageGenerationProviderMetadata`    | Não      | `Record<string, object>`     | Metadados econômicos de autenticação para geração de imagens para os IDs de provedores declarados em `contracts.imageGenerationProviders`, incluindo aliases de autenticação pertencentes ao provedor e proteções para a URL base.                                           |
| `videoGenerationProviderMetadata`    | Não      | `Record<string, object>`     | Metadados econômicos de autenticação para geração de vídeos para os IDs de provedores declarados em `contracts.videoGenerationProviders`, incluindo aliases de autenticação pertencentes ao provedor e proteções para a URL base.                                             |
| `musicGenerationProviderMetadata`    | Não      | `Record<string, object>`     | Metadados econômicos de autenticação para geração de música para os IDs de provedores declarados em `contracts.musicGenerationProviders`, incluindo aliases de autenticação pertencentes ao provedor e proteções para a URL base.                                             |
| `toolMetadata`                       | Não      | `Record<string, object>`     | Metadados econômicos de disponibilidade para ferramentas pertencentes ao plugin declaradas em `contracts.tools`. Use-os quando uma ferramenta não deve carregar o runtime, a menos que existam evidências de configuração, ambiente ou autenticação.                          |
| `channelConfigs`                     | Não      | `Record<string, object>`     | Metadados de configuração de canais pertencentes ao manifesto, mesclados às superfícies de descoberta e validação antes do carregamento do runtime.                                                                                                                         |
| `skills`                             | Não      | `string[]`                   | Diretórios de Skills a serem carregados, relativos à raiz do plugin.                                                                                                                                                                                                        |
| `name`                               | Não      | `string`                     | Nome do plugin legível por humanos.                                                                                                                                                                                                                                         |
| `description`                        | Não      | `string`                     | Resumo curto exibido nas superfícies do plugin.                                                                                                                                                                                                                             |
| `catalog`                            | Não      | `object`                     | Dicas opcionais de apresentação para superfícies do catálogo de plugins. Esses metadados não instalam, habilitam nem concedem confiança a um plugin.                                                                                                                        |
| `icon`                               | Não      | `string`                     | URL HTTPS da imagem para cartões do marketplace/catálogo. O ClawHub aceita qualquer URL `https://` válida e usa o ícone padrão do plugin quando ela é omitida ou inválida.                                                                                                  |
| `version`                            | Não      | `string`                     | Versão informativa do plugin.                                                                                                                                                                                                                                               |
| `uiHints`                            | Não      | `Record<string, object>`     | Rótulos da interface, textos de espaço reservado e indicações de sensibilidade para campos de configuração.                                                                                                                                                                |

## referência de catálogo

`catalog` fornece dicas opcionais de exibição para navegadores de plugins. Os hosts podem ignorar essas dicas. Elas nunca instalam nem habilitam o plugin e não alteram seu comportamento em tempo de execução nem seu nível de confiança.

```json
{
  "catalog": {
    "featured": true,
    "order": 10
  }
}
```

| Campo      | Tipo      | O que significa                                                                 |
| ---------- | --------- | ------------------------------------------------------------------------------- |
| `featured` | `boolean` | Se as interfaces do catálogo devem destacar este plugin.                        |
| `order`    | `number`  | Dica de ordem crescente de exibição entre plugins selecionados; valores menores aparecem primeiro. |

## referência de metadados de provedores de geração

Os campos de metadados de provedores de geração descrevem sinais estáticos de autenticação para os provedores declarados na lista `contracts.*GenerationProviders` correspondente. O OpenClaw lê esses campos antes que o runtime do provedor seja carregado, para que as ferramentas do núcleo possam decidir se um provedor de geração está disponível sem importar todos os plugins de provedores.

Use esses campos apenas para fatos declarativos de baixo custo. Transporte, transformações de solicitações, renovação de tokens, validação de credenciais e o comportamento efetivo de geração permanecem no runtime do plugin.

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

| Campo                  | Obrigatório | Tipo       | O que significa                                                                                                                                             |
| ---------------------- | ----------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | Não         | `string[]` | IDs adicionais de provedores que devem contar como aliases estáticos de autenticação para o provedor de geração.                                            |
| `authProviders`        | Não         | `string[]` | IDs de provedores cujos perfis de autenticação configurados devem contar como autenticação para este provedor de geração.                                    |
| `configSignals`        | Não         | `object[]` | Sinais de disponibilidade de baixo custo, baseados apenas na configuração, para provedores locais ou auto-hospedados que podem ser configurados sem perfis de autenticação nem variáveis de ambiente. |
| `authSignals`          | Não         | `object[]` | Sinais explícitos de autenticação. Quando presentes, substituem o conjunto padrão de sinais do ID do provedor, de `aliases` e de `authProviders`.             |
| `referenceAudioInputs` | Não         | `boolean`  | Somente para geração de vídeo. Defina como `true` quando o provedor aceitar recursos de áudio de referência; caso contrário, `video_generate` oculta os parâmetros de referência de áudio. |

Cada entrada de `configSignals` oferece suporte a:

| Campo            | Obrigatório | Tipo       | O que significa                                                                                                                                                                                         |
| ---------------- | ----------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | Sim         | `string`   | Caminho por pontos até o objeto de configuração pertencente ao plugin que deve ser inspecionado, por exemplo, `plugins.entries.example.config`.                                                          |
| `overlayPath`    | Não         | `string`   | Caminho por pontos dentro da configuração raiz cujo objeto deve sobrepor o objeto raiz antes da avaliação do sinal. Use-o para configurações específicas de recursos, como `image`, `video` ou `music`. |
| `overlayMapPath` | Não         | `string`   | Caminho por pontos dentro da configuração raiz cujos valores de objeto devem, cada um, sobrepor o objeto raiz. Use-o para mapas de contas nomeadas, como `accounts`, em que qualquer conta configurada deve ser válida. |
| `required`       | Não         | `string[]` | Caminhos por pontos dentro da configuração efetiva que devem ter valores configurados. Strings não podem estar vazias; objetos e arrays não podem estar vazios.                                        |
| `requiredAny`    | Não         | `string[]` | Caminhos por pontos dentro da configuração efetiva em que pelo menos um deve ter um valor configurado.                                                                                                  |
| `mode`           | Não         | `object`   | Verificação opcional de modo de string dentro da configuração efetiva. Use-a quando a disponibilidade baseada apenas na configuração se aplicar somente a um modo.                                     |

Cada verificação de `mode` oferece suporte a:

| Campo        | Obrigatório | Tipo       | O que significa                                                                                     |
| ------------ | ----------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `path`       | Não         | `string`   | Caminho por pontos dentro da configuração efetiva. O padrão é `mode`.                               |
| `default`    | Não         | `string`   | Valor de modo a ser usado quando a configuração omitir o caminho.                                   |
| `allowed`    | Não         | `string[]` | Se presente, o sinal passa somente quando o modo efetivo é um desses valores.                        |
| `disallowed` | Não         | `string[]` | Se presente, o sinal falha quando o modo efetivo é um desses valores.                                |

Cada entrada de `authSignals` oferece suporte a:

| Campo             | Obrigatório | Tipo     | O que significa                                                                                                                                                                             |
| ----------------- | ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sim         | `string` | ID do provedor a ser verificado nos perfis de autenticação configurados.                                                                                                                    |
| `providerBaseUrl` | Não         | `object` | Verificação opcional que faz o sinal contar somente quando o provedor configurado referenciado usa uma URL base permitida. Use-a quando um alias de autenticação for válido somente para determinadas APIs. |

Cada verificação de `providerBaseUrl` oferece suporte a:

| Campo             | Obrigatório | Tipo       | O que significa                                                                                                                                                    |
| ----------------- | ----------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`        | Sim         | `string`   | ID da configuração do provedor cujo `baseUrl` deve ser verificado.                                                                                                 |
| `defaultBaseUrl`  | Não         | `string`   | URL base a ser considerada quando a configuração do provedor omitir `baseUrl`.                                                                                     |
| `allowedBaseUrls` | Sim         | `string[]` | URLs base permitidas para este sinal de autenticação. O sinal é ignorado quando a URL base configurada ou padrão não corresponde a um desses valores normalizados. |

## referência de metadados de ferramentas

`toolMetadata` usa os mesmos formatos de `configSignals` e `authSignals` dos metadados de provedores de geração, indexados pelo nome da ferramenta. `contracts.tools` declara a propriedade. `toolMetadata` declara evidências de disponibilidade de baixo custo para que o OpenClaw possa evitar importar o runtime de um plugin apenas para que sua fábrica de ferramentas retorne `null`.

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

As entradas de `toolMetadata` também aceitam `optional` (marca a ferramenta como não obrigatória para a ativação do plugin) e `replaySafe` (marca a execução da ferramenta como segura para repetição após um turno incompleto do modelo), além dos campos compartilhados de `configSignals`/`authSignals` descritos acima.

Se uma ferramenta não tiver `toolMetadata`, o OpenClaw preserva o comportamento existente e carrega o plugin proprietário quando o contrato da ferramenta corresponde à política. Para ferramentas de caminho crítico cuja fábrica depende de autenticação/configuração, os autores de plugins devem declarar `toolMetadata` em vez de fazer o núcleo importar o runtime para consultá-lo.

## referência de providerAuthChoices

Cada entrada de `providerAuthChoices` descreve uma opção de integração inicial ou autenticação. O OpenClaw lê isso antes que o runtime do provedor seja carregado. As listas de configuração de provedores usam essas opções do manifesto, opções de configuração derivadas de descritores e metadados do catálogo de instalação sem carregar o runtime do provedor.

| Campo                 | Obrigatório | Tipo                                                                  | O que significa                                                                                                                |
| --------------------- | ----------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `provider`            | Sim         | `string`                                                              | ID do provedor ao qual esta opção pertence.                                                                                     |
| `method`              | Sim         | `string`                                                              | ID do método de autenticação para o qual encaminhar.                                                                            |
| `choiceId`            | Sim         | `string`                                                              | ID estável da opção de autenticação usado nos fluxos de integração inicial e da CLI.                                            |
| `choiceLabel`         | Não         | `string`                                                              | Rótulo exibido ao usuário. Se omitido, o OpenClaw usa `choiceId` como alternativa.                                               |
| `choiceHint`          | Não         | `string`                                                              | Texto curto de ajuda para o seletor.                                                                                             |
| `assistantPriority`   | Não         | `number`                                                              | Valores menores aparecem primeiro nos seletores interativos conduzidos pelo assistente.                                         |
| `assistantVisibility` | Não         | `"visible"` \| `"manual-only"`                                        | Oculta a opção dos seletores do assistente, mas ainda permite a seleção manual pela CLI.                                        |
| `deprecatedChoiceIds` | Não         | `string[]`                                                            | IDs de opções legadas que devem redirecionar os usuários para esta opção substituta.                                             |
| `groupId`             | Não         | `string`                                                              | ID opcional do grupo para agrupar opções relacionadas.                                                                           |
| `groupLabel`          | Não         | `string`                                                              | Rótulo desse grupo exibido ao usuário.                                                                                            |
| `groupHint`           | Não         | `string`                                                              | Texto curto de ajuda para o grupo.                                                                                                |
| `onboardingFeatured`  | Não         | `boolean`                                                             | Exibe este grupo na categoria de destaque do seletor interativo de integração inicial, antes da entrada "Mais...".              |
| `optionKey`           | Não         | `string`                                                              | Chave interna da opção para fluxos simples de autenticação com um único sinalizador.                                             |
| `cliFlag`             | Não         | `string`                                                              | Nome do sinalizador da CLI, como `--openrouter-api-key`.                                                                         |
| `cliOption`           | Não         | `string`                                                              | Formato completo da opção da CLI, como `--openrouter-api-key <key>`.                                                             |
| `cliDescription`      | Não         | `string`                                                              | Descrição usada na ajuda da CLI.                                                                                                 |
| `onboardingScopes`    | Não         | `Array<"text-inference" \| "image-generation" \| "music-generation">` | Em quais superfícies de integração inicial esta opção deve aparecer. Se omitido, o padrão é `["text-inference"]`.               |

## Referência de commandAliases

Use `commandAliases` quando um plugin possui um nome de comando de runtime que os usuários podem adicionar por engano a `plugins.allow` ou tentar executar como um comando raiz da CLI. O OpenClaw usa esses metadados para diagnóstico sem importar o código de runtime do plugin.

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
| `name`       | Sim         | `string`          | Nome do comando que pertence a este plugin.                                      |
| `kind`       | Não         | `"runtime-slash"` | Marca o alias como um comando de barra do chat, em vez de um comando raiz da CLI. |
| `cliCommand` | Não         | `string`          | Comando raiz relacionado da CLI a sugerir para operações da CLI, se existir.     |

## Referência de activation

Use `activation` quando o plugin puder declarar de forma econômica quais eventos do plano de controle devem incluí-lo em um plano de ativação/carregamento.

Este bloco contém metadados do planejador, não uma API de ciclo de vida. Ele não registra comportamentos de runtime, não substitui `register(...)` e não garante que o código do plugin já tenha sido executado. O planejador de ativação usa esses campos para restringir os plugins candidatos antes de recorrer aos metadados existentes de propriedade do manifesto, como `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` e hooks.

Prefira os metadados mais específicos que já descrevam a propriedade. Use `providers`, `channels`, `commandAliases`, descritores de configuração ou `contracts` quando esses campos expressarem a relação. Use `activation` para dicas adicionais ao planejador que não possam ser representadas por esses campos de propriedade. Use `cliBackends` no nível superior para aliases de runtime da CLI, como `claude-cli`, `my-cli` ou `google-gemini-cli`; `activation.onAgentHarnesses` destina-se apenas a IDs de harnesses de agentes incorporados que ainda não tenham um campo de propriedade.

Todo plugin deve definir `activation.onStartup` intencionalmente. Defina-o como `true` somente quando o plugin precisar ser executado durante a inicialização do Gateway. Defina-o como `false` quando o plugin estiver inerte na inicialização e só deva ser carregado por gatilhos mais específicos. Omitir `onStartup` não faz mais com que o plugin seja carregado implicitamente na inicialização; use metadados de ativação explícitos para gatilhos de ativação de inicialização, canal, configuração, harness de agente, memória ou outros gatilhos mais específicos.

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

| Campo              | Obrigatório | Tipo                                                 | O que significa                                                                                                                                                                                          |
| ------------------ | ----------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Não         | `boolean`                                            | Ativação explícita na inicialização do Gateway. Todo plugin deve definir este campo. `true` importa o plugin durante a inicialização; `false` mantém o carregamento tardio na inicialização, a menos que outro gatilho correspondente exija o carregamento. |
| `onProviders`      | Não         | `string[]`                                           | IDs de provedores que devem incluir este plugin nos planos de ativação/carregamento.                                                                                                                       |
| `onAgentHarnesses` | Não         | `string[]`                                           | IDs de runtime de harnesses de agentes incorporados que devem incluir este plugin nos planos de ativação/carregamento. Use `cliBackends` no nível superior para aliases de backends da CLI.                 |
| `onCommands`       | Não         | `string[]`                                           | IDs de comandos que devem incluir este plugin nos planos de ativação/carregamento.                                                                                                                         |
| `onChannels`       | Não         | `string[]`                                           | IDs de canais que devem incluir este plugin nos planos de ativação/carregamento.                                                                                                                           |
| `onRoutes`         | Não         | `string[]`                                           | Tipos de rotas que devem incluir este plugin nos planos de ativação/carregamento.                                                                                                                          |
| `onConfigPaths`    | Não         | `string[]`                                           | Caminhos de configuração relativos à raiz que devem incluir este plugin nos planos de inicialização/carregamento quando o caminho estiver presente e não estiver explicitamente desativado.               |
| `onCapabilities`   | Não         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Dicas amplas de capacidades usadas pelo planejamento de ativação do plano de controle. Prefira campos mais específicos quando possível.                                                                    |

Consumidores ativos atuais:

- O planejamento de inicialização do Gateway usa `activation.onStartup` para a importação explícita na inicialização.
- O planejamento da CLI acionado por comandos recorre aos valores legados `commandAliases[].cliCommand` ou `commandAliases[].name`.
- O planejamento de inicialização do runtime do agente usa `activation.onAgentHarnesses` para harnesses incorporados e `cliBackends[]` no nível superior para aliases de runtime da CLI.
- O planejamento de configuração/canal acionado por canal recorre à propriedade legada `channels[]` quando não há metadados explícitos de ativação de canal.
- O planejamento de plugins na inicialização usa `activation.onConfigPaths` para superfícies de configuração raiz que não sejam de canal, como o bloco `browser` do plugin de navegador incluído.
- O planejamento de configuração/runtime acionado por provedor recorre à propriedade legada `providers[]` e `cliBackends[]` no nível superior quando não há metadados explícitos de ativação de provedor.

Os diagnósticos do planejador podem distinguir dicas explícitas de ativação do uso alternativo da propriedade do manifesto. Por exemplo, `activation-command-hint` significa que `activation.onCommands` correspondeu, enquanto `manifest-command-alias` significa que o planejador usou a propriedade de `commandAliases`. Esses rótulos de motivo destinam-se aos diagnósticos do host e aos testes; os autores de plugins devem continuar declarando os metadados que melhor descrevam a propriedade.

## Referência de qaRunners

Use `qaRunners` quando um plugin fornecer um ou mais executores de transporte sob
a raiz compartilhada `openclaw qa`. Mantenha esses metadados leves e estáticos; o
runtime do plugin ainda é responsável pelo registro real na CLI por meio de uma superfície
`runtime-api.ts` leve que exporta `qaRunnerCliRegistrations` correspondentes. Um
`adapterFactory` opcional expõe o transporte a cenários compartilhados de QA sem
alterar o executor do comando registrado.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Executa a via de QA ativa do Matrix baseada em Docker em um homeserver descartável"
    }
  ]
}
```

| Campo         | Obrigatório | Tipo     | O que significa                                                                         |
| ------------- | ----------- | -------- | --------------------------------------------------------------------------------------- |
| `commandName` | Sim         | `string` | Subcomando montado sob `openclaw qa`, por exemplo, `matrix`.                             |
| `description` | Não         | `string` | Texto de ajuda alternativo usado quando o host compartilhado precisa de um comando stub. |

O id de `adapterFactory` deve corresponder a `commandName`. Não exporte registros
para comandos ausentes no manifesto.

## referência de setup

Use `setup` quando as superfícies de configuração e integração inicial precisarem de metadados econômicos pertencentes ao plugin antes do carregamento do runtime.

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

O `cliBackends` de nível superior continua válido e descrevendo backends de inferência da CLI. `setup.cliBackends` é a superfície de descritores específica da configuração para fluxos do plano de controle e de configuração que devem permanecer baseados somente em metadados.

Quando presentes, `setup.providers` e `setup.cliBackends` são a superfície preferencial de consulta que prioriza descritores para a descoberta de configuração. Se o descritor apenas restringir o plugin candidato e a configuração ainda precisar de hooks de runtime mais avançados durante a configuração, defina `requiresRuntime: true` e mantenha `setup-api` como o caminho de execução alternativo.

O OpenClaw também inclui `setup.providers[].envVars` em consultas genéricas de autenticação do provedor e de variáveis de ambiente. `providerAuthEnvVars` continua compatível por meio de um adaptador de compatibilidade durante o período de descontinuação, mas plugins não integrados que ainda o utilizam recebem um diagnóstico do manifesto. Novos plugins devem colocar os metadados de ambiente de configuração/status em `setup.providers[].envVars`.

Use `providerUsageAuthEnvVars` quando uma credencial de faturamento ou de nível organizacional precisar ativar `resolveUsageAuth` sem se tornar uma credencial de inferência. Esses nomes passam a fazer parte do bloqueio de dotenv do espaço de trabalho, da remoção em processos filhos ACP, da filtragem de segredos do sandbox e da limpeza ampla de segredos. O runtime do provedor ainda lê e classifica o valor dentro de `resolveUsageAuth`.

O OpenClaw também pode derivar opções simples de configuração de `setup.providers[].authMethods` quando nenhuma entrada de configuração estiver disponível ou quando `setup.requiresRuntime: false` declarar que o runtime de configuração é desnecessário. Entradas explícitas de `providerAuthChoices` continuam sendo preferenciais para rótulos personalizados, flags da CLI, escopo de integração inicial e metadados do assistente.

Defina `requiresRuntime: false` somente quando esses descritores forem suficientes para a superfície de configuração. O OpenClaw trata o valor explícito `false` como um contrato baseado somente em descritores e não executará `setup-api` nem `openclaw.setupEntry` para a consulta de configuração. Se um plugin baseado somente em descritores ainda distribuir uma dessas entradas de runtime de configuração, o OpenClaw relatará um diagnóstico adicional e continuará ignorando-a. A omissão de `requiresRuntime` mantém o comportamento de fallback legado para não causar falhas em plugins existentes que adicionaram descritores sem a flag.

Como a consulta de configuração pode executar código de `setup-api` pertencente ao plugin, os valores normalizados de `setup.providers[].id` e `setup.cliBackends[]` devem permanecer exclusivos entre os plugins descobertos. Em caso de propriedade ambígua, ocorre uma falha fechada, em vez de escolher um vencedor com base na ordem de descoberta.

Quando o runtime de configuração é executado, os diagnósticos do registro de configuração relatam divergência de descritores se `setup-api` registrar um provedor ou backend da CLI que os descritores do manifesto não declaram, ou se um descritor não tiver um registro de runtime correspondente. Esses diagnósticos são adicionais e não rejeitam plugins legados.

### referência de setup.providers

| Campo          | Obrigatório | Tipo       | Significado                                                                                                     |
| -------------- | ----------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| `id`           | Sim         | `string`   | ID do provedor exposto durante a configuração ou integração inicial. Mantenha os IDs normalizados globalmente exclusivos. |
| `authMethods`  | Não         | `string[]` | IDs dos métodos de configuração/autenticação compatíveis com este provedor sem carregar todo o runtime.        |
| `envVars`      | Não         | `string[]` | Variáveis de ambiente que superfícies genéricas de configuração/status podem verificar antes do carregamento do runtime do plugin. |
| `authEvidence` | Não         | `object[]` | Verificações econômicas de evidências locais de autenticação para provedores que podem autenticar por meio de marcadores não secretos. |

`authEvidence` destina-se a marcadores de credenciais locais pertencentes ao provedor que podem ser verificados sem carregar código de runtime. Essas verificações devem permanecer econômicas e locais: sem chamadas de rede, sem leituras do chaveiro ou de gerenciadores de segredos, sem comandos de shell e sem sondagens da API do provedor.

Entradas de evidência compatíveis:

| Campo              | Obrigatório | Tipo       | Significado                                                                                                               |
| ------------------ | ----------- | ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| `type`             | Sim         | `string`   | Atualmente, `local-file-with-env`.                                                                                        |
| `fileEnvVar`       | Não         | `string`   | Variável de ambiente que contém um caminho explícito para o arquivo de credenciais.                                       |
| `fallbackPaths`    | Não         | `string[]` | Caminhos locais de arquivos de credenciais verificados quando `fileEnvVar` está ausente ou vazio. Compatível com `${HOME}` e `${APPDATA}`. |
| `requiresAnyEnv`   | Não         | `string[]` | Pelo menos uma das variáveis de ambiente listadas deve estar preenchida para que a evidência seja válida.                |
| `requiresAllEnv`   | Não         | `string[]` | Todas as variáveis de ambiente listadas devem estar preenchidas para que a evidência seja válida.                        |
| `credentialMarker` | Sim         | `string`   | Marcador não secreto retornado quando a evidência está presente.                                                          |
| `source`           | Não         | `string`   | Rótulo de origem visível ao usuário na saída de autenticação/status.                                                      |

### campos de setup

| Campo              | Obrigatório | Tipo       | Significado                                                                                                      |
| ------------------ | ----------- | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| `providers`        | Não         | `object[]` | Descritores de configuração de provedores expostos durante a configuração e a integração inicial.               |
| `cliBackends`      | Não         | `string[]` | IDs de backends usados durante a configuração para consultas que priorizam descritores. Mantenha os IDs normalizados globalmente exclusivos. |
| `configMigrations` | Não         | `string[]` | IDs de migrações de configuração pertencentes à superfície de configuração deste plugin.                        |
| `requiresRuntime`  | Não         | `boolean`  | Indica se a configuração ainda precisa executar `setup-api` após a consulta de descritores.                     |

## referência de uiHints

`uiHints` é um mapa que associa nomes de campos de configuração a pequenas dicas de renderização. As chaves podem usar pontos para campos de configuração aninhados, mas nenhum segmento do caminho pode ser `__proto__`, `constructor` ou `prototype`; a configuração rejeita esses nomes.

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

| Campo         | Tipo       | Significado                                      |
| ------------- | ---------- | ------------------------------------------------ |
| `label`       | `string`   | Rótulo do campo visível ao usuário.              |
| `help`        | `string`   | Texto curto de ajuda.                            |
| `tags`        | `string[]` | Tags opcionais da interface.                     |
| `advanced`    | `boolean`  | Marca o campo como avançado.                     |
| `sensitive`   | `boolean`  | Marca o campo como secreto ou confidencial.      |
| `placeholder` | `string`   | Texto de placeholder para campos de formulário. |

## referência de contracts

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

| Campo                            | Tipo       | O que significa                                                                                                                                 |
| -------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | IDs de fábrica de extensões do app-server do Codex, atualmente `codex-app-server`.                                                              |
| `agentToolResultMiddleware`      | `string[]` | IDs de runtime para os quais este plugin pode registrar middleware de resultados de ferramentas.                                                |
| `trustedToolPolicies`            | `string[]` | IDs locais do plugin de políticas confiáveis pré-ferramenta que um plugin instalado pode registrar. Plugins incluídos podem registrar políticas sem este campo. |
| `externalAuthProviders`          | `string[]` | IDs de provedores cujo hook de perfil de autenticação externa pertence a este plugin.                                                           |
| `embeddingProviders`             | `string[]` | IDs de provedores gerais de embeddings que pertencem a este plugin para uso reutilizável de embeddings vetoriais, incluindo memória.             |
| `speechProviders`                | `string[]` | IDs de provedores de fala que pertencem a este plugin.                                                                                           |
| `realtimeTranscriptionProviders` | `string[]` | IDs de provedores de transcrição em tempo real que pertencem a este plugin.                                                                      |
| `realtimeVoiceProviders`         | `string[]` | IDs de provedores de voz em tempo real que pertencem a este plugin.                                                                              |
| `memoryEmbeddingProviders`       | `string[]` | IDs obsoletos de provedores de embeddings específicos de memória que pertencem a este plugin.                                                    |
| `mediaUnderstandingProviders`    | `string[]` | IDs de provedores de compreensão de mídia que pertencem a este plugin.                                                                           |
| `transcriptSourceProviders`      | `string[]` | IDs de provedores de fontes de transcrição que pertencem a este plugin.                                                                          |
| `documentExtractors`             | `string[]` | IDs de provedores de extração de documentos (por exemplo, PDF) que pertencem a este plugin.                                                       |
| `imageGenerationProviders`       | `string[]` | IDs de provedores de geração de imagens que pertencem a este plugin.                                                                             |
| `videoGenerationProviders`       | `string[]` | IDs de provedores de geração de vídeos que pertencem a este plugin.                                                                              |
| `musicGenerationProviders`       | `string[]` | IDs de provedores de geração de música que pertencem a este plugin.                                                                              |
| `webContentExtractors`           | `string[]` | IDs de provedores de extração de conteúdo de páginas da Web que pertencem a este plugin.                                                         |
| `webFetchProviders`              | `string[]` | IDs de provedores de busca de conteúdo na Web que pertencem a este plugin.                                                                       |
| `webSearchProviders`             | `string[]` | IDs de provedores de pesquisa na Web que pertencem a este plugin.                                                                                |
| `workerProviders`                | `string[]` | IDs de provedores de workers na nuvem que pertencem a este plugin para provisionamento e ciclo de vida de concessões respaldadas por perfil.     |
| `usageProviders`                 | `string[]` | IDs de provedores cujos hooks de autenticação de uso e de snapshot de uso pertencem a este plugin.                                               |
| `migrationProviders`             | `string[]` | IDs de provedores de importação que pertencem a este plugin para `openclaw migrate`.                                                             |
| `gatewayMethodDispatch`          | `string[]` | Permissão reservada para rotas HTTP autenticadas de plugins que despacham métodos do Gateway no processo.                                        |
| `tools`                          | `string[]` | Nomes de ferramentas de agente que pertencem a este plugin.                                                                                      |

`contracts.embeddedExtensionFactories` é mantido para fábricas de extensões incluídas exclusivas do app-server do Codex. As transformações incluídas de resultados de ferramentas devem declarar `contracts.agentToolResultMiddleware` e, em vez disso, registrar-se com `api.registerAgentToolResultMiddleware(...)`. Plugins instalados podem usar o mesmo ponto de integração de middleware somente quando explicitamente habilitados e apenas para os runtimes que declaram em `contracts.agentToolResultMiddleware`.

Plugins instalados que precisem da camada de políticas pré-ferramenta confiada pelo host devem declarar cada ID local registrado em `contracts.trustedToolPolicies` e ser explicitamente habilitados. Plugins incluídos mantêm o caminho existente de políticas confiáveis, mas plugins instalados com IDs de política não declarados são rejeitados antes do registro. Os IDs de política têm escopo restrito ao plugin que os registra; portanto, dois plugins podem declarar e registrar `workflow-budget`, mas um único plugin não pode registrar o mesmo ID local duas vezes.

Os registros de `api.registerTool(...)` em runtime devem corresponder a `contracts.tools`. A descoberta de ferramentas usa essa lista para carregar somente os runtimes dos plugins que podem ser proprietários das ferramentas solicitadas.

Plugins de provedores que implementam `resolveExternalAuthProfiles` devem declarar `contracts.externalAuthProviders`; hooks de autenticação externa não declarados são ignorados.

Plugins de provedores que implementam tanto `resolveUsageAuth` quanto `fetchUsageSnapshot` devem declarar cada ID de provedor descoberto automaticamente em `contracts.usageProviders`. A descoberta de uso lê esse contrato antes de carregar o código de runtime e, em seguida, verifica ambos os hooks após carregar somente os proprietários declarados.

Provedores gerais de embeddings devem declarar `contracts.embeddingProviders` para cada adaptador registrado com `api.registerEmbeddingProvider(...)`. Use o contrato geral para geração reutilizável de vetores, incluindo provedores consumidos pela pesquisa de memória. `contracts.memoryEmbeddingProviders` é uma compatibilidade obsoleta específica de memória e permanece somente enquanto os provedores existentes migram para o ponto de integração genérico de provedores de embeddings.

Provedores de workers devem declarar cada ID de `api.registerWorkerProvider(...)` em `contracts.workerProviders`. O núcleo persiste a intenção durável antes de chamar `provision`; os provedores validam suas configurações antes da alocação externa, e chamadas repetidas com o mesmo ID de operação devem adotar a mesma concessão. O núcleo também persiste esse snapshot de configurações validadas e o transmite com `leaseId` para `inspect({ leaseId, profile })` e `destroy({ leaseId, profile })`, inclusive depois que o perfil nomeado é alterado ou removido. A destruição é idempotente, a inspeção retorna a união de status fechada `active` / `destroyed` / `unknown`, e o material de chave privada SSH é referenciado somente por meio de `SecretRef`. Endpoints SSH provisionados também devem incluir uma `hostKey` pública proveniente de uma saída de provisionamento confiável exatamente no formato `algorithm base64`, sem nome de host nem comentário, para que o núcleo possa fixar o host antes de se conectar. Provedores que geram referências dinâmicas de identidade podem implementar o método autoritativo `resolveSshIdentity({ leaseId, profile, keyRef })`; provedores sem ele usam o resolvedor genérico de segredos do núcleo. Um resultado autoritativo `unknown` torna órfão um registro local ativo; após uma solicitação de destruição persistida, ele confirma o encerramento.

`contracts.gatewayMethodDispatch` atualmente aceita `"authenticated-request"`. Ele é uma barreira de higiene de API para rotas HTTP nativas de plugins que despacham intencionalmente métodos do plano de controle do Gateway no processo, não um sandbox contra plugins nativos maliciosos. Use-o somente para superfícies incluídas/de operador rigorosamente revisadas que já exijam autenticação HTTP do Gateway. Uma rota autorizada permanece acessível enquanto a admissão de trabalho raiz do Gateway está fechada somente quando também declara `auth: "gateway"` e o `gatewayRuntimeScopeSurface: "trusted-operator"` específico da rota; rotas irmãs comuns do mesmo plugin permanecem atrás do limite de admissão. Isso mantém o status de suspensão e a retomada acessíveis sem conceder a todo o plugin uma forma de contornar a admissão. Mantenha a análise e a formatação de respostas limitadas fora do despacho; trabalhos substanciais ou mutáveis devem passar pelo despacho de métodos do Gateway, que é responsável pela admissão e pela aplicação do escopo.

## Referência de configContracts

Use `configContracts` para comportamentos de configuração pertencentes ao manifesto que os auxiliares genéricos do núcleo precisam acessar sem importar o runtime do plugin: detecção de flags perigosas, destinos de migração de SecretRef e restrição de caminhos de configuração legados.

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

| Campo                         | Obrigatório | Tipo       | O que significa                                                                                                                                                                                                                                          |
| ----------------------------- | ----------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compatibilityMigrationPaths` | Não         | `string[]` | Caminhos de configuração relativos à raiz que indicam que as migrações de compatibilidade deste plugin durante a configuração podem ser aplicáveis. Permite que leituras genéricas de configuração em runtime ignorem todas as superfícies de configuração de plugins quando a configuração nunca referencia o plugin. |
| `compatibilityRuntimePaths`   | Não         | `string[]` | Caminhos de compatibilidade relativos à raiz que este plugin pode atender durante o runtime antes de o código do plugin ser totalmente ativado. Use isto para superfícies legadas que devem restringir conjuntos de candidatos incluídos sem importar o runtime de todos os plugins compatíveis. |
| `dangerousFlags`              | Não         | `object[]` | Literais de configuração que `openclaw doctor` deve sinalizar como inseguros ou perigosos quando habilitados. Veja abaixo.                                                                                                                                |
| `secretInputs`                | Não         | `object`   | Caminhos de configuração em `plugins.entries.<id>.config` que o registro de destinos de migração/auditoria de SecretRef deve tratar como strings com formato de segredo. Veja abaixo.                                                                      |

Cada entrada de `dangerousFlags` aceita:

| Campo    | Obrigatório | Tipo                                  | O que significa                                                                                                               |
| -------- | ----------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `path`   | Sim         | `string`                              | Caminho de configuração separado por pontos, relativo a `plugins.entries.<id>.config`. Aceita curingas `*` para segmentos de mapa/array. |
| `equals` | Sim         | `string \| number \| boolean \| null` | Literal exato que marca este valor de configuração como perigoso.                                                             |

`secretInputs` aceita:

| Campo                   | Obrigatório | Tipo       | O que significa                                                                                                                                                                                                 |
| ----------------------- | ----------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled` | Não         | `boolean`  | Substitui a habilitação padrão do plugin incluído ao decidir se esta superfície SecretRef está ativa. Use quando o plugin estiver incluído, mas a superfície precisar permanecer inativa até ser explicitamente habilitada na configuração. |
| `paths`                 | Sim         | `object[]` | Caminhos de configuração no formato de segredo, cada um com `path` (separado por pontos, relativo a `plugins.entries.<id>.config`, aceita curingas `*`) e `expected` opcional (atualmente, apenas `"string"`).      |

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

| Campo                  | Tipo                                                             | O que significa                                                                                                 |
| ---------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]`                              | Recursos de mídia expostos por este provedor.                                                                  |
| `defaultModels`        | `Record<string, string>`                                         | Padrões de recurso para modelo usados quando a configuração não especifica um modelo.                          |
| `autoPriority`         | `Record<string, number>`                                         | Números menores aparecem primeiro no fallback automático de provedor baseado em credenciais.                   |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | Entradas nativas de documentos compatíveis com o provedor.                                                     |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | Substituições de modelo por tipo de documento. Defina `image: false` para desabilitar a extração baseada em imagem para esse tipo de documento. |

## Referência de channelConfigs

Use `channelConfigs` quando um plugin de canal precisar de metadados leves de configuração antes do carregamento do runtime. A descoberta somente leitura de configuração/status do canal pode usar esses metadados diretamente para canais externos configurados quando nenhuma entrada de configuração estiver disponível ou quando `setup.requiresRuntime: false` declarar que o runtime de configuração é desnecessário.

`channelConfigs` são metadados do manifesto do plugin, não uma nova seção de configuração de usuário de nível superior. Os usuários ainda configuram instâncias de canal em `channels.<channel-id>`. O OpenClaw lê os metadados do manifesto para decidir qual plugin é proprietário desse canal configurado antes da execução do código de runtime do plugin.

Para um plugin de canal, `configSchema` e `channelConfigs` descrevem caminhos diferentes:

- `configSchema` valida `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valida `channels.<channel-id>`

Plugins não incluídos que declaram `channels[]` também devem declarar entradas `channelConfigs` correspondentes. Sem elas, o OpenClaw ainda pode carregar o plugin, mas as superfícies de esquema de configuração em caminho frio, de configuração e da Control UI não conseguem saber o formato das opções pertencentes ao canal até que o runtime do plugin seja executado.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` e `nativeSkillsAutoEnabled` podem declarar padrões estáticos de `auto` para verificações de configuração de comandos executadas antes do carregamento do runtime do canal. Canais incluídos também podem publicar os mesmos padrões por meio de `package.json#openclaw.channel.commands`, juntamente com seus outros metadados de catálogo de canais pertencentes ao pacote.

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

| Campo         | Tipo                     | O que significa                                                                                      |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema para `channels.<id>`. Obrigatório para cada entrada declarada de configuração de canal.  |
| `uiHints`     | `Record<string, object>` | Rótulos, placeholders e indicações de conteúdo sensível opcionais da UI para essa seção de configuração do canal. |
| `label`       | `string`                 | Rótulo do canal incorporado às superfícies de seleção e inspeção quando os metadados do runtime não estão prontos. |
| `description` | `string`                 | Breve descrição do canal para superfícies de inspeção e catálogo.                                   |
| `commands`    | `object`                 | Padrões automáticos estáticos de comandos nativos e Skills nativas para verificações de configuração anteriores ao runtime. |
| `preferOver`  | `string[]`               | IDs de plugins legados ou de menor prioridade que este canal deve superar nas superfícies de seleção. |

### Substituição de outro plugin de canal

Use `preferOver` quando seu plugin for o proprietário preferencial de um ID de canal que outro plugin também possa fornecer. Casos comuns incluem um ID de plugin renomeado, um plugin independente que substitui um plugin incluído ou um fork mantido que preserva o mesmo ID de canal para manter a compatibilidade da configuração.

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

Quando `channels.chat` está configurado, o OpenClaw considera tanto o ID do canal quanto o ID do plugin preferencial. Se o plugin de menor prioridade tiver sido selecionado apenas por estar incluído ou habilitado por padrão, o OpenClaw o desabilitará na configuração efetiva do runtime para que um único plugin seja proprietário do canal e de suas ferramentas. A seleção explícita do usuário ainda prevalece: se o usuário habilitar explicitamente ambos os plugins (por meio de `plugins.allow` ou de uma configuração relevante em `plugins.entries`), o OpenClaw preservará essa escolha e relatará diagnósticos de canal/ferramenta duplicados, em vez de alterar silenciosamente o conjunto de plugins solicitado.

Mantenha `preferOver` restrito a IDs de plugins que realmente possam fornecer o mesmo canal. Ele não é um campo de prioridade geral e não renomeia chaves de configuração do usuário.

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

- referências explícitas `provider/model` usam os metadados de manifesto `providers` do proprietário
- `modelPatterns` têm precedência sobre `modelPrefixes`
- se um plugin não incluído e um plugin incluído corresponderem, o plugin não incluído prevalecerá
- a ambiguidade restante é ignorada até que o usuário ou a configuração especifique um provedor

Campos:

| Campo           | Tipo       | O que significa                                                                          |
| --------------- | ---------- | ---------------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefixos comparados com `startsWith` em relação a IDs abreviados de modelos.             |
| `modelPatterns` | `string[]` | Fontes de regex comparadas com IDs abreviados de modelos após a remoção do sufixo de perfil. |

As entradas de `modelPatterns` são compiladas por meio de `compileSafeRegex`, que rejeita padrões contendo repetição aninhada (por exemplo, `(a+)+$`). Padrões que não passam na verificação de segurança são ignorados silenciosamente, assim como regex sintaticamente inválidas. Mantenha os padrões simples e evite quantificadores aninhados.

## Referência de modelCatalog

Use `modelCatalog` quando o OpenClaw precisar conhecer os metadados dos modelos do provedor antes de carregar o runtime do plugin. Esta é a fonte pertencente ao manifesto para linhas fixas de catálogo, aliases de provedor, regras de supressão e modo de descoberta. A atualização em runtime ainda pertence ao código de runtime do provedor, mas o manifesto informa ao núcleo quando o runtime é necessário.

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

| Campo            | Tipo                                                     | O que significa                                                                                                         |
| ---------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | Linhas de catálogo para IDs de provedores pertencentes a este plugin. As chaves também devem aparecer em `providers` no nível superior. |
| `aliases`        | `Record<string, object>`                                 | Aliases de provedores que devem ser resolvidos para um provedor pertencente ao plugin no planejamento do catálogo ou de supressões. |
| `suppressions`   | `object[]`                                               | Linhas de modelos de outra origem que este plugin suprime por um motivo específico do provedor.                         |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | Indica se o catálogo do provedor pode ser lido dos metadados do manifesto, atualizado no cache ou se requer o runtime.  |
| `runtimeAugment` | `boolean`                                                | Defina como `true` somente quando o runtime do provedor precisar acrescentar linhas ao catálogo após o planejamento do manifesto/configuração. |

`aliases` participa da consulta de propriedade do provedor para o planejamento do catálogo de modelos. Os destinos dos aliases devem ser provedores de nível superior pertencentes ao mesmo plugin. Quando uma lista filtrada por provedor usa um alias, o OpenClaw pode ler o manifesto proprietário e aplicar substituições de API/URL base do alias sem carregar o runtime do provedor. Os aliases não expandem listagens de catálogo não filtradas; listas amplas emitem somente as linhas do provedor canônico proprietário.

`suppressions` substitui o antigo hook `suppressBuiltInModel` do runtime do provedor. As entradas de supressão são respeitadas somente quando o provedor pertence ao plugin ou é declarado como uma chave de `modelCatalog.aliases` que aponta para um provedor pertencente ao plugin. Hooks de supressão do runtime não são mais chamados durante a resolução de modelos.

Campos do provedor:

| Campo                 | Tipo                     | O que significa                                                                                                                                                                                                                                   |
| --------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`             | `string`                 | URL base padrão opcional para os modelos neste catálogo de provedor.                                                                                                                                                                              |
| `api`                 | `ModelApi`               | Adaptador de API padrão opcional para os modelos neste catálogo de provedor.                                                                                                                                                                      |
| `headers`             | `Record<string, string>` | Cabeçalhos estáticos opcionais aplicáveis a este catálogo de provedor.                                                                                                                                                                            |
| `defaultUtilityModel` | `string`                 | ID opcional de modelo pequeno recomendado pelo provedor para tarefas utilitárias internas curtas (títulos, narração do progresso). Usado quando `agents.defaults.utilityModel` não está definido e este provedor atende ao modelo principal do agente. |
| `models`              | `object[]`               | Linhas de modelos obrigatórias. Linhas sem um `id` são ignoradas.                                                                                                                                                                                 |

Campos do modelo:

| Campo              | Tipo                                                           | O que significa                                                                                      |
| ------------------ | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `id`               | `string`                                                       | ID do modelo local ao provedor, sem o prefixo `provider/`.                                           |
| `name`             | `string`                                                       | Nome de exibição opcional.                                                                           |
| `api`              | `ModelApi`                                                     | Substituição opcional de API por modelo.                                                             |
| `baseUrl`          | `string`                                                       | Substituição opcional de URL base por modelo.                                                        |
| `headers`          | `Record<string, string>`                                       | Cabeçalhos estáticos opcionais por modelo.                                                           |
| `input`            | `Array<"text" \| "image" \| "document">`                       | Modalidades aceitas pelo modelo. Outros valores são descartados silenciosamente.                     |
| `reasoning`        | `boolean`                                                      | Indica se o modelo oferece comportamento de raciocínio.                                              |
| `contextWindow`    | `number`                                                       | Janela de contexto nativa do provedor.                                                               |
| `contextTokens`    | `number`                                                       | Limite efetivo opcional de contexto do runtime quando diferente de `contextWindow`.                   |
| `maxTokens`        | `number`                                                       | Máximo de tokens de saída, quando conhecido.                                                         |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | Substituições opcionais de ID de modelo ou parâmetro por nível de raciocínio.                         |
| `cost`             | `object`                                                       | Preço opcional em USD por milhão de tokens, incluindo `tieredPricing` opcional.                       |
| `compat`           | `object`                                                       | Sinalizadores opcionais de compatibilidade correspondentes à compatibilidade da configuração de modelos do OpenClaw. |
| `mediaInput`       | `object`                                                       | Configuração opcional de entrada por modalidade, atualmente somente para imagens.                     |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Status da listagem. Suprima somente quando a linha não puder aparecer de forma alguma.                |
| `statusReason`     | `string`                                                       | Motivo opcional exibido com um status diferente de disponível.                                       |
| `replaces`         | `string[]`                                                     | IDs de modelos locais ao provedor mais antigos que este modelo substitui.                             |
| `replacedBy`       | `string`                                                       | ID do modelo substituto local ao provedor para linhas obsoletas.                                     |
| `tags`             | `string[]`                                                     | Tags estáveis usadas por seletores e filtros.                                                        |

Campos de supressão:

| Campo                      | Tipo       | O que significa                                                                                                      |
| -------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | ID do provedor da linha de origem a ser suprimida. Deve pertencer a este plugin ou ser declarado como um alias pertencente ao plugin. |
| `model`                    | `string`   | ID do modelo local ao provedor a ser suprimido.                                                                      |
| `reason`                   | `string`   | Mensagem opcional exibida quando a linha suprimida é solicitada diretamente.                                         |
| `when.baseUrlHosts`        | `string[]` | Lista opcional de hosts efetivos da URL base do provedor exigidos para que a supressão seja aplicada.                |
| `when.providerConfigApiIn` | `string[]` | Lista opcional de valores exatos de `api` da configuração do provedor exigidos para que a supressão seja aplicada.   |

Não coloque dados disponíveis apenas no runtime em `modelCatalog`. Use `static` somente quando as linhas do manifesto forem completas o suficiente para que superfícies de lista filtrada por provedor e seletores dispensem a descoberta do registro/runtime. Use `refreshable` quando as linhas do manifesto forem sementes ou complementos úteis e listáveis, mas uma atualização/cache puder adicionar mais linhas posteriormente; as linhas atualizáveis não são autoritativas por si sós. Use `runtime` quando o OpenClaw precisar carregar o runtime do provedor para conhecer a lista.

## Referência de modelIdNormalization

Use `modelIdNormalization` para uma normalização simples, pertencente ao provedor, dos IDs de modelos que precise ocorrer antes do carregamento do runtime do provedor. Isso mantém aliases como nomes curtos de modelos, IDs legados locais ao provedor e regras de prefixo de proxy no manifesto do plugin proprietário, em vez de nas tabelas centrais de seleção de modelos.

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

| Campo                                | Tipo                    | O que significa                                                                                               |
| ------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Aliases exatos de IDs de modelos, sem diferenciação entre maiúsculas e minúsculas. Os valores são retornados como escritos. |
| `stripPrefixes`                      | `string[]`              | Prefixos a remover antes da consulta de aliases, úteis para duplicações legadas de provedor/modelo.           |
| `prefixWhenBare`                     | `string`                | Prefixo a adicionar quando o ID normalizado do modelo ainda não contém `/`.                                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Regras condicionais de prefixo para IDs sem prefixo após a consulta de aliases, definidas por `modelPrefix` e `prefix`. |

## Referência de providerEndpoints

Use `providerEndpoints` para a classificação de endpoints que a política genérica de solicitações precisa conhecer antes do carregamento do runtime do provedor. O núcleo continua responsável pelo significado de cada `endpointClass`; os manifestos dos plugins são responsáveis pelos metadados de host e URL base.

Plugins de provedores oficialmente externalizados são excluídos da distribuição do núcleo, portanto
seus manifestos ficam invisíveis até serem instalados. Seus `providerEndpoints` também devem
ser espelhados em `scripts/lib/official-external-provider-catalog.json` para que
a classificação de endpoints continue funcionando sem o plugin; um teste de contrato
garante esse espelhamento.

Campos do endpoint:

| Campo                          | Tipo       | O que significa                                                                                |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Classe de endpoint principal conhecida, como `openrouter`, `moonshot-native` ou `google-vertex`. |
| `hosts`                        | `string[]` | Nomes de host exatos que correspondem à classe de endpoint.                                    |
| `hostSuffixes`                 | `string[]` | Sufixos de host que correspondem à classe de endpoint. Use o prefixo `.` para corresponder apenas a sufixos de domínio. |
| `baseUrls`                     | `string[]` | URLs-base HTTP(S) normalizadas exatas que correspondem à classe de endpoint.                    |
| `googleVertexRegion`           | `string`   | Região estática do Google Vertex para hosts globais exatos.                                    |
| `googleVertexRegionHostSuffix` | `string`   | Sufixo a ser removido dos hosts correspondentes para expor o prefixo da região do Google Vertex. |

## Referência de providerRequest

Use `providerRequest` para metadados econômicos de compatibilidade de solicitações necessários à política genérica de solicitações sem carregar o runtime do provedor. Mantenha a reescrita de payloads específica de comportamento nos hooks de runtime do provedor ou em auxiliares compartilhados da família de provedores.

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

| Campo                 | Tipo         | O que significa                                                                        |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | Rótulo da família do provedor usado por decisões genéricas de compatibilidade de solicitações e diagnósticos. |
| `compatibilityFamily` | `"moonshot"` | Grupo opcional de compatibilidade da família de provedores para auxiliares compartilhados de solicitações. |
| `openAICompletions`   | `object`     | Sinalizadores de solicitação de conclusões compatíveis com a OpenAI, atualmente `supportsStreamingUsage`. |

## Referência de secretProviderIntegrations

Use `secretProviderIntegrations` quando um plugin puder publicar uma predefinição reutilizável de provedor exec de SecretRef. O OpenClaw lê esses metadados antes que o runtime do plugin seja carregado, armazena a propriedade do plugin em `secrets.providers.<alias>.pluginIntegration` e deixa a resolução efetiva do segredo para o runtime de SecretRef. As predefinições são expostas apenas para plugins integrados e plugins instalados descobertos nas raízes gerenciadas de instalação de plugins, como instalações pelo git e pelo ClawHub.

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

A chave do mapa é o ID da integração. Se `providerAlias` for omitido, o OpenClaw usará o ID da integração como alias do provedor de SecretRef. Os aliases de provedor devem corresponder ao padrão normal de alias de provedor de SecretRef, por exemplo, `team-secrets` ou `onepassword-work`.

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

Na inicialização/recarga, o OpenClaw resolve esse provedor carregando os metadados atuais do manifesto do plugin, verificando se o plugin proprietário está instalado e ativo e materializando o comando exec a partir do manifesto. Desativar ou remover o plugin revoga o provedor para SecretRefs ativas. Os operadores que desejarem uma configuração exec independente ainda poderão gravar provedores manuais de `command`/`args` diretamente.

No momento, apenas predefinições com `source: "exec"` são compatíveis. `command` deve ser `${node}`, e `args[0]` deve ser um script resolvedor relativo à raiz do plugin iniciado por `./`. Na inicialização/recarga, o OpenClaw o materializa como o executável atual do Node e o caminho absoluto do script dentro do plugin. Opções do Node como `--require`, `--import`, `--loader`, `--env-file`, `--eval` e `--print` não fazem parte do contrato de predefinições do manifesto. Os operadores que precisarem de comandos que não sejam do Node poderão configurar diretamente provedores exec manuais independentes.

O OpenClaw deriva `trustedDirs` para predefinições do manifesto a partir da raiz do plugin e, para predefinições `${node}`, do diretório do executável atual do Node. Valores de `trustedDirs` definidos no manifesto são ignorados. Outras opções de provedor exec, como `timeoutMs`, `noOutputTimeoutMs`, `maxOutputBytes`, `jsonOnly`, `env`, `passEnv` e `allowInsecurePath`, são repassadas para a configuração normal do provedor exec de SecretRef.

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

| Campo        | Tipo              | O que significa                                                                                    |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Defina como `false` para provedores locais/auto-hospedados que nunca devem buscar preços do OpenRouter ou LiteLLM. |
| `openRouter` | `false \| object` | Mapeamento de consulta de preços do OpenRouter. `false` desativa a consulta ao OpenRouter para esse provedor. |
| `liteLLM`    | `false \| object` | Mapeamento de consulta de preços do LiteLLM. `false` desativa a consulta ao LiteLLM para esse provedor. |

Campos da fonte:

| Campo                      | Tipo               | O que significa                                                                                                      |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | ID do provedor no catálogo externo quando ele difere do ID do provedor no OpenClaw, por exemplo, `z-ai` para um provedor `zai`. |
| `passthroughProviderModel` | `boolean`          | Trata IDs de modelo que contêm barras como referências aninhadas de provedor/modelo, útil para provedores proxy como o OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Variantes adicionais de ID de modelo do catálogo externo. `version-dots` tenta IDs de versão com pontos, como `claude-opus-4.6`. |

### Índice de provedores do OpenClaw

O Índice de Provedores do OpenClaw consiste em metadados de pré-visualização pertencentes ao OpenClaw para provedores cujos plugins talvez ainda não estejam instalados. Ele não faz parte do manifesto de um plugin. Os manifestos de plugins continuam sendo a autoridade para plugins instalados. O Índice de Provedores é o contrato interno de contingência que futuras interfaces de seleção de modelos antes da instalação e de provedores instaláveis consumirão quando um plugin de provedor não estiver instalado.

Ordem de autoridade do catálogo:

1. Configuração do usuário.
2. `modelCatalog` do manifesto do plugin instalado.
3. Cache do catálogo de modelos proveniente de uma atualização explícita.
4. Linhas de pré-visualização do Índice de Provedores do OpenClaw.

O Índice de Provedores não deve conter segredos, estado de ativação, hooks de runtime nem dados dinâmicos de modelos específicos de uma conta. Seus catálogos de pré-visualização usam o mesmo formato de linha de provedor de `modelCatalog` dos manifestos de plugins, mas devem permanecer limitados a metadados estáveis de exibição, a menos que campos do adaptador de runtime, como `api`, `baseUrl`, preços ou sinalizadores de compatibilidade, sejam intencionalmente mantidos alinhados ao manifesto do plugin instalado. Provedores com descoberta dinâmica por `/models` devem gravar as linhas atualizadas pelo caminho explícito do cache do catálogo de modelos, em vez de fazer com que a listagem normal ou a integração inicial chame APIs do provedor.

As entradas do Índice de Provedores também podem conter metadados de plugins instaláveis para provedores cujo plugin tenha sido movido para fora do núcleo ou ainda não esteja instalado por outro motivo. Esses metadados espelham o padrão do catálogo de canais: nome do pacote, especificação de instalação npm, integridade esperada e rótulos econômicos das opções de autenticação são suficientes para exibir uma opção de configuração instalável. Depois que o plugin for instalado, seu manifesto prevalecerá, e a entrada do Índice de Provedores será ignorada para esse provedor.

`openclaw doctor --fix` migra um conjunto pequeno e fechado de chaves legadas de recursos do manifesto no nível superior para `contracts.*`: `speechProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders` e `tools`. Nenhuma delas — nem qualquer outra lista de recursos — é mais lida como campo de nível superior do manifesto; o carregamento normal do manifesto só as reconhece em `contracts`.

## Manifesto versus package.json

Os dois arquivos cumprem funções diferentes:

| Arquivo                | Use para                                                                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Descoberta, validação da configuração, metadados das opções de autenticação e dicas de interface que devem existir antes da execução do código do plugin |
| `package.json`         | Metadados do npm, instalação de dependências e o bloco `openclaw` usado para pontos de entrada, restrições de instalação, configuração ou metadados do catálogo |

Se não tiver certeza sobre onde um metadado deve ficar, use esta regra:

- se o OpenClaw precisar conhecê-lo antes de carregar o código do plugin, coloque-o em `openclaw.plugin.json`
- se estiver relacionado ao empacotamento, aos arquivos de entrada ou ao comportamento da instalação npm, coloque-o em `package.json`

### Campos de package.json que afetam a descoberta

Alguns metadados de plugins anteriores ao runtime residem intencionalmente no bloco `openclaw` de `package.json`, em vez de `openclaw.plugin.json`. `openclaw.bundle` e `openclaw.bundle.json` não são contratos de plugins do OpenClaw; plugins nativos devem usar `openclaw.plugin.json` junto com os campos compatíveis de `package.json#openclaw` abaixo.

Exemplos importantes:

| Campo                                                                                      | O que significa                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | Declara pontos de entrada de plugins nativos. Devem permanecer dentro do diretório do pacote do plugin.                                                                                                          |
| `openclaw.runtimeExtensions`                                                               | Declara pontos de entrada de runtime JavaScript compilados para pacotes instalados. Devem permanecer dentro do diretório do pacote do plugin.                                                                     |
| `openclaw.setupEntry`                                                                      | Ponto de entrada leve, exclusivo para configuração, usado durante a integração inicial, a inicialização adiada de canais e a descoberta somente leitura de status de canais/SecretRef. Deve permanecer dentro do diretório do pacote do plugin. |
| `openclaw.runtimeSetupEntry`                                                               | Declara o ponto de entrada de configuração JavaScript compilado para pacotes instalados. Requer `setupEntry`, deve existir e deve permanecer dentro do diretório do pacote do plugin.                              |
| `openclaw.channel`                                                                         | Metadados leves do catálogo de canais, como rótulos, caminhos de documentação, aliases e texto de seleção.                                                                                                       |
| `openclaw.channel.commands`                                                                | Metadados estáticos de comandos nativos e padrões automáticos de Skills nativas usados por superfícies de configuração, auditoria e listagem de comandos antes do carregamento do runtime do canal.                |
| `openclaw.channel.configuredState`                                                         | Metadados leves do verificador de estado configurado que podem responder "já existe uma configuração somente por variáveis de ambiente?" sem carregar o runtime completo do canal.                               |
| `openclaw.channel.persistedAuthState`                                                      | Metadados leves do verificador de autenticação persistida que podem responder "já há alguma sessão iniciada?" sem carregar o runtime completo do canal.                                                           |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Indicações de instalação/atualização para plugins incluídos e publicados externamente.                                                                                                                           |
| `openclaw.install.defaultChoice`                                                           | Caminho de instalação preferencial quando há várias fontes de instalação disponíveis.                                                                                                                           |
| `openclaw.install.minHostVersion`                                                          | Versão mínima compatível do host OpenClaw, usando um limite inferior semver como `>=2026.3.22` ou `>=2026.5.1-beta.1`.                                                                                            |
| `openclaw.compat.pluginApi`                                                                | Intervalo mínimo da API de plugins do OpenClaw exigido por este pacote, usando um limite inferior semver como `>=2026.5.27`.                                                                                      |
| `openclaw.install.expectedIntegrity`                                                       | String esperada de integridade da distribuição npm, como `sha512-...`; os fluxos de instalação e atualização verificam o artefato obtido em relação a ela.                                                       |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Permite um caminho restrito de recuperação por reinstalação de plugin incluído quando a configuração é inválida.                                                                                                |
| `openclaw.install.requiredPlatformPackages`                                                | Aliases de pacotes npm que devem ser materializados quando suas restrições de plataforma no lockfile correspondem ao host atual.                                                                                 |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Permite que as superfícies de canal do runtime de configuração sejam carregadas antes da escuta e, em seguida, adia o plugin completo do canal configurado até a ativação posterior ao início da escuta.           |

Os metadados do manifesto determinam quais opções de provedor/canal/configuração aparecem na integração inicial antes do carregamento do runtime. `package.json#openclaw.install` informa à integração inicial como obter ou habilitar esse plugin quando o usuário escolhe uma dessas opções. Não mova as indicações de instalação para `openclaw.plugin.json`.

`openclaw.install.minHostVersion` é aplicado durante a instalação e o carregamento do registro de manifestos para fontes de plugins não incluídos. Valores inválidos são rejeitados; valores mais recentes, porém válidos, fazem com que plugins externos sejam ignorados em hosts mais antigos. Presume-se que os plugins incluídos no código-fonte tenham a mesma versão do checkout do host.

`openclaw.install.requiredPlatformPackages` destina-se a pacotes npm que expõem binários nativos obrigatórios por meio de aliases opcionais específicos de plataforma. Liste o nome básico do pacote npm para cada alias de plataforma compatível. Durante a instalação pelo npm, o OpenClaw verifica apenas o alias declarado cujas restrições no lockfile correspondem ao host atual. Se o npm informar sucesso, mas omitir esse alias, o OpenClaw tenta novamente uma vez com um cache novo e reverte a instalação se o alias continuar ausente.

`openclaw.compat.pluginApi` é aplicado durante a instalação de pacotes para fontes de plugins não incluídos. Use-o para definir o limite inferior da API do SDK/runtime de plugins do OpenClaw para a qual o pacote foi compilado. Ele pode ser mais restritivo que `minHostVersion` quando um pacote de plugin exige uma API mais recente, mas ainda mantém uma indicação de instalação inferior para outros fluxos. Por padrão, a sincronização oficial de versões do OpenClaw eleva os limites inferiores existentes da API dos plugins oficiais para a versão de lançamento do OpenClaw, mas versões exclusivas de plugins podem manter um limite inferior quando o pacote oferece suporte intencional a hosts mais antigos. Não use apenas a versão do pacote como contrato de compatibilidade. `peerDependencies.openclaw` continua sendo um metadado de pacote npm; o OpenClaw usa o contrato `openclaw.compat.pluginApi` para decisões de compatibilidade de instalação.

Os metadados oficiais de instalação sob demanda devem usar `clawhubSpec` quando o plugin estiver publicado no ClawHub; a integração inicial trata essa opção como a fonte remota preferencial e registra os dados do artefato do ClawHub após a instalação. `npmSpec` continua sendo a alternativa de compatibilidade para pacotes que ainda não migraram para o ClawHub.

A fixação exata da versão npm já fica em `npmSpec`, por exemplo, `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. As entradas oficiais do catálogo externo devem combinar especificações exatas com `expectedIntegrity`, para que os fluxos de atualização falhem de forma segura se o artefato npm obtido deixar de corresponder à versão fixada. A integração inicial interativa ainda oferece especificações npm de registros confiáveis, incluindo nomes básicos de pacotes e dist-tags, para compatibilidade. Os diagnósticos do catálogo podem distinguir fontes exatas, flutuantes, fixadas por integridade, sem integridade, com incompatibilidade de nome de pacote e com escolha padrão inválida. Eles também alertam quando `expectedIntegrity` está presente, mas não há uma fonte npm válida à qual ele possa ser vinculado. Quando `expectedIntegrity` está presente, os fluxos de instalação/atualização o aplicam; quando é omitido, a resolução do registro é gravada sem uma fixação de integridade.

Os plugins de canal devem fornecer `openclaw.setupEntry` quando as verificações de status, a lista de canais ou as varreduras de SecretRef precisarem identificar contas configuradas sem carregar o runtime completo. O ponto de entrada de configuração deve expor metadados do canal, além de adaptadores seguros para configuração, status e segredos; mantenha clientes de rede, listeners do Gateway e runtimes de transporte no ponto de entrada principal da extensão.

Os campos de ponto de entrada do runtime não substituem as verificações dos limites do pacote para campos de ponto de entrada do código-fonte. Por exemplo, `openclaw.runtimeExtensions` não pode tornar carregável um caminho de `openclaw.extensions` que saia desses limites.

`openclaw.install.allowInvalidConfigRecovery` é intencionalmente restrito. Ele não permite a instalação de configurações arbitrariamente inválidas. Atualmente, ele só permite que os fluxos de instalação se recuperem de falhas específicas e obsoletas de atualização de plugins incluídos, como um caminho ausente de plugin incluído ou uma entrada `channels.<id>` obsoleta referente ao mesmo plugin incluído. Erros de configuração não relacionados ainda bloqueiam a instalação e direcionam os operadores para `openclaw doctor --fix`.

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

Use-o quando fluxos de configuração, Doctor, status ou presença somente leitura precisarem de uma verificação simples de autenticação, com resposta sim/não, antes que o plugin completo do canal seja carregado. O estado de autenticação persistida não é o estado configurado do canal: não use esses metadados para habilitar plugins automaticamente, reparar dependências de runtime ou decidir se o runtime de um canal deve ser carregado. A exportação de destino deve ser uma pequena função que leia apenas o estado persistido; não a encaminhe pelo barrel completo do runtime do canal.

`openclaw.channel.configuredState` segue a mesma estrutura para verificações simples de estado configurado somente por variáveis de ambiente:

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

Use-o quando um canal puder determinar o estado configurado com base em variáveis de ambiente ou outras entradas pequenas que não pertençam ao runtime. Se a verificação exigir a resolução completa da configuração ou o runtime real do canal, mantenha essa lógica no hook `config.hasConfiguredState` do plugin.

## Precedência da descoberta (IDs de plugins duplicados)

O OpenClaw descobre plugins em três raízes, verificadas nesta ordem: plugins incluídos distribuídos com o OpenClaw, a raiz global de instalação (`~/.openclaw/extensions`) e a raiz do espaço de trabalho atual (`<workspace>/.openclaw/extensions`), além de quaisquer entradas explícitas em `plugins.load.paths`.

Se duas descobertas compartilharem o mesmo `id`, apenas o manifesto de **maior precedência** será mantido; as duplicatas de menor precedência serão descartadas em vez de serem carregadas ao lado dele. Precedência, da maior para a menor:

1. **Selecionado pela configuração** — um caminho fixado explicitamente em `plugins.entries.<id>`
2. **Instalação global correspondente a um registro de instalação rastreado** — um plugin instalado por meio de `openclaw plugin install`/`openclaw plugin update` que o rastreamento de instalações do OpenClaw reconhece para o mesmo ID, mesmo quando o ID também pertence a um plugin incluído
3. **Incluído** — plugins distribuídos com o OpenClaw
4. **Espaço de trabalho** — plugins descobertos em relação ao espaço de trabalho atual
5. Qualquer outro candidato descoberto

Implicações:

- Uma cópia bifurcada ou obsoleta de um plugin incluído, presente sem rastreamento no espaço de trabalho ou na raiz global, não substituirá a compilação incluída.
- Para substituir um plugin incluído, execute `openclaw plugin install` para esse ID, de modo que a instalação global rastreada tenha precedência sobre a cópia incluída, ou fixe um caminho específico por meio de `plugins.entries.<id>`, para que ele prevaleça pela precedência de seleção por configuração.
- Os descartes de duplicatas são registrados para que o Doctor e os diagnósticos de inicialização possam indicar a cópia descartada.
- As substituições de duplicatas selecionadas pela configuração são descritas como substituições explícitas nos diagnósticos, mas ainda geram alertas para que bifurcações obsoletas e sombreamentos acidentais continuem visíveis.

## Requisitos do JSON Schema

- **Todo plugin deve incluir um JSON Schema**, mesmo que não aceite nenhuma configuração.
- Um schema vazio é aceitável (por exemplo, `{ "type": "object", "additionalProperties": false }`).
- Os schemas são validados durante a leitura/gravação da configuração, não em tempo de execução.
- Ao estender ou criar um fork de um plugin integrado com novas chaves de configuração, atualize também o `configSchema` no `openclaw.plugin.json` desse plugin. Os schemas de plugins integrados são estritos; portanto, adicionar `plugins.entries.<id>.config.myNewKey` à configuração do usuário sem adicionar `myNewKey` a `configSchema.properties` será rejeitado antes que o runtime do plugin seja carregado.

Exemplo de extensão do schema:

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
- Uma referência a um ID de plugin desconhecido em `plugins.slots.memory` é um **erro**, exceto para o plugin externo oficial conhecido `memory-lancedb`, que gera um aviso.
- Se um plugin estiver instalado, mas tiver um manifesto ou schema ausente ou inválido, a validação falhará, e o Doctor informará o erro do plugin.
- Se houver configuração para o plugin, mas ele estiver **desativado**, a configuração será mantida, e um **aviso** será exibido no Doctor e nos logs.

Consulte a [referência de configuração](/pt-BR/gateway/configuration) para ver o schema completo de `plugins.*`.

## Observações

- O manifesto é **obrigatório para plugins nativos do OpenClaw**, incluindo carregamentos do sistema de arquivos local. O runtime ainda carrega o módulo do plugin separadamente; o manifesto serve apenas para descoberta e validação.
- Os manifestos nativos são analisados como JSON5; portanto, comentários, vírgulas finais e chaves sem aspas são aceitos, desde que o valor final continue sendo um objeto.
- Somente os campos documentados do manifesto são lidos pelo carregador de manifestos. Evite chaves personalizadas no nível superior.
- `channels`, `providers`, `cliBackends` e `skills` podem ser omitidos quando um plugin não precisar deles.
- `providerCatalogEntry` deve permanecer leve e não deve importar grandes partes do código do runtime; use-o para metadados estáticos do catálogo de provedores ou descritores de descoberta específicos, não para execução durante solicitações.
- Tipos exclusivos de plugin são selecionados por meio de `plugins.slots.*`: `kind: "memory"` via `plugins.slots.memory` (padrão: `memory-core`) e `kind: "context-engine"` via `plugins.slots.contextEngine` (padrão: `legacy`).
- Declare o tipo exclusivo do plugin neste manifesto. `OpenClawPluginDefinition.kind` da entrada do runtime está obsoleto e permanece apenas como fallback de compatibilidade para plugins mais antigos.
- Os metadados de variáveis de ambiente (`setup.providers[].envVars`, o obsoleto `providerAuthEnvVars` e `channelEnvVars`) são apenas declarativos. Status, auditoria, validação da entrega por cron e outras superfícies somente leitura ainda aplicam a confiança do plugin e a política de ativação efetiva antes de considerar uma variável de ambiente como configurada.
- Para metadados do assistente de runtime que exigem código do provedor, consulte [hooks de runtime do provedor](/pt-BR/plugins/architecture-internals#provider-runtime-hooks).
- Se o plugin depender de módulos nativos, documente as etapas de compilação e todos os requisitos da lista de permissões do gerenciador de pacotes (por exemplo, `allow-build-scripts` do pnpm + `pnpm rebuild <package>`).

## Conteúdo relacionado

<CardGroup cols={3}>
  <Card title="Como criar plugins" href="/pt-BR/plugins/building-plugins" icon="rocket">
    Primeiros passos com plugins.
  </Card>
  <Card title="Arquitetura de plugins" href="/pt-BR/plugins/architecture" icon="diagram-project">
    Arquitetura interna e modelo de capacidades.
  </Card>
  <Card title="Visão geral do SDK" href="/pt-BR/plugins/sdk-overview" icon="book">
    Referência do SDK de plugins e importações de subcaminhos.
  </Card>
</CardGroup>
