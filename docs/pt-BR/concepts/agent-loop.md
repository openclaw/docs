---
read_when:
    - Você precisa de um passo a passo exato do loop do agente ou dos eventos de ciclo de vida
    - Você está alterando o enfileiramento de sessões, as gravações de transcrições ou o comportamento do bloqueio de escrita da sessão
summary: Ciclo de vida do loop do agente, fluxos e semântica de espera
title: Loop de agente
x-i18n:
    generated_at: "2026-06-27T17:23:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ccfdf4a3ea6b9c946064f051e32c88cefbcb707c7426abe85b04294030eedaf
    source_path: concepts/agent-loop.md
    workflow: 16
---

Um loop agêntico é a execução "real" completa de um agente: entrada → montagem de contexto → inferência do modelo →
execução de ferramentas → respostas em streaming → persistência. É o caminho autoritativo que transforma uma mensagem
em ações e uma resposta final, mantendo o estado da sessão consistente.

No OpenClaw, um loop é uma execução única e serializada por sessão que emite eventos de ciclo de vida e de stream
enquanto o modelo pensa, chama ferramentas e transmite saída. Este documento explica como esse loop autêntico é
conectado de ponta a ponta.

## Pontos de entrada

- RPC do Gateway: `agent` e `agent.wait`.
- CLI: comando `agent`.

## Como funciona (visão geral)

1. O RPC `agent` valida parâmetros, resolve a sessão (sessionKey/sessionId), persiste metadados da sessão e retorna `{ runId, acceptedAt }` imediatamente.
2. `agentCommand` executa o agente:
   - resolve o modelo + padrões de raciocínio/verbosidade/rastreamento
   - carrega o snapshot de Skills
   - chama `runEmbeddedAgent` (runtime do agente OpenClaw)
   - emite **fim/erro de ciclo de vida** se o loop embutido não emitir um
3. `runEmbeddedAgent`:
   - serializa execuções por filas por sessão + globais
   - resolve o modelo + perfil de autenticação e constrói a sessão OpenClaw
   - assina eventos de runtime e transmite deltas do assistente/ferramenta
   - impõe timeout -> aborta a execução se excedido
   - para turnos do servidor de app do Codex, aborta um turno aceito que para de produzir progresso do servidor de app antes de um evento terminal
   - retorna payloads + metadados de uso
4. `subscribeEmbeddedAgentSession` conecta eventos de runtime do agente ao stream `agent` do OpenClaw:
   - eventos de ferramenta => `stream: "tool"`
   - deltas do assistente => `stream: "assistant"`
   - eventos de ciclo de vida => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` usa `waitForAgentRun`:
   - aguarda **fim/erro de ciclo de vida** para `runId`
   - retorna `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Enfileiramento + concorrência

- As execuções são serializadas por chave de sessão (faixa de sessão) e, opcionalmente, por uma faixa global.
- Isso evita disputas de ferramenta/sessão e mantém o histórico da sessão consistente.
- Canais de mensagem podem escolher modos de fila (direcionar/acompanhamento/coletar/interromper) que alimentam esse sistema de faixas.
  Consulte [Fila de comandos](/pt-BR/concepts/queue).
- Gravações de transcrição também são protegidas por um bloqueio de gravação de sessão no arquivo da sessão. O bloqueio é
  ciente de processo e baseado em arquivo, então captura gravadores que contornam a fila em processo ou vêm de
  outro processo. Gravadores de transcrição de sessão aguardam até `session.writeLock.acquireTimeoutMs`
  antes de relatar a sessão como ocupada; o padrão é `60000` ms.
- Bloqueios de gravação de sessão não são reentrantes por padrão. Se um helper intencionalmente aninhar a aquisição do
  mesmo bloqueio preservando um gravador lógico, ele deve optar explicitamente por
  `allowReentrant: true`.

## Preparação de sessão + workspace

