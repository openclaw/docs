---
read_when:
    - Você deseja usar modelos Google Gemini com o OpenClaw
    - Você precisa da chave de API ou do fluxo de autenticação OAuth
summary: Configuração do Google Gemini (chave de API + OAuth, geração de imagens, compreensão de mídia, TTS, pesquisa na web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-05-04T05:54:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e45627f5d5cd57e858c7590a90435b7fc0e9381509f3312a16fc9e9a4cbd908
    source_path: providers/google.md
    workflow: 16
---

O Plugin do Google fornece acesso aos modelos Gemini por meio do Google AI Studio, além de
geração de imagens, compreensão de mídia (imagem/áudio/vídeo), conversão de texto em fala e pesquisa na web via
Gemini Grounding.

- Provedor: `google`
- Autenticação: `GEMINI_API_KEY` ou `GOOGLE_API_KEY`
- API: Google Gemini API
- Opção de runtime: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  reutiliza o OAuth da Gemini CLI enquanto mantém as refs de modelo canônicas como `google/*`.

## Primeiros passos

Escolha seu método de autenticação preferido e siga as etapas de configuração.

<Tabs>
  <Tab title="Chave de API">
    **Ideal para:** acesso padrão à Gemini API por meio do Google AI Studio.

    <Steps>
      <Step title="Executar integração">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Ou informe a chave diretamente:

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
    As variáveis de ambiente `GEMINI_API_KEY` e `GOOGLE_API_KEY` são aceitas. Use a que você já tiver configurado.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Ideal para:** reutilizar um login existente da Gemini CLI via PKCE OAuth em vez de uma chave de API separada.

    <Warning>
    O provedor `google-gemini-cli` é uma integração não oficial. Alguns usuários
    relatam restrições de conta ao usar OAuth dessa forma. Use por sua conta e risco.
    </Warning>

    <Steps>
      <Step title="Instalar a Gemini CLI">
        O comando local `gemini` deve estar disponível no `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
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

    O ID do modelo Gemini API do Gemini 3.1 Pro é `gemini-3.1-pro-preview`. O OpenClaw aceita o `google/gemini-3.1-pro` mais curto como um alias de conveniência e o normaliza antes das chamadas ao provedor.

    **Variáveis de ambiente:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Ou as variantes `GEMINI_CLI_*`.)

    <Note>
    Se as solicitações de OAuth da Gemini CLI falharem após o login, defina `GOOGLE_CLOUD_PROJECT` ou
    `GOOGLE_CLOUD_PROJECT_ID` no host do Gateway e tente novamente.
    </Note>

    <Note>
    Se o login falhar antes do início do fluxo no navegador, confirme se o comando local `gemini`
    está instalado e no `PATH`.
    </Note>

    Refs de modelo `google-gemini-cli/*` são aliases de compatibilidade legada. Novas
    configurações devem usar refs de modelo `google/*` mais o runtime `google-gemini-cli`
    quando quiserem execução local da Gemini CLI.

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
| Pensamento/raciocínio  | Sim (Gemini 2.5+ / Gemini 3+) |
| Modelos Gemma 4        | Sim                           |

## Pesquisa na web

O provedor de pesquisa na web `gemini` incluído usa grounding da Pesquisa Google do Gemini.
Configure uma chave de pesquisa dedicada em `plugins.entries.google.config.webSearch`,
ou permita que ele reutilize `models.providers.google.apiKey` após `GEMINI_API_KEY`:

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

A precedência de credenciais é `webSearch.apiKey` dedicada, depois `GEMINI_API_KEY`,
depois `models.providers.google.apiKey`. `webSearch.baseUrl` é opcional e
existe para proxies de operadores ou endpoints compatíveis da Gemini API; quando omitida,
a pesquisa na web do Gemini reutiliza `models.providers.google.baseUrl`. Consulte
[Pesquisa Gemini](/pt-BR/tools/gemini-search) para o comportamento da ferramenta específico do provedor.

<Tip>
Modelos Gemini 3 usam `thinkingLevel` em vez de `thinkingBudget`. O OpenClaw mapeia
controles de raciocínio de aliases Gemini 3, Gemini 3.1 e `gemini-*-latest` para
`thinkingLevel` para que execuções padrão/de baixa latência não enviem valores
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
Consulte [Geração de imagens](/pt-BR/tools/image-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

## Geração de vídeo

O Plugin `google` incluído também registra geração de vídeo por meio da ferramenta compartilhada
`video_generate`.

- Modelo de vídeo padrão: `google/veo-3.1-fast-generate-preview`
- Modos: texto para vídeo, imagem para vídeo e fluxos de referência de vídeo único
- Oferece suporte a `aspectRatio`, `resolution` e `audio`
- Limite de duração atual: **4 a 8 segundos**

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
- Execuções com respaldo de sessão se destacam por meio do fluxo compartilhado de tarefa/status, incluindo `action: "status"`

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
Consulte [Geração de música](/pt-BR/tools/music-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

## Conversão de texto em fala

O provedor de fala `google` incluído usa o caminho de TTS da Gemini API com
`gemini-3.1-flash-tts-preview`.

- Voz padrão: `Kore`
- Autenticação: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` ou `GOOGLE_API_KEY`
- Saída: WAV para anexos TTS regulares, Opus para destinos de nota de voz, PCM para Talk/telefonia
- Saída de nota de voz: o PCM do Google é encapsulado como WAV e transcodificado para Opus a 48 kHz com `ffmpeg`

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
          voiceName: "Kore",
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

A TTS da Gemini API usa prompts em linguagem natural para controle de estilo. Defina
`audioProfile` para prefixar um prompt de estilo reutilizável antes do texto falado. Defina
`speakerName` quando o texto do seu prompt se referir a uma pessoa nomeada.

A TTS da Gemini API também aceita tags de áudio expressivas entre colchetes no texto,
como `[whispers]` ou `[laughs]`. Para manter as tags fora da resposta visível do chat
enquanto as envia para TTS, coloque-as dentro de um bloco `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Uma chave de API do Google Cloud Console restrita à Gemini API é válida para este
provedor. Este não é o caminho separado da Cloud Text-to-Speech API.
</Note>

## Voz em tempo real

O Plugin `google` incluído registra um provedor de voz em tempo real respaldado pela
Gemini Live API para pontes de áudio de backend, como Voice Call e Google Meet.

| Configuração               | Caminho da configuração                                             | Padrão                                                                                |
| -------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Modelo                     | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Voz                        | `...google.voice`                                                   | `Kore`                                                                                |
| Temperatura                | `...google.temperature`                                             | (não definido)                                                                        |
| Sensibilidade de início VAD | `...google.startSensitivity`                                        | (não definido)                                                                        |
| Sensibilidade de fim VAD   | `...google.endSensitivity`                                          | (não definido)                                                                        |
| Duração do silêncio        | `...google.silenceDurationMs`                                       | (não definido)                                                                        |
| Tratamento de atividade    | `...google.activityHandling`                                        | Padrão do Google, `start-of-activity-interrupts`                                      |
| Cobertura do turno         | `...google.turnCoverage`                                            | Padrão do Google, `only-activity`                                                     |
| Desativar VAD automático   | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| Retomada de sessão         | `...google.sessionResumption`                                       | `true`                                                                                |
| Compressão de contexto     | `...google.contextWindowCompression`                                | `true`                                                                                |
| Chave de API               | `...google.apiKey`                                                  | Usa como fallback `models.providers.google.apiKey`, `GEMINI_API_KEY` ou `GOOGLE_API_KEY` |

Exemplo de configuração em tempo real de Chamada de Voz:

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
A Google Live API usa áudio bidirecional e chamadas de função por um WebSocket.
O OpenClaw adapta o áudio da ponte de telefonia/Meet ao stream PCM Live API do Gemini e
mantém as chamadas de ferramenta no contrato de voz em tempo real compartilhado. Deixe `temperature`
sem definir, a menos que você precise de alterações de amostragem; o OpenClaw omite valores não positivos
porque o Google Live pode retornar transcrições sem áudio para `temperature: 0`.
A transcrição da Gemini API é habilitada sem `languageCodes`; o SDK atual do Google
rejeita dicas de código de idioma nesse caminho de API.
</Note>

<Note>
O Talk da UI de controle oferece suporte a sessões do navegador do Google Live com tokens
restritos de uso único. Provedores de voz em tempo real somente de backend também podem executar pelo transporte
de relay genérico do Gateway, que mantém as credenciais do provedor no Gateway.
</Note>

Para verificação live de mantenedor, execute
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
A etapa do Google emite o mesmo formato de token restrito da Live API usado pelo Talk da UI de controle,
abre o endpoint WebSocket do navegador, envia a carga inicial de configuração
e aguarda por `setupComplete`.

## Configuração avançada

<AccordionGroup>
  <Accordion title="Reutilização direta de cache do Gemini">
    Para execuções diretas da Gemini API (`api: "google-generative-ai"`), o OpenClaw
    passa um identificador `cachedContent` configurado para as solicitações do Gemini.

    - Configure parâmetros por modelo ou globais com
      `cachedContent` ou o legado `cached_content`
    - Se ambos estiverem presentes, `cachedContent` vence
    - Valor de exemplo: `cachedContents/prebuilt-context`
    - O uso de cache-hit do Gemini é normalizado para `cacheRead` do OpenClaw a partir de
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

  <Accordion title="Notas de uso de JSON da CLI do Gemini">
    Ao usar o provedor OAuth `google-gemini-cli`, o OpenClaw normaliza
    a saída JSON da CLI da seguinte forma:

    - O texto da resposta vem do campo `response` do JSON da CLI.
    - O uso usa `stats` como fallback quando a CLI deixa `usage` vazio.
    - `stats.cached` é normalizado para `cacheRead` do OpenClaw.
    - Se `stats.input` estiver ausente, o OpenClaw deriva tokens de entrada de
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Configuração de ambiente e daemon">
    Se o Gateway executar como um daemon (launchd/systemd), confirme que `GEMINI_API_KEY`
    esteja disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou via
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Geração de imagem" href="/pt-BR/tools/image-generation" icon="image">
    Parâmetros compartilhados da ferramenta de imagem e seleção de provedor.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provedor.
  </Card>
  <Card title="Geração de música" href="/pt-BR/tools/music-generation" icon="music">
    Parâmetros compartilhados da ferramenta de música e seleção de provedor.
  </Card>
</CardGroup>
