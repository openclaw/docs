---
read_when:
    - Movendo dados de runtime, cache, transcrições, estado de tarefas ou arquivos de rascunho do OpenClaw para SQLite
    - Projetando migrações do doctor a partir de arquivos JSON ou JSONL legados
    - Alteração do comportamento de backup, restauração, VFS ou armazenamento de workers
    - Remoção de bloqueios de sessão, poda, truncamento ou caminhos de compatibilidade JSON
summary: Plano de migração para tornar o SQLite a camada primária de estado durável e cache, mantendo a configuração baseada em arquivo
title: Refatoração de estado com banco de dados em primeiro lugar
x-i18n:
    generated_at: "2026-06-27T18:08:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54995a9f43f740e7cc3ac3e0a4b69d73ddba6b2c30731193ab7ce3aa1dfc9d94
    source_path: refactor/database-first.md
    workflow: 16
---

# Refatoração de estado com banco de dados em primeiro lugar

## Decisão

Use um layout SQLite de dois níveis:

- Banco de dados global: `~/.openclaw/state/openclaw.sqlite`
- Banco de dados do agente: um banco de dados SQLite por agente para workspace,
  transcrição, VFS, artefatos e estado de tempo de execução grande pertencentes
  ao agente
- A configuração continua baseada em arquivos: `openclaw.json` permanece fora do
  banco de dados. Perfis de autenticação de tempo de execução migram para SQLite;
  arquivos de credenciais de provedores externos ou da CLI continuam gerenciados
  pelo proprietário fora do banco de dados do OpenClaw.

O banco de dados global é o banco de dados do plano de controle. Ele é dono da
descoberta de agentes, estado compartilhado do Gateway, pareamento, estado de
dispositivos/nós, registros de tarefas e fluxos, estado de plugins, estado de
tempo de execução do agendador, metadados de backup e estado de migração.

O banco de dados do agente é o banco de dados do plano de dados. Ele é dono dos
metadados de sessão do agente, fluxo de eventos de transcrição, workspace de VFS
ou namespace de rascunho, artefatos de ferramentas, artefatos de execução e dados
de cache locais do agente pesquisáveis/indexáveis.

Isso oferece uma visão global durável sem forçar workspaces grandes de agentes,
transcrições e dados binários de rascunho para a via de escrita compartilhada do
Gateway.

## Contrato rígido

Esta migração tem uma única forma canônica de tempo de execução:

- Linhas de sessão persistem apenas metadados de sessão. Elas não devem persistir
  `transcriptLocator`, caminhos de arquivos de transcrição, caminhos JSONL
  irmãos, caminhos de trava, metadados de poda ou ponteiros de compatibilidade da
  era de arquivos.
- A identidade da transcrição é sempre identidade SQLite: `{agentId, sessionId}`
  mais metadados opcionais de tópico quando o protocolo precisar.
- `sqlite-transcript://...` não é uma identidade de tempo de execução nem de
  protocolo. Código novo não deve derivar, persistir, passar, analisar nem migrar
  localizadores de transcrição. Tempo de execução e testes não devem conter
  pseudolocalizadores; a documentação pode mencionar a string apenas para
  proibi-la.
- `sessions.json` legado, JSONL de transcrição, `.jsonl.lock`, poda, truncamento
  e lógica antiga de caminho de sessão pertencem somente ao caminho de
  migração/importação do doctor.
- Aliases legados de configuração de sessão pertencem somente à migração do
  doctor. O tempo de execução não interpreta `session.idleMinutes`,
  `session.resetByType.dm` nem aliases de sessão principal
  `agent:main:*` entre agentes para outro agente configurado.
- A identidade de roteamento de sessão é estado relacional tipado. Caminhos
  quentes de tempo de execução e UI devem ler `sessions.session_scope`,
  `sessions.account_id`, `sessions.primary_conversation_id`, `conversations` e
  `session_conversations`; eles não devem analisar `session_key` nem minerar
  `session_entries.entry_json` para identidade de provedor, exceto como sombra
  de compatibilidade enquanto pontos de chamada antigos estão sendo removidos.
- Marcadores de mensagem direta no nível do canal, como `dm` versus `direct`, são
  vocabulário de roteamento, não localizadores de transcrição nem identificadores
  de compatibilidade de armazenamento em arquivos.
- Configuração legada de manipuladores de hooks pertence somente a superfícies de
  aviso/migração do doctor. O tempo de execução não deve carregar
  `hooks.internal.handlers`; hooks executam apenas por diretórios de hooks
  descobertos e metadados `HOOK.md`.
- Inicialização de tempo de execução, caminhos quentes de resposta, Compaction,
  redefinição, recuperação, diagnósticos, TTS, hooks de memória, subagentes,
  roteamento de comandos de plugins, limites de protocolo e hooks devem passar
  `{agentId, sessionId}` pelo tempo de execução.
- Testes devem semear e validar linhas de transcrição SQLite por meio de
  `{agentId, sessionId}`. Testes que provam apenas encaminhamento de caminho
  JSONL, preservação de localizador fornecido pelo chamador ou compatibilidade de
  arquivo de transcrição devem ser removidos, a menos que cubram importação do
  doctor, materialização de suporte/depuração que não seja de sessão ou forma de
  protocolo.
- `runEmbeddedPiAgent(...)`, execuções de workers preparados e a tentativa
  incorporada interna não devem aceitar localizadores de transcrição. Eles abrem
  o gerenciador de transcrição SQLite por `{agentId, sessionId}` e passam esse
  gerenciador para a sessão de agente compatível com PI internalizada, para que
  chamadores obsoletos não façam o runner gravar transcrições JSON/JSONL.
- Diagnósticos do runner devem armazenar registros de rastreamento de
  tempo de execução/cache/payload em SQLite. Diagnósticos de tempo de execução
  não devem expor controles de substituição de arquivo JSONL nem helpers
  genéricos de exportação de JSONL de transcrição; exportações voltadas ao
  usuário podem materializar artefatos explícitos a partir de linhas do banco de
  dados sem realimentar nomes de arquivos no tempo de execução.
- Registro bruto de stream usa `OPENCLAW_RAW_STREAM=1` mais linhas de
  diagnóstico SQLite. O contrato antigo do pi-mono `PI_RAW_STREAM`,
  `PI_RAW_STREAM_PATH` e do logger de arquivo `raw-openai-completions.jsonl` não
  faz parte do tempo de execução nem dos testes do OpenClaw.
- A indexação de memória QMD não deve exportar transcrições SQLite para arquivos
  markdown. QMD indexa apenas arquivos de memória configurados; a busca de
  transcrições de sessão permanece baseada em SQLite.
- O subcaminho do SDK QMD é somente para QMD em código novo. Helpers de indexação
  de transcrições de sessão SQLite vivem em
  `memory-core-host-engine-session-transcripts`; qualquer reexportação QMD é
  apenas compatibilidade e não deve ser usada por código de tempo de execução.
- Índices de memória integrados vivem no banco de dados do agente proprietário.
  Configuração de tempo de execução e contratos de tempo de execução resolvidos
  não devem expor `memorySearch.store.path`; o doctor remove essa chave legada de
  configuração, e o código atual passa o `databasePath` do agente internamente.

O trabalho de implementação deve continuar removendo código até que essas
declarações sejam verdadeiras sem exceções fora dos limites de
doctor/importação/exportação/depuração.

## Estado desejado e progresso

### Objetivo rígido

- Um banco de dados SQLite global é dono do estado do plano de controle:
  `state/openclaw.sqlite`.
- Um banco de dados SQLite por agente é dono do estado do plano de dados:
  `agents/<agentId>/agent/openclaw-agent.sqlite`.
- A configuração continua baseada em arquivos. `openclaw.json` não faz parte
  desta refatoração de banco de dados.
- Arquivos legados são apenas entradas de migração do doctor.
- O tempo de execução nunca grava nem lê JSONL de sessão ou transcrição como
  estado ativo.

### Estados desejados

- `not-started`: código de tempo de execução da era de arquivos ainda grava
  estado ativo.
- `migrating`: código de doctor/importação consegue mover dados de arquivos para
  SQLite.
- `dual-read`: ponte temporária lê SQLite e arquivos legados. Este estado é
  proibido para esta refatoração, a menos que esteja explicitamente documentado
  como somente doctor.
- `sqlite-runtime`: tempo de execução lê e grava apenas SQLite.
- `clean`: APIs e testes legados de tempo de execução foram removidos, e a
  guarda impede regressões.
- `done`: documentação, testes, backup, migração do doctor e verificações de
  alterações comprovam o estado limpo.

### Estado atual

- Sessões: `clean` para tempo de execução. Linhas de sessão vivem no banco de
  dados por agente, APIs de tempo de execução usam `{agentId, sessionId}` ou
  `{agentId, sessionKey}`, e `sessions.json` é entrada legada somente do doctor.
- Transcrições: `clean` para tempo de execução. Eventos de transcrição,
  identidades, snapshots e eventos de tempo de execução de trajetória vivem no
  banco de dados por agente. O tempo de execução não aceita mais localizadores de
  transcrição nem caminhos JSONL de transcrição.
- Runner PI incorporado: `clean`. Execuções PI incorporadas, workers preparados,
  Compaction e loops de repetição usam escopo de sessão SQLite e rejeitam
  identificadores obsoletos de transcrição.
- Cron: `clean` para tempo de execução. O tempo de execução usa `cron_jobs` e
  `cron_run_logs`; testes de tempo de execução usam nomenclatura SQLite
  `storeKey`, e caminhos de cron da era de arquivos permanecem somente em testes
  de migração legada do doctor.
- Registro de tarefas: `clean`. Linhas de tempo de execução de tarefas e Task
  Flow vivem em `state/openclaw.sqlite`; importadores SQLite sidecar não lançados
  foram removidos.
- Estado de plugins: `clean`. Linhas de estado/blob de plugins vivem no banco de
  dados global compartilhado; helpers antigos de SQLite sidecar de estado de
  plugins estão protegidos contra uso.
- Memória: `sqlite-runtime` para memória integrada e indexação de transcrições de
  sessão. Tabelas de índice de memória vivem no banco de dados por agente, estado
  de memória de plugins usa linhas compartilhadas de estado de plugins, e
  arquivos legados de memória são entradas de migração do doctor ou conteúdo do
  workspace do usuário.
- Backup: `sqlite-runtime`. Etapas de backup compactam snapshots SQLite, omitem
  sidecars WAL/SHM ativos, verificam integridade SQLite e registram execuções de
  backup no banco de dados global.
- Migração do doctor: `migrating`, intencionalmente. O doctor importa JSON, JSONL
  e armazenamentos sidecar aposentados legados para SQLite, registra execuções e
  fontes de migração e remove fontes bem-sucedidas.
- Scripts E2E: `clean` para cobertura de tempo de execução. Seed do Docker MCP
  grava linhas SQLite. O script Docker de contexto de tempo de execução cria JSONL
  legado somente dentro da seed de migração do doctor e nomeia explicitamente o
  caminho do índice de sessão legado.

### Trabalho restante

- [x] Renomear variáveis de armazenamento de testes de tempo de execução do cron
      para longe de `storePath`, a menos que sejam entradas legadas do doctor.
      Arquivos: `src/cron/service.test-harness.ts`,
      `src/cron/service.runs-one-shot-main-job-disables-it.test.ts`,
      `src/cron/service/timer.regression.test.ts`,
      `src/cron/service/ops.test.ts`, `src/cron/service/store.test.ts`,
      `src/cron/service.heartbeat-ok-summary-suppressed.test.ts`,
      `src/cron/service.main-job-passes-heartbeat-target-last.test.ts`,
      `src/cron/store.test.ts`.
      Prova: `pnpm check:database-first-legacy-stores`; `rg -n 'storePath' src/cron --glob '!**/commands/doctor/**'`.
- [x] Remover ou renomear mocks obsoletos de testes de exportação da era de
      arquivos.
      Arquivo: `src/auto-reply/reply/commands-export-test-mocks.ts`.
      Prova: `rg -n 'resolveSessionFilePath|sessionFile|storePath|transcriptLocator' src/auto-reply/reply`.
- [x] Tornar a seed JSONL legada de contexto de tempo de execução do Docker
      obviamente somente doctor.
      Arquivo: `scripts/e2e/session-runtime-context-docker-client.ts`.
      Prova: `rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts` mostra apenas
      `seedBrokenLegacySessionForDoctorMigration`.
- [x] Manter tipos gerados Kysely alinhados após qualquer alteração de esquema.
      Arquivos: `src/state/openclaw-state-schema.sql`,
      `src/state/openclaw-agent-schema.sql`,
      `src/state/*generated*`.
      Prova: nenhuma alteração de esquema nesta passagem; `pnpm db:kysely:check`;
      `pnpm lint:kysely`.
- [x] Reexecutar testes focados para armazenamentos, comandos e scripts tocados.
      Prova: `pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-trajectory.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`; `git diff --check`.
- [x] Antes de declarar `done`, executar a guarda de alterações ou prova ampla
      remota.
      Prova: `pnpm check:changed --timed -- <changed extension paths>` passou na
      execução Hetzner Crabbox `run_3f1cabf6b25c` após configuração temporária de
      Node 24/pnpm e roteamento explícito de caminhos para o workspace sincronizado
      sem `.git`.

### Não regredir

- Sem localizadores de transcrição.
- Sem arquivos de sessão ativos.
- Sem fixtures JSONL falsas de teste, exceto testes de migração legada do doctor.
- Sem acesso SQLite bruto onde Kysely é esperado.
- Sem novas migrações de banco de dados legado. Este layout não foi lançado;
  mantenha a versão do esquema em `1`, a menos que haja um motivo forte.

## Suposições da leitura de código

Nenhuma decisão de produto de acompanhamento bloqueia este plano. A implementação
deve prosseguir com estas suposições:

- Use `node:sqlite` diretamente e exija o runtime Node 22+ para este caminho de
  armazenamento.
- Mantenha exatamente um arquivo de configuração normal. Não mova configurações,
  manifestos de Plugin nem workspaces Git para o SQLite nesta refatoração.
- Arquivos de compatibilidade de runtime não são necessários. Arquivos JSON e
  JSONL legados são apenas entradas de migração. Os sidecars SQLite locais da
  branch nunca foram distribuídos e são excluídos em vez de importados.
- `openclaw doctor --fix` é responsável pela etapa de migração de arquivos
  legados para o banco de dados. A inicialização do runtime e `openclaw migrate`
  não devem carregar caminhos legados de atualização de banco de dados do
  OpenClaw.
- A compatibilidade de credenciais segue a mesma regra: credenciais de runtime
  ficam no SQLite. Arquivos antigos `auth-profiles.json`, `auth.json` por agente
  e arquivos compartilhados `credentials/oauth.json` são entradas de migração do
  doctor e depois removidos após a importação.
- O estado gerado do catálogo de modelos tem respaldo em banco de dados. O código
  de runtime não deve gravar `agents/<agentId>/agent/models.json`; arquivos
  `models.json` existentes são entradas legadas do doctor e são removidos após a
  importação para `agent_model_catalogs`.
- O runtime não deve migrar, normalizar nem interligar localizadores de
  transcrição. A identidade ativa da transcrição é `{agentId, sessionId}` no
  SQLite. Caminhos de arquivo são apenas entradas legadas do doctor, e
  `sqlite-transcript://...` deve desaparecer das superfícies de runtime,
  protocolo, hook e Plugin, em vez de ser tratado como um identificador de
  fronteira.
- Leituras de transcrição SQLite no runtime não executam migrações antigas de
  formato de entrada JSONL nem reescrevem transcrições inteiras por
  compatibilidade. A normalização de entradas legadas permanece em utilitários
  explícitos de doctor/importação. O doctor normaliza arquivos de transcrição
  JSONL legados antes de inserir linhas SQLite; as linhas atuais de runtime já
  são gravadas no esquema de transcrição atual. A exportação de
  trajetória/sessão lê essas linhas como estão e não deve executar migrações
  legadas no momento da exportação.
- Auxiliares legados de parse/migração de transcrições JSONL são exclusivos do
  doctor. O código de formato de transcrição do runtime cria apenas o contexto
  atual de transcrição SQLite; o doctor é responsável por atualizar entradas
  JSONL antigas antes de inserir linhas.
- O auxiliar antigo de streaming de transcrição JSONL pertencente ao runtime foi
  excluído. O código de importação do doctor é responsável por leituras
  explícitas de arquivos legados; o histórico de sessão do runtime lê linhas
  SQLite.
- As vinculações do servidor de aplicativo do Codex usam o `sessionId` do
  OpenClaw como a chave canônica no namespace de estado do Plugin Codex.
  `sessionKey` é metadado para roteamento/exibição e não deve substituir o id
  durável da sessão nem ressuscitar a identidade por arquivo de transcrição.
- Mecanismos de contexto recebem diretamente o contrato atual do runtime. O
  registro não deve envolver mecanismos com shims de repetição que excluam
  `sessionKey`, `transcriptScope` ou `prompt`; mecanismos que não conseguem
  aceitar os parâmetros atuais priorizando banco de dados devem falhar de forma
  explícita em vez de serem interligados.
- A saída de backup deve permanecer um único arquivo de archive. O conteúdo do
  banco de dados deve entrar nesse archive como snapshots SQLite compactos, não
  como sidecars WAL brutos ao vivo.
- A busca de transcrições é útil, mas não é obrigatória para o primeiro corte
  priorizando banco de dados. Projete o esquema para que FTS possa ser adicionado
  depois.
- A execução de worker deve permanecer experimental atrás de configurações
  enquanto a fronteira do banco de dados se estabiliza.

## Descobertas da Leitura de Código

A branch atual já passou do estágio de prova de conceito. O banco de dados
compartilhado existe, o `node:sqlite` do Node está conectado por meio de um
pequeno auxiliar de runtime, e armazenamentos anteriores agora gravam em
`state/openclaw.sqlite` ou no banco de dados `openclaw-agent.sqlite`
correspondente.

