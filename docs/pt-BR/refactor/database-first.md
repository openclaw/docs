---
read_when:
    - Mover dados de tempo de execução do OpenClaw, cache, transcrições, estado de tarefas ou arquivos temporários para o SQLite
    - Projetando migrações do doctor a partir de arquivos JSON ou JSONL
    - Alteração do comportamento de backup, restauração, VFS ou armazenamento de worker
    - Remoção de bloqueios de sessão, pruning, truncamento ou caminhos de compatibilidade JSON
summary: Plano de migração para tornar o SQLite a camada primária de estado durável e cache, mantendo a configuração baseada em arquivo
title: Refatoração de estado com banco de dados em primeiro lugar
x-i18n:
    generated_at: "2026-07-01T20:15:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 566e6aacfaa6aff0db2d1d143ef313d0ce97b82428152bc8940856e317a149ff
    source_path: refactor/database-first.md
    workflow: 16
---

# Refatoração de estado com banco de dados em primeiro lugar

## Decisão

Use um layout SQLite de dois níveis:

- Banco de dados global: `~/.openclaw/state/openclaw.sqlite`
- Banco de dados do agente: um banco de dados SQLite por agente para workspace,
  transcrição, VFS, artefato e estado de runtime grande pertencentes ao agente
- A configuração continua baseada em arquivo: `openclaw.json` permanece fora do
  banco de dados. Perfis de autenticação de runtime passam para SQLite; arquivos
  de credenciais de provedores externos ou da CLI continuam gerenciados pelo
  proprietário fora do banco de dados do OpenClaw.

O banco de dados global é o banco de dados do plano de controle. Ele é
responsável pela descoberta de agentes, estado compartilhado do Gateway,
pareamento, estado de dispositivo/nó, registros de tarefas e fluxos, estado de
Plugin, estado de runtime do agendador, metadados de backup e estado de
migração.

O banco de dados do agente é o banco de dados do plano de dados. Ele é
responsável pelos metadados de sessão do agente, fluxo de eventos da
transcrição, workspace VFS ou namespace de rascunho, artefatos de ferramenta,
artefatos de execução e dados de cache locais do agente pesquisáveis/indexáveis.

Isso fornece uma visão global durável sem forçar grandes workspaces de agente,
transcrições e dados binários de rascunho para a faixa de gravação compartilhada
do Gateway.

## Contrato rígido

Esta migração tem uma única forma canônica de runtime:

- Linhas de sessão persistem apenas metadados de sessão. Elas não devem persistir
  `transcriptLocator`, caminhos de arquivo de transcrição, caminhos JSONL irmãos,
  caminhos de lock, metadados de poda ou ponteiros de compatibilidade da era dos
  arquivos.
- A identidade da transcrição é sempre a identidade SQLite: `{agentId, sessionId}`
  mais metadados opcionais de tópico quando o protocolo precisar deles.
- `sqlite-transcript://...` não é uma identidade de runtime nem de protocolo.
  Código novo não deve derivar, persistir, passar, analisar ou migrar
  localizadores de transcrição. Runtime e testes não devem conter
  pseudo-localizadores; a documentação pode mencionar a string apenas para
  proibi-la.
- `sessions.json` legado, JSONL de transcrição, `.jsonl.lock`, poda, truncamento
  e lógica antiga de caminho de sessão pertencem apenas ao caminho de
  migração/importação do doctor.
- Aliases legados de configuração de sessão pertencem apenas à migração do
  doctor. O runtime não interpreta `session.idleMinutes`, `session.resetByType.dm`
  ou aliases de sessão principal `agent:main:*` entre agentes para outro agente
  configurado.
- A identidade de roteamento de sessão é estado relacional tipado. Caminhos
  quentes de runtime e UI devem ler `sessions.session_scope`,
  `sessions.account_id`, `sessions.primary_conversation_id`, `conversations` e
  `session_conversations`; eles não devem analisar `session_key` nem garimpar
  `session_entries.entry_json` em busca de identidade de provedor, exceto como
  sombra de compatibilidade enquanto sites de chamada antigos estão sendo
  removidos.
- Marcadores de mensagem direta no nível do canal, como `dm` versus `direct`, são
  vocabulário de roteamento, não localizadores de transcrição nem identificadores
  de compatibilidade de armazenamento em arquivos.
- Configuração legada de handler de hook pertence apenas a superfícies de aviso/
  migração do doctor. O runtime não deve carregar `hooks.internal.handlers`;
  hooks passam apenas por diretórios de hook descobertos e metadados `HOOK.md`.
- Inicialização do runtime, caminhos quentes de resposta, Compaction, reset,
  recuperação, diagnósticos, TTS, hooks de memória, subagentes, roteamento de
  comandos de Plugin, limites de protocolo e hooks devem passar
  `{agentId, sessionId}` pelo runtime.
- Testes devem semear e afirmar linhas de transcrição SQLite por meio de
  `{agentId, sessionId}`. Testes que apenas comprovam encaminhamento de caminho
  JSONL, preservação de localizador fornecido pelo chamador ou compatibilidade
  com arquivo de transcrição devem ser removidos, a menos que cubram importação
  do doctor, materialização de suporte/debug que não é de sessão ou forma de
  protocolo.
- `runEmbeddedPiAgent(...)`, execuções de worker preparadas e a tentativa
  incorporada interna não devem aceitar localizadores de transcrição. Eles abrem
  o gerenciador de transcrição SQLite por `{agentId, sessionId}` e passam esse
  gerenciador para a sessão de agente compatível com PI internalizada, para que
  chamadores obsoletos não consigam fazer o runner gravar transcrições
  JSON/JSONL.
- Diagnósticos do runner devem armazenar registros de rastreamento de runtime/
  cache/payload em SQLite. Diagnósticos de runtime não devem expor opções de
  substituição de arquivo JSONL nem helpers genéricos de exportação de
  transcrição JSONL; exportações voltadas ao usuário podem materializar artefatos
  explícitos a partir de linhas do banco de dados sem realimentar nomes de
  arquivo no runtime.
- Logging de stream bruto usa `OPENCLAW_RAW_STREAM=1` mais linhas de diagnóstico
  SQLite. O contrato antigo do logger de arquivo pi-mono `PI_RAW_STREAM`,
  `PI_RAW_STREAM_PATH` e `raw-openai-completions.jsonl` não faz parte do runtime
  nem dos testes do OpenClaw.
- A indexação de memória QMD não deve exportar transcrições SQLite para arquivos
  markdown. QMD indexa apenas arquivos de memória configurados; a busca em
  transcrições de sessão continua baseada em SQLite.
- O subcaminho do SDK QMD é apenas para QMD em código novo. Helpers de indexação
  de transcrição de sessão SQLite vivem em
  `memory-core-host-engine-session-transcripts`; qualquer reexportação por QMD é
  apenas compatibilidade e não deve ser usada por código de runtime.
- Índices de memória integrados vivem no banco de dados do agente proprietário.
  A configuração de runtime e contratos resolvidos de runtime não devem expor
  `memorySearch.store.path`; o doctor remove essa chave de configuração legada e
  o código atual passa o `databasePath` do agente internamente.

O trabalho de implementação deve continuar removendo código até que estas
declarações sejam verdadeiras sem exceções fora dos limites de doctor/importação/
exportação/debug.

## Estado desejado e progresso

### Objetivo rígido

- Um banco de dados SQLite global é responsável pelo estado do plano de controle:
  `state/openclaw.sqlite`.
- Um banco de dados SQLite por agente é responsável pelo estado do plano de dados:
  `agents/<agentId>/agent/openclaw-agent.sqlite`.
- A configuração continua baseada em arquivo. `openclaw.json` não faz parte
  desta refatoração de banco de dados.
- Arquivos legados são apenas entradas de migração do doctor.
- O runtime nunca grava nem lê JSONL de sessão ou transcrição como estado ativo.

### Estados desejados

- `not-started`: código de runtime da era dos arquivos ainda grava estado ativo.
- `migrating`: código de doctor/importação consegue mover dados de arquivo para
  SQLite.
- `dual-read`: ponte temporária lê tanto SQLite quanto arquivos legados. Este
  estado é proibido para esta refatoração, a menos que seja documentado
  explicitamente como exclusivo do doctor.
- `sqlite-runtime`: runtime lê e grava apenas SQLite.
- `clean`: APIs e testes de runtime legados são removidos, e a proteção impede
  regressões.
- `done`: docs, testes, backup, migração do doctor e verificações alteradas
  comprovam o estado limpo.

### Estado atual

- Sessões: `clean` para runtime. Linhas de sessão vivem no banco de dados por
  agente, APIs de runtime usam `{agentId, sessionId}` ou `{agentId, sessionKey}`,
  e `sessions.json` é entrada legada apenas do doctor.
- Transcrições: `clean` para runtime. Eventos, identidades, snapshots e eventos
  de runtime de trajetória de transcrição vivem no banco de dados por agente. O
  runtime não aceita mais localizadores de transcrição nem caminhos de
  transcrição JSONL.
- Runner PI incorporado: `clean`. Execuções PI incorporadas, workers preparados,
  Compaction e loops de nova tentativa usam escopo de sessão SQLite e rejeitam
  identificadores de transcrição obsoletos.
- Cron: `clean` para runtime. Runtime usa `cron_jobs` e `cron_run_logs`; testes
  de runtime usam nomenclatura SQLite `storeKey`, e caminhos Cron da era dos
  arquivos permanecem apenas em testes de migração legada do doctor.
- Registro de tarefas: `clean`. Linhas de runtime de tarefa e Task Flow vivem em
  `state/openclaw.sqlite`; importadores SQLite auxiliares não lançados foram
  removidos.
- Estado de Plugin: `clean`. Linhas de estado/blob de Plugin vivem no banco de
  dados global compartilhado; helpers antigos de SQLite auxiliar de estado de
  Plugin são bloqueados.
- Memória: `sqlite-runtime` para memória integrada e indexação de transcrição de
  sessão. Tabelas de índice de memória vivem no banco de dados por agente, estado
  de memória de Plugin usa linhas compartilhadas de estado de Plugin, e arquivos
  de memória legados são entradas de migração do doctor ou conteúdo de workspace
  do usuário.
- Backup: `sqlite-runtime`. Estágios de backup compactam snapshots SQLite,
  omitem auxiliares WAL/SHM ativos, verificam a integridade SQLite e registram
  execuções de backup no banco de dados global.
- Migração do doctor: `migrating`, intencionalmente. O doctor importa JSON,
  JSONL e armazenamentos auxiliares aposentados legados para SQLite, registra
  execuções/fontes de migração e remove fontes bem-sucedidas.
- Scripts E2E: `clean` para cobertura de runtime. A semeadura Docker MCP grava
  linhas SQLite. O script Docker de contexto de runtime cria JSONL legado apenas
  dentro da semente de migração do doctor e nomeia explicitamente o caminho do
  índice de sessão legado.

### Trabalho restante

- [x] Renomear variáveis de store de testes de runtime do Cron para longe de
      `storePath`, a menos que sejam entradas legadas do doctor.
      Arquivos: `src/cron/service.test-harness.ts`,
      `src/cron/service.runs-one-shot-main-job-disables-it.test.ts`,
      `src/cron/service/timer.regression.test.ts`,
      `src/cron/service/ops.test.ts`, `src/cron/service/store.test.ts`,
      `src/cron/service.heartbeat-ok-summary-suppressed.test.ts`,
      `src/cron/service.main-job-passes-heartbeat-target-last.test.ts`,
      `src/cron/store.test.ts`.
      Prova: `pnpm check:database-first-legacy-stores`; `rg -n 'storePath' src/cron --glob '!**/commands/doctor/**'`.
- [x] Remover ou renomear mocks obsoletos de teste de exportação da era dos
      arquivos.
      Arquivo: `src/auto-reply/reply/commands-export-test-mocks.ts`.
      Prova: `rg -n 'resolveSessionFilePath|sessionFile|storePath|transcriptLocator' src/auto-reply/reply`.
- [x] Tornar a semente JSONL legada de contexto de runtime Docker obviamente
      exclusiva do doctor.
      Arquivo: `scripts/e2e/session-runtime-context-docker-client.ts`.
      Prova: `rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts` mostra apenas
      `seedBrokenLegacySessionForDoctorMigration`.
- [x] Manter tipos gerados pelo Kysely alinhados após qualquer alteração de
      schema.
      Arquivos: `src/state/openclaw-state-schema.sql`,
      `src/state/openclaw-agent-schema.sql`,
      `src/state/*generated*`.
      Prova: nenhuma alteração de schema nesta passagem; `pnpm db:kysely:check`;
      `pnpm lint:kysely`.
- [x] Reexecutar testes focados para stores, comandos e scripts tocados.
      Prova: `pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-trajectory.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`; `git diff --check`.
- [x] Antes de declarar `done`, executar o gate de alterações ou prova ampla
      remota.
      Prova: `pnpm check:changed --timed -- <changed extension paths>` passou na
      execução Hetzner Crabbox `run_3f1cabf6b25c` após configuração temporária de
      Node 24/pnpm e roteamento explícito de caminho para o workspace sincronizado
      sem `.git`.

### Não regredir

- Nenhum localizador de transcrição.
- Nenhum arquivo de sessão ativo.
- Nenhum fixture de teste JSONL falso, exceto testes de migração legada do
  doctor.
- Nenhum acesso SQLite bruto onde Kysely é esperado.
- Nenhuma nova migração de DB legado. Este layout não foi lançado; mantenha a
  versão de schema em `1`, a menos que haja um motivo forte.

## Suposições de leitura de código

Nenhuma decisão de produto de acompanhamento está bloqueando este plano. A
implementação deve prosseguir com estas suposições:

- Use `node:sqlite` diretamente e exija o tempo de execução Node 22+ para este caminho de
  armazenamento.
- Mantenha exatamente um arquivo de configuração normal. Não mova configurações, manifestos de
  Plugin nem workspaces Git para SQLite nesta refatoração.
- Arquivos de compatibilidade de tempo de execução não são necessários. Arquivos JSON e JSONL legados são
  apenas entradas de migração. Os arquivos auxiliares SQLite locais da branch nunca foram lançados e são
  excluídos em vez de importados.
- `openclaw doctor --fix` é responsável pela etapa de migração de arquivos legados para o banco de dados.
  A inicialização do tempo de execução e `openclaw migrate` não devem carregar caminhos legados de
  atualização de banco de dados do OpenClaw.
- A compatibilidade de credenciais segue a mesma regra: as credenciais de tempo de execução ficam em
  SQLite. Arquivos antigos `auth-profiles.json`, `auth.json` por agente e arquivos compartilhados
  `credentials/oauth.json` são entradas de migração do doctor e, em seguida, removidos
  após a importação.
- O estado gerado do catálogo de modelos tem suporte de banco de dados. O código de tempo de execução não deve gravar
  `agents/<agentId>/agent/models.json`; arquivos `models.json` existentes são entradas legadas
  do doctor e são removidos após a importação para `agent_model_catalogs`.
- O tempo de execução não deve migrar, normalizar nem intermediar localizadores de transcrição. A identidade
  ativa da transcrição é `{agentId, sessionId}` em SQLite. Caminhos de arquivo são
  apenas entradas legadas do doctor, e `sqlite-transcript://...` deve desaparecer das
  superfícies de tempo de execução, protocolo, hook e Plugin em vez de ser tratado como um
  identificador de limite.
- Leituras de transcrições SQLite em tempo de execução não executam migrações antigas de formato de entrada JSONL nem
  reescrevem transcrições inteiras para compatibilidade. A normalização de entradas legadas permanece em
  utilitários explícitos de doctor/importação. O doctor normaliza arquivos legados de transcrição JSONL
  antes de inserir linhas SQLite; as linhas atuais de tempo de execução já são
  gravadas no esquema atual de transcrição. A exportação de trajetória/sessão
  lê essas linhas como estão e não deve executar migrações legadas no momento da exportação.
- Auxiliares legados de análise/migração de transcrições JSONL são apenas do doctor. O código de formato
  de transcrição em tempo de execução cria apenas o contexto atual de transcrição SQLite; o doctor
  é responsável por atualizações de entradas JSONL antigas antes de inserir linhas.
- O antigo auxiliar de streaming de transcrição JSONL de propriedade do tempo de execução foi excluído. O código de
  importação do doctor é responsável por leituras explícitas de arquivos legados; o histórico de sessões em tempo de execução lê
  linhas SQLite.
- Bindings do servidor de app Codex usam o `sessionId` do OpenClaw como a chave
  canônica no namespace de estado de Plugin do Codex. `sessionKey` é metadado para
  roteamento/exibição e não deve substituir o ID de sessão durável nem ressuscitar
  a identidade de arquivo de transcrição.
- Mecanismos de contexto recebem diretamente o contrato atual de tempo de execução. O registro
  não deve envolver mecanismos com shims de repetição que excluem `sessionKey`,
  `transcriptScope` ou `prompt`; mecanismos que não conseguem aceitar os parâmetros atuais
  orientados a banco de dados devem falhar de forma explícita em vez de serem intermediados.
- A saída de backup deve permanecer um único arquivo de pacote. O conteúdo do banco de dados deve entrar
  nesse pacote como snapshots SQLite compactos, não como arquivos auxiliares WAL brutos ao vivo.
- A busca em transcrições é útil, mas não é obrigatória para o primeiro corte orientado a banco de dados.
  Projete o esquema para que FTS possa ser adicionado posteriormente.
- A execução de workers deve permanecer experimental, atrás de configurações, enquanto o limite do banco de dados
  se estabiliza.

## Achados da Leitura de Código

A branch atual já passou da etapa de prova de conceito. O banco de dados compartilhado
existe, o `node:sqlite` do Node está conectado por meio de um pequeno auxiliar de tempo de execução, e
stores anteriores agora gravam em `state/openclaw.sqlite` ou no banco de dados
`openclaw-agent.sqlite` responsável.

O trabalho restante não é escolher SQLite; é manter o novo limite limpo
e excluir quaisquer interfaces com formato de compatibilidade que ainda pareçam o antigo
mundo de arquivos:

- `storePath` de sessão não é mais uma identidade de tempo de execução, formato de fixture de teste nem
  campo de payload de status. Testes de tempo de execução e ponte não contêm mais o
  nome de contrato `storePath`; o código de doctor/migração é responsável por esse vocabulário legado.
- Gravações de sessão não passam mais pela antiga fila em processo `store-writer.ts`.
  Gravações de patches SQLite usam detecção de conflito e repetição limitada em vez disso.
- A descoberta de caminhos legados ainda tem usos válidos de migração, mas o código de tempo de execução deve
  parar de tratar `sessions.json` e arquivos de transcrição JSONL como possíveis destinos de gravação.
- Tabelas pertencentes a agentes ficam em bancos de dados SQLite por agente. O banco de dados global mantém
  linhas de registro/plano de controle; a identidade de transcrição é `{agentId, sessionId}` nas
  linhas de transcrição por agente. O código de tempo de execução não deve persistir caminhos de arquivo de transcrição
  nem migrar localizadores de transcrição.
- O doctor já importa vários arquivos legados. A limpeza é transformar isso em uma
  única implementação explícita de migração que o doctor chama, com um relatório de
  migração durável.

Nenhuma pergunta adicional de produto está bloqueando a implementação.

## Forma Atual do Código

A branch já tem uma base SQLite compartilhada real:

- O piso de runtime agora é Node 22+: `package.json`, a proteção de runtime da CLI,
  os padrões do instalador, o localizador de runtime do macOS, a CI e a
  documentação pública de instalação agora concordam. A antiga faixa de
  compatibilidade com Node 22 foi removida.
- `src/state/openclaw-state-db.ts` abre `openclaw.sqlite`, define WAL,
  `synchronous=NORMAL`, `busy_timeout=30000`, `foreign_keys=ON` e aplica
  o módulo de esquema gerado derivado de
  `src/state/openclaw-state-schema.sql`.
- Os tipos de tabela Kysely e os módulos de esquema de runtime são gerados a
  partir de bancos de dados SQLite descartáveis criados a partir dos arquivos
  `.sql` comitados; o código de runtime não mantém mais strings de esquema
  copiadas e coladas para bancos de dados globais, por agente ou de captura de
  proxy.
- As lojas de runtime derivam tipos de linha selecionados e inseridos dessas
  interfaces `DB` geradas do Kysely, em vez de espelhar manualmente os formatos
  de linha do SQLite. SQL bruto continua limitado à aplicação de esquema,
  pragmas e DDL somente de migração.
- Os esquemas SQLite foram consolidados para `user_version = 1` porque este
  layout de banco de dados ainda não foi lançado. Os abridores de runtime criam
  apenas o esquema atual; a importação de arquivo para banco de dados permanece
  no código do doctor, e os auxiliares de atualização de banco de dados locais
  de branch foram excluídos.
