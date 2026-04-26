---
read_when:
    - Você precisa depurar IDs de sessão, o JSONL da transcrição ou campos de `sessions.json`
    - Você está alterando o comportamento da Compaction automática ou adicionando tarefas internas de manutenção “pré-Compaction”
    - Você quer implementar descarregamentos de memória ou turnos silenciosos do sistema
summary: 'Análise detalhada: armazenamento de sessão + transcrições, ciclo de vida e detalhes internos da Compaction (automática)'
title: Análise detalhada do gerenciamento de sessões
x-i18n:
    generated_at: "2026-04-26T11:37:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: f41f1c403f978c22cc2a929629e1811414d1399fa7f9e28c481fcb594d30196f
    source_path: reference/session-management-compaction.md
    workflow: 15
---

Esta página explica como o OpenClaw gerencia sessões de ponta a ponta:

- **Roteamento de sessão** (como mensagens recebidas mapeiam para uma `sessionKey`)
- **Armazenamento de sessões** (`sessions.json`) e o que ele rastreia
- **Persistência de transcrição** (`*.jsonl`) e sua estrutura
- **Higiene da transcrição** (ajustes específicos de provedor antes das execuções)
- **Limites de contexto** (janela de contexto vs. tokens rastreados)
- **Compaction** (Compaction manual + automática) e onde conectar trabalho pré-Compaction
- **Limpeza silenciosa** (por exemplo, gravações de memória que não devem produzir saída visível ao usuário)

Se você quiser primeiro uma visão geral de nível mais alto, comece com:

- [Gerenciamento de sessões](/pt-BR/concepts/session)
- [Compaction](/pt-BR/concepts/compaction)
- [Visão geral da memória](/pt-BR/concepts/memory)
- [Pesquisa de memória](/pt-BR/concepts/memory-search)
- [Poda de sessão](/pt-BR/concepts/session-pruning)
- [Higiene da transcrição](/pt-BR/reference/transcript-hygiene)

---

## Fonte da verdade: o Gateway

O OpenClaw foi projetado em torno de um único **processo Gateway** que é dono do estado da sessão.

- As UIs (app para macOS, web Control UI, TUI) devem consultar o Gateway para listas de sessões e contagens de tokens.
- No modo remoto, os arquivos de sessão ficam no host remoto; “verificar seus arquivos locais do Mac” não refletirá o que o Gateway está usando.

---

## Duas camadas de persistência

O OpenClaw persiste sessões em duas camadas:

1. **Armazenamento de sessões (`sessions.json`)**
   - Mapa chave/valor: `sessionKey -> SessionEntry`
   - Pequeno, mutável, seguro para editar (ou excluir entradas)
   - Rastreia metadados da sessão (id da sessão atual, última atividade, alternâncias, contadores de tokens etc.)

2. **Transcrição (`<sessionId>.jsonl`)**
   - Transcrição somente de acréscimo com estrutura em árvore (as entradas têm `id` + `parentId`)
   - Armazena a conversa real + chamadas de ferramenta + resumos de Compaction
   - Usada para reconstruir o contexto do modelo em interações futuras

---

## Locais em disco

Por agente, no host do Gateway:

- Armazenamento: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcrições: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sessões de tópico do Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

O OpenClaw resolve isso por meio de `src/config/sessions.ts`.

---

## Manutenção do armazenamento e controles de disco

A persistência de sessão tem controles automáticos de manutenção (`session.maintenance`) para `sessions.json` e artefatos de transcrição:

- `mode`: `warn` (padrão) ou `enforce`
- `pruneAfter`: limite de idade para entradas obsoletas (padrão `30d`)
- `maxEntries`: limite de entradas em `sessions.json` (padrão `500`)
- `rotateBytes`: rotaciona `sessions.json` quando ficar grande demais (padrão `10mb`)
- `resetArchiveRetention`: retenção para arquivos de transcrição arquivados `*.reset.<timestamp>` (padrão: igual a `pruneAfter`; `false` desabilita a limpeza)
- `maxDiskBytes`: orçamento opcional para o diretório de sessões
- `highWaterBytes`: meta opcional após a limpeza (padrão `80%` de `maxDiskBytes`)

Ordem de aplicação para limpeza por orçamento de disco (`mode: "enforce"`):

1. Remover primeiro os artefatos de transcrição arquivados ou órfãos mais antigos.
2. Se ainda estiver acima da meta, remover as entradas de sessão mais antigas e seus arquivos de transcrição.
3. Continuar até que o uso esteja em ou abaixo de `highWaterBytes`.

No `mode: "warn"`, o OpenClaw relata remoções potenciais, mas não altera o armazenamento/arquivos.

