---
read_when:
    - Você precisa de um passo a passo exato do loop do agente ou dos eventos de ciclo de vida
    - Você está alterando o enfileiramento de sessões, as gravações de transcrições ou o comportamento do bloqueio de escrita da sessão
summary: Ciclo de vida do loop do agente, fluxos e semântica de espera
title: Ciclo do agente
x-i18n:
    generated_at: "2026-05-03T21:29:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bdd8e98710dce6412f499c37d2d74445f44f93142364c30993de517fdea6c56
    source_path: concepts/agent-loop.md
    workflow: 16
---

Um loop agentivo é a execução “real” completa de um agente: entrada → montagem de contexto → inferência do modelo →
execução de ferramentas → respostas em streaming → persistência. É o caminho autoritativo que transforma uma mensagem
em ações e uma resposta final, mantendo o estado da sessão consistente.

No OpenClaw, um loop é uma execução única e serializada por sessão que emite eventos de ciclo de vida e de stream
enquanto o modelo raciocina, chama ferramentas e transmite saída. Este documento explica como esse loop autêntico é
conectado de ponta a ponta.

## Pontos de entrada

- RPC do Gateway: `agent` e `agent.wait`.
- CLI: comando `agent`.

## Como funciona (visão geral)

1. O RPC `agent` valida parâmetros, resolve a sessão (sessionKey/sessionId), persiste metadados da sessão e retorna `{ runId, acceptedAt }` imediatamente.
2. `agentCommand` executa o agente:
   - resolve modelo + padrões de pensamento/verbosidade/rastreamento
   - carrega o snapshot de Skills
   - chama `runEmbeddedPiAgent` (runtime do pi-agent-core)
   - emite **fim/erro de ciclo de vida** se o loop embutido não emitir um
3. `runEmbeddedPiAgent`:
   - serializa execuções por meio de filas por sessão + globais
   - resolve modelo + perfil de autenticação e cria a sessão do pi
   - assina eventos do pi e transmite deltas de assistente/ferramenta
   - impõe timeout -> aborta a execução se excedido
   - para turnos do servidor de app do Codex, aborta um turno aceito que para de produzir progresso do servidor de app antes de um evento terminal
   - retorna payloads + metadados de uso
4. `subscribeEmbeddedPiSession` conecta eventos do pi-agent-core ao stream `agent` do OpenClaw:
   - eventos de ferramenta => `stream: "tool"`
   - deltas do assistente => `stream: "assistant"`
   - eventos de ciclo de vida => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` usa `waitForAgentRun`:
   - aguarda **fim/erro de ciclo de vida** para `runId`
   - retorna `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Enfileiramento + concorrência

- As execuções são serializadas por chave de sessão (faixa da sessão) e, opcionalmente, por uma faixa global.
- Isso evita corridas de ferramenta/sessão e mantém o histórico da sessão consistente.
- Canais de mensagens podem escolher modos de fila (coletar/direcionar/acompanhamento) que alimentam esse sistema de faixas.
  Consulte [Fila de comandos](/pt-BR/concepts/queue).
- Gravações de transcrição também são protegidas por um bloqueio de gravação de sessão no arquivo da sessão. O bloqueio é
  ciente de processo e baseado em arquivo, portanto captura escritores que ignoram a fila em processo ou vêm de
  outro processo. Escritores de transcrição de sessão aguardam até `session.writeLock.acquireTimeoutMs`
  antes de relatar a sessão como ocupada; o padrão é `60000` ms.
- Bloqueios de gravação de sessão não são reentrantes por padrão. Se um helper intencionalmente aninhar a aquisição do
  mesmo bloqueio preservando um único escritor lógico, ele deve optar explicitamente por
  `allowReentrant: true`.

## Preparação de sessão + workspace

- O workspace é resolvido e criado; execuções em sandbox podem redirecionar para uma raiz de workspace em sandbox.
- Skills são carregadas (ou reutilizadas de um snapshot) e injetadas no env e no prompt.
- Arquivos de bootstrap/contexto são resolvidos e injetados no relatório do prompt de sistema.
- Um bloqueio de gravação de sessão é adquirido; `SessionManager` é aberto e preparado antes do streaming. Qualquer
  caminho posterior de reescrita, Compaction ou truncamento de transcrição deve obter o mesmo bloqueio antes de abrir ou
  modificar o arquivo de transcrição.

## Montagem do prompt + prompt de sistema

- O prompt de sistema é criado a partir do prompt base do OpenClaw, prompt de Skills, contexto de bootstrap e substituições por execução.
- Limites específicos do modelo e tokens reservados para Compaction são impostos.
- Consulte [Prompt de sistema](/pt-BR/concepts/system-prompt) para saber o que o modelo vê.