- A propriedade relacional é aplicada onde o limite de propriedade é canônico:
  linhas de migração de origem propagam exclusões a partir de `migration_runs`,
  o estado de entrega de tarefas propaga exclusões a partir de `task_runs`, e
  linhas de identidade de transcrição propagam exclusões a partir de eventos de
  transcrição.
- As tabelas compartilhadas atuais incluem `agent_databases`,
  `auth_profile_stores`, `auth_profile_state`,
  `plugin_state_entries`, `plugin_blob_entries`, `media_blobs`,
  `skill_uploads`, `capture_sessions`, `capture_events`, `capture_blobs`,
  `sandbox_registry_entries`, `cron_run_logs`, `cron_jobs`, `commitments`,
  `delivery_queue_entries`, `model_capability_cache`,
  `workspace_setup_state`, `native_hook_relay_bridges`,
  `current_conversation_bindings`, `plugin_binding_approvals`,
  `tui_last_sessions`, `acp_sessions`, `acp_replay_sessions`,
  `acp_replay_events`, `task_runs`, `task_delivery_state`, `flow_runs`,
  `subagent_runs`, `migration_runs` e `backup_runs`.
- Estado arbitrário de propriedade de Plugin não recebe tabelas tipadas de
  propriedade do hospedeiro. Plugins instalados usam `plugin_state_entries` para
  payloads JSON versionados e `plugin_blob_entries` para bytes, com propriedade
  de namespace/chave, limpeza por TTL, backup e registros de migração de
  Plugin. O estado de orquestração de Plugins de propriedade do hospedeiro ainda
  pode ter tabelas tipadas quando o hospedeiro é dono do contrato de consulta,
  como `plugin_binding_approvals`.
- Migrações de Plugin são migrações de dados sobre namespaces de propriedade do
  Plugin, não migrações de esquema do hospedeiro. Um Plugin pode migrar suas
  próprias entradas versionadas de estado/blob por meio de um provedor de
  migração, e o hospedeiro registra o status de origem/execução no livro-razão
  normal de migrações. Novas instalações de Plugin não exigem alterar
  `openclaw-state-schema.sql`, a menos que o próprio hospedeiro esteja assumindo
  a propriedade de um novo contrato entre Plugins.
- `src/state/openclaw-agent-db.ts` abre
  `agents/<agentId>/agent/openclaw-agent.sqlite`, registra o banco de dados no
  banco de dados global e possui tabelas locais do agente para sessão,
  transcrição, VFS, artefato, cache e índice de memória. A descoberta de runtime
  compartilhada agora lê o registro `agent_databases` com tipos gerados em vez
  de reimplementar essa consulta em cada ponto de chamada.
- Bancos de dados globais e por agente registram uma linha `schema_meta` com
  papel do banco de dados, versão do esquema, carimbos de data/hora e id do
  agente para bancos de dados de agente. O layout ainda permanece em
  `user_version = 1` porque este esquema SQLite ainda não foi lançado.
- A identidade de sessão por agente agora tem uma tabela raiz canônica
  `sessions` chaveada por `session_id`, com `session_key`, `session_scope`,
  `account_id`, `primary_conversation_id`, carimbos de data/hora, campos de
  exibição, metadados de modelo, id de harness e vínculo de pai/spawn como
  colunas consultáveis. `session_routes` é o índice exclusivo de rota ativa de
  `session_key` para o `session_id` atual, portanto uma chave de rota pode
  passar para uma nova sessão durável sem fazer leituras quentes escolherem
  entre linhas `sessions.session_key` duplicadas. O antigo payload em formato de
  compatibilidade `session_entries.entry_json` fica pendurado na raiz durável
  `session_id` por chave estrangeira; ele não é mais a única representação de
  uma sessão no nível do esquema.
- A identidade de conversa externa por agente também é relacional:
  `conversations` armazena identidade normalizada de provedor/conta/conversa, e
  `session_conversations` vincula uma sessão do OpenClaw a uma ou mais conversas
  externas. Isso cobre sessões de DM principal compartilhadas em que vários
  pares podem mapear intencionalmente para uma sessão sem mentir em
  `session_key`. O SQLite também impõe exclusividade para a identidade natural
  do provedor, de modo que a mesma tupla
  canal/conta/tipo/par/thread não possa se bifurcar entre ids de conversa.
  Pares diretos de principal compartilhado são vinculados com uma função
  `participant`, para que uma sessão do OpenClaw possa representar vários pares
  externos de DM sem rebaixar pares antigos a linhas relacionadas vagas.
  `sessions.primary_conversation_id` ainda aponta para o destino atual de
  entrega tipada. Colunas fechadas de roteamento/status são aplicadas com
  restrições `CHECK` do SQLite em vez de depender apenas de uniões TypeScript.
  A projeção de sessão de runtime limpa sombras de roteamento de compatibilidade
  de `session_entries.entry_json` antes de aplicar colunas tipadas de
  sessão/conversa, para que payloads JSON obsoletos não possam ressuscitar
  destinos de entrega.
  O roteamento de anúncio de subagente também exige o contexto de entrega tipado
  do SQLite; ele não recua mais para campos de rota de compatibilidade
  `SessionEntry`.
  A herança de entrega explícita de `chat.send` do Gateway lê o contexto de
  entrega tipado do SQLite em vez dos campos de compatibilidade `origin`/`last*`.
  `tools.effective` também deriva contexto de provedor/conta/thread de linhas
  tipadas de entrega/roteamento do SQLite, não de sombras obsoletas `last*` de
  entrada de sessão.
  O contexto de prompt de evento de sistema reconstrói campos
  canal/para/conta/thread a partir de campos tipados de entrega em vez de sombras
  `origin`.
  O auxiliar compartilhado `deliveryContextFromSession` e o mapeador de sessão
  para conversa agora ignoram `SessionEntry.origin` por completo; somente campos
  tipados de entrega e linhas relacionais de conversa podem criar identidade de
  rota quente.
  A normalização de entrada de sessão de runtime remove `origin` antes de
  persistir ou projetar `entry_json`, e gravações de metadados de entrada
  escrevem campos tipados de canal/chat mais linhas relacionais de conversa em
  vez de criar novas sombras de origem.
- Eventos de transcrição, snapshots de transcrição e eventos de runtime de
  trajetória agora referenciam a raiz canônica `sessions` por agente e propagam
  exclusões na exclusão da sessão. Linhas de identidade/idempotência de
  transcrição continuam propagando exclusões a partir da linha exata de evento
  de transcrição.
- Índices do núcleo de memória agora usam tabelas explícitas de banco de dados
  de agente `memory_index_meta`, `memory_index_sources`, `memory_index_chunks` e
  `memory_embedding_cache`, com `memory_index_state` rastreando mudanças de
  revisão. Índices laterais opcionais de FTS/vetor são chamados
  `memory_index_chunks_fts` e `memory_index_chunks_vec` em vez de tabelas
  genéricas `meta`, `files`, `chunks`, `chunks_fts` ou `chunks_vec`. Os nomes
  canônicos preservam o formato atual de linha de caminho/origem e a
  compatibilidade de embeddings serializados. Essas tabelas são cache
  derivado/de pesquisa, não armazenamento canônico de transcrição; elas podem
  ser excluídas e reconstruídas a partir de arquivos do workspace de memória e
  fontes configuradas. Abrir um índice de memória lançado com nome genérico
  migra seus metadados, fontes, chunks e cache de embeddings para as tabelas
  canônicas; tabelas derivadas de FTS/vetor são reconstruídas sob seus nomes
  canônicos.
- O estado de recuperação de execução de subagente agora vive em linhas
  compartilhadas tipadas `subagent_runs` com chaves de sessão indexadas de
  filho, solicitante e controlador. O antigo arquivo `subagents/runs.json` é
  apenas entrada de migração do doctor.
- Vínculos de conversa atuais agora vivem em linhas compartilhadas tipadas
  `current_conversation_bindings` chaveadas por id de conversa normalizado, com
  colunas de agente/sessão de destino, tipo de conversa, status, expiração e
  metadados armazenados como colunas relacionais em vez de um registro de
  vínculo opaco duplicado. A chave durável de vínculo inclui o tipo de conversa
  normalizado para que referências diretas/de grupo/de canal não colidam, e o
  SQLite rejeita valores inválidos de tipo/status de vínculo. O antigo arquivo
  `bindings/current-conversations.json` é apenas entrada de migração do doctor.
- A recuperação da fila de entrega agora sobrepõe colunas tipadas de fila para
  canal, destino, conta, sessão, nova tentativa, erro, envio pela plataforma e
  estado de recuperação sobre o JSON de repetição. `entry_json` mantém os
  payloads de repetição, hooks e payload de formatação, mas as colunas tipadas
  são autoritativas para roteamento/estado quente da fila.
- Ponteiros de restauração de última sessão da TUI agora vivem em linhas
  compartilhadas tipadas `tui_last_sessions` chaveadas pelo escopo de
  conexão/sessão TUI com hash. O antigo arquivo JSON da TUI é apenas entrada de
  migração do doctor.
- Preferências padrão de TTS agora vivem em linhas SQLite compartilhadas de
  estado de Plugin chaveadas sob o Plugin `speech-core`. O antigo arquivo
  `settings/tts.json` é apenas entrada de migração do doctor; o runtime não lê
  nem escreve mais arquivos JSON de preferências de TTS, e o resolvedor de
  caminho legado vive no módulo de migração do doctor.
- Metadados de destino secreto agora falam sobre armazenamentos em vez de fingir
  que todo destino de credencial é um arquivo de configuração. `openclaw.json`
  continua sendo o armazenamento de configuração; destinos de perfil de
  autenticação usam linhas SQLite tipadas `auth_profile_stores` com credenciais
  no formato do provedor mantidas como payloads JSON.
- A auditoria de segredos não examina mais arquivos aposentados `auth.json` por
  agente. O doctor é dono de avisar sobre esse arquivo legado, importá-lo e
  removê-lo.
- Auxiliares legados de caminho de perfil de autenticação agora vivem no código
  legado do doctor. Auxiliares centrais de caminho de perfil de autenticação
  expõem identidade e locais de exibição de armazenamento de autenticação em
  SQLite, não caminhos de runtime `auth-profiles.json` ou `auth-state.json`.
- Os módulos de runtime de recuperação de execução de subagente e de cache de
  capacidade de modelo do OpenRouter agora mantêm leitores/gravadores de
  snapshot SQLite separados de auxiliares de importação JSON legados somente do
  doctor. Capacidades do OpenRouter usam as linhas genéricas tipadas
  `model_capability_cache` sob `provider_id = "openrouter"` em vez de um blob de
  cache opaco ou uma tabela de hospedeiro específica do provedor. `taskName` de
  execução de subagente é armazenado na coluna tipada
  `subagent_runs.task_name`; a cópia `payload_json` é dado de repetição/debug,
  não a fonte para campos quentes de exibição ou busca.
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts` implementa um VFS SQLite
  sobre a tabela `vfs_entries` do banco de dados do agente. Leituras de
  diretório, exportações recursivas, exclusões e renomeações usam intervalos
  de prefixo indexados `(namespace, path)` em vez de varrer um namespace inteiro
  ou depender de correspondência de caminho com `LIKE`.
- `src/agents/runtime-worker.entry.ts` cria VFS SQLite, artefato de ferramenta,
  artefato de execução e armazenamentos de cache com escopo por execução para
  workers.
- Marcadores de conclusão de bootstrap de workspace agora vivem em linhas
  compartilhadas tipadas `workspace_setup_state` chaveadas por caminho de
  workspace resolvido em vez de `.openclaw/workspace-state.json`; o runtime não
  lê nem reescreve mais o marcador legado de workspace, e as APIs auxiliares não
  passam mais um caminho falso `.openclaw/setup-state` apenas para derivar a
  identidade de armazenamento.
- Aprovações de exec agora vivem na linha singleton tipada compartilhada SQLite
  `exec_approvals_config`. O doctor importa o legado
  `~/.openclaw/exec-approvals.json`; gravações de runtime não criam, reescrevem
  nem relatam mais esse arquivo como seu local de armazenamento ativo. O
  companion do macOS lê e escreve a mesma linha de tabela
  `state/openclaw.sqlite`; ele mantém em disco apenas o socket Unix de prompt,
  porque isso é IPC, não estado durável de runtime.
- Os módulos de runtime de identidade de dispositivo, autenticação de dispositivo
  e bootstrap agora mantêm leitores/gravadores de snapshot SQLite separados de
  auxiliares de importação JSON legados somente do doctor. Identidade de
  dispositivo usa linhas tipadas `device_identities` e tokens de autenticação de
  dispositivo usam linhas tipadas `device_auth_tokens`. Gravações de autenticação
  de dispositivo reconciliam linhas por dispositivo/função em vez de truncar a
  tabela de tokens, e o runtime não roteia mais atualizações de token único pelo
  antigo adaptador de armazenamento inteiro. O legado
  payloads JSON da versão 1 existem apenas como formatos de importação/exportação do doctor.
- O cache de troca de tokens do GitHub Copilot usa a tabela compartilhada de estado de Plugin do SQLite
  em `github-copilot/token-cache/default`. Ele é estado de cache pertencente ao provedor,
  então intencionalmente não adiciona uma tabela de esquema do host.
- A Compaction do GitHub Copilot não grava mais sidecars de workspace
  `openclaw-compaction-*.json`. O harness chama o RPC de Compaction de histórico do SDK para a
  sessão rastreada do SDK, e o OpenClaw mantém o estado durável de sessão/transcrição no
  SQLite em vez de arquivos marcadores de compatibilidade.
- O runtime Swift compartilhado (`OpenClawKit`) usa as mesmas linhas de
  `state/openclaw.sqlite` para identidade do dispositivo e autenticação do dispositivo. Os
  auxiliares do app macOS importam os auxiliares compartilhados do SQLite em vez de possuir um segundo caminho JSON ou
  SQLite. Um `identity/device.json` legado restante bloqueia a criação de identidade
  até que o doctor o importe para o SQLite, correspondendo ao gate de inicialização do TypeScript e do Android.
- A identidade de dispositivo no Android usa o mesmo material de chave compatível com TypeScript
  armazenado em linhas tipadas de `state/openclaw.sqlite#table/device_identities`. Ela nunca
  lê nem grava `openclaw/identity/device.json`; um arquivo legado restante bloqueia
  a inicialização até que o doctor o importe para o SQLite.
- Tokens de autenticação de dispositivo em cache no Android também usam linhas tipadas de
  `state/openclaw.sqlite#table/device_auth_tokens` e compartilham a mesma
  semântica de token da versão 1 que TypeScript e Swift. O runtime não lê mais as chaves de compatibilidade
  `SecurePrefs` `gateway.deviceToken*`; elas pertencem apenas à lógica de migração/doctor.
- O histórico de pacotes recentes de notificação do Android usa linhas tipadas
  `android_notification_recent_packages`. O runtime não migra nem lê mais as chaves CSV antigas de SharedPreferences.
- A criação de identidade de dispositivo falha fechada quando existe `identity/device.json`
  legado, quando a linha de identidade do SQLite é inválida ou quando o armazenamento de identidade do SQLite
  não pode ser aberto. O doctor importa e remove esse arquivo primeiro, então a inicialização do
  runtime não pode rotacionar silenciosamente a identidade de pareamento antes da migração.
- A seleção de identidade de dispositivo é uma chave de linha do SQLite, não um localizador de arquivo JSON. Testes
  e auxiliares do Gateway passam chaves de identidade explícitas; apenas a migração do doctor e o
  gate de inicialização fail-closed conhecem o nome de arquivo aposentado `identity/device.json`.
- A compatibilidade de redefinição de sessão agora vive na migração de configuração do doctor:
  `session.idleMinutes` é movido para `session.reset.idleMinutes`,
  `session.resetByType.dm` é movido para `session.resetByType.direct`, e a
  política de redefinição do runtime lê apenas chaves de redefinição canônicas.
- A compatibilidade de configuração legada agora vive em `src/commands/doctor/`. A validação normal de
  `readConfigFileSnapshot()` não importa detectores legados do doctor
  nem anota problemas legados; `runDoctorConfigPreflight()` adiciona esses problemas para
  reparo/relatório do doctor. O fluxo de configuração do doctor importa
  `src/commands/doctor/legacy-config.ts`, e o reparo antigo de IDs de perfil OAuth vive
  em
  `src/commands/doctor/legacy/oauth-profile-ids.ts`.
- Comandos que não são do doctor não executam automaticamente reparo de configuração legada. Por exemplo,
  `openclaw update --channel` agora falha em configuração legada inválida e pede que o
  usuário execute o doctor, em vez de importar silenciosamente código de migração do doctor.
- Web push, APNs, Voice Wake, verificações de atualização e integridade de configuração agora usam tabelas SQLite compartilhadas tipadas
  para assinaturas, chaves VAPID, registros de nós, linhas de gatilho,
  linhas de roteamento, estado de notificação de atualização e entradas de integridade de configuração em vez de
  blobs JSON opacos inteiros. Gravações de snapshots de web push e APNs agora reconciliam
  assinaturas/registros por chave primária em vez de limpar suas tabelas;
  a integridade de configuração faz o mesmo por caminho de configuração.
  Seus módulos de runtime mantêm leitores/gravadores de snapshots SQLite separados dos
  auxiliares de importação JSON legados exclusivos do doctor.
- A configuração do host Node agora usa uma linha singleton tipada no banco de dados SQLite compartilhado;
  o doctor importa o arquivo `node.json` antigo antes do uso normal do runtime.
- Pareamento de dispositivo/nó, pareamento de canais, allowlists de canais e estado de bootstrap
  agora usam linhas SQLite tipadas em vez de blobs JSON opacos inteiros. Aprovações de vinculação de Plugin
  e estado de jobs cron seguem a mesma divisão: módulos de runtime expõem
  operações apoiadas por SQLite e auxiliares neutros de snapshot, e as gravações de snapshots de pareamento/bootstrap
  mais aprovação de vinculação de Plugin reconciliam linhas por chave primária
  em vez de truncar tabelas, enquanto o doctor importa/remove os arquivos JSON antigos por meio de
  módulos `src/commands/doctor/legacy/*`.
- Registros de Plugins instalados agora vivem no índice de Plugins instalados do SQLite.
  Leitura/gravação de configuração do runtime não migra nem preserva mais dados antigos de configuração
  autorada `plugins.installs`; o doctor importa esse formato de configuração legado
  para o SQLite antes do uso normal do runtime.
- Snapshots de recuperação de credenciais do QQBot agora vivem no estado de Plugin do SQLite em
  `qqbot/credential-backups`. O runtime não grava mais
  `qqbot/data/credential-backup*.json`; o contrato do doctor do QQBot importa e
  arquiva esses arquivos de backup legados do diretório de estado ativo.
- O planejamento de recarregamento do Gateway compara snapshots do índice de Plugins instalados do SQLite em
  um namespace de diff interno `installedPluginIndex.installRecords.*`. Decisões de
  recarregamento do runtime não encapsulam mais essas linhas em objetos falsos de configuração
  `plugins.installs`.
- A atualização de credenciais de contas nomeadas do Matrix não acontece mais durante leituras
  de runtime. O doctor possui a renomeação antiga do
  `credentials/matrix/credentials.json` de nível superior quando uma conta Matrix única/padrão pode ser resolvida.
- Os módulos de runtime de pareamento e cron do core não exportam mais construtores de caminhos JSON
  legados. Módulos legados pertencentes ao doctor constroem caminhos de origem
  `pending.json`, `paired.json`, `bootstrap.json` e `cron/jobs.json` apenas para testes de importação e
  migração. A normalização legada de formato de jobs cron e a importação de logs de execução cron
  vivem em `src/commands/doctor/legacy/cron*.ts`.
- `src/commands/doctor/legacy/runtime-state.ts` importa arquivos de estado JSON legados,
  incluindo configuração de host Node, para o SQLite a partir do doctor. Novos importadores de arquivos legados
  ficam em `src/commands/doctor/legacy/`.
- `src/commands/doctor/state-migrations.ts` importa `sessions.json` legado e
  transcrições `*.jsonl` diretamente para o SQLite e remove fontes bem-sucedidas. Ele
  não prepara mais transcrições legadas da raiz por meio de
  `agents/<agentId>/sessions/*.jsonl` nem cria um destino JSONL canônico antes da
  importação.
- Verificações de integridade de estado do doctor não escaneiam mais diretórios de sessão legados nem
  oferecem exclusão de JSONL órfão. Arquivos de transcrição legados são entradas de migração
  apenas, e a etapa de migração possui a importação mais a remoção da fonte.
- A importação do registro de sandbox legado vive em
  `src/commands/doctor/legacy/sandbox-registry.ts`; leituras e gravações ativas do registro de sandbox
  permanecem apenas no SQLite.
- O reparo de integridade/importação de transcrição de sessão legada vive em
  `src/commands/doctor/legacy/session-transcript-health.ts`; módulos de comando de runtime
  não carregam mais análise de transcrição JSONL nem código de reparo de ramificação ativa.

