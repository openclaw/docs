---
read_when:
    - Geração de música ou áudio por meio do agente
    - Configuração de provedores e modelos de geração de música
    - Entendendo os parâmetros da ferramenta music_generate
sidebarTitle: Music generation
summary: Gere músicas por meio de music_generate em fluxos de trabalho do ComfyUI, fal, Google Lyria, MiniMax e OpenRouter
title: Geração de música
x-i18n:
    generated_at: "2026-07-12T00:26:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5a540f537141f0d97b264420aae9e986c1f0c3927b8988ebbaf3798b8afd5dd2
    source_path: tools/music-generation.md
    workflow: 16
---

A ferramenta `music_generate` cria música ou áudio por meio do recurso compartilhado
de geração de música, com suporte de ComfyUI, fal, Google, MiniMax e
OpenRouter.

<Note>
`music_generate` só aparece quando pelo menos um provedor de geração de música está
disponível: uma configuração explícita em `agents.defaults.musicGenerationModel` ou um
provedor configurado com autenticação (por exemplo, uma chave de API definida).
</Note>

Em execuções de agente com sessão, `music_generate` inicia como uma tarefa em segundo plano,
acompanha o progresso no registro de tarefas e então reativa o agente quando a faixa está
pronta, para que ele possa avisar o usuário e anexar o áudio concluído. O agente de conclusão
segue o contrato de resposta visível da sessão: resposta final automática quando configurada
ou `message(action="send")` quando a sessão exige a ferramenta de mensagens. Se a sessão
solicitante estiver inativa ou sua reativação falhar, e o áudio gerado ainda estiver ausente
da resposta, o OpenClaw envia um fallback direto e idempotente apenas com o áudio ausente.

## Início rápido

