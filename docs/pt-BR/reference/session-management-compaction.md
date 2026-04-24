---
read_when:
    - Você precisa depurar IDs de sessão, JSONL de transcrição ou campos de sessions.json
    - Você está alterando o comportamento da Compaction automática ou adicionando tarefas de housekeeping “pré-Compaction”
    - Você quer implementar memory flushes ou turnos silenciosos de sistema
summary: 'Análise detalhada: armazenamento de sessão + transcrições, ciclo de vida e internos da Compaction (automática)'
title: Análise detalhada do gerenciamento de sessão
x-i18n:
    generated_at: "2026-04-24T06:11:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e236840ebf9d4980339c801c1ecb70a7f413ea18987400ac47db0818b5cab8c
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# Gerenciamento de sessão e Compaction (análise detalhada)

Este documento explica como o OpenClaw gerencia sessões de ponta a ponta:

- **Roteamento de sessão** (como mensagens de entrada mapeiam para uma `sessionKey`)
- **Armazenamento de sessão** (`sessions.json`) e o que ele rastreia
- **Persistência de transcrição** (`*.jsonl`) e sua estrutura
- **Higiene de transcrição** (correções específicas de provedor antes das execuções)
- **Limites de contexto** (janela de contexto vs tokens rastreados)
- **Compaction** (manual + Compaction automática) e onde conectar trabalho pré-Compaction
- **Housekeeping silencioso** (por exemplo, gravações em memory que não devem produzir saída visível ao usuário)

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

- UIs (app macOS, Control UI web, TUI) devem consultar o Gateway para listas de sessões e contagens de tokens.
- No modo remoto, os arquivos de sessão ficam no host remoto; “verificar seus arquivos locais no Mac” não refletirá o que o Gateway está usando.

---

## Duas camadas de persistência

O OpenClaw persiste sessões em duas camadas:

1. **Armazenamento de sessão (`sessions.json`)**
   - Mapa chave/valor: `sessionKey -> SessionEntry`
   - Pequeno, mutável, seguro para editar (ou excluir entradas)
   - Rastreia metadados de sessão (ID da sessão atual, última atividade, toggles, contadores de tokens etc.)

2. **Transcrição (`<sessionId>.jsonl`)**
   - Transcrição append-only com estrutura de árvore (entradas têm `id` + `parentId`)
   - Armazena a conversa real + chamadas de ferramenta + resumos de Compaction
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
- `rotateBytes`: rotaciona `sessions.json` quando estiver grande demais (padrão `10mb`)
- `resetArchiveRetention`: retenção para arquivos de transcrição `*.reset.<timestamp>` (padrão: igual a `pruneAfter`; `false` desativa a limpeza)
- `maxDiskBytes`: orçamento opcional para o diretório de sessões
- `highWaterBytes`: alvo opcional após limpeza (padrão `80%` de `maxDiskBytes`)

Ordem de aplicação da limpeza por orçamento de disco (`mode: "enforce"`):

1. Remove primeiro os artefatos de transcrição arquivados ou órfãos mais antigos.
2. Se ainda estiver acima do alvo, remove as entradas de sessão mais antigas e seus arquivos de transcrição.
3. Continua até o uso ficar em ou abaixo de `highWaterBytes`.

Em `mode: "warn"`, o OpenClaw informa possíveis remoções, mas não altera o armazenamento/arquivos.

Execute a manutenção sob demanda:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessões Cron e logs de execução

Execuções Cron isoladas também criam entradas/transcrições de sessão e têm controles dedicados de retenção:

- `cron.sessionRetention` (padrão `24h`) remove sessões antigas de execuções Cron isoladas do armazenamento de sessão (`false` desativa).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` fazem prune em arquivos `~/.openclaw/cron/runs/<jobId>.jsonl` (padrões: `2_000_000` bytes e `2000` linhas).

---

## Chaves de sessão (`sessionKey`)

Uma `sessionKey` identifica _qual bucket de conversa_ você está usando (roteamento + isolamento).

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
- **Reset diário** (padrão às 4:00 da manhã, horário local no host do gateway) cria um novo `sessionId` na próxima mensagem após o limite de reset.
- **Expiração por inatividade** (`session.reset.idleMinutes` ou legado `session.idleMinutes`) cria um novo `sessionId` quando uma mensagem chega após a janela de inatividade. Quando diário + inatividade estão ambos configurados, vence o que expirar primeiro.
- **Proteção de fork do pai da thread** (`session.parentForkMaxTokens`, padrão `100000`) ignora o fork da transcrição pai quando a sessão pai já é grande demais; a nova thread começa do zero. Defina `0` para desativar.

Detalhe de implementação: a decisão acontece em `initSessionState()` em `src/auto-reply/reply/session.ts`.

---

## Schema do armazenamento de sessão (`sessions.json`)

O tipo de valor do armazenamento é `SessionEntry` em `src/config/sessions.ts`.

Campos importantes (não exaustivos):

- `sessionId`: ID da transcrição atual (o nome do arquivo é derivado disso, a menos que `sessionFile` esteja definido)
- `updatedAt`: timestamp da última atividade
- `sessionFile`: substituição opcional explícita do caminho da transcrição
- `chatType`: `direct | group | room` (ajuda UIs e política de envio)
- `provider`, `subject`, `room`, `space`, `displayName`: metadados para rotulagem de grupo/canal
- Toggles:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (substituição por sessão)
- Seleção de modelo:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contadores de tokens (melhor esforço / dependentes do provedor):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: quantas vezes a Compaction automática foi concluída para essa chave de sessão
- `memoryFlushAt`: timestamp do último memory flush pré-Compaction
- `memoryFlushCompactionCount`: contagem de Compaction quando o último flush foi executado

O armazenamento é seguro para edição, mas o Gateway é a autoridade: ele pode reescrever ou reidratar entradas à medida que as sessões são executadas.

---

## Estrutura da transcrição (`*.jsonl`)

As transcrições são gerenciadas pelo `SessionManager` do `@mariozechner/pi-coding-agent`.

O arquivo é JSONL:

- Primeira linha: cabeçalho da sessão (`type: "session"`, inclui `id`, `cwd`, `timestamp`, `parentSession` opcional)
- Depois: entradas de sessão com `id` + `parentId` (árvore)

Tipos de entrada importantes:

- `message`: mensagens de usuário/assistente/toolResult
- `custom_message`: mensagens injetadas por extensão que _entram_ no contexto do modelo (podem ficar ocultas na UI)
- `custom`: estado de extensão que _não_ entra no contexto do modelo
- `compaction`: resumo persistido de Compaction com `firstKeptEntryId` e `tokensBefore`
- `branch_summary`: resumo persistido ao navegar por um branch da árvore

O OpenClaw intencionalmente **não** “corrige” transcrições; o Gateway usa `SessionManager` para lê-las/escrevê-las.

---

## Janelas de contexto vs tokens rastreados

Dois conceitos diferentes importam:

1. **Janela de contexto do modelo**: limite rígido por modelo (tokens visíveis ao modelo)
2. **Contadores do armazenamento de sessão**: estatísticas contínuas gravadas em `sessions.json` (usadas por /status e dashboards)

Se você estiver ajustando limites:

- A janela de contexto vem do catálogo de modelos (e pode ser sobrescrita pela configuração).
- `contextTokens` no armazenamento é um valor de estimativa/relato em runtime; não o trate como uma garantia rígida.

Para mais detalhes, consulte [/token-use](/pt-BR/reference/token-use).

---

## Compaction: o que é

A Compaction resume a parte mais antiga da conversa em uma entrada `compaction` persistida na transcrição e mantém intactas as mensagens recentes.

Após a Compaction, turnos futuros veem:

- O resumo de Compaction
- Mensagens após `firstKeptEntryId`

A Compaction é **persistente** (ao contrário de session pruning). Consulte [/concepts/session-pruning](/pt-BR/concepts/session-pruning).

## Limites de blocos de Compaction e pareamento de ferramentas

Quando o OpenClaw divide uma transcrição longa em blocos de Compaction, ele mantém
chamadas de ferramenta do assistente pareadas com as entradas `toolResult` correspondentes.

- Se a divisão por participação de tokens cair entre uma chamada de ferramenta e seu resultado, o OpenClaw
  desloca o limite para a mensagem de chamada de ferramenta do assistente em vez de separar
  o par.
- Se um bloco final de resultado de ferramenta ultrapassaria o alvo,
  o OpenClaw preserva esse bloco de ferramenta pendente e mantém intacta a cauda não resumida.
- Blocos de chamada de ferramenta abortados/com erro não mantêm uma divisão pendente aberta.

---

## Quando a Compaction automática acontece (runtime Pi)

No agente Pi embutido, a Compaction automática é acionada em dois casos:

1. **Recuperação de estouro**: o modelo retorna um erro de estouro de contexto
   (`request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model`, `ollama error: context
