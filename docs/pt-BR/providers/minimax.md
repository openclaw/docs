---
read_when:
    - Você quer usar modelos MiniMax no OpenClaw
    - Você precisa de orientação de setup do MiniMax
summary: Use modelos MiniMax no OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-25T13:54:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 666e8fd958a2566a66bc2262a1b23e3253f4ed1367c4e684380041fd935ab4af
    source_path: providers/minimax.md
    workflow: 15
---

O provider MiniMax do OpenClaw usa **MiniMax M2.7** como padrão.

O MiniMax também fornece:

- Síntese de fala integrada via T2A v2
- Compreensão de imagem integrada via `MiniMax-VL-01`
- Geração de música integrada via `music-2.6`
- `web_search` integrado por meio da API de busca do MiniMax Coding Plan

Divisão de providers:

| ID do provider    | Autenticação | Capacidades                                                    |
| ----------------- | ------------ | -------------------------------------------------------------- |
| `minimax`         | Chave de API | Texto, geração de imagem, compreensão de imagem, fala, busca na web |
| `minimax-portal`  | OAuth        | Texto, geração de imagem, compreensão de imagem, fala          |

## Catálogo integrado

| Modelo                   | Tipo              | Descrição                                  |
| ------------------------ | ----------------- | ------------------------------------------ |
| `MiniMax-M2.7`           | Chat (raciocínio) | Modelo hospedado de raciocínio padrão      |
| `MiniMax-M2.7-highspeed` | Chat (raciocínio) | Camada M2.7 de raciocínio mais rápida      |
| `MiniMax-VL-01`          | Visão             | Modelo de compreensão de imagem             |
| `image-01`               | Geração de imagem | Texto para imagem e edição imagem para imagem |
| `music-2.6`              | Geração de música | Modelo de música padrão                     |
| `music-2.5`              | Geração de música | Camada anterior de geração de música        |
| `music-2.0`              | Geração de música | Camada legada de geração de música          |
| `MiniMax-Hailuo-2.3`     | Geração de vídeo  | Fluxos de texto para vídeo e referência de imagem |

## Primeiros passos

Escolha seu método de autenticação preferido e siga as etapas de configuração.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Melhor para:** configuração rápida com MiniMax Coding Plan via OAuth, sem necessidade de chave de API.

    <Tabs>
      <Tab title="Internacional">
        <Steps>
          <Step title="Executar o onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Isso autentica em `api.minimax.io`.
          </Step>
          <Step title="Verificar se o modelo está disponível">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Executar o onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            Isso autentica em `api.minimaxi.com`.
          </Step>
          <Step title="Verificar se o modelo está disponível">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    Configurações com OAuth usam o id de provider `minimax-portal`. Refs de modelo seguem o formato `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Link de indicação para MiniMax Coding Plan (10% de desconto): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="Chave de API">
    **Melhor para:** MiniMax hospedado com API compatível com Anthropic.

    <Tabs>
      <Tab title="Internacional">
        <Steps>
          <Step title="Executar o onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Isso configura `api.minimax.io` como base URL.
          </Step>
          <Step title="Verificar se o modelo está disponível">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Executar o onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Isso configura `api.minimaxi.com` como base URL.
          </Step>
          <Step title="Verificar se o modelo está disponível">
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
    No caminho de streaming compatível com Anthropic, o OpenClaw desativa o thinking do MiniMax por padrão, a menos que você defina `thinking` explicitamente. O endpoint de streaming do MiniMax emite `reasoning_content` em chunks delta no estilo OpenAI, em vez de blocos nativos de thinking do Anthropic, o que pode vazar raciocínio interno para a saída visível se isso permanecer ativado implicitamente.
    </Warning>

    <Note>
    Configurações com chave de API usam o id de provider `minimax`. Refs de modelo seguem o formato `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Configurar via `openclaw configure`

Use o assistente interativo de configuração para definir o MiniMax sem editar JSON:

<Steps>
  <Step title="Iniciar o assistente">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Selecionar Model/auth">
    Escolha **Model/auth** no menu.
  </Step>
  <Step title="Escolher uma opção de autenticação MiniMax">
    Escolha uma das opções MiniMax disponíveis:

    | Escolha de autenticação | Descrição |
    | --- | --- |
    | `minimax-global-oauth` | OAuth internacional (Coding Plan) |
    | `minimax-cn-oauth` | OAuth China (Coding Plan) |
    | `minimax-global-api` | Chave de API internacional |
    | `minimax-cn-api` | Chave de API China |

  </Step>
  <Step title="Escolher o modelo padrão">
    Selecione seu modelo padrão quando solicitado.
  </Step>
</Steps>

## Capacidades

### Geração de imagem

O Plugin MiniMax registra o modelo `image-01` para a ferramenta `image_generate`. Ele oferece suporte a:

- **Geração de texto para imagem** com controle de proporção
- **Edição de imagem para imagem** (referência de sujeito) com controle de proporção
- Até **9 imagens de saída** por solicitação
- Até **1 imagem de referência** por solicitação de edição
- Proporções compatíveis: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

Para usar o MiniMax na geração de imagem, defina-o como provider de geração de imagem:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

O Plugin usa a mesma `MINIMAX_API_KEY` ou autenticação OAuth que os modelos de texto. Nenhuma configuração adicional é necessária se o MiniMax já estiver configurado.

Tanto `minimax` quanto `minimax-portal` registram `image_generate` com o mesmo
modelo `image-01`. Configurações com chave de API usam `MINIMAX_API_KEY`; configurações com OAuth podem usar
o caminho de autenticação integrado `minimax-portal`.

Quando o onboarding ou a configuração com chave de API grava entradas explícitas em `models.providers.minimax`,
o OpenClaw materializa `MiniMax-M2.7` e
`MiniMax-M2.7-highspeed` como modelos de chat somente texto. A compreensão de imagem é
exposta separadamente por meio do provider de mídia `MiniMax-VL-01`, pertencente ao Plugin.

<Note>
Consulte [Geração de imagem](/pt-BR/tools/image-generation) para parâmetros compartilhados da ferramenta, seleção de provider e comportamento de failover.
</Note>

### Text-to-speech

O Plugin integrado `minimax` registra MiniMax T2A v2 como provider de fala para
`messages.tts`.

- Modelo TTS padrão: `speech-2.8-hd`
- Voz padrão: `English_expressive_narrator`
- IDs de modelo integrados compatíveis incluem `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` e `speech-01-turbo`.
- A resolução de autenticação é `messages.tts.providers.minimax.apiKey`, depois
  perfis de autenticação OAuth/token de `minimax-portal`, depois chaves de ambiente do Token Plan
  (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), depois `MINIMAX_API_KEY`.
- Se nenhum host TTS estiver configurado, o OpenClaw reutiliza o host OAuth
  configurado de `minimax-portal` e remove sufixos de caminho compatíveis com Anthropic,
  como `/anthropic`.
- Anexos normais de áudio continuam em MP3.
- Alvos de nota de voz, como Feishu e Telegram, são transcodificados de MP3 do MiniMax
  para Opus 48 kHz com `ffmpeg`, porque a API de arquivos do Feishu/Lark aceita apenas
  `file_type: "opus"` para mensagens nativas de áudio.
- O MiniMax T2A aceita `speed` e `vol` fracionários, mas `pitch` é enviado como
  inteiro; o OpenClaw trunca valores fracionários de `pitch` antes da solicitação à API.

| Configuração                             | Variável de ambiente      | Padrão                        | Descrição                              |
| ---------------------------------------- | ------------------------- | ----------------------------- | -------------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`        | `https://api.minimax.io`      | Host da API MiniMax T2A.               |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`       | `speech-2.8-hd`               | ID do modelo TTS.                      |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID`    | `English_expressive_narrator` | ID da voz usada na saída de fala.      |
| `messages.tts.providers.minimax.speed`   |                           | `1.0`                         | Velocidade de reprodução, `0.5..2.0`.  |
| `messages.tts.providers.minimax.vol`     |                           | `1.0`                         | Volume, `(0, 10]`.                     |
| `messages.tts.providers.minimax.pitch`   |                           | `0`                           | Deslocamento inteiro de pitch, `-12..12`. |

