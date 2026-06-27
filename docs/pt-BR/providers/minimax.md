---
read_when:
    - Você quer modelos MiniMax no OpenClaw
    - Você precisa de orientação de configuração do MiniMax
summary: Use modelos MiniMax no OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-06-27T18:04:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37fe606178d7d15383e56c026b02ba7be751ead706adc097c776c0a6a92aa2a2
    source_path: providers/minimax.md
    workflow: 16
---

O provedor MiniMax do OpenClaw usa **MiniMax M3** por padrão.

O MiniMax também fornece:

- Síntese de fala integrada via T2A v2
- Compreensão de imagens integrada via `MiniMax-VL-01`
- Geração de música integrada via `music-2.6`
- `web_search` integrado por meio da API de busca MiniMax Token Plan

Divisão de provedores:

| ID do provedor   | Autenticação | Recursos                                                                                             |
| ---------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| `minimax`        | Chave de API | Texto, geração de imagens, geração de música, geração de vídeo, compreensão de imagens, fala, busca na web |
| `minimax-portal` | OAuth        | Texto, geração de imagens, geração de música, geração de vídeo, compreensão de imagens, fala         |

## Catálogo integrado

| Modelo                   | Tipo             | Descrição                                |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M3`             | Chat (raciocínio) | Modelo de raciocínio hospedado padrão    |
| `MiniMax-M2.7`           | Chat (raciocínio) | Modelo de raciocínio hospedado anterior  |
| `MiniMax-M2.7-highspeed` | Chat (raciocínio) | Camada de raciocínio M2.7 mais rápida    |
| `MiniMax-VL-01`          | Visão            | Modelo de compreensão de imagens         |
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
    Configurações OAuth usam o ID de provedor `minimax-portal`. Referências de modelo seguem o formato `minimax-portal/MiniMax-M3`.
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
      agents: { defaults: { model: { primary: "minimax/MiniMax-M3" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
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
    No caminho de streaming compatível com Anthropic, o OpenClaw desativa o thinking do MiniMax M2.x por padrão, a menos que você defina explicitamente `thinking`. O endpoint de streaming do M2.x emite `reasoning_content` em blocos delta no estilo OpenAI em vez de blocos de thinking nativos do Anthropic, o que pode vazar raciocínio interno para a saída visível se permanecer ativado implicitamente. MiniMax-M3 (e M3.x compatíveis no futuro) é isento desse padrão: o M3 emite blocos de thinking apropriados do Anthropic e exige que o thinking esteja ativo para produzir conteúdo visível, então o OpenClaw mantém o M3 no caminho de thinking omitido/adaptativo do provedor.
    </Warning>

    <Note>
    Configurações com chave de API usam o ID de provedor `minimax`. Referências de modelo seguem o formato `minimax/MiniMax-M3`.
    </Note>

  </Tab>
</Tabs>

## Configurar via `openclaw configure`

Use o assistente interativo de configuração para definir o MiniMax sem editar JSON:

<Steps>
  <Step title="Launch the wizard">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Select Model/auth">
    Escolha **Model/auth** no menu.
  </Step>
  <Step title="Choose a MiniMax auth option">
    Escolha uma das opções MiniMax disponíveis:

    | Opção de autenticação | Descrição |
    | --- | --- |
    | `minimax-global-oauth` | OAuth internacional (Coding Plan) |
    | `minimax-cn-oauth` | OAuth China (Coding Plan) |
    | `minimax-global-api` | Chave de API internacional |
    | `minimax-cn-api` | Chave de API China |

  </Step>
  <Step title="Pick your default model">
    Selecione seu modelo padrão quando solicitado.
  </Step>
</Steps>

## Recursos

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

O Plugin usa a mesma autenticação `MINIMAX_API_KEY` ou OAuth dos modelos de texto. Nenhuma configuração adicional é necessária se o MiniMax já estiver configurado.

Tanto `minimax` quanto `minimax-portal` registram `image_generate` com o mesmo
modelo `image-01`. Configurações com chave de API usam `MINIMAX_API_KEY`; configurações OAuth podem usar
o caminho de autenticação integrado `minimax-portal` em vez disso.

A geração de imagens sempre usa o endpoint dedicado de imagens do MiniMax
(`/v1/image_generation`) e ignora `models.providers.minimax.baseUrl`,
pois esse campo configura a URL base de chat/compatível com Anthropic. Defina
`MINIMAX_API_HOST=https://api.minimaxi.com` para rotear a geração de imagens
pelo endpoint CN; o endpoint global padrão é
`https://api.minimax.io`.

