---
read_when:
    - Você precisa depurar IDs de sessão, JSONL de transcrição ou campos de sessions.json
    - Você está alterando o comportamento de auto-Compaction ou adicionando tarefas de manutenção de "pré-Compaction"
    - Você quer implementar liberações de memória ou turnos silenciosos do sistema
summary: 'Análise aprofundada: armazenamento de sessão + transcrições, ciclo de vida e internos de (auto)Compaction'
title: Análise detalhada do gerenciamento de sessões
x-i18n:
    generated_at: "2026-06-27T18:10:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7d4b6195c54024a8c0096ec2462ba367dbb6e16a8f6e10f2f912b879848c65af
    source_path: reference/session-management-compaction.md
    workflow: 16
---

O OpenClaw gerencia sessões de ponta a ponta nestas áreas:

- **Roteamento de sessão** (como mensagens recebidas são mapeadas para uma `sessionKey`)
- **Armazenamento de sessão** (`sessions.json`) e o que ele rastreia
- **Persistência de transcrição** (`*.jsonl`) e sua estrutura
- **Higiene de transcrição** (ajustes específicos por provedor antes das execuções)
- **Limites de contexto** (janela de contexto vs tokens rastreados)
- **Compaction** (manual e auto-compaction) e onde conectar trabalho pré-compaction
- **Manutenção silenciosa** (gravações de memória que não devem produzir saída visível ao usuário)

Se você quiser primeiro uma visão geral de nível mais alto, comece por:

- [Gerenciamento de sessão](/pt-BR/concepts/session)
- [Compaction](/pt-BR/concepts/compaction)
- [Visão geral da memória](/pt-BR/concepts/memory)
- [Busca na memória](/pt-BR/concepts/memory-search)
- [Poda de sessões](/pt-BR/concepts/session-pruning)
- [Higiene de transcrição](/pt-BR/reference/transcript-hygiene)

---

## Fonte da verdade: o Gateway

O OpenClaw foi projetado em torno de um único **processo Gateway** que é dono do estado da sessão.

- UIs (app macOS, Control UI web, TUI) devem consultar o Gateway para obter listas de sessões e contagens de tokens.
- No modo remoto, os arquivos de sessão ficam no host remoto; "verificar seus arquivos locais do Mac" não refletirá o que o Gateway está usando.

---

## Duas camadas de persistência

O OpenClaw persiste sessões em duas camadas:

1. **Armazenamento de sessão (`sessions.json`)**
   - Mapa chave/valor: `sessionKey -> SessionEntry`
   - Pequeno, mutável, seguro para editar (ou excluir entradas)
   - Rastreia metadados de sessão (id da sessão atual, última atividade, alternâncias, contadores de tokens etc.)

2. **Transcrição (`<sessionId>.jsonl`)**
   - Transcrição somente anexada com estrutura de árvore (entradas têm `id` + `parentId`)
   - Armazena a conversa real + chamadas de ferramenta + resumos de compaction
   - Usada para reconstruir o contexto do modelo em turnos futuros
   - Pontos de verificação de compaction são metadados sobre a transcrição
     sucessora compactada. Novas compactions não gravam uma segunda cópia
     `.checkpoint.*.jsonl`.

Leitores de histórico do Gateway devem evitar materializar a transcrição inteira, a menos que
a superfície precise explicitamente de acesso histórico arbitrário. Histórico da primeira página,
histórico de chat incorporado, recuperação de reinicialização e verificações de tokens/uso usam
leituras de cauda limitadas. Varreduras completas de transcrição passam pelo índice assíncrono
de transcrição, que é armazenado em cache por caminho de arquivo mais `mtimeMs`/`size` e
compartilhado entre leitores concorrentes.

---

## Locais no disco

Por agente, no host do Gateway:

- Armazenamento: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcrições: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sessões de tópico do Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

O OpenClaw resolve esses caminhos via `src/config/sessions.ts`.

---

## Manutenção do armazenamento e controles de disco