### Geração de música

O Plugin integrado `minimax` também registra geração de música por meio da
ferramenta compartilhada `music_generate`.

- Modelo de música padrão: `minimax/music-2.6`
- Também oferece suporte a `minimax/music-2.5` e `minimax/music-2.0`
- Controles de prompt: `lyrics`, `instrumental`, `durationSeconds`
- Formato de saída: `mp3`
- Execuções com suporte de sessão são desacopladas por meio do fluxo compartilhado de tarefa/status, incluindo `action: "status"`

Para usar o MiniMax como provider padrão de música:

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
Consulte [Geração de música](/pt-BR/tools/music-generation) para parâmetros compartilhados da ferramenta, seleção de provider e comportamento de failover.
</Note>

### Geração de vídeo

O Plugin integrado `minimax` também registra geração de vídeo por meio da
ferramenta compartilhada `video_generate`.

- Modelo de vídeo padrão: `minimax/MiniMax-Hailuo-2.3`
- Modos: fluxos de texto para vídeo e de referência com imagem única
- Oferece suporte a `aspectRatio` e `resolution`

Para usar o MiniMax como provider padrão de vídeo:

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
Consulte [Geração de vídeo](/pt-BR/tools/video-generation) para parâmetros compartilhados da ferramenta, seleção de provider e comportamento de failover.
</Note>

### Compreensão de imagem

O Plugin MiniMax registra a compreensão de imagem separadamente do catálogo
de texto:

| ID do provider   | Modelo de imagem padrão |
| ---------------- | ----------------------- |
| `minimax`        | `MiniMax-VL-01`         |
| `minimax-portal` | `MiniMax-VL-01`         |

É por isso que o roteamento automático de mídia pode usar a compreensão de imagem do MiniMax mesmo
quando o catálogo integrado do provider de texto ainda mostra refs de chat M2.7 somente texto.

### Busca na web

O Plugin MiniMax também registra `web_search` por meio da API de busca do MiniMax Coding Plan.

- ID do provider: `minimax`
- Resultados estruturados: títulos, URLs, snippets, consultas relacionadas
- Variável de ambiente preferida: `MINIMAX_CODE_PLAN_KEY`
- Alias de ambiente aceito: `MINIMAX_CODING_API_KEY`
- Fallback de compatibilidade: `MINIMAX_API_KEY` quando ele já aponta para um token de coding-plan
- Reutilização de região: `plugins.entries.minimax.config.webSearch.region`, depois `MINIMAX_API_HOST`, depois base URLs do provider MiniMax
- A busca permanece no id de provider `minimax`; a configuração OAuth CN/global ainda pode direcionar a região indiretamente por `models.providers.minimax-portal.baseUrl`

A configuração fica em `plugins.entries.minimax.config.webSearch.*`.

