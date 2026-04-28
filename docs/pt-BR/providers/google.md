---
read_when:
    - Você quer usar modelos Google Gemini com o OpenClaw
    - Você precisa do fluxo de autenticação por chave de API ou OAuth
summary: Configuração do Google Gemini (chave de API + OAuth, geração de imagens, compreensão de mídia, TTS, pesquisa na web)
title: Google (Gemini)
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-26T11:36:46Z"
  model: gpt-5.4
  provider: openai
  source_hash: 312c7a5bc433831d98d1d47c42c5cac6a4cd8d4948ddbf16f1ae11aaec7a0339
  source_path: providers/google.md
  workflow: 15
---

O Plugin Google fornece acesso a modelos Gemini por meio do Google AI Studio, além de
geração de imagens, compreensão de mídia (imagem/áudio/vídeo), texto para fala e pesquisa na web via
Grounding do Gemini.

- Provider: `google`
- Autenticação: `GEMINI_API_KEY` ou `GOOGLE_API_KEY`
- API: Google Gemini API
- Opção de runtime: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  reutiliza o OAuth do Gemini CLI, mantendo refs de modelo canônicas como `google/*`.

## Primeiros passos

Escolha seu método de autenticação preferido e siga as etapas de configuração.

<Tabs>
  <Tab title="Chave de API">
    **Melhor para:** acesso padrão à Gemini API por meio do Google AI Studio.

    <Steps>
      <Step title="Executar o onboarding">
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
    As variáveis de ambiente `GEMINI_API_KEY` e `GOOGLE_API_KEY` são ambas aceitas. Use a que você já tiver configurada.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Melhor para:** reutilizar um login existente do Gemini CLI via OAuth PKCE em vez de uma chave de API separada.

    <Warning>
    O provider `google-gemini-cli` é uma integração não oficial. Alguns usuários
    relatam restrições de conta ao usar OAuth dessa forma. Use por sua conta e risco.
    </Warning>

    <Steps>
      <Step title="Instalar o Gemini CLI">
        O comando local `gemini` precisa estar disponível no `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # ou npm
        npm install -g @google/gemini-cli
        ```

        O OpenClaw oferece suporte tanto a instalações via Homebrew quanto a instalações globais via npm, incluindo
        layouts comuns de Windows/npm.
      </Step>
      <Step title="Fazer login via OAuth">
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

    **Variáveis de ambiente:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Ou as variantes `GEMINI_CLI_*`.)

    <Note>
    Se as requisições de OAuth do Gemini CLI falharem após o login, defina `GOOGLE_CLOUD_PROJECT` ou
    `GOOGLE_CLOUD_PROJECT_ID` no host do gateway e tente novamente.
    </Note>

    <Note>
    Se o login falhar antes do início do fluxo no navegador, certifique-se de que o comando local `gemini`
    está instalado e no `PATH`.
    </Note>

    Refs de modelo `google-gemini-cli/*` são aliases legados de compatibilidade. Novas
    configurações devem usar refs de modelo `google/*` mais o runtime
    `google-gemini-cli` quando quiserem execução local do Gemini CLI.

  </Tab>
</Tabs>

## Recursos

| Recurso                | Compatível                    |
| ---------------------- | ----------------------------- |
| Conclusões de chat     | Sim                           |
| Geração de imagens     | Sim                           |
| Geração de música      | Sim                           |
| Texto para fala        | Sim                           |
| Voz em tempo real      | Sim (Google Live API)         |
| Compreensão de imagem  | Sim                           |
| Transcrição de áudio   | Sim                           |
| Compreensão de vídeo   | Sim                           |
| Pesquisa na web (Grounding) | Sim                     |
| Thinking/raciocínio    | Sim (Gemini 2.5+ / Gemini 3+) |
| Modelos Gemma 4        | Sim                           |

<Tip>
Os modelos Gemini 3 usam `thinkingLevel` em vez de `thinkingBudget`. O OpenClaw mapeia
controles de raciocínio do Gemini 3, Gemini 3.1 e aliases `gemini-*-latest` para
`thinkingLevel`, para que execuções padrão/de baixa latência não enviem valores
desativados de `thinkingBudget`.

