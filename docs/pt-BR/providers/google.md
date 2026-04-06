---
read_when:
    - Você quer usar models Google Gemini com o OpenClaw
    - Você precisa do fluxo de auth por chave de API
summary: Configuração do Google Gemini (chave de API, geração de imagens, compreensão de mídia, web search)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-06T03:10:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 358d33a68275b01ebd916a3621dd651619cb9a1d062e2fb6196a7f3c501c015a
    source_path: providers/google.md
    workflow: 15
---

# Google (Gemini)

O plugin Google fornece acesso aos models Gemini por meio do Google AI Studio, além de
geração de imagens, compreensão de mídia (imagem/áudio/vídeo) e web search via
Gemini Grounding.

- Provedor: `google`
- Auth: `GEMINI_API_KEY` ou `GOOGLE_API_KEY`
- API: Google Gemini API

## Início rápido

1. Defina a chave de API:

```bash
openclaw onboard --auth-choice gemini-api-key
```

2. Defina um model padrão:

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

## Capabilities

| Capability             | Compatível        |
| ---------------------- | ----------------- |
| Conclusões de chat     | Sim               |
| Geração de imagens     | Sim               |
| Geração de música      | Sim               |
| Compreensão de imagens | Sim               |
| Transcrição de áudio   | Sim               |
| Compreensão de vídeo   | Sim               |
| Web search (Grounding) | Sim               |
| Thinking/reasoning     | Sim (Gemini 3.1+) |

## Reutilização direta de cache do Gemini

Para execuções diretas da API Gemini (`api: "google-generative-ai"`), o OpenClaw agora
passa um identificador `cachedContent` configurado para as requisições ao Gemini.

- Configure parâmetros por model ou globais com
  `cachedContent` ou o legado `cached_content`
- Se ambos estiverem presentes, `cachedContent` vence
- Valor de exemplo: `cachedContents/prebuilt-context`
- O uso de cache-hit do Gemini é normalizado em `cacheRead` no OpenClaw a partir de
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

O provedor integrado de geração de imagens `google` usa por padrão
`google/gemini-3.1-flash-image-preview`.

- Também oferece suporte a `google/gemini-3-pro-image-preview`
- Geração: até 4 imagens por solicitação
- Modo de edição: ativado, até 5 imagens de entrada
- Controles de geometria: `size`, `aspectRatio` e `resolution`

A geração de imagens, a compreensão de mídia e o Gemini Grounding permanecem todos no
id de provedor `google`.

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

Consulte [Image Generation](/pt-BR/tools/image-generation) para ver os parâmetros
compartilhados da tool, a seleção de provedor e o comportamento de failover.

## Geração de vídeo

O plugin integrado `google` também registra geração de vídeo por meio da tool compartilhada
`video_generate`.

- Model de vídeo padrão: `google/veo-3.1-fast-generate-preview`
- Modos: fluxos de texto para vídeo, imagem para vídeo e referência de vídeo único
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

Consulte [Video Generation](/tools/video-generation) para ver os parâmetros
compartilhados da tool, a seleção de provedor e o comportamento de failover.

## Geração de música

O plugin integrado `google` também registra geração de música por meio da tool compartilhada
`music_generate`.

- Model de música padrão: `google/lyria-3-clip-preview`
- Também oferece suporte a `google/lyria-3-pro-preview`
- Controles de prompt: `lyrics` e `instrumental`
- Formato de saída: `mp3` por padrão, além de `wav` em `google/lyria-3-pro-preview`
- Entradas de referência: até 10 imagens
- Execuções com suporte de sessão são desacopladas por meio do fluxo compartilhado de tarefa/status, incluindo `action: "status"`

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

Consulte [Music Generation](/tools/music-generation) para ver os parâmetros
compartilhados da tool, a seleção de provedor e o comportamento de failover.

## Observação sobre ambiente

Se o Gateway estiver em execução como daemon (launchd/systemd), verifique se `GEMINI_API_KEY`
está disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou via
`env.shellEnv`).
