---
read_when:
    - Você quer geração de mídia com Vydra no OpenClaw
    - Você precisa de orientações para configurar a chave de API do Vydra
summary: Use imagem, vídeo e fala do Vydra no OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-04-06T03:11:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0fe999e8a5414b8a31a6d7d127bc6bcfc3b4492b8f438ab17dfa9680c5b079b7
    source_path: providers/vydra.md
    workflow: 15
---

# Vydra

O plugin Vydra empacotado adiciona:

- geração de imagem via `vydra/grok-imagine`
- geração de vídeo via `vydra/veo3` e `vydra/kling`
- síntese de fala via a rota TTS do Vydra com backend do ElevenLabs

O OpenClaw usa a mesma `VYDRA_API_KEY` para as três capacidades.

## Base URL importante

Use `https://www.vydra.ai/api/v1`.

Atualmente, o host apex do Vydra (`https://vydra.ai/api/v1`) redireciona para `www`. Alguns clientes HTTP descartam `Authorization` nesse redirecionamento entre hosts, o que transforma uma chave de API válida em uma falha de autenticação enganosa. O plugin empacotado usa diretamente a base URL com `www` para evitar isso.

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

Defina-o como provedor de imagem padrão:

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

Defina o Vydra como provedor de vídeo padrão:

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
- `vydra/kling` atualmente exige uma URL remota de imagem como referência. Uploads de arquivo local são rejeitados logo de início.
- O plugin empacotado mantém uma postura conservadora e não encaminha knobs de estilo não documentados, como proporção, resolução, marca d'água ou áudio gerado.

Consulte [Video Generation](/tools/video-generation) para o comportamento compartilhado da ferramenta.

## Síntese de fala

Defina o Vydra como provedor de fala:

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

Atualmente, o plugin empacotado expõe uma única voz padrão conhecida como confiável e retorna arquivos de áudio MP3.

## Relacionado

- [Diretório de provedores](/pt-BR/providers/index)
- [Geração de imagem](/pt-BR/tools/image-generation)
- [Geração de vídeo](/tools/video-generation)
