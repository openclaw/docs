---
read_when:
    - Você está criando um Plugin do OpenClaw
    - Você precisa enviar um esquema de configuração de Plugin ou depurar erros de validação de Plugin
summary: Manifesto do Plugin + requisitos de esquema JSON (validação rigorosa da configuração)
title: Manifesto do Plugin
x-i18n:
    generated_at: "2026-05-02T20:51:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2988275b976df8b883a4042ee389197e617d50e63f5a478ce248e7a643bb12fb
    source_path: plugins/manifest.md
    workflow: 16
---

Esta página é apenas para o **manifesto nativo de Plugin do OpenClaw**.

Para layouts de pacotes compatíveis, consulte [Pacotes de Plugin](/pt-BR/plugins/bundles).

Formatos de pacote compatíveis usam arquivos de manifesto diferentes:

- Pacote Codex: `.codex-plugin/plugin.json`
- Pacote Claude: `.claude-plugin/plugin.json` ou o layout padrão de componente do Claude
  sem um manifesto
- Pacote Cursor: `.cursor-plugin/plugin.json`

O OpenClaw também detecta automaticamente esses layouts de pacote, mas eles não são validados
contra o esquema `openclaw.plugin.json` descrito aqui.

Para pacotes compatíveis, o OpenClaw atualmente lê metadados do pacote mais raízes de
Skills declaradas, raízes de comandos do Claude, padrões de `settings.json` do pacote Claude,
padrões de LSP do pacote Claude e pacotes de hooks compatíveis quando o layout corresponde
às expectativas de runtime do OpenClaw.

Todo Plugin nativo do OpenClaw **deve** incluir um arquivo `openclaw.plugin.json` na
**raiz do plugin**. O OpenClaw usa este manifesto para validar a configuração
**sem executar código do plugin**. Manifestos ausentes ou inválidos são tratados como
erros de plugin e bloqueiam a validação de configuração.

