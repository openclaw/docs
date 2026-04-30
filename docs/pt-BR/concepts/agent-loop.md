---
read_when:
    - Você precisa de um passo a passo exato do loop do agente ou dos eventos do ciclo de vida
    - Você está alterando o enfileiramento de sessões, as gravações de transcrições ou o comportamento do bloqueio de gravação de sessão
summary: Ciclo de vida do loop do agente, fluxos e semântica de espera
title: Ciclo do agente
x-i18n:
    generated_at: "2026-04-30T18:38:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5466893253e1f82482284ff82db56f4c3fca018bf12e4114fad76d37cad954df
    source_path: concepts/agent-loop.md
    workflow: 16
---

Um loop agentivo é a execução “real” completa de um agente: ingestão → montagem de contexto → inferência do modelo →
execução de ferramentas → respostas em streaming → persistência. É o caminho autoritativo que transforma uma mensagem
em ações e uma resposta final, mantendo o estado da sessão consistente.

No OpenClaw, um loop é uma execução única e serializada por sessão que emite eventos de ciclo de vida e de stream
enquanto o modelo pensa, chama ferramentas e transmite a saída em streaming. Este documento explica como esse loop autêntico é
conectado de ponta a ponta.

## Pontos de entrada

- RPC do Gateway: `agent` e `agent.wait`.
- CLI: comando `agent`.

## Como funciona (visão geral)

1. O RPC `agent` valida parâmetros, resolve a sessão (sessionKey/sessionId), persiste metadados da sessão e retorna `{ runId, acceptedAt }` imediatamente.
2. `agentCommand` executa o agente:
   - resolve padrões de modelo + thinking/verbose/trace
   - carrega snapshot de Skills
   - chama `runEmbeddedPiAgent` (runtime do pi-agent-core)
   - emite **fim/erro de ciclo de vida** se o loop embutido não emitir um
3. `runEmbeddedPiAgent`:
   - serializa execuções por meio de filas por sessão + globais
   - resolve modelo + perfil de autenticação e cria a sessão pi
   - assina eventos do pi e transmite deltas de assistente/ferramenta em streaming
   - impõe timeout -> aborta a execução se excedido
   - para turnos do servidor de aplicativo Codex, aborta um turno aceito que para de produzir progresso do servidor de aplicativo antes de um evento terminal
   - retorna payloads + metadados de uso
4. `subscribeEmbeddedPiSession` faz a ponte de eventos do pi-agent-core para o stream `agent` do OpenClaw:
   - eventos de ferramenta => `stream: "tool"`
   - deltas de assistente => `stream: "assistant"`
   - eventos de ciclo de vida => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` usa `waitForAgentRun`:
   - aguarda **fim/erro de ciclo de vida** para `runId`
   - retorna `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Enfileiramento + concorrência

- Execuções são serializadas por chave de sessão (faixa da sessão) e opcionalmente por uma faixa global.
- Isso evita disputas de ferramenta/sessão e mantém o histórico da sessão consistente.
- Canais de mensagens podem escolher modos de fila (collect/steer/followup) que alimentam esse sistema de faixas.
  Consulte [Fila de comandos](/pt-BR/concepts/queue).
- Escritas de transcrição também são protegidas por um bloqueio de escrita de sessão no arquivo da sessão. O bloqueio é
  ciente de processo e baseado em arquivo, então captura escritores que contornam a fila em processo ou vêm de
  outro processo.
- Bloqueios de escrita de sessão não são reentrantes por padrão. Se um auxiliar intencionalmente aninhar a aquisição do
  mesmo bloqueio preservando um escritor lógico, ele deve optar explicitamente por isso com
  `allowReentrant: true`.

## Preparação de sessão + workspace

- O workspace é resolvido e criado; execuções em sandbox podem redirecionar para uma raiz de workspace de sandbox.
- Skills são carregadas (ou reutilizadas de um snapshot) e injetadas no ambiente e no prompt.
- Arquivos de bootstrap/contexto são resolvidos e injetados no relatório de prompt de sistema.
- Um bloqueio de escrita de sessão é adquirido; `SessionManager` é aberto e preparado antes do streaming. Qualquer
  caminho posterior de reescrita de transcrição, Compaction ou truncamento deve obter o mesmo bloqueio antes de abrir ou
  alterar o arquivo de transcrição.

## Montagem do prompt + prompt de sistema