## Pontos de hook (onde você pode interceptar)

O OpenClaw tem dois sistemas de hooks:

- **Hooks internos** (hooks do Gateway): scripts orientados por eventos para comandos e eventos de ciclo de vida.
- **Hooks de Plugin**: pontos de extensão dentro do ciclo de vida do agente/ferramenta e do pipeline do Gateway.

### Hooks internos (hooks do Gateway)

- **`agent:bootstrap`**: executa durante a criação de arquivos de bootstrap antes que o prompt de sistema seja finalizado.
  Use isso para adicionar/remover arquivos de contexto de bootstrap.
- **Hooks de comando**: `/new`, `/reset`, `/stop` e outros eventos de comando (consulte a documentação de Hooks).

Consulte [Hooks](/pt-BR/automation/hooks) para configuração e exemplos.

### Hooks de Plugin (ciclo de vida do agente + Gateway)

Eles executam dentro do loop do agente ou do pipeline do Gateway:

- **`before_model_resolve`**: executa antes da sessão (sem `messages`) para substituir deterministamente provedor/modelo antes da resolução do modelo.
- **`before_prompt_build`**: executa após o carregamento da sessão (com `messages`) para injetar `prependContext`, `systemPrompt`, `prependSystemContext` ou `appendSystemContext` antes do envio do prompt. Use `prependContext` para texto dinâmico por turno e campos de contexto de sistema para orientação estável que deve ficar no espaço do prompt de sistema.
- **`before_agent_start`**: hook legado de compatibilidade que pode executar em qualquer fase; prefira os hooks explícitos acima.
- **`before_agent_reply`**: executa após ações inline e antes da chamada ao LLM, permitindo que um plugin assuma o turno e retorne uma resposta sintética ou silencie o turno por completo.
- **`agent_end`**: inspeciona a lista final de mensagens e metadados da execução após a conclusão.
- **`before_compaction` / `after_compaction`**: observa ou anota ciclos de Compaction.
- **`before_tool_call` / `after_tool_call`**: intercepta parâmetros/resultados de ferramenta.
- **`before_install`**: inspeciona achados de varredura integrados e, opcionalmente, bloqueia instalações de Skills ou Plugins.
- **`tool_result_persist`**: transforma sincronamente resultados de ferramentas antes que sejam gravados em uma transcrição de sessão pertencente ao OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: hooks de mensagens de entrada + saída.
- **`session_start` / `session_end`**: limites do ciclo de vida da sessão.
- **`gateway_start` / `gateway_stop`**: eventos de ciclo de vida do Gateway.

Regras de decisão de hooks para proteções de saída/ferramenta:

- `before_tool_call`: `{ block: true }` é terminal e interrompe handlers de prioridade mais baixa.
- `before_tool_call`: `{ block: false }` é uma não operação e não limpa um bloqueio anterior.
- `before_install`: `{ block: true }` é terminal e interrompe handlers de prioridade mais baixa.
- `before_install`: `{ block: false }` é uma não operação e não limpa um bloqueio anterior.
- `message_sending`: `{ cancel: true }` é terminal e interrompe handlers de prioridade mais baixa.
- `message_sending`: `{ cancel: false }` é uma não operação e não limpa um cancelamento anterior.

Consulte [Hooks de Plugin](/pt-BR/plugins/hooks) para a API de hooks e detalhes de registro.

Harnesses podem adaptar esses hooks de maneiras diferentes. O harness do servidor de app do Codex mantém
os hooks de Plugin do OpenClaw como o contrato de compatibilidade para superfícies espelhadas documentadas,
enquanto hooks nativos do Codex continuam sendo um mecanismo Codex separado de nível mais baixo.

## Streaming + respostas parciais

- Deltas do assistente são transmitidos a partir do pi-agent-core e emitidos como eventos `assistant`.
- Streaming de bloco pode emitir respostas parciais em `text_end` ou `message_end`.
- Streaming de raciocínio pode ser emitido como um stream separado ou como respostas em bloco.
- Consulte [Streaming](/pt-BR/concepts/streaming) para comportamento de fragmentação e resposta em bloco.

## Execução de ferramentas + ferramentas de mensagens

- Eventos de início/atualização/fim de ferramenta são emitidos no stream `tool`.
- Resultados de ferramentas são higienizados quanto a tamanho e payloads de imagem antes de registrar/emitir.
- Envios de ferramenta de mensagens são rastreados para suprimir confirmações duplicadas do assistente.

## Modelagem de resposta + supressão

