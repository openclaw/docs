---
read_when:
    - Você precisa depurar IDs de sessão, JSONL de transcrições ou campos de sessions.json
    - Você está alterando o comportamento de Compaction automática ou adicionando tarefas de manutenção “pré-Compaction”
    - Você quer implementar limpezas de memória ou turnos silenciosos do sistema
summary: 'Análise aprofundada: armazenamento de sessões + transcrições, ciclo de vida e detalhes internos de (auto)Compaction'
title: Análise aprofundada do gerenciamento de sessões
x-i18n:
    generated_at: "2026-04-30T10:07:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e9785723ebf9b5411440a8f3b2885a50d659f669811ba749c431a2b3aeed700
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw gerencia sessões de ponta a ponta nestas áreas:

- **Roteamento de sessão** (como mensagens recebidas são mapeadas para um `sessionKey`)
- **Armazenamento de sessão** (`sessions.json`) e o que ele rastreia
- **Persistência de transcrição** (`*.jsonl`) e sua estrutura
- **Higiene de transcrição** (ajustes específicos de provedor antes das execuções)
- **Limites de contexto** (janela de contexto versus tokens rastreados)
- **Compaction** (manual e autocompactação) e onde conectar trabalho pré-Compaction
- **Manutenção silenciosa** (gravações de memória que não devem produzir saída visível ao usuário)

Se você quiser uma visão geral de nível mais alto primeiro, comece por:

- [Gerenciamento de sessão](/pt-BR/concepts/session)
- [Compaction](/pt-BR/concepts/compaction)
- [Visão geral de memória](/pt-BR/concepts/memory)
- [Busca de memória](/pt-BR/concepts/memory-search)
- [Poda de sessão](/pt-BR/concepts/session-pruning)
- [Higiene de transcrição](/pt-BR/reference/transcript-hygiene)

---

## Fonte da verdade: o Gateway

OpenClaw é projetado em torno de um único **processo Gateway** que possui o estado da sessão.

- UIs (app macOS, Control UI web, TUI) devem consultar o Gateway para listas de sessões e contagens de tokens.
- No modo remoto, os arquivos de sessão ficam no host remoto; “verificar seus arquivos locais do Mac” não refletirá o que o Gateway está usando.

---

## Duas camadas de persistência

OpenClaw persiste sessões em duas camadas:

1. **Armazenamento de sessão (`sessions.json`)**
   - Mapa chave/valor: `sessionKey -> SessionEntry`
   - Pequeno, mutável, seguro de editar (ou excluir entradas)
   - Rastreia metadados de sessão (id da sessão atual, última atividade, alternâncias, contadores de tokens etc.)

2. **Transcrição (`<sessionId>.jsonl`)**
   - Transcrição somente anexável com estrutura em árvore (entradas têm `id` + `parentId`)
   - Armazena a conversa real + chamadas de ferramentas + resumos de Compaction
   - Usada para reconstruir o contexto do modelo para turnos futuros
   - Grandes checkpoints de depuração pré-Compaction são ignorados quando a transcrição
     ativa excede o limite de tamanho de checkpoint, evitando uma segunda cópia gigante
     `.checkpoint.*.jsonl`.

---

## Locais em disco

Por agente, no host do Gateway:

- Armazenamento: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcrições: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sessões de tópico do Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw resolve isso via `src/config/sessions.ts`.

---

## Manutenção do armazenamento e controles de disco

A persistência de sessão tem controles automáticos de manutenção (`session.maintenance`) para `sessions.json`, artefatos de transcrição e arquivos auxiliares de trajetória:

- `mode`: `warn` (padrão) ou `enforce`
- `pruneAfter`: limite de idade para entradas obsoletas (padrão `30d`)
- `maxEntries`: limita entradas em `sessions.json` (padrão `500`)
- `resetArchiveRetention`: retenção para arquivos de transcrição `*.reset.<timestamp>` (padrão: igual a `pruneAfter`; `false` desabilita a limpeza)
- `maxDiskBytes`: orçamento opcional do diretório de sessões
- `highWaterBytes`: alvo opcional após a limpeza (padrão `80%` de `maxDiskBytes`)

