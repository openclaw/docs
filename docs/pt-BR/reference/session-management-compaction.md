---
read_when:
    - Você precisa depurar IDs de sessão, JSONL de transcrição ou campos de sessions.json
    - Você está alterando o comportamento de compactação automática ou adicionando manutenção “pré-compactação”
    - Você quer implementar limpezas de memória ou turnos silenciosos do sistema
summary: 'Aprofundamento: armazenamento de sessões + transcrições, ciclo de vida e funcionamento interno de (auto)Compaction'
title: Aprofundamento no gerenciamento de sessões
x-i18n:
    generated_at: "2026-04-30T16:30:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5a6a7031cebd90d27784a32a0d0378ea9959249389d209f0745395f90b8a0df9
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw gerencia sessões de ponta a ponta nestas áreas:

- **Roteamento de sessão** (como mensagens recebidas são mapeadas para uma `sessionKey`)
- **Armazenamento de sessão** (`sessions.json`) e o que ele rastreia
- **Persistência de transcritos** (`*.jsonl`) e sua estrutura
- **Higiene de transcritos** (correções específicas de provedor antes das execuções)
- **Limites de contexto** (janela de contexto vs tokens rastreados)
- **Compaction** (manual e auto-compaction) e onde conectar trabalho pré-compaction
- **Manutenção silenciosa** (gravações de memória que não devem produzir saída visível ao usuário)

Se quiser primeiro uma visão geral de nível mais alto, comece com:

- [Gerenciamento de sessão](/pt-BR/concepts/session)
- [Compaction](/pt-BR/concepts/compaction)
- [Visão geral de memória](/pt-BR/concepts/memory)
- [Busca de memória](/pt-BR/concepts/memory-search)
- [Poda de sessão](/pt-BR/concepts/session-pruning)
- [Higiene de transcritos](/pt-BR/reference/transcript-hygiene)

---

## Fonte da verdade: o Gateway

O OpenClaw foi projetado em torno de um único **processo Gateway** que é dono do estado de sessão.

- UIs (app macOS, Control UI web, TUI) devem consultar o Gateway para listas de sessões e contagens de tokens.
- No modo remoto, os arquivos de sessão ficam no host remoto; “verificar seus arquivos locais do Mac” não refletirá o que o Gateway está usando.

---

## Duas camadas de persistência

O OpenClaw persiste sessões em duas camadas:

1. **Armazenamento de sessão (`sessions.json`)**
   - Mapa chave/valor: `sessionKey -> SessionEntry`
   - Pequeno, mutável, seguro para editar (ou excluir entradas)
   - Rastreia metadados de sessão (id da sessão atual, última atividade, alternâncias, contadores de tokens etc.)

2. **Transcrito (`<sessionId>.jsonl`)**
   - Transcrito somente anexável com estrutura em árvore (entradas têm `id` + `parentId`)
   - Armazena a conversa real + chamadas de ferramenta + resumos de Compaction
   - Usado para reconstruir o contexto do modelo em turnos futuros
   - Grandes checkpoints de depuração pré-Compaction são ignorados quando o transcrito
     ativo excede o limite de tamanho de checkpoint, evitando uma segunda cópia gigante
     `.checkpoint.*.jsonl`.

---

## Locais em disco

Por agente, no host Gateway:

- Armazenamento: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcritos: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sessões de tópico do Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

O OpenClaw resolve isso via `src/config/sessions.ts`.

---

## Manutenção do armazenamento e controles de disco

A persistência de sessão tem controles automáticos de manutenção (`session.maintenance`) para `sessions.json`, artefatos de transcrito e sidecars de trajetória:

- `mode`: `warn` (padrão) ou `enforce`
- `pruneAfter`: corte de idade de entrada obsoleta (padrão `30d`)
- `maxEntries`: limita entradas em `sessions.json` (padrão `500`)
- `resetArchiveRetention`: retenção para arquivos de transcrito `*.reset.<timestamp>` (padrão: igual a `pruneAfter`; `false` desativa a limpeza)
- `maxDiskBytes`: orçamento opcional do diretório de sessões
- `highWaterBytes`: alvo opcional após a limpeza (padrão `80%` de `maxDiskBytes`)

Gravações normais do Gateway agrupam a limpeza de `maxEntries` para limites de tamanho de produção, então um armazenamento pode exceder brevemente o limite configurado antes que a próxima limpeza de marca alta o regrave para baixo. `openclaw sessions cleanup --enforce` ainda aplica o limite configurado imediatamente.

