---
read_when:
    - Gerando vídeos por meio do agente
    - Configurando provedores e modelos de geração de vídeo
    - Entendendo os parâmetros da ferramenta `video_generate`
summary: Gere vídeos a partir de texto, imagens ou vídeos existentes usando 12 backends de provedor
title: Geração de vídeo
x-i18n:
    generated_at: "2026-04-07T05:33:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf1224c59a5f1217f56cf2001870aca710a09268677dcd12aad2efbe476e47b7
    source_path: tools/video-generation.md
    workflow: 15
---

# Geração de vídeo

Os agentes do OpenClaw podem gerar vídeos a partir de prompts de texto, imagens de referência ou vídeos existentes. Há suporte para doze backends de provedor, cada um com diferentes opções de modelo, modos de entrada e conjuntos de recursos. O agente escolhe automaticamente o provedor correto com base na sua configuração e nas chaves de API disponíveis.

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

> Gere um vídeo cinematográfico de 5 segundos de uma lagosta simpática surfando ao pôr do sol.

O agente chama `video_generate` automaticamente. Nenhuma allowlist de ferramenta é necessária.

## O que acontece quando você gera um vídeo

A geração de vídeo é assíncrona. Quando o agente chama `video_generate` em uma sessão:

1. O OpenClaw envia a solicitação ao provedor e retorna imediatamente um ID de tarefa.
2. O provedor processa o job em segundo plano (normalmente de 30 segundos a 5 minutos, dependendo do provedor e da resolução).
3. Quando o vídeo fica pronto, o OpenClaw reativa a mesma sessão com um evento interno de conclusão.
4. O agente publica o vídeo finalizado de volta na conversa original.

Enquanto um job estiver em andamento, chamadas duplicadas de `video_generate` na mesma sessão retornam o status atual da tarefa em vez de iniciar outra geração. Use `openclaw tasks list` ou `openclaw tasks show <taskId>` para verificar o progresso pela CLI.

Fora de execuções de agente com respaldo em sessão (por exemplo, invocações diretas de ferramenta), a ferramenta recorre à geração inline e retorna o caminho final da mídia no mesmo turno.

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

| Provider | Default model                   | Text | Image ref         | Video ref        | API key                                  |
| -------- | ------------------------------- | ---- | ----------------- | ---------------- | ---------------------------------------- |
| Alibaba  | `wan2.6-t2v`                    | Yes  | Yes (remote URL)  | Yes (remote URL) | `MODELSTUDIO_API_KEY`                    |
| BytePlus | `seedance-1-0-lite-t2v-250428`  | Yes  | 1 image           | No               | `BYTEPLUS_API_KEY`                       |
| ComfyUI  | `workflow`                      | Yes  | 1 image           | No               | `COMFY_API_KEY` or `COMFY_CLOUD_API_KEY` |
| fal      | `fal-ai/minimax/video-01-live`  | Yes  | 1 image           | No               | `FAL_KEY`                                |
| Google   | `veo-3.1-fast-generate-preview` | Yes  | 1 image           | 1 video          | `GEMINI_API_KEY`                         |
| MiniMax  | `MiniMax-Hailuo-2.3`            | Yes  | 1 image           | No               | `MINIMAX_API_KEY`                        |
| OpenAI   | `sora-2`                        | Yes  | 1 image           | 1 video          | `OPENAI_API_KEY`                         |
| Qwen     | `wan2.6-t2v`                    | Yes  | Yes (remote URL)  | Yes (remote URL) | `QWEN_API_KEY`                           |
| Runway   | `gen4.5`                        | Yes  | 1 image           | 1 video          | `RUNWAYML_API_SECRET`                    |
| Together | `Wan-AI/Wan2.2-T2V-A14B`        | Yes  | 1 image           | No               | `TOGETHER_API_KEY`                       |
| Vydra    | `veo3`                          | Yes  | 1 image (`kling`) | No               | `VYDRA_API_KEY`                          |
| xAI      | `grok-imagine-video`            | Yes  | 1 image           | 1 video          | `XAI_API_KEY`                            |

