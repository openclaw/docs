---
read_when:
    - Você precisa depurar IDs de sessão, eventos de transcrição ou campos de linhas de sessão
    - Você está alterando o comportamento de Compaction automática ou adicionando tarefas de manutenção de “pré-Compaction”
    - Você quer implementar liberações de memória ou turnos silenciosos do sistema
summary: 'Análise aprofundada: armazenamento de sessões + transcrições, ciclo de vida e detalhes internos da (auto)Compaction'
title: Análise detalhada do gerenciamento de sessões
x-i18n:
    generated_at: "2026-07-16T12:56:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7551a94a4e2dc8be8b69503795309d0200cc3b5d7231b54083dbcaade697b06c
    source_path: reference/session-management-compaction.md
    workflow: 16
---

Um único **processo do Gateway** controla o estado da sessão de ponta a ponta. As interfaces (aplicativo para macOS, interface web de controle, TUI) consultam o Gateway para obter listas de sessões e contagens de tokens. No modo remoto, os arquivos de sessão ficam no host remoto, portanto, verificar os arquivos do Mac local não refletirá o que o Gateway está usando.

Primeiro, consulte a documentação de visão geral: [Gerenciamento de sessões](/pt-BR/concepts/session), [Compaction](/pt-BR/concepts/compaction), [Visão geral da memória](/pt-BR/concepts/memory), [Pesquisa na memória](/pt-BR/concepts/memory-search), [Limpeza de sessões](/pt-BR/concepts/session-pruning), [Higiene da transcrição](/pt-BR/reference/transcript-hygiene) e a referência completa de configuração em [Configuração do agente](/pt-BR/gateway/config-agents).

## Duas camadas de persistência

1. **Linhas de sessão (SQLite por agente)** - mapa de chave/valor `sessionKey -> SessionEntry`. Estado mutável de execução controlado pelo Gateway. Rastreia metadados: ID da sessão atual, última atividade, opções, contadores de tokens.
2. **Eventos de transcrição (SQLite por agente)** - somente anexação, estruturados em árvore (as entradas têm `id` + `parentId`). Armazena a conversa, as chamadas de ferramentas e os resumos de Compaction; recria o contexto do modelo para interações futuras. Os pontos de verificação de Compaction são metadados sobre a transcrição sucessora compactada — uma nova Compaction não grava uma segunda cópia de `.checkpoint.*.jsonl`.

