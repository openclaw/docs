---
read_when:
    - Você precisa de um passo a passo exato do loop do agente ou dos eventos do ciclo de vida
    - Você está alterando o enfileiramento de sessões, as gravações de transcrições ou o comportamento do bloqueio de gravação da sessão
summary: Ciclo de vida do loop do agente, fluxos e semântica de espera
title: Loop do agente
x-i18n:
    generated_at: "2026-07-12T15:07:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3793a2c765c72f7f4bb8e790ce4d61abc279cf3a8a7367ecf8759428d0192279
    source_path: concepts/agent-loop.md
    workflow: 16
---

O loop do agente é a execução serializada por sessão que transforma uma mensagem em
ações e uma resposta: recebimento, montagem do contexto, inferência do modelo, execução de
ferramentas, streaming e persistência.

## Pontos de entrada

- RPC do Gateway: `agent` e `agent.wait`.
- CLI: `openclaw agent`.

## Sequência de execução

1. O RPC `agent` valida os parâmetros, resolve a sessão (`sessionKey`/`sessionId`), persiste os metadados da sessão e retorna `{ runId, acceptedAt }` imediatamente.
2. `agentCommand` executa o turno: resolve o modelo e os padrões de thinking/verbose/trace, carrega o snapshot de Skills, chama `runEmbeddedAgent` e emite um **fim/erro de ciclo de vida** de contingência se o loop incorporado ainda não tiver emitido um.
3. `runEmbeddedAgent`: serializa as execuções por meio de filas por sessão e globais, resolve o modelo e o perfil de autenticação, cria a sessão do OpenClaw, assina eventos de runtime, transmite deltas do assistente/das ferramentas, aplica o tempo limite da execução (interrompendo-a quando expira) e retorna payloads junto com metadados de uso. Para turnos do app-server do Codex, também interrompe um turno aceito que deixa de produzir progresso no app-server antes de um evento terminal.
4. `subscribeEmbeddedAgentSession` conecta eventos de runtime ao fluxo `agent`: eventos de ferramentas para `stream: "tool"`, deltas do assistente para `stream: "assistant"` e eventos de ciclo de vida para `stream: "lifecycle"` (`phase: "start" | "end" | "error"`).
5. `agent.wait` (`waitForAgentRun`) aguarda o **fim/erro do ciclo de vida** de um `runId` e retorna `{ status: ok|error|timeout, startedAt, endedAt, error? }`.

## Enfileiramento e concorrência

As execuções são serializadas por chave de sessão (faixa da sessão) e, opcionalmente, por uma faixa global, evitando condições de corrida entre ferramentas e sessões. Os canais de mensagens escolhem um modo de fila (steer/followup/collect/interrupt) que alimenta esse sistema de faixas; consulte [Fila de comandos](/pt-BR/concepts/queue).

As gravações da transcrição também são protegidas por um bloqueio de gravação da sessão no arquivo da sessão. O bloqueio reconhece processos e é baseado em arquivo, portanto detecta gravadores que contornam a fila dentro do processo ou que vêm de outro processo. Os gravadores aguardam até `session.writeLock.acquireTimeoutMs` (padrão de `60000` ms; substituição pela variável de ambiente `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`) antes de informar que a sessão está ocupada.

Por padrão, os bloqueios de gravação de sessão não são reentrantes. Um auxiliar que aninha intencionalmente a aquisição do mesmo bloqueio, preservando um único gravador lógico, deve habilitar `allowReentrant: true`.

## Preparação da sessão e do espaço de trabalho

- O espaço de trabalho é resolvido e criado; execuções em sandbox podem ser redirecionadas para a raiz de um espaço de trabalho de sandbox.
- As Skills são carregadas (ou reutilizadas de um snapshot) e injetadas no ambiente e no prompt.
- Os arquivos de inicialização/contexto são resolvidos e injetados no prompt do sistema.
- Um bloqueio de gravação da sessão é adquirido, e o destino da transcrição da sessão é preparado antes do início do streaming. Qualquer caminho posterior de regravação, Compaction ou truncamento da transcrição deve adquirir o mesmo bloqueio antes de modificar as linhas da transcrição no SQLite.

## Montagem do prompt

