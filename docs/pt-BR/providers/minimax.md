---
read_when:
    - Você quer modelos MiniMax no OpenClaw
    - Você precisa de orientação de configuração do MiniMax
summary: Usar modelos MiniMax no OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-12T23:31:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee9c89faf57384feb66cda30934000e5746996f24b59122db309318f42c22389
    source_path: providers/minimax.md
    workflow: 15
---

# MiniMax

O provedor MiniMax do OpenClaw usa por padrão **MiniMax M2.7**.

O MiniMax também fornece:

- Síntese de fala empacotada via T2A v2
- Entendimento de imagem empacotado via `MiniMax-VL-01`
- Geração de música empacotada via `music-2.5+`
- `web_search` empacotado por meio da API de pesquisa do MiniMax Coding Plan

Divisão de provedores:

| Provider ID      | Auth    | Capabilities                                                    |
| ---------------- | ------- | --------------------------------------------------------------- |
| `minimax`        | chave de API | Texto, geração de imagem, entendimento de imagem, fala, pesquisa na web |
| `minimax-portal` | OAuth   | Texto, geração de imagem, entendimento de imagem                     |

## Linha de modelos

| Model                    | Type             | Description                              |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M2.7`           | Chat (reasoning) | Modelo de reasoning hospedado padrão     |
| `MiniMax-M2.7-highspeed` | Chat (reasoning) | Camada M2.7 de reasoning mais rápida     |
| `MiniMax-VL-01`          | Vision           | Modelo de entendimento de imagem         |
| `image-01`               | Geração de imagem | Texto para imagem e edição image-to-image |
| `music-2.5+`             | Geração de música | Modelo de música padrão                  |
| `music-2.5`              | Geração de música | Camada anterior de geração de música     |
| `music-2.0`              | Geração de música | Camada legada de geração de música       |
| `MiniMax-Hailuo-2.3`     | Geração de vídeo | Fluxos de texto para vídeo e referência de imagem |

## Introdução

Escolha seu método de auth preferido e siga as etapas de configuração.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Ideal para:** configuração rápida com MiniMax Coding Plan via OAuth, sem necessidade de chave de API.

    <Tabs>
      <Tab title="Internacional">
        <Steps>
          <Step title="Execute o onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Isso autentica em `api.minimax.io`.
          </Step>
          <Step title="Verifique se o modelo está disponível">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Execute o onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            Isso autentica em `api.minimaxi.com`.
          </Step>
          <Step title="Verifique se o modelo está disponível">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    Configurações com OAuth usam o id de provedor `minimax-portal`. As refs de modelo seguem o formato `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Link de indicação para MiniMax Coding Plan (10% de desconto): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="Chave de API">
    **Ideal para:** MiniMax hospedado com API compatível com Anthropic.

    <Tabs>
      <Tab title="Internacional">
        <Steps>
          <Step title="Execute o onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Isso configura `api.minimax.io` como URL base.
          </Step>
          <Step title="Verifique se o modelo está disponível">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Execute o onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Isso configura `api.minimaxi.com` como URL base.
          </Step>
          <Step title="Verifique se o modelo está disponível">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### Exemplo de config

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    No caminho de streaming compatível com Anthropic, o OpenClaw desabilita o thinking do MiniMax por padrão, a menos que você defina `thinking` explicitamente. O endpoint de streaming do MiniMax emite `reasoning_content` em chunks delta no estilo OpenAI em vez de blocos nativos de thinking do Anthropic, o que pode vazar reasoning interno para a saída visível se permanecer habilitado implicitamente.
    </Warning>

    <Note>
    Configurações com chave de API usam o id de provedor `minimax`. As refs de modelo seguem o formato `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Configurar via `openclaw configure`

Use o assistente interativo de config para definir o MiniMax sem editar JSON:

<Steps>
  <Step title="Inicie o assistente">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Selecione Model/auth">
    Escolha **Model/auth** no menu.
  </Step>
  <Step title="Escolha uma opção de auth do MiniMax">
    Selecione uma das opções MiniMax disponíveis:

    | Auth choice | Description |
    | --- | --- |
    | `minimax-global-oauth` | OAuth internacional (Coding Plan) |
    | `minimax-cn-oauth` | OAuth China (Coding Plan) |
    | `minimax-global-api` | Chave de API internacional |
    | `minimax-cn-api` | Chave de API China |

  </Step>
  <Step title="Escolha seu modelo padrão">
    Selecione seu modelo padrão quando solicitado.
  </Step>
</Steps>

## Capacidades

### Geração de imagem

O plugin MiniMax registra o modelo `image-01` para a ferramenta `image_generate`. Ele oferece suporte a:

- **Geração de texto para imagem** com controle de proporção
- **Edição image-to-image** (referência de assunto) com controle de proporção
- Até **9 imagens de saída** por requisição
- Até **1 imagem de referência** por requisição de edição
- Proporções compatíveis: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

Para usar MiniMax para geração de imagem, defina-o como o provedor de geração de imagem:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

O plugin usa a mesma auth `MINIMAX_API_KEY` ou OAuth que os modelos de texto. Nenhuma configuração adicional é necessária se o MiniMax já estiver configurado.

Tanto `minimax` quanto `minimax-portal` registram `image_generate` com o mesmo
modelo `image-01`. Configurações com chave de API usam `MINIMAX_API_KEY`; configurações com OAuth podem usar
o caminho de auth empacotado `minimax-portal`.

Quando o onboarding ou a configuração por chave de API grava entradas explícitas em `models.providers.minimax`,
o OpenClaw materializa `MiniMax-M2.7` e
`MiniMax-M2.7-highspeed` com `input: ["text", "image"]`.

O catálogo de texto empacotado e integrado do MiniMax permanece como metadados apenas de texto até
que essa configuração explícita de provedor exista. O entendimento de imagem é exposto separadamente
por meio do provedor de mídia `MiniMax-VL-01` pertencente ao plugin.

<Note>
Veja [Image Generation](/pt-BR/tools/image-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

### Geração de música

O plugin `minimax` empacotado também registra geração de música por meio da ferramenta compartilhada
`music_generate`.

- Modelo de música padrão: `minimax/music-2.5+`
- Também oferece suporte a `minimax/music-2.5` e `minimax/music-2.0`
- Controles de prompt: `lyrics`, `instrumental`, `durationSeconds`
- Formato de saída: `mp3`
- Execuções com suporte de sessão se desacoplam por meio do fluxo compartilhado de task/status, incluindo `action: "status"`

Para usar MiniMax como provedor de música padrão:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.5+",
      },
    },
  },
}
```