O trabalho restante não é escolher SQLite; é manter a nova fronteira limpa e
excluir quaisquer interfaces com formato de compatibilidade que ainda pareçam o
antigo mundo de arquivos:

- `storePath` de sessão não é mais uma identidade de runtime, formato de fixture
  de teste nem campo de payload de status. Testes de runtime e ponte não contêm
  mais o nome de contrato `storePath`; código de doctor/migração é responsável
  por esse vocabulário legado.
- Gravações de sessão não passam mais pela antiga fila em processo
  `store-writer.ts`. Gravações de patches SQLite usam detecção de conflito e
  repetição limitada.
- A descoberta de caminhos legados ainda tem usos válidos de migração, mas o
  código de runtime deve parar de tratar `sessions.json` e arquivos JSONL de
  transcrição como possíveis destinos de gravação.
- Tabelas pertencentes a agentes ficam em bancos de dados SQLite por agente. O
  banco de dados global mantém linhas de registro/plano de controle; a identidade
  da transcrição é `{agentId, sessionId}` nas linhas de transcrição por agente.
  O código de runtime não deve persistir caminhos de arquivo de transcrição nem
  migrar localizadores de transcrição.
- O doctor já importa vários arquivos legados. A limpeza é transformar isso em
  uma única implementação explícita de migração chamada pelo doctor, com um
  relatório de migração durável.

Nenhuma pergunta adicional de produto bloqueia a implementação.

## Forma Atual do Código

A branch já tem uma base SQLite compartilhada real:

- O piso de runtime agora é Node 22+: `package.json`, a proteção de runtime da CLI,
  os padrões do instalador, o localizador de runtime do macOS, a CI e a documentação
  pública de instalação agora concordam. A antiga faixa de compatibilidade com Node 22 foi removida.
- `src/state/openclaw-state-db.ts` abre `openclaw.sqlite`, define WAL,
  `synchronous=NORMAL`, `busy_timeout=30000`, `foreign_keys=ON` e aplica
  o módulo de esquema gerado derivado de
  `src/state/openclaw-state-schema.sql`.
- Tipos de tabela do Kysely e módulos de esquema de runtime são gerados a partir de bancos
  SQLite descartáveis criados a partir dos arquivos `.sql` versionados; o código de runtime
  não mantém mais strings de esquema copiadas e coladas para bancos globais, por agente ou de
  captura de proxy.
- As stores de runtime derivam tipos de linhas selecionadas e inseridas dessas interfaces
  Kysely `DB` geradas, em vez de sombrear manualmente os formatos de linha do SQLite. SQL bruto
  permanece limitado à aplicação de esquema, pragmas e DDL somente de migração.
- Os esquemas SQLite foram reduzidos para `user_version = 1` porque este layout de banco
  ainda não foi lançado. Os abridores de runtime criam somente o esquema atual;
  a importação de arquivo para banco permanece no código do doctor, e os helpers locais de branch
  para upgrade de banco foram excluídos.
- A propriedade relacional é aplicada onde o limite de propriedade é canônico:
  linhas de migração de origem cascateiam a partir de `migration_runs`, o estado de entrega de tarefas
  cascateia a partir de `task_runs`, e linhas de identidade de transcript cascateiam a partir de
  eventos de transcript.
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
- Estado arbitrário pertencente ao Plugin não recebe tabelas tipadas pertencentes ao host. Plugins
  instalados usam `plugin_state_entries` para payloads JSON versionados e
  `plugin_blob_entries` para bytes, com propriedade de namespace/chave, limpeza por TTL,
  backup e registros de migração de Plugin. Estado de orquestração de Plugin pertencente ao host
  ainda pode ter tabelas tipadas quando o host possui o contrato de consulta, como
  `plugin_binding_approvals`.
- Migrações de Plugin são migrações de dados sobre namespaces pertencentes ao Plugin, não migrações
  de esquema do host. Um Plugin pode migrar suas próprias entradas versionadas de estado/blob
  por meio de um provedor de migração, e o host registra status de origem/execução no
  livro-razão normal de migração. Novas instalações de Plugin não exigem alteração de
  `openclaw-state-schema.sql`, a menos que o próprio host esteja assumindo propriedade de um
  novo contrato entre Plugins.
- `src/state/openclaw-agent-db.ts` abre
  `agents/<agentId>/agent/openclaw-agent.sqlite`, registra o banco no
  DB global e possui tabelas locais do agente para sessão, transcript, VFS, artefato, cache
  e índice de memória. A descoberta de runtime compartilhada agora lê o registro
  `agent_databases` com tipagem gerada em vez de reimplementar essa consulta em cada ponto
  de chamada.
- Bancos globais e por agente registram uma linha `schema_meta` com papel do banco,
  versão do esquema, timestamps e id do agente para bancos de agente. O layout ainda
  permanece em `user_version = 1` porque este esquema SQLite ainda não foi lançado.
- A identidade de sessão por agente agora tem uma tabela raiz canônica `sessions` com chave por
  `session_id`, com `session_key`, `session_scope`, `account_id`,
  `primary_conversation_id`, timestamps, campos de exibição, metadados de modelo,
  id de harness e vínculo pai/spawn como colunas consultáveis. `session_routes`
  é o índice exclusivo de rota ativa de `session_key` para o `session_id`
  atual, para que uma chave de rota possa se mover para uma nova sessão durável sem
  fazer leituras quentes escolherem entre linhas `sessions.session_key` duplicadas. O antigo
  payload em formato de compatibilidade `session_entries.entry_json` fica pendurado na
  raiz durável `session_id` por chave estrangeira; ele não é mais a única
  representação em nível de esquema de uma sessão.
- A identidade de conversa externa por agente também é relacional:
  `conversations` armazena identidade normalizada de provedor/conta/conversa, e
  `session_conversations` vincula uma sessão OpenClaw a uma ou mais conversas
  externas. Isso cobre sessões de DM compartilhadas principais nas quais vários pares podem
  mapear intencionalmente para uma sessão sem mentir em `session_key`. O SQLite também
  impõe exclusividade para a identidade natural do provedor para que a mesma tupla
  canal/conta/tipo/par/thread não possa se bifurcar entre ids de conversa.
  Pares diretos compartilhados principais são vinculados com um papel `participant`, para que uma
  sessão OpenClaw possa representar vários pares de DM externos sem rebaixar
  pares mais antigos para linhas relacionadas vagas. `sessions.primary_conversation_id` ainda
  aponta para o alvo de entrega tipado atual. Colunas fechadas de roteamento/status
  são aplicadas com restrições SQLite `CHECK` em vez de depender apenas de
  unions do TypeScript.
  A projeção de sessão de runtime limpa sombras de roteamento de compatibilidade de
  `session_entries.entry_json` antes de aplicar colunas tipadas de sessão/conversa,
  para que payloads JSON obsoletos não possam ressuscitar alvos de entrega.
  O roteamento de anúncio de subagente também exige o contexto de entrega tipado do SQLite;
  ele não recorre mais a campos de rota de compatibilidade `SessionEntry`.
  A herança de entrega explícita de `chat.send` do Gateway lê o contexto de entrega tipado
  do SQLite em vez dos campos de compatibilidade `origin`/`last*`.
  `tools.effective` também deriva contexto de provedor/conta/thread de linhas tipadas
  de entrega/roteamento do SQLite, não de sombras obsoletas `last*` de entradas de sessão.
  O contexto de prompt de evento do sistema reconstrói campos channel/to/account/thread a partir de
  campos de entrega tipados em vez de sombras `origin`.
  O helper compartilhado `deliveryContextFromSession` e o mapeador de sessão para conversa
  agora ignoram `SessionEntry.origin` inteiramente; somente campos de entrega tipados
  e linhas relacionais de conversa podem criar identidade de rota quente.
  A normalização de entrada de sessão de runtime remove `origin` antes de persistir ou
  projetar `entry_json`, e gravações de metadados de entrada escrevem campos tipados de canal/chat
  mais linhas relacionais de conversa em vez de criar novas sombras de origem.
- Eventos de transcript, snapshots de transcript e eventos de runtime de trajetória agora
  referenciam a raiz canônica `sessions` por agente e cascateiam na exclusão da sessão.
  Linhas de identidade/idempotência de transcript continuam a cascatear a partir da
  linha exata de evento de transcript.
- Índices do núcleo de memória agora usam tabelas explícitas de banco de agente
  `memory_index_meta`, `memory_index_sources`, `memory_index_chunks` e
  `memory_embedding_cache`, com `memory_index_state` acompanhando alterações de revisão.
  Índices laterais opcionais de FTS/vetor são nomeados `memory_index_chunks_fts` e
  `memory_index_chunks_vec` em vez de tabelas genéricas `meta`, `files`, `chunks`,
  `chunks_fts` ou `chunks_vec`. Os nomes canônicos retêm o formato atual de linha
  de caminho/origem e a compatibilidade de embedding serializado. Essas tabelas
  são cache derivado/de busca, não armazenamento canônico de transcript; elas podem ser
  excluídas e reconstruídas a partir de arquivos de workspace de memória e fontes configuradas.
  Abrir um índice de memória com nome genérico lançado migra seus metadados, fontes,
  chunks e cache de embedding para as tabelas canônicas; tabelas derivadas de FTS/vetor
  são reconstruídas com seus nomes canônicos.
- O estado de recuperação de execução de subagente agora vive em linhas compartilhadas tipadas
  `subagent_runs`, com chaves indexadas de sessão filho, solicitante e controlador. O antigo
  arquivo `subagents/runs.json` é somente entrada de migração do doctor.
- Os vínculos de conversa atuais agora vivem em linhas compartilhadas tipadas
  `current_conversation_bindings` com chave por id de conversa normalizado, com
  colunas de agente/sessão alvo, tipo de conversa, status, expiração e metadados
  armazenadas como colunas relacionais em vez de um registro de vínculo opaco duplicado.
  A chave de vínculo durável inclui o tipo de conversa normalizado para que
  refs diretas/de grupo/de canal não colidam, e o SQLite rejeita valores inválidos
  de tipo/status de vínculo. O antigo
  arquivo `bindings/current-conversations.json` é somente entrada de migração do doctor.
- A recuperação da fila de entrega agora sobrepõe colunas tipadas de fila para canal, alvo,
  conta, sessão, tentativa, erro, envio de plataforma e estado de recuperação sobre o
  JSON de replay. `entry_json` mantém os payloads de replay, hooks e formatação,
  mas colunas tipadas são autoritativas para roteamento/estado quente da fila.
- Ponteiros de restauração de última sessão da TUI agora vivem em linhas compartilhadas tipadas
  `tui_last_sessions` com chave pelo escopo de conexão/sessão da TUI com hash.
  O antigo arquivo JSON da TUI é somente entrada de migração do doctor.
- Preferências padrão de TTS agora vivem em linhas SQLite de estado de Plugin compartilhado sob o
  Plugin `speech-core`. O antigo arquivo `settings/tts.json` é somente entrada de migração
  do doctor; o runtime não lê nem grava mais arquivos JSON de preferências de TTS, e o
  resolvedor de caminho legado vive no módulo de migração do doctor.
- Metadados de destino secreto agora falam sobre stores em vez de fingir que todo
  destino de credencial é um arquivo de configuração. `openclaw.json` permanece a store de configuração;
  alvos de perfil de autenticação usam linhas SQLite tipadas `auth_profile_stores`, com
  credenciais no formato do provedor mantidas como payloads JSON.
- A auditoria de segredos não varre mais arquivos `auth.json` por agente aposentados. O doctor possui
  o aviso, a importação e a remoção desse arquivo legado.
- Helpers legados de caminho de perfil de autenticação agora vivem no código legado do doctor. Helpers
  principais de caminho de perfil de autenticação expõem identidade e locais de exibição de store de autenticação SQLite,
  não caminhos de runtime `auth-profiles.json` ou `auth-state.json`.
- Módulos de runtime de recuperação de execução de subagente e cache de capacidade de modelo do OpenRouter
  agora mantêm leitores/gravadores de snapshot SQLite separados de helpers de importação JSON legados
  somente do doctor. Capacidades do OpenRouter usam as linhas genéricas tipadas
  `model_capability_cache` sob `provider_id = "openrouter"` em vez de
  um blob opaco de cache ou uma tabela de host específica de provedor. `taskName` da execução de subagente
  é armazenado na coluna tipada `subagent_runs.task_name`; a cópia
  `payload_json` é dado de replay/debug, não a fonte para campos quentes de exibição ou
  consulta.
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts` implementa um VFS SQLite
  sobre a tabela `vfs_entries` do banco do agente. Leituras de diretório, exportações
  recursivas, exclusões e renomeações usam intervalos de prefixo indexados `(namespace, path)`
  em vez de varrer um namespace inteiro ou depender de correspondência de caminho com `LIKE`.
- `src/agents/runtime-worker.entry.ts` cria VFS SQLite por execução, artefato de ferramenta,
  artefato de execução e stores de cache com escopo para workers.
- Marcadores de conclusão de bootstrap de workspace agora vivem em linhas compartilhadas tipadas
  `workspace_setup_state` com chave pelo caminho resolvido do workspace em vez de
  `.openclaw/workspace-state.json`; o runtime não lê nem reescreve mais o
  marcador legado de workspace, e APIs helper não repassam mais um caminho falso
  `.openclaw/setup-state` apenas para derivar identidade de armazenamento.
- Aprovações de exec agora vivem na linha singleton tipada compartilhada SQLite `exec_approvals_config`.
  O doctor importa o legado `~/.openclaw/exec-approvals.json`;
  gravações de runtime não criam, reescrevem nem relatam mais esse arquivo como seu local de store ativo.
  O companion do macOS lê e grava a mesma linha de tabela
  `state/openclaw.sqlite`; ele mantém somente o socket de prompt Unix no disco
  porque isso é IPC, não estado durável de runtime.
- Módulos de runtime de identidade do dispositivo, autenticação do dispositivo e bootstrap agora mantêm seus
  leitores/gravadores de snapshot SQLite separados de helpers de importação JSON legados somente do doctor.
  Identidade do dispositivo usa linhas tipadas `device_identities`, e tokens de autenticação do dispositivo
  usam linhas tipadas `device_auth_tokens`. Gravações de autenticação do dispositivo reconciliam linhas
  por dispositivo/papel em vez de truncar a tabela de tokens, e o runtime não
  encaminha mais atualizações de token único pelo antigo adaptador de store inteira. O legado
  payloads JSON versão 1 existem apenas como formatos de importação/exportação do doctor.
- O cache de troca de tokens do GitHub Copilot usa a tabela SQLite compartilhada de estado de Plugin
  em `github-copilot/token-cache/default`. É estado de cache de propriedade do provedor,
  portanto intencionalmente não adiciona uma tabela de esquema do host.
- A Compaction do GitHub Copilot não grava mais sidecars de workspace
  `openclaw-compaction-*.json`. O harness chama o RPC de Compaction de histórico do SDK para a
  sessão do SDK rastreada, e o OpenClaw mantém o estado durável de sessão/transcrição no
  SQLite em vez de arquivos marcadores de compatibilidade.
- O runtime Swift compartilhado (`OpenClawKit`) usa as mesmas linhas de
  `state/openclaw.sqlite` para identidade do dispositivo e autenticação do dispositivo. Os
  helpers do app macOS importam os helpers SQLite compartilhados em vez de manter um segundo caminho JSON ou
  SQLite. Um `identity/device.json` legado restante bloqueia a criação de identidade
  até que o doctor o importe para o SQLite, correspondendo ao gate de inicialização do TypeScript e do Android.
- A identidade de dispositivo Android usa o mesmo material de chave compatível com TypeScript
  armazenado em linhas tipadas `state/openclaw.sqlite#table/device_identities`. Ela nunca
  lê nem grava `openclaw/identity/device.json`; um arquivo legado restante bloqueia a
  inicialização até que o doctor o importe para o SQLite.
- Tokens de autenticação de dispositivo Android em cache também usam linhas tipadas
  `state/openclaw.sqlite#table/device_auth_tokens` e compartilham a mesma semântica de token
  versão 1 do TypeScript e do Swift. O runtime não lê mais chaves de compatibilidade `SecurePrefs`
  `gateway.deviceToken*`; elas pertencem apenas à lógica de migração/doctor.
- O histórico de pacotes recentes de notificações Android usa linhas tipadas
  `android_notification_recent_packages`. O runtime não migra nem lê mais as antigas chaves CSV de SharedPreferences.
- A criação de identidade de dispositivo falha de modo fechado quando o `identity/device.json`
  legado existe, quando a linha de identidade SQLite é inválida ou quando o armazenamento de identidade
  SQLite não pode ser aberto. O doctor importa e remove esse arquivo primeiro, para que a inicialização do runtime
  não possa rotacionar silenciosamente a identidade de pareamento antes da migração.
- A seleção de identidade de dispositivo é uma chave de linha SQLite, não um localizador de arquivo JSON. Testes
  e helpers de Gateway passam chaves de identidade explícitas; apenas a migração do doctor e o
  gate de inicialização fail-closed conhecem o nome de arquivo aposentado `identity/device.json`.
- A compatibilidade de redefinição de sessão agora vive na migração de configuração do doctor:
  `session.idleMinutes` é movido para `session.reset.idleMinutes`,
  `session.resetByType.dm` é movido para `session.resetByType.direct`, e a
  política de redefinição do runtime lê apenas chaves de redefinição canônicas.
- A compatibilidade de configuração legada agora vive em `src/commands/doctor/`. A validação normal de
  `readConfigFileSnapshot()` não importa detectores legados do doctor
  nem anota problemas legados; `runDoctorConfigPreflight()` adiciona esses problemas para
  reparo/relatório do doctor. O fluxo de configuração do doctor importa
  `src/commands/doctor/legacy-config.ts`, e o reparo antigo de ID de perfil OAuth vive
  em
  `src/commands/doctor/legacy/oauth-profile-ids.ts`.