- O prompt de sistema é criado a partir do prompt base do OpenClaw, do prompt de Skills, do contexto de bootstrap e das substituições por execução.
- Limites específicos do modelo e tokens reservados de Compaction são impostos.
- Consulte [Prompt de sistema](/pt-BR/concepts/system-prompt) para o que o modelo vê.

## Pontos de hook (onde você pode interceptar)

O OpenClaw tem dois sistemas de hook:

- **Hooks internos** (hooks do Gateway): scripts orientados por eventos para comandos e eventos de ciclo de vida.
- **Hooks de Plugin**: pontos de extensão dentro do ciclo de vida de agente/ferramenta e do pipeline do Gateway.

### Hooks internos (hooks do Gateway)

- **`agent:bootstrap`**: executa durante a criação de arquivos de bootstrap antes de o prompt de sistema ser finalizado.
  Use isto para adicionar/remover arquivos de contexto de bootstrap.
- **Hooks de comando**: `/new`, `/reset`, `/stop` e outros eventos de comando (consulte o documento Hooks).

Consulte [Hooks](/pt-BR/automation/hooks) para configuração e exemplos.

### Hooks de Plugin (ciclo de vida de agente + Gateway)

Eles são executados dentro do loop do agente ou do pipeline do Gateway:

- **`before_model_resolve`**: executa antes da sessão (sem `messages`) para substituir deterministicamente provedor/modelo antes da resolução do modelo.
- **`before_prompt_build`**: executa após o carregamento da sessão (com `messages`) para injetar `prependContext`, `systemPrompt`, `prependSystemContext` ou `appendSystemContext` antes do envio do prompt. Use `prependContext` para texto dinâmico por turno e campos de contexto de sistema para orientações estáveis que devem ficar no espaço do prompt de sistema.
- **`before_agent_start`**: hook legado de compatibilidade que pode executar em qualquer fase; prefira os hooks explícitos acima.
- **`before_agent_reply`**: executa após ações inline e antes da chamada ao LLM, permitindo que um Plugin reivindique o turno e retorne uma resposta sintética ou silencie o turno completamente.
- **`agent_end`**: inspeciona a lista final de mensagens e os metadados da execução após a conclusão.
- **`before_compaction` / `after_compaction`**: observa ou anota ciclos de Compaction.
- **`before_tool_call` / `after_tool_call`**: intercepta parâmetros/resultados de ferramenta.
- **`before_install`**: inspeciona achados de varredura integrados e opcionalmente bloqueia instalações de skill ou Plugin.
- **`tool_result_persist`**: transforma de forma síncrona os resultados de ferramentas antes que sejam gravados em uma transcrição de sessão pertencente ao OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: hooks de mensagens de entrada + saída.
- **`session_start` / `session_end`**: limites do ciclo de vida da sessão.
- **`gateway_start` / `gateway_stop`**: eventos de ciclo de vida do Gateway.

Regras de decisão de hooks para guardas de saída/ferramenta:

- `before_tool_call`: `{ block: true }` é terminal e interrompe manipuladores de menor prioridade.
- `before_tool_call`: `{ block: false }` é uma no-op e não limpa um bloqueio anterior.
- `before_install`: `{ block: true }` é terminal e interrompe manipuladores de menor prioridade.
- `before_install`: `{ block: false }` é uma no-op e não limpa um bloqueio anterior.
- `message_sending`: `{ cancel: true }` é terminal e interrompe manipuladores de menor prioridade.
- `message_sending`: `{ cancel: false }` é uma no-op e não limpa um cancelamento anterior.

Consulte [Hooks de Plugin](/pt-BR/plugins/hooks) para a API de hooks e detalhes de registro.

Harnesses podem adaptar esses hooks de forma diferente. O harness do servidor de aplicativo Codex mantém
hooks de Plugin do OpenClaw como o contrato de compatibilidade para superfícies espelhadas documentadas,
enquanto hooks nativos do Codex continuam sendo um mecanismo Codex separado de nível mais baixo.

## Streaming + respostas parciais

- Deltas de assistente são transmitidos em streaming pelo pi-agent-core e emitidos como eventos `assistant`.
- Streaming de blocos pode emitir respostas parciais em `text_end` ou `message_end`.
- Streaming de raciocínio pode ser emitido como um stream separado ou como respostas em bloco.
- Consulte [Streaming](/pt-BR/concepts/streaming) para o comportamento de divisão em chunks e resposta em bloco.

## Execução de ferramentas + ferramentas de mensagens