Gravações normais do Gateway agrupam a limpeza de `maxEntries` para limites de tamanho de produção, então um armazenamento pode exceder brevemente o limite configurado antes que a próxima limpeza de marca d’água alta o regrave de volta para baixo. `openclaw sessions cleanup --enforce` ainda aplica o limite configurado imediatamente.

OpenClaw não cria mais backups automáticos de rotação `sessions.json.bak.*` durante gravações do Gateway. A chave legada `session.maintenance.rotateBytes` é ignorada, e `openclaw doctor --fix` a remove de configurações antigas.

Ordem de aplicação para limpeza de orçamento de disco (`mode: "enforce"`):

1. Remova primeiro os artefatos arquivados mais antigos, transcrições órfãs ou trajetórias órfãs.
2. Se ainda estiver acima do alvo, remova as entradas de sessão mais antigas e seus arquivos de transcrição/trajetória.
3. Continue até que o uso esteja em ou abaixo de `highWaterBytes`.

Em `mode: "warn"`, OpenClaw relata possíveis remoções, mas não modifica o armazenamento/arquivos.

Execute manutenção sob demanda:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessões Cron e logs de execução

Execuções Cron isoladas também criam entradas de sessão/transcrições, e elas têm controles de retenção dedicados:

- `cron.sessionRetention` (padrão `24h`) remove sessões antigas de execução Cron isolada do armazenamento de sessões (`false` desabilita).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` podam arquivos `~/.openclaw/cron/runs/<jobId>.jsonl` (padrões: `2_000_000` bytes e `2000` linhas).

Quando o Cron força a criação de uma nova sessão de execução isolada, ele sanitiza a entrada de sessão
`cron:<jobId>` anterior antes de gravar a nova linha. Ele carrega preferências seguras
como configurações de pensamento/rápido/detalhado, rótulos e substituições explícitas
de modelo/autenticação selecionadas pelo usuário. Ele descarta contexto ambiente de conversa, como
roteamento de canal/grupo, política de envio ou fila, elevação, origem e vínculo de runtime
ACP, para que uma nova execução isolada não possa herdar entrega obsoleta ou
autoridade de runtime de uma execução mais antiga.

---

## Chaves de sessão (`sessionKey`)

Um `sessionKey` identifica _em qual compartimento de conversa_ você está (roteamento + isolamento).

Padrões comuns:

- Chat principal/direto (por agente): `agent:<agentId>:<mainKey>` (padrão `main`)
- Grupo: `agent:<agentId>:<channel>:group:<id>`
- Sala/canal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` ou `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (a menos que substituído)

As regras canônicas estão documentadas em [/concepts/session](/pt-BR/concepts/session).

---

## IDs de sessão (`sessionId`)

Cada `sessionKey` aponta para um `sessionId` atual (o arquivo de transcrição que continua a conversa).

Regras práticas:

- **Reset** (`/new`, `/reset`) cria um novo `sessionId` para esse `sessionKey`.
- **Reset diário** (padrão 4:00 AM no horário local do host do gateway) cria um novo `sessionId` na próxima mensagem após o limite de reset.
- **Expiração por inatividade** (`session.reset.idleMinutes` ou legado `session.idleMinutes`) cria um novo `sessionId` quando uma mensagem chega após a janela de inatividade. Quando diário + inatividade estão configurados, vence o que expirar primeiro.
- **Eventos do sistema** (Heartbeat, despertares Cron, notificações de exec, escrituração do gateway) podem modificar a linha da sessão, mas não estendem a validade do reset diário/por inatividade. A rolagem de reset descarta avisos de evento do sistema enfileirados para a sessão anterior antes que o prompt novo seja criado.
- **Proteção contra fork do pai da thread** (`session.parentForkMaxTokens`, padrão `100000`) ignora o fork da transcrição pai quando a sessão pai já está grande demais; a nova thread começa limpa. Defina `0` para desabilitar.

Detalhe de implementação: a decisão acontece em `initSessionState()` em `src/auto-reply/reply/session.ts`.

---

## Esquema do armazenamento de sessão (`sessions.json`)

O tipo de valor do armazenamento é `SessionEntry` em `src/config/sessions.ts`.

Campos principais (não exaustivo):

- `sessionId`: id da transcrição atual (o nome do arquivo é derivado dele, a menos que `sessionFile` esteja definido)
- `sessionStartedAt`: timestamp de início para o `sessionId` atual; a validade do reset diário
  usa isso. Linhas legadas podem derivá-lo do cabeçalho de sessão JSONL.
- `lastInteractionAt`: timestamp da última interação real de usuário/canal; a validade do reset por inatividade
  usa isso para que eventos de Heartbeat, Cron e exec não mantenham sessões
  vivas. Linhas legadas sem este campo recorrem ao horário de início da sessão recuperado
  para validade por inatividade.
- `updatedAt`: timestamp da última mutação da linha do armazenamento, usado para listagem, poda e
  escrituração. Ele não é a autoridade para validade de reset diário/por inatividade.
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
- `compactionCount`: quantas vezes a autocompactação foi concluída para esta chave de sessão
- `memoryFlushAt`: timestamp da última descarga de memória pré-Compaction
- `memoryFlushCompactionCount`: contagem de Compaction quando a última descarga foi executada

O armazenamento é seguro de editar, mas o Gateway é a autoridade: ele pode regravar ou reidratar entradas à medida que as sessões são executadas.

---

## Estrutura da transcrição (`*.jsonl`)

As transcrições são gerenciadas pelo `SessionManager` de `@mariozechner/pi-coding-agent`.

O arquivo é JSONL:

- Primeira linha: cabeçalho de sessão (`type: "session"`, inclui `id`, `cwd`, `timestamp`, `parentSession` opcional)
- Depois: entradas de sessão com `id` + `parentId` (árvore)

Tipos de entrada notáveis:

- `message`: mensagens de usuário/assistente/toolResult
- `custom_message`: mensagens injetadas por Plugin que _entram_ no contexto do modelo (podem ficar ocultas da UI)
- `custom`: estado de Plugin que _não_ entra no contexto do modelo
- `compaction`: resumo de Compaction persistido com `firstKeptEntryId` e `tokensBefore`
- `branch_summary`: resumo persistido ao navegar por uma ramificação da árvore

OpenClaw intencionalmente **não** “corrige” transcrições; o Gateway usa `SessionManager` para lê-las/gravá-las.

---

## Janelas de contexto versus tokens rastreados

Dois conceitos diferentes importam:

1. **Janela de contexto do modelo**: limite rígido por modelo (tokens visíveis para o modelo)
2. **Contadores do armazenamento de sessão**: estatísticas móveis gravadas em `sessions.json` (usadas para /status e dashboards)

Se você está ajustando limites:

- A janela de contexto vem do catálogo de modelos (e pode ser substituída via configuração).
- `contextTokens` no armazenamento é um valor de estimativa/relatório em runtime; não o trate como uma garantia estrita.

Para mais, consulte [/token-use](/pt-BR/reference/token-use).

---

## Compaction: o que é

Compaction resume a conversa mais antiga em uma entrada `compaction` persistida na transcrição e mantém mensagens recentes intactas.

Após a Compaction, turnos futuros veem:

- O resumo de Compaction
- Mensagens após `firstKeptEntryId`

Compaction é **persistente** (diferente da poda de sessão). Consulte [/concepts/session-pruning](/pt-BR/concepts/session-pruning).

## Limites de blocos de Compaction e pareamento de ferramentas

Quando o OpenClaw divide uma transcrição longa em blocos de Compaction, ele mantém
chamadas de ferramenta do assistente pareadas com suas entradas `toolResult` correspondentes.

- Se a divisão por proporção de tokens cair entre uma chamada de ferramenta e seu resultado, o OpenClaw
  desloca o limite para a mensagem de chamada de ferramenta do assistente em vez de separar
  o par.
- Se um bloco final de resultados de ferramenta de outra forma empurraria o bloco para além do alvo,
  o OpenClaw preserva esse bloco de ferramenta pendente e mantém intacta a cauda não resumida.
- Blocos de chamada de ferramenta abortados/com erro não mantêm uma divisão pendente aberta.

---

## Quando a autocompactação acontece (runtime Pi)

No agente Pi incorporado, a autocompactação é acionada em dois casos:

1. **Recuperação de estouro**: o modelo retorna um erro de estouro de contexto
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` e variantes semelhantes no formato de provedor) → compactar → tentar novamente.
2. **Manutenção por limite**: após um turno bem-sucedido, quando:

`contextTokens > contextWindow - reserveTokens`

Onde:

- `contextWindow` é a janela de contexto do modelo
- `reserveTokens` é a folga reservada para prompts + a próxima saída do modelo

Estas são semânticas do runtime Pi (OpenClaw consome os eventos, mas Pi decide quando compactar).

OpenClaw também pode acionar uma Compaction local de pré-verificação antes de abrir a próxima
execução quando `agents.defaults.compaction.maxActiveTranscriptBytes` está definido e o
arquivo de transcrição ativo atinge esse tamanho. Esta é uma proteção por tamanho de arquivo para custo
de reabertura local, não arquivamento bruto: OpenClaw ainda executa a Compaction semântica normal,
e ela exige `truncateAfterCompaction` para que o resumo compactado possa se tornar uma
nova transcrição sucessora.

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

OpenClaw também aplica um limite mínimo de segurança para execuções embutidas:

- Se `compaction.reserveTokens < reserveTokensFloor`, o OpenClaw o aumenta.
- O limite mínimo padrão é de `20000` tokens.
- Defina `agents.defaults.compaction.reserveTokensFloor: 0` para desativar o limite mínimo.
- Se ele já estiver mais alto, o OpenClaw não o altera.
- O `/compact` manual respeita um `agents.defaults.compaction.keepRecentTokens`
  explícito e mantém o ponto de corte da cauda recente do Pi. Sem um orçamento
  de manutenção explícito, a Compaction manual continua sendo um checkpoint rígido
  e o contexto reconstruído começa a partir do novo resumo.
