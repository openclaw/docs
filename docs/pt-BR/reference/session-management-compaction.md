---
read_when:
    - Você precisa depurar IDs de sessão, eventos de transcrição ou campos de linhas de sessão
    - Você está alterando o comportamento da compactação automática ou adicionando tarefas de manutenção de "pré-compactação"
    - Você quer implementar liberações de memória ou turnos silenciosos do sistema
summary: 'Análise detalhada: armazenamento de sessões + transcrições, ciclo de vida e detalhes internos da Compaction (automática)'
title: Análise detalhada do gerenciamento de sessões
x-i18n:
    generated_at: "2026-07-12T15:38:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2f06b50dcece64a92c2b35a468910b2069622d14649ab24052a5a7956f9d41d1
    source_path: reference/session-management-compaction.md
    workflow: 16
---

Um único **processo do Gateway** controla o estado da sessão de ponta a ponta. As interfaces (aplicativo para macOS, interface web de controle, TUI) consultam o Gateway para obter listas de sessões e contagens de tokens. No modo remoto, os arquivos de sessão ficam no host remoto; portanto, verificar os arquivos locais do Mac não refletirá o que o Gateway está usando.

Primeiro, consulte a documentação de visão geral: [Gerenciamento de sessões](/pt-BR/concepts/session), [Compaction](/pt-BR/concepts/compaction), [Visão geral da memória](/pt-BR/concepts/memory), [Pesquisa na memória](/pt-BR/concepts/memory-search), [Limpeza de sessões](/pt-BR/concepts/session-pruning), [Higiene da transcrição](/pt-BR/reference/transcript-hygiene) e a referência completa de configuração em [Configuração do agente](/pt-BR/gateway/config-agents).

## Duas camadas de persistência

1. **Linhas de sessão (SQLite por agente)** - mapa de chave/valor `sessionKey -> SessionEntry`. Estado mutável de execução controlado pelo Gateway. Rastreia metadados: ID da sessão atual, última atividade, opções, contadores de tokens.
2. **Eventos de transcrição (SQLite por agente)** - somente acréscimo, estruturados em árvore (as entradas têm `id` + `parentId`). Armazena a conversa, as chamadas de ferramentas e os resumos de compactação; reconstrói o contexto do modelo para turnos futuros. Os pontos de verificação de compactação são metadados sobre a transcrição sucessora compactada — uma nova compactação não grava uma segunda cópia `.checkpoint.*.jsonl`.

