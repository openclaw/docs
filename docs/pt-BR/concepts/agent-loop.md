---
read_when:
    - Você precisa de um passo a passo exato do loop do agente ou dos eventos do ciclo de vida
    - Você está alterando o enfileiramento de sessões, as gravações de transcrições ou o comportamento do bloqueio de escrita de sessões
summary: Ciclo de vida do laço do agente, fluxos e semântica de espera
title: Ciclo do agente
x-i18n:
    generated_at: "2026-05-02T05:44:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4182cf13d43a111a94014d695dee4b1e7385dd3b928b16e2072bd24189256b49
    source_path: concepts/agent-loop.md
    workflow: 16
---

Um loop agêntico é a execução “real” completa de um agente: ingestão → montagem de contexto → inferência do modelo →
execução de ferramentas → respostas em streaming → persistência. É o caminho autoritativo que transforma uma mensagem
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
   - carrega um snapshot de Skills
   - chama `runEmbeddedPiAgent` (runtime do pi-agent-core)
   - emite **fim/erro de ciclo de vida** se o loop incorporado não emitir um
3. `runEmbeddedPiAgent`:
   - serializa execuções por meio de filas por sessão + globais
   - resolve modelo + perfil de autenticação e cria a sessão do Pi
   - assina eventos do Pi e transmite deltas do assistente/ferramenta
   - impõe timeout -> aborta a execução se excedido
   - para turnos do app-server do Codex, aborta um turno aceito que para de produzir progresso do app-server antes de um evento terminal
   - retorna payloads + metadados de uso
4. `subscribeEmbeddedPiSession` conecta eventos do pi-agent-core ao stream `agent` do OpenClaw:
   - eventos de ferramenta => `stream: "tool"`
   - deltas do assistente => `stream: "assistant"`
   - eventos de ciclo de vida => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` usa `waitForAgentRun`:
   - aguarda **fim/erro de ciclo de vida** para `runId`
   - retorna `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Enfileiramento + concorrência

- As execuções são serializadas por chave de sessão (lane da sessão) e, opcionalmente, por uma lane global.
- Isso evita corridas de ferramenta/sessão e mantém o histórico da sessão consistente.
- Canais de mensagens podem escolher modos de fila (coletar/direcionar/acompanhamento) que alimentam esse sistema de lanes.
  Consulte [Fila de comandos](/pt-BR/concepts/queue).
- As gravações de transcrição também são protegidas por um bloqueio de gravação da sessão no arquivo da sessão. O bloqueio é
  ciente do processo e baseado em arquivo, então captura gravadores que contornam a fila em processo ou vêm de
  outro processo.
- Bloqueios de gravação de sessão são não reentrantes por padrão. Se um auxiliar aninhar intencionalmente a aquisição do
  mesmo bloqueio preservando um único gravador lógico, ele deve aderir explicitamente com
  `allowReentrant: true`.

## Preparação da sessão + workspace

- O workspace é resolvido e criado; execuções em sandbox podem redirecionar para uma raiz de workspace de sandbox.
- Skills são carregadas (ou reutilizadas de um snapshot) e injetadas no ambiente e no prompt.
- Arquivos de bootstrap/contexto são resolvidos e injetados no relatório do prompt do sistema.
- Um bloqueio de gravação de sessão é adquirido; `SessionManager` é aberto e preparado antes da transmissão. Qualquer
  caminho posterior de reescrita de transcrição, Compaction ou truncamento deve obter o mesmo bloqueio antes de abrir ou
  modificar o arquivo de transcrição.

## Montagem de prompt + prompt do sistema

- O prompt do sistema é construído a partir do prompt base do OpenClaw, do prompt de Skills, do contexto de bootstrap e de substituições por execução.
- Limites específicos do modelo e tokens de reserva de Compaction são impostos.
- Consulte [Prompt do sistema](/pt-BR/concepts/system-prompt) para saber o que o modelo vê.

## Pontos de hook (onde você pode interceptar)

O OpenClaw tem dois sistemas de hooks:

- **Hooks internos** (hooks do Gateway): scripts orientados a eventos para comandos e eventos de ciclo de vida.
- **Hooks de Plugin**: pontos de extensão dentro do ciclo de vida do agente/ferramenta e do pipeline do Gateway.

### Hooks internos (hooks do Gateway)