Consulte o guia completo do sistema de plugins: [Plugins](/pt-BR/tools/plugin).
Para o modelo nativo de capacidades e as orientações atuais de compatibilidade externa:
[Modelo de capacidades](/pt-BR/plugins/architecture#public-capability-model).

## O que este arquivo faz

`openclaw.plugin.json` são os metadados que o OpenClaw lê **antes de carregar seu
código do plugin**. Tudo abaixo deve ser barato o suficiente para inspecionar sem iniciar
o runtime do plugin.

**Use para:**

- identidade do plugin, validação de configuração e dicas de IU de configuração
- metadados de autenticação, onboarding e configuração inicial (alias, ativação automática, variáveis de ambiente do provedor, opções de autenticação)
- dicas de ativação para superfícies do plano de controle
- propriedade abreviada de famílias de modelos
- snapshots estáticos de propriedade de capacidades (`contracts`)
- metadados do executor de QA que o host compartilhado `openclaw qa` pode inspecionar
- metadados de configuração específicos do canal mesclados ao catálogo e às superfícies de validação

**Não use para:** registrar comportamento de runtime, declarar entrypoints de código
ou metadados de instalação npm. Eles pertencem ao seu código do plugin e ao `package.json`.

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

## Exemplo avançado

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

| Campo                                | Obrigatório | Tipo                             | O que significa                                                                                                                                                                                                                       |
| ------------------------------------ | ----------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Sim         | `string`                         | ID canônico do plugin. Este é o ID usado em `plugins.entries.<id>`.                                                                                                                                                                 |
| `configSchema`                       | Sim         | `object`                         | JSON Schema embutido para a configuração deste plugin.                                                                                                                                                                                        |
| `enabledByDefault`                   | Não         | `true`                           | Marca um plugin incluído como habilitado por padrão. Omita-o, ou defina qualquer valor diferente de `true`, para deixar o plugin desabilitado por padrão.                                                                                                        |
| `legacyPluginIds`                    | Não         | `string[]`                       | IDs legados que são normalizados para este ID canônico de plugin.                                                                                                                                                                              |
| `autoEnableWhenConfiguredProviders`  | Não         | `string[]`                       | IDs de provedores que devem habilitar automaticamente este plugin quando autenticação, configuração ou referências de modelo os mencionarem.                                                                                                                                     |
| `kind`                               | Não         | `"memory"` \| `"context-engine"` | Declara um tipo exclusivo de plugin usado por `plugins.slots.*`.                                                                                                                                                                        |
| `channels`                           | Não         | `string[]`                       | IDs de canais pertencentes a este plugin. Usado para descoberta e validação de configuração.                                                                                                                                                         |
| `providers`                          | Não         | `string[]`                       | IDs de provedores pertencentes a este plugin.                                                                                                                                                                                                  |
| `providerDiscoveryEntry`             | Não         | `string`                         | Caminho leve do módulo de descoberta de provedores, relativo à raiz do plugin, para metadados de catálogo de provedores com escopo de manifesto que podem ser carregados sem ativar o runtime completo do plugin.                                               |
| `modelSupport`                       | Não         | `object`                         | Metadados abreviados de famílias de modelos pertencentes ao manifesto, usados para carregar automaticamente o plugin antes do runtime.                                                                                                                                         |
| `modelCatalog`                       | Não         | `object`                         | Metadados declarativos de catálogo de modelos para provedores pertencentes a este plugin. Este é o contrato de plano de controle para listagem futura somente leitura, onboarding, seletores de modelo, aliases e supressão sem carregar o runtime do plugin.         |
| `modelPricing`                       | Não         | `object`                         | Política de consulta de preços externos pertencente ao provedor. Use-a para excluir provedores locais/auto-hospedados de catálogos remotos de preços ou mapear referências de provedores para IDs de catálogo do OpenRouter/LiteLLM sem codificar IDs de provedores no core.             |
| `modelIdNormalization`               | Não         | `object`                         | Limpeza de alias/prefixo de IDs de modelo pertencente ao provedor que deve ser executada antes que o runtime do provedor seja carregado.                                                                                                                                           |
| `providerEndpoints`                  | Não         | `object[]`                       | Metadados de host/baseUrl de endpoint pertencentes ao manifesto para rotas de provedor que o core deve classificar antes que o runtime do provedor seja carregado.                                                                                                            |
| `providerRequest`                    | Não         | `object`                         | Metadados baratos de família de provedor e compatibilidade de requisição usados pela política genérica de requisição antes que o runtime do provedor seja carregado.                                                                                                              |
| `cliBackends`                        | Não         | `string[]`                       | IDs de backends de inferência da CLI pertencentes a este plugin. Usado para autoativação na inicialização a partir de referências explícitas de configuração.                                                                                                                         |
| `syntheticAuthRefs`                  | Não         | `string[]`                       | Referências de provedor ou backend da CLI cujo hook de autenticação sintética pertencente ao plugin deve ser sondado durante a descoberta fria de modelos antes que o runtime seja carregado.                                                                                              |
| `nonSecretAuthMarkers`               | Não         | `string[]`                       | Valores de chave de API de placeholder pertencentes ao plugin incluído que representam estado de credenciais locais, OAuth ou ambientes que não são secretos.                                                                                                                |
| `commandAliases`                     | Não         | `object[]`                       | Nomes de comandos pertencentes a este plugin que devem produzir diagnósticos de configuração e CLI cientes do plugin antes que o runtime seja carregado.                                                                                                                |
| `providerAuthEnvVars`                | Não         | `Record<string, string[]>`       | Metadados de env de compatibilidade obsoletos para consulta de autenticação/status de provedor. Prefira `setup.providers[].envVars` para novos plugins; o OpenClaw ainda lê isto durante a janela de descontinuação.                                                 |
| `providerAuthAliases`                | Não         | `Record<string, string>`         | IDs de provedores que devem reutilizar outro ID de provedor para consulta de autenticação, por exemplo um provedor de codificação que compartilha a chave de API e os perfis de autenticação do provedor base.                                                                          |
| `channelEnvVars`                     | Não         | `Record<string, string[]>`       | Metadados baratos de env de canal que o OpenClaw pode inspecionar sem carregar código do plugin. Use isto para configuração de canal orientada por env ou superfícies de autenticação que auxiliares genéricos de inicialização/configuração devem ver.                                            |
| `providerAuthChoices`                | Não         | `object[]`                       | Metadados baratos de opções de autenticação para seletores de onboarding, resolução de provedor preferido e ligação simples de flags da CLI.                                                                                                                       |
| `activation`                         | Não         | `object`                         | Metadados baratos do planejador de ativação para carregamento acionado por inicialização, provedor, comando, canal, rota e capacidade. Apenas metadados; o runtime do plugin ainda é dono do comportamento real.                                                       |
| `setup`                              | Não         | `object`                         | Descritores baratos de configuração/onboarding que superfícies de descoberta e configuração podem inspecionar sem carregar o runtime do plugin.                                                                                                                    |
| `qaRunners`                          | Não         | `object[]`                       | Descritores baratos de executores de QA usados pelo host compartilhado `openclaw qa` antes que o runtime do plugin seja carregado.                                                                                                                                      |
| `contracts`                          | Não         | `object`                         | Snapshot estático de propriedade de capacidades para hooks de autenticação externa, fala, transcrição em tempo real, voz em tempo real, compreensão de mídia, geração de imagens, geração de música, geração de vídeo, busca na web, pesquisa na web e propriedade de ferramentas. |
| `mediaUnderstandingProviderMetadata` | Não         | `Record<string, object>`         | Padrões baratos de compreensão de mídia para IDs de provedores declarados em `contracts.mediaUnderstandingProviders`.                                                                                                                            |
| `imageGenerationProviderMetadata`    | Não         | `Record<string, object>`         | Metadados baratos de autenticação de geração de imagens para IDs de provedores declarados em `contracts.imageGenerationProviders`, incluindo aliases de autenticação pertencentes ao provedor e proteções de URL base.                                                                  |
| `videoGenerationProviderMetadata`    | Não         | `Record<string, object>`         | Metadados baratos de autenticação de geração de vídeo para IDs de provedores declarados em `contracts.videoGenerationProviders`, incluindo aliases de autenticação pertencentes ao provedor e proteções de URL base.                                                                  |
| `musicGenerationProviderMetadata`    | Não         | `Record<string, object>`         | Metadados baratos de autenticação de geração de música para IDs de provedores declarados em `contracts.musicGenerationProviders`, incluindo aliases de autenticação pertencentes ao provedor e proteções de URL base.                                                                  |
| `toolMetadata`                       | Não         | `Record<string, object>`         | Metadados baratos de disponibilidade para ferramentas pertencentes ao plugin declaradas em `contracts.tools`. Use-os quando uma ferramenta não deve carregar o runtime a menos que existam evidências de configuração, env ou autenticação.                                                           |
| `channelConfigs`                     | Não         | `Record<string, object>`         | Metadados de configuração de canal pertencentes ao manifesto mesclados em superfícies de descoberta e validação antes que o runtime seja carregado.                                                                                                                          |
| `skills`                             | Não         | `string[]`                       | Diretórios de Skills a carregar, relativos à raiz do plugin.                                                                                                                                                                             |
| `name`                               | Não         | `string`                         | Nome do plugin legível por humanos.                                                                                                                                                                                                         |
| `description`                        | Não      | `string`                         | Resumo curto exibido em superfícies de Plugin.                                                                                                                                                                                      |
| `version`                            | Não      | `string`                         | Versão informativa do Plugin.                                                                                                                                                                                                       |
| `uiHints`                            | Não      | `Record<string, object>`         | Rótulos de UI, placeholders e dicas de sensibilidade para campos de configuração.                                                                                                                                                   |

## Referência de metadados de provedor de geração

Os campos de metadados do provedor de geração descrevem sinais de autenticação estáticos para
provedores declarados na lista `contracts.*GenerationProviders` correspondente.
O OpenClaw lê esses campos antes do carregamento do runtime do provedor para que as ferramentas centrais possam
decidir se um provedor de geração está disponível sem importar todos os
plugins de provedor.

Use esses campos apenas para fatos baratos e declarativos. Transporte, transformações de
requisição, renovação de token, validação de credenciais e comportamento real de geração
permanecem no runtime do plugin.

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
| `aliases`       | Não         | `string[]` | IDs de provedor adicionais que devem contar como aliases estáticos de autenticação para o provedor de geração.                        |
| `authProviders` | Não         | `string[]` | IDs de provedor cujos perfis de autenticação configurados devem contar como autenticação para este provedor de geração.               |
| `configSignals` | Não         | `object[]` | Sinais baratos de disponibilidade somente por configuração para provedores locais ou auto-hospedados que podem ser configurados sem perfis de autenticação ou variáveis de ambiente. |
| `authSignals`   | Não         | `object[]` | Sinais de autenticação explícitos. Quando presentes, substituem o conjunto de sinais padrão do ID do provedor, de `aliases` e de `authProviders`. |

Cada entrada de `configSignals` aceita:

| Campo         | Obrigatório | Tipo       | O que significa                                                                                                                                                                           |
| ------------- | ----------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | Sim         | `string`   | Caminho por pontos para o objeto de configuração pertencente ao plugin a ser inspecionado, por exemplo `plugins.entries.example.config`.                                                   |
| `overlayPath` | Não         | `string`   | Caminho por pontos dentro da configuração raiz cujo objeto deve sobrepor o objeto raiz antes de avaliar o sinal. Use isto para configuração específica de capacidade, como `image`, `video` ou `music`. |
| `required`    | Não         | `string[]` | Caminhos por pontos dentro da configuração efetiva que devem ter valores configurados. Strings não podem estar vazias; objetos e arrays não podem estar vazios.                            |
| `requiredAny` | Não         | `string[]` | Caminhos por pontos dentro da configuração efetiva em que pelo menos um deve ter um valor configurado.                                                                                     |
| `mode`        | Não         | `object`   | Guarda opcional de modo string dentro da configuração efetiva. Use isto quando a disponibilidade somente por configuração se aplicar apenas a um modo.                                      |

Cada guarda de `mode` aceita:

| Campo        | Obrigatório | Tipo       | O que significa                                                                     |
| ------------ | ----------- | ---------- | ----------------------------------------------------------------------------------- |
| `path`       | Não         | `string`   | Caminho por pontos dentro da configuração efetiva. O padrão é `mode`.               |
| `default`    | Não         | `string`   | Valor de modo a ser usado quando a configuração omite o caminho.                    |
| `allowed`    | Não         | `string[]` | Se presente, o sinal passa apenas quando o modo efetivo é um destes valores.        |
| `disallowed` | Não         | `string[]` | Se presente, o sinal falha quando o modo efetivo é um destes valores.               |

Cada entrada de `authSignals` aceita:

| Campo             | Obrigatório | Tipo     | O que significa                                                                                                                                                                 |
| ----------------- | ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sim         | `string` | ID do provedor a verificar nos perfis de autenticação configurados.                                                                                                             |
| `providerBaseUrl` | Não         | `object` | Guarda opcional que faz o sinal contar apenas quando o provedor configurado referenciado usa uma URL base permitida. Use isto quando um alias de autenticação é válido apenas para determinadas APIs. |

Cada guarda de `providerBaseUrl` aceita:

| Campo             | Obrigatório | Tipo       | O que significa                                                                                                                                       |
| ----------------- | ----------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sim         | `string`   | ID de configuração do provedor cujo `baseUrl` deve ser verificado.                                                                                    |
| `defaultBaseUrl`  | Não         | `string`   | URL base a assumir quando a configuração do provedor omite `baseUrl`.                                                                                 |
| `allowedBaseUrls` | Sim         | `string[]` | URLs base permitidas para este sinal de autenticação. O sinal é ignorado quando a URL base configurada ou padrão não corresponde a um destes valores normalizados. |

## Referência de metadados de ferramenta

`toolMetadata` usa os mesmos formatos de `configSignals` e `authSignals` que os
metadados de provedor de geração, indexados por nome de ferramenta. `contracts.tools` declara
propriedade. `toolMetadata` declara evidência barata de disponibilidade para que o OpenClaw possa
evitar importar o runtime de um plugin apenas para que sua fábrica de ferramentas retorne `null`.

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
carrega o plugin proprietário quando o contrato da ferramenta corresponde à política. Para ferramentas de caminho crítico
cuja fábrica depende de autenticação/configuração, autores de plugin devem declarar
`toolMetadata` em vez de fazer o núcleo importar o runtime para perguntar.

## Referência de providerAuthChoices

Cada entrada de `providerAuthChoices` descreve uma opção de integração ou autenticação.
O OpenClaw lê isto antes que o runtime do provedor seja carregado.
As listas de configuração de provedor usam essas opções de manifesto, opções de configuração
derivadas de descritor e metadados de catálogo de instalação sem carregar o runtime do provedor.

| Campo                 | Obrigatório | Tipo                                            | O que significa                                                                                            |
| --------------------- | ----------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `provider`            | Sim         | `string`                                        | ID do provedor ao qual esta opção pertence.                                                                |
| `method`              | Sim         | `string`                                        | ID do método de autenticação para despacho.                                                                |
| `choiceId`            | Sim         | `string`                                        | ID estável da opção de autenticação usado por fluxos de onboarding e CLI.                                  |
| `choiceLabel`         | Não         | `string`                                        | Rótulo voltado ao usuário. Se omitido, o OpenClaw usa `choiceId` como fallback.                            |
| `choiceHint`          | Não         | `string`                                        | Texto curto de ajuda para o seletor.                                                                       |
| `assistantPriority`   | Não         | `number`                                        | Valores menores são ordenados antes em seletores interativos conduzidos pelo assistente.                   |
| `assistantVisibility` | Não         | `"visible"` \| `"manual-only"`                  | Oculta a opção de seletores do assistente enquanto ainda permite seleção manual pela CLI.                  |
| `deprecatedChoiceIds` | Não         | `string[]`                                      | IDs de opção legados que devem redirecionar usuários para esta opção substituta.                           |
| `groupId`             | Não         | `string`                                        | ID de grupo opcional para agrupar opções relacionadas.                                                     |
| `groupLabel`          | Não         | `string`                                        | Rótulo voltado ao usuário para esse grupo.                                                                 |
| `groupHint`           | Não         | `string`                                        | Texto curto de ajuda para o grupo.                                                                         |
| `optionKey`           | Não         | `string`                                        | Chave de opção interna para fluxos simples de autenticação com uma única flag.                             |
| `cliFlag`             | Não         | `string`                                        | Nome da flag da CLI, como `--openrouter-api-key`.                                                          |
| `cliOption`           | Não         | `string`                                        | Formato completo da opção da CLI, como `--openrouter-api-key <key>`.                                       |
| `cliDescription`      | Não         | `string`                                        | Descrição usada na ajuda da CLI.                                                                           |
| `onboardingScopes`    | Não         | `Array<"text-inference" \| "image-generation">` | Em quais superfícies de onboarding esta opção deve aparecer. Se omitido, o padrão é `["text-inference"]`. |

## Referência de commandAliases

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

| Campo        | Obrigatório | Tipo              | O que significa                                                           |
| ------------ | ----------- | ----------------- | ------------------------------------------------------------------------- |
| `name`       | Sim         | `string`          | Nome do comando que pertence a este plugin.                               |
| `kind`       | Não         | `"runtime-slash"` | Marca o alias como um comando de barra de chat, em vez de um comando raiz da CLI. |
| `cliCommand` | Não         | `string`          | Comando raiz da CLI relacionado a sugerir para operações de CLI, se existir.  |

## referência de activation

Use `activation` quando o plugin puder declarar de forma barata quais eventos do plano de controle
devem incluí-lo em um plano de ativação/carregamento.

Este bloco é metadados do planejador, não uma API de ciclo de vida. Ele não registra
comportamento de runtime, não substitui `register(...)` e não promete que
o código do plugin já foi executado. O planejador de ativação usa estes campos para
restringir plugins candidatos antes de recorrer aos metadados existentes de propriedade do manifesto,
como `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` e hooks.

Prefira os metadados mais restritos que já descrevem a propriedade. Use
`providers`, `channels`, `commandAliases`, descritores de setup ou `contracts`
quando esses campos expressarem a relação. Use `activation` para dicas extras do planejador
que não podem ser representadas por esses campos de propriedade.
Use `cliBackends` de nível superior para aliases de runtime da CLI, como `claude-cli`,
`codex-cli` ou `google-gemini-cli`; `activation.onAgentHarnesses` é apenas para
ids de harness de agente incorporado que ainda não têm um campo de propriedade.

Este bloco é apenas metadados. Ele não registra comportamento de runtime e não
substitui `register(...)`, `setupEntry` ou outros pontos de entrada de runtime/plugin.
Os consumidores atuais o usam como uma dica de restrição antes de um carregamento mais amplo de plugins, portanto
metadados de ativação não relacionados à inicialização ausentes geralmente só custam desempenho; eles
não devem alterar a correção enquanto ainda existirem fallbacks de propriedade do manifesto.

Todo plugin deve definir `activation.onStartup` intencionalmente. Defina como `true`
somente quando o plugin precisar executar durante a inicialização do Gateway. Defina como `false` quando
o plugin estiver inerte na inicialização e deve carregar apenas a partir de gatilhos mais restritos.
Omitir `onStartup` não faz mais o plugin ser carregado implicitamente na inicialização; use metadados de
ativação explícitos para gatilhos de inicialização, canal, configuração, harness de agente, memória ou
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
| ------------------ | ----------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Não         | `boolean`                                            | Ativação explícita na inicialização do Gateway. Todo plugin deve definir isto. `true` importa o plugin durante a inicialização; `false` o mantém lazy na inicialização, a menos que outro gatilho correspondente exija carregamento. |
| `onProviders`      | Não         | `string[]`                                           | IDs de provedores que devem incluir este plugin em planos de ativação/carregamento.                                                                                                           |
| `onAgentHarnesses` | Não         | `string[]`                                           | IDs de runtime de harnesses de agente incorporados que devem incluir este plugin em planos de ativação/carregamento. Use `cliBackends` de nível superior para aliases de backend da CLI.      |
| `onCommands`       | Não         | `string[]`                                           | IDs de comandos que devem incluir este plugin em planos de ativação/carregamento.                                                                                                             |
| `onChannels`       | Não         | `string[]`                                           | IDs de canais que devem incluir este plugin em planos de ativação/carregamento.                                                                                                               |
| `onRoutes`         | Não         | `string[]`                                           | Tipos de rota que devem incluir este plugin em planos de ativação/carregamento.                                                                                                               |
| `onConfigPaths`    | Não         | `string[]`                                           | Caminhos de configuração relativos à raiz que devem incluir este plugin em planos de inicialização/carregamento quando o caminho estiver presente e não explicitamente desabilitado.           |
| `onCapabilities`   | Não         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Dicas amplas de capacidade usadas pelo planejamento de ativação do plano de controle. Prefira campos mais restritos quando possível.                                                          |

Consumidores ativos atuais:

- O planejamento de inicialização do Gateway usa `activation.onStartup` para importação
  explícita na inicialização
- O planejamento da CLI acionado por comandos recorre ao legado
  `commandAliases[].cliCommand` ou `commandAliases[].name`
- O planejamento de inicialização do runtime de agente usa `activation.onAgentHarnesses` para
  harnesses incorporados e `cliBackends[]` de nível superior para aliases de runtime da CLI
- O planejamento de setup/canal acionado por canal recorre à propriedade legada de `channels[]`
  quando metadados explícitos de ativação de canal estão ausentes
- O planejamento de plugins de inicialização usa `activation.onConfigPaths` para superfícies raiz de
  configuração que não são de canal, como o bloco `browser` do plugin de navegador incluído
- O planejamento de setup/runtime acionado por provedor recorre à propriedade legada de
  `providers[]` e `cliBackends[]` de nível superior quando metadados explícitos de ativação de provedor
  estão ausentes

Os diagnósticos do planejador podem distinguir dicas explícitas de ativação de fallbacks de
propriedade do manifesto. Por exemplo, `activation-command-hint` significa que
`activation.onCommands` correspondeu, enquanto `manifest-command-alias` significa que o
planejador usou a propriedade de `commandAliases` em vez disso. Esses rótulos de motivo são para
diagnósticos do host e testes; autores de plugins devem continuar declarando os metadados
que melhor descrevem a propriedade.

## referência de qaRunners

Use `qaRunners` quando um plugin contribuir com um ou mais runners de transporte abaixo
da raiz compartilhada `openclaw qa`. Mantenha estes metadados baratos e estáticos; o runtime
do plugin ainda possui o registro real da CLI por meio de uma superfície leve
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

Use `setup` quando superfícies de setup e onboarding precisarem de metadados baratos pertencentes ao plugin
antes dos carregamentos de runtime.

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

`cliBackends` de nível superior permanece válido e continua descrevendo backends de inferência da CLI.
`setup.cliBackends` é a superfície de descritor específica de setup para
fluxos de plano de controle/setup que devem permanecer apenas como metadados.

Quando presentes, `setup.providers` e `setup.cliBackends` são a superfície preferida
de busca descriptor-first para descoberta de setup. Se o descritor apenas
restringe o plugin candidato e o setup ainda precisa de hooks de runtime mais ricos em tempo de setup,
defina `requiresRuntime: true` e mantenha `setup-api` como o
caminho de execução de fallback.

O OpenClaw também inclui `setup.providers[].envVars` em buscas genéricas de autenticação de provedor e
variáveis de ambiente. `providerAuthEnvVars` continua com suporte por meio de um adaptador de compatibilidade
durante a janela de descontinuação, mas plugins não incluídos que ainda o usam
recebem um diagnóstico de manifesto. Novos plugins devem colocar metadados de ambiente de setup/status
em `setup.providers[].envVars`.

O OpenClaw também pode derivar escolhas simples de setup a partir de `setup.providers[].authMethods`
quando nenhuma entrada de setup está disponível, ou quando `setup.requiresRuntime: false`
declara que runtime de setup é desnecessário. Entradas explícitas de `providerAuthChoices` continuam
preferidas para rótulos personalizados, flags da CLI, escopo de onboarding e metadados do assistente.

Defina `requiresRuntime: false` somente quando esses descritores forem suficientes para a
superfície de setup. O OpenClaw trata `false` explícito como um contrato apenas de descritor
e não executará `setup-api` ou `openclaw.setupEntry` para busca de setup. Se
um plugin apenas de descritor ainda entregar uma dessas entradas de runtime de setup,
o OpenClaw relata um diagnóstico aditivo e continua ignorando-a. `requiresRuntime`
omitido mantém o comportamento de fallback legado para que plugins existentes que adicionaram
descritores sem a flag não quebrem.

Como a busca de setup pode executar código `setup-api` pertencente ao plugin, valores normalizados de
`setup.providers[].id` e `setup.cliBackends[]` devem permanecer únicos em todos os
plugins descobertos. Propriedade ambígua falha de forma fechada, em vez de escolher um
vencedor pela ordem de descoberta.

Quando o runtime de setup executa, os diagnósticos do registro de setup relatam drift de descritor
se `setup-api` registra um provedor ou backend da CLI que os descritores do manifesto
não declaram, ou se um descritor não tem registro de runtime correspondente.
Esses diagnósticos são aditivos e não rejeitam plugins legados.

### referência de setup.providers

| Campo          | Obrigatório | Tipo       | O que significa                                                                                    |
| -------------- | ----------- | ---------- | -------------------------------------------------------------------------------------------------- |
| `id`           | Sim         | `string`   | ID de provedor exposto durante setup ou onboarding. Mantenha IDs normalizados globalmente únicos.  |
| `authMethods`  | Não         | `string[]` | IDs de métodos de setup/autenticação que este provedor suporta sem carregar o runtime completo.    |
| `envVars`      | Não         | `string[]` | Variáveis de ambiente que superfícies genéricas de setup/status podem verificar antes do carregamento do runtime do plugin. |
| `authEvidence` | Não         | `object[]` | Verificações baratas de evidência local de autenticação para provedores que podem autenticar por meio de marcadores não secretos. |

`authEvidence` serve para marcadores de credenciais locais pertencentes ao provedor que podem ser
verificados sem carregar código de runtime. Essas verificações devem permanecer baratas e locais:
sem chamadas de rede, sem leituras de chaveiro ou gerenciador de segredos, sem comandos de shell e sem
sondagens de API do provedor.

Entradas de evidência compatíveis:

| Campo              | Obrigatório | Tipo       | O que significa                                                                                                  |
| ------------------ | ----------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| `type`             | Sim         | `string`   | Atualmente `local-file-with-env`.                                                                               |
| `fileEnvVar`       | Não         | `string`   | Variável de ambiente que contém um caminho explícito para o arquivo de credenciais.                              |
| `fallbackPaths`    | Não         | `string[]` | Caminhos locais de arquivos de credenciais verificados quando `fileEnvVar` está ausente ou vazio. Aceita `${HOME}` e `${APPDATA}`. |
| `requiresAnyEnv`   | Não         | `string[]` | Pelo menos uma variável de ambiente listada deve estar não vazia para que a evidência seja válida.               |
| `requiresAllEnv`   | Não         | `string[]` | Todas as variáveis de ambiente listadas devem estar não vazias para que a evidência seja válida.                 |
| `credentialMarker` | Sim         | `string`   | Marcador não secreto retornado quando a evidência está presente.                                                 |
| `source`           | Não         | `string`   | Rótulo de origem voltado ao usuário para saída de autenticação/status.                                           |

### campos de setup

| Campo              | Obrigatório | Tipo       | O que significa                                                                                       |
| ------------------ | ----------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `providers`        | Não         | `object[]` | Descritores de setup de provedor expostos durante setup e onboarding.                                 |
| `cliBackends`      | Não         | `string[]` | IDs de backends em tempo de setup usados para busca de setup baseada primeiro em descritor. Mantenha IDs normalizados globalmente únicos. |
| `configMigrations` | Não         | `string[]` | IDs de migração de configuração pertencentes à superfície de setup deste plugin.                      |
| `requiresRuntime`  | Não         | `boolean`  | Se o setup ainda precisa de execução de `setup-api` após a busca por descritor.                       |

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
| `label`       | `string`   | Rótulo do campo voltado ao usuário.       |
| `help`        | `string`   | Texto curto de ajuda.                     |
| `tags`        | `string[]` | Tags opcionais de UI.                     |
| `advanced`    | `boolean`  | Marca o campo como avançado.              |
| `sensitive`   | `boolean`  | Marca o campo como secreto ou sensível.   |
| `placeholder` | `string`   | Texto de placeholder para entradas de formulário. |

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

| Campo                            | Tipo       | O que significa                                                         |
| -------------------------------- | ---------- | ----------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | IDs de fábrica de extensão do servidor de app do Codex, atualmente `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | IDs de runtime para os quais um plugin empacotado pode registrar middleware de resultado de ferramenta. |
| `externalAuthProviders`          | `string[]` | IDs de provedor cujo hook de perfil de autenticação externa este plugin possui. |
| `speechProviders`                | `string[]` | IDs de provedor de fala que este plugin possui.                         |
| `realtimeTranscriptionProviders` | `string[]` | IDs de provedor de transcrição em tempo real que este plugin possui.    |
| `realtimeVoiceProviders`         | `string[]` | IDs de provedor de voz em tempo real que este plugin possui.            |
| `memoryEmbeddingProviders`       | `string[]` | IDs de provedor de embedding de memória que este plugin possui.         |
| `mediaUnderstandingProviders`    | `string[]` | IDs de provedor de compreensão de mídia que este plugin possui.         |
| `imageGenerationProviders`       | `string[]` | IDs de provedor de geração de imagem que este plugin possui.            |
| `videoGenerationProviders`       | `string[]` | IDs de provedor de geração de vídeo que este plugin possui.             |
| `webFetchProviders`              | `string[]` | IDs de provedor de busca web que este plugin possui.                    |
| `webSearchProviders`             | `string[]` | IDs de provedor de pesquisa web que este plugin possui.                 |
| `migrationProviders`             | `string[]` | IDs de provedor de importação que este plugin possui para `openclaw migrate`. |
| `tools`                          | `string[]` | Nomes de ferramentas de agente que este plugin possui.                  |

`contracts.embeddedExtensionFactories` é mantido para fábricas de extensão empacotadas
somente do servidor de app do Codex. Transformações empacotadas de resultado de ferramenta devem
declarar `contracts.agentToolResultMiddleware` e registrar com
`api.registerAgentToolResultMiddleware(...)` em vez disso. Plugins externos não podem
registrar middleware de resultado de ferramenta porque a junção pode reescrever saída de ferramenta
de alta confiança antes que o modelo a veja.

Registros de runtime `api.registerTool(...)` devem corresponder a `contracts.tools`.
A descoberta de ferramentas usa esta lista para carregar apenas os runtimes de plugin que podem possuir as
ferramentas solicitadas.

Plugins provedores que implementam `resolveExternalAuthProfiles` devem declarar
`contracts.externalAuthProviders`. Plugins sem a declaração ainda passam
por um fallback de compatibilidade obsoleto, mas esse fallback é mais lento e
será removido após a janela de migração.

Provedores empacotados de embedding de memória devem declarar
`contracts.memoryEmbeddingProviders` para cada ID de adaptador que expõem, incluindo
adaptadores integrados como `local`. Caminhos de CLI independentes usam este contrato de manifesto
para carregar apenas o plugin proprietário antes que o runtime completo do Gateway tenha
registrado provedores.

## referência de mediaUnderstandingProviderMetadata

Use `mediaUnderstandingProviderMetadata` quando um provedor de compreensão de mídia tiver
modelos padrão, prioridade de fallback de autenticação automática ou suporte nativo a documentos de que
helpers genéricos do core precisam antes de o runtime carregar. As chaves também devem ser declaradas em
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
| `nativeDocumentInputs` | `"pdf"[]`                           | Entradas nativas de documentos compatíveis com o provedor.                     |

## referência de channelConfigs

Use `channelConfigs` quando um plugin de canal precisar de metadados de configuração baratos antes que
o runtime carregue. A descoberta somente leitura de setup/status do canal pode usar esses metadados
diretamente para canais externos configurados quando nenhuma entrada de setup está disponível, ou
quando `setup.requiresRuntime: false` declara que o runtime de setup é desnecessário.

`channelConfigs` são metadados de manifesto de plugin, não uma nova seção de configuração de usuário
de nível superior. Usuários ainda configuram instâncias de canal em `channels.<channel-id>`.
O OpenClaw lê metadados de manifesto para decidir qual plugin possui esse canal configurado
antes que o código de runtime do plugin execute.

Para um plugin de canal, `configSchema` e `channelConfigs` descrevem caminhos diferentes:

- `configSchema` valida `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valida `channels.<channel-id>`

Plugins não empacotados que declaram `channels[]` também devem declarar entradas
`channelConfigs` correspondentes. Sem elas, o OpenClaw ainda consegue carregar o plugin, mas
o esquema de configuração em caminho frio, o setup e as superfícies da Control UI não conseguem conhecer o
formato das opções pertencentes ao canal até que o runtime do plugin execute.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` e
`nativeSkillsAutoEnabled` podem declarar padrões `auto` estáticos para verificações de configuração de comando
que rodam antes que o runtime do canal carregue. Canais empacotados também podem publicar
os mesmos padrões por meio de `package.json#openclaw.channel.commands` juntamente com
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
| `uiHints`     | `Record<string, object>` | Rótulos/espaços reservados/dicas sensíveis opcionais de UI para essa seção de configuração de canal. |
| `label`       | `string`                 | Rótulo do canal mesclado nas superfícies de seleção e inspeção quando os metadados de runtime não estão prontos. |
| `description` | `string`                 | Breve descrição do canal para superfícies de inspeção e catálogo.                               |
| `commands`    | `object`                 | Comando nativo estático e padrões automáticos de skill nativa para verificações de configuração pré-runtime. |
| `preferOver`  | `string[]`               | IDs de plugins legados ou de menor prioridade que este canal deve superar nas superfícies de seleção. |

### Substituindo outro plugin de canal

Use `preferOver` quando seu plugin for o proprietário preferencial de um ID de canal que
outro plugin também pode fornecer. Casos comuns são um ID de plugin renomeado, um
plugin independente que substitui um plugin embutido, ou um fork mantido que
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

Quando `channels.chat` está configurado, o OpenClaw considera tanto o ID do canal quanto
o ID do plugin preferencial. Se o plugin de menor prioridade foi selecionado apenas porque
é embutido ou habilitado por padrão, o OpenClaw o desabilita na configuração
efetiva de runtime para que um plugin seja proprietário do canal e de suas ferramentas. A seleção
explícita do usuário ainda prevalece: se o usuário habilitar explicitamente ambos os plugins, o OpenClaw
preserva essa escolha e relata diagnósticos de canal/ferramenta duplicados em vez de
alterar silenciosamente o conjunto de plugins solicitado.

Mantenha `preferOver` restrito a IDs de plugins que realmente podem fornecer o mesmo canal.
Ele não é um campo geral de prioridade e não renomeia chaves de configuração do usuário.

## Referência de modelSupport

Use `modelSupport` quando o OpenClaw deve inferir seu plugin de provedor a partir de
IDs abreviados de modelo como `gpt-5.5` ou `claude-sonnet-4.6` antes de o runtime do plugin
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

- referências explícitas `provider/model` usam os metadados de manifesto `providers` proprietários
- `modelPatterns` têm precedência sobre `modelPrefixes`
- se um plugin não embutido e um plugin embutido corresponderem, o plugin não embutido
  prevalece
- a ambiguidade restante é ignorada até que o usuário ou a configuração especifique um provedor

Campos:

| Campo           | Tipo       | O que significa                                                                   |
| --------------- | ---------- | --------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefixos comparados com `startsWith` em IDs abreviados de modelo.                 |
| `modelPatterns` | `string[]` | Fontes regex comparadas com IDs abreviados de modelo após a remoção do sufixo de perfil. |

## Referência de modelCatalog

Use `modelCatalog` quando o OpenClaw deve conhecer metadados de modelos do provedor antes de
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
| -------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Linhas de catálogo para IDs de provedor pertencentes a este plugin. As chaves também devem aparecer em `providers` de nível superior. |
| `aliases`      | `Record<string, object>`                                 | Aliases de provedor que devem ser resolvidos para um provedor proprietário para planejamento de catálogo ou supressão. |
| `suppressions` | `object[]`                                               | Linhas de modelo de outra fonte que este plugin suprime por um motivo específico do provedor.                  |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Se o catálogo do provedor pode ser lido dos metadados do manifesto, atualizado no cache ou requer runtime. |

`aliases` participa da busca de propriedade do provedor para planejamento do catálogo de modelos.
Os alvos de alias devem ser provedores de nível superior pertencentes ao mesmo plugin. Quando uma
lista filtrada por provedor usa um alias, o OpenClaw pode ler o manifesto proprietário e
aplicar substituições de API/URL base do alias sem carregar o runtime do provedor.
Aliases não expandem listagens de catálogo não filtradas; listas amplas emitem apenas as linhas do
provedor canônico proprietário.

`suppressions` substitui o antigo hook `suppressBuiltInModel` do runtime do provedor.
As entradas de supressão são honradas apenas quando o provedor pertence ao plugin ou
é declarado como uma chave `modelCatalog.aliases` que aponta para um provedor proprietário. Hooks de
supressão em runtime não são mais chamados durante a resolução de modelos.

Campos do provedor:

| Campo     | Tipo                     | O que significa                                                     |
| --------- | ------------------------ | ------------------------------------------------------------------- |
| `baseUrl` | `string`                 | URL base padrão opcional para modelos neste catálogo de provedor.    |
| `api`     | `ModelApi`               | Adaptador de API padrão opcional para modelos neste catálogo de provedor. |
| `headers` | `Record<string, string>` | Cabeçalhos estáticos opcionais que se aplicam a este catálogo de provedor. |
| `models`  | `object[]`               | Linhas de modelo obrigatórias. Linhas sem um `id` são ignoradas.            |

Campos do modelo:

| Campo           | Tipo                                                           | O que significa                                                               |
| --------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `id`            | `string`                                                       | ID de modelo local ao provedor, sem o prefixo `provider/`.                    |
| `name`          | `string`                                                       | Nome de exibição opcional.                                                      |
| `api`           | `ModelApi`                                                     | Substituição opcional de API por modelo.                                            |
| `baseUrl`       | `string`                                                       | Substituição opcional de URL base por modelo.                                       |
| `headers`       | `Record<string, string>`                                       | Cabeçalhos estáticos opcionais por modelo.                                          |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalidades que o modelo aceita.                                               |
| `reasoning`     | `boolean`                                                      | Se o modelo expõe comportamento de raciocínio.                               |
| `contextWindow` | `number`                                                       | Janela de contexto nativa do provedor.                                             |
| `contextTokens` | `number`                                                       | Limite efetivo opcional de contexto em runtime quando diferente de `contextWindow`. |
| `maxTokens`     | `number`                                                       | Máximo de tokens de saída quando conhecido.                                           |
| `cost`          | `object`                                                       | Preço opcional em USD por milhão de tokens, incluindo `tieredPricing` opcional. |
| `compat`        | `object`                                                       | Flags opcionais de compatibilidade correspondentes à compatibilidade da configuração de modelo do OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Status da listagem. Suprima apenas quando a linha não deve aparecer de forma alguma. |
| `statusReason`  | `string`                                                       | Motivo opcional mostrado com status não disponível.                            |
| `replaces`      | `string[]`                                                     | IDs de modelo locais ao provedor mais antigos que este modelo substitui.                       |
| `replacedBy`    | `string`                                                       | ID de modelo local ao provedor substituto para linhas obsoletas.                    |
| `tags`          | `string[]`                                                     | Tags estáveis usadas por seletores e filtros.                                    |

Campos de supressão:

| Campo                      | Tipo       | O que significa                                                                                             |
| -------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | ID do provedor para a linha upstream a suprimir. Deve pertencer a este plugin ou ser declarado como um alias proprietário. |
| `model`                    | `string`   | ID de modelo local ao provedor a suprimir.                                                                      |
| `reason`                   | `string`   | Mensagem opcional mostrada quando a linha suprimida é solicitada diretamente.                                     |
| `when.baseUrlHosts`        | `string[]` | Lista opcional de hosts efetivos de URL base do provedor exigidos antes que a supressão se aplique.               |
| `when.providerConfigApiIn` | `string[]` | Lista opcional de valores exatos `api` de configuração do provedor exigidos antes que a supressão se aplique.              |

Não coloque dados somente de runtime em `modelCatalog`. Use `static` somente quando as
linhas do manifesto forem completas o bastante para que superfícies de lista e
seletor filtradas por provedor ignorem a descoberta de registry/runtime. Use
`refreshable` quando as linhas do manifesto forem sementes ou complementos
listáveis úteis, mas uma atualização/cache puder adicionar mais linhas depois;
linhas refreshable não são autoritativas por si só. Use `runtime` quando o
OpenClaw precisar carregar o runtime do provedor para conhecer a lista.

## Referência de modelIdNormalization

Use `modelIdNormalization` para uma limpeza barata de IDs de modelo, pertencente
ao provedor, que precisa acontecer antes que o runtime do provedor carregue. Isso
mantém aliases como nomes curtos de modelos, IDs legados locais ao provedor e
regras de prefixo de proxy no manifesto do Plugin proprietário, em vez de em
tabelas centrais de seleção de modelos.

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

| Campo                                | Tipo                    | O que significa                                                                           |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Aliases exatos de ID de modelo, sem diferenciar maiúsculas de minúsculas. Os valores são retornados como escritos. |
| `stripPrefixes`                      | `string[]`              | Prefixos a remover antes da busca de alias, úteis para duplicação legada de provedor/modelo. |
| `prefixWhenBare`                     | `string`                | Prefixo a adicionar quando o ID de modelo normalizado ainda não contém `/`.               |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Regras condicionais de prefixo para IDs sem prefixo após a busca de alias, indexadas por `modelPrefix` e `prefix`. |

## Referência de providerEndpoints

Use `providerEndpoints` para a classificação de endpoints que a política genérica
de requisições precisa conhecer antes que o runtime do provedor carregue. O core
ainda possui o significado de cada `endpointClass`; manifestos de Plugins possuem
os metadados de host e URL base.

Campos de endpoint:

| Campo                          | Tipo       | O que significa                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Classe de endpoint conhecida pelo core, como `openrouter`, `moonshot-native` ou `google-vertex`. |
| `hosts`                        | `string[]` | Nomes de host exatos que mapeiam para a classe de endpoint.                                      |
| `hostSuffixes`                 | `string[]` | Sufixos de host que mapeiam para a classe de endpoint. Prefixe com `.` para correspondência somente de sufixo de domínio. |
| `baseUrls`                     | `string[]` | URLs base HTTP(S) normalizadas exatas que mapeiam para a classe de endpoint.                    |
| `googleVertexRegion`           | `string`   | Região estática do Google Vertex para hosts globais exatos.                                     |
| `googleVertexRegionHostSuffix` | `string`   | Sufixo a remover de hosts correspondentes para expor o prefixo de região do Google Vertex.      |

## Referência de providerRequest

Use `providerRequest` para metadados baratos de compatibilidade de requisição que
a política genérica de requisições precisa sem carregar o runtime do provedor.
Mantenha reescrita de payload específica de comportamento em hooks de runtime do
provedor ou helpers compartilhados da família de provedores.

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

| Campo                 | Tipo         | O que significa                                                                        |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | Rótulo da família do provedor usado por decisões e diagnósticos genéricos de compatibilidade de requisições. |
| `compatibilityFamily` | `"moonshot"` | Bucket opcional de compatibilidade da família de provedores para helpers compartilhados de requisição. |
| `openAICompletions`   | `object`     | Flags de requisições de completions compatíveis com OpenAI, atualmente `supportsStreamingUsage`. |

## Referência de modelPricing

Use `modelPricing` quando um provedor precisa de comportamento de precificação no
plano de controle antes que o runtime carregue. O cache de precificação do
Gateway lê esses metadados sem importar código de runtime do provedor.

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
| `external`   | `boolean`         | Defina como `false` para provedores locais/auto-hospedados que nunca devem buscar precificação no OpenRouter ou LiteLLM. |
| `openRouter` | `false \| object` | Mapeamento de consulta de precificação do OpenRouter. `false` desativa a consulta ao OpenRouter para este provedor. |
| `liteLLM`    | `false \| object` | Mapeamento de consulta de precificação do LiteLLM. `false` desativa a consulta ao LiteLLM para este provedor. |

Campos da fonte:

| Campo                      | Tipo               | O que significa                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | ID de provedor de catálogo externo quando ele difere do ID de provedor do OpenClaw, por exemplo `z-ai` para um provedor `zai`. |
| `passthroughProviderModel` | `boolean`          | Trate IDs de modelo contendo barras como refs aninhadas de provedor/modelo, útil para provedores de proxy como OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Variantes extras de ID de modelo do catálogo externo. `version-dots` tenta IDs de versão com pontos, como `claude-opus-4.6`. |

### Índice de Provedores do OpenClaw

O Índice de Provedores do OpenClaw é metadado de prévia pertencente ao OpenClaw
para provedores cujos Plugins talvez ainda não estejam instalados. Ele não faz
parte de um manifesto de Plugin. Manifestos de Plugins continuam sendo a
autoridade do Plugin instalado. O Índice de Provedores é o contrato interno de
fallback que futuras superfícies de seletor de modelos de provedores instaláveis
e pré-instalação consumirão quando um Plugin de provedor não estiver instalado.

Ordem de autoridade do catálogo:

1. Configuração do usuário.
2. Manifesto `modelCatalog` do Plugin instalado.
3. Cache do catálogo de modelos de atualização explícita.
4. Linhas de prévia do Índice de Provedores do OpenClaw.

O Índice de Provedores não deve conter segredos, estado habilitado, hooks de
runtime nem dados de modelo específicos de contas ativas. Seus catálogos de
prévia usam o mesmo formato de linha de provedor de `modelCatalog` que os
manifestos de Plugins, mas devem se limitar a metadados de exibição estáveis, a
menos que campos de adaptador de runtime como `api`, `baseUrl`, precificação ou
flags de compatibilidade sejam mantidos intencionalmente alinhados ao manifesto
do Plugin instalado. Provedores com descoberta ativa de `/models` devem gravar
linhas atualizadas pelo caminho explícito de cache do catálogo de modelos, em vez
de fazer chamadas normais de listagem ou onboarding a APIs de provedores.

Entradas do Índice de Provedores também podem carregar metadados de Plugin
instalável para provedores cujo Plugin saiu do core ou ainda não está instalado.
Esses metadados espelham o padrão do catálogo de canais: nome do pacote,
especificação de instalação npm, integridade esperada e rótulos baratos de
escolha de autenticação bastam para mostrar uma opção de configuração
instalável. Depois que o Plugin é instalado, seu manifesto prevalece e a entrada
do Índice de Provedores é ignorada para esse provedor.

Chaves legadas de capacidade no nível superior foram descontinuadas. Use
`openclaw doctor --fix` para mover `speechProviders`,
`realtimeTranscriptionProviders`, `realtimeVoiceProviders`,
`mediaUnderstandingProviders`, `imageGenerationProviders`,
`videoGenerationProviders`, `webFetchProviders` e `webSearchProviders` para
baixo de `contracts`; o carregamento normal do manifesto não trata mais esses
campos de nível superior como propriedade de capacidade.

## Manifesto versus package.json

Os dois arquivos servem a propósitos diferentes:

| Arquivo                | Use para                                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Descoberta, validação de configuração, metadados de escolha de autenticação e dicas de UI que precisam existir antes que o código do Plugin execute |
| `package.json`         | Metadados npm, instalação de dependências e o bloco `openclaw` usado para entrypoints, bloqueio de instalação, configuração ou metadados de catálogo |

Se você não tiver certeza de onde uma parte de metadados pertence, use esta regra:

- se o OpenClaw precisa saber disso antes de carregar o código do Plugin, coloque em `openclaw.plugin.json`
- se diz respeito a empacotamento, arquivos de entrada ou comportamento de instalação npm, coloque em `package.json`

### Campos de package.json que afetam a descoberta

Alguns metadados de Plugin pré-runtime vivem intencionalmente em `package.json`
sob o bloco `openclaw`, em vez de em `openclaw.plugin.json`.
`openclaw.bundle` e `openclaw.bundle.json` não são contratos de Plugin do
OpenClaw; Plugins nativos devem usar `openclaw.plugin.json` mais os campos
compatíveis de `package.json#openclaw` abaixo.

Exemplos importantes:

| Campo                                                                                      | O que significa                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | Declara entrypoints nativos de Plugin. Deve permanecer dentro do diretório do pacote do Plugin.                                                                                            |
| `openclaw.runtimeExtensions`                                                               | Declara entrypoints de runtime JavaScript compilados para pacotes instalados. Deve permanecer dentro do diretório do pacote do Plugin.                                                     |
| `openclaw.setupEntry`                                                                      | Entrypoint leve apenas de configuração usado durante onboarding, inicialização adiada de canal e descoberta de status de canal/SecretRef somente leitura. Deve permanecer dentro do diretório do pacote do Plugin. |
| `openclaw.runtimeSetupEntry`                                                               | Declara o entrypoint de configuração JavaScript compilado para pacotes instalados. Exige `setupEntry`, deve existir e deve permanecer dentro do diretório do pacote do Plugin.             |
| `openclaw.channel`                                                                         | Metadados baratos de catálogo de canais, como rótulos, caminhos de documentação, aliases e texto de seleção.                                                                               |
| `openclaw.channel.commands`                                                                | Metadados estáticos de comando nativo e padrão automático de skill nativa usados por superfícies de configuração, auditoria e lista de comandos antes do runtime do canal carregar.        |
| `openclaw.channel.configuredState`                                                         | Metadados leves de verificador de estado configurado que podem responder "a configuração apenas por env já existe?" sem carregar o runtime completo do canal.                              |
| `openclaw.channel.persistedAuthState`                                                      | Metadados leves de verificador de autenticação persistida que podem responder "alguma conta já está autenticada?" sem carregar o runtime completo do canal.                                |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Dicas de instalação/atualização para plugins incluídos e publicados externamente.                                                                                                          |
| `openclaw.install.defaultChoice`                                                           | Caminho de instalação preferido quando várias origens de instalação estão disponíveis.                                                                                                     |
| `openclaw.install.minHostVersion`                                                          | Versão mínima compatível do host OpenClaw, usando um piso semver como `>=2026.3.22` ou `>=2026.5.1-beta.1`.                                                                                |
| `openclaw.install.expectedIntegrity`                                                       | String de integridade esperada do dist npm, como `sha512-...`; fluxos de instalação e atualização verificam o artefato obtido contra ela.                                                   |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Permite um caminho estreito de recuperação por reinstalação de Plugin incluído quando a configuração é inválida.                                                                           |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Permite que superfícies de canal apenas de configuração carreguem antes do Plugin completo do canal durante a inicialização.                                                               |

Os metadados do manifesto decidem quais escolhas de provedor/canal/configuração aparecem no
onboarding antes que o runtime carregue. `package.json#openclaw.install` informa ao
onboarding como buscar ou habilitar esse Plugin quando o usuário escolhe uma dessas
opções. Não mova dicas de instalação para `openclaw.plugin.json`.

`openclaw.install.minHostVersion` é aplicado durante a instalação e o carregamento do
registro de manifestos para origens de Plugin não incluídas. Valores inválidos são rejeitados;
valores mais novos, mas válidos, ignoram plugins externos em hosts mais antigos. Plugins de origem
incluídos são presumidos como co-versionados com o checkout do host.

Metadados oficiais de instalação sob demanda devem usar `clawhubSpec` quando o Plugin é
publicado no ClawHub; o onboarding trata isso como a origem remota preferida e
registra fatos do artefato ClawHub após a instalação. `npmSpec` continua sendo o fallback de compatibilidade
para pacotes que ainda não migraram para o ClawHub.

A fixação exata de versão npm já vive em `npmSpec`, por exemplo
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Entradas oficiais do catálogo externo
devem combinar specs exatas com `expectedIntegrity` para que fluxos de atualização falhem
fechados se o artefato npm obtido não corresponder mais à release fixada.
O onboarding interativo ainda oferece specs npm de registros confiáveis, incluindo nomes
de pacote simples e dist-tags, por compatibilidade. Diagnósticos de catálogo podem
distinguir origens exatas, flutuantes, fixadas por integridade, sem integridade, com
incompatibilidade de nome de pacote e com escolha padrão inválida. Eles também avisam quando
`expectedIntegrity` está presente, mas não há nenhuma origem npm válida que ela possa fixar.
Quando `expectedIntegrity` está presente,
fluxos de instalação/atualização a aplicam; quando ela é omitida, a resolução do registro é
registrada sem uma fixação de integridade.

Plugins de canal devem fornecer `openclaw.setupEntry` quando varreduras de status, lista de canais
ou SecretRef precisam identificar contas configuradas sem carregar o runtime completo.
A entrada de configuração deve expor metadados de canal mais adaptadores seguros para configuração,
status e secrets; mantenha clientes de rede, listeners de Gateway e
runtimes de transporte no entrypoint principal da extensão.

Campos de entrypoint de runtime não substituem verificações de limite de pacote para campos de
entrypoint de origem. Por exemplo, `openclaw.runtimeExtensions` não pode tornar carregável um
caminho `openclaw.extensions` que escape do pacote.

`openclaw.install.allowInvalidConfigRecovery` é intencionalmente estreito. Ele não
torna configurações arbitrariamente quebradas instaláveis. Hoje, ele só permite que fluxos de instalação
se recuperem de falhas específicas e obsoletas de upgrade de Plugin incluído, como um
caminho de Plugin incluído ausente ou uma entrada `channels.<id>` obsoleta para esse mesmo
Plugin incluído. Erros de configuração não relacionados ainda bloqueiam a instalação e enviam operadores
para `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` é metadado de pacote para um pequeno módulo verificador:

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

Use-o quando fluxos de configuração, doctor, status ou presença somente leitura precisam de uma sondagem barata
sim/não de autenticação antes que o Plugin completo do canal carregue. Estado de autenticação persistido não é
estado de canal configurado: não use estes metadados para habilitar plugins automaticamente,
reparar dependências de runtime ou decidir se um runtime de canal deve carregar.
O export de destino deve ser uma pequena função que lê apenas estado persistido; não
o encaminhe pelo barrel do runtime completo do canal.

`openclaw.channel.configuredState` segue o mesmo formato para verificações baratas de configuração apenas por env:

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

Use-o quando um canal puder responder estado configurado a partir de env ou outros pequenos
insumos sem runtime. Se a verificação precisar de resolução completa de configuração ou do runtime real
do canal, mantenha essa lógica no hook `config.hasConfiguredState`
do Plugin.

## Precedência de descoberta (ids de Plugin duplicados)

O OpenClaw descobre plugins a partir de várias raízes (incluídos, instalação global, workspace, caminhos selecionados explicitamente por configuração). Se duas descobertas compartilharem o mesmo `id`, apenas o manifesto de **maior precedência** será mantido; duplicatas de menor precedência são descartadas em vez de carregadas ao lado dele.

Precedência, da maior para a menor:

1. **Selecionado por configuração** — um caminho explicitamente fixado em `plugins.entries.<id>`
2. **Incluído** — plugins distribuídos com o OpenClaw
3. **Instalação global** — plugins instalados na raiz global de plugins do OpenClaw
4. **Workspace** — plugins descobertos em relação ao workspace atual

Implicações:

- Uma cópia bifurcada ou obsoleta de um Plugin incluído no workspace não sombreará a build incluída.
- Para realmente substituir um Plugin incluído por um local, fixe-o via `plugins.entries.<id>` para que ele vença por precedência em vez de depender da descoberta do workspace.
- Descartes de duplicatas são registrados em logs para que o Doctor e os diagnósticos de inicialização possam apontar para a cópia descartada.
- Sobrescrições duplicadas selecionadas por configuração são redigidas como sobrescrições explícitas nos diagnósticos, mas ainda avisam para que forks obsoletos e sombreamentos acidentais permaneçam visíveis.

## Requisitos de JSON Schema

- **Todo Plugin deve distribuir um JSON Schema**, mesmo que não aceite configuração.
- Um schema vazio é aceitável (por exemplo, `{ "type": "object", "additionalProperties": false }`).
- Schemas são validados no momento de leitura/gravação da configuração, não em runtime.
- Ao estender ou bifurcar um Plugin incluído com novas chaves de configuração, atualize o `configSchema` do `openclaw.plugin.json` desse Plugin ao mesmo tempo. Schemas de Plugin incluído são estritos, então adicionar `plugins.entries.<id>.config.myNewKey` na configuração do usuário sem adicionar `myNewKey` a `configSchema.properties` será rejeitado antes que o runtime do Plugin carregue.

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
  devem referenciar ids de Plugin **detectáveis**. Ids desconhecidos são **erros**.
- Se um Plugin estiver instalado, mas tiver manifesto ou schema quebrado ou ausente,
  a validação falha e o Doctor relata o erro do Plugin.
- Se a configuração do Plugin existir, mas o Plugin estiver **desabilitado**, a configuração é mantida e
  um **aviso** aparece no Doctor + logs.

Consulte [Referência de configuração](/pt-BR/gateway/configuration) para ver o schema completo de `plugins.*`.

## Observações

- O manifesto é **obrigatório para plugins nativos do OpenClaw**, incluindo carregamentos do sistema de arquivos local. O runtime ainda carrega o módulo do plugin separadamente; o manifesto serve apenas para descoberta + validação.
- Manifestos nativos são analisados com JSON5, então comentários, vírgulas finais e chaves sem aspas são aceitos desde que o valor final ainda seja um objeto.
- Apenas campos de manifesto documentados são lidos pelo carregador de manifestos. Evite chaves personalizadas de nível superior.
- `channels`, `providers`, `cliBackends` e `skills` podem ser omitidos quando um plugin não precisar deles.
- `providerDiscoveryEntry` deve permanecer leve e não deve importar código amplo de runtime; use-o para metadados estáticos de catálogo de provedores ou descritores de descoberta restritos, não para execução em tempo de solicitação.
- Tipos exclusivos de plugin são selecionados por meio de `plugins.slots.*`: `kind: "memory"` via `plugins.slots.memory`, `kind: "context-engine"` via `plugins.slots.contextEngine` (padrão `legacy`).
- Declare o tipo exclusivo de plugin neste manifesto. `OpenClawPluginDefinition.kind` da entrada de runtime está obsoleto e permanece apenas como fallback de compatibilidade para plugins mais antigos.
- Metadados de variáveis de ambiente (`setup.providers[].envVars`, `providerAuthEnvVars` obsoleto e `channelEnvVars`) são apenas declarativos. Status, auditoria, validação de entrega Cron e outras superfícies somente leitura ainda aplicam a confiança do plugin e a política de ativação efetiva antes de tratar uma variável de ambiente como configurada.
- Para metadados do assistente de runtime que exigem código do provedor, consulte [ganchos de runtime do provedor](/pt-BR/plugins/architecture-internals#provider-runtime-hooks).
- Se o seu plugin depender de módulos nativos, documente as etapas de build e quaisquer requisitos de lista de permissão do gerenciador de pacotes (por exemplo, `allow-build-scripts` do pnpm + `pnpm rebuild <package>`).

## Relacionado

<CardGroup cols={3}>
  <Card title="Criando plugins" href="/pt-BR/plugins/building-plugins" icon="rocket">
    Primeiros passos com plugins.
  </Card>
  <Card title="Arquitetura de plugins" href="/pt-BR/plugins/architecture" icon="diagram-project">
    Arquitetura interna e modelo de capacidades.
  </Card>
  <Card title="Visão geral do SDK" href="/pt-BR/plugins/sdk-overview" icon="book">
    Referência do SDK de Plugin e importações de subcaminho.
  </Card>
</CardGroup>
