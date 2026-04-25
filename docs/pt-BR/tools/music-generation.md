---
read_when:
    - Gerar música ou áudio pelo agente
    - Configurar providers e modelos de geração de música
    - Entender os parâmetros da ferramenta `music_generate`
summary: Gerar música com providers compartilhados, incluindo Plugins com suporte de workflow
title: Geração de música
x-i18n:
    generated_at: "2026-04-25T13:57:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe66c6dfb54c71b1d08a486c574e8a86cf3731d5339b44b9eef121f045c13cb8
    source_path: tools/music-generation.md
    workflow: 15
---

A ferramenta `music_generate` permite que o agente crie música ou áudio por meio do
recurso compartilhado de geração de música com providers configurados, como Google,
MiniMax e ComfyUI configurado por workflow.

Para sessões do agente com suporte de providers compartilhados, o OpenClaw inicia a geração de música como uma
tarefa em segundo plano, rastreia isso no TaskFlow e depois desperta o agente novamente quando
a faixa está pronta para que o agente possa publicar o áudio final no canal
original.

<Note>
A ferramenta compartilhada integrada só aparece quando pelo menos um provider de geração de música está disponível. Se você não encontrar `music_generate` nas ferramentas do seu agente, configure `agents.defaults.musicGenerationModel` ou defina uma chave de API de provider.
</Note>

## Início rápido

### Geração com suporte de provider compartilhado

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

O agente chama `music_generate` automaticamente. Não é necessário colocar a ferramenta na allow-list.

Para contextos síncronos diretos sem uma execução de agente com suporte de sessão, a ferramenta integrada
ainda recorre à geração inline e retorna o caminho final da mídia no
resultado da ferramenta.

Exemplos de prompts:

```text
Gere uma faixa cinematográfica de piano com cordas suaves e sem vocais.
```

```text
Gere um loop chiptune enérgico sobre o lançamento de um foguete ao nascer do sol.
```

### Geração com Comfy orientada por workflow

O Plugin `comfy` incluído se conecta à ferramenta compartilhada `music_generate` por meio do
registro de providers de geração de música.

1. Configure `plugins.entries.comfy.config.music` com um workflow JSON e
   nós de prompt/saída.
2. Se você usa o Comfy Cloud, defina `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY`.
3. Peça música ao agente ou chame a ferramenta diretamente.

Exemplo:

```text
/tool music_generate prompt="Loop de synth ambiente acolhedor com textura suave de fita"
```

## Suporte compartilhado a providers incluídos

| Provider | Modelo padrão         | Entradas de referência | Controles compatíveis                                      | Chave de API                            |
| -------- | --------------------- | ---------------------- | ---------------------------------------------------------- | --------------------------------------- |
| ComfyUI  | `workflow`            | Até 1 imagem           | Música ou áudio definidos pelo workflow                    | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | Até 10 imagens        | `lyrics`, `instrumental`, `format`                         | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`           | Nenhuma                | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY`                      |

### Matriz declarada de capacidades

Este é o contrato explícito de modos usado por `music_generate`, pelos testes de contrato
e pela varredura compartilhada ao vivo.

| Provider | `generate` | `edit` | Limite de edição | Lanes compartilhadas ao vivo                                               |
| -------- | ---------- | ------ | ---------------- | -------------------------------------------------------------------------- |
| ComfyUI  | Sim        | Sim    | 1 imagem         | Não está na varredura compartilhada; coberto por `extensions/comfy/comfy.live.test.ts` |
| Google   | Sim        | Sim    | 10 imagens       | `generate`, `edit`                                                         |
| MiniMax  | Sim        | Não    | Nenhum           | `generate`                                                                 |

Use `action: "list"` para inspecionar providers e modelos compartilhados disponíveis em
tempo de execução:

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

## Parâmetros da ferramenta integrada