Execute a manutenção sob demanda:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessões de Cron e logs de execução

Execuções isoladas de Cron também criam entradas/transcrições de sessão, e elas têm controles de retenção dedicados:

- `cron.sessionRetention` (padrão `24h`) remove do armazenamento de sessões as sessões antigas de execução isolada de Cron (`false` desabilita).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` podam arquivos `~/.openclaw/cron/runs/<jobId>.jsonl` (padrões: `2_000_000` bytes e `2000` linhas).

Quando o Cron força a criação de uma nova sessão de execução isolada, ele sanitiza a entrada de sessão anterior `cron:<jobId>` antes de gravar a nova linha. Ele carrega preferências seguras, como configurações de thinking/fast/verbose, rótulos e substituições explícitas de modelo/autenticação selecionadas pelo usuário. Ele remove contexto de conversa ambiente, como roteamento de canal/grupo, política de envio ou fila, elevação, origem e vinculação de runtime do ACP, para que uma nova execução isolada não possa herdar entrega obsoleta ou autoridade de runtime de uma execução mais antiga.

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

Cada `sessionKey` aponta para um `sessionId` atual (o arquivo de transcrição que continua a conversa).

Regras gerais:

- **Reset** (`/new`, `/reset`) cria um novo `sessionId` para aquela `sessionKey`.
- **Reset diário** (padrão às 4:00 da manhã no horário local do host do gateway) cria um novo `sessionId` na próxima mensagem após o limite de reset.
- **Expiração por inatividade** (`session.reset.idleMinutes` ou legado `session.idleMinutes`) cria um novo `sessionId` quando uma mensagem chega após a janela de inatividade. Quando diário + inatividade estão ambos configurados, vence o que expirar primeiro.
- **Eventos do sistema** (Heartbeat, despertares de Cron, notificações de exec, tarefas administrativas do gateway) podem alterar a linha da sessão, mas não estendem a validade do reset diário/por inatividade. A troca por reset descarta avisos enfileirados de eventos do sistema da sessão anterior antes que o prompt novo seja construído.
- **Proteção contra bifurcação de pai da thread** (`session.parentForkMaxTokens`, padrão `100000`) ignora a bifurcação da transcrição pai quando a sessão pai já é grande demais; a nova thread começa do zero. Defina `0` para desabilitar.

Detalhe de implementação: a decisão acontece em `initSessionState()` em `src/auto-reply/reply/session.ts`.

---

## Esquema do armazenamento de sessões (`sessions.json`)

O tipo de valor do armazenamento é `SessionEntry` em `src/config/sessions.ts`.

Campos principais (não exaustivos):

- `sessionId`: id atual da transcrição (o nome do arquivo é derivado disso, a menos que `sessionFile` esteja definido)
- `sessionStartedAt`: carimbo de data/hora de início do `sessionId` atual; a validade do reset diário usa isso. Linhas legadas podem derivá-lo do cabeçalho da sessão no JSONL.
- `lastInteractionAt`: carimbo de data/hora da última interação real de usuário/canal; a validade do reset por inatividade usa isso para que eventos de Heartbeat, Cron e exec não mantenham sessões ativas. Linhas legadas sem esse campo recorrem ao horário de início da sessão recuperado para a validade por inatividade.
- `updatedAt`: carimbo de data/hora da última alteração da linha no armazenamento, usado para listagem, poda e tarefas administrativas. Não é a autoridade para a validade do reset diário/por inatividade.
- `sessionFile`: substituição opcional explícita do caminho da transcrição
- `chatType`: `direct | group | room` (ajuda UIs e política de envio)
- `provider`, `subject`, `room`, `space`, `displayName`: metadados para rotulagem de grupo/canal
- Alternâncias:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (substituição por sessão)
- Seleção de modelo:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contadores de tokens (melhor esforço / dependentes do provedor):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: com que frequência a auto-Compaction foi concluída para esta chave de sessão
- `memoryFlushAt`: carimbo de data/hora do último flush de memória pré-Compaction
- `memoryFlushCompactionCount`: contagem de Compaction quando o último flush foi executado

O armazenamento é seguro para editar, mas o Gateway é a autoridade: ele pode regravar ou reidratar entradas conforme as sessões são executadas.

---

## Estrutura da transcrição (`*.jsonl`)

As transcrições são gerenciadas pelo `SessionManager` de `@mariozechner/pi-coding-agent`.

O arquivo é JSONL:

- Primeira linha: cabeçalho da sessão (`type: "session"`, inclui `id`, `cwd`, `timestamp`, `parentSession` opcional)
- Depois: entradas de sessão com `id` + `parentId` (árvore)

Tipos de entrada notáveis:

- `message`: mensagens de usuário/assistant/toolResult
- `custom_message`: mensagens injetadas por extensão que _entram_ no contexto do modelo (podem ficar ocultas na UI)
- `custom`: estado da extensão que _não_ entra no contexto do modelo
- `compaction`: resumo persistido de Compaction com `firstKeptEntryId` e `tokensBefore`
- `branch_summary`: resumo persistido ao navegar em um ramo da árvore

O OpenClaw intencionalmente **não** “corrige” transcrições; o Gateway usa o `SessionManager` para lê-las/gravá-las.

---

## Janelas de contexto vs. tokens rastreados

Dois conceitos diferentes importam:

1. **Janela de contexto do modelo**: limite rígido por modelo (tokens visíveis ao modelo)
2. **Contadores do armazenamento de sessões**: estatísticas contínuas gravadas em `sessions.json` (usadas por /status e painéis)

Se você estiver ajustando limites:

- A janela de contexto vem do catálogo de modelos (e pode ser substituída via configuração).
- `contextTokens` no armazenamento é um valor de estimativa/relatório em tempo de execução; não o trate como uma garantia rígida.

Para mais detalhes, veja [/token-use](/pt-BR/reference/token-use).

---

## Compaction: o que é

Compaction resume conversas antigas em uma entrada `compaction` persistida na transcrição e mantém intactas as mensagens recentes.

Após a Compaction, interações futuras veem:

- O resumo da Compaction
- Mensagens após `firstKeptEntryId`

A Compaction é **persistente** (ao contrário da poda de sessão). Veja [/concepts/session-pruning](/pt-BR/concepts/session-pruning).

## Limites de blocos de Compaction e pareamento de ferramentas

Quando o OpenClaw divide uma transcrição longa em blocos de Compaction, ele mantém chamadas de ferramenta do assistant pareadas com suas entradas `toolResult` correspondentes.

- Se a divisão por participação de tokens cair entre uma chamada de ferramenta e seu resultado, o OpenClaw desloca o limite para a mensagem de chamada de ferramenta do assistant em vez de separar o par.
- Se um bloco final de resultado de ferramenta, de outra forma, empurraria o bloco além da meta, o OpenClaw preserva esse bloco de ferramenta pendente e mantém intacta a cauda não resumida.
- Blocos de chamada de ferramenta abortados/com erro não mantêm uma divisão pendente aberta.

---

## Quando a auto-Compaction acontece (runtime do Pi)

No agente Pi incorporado, a auto-Compaction é acionada em dois casos:

1. **Recuperação de overflow**: o modelo retorna um erro de overflow de contexto (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` e variantes semelhantes moldadas pelo provedor) → compactar → tentar novamente.
2. **Manutenção por limite**: após uma interação bem-sucedida, quando:

`contextTokens > contextWindow - reserveTokens`

Onde:

- `contextWindow` é a janela de contexto do modelo
- `reserveTokens` é a margem reservada para prompts + a próxima saída do modelo

Essas são semânticas do runtime do Pi (o OpenClaw consome os eventos, mas o Pi decide quando compactar).

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

- Se `compaction.reserveTokens < reserveTokensFloor`, o OpenClaw aumenta esse valor.
- O piso padrão é `20000` tokens.
- Defina `agents.defaults.compaction.reserveTokensFloor: 0` para desabilitar o piso.
- Se já estiver mais alto, o OpenClaw o deixa como está.
- `/compact` manual respeita um `agents.defaults.compaction.keepRecentTokens` explícito e mantém o ponto de corte da cauda recente do Pi. Sem um orçamento explícito de retenção, a Compaction manual continua sendo um ponto de controle rígido e o contexto reconstruído começa a partir do novo resumo.

Por quê: deixar margem suficiente para “tarefas administrativas” em várias interações (como gravações de memória) antes que a Compaction se torne inevitável.

Implementação: `ensurePiCompactionReserveTokens()` em `src/agents/pi-settings.ts`
(chamada de `src/agents/pi-embedded-runner.ts`).

---

## Provedores de Compaction conectáveis

Plugins podem registrar um provedor de Compaction por meio de `registerCompactionProvider()` na API de plugin. Quando `agents.defaults.compaction.provider` é definido como o id de um provedor registrado, a extensão de safeguard delega o resumo a esse provedor em vez do pipeline integrado `summarizeInStages`.

