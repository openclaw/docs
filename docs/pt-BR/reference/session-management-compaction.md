---
read_when:
    - Você precisa depurar IDs de sessão, o JSONL da transcrição ou campos de sessions.json
    - Você está alterando o comportamento de Compaction automática ou adicionando manutenção de “pré-Compaction”
    - Você quer implementar liberações de memória ou turnos silenciosos do sistema
summary: 'Aprofundamento: armazenamento de sessões + transcrições, ciclo de vida e detalhes internos de (auto)Compaction'
title: Análise aprofundada do gerenciamento de sessões
x-i18n:
    generated_at: "2026-05-02T21:04:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8271d7b0786e1c47a8cec6e7bd73c3c86a433d629e17937fdd87fa756ed78d73
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw gerencia sessões de ponta a ponta nestas áreas:

- **Roteamento de sessão** (como mensagens recebidas são mapeadas para uma `sessionKey`)
- **Armazenamento de sessão** (`sessions.json`) e o que ele rastreia
- **Persistência de transcrição** (`*.jsonl`) e sua estrutura
- **Higiene de transcrição** (ajustes específicos de provedor antes das execuções)
- **Limites de contexto** (janela de contexto vs tokens rastreados)
- **Compaction** (manual e automática) e onde conectar trabalho de pré-Compaction
- **Manutenção silenciosa** (gravações de memória que não devem produzir saída visível ao usuário)

Se quiser uma visão geral de nível mais alto primeiro, comece com:

- [Gerenciamento de sessão](/pt-BR/concepts/session)
- [Compaction](/pt-BR/concepts/compaction)
- [Visão geral da memória](/pt-BR/concepts/memory)
- [Busca na memória](/pt-BR/concepts/memory-search)
- [Limpeza de sessões](/pt-BR/concepts/session-pruning)
- [Higiene de transcrição](/pt-BR/reference/transcript-hygiene)

---

## Fonte da verdade: o Gateway

OpenClaw foi projetado em torno de um único **processo Gateway** que detém o estado da sessão.

- Interfaces de usuário (app macOS, IU de Controle web, TUI) devem consultar o Gateway para obter listas de sessões e contagens de tokens.
- No modo remoto, os arquivos de sessão ficam no host remoto; “verificar seus arquivos locais do Mac” não refletirá o que o Gateway está usando.

---

## Duas camadas de persistência

OpenClaw persiste sessões em duas camadas:

1. **Armazenamento de sessão (`sessions.json`)**
   - Mapa chave/valor: `sessionKey -> SessionEntry`
   - Pequeno, mutável, seguro para editar (ou excluir entradas)
   - Rastreia metadados da sessão (id da sessão atual, última atividade, alternâncias, contadores de tokens etc.)

2. **Transcrição (`<sessionId>.jsonl`)**
   - Transcrição somente de acréscimo com estrutura em árvore (as entradas têm `id` + `parentId`)
   - Armazena a conversa real + chamadas de ferramentas + resumos de Compaction
   - Usada para reconstruir o contexto do modelo em turnos futuros
   - Grandes pontos de verificação de depuração pré-Compaction são ignorados quando a transcrição
     ativa excede o limite de tamanho de ponto de verificação, evitando uma segunda cópia gigante
     `.checkpoint.*.jsonl`.

Leitores de histórico do Gateway devem evitar materializar a transcrição inteira, a menos que
a superfície precise explicitamente de acesso histórico arbitrário. Histórico da primeira página,
histórico de chat incorporado, recuperação de reinicialização e verificações de tokens/uso usam leituras
limitadas do fim do arquivo. Varreduras completas da transcrição passam pelo índice assíncrono de transcrição, que é
armazenado em cache pelo caminho do arquivo mais `mtimeMs`/`size` e compartilhado entre leitores simultâneos.

---

## Locais em disco

Por agente, no host do Gateway:

- Armazenamento: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcrições: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sessões de tópicos do Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw resolve isso via `src/config/sessions.ts`.

---

## Manutenção do armazenamento e controles de disco

A persistência de sessão tem controles de manutenção automáticos (`session.maintenance`) para `sessions.json`, artefatos de transcrição e sidecars de trajetória:

- `mode`: `warn` (padrão) ou `enforce`
- `pruneAfter`: limite de idade para entradas obsoletas (padrão `30d`)
- `maxEntries`: limite de entradas em `sessions.json` (padrão `500`)
- `resetArchiveRetention`: retenção para arquivos de transcrição `*.reset.<timestamp>` (padrão: igual a `pruneAfter`; `false` desativa a limpeza)
- `maxDiskBytes`: orçamento opcional do diretório de sessões
- `highWaterBytes`: alvo opcional após a limpeza (padrão `80%` de `maxDiskBytes`)

Gravações normais do Gateway fluem por um gravador de sessão por armazenamento, que serializa mutações em processo sem obter um bloqueio de arquivo em tempo de execução. Auxiliares de patch no caminho crítico emprestam o cache mutável validado enquanto mantêm esse slot de gravador, então arquivos `sessions.json` grandes não são clonados nem relidos a cada atualização de metadados. O código em tempo de execução deve preferir `updateSessionStore(...)` ou `updateSessionStoreEntry(...)`; salvamentos diretos do armazenamento inteiro são ferramentas de compatibilidade e manutenção offline. Quando um Gateway está acessível, `openclaw sessions cleanup` e `openclaw agents delete` sem `--dry-run` delegam mutações do armazenamento ao Gateway para que a limpeza entre na mesma fila de gravador; `--store <path>` é o caminho explícito de reparo offline para manutenção direta de arquivos. A limpeza de `maxEntries` ainda é feita em lotes para limites de tamanho de produção, então um armazenamento pode exceder brevemente o limite configurado antes que a próxima limpeza de nível alto o regrave de volta para baixo. Leituras do armazenamento de sessão não removem nem limitam entradas durante a inicialização do Gateway; use gravações ou `openclaw sessions cleanup --enforce` para limpeza. `openclaw sessions cleanup --enforce` ainda aplica o limite configurado imediatamente.

A manutenção preserva ponteiros duráveis de conversas externas, como sessões de grupo
e sessões de chat com escopo de thread, mas entradas sintéticas de tempo de execução para cron, hooks,
Heartbeat, ACP e subagentes ainda podem ser removidas quando excedem a idade,
contagem ou orçamento de disco configurados.

OpenClaw não cria mais backups automáticos rotativos `sessions.json.bak.*` durante gravações do Gateway. A chave legada `session.maintenance.rotateBytes` é ignorada e `openclaw doctor --fix` a remove de configurações antigas.

Mutações de transcrição usam um bloqueio de gravação de sessão no arquivo de transcrição. A aquisição do bloqueio aguarda até
`session.writeLock.acquireTimeoutMs` antes de expor um erro de sessão ocupada; o padrão é `60000`
ms. Aumente isso somente quando preparação, limpeza, Compaction ou trabalho de espelhamento de transcrição legítimos causarem contenção
por mais tempo em máquinas lentas. Detecção de bloqueios obsoletos e avisos de tempo máximo de posse permanecem políticas separadas.

Ordem de imposição para limpeza por orçamento de disco (`mode: "enforce"`):

1. Remover primeiro os artefatos arquivados mais antigos, transcrições órfãs ou trajetórias órfãs.
2. Se ainda estiver acima do alvo, expulsar as entradas de sessão mais antigas e seus arquivos de transcrição/trajetória.
3. Continuar até que o uso esteja em ou abaixo de `highWaterBytes`.

Em `mode: "warn"`, OpenClaw relata possíveis expulsões, mas não altera o armazenamento/arquivos.

Execute manutenção sob demanda:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessões Cron e logs de execução

Execuções Cron isoladas também criam entradas/transcrições de sessão, e elas têm controles de retenção dedicados:

- `cron.sessionRetention` (padrão `24h`) remove sessões antigas de execuções Cron isoladas do armazenamento de sessão (`false` desativa).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` removem arquivos `~/.openclaw/cron/runs/<jobId>.jsonl` (padrões: `2_000_000` bytes e `2000` linhas).

Quando Cron força a criação de uma nova sessão de execução isolada, ele sanitiza a entrada da sessão anterior
`cron:<jobId>` antes de gravar a nova linha. Ele carrega preferências seguras,
como configurações de pensamento/rápido/verboso, rótulos e substituições explícitas
de modelo/autenticação selecionadas pelo usuário. Ele descarta contexto de conversa ambiente,
como roteamento de canal/grupo, política de envio ou fila, elevação, origem e vinculação
de tempo de execução ACP, para que uma nova execução isolada não possa herdar entrega obsoleta ou
autoridade de tempo de execução de uma execução mais antiga.

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

- **Redefinição** (`/new`, `/reset`) cria uma nova `sessionId` para essa `sessionKey`.
- **Redefinição diária** (padrão 4:00 AM no horário local do host do gateway) cria uma nova `sessionId` na próxima mensagem após o limite de redefinição.
- **Expiração por inatividade** (`session.reset.idleMinutes` ou legado `session.idleMinutes`) cria uma nova `sessionId` quando uma mensagem chega após a janela de inatividade. Quando redefinição diária + inatividade estão configuradas, vence a que expirar primeiro.
- **Eventos do sistema** (Heartbeat, despertares Cron, notificações exec, escrituração do gateway) podem alterar a linha da sessão, mas não estendem o frescor da redefinição diária/por inatividade. A rolagem de redefinição descarta avisos de eventos do sistema enfileirados para a sessão anterior antes que o prompt novo seja construído.
- **Política de fork pai** usa a ramificação ativa do PI ao criar uma thread ou fork de subagente. Se essa ramificação for grande demais, OpenClaw inicia o filho com contexto isolado em vez de falhar ou herdar histórico inutilizável. A política de dimensionamento é automática; a configuração legada `session.parentForkMaxTokens` é removida por `openclaw doctor --fix`.

Detalhe de implementação: a decisão acontece em `initSessionState()` em `src/auto-reply/reply/session.ts`.

---

## Esquema do armazenamento de sessão (`sessions.json`)

O tipo de valor do armazenamento é `SessionEntry` em `src/config/sessions.ts`.

Campos principais (não exaustivo):

- `sessionId`: id da transcrição atual (o nome do arquivo é derivado disso, a menos que `sessionFile` esteja definido)
- `sessionStartedAt`: timestamp de início da `sessionId` atual; o frescor da redefinição diária
  usa isso. Linhas legadas podem derivá-lo do cabeçalho de sessão JSONL.
- `lastInteractionAt`: timestamp da última interação real do usuário/canal; o frescor da redefinição
  por inatividade usa isso para que eventos de Heartbeat, Cron e exec não mantenham sessões
  vivas. Linhas legadas sem este campo fazem fallback para o horário de início de sessão recuperado
  para frescor de inatividade.
- `updatedAt`: timestamp da última mutação da linha do armazenamento, usado para listagem, remoção e
  escrituração. Ele não é a autoridade para o frescor de redefinição diária/por inatividade.
- `sessionFile`: substituição opcional explícita do caminho da transcrição
- `chatType`: `direct | group | room` (ajuda interfaces de usuário e política de envio)
- `provider`, `subject`, `room`, `space`, `displayName`: metadados para rotulagem de grupo/canal
- Alternâncias:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (substituição por sessão)
- Seleção de modelo:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contadores de tokens (melhor esforço / dependente de provedor):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: com que frequência a Compaction automática foi concluída para esta chave de sessão
- `memoryFlushAt`: timestamp do último esvaziamento de memória pré-Compaction
- `memoryFlushCompactionCount`: contagem de Compaction quando o último esvaziamento foi executado

O armazenamento é seguro para editar, mas o Gateway é a autoridade: ele pode regravar ou reidratar entradas conforme as sessões são executadas.

---

## Estrutura da transcrição (`*.jsonl`)

Transcrições são gerenciadas pelo `SessionManager` de `@mariozechner/pi-coding-agent`.

O arquivo é JSONL:

- Primeira linha: cabeçalho de sessão (`type: "session"`, inclui `id`, `cwd`, `timestamp`, `parentSession` opcional)
- Depois: entradas de sessão com `id` + `parentId` (árvore)

Tipos de entrada notáveis:

- `message`: mensagens de usuário/assistente/toolResult
- `custom_message`: mensagens injetadas por extensão que _entram_ no contexto do modelo (podem ficar ocultas da IU)
- `custom`: estado de extensão que _não_ entra no contexto do modelo
- `compaction`: resumo de Compaction persistido com `firstKeptEntryId` e `tokensBefore`
- `branch_summary`: resumo persistido ao navegar por uma ramificação de árvore

OpenClaw intencionalmente **não** “corrige” transcrições; o Gateway usa `SessionManager` para lê-las/gravá-las.

---

## Janelas de contexto vs tokens rastreados

Dois conceitos diferentes importam:

1. **Janela de contexto do modelo**: limite rígido por modelo (tokens visíveis ao modelo)
2. **Contadores do armazenamento de sessão**: estatísticas contínuas gravadas em `sessions.json` (usadas para /status e dashboards)

Se você está ajustando limites:

- A janela de contexto vem do catálogo de modelos (e pode ser substituída via configuração).
- `contextTokens` no armazenamento é um valor de estimativa/relatório em tempo de execução; não o trate como uma garantia estrita.

Para mais, consulte [/token-use](/pt-BR/reference/token-use).

---

## Compaction: o que é

Compaction resume conversas mais antigas em uma entrada `compaction` persistida na transcrição e mantém mensagens recentes intactas.

Após a Compaction, turnos futuros veem:

- O resumo de Compaction
- Mensagens após `firstKeptEntryId`

Compaction é **persistente** (ao contrário da limpeza de sessões). Consulte [/concepts/session-pruning](/pt-BR/concepts/session-pruning).

## Limites dos fragmentos de Compaction e pareamento de ferramentas

Quando o OpenClaw divide uma transcrição longa em fragmentos de Compaction, ele mantém
as chamadas de ferramenta do assistente pareadas com suas entradas `toolResult`
correspondentes.

- Se a divisão por proporção de tokens cair entre uma chamada de ferramenta e seu resultado, o OpenClaw
  desloca o limite para a mensagem de chamada de ferramenta do assistente, em vez de separar
  o par.
- Se um bloco de resultado de ferramenta no final ultrapassaria a meta do fragmento,
  o OpenClaw preserva esse bloco de ferramenta pendente e mantém a cauda não resumida
  intacta.
- Blocos de chamadas de ferramenta abortadas/com erro não mantêm aberta uma divisão pendente.

---

## Quando a auto-Compaction acontece (runtime do Pi)

No agente Pi incorporado, a auto-Compaction é acionada em dois casos:

1. **Recuperação de estouro**: o modelo retorna um erro de estouro de contexto
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` e variantes semelhantes no formato do provedor) → compactar → tentar novamente.
2. **Manutenção por limite**: após um turno bem-sucedido, quando:

`contextTokens > contextWindow - reserveTokens`

Onde:

- `contextWindow` é a janela de contexto do modelo
- `reserveTokens` é a folga reservada para prompts + a próxima saída do modelo

Essas são semânticas do runtime do Pi (o OpenClaw consome os eventos, mas o Pi decide quando compactar).

O OpenClaw também pode acionar uma Compaction local preliminar antes de abrir a próxima
execução quando `agents.defaults.compaction.maxActiveTranscriptBytes` está definido e o
arquivo de transcrição ativo atinge esse tamanho. Isso é uma proteção de tamanho de arquivo para o custo de
reabertura local, não arquivamento bruto: o OpenClaw ainda executa a Compaction semântica normal,
e ela exige `truncateAfterCompaction` para que o resumo compactado possa se tornar uma
nova transcrição sucessora.

Para execuções incorporadas do Pi, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
adiciona uma proteção opcional para o loop de ferramentas. Depois que um resultado de ferramenta é acrescentado e antes da
próxima chamada ao modelo, o OpenClaw estima a pressão do prompt usando a mesma lógica de orçamento
preliminar usada no início do turno. Se o contexto não couber mais, a proteção não
compacta dentro do hook `transformContext` do Pi. Ela emite um sinal estruturado de
pré-verificação no meio do turno, interrompe o envio do prompt atual e permite que o
loop externo de execução use o caminho de recuperação existente: truncar resultados de ferramenta grandes demais
quando isso for suficiente, ou acionar o modo de Compaction configurado e tentar novamente. A
opção fica desativada por padrão e funciona com os modos de Compaction `default` e `safeguard`,
incluindo Compaction de safeguard apoiada por provedor.
Isso é independente de `maxActiveTranscriptBytes`: a proteção por tamanho em bytes é executada
antes da abertura de um turno, enquanto a pré-verificação no meio do turno é executada depois no loop de ferramentas
incorporado do Pi, após novos resultados de ferramenta terem sido acrescentados.

