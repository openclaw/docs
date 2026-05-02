---
read_when:
    - Você precisa de um passo a passo exato do loop do agente ou dos eventos do ciclo de vida
    - Você está alterando o enfileiramento de sessões, as gravações de transcrições ou o comportamento do bloqueio de escrita da sessão
summary: Ciclo de vida do loop do agente, fluxos e semântica de espera
title: Ciclo do agente
x-i18n:
    generated_at: "2026-05-02T20:45:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39c49e8c5d1e380e0569e31856d855484d5a8fa33b04cf85cccde4c9ac21fbe7
    source_path: concepts/agent-loop.md
    workflow: 16
---

Um loop agêntico é a execução “real” completa de um agente: entrada → montagem de contexto → inferência do modelo →
execução de ferramentas → respostas por streaming → persistência. É o caminho autoritativo que transforma uma mensagem
em ações e uma resposta final, mantendo o estado da sessão consistente.

No OpenClaw, um loop é uma execução única e serializada por sessão que emite eventos de ciclo de vida e de stream
enquanto o modelo pensa, chama ferramentas e transmite a saída. Este documento explica como esse loop autêntico é
conectado de ponta a ponta.

## Pontos de entrada

- RPC do Gateway: `agent` e `agent.wait`.
- CLI: comando `agent`.

## Como funciona (visão geral)

1. O RPC `agent` valida parâmetros, resolve a sessão (sessionKey/sessionId), persiste metadados da sessão e retorna `{ runId, acceptedAt }` imediatamente.
2. `agentCommand` executa o agente:
   - resolve padrões de modelo + thinking/verbose/trace
   - carrega snapshot de Skills
   - chama `runEmbeddedPiAgent` (runtime pi-agent-core)
   - emite **fim/erro de ciclo de vida** se o loop embutido não emitir um
3. `runEmbeddedPiAgent`:
   - serializa execuções por meio de filas por sessão + globais
   - resolve o modelo + perfil de autenticação e cria a sessão do pi
   - assina eventos do pi e transmite deltas de assistente/ferramenta
   - impõe timeout -> aborta a execução se excedido
   - para turnos do servidor de apps do Codex, aborta um turno aceito que para de produzir progresso do servidor de apps antes de um evento terminal
   - retorna payloads + metadados de uso
4. `subscribeEmbeddedPiSession` conecta eventos do pi-agent-core ao stream `agent` do OpenClaw:
   - eventos de ferramenta => `stream: "tool"`
   - deltas do assistente => `stream: "assistant"`
   - eventos de ciclo de vida => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` usa `waitForAgentRun`:
   - aguarda **fim/erro de ciclo de vida** para `runId`
   - retorna `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Enfileiramento + concorrência

- As execuções são serializadas por chave de sessão (raia de sessão) e, opcionalmente, por uma raia global.
- Isso evita corridas de ferramenta/sessão e mantém o histórico da sessão consistente.
- Canais de mensagem podem escolher modos de fila (collect/steer/followup) que alimentam esse sistema de raias.
  Consulte [Fila de comandos](/pt-BR/concepts/queue).
- Escritas de transcrição também são protegidas por um bloqueio de escrita de sessão no arquivo de sessão. O bloqueio é
  ciente do processo e baseado em arquivo, então captura escritores que ignoram a fila em processo ou vêm de
  outro processo. Escritores de transcrição de sessão aguardam até `session.writeLock.acquireTimeoutMs`
  antes de relatar a sessão como ocupada; o padrão é `60000` ms.
- Bloqueios de escrita de sessão não são reentrantes por padrão. Se um helper aninhar intencionalmente a aquisição do
  mesmo bloqueio preservando um único escritor lógico, ele deve optar explicitamente por isso com
  `allowReentrant: true`.

## Preparação de sessão + workspace

- O workspace é resolvido e criado; execuções em sandbox podem redirecionar para uma raiz de workspace de sandbox.
- Skills são carregadas (ou reutilizadas de um snapshot) e injetadas no ambiente e no prompt.
- Arquivos de bootstrap/contexto são resolvidos e injetados no relatório do prompt de sistema.
- Um bloqueio de escrita de sessão é adquirido; `SessionManager` é aberto e preparado antes do streaming. Qualquer
  caminho posterior de reescrita de transcrição, compaction ou truncamento deve obter o mesmo bloqueio antes de abrir ou
  modificar o arquivo de transcrição.

## Montagem do prompt + prompt de sistema

