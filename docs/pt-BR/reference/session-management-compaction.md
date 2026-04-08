---
read_when:
    - Você precisa depurar IDs de sessão, JSONL de transcrição ou campos de sessions.json
    - Você está alterando o comportamento de compactação automática ou adicionando tarefas de manutenção “pré-compactação”
    - Você quer implementar gravações de memória ou turnos silenciosos do sistema
summary: 'Análise detalhada: armazenamento de sessão + transcrições, ciclo de vida e internals de compactação (automática)'
title: Análise Detalhada do Gerenciamento de Sessão
x-i18n:
    generated_at: "2026-04-08T02:18:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb1a4048646486693db8943a9e9c6c5bcb205f0ed532b34842de3d0346077454
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# Gerenciamento de Sessão e Compactação (Análise detalhada)

Este documento explica como o OpenClaw gerencia sessões de ponta a ponta:

- **Roteamento de sessão** (como mensagens de entrada são mapeadas para um `sessionKey`)
- **Armazenamento de sessão** (`sessions.json`) e o que ele rastreia
- **Persistência de transcrição** (`*.jsonl`) e sua estrutura
- **Higiene de transcrição** (ajustes específicos do provedor antes das execuções)
- **Limites de contexto** (janela de contexto vs tokens rastreados)
- **Compactação** (compactação manual + automática) e onde conectar tarefas pré-compactação
- **Manutenção silenciosa** (por exemplo, gravações de memória que não devem produzir saída visível ao usuário)

Se você quiser primeiro uma visão geral de nível mais alto, comece por:

- [/concepts/session](/pt-BR/concepts/session)
- [/concepts/compaction](/pt-BR/concepts/compaction)
- [/concepts/memory](/pt-BR/concepts/memory)
- [/concepts/memory-search](/pt-BR/concepts/memory-search)
- [/concepts/session-pruning](/pt-BR/concepts/session-pruning)
- [/reference/transcript-hygiene](/pt-BR/reference/transcript-hygiene)

---

## Fonte da verdade: o Gateway

O OpenClaw foi projetado em torno de um único **processo Gateway** que controla o estado da sessão.

- UIs (app do macOS, web Control UI, TUI) devem consultar o Gateway para listas de sessões e contagens de tokens.
- No modo remoto, os arquivos de sessão ficam no host remoto; “verificar seus arquivos locais no Mac” não refletirá o que o Gateway está usando.

---

## Duas camadas de persistência

O OpenClaw persiste sessões em duas camadas:

1. **Armazenamento de sessão (`sessions.json`)**
   - Mapa chave/valor: `sessionKey -> SessionEntry`
   - Pequeno, mutável, seguro para editar (ou excluir entradas)
   - Rastreia metadados da sessão (id atual da sessão, última atividade, toggles, contadores de tokens etc.)

2. **Transcrição (`<sessionId>.jsonl`)**
   - Transcrição append-only com estrutura em árvore (as entradas têm `id` + `parentId`)
   - Armazena a conversa real + chamadas de ferramenta + resumos de compactação
   - Usada para reconstruir o contexto do modelo para turnos futuros

---

## Locais em disco

Por agent, no host do Gateway:

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
- `resetArchiveRetention`: retenção para arquivos de arquivo de transcrição `*.reset.<timestamp>` (padrão: igual a `pruneAfter`; `false` desativa a limpeza)
- `maxDiskBytes`: orçamento opcional para o diretório de sessões
- `highWaterBytes`: alvo opcional após a limpeza (padrão `80%` de `maxDiskBytes`)

Ordem de aplicação para limpeza do orçamento de disco (`mode: "enforce"`):

1. Remova primeiro os artefatos de transcrição arquivados ou órfãos mais antigos.
2. Se ainda estiver acima do alvo, remova as entradas de sessão mais antigas e seus arquivos de transcrição.
3. Continue até que o uso fique em ou abaixo de `highWaterBytes`.

Em `mode: "warn"`, o OpenClaw informa possíveis remoções, mas não altera o armazenamento/arquivos.

Execute a manutenção sob demanda:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessões de cron e logs de execução

Execuções isoladas de cron também criam entradas/transcrições de sessão, e elas têm controles dedicados de retenção:

- `cron.sessionRetention` (padrão `24h`) remove sessões antigas de execução isolada de cron do armazenamento de sessão (`false` desativa).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` limpam arquivos `~/.openclaw/cron/runs/<jobId>.jsonl` (padrões: `2_000_000` bytes e `2000` linhas).

---

## Chaves de sessão (`sessionKey`)

Um `sessionKey` identifica _em qual bucket de conversa_ você está (roteamento + isolamento).

Padrões comuns:

- Chat principal/direto (por agent): `agent:<agentId>:<mainKey>` (padrão `main`)
- Grupo: `agent:<agentId>:<channel>:group:<id>`
- Sala/canal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` ou `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (a menos que seja sobrescrito)

As regras canônicas estão documentadas em [/concepts/session](/pt-BR/concepts/session).

---

## IDs de sessão (`sessionId`)

Cada `sessionKey` aponta para um `sessionId` atual (o arquivo de transcrição que continua a conversa).

Regras gerais:

- **Reset** (`/new`, `/reset`) cria um novo `sessionId` para aquele `sessionKey`.
- **Reset diário** (padrão às 4:00 da manhã no horário local do host do gateway) cria um novo `sessionId` na próxima mensagem após o limite de reset.
- **Expiração por inatividade** (`session.reset.idleMinutes` ou legado `session.idleMinutes`) cria um novo `sessionId` quando uma mensagem chega após a janela de inatividade. Quando reset diário + inatividade estão ambos configurados, vence o que expirar primeiro.
- **Proteção de fork de pai da thread** (`session.parentForkMaxTokens`, padrão `100000`) ignora o fork da transcrição pai quando a sessão pai já é grande demais; a nova thread começa do zero. Defina `0` para desativar.

Detalhe de implementação: a decisão acontece em `initSessionState()` em `src/auto-reply/reply/session.ts`.

---

## Schema do armazenamento de sessão (`sessions.json`)

O tipo de valor do armazenamento é `SessionEntry` em `src/config/sessions.ts`.

Campos principais (não exaustivo):

- `sessionId`: id atual da transcrição (o nome do arquivo é derivado disso, a menos que `sessionFile` esteja definido)
- `updatedAt`: timestamp da última atividade
- `sessionFile`: sobrescrita opcional explícita do caminho da transcrição
- `chatType`: `direct | group | room` (ajuda UIs e política de envio)
- `provider`, `subject`, `room`, `space`, `displayName`: metadados para rotulagem de grupo/canal
- Toggles:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (sobrescrita por sessão)
- Seleção de modelo:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contadores de tokens (melhor esforço / dependente do provedor):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: com que frequência a compactação automática foi concluída para esta chave de sessão
- `memoryFlushAt`: timestamp da última gravação de memória pré-compactação
- `memoryFlushCompactionCount`: contagem de compactação quando a última gravação foi executada

O armazenamento é seguro para editar, mas o Gateway é a autoridade: ele pode reescrever ou reidratar entradas conforme as sessões são executadas.

---

## Estrutura da transcrição (`*.jsonl`)

As transcrições são gerenciadas pelo `SessionManager` de `@mariozechner/pi-coding-agent`.

O arquivo é JSONL:

- Primeira linha: cabeçalho da sessão (`type: "session"`, inclui `id`, `cwd`, `timestamp`, `parentSession` opcional)
- Depois: entradas da sessão com `id` + `parentId` (árvore)

Tipos de entrada notáveis:

- `message`: mensagens de usuário/assistant/toolResult
- `custom_message`: mensagens injetadas por extensão que _entram_ no contexto do modelo (podem ficar ocultas na UI)
- `custom`: estado de extensão que _não_ entra no contexto do modelo
- `compaction`: resumo de compactação persistido com `firstKeptEntryId` e `tokensBefore`
- `branch_summary`: resumo persistido ao navegar por um ramo da árvore

O OpenClaw intencionalmente **não** faz “fix up” nas transcrições; o Gateway usa `SessionManager` para lê-las/escrevê-las.

---

## Janelas de contexto vs tokens rastreados

Dois conceitos diferentes importam:

1. **Janela de contexto do modelo**: limite rígido por modelo (tokens visíveis ao modelo)
2. **Contadores do armazenamento de sessão**: estatísticas acumuladas gravadas em `sessions.json` (usadas por /status e dashboards)

Se você estiver ajustando limites:

- A janela de contexto vem do catálogo de modelos (e pode ser sobrescrita via configuração).
- `contextTokens` no armazenamento é um valor de estimativa/relatório em runtime; não o trate como garantia rígida.

Para mais detalhes, veja [/token-use](/pt-BR/reference/token-use).

---

## Compactação: o que é

A compactação resume a conversa mais antiga em uma entrada `compaction` persistida na transcrição e mantém intactas as mensagens recentes.

Após a compactação, turnos futuros veem:

- O resumo de compactação
- Mensagens após `firstKeptEntryId`

A compactação é **persistente** (ao contrário da poda de sessão). Veja [/concepts/session-pruning](/pt-BR/concepts/session-pruning).

## Limites de chunk de compactação e pareamento de ferramentas

Quando o OpenClaw divide uma transcrição longa em chunks de compactação, ele mantém
as chamadas de ferramenta do assistant pareadas com suas entradas `toolResult` correspondentes.

- Se a divisão por proporção de tokens cair entre uma chamada de ferramenta e seu resultado, o OpenClaw
  desloca o limite para a mensagem de chamada de ferramenta do assistant em vez de separar
  o par.
- Se um bloco final de resultado de ferramenta de outra forma fizer o chunk ultrapassar o alvo,
  o OpenClaw preserva esse bloco pendente de ferramenta e mantém intacta a cauda não resumida.
- Blocos de chamada de ferramenta abortados/com erro não mantêm uma divisão pendente aberta.

---

## Quando a compactação automática acontece (runtime Pi)

No agent Pi embutido, a compactação automática é acionada em dois casos:

1. **Recuperação de overflow**: o modelo retorna um erro de overflow de contexto
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` e variantes semelhantes específicas de provedores) → compacta → tenta novamente.
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
- Se já estiver maior, o OpenClaw o deixa como está.

