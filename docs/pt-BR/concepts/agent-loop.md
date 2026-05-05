---
read_when:
    - Você precisa de um passo a passo exato do ciclo do agente ou dos eventos de ciclo de vida
    - Você está alterando o enfileiramento de sessões, as gravações de transcrição ou o comportamento do bloqueio de gravação de sessão
summary: Ciclo de vida do loop do agente, fluxos e semântica de espera
title: Loop do agente
x-i18n:
    generated_at: "2026-05-05T05:42:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1c7031a2b70e7a891f51fa127df6f04663db81400715717f50dd840a3fa5b745
    source_path: concepts/agent-loop.md
    workflow: 16
---

Um loop agêntico é a execução “real” completa de um agente: entrada → montagem de contexto → inferência do modelo →
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
   - carrega o snapshot de Skills
   - chama `runEmbeddedPiAgent` (runtime do pi-agent-core)
   - emite **fim/erro de ciclo de vida** se o loop incorporado não emitir um
3. `runEmbeddedPiAgent`:
   - serializa execuções por filas por sessão + globais
   - resolve modelo + perfil de autenticação e monta a sessão do Pi
   - assina eventos do Pi e transmite deltas de assistente/ferramenta
   - aplica timeout -> aborta a execução se excedido
   - para turnos do servidor de app do Codex, aborta um turno aceito que para de produzir progresso do servidor de app antes de um evento terminal
   - retorna payloads + metadados de uso
4. `subscribeEmbeddedPiSession` conecta eventos do pi-agent-core ao stream `agent` do OpenClaw:
   - eventos de ferramenta => `stream: "tool"`
   - deltas de assistente => `stream: "assistant"`
   - eventos de ciclo de vida => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` usa `waitForAgentRun`:
   - aguarda **fim/erro de ciclo de vida** para `runId`
   - retorna `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Enfileiramento + concorrência

- As execuções são serializadas por chave de sessão (faixa de sessão) e, opcionalmente, por uma faixa global.
- Isso evita corridas de ferramenta/sessão e mantém o histórico da sessão consistente.
- Canais de mensagens podem escolher modos de fila (coletar/conduzir/acompanhamento) que alimentam esse sistema de faixas.
  Veja [Fila de comandos](/pt-BR/concepts/queue).
- Escritas de transcrição também são protegidas por um bloqueio de escrita de sessão no arquivo da sessão. O bloqueio é
  ciente de processo e baseado em arquivo, então captura escritores que contornam a fila em processo ou vêm de
  outro processo. Escritores de transcrição da sessão aguardam até `session.writeLock.acquireTimeoutMs`
  antes de relatarem a sessão como ocupada; o padrão é `60000` ms.
- Bloqueios de escrita de sessão não são reentrantes por padrão. Se um auxiliar aninhar intencionalmente a aquisição do
  mesmo bloqueio preservando um escritor lógico, ele deve optar explicitamente por
  `allowReentrant: true`.

## Preparação de sessão + workspace

- O workspace é resolvido e criado; execuções em sandbox podem redirecionar para uma raiz de workspace de sandbox.
- Skills são carregadas (ou reutilizadas de um snapshot) e injetadas no ambiente e no prompt.
- Arquivos de bootstrap/contexto são resolvidos e injetados no relatório do prompt de sistema.
- Um bloqueio de escrita de sessão é adquirido; `SessionManager` é aberto e preparado antes do streaming. Qualquer
  caminho posterior de reescrita de transcrição, Compaction ou truncamento deve tomar o mesmo bloqueio antes de abrir ou
  alterar o arquivo de transcrição.

## Montagem de prompt + prompt de sistema

- O prompt de sistema é construído a partir do prompt base do OpenClaw, do prompt de Skills, do contexto de bootstrap e de substituições por execução.
- Limites específicos do modelo e tokens de reserva para Compaction são aplicados.
- Veja [Prompt de sistema](/pt-BR/concepts/system-prompt) para o que o modelo vê.

## Pontos de hook (onde você pode interceptar)

O OpenClaw tem dois sistemas de hooks:

- **Hooks internos** (hooks do Gateway): scripts orientados por eventos para comandos e eventos de ciclo de vida.
- **Hooks de Plugin**: pontos de extensão dentro do ciclo de vida do agente/ferramenta e do pipeline do gateway.

### Hooks internos (hooks do Gateway)