Instalações mais antigas ainda podem ter arquivos `sessions.json` no diretório `sessions/`
do agente. Trate esses arquivos como entradas legadas para migração de linhas de sessão ou alvos explícitos
de manutenção offline. A inicialização do Gateway e `openclaw doctor --fix` importam
automaticamente as linhas legadas ativas e o histórico de transcrições para o armazenamento SQLite por agente.
Execute `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` e siga a [sequência de migração do
Doctor](/pt-BR/cli/doctor#session-sqlite-migration) quando precisar de evidências explícitas
de inspeção ou validação. Se uma migração falhar depois que os artefatos legados de transcrição
tiverem sido arquivados, use o modo de recuperação do Doctor dessa sequência.
A recuperação usa manifestos de migração, restaura apenas os artefatos de suporte arquivados
afetados, prepara um relatório de problema sanitizado para o GitHub quando solicitado e não
faz com que a execução ativa volte a ler arquivos JSONL.

Os leitores de histórico do Gateway evitam materializar toda a transcrição, a menos que a interface precise de acesso arbitrário ao histórico. O histórico da primeira página, o histórico incorporado do chat, a recuperação após reinicialização e as verificações de tokens/uso utilizam leituras limitadas do final do SQLite. As varreduras completas da transcrição passam pelo índice assíncrono de transcrições e são compartilhadas entre leitores simultâneos.

## Locais no disco

Por agente, no host do Gateway (resolvido por meio de `src/config/sessions.ts`):

- Armazenamento de linhas de sessão em execução: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Linhas de transcrição em execução: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Artefatos legados/arquivados de transcrição: `~/.openclaw/agents/<agentId>/sessions/`
- Entrada legada para migração de linhas: `~/.openclaw/agents/<agentId>/sessions/sessions.json`

## Manutenção do armazenamento e controles de disco

`session.maintenance` controla a manutenção automática das linhas de sessão do SQLite, das linhas de transcrição do SQLite, dos artefatos arquivados e dos arquivos auxiliares de trajetória:

| Chave                   | Padrão                | Observações                                                                                      |
| ----------------------- | --------------------- | ------------------------------------------------------------------------------------------------ |
| `mode`                  | `"enforce"`           | ou `"warn"` (somente relatório, sem alterações)                                                 |
| `pruneAfter`            | `"30d"`               | limite de idade para entradas obsoletas                                                         |
| `maxEntries`            | `500`                 | limite de entradas de sessão                                                                    |
| `resetArchiveRetention` | manter (sem limite de idade) | limite de idade para arquivos de transcrição `*.reset.*`/`*.deleted.*`; uma duração ativa a exclusão |
| `maxDiskBytes`          | `2gb`                 | orçamento de disco por agente para sessões; `false` desativa                                    |
| `highWaterBytes`        | 80% de `maxDiskBytes` | meta após a limpeza do orçamento                                                                |

As transcrições arquivadas são mantidas por padrão e compactadas com zstd (`*.jsonl.<reason>.<timestamp>.zst`) quando a execução oferece suporte, portanto, excluir ou redefinir uma sessão nunca descarta silenciosamente o histórico da conversa. O orçamento de disco remove primeiro os arquivos mais antigos, antes de afetar as sessões ativas.

A aplicação ativa de `maxDiskBytes` no SQLite mede os bytes do JSON da linha de sessão mais o JSON dos eventos de transcrição por sessão; a aplicação na manutenção offline legada mede os arquivos no diretório de sessões selecionado.

As sessões de sondagem de execução de modelo do Gateway (chaves correspondentes a `agent:*:explicit:model-run-<uuid>`) recebem uma retenção separada e fixa de `24h`. Essa limpeza é condicionada à pressão: ela só é executada quando a manutenção ou o limite de entradas de sessão é atingido e somente antes da etapa global de limpeza ou limitação de entradas obsoletas. Outras sessões explícitas não usam essa retenção.

Ordem de aplicação da limpeza do orçamento de disco (`mode: "enforce"`):

1. Remover primeiro os artefatos de transcrição arquivados mais antigos, os artefatos legados órfãos ou os artefatos de trajetória órfãos.
2. Se o uso ainda estiver acima da meta, remover as entradas de sessão mais antigas e suas linhas de transcrição ou artefatos de trajetória.
3. Repetir até que o uso seja igual ou inferior a `highWaterBytes`.

`mode: "warn"` informa possíveis remoções sem alterar o armazenamento nem os arquivos.

Execute a manutenção sob demanda:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

A manutenção preserva ponteiros duráveis de conversas externas, como sessões de grupo e sessões de chat com escopo de thread, mas entradas sintéticas de execução (Cron, hooks, Heartbeat, ACP, subagentes) ainda podem ser removidas quando excederem a idade, a contagem ou o orçamento de disco configurado. Execuções isoladas de Cron usam um controle `cron.sessionRetention` separado, independente da retenção de sondagens de execução de modelo.

As gravações normais do Gateway passam pelo acessador de sessões, que serializa as alterações do SQLite por agente por meio do caminho de gravação da execução. O código de execução deve preferir os auxiliares do acessador em `src/config/sessions/session-accessor.ts`; os auxiliares legados de `sessions.json` são ferramentas de migração e manutenção offline. Quando um Gateway está acessível, `openclaw sessions cleanup` e `openclaw agents delete` sem simulação delegam as alterações do armazenamento ao Gateway para que a limpeza entre na mesma fila de gravação; `--store <path>` é o caminho explícito de reparo offline para um armazenamento legado selecionado e sempre permanece local (assim como `--dry-run`). A limpeza de `maxEntries` é realizada em lotes para armazenamentos do porte dos usados em produção, portanto, um armazenamento pode exceder brevemente o limite configurado antes que a próxima limpeza por nível máximo o reduza. As leituras nunca limpam nem limitam entradas durante a inicialização do Gateway — somente as gravações ou `openclaw sessions cleanup --enforce` fazem isso, e este último também aplica o limite imediatamente e remove artefatos legados antigos e não referenciados de transcrição, pontos de verificação e trajetória, mesmo sem um orçamento de disco configurado.

O OpenClaw não cria mais backups automáticos de rotação `sessions.json.bak.*` durante as gravações do Gateway. O esquema atual rejeita a chave legada `session.maintenance.rotateBytes`, e `openclaw doctor --fix` a remove das configurações antigas.

As alterações de transcrição usam a fila de gravação da sessão para o destino de transcrição do SQLite:

| Configuração                         | Padrão    | Substituição por variável de ambiente           |
| ------------------------------------ | --------- | ------------------------------------------------ |
| `session.writeLock.acquireTimeoutMs` | `60000`   | `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS` |
| `session.writeLock.staleMs`          | `1800000` | `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`           |
| `session.writeLock.maxHoldMs`        | `300000`  | `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`        |

`acquireTimeoutMs` determina por quanto tempo a espera por um bloqueio apresenta um erro de sessão ocupada antes de desistir; aumente esse valor somente quando trabalhos legítimos de preparação, limpeza, Compaction ou espelhamento de transcrição permanecerem em contenção por mais tempo em máquinas lentas. `staleMs` determina quando um bloqueio existente pode ser recuperado por estar obsoleto. `maxHoldMs` é o limite de liberação do monitor interno do processo.

### Rebaixamento após a migração para o SQLite

Restaure os artefatos legados arquivados de transcrição antes de executar uma versão
mais antiga do OpenClaw baseada em arquivos:

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

A migração mantém os arquivos legados `sessions.json` no local para suporte e
reversão, mas os arquivos JSONL ativos de transcrição importados para o SQLite são
renomeados para `session-sqlite-import-archive/`. As execuções mais antigas baseadas em arquivos seguem
os caminhos `sessionFile` em `sessions.json`, portanto, precisam que esses artefatos sejam restaurados
antes da inicialização. A restauração usa manifestos de migração, move apenas os artefatos
arquivados registrados cujos caminhos originais estejam ausentes e mantém o banco de dados SQLite
no local para uma recuperação futura.

As sessões criadas após a migração para o SQLite existem somente no SQLite e não aparecerão em uma
execução mais antiga baseada em arquivos. Se fizer upgrade novamente após um downgrade, execute outra vez a
sequência de inspeção e validação do Doctor para que o OpenClaw possa verificar os artefatos legados
restaurados antes da importação.

## Sessões de Cron e logs de execução

As execuções isoladas de Cron criam suas próprias entradas/transcrições de sessão com retenção dedicada:

- `cron.sessionRetention` (padrão `"24h"`) remove do armazenamento as sessões antigas de execuções isoladas de Cron; `false` desativa.
- O histórico de execuções mantém as 2000 linhas terminais mais recentes por tarefa de Cron. As linhas perdidas mantêm sua janela de limpeza de 24 horas.

Quando o Cron força a criação de uma nova sessão de execução isolada, ele sanitiza a entrada da sessão `cron:<jobId>` anterior antes de gravar a nova linha: mantém preferências seguras (configurações de pensamento/rapidez/detalhamento/raciocínio, rótulos e nome de exibição) e substituições de modelo/autenticação selecionadas explicitamente pelo usuário, mas descarta o contexto ambiente da conversa (roteamento de canal/grupo, política de envio/fila, elevação, origem e vinculação de execução do ACP), para que uma nova execução isolada não herde autoridade obsoleta de entrega ou execução de uma execução anterior.

## Chaves de sessão (`sessionKey`)

Uma `sessionKey` identifica o agrupamento de conversas em que você está (roteamento + isolamento). Regras canônicas: [/concepts/session](/pt-BR/concepts/session).

| Padrão                       | Exemplo                                                     |
| ---------------------------- | ----------------------------------------------------------- |
| Chat principal/direto (por agente) | `agent:<agentId>:<mainKey>` (padrão `main`)                |
| Grupo                        | `agent:<agentId>:<channel>:group:<id>`                      |
| Sala/canal (Discord/Slack)   | `agent:<agentId>:<channel>:channel:<id>` ou `...:room:<id>` |
| Cron                         | `cron:<job.id>`                                             |
| Webhook                      | `hook:<uuid>` (a menos que substituído)                    |

## IDs de sessão (`sessionId`)

Cada `sessionKey` aponta para um `sessionId` atual (a identidade da transcrição do SQLite que dá continuidade à conversa). A lógica de decisão está em `initSessionState()`, em `src/auto-reply/reply/session.ts`.

- **Redefinição** (`/new`, `/reset`) cria um novo `sessionId` para esse `sessionKey`.
- **Redefinição diária** (por padrão, às 4:00 AM no horário local do host do Gateway) cria um novo `sessionId` na primeira mensagem após o limite de redefinição.
- **Expiração por inatividade** (`session.reset.idleMinutes`, ou o legado `session.idleMinutes`) cria um novo `sessionId` quando uma mensagem chega após a janela de inatividade. Se as opções diária e por inatividade estiverem configuradas, prevalece a que expirar primeiro.
- **Retomada após reconexão da interface de controle** preserva a sessão atualmente visível para um envio após uma reconexão quando o Gateway recebe o `sessionId` correspondente de um cliente de interface do operador. Esse é um sinal de uso único; envios obsoletos comuns ainda criam um novo `sessionId`.
- **Eventos do sistema** (Heartbeat, ativações do Cron, notificações de execução, manutenção de registros do Gateway) podem alterar a linha da sessão, mas nunca prolongam a validade da redefinição diária ou por inatividade. A passagem para uma nova sessão após a redefinição descarta as notificações de eventos do sistema enfileiradas para a sessão anterior antes que o novo prompt seja criado.
- **Política de bifurcação do pai** usa a ramificação ativa do OpenClaw ao criar uma thread ou bifurcação de subagente. Se essa ramificação for grande demais (acima de um limite interno fixo, atualmente 100K tokens), o OpenClaw inicia o filho com contexto isolado, em vez de falhar ou herdar um histórico inutilizável. O dimensionamento é automático e não configurável; a configuração legada `session.parentForkMaxTokens` é removida por `openclaw doctor --fix`.
- **Bifurcações do operador**: `sessions.create { parentSessionKey, fork: true }` cria uma nova sessão cuja transcrição se ramifica a partir do estado atual do pai (o mesmo mecanismo de bifurcação usado na criação de subagentes, incluindo o limite de tamanho acima). A bifurcação é recusada enquanto o pai tem uma execução ativa, herda a seleção de modelo do pai, a menos que uma seja passada explicitamente, e marca o filho como `forkedFromParent` com contadores de tokens zerados.

## Esquema do armazenamento de sessões

O armazenamento de execução mantém valores `SessionEntry` no SQLite de cada agente. O tipo do valor é `SessionEntry` em `src/config/sessions.ts`. Campos principais (lista não exaustiva):

- `sessionId`: ID da transcrição atual usado para endereçar linhas de transcrição do SQLite
- `sessionStartedAt`: carimbo de data/hora de início do `sessionId` atual; a validade da redefinição diária usa esse valor. Linhas legadas podem derivá-lo do cabeçalho da sessão JSONL.
- `lastInteractionAt`: carimbo de data/hora da última interação real do usuário/canal; a validade da redefinição por inatividade usa esse valor para que eventos de Heartbeat, Cron e execução não mantenham as sessões ativas. Linhas legadas sem esse campo recorrem ao horário de início recuperado da sessão.
- `updatedAt`: carimbo de data/hora da última alteração da linha do armazenamento, usado para listagem/remoção/manutenção de registros — não é a autoridade sobre a validade diária ou por inatividade.
- `archivedAt`: carimbo de data/hora opcional de arquivamento. As sessões arquivadas permanecem no armazenamento com a transcrição intacta e são excluídas das listagens ativas normais.
- `pinnedAt`: carimbo de data/hora opcional de fixação. Sessões ativas fixadas são ordenadas antes das não fixadas; arquivar uma sessão remove sua fixação.
- Interoperabilidade com threads do Codex: ambos os campos seguem o formato de gerenciamento de threads do Codex — os booleanos `archived`/`pinned` transmitidos são sempre derivados do carimbo de data/hora e definidos no lado do servidor, em conformidade com a semântica de `threads.archived_at` do Codex e a serialização camelCase. Os carimbos de data/hora do OpenClaw usam milissegundos desde a época, enquanto o Codex usa segundos desde a época; portanto, as pontes fazem a conversão na interface do plugin `codex`. O Codex ainda não tem uma API de fixação (somente `thread/archive`/`thread/unarchive`); o estado de fixação permanece no lado do OpenClaw até que uma exista. Nesse momento, o formato correspondente permitirá que sessões vinculadas façam automaticamente o ciclo completo do estado de fixação.
- A supervisão do Codex lista somente threads nativas não arquivadas. Uma thread local do Gateway com atividade desconhecida `idle` ou `notLoaded` somente pode ser arquivada por meio de `thread/archive` nativo depois que o operador confirmar explicitamente que nenhum outro processo do Codex é seu proprietário; primeiro, o plugin realiza uma nova leitura do status local do processo e, em seguida, a thread desaparece do catálogo. Essa leitura não pode provar que outro processo do App Server não está usando a thread. O OpenClaw se recusa a arquivar linhas ativas e com erro, e o arquivamento de nós pareados fica indisponível até que a ponte do Node possa controlar todo o ciclo de vida da thread transmitida. Desarquivar em um cliente Codex nativo torna a thread qualificada para reaparecer.
- `lastReadAt` / `markedUnreadAt`: carimbos de data/hora do estado de leitura definidos no lado do servidor por `sessions.patch { unread }` — `unread: false` registra uma leitura (define `lastReadAt`, limpa `markedUnreadAt`); `unread: true` marca a sessão como não lida até a próxima leitura. As linhas de sessão expõem um booleano derivado `unread`: explicitamente marcado como não lido ou lido antes da atividade mais recente. Sessões nunca marcadas como lidas permanecem `unread: false`, para que instalações existentes não sejam sinalizadas após a atualização.
- `lastActivityAt`: carimbo de data/hora da última execução concluída do agente que conta como atividade digna de marcação como não lida (execuções de usuário, canal e Cron). Turnos de Heartbeat e eventos internos, além de atualizações de metadados, não o atualizam; `updatedAt` não é um sinal de atividade.
- `sessionFile`: marcador legado mantido para compatibilidade de migração/arquivamento; a execução ativa usa a identidade do SQLite
- `chatType`: `direct | group | room`
- `provider`, `subject`, `room`, `space`, `displayName`: metadados de rotulagem de grupo/canal
- Alternâncias: `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`, `sendPolicy` (substituição por sessão)
- Seleção de modelo: `providerOverride`, `modelOverride`, `authProfileOverride`
- Contadores de tokens (melhor esforço/dependentes do provedor): `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: quantas vezes a compactação automática foi concluída para esta chave de sessão
- `memoryFlushAt` / `memoryFlushCompactionCount`: carimbo de data/hora e contagem de compactações da última gravação da memória anterior à compactação

O Gateway é a autoridade: ele pode reescrever ou reidratar entradas à medida que as sessões
são executadas. Para instalações legadas com armazenamento em arquivos, faça a migração com
`openclaw doctor --session-sqlite import --session-sqlite-all-agents`, em vez de
editar `sessions.json` e esperar que a execução continue lendo esse arquivo.

## Estrutura dos eventos da transcrição

As transcrições são gerenciadas pelo acessor de sessões do OpenClaw e expostas ao código de execução por meio de auxiliares baseados em identidade. O fluxo de eventos permite somente acréscimos:

- Primeira entrada: cabeçalho da sessão — `type: "session"`, `id`, `cwd`, `timestamp`, `parentSession` opcional.
- Depois: entradas com `id` + `parentId` (estrutura em árvore).

Tipos de entrada relevantes:

- `message`: mensagens de usuário/assistente/toolResult
- `custom_message`: mensagem injetada pela extensão que _entra_ no contexto do modelo (renderizada na TUI quando `display: true`, totalmente oculta quando `display: false`)
- `custom`: estado da extensão que _não entra_ no contexto do modelo (para persistir o estado da extensão entre recarregamentos)
- `compaction`: resumo persistente da compactação com `firstKeptEntryId` e `tokensBefore`
- `branch_summary`: resumo persistente ao navegar por uma ramificação da árvore

O OpenClaw intencionalmente não "corrige" as transcrições; o Gateway usa `SessionManager` para lê-las/gravá-las.

## Janelas de contexto versus tokens rastreados

Dois conceitos diferentes:

1. **Janela de contexto do modelo**: limite rígido por modelo (tokens visíveis para o modelo). Vem do catálogo de modelos e pode ser substituído pela configuração.
2. **Contadores do armazenamento de sessões**: estatísticas contínuas gravadas na linha da sessão (usadas por `/status` e painéis). `contextTokens` é um valor estimado/de relatório da execução — não o trate como garantia estrita.

Mais informações sobre limites: [/reference/token-use](/pt-BR/reference/token-use).

## Compaction: o que é

A Compaction resume as partes mais antigas da conversa em uma entrada persistente `compaction` na transcrição e mantém intactas as mensagens recentes. Após a Compaction, os turnos futuros veem o resumo da compactação e as mensagens posteriores a `firstKeptEntryId`. A Compaction é **persistente**, diferentemente da remoção de sessões — consulte [/concepts/session-pruning](/pt-BR/concepts/session-pruning).

A reinjeção da seção AGENTS.md após a Compaction é opcional por meio de `agents.defaults.compaction.postCompactionSections`; quando não está definido ou é `[]`, o OpenClaw não acrescenta trechos de AGENTS.md ao resumo da compactação.

### Limites dos blocos e pareamento de ferramentas

Ao dividir uma transcrição longa em blocos de Compaction, o OpenClaw mantém as chamadas de ferramentas do assistente pareadas com as entradas `toolResult` correspondentes:

- Se a divisão por proporção de tokens ocorrer entre uma chamada de ferramenta e seu resultado, o OpenClaw desloca o limite para a mensagem de chamada de ferramenta do assistente, em vez de separar o par.
- Se um bloco final de resultados de ferramentas fizer com que o bloco ultrapasse o tamanho-alvo, o OpenClaw preserva esse bloco de ferramentas pendente e mantém intacta a parte final não resumida.
- Blocos de chamadas de ferramentas abortadas/com erro não mantêm aberta uma divisão pendente.

## Quando ocorre a Compaction automática

Dois gatilhos no agente OpenClaw incorporado:

1. **Recuperação de estouro**: o modelo retorna um erro de estouro de contexto (`request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model`, `ollama error: context length exceeded` e outras variantes com formato específico do provedor) — compacta e tenta novamente. Quando o provedor informa a contagem de tokens da tentativa, o OpenClaw encaminha essa contagem observada para a compactação de recuperação de estouro; se o provedor confirmar o estouro, mas não expuser uma contagem analisável, o OpenClaw passa aos mecanismos de compactação e aos diagnósticos uma contagem sintética minimamente acima do orçamento. Se a recuperação de estouro ainda falhar, o OpenClaw apresenta orientações explícitas e preserva o mapeamento da sessão atual, em vez de alternar silenciosamente para um novo ID de sessão — tente enviar a mensagem novamente, execute `/compact` ou execute `/new`.
2. **Manutenção por limite**: após um turno bem-sucedido, quando `contextTokens > contextWindow - reserveTokens`, em que `contextWindow` é a janela de contexto do modelo e `reserveTokens` é a margem reservada para prompts e para a próxima saída do modelo.

Duas proteções adicionais são executadas fora desses dois gatilhos:

- **Compaction local de pré-verificação**: defina `agents.defaults.compaction.maxActiveTranscriptBytes` (bytes ou uma string como `"20mb"`) para acionar a Compaction local antes de abrir a próxima execução quando a transcrição ativa atingir esse tamanho. Essa é uma proteção de tamanho para o custo de reabertura local, não um arquivamento bruto — a Compaction semântica normal ainda é executada e requer `truncateAfterCompaction` para que o resumo compactado se torne uma nova transcrição sucessora.
- **Pré-verificação durante o turno**: defina `agents.defaults.compaction.midTurnPrecheck.enabled: true` (padrão `false`) para adicionar uma proteção ao loop de ferramentas. Depois que um resultado de ferramenta é acrescentado e antes da próxima chamada ao modelo, o OpenClaw estima a pressão sobre o prompt usando a mesma lógica de orçamento de pré-verificação usada no início do turno. Se o contexto não couber mais, a proteção não realiza a Compaction em linha — ela gera um sinal estruturado de pré-verificação durante o turno, interrompe o envio do prompt atual e permite que o loop externo de execução use o caminho de recuperação existente (truncar resultados de ferramentas grandes demais quando isso for suficiente ou acionar o modo de Compaction configurado e tentar novamente). Funciona com os modos de Compaction `default` e `safeguard`, incluindo a Compaction de proteção executada pelo provedor. É independente de `maxActiveTranscriptBytes`: a proteção de tamanho em bytes é executada antes da abertura de um turno; a pré-verificação durante o turno ocorre depois, após o acréscimo de novos resultados de ferramentas.

## Configurações de Compaction

```json5
{
  agents: {
    defaults: {
      compaction: {
        enabled: true,
        reserveTokens: 16384,
        keepRecentTokens: 20000,
      },
    },
  },
}
```

OpenClaw também impõe um limite mínimo de segurança para execuções incorporadas: se `compaction.reserveTokens` estiver abaixo de `reserveTokensFloor` (padrão `20000`), o OpenClaw o eleva. Defina `agents.defaults.compaction.reserveTokensFloor: 0` para desativar o limite mínimo. Quando a janela de contexto do modelo ativo é conhecida, tanto o limite mínimo quanto a reserva efetiva final são limitados para que a reserva não consuma todo o orçamento do prompt. Isso impede que modelos com contexto pequeno (por exemplo, um modelo local de 16 mil tokens) entrem em Compaction desde o primeiro token; sem uma janela de contexto conhecida, os orçamentos de reserva configurado e atual permanecem sem limite. Por que ter um limite mínimo: para deixar margem suficiente para a "manutenção" em vários turnos (como a liberação da memória, abaixo) antes que a Compaction se torne inevitável. Implementação: `applyAgentCompactionSettingsFromConfig()` em `src/agents/agent-settings.ts`, chamado nos caminhos de configuração de turno e Compaction do executor incorporado.

A execução manual de `/compact` respeita um `agents.defaults.compaction.keepRecentTokens` explícito e mantém o ponto de corte da cauda recente do runtime. Sem um orçamento de retenção explícito, a Compaction manual é um checkpoint rígido, e o contexto reconstruído começa a partir do novo resumo.

Quando `truncateAfterCompaction` está habilitado, o OpenClaw alterna a transcrição ativa para uma sucessora compactada após a Compaction. As ações de checkpoint de ramificação/restauração usam essa sucessora compactada; arquivos de checkpoint legados anteriores à Compaction permanecem legíveis enquanto forem referenciados.

## Provedores de Compaction conectáveis

Os plugins registram um provedor de Compaction por meio de `registerCompactionProvider()` na API de plugins. Quando `agents.defaults.compaction.provider` é definido como o ID de um provedor registrado, a extensão de proteção delega a sumarização a esse provedor em vez de usar o pipeline `summarizeInStages` integrado.

- `provider`: ID de um plugin de provedor de Compaction registrado. Deixe sem definir para usar a sumarização padrão pelo LLM. Definir um `provider` força `mode: "safeguard"`.
- Os provedores recebem as mesmas instruções de Compaction e a mesma política de preservação de identificadores que o caminho integrado, e a proteção ainda preserva o contexto dos turnos recentes e do sufixo de turnos divididos após a saída do provedor.
- A sumarização de proteção integrada redestila resumos anteriores com novas mensagens, em vez de preservar literalmente o resumo anterior completo.
- O modo de proteção habilita auditorias de qualidade do resumo por padrão; defina `qualityGuard.enabled: false` para ignorar o comportamento de repetir a tentativa quando a saída estiver malformada.
- Se o provedor falhar ou retornar um resultado vazio, o OpenClaw recorrerá automaticamente à sumarização integrada pelo LLM. Sinais de cancelamento/tempo limite acionados explicitamente pelo chamador são relançados, não suprimidos, para que o cancelamento seja sempre respeitado.

Fonte: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

## Superfícies visíveis ao usuário

- `/status` em qualquer sessão de chat
- `openclaw status` (CLI)
- `openclaw sessions` / `openclaw sessions --json`
- Logs do Gateway (`pnpm gateway:watch` ou `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Modo detalhado: `🧹 Auto-compaction complete` mais a contagem de compactações

## Manutenção silenciosa (`NO_REPLY`)

O OpenClaw oferece suporte a turnos "silenciosos" para tarefas em segundo plano nas quais o usuário não deve ver resultados intermediários.

- O assistente inicia sua saída com o token silencioso exato `NO_REPLY` / `no_reply` para indicar "não entregar uma resposta ao usuário". O OpenClaw remove/suprime isso na camada de entrega.
- A supressão exata do token silencioso não diferencia maiúsculas de minúsculas: `NO_REPLY` e `no_reply` são considerados válidos quando toda a carga útil consiste apenas no token silencioso.
- Desde `2026.1.10`, o OpenClaw também suprime a transmissão de rascunho/digitação quando um fragmento parcial começa com `NO_REPLY`, para que operações silenciosas não vazem saída parcial durante o turno.
- Isso se destina apenas a turnos realmente em segundo plano/sem entrega — não é um atalho para solicitações comuns do usuário que exigem ação.

## Liberação da memória antes da Compaction

Antes que a Compaction automática aconteça, o OpenClaw pode executar um turno agêntico silencioso que grava estado durável no disco (por exemplo, `memory/YYYY-MM-DD.md` no espaço de trabalho do agente), para que a Compaction não possa apagar contexto crítico. Ele monitora o uso do contexto da sessão e, quando este ultrapassa um limite flexível abaixo do limite da Compaction, envia uma diretiva silenciosa de "gravar memória agora" usando o token silencioso exato `NO_REPLY` / `no_reply`, para que o usuário não veja nada.

Configuração (`agents.defaults.compaction.memoryFlush`), referência completa em [/gateway/config-agents](/pt-BR/gateway/config-agents#agentsdefaultscompaction):

| Chave                       | Padrão           | Observações                                                                                                                              |
| --------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                   | `true`           |                                                                                                                                          |
| `model`                     | não definido     | substituição exata de provedor/modelo apenas para o turno de liberação, por exemplo `ollama/qwen3:8b`                                    |
| `softThresholdTokens`       | `4000`           | intervalo abaixo do limite da Compaction que aciona uma liberação                                                                        |
| `forceFlushTranscriptBytes` | não definido (desabilitado) | força uma liberação quando o arquivo de transcrição atinge esse tamanho em bytes (ou uma string como `"2mb"`), mesmo que os contadores de tokens estejam desatualizados; `0` desabilita |
| `prompt`                    | integrado        | mensagem do usuário para o turno de liberação                                                                                            |
| `systemPrompt`              | integrado        | prompt de sistema adicional anexado ao turno de liberação                                                                                |

Observações:

- O prompt/prompt de sistema padrão inclui uma dica `NO_REPLY` para suprimir a entrega.
- Quando `model` está definido, o turno de liberação usa esse modelo sem herdar a cadeia de fallback da sessão ativa, para que a manutenção somente local não recorra silenciosamente a um modelo de conversação pago em caso de falha.
- A liberação é executada uma vez por ciclo de Compaction (rastreada na linha da sessão).
- A liberação é executada apenas em sessões incorporadas do OpenClaw; backends da CLI e turnos de Heartbeat a ignoram.
- A liberação é ignorada quando o espaço de trabalho da sessão é somente leitura (`workspaceAccess: "ro"` ou `"none"`).
- Consulte [Memória](/pt-BR/concepts/memory) para ver o layout de arquivos do espaço de trabalho e os padrões de gravação.

O OpenClaw expõe um hook `session_before_compact` na API de extensões, mas a lógica de liberação acima reside no lado do Gateway (`src/auto-reply/reply/memory-flush.ts`, `src/auto-reply/reply/agent-runner-memory.ts`), não nesse hook.

## Lista de verificação para solução de problemas

- **Chave de sessão incorreta?** Comece por [/concepts/session](/pt-BR/concepts/session) e confirme o `sessionKey` em `/status`.
- **Incompatibilidade entre armazenamento e transcrição?** Confirme o host do Gateway e o caminho do armazenamento em `openclaw status`.
- **Excesso de compactações?** Verifique a janela de contexto do modelo (se for pequena demais, força compactações frequentes), `reserveTokens` (se for alto demais para a janela do modelo, causa uma Compaction antecipada) e o inchaço dos resultados de ferramentas (ajuste a poda da sessão).
- **Todos os prompts parecem exceder o limite em um modelo local pequeno?** Confirme se o provedor informa a janela de contexto correta do modelo. O OpenClaw só pode limitar a reserva efetiva quando essa janela é conhecida.
- **Turnos silenciosos vazando?** Confirme se a resposta começa com o token silencioso exato `NO_REPLY` (sem diferenciar maiúsculas de minúsculas) e se a build inclui a correção de supressão da transmissão (`2026.1.10`+).

## Relacionados

- [Gerenciamento de sessões](/pt-BR/concepts/session)
- [Poda de sessões](/pt-BR/concepts/session-pruning)
- [Mecanismo de contexto](/pt-BR/concepts/context-engine)
- [Referência de configuração do agente](/pt-BR/gateway/config-agents)