<Note>
Veja [Music Generation](/pt-BR/tools/music-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

### Geração de vídeo

O plugin `minimax` empacotado também registra geração de vídeo por meio da ferramenta compartilhada
`video_generate`.

- Modelo de vídeo padrão: `minimax/MiniMax-Hailuo-2.3`
- Modos: texto para vídeo e fluxos com referência de imagem única
- Oferece suporte a `aspectRatio` e `resolution`

Para usar MiniMax como provedor de vídeo padrão:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "minimax/MiniMax-Hailuo-2.3",
      },
    },
  },
}
```

<Note>
Veja [Video Generation](/pt-BR/tools/video-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

### Entendimento de imagem

O plugin MiniMax registra entendimento de imagem separadamente do
catálogo de texto:

| Provider ID      | Modelo de imagem padrão |
| ---------------- | ----------------------- |
| `minimax`        | `MiniMax-VL-01`         |
| `minimax-portal` | `MiniMax-VL-01`         |

É por isso que o roteamento automático de mídia pode usar o entendimento de imagem do MiniMax mesmo
quando o catálogo empacotado do provedor de texto ainda mostra refs de chat M2.7 apenas de texto.

### Pesquisa na web

O plugin MiniMax também registra `web_search` por meio da API de pesquisa do MiniMax Coding Plan.

- ID do provedor: `minimax`
- Resultados estruturados: títulos, URLs, snippets, consultas relacionadas
- Variável de env preferida: `MINIMAX_CODE_PLAN_KEY`
- Alias de env aceito: `MINIMAX_CODING_API_KEY`
- Fallback de compatibilidade: `MINIMAX_API_KEY` quando ele já aponta para um token do coding-plan
- Reutilização de região: `plugins.entries.minimax.config.webSearch.region`, depois `MINIMAX_API_HOST`, depois URLs base do provedor MiniMax
- A pesquisa permanece no id de provedor `minimax`; a configuração OAuth CN/global ainda pode direcionar a região indiretamente por `models.providers.minimax-portal.baseUrl`

A configuração fica em `plugins.entries.minimax.config.webSearch.*`.

<Note>
Veja [MiniMax Search](/pt-BR/tools/minimax-search) para configuração completa e uso da pesquisa na web.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Opções de configuração">
    | Option | Description |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Prefira `https://api.minimax.io/anthropic` (compatível com Anthropic); `https://api.minimax.io/v1` é opcional para cargas compatíveis com OpenAI |
    | `models.providers.minimax.api` | Prefira `anthropic-messages`; `openai-completions` é opcional para cargas compatíveis com OpenAI |
    | `models.providers.minimax.apiKey` | Chave de API do MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Defina `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Alias de modelos que você quer na allowlist |
    | `models.mode` | Mantenha `merge` se quiser adicionar MiniMax junto com os integrados |
  </Accordion>

  <Accordion title="Padrões de thinking">
    Em `api: "anthropic-messages"`, o OpenClaw injeta `thinking: { type: "disabled" }` a menos que o thinking já esteja explicitamente definido em params/config.

    Isso impede que o endpoint de streaming do MiniMax emita `reasoning_content` em chunks delta no estilo OpenAI, o que vazaria reasoning interno para a saída visível.

  </Accordion>

  <Accordion title="Modo rápido">
    `/fast on` ou `params.fastMode: true` reescreve `MiniMax-M2.7` para `MiniMax-M2.7-highspeed` no caminho de stream compatível com Anthropic.
  </Accordion>

  <Accordion title="Exemplo de fallback">
    **Ideal para:** manter seu modelo mais forte e mais recente como primário e fazer failover para MiniMax M2.7. O exemplo abaixo usa Opus como primário concreto; substitua pelo seu modelo primário mais recente preferido.

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": { alias: "primary" },
            "minimax/MiniMax-M2.7": { alias: "minimax" },
          },
          model: {
            primary: "anthropic/claude-opus-4-6",
            fallbacks: ["minimax/MiniMax-M2.7"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Detalhes de uso do Coding Plan">
    - API de uso do Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (requer uma chave de coding plan).
    - O OpenClaw normaliza o uso do coding plan do MiniMax para a mesma exibição de `% restante` usada por outros provedores. Os campos brutos `usage_percent` / `usagePercent` do MiniMax representam cota restante, não cota consumida, então o OpenClaw os inverte. Campos baseados em contagem têm prioridade quando presentes.
    - Quando a API retorna `model_remains`, o OpenClaw prefere a entrada do modelo de chat, deriva o rótulo da janela de `start_time` / `end_time` quando necessário e inclui o nome do modelo selecionado no rótulo do plano para que janelas do coding plan sejam mais fáceis de distinguir.
    - Snapshots de uso tratam `minimax`, `minimax-cn` e `minimax-portal` como a mesma superfície de cota do MiniMax e preferem OAuth MiniMax armazenado antes de recorrer a variáveis de env de chave do Coding Plan.
  </Accordion>
</AccordionGroup>

## Observações

- As refs de modelo seguem o caminho de auth:
  - Configuração com chave de API: `minimax/<model>`
  - Configuração com OAuth: `minimax-portal/<model>`
- Modelo de chat padrão: `MiniMax-M2.7`
- Modelo de chat alternativo: `MiniMax-M2.7-highspeed`
- Onboarding e configuração direta por chave de API gravam definições explícitas de modelo com `input: ["text", "image"]` para ambas as variantes M2.7
- O catálogo de provedores empacotado atualmente expõe as refs de chat como metadados apenas de texto até que exista configuração explícita do provedor MiniMax
- Atualize os valores de preço em `models.json` se precisar de rastreamento de custo exato
- Use `openclaw models list` para confirmar o id atual do provedor e depois altere com `openclaw models set minimax/MiniMax-M2.7` ou `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Link de indicação para MiniMax Coding Plan (10% de desconto): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Veja [Provedores de modelo](/pt-BR/concepts/model-providers) para regras de provedor.
</Note>

