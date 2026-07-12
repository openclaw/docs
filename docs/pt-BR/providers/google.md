---
read_when:
    - Você quer usar os modelos Google Gemini com o OpenClaw
    - Você precisa da chave de API ou do fluxo de autenticação OAuth
summary: Configuração do Google Gemini (chave de API + OAuth, geração de imagens, compreensão de mídia, TTS, pesquisa na web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-07-12T15:33:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 423f9b048a705815e886690fa13f5b02f7e67707195b7b461f6b4765528a4756
    source_path: providers/google.md
    workflow: 16
---

O plugin do Google fornece acesso aos modelos Gemini por meio do Google AI Studio, além de geração de imagens, compreensão de mídia (imagem/áudio/vídeo), conversão de texto em fala e pesquisa na web via Gemini Grounding.

- Provedor: `google`
- Autenticação: `GEMINI_API_KEY` ou `GOOGLE_API_KEY`
- API: API Google Gemini
- Opção de runtime: `agentRuntime.id: "google-gemini-cli"` reutiliza o OAuth da Gemini CLI, mantendo as referências de modelo canônicas como `google/*`.

## Primeiros passos

Escolha seu método de autenticação preferido e siga as etapas de configuração.

<Tabs>
  <Tab title="Chave de API">
    **Mais indicado para:** acesso padrão à API Gemini por meio do Google AI Studio.

    <Steps>
      <Step title="Execute a integração inicial">
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
      <Step title="Defina um modelo padrão">
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
      <Step title="Verifique se o modelo está disponível">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    `GEMINI_API_KEY` e `GOOGLE_API_KEY` são aceitas. Use a que você já tiver configurado.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Mais indicado para:** reutilizar um login existente da Gemini CLI via OAuth com PKCE, em vez de usar uma chave de API separada.

    <Warning>
    O provedor `google-gemini-cli` é uma integração não oficial. Alguns usuários
    relatam restrições de conta ao usar o OAuth dessa forma. Use por sua conta e risco.
    </Warning>

    <Steps>
      <Step title="Instale a Gemini CLI">
        O comando local `gemini` deve estar disponível no `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # ou npm
        npm install -g @google/gemini-cli
        ```

        O OpenClaw é compatível tanto com instalações via Homebrew quanto com instalações globais via npm, incluindo
        layouts comuns do Windows/npm.
      </Step>
      <Step title="Faça login via OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Verifique se o modelo está disponível">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - Modelo padrão: `google/gemini-3.1-pro-preview`
    - Runtime: `google-gemini-cli`
    - Alias: `gemini-cli`

    O ID de modelo da API Gemini para o Gemini 3.1 Pro é `gemini-3.1-pro-preview`. Por conveniência, o OpenClaw aceita a forma abreviada `google/gemini-3.1-pro` como alias e a normaliza antes das chamadas ao provedor.

    **Variáveis de ambiente:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID` / `GEMINI_CLI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET` / `GEMINI_CLI_OAUTH_CLIENT_SECRET`

    <Note>
    Se as solicitações OAuth da Gemini CLI falharem após o login, defina `GOOGLE_CLOUD_PROJECT` ou
    `GOOGLE_CLOUD_PROJECT_ID` no host do Gateway e tente novamente.
    </Note>

    <Note>
    Se o login falhar antes do início do fluxo no navegador, verifique se o comando local `gemini`
    está instalado e disponível no `PATH`.
    </Note>

    As referências de modelo `google-gemini-cli/*` são aliases de compatibilidade legados. Novas
    configurações devem usar referências de modelo `google/*` juntamente com o runtime
    `google-gemini-cli` quando quiserem execução local pela Gemini CLI.

  </Tab>
</Tabs>

<Note>
`google/gemini-3-pro-preview` foi descontinuado em 2026-03-09; use `google/gemini-3.1-pro-preview` em seu lugar. Executar novamente a configuração da chave da API Gemini (`openclaw onboard --auth-choice gemini-api-key` ou `openclaw models auth login --provider google`) substitui um padrão configurado desatualizado pelo modelo atual.
</Note>

## Recursos

| Recurso                       | Compatível                       |
| ----------------------------- | -------------------------------- |
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

O provedor de pesquisa na web `gemini` incluído usa o grounding da Pesquisa Google do Gemini.
Configure uma chave de pesquisa dedicada em `plugins.entries.google.config.webSearch`
ou permita que ele reutilize `models.providers.google.apiKey` depois de `GEMINI_API_KEY`:

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // opcional se GEMINI_API_KEY ou models.providers.google.apiKey estiver definida
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // usa models.providers.google.baseUrl como alternativa
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

A precedência de credenciais é `webSearch.apiKey` dedicada, depois `GEMINI_API_KEY`
e, por fim, `models.providers.google.apiKey`. `webSearch.baseUrl` é opcional e
existe para proxies de operadores ou endpoints compatíveis com a API Gemini; quando omitida,
a pesquisa na web do Gemini reutiliza `models.providers.google.baseUrl`. Consulte
[Pesquisa do Gemini](/pt-BR/tools/gemini-search) para conhecer o comportamento da ferramenta específico do provedor.

<Tip>
Os modelos Gemini 3 usam `thinkingLevel` em vez de `thinkingBudget`. O OpenClaw mapeia
os controles de raciocínio do Gemini 3, Gemini 3.1 e dos aliases `gemini-*-latest` para
`thinkingLevel`, para que execuções padrão/de baixa latência não enviem valores
desativados de `thinkingBudget`.

`/think adaptive` mantém a semântica de pensamento dinâmico do Google em vez de escolher
um nível fixo do OpenClaw. O Gemini 3 e o Gemini 3.1 omitem um `thinkingLevel` fixo para que
o Google possa escolher o nível; o Gemini 2.5 envia o valor sentinela dinâmico do Google
`thinkingBudget: -1`.

Os modelos Gemma 4 (por exemplo, `gemma-4-26b-a4b-it`) são compatíveis com o modo de pensamento. O OpenClaw
reescreve `thinkingBudget` para um `thinkingLevel` do Google compatível com o Gemma 4.
Definir o pensamento como `off` mantém o pensamento desativado, em vez de mapeá-lo para
`MINIMAL`.

O Gemini 2.5 Pro funciona apenas no modo de pensamento e rejeita um
`thinkingBudget: 0` explícito; o OpenClaw remove esse valor das solicitações do Gemini 2.5 Pro
em vez de enviá-lo.
</Tip>

## Geração de imagens

O provedor de geração de imagens `google` incluído usa como padrão
`google/gemini-3.1-flash-image-preview`.

- Também é compatível com `google/gemini-3-pro-image-preview`
- Geração: até 4 imagens por solicitação
- Modo de edição: habilitado, com até 5 imagens de entrada
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

O plugin `google` incluído também registra a geração de vídeo por meio da ferramenta compartilhada
`video_generate`.

- Modelo de vídeo padrão: `google/veo-3.1-fast-generate-preview`
- Modos: texto para vídeo, imagem para vídeo e fluxos de referência com um único vídeo
- Compatível com `aspectRatio` (`16:9`, `9:16`) e `resolution` (`720P`, `1080P`); atualmente, o Veo não é compatível com saída de áudio
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

O plugin `google` incluído também registra a geração de música por meio da ferramenta compartilhada
`music_generate`.

- Modelo de música padrão: `google/lyria-3-clip-preview`
- Também é compatível com `google/lyria-3-pro-preview`
- Controles do prompt: `lyrics` e `instrumental`
- Formato de saída: `mp3` por padrão, além de `wav` em `google/lyria-3-pro-preview`
- Entradas de referência: até 10 imagens
- Execuções com suporte de sessão são desvinculadas por meio do fluxo compartilhado de tarefa/status, incluindo `action: "status"`

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

O provedor de fala `google` incluído usa o caminho de TTS da API Gemini com
`gemini-3.1-flash-tts-preview`.

- Voz padrão: `Kore`
- Autenticação: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` ou `GOOGLE_API_KEY`
- Saída: WAV para anexos TTS comuns, Opus para destinos de mensagem de voz e PCM para Talk/telefonia
- Saída de mensagem de voz: o PCM do Google é encapsulado como WAV e transcodificado para Opus de 48 kHz com `ffmpeg`

O caminho de TTS em lote do Gemini do Google retorna o áudio gerado na resposta
`generateContent` concluída. Para conversas faladas com a menor latência, use o
provedor de voz em tempo real do Google, baseado na Gemini Live API, em vez do TTS
em lote.

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
`speakerName` quando o texto do prompt mencionar um locutor pelo nome.

O TTS da API Gemini também aceita tags de áudio expressivas entre colchetes no texto,
como `[whispers]` ou `[laughs]`. Para evitar que as tags apareçam na resposta visível do chat
e ainda enviá-las ao TTS, coloque-as dentro de um bloco `[[tts:text]]...[[/tts:text]]`:

```text
Este é o texto limpo da resposta.

[[tts:text]][whispers] Esta é a versão falada.[[/tts:text]]
```

<Note>
Uma chave de API do Google Cloud Console restrita à API Gemini é válida para este
provedor. Este não é o caminho separado da API Cloud Text-to-Speech.
</Note>

## Voz em tempo real

O plugin `google` incluído registra um provedor de voz em tempo real baseado na
Gemini Live API para pontes de áudio de backend, como Voice Call e Google Meet.

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
| Chave de API                 | `...google.apiKey`                                                  | Usa como alternativa `models.providers.google.apiKey`, `GEMINI_API_KEY` ou `GOOGLE_API_KEY` |

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
A API Google Live usa áudio bidirecional e chamadas de função por meio de um WebSocket.
O OpenClaw adapta o áudio da ponte de telefonia/Meet ao fluxo da API PCM Live do Gemini e
mantém as chamadas de ferramentas no contrato compartilhado de voz em tempo real. Deixe `temperature`
não definido, a menos que você precise alterar a amostragem; o OpenClaw omite valores não positivos
porque o Google Live pode retornar transcrições sem áudio com `temperature: 0`.
A transcrição da API Gemini é habilitada sem `languageCodes`; o SDK atual do Google
rejeita sugestões de código de idioma nesse caminho da API.
</Note>

<Note>
O Gemini 3.1 Live aceita texto de conversação por meio da entrada em tempo real e usa
chamadas de função sequenciais. O OpenClaw omite os campos antigos `NON_BLOCKING`, de
agendamento de respostas de função e de diálogo afetivo para esse modelo. Prefira
`thinkingLevel`; valores positivos configurados de `thinkingBudget` são mapeados para o
nível compatível mais próximo, enquanto `-1` mantém o padrão do Google. Consulte a
[comparação de recursos do Gemini Live](https://ai.google.dev/gemini-api/docs/live-api/capabilities).
</Note>

<Note>
O Talk da Control UI oferece suporte a sessões do Google Live no navegador com tokens
restritos de uso único. Provedores de voz em tempo real exclusivos do backend também podem
ser executados por meio do transporte genérico de retransmissão do Gateway, que mantém as
credenciais do provedor no Gateway.
</Note>

Para verificação ao vivo por mantenedores, execute
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
O smoke test também abrange os caminhos de backend/WebRTC da OpenAI; a etapa do Google emite o mesmo
formato de token restrito da API Live usado pelo Talk da Control UI, abre o endpoint
WebSocket do navegador, envia a carga útil de configuração inicial e aguarda
`setupComplete`.

## Configuração avançada

<AccordionGroup>
  <Accordion title="Reutilização direta do cache do Gemini">
    Para execuções diretas da API Gemini (`api: "google-generative-ai"`), o OpenClaw
    repassa um identificador `cachedContent` configurado às solicitações do Gemini.

    - Configure parâmetros por modelo ou globais usando
      `cachedContent` ou o legado `cached_content`
    - Os parâmetros de um escopo mais específico (nível do modelo em vez do global) sempre prevalecem.
      No mesmo escopo, se ambas as chaves estiverem definidas, `cached_content` prevalece.
      Use apenas uma chave por escopo para evitar surpresas.
    - Valor de exemplo: `cachedContents/prebuilt-context`
    - O uso de acertos no cache do Gemini é normalizado no `cacheRead` do OpenClaw a partir de
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

  <Accordion title="Observações sobre o uso da CLI do Gemini">
    Ao usar o provedor OAuth `google-gemini-cli`, o OpenClaw usa por padrão a saída
    `stream-json` da CLI do Gemini e normaliza o uso a partir da carga útil `stats`
    final. Substituições legadas com `--output-format json` ainda usam o analisador
    JSON.

    - O texto da resposta transmitida vem dos eventos `message` do assistente.
    - Para a saída JSON legada, o texto da resposta vem do campo `response` do JSON da CLI.
    - O uso recorre a `stats` quando a CLI deixa `usage` vazio.
    - `stats.cached` é normalizado no `cacheRead` do OpenClaw.
    - Se `stats.input` estiver ausente, o OpenClaw deriva os tokens de entrada de
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Configuração do ambiente e do daemon">
    Se o Gateway for executado como um daemon (launchd/systemd), certifique-se de que `GEMINI_API_KEY`
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
    Parâmetros compartilhados da ferramenta de imagens e seleção de provedor.
  </Card>
  <Card title="Geração de vídeos" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeos e seleção de provedor.
  </Card>
  <Card title="Geração de músicas" href="/pt-BR/tools/music-generation" icon="music">
    Parâmetros compartilhados da ferramenta de músicas e seleção de provedor.
  </Card>
</CardGroup>
