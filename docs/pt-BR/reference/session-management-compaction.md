---
read_when:
    - Você precisa depurar IDs de sessão, JSONL de transcrições ou campos de sessions.json
    - Você está alterando o comportamento de auto-Compaction ou adicionando manutenção de "pré-Compaction"
    - Você quer implementar liberações de memória ou turnos silenciosos do sistema
summary: 'Análise aprofundada: armazenamento de sessões + transcrições, ciclo de vida e detalhes internos de (auto)Compaction'
title: Aprofundamento no gerenciamento de sessões
x-i18n:
    generated_at: "2026-07-04T20:28:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c97994f674e14ec01b2eaadc10a61e524f5071f95b2ef84957d71abacbdc719b
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw gerencia sessões de ponta a ponta nestas áreas:

- **Roteamento de sessão** (como mensagens de entrada são mapeadas para uma `sessionKey`)
- **Armazenamento de sessão** (`sessions.json`) e o que ele rastreia
- **Persistência de transcrição** (`*.jsonl`) e sua estrutura
- **Higiene de transcrição** (ajustes específicos de provedor antes das execuções)
- **Limites de contexto** (janela de contexto vs tokens rastreados)
- **Compaction** (manual e auto-compaction) e onde conectar trabalho pré-compaction
- **Manutenção silenciosa** (gravações de memória que não devem produzir saída visível ao usuário)

Se quiser primeiro uma visão geral de nível mais alto, comece por:

- [Gerenciamento de sessão](/pt-BR/concepts/session)
- [Compaction](/pt-BR/concepts/compaction)
- [Visão geral da memória](/pt-BR/concepts/memory)
- [Busca na memória](/pt-BR/concepts/memory-search)
- [Poda de sessão](/pt-BR/concepts/session-pruning)
- [Higiene de transcrição](/pt-BR/reference/transcript-hygiene)

---

## Fonte da verdade: o Gateway

OpenClaw é projetado em torno de um único **processo Gateway** que possui o estado da sessão.

- UIs (aplicativo macOS, Control UI da web, TUI) devem consultar o Gateway para obter listas de sessões e contagens de tokens.
- No modo remoto, os arquivos de sessão ficam no host remoto; "verificar seus arquivos locais do Mac" não refletirá o que o Gateway está usando.

---

## Duas camadas de persistência

OpenClaw persiste sessões em duas camadas:

1. **Armazenamento de sessão (`sessions.json`)**
   - Mapa chave/valor: `sessionKey -> SessionEntry`
   - Pequeno, mutável, seguro para editar (ou excluir entradas)
   - Rastreia metadados de sessão (id da sessão atual, última atividade, alternâncias, contadores de tokens etc.)

2. **Transcrição (`<sessionId>.jsonl`)**
   - Transcrição somente de acréscimo com estrutura em árvore (entradas têm `id` + `parentId`)
   - Armazena a conversa real + chamadas de ferramentas + resumos de compaction
   - Usada para reconstruir o contexto do modelo em turnos futuros
   - Checkpoints de compaction são metadados sobre a transcrição sucessora compactada. Novas compactions não gravam uma segunda cópia `.checkpoint.*.jsonl`.

Leitores de histórico do Gateway devem evitar materializar a transcrição inteira, a menos que
a superfície precise explicitamente de acesso histórico arbitrário. Histórico da primeira página,
histórico de chat incorporado, recuperação de reinicialização e verificações de tokens/uso usam leituras
limitadas da cauda. Varreduras completas de transcrição passam pelo índice assíncrono de transcrições, que é
armazenado em cache por caminho de arquivo mais `mtimeMs`/`size` e compartilhado entre leitores concorrentes.

---

## Locais em disco

Por agente, no host do Gateway:

- Armazenamento: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcrições: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sessões de tópico do Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw resolve isso via `src/config/sessions.ts`.

---

## Manutenção do armazenamento e controles de disco

A persistência de sessão tem controles automáticos de manutenção (`session.maintenance`) para `sessions.json`, artefatos de transcrição e sidecars de trajetória:

- `mode`: `enforce` (padrão) ou `warn`
- `pruneAfter`: limite de idade para entrada obsoleta (padrão `30d`)
- `maxEntries`: limite de entradas em `sessions.json` (padrão `500`)
- A retenção de sondas de curta duração de execução de modelo do gateway é fixa em `24h`, mas é condicionada à pressão: ela só remove linhas obsoletas de sondas estritas quando a pressão de manutenção/limite de entradas de sessão é atingida. Isso se aplica apenas a chaves de sonda explícita estrita correspondentes a `agent:*:explicit:model-run-<uuid>` e é executado antes da limpeza/limitação global de entradas obsoletas quando executado.
- `resetArchiveRetention`: retenção para arquivos de transcrição `*.reset.<timestamp>` (padrão: igual a `pruneAfter`; `false` desativa a limpeza)
- `maxDiskBytes`: orçamento opcional para o diretório de sessões
- `highWaterBytes`: alvo opcional após a limpeza (padrão `80%` de `maxDiskBytes`)

Gravações normais do Gateway passam por um gravador de sessão por armazenamento que serializa mutações em processo sem obter um bloqueio de arquivo em runtime. Auxiliares de patch em hot path emprestam o cache mutável validado enquanto mantêm esse slot de gravador, então arquivos `sessions.json` grandes não são clonados nem relidos para cada atualização de metadados. Código de runtime deve preferir `updateSessionStore(...)` ou `updateSessionStoreEntry(...)`; salvamentos diretos do armazenamento inteiro são ferramentas de compatibilidade e manutenção offline. Quando um Gateway está acessível, `openclaw sessions cleanup` e `openclaw agents delete` sem simulação delegam mutações de armazenamento ao Gateway para que a limpeza entre na mesma fila de gravador; `--store <path>` é o caminho explícito de reparo offline para manutenção direta de arquivo. A limpeza de `maxEntries` ainda é feita em lotes para limites de tamanho de produção, então um armazenamento pode exceder brevemente o limite configurado antes que a próxima limpeza de nível alto o regrave para baixo. Leituras do armazenamento de sessão não podam nem limitam entradas durante a inicialização do Gateway; use gravações ou `openclaw sessions cleanup --enforce` para limpeza. `openclaw sessions cleanup --enforce` ainda aplica o limite configurado imediatamente e poda artefatos antigos de transcrição, checkpoint e trajetória sem referência, mesmo quando nenhum orçamento de disco está configurado.

A manutenção preserva ponteiros duráveis de conversas externas, como sessões de grupo
e sessões de chat com escopo de thread, mas entradas sintéticas de runtime para cron, hooks,
heartbeat, ACP e subagentes ainda podem ser removidas quando excedem a
idade, contagem ou orçamento de disco configurados. Sessões de sonda de execução de modelo do Gateway usam a
retenção separada de execução de modelo de `24h` somente quando sua chave corresponde exatamente a
`agent:*:explicit:model-run-<uuid>`; outras sessões explícitas não fazem parte dessa
retenção. A limpeza de execução de modelo é aplicada somente sob pressão de limite de entradas de sessão.
Execuções cron isoladas mantêm seu próprio controle `cron.sessionRetention`,
independente da retenção de sondas de execução de modelo.

OpenClaw não cria mais backups automáticos de rotação `sessions.json.bak.*` durante gravações do Gateway. A chave legada `session.maintenance.rotateBytes` é ignorada e `openclaw doctor --fix` a remove de configurações antigas.

Mutações de transcrição usam um bloqueio de gravação de sessão no arquivo de transcrição. A aquisição do bloqueio aguarda até
`session.writeLock.acquireTimeoutMs` antes de expor um erro de sessão ocupada; o padrão é `60000`
ms. Aumente isso apenas quando preparação, limpeza, compaction ou espelhamento de transcrição legítimos disputarem
por mais tempo em máquinas lentas. `session.writeLock.staleMs` controla quando um bloqueio existente pode ser
reivindicado como obsoleto; o padrão é `1800000` ms. `session.writeLock.maxHoldMs` controla o
limite de liberação do watchdog em processo; o padrão é `300000` ms. Substituições emergenciais por env são
`OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`, `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS` e
`OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`.

Ordem de aplicação para limpeza de orçamento de disco (`mode: "enforce"`):