| Parâmetro         | Tipo     | Descrição                                                                                           |
| ----------------- | -------- | --------------------------------------------------------------------------------------------------- |
| `prompt`          | string   | Prompt de geração de música (obrigatório para `action: "generate"`)                                |
| `action`          | string   | `"generate"` (padrão), `"status"` para a tarefa atual da sessão ou `"list"` para inspecionar providers |
| `model`           | string   | Sobrescrita de provider/modelo, por exemplo `google/lyria-3-pro-preview` ou `comfy/workflow`      |
| `lyrics`          | string   | Letra opcional quando o provider oferece suporte a entrada explícita de letra                       |
| `instrumental`    | boolean  | Solicita saída apenas instrumental quando o provider oferece suporte                                |
| `image`           | string   | Caminho ou URL de uma única imagem de referência                                                    |
| `images`          | string[] | Múltiplas imagens de referência (até 10)                                                            |
| `durationSeconds` | number   | Duração alvo em segundos quando o provider oferece suporte a dicas de duração                       |
| `timeoutMs`       | number   | Timeout opcional da solicitação ao provider em milissegundos                                        |
| `format`          | string   | Dica de formato de saída (`mp3` ou `wav`) quando o provider oferece suporte                         |
| `filename`        | string   | Dica de nome do arquivo de saída                                                                    |

Nem todos os providers oferecem suporte a todos os parâmetros. O OpenClaw ainda valida limites rígidos
como contagens de entrada antes do envio. Quando um provider oferece suporte a duração, mas
usa um máximo menor do que o valor solicitado, o OpenClaw ajusta automaticamente
para a duração compatível mais próxima. Dicas opcionais realmente não compatíveis são ignoradas
com um aviso quando o provider ou modelo selecionado não pode respeitá-las.

Os resultados da ferramenta informam as configurações aplicadas. Quando o OpenClaw ajusta a duração durante o fallback de provider, o `durationSeconds` retornado reflete o valor enviado, e `details.normalization.durationSeconds` mostra o mapeamento entre o valor solicitado e o aplicado.

## Comportamento assíncrono para o caminho com suporte de provider compartilhado

- Execuções de agente com suporte de sessão: `music_generate` cria uma tarefa em segundo plano, retorna imediatamente uma resposta iniciada/de tarefa e publica a faixa final depois em uma mensagem de follow-up do agente.
- Prevenção de duplicatas: enquanto essa tarefa em segundo plano ainda estiver `queued` ou `running`, chamadas posteriores de `music_generate` na mesma sessão retornam o status da tarefa em vez de iniciar outra geração.
- Consulta de status: use `action: "status"` para inspecionar a tarefa ativa de música com suporte de sessão sem iniciar uma nova.
- Rastreamento de tarefas: use `openclaw tasks list` ou `openclaw tasks show <taskId>` para inspecionar status enfileirado, em execução e terminal da geração.
- Despertar na conclusão: o OpenClaw injeta um evento interno de conclusão de volta na mesma sessão para que o modelo possa escrever ele mesmo o follow-up voltado ao usuário.
- Dica de prompt: turnos posteriores do usuário/manuais na mesma sessão recebem uma pequena dica de runtime quando uma tarefa de música já está em andamento, para que o modelo não chame `music_generate` novamente às cegas.
- Fallback sem sessão: contextos diretos/locais sem uma sessão real de agente ainda são executados inline e retornam o resultado final do áudio no mesmo turno.

### Ciclo de vida da tarefa

Cada solicitação `music_generate` passa por quatro estados:

1. **queued** -- tarefa criada, aguardando o provider aceitá-la.
2. **running** -- o provider está processando (normalmente de 30 segundos a 3 minutos, dependendo do provider e da duração).
3. **succeeded** -- faixa pronta; o agente desperta e a publica na conversa.
4. **failed** -- erro do provider ou timeout; o agente desperta com detalhes do erro.

Verifique o status pela CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Prevenção de duplicatas: se uma tarefa de música já estiver `queued` ou `running` para a sessão atual, `music_generate` retorna o status da tarefa existente em vez de iniciar uma nova. Use `action: "status"` para verificar explicitamente sem disparar uma nova geração.

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

