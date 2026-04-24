---
read_when:
    - Você precisa de uma explicação exata do loop do agente ou dos eventos do ciclo de vida
    - Você está alterando o enfileiramento de sessão, gravações de transcrição ou o comportamento do bloqueio de gravação da sessão
summary: Ciclo de vida do loop do agente, streams e semântica de espera
title: Loop do agente
x-i18n:
    generated_at: "2026-04-24T05:47:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: a413986168fe7eb1cb229e5ec45027d31fab889ca20ad53f289c8dfce98f7fab
    source_path: concepts/agent-loop.md
    workflow: 15
---

# Loop do agente (OpenClaw)

Um loop agentic é a execução “real” completa de um agente: intake → montagem de contexto → inferência do modelo →
execução de ferramentas → respostas em streaming → persistência. É o caminho autoritativo que transforma uma mensagem
em ações e uma resposta final, mantendo o estado da sessão consistente.

No OpenClaw, um loop é uma única execução serializada por sessão que emite eventos de ciclo de vida e de stream
enquanto o modelo pensa, chama ferramentas e transmite saída. Este documento explica como esse loop autêntico é
conectado de ponta a ponta.

## Pontos de entrada

- RPC do Gateway: `agent` e `agent.wait`.
- CLI: comando `agent`.

## Como funciona (visão geral)

1. O RPC `agent` valida parâmetros, resolve a sessão (sessionKey/sessionId), persiste metadados da sessão e retorna `{ runId, acceptedAt }` imediatamente.
2. `agentCommand` executa o agente:
   - resolve os padrões de modelo + thinking/verbose/trace
   - carrega o snapshot de Skills
   - chama `runEmbeddedPiAgent` (runtime do pi-agent-core)
   - emite **lifecycle end/error** se o loop incorporado não emitir um
3. `runEmbeddedPiAgent`:
   - serializa execuções por meio de filas por sessão + global
   - resolve modelo + perfil de autenticação e monta a sessão Pi
   - assina eventos do Pi e transmite deltas do assistente/ferramenta
   - aplica timeout -> aborta a execução se excedido
   - retorna payloads + metadados de uso
4. `subscribeEmbeddedPiSession` faz a ponte entre eventos do pi-agent-core e o stream `agent` do OpenClaw:
   - eventos de ferramenta => `stream: "tool"`
   - deltas do assistente => `stream: "assistant"`
   - eventos de ciclo de vida => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` usa `waitForAgentRun`:
   - espera por **lifecycle end/error** para `runId`
   - retorna `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Enfileiramento + concorrência

- As execuções são serializadas por chave de sessão (lane da sessão) e opcionalmente por uma lane global.
- Isso evita condições de corrida em ferramentas/sessão e mantém o histórico da sessão consistente.
- Canais de mensagens podem escolher modos de fila (collect/steer/followup) que alimentam esse sistema de lanes.
  Consulte [Fila de comandos](/pt-BR/concepts/queue).
- As gravações de transcrição também são protegidas por um bloqueio de gravação da sessão no arquivo da sessão. O bloqueio é
  sensível a processo e baseado em arquivo, então detecta gravadores que ignoram a fila em processo ou vêm de
  outro processo.
- Os bloqueios de gravação de sessão são não reentrantes por padrão. Se um helper aninhar intencionalmente a aquisição do
  mesmo bloqueio preservando um único gravador lógico, ele deve optar explicitamente por isso com
  `allowReentrant: true`.

## Preparação da sessão + workspace

- O workspace é resolvido e criado; execuções em sandbox podem redirecionar para uma raiz de workspace em sandbox.
- Skills são carregadas (ou reutilizadas de um snapshot) e injetadas no env e no prompt.
- Arquivos de bootstrap/contexto são resolvidos e injetados no relatório do prompt de sistema.
- Um bloqueio de gravação da sessão é adquirido; `SessionManager` é aberto e preparado antes do streaming. Qualquer
  caminho posterior de regravação, Compaction ou truncamento da transcrição deve obter o mesmo bloqueio antes de abrir ou
  modificar o arquivo de transcrição.