A persistência de sessão tem controles de manutenção automáticos (`session.maintenance`) para `sessions.json`, artefatos de transcrição e sidecars de trajetória:

- `mode`: `enforce` (padrão) ou `warn`
- `pruneAfter`: corte de idade para entradas obsoletas (padrão `30d`)
- `maxEntries`: limite de entradas em `sessions.json` (padrão `500`)
- A retenção de sondas de curta duração de execução de modelo do gateway é fixa em `24h`, mas é condicionada por pressão: ela remove linhas obsoletas de sondas estritas somente quando a pressão de manutenção/limite de entradas de sessão é atingida. Isso se aplica apenas a chaves de sonda explícitas estritas que correspondem a `agent:*:explicit:model-run-<uuid>` e é executado antes da limpeza/limitação global de entradas obsoletas quando é executado.
- `resetArchiveRetention`: retenção para arquivos de transcrição `*.reset.<timestamp>` (padrão: igual a `pruneAfter`; `false` desativa a limpeza)
- `maxDiskBytes`: orçamento opcional do diretório de sessões
- `highWaterBytes`: alvo opcional após a limpeza (padrão `80%` de `maxDiskBytes`)

Gravações normais do Gateway passam por um gravador de sessão por armazenamento que serializa mutações em processo sem tomar um bloqueio de arquivo em tempo de execução. Auxiliares de patch de caminho quente emprestam o cache mutável validado enquanto mantêm esse slot de gravador, então arquivos `sessions.json` grandes não são clonados nem relidos para cada atualização de metadados. Código de tempo de execução deve preferir `updateSessionStore(...)` ou `updateSessionStoreEntry(...)`; salvamentos diretos do armazenamento inteiro são ferramentas de compatibilidade e manutenção offline. Quando um Gateway está acessível, `openclaw sessions cleanup` e `openclaw agents delete` sem `--dry-run` delegam mutações de armazenamento ao Gateway, para que a limpeza entre na mesma fila de gravador; `--store <path>` é o caminho explícito de reparo offline para manutenção direta de arquivos. A limpeza de `maxEntries` ainda é feita em lotes para limites de tamanho de produção, então um armazenamento pode exceder brevemente o limite configurado antes de a próxima limpeza de limite alto regravá-lo para baixo. Leituras do armazenamento de sessão não podam nem limitam entradas durante a inicialização do Gateway; use gravações ou `openclaw sessions cleanup --enforce` para limpeza. `openclaw sessions cleanup --enforce` ainda aplica o limite configurado imediatamente e poda artefatos antigos não referenciados de transcrição, checkpoint e trajetória mesmo quando nenhum orçamento de disco está configurado.

A manutenção preserva ponteiros duráveis de conversas externas, como sessões de grupo
e sessões de chat com escopo de thread, mas entradas sintéticas de tempo de execução para Cron, hooks,
Heartbeat, ACP e subagentes ainda podem ser removidas quando excedem a
idade, contagem ou orçamento de disco configurados. Sessões de sonda de execução de modelo do Gateway usam a
retenção separada de execução de modelo de `24h` somente quando sua chave corresponde exatamente a
`agent:*:explicit:model-run-<uuid>`; outras sessões explícitas não fazem parte
dessa retenção. A limpeza de execução de modelo é aplicada somente sob pressão de limite
de entradas de sessão. Execuções Cron isoladas mantêm seu próprio controle `cron.sessionRetention`,
independente da retenção de sondas de execução de modelo.

O OpenClaw não cria mais backups automáticos de rotação `sessions.json.bak.*` durante gravações do Gateway. A chave legada `session.maintenance.rotateBytes` é ignorada e `openclaw doctor --fix` a remove de configurações antigas.

