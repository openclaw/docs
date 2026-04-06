---
read_when:
    - Você quer usar a geração de vídeo Wan da Alibaba no OpenClaw
    - Você precisa configurar a chave de API do Model Studio ou do DashScope para geração de vídeo
summary: Geração de vídeo Wan do Alibaba Model Studio no OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-04-06T03:09:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 97a1eddc7cbd816776b9368f2a926b5ef9ee543f08d151a490023736f67dc635
    source_path: providers/alibaba.md
    workflow: 15
---

# Alibaba Model Studio

O OpenClaw inclui um provedor agrupado de geração de vídeo `alibaba` para modelos Wan no
Alibaba Model Studio / DashScope.

- Provedor: `alibaba`
- Autenticação preferida: `MODELSTUDIO_API_KEY`
- Também aceitos: `DASHSCOPE_API_KEY`, `QWEN_API_KEY`
- API: geração assíncrona de vídeo do DashScope / Model Studio

## Início rápido

1. Defina uma chave de API:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

2. Defina um modelo de vídeo padrão:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "alibaba/wan2.6-t2v",
      },
    },
  },
}
```

## Modelos Wan integrados

Atualmente, o provedor agrupado `alibaba` registra:

- `alibaba/wan2.6-t2v`
- `alibaba/wan2.6-i2v`
- `alibaba/wan2.6-r2v`
- `alibaba/wan2.6-r2v-flash`
- `alibaba/wan2.7-r2v`

## Limites atuais

- Até **1** vídeo de saída por solicitação
- Até **1** imagem de entrada
- Até **4** vídeos de entrada
- Até **10 segundos** de duração
- Suporte a `size`, `aspectRatio`, `resolution`, `audio` e `watermark`
- O modo de imagem/vídeo de referência atualmente exige **URLs http(s) remotas**

## Relação com Qwen

O provedor agrupado `qwen` também usa endpoints DashScope hospedados pela Alibaba para
geração de vídeo Wan. Use:

- `qwen/...` quando você quiser a superfície canônica do provedor Qwen
- `alibaba/...` quando você quiser a superfície direta de vídeo Wan controlada pelo fornecedor

## Relacionados

- [Geração de vídeo](/tools/video-generation)
- [Qwen](/pt-BR/providers/qwen)
- [Referência de configuração](/pt-BR/gateway/configuration-reference#agent-defaults)
