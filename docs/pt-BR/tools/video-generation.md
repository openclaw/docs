---
read_when:
    - Gerando vídeos por meio do agente
    - Configurando provedores e modelos de geração de vídeo
    - Entendendo os parâmetros da ferramenta video_generate
summary: Gere vídeos a partir de texto, imagens ou vídeos existentes usando 12 backends de provedor
title: Geração de vídeo
x-i18n:
    generated_at: "2026-04-06T03:13:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4afec87368232221db1aa5a3980254093d6a961b17271b2dcbf724e6bd455b16
    source_path: tools/video-generation.md
    workflow: 15
---

# Geração de vídeo

Os agentes do OpenClaw podem gerar vídeos a partir de prompts de texto, imagens de referência ou vídeos existentes. Doze backends de provedor são compatíveis, cada um com diferentes opções de modelo, modos de entrada e conjuntos de recursos. O agente escolhe automaticamente o provedor correto com base na sua configuração e nas chaves de API disponíveis.

<Note>
A ferramenta `video_generate` só aparece quando pelo menos um provedor de geração de vídeo está disponível. Se você não a vir nas ferramentas do seu agente, defina uma chave de API de provedor ou configure `agents.defaults.videoGenerationModel`.
</Note>

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

> Gere um vídeo cinematográfico de 5 segundos de um lagostim simpático surfando ao pôr do sol.

O agente chama `video_generate` automaticamente. Não é necessária nenhuma allowlist de ferramenta.

## O que acontece quando você gera um vídeo

A geração de vídeo é assíncrona. Quando o agente chama `video_generate` em uma sessão:

1. O OpenClaw envia a solicitação ao provedor e retorna imediatamente um ID de tarefa.
2. O provedor processa o trabalho em segundo plano (normalmente de 30 segundos a 5 minutos, dependendo do provedor e da resolução).
3. Quando o vídeo fica pronto, o OpenClaw reativa a mesma sessão com um evento interno de conclusão.
4. O agente publica o vídeo finalizado de volta na conversa original.

Enquanto um trabalho está em andamento, chamadas duplicadas de `video_generate` na mesma sessão retornam o status atual da tarefa em vez de iniciar outra geração. Use `openclaw tasks list` ou `openclaw tasks show <taskId>` para verificar o progresso pela CLI.

Fora de execuções de agente com suporte de sessão (por exemplo, invocações diretas de ferramenta), a ferramenta recorre à geração inline e retorna o caminho final da mídia no mesmo turno.

## Provedores compatíveis

| Provedor | Modelo padrão                  | Texto | Ref. de imagem    | Ref. de vídeo     | Chave de API                              |
| -------- | ------------------------------ | ----- | ----------------- | ----------------- | ----------------------------------------- |
| Alibaba  | `wan2.6-t2v`                   | Sim   | Sim (URL remota)  | Sim (URL remota)  | `MODELSTUDIO_API_KEY`                     |
| BytePlus | `seedance-1-0-lite-t2v-250428` | Sim   | 1 imagem          | Não               | `BYTEPLUS_API_KEY`                        |
| ComfyUI  | `workflow`                     | Sim   | 1 imagem          | Não               | `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY`  |
| fal      | `fal-ai/minimax/video-01-live` | Sim   | 1 imagem          | Não               | `FAL_KEY`                                 |
| Google   | `veo-3.1-fast-generate-preview`| Sim   | 1 imagem          | 1 vídeo           | `GEMINI_API_KEY`                          |
| MiniMax  | `MiniMax-Hailuo-2.3`           | Sim   | 1 imagem          | Não               | `MINIMAX_API_KEY`                         |
| OpenAI   | `sora-2`                       | Sim   | 1 imagem          | 1 vídeo           | `OPENAI_API_KEY`                          |
| Qwen     | `wan2.6-t2v`                   | Sim   | Sim (URL remota)  | Sim (URL remota)  | `QWEN_API_KEY`                            |
| Runway   | `gen4.5`                       | Sim   | 1 imagem          | 1 vídeo           | `RUNWAYML_API_SECRET`                     |
| Together | `Wan-AI/Wan2.2-T2V-A14B`       | Sim   | 1 imagem          | Não               | `TOGETHER_API_KEY`                        |
| Vydra    | `veo3`                         | Sim   | 1 imagem (`kling`) | Não              | `VYDRA_API_KEY`                           |
| xAI      | `grok-imagine-video`           | Sim   | 1 imagem          | 1 vídeo           | `XAI_API_KEY`                             |