Mutações de transcrição usam um bloqueio de gravação de sessão no arquivo de transcrição. A aquisição do bloqueio aguarda até
`session.writeLock.acquireTimeoutMs` antes de expor um erro de sessão ocupada; o padrão é `60000`
ms. Aumente isso apenas quando trabalho legítimo de preparação, limpeza, compaction ou espelhamento de transcrição competir
por mais tempo em máquinas lentas. `session.writeLock.staleMs` controla quando um bloqueio existente pode ser
recuperado como obsoleto; o padrão é `1800000` ms. `session.writeLock.maxHoldMs` controla o
limiar de liberação do watchdog em processo; o padrão é `300000` ms. Substituições emergenciais por env são
`OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`, `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS` e
`OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`.

Ordem de aplicação para limpeza de orçamento de disco (`mode: "enforce"`):

1. Remover primeiro os artefatos mais antigos arquivados, de transcrição órfã ou de trajetória órfã.
2. Se ainda estiver acima do alvo, remover as entradas de sessão mais antigas e seus arquivos de transcrição/trajetória.
3. Continuar até que o uso esteja em ou abaixo de `highWaterBytes`.

Em `mode: "warn"`, o OpenClaw informa possíveis remoções, mas não altera o armazenamento/arquivos.

Execute a manutenção sob demanda:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessões Cron e logs de execução

Execuções Cron isoladas também criam entradas/transcrições de sessão e têm controles de retenção dedicados:

- `cron.sessionRetention` (padrão `24h`) poda sessões antigas de execução Cron isolada do armazenamento de sessão (`false` desativa).
- `cron.runLog.keepLines` poda linhas retidas de histórico de execução SQLite por trabalho Cron (padrão: `2000`). `cron.runLog.maxBytes` continua aceito para logs de execução antigos baseados em arquivo.

Quando o Cron força a criação de uma nova sessão de execução isolada, ele sanitiza a entrada de sessão
`cron:<jobId>` anterior antes de gravar a nova linha. Ele preserva preferências seguras,
como configurações de pensamento/rápido/verboso, rótulos e substituições explícitas
de modelo/auth selecionadas pelo usuário. Ele descarta contexto de conversa ambiente, como
roteamento de canal/grupo, política de envio ou fila, elevação, origem e vinculação de runtime
ACP, para que uma nova execução isolada não herde entrega obsoleta ou
autoridade de runtime de uma execução antiga.

---

## Chaves de sessão (`sessionKey`)

Uma `sessionKey` identifica _em qual bucket de conversa_ você está (roteamento + isolamento).

Padrões comuns:

- Chat principal/direto (por agente): `agent:<agentId>:<mainKey>` (padrão `main`)
- Grupo: `agent:<agentId>:<channel>:group:<id>`
- Sala/canal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` ou `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (a menos que substituído)

As regras canônicas estão documentadas em [/concepts/session](/pt-BR/concepts/session).

---

## IDs de sessão (`sessionId`)

Cada `sessionKey` aponta para uma `sessionId` atual (o arquivo de transcrição que continua a conversa).

Regras práticas:

- **Reset** (`/new`, `/reset`) cria uma nova `sessionId` para essa `sessionKey`.
- **Reset diário** (padrão 4:00 AM no horário local do host do gateway) cria uma nova `sessionId` na próxima mensagem após o limite de reset.
- **Expiração por inatividade** (`session.reset.idleMinutes` ou legado `session.idleMinutes`) cria uma nova `sessionId` quando uma mensagem chega após a janela de inatividade. Quando diário + inatividade estão ambos configurados, vence o que expirar primeiro.
- **Retomada de reconexão da Control UI** pode preservar a sessão atualmente visível por um envio de reconexão quando o Gateway recebe a `sessionId` correspondente de um cliente de UI de operador. Envios obsoletos comuns ainda criam uma nova `sessionId`.
- **Eventos de sistema** (Heartbeat, despertares Cron, notificações de exec, escrituração do gateway) podem alterar a linha de sessão, mas não estendem a validade de reset diário/inatividade. A rolagem de reset descarta avisos de eventos de sistema enfileirados para a sessão anterior antes que o prompt novo seja criado.
- **Política de fork do pai** usa o ramo ativo do OpenClaw ao criar um fork de thread ou subagente. Se esse ramo for grande demais, o OpenClaw inicia o filho com contexto isolado em vez de falhar ou herdar histórico inutilizável. A política de dimensionamento é automática; a configuração legada `session.parentForkMaxTokens` é removida por `openclaw doctor --fix`.