O prompt do sistema é criado com base no prompt-base do OpenClaw, no prompt de Skills, no contexto de inicialização e nas substituições por execução. Os limites específicos do modelo e os tokens reservados para Compaction são aplicados. Consulte [Prompt do sistema](/pt-BR/concepts/system-prompt) para saber o que o modelo recebe.

## Hooks

O OpenClaw tem dois sistemas de hooks:

- **Hooks internos** (hooks do Gateway): scripts orientados a eventos para comandos e eventos de ciclo de vida.
- **Hooks de Plugin**: pontos de extensão dentro do ciclo de vida do agente/das ferramentas e do pipeline do Gateway.

### Hooks internos (hooks do Gateway)

- **`agent:bootstrap`**: é executado durante a criação dos arquivos de inicialização, antes da finalização do prompt do sistema. Use-o para adicionar ou remover arquivos de contexto de inicialização.
- **Hooks de comando**: `/new`, `/reset`, `/stop` e outros eventos de comando (consulte a documentação de Hooks).

Consulte [Hooks](/pt-BR/automation/hooks) para ver a configuração e exemplos.

### Hooks de Plugin

Eles são executados dentro do loop do agente ou do pipeline do Gateway:

| Hook                                                    | Execução                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `before_model_resolve`                                  | Antes da sessão (sem `messages`), para substituir deterministicamente o provedor/modelo antes da resolução.                                                                                                                                                                                 |
| `before_prompt_build`                                   | Após o carregamento da sessão (com `messages`), para injetar `prependContext`, `systemPrompt`, `prependSystemContext` ou `appendSystemContext` antes do envio. Use `prependContext` para texto dinâmico por turno e os campos de contexto do sistema para orientações estáveis que pertencem ao espaço do prompt do sistema. |
| `before_agent_start`                                    | Hook de compatibilidade legado que pode ser executado em qualquer uma das fases; prefira os hooks explícitos acima.                                                                                                                                                                         |
| `before_agent_reply`                                    | Após as ações inline e antes da chamada ao LLM. Permite que um Plugin assuma o turno e retorne uma resposta sintética ou a suprima por completo.                                                                                                                                              |
| `agent_end`                                             | Após a conclusão, com a lista final de mensagens e os metadados da execução.                                                                                                                                                                                                                 |
| `before_compaction` / `after_compaction`                | Observam ou anotam ciclos de Compaction.                                                                                                                                                                                                                                                     |
| `before_tool_call` / `after_tool_call`                  | Interceptam parâmetros/resultados de ferramentas.                                                                                                                                                                                                                                           |
| `before_install`                                        | Após a aplicação da política de instalação do operador, sobre o material preparado para instalação de Skills/Plugins, quando os hooks de Plugin estão carregados no processo atual.                                                                                                          |
| `tool_result_persist`                                   | Transforma de forma síncrona os resultados das ferramentas antes que sejam gravados em uma transcrição de sessão gerenciada pelo OpenClaw.                                                                                                                                                   |
| `message_received` / `message_sending` / `message_sent` | Hooks de mensagens recebidas e enviadas.                                                                                                                                                                                                                                                    |
| `session_start` / `session_end`                         | Limites do ciclo de vida da sessão.                                                                                                                                                                                                                                                         |
| `gateway_start` / `gateway_stop`                        | Eventos do ciclo de vida do Gateway.                                                                                                                                                                                                                                                        |

Regras de decisão dos hooks para proteções de saída/ferramentas:

- `before_tool_call`: `{ block: true }` é terminal e interrompe os manipuladores de menor prioridade. `{ block: false }` não realiza nenhuma ação e não remove um bloqueio anterior.
- `before_install`: mesmas semânticas de terminal/nenhuma ação descritas acima. Use `security.installPolicy`, e não `before_install`, para decisões de permissão/bloqueio de instalação controladas pelo operador que precisem abranger os caminhos de instalação e atualização pela CLI.
- `message_sending`: `{ cancel: true }` é terminal e interrompe os manipuladores de menor prioridade. `{ cancel: false }` não realiza nenhuma ação e não remove um cancelamento anterior.

