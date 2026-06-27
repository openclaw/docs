---
read_when:
    - Executando ou corrigindo testes
summary: Como executar testes localmente (vitest) e quando usar modos de força/cobertura
title: Testes
x-i18n:
    generated_at: "2026-06-27T18:10:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba6d1665497bebed287e69c865407dfb233ad60d64175558d053a69c72fea217
    source_path: reference/test.md
    workflow: 16
---

- Kit completo de testes (suítes, ao vivo, Docker): [Testes](/pt-BR/help/testing)
- Validação de atualizações e pacotes de plugins: [Testando atualizações e plugins](/pt-BR/help/testing-updates-plugins)

- Ordem rotineira de testes locais:
  1. `pnpm test:changed` para comprovação do Vitest no escopo alterado.
  2. `pnpm test <path-or-filter>` para um arquivo, diretório ou alvo explícito.
  3. `pnpm test` somente quando você precisar intencionalmente da suíte local completa do Vitest.
- `pnpm test:force`: Encerra qualquer processo de Gateway remanescente que esteja ocupando a porta de controle padrão e, em seguida, executa a suíte completa do Vitest com uma porta de Gateway isolada para que os testes de servidor não entrem em conflito com uma instância em execução. Use isto quando uma execução anterior do Gateway deixou a porta 18789 ocupada.
- `pnpm test:coverage`: Executa a suíte unitária com cobertura V8 (via `vitest.unit.config.ts`). Este é um gate de cobertura da lane unitária padrão, não cobertura de todos os arquivos de todo o repositório. Os limites são 70% para linhas/funções/instruções e 55% para branches. Como `coverage.all` é falso e a lane padrão restringe as inclusões de cobertura a testes unitários não rápidos com arquivos-fonte irmãos, o gate mede o código-fonte pertencente a esta lane em vez de todo import transitivo que por acaso ela carrega.
- `pnpm test:coverage:changed`: Executa cobertura unitária somente para arquivos alterados desde `origin/main`.
- `pnpm test:changed`: execução barata e inteligente de testes alterados. Ela executa alvos precisos a partir de edições diretas em testes, arquivos `*.test.ts` irmãos, mapeamentos explícitos de código-fonte e o grafo local de imports. Alterações amplas de configuração/pacote são ignoradas, a menos que sejam mapeadas para testes precisos.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: execução ampla explícita de testes alterados. Use quando uma edição de harness/configuração/pacote de testes deve voltar ao comportamento mais amplo de testes alterados do Vitest.
- `pnpm changed:lanes`: mostra as lanes arquiteturais acionadas pelo diff contra `origin/main`.
- `pnpm check:changed`: delega para Crabbox/Testbox por padrão fora do CI e, em seguida, executa o gate inteligente de verificação de alterações para o diff contra `origin/main` dentro do filho remoto. Ele executa typecheck, lint e comandos de guarda para as lanes arquiteturais afetadas, mas não executa testes Vitest. Use `pnpm test:changed` ou `pnpm test <target>` explícito para comprovação de testes.
- Worktrees do Codex e checkouts vinculados/esparsos: evite `pnpm test*`, `pnpm check*` e `pnpm crabbox:run` locais diretos, a menos que você tenha verificado que o pnpm não reconciliará dependências. Para comprovação pequena de arquivo explícito, use `node scripts/run-vitest.mjs <path-or-filter>`; para gates de alterações ou comprovação ampla, use `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed` para que o pnpm execute dentro do Testbox.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: mantém a serialização de verificações pesadas dentro da worktree atual em vez do diretório comum do Git para comandos como `pnpm check:changed` e `pnpm test ...` direcionado. Use somente em hosts locais de alta capacidade quando você executar intencionalmente verificações independentes entre worktrees vinculadas.
- `pnpm test`: roteia alvos explícitos de arquivo/diretório por lanes Vitest com escopo. Execuções sem alvo são comprovação de suíte completa: elas usam grupos fixos de shards, expandem para configurações folha para execução paralela local e imprimem o fanout local de shards esperado antes de começar. O grupo de extensões sempre se expande para as configurações de shard por extensão em vez de um único processo gigante de projeto raiz.
- As execuções do wrapper de testes terminam com um resumo curto `[test] passed|failed|skipped ... in ...`. A própria linha de duração do Vitest continua sendo o detalhe por shard.
- Estado de teste compartilhado do OpenClaw: use `src/test-utils/openclaw-test-state.ts` a partir do Vitest quando um teste precisar de `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture de configuração, workspace, diretório de agente ou armazenamento de perfil de autenticação isolados.
- `pnpm test:env-mutations:report`: relatório não bloqueante de testes e harnesses que alteram diretamente `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` ou chaves de ambiente relacionadas ao OpenClaw. Use para encontrar candidatos à migração para o helper compartilhado de estado de teste.
- E2E simulado da UI de controle: use `pnpm test:ui:e2e` para a lane Vitest + Playwright que inicia a UI de controle do Vite e conduz uma página real do Chromium contra um WebSocket do Gateway simulado. Os testes ficam em `ui/src/**/*.e2e.test.ts`; mocks e controles compartilhados ficam em `ui/src/test-helpers/control-ui-e2e.ts`. `pnpm test:e2e` inclui esta lane. Em worktrees do Codex, prefira `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` para comprovação pequena e direcionada depois que as dependências estiverem instaladas, ou Testbox/Crabbox para comprovação GUI mais ampla.
- Helpers de E2E de processo: use `test/helpers/openclaw-test-instance.ts` quando um teste E2E em nível de processo do Vitest precisar de um Gateway em execução, ambiente da CLI, captura de logs e limpeza em um só lugar.
- Testes PTY da TUI: use `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` para a lane PTY rápida com backend falso. Use `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` ou `pnpm tui:pty:test:watch --mode local` para o smoke mais lento de `tui --local`, que simula apenas o endpoint de modelo externo. Faça asserções sobre texto visível estável ou chamadas de fixture, não sobre snapshots ANSI brutos.
- Helpers de E2E Docker/Bash: lanes que usam `scripts/lib/docker-e2e-image.sh` como source podem passar `docker_e2e_test_state_shell_b64 <label> <scenario>` para o contêiner e decodificá-lo com `scripts/lib/openclaw-e2e-instance.sh`; scripts com múltiplos homes podem passar `docker_e2e_test_state_function_b64` e chamar `openclaw_test_state_create <label> <scenario>` em cada fluxo. Chamadores de nível mais baixo podem usar `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` para um snippet de shell dentro do contêiner, ou `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` para um arquivo de ambiente do host que pode ser usado como source. O `--` antes de `create` impede que runtimes Node mais novos tratem `--env-file` como uma flag do Node. Lanes Docker/Bash que iniciam um Gateway podem usar `scripts/lib/openclaw-e2e-instance.sh` como source dentro do contêiner para resolução de entrypoint, inicialização simulada da OpenAI, lançamento do Gateway em primeiro/segundo plano, probes de prontidão, exportação do ambiente de estado, dumps de logs e limpeza de processos.
- Execuções completas, de extensão e com padrão de inclusão atualizam dados locais de timing em `.artifacts/vitest-shard-timings.json`; execuções posteriores de configuração inteira usam esses timings para equilibrar shards lentos e rápidos. Shards de CI com padrão de inclusão acrescentam o nome do shard à chave de timing, o que mantém os timings filtrados de shards visíveis sem substituir os dados de timing de configuração inteira. Defina `OPENCLAW_TEST_PROJECTS_TIMINGS=0` para ignorar o artefato local de timing.
- Arquivos de teste selecionados de `plugin-sdk` e `commands` agora são roteados por lanes leves dedicadas que mantêm apenas `test/setup.ts`, deixando casos pesados de runtime em suas lanes existentes.
- Arquivos-fonte com testes irmãos são mapeados para esse irmão antes de recorrer a globs de diretório mais amplos. Edições de helpers em `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` e `src/plugins/contracts` usam um grafo local de imports para executar testes importadores em vez de executar amplamente todos os shards quando o caminho de dependência é preciso.
- `auto-reply` agora também se divide em três configurações dedicadas (`core`, `top-level`, `reply`) para que o harness de resposta não domine os testes mais leves de status/token/helper de nível superior.
- A configuração base do Vitest agora usa `pool: "threads"` e `isolate: false` por padrão, com o runner não isolado compartilhado habilitado nas configurações do repositório.
- `pnpm test:channels` executa `vitest.channels.config.ts`.
- `pnpm test:extensions` e `pnpm test extensions` executam todos os shards de extensão/Plugin. Plugins pesados de canal, o Plugin de navegador e OpenAI executam como shards dedicados; outros grupos de Plugin permanecem em lotes. Use `pnpm test extensions/<id>` para uma lane de Plugin empacotado.
- `pnpm test:perf:imports`: habilita relatórios de duração de import + detalhamento de imports do Vitest, enquanto ainda usa roteamento de lanes com escopo para alvos explícitos de arquivo/diretório.
- `pnpm test:perf:imports:changed`: mesmo profiling de imports, mas somente para arquivos alterados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` mede o desempenho do caminho roteado em modo de alterações contra a execução nativa de projeto raiz para o mesmo diff Git commitado.
- `pnpm test:perf:changed:bench -- --worktree` mede o desempenho do conjunto de alterações da worktree atual sem commitar antes.
- `pnpm test:perf:profile:main`: grava um perfil de CPU para a thread principal do Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: grava perfis de CPU + heap para o runner unitário (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: executa serialmente toda configuração folha do Vitest da suíte completa e grava dados de duração agrupados mais artefatos JSON/log por configuração. O Test Performance Agent usa isto como baseline antes de tentar correções de testes lentos.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: compara relatórios agrupados após uma alteração focada em desempenho.
- `pnpm test:docker:timings <summary.json>` inspeciona lanes Docker lentas após uma execução Docker completa; use `pnpm test:docker:rerun <run-id|summary.json|failures.json>` para imprimir comandos baratos de reexecução direcionada a partir dos mesmos artefatos.
- Integração do Gateway: habilite explicitamente via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e`: Executa o agregado E2E do repositório: testes smoke de ponta a ponta do Gateway mais a lane E2E de navegador simulado da UI de controle.
- `pnpm test:e2e:gateway`: Executa testes smoke de ponta a ponta do Gateway (pareamento multi-instância WS/HTTP/node). Usa `threads` + `isolate: false` por padrão com workers adaptativos em `vitest.e2e.config.ts`; ajuste com `OPENCLAW_E2E_WORKERS=<n>` e defina `OPENCLAW_E2E_VERBOSE=1` para logs verbosos.
- `pnpm test:live`: Executa testes live de provedor (minimax/zai). Requer chaves de API e `LIVE=1` (ou `*_LIVE_TEST=1` específico do provedor) para deixar de ignorar.
- `pnpm test:docker:all`: Cria a imagem compartilhada de testes live, empacota o OpenClaw uma vez como um tarball npm, cria/reutiliza uma imagem básica de executor Node/Git mais uma imagem funcional que instala esse tarball em `/app` e, em seguida, executa lanes de smoke do Docker com `OPENCLAW_SKIP_DOCKER_BUILD=1` por meio de um agendador ponderado. A imagem básica (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) é usada para lanes de instalador/atualização/dependência de Plugin; essas lanes montam o tarball pré-criado em vez de usar fontes copiadas do repositório. A imagem funcional (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) é usada para lanes normais de funcionalidade do app compilado. `scripts/package-openclaw-for-docker.mjs` é o empacotador único de pacote local/CI e valida o tarball mais `dist/postinstall-inventory.json` antes que o Docker o consuma. As definições de lanes do Docker ficam em `scripts/lib/docker-e2e-scenarios.mjs`; a lógica do planejador fica em `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` executa o plano selecionado. `node scripts/test-docker-all.mjs --plan-json` emite o plano de CI pertencente ao agendador para lanes selecionadas, tipos de imagem, necessidades de pacote/imagem live, cenários de estado e verificações de credenciais sem criar nem executar Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` controla os slots de processo e o padrão é 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` controla o pool final sensível a provedor e o padrão é 10. Os limites de lanes pesadas têm padrão `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; os limites de provedor têm padrão de uma lane pesada por provedor via `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` e `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Use `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` para hosts maiores. Se uma lane exceder o peso efetivo ou o limite de recursos em um host de baixo paralelismo, ela ainda poderá iniciar a partir de um pool vazio e será executada sozinha até liberar capacidade. Os inícios de lane são escalonados por 2 segundos por padrão para evitar tempestades de criação no daemon Docker local; substitua com `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. O executor faz preflight do Docker por padrão, limpa contêineres E2E antigos do OpenClaw, emite status de lanes ativas a cada 30 segundos, compartilha caches de ferramentas CLI de provedor entre lanes compatíveis, tenta novamente falhas transitórias de provedor live uma vez por padrão (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) e armazena tempos de lane em `.artifacts/docker-tests/lane-timings.json` para ordenação do mais longo primeiro em execuções posteriores. Use `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir o manifesto de lanes sem executar Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` para ajustar a saída de status ou `OPENCLAW_DOCKER_ALL_TIMINGS=0` para desativar a reutilização de tempos. Use `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` apenas para lanes determinísticas/locais ou `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` apenas para lanes de provedor live; os aliases de pacote são `pnpm test:docker:local:all` e `pnpm test:docker:live:all`. O modo somente live mescla as lanes live principais e finais em um único pool do mais longo primeiro para que os buckets de provedor possam agrupar o trabalho de Claude, Codex e Gemini. O executor para de agendar novas lanes em pool após a primeira falha, a menos que `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` esteja definido, e cada lane tem um timeout de fallback de 120 minutos substituível com `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; lanes live/finais selecionadas usam limites por lane mais rígidos. Comandos de configuração Docker de backend CLI têm seu próprio timeout via `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (padrão 180). Logs por lane, `summary.json`, `failures.json` e tempos de fases são gravados em `.artifacts/docker-tests/<run-id>/`; use `pnpm test:docker:timings <summary.json>` para inspecionar lanes lentas e `pnpm test:docker:rerun <run-id|summary.json|failures.json>` para imprimir comandos de reexecução direcionados e baratos.
- `pnpm test:docker:browser-cdp-snapshot`: Cria um contêiner E2E de fontes baseado em Chromium, inicia CDP bruto mais um Gateway isolado, executa `browser doctor --deep` e verifica se snapshots de papéis CDP incluem URLs de links, clicáveis promovidos por cursor, refs de iframe e metadados de frame.
- `pnpm test:docker:skill-install`: Instala o tarball empacotado do OpenClaw em um executor Docker básico, desativa `skills.install.allowUploadedArchives`, resolve um slug de skill atual pela busca live do ClawHub, instala-o por meio de `openclaw skills install` e verifica `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` e `skills info --json`.
- Probes Docker live de backend CLI podem ser executadas como lanes focadas, por exemplo `pnpm test:docker:live-cli-backend:claude`, `pnpm test:docker:live-cli-backend:claude:resume` ou `pnpm test:docker:live-cli-backend:claude:mcp`. Gemini tem aliases `:resume` e `:mcp` correspondentes.
- `pnpm test:docker:openwebui`: Inicia OpenClaw + Open WebUI em Docker, faz login pelo Open WebUI, verifica `/api/models` e, em seguida, executa um chat real por proxy por meio de `/api/chat/completions`. Exige uma chave de modelo live utilizável, baixa uma imagem externa do Open WebUI e não se espera que seja estável em CI como as suítes normais unitárias/e2e.
- `pnpm test:docker:mcp-channels`: Inicia um contêiner Gateway semeado e um segundo contêiner cliente que gera `openclaw mcp serve`; em seguida, verifica descoberta de conversas roteadas, leituras de transcrição, metadados de anexos, comportamento da fila de eventos live, roteamento de envio de saída e notificações de canal + permissão no estilo Claude pela ponte stdio real. A asserção de notificação do Claude lê os frames MCP stdio brutos diretamente para que o smoke reflita o que a ponte realmente emite.
- `pnpm test:docker:upgrade-survivor`: Instala o tarball empacotado do OpenClaw sobre uma fixture suja de usuário antigo, executa atualização de pacote mais doctor não interativo sem chaves de provedor live ou canal; em seguida, inicia um Gateway de local loopback e verifica se agentes, configuração de canal, listas de permissão de Plugin, arquivos de workspace/sessão, estado obsoleto legado de dependências de Plugin, inicialização e status RPC sobrevivem.
- `pnpm test:docker:published-upgrade-survivor`: Instala `openclaw@latest` por padrão, semeia arquivos realistas de usuário existente sem chaves de provedor live ou canal, configura essa base com uma receita incorporada de comando `openclaw config set`, atualiza essa instalação publicada para o tarball empacotado do OpenClaw, executa doctor não interativo, grava `.artifacts/upgrade-survivor/summary.json`; em seguida, inicia um Gateway de local loopback e verifica se intenções configuradas, arquivos de workspace/sessão, configuração obsoleta de Plugin e estado legado de dependências, inicialização, `/healthz`, `/readyz` e status RPC sobrevivem ou são reparados de forma limpa. Substitua uma base com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, expanda uma matriz local exata com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, como `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, ou adicione fixtures de cenário com `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; o conjunto reported-issues inclui `configured-plugin-installs` para verificar que Plugins externos do OpenClaw configurados são instalados automaticamente durante a atualização e `stale-source-plugin-shadow` para impedir que sombras de Plugin somente de fonte quebrem a inicialização. Package Acceptance expõe isso como `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` e `published_upgrade_survivor_scenarios`, e resolve tokens meta de base como `last-stable-4` ou `all-since-2026.4.23` antes de entregar especificações exatas de pacote às lanes Docker.
- `pnpm test:docker:update-migration`: Executa o harness de sobrevivente de atualização publicada no cenário de limpeza intensiva `plugin-deps-cleanup`, começando em `openclaw@2026.4.23` por padrão. O workflow separado `Update Migration` expande essa lane com `baselines=all-since-2026.4.23` para que todos os pacotes estáveis publicados a partir de `.23` sejam atualizados para o candidato e comprovem a limpeza de dependências de Plugin configuradas fora do Full Release CI.
- `pnpm test:docker:plugins`: Executa smoke de instalação/atualização para caminho local, `file:`, pacotes de registro npm com dependências içadas, refs móveis git, fixtures do ClawHub, atualizações de marketplace e habilitação/inspeção de pacote Claude.

## Gate local de PR

Para verificações locais de land/gate de PR, execute:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Se `pnpm test` apresentar flakiness em um host carregado, execute novamente uma vez antes de tratar como regressão; depois isole com `pnpm test <path/to/test>`. Para hosts com restrição de memória, use:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark de latência de modelo (chaves locais)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `pnpm tsx scripts/bench-model.ts --runs 10`
- Env opcional: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt padrão: "Responda com uma única palavra: ok. Sem pontuação nem texto extra."

Última execução (2025-12-31, 20 execuções):

- mediana do minimax 1279ms (mín. 1114, máx. 2431)
- mediana do opus 2454ms (mín. 1224, máx. 3170)

## Benchmark de inicialização da CLI

Script: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

Uso:

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case tasksJson --case tasksListJson --case tasksAuditJson --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Predefinições:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: ambas as predefinições

A saída inclui `sampleCount`, média, p50, p95, mín./máx., distribuição de código de saída/sinal e resumos de RSS máximo para cada comando. `--cpu-prof-dir` / `--heap-prof-dir` opcionais gravam perfis V8 por execução para que a temporização e a captura de perfil usem o mesmo harness.

Convenções de saída salva:

- `pnpm test:startup:bench:smoke` grava o artefato de smoke direcionado em `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` grava o artefato da suíte completa em `.artifacts/cli-startup-bench-all.json` usando `runs=5` e `warmup=1`
- `pnpm test:startup:bench:update` atualiza a fixture de baseline versionada em `test/fixtures/cli-startup-bench.json` usando `runs=5` e `warmup=1`

Fixture versionada:

- `test/fixtures/cli-startup-bench.json`
- Atualize com `pnpm test:startup:bench:update`
- Compare os resultados atuais com a fixture usando `pnpm test:startup:bench:check`

## Benchmark de inicialização do Gateway

Script: [`scripts/bench-gateway-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-startup.ts)

O benchmark usa por padrão a entrada da CLI compilada em `dist/entry.js`; execute
`pnpm build` antes de usar os comandos de script do pacote. Para medir o runner
de origem em vez disso, passe `--entry scripts/run-node.mjs` e mantenha esses resultados
separados dos baselines de entrada compilada.

Uso:

- `pnpm test:startup:gateway -- --runs 5 --warmup 1`
- `pnpm test:startup:gateway -- --case default --runs 10 --warmup 1`
- `pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 3 --cpu-prof-dir .artifacts/gateway-startup-cpu`

IDs de caso:

- `default`: inicialização normal do Gateway.
- `skipChannels`: inicialização do Gateway com a inicialização de canais ignorada.
- `oneInternalHook`: um hook interno configurado.
- `allInternalHooks`: todos os hooks internos.
- `fiftyPlugins`: 50 plugins de manifesto.
- `fiftyStartupLazyPlugins`: 50 plugins de manifesto com inicialização lazy.

A saída inclui a primeira saída do processo, `/healthz`, `/readyz`, tempo de log de escuta HTTP,
tempo de log de Gateway pronto, tempo de CPU, proporção de núcleo de CPU, RSS máximo, heap, métricas
de trace de inicialização, atraso do event-loop e métricas detalhadas da tabela de lookup de plugins.
O script habilita `OPENCLAW_GATEWAY_STARTUP_TRACE=1` no ambiente filho do Gateway.

Leia `/healthz` como liveness: o servidor HTTP consegue responder. Leia `/readyz` como
prontidão utilizável: sidecars de plugins de inicialização, canais e trabalho pós-attach
crítico para prontidão foram concluídos. Hooks de inicialização do Gateway são despachados
de forma assíncrona e não fazem parte da garantia de prontidão. O tempo de log de pronto é o
carimbo de data/hora interno de log de pronto do Gateway; ele é útil para atribuição do lado do processo,
mas não substitui a sondagem externa de `/readyz`.

Use saída JSON ou `--output` ao comparar alterações. Use `--cpu-prof-dir` somente
depois que a saída de trace apontar para importação, compilação ou trabalho CPU-bound que não possa
ser explicado apenas pelos tempos de fase. Não compare resultados do runner de origem com
resultados compilados de `dist/entry.js` como o mesmo baseline.

## Benchmark de reinicialização do Gateway

Script: [`scripts/bench-gateway-restart.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-restart.ts)

O benchmark de reinicialização é compatível apenas com macOS e Linux. Ele usa SIGUSR1 para
reinicializações dentro do processo e falha imediatamente no Windows.

O benchmark usa por padrão a entrada da CLI compilada em `dist/entry.js`; execute
`pnpm build` antes de usar os comandos de script do pacote. Para medir o runner
de origem em vez disso, passe `--entry scripts/run-node.mjs` e mantenha esses resultados
separados dos baselines de entrada compilada.

Uso:

- `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`
- `pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1`
- `pnpm test:restart:gateway -- --case skipChannelsAcpxProbe --case skipChannelsNoAcpxProbe --runs 1 --restarts 5`
- `node --import tsx scripts/bench-gateway-restart.ts --case fiftyPlugins --runs 1 --restarts 5 --output .artifacts/gateway-restart.json`
- `node --import tsx scripts/bench-gateway-restart.ts --json`

IDs de caso:

- `skipChannels`: reinicialização com canais ignorados.
- `skipChannelsAcpxProbe`: reinicialização com canais ignorados e sondagem de inicialização ACPX ativada.
- `skipChannelsNoAcpxProbe`: reinicialização com canais ignorados e sondagem de inicialização ACPX desativada.
- `default`: reinicialização normal.
- `fiftyPlugins`: reinicialização com 50 plugins de manifesto.

A saída inclui próximo `/healthz`, próximo `/readyz`, indisponibilidade, temporização de pronto da reinicialização,
CPU, RSS, métricas de trace de inicialização para o processo substituto e métricas de trace de reinicialização
para tratamento de sinal, drenagem de trabalho ativo, fases de fechamento, próxima inicialização, temporização
de pronto e snapshots de memória. O script habilita
`OPENCLAW_GATEWAY_STARTUP_TRACE=1` e `OPENCLAW_GATEWAY_RESTART_TRACE=1` no
ambiente filho do Gateway.

Use este benchmark quando uma alteração tocar sinalização de reinicialização, handlers de fechamento,
inicialização após reinicialização, encerramento de sidecar, handoff de serviço ou prontidão após
reinicialização. Comece com `skipChannels` ao isolar a mecânica do Gateway da inicialização
de canais. Use `default` ou casos pesados em plugins somente depois que o caso estreito explicar
o caminho de reinicialização.

Métricas de trace são dicas de atribuição, não vereditos. Uma alteração de reinicialização deve ser
julgada a partir de múltiplas amostras, do intervalo do owner correspondente, do comportamento de `/healthz` e `/readyz`
e do contrato de reinicialização visível ao usuário.

## E2E de onboarding (Docker)

Docker é opcional; isto só é necessário para testes de smoke de onboarding em contêiner.

Fluxo completo de cold-start em um contêiner Linux limpo:

```bash
scripts/e2e/onboard-docker.sh
```

Este script conduz o assistente interativo por meio de um pseudo-tty, verifica arquivos de config/workspace/sessão, depois inicia o gateway e executa `openclaw health`.

## Smoke de importação de QR (Docker)

Garante que o helper de runtime QR mantido carregue nos runtimes Docker Node compatíveis (Node 24 padrão, Node 22 compatível):

```bash
pnpm test:docker:qr
```

## Relacionado

- [Testes](/pt-BR/help/testing)
- [Testes live](/pt-BR/help/testing-live)
- [Testes de atualizações e plugins](/pt-BR/help/testing-updates-plugins)
