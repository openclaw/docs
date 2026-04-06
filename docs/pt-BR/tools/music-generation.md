---
read_when:
    - Gerando música ou áudio via o agente
    - Configurando providers e modelos de geração de música
    - Entendendo os parâmetros da ferramenta music_generate
summary: Gere música com providers compartilhados, incluindo plugins baseados em workflow
title: Geração de música
x-i18n:
    generated_at: "2026-04-06T03:12:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: a03de8aa75cfb7248eb0c1d969fb2a6da06117967d097e6f6e95771d0f017ae1
    source_path: tools/music-generation.md
    workflow: 15
---

# Geração de música

A ferramenta `music_generate` permite que o agente crie música ou áudio por meio do
recurso compartilhado de geração de música com providers configurados, como Google,
MiniMax e ComfyUI configurado por workflow.

Para sessões de agente com providers compartilhados, o OpenClaw inicia a geração de música como uma
tarefa em segundo plano, acompanha isso no registro de tarefas e depois desperta o agente novamente quando
a faixa está pronta para que o agente possa publicar o áudio finalizado de volta no
canal original.

<Note>
A ferramenta compartilhada integrada só aparece quando pelo menos um provider de geração de música está disponível. Se você não vir `music_generate` nas ferramentas do seu agente, configure `agents.defaults.musicGenerationModel` ou defina uma chave de API do provider.
</Note>

## Início rápido

### Geração com providers compartilhados

1. Defina uma chave de API para pelo menos um provider, por exemplo `GEMINI_API_KEY` ou
   `MINIMAX_API_KEY`.
2. Opcionalmente, defina seu modelo preferido:

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

3. Peça ao agente: _"Gere uma faixa synthpop animada sobre uma viagem noturna
   por uma cidade neon."_

O agente chama `music_generate` automaticamente. Nenhuma allowlist de ferramenta é necessária.

Para contextos síncronos diretos sem uma execução de agente baseada em sessão, a ferramenta
integrada ainda usa fallback para geração inline e retorna o caminho final da mídia no
resultado da ferramenta.

Exemplos de prompts:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

### Geração Comfy orientada por workflow

O plugin empacotado `comfy` se conecta à ferramenta compartilhada `music_generate` por meio
do registro de providers de geração de música.

1. Configure `models.providers.comfy.music` com um JSON de workflow e
   nós de prompt/saída.
2. Se você usa o Comfy Cloud, defina `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY`.
3. Peça música ao agente ou chame a ferramenta diretamente.

Exemplo:

```text
/tool music_generate prompt="Warm ambient synth loop with soft tape texture"
```

## Suporte compartilhado de providers empacotados

| Provider | Modelo padrão         | Entradas de referência | Controles compatíveis                                       | Chave de API                           |
| -------- | --------------------- | ---------------------- | ------------------------------------------------------------ | -------------------------------------- |
| ComfyUI  | `workflow`            | Até 1 imagem           | Música ou áudio definidos pelo workflow                      | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | Até 10 imagens         | `lyrics`, `instrumental`, `format`                           | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.5+`          | Nenhuma                | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3`    | `MINIMAX_API_KEY`                      |

Use `action: "list"` para inspecionar providers e modelos compartilhados disponíveis em
runtime:

```text
/tool music_generate action=list
```

Use `action: "status"` para inspecionar a tarefa de música ativa baseada em sessão:

```text
/tool music_generate action=status
```

Exemplo de geração direta:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Parâmetros da ferramenta integrada

| Parâmetro        | Tipo     | Descrição                                                                                          |
| ---------------- | -------- | -------------------------------------------------------------------------------------------------- |
| `prompt`         | string   | Prompt de geração de música (obrigatório para `action: "generate"`)                                |
| `action`         | string   | `"generate"` (padrão), `"status"` para a tarefa da sessão atual, ou `"list"` para inspecionar providers |
| `model`          | string   | Sobrescrita de provider/modelo, ex. `google/lyria-3-pro-preview` ou `comfy/workflow`              |
| `lyrics`         | string   | Letra opcional quando o provider oferece suporte a entrada explícita de letra                      |
| `instrumental`   | boolean  | Solicita saída somente instrumental quando o provider oferece suporte                              |
| `image`          | string   | Caminho ou URL de uma única imagem de referência                                                   |
| `images`         | string[] | Várias imagens de referência (até 10)                                                              |
| `durationSeconds` | number  | Duração alvo em segundos quando o provider oferece suporte a dicas de duração                      |
| `format`         | string   | Dica de formato de saída (`mp3` ou `wav`) quando o provider oferece suporte                        |
| `filename`       | string   | Dica de nome do arquivo de saída                                                                   |