Detalhe de implementação: a decisão acontece em `initSessionState()` em `src/auto-reply/reply/session.ts`.

---

## Esquema do armazenamento de sessão (`sessions.json`)

O tipo de valor do armazenamento é `SessionEntry` em `src/config/sessions.ts`.

Campos principais (não exaustivo):

- `sessionId`: id da transcrição atual (o nome do arquivo deriva disso, a menos que `sessionFile` esteja definido)
- `sessionStartedAt`: timestamp de início para a `sessionId` atual; a validade de reset diário
  usa isso. Linhas legadas podem derivá-lo do cabeçalho de sessão JSONL.
- `lastInteractionAt`: timestamp da última interação real de usuário/canal; a validade de reset por inatividade
  usa isso, para que eventos de Heartbeat, Cron e exec não mantenham sessões
  vivas. Linhas legadas sem esse campo usam como fallback o horário de início da sessão recuperada
  para validade de inatividade.
- `updatedAt`: timestamp da última mutação da linha do armazenamento, usado para listagem, poda e
  escrituração. Ele não é a autoridade para validade de reset diário/inatividade.
- `sessionFile`: substituição opcional explícita do caminho de transcrição
- `chatType`: `direct | group | room` (ajuda UIs e política de envio)
- `provider`, `subject`, `room`, `space`, `displayName`: metadados para rotulagem de grupo/canal
- Alternâncias:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (substituição por sessão)
- Seleção de modelo:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contadores de tokens (melhor esforço / dependente do provedor):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: quantas vezes a auto-compaction foi concluída para esta chave de sessão
- `memoryFlushAt`: timestamp do último flush de memória pré-compaction
- `memoryFlushCompactionCount`: contagem de compaction quando o último flush foi executado

O armazenamento é seguro para editar, mas o Gateway é a autoridade: ele pode regravar ou reidratar entradas conforme as sessões são executadas.

---

## Estrutura da transcrição (`*.jsonl`)

Transcrições são gerenciadas pelo `SessionManager` de `openclaw/plugin-sdk/agent-sessions`.

O arquivo é JSONL:

- Primeira linha: cabeçalho de sessão (`type: "session"`, inclui `id`, `cwd`, `timestamp`, `parentSession` opcional)
- Em seguida: entradas de sessão com `id` + `parentId` (árvore)

Tipos de entrada notáveis:

- `message`: mensagens de usuário/assistente/toolResult
- `custom_message`: mensagens injetadas pela extensão que _entram_ no contexto do modelo (podem ser ocultas da UI)
- `custom`: estado da extensão que _não_ entra no contexto do modelo
- `compaction`: resumo de compaction persistido com `firstKeptEntryId` e `tokensBefore`
- `branch_summary`: resumo persistido ao navegar por uma ramificação da árvore

O OpenClaw intencionalmente **não** "corrige" transcrições; o Gateway usa `SessionManager` para lê-las/gravá-las.

---

## Janelas de contexto vs tokens rastreados

Dois conceitos diferentes importam:

1. **Janela de contexto do modelo**: limite rígido por modelo (tokens visíveis para o modelo)
2. **Contadores do armazenamento da sessão**: estatísticas contínuas gravadas em `sessions.json` (usadas por /status e painéis)

Se você estiver ajustando limites:

- A janela de contexto vem do catálogo de modelos (e pode ser substituída via configuração).
- `contextTokens` no armazenamento é um valor de estimativa/relatório em tempo de execução; não o trate como uma garantia rígida.

Para saber mais, consulte [/token-use](/pt-BR/reference/token-use).

---

## Compaction: o que é

Compaction resume conversas mais antigas em uma entrada `compaction` persistida na transcrição e mantém mensagens recentes intactas.

Após a compaction, turnos futuros veem:

- O resumo de compaction
- Mensagens após `firstKeptEntryId`