Instalações mais antigas ainda podem ter arquivos `sessions.json` no diretório
`sessions/` do agente. Trate esses arquivos como entradas de migração de linhas
de sessão legadas ou como destinos explícitos de manutenção offline. A
inicialização do Gateway e o `openclaw doctor --fix` importam automaticamente
as linhas legadas ativas e o histórico de transcrições para o armazenamento
SQLite por agente. Execute `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` e depois siga a [sequência de migração do
Doctor](/pt-BR/cli/doctor#session-sqlite-migration) quando precisar de evidências
explícitas de inspeção ou validação. Se uma migração falhar após o arquivamento
dos artefatos de transcrição legados, use o modo de recuperação do Doctor
descrito nessa sequência. A recuperação usa manifestos de migração, restaura
somente os artefatos de suporte arquivados afetados, prepara um relatório
sanitizado de problema no GitHub quando solicitado e não faz com que a execução
ativa volte a ler arquivos JSONL.

Os leitores de histórico do Gateway evitam materializar toda a transcrição, a menos que a interface precise de acesso histórico arbitrário. O histórico da primeira página, o histórico de chat incorporado, a recuperação após reinicialização e as verificações de tokens/uso utilizam leituras limitadas do final dos dados no SQLite. As varreduras completas da transcrição passam pelo índice assíncrono de transcrições e são compartilhadas entre leitores simultâneos.

## Locais em disco

Por agente, no host do Gateway (resolvidos por `src/config/sessions.ts`):

- Armazenamento das linhas de sessão em execução: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Linhas de transcrição em execução: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Artefatos legados/arquivados de transcrição: `~/.openclaw/agents/<agentId>/sessions/`
- Entrada de migração de linhas legadas: `~/.openclaw/agents/<agentId>/sessions/sessions.json`

## Manutenção do armazenamento e controles de disco

`session.maintenance` controla a manutenção automática das linhas de sessão do SQLite, das linhas de transcrição do SQLite, dos artefatos de arquivo e dos arquivos auxiliares de trajetória:

| Chave                   | Padrão                | Observações                                                                                                                    |
| ----------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `mode`                  | `"enforce"`           | ou `"warn"` (somente relata, sem alteração)                                                                                    |
| `pruneAfter`            | `"30d"`               | limite de idade para entradas obsoletas                                                                                        |
| `maxEntries`            | `500`                 | limite de entradas de sessão                                                                                                   |
| `resetArchiveRetention` | manter (sem limite de idade) | limite de idade para arquivos de transcrição `*.reset.*`/`*.deleted.*`; uma duração habilita a exclusão                  |
| `maxDiskBytes`          | `2gb`                 | orçamento de disco por agente para sessões; `false` desabilita                                                                 |
| `highWaterBytes`        | 80% de `maxDiskBytes` | meta após a limpeza para respeitar o orçamento                                                                                  |

As transcrições arquivadas são mantidas por padrão e compactadas com zstd (`*.jsonl.<reason>.<timestamp>.zst`) quando a execução oferece suporte, portanto, excluir ou redefinir uma sessão nunca descarta silenciosamente o histórico da conversa. O orçamento de disco remove primeiro os arquivos mais antigos, antes de afetar as sessões ativas.

A aplicação ativa de `maxDiskBytes` no SQLite mede os bytes do JSON das linhas de sessão mais os bytes do JSON dos eventos de transcrição por sessão; a aplicação durante a manutenção offline legada mede os arquivos no diretório de sessões selecionado.

As sessões de sondagem de execução de modelo do Gateway (chaves correspondentes a `agent:*:explicit:model-run-<uuid>`) recebem uma retenção separada e fixa de `24h`. Essa limpeza é condicionada à pressão: ela só é executada quando a manutenção ou o limite de entradas de sessão é atingido e somente antes da etapa global de limpeza ou limitação de entradas obsoletas. Outras sessões explícitas não usam essa retenção.

Ordem de aplicação da limpeza do orçamento de disco (`mode: "enforce"`):

1. Remova primeiro os artefatos de transcrição arquivados mais antigos, os artefatos legados órfãos ou os artefatos de trajetória órfãos.
2. Se ainda estiver acima da meta, remova as entradas de sessão mais antigas e suas linhas de transcrição ou artefatos de trajetória.
3. Repita até que o uso seja igual ou inferior a `highWaterBytes`.

`mode: "warn"` relata possíveis remoções sem alterar o armazenamento nem os arquivos.

Execute a manutenção sob demanda:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

A manutenção preserva ponteiros duráveis para conversas externas, como sessões de grupo e sessões de chat com escopo de thread, mas entradas sintéticas de runtime (Cron, hooks, Heartbeat, ACP, subagentes) ainda podem ser removidas quando excedem o limite configurado de idade, quantidade ou uso de disco. Execuções isoladas de Cron usam um controle `cron.sessionRetention` separado, independente da retenção de sondagens de execução do modelo.

As gravações normais do Gateway passam pelo acessor de sessões, que serializa as mutações do SQLite por agente por meio do caminho de gravação do runtime. O código do runtime deve dar preferência aos auxiliares do acessor em `src/config/sessions/session-accessor.ts`; os auxiliares legados de `sessions.json` são ferramentas de migração e manutenção offline. Quando um Gateway está acessível, `openclaw sessions cleanup` e `openclaw agents delete` sem simulação delegam as mutações do armazenamento ao Gateway, para que a limpeza entre na mesma fila de gravação; `--store <path>` é o caminho explícito de reparo offline para um armazenamento legado selecionado e sempre permanece local (assim como `--dry-run`). A limpeza de `maxEntries` é realizada em lotes para armazenamentos com dimensões de produção, portanto um armazenamento pode exceder brevemente o limite configurado antes que a próxima limpeza de nível máximo o regrave para reduzi-lo. As leituras nunca removem nem limitam entradas durante a inicialização do Gateway — somente as gravações ou `openclaw sessions cleanup --enforce` fazem isso; este último também aplica o limite imediatamente e remove artefatos legados antigos e não referenciados de transcrições, checkpoints e trajetórias, mesmo sem um orçamento de disco configurado.

O OpenClaw não cria mais backups automáticos de rotação `sessions.json.bak.*` durante gravações do Gateway. A chave legada `session.maintenance.rotateBytes` é ignorada, e `openclaw doctor --fix` a remove de configurações mais antigas.

As alterações de transcrições usam a fila de gravação da sessão para o destino de transcrições SQLite:

| Configuração                         | Padrão    | Substituição por variável de ambiente             |
| ------------------------------------ | --------- | ------------------------------------------------ |
| `session.writeLock.acquireTimeoutMs` | `60000`   | `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS` |
| `session.writeLock.staleMs`          | `1800000` | `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`           |
| `session.writeLock.maxHoldMs`        | `300000`  | `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`        |

`acquireTimeoutMs` é o tempo durante o qual a espera por um bloqueio apresenta um erro de sessão ocupada antes de desistir; aumente-o somente quando trabalhos legítimos de preparação, limpeza, compaction ou espelhamento da transcrição permanecerem em contenção por mais tempo em máquinas lentas. `staleMs` determina quando um bloqueio existente pode ser recuperado por estar obsoleto. `maxHoldMs` é o limite de liberação do mecanismo de vigilância no processo.

### Rebaixamento após a migração para SQLite

Restaure os artefatos de transcrição legados arquivados antes de executar uma versão mais antiga do OpenClaw baseada em arquivos:

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

A migração mantém os arquivos `sessions.json` legados para fins de suporte e reversão, mas os arquivos JSONL de transcrição ativos que foram importados para o SQLite são renomeados e movidos para `session-sqlite-import-archive/`. Os runtimes mais antigos baseados em arquivos seguem os caminhos `sessionFile` em `sessions.json`, portanto, esses artefatos precisam ser restaurados antes da inicialização. A restauração usa manifestos de migração, move somente os artefatos arquivados registrados cujos caminhos originais estão ausentes e mantém o banco de dados SQLite para recuperação futura.

As sessões criadas após a migração para o SQLite são exclusivas do SQLite e não aparecerão em um
runtime mais antigo baseado em arquivos. Se você fizer upgrade novamente após um downgrade, execute outra vez a sequência de
inspeção e validação do Doctor para que o OpenClaw possa verificar os artefatos legados
restaurados antes da importação.

## Sessões Cron e logs de execução

Execuções Cron isoladas criam suas próprias entradas/transcrições de sessão com retenção dedicada:

- `cron.sessionRetention` (padrão `"24h"`) remove do armazenamento sessões antigas de execuções Cron isoladas; `false` desabilita essa remoção.
- `cron.runLog.keepLines` remove linhas antigas do histórico de execuções mantido no SQLite por tarefa Cron (padrão `2000`). `cron.runLog.maxBytes` é aceito somente para compatibilidade com logs de execução mais antigos baseados em arquivos.

Quando o Cron força a criação de uma nova sessão de execução isolada, ele sanitiza a entrada da sessão `cron:<jobId>` anterior antes de gravar a nova linha: mantém preferências seguras (configurações de pensamento/modo rápido/detalhamento/raciocínio, rótulos e nome de exibição) e substituições de modelo/autenticação selecionadas explicitamente pelo usuário, mas descarta o contexto ambiente da conversa (roteamento de canal/grupo, política de envio/fila, elevação, origem e vinculação de runtime ACP), para que uma nova execução isolada não possa herdar permissões obsoletas de entrega ou de runtime de uma execução anterior.

## Chaves de sessão (`sessionKey`)

Uma `sessionKey` identifica em qual agrupamento de conversa você está (roteamento + isolamento). Regras canônicas: [/concepts/session](/pt-BR/concepts/session).

| Padrão                         | Exemplo                                                     |
| ------------------------------ | ----------------------------------------------------------- |
| Chat principal/direto (por agente) | `agent:<agentId>:<mainKey>` (padrão `main`)             |
| Grupo                          | `agent:<agentId>:<channel>:group:<id>`                      |
| Sala/canal (Discord/Slack)     | `agent:<agentId>:<channel>:channel:<id>` ou `...:room:<id>` |
| Cron                           | `cron:<job.id>`                                             |
| Webhook                        | `hook:<uuid>` (a menos que seja substituído)                |

## IDs de sessão (`sessionId`)

Cada `sessionKey` aponta para um `sessionId` atual (a identidade da transcrição no SQLite que dá continuidade à conversa). A lógica de decisão fica em `initSessionState()`, em `src/auto-reply/reply/session.ts`.

- **Redefinição** (`/new`, `/reset`) cria um novo `sessionId` para essa `sessionKey`.
- **Redefinição diária** (por padrão, às 4:00 da manhã no horário local do host do Gateway) cria um novo `sessionId` na próxima mensagem após o limite de redefinição.
- **Expiração por inatividade** (`session.reset.idleMinutes` ou o legado `session.idleMinutes`) cria um novo `sessionId` quando uma mensagem chega após o período de inatividade. Se a redefinição diária e a expiração por inatividade estiverem configuradas, prevalece a que ocorrer primeiro.
- **Retomada após reconexão da interface de controle** preserva a sessão atualmente visível para um envio após a reconexão quando o Gateway recebe o `sessionId` correspondente de um cliente de interface do operador. Esse é um sinal de uso único; envios obsoletos comuns ainda criam um novo `sessionId`.
- **Eventos do sistema** (Heartbeat, ativações do Cron, notificações de execução, manutenção de registros do Gateway) podem alterar a linha da sessão, mas nunca estendem a validade da redefinição diária ou por inatividade. A transição de redefinição descarta os avisos de eventos do sistema enfileirados para a sessão anterior antes da criação do novo prompt.
- **Política de bifurcação da sessão pai** usa a ramificação ativa do OpenClaw ao criar uma bifurcação de thread ou subagente. Se essa ramificação for grande demais (acima de um limite interno fixo, atualmente 100K tokens), o OpenClaw inicia o filho com contexto isolado em vez de falhar ou herdar um histórico inutilizável. O dimensionamento é automático e não pode ser configurado; a configuração legada `session.parentForkMaxTokens` é removida por `openclaw doctor --fix`.
- **Bifurcações do operador**: `sessions.create { parentSessionKey, fork: true }` cria uma nova sessão cuja transcrição se ramifica a partir do estado atual da sessão pai (o mesmo mecanismo de bifurcação usado na criação de subagentes, incluindo o limite de tamanho acima). A bifurcação é recusada enquanto a sessão pai tem uma execução ativa, herda a seleção de modelo da sessão pai, a menos que uma seja fornecida explicitamente, e marca o filho como `forkedFromParent` com novos contadores de tokens.

## Esquema do armazenamento de sessões

O armazenamento em tempo de execução mantém valores `SessionEntry` no SQLite por agente. O tipo do valor é `SessionEntry` em `src/config/sessions.ts`. Campos principais (lista não exaustiva):

- `sessionId`: ID da transcrição atual usado para endereçar linhas de transcrição do SQLite
- `sessionStartedAt`: carimbo de data/hora de início do `sessionId` atual; a validade da redefinição diária usa esse valor. Linhas legadas podem derivá-lo do cabeçalho da sessão JSONL.
- `lastInteractionAt`: carimbo de data/hora da última interação real de usuário/canal; a validade da redefinição por inatividade usa esse valor para que eventos de Heartbeat, Cron e execução não mantenham as sessões ativas. Linhas legadas sem esse campo recorrem ao horário recuperado de início da sessão.
- `updatedAt`: carimbo de data/hora da última alteração na linha do armazenamento, usado para listagem, remoção e manutenção de registros — não é a fonte autoritativa para a validade diária ou por inatividade.
- `archivedAt`: carimbo de data/hora opcional de arquivamento. Sessões arquivadas permanecem no armazenamento com sua transcrição intacta e são excluídas das listagens ativas normais.
- `pinnedAt`: carimbo de data/hora opcional de fixação. Sessões ativas fixadas são ordenadas antes das não fixadas; arquivar uma sessão remove sua fixação.
- Interoperabilidade com threads do Codex: ambos os campos seguem o formato de gerenciamento de threads do Codex — os booleanos `archived`/`pinned` transmitidos são sempre derivados do carimbo de data/hora e registrados no lado do servidor, de acordo com a semântica de `threads.archived_at` do Codex e a serialização camelCase. Os carimbos de data/hora do OpenClaw usam milissegundos desde a época, enquanto o Codex usa segundos desde a época; portanto, as pontes fazem a conversão na interface do Plugin `codex`. O Codex ainda não tem uma API de fixação (somente `thread/archive`/`thread/unarchive`); o estado de fixação permanece no lado do OpenClaw até que uma seja disponibilizada, quando então o formato correspondente permitirá que sessões vinculadas façam a ida e volta do estado de fixação mecanicamente.
- A supervisão do Codex lista apenas threads nativas não arquivadas. Uma thread local do Gateway com atividade desconhecida `idle` ou `notLoaded` pode ser arquivada por meio de `thread/archive` nativo somente depois que o operador confirmar explicitamente que nenhum outro processo do Codex é seu proprietário; primeiro, o Plugin realiza uma nova leitura de status local ao processo e, em seguida, a thread desaparece do catálogo. Essa leitura não pode provar que outro processo do App Server não está usando a thread. O OpenClaw se recusa a arquivar linhas ativas e com erro, e o arquivamento de nó pareado fica indisponível até que a ponte do Node possa controlar todo o ciclo de vida transmitido da thread. Desarquivar em um cliente nativo do Codex torna a thread apta a aparecer novamente.
- `lastReadAt` / `markedUnreadAt`: carimbos de data/hora do estado de leitura registrados no lado do servidor por `sessions.patch { unread }` — `unread: false` registra uma leitura (define `lastReadAt` e limpa `markedUnreadAt`); `unread: true` marca a sessão como não lida até a próxima leitura. As linhas de sessão expõem um booleano `unread` derivado: explicitamente marcada como não lida ou lida antes da atividade mais recente. Sessões nunca marcadas como lidas permanecem com `unread: false`, para que instalações existentes não sejam sinalizadas após uma atualização.
- `lastActivityAt`: carimbo de data/hora da última execução concluída do agente que conta como atividade relevante para o estado de não lida (execuções de usuário, canal e Cron). Turnos de Heartbeat e eventos internos, além de alterações de metadados, não o atualizam; `updatedAt` não é um sinal de atividade.
- `sessionFile`: marcador legado mantido para compatibilidade de migração/arquivamento; o tempo de execução ativo usa a identidade do SQLite
- `chatType`: `direct | group | room`
- `provider`, `subject`, `room`, `space`, `displayName`: metadados de identificação de grupo/canal
- Alternâncias: `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`, `sendPolicy` (substituição por sessão)
- Seleção de modelo: `providerOverride`, `modelOverride`, `authProfileOverride`
- Contadores de tokens (melhor esforço/dependentes do provedor): `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: número de vezes que a compactação automática foi concluída para esta chave de sessão
- `memoryFlushAt` / `memoryFlushCompactionCount`: carimbo de data/hora e contagem de compactações da última liberação de memória anterior à compactação

O Gateway é a autoridade: ele pode reescrever ou reidratar entradas à medida que as sessões
são executadas. Para instalações legadas baseadas em arquivos, faça a migração com
`openclaw doctor --session-sqlite import --session-sqlite-all-agents` em vez de
editar `sessions.json` e esperar que o tempo de execução continue lendo esse arquivo.

## Estrutura dos eventos da transcrição

As transcrições são gerenciadas pelo acessor de sessões do OpenClaw e expostas ao código de tempo de execução por meio de auxiliares baseados em identidade. O fluxo de eventos permite somente acréscimos:

- Primeira entrada: cabeçalho da sessão — `type: "session"`, `id`, `cwd`, `timestamp`, `parentSession` opcional.
- Em seguida: entradas com `id` + `parentId` (estrutura em árvore).

Tipos de entrada relevantes:

- `message`: mensagens de usuário/assistente/toolResult
- `custom_message`: mensagem injetada por extensão que _entra_ no contexto do modelo (renderizada na TUI quando `display: true`, completamente oculta quando `display: false`)
- `custom`: estado da extensão que _não entra_ no contexto do modelo (para persistir o estado da extensão entre recarregamentos)
- `compaction`: resumo persistido da compactação com `firstKeptEntryId` e `tokensBefore`
- `branch_summary`: resumo persistido ao navegar por uma ramificação da árvore

O OpenClaw intencionalmente não "corrige" as transcrições; o Gateway usa `SessionManager` para lê-las e gravá-las.

## Janelas de contexto versus tokens monitorados

Dois conceitos diferentes:

1. **Janela de contexto do modelo**: limite rígido por modelo (tokens visíveis para o modelo). Vem do catálogo de modelos e pode ser substituído por meio da configuração.
2. **Contadores do armazenamento de sessões**: estatísticas contínuas gravadas na linha da sessão (usadas por `/status` e painéis). `contextTokens` é um valor de estimativa/relatório do tempo de execução — não o considere uma garantia estrita.

Mais sobre limites: [/reference/token-use](/pt-BR/reference/token-use).

## Compaction: o que é

Compaction resume partes mais antigas da conversa em uma entrada `compaction` persistida na transcrição e mantém as mensagens recentes intactas. Após a Compaction, os turnos futuros veem o resumo da Compaction mais as mensagens posteriores a `firstKeptEntryId`. A Compaction é **persistente**, diferentemente da poda de sessão — consulte [/concepts/session-pruning](/pt-BR/concepts/session-pruning).

A reinjeção de seções do AGENTS.md após a Compaction é opcional por meio de `agents.defaults.compaction.postCompactionSections`; quando não definido ou definido como `[]`, o OpenClaw não acrescenta trechos do AGENTS.md ao resumo da Compaction.

### Limites dos blocos e pareamento de ferramentas

Ao dividir uma transcrição longa em blocos de Compaction, o OpenClaw mantém as chamadas de ferramenta do assistente pareadas com suas entradas `toolResult` correspondentes:

- Se a divisão por proporção de tokens cair entre uma chamada de ferramenta e seu resultado, o OpenClaw deslocará o limite para a mensagem de chamada de ferramenta do assistente, em vez de separar o par.
- Se um bloco final de resultados de ferramentas fizer com que o bloco ultrapasse o tamanho-alvo, o OpenClaw preservará esse bloco de ferramentas pendente e manterá intacta a parte final não resumida.
- Blocos de chamadas de ferramentas abortadas ou com erro não mantêm uma divisão pendente em aberto.

## Quando ocorre a Compaction automática

Há dois gatilhos no agente OpenClaw incorporado:

1. **Recuperação de estouro**: o modelo retorna um erro de estouro de contexto (`request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model`, `ollama error: context length exceeded` e outras variantes específicas de provedores) — executa a Compaction e tenta novamente. Quando o provedor informa a contagem de tokens da tentativa, o OpenClaw encaminha essa contagem observada para a Compaction de recuperação de estouro; se o provedor confirmar o estouro, mas não expuser uma contagem analisável, o OpenClaw passará uma contagem sintética minimamente acima do orçamento aos mecanismos de Compaction e aos diagnósticos. Se a recuperação de estouro ainda falhar, o OpenClaw exibirá orientações explícitas e preservará o mapeamento da sessão atual, em vez de alternar silenciosamente para um novo ID de sessão — tente enviar a mensagem novamente, execute `/compact` ou execute `/new`.
2. **Manutenção por limite**: após um turno bem-sucedido, quando `contextTokens > contextWindow - reserveTokens`, em que `contextWindow` é a janela de contexto do modelo e `reserveTokens` é a margem reservada para prompts mais a próxima saída do modelo.

Duas proteções adicionais são executadas fora desses dois gatilhos:

- **Compaction local de pré-verificação**: defina `agents.defaults.compaction.maxActiveTranscriptBytes` (em bytes ou como uma string, como `"20mb"`) para acionar a Compaction local antes de abrir a próxima execução quando a transcrição ativa atingir esse tamanho. Essa é uma proteção de tamanho para o custo de reabertura local, não para arquivamento bruto — a Compaction semântica normal ainda é executada e requer `truncateAfterCompaction` para que o resumo compactado se torne uma nova transcrição sucessora.
- **Pré-verificação no meio do turno**: defina `agents.defaults.compaction.midTurnPrecheck.enabled: true` (o padrão é `false`) para adicionar uma proteção ao ciclo de ferramentas. Depois que o resultado de uma ferramenta é acrescentado e antes da próxima chamada ao modelo, o OpenClaw estima a pressão sobre o prompt usando a mesma lógica de orçamento de pré-verificação usada no início do turno. Se o contexto não couber mais, a proteção não executará a Compaction no próprio fluxo — ela emitirá um sinal estruturado de pré-verificação no meio do turno, interromperá o envio do prompt atual e permitirá que o ciclo externo de execução use o caminho de recuperação existente (truncar resultados de ferramentas grandes demais quando isso for suficiente ou acionar o modo de Compaction configurado e tentar novamente). Funciona com os modos de Compaction `default` e `safeguard`, incluindo a Compaction de proteção apoiada pelo provedor. É independente de `maxActiveTranscriptBytes`: a proteção por tamanho em bytes é executada antes da abertura de um turno; a pré-verificação no meio do turno é executada posteriormente, depois que novos resultados de ferramentas são acrescentados.

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

O OpenClaw também impõe um limite mínimo de segurança para execuções incorporadas: se `compaction.reserveTokens` estiver abaixo de `reserveTokensFloor` (padrão `20000`), o OpenClaw o eleva. Defina `agents.defaults.compaction.reserveTokensFloor: 0` para desativar o limite mínimo. Quando a janela de contexto do modelo ativo é conhecida, tanto o limite mínimo quanto a reserva efetiva final são limitados para que a reserva não consuma todo o orçamento do prompt. Isso impede que modelos com contexto pequeno (por exemplo, um modelo local de 16K tokens) entrem em Compaction desde o primeiro token; sem uma janela de contexto conhecida, os orçamentos de reserva configurado e atual permanecem sem limite. Por que ter um limite mínimo: para deixar margem suficiente para a "manutenção" em vários turnos (como a descarga de memória, abaixo) antes que a Compaction se torne inevitável. Implementação: `applyAgentCompactionSettingsFromConfig()` em `src/agents/agent-settings.ts`, chamada pelos caminhos de configuração de turno e Compaction do executor incorporado.

O `/compact` manual respeita um `agents.defaults.compaction.keepRecentTokens` explícito e mantém o ponto de corte da cauda recente do runtime. Sem um orçamento de retenção explícito, a Compaction manual é um checkpoint rígido, e o contexto reconstruído começa a partir do novo resumo.

Quando `truncateAfterCompaction` está habilitado, o OpenClaw alterna a transcrição ativa para uma sucessora compactada após a Compaction. As ações de checkpoint de ramificação/restauração usam essa sucessora compactada; arquivos legados de checkpoint anteriores à Compaction permanecem legíveis enquanto forem referenciados.

## Provedores de Compaction conectáveis

Os Plugins registram um provedor de Compaction por meio de `registerCompactionProvider()` na API de Plugin. Quando `agents.defaults.compaction.provider` é definido como o id de um provedor registrado, a extensão de proteção delega o resumo a esse provedor em vez de usar o pipeline integrado `summarizeInStages`.

- `provider`: id de um Plugin de provedor de Compaction registrado. Deixe sem definir para usar o resumo padrão por LLM. Definir um `provider` força `mode: "safeguard"`.
- Os provedores recebem as mesmas instruções de Compaction e a mesma política de preservação de identificadores do caminho integrado, e a proteção ainda preserva o contexto de sufixo de turnos recentes e turnos divididos após a saída do provedor.
- O resumo de proteção integrado redestila resumos anteriores com novas mensagens em vez de preservar literalmente todo o resumo anterior.
- O modo de proteção habilita por padrão auditorias de qualidade do resumo; defina `qualityGuard.enabled: false` para ignorar o comportamento de nova tentativa em caso de saída malformada.
- Se o provedor falhar ou retornar um resultado vazio, o OpenClaw recorre automaticamente ao resumo integrado por LLM. Sinais de interrupção/tempo limite acionados explicitamente pelo chamador são relançados, não suprimidos, para que o cancelamento seja sempre respeitado.

Fonte: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

## Superfícies visíveis ao usuário

- `/status` em qualquer sessão de chat
- `openclaw status` (CLI)
- `openclaw sessions` / `openclaw sessions --json`
- Logs do Gateway (`pnpm gateway:watch` ou `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Modo detalhado: `🧹 Auto-compaction complete` mais a contagem de Compaction

## Manutenção silenciosa (`NO_REPLY`)

O OpenClaw oferece suporte a turnos "silenciosos" para tarefas em segundo plano nas quais o usuário não deve ver a saída intermediária.

- O assistente inicia sua saída com o token silencioso exato `NO_REPLY` / `no_reply` para indicar "não entregar uma resposta ao usuário". O OpenClaw remove/suprime isso na camada de entrega.
- A supressão do token silencioso exato não diferencia maiúsculas de minúsculas: `NO_REPLY` e `no_reply` são ambos reconhecidos quando todo o conteúdo consiste apenas no token silencioso.
- Desde `2026.1.10`, o OpenClaw também suprime o streaming de rascunho/digitação quando um trecho parcial começa com `NO_REPLY`, para que operações silenciosas não exponham saída parcial no meio do turno.
- Isso se destina apenas a turnos reais em segundo plano/sem entrega — não é um atalho para solicitações comuns do usuário que exigem ação.

## Descarga de memória antes da Compaction

Antes que a Compaction automática ocorra, o OpenClaw pode executar um turno agêntico silencioso que grava estado durável em disco (por exemplo, `memory/YYYY-MM-DD.md` no workspace do agente), para que a Compaction não apague contexto crítico. Ele monitora o uso do contexto da sessão e, quando este ultrapassa um limiar flexível abaixo do limiar de Compaction, envia silenciosamente uma diretiva "gravar memória agora" usando o token silencioso exato `NO_REPLY` / `no_reply`, para que o usuário não veja nada.

Configuração (`agents.defaults.compaction.memoryFlush`), referência completa em [/gateway/config-agents](/pt-BR/gateway/config-agents#agentsdefaultscompaction):

| Chave                       | Padrão              | Observações                                                                                                                                                                      |
| --------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                   | `true`              |                                                                                                                                                                                  |
| `model`                     | não definido        | substituição exata de provedor/modelo apenas para o turno de descarga, por exemplo `ollama/qwen3:8b`                                                                             |
| `softThresholdTokens`       | `4000`              | intervalo abaixo do limiar de Compaction que aciona uma descarga                                                                                                                 |
| `forceFlushTranscriptBytes` | não definido (desabilitado) | força uma descarga quando o arquivo de transcrição atinge esse tamanho em bytes (ou uma string como `"2mb"`), mesmo que os contadores de tokens estejam desatualizados; `0` desabilita |
| `prompt`                    | integrado           | mensagem do usuário para o turno de descarga                                                                                                                                    |
| `systemPrompt`              | integrado           | prompt de sistema adicional anexado ao turno de descarga                                                                                                                        |

Observações:

- O prompt/prompt de sistema padrão inclui uma indicação `NO_REPLY` para suprimir a entrega.
- Quando `model` está definido, o turno de descarga usa esse modelo sem herdar a cadeia de fallback da sessão ativa, para que a manutenção exclusivamente local não recorra silenciosamente a um modelo de conversa pago em caso de falha.
- A descarga é executada uma vez por ciclo de Compaction (rastreada na linha da sessão).
- A descarga é executada apenas para sessões incorporadas do OpenClaw; backends de CLI e turnos de Heartbeat a ignoram.
- A descarga é ignorada quando o workspace da sessão é somente leitura (`workspaceAccess: "ro"` ou `"none"`).
- Consulte [Memória](/pt-BR/concepts/memory) para ver o layout de arquivos do workspace e os padrões de gravação.

O OpenClaw expõe um hook `session_before_compact` na API de extensão, mas a lógica de descarga acima reside no lado do Gateway (`src/auto-reply/reply/memory-flush.ts`, `src/auto-reply/reply/agent-runner-memory.ts`), não nesse hook.

## Lista de verificação para solução de problemas

- **Chave da sessão incorreta?** Comece por [/concepts/session](/pt-BR/concepts/session) e confirme o `sessionKey` em `/status`.
- **Incompatibilidade entre armazenamento e transcrição?** Confirme o host do Gateway e o caminho do armazenamento em `openclaw status`.
- **Excesso de Compactações?** Verifique a janela de contexto do modelo (uma janela muito pequena força Compactações frequentes), `reserveTokens` (um valor muito alto para a janela do modelo causa Compactação antecipada) e o excesso de resultados de ferramentas (ajuste a poda da sessão).
- **Todos os prompts parecem exceder o limite em um modelo local pequeno?** Confirme se o provedor informa a janela de contexto correta do modelo. O OpenClaw só pode limitar a reserva efetiva quando essa janela é conhecida.
- **Turnos silenciosos expondo conteúdo?** Confirme se a resposta começa com o token silencioso exato `NO_REPLY` (sem diferenciação entre maiúsculas e minúsculas) e se você está usando uma compilação que inclui a correção de supressão de streaming (`2026.1.10`+).

## Relacionados

- [Gerenciamento de sessões](/pt-BR/concepts/session)
- [Poda de sessões](/pt-BR/concepts/session-pruning)
- [Mecanismo de contexto](/pt-BR/concepts/context-engine)
- [Referência de configuração do agente](/pt-BR/gateway/config-agents)
