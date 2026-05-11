---
read_when:
    - Gerando música ou áudio pelo agente
    - Configurando provedores e modelos de geração de música
    - Entendendo os parâmetros da ferramenta music_generate
sidebarTitle: Music generation
summary: Gere música por meio de music_generate em fluxos de trabalho do Google Lyria, MiniMax e ComfyUI
title: Geração de música
x-i18n:
    generated_at: "2026-05-11T20:37:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: b355dd6f1f41074624b692edb8a597a65ad99fc3ad61d2ed5e32f1b6cf393244
    source_path: tools/music-generation.md
    workflow: 16
---

A ferramenta `music_generate` permite que o agente crie música ou áudio por meio do
recurso compartilhado de geração de música com provedores configurados: Google,
MiniMax e ComfyUI configurado por workflow atualmente.

Para execuções de agente com sessão, o OpenClaw inicia a geração de música como uma
tarefa em segundo plano, acompanha-a no ledger de tarefas e então desperta o agente novamente
quando a faixa está pronta para que o agente possa avisar o usuário e anexar o
áudio finalizado. Em chats de grupo/canal que usam entrega visível somente por ferramenta
de mensagem, o agente retransmite o resultado pela ferramenta de mensagem. Se o
agente de conclusão escrever apenas uma resposta final privada, o OpenClaw recorre a um
envio direto pelo canal com a mídia gerada. O despertar de conclusão avisa explicitamente
o agente de que respostas finais normais são privadas nessas rotas.

<Note>
A ferramenta compartilhada integrada só aparece quando pelo menos um provedor de geração de música
está disponível. Se você não vir `music_generate` nas ferramentas do seu agente,
configure `agents.defaults.musicGenerationModel` ou configure uma
chave de API de provedor.
</Note>

## Início rápido

<Tabs>
  <Tab title="Com provedor compartilhado">
    <Steps>
      <Step title="Configurar autenticação">
        Defina uma chave de API para pelo menos um provedor — por exemplo
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
        _"Gere uma faixa synthpop animada sobre dirigir à noite por uma
        cidade de neon."_

        O agente chama `music_generate` automaticamente. Não é necessário
        permitir a ferramenta em uma lista.
      </Step>
    </Steps>

    Para contextos síncronos diretos sem uma execução de agente com sessão,
    a ferramenta integrada ainda recorre à geração inline e retorna
    o caminho final da mídia no resultado da ferramenta.

  </Tab>
  <Tab title="Workflow do ComfyUI">
    <Steps>
      <Step title="Configurar o workflow">
        Configure `plugins.entries.comfy.config.music` com um workflow
        JSON e nós de prompt/saída.
      </Step>
      <Step title="Autenticação em nuvem (opcional)">
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

## Provedores compatíveis

| Provedor | Modelo padrão        | Entradas de referência | Controles compatíveis                                     | Autenticação                          |
| -------- | -------------------- | ---------------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`           | Até 1 imagem           | Música ou áudio definidos pelo workflow                   | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | Até 10 imagens       | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`          | Nenhuma                | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` ou OAuth da MiniMax  |

### Matriz de recursos

O contrato de modo explícito usado por `music_generate`, testes de contrato e a
varredura live compartilhada:

| Provedor | `generate` | `edit` | Limite de edição | Lanes live compartilhadas                                                   |
| -------- | :--------: | :----: | ---------------- | --------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 imagem         | Não incluído na varredura compartilhada; coberto por `extensions/comfy/comfy.live.test.ts` |
| Google   |     ✓      |   ✓    | 10 imagens       | `generate`, `edit`                                                          |
| MiniMax  |     ✓      |   —    | Nenhum           | `generate`                                                                  |

Use `action: "list"` para inspecionar provedores e modelos compartilhados disponíveis em
runtime:

```text
/tool music_generate action=list
```

Use `action: "status"` para inspecionar a tarefa ativa de música com sessão:

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
  Sobrescrita de provedor/modelo (por exemplo, `google/lyria-3-pro-preview`,
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
  Duração alvo em segundos quando o provedor oferece suporte a dicas de duração.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Dica de formato de saída quando o provedor oferece suporte.
</ParamField>
<ParamField path="filename" type="string">Dica de nome do arquivo de saída.</ParamField>
<ParamField path="timeoutMs" type="number">Timeout opcional da solicitação ao provedor em milissegundos. Quando omitido, o OpenClaw usa `agents.defaults.musicGenerationModel.timeoutMs` se configurado. Valores abaixo de 10000ms são elevados para 10000ms e informados no resultado da ferramenta.</ParamField>

<Note>
Nem todos os provedores oferecem suporte a todos os parâmetros. O OpenClaw ainda valida limites
estritos, como contagens de entrada, antes do envio. Quando um provedor oferece suporte a
duração, mas usa um máximo menor que o valor solicitado, o OpenClaw
limita ao valor de duração compatível mais próximo. Dicas opcionais realmente sem suporte
são ignoradas com um aviso quando o provedor ou modelo selecionado não consegue atendê-las.
Os resultados da ferramenta informam as configurações aplicadas; `details.normalization`
captura qualquer mapeamento de solicitado para aplicado.
</Note>

## Comportamento assíncrono

A geração de música com sessão é executada como uma tarefa em segundo plano:

- **Tarefa em segundo plano:** `music_generate` cria uma tarefa em segundo plano, retorna uma
  resposta de iniciada/tarefa imediatamente e publica a faixa finalizada posteriormente em
  uma mensagem de acompanhamento do agente.
- **Prevenção de duplicatas:** enquanto uma tarefa está `queued` ou `running`, chamadas
  `music_generate` posteriores na mesma sessão retornam o status da tarefa em vez de
  iniciar outra geração. Use `action: "status"` para verificar explicitamente.
- **Consulta de status:** `openclaw tasks list` ou `openclaw tasks show <taskId>`
  inspeciona status em fila, em execução e terminal.
- **Despertar de conclusão:** o OpenClaw injeta um evento interno de conclusão de volta
  na mesma sessão para que o modelo possa escrever o acompanhamento voltado ao usuário
  por conta própria.
- **Dica de prompt:** turnos posteriores de usuário/manuais na mesma sessão recebem uma pequena
  dica de runtime quando uma tarefa de música já está em andamento, para que o modelo
  não chame `music_generate` novamente às cegas.
- **Fallback sem sessão:** contextos diretos/locais sem uma sessão real de agente
  são executados inline e retornam o resultado final de áudio no mesmo turno.

### Ciclo de vida da tarefa

| Estado      | Significado                                                                                   |
| ----------- | --------------------------------------------------------------------------------------------- |
| `queued`    | Tarefa criada, aguardando o provedor aceitá-la.                                                |
| `running`   | O provedor está processando (normalmente de 30 segundos a 3 minutos, dependendo do provedor e da duração). |
| `succeeded` | Faixa pronta; o agente desperta e a publica na conversa.                                       |
| `failed`    | Erro ou timeout do provedor; o agente desperta com detalhes do erro.                           |

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
        fallbacks: ["minimax/music-2.6"],
      },
    },
  },
}
```

