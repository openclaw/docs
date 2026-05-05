---
read_when:
    - Você precisa depurar IDs de sessão, JSONL de transcrição ou campos de sessions.json
    - Você está alterando o comportamento de auto-Compaction ou adicionando tarefas de limpeza de “pré-Compaction”
    - Você quer implementar liberações de memória ou turnos silenciosos do sistema
summary: 'Aprofundamento: armazenamento de sessões + transcrições, ciclo de vida e aspectos internos de (auto)Compaction'
title: Aprofundamento em gerenciamento de sessões
x-i18n:
    generated_at: "2026-05-05T08:26:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3161dd9c98bff7ea24266f44a9261693d8a9ee2b47d9af2d152de7057016748b
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw gerencia sessões de ponta a ponta nestas áreas:

- **Roteamento de sessão** (como mensagens recebidas são mapeadas para uma `sessionKey`)
- **Armazenamento de sessões** (`sessions.json`) e o que ele rastreia
- **Persistência de transcrições** (`*.jsonl`) e sua estrutura
- **Higiene de transcrições** (ajustes específicos de provedor antes das execuções)
- **Limites de contexto** (janela de contexto vs tokens rastreados)
- **Compaction** (manual e auto-Compaction) e onde conectar trabalho pré-Compaction
- **Manutenção silenciosa** (gravações de memória que não devem produzir saída visível ao usuário)

Se você quiser primeiro uma visão geral de nível mais alto, comece com:

- [Gerenciamento de sessões](/pt-BR/concepts/session)
- [Compaction](/pt-BR/concepts/compaction)
- [Visão geral da memória](/pt-BR/concepts/memory)
- [Busca na memória](/pt-BR/concepts/memory-search)
- [Poda de sessões](/pt-BR/concepts/session-pruning)
- [Higiene de transcrições](/pt-BR/reference/transcript-hygiene)

---

## Fonte da verdade: o Gateway

OpenClaw foi projetado em torno de um único **processo Gateway** que possui o estado das sessões.

- UIs (app macOS, Control UI web, TUI) devem consultar o Gateway para obter listas de sessões e contagens de tokens.
- No modo remoto, os arquivos de sessão ficam no host remoto; “verificar seus arquivos locais do Mac” não refletirá o que o Gateway está usando.

---

## Duas camadas de persistência

OpenClaw persiste sessões em duas camadas:

1. **Armazenamento de sessões (`sessions.json`)**
   - Mapa chave/valor: `sessionKey -> SessionEntry`
   - Pequeno, mutável, seguro para editar (ou excluir entradas)
   - Rastreia metadados da sessão (id da sessão atual, última atividade, alternâncias, contadores de tokens etc.)

2. **Transcrição (`<sessionId>.jsonl`)**
   - Transcrição somente para anexação com estrutura de árvore (entradas têm `id` + `parentId`)
   - Armazena a conversa real + chamadas de ferramenta + resumos de Compaction
   - Usada para reconstruir o contexto do modelo para turnos futuros
   - Grandes checkpoints de depuração pré-Compaction são ignorados quando a transcrição ativa
     excede o limite de tamanho de checkpoint, evitando uma segunda cópia gigante
     `.checkpoint.*.jsonl`.

Leitores de histórico do Gateway devem evitar materializar a transcrição inteira, a menos que
a superfície precise explicitamente de acesso histórico arbitrário. Histórico da primeira página,
histórico de chat incorporado, recuperação de reinicialização e verificações de tokens/uso usam
leituras limitadas do fim do arquivo. Varreduras completas da transcrição passam pelo índice assíncrono
de transcrições, que é armazenado em cache por caminho de arquivo mais `mtimeMs`/`size` e compartilhado entre leitores concorrentes.

---

## Locais no disco

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
- `maxEntries`: limite de entradas em `sessions.json` (padrão `500`)
- `resetArchiveRetention`: retenção para arquivos de transcrição `*.reset.<timestamp>` (padrão: igual a `pruneAfter`; `false` desativa a limpeza)
- `maxDiskBytes`: orçamento opcional do diretório de sessões
- `highWaterBytes`: alvo opcional após a limpeza (padrão `80%` de `maxDiskBytes`)