Destaques de consolidação/exclusão concluídos:

- O estado de Plugin agora usa o banco de dados compartilhado `state/openclaw.sqlite`. O importador sidecar antigo de `plugin-state/state.sqlite` local da branch foi removido porque esse layout SQLite nunca foi lançado. Auxiliares de sondagem/teste relatam o `databasePath` compartilhado em vez de expor um caminho SQLite específico de estado de Plugin.
- As tabelas de tempo de execução de tarefas e TaskFlow agora ficam no banco de dados compartilhado `state/openclaw.sqlite`, em vez de `tasks/runs.sqlite` e `tasks/flows/registry.sqlite`; os importadores sidecar antigos foram removidos pelo mesmo motivo de layout não lançado.
- `src/config/sessions/store.ts` não precisa mais de `storePath` para metadados de entrada, atualizações de rota ou leituras de updated-at. Persistência de comandos, limpeza de sessão da CLI, profundidade de subagente, substituições de autenticação e identidade de sessão de transcrição usam APIs de linhas de agente/sessão. Gravações são aplicadas como patches de linhas SQLite com nova tentativa em caso de conflito otimista.
- A resolução de destino de sessão agora expõe destinos de banco de dados por agente, não caminhos legados de `sessions.json`. Gateway compartilhado, metadados ACP, reparo de rota do doctor e `openclaw sessions` enumeram `agent_databases` mais agentes configurados.
- O roteamento de sessão do Gateway agora usa `resolveGatewaySessionDatabaseTarget`; o destino retornado carrega `databasePath` e chaves de linha SQLite candidatas em vez de um caminho de arquivo legado de armazenamento de sessões.
- Os tipos de tempo de execução de sessão de canal agora expõem `{agentId, sessionKey}` para leituras de updated-at, metadados de entrada e atualizações de última rota. O tipo antigo de compatibilidade `saveSessionStore(storePath, store)` foi removido.
- As superfícies de tempo de execução de Plugin, API de extensão e barrel de `config/sessions` agora direcionam código de Plugin para auxiliares de linha de sessão baseados em SQLite. Exportações de compatibilidade da biblioteca raiz (`loadSessionStore`, `saveSessionStore`, `resolveStorePath`) permanecem como shims obsoletos para consumidores existentes. O auxiliar antigo `resolveLegacySessionStorePath` foi removido; a construção de caminho legado de `sessions.json` agora é local a migrações e fixtures de teste.
- `src/config/sessions/session-entries.sqlite.ts` agora armazena entradas de sessão canônicas no banco de dados por agente e tem suporte a patch de leitura/upsert/delete em nível de linha. Upsert/patch/delete em tempo de execução não varre mais variantes de maiúsculas/minúsculas nem remove chaves de alias legadas; o doctor é responsável pela canonicalização. O auxiliar independente de importação JSON foi removido, e a migração mescla linhas mais novas por upsert em vez de substituir a tabela inteira de sessões. Auxiliares públicos de read/list/load projetam metadados ativos de sessão a partir de linhas tipadas de `sessions` e `conversations`; `entry_json` é uma sombra de compatibilidade/depuração e pode ficar desatualizado ou inválido sem perder identidade de sessão tipada nem contexto de entrega.
- `src/config/sessions/delivery-info.ts` agora resolve o contexto de entrega a partir das linhas tipadas por agente de `sessions` + `conversations` + `session_conversations`. Ele não reconstrói mais a identidade de entrega em tempo de execução a partir de `session_entries.entry_json`; uma linha tipada de conversa ausente é um problema de migração/reparo do doctor, não um fallback de tempo de execução.
- Decisões de redefinição de sessão armazenada agora preferem os metadados tipados `sessions.session_scope`, `sessions.chat_type` e `sessions.channel`. A análise de `sessionKey` permanece apenas para sufixos explícitos de thread/tópico em destinos de comando; a classificação de redefinição grupo versus direto não vem mais do formato da chave.
- A classificação de exibição de lista/status de sessão agora usa metadados tipados de chat e tipo de sessão do Gateway. Ela não trata mais substrings `:group:` ou `:channel:` dentro de `session_key` como verdade durável de grupo/direto.
- A seleção de política de resposta silenciosa agora usa apenas tipo explícito de conversa ou metadados de superfície. Ela não adivinha mais política direta/grupo a partir de substrings de `session_key`.
- A resolução do modelo de exibição de sessão agora recebe o id do agente a partir do destino de banco de dados SQLite da sessão em vez de separá-lo de `session_key`.
- A hidratação de destino de anúncio agente-para-agente agora usa apenas `deliveryContext` tipado de `sessions.list`. Ela não recupera mais roteamento de canal/conta/thread a partir de `origin` legado, campos `last*` espelhados ou formato de `session_key`.
- A rejeição de destino de thread de `sessions_send` agora lê metadados tipados de roteamento SQLite. Ela não rejeita nem aceita mais destinos analisando sufixos de thread da chave de destino.
- A validação de política de ferramenta com escopo de grupo agora lê roteamento tipado de conversa SQLite para a sessão atual ou gerada. Ela não confia mais na identidade de grupo/canal decodificando `sessionKey`; ids de grupo fornecidos pelo chamador são descartados quando nenhuma linha tipada de sessão os atesta.
- A correspondência de substituição de modelo por canal agora usa metadados explícitos de grupo e conversa pai. Ela não decodifica mais ids de conversa pai de `parentSessionKey`.
- A herança de substituição de modelo armazenada agora exige uma chave explícita de sessão pai do contexto tipado da sessão. Ela não deriva mais substituições pai de sufixos `:thread:` ou `:topic:` em `sessionKey`.
- O wrapper antigo de informações de thread de sessão e o analisador de thread de Plugin carregado foram removidos; nenhum código de tempo de execução importa `config/sessions/thread-info`.
- O auxiliar de conversa de canal não expõe mais bridges de análise de chave de sessão completa. O núcleo ainda normaliza ids brutos de conversa pertencentes ao provedor por meio de `resolveSessionConversation(...)`, mas não reconstrói fatos de rota a partir de `sessionKey`.
- Entrega de conclusão, política de envio e manutenção de tarefas não derivam mais o tipo de chat a partir do formato de `session_key`. O analisador antigo de chave de tipo de chat foi removido; esses caminhos exigem metadados tipados de sessão, contexto tipado de entrega ou vocabulário explícito de destino de entrega.
- Lista/status de sessão, diagnósticos, vinculação de conta de aprovação, filtragem de Heartbeat da TUI e resumos de uso não extraem mais de `SessionEntry.origin` roteamento de provedor/conta/thread/exibição. As únicas leituras restantes de `origin` em tempo de execução são conceitos que não são de sessão ou objetos de entrega do turno atual.
- A pesquisa de conversa nativa de solicitação de aprovação agora lê linhas tipadas de roteamento de sessão por agente. Ela não analisa mais identidade de conversa de canal/grupo/thread a partir de `sessionKey`; metadados tipados ausentes são um problema de migração/reparo.
- Payloads de eventos changed/chat/session de sessão do Gateway não ecoam mais `SessionEntry.origin` nem sombras de rota `last*`; clientes recebem `channel`, `chatType` e `deliveryContext` tipados.
- A resolução de entrega de Heartbeat agora pode receber diretamente o `deliveryContext` SQLite tipado, e o tempo de execução de Heartbeat passa a linha de entrega de sessão por agente em vez de depender de sombras de compatibilidade de `session_entries` para o roteamento atual.
- A resolução de destino de entrega de agente isolado do Cron também hidrata sua rota atual a partir da linha tipada de entrega de sessão por agente antes de recorrer ao payload de entrada de compatibilidade.
- A resolução de origem de anúncio de subagente agora encaminha o contexto tipado de entrega da sessão solicitante por `loadRequesterSessionEntry` e prefere essa linha em vez de sombras de compatibilidade `last*`/`deliveryContext`.
- Atualizações de metadados de sessão de entrada agora mesclam primeiro contra a linha tipada de entrega por agente; campos antigos de entrega de `SessionEntry` são apenas o fallback quando nenhuma linha tipada de conversa existe.
- A extração de entrega de reinício/atualização agora deixa o `threadId` da entrega SQLite tipada prevalecer sobre fragmentos de tópico/thread analisados de `sessionKey`; a análise é apenas um fallback para chaves legadas em formato de thread.
- Ids de canal de contexto de agente de hook agora preferem identidade tipada de conversa SQLite e depois metadados explícitos da mensagem. Eles não analisam mais fragmentos de provedor/grupo/canal a partir de `sessionKey`.
- A herança de rota externa de `chat.send` do Gateway agora lê metadados tipados de roteamento de sessão SQLite em vez de inferir escopo de canal/direto/grupo a partir de partes de `sessionKey`. Sessões com escopo de canal herdam apenas quando o canal tipado da sessão e o tipo de chat correspondem ao contexto de entrega armazenado; sessões shared-main mantêm sua regra mais rígida de CLI/sem metadados de cliente.
- O despertar por sentinela de reinício e o roteamento de continuação agora leem linhas tipadas de entrega/roteamento SQLite antes de enfileirar despertares de Heartbeat ou continuações roteadas de turno de agente. Eles não reconstroem mais contexto de entrega a partir da sombra JSON da entrada de sessão.
- A resolução de contexto de `tools.effective` do Gateway agora lê linhas tipadas de entrega/roteamento SQLite para entradas de provedor, conta, destino, thread e modo de resposta. Ela não recupera mais esses campos ativos de roteamento a partir de sombras `origin` obsoletas de `session_entries.entry_json`.
- O roteamento de consulta de voz em tempo real agora resolve entrega pai/chamada a partir de linhas tipadas de sessão SQLite por agente. Ele não recorre mais a sombras de compatibilidade de `SessionEntry.deliveryContext` ao escolher a rota da mensagem do agente incorporado.
- O relay de Heartbeat de spawn ACP e o roteamento de stream pai agora leem a entrega pai de linhas tipadas de sessão SQLite. Eles não reconstroem mais o contexto de entrega pai a partir de sombras de compatibilidade de entradas de sessão.
- A preservação de rota de entrega de sessão agora segue metadados tipados de chat e colunas persistidas de entrega. Ela não extrai mais dicas de canal, marcadores direto/main nem formato de thread a partir de `sessionKey`; rotas internas de webchat só herdam um destino externo quando o SQLite já tem identidade tipada/persistida de entrega para a sessão.
- A extração genérica de entrega de sessão agora lê apenas a linha exata tipada de entrega de sessão SQLite. Ela não analisa mais sufixos de thread/tópico nem faz fallback de uma chave em formato de thread para uma chave base de sessão.
- Despacho de resposta, recuperação da sentinela de reinício e roteamento de consulta de voz em tempo real agora usam linhas exatas tipadas de sessão/conversa SQLite para roteamento de thread. Eles não recuperam mais ids de thread nem contexto de entrega da sessão base analisando chaves de sessão em formato de thread.
- A limitação de histórico do PI incorporado agora usa a projeção tipada de roteamento de sessão SQLite (`sessions` + `conversations` primárias) para provedor, tipo de chat e identidade do par. Ela não analisa mais provedor, DM, grupo nem formato de thread a partir de `sessionKey`.
- A inferência de entrega de ferramenta Cron agora usa apenas entrega explícita ou o contexto tipado atual de entrega. Ela não decodifica mais destinos de canal, par, conta ou thread a partir de `agentSessionKey`.
- Linhas de sessão em tempo de execução não carregam mais o alias antigo de rota `lastProvider`. Auxiliares e testes usam campos tipados `lastChannel` e `deliveryContext`; a migração do doctor é o único lugar que deve traduzir aliases de rota antigos ou sombras `origin` persistidas.
- Eventos de transcrição, linhas VFS e linhas de artefatos de ferramentas agora gravam no banco de dados por agente. A tabela global não lançada de mapeamento de arquivos de transcrição foi removida; o doctor registra caminhos de origem legados em linhas duráveis de migração.
- A pesquisa de transcrição em tempo de execução não varre mais offsets de bytes JSONL nem sonda arquivos de transcrição legados. Caminhos de chat/mídia/histórico do Gateway leem linhas de transcrição do SQLite; JSONL de sessão agora é apenas uma entrada legada do doctor, não um estado de tempo de execução nem formato de exportação.
- Relações pai e de branch de transcrição usam metadados estruturados `parentTranscriptScope: {agentId, sessionId}` em cabeçalhos de transcrição SQLite, não strings localizadoras em formato de caminho `agent-db:...transcript_events...`.
- O contrato do gerenciador de transcrição não expõe mais construtores persistidos implícitos `create(cwd)` ou `continueRecent(cwd)`. Gerenciadores persistidos de transcrição são abertos com um escopo explícito `{agentId, sessionId}`; apenas gerenciadores em memória permanecem sem escopo para testes e transformações puras de transcrição.
- APIs de armazenamento de transcrição em tempo de execução resolvem escopo SQLite, não caminhos de sistema de arquivos. O auxiliar antigo `resolve...ForPath` e opções de gravação `transcriptPath` não usadas foram removidos dos chamadores de tempo de execução.
- A resolução de sessão em tempo de execução agora usa `{agentId, sessionId}` e não deve derivar strings `sqlite-transcript://<agent>/<session>` para limites externos. Caminhos absolutos JSONL legados são apenas entradas de migração do doctor.
- Registros direct-bridge de relay de hook nativo agora ficam em linhas compartilhadas tipadas `native_hook_relay_bridges`, chaveadas por id de relay. O tempo de execução não grava mais um registro JSON em `/tmp` nem registros genéricos opacos para esses registros bridge de curta duração.
- `runEmbeddedPiAgent(...)` não tem mais um parâmetro localizador de transcrição.
  Descritores de workers preparados também omitem localizadores de transcrição. O estado
  da sessão de runtime e execuções de acompanhamento enfileiradas carregam `{agentId, sessionId}` em vez de
  identificadores de transcrição derivados.
- A Compaction incorporada agora obtém o escopo SQLite de `agentId` e `sessionId`.
  Hooks de Compaction, chamadas ao context-engine, delegação da CLI e respostas de protocolo
  não devem receber identificadores derivados `sqlite-transcript://...`. Código de exportação/depuração
  pode materializar artefatos explícitos do usuário a partir das linhas, mas não fornece um
  caminho genérico de exportação JSONL de sessão nem realimenta nomes de arquivos na identidade
  de runtime.
- `/export-session` lê linhas de transcrição do SQLite e grava apenas a visualização HTML
  independente solicitada. O visualizador incorporado não reconstrói nem
  baixa mais JSONL de sessão a partir dessas linhas.
- A delegação do context-engine não analisa mais um localizador de transcrição para recuperar
  a identidade do agente. O contexto de runtime preparado carrega o `agentId` resolvido
  para o adaptador de Compaction integrado.
- A reescrita de transcrição e a truncagem de resultado de ferramenta ao vivo agora leem e persistem
  o estado da transcrição por `{agentId, sessionId}` e não derivam localizadores
  temporários para payloads de eventos de atualização de transcrição.
- A superfície do auxiliar de estado de transcrição não tem mais variantes baseadas em localizador
  `readTranscriptState`, `replaceTranscriptStateEvents` ou
  `persistTranscriptStateMutation`. Chamadores de runtime devem usar as APIs
  `{agentId, sessionId}`. A importação do Doctor lê arquivos legados por caminho de arquivo explícito
  e grava linhas SQLite; ela não migra strings de localizador.
- O contrato do session-manager de runtime não expõe mais `open(locator)`,
  `forkFrom(locator)` ou `setTranscriptLocator(...)`. Gerenciadores de sessão
  persistidos abrem apenas por `{agentId, sessionId}`; auxiliares de listagem/fork vivem em
  APIs de sessão e checkpoint orientadas a linhas, em vez da fachada do gerenciador
  de transcrição.
- As APIs leitoras de transcrição do Gateway são escopo-primeiro. Elas recebem
  `{agentId, sessionId}` e não aceitam um localizador de transcrição posicional que
  poderia acidentalmente se tornar identidade de runtime. A análise de localizador de transcrição
  ativo foi removida; caminhos de origem legados são lidos apenas pelo código de importação do Doctor.
- Eventos de atualização de transcrição também são escopo-primeiro. `emitSessionTranscriptUpdate`
  não aceita mais uma string de localizador isolada, e listeners roteiam por
  `{agentId, sessionId}` sem analisar um identificador.
- O broadcast de session-message do Gateway resolve chaves de sessão a partir do escopo de agente/sessão,
  não de um localizador de transcrição. O resolvedor/cache antigo de localizador-de-transcrição-para-chave-de-sessão
  foi removido.
- O SSE de session-history do Gateway filtra atualizações ao vivo por escopo de agente/sessão. Ele não
  canonicaliza mais candidatos a localizador de transcrição, realpaths ou identidades de transcrição
  em forma de arquivo para decidir se um stream deve receber uma atualização.
- Hooks de ciclo de vida de sessão não derivam nem expõem mais localizadores de transcrição em
  `session_end`. Consumidores de hooks recebem `sessionId`, `sessionKey`, ids de próxima sessão
  e contexto do agente; arquivos de transcrição não fazem parte do contrato de ciclo de vida.
- Hooks de reset também não derivam nem expõem mais localizadores de transcrição. O payload
  `before_reset` carrega mensagens SQLite recuperadas mais o motivo do reset,
  enquanto a identidade da sessão fica no contexto do hook.
- O reset do harness de agente não aceita mais um localizador de transcrição. O despacho de reset é
  escopado por `sessionId`/`sessionKey` mais o motivo.
- Tipos de sessão de extensão de agente não expõem mais `transcriptLocator`; extensões
  devem usar o contexto de sessão e APIs de runtime em vez de buscar uma
  identidade de transcrição em forma de arquivo.
- Hooks de Compaction de Plugin não expõem mais localizadores de transcrição. O contexto do hook
  já carrega a identidade da sessão, e leituras de transcrição devem passar por APIs
  cientes de escopo SQLite em vez de identificadores em forma de arquivo.
- Hooks `before_agent_finalize` não expõem mais `transcriptPath`, incluindo
  payloads de relay de hook nativo. Hooks de finalização usam apenas o contexto de sessão.
- Respostas de reset do Gateway não sintetizam mais um localizador de transcrição na
  entrada retornada. O reset cria linhas de transcrição SQLite, retorna a entrada de sessão
  limpa e deixa o acesso à transcrição para leitores cientes de escopo.
- Resultados de execução incorporada e Compaction não expõem mais localizadores de transcrição para
  contabilidade de sessão. A Compaction automática atualiza apenas o `sessionId` ativo,
  contadores de Compaction e metadados de tokens.
- Resultados de tentativa incorporada não retornam mais `transcriptLocatorUsed`, e
  resultados de `compact()` do context-engine não retornam mais localizadores de transcrição.
  Loops de retry de runtime aceitam apenas um `sessionId` sucessor.
- Resultados de append de transcrição do delivery-mirror não retornam mais localizadores de transcrição.
  Chamadores recebem o `messageId` anexado; sinais de atualização de transcrição usam
  escopo SQLite.
- Auxiliares de fork de sessão pai retornam apenas o `sessionId` bifurcado. A preparação de subagente
  passa o escopo de agente/sessão filho para engines.
- Parâmetros do executor da CLI e reseeding de histórico não aceitam mais localizadores de transcrição.
  Leituras de histórico da CLI resolvem o escopo da transcrição SQLite a partir de `{agentId,
sessionId}` e do contexto da chave de sessão.
- Fixtures de teste da CLI e do embedded-runner agora semeiam e leem linhas de transcrição SQLite
  por id de sessão, em vez de fingir que sessões ativas são arquivos `*.jsonl` ou
  passar uma string `sqlite-transcript://...` por parâmetros de runtime.
- Eventos de guarda de resultado de ferramenta de sessão emitem a partir do escopo de sessão conhecido mesmo quando um
  gerenciador em memória não tem localizador derivado. Seus testes não fingem mais arquivos de transcrição
  ativos `/tmp/*.jsonl`.
- Auxiliares BTW e compaction-checkpoint agora leem e bifurcam linhas de transcrição por
  escopo SQLite. Metadados de checkpoint agora armazenam apenas ids de sessão e ids de folha/entrada;
  localizadores derivados não são mais gravados em payloads de checkpoint.
- A consulta de chave de transcrição do Gateway usa escopo de transcrição SQLite nos limites de protocolo
  e não faz mais realpath nem stat de nomes de arquivos de transcrição.
- A rotação automática de transcrição de Compaction grava linhas de transcrição sucessoras
  diretamente pelo armazenamento de transcrição SQLite. Linhas de sessão mantêm apenas a
  identidade da sessão sucessora, não um caminho JSONL durável nem um localizador persistido.
- A Compaction incorporada do context-engine usa auxiliares de rotação de transcrição nomeados por SQLite.
  Os testes de rotação não constroem mais caminhos JSONL sucessores nem
  modelam sessões ativas como arquivos.