- **`agent:bootstrap`**: executa ao criar arquivos de bootstrap antes que o prompt do sistema seja finalizado.
  Use isto para adicionar/remover arquivos de contexto de bootstrap.
- **Hooks de comando**: `/new`, `/reset`, `/stop` e outros eventos de comando (consulte a documentação de Hooks).

Consulte [Hooks](/pt-BR/automation/hooks) para configuração e exemplos.

### Hooks de Plugin (ciclo de vida do agente + gateway)

Eles são executados dentro do loop do agente ou do pipeline do gateway:

- **`before_model_resolve`**: executa antes da sessão (sem `messages`) para substituir deterministicamente provedor/modelo antes da resolução do modelo.
- **`before_prompt_build`**: executa após o carregamento da sessão (com `messages`) para injetar `prependContext`, `systemPrompt`, `prependSystemContext` ou `appendSystemContext` antes do envio do prompt. Use `prependContext` para texto dinâmico por turno e campos de contexto do sistema para orientação estável que deve ficar no espaço do prompt do sistema.
- **`before_agent_start`**: hook de compatibilidade legado que pode executar em qualquer fase; prefira os hooks explícitos acima.
- **`before_agent_reply`**: executa após ações inline e antes da chamada do LLM, permitindo que um Plugin reivindique o turno e retorne uma resposta sintética ou silencie o turno completamente.
- **`agent_end`**: inspeciona a lista final de mensagens e os metadados da execução após a conclusão.
- **`before_compaction` / `after_compaction`**: observa ou anota ciclos de Compaction.
- **`before_tool_call` / `after_tool_call`**: intercepta parâmetros/resultados de ferramenta.
- **`before_install`**: inspeciona achados de varredura integrados e, opcionalmente, bloqueia instalações de Skill ou Plugin.
- **`tool_result_persist`**: transforma resultados de ferramenta de forma síncrona antes que sejam gravados em uma transcrição de sessão pertencente ao OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: hooks de mensagens recebidas + enviadas.
- **`session_start` / `session_end`**: limites do ciclo de vida da sessão.
- **`gateway_start` / `gateway_stop`**: eventos de ciclo de vida do gateway.

Regras de decisão de hooks para proteções de saída/ferramenta:

- `before_tool_call`: `{ block: true }` é terminal e interrompe handlers de menor prioridade.
- `before_tool_call`: `{ block: false }` é uma não operação e não limpa um bloqueio anterior.
- `before_install`: `{ block: true }` é terminal e interrompe handlers de menor prioridade.
- `before_install`: `{ block: false }` é uma não operação e não limpa um bloqueio anterior.
- `message_sending`: `{ cancel: true }` é terminal e interrompe handlers de menor prioridade.
- `message_sending`: `{ cancel: false }` é uma não operação e não limpa um cancelamento anterior.

Consulte [Hooks de Plugin](/pt-BR/plugins/hooks) para a API de hooks e detalhes de registro.

Harnesses podem adaptar esses hooks de formas diferentes. O harness do app-server do Codex mantém
hooks de Plugin do OpenClaw como o contrato de compatibilidade para superfícies espelhadas documentadas,
enquanto hooks nativos do Codex continuam sendo um mecanismo separado de nível mais baixo do Codex.

## Streaming + respostas parciais

- Deltas do assistente são transmitidos pelo pi-agent-core e emitidos como eventos `assistant`.
- A transmissão em bloco pode emitir respostas parciais em `text_end` ou `message_end`.
- A transmissão de raciocínio pode ser emitida como um stream separado ou como respostas em bloco.
- Consulte [Transmissão](/pt-BR/concepts/streaming) para comportamento de fragmentação e resposta em bloco.

## Execução de ferramentas + ferramentas de mensagens

- Eventos de início/atualização/fim de ferramenta são emitidos no stream `tool`.
- Resultados de ferramentas são sanitizados quanto a tamanho e payloads de imagem antes de registrar/emitir.
- Envios de ferramentas de mensagens são rastreados para suprimir confirmações duplicadas do assistente.

## Formatação de resposta + supressão

- Payloads finais são montados a partir de:
  - texto do assistente (e raciocínio opcional)
  - resumos inline de ferramentas (quando verbose + permitido)
  - texto de erro do assistente quando o modelo erra