Gravações normais do Gateway passam por um gravador de sessão por armazenamento que serializa mutações em processo sem usar um bloqueio de arquivo em tempo de execução. Auxiliares de patch de caminho quente pegam emprestado o cache mutável validado enquanto mantêm esse slot do gravador, então arquivos `sessions.json` grandes não são clonados nem relidos para cada atualização de metadados. Código de tempo de execução deve preferir `updateSessionStore(...)` ou `updateSessionStoreEntry(...)`; salvamentos diretos do armazenamento inteiro são ferramentas de compatibilidade e manutenção offline. Quando um Gateway está acessível, `openclaw sessions cleanup` e `openclaw agents delete` sem dry-run delegam mutações do armazenamento ao Gateway para que a limpeza entre na mesma fila do gravador; `--store <path>` é o caminho explícito de reparo offline para manutenção direta de arquivos. A limpeza de `maxEntries` ainda é em lotes para limites de tamanho de produção, então um armazenamento pode exceder brevemente o limite configurado antes de a próxima limpeza de marca alta regravá-lo reduzido. Leituras do armazenamento de sessões não podam nem limitam entradas durante a inicialização do Gateway; use gravações ou `openclaw sessions cleanup --enforce` para limpeza. `openclaw sessions cleanup --enforce` ainda aplica o limite configurado imediatamente e poda artefatos antigos de transcrição, checkpoint e trajetória não referenciados, mesmo quando nenhum orçamento de disco está configurado.

A manutenção preserva ponteiros duráveis de conversas externas, como sessões de grupo
e sessões de chat com escopo de thread, mas entradas sintéticas de tempo de execução para Cron, hooks,
Heartbeat, ACP e subagentes ainda podem ser removidas quando excedem a
idade, contagem ou orçamento de disco configurados.

OpenClaw não cria mais backups automáticos de rotação `sessions.json.bak.*` durante gravações do Gateway. A chave legada `session.maintenance.rotateBytes` é ignorada e `openclaw doctor --fix` a remove de configurações antigas.

Mutações de transcrição usam um bloqueio de escrita de sessão no arquivo de transcrição. A aquisição do bloqueio aguarda até
`session.writeLock.acquireTimeoutMs` antes de expor um erro de sessão ocupada; o padrão é `60000`
ms. Aumente isso somente quando trabalho legítimo de preparação, limpeza, Compaction ou espelhamento de transcrição disputar
por mais tempo em máquinas lentas. Detecção de bloqueio obsoleto e avisos de tempo máximo de retenção continuam sendo políticas separadas.

Ordem de aplicação para limpeza do orçamento de disco (`mode: "enforce"`):

1. Remova primeiro os artefatos arquivados mais antigos, transcrições órfãs ou trajetórias órfãs.
2. Se ainda estiver acima do alvo, expulse as entradas de sessão mais antigas e seus arquivos de transcrição/trajetória.
3. Continue até o uso ficar em ou abaixo de `highWaterBytes`.

Em `mode: "warn"`, OpenClaw relata possíveis expulsões, mas não altera o armazenamento/arquivos.

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

Quando Cron força a criação de uma nova sessão de execução isolada, ele sanitiza a entrada de sessão anterior
`cron:<jobId>` antes de gravar a nova linha. Ele carrega preferências seguras,
como configurações de thinking/fast/verbose, rótulos e substituições explícitas
de modelo/autenticação selecionadas pelo usuário. Ele descarta contexto de conversa ambiente, como
roteamento de canal/grupo, política de envio ou fila, elevação, origem e vinculação de runtime
ACP, para que uma nova execução isolada não possa herdar entrega obsoleta ou
autoridade de runtime de uma execução antiga.

---

## Chaves de sessão (`sessionKey`)

Uma `sessionKey` identifica _em qual balde de conversa_ você está (roteamento + isolamento).

Padrões comuns:

- Chat principal/direto (por agente): `agent:<agentId>:<mainKey>` (padrão `main`)
- Grupo: `agent:<agentId>:<channel>:group:<id>`
- Sala/canal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` ou `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (a menos que seja sobrescrito)

As regras canônicas estão documentadas em [/concepts/session](/pt-BR/concepts/session).

---

## IDs de sessão (`sessionId`)

Cada `sessionKey` aponta para uma `sessionId` atual (o arquivo de transcrição que continua a conversa).

Regras práticas:

- **Redefinição** (`/new`, `/reset`) cria uma nova `sessionId` para essa `sessionKey`.
- **Redefinição diária** (padrão 4:00 AM no horário local do host do gateway) cria uma nova `sessionId` na próxima mensagem após o limite de redefinição.
- **Expiração por inatividade** (`session.reset.idleMinutes` ou legado `session.idleMinutes`) cria uma nova `sessionId` quando uma mensagem chega após a janela de inatividade. Quando redefinição diária + inatividade estão configuradas, vence o que expirar primeiro.
- **Eventos do sistema** (Heartbeat, despertares Cron, notificações de exec, manutenção do Gateway) podem alterar a linha da sessão, mas não estendem o frescor da redefinição diária/por inatividade. A rolagem de redefinição descarta avisos de eventos do sistema enfileirados para a sessão anterior antes que o prompt novo seja construído.
- **Política de fork pai** usa a ramificação ativa do Pi ao criar uma thread ou fork de subagente. Se essa ramificação for grande demais, OpenClaw inicia o filho com contexto isolado em vez de falhar ou herdar histórico inutilizável. A política de dimensionamento é automática; a configuração legada `session.parentForkMaxTokens` é removida por `openclaw doctor --fix`.

Detalhe de implementação: a decisão acontece em `initSessionState()` em `src/auto-reply/reply/session.ts`.

---

## Esquema do armazenamento de sessões (`sessions.json`)

O tipo de valor do armazenamento é `SessionEntry` em `src/config/sessions.ts`.

Campos principais (não exaustivo):

- `sessionId`: id da transcrição atual (o nome do arquivo é derivado disso, a menos que `sessionFile` esteja definido)
- `sessionStartedAt`: timestamp de início da `sessionId` atual; o frescor da redefinição diária
  usa isso. Linhas legadas podem derivá-lo do cabeçalho da sessão JSONL.
- `lastInteractionAt`: timestamp da última interação real de usuário/canal; o frescor da redefinição
  por inatividade usa isso para que eventos Heartbeat, Cron e exec não mantenham sessões
  ativas. Linhas legadas sem este campo recorrem ao horário de início da sessão recuperado
  para frescor de inatividade.
- `updatedAt`: timestamp da última mutação da linha do armazenamento, usado para listagem, poda e
  manutenção. Ele não é a autoridade para o frescor da redefinição diária/por inatividade.
- `sessionFile`: substituição opcional explícita do caminho da transcrição
- `chatType`: `direct | group | room` (ajuda UIs e política de envio)
- `provider`, `subject`, `room`, `space`, `displayName`: metadados para rotulagem de grupo/canal
- Alternâncias:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (substituição por sessão)
- Seleção de modelo:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contadores de tokens (melhor esforço / dependente de provedor):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: com que frequência a auto-Compaction foi concluída para esta chave de sessão
- `memoryFlushAt`: timestamp da última descarga de memória pré-Compaction
- `memoryFlushCompactionCount`: contagem de Compaction quando a última descarga foi executada

O armazenamento é seguro para editar, mas o Gateway é a autoridade: ele pode regravar ou reidratar entradas conforme as sessões são executadas.

---

## Estrutura da transcrição (`*.jsonl`)

Transcrições são gerenciadas pelo `SessionManager` de `@mariozechner/pi-coding-agent`.

O arquivo é JSONL:

- Primeira linha: cabeçalho da sessão (`type: "session"`, inclui `id`, `cwd`, `timestamp`, `parentSession` opcional)
- Depois: entradas de sessão com `id` + `parentId` (árvore)