- A retenção gerenciada de imagens de saída chaveia seu cache de mensagem de transcrição a partir de
  estatísticas de transcrição SQLite em vez de chamadas stat do sistema de arquivos.
- Locks de sessão de runtime e a lane independente legada do Doctor `.jsonl.lock`
  foram removidos.
- O barrel de runtime do Microsoft Teams e o SDK público de Plugin não reexportam mais
  o antigo auxiliar de lock de arquivo; caminhos de estado durável de Plugin são baseados em SQLite.
- A poda de sessões por idade/contagem e a limpeza explícita de sessões foram removidas.
  O Doctor é dono da importação legada; sessões obsoletas são resetadas ou excluídas explicitamente.
- Verificações de integridade do Doctor não contam mais um arquivo JSONL legado como transcrição ativa
  válida para uma linha de sessão SQLite. A saúde de transcrição ativa é apenas SQLite;
  arquivos JSONL legados são reportados como entradas de migração/limpeza de órfãos.
- O Doctor não trata mais `agents/<agent>/sessions/` como estado de runtime obrigatório.
  Ele só varre esse diretório quando ele já existe, como entrada de importação legada
  ou limpeza de órfãos.
- `sessions.resolve` do Gateway, caminhos de patch/reset/compact de sessão, geração de subagente,
  abort rápido, metadados ACP, sessões isoladas por Heartbeat e patching de TUI
  não migram nem podam mais chaves de sessão legadas como efeito colateral do
  trabalho normal de runtime.
- A resolução de sessão de comando da CLI agora retorna o `agentId` proprietário em vez de um
  `storePath`, e não copia mais linhas de sessão principal legadas durante a resolução normal
  de `--to` ou `--session-id`. A canonicalização de linha principal legada pertence
  apenas ao Doctor.
- A resolução de profundidade de subagente de runtime não lê mais `sessions.json` nem armazenamentos de sessão
  JSON5. Ela lê `session_entries` SQLite por id de agente, e metadados legados
  de profundidade/sessão só podem entrar pelo caminho de importação do Doctor.
- Overrides de sessão de perfil de autenticação persistem por upserts diretos de linha `{agentId, sessionKey}`
  em vez de carregar preguiçosamente um runtime de armazenamento de sessão em forma de arquivo.
- O gate verbose de auto-reply e os auxiliares de atualização de sessão agora leem/fazem upsert de linhas de sessão
  SQLite por identidade de sessão e não exigem mais um caminho de armazenamento legado
  antes de tocar no estado de linha persistido.
- Auxiliares de metadados de sessão de command-run agora usam nomes e caminhos de módulo orientados a entrada;
  a antiga superfície auxiliar de comando `session-store` foi removida.
- O seeding de cabeçalho de bootstrap e o endurecimento manual de limite de Compaction agora modificam
  linhas de transcrição SQLite diretamente. Chamadores de runtime passam identidade de sessão, não
  caminhos `.jsonl` graváveis.
- O replay de rotação silenciosa de sessão copia turnos recentes de usuário/assistente por
  `{agentId, sessionId}` a partir de linhas de transcrição SQLite. Ele não aceita mais
  localizadores de transcrição de origem ou destino.
- Linhas novas de sessão de runtime não armazenam mais localizadores de transcrição. Chamadores usam
  `{agentId, sessionId}` diretamente; comandos de exportação/depuração podem escolher nomes de arquivo
  de saída quando materializam linhas.
- Iniciar uma nova sessão de transcrição persistida agora sempre abre linhas SQLite por
  escopo. O gerenciador de sessão não reutiliza mais um caminho ou localizador de transcrição
  anterior da era de arquivos como identidade da nova sessão.
- Sessões de transcrição persistidas usam a API explícita
  `openTranscriptSessionManagerForSession({agentId, sessionId})`. As antigas
  fachadas estáticas `SessionManager.create/openForSession/list/forkFromSession` foram
  removidas para que testes e código de runtime não possam recriar acidentalmente a descoberta de sessão
  da era de arquivos.
- O runtime de Plugin não expõe mais `api.runtime.agent.session.resolveTranscriptLocatorPath`;
  código de Plugin usa auxiliares de linha SQLite e valores de escopo.
- A superfície pública do SDK `session-store-runtime` agora exporta apenas auxiliares de linha de sessão
  e linha de transcrição. Auxiliares focados de schema/caminho/transação SQLite
  vivem em `sqlite-runtime`; auxiliares brutos de open/close/reset permanecem apenas locais
  para testes first-party.
- Classificadores legados de nomes de arquivo `.jsonl` de trajetória/checkpoint agora vivem no
  módulo de arquivo de sessão legado do Doctor. A validação de sessão do core não importa mais
  auxiliares de artefato de arquivo para decidir ids normais de sessão SQLite.
- Execuções de subagente bloqueantes de Active Memory usam linhas de transcrição SQLite em vez de
  criar arquivos `session.jsonl` temporários ou persistidos sob o estado do Plugin. A
  opção antiga `transcriptDir` foi removida.
- A geração de slug avulsa e as execuções do planejador Crestodian usam linhas de transcrição SQLite
  em vez de criar arquivos `session.jsonl` temporários.
- Execuções do auxiliar `llm-task` e a extração oculta de compromisso também usam linhas de
  transcrição SQLite, então essas sessões auxiliares somente de modelo não criam mais
  arquivos de transcrição JSON/JSONL temporários.
- `TranscriptSessionManager` agora é apenas um escopo de transcrição SQLite aberto.
  Código de runtime o abre com `openTranscriptSessionManagerForSession({agentId,
sessionId})`; fluxos de criação, branch, continuidade, listagem e fork vivem em seus
  auxiliares proprietários de linha SQLite, em vez de fachadas estáticas de gerenciador.
  Código de Doctor/importação/depuração lida com arquivos de origem legados explícitos fora do
  gerenciador de sessão de runtime.
- Os métodos obsoletos de fachada `SessionManager.newSession()` e
  `SessionManager.createBranchedSession()` foram removidos. Novas
  sessões e descendentes de transcrição são criados por seu workflow SQLite proprietário
  em vez de modificar um gerenciador já aberto para uma sessão persistida
  diferente.
- Decisões de fork de transcrição pai e criação de fork não aceitam mais
  `storePath` ou `sessionsDir`; elas usam escopo de transcrição SQLite `{agentId, sessionId}`
  em vez de metadados de caminho do sistema de arquivos retidos.
- Memory-host não exporta mais auxiliares no-op de classificação de transcrição
  de diretório de sessão; a filtragem de transcrição agora deriva de metadados de linha SQLite
  durante a construção de entradas.
- Testes de exportação de sessão de Memory-host e QMD usam escopos de transcrição SQLite. Caminhos antigos
  `agents/<agentId>/sessions/*.jsonl` ficam cobertos apenas quando um teste está
  intencionalmente provando compatibilidade de Doctor/importação/exportação.
- A inspeção de sessão bruta do QA-lab agora usa `sessions.list` pelo Gateway
  em vez de ler `agents/qa/sessions/sessions.json`; o feedback do MSteams
  anexa diretamente às transcrições SQLite sem fabricar um caminho JSONL.
- Turnos compartilhados de canais de entrada agora carregam `{agentId, sessionKey}` em vez de um
  `storePath` legado. Os caminhos de gravação de LINE, WhatsApp, Slack, Discord, Telegram, Matrix, Signal,
  iMessage, BlueBubbles, Feishu, Google Chat, IRC, Nextcloud Talk, Zalo,
  Zalo Personal, QA Channel, Microsoft Teams, Mattermost, Synology Chat, Tlon,
  Twitch e QQBot agora leem metadados updated-at e registram
  linhas de sessão de entrada por meio da identidade SQLite.
- A persistência do localizador de transcrição foi removida das linhas de sessão ativa.
  `resolveSessionTranscriptTarget` retorna `agentId`, `sessionId` e metadados opcionais
  de tópico; doctor é o único código que importa nomes de arquivos de transcrição legados.
- Os cabeçalhos de transcrição em runtime começam na versão SQLite `1`. Atualizações de formatos JSONL V1/V2/V3
  antigos existem apenas na importação do doctor e normalizam cabeçalhos importados para
  a versão atual de transcrição SQLite antes que as linhas sejam armazenadas.
- A proteção database-first agora proíbe `SessionManager.listAll` e
  `SessionManager.forkFromSession`; fluxos de listagem de sessões e fork/restore
  devem permanecer em APIs SQLite por linha/escopo.
- A proteção também proíbe nomes de helpers legados de análise JSONL de transcrição/reparo de branch ativa
  fora do código de doctor/importação, para que o runtime não possa criar um segundo caminho legado de
  migração de transcrições.
- Execuções PI incorporadas rejeitam handles de transcrição recebidos. Elas usam a identidade SQLite
  `{agentId, sessionId}` antes do início do worker e novamente antes que a
  tentativa toque o estado de transcrição. Uma entrada obsoleta `/tmp/*.jsonl` não pode selecionar um
  alvo de escrita em runtime.
- Registros de trace de cache, payload da Anthropic, stream bruto e timeline de diagnósticos
  agora escrevem em linhas SQLite tipadas `diagnostic_events`. Bundles de estabilidade do Gateway
  agora escrevem em linhas SQLite tipadas `diagnostic_stability_bundles`. Os caminhos legados de substituição JSONL
  `diagnostics.cacheTrace.filePath`, `OPENCLAW_CACHE_TRACE_FILE`,
  `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE` e
  `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` foram removidos, e
  a captura normal de estabilidade não escreve mais arquivos `logs/stability/*.json`.
- A persistência de Cron agora reconcilia linhas SQLite `cron_jobs` em vez de
  excluir/reinserir a tabela inteira de jobs a cada salvamento. Writebacks de destino de Plugin
  atualizam diretamente as linhas cron correspondentes e mantêm o estado cron de runtime na
  mesma transação do banco de dados de estado.
- Chamadores do runtime de Cron agora usam uma chave estável de armazenamento cron SQLite. Caminhos legados
  `cron.store` são apenas entradas de importação do doctor; caminhos de gateway de produção, manutenção de tarefas,
  status, log de execução e writeback de destino do Telegram usam
  `resolveCronStoreKey` e não normalizam mais a chave como caminho. O status de Cron agora
  relata `storeKey` em vez do campo antigo em formato de arquivo `storePath`.
- O carregamento e agendamento do runtime de Cron não normalizam mais formatos legados de jobs persistidos,
  como `jobId`, `schedule.cron`, `atMs` numérico, booleanos em string ou
  `sessionTarget` ausente. A importação legada do doctor é dona desses reparos antes que as linhas
  sejam inseridas no SQLite.
- O spawn do ACP não resolve nem persiste mais caminhos de arquivo JSONL de transcrição. A configuração de spawn
  e vinculação de thread persiste diretamente a linha de sessão SQLite e mantém o
  id de sessão como a identidade de transcrição retida.
- APIs de metadados de sessão ACP agora leem/listam/fazem upsert de linhas SQLite por `agentId` e
  não expõem mais `storePath` como parte do contrato de entrada de sessão ACP.
- A contabilização de uso de sessão e a agregação de uso do gateway agora resolvem transcrições
  apenas por `{agentId, sessionId}`. O cache de custo/uso e os resumos de sessões descobertas
  não sintetizam nem retornam mais strings localizadoras de transcrição.
- Anexação de chat do Gateway, persistência abort-partial, `/sessions.send` e
  escritas de transcrição de mídia do webchat anexam diretamente pelo escopo de transcrição SQLite.
  O helper de injeção de transcrição do gateway não aceita mais um parâmetro
  `transcriptLocator`.
- A descoberta de transcrições SQLite agora lista apenas escopos e estatísticas de transcrição:
  `{agentId, sessionId, updatedAt, eventCount}`. O helper de compatibilidade morto
  `listSqliteSessionTranscriptLocators` e o campo por linha
  `locator` foram removidos.
- O runtime de reparo de transcrição agora expõe apenas
  `repairTranscriptSessionStateIfNeeded({agentId, sessionId})`. O helper antigo
  baseado em localizador foi excluído; código de doctor/debug lê caminhos de arquivo de origem explícitos
  e nunca migra strings localizadoras.
- O runtime do ledger de replay ACP agora armazena linhas de replay por sessão no banco de dados de estado
  SQLite compartilhado em vez de `acp/event-ledger.json`; doctor importa e
  remove o arquivo legado.
- Helpers de leitura de transcrição do Gateway agora ficam em
  `src/gateway/session-transcript-readers.ts` em vez do nome de módulo antigo
  `session-utils.fs`. A verificação de histórico de retry fallback recebe um nome para
  conteúdo de transcrição SQLite em vez da antiga superfície de helper de arquivo.
- Helpers de chat injetado e Compaction do Gateway agora passam o escopo de transcrição SQLite
  por APIs internas de helper em vez de nomear valores como caminhos de transcrição ou
  arquivos de origem.
- A detecção de continuação de bootstrap agora verifica linhas de transcrição SQLite por meio de
  `hasCompletedBootstrapTranscriptTurn`; ela não expõe mais um nome de helper em formato de arquivo.
- Testes de embedded-runner agora usam identidade de transcrição SQLite, e abrir um novo
  gerenciador de transcrições sempre exige um `sessionId` explícito.
- Helpers de indexação de memória agora usam terminologia de transcrição SQLite de ponta a ponta:
  o host exporta `listSessionTranscriptScopesForAgent` e
  `sessionTranscriptKeyForScope`, filas de sincronização direcionada usam `sessionTranscripts`,
  resultados públicos de busca de sessão expõem caminhos opacos `transcript:<agent>:<session>`,
  e a chave interna de origem do DB é `session:<session>` sob
  `source_kind='sessions'` em vez de um caminho de arquivo falso.
- O helper genérico de deduplicação persistente do SDK de Plugin não expõe mais opções em formato de arquivo.
  Chamadores fornecem chaves de escopo SQLite e linhas duráveis de deduplicação vivem no
  estado compartilhado do Plugin.
- Tokens SSO do Microsoft Teams foram movidos de arquivos JSON bloqueados para o estado SQLite do Plugin.
  Doctor importa `msteams-sso-tokens.json`, reconstrói chaves canônicas de token SSO
  a partir dos payloads e remove o arquivo de origem. Tokens OAuth delegados permanecem
  no limite existente de arquivo privado de credenciais.
- O estado de cache de sincronização do Matrix foi movido de `bot-storage.json` para o estado SQLite do Plugin.
  Doctor importa payloads de sincronização legados brutos ou encapsulados e remove o
  arquivo de origem. Clientes Matrix ativos e QA Matrix passam um diretório raiz de armazenamento de sincronização SQLite,
  não um caminho falso `sync-store.json` ou `bot-storage.json`.
- O status de migração de criptografia legada do Matrix foi movido de
  `legacy-crypto-migration.json` para o estado SQLite do Plugin. Doctor importa o
  arquivo de status antigo; snapshots IndexedDB do SDK Matrix foram movidos de
  `crypto-idb-snapshot.json` para blobs SQLite do Plugin. Chaves de recuperação e
  credenciais do Matrix são linhas de estado SQLite do Plugin; seus arquivos JSON antigos são apenas
  entradas de migração do doctor.
- Logs de atividade do Memory Wiki agora usam estado SQLite do Plugin em vez de
  `.openclaw-wiki/log.jsonl`. O provedor de migração do Memory Wiki importa logs JSONL
  antigos; markdown do wiki e conteúdo do cofre do usuário permanecem baseados em arquivo como
  conteúdo do workspace.
- O Memory Wiki não cria mais `.openclaw-wiki/state.json` nem o diretório não usado
  `.openclaw-wiki/locks`. O provedor de migração remove esses arquivos aposentados
  de metadados do Plugin se um cofre mais antigo ainda os tiver.
- Entradas de auditoria do Crestodian agora usam estado SQLite do Plugin do core em vez de
  `audit/crestodian.jsonl`. Doctor importa o log de auditoria JSONL legado e
  o remove após importação bem-sucedida.
- Entradas de auditoria de escrita/observação de config agora usam estado SQLite do Plugin do core
  em vez de `logs/config-audit.jsonl`. Doctor importa o log de auditoria JSONL legado e
  o remove após importação bem-sucedida.
- O companion do macOS não escreve mais sidecars locais do app `logs/config-audit.jsonl` ou
  `logs/config-health.json` ao editar `openclaw.json`. O arquivo de config
  permanece baseado em arquivo, snapshots de recuperação permanecem ao lado do arquivo de config,
  e o estado durável de auditoria/saúde de config pertence ao armazenamento SQLite do Gateway.
- Aprovações pendentes de resgate do Crestodian agora usam estado SQLite do Plugin do core em vez de
  `crestodian/rescue-pending/*.json`. Doctor importa arquivos legados de aprovação pendente
  e os remove após importação bem-sucedida.
- O estado temporário de armamento do Phone Control agora usa estado SQLite do Plugin em vez de
  `plugins/phone-control/armed.json`. Doctor importa o arquivo legado de estado armado
  para o namespace `phone-control/arm-state` e remove o arquivo.
- Doctor não repara mais transcrições JSONL no local nem cria arquivos JSONL de backup.
  Ele importa o branch ativo para SQLite e remove a origem legada.
- A busca de transcrição do hook de memória de sessão usa leituras SQLite apenas por escopo `{agentId, sessionId}`.
  Seu helper não aceita nem deriva mais localizadores de transcrição,
  leituras de arquivo legadas ou opções de reescrita de arquivo.
- Bindings de conversa do app-server Codex agora chaveiam o estado SQLite do Plugin por
  chave de sessão OpenClaw ou escopo explícito `{agentId, sessionId}`. Eles não devem
  preservar bindings fallback de caminho de transcrição.
- Leituras de histórico espelhado do app-server Codex usam apenas o escopo de transcrição SQLite;
  elas não devem recuperar identidade a partir de caminhos de arquivo de transcrição.
- Caminhos de ordenação de papéis e redefinição de Compaction não desvinculam mais arquivos antigos de transcrição;
  a redefinição apenas rotaciona a linha de sessão SQLite e a identidade de transcrição.
- Respostas de redefinição e checkpoint do Gateway retornam linhas de sessão limpas mais ids de sessão.
  Elas não sintetizam mais localizadores de transcrição SQLite para clientes.
- Dreaming do memory-core não remove mais linhas de sessão sondando arquivos JSONL ausentes.
  A limpeza de subagentes passa pela API de runtime de sessão em vez de
  verificações de existência no sistema de arquivos. Seus testes de ingestão de transcrições semeiam linhas SQLite
  diretamente em vez de criar fixtures `agents/<id>/sessions` ou placeholders
  de localizador.
- A indexação de transcrições de memória pode expor `transcript:<agentId>:<sessionId>` como um
  caminho virtual de resultado de busca para helpers de citação/leitura. A origem durável do índice é
  relacional (`source_kind='sessions'`, `source_key='session:<sessionId>'`,
  `session_id=<sessionId>`), portanto o valor não é um localizador de transcrição de runtime,
  não é um caminho de sistema de arquivos e nunca deve ser passado de volta para APIs de runtime de sessão.
- O status de memória do doctor do Gateway lê contagens de short-term recall e phase-signal
  a partir de linhas de estado SQLite do Plugin em vez de `memory/.dreams/*.json`; a saída da CLI e
  do doctor agora rotula esse armazenamento como um armazenamento SQLite, não como um caminho.
- Runtime do memory-core, status da CLI, métodos do doctor do Gateway e facades do SDK de Plugin
  não auditam nem arquivam mais arquivos legados `.dreams/session-corpus`.
  Esses arquivos são apenas entradas de migração; doctor os importa para SQLite e
  exclui a origem após verificação. Linhas ativas de evidência de ingestão de sessão
  agora usam o caminho virtual SQLite `memory/session-ingestion/<day>.txt`; o runtime
  nunca escreve nem deriva estado de `.dreams/session-corpus`.
- Artefatos públicos do memory-core expõem eventos de host SQLite como o artefato JSON virtual
  `memory/events/memory-host-events.json`; eles não reutilizam mais o
  caminho de origem legado `.dreams/events.jsonl`.
- Registros de sandbox container/browser agora usam a tabela SQLite compartilhada
  `sandbox_registry_entries` com colunas tipadas de sessão, imagem, timestamp,
  backend/config e porta de navegador. Doctor importa arquivos JSON legados monolíticos e
  fragmentados de registro e remove origens bem-sucedidas. Leituras de runtime usam
  as colunas tipadas de linha como fonte da verdade; `entry_json` é apenas uma cópia de replay/debug.
- Compromissos agora usam uma tabela compartilhada tipada `commitments` em vez de um
  blob JSON de armazenamento inteiro. Salvamentos de snapshot fazem upsert por id de compromisso e excluem apenas
  linhas ausentes em vez de limpar e reinserir a tabela. O runtime carrega
  compromissos a partir de colunas tipadas de escopo, janela de entrega, status, tentativa e texto;
  `record_json` é apenas uma cópia de replay/debug. Doctor importa o legado
  `commitments.json` e o remove após uma importação bem-sucedida.