- O token silencioso exato `NO_REPLY` / `no_reply` é filtrado dos payloads
  de saída.
- Duplicatas de ferramentas de mensagens são removidas da lista final de payloads.
- Se nenhum payload renderizável restar e uma ferramenta tiver gerado erro, uma resposta substituta de erro de ferramenta será emitida
  (a menos que uma ferramenta de mensagens já tenha enviado uma resposta visível ao usuário).

## Compaction + novas tentativas

- A Compaction automática emite eventos de stream `compaction` e pode acionar uma nova tentativa.
- Na nova tentativa, buffers em memória e resumos de ferramentas são redefinidos para evitar saída duplicada.
- Consulte [Compaction](/pt-BR/concepts/compaction) para o pipeline de Compaction.

## Streams de eventos (hoje)

- `lifecycle`: emitido por `subscribeEmbeddedPiSession` (e como fallback por `agentCommand`)
- `assistant`: deltas transmitidos pelo pi-agent-core
- `tool`: eventos de ferramenta transmitidos pelo pi-agent-core

## Tratamento de canal de chat

- Deltas do assistente são armazenados em buffer em mensagens `delta` de chat.
- Um `final` de chat é emitido em **fim/erro de ciclo de vida**.

## Timeouts

- Padrão de `agent.wait`: 30s (apenas a espera). O parâmetro `timeoutMs` substitui.
- Runtime do agente: padrão de `agents.defaults.timeoutSeconds` é 172800s (48 horas); imposto no temporizador de abort de `runEmbeddedPiAgent`.
- Runtime de Cron: `timeoutSeconds` de turno de agente isolado pertence ao cron. O agendador inicia esse temporizador quando a execução começa, aborta a execução subjacente no prazo configurado e então executa uma limpeza limitada antes de registrar o timeout para que uma sessão filha obsoleta não mantenha a lane travada.
- Diagnósticos de vivacidade da sessão: com diagnósticos habilitados, `diagnostics.stuckSessionWarnMs` classifica sessões longas em `processing` que não têm resposta, ferramenta, status, bloco ou progresso de ACP observado. Execuções incorporadas, chamadas de modelo e chamadas de ferramenta ativas são relatadas como `session.long_running`; trabalho ativo sem progresso recente é relatado como `session.stalled`; `session.stuck` é reservado para escrituração de sessão obsoleta sem trabalho ativo, e somente esse caminho libera a lane de sessão afetada para que trabalho de inicialização enfileirado possa escoar. Diagnósticos repetidos de `session.stuck` aplicam recuo enquanto a sessão permanece inalterada.
- Timeout ocioso do modelo: o OpenClaw aborta uma solicitação de modelo quando nenhum chunk de resposta chega antes da janela ociosa. `models.providers.<id>.timeoutSeconds` estende esse watchdog ocioso para provedores locais/auto-hospedados lentos; caso contrário, o OpenClaw usa `agents.defaults.timeoutSeconds` quando configurado, limitado a 120s por padrão. Execuções acionadas por Cron sem timeout explícito de modelo ou agente desabilitam o watchdog ocioso e dependem do timeout externo do cron.
- Timeout de solicitação HTTP do provedor: `models.providers.<id>.timeoutSeconds` se aplica às buscas HTTP de modelo desse provedor, incluindo conexão, cabeçalhos, corpo, timeout de solicitação do SDK, tratamento de abort de busca protegida total e watchdog ocioso de stream do modelo. Use isto para provedores locais/auto-hospedados lentos como Ollama antes de aumentar o timeout de runtime do agente inteiro.

## Onde as coisas podem terminar cedo

- Timeout do agente (abort)
- AbortSignal (cancelamento)
- Desconexão do Gateway ou timeout de RPC
- Timeout de `agent.wait` (somente espera, não interrompe o agente)

## Relacionados

- [Ferramentas](/pt-BR/tools) — ferramentas de agente disponíveis
- [Hooks](/pt-BR/automation/hooks) — scripts orientados a eventos acionados por eventos de ciclo de vida do agente
- [Compaction](/pt-BR/concepts/compaction) — como conversas longas são resumidas
- [Aprovações de Exec](/pt-BR/tools/exec-approvals) — portões de aprovação para comandos de shell
- [Thinking](/pt-BR/tools/thinking) — configuração de nível de pensamento/raciocínio