- `provider`: id de um plugin de provedor de Compaction registrado. Deixe sem definir para usar o resumo LLM padrão.
- Definir um `provider` força `mode: "safeguard"`.
- Os provedores recebem as mesmas instruções de Compaction e a mesma política de preservação de identificadores do caminho integrado.
- O safeguard ainda preserva o contexto do sufixo de interação recente e de interação dividida após a saída do provedor.
- O resumo integrado do safeguard redestila resumos anteriores com novas mensagens em vez de preservar o resumo anterior completo literalmente.
- O modo safeguard habilita auditorias de qualidade do resumo por padrão; defina `qualityGuard.enabled: false` para ignorar o comportamento de nova tentativa em caso de saída malformada.
- Se o provedor falhar ou retornar um resultado vazio, o OpenClaw recorre automaticamente ao resumo LLM integrado.
- Sinais de aborto/timeout são relançados (não são engolidos) para respeitar o cancelamento do chamador.

Fonte: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Superfícies visíveis ao usuário

Você pode observar a Compaction e o estado da sessão por meio de:

- `/status` (em qualquer sessão de chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Modo verboso: `🧹 Auto-compaction complete` + contagem de Compaction

---

## Limpeza silenciosa (`NO_REPLY`)

O OpenClaw oferece suporte a interações “silenciosas” para tarefas em segundo plano em que o usuário não deve ver a saída intermediária.

Convenção:

- O assistant inicia sua saída com o token silencioso exato `NO_REPLY` /
  `no_reply` para indicar “não entregar uma resposta ao usuário”.
- O OpenClaw remove/suprime isso na camada de entrega.
- A supressão exata do token silencioso não diferencia maiúsculas de minúsculas, então `NO_REPLY` e
  `no_reply` contam quando toda a carga é apenas o token silencioso.
- Isso é apenas para interações realmente em segundo plano/sem entrega; não é um atalho para solicitações normais e acionáveis do usuário.

A partir de `2026.1.10`, o OpenClaw também suprime **streaming de rascunho/digitação** quando um bloco parcial começa com `NO_REPLY`, para que operações silenciosas não vazem saída parcial no meio da interação.

---

## "Memory flush" pré-Compaction (implementado)

Objetivo: antes que a auto-Compaction aconteça, executar uma interação agentic silenciosa que grave estado durável no disco (por exemplo, `memory/YYYY-MM-DD.md` no workspace do agente) para que a Compaction não possa apagar contexto crítico.

O OpenClaw usa a abordagem de **flush pré-limite**:

1. Monitorar o uso de contexto da sessão.
2. Quando ele ultrapassar um “limite suave” (abaixo do limite de Compaction do Pi), executar uma diretiva silenciosa “escreva a memória agora” para o agente.
3. Usar o token silencioso exato `NO_REPLY` / `no_reply` para que o usuário não veja nada.

Configuração (`agents.defaults.compaction.memoryFlush`):

- `enabled` (padrão: `true`)
- `softThresholdTokens` (padrão: `4000`)
- `prompt` (mensagem do usuário para a interação de flush)
- `systemPrompt` (prompt de sistema extra anexado para a interação de flush)

Observações:

- O prompt padrão/system prompt padrão inclui uma dica `NO_REPLY` para suprimir a entrega.
- O flush é executado uma vez por ciclo de Compaction (rastreado em `sessions.json`).
- O flush é executado apenas para sessões Pi incorporadas (backends CLI o ignoram).
- O flush é ignorado quando o workspace da sessão é somente leitura (`workspaceAccess: "ro"` ou `"none"`).
- Veja [Memory](/pt-BR/concepts/memory) para o layout de arquivos do workspace e os padrões de gravação.

O Pi também expõe um hook `session_before_compact` na API de extensão, mas a lógica de flush do OpenClaw vive hoje no lado do Gateway.

---

## Checklist de troubleshooting

- Chave de sessão errada? Comece em [/concepts/session](/pt-BR/concepts/session) e confirme a `sessionKey` em `/status`.
- Incompatibilidade entre armazenamento e transcrição? Confirme o host do Gateway e o caminho do armazenamento em `openclaw status`.
- Spam de Compaction? Verifique:
  - janela de contexto do modelo (pequena demais)
  - configurações de Compaction (`reserveTokens` alto demais para a janela do modelo pode causar Compaction mais cedo)
  - inchaço de resultado de ferramenta: habilite/ajuste a poda de sessão
- Interações silenciosas vazando? Confirme que a resposta começa com `NO_REPLY` (token exato sem diferenciar maiúsculas de minúsculas) e que você está em uma build que inclui a correção de supressão de streaming.

## Relacionado

- [Gerenciamento de sessões](/pt-BR/concepts/session)
- [Poda de sessão](/pt-BR/concepts/session-pruning)
- [Mecanismo de contexto](/pt-BR/concepts/context-engine)
