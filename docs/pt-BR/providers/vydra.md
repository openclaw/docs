---
read_when:
    - Você quer geração de mídia com Vydra no OpenClaw
    - Você precisa de orientação para configurar a chave de API do Vydra
summary: Use geração de imagem, vídeo e fala do Vydra no OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-04-07T05:30:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 24006a687ed6f9792e7b2b10927cc7ad71c735462a92ce03d5fa7c2b2ee2fcc2
    source_path: providers/vydra.md
    workflow: 15
---

# Vydra

O plugin Vydra empacotado adiciona:

- geração de imagem via `vydra/grok-imagine`
- geração de vídeo via `vydra/veo3` e `vydra/kling`
- síntese de fala via a rota de TTS do Vydra baseada em ElevenLabs

O OpenClaw usa a mesma `VYDRA_API_KEY` para as três capacidades.

## URL base importante

Use `https://www.vydra.ai/api/v1`.

Atualmente, o host apex do Vydra (`https://vydra.ai/api/v1`) redireciona para `www`. Alguns clientes HTTP descartam `Authorization` nesse redirecionamento entre hosts, o que transforma uma chave de API válida em uma falha de autenticação enganosa. O plugin empacotado usa diretamente a URL base com `www` para evitar isso.

## Configuração

Onboarding interativo:

```bash
openclaw onboard --auth-choice vydra-api-key
```

Ou defina a variável de ambiente diretamente:

```bash
export VYDRA_API_KEY="vydra_live_..."
```

## Geração de imagem

Modelo de imagem padrão:

- `vydra/grok-imagine`

Defina-o como o provedor de imagem padrão:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "vydra/grok-imagine",
      },
    },
  },
}
```

O suporte empacotado atual é apenas para texto para imagem. As rotas hospedadas de edição do Vydra esperam URLs remotas de imagem, e o OpenClaw ainda não adiciona uma ponte de upload específica do Vydra no plugin empacotado.

Consulte [Image Generation](/pt-BR/tools/image-generation) para o comportamento compartilhado da ferramenta.

## Geração de vídeo

Modelos de vídeo registrados:

- `vydra/veo3` para texto para vídeo
- `vydra/kling` para imagem para vídeo

Defina o Vydra como o provedor de vídeo padrão:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "vydra/veo3",
      },
    },
  },
}
```

Observações:

- `vydra/veo3` é empacotado apenas como texto para vídeo.
- `vydra/kling` atualmente requer uma referência remota de URL de imagem. Uploads de arquivos locais são rejeitados de imediato.
- A rota HTTP atual `kling` do Vydra tem sido inconsistente quanto a exigir `image_url` ou `video_url`; o provedor empacotado mapeia a mesma URL remota de imagem para ambos os campos.
- O plugin empacotado permanece conservador e não encaminha knobs de estilo não documentados, como proporção, resolução, marca d'água ou áudio gerado.

Cobertura live específica do provedor:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_VYDRA_VIDEO=1 \
pnpm test:live -- extensions/vydra/vydra.live.test.ts
```

O arquivo live empacotado do Vydra agora cobre:

- `vydra/veo3` texto para vídeo
- `vydra/kling` imagem para vídeo usando uma URL remota de imagem

Substitua o fixture remoto de imagem quando necessário:

```bash
export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
```

Consulte [Video Generation](/pt-BR/tools/video-generation) para o comportamento compartilhado da ferramenta.

## Síntese de fala

Defina o Vydra como o provedor de fala:

```json5
{
  messages: {
    tts: {
      provider: "vydra",
      providers: {
        vydra: {
          apiKey: "${VYDRA_API_KEY}",
          voiceId: "21m00Tcm4TlvDq8ikWAM",
        },
      },
    },
  },
}
```

Padrões:

- modelo: `elevenlabs/tts`
- ID de voz: `21m00Tcm4TlvDq8ikWAM`

Atualmente, o plugin empacotado expõe uma voz padrão conhecida e confiável e retorna arquivos de áudio MP3.

## Relacionados

- [Provider Directory](/pt-BR/providers/index)
- [Image Generation](/pt-BR/tools/image-generation)
- [Video Generation](/pt-BR/tools/video-generation)