A reinjeção de seções de AGENTS.md após a compaction é opcional via
`agents.defaults.compaction.postCompactionSections`; quando não definida ou `[]`,
o OpenClaw não acrescenta trechos de AGENTS.md sobre o resumo de compaction.

Compaction é **persistente** (ao contrário da poda de sessão). Consulte [/concepts/session-pruning](/pt-BR/concepts/session-pruning).

## Limites de blocos de compaction e pareamento de ferramentas

Quando o OpenClaw divide uma transcrição longa em blocos de compaction, ele mantém
chamadas de ferramentas do assistente pareadas com suas entradas `toolResult` correspondentes.

- Se a divisão por proporção de tokens cair entre uma chamada de ferramenta e seu resultado, o OpenClaw
  desloca o limite para a mensagem de chamada de ferramenta do assistente em vez de separar
  o par.
- Se um bloco final de resultado de ferramenta ultrapassaria a meta do bloco,
  o OpenClaw preserva esse bloco de ferramenta pendente e mantém intacta a cauda
  não resumida.
- Blocos de chamadas de ferramenta abortados/com erro não mantêm uma divisão pendente aberta.

---

## Quando a compaction automática acontece (runtime do OpenClaw)

No agente OpenClaw incorporado, a compaction automática é acionada em dois casos:

1. **Recuperação de estouro**: o modelo retorna um erro de estouro de contexto
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` e variantes semelhantes com formato de provedor) → compactar → tentar novamente.
   Quando o provedor informa a contagem de tokens tentada, o OpenClaw encaminha essa
   contagem observada para a compaction de recuperação de estouro. Se o provedor confirmar
   o estouro, mas não expuser uma contagem analisável, o OpenClaw passa uma contagem sintética
   minimamente acima do orçamento para mecanismos de compaction e diagnósticos.
   Se a recuperação de estouro ainda falhar, o OpenClaw apresenta orientação explícita ao
   usuário e preserva o mapeamento de sessão atual em vez de alternar silenciosamente
   a chave de sessão para um novo id de sessão. A próxima etapa é controlada pelo operador:
   tentar a mensagem novamente, executar `/compact` ou executar `/new` quando uma nova sessão for
   preferida.
2. **Manutenção por limite**: após um turno bem-sucedido, quando:

`contextTokens > contextWindow - reserveTokens`

Onde:

- `contextWindow` é a janela de contexto do modelo
- `reserveTokens` é a folga reservada para prompts + a próxima saída do modelo

Estas são semânticas do runtime do OpenClaw.

O OpenClaw também pode acionar uma compaction local de pré-verificação antes de abrir a próxima
execução quando `agents.defaults.compaction.maxActiveTranscriptBytes` estiver definido e o
arquivo de transcrição ativo atingir esse tamanho. Este é um mecanismo de proteção por tamanho de arquivo para o custo de
reabertura local, não arquivamento bruto: o OpenClaw ainda executa a compaction semântica normal,
e ele exige `truncateAfterCompaction` para que o resumo compactado possa se tornar uma
nova transcrição sucessora.

Para execuções incorporadas do OpenClaw, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
adiciona uma proteção opcional de loop de ferramentas. Depois que um resultado de ferramenta é anexado e antes da
próxima chamada de modelo, o OpenClaw estima a pressão do prompt usando a mesma lógica de orçamento
de pré-verificação usada no início do turno. Se o contexto não couber mais, a proteção
não compacta dentro do hook `transformContext` do runtime do OpenClaw. Ela emite um sinal estruturado
de pré-verificação no meio do turno, interrompe o envio do prompt atual e permite que o
loop externo de execução use o caminho de recuperação existente: truncar resultados de ferramenta grandes demais
quando isso for suficiente, ou acionar o modo de compaction configurado e tentar novamente. A
opção é desativada por padrão e funciona com os modos de compaction `default` e `safeguard`,
incluindo compaction de safeguard apoiada por provedor.
Isto é independente de `maxActiveTranscriptBytes`: a proteção por tamanho em bytes executa
antes de um turno abrir, enquanto a pré-verificação no meio do turno executa depois no loop de ferramentas
incorporado do OpenClaw, após novos resultados de ferramenta terem sido anexados.

---

## Configurações de compaction (`reserveTokens`, `keepRecentTokens`)

As configurações de compaction do runtime do OpenClaw ficam nas configurações do agente:

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
- Defina `agents.defaults.compaction.reserveTokensFloor: 0` para desativar o piso.
- Se já estiver mais alto, o OpenClaw o deixa como está.
- `/compact` manual respeita um `agents.defaults.compaction.keepRecentTokens`
  explícito e mantém o ponto de corte da cauda recente do runtime do OpenClaw. Sem um orçamento de retenção explícito,
  a compaction manual continua sendo um checkpoint rígido e o contexto reconstruído começa a partir
  do novo resumo.
- Defina `agents.defaults.compaction.midTurnPrecheck.enabled: true` para executar a
  pré-verificação opcional de loop de ferramentas após novos resultados de ferramenta e antes da próxima chamada de modelo.
  Isto é apenas um acionador; a geração do resumo ainda usa o caminho de compaction
  configurado. Ela é independente de `maxActiveTranscriptBytes`, que é uma proteção por tamanho
  em bytes da transcrição ativa no início do turno.
- Defina `agents.defaults.compaction.maxActiveTranscriptBytes` como um valor em bytes ou
  uma string como `"20mb"` para executar compaction local antes de um turno quando a transcrição
  ativa ficar grande. Esta proteção fica ativa apenas quando
  `truncateAfterCompaction` também está habilitado. Deixe indefinido ou defina `0` para
  desativar.
- Quando `agents.defaults.compaction.truncateAfterCompaction` está habilitado,
  o OpenClaw rotaciona a transcrição ativa para uma JSONL sucessora compactada após
  a compaction. Ações de checkpoint de ramificação/restauração usam essa sucessora compactada;
  arquivos de checkpoint pré-compaction legados continuam legíveis enquanto referenciados.

Motivo: deixar folga suficiente para "manutenção" de múltiplos turnos (como gravações de memória) antes que a compaction se torne inevitável.

Implementação: `applyAgentCompactionSettingsFromConfig()` em `src/agents/agent-settings.ts`
(chamada nos caminhos de turno do executor incorporado e de configuração de compaction).

---

## Provedores de compaction conectáveis

Plugins podem registrar um provedor de compaction via `registerCompactionProvider()` na API do plugin. Quando `agents.defaults.compaction.provider` está definido como um id de provedor registrado, a extensão safeguard delega a sumarização a esse provedor em vez do pipeline integrado `summarizeInStages`.

- `provider`: id de um plugin de provedor de compaction registrado. Deixe indefinido para sumarização LLM padrão.
- Definir um `provider` força `mode: "safeguard"`.
- Provedores recebem as mesmas instruções de compaction e a mesma política de preservação de identificadores do caminho integrado.
- O safeguard ainda preserva o contexto de sufixo de turnos recentes e turnos divididos após a saída do provedor.
- A sumarização safeguard integrada redestila resumos anteriores com novas mensagens
  em vez de preservar integralmente o resumo anterior de forma literal.
- O modo safeguard habilita auditorias de qualidade de resumo por padrão; defina
  `qualityGuard.enabled: false` para ignorar o comportamento de repetir em caso de saída malformada.
- Se o provedor falhar ou retornar um resultado vazio, o OpenClaw recorre automaticamente à sumarização LLM integrada.
- Sinais de abort/timeout são relançados (não engolidos) para respeitar o cancelamento do chamador.

Fonte: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

---

## Superfícies visíveis ao usuário

Você pode observar a compaction e o estado da sessão via:

- `/status` (em qualquer sessão de chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Logs do Gateway (`pnpm gateway:watch` ou `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Modo detalhado: `🧹 Auto-compaction complete` + contagem de compaction

---

## Manutenção silenciosa (`NO_REPLY`)