`/think adaptive` mantém a semântica de thinking dinâmico do Google em vez de escolher
um nível fixo do OpenClaw. Gemini 3 e Gemini 3.1 omitem um `thinkingLevel` fixo para que
o Google possa escolher o nível; Gemini 2.5 envia o sentinela dinâmico do Google
`thinkingBudget: -1`.

Os modelos Gemma 4 (por exemplo `gemma-4-26b-a4b-it`) oferecem suporte ao modo thinking. O OpenClaw
reescreve `thinkingBudget` para um `thinkingLevel` compatível do Google para Gemma 4.
Definir thinking como `off` preserva thinking desativado em vez de mapear para
`MINIMAL`.
</Tip>

## Geração de imagens

O provider integrado de geração de imagens `google` usa por padrão
`google/gemini-3.1-flash-image-preview`.

- Também oferece suporte a `google/gemini-3-pro-image-preview`
- Geração: até 4 imagens por requisição
- Modo de edição: ativado, até 5 imagens de entrada
- Controles de geometria: `size`, `aspectRatio` e `resolution`

Para usar o Google como provider de imagem padrão:

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
Consulte [Geração de imagens](/pt-BR/tools/image-generation) para parâmetros compartilhados da ferramenta, seleção de provider e comportamento de failover.
</Note>

## Geração de vídeo

O Plugin integrado `google` também registra geração de vídeo por meio da ferramenta compartilhada
`video_generate`.

- Modelo de vídeo padrão: `google/veo-3.1-fast-generate-preview`
- Modos: texto para vídeo, imagem para vídeo e fluxos de referência de vídeo único
- Oferece suporte a `aspectRatio`, `resolution` e `audio`
- Limite atual de duração: **4 a 8 segundos**

Para usar o Google como provider de vídeo padrão:

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
Consulte [Geração de vídeo](/pt-BR/tools/video-generation) para parâmetros compartilhados da ferramenta, seleção de provider e comportamento de failover.
</Note>

## Geração de música

O Plugin integrado `google` também registra geração de música por meio da ferramenta compartilhada
`music_generate`.

- Modelo de música padrão: `google/lyria-3-clip-preview`
- Também oferece suporte a `google/lyria-3-pro-preview`
- Controles de prompt: `lyrics` e `instrumental`
- Formato de saída: `mp3` por padrão, além de `wav` em `google/lyria-3-pro-preview`
- Entradas de referência: até 10 imagens
- Execuções com suporte de sessão são destacadas por meio do fluxo compartilhado de tarefa/status, incluindo `action: "status"`

Para usar o Google como provider de música padrão:

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
Consulte [Geração de música](/pt-BR/tools/music-generation) para parâmetros compartilhados da ferramenta, seleção de provider e comportamento de failover.
</Note>

## Texto para fala

O provider de fala integrado `google` usa o caminho TTS da Gemini API com
`gemini-3.1-flash-tts-preview`.

- Voz padrão: `Kore`
- Autenticação: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` ou `GOOGLE_API_KEY`
- Saída: WAV para anexos regulares de TTS, Opus para destinos de nota de voz, PCM para Talk/telefonia
- Saída de nota de voz: o PCM do Google é encapsulado como WAV e transcodificado para Opus 48 kHz com `ffmpeg`

Para usar o Google como provider de TTS padrão:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
          audioProfile: "Fale profissionalmente com um tom calmo.",
        },
      },
    },
  },
}
```

O TTS da Gemini API usa prompting em linguagem natural para controle de estilo. Defina
`audioProfile` para prefixar um prompt de estilo reutilizável antes do texto falado. Defina
`speakerName` quando o texto do seu prompt fizer referência a um locutor nomeado.

O TTS da Gemini API também aceita tags expressivas de áudio entre colchetes no texto,
como `[whispers]` ou `[laughs]`. Para manter as tags fora da resposta visível no chat
enquanto as envia ao TTS, coloque-as dentro de um bloco `[[tts:text]]...[[/tts:text]]`:

```text
Aqui está o texto limpo da resposta.

[[tts:text]][whispers] Aqui está a versão falada.[[/tts:text]]
```

<Note>
Uma chave de API do Google Cloud Console restrita à Gemini API é válida para este
provider. Este não é o caminho separado da Cloud Text-to-Speech API.
</Note>

## Voz em tempo real

O Plugin integrado `google` registra um provider de voz em tempo real com suporte da
Gemini Live API para bridges de áudio de backend, como Voice Call e Google Meet.

| Configuração          | Caminho da configuração                                               | Padrão                                                                               |
| --------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Modelo                | `plugins.entries.voice-call.config.realtime.providers.google.model`   | `gemini-2.5-flash-native-audio-preview-12-2025`                                      |
| Voz                   | `...google.voice`                                                     | `Kore`                                                                               |
| Temperature           | `...google.temperature`                                               | (não definido)                                                                       |
| Sensibilidade de início do VAD | `...google.startSensitivity`                                | (não definido)                                                                       |
| Sensibilidade de fim do VAD | `...google.endSensitivity`                                      | (não definido)                                                                       |
| Duração do silêncio   | `...google.silenceDurationMs`                                         | (não definido)                                                                       |
| Chave de API          | `...google.apiKey`                                                    | Usa como fallback `models.providers.google.apiKey`, `GEMINI_API_KEY` ou `GOOGLE_API_KEY` |

Exemplo de configuração realtime do Voice Call:

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
                voice: "Kore",
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
A Google Live API usa áudio bidirecional e chamadas de função por WebSocket.
O OpenClaw adapta o áudio da bridge de telefonia/Meet ao stream PCM da Live API do Gemini e
mantém as chamadas de ferramenta no contrato compartilhado de voz em tempo real. Deixe `temperature`
sem definir, a menos que precise de mudanças de sampling; o OpenClaw omite valores não positivos
porque o Google Live pode retornar transcrições sem áudio para `temperature: 0`.
A transcrição da Gemini API é ativada sem `languageCodes`; o SDK atual do Google
rejeita dicas de código de idioma nesse caminho de API.
</Note>

<Note>
Sessões Talk de navegador da Control UI ainda exigem um provider de voz em tempo real com uma
implementação de sessão WebRTC no navegador. Hoje esse caminho é OpenAI Realtime; o
provider do Google é para bridges realtime de backend.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Reutilização direta do cache do Gemini">
    Para execuções diretas da Gemini API (`api: "google-generative-ai"`), o OpenClaw
    repassa um identificador `cachedContent` configurado para requisições do Gemini.

    - Configure parâmetros por modelo ou globais com
      `cachedContent` ou o legado `cached_content`
    - Se ambos estiverem presentes, `cachedContent` prevalece
    - Valor de exemplo: `cachedContents/prebuilt-context`
    - O uso de cache-hit do Gemini é normalizado para `cacheRead` no OpenClaw a partir de
      `cachedContentTokenCount` do upstream

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

  <Accordion title="Observações de uso de JSON do Gemini CLI">
    Ao usar o provider OAuth `google-gemini-cli`, o OpenClaw normaliza
    a saída JSON da CLI da seguinte forma:

    - O texto da resposta vem do campo JSON `response` da CLI.
    - O uso recorre a `stats` quando a CLI deixa `usage` vazio.
    - `stats.cached` é normalizado para `cacheRead` no OpenClaw.
    - Se `stats.input` estiver ausente, o OpenClaw deriva os tokens de entrada de
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Ambiente e configuração de daemon">
    Se o Gateway for executado como daemon (launchd/systemd), certifique-se de que `GEMINI_API_KEY`
    esteja disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou via
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolhendo providers, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Geração de imagens" href="/pt-BR/tools/image-generation" icon="image">
    Parâmetros compartilhados da ferramenta de imagem e seleção de provider.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provider.
  </Card>
  <Card title="Geração de música" href="/pt-BR/tools/music-generation" icon="music">
    Parâmetros compartilhados da ferramenta de música e seleção de provider.
  </Card>
</CardGroup>
