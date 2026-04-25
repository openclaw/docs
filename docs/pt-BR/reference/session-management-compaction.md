---
read_when:
    - Você precisa depurar IDs de sessão, JSONL de transcrição ou campos de `sessions.json`
    - Você está alterando o comportamento de Compaction automática ou adicionando tarefas de manutenção “pré-Compaction”
    - Você quer implementar flushes de memória ou turnos silenciosos do sistema
summary: 'Análise aprofundada: armazenamento de sessão + transcrições, ciclo de vida e internos de Compaction (automática)'
title: Análise aprofundada do gerenciamento de sessão
x-i18n:
    generated_at: "2026-04-25T13:55:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: f15b8cf4b1deb947b292c6931257218d7147c11c963e7bf2689b6d1f77ea8159
    source_path: reference/session-management-compaction.md
    workflow: 15
---

Esta página explica como o OpenClaw gerencia sessões de ponta a ponta:

- **Roteamento de sessão** (como mensagens recebidas são mapeadas para uma `sessionKey`)
- **Armazenamento de sessão** (`sessions.json`) e o que ele acompanha
- **Persistência de transcrição** (`*.jsonl`) e sua estrutura
- **Higiene de transcrição** (ajustes específicos por provider antes das execuções)
- **Limites de contexto** (janela de contexto vs tokens rastreados)
- **Compaction** (Compaction manual + automática) e onde conectar trabalho pré-Compaction
- **Manutenção silenciosa** (por exemplo, gravações de memória que não devem produzir saída visível ao usuário)

Se você quiser primeiro uma visão mais geral, comece com:

- [Gerenciamento de sessão](/pt-BR/concepts/session)
- [Compaction](/pt-BR/concepts/compaction)
- [Visão geral da memória](/pt-BR/concepts/memory)
- [Busca de memória](/pt-BR/concepts/memory-search)
- [Podas de sessão](/pt-BR/concepts/session-pruning)
- [Higiene de transcrição](/pt-BR/reference/transcript-hygiene)

---

## Fonte de verdade: o Gateway

O OpenClaw foi projetado em torno de um único **processo Gateway** que controla o estado da sessão.

- UIs (app macOS, web Control UI, TUI) devem consultar o Gateway para listas de sessão e contagens de tokens.
- No modo remoto, os arquivos de sessão estão no host remoto; “verificar seus arquivos locais no Mac” não refletirá o que o Gateway está usando.

---

## Duas camadas de persistência

O OpenClaw persiste sessões em duas camadas:

1. **Armazenamento de sessão (`sessions.json`)**
   - Mapa chave/valor: `sessionKey -> SessionEntry`
   - Pequeno, mutável, seguro para editar (ou excluir entradas)
   - Acompanha metadados da sessão (id atual da sessão, última atividade, alternâncias, contadores de tokens etc.)

2. **Transcrição (`<sessionId>.jsonl`)**
   - Transcrição append-only com estrutura em árvore (entradas têm `id` + `parentId`)
   - Armazena a conversa real + chamadas de ferramenta + resumos de Compaction
   - Usado para reconstruir o contexto do modelo em turnos futuros

---

## Locais em disco

Por agente, no host do Gateway:

- Armazenamento: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcrições: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sessões de tópico do Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

O OpenClaw resolve isso via `src/config/sessions.ts`.

---

## Manutenção do armazenamento e controles de disco

A persistência de sessão tem controles automáticos de manutenção (`session.maintenance`) para `sessions.json` e artefatos de transcrição:

- `mode`: `warn` (padrão) ou `enforce`
- `pruneAfter`: corte de idade para entradas obsoletas (padrão `30d`)
- `maxEntries`: limite de entradas em `sessions.json` (padrão `500`)
- `rotateBytes`: rotaciona `sessions.json` quando ele fica grande demais (padrão `10mb`)
- `resetArchiveRetention`: retenção para arquivos de transcrição `*.reset.<timestamp>` (padrão: igual a `pruneAfter`; `false` desativa a limpeza)
- `maxDiskBytes`: orçamento opcional para o diretório de sessões
- `highWaterBytes`: alvo opcional após limpeza (padrão `80%` de `maxDiskBytes`)

Ordem de aplicação para limpeza de orçamento de disco (`mode: "enforce"`):

