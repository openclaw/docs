---
read_when:
    - Gerando música ou áudio por meio do agente
    - Configurando provedores e modelos de geração de música
    - Entendendo os parâmetros da ferramenta music_generate
sidebarTitle: Music generation
summary: Gere música via music_generate em fluxos de trabalho do ComfyUI, fal, Google Lyria, MiniMax e OpenRouter
title: Geração de música
x-i18n:
    generated_at: "2026-06-27T18:16:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4fe6ad09b6e2cfae03bc5d5ef4368e80845a9e4a8c25c6303e181a6436a17c7e
    source_path: tools/music-generation.md
    workflow: 16
---

A ferramenta `music_generate` permite que o agente crie música ou áudio por meio da
capacidade compartilhada de geração de música com provedores configurados — ComfyUI,
fal, Google, MiniMax e OpenRouter atualmente.

Para execuções de agente com sessão, o OpenClaw inicia a geração de música como uma
tarefa em segundo plano, a rastreia no livro-razão de tarefas e então desperta o agente novamente
quando a faixa está pronta para que o agente possa avisar o usuário e anexar o
áudio finalizado. O agente de conclusão segue o modo normal de resposta visível
da sessão: entrega automática da resposta final quando configurada, ou `message(action="send")`
quando a sessão exige a ferramenta de mensagem. Se a sessão solicitante estiver
inativa ou sua ativação falhar, e ainda faltar algum áudio gerado
na resposta de conclusão, o OpenClaw envia um fallback direto idempotente com
apenas o áudio ausente.

<Note>
A ferramenta compartilhada integrada só aparece quando pelo menos um provedor de geração de música
está disponível. Se você não vir `music_generate` nas ferramentas do seu agente,
configure `agents.defaults.musicGenerationModel` ou configure uma
chave de API de provedor.
</Note>

## Início rápido

<Tabs>
  <Tab title="Shared provider-backed">
    <Steps>
      <Step title="Configure auth">
        Defina uma chave de API para pelo menos um provedor — por exemplo
        `GEMINI_API_KEY` ou `MINIMAX_API_KEY`.
      </Step>
      <Step title="Pick a default model (optional)">
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
      </Step>
      <Step title="Ask the agent">
        _"Generate an upbeat synthpop track about a night drive through a
        neon city."_

        O agente chama `music_generate` automaticamente. Não é necessário
        colocar a ferramenta em uma lista de permissões.
      </Step>
    </Steps>

    Para contextos síncronos diretos sem uma execução de agente com sessão,
    a ferramenta integrada ainda faz fallback para geração inline e retorna
    o caminho final da mídia no resultado da ferramenta.

  </Tab>
  <Tab title="ComfyUI workflow">
    <Steps>
      <Step title="Configure the workflow">
        Configure `plugins.entries.comfy.config.music` com um workflow
        JSON e nós de prompt/saída.
      </Step>
      <Step title="Cloud auth (optional)">
        Para Comfy Cloud, defina `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY`.
      </Step>
      <Step title="Call the tool">
        ```text
        /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

Prompts de exemplo:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

## Provedores compatíveis

| Provedor   | Modelo padrão                | Entradas de referência | Controles compatíveis                                | Autenticação                          |
| ---------- | ---------------------------- | ---------------------- | ---------------------------------------------------- | ------------------------------------- |
| ComfyUI    | `workflow`                   | Até 1 imagem           | Música ou áudio definido pelo workflow               | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| fal        | `fal-ai/minimax-music/v2.6`  | Nenhuma                | `lyrics`, `instrumental`, `durationSeconds`, `format` | `FAL_KEY` ou `FAL_API_KEY`            |
| Google     | `lyria-3-clip-preview`       | Até 10 imagens         | `lyrics`, `instrumental`, `format`                   | `GEMINI_API_KEY`, `GOOGLE_API_KEY`    |
| MiniMax    | `music-2.6`                  | Nenhuma                | `lyrics`, `instrumental`, `format=mp3`               | `MINIMAX_API_KEY` ou OAuth da MiniMax |
| OpenRouter | `google/lyria-3-pro-preview` | Até 1 imagem           | `lyrics`, `instrumental`, `durationSeconds`, `format` | `OPENROUTER_API_KEY`                  |

### Matriz de capacidades

O contrato de modo explícito usado por `music_generate`, testes de contrato e a
varredura live compartilhada:

| Provedor   | `generate` | `edit` | Limite de edição | Raias live compartilhadas                                                    |
| ---------- | :--------: | :----: | ---------------- | ---------------------------------------------------------------------------- |
| ComfyUI    |     ✓      |   ✓    | 1 imagem         | Não está na varredura compartilhada; coberto por `extensions/comfy/comfy.live.test.ts` |
| fal        |     ✓      |   —    | Nenhum           | `generate`                                                                   |
| Google     |     ✓      |   ✓    | 10 imagens       | `generate`, `edit`                                                           |
| MiniMax    |     ✓      |   —    | Nenhum           | `generate`                                                                   |
| OpenRouter |     ✓      |   ✓    | 1 imagem         | `generate`, `edit`                                                           |

Use `action: "list"` para inspecionar provedores e modelos compartilhados disponíveis em
tempo de execução:

```text
/tool music_generate action=list
```

Use `action: "status"` para inspecionar a tarefa de música ativa com sessão:

```text
/tool music_generate action=status
```

Exemplo de geração direta:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Parâmetros da ferramenta

<ParamField path="prompt" type="string" required>
  Prompt de geração de música. Obrigatório para `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` retorna a tarefa atual da sessão; `"list"` inspeciona provedores.
</ParamField>
<ParamField path="model" type="string">
  Substituição de provedor/modelo (por exemplo, `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Letra opcional quando o provedor oferece suporte a entrada explícita de letra.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Solicita saída apenas instrumental quando o provedor oferece suporte.