Quando o onboarding ou a configuração com chave de API grava entradas explícitas de `models.providers.minimax`,
o OpenClaw materializa `MiniMax-M3`, `MiniMax-M2.7` e
`MiniMax-M2.7-highspeed` como modelos de chat. O M3 anuncia entrada de texto e imagem;
a compreensão de imagens continua exposta separadamente por meio do provedor de mídia
`MiniMax-VL-01` de propriedade do Plugin.

<Note>
Consulte [Geração de imagens](/pt-BR/tools/image-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

### Texto para fala

O Plugin integrado `minimax` registra o MiniMax T2A v2 como provedor de fala para
`messages.tts`.

- Modelo TTS padrão: `speech-2.8-hd`
- Voz padrão: `English_expressive_narrator`
- IDs de modelo integrados compatíveis incluem `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` e `speech-01-turbo`.
- A resolução de autenticação é `messages.tts.providers.minimax.apiKey`, depois
  perfis de autenticação OAuth/token de `minimax-portal`, depois chaves de ambiente
  Token Plan (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`) e então `MINIMAX_API_KEY`.
- Se nenhum host TTS for configurado, o OpenClaw reutiliza o host OAuth
  `minimax-portal` configurado e remove sufixos de caminho compatíveis com Anthropic,
  como `/anthropic`.
- Anexos de áudio normais permanecem em MP3.
- Destinos de recado de voz, como Feishu e Telegram, são transcodificados de MP3 do MiniMax
  para Opus 48kHz com `ffmpeg`, porque a API de arquivos do Feishu/Lark só
  aceita `file_type: "opus"` para mensagens de áudio nativas.
- O MiniMax T2A aceita `speed` e `vol` fracionários, mas `pitch` é enviado como um
  inteiro; o OpenClaw trunca valores fracionários de `pitch` antes da solicitação à API.

| Configuração                                    | Variável de ambiente | Padrão                        | Descrição                            |
| ----------------------------------------------- | -------------------- | ----------------------------- | ------------------------------------ |
| `messages.tts.providers.minimax.baseUrl`        | `MINIMAX_API_HOST`   | `https://api.minimax.io`      | Host da API MiniMax T2A.             |
| `messages.tts.providers.minimax.model`          | `MINIMAX_TTS_MODEL`  | `speech-2.8-hd`               | ID do modelo TTS.                    |
| `messages.tts.providers.minimax.speakerVoiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | ID de voz usado para saída de fala.  |
| `messages.tts.providers.minimax.speed`          |                      | `1.0`                         | Velocidade de reprodução, `0.5..2.0`. |
| `messages.tts.providers.minimax.vol`            |                      | `1.0`                         | Volume, `(0, 10]`.                   |
| `messages.tts.providers.minimax.pitch`          |                      | `0`                           | Deslocamento inteiro de tom, `-12..12`. |

### Geração de música

O Plugin MiniMax integrado registra geração de música por meio da ferramenta compartilhada
`music_generate` tanto para `minimax` quanto para `minimax-portal`.

- Modelo de música padrão: `minimax/music-2.6`
- Modelo de música OAuth: `minimax-portal/music-2.6`
- Também oferece suporte a `minimax/music-2.5` e `minimax/music-2.0`
- Controles de prompt: `lyrics`, `instrumental`
- Formato de saída: `mp3`
- Execuções com sessão em segundo plano se desacoplam pelo fluxo compartilhado de tarefa/status, incluindo `action: "status"`

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
Veja [Geração de música](/pt-BR/tools/music-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

### Geração de vídeo

O Plugin MiniMax incluído registra a geração de vídeo pela ferramenta compartilhada
`video_generate` tanto para `minimax` quanto para `minimax-portal`.

- Modelo de vídeo padrão: `minimax/MiniMax-Hailuo-2.3`
- Modelo de vídeo OAuth: `minimax-portal/MiniMax-Hailuo-2.3`
- Modos: fluxos de texto para vídeo e de referência com imagem única
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

O Plugin MiniMax registra a compreensão de imagens separadamente do catálogo
de texto:

| ID do provedor   | Modelo de imagem padrão |
| ---------------- | ----------------------- |
| `minimax`        | `MiniMax-VL-01`         |
| `minimax-portal` | `MiniMax-VL-01`         |

É por isso que o roteamento automático de mídia pode usar a compreensão de imagens do MiniMax mesmo
quando o catálogo de provedores de texto incluído também contém refs de chat compatíveis com imagem M3.

### Pesquisa na Web

O Plugin MiniMax também registra `web_search` pela API de pesquisa MiniMax Token Plan.

- ID do provedor: `minimax`
- Resultados estruturados: títulos, URLs, trechos, consultas relacionadas
- Variável de ambiente preferencial: `MINIMAX_CODE_PLAN_KEY`
- Aliases de ambiente aceitos: `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- Fallback de compatibilidade: `MINIMAX_API_KEY` quando ela já aponta para uma credencial de plano de tokens
- Reuso de região: `plugins.entries.minimax.config.webSearch.region`, depois `MINIMAX_API_HOST`, depois URLs base do provedor MiniMax
- A pesquisa permanece no ID de provedor `minimax`; a configuração OAuth CN/global pode direcionar a região indiretamente por `models.providers.minimax-portal.baseUrl` e pode fornecer autenticação bearer por `MINIMAX_OAUTH_TOKEN`

A configuração fica em `plugins.entries.minimax.config.webSearch.*`.

<Note>
Veja [Pesquisa MiniMax](/pt-BR/tools/minimax-search) para a configuração e o uso completos da pesquisa na Web.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Configuration options">
    | Opção | Descrição |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Prefira `https://api.minimax.io/anthropic` (compatível com Anthropic); `https://api.minimax.io/v1` é opcional para payloads compatíveis com OpenAI |
    | `models.providers.minimax.api` | Prefira `anthropic-messages`; `openai-completions` é opcional para payloads compatíveis com OpenAI |
    | `models.providers.minimax.apiKey` | Chave de API MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Defina `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Atribua aliases aos modelos que você quer na allowlist |
    | `models.mode` | Mantenha `merge` se quiser adicionar o MiniMax junto aos integrados |
  </Accordion>

  <Accordion title="Thinking defaults">
    Em `api: "anthropic-messages"`, o OpenClaw injeta `thinking: { type: "disabled" }` para modelos MiniMax M2.x, a menos que o thinking já esteja explicitamente definido em params/config.

    Isso impede que o endpoint de streaming do M2.x emita `reasoning_content` em chunks delta no estilo OpenAI, o que vazaria o raciocínio interno para a saída visível.

    O MiniMax-M3 (e M3.x) está isento: o M3 emite blocos de thinking Anthropic adequados e retorna um array `content` vazio com `stop_reason: "end_turn"` quando o thinking está desativado, então o wrapper mantém o M3 no caminho de thinking omitido/adaptativo do provedor.

  </Accordion>

  <Accordion title="Fast mode">
    `/fast on` ou `params.fastMode: true` reescreve `MiniMax-M2.7` para `MiniMax-M2.7-highspeed` no caminho de stream compatível com Anthropic.
  </Accordion>

  <Accordion title="Fallback example">
    **Melhor para:** manter seu modelo mais forte de última geração como primário, com failover para MiniMax M2.7. O exemplo abaixo usa Opus como primário concreto; troque pelo seu modelo primário de última geração preferido.

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

  <Accordion title="Coding Plan usage details">
    - API de uso do Coding Plan: `https://api.minimaxi.com/v1/token_plan/remains` ou `https://api.minimax.io/v1/token_plan/remains` (requer uma chave de plano de coding).
    - A sondagem de uso deriva o host de `models.providers.minimax-portal.baseUrl` ou `models.providers.minimax.baseUrl` quando configurado, então configurações globais que usam `https://api.minimax.io/anthropic` sondam `api.minimax.io`. URLs base ausentes ou malformadas mantêm o fallback CN por compatibilidade.
    - O OpenClaw normaliza o uso do plano de coding do MiniMax para a mesma exibição de `% left` usada por outros provedores. Os campos brutos `usage_percent` / `usagePercent` do MiniMax representam a cota restante, não a cota consumida, então o OpenClaw os inverte. Campos baseados em contagem vencem quando presentes.
    - Quando a API retorna `model_remains`, o OpenClaw prefere a entrada do modelo de chat, deriva o rótulo da janela de `start_time` / `end_time` quando necessário e inclui o nome do modelo selecionado no rótulo do plano para facilitar a distinção das janelas do plano de coding.
    - Snapshots de uso tratam `minimax`, `minimax-cn` e `minimax-portal` como a mesma superfície de cota MiniMax e preferem o OAuth MiniMax armazenado antes de recorrer às variáveis de ambiente da chave do Coding Plan.

  </Accordion>
</AccordionGroup>

## Observações

- As refs de modelo seguem o caminho de autenticação:
  - Configuração com chave de API: `minimax/<model>`
  - Configuração OAuth: `minimax-portal/<model>`
- Modelo de chat padrão: `MiniMax-M3`
- Modelos de chat alternativos: `MiniMax-M2.7`, `MiniMax-M2.7-highspeed`
- O onboarding e a configuração direta com chave de API escrevem definições de modelo para M3 e ambas as variantes M2.7
- A compreensão de imagens usa o provedor de mídia `MiniMax-VL-01` de propriedade do Plugin
- Atualize os valores de preços em `models.json` se precisar de rastreamento exato de custos
- Use `openclaw models list` para confirmar o ID de provedor atual e depois troque com `openclaw models set minimax/MiniMax-M3` ou `openclaw models set minimax-portal/MiniMax-M3`

<Tip>
Link de indicação para o MiniMax Coding Plan (10% de desconto): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Veja [Provedores de modelos](/pt-BR/concepts/model-providers) para regras de provedores.
</Note>

## Solução de problemas

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M3"'>
    Isso geralmente significa que o **provedor MiniMax não está configurado** (nenhuma entrada de provedor correspondente e nenhum perfil de autenticação/chave de ambiente MiniMax encontrado). Uma correção para essa detecção está na **2026.1.12**. Corrija assim:

    - Atualize para **2026.1.12** (ou execute a partir do código-fonte `main`) e depois reinicie o gateway.
    - Execute `openclaw configure` e selecione uma opção de autenticação **MiniMax**, ou
    - Adicione manualmente o bloco `models.providers.minimax` ou `models.providers.minimax-portal` correspondente, ou
    - Defina `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` ou um perfil de autenticação MiniMax para que o provedor correspondente possa ser injetado.

    Certifique-se de que o ID do modelo **diferencia maiúsculas de minúsculas**:

    - Caminho com chave de API: `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7` ou `minimax/MiniMax-M2.7-highspeed`
    - Caminho OAuth: `minimax-portal/MiniMax-M3`, `minimax-portal/MiniMax-M2.7` ou `minimax-portal/MiniMax-M2.7-highspeed`

    Depois verifique novamente com:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Mais ajuda: [Solução de problemas](/pt-BR/help/troubleshooting) e [FAQ](/pt-BR/help/faq).
</Note>

## Relacionados

<CardGroup cols={2}>
  <Card title="Model selection" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Image generation" href="/pt-BR/tools/image-generation" icon="image">
    Parâmetros compartilhados da ferramenta de imagem e seleção de provedor.
  </Card>
  <Card title="Music generation" href="/pt-BR/tools/music-generation" icon="music">
    Parâmetros compartilhados da ferramenta de música e seleção de provedor.
  </Card>
  <Card title="Video generation" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provedor.
  </Card>
  <Card title="MiniMax Search" href="/pt-BR/tools/minimax-search" icon="magnifying-glass">
    Configuração de pesquisa na Web via MiniMax Token Plan.
  </Card>
  <Card title="Troubleshooting" href="/pt-BR/help/troubleshooting" icon="wrench">
    Solução de problemas geral e FAQ.
  </Card>
</CardGroup>