- Eventos de início/atualização/fim de ferramenta são emitidos no stream `tool`.
- Resultados de ferramentas são sanitizados quanto a tamanho e payloads de imagem antes de registrar/emitir.
- Envios de ferramentas de mensagens são rastreados para suprimir confirmações duplicadas do assistente.

## Formatação de resposta + supressão

- Payloads finais são montados a partir de:
  - texto do assistente (e raciocínio opcional)
  - resumos inline de ferramentas (quando verbose + permitido)
  - texto de erro do assistente quando o modelo apresenta erro
- O token silencioso exato `NO_REPLY` / `no_reply` é filtrado dos payloads
  de saída.
- Duplicatas de ferramentas de mensagens são removidas da lista final de payloads.
- Se nenhum payload renderizável restar e uma ferramenta tiver erro, uma resposta fallback de erro de ferramenta é emitida
  (a menos que uma ferramenta de mensagens já tenha enviado uma resposta visível ao usuário).

## Compaction + novas tentativas

- A Compaction automática emite eventos de stream `compaction` e pode disparar uma nova tentativa.
- Na nova tentativa, buffers em memória e resumos de ferramentas são redefinidos para evitar saída duplicada.
- Consulte [Compaction](/pt-BR/concepts/compaction) para o pipeline de Compaction.

## Streams de eventos (hoje)

- `lifecycle`: emitido por `subscribeEmbeddedPiSession` (e como fallback por `agentCommand`)
- `assistant`: deltas transmitidos em streaming pelo pi-agent-core
- `tool`: eventos de ferramenta transmitidos em streaming pelo pi-agent-core

## Tratamento de canal de chat

- Deltas de assistente são armazenados em buffer em mensagens `delta` de chat.
- Um `final` de chat é emitido em **fim/erro de ciclo de vida**.

## Timeouts

- Padrão de `agent.wait`: 30s (apenas a espera). O parâmetro `timeoutMs` substitui.
- Runtime do agente: padrão de `agents.defaults.timeoutSeconds` é 172800s (48 horas); imposto no temporizador de aborto de `runEmbeddedPiAgent`.
- Runtime do Cron: o `timeoutSeconds` do turno de agente isolado pertence ao cron. O agendador inicia esse temporizador quando a execução começa, aborta a execução subjacente no prazo configurado e então executa limpeza limitada antes de registrar o timeout para que uma sessão filha obsoleta não mantenha a faixa travada.
- Recuperação de sessão travada: com diagnósticos habilitados, `diagnostics.stuckSessionWarnMs` detecta sessões longas em `processing`. Execuções embutidas ativas, operações de resposta ativas e tarefas ativas de faixa de sessão permanecem apenas como aviso por padrão; se os diagnósticos não mostrarem trabalho ativo para a sessão, o watchdog libera a faixa de sessão afetada para que o trabalho de inicialização enfileirado possa escoar.
- Timeout de ociosidade do modelo: o OpenClaw aborta uma solicitação de modelo quando nenhum chunk de resposta chega antes da janela de ociosidade. `models.providers.<id>.timeoutSeconds` estende esse watchdog de ociosidade para provedores locais/auto-hospedados lentos; caso contrário, o OpenClaw usa `agents.defaults.timeoutSeconds` quando configurado, limitado a 120s por padrão. Execuções disparadas por Cron sem timeout explícito de modelo ou agente desabilitam o watchdog de ociosidade e dependem do timeout externo do cron.
- Timeout de requisição HTTP do provedor: `models.providers.<id>.timeoutSeconds` se aplica às buscas HTTP de modelo desse provedor, incluindo conexão, headers, body, timeout de requisição do SDK, tratamento de aborto total de guarded-fetch e watchdog de ociosidade do stream do modelo. Use isto para provedores locais/auto-hospedados lentos, como Ollama, antes de aumentar o timeout de runtime do agente inteiro.

## Onde as coisas podem terminar cedo

- Timeout do agente (aborto)
- AbortSignal (cancelamento)
- Desconexão do Gateway ou timeout de RPC
- Timeout de `agent.wait` (somente espera, não interrompe o agente)

## Relacionados

- [Ferramentas](/pt-BR/tools) — ferramentas de agente disponíveis
- [Hooks](/pt-BR/automation/hooks) — scripts orientados por eventos disparados por eventos de ciclo de vida do agente
- [Compaction](/pt-BR/concepts/compaction) — como conversas longas são resumidas
- [Aprovações de Exec](/pt-BR/tools/exec-approvals) — portões de aprovação para comandos shell
- [Thinking](/pt-BR/tools/thinking) — configuração de nível de pensamento/raciocínio