<Tabs>
  <Tab title="Compartilhado com suporte de provedor">
    <Steps>
      <Step title="Configurar a autenticação">
        Defina uma chave de API para pelo menos um provedor — por exemplo,
        `GEMINI_API_KEY` ou `MINIMAX_API_KEY`.
      </Step>
      <Step title="Escolher um modelo padrão (opcional)">
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
      <Step title="Pedir ao agente">
        _"Gere uma faixa synthpop animada sobre uma viagem noturna de carro por uma
        cidade de neon."_

        O agente chama `music_generate` automaticamente. Não é necessário
        incluí-la em uma lista de ferramentas permitidas.
      </Step>
    </Steps>

    Sem uma execução de agente com sessão (em contextos diretos/locais), a ferramenta
    é executada em linha e retorna o caminho final da mídia no mesmo resultado da ferramenta.

  </Tab>
  <Tab title="Fluxo de trabalho do ComfyUI">
    <Steps>
      <Step title="Configurar o fluxo de trabalho">
        Configure `plugins.entries.comfy.config.music` com um fluxo de trabalho
        em JSON e nós de prompt/saída.
      </Step>
      <Step title="Autenticação na nuvem (opcional)">
        Para o Comfy Cloud, defina `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY`.
      </Step>
      <Step title="Chamar a ferramenta">
        ```text
        /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

Exemplos de prompts:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

Use `action: "list"` para inspecionar os provedores/modelos disponíveis e
`action: "status"` para inspecionar a tarefa de música ativa com sessão:

```text
/tool music_generate action=list
/tool music_generate action=status
```

Exemplo de geração direta:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Provedores compatíveis

| Provedor   | Modelo padrão                | Entradas de referência | Controles compatíveis                                  | Autenticação                           |
| ---------- | ---------------------------- | ---------------------- | ------------------------------------------------------ | -------------------------------------- |
| ComfyUI    | `workflow`                   | Até 1 imagem           | Música ou áudio definido pelo fluxo de trabalho        | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| fal        | `fal-ai/minimax-music/v2.6`  | Nenhuma                | `lyrics`, `instrumental`, `durationSeconds`, `format`  | `FAL_KEY` ou `FAL_API_KEY`             |
| Google     | `lyria-3-clip-preview`       | Até 10 imagens         | `lyrics`, `instrumental`, `format`                     | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax    | `music-2.6`                  | Nenhuma                | `lyrics`, `instrumental`, `format` (somente mp3)       | `MINIMAX_API_KEY` ou OAuth do MiniMax  |
| OpenRouter | `google/lyria-3-pro-preview` | Até 1 imagem           | `lyrics`, `instrumental`, `durationSeconds`, `format`  | `OPENROUTER_API_KEY`                   |

O MiniMax registra dois IDs de provedor que compartilham os mesmos modelos: `minimax` para
autenticação por chave de API e `minimax-portal` para OAuth. As referências de modelo seguem
o caminho de autenticação (`minimax/music-2.6` em comparação com `minimax-portal/music-2.6`);
consulte [MiniMax](/pt-BR/providers/minimax#music-generation).

O fal também disponibiliza `fal-ai/ace-step/prompt-to-audio` (wav, sem letras, sem
alternância de modo instrumental) e `fal-ai/stable-audio-25/text-to-audio` (wav,
somente prompt), além de seu modelo padrão com suporte do MiniMax. O modelo padrão
`lyria-3-clip-preview` do Google gera somente mp3; `lyria-3-pro-preview` também oferece
suporte a wav. O MiniMax também disponibiliza `music-2.6-free`, `music-cover` e
`music-cover-free`. O OpenRouter também disponibiliza `google/lyria-3-clip-preview`.

### Matriz de recursos

O contrato explícito de modos usado por `music_generate`, pelos testes de contrato e pela
verificação compartilhada em ambiente real:

| Provedor   | `generate` | `edit` | Limite de edição | Trilhas compartilhadas em ambiente real                                      |
| ---------- | :--------: | :----: | ---------------- | ----------------------------------------------------------------------------- |
| ComfyUI    |     ✓      |   ✓    | 1 imagem         | Não incluído na verificação compartilhada; coberto por `extensions/comfy/comfy.live.test.ts` |
| fal        |     ✓      |   —    | Nenhum           | `generate`                                                                    |
| Google     |     ✓      |   ✓    | 10 imagens       | `generate`, `edit`                                                            |
| MiniMax    |     ✓      |   —    | Nenhum           | `generate`                                                                    |
| OpenRouter |     ✓      |   ✓    | 1 imagem         | `generate`, `edit`                                                            |

## Parâmetros da ferramenta

<ParamField path="prompt" type="string" required>
  Prompt para geração de música. Obrigatório para `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` retorna a tarefa atual da sessão; `"list"` inspeciona os provedores.
</ParamField>
<ParamField path="model" type="string">
  Substituição de provedor/modelo (por exemplo, `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Letras opcionais quando o provedor oferece suporte à entrada explícita de letras.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Solicita uma saída somente instrumental quando o provedor oferece suporte.
</ParamField>
<ParamField path="image" type="string">
  Caminho ou URL de uma única imagem de referência.
</ParamField>
<ParamField path="images" type="string[]">
  Várias imagens de referência (até 10 nos provedores compatíveis).
</ParamField>
<ParamField path="durationSeconds" type="number">
  Duração desejada em segundos quando o provedor oferece suporte a sugestões de duração.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Sugestão de formato de saída quando o provedor oferece suporte.
</ParamField>
<ParamField path="filename" type="string">Sugestão de nome do arquivo de saída.</ParamField>

<Note>
Nem todos os provedores oferecem suporte a todos os parâmetros. O OpenClaw ainda valida
limites rígidos, como a quantidade de entradas, antes do envio. Quando um provedor oferece
suporte à duração, mas usa um máximo menor que o valor solicitado, o OpenClaw ajusta para
a duração compatível mais próxima. Sugestões opcionais realmente incompatíveis são ignoradas
com um aviso quando o provedor ou modelo selecionado não consegue atendê-las. Os resultados
da ferramenta informam as configurações aplicadas; `details.normalization` registra qualquer
mapeamento entre o valor solicitado e o aplicado.
</Note>