Alguns provedores aceitam variáveis de ambiente adicionais ou alternativas para chave de API. Consulte as páginas individuais de [provedor](#related) para detalhes.

Execute `video_generate action=list` para inspecionar em runtime os provedores, modelos e
modos de runtime disponíveis.

### Matriz de capacidades declaradas

Este é o contrato explícito de modo usado por `video_generate`, testes de contrato
e a varredura compartilhada ao vivo.

| Provider | `generate` | `imageToVideo` | `videoToVideo` | Shared live lanes today                                                                                                                  |
| -------- | ---------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; `videoToVideo` ignorado porque este provedor exige URLs remotas de vídeo `http(s)`                         |
| BytePlus | Yes        | Yes            | No             | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI  | Yes        | Yes            | No             | Não está na varredura compartilhada; a cobertura específica de workflow fica nos testes do Comfy                                        |
| fal      | Yes        | Yes            | No             | `generate`, `imageToVideo`                                                                                                               |
| Google   | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; o `videoToVideo` compartilhado é ignorado porque a varredura atual do Gemini/Veo com respaldo em buffer não aceita essa entrada |
| MiniMax  | Yes        | Yes            | No             | `generate`, `imageToVideo`                                                                                                               |
| OpenAI   | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; o `videoToVideo` compartilhado é ignorado porque este caminho atual de org/entrada precisa de acesso a inpaint/remix no lado do provedor |
| Qwen     | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; `videoToVideo` ignorado porque este provedor exige URLs remotas de vídeo `http(s)`                         |
| Runway   | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; `videoToVideo` roda apenas quando o modelo selecionado é `runway/gen4_aleph`                               |
| Together | Yes        | Yes            | No             | `generate`, `imageToVideo`                                                                                                               |
| Vydra    | Yes        | Yes            | No             | `generate`; o `imageToVideo` compartilhado é ignorado porque o `veo3` empacotado é apenas texto para vídeo e o `kling` empacotado exige uma URL remota de imagem |
| xAI      | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; `videoToVideo` ignorado porque este provedor atualmente exige uma URL remota de MP4                        |

## Parâmetros da ferramenta

### Obrigatórios

| Parameter | Type   | Description                                                                   |
| --------- | ------ | ----------------------------------------------------------------------------- |
| `prompt`  | string | Descrição em texto do vídeo a gerar (obrigatória para `action: "generate"`) |

### Entradas de conteúdo

| Parameter | Type     | Description                           |
| --------- | -------- | ------------------------------------- |
| `image`   | string   | Imagem única de referência (caminho ou URL) |
| `images`  | string[] | Múltiplas imagens de referência (até 5) |
| `video`   | string   | Vídeo único de referência (caminho ou URL) |
| `videos`  | string[] | Múltiplos vídeos de referência (até 4) |

### Controles de estilo

| Parameter         | Type    | Description                                                              |
| ----------------- | ------- | ------------------------------------------------------------------------ |
| `aspectRatio`     | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`  |
| `resolution`      | string  | `480P`, `720P`, `768P` ou `1080P`                                        |
| `durationSeconds` | number  | Duração alvo em segundos (arredondada para o valor compatível mais próximo do provedor) |
| `size`            | string  | Indicação de tamanho quando o provedor oferece suporte                   |
| `audio`           | boolean | Habilita áudio gerado quando houver suporte                              |
| `watermark`       | boolean | Ativa/desativa marca d'água do provedor quando houver suporte            |

### Avançado

| Parameter  | Type   | Description                                     |
| ---------- | ------ | ----------------------------------------------- |
| `action`   | string | `"generate"` (padrão), `"status"` ou `"list"`   |
| `model`    | string | Substituição de provedor/modelo (por exemplo, `runway/gen4.5`) |
| `filename` | string | Sugestão de nome do arquivo de saída            |

Nem todos os provedores oferecem suporte a todos os parâmetros. O OpenClaw já normaliza a duração para o valor compatível mais próximo do provedor e também remapeia indicações de geometria traduzidas, como tamanho para proporção, quando um provedor de fallback expõe uma superfície de controle diferente. Substituições realmente não compatíveis são ignoradas em regime de melhor esforço e informadas como avisos no resultado da ferramenta. Limites rígidos de capacidade, como entradas de referência em excesso, falham antes do envio.

Os resultados da ferramenta informam as configurações aplicadas. Quando o OpenClaw remapeia duração ou geometria durante o fallback de provedor, os valores retornados de `durationSeconds`, `size`, `aspectRatio` e `resolution` refletem o que foi enviado, e `details.normalization` captura a tradução do solicitado para o aplicado.

As entradas de referência também selecionam o modo de runtime:

- Sem mídia de referência: `generate`
- Qualquer imagem de referência: `imageToVideo`
- Qualquer vídeo de referência: `videoToVideo`

Referências mistas de imagem e vídeo não são uma superfície estável de capacidade compartilhada.
Prefira um tipo de referência por solicitação.

## Ações

- **generate** (padrão) -- cria um vídeo a partir do prompt informado e entradas opcionais de referência.
- **status** -- verifica o estado da tarefa de vídeo em andamento para a sessão atual sem iniciar outra geração.
- **list** -- mostra provedores disponíveis, modelos e suas capacidades.

## Seleção de modelo

Ao gerar um vídeo, o OpenClaw resolve o modelo nesta ordem:

1. **Parâmetro de ferramenta `model`** -- se o agente especificar um na chamada.
2. **`videoGenerationModel.primary`** -- da configuração.
3. **`videoGenerationModel.fallbacks`** -- tentados em ordem.
4. **Detecção automática** -- usa provedores que têm autenticação válida, começando pelo provedor padrão atual e depois pelos demais provedores em ordem alfabética.

Se um provedor falhar, o próximo candidato é tentado automaticamente. Se todos os candidatos falharem, o erro incluirá detalhes de cada tentativa.

Defina `agents.defaults.mediaGenerationAutoProviderFallback: false` se você quiser que
a geração de vídeo use apenas as entradas explícitas `model`, `primary` e `fallbacks`.

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

## Observações por provedor

| Provider | Notes                                                                                                                                                       |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | Usa o endpoint assíncrono do DashScope/Model Studio. Imagens e vídeos de referência devem ser URLs remotas `http(s)`.                                     |
| BytePlus | Apenas uma imagem de referência.                                                                                                                            |
| ComfyUI  | Execução local ou em nuvem orientada por workflow. Oferece suporte a texto para vídeo e imagem para vídeo por meio do grafo configurado.                  |
| fal      | Usa fluxo com respaldo em fila para jobs longos. Apenas uma imagem de referência.                                                                          |
| Google   | Usa Gemini/Veo. Oferece suporte a uma imagem ou um vídeo de referência.                                                                                    |
| MiniMax  | Apenas uma imagem de referência.                                                                                                                            |
| OpenAI   | Apenas a substituição `size` é encaminhada. Outras substituições de estilo (`aspectRatio`, `resolution`, `audio`, `watermark`) são ignoradas com aviso.  |
| Qwen     | Mesmo backend DashScope do Alibaba. As entradas de referência devem ser URLs remotas `http(s)`; arquivos locais são rejeitados imediatamente.             |
| Runway   | Oferece suporte a arquivos locais via data URIs. `videoToVideo` exige `runway/gen4_aleph`. Execuções apenas com texto expõem as proporções `16:9` e `9:16`. |
| Together | Apenas uma imagem de referência.                                                                                                                            |
| Vydra    | Usa `https://www.vydra.ai/api/v1` diretamente para evitar redirecionamentos que descartam autenticação. `veo3` é empacotado apenas como texto para vídeo; `kling` exige uma URL remota de imagem. |
| xAI      | Oferece suporte a texto para vídeo, imagem para vídeo e fluxos remotos de edição/extensão de vídeo.                                                       |

## Modos de capacidade do provedor

O contrato compartilhado de geração de vídeo agora permite que provedores declarem
capacidades específicas por modo em vez de apenas limites agregados planos. Novas
implementações de provedor devem preferir blocos explícitos de modo:

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
bastam para anunciar suporte a modo de transformação. Os provedores devem declarar
explicitamente `generate`, `imageToVideo` e `videoToVideo` para que testes ao vivo,
testes de contrato e a ferramenta compartilhada `video_generate` possam validar o suporte
aos modos de forma determinística.

## Testes ao vivo

Cobertura ao vivo opt-in para os provedores compartilhados empacotados:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Wrapper do repositório:

```bash
pnpm test:live:media video
```

Esse arquivo de teste ao vivo carrega variáveis de ambiente ausentes do provedor a partir de `~/.profile`, prefere
chaves de API live/env em vez de perfis de autenticação armazenados por padrão e executa os
modos declarados que consegue exercitar com segurança usando mídia local:

- `generate` para todos os provedores da varredura
- `imageToVideo` quando `capabilities.imageToVideo.enabled`
- `videoToVideo` quando `capabilities.videoToVideo.enabled` e o provedor/modelo
  aceita entrada de vídeo local com respaldo em buffer na varredura compartilhada

Hoje a faixa de testes ao vivo compartilhada de `videoToVideo` cobre:

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