O OpenClaw não cria mais backups automáticos de rotação `sessions.json.bak.*` durante gravações do Gateway. A chave legada `session.maintenance.rotateBytes` é ignorada e `openclaw doctor --fix` a remove de configurações antigas.

Ordem de aplicação para limpeza de orçamento de disco (`mode: "enforce"`):

1. Remova primeiro os artefatos arquivados mais antigos, transcritos órfãos ou trajetórias órfãs.
2. Se ainda estiver acima do alvo, expulse as entradas de sessão mais antigas e seus arquivos de transcrito/trajetória.
3. Continue até que o uso esteja em ou abaixo de `highWaterBytes`.

Em `mode: "warn"`, o OpenClaw relata possíveis expulsões, mas não altera o armazenamento/arquivos.

Execute a manutenção sob demanda:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessões Cron e logs de execução

Execuções cron isoladas também criam entradas/transcritos de sessão, e elas têm controles dedicados de retenção:

- `cron.sessionRetention` (padrão `24h`) remove sessões antigas de execução cron isolada do armazenamento de sessão (`false` desativa).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` removem arquivos `~/.openclaw/cron/runs/<jobId>.jsonl` (padrões: `2_000_000` bytes e `2000` linhas).

Quando o cron força a criação de uma nova sessão de execução isolada, ele sanitiza a entrada de sessão
`cron:<jobId>` anterior antes de gravar a nova linha. Ele carrega preferências
seguras, como configurações de thinking/fast/verbose, rótulos e substituições explícitas
de modelo/autenticação selecionadas pelo usuário. Ele descarta contexto de conversa ambiente,
como roteamento de canal/grupo, política de envio ou fila, elevação, origem e vínculo de runtime
ACP, para que uma nova execução isolada não possa herdar autoridade obsoleta de entrega ou
runtime de uma execução antiga.

---

## Chaves de sessão (`sessionKey`)

Uma `sessionKey` identifica _em qual balde de conversa_ você está (roteamento + isolamento).

Padrões comuns:

- Chat principal/direto (por agente): `agent:<agentId>:<mainKey>` (padrão `main`)
- Grupo: `agent:<agentId>:<channel>:group:<id>`
- Sala/canal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` ou `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (a menos que seja substituído)

As regras canônicas estão documentadas em [/concepts/session](/pt-BR/concepts/session).

---

## IDs de sessão (`sessionId`)

Cada `sessionKey` aponta para uma `sessionId` atual (o arquivo de transcrito que continua a conversa).

Regras gerais:

- **Redefinição** (`/new`, `/reset`) cria uma nova `sessionId` para essa `sessionKey`.
- **Redefinição diária** (padrão 4:00 AM no horário local do host gateway) cria uma nova `sessionId` na próxima mensagem após o limite de redefinição.
- **Expiração por inatividade** (`session.reset.idleMinutes` ou legado `session.idleMinutes`) cria uma nova `sessionId` quando uma mensagem chega após a janela de inatividade. Quando diária + inatividade estão configuradas, vence o que expirar primeiro.
- **Eventos do sistema** (Heartbeat, despertares cron, notificações exec, contabilidade do gateway) podem alterar a linha da sessão, mas não estendem a atualização de redefinição diária/por inatividade. A troca de redefinição descarta avisos de eventos do sistema enfileirados para a sessão anterior antes que o novo prompt seja construído.
- **Guarda de bifurcação de pai de thread** (`session.parentForkMaxTokens`, padrão `100000`) ignora a bifurcação do transcrito pai quando a sessão pai já está grande demais; a nova thread começa do zero. Defina `0` para desativar.

Detalhe de implementação: a decisão acontece em `initSessionState()` em `src/auto-reply/reply/session.ts`.

---

## Esquema do armazenamento de sessão (`sessions.json`)

O tipo de valor do armazenamento é `SessionEntry` em `src/config/sessions.ts`.

Campos principais (não exaustivo):

- `sessionId`: id do transcrito atual (o nome do arquivo é derivado disso, a menos que `sessionFile` esteja definido)
- `sessionStartedAt`: timestamp de início da `sessionId` atual; a atualização de redefinição diária
  usa isso. Linhas legadas podem derivá-lo do cabeçalho de sessão JSONL.
- `lastInteractionAt`: timestamp da última interação real de usuário/canal; a atualização de redefinição
  por inatividade usa isso para que Heartbeat, cron e eventos exec não mantenham sessões
  vivas. Linhas legadas sem este campo recaem para o horário de início de sessão recuperado
  para atualização por inatividade.
- `updatedAt`: timestamp da última mutação da linha do armazenamento, usado para listagem, poda e
  contabilidade. Ele não é a autoridade para a atualização de redefinição diária/por inatividade.
- `sessionFile`: substituição opcional explícita do caminho do transcrito
- `chatType`: `direct | group | room` (ajuda UIs e política de envio)
- `provider`, `subject`, `room`, `space`, `displayName`: metadados para rotulagem de grupo/canal
- Alternâncias:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (substituição por sessão)
- Seleção de modelo:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contadores de tokens (melhor esforço / dependente do provedor):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: com que frequência a auto-compaction foi concluída para esta chave de sessão
- `memoryFlushAt`: timestamp da última descarga de memória pré-Compaction
- `memoryFlushCompactionCount`: contagem de Compaction quando a última descarga foi executada

É seguro editar o armazenamento, mas o Gateway é a autoridade: ele pode regravar ou reidratar entradas conforme as sessões são executadas.

---

## Estrutura do transcrito (`*.jsonl`)

Transcritos são gerenciados pelo `SessionManager` de `@mariozechner/pi-coding-agent`.

O arquivo é JSONL:

- Primeira linha: cabeçalho de sessão (`type: "session"`, inclui `id`, `cwd`, `timestamp`, `parentSession` opcional)
- Depois: entradas de sessão com `id` + `parentId` (árvore)

Tipos de entrada notáveis:

- `message`: mensagens de usuário/assistente/toolResult
- `custom_message`: mensagens injetadas por extensão que _entram_ no contexto do modelo (podem ficar ocultas da UI)
- `custom`: estado de extensão que _não_ entra no contexto do modelo
- `compaction`: resumo persistido de Compaction com `firstKeptEntryId` e `tokensBefore`
- `branch_summary`: resumo persistido ao navegar por um ramo da árvore

O OpenClaw intencionalmente **não** “corrige” transcritos; o Gateway usa `SessionManager` para lê-los/gravá-los.

---

## Janelas de contexto vs tokens rastreados

Dois conceitos diferentes importam:

1. **Janela de contexto do modelo**: limite rígido por modelo (tokens visíveis ao modelo)
2. **Contadores do armazenamento de sessão**: estatísticas móveis gravadas em `sessions.json` (usadas para /status e dashboards)

Se você estiver ajustando limites:

- A janela de contexto vem do catálogo de modelos (e pode ser substituída via configuração).
- `contextTokens` no armazenamento é um valor de estimativa/relatório em runtime; não o trate como uma garantia estrita.

Para saber mais, consulte [/token-use](/pt-BR/reference/token-use).

---

## Compaction: o que é

Compaction resume conversas antigas em uma entrada `compaction` persistida no transcrito e mantém mensagens recentes intactas.

Após a Compaction, turnos futuros veem:

- O resumo da Compaction
- Mensagens após `firstKeptEntryId`

Compaction é **persistente** (ao contrário da poda de sessão). Consulte [/concepts/session-pruning](/pt-BR/concepts/session-pruning).

## Limites de chunks de Compaction e pareamento de ferramentas

Quando o OpenClaw divide um transcrito longo em chunks de Compaction, ele mantém
chamadas de ferramenta do assistente pareadas com suas entradas `toolResult` correspondentes.

- Se a divisão por participação de tokens cair entre uma chamada de ferramenta e seu resultado, o OpenClaw
  desloca o limite para a mensagem de chamada de ferramenta do assistente em vez de separar
  o par.
- Se um bloco final de resultado de ferramenta fosse empurrar o chunk acima do alvo,
  o OpenClaw preserva esse bloco de ferramenta pendente e mantém a cauda não resumida
  intacta.
- Blocos de chamadas de ferramenta abortadas/com erro não mantêm uma divisão pendente aberta.

---

## Quando a auto-compaction acontece (runtime Pi)

No agente Pi incorporado, a auto-compaction é acionada em dois casos:

1. **Recuperação de estouro**: o modelo retorna um erro de estouro de contexto
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` e variantes similares no formato do provedor) → compacta → tenta novamente.
2. **Manutenção por limite**: após um turno bem-sucedido, quando:

`contextTokens > contextWindow - reserveTokens`

Onde:

- `contextWindow` é a janela de contexto do modelo
- `reserveTokens` é a folga reservada para prompts + a próxima saída do modelo

Estas são semânticas de runtime Pi (o OpenClaw consome os eventos, mas o Pi decide quando compactar).

O OpenClaw também pode acionar uma Compaction local prévia antes de abrir a próxima
execução quando `agents.defaults.compaction.maxActiveTranscriptBytes` está definido e o
arquivo de transcrito ativo atinge esse tamanho. Este é um guarda de tamanho de arquivo para
custo de reabertura local, não arquivamento bruto: o OpenClaw ainda executa a Compaction semântica normal,
e ela requer `truncateAfterCompaction` para que o resumo compactado possa se tornar um
novo transcrito sucessor.

Para execuções embarcadas no Pi, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
adiciona uma proteção opt-in para o ciclo de ferramentas. Depois que um resultado de ferramenta é anexado e antes da
próxima chamada ao modelo, o OpenClaw estima a pressão do prompt usando a mesma lógica de orçamento de
pré-verificação usada no início do turno. Se o contexto não couber mais, a proteção
não faz Compaction dentro do hook `transformContext` do Pi. Ela emite um sinal estruturado de
pré-verificação no meio do turno, interrompe o envio do prompt atual e permite que o
loop de execução externo use o caminho de recuperação existente: truncar resultados de ferramentas grandes demais
quando isso for suficiente, ou acionar o modo de Compaction configurado e tentar novamente. A
opção vem desativada por padrão e funciona com os modos de Compaction `default` e `safeguard`,
incluindo Compaction de safeguard apoiada por provedor.
Isso é independente de `maxActiveTranscriptBytes`: a proteção por tamanho em bytes roda
antes de um turno começar, enquanto a pré-verificação no meio do turno roda depois, no loop de ferramentas embarcado do Pi,
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