Os tempos limite das solicitações aos provedores são apenas uma configuração do operador.
O OpenClaw usa `agents.defaults.musicGenerationModel.timeoutMs` quando configurado, eleva
valores abaixo de 120000ms para 120000ms e, caso contrário, usa por padrão 300000ms para
as solicitações aos provedores.

## Comportamento assíncrono

A geração de música com sessão é executada como uma tarefa em segundo plano:

- **Tarefa em segundo plano:** `music_generate` cria uma tarefa em segundo plano, retorna
  imediatamente uma resposta de início/tarefa e publica a faixa concluída depois, em uma
  mensagem de acompanhamento do agente.
- **Prevenção de duplicatas:** enquanto uma tarefa estiver `queued` ou `running`, chamadas
  posteriores de `music_generate` na mesma sessão retornam o status da tarefa em vez de
  iniciar outra geração. Use `action: "status"` para verificar explicitamente.
  Uma solicitação correspondente concluída recentemente também é deduplicada por 2 minutos.
- **Consulta de status:** `openclaw tasks list` ou `openclaw tasks show <taskId>`
  inspeciona os status na fila, em execução e terminais.
- **Reativação após a conclusão:** o OpenClaw injeta um evento interno de conclusão de volta
  na mesma sessão para que o próprio modelo possa escrever a mensagem de acompanhamento
  voltada ao usuário.
- **Dica no prompt:** interações posteriores do usuário/manuais na mesma sessão recebem uma
  pequena dica em tempo de execução quando uma tarefa de música já está em andamento, para
  que o modelo não chame `music_generate` novamente sem necessidade.
- **Fallback sem sessão:** contextos diretos/locais sem uma sessão real de agente são
  executados em linha e retornam o resultado final do áudio na mesma interação.

### Ciclo de vida da tarefa

