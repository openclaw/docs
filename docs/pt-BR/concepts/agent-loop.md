---
read_when:
    - Você precisa de um passo a passo exato do loop do agente ou dos eventos do ciclo de vida
    - Você está alterando o enfileiramento de sessões, as gravações de transcrição ou o comportamento do bloqueio de gravação de sessões
summary: Ciclo de vida do loop de agente, fluxos e semântica de espera
title: Ciclo do agente
x-i18n:
    generated_at: "2026-05-06T05:49:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: e040d090e686db47a432c8d6f13c167838825b16e491297422f909aba0add5f0
    source_path: concepts/agent-loop.md
    workflow: 16
---

Um loop agêntico é a execução "real" completa de um agente: entrada → montagem de contexto → inferência do modelo →
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
   - resolve padrões de modelo + thinking/verbose/trace
   - carrega o snapshot de Skills
   - chama `runEmbeddedPiAgent` (runtime do pi-agent-core)
   - emite **fim/erro de ciclo de vida** se o loop incorporado não emitir um
3. `runEmbeddedPiAgent`:
   - serializa execuções por filas por sessão + globais
   - resolve modelo + perfil de autenticação e monta a sessão do pi
   - assina eventos do pi e transmite deltas de assistente/ferramenta
   - aplica timeout -> aborta a execução se excedido
   - para turnos do servidor de app do Codex, aborta um turno aceito que para de produzir progresso do servidor de app antes de um evento terminal
   - retorna payloads + metadados de uso
4. `subscribeEmbeddedPiSession` faz a ponte entre eventos do pi-agent-core e o stream `agent` do OpenClaw:
   - eventos de ferramenta => `stream: "tool"`
   - deltas do assistente => `stream: "assistant"`
   - eventos de ciclo de vida => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` usa `waitForAgentRun`:
   - espera por **fim/erro de ciclo de vida** para `runId`
   - retorna `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Enfileiramento + concorrência

- As execuções são serializadas por chave de sessão (faixa de sessão) e, opcionalmente, por uma faixa global.
- Isso evita corridas de ferramenta/sessão e mantém o histórico da sessão consistente.
- Canais de mensagens podem escolher modos de fila (collect/steer/followup) que alimentam esse sistema de faixas.
  Consulte [Fila de comandos](/pt-BR/concepts/queue).
- Gravações de transcrição também são protegidas por um bloqueio de escrita da sessão no arquivo de sessão. O bloqueio é
  ciente do processo e baseado em arquivo, então captura gravadores que contornam a fila em processo ou vêm de
  outro processo. Gravadores da transcrição da sessão aguardam até `session.writeLock.acquireTimeoutMs`
  antes de relatar a sessão como ocupada; o padrão é `60000` ms.
- Bloqueios de escrita de sessão não são reentrantes por padrão. Se um helper intencionalmente aninhar a aquisição do
  mesmo bloqueio enquanto preserva um único gravador lógico, ele deve optar explicitamente por
  `allowReentrant: true`.

## Preparação da sessão + workspace

- O workspace é resolvido e criado; execuções em sandbox podem redirecionar para uma raiz de workspace de sandbox.
- Skills são carregadas (ou reutilizadas a partir de um snapshot) e injetadas no env e no prompt.
- Arquivos de bootstrap/contexto são resolvidos e injetados no relatório do prompt do sistema.
- Um bloqueio de escrita da sessão é adquirido; `SessionManager` é aberto e preparado antes do streaming. Qualquer
  caminho posterior de reescrita, Compaction ou truncamento da transcrição deve obter o mesmo bloqueio antes de abrir ou
  modificar o arquivo de transcrição.

## Montagem do prompt + prompt do sistema

- O prompt do sistema é criado a partir do prompt base do OpenClaw, prompt de Skills, contexto de bootstrap e substituições por execução.
- Limites específicos do modelo e tokens de reserva para Compaction são aplicados.
- Consulte [Prompt do sistema](/pt-BR/concepts/system-prompt) para saber o que o modelo vê.

## Pontos de hook (onde você pode interceptar)

O OpenClaw tem dois sistemas de hook:

- **Hooks internos** (hooks do Gateway): scripts orientados a eventos para comandos e eventos de ciclo de vida.
- **Hooks de Plugin**: pontos de extensão dentro do ciclo de vida de agente/ferramenta e do pipeline do gateway.

### Hooks internos (hooks do Gateway)