- O prompt de sistema é criado a partir do prompt base do OpenClaw, prompt de Skills, contexto de bootstrap e substituições por execução.
- Limites específicos do modelo e tokens de reserva de compaction são impostos.
- Consulte [Prompt de sistema](/pt-BR/concepts/system-prompt) para saber o que o modelo vê.

## Pontos de hook (onde você pode interceptar)

O OpenClaw tem dois sistemas de hook:

- **Hooks internos** (hooks do Gateway): scripts orientados a eventos para comandos e eventos de ciclo de vida.
- **Hooks de Plugin**: pontos de extensão dentro do ciclo de vida do agente/ferramenta e do pipeline do gateway.

### Hooks internos (hooks do Gateway)

- **`agent:bootstrap`**: executa durante a criação de arquivos de bootstrap antes que o prompt de sistema seja finalizado.
  Use isto para adicionar/remover arquivos de contexto de bootstrap.
- **Hooks de comando**: `/new`, `/reset`, `/stop` e outros eventos de comando (consulte o documento de Hooks).

Consulte [Hooks](/pt-BR/automation/hooks) para configuração e exemplos.

### Hooks de Plugin (ciclo de vida do agente + gateway)

Eles executam dentro do loop do agente ou do pipeline do gateway:

- **`before_model_resolve`**: executa antes da sessão (sem `messages`) para substituir deterministicamente provedor/modelo antes da resolução do modelo.
- **`before_prompt_build`**: executa após o carregamento da sessão (com `messages`) para injetar `prependContext`, `systemPrompt`, `prependSystemContext` ou `appendSystemContext` antes do envio do prompt. Use `prependContext` para texto dinâmico por turno e campos de contexto de sistema para orientações estáveis que devem ficar no espaço do prompt de sistema.
- **`before_agent_start`**: hook legado de compatibilidade que pode executar em qualquer fase; prefira os hooks explícitos acima.
- **`before_agent_reply`**: executa após ações inline e antes da chamada ao LLM, permitindo que um Plugin reivindique o turno e retorne uma resposta sintética ou silencie o turno por completo.
- **`agent_end`**: inspeciona a lista final de mensagens e metadados da execução após a conclusão.
- **`before_compaction` / `after_compaction`**: observa ou anota ciclos de compaction.
- **`before_tool_call` / `after_tool_call`**: intercepta parâmetros/resultados de ferramentas.
- **`before_install`**: inspeciona descobertas de varredura integradas e, opcionalmente, bloqueia instalações de Skill ou Plugin.
- **`tool_result_persist`**: transforma de forma síncrona resultados de ferramentas antes que sejam escritos em uma transcrição de sessão de propriedade do OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: hooks de mensagens de entrada + saída.
- **`session_start` / `session_end`**: limites do ciclo de vida da sessão.
- **`gateway_start` / `gateway_stop`**: eventos de ciclo de vida do gateway.

Regras de decisão de hook para proteções de saída/ferramenta:

- `before_tool_call`: `{ block: true }` é terminal e interrompe handlers de menor prioridade.
- `before_tool_call`: `{ block: false }` é um no-op e não remove um bloqueio anterior.
- `before_install`: `{ block: true }` é terminal e interrompe handlers de menor prioridade.
- `before_install`: `{ block: false }` é um no-op e não remove um bloqueio anterior.
- `message_sending`: `{ cancel: true }` é terminal e interrompe handlers de menor prioridade.
- `message_sending`: `{ cancel: false }` é um no-op e não remove um cancelamento anterior.

Consulte [Hooks de Plugin](/pt-BR/plugins/hooks) para a API de hook e detalhes de registro.

Harnesses podem adaptar esses hooks de formas diferentes. O harness de servidor de apps do Codex mantém
hooks de Plugin do OpenClaw como contrato de compatibilidade para superfícies espelhadas documentadas,
enquanto hooks nativos do Codex continuam sendo um mecanismo Codex separado e de nível mais baixo.

## Streaming + respostas parciais

- Deltas do assistente são transmitidos do pi-agent-core e emitidos como eventos `assistant`.
- Streaming de bloco pode emitir respostas parciais em `text_end` ou `message_end`.
- Streaming de raciocínio pode ser emitido como um stream separado ou como respostas de bloco.
- Consulte [Streaming](/pt-BR/concepts/streaming) para comportamento de divisão em chunks e resposta de bloco.

## Execução de ferramentas + ferramentas de mensagem

- Eventos de início/atualização/fim de ferramenta são emitidos no stream `tool`.
- Resultados de ferramentas são higienizados quanto a tamanho e payloads de imagem antes de serem registrados/emitidos.
- Envios de ferramentas de mensagem são rastreados para suprimir confirmações duplicadas do assistente.