O OpenClaw oferece suporte a turnos "silenciosos" para tarefas em segundo plano em que o usuário não deve ver saída intermediária.

Convenção:

- O assistente inicia sua saída com o token silencioso exato `NO_REPLY` /
  `no_reply` para indicar "não entregar uma resposta ao usuário".
- O OpenClaw remove/suprime isso na camada de entrega.
- A supressão exata por token silencioso não diferencia maiúsculas de minúsculas, então `NO_REPLY` e
  `no_reply` contam quando o payload inteiro é apenas o token silencioso.
- Isto é apenas para turnos reais em segundo plano/sem entrega; não é um atalho para
  solicitações comuns e acionáveis do usuário.

A partir de `2026.1.10`, o OpenClaw também suprime **streaming de rascunho/digitação** quando um
bloco parcial começa com `NO_REPLY`, para que operações silenciosas não vazem saída
parcial no meio do turno.

---

## "Flush de memória" pré-compaction (implementado)

Objetivo: antes que a compaction automática aconteça, executar um turno agentic silencioso que grava estado durável
em disco (por exemplo, `memory/YYYY-MM-DD.md` no workspace do agente) para que a compaction não possa
apagar contexto crítico.

O OpenClaw usa a abordagem de **flush pré-limite**:

1. Monitorar o uso de contexto da sessão.
2. Quando ele cruza um "limite suave" (abaixo do limite de compaction do runtime do OpenClaw), executar uma diretiva silenciosa
   "escrever memória agora" para o agente.
3. Usar o token silencioso exato `NO_REPLY` / `no_reply` para que o usuário não veja
   nada.

Configuração (`agents.defaults.compaction.memoryFlush`):

- `enabled` (padrão: `true`)
- `model` (substituição opcional exata de provedor/modelo para o turno de flush, por exemplo `ollama/qwen3:8b`)
- `softThresholdTokens` (padrão: `4000`)
- `prompt` (mensagem de usuário para o turno de flush)
- `systemPrompt` (prompt de sistema extra anexado para o turno de flush)

Observações:

- O prompt/prompt de sistema padrão inclui uma dica `NO_REPLY` para suprimir
  a entrega.
- Quando `model` está definido, o turno de flush usa esse modelo sem herdar a
  cadeia de fallback da sessão ativa, de modo que a manutenção apenas local não recorra
  silenciosamente a um modelo de conversa pago.
- O flush executa uma vez por ciclo de compaction (rastreado em `sessions.json`).
- O flush executa apenas para sessões incorporadas do OpenClaw (backends de CLI o ignoram).
- O flush é ignorado quando o workspace da sessão é somente leitura (`workspaceAccess: "ro"` ou `"none"`).
- Consulte [Memória](/pt-BR/concepts/memory) para o layout de arquivos do workspace e padrões de escrita.

O OpenClaw também expõe um hook `session_before_compact` na API de extensão, mas a lógica de
flush do OpenClaw fica hoje no lado do Gateway.

---

## Checklist de solução de problemas

- Chave de sessão errada? Comece por [/concepts/session](/pt-BR/concepts/session) e confirme o `sessionKey` em `/status`.
- Incompatibilidade entre armazenamento e transcrição? Confirme o host do Gateway e o caminho do armazenamento com `openclaw status`.
- Spam de compaction? Verifique:
  - janela de contexto do modelo (pequena demais)
  - configurações de compaction (`reserveTokens` alto demais para a janela do modelo pode causar compaction mais cedo)
  - inchaço de resultados de ferramenta: habilite/ajuste a poda de sessão
- Turnos silenciosos vazando? Confirme que a resposta começa com `NO_REPLY` (token exato sem diferenciar maiúsculas/minúsculas) e que você está em uma build que inclui a correção de supressão de streaming.

## Relacionados

- [Gerenciamento de sessão](/pt-BR/concepts/session)
- [Poda de sessão](/pt-BR/concepts/session-pruning)
- [Mecanismo de contexto](/pt-BR/concepts/context-engine)