Tipos de entrada notáveis:

- `message`: mensagens de usuário/assistente/toolResult
- `custom_message`: mensagens injetadas por extensão que _entram_ no contexto do modelo (podem ficar ocultas da UI)
- `custom`: estado da extensão que _não_ entra no contexto do modelo
- `compaction`: resumo de Compaction persistido com `firstKeptEntryId` e `tokensBefore`
- `branch_summary`: resumo persistido ao navegar por uma ramificação da árvore

OpenClaw intencionalmente **não** “ajusta” transcrições; o Gateway usa `SessionManager` para lê-las/gravá-las.

---

## Janelas de contexto vs tokens rastreados

Dois conceitos diferentes importam:

1. **Janela de contexto do modelo**: limite rígido por modelo (tokens visíveis ao modelo)
2. **Contadores do armazenamento de sessões**: estatísticas contínuas gravadas em `sessions.json` (usadas para /status e dashboards)

Se você estiver ajustando limites:

- A janela de contexto vem do catálogo de modelos (e pode ser sobrescrita via configuração).
- `contextTokens` no armazenamento é uma estimativa/valor de relatório em tempo de execução; não o trate como uma garantia estrita.

Para saber mais, veja [/token-use](/pt-BR/reference/token-use).

---

## Compaction: o que é

Compaction resume a conversa mais antiga em uma entrada `compaction` persistida na transcrição e mantém mensagens recentes intactas.

Após a Compaction, turnos futuros veem:

- O resumo de Compaction
- Mensagens após `firstKeptEntryId`

Compaction é **persistente** (ao contrário da poda de sessão). Veja [/concepts/session-pruning](/pt-BR/concepts/session-pruning).

## Limites de chunks de Compaction e pareamento de ferramentas

Quando o OpenClaw divide uma transcrição longa em chunks de Compaction, ele mantém
as chamadas de ferramentas do assistente pareadas com suas entradas `toolResult`
correspondentes.

- Se a divisão por proporção de tokens cair entre uma chamada de ferramenta e seu resultado, o OpenClaw
  desloca o limite para a mensagem de chamada de ferramenta do assistente, em vez de separar
  o par.
- Se um bloco final de resultado de ferramenta, caso contrário, empurraria o chunk acima da meta,
  o OpenClaw preserva esse bloco de ferramenta pendente e mantém a cauda não resumida
  intacta.
- Blocos de chamadas de ferramenta abortadas/com erro não mantêm uma divisão pendente aberta.

---

## Quando a Compaction automática acontece (runtime do Pi)

No agente Pi incorporado, a Compaction automática é acionada em dois casos:

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

Estas são semânticas do runtime do Pi (o OpenClaw consome os eventos, mas o Pi decide quando compactar).

O OpenClaw também pode acionar uma Compaction local de pré-verificação antes de abrir a próxima
execução quando `agents.defaults.compaction.maxActiveTranscriptBytes` estiver definido e o
arquivo de transcrição ativo atingir esse tamanho. Este é um controle de tamanho de arquivo para o custo local
de reabertura, não arquivamento bruto: o OpenClaw ainda executa a Compaction semântica normal,
e ela exige `truncateAfterCompaction` para que o resumo compactado possa se tornar uma
nova transcrição sucessora.

Para execuções incorporadas do Pi, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
adiciona um controle opcional de loop de ferramentas. Depois que um resultado de ferramenta é anexado e antes da
próxima chamada ao modelo, o OpenClaw estima a pressão do prompt usando a mesma lógica de orçamento
de pré-verificação usada no início do turno. Se o contexto não couber mais, o controle
não compacta dentro do hook `transformContext` do Pi. Ele emite um sinal estruturado
de pré-verificação no meio do turno, interrompe o envio do prompt atual e permite que o
loop externo de execução use o caminho de recuperação existente: truncar resultados de ferramentas grandes demais
quando isso for suficiente, ou acionar o modo de Compaction configurado e tentar novamente. A
opção vem desativada por padrão e funciona com os modos de Compaction `default` e `safeguard`,
incluindo Compaction de proteção apoiada por provedor.
Isso é independente de `maxActiveTranscriptBytes`: o controle por tamanho em bytes roda
antes de um turno abrir, enquanto a pré-verificação no meio do turno roda depois, no loop de ferramentas incorporado do Pi,
após novos resultados de ferramentas terem sido anexados.

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