- Definições de job de Cron, estado de agendamento e histórico de execução não têm mais escritores
  ou leitores JSON em runtime. O runtime usa linhas `cron_jobs` com agendamento tipado,
  colunas de carga útil, entrega, alerta de falha, sessão, status e estado de tempo de execução, além de metadados
  tipados de `cron_run_logs` para status, resumo de diagnóstico, status/erro de entrega,
  sessão/execução, modelo e totais de tokens. `job_json` é apenas uma cópia de reprodução/depuração; `state_json` mantém diagnósticos
  aninhados de tempo de execução que ainda não têm campos de consulta frequente, enquanto o tempo de execução
  reidrata campos de estado frequentes a partir de colunas tipadas. Doctor importa
  arquivos legados `jobs.json`, `jobs-state.json` e `runs/*.jsonl` e remove
  as fontes importadas. Regravações de destinos de Plugin atualizam linhas `cron_jobs`
  correspondentes em vez de carregar e substituir todo o armazenamento de cron.
- A inicialização do Gateway ignora marcadores legados `notify: true` na projeção de
  tempo de execução. Doctor os traduz em entrega SQLite explícita quando
  `cron.webhook` é válido, remove marcadores inertes quando ele não está definido e os preserva
  com um aviso quando o webhook configurado é inválido.
- Filas de entrega de saída e de sessão agora armazenam status da fila, tipo de entrada,
  chave de sessão, canal, destino, id da conta, contagem de tentativas, última tentativa/erro,
  estado de recuperação e marcadores de envio de plataforma como colunas tipadas na tabela compartilhada
  `delivery_queue_entries`. A recuperação em tempo de execução lê esses campos frequentes das
  colunas tipadas, e mutações de repetição/recuperação atualizam essas colunas diretamente
  sem reescrever o JSON de reprodução. A carga útil JSON completa permanece apenas como o
  blob de reprodução/depuração para corpos de mensagem e outros dados frios de reprodução.
- Registros gerenciados de imagens de saída agora usam linhas compartilhadas tipadas
  `managed_outgoing_image_records`, com bytes de mídia ainda armazenados em
  `media_blobs`. O registro JSON permanece apenas como uma cópia de reprodução/depuração.
- Preferências do seletor de modelos do Discord, hashes de implantação de comandos e vinculações de threads
  agora usam estado de Plugin SQLite compartilhado. Seus planos de importação JSON legados ficam na
  superfície de migração de configuração/doctor do Plugin Discord, não no código de migração do núcleo.
- Detectores de importação legada de Plugin usam módulos nomeados para doctor, como
  `doctor-legacy-state.ts` ou `doctor-state-imports.ts`; módulos normais de tempo de execução de canal
  não devem importar detectores de JSON legado.
- Cursores de atualização do BlueBubbles e marcadores de deduplicação de entrada agora usam estado de Plugin SQLite
  compartilhado. Seus planos de importação JSON legados ficam na superfície de migração de
  configuração/doctor do Plugin BlueBubbles, não no código de migração do núcleo.
- Offsets de atualização do Telegram, linhas de cache de stickers, linhas de cache de mensagens enviadas,
  linhas de cache de nomes de tópicos e vinculações de threads agora usam estado de Plugin SQLite
  compartilhado. Seus planos de importação JSON legados ficam na superfície de migração de
  configuração/doctor do Plugin Telegram, não no código de migração do núcleo.
- Cursores de atualização do iMessage, mapeamentos de id curto de resposta e linhas de deduplicação de eco enviado
  agora usam estado de Plugin SQLite compartilhado. Os arquivos antigos `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` e `imessage/sent-echoes.jsonl` são
  apenas entradas do doctor.
- Linhas de deduplicação de mensagens do Feishu agora usam estado de Plugin SQLite compartilhado em vez de
  arquivos `feishu/dedup/*.json`. Seu plano de importação JSON legado fica na superfície de migração de
  configuração/doctor do Plugin Feishu, não no código de migração do núcleo.
- Conversas, enquetes, buffers de upload pendente e aprendizados de feedback do Microsoft Teams
  agora usam tabelas compartilhadas de estado/blob de Plugin SQLite. O caminho de upload pendente
  usa `plugin_blob_entries`, para que buffers de mídia sejam armazenados como BLOBs SQLite
  em vez de JSON em base64. Os nomes dos helpers de tempo de execução agora usam nomenclatura de SQLite/estado
  em vez de nomenclatura de armazenamento de arquivos `*-fs`, e o antigo shim `storePath` foi removido
  desses armazenamentos. Seu plano de importação JSON legado fica na superfície de migração de
  configuração/doctor do Plugin Microsoft Teams.
- Mídia de saída hospedada do Zalo agora usa `plugin_blob_entries` SQLite compartilhado
  em vez de sidecars temporários JSON/bin de `openclaw-zalo-outbound-media`.
- HTML e metadados do visualizador de diffs agora usam `plugin_blob_entries` SQLite compartilhado
  em vez de arquivos temporários `meta.json`/`viewer.html`. Saídas PNG/PDF renderizadas permanecem
  materializações temporárias porque a entrega por canal ainda precisa de um caminho de arquivo.
- Documentos gerenciados do Canvas agora usam `plugin_blob_entries` SQLite compartilhado em vez
  de um diretório padrão `state/canvas/documents`. O host do Canvas serve esses
  blobs diretamente; arquivos locais são criados apenas para conteúdo explícito de operador em `host.root`
  ou materialização temporária quando um leitor de mídia downstream
  exige um caminho.
- Decisões de auditoria do File Transfer agora usam `plugin_state_entries` SQLite compartilhado
  em vez do log de tempo de execução ilimitado `audit/file-transfer.jsonl`. Doctor
  importa o arquivo de auditoria JSONL legado para o estado do Plugin e remove a fonte
  após uma importação limpa.
- Locações de processo ACPX e identidade de instância do Gateway agora usam estado de Plugin SQLite
  compartilhado. Doctor importa o arquivo legado `gateway-instance-id` para o estado do Plugin
  e remove a fonte.
- Scripts wrapper gerados pelo ACPX e o diretório inicial isolado do Codex são materialização temporária
  sob a raiz temporária do OpenClaw, não estado durável do OpenClaw. Os
  registros duráveis de tempo de execução do ACPX são a locação SQLite e as linhas de instância do Gateway;
  a antiga superfície de configuração `stateDir` do ACPX foi removida porque nenhum estado de tempo de execução
  é mais gravado ali.
- Anexos de mídia do Gateway agora usam a tabela SQLite compartilhada `media_blobs` como
  o armazenamento canônico de bytes. Caminhos locais retornados para superfícies de compatibilidade de canal e sandbox
  são materializações temporárias da linha do banco de dados, não o
  armazenamento durável de mídia. Allowlists de mídia em tempo de execução não incluem mais raízes legadas
  `$OPENCLAW_STATE_DIR/media` ou `media` do diretório de configuração; esses diretórios são
  apenas fontes de importação do doctor.
- A conclusão de shell não grava mais arquivos de cache `$OPENCLAW_STATE_DIR/completions/*`.
  Caminhos de smoke de instalação, doctor, atualização e release usam saída de conclusão
  gerada ou sourcing de perfil em vez de arquivos duráveis de cache de conclusão.
- O staging de upload de Skills do Gateway agora usa linhas compartilhadas `skill_uploads`. Metadados de upload,
  chaves de idempotência e bytes de arquivo vivem no SQLite; o instalador
  recebe apenas um caminho de arquivo temporário materializado enquanto uma instalação está
  em execução.
- Anexos inline de subagentes não são mais materializados em
  `.openclaw/attachments/*` no workspace. O caminho de spawn prepara entradas semente de VFS SQLite,
  execuções inline semeiam essas entradas no namespace de scratch de tempo de execução por agente,
  e ferramentas com backing em disco sobrepõem esse scratch SQLite para caminhos de anexos. As
  antigas colunas de registro de diretório de anexos de execução de subagente e hooks de limpeza foram removidos.
- A hidratação de imagens da CLI não mantém mais arquivos de cache estáveis `openclaw-cli-images`.
  Backends externos da CLI ainda recebem caminhos de arquivo, mas esses caminhos são
  materializações temporárias por execução com limpeza.
- Diagnósticos de rastreamento de cache, diagnósticos de carga útil da Anthropic, diagnósticos brutos de stream de modelo,
  eventos de linha do tempo de diagnósticos e bundles de estabilidade do Gateway agora
  gravam linhas SQLite em vez de arquivos `logs/*.jsonl` ou
  `logs/stability/*.json`.
  Flags e variáveis de ambiente de substituição de caminho de tempo de execução foram removidas; comandos de exportação/depuração
  podem materializar arquivos explicitamente a partir de linhas do banco de dados.
- O companion do macOS não tem mais um gravador rotativo `diagnostics.jsonl`. Logs do aplicativo
  vão para logging unificado, e diagnósticos duráveis do Gateway permanecem apoiados por SQLite.
- A lista de registros do guardião de porta do macOS agora usa linhas compartilhadas tipadas
  `macos_port_guardian_records` em vez de um arquivo JSON em Application Support
  ou blob singleton opaco.
- Locks singleton do Gateway agora usam linhas compartilhadas tipadas `state_leases` sob
  o escopo `gateway_locks` em vez de arquivos de lock em diretório temporário. A documentação de solução de problemas
  de Fly e OAuth agora aponta para o lock de atualização de lease/autenticação do SQLite em vez
  de limpeza obsoleta de lock de arquivo.
- O estado de sentinela de reinicialização do Gateway agora usa linhas compartilhadas tipadas
  `gateway_restart_sentinel` em vez de `restart-sentinel.json`; o tempo de execução
  lê tipo de sentinela, status, roteamento, mensagem, continuação e estatísticas de
  colunas tipadas. `payload_json` é apenas uma cópia de reprodução/depuração. O código de tempo de execução limpa
  a linha SQLite diretamente e não carrega mais encanamento de limpeza de arquivo.
- O estado de intenção de reinicialização do Gateway e de handoff do supervisor agora usa linhas compartilhadas tipadas
  `gateway_restart_intent` e `gateway_restart_handoff` em vez de
  sidecars `gateway-restart-intent.json` e
  `gateway-supervisor-restart-handoff.json`.
- A coordenação singleton do Gateway agora usa linhas tipadas `state_leases` sob
  `gateway_locks` em vez de gravar arquivos `gateway.<hash>.lock`. A linha de lease
  possui o proprietário do lock, expiração, heartbeat e carga útil de depuração; o SQLite possui o
  limite atômico de aquisição/liberação. A opção aposentada de diretório de lock de arquivo
  foi removida; os testes usam a identidade da linha SQLite diretamente.
- O antigo helper não referenciado de relatório de uso do cron que varria arquivos `cron/runs/*.jsonl`
  foi excluído. Relatórios de histórico de execução do cron devem ler as linhas SQLite tipadas
  `cron_run_logs`.
- A recuperação de reinicialização da sessão principal agora descobre agentes candidatos por meio do
  registro SQLite `agent_databases` em vez de varrer diretórios `agents/*/sessions`.
- A recuperação de corrupção de sessão do Gemini agora exclui apenas a linha de sessão SQLite;
  ela não precisa mais de um gate legado `storePath` nem tenta desvincular um
  caminho derivado de transcript JSONL.
- O tratamento de substituição de caminho agora trata valores literais de ambiente `undefined`/`null`
  como não definidos, evitando bancos de dados acidentais `undefined/state/*.sqlite`
  na raiz do repo durante testes ou handoffs de shell.
- Impressões digitais de saúde da configuração agora usam linhas compartilhadas tipadas `config_health_entries`
  em vez de `logs/config-health.json`, mantendo o arquivo de configuração normal como
  o único documento de configuração sem credenciais. O companion do macOS mantém apenas
  estado de saúde local ao processo e não recria o antigo sidecar JSON.
- O tempo de execução de perfil de autenticação não importa nem grava mais arquivos JSON de credenciais. O
  armazenamento canônico de credenciais é SQLite; `auth-profiles.json`, `auth.json`
  por agente e `credentials/oauth.json` compartilhado são entradas de migração do doctor
  que são removidas após a importação.
- Testes de salvamento/estado de perfil de autenticação agora verificam diretamente tabelas tipadas de autenticação SQLite
  e usam nomes de arquivos legados de perfil de autenticação apenas para entradas de migração do doctor.
- `openclaw secrets apply` limpa apenas o arquivo de configuração, o arquivo de ambiente e o armazenamento SQLite
  de perfis de autenticação. Ele não carrega mais lógica de compatibilidade que edita
  o `auth.json` aposentado por agente; doctor é responsável por importar e excluir esse arquivo.
- Planos e aplicações de migração de segredo do Hermes importaram perfis de chave de API diretamente
  para o armazenamento SQLite de perfis de autenticação. Ele não grava nem verifica mais
  `auth-profiles.json` como um destino intermediário.
