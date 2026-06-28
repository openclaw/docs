---
read_when:
    - Executando ou corrigindo testes
summary: Como executar testes localmente (vitest) e quando usar os modos force/coverage
title: Testes
x-i18n:
    generated_at: "2026-06-28T00:13:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7d1aed76ed59713ee320eb2d18dc8c392ea7a810096a0ef3131388001bbe5d8d
    source_path: reference/test.md
    workflow: 16
---

- Kit completo de testes (suítes, live, Docker): [Testes](/pt-BR/help/testing)
- Validação de atualização e pacote de Plugin: [Testando atualizações e plugins](/pt-BR/help/testing-updates-plugins)

- Ordem rotineira de testes locais:
  1. `pnpm test:changed` para prova Vitest do escopo alterado.
  2. `pnpm test <path-or-filter>` para um arquivo, diretório ou alvo explícito.
  3. `pnpm test` somente quando você precisar intencionalmente da suíte Vitest local completa.
- `pnpm test:force`: Encerra qualquer processo Gateway remanescente que esteja ocupando a porta de controle padrão e, em seguida, executa a suíte Vitest completa com uma porta Gateway isolada para que testes de servidor não colidam com uma instância em execução. Use isto quando uma execução anterior do Gateway tiver deixado a porta 18789 ocupada.
- `pnpm test:coverage`: Executa a suíte unitária com cobertura V8 (via `vitest.unit.config.ts`). Este é um gate de cobertura da lane unitária padrão, não cobertura de todos os arquivos do repositório inteiro. Os limites são 70% para linhas/funções/instruções e 55% para branches. Como `coverage.all` é false e a lane padrão restringe os includes de cobertura a testes unitários não rápidos com arquivos-fonte irmãos, o gate mede o código-fonte pertencente a esta lane em vez de cada importação transitiva que por acaso ela carrega.
- `pnpm test:coverage:changed`: Executa cobertura unitária somente para arquivos alterados desde `origin/main`.
- `pnpm test:changed`: execução barata e inteligente de testes alterados. Ela executa alvos precisos a partir de edições diretas em testes, arquivos irmãos `*.test.ts`, mapeamentos explícitos de código-fonte e o grafo de importação local. Alterações amplas/configuração/pacote são ignoradas, a menos que sejam mapeadas para testes precisos.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: execução ampla explícita de testes alterados. Use quando uma edição de harness/configuração/pacote de teste deve voltar ao comportamento mais amplo de testes alterados do Vitest.
- `pnpm changed:lanes`: mostra as lanes arquiteturais acionadas pelo diff contra `origin/main`.
- `pnpm check:changed`: delega para Crabbox/Testbox por padrão fora do CI e, em seguida, executa o gate inteligente de verificação de alterações para o diff contra `origin/main` dentro do filho remoto. Ele executa typecheck, lint e comandos de guard para as lanes arquiteturais afetadas, mas não executa testes Vitest. Use `pnpm test:changed` ou `pnpm test <target>` explícito para prova de teste.
- Worktrees do Codex e checkouts vinculados/esparsos: evite `pnpm test*`, `pnpm check*` e `pnpm crabbox:run` locais diretos, a menos que você tenha verificado que pnpm não reconciliará dependências. Para prova minúscula de arquivo explícito, use `node scripts/run-vitest.mjs <path-or-filter>`; para gates de alterações ou prova ampla, use `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed` para que pnpm execute dentro do Testbox.
- Prova Testbox-por-Crabbox: use o `exitCode` final do wrapper e o JSON de timing como resultado do comando. A execução delegada do Blacksmith GitHub Actions pode mostrar `cancelled` depois de um comando SSH bem-sucedido porque o Testbox é parado de fora da ação de keepalive; verifique o resumo do wrapper e a saída do comando antes de tratar isso como falha de teste.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: mantém a serialização de verificações pesadas dentro da worktree atual em vez do diretório comum do Git para comandos como `pnpm check:changed` e `pnpm test ...` direcionado. Use somente em hosts locais de alta capacidade quando você executa intencionalmente verificações independentes em worktrees vinculadas.
- `pnpm test`: roteia alvos explícitos de arquivo/diretório por lanes Vitest com escopo. Execuções sem alvo são prova da suíte completa: usam grupos de shards fixos, expandem para configs folha para execução paralela local e imprimem o fanout de shards local esperado antes de iniciar. O grupo de extensões sempre expande para as configs de shard por extensão em vez de um processo gigante de projeto raiz.
- Execuções do wrapper de teste terminam com um breve resumo `[test] passed|failed|skipped ... in ...`. A própria linha de duração do Vitest permanece como detalhe por shard.
- Estado de teste compartilhado do OpenClaw: use `src/test-utils/openclaw-test-state.ts` a partir do Vitest quando um teste precisar de `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture de configuração, workspace, diretório de agente ou armazenamento de perfil de autenticação isolados.
- `pnpm test:env-mutations:report`: relatório não bloqueante de testes e harnesses que alteram diretamente `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` ou chaves de env relacionadas ao OpenClaw. Use para encontrar candidatos à migração para o helper compartilhado de estado de teste.
- E2E simulado da Control UI: use `pnpm test:ui:e2e` para a lane Vitest + Playwright que inicia a Vite Control UI e dirige uma página Chromium real contra um Gateway WebSocket simulado. Os testes ficam em `ui/src/**/*.e2e.test.ts`; mocks e controles compartilhados ficam em `ui/src/test-helpers/control-ui-e2e.ts`. `pnpm test:e2e` inclui esta lane. Em worktrees do Codex, prefira `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` para prova minúscula direcionada depois que as dependências estiverem instaladas, ou Testbox/Crabbox para prova GUI mais ampla.
- Helpers de E2E de processo: use `test/helpers/openclaw-test-instance.ts` quando um teste E2E de nível de processo do Vitest precisar de um Gateway em execução, env de CLI, captura de logs e limpeza em um só lugar.
- Testes TUI PTY: use `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` para a lane PTY rápida com backend falso. Use `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` ou `pnpm tui:pty:test:watch --mode local` para o smoke `tui --local` mais lento, que simula somente o endpoint de modelo externo. Faça asserções sobre texto visível estável ou chamadas de fixture, não snapshots ANSI brutos.
- Helpers Docker/Bash E2E: lanes que fazem source de `scripts/lib/docker-e2e-image.sh` podem passar `docker_e2e_test_state_shell_b64 <label> <scenario>` para o contêiner e decodificá-lo com `scripts/lib/openclaw-e2e-instance.sh`; scripts multi-home podem passar `docker_e2e_test_state_function_b64` e chamar `openclaw_test_state_create <label> <scenario>` em cada fluxo. Chamadores de nível mais baixo podem usar `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` para um snippet de shell dentro do contêiner, ou `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` para um arquivo env do host que pode receber source. O `--` antes de `create` impede runtimes Node mais novos de tratarem `--env-file` como uma flag do Node. Lanes Docker/Bash que iniciam um Gateway podem fazer source de `scripts/lib/openclaw-e2e-instance.sh` dentro do contêiner para resolução de entrypoint, inicialização simulada do OpenAI, inicialização do Gateway em foreground/background, probes de prontidão, exportação de env de estado, dumps de log e limpeza de processos.
- Execuções de shards completas, de extensão e de padrão include atualizam dados de timing locais em `.artifacts/vitest-shard-timings.json`; execuções posteriores de config inteira usam esses timings para equilibrar shards lentos e rápidos. Shards de CI com padrão include acrescentam o nome do shard à chave de timing, o que mantém os timings de shard filtrados visíveis sem substituir dados de timing da config inteira. Defina `OPENCLAW_TEST_PROJECTS_TIMINGS=0` para ignorar o artefato de timing local.
- Arquivos de teste selecionados de `plugin-sdk` e `commands` agora são roteados por lanes leves dedicadas que mantêm apenas `test/setup.ts`, deixando casos pesados de runtime em suas lanes existentes.
- Arquivos-fonte com testes irmãos mapeiam para esse irmão antes de voltar a globs de diretório mais amplos. Edições de helper em `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` e `src/plugins/contracts` usam um grafo de importação local para executar testes importadores em vez de executar amplamente todos os shards quando o caminho de dependência é preciso.
- `auto-reply` agora também é dividido em três configs dedicadas (`core`, `top-level`, `reply`) para que o harness de reply não domine os testes mais leves de status/token/helper de nível superior.
- A config base do Vitest agora usa `pool: "threads"` e `isolate: false` por padrão, com o runner não isolado compartilhado habilitado nas configs do repositório.
- `pnpm test:channels` executa `vitest.channels.config.ts`.
- `pnpm test:extensions` e `pnpm test extensions` executam todos os shards de extensão/Plugin. Plugins de canal pesados, o Plugin de navegador e OpenAI executam como shards dedicados; outros grupos de Plugin permanecem em lote. Use `pnpm test extensions/<id>` para uma lane de Plugin empacotado.
- `pnpm test:perf:imports`: habilita relatórios de duração de importação + detalhamento de importação do Vitest, ainda usando roteamento por lane com escopo para alvos explícitos de arquivo/diretório.
- `pnpm test:perf:imports:changed`: o mesmo profiling de importação, mas somente para arquivos alterados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` faz benchmark do caminho roteado em modo de alterações contra a execução nativa do projeto raiz para o mesmo diff git com commit.
- `pnpm test:perf:changed:bench -- --worktree` faz benchmark do conjunto de alterações da worktree atual sem commit prévio.
- `pnpm test:perf:profile:main`: grava um perfil de CPU para a thread principal do Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: grava perfis de CPU + heap para o runner unitário (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: executa serialmente cada config folha do Vitest da suíte completa e grava dados de duração agrupados, além de artefatos JSON/log por config. O Test Performance Agent usa isto como baseline antes de tentar correções de testes lentos.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: compara relatórios agrupados depois de uma alteração focada em desempenho.
- `pnpm test:docker:timings <summary.json>` inspeciona lanes Docker lentas depois de uma execução Docker completa; use `pnpm test:docker:rerun <run-id|summary.json|failures.json>` para imprimir comandos baratos de reexecução direcionada a partir dos mesmos artefatos.
- Integração do Gateway: opte por participar via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e`: Executa o agregado E2E do repositório: testes smoke end-to-end do Gateway mais a lane E2E de navegador simulado da Control UI.
- `pnpm test:e2e:gateway`: Executa testes smoke end-to-end do Gateway (pareamento multi-instância WS/HTTP/node). Usa `threads` + `isolate: false` por padrão com workers adaptativos em `vitest.e2e.config.ts`; ajuste com `OPENCLAW_E2E_WORKERS=<n>` e defina `OPENCLAW_E2E_VERBOSE=1` para logs verbosos.
- `pnpm test:live`: Executa testes live de provedores (minimax/zai). Requer chaves de API e `LIVE=1` (ou `*_LIVE_TEST=1` específico do provedor) para deixar de pular.
- `pnpm test:docker:all`: Cria a imagem compartilhada de teste ao vivo, empacota o OpenClaw uma vez como um tarball npm, cria/reutiliza uma imagem minimalista de executor Node/Git mais uma imagem funcional que instala esse tarball em `/app`, e então executa faixas de smoke do Docker com `OPENCLAW_SKIP_DOCKER_BUILD=1` por meio de um escalonador ponderado. A imagem minimalista (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) é usada para faixas de instalador/atualização/dependência de Plugin; essas faixas montam o tarball pré-criado em vez de usar fontes copiados do repositório. A imagem funcional (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) é usada para faixas normais de funcionalidade do app criado. `scripts/package-openclaw-for-docker.mjs` é o único empacotador local/de CI e valida o tarball mais `dist/postinstall-inventory.json` antes que o Docker o consuma. As definições de faixas do Docker ficam em `scripts/lib/docker-e2e-scenarios.mjs`; a lógica do planejador fica em `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` executa o plano selecionado. `node scripts/test-docker-all.mjs --plan-json` emite o plano de CI pertencente ao escalonador para faixas selecionadas, tipos de imagem, necessidades de pacote/imagem live, cenários de estado e verificações de credenciais sem criar nem executar o Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` controla os slots de processo e o padrão é 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` controla o pool final sensível a provedor e o padrão é 10. Os limites de faixas pesadas têm como padrão `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; os limites de provedor têm como padrão uma faixa pesada por provedor via `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` e `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Use `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` para hosts maiores. Se uma faixa exceder o limite efetivo de peso ou recurso em um host com baixo paralelismo, ela ainda poderá iniciar a partir de um pool vazio e será executada sozinha até liberar capacidade. Os inícios de faixas são escalonados com 2 segundos por padrão para evitar tempestades de criação no daemon local do Docker; sobrescreva com `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. O executor faz preflight do Docker por padrão, limpa contêineres E2E obsoletos do OpenClaw, emite status de faixas ativas a cada 30 segundos, compartilha caches de ferramentas CLI de provedor entre faixas compatíveis, tenta novamente falhas transitórias de provedores ao vivo uma vez por padrão (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) e armazena tempos de faixas em `.artifacts/docker-tests/lane-timings.json` para ordenação do mais longo primeiro em execuções posteriores. Use `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir o manifesto de faixas sem executar o Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` para ajustar a saída de status ou `OPENCLAW_DOCKER_ALL_TIMINGS=0` para desabilitar a reutilização de tempos. Use `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` somente para faixas determinísticas/locais ou `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` somente para faixas de provedor ao vivo; os aliases de pacote são `pnpm test:docker:local:all` e `pnpm test:docker:live:all`. O modo somente live mescla faixas live principais e finais em um único pool do mais longo primeiro para que buckets de provedor possam empacotar trabalhos Claude, Codex e Gemini juntos. O executor para de escalonar novas faixas agrupadas após a primeira falha, a menos que `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` esteja definido, e cada faixa tem um timeout de fallback de 120 minutos sobrescrevível com `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; faixas live/finais selecionadas usam limites por faixa mais rígidos. Os comandos de configuração do Docker para backend CLI têm seu próprio timeout via `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (padrão 180). Logs por faixa, `summary.json`, `failures.json` e tempos de fase são gravados em `.artifacts/docker-tests/<run-id>/`; use `pnpm test:docker:timings <summary.json>` para inspecionar faixas lentas e `pnpm test:docker:rerun <run-id|summary.json|failures.json>` para imprimir comandos baratos de reexecução direcionada.
- `pnpm test:docker:browser-cdp-snapshot`: Cria um contêiner E2E de fontes com Chromium, inicia CDP bruto mais um Gateway isolado, executa `browser doctor --deep` e verifica se snapshots de função CDP incluem URLs de links, clicáveis promovidos pelo cursor, refs de iframe e metadados de frame.
- `pnpm test:docker:skill-install`: Instala o tarball empacotado do OpenClaw em um executor Docker minimalista, desabilita `skills.install.allowUploadedArchives`, resolve um slug de skill atual a partir da busca live do ClawHub, instala-o por meio de `openclaw skills install` e verifica `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` e `skills info --json`.
- Probes live do backend CLI no Docker podem ser executados como faixas focadas, por exemplo `pnpm test:docker:live-cli-backend:claude`, `pnpm test:docker:live-cli-backend:claude:resume` ou `pnpm test:docker:live-cli-backend:claude:mcp`. Gemini tem aliases correspondentes `:resume` e `:mcp`.
- `pnpm test:docker:openwebui`: Inicia OpenClaw + Open WebUI em Docker, entra pelo Open WebUI, verifica `/api/models` e então executa um chat real com proxy por `/api/chat/completions`. Requer uma chave utilizável de modelo ao vivo, baixa uma imagem externa do Open WebUI e não deve ser tão estável em CI quanto as suítes normais unitárias/e2e.
- `pnpm test:docker:mcp-channels`: Inicia um contêiner Gateway semeado e um segundo contêiner cliente que gera `openclaw mcp serve`; então verifica descoberta de conversas roteadas, leituras de transcrição, metadados de anexo, comportamento da fila de eventos live, roteamento de envio de saída e notificações de canal + permissão no estilo Claude pela ponte stdio real. A asserção de notificação Claude lê diretamente os frames MCP stdio brutos para que o smoke reflita o que a ponte realmente emite.
- `pnpm test:docker:upgrade-survivor`: Instala o tarball empacotado do OpenClaw sobre uma fixture suja de usuário antigo, executa atualização de pacote mais doctor não interativo sem chaves de provedor ao vivo ou canal, então inicia um Gateway de local loopback e verifica se agentes, configuração de canal, allowlists de Plugin, arquivos de workspace/sessão, estado legado obsoleto de dependência de Plugin, inicialização e status RPC sobrevivem.
- `pnpm test:docker:published-upgrade-survivor`: Instala `openclaw@latest` por padrão, semeia arquivos realistas de usuário existente sem chaves de provedor ao vivo ou canal, configura essa baseline com uma receita embutida de comando `openclaw config set`, atualiza essa instalação publicada para o tarball empacotado do OpenClaw, executa doctor não interativo, grava `.artifacts/upgrade-survivor/summary.json`, então inicia um Gateway de local loopback e verifica se intenções configuradas, arquivos de workspace/sessão, configuração obsoleta de Plugin e estado legado de dependência, inicialização, `/healthz`, `/readyz` e status RPC sobrevivem ou são reparados limpidamente. Sobrescreva uma baseline com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, expanda uma matriz local exata com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, como `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, ou adicione fixtures de cenário com `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; o conjunto reported-issues inclui `configured-plugin-installs` para verificar se Plugins externos configurados do OpenClaw são instalados automaticamente durante a atualização e `stale-source-plugin-shadow` para impedir que sombras de Plugin somente de fonte quebrem a inicialização. Package Acceptance expõe isso como `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` e `published_upgrade_survivor_scenarios`, e resolve tokens de meta baseline como `last-stable-4` ou `all-since-2026.4.23` antes de entregar especificações exatas de pacote às faixas Docker.
- `pnpm test:docker:update-migration`: Executa o harness de sobrevivência de atualização publicada no cenário `plugin-deps-cleanup`, pesado em limpeza, começando em `openclaw@2026.4.23` por padrão. O workflow separado `Update Migration` expande essa faixa com `baselines=all-since-2026.4.23` para que todo pacote estável publicado a partir de `.23` seja atualizado para o candidato e comprove a limpeza de dependências de Plugin configuradas fora do Full Release CI.
- `pnpm test:docker:plugins`: Executa smoke de instalação/atualização para caminho local, `file:`, pacotes de registro npm com dependências elevadas, refs móveis de git, fixtures do ClawHub, atualizações de marketplace e habilitação/inspeção do pacote Claude.

## Gate local de PR

Para verificações locais de gate/land de PR, execute:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Se `pnpm test` apresentar flakiness em um host carregado, execute novamente uma vez antes de tratar como regressão, depois isole com `pnpm test <path/to/test>`. Para hosts com restrição de memória, use:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark de latência de modelo (chaves locais)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `pnpm tsx scripts/bench-model.ts --runs 10`
- Env opcional: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt padrão: "Responda com uma única palavra: ok. Sem pontuação ou texto extra."

Última execução (2025-12-31, 20 execuções):

- minimax mediana 1279ms (mín. 1114, máx. 2431)
- opus mediana 2454ms (mín. 1224, máx. 3170)

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

A saída inclui `sampleCount`, média, p50, p95, mín./máx., distribuição de código de saída/sinal e resumos de RSS máximo para cada comando. `--cpu-prof-dir` / `--heap-prof-dir` opcionais gravam perfis V8 por execução, para que a cronometragem e a captura de perfil usem o mesmo harness.

Convenções de saída salva:

- `pnpm test:startup:bench:smoke` grava o artefato de smoke direcionado em `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` grava o artefato da suíte completa em `.artifacts/cli-startup-bench-all.json` usando `runs=5` e `warmup=1`
- `pnpm test:startup:bench:update` atualiza o fixture de baseline versionado em `test/fixtures/cli-startup-bench.json` usando `runs=5` e `warmup=1`

Fixture versionado:

- `test/fixtures/cli-startup-bench.json`
- Atualize com `pnpm test:startup:bench:update`
- Compare os resultados atuais com o fixture usando `pnpm test:startup:bench:check`

## Benchmark de inicialização do Gateway

Script: [`scripts/bench-gateway-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-startup.ts)

O benchmark usa por padrão a entrada da CLI compilada em `dist/entry.js`; execute
`pnpm build` antes de usar os comandos de script do pacote. Para medir o executor
de código-fonte em vez disso, passe `--entry scripts/run-node.mjs` e mantenha esses resultados
separados dos baselines de entrada compilada.

Uso:

- `pnpm test:startup:gateway -- --runs 5 --warmup 1`
- `pnpm test:startup:gateway -- --case default --runs 10 --warmup 1`
- `pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 3 --cpu-prof-dir .artifacts/gateway-startup-cpu`

IDs de caso:

- `default`: inicialização normal do Gateway.
- `skipChannels`: inicialização do Gateway com inicialização de canais ignorada.
- `oneInternalHook`: um hook interno configurado.
- `allInternalHooks`: todos os hooks internos.
- `fiftyPlugins`: 50 plugins de manifesto.
- `fiftyStartupLazyPlugins`: 50 plugins de manifesto com inicialização preguiçosa.

A saída inclui a primeira saída do processo, `/healthz`, `/readyz`, tempo de log de escuta HTTP,
tempo de log de pronto do Gateway, tempo de CPU, proporção de núcleo de CPU, RSS máximo, heap, métricas de trace
de inicialização, atraso do event loop e métricas detalhadas da tabela de lookup de plugins. O script
habilita `OPENCLAW_GATEWAY_STARTUP_TRACE=1` no ambiente do Gateway filho.

Leia `/healthz` como vivacidade: o servidor HTTP consegue responder. Leia `/readyz` como
prontidão utilizável: sidecars de plugins de inicialização, canais e trabalho
pós-anexação crítico para prontidão foram concluídos. Hooks de inicialização do Gateway são despachados
de forma assíncrona e não fazem parte da garantia de prontidão. O tempo de log de pronto é o
timestamp interno de log de pronto do Gateway; ele é útil para atribuição do lado do processo,
mas não substitui a sondagem externa `/readyz`.

Use saída JSON ou `--output` ao comparar mudanças. Use `--cpu-prof-dir` somente
depois que a saída de trace apontar para importação, compilação ou trabalho limitado por CPU que não possa
ser explicado apenas pelos tempos de fase. Não compare resultados do executor de código-fonte com
resultados de `dist/entry.js` compilado como o mesmo baseline.

## Benchmark de reinicialização do Gateway

Script: [`scripts/bench-gateway-restart.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-restart.ts)

O benchmark de reinicialização é compatível apenas com macOS e Linux. Ele usa SIGUSR1 para
reinicializações dentro do processo e falha imediatamente no Windows.

O benchmark usa por padrão a entrada da CLI compilada em `dist/entry.js`; execute
`pnpm build` antes de usar os comandos de script do pacote. Para medir o executor
de código-fonte em vez disso, passe `--entry scripts/run-node.mjs` e mantenha esses resultados
separados dos baselines de entrada compilada.

Uso:

- `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`
- `pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1`
- `pnpm test:restart:gateway -- --case skipChannelsAcpxProbe --case skipChannelsNoAcpxProbe --runs 1 --restarts 5`
- `node --import tsx scripts/bench-gateway-restart.ts --case fiftyPlugins --runs 1 --restarts 5 --output .artifacts/gateway-restart.json`
- `node --import tsx scripts/bench-gateway-restart.ts --json`

IDs de caso:

- `skipChannels`: reinicialização com canais ignorados.
- `skipChannelsAcpxProbe`: reinicialização com canais ignorados e sonda de inicialização ACPX ativada.
- `skipChannelsNoAcpxProbe`: reinicialização com canais ignorados e sonda de inicialização ACPX desativada.
- `default`: reinicialização normal.
- `fiftyPlugins`: reinicialização com 50 plugins de manifesto.

A saída inclui o próximo `/healthz`, próximo `/readyz`, tempo de inatividade, tempo de prontidão da reinicialização,
CPU, RSS, métricas de trace de inicialização para o processo substituto e métricas de trace de reinicialização
para tratamento de sinal, drenagem de trabalho ativo, fases de fechamento, próxima inicialização, tempo de
prontidão e snapshots de memória. O script habilita
`OPENCLAW_GATEWAY_STARTUP_TRACE=1` e `OPENCLAW_GATEWAY_RESTART_TRACE=1` no
ambiente do Gateway filho.

Use este benchmark quando uma mudança tocar sinalização de reinicialização, handlers de fechamento,
inicialização após reinicialização, encerramento de sidecar, transferência de serviço ou prontidão após
reinicialização. Comece com `skipChannels` ao isolar a mecânica do Gateway da inicialização de canais. Use `default` ou casos com muitos plugins somente depois que o caso estreito explicar
o caminho de reinicialização.

Métricas de trace são dicas de atribuição, não vereditos. Uma mudança de reinicialização deve ser
julgada a partir de várias amostras, o intervalo de proprietário correspondente, comportamento de `/healthz` e `/readyz`
e o contrato de reinicialização visível ao usuário.

## E2E de onboarding (Docker)

Docker é opcional; isto só é necessário para testes de smoke de onboarding em contêiner.

Fluxo completo de inicialização a frio em um contêiner Linux limpo:

```bash
scripts/e2e/onboard-docker.sh
```

Este script conduz o assistente interativo por meio de um pseudo-tty, verifica arquivos de config/workspace/session, depois inicia o gateway e executa `openclaw health`.

## Smoke de importação de QR (Docker)

Garante que o helper de runtime de QR mantido seja carregado nos runtimes Node do Docker compatíveis (Node 24 padrão, Node 22 compatível):

```bash
pnpm test:docker:qr
```

## Relacionados

- [Testes](/pt-BR/help/testing)
- [Testes live](/pt-BR/help/testing-live)
- [Testes de atualizações e plugins](/pt-BR/help/testing-updates-plugins)