1. Remova primeiro os artefatos arquivados mais antigos, transcrições órfãs ou trajetórias órfãs.
2. Se ainda estiver acima do alvo, remova as entradas de sessão mais antigas e seus arquivos de transcrição/trajetória.
3. Continue até que o uso esteja em ou abaixo de `highWaterBytes`.

Em `mode: "warn"`, OpenClaw relata possíveis remoções, mas não altera o armazenamento/arquivos.

Execute a manutenção sob demanda:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessões Cron e logs de execução

Execuções cron isoladas também criam entradas/transcrições de sessão e têm controles de retenção dedicados:

- `cron.sessionRetention` (padrão `24h`) poda sessões antigas de execução cron isolada do armazenamento de sessão (`false` desativa).
- `cron.runLog.keepLines` poda linhas retidas de histórico de execução SQLite por tarefa cron (padrão: `2000`). `cron.runLog.maxBytes` continua aceito para logs de execução antigos baseados em arquivo.

Quando cron força a criação de uma nova sessão de execução isolada, ele higieniza a entrada de sessão
`cron:<jobId>` anterior antes de gravar a nova linha. Ele carrega preferências seguras,
como configurações de thinking/fast/verbose, rótulos e substituições explícitas
de modelo/auth selecionadas pelo usuário. Ele descarta contexto de conversa ambiente, como
roteamento de canal/grupo, política de envio ou fila, elevação, origem e vinculação
de runtime ACP, para que uma nova execução isolada não herde entrega obsoleta ou
autoridade de runtime de uma execução antiga.

---

## Chaves de sessão (`sessionKey`)

Uma `sessionKey` identifica _em qual balde de conversa_ você está (roteamento + isolamento).

Padrões comuns:

- Chat principal/direto (por agente): `agent:<agentId>:<mainKey>` (padrão `main`)
- Grupo: `agent:<agentId>:<channel>:group:<id>`
- Sala/canal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` ou `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (a menos que substituído)

As regras canônicas estão documentadas em [/concepts/session](/pt-BR/concepts/session).

---

## IDs de sessão (`sessionId`)

Cada `sessionKey` aponta para um `sessionId` atual (o arquivo de transcrição que continua a conversa).

Regras práticas:

- **Reset** (`/new`, `/reset`) cria um novo `sessionId` para essa `sessionKey`.
- **Reset diário** (padrão 4:00 AM no horário local do host do gateway) cria um novo `sessionId` na próxima mensagem após o limite de reset.
- **Expiração por inatividade** (`session.reset.idleMinutes` ou legado `session.idleMinutes`) cria um novo `sessionId` quando uma mensagem chega após a janela de inatividade. Quando diário + inatividade estão ambos configurados, vence o que expirar primeiro.
- **Retomada de reconexão da Control UI** pode preservar a sessão atualmente visível para um envio de reconexão quando o Gateway recebe o `sessionId` correspondente de um cliente de UI de operador. Envios obsoletos comuns ainda criam um novo `sessionId`.
- **Eventos do sistema** (heartbeat, despertares cron, notificações de exec, bookkeeping do gateway) podem alterar a linha da sessão, mas não estendem a atualização de reset diário/inatividade. A troca por reset descarta avisos de eventos do sistema enfileirados para a sessão anterior antes que o prompt novo seja criado.
- **Política de fork pai** usa a ramificação ativa do OpenClaw ao criar uma thread ou fork de subagente. Se essa ramificação for grande demais, OpenClaw inicia o filho com contexto isolado em vez de falhar ou herdar histórico inutilizável. A política de dimensionamento é automática; a configuração legada `session.parentForkMaxTokens` é removida por `openclaw doctor --fix`.

Detalhe de implementação: a decisão acontece em `initSessionState()` em `src/auto-reply/reply/session.ts`.

---

## Esquema do armazenamento de sessão (`sessions.json`)

O tipo de valor do armazenamento é `SessionEntry` em `src/config/sessions.ts`.

Campos principais (não exaustivo):

