---
read_when:
    - Gerando vídeos pelo agente
    - Configurando provedores e modelos de geração de vídeo
    - Entendendo os parâmetros da ferramenta video_generate
summary: Gere vídeos a partir de texto, imagens ou vídeos existentes usando 12 backends de provedor
title: Geração de vídeo
x-i18n:
    generated_at: "2026-04-11T02:47:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6848d03ef578181902517d068e8d9fe2f845e572a90481bbdf7bd9f1c591f245
    source_path: tools/video-generation.md
    workflow: 15
---

# Geração de vídeo

Agentes do OpenClaw podem gerar vídeos a partir de prompts de texto, imagens de referência ou vídeos existentes. Há suporte para doze backends de provedor, cada um com diferentes opções de modelo, modos de entrada e conjuntos de recursos. O agente escolhe automaticamente o provedor correto com base na sua configuração e nas chaves de API disponíveis.

<Note>
A ferramenta `video_generate` só aparece quando pelo menos um provedor de geração de vídeo está disponível. Se você não a vir nas ferramentas do seu agente, defina uma chave de API do provedor ou configure `agents.defaults.videoGenerationModel`.
</Note>

O OpenClaw trata a geração de vídeo como três modos de runtime:

- `generate` para solicitações de texto para vídeo sem mídia de referência
- `imageToVideo` quando a solicitação inclui uma ou mais imagens de referência
- `videoToVideo` quando a solicitação inclui um ou mais vídeos de referência

Os provedores podem oferecer suporte a qualquer subconjunto desses modos. A ferramenta valida o
modo ativo antes do envio e informa os modos compatíveis em `action=list`.

## Início rápido

1. Defina uma chave de API para qualquer provedor compatível:

```bash
export GEMINI_API_KEY="your-key"
```

2. Opcionalmente, fixe um modelo padrão:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. Peça ao agente:

> Gere um vídeo cinematográfico de 5 segundos de uma lagosta amigável surfando ao pôr do sol.

O agente chama `video_generate` automaticamente. Nenhuma allowlist de ferramenta é necessária.

## O que acontece quando você gera um vídeo

A geração de vídeo é assíncrona. Quando o agente chama `video_generate` em uma sessão:

1. O OpenClaw envia a solicitação ao provedor e retorna imediatamente um ID de tarefa.
2. O provedor processa o job em segundo plano (normalmente de 30 segundos a 5 minutos, dependendo do provedor e da resolução).
3. Quando o vídeo fica pronto, o OpenClaw reativa a mesma sessão com um evento interno de conclusão.
4. O agente publica o vídeo finalizado de volta na conversa original.

Enquanto um job estiver em andamento, chamadas duplicadas de `video_generate` na mesma sessão retornam o status atual da tarefa em vez de iniciar outra geração. Use `openclaw tasks list` ou `openclaw tasks show <taskId>` para verificar o progresso pela CLI.

Fora de execuções de agente com suporte a sessão (por exemplo, invocações diretas de ferramenta), a ferramenta recorre à geração inline e retorna o caminho final da mídia no mesmo turno.

### Ciclo de vida da tarefa

Cada solicitação `video_generate` passa por quatro estados:

1. **queued** -- tarefa criada, aguardando o provedor aceitá-la.
2. **running** -- o provedor está processando (normalmente de 30 segundos a 5 minutos, dependendo do provedor e da resolução).
3. **succeeded** -- vídeo pronto; o agente é reativado e o publica na conversa.
4. **failed** -- erro do provedor ou timeout; o agente é reativado com detalhes do erro.

Verifique o status pela CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Prevenção de duplicatas: se uma tarefa de vídeo já estiver `queued` ou `running` para a sessão atual, `video_generate` retornará o status da tarefa existente em vez de iniciar uma nova. Use `action: "status"` para verificar explicitamente sem disparar uma nova geração.

## Provedores compatíveis