- **`agent:bootstrap`**: executa durante a construção de arquivos de bootstrap antes de o prompt de sistema ser finalizado.
  Use isto para adicionar/remover arquivos de contexto de bootstrap.
- **Hooks de comando**: `/new`, `/reset`, `/stop` e outros eventos de comando (veja o documento de Hooks).

Veja [Hooks](/pt-BR/automation/hooks) para configuração e exemplos.

### Hooks de Plugin (ciclo de vida do agente + gateway)

Eles executam dentro do loop do agente ou do pipeline do gateway:

- **`before_model_resolve`**: executa antes da sessão (sem `messages`) para substituir deterministamente provedor/modelo antes da resolução do modelo.
- **`before_prompt_build`**: executa após o carregamento da sessão (com `messages`) para injetar `prependContext`, `systemPrompt`, `prependSystemContext` ou `appendSystemContext` antes do envio do prompt. Use `prependContext` para texto dinâmico por turno e campos de contexto de sistema para orientação estável que deve ficar no espaço do prompt de sistema.
- **`before_agent_start`**: hook legado de compatibilidade que pode executar em qualquer fase; prefira os hooks explícitos acima.
- **`before_agent_reply`**: executa após ações inline e antes da chamada ao LLM, permitindo que um Plugin reivindique o turno e retorne uma resposta sintética ou silencie totalmente o turno.
- **`agent_end`**: inspeciona a lista final de mensagens e metadados de execução após a conclusão.
- **`before_compaction` / `after_compaction`**: observa ou anota ciclos de Compaction.
- **`before_tool_call` / `after_tool_call`**: intercepta parâmetros/resultados de ferramentas.
- **`before_install`**: inspeciona descobertas de varredura integradas e, opcionalmente, bloqueia instalações de Skills ou Plugins.
- **`tool_result_persist`**: transforma sincronamente resultados de ferramentas antes de serem gravados em uma transcrição de sessão pertencente ao OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: hooks de mensagens de entrada + saída.
- **`session_start` / `session_end`**: limites de ciclo de vida da sessão.
- **`gateway_start` / `gateway_stop`**: eventos de ciclo de vida do gateway.

Regras de decisão de hooks para proteções de saída/ferramenta:

- `before_tool_call`: `{ block: true }` é terminal e interrompe manipuladores de prioridade menor.
- `before_tool_call`: `{ block: false }` é um no-op e não limpa um bloqueio anterior.
- `before_install`: `{ block: true }` é terminal e interrompe manipuladores de prioridade menor.
- `before_install`: `{ block: false }` é um no-op e não limpa um bloqueio anterior.
- `message_sending`: `{ cancel: true }` é terminal e interrompe manipuladores de prioridade menor.
- `message_sending`: `{ cancel: false }` é um no-op e não limpa um cancelamento anterior.

Veja [Hooks de Plugin](/pt-BR/plugins/hooks) para a API de hook e detalhes de registro.

Harnesses podem adaptar esses hooks de maneiras diferentes. O harness do servidor de app do Codex mantém
hooks de Plugin do OpenClaw como o contrato de compatibilidade para superfícies espelhadas documentadas,
enquanto hooks nativos do Codex permanecem um mecanismo separado de nível mais baixo do Codex.

## Streaming + respostas parciais

- Deltas de assistente são transmitidos pelo pi-agent-core e emitidos como eventos `assistant`.
- Streaming de blocos pode emitir respostas parciais em `text_end` ou `message_end`.
- Streaming de raciocínio pode ser emitido como um stream separado ou como respostas em bloco.
- Veja [Streaming](/pt-BR/concepts/streaming) para comportamento de fragmentação e resposta em bloco.

## Execução de ferramentas + ferramentas de mensagens

- Eventos de início/atualização/fim de ferramenta são emitidos no stream `tool`.
- Resultados de ferramentas são sanitizados quanto a tamanho e payloads de imagem antes de registrar/emitir.
- Envios por ferramentas de mensagens são rastreados para suprimir confirmações duplicadas do assistente.

## Formatação de respostas + supressão

- Payloads finais são montados a partir de:
  - texto do assistente (e raciocínio opcional)
  - resumos de ferramentas inline (quando verbose + permitido)
  - texto de erro do assistente quando o modelo erra
- O token silencioso exato `NO_REPLY` / `no_reply` é filtrado dos
  payloads de saída.
- Duplicatas de ferramentas de mensagens são removidas da lista final de payloads.
- Se nenhum payload renderizável restar e uma ferramenta tiver errado, uma resposta de erro de ferramenta de fallback é emitida
  (a menos que uma ferramenta de mensagens já tenha enviado uma resposta visível ao usuário).

