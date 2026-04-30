---
read_when:
    - Você precisa de um passo a passo exato do ciclo do agente ou dos eventos do ciclo de vida
    - Você está alterando o enfileiramento de sessões, as gravações de transcrição ou o comportamento do bloqueio de gravação da sessão
summary: Ciclo de vida do loop do agente, fluxos e semântica de espera
title: Loop do agente
x-i18n:
    generated_at: "2026-04-30T09:43:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 902d543bd71dd517a810d825cbe92e244fe89230f47eeada72477c657a2bec32
    source_path: concepts/agent-loop.md
    workflow: 16
---

Um loop agêntico é a execução “real” completa de um agente: entrada → montagem de contexto → inferência do modelo →
execução de ferramentas → respostas em streaming → persistência. É o caminho autoritativo que transforma uma mensagem
em ações e uma resposta final, mantendo o estado da sessão consistente.

No OpenClaw, um loop é uma única execução serializada por sessão que emite eventos de ciclo de vida e de stream
enquanto o modelo pensa, chama ferramentas e transmite a saída. Este documento explica como esse loop autêntico é
conectado de ponta a ponta.

## Pontos de entrada

- RPC do Gateway: `agent` e `agent.wait`.
- CLI: comando `agent`.

## Como funciona (visão geral)

1. O RPC `agent` valida parâmetros, resolve a sessão (sessionKey/sessionId), persiste metadados da sessão e retorna `{ runId, acceptedAt }` imediatamente.
2. `agentCommand` executa o agente:
   - resolve modelo + padrões de thinking/verbose/trace
   - carrega snapshot de Skills
   - chama `runEmbeddedPiAgent` (runtime pi-agent-core)
   - emite **fim/erro de ciclo de vida** se o loop incorporado não emitir um
3. `runEmbeddedPiAgent`:
   - serializa execuções por meio de filas por sessão + globais
   - resolve modelo + perfil de autenticação e constrói a sessão do pi
   - assina eventos do pi e transmite deltas de assistente/ferramenta
   - aplica timeout -> aborta a execução se excedido
   - retorna payloads + metadados de uso
4. `subscribeEmbeddedPiSession` faz a ponte dos eventos do pi-agent-core para o stream `agent` do OpenClaw:
   - eventos de ferramenta => `stream: "tool"`
   - deltas do assistente => `stream: "assistant"`
   - eventos de ciclo de vida => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` usa `waitForAgentRun`:
   - aguarda **fim/erro de ciclo de vida** para `runId`
   - retorna `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Enfileiramento + concorrência

- As execuções são serializadas por chave de sessão (faixa de sessão) e, opcionalmente, por uma faixa global.
- Isso evita corridas de ferramenta/sessão e mantém o histórico da sessão consistente.
- Canais de mensagens podem escolher modos de fila (collect/steer/followup) que alimentam esse sistema de faixas.
  Consulte [Fila de comandos](/pt-BR/concepts/queue).
- Escritas de transcrição também são protegidas por um bloqueio de escrita de sessão no arquivo da sessão. O bloqueio é
  ciente de processo e baseado em arquivo, portanto detecta escritores que contornam a fila em processo ou vêm de
  outro processo.
- Bloqueios de escrita de sessão não são reentrantes por padrão. Se um auxiliar aninhar intencionalmente a aquisição do
  mesmo bloqueio preservando um único escritor lógico, ele deve optar explicitamente por
  `allowReentrant: true`.

## Preparação da sessão + workspace

- O workspace é resolvido e criado; execuções em sandbox podem redirecionar para uma raiz de workspace de sandbox.
- Skills são carregadas (ou reutilizadas a partir de um snapshot) e injetadas no env e no prompt.
- Arquivos de bootstrap/contexto são resolvidos e injetados no relatório do prompt do sistema.
- Um bloqueio de escrita de sessão é adquirido; `SessionManager` é aberto e preparado antes do streaming. Qualquer
  caminho posterior de reescrita de transcrição, Compaction ou truncamento deve adquirir o mesmo bloqueio antes de abrir ou
  alterar o arquivo de transcrição.

## Montagem do prompt + prompt do sistema

