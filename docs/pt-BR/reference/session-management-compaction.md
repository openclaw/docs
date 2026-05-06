---
read_when:
    - Você precisa depurar IDs de sessão, JSONL de transcrição ou campos de sessions.json
    - Você está alterando o comportamento de compactação automática ou adicionando manutenção "pré-compactação"
    - Você quer implementar descargas de memória ou turnos silenciosos do sistema
summary: 'Análise aprofundada: armazenamento de sessões + transcrições, ciclo de vida e detalhes internos da Compaction automática'
title: Análise detalhada do gerenciamento de sessões
x-i18n:
    generated_at: "2026-05-06T09:13:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ade29b83c2b3857c52e56275ed11c5b1f3cd07050ba9f35ea49ad427efcc39d
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw gerencia sessões de ponta a ponta nestas áreas:

- **Roteamento de sessão** (como mensagens recebidas são mapeadas para uma `sessionKey`)
- **Armazenamento de sessões** (`sessions.json`) e o que ele rastreia
- **Persistência de transcrição** (`*.jsonl`) e sua estrutura
- **Higiene de transcrição** (ajustes específicos de provedor antes das execuções)
- **Limites de contexto** (janela de contexto vs tokens rastreados)
- **Compaction** (Compaction manual e automática) e onde conectar trabalho pré-Compaction
- **Manutenção silenciosa** (gravações de memória que não devem produzir saída visível ao usuário)

Se você quiser primeiro uma visão geral de nível mais alto, comece por:

- [Gerenciamento de sessão](/pt-BR/concepts/session)
- [Compaction](/pt-BR/concepts/compaction)
- [Visão geral de memória](/pt-BR/concepts/memory)
- [Busca de memória](/pt-BR/concepts/memory-search)
- [Poda de sessões](/pt-BR/concepts/session-pruning)
- [Higiene de transcrição](/pt-BR/reference/transcript-hygiene)

---

## Fonte da verdade: o Gateway

OpenClaw é projetado em torno de um único **processo Gateway** que controla o estado das sessões.

- UIs (app macOS, Control UI web, TUI) devem consultar o Gateway para listas de sessões e contagens de tokens.
- No modo remoto, os arquivos de sessão ficam no host remoto; "verificar seus arquivos locais do Mac" não refletirá o que o Gateway está usando.

---

## Duas camadas de persistência

OpenClaw persiste sessões em duas camadas:

1. **Armazenamento de sessões (`sessions.json`)**
   - Mapa chave/valor: `sessionKey -> SessionEntry`
   - Pequeno, mutável, seguro para editar (ou excluir entradas)
   - Rastreia metadados da sessão (id da sessão atual, última atividade, alternâncias, contadores de tokens etc.)

2. **Transcrição (`<sessionId>.jsonl`)**
   - Transcrição somente anexada com estrutura de árvore (entradas têm `id` + `parentId`)
   - Armazena a conversa real + chamadas de ferramenta + resumos de Compaction
   - Usada para reconstruir o contexto do modelo em turnos futuros
   - Grandes checkpoints de depuração pré-Compaction são ignorados quando a transcrição
     ativa excede o limite de tamanho de checkpoint, evitando uma segunda cópia gigante
     `.checkpoint.*.jsonl`.

Leitores de histórico do Gateway devem evitar materializar a transcrição inteira, a menos que
a superfície precise explicitamente de acesso histórico arbitrário. Histórico de primeira página,
histórico de chat incorporado, recuperação de reinicialização e verificações de tokens/uso usam
leituras de cauda limitadas. Varreduras completas de transcrição passam pelo índice assíncrono de transcrição, que é
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

A persistência de sessões tem controles automáticos de manutenção (`session.maintenance`) para `sessions.json`, artefatos de transcrição e sidecars de trajetória:

- `mode`: `warn` (padrão) ou `enforce`
- `pruneAfter`: limite de idade para entradas obsoletas (padrão `30d`)
- `maxEntries`: limita entradas em `sessions.json` (padrão `500`)
- `resetArchiveRetention`: retenção para arquivos de transcrição `*.reset.<timestamp>` (padrão: igual a `pruneAfter`; `false` desativa a limpeza)
- `maxDiskBytes`: orçamento opcional do diretório de sessões
- `highWaterBytes`: alvo opcional após a limpeza (padrão `80%` de `maxDiskBytes`)