- Comandos que não são do doctor não executam automaticamente o reparo de configuração legada. Por exemplo,
  `openclaw update --channel` agora falha em configuração legada inválida e pede ao
  usuário para executar o doctor, em vez de importar silenciosamente código de migração do doctor.
- Web push, APNs, Voice Wake, verificações de atualização e integridade de configuração agora usam tabelas SQLite
  compartilhadas tipadas para assinaturas, chaves VAPID, registros de Node, linhas de gatilho,
  linhas de roteamento, estado de notificação de atualização e entradas de integridade de configuração em vez de
  blobs JSON opacos inteiros. Gravações de snapshot de Web push e APNs agora reconciliam
  assinaturas/registros por chave primária em vez de limpar suas tabelas;
  a integridade de configuração faz o mesmo por caminho de configuração.
  Seus módulos de runtime mantêm leitores/gravadores de snapshot SQLite separados dos
  helpers de importação JSON legados exclusivos do doctor.
- A configuração de host Node agora usa uma linha singleton tipada no banco de dados SQLite compartilhado;
  o doctor importa o antigo arquivo `node.json` antes do uso normal pelo runtime.
- Pareamento de dispositivo/Node, pareamento de canal, listas de permissão de canal e estado de bootstrap
  agora usam linhas SQLite tipadas em vez de blobs JSON opacos inteiros. Aprovações de vínculo de
  Plugin e estado de jobs cron seguem a mesma divisão: módulos de runtime expõem
  operações com SQLite e helpers de snapshot neutros, e gravações de snapshot de pareamento/bootstrap
  mais aprovação de vínculo de Plugin reconciliam linhas por chave primária
  em vez de truncar tabelas, enquanto o doctor importa/remove os antigos arquivos JSON por meio de
  módulos `src/commands/doctor/legacy/*`.
- Registros de Plugin instalados agora vivem no índice SQLite de Plugins instalados.
  Leitura/gravação de configuração em runtime não migra nem preserva mais dados de configuração autorada antigos
  `plugins.installs`; o doctor importa esse formato de configuração legado
  para o SQLite antes do uso normal pelo runtime.
- Snapshots de recuperação de credenciais do QQBot agora vivem no estado de Plugin SQLite em
  `qqbot/credential-backups`. O runtime não grava mais
  `qqbot/data/credential-backup*.json`; o doctor importa e remove esses
  arquivos de backup legados com as outras entradas de estado do QQBot.
- O planejamento de recarga do Gateway compara snapshots do índice SQLite de Plugins instalados em
  um namespace de diff interno `installedPluginIndex.installRecords.*`. As decisões de
  recarga do runtime não envolvem mais essas linhas em objetos falsos de configuração
  `plugins.installs`.
- O upgrade de credenciais de contas nomeadas do Matrix não acontece mais durante leituras de runtime.
  O doctor é responsável pela renomeação antiga do `credentials/matrix/credentials.json`
  de nível superior quando uma conta Matrix única/padrão pode ser resolvida.
- Os módulos de runtime de pareamento central e cron não exportam mais construtores de caminhos JSON legados.
  Módulos legados de propriedade do doctor constroem caminhos de origem `pending.json`, `paired.json`,
  `bootstrap.json` e `cron/jobs.json` apenas para testes de importação e
  migração. A normalização legada do formato de job cron e a importação de log de execução cron
  vivem em `src/commands/doctor/legacy/cron*.ts`.
- `src/commands/doctor/legacy/runtime-state.ts` importa arquivos JSON de estado legados,
  incluindo configuração de host Node, para o SQLite a partir do doctor. Novos importadores de arquivos legados
  permanecem em `src/commands/doctor/legacy/`.
- `src/commands/doctor/state-migrations.ts` importa `sessions.json` legado e
  transcrições `*.jsonl` diretamente para o SQLite e remove fontes bem-sucedidas. Ele
  não faz mais staging de transcrições legadas da raiz por meio de
  `agents/<agentId>/sessions/*.jsonl` nem cria um destino JSONL canônico antes da
  importação.
- Verificações do doctor de integridade de estado não escaneiam mais diretórios de sessão legados nem
  oferecem exclusão de JSONL órfão. Arquivos de transcrição legados são apenas entradas de migração,
  e a etapa de migração é responsável pela importação e pela remoção da origem.
- A importação do registro de sandbox legado vive em
  `src/commands/doctor/legacy/sandbox-registry.ts`; leituras e gravações do registro de sandbox ativo
  permanecem somente SQLite.
- O reparo legado de integridade/importação de transcrição de sessão vive em
  `src/commands/doctor/legacy/session-transcript-health.ts`; módulos de comando de runtime
  não carregam mais parsing de transcrição JSONL nem código de reparo de branch ativo.

Destaques da consolidação/exclusão concluída:

- O estado do Plugin agora usa o banco de dados compartilhado `state/openclaw.sqlite`. O antigo importador auxiliar `plugin-state/state.sqlite` local da ramificação foi removido porque esse layout SQLite nunca foi lançado. Auxiliares de sondagem/teste relatam o `databasePath` compartilhado em vez de expor um caminho SQLite específico de estado de Plugin.
  Descritores de worker preparados também omitem localizadores de transcrição. O
  estado da sessão de tempo de execução e as execuções de acompanhamento enfileiradas carregam `{agentId, sessionId}` em vez de
  identificadores de transcrição derivados.
- A Compaction embutida agora obtém o escopo SQLite de `agentId` e `sessionId`.
  Hooks de Compaction, chamadas do mecanismo de contexto, delegação da CLI e respostas do protocolo
  não devem receber identificadores derivados `sqlite-transcript://...`. Código de
  exportação/depuração pode materializar artefatos explícitos do usuário a partir de linhas, mas não fornece um
  caminho genérico de exportação JSONL de sessão nem realimenta nomes de arquivo na identidade de
  tempo de execução.
- `/export-session` lê linhas de transcrição do SQLite e grava somente a visualização HTML
  autônoma solicitada. O visualizador embutido não reconstrói nem
  baixa mais JSONL de sessão a partir dessas linhas.
- A delegação do mecanismo de contexto não analisa mais um localizador de transcrição para recuperar
  a identidade do agente. O contexto de tempo de execução preparado carrega o `agentId`
  resolvido para o adaptador de Compaction integrado.
- A reescrita de transcrição e o truncamento de resultados de ferramenta ao vivo agora leem e persistem
  o estado da transcrição por `{agentId, sessionId}` e não derivam localizadores
  temporários para cargas de eventos de atualização de transcrição.
- A superfície auxiliar de estado de transcrição não tem mais variantes baseadas em localizador de
  `readTranscriptState`, `replaceTranscriptStateEvents` ou
  `persistTranscriptStateMutation`. Chamadores de tempo de execução devem usar as APIs
  `{agentId, sessionId}`. A importação do doctor lê arquivos legados por caminho de arquivo explícito
  e grava linhas SQLite; ela não migra strings de localizador.
- O contrato do gerenciador de sessões de tempo de execução não expõe mais `open(locator)`,
  `forkFrom(locator)` ou `setTranscriptLocator(...)`. Gerenciadores de sessão
  persistidos abrem apenas por `{agentId, sessionId}`; auxiliares de listagem/fork vivem em
  APIs de sessão e checkpoint orientadas a linhas, em vez da fachada do gerenciador de transcrições.
- As APIs do leitor de transcrição do Gateway são orientadas a escopo. Elas recebem
  `{agentId, sessionId}` e não aceitam um localizador de transcrição posicional que
  poderia acidentalmente se tornar identidade de tempo de execução. A análise de localizador de transcrição
  ativo acabou; caminhos de origem legados são lidos apenas pelo código de importação do doctor.
- Eventos de atualização de transcrição também são orientados a escopo. `emitSessionTranscriptUpdate`
  não aceita mais uma string de localizador simples, e ouvintes roteiam por
  `{agentId, sessionId}` sem analisar um identificador.
- A transmissão de mensagens de sessão do Gateway resolve chaves de sessão a partir do escopo de agente/sessão,
  não de um localizador de transcrição. O antigo resolvedor/cache de chave
  de localizador de transcrição para sessão acabou.
- Filtros SSE de histórico de sessão do Gateway filtram atualizações ao vivo por escopo de agente/sessão. Ele não
  canonicaliza mais candidatos a localizador de transcrição, realpaths ou identidades de transcrição
  em forma de arquivo para decidir se um stream deve receber uma atualização.
- Hooks de ciclo de vida de sessão não derivam nem expõem mais localizadores de transcrição em
  `session_end`. Consumidores de hook recebem `sessionId`, `sessionKey`, ids da próxima sessão
  e contexto do agente; arquivos de transcrição não fazem parte do contrato de ciclo de vida.
- Hooks de reset também não derivam nem expõem mais localizadores de transcrição. A carga
  `before_reset` carrega mensagens SQLite recuperadas mais o motivo do reset,
  enquanto a identidade da sessão permanece no contexto do hook.
- O reset do harness do agente não aceita mais um localizador de transcrição. O despacho de reset é
  escopado por `sessionId`/`sessionKey` mais o motivo.
- Tipos de sessão de extensão de agente não expõem mais `transcriptLocator`; extensões
  devem usar o contexto de sessão e APIs de tempo de execução em vez de buscar uma
  identidade de transcrição em forma de arquivo.
- Hooks de Compaction de Plugin não expõem mais localizadores de transcrição. O contexto do hook
  já carrega a identidade da sessão, e leituras de transcrição devem passar por APIs
  cientes de escopo do SQLite em vez de identificadores em forma de arquivo.
- Hooks `before_agent_finalize` não expõem mais `transcriptPath`, incluindo
  cargas de retransmissão de hook nativo. Hooks de finalização usam apenas contexto de sessão.
- Respostas de reset do Gateway não sintetizam mais um localizador de transcrição na
  entrada retornada. O reset cria linhas de transcrição SQLite, retorna a entrada de sessão
  limpa e deixa o acesso à transcrição para leitores cientes de escopo.
- Resultados de execução embutida e de Compaction não expõem mais localizadores de transcrição para
  contabilidade de sessão. A Compaction automática atualiza apenas o `sessionId` ativo,
  contadores de Compaction e metadados de tokens.
- Resultados de tentativa embutida não retornam mais `transcriptLocatorUsed`, e
  resultados `compact()` do mecanismo de contexto não retornam mais localizadores de transcrição.
  Loops de repetição de tempo de execução aceitam apenas um `sessionId` sucessor.
- Resultados de anexação de transcrição do espelho de entrega não retornam mais localizadores de transcrição.
  Chamadores recebem o `messageId` anexado; sinais de atualização de transcrição usam
  escopo SQLite.
- Auxiliares de fork de sessão pai retornam apenas o `sessionId` bifurcado. A
  preparação de subagente passa o escopo de agente/sessão filho para os mecanismos.
- Parâmetros do executor da CLI e reseeding de histórico não aceitam mais localizadores de transcrição.
  Leituras de histórico da CLI resolvem o escopo de transcrição SQLite a partir de `{agentId,
sessionId}` e do contexto de chave de sessão.
- Fixtures de teste da CLI e do executor embutido agora semeiam e leem linhas de transcrição SQLite
  por id de sessão em vez de fingir que sessões ativas são arquivos `*.jsonl` ou
  passar uma string `sqlite-transcript://...` por parâmetros de tempo de execução.
- Eventos de guarda de resultado de ferramenta de sessão emitem a partir de escopo de sessão conhecido mesmo quando um
  gerenciador em memória não tem localizador derivado. Seus testes não fingem mais arquivos de transcrição
  ativos `/tmp/*.jsonl`.
- Auxiliares BTW e de checkpoint de Compaction agora leem e bifurcam linhas de transcrição por
  escopo SQLite. Metadados de checkpoint agora armazenam apenas ids de sessão e ids de folha/entrada;
  localizadores derivados não são mais gravados em cargas de checkpoint.
- A busca de chave de transcrição do Gateway usa escopo de transcrição SQLite em limites de protocolo
  e não faz mais realpath nem stat de nomes de arquivo de transcrição.
- A rotação automática de transcrição de Compaction grava linhas de transcrição sucessoras
  diretamente pelo armazenamento de transcrição SQLite. Linhas de sessão mantêm apenas a
  identidade da sessão sucessora, não um caminho JSONL durável nem localizador persistido.
- A Compaction do mecanismo de contexto embutido usa auxiliares de rotação de transcrição nomeados por SQLite.
  Os testes de rotação não constroem mais caminhos de sucessor JSONL nem
  modelam sessões ativas como arquivos.
- A retenção de imagem de saída gerenciada indexa seu cache de mensagens de transcrição a partir de
  estatísticas de transcrição SQLite em vez de chamadas stat do sistema de arquivos.
- Bloqueios de sessão de tempo de execução e a via autônoma legada do doctor para `.jsonl.lock`
  foram removidos.
- O barrel de tempo de execução do Microsoft Teams e o SDK público de Plugin não reexportam mais
  o antigo auxiliar de bloqueio de arquivo; caminhos de estado durável de Plugin são apoiados por SQLite.
- Poda de sessões por idade/contagem e limpeza explícita de sessões foram removidas.
  O doctor possui a importação legada; sessões obsoletas são redefinidas ou excluídas explicitamente.
- Verificações de integridade do doctor não contam mais um arquivo JSONL legado como uma transcrição ativa
  válida para uma linha de sessão SQLite. A saúde da transcrição ativa é apenas SQLite;
  arquivos JSONL legados são relatados como entradas de migração/limpeza de órfãos.
- O doctor não trata mais `agents/<agent>/sessions/` como estado de tempo de execução
  obrigatório. Ele só varre esse diretório quando ele já existe, como entrada de importação
  legada ou limpeza de órfãos.
- `sessions.resolve` do Gateway, caminhos de patch/reset/compactação de sessão, geração de subagente,
  aborto rápido, metadados ACP, sessões isoladas por Heartbeat e patching da TUI
  não migram nem podam mais chaves de sessão legadas como efeito colateral do
  trabalho normal de tempo de execução.
- A resolução de sessão de comando da CLI agora retorna o `agentId` proprietário em vez de um
  `storePath`, e não copia mais linhas legadas da sessão principal durante a resolução normal
  de `--to` ou `--session-id`. A canonicalização de linha principal legada pertence
  apenas ao doctor.
- A resolução de profundidade de subagente de tempo de execução não lê mais `sessions.json` nem armazenamentos de sessão
  JSON5. Ela lê `session_entries` SQLite por id de agente, e metadados legados de
  profundidade/sessão só podem entrar pelo caminho de importação do doctor.
- Substituições de sessão de perfil de autenticação persistem por upserts diretos de linhas `{agentId, sessionKey}`
  em vez de carregar preguiçosamente um tempo de execução de armazenamento de sessão em forma de arquivo.
- O gating detalhado de resposta automática e auxiliares de atualização de sessão agora leem/inserem ou atualizam linhas de sessão SQLite
  por identidade de sessão e não exigem mais um caminho de armazenamento legado
  antes de tocar o estado de linha persistido.
- Auxiliares de metadados de sessão de execução de comando agora usam nomes e caminhos de módulo
  orientados a entrada; a antiga superfície auxiliar de comando `session-store` foi removida.
- Semeadura de cabeçalho de bootstrap e endurecimento manual de limite de Compaction agora mutam
  linhas de transcrição SQLite diretamente. Chamadores de tempo de execução passam identidade de sessão, não
  caminhos `.jsonl` graváveis.
- Replay silencioso de rotação de sessão copia turnos recentes de usuário/assistente por
  `{agentId, sessionId}` a partir de linhas de transcrição SQLite. Ele não aceita mais
  localizadores de transcrição de origem ou destino.
- Linhas novas de sessão de tempo de execução não armazenam mais localizadores de transcrição. Chamadores usam
  `{agentId, sessionId}` diretamente; comandos de exportação/depuração podem escolher nomes de arquivo de saída
  quando materializam linhas.
- Iniciar uma nova sessão de transcrição persistida agora sempre abre linhas SQLite por
  escopo. O gerenciador de sessão não reutiliza mais um caminho ou localizador de transcrição
  anterior da era de arquivos como identidade para a nova sessão.
- Sessões de transcrição persistidas usam a API explícita
  `openTranscriptSessionManagerForSession({agentId, sessionId})`. As antigas
  fachadas estáticas `SessionManager.create/openForSession/list/forkFromSession` foram
  removidas para que testes e código de tempo de execução não possam recriar acidentalmente a descoberta de sessão
  da era de arquivos.
- O tempo de execução de Plugin não expõe mais `api.runtime.agent.session.resolveTranscriptLocatorPath`;
  código de Plugin usa auxiliares de linha SQLite e valores de escopo.
- A superfície pública do SDK `session-store-runtime` agora exporta apenas auxiliares de linha de sessão
  e linha de transcrição. Auxiliares focados de esquema/caminho/transação SQLite
  vivem em `sqlite-runtime`; auxiliares brutos de abrir/fechar/resetar permanecem somente locais para
  testes first-party.
- Classificadores legados de nomes de arquivo `.jsonl` de trajetória/checkpoint agora vivem no
  módulo de arquivo de sessão legado do doctor. A validação de sessão principal não importa mais
  auxiliares de artefato de arquivo para decidir ids normais de sessão SQLite.
- Execuções de subagente bloqueantes de Active Memory usam linhas de transcrição SQLite em vez de
  criar arquivos `session.jsonl` temporários ou persistidos sob estado de Plugin. A
  antiga opção `transcriptDir` foi removida.
- Geração avulsa de slug e execuções do planejador Crestodian usam linhas de transcrição SQLite
  em vez de criar arquivos `session.jsonl` temporários.