## Solução de problemas

<AccordionGroup>
  <Accordion title='"Modelo desconhecido: minimax/MiniMax-M2.7"'>
    Isso normalmente significa que o **provedor MiniMax não está configurado** (não há entrada de provedor correspondente e nenhuma chave de env/perfil de auth MiniMax encontrada). Uma correção para essa detecção está em **2026.1.12**. Corrija com uma destas opções:

    - Atualize para **2026.1.12** (ou execute a partir do código-fonte `main`) e depois reinicie o Gateway.
    - Execute `openclaw configure` e selecione uma opção de auth do **MiniMax**, ou
    - Adicione manualmente o bloco correspondente `models.providers.minimax` ou `models.providers.minimax-portal`, ou
    - Defina `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` ou um perfil de auth do MiniMax para que o provedor correspondente possa ser injetado.

    Certifique-se de que o id do modelo é **case-sensitive**:

    - Caminho com chave de API: `minimax/MiniMax-M2.7` ou `minimax/MiniMax-M2.7-highspeed`
    - Caminho com OAuth: `minimax-portal/MiniMax-M2.7` ou `minimax-portal/MiniMax-M2.7-highspeed`

    Depois verifique novamente com:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Mais ajuda: [Solução de problemas](/pt-BR/help/troubleshooting) e [FAQ](/pt-BR/help/faq).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolhendo provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Geração de imagem" href="/pt-BR/tools/image-generation" icon="image">
    Parâmetros compartilhados da ferramenta de imagem e seleção de provedor.
  </Card>
  <Card title="Geração de música" href="/pt-BR/tools/music-generation" icon="music">
    Parâmetros compartilhados da ferramenta de música e seleção de provedor.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provedor.
  </Card>
  <Card title="MiniMax Search" href="/pt-BR/tools/minimax-search" icon="magnifying-glass">
    Configuração de pesquisa na web via MiniMax Coding Plan.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Solução de problemas geral e FAQ.
  </Card>
</CardGroup>
