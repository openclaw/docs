---
read_when:
    - Você precisa depurar IDs de sessão, JSONL da transcrição ou campos de sessions.json
    - Você está alterando o comportamento de Compaction automática ou adicionando tarefas de manutenção de “pré-Compaction”
    - Você quer implementar descargas de memória ou turnos de sistema silenciosos
summary: 'Aprofundamento: armazenamento de sessões + transcrições, ciclo de vida e aspectos internos da Compaction automática'
title: Análise aprofundada do gerenciamento de sessões
x-i18n:
    generated_at: "2026-05-02T05:56:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6f5d8b072feb389d7161fb2fa0fcd0941edb79b8b0f7ddd841877158795c2895
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw gerencia sessões de ponta a ponta nestas áreas:

- **Roteamento de sessões** (como mensagens recebidas são mapeadas para uma `sessionKey`)
- **Armazenamento de sessões** (`sessions.json`) e o que ele rastreia
- **Persistência de transcrições** (`*.jsonl`) e sua estrutura
- **Higiene de transcrições** (ajustes específicos de provedor antes das execuções)
- **Limites de contexto** (janela de contexto vs tokens rastreados)
- **Compaction** (manual e auto-Compaction) e onde conectar trabalho pré-Compaction
- **Manutenção silenciosa** (gravações de memória que não devem produzir saída visível ao usuário)

Se quiser primeiro uma visão geral de nível mais alto, comece com:

- [Gerenciamento de sessões](/pt-BR/concepts/session)
- [Compaction](/pt-BR/concepts/compaction)
- [Visão geral de memória](/pt-BR/concepts/memory)
- [Busca de memória](/pt-BR/concepts/memory-search)
- [Limpeza de sessões](/pt-BR/concepts/session-pruning)
- [Higiene de transcrições](/pt-BR/reference/transcript-hygiene)

---

## Fonte da verdade: o Gateway

OpenClaw é projetado em torno de um único **processo Gateway** que é dono do estado das sessões.

- UIs (app macOS, Control UI web, TUI) devem consultar o Gateway para listas de sessões e contagens de tokens.
- No modo remoto, os arquivos de sessão ficam no host remoto; “verificar seus arquivos locais do Mac” não refletirá o que o Gateway está usando.

---

## Duas camadas de persistência

OpenClaw persiste sessões em duas camadas:

1. **Armazenamento de sessões (`sessions.json`)**
   - Mapa chave/valor: `sessionKey -> SessionEntry`
   - Pequeno, mutável, seguro para editar (ou excluir entradas)
   - Rastreia metadados de sessão (id da sessão atual, última atividade, alternâncias, contadores de tokens etc.)

2. **Transcrição (`<sessionId>.jsonl`)**
   - Transcrição somente acréscimo com estrutura de árvore (entradas têm `id` + `parentId`)
   - Armazena a conversa real + chamadas de ferramentas + resumos de Compaction
   - Usada para reconstruir o contexto do modelo em turnos futuros
   - Checkpoints grandes de depuração pré-Compaction são ignorados quando a
     transcrição ativa excede o limite de tamanho de checkpoint, evitando uma
     segunda cópia gigante `.checkpoint.*.jsonl`.

---

## Locais no disco

Por agente, no host do Gateway:

- Armazenamento: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcrições: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sessões de tópico do Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw resolve esses caminhos via `src/config/sessions.ts`.

---

## Manutenção do armazenamento e controles de disco

A persistência de sessões tem controles automáticos de manutenção (`session.maintenance`) para `sessions.json`, artefatos de transcrição e sidecars de trajetória:

- `mode`: `warn` (padrão) ou `enforce`
- `pruneAfter`: corte de idade para entradas obsoletas (padrão `30d`)
- `maxEntries`: limite de entradas em `sessions.json` (padrão `500`)
- `resetArchiveRetention`: retenção para arquivos de transcrição `*.reset.<timestamp>` (padrão: igual a `pruneAfter`; `false` desabilita a limpeza)
- `maxDiskBytes`: orçamento opcional do diretório de sessões
- `highWaterBytes`: alvo opcional após a limpeza (padrão `80%` de `maxDiskBytes`)

Gravações normais do Gateway agrupam a limpeza de `maxEntries` para limites de tamanho de produção, então um armazenamento pode exceder brevemente o limite configurado antes que a próxima limpeza de marca alta o reescreva para baixo. Leituras do armazenamento de sessões não podam nem limitam entradas durante a inicialização do Gateway; use gravações ou `openclaw sessions cleanup --enforce` para limpeza. `openclaw sessions cleanup --enforce` ainda aplica o limite configurado imediatamente.