length exceeded` e variantes semelhantes moldadas pelo provedor) → compacta → tenta novamente.
2. **Manutenção por limite**: após um turno bem-sucedido, quando:

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

Por quê: deixar folga suficiente para “housekeeping” em vários turnos (como gravações em memory) antes que a Compaction se torne inevitável.

Implementação: `ensurePiCompactionReserveTokens()` em `src/agents/pi-settings.ts`
(chamado de `src/agents/pi-embedded-runner.ts`).

---

## Provedores conectáveis de Compaction

Plugins podem registrar um provedor de Compaction via `registerCompactionProvider()` na API de Plugin. Quando `agents.defaults.compaction.provider` está definido para o ID de um provedor registrado, a extensão safeguard delega a sumarização a esse provedor em vez do pipeline integrado `summarizeInStages`.

- `provider`: ID de um Plugin de provedor de Compaction registrado. Deixe sem definir para a sumarização padrão por LLM.
- Definir um `provider` força `mode: "safeguard"`.
- Os provedores recebem as mesmas instruções de Compaction e a mesma política de preservação de identificadores do caminho integrado.
- O safeguard ainda preserva o contexto de sufixo de turnos recentes e turnos divididos após a saída do provedor.
- Se o provedor falhar ou retornar um resultado vazio, o OpenClaw recorre automaticamente à sumarização LLM integrada.
- Sinais de abort/timeout são relançados (não suprimidos) para respeitar o cancelamento do chamador.

Fonte: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Superfícies visíveis ao usuário

Você pode observar a Compaction e o estado da sessão via:

- `/status` (em qualquer sessão de chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Modo detalhado: `🧹 Auto-compaction complete` + contagem de Compaction

---

## Housekeeping silencioso (`NO_REPLY`)

O OpenClaw oferece suporte a turnos “silenciosos” para tarefas em segundo plano em que o usuário não deve ver saída intermediária.

Convenção:

- O assistente inicia sua saída com o token silencioso exato `NO_REPLY` /
  `no_reply` para indicar “não entregar uma resposta ao usuário”.
- O OpenClaw remove/suprime isso na camada de entrega.
- A supressão por token silencioso exato não diferencia maiúsculas de minúsculas, então `NO_REPLY` e
  `no_reply` contam quando a carga inteira é apenas o token silencioso.
- Isso é para turnos realmente em segundo plano/sem entrega; não é um atalho para
  solicitações comuns e acionáveis do usuário.

A partir de `2026.1.10`, o OpenClaw também suprime **streaming de rascunho/digitação** quando um
chunk parcial começa com `NO_REPLY`, para que operações silenciosas não vazem saída parcial no meio do turno.

---

## “Memory flush” pré-Compaction (implementado)

Objetivo: antes que a Compaction automática aconteça, executar um turno agentic silencioso que grave estado durável
em disco (por exemplo `memory/YYYY-MM-DD.md` no workspace do agente), para que a Compaction não possa
apagar contexto crítico.

O OpenClaw usa a abordagem de **flush antes do limite**:

1. Monitorar o uso de contexto da sessão.
2. Quando ele cruza um “limite suave” (abaixo do limite de Compaction do Pi), executar uma diretiva silenciosa
   de “gravar memory agora” para o agente.
3. Usar o token silencioso exato `NO_REPLY` / `no_reply` para que o usuário não veja
   nada.

Configuração (`agents.defaults.compaction.memoryFlush`):

- `enabled` (padrão: `true`)
- `softThresholdTokens` (padrão: `4000`)
- `prompt` (mensagem do usuário para o turno de flush)
- `systemPrompt` (prompt extra de sistema anexado ao turno de flush)

Observações:

- O prompt/system prompt padrão inclui uma dica `NO_REPLY` para suprimir
  a entrega.
- O flush é executado uma vez por ciclo de Compaction (rastreado em `sessions.json`).
- O flush é executado apenas para sessões Pi embutidas (backends de CLI o ignoram).
- O flush é ignorado quando o workspace da sessão é somente leitura (`workspaceAccess: "ro"` ou `"none"`).
- Consulte [Memory](/pt-BR/concepts/memory) para ver o layout de arquivos do workspace e os padrões de gravação.

O Pi também expõe um hook `session_before_compact` na API de extensões, mas a lógica de
flush do OpenClaw vive hoje no lado do Gateway.

---

## Checklist de solução de problemas

- Chave de sessão errada? Comece por [/concepts/session](/pt-BR/concepts/session) e confirme a `sessionKey` em `/status`.
- Incompatibilidade entre armazenamento e transcrição? Confirme o host do Gateway e o caminho do armazenamento com `openclaw status`.
- Spam de Compaction? Verifique:
  - janela de contexto do modelo (pequena demais)
  - configurações de Compaction (`reserveTokens` alto demais para a janela do modelo pode causar Compaction mais cedo)
  - crescimento excessivo de resultado de ferramenta: ative/ajuste session pruning
- Turnos silenciosos vazando? Confirme se a resposta começa com `NO_REPLY` (token exato sem diferenciar maiúsculas/minúsculas) e se você está em uma build que inclui a correção de supressão de streaming.

## Relacionado

- [Gerenciamento de sessão](/pt-BR/concepts/session)
- [Session pruning](/pt-BR/concepts/session-pruning)
- [Context engine](/pt-BR/concepts/context-engine)