- O workspace é resolvido e criado; execuções em sandbox podem redirecionar para uma raiz de workspace de sandbox.
- Skills são carregadas (ou reutilizadas a partir de um snapshot) e injetadas no env e no prompt.
- Arquivos de bootstrap/contexto são resolvidos e injetados no relatório do prompt do sistema.
- Um bloqueio de gravação de sessão é adquirido; `SessionManager` é aberto e preparado antes do streaming. Qualquer
  caminho posterior de reescrita, Compaction ou truncamento de transcrição deve obter o mesmo bloqueio antes de abrir ou
  modificar o arquivo de transcrição.

## Montagem do prompt + prompt do sistema

- O prompt do sistema é construído a partir do prompt base do OpenClaw, prompt de Skills, contexto de bootstrap e substituições por execução.
- Limites específicos do modelo e tokens de reserva de Compaction são aplicados.
- Consulte [Prompt do sistema](/pt-BR/concepts/system-prompt) para ver o que o modelo enxerga.

## Pontos de hook (onde você pode interceptar)

O OpenClaw tem dois sistemas de hooks:

- **Hooks internos** (hooks do Gateway): scripts orientados por eventos para comandos e eventos de ciclo de vida.
- **Hooks de Plugin**: pontos de extensão dentro do ciclo de vida do agente/ferramenta e do pipeline do Gateway.

### Hooks internos (hooks do Gateway)

- **`agent:bootstrap`**: executa durante a construção de arquivos de bootstrap antes que o prompt do sistema seja finalizado.
  Use isso para adicionar/remover arquivos de contexto de bootstrap.
- **Hooks de comando**: `/new`, `/reset`, `/stop` e outros eventos de comando (consulte a documentação de Hooks).

Consulte [Hooks](/pt-BR/automation/hooks) para configuração e exemplos.

### Hooks de Plugin (ciclo de vida do agente + gateway)

Eles executam dentro do loop do agente ou do pipeline do gateway:

- **`before_model_resolve`**: executa antes da sessão (sem `messages`) para substituir deterministicamente provedor/modelo antes da resolução do modelo.
- **`before_prompt_build`**: executa depois do carregamento da sessão (com `messages`) para injetar `prependContext`, `systemPrompt`, `prependSystemContext` ou `appendSystemContext` antes do envio do prompt. Use `prependContext` para texto dinâmico por turno e campos de contexto do sistema para orientações estáveis que devem ficar no espaço do prompt do sistema.
- **`before_agent_start`**: hook de compatibilidade legado que pode executar em qualquer fase; prefira os hooks explícitos acima.
- **`before_agent_reply`**: executa depois de ações inline e antes da chamada ao LLM, permitindo que um plugin reivindique o turno e retorne uma resposta sintética ou silencie o turno por completo.
- **`agent_end`**: inspeciona a lista final de mensagens e metadados da execução após a conclusão.
- **`before_compaction` / `after_compaction`**: observa ou anota ciclos de Compaction.
- **`before_tool_call` / `after_tool_call`**: intercepta parâmetros/resultados de ferramenta.
- **`before_install`**: inspeciona material preparado de instalação de Skill ou Plugin depois que a política de instalação do operador executa, quando hooks de Plugin são carregados no processo OpenClaw atual.
- **`tool_result_persist`**: transforma sincronamente resultados de ferramenta antes que sejam gravados em uma transcrição de sessão pertencente ao OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: hooks de mensagens recebidas + enviadas.
- **`session_start` / `session_end`**: limites do ciclo de vida da sessão.
- **`gateway_start` / `gateway_stop`**: eventos de ciclo de vida do gateway.

Regras de decisão de hooks para proteções de saída/ferramenta:

- `before_tool_call`: `{ block: true }` é terminal e interrompe handlers de prioridade mais baixa.
- `before_tool_call`: `{ block: false }` é um no-op e não limpa um bloqueio anterior.
- `before_install`: `{ block: true }` é terminal e interrompe handlers de prioridade mais baixa.
- `before_install`: `{ block: false }` é um no-op e não limpa um bloqueio anterior.
- Use `security.installPolicy`, não `before_install`, para decisões de permitir/bloquear instalação pertencentes ao operador que devem cobrir caminhos de instalação e atualização da CLI.
- `message_sending`: `{ cancel: true }` é terminal e interrompe handlers de prioridade mais baixa.
- `message_sending`: `{ cancel: false }` é um no-op e não limpa um cancelamento anterior.