A manutenção preserva ponteiros duráveis de conversas externas, como sessões de grupo
e sessões de chat com escopo de thread, mas entradas sintéticas de runtime para cron, hooks,
heartbeat, ACP e subagentes ainda podem ser removidas quando excedem a
idade, contagem ou orçamento de disco configurados.

OpenClaw não cria mais backups automáticos de rotação `sessions.json.bak.*` durante gravações do Gateway. A chave legada `session.maintenance.rotateBytes` é ignorada e `openclaw doctor --fix` a remove de configurações antigas.

Ordem de aplicação para limpeza do orçamento de disco (`mode: "enforce"`):

1. Remover primeiro os artefatos arquivados mais antigos, transcrições órfãs ou trajetórias órfãs.
2. Se ainda estiver acima do alvo, expulsar as entradas de sessão mais antigas e seus arquivos de transcrição/trajetória.
3. Continuar até que o uso esteja em ou abaixo de `highWaterBytes`.

Em `mode: "warn"`, OpenClaw relata possíveis expulsões, mas não modifica o armazenamento/arquivos.

Execute a manutenção sob demanda:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessões Cron e logs de execução

Execuções cron isoladas também criam entradas/transcrições de sessão e têm controles de retenção dedicados:

- `cron.sessionRetention` (padrão `24h`) remove sessões antigas de execuções cron isoladas do armazenamento de sessões (`false` desabilita).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` podam arquivos `~/.openclaw/cron/runs/<jobId>.jsonl` (padrões: `2_000_000` bytes e `2000` linhas).

Quando cron força a criação de uma nova sessão de execução isolada, ele sanitiza a entrada
de sessão `cron:<jobId>` anterior antes de gravar a nova linha. Ele carrega
preferências seguras, como configurações de thinking/fast/verbose, rótulos e substituições
explícitas de modelo/autenticação selecionadas pelo usuário. Ele descarta contexto
ambiente de conversa, como roteamento de canal/grupo, política de envio ou fila,
elevação, origem e vínculo de runtime ACP, para que uma execução isolada nova não
herde entrega obsoleta ou autoridade de runtime de uma execução mais antiga.

---

## Chaves de sessão (`sessionKey`)

Uma `sessionKey` identifica _em qual bucket de conversa_ você está (roteamento + isolamento).

Padrões comuns:

- Chat principal/direto (por agente): `agent:<agentId>:<mainKey>` (padrão `main`)
- Grupo: `agent:<agentId>:<channel>:group:<id>`
- Sala/canal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` ou `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (a menos que substituído)

As regras canônicas estão documentadas em [/concepts/session](/pt-BR/concepts/session).

---

## IDs de sessão (`sessionId`)

Cada `sessionKey` aponta para uma `sessionId` atual (o arquivo de transcrição que continua a conversa).

Regras gerais:

- **Reset** (`/new`, `/reset`) cria uma nova `sessionId` para essa `sessionKey`.
- **Reset diário** (padrão 4:00 AM no horário local do host do gateway) cria uma nova `sessionId` na próxima mensagem após o limite de reset.
- **Expiração por inatividade** (`session.reset.idleMinutes` ou legado `session.idleMinutes`) cria uma nova `sessionId` quando uma mensagem chega após a janela de inatividade. Quando diário + inatividade estão ambos configurados, vence o que expirar primeiro.
- **Eventos do sistema** (heartbeat, despertares cron, notificações de exec, contabilidade do gateway) podem alterar a linha da sessão, mas não estendem a validade para reset diário/por inatividade. A rolagem de reset descarta avisos de eventos do sistema em fila para a sessão anterior antes que o prompt novo seja construído.
- **Guarda de fork do pai da thread** (`session.parentForkMaxTokens`, padrão `100000`) ignora o fork da transcrição pai quando a sessão pai já é grande demais; a nova thread começa do zero. Defina `0` para desabilitar.

Detalhe de implementação: a decisão acontece em `initSessionState()` em `src/auto-reply/reply/session.ts`.

---

## Esquema do armazenamento de sessões (`sessions.json`)

O tipo de valor do armazenamento é `SessionEntry` em `src/config/sessions.ts`.

Campos principais (não exaustivo):

- `sessionId`: id da transcrição atual (o nome de arquivo é derivado disso, a menos que `sessionFile` esteja definido)
- `sessionStartedAt`: timestamp de início da `sessionId` atual; a validade do reset diário
  usa isso. Linhas legadas podem derivá-lo do cabeçalho de sessão JSONL.
- `lastInteractionAt`: timestamp da última interação real de usuário/canal; a validade do reset por inatividade
  usa isso, de modo que heartbeat, cron e eventos exec não mantêm sessões
  ativas. Linhas legadas sem esse campo voltam ao tempo de início de sessão
  recuperado para validade por inatividade.
- `updatedAt`: timestamp da última alteração da linha no armazenamento, usado para listagem, poda e
  contabilidade. Ele não é a autoridade para validade de reset diário/por inatividade.
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
- `memoryFlushAt`: timestamp do último flush de memória pré-Compaction
- `memoryFlushCompactionCount`: contagem de Compaction quando o último flush foi executado

É seguro editar o armazenamento, mas o Gateway é a autoridade: ele pode reescrever ou reidratar entradas conforme as sessões são executadas.

---

## Estrutura da transcrição (`*.jsonl`)

Transcrições são gerenciadas pelo `SessionManager` de `@mariozechner/pi-coding-agent`.

O arquivo é JSONL:

- Primeira linha: cabeçalho da sessão (`type: "session"`, inclui `id`, `cwd`, `timestamp`, `parentSession` opcional)
- Depois: entradas de sessão com `id` + `parentId` (árvore)

Tipos de entrada relevantes:

- `message`: mensagens user/assistant/toolResult
- `custom_message`: mensagens injetadas por extensão que _entram_ no contexto do modelo (podem ser ocultadas da UI)
- `custom`: estado de extensão que _não entra_ no contexto do modelo
- `compaction`: resumo de Compaction persistido com `firstKeptEntryId` e `tokensBefore`
- `branch_summary`: resumo persistido ao navegar por um ramo da árvore

OpenClaw intencionalmente **não** “ajusta” transcrições; o Gateway usa `SessionManager` para lê-las/escrevê-las.

---

## Janelas de contexto vs tokens rastreados

Dois conceitos diferentes importam:

1. **Janela de contexto do modelo**: limite rígido por modelo (tokens visíveis ao modelo)
2. **Contadores do armazenamento de sessões**: estatísticas rolantes gravadas em `sessions.json` (usadas para /status e dashboards)

Se você está ajustando limites:

- A janela de contexto vem do catálogo de modelos (e pode ser substituída via configuração).
- `contextTokens` no armazenamento é um valor de estimativa/relatório de runtime; não o trate como garantia estrita.

Para saber mais, consulte [/token-use](/pt-BR/reference/token-use).

---

## Compaction: o que é

Compaction resume a conversa mais antiga em uma entrada `compaction` persistida na transcrição e mantém intactas as mensagens recentes.

Após Compaction, turnos futuros veem:

- O resumo de Compaction
- Mensagens após `firstKeptEntryId`

Compaction é **persistente** (diferentemente da limpeza de sessões). Consulte [/concepts/session-pruning](/pt-BR/concepts/session-pruning).

## Limites de chunks de Compaction e pareamento de ferramentas

Quando OpenClaw divide uma transcrição longa em chunks de Compaction, ele mantém
chamadas de ferramentas do assistant pareadas com suas entradas `toolResult` correspondentes.

- Se a divisão por proporção de tokens cair entre uma chamada de ferramenta e seu resultado, OpenClaw
  desloca o limite para a mensagem de chamada de ferramenta do assistant em vez de separar
  o par.
- Se um bloco final de resultado de ferramenta ultrapassaria o alvo do chunk,
  OpenClaw preserva esse bloco de ferramenta pendente e mantém a cauda não resumida
  intacta.
- Blocos de chamadas de ferramentas abortadas/com erro não mantêm uma divisão pendente aberta.

---

## Quando a auto-Compaction acontece (runtime Pi)

No agente Pi embarcado, a auto-Compaction é acionada em dois casos:

1. **Recuperação de estouro**: o modelo retorna um erro de estouro de contexto
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` e variantes semelhantes no formato de provedores) → compactar → tentar novamente.
2. **Manutenção por limite**: após um turno bem-sucedido, quando:

`contextTokens > contextWindow - reserveTokens`

Onde:

- `contextWindow` é a janela de contexto do modelo
- `reserveTokens` é a folga reservada para prompts + a próxima saída do modelo

Estas são semânticas do runtime Pi (OpenClaw consome os eventos, mas Pi decide quando compactar).

OpenClaw também pode acionar uma Compaction local de preflight antes de abrir a próxima
execução quando `agents.defaults.compaction.maxActiveTranscriptBytes` está definido e o
arquivo de transcrição ativa atinge esse tamanho. Isso é uma proteção de tamanho de arquivo para o custo de
reabertura local, não arquivamento bruto: o OpenClaw ainda executa a Compaction semântica normal,
e exige `truncateAfterCompaction` para que o resumo compactado possa se tornar uma
nova transcrição sucessora.

Para execuções Pi incorporadas, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
adiciona uma proteção opcional de loop de ferramentas. Depois que um resultado de ferramenta é anexado e antes da
próxima chamada de modelo, o OpenClaw estima a pressão de prompt usando a mesma lógica de orçamento
de preflight usada no início do turno. Se o contexto não couber mais, a proteção não
compacta dentro do hook `transformContext` do Pi. Ela emite um sinal estruturado
de pré-verificação no meio do turno, interrompe o envio do prompt atual e permite que o
loop de execução externo use o caminho de recuperação existente: truncar resultados de ferramentas grandes demais
quando isso for suficiente, ou acionar o modo de Compaction configurado e tentar novamente. A
opção é desabilitada por padrão e funciona com os modos de Compaction `default` e `safeguard`,
incluindo Compaction safeguard com suporte de provedor.
Isso é independente de `maxActiveTranscriptBytes`: a proteção por tamanho em bytes executa
antes de um turno abrir, enquanto a pré-verificação no meio do turno executa mais tarde no loop de ferramentas Pi incorporado
depois que novos resultados de ferramentas foram anexados.

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