O OpenClaw também aplica um piso de segurança para execuções embarcadas:

- Se `compaction.reserveTokens < reserveTokensFloor`, o OpenClaw aumenta esse valor.
- O piso padrão é de `20000` tokens.
- Defina `agents.defaults.compaction.reserveTokensFloor: 0` para desativar o piso.
- Se ele já estiver mais alto, o OpenClaw não altera.
- O `/compact` manual respeita um `agents.defaults.compaction.keepRecentTokens`
  explícito e mantém o ponto de corte da cauda recente do Pi. Sem um orçamento de retenção explícito,
  a Compaction manual continua sendo um checkpoint rígido, e o contexto reconstruído começa a partir
  do novo resumo.
- Defina `agents.defaults.compaction.midTurnPrecheck.enabled: true` para executar a
  pré-verificação opcional do loop de ferramentas depois de novos resultados de ferramentas e antes da próxima chamada ao modelo. Isso é apenas um acionador; a geração do resumo ainda usa o caminho de
  Compaction configurado. Ele é independente de `maxActiveTranscriptBytes`, que é uma
  proteção por tamanho em bytes da transcrição ativa no início do turno.
- Defina `agents.defaults.compaction.maxActiveTranscriptBytes` como um valor em bytes ou
  uma string como `"20mb"` para executar Compaction local antes de um turno quando a transcrição
  ativa ficar grande. Essa proteção só fica ativa quando
  `truncateAfterCompaction` também está habilitado. Deixe indefinido ou defina `0` para
  desativar.
- Quando `agents.defaults.compaction.truncateAfterCompaction` está habilitado,
  o OpenClaw rotaciona a transcrição ativa para um JSONL sucessor compactado após a
  Compaction. A transcrição completa antiga permanece arquivada e vinculada a partir do
  checkpoint de Compaction, em vez de ser reescrita no próprio arquivo.

Motivo: deixar espaço suficiente para “tarefas de manutenção” de múltiplos turnos (como gravações de memória) antes que a Compaction se torne inevitável.

Implementação: `ensurePiCompactionReserveTokens()` em `src/agents/pi-settings.ts`
(chamado a partir de `src/agents/pi-embedded-runner.ts`).

---

## Provedores de Compaction plugáveis

Plugins podem registrar um provedor de Compaction via `registerCompactionProvider()` na API de Plugin. Quando `agents.defaults.compaction.provider` é definido como o id de um provedor registrado, a extensão safeguard delega a sumarização a esse provedor em vez de usar o pipeline embutido `summarizeInStages`.