Por quê: deixar folga suficiente para “manutenção” de múltiplos turnos (como gravações de memória) antes que a compactação se torne inevitável.

Implementação: `ensurePiCompactionReserveTokens()` em `src/agents/pi-settings.ts`
(chamado de `src/agents/pi-embedded-runner.ts`).

---

## Provedores de compactação conectáveis

Plugins podem registrar um provedor de compactação via `registerCompactionProvider()` na API do plugin. Quando `agents.defaults.compaction.provider` está definido com um id de provedor registrado, a extensão de safeguard delega a sumarização a esse provedor em vez do pipeline embutido `summarizeInStages`.

- `provider`: id de um plugin de provedor de compactação registrado. Deixe sem definir para usar a sumarização LLM padrão.
- Definir um `provider` força `mode: "safeguard"`.
- Os provedores recebem as mesmas instruções de compactação e política de preservação de identificadores que o caminho embutido.
- O safeguard ainda preserva o contexto de sufixo de turnos recentes e turnos divididos após a saída do provedor.
- Se o provedor falhar ou retornar um resultado vazio, o OpenClaw recorre automaticamente à sumarização LLM embutida.
- Sinais de abort/timeout são relançados (não são engolidos) para respeitar o cancelamento do chamador.

Fonte: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Superfícies visíveis ao usuário

Você pode observar a compactação e o estado da sessão por meio de:

- `/status` (em qualquer sessão de chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Modo verbose: `🧹 Auto-compaction complete` + contagem de compactação

---

## Manutenção silenciosa (`NO_REPLY`)

O OpenClaw oferece suporte a turnos “silenciosos” para tarefas em segundo plano em que o usuário não deve ver saída intermediária.

Convenção:

- O assistant inicia sua saída com o token silencioso exato `NO_REPLY` /
  `no_reply` para indicar “não entregar uma resposta ao usuário”.
- O OpenClaw remove/suprime isso na camada de entrega.
- A supressão do token silencioso exato não diferencia maiúsculas de minúsculas, então `NO_REPLY` e
  `no_reply` contam quando o payload inteiro é apenas o token silencioso.
- Isso é apenas para turnos realmente em segundo plano/sem entrega; não é um atalho para
  solicitações normais e acionáveis do usuário.

A partir de `2026.1.10`, o OpenClaw também suprime **streaming de rascunho/digitação** quando um
chunk parcial começa com `NO_REPLY`, para que operações silenciosas não vazem saída parcial no meio do turno.

---

## "Memory flush" pré-compactação (implementado)

Objetivo: antes que a compactação automática aconteça, executar um turno agentic silencioso que grave estado durável
em disco (por exemplo `memory/YYYY-MM-DD.md` no workspace do agent) para que a compactação não possa
apagar contexto crítico.

O OpenClaw usa a abordagem de **gravação antes do limite**:

1. Monitorar o uso de contexto da sessão.
2. Quando ele ultrapassar um “limite suave” (abaixo do limite de compactação do Pi), executar uma diretiva silenciosa
   “grave a memória agora” para o agent.
3. Usar o token silencioso exato `NO_REPLY` / `no_reply` para que o usuário não veja
   nada.

Configuração (`agents.defaults.compaction.memoryFlush`):

- `enabled` (padrão: `true`)
- `softThresholdTokens` (padrão: `4000`)
- `prompt` (mensagem do usuário para o turno de gravação)
- `systemPrompt` (prompt de sistema extra anexado para o turno de gravação)

Observações:

- O prompt padrão/systemPrompt padrão inclui uma dica `NO_REPLY` para suprimir
  a entrega.
- A gravação é executada uma vez por ciclo de compactação (rastreado em `sessions.json`).
- A gravação é executada apenas para sessões Pi embutidas (backends CLI a ignoram).
- A gravação é ignorada quando o workspace da sessão é somente leitura (`workspaceAccess: "ro"` ou `"none"`).
- Veja [Memory](/pt-BR/concepts/memory) para o layout de arquivos do workspace e os padrões de gravação.

O Pi também expõe um hook `session_before_compact` na API de extensão, mas a lógica de
gravação do OpenClaw hoje fica no lado do Gateway.

---

## Checklist de solução de problemas

- Chave de sessão errada? Comece por [/concepts/session](/pt-BR/concepts/session) e confirme o `sessionKey` em `/status`.
- Incompatibilidade entre armazenamento e transcrição? Confirme o host do Gateway e o caminho do armazenamento em `openclaw status`.
- Spam de compactação? Verifique:
  - janela de contexto do modelo (pequena demais)
  - configurações de compactação (`reserveTokens` alto demais para a janela do modelo pode causar compactação mais cedo)
  - excesso de tool-result: ative/ajuste a poda de sessão
- Turnos silenciosos vazando? Confirme que a resposta começa com `NO_REPLY` (token exato, sem diferenciar maiúsculas de minúsculas) e que você está em uma build que inclui a correção de supressão de streaming.
