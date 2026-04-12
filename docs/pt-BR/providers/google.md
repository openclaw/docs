---
read_when:
    - Você quer usar modelos Google Gemini com o OpenClaw
    - Você precisa do fluxo de auth por chave de API ou OAuth
summary: Configuração do Google Gemini (chave de API + OAuth, geração de imagem, media understanding, pesquisa na web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-12T23:31:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 64b848add89061b208a5d6b19d206c433cace5216a0ca4b63d56496aecbde452
    source_path: providers/google.md
    workflow: 15
---

# Google (Gemini)

O plugin Google fornece acesso a modelos Gemini por meio do Google AI Studio, além de
geração de imagem, media understanding (imagem/áudio/vídeo) e pesquisa na web via
Gemini Grounding.

- Provedor: `google`
- Auth: `GEMINI_API_KEY` ou `GOOGLE_API_KEY`
- API: Google Gemini API
- Provedor alternativo: `google-gemini-cli` (OAuth)

## Introdução

Escolha seu método de auth preferido e siga as etapas de configuração.

<Tabs>
  <Tab title="Chave de API">
    **Ideal para:** acesso padrão à API Gemini por meio do Google AI Studio.

    <Steps>
      <Step title="Execute o onboarding">
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
    As variáveis de ambiente `GEMINI_API_KEY` e `GOOGLE_API_KEY` são ambas aceitas. Use a que você já tiver configurada.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Ideal para:** reutilizar um login existente do Gemini CLI via OAuth PKCE em vez de uma chave de API separada.

    <Warning>
    O provedor `google-gemini-cli` é uma integração não oficial. Alguns usuários
    relatam restrições de conta ao usar OAuth dessa forma. Use por sua conta e risco.
    </Warning>

    <Steps>
      <Step title="Instale a Gemini CLI">
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
      <Step title="Faça login via OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Verifique se o modelo está disponível">
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
    Se as requisições OAuth do Gemini CLI falharem após o login, defina `GOOGLE_CLOUD_PROJECT` ou
    `GOOGLE_CLOUD_PROJECT_ID` no host do Gateway e tente novamente.
    </Note>

    <Note>
    Se o login falhar antes de o fluxo no navegador começar, confirme que o comando local `gemini`
    está instalado e no `PATH`.
    </Note>

    O provedor `google-gemini-cli`, apenas OAuth, é uma superfície separada
    de inferência de texto. A geração de imagem, media understanding e Gemini Grounding continuam no
    id de provedor `google`.

  </Tab>
</Tabs>

## Capacidades

| Capability             | Supported         |
| ---------------------- | ----------------- |
| Compleções de chat     | Sim               |
| Geração de imagem      | Sim               |
| Geração de música      | Sim               |
| Entendimento de imagem | Sim               |
| Transcrição de áudio   | Sim               |
| Entendimento de vídeo  | Sim               |
| Pesquisa na web (Grounding) | Sim          |
| Thinking/reasoning     | Sim (Gemini 3.1+) |
| Modelos Gemma 4        | Sim               |

<Tip>
Os modelos Gemma 4 (por exemplo `gemma-4-26b-a4b-it`) oferecem suporte ao modo thinking. O OpenClaw
reescreve `thinkingBudget` para um `thinkingLevel` do Google compatível para o Gemma 4.
Definir thinking como `off` preserva o thinking desabilitado em vez de mapear para
`MINIMAL`.
</Tip>

## Geração de imagem

O provedor empacotado de geração de imagem `google` usa por padrão
`google/gemini-3.1-flash-image-preview`.

- Também oferece suporte a `google/gemini-3-pro-image-preview`
- Gerar: até 4 imagens por requisição
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
Veja [Image Generation](/pt-BR/tools/image-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

## Geração de vídeo

O plugin `google` empacotado também registra geração de vídeo por meio da ferramenta compartilhada
`video_generate`.

- Modelo de vídeo padrão: `google/veo-3.1-fast-generate-preview`
- Modos: texto para vídeo, imagem para vídeo e fluxos com referência de vídeo único
- Oferece suporte a `aspectRatio`, `resolution` e `audio`
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
Veja [Video Generation](/pt-BR/tools/video-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

## Geração de música

O plugin `google` empacotado também registra geração de música por meio da ferramenta compartilhada
`music_generate`.

- Modelo de música padrão: `google/lyria-3-clip-preview`
- Também oferece suporte a `google/lyria-3-pro-preview`
- Controles de prompt: `lyrics` e `instrumental`
- Formato de saída: `mp3` por padrão, além de `wav` em `google/lyria-3-pro-preview`
- Entradas de referência: até 10 imagens
- Execuções com suporte de sessão se desacoplam por meio do fluxo compartilhado de task/status, incluindo `action: "status"`

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
Veja [Music Generation](/pt-BR/tools/music-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Reutilização direta de cache do Gemini">
    Para execuções diretas da API Gemini (`api: "google-generative-ai"`), o OpenClaw
    repassa um identificador configurado de `cachedContent` para as requisições Gemini.

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

  <Accordion title="Observações sobre uso de JSON do Gemini CLI">
    Ao usar o provedor OAuth `google-gemini-cli`, o OpenClaw normaliza
    a saída JSON da CLI da seguinte forma:

    - O texto da resposta vem do campo JSON `response` da CLI.
    - O uso recorre a `stats` quando a CLI deixa `usage` vazio.
    - `stats.cached` é normalizado para `cacheRead` no OpenClaw.
    - Se `stats.input` estiver ausente, o OpenClaw deriva os tokens de entrada de
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Configuração de ambiente e daemon">
    Se o Gateway for executado como daemon (launchd/systemd), certifique-se de que `GEMINI_API_KEY`
    esteja disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou via
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolhendo provedores, refs de modelo e comportamento de failover.
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