## Montagem do prompt + prompt de sistema

- O prompt de sistema é construído a partir do prompt base do OpenClaw, prompt de Skills, contexto de bootstrap e substituições por execução.
- Limites específicos do modelo e tokens reservados de Compaction são aplicados.
- Consulte [Prompt de sistema](/pt-BR/concepts/system-prompt) para ver o que o modelo enxerga.

## Pontos de hook (onde você pode interceptar)

O OpenClaw tem dois sistemas de hook:

- **Hooks internos** (hooks do Gateway): scripts orientados a eventos para comandos e eventos de ciclo de vida.
- **Hooks de Plugin**: pontos de extensão dentro do ciclo de vida do agente/ferramenta e do pipeline do gateway.

### Hooks internos (hooks do Gateway)

- **`agent:bootstrap`**: executa enquanto monta arquivos de bootstrap antes de o prompt de sistema ser finalizado.
  Use isto para adicionar/remover arquivos de contexto de bootstrap.
- **Hooks de comando**: `/new`, `/reset`, `/stop` e outros eventos de comando (consulte a documentação de Hooks).

Consulte [Hooks](/pt-BR/automation/hooks) para configuração e exemplos.

### Hooks de Plugin (ciclo de vida do agente + gateway)

Eles executam dentro do loop do agente ou do pipeline do gateway:

- **`before_model_resolve`**: executa antes da sessão (sem `messages`) para substituir deterministicamente provider/model antes da resolução do modelo.
- **`before_prompt_build`**: executa após o carregamento da sessão (com `messages`) para injetar `prependContext`, `systemPrompt`, `prependSystemContext` ou `appendSystemContext` antes do envio do prompt. Use `prependContext` para texto dinâmico por turno e campos de contexto de sistema para orientação estável que deve ficar no espaço do prompt de sistema.
- **`before_agent_start`**: hook legado de compatibilidade que pode executar em qualquer fase; prefira os hooks explícitos acima.
- **`before_agent_reply`**: executa após ações inline e antes da chamada ao LLM, permitindo que um plugin assuma o turno e retorne uma resposta sintética ou silencie o turno por completo.
- **`agent_end`**: inspeciona a lista final de mensagens e os metadados da execução após a conclusão.
- **`before_compaction` / `after_compaction`**: observam ou anotam ciclos de Compaction.
- **`before_tool_call` / `after_tool_call`**: interceptam parâmetros/resultados de ferramenta.
- **`before_install`**: inspeciona achados internos da varredura e opcionalmente bloqueia instalações de Skill ou Plugin.
- **`tool_result_persist`**: transforma sincronamente resultados de ferramenta antes de serem gravados em uma transcrição de sessão pertencente ao OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: hooks de mensagem de entrada + saída.
- **`session_start` / `session_end`**: limites do ciclo de vida da sessão.
- **`gateway_start` / `gateway_stop`**: eventos do ciclo de vida do gateway.

Regras de decisão de hooks para guards de saída/ferramenta:

- `before_tool_call`: `{ block: true }` é terminal e interrompe handlers de prioridade inferior.
- `before_tool_call`: `{ block: false }` é um no-op e não limpa um bloqueio anterior.
- `before_install`: `{ block: true }` é terminal e interrompe handlers de prioridade inferior.
- `before_install`: `{ block: false }` é um no-op e não limpa um bloqueio anterior.
- `message_sending`: `{ cancel: true }` é terminal e interrompe handlers de prioridade inferior.
- `message_sending`: `{ cancel: false }` é um no-op e não limpa um cancelamento anterior.