O OpenClaw também aplica um piso de segurança para execuções incorporadas:

- Se `compaction.reserveTokens < reserveTokensFloor`, o OpenClaw aumenta esse valor.
- O piso padrão é `20000` tokens.
- Defina `agents.defaults.compaction.reserveTokensFloor: 0` para desabilitar o piso.
- Se já estiver mais alto, o OpenClaw deixa como está.
- O `/compact` manual respeita um `agents.defaults.compaction.keepRecentTokens`
  explícito e mantém o ponto de corte da cauda recente do Pi. Sem um orçamento de retenção explícito,
  a Compaction manual continua sendo um checkpoint rígido e o contexto reconstruído começa a partir
  do novo resumo.
- Defina `agents.defaults.compaction.midTurnPrecheck.enabled: true` para executar a
  pré-verificação opcional do loop de ferramentas após novos resultados de ferramentas e antes da próxima chamada de
  modelo. Isso é apenas um gatilho; a geração do resumo ainda usa o caminho de
  Compaction configurado. É independente de `maxActiveTranscriptBytes`, que é uma
  proteção por tamanho em bytes da transcrição ativa no início do turno.
- Defina `agents.defaults.compaction.maxActiveTranscriptBytes` como um valor em bytes ou
  uma string como `"20mb"` para executar a Compaction local antes de um turno quando a transcrição
  ativa ficar grande. Essa proteção só fica ativa quando
  `truncateAfterCompaction` também está habilitado. Deixe sem definir ou defina `0` para
  desabilitar.
- Quando `agents.defaults.compaction.truncateAfterCompaction` está habilitado,
  o OpenClaw rotaciona a transcrição ativa para um JSONL sucessor compactado após a
  Compaction. A transcrição completa antiga permanece arquivada e vinculada a partir do
  checkpoint de Compaction, em vez de ser reescrita no lugar.

Motivo: deixar folga suficiente para “manutenção” de vários turnos (como gravações de memória) antes que a Compaction se torne inevitável.

Implementação: `ensurePiCompactionReserveTokens()` em `src/agents/pi-settings.ts`
(chamado a partir de `src/agents/pi-embedded-runner.ts`).

---

## Provedores de Compaction plugáveis

Plugins podem registrar um provedor de Compaction via `registerCompactionProvider()` na API do Plugin. Quando `agents.defaults.compaction.provider` é definido como o id de um provedor registrado, o Plugin safeguard delega a sumarização a esse provedor em vez do pipeline integrado `summarizeInStages`.

