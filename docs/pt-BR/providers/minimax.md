---
read_when:
    - Você quer modelos MiniMax no OpenClaw
    - Você precisa de orientação para configurar o MiniMax
summary: Usar modelos MiniMax no OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-30T10:05:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ef833258692c78f40a160131c2a0d36f84889e5d5196ddadb648485ba8cb04a
    source_path: providers/minimax.md
    workflow: 16
---

A provedora MiniMax do OpenClaw usa **MiniMax M2.7** como padrão.

MiniMax também oferece:

- Síntese de fala integrada via T2A v2
- Entendimento de imagens integrado via `MiniMax-VL-01`
- Geração de música integrada via `music-2.6`
- `web_search` integrado pela API de busca do MiniMax Coding Plan

Divisão de provedores:

| ID do provedor   | Autenticação | Capacidades                                                                                         |
| ---------------- | ------------ | --------------------------------------------------------------------------------------------------- |
| `minimax`        | Chave de API | Texto, geração de imagens, geração de música, geração de vídeo, entendimento de imagens, fala, busca na web |
| `minimax-portal` | OAuth        | Texto, geração de imagens, geração de música, geração de vídeo, entendimento de imagens, fala       |

## Catálogo integrado

| Modelo                   | Tipo             | Descrição                                |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M2.7`           | Chat (raciocínio) | Modelo de raciocínio hospedado padrão    |
| `MiniMax-M2.7-highspeed` | Chat (raciocínio) | Camada de raciocínio M2.7 mais rápida    |
| `MiniMax-VL-01`          | Visão            | Modelo de entendimento de imagens        |
| `image-01`               | Geração de imagens | Edição de texto para imagem e imagem para imagem |
| `music-2.6`              | Geração de música | Modelo de música padrão                  |
| `music-2.5`              | Geração de música | Camada anterior de geração de música     |
| `music-2.0`              | Geração de música | Camada legada de geração de música       |
| `MiniMax-Hailuo-2.3`     | Geração de vídeo | Fluxos de texto para vídeo e referência de imagem |

## Primeiros passos

Escolha seu método de autenticação preferido e siga as etapas de configuração.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Melhor para:** configuração rápida com o MiniMax Coding Plan via OAuth, sem necessidade de chave de API.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Isso autentica em `api.minimax.io`.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            Isso autentica em `api.minimaxi.com`.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    Configurações OAuth usam o id do provedor `minimax-portal`. Referências de modelo seguem o formato `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Link de indicação para o MiniMax Coding Plan (10% de desconto): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **Melhor para:** MiniMax hospedado com API compatível com Anthropic.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Isso configura `api.minimax.io` como a URL base.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Isso configura `api.minimaxi.com` como a URL base.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### Exemplo de configuração

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
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text"],
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
    No caminho de streaming compatível com Anthropic, o OpenClaw desativa o pensamento do MiniMax por padrão, a menos que você defina explicitamente `thinking`. O endpoint de streaming do MiniMax emite `reasoning_content` em fragmentos delta no estilo OpenAI em vez de blocos de pensamento Anthropic nativos, o que pode vazar raciocínio interno para a saída visível se ficar ativado implicitamente.
    </Warning>

    <Note>
    Configurações com chave de API usam o id do provedor `minimax`. Referências de modelo seguem o formato `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Configurar via `openclaw configure`

Use o assistente interativo de configuração para definir o MiniMax sem editar JSON:

<Steps>
  <Step title="Inicie o assistente">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Selecione Modelo/autenticação">
    Escolha **Modelo/autenticação** no menu.
  </Step>
  <Step title="Escolha uma opção de autenticação do MiniMax">
    Selecione uma das opções disponíveis do MiniMax:

    | Escolha de autenticação | Descrição |
    | --- | --- |
    | `minimax-global-oauth` | OAuth internacional (Plano de Codificação) |
    | `minimax-cn-oauth` | OAuth da China (Plano de Codificação) |
    | `minimax-global-api` | Chave de API internacional |
    | `minimax-cn-api` | Chave de API da China |

  </Step>
  <Step title="Escolha seu modelo padrão">
    Selecione seu modelo padrão quando solicitado.
  </Step>
</Steps>

## Capacidades

### Geração de imagens

O Plugin MiniMax registra o modelo `image-01` para a ferramenta `image_generate`. Ele oferece suporte a:

- **Geração de texto para imagem** com controle de proporção
- **Edição de imagem para imagem** (referência de assunto) com controle de proporção
- Até **9 imagens de saída** por solicitação
- Até **1 imagem de referência** por solicitação de edição
- Proporções compatíveis: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

Para usar o MiniMax para geração de imagens, defina-o como o provedor de geração de imagens:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

O Plugin usa a mesma `MINIMAX_API_KEY` ou autenticação OAuth dos modelos de texto. Nenhuma configuração adicional é necessária se o MiniMax já estiver configurado.

Tanto `minimax` quanto `minimax-portal` registram `image_generate` com o mesmo
modelo `image-01`. Configurações com chave de API usam `MINIMAX_API_KEY`; configurações OAuth podem usar
o caminho de autenticação `minimax-portal` incluído.

A geração de imagens sempre usa o endpoint dedicado de imagens do MiniMax
(`/v1/image_generation`) e ignora `models.providers.minimax.baseUrl`,
pois esse campo configura a URL base de chat/compatível com Anthropic. Defina
`MINIMAX_API_HOST=https://api.minimaxi.com` para rotear a geração de imagens
pelo endpoint da CN; o endpoint global padrão é
`https://api.minimax.io`.