Consulte [Hooks de Plugin](/pt-BR/plugins/hooks) para a API de hooks e detalhes de registro.

Harnesses podem adaptar esses hooks de forma diferente. O harness do servidor de app do Codex mantém
hooks de Plugin do OpenClaw como o contrato de compatibilidade para superfícies espelhadas documentadas,
enquanto hooks nativos do Codex continuam sendo um mecanismo Codex separado de nível mais baixo.

## Streaming + respostas parciais

- Deltas do assistente são transmitidos do runtime do agente e emitidos como eventos `assistant`.
- Streaming de blocos pode emitir respostas parciais em `text_end` ou `message_end`.
- Streaming de raciocínio pode ser emitido como um stream separado ou como respostas em bloco.
- Consulte [Streaming](/pt-BR/concepts/streaming) para comportamento de divisão em chunks e respostas em bloco.

## Execução de ferramentas + ferramentas de mensagem

- Eventos de início/atualização/fim de ferramenta são emitidos no stream `tool`.
- Resultados de ferramenta são sanitizados quanto a tamanho e payloads de imagem antes de registrar/emitir.
- Envios de ferramentas de mensagem são rastreados para suprimir confirmações duplicadas do assistente.

## Modelagem de resposta + supressão

- Payloads finais são montados a partir de:
  - texto do assistente (e raciocínio opcional)
  - resumos inline de ferramenta (quando verbose + permitido)
  - texto de erro do assistente quando o modelo apresenta erro
- O token silencioso exato `NO_REPLY` / `no_reply` é filtrado dos payloads
  de saída.
- Duplicatas de ferramentas de mensagem são removidas da lista final de payloads.
- Se nenhum payload renderizável restar e uma ferramenta tiver erro, uma resposta substituta de erro de ferramenta é emitida
  (a menos que uma ferramenta de mensagem já tenha enviado uma resposta visível ao usuário).

## Compaction + novas tentativas

- A Compaction automática emite eventos de stream `compaction` e pode acionar uma nova tentativa.
- Na nova tentativa, buffers em memória e resumos de ferramenta são redefinidos para evitar saída duplicada.
- Consulte [Compaction](/pt-BR/concepts/compaction) para o pipeline de Compaction.

## Streams de eventos (hoje)

- `lifecycle`: emitido por `subscribeEmbeddedAgentSession` (e como fallback por `agentCommand`)
- `assistant`: deltas transmitidos do runtime do agente
- `tool`: eventos de ferramenta transmitidos do runtime do agente

## Tratamento de canal de chat

- Deltas do assistente são armazenados em buffer em mensagens `delta` de chat.
- Um `final` de chat é emitido no **fim/erro de ciclo de vida**.

## Timeouts