---

## Configurações de Compaction (`reserveTokens`, `keepRecentTokens`)

As configurações de Compaction do Pi ficam nas configurações do Pi:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

O OpenClaw também aplica um piso de segurança para execuções incorporadas:

- Se `compaction.reserveTokens < reserveTokensFloor`, o OpenClaw aumenta o valor.
- O piso padrão é de `20000` tokens.
- Defina `agents.defaults.compaction.reserveTokensFloor: 0` para desativar o piso.
- Se já estiver maior, o OpenClaw deixa como está.
- O `/compact` manual respeita um `agents.defaults.compaction.keepRecentTokens`
  explícito e mantém o ponto de corte da cauda recente do Pi. Sem um orçamento de retenção explícito,
  a Compaction manual continua sendo um checkpoint rígido, e o contexto reconstruído começa a partir
  do novo resumo.
- Defina `agents.defaults.compaction.midTurnPrecheck.enabled: true` para executar a
  pré-verificação opcional do loop de ferramentas após novos resultados de ferramenta e antes da próxima chamada ao
  modelo. Isso é apenas um gatilho; a geração do resumo ainda usa o caminho de
  Compaction configurado. É independente de `maxActiveTranscriptBytes`, que é uma
  proteção por tamanho em bytes da transcrição ativa no início do turno.
- Defina `agents.defaults.compaction.maxActiveTranscriptBytes` como um valor em bytes ou
  uma string como `"20mb"` para executar Compaction local antes de um turno quando a
  transcrição ativa ficar grande. Essa proteção fica ativa somente quando
  `truncateAfterCompaction` também está habilitado. Deixe sem definir ou defina `0` para
  desativar.
- Quando `agents.defaults.compaction.truncateAfterCompaction` está habilitado,
  o OpenClaw alterna a transcrição ativa para um JSONL sucessor compactado após a
  Compaction. A transcrição completa antiga permanece arquivada e vinculada a partir do
  checkpoint de Compaction, em vez de ser reescrita no lugar.

Motivo: deixar folga suficiente para “tarefas de manutenção” entre turnos (como gravações de memória) antes que a Compaction se torne inevitável.

Implementação: `ensurePiCompactionReserveTokens()` em `src/agents/pi-settings.ts`
(chamado a partir de `src/agents/pi-embedded-runner.ts`).

---

## Provedores plugáveis de Compaction

Plugins podem registrar um provedor de Compaction via `registerCompactionProvider()` na API do Plugin. Quando `agents.defaults.compaction.provider` é definido como um ID de provedor registrado, a extensão safeguard delega a sumarização a esse provedor em vez do pipeline integrado `summarizeInStages`.

- `provider`: ID de um Plugin provedor de Compaction registrado. Deixe sem definir para a sumarização LLM padrão.
- Definir um `provider` força `mode: "safeguard"`.
- Provedores recebem as mesmas instruções de Compaction e política de preservação de identificadores que o caminho integrado.
- O safeguard ainda preserva o contexto de sufixo de turnos recentes e turnos divididos após a saída do provedor.
- A sumarização safeguard integrada recondensa resumos anteriores com novas mensagens
  em vez de preservar integralmente o resumo anterior de forma literal.
- O modo safeguard habilita auditorias de qualidade de resumo por padrão; defina
  `qualityGuard.enabled: false` para pular o comportamento de nova tentativa quando a saída estiver malformada.
- Se o provedor falhar ou retornar um resultado vazio, o OpenClaw volta automaticamente para a sumarização LLM integrada.
- Sinais de aborto/timeout são relançados (não engolidos) para respeitar o cancelamento do chamador.

Fonte: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Superfícies visíveis ao usuário

Você pode observar a Compaction e o estado da sessão via:

- `/status` (em qualquer sessão de chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Modo verboso: `🧹 Auto-compaction complete` + contagem de Compaction

---

## Manutenção silenciosa (`NO_REPLY`)

O OpenClaw oferece suporte a turnos “silenciosos” para tarefas em segundo plano nas quais o usuário não deve ver saída intermediária.

Convenção:

- O assistente inicia sua saída com o token silencioso exato `NO_REPLY` /
  `no_reply` para indicar “não entregar uma resposta ao usuário”.
- O OpenClaw remove/suprime isso na camada de entrega.
- A supressão por token silencioso exato não diferencia maiúsculas de minúsculas, então `NO_REPLY` e
  `no_reply` contam quando toda a carga útil é apenas o token silencioso.
- Isso é apenas para turnos realmente em segundo plano/sem entrega; não é um atalho para
  solicitações comuns e acionáveis do usuário.

A partir de `2026.1.10`, o OpenClaw também suprime **streaming de rascunho/digitação** quando um
fragmento parcial começa com `NO_REPLY`, para que operações silenciosas não vazem saída
parcial no meio do turno.

---

## "Descarga de memória" pré-Compaction (implementada)

Objetivo: antes que a auto-Compaction aconteça, executar um turno agêntico silencioso que grave estado durável
em disco (por exemplo, `memory/YYYY-MM-DD.md` no workspace do agente), para que a Compaction não possa
apagar contexto crítico.

O OpenClaw usa a abordagem de **descarga pré-limite**:

1. Monitorar o uso de contexto da sessão.
2. Quando ele cruzar um “limite suave” (abaixo do limite de Compaction do Pi), executar uma diretiva silenciosa
   de “gravar memória agora” para o agente.
3. Usar o token silencioso exato `NO_REPLY` / `no_reply` para que o usuário não veja
   nada.

Configuração (`agents.defaults.compaction.memoryFlush`):

- `enabled` (padrão: `true`)
- `model` (substituição opcional exata de provedor/modelo para o turno de descarga, por exemplo `ollama/qwen3:8b`)
- `softThresholdTokens` (padrão: `4000`)
- `prompt` (mensagem de usuário para o turno de descarga)
- `systemPrompt` (prompt de sistema extra anexado ao turno de descarga)

Observações:

- O prompt/prompt de sistema padrão inclui uma dica `NO_REPLY` para suprimir
  a entrega.
- Quando `model` está definido, o turno de descarga usa esse modelo sem herdar a
  cadeia de fallback da sessão ativa, para que a manutenção apenas local não faça fallback silencioso
  para um modelo de conversa pago.
- A descarga é executada uma vez por ciclo de Compaction (rastreada em `sessions.json`).
- A descarga é executada somente para sessões incorporadas do Pi (backends de CLI a ignoram).
- A descarga é ignorada quando o workspace da sessão é somente leitura (`workspaceAccess: "ro"` ou `"none"`).
- Consulte [Memória](/pt-BR/concepts/memory) para o layout de arquivos do workspace e os padrões de gravação.

O Pi também expõe um hook `session_before_compact` na API de extensão, mas hoje a lógica de
descarga do OpenClaw fica no lado do Gateway.

---

## Checklist de solução de problemas

- Chave da sessão errada? Comece por [/concepts/session](/pt-BR/concepts/session) e confirme o `sessionKey` em `/status`.
- Incompatibilidade entre armazenamento e transcrição? Confirme o host do Gateway e o caminho de armazenamento em `openclaw status`.
- Excesso de Compaction? Verifique:
  - janela de contexto do modelo (pequena demais)
  - configurações de Compaction (`reserveTokens` alto demais para a janela do modelo pode causar Compaction mais cedo)
  - inchaço de resultados de ferramenta: habilite/ajuste a poda de sessão
- Turnos silenciosos vazando? Confirme que a resposta começa com `NO_REPLY` (token exato sem diferenciar maiúsculas de minúsculas) e que você está em uma build que inclui a correção de supressão de streaming.

## Relacionados

- [Gerenciamento de sessão](/pt-BR/concepts/session)
- [Poda de sessão](/pt-BR/concepts/session-pruning)
- [Motor de contexto](/pt-BR/concepts/context-engine)