O OpenClaw também impõe um piso de segurança para execuções incorporadas:

- Se `compaction.reserveTokens < reserveTokensFloor`, o OpenClaw o aumenta.
- O piso padrão é de `20000` tokens.
- Defina `agents.defaults.compaction.reserveTokensFloor: 0` para desativar o piso.
- Se ele já for maior, o OpenClaw o deixa como está.
- O `/compact` manual respeita um `agents.defaults.compaction.keepRecentTokens`
  explícito e mantém o ponto de corte da cauda recente do Pi. Sem um orçamento de retenção explícito,
  a Compaction manual permanece como um checkpoint rígido, e o contexto reconstruído começa a partir
  do novo resumo.
- Defina `agents.defaults.compaction.midTurnPrecheck.enabled: true` para executar a
  pré-verificação opcional do loop de ferramentas após novos resultados de ferramentas e antes da próxima chamada
  ao modelo. Isso é apenas um gatilho; a geração do resumo ainda usa o caminho de
  Compaction configurado. Ela é independente de `maxActiveTranscriptBytes`, que é um
  controle de tamanho em bytes da transcrição ativa no início do turno.
- Defina `agents.defaults.compaction.maxActiveTranscriptBytes` como um valor em bytes ou
  uma string como `"20mb"` para executar Compaction local antes de um turno quando a transcrição
  ativa ficar grande. Esse controle fica ativo somente quando
  `truncateAfterCompaction` também está habilitado. Deixe-o indefinido ou defina `0` para
  desativar.
- Quando `agents.defaults.compaction.truncateAfterCompaction` está habilitado,
  o OpenClaw rotaciona a transcrição ativa para um JSONL sucessor compactado após a
  Compaction. A transcrição completa antiga permanece arquivada e vinculada a partir do
  checkpoint de Compaction, em vez de ser reescrita no lugar.

Motivo: deixar folga suficiente para “manutenção” em vários turnos (como gravações de memória) antes que a Compaction se torne inevitável.

Implementação: `ensurePiCompactionReserveTokens()` em `src/agents/pi-settings.ts`
(chamado a partir de `src/agents/pi-embedded-runner.ts`).

---

## Provedores de Compaction conectáveis

Plugins podem registrar um provedor de Compaction via `registerCompactionProvider()` na API do plugin. Quando `agents.defaults.compaction.provider` é definido como um id de provedor registrado, o plugin de proteção delega o resumo a esse provedor em vez de usar o pipeline integrado `summarizeInStages`.

- `provider`: id de um plugin provedor de Compaction registrado. Deixe indefinido para o resumo padrão por LLM.
- Definir um `provider` força `mode: "safeguard"`.
- Provedores recebem as mesmas instruções de Compaction e política de preservação de identificadores do caminho integrado.
- A proteção ainda preserva o contexto de sufixo de turnos recentes e turnos divididos após a saída do provedor.
- O resumo de proteção integrado redestila resumos anteriores com novas mensagens
  em vez de preservar integralmente o resumo anterior de forma literal.
- O modo de proteção habilita auditorias de qualidade do resumo por padrão; defina
  `qualityGuard.enabled: false` para ignorar o comportamento de tentar novamente em caso de saída malformada.
- Se o provedor falhar ou retornar um resultado vazio, o OpenClaw retorna automaticamente ao resumo integrado por LLM.
- Sinais de aborto/timeout são relançados (não engolidos) para respeitar o cancelamento do chamador.

Fonte: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Superfícies visíveis ao usuário

Você pode observar a Compaction e o estado da sessão via:

- `/status` (em qualquer sessão de chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Modo detalhado: `🧹 Auto-compaction complete` + contagem de Compaction

---

## Manutenção silenciosa (`NO_REPLY`)

O OpenClaw oferece suporte a turnos “silenciosos” para tarefas em segundo plano nas quais o usuário não deve ver saída intermediária.

Convenção:

- O assistente inicia sua saída com o token silencioso exato `NO_REPLY` /
  `no_reply` para indicar “não entregar uma resposta ao usuário”.
- O OpenClaw remove/suprime isso na camada de entrega.
- A supressão exata do token silencioso não diferencia maiúsculas de minúsculas, então `NO_REPLY` e
  `no_reply` contam quando todo o payload é apenas o token silencioso.
- Isso é apenas para turnos verdadeiramente em segundo plano/sem entrega; não é um atalho para
  solicitações comuns e acionáveis do usuário.

A partir de `2026.1.10`, o OpenClaw também suprime **streaming de rascunho/digitação** quando um
chunk parcial começa com `NO_REPLY`, para que operações silenciosas não vazem saída
parcial no meio do turno.

---

## "Flush" de memória antes da Compaction (implementado)

Objetivo: antes que a Compaction automática aconteça, executar um turno agentivo silencioso que grava estado durável
em disco (por exemplo, `memory/YYYY-MM-DD.md` no workspace do agente) para que a Compaction não consiga
apagar contexto crítico.

O OpenClaw usa a abordagem de **flush pré-limite**:

1. Monitora o uso de contexto da sessão.
2. Quando ele cruza um “limite suave” (abaixo do limite de Compaction do Pi), executa uma diretiva silenciosa
   “gravar memória agora” para o agente.
3. Usa o token silencioso exato `NO_REPLY` / `no_reply` para que o usuário não veja
   nada.

Configuração (`agents.defaults.compaction.memoryFlush`):

- `enabled` (padrão: `true`)
- `model` (sobrescrita opcional exata de provedor/modelo para o turno de flush, por exemplo `ollama/qwen3:8b`)
- `softThresholdTokens` (padrão: `4000`)
- `prompt` (mensagem do usuário para o turno de flush)
- `systemPrompt` (prompt de sistema extra anexado para o turno de flush)

Observações:

- O prompt/prompt de sistema padrão inclui uma dica `NO_REPLY` para suprimir
  a entrega.
- Quando `model` está definido, o turno de flush usa esse modelo sem herdar a
  cadeia de fallback da sessão ativa, para que a manutenção somente local não
  faça fallback silenciosamente para um modelo de conversa pago.
- O flush roda uma vez por ciclo de Compaction (rastreado em `sessions.json`).
- O flush roda apenas para sessões incorporadas do Pi (backends de CLI o ignoram).
- O flush é ignorado quando o workspace da sessão é somente leitura (`workspaceAccess: "ro"` ou `"none"`).
- Veja [Memória](/pt-BR/concepts/memory) para o layout de arquivos do workspace e os padrões de gravação.

O Pi também expõe um hook `session_before_compact` na API do plugin, mas a lógica de
flush do OpenClaw vive hoje no lado do Gateway.

---

## Checklist de solução de problemas

- Chave de sessão errada? Comece por [/concepts/session](/pt-BR/concepts/session) e confirme o `sessionKey` em `/status`.
- Incompatibilidade entre store e transcrição? Confirme o host do Gateway e o caminho do store em `openclaw status`.
- Spam de Compaction? Verifique:
  - janela de contexto do modelo (pequena demais)
  - configurações de Compaction (`reserveTokens` alto demais para a janela do modelo pode causar Compaction mais cedo)
  - inchaço de resultados de ferramentas: habilite/ajuste a poda de sessão
- Turnos silenciosos vazando? Confirme que a resposta começa com `NO_REPLY` (token exato sem diferenciar maiúsculas de minúsculas) e que você está em uma build que inclui a correção de supressão de streaming.

## Relacionados

- [Gerenciamento de sessão](/pt-BR/concepts/session)
- [Poda de sessão](/pt-BR/concepts/session-pruning)
- [Motor de contexto](/pt-BR/concepts/context-engine)