- A documentação de autenticação voltada ao usuário agora descreve
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>` em vez de
  instruir usuários a inspecionar ou copiar `auth-profiles.json`; nomes JSON legados de OAuth/autenticação
  permanecem documentados apenas como entradas de importação do doctor.
- Helpers de caminho de estado do núcleo não expõem mais o arquivo aposentado `credentials/oauth.json`.
  O nome de arquivo legado é local ao caminho de importação de autenticação do doctor.
- Documentos de instalação, segurança, onboarding, autenticação de modelo e SecretRef agora descrevem
  linhas SQLite de perfil de autenticação e backup/migração de estado completo em vez de
  arquivos JSON de perfil de autenticação por agente.
- A descoberta de modelos do PI agora passa credenciais canônicas para o armazenamento de autenticação em memória
  `pi-coding-agent`. Ela não cria, limpa nem grava mais
  `auth.json` por agente durante a descoberta.
- Configurações de gatilho e roteamento do Voice Wake agora usam tabelas SQLite compartilhadas tipadas
  em vez de `settings/voicewake.json`, `settings/voicewake-routing.json` ou
  linhas genéricas opacas; doctor importa os arquivos JSON legados e os remove após uma
  migração bem-sucedida.
- O estado de verificação de atualização agora usa uma linha compartilhada tipada `update_check_state` em vez de
  `update-check.json` ou um blob genérico opaco; doctor importa
  o arquivo JSON legado e o remove após uma migração bem-sucedida.
- O estado de saúde da configuração agora usa linhas compartilhadas tipadas `config_health_entries` em vez
  de `logs/config-health.json` ou um blob genérico opaco; doctor
  importa o arquivo JSON legado e o remove após uma migração bem-sucedida.
- Aprovações de vinculação de conversas de Plugin agora usam linhas tipadas
  `plugin_binding_approvals` em vez de estado SQLite compartilhado opaco ou
  `plugin-binding-approvals.json`; o arquivo legado é uma entrada de migração do doctor.
- Bindings genéricos da conversa atual agora armazenam linhas tipadas
  `current_conversation_bindings` em vez de reescrever
  `bindings/current-conversations.json`; o doctor importa o arquivo JSON legado e
  o remove após uma migração bem-sucedida.
- Ledgers de sincronização de fontes importadas da Memory Wiki agora armazenam uma linha de estado de Plugin SQLite
  por chave de vault/fonte em vez de reescrever `.openclaw-wiki/source-sync.json`;
  o provedor de migração importa e remove o ledger JSON legado.
- Registros de execução de importação do ChatGPT da Memory Wiki agora armazenam uma linha de estado de Plugin SQLite
  por id de vault/execução em vez de gravar `.openclaw-wiki/import-runs/*.json`.
  Snapshots de rollback continuam sendo arquivos explícitos do vault até que o arquivamento
  de snapshots de execução de importação seja movido para o armazenamento de blobs.
- Digests compilados da Memory Wiki agora armazenam linhas de blob de Plugin SQLite em vez de
  gravar `.openclaw-wiki/cache/agent-digest.json` e
  `.openclaw-wiki/cache/claims.jsonl`. O provedor de migração importa arquivos de cache
  antigos e remove o diretório de cache quando ele fica vazio.
- O rastreamento de instalação de Skills do ClawHub agora armazena uma linha de estado de Plugin SQLite por
  workspace/skill em vez de gravar ou ler arquivos auxiliares `.clawhub/lock.json` e
  `.clawhub/origin.json` em runtime. O código de runtime usa objetos de estado de instalação rastreada
  em vez de abstrações de lockfile/origem com formato de arquivo. O doctor
  importa os arquivos auxiliares legados dos workspaces de agentes configurados e os remove
  após uma importação limpa.
- O índice de Plugins instalados agora lê e grava a linha singleton tipada de SQLite compartilhado
  `installed_plugin_index` em vez de `plugins/installs.json`; o
  arquivo JSON legado é apenas uma entrada de migração do doctor e é removido após a importação.
- O helper de caminho legado `plugins/installs.json` agora vive no código legado do doctor.
  Módulos de índice de Plugins em runtime expõem apenas opções de persistência baseadas em SQLite,
  não um caminho de arquivo JSON.
- Sentinela de reinicialização do Gateway, intenção de reinicialização e estado de handoff do supervisor agora usam
  linhas tipadas de SQLite compartilhado (`gateway_restart_sentinel`,
  `gateway_restart_intent` e `gateway_restart_handoff`) em vez de blobs opacos
  genéricos. O código de reinicialização em runtime não tem contrato de sentinela/intenção/handoff
  com formato de arquivo.
- Cache de sincronização do Matrix, metadados de armazenamento, bindings de threads, marcadores de deduplicação de entrada,
  estado de cooldown de verificação de inicialização, snapshots criptográficos de IndexedDB do SDK,
  credenciais e chaves de recuperação agora usam tabelas compartilhadas de estado/blob de Plugin SQLite.
  Structs de caminho em runtime não expõem mais um caminho de metadados `storage-meta.json`;
  esse nome de arquivo é apenas uma entrada de migração legada. O plano de importação de JSON legado
  deles vive na superfície de setup/migração do doctor do Plugin Matrix.
- A inicialização do Matrix não varre, relata nem conclui mais estado de arquivo legado do Matrix.
  Detecção de arquivos do Matrix, criação de snapshots criptográficos legados, estado de migração de restauração
  de chaves de sala, importação e remoção de fonte são todos de propriedade do doctor.
- Barrels de migração em runtime do Matrix foram removidos. Helpers de detecção
  e mutação de estado/criptografia legados são importados diretamente pelo doctor do Matrix em vez de fazerem
  parte da superfície de API de runtime.
- Marcadores de reutilização de snapshot de migração do Matrix agora vivem no estado de Plugin SQLite
  em vez de `matrix/migration-snapshot.json`; o doctor ainda pode reutilizar o mesmo
  arquivo pré-migração verificado sem gravar um arquivo auxiliar de estado.
- Cursores do barramento Nostr e estado de publicação de perfil agora usam estado de Plugin SQLite compartilhado.
  O plano de importação de JSON legado deles vive na superfície de setup/migração do doctor
  do Plugin Nostr.
- Alternâncias de sessão do Active Memory agora usam estado de Plugin SQLite compartilhado em vez de
  `session-toggles.json`; reativar a memória exclui a linha em vez de
  reescrever um objeto JSON.
- Propostas e contadores de revisão do Skill Workshop agora usam estado de Plugin SQLite compartilhado
  em vez de stores `skill-workshop/<workspace>.json` por workspace. Cada
  proposta é uma linha separada em `skill-workshop/proposals`, e o contador de revisão
  é uma linha separada em `skill-workshop/reviews`.
- Execuções de subagente revisor do Skill Workshop agora usam o resolvedor de transcritos de sessão
  de runtime em vez de criar caminhos auxiliares de sessão
  `skill-workshop/<sessionId>.json`.
- Leases de processo do ACPX agora usam estado de Plugin SQLite compartilhado em
  `acpx/process-leases` em vez de um registro de arquivo inteiro `process-leases.json`.
  Cada lease é armazenado como sua própria linha, preservando a limpeza de processos obsoletos na inicialização
  sem um caminho de reescrita JSON em runtime.
- Scripts wrapper do ACPX e a home isolada do Codex são gerados na
  raiz temporária do OpenClaw. Eles são recriados conforme necessário e não são entradas de backup
  nem de migração.
- A persistência do registro de execuções de subagentes usa linhas tipadas compartilhadas `subagent_runs`. O
  caminho antigo `subagents/runs.json` agora é apenas uma entrada de migração do doctor, e
  nomes de helpers de runtime não descrevem mais a camada de estado como baseada em disco.
  Testes de runtime não criam mais fixtures `runs.json` inválidas ou vazias para provar
  o comportamento do registro; eles semeiam/leem linhas SQLite diretamente.
- O backup prepara o diretório de estado antes de arquivar, copia arquivos que não são de banco de dados,
  cria snapshots de bancos de dados `*.sqlite` com `VACUUM INTO`, omite arquivos auxiliares WAL/SHM
  ativos, registra metadados de snapshot no manifesto do arquivo e registra
  execuções de backup concluídas no SQLite com o manifesto do arquivo. `openclaw backup
create` valida o arquivo gravado por padrão; `--no-verify` é o caminho rápido
  explícito.
- `openclaw backup restore` valida o arquivo antes da extração, reutiliza o
  manifesto normalizado do verificador e restaura ativos verificados do manifesto para seus
  caminhos de origem registrados. Ele exige `--yes` para gravações e aceita `--dry-run`
  para um plano de restauração.
- O filtro antigo de caminhos voláteis de backup foi excluído. O backup não precisa mais de uma
  lista de exclusão de live-tar para arquivos JSON/JSONL legados de sessão ou cron porque snapshots SQLite
  são preparados antes da criação do arquivo.
- A preparação de workspace de setup e onboarding simples não cria mais diretórios
  `agents/<agentId>/sessions/`. Ela cria apenas config/workspace;
  linhas de sessão SQLite e linhas de transcrito são criadas sob demanda no
  banco de dados por agente.
- O reparo de permissões de segurança agora mira os bancos de dados SQLite global e por agente
  mais arquivos auxiliares WAL/SHM em vez de arquivos `sessions.json` e transcritos
  JSONL.
- Nomes de runtime do registro de sandbox agora descrevem tipos de registro SQLite diretamente
  em vez de carregar terminologia legada de registro JSON pelo store ativo.
- `openclaw reset --scope config+creds+sessions` remove bancos de dados
  `openclaw-agent.sqlite` por agente mais arquivos auxiliares WAL/SHM, não apenas diretórios
  `sessions/` legados.
- Helpers de sessão agregada do Gateway agora usam nomes orientados a entradas:
  `loadCombinedSessionEntriesForGateway` retorna `{ databasePath, entries }`.
  A nomenclatura antiga de store combinado foi removida dos chamadores de runtime.
- A semeadura do canal Docker MCP agora grava a linha principal de sessão e os eventos de transcrito
  no banco de dados SQLite por agente em vez de criar
  `sessions.json` e um transcrito JSONL.
- O hook de memória de sessão incluído agora resolve contexto de sessão anterior a partir do
  SQLite por `{agentId, sessionId}`. Ele não varre, armazena nem sintetiza mais
  caminhos de transcrito ou diretórios `workspace/sessions`.
- O hook de logger de comandos incluído agora grava linhas de auditoria de comando na tabela compartilhada
  SQLite `command_log_entries` em vez de anexar a
  `logs/commands.log`.
- Allowlists de pareamento de canais agora expõem apenas helpers de leitura/gravação baseados em SQLite em
  runtime e no SDK de Plugins. O resolvedor de caminho `*-allowFrom.json` antigo e
  o leitor de arquivo vivem apenas no código de importação legada do doctor.
- `migration_runs` registra execuções de migração de estado legado com status,
  timestamps e relatórios JSON.
- `migration_sources` registra cada fonte de arquivo legado importada com hash, tamanho,
  contagem de registros, tabela de destino, id de execução, status e estado de remoção da fonte.
- `backup_runs` registra caminhos de arquivos de backup, status e manifestos JSON.
- O esquema global não mantém uma tabela de registro `agents` sem uso. A descoberta de
  bancos de dados de agentes é o registro canônico `agent_databases` até que o runtime
  tenha um proprietário real de registros de agentes.
- A config de catálogo de modelos gerada é armazenada em linhas tipadas globais de SQLite
  `agent_model_catalogs`, chaveadas por diretório do agente. Chamadores de runtime usam
  `ensureOpenClawModelCatalog`; não há API de compatibilidade `models.json` no
  código de runtime. A implementação grava SQLite e o registro PI embutido é
  hidratado a partir desse payload armazenado sem criar um arquivo `models.json`.
- A exportação markdown de transcritos de sessão QMD e a config `memory.qmd.sessions` foram
  removidas. Não há coleção de transcritos QMD, nenhum caminho de runtime
  `qmd/sessions*` e nenhuma ponte de memória de sessão baseada em arquivo.
- O runtime do memory-core importa helpers de indexação de transcritos SQLite de
  `openclaw/plugin-sdk/memory-core-host-engine-session-transcripts`, não do
  subcaminho do SDK QMD. O subcaminho QMD mantém uma reexportação de compatibilidade apenas para
  chamadores externos até que uma limpeza principal do SDK possa removê-la.
- O próprio `index.sqlite` do QMD agora é uma materialização temporária de runtime baseada na
  tabela principal SQLite `plugin_blob_entries`. O runtime não cria mais um arquivo auxiliar durável
  `~/.openclaw/agents/<agentId>/qmd`.
- O Plugin opcional `memory-lancedb` não cria mais
  `~/.openclaw/memory/lancedb` como um store implícito gerenciado pelo OpenClaw. Ele é um
  backend LanceDB externo e permanece desativado até que o operador configure um
  `dbPath` explícito.
- `check:database-first-legacy-stores` falha novo código-fonte de runtime que combina
  nomes de stores legados com APIs de sistema de arquivos em estilo de gravação. Ele também falha código-fonte
  de runtime que reintroduz os marcadores aposentados da ponte de transcritos
  `transcriptLocator` ou `sqlite-transcript://...`. Código de migração, doctor, importação
  e exportação explícita não relacionada a sessão continua permitido. Nomes de contratos legados mais amplos
  como `sessionFile`, `storePath` e facades antigas da era de arquivos de `SessionManager`
  ainda têm proprietários atuais e precisam de trabalho separado de guarda de migração
  antes de poderem se tornar uma verificação de preflight obrigatória. A guarda agora também cobre
  stores `cache/*.json` de runtime, arquivos auxiliares genéricos
  `thread-bindings.json`, JSON de estado/log de execuções de Cron, JSON de integridade de config,
  arquivos auxiliares de reinicialização e bloqueio, configurações do Voice Wake, aprovações de binding de Plugins,
  JSON de índice de Plugins instalados, JSONL de auditoria do File Transfer, logs de atividade
  da Memory Wiki, o antigo log de texto `command-logger` incluído e opções de diagnóstico
  JSONL de raw-stream do pi-mono. Ela também proíbe nomes antigos de módulos legados do doctor no nível raiz
  para que o código de compatibilidade permaneça em `src/commands/doctor/`. Handlers de depuração Android
  também usam logcat/saída em memória em vez de preparar arquivos de cache `camera_debug.log` ou
  `debug_logs.txt`.

## Formato do esquema de destino

Mantenha os esquemas explícitos. O estado de runtime de propriedade do host usa tabelas tipadas. O estado opaco de propriedade do Plugin usa `plugin_state_entries` / `plugin_blob_entries`; não há tabela `kv` genérica do host.

Banco de dados global:

```text
state_leases(scope, lease_key, owner, expires_at, heartbeat_at, payload_json, created_at, updated_at)
exec_approvals_config(config_key, raw_json, socket_path, has_socket_token, default_security, default_ask, default_ask_fallback, auto_allow_skills, agent_count, allowlist_count, updated_at_ms)
schema_meta(meta_key, role, schema_version, agent_id, app_version, created_at, updated_at)
agent_databases(agent_id, path, schema_version, last_seen_at, size_bytes)
task_runs(...)
task_delivery_state(...)
flow_runs(...)
subagent_runs(run_id, child_session_key, requester_session_key, controller_session_key, created_at, ended_at, cleanup_handled, payload_json)
current_conversation_bindings(binding_key, binding_id, target_agent_id, target_session_id, target_session_key, channel, account_id, conversation_kind, parent_conversation_id, conversation_id, target_kind, status, bound_at, expires_at, metadata_json, updated_at)
plugin_binding_approvals(plugin_root, channel, account_id, plugin_id, plugin_name, approved_at)
tui_last_sessions(scope_key, session_key, updated_at)
plugin_state_entries(plugin_id, namespace, entry_key, value_json, created_at, expires_at)
plugin_blob_entries(plugin_id, namespace, entry_key, metadata_json, blob, created_at, expires_at)
media_blobs(subdir, id, content_type, size_bytes, blob, created_at, updated_at)
skill_uploads(upload_id, kind, slug, force, size_bytes, sha256, actual_sha256, received_bytes, archive_blob, created_at, expires_at, committed, committed_at, idempotency_key_hash)
web_push_subscriptions(endpoint_hash, subscription_id, endpoint, p256dh, auth, created_at_ms, updated_at_ms)
web_push_vapid_keys(key_id, public_key, private_key, subject, updated_at_ms)
apns_registrations(node_id, transport, token, relay_handle, send_grant, installation_id, topic, environment, distribution, token_debug_suffix, updated_at_ms)
node_host_config(config_key, version, node_id, token, display_name, gateway_host, gateway_port, gateway_tls, gateway_tls_fingerprint, updated_at_ms)
device_identities(identity_key, device_id, public_key_pem, private_key_pem, created_at_ms, updated_at_ms)
device_auth_tokens(device_id, role, token, scopes_json, updated_at_ms)
macos_port_guardian_records(pid, port, command, mode, timestamp)
workspace_setup_state(workspace_key, workspace_path, version, bootstrap_seeded_at, setup_completed_at, updated_at)
native_hook_relay_bridges(relay_id, pid, hostname, port, token, expires_at_ms, updated_at_ms)
model_capability_cache(provider_id, model_id, name, input_text, input_image, reasoning, supports_tools, context_window, max_tokens, cost_input, cost_output, cost_cache_read, cost_cache_write, updated_at_ms)
agent_model_catalogs(catalog_key, agent_dir, raw_json, updated_at)
managed_outgoing_image_records(attachment_id, session_key, message_id, created_at, updated_at, retention_class, alt, original_media_id, original_media_subdir, original_content_type, original_width, original_height, original_size_bytes, original_filename, record_json)
gateway_restart_sentinel(sentinel_key, version, kind, status, ts, session_key, thread_id, delivery_channel, delivery_to, delivery_account_id, message, continuation_json, doctor_hint, stats_json, payload_json, updated_at_ms)
channel_pairing_requests(channel_key, account_id, request_id, code, created_at, last_seen_at, meta_json)
channel_pairing_allow_entries(channel_key, account_id, entry, sort_order, updated_at)
voicewake_triggers(config_key, position, trigger, updated_at_ms)
voicewake_routing_config(config_key, version, default_target_mode, default_target_agent_id, default_target_session_key, updated_at_ms)
voicewake_routing_routes(config_key, position, trigger, target_mode, target_agent_id, target_session_key, updated_at_ms)
update_check_state(state_key, last_checked_at, last_notified_version, last_notified_tag, last_available_version, last_available_tag, auto_install_id, auto_first_seen_version, auto_first_seen_tag, auto_first_seen_at, auto_last_attempt_version, auto_last_attempt_at, auto_last_success_version, auto_last_success_at, updated_at_ms)
config_health_entries(config_path, last_known_good_json, last_promoted_good_json, last_observed_suspicious_signature, updated_at_ms)
sandbox_registry_entries(registry_kind, container_name, session_key, backend_id, runtime_label, image, created_at_ms, last_used_at_ms, config_label_kind, config_hash, cdp_port, no_vnc_port, entry_json, updated_at)
cron_run_logs(store_key, job_id, seq, ts, status, error, summary, diagnostics_summary, delivery_status, delivery_error, delivered, session_id, session_key, run_id, run_at_ms, duration_ms, next_run_at_ms, model, provider, total_tokens, entry_json, created_at)
cron_jobs(store_key, job_id, name, description, enabled, delete_after_run, created_at_ms, agent_id, session_key, schedule_kind, schedule_expr, schedule_tz, every_ms, anchor_ms, at, stagger_ms, session_target, wake_mode, payload_kind, payload_message, payload_model, payload_fallbacks_json, payload_thinking, payload_timeout_seconds, payload_allow_unsafe_external_content, payload_external_content_source_json, payload_light_context, payload_tools_allow_json, delivery_mode, delivery_channel, delivery_to, delivery_thread_id, delivery_account_id, delivery_best_effort, failure_delivery_mode, failure_delivery_channel, failure_delivery_to, failure_delivery_account_id, failure_alert_disabled, failure_alert_after, failure_alert_channel, failure_alert_to, failure_alert_cooldown_ms, failure_alert_include_skipped, failure_alert_mode, failure_alert_account_id, next_run_at_ms, running_at_ms, last_run_at_ms, last_run_status, last_error, last_duration_ms, consecutive_errors, consecutive_skipped, schedule_error_count, last_delivery_status, last_delivery_error, last_delivered, last_failure_alert_at_ms, job_json, state_json, runtime_updated_at_ms, schedule_identity, sort_order, updated_at)
delivery_queue_entries(queue_name, id, status, entry_kind, session_key, channel, target, account_id, retry_count, last_attempt_at, last_error, recovery_state, platform_send_started_at, entry_json, enqueued_at, updated_at, failed_at)
commitments(id, agent_id, session_key, channel, account_id, recipient_id, thread_id, sender_id, kind, sensitivity, source, status, reason, suggested_text, dedupe_key, confidence, due_earliest_ms, due_latest_ms, due_timezone, source_message_id, source_run_id, created_at_ms, updated_at_ms, attempts, last_attempt_at_ms, sent_at_ms, dismissed_at_ms, snoozed_until_ms, expired_at_ms, record_json)
migration_runs(id, started_at, finished_at, status, report_json)
migration_sources(source_key, migration_kind, source_path, target_table, source_sha256, source_size_bytes, source_record_count, last_run_id, status, imported_at, removed_source, report_json)
backup_runs(id, created_at, archive_path, status, manifest_json)
```

Banco de dados do agente:

```text
schema_meta(meta_key, role, schema_version, agent_id, app_version, created_at, updated_at)
sessions(session_id, session_key, session_scope, created_at, updated_at, started_at, ended_at, status, chat_type, channel, account_id, primary_conversation_id, model_provider, model, agent_harness_id, parent_session_key, spawned_by, display_name)
conversations(conversation_id, channel, account_id, kind, peer_id, parent_conversation_id, thread_id, native_channel_id, native_direct_user_id, label, metadata_json, created_at, updated_at)
session_conversations(session_id, conversation_id, role, first_seen_at, last_seen_at)
session_routes(session_key, session_id, updated_at)
session_entries(session_id, session_key, entry_json, updated_at)
transcript_events(session_id, seq, event_json, created_at)
transcript_event_identities(session_id, event_id, seq, event_type, has_parent, parent_id, message_idempotency_key, created_at)
transcript_snapshots(session_id, snapshot_id, reason, event_count, created_at, metadata_json)
vfs_entries(namespace, path, kind, content_blob, metadata_json, updated_at)
tool_artifacts(run_id, artifact_id, kind, metadata_json, blob, created_at)
run_artifacts(run_id, path, kind, metadata_json, blob, created_at)
trajectory_runtime_events(session_id, run_id, seq, event_json, created_at)
memory_index_meta(key, value)
memory_index_sources(path, source, hash, mtime, size)
memory_index_chunks(id, path, source, start_line, end_line, hash, model, text, embedding, updated_at)
memory_embedding_cache(provider, model, provider_key, hash, embedding, dims, updated_at)
memory_index_state(id, revision)
cache_entries(scope, key, value_json, blob, expires_at, updated_at)
```

A busca futura pode adicionar tabelas FTS sem alterar as tabelas canônicas de eventos:

```text
transcript_events_fts(session_id, seq, text)
vfs_entries_fts(namespace, path, text)
```

Valores grandes devem usar colunas `blob`, não codificação de string JSON. Mantenha `value_json` para pequenos dados estruturados que devem continuar inspecionáveis com ferramentas SQLite simples.

`agent_databases` é o registro canônico para este branch. Não adicione uma tabela `agents` até existir um proprietário real de registros de agente; a configuração de agente permanece em `openclaw.json`.

## Formato de migração do Doctor

O Doctor deve chamar uma etapa de migração explícita que seja reportável e segura para executar novamente:

```bash
openclaw doctor --fix
```

`openclaw doctor --fix` invoca a implementação de migração de estado após o preflight comum de configuração e cria um backup verificado antes da importação. A inicialização do runtime e `openclaw migrate` não devem importar arquivos de estado legados do OpenClaw.

Propriedades da migração:

- Uma passagem de migração descobre todas as fontes de arquivos legados e produz um plano antes de modificar qualquer coisa.
- O Doctor cria um arquivo de backup pré-migração verificado antes de importar arquivos legados.
- As importações são idempotentes e indexadas por caminho da fonte, mtime, tamanho, hash e tabela de destino.
- Arquivos de origem bem-sucedidos são removidos ou arquivados depois que o banco de dados de destino faz commit.
- Importações com falha deixam a origem intocada e registram um aviso em `migration_runs`.
- O código de runtime lê apenas SQLite depois que a migração existe.
- Nenhum caminho de downgrade/exportação para arquivos de runtime é necessário.

## Inventário de migração

Mova estes para o banco de dados global:

- As gravações em tempo de execução do registro de tarefas agora usam o banco de dados compartilhado; o importador sidecar não lançado
  `tasks/runs.sqlite` foi removido. Salvamentos de snapshot fazem upsert por id de tarefa
  e excluem apenas linhas de tarefa/entrega ausentes.
- As gravações em tempo de execução do Task Flow agora usam o banco de dados compartilhado; o importador sidecar não lançado
  `tasks/flows/registry.sqlite` foi removido. Salvamentos de snapshot
  fazem upsert por id de fluxo e excluem apenas linhas de fluxo ausentes.
- As gravações em tempo de execução do estado de Plugin agora usam o banco de dados compartilhado; o importador sidecar não lançado
  `plugin-state/state.sqlite` foi removido.
- A busca de memória integrada não usa mais `memory/<agentId>.sqlite` como padrão; suas
  tabelas de índice ficam no banco de dados do agente proprietário, e a opção explícita de sidecar
  `memorySearch.store.path` foi retirada para a migração de configuração do doctor.
- A reindexação de memória integrada redefine apenas as tabelas pertencentes à memória no banco de dados do agente.
  Ela não deve substituir todo o arquivo SQLite, porque o mesmo banco de dados contém
  sessões, transcrições, linhas de VFS, artefatos e caches de runtime.
- Registros de contêiner/navegador de sandbox vindos de JSON monolítico e fragmentado. As gravações em tempo de execução
  agora usam o banco de dados compartilhado; a importação de JSON legado permanece.
- Definições de tarefas Cron, estado de agendamento e histórico de execuções agora usam SQLite compartilhado;
  o doctor importa/remove arquivos legados `jobs.json`, `jobs-state.json` e
  `cron/runs/*.jsonl`
- Identidade/autenticação de dispositivo, push, verificação de atualização, commitments, cache de modelos OpenRouter, índice de Plugins instalados e vínculos do app-server
- Registros de pareamento e bootstrap de dispositivo/nó agora usam tabelas SQLite tipadas
- Assinantes de notificação de pareamento de dispositivo e marcadores de solicitações entregues agora usam a tabela compartilhada SQLite plugin-state em vez de `device-pair-notify.json`.
- Registros de chamadas de voz agora usam a tabela compartilhada SQLite plugin-state sob o namespace
  `voice-call` / `calls` em vez de `calls.jsonl`; a CLI do Plugin
  acompanha e resume o histórico de chamadas respaldado por SQLite.
- Sessões de Gateway do QQBot, registros de usuários conhecidos e cache de citações ref-index agora usam estado de Plugin em SQLite sob namespaces `qqbot` (`gateway-sessions`,
  `known-users`, `ref-index`) em vez de `session-*.json`, `known-users.json`,
  e `ref-index.jsonl`. Esses arquivos legados são caches e não são migrados.
- Preferências do seletor de modelos do Discord, hashes de implantação de comandos e vínculos de threads
  agora usam estado de Plugin em SQLite sob namespaces `discord`
  (`model-picker-preferences`, `command-deploy-hashes`, `thread-bindings`)
  em vez de `model-picker-preferences.json`, `command-deploy-cache.json` e
  `thread-bindings.json`; a migração de doctor/setup do Discord importa e
  remove os arquivos legados.
- Cursores de catchup e marcadores de deduplicação de entrada do BlueBubbles agora usam estado de Plugin em SQLite sob namespaces `bluebubbles` (`catchup-cursors`, `inbound-dedupe`)
  em vez de `bluebubbles/catchup/*.json` e
  `bluebubbles/inbound-dedupe/*.json`; a migração de doctor/setup do BlueBubbles
  importa e remove os arquivos legados.
- Offsets de atualização do Telegram, entradas de cache de stickers, entradas de cache de mensagens da cadeia de respostas,
  entradas de cache de mensagens enviadas, entradas de cache de nomes de tópicos e vínculos de threads
  agora usam estado de Plugin em SQLite sob namespaces `telegram`
  (`update-offsets`, `sticker-cache`, `message-cache`, `sent-messages`,
  `topic-names`, `thread-bindings`) em vez de `update-offset-*.json`,
  `sticker-cache.json`, `*.telegram-messages.json`,
  `*.telegram-sent-messages.json`, `*.telegram-topic-names.json` e
  `thread-bindings-*.json`; a migração de doctor/setup do Telegram importa e
  remove os arquivos legados.
- Cursores de catchup do iMessage, mapeamentos de short-id de resposta e linhas de deduplicação de eco enviado
  agora usam estado de Plugin em SQLite sob namespaces `imessage` (`catchup-cursors`,
  `reply-cache`, `sent-echoes`) em vez de `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` e `imessage/sent-echoes.jsonl`; a migração de doctor/setup do iMessage
  importa e remove os arquivos legados.
- Conversas, enquetes, tokens SSO e aprendizados de feedback do Microsoft Teams agora
  usam namespaces de estado de Plugin em SQLite (`conversations`, `polls`, `sso-tokens`,
  `feedback-learnings`) em vez de `msteams-conversations.json`,
  `msteams-polls.json`, `msteams-sso-tokens.json` e `*.learnings.json`; a
  migração de doctor/setup do Microsoft Teams importa e arquiva os arquivos legados.
  Uploads pendentes são um cache SQLite de curta duração e arquivos de cache JSON antigos
  não são migrados.
- Cache de sincronização, metadados de armazenamento, vínculos de threads, marcadores de deduplicação de entrada,
  estado de cooldown de verificação de inicialização, credenciais, chaves de recuperação e snapshots de criptografia IndexedDB do SDK do Matrix
  agora usam namespaces de estado/blob de Plugin em SQLite sob
  `matrix` (`sync-store`, `storage-meta`, `thread-bindings`, `inbound-dedupe`,
  `startup-verification`, `credentials`, `recovery-key`, `idb-snapshots`)
  em vez de `bot-storage.json`, `storage-meta.json`, `thread-bindings.json`,
  `inbound-dedupe.json`, `startup-verification.json`, `credentials.json`,
  `recovery-key.json` e `crypto-idb-snapshot.json`; a migração de doctor/setup do Matrix
  importa e remove esses arquivos legados das raízes de armazenamento Matrix com escopo de conta.
- Cursores de barramento e estado de publicação de perfil do Nostr agora usam estado de Plugin em SQLite sob
  namespaces `nostr` (`bus-state`, `profile-state`) em vez de
  `bus-state-*.json` e `profile-state-*.json`; a migração de doctor/setup do Nostr
  importa e remove os arquivos legados.
- Alternâncias de sessão do Active Memory agora usam estado de Plugin em SQLite sob
  `active-memory/session-toggles` em vez de `session-toggles.json`.
- Filas de propostas e contadores de revisão do Skill Workshop agora usam estado de Plugin em SQLite
  sob `skill-workshop/proposals` e `skill-workshop/reviews` em vez de
  arquivos `skill-workshop/<workspace>.json` por workspace.
- Filas de entrega de saída e de entrega de sessão agora compartilham a tabela SQLite global
  `delivery_queue_entries` sob nomes de fila separados
  (`outbound-delivery`, `session-delivery`) em vez de arquivos duráveis
  `delivery-queue/*.json`, `delivery-queue/failed/*.json` e
  `session-delivery-queue/*.json`. A etapa legacy-state do doctor importa
  linhas pendentes e com falha, remove marcadores de entrega obsoletos e exclui os arquivos
  JSON antigos após a importação. Campos de roteamento ativo e retry são colunas tipadas; o
  payload JSON é mantido apenas para reprodução/depuração.
- Locações de processo ACPX agora usam estado de Plugin em SQLite sob `acpx/process-leases`
  em vez de `process-leases.json`.
- Metadados de execução de backup e migração

Mova estes para bancos de dados de agentes:

- Raízes de sessão do agente e payloads de entrada de sessão em formato de compatibilidade. Concluído para
  gravações em tempo de execução: metadados de sessão ativos são consultáveis em `sessions`, enquanto o
  payload completo `SessionEntry` em formato legado permanece em `session_entries`.
- Eventos de transcrição do agente. Concluído para gravações em tempo de execução.
- Checkpoints de Compaction e snapshots de transcrição. Concluído para gravações em tempo de execução:
  cópias de transcrição de checkpoint são linhas de transcrição SQLite e os metadados de checkpoint
  são registrados em `transcript_snapshots`. Helpers de checkpoint do Gateway
  agora nomeiam esses valores como snapshots de transcrição em vez de arquivos de origem.
- Namespaces de rascunho/workspace VFS do agente. Concluído para gravações VFS em tempo de execução.
- Payloads de anexos de subagentes. Concluído para gravações em tempo de execução: eles são entradas seed VFS
  em SQLite e nunca arquivos duráveis de workspace.
- Artefatos de ferramentas. Concluído para gravações em tempo de execução.
- Artefatos de execução. Concluído para gravações em tempo de execução de workers por meio da tabela por agente
  `run_artifacts`.
- Caches de runtime locais do agente. Concluído para gravações de cache com escopo de runtime de worker por meio
  da tabela por agente `cache_entries`. Caches de modelos em todo o Gateway permanecem no
  banco de dados global, a menos que se tornem específicos do agente.
- Logs de stream pai do ACP. Concluído para gravações em tempo de execução.
- Sessões do ledger de replay ACP. Concluído para gravações em tempo de execução via
  `acp_replay_sessions` e `acp_replay_events`; o legado `acp/event-ledger.json`
  permanece apenas como entrada do doctor.
- Metadados de sessão ACP. Concluído para gravações em tempo de execução via `acp_sessions`; blocos legados
  `entry.acp` em `sessions.json` são apenas entrada de migração do doctor.
- Sidecars de trajetória quando não são arquivos explícitos de exportação. Concluído para gravações em tempo de execução:
  a captura de trajetória grava linhas `trajectory_runtime_events` no banco de dados do agente
  e espelha artefatos com escopo de execução para SQLite. Sidecars legados são apenas entradas de importação do doctor;
  a exportação pode materializar novas saídas JSONL de pacote de suporte,
  mas não lê nem migra sidecars antigos de trajetória/transcrição em tempo de execução.
  A captura de trajetória em tempo de execução expõe escopo SQLite; helpers de caminho JSONL são
  isolados para suporte de exportação/depuração e não são reexportados do módulo de runtime.
  Metadados de trajetória do embedded-runner registram a identidade `{agentId, sessionId, sessionKey}`
  em vez de persistir um localizador de transcrição.

Mantenha estes respaldados por arquivos por enquanto:

- `openclaw.json`
- arquivos de credenciais de provedor ou CLI
- manifestos de Plugin/pacote
- workspaces de usuário e repositórios Git quando o modo de disco é selecionado
- logs destinados ao acompanhamento por operadores, a menos que uma superfície específica de logs seja movida

## Plano de Migração

### Fase 0: Congelar o Limite

Torne explícito o limite de estado durável antes de mover mais linhas:

- Adicione uma tabela `migration_runs` ao banco de dados global.
  Concluído para relatórios de execução de migração de legacy-state.
- Adicione um único serviço de migração de estado pertencente ao doctor para importação de arquivo para banco de dados.
  Concluído: `openclaw doctor --fix` usa a implementação de migração de legacy-state.
- Faça `plan` ser somente leitura e faça `apply` criar um backup, importar, verificar e
  então excluir ou colocar em quarentena arquivos antigos.
  Concluído: o doctor cria um backup pré-migração verificado, passa o caminho do backup
  para `migration_runs` e reutiliza os caminhos de importação/remoção.
- Adicione proibições estáticas para que novo código de runtime não possa gravar arquivos de estado legados enquanto
  código de migração e testes ainda podem semeá-los/lê-los.
  Concluído para os armazenamentos legados atualmente migrados; a guarda também verifica testes
  aninhados em busca de contratos proibidos de localizador de transcrição em runtime.

### Fase 1: Concluir o Plano de Controle Global

Mantenha o estado de coordenação compartilhado em `state/openclaw.sqlite`:

- Agentes e registro de bancos de dados de agentes
- Ledgers de tarefas e Task Flow
- Estado de Plugin
- Registro de contêiner/navegador de sandbox
- Histórico de execuções Cron/agendador
- Pareamento, dispositivo, push, update-check, TUI, caches OpenRouter/modelo e outros
  pequenos estados de runtime com escopo de Gateway
- Metadados de backup e migração
- Bytes de anexos de mídia do Gateway. Concluído para gravações em tempo de execução; caminhos diretos de arquivos
  são materializações temporárias para compatibilidade com remetentes de canais e staging de sandbox.
  Allowlists de runtime aceitam caminhos de materialização SQLite, não raízes legadas de mídia de estado/configuração.
  O doctor importa arquivos de mídia legados para
  `media_blobs` e remove os arquivos de origem após gravações de linhas bem-sucedidas.
- Sessões, eventos e blobs de payload de captura do proxy de depuração. Concluído: capturas ficam
  no banco de dados de estado compartilhado e abrem por meio do bootstrap, schema,
  WAL e configurações de busy-timeout do banco de dados de estado compartilhado. Bytes de payload são compactados com gzip em
  `capture_blobs.data`; não há override de banco de dados sidecar de runtime do proxy de depuração,
  diretório de blobs, nem alvo gerado de schema/codegen apenas para proxy-capture.
  A migração de doctor/inicialização importa linhas de `debug-proxy/capture.sqlite` lançado
  e blobs de payload referenciados, incluindo overrides ativos legados de ambiente de DB/blob,
  depois arquiva essas origens enquanto mantém certificados CA intactos.

Esta fase também remove openers sidecar duplicados, helpers de permissão, configuração de WAL,
limpeza de filesystem e gravadores de compatibilidade desses subsistemas.

### Fase 2: Introduzir Bancos de Dados por Agente

Crie um banco de dados por agente e registre-o a partir do DB global:

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

A linha global `agent_databases` armazena o caminho, a versão do schema, o timestamp
de última visualização e metadados básicos de tamanho/integridade. O código de runtime pede ao registro o
DB do agente em vez de derivar caminhos de arquivo diretamente.

O DB do agente contém:

- `sessions` como a raiz de sessão canônica, com `session_entries` como a tabela de payload
  com formato de compatibilidade anexada a essa raiz, e
  `session_routes` como a busca única ativa de `session_key`
- `conversations` e `session_conversations` como a identidade normalizada de
  roteamento do provedor anexada às sessões
- `transcript_events`
- snapshots de transcrição e checkpoints de Compaction. Concluído para gravações em runtime.
- `vfs_entries`
- `tool_artifacts` e artefatos de execução
- linhas de runtime/cache locais do agente. Concluído para caches com escopo de worker.
- eventos de fluxo pai do ACP
- eventos de runtime de trajetória quando não são artefatos explícitos de exportação

### Fase 3: Substituir APIs Do Armazenamento De Sessões

Concluído para runtime. A superfície do armazenamento de sessões em formato de arquivo não é um contrato
ativo de runtime:

- O runtime não chama mais `loadSessionStore(storePath)` nem trata `storePath` como
  identidade de sessão.
- As operações de linha em runtime são `getSessionEntry`, `upsertSessionEntry`,
  `patchSessionEntry`, `deleteSessionEntry` e `listSessionEntries`.
- Helpers de reescrita de armazenamento inteiro, gravadores de arquivo, testes de fila, poda de aliases e
  parâmetros de exclusão de chaves legadas saíram do runtime.
- Exportações de compatibilidade obsoletas do pacote raiz ainda adaptam caminhos
  canônicos de `sessions.json` para as APIs de linhas do SQLite.
- O parsing de `sessions.json` permanece apenas no código de migração/importação do doctor e
  nos testes do doctor.
- O fallback de ciclo de vida do runtime lê cabeçalhos de transcrição do SQLite, não as primeiras
  linhas de JSONL.

Continue removendo qualquer coisa que reintroduza parâmetros de bloqueio de arquivo,
vocabulário de poda/truncamento como manutenção de arquivo, identidade por caminho de armazenamento ou testes
cuja única asserção seja persistência em JSON.

### Fase 4: Mover Transcrições, Fluxos ACP, Trajetórias E VFS

Torne todo fluxo de dados de agente nativo do banco de dados:

- Gravações de append de transcrição passam por uma transação SQLite que garante o
  cabeçalho da sessão, verifica a idempotência da mensagem, seleciona a cauda pai, insere
  em `transcript_events` e registra metadados de identidade consultáveis em
  `transcript_event_identities`. Concluído para appends diretos de mensagens de transcrição e
  appends normais persistidos de `TranscriptSessionManager`; operações explícitas de branch
  mantêm sua escolha explícita de pai e ainda gravam linhas SQLite
  sem derivar nenhum localizador de arquivo.
- Logs de fluxo pai do ACP viram linhas, não arquivos `.acp-stream.jsonl`. Concluído.
- A configuração de spawn do ACP não persiste mais caminhos JSONL de transcrição. Concluído.
- A captura de trajetória do runtime grava linhas/artefatos de eventos diretamente. O comando explícito
  de suporte/exportação ainda pode produzir artefatos JSONL de pacote de suporte como
  formato de exportação, mas a exportação de sessão não recria JSONL de sessão. Concluído.
- Workspaces em disco permanecem em disco quando configurados como modo de disco.
- Scratch de VFS e modo experimental de workspace apenas VFS usam o banco de dados do agente.

A migração importa arquivos JSONL antigos uma vez, registra contagens/hashes em
`migration_runs` e remove os arquivos importados após verificações de integridade.

### Fase 5: Backup, Restauração, Vacuum E Verificação

Backups permanecem um único arquivo de archive:

- Faça checkpoint de todo banco de dados global e de agente.
- Faça snapshot de cada DB com semântica de backup do SQLite ou `VACUUM INTO`.
- Arquive snapshots compactos dos DBs, configuração, credenciais externas e exportações
  solicitadas de workspace.
- Omita arquivos brutos ativos `*.sqlite-wal` e `*.sqlite-shm`.
- Verifique abrindo cada snapshot de DB e executando
  `PRAGMA integrity_check`.
  `openclaw backup create` faz essa verificação do archive por padrão;
  `--no-verify` pula apenas a passagem pós-gravação do archive, não a verificação de integridade
  da criação do snapshot.
- A restauração copia snapshots de volta para seus caminhos de destino. Este branch redefine o
  layout SQLite não lançado para `user_version = 1`; alterações futuras de esquema lançado
  podem adicionar migrações explícitas quando forem necessárias.

### Fase 6: Runtime Do Worker

Mantenha o modo worker experimental enquanto a divisão do banco de dados é concluída:

- Workers recebem id do agente, id da execução, modo de sistema de arquivos e identidade do registro de DB.
- Cada worker abre sua própria conexão SQLite.
- O pai mantém entrega de canal, aprovações, configuração e autoridade de cancelamento.
- Comece com um worker por execução ativa; adicione pooling apenas depois que o ciclo de vida e a
  propriedade de conexão com DB estiverem estáveis.

### Fase 7: Remover O Mundo Antigo

Concluído para gerenciamento de sessões em runtime. O mundo antigo é permitido apenas como entrada
explícita do doctor ou saída de suporte/exportação:

- Nenhuma gravação em runtime de `sessions.json`, JSONL de transcrição, JSON de registro de sandbox, SQLite
  sidecar de tarefas ou SQLite sidecar de estado de Plugin.
- Nenhuma poda de arquivo JSON/sessão, truncamento de arquivo de transcrição, bloqueios de arquivo de sessão
  ou testes de sessão em formato de bloqueio.
- Nenhuma exportação de compatibilidade em runtime cujo propósito seja manter arquivos de sessão antigos
  atualizados.
- Exportações explícitas de suporte permanecem formatos de archive/materialização
  solicitados pelo usuário e não devem alimentar nomes de arquivos de volta para a identidade de runtime.

## Backup E Restauração

Backups devem ser um único arquivo de archive, mas a captura do banco de dados deve ser
nativa do SQLite:

1. Interrompa atividade de gravação de longa duração ou entre em uma barreira curta de backup.
2. Para todo banco de dados global e de agente, execute um checkpoint.
3. Faça snapshot de cada banco de dados usando semântica de backup do SQLite ou `VACUUM INTO` em um
   diretório temporário de backup.
4. Arquive os snapshots compactados do banco de dados, arquivo de configuração, diretório de credenciais,
   workspaces selecionados e um manifesto.
5. Verifique o archive abrindo cada snapshot SQLite incluído e executando
   `PRAGMA integrity_check`.
   `openclaw backup create` faz isso por padrão; `--no-verify` é apenas para
   pular intencionalmente a passagem pós-gravação do archive.

Não dependa de cópias brutas ativas de `*.sqlite`, `*.sqlite-wal` e `*.sqlite-shm` como
formato principal de backup. O manifesto do archive deve registrar função do banco de dados,
id do agente, versão do esquema, caminho de origem, caminho do snapshot, tamanho em bytes e status de
integridade.

A restauração deve reconstruir o banco de dados global e os arquivos de banco de dados dos agentes a partir dos
snapshots do archive. Como o layout SQLite ainda não foi lançado, esta refatoração
mantém apenas o esquema versão 1 mais a importação de arquivo para banco de dados pelo doctor. O comando de restauração
valida o archive primeiro e depois substitui cada ativo do manifesto pelo payload extraído
verificado.

## Plano De Refatoração Do Runtime

1. Adicionar APIs de registro de banco de dados.
   - Resolver caminhos do DB global e do DB por agente.
   - Manter os esquemas não lançados em `user_version = 1`; não adicionar código de executor
     de migração de esquema até que um esquema lançado precise dele.
   - Adicionar helpers de fechamento/checkpoint/integridade usados por testes, backup e doctor.

2. Colapsar armazenamentos SQLite sidecar.
   - Mover tabelas de estado de Plugin para o banco de dados global. Concluído para gravações em runtime;
     o importador de sidecar legado não lançado foi excluído.
   - Mover tabelas de registro de tarefas para o banco de dados global. Concluído para gravações em runtime;
     o importador de sidecar legado não lançado foi excluído.
   - Mover tabelas de Task Flow para o banco de dados global. Concluído para gravações em runtime;
     o importador de sidecar legado não lançado foi excluído.
   - Mover tabelas integradas de busca de memória para cada banco de dados de agente. Concluído; o
     `memorySearch.store.path` customizado explícito agora é removido pela migração de configuração do doctor.
     A reindexação completa é executada no local apenas contra tabelas de memória; o caminho antigo de troca de arquivo
     inteiro e o helper de troca de índice sidecar foram excluídos.
   - Excluir abridores de banco de dados duplicados, configuração de WAL, helpers de permissão e
     caminhos de fechamento desses subsistemas.

3. Mover tabelas pertencentes ao agente para bancos de dados por agente.
   - Criar DB do agente sob demanda por meio do registro de banco de dados global. Concluído.
   - Mover entradas de sessão de runtime, eventos de transcrição, linhas de VFS e
     artefatos de ferramenta para DBs de agentes. Concluído.
   - Não migrar entradas de sessão do DB compartilhado local do branch, eventos de transcrição,
     linhas de VFS ou artefatos de ferramenta; esse layout nunca foi lançado. Manter apenas a importação legada
     de arquivo para banco de dados no doctor.

4. Substituir APIs de armazenamento de sessões.
   - Remover `storePath` como identidade de runtime. Concluído para runtime e protegido
     por `check:database-first-legacy-stores`: metadados de sessão, atualizações de rota,
     persistência de comandos, limpeza de sessões da CLI, previews de raciocínio do Feishu,
     persistência de estado de transcrição, profundidade de subagente, substituições de sessão de perfil
     de autenticação, lógica de fork pai e inspeção do QA-lab agora resolvem o
     banco de dados a partir de chaves canônicas de agente/sessão.
     Respostas de lista de sessões do Gateway/TUI/UI/macOS agora expõem `databasePath`
     em vez do `path` legado; superfícies de depuração do macOS mostram o banco de dados por agente
     como estado somente leitura em vez de gravar a configuração `session.store`.
     `/status`, exportação de trajetória conduzida por chat e proxies de dependência da CLI não
     propagam mais caminhos de armazenamento legados; fallback de uso de transcrição lê
     SQLite por identidade de agente/sessão. Testes de runtime e bridge não expõem mais
     `storePath`; entradas de doctor/migração são proprietárias desse nome de campo legado.
     O carregamento de sessão combinada do Gateway não tem mais um branch especial de runtime para
     valores não modelados de `session.store`; ele agrega linhas SQLite por agente.
     A lane legada de doctor de bloqueio de sessão e seu helper de limpeza `.jsonl.lock`
     foram removidos; SQLite é a fronteira de concorrência de sessão agora.
     Call sites quentes de runtime usam nomes de helpers orientados a linhas como
     `resolveSessionRowEntry`; o alias de compatibilidade antigo `resolveSessionStoreEntry`
     foi removido do runtime e das exportações do SDK de Plugin.

- Use operações de linha `{ agentId, sessionKey }`.
  Concluído: `getSessionEntry`, `upsertSessionEntry`, `deleteSessionEntry`,
  `patchSessionEntry` e `listSessionEntries` são APIs SQLite-first que não
  exigem um caminho de armazenamento de sessão. Resumo de status, status de agente local, saúde
  e o comando de listagem `openclaw sessions` agora leem linhas por agente diretamente
  e exibem caminhos de banco de dados SQLite por agente em vez de caminhos de `sessions.json`.
- Substituir exclusão/inserção de armazenamento inteiro por `upsertSessionEntry`,
  `deleteSessionEntry`, `listSessionEntries` e consultas SQL de limpeza.
  Concluído para runtime: caminhos quentes agora usam APIs de linha e patches de linha com nova tentativa em conflito;
  os helpers restantes de importação/substituição de armazenamento inteiro estão limitados ao código de importação de migração
  e aos testes de backend SQLite.
  - Excluir `store-writer.ts` e testes de fila de gravador. Concluído.
  - Excluir poda de chaves legadas em runtime e parâmetros de exclusão de alias de upserts/patches de
    linhas de sessão. Concluído.

5. Excluir comportamento de registro JSON em runtime.
   - Fazer leituras e gravações de registro de sandbox serem somente SQLite. Concluído.
   - Importar JSON monolítico e fragmentado apenas da etapa de migração. Concluído.
   - Remover bloqueios de registro fragmentado e gravações JSON. Concluído.

- Manter uma tabela de registro tipada em vez de armazenar linhas de registro como JSON opaco
  genérico se o formato continuar sendo estado operacional de caminho quente. Concluído.

6. Excluir mutação de sessão em formato de bloqueio de arquivo.
   - Concluído para criação de bloqueio em runtime e APIs de bloqueio em runtime.
   - A lane independente de limpeza legada `.jsonl.lock` do doctor foi removida.
   - `session.writeLock` é configuração legada migrada pelo doctor, não uma configuração tipada de runtime.
   - Integridade de estado não tem mais um caminho separado de poda de arquivo de transcrição órfão;
     a migração do doctor importa/remove fontes JSONL legadas em um único lugar.
   - Coordenação singleton do Gateway usa linhas tipadas SQLite `state_leases` sob
     `gateway_locks` e não expõe mais uma superfície de diretório de bloqueio de arquivo.
   - Persistência genérica de dedupe do SDK de Plugin não usa mais bloqueios de arquivo nem arquivos JSON;
     ela grava linhas compartilhadas de estado de Plugin em SQLite. Concluído.
   - Coordenação de embed QMD usa uma concessão de estado SQLite em vez de
     `qmd/embed.lock`. Concluído.

7. Tornar workers cientes de banco de dados.
   - Workers abrem suas próprias conexões SQLite.
   - O pai possui entrega, callbacks de canal e configuração.
   - O worker recebe id do agente, id da execução, modo de sistema de arquivos e identidade de registro
     de DB, não handles ativos.
   - `vfs-only` permanece experimental e usa o banco de dados do agente como sua raiz de armazenamento.
   - Mantenha primeiro um worker por execução ativa. Pooling pode esperar até que a vida útil da conexão
     com DB e o comportamento de cancelamento estejam estáveis.

8. Integração de backup.
   - Ensinar o backup a criar snapshots dos bancos de dados globais e de agentes via backup SQLite ou
     `VACUUM INTO`. Concluído para arquivos `*.sqlite` descobertos sob o ativo de estado.
   - Adicionar verificação de backup para integridade SQLite e versão do esquema. Concluído para
     a criação de backups e as verificações de integridade padrão da verificação de arquivos.
   - Registrar metadados de execução de backup em SQLite. Concluído via tabela compartilhada `backup_runs`
     com caminho do arquivo, status e JSON do manifesto.
   - Adicionar restauração a partir de snapshots de arquivos verificados. Concluído: `openclaw backup
restore` valida antes da extração, usa o manifesto normalizado do verificador,
     oferece suporte a `--dry-run` e exige `--yes` antes de substituir
     os caminhos de origem registrados.
   - Incluir exportação de VFS/workspace somente quando solicitado; não exportar dados internos de sessão
     como JSON ou JSONL.

9. Excluir testes e código obsoletos. Concluído para as superfícies de sessão de runtime conhecidas.

- Remover testes que afirmam a criação em runtime de `sessions.json` ou arquivos JSONL
  de transcrição. Concluído para o armazenamento de sessão principal, chat, eventos de transcrição do gateway,
  preview, lifecycle, atualizações de entrada de sessão de comandos, redefinição/rastreamento de resposta automática e
  fixtures de dreaming do memory-core, roteamento de destino de aprovação, reparo de transcrição de sessão,
  reparo de permissão de segurança, exportação de trajetória e exportação de sessão.
  Os testes de transcrição de active-memory agora verificam escopos SQLite e nenhuma criação de arquivo JSONL
  temporário ou persistido.
  A antiga regressão de poda de transcrição de heartbeat foi removida porque
  o runtime não trunca mais transcrições JSONL.
  Os testes da ferramenta de lista de sessões do agente não modelam mais caminhos legados `sessions.json`
  como o formato de resposta do gateway; testes de app/UI/macOS usam `databasePath`.
  Os testes de uso de transcrição de `/status` agora semeiam linhas de transcrição SQLite diretamente
  em vez de gravar arquivos JSONL.
  Os testes de ciclo de vida de sessão do gateway agora usam helpers de semeadura de transcrição SQLite
  diretamente; o antigo formato de fixture de arquivo de sessão de linha única saiu da cobertura de reset
  e exclusão.
  `sessions.delete` não retorna mais um campo da era de arquivos `archived: []`; a exclusão
  relata apenas o resultado da mutação de linha. A antiga opção `deleteTranscript`
  também foi removida: excluir uma sessão remove a raiz canônica `sessions` e deixa
  o SQLite propagar em cascata as linhas de transcrição, snapshot e trajetória pertencentes à sessão, então nenhum
  chamador pode deixar transcrições órfãs para trás ou esquecer uma ramificação de limpeza.
  Testes de captura de trajetória do context-engine agora leem linhas `trajectory_runtime_events`
  de um banco de dados de agente isolado em vez de ler
  `session.trajectory.jsonl`.
  Scripts de semeadura do canal Docker MCP agora semeiam linhas SQLite diretamente. Gravações diretas em
  `sessions.json` ficam limitadas a fixtures de doctor.
  O E2E do Gateway Tool Search lê evidências de chamadas de ferramenta de linhas de transcrição SQLite
  em vez de varrer arquivos `agents/<agentId>/sessions/*.jsonl`.
  Eventos de host do memory-core e linhas temporárias de corpus de sessão agora ficam no plugin-state
  SQLite compartilhado; `events.jsonl` e `session-corpus/*.txt` são apenas entradas de migração
  legadas do doctor. Linhas ativas usam caminhos virtuais `memory/session-ingestion/`,
  não `.dreams/session-corpus`. O antigo módulo de reparo de dreaming do memory-core
  e seus testes de CLI/Gateway foram removidos porque o runtime não
  possui mais reparo de arquivo de arquivos para esse corpus. Testes de bridge/artefato público do memory-core
  não expõem mais `.dreams/events.jsonl`; eles
  usam o nome do artefato JSON virtual apoiado por SQLite.
  A documentação de testes de SDK/Codex público agora diz estado de sessão SQLite em vez de arquivos
  de sessão, e o exemplo channel-turn não expõe mais um argumento `storePath`.
  O estado de sincronização do Matrix agora usa o armazenamento plugin-state SQLite diretamente. Contratos ativos
  de cliente/runtime passam uma raiz de armazenamento de conta, não um caminho `bot-storage.json`,
  e o doctor importa `bot-storage.json` legado para o SQLite antes de excluir
  a origem. Cenários QA Matrix de reinicialização/destrutivos agora alteram diretamente a linha de sincronização SQLite
  em vez de criar ou excluir arquivos `bot-storage.json` falsos, e
  o substrato E2EE passa uma raiz de sync-store em vez de um caminho
  `sync-store.json` falso.
  A seleção de raiz de armazenamento do Matrix não pontua mais raízes por arquivos JSON legados de sincronização/thread;
  ela usa metadados de raiz duráveis mais estado criptográfico real.
  A suíte de testes do backend de sessão SQLite de runtime não fabrica mais um
  `sessions.json`; fixtures de origem legadas agora ficam nos testes de doctor
  que as importam.
  Testes de sessão do gateway não expõem mais um helper `createSessionStoreDir` nem
  configuração de caminho temporário de armazenamento de sessão não utilizada; diretórios de fixture são explícitos, e a configuração direta
  de linhas usa nomenclatura de linhas de sessão SQLite.
  A cobertura do parser de armazenamento de sessão JSON5 exclusivo do doctor saiu dos testes de infra
  e foi para testes de migração do doctor, então as suítes de teste de runtime não possuem mais parsing
  de arquivos de sessão legados.
  Testes de SSO/upload pendente de runtime do Microsoft Teams não carregam mais fixtures
  ou parsers de sidecar JSON; o parsing legado de token SSO vive apenas no módulo de migração
  do plugin. Testes do Telegram não semeiam mais caminhos falsos de armazenamento `/tmp/*.json`;
  eles redefinem diretamente o cache de mensagens apoiado por SQLite. O helper genérico
  de estado de teste do OpenClaw não expõe mais um gravador legado de `auth-profiles.json`;
  testes de migração de autenticação do doctor possuem essa fixture localmente.
  Testes de runtime para ponteiros de última sessão do TUI, aprovações de exec, alternâncias de active-memory,
  deduplicação/verificação de startup do Matrix, sincronização de fonte do Memory Wiki,
  vínculos de conversa atual, autenticação de onboarding e importações de segredos do Hermes não
  fabricam mais arquivos sidecar antigos nem verificam que nomes de arquivos antigos estão ausentes. Eles
  provam o comportamento por meio de linhas SQLite e APIs públicas de armazenamento; testes de doctor/migração
  são o único lugar ao qual pertencem nomes de arquivos de origem legados.
  Testes de runtime para pareamento de dispositivo/nó, `allowFrom` de canal, intenções de reinicialização,
  handoff de reinicialização, entradas de fila de entrega de sessão, integridade de configuração, caches de iMessage,
  jobs cron, cabeçalhos de transcrição PI, registros de subagentes e anexos de imagem gerenciados
  também não criam mais arquivos JSON/JSONL aposentados apenas para provar
  que eles são ignorados ou ausentes.
  A recuperação de overflow PI não tem mais um fallback de reescrita/truncamento
  do SessionManager: o truncamento de resultados de ferramenta e as reescritas de transcrição do context-engine alteram
  linhas de transcrição SQLite e, em seguida, atualizam o estado ativo do prompt a partir do banco de dados.
  Acréscimos persistidos de mensagens do SessionManager delegam ao helper atômico de acréscimo de transcrição SQLite
  para seleção de pai e idempotência. Acréscimos normais
  de metadados/entradas personalizadas também selecionam o pai atual dentro do SQLite, então
  instâncias obsoletas do gerenciador não ressuscitam disputas de cadeia de pais pré-SQLite.
  A limpeza sintética de cauda PI para pré-verificações no meio do turno e `sessions_yield` agora
  apara o estado de transcrição SQLite diretamente; a antiga ponte de remoção de cauda do SessionManager
  e seus testes foram excluídos.
  A captura de checkpoint de Compaction também cria snapshots apenas a partir do SQLite; chamadores
  não passam mais um SessionManager ativo como fonte alternativa de transcrição.
- Manter testes que semeiam arquivos legados somente para migração.
- Provas baseadas em arquivos JSON foram substituídas por provas de linhas SQL para superfícies ativas de runtime.

- Adicionar proibições estáticas para gravações de runtime em caminhos JSON legados de sessão/cache.
  Concluído para a proteção do repositório.

10. Tornar o relatório de migração auditável.
    - Registrar execuções de migração em SQLite com carimbos de data/hora de início/fim, caminhos
      de origem, hashes de origem, contagens, avisos e caminho de backup.
      Concluído: execuções de migração de estado legado agora persistem um relatório `migration_runs`
      com inventário de caminho/tabela de origem, SHA-256 do arquivo de origem, tamanhos,
      contagens de registros, avisos e caminho de backup.
      Concluído: execuções de migração de estado legado também persistem linhas `migration_sources`
      para auditoria em nível de origem e futuras decisões de pular/preencher retroativamente.
    - Tornar a aplicação idempotente. Reexecutar após uma importação parcial deve
      pular uma origem já importada ou mesclar por chave estável.
      Concluído: índices de sessão, transcrições, filas de entrega, estado de plugin, livros-razão de tarefas
      e linhas SQLite globais pertencentes a agentes importam por chaves estáveis ou
      semântica de upsert/substituição, então reexecuções mesclam sem duplicar linhas duráveis.
    - Importações com falha devem manter o arquivo de origem original no lugar.
      Concluído: importações de transcrição com falha agora deixam a origem JSONL original em
      seu caminho detectado, e `migration_sources` registra a origem como
      `warning` com `removed_source=0` para a próxima execução do doctor.

## Regras de performance

- Uma conexão por thread/processo é adequada; não compartilhe handles entre
  workers.
- Use WAL, `foreign_keys=ON`, um tempo limite de ocupado de 30s e transações de escrita curtas `BEGIN IMMEDIATE`.
- Mantenha helpers de transação de escrita síncronos a menos/até que uma API de transação assíncrona
  adicione semântica explícita de mutex/backpressure.
- Mantenha gravações de entrega de pai pequenas e transacionais.
- Evite reescritas de armazenamento inteiro; use upsert/delete em nível de linha.
- Adicione índices para listagem por agente, listagem por sessão, updated-at, id de execução e
  caminhos de expiração antes de mover código quente.
- Armazene artefatos grandes, mídia e vetores como BLOBs ou linhas BLOB em chunks, não
  JSON com base64 ou array numérico.
- Mantenha entradas opacas de plugin-state pequenas e escopadas.
- Adicione limpeza SQL para TTL/expiração em vez de poda no sistema de arquivos.
  Concluído para armazenamentos de runtime pertencentes ao banco de dados: mídia, estado de plugin, blobs de plugin,
  deduplicação persistente e cache de agente expiram todos por linhas SQLite. A limpeza restante
  do sistema de arquivos é limitada a materializações temporárias ou comandos explícitos
  de remoção.

## Proibições estáticas

Adicionar uma verificação de repositório que falhe novas gravações de runtime em caminhos de estado legados:

- `sessions.json`
- `*.trajectory.jsonl`, exceto saídas materializadas de pacote de suporte
- `.acp-stream.jsonl`
- `acp/event-ledger.json`
- arquivos de cache de runtime `cache/*.json`
- `agents/<agentId>/agent/auth.json`
- `agents/<agentId>/agent/models.json`
- `credentials/oauth.json`
- `github-copilot.token.json`
- `openrouter-models.json`
- `auth-profiles.json`
- `auth-state.json`
- `exec-approvals.json`
- `workspace-state.json`
- `credentials*.json` do Matrix e `recovery-key.json`
- `cron/runs/*.jsonl`
- `cron/jobs.json`
- `jobs-state.json`
- `device-pair-notify.json`
- `devices/pending.json`
- `devices/paired.json`
- `devices/bootstrap.json`
- `nodes/pending.json`
- `nodes/paired.json`
- `identity/device.json`
- `identity/device-auth.json`
- `push/web-push-subscriptions.json`
- `push/vapid-keys.json`
- `push/apns-registrations.json`
- `process-leases.json`
- `gateway-instance-id`
- `session-toggles.json`
- `.dreams/events.jsonl` do núcleo de memória
- `.dreams/session-corpus/` do núcleo de memória
- `.dreams/daily-ingestion.json` do núcleo de memória
- `.dreams/session-ingestion.json` do núcleo de memória
- `.dreams/short-term-recall.json` do núcleo de memória
- `.dreams/phase-signals.json` do núcleo de memória
- `.dreams/short-term-promotion.lock` do núcleo de memória
- `skill-workshop/<workspace>.json` do Workshop de Skills
- `skill-workshop/skill-workshop-review-*.json` do Workshop de Skills
- `bus-state-*.json` do Nostr
- `profile-state-*.json` do Nostr
- `calls.jsonl`
- `known-users.json`
- `ref-index.jsonl`
- `session-*.json` do QQBot
- `bluebubbles/catchup/*.json` do BlueBubbles
- `bluebubbles/inbound-dedupe/*.json` do BlueBubbles
- `update-offset-*.json` do Telegram
- `sticker-cache.json` do Telegram
- `*.telegram-messages.json` do Telegram
- `*.telegram-sent-messages.json` do Telegram
- `*.telegram-topic-names.json` do Telegram
- `thread-bindings-*.json` do Telegram
- `catchup/*.json` do iMessage
- `reply-cache.jsonl` do iMessage
- `sent-echoes.jsonl` do iMessage
- `msteams-conversations.json` do Microsoft Teams
- `msteams-polls.json` do Microsoft Teams
- `msteams-sso-tokens.json` do Microsoft Teams
- `*.learnings.json` do Microsoft Teams
- `bot-storage.json` do Matrix
- `sync-store.json` do Matrix
- `thread-bindings.json` do Matrix
- `inbound-dedupe.json` do Matrix
- `startup-verification.json` do Matrix
- `storage-meta.json` do Matrix
- `crypto-idb-snapshot.json` do Matrix
- `model-picker-preferences.json` do Discord
- `command-deploy-cache.json` do Discord
- arquivos JSON de fragmentos do registro de sandbox
- arquivos JSON de ponte `/tmp` do relay de gancho nativo
- `plugin-state/state.sqlite`
- auxiliares de runtime ad hoc `openclaw-state.sqlite`
- `tasks/runs.sqlite`
- `tasks/flows/registry.sqlite`
- `bindings/current-conversations.json`
- `restart-sentinel.json`
- `gateway-restart-intent.json`
- `gateway-supervisor-restart-handoff.json`
- `gateway.<hash>.lock`
- `qmd/embed.lock`
- `commands.log`
- `config-health.json`
- `port-guard.json`
- `settings/voicewake.json`
- `settings/voicewake-routing.json`
- `plugin-binding-approvals.json`
- `plugins/installs.json`
- `audit/file-transfer.jsonl`
- `audit/crestodian.jsonl`
- `crestodian/rescue-pending/*.json`
- `plugins/phone-control/armed.json`
- `.openclaw-wiki/log.jsonl` da Wiki de memória
- `.openclaw-wiki/state.json` da Wiki de memória
- `.openclaw-wiki/locks/` da Wiki de memória
- `.openclaw-wiki/source-sync.json` da Wiki de memória
- `.openclaw-wiki/import-runs/*.json` da Wiki de memória
- `.openclaw-wiki/cache/agent-digest.json` da Wiki de memória
- `.openclaw-wiki/cache/claims.jsonl` da Wiki de memória
- `.clawhub/lock.json` do ClawHub
- `.clawhub/origin.json` do ClawHub
- decoração de perfil do navegador `.openclaw-profile-decorated`
- abridores de sessão com suporte em arquivo `SessionManager.open(...)`
- `SessionManager.listAll(...)` e `TranscriptSessionManager.listAll(...)`
  facades de listagem de transcrições
- `SessionManager.forkFromSession(...)` e
  `TranscriptSessionManager.forkFromSession(...)` facades de fork de transcrição
- `SessionManager.newSession(...)` e `TranscriptSessionManager.newSession(...)`
  facades de substituição de sessão mutável
- `SessionManager.createBranchedSession(...)` e
  `TranscriptSessionManager.createBranchedSession(...)` facades de sessão ramificada

A proibição deve permitir que testes criem fixtures legados e permitir que o código de migração
leia/importe/remova fontes de arquivos legadas. Auxiliares SQLite não lançados continuam proibidos
e não recebem permissões de importação do doctor.

## Critérios de conclusão

- Escritas de dados e cache de runtime vão para o banco de dados SQLite global ou do agente.
- O runtime não grava mais índices de sessão, JSONL de transcrição, JSON de registro de sandbox,
  SQLite auxiliar de tarefa nem SQLite auxiliar de estado de Plugin. Os importadores SQLite auxiliares
  de tarefa e de estado de Plugin não lançados são excluídos.
- A importação de arquivos legados é somente via doctor.
- O backup produz um arquivo compactado com snapshots SQLite compactos e prova de integridade.
- Workers de agente podem executar com armazenamento em disco, scratch VFS ou VFS-only experimental.
- Arquivos de configuração e credenciais explícitas continuam sendo os únicos arquivos persistentes
  de controle que não são de banco de dados esperados.
- Verificações do repositório impedem a reintrodução de armazenamentos de arquivos de runtime legados.