Quando a integração inicial ou a configuração por chave de API grava entradas explícitas em `models.providers.minimax`,
o OpenClaw materializa `MiniMax-M2.7` e
`MiniMax-M2.7-highspeed` como modelos de chat somente texto. A compreensão de imagens é
exposta separadamente por meio do provedor de mídia `MiniMax-VL-01`, de propriedade do Plugin.

<Note>
Consulte [Geração de Imagens](/pt-BR/tools/image-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

### Texto para fala

O Plugin `minimax` incluído registra o MiniMax T2A v2 como provedor de fala para
`messages.tts`.

- Modelo TTS padrão: `speech-2.8-hd`
- Voz padrão: `English_expressive_narrator`
- IDs de modelos incluídos compatíveis incluem `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` e `speech-01-turbo`.
- A resolução de autenticação é `messages.tts.providers.minimax.apiKey`, depois
  perfis de autenticação OAuth/token de `minimax-portal`, depois chaves de ambiente
  do Plano de Token (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`) e depois `MINIMAX_API_KEY`.
- Se nenhum host TTS estiver configurado, o OpenClaw reutiliza o host OAuth
  `minimax-portal` configurado e remove sufixos de caminho compatíveis com Anthropic,
  como `/anthropic`.
- Anexos de áudio normais permanecem em MP3.
- Destinos de notas de voz, como Feishu e Telegram, são transcodificados de MP3
  do MiniMax para Opus de 48 kHz com `ffmpeg`, porque a API de arquivos Feishu/Lark só
  aceita `file_type: "opus"` para mensagens de áudio nativas.
- O MiniMax T2A aceita `speed` e `vol` fracionários, mas `pitch` é enviado como um
  inteiro; o OpenClaw trunca valores fracionários de `pitch` antes da solicitação à API.

| Configuração                             | Var. de env.           | Padrão                       | Descrição                        |
| ---------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | Host da API MiniMax T2A.         |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | ID do modelo TTS.                |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | ID da voz usada para saída de fala. |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | Velocidade de reprodução, `0.5..2.0`. |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | Volume, `(0, 10]`.               |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | Alteração inteira de tom, `-12..12`. |

### Geração de música

O Plugin MiniMax incluído registra geração de música por meio da ferramenta compartilhada
`music_generate` tanto para `minimax` quanto para `minimax-portal`.

- Modelo de música padrão: `minimax/music-2.6`
- Modelo de música OAuth: `minimax-portal/music-2.6`
- Também oferece suporte a `minimax/music-2.5` e `minimax/music-2.0`
- Controles de prompt: `lyrics`, `instrumental`, `durationSeconds`
- Formato de saída: `mp3`
- Execuções com sessão destacam-se pelo fluxo compartilhado de tarefa/status, incluindo `action: "status"`

Para usar o MiniMax como provedor de música padrão:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.6",
      },
    },
  },
}
```

<Note>
Consulte [Geração de Música](/pt-BR/tools/music-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

### Geração de vídeo

O Plugin MiniMax incluído registra geração de vídeo por meio da ferramenta compartilhada
`video_generate` tanto para `minimax` quanto para `minimax-portal`.

- Modelo de vídeo padrão: `minimax/MiniMax-Hailuo-2.3`
- Modelo de vídeo OAuth: `minimax-portal/MiniMax-Hailuo-2.3`
- Modos: fluxos de texto para vídeo e referência de imagem única
- Oferece suporte a `aspectRatio` e `resolution`

Para usar o MiniMax como provedor de vídeo padrão:

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
Veja [Geração de vídeo](/pt-BR/tools/video-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

### Compreensão de imagens

O Plugin MiniMax registra a compreensão de imagens separadamente do catálogo de
texto:

| ID do provedor   | Modelo de imagem padrão |
| ---------------- | ----------------------- |
| `minimax`        | `MiniMax-VL-01`         |
| `minimax-portal` | `MiniMax-VL-01`         |

É por isso que o roteamento automático de mídia pode usar a compreensão de
imagens da MiniMax mesmo quando o catálogo do provedor de texto incluído ainda
mostra referências de chat M2.7 somente texto.

### Pesquisa na Web

O Plugin MiniMax também registra `web_search` por meio da API de pesquisa do
MiniMax Coding Plan.

- ID do provedor: `minimax`
- Resultados estruturados: títulos, URLs, trechos, consultas relacionadas
- Variável de ambiente preferida: `MINIMAX_CODE_PLAN_KEY`
- Alias de ambiente aceito: `MINIMAX_CODING_API_KEY`
- Fallback de compatibilidade: `MINIMAX_API_KEY` quando ela já aponta para um token de coding-plan
- Reutilização de região: `plugins.entries.minimax.config.webSearch.region`, depois `MINIMAX_API_HOST`, depois URLs base do provedor MiniMax
- A pesquisa permanece no ID de provedor `minimax`; a configuração OAuth CN/global ainda pode direcionar a região indiretamente por meio de `models.providers.minimax-portal.baseUrl`

A configuração fica em `plugins.entries.minimax.config.webSearch.*`.

<Note>
Veja [Pesquisa MiniMax](/pt-BR/tools/minimax-search) para a configuração e o uso completos da pesquisa na Web.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Opções de configuração">
    | Opção | Descrição |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Prefira `https://api.minimax.io/anthropic` (compatível com Anthropic); `https://api.minimax.io/v1` é opcional para payloads compatíveis com OpenAI |
    | `models.providers.minimax.api` | Prefira `anthropic-messages`; `openai-completions` é opcional para payloads compatíveis com OpenAI |
    | `models.providers.minimax.apiKey` | Chave de API MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Defina `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Modelos de alias que você quer na lista de permissões |
    | `models.mode` | Mantenha `merge` se quiser adicionar MiniMax junto aos integrados |
  </Accordion>

  <Accordion title="Padrões de thinking">
    Em `api: "anthropic-messages"`, o OpenClaw injeta `thinking: { type: "disabled" }`, a menos que thinking já esteja definido explicitamente em params/config.

    Isso impede que o endpoint de streaming da MiniMax emita `reasoning_content` em chunks delta no estilo OpenAI, o que vazaria raciocínio interno na saída visível.

  </Accordion>

  <Accordion title="Modo rápido">
    `/fast on` ou `params.fastMode: true` reescreve `MiniMax-M2.7` para `MiniMax-M2.7-highspeed` no caminho de stream compatível com Anthropic.
  </Accordion>

  <Accordion title="Exemplo de fallback">
    **Ideal para:** manter seu modelo mais forte de geração mais recente como primário e fazer failover para MiniMax M2.7. O exemplo abaixo usa Opus como primário concreto; troque pelo seu modelo primário preferido de última geração.

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
    - API de uso do Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (exige uma chave de coding plan).
    - O OpenClaw normaliza o uso do coding-plan da MiniMax para a mesma exibição de `% restante` usada por outros provedores. Os campos brutos `usage_percent` / `usagePercent` da MiniMax representam a cota restante, não a cota consumida, então o OpenClaw os inverte. Campos baseados em contagem vencem quando presentes.
    - Quando a API retorna `model_remains`, o OpenClaw prefere a entrada do modelo de chat, deriva o rótulo da janela de `start_time` / `end_time` quando necessário e inclui o nome do modelo selecionado no rótulo do plano para facilitar a distinção entre janelas do coding-plan.
    - Instantâneos de uso tratam `minimax`, `minimax-cn` e `minimax-portal` como a mesma superfície de cota da MiniMax e preferem OAuth MiniMax armazenado antes de recorrer às variáveis de ambiente da chave do Coding Plan.

  </Accordion>
</AccordionGroup>

## Observações

- As referências de modelo seguem o caminho de autenticação:
  - Configuração por chave de API: `minimax/<model>`
  - Configuração OAuth: `minimax-portal/<model>`
- Modelo de chat padrão: `MiniMax-M2.7`
- Modelo de chat alternativo: `MiniMax-M2.7-highspeed`
- Onboarding e configuração direta por chave de API gravam definições de modelo somente texto para ambas as variantes M2.7
- A compreensão de imagens usa o provedor de mídia `MiniMax-VL-01` pertencente ao Plugin
- Atualize os valores de preço em `models.json` se precisar de rastreamento de custo exato
- Use `openclaw models list` para confirmar o ID de provedor atual e depois alterne com `openclaw models set minimax/MiniMax-M2.7` ou `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Link de indicação para o MiniMax Coding Plan (10% de desconto): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Veja [Provedores de modelo](/pt-BR/concepts/model-providers) para as regras de provedor.
</Note>

## Solução de problemas

<AccordionGroup>
  <Accordion title='"Modelo desconhecido: minimax/MiniMax-M2.7"'>
    Isso geralmente significa que o **provedor MiniMax não está configurado** (nenhuma entrada de provedor correspondente e nenhum perfil de autenticação/chave de ambiente MiniMax encontrado). Uma correção para essa detecção está na **2026.1.12**. Corrija assim:

    - Atualize para a **2026.1.12** (ou execute a partir do código-fonte `main`) e depois reinicie o gateway.
    - Execute `openclaw configure` e selecione uma opção de autenticação **MiniMax**, ou
    - Adicione manualmente o bloco `models.providers.minimax` ou `models.providers.minimax-portal` correspondente, ou
    - Defina `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` ou um perfil de autenticação MiniMax para que o provedor correspondente possa ser injetado.

    Confira se o ID do modelo **diferencia maiúsculas de minúsculas**:

    - Caminho por chave de API: `minimax/MiniMax-M2.7` ou `minimax/MiniMax-M2.7-highspeed`
    - Caminho OAuth: `minimax-portal/MiniMax-M2.7` ou `minimax-portal/MiniMax-M2.7-highspeed`

    Depois verifique novamente com:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Mais ajuda: [Solução de problemas](/pt-BR/help/troubleshooting) e [Perguntas frequentes](/pt-BR/help/faq).
</Note>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Geração de imagens" href="/pt-BR/tools/image-generation" icon="image">
    Parâmetros compartilhados da ferramenta de imagem e seleção de provedor.
  </Card>
  <Card title="Geração de música" href="/pt-BR/tools/music-generation" icon="music">
    Parâmetros compartilhados da ferramenta de música e seleção de provedor.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provedor.
  </Card>
  <Card title="Pesquisa MiniMax" href="/pt-BR/tools/minimax-search" icon="magnifying-glass">
    Configuração de pesquisa na Web via MiniMax Coding Plan.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Solução de problemas geral e Perguntas frequentes.
  </Card>
</CardGroup>