- Execuções auxiliares `llm-task` e extração de compromisso oculto também usam linhas de
  transcrição SQLite, então essas sessões auxiliares somente de modelo não criam mais
  arquivos temporários de transcrição JSON/JSONL.
- `TranscriptSessionManager` agora é apenas um escopo de transcrição SQLite aberto.
  Código de tempo de execução o abre com `openTranscriptSessionManagerForSession({agentId,
sessionId})`; fluxos de criar, ramificar, continuar, listar e bifurcar vivem em seus
  auxiliares proprietários de linha SQLite, em vez de fachadas estáticas do gerenciador.
  Código de doctor/importação/depuração lida com arquivos de origem legados explícitos fora do
  gerenciador de sessão de tempo de execução.
- Os métodos de fachada obsoletos `SessionManager.newSession()` e
  `SessionManager.createBranchedSession()` foram removidos. Novas sessões e
  descendentes de transcrição são criados pelo fluxo SQLite proprietário em vez de
  transformar um gerenciador já aberto em uma sessão persistida diferente.
- Decisões de fork de transcrição pai e criação de fork não aceitam mais
  `storePath` ou `sessionsDir`; elas usam o escopo de transcrição SQLite
  `{agentId, sessionId}` em vez de metadados de caminho de sistema de arquivos retidos.
- Memory-host não exporta mais auxiliares no-op de classificação de transcrição de diretório de sessão;
  a filtragem de transcrição agora deriva de metadados de linha SQLite durante a construção da entrada.
- Testes de exportação de sessão de Memory-host e QMD usam escopos de transcrição SQLite. Caminhos antigos
  `agents/<agentId>/sessions/*.jsonl` permanecem cobertos apenas onde um teste está
  provando intencionalmente compatibilidade de doctor/importação/exportação.
- A inspeção bruta de sessão do QA-lab agora usa `sessions.list` pelo Gateway
  em vez de ler `agents/qa/sessions/sessions.json`; o feedback do MSteams
  anexa diretamente às transcrições SQLite sem fabricar um caminho JSONL.
- As entradas compartilhadas de canais de entrada agora carregam `{agentId, sessionKey}` em vez de um
  `storePath` legado. LINE, WhatsApp, Slack, Discord, Telegram, Matrix, Signal,
  iMessage, BlueBubbles, Feishu, Google Chat, IRC, Nextcloud Talk, Zalo,
  Zalo Personal, QA Channel, Microsoft Teams, Mattermost, Synology Chat, Tlon,
  Twitch e QQBot agora leem metadados updated-at nos caminhos de gravação e registram
  linhas de sessão de entrada por meio da identidade SQLite.
- A persistência do localizador de transcrições foi removida das linhas de sessão ativas.
  `resolveSessionTranscriptTarget` retorna `agentId`, `sessionId` e metadados
  opcionais de tópico; doctor é o único código que importa nomes de arquivos de transcrição
  legados.
- Cabeçalhos de transcrição em runtime começam na versão SQLite `1`. Atualizações de formato
  JSONL V1/V2/V3 antigas vivem apenas na importação do doctor e normalizam cabeçalhos importados para
  a versão atual de transcrição SQLite antes de as linhas serem armazenadas.
- A proteção database-first agora proíbe `SessionManager.listAll` e
  `SessionManager.forkFromSession`; fluxos de listagem de sessão e fork/restauração
  devem permanecer nas APIs SQLite por linha/escopo.
- A proteção também proíbe nomes de helpers legados de análise de JSONL de transcrição/reparo de ramificação ativa
  fora do código de doctor/importação, para que o runtime não consiga criar um segundo caminho de migração de
  transcrição legada.
- Execuções de PI embutidas rejeitam handles de transcrição recebidos. Elas usam a identidade SQLite
  `{agentId, sessionId}` antes da inicialização do worker e novamente antes de a
  tentativa tocar o estado da transcrição. Uma entrada obsoleta `/tmp/*.jsonl` não consegue selecionar um
  destino de escrita em runtime.
- Registros de rastro de cache, payload Anthropic, fluxo bruto e linha do tempo de diagnósticos
  agora gravam em linhas SQLite tipadas `diagnostic_events`. Bundles de estabilidade do Gateway
  agora gravam em linhas SQLite tipadas `diagnostic_stability_bundles`. Os antigos
  caminhos de substituição JSONL `diagnostics.cacheTrace.filePath`, `OPENCLAW_CACHE_TRACE_FILE`,
  `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE` e
  `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` foram removidos, e a captura normal de estabilidade
  não grava mais arquivos `logs/stability/*.json`.
- A persistência de Cron agora reconcilia linhas SQLite `cron_jobs` em vez de
  excluir/reinserir toda a tabela de jobs a cada salvamento. Writebacks de destino de Plugin
  atualizam diretamente as linhas cron correspondentes e mantêm o estado cron de runtime na
  mesma transação do banco de dados de estado.
- Chamadores de runtime do Cron agora usam uma chave estável de armazenamento cron SQLite. Caminhos legados
  `cron.store` são apenas entradas de importação do doctor; os caminhos de Gateway de produção, manutenção de tarefas, status, run-log e writeback de destino do Telegram usam
  `resolveCronStoreKey` e não normalizam mais a chave como caminho. O status do Cron agora
  relata `storeKey` em vez do antigo campo `storePath` em formato de arquivo.
- O carregamento e o agendamento em runtime do Cron não normalizam mais formatos legados de jobs persistidos,
  como `jobId`, `schedule.cron`, `atMs` numérico, booleanos em string ou
  `sessionTarget` ausente. A importação legada do doctor é responsável por esses reparos antes que as linhas
  sejam inseridas no SQLite.
- O spawn do ACP não resolve nem persiste mais caminhos de arquivos JSONL de transcrição. A configuração de spawn
  e associação de thread persiste a linha de sessão SQLite diretamente e mantém o
  id da sessão como a identidade de transcrição retida.
- As APIs de metadados de sessão do ACP agora leem/listam/fazem upsert de linhas SQLite por `agentId` e
  não expõem mais `storePath` como parte do contrato de entrada de sessão do ACP.
- A contabilidade de uso de sessão e a agregação de uso do Gateway agora resolvem transcrições
  apenas por `{agentId, sessionId}`. O cache de custo/uso e os resumos de sessões descobertas
  não sintetizam nem retornam mais strings de localizador de transcrição.
- Escrita de chat do Gateway, persistência parcial de aborto, `/sessions.send` e
  escritas de transcrição de mídia do webchat anexam diretamente pelo escopo de transcrição SQLite.
  O helper de injeção de transcrição do Gateway não aceita mais um parâmetro
  `transcriptLocator`.
- A descoberta de transcrições SQLite agora lista apenas escopos e estatísticas de transcrição:
  `{agentId, sessionId, updatedAt, eventCount}`. O helper de compatibilidade morto
  `listSqliteSessionTranscriptLocators` e o campo `locator` por linha desapareceram.
- O runtime de reparo de transcrição agora expõe apenas
  `repairTranscriptSessionStateIfNeeded({agentId, sessionId})`. O antigo
  helper de reparo baseado em localizador foi excluído; código de doctor/debug lê caminhos de arquivo
  de origem explícitos e nunca migra strings de localizador.
- O runtime do livro-razão de replay do ACP agora armazena linhas de replay por sessão no banco de dados
  de estado SQLite compartilhado em vez de `acp/event-ledger.json`; doctor importa e
  remove o arquivo legado.
- Helpers de leitura de transcrição do Gateway agora vivem em
  `src/gateway/session-transcript-readers.ts` em vez do antigo nome de módulo
  `session-utils.fs`. A verificação de histórico de retentativa de fallback é nomeada para
  conteúdo de transcrição SQLite em vez da antiga superfície de helper de arquivo.
- Helpers de chat injetado e compaction do Gateway agora passam o escopo de transcrição SQLite
  por APIs helper internas em vez de nomear valores como caminhos de transcrição ou
  arquivos de origem.
- A detecção de continuação de bootstrap agora verifica linhas de transcrição SQLite por meio de
  `hasCompletedBootstrapTranscriptTurn`; ela não expõe mais um nome de helper em formato de arquivo.
- Testes do embedded-runner agora usam identidade de transcrição SQLite, e abrir um novo
  gerenciador de transcrição sempre exige um `sessionId` explícito.
- Helpers de indexação de memória agora usam terminologia de transcrição SQLite de ponta a ponta:
  o host exporta `listSessionTranscriptScopesForAgent` e
  `sessionTranscriptKeyForScope`, filas de sincronização direcionadas usam `sessionTranscripts`,
  resultados públicos de busca de sessão expõem caminhos opacos `transcript:<agent>:<session>`,
  e a chave interna de origem no DB é `session:<session>` sob
  `source_kind='sessions'` em vez de um caminho de arquivo falso.
- O helper genérico de dedupe persistente do SDK de Plugin não expõe mais opções em formato de arquivo.
  Chamadores fornecem chaves de escopo SQLite, e linhas de dedupe duráveis vivem no
  estado compartilhado do Plugin.
- Tokens SSO do Microsoft Teams migraram de arquivos JSON bloqueados para o estado SQLite do Plugin.
  Doctor importa `msteams-sso-tokens.json`, reconstrói chaves canônicas de token SSO
  a partir de payloads e remove o arquivo de origem. Tokens OAuth delegados permanecem
  em seu limite existente de arquivo de credenciais privadas.
- O estado de cache de sincronização do Matrix migrou de `bot-storage.json` para o estado SQLite do Plugin.
  Doctor importa payloads de sincronização legados brutos ou encapsulados e remove o
  arquivo de origem. Clientes Matrix ativos e QA Matrix passam um diretório raiz de armazenamento de sincronização
  SQLite, não um caminho falso `sync-store.json` ou `bot-storage.json`.
- O status de migração de criptografia legada do Matrix migrou de
  `legacy-crypto-migration.json` para o estado SQLite do Plugin. Doctor importa o
  arquivo de status antigo; snapshots IndexedDB do Matrix SDK migraram de
  `crypto-idb-snapshot.json` para blobs SQLite do Plugin. Chaves de recuperação e
  credenciais do Matrix são linhas de estado SQLite do Plugin; seus arquivos JSON antigos são apenas
  entradas de migração do doctor.
- Logs de atividade do Memory Wiki agora usam o estado SQLite do Plugin em vez de
  `.openclaw-wiki/log.jsonl`. O provedor de migração do Memory Wiki importa logs JSONL
  antigos; markdown da wiki e conteúdo do cofre do usuário continuam com backing em arquivos como
  conteúdo do workspace.
- Memory Wiki não cria mais `.openclaw-wiki/state.json` nem o diretório
  não utilizado `.openclaw-wiki/locks`. O provedor de migração remove esses arquivos aposentados
  de metadados do Plugin se um cofre mais antigo ainda os tiver.
- Entradas de auditoria do Crestodian agora usam o estado SQLite do Plugin principal em vez de
  `audit/crestodian.jsonl`. Doctor importa o log de auditoria JSONL legado e
  o remove após uma importação bem-sucedida.
- Entradas de auditoria de escrita/observação de configuração agora usam o estado SQLite do Plugin principal
  em vez de `logs/config-audit.jsonl`. Doctor importa o log de auditoria JSONL legado e
  o remove após uma importação bem-sucedida.
- O companion do macOS não grava mais sidecars locais do app `logs/config-audit.jsonl` ou
  `logs/config-health.json` ao editar `openclaw.json`. O arquivo de configuração
  continua com backing em arquivo, snapshots de recuperação permanecem ao lado do arquivo de configuração,
  e o estado durável de auditoria/saúde de configuração pertence ao armazenamento SQLite do Gateway.
- Aprovações pendentes de resgate do Crestodian agora usam o estado SQLite do Plugin principal em vez de
  `crestodian/rescue-pending/*.json`. Doctor importa arquivos legados de aprovação pendente
  e os remove após uma importação bem-sucedida.
- O estado temporário de armação do Phone Control agora usa o estado SQLite do Plugin em vez de
  `plugins/phone-control/armed.json`. Doctor importa o arquivo legado de estado armado
  para o namespace `phone-control/arm-state` e remove o arquivo.
- Doctor não repara mais transcrições JSONL in loco nem cria arquivos JSONL de backup.
  Ele importa a ramificação ativa para o SQLite e remove a origem legada.
- A busca de transcrição do hook session-memory usa leituras SQLite apenas por escopo
  `{agentId, sessionId}`. Seu helper não aceita nem deriva mais localizadores de transcrição,
  leituras de arquivos legados ou opções de reescrita de arquivo.
- Bindings de conversa do servidor de app do Codex agora indexam o estado SQLite do Plugin por
  chave de sessão do OpenClaw ou escopo explícito `{agentId, sessionId}`. Eles não devem
  preservar bindings de fallback por caminho de transcrição.
- Leituras de histórico espelhado do servidor de app do Codex usam apenas o escopo de transcrição SQLite;
  elas não devem recuperar identidade a partir de caminhos de arquivo de transcrição.
- Caminhos de ordenação de papéis e redefinição de compaction não desvinculam mais arquivos de transcrição
  antigos; a redefinição apenas rotaciona a linha de sessão SQLite e a identidade de transcrição.
- Respostas de redefinição e checkpoint do Gateway retornam linhas de sessão limpas mais ids de sessão.
  Elas não sintetizam mais localizadores de transcrição SQLite para clientes.
- Dreaming do memory-core não remove mais linhas de sessão consultando arquivos JSONL ausentes.
  A limpeza de subagents passa pela API de runtime de sessão em vez de
  verificações de existência no filesystem. Seus testes de ingestão de transcrição semeiam linhas SQLite
  diretamente em vez de criar fixtures `agents/<id>/sessions` ou placeholders de localizador.
- A indexação de transcrições de memória pode expor `transcript:<agentId>:<sessionId>` como um
  caminho virtual de resultado de busca para helpers de citação/leitura. A origem durável do índice é
  relacional (`source_kind='sessions'`, `source_key='session:<sessionId>'`,
  `session_id=<sessionId>`), portanto o valor não é um localizador de transcrição em runtime,
  não é um caminho do filesystem e nunca deve ser passado de volta para APIs de runtime de sessão.
- O status de memória do doctor do Gateway lê contagens de recordação de curto prazo e phase-signal
  de linhas de estado SQLite do Plugin em vez de `memory/.dreams/*.json`; a saída da CLI e do
  doctor agora rotula esse armazenamento como um armazenamento SQLite, não como um caminho.
- Runtime do memory-core, status da CLI, métodos do doctor do Gateway e facades do SDK de Plugin
  não auditam nem arquivam mais arquivos legados `.dreams/session-corpus`.
  Esses arquivos são apenas entradas de migração; doctor os importa para o SQLite e
  exclui a origem após verificação. Linhas ativas de evidência de ingestão de sessão
  agora usam o caminho virtual SQLite `memory/session-ingestion/<day>.txt`; o runtime
  nunca grava nem deriva estado de `.dreams/session-corpus`.
- Artefatos públicos do memory-core expõem eventos de host SQLite como o artefato JSON virtual
  `memory/events/memory-host-events.json`; eles não reutilizam mais o caminho de origem legado
  `.dreams/events.jsonl`.
- Registros de contêiner/browser de sandbox agora usam a tabela SQLite compartilhada
  `sandbox_registry_entries` com colunas tipadas de sessão, imagem, timestamp,
  backend/config e porta de browser. Doctor importa arquivos de registro JSON legados monolíticos e
  fragmentados e remove origens bem-sucedidas. Leituras em runtime usam as colunas tipadas da linha
  como fonte da verdade; `entry_json` é apenas uma cópia de replay/debug.
- Compromissos agora usam uma tabela compartilhada tipada `commitments` em vez de um
  blob JSON do armazenamento inteiro. Salvamentos de snapshot fazem upsert por id de compromisso e excluem apenas
  linhas ausentes em vez de limpar e reinserir a tabela. O runtime carrega
  compromissos de colunas tipadas de escopo, janela de entrega, status, tentativa e texto;
  `record_json` é apenas uma cópia de replay/debug. Doctor importa o legado
  `commitments.json` e o remove após uma importação bem-sucedida.
- Definições de jobs Cron, estado de agenda e histórico de execução não têm mais escritores ou leitores JSON
  em runtime. O runtime usa linhas `cron_jobs` com agenda tipada,
  payload, entrega, alerta de falha, sessão, status e colunas de estado de runtime, além de metadados tipados de
  `cron_run_logs` para status, resumo de diagnósticos, status/erro de entrega,
  sessão/execução, modelo e totais de tokens. `job_json` é apenas uma cópia de reprodução/depuração; `state_json` mantém diagnósticos de runtime aninhados
  que ainda não têm campos de consulta frequente, enquanto o runtime
  reidrata campos de estado frequentes a partir de colunas tipadas. O Doctor importa
  arquivos legados `jobs.json`, `jobs-state.json` e `runs/*.jsonl` e remove
  as fontes importadas. Writebacks de destino de Plugin atualizam as linhas `cron_jobs`
  correspondentes em vez de carregar e substituir todo o armazenamento do cron.
- A inicialização do Gateway ignora marcadores legados `notify: true` na projeção de runtime.
  O Doctor os traduz em entrega SQLite explícita quando
  `cron.webhook` é válido, remove marcadores inertes quando ele não está definido e os preserva
  com um aviso quando o webhook configurado é inválido.
- Filas de entrega de saída e de sessão agora armazenam status da fila, tipo de entrada,
  chave de sessão, canal, destino, ID da conta, contagem de novas tentativas, última tentativa/erro,
  estado de recuperação e marcadores de envio da plataforma como colunas tipadas na tabela compartilhada
  `delivery_queue_entries`. A recuperação de runtime lê esses campos frequentes das
  colunas tipadas, e mutações de nova tentativa/recuperação atualizam essas colunas diretamente
  sem reescrever JSON de reprodução. O payload JSON completo permanece apenas como o
  blob de reprodução/depuração para corpos de mensagem e outros dados frios de reprodução.
