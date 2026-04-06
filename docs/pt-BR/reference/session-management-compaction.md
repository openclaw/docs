---
read_when:
    - Você precisa depurar ids de sessão, JSONL de transcrição ou campos de sessions.json
    - Você está alterando o comportamento de auto-compactação ou adicionando manutenção “pré-compactação”
    - Você quer implementar memory flushes ou turnos silenciosos do sistema
summary: 'Análise aprofundada: armazenamento de sessão + transcrições, ciclo de vida e detalhes internos da (auto)compactação'
title: Análise aprofundada do gerenciamento de sessões
x-i18n:
    generated_at: "2026-04-06T03:11:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0d8c2d30be773eac0424f7a4419ab055fdd50daac8bc654e7d250c891f2c3b8
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# Gerenciamento de sessões e compactação (análise aprofundada)

Este documento explica como o OpenClaw gerencia sessões de ponta a ponta:

- **Roteamento de sessão** (como mensagens recebidas são mapeadas para uma `sessionKey`)
- **Armazenamento de sessões** (`sessions.json`) e o que ele rastreia
- **Persistência de transcrição** (`*.jsonl`) e sua estrutura
- **Higiene de transcrição** (correções específicas de provider antes das execuções)
- **Limites de contexto** (janela de contexto vs tokens rastreados)
- **Compactação** (compactação manual + automática) e onde conectar trabalho pré-compactação
- **Manutenção silenciosa** (por exemplo, gravações de memória que não devem produzir saída visível ao usuário)

Se você quiser primeiro uma visão geral de nível mais alto, comece com:

- [/concepts/session](/pt-BR/concepts/session)
- [/concepts/compaction](/pt-BR/concepts/compaction)
- [/concepts/memory](/pt-BR/concepts/memory)
- [/concepts/memory-search](/pt-BR/concepts/memory-search)
- [/concepts/session-pruning](/pt-BR/concepts/session-pruning)
- [/reference/transcript-hygiene](/pt-BR/reference/transcript-hygiene)

---

## Fonte da verdade: o Gateway

O OpenClaw foi projetado em torno de um único **processo Gateway** que é o proprietário do estado das sessões.

- UIs (app macOS, Control UI web, TUI) devem consultar o Gateway para listas de sessões e contagens de tokens.
- No modo remoto, os arquivos de sessão ficam no host remoto; “verificar os arquivos do seu Mac local” não vai refletir o que o Gateway está usando.

---

## Duas camadas de persistência

O OpenClaw persiste sessões em duas camadas:

1. **Armazenamento de sessões (`sessions.json`)**
   - Mapa chave/valor: `sessionKey -> SessionEntry`
   - Pequeno, mutável, seguro para editar (ou excluir entradas)
   - Rastreia metadados da sessão (id atual da sessão, última atividade, toggles, contadores de tokens etc.)

2. **Transcrição (`<sessionId>.jsonl`)**
   - Transcrição append-only com estrutura em árvore (as entradas têm `id` + `parentId`)
   - Armazena a conversa real + chamadas de ferramentas + resumos de compactação
   - Usada para reconstruir o contexto do modelo em turnos futuros

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
- `rotateBytes`: rotaciona `sessions.json` quando ele fica grande demais (padrão `10mb`)
- `resetArchiveRetention`: retenção para arquivos de arquivamento de transcrição `*.reset.<timestamp>` (padrão: igual a `pruneAfter`; `false` desativa a limpeza)
- `maxDiskBytes`: orçamento opcional para o diretório de sessões
- `highWaterBytes`: alvo opcional após a limpeza (padrão `80%` de `maxDiskBytes`)

Ordem de aplicação da limpeza do orçamento de disco (`mode: "enforce"`):

1. Remover primeiro os artefatos de transcrição arquivados ou órfãos mais antigos.
2. Se ainda estiver acima do alvo, remover as entradas de sessão mais antigas e seus arquivos de transcrição.
3. Continuar até que o uso fique em ou abaixo de `highWaterBytes`.

No `mode: "warn"`, o OpenClaw informa possíveis remoções, mas não altera o armazenamento/arquivos.

Execute a manutenção sob demanda:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessões cron e logs de execução

Execuções cron isoladas também criam entradas/transcrições de sessão, e têm controles dedicados de retenção:

- `cron.sessionRetention` (padrão `24h`) remove sessões antigas de execução cron isolada do armazenamento de sessões (`false` desativa).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` fazem limpeza dos arquivos `~/.openclaw/cron/runs/<jobId>.jsonl` (padrões: `2_000_000` bytes e `2000` linhas).

---

## Chaves de sessão (`sessionKey`)

Uma `sessionKey` identifica _em qual bucket de conversa_ você está (roteamento + isolamento).

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
- **Expiração por inatividade** (`session.reset.idleMinutes` ou legado `session.idleMinutes`) cria um novo `sessionId` quando uma mensagem chega após a janela de inatividade. Quando diário + inatividade estão ambos configurados, o primeiro a expirar prevalece.
- **Proteção de bifurcação do pai da thread** (`session.parentForkMaxTokens`, padrão `100000`) ignora a bifurcação da transcrição pai quando a sessão pai já está grande demais; a nova thread começa do zero. Defina `0` para desativar.

Detalhe de implementação: a decisão acontece em `initSessionState()` em `src/auto-reply/reply/session.ts`.

---

## Schema do armazenamento de sessões (`sessions.json`)

O tipo do valor no armazenamento é `SessionEntry` em `src/config/sessions.ts`.

Campos principais (não exaustivo):

- `sessionId`: id atual da transcrição (o nome do arquivo é derivado disso, a menos que `sessionFile` esteja definido)
- `updatedAt`: carimbo de data/hora da última atividade
- `sessionFile`: sobrescrita opcional explícita de caminho de transcrição
- `chatType`: `direct | group | room` (ajuda UIs e política de envio)
- `provider`, `subject`, `room`, `space`, `displayName`: metadados para rotulagem de grupo/canal
- Toggles:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (sobrescrita por sessão)
- Seleção de modelo:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contadores de tokens (best-effort / dependentes do provider):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: quantas vezes a auto-compactação foi concluída para esta chave de sessão
- `memoryFlushAt`: carimbo de data/hora do último memory flush pré-compactação
- `memoryFlushCompactionCount`: contagem de compactação quando o último flush foi executado

O armazenamento é seguro para editar, mas o Gateway é a autoridade: ele pode reescrever ou reidratar entradas conforme as sessões são executadas.

---

## Estrutura da transcrição (`*.jsonl`)

As transcrições são gerenciadas pelo `SessionManager` de `@mariozechner/pi-coding-agent`.

O arquivo é JSONL:

- Primeira linha: cabeçalho da sessão (`type: "session"`, inclui `id`, `cwd`, `timestamp`, `parentSession` opcional)
- Depois: entradas da sessão com `id` + `parentId` (árvore)

Tipos notáveis de entrada:

- `message`: mensagens de usuário/assistente/toolResult
- `custom_message`: mensagens injetadas por extensão que _entram_ no contexto do modelo (podem ficar ocultas na UI)
- `custom`: estado de extensão que _não entra_ no contexto do modelo
- `compaction`: resumo de compactação persistido com `firstKeptEntryId` e `tokensBefore`
- `branch_summary`: resumo persistido ao navegar em um ramo da árvore

O OpenClaw intencionalmente **não** “corrige” transcrições; o Gateway usa `SessionManager` para lê-las/gravá-las.

---

## Janelas de contexto vs tokens rastreados

Dois conceitos diferentes importam:

1. **Janela de contexto do modelo**: limite rígido por modelo (tokens visíveis para o modelo)
2. **Contadores do armazenamento de sessão**: estatísticas acumuladas gravadas em `sessions.json` (usadas por /status e dashboards)

Se você estiver ajustando limites:

- A janela de contexto vem do catálogo de modelos (e pode ser sobrescrita via configuração).
- `contextTokens` no armazenamento é um valor de estimativa/relato em runtime; não o trate como uma garantia rígida.

Para mais detalhes, consulte [/token-use](/pt-BR/reference/token-use).

---

## Compactação: o que é

A compactação resume a conversa mais antiga em uma entrada `compaction` persistida na transcrição e mantém intactas as mensagens recentes.

Após a compactação, os turnos futuros veem:

- O resumo de compactação
- Mensagens após `firstKeptEntryId`

A compactação é **persistente** (ao contrário da poda de sessão). Consulte [/concepts/session-pruning](/pt-BR/concepts/session-pruning).

## Limites de chunk de compactação e pareamento de ferramentas

Quando o OpenClaw divide uma transcrição longa em chunks de compactação, ele mantém
as chamadas de ferramenta do assistente pareadas com suas entradas `toolResult` correspondentes.

- Se a divisão por participação de tokens cair entre uma chamada de ferramenta e seu resultado, o OpenClaw
  move o limite para a mensagem da chamada de ferramenta do assistente em vez de separar
  o par.
- Se um bloco final de resultado de ferramenta, de outra forma, empurraria o chunk além do alvo,
  o OpenClaw preserva esse bloco de ferramenta pendente e mantém intacta a cauda
  não resumida.
- Blocos de chamada de ferramenta abortados/com erro não mantêm aberta uma divisão pendente.

---

## Quando a auto-compactação acontece (runtime Pi)

No agente Pi incorporado, a auto-compactação é acionada em dois casos:

1. **Recuperação de overflow**: o modelo retorna um erro de overflow de contexto
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` e variantes semelhantes moldadas pelo provider) → compactar → tentar de novo.
2. **Manutenção por limite**: após um turno bem-sucedido, quando:

`contextTokens > contextWindow - reserveTokens`

Onde:

- `contextWindow` é a janela de contexto do modelo
- `reserveTokens` é a folga reservada para prompts + a próxima saída do modelo

Essas são semânticas de runtime do Pi (o OpenClaw consome os eventos, mas o Pi decide quando compactar).

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

O OpenClaw também aplica um piso de segurança para execuções incorporadas:

- Se `compaction.reserveTokens < reserveTokensFloor`, o OpenClaw o aumenta.
- O piso padrão é `20000` tokens.
- Defina `agents.defaults.compaction.reserveTokensFloor: 0` para desativar o piso.
- Se já estiver acima disso, o OpenClaw o deixa como está.

Por quê: deixar folga suficiente para “manutenção” em múltiplos turnos (como gravações de memória) antes que a compactação se torne inevitável.

Implementação: `ensurePiCompactionReserveTokens()` em `src/agents/pi-settings.ts`
(chamado de `src/agents/pi-embedded-runner.ts`).

---

## Superfícies visíveis ao usuário

Você pode observar compactação e estado da sessão por meio de:

- `/status` (em qualquer sessão de chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Modo verbose: `🧹 Auto-compaction complete` + contagem de compactação

---

## Manutenção silenciosa (`NO_REPLY`)

O OpenClaw oferece suporte a turnos “silenciosos” para tarefas em segundo plano nas quais o usuário não deve ver saída intermediária.

Convenção:

- O assistente começa sua saída com o token silencioso exato `NO_REPLY` /
  `no_reply` para indicar “não entregar uma resposta ao usuário”.
- O OpenClaw remove/suprime isso na camada de entrega.
- A supressão do token silencioso exato não diferencia maiúsculas de minúsculas, então `NO_REPLY` e
  `no_reply` contam quando toda a carga útil é apenas o token silencioso.
- Isso serve apenas para turnos realmente em segundo plano/sem entrega; não é um atalho para
  solicitações normais do usuário que exigem ação.

Desde `2026.1.10`, o OpenClaw também suprime **streaming de rascunho/digitação** quando um
chunk parcial começa com `NO_REPLY`, para que operações silenciosas não vazem saída parcial no meio do turno.

---

## "Memory flush" pré-compactação (implementado)

Objetivo: antes que a auto-compactação aconteça, executar um turno agentic silencioso que grave estado
durável em disco (por exemplo `memory/YYYY-MM-DD.md` no workspace do agente) para que a compactação não possa
apagar contexto crítico.

O OpenClaw usa a abordagem de **flush pré-limite**:

1. Monitorar o uso de contexto da sessão.
2. Quando ele ultrapassa um “limite suave” (abaixo do limite de compactação do Pi), executar uma diretiva silenciosa
   “grave memória agora” para o agente.
3. Usar o token silencioso exato `NO_REPLY` / `no_reply` para que o usuário não veja
   nada.

Configuração (`agents.defaults.compaction.memoryFlush`):

- `enabled` (padrão: `true`)
- `softThresholdTokens` (padrão: `4000`)
- `prompt` (mensagem do usuário para o turno de flush)
- `systemPrompt` (prompt de sistema extra anexado ao turno de flush)

Observações:

- O prompt/system prompt padrão inclui uma dica `NO_REPLY` para suprimir
  a entrega.
- O flush é executado uma vez por ciclo de compactação (rastreado em `sessions.json`).
- O flush roda apenas para sessões Pi incorporadas.
- O flush é ignorado quando o workspace da sessão é somente leitura (`workspaceAccess: "ro"` ou `"none"`).
- Consulte [Memória](/pt-BR/concepts/memory) para ver o layout de arquivos do workspace e os padrões de gravação.

O Pi também expõe um hook `session_before_compact` na API de extensão, mas a lógica
de flush do OpenClaw hoje vive do lado do Gateway.

---

## Checklist de solução de problemas

- Chave de sessão errada? Comece por [/concepts/session](/pt-BR/concepts/session) e confirme a `sessionKey` em `/status`.
- Incompatibilidade entre armazenamento e transcrição? Confirme o host do Gateway e o caminho do armazenamento em `openclaw status`.
- Spam de compactação? Verifique:
  - janela de contexto do modelo (pequena demais)
  - configurações de compactação (`reserveTokens` alto demais para a janela do modelo pode causar compactação mais cedo)
  - excesso de tool-result: ative/ajuste a poda de sessão
- Turnos silenciosos vazando? Confirme que a resposta começa com `NO_REPLY` (token exato sem diferenciar maiúsculas de minúsculas) e que você está em uma build que inclui a correção de supressão de streaming.