A tarefa de música apresenta os mesmos estados do registro geral de tarefas (consulte
[Tarefas em segundo plano](/pt-BR/automation/tasks#task-lifecycle) para ver a máquina de estados
completa, incluindo `timed_out`, `cancelled` e `lost`). A maioria das execuções de música
passa por:

| Estado      | Significado                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------ |
| `queued`    | Tarefa criada, aguardando o provedor aceitá-la.                                                              |
| `running`   | O provedor está processando (normalmente de 30 segundos a 3 minutos, dependendo do provedor e da duração).   |
| `succeeded` | Faixa pronta; o agente é reativado e a publica na conversa.                                                  |
| `failed`    | Erro ou tempo limite do provedor; o agente é reativado com os detalhes do erro.                              |

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

### Ordem de seleção de provedores

O OpenClaw tenta os provedores nesta ordem:

1. Parâmetro `model` da chamada da ferramenta (se o agente especificar um).
2. `musicGenerationModel.primary` da configuração.
3. `musicGenerationModel.fallbacks` na ordem definida.
4. Detecção automática usando somente os padrões de provedores com autenticação:
   - primeiro, o provedor padrão atual do modelo de texto, se ele também oferecer
     geração de música;
   - depois, os demais provedores de geração de música registrados, em ordem alfabética
     por ID de provedor.

Se um provedor falhar, o próximo candidato será tentado automaticamente. Se todos
falharem, o erro incluirá os detalhes de cada tentativa.

Defina `agents.defaults.mediaGenerationAutoProviderFallback: false` para usar somente
as entradas explícitas de `model`, `primary` e `fallbacks`.

## Observações sobre os provedores

<AccordionGroup>
  <Accordion title="ComfyUI">
    Orientado por fluxos de trabalho e depende do grafo configurado, além do mapeamento de nós
    para os campos de prompt/saída. O plugin `comfy` incluído se integra à
    ferramenta compartilhada `music_generate` por meio do registro de provedores
    de geração de música.
  </Accordion>
  <Accordion title="fal">
    Usa os endpoints de modelos da fal pelo caminho compartilhado de autenticação do provedor. O
    provedor incluído usa `fal-ai/minimax-music/v2.6` por padrão e também disponibiliza
    `fal-ai/ace-step/prompt-to-audio` e
    `fal-ai/stable-audio-25/text-to-audio` para solicitações de conversão de prompt em áudio.
    Letras e o modo instrumental são exclusivos do modelo MiniMax; os outros dois
    modelos aceitam somente prompts.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Usa a geração em lote do Lyria 3. O fluxo incluído atual oferece suporte a
    prompt, texto de letras opcional e imagens de referência opcionais. O
    modelo padrão `lyria-3-clip-preview` gera somente mp3; o
    modelo `lyria-3-pro-preview` também oferece suporte a wav.
  </Accordion>
  <Accordion title="MiniMax">
    Usa o endpoint em lote `music_generation`. Oferece suporte a prompt, letras
    opcionais, modo instrumental e saída mp3 por meio da autenticação por chave de API
    `minimax` ou do OAuth `minimax-portal`. Também disponibiliza os modelos
    `music-2.6-free`, `music-cover` e `music-cover-free`.
  </Accordion>
  <Accordion title="OpenRouter">
    Usa a saída de áudio das conclusões de chat do OpenRouter com transmissão habilitada. O
    provedor incluído usa `google/lyria-3-pro-preview` por padrão e também disponibiliza
    `openrouter/google/lyria-3-clip-preview`.
  </Accordion>
</AccordionGroup>

## Como escolher o caminho certo

- **Baseado em provedor compartilhado** quando você quer seleção de modelo, failover de
  provedor e o fluxo assíncrono integrado de tarefa/status.
- **Caminho de Plugin (ComfyUI)** quando você precisa de um grafo de fluxo de trabalho personalizado ou de um
  provedor que não faça parte do recurso compartilhado e incluído de música.

Se estiver depurando um comportamento específico do ComfyUI, consulte
[ComfyUI](/pt-BR/providers/comfy). Se estiver depurando o comportamento do provedor
compartilhado, comece por [fal](/pt-BR/providers/fal), [Google (Gemini)](/pt-BR/providers/google),
[MiniMax](/pt-BR/providers/minimax) ou [OpenRouter](/pt-BR/providers/openrouter).

## Modos de recurso do provedor

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

Campos simples legados, como `maxInputImages`, `supportsLyrics` e
`supportsFormat`, **não** são suficientes para indicar suporte à edição. Os provedores
devem declarar `generate` e `edit` explicitamente para que testes em ambiente real, testes de
contrato e a ferramenta compartilhada `music_generate` possam validar o suporte aos modos
de forma determinística.

## Testes em ambiente real

Cobertura opcional em ambiente real para os provedores compartilhados incluídos (fal, Google, MiniMax,
OpenRouter):

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper equivalente do repositório, que executa o mesmo arquivo de teste:

```bash
pnpm test:live:media:music
```

Por padrão, este arquivo de testes em ambiente real usa variáveis de ambiente de provedores já exportadas
antes dos perfis de autenticação armazenados e executa a cobertura de `generate` e de `edit`
declarada quando o provedor habilita o modo de edição. Cobertura atual:

- `google`: `generate` e `edit`
- `fal`: somente `generate`
- `minimax`: somente `generate`
- `openrouter`: `generate` e `edit`
- `comfy`: cobertura separada do Comfy em ambiente real, fora da bateria compartilhada de provedores

Cobertura opcional em ambiente real para o caminho de música incluído do ComfyUI:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

O arquivo de testes do Comfy em ambiente real também abrange fluxos de trabalho de imagem e vídeo do Comfy quando essas
seções estão configuradas.

## Relacionados

- [Tarefas em segundo plano](/pt-BR/automation/tasks) — acompanhamento de tarefas para execuções desacopladas de `music_generate`
- [ComfyUI](/pt-BR/providers/comfy)
- [Referência de configuração](/pt-BR/gateway/config-agents#agent-defaults) — configuração `musicGenerationModel`
- [Google (Gemini)](/pt-BR/providers/google)
- [MiniMax](/pt-BR/providers/minimax)
- [Modelos](/pt-BR/concepts/models) — configuração e failover de modelos
- [Visão geral das ferramentas](/pt-BR/tools)