<Note>
Consulte [MiniMax Search](/pt-BR/tools/minimax-search) para configuração completa de busca na web e uso.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Opções de configuração">
    | Opção | Descrição |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Prefira `https://api.minimax.io/anthropic` (compatível com Anthropic); `https://api.minimax.io/v1` é opcional para cargas compatíveis com OpenAI |
    | `models.providers.minimax.api` | Prefira `anthropic-messages`; `openai-completions` é opcional para cargas compatíveis com OpenAI |
    | `models.providers.minimax.apiKey` | Chave de API MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Defina `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Alias dos modelos que você quer na allowlist |
    | `models.mode` | Mantenha `merge` se quiser adicionar MiniMax junto com os integrados |
  </Accordion>

  <Accordion title="Padrões de thinking">
    Em `api: "anthropic-messages"`, o OpenClaw injeta `thinking: { type: "disabled" }` a menos que thinking já esteja explicitamente definido em params/config.

    Isso impede que o endpoint de streaming do MiniMax emita `reasoning_content` em chunks delta no estilo OpenAI, o que vazaria raciocínio interno para a saída visível.

  </Accordion>

  <Accordion title="Modo rápido">
    `/fast on` ou `params.fastMode: true` reescreve `MiniMax-M2.7` para `MiniMax-M2.7-highspeed` no caminho de stream compatível com Anthropic.
  </Accordion>

  <Accordion title="Exemplo de fallback">
    **Melhor para:** manter seu modelo mais forte e de geração mais recente como primário, com failover para MiniMax M2.7. O exemplo abaixo usa Opus como primário concreto; troque pelo seu modelo primário de última geração preferido.

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
    - O OpenClaw normaliza o uso de coding plan do MiniMax para a mesma exibição `% left` usada por outros providers. Os campos brutos `usage_percent` / `usagePercent` do MiniMax representam cota restante, não cota consumida, então o OpenClaw os inverte. Campos baseados em contagem têm prioridade quando presentes.
    - Quando a API retorna `model_remains`, o OpenClaw prefere a entrada do modelo de chat, deriva o label da janela a partir de `start_time` / `end_time` quando necessário e inclui o nome do modelo selecionado no label do plano para que janelas de coding plan sejam mais fáceis de distinguir.
    - Snapshots de uso tratam `minimax`, `minimax-cn` e `minimax-portal` como a mesma superfície de cota do MiniMax e preferem OAuth MiniMax armazenado antes de fazer fallback para variáveis de ambiente da chave do Coding Plan.
  </Accordion>
</AccordionGroup>

## Observações

- Refs de modelo seguem o caminho de autenticação:
  - configuração com chave de API: `minimax/<model>`
  - configuração com OAuth: `minimax-portal/<model>`
- Modelo de chat padrão: `MiniMax-M2.7`
- Modelo alternativo de chat: `MiniMax-M2.7-highspeed`
- Onboarding e configuração direta com chave de API gravam definições de modelo somente texto para ambas as variantes M2.7
- A compreensão de imagem usa o provider de mídia `MiniMax-VL-01`, pertencente ao Plugin
- Atualize os valores de preço em `models.json` se precisar de rastreamento exato de custo
- Use `openclaw models list` para confirmar o id atual do provider e depois troque com `openclaw models set minimax/MiniMax-M2.7` ou `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Link de indicação para MiniMax Coding Plan (10% de desconto): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Consulte [Model providers](/pt-BR/concepts/model-providers) para regras de provider.
</Note>

## Solução de problemas

<AccordionGroup>
  <Accordion title='"Modelo desconhecido: minimax/MiniMax-M2.7"'>
    Isso normalmente significa que o **provider MiniMax não está configurado** (nenhuma entrada de provider correspondente e nenhuma chave de ambiente/perfil de autenticação MiniMax encontrada). Uma correção para essa detecção está em **2026.1.12**. Corrija com uma destas opções:

    - Atualize para **2026.1.12** (ou execute a partir de `main`) e depois reinicie o gateway.
    - Execute `openclaw configure` e selecione uma opção de autenticação **MiniMax**, ou
    - Adicione manualmente o bloco correspondente `models.providers.minimax` ou `models.providers.minimax-portal`, ou
    - Defina `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` ou um perfil de autenticação MiniMax para que o provider correspondente possa ser injetado.

    Certifique-se de que o id do modelo diferencia maiúsculas de minúsculas:

    - Caminho com chave de API: `minimax/MiniMax-M2.7` ou `minimax/MiniMax-M2.7-highspeed`
    - Caminho com OAuth: `minimax-portal/MiniMax-M2.7` ou `minimax-portal/MiniMax-M2.7-highspeed`

    Depois verifique novamente com:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Mais ajuda: [Troubleshooting](/pt-BR/help/troubleshooting) e [FAQ](/pt-BR/help/faq).
</Note>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de providers, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Geração de imagem" href="/pt-BR/tools/image-generation" icon="image">
    Parâmetros compartilhados da ferramenta de imagem e seleção de provider.
  </Card>
  <Card title="Geração de música" href="/pt-BR/tools/music-generation" icon="music">
    Parâmetros compartilhados da ferramenta de música e seleção de provider.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provider.
  </Card>
  <Card title="MiniMax Search" href="/pt-BR/tools/minimax-search" icon="magnifying-glass">
    Configuração de busca na web via MiniMax Coding Plan.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Solução geral de problemas e FAQ.
  </Card>
</CardGroup>