</ParamField>
<ParamField path="image" type="string">
  Caminho ou URL de uma única imagem de referência.
</ParamField>
<ParamField path="images" type="string[]">
  Várias imagens de referência (até 10 em provedores compatíveis).
</ParamField>
<ParamField path="durationSeconds" type="number">
  Duração-alvo em segundos quando o provedor oferece suporte a dicas de duração.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Dica de formato de saída quando o provedor oferece suporte.
</ParamField>
<ParamField path="filename" type="string">Dica de nome de arquivo de saída.</ParamField>

<Note>
Nem todos os provedores oferecem suporte a todos os parâmetros. O OpenClaw ainda valida limites
rígidos, como contagens de entrada, antes do envio. Quando um provedor oferece suporte a
duração, mas usa um máximo menor que o valor solicitado, o OpenClaw
limita ao valor de duração compatível mais próximo. Dicas opcionais realmente incompatíveis
são ignoradas com um aviso quando o provedor ou modelo selecionado não consegue honrá-las.
Os resultados da ferramenta informam as configurações aplicadas; `details.normalization`
captura qualquer mapeamento de solicitado para aplicado.
</Note>

Tempos limite de solicitação de provedor são apenas configuração do operador. O OpenClaw usa
`agents.defaults.musicGenerationModel.timeoutMs` quando configurado, eleva valores
abaixo de 120000ms para 120000ms e, caso contrário, usa como padrão 300000ms
para solicitações de provedor.

## Comportamento assíncrono

A geração de música com sessão é executada como uma tarefa em segundo plano:

- **Tarefa em segundo plano:** `music_generate` cria uma tarefa em segundo plano, retorna uma
  resposta iniciada/de tarefa imediatamente e publica a faixa finalizada depois em
  uma mensagem de acompanhamento do agente.
- **Prevenção de duplicatas:** enquanto uma tarefa estiver `queued` ou `running`, chamadas
  posteriores de `music_generate` na mesma sessão retornam o status da tarefa em vez de
  iniciar outra geração. Use `action: "status"` para verificar explicitamente.
- **Consulta de status:** `openclaw tasks list` ou `openclaw tasks show <taskId>`
  inspeciona status em fila, em execução e terminal.
- **Ativação de conclusão:** o OpenClaw injeta um evento interno de conclusão de volta
  na mesma sessão para que o modelo possa escrever o acompanhamento voltado ao usuário
  por conta própria.
- **Dica de prompt:** turnos posteriores de usuário/manuais na mesma sessão recebem uma pequena
  dica de runtime quando uma tarefa de música já está em andamento, para que o modelo
  não chame `music_generate` novamente às cegas.
- **Fallback sem sessão:** contextos diretos/locais sem uma sessão real de agente
  são executados inline e retornam o resultado final de áudio no mesmo turno.

### Ciclo de vida da tarefa

| Estado      | Significado                                                                                  |
| ----------- | -------------------------------------------------------------------------------------------- |
| `queued`    | Tarefa criada, aguardando o provedor aceitá-la.                                               |
| `running`   | O provedor está processando (normalmente de 30 segundos a 3 minutos, dependendo do provedor e da duração). |
| `succeeded` | Faixa pronta; o agente desperta e a publica na conversa.                                      |
| `failed`    | Erro ou tempo limite do provedor; o agente desperta com detalhes do erro.                     |

Verifique o status pela CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

## Configuração

