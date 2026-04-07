---
read_when:
    - Você precisa depurar IDs de sessão, JSONL de transcrição ou campos de sessions.json
    - Você está alterando o comportamento de compactação automática ou adicionando rotinas de manutenção "pré-compactação"
    - Você quer implementar gravações em memória ou turnos silenciosos do sistema
summary: 'Análise detalhada: armazenamento de sessão + transcrições, ciclo de vida e internals de compactação (automática)'
title: Análise Detalhada do Gerenciamento de Sessões
x-i18n:
    generated_at: "2026-04-07T05:31:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: e379d624dd7808d3af25ed011079268ce6a9da64bb3f301598884ad4c46ab091
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# Gerenciamento de Sessões e Compactação (Análise Detalhada)

Este documento explica como o OpenClaw gerencia sessões de ponta a ponta:

- **Roteamento de sessão** (como mensagens de entrada são mapeadas para uma `sessionKey`)
- **Armazenamento de sessão** (`sessions.json`) e o que ele rastreia
- **Persistência de transcrição** (`*.jsonl`) e sua estrutura
- **Higiene de transcrição** (ajustes específicos do provedor antes das execuções)
- **Limites de contexto** (janela de contexto vs tokens rastreados)
- **Compactação** (compactação manual + automática) e onde conectar trabalho de pré-compactação
- **Manutenção silenciosa** (por exemplo, gravações em memória que não devem produzir saída visível ao usuário)

Se você quiser primeiro uma visão geral de nível mais alto, comece por:

- [/concepts/session](/pt-BR/concepts/session)
- [/concepts/compaction](/pt-BR/concepts/compaction)
- [/concepts/memory](/pt-BR/concepts/memory)
- [/concepts/memory-search](/pt-BR/concepts/memory-search)
- [/concepts/session-pruning](/pt-BR/concepts/session-pruning)
- [/reference/transcript-hygiene](/pt-BR/reference/transcript-hygiene)

---

## Fonte da verdade: o Gateway

O OpenClaw foi projetado em torno de um único **processo Gateway** que é responsável pelo estado da sessão.

- Interfaces (app macOS, web Control UI, TUI) devem consultar o Gateway para obter listas de sessões e contagens de tokens.
- No modo remoto, os arquivos de sessão ficam no host remoto; “verificar seus arquivos locais no Mac” não refletirá o que o Gateway está usando.

---

## Duas camadas de persistência

O OpenClaw persiste sessões em duas camadas:

1. **Armazenamento de sessão (`sessions.json`)**
   - Mapa chave/valor: `sessionKey -> SessionEntry`
   - Pequeno, mutável, seguro para editar (ou excluir entradas)
   - Rastreia metadados da sessão (ID da sessão atual, última atividade, toggles, contadores de tokens etc.)

2. **Transcrição (`<sessionId>.jsonl`)**
   - Transcrição append-only com estrutura em árvore (entradas têm `id` + `parentId`)
   - Armazena a conversa real + chamadas de ferramenta + resumos de compactação
   - Usada para reconstruir o contexto do modelo para turnos futuros

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
- `pruneAfter`: limite de idade para entradas obsoletas (padrão `30d`)
- `maxEntries`: limite de entradas em `sessions.json` (padrão `500`)
- `rotateBytes`: faz rotação de `sessions.json` quando ele fica grande demais (padrão `10mb`)
- `resetArchiveRetention`: retenção para arquivos de transcrição arquivados `*.reset.<timestamp>` (padrão: igual a `pruneAfter`; `false` desativa a limpeza)
- `maxDiskBytes`: orçamento opcional para o diretório de sessões
- `highWaterBytes`: alvo opcional após a limpeza (padrão `80%` de `maxDiskBytes`)

Ordem de aplicação para limpeza com orçamento de disco (`mode: "enforce"`):

1. Remover primeiro os artefatos de transcrição arquivados ou órfãos mais antigos.
2. Se ainda estiver acima do alvo, remover as entradas de sessão mais antigas e seus arquivos de transcrição.
3. Continuar até que o uso esteja em ou abaixo de `highWaterBytes`.

Em `mode: "warn"`, o OpenClaw relata possíveis remoções, mas não altera o armazenamento/arquivos.

Execute a manutenção sob demanda:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessões de cron e logs de execução

Execuções isoladas de cron também criam entradas/transcrições de sessão, e têm controles dedicados de retenção:

- `cron.sessionRetention` (padrão `24h`) remove sessões antigas de execuções isoladas de cron do armazenamento de sessão (`false` desativa).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` fazem prune de arquivos `~/.openclaw/cron/runs/<jobId>.jsonl` (padrões: `2_000_000` bytes e `2000` linhas).

---

## Chaves de sessão (`sessionKey`)

Uma `sessionKey` identifica _em qual bucket de conversa_ você está (roteamento + isolamento).

Padrões comuns:

- Chat principal/direto (por agente): `agent:<agentId>:<mainKey>` (padrão `main`)
- Grupo: `agent:<agentId>:<channel>:group:<id>`
- Sala/canal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` ou `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (a menos que seja substituído)

As regras canônicas estão documentadas em [/concepts/session](/pt-BR/concepts/session).

---

## IDs de sessão (`sessionId`)

Cada `sessionKey` aponta para um `sessionId` atual (o arquivo de transcrição que continua a conversa).

Regras gerais:

- **Reset** (`/new`, `/reset`) cria um novo `sessionId` para essa `sessionKey`.
- **Reset diário** (padrão 4:00 da manhã no horário local do host do gateway) cria um novo `sessionId` na próxima mensagem após o limite de reset.
- **Expiração por inatividade** (`session.reset.idleMinutes` ou legado `session.idleMinutes`) cria um novo `sessionId` quando chega uma mensagem após a janela de inatividade. Quando diário + inatividade estão ambos configurados, vence o que expirar primeiro.
- **Proteção de fork do pai da thread** (`session.parentForkMaxTokens`, padrão `100000`) ignora o fork da transcrição pai quando a sessão pai já está grande demais; a nova thread começa do zero. Defina `0` para desativar.

Detalhe de implementação: a decisão acontece em `initSessionState()` em `src/auto-reply/reply/session.ts`.

---

## Schema do armazenamento de sessão (`sessions.json`)

O tipo de valor do armazenamento é `SessionEntry` em `src/config/sessions.ts`.

Campos principais (não exaustivo):

- `sessionId`: ID atual da transcrição (o nome do arquivo é derivado disso, a menos que `sessionFile` esteja definido)
- `updatedAt`: timestamp da última atividade
- `sessionFile`: substituição opcional explícita do caminho da transcrição
- `chatType`: `direct | group | room` (ajuda interfaces e política de envio)
- `provider`, `subject`, `room`, `space`, `displayName`: metadados para rotulagem de grupo/canal
- Toggles:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (substituição por sessão)
- Seleção de modelo:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contadores de tokens (best-effort / dependentes do provedor):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: quantas vezes a compactação automática foi concluída para esta chave de sessão
- `memoryFlushAt`: timestamp da última gravação em memória antes da compactação
- `memoryFlushCompactionCount`: contagem de compactação quando a última gravação foi executada

O armazenamento é seguro para editar, mas o Gateway é a autoridade: ele pode reescrever ou reidratar entradas à medida que as sessões são executadas.

---

## Estrutura da transcrição (`*.jsonl`)

As transcrições são gerenciadas pelo `SessionManager` de `@mariozechner/pi-coding-agent`.

O arquivo é JSONL:

- Primeira linha: cabeçalho da sessão (`type: "session"`, inclui `id`, `cwd`, `timestamp`, `parentSession` opcional)
- Depois: entradas da sessão com `id` + `parentId` (árvore)

Tipos de entrada importantes:

- `message`: mensagens de usuário/assistente/toolResult
- `custom_message`: mensagens injetadas por extensão que _entram_ no contexto do modelo (podem ficar ocultas na UI)
- `custom`: estado da extensão que _não entra_ no contexto do modelo
- `compaction`: resumo de compactação persistido com `firstKeptEntryId` e `tokensBefore`
- `branch_summary`: resumo persistido ao navegar por um ramo da árvore

O OpenClaw intencionalmente **não** faz “ajustes” nas transcrições; o Gateway usa `SessionManager` para lê-las/gravá-las.

---

## Janelas de contexto vs tokens rastreados

Dois conceitos diferentes importam:

1. **Janela de contexto do modelo**: limite rígido por modelo (tokens visíveis ao modelo)
2. **Contadores no armazenamento de sessão**: estatísticas contínuas gravadas em `sessions.json` (usadas por /status e dashboards)

Se você estiver ajustando limites:

- A janela de contexto vem do catálogo de modelos (e pode ser substituída via configuração).
- `contextTokens` no armazenamento é um valor de estimativa/relatório em runtime; não o trate como garantia estrita.

Para mais informações, consulte [/token-use](/pt-BR/reference/token-use).

---

## Compactação: o que é

A compactação resume conversas mais antigas em uma entrada `compaction` persistida na transcrição e mantém as mensagens recentes intactas.

Após a compactação, turnos futuros veem:

- O resumo da compactação
- Mensagens após `firstKeptEntryId`

A compactação é **persistente** (diferente do pruning de sessão). Consulte [/concepts/session-pruning](/pt-BR/concepts/session-pruning).

## Limites de chunk de compactação e pareamento de ferramentas

Quando o OpenClaw divide uma transcrição longa em chunks de compactação, ele mantém
chamadas de ferramenta do assistente pareadas com suas entradas `toolResult` correspondentes.

- Se a divisão por participação de tokens cair entre uma chamada de ferramenta e seu resultado, o OpenClaw
  desloca o limite para a mensagem do assistente que contém a chamada de ferramenta, em vez de separar
  o par.
- Se um bloco final de resultado de ferramenta, de outra forma, empurraria o chunk além do alvo,
  o OpenClaw preserva esse bloco pendente de ferramenta e mantém intacta a cauda não resumida.
- Blocos de chamada de ferramenta abortados/com erro não mantêm uma divisão pendente aberta.

---

## Quando a compactação automática acontece (runtime Pi)

No agente Pi embutido, a compactação automática é acionada em dois casos:

1. **Recuperação de overflow**: o modelo retorna um erro de overflow de contexto
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` e variantes semelhantes moldadas por provedor) → compactar → tentar novamente.
2. **Manutenção por limite**: após um turno bem-sucedido, quando:

`contextTokens > contextWindow - reserveTokens`

Onde:

- `contextWindow` é a janela de contexto do modelo
- `reserveTokens` é a folga reservada para prompts + a próxima saída do modelo

Essas são semânticas do runtime Pi (o OpenClaw consome os eventos, mas o Pi decide quando compactar).

---

## Configurações de compactação (`reserveTokens`, `keepRecentTokens`)

As configurações de compactação do Pi ficam nas configurações do Pi:

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

- Se `compaction.reserveTokens < reserveTokensFloor`, o OpenClaw aumenta esse valor.
- O piso padrão é `20000` tokens.
- Defina `agents.defaults.compaction.reserveTokensFloor: 0` para desativar o piso.
- Se já for maior, o OpenClaw o mantém como está.

Por quê: deixar folga suficiente para “manutenção” de múltiplos turnos (como gravações em memória) antes que a compactação se torne inevitável.

Implementação: `ensurePiCompactionReserveTokens()` em `src/agents/pi-settings.ts`
(chamado a partir de `src/agents/pi-embedded-runner.ts`).

---

## Superfícies visíveis ao usuário

Você pode observar a compactação e o estado da sessão por meio de:

- `/status` (em qualquer sessão de chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Modo detalhado: `🧹 Auto-compaction complete` + contagem de compactação

---

## Manutenção silenciosa (`NO_REPLY`)

O OpenClaw oferece suporte a turnos “silenciosos” para tarefas em segundo plano em que o usuário não deve ver saída intermediária.

Convenção:

- O assistente inicia sua saída com o token silencioso exato `NO_REPLY` /
  `no_reply` para indicar “não entregar uma resposta ao usuário”.
- O OpenClaw remove/suprime isso na camada de entrega.
- A supressão do token silencioso exato não diferencia maiúsculas de minúsculas, então `NO_REPLY` e
  `no_reply` contam quando todo o payload é apenas o token silencioso.
- Isso é apenas para turnos realmente em segundo plano/sem entrega; não é um atalho para
  solicitações normais e acionáveis do usuário.

A partir de `2026.1.10`, o OpenClaw também suprime **streaming de rascunho/digitação** quando um
chunk parcial começa com `NO_REPLY`, para que operações silenciosas não vazem saída parcial no meio do turno.

---

## "Memory flush" pré-compactação (implementado)

Objetivo: antes que a compactação automática aconteça, executar um turno agentic silencioso que grave
estado durável em disco (por exemplo, `memory/YYYY-MM-DD.md` no workspace do agente) para que a compactação não possa
apagar contexto crítico.

O OpenClaw usa a abordagem de **gravação antes do limite**:

1. Monitorar o uso de contexto da sessão.
2. Quando ele cruzar um “limite suave” (abaixo do limite de compactação do Pi), executar uma diretiva silenciosa
   de “grave a memória agora” para o agente.
3. Usar o token silencioso exato `NO_REPLY` / `no_reply` para que o usuário não veja
   nada.

Configuração (`agents.defaults.compaction.memoryFlush`):

- `enabled` (padrão: `true`)
- `softThresholdTokens` (padrão: `4000`)
- `prompt` (mensagem do usuário para o turno de gravação)
- `systemPrompt` (prompt de sistema extra anexado ao turno de gravação)

Observações:

- O prompt/system prompt padrão inclui uma dica `NO_REPLY` para suprimir
  a entrega.
- A gravação é executada uma vez por ciclo de compactação (rastreada em `sessions.json`).
- A gravação é executada apenas para sessões Pi embutidas (backends de CLI a ignoram).
- A gravação é ignorada quando o workspace da sessão é somente leitura (`workspaceAccess: "ro"` ou `"none"`).
- Consulte [Memory](/pt-BR/concepts/memory) para o layout de arquivos do workspace e padrões de gravação.

O Pi também expõe um hook `session_before_compact` na API de extensão, mas a lógica de
gravação do OpenClaw hoje fica no lado do Gateway.

---

## Checklist de solução de problemas

- Chave de sessão errada? Comece por [/concepts/session](/pt-BR/concepts/session) e confirme a `sessionKey` em `/status`.
- Divergência entre armazenamento e transcrição? Confirme o host do Gateway e o caminho do armazenamento em `openclaw status`.
- Spam de compactação? Verifique:
  - janela de contexto do modelo (muito pequena)
  - configurações de compactação (`reserveTokens` alto demais para a janela do modelo pode causar compactação mais cedo)
  - inchaço de resultado de ferramenta: ative/ajuste o pruning de sessão
- Turnos silenciosos vazando? Confirme que a resposta começa com `NO_REPLY` (token exato sem diferenciar maiúsculas de minúsculas) e que você está em uma build que inclui a correção de supressão de streaming.
