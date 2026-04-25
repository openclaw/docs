---
read_when:
    - Você quer usar modelos Google Gemini com o OpenClaw
    - Você precisa da chave de API ou do fluxo de autenticação OAuth
summary: Configuração do Google Gemini (chave de API + OAuth, geração de imagens, compreensão de mídia, TTS, pesquisa na web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-25T13:54:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: de0d6563d1c7a25fe26aa7ce255b1d3ed80e950b7761039e6d0a76f23a14e6f3
    source_path: providers/google.md
    workflow: 15
---

O Plugin Google fornece acesso aos modelos Gemini por meio do Google AI Studio, além de
geração de imagens, compreensão de mídia (imagem/áudio/vídeo), conversão de texto em fala e pesquisa na web via
Gemini Grounding.

- Provedor: `google`
- Autenticação: `GEMINI_API_KEY` ou `GOOGLE_API_KEY`
- API: API Google Gemini
- Opção de runtime: `agents.defaults.embeddedHarness.runtime: "google-gemini-cli"`
  reutiliza o OAuth do Gemini CLI enquanto mantém as referências de modelo canônicas como `google/*`.

## Primeiros passos

Escolha seu método de autenticação preferido e siga as etapas de configuração.

<Tabs>
  <Tab title="Chave de API">
    **Melhor para:** acesso padrão à API Gemini por meio do Google AI Studio.

    <Steps>
      <Step title="Executar a configuração inicial">
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
    O provedor `google-gemini-cli` é uma integração não oficial. Alguns usuários
    relatam restrições de conta ao usar OAuth dessa forma. Use por sua conta e risco.
    </Warning>

    <Steps>
      <Step title="Instalar o Gemini CLI">
        O comando local `gemini` deve estar disponível no `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # ou npm
        npm install -g @google/gemini-cli
        ```

        O OpenClaw oferece suporte tanto a instalações via Homebrew quanto a instalações globais via npm, incluindo
        layouts comuns do Windows/npm.
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
    Se as solicitações do OAuth do Gemini CLI falharem após o login, defina `GOOGLE_CLOUD_PROJECT` ou
    `GOOGLE_CLOUD_PROJECT_ID` no host do gateway e tente novamente.
    </Note>

    <Note>
    Se o login falhar antes de o fluxo no navegador começar, verifique se o comando local `gemini`
    está instalado e disponível no `PATH`.
    </Note>

    As referências de modelo `google-gemini-cli/*` são aliases legados de compatibilidade. Novas
    configurações devem usar referências de modelo `google/*` mais o runtime `google-gemini-cli`
    quando quiserem execução local pelo Gemini CLI.

  </Tab>
</Tabs>

## Recursos

| Recurso                | Compatível                    |
| ---------------------- | ----------------------------- |
| Completações de chat   | Sim                           |
| Geração de imagens     | Sim                           |
| Geração de música      | Sim                           |
| Conversão de texto em fala | Sim                       |
| Voz em tempo real      | Sim (Google Live API)         |
| Compreensão de imagem  | Sim                           |
| Transcrição de áudio   | Sim                           |
| Compreensão de vídeo   | Sim                           |
| Pesquisa na web (Grounding) | Sim                      |
| Thinking/raciocínio    | Sim (Gemini 2.5+ / Gemini 3+) |
| Modelos Gemma 4        | Sim                           |

<Tip>
Os modelos Gemini 3 usam `thinkingLevel` em vez de `thinkingBudget`. O OpenClaw mapeia
os controles de raciocínio dos aliases Gemini 3, Gemini 3.1 e `gemini-*-latest` para
`thinkingLevel`, para que execuções padrão/de baixa latência não enviem valores
de `thinkingBudget` desabilitados.

`/think adaptive` mantém a semântica de thinking dinâmico do Google em vez de escolher
um nível fixo do OpenClaw. O Gemini 3 e o Gemini 3.1 omitem um `thinkingLevel` fixo para que
o Google possa escolher o nível; o Gemini 2.5 envia o sentinela dinâmico do Google
`thinkingBudget: -1`.

Os modelos Gemma 4 (por exemplo `gemma-4-26b-a4b-it`) oferecem suporte ao modo thinking. O OpenClaw
reescreve `thinkingBudget` para um `thinkingLevel` do Google compatível para o Gemma 4.
Definir thinking como `off` preserva o thinking desabilitado em vez de mapear para
`MINIMAL`.
</Tip>

## Geração de imagens

O provedor de geração de imagens `google` incluído por padrão usa
`google/gemini-3.1-flash-image-preview`.

- Também oferece suporte a `google/gemini-3-pro-image-preview`
- Gerar: até 4 imagens por solicitação
- Modo de edição: habilitado, até 5 imagens de entrada
- Controles de geometria: `size`, `aspectRatio` e `resolution`

Para usar o Google como provedor de imagem padrão:

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
Consulte [Geração de imagens](/pt-BR/tools/image-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

## Geração de vídeo

O Plugin `google` incluído também registra geração de vídeo por meio da ferramenta compartilhada
`video_generate`.

- Modelo de vídeo padrão: `google/veo-3.1-fast-generate-preview`
- Modos: texto para vídeo, imagem para vídeo e fluxos de referência de vídeo único
- Suporta `aspectRatio`, `resolution` e `audio`
- Limite atual de duração: **4 a 8 segundos**

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
Consulte [Geração de vídeo](/pt-BR/tools/video-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

## Geração de música

O Plugin `google` incluído também registra geração de música por meio da ferramenta compartilhada
`music_generate`.

- Modelo de música padrão: `google/lyria-3-clip-preview`
- Também oferece suporte a `google/lyria-3-pro-preview`
- Controles de prompt: `lyrics` e `instrumental`
- Formato de saída: `mp3` por padrão, além de `wav` em `google/lyria-3-pro-preview`
- Entradas de referência: até 10 imagens
- Execuções com sessão em segundo plano se desacoplam por meio do fluxo compartilhado de tarefa/status, incluindo `action: "status"`

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
Consulte [Geração de música](/pt-BR/tools/music-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

## Conversão de texto em fala

O provedor de fala `google` incluído usa o caminho de TTS da API Gemini com
`gemini-3.1-flash-tts-preview`.

- Voz padrão: `Kore`
- Autenticação: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` ou `GOOGLE_API_KEY`
- Saída: WAV para anexos normais de TTS, PCM para Talk/telefonia
- Saída nativa de mensagem de voz: não compatível neste caminho da API Gemini porque a API retorna PCM em vez de Opus

Para usar o Google como provedor de TTS padrão:

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

O TTS da API Gemini usa prompting em linguagem natural para controle de estilo. Defina
`audioProfile` para prefixar um prompt de estilo reutilizável antes do texto falado. Defina
`speakerName` quando o texto do seu prompt se referir a um locutor nomeado.

O TTS da API Gemini também aceita tags expressivas de áudio entre colchetes no texto,
como `[whispers]` ou `[laughs]`. Para manter as tags fora da resposta visível no chat
enquanto as envia para o TTS, coloque-as dentro de um bloco `[[tts:text]]...[[/tts:text]]`:

```text
Aqui está o texto limpo da resposta.

[[tts:text]][whispers] Aqui está a versão falada.[[/tts:text]]
```

<Note>
Uma chave de API do Google Cloud Console restrita à API Gemini é válida para este
provedor. Este não é o caminho separado da API Cloud Text-to-Speech.
</Note>

## Voz em tempo real

O Plugin `google` incluído registra um provedor de voz em tempo real baseado na
Gemini Live API para pontes de áudio de backend como Voice Call e Google Meet.

| Configuração          | Caminho de configuração                                              | Padrão                                                                                |
| --------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Modelo                | `plugins.entries.voice-call.config.realtime.providers.google.model`  | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Voz                   | `...google.voice`                                                    | `Kore`                                                                                |
| Temperature           | `...google.temperature`                                              | (não definido)                                                                        |
| Sensibilidade de início do VAD | `...google.startSensitivity`                               | (não definido)                                                                        |
| Sensibilidade de fim do VAD | `...google.endSensitivity`                                     | (não definido)                                                                        |
| Duração do silêncio   | `...google.silenceDurationMs`                                        | (não definido)                                                                        |
| Chave de API          | `...google.apiKey`                                                   | Usa `models.providers.google.apiKey`, `GEMINI_API_KEY` ou `GOOGLE_API_KEY` como fallback |

Exemplo de configuração em tempo real do Voice Call:

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
O OpenClaw adapta o áudio de telefonia/ponte do Meet ao stream PCM da Live API do Gemini e
mantém as chamadas de ferramenta no contrato compartilhado de voz em tempo real. Deixe `temperature`
não definido, a menos que você precise de alterações de amostragem; o OpenClaw omite valores não positivos
porque a Google Live pode retornar transcrições sem áudio para `temperature: 0`.
A transcrição da API Gemini é habilitada sem `languageCodes`; o SDK atual do Google
rejeita sugestões de código de idioma nesse caminho da API.
</Note>

<Note>
As sessões do navegador do Control UI Talk ainda exigem um provedor de voz em tempo real com uma
implementação de sessão WebRTC no navegador. Atualmente esse caminho é o OpenAI Realtime; o
provedor Google é para pontes de tempo real de backend.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Reutilização direta do cache do Gemini">
    Para execuções diretas da API Gemini (`api: "google-generative-ai"`), o OpenClaw
    passa um identificador `cachedContent` configurado diretamente para as solicitações do Gemini.

    - Configure parâmetros por modelo ou globais com
      `cachedContent` ou o legado `cached_content`
    - Se ambos estiverem presentes, `cachedContent` prevalece
    - Valor de exemplo: `cachedContents/prebuilt-context`
    - O uso de acerto de cache do Gemini é normalizado no OpenClaw como `cacheRead` a partir de
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

  <Accordion title="Observações sobre uso de JSON do Gemini CLI">
    Ao usar o provedor OAuth `google-gemini-cli`, o OpenClaw normaliza
    a saída JSON do CLI da seguinte forma:

    - O texto da resposta vem do campo `response` do JSON do CLI.
    - O uso recorre a `stats` quando o CLI deixa `usage` vazio.
    - `stats.cached` é normalizado no OpenClaw como `cacheRead`.
    - Se `stats.input` estiver ausente, o OpenClaw deriva os tokens de entrada de
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Configuração de ambiente e daemon">
    Se o Gateway for executado como um daemon (launchd/systemd), verifique se `GEMINI_API_KEY`
    está disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou via
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Geração de imagens" href="/pt-BR/tools/image-generation" icon="image">
    Parâmetros compartilhados da ferramenta de imagem e seleção de provedor.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provedor.
  </Card>
  <Card title="Geração de música" href="/pt-BR/tools/music-generation" icon="music">
    Parâmetros compartilhados da ferramenta de música e seleção de provedor.
  </Card>
</CardGroup>
