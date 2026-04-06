---
read_when:
    - Você quer usar a geração de vídeo com Runway no OpenClaw
    - Você precisa da configuração de chave de API/env do Runway
    - Você quer tornar o Runway o provedor de vídeo padrão
summary: Configuração da geração de vídeo com Runway no OpenClaw
title: Runway
x-i18n:
    generated_at: "2026-04-06T03:10:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc615d1a26f7a4b890d29461e756690c858ecb05024cf3c4d508218022da6e76
    source_path: providers/runway.md
    workflow: 15
---

# Runway

O OpenClaw inclui um provedor `runway` empacotado para geração de vídeo hospedada.

- ID do provedor: `runway`
- Auth: `RUNWAYML_API_SECRET` (canônico) ou `RUNWAY_API_KEY`
- API: geração de vídeo baseada em tarefas do Runway (polling de `GET /v1/tasks/{id}`)

## Início rápido

1. Defina a chave de API:

```bash
openclaw onboard --auth-choice runway-api-key
```

2. Defina o Runway como o provedor de vídeo padrão:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
```

3. Peça ao agente para gerar um vídeo. O Runway será usado automaticamente.

## Modos compatíveis

| Modo           | Modelo             | Entrada de referência   |
| -------------- | ------------------ | ----------------------- |
| Texto para vídeo  | `gen4.5` (padrão) | Nenhuma                 |
| Imagem para vídeo | `gen4.5`          | 1 imagem local ou remota |
| Vídeo para vídeo  | `gen4_aleph`      | 1 vídeo local ou remoto |

- Referências locais de imagem e vídeo são compatíveis via URIs de dados.
- Vídeo para vídeo atualmente exige especificamente `runway/gen4_aleph`.
- Execuções somente com texto atualmente expõem as proporções `16:9` e `9:16`.

## Configuração

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "runway/gen4.5",
      },
    },
  },
}
```

## Relacionado

- [Geração de vídeo](/tools/video-generation) -- parâmetros da ferramenta compartilhada, seleção de provedor e comportamento assíncrono
- [Configuration Reference](/pt-BR/gateway/configuration-reference#agent-defaults)