### Ordem de seleção de provedores

O OpenClaw tenta os provedores nesta ordem:

1. Parâmetro `model` da chamada de ferramenta (se o agente especificar um).
2. `musicGenerationModel.primary` da configuração.
3. `musicGenerationModel.fallbacks` em ordem.
4. Detecção automática usando apenas padrões de provedores com autenticação:
   - provedor padrão atual primeiro;
   - demais provedores de geração de música registrados em ordem de provider-id.

Se um provedor falhar, o próximo candidato é tentado automaticamente. Se todos
falharem, o erro inclui detalhes de cada tentativa.

Defina `agents.defaults.mediaGenerationAutoProviderFallback: false` para usar apenas
entradas explícitas de `model`, `primary` e `fallbacks`.

## Observações de provedores

<AccordionGroup>
  <Accordion title="ComfyUI">
    Orientado por workflow e depende do grafo configurado mais o mapeamento de nós
    para campos de prompt/saída. O Plugin `comfy` incluído se conecta à
    ferramenta compartilhada `music_generate` por meio do registro de provedores
    de geração de música.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Usa geração em lote do Lyria 3. O fluxo incluído atual oferece suporte a
    prompt, texto de letra opcional e imagens de referência opcionais.
  </Accordion>
  <Accordion title="MiniMax">
    Usa o endpoint em lote `music_generation`. Oferece suporte a prompt, letras
    opcionais, modo instrumental, direcionamento de duração e saída mp3 por meio de
    autenticação por chave de API `minimax` ou OAuth `minimax-portal`.
  </Accordion>
</AccordionGroup>

## Escolhendo o caminho certo

- **Com provedor compartilhado** quando você quer seleção de modelo, failover de provedor
  e o fluxo assíncrono integrado de tarefa/status.
- **Caminho de Plugin (ComfyUI)** quando você precisa de um grafo de workflow personalizado ou de um
  provedor que não faz parte do recurso compartilhado incluído de música.

Se você estiver depurando comportamento específico do ComfyUI, consulte
[ComfyUI](/pt-BR/providers/comfy). Se você estiver depurando comportamento de provedor
compartilhado, comece por [Google (Gemini)](/pt-BR/providers/google) ou
[MiniMax](/pt-BR/providers/minimax).

## Modos de recurso do provedor

O contrato compartilhado de geração de música oferece suporte a declarações explícitas de modo:

- `generate` para geração apenas por prompt.
- `edit` quando a solicitação inclui uma ou mais imagens de referência.

Novas implementações de provedor devem preferir blocos de modo explícitos:

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

Campos flat legados como `maxInputImages`, `supportsLyrics` e
`supportsFormat` **não** são suficientes para anunciar suporte a edição. Provedores
devem declarar `generate` e `edit` explicitamente para que testes live, testes de contrato
e a ferramenta compartilhada `music_generate` possam validar o suporte a modos
deterministicamente.

## Testes live

Cobertura live opcional para os provedores compartilhados incluídos:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper do repositório:

```bash
pnpm test:live:media music
```

Este arquivo live carrega variáveis de ambiente de provedor ausentes de `~/.profile`, prefere
chaves de API live/env a perfis de autenticação armazenados por padrão e executa tanto
a cobertura de `generate` quanto a de `edit` declarada quando o provedor habilita o
modo de edição. Cobertura hoje:

- `google`: `generate` mais `edit`
- `minimax`: apenas `generate`
- `comfy`: cobertura live separada do Comfy, não a varredura compartilhada de provedores

Ative a cobertura live para o caminho de música ComfyUI incluído:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

O arquivo live do Comfy também cobre fluxos de trabalho de imagem e vídeo do comfy quando essas
seções estão configuradas.

## Relacionado

- [Tarefas em segundo plano](/pt-BR/automation/tasks) — acompanhamento de tarefas para execuções desanexadas de `music_generate`
- [ComfyUI](/pt-BR/providers/comfy)
- [Referência de configuração](/pt-BR/gateway/config-agents#agent-defaults) — configuração de `musicGenerationModel`
- [Google (Gemini)](/pt-BR/providers/google)
- [MiniMax](/pt-BR/providers/minimax)
- [Modelos](/pt-BR/concepts/models) — configuração de modelos e failover
- [Visão geral das ferramentas](/pt-BR/tools)