- Registros gerenciados de imagens de saída agora usam linhas compartilhadas tipadas
  `managed_outgoing_image_records`, com bytes de mídia ainda armazenados em
  `media_blobs`. O registro JSON permanece apenas como uma cópia de reprodução/depuração.
- Preferências do seletor de modelos do Discord, hashes de implantação de comandos e associações de threads
  agora usam estado de Plugin SQLite compartilhado. Seus planos legados de importação de JSON ficam na
  superfície de configuração/ migração do doctor do Plugin Discord, não no código de migração do core.
- Detectores de importação legada de Plugin usam módulos nomeados para doctor, como
  `doctor-legacy-state.ts` ou `doctor-state-imports.ts`; módulos normais de runtime de canal
  não devem importar detectores de JSON legado.
- Cursores de catchup e marcadores de deduplicação de entrada do BlueBubbles agora usam estado de Plugin SQLite
  compartilhado. Seus planos legados de importação de JSON ficam na superfície de configuração/doctor
  do Plugin BlueBubbles, não no código de migração do core.
- Offsets de atualização do Telegram, linhas de cache de stickers, linhas de cache de mensagens enviadas,
  linhas de cache de nomes de tópicos e associações de threads agora usam estado de Plugin SQLite
  compartilhado. Seus planos legados de importação de JSON ficam na superfície de configuração/doctor do Plugin Telegram,
  não no código de migração do core.
- Cursores de catchup do iMessage, mapeamentos de IDs curtos de resposta e linhas de deduplicação de ecos enviados
  agora usam estado de Plugin SQLite compartilhado. Os arquivos antigos `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` e `imessage/sent-echoes.jsonl` são
  apenas entradas do doctor.
- Linhas de deduplicação de mensagens do Feishu agora usam estado de Plugin SQLite compartilhado em vez de
  arquivos `feishu/dedup/*.json`. Seu plano legado de importação de JSON fica na superfície
  de configuração/doctor do Plugin Feishu, não no código de migração do core.
- Conversas, enquetes, buffers de upload pendentes e aprendizados de feedback do Microsoft Teams
  agora usam tabelas compartilhadas de estado/blob de Plugin em SQLite. O caminho de upload pendente
  usa `plugin_blob_entries`, de modo que buffers de mídia sejam armazenados como BLOBs SQLite
  em vez de JSON base64. Os nomes dos helpers de runtime agora usam nomenclatura de SQLite/estado
  em vez de nomenclatura de armazenamento em arquivos `*-fs`, e o shim antigo `storePath` desapareceu
  desses armazenamentos. Seu plano legado de importação de JSON fica na superfície de configuração/doctor
  do Plugin Microsoft Teams.
- Mídia de saída hospedada do Zalo agora usa `plugin_blob_entries` SQLite compartilhado
  em vez de sidecars temporários JSON/bin `openclaw-zalo-outbound-media`.
- HTML e metadados do visualizador de diffs agora usam `plugin_blob_entries` SQLite compartilhado
  em vez de arquivos temporários `meta.json`/`viewer.html`. Saídas PNG/PDF renderizadas continuam sendo
  materializações temporárias porque a entrega por canal ainda precisa de um caminho de arquivo.
- Documentos gerenciados do Canvas agora usam `plugin_blob_entries` SQLite compartilhado em vez
  de um diretório padrão `state/canvas/documents`. O host do Canvas serve esses
  blobs diretamente; arquivos locais são criados apenas para conteúdo explícito de operador em `host.root`
  ou materialização temporária quando um leitor de mídia downstream
  exige um caminho.
- Decisões de auditoria de File Transfer agora usam `plugin_state_entries` SQLite compartilhado
  em vez do log de runtime ilimitado `audit/file-transfer.jsonl`. O Doctor
  importa o arquivo de auditoria JSONL legado para o estado de Plugin e remove a fonte
  após uma importação limpa.
- Leases de processo ACPX e identidade da instância do gateway agora usam estado de Plugin SQLite compartilhado.
  O Doctor importa o arquivo legado `gateway-instance-id` para o estado de Plugin
  e remove a fonte.
- Scripts de wrapper gerados pelo ACPX e o diretório home isolado do Codex são materializações temporárias
  sob a raiz temporária do OpenClaw, não estado durável do OpenClaw. Os
  registros duráveis de runtime ACPX são as linhas SQLite de lease e instância de gateway;
  a superfície antiga de configuração `stateDir` do ACPX foi removida porque nenhum estado de runtime
  é mais escrito ali.
- Anexos de mídia do Gateway agora usam a tabela SQLite compartilhada `media_blobs` como
  o armazenamento canônico de bytes. Caminhos locais retornados para superfícies de compatibilidade
  de canal e sandbox são materializações temporárias da linha do banco de dados, não o
  armazenamento durável de mídia. Allowlists de mídia de runtime não incluem mais raízes legadas
  `$OPENCLAW_STATE_DIR/media` nem raízes `media` do diretório de configuração; esses diretórios são
  apenas fontes de importação do doctor.
- A conclusão de shell não grava mais arquivos de cache `$OPENCLAW_STATE_DIR/completions/*`.
  Caminhos de smoke de instalação, doctor, atualização e release usam saída de conclusão gerada
  ou sourcing de perfil em vez de arquivos duráveis de cache de conclusão.
- O staging de upload de Skills do Gateway agora usa linhas compartilhadas `skill_uploads`. Metadados de upload,
  chaves de idempotência e bytes de arquivo ficam no SQLite; o instalador
  só recebe um caminho de arquivo materializado temporário enquanto uma instalação está
  em execução.
- Anexos inline de subagentes não são mais materializados em
  `.openclaw/attachments/*` no workspace. O caminho de spawn prepara entradas semente de VFS SQLite,
  execuções inline semeiam essas entradas no namespace de scratch de runtime por agente,
  e ferramentas baseadas em disco sobrepõem esse scratch SQLite para caminhos de anexo. As
  colunas antigas de registro de diretório de anexos de execução de subagente e hooks de limpeza desapareceram.
- A hidratação de imagens da CLI não mantém mais arquivos de cache estáveis
  `openclaw-cli-images`. Backends externos de CLI ainda recebem caminhos de arquivo, mas esses caminhos são
  materializações temporárias por execução com limpeza.
- Diagnósticos de cache-trace, diagnósticos de payload da Anthropic, diagnósticos brutos de stream de modelo,
  eventos de linha do tempo de diagnósticos e pacotes de estabilidade do Gateway agora
  gravam linhas SQLite em vez de arquivos `logs/*.jsonl` ou
  `logs/stability/*.json`.
  Flags de substituição de caminho de runtime e variáveis de ambiente foram removidas; comandos de exportação/depuração
  podem materializar arquivos explicitamente a partir de linhas do banco de dados.
- O companion do macOS não tem mais um escritor rotativo `diagnostics.jsonl`. Logs do app
  vão para logging unificado, e diagnósticos duráveis do Gateway continuam baseados em SQLite.
- A lista de registros do port-guardian do macOS agora usa linhas compartilhadas tipadas SQLite
  `macos_port_guardian_records` em vez de um arquivo JSON em Application Support
  ou um blob singleton opaco.
- Locks singleton do Gateway agora usam linhas compartilhadas tipadas SQLite `state_leases` sob
  o escopo `gateway_locks` em vez de arquivos de lock em diretório temporário. A documentação de troubleshooting de Fly e OAuth
  agora aponta para o lease SQLite/bloqueio de refresh de auth em vez de limpeza obsoleta de locks de arquivo.
- O estado sentinela de reinicialização do Gateway agora usa linhas compartilhadas tipadas SQLite
  `gateway_restart_sentinel` em vez de `restart-sentinel.json`; o runtime
  lê tipo de sentinela, status, roteamento, mensagem, continuação e estatísticas de
  colunas tipadas. `payload_json` é apenas uma cópia de reprodução/depuração. O código de runtime limpa
  a linha SQLite diretamente e não carrega mais encanamento de limpeza de arquivos.
- Intenção de reinicialização do Gateway e estado de handoff do supervisor agora usam linhas compartilhadas tipadas
  SQLite `gateway_restart_intent` e `gateway_restart_handoff` em vez de
  sidecars `gateway-restart-intent.json` e
  `gateway-supervisor-restart-handoff.json`.
- Coordenação singleton do Gateway agora usa linhas tipadas `state_leases` sob
  `gateway_locks` em vez de gravar arquivos `gateway.<hash>.lock`. A linha de lease
  possui o proprietário do lock, expiração, Heartbeat e payload de depuração; o SQLite possui o
  limite atômico de aquisição/liberação. A opção aposentada de diretório de locks de arquivo desapareceu;
  testes usam a identidade da linha SQLite diretamente.
- O antigo helper não referenciado de relatório de uso do cron que verificava arquivos `cron/runs/*.jsonl`
  foi excluído. Relatórios de histórico de execuções do cron devem ler as linhas SQLite tipadas
  `cron_run_logs`.
- A recuperação de reinicialização da sessão principal agora descobre agentes candidatos por meio do
  registro SQLite `agent_databases` em vez de varrer diretórios `agents/*/sessions`.
- A recuperação de corrupção de sessão do Gemini agora exclui apenas a linha de sessão SQLite;
  ela não precisa mais de um gate legado `storePath` nem tenta desvincular um
  caminho JSONL derivado de transcrição.
- O tratamento de substituição de caminho agora trata valores de ambiente literais `undefined`/`null`
  como não definidos, evitando bancos de dados acidentais em `undefined/state/*.sqlite`
  na raiz do repo durante testes ou handoffs de shell.
- Fingerprints de saúde de configuração agora usam linhas compartilhadas tipadas SQLite `config_health_entries`
  em vez de `logs/config-health.json`, mantendo o arquivo normal de configuração como
  o único documento de configuração sem credenciais. O companion do macOS mantém apenas
  estado de saúde local ao processo e não recria o sidecar JSON antigo.
- O runtime de perfis de auth não importa nem grava mais arquivos JSON de credenciais. O
  armazenamento canônico de credenciais é SQLite; `auth-profiles.json`, `auth.json`
  por agente e `credentials/oauth.json` compartilhado são entradas de migração do doctor
  que são removidas após a importação.
- Testes de salvamento/estado de perfil de auth agora verificam diretamente tabelas de auth SQLite tipadas
  e só usam nomes de arquivo legados de perfil de auth para entradas de migração do doctor.
- `openclaw secrets apply` limpa apenas o arquivo de configuração, o arquivo env e o armazenamento
  SQLite de perfis de auth. Ele não carrega mais lógica de compatibilidade que edita
  o `auth.json` por agente aposentado; o doctor é responsável por importar e excluir esse arquivo.
- Planos e aplicações de migração de segredo do Hermes importaram perfis de chave de API diretamente
  para o armazenamento SQLite de perfis de auth. Ele não grava nem verifica mais
  `auth-profiles.json` como alvo intermediário.
