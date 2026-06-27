---
read_when:
    - Você quer usar modelos Google Gemini com o OpenClaw
    - Você precisa da chave de API ou do fluxo de autenticação OAuth
summary: Configuração do Google Gemini (chave de API + OAuth, geração de imagens, compreensão de mídia, TTS, pesquisa na web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-06-27T18:03:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eced20b11cc702d803992d96dcc5edb8f06640f6baffbc65dab504a6c91776bc
    source_path: providers/google.md
    workflow: 16
---

O Plugin do Google fornece acesso aos modelos Gemini por meio do Google AI Studio, além de
geração de imagens, compreensão de mídia (imagem/áudio/vídeo), conversão de texto em fala e pesquisa na web via
Gemini Grounding.

- Provedor: `google`
- Autenticação: `GEMINI_API_KEY` ou `GOOGLE_API_KEY`
- API: API Google Gemini
- Opção de runtime: provedor/modelo `agentRuntime.id: "google-gemini-cli"`
  reutiliza o OAuth do Gemini CLI enquanto mantém as referências de modelo canônicas como `google/*`.

## Primeiros passos

Escolha seu método de autenticação preferido e siga as etapas de configuração.

<Tabs>
  <Tab title="API key">
    **Melhor para:** acesso padrão à API Gemini por meio do Google AI Studio.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Ou passe a chave diretamente:

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="Set a default model">
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
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    As variáveis de ambiente `GEMINI_API_KEY` e `GOOGLE_API_KEY` são aceitas. Use a que você já tiver configurada.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Melhor para:** reutilizar um login existente do Gemini CLI via OAuth PKCE em vez de uma chave de API separada.

    <Warning>
    O provedor `google-gemini-cli` é uma integração não oficial. Alguns usuários
    relatam restrições de conta ao usar OAuth dessa forma. Use por sua conta e risco.
    </Warning>

    <Steps>
      <Step title="Install the Gemini CLI">
        O comando local `gemini` precisa estar disponível no `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        O OpenClaw oferece suporte a instalações via Homebrew e instalações globais via npm, incluindo
        layouts comuns do Windows/npm.
      </Step>
      <Step title="Log in via OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - Modelo padrão: `google/gemini-3.1-pro-preview`
    - Runtime: `google-gemini-cli`
    - Alias: `gemini-cli`

    O ID do modelo Gemini API do Gemini 3.1 Pro é `gemini-3.1-pro-preview`. O OpenClaw aceita o `google/gemini-3.1-pro` mais curto como um alias de conveniência e o normaliza antes das chamadas ao provedor.

    **Variáveis de ambiente:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Ou as variantes `GEMINI_CLI_*`.)

    <Note>
    Se as solicitações do OAuth do Gemini CLI falharem após o login, defina `GOOGLE_CLOUD_PROJECT` ou
    `GOOGLE_CLOUD_PROJECT_ID` no host do Gateway e tente novamente.
    </Note>

    <Note>
    Se o login falhar antes de o fluxo do navegador começar, confirme que o comando local `gemini`
    está instalado e no `PATH`.
    </Note>

    As referências de modelo `google-gemini-cli/*` são aliases de compatibilidade legados. Novas
    configurações devem usar referências de modelo `google/*` mais o runtime `google-gemini-cli`
    quando quiserem execução local pelo Gemini CLI.

  </Tab>
</Tabs>

## Capacidades

| Capacidade             | Compatível                    |
| ---------------------- | ----------------------------- |
| Conclusões de chat     | Sim                           |
| Geração de imagens     | Sim                           |
| Geração de música      | Sim                           |
| Conversão de texto em fala | Sim                       |
| Voz em tempo real      | Sim (Google Live API)         |
| Compreensão de imagens | Sim                           |
| Transcrição de áudio   | Sim                           |
| Compreensão de vídeo   | Sim                           |
| Pesquisa na web (Grounding) | Sim                      |
| Thinking/raciocínio    | Sim (Gemini 2.5+ / Gemini 3+) |
| Modelos Gemma 4        | Sim                           |

## Pesquisa na web

O provedor de pesquisa na web `gemini` incluído usa grounding do Google Search no Gemini.
Configure uma chave de pesquisa dedicada em `plugins.entries.google.config.webSearch`,
ou permita que ela reutilize `models.providers.google.apiKey` após `GEMINI_API_KEY`:

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // falls back to models.providers.google.baseUrl
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

A precedência das credenciais é `webSearch.apiKey` dedicada, depois `GEMINI_API_KEY`,
depois `models.providers.google.apiKey`. `webSearch.baseUrl` é opcional e
existe para proxies de operadores ou endpoints compatíveis da API Gemini; quando omitida,
a pesquisa na web do Gemini reutiliza `models.providers.google.baseUrl`. Consulte
[Pesquisa Gemini](/pt-BR/tools/gemini-search) para o comportamento da ferramenta específico do provedor.

<Tip>
Modelos Gemini 3 usam `thinkingLevel` em vez de `thinkingBudget`. O OpenClaw mapeia
controles de raciocínio de aliases Gemini 3, Gemini 3.1 e `gemini-*-latest` para
`thinkingLevel`, para que execuções padrão/de baixa latência não enviem valores
`thinkingBudget` desabilitados.

`/think adaptive` mantém a semântica de pensamento dinâmico do Google em vez de escolher
um nível fixo do OpenClaw. Gemini 3 e Gemini 3.1 omitem um `thinkingLevel` fixo para que
o Google possa escolher o nível; Gemini 2.5 envia o sentinela dinâmico do Google
`thinkingBudget: -1`.

Modelos Gemma 4 (por exemplo, `gemma-4-26b-a4b-it`) oferecem suporte ao modo de pensamento. O OpenClaw
reescreve `thinkingBudget` para um `thinkingLevel` compatível do Google para Gemma 4.
Definir o pensamento como `off` preserva o pensamento desabilitado em vez de mapear para
`MINIMAL`.
</Tip>

## Geração de imagens

O provedor de geração de imagens `google` incluído usa por padrão
`google/gemini-3.1-flash-image-preview`.

- Também oferece suporte a `google/gemini-3-pro-image-preview`
- Gerar: até 4 imagens por solicitação
- Modo de edição: habilitado, até 5 imagens de entrada
- Controles de geometria: `size`, `aspectRatio` e `resolution`

Para usar o Google como provedor padrão de imagens:

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
Consulte [Geração de Imagens](/pt-BR/tools/image-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

## Geração de vídeo

O Plugin `google` incluído também registra geração de vídeo por meio da ferramenta compartilhada
`video_generate`.

- Modelo de vídeo padrão: `google/veo-3.1-fast-generate-preview`
- Modos: fluxos de texto para vídeo, imagem para vídeo e referência de vídeo único
- Oferece suporte a `aspectRatio` (`16:9`, `9:16`) e `resolution` (`720P`, `1080P`); saída de áudio não é compatível com o Veo atualmente
- Durações compatíveis: **4, 6 ou 8 segundos** (outros valores são ajustados para o valor permitido mais próximo)

Para usar o Google como provedor padrão de vídeo:

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
Consulte [Geração de Vídeo](/pt-BR/tools/video-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

## Geração de música

O Plugin `google` incluído também registra geração de música por meio da ferramenta compartilhada
`music_generate`.

- Modelo de música padrão: `google/lyria-3-clip-preview`
- Também oferece suporte a `google/lyria-3-pro-preview`
- Controles de prompt: `lyrics` e `instrumental`
- Formato de saída: `mp3` por padrão, além de `wav` em `google/lyria-3-pro-preview`
- Entradas de referência: até 10 imagens
- Execuções com sessão se desvinculam pelo fluxo compartilhado de tarefa/status, incluindo `action: "status"`

Para usar o Google como provedor padrão de música:

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
Consulte [Geração de Música](/pt-BR/tools/music-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

## Conversão de texto em fala

O provedor de fala `google` incluído usa o caminho de TTS da API Gemini com
`gemini-3.1-flash-tts-preview`.

- Voz padrão: `Kore`
- Autenticação: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` ou `GOOGLE_API_KEY`
- Saída: WAV para anexos TTS regulares, Opus para destinos de notas de voz, PCM para Talk/telefonia
- Saída de nota de voz: o PCM do Google é encapsulado como WAV e transcodificado para Opus de 48 kHz com `ffmpeg`

O caminho TTS em lote do Gemini do Google retorna o áudio gerado na resposta
`generateContent` concluída. Para conversas faladas de menor latência, use o
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
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

O TTS da API Gemini usa prompts em linguagem natural para controle de estilo. Defina
`audioProfile` para prefixar um prompt de estilo reutilizável antes do texto falado. Defina
`speakerName` quando o texto do seu prompt se referir a um falante nomeado.

O TTS da API Gemini também aceita tags expressivas de áudio entre colchetes no texto,
como `[whispers]` ou `[laughs]`. Para manter as tags fora da resposta visível do chat
enquanto as envia ao TTS, coloque-as dentro de um bloco `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Uma chave de API do Google Cloud Console restrita à API Gemini é válida para este
provedor. Este não é o caminho separado da API Cloud Text-to-Speech.
</Note>

## Voz em tempo real

O Plugin `google` incluído registra um provedor de voz em tempo real baseado na
Gemini Live API para pontes de áudio de backend, como Voice Call e Google Meet.

| Configuração          | Caminho de configuração                                             | Padrão                                                                                |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Modelo                | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Voz                   | `...google.voice`                                                   | `Kore`                                                                                |
| Temperatura           | `...google.temperature`                                             | (não definido)                                                                        |
| Sensibilidade inicial de VAD | `...google.startSensitivity`                                        | (não definido)                                                                        |
| Sensibilidade final de VAD   | `...google.endSensitivity`                                          | (não definido)                                                                        |
| Duração do silêncio   | `...google.silenceDurationMs`                                       | (não definido)                                                                        |
| Tratamento de atividade | `...google.activityHandling`                                        | Padrão do Google, `start-of-activity-interrupts`                                      |
| Cobertura de turno    | `...google.turnCoverage`                                            | Padrão do Google, `only-activity`                                                     |
| Desativar VAD automático | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| Retomada de sessão    | `...google.sessionResumption`                                       | `true`                                                                                |
| Compressão de contexto | `...google.contextWindowCompression`                                | `true`                                                                                |
| Chave de API          | `...google.apiKey`                                                  | Recorre a `models.providers.google.apiKey`, `GEMINI_API_KEY` ou `GOOGLE_API_KEY` |

Exemplo de configuração em tempo real de Voice Call:

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
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                speakerVoice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "only-activity",
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
A Google Live API usa áudio bidirecional e chamada de função por um WebSocket.
O OpenClaw adapta o áudio da ponte de telefonia/Meet para o fluxo PCM da Live API do Gemini e
mantém as chamadas de ferramentas no contrato de voz em tempo real compartilhado. Deixe `temperature`
sem definição, a menos que você precise alterar a amostragem; o OpenClaw omite valores não positivos
porque o Google Live pode retornar transcrições sem áudio para `temperature: 0`.
A transcrição da Gemini API é ativada sem `languageCodes`; o SDK atual do Google
rejeita dicas de código de idioma nesse caminho de API.
</Note>

<Note>
O Control UI Talk oferece suporte a sessões do Google Live no navegador com tokens
restritos de uso único. Provedores de voz em tempo real apenas de backend também podem ser executados pelo transporte genérico
de relay do Gateway, que mantém as credenciais do provedor no Gateway.
</Note>

Para verificação ao vivo por mantenedores, execute
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
O smoke também cobre caminhos de backend/WebRTC da OpenAI; a etapa do Google emite o mesmo
formato de token restrito da Live API usado pelo Control UI Talk, abre o endpoint
WebSocket do navegador, envia a carga inicial de configuração e aguarda
`setupComplete`.

## Configuração avançada

<AccordionGroup>
  <Accordion title="Direct Gemini cache reuse">
    Para execuções diretas da Gemini API (`api: "google-generative-ai"`), o OpenClaw
    repassa um identificador `cachedContent` configurado para as solicitações ao Gemini.

    - Configure parâmetros por modelo ou globais com
      `cachedContent` ou o legado `cached_content`
    - Se ambos estiverem presentes, `cachedContent` prevalece
    - Valor de exemplo: `cachedContents/prebuilt-context`
    - O uso de acertos de cache do Gemini é normalizado no `cacheRead` do OpenClaw a partir de
      `cachedContentTokenCount` upstream

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

  <Accordion title="Gemini CLI usage notes">
    Ao usar o provedor OAuth `google-gemini-cli`, o OpenClaw usa a saída
    `stream-json` da Gemini CLI por padrão e normaliza o uso a partir da carga final
    `stats`. Substituições legadas de `--output-format json` ainda usam o
    analisador JSON.

    - O texto da resposta transmitida vem de eventos `message` do assistente.
    - Para saída JSON legada, o texto da resposta vem do campo `response` do JSON da CLI.
    - O uso recorre a `stats` quando a CLI deixa `usage` vazio.
    - `stats.cached` é normalizado no `cacheRead` do OpenClaw.
    - Se `stats.input` estiver ausente, o OpenClaw deriva os tokens de entrada de
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Environment and daemon setup">
    Se o Gateway for executado como um daemon (launchd/systemd), garanta que `GEMINI_API_KEY`
    esteja disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou via
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Model selection" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Image generation" href="/pt-BR/tools/image-generation" icon="image">
    Parâmetros compartilhados da ferramenta de imagem e seleção de provedor.
  </Card>
  <Card title="Video generation" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provedor.
  </Card>
  <Card title="Music generation" href="/pt-BR/tools/music-generation" icon="music">
    Parâmetros compartilhados da ferramenta de música e seleção de provedor.
  </Card>
</CardGroup>
