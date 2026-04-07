---
read_when:
    - Ao gerar música ou áudio por meio do agente
    - Ao configurar provedores e modelos de geração de música
    - Ao entender os parâmetros da ferramenta music_generate
summary: Gere música com provedores compartilhados, incluindo plugins baseados em workflow
title: Geração de música
x-i18n:
    generated_at: "2026-04-07T05:32:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce8da8dfc188efe8593ca5cbec0927dd1d18d2861a1a828df89c8541ccf1cb25
    source_path: tools/music-generation.md
    workflow: 15
---

# Geração de música

A ferramenta `music_generate` permite que o agente crie música ou áudio por meio da
capacidade compartilhada de geração de música com provedores configurados como Google,
MiniMax e ComfyUI configurado por workflow.

Para sessões de agente com provedores compartilhados, o OpenClaw inicia a geração de música como uma
tarefa em segundo plano, acompanha isso no registro de tarefas e depois desperta o agente novamente quando
a faixa fica pronta para que ele possa publicar o áudio finalizado de volta no
canal original.

<Note>
A ferramenta compartilhada embutida só aparece quando pelo menos um provedor de geração de música está disponível. Se você não vir `music_generate` nas ferramentas do seu agente, configure `agents.defaults.musicGenerationModel` ou defina uma chave de API de provedor.
</Note>

## Início rápido

### Geração compartilhada com provedores

1. Defina uma chave de API para pelo menos um provedor, por exemplo `GEMINI_API_KEY` ou
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

3. Peça ao agente: _"Generate an upbeat synthpop track about a night drive
   through a neon city."_

O agente chama `music_generate` automaticamente. Não é necessário permitir a ferramenta em lista.

Para contextos síncronos diretos sem uma execução de agente com sessão associada, a
ferramenta embutida ainda recorre à geração inline e retorna o caminho final da mídia no
resultado da ferramenta.

Exemplos de prompts:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

### Geração com Comfy orientada por workflow

O plugin empacotado `comfy` se integra à ferramenta compartilhada `music_generate` por meio do
registro de provedores de geração de música.

1. Configure `models.providers.comfy.music` com um JSON de workflow e
   nós de prompt/saída.
2. Se você usa Comfy Cloud, defina `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY`.
3. Peça música ao agente ou chame a ferramenta diretamente.

Exemplo:

```text
/tool music_generate prompt="Warm ambient synth loop with soft tape texture"
```

## Suporte compartilhado a provedores empacotados

| Provider | Default model          | Reference inputs | Supported controls                                        | API key                                |
| -------- | ---------------------- | ---------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | Até 1 imagem     | Música ou áudio definidos pelo workflow                   | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | Até 10 imagens   | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.5+`           | Nenhum           | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY`                      |

### Matriz de capacidades declaradas

Este é o contrato explícito de modo usado por `music_generate`, testes de contrato
e a varredura live compartilhada.

| Provider | `generate` | `edit` | Limite de edição | Lanes live compartilhadas                                                  |
| -------- | ---------- | ------ | ---------------- | -------------------------------------------------------------------------- |
| ComfyUI  | Sim        | Sim    | 1 imagem         | Não está na varredura compartilhada; coberto por `extensions/comfy/comfy.live.test.ts` |
| Google   | Sim        | Sim    | 10 imagens       | `generate`, `edit`                                                         |
| MiniMax  | Sim        | Não    | Nenhum           | `generate`                                                                 |

Use `action: "list"` para inspecionar provedores e modelos compartilhados disponíveis em
runtime:

```text
/tool music_generate action=list
```

Use `action: "status"` para inspecionar a tarefa de música ativa associada à sessão:

```text
/tool music_generate action=status
```

Exemplo de geração direta:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Parâmetros da ferramenta embutida

