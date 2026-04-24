---
read_when:
    - Você quer usar modelos Google Gemini com o OpenClaw
    - Você precisa do fluxo de autenticação por chave de API ou OAuth
summary: Configuração do Google Gemini (chave de API + OAuth, geração de imagem, entendimento de mídia, TTS, web search)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-24T06:07:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: b43d7171f56ecdfb49a25256783433e64f99a02760b3bc6f0e1055195f556f5d
    source_path: providers/google.md
    workflow: 15
---

O Plugin Google fornece acesso a modelos Gemini via Google AI Studio, além de
geração de imagem, entendimento de mídia (imagem/áudio/vídeo), text-to-speech e web search via
Gemini Grounding.

- Provedor: `google`
- Autenticação: `GEMINI_API_KEY` ou `GOOGLE_API_KEY`
- API: Google Gemini API
- Provedor alternativo: `google-gemini-cli` (OAuth)

## Primeiros passos

Escolha seu método de autenticação preferido e siga as etapas de configuração.

<Tabs>
  <Tab title="API key">
    **Melhor para:** acesso padrão à API Gemini via Google AI Studio.

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
      <Step title="Install the Gemini CLI">
        O comando local `gemini` precisa estar disponível em `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        O OpenClaw oferece suporte tanto a instalações via Homebrew quanto a instalações globais via npm, incluindo
        layouts comuns de Windows/npm.
      </Step>
      <Step title="Log in via OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider google-gemini-cli
        ```
      </Step>
    </Steps>

    - Modelo padrão: `google-gemini-cli/gemini-3-flash-preview`
    - Alias: `gemini-cli`

    **Variáveis de ambiente:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Ou as variantes `GEMINI_CLI_*`.)

    <Note>
    Se solicitações OAuth do Gemini CLI falharem após o login, defina `GOOGLE_CLOUD_PROJECT` ou
    `GOOGLE_CLOUD_PROJECT_ID` no host do gateway e tente novamente.
    </Note>

    <Note>
    Se o login falhar antes do início do fluxo no navegador, verifique se o comando local `gemini`
    está instalado e em `PATH`.
    </Note>

    O provedor `google-gemini-cli`, exclusivo de OAuth, é uma superfície separada de
    inferência de texto. Geração de imagem, entendimento de mídia e Gemini Grounding permanecem no
    ID de provedor `google`.

  </Tab>
</Tabs>

## Recursos

| Recurso               | Compatível                    |
| --------------------- | ----------------------------- |
| Conclusões de chat    | Sim                           |
| Geração de imagem     | Sim                           |
| Geração de música     | Sim                           |
| Text-to-speech        | Sim                           |
| Entendimento de imagem| Sim                           |
| Transcrição de áudio  | Sim                           |
| Entendimento de vídeo | Sim                           |
| Web search (Grounding)| Sim                           |
| Thinking/reasoning    | Sim (Gemini 2.5+ / Gemini 3+) |
| Modelos Gemma 4       | Sim                           |

<Tip>
Modelos Gemini 3 usam `thinkingLevel` em vez de `thinkingBudget`. O OpenClaw mapeia
controles de raciocínio de Gemini 3, Gemini 3.1 e aliases `gemini-*-latest` para
`thinkingLevel`, para que execuções padrão/de baixa latência não enviem valores
desativados de `thinkingBudget`.

Modelos Gemma 4 (por exemplo `gemma-4-26b-a4b-it`) oferecem suporte a modo thinking. O OpenClaw
reescreve `thinkingBudget` para um `thinkingLevel` compatível do Google para Gemma 4.
Definir thinking como `off` preserva o thinking desativado em vez de mapear para
`MINIMAL`.
</Tip>

## Geração de imagem

O provedor integrado de geração de imagem `google` usa por padrão
`google/gemini-3.1-flash-image-preview`.

- Também oferece suporte a `google/gemini-3-pro-image-preview`
- Generate: até 4 imagens por solicitação
- Modo de edição: ativado, até 5 imagens de entrada
- Controles de geometria: `size`, `aspectRatio` e `resolution`

Para usar o Google como provedor padrão de imagem:

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
Consulte [Image Generation](/pt-BR/tools/image-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de fallback.
</Note>

## Geração de vídeo

O Plugin integrado `google` também registra geração de vídeo por meio da ferramenta compartilhada
`video_generate`.

- Modelo de vídeo padrão: `google/veo-3.1-fast-generate-preview`
- Modos: text-to-video, image-to-video e fluxos de referência com um único vídeo
- Compatível com `aspectRatio`, `resolution` e `audio`
- Limite atual de duração: **4 a 8 segundos**

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
Consulte [Video Generation](/pt-BR/tools/video-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de fallback.
</Note>

## Geração de música

O Plugin integrado `google` também registra geração de música por meio da ferramenta compartilhada
`music_generate`.

- Modelo de música padrão: `google/lyria-3-clip-preview`
- Também oferece suporte a `google/lyria-3-pro-preview`
- Controles de prompt: `lyrics` e `instrumental`
- Formato de saída: `mp3` por padrão, além de `wav` em `google/lyria-3-pro-preview`
- Entradas de referência: até 10 imagens
- Execuções com suporte de sessão são desacopladas pelo fluxo compartilhado de tarefa/status, incluindo `action: "status"`

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
Consulte [Music Generation](/pt-BR/tools/music-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de fallback.
</Note>

## Text-to-speech

O provedor de fala integrado `google` usa o caminho TTS da Gemini API com
`gemini-3.1-flash-tts-preview`.

- Voz padrão: `Kore`
- Autenticação: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` ou `GOOGLE_API_KEY`
- Saída: WAV para anexos comuns de TTS, PCM para Talk/telefonia
- Saída nativa de nota de voz: não compatível nesse caminho da Gemini API porque a API retorna PCM em vez de Opus

Para usar o Google como provedor padrão de TTS:

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
        },
      },
    },
  },
}
```

O TTS da Gemini API aceita tags expressivas de áudio entre colchetes no texto, como
`[whispers]` ou `[laughs]`. Para manter as tags fora da resposta visível no chat enquanto as
envia ao TTS, coloque-as dentro de um bloco `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Uma chave de API do Google Cloud Console restrita à Gemini API é válida para este
provedor. Este não é o caminho separado da Cloud Text-to-Speech API.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Reutilização direta de cache do Gemini">
    Para execuções diretas da Gemini API (`api: "google-generative-ai"`), o OpenClaw
    repassa um handle configurado de `cachedContent` às solicitações do Gemini.

    - Configure parâmetros por modelo ou globais com
      `cachedContent` ou o legado `cached_content`
    - Se ambos estiverem presentes, `cachedContent` vence
    - Exemplo de valor: `cachedContents/prebuilt-context`
    - O uso de cache-hit do Gemini é normalizado em `cacheRead` do OpenClaw a partir de
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
    a saída JSON da CLI da seguinte forma:

    - O texto de resposta vem do campo `response` do JSON da CLI.
    - O uso usa fallback para `stats` quando a CLI deixa `usage` vazio.
    - `stats.cached` é normalizado em `cacheRead` do OpenClaw.
    - Se `stats.input` estiver ausente, o OpenClaw deriva tokens de entrada de
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Ambiente e configuração de daemon">
    Se o Gateway for executado como daemon (launchd/systemd), verifique se `GEMINI_API_KEY`
    está disponível para esse processo (por exemplo em `~/.openclaw/.env` ou via
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Model selection" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de fallback.
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