- `sessionId`: ID da transcrição atual (o nome do arquivo é derivado disso, a menos que `sessionFile` esteja definido)
- `sessionStartedAt`: timestamp de início do `sessionId` atual; a atualização da redefinição diária usa isso. Linhas legadas podem derivá-lo do cabeçalho de sessão JSONL.
- `lastInteractionAt`: timestamp da última interação real do usuário/canal; a atualização da redefinição por inatividade usa isso para que eventos de Heartbeat, Cron e exec não mantenham sessões ativas. Linhas legadas sem esse campo recorrem ao horário de início da sessão recuperado para a atualização por inatividade.
- `updatedAt`: timestamp da última mutação da linha no armazenamento, usado para listagem, limpeza e controle. Ele não é a autoridade para a atualização da redefinição diária/por inatividade.
- `archivedAt`: timestamp opcional de arquivamento. Sessões arquivadas permanecem no armazenamento com a transcrição intacta e são excluídas das listagens ativas normais.
- `pinnedAt`: timestamp opcional de fixação. Sessões fixadas ativas são ordenadas antes de sessões não fixadas; arquivar uma sessão limpa sua fixação.
- Interoperação de threads do Codex: ambos os campos seguem o formato de gerenciamento de threads do Codex — os booleanos `archived`/`pinned` no fio são sempre derivados do timestamp e carimbados no lado do servidor, correspondendo à semântica de `threads.archived_at` do Codex e à serialização em camelCase. Os timestamps do OpenClaw estão em milissegundos desde a época, enquanto o Codex usa segundos desde a época; portanto, as pontes convertem na fronteira do plugin codex. O Codex ainda não tem API de fixação (somente `thread/archive`/`thread/unarchive`); o estado fixado permanece no lado do OpenClaw até que uma exista, momento em que o formato correspondente permite que sessões vinculadas façam round-trip do estado de fixação mecanicamente.
- `sessionFile`: substituição opcional explícita do caminho da transcrição
- `chatType`: `direct | group | room` (ajuda UIs e a política de envio)
- `provider`, `subject`, `room`, `space`, `displayName`: metadados para rotulagem de grupo/canal
- Alternâncias:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (substituição por sessão)
- Seleção de modelo:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contadores de tokens (melhor esforço / dependentes do provedor):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: com que frequência a auto-Compaction foi concluída para esta chave de sessão
- `memoryFlushAt`: timestamp do último descarregamento de memória pré-Compaction
- `memoryFlushCompactionCount`: contagem de Compaction quando o último descarregamento foi executado

O armazenamento é seguro para editar, mas o Gateway é a autoridade: ele pode reescrever ou reidratar entradas enquanto as sessões são executadas.

---

## Estrutura da transcrição (`*.jsonl`)

As transcrições são gerenciadas pelo `SessionManager` de `openclaw/plugin-sdk/agent-sessions`.

O arquivo é JSONL:

- Primeira linha: cabeçalho da sessão (`type: "session"`, inclui `id`, `cwd`, `timestamp`, `parentSession` opcional)
- Depois: entradas da sessão com `id` + `parentId` (árvore)

Tipos de entrada notáveis:

- `message`: mensagens de usuário/assistente/toolResult
- `custom_message`: mensagens injetadas por extensão que _entram_ no contexto do modelo (podem ser ocultas da UI)
- `custom`: estado de extensão que _não_ entra no contexto do modelo
- `compaction`: resumo de Compaction persistido com `firstKeptEntryId` e `tokensBefore`
- `branch_summary`: resumo persistido ao navegar por um ramo da árvore

O OpenClaw intencionalmente **não** "corrige" transcrições; o Gateway usa `SessionManager` para lê-las/escrevê-las.

---

## Janelas de contexto vs tokens rastreados

Dois conceitos diferentes importam:

1. **Janela de contexto do modelo**: limite rígido por modelo (tokens visíveis ao modelo)
2. **Contadores do armazenamento de sessões**: estatísticas contínuas gravadas em `sessions.json` (usadas para /status e dashboards)

Se você estiver ajustando limites:

- A janela de contexto vem do catálogo de modelos (e pode ser substituída via configuração).
- `contextTokens` no armazenamento é um valor de estimativa/relatório em runtime; não o trate como garantia estrita.

Para saber mais, consulte [/token-use](/pt-BR/reference/token-use).

---

## Compaction: o que é