| Parameter         | Type     | Description                                                                                       |
| ----------------- | -------- | ------------------------------------------------------------------------------------------------- |
| `prompt`          | string   | Prompt de geração de música (obrigatório para `action: "generate"`)                               |
| `action`          | string   | `"generate"` (padrão), `"status"` para a tarefa da sessão atual ou `"list"` para inspecionar provedores |
| `model`           | string   | Substituição de provedor/modelo, por exemplo `google/lyria-3-pro-preview` ou `comfy/workflow`     |
| `lyrics`          | string   | Letra opcional quando o provedor oferece suporte a entrada explícita de letra                     |
| `instrumental`    | boolean  | Solicita saída somente instrumental quando o provedor oferece suporte                             |
| `image`           | string   | Caminho ou URL de uma única imagem de referência                                                  |
| `images`          | string[] | Várias imagens de referência (até 10)                                                             |
| `durationSeconds` | number   | Duração alvo em segundos quando o provedor oferece suporte a indicação de duração                 |
| `format`          | string   | Indicação de formato de saída (`mp3` ou `wav`) quando o provedor oferece suporte                  |
| `filename`        | string   | Indicação de nome do arquivo de saída                                                             |

Nem todos os provedores oferecem suporte a todos os parâmetros. O OpenClaw ainda valida limites rígidos
como contagem de entradas antes do envio. Quando um provedor oferece suporte a duração, mas
usa um máximo menor do que o valor solicitado, o OpenClaw ajusta automaticamente
para a duração compatível mais próxima. Indicações opcionais realmente incompatíveis são ignoradas
com um aviso quando o provedor ou modelo selecionado não consegue respeitá-las.

Os resultados da ferramenta informam as configurações aplicadas. Quando o OpenClaw ajusta a duração durante fallback de provedor, o `durationSeconds` retornado reflete o valor enviado e `details.normalization.durationSeconds` mostra o mapeamento entre o valor solicitado e o aplicado.

## Comportamento assíncrono para o caminho compartilhado com provedores

- Execuções de agente com sessão associada: `music_generate` cria uma tarefa em segundo plano, retorna imediatamente uma resposta de tarefa iniciada/em execução e publica a faixa finalizada depois em uma mensagem de follow-up do agente.
- Prevenção de duplicatas: enquanto essa tarefa em segundo plano ainda estiver `queued` ou `running`, chamadas posteriores de `music_generate` na mesma sessão retornam o status da tarefa em vez de iniciar outra geração.
- Consulta de status: use `action: "status"` para inspecionar a tarefa de música ativa associada à sessão sem iniciar uma nova.
- Rastreamento de tarefas: use `openclaw tasks list` ou `openclaw tasks show <taskId>` para inspecionar status em fila, em execução e final para a geração.
- Despertar na conclusão: o OpenClaw injeta um evento interno de conclusão de volta na mesma sessão para que o modelo possa escrever por conta própria o follow-up voltado ao usuário.
- Dica de prompt: turnos posteriores do usuário/manuais na mesma sessão recebem uma pequena dica de runtime quando uma tarefa de música já está em andamento para que o modelo não chame `music_generate` cegamente de novo.
- Fallback sem sessão: contextos diretos/locais sem uma sessão real de agente ainda executam inline e retornam o resultado final de áudio no mesmo turno.

### Ciclo de vida da tarefa

Cada solicitação `music_generate` passa por quatro estados:

1. **queued** -- tarefa criada, aguardando o provedor aceitá-la.
2. **running** -- o provedor está processando (normalmente entre 30 segundos e 3 minutos, dependendo do provedor e da duração).
3. **succeeded** -- a faixa está pronta; o agente desperta e a publica na conversa.
4. **failed** -- erro do provedor ou timeout; o agente desperta com detalhes do erro.

Verifique o status pela CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Prevenção de duplicatas: se uma tarefa de música já estiver `queued` ou `running` para a sessão atual, `music_generate` retorna o status da tarefa existente em vez de iniciar uma nova. Use `action: "status"` para verificar explicitamente sem acionar uma nova geração.

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