- Defina `agents.defaults.compaction.maxActiveTranscriptBytes` como um valor em bytes ou
  uma string como `"20mb"` para executar a Compaction local antes de um turno quando a
  transcrição ativa ficar grande. Essa proteção fica ativa somente quando
  `truncateAfterCompaction` também está habilitado. Deixe sem definir ou defina `0` para
  desativar.
- Quando `agents.defaults.compaction.truncateAfterCompaction` está habilitado,
  o OpenClaw rotaciona a transcrição ativa para um JSONL sucessor compactado após a
  Compaction. A transcrição completa antiga permanece arquivada e vinculada a partir do
  checkpoint de Compaction, em vez de ser reescrita no local.

Motivo: deixar margem suficiente para “tarefas de manutenção” de vários turnos (como gravações de memória) antes que a Compaction se torne inevitável.

Implementação: `ensurePiCompactionReserveTokens()` em `src/agents/pi-settings.ts`
(chamado a partir de `src/agents/pi-embedded-runner.ts`).

---

## Provedores plugáveis de Compaction

Plugins podem registrar um provedor de Compaction via `registerCompactionProvider()` na API do plugin. Quando `agents.defaults.compaction.provider` é definido como o id de um provedor registrado, a extensão de salvaguarda delega a sumarização a esse provedor em vez do pipeline integrado `summarizeInStages`.

- `provider`: id de um Plugin provedor de Compaction registrado. Deixe sem definir para a sumarização LLM padrão.
- Definir um `provider` força `mode: "safeguard"`.
- Os provedores recebem as mesmas instruções de Compaction e a mesma política de preservação de identificadores do caminho integrado.
- A salvaguarda ainda preserva o contexto de sufixo de turnos recentes e turnos divididos após a saída do provedor.
- A sumarização integrada da salvaguarda redestila resumos anteriores com novas mensagens
  em vez de preservar o resumo anterior completo literalmente.
- O modo de salvaguarda habilita auditorias de qualidade do resumo por padrão; defina
  `qualityGuard.enabled: false` para ignorar o comportamento de tentar novamente em caso de saída malformada.