| Provedor | Modelo padrão                  | Texto | Imagem ref        | Vídeo ref        | Chave de API                             |
| -------- | ------------------------------ | ----- | ----------------- | ---------------- | ---------------------------------------- |
| Alibaba  | `wan2.6-t2v`                   | Sim   | Sim (URL remota)  | Sim (URL remota) | `MODELSTUDIO_API_KEY`                    |
| BytePlus | `seedance-1-0-lite-t2v-250428` | Sim   | 1 imagem          | Não              | `BYTEPLUS_API_KEY`                       |
| ComfyUI  | `workflow`                     | Sim   | 1 imagem          | Não              | `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY` |
| fal      | `fal-ai/minimax/video-01-live` | Sim   | 1 imagem          | Não              | `FAL_KEY`                                |
| Google   | `veo-3.1-fast-generate-preview`| Sim   | 1 imagem          | 1 vídeo          | `GEMINI_API_KEY`                         |
| MiniMax  | `MiniMax-Hailuo-2.3`           | Sim   | 1 imagem          | Não              | `MINIMAX_API_KEY`                        |
| OpenAI   | `sora-2`                       | Sim   | 1 imagem          | 1 vídeo          | `OPENAI_API_KEY`                         |
| Qwen     | `wan2.6-t2v`                   | Sim   | Sim (URL remota)  | Sim (URL remota) | `QWEN_API_KEY`                           |
| Runway   | `gen4.5`                       | Sim   | 1 imagem          | 1 vídeo          | `RUNWAYML_API_SECRET`                    |
| Together | `Wan-AI/Wan2.2-T2V-A14B`       | Sim   | 1 imagem          | Não              | `TOGETHER_API_KEY`                       |
| Vydra    | `veo3`                         | Sim   | 1 imagem (`kling`)| Não              | `VYDRA_API_KEY`                          |
| xAI      | `grok-imagine-video`           | Sim   | 1 imagem          | 1 vídeo          | `XAI_API_KEY`                            |