- Padrão de `agent.wait`: 30s (apenas a espera). O parâmetro `timeoutMs` substitui.
- Runtime do agente: padrão de `agents.defaults.timeoutSeconds` de 172800s (48 horas); aplicado no temporizador de aborto de `runEmbeddedAgent`.
- Runtime do Cron: o `timeoutSeconds` isolado do turno do agente pertence ao cron. O agendador inicia esse temporizador quando a execução começa, aborta a execução subjacente no prazo configurado e então executa uma limpeza limitada antes de registrar o timeout, para que uma sessão filha obsoleta não mantenha a faixa travada.
- Diagnósticos de vivacidade de sessão: com diagnósticos habilitados, `diagnostics.stuckSessionWarnMs` classifica sessões longas em `processing` que não têm resposta, ferramenta, status, bloco ou progresso de ACP observado. Execuções embutidas ativas, chamadas de modelo e chamadas de ferramenta são relatadas como `session.long_running`; chamadas de modelo silenciosas pertencentes a um dono também permanecem `session.long_running` até `diagnostics.stuckSessionAbortMs`, para que provedores lentos ou sem streaming não sejam relatados como travados cedo demais. Trabalho ativo sem progresso recente é relatado como `session.stalled`; chamadas de modelo pertencentes a um dono mudam para `session.stalled` no limiar de aborto ou depois dele, e atividade obsoleta de modelo/ferramenta sem dono não é ocultada como execução longa. `session.stuck` é reservado para contabilidade recuperável de sessão obsoleta, incluindo sessões enfileiradas ociosas com atividade obsoleta de modelo/ferramenta sem dono. A contabilidade de sessão obsoleta libera a faixa de sessão afetada imediatamente depois que os gates de recuperação passam; execuções embutidas travadas são drenadas por aborto somente depois de `diagnostics.stuckSessionAbortMs` (padrão: pelo menos 5 minutos e 3x o limiar de aviso), para que trabalho enfileirado possa retomar sem interromper execuções meramente lentas. A recuperação emite resultados estruturados solicitados/concluídos, e o estado diagnóstico é marcado como ocioso somente se a mesma geração de processamento ainda estiver atual. Diagnósticos `session.stuck` repetidos aplicam backoff enquanto a sessão permanece inalterada.
- Timeout ocioso do modelo: o OpenClaw aborta uma solicitação de modelo quando nenhum chunk de resposta chega antes da janela ociosa. `models.providers.<id>.timeoutSeconds` estende esse watchdog ocioso para provedores locais/auto-hospedados lentos, mas ainda é limitado por qualquer `agents.defaults.timeoutSeconds` inferior ou timeout específico da execução, porque eles controlam toda a execução do agente. Caso contrário, o OpenClaw usa `agents.defaults.timeoutSeconds` quando configurado, limitado a 120s por padrão. Execuções de modelo em nuvem acionadas por Cron sem timeout explícito de modelo ou agente usam o mesmo watchdog ocioso padrão; com um timeout explícito de execução do Cron, travamentos de stream de modelo em nuvem são limitados a 60s para que fallbacks de modelo configurados possam executar antes do prazo externo do Cron. Execuções de modelo local ou auto-hospedado acionadas por Cron desabilitam o watchdog implícito, a menos que um timeout explícito esteja configurado, e timeouts explícitos de execução do Cron permanecem como a janela ociosa para provedores locais/auto-hospedados, portanto provedores locais lentos devem definir `models.providers.<id>.timeoutSeconds`.
- Timeout de solicitação HTTP do provedor: `models.providers.<id>.timeoutSeconds` se aplica às buscas HTTP de modelo desse provedor, incluindo conexão, cabeçalhos, corpo, timeout de solicitação do SDK, tratamento de aborto total de fetch protegido e watchdog de ociosidade de stream de modelo. Use isso para provedores locais/auto-hospedados lentos, como Ollama, antes de aumentar o timeout de todo o runtime do agente, e mantenha o timeout do agente/runtime pelo menos tão alto quando a solicitação do modelo precisar executar por mais tempo.

## Onde as coisas podem terminar cedo

- Tempo limite do agente (interromper)
- AbortSignal (cancelar)
- Desconexão do Gateway ou tempo limite de RPC
- Tempo limite de `agent.wait` (somente espera, não interrompe o agente)

## Relacionados

- [Ferramentas](/pt-BR/tools) — ferramentas de agente disponíveis
- [Hooks](/pt-BR/automation/hooks) — scripts orientados a eventos acionados por eventos do ciclo de vida do agente
- [Compaction](/pt-BR/concepts/compaction) — como conversas longas são resumidas
- [Aprovações de exec](/pt-BR/tools/exec-approvals) — barreiras de aprovação para comandos shell
- [Thinking](/pt-BR/tools/thinking) — configuração do nível de pensamento/raciocínio
