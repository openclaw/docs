---
read_when:
    - Você quer usar os modelos Google Gemini com o OpenClaw
    - Você precisa da chave de API ou do fluxo de autenticação OAuth
summary: Configuração do Google Gemini (chave de API + OAuth, geração de imagens, compreensão de mídia, TTS, pesquisa na web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-07-16T12:53:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fe8a58044bea7ce2598da94787334af2bb4a2ff58872c62115697fa0079daf0a
    source_path: providers/google.md
    workflow: 16
---

O plugin do Google fornece acesso aos modelos Gemini por meio do Google AI Studio, além de geração de imagens, compreensão de mídia (imagem/áudio/vídeo), conversão de texto em fala e pesquisa na web via Gemini Grounding.

- Provedor: `google`
- Autenticação: `GEMINI_API_KEY` ou `GOOGLE_API_KEY`
- API: API Google Gemini
- Opção de runtime: `agentRuntime.id: "google-gemini-cli"` reutiliza o OAuth da CLI do Gemini, mantendo as referências de modelo canônicas como `google/*`.

## Primeiros passos

Escolha o método de autenticação de sua preferência e siga as etapas de configuração.

<Tabs>
  <Tab title="Chave de API">
    **Ideal para:** acesso padrão à API Gemini por meio do Google AI Studio.

    <Steps>
      <Step title="Obter uma chave de API">
        Crie uma chave gratuita no [Google AI Studio](https://aistudio.google.com/apikey).
      </Step>
      <Step title="Executar a integração inicial">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Ou forneça a chave diretamente:

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="Definir um modelo padrão">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "google/gemini-3.1-pro-preview" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verificar se o modelo está disponível">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    `GEMINI_API_KEY` e `GOOGLE_API_KEY` são aceitos. Use o que já estiver configurado.
    </Tip>

  </Tab>

  <Tab title="CLI do Gemini (OAuth)">
    **Ideal para:** entrar com sua conta do Google por meio do OAuth da CLI do Gemini, em vez de usar uma chave de API separada.

    <Warning>
    O provedor `google-gemini-cli` é uma integração não oficial. Alguns usuários
    relatam restrições de conta ao usar o OAuth dessa forma. Use por sua conta e risco.
    </Warning>

    <Steps>
      <Step title="Instalar a CLI do Gemini">
        O comando local `gemini` deve estar disponível em `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # ou npm
        npm install -g @google/gemini-cli
        ```

        O OpenClaw oferece suporte a instalações pelo Homebrew e instalações globais pelo npm, incluindo
        layouts comuns do Windows/npm.
      </Step>
      <Step title="Entrar via OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Verificar se o modelo está disponível">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - Modelo padrão: `google/gemini-3.1-pro-preview`
    - Runtime: `google-gemini-cli`
    - Alias: `gemini-cli`

    O ID de modelo da API Gemini para o Gemini 3.1 Pro é `gemini-3.1-pro-preview`. O OpenClaw aceita a forma abreviada `google/gemini-3.1-pro` como um alias conveniente e a normaliza antes das chamadas ao provedor.

    **Variáveis de ambiente:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID` / `GEMINI_CLI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET` / `GEMINI_CLI_OAUTH_CLIENT_SECRET`

    <Note>
    Se as solicitações OAuth da CLI do Gemini falharem após o login, defina `GOOGLE_CLOUD_PROJECT` ou
    `GOOGLE_CLOUD_PROJECT_ID` no host do Gateway e tente novamente.
    </Note>

    <Note>
    Se o login falhar antes do início do fluxo no navegador, verifique se o comando local `gemini`
    está instalado e disponível em `PATH`.
    </Note>

    A detecção automática da integração inicial lista um login existente da CLI do Gemini, mas nunca
    o testa automaticamente, pois a CLI do Gemini não tem uma sondagem sem ferramentas. Escolha o OAuth da CLI do Gemini
    ou uma chave da API Gemini para continuar.

    As referências de modelo `google-gemini-cli/*` são aliases de compatibilidade legados. Novas
    configurações devem usar referências de modelo `google/*` com o runtime `google-gemini-cli`
    quando quiserem execução local pela CLI do Gemini.

  </Tab>
</Tabs>

<Note>
`google/gemini-3-pro-preview` foi descontinuado em 2026-03-09; use `google/gemini-3.1-pro-preview` em seu lugar. Executar novamente a configuração da chave da API Gemini (`openclaw onboard --auth-choice gemini-api-key` ou `openclaw models auth login --provider google`) substitui um padrão configurado obsoleto pelo modelo atual.
</Note>

## Recursos

| Recurso                      | Compatível                       |
| ---------------------------- | -------------------------------- |
| Conclusões de chat            | Sim                              |
| Geração de imagens            | Sim                              |
| Geração de música             | Sim                              |
| Conversão de texto em fala    | Sim                              |
| Voz em tempo real             | Sim (Google Live API)            |
| Compreensão de imagens        | Sim                              |
| Transcrição de áudio          | Sim                              |
| Compreensão de vídeo          | Sim                              |
| Pesquisa na web (Grounding)   | Sim                              |
| Pensamento/raciocínio         | Sim (Gemini 2.5+ / Gemini 3+)    |
| Modelos Gemma 4               | Sim                              |

## Pesquisa na web

O provedor integrado de pesquisa na web `gemini` usa o grounding da Pesquisa Google do Gemini.
Configure uma chave de pesquisa dedicada em `plugins.entries.google.config.webSearch`,
ou permita que ele reutilize `models.providers.google.apiKey` após `GEMINI_API_KEY`:

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // opcional se GEMINI_API_KEY ou models.providers.google.apiKey estiver definido
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // usa models.providers.google.baseUrl como alternativa
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

A precedência de credenciais é `webSearch.apiKey` dedicado, depois `GEMINI_API_KEY`
e, por fim, `models.providers.google.apiKey`. `webSearch.baseUrl` é opcional e
existe para proxies de operadores ou endpoints compatíveis da API Gemini; quando omitido,
a pesquisa na web do Gemini reutiliza `models.providers.google.baseUrl`. Consulte
[Pesquisa do Gemini](/pt-BR/tools/gemini-search) para saber o comportamento da ferramenta específico do provedor.

<Tip>
Os modelos Gemini 3 usam `thinkingLevel` em vez de `thinkingBudget`. O OpenClaw mapeia
os controles de raciocínio do Gemini 3, Gemini 3.1 e do alias `gemini-*-latest` para
`thinkingLevel`, para que execuções padrão/de baixa latência não enviem valores
`thinkingBudget` desativados.

`/think adaptive` mantém a semântica de pensamento dinâmico do Google em vez de escolher
um nível fixo do OpenClaw. O Gemini 3 e o Gemini 3.1 omitem um `thinkingLevel` fixo para que
o Google possa escolher o nível; o Gemini 2.5 envia o sentinela dinâmico do Google
`thinkingBudget: -1`.

Os modelos Gemma 4 (por exemplo, `gemma-4-26b-a4b-it`) oferecem suporte ao modo de pensamento. O OpenClaw
reescreve `thinkingBudget` como um `thinkingLevel` do Google compatível com o Gemma 4.
Definir o pensamento como `off` mantém o pensamento desativado, em vez de mapeá-lo para
`MINIMAL`.

O Gemini 2.5 Pro funciona apenas no modo de pensamento e rejeita um
`thinkingBudget: 0` explícito; o OpenClaw remove esse valor das solicitações do Gemini 2.5 Pro
em vez de enviá-lo.
</Tip>

## Geração de imagens

O provedor integrado de geração de imagens `google` usa
`google/gemini-3.1-flash-image-preview` por padrão.

- Também oferece suporte a `google/gemini-3-pro-image-preview`
- Geração: até 4 imagens por solicitação
- Modo de edição: ativado, até 5 imagens de entrada
- Controles de geometria: `size`, `aspectRatio` e `resolution`

Para usar o Google como provedor de imagens padrão:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

<Note>
Consulte [Geração de imagens](/pt-BR/tools/image-generation) para conhecer os parâmetros compartilhados da ferramenta, a seleção de provedor e o comportamento de failover.
</Note>

## Geração de vídeo

O plugin integrado `google` também registra a geração de vídeo por meio da ferramenta compartilhada
`video_generate`.

- Modelo de vídeo padrão: `google/veo-3.1-fast-generate-preview`
- Modos: texto para vídeo, imagem para vídeo e fluxos de referência de vídeo único
- Oferece suporte a `aspectRatio` (`16:9`, `9:16`) e `resolution` (`720P`, `1080P`); atualmente, o Veo não oferece suporte à saída de áudio
- Durações compatíveis: **4, 6 ou 8 segundos** (outros valores são ajustados para o valor permitido mais próximo)

Para usar o Google como provedor de vídeo padrão:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

<Note>
Consulte [Geração de vídeo](/pt-BR/tools/video-generation) para conhecer os parâmetros compartilhados da ferramenta, a seleção de provedor e o comportamento de failover.
</Note>

## Geração de música

O plugin integrado `google` também registra a geração de música por meio da ferramenta compartilhada
`music_generate`.

- Modelo de música padrão: `google/lyria-3-clip-preview`
- Também oferece suporte a `google/lyria-3-pro-preview`
- Controles de prompt: `lyrics` e `instrumental`
- Formato de saída: `mp3` por padrão, além de `wav` em `google/lyria-3-pro-preview`
- Entradas de referência: até 10 imagens
- Execuções baseadas em sessão são desacopladas por meio do fluxo compartilhado de tarefa/status, incluindo `action: "status"`

Para usar o Google como provedor de música padrão:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

<Note>
Consulte [Geração de música](/pt-BR/tools/music-generation) para conhecer os parâmetros compartilhados da ferramenta, a seleção de provedor e o comportamento de failover.
</Note>

## Conversão de texto em fala

O provedor de fala integrado `google` usa o caminho TTS da API Gemini com
`gemini-3.1-flash-tts-preview`.

- Voz padrão: `Kore`
- Autenticação: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` ou `GOOGLE_API_KEY`
- Saída: WAV para anexos TTS comuns, Opus para destinos de mensagem de voz, PCM para Talk/telefonia
- Saída de mensagem de voz: o PCM do Google é encapsulado como WAV e transcodificado para Opus a 48 kHz com `ffmpeg`

O caminho TTS em lote do Gemini do Google retorna o áudio gerado na resposta
`generateContent` concluída. Para conversas faladas com a menor latência, use o
provedor de voz em tempo real do Google baseado na Gemini Live API em vez do TTS
em lote.

Para usar o Google como provedor TTS padrão:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          speakerVoice: "Kore",
          audioProfile: "Fale profissionalmente com um tom calmo.",
        },
      },
    },
  },
}
```

O TTS da API Gemini usa prompts em linguagem natural para controlar o estilo. Defina
`audioProfile` para adicionar um prompt de estilo reutilizável antes do texto falado. Defina
`speakerName` quando o texto do prompt fizer referência a um locutor pelo nome.

O TTS da API Gemini também aceita tags de áudio expressivas entre colchetes no texto,
como `[whispers]` ou `[laughs]`. Para manter as tags fora da resposta visível do chat
e ainda enviá-las ao TTS, coloque-as dentro de um bloco `[[tts:text]]...[[/tts:text]]`:

```text
Aqui está o texto limpo da resposta.

[[tts:text]][whispers] Aqui está a versão falada.[[/tts:text]]
```

<Note>
Uma chave de API do Google Cloud Console restrita à API Gemini é válida para este
provedor. Este não é o caminho separado da API Cloud Text-to-Speech.
</Note>

## Voz em tempo real

O plugin integrado `google` registra um provedor de voz em tempo real baseado na
Gemini Live API para pontes de áudio de back-end, como Voice Call e Google Meet.

| Configuração                  | Caminho de configuração                                             | Padrão                                                                                |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Modelo                       | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-3.1-flash-live-preview`                                                       |
| Voz                          | `...google.voice`                                                   | `Kore`                                                                                |
| Temperatura                  | `...google.temperature`                                             | (não definido)                                                                        |
| Sensibilidade inicial do VAD | `...google.startSensitivity`                                        | (não definido)                                                                        |
| Sensibilidade final do VAD   | `...google.endSensitivity`                                          | (não definido)                                                                        |
| Duração do silêncio          | `...google.silenceDurationMs`                                       | (não definido)                                                                        |
| Tratamento de atividade      | `...google.activityHandling`                                        | Padrão do Google, `start-of-activity-interrupts`                                      |
| Cobertura do turno           | `...google.turnCoverage`                                            | Padrão do Google, `audio-activity-and-all-video`                                      |
| Desativar VAD automático     | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| Retomada de sessão           | `...google.sessionResumption`                                       | `true`                                                                                |
| Compactação de contexto      | `...google.contextWindowCompression`                                | `true`                                                                                |
| Chave de API                 | `...google.apiKey`                                                  | Usa como alternativas `models.providers.google.apiKey`, `GEMINI_API_KEY` ou `GOOGLE_API_KEY` |

Exemplo de configuração em tempo real para chamadas de voz:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          realtime: {
            enabled: true,
            provider: "google",
            providers: {
              google: {
                model: "gemini-3.1-flash-live-preview",
                speakerVoice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "audio-activity-and-all-video",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
A API Google Live usa áudio bidirecional e chamadas de função por WebSocket.
O OpenClaw adapta o áudio da ponte de telefonia/Meet ao fluxo da API PCM Live do Gemini e
mantém as chamadas de ferramentas no contrato compartilhado de voz em tempo real. Deixe `temperature`
não definido, a menos que seja necessário alterar a amostragem; o OpenClaw omite valores não positivos
porque o Google Live pode retornar transcrições sem áudio para `temperature: 0`.
A transcrição da API Gemini é ativada sem `languageCodes`; o SDK atual do Google
rejeita dicas de código de idioma nesse caminho da API.
</Note>

<Note>
O Gemini 3.1 Live aceita texto conversacional pela entrada em tempo real e usa
chamadas de função sequenciais. O OpenClaw omite os campos antigos de `NON_BLOCKING`, agendamento
de respostas de função e diálogo afetivo para esse modelo. Prefira
`thinkingLevel`; valores positivos configurados de `thinkingBudget` são mapeados para o
nível compatível mais próximo, enquanto `-1` mantém o padrão do Google. Consulte a
[comparação de recursos do Gemini Live](https://ai.google.dev/gemini-api/docs/live-api/capabilities).
</Note>

<Note>
O Talk da Control UI é compatível com sessões do Google Live no navegador usando tokens
restritos de uso único. Provedores de voz em tempo real exclusivos do backend também podem operar
pelo transporte de retransmissão genérico do Gateway, que mantém as credenciais do provedor no Gateway.
</Note>

Para a verificação em ambiente ativo pelos mantenedores, execute
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
O teste de fumaça também abrange os caminhos de backend/WebRTC da OpenAI; a etapa do Google emite o mesmo
formato restrito de token da API Live usado pelo Talk da Control UI, abre o endpoint
WebSocket do navegador, envia a carga útil de configuração inicial e aguarda
`setupComplete`.

## Configuração avançada

<AccordionGroup>
  <Accordion title="Reutilização direta do cache do Gemini">
    Para execuções diretas da API Gemini (`api: "google-generative-ai"`), o OpenClaw
    repassa um identificador `cachedContent` configurado às solicitações do Gemini.

    - Configure parâmetros globais ou por modelo com
      `cachedContent` ou com a opção legada `cached_content`
    - Os parâmetros de um escopo mais específico (nível do modelo em vez do global) sempre prevalecem.
      No mesmo escopo, se ambas as chaves estiverem definidas, `cached_content` prevalece.
      Use apenas uma chave por escopo para evitar surpresas.
    - Valor de exemplo: `cachedContents/prebuilt-context`
    - O uso de acertos de cache do Gemini é normalizado no `cacheRead` do OpenClaw a partir
      do `cachedContentTokenCount` upstream

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "google/gemini-2.5-pro": {
              params: {
                cachedContent: "cachedContents/prebuilt-context",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Observações sobre o uso da CLI do Gemini">
    Ao usar o provedor OAuth `google-gemini-cli`, o OpenClaw usa, por padrão,
    a saída `stream-json` da CLI do Gemini e normaliza o uso da carga útil
    `stats` final. As substituições legadas de `--output-format json` ainda usam o
    analisador JSON.

    - O texto da resposta transmitida vem dos eventos `message` do assistente.
    - Para a saída JSON legada, o texto da resposta vem do campo `response` do JSON da CLI.
    - O uso recorre a `stats` quando a CLI deixa `usage` vazio.
    - `stats.cached` é normalizado no `cacheRead` do OpenClaw.
    - Se `stats.input` estiver ausente, o OpenClaw deriva os tokens de entrada de
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Configuração do ambiente e do daemon">
    Se o Gateway for executado como daemon (launchd/systemd), garanta que `GEMINI_API_KEY`
    esteja disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou por meio de
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelos e comportamento de failover.
  </Card>
  <Card title="Geração de imagens" href="/pt-BR/tools/image-generation" icon="image">
    Parâmetros compartilhados da ferramenta de imagens e seleção de provedores.
  </Card>
  <Card title="Geração de vídeos" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeos e seleção de provedores.
  </Card>
  <Card title="Geração de música" href="/pt-BR/tools/music-generation" icon="music">
    Parâmetros compartilhados da ferramenta de música e seleção de provedores.
  </Card>
</CardGroup>