Consulte [Hooks de Plugin](/pt-BR/plugins/hooks) para ver a API de hooks e os detalhes de registro.

Os harnesses podem adaptar esses hooks. O harness do app-server do Codex mantém os hooks de Plugin do OpenClaw como o contrato de compatibilidade para as superfícies espelhadas documentadas; os hooks nativos do Codex são um mecanismo separado do Codex, de nível mais baixo.

## Streaming

- Os deltas do assistente são transmitidos pelo runtime do agente como eventos `assistant`.
- O streaming em blocos pode emitir respostas parciais em `text_end` ou `message_end`.
- O streaming de raciocínio pode ser um fluxo separado ou bloquear respostas.
- Consulte [Streaming](/pt-BR/concepts/streaming) para saber mais sobre a divisão em partes e o comportamento das respostas em blocos.

## Execução de ferramentas

- Os eventos de início/atualização/fim de ferramentas são emitidos no fluxo `tool`.
- Os resultados das ferramentas são higienizados quanto ao tamanho e aos payloads de imagens antes do registro/emissão.
- Os envios por ferramentas de mensagens são rastreados para suprimir confirmações duplicadas do assistente.

## Formatação da resposta

Os payloads finais são montados com o texto do assistente (mais o raciocínio opcional), resumos inline das ferramentas (quando o modo detalhado está habilitado e é permitido) e o texto de erro do assistente quando ocorre um erro no modelo.

- O token silencioso exato `NO_REPLY` é filtrado dos payloads de saída.
- As duplicatas das ferramentas de mensagens são removidas da lista final de payloads.
- Se nenhum payload renderizável permanecer e uma ferramenta tiver apresentado erro, uma resposta de erro de ferramenta de contingência será emitida, a menos que uma ferramenta de mensagens já tenha enviado uma resposta visível ao usuário.

## Compaction e novas tentativas

A Compaction automática emite eventos de fluxo `compaction` e pode acionar uma nova tentativa. Na nova tentativa, os buffers em memória e os resumos de ferramentas são redefinidos para evitar saída duplicada. Consulte [Compaction](/pt-BR/concepts/compaction).

## Fluxos de eventos

- `lifecycle`: emitido por `subscribeEmbeddedAgentSession` (e, como contingência, por `agentCommand`).
- `assistant`: deltas transmitidos pelo runtime do agente.
- `tool`: eventos de ferramentas transmitidos pelo runtime do agente.

O Gateway projeta eventos de ciclo de vida e de início/terminal de ferramentas no [livro-razão de auditoria](/pt-BR/cli/audit) limitado,
que contém somente metadados. Essa projeção registra a proveniência e
os códigos de resultado sem copiar prompts, mensagens, argumentos de ferramentas, resultados de ferramentas
ou erros brutos para fora do caminho da transcrição/runtime.

## Tratamento de canais de chat

Os deltas do assistente são armazenados em buffer nas mensagens `delta` do chat. Uma mensagem `final` do chat é emitida no **fim/erro do ciclo de vida**.

## Tempos limite