- `provider`: id de um Plugin provedor de Compaction registrado. Deixe indefinido para sumarização LLM padrão.
- Definir um `provider` força `mode: "safeguard"`.
- Provedores recebem as mesmas instruções de Compaction e a mesma política de preservação de identificadores do caminho embutido.
- O safeguard ainda preserva o contexto de sufixo de turnos recentes e turnos divididos após a saída do provedor.
- A sumarização safeguard embutida redestila resumos anteriores com novas mensagens
  em vez de preservar o resumo anterior completo literalmente.
- O modo safeguard habilita auditorias de qualidade de resumo por padrão; defina
  `qualityGuard.enabled: false` para ignorar o comportamento de tentar novamente em caso de saída malformada.
- Se o provedor falhar ou retornar um resultado vazio, o OpenClaw volta automaticamente para a sumarização LLM embutida.
- Sinais de abort/timeout são relançados (não engolidos) para respeitar o cancelamento pelo chamador.

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
  `no_reply` para indicar “não entregue uma resposta ao usuário”.
- O OpenClaw remove/suprime isso na camada de entrega.
- A supressão por token silencioso exato não diferencia maiúsculas de minúsculas, então `NO_REPLY` e
  `no_reply` contam quando a carga inteira é apenas o token silencioso.
- Isso é apenas para turnos verdadeiramente em segundo plano/sem entrega; não é um atalho para
  solicitações comuns e acionáveis do usuário.

A partir de `2026.1.10`, o OpenClaw também suprime **streaming de rascunho/digitação** quando um
chunk parcial começa com `NO_REPLY`, para que operações silenciosas não vazem saída parcial
no meio do turno.

---

## "Flush" de memória pré-Compaction (implementado)

Objetivo: antes que a Compaction automática aconteça, executar um turno agêntico silencioso que grave estado durável
em disco (por exemplo, `memory/YYYY-MM-DD.md` no workspace do agente) para que a Compaction não possa
apagar contexto crítico.

O OpenClaw usa a abordagem de **flush antes do limiar**:

1. Monitorar o uso de contexto da sessão.
2. Quando ele cruza um “limiar suave” (abaixo do limiar de Compaction do Pi), executar uma diretiva silenciosa
   “grave a memória agora” para o agente.
3. Usar o token silencioso exato `NO_REPLY` / `no_reply` para que o usuário não veja
   nada.

Configuração (`agents.defaults.compaction.memoryFlush`):

- `enabled` (padrão: `true`)
- `model` (substituição opcional exata de provedor/modelo para o turno de flush, por exemplo `ollama/qwen3:8b`)
- `softThresholdTokens` (padrão: `4000`)
- `prompt` (mensagem do usuário para o turno de flush)
- `systemPrompt` (prompt de sistema extra anexado para o turno de flush)

Observações:

- O prompt/prompt de sistema padrão inclui uma dica `NO_REPLY` para suprimir
  a entrega.
- Quando `model` é definido, o turno de flush usa esse modelo sem herdar a
  cadeia de fallback da sessão ativa, de modo que a manutenção apenas local não faça fallback silencioso
  para um modelo de conversa pago.
- O flush roda uma vez por ciclo de Compaction (rastreado em `sessions.json`).
- O flush roda apenas para sessões embarcadas do Pi (backends de CLI o ignoram).
- O flush é ignorado quando o workspace da sessão é somente leitura (`workspaceAccess: "ro"` ou `"none"`).
- Consulte [Memória](/pt-BR/concepts/memory) para o layout de arquivos do workspace e os padrões de escrita.

O Pi também expõe um hook `session_before_compact` na API da extensão, mas a lógica de
flush do OpenClaw fica no lado do Gateway hoje.

---

## Checklist de solução de problemas

- Chave de sessão incorreta? Comece com [/concepts/session](/pt-BR/concepts/session) e confirme o `sessionKey` em `/status`.
- Incompatibilidade entre store e transcrição? Confirme o host do Gateway e o caminho do store a partir de `openclaw status`.
- Spam de Compaction? Verifique:
  - janela de contexto do modelo (pequena demais)
  - configurações de Compaction (`reserveTokens` alto demais para a janela do modelo pode causar Compaction mais cedo)
  - inchaço de resultados de ferramentas: habilite/ajuste a poda de sessão
- Turnos silenciosos vazando? Confirme que a resposta começa com `NO_REPLY` (token exato sem diferenciar maiúsculas/minúsculas) e que você está em uma build que inclui a correção de supressão de streaming.

## Relacionados

- [Gerenciamento de sessão](/pt-BR/concepts/session)
- [Poda de sessão](/pt-BR/concepts/session-pruning)
- [Mecanismo de contexto](/pt-BR/concepts/context-engine)