Gravações normais do Gateway passam por um gravador de sessão por armazenamento que serializa mutações em processo sem obter um bloqueio de arquivo em tempo de execução. Auxiliares de patch no caminho crítico emprestam o cache mutável validado enquanto mantêm esse slot de gravador, então arquivos `sessions.json` grandes não são clonados nem relidos para cada atualização de metadados. Código em tempo de execução deve preferir `updateSessionStore(...)` ou `updateSessionStoreEntry(...)`; salvamentos diretos do armazenamento inteiro são ferramentas de compatibilidade e manutenção offline. Quando um Gateway está acessível, `openclaw sessions cleanup` e `openclaw agents delete` sem simulação delegam mutações de armazenamento ao Gateway para que a limpeza entre na mesma fila de gravação; `--store <path>` é o caminho explícito de reparo offline para manutenção direta de arquivos. A limpeza de `maxEntries` ainda é em lotes para limites de tamanho de produção, então um armazenamento pode exceder brevemente o limite configurado antes que a próxima limpeza de marca alta o reescreva para baixo. Leituras do armazenamento de sessões não podam nem limitam entradas durante a inicialização do Gateway; use gravações ou `openclaw sessions cleanup --enforce` para limpeza. `openclaw sessions cleanup --enforce` ainda aplica o limite configurado imediatamente e poda artefatos antigos de transcrição, checkpoint e trajetória sem referência, mesmo quando nenhum orçamento de disco está configurado.

A manutenção preserva ponteiros duráveis de conversas externas, como sessões de grupo
e sessões de chat com escopo de thread, mas entradas sintéticas de runtime para Cron, hooks,
Heartbeat, ACP e subagentes ainda podem ser removidas quando excedem o
orçamento configurado de idade, contagem ou disco.

OpenClaw não cria mais backups automáticos rotativos `sessions.json.bak.*` durante gravações do Gateway. A chave legada `session.maintenance.rotateBytes` é ignorada e `openclaw doctor --fix` a remove de configurações antigas.

Mutações de transcrição usam um bloqueio de gravação de sessão no arquivo de transcrição. A aquisição do bloqueio aguarda até
`session.writeLock.acquireTimeoutMs` antes de expor um erro de sessão ocupada; o padrão é `60000`
ms. Aumente isso apenas quando trabalho legítimo de preparação, limpeza, Compaction ou espelhamento de transcrição disputar
por mais tempo em máquinas lentas. Detecção de bloqueio obsoleto e avisos de tempo máximo de retenção continuam sendo políticas separadas.

Ordem de aplicação para limpeza de orçamento de disco (`mode: "enforce"`):

1. Remover primeiro os artefatos arquivados mais antigos, transcrições órfãs ou artefatos de trajetória órfãos.
2. Se ainda estiver acima do alvo, remover as entradas de sessão mais antigas e seus arquivos de transcrição/trajetória.
3. Continuar até que o uso esteja em ou abaixo de `highWaterBytes`.

Em `mode: "warn"`, OpenClaw relata possíveis remoções, mas não altera o armazenamento/arquivos.

Execute a manutenção sob demanda:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessões Cron e logs de execução

Execuções Cron isoladas também criam entradas/transcrições de sessão e têm controles de retenção dedicados:

- `cron.sessionRetention` (padrão `24h`) poda sessões antigas de execução Cron isolada do armazenamento de sessões (`false` desativa).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` podam arquivos `~/.openclaw/cron/runs/<jobId>.jsonl` (padrões: `2_000_000` bytes e `2000` linhas).

Quando o Cron força a criação de uma nova sessão de execução isolada, ele sanitiza a entrada de sessão anterior
`cron:<jobId>` antes de escrever a nova linha. Ele carrega preferências seguras,
como configurações de pensamento/rápido/verboso, rótulos e substituições explícitas
de modelo/autenticação selecionadas pelo usuário. Ele descarta contexto de conversa ambiente, como
roteamento de canal/grupo, política de envio ou fila, elevação, origem e vínculo de runtime ACP,
para que uma nova execução isolada não herde entrega obsoleta ou
autoridade de runtime de uma execução antiga.

---

## Chaves de sessão (`sessionKey`)

Uma `sessionKey` identifica _em qual compartimento de conversa_ você está (roteamento + isolamento).

Padrões comuns:

- Chat principal/direto (por agente): `agent:<agentId>:<mainKey>` (padrão `main`)
- Grupo: `agent:<agentId>:<channel>:group:<id>`
- Sala/canal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` ou `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (a menos que seja substituído)

As regras canônicas estão documentadas em [/concepts/session](/pt-BR/concepts/session).

---

## IDs de sessão (`sessionId`)

Cada `sessionKey` aponta para uma `sessionId` atual (o arquivo de transcrição que continua a conversa).

Regras gerais:

- **Redefinição** (`/new`, `/reset`) cria uma nova `sessionId` para essa `sessionKey`.
- **Redefinição diária** (padrão 4:00 AM no horário local do host do gateway) cria uma nova `sessionId` na próxima mensagem após o limite de redefinição.
- **Expiração por inatividade** (`session.reset.idleMinutes` ou legado `session.idleMinutes`) cria uma nova `sessionId` quando uma mensagem chega após a janela de inatividade. Quando diária + inatividade estão configuradas, vence o que expirar primeiro.
- **Eventos do sistema** (Heartbeat, despertares Cron, notificações de execução, contabilidade do gateway) podem alterar a linha da sessão, mas não estendem a validade da redefinição diária/por inatividade. A troca por redefinição descarta avisos enfileirados de eventos do sistema para a sessão anterior antes que o prompt novo seja construído.
- **Política de bifurcação de pai** usa a ramificação ativa do Pi ao criar uma thread ou bifurcação de subagente. Se essa ramificação for grande demais, OpenClaw inicia o filho com contexto isolado em vez de falhar ou herdar histórico inutilizável. A política de dimensionamento é automática; a configuração legada `session.parentForkMaxTokens` é removida por `openclaw doctor --fix`.

Detalhe de implementação: a decisão acontece em `initSessionState()` em `src/auto-reply/reply/session.ts`.

---

## Esquema do armazenamento de sessões (`sessions.json`)

O tipo de valor do armazenamento é `SessionEntry` em `src/config/sessions.ts`.

Campos principais (não exaustivos):

- `sessionId`: id da transcrição atual (o nome do arquivo é derivado disso, a menos que `sessionFile` esteja definido)
- `sessionStartedAt`: timestamp de início da `sessionId` atual; a validade da redefinição diária
  usa isso. Linhas legadas podem derivá-lo do cabeçalho de sessão JSONL.
- `lastInteractionAt`: timestamp da última interação real de usuário/canal; a validade da redefinição por inatividade
  usa isso para que eventos Heartbeat, Cron e exec não mantenham sessões
  vivas. Linhas legadas sem esse campo voltam para o horário de início da sessão recuperado
  para validade de inatividade.
- `updatedAt`: timestamp da última mutação da linha no armazenamento, usado para listagem, poda e
  contabilidade. Ele não é a autoridade para validade de redefinição diária/por inatividade.
- `sessionFile`: substituição opcional explícita do caminho da transcrição
- `chatType`: `direct | group | room` (ajuda UIs e política de envio)
- `provider`, `subject`, `room`, `space`, `displayName`: metadados para rotulagem de grupo/canal
- Alternâncias:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (substituição por sessão)
- Seleção de modelo:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contadores de tokens (melhor esforço / dependente do provedor):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: quantas vezes a Compaction automática foi concluída para esta chave de sessão
- `memoryFlushAt`: timestamp do último flush de memória pré-Compaction
- `memoryFlushCompactionCount`: contagem de Compaction quando o último flush foi executado

O armazenamento é seguro para editar, mas o Gateway é a autoridade: ele pode reescrever ou reidratar entradas enquanto as sessões são executadas.

---

## Estrutura da transcrição (`*.jsonl`)

Transcrições são gerenciadas pelo `SessionManager` de `@mariozechner/pi-coding-agent`.

O arquivo é JSONL:

- Primeira linha: cabeçalho da sessão (`type: "session"`, inclui `id`, `cwd`, `timestamp`, `parentSession` opcional)
- Depois: entradas de sessão com `id` + `parentId` (árvore)

Tipos de entrada notáveis:

- `message`: mensagens de usuário/assistente/toolResult
- `custom_message`: mensagens injetadas por extensão que _entram_ no contexto do modelo (podem ficar ocultas da UI)
- `custom`: estado de extensão que _não_ entra no contexto do modelo
- `compaction`: resumo de Compaction persistido com `firstKeptEntryId` e `tokensBefore`
- `branch_summary`: resumo persistido ao navegar por uma ramificação de árvore

OpenClaw intencionalmente **não** "corrige" transcrições; o Gateway usa `SessionManager` para lê-las/escrevê-las.

---

## Janelas de contexto vs tokens rastreados

Dois conceitos diferentes importam:

1. **Janela de contexto do modelo**: limite rígido por modelo (tokens visíveis ao modelo)
2. **Contadores do armazenamento de sessões**: estatísticas contínuas gravadas em `sessions.json` (usadas para /status e painéis)

Se você está ajustando limites:

- A janela de contexto vem do catálogo de modelos (e pode ser substituída via configuração).
- `contextTokens` no armazenamento é um valor de estimativa/relatório em runtime; não o trate como garantia estrita.

Para mais, consulte [/token-use](/pt-BR/reference/token-use).

---

## Compaction: o que é

Compaction resume conversas antigas em uma entrada `compaction` persistida na transcrição e mantém mensagens recentes intactas.

Após a Compaction, turnos futuros veem:

- O resumo de Compaction
- Mensagens após `firstKeptEntryId`

Compaction é **persistente** (diferentemente da poda de sessão). Consulte [/concepts/session-pruning](/pt-BR/concepts/session-pruning).

## Limites de chunks de Compaction e pareamento de ferramentas

Quando o OpenClaw divide uma transcrição longa em chunks de Compaction, ele mantém
as chamadas de ferramenta do assistente pareadas com suas entradas `toolResult`
correspondentes.

- Se a divisão por proporção de tokens cair entre uma chamada de ferramenta e seu resultado, o OpenClaw
  desloca o limite para a mensagem de chamada de ferramenta do assistente em vez de separar
  o par.
- Se um bloco final de resultado de ferramenta ultrapassaria a meta do chunk,
  o OpenClaw preserva esse bloco de ferramenta pendente e mantém intacta a cauda
  não resumida.
- Blocos de chamada de ferramenta abortados/com erro não mantêm uma divisão pendente aberta.

---

## Quando a Compaction automática acontece (runtime Pi)

No agente Pi integrado, a Compaction automática é acionada em dois casos:

1. **Recuperação de estouro**: o modelo retorna um erro de estouro de contexto
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` e variantes semelhantes no formato do provedor) → compactar → tentar novamente.
2. **Manutenção por limite**: depois de um turno bem-sucedido, quando:

`contextTokens > contextWindow - reserveTokens`

Onde:

- `contextWindow` é a janela de contexto do modelo
- `reserveTokens` é a margem reservada para prompts + a próxima saída do modelo

Estas são semânticas do runtime Pi (o OpenClaw consome os eventos, mas o Pi decide quando compactar).

O OpenClaw também pode acionar uma Compaction local de pré-verificação antes de abrir a próxima
execução quando `agents.defaults.compaction.maxActiveTranscriptBytes` está definido e o
arquivo de transcrição ativo atinge esse tamanho. Essa é uma proteção por tamanho de arquivo para o custo
de reabertura local, não arquivamento bruto: o OpenClaw ainda executa a Compaction semântica normal,
e ela exige `truncateAfterCompaction` para que o resumo compactado possa se tornar uma
nova transcrição sucessora.

Para execuções Pi integradas, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
adiciona uma proteção opcional de loop de ferramentas. Depois que um resultado de ferramenta é anexado e antes da
próxima chamada ao modelo, o OpenClaw estima a pressão do prompt usando a mesma lógica de orçamento
de pré-verificação usada no início do turno. Se o contexto não couber mais, a proteção
não compacta dentro do hook `transformContext` do Pi. Ela emite um sinal estruturado
de pré-verificação no meio do turno, interrompe o envio do prompt atual e permite que o
loop de execução externo use o caminho de recuperação existente: truncar resultados de ferramenta grandes demais
quando isso for suficiente, ou acionar o modo de Compaction configurado e tentar novamente. A
opção é desativada por padrão e funciona com os modos de Compaction `default` e `safeguard`,
incluindo Compaction safeguard apoiada por provedor.
Isso é independente de `maxActiveTranscriptBytes`: a proteção por tamanho em bytes é executada
antes da abertura de um turno, enquanto a pré-verificação no meio do turno é executada depois no loop de ferramentas Pi integrado
após novos resultados de ferramenta terem sido anexados.

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

