---
read_when:
    - Você quer usar modelos Google Gemini com o OpenClaw
    - Você precisa do fluxo de autenticação por chave de API ou OAuth
summary: Configuração do Google Gemini (chave de API + OAuth, geração de imagens, entendimento de mídia, pesquisa na web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-07T05:30:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36cc7c7d8d19f6d4a3fb223af36c8402364fc309d14ffe922bd004203ceb1754
    source_path: providers/google.md
    workflow: 15
---

# Google (Gemini)

O plugin Google fornece acesso aos modelos Gemini por meio do Google AI Studio, além de
geração de imagens, entendimento de mídia (imagem/áudio/vídeo) e pesquisa na web via
Gemini Grounding.

- Provedor: `google`
- Autenticação: `GEMINI_API_KEY` ou `GOOGLE_API_KEY`
- API: Google Gemini API
- Provedor alternativo: `google-gemini-cli` (OAuth)

## Início rápido

1. Defina a chave de API:

```bash
openclaw onboard --auth-choice gemini-api-key
```

2. Defina um modelo padrão:

```json5
{
  agents: {
    defaults: {
      model: { primary: "google/gemini-3.1-pro-preview" },
    },
  },
}
```

## Exemplo não interativo

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice gemini-api-key \
  --gemini-api-key "$GEMINI_API_KEY"
```

## OAuth (Gemini CLI)

Um provedor alternativo `google-gemini-cli` usa OAuth PKCE em vez de uma chave de API.
Esta é uma integração não oficial; alguns usuários relatam restrições
de conta. Use por sua conta e risco.

- Modelo padrão: `google-gemini-cli/gemini-3.1-pro-preview`
- Alias: `gemini-cli`
- Pré-requisito de instalação: Gemini CLI local disponível como `gemini`
  - Homebrew: `brew install gemini-cli`
  - npm: `npm install -g @google/gemini-cli`
- Login:

```bash
openclaw models auth login --provider google-gemini-cli --set-default
```

Variáveis de ambiente:

- `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
- `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

(Ou as variantes `GEMINI_CLI_*`.)

Se as requisições OAuth do Gemini CLI falharem após o login, defina
`GOOGLE_CLOUD_PROJECT` ou `GOOGLE_CLOUD_PROJECT_ID` no host do gateway e
tente novamente.

Se o login falhar antes de o fluxo do navegador começar, verifique se o comando local `gemini`
está instalado e no `PATH`. O OpenClaw oferece suporte tanto a instalações via Homebrew
quanto a instalações globais via npm, incluindo layouts comuns de Windows/npm.

Observações sobre uso do JSON do Gemini CLI:

- O texto da resposta vem do campo JSON `response` da CLI.
- O uso recorre a `stats` quando a CLI deixa `usage` vazio.
- `stats.cached` é normalizado para `cacheRead` no OpenClaw.
- Se `stats.input` estiver ausente, o OpenClaw deriva os tokens de entrada a partir de
  `stats.input_tokens - stats.cached`.

## Capacidades

| Capability             | Supported         |
| ---------------------- | ----------------- |
| Conclusões de chat     | Sim               |
| Geração de imagens     | Sim               |
| Geração de música      | Sim               |
| Entendimento de imagem | Sim               |
| Transcrição de áudio   | Sim               |
| Entendimento de vídeo  | Sim               |
| Pesquisa na web (Grounding) | Sim         |
| Thinking/reasoning     | Sim (Gemini 3.1+) |

## Reutilização direta de cache do Gemini

Para execuções diretas da API Gemini (`api: "google-generative-ai"`), o OpenClaw agora
passa um identificador `cachedContent` configurado diretamente para as requisições do Gemini.

- Configure parâmetros por modelo ou globais com
  `cachedContent` ou o legado `cached_content`
- Se ambos estiverem presentes, `cachedContent` prevalece
- Valor de exemplo: `cachedContents/prebuilt-context`
- O uso com acerto de cache do Gemini é normalizado para `cacheRead` no OpenClaw a partir de
  `cachedContentTokenCount` do upstream

Exemplo:

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

## Geração de imagens

O provedor empacotado de geração de imagens `google` usa por padrão
`google/gemini-3.1-flash-image-preview`.

- Também oferece suporte a `google/gemini-3-pro-image-preview`
- Gerar: até 4 imagens por requisição
- Modo de edição: ativado, até 5 imagens de entrada
- Controles de geometria: `size`, `aspectRatio` e `resolution`

O provedor `google-gemini-cli`, somente com OAuth, é uma superfície separada
de inferência de texto. Geração de imagens, entendimento de mídia e Gemini Grounding permanecem no
id de provedor `google`.

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

Veja [Geração de imagens](/pt-BR/tools/image-generation) para os parâmetros
compartilhados da ferramenta, seleção de provedor e comportamento de failover.

## Geração de vídeo

O plugin empacotado `google` também registra geração de vídeo por meio da ferramenta compartilhada
`video_generate`.

- Modelo de vídeo padrão: `google/veo-3.1-fast-generate-preview`
- Modos: texto para vídeo, imagem para vídeo e fluxos de referência de vídeo único
- Oferece suporte a `aspectRatio`, `resolution` e `audio`
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

Veja [Geração de vídeo](/pt-BR/tools/video-generation) para os parâmetros
compartilhados da ferramenta, seleção de provedor e comportamento de failover.

## Geração de música

O plugin empacotado `google` também registra geração de música por meio da ferramenta compartilhada
`music_generate`.

- Modelo de música padrão: `google/lyria-3-clip-preview`
- Também oferece suporte a `google/lyria-3-pro-preview`
- Controles de prompt: `lyrics` e `instrumental`
- Formato de saída: `mp3` por padrão, além de `wav` em `google/lyria-3-pro-preview`
- Entradas de referência: até 10 imagens
- Execuções com suporte de sessão são desacopladas por meio do fluxo compartilhado de tarefa/status, incluindo `action: "status"`

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

Veja [Geração de música](/pt-BR/tools/music-generation) para os parâmetros
compartilhados da ferramenta, seleção de provedor e comportamento de failover.

## Observação sobre ambiente

Se o Gateway for executado como daemon (launchd/systemd), verifique se `GEMINI_API_KEY`
está disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou via
`env.shellEnv`).