| Tempo limite                                     | Padrão                                 | Observações                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agent.wait`                                     | 30s                                    | Apenas aguarda; o parâmetro `timeoutMs` substitui esse valor. Não interrompe a execução subjacente.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Tempo de execução do agente (`agents.defaults.timeoutSeconds`) | 172800s (48h)                          | Imposto pelo temporizador de cancelamento de `runEmbeddedAgent`. Defina como `0` para um orçamento de execução ilimitado; os monitores de atividade do fluxo do modelo ainda se aplicam.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Turno de agente isolado do Cron                  | controlado pelo cron                   | O agendador inicia seu próprio temporizador quando a execução começa, cancela a execução no prazo configurado e, em seguida, realiza uma limpeza limitada antes de registrar o tempo limite, para que uma sessão filha obsoleta não mantenha a fila bloqueada.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Tempo limite de inatividade do modelo            | Nuvem 120s; auto-hospedado 300s        | O OpenClaw cancela uma solicitação ao modelo quando nenhum fragmento de resposta chega dentro da janela de inatividade. `models.providers.<id>.timeoutSeconds` amplia esse monitor de inatividade para provedores locais/auto-hospedados lentos, mas permanece limitado por qualquer valor finito menor de `agents.defaults.timeoutSeconds` ou tempo limite específico da execução, pois esses controlam toda a execução do agente. Orçamentos de execução ilimitados ainda mantêm o monitor de inatividade da classe do provedor. Execuções de modelos em nuvem acionadas pelo Cron sem tempo limite explícito do modelo/agente usam o mesmo padrão; com um tempo limite explícito de execução do cron, interrupções do fluxo do modelo em nuvem são limitadas a 60s, para que os fallbacks de modelo configurados ainda possam ser executados antes do prazo externo do cron. Execuções acionadas pelo Cron em endpoints realmente locais (baseUrl de loopback/privada) mantêm a desativação do tempo limite de inatividade local; provedores auto-hospedados em baseUrls de rede recebem o monitor implícito de 300s. Com um tempo limite explícito de execução do cron, interrupções locais/auto-hospedadas são limitadas a esse tempo limite. Defina `models.providers.<id>.timeoutSeconds` para provedores locais lentos. |
| Tempo limite da solicitação HTTP do provedor     | `models.providers.<id>.timeoutSeconds` | Abrange conexão, cabeçalhos, corpo, tempo limite de solicitação do SDK, tratamento de cancelamento de busca protegida e o monitor de inatividade do fluxo do modelo para esse provedor. Use para provedores locais/auto-hospedados lentos (por exemplo, Ollama) antes de aumentar o tempo limite de execução de todo o agente; mantenha o tempo limite do agente/tempo de execução pelo menos tão alto quando a solicitação ao modelo precisar ser executada por mais tempo.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

### Diagnóstico de sessões travadas

Com o diagnóstico ativado, `diagnostics.stuckSessionWarnMs` (padrão: `120000` ms) classifica sessões longas em `processing` sem resposta, ferramenta, status, bloqueio ou progresso de ACP observado:

- Execuções incorporadas, chamadas de modelo e chamadas de ferramenta ativas são relatadas como `session.long_running`. Chamadas silenciosas de modelo com proprietário permanecem como `session.long_running` até `diagnostics.stuckSessionAbortMs`, para que provedores lentos ou sem streaming não sejam sinalizados como paralisados cedo demais.
- Trabalho ativo sem progresso recente é relatado como `session.stalled`. Chamadas de modelo com proprietário mudam para `session.stalled` ao atingir ou ultrapassar o limite de cancelamento; atividade obsoleta de modelo/ferramenta sem proprietário não fica oculta como execução longa.
- `session.stuck` é reservado para registros obsoletos e recuperáveis de sessão, incluindo sessões ociosas na fila com atividade obsoleta de modelo/ferramenta sem proprietário.

O padrão de `diagnostics.stuckSessionAbortMs` é de pelo menos 5 minutos e 3 vezes o limite de aviso. Registros obsoletos de sessão liberam a fila da sessão afetada imediatamente após a aprovação das verificações de recuperação; execuções incorporadas paralisadas são canceladas e drenadas somente após o limite de cancelamento, para que o trabalho na fila seja retomado sem interromper execuções meramente lentas. A recuperação emite resultados estruturados de solicitação/conclusão; o estado de diagnóstico é marcado como ocioso somente se a mesma geração de processamento ainda for a atual, e diagnósticos repetidos de `session.stuck` aumentam progressivamente o intervalo enquanto a sessão permanece inalterada.

## Onde as operações podem terminar antecipadamente

- Tempo limite do agente (cancelamento)
- AbortSignal (cancelamento)
- Desconexão do Gateway ou tempo limite de RPC
- Tempo limite de `agent.wait` (apenas aguarda, não interrompe o agente)

## Relacionado

- [Ferramentas](/pt-BR/tools) - ferramentas disponíveis para o agente
- [Hooks](/pt-BR/automation/hooks) - scripts orientados a eventos acionados por eventos do ciclo de vida do agente
- [Compaction](/pt-BR/concepts/compaction) - como conversas longas são resumidas
- [Aprovações de execução](/pt-BR/tools/exec-approvals) - controles de aprovação para comandos do shell
- [Raciocínio](/pt-BR/tools/thinking) - configuração do nível de raciocínio/pensamento