Compaction resume a conversa mais antiga em uma entrada `compaction` persistida na transcrição e mantém mensagens recentes intactas.

Após a Compaction, turnos futuros veem:

- O resumo da Compaction
- Mensagens após `firstKeptEntryId`

A reinjeção de seções de AGENTS.md após a Compaction é opcional via
`agents.defaults.compaction.postCompactionSections`; quando não definida ou `[]`,
o OpenClaw não acrescenta trechos de AGENTS.md sobre o resumo da Compaction.

Compaction é **persistente** (diferentemente da limpeza de sessões). Consulte [/concepts/session-pruning](/pt-BR/concepts/session-pruning).

## Limites de partes de Compaction e pareamento de ferramentas

Quando o OpenClaw divide uma transcrição longa em partes de Compaction, ele mantém
chamadas de ferramenta do assistente pareadas com suas entradas `toolResult` correspondentes.

- Se a divisão por proporção de tokens cair entre uma chamada de ferramenta e seu resultado, o OpenClaw
  desloca o limite para a mensagem de chamada de ferramenta do assistente em vez de separar
  o par.
- Se um bloco final de resultado de ferramenta empurraria a parte acima do alvo,
  o OpenClaw preserva esse bloco de ferramenta pendente e mantém a cauda não resumida
  intacta.
- Blocos de chamada de ferramenta abortados/com erro não mantêm uma divisão pendente aberta.

---

## Quando a auto-Compaction acontece (runtime do OpenClaw)

No agente OpenClaw incorporado, a auto-Compaction é acionada em dois casos:

1. **Recuperação de estouro**: o modelo retorna um erro de estouro de contexto
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` e variantes semelhantes no formato do provedor) → compactar → tentar novamente.
   Quando o provedor informa a contagem de tokens tentada, o OpenClaw encaminha essa
   contagem observada para a Compaction de recuperação de estouro. Se o provedor confirma
   estouro, mas não expõe uma contagem analisável, o OpenClaw passa uma contagem sintética
   minimamente acima do orçamento para mecanismos de Compaction e diagnósticos.
   Se a recuperação de estouro ainda falhar, o OpenClaw apresenta orientação explícita ao
   usuário e preserva o mapeamento da sessão atual em vez de rotacionar silenciosamente
   a chave da sessão para um novo ID de sessão. A próxima etapa é controlada pelo operador:
   tentar a mensagem novamente, executar `/compact` ou executar `/new` quando uma sessão nova
   for preferida.
2. **Manutenção de limite**: após um turno bem-sucedido, quando:

`contextTokens > contextWindow - reserveTokens`

Onde:

- `contextWindow` é a janela de contexto do modelo
- `reserveTokens` é a folga reservada para prompts + a próxima saída do modelo

Estas são as semânticas de runtime do OpenClaw.

O OpenClaw também pode acionar uma Compaction local de preflight antes de abrir a próxima
execução quando `agents.defaults.compaction.maxActiveTranscriptBytes` estiver definido e o
arquivo de transcrição ativo atingir esse tamanho. Isso é uma proteção de tamanho de arquivo para o custo
de reabertura local, não arquivamento bruto: o OpenClaw ainda executa a Compaction semântica normal,
e ela requer `truncateAfterCompaction` para que o resumo compactado possa se tornar uma
nova transcrição sucessora.

Para execuções incorporadas do OpenClaw, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
adiciona uma proteção opcional de loop de ferramentas. Depois que um resultado de ferramenta é anexado e antes da
próxima chamada de modelo, o OpenClaw estima a pressão do prompt usando a mesma lógica de
orçamento de preflight usada no início do turno. Se o contexto não couber mais, a proteção
não compacta dentro do gancho `transformContext` do runtime do OpenClaw. Ela emite um sinal estruturado
de precheck no meio do turno, interrompe o envio do prompt atual e permite que o
loop de execução externo use o caminho de recuperação existente: truncar resultados de ferramenta grandes demais
quando isso basta, ou acionar o modo de Compaction configurado e tentar novamente. A
opção fica desabilitada por padrão e funciona com os modos de Compaction `default` e `safeguard`,
incluindo Compaction de safeguard baseada em provedor.
Isso é independente de `maxActiveTranscriptBytes`: a proteção por tamanho em bytes é executada
antes de um turno abrir, enquanto o precheck no meio do turno é executado depois no loop de ferramentas incorporado do OpenClaw,
após novos resultados de ferramenta terem sido anexados.

---

## Configurações de Compaction (`reserveTokens`, `keepRecentTokens`)

As configurações de Compaction do runtime do OpenClaw ficam nas configurações do agente:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

O OpenClaw também impõe um piso de segurança para execuções incorporadas:

- Se `compaction.reserveTokens < reserveTokensFloor`, o OpenClaw o aumenta.
- O piso padrão é de `20000` tokens.
- Defina `agents.defaults.compaction.reserveTokensFloor: 0` para desabilitar o piso.
- Se já estiver mais alto, o OpenClaw o deixa como está.
- `/compact` manual respeita um `agents.defaults.compaction.keepRecentTokens`
  explícito e mantém o ponto de corte da cauda recente do runtime do OpenClaw. Sem um orçamento explícito de retenção,
  a Compaction manual permanece um checkpoint rígido e o contexto reconstruído começa a partir
  do novo resumo.
- Defina `agents.defaults.compaction.midTurnPrecheck.enabled: true` para executar o
  precheck opcional de loop de ferramentas após novos resultados de ferramenta e antes da próxima chamada de modelo.
  Isso é apenas um acionador; a geração de resumo ainda usa o caminho de
  Compaction configurado. Ele é independente de `maxActiveTranscriptBytes`, que é uma
  proteção de tamanho em bytes da transcrição ativa no início do turno.
- Defina `agents.defaults.compaction.maxActiveTranscriptBytes` como um valor em bytes ou
  uma string como `"20mb"` para executar Compaction local antes de um turno quando a transcrição ativa
  ficar grande. Essa proteção só fica ativa quando
  `truncateAfterCompaction` também está habilitado. Deixe sem definir ou defina `0` para
  desabilitar.
- Quando `agents.defaults.compaction.truncateAfterCompaction` está habilitado,
  o OpenClaw rotaciona a transcrição ativa para uma JSONL sucessora compactada após
  a Compaction. Ações de checkpoint de ramo/restauração usam essa sucessora compactada;
  arquivos legados de checkpoint pré-Compaction continuam legíveis enquanto referenciados.

Por quê: deixar folga suficiente para "manutenção" de múltiplos turnos (como gravações de memória) antes que a Compaction se torne inevitável.

Implementação: `applyAgentCompactionSettingsFromConfig()` em `src/agents/agent-settings.ts`
(chamado a partir dos caminhos de turno do executor incorporado e de configuração de Compaction).

---

## Provedores de Compaction plugáveis

Plugins podem registrar um provedor de Compaction via `registerCompactionProvider()` na API do plugin. Quando `agents.defaults.compaction.provider` está definido como um ID de provedor registrado, a extensão safeguard delega a sumarização a esse provedor em vez do pipeline integrado `summarizeInStages`.

- `provider`: ID de um plugin provedor de Compaction registrado. Deixe sem definir para sumarização LLM padrão.
- Definir um `provider` força `mode: "safeguard"`.
- Provedores recebem as mesmas instruções de Compaction e a mesma política de preservação de identificadores que o caminho integrado.
- O safeguard ainda preserva o contexto de sufixo de turnos recentes e de turnos divididos após a saída do provedor.
- A sumarização safeguard integrada redestila resumos anteriores com novas mensagens
  em vez de preservar literalmente o resumo anterior completo.
- O modo safeguard habilita auditorias de qualidade do resumo por padrão; defina
  `qualityGuard.enabled: false` para ignorar o comportamento de tentar novamente em caso de saída malformada.
- Se o provedor falhar ou retornar um resultado vazio, o OpenClaw recorre automaticamente à sumarização LLM integrada.
- Sinais de abortar/timeout são relançados (não engolidos) para respeitar o cancelamento do chamador.

Fonte: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

---

## Superfícies visíveis ao usuário

Você pode observar o estado de Compaction e sessão via:

- `/status` (em qualquer sessão de chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Logs do Gateway (`pnpm gateway:watch` ou `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Modo verboso: `🧹 Auto-compaction complete` + contagem de Compaction