- O prompt do sistema é construído a partir do prompt base do OpenClaw, prompt de Skills, contexto de bootstrap e substituições por execução.
- Limites específicos do modelo e tokens de reserva de Compaction são aplicados.
- Consulte [Prompt do sistema](/pt-BR/concepts/system-prompt) para ver o que o modelo recebe.

## Pontos de hook (onde você pode interceptar)

O OpenClaw tem dois sistemas de hook:

- **Hooks internos** (hooks do Gateway): scripts orientados a eventos para comandos e eventos de ciclo de vida.
- **Hooks de Plugin**: pontos de extensão dentro do ciclo de vida do agente/ferramenta e do pipeline do Gateway.

### Hooks internos (hooks do Gateway)

- **`agent:bootstrap`**: executa durante a construção dos arquivos de bootstrap antes da finalização do prompt do sistema.
  Use isto para adicionar/remover arquivos de contexto de bootstrap.
- **Hooks de comando**: `/new`, `/reset`, `/stop` e outros eventos de comando (consulte a documentação de Hooks).

Consulte [Hooks](/pt-BR/automation/hooks) para configuração e exemplos.

### Hooks de Plugin (ciclo de vida do agente + Gateway)

Eles executam dentro do loop do agente ou do pipeline do Gateway:

- **`before_model_resolve`**: executa antes da sessão (sem `messages`) para substituir provider/model de forma determinística antes da resolução do modelo.
- **`before_prompt_build`**: executa após o carregamento da sessão (com `messages`) para injetar `prependContext`, `systemPrompt`, `prependSystemContext` ou `appendSystemContext` antes do envio do prompt. Use `prependContext` para texto dinâmico por turno e campos de contexto do sistema para orientação estável que deve ficar no espaço do prompt do sistema.
- **`before_agent_start`**: hook de compatibilidade legado que pode executar em qualquer fase; prefira os hooks explícitos acima.
- **`before_agent_reply`**: executa após ações inline e antes da chamada ao LLM, permitindo que um Plugin reivindique o turno e retorne uma resposta sintética ou silencie o turno inteiramente.
- **`agent_end`**: inspeciona a lista final de mensagens e os metadados da execução após a conclusão.
- **`before_compaction` / `after_compaction`**: observa ou anota ciclos de Compaction.
- **`before_tool_call` / `after_tool_call`**: intercepta parâmetros/resultados de ferramentas.
- **`before_install`**: inspeciona achados de varredura integrados e, opcionalmente, bloqueia instalações de Skills ou Plugin.
- **`tool_result_persist`**: transforma de forma síncrona resultados de ferramentas antes que sejam escritos em uma transcrição de sessão pertencente ao OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: hooks de mensagens de entrada + saída.
- **`session_start` / `session_end`**: limites do ciclo de vida da sessão.
- **`gateway_start` / `gateway_stop`**: eventos de ciclo de vida do Gateway.

Regras de decisão de hooks para guardas de saída/ferramenta:

- `before_tool_call`: `{ block: true }` é terminal e interrompe handlers de menor prioridade.
- `before_tool_call`: `{ block: false }` é um no-op e não limpa um bloqueio anterior.
- `before_install`: `{ block: true }` é terminal e interrompe handlers de menor prioridade.
- `before_install`: `{ block: false }` é um no-op e não limpa um bloqueio anterior.
- `message_sending`: `{ cancel: true }` é terminal e interrompe handlers de menor prioridade.
- `message_sending`: `{ cancel: false }` é um no-op e não limpa um cancelamento anterior.

Consulte [Hooks de Plugin](/pt-BR/plugins/hooks) para a API de hooks e detalhes de registro.

Harnesses podem adaptar esses hooks de forma diferente. O harness de app-server do Codex mantém
hooks de Plugin do OpenClaw como o contrato de compatibilidade para superfícies espelhadas documentadas,
enquanto hooks nativos do Codex continuam sendo um mecanismo separado de nível mais baixo do Codex.

## Streaming + respostas parciais