O OpenClaw também aplica um piso de segurança para execuções integradas:

- Se `compaction.reserveTokens < reserveTokensFloor`, o OpenClaw aumenta o valor.
- O piso padrão é `20000` tokens.
- Defina `agents.defaults.compaction.reserveTokensFloor: 0` para desativar o piso.
- Se ele já for maior, o OpenClaw deixa como está.
- `/compact` manual respeita um `agents.defaults.compaction.keepRecentTokens` explícito
  e mantém o ponto de corte da cauda recente do Pi. Sem um orçamento explícito de retenção,
  a Compaction manual permanece um checkpoint rígido e o contexto reconstruído começa a partir do
  novo resumo.
- Defina `agents.defaults.compaction.midTurnPrecheck.enabled: true` para executar a
  pré-verificação opcional de loop de ferramentas após novos resultados de ferramenta e antes da próxima chamada ao modelo.
  Isso é apenas um acionador; a geração do resumo ainda usa o caminho de Compaction configurado.
  Ela é independente de `maxActiveTranscriptBytes`, que é uma
  proteção por tamanho em bytes da transcrição ativa no início do turno.
- Defina `agents.defaults.compaction.maxActiveTranscriptBytes` como um valor em bytes ou
  string como `"20mb"` para executar Compaction local antes de um turno quando a transcrição
  ativa ficar grande. Essa proteção fica ativa somente quando
  `truncateAfterCompaction` também está habilitado. Deixe indefinido ou defina como `0` para
  desativar.
- Quando `agents.defaults.compaction.truncateAfterCompaction` está habilitado,
  o OpenClaw rotaciona a transcrição ativa para um JSONL sucessor compactado após
  a Compaction. A transcrição completa antiga permanece arquivada e vinculada a partir do
  checkpoint de Compaction em vez de ser reescrita no local.

Por quê: deixar margem suficiente para "manutenção" de vários turnos (como gravações de memória) antes que a Compaction se torne inevitável.

Implementação: `ensurePiCompactionReserveTokens()` em `src/agents/pi-settings.ts`
(chamado a partir de `src/agents/pi-embedded-runner.ts`).

---

## Provedores de Compaction plugáveis

Plugins podem registrar um provedor de Compaction via `registerCompactionProvider()` na API do plugin. Quando `agents.defaults.compaction.provider` é definido como um id de provedor registrado, o plugin safeguard delega a sumarização a esse provedor em vez do pipeline integrado `summarizeInStages`.

- `provider`: id de um plugin provedor de Compaction registrado. Deixe indefinido para sumarização LLM padrão.
- Definir um `provider` força `mode: "safeguard"`.
- Provedores recebem as mesmas instruções de Compaction e política de preservação de identificadores que o caminho integrado.
- O safeguard ainda preserva contexto de sufixo de turnos recentes e turnos divididos após a saída do provedor.
- A sumarização safeguard integrada redestila resumos anteriores com novas mensagens
  em vez de preservar o resumo anterior completo literalmente.
- O modo safeguard habilita auditorias de qualidade do resumo por padrão; defina
  `qualityGuard.enabled: false` para ignorar o comportamento de nova tentativa em saída malformada.
- Se o provedor falhar ou retornar um resultado vazio, o OpenClaw volta automaticamente para a sumarização LLM integrada.
- Sinais de abort/timeout são relançados (não engolidos) para respeitar o cancelamento do chamador.

Fonte: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Superfícies visíveis ao usuário

Você pode observar o estado de Compaction e da sessão via:

- `/status` (em qualquer sessão de chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Modo detalhado: `🧹 Auto-compaction complete` + contagem de Compaction

---

## Manutenção silenciosa (`NO_REPLY`)

O OpenClaw oferece suporte a turnos "silenciosos" para tarefas em segundo plano em que o usuário não deve ver saída intermediária.

Convenção:

- O assistente inicia sua saída com o token silencioso exato `NO_REPLY` /
  `no_reply` para indicar "não entregar uma resposta ao usuário".
- O OpenClaw remove/suprime isso na camada de entrega.
- A supressão do token silencioso exato não diferencia maiúsculas de minúsculas, então `NO_REPLY` e
  `no_reply` ambos contam quando todo o payload é apenas o token silencioso.
- Isso é apenas para turnos verdadeiramente em segundo plano/sem entrega; não é um atalho para
  solicitações comuns acionáveis do usuário.

A partir de `2026.1.10`, o OpenClaw também suprime **streaming de rascunho/digitação** quando um
chunk parcial começa com `NO_REPLY`, para que operações silenciosas não vazem saída parcial
no meio do turno.

---

## "Flush de memória" pré-Compaction (implementado)

Objetivo: antes que a Compaction automática aconteça, executar um turno agêntico silencioso que grava estado
durável em disco (por exemplo, `memory/YYYY-MM-DD.md` no workspace do agente) para que a Compaction não possa
apagar contexto crítico.

O OpenClaw usa a abordagem de **flush antes do limite**:

1. Monitorar o uso de contexto da sessão.
2. Quando ele cruza um "limite suave" (abaixo do limite de Compaction do Pi), executar uma diretiva silenciosa
   de "gravar memória agora" para o agente.
3. Usar o token silencioso exato `NO_REPLY` / `no_reply` para que o usuário não veja
   nada.

Configuração (`agents.defaults.compaction.memoryFlush`):

- `enabled` (padrão: `true`)
- `model` (sobrescrita opcional exata de provedor/modelo para o turno de flush, por exemplo `ollama/qwen3:8b`)
- `softThresholdTokens` (padrão: `4000`)
- `prompt` (mensagem de usuário para o turno de flush)
- `systemPrompt` (prompt de sistema extra anexado ao turno de flush)

Observações:

- O prompt/prompt de sistema padrão inclui uma dica `NO_REPLY` para suprimir
  a entrega.
- Quando `model` está definido, o turno de flush usa esse modelo sem herdar a
  cadeia de fallback da sessão ativa, para que a manutenção somente local não faça fallback silenciosamente
  para um modelo de conversa pago.
- O flush é executado uma vez por ciclo de Compaction (rastreado em `sessions.json`).
- O flush é executado apenas para sessões Pi integradas (backends CLI o ignoram).
- O flush é ignorado quando o workspace da sessão é somente leitura (`workspaceAccess: "ro"` ou `"none"`).
- Consulte [Memória](/pt-BR/concepts/memory) para o layout de arquivos do workspace e padrões de gravação.

O Pi também expõe um hook `session_before_compact` na API de plugin, mas a lógica de
flush do OpenClaw fica hoje no lado do Gateway.

---

## Checklist de solução de problemas

- Chave de sessão incorreta? Comece com [/concepts/session](/pt-BR/concepts/session) e confirme o `sessionKey` em `/status`.
- Incompatibilidade entre store e transcrição? Confirme o host do Gateway e o caminho do store a partir de `openclaw status`.
- Spam de Compaction? Verifique:
  - janela de contexto do modelo (pequena demais)
  - configurações de Compaction (`reserveTokens` alto demais para a janela do modelo pode causar Compaction antecipada)
  - crescimento excessivo de resultados de ferramenta: habilite/ajuste a poda de sessão
- Turnos silenciosos vazando? Confirme que a resposta começa com `NO_REPLY` (token exato sem diferenciar maiúsculas de minúsculas) e que você está em uma build que inclui a correção de supressão de streaming.

## Relacionados

- [Gerenciamento de sessões](/pt-BR/concepts/session)
- [Poda de sessão](/pt-BR/concepts/session-pruning)
- [Mecanismo de contexto](/pt-BR/concepts/context-engine)
