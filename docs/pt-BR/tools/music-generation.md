---
read_when:
    - Gerando música ou áudio via o agente
    - Configurando provedores e modelos de geração de música
    - Entendendo os parâmetros da ferramenta `music_generate`
sidebarTitle: Music generation
summary: Gerar música via music_generate nos fluxos do Google Lyria, MiniMax e ComfyUI
title: Geração de música
x-i18n:
    generated_at: "2026-04-26T11:39:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4eda549dbb93cbfe15e04462e08b7c86ff0718160244e3e5de3b041c62ee81ea
    source_path: tools/music-generation.md
    workflow: 15
---

A ferramenta `music_generate` permite que o agente crie música ou áudio por meio da
capacidade compartilhada de geração de música com provedores configurados — Google,
MiniMax e ComfyUI configurado por workflow atualmente.

Para execuções de agente com suporte de sessão, o OpenClaw inicia a geração de música como uma
tarefa em segundo plano, a rastreia no ledger de tarefas e então desperta o agente novamente
quando a faixa fica pronta para que o agente possa publicar o áudio finalizado de volta
no canal original.

<Note>
A ferramenta compartilhada integrada só aparece quando pelo menos um provedor de
geração de música está disponível. Se você não vir `music_generate` nas
ferramentas do seu agente, configure `agents.defaults.musicGenerationModel` ou defina uma
chave de API de provedor.
</Note>

## Início rápido

<Tabs>
  <Tab title="Compartilhado com suporte de provedor">
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
        _"Gere uma faixa synthpop animada sobre um passeio noturno por uma
        cidade neon."_

        O agente chama `music_generate` automaticamente. Não é
        necessário allow-list de ferramentas.
      </Step>
    </Steps>

    Para contextos síncronos diretos sem uma execução de agente com suporte de sessão,
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
        /tool music_generate prompt="Loop de synth ambiente acolhedor com textura suave de fita"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

Exemplos de prompts:

```text
Gere uma faixa cinematográfica de piano com cordas suaves e sem vocais.
```

```text
Gere um loop chiptune energético sobre o lançamento de um foguete ao nascer do sol.
```

## Provedores compatíveis

| Provedor | Modelo padrão         | Entradas de referência | Controles compatíveis                                      | Autenticação                           |
| -------- | --------------------- | ---------------------- | ---------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`            | Até 1 imagem           | Música ou áudio definidos pelo workflow                    | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | Até 10 imagens         | `lyrics`, `instrumental`, `format`                         | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`           | Nenhuma                | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3`  | `MINIMAX_API_KEY` ou OAuth do MiniMax  |

### Matriz de capacidades

O contrato explícito de modo usado por `music_generate`, testes de contrato e a
varredura compartilhada ao vivo:

| Provedor | `generate` | `edit` | Limite de edição | Lanes compartilhados ao vivo                                               |
| -------- | :--------: | :----: | ---------------- | -------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 imagem         | Não está na varredura compartilhada; coberto por `extensions/comfy/comfy.live.test.ts` |
| Google   |     ✓      |   ✓    | 10 imagens       | `generate`, `edit`                                                         |
| MiniMax  |     ✓      |   —    | Nenhum           | `generate`                                                                 |

Use `action: "list"` para inspecionar em runtime os provedores e modelos compartilhados disponíveis:

```text
/tool music_generate action=list
```

Use `action: "status"` para inspecionar a tarefa ativa de música com suporte de sessão:

```text
/tool music_generate action=status
```

Exemplo de geração direta:

```text
/tool music_generate prompt="Lo-fi hip hop onírico com textura de vinil e chuva suave" instrumental=true
```

## Parâmetros da ferramenta

<ParamField path="prompt" type="string" required>
  Prompt de geração de música. Obrigatório para `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` retorna a tarefa atual da sessão; `"list"` inspeciona provedores.
</ParamField>
<ParamField path="model" type="string">
  Substituição de provedor/modelo (por exemplo `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Letras opcionais quando o provedor oferece suporte a entrada explícita de letras.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Solicita saída somente instrumental quando o provedor oferece suporte.
</ParamField>
<ParamField path="image" type="string">
  Caminho ou URL de uma única imagem de referência.
</ParamField>
<ParamField path="images" type="string[]">
  Múltiplas imagens de referência (até 10 em provedores compatíveis).
</ParamField>
<ParamField path="durationSeconds" type="number">
  Duração desejada em segundos quando o provedor oferece suporte a dicas de duração.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Dica de formato de saída quando o provedor oferece suporte.
</ParamField>
<ParamField path="filename" type="string">Dica de nome de arquivo de saída.</ParamField>
<ParamField path="timeoutMs" type="number">Timeout opcional da solicitação ao provedor em milissegundos.</ParamField>

<Note>
Nem todos os provedores oferecem suporte a todos os parâmetros. O OpenClaw ainda valida
limites rígidos, como contagem de entradas, antes do envio. Quando um provedor oferece suporte a
duração, mas usa um máximo menor que o valor solicitado, o OpenClaw
ajusta para a duração compatível mais próxima. Dicas opcionais realmente não compatíveis
são ignoradas com um aviso quando o provedor ou modelo selecionado não consegue respeitá-las.
Os resultados da ferramenta informam as configurações aplicadas; `details.normalization`
captura qualquer mapeamento de solicitado para aplicado.
</Note>

## Comportamento assíncrono

A geração de música com suporte de sessão é executada como uma tarefa em segundo plano:

- **Tarefa em segundo plano:** `music_generate` cria uma tarefa em segundo plano, retorna
  imediatamente uma resposta de iniciada/tarefa e publica a faixa finalizada depois em
  uma mensagem de follow-up do agente.