1. Remove primeiro os artefatos de transcrição arquivados ou órfãos mais antigos.
2. Se ainda estiver acima do alvo, remove as entradas de sessão mais antigas e seus arquivos de transcrição.
3. Continua até que o uso fique em ou abaixo de `highWaterBytes`.

Em `mode: "warn"`, o OpenClaw relata remoções potenciais, mas não altera o armazenamento/arquivos.

Execute a manutenção sob demanda:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessões de Cron e logs de execução

Execuções isoladas de Cron também criam entradas/transcrições de sessão e têm controles dedicados de retenção:

- `cron.sessionRetention` (padrão `24h`) remove sessões antigas de execução isolada de cron do armazenamento de sessão (`false` desativa).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` fazem poda em arquivos `~/.openclaw/cron/runs/<jobId>.jsonl` (padrões: `2_000_000` bytes e `2000` linhas).

Quando o cron força a criação de uma nova sessão isolada de execução, ele sanitiza a
entrada anterior de sessão `cron:<jobId>` antes de gravar a nova linha. Ele carrega
preferências seguras, como configurações de thinking/fast/verbose, labels e sobrescritas explícitas
de modelo/autenticação selecionadas pelo usuário. Ele descarta contexto ambiente de conversa, como
roteamento de canal/grupo, política de envio ou fila, elevação, origem e binding
de runtime ACP, para que uma nova execução isolada não possa herdar entrega obsoleta nem
autoridade de runtime de uma execução mais antiga.

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

Cada `sessionKey` aponta para um `sessionId` atual (o arquivo de transcrição que continua a conversa).

Regras práticas:

- **Reset** (`/new`, `/reset`) cria um novo `sessionId` para aquela `sessionKey`.
- **Reset diário** (padrão às 4:00 AM no horário local do host do gateway) cria um novo `sessionId` na próxima mensagem após o limite de reset.
- **Expiração por inatividade** (`session.reset.idleMinutes` ou legado `session.idleMinutes`) cria um novo `sessionId` quando uma mensagem chega após a janela de inatividade. Quando diário + inatividade estão ambos configurados, vence o que expirar primeiro.
- **Proteção de fork do pai de thread** (`session.parentForkMaxTokens`, padrão `100000`) ignora o fork da transcrição do pai quando a sessão pai já está grande demais; a nova thread começa do zero. Defina `0` para desativar.

Detalhe de implementação: a decisão acontece em `initSessionState()` em `src/auto-reply/reply/session.ts`.

---

## Schema do armazenamento de sessão (`sessions.json`)

O tipo de valor do armazenamento é `SessionEntry` em `src/config/sessions.ts`.

Campos principais (não exaustivos):

- `sessionId`: id atual da transcrição (o nome do arquivo é derivado disso, a menos que `sessionFile` esteja definido)
- `updatedAt`: timestamp da última atividade
- `sessionFile`: sobrescrita opcional explícita do caminho da transcrição
- `chatType`: `direct | group | room` (ajuda UIs e política de envio)
- `provider`, `subject`, `room`, `space`, `displayName`: metadados para rotulagem de grupo/canal
- Alternâncias:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (sobrescrita por sessão)
- Seleção de modelo:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contadores de tokens (best-effort / dependentes do provider):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: quantas vezes a Compaction automática foi concluída para essa chave de sessão
- `memoryFlushAt`: timestamp do último flush de memória pré-Compaction
- `memoryFlushCompactionCount`: contagem de Compaction quando o último flush foi executado

O armazenamento é seguro para editar, mas o Gateway é a autoridade: ele pode regravar ou reidratar entradas à medida que as sessões são executadas.

---

## Estrutura da transcrição (`*.jsonl`)

As transcrições são gerenciadas pelo `SessionManager` de `@mariozechner/pi-coding-agent`.

O arquivo é JSONL:

- Primeira linha: cabeçalho da sessão (`type: "session"`, inclui `id`, `cwd`, `timestamp`, `parentSession` opcional)
- Depois: entradas de sessão com `id` + `parentId` (árvore)

Tipos notáveis de entrada:

- `message`: mensagens de user/assistant/toolResult
- `custom_message`: mensagens injetadas por extensão que _entram_ no contexto do modelo (podem ser ocultadas da UI)
- `custom`: estado de extensão que _não_ entra no contexto do modelo
- `compaction`: resumo persistido de Compaction com `firstKeptEntryId` e `tokensBefore`
- `branch_summary`: resumo persistido ao navegar por um branch da árvore

O OpenClaw intencionalmente **não** “corrige” transcrições; o Gateway usa `SessionManager` para lê-las/escrevê-las.

---

## Janelas de contexto vs tokens rastreados

Dois conceitos diferentes importam:

1. **Janela de contexto do modelo**: limite rígido por modelo (tokens visíveis ao modelo)
2. **Contadores do armazenamento de sessão**: estatísticas acumuladas gravadas em `sessions.json` (usadas por /status e dashboards)

Se você estiver ajustando limites:

- A janela de contexto vem do catálogo de modelos (e pode ser sobrescrita via configuração).
- `contextTokens` no armazenamento é um valor de estimativa/relato em runtime; não o trate como garantia rígida.

Para mais detalhes, consulte [/token-use](/pt-BR/reference/token-use).

---

## Compaction: o que é

A Compaction resume conversas antigas em uma entrada persistida `compaction` na transcrição e mantém as mensagens recentes intactas.

Depois da Compaction, turnos futuros veem:

- O resumo da Compaction
- Mensagens após `firstKeptEntryId`

A Compaction é **persistente** (ao contrário da poda de sessão). Consulte [/concepts/session-pruning](/pt-BR/concepts/session-pruning).

## Limites de chunk de Compaction e pareamento de ferramentas

Quando o OpenClaw divide uma transcrição longa em chunks de Compaction, ele mantém
chamadas de ferramenta do assistant pareadas com suas entradas correspondentes de `toolResult`.

- Se a divisão por participação de tokens cair entre uma chamada de ferramenta e seu resultado, o OpenClaw
  desloca o limite para a mensagem de chamada de ferramenta do assistant em vez de separar
  o par.
- Se um bloco final de resultado de ferramenta, de outra forma, empurraria o chunk além do alvo,
  o OpenClaw preserva esse bloco de ferramenta pendente e mantém intacta a cauda não resumida.
- Blocos de chamada de ferramenta abortados/com erro não mantêm uma divisão pendente aberta.

---

## Quando a Compaction automática acontece (runtime Pi)

No agente Pi embutido, a Compaction automática é disparada em dois casos:

1. **Recuperação de overflow**: o modelo retorna um erro de overflow de contexto
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` e variantes semelhantes moldadas pelo provider) → compacta → tenta novamente.
2. **Manutenção por limiar**: após um turno bem-sucedido, quando:

`contextTokens > contextWindow - reserveTokens`

Onde:

- `contextWindow` é a janela de contexto do modelo
- `reserveTokens` é a folga reservada para prompts + a próxima saída do modelo

Essas são semânticas do runtime Pi (o OpenClaw consome os eventos, mas o Pi decide quando compactar).

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

O OpenClaw também aplica um piso de segurança para execuções embutidas:

- Se `compaction.reserveTokens < reserveTokensFloor`, o OpenClaw o aumenta.
- O piso padrão é `20000` tokens.
- Defina `agents.defaults.compaction.reserveTokensFloor: 0` para desativar o piso.
- Se já estiver maior, o OpenClaw o mantém como está.
- `/compact` manual respeita um `agents.defaults.compaction.keepRecentTokens` explícito
  e mantém o ponto de corte da cauda recente do Pi. Sem um orçamento explícito de manutenção,
  a Compaction manual continua sendo um checkpoint rígido, e o contexto reconstruído começa a partir
  do novo resumo.

Por quê: deixar folga suficiente para “manutenção” de vários turnos (como gravações de memória) antes que a Compaction se torne inevitável.

Implementação: `ensurePiCompactionReserveTokens()` em `src/agents/pi-settings.ts`
(chamado de `src/agents/pi-embedded-runner.ts`).

---

## Providers de Compaction conectáveis

Plugins podem registrar um provider de Compaction via `registerCompactionProvider()` na API do Plugin. Quando `agents.defaults.compaction.provider` está definido com um id de provider registrado, a extensão de proteção delega a sumarização a esse provider em vez de usar o pipeline integrado `summarizeInStages`.

- `provider`: id de um provider de Compaction registrado por Plugin. Deixe sem definir para usar a sumarização LLM padrão.
- Definir um `provider` força `mode: "safeguard"`.
- Providers recebem as mesmas instruções de Compaction e a mesma política de preservação de identificadores do caminho integrado.
- A proteção ainda preserva o contexto recente de sufixo de turnos e turnos divididos após a saída do provider.
- A sumarização integrada em modo safeguard redestila resumos anteriores com mensagens novas
  em vez de preservar integralmente o resumo anterior.