Nem todos os providers oferecem suporte a todos os parâmetros. O OpenClaw ainda valida limites rígidos,
como contagens de entrada, antes do envio, mas dicas opcionais não suportadas são
ignoradas com um aviso quando o provider ou modelo selecionado não consegue atendê-las.

## Comportamento assíncrono para o caminho com providers compartilhados

- Execuções de agente baseadas em sessão: `music_generate` cria uma tarefa em segundo plano, retorna imediatamente uma resposta de iniciado/tarefa e publica a faixa concluída depois em uma mensagem de acompanhamento do agente.
- Prevenção de duplicidade: enquanto essa tarefa em segundo plano ainda estiver `queued` ou `running`, chamadas posteriores de `music_generate` na mesma sessão retornam o status da tarefa em vez de iniciar outra geração.
- Consulta de status: use `action: "status"` para inspecionar a tarefa de música ativa baseada em sessão sem iniciar uma nova.
- Rastreamento de tarefa: use `openclaw tasks list` ou `openclaw tasks show <taskId>` para inspecionar status enfileirado, em execução e terminal da geração.
- Despertar na conclusão: o OpenClaw injeta um evento interno de conclusão de volta na mesma sessão para que o modelo possa escrever ele mesmo o acompanhamento voltado ao usuário.
- Dica de prompt: turnos posteriores do usuário/manuais na mesma sessão recebem uma pequena dica de runtime quando uma tarefa de música já está em andamento para que o modelo não chame `music_generate` novamente às cegas.
- Fallback sem sessão: contextos diretos/locais sem uma sessão real de agente ainda executam inline e retornam o resultado final do áudio no mesmo turno.

## Configuração

### Seleção de modelo

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["minimax/music-2.5+"],
      },
    },
  },
}
```

### Ordem de seleção de provider

Ao gerar música, o OpenClaw tenta providers nesta ordem:

1. Parâmetro `model` da chamada da ferramenta, se o agente especificar um
2. `musicGenerationModel.primary` da configuração
3. `musicGenerationModel.fallbacks` em ordem
4. Detecção automática usando apenas padrões de provider com auth:
   - provider padrão atual primeiro
   - providers restantes registrados de geração de música em ordem de provider-id

Se um provider falhar, o próximo candidato é tentado automaticamente. Se todos falharem, o
erro inclui detalhes de cada tentativa.

## Observações sobre providers

- O Google usa geração em lote do Lyria 3. O fluxo empacotado atual oferece suporte a
  prompt, texto opcional de letra e imagens de referência opcionais.
- O MiniMax usa o endpoint em lote `music_generation`. O fluxo empacotado atual
  oferece suporte a prompt, letra opcional, modo instrumental, ajuste de duração e
  saída em mp3.
- O suporte ao ComfyUI é orientado por workflow e depende do grafo configurado, além do
  mapeamento de nós para campos de prompt/saída.

## Escolhendo o caminho certo

- Use o caminho com providers compartilhados quando quiser seleção de modelo, failover de provider e o fluxo integrado assíncrono de tarefa/status.
- Use um caminho de plugin como o ComfyUI quando precisar de um grafo de workflow personalizado ou de um provider que não faça parte do recurso empacotado compartilhado de música.
- Se você estiver depurando um comportamento específico do ComfyUI, consulte [ComfyUI](/providers/comfy). Se estiver depurando comportamento de provider compartilhado, comece por [Google (Gemini)](/pt-BR/providers/google) ou [MiniMax](/pt-BR/providers/minimax).

## Testes ao vivo

Cobertura ao vivo opt-in para os providers compartilhados empacotados:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Cobertura ao vivo opt-in para o caminho de música empacotado do ComfyUI:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

O arquivo ao vivo do Comfy também cobre workflows de imagem e vídeo do comfy quando essas
seções estão configuradas.

## Relacionado

- [Tarefas em segundo plano](/pt-BR/automation/tasks) - rastreamento de tarefa para execuções destacadas de `music_generate`
- [Referência de configuração](/pt-BR/gateway/configuration-reference#agent-defaults) - configuração `musicGenerationModel`
- [ComfyUI](/providers/comfy)
- [Google (Gemini)](/pt-BR/providers/google)
- [MiniMax](/pt-BR/providers/minimax)
- [Modelos](/pt-BR/concepts/models) - configuração de modelo e failover
- [Visão geral das ferramentas](/pt-BR/tools)