- Se o provedor falhar ou retornar um resultado vazio, o OpenClaw recorre automaticamente à sumarização LLM integrada.
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

O OpenClaw oferece suporte a turnos “silenciosos” para tarefas em segundo plano em que o usuário não deve ver saída intermediária.

Convenção:

- O assistente inicia sua saída com o token silencioso exato `NO_REPLY` /
  `no_reply` para indicar “não entregar uma resposta ao usuário”.
- O OpenClaw remove/suprime isso na camada de entrega.
- A supressão por token silencioso exato não diferencia maiúsculas de minúsculas, então `NO_REPLY` e
  `no_reply` contam quando a carga inteira é apenas o token silencioso.
- Isso é apenas para turnos reais em segundo plano/sem entrega; não é um atalho para
  solicitações comuns e acionáveis do usuário.

A partir de `2026.1.10`, o OpenClaw também suprime **streaming de rascunho/digitação** quando um
fragmento parcial começa com `NO_REPLY`, para que operações silenciosas não vazem saída
parcial no meio do turno.

---

## "Flush" de memória pré-Compaction (implementado)

Objetivo: antes que a Compaction automática aconteça, executar um turno agentic silencioso que grave estado durável
em disco (por exemplo, `memory/YYYY-MM-DD.md` no workspace do agente) para que a Compaction não possa
apagar contexto crítico.

O OpenClaw usa a abordagem de **flush pré-limite**:

1. Monitorar o uso de contexto da sessão.
2. Quando ele ultrapassar um “limite suave” (abaixo do limite de Compaction do Pi), executar uma diretiva silenciosa
   “gravar memória agora” para o agente.
3. Usar o token silencioso exato `NO_REPLY` / `no_reply` para que o usuário não veja
   nada.

Configuração (`agents.defaults.compaction.memoryFlush`):

- `enabled` (padrão: `true`)
- `model` (sobrescrita opcional exata de provedor/modelo para o turno de flush, por exemplo `ollama/qwen3:8b`)
- `softThresholdTokens` (padrão: `4000`)
- `prompt` (mensagem de usuário para o turno de flush)
- `systemPrompt` (prompt de sistema extra anexado para o turno de flush)

Observações:

- O prompt/prompt de sistema padrão inclui uma dica `NO_REPLY` para suprimir
  a entrega.
- Quando `model` é definido, o turno de flush usa esse modelo sem herdar a
  cadeia de fallback da sessão ativa, para que a manutenção somente local não
  recaia silenciosamente em um modelo de conversa pago.
- O flush é executado uma vez por ciclo de Compaction (rastreado em `sessions.json`).
- O flush é executado apenas para sessões Pi embutidas (backends de CLI o ignoram).
- O flush é ignorado quando o workspace da sessão é somente leitura (`workspaceAccess: "ro"` ou `"none"`).
- Consulte [Memória](/pt-BR/concepts/memory) para o layout de arquivos do workspace e os padrões de gravação.

O Pi também expõe um hook `session_before_compact` na API da extensão, mas hoje a lógica de
flush do OpenClaw fica no lado do Gateway.

---

## Checklist de solução de problemas

- Chave de sessão errada? Comece com [/concepts/session](/pt-BR/concepts/session) e confirme o `sessionKey` em `/status`.
- Incompatibilidade entre armazenamento e transcrição? Confirme o host do Gateway e o caminho do armazenamento a partir de `openclaw status`.
- Spam de Compaction? Verifique:
  - janela de contexto do modelo (pequena demais)
  - configurações de Compaction (`reserveTokens` alto demais para a janela do modelo pode causar Compaction mais cedo)
  - inchaço de resultados de ferramentas: habilite/ajuste a poda de sessão
- Turnos silenciosos vazando? Confirme que a resposta começa com `NO_REPLY` (token exato sem diferenciação de maiúsculas/minúsculas) e que você está em uma build que inclui a correção de supressão de streaming.

## Relacionado

- [Gerenciamento de sessão](/pt-BR/concepts/session)
- [Poda de sessão](/pt-BR/concepts/session-pruning)
- [Motor de contexto](/pt-BR/concepts/context-engine)