- O modo safeguard ativa auditorias de qualidade do resumo por padrão; defina
  `qualityGuard.enabled: false` para ignorar o comportamento de nova tentativa em saída malformada.
- Se o provider falhar ou retornar um resultado vazio, o OpenClaw faz fallback automático para a sumarização LLM integrada.
- Sinais de aborto/timeout são relançados (não engolidos) para respeitar o cancelamento do chamador.

Fonte: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Superfícies visíveis ao usuário

Você pode observar Compaction e estado da sessão via:

- `/status` (em qualquer sessão de chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Modo verbose: `🧹 Auto-compaction complete` + contagem de Compaction

---

## Manutenção silenciosa (`NO_REPLY`)

O OpenClaw oferece suporte a turnos “silenciosos” para tarefas em segundo plano em que o usuário não deve ver saída intermediária.

Convenção:

- O assistant inicia sua saída com o token silencioso exato `NO_REPLY` /
  `no_reply` para indicar “não entregar resposta ao usuário”.
- O OpenClaw remove/suprime isso na camada de entrega.
- A supressão do token silencioso exato não diferencia maiúsculas de minúsculas, então `NO_REPLY` e
  `no_reply` contam quando toda a carga é apenas o token silencioso.
- Isso é para turnos realmente de fundo/sem entrega; não é um atalho para
  solicitações normais acionáveis do usuário.

A partir de `2026.1.10`, o OpenClaw também suprime **streaming de rascunho/digitação** quando um
chunk parcial começa com `NO_REPLY`, para que operações silenciosas não vazem saída
parcial no meio do turno.

---

## "Memory flush" pré-Compaction (implementado)

Objetivo: antes que a Compaction automática aconteça, executar um turno agêntico silencioso que grave estado
durável em disco (por exemplo `memory/YYYY-MM-DD.md` no workspace do agente), para que a Compaction não possa
apagar contexto crítico.

O OpenClaw usa a abordagem de **flush pré-limiar**:

1. Monitorar o uso de contexto da sessão.
2. Quando ele cruza um “limiar suave” (abaixo do limiar de Compaction do Pi), executar uma diretiva silenciosa
   “grave memória agora” para o agente.
3. Usar o token silencioso exato `NO_REPLY` / `no_reply` para que o usuário não veja
   nada.

Configuração (`agents.defaults.compaction.memoryFlush`):

- `enabled` (padrão: `true`)
- `softThresholdTokens` (padrão: `4000`)
- `prompt` (mensagem de usuário para o turno de flush)
- `systemPrompt` (prompt extra de sistema acrescentado ao turno de flush)

Observações:

- O prompt/system prompt padrão incluem uma dica `NO_REPLY` para suprimir
  a entrega.
- O flush é executado uma vez por ciclo de Compaction (acompanhado em `sessions.json`).
- O flush só é executado para sessões Pi embutidas (backends de CLI o ignoram).
- O flush é ignorado quando o workspace da sessão é somente leitura (`workspaceAccess: "ro"` ou `"none"`).
- Consulte [Memory](/pt-BR/concepts/memory) para o layout de arquivos do workspace e padrões de gravação.

O Pi também expõe um hook `session_before_compact` na API de extensão, mas a lógica de
flush do OpenClaw vive hoje no lado do Gateway.

---

## Checklist de solução de problemas

- Chave de sessão errada? Comece por [/concepts/session](/pt-BR/concepts/session) e confirme a `sessionKey` em `/status`.
- Incompatibilidade entre armazenamento e transcrição? Confirme o host do Gateway e o caminho do armazenamento em `openclaw status`.
- Spam de Compaction? Verifique:
  - janela de contexto do modelo (muito pequena)
  - configurações de Compaction (`reserveTokens` alto demais para a janela do modelo pode causar Compaction mais cedo)
  - inchaço de `toolResult`: ative/ajuste a poda de sessão
- Turnos silenciosos vazando? Confirme que a resposta começa com `NO_REPLY` (token exato, sem diferenciar maiúsculas de minúsculas) e que você está em uma build que inclui a correção de supressão de streaming.

## Relacionados

- [Gerenciamento de sessão](/pt-BR/concepts/session)
- [Podas de sessão](/pt-BR/concepts/session-pruning)
- [Mecanismo de contexto](/pt-BR/concepts/context-engine)