- `provider`: id de um Plugin de provedor de Compaction registrado. Deixe sem definir para a sumarização LLM padrão.
- Definir um `provider` força `mode: "safeguard"`.
- Provedores recebem as mesmas instruções de Compaction e a mesma política de preservação de identificadores que o caminho integrado.
- O safeguard ainda preserva o contexto de sufixo de turno recente e turno dividido depois da saída do provedor.
- A sumarização safeguard integrada redestila resumos anteriores com novas mensagens
  em vez de preservar o resumo anterior completo literalmente.
- O modo safeguard habilita auditorias de qualidade de resumo por padrão; defina
  `qualityGuard.enabled: false` para ignorar o comportamento de tentar novamente em caso de saída malformada.
- Se o provedor falhar ou retornar um resultado vazio, o OpenClaw volta automaticamente para a sumarização LLM integrada.
- Sinais de aborto/timeout são relançados (não engolidos) para respeitar o cancelamento do chamador.

Fonte: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Superfícies visíveis ao usuário

Você pode observar a Compaction e o estado da sessão via:

- `/status` (em qualquer sessão de chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Modo verboso: `🧹 Auto-compaction complete` + contagem de Compaction

---

## Manutenção silenciosa (`NO_REPLY`)

O OpenClaw oferece suporte a turnos “silenciosos” para tarefas em segundo plano em que o usuário não deve ver saída intermediária.

Convenção:

- O assistente inicia sua saída com o token silencioso exato `NO_REPLY` /
  `no_reply` para indicar “não entregar uma resposta ao usuário”.
- O OpenClaw remove/suprime isso na camada de entrega.
- A supressão exata de token silencioso não diferencia maiúsculas de minúsculas, então `NO_REPLY` e
  `no_reply` contam quando todo o payload é apenas o token silencioso.
- Isso é apenas para turnos verdadeiramente em segundo plano/sem entrega; não é um atalho para
  solicitações comuns acionáveis do usuário.

Desde `2026.1.10`, o OpenClaw também suprime **streaming de rascunho/digitação** quando um
chunk parcial começa com `NO_REPLY`, para que operações silenciosas não vazem saída
parcial no meio do turno.

---

## "Flush de memória" pré-Compaction (implementado)

Objetivo: antes que a Compaction automática aconteça, executar um turno agentic silencioso que grave estado
durável em disco (por exemplo, `memory/YYYY-MM-DD.md` no workspace do agente) para que a Compaction não possa
apagar contexto crítico.

O OpenClaw usa a abordagem de **flush pré-limiar**:

1. Monitorar o uso de contexto da sessão.
2. Quando ele cruza um “limiar suave” (abaixo do limiar de Compaction do Pi), executar uma diretiva silenciosa
   “grave memória agora” para o agente.
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
- Quando `model` está definido, o turno de flush usa esse modelo sem herdar a
  cadeia de fallback da sessão ativa, então a manutenção apenas local não recai silenciosamente
  em um modelo de conversa pago.
- O flush executa uma vez por ciclo de Compaction (rastreado em `sessions.json`).
- O flush executa apenas para sessões Pi incorporadas (backends CLI o ignoram).
- O flush é ignorado quando o workspace da sessão é somente leitura (`workspaceAccess: "ro"` ou `"none"`).
- Consulte [Memória](/pt-BR/concepts/memory) para o layout de arquivos do workspace e padrões de escrita.

O Pi também expõe um hook `session_before_compact` na API da extensão, mas a lógica de
flush do OpenClaw fica no lado do Gateway hoje.

---

## Checklist de solução de problemas

- Chave de sessão errada? Comece com [/concepts/session](/pt-BR/concepts/session) e confirme o `sessionKey` em `/status`.
- Incompatibilidade entre armazenamento e transcrição? Confirme o host do Gateway e o caminho do armazenamento em `openclaw status`.
- Spam de Compaction? Verifique:
  - janela de contexto do modelo (pequena demais)
  - configurações de Compaction (`reserveTokens` alto demais para a janela do modelo pode causar Compaction mais cedo)
  - inchaço de resultados de ferramentas: habilite/ajuste a poda de sessão
- Turnos silenciosos vazando? Confirme que a resposta começa com `NO_REPLY` (token exato, sem diferenciar maiúsculas de minúsculas) e que você está em uma build que inclui a correção de supressão de streaming.

## Relacionado

- [Gerenciamento de sessão](/pt-BR/concepts/session)
- [Poda de sessão](/pt-BR/concepts/session-pruning)
- [Motor de contexto](/pt-BR/concepts/context-engine)