Consulte [Hooks de Plugin](/pt-BR/plugins/architecture-internals#provider-runtime-hooks) para a API de hooks e detalhes de registro.

Harnesses podem adaptar esses hooks de forma diferente. O harness app-server do Codex mantém
os hooks de Plugin do OpenClaw como contrato de compatibilidade para superfícies espelhadas documentadas,
enquanto hooks nativos do Codex continuam sendo um mecanismo Codex separado e de nível mais baixo.

## Streaming + respostas parciais

- Deltas do assistente são transmitidos a partir do pi-agent-core e emitidos como eventos `assistant`.
- O streaming por bloco pode emitir respostas parciais em `text_end` ou `message_end`.
- O streaming de reasoning pode ser emitido como um stream separado ou como respostas por bloco.
- Consulte [Streaming](/pt-BR/concepts/streaming) para chunking e comportamento de resposta por bloco.

## Execução de ferramenta + ferramentas de mensagens

- Eventos de início/atualização/fim de ferramenta são emitidos no stream `tool`.
- Resultados de ferramenta são higienizados quanto a tamanho e payloads de imagem antes de logar/emitir.
- Envios de ferramentas de mensagens são rastreados para suprimir confirmações duplicadas do assistente.

## Modelagem da resposta + supressão

- Payloads finais são montados a partir de:
  - texto do assistente (e reasoning opcional)
  - resumos inline de ferramenta (quando verbose + permitido)
  - texto de erro do assistente quando o modelo falha
- O token silencioso exato `NO_REPLY` / `no_reply` é filtrado dos
  payloads de saída.
- Duplicatas de ferramentas de mensagens são removidas da lista final de payloads.
- Se não restarem payloads renderizáveis e uma ferramenta tiver falhado, uma resposta fallback de erro de ferramenta é emitida
  (a menos que uma ferramenta de mensagens já tenha enviado uma resposta visível ao usuário).

## Compaction + novas tentativas

- A Compaction automática emite eventos de stream `compaction` e pode disparar uma nova tentativa.
- Na nova tentativa, buffers em memória e resumos de ferramentas são redefinidos para evitar saída duplicada.
- Consulte [Compaction](/pt-BR/concepts/compaction) para o pipeline de Compaction.

## Streams de eventos (hoje)

- `lifecycle`: emitido por `subscribeEmbeddedPiSession` (e como fallback por `agentCommand`)
- `assistant`: deltas transmitidos do pi-agent-core
- `tool`: eventos de ferramenta transmitidos do pi-agent-core

## Tratamento de canal de chat

- Deltas do assistente são armazenados em buffer em mensagens de chat `delta`.
- Um chat `final` é emitido em **lifecycle end/error**.

## Timeouts

- Padrão de `agent.wait`: 30s (apenas a espera). O parâmetro `timeoutMs` substitui.
- Runtime do agente: `agents.defaults.timeoutSeconds` padrão 172800s (48 horas); aplicado no temporizador de aborto de `runEmbeddedPiAgent`.
- Timeout de inatividade do LLM: `agents.defaults.llm.idleTimeoutSeconds` aborta uma solicitação de modelo quando nenhum chunk de resposta chega antes da janela de inatividade. Defina-o explicitamente para modelos locais lentos ou providers com reasoning/chamada de ferramenta; defina como 0 para desabilitar. Se não for definido, o OpenClaw usa `agents.defaults.timeoutSeconds` quando configurado, caso contrário 120s. Execuções disparadas por Cron sem timeout explícito de LLM ou agente desabilitam o watchdog de inatividade e dependem do timeout externo do Cron.

## Onde as coisas podem terminar cedo

- Timeout do agente (abort)
- AbortSignal (cancel)
- Desconexão do Gateway ou timeout de RPC
- Timeout de `agent.wait` (apenas espera, não interrompe o agente)

## Relacionado

- [Ferramentas](/pt-BR/tools) — ferramentas de agente disponíveis
- [Hooks](/pt-BR/automation/hooks) — scripts orientados a eventos disparados por eventos do ciclo de vida do agente
- [Compaction](/pt-BR/concepts/compaction) — como conversas longas são resumidas
- [Aprovações de Exec](/pt-BR/tools/exec-approvals) — gates de aprovação para comandos de shell
- [Thinking](/pt-BR/tools/thinking) — configuração do nível de thinking/reasoning