## Compaction + novas tentativas

- Compaction automática emite eventos de stream `compaction` e pode acionar uma nova tentativa.
- Na nova tentativa, buffers em memória e resumos de ferramentas são redefinidos para evitar saída duplicada.
- Veja [Compaction](/pt-BR/concepts/compaction) para o pipeline de Compaction.

## Streams de eventos (hoje)

- `lifecycle`: emitido por `subscribeEmbeddedPiSession` (e como fallback por `agentCommand`)
- `assistant`: deltas transmitidos pelo pi-agent-core
- `tool`: eventos de ferramenta transmitidos pelo pi-agent-core

## Tratamento de canais de chat

- Deltas de assistente são armazenados em buffer em mensagens `delta` de chat.
- Um `final` de chat é emitido em **fim/erro de ciclo de vida**.

## Timeouts

- Padrão de `agent.wait`: 30s (apenas a espera). O parâmetro `timeoutMs` substitui.
- Runtime do agente: padrão de `agents.defaults.timeoutSeconds` 172800s (48 horas); aplicado no timer de aborto de `runEmbeddedPiAgent`.
- Runtime do Cron: `timeoutSeconds` de turno de agente isolado pertence ao cron. O agendador inicia esse timer quando a execução começa, aborta a execução subjacente no prazo configurado e então executa limpeza limitada antes de registrar o timeout para que uma sessão filha obsoleta não mantenha a faixa travada.
- Diagnósticos de vivacidade da sessão: com diagnósticos habilitados, `diagnostics.stuckSessionWarnMs` classifica sessões longas em `processing` que não têm progresso observado de resposta, ferramenta, status, bloco ou ACP. Execuções incorporadas ativas, chamadas de modelo e chamadas de ferramenta são relatadas como `session.long_running`; trabalho ativo sem progresso recente é relatado como `session.stalled`; `session.stuck` é reservado para escrituração de sessão obsoleta sem trabalho ativo. A escrituração de sessão obsoleta libera imediatamente a faixa de sessão afetada; execuções incorporadas paralisadas só são abortadas e drenadas após `diagnostics.stuckSessionAbortMs` (padrão: pelo menos 10 minutos e 5x o limite de aviso) para que trabalho enfileirado possa retomar sem interromper execuções meramente lentas. A recuperação emite resultados estruturados solicitados/concluídos, e o estado de diagnóstico é marcado como ocioso somente se a mesma geração de processamento ainda estiver atual. Diagnósticos `session.stuck` repetidos aplicam backoff enquanto a sessão permanece inalterada.
- Timeout de ociosidade do modelo: o OpenClaw aborta uma solicitação de modelo quando nenhum chunk de resposta chega antes da janela de ociosidade. `models.providers.<id>.timeoutSeconds` estende esse watchdog de ociosidade para provedores locais/auto-hospedados lentos; caso contrário, o OpenClaw usa `agents.defaults.timeoutSeconds` quando configurado, limitado a 120s por padrão. Execuções acionadas por Cron sem timeout explícito de modelo ou agente desabilitam o watchdog de ociosidade e dependem do timeout externo do cron.
- Timeout de solicitação HTTP do provedor: `models.providers.<id>.timeoutSeconds` se aplica aos fetches HTTP de modelo desse provedor, incluindo conexão, cabeçalhos, corpo, timeout de solicitação do SDK, tratamento total de aborto de fetch protegido e watchdog de ociosidade de stream do modelo. Use isto para provedores locais/auto-hospedados lentos, como Ollama, antes de aumentar o timeout de runtime do agente inteiro.

## Onde as coisas podem terminar cedo

- Timeout do agente (aborto)
- AbortSignal (cancelamento)
- Desconexão do Gateway ou timeout de RPC
- Timeout de `agent.wait` (somente espera, não para o agente)

## Relacionados

- [Ferramentas](/pt-BR/tools) — ferramentas de agente disponíveis
- [Hooks](/pt-BR/automation/hooks) — scripts orientados por eventos acionados por eventos de ciclo de vida do agente
- [Compaction](/pt-BR/concepts/compaction) — como conversas longas são resumidas
- [Aprovações de Exec](/pt-BR/tools/exec-approvals) — gates de aprovação para comandos de shell
- [Thinking](/pt-BR/tools/thinking) — configuração de nível de pensamento/raciocínio