- Payloads finais são montados a partir de:
  - texto do assistente (e raciocínio opcional)
  - resumos inline de ferramentas (quando verboso + permitido)
  - texto de erro do assistente quando o modelo falha
- O token silencioso exato `NO_REPLY` / `no_reply` é filtrado dos
  payloads de saída.
- Duplicatas de ferramentas de mensagens são removidas da lista final de payloads.
- Se nenhum payload renderizável permanecer e uma ferramenta tiver falhado, uma resposta fallback de erro de ferramenta é emitida
  (a menos que uma ferramenta de mensagens já tenha enviado uma resposta visível ao usuário).

## Compaction + novas tentativas

- A Compaction automática emite eventos de stream `compaction` e pode acionar uma nova tentativa.
- Na nova tentativa, buffers em memória e resumos de ferramentas são redefinidos para evitar saída duplicada.
- Consulte [Compaction](/pt-BR/concepts/compaction) para o pipeline de Compaction.

## Streams de eventos (hoje)

- `lifecycle`: emitido por `subscribeEmbeddedPiSession` (e como fallback por `agentCommand`)
- `assistant`: deltas em streaming do pi-agent-core
- `tool`: eventos de ferramenta em streaming do pi-agent-core

## Tratamento de canal de chat

- Deltas do assistente são armazenados em buffer em mensagens `delta` de chat.
- Um `final` de chat é emitido em **fim/erro de ciclo de vida**.

## Timeouts

- Padrão de `agent.wait`: 30 s (apenas a espera). O parâmetro `timeoutMs` substitui.
- Runtime do agente: padrão de `agents.defaults.timeoutSeconds` 172800 s (48 horas); imposto no temporizador de abort de `runEmbeddedPiAgent`.
- Runtime do Cron: `timeoutSeconds` de turno de agente isolado pertence ao cron. O agendador inicia esse temporizador quando a execução começa, aborta a execução subjacente no prazo configurado e então executa limpeza limitada antes de registrar o timeout para que uma sessão filha obsoleta não mantenha a faixa presa.
- Diagnósticos de vivacidade da sessão: com diagnósticos habilitados, `diagnostics.stuckSessionWarnMs` classifica sessões longas em `processing` que não têm resposta, ferramenta, status, bloco ou progresso de ACP observado. Execuções embutidas, chamadas de modelo e chamadas de ferramenta ativas são relatadas como `session.long_running`; trabalho ativo sem progresso recente é relatado como `session.stalled`; `session.stuck` é reservado para escrituração obsoleta de sessão sem trabalho ativo. A escrituração obsoleta de sessão libera a faixa de sessão afetada imediatamente; execuções embutidas travadas são abortadas e drenadas somente após uma janela estendida sem progresso (pelo menos 10 minutos e 5x o limite de aviso) para que trabalho enfileirado possa continuar sem interromper execuções apenas lentas. Diagnósticos repetidos de `session.stuck` aplicam backoff enquanto a sessão permanece inalterada.
- Timeout de inatividade do modelo: o OpenClaw aborta uma requisição de modelo quando nenhum fragmento de resposta chega antes da janela de inatividade. `models.providers.<id>.timeoutSeconds` estende esse watchdog de inatividade para provedores locais/autohospedados lentos; caso contrário, o OpenClaw usa `agents.defaults.timeoutSeconds` quando configurado, limitado por padrão a 120 s. Execuções acionadas por Cron sem timeout explícito de modelo ou agente desabilitam o watchdog de inatividade e dependem do timeout externo do cron.
- Timeout de requisição HTTP do provedor: `models.providers.<id>.timeoutSeconds` se aplica às buscas HTTP de modelo desse provedor, incluindo conexão, cabeçalhos, corpo, timeout de requisição do SDK, tratamento total de abort de fetch protegido e watchdog de inatividade de stream do modelo. Use isso para provedores locais/autohospedados lentos, como Ollama, antes de aumentar o timeout de runtime inteiro do agente.

## Onde as coisas podem terminar cedo

- Timeout do agente (abort)
- AbortSignal (cancelamento)
- Desconexão do Gateway ou timeout de RPC
- Timeout de `agent.wait` (somente espera, não interrompe o agente)

## Relacionados

- [Ferramentas](/pt-BR/tools) — ferramentas de agente disponíveis
- [Hooks](/pt-BR/automation/hooks) — scripts orientados por eventos acionados por eventos de ciclo de vida do agente
- [Compaction](/pt-BR/concepts/compaction) — como conversas longas são resumidas
- [Aprovações de Exec](/pt-BR/tools/exec-approvals) — portões de aprovação para comandos de shell
- [Pensamento](/pt-BR/tools/thinking) — configuração de nível de pensamento/raciocínio
