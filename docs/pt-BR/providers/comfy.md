---
read_when:
    - Você quer usar workflows locais do ComfyUI com o OpenClaw
    - Você quer usar o Comfy Cloud com workflows de imagem, vídeo ou música
    - Você precisa das chaves de configuração do plugin comfy agrupado
summary: Configuração de geração de imagem, vídeo e música por workflow do ComfyUI no OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-04-06T03:10:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: e645f32efdffdf4cd498684f1924bb953a014d3656b48f4b503d64e38c61ba9c
    source_path: providers/comfy.md
    workflow: 15
---

# ComfyUI

O OpenClaw inclui um plugin agrupado `comfy` para execuções do ComfyUI orientadas por workflow.

- Provedor: `comfy`
- Modelos: `comfy/workflow`
- Superfícies compartilhadas: `image_generate`, `video_generate`, `music_generate`
- Autenticação: nenhuma para ComfyUI local; `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY` para Comfy Cloud
- API: ComfyUI `/prompt` / `/history` / `/view` e Comfy Cloud `/api/*`

## O que ele oferece

- Geração de imagem a partir de um JSON de workflow
- Edição de imagem com 1 imagem de referência enviada
- Geração de vídeo a partir de um JSON de workflow
- Geração de vídeo com 1 imagem de referência enviada
- Geração de música ou áudio por meio da ferramenta compartilhada `music_generate`
- Download de saída a partir de um nó configurado ou de todos os nós de saída correspondentes

O plugin agrupado é orientado por workflow, então o OpenClaw não tenta mapear
`size`, `aspectRatio`, `resolution`, `durationSeconds` ou controles no estilo TTS
genéricos para o seu grafo.

## Estrutura da configuração

O Comfy oferece suporte a configurações compartilhadas de conexão no nível superior, além de seções
de workflow por capacidade:

```json5
{
  models: {
    providers: {
      comfy: {
        mode: "local",
        baseUrl: "http://127.0.0.1:8188",
        image: {
          workflowPath: "./workflows/flux-api.json",
          promptNodeId: "6",
          outputNodeId: "9",
        },
        video: {
          workflowPath: "./workflows/video-api.json",
          promptNodeId: "12",
          outputNodeId: "21",
        },
        music: {
          workflowPath: "./workflows/music-api.json",
          promptNodeId: "3",
          outputNodeId: "18",
        },
      },
    },
  },
}
```

Chaves compartilhadas:

- `mode`: `local` ou `cloud`
- `baseUrl`: por padrão `http://127.0.0.1:8188` para local ou `https://cloud.comfy.org` para cloud
- `apiKey`: alternativa opcional de chave inline às variáveis de ambiente
- `allowPrivateNetwork`: permite um `baseUrl` privado/LAN no modo cloud

Chaves por capacidade em `image`, `video` ou `music`:

- `workflow` ou `workflowPath`: obrigatório
- `promptNodeId`: obrigatório
- `promptInputName`: o padrão é `text`
- `outputNodeId`: opcional
- `pollIntervalMs`: opcional
- `timeoutMs`: opcional

As seções de imagem e vídeo também oferecem suporte a:

- `inputImageNodeId`: obrigatório quando você passa uma imagem de referência
- `inputImageInputName`: o padrão é `image`

## Compatibilidade com versões anteriores

A configuração de imagem existente no nível superior ainda funciona:

```json5
{
  models: {
    providers: {
      comfy: {
        workflowPath: "./workflows/flux-api.json",
        promptNodeId: "6",
        outputNodeId: "9",
      },
    },
  },
}
```

O OpenClaw trata esse formato legado como a configuração do workflow de imagem.

## Workflows de imagem

Defina o modelo de imagem padrão:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "comfy/workflow",
      },
    },
  },
}
```

Exemplo de edição com imagem de referência:

```json5
{
  models: {
    providers: {
      comfy: {
        image: {
          workflowPath: "./workflows/edit-api.json",
          promptNodeId: "6",
          inputImageNodeId: "7",
          inputImageInputName: "image",
          outputNodeId: "9",
        },
      },
    },
  },
}
```

## Workflows de vídeo

Defina o modelo de vídeo padrão:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "comfy/workflow",
      },
    },
  },
}
```

Os workflows de vídeo do Comfy atualmente oferecem suporte a texto para vídeo e imagem para vídeo por meio
do grafo configurado. O OpenClaw não passa vídeos de entrada para workflows do Comfy.

## Workflows de música

O plugin agrupado registra um provedor de geração de música para saídas de
áudio ou música definidas por workflow, expostas por meio da ferramenta compartilhada `music_generate`:

```text
/tool music_generate prompt="Warm ambient synth loop with soft tape texture"
```

Use a seção de configuração `music` para apontar para seu JSON de workflow de áudio e para o
nó de saída.

## Comfy Cloud

Use `mode: "cloud"` mais um dos seguintes:

- `COMFY_API_KEY`
- `COMFY_CLOUD_API_KEY`
- `models.providers.comfy.apiKey`

O modo cloud ainda usa as mesmas seções de workflow `image`, `video` e `music`.

## Testes live

Existe cobertura live opt-in para o plugin agrupado:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

O teste live pula casos individuais de imagem, vídeo ou música, a menos que a seção
de workflow correspondente do Comfy esteja configurada.

## Relacionados

- [Geração de imagem](/pt-BR/tools/image-generation)
- [Geração de vídeo](/tools/video-generation)
- [Geração de música](/tools/music-generation)
- [Diretório de provedores](/pt-BR/providers/index)
- [Referência de configuração](/pt-BR/gateway/configuration-reference#agent-defaults)