### Ordem de seleção de provedor

Ao gerar música, o OpenClaw tenta os provedores nesta ordem:

1. Parâmetro `model` da chamada da ferramenta, se o agente especificar um
2. `musicGenerationModel.primary` da configuração
3. `musicGenerationModel.fallbacks` em ordem
4. Auto-detecção usando apenas padrões de provedor respaldados por auth:
   - primeiro o provedor padrão atual
   - os demais provedores registrados de geração de música em ordem de id do provedor

Se um provedor falhar, o próximo candidato será tentado automaticamente. Se todos falharem, o
erro incluirá detalhes de cada tentativa.

Defina `agents.defaults.mediaGenerationAutoProviderFallback: false` se quiser que a
geração de música use apenas as entradas explícitas `model`, `primary` e `fallbacks`.

## Observações sobre provedores

- O Google usa geração em lote do Lyria 3. O fluxo empacotado atual oferece suporte a
  prompt, texto opcional de letra e imagens de referência opcionais.
- O MiniMax usa o endpoint em lote `music_generation`. O fluxo empacotado atual
  oferece suporte a prompt, letras opcionais, modo instrumental, orientação de duração e
  saída mp3.
- O suporte a ComfyUI é orientado por workflow e depende do grafo configurado, além do
  mapeamento de nós para campos de prompt/saída.

## Modos de capacidade do provedor

O contrato compartilhado de geração de música agora oferece suporte a declarações explícitas de modo:

- `generate` para geração somente por prompt
- `edit` quando a solicitação inclui uma ou mais imagens de referência

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
`supportsFormat` não são suficientes para anunciar suporte a edição. Os provedores devem
declarar `generate` e `edit` explicitamente para que testes live, testes de contrato e
a ferramenta compartilhada `music_generate` possam validar o suporte a modos de forma determinística.

## Escolhendo o caminho certo

- Use o caminho compartilhado com provedores quando quiser seleção de modelo, failover entre provedores e o fluxo embutido de tarefa/status assíncronos.
- Use um caminho de plugin como ComfyUI quando precisar de um grafo de workflow personalizado ou de um provedor que não faça parte da capacidade compartilhada empacotada de música.
- Se estiver depurando comportamento específico do ComfyUI, consulte [ComfyUI](/pt-BR/providers/comfy). Se estiver depurando comportamento de provedor compartilhado, comece por [Google (Gemini)](/pt-BR/providers/google) ou [MiniMax](/pt-BR/providers/minimax).

## Testes live

Cobertura live opt-in para os provedores compartilhados empacotados:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper do repositório:

```bash
pnpm test:live:media music
```

Esse arquivo live carrega variáveis de ambiente ausentes de provedores a partir de `~/.profile`, prioriza
por padrão chaves de API live/env em vez de perfis auth armazenados e executa cobertura tanto de
`generate` quanto de `edit` declarado quando o provedor ativa o modo de edição.

Hoje isso significa:

- `google`: `generate` mais `edit`
- `minimax`: somente `generate`
- `comfy`: cobertura live separada do Comfy, não a varredura compartilhada de provedores

Cobertura live opt-in para o caminho de música ComfyUI empacotado:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

O arquivo live do Comfy também cobre workflows de imagem e vídeo do comfy quando essas
seções estão configuradas.

## Relacionado

- [Tarefas em segundo plano](/pt-BR/automation/tasks) - rastreamento de tarefas para execuções destacadas de `music_generate`
- [Referência de configuração](/pt-BR/gateway/configuration-reference#agent-defaults) - configuração de `musicGenerationModel`
- [ComfyUI](/pt-BR/providers/comfy)
- [Google (Gemini)](/pt-BR/providers/google)
- [MiniMax](/pt-BR/providers/minimax)
- [Modelos](/pt-BR/concepts/models) - configuração de modelo e failover
- [Visão geral das ferramentas](/pt-BR/tools)