Alguns provedores aceitam variáveis de ambiente adicionais ou alternativas para chave de API. Consulte as [páginas de provedor](#related) individuais para obter detalhes.

Execute `video_generate action=list` para inspecionar provedores, modelos e
modos de runtime disponíveis em tempo de execução.

### Matriz de capacidades declaradas

Este é o contrato explícito de modo usado por `video_generate`, testes de contrato
e a varredura live compartilhada.

| Provedor | `generate` | `imageToVideo` | `videoToVideo` | Lanes live compartilhadas atualmente                                                                                                     |
| -------- | ---------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | Sim        | Sim            | Sim            | `generate`, `imageToVideo`; `videoToVideo` ignorado porque este provedor precisa de URLs de vídeo remotas `http(s)`                    |
| BytePlus | Sim        | Sim            | Não            | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI  | Sim        | Sim            | Não            | Não está na varredura compartilhada; a cobertura específica de workflow fica com os testes do Comfy                                    |
| fal      | Sim        | Sim            | Não            | `generate`, `imageToVideo`                                                                                                               |
| Google   | Sim        | Sim            | Sim            | `generate`, `imageToVideo`; `videoToVideo` compartilhado ignorado porque a varredura Gemini/Veo atual com buffer não aceita essa entrada |
| MiniMax  | Sim        | Sim            | Não            | `generate`, `imageToVideo`                                                                                                               |
| OpenAI   | Sim        | Sim            | Sim            | `generate`, `imageToVideo`; `videoToVideo` compartilhado ignorado porque este caminho atual de organização/entrada precisa de acesso a inpaint/remix do lado do provedor |
| Qwen     | Sim        | Sim            | Sim            | `generate`, `imageToVideo`; `videoToVideo` ignorado porque este provedor precisa de URLs de vídeo remotas `http(s)`                    |
| Runway   | Sim        | Sim            | Sim            | `generate`, `imageToVideo`; `videoToVideo` roda apenas quando o modelo selecionado é `runway/gen4_aleph`                               |
| Together | Sim        | Sim            | Não            | `generate`, `imageToVideo`                                                                                                               |
| Vydra    | Sim        | Sim            | Não            | `generate`; `imageToVideo` compartilhado ignorado porque o `veo3` empacotado é somente texto e o `kling` empacotado exige uma URL de imagem remota |
| xAI      | Sim        | Sim            | Sim            | `generate`, `imageToVideo`; `videoToVideo` ignorado porque este provedor atualmente precisa de uma URL MP4 remota                      |

## Parâmetros da ferramenta

### Obrigatório

| Parâmetro | Tipo   | Descrição                                                                     |
| --------- | ------ | ----------------------------------------------------------------------------- |
| `prompt`  | string | Descrição em texto do vídeo a ser gerado (obrigatório para `action: "generate"`) |

### Entradas de conteúdo

| Parâmetro | Tipo     | Descrição                             |
| --------- | -------- | ------------------------------------- |
| `image`   | string   | Imagem única de referência (caminho ou URL) |
| `images`  | string[] | Várias imagens de referência (até 5)  |
| `video`   | string   | Vídeo único de referência (caminho ou URL) |
| `videos`  | string[] | Vários vídeos de referência (até 4)   |

### Controles de estilo

| Parâmetro        | Tipo    | Descrição                                                                |
| ---------------- | ------- | ------------------------------------------------------------------------ |
| `aspectRatio`    | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`     | string  | `480P`, `720P`, `768P` ou `1080P`                                        |
| `durationSeconds`| number  | Duração alvo em segundos (arredondada para o valor compatível mais próximo do provedor) |
| `size`           | string  | Dica de tamanho quando o provedor oferece suporte                        |
| `audio`          | boolean | Habilita áudio gerado quando houver suporte                              |
| `watermark`      | boolean | Ativa/desativa marca d'água do provedor quando houver suporte            |

### Avançado

| Parâmetro | Tipo   | Descrição                                          |
| --------- | ------ | -------------------------------------------------- |
| `action`  | string | `"generate"` (padrão), `"status"` ou `"list"`      |
| `model`   | string | Substituição de provedor/modelo (por exemplo, `runway/gen4.5`) |
| `filename`| string | Dica para nome do arquivo de saída                 |

Nem todos os provedores oferecem suporte a todos os parâmetros. O OpenClaw já normaliza a duração para o valor compatível mais próximo do provedor e também remapeia dicas de geometria traduzidas, como size para aspect ratio, quando um provedor de fallback expõe uma superfície de controle diferente. Substituições realmente sem suporte são ignoradas no melhor esforço e informadas como avisos no resultado da ferramenta. Limites rígidos de capacidade, como entradas de referência em excesso, falham antes do envio.

Os resultados da ferramenta informam as configurações aplicadas. Quando o OpenClaw remapeia duração ou geometria durante o fallback de provedor, os valores retornados de `durationSeconds`, `size`, `aspectRatio` e `resolution` refletem o que foi enviado, e `details.normalization` registra a tradução do solicitado para o aplicado.

As entradas de referência também selecionam o modo de runtime:

- Sem mídia de referência: `generate`
- Qualquer imagem de referência: `imageToVideo`
- Qualquer vídeo de referência: `videoToVideo`

Referências mistas de imagem e vídeo não formam uma superfície compartilhada de capacidade estável.
Prefira um tipo de referência por solicitação.

## Ações

- **generate** (padrão) -- cria um vídeo a partir do prompt fornecido e entradas de referência opcionais.
- **status** -- verifica o estado da tarefa de vídeo em andamento para a sessão atual sem iniciar outra geração.
- **list** -- mostra provedores, modelos e suas capacidades disponíveis.

## Seleção de modelo

Ao gerar um vídeo, o OpenClaw resolve o modelo nesta ordem:

1. **Parâmetro `model` da ferramenta** -- se o agente especificar um na chamada.
2. **`videoGenerationModel.primary`** -- vindo da configuração.
3. **`videoGenerationModel.fallbacks`** -- tentados em ordem.
4. **Detecção automática** -- usa provedores que têm autenticação válida, começando pelo provedor padrão atual e depois pelos provedores restantes em ordem alfabética.

Se um provedor falhar, o próximo candidato será tentado automaticamente. Se todos os candidatos falharem, o erro incluirá detalhes de cada tentativa.

Defina `agents.defaults.mediaGenerationAutoProviderFallback: false` se você quiser
que a geração de vídeo use apenas as entradas explícitas de `model`, `primary` e `fallbacks`.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
      },
    },
  },
}
```

O agente de vídeo da HeyGen no fal pode ser fixado com:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "fal/fal-ai/heygen/v2/video-agent",
      },
    },
  },
}
```

O Seedance 2.0 no fal pode ser fixado com:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "fal/bytedance/seedance-2.0/fast/text-to-video",
      },
    },
  },
}
```

## Observações sobre provedores