## Formatação + supressão de respostas

- Payloads finais são montados a partir de:
  - texto do assistente (e raciocínio opcional)
  - resumos inline de ferramentas (quando verbose + permitido)
  - texto de erro do assistente quando o modelo falha
- O token silencioso exato `NO_REPLY` / `no_reply` é filtrado dos payloads
  de saída.
- Duplicatas de ferramentas de mensagem são removidas da lista final de payloads.
- Se nenhum payload renderizável restar e uma ferramenta tiver falhado, uma resposta de fallback de erro de ferramenta é emitida
  (a menos que uma ferramenta de mensagem já tenha enviado uma resposta visível ao usuário).

## Compaction + tentativas

- A compaction automática emite eventos de stream `compaction` e pode acionar uma nova tentativa.
- Na nova tentativa, buffers em memória e resumos de ferramentas são redefinidos para evitar saída duplicada.
- Consulte [Compaction](/pt-BR/concepts/compaction) para o pipeline de compaction.

## Streams de eventos (hoje)

- `lifecycle`: emitido por `subscribeEmbeddedPiSession` (e como fallback por `agentCommand`)
- `assistant`: deltas transmitidos por streaming do pi-agent-core
- `tool`: eventos de ferramenta transmitidos por streaming do pi-agent-core

## Tratamento de canal de chat

- Deltas do assistente são armazenados em buffer em mensagens `delta` de chat.
- Um `final` de chat é emitido em **fim/erro de ciclo de vida**.

## Timeouts

- Padrão de `agent.wait`: 30s (apenas a espera). O parâmetro `timeoutMs` substitui.
- Runtime do agente: `agents.defaults.timeoutSeconds` padrão 172800s (48 horas); imposto no temporizador de aborto de `runEmbeddedPiAgent`.
- Runtime do Cron: o `timeoutSeconds` de turno de agente isolado pertence ao cron. O agendador inicia esse temporizador quando a execução começa, aborta a execução subjacente no prazo configurado e então executa uma limpeza limitada antes de registrar o timeout, para que uma sessão filha obsoleta não mantenha a raia presa.
- Diagnóstico de vivacidade da sessão: com diagnósticos ativados, `diagnostics.stuckSessionWarnMs` classifica sessões `processing` longas que não têm resposta, ferramenta, status, bloco ou progresso ACP observado. Execuções embutidas, chamadas de modelo e chamadas de ferramenta ativas são relatadas como `session.long_running`; trabalho ativo sem progresso recente é relatado como `session.stalled`; `session.stuck` é reservado para controle de sessão obsoleto sem trabalho ativo, e apenas esse caminho libera a raia de sessão afetada para que trabalho de inicialização enfileirado possa escoar. Diagnósticos `session.stuck` repetidos recuam enquanto a sessão permanece inalterada.
- Timeout de ociosidade do modelo: o OpenClaw aborta uma solicitação de modelo quando nenhum chunk de resposta chega antes da janela de ociosidade. `models.providers.<id>.timeoutSeconds` estende esse watchdog de ociosidade para provedores locais/auto-hospedados lentos; caso contrário, o OpenClaw usa `agents.defaults.timeoutSeconds` quando configurado, limitado a 120s por padrão. Execuções acionadas por Cron sem timeout explícito de modelo ou agente desativam o watchdog de ociosidade e dependem do timeout externo do cron.
- Timeout de solicitação HTTP do provedor: `models.providers.<id>.timeoutSeconds` se aplica às buscas HTTP de modelo desse provedor, incluindo conexão, cabeçalhos, corpo, timeout de solicitação do SDK, tratamento total de aborto de fetch protegido e watchdog de ociosidade de stream do modelo. Use isso para provedores locais/auto-hospedados lentos, como Ollama, antes de aumentar o timeout de runtime do agente inteiro.

## Onde as coisas podem terminar cedo

- Timeout do agente (abort)
- AbortSignal (cancelamento)
- Desconexão do Gateway ou timeout de RPC
- Timeout de `agent.wait` (somente espera, não interrompe o agente)

## Relacionados

- [Ferramentas](/pt-BR/tools) — ferramentas disponíveis do agente
- [Hooks](/pt-BR/automation/hooks) — scripts orientados a eventos acionados por eventos de ciclo de vida do agente
- [Compaction](/pt-BR/concepts/compaction) — como conversas longas são resumidas
- [Aprovações de Exec](/pt-BR/tools/exec-approvals) — controles de aprovação para comandos de shell
- [Thinking](/pt-BR/tools/thinking) — configuração do nível de pensamento/raciocínio