---

## Manutenção silenciosa (`NO_REPLY`)

O OpenClaw oferece suporte a turnos "silenciosos" para tarefas em segundo plano em que o usuário não deve ver saídas intermediárias.

Convenção:

- O assistente inicia sua saída com o token silencioso exato `NO_REPLY` /
  `no_reply` para indicar "não entregue uma resposta ao usuário".
- O OpenClaw remove/suprime isso na camada de entrega.
- A supressão exata do token silencioso não diferencia maiúsculas de minúsculas, portanto `NO_REPLY` e
  `no_reply` contam quando todo o payload é apenas o token silencioso.
- Isso é apenas para turnos reais em segundo plano/sem entrega; não é um atalho para
  solicitações comuns e acionáveis do usuário.

A partir de `2026.1.10`, o OpenClaw também suprime **streaming de rascunho/digitação** quando um
fragmento parcial começa com `NO_REPLY`, para que operações silenciosas não vazem saída
parcial no meio do turno.

---

## "Descarga de memória" pré-Compaction (implementada)

Objetivo: antes que a Compaction automática aconteça, executar um turno agêntico silencioso que grave estado
durável em disco (por exemplo, `memory/YYYY-MM-DD.md` no workspace do agente) para que a Compaction não possa
apagar contexto crítico.

O OpenClaw usa a abordagem de **descarga pré-limite**:

1. Monitore o uso do contexto da sessão.
2. Quando ele ultrapassar um "limite suave" (abaixo do limite de Compaction do runtime do OpenClaw), execute uma diretiva silenciosa
   "gravar memória agora" para o agente.
3. Use o token silencioso exato `NO_REPLY` / `no_reply` para que o usuário não veja
   nada.

Configuração (`agents.defaults.compaction.memoryFlush`):

- `enabled` (padrão: `true`)
- `model` (sobrescrita opcional exata de provedor/modelo para o turno de descarga, por exemplo `ollama/qwen3:8b`)
- `softThresholdTokens` (padrão: `4000`)
- `prompt` (mensagem do usuário para o turno de descarga)
- `systemPrompt` (prompt de sistema extra anexado para o turno de descarga)

Observações:

- O prompt/prompt de sistema padrão inclui uma dica `NO_REPLY` para suprimir
  a entrega.
- Quando `model` está definido, o turno de descarga usa esse modelo sem herdar a
  cadeia de fallback da sessão ativa, para que a manutenção apenas local não faça fallback silenciosamente
  para um modelo de conversa pago.
- A descarga é executada uma vez por ciclo de Compaction (rastreada em `sessions.json`).
- A descarga é executada apenas para sessões incorporadas do OpenClaw (backends da CLI a ignoram).
- A descarga é ignorada quando o workspace da sessão é somente leitura (`workspaceAccess: "ro"` ou `"none"`).
- Consulte [Memória](/pt-BR/concepts/memory) para o layout de arquivos do workspace e os padrões de gravação.

O OpenClaw também expõe um hook `session_before_compact` na API de extensão, mas a lógica de
descarga do OpenClaw fica no lado do Gateway hoje.

---

## Checklist de solução de problemas

- Chave de sessão errada? Comece com [/concepts/session](/pt-BR/concepts/session) e confirme o `sessionKey` em `/status`.
- Incompatibilidade entre armazenamento e transcrição? Confirme o host do Gateway e o caminho do armazenamento em `openclaw status`.
- Excesso de Compaction? Verifique:
  - janela de contexto do modelo (pequena demais)
  - configurações de Compaction (`reserveTokens` alto demais para a janela do modelo pode causar Compaction antecipada)
  - inchaço de resultados de ferramentas: habilite/ajuste a poda de sessões
- Turnos silenciosos vazando? Confirme que a resposta começa com `NO_REPLY` (token exato sem diferenciação de maiúsculas/minúsculas) e que você está em uma build que inclui a correção de supressão de streaming.

## Relacionados

- [Gerenciamento de sessão](/pt-BR/concepts/session)
- [Poda de sessão](/pt-BR/concepts/session-pruning)
- [Motor de contexto](/pt-BR/concepts/context-engine)