- Docs de auth voltadas ao usuário agora descrevem
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>` em vez de
  instruir usuários a inspecionar ou copiar `auth-profiles.json`; nomes legados de JSON OAuth/auth
  permanecem documentados apenas como entradas de importação do doctor.
- Helpers de caminho de estado do core não expõem mais o arquivo aposentado `credentials/oauth.json`.
  O nome de arquivo legado é local ao caminho de importação de auth do doctor.
- Docs de instalação, segurança, onboarding, auth de modelos e SecretRef agora descrevem
  linhas SQLite de perfis de auth e backup/migração do estado inteiro em vez de
  arquivos JSON de perfis de auth por agente.
- A descoberta de modelos do PI agora passa credenciais canônicas para o armazenamento de auth
  em memória `pi-coding-agent`. Ela não cria, limpa nem grava mais
  `auth.json` por agente durante a descoberta.
- Configurações de trigger e roteamento do Voice Wake agora usam tabelas compartilhadas tipadas SQLite
  em vez de `settings/voicewake.json`, `settings/voicewake-routing.json` ou
  linhas genéricas opacas; o doctor importa os arquivos JSON legados e os remove após uma
  migração bem-sucedida.
- Estado de verificação de atualizações agora usa uma linha compartilhada tipada `update_check_state` em vez de
  `update-check.json` ou um blob genérico opaco; o doctor importa
  o arquivo JSON legado e o remove após uma migração bem-sucedida.
- Estado de saúde de configuração agora usa linhas compartilhadas tipadas `config_health_entries` em vez
  de `logs/config-health.json` ou um blob genérico opaco; o doctor
  importa o arquivo JSON legado e o remove após uma migração bem-sucedida.
- Aprovações de associação de conversas de Plugin agora usam linhas tipadas
  `plugin_binding_approvals` em vez de estado SQLite compartilhado opaco ou
  `plugin-binding-approvals.json`; o arquivo legado é uma entrada de migração do doctor.
- Bindings genéricos da conversa atual agora armazenam linhas tipadas de
  `current_conversation_bindings` em vez de reescrever
  `bindings/current-conversations.json`; o doctor importa o arquivo JSON legado e
  o remove após uma migração bem-sucedida.
- Ledgers de sincronização de fontes importadas do Memory Wiki agora armazenam uma linha SQLite de estado de Plugin
  por chave de cofre/fonte em vez de reescrever `.openclaw-wiki/source-sync.json`;
  o provedor de migração importa e remove o ledger JSON legado.
- Registros de execuções de importação do ChatGPT no Memory Wiki agora armazenam uma linha SQLite de estado de Plugin
  por id de cofre/execução em vez de escrever `.openclaw-wiki/import-runs/*.json`.
  Snapshots de rollback permanecem como arquivos explícitos do cofre até que o arquivamento
  de snapshots de execuções de importação seja movido para o armazenamento de blobs.
- Digests compilados do Memory Wiki agora armazenam linhas SQLite de blobs de Plugin em vez de
  escrever `.openclaw-wiki/cache/agent-digest.json` e
  `.openclaw-wiki/cache/claims.jsonl`. O provedor de migração importa arquivos antigos de cache
  e remove o diretório de cache quando ele fica vazio.
- O rastreamento de instalação de Skills do ClawHub agora armazena uma linha SQLite de estado de Plugin por
  workspace/skill em vez de escrever ou ler sidecars `.clawhub/lock.json` e
  `.clawhub/origin.json` em runtime. O código de runtime usa objetos de estado de
  instalação rastreada em vez de abstrações de lockfile/origem em formato de arquivo. O doctor
  importa os sidecars legados dos workspaces de agentes configurados e os remove
  após uma importação limpa.
- O índice de Plugins instalados agora lê e escreve a linha singleton tipada de SQLite compartilhado
  `installed_plugin_index` em vez de `plugins/installs.json`; o
  arquivo JSON legado é apenas uma entrada de migração do doctor e é removido após a importação.
- O helper de caminho legado `plugins/installs.json` agora vive no código legado do doctor.
  Módulos de runtime do índice de Plugins expõem apenas opções de persistência apoiadas por SQLite,
  não um caminho de arquivo JSON.
- O sentinel de reinício do Gateway, a intenção de reinício e o estado de handoff do supervisor agora usam
  linhas tipadas de SQLite compartilhado (`gateway_restart_sentinel`,
  `gateway_restart_intent` e `gateway_restart_handoff`) em vez de blobs genéricos
  opacos. O código de reinício de runtime não tem contrato de sentinel/intenção/handoff
  em formato de arquivo.
- Cache de sincronização do Matrix, metadados de armazenamento, bindings de threads, marcadores de deduplicação de entrada,
  estado de cooldown de verificação de inicialização, snapshots criptográficos de IndexedDB do SDK,
  credenciais e chaves de recuperação agora usam tabelas compartilhadas de estado/blob de Plugin em SQLite.
  Structs de caminhos de runtime não expõem mais um caminho de metadados `storage-meta.json`;
  esse nome de arquivo é apenas uma entrada de migração legada. O plano de importação JSON legado deles
  vive na superfície de setup/migração do doctor do Plugin Matrix.
- A inicialização do Matrix não escaneia, reporta nem conclui mais estado legado de arquivos do Matrix.
  Detecção de arquivos do Matrix, criação de snapshots criptográficos legados, estado de migração de restauração
  de room keys, importação e remoção de fonte são todos de responsabilidade do doctor.
- Barrels de migração de runtime do Matrix foram removidos. Helpers de detecção e mutação
  de estado/cripto legados são importados diretamente pelo doctor do Matrix em vez de fazerem
  parte da superfície de API de runtime.
- Marcadores de reutilização de snapshots de migração do Matrix agora vivem em estado de Plugin SQLite
  em vez de `matrix/migration-snapshot.json`; o doctor ainda pode reutilizar o mesmo
  arquivo verificado de pré-migração sem escrever um arquivo sidecar de estado.
- Cursores de barramento do Nostr e estado de publicação de perfil agora usam estado de Plugin SQLite compartilhado.
  O plano de importação JSON legado deles vive na superfície de setup/migração do doctor
  do Plugin Nostr.
- Alternâncias de sessão do Active Memory agora usam estado de Plugin SQLite compartilhado em vez de
  `session-toggles.json`; reativar a memória exclui a linha em vez de
  reescrever um objeto JSON.
- Propostas e contadores de revisão do Skill Workshop agora usam estado de Plugin SQLite compartilhado
  em vez de stores por workspace `skill-workshop/<workspace>.json`. Cada
  proposta é uma linha separada em `skill-workshop/proposals`, e o contador de revisão
  é uma linha separada em `skill-workshop/reviews`.
- Execuções de subagentes revisores do Skill Workshop agora usam o resolvedor de transcritos de sessão
  de runtime em vez de criar caminhos de sessão sidecar
  `skill-workshop/<sessionId>.json`.
- Leases de processo do ACPX agora usam estado de Plugin SQLite compartilhado em
  `acpx/process-leases` em vez de um registro de arquivo inteiro `process-leases.json`.
  Cada lease é armazenado como sua própria linha, preservando a coleta de processos obsoletos
  na inicialização sem um caminho de reescrita JSON em runtime.
- Scripts wrapper do ACPX e o home isolado do Codex são gerados na
  raiz temporária do OpenClaw. Eles são recriados conforme necessário e não são entradas de backup
  nem de migração.
- A persistência do registro de execuções de subagentes usa linhas compartilhadas tipadas `subagent_runs`. O
  caminho antigo `subagents/runs.json` agora é apenas uma entrada de migração do doctor, e
  nomes de helpers de runtime não descrevem mais a camada de estado como apoiada em disco.
  Testes de runtime não criam mais fixtures `runs.json` inválidas ou vazias para provar
  comportamento do registro; eles semeiam/leem linhas SQLite diretamente.
- Backup prepara o diretório de estado antes do arquivamento, copia arquivos que não são banco de dados,
  faz snapshots de bancos de dados `*.sqlite` com `VACUUM INTO`, omite sidecars WAL/SHM
  vivos, registra metadados de snapshot no manifesto do arquivo e registra
  execuções de backup concluídas no SQLite com o manifesto do arquivo. `openclaw backup
create` valida o arquivo escrito por padrão; `--no-verify` é o
  caminho rápido explícito.
- `openclaw backup restore` valida o arquivo antes da extração, reutiliza o
  manifesto normalizado do verificador e restaura ativos verificados do manifesto para seus
  caminhos de origem registrados. Ele exige `--yes` para escritas e oferece suporte a `--dry-run`
  para um plano de restauração.
- O filtro antigo de caminhos voláteis de backup foi excluído. Backup não precisa mais de uma
  lista de exclusão live-tar para arquivos JSON/JSONL legados de sessão ou Cron porque snapshots SQLite
  são preparados antes da criação do arquivo.
- Preparação simples de setup e onboarding de workspace não cria mais diretórios
  `agents/<agentId>/sessions/`. Elas criam apenas configuração/workspace;
  linhas SQLite de sessão e linhas de transcrito são criadas sob demanda no
  banco de dados por agente.
- Reparo de permissões de segurança agora mira os bancos de dados SQLite global e por agente
  mais sidecars WAL/SHM em vez de `sessions.json` e arquivos JSONL de transcritos.
- Nomes de runtime do registro de sandbox agora descrevem diretamente os tipos de registro SQLite
  em vez de carregar terminologia legada de registro JSON pelo store ativo.
- `openclaw reset --scope config+creds+sessions` remove bancos de dados
  `openclaw-agent.sqlite` por agente mais sidecars WAL/SHM, não apenas diretórios
  legados `sessions/`.
- Helpers de sessão agregada do Gateway agora usam nomes orientados a entradas:
  `loadCombinedSessionEntriesForGateway` retorna `{ databasePath, entries }`.
  A nomenclatura antiga de store combinado foi removida dos chamadores de runtime.
- O seeding do canal Docker MCP agora escreve a linha principal da sessão e os eventos de transcrito
  no banco de dados SQLite por agente em vez de criar
  `sessions.json` e um transcrito JSONL.
- O hook agrupado de memória de sessão agora resolve o contexto de sessão anterior a partir do
  SQLite por `{agentId, sessionId}`. Ele não escaneia, armazena nem sintetiza mais
  caminhos de transcritos ou diretórios `workspace/sessions`.
- O hook agrupado de logger de comandos agora escreve linhas de auditoria de comandos na tabela SQLite compartilhada
  `command_log_entries` em vez de acrescentar a
  `logs/commands.log`.
- Allowlists de pareamento de canais agora expõem apenas helpers de leitura/escrita apoiados por SQLite em
  runtime e no SDK de Plugin. O resolvedor de caminho `*-allowFrom.json` antigo e
  o leitor de arquivo vivem apenas no código legado de importação do doctor.
- `migration_runs` registra execuções de migração de estado legado com status,
  timestamps e relatórios JSON.
- `migration_sources` registra cada fonte de arquivo legado importada com hash, tamanho,
  contagem de registros, tabela de destino, id de execução, status e estado de remoção da fonte.
- `backup_runs` registra caminhos de arquivos de backup, status e manifestos JSON.
- O schema global não mantém uma tabela de registro `agents` não usada. A descoberta de
  bancos de dados de agentes é o registro canônico `agent_databases` até que o runtime
  tenha um proprietário real de registros de agente.
- A configuração gerada do catálogo de modelos é armazenada em linhas SQLite globais tipadas
  `agent_model_catalogs`, indexadas por diretório de agente. Chamadores de runtime usam
  `ensureOpenClawModelCatalog`; não há API de compatibilidade `models.json` no
  código de runtime. A implementação escreve SQLite e o registro PI embutido é
  hidratado a partir desse payload armazenado sem criar um arquivo `models.json`.
- Exportação Markdown de transcritos de sessão QMD e configuração `memory.qmd.sessions` foram
  removidas. Não há coleção de transcritos QMD, nenhum caminho de runtime
  `qmd/sessions*` e nenhuma ponte de memória de sessão apoiada por arquivo.
- O runtime memory-core importa helpers de indexação de transcritos SQLite de
  `openclaw/plugin-sdk/memory-core-host-engine-session-transcripts`, não do
  subcaminho QMD do SDK. O subcaminho QMD mantém uma reexportação de compatibilidade apenas para
  chamadores externos até que uma limpeza maior do SDK possa removê-la.
- O `index.sqlite` próprio do QMD agora é uma materialização temporária de runtime apoiada pela
  tabela SQLite principal `plugin_blob_entries`. O runtime não cria mais um sidecar durável
  `~/.openclaw/agents/<agentId>/qmd`.
- O Plugin opcional `memory-lancedb` não cria mais
  `~/.openclaw/memory/lancedb` como um store implícito gerenciado pelo OpenClaw. Ele é um
  backend LanceDB externo e permanece desabilitado até que o operador configure um
  `dbPath` explícito.
- `check:database-first-legacy-stores` falha novo código-fonte de runtime que combina
  nomes de stores legados com APIs de filesystem em estilo de escrita. Ele também falha código-fonte de runtime
  que reintroduz os marcadores aposentados da ponte de transcritos
  `transcriptLocator` ou `sqlite-transcript://...`. Código de migração, doctor, importação
  e exportação explícita não relacionada a sessão continuam permitidos. Nomes mais amplos de contratos legados,
  como `sessionFile`, `storePath` e facades antigas da era de arquivos de `SessionManager`,
  ainda têm proprietários atuais e precisam de trabalho separado de guard de migração
  antes de poderem se tornar uma verificação obrigatória de preflight. O guard agora também cobre
  stores de runtime `cache/*.json`, sidecars genéricos
  `thread-bindings.json`, JSON de estado/log de execuções de Cron, JSON de integridade de configuração,
  sidecars de reinício e locks, configurações de Voice Wake, aprovações de bindings de Plugin,
  JSON de índice de Plugins instalados, JSONL de auditoria de File Transfer, logs de atividade
  do Memory Wiki, o antigo log de texto `command-logger` agrupado e knobs de diagnóstico JSONL
  de fluxo bruto do pi-mono. Ele também bane nomes antigos de módulos legados de doctor no nível raiz
  para que o código de compatibilidade permaneça em `src/commands/doctor/`. Handlers de depuração do Android
  também usam logcat/saída em memória em vez de preparar arquivos de cache `camera_debug.log` ou
  `debug_logs.txt`.

## Formato do Esquema de Destino

Mantenha os esquemas explícitos. O estado de runtime pertencente ao host usa tabelas tipadas. O estado opaco pertencente a Plugins usa `plugin_state_entries` / `plugin_blob_entries`; não há tabela `kv` genérica do host.

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

A busca futura pode adicionar tabelas FTS sem alterar as tabelas de eventos canônicas:

```text
transcript_events_fts(session_id, seq, text)
vfs_entries_fts(namespace, path, text)
```

Valores grandes devem usar colunas `blob`, não codificação de string JSON. Mantenha `value_json` para dados estruturados pequenos que precisam permanecer inspecionáveis com ferramentas SQLite simples.

`agent_databases` é o registro canônico para esta branch. Não adicione uma tabela `agents` até existir um proprietário real para registros de agente; a configuração do agente permanece em `openclaw.json`.

## Formato da Migração do Doctor

Doctor deve chamar uma etapa de migração explícita, reportável e segura para reexecutar:

```bash
openclaw doctor --fix
```

`openclaw doctor --fix` invoca a implementação de migração de estado depois da pré-verificação comum de configuração e cria um backup verificado antes da importação. A inicialização do runtime e `openclaw migrate` não devem importar arquivos de estado legados do OpenClaw.

Propriedades da migração:

- Uma passagem de migração descobre todas as fontes de arquivos legados e produz um plano antes de alterar qualquer coisa.
- Doctor cria um arquivo de backup pré-migração verificado antes de importar arquivos legados.
- As importações são idempotentes e indexadas por caminho da fonte, mtime, tamanho, hash e tabela de destino.
- Arquivos de fonte importados com sucesso são removidos ou arquivados depois que o banco de dados de destino tiver feito commit.
- Importações com falha deixam a fonte intacta e registram um aviso em `migration_runs`.
- O código de runtime lê apenas SQLite depois que a migração existe.
- Nenhum caminho de downgrade/exportação para arquivos de runtime é necessário.

## Inventário de Migração

Mova estes para o banco de dados global:

- As gravações em runtime do registro de tarefas agora usam o banco de dados compartilhado; o importador de sidecar não lançado
  `tasks/runs.sqlite` foi excluído. Salvamentos de snapshot fazem upsert por id de tarefa
  e excluem apenas linhas de tarefa/entrega ausentes.
- As gravações em runtime do Task Flow agora usam o banco de dados compartilhado; o importador de sidecar não lançado
  `tasks/flows/registry.sqlite` foi excluído. Salvamentos de snapshot
  fazem upsert por id de fluxo e excluem apenas linhas de fluxo ausentes.
- As gravações em runtime de estado de Plugin agora usam o banco de dados compartilhado; o importador de sidecar não lançado
  `plugin-state/state.sqlite` foi excluído.
- A busca de memória integrada não usa mais `memory/<agentId>.sqlite` por padrão; suas
  tabelas de índice ficam no banco de dados do agente proprietário, e a opção explícita por sidecar
  `memorySearch.store.path` foi retirada para migração de configuração pelo doctor.
- A reindexação de memória integrada redefine apenas as tabelas de propriedade da memória no banco de dados do agente.
  Ela não deve substituir o arquivo SQLite inteiro, porque o mesmo banco de dados contém
  sessões, transcrições, linhas de VFS, artefatos e caches de runtime.
- Registros de contêiner/navegador de sandbox de JSON monolítico e fragmentado. As gravações em runtime
  agora usam o banco de dados compartilhado; a importação de JSON legado permanece.
- Definições de jobs Cron, estado de agendamento e histórico de execuções agora usam SQLite compartilhado;
  o doctor importa/remove arquivos legados `jobs.json`, `jobs-state.json` e
  `cron/runs/*.jsonl`
- Identidade/autenticação de dispositivo, push, verificação de atualização, compromissos, cache de modelos OpenRouter,
  índice de plugins instalados e vinculações do servidor de app
- Registros de pareamento e bootstrap de dispositivo/nó agora usam tabelas SQLite tipadas
- Assinantes de notificações de pareamento de dispositivo e marcadores de solicitações entregues agora usam a
  tabela compartilhada SQLite plugin-state em vez de `device-pair-notify.json`.
- Registros de chamadas de voz agora usam a tabela compartilhada SQLite plugin-state no namespace
  `voice-call` / `calls` em vez de `calls.jsonl`; a CLI do Plugin
  acompanha e resume o histórico de chamadas apoiado por SQLite.
- Sessões do Gateway QQBot, registros de usuários conhecidos e cache de citações ref-index agora usam
  estado de Plugin SQLite em namespaces `qqbot` (`sessions`, `known-users`,
  `ref-index`) em vez de `session-*.json`, `known-users.json` e
  `ref-index.jsonl`; a migração doctor/setup do QQBot importa e remove os
  arquivos legados.
- Preferências do seletor de modelos do Discord, hashes de implantação de comandos e vinculações de threads
  agora usam estado de Plugin SQLite em namespaces `discord`
  (`model-picker-preferences`, `command-deploy-hashes`, `thread-bindings`)
  em vez de `model-picker-preferences.json`, `command-deploy-cache.json` e
  `thread-bindings.json`; a migração doctor/setup do Discord importa e
  remove os arquivos legados.
- Cursores de atualização do BlueBubbles e marcadores de desduplicação de entrada agora usam estado de Plugin SQLite
  em namespaces `bluebubbles` (`catchup-cursors`, `inbound-dedupe`)
  em vez de `bluebubbles/catchup/*.json` e
  `bluebubbles/inbound-dedupe/*.json`; a migração doctor/setup do BlueBubbles
  importa e remove os arquivos legados.
- Offsets de atualização do Telegram, entradas de cache de figurinhas, entradas de cache de mensagens da cadeia de respostas,
  entradas de cache de mensagens enviadas, entradas de cache de nomes de tópicos e vinculações de threads
  agora usam estado de Plugin SQLite em namespaces `telegram`
  (`update-offsets`, `sticker-cache`, `message-cache`, `sent-messages`,
  `topic-names`, `thread-bindings`) em vez de `update-offset-*.json`,
  `sticker-cache.json`, `*.telegram-messages.json`,
  `*.telegram-sent-messages.json`, `*.telegram-topic-names.json` e
  `thread-bindings-*.json`; a migração doctor/setup do Telegram importa e
  remove os arquivos legados.
- Cursores de atualização do iMessage, mapeamentos de short-id de resposta e linhas de desduplicação de eco enviado
  agora usam estado de Plugin SQLite em namespaces `imessage` (`catchup-cursors`,
  `reply-cache`, `sent-echoes`) em vez de `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` e `imessage/sent-echoes.jsonl`; a migração
  doctor/setup do iMessage importa e remove os arquivos legados.
- Conversas, enquetes, tokens de SSO e aprendizados de feedback do Microsoft Teams agora
  usam namespaces de estado de Plugin SQLite (`conversations`, `polls`, `sso-tokens`,
  `feedback-learnings`) em vez de `msteams-conversations.json`,
  `msteams-polls.json`, `msteams-sso-tokens.json` e `*.learnings.json`; a
  migração doctor/setup do Microsoft Teams importa e arquiva os arquivos legados.
  Uploads pendentes são um cache SQLite de curta duração, e arquivos de cache JSON antigos
  não são migrados.
- Cache de sincronização do Matrix, metadados de armazenamento, vinculações de threads, marcadores de desduplicação de entrada,
  estado de cooldown da verificação de inicialização, credenciais, chaves de recuperação e snapshots de criptografia IndexedDB do SDK
  agora usam namespaces de estado/blob de Plugin SQLite sob
  `matrix` (`sync-store`, `storage-meta`, `thread-bindings`, `inbound-dedupe`,
  `startup-verification`, `credentials`, `recovery-key`, `idb-snapshots`)
  em vez de `bot-storage.json`, `storage-meta.json`, `thread-bindings.json`,
  `inbound-dedupe.json`, `startup-verification.json`, `credentials.json`,
  `recovery-key.json` e `crypto-idb-snapshot.json`; a migração doctor/setup do Matrix
  importa e remove esses arquivos legados das raízes de armazenamento Matrix com escopo de conta.
- Cursores de barramento Nostr e estado de publicação de perfil agora usam estado de Plugin SQLite em
  namespaces `nostr` (`bus-state`, `profile-state`) em vez de
  `bus-state-*.json` e `profile-state-*.json`; a migração doctor/setup do Nostr
  importa e remove os arquivos legados.
- Alternâncias de sessão do Active Memory agora usam estado de Plugin SQLite sob
  `active-memory/session-toggles` em vez de `session-toggles.json`.
- Filas de propostas do Skill Workshop e contadores de revisão agora usam estado de Plugin SQLite
  sob `skill-workshop/proposals` e `skill-workshop/reviews` em vez de
  arquivos `skill-workshop/<workspace>.json` por workspace.
- Filas de entrega de saída e entrega de sessão agora compartilham a tabela SQLite global
  `delivery_queue_entries` sob nomes de fila separados
  (`outbound-delivery`, `session-delivery`) em vez de arquivos duráveis
  `delivery-queue/*.json`, `delivery-queue/failed/*.json` e
  `session-delivery-queue/*.json`. A etapa de estado legado do doctor importa
  linhas pendentes e com falha, remove marcadores de entregues obsoletos e exclui os arquivos
  JSON antigos após a importação. Campos de roteamento a quente e nova tentativa são colunas tipadas; o
  payload JSON é mantido apenas para replay/debug.
- Concessões de processo ACPX agora usam estado de Plugin SQLite sob `acpx/process-leases`
  em vez de `process-leases.json`.
- Metadados de execuções de backup e migração

Mova estes para bancos de dados de agentes:

- Raízes de sessão de agente e payloads de entradas de sessão com formato de compatibilidade. Feito para
  gravações em runtime: metadados de sessão a quente podem ser consultados em `sessions`, enquanto o
  payload completo legado `SessionEntry` permanece em `session_entries`.
- Eventos de transcrição de agente. Feito para gravações em runtime.
- Checkpoints de Compaction e snapshots de transcrição. Feito para gravações em runtime:
  cópias de transcrição de checkpoint são linhas de transcrição SQLite, e metadados de checkpoint
  são registrados em `transcript_snapshots`. Auxiliares de checkpoint do Gateway
  agora nomeiam esses valores como snapshots de transcrição em vez de arquivos de origem.
- Namespaces de rascunho/workspace de VFS de agente. Feito para gravações VFS em runtime.
- Payloads de anexos de subagente. Feito para gravações em runtime: eles são entradas seed de VFS SQLite
  e nunca arquivos duráveis de workspace.
- Artefatos de ferramenta. Feito para gravações em runtime.
- Artefatos de execução. Feito para gravações em runtime de worker por meio da tabela por agente
  `run_artifacts`.
- Caches de runtime locais do agente. Feito para gravações de cache com escopo de runtime de worker por meio
  da tabela por agente `cache_entries`. Caches de modelo de todo o Gateway permanecem no
  banco de dados global, a menos que se tornem específicos do agente.
- Logs de stream pai ACP. Feito para gravações em runtime.
- Sessões do livro-razão de replay ACP. Feito para gravações em runtime via
  `acp_replay_sessions` e `acp_replay_events`; o legado `acp/event-ledger.json`
  permanece apenas como entrada do doctor.
- Metadados de sessão ACP. Feito para gravações em runtime via `acp_sessions`; blocos legados
  `entry.acp` em `sessions.json` são apenas entrada de migração do doctor.
- Sidecars de trajetória quando não são arquivos de exportação explícitos. Feito para gravações em runtime:
  a captura de trajetória grava linhas `trajectory_runtime_events` no banco de dados do agente
  e espelha artefatos com escopo de execução no SQLite. Sidecars legados são apenas entradas de importação do doctor;
  a exportação pode materializar novas saídas JSONL de pacote de suporte
  mas não lê nem migra sidecars antigos de trajetória/transcrição em runtime.
  A captura de trajetória em runtime expõe escopo SQLite; auxiliares de caminho JSONL são
  isolados para suporte de exportação/debug e não são reexportados do módulo de runtime.
  Metadados de trajetória do executor incorporado registram a identidade `{agentId, sessionId, sessionKey}`
  em vez de persistir um localizador de transcrição.

Mantenha estes apoiados em arquivos por enquanto:

- `openclaw.json`
- arquivos de credenciais de provedor ou CLI
- manifestos de Plugin/pacote
- workspaces de usuário e repositórios Git quando o modo de disco é selecionado
- logs destinados a acompanhamento pelo operador, a menos que uma superfície de log específica seja movida

## Plano de Migração

### Fase 0: Congelar o Limite

Torne explícito o limite de estado durável antes de mover mais linhas:

- Adicione uma tabela `migration_runs` ao banco de dados global.
  Feito para relatórios de execução de migração de estado legado.
- Adicione um único serviço de migração de estado de arquivo para banco de dados pertencente ao doctor.
  Feito: `openclaw doctor --fix` usa a implementação de migração de estado legado.
- Torne `plan` somente leitura e faça `apply` criar um backup, importar, verificar e
  então excluir ou colocar em quarentena arquivos antigos.
  Feito: o doctor cria um backup pré-migração verificado, passa o caminho do backup
  para `migration_runs` e reutiliza os caminhos de importador/remoção.
- Adicione proibições estáticas para que novo código de runtime não possa gravar arquivos de estado legados enquanto
  código de migração e testes ainda podem semeá-los/lê-los.
  Feito para os armazenamentos legados atualmente migrados; a proteção também varre testes
  aninhados em busca de contratos proibidos de localizador de transcrição em runtime.

### Fase 1: Concluir o Plano de Controle Global

Mantenha estado de coordenação compartilhado em `state/openclaw.sqlite`:

- Agentes e registro de bancos de dados de agentes
- Livros-razão de tarefas e Task Flow
- Estado de Plugin
- Registro de contêiner/navegador de sandbox
- Histórico de execuções de Cron/agendador
- Pareamento, dispositivo, push, verificação de atualização, TUI, caches OpenRouter/modelos e outros
  pequenos estados de runtime com escopo do Gateway
- Metadados de backup e migração
- Bytes de anexos de mídia do Gateway. Feito para gravações em runtime; caminhos diretos de arquivos
  são materializações temporárias para compatibilidade com remetentes de canais e staging de sandbox.
  Allowlists de runtime aceitam caminhos de materialização SQLite, não raízes legadas
  de mídia de estado/configuração. O doctor importa arquivos de mídia legados para
  `media_blobs` e remove os arquivos de origem após gravações de linhas bem-sucedidas.
- Sessões, eventos e blobs de payload de captura de proxy de debug. Feito: capturas vivem
  no banco de dados de estado compartilhado e abrem por meio do bootstrap, esquema,
  WAL e configurações de busy-timeout do banco de dados de estado compartilhado. Bytes de payload são compactados com gzip em
  `capture_blobs.data`; não há substituição de banco de dados sidecar em runtime do proxy de debug,
  diretório de blobs nem alvo de esquema/codegen gerado apenas para proxy-capture.
  A migração doctor/startup importa linhas de `debug-proxy/capture.sqlite` enviadas
  e blobs de payload referenciados, incluindo substituições ativas de ambiente de DB/blob legado,
  depois arquiva essas fontes mantendo os certificados de CA intactos.

Esta fase também exclui abridores de sidecar duplicados, auxiliares de permissão, configuração de WAL,
limpeza de sistema de arquivos e gravadores de compatibilidade desses subsistemas.

### Fase 2: Introduzir Bancos de Dados Por Agente

Crie um banco de dados por agente e registre-o a partir do DB global:

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

A linha global `agent_databases` armazena o caminho, a versão do esquema, o carimbo de data/hora
do último avistamento e metadados básicos de tamanho/integridade. Código de runtime pede ao registro pelo
DB do agente em vez de derivar caminhos de arquivo diretamente.

O DB do agente contém:

- `sessions` como a raiz canônica de sessão, com `session_entries` como a
  tabela de payload em formato de compatibilidade anexada a essa raiz, e
  `session_routes` como a consulta única do `session_key` ativo
- `conversations` e `session_conversations` como a identidade normalizada de
  roteamento de provedor anexada às sessões
- `transcript_events`
- snapshots de transcrição e checkpoints de Compaction. Concluído para gravações
  de runtime.
- `vfs_entries`
- `tool_artifacts` e artefatos de execução
- linhas locais do agente de runtime/cache. Concluído para caches com escopo de worker.
- eventos de stream pai do ACP
- eventos de runtime de trajetória quando não são artefatos explícitos de exportação

### Fase 3: Substituir APIs Do Armazenamento De Sessões

Concluído para runtime. A superfície de armazenamento de sessões em formato de
arquivo não é um contrato ativo de runtime:

- O runtime não chama mais `loadSessionStore(storePath)` nem trata `storePath` como
  identidade de sessão.
- As operações de linha do runtime são `getSessionEntry`, `upsertSessionEntry`,
  `patchSessionEntry`, `deleteSessionEntry` e `listSessionEntries`.
- Auxiliares de reescrita de armazenamento inteiro, gravadores de arquivo, testes
  de fila, remoção de aliases e parâmetros de exclusão de chaves legadas foram
  removidos do runtime.
- Exportações de compatibilidade obsoletas do pacote raiz ainda adaptam caminhos
  canônicos de `sessions.json` para as APIs de linha do SQLite.
- A análise de `sessions.json` permanece apenas no código de migração/importação
  do doctor e nos testes do doctor.
- O fallback de ciclo de vida do runtime lê cabeçalhos de transcrição do SQLite,
  não as primeiras linhas de JSONL.

Continue removendo qualquer coisa que reintroduza parâmetros de bloqueio de
arquivo, vocabulário de remoção/truncamento como manutenção de arquivo,
identidade por caminho de armazenamento ou testes cuja única asserção seja
persistência JSON.

### Fase 4: Mover Transcrições, Streams ACP, Trajetórias E VFS

Torne todo stream de dados de agente nativo do banco de dados:

- Gravações de acréscimo de transcrição passam por uma transação SQLite que garante
  o cabeçalho da sessão, verifica a idempotência da mensagem, seleciona a cauda
  pai, insere em `transcript_events` e registra metadados de identidade
  consultáveis em `transcript_event_identities`. Concluído para acréscimos diretos
  de mensagens de transcrição e acréscimos persistidos normais do
  `TranscriptSessionManager`; operações explícitas de branch mantêm sua escolha
  explícita de pai e ainda gravam linhas SQLite sem derivar nenhum localizador de
  arquivo.
- Logs de stream pai do ACP viram linhas, não arquivos `.acp-stream.jsonl`.
  Concluído.
- A configuração de spawn do ACP não persiste mais caminhos JSONL de transcrição.
  Concluído.
- A captura de trajetória em runtime grava linhas/artefatos de eventos diretamente.
  O comando explícito de suporte/exportação ainda pode produzir artefatos JSONL de
  pacote de suporte como formato de exportação, mas a exportação de sessão não
  recria JSONL de sessão. Concluído.
- Workspaces em disco permanecem no disco quando configurados como modo de disco.
- Rascunho de VFS e modo experimental de workspace somente VFS usam o banco de
  dados do agente.

A migração importa arquivos JSONL antigos uma vez, registra contagens/hashes em
`migration_runs` e remove os arquivos importados após verificações de integridade.

### Fase 5: Backup, Restauração, Vacuum E Verificação

Backups permanecem um único arquivo de archive:

- Faça checkpoint de todo banco de dados global e de agente.
- Crie snapshot de cada DB com semântica de backup SQLite ou `VACUUM INTO`.
- Arquive snapshots compactos de DB, configuração, credenciais externas e
  exportações de workspace solicitadas.
- Omita arquivos brutos ativos `*.sqlite-wal` e `*.sqlite-shm`.
- Verifique abrindo cada snapshot de DB e executando `PRAGMA integrity_check`.
  `openclaw backup create` faz essa verificação do archive por padrão;
  `--no-verify` pula apenas a passagem pós-gravação do archive, não a verificação
  de integridade da criação do snapshot.
- A restauração copia snapshots de volta para seus caminhos de destino. Este
  branch redefine o layout SQLite ainda não lançado para `user_version = 1`;
  mudanças futuras de schema já lançadas podem adicionar migrações explícitas
  quando forem necessárias.

### Fase 6: Runtime De Worker

Mantenha o modo worker experimental enquanto a divisão do banco de dados entra:

- Workers recebem id do agente, id da execução, modo de sistema de arquivos e
  identidade do registro de DB.
- Cada worker abre sua própria conexão SQLite.
- O pai mantém autoridade sobre entrega de canais, aprovações, configuração e
  cancelamento.
- Comece com um worker por execução ativa; adicione pooling somente depois que o
  ciclo de vida e a posse da conexão com o DB estiverem estáveis.

### Fase 7: Excluir O Mundo Antigo

Concluído para gerenciamento de sessões em runtime. O mundo antigo é permitido
apenas como entrada explícita do doctor ou saída de suporte/exportação:

- Sem gravações de runtime em `sessions.json`, JSONL de transcrição, JSON de
  registro de sandbox, SQLite sidecar de tarefas ou SQLite sidecar de estado de
  Plugin.
- Sem remoção de arquivo JSON/sessão, truncamento de transcrição em arquivo,
  bloqueios de arquivo de sessão ou testes de sessão em formato de bloqueio.
- Sem exportações de compatibilidade de runtime cujo propósito seja manter arquivos
  de sessão antigos atualizados.
- Exportações explícitas de suporte permanecem formatos de archive/materialização
  solicitados pelo usuário e não devem alimentar nomes de arquivo de volta à
  identidade de runtime.

## Backup E Restauração

Backups devem ser um único arquivo de archive, mas a captura de banco de dados
deve ser nativa do SQLite:

1. Pare atividades de gravação de longa duração ou entre em uma barreira curta de
   backup.
2. Para todo banco de dados global e de agente, execute um checkpoint.
3. Crie snapshot de cada banco de dados usando semântica de backup SQLite ou
   `VACUUM INTO` em um diretório temporário de backup.
4. Arquive os snapshots compactados de banco de dados, arquivo de configuração,
   diretório de credenciais, workspaces selecionados e um manifesto.
5. Verifique o archive abrindo cada snapshot SQLite incluído e executando
   `PRAGMA integrity_check`.
   `openclaw backup create` faz isso por padrão; `--no-verify` serve apenas para
   pular intencionalmente a passagem pós-gravação do archive.

Não dependa de cópias brutas ativas de `*.sqlite`, `*.sqlite-wal` e `*.sqlite-shm`
como formato principal de backup. O manifesto do archive deve registrar função do
banco de dados, id do agente, versão do schema, caminho de origem, caminho do
snapshot, tamanho em bytes e status de integridade.

A restauração deve reconstruir o banco de dados global e os arquivos de banco de
dados de agente a partir dos snapshots do archive. Como o layout SQLite ainda não
foi lançado, esta refatoração mantém apenas o schema versão 1 mais a importação de
arquivo para banco de dados pelo doctor. O comando de restauração valida o archive
primeiro e depois substitui cada asset do manifesto a partir do payload extraído e
verificado.

## Plano De Refatoração Do Runtime

1. Adicionar APIs de registro de banco de dados.
   - Resolver caminhos do DB global e do DB por agente.
   - Manter os schemas ainda não lançados em `user_version = 1`; não adicionar
     código executor de migração de schema até que um schema lançado precise dele.
   - Adicionar auxiliares de fechamento/checkpoint/integridade usados por testes,
     backup e doctor.

2. Consolidar armazenamentos SQLite sidecar.
   - Mover tabelas de estado de Plugin para o banco de dados global. Concluído
     para gravações de runtime; o importador de sidecar legado ainda não lançado
     foi excluído.
   - Mover tabelas de registro de tarefas para o banco de dados global. Concluído
     para gravações de runtime; o importador de sidecar legado ainda não lançado
     foi excluído.
   - Mover tabelas de TaskFlow para o banco de dados global. Concluído para
     gravações de runtime; o importador de sidecar legado ainda não lançado foi
     excluído.
   - Mover tabelas integradas de busca em memória para cada banco de dados de
     agente. Concluído; `memorySearch.store.path` customizado explícito agora é
     removido pela migração de configuração do doctor.
     A reindexação completa roda no lugar apenas contra tabelas de memória; o
     caminho antigo de troca de arquivo inteiro e o auxiliar de troca de índice
     sidecar foram excluídos.
   - Excluir abridores de banco de dados duplicados, configuração WAL, auxiliares
     de permissão e caminhos de fechamento desses subsistemas.

3. Mover tabelas pertencentes ao agente para bancos de dados por agente.
   - Criar DB do agente sob demanda pelo registro de banco de dados global.
     Concluído.
   - Mover entradas de sessão de runtime, eventos de transcrição, linhas VFS e
     artefatos de ferramenta para DBs de agente. Concluído.
   - Não migrar entradas de sessão em DB compartilhado local ao branch, eventos de
     transcrição, linhas VFS ou artefatos de ferramenta; esse layout nunca foi
     lançado. Manter apenas importação legada de arquivo para banco de dados no
     doctor.

4. Substituir APIs de armazenamento de sessões.
   - Remover `storePath` como identidade de runtime. Concluído para runtime e
     protegido por `check:database-first-legacy-stores`: metadados de sessão,
     atualizações de rota, persistência de comandos, limpeza de sessão da CLI,
     prévias de raciocínio do Feishu, persistência de estado de transcrição,
     profundidade de subagente, substituições de sessão de perfil de autenticação,
     lógica de fork pai e inspeção do QA-lab agora resolvem o banco de dados a
     partir de chaves canônicas de agente/sessão.
     Respostas de lista de sessões do Gateway/TUI/UI/macOS agora expõem
     `databasePath` em vez do `path` legado; superfícies de depuração do macOS
     mostram o banco de dados por agente como estado somente leitura em vez de
     gravar configuração `session.store`.
     `/status`, exportação de trajetória acionada por chat e proxies de
     dependência da CLI não propagam mais caminhos de armazenamento legados; o
     fallback de uso de transcrição lê SQLite por identidade de agente/sessão.
     Testes de runtime e ponte não expõem mais `storePath`; entradas de
     doctor/migração são donas desse nome de campo legado.
     O carregamento de sessões combinadas do Gateway não tem mais um branch
     especial de runtime para valores `session.store` sem template; ele agrega
     linhas SQLite por agente.
     A faixa legada do doctor para bloqueio de sessão e seu auxiliar de limpeza
     `.jsonl.lock` foram removidos; SQLite agora é a fronteira de concorrência de
     sessão.
     Call sites quentes de runtime usam nomes de auxiliares orientados a linhas,
     como `resolveSessionRowEntry`; o alias antigo de compatibilidade
     `resolveSessionStoreEntry` foi removido do runtime e das exportações do SDK
     de Plugin.

- Usar operações de linha `{ agentId, sessionKey }`.
  Concluído: `getSessionEntry`, `upsertSessionEntry`, `deleteSessionEntry`,
  `patchSessionEntry` e `listSessionEntries` são APIs SQLite-first que não exigem
  um caminho de armazenamento de sessão. Resumo de status, status do agente local,
  integridade e o comando de listagem `openclaw sessions` agora leem linhas por
  agente diretamente e exibem caminhos de banco de dados SQLite por agente em vez
  de caminhos `sessions.json`.
- Substituir exclusão/inserção de armazenamento inteiro por `upsertSessionEntry`,
  `deleteSessionEntry`, `listSessionEntries` e consultas SQL de limpeza.
  Concluído para runtime: caminhos quentes agora usam APIs de linha e patches de
  linha com nova tentativa em conflito; os auxiliares restantes de
  importação/substituição de armazenamento inteiro são limitados ao código de
  importação de migração e testes do backend SQLite.
  - Excluir `store-writer.ts` e testes de fila de gravação. Concluído.
  - Excluir remoção de chave legada em runtime e parâmetros de exclusão de alias
    dos upserts/patches de linhas de sessão. Concluído.

5. Excluir comportamento de registro JSON em runtime.
   - Tornar leituras e gravações do registro de sandbox somente SQLite.
     Concluído.
   - Importar JSON monolítico e fragmentado apenas a partir da etapa de migração.
     Concluído.
   - Remover bloqueios de registro fragmentado e gravações JSON. Concluído.

- Manter uma tabela de registro tipada em vez de armazenar linhas de registro como
  JSON opaco genérico se o formato continuar sendo estado operacional de caminho
  quente. Concluído.

6. Excluir mutação de sessão em formato de bloqueio de arquivo.
   - Concluído para criação de bloqueio em runtime e APIs de bloqueio em runtime.
   - A faixa independente de limpeza legada `.jsonl.lock` do doctor foi removida.
   - `session.writeLock` é configuração legada migrada pelo doctor, não uma
     configuração tipada de runtime.
   - A integridade de estado não tem mais um caminho separado de remoção de
     arquivos de transcrição órfãos; a migração do doctor importa/remove fontes
     JSONL legadas em um só lugar.
   - A coordenação singleton do Gateway usa linhas tipadas SQLite `state_leases`
     em `gateway_locks` e não expõe mais uma superfície de diretório de bloqueio
     de arquivo.
   - A persistência genérica de deduplicação do SDK de Plugin não usa mais bloqueios
     de arquivo nem arquivos JSON; ela grava linhas SQLite compartilhadas de estado
     de Plugin. Concluído.
   - A coordenação de embed QMD usa uma concessão de estado SQLite em vez de
     `qmd/embed.lock`. Concluído.

7. Tornar workers cientes do banco de dados.
   - Workers abrem suas próprias conexões SQLite.
   - O pai é dono da entrega, callbacks de canal e configuração.
   - O worker recebe id do agente, id da execução, modo de sistema de arquivos e
     identidade do registro de DB, não handles ativos.
   - `vfs-only` permanece experimental e usa o banco de dados do agente como sua
     raiz de armazenamento.
   - Manter primeiro um worker por execução ativa. O pooling pode esperar até que
     o tempo de vida da conexão com o DB e o comportamento de cancelamento sejam
     simples.

8. Integração de backup.
   - Ensinar o backup a capturar snapshots dos bancos de dados globais e dos agentes via backup do SQLite ou
     `VACUUM INTO`. Concluído para arquivos `*.sqlite` descobertos sob o ativo de estado.
   - Adicionar verificação de backup para integridade do SQLite e versão do esquema. Concluído para
     a criação de backup e as verificações de integridade da verificação do arquivo padrão.
   - Registrar metadados da execução de backup no SQLite. Concluído via tabela compartilhada `backup_runs`
     com caminho do arquivo, status e JSON do manifesto.
   - Adicionar restauração a partir de snapshots de arquivos verificados. Concluído: `openclaw backup
restore` valida antes da extração, usa o manifesto normalizado do verificador,
     oferece suporte a `--dry-run` e exige `--yes` antes de substituir
     caminhos de origem registrados.
   - Incluir exportação de VFS/workspace somente quando solicitada; não exportar itens internos de sessão
     como JSON ou JSONL.

9. Excluir testes e código obsoletos. Concluído para as superfícies conhecidas de sessão de tempo de execução.

- Remover testes que afirmam a criação, em tempo de execução, de `sessions.json` ou arquivos
  JSONL de transcrição. Concluído para o armazenamento principal de sessões, chat, eventos de transcrição do Gateway,
  pré-visualização, ciclo de vida, atualizações de entrada de sessão de comando, redefinição/rastreamento de resposta automática e
  fixtures de dreaming do memory-core, roteamento de destino de aprovação, reparo de transcrição de sessão,
  reparo de permissão de segurança, exportação de trajetória e exportação de sessão.
  Os testes de transcrição do Active Memory agora afirmam escopos do SQLite e nenhuma criação de arquivo JSONL temporário ou
  persistido.
  A regressão antiga de poda de transcrição de heartbeat foi removida porque
  o tempo de execução não trunca mais transcrições JSONL.
  Os testes da ferramenta de lista de sessões de agente não modelam mais caminhos legados de `sessions.json`
  como o formato de resposta do Gateway; testes de app/UI/macOS usam `databasePath`.
  Os testes de uso de transcrição de `/status` agora semeiam linhas de transcrição do SQLite diretamente,
  em vez de gravar arquivos JSONL.
  Os testes de ciclo de vida de sessão do Gateway agora usam helpers de semeadura de transcrição do SQLite
  diretamente; o formato antigo de fixture de arquivo de sessão em uma linha saiu da cobertura de redefinição
  e exclusão.
  `sessions.delete` não retorna mais um campo `archived: []` da era de arquivos; a exclusão
  relata apenas o resultado da mutação de linha. A opção antiga `deleteTranscript`
  também saiu: excluir uma sessão remove a raiz canônica `sessions` e deixa
  o SQLite propagar em cascata as linhas de transcrição, snapshot e trajetória pertencentes à sessão, para que nenhum
  chamador possa deixar transcrições órfãs para trás ou esquecer um ramo de limpeza.
  Os testes de captura de trajetória do context-engine agora leem linhas `trajectory_runtime_events`
  de um banco de dados de agente isolado em vez de ler
  `session.trajectory.jsonl`.
  Scripts de seed de canal Docker MCP agora semeiam linhas do SQLite diretamente. Gravações diretas em
  `sessions.json` se limitam a fixtures do doctor.
  O E2E do Tool Search Gateway lê evidências de chamadas de ferramenta de linhas de transcrição do SQLite
  em vez de varrer arquivos `agents/<agentId>/sessions/*.jsonl`.
  Eventos de host e linhas temporárias de corpus de sessão do memory-core agora vivem no estado de plugin
  SQLite compartilhado; `events.jsonl` e `session-corpus/*.txt` são apenas entradas legadas
  de migração do doctor. Linhas ativas usam caminhos virtuais `memory/session-ingestion/`,
  não `.dreams/session-corpus`. O módulo antigo de reparo de dreaming do memory-core
  e seus testes de CLI/Gateway foram removidos porque o tempo de execução não
  é mais dono do reparo de arquivo desse corpus. Testes de ponte/artefato público do memory-core não
  expõem mais `.dreams/events.jsonl`; eles usam o nome de artefato JSON virtual baseado em SQLite.
  A documentação de testes do SDK público/Codex agora fala em estado de sessão SQLite em vez de arquivos
  de sessão, e o exemplo de turno de canal não expõe mais um argumento `storePath`.
  O estado de sincronização do Matrix agora usa diretamente o armazenamento de estado de plugin SQLite. Contratos ativos
  de cliente/tempo de execução passam uma raiz de armazenamento da conta, não um caminho `bot-storage.json`,
  e o doctor importa o `bot-storage.json` legado para o SQLite antes de excluir
  a origem. Cenários de reinício/destrutivos de QA Matrix agora alteram a linha de sincronização do SQLite
  diretamente em vez de criar ou excluir arquivos falsos `bot-storage.json`, e
  o substrato E2EE passa uma raiz de armazenamento de sincronização em vez de um caminho falso
  `sync-store.json`.
  A seleção da raiz de armazenamento do Matrix não pontua mais raízes por arquivos JSON legados de sincronização/thread;
  ela usa metadados duráveis de raiz mais o estado criptográfico real.
  A suíte de testes do backend de sessão SQLite de tempo de execução não fabrica mais um
  `sessions.json`; fixtures de origem legadas agora vivem nos testes do doctor
  que as importam.
  Testes de sessão do Gateway não expõem mais um helper `createSessionStoreDir` nem
  configuração não usada de caminho temporário de armazenamento de sessão; diretórios de fixture são explícitos, e a configuração
  direta de linhas usa nomenclatura de linhas de sessão do SQLite.
  A cobertura do parser de armazenamento de sessão JSON5 apenas do doctor saiu dos testes de infraestrutura e
  foi para os testes de migração do doctor, então suítes de teste de tempo de execução não são mais donas da análise
  de arquivos de sessão legados.
  Testes de SSO/uploads pendentes do tempo de execução do Microsoft Teams não carregam mais fixtures
  ou parsers de sidecar JSON; a análise de token SSO legado vive apenas no módulo de migração
  do Plugin. Testes do Telegram não semeiam mais caminhos falsos de armazenamento `/tmp/*.json`;
  eles redefinem diretamente o cache de mensagens baseado em SQLite. O helper genérico
  de estado de teste do OpenClaw não expõe mais um gravador legado `auth-profiles.json`;
  testes de migração de autenticação do doctor possuem essa fixture localmente.
  Testes de tempo de execução para ponteiros de última sessão do TUI, aprovações de exec, alternâncias de Active Memory,
  deduplicação/verificação de inicialização do Matrix, sincronização de origem do Memory Wiki,
  vínculos de conversa atual, autenticação de onboarding e importações de segredo do Hermes não
  fabricam mais arquivos sidecar antigos nem afirmam que nomes de arquivos antigos estão ausentes. Eles
  comprovam comportamento por linhas SQLite e APIs públicas de armazenamento; testes de doctor/migração
  são o único lugar em que nomes de arquivos de origem legados pertencem.
  Testes de tempo de execução para pareamento de dispositivo/node, allowFrom de canal, intents de reinício,
  handoff de reinício, entradas de fila de entrega de sessão, integridade de config, caches do iMessage,
  tarefas cron, cabeçalhos de transcrição PI, registros de subagentes e anexos de imagem gerenciados
  também não criam mais arquivos JSON/JSONL aposentados apenas para provar
  que são ignorados ou ausentes.
  A recuperação de overflow PI não tem mais um fallback de reescrita/truncamento do SessionManager:
  truncamento de resultado de ferramenta e reescritas de transcrição do context-engine alteram
  linhas de transcrição do SQLite e, depois, atualizam o estado ativo do prompt a partir do banco de dados.
  Appends persistidos de mensagens do SessionManager delegam ao helper atômico de append de transcrição
  do SQLite para seleção de pai e idempotência. Appends normais de metadados/entrada personalizada
  também selecionam o pai atual dentro do SQLite, então
  instâncias obsoletas do gerenciador não ressuscitam corridas de cadeia de pais pré-SQLite.
  A limpeza sintética de cauda PI para pré-verificações no meio do turno e `sessions_yield` agora
  aparar diretamente o estado de transcrição do SQLite; a ponte antiga de remoção de cauda do SessionManager
  e seus testes foram excluídos.
  A captura de checkpoint de Compaction também cria snapshots somente a partir do SQLite; chamadores não
  passam mais um SessionManager ativo como fonte alternativa de transcrição.
- Manter testes que semeiam arquivos legados somente para migração.
- Provas com arquivos JSON foram substituídas por provas com linhas SQL para superfícies ativas
  de tempo de execução.

- Adicionar proibições estáticas para gravações de tempo de execução em caminhos JSON legados de sessão/cache.
  Concluído para a guarda do repositório.

10. Tornar o relatório de migração auditável.
    - Registrar execuções de migração no SQLite com timestamps de início/fim, caminhos de origem,
      hashes de origem, contagens, avisos e caminho de backup.
      Concluído: execuções de migração de estado legado agora persistem um relatório `migration_runs`
      com inventário de caminho/tabela de origem, SHA-256 do arquivo de origem, tamanhos,
      contagens de registros, avisos e caminho de backup.
      Concluído: execuções de migração de estado legado também persistem linhas `migration_sources`
      para auditoria no nível da origem e futuras decisões de pular/backfill.
    - Tornar a aplicação idempotente. Executar novamente após uma importação parcial deve
      pular uma origem já importada ou mesclar por chave estável.
      Concluído: índices de sessão, transcrições, filas de entrega, estado de plugin, ledgers de tarefas
      e linhas SQLite globais pertencentes a agentes importam por chaves estáveis ou
      semântica de upsert/substituição, então reexecuções mesclam sem duplicar linhas duráveis.
    - Importações com falha devem manter o arquivo de origem original no lugar.
      Concluído: importações de transcrição com falha agora deixam a origem JSONL original em
      seu caminho detectado, e `migration_sources` registra a origem como
      `warning` com `removed_source=0` para a próxima execução do doctor.

## Regras de Performance

- Uma conexão por thread/processo está bem; não compartilhe handles entre
  workers.
- Use WAL, `foreign_keys=ON`, timeout de ocupado de 30s e transações de escrita curtas com `BEGIN IMMEDIATE`.
- Mantenha helpers de transação de escrita síncronos a menos/até que uma API de transação assíncrona
  adicione semântica explícita de mutex/backpressure.
- Mantenha gravações de entrega pai pequenas e transacionais.
- Evite reescritas do armazenamento inteiro; use upsert/delete no nível de linha.
- Adicione índices para list-by-agent, list-by-session, updated-at, run id e
  caminhos de expiração antes de mover código quente.
- Armazene artefatos grandes, mídia e vetores como BLOBs ou linhas de BLOB em partes, não
  JSON em base64 ou arrays numéricos.
- Mantenha entradas opacas de estado de plugin pequenas e com escopo definido.
- Adicione limpeza SQL para TTL/expiração em vez de poda do sistema de arquivos.
  Concluído para armazenamentos de tempo de execução pertencentes ao banco de dados: mídia, estado de plugin, blobs de plugin,
  deduplicação persistente e cache de agente expiram todos por linhas SQLite. A limpeza restante
  do sistema de arquivos se limita a materializações temporárias ou comandos explícitos
  de remoção.

## Proibições Estáticas

Adicione uma verificação de repositório que falhe novas gravações de tempo de execução em caminhos de estado legados:

- `sessions.json`
- `*.trajectory.jsonl` exceto saídas materializadas de pacotes de suporte
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
- Matrix `credentials*.json` e `recovery-key.json`
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
- Memory-core `.dreams/events.jsonl`
- Memory-core `.dreams/session-corpus/`
- Memory-core `.dreams/daily-ingestion.json`
- Memory-core `.dreams/session-ingestion.json`
- Memory-core `.dreams/short-term-recall.json`
- Memory-core `.dreams/phase-signals.json`
- Memory-core `.dreams/short-term-promotion.lock`
- Skill Workshop `skill-workshop/<workspace>.json`
- Skill Workshop `skill-workshop/skill-workshop-review-*.json`
- Nostr `bus-state-*.json`
- Nostr `profile-state-*.json`
- `calls.jsonl`
- `known-users.json`
- `ref-index.jsonl`
- QQBot `session-*.json`
- BlueBubbles `bluebubbles/catchup/*.json`
- BlueBubbles `bluebubbles/inbound-dedupe/*.json`
- Telegram `update-offset-*.json`
- Telegram `sticker-cache.json`
- Telegram `*.telegram-messages.json`
- Telegram `*.telegram-sent-messages.json`
- Telegram `*.telegram-topic-names.json`
- Telegram `thread-bindings-*.json`
- iMessage `catchup/*.json`
- iMessage `reply-cache.jsonl`
- iMessage `sent-echoes.jsonl`
- Microsoft Teams `msteams-conversations.json`
- Microsoft Teams `msteams-polls.json`
- Microsoft Teams `msteams-sso-tokens.json`
- Microsoft Teams `*.learnings.json`
- Matrix `bot-storage.json`
- Matrix `sync-store.json`
- Matrix `thread-bindings.json`
- Matrix `inbound-dedupe.json`
- Matrix `startup-verification.json`
- Matrix `storage-meta.json`
- Matrix `crypto-idb-snapshot.json`
- Discord `model-picker-preferences.json`
- Discord `command-deploy-cache.json`
- arquivos JSON de fragmento do registro de sandbox
- arquivos JSON de ponte `/tmp` do relé de hook nativo
- `plugin-state/state.sqlite`
- sidecars de runtime ad hoc `openclaw-state.sqlite`
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
- Memory Wiki `.openclaw-wiki/log.jsonl`
- Memory Wiki `.openclaw-wiki/state.json`
- Memory Wiki `.openclaw-wiki/locks/`
- Memory Wiki `.openclaw-wiki/source-sync.json`
- Memory Wiki `.openclaw-wiki/import-runs/*.json`
- Memory Wiki `.openclaw-wiki/cache/agent-digest.json`
- Memory Wiki `.openclaw-wiki/cache/claims.jsonl`
- ClawHub `.clawhub/lock.json`
- ClawHub `.clawhub/origin.json`
- decoração de perfil de navegador `.openclaw-profile-decorated`
- abridores de sessão baseados em arquivo `SessionManager.open(...)`
- fachadas de listagem de transcrições `SessionManager.listAll(...)` e `TranscriptSessionManager.listAll(...)`
- fachadas de fork de transcrição `SessionManager.forkFromSession(...)` e
  `TranscriptSessionManager.forkFromSession(...)`
- fachadas de substituição de sessão mutável `SessionManager.newSession(...)` e `TranscriptSessionManager.newSession(...)`
- fachadas de sessão de branch `SessionManager.createBranchedSession(...)` e
  `TranscriptSessionManager.createBranchedSession(...)`

A proibição deve permitir que testes criem fixtures legados e permitir que código de migração
leia/importe/remova fontes de arquivos legados. Sidecars SQLite não lançados permanecem proibidos
e não recebem permissões de importação do doctor.

## Critérios de Conclusão

- Gravações de dados e cache de runtime vão para o banco de dados SQLite global ou do agente.
- O runtime não grava mais índices de sessão, JSONL de transcrições, JSON de registro
  de sandbox, SQLite sidecar de tarefas ou SQLite sidecar de estado de Plugin. Os importadores SQLite sidecar
  não lançados de tarefas e estado de Plugin são excluídos.
- A importação de arquivos legados é apenas do doctor.
- O backup produz um arquivo com snapshots SQLite compactos e prova de integridade.
- Workers de agente podem executar com disco, rascunho VFS ou armazenamento
  experimental somente VFS.
- Arquivos de configuração e credenciais explícitos continuam sendo os únicos arquivos de controle persistentes
  não relacionados a banco de dados esperados.
- Verificações do repositório impedem a reintrodução de armazenamentos de arquivos de runtime legados.