Alguns provedores aceitam variáveis de ambiente adicionais ou alternativas para chave de API. Consulte as [páginas individuais dos provedores](#related) para ver os detalhes.

Execute `video_generate action=list` para inspecionar os provedores e modelos disponíveis em runtime.

## Parâmetros da ferramenta

### Obrigatório

| Parâmetro | Tipo   | Descrição                                                                    |
| --------- | ------ | ---------------------------------------------------------------------------- |
| `prompt`  | string | Descrição em texto do vídeo a ser gerado (obrigatório para `action: "generate"`) |

### Entradas de conteúdo

| Parâmetro | Tipo     | Descrição                                  |
| --------- | -------- | ------------------------------------------ |
| `image`   | string   | Imagem de referência única (caminho ou URL) |
| `images`  | string[] | Várias imagens de referência (até 5)       |
| `video`   | string   | Vídeo de referência único (caminho ou URL) |
| `videos`  | string[] | Vários vídeos de referência (até 4)        |

### Controles de estilo

| Parâmetro        | Tipo    | Descrição                                                                |
| ---------------- | ------- | ------------------------------------------------------------------------ |
| `aspectRatio`    | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`     | string  | `480P`, `720P` ou `1080P`                                                |
| `durationSeconds`| number  | Duração alvo em segundos (arredondada para o valor compatível mais próximo do provedor) |
| `size`           | string  | Dica de tamanho quando o provedor oferece suporte                        |
| `audio`          | boolean | Ativa áudio gerado quando compatível                                     |
| `watermark`      | boolean | Alterna a marca d'água do provedor quando compatível                     |

### Avançado

| Parâmetro | Tipo   | Descrição                                              |
| ----------| ------ | ------------------------------------------------------ |
| `action`  | string | `"generate"` (padrão), `"status"` ou `"list"`          |
| `model`   | string | Substituição de provedor/modelo (por exemplo, `runway/gen4.5`) |
| `filename`| string | Dica de nome do arquivo de saída                       |

Nem todos os provedores oferecem suporte a todos os parâmetros. Substituições não compatíveis são ignoradas em regime de melhor esforço e reportadas como avisos no resultado da ferramenta. Limites rígidos de capacidade (como entradas de referência em excesso) falham antes do envio.

## Ações

- **generate** (padrão) -- cria um vídeo a partir do prompt fornecido e entradas de referência opcionais.
- **status** -- verifica o estado da tarefa de vídeo em andamento para a sessão atual sem iniciar outra geração.
- **list** -- mostra provedores, modelos disponíveis e suas capacidades.

## Seleção de modelo

Ao gerar um vídeo, o OpenClaw resolve o modelo nesta ordem:

1. **Parâmetro de ferramenta `model`** -- se o agente especificar um na chamada.
2. **`videoGenerationModel.primary`** -- da configuração.
3. **`videoGenerationModel.fallbacks`** -- tentados em ordem.
4. **Detecção automática** -- usa provedores com autenticação válida, começando com o provedor padrão atual e depois os provedores restantes em ordem alfabética.

Se um provedor falhar, o próximo candidato é tentado automaticamente. Se todos os candidatos falharem, o erro incluirá detalhes de cada tentativa.

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

## Observações sobre provedores

| Provedor | Observações                                                                                                                                    |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | Usa o endpoint assíncrono DashScope/Model Studio. Imagens e vídeos de referência devem ser URLs remotas `http(s)`.                           |
| BytePlus | Apenas uma imagem de referência.                                                                                                               |
| ComfyUI  | Execução local ou em cloud orientada por workflow. Oferece suporte a texto para vídeo e imagem para vídeo por meio do grafo configurado.     |
| fal      | Usa um fluxo baseado em fila para trabalhos longos. Apenas uma imagem de referência.                                                          |
| Google   | Usa Gemini/Veo. Oferece suporte a uma imagem ou um vídeo de referência.                                                                        |
| MiniMax  | Apenas uma imagem de referência.                                                                                                               |
| OpenAI   | Apenas a substituição `size` é encaminhada. Outras substituições de estilo (`aspectRatio`, `resolution`, `audio`, `watermark`) são ignoradas com um aviso. |
| Qwen     | Mesmo backend DashScope do Alibaba. Entradas de referência devem ser URLs remotas `http(s)`; arquivos locais são rejeitados logo de início.  |
| Runway   | Oferece suporte a arquivos locais via URIs de dados. Vídeo para vídeo exige `runway/gen4_aleph`. Execuções somente com texto expõem as proporções `16:9` e `9:16`. |
| Together | Apenas uma imagem de referência.                                                                                                               |
| Vydra    | Usa `https://www.vydra.ai/api/v1` diretamente para evitar redirecionamentos que descartam autenticação. `veo3` é empacotado apenas como texto para vídeo; `kling` exige uma URL remota de imagem. |
| xAI      | Oferece suporte a texto para vídeo, imagem para vídeo e fluxos remotos de edição/extensão de vídeo.                                          |

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
- [Alibaba Model Studio](/providers/alibaba)
- [BytePlus](/providers/byteplus)
- [ComfyUI](/providers/comfy)
- [fal](/providers/fal)
- [Google (Gemini)](/pt-BR/providers/google)
- [MiniMax](/pt-BR/providers/minimax)
- [OpenAI](/pt-BR/providers/openai)
- [Qwen](/pt-BR/providers/qwen)
- [Runway](/providers/runway)
- [Together AI](/pt-BR/providers/together)
- [Vydra](/providers/vydra)
- [xAI](/pt-BR/providers/xai)
- [Configuration Reference](/pt-BR/gateway/configuration-reference#agent-defaults)
- [Models](/pt-BR/concepts/models)