- **Prevenção de duplicatas:** enquanto uma tarefa estiver `queued` ou `running`, chamadas posteriores de
  `music_generate` na mesma sessão retornam o status da tarefa em vez de
  iniciar outra geração. Use `action: "status"` para verificar explicitamente.
- **Consulta de status:** `openclaw tasks list` ou `openclaw tasks show <taskId>`
  inspeciona status enfileirado, em execução e terminal.
- **Despertar na conclusão:** o OpenClaw injeta um evento interno de conclusão de volta
  na mesma sessão para que o modelo possa escrever por conta própria o follow-up voltado ao usuário.
- **Dica no prompt:** turnos posteriores de usuário/manuais na mesma sessão recebem uma pequena
  dica de runtime quando uma tarefa de música já está em andamento, para que o modelo não
  chame `music_generate` novamente às cegas.
- **Fallback sem sessão:** contextos diretos/locais sem uma sessão real de agente
  executam inline e retornam o resultado final do áudio no mesmo turno.

### Ciclo de vida da tarefa

| Estado      | Significado                                                                                   |
| ----------- | --------------------------------------------------------------------------------------------- |
| `queued`    | Tarefa criada, aguardando o provedor aceitá-la.                                               |
| `running`   | O provedor está processando (normalmente de 30 segundos a 3 minutos, dependendo do provedor e da duração). |
| `succeeded` | Faixa pronta; o agente desperta e a publica na conversa.                                      |
| `failed`    | Erro do provedor ou timeout; o agente desperta com detalhes do erro.                          |

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

### Ordem de seleção de provedor

O OpenClaw tenta os provedores nesta ordem:

1. Parâmetro `model` da chamada da ferramenta (se o agente especificar um).
2. `musicGenerationModel.primary` da configuração.
3. `musicGenerationModel.fallbacks` em ordem.
4. Detecção automática usando apenas padrões de provedor com autenticação configurada:
   - provedor padrão atual primeiro;
   - demais provedores de geração de música registrados em ordem de id do provedor.

Se um provedor falhar, o próximo candidato será tentado automaticamente. Se todos
falharem, o erro incluirá detalhes de cada tentativa.

Defina `agents.defaults.mediaGenerationAutoProviderFallback: false` para usar apenas
entradas explícitas de `model`, `primary` e `fallbacks`.

## Observações sobre provedores

<AccordionGroup>
  <Accordion title="ComfyUI">
    Baseado em workflow e depende do grafo configurado mais o mapeamento de nós
    para campos de prompt/saída. O Plugin `comfy` empacotado se conecta à
    ferramenta compartilhada `music_generate` por meio do registro de provedores
    de geração de música.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Usa geração em lote do Lyria 3. O fluxo empacotado atual oferece suporte a
    prompt, texto opcional de letras e imagens de referência opcionais.
  </Accordion>
  <Accordion title="MiniMax">
    Usa o endpoint em lote `music_generation`. Oferece suporte a prompt, letras opcionais,
    modo instrumental, controle de duração e saída em mp3 por meio de
    autenticação por chave de API `minimax` ou OAuth `minimax-portal`.
  </Accordion>
</AccordionGroup>

## Escolhendo o caminho certo

- **Compartilhado com suporte de provedor** quando você quiser seleção de modelo, failover de provedor e o fluxo integrado assíncrono de tarefa/status.
- **Caminho de Plugin (ComfyUI)** quando você precisar de um grafo de workflow personalizado ou de um
  provedor que não faça parte da capacidade compartilhada empacotada de música.

Se você estiver depurando comportamento específico do ComfyUI, consulte
[ComfyUI](/pt-BR/providers/comfy). Se estiver depurando comportamento de provedor
compartilhado, comece por [Google (Gemini)](/pt-BR/providers/google) ou
[MiniMax](/pt-BR/providers/minimax).

## Modos de capacidade do provedor

O contrato compartilhado de geração de música oferece suporte a declarações explícitas de modo:

- `generate` para geração somente com prompt.
- `edit` quando a solicitação inclui uma ou mais imagens de referência.

Novas implementações de provedor devem preferir blocos explícitos de modo:

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
`supportsFormat` **não** são suficientes para anunciar suporte a edição. Os provedores
devem declarar `generate` e `edit` explicitamente para que testes ao vivo, testes de contrato
e a ferramenta compartilhada `music_generate` possam validar o suporte a modo
de forma determinística.

## Testes ao vivo

Cobertura ao vivo opt-in para os provedores compartilhados empacotados:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper do repositório:

```bash
pnpm test:live:media music
```

Esse arquivo ao vivo carrega variáveis de ambiente ausentes de provedores a partir de `~/.profile`, prioriza
chaves de API de env/ao vivo em vez de perfis de autenticação armazenados por padrão e executa
cobertura de `generate` e `edit` declarada quando o provedor habilita o modo de edição.
Cobertura atual:

- `google`: `generate` mais `edit`
- `minimax`: somente `generate`
- `comfy`: cobertura ao vivo separada do Comfy, não a varredura compartilhada de provedores

Cobertura ao vivo opt-in para o caminho de música ComfyUI empacotado:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

O arquivo ao vivo do Comfy também cobre workflows de imagem e vídeo do comfy quando essas
seções estão configuradas.

## Relacionado

- [Tarefas em segundo plano](/pt-BR/automation/tasks) — rastreamento de tarefas para execuções destacadas de `music_generate`
- [ComfyUI](/pt-BR/providers/comfy)
- [Referência de configuração](/pt-BR/gateway/config-agents#agent-defaults) — configuração `musicGenerationModel`
- [Google (Gemini)](/pt-BR/providers/google)
- [MiniMax](/pt-BR/providers/minimax)
- [Modelos](/pt-BR/concepts/models) — configuração de modelos e failover
- [Visão geral das ferramentas](/pt-BR/tools)