| Provedor | Observações                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | Usa o endpoint assíncrono do DashScope/Model Studio. Imagens e vídeos de referência precisam ser URLs remotas `http(s)`.                                           |
| BytePlus | Apenas uma imagem de referência.                                                                                                                                      |
| ComfyUI  | Execução local ou em nuvem orientada por workflow. Oferece suporte a texto para vídeo e imagem para vídeo por meio do grafo configurado.                            |
| fal      | Usa fluxo com fila para jobs de longa duração. Apenas uma imagem de referência. Inclui refs de modelo HeyGen video-agent e Seedance 2.0 para texto para vídeo e imagem para vídeo. |
| Google   | Usa Gemini/Veo. Oferece suporte a uma imagem ou um vídeo de referência.                                                                                              |
| MiniMax  | Apenas uma imagem de referência.                                                                                                                                      |
| OpenAI   | Apenas a substituição de `size` é encaminhada. Outras substituições de estilo (`aspectRatio`, `resolution`, `audio`, `watermark`) são ignoradas com um aviso.      |
| Qwen     | Mesmo backend DashScope do Alibaba. Entradas de referência precisam ser URLs remotas `http(s)`; arquivos locais são rejeitados antecipadamente.                     |
| Runway   | Oferece suporte a arquivos locais por meio de URIs de dados. Vídeo para vídeo exige `runway/gen4_aleph`. Execuções somente com texto expõem proporções `16:9` e `9:16`. |
| Together | Apenas uma imagem de referência.                                                                                                                                      |
| Vydra    | Usa `https://www.vydra.ai/api/v1` diretamente para evitar redirecionamentos que descartam autenticação. `veo3` é empacotado apenas como texto para vídeo; `kling` exige uma URL remota de imagem. |
| xAI      | Oferece suporte a fluxos de texto para vídeo, imagem para vídeo e edição/extensão de vídeo remoto.                                                                  |

## Modos de capacidade do provedor

O contrato compartilhado de geração de vídeo agora permite que provedores declarem
capacidades específicas por modo em vez de apenas limites agregados planos. Novas
implementações de provedor devem preferir blocos explícitos por modo:

```typescript
capabilities: {
  generate: {
    maxVideos: 1,
    maxDurationSeconds: 10,
    supportsResolution: true,
  },
  imageToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputImages: 1,
    maxDurationSeconds: 5,
  },
  videoToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputVideos: 1,
    maxDurationSeconds: 5,
  },
}
```

Campos agregados planos como `maxInputImages` e `maxInputVideos` não
são suficientes para anunciar suporte a modo de transformação. Os provedores devem declarar
`generate`, `imageToVideo` e `videoToVideo` explicitamente para que testes live,
testes de contrato e a ferramenta compartilhada `video_generate` possam validar o suporte a modo
de forma determinística.

## Testes live

Cobertura live opt-in para os provedores empacotados compartilhados:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Wrapper do repositório:

```bash
pnpm test:live:media video
```

Este arquivo live carrega variáveis de ambiente ausentes de provedor a partir de `~/.profile`, prioriza
chaves de API live/env em vez de perfis de autenticação armazenados por padrão e executa os
modos declarados que consegue exercitar com segurança com mídia local:

- `generate` para todo provedor na varredura
- `imageToVideo` quando `capabilities.imageToVideo.enabled`
- `videoToVideo` quando `capabilities.videoToVideo.enabled` e o provedor/modelo
  aceita entrada de vídeo local com buffer na varredura compartilhada

Hoje a lane live compartilhada `videoToVideo` cobre:

- `runway` apenas quando você seleciona `runway/gen4_aleph`

## Configuração

Defina o modelo padrão de geração de vídeo na sua configuração do OpenClaw:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-r2v-flash"],
      },
    },
  },
}
```

Ou pela CLI:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## Relacionado

- [Visão geral das ferramentas](/pt-BR/tools)
- [Tarefas em segundo plano](/pt-BR/automation/tasks) -- rastreamento de tarefas para geração assíncrona de vídeo
- [Alibaba Model Studio](/pt-BR/providers/alibaba)
- [BytePlus](/pt-BR/concepts/model-providers#byteplus-international)
- [ComfyUI](/pt-BR/providers/comfy)
- [fal](/pt-BR/providers/fal)
- [Google (Gemini)](/pt-BR/providers/google)
- [MiniMax](/pt-BR/providers/minimax)
- [OpenAI](/pt-BR/providers/openai)
- [Qwen](/pt-BR/providers/qwen)
- [Runway](/pt-BR/providers/runway)
- [Together AI](/pt-BR/providers/together)
- [Vydra](/pt-BR/providers/vydra)
- [xAI](/pt-BR/providers/xai)
- [Referência de configuração](/pt-BR/gateway/configuration-reference#agent-defaults)
- [Modelos](/pt-BR/concepts/models)