- **`agent:bootstrap`**: executado durante a construção dos arquivos de bootstrap antes de o prompt do sistema ser finalizado.
  Use isso para adicionar/remover arquivos de contexto de bootstrap.
- **Hooks de comando**: `/new`, `/reset`, `/stop` e outros eventos de comando (consulte a documentação de Hooks).

Consulte [Hooks](/pt-BR/automation/hooks) para configuração e exemplos.

### Hooks de Plugin (ciclo de vida do agente + gateway)

Eles são executados dentro do loop do agente ou do pipeline do gateway:

- **`before_model_resolve`**: executado antes da sessão (sem `messages`) para substituir deterministicamente provedor/modelo antes da resolução do modelo.
- **`before_prompt_build`**: executado depois do carregamento da sessão (com `messages`) para injetar `prependContext`, `systemPrompt`, `prependSystemContext` ou `appendSystemContext` antes do envio do prompt. Use `prependContext` para texto dinâmico por turno e campos de contexto do sistema para orientação estável que deve ficar no espaço do prompt do sistema.
- **`before_agent_start`**: hook de compatibilidade legado que pode ser executado em qualquer fase; prefira os hooks explícitos acima.
- **`before_agent_reply`**: executado depois de ações inline e antes da chamada ao LLM, permitindo que um plugin reivindique o turno e retorne uma resposta sintética ou silencie o turno completamente.
- **`agent_end`**: inspeciona a lista final de mensagens e metadados da execução após a conclusão.
- **`before_compaction` / `after_compaction`**: observa ou anota ciclos de Compaction.
- **`before_tool_call` / `after_tool_call`**: intercepta parâmetros/resultados de ferramenta.
- **`before_install`**: inspeciona achados de varredura integrada e, opcionalmente, bloqueia instalações de skill ou plugin.
- **`tool_result_persist`**: transforma de forma síncrona resultados de ferramentas antes que sejam escritos em uma transcrição de sessão de propriedade do OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: hooks de mensagens de entrada + saída.
- **`session_start` / `session_end`**: limites do ciclo de vida da sessão.
- **`gateway_start` / `gateway_stop`**: eventos de ciclo de vida do gateway.

Regras de decisão de hook para proteções de saída/ferramenta:

- `before_tool_call`: `{ block: true }` é terminal e interrompe handlers de prioridade mais baixa.
- `before_tool_call`: `{ block: false }` é um no-op e não limpa um bloqueio anterior.
- `before_install`: `{ block: true }` é terminal e interrompe handlers de prioridade mais baixa.
- `before_install`: `{ block: false }` é um no-op e não limpa um bloqueio anterior.
- `message_sending`: `{ cancel: true }` é terminal e interrompe handlers de prioridade mais baixa.
- `message_sending`: `{ cancel: false }` é um no-op e não limpa um cancelamento anterior.

Consulte [Hooks de Plugin](/pt-BR/plugins/hooks) para detalhes da API de hooks e do registro.

Harnesses podem adaptar esses hooks de maneiras diferentes. O harness do servidor de app do Codex mantém
os hooks de plugin do OpenClaw como contrato de compatibilidade para superfícies espelhadas documentadas,
enquanto hooks nativos do Codex permanecem um mecanismo Codex separado de nível mais baixo.

## Streaming + respostas parciais

- Deltas do assistente são transmitidos do pi-agent-core e emitidos como eventos `assistant`.
- Streaming em blocos pode emitir respostas parciais em `text_end` ou `message_end`.
- Streaming de raciocínio pode ser emitido como um stream separado ou como respostas em bloco.
- Consulte [Streaming](/pt-BR/concepts/streaming) para comportamento de fragmentação e resposta em bloco.

## Execução de ferramentas + ferramentas de mensagens

- Eventos de início/atualização/fim de ferramenta são emitidos no stream `tool`.
- Resultados de ferramentas são sanitizados quanto a tamanho e payloads de imagem antes de serem registrados/emitidos.
- Envios por ferramentas de mensagens são rastreados para suprimir confirmações duplicadas do assistente.

## Modelagem de resposta + supressão

- Payloads finais são montados a partir de:
  - texto do assistente (e raciocínio opcional)
  - resumos inline de ferramentas (quando verbose + permitido)
  - texto de erro do assistente quando o modelo erra
- O token silencioso exato `NO_REPLY` / `no_reply` é filtrado dos payloads
  de saída.