### Seleção de modelo

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["fal/fal-ai/minimax-music/v2.6", "minimax/music-2.6"],
      },
    },
  },
}
```

### Ordem de seleção de provedor

O OpenClaw tenta provedores nesta ordem:

1. Parâmetro `model` da chamada da ferramenta (se o agente especificar um).
2. `musicGenerationModel.primary` da configuração.
3. `musicGenerationModel.fallbacks` em ordem.
4. Detecção automática usando apenas padrões de provedor com autenticação:
   - provedor padrão atual primeiro;
   - provedores restantes de geração de música registrados em ordem de ID de provedor.

Se um provedor falhar, o próximo candidato é tentado automaticamente. Se todos
falharem, o erro inclui detalhes de cada tentativa.

Defina `agents.defaults.mediaGenerationAutoProviderFallback: false` para usar apenas
entradas explícitas de `model`, `primary` e `fallbacks`.

## Observações sobre provedores

<AccordionGroup>
  <Accordion title="ComfyUI">
    Orientado por workflow e depende do grafo configurado mais o mapeamento de nós
    para campos de prompt/saída. O plugin `comfy` integrado se conecta à
    ferramenta compartilhada `music_generate` por meio do registro de provedores
    de geração de música.
  </Accordion>
  <Accordion title="fal">
    Usa endpoints de modelo da fal pelo caminho compartilhado de autenticação de provedor. O
    provedor integrado usa como padrão `fal-ai/minimax-music/v2.6` e também expõe
    `fal-ai/ace-step/prompt-to-audio` e
    `fal-ai/stable-audio-25/text-to-audio` para solicitações de prompt para áudio.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Usa geração em lote do Lyria 3. O fluxo integrado atual oferece suporte a
    prompt, texto de letra opcional e imagens de referência opcionais.
  </Accordion>
  <Accordion title="MiniMax">
    Usa o endpoint em lote `music_generation`. Oferece suporte a prompt, letra opcional,
    modo instrumental e saída mp3 por meio de autenticação com chave de API `minimax`
    ou OAuth `minimax-portal`.
  </Accordion>
  <Accordion title="OpenRouter">
    Usa saída de áudio de conclusões de chat do OpenRouter com streaming habilitado. O
    provedor integrado usa como padrão `google/lyria-3-pro-preview` e também expõe
    `openrouter/google/lyria-3-clip-preview`.
  </Accordion>
</AccordionGroup>

## Escolhendo o caminho certo

- **Com provedor compartilhado** quando você quer seleção de modelo, failover de provedor
  e o fluxo assíncrono integrado de tarefa/status.
- **Caminho de Plugin (ComfyUI)** quando você precisa de um grafo de workflow personalizado ou de um
  provedor que não faz parte da capacidade compartilhada integrada de música.

Se você estiver depurando um comportamento específico do ComfyUI, consulte
[ComfyUI](/pt-BR/providers/comfy). Se você estiver depurando um comportamento compartilhado de
provedor, comece com [fal](/pt-BR/providers/fal), [Google (Gemini)](/pt-BR/providers/google),
[MiniMax](/pt-BR/providers/minimax) ou [OpenRouter](/pt-BR/providers/openrouter).

## Modos de capacidade do provedor

O contrato compartilhado de geração de música oferece suporte a declarações explícitas de modo:

- `generate` para geração somente por prompt.
- `edit` quando a solicitação inclui uma ou mais imagens de referência.

Novas implementações de provedores devem preferir blocos de modo explícitos:

```typescript
capabilities: {
  generate: {
    maxTracks: 1,
    supportsLyrics: true,
    supportsFormat: true,
  },
  edit: {
    enabled: true,
    maxTracks: 1,
    maxInputImages: 1,
    supportsFormat: true,
  },
}
```

Campos planos legados como `maxInputImages`, `supportsLyrics` e
`supportsFormat` **não** são suficientes para anunciar suporte a edição. Provedores
devem declarar `generate` e `edit` explicitamente para que testes live, testes de
contrato e a ferramenta compartilhada `music_generate` possam validar o suporte
a modos de forma determinística.

## Testes live

Cobertura live opcional para os provedores compartilhados incluídos:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper do repo:

```bash
pnpm test:live:media music
```

Esse arquivo live usa, por padrão, as variáveis de ambiente de provedor já exportadas
antes dos perfis de autenticação armazenados, e executa a cobertura de `generate` e
de `edit` declarado quando o provedor habilita o modo de edição. Cobertura atual:

- `google`: `generate` mais `edit`
- `fal`: somente `generate`
- `minimax`: somente `generate`
- `openrouter`: `generate` mais `edit`
- `comfy`: cobertura live separada do Comfy, não a varredura compartilhada de provedores

Cobertura live opcional para o caminho de música ComfyUI incluído:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

O arquivo live do Comfy também cobre fluxos de trabalho de imagem e vídeo do comfy quando essas
seções estão configuradas.

## Relacionados

- [Tarefas em segundo plano](/pt-BR/automation/tasks) — rastreamento de tarefas para execuções destacadas de `music_generate`
- [ComfyUI](/pt-BR/providers/comfy)
- [Referência de configuração](/pt-BR/gateway/config-agents#agent-defaults) — configuração `musicGenerationModel`
- [Google (Gemini)](/pt-BR/providers/google)
- [MiniMax](/pt-BR/providers/minimax)
- [Modelos](/pt-BR/concepts/models) — configuração de modelo e failover
- [Visão geral das ferramentas](/pt-BR/tools)