- Deltas do assistente são transmitidos pelo pi-agent-core e emitidos como eventos `assistant`.
- Streaming em bloco pode emitir respostas parciais em `text_end` ou `message_end`.
- Streaming de raciocínio pode ser emitido como um stream separado ou como respostas em bloco.
- Consulte [Streaming](/pt-BR/concepts/streaming) para o comportamento de divisão em chunks e respostas em bloco.

## Execução de ferramentas + ferramentas de mensagens

- Eventos de início/atualização/fim de ferramenta são emitidos no stream `tool`.
- Resultados de ferramentas são sanitizados quanto a tamanho e payloads de imagem antes de registro/emissão.
- Envios de ferramentas de mensagens são rastreados para suprimir confirmações duplicadas do assistente.

## Moldagem + supressão de resposta

- Payloads finais são montados a partir de:
  - texto do assistente (e raciocínio opcional)
  - resumos inline de ferramentas (quando verbose + permitido)
  - texto de erro do assistente quando o modelo falha
- O token silencioso exato `NO_REPLY` / `no_reply` é filtrado dos payloads
  de saída.
- Duplicatas de ferramentas de mensagens são removidas da lista final de payloads.
- Se não restarem payloads renderizáveis e uma ferramenta tiver falhado, uma resposta de erro de ferramenta de fallback é emitida
  (a menos que uma ferramenta de mensagens já tenha enviado uma resposta visível ao usuário).

## Compaction + novas tentativas

- A Compaction automática emite eventos de stream `compaction` e pode disparar uma nova tentativa.
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
- Runtime do agente: padrão de `agents.defaults.timeoutSeconds` de 172800s (48 horas); aplicado no temporizador de aborto de `runEmbeddedPiAgent`.
- Runtime de Cron: o `timeoutSeconds` isolado do turno do agente pertence ao cron. O scheduler inicia esse temporizador quando a execução começa, aborta a execução subjacente no prazo configurado e então executa limpeza limitada antes de registrar o timeout, para que uma sessão filha obsoleta não mantenha a faixa presa.
- Recuperação de sessão travada: com diagnósticos habilitados, `diagnostics.stuckSessionWarnMs` detecta sessões longas em `processing`. Execuções incorporadas ativas, operações de resposta ativas e tarefas ativas de faixa de sessão permanecem apenas como aviso por padrão; se os diagnósticos não mostrarem trabalho ativo para a sessão, o watchdog libera a faixa de sessão afetada para que o trabalho de inicialização enfileirado possa escoar.
- Timeout de inatividade do modelo: o OpenClaw aborta uma solicitação de modelo quando nenhum chunk de resposta chega antes da janela de inatividade. `models.providers.<id>.timeoutSeconds` estende este watchdog de inatividade para providers locais/autohospedados lentos; caso contrário, o OpenClaw usa `agents.defaults.timeoutSeconds` quando configurado, limitado a 120s por padrão. Execuções disparadas por Cron sem timeout explícito de modelo ou agente desabilitam o watchdog de inatividade e dependem do timeout externo do cron.
- Timeout de solicitação HTTP do provider: `models.providers.<id>.timeoutSeconds` se aplica às buscas HTTP de modelo desse provider, incluindo conexão, cabeçalhos, corpo, timeout de solicitação do SDK, tratamento total de aborto de guarded-fetch e watchdog de inatividade do stream do modelo. Use isto para providers locais/autohospedados lentos, como Ollama, antes de aumentar o timeout de runtime do agente inteiro.

## Onde as coisas podem terminar cedo

- Timeout do agente (abort)
- AbortSignal (cancelamento)
- Desconexão do Gateway ou timeout de RPC
- Timeout de `agent.wait` (somente espera, não interrompe o agente)

## Relacionados

- [Ferramentas](/pt-BR/tools) — ferramentas de agente disponíveis
- [Hooks](/pt-BR/automation/hooks) — scripts orientados a eventos disparados por eventos de ciclo de vida do agente
- [Compaction](/pt-BR/concepts/compaction) — como conversas longas são resumidas
- [Aprovações de Exec](/pt-BR/tools/exec-approvals) — gates de aprovação para comandos de shell
- [Pensamento](/pt-BR/tools/thinking) — configuração de nível de pensamento/raciocínio