### Ordem de seleção de provider

Ao gerar música, o OpenClaw tenta os providers nesta ordem:

1. parâmetro `model` da chamada da ferramenta, se o agente especificar um
2. `musicGenerationModel.primary` da configuração
3. `musicGenerationModel.fallbacks` em ordem
4. detecção automática usando apenas padrões de provider com suporte de autenticação:
   - provider padrão atual primeiro
   - providers restantes registrados de geração de música em ordem de id do provider

Se um provider falhar, o próximo candidato será tentado automaticamente. Se todos falharem, o
erro incluirá detalhes de cada tentativa.

Defina `agents.defaults.mediaGenerationAutoProviderFallback: false` se quiser
que a geração de música use apenas as entradas explícitas de `model`, `primary` e `fallbacks`.

## Notas sobre providers

- O Google usa geração em lote do Lyria 3. O fluxo incluído atualmente oferece suporte a
  prompt, texto opcional de letra e imagens de referência opcionais.
- O MiniMax usa o endpoint em lote `music_generation`. O fluxo incluído atualmente
  oferece suporte a prompt, letra opcional, modo instrumental, controle de duração e
  saída em mp3.
- O suporte a ComfyUI é orientado por workflow e depende do grafo configurado mais o
  mapeamento de nós para campos de prompt/saída.

## Modos de capacidade do provider

O contrato compartilhado de geração de música agora oferece suporte a declarações explícitas de modo:

- `generate` para geração apenas por prompt
- `edit` quando a solicitação inclui uma ou mais imagens de referência

Novas implementações de provider devem preferir blocos explícitos de modo:

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
`supportsFormat` não são suficientes para anunciar suporte a edição. Providers devem
declarar `generate` e `edit` explicitamente para que testes ao vivo, testes de contrato e
a ferramenta compartilhada `music_generate` possam validar o suporte a modos de forma determinística.

## Como escolher o caminho certo

- Use o caminho com suporte de provider compartilhado quando quiser seleção de modelo, failover de provider e o fluxo integrado assíncrono de tarefa/status.
- Use um caminho de Plugin como ComfyUI quando precisar de um grafo de workflow personalizado ou de um provider que não faça parte do recurso compartilhado incluído de música.
- Se você estiver depurando comportamento específico do ComfyUI, consulte [ComfyUI](/pt-BR/providers/comfy). Se estiver depurando comportamento de provider compartilhado, comece por [Google (Gemini)](/pt-BR/providers/google) ou [MiniMax](/pt-BR/providers/minimax).

## Testes ao vivo

Cobertura ao vivo opt-in para os providers compartilhados incluídos:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper do repositório:

```bash
pnpm test:live:media music
```

Esse arquivo de teste ao vivo carrega variáveis de ambiente ausentes de providers a partir de `~/.profile`, prioriza
chaves de API live/env em relação a perfis de autenticação armazenados por padrão e executa cobertura tanto de
`generate` quanto de `edit` declarado quando o provider habilita o modo de edição.

Hoje isso significa:

- `google`: `generate` mais `edit`
- `minimax`: apenas `generate`
- `comfy`: cobertura ao vivo separada do Comfy, não a varredura compartilhada de providers

Cobertura ao vivo opt-in para o caminho de música ComfyUI incluído:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

O arquivo de testes ao vivo do Comfy também cobre workflows de imagem e vídeo do comfy quando essas
seções estão configuradas.

## Relacionado

- [Tarefas em segundo plano](/pt-BR/automation/tasks) - rastreamento de tarefas para execuções desacopladas de `music_generate`
- [Referência de configuração](/pt-BR/gateway/config-agents#agent-defaults) - configuração de `musicGenerationModel`
- [ComfyUI](/pt-BR/providers/comfy)
- [Google (Gemini)](/pt-BR/providers/google)
- [MiniMax](/pt-BR/providers/minimax)
- [Modelos](/pt-BR/concepts/models) - configuração de modelos e failover
- [Visão geral das ferramentas](/pt-BR/tools)