- Duplicatas de ferramentas de mensagens são removidas da lista final de payloads.
- Se nenhum payload renderizável restar e uma ferramenta tiver erro, uma resposta alternativa de erro de ferramenta é emitida
  (a menos que uma ferramenta de mensagens já tenha enviado uma resposta visível ao usuário).

## Compaction + novas tentativas

- Auto-Compaction emite eventos de stream `compaction` e pode acionar uma nova tentativa.
- Na nova tentativa, buffers em memória e resumos de ferramentas são redefinidos para evitar saída duplicada.
- Consulte [Compaction](/pt-BR/concepts/compaction) para o pipeline de Compaction.

## Streams de eventos (hoje)

- `lifecycle`: emitido por `subscribeEmbeddedPiSession` (e como fallback por `agentCommand`)
- `assistant`: deltas transmitidos do pi-agent-core
- `tool`: eventos de ferramenta transmitidos do pi-agent-core

## Tratamento de canal de chat

- Deltas do assistente são armazenados em buffer como mensagens `delta` de chat.
- Um `final` de chat é emitido em **fim/erro de ciclo de vida**.

## Timeouts

- Padrão de `agent.wait`: 30s (apenas a espera). O parâmetro `timeoutMs` substitui.
- Runtime do agente: `agents.defaults.timeoutSeconds` padrão 172800s (48 horas); aplicado no temporizador de aborto de `runEmbeddedPiAgent`.
- Runtime de Cron: o `timeoutSeconds` de turno de agente isolado pertence ao cron. O agendador inicia esse temporizador quando a execução começa, aborta a execução subjacente no prazo configurado e então executa limpeza limitada antes de registrar o timeout para que uma sessão filha obsoleta não mantenha a faixa travada.
- Diagnósticos de atividade da sessão: com diagnósticos ativados, `diagnostics.stuckSessionWarnMs` classifica sessões `processing` longas que não têm resposta, ferramenta, status, bloco ou progresso ACP observado. Execuções incorporadas ativas, chamadas de modelo e chamadas de ferramenta são relatadas como `session.long_running`; trabalho ativo sem progresso recente é relatado como `session.stalled`; `session.stuck` é reservado para escrituração obsoleta de sessão sem trabalho ativo. A escrituração obsoleta da sessão libera a faixa da sessão afetada imediatamente; execuções incorporadas paradas são abortadas e drenadas somente depois de `diagnostics.stuckSessionAbortMs` (padrão: pelo menos 10 minutos e 5x o limite de aviso) para que o trabalho enfileirado possa continuar sem interromper execuções meramente lentas. A recuperação emite resultados estruturados solicitados/concluídos, e o estado de diagnóstico é marcado como ocioso somente se a mesma geração de processamento ainda for atual. Diagnósticos `session.stuck` repetidos recuam enquanto a sessão permanece inalterada.
- Timeout de inatividade do modelo: o OpenClaw aborta uma requisição de modelo quando nenhum chunk de resposta chega antes da janela de inatividade. `models.providers.<id>.timeoutSeconds` estende esse watchdog de inatividade para provedores locais/auto-hospedados lentos; caso contrário, o OpenClaw usa `agents.defaults.timeoutSeconds` quando configurado, limitado a 120s por padrão. Execuções acionadas por Cron sem timeout explícito de modelo ou agente desativam o watchdog de inatividade e dependem do timeout externo do cron.
- Timeout de requisição HTTP do provedor: `models.providers.<id>.timeoutSeconds` se aplica aos fetches HTTP de modelo desse provedor, incluindo conexão, cabeçalhos, corpo, timeout de requisição do SDK, tratamento total de aborto de guarded-fetch e watchdog de inatividade de stream do modelo. Use isso para provedores locais/auto-hospedados lentos, como Ollama, antes de aumentar o timeout de runtime de todo o agente.

## Onde as coisas podem terminar cedo

- Timeout do agente (aborto)
- AbortSignal (cancelamento)
- Desconexão do Gateway ou timeout de RPC
- Timeout de `agent.wait` (apenas espera, não interrompe o agente)

## Relacionados

- [Ferramentas](/pt-BR/tools) — ferramentas de agente disponíveis
- [Hooks](/pt-BR/automation/hooks) — scripts orientados a eventos acionados por eventos de ciclo de vida do agente
- [Compaction](/pt-BR/concepts/compaction) — como conversas longas são resumidas
- [Aprovações de Exec](/pt-BR/tools/exec-approvals) — portões de aprovação para comandos shell
- [Thinking](/pt-BR/tools/thinking) — configuração de nível de thinking/raciocínio
