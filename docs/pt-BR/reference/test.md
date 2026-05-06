---
read_when:
    - Executando ou corrigindo testes
summary: Como executar testes localmente (vitest) e quando usar os modos force/coverage
title: Testes
x-i18n:
    generated_at: "2026-05-06T09:12:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 794589ee8362795c949626203e8129d6a8bb1d2e5ccf9a18f0d9b4bbd347156e
    source_path: reference/test.md
    workflow: 16
---

- Kit completo de testes (suítes, ao vivo, Docker): [Testes](/pt-BR/help/testing)
- Validação de atualizações e pacotes de plugins: [Testando atualizações e plugins](/pt-BR/help/testing-updates-plugins)

- `pnpm test:force`: Encerra qualquer processo de Gateway remanescente que esteja ocupando a porta de controle padrão e, em seguida, executa a suíte Vitest completa com uma porta de Gateway isolada para que os testes de servidor não entrem em conflito com uma instância em execução. Use isto quando uma execução anterior do Gateway deixou a porta 18789 ocupada.
- `pnpm test:coverage`: Executa a suíte unitária com cobertura V8 (via `vitest.unit.config.ts`). Este é um gate de cobertura da lane unitária padrão, não cobertura de todos os arquivos do repositório inteiro. Os limites são 70% para linhas/funções/instruções e 55% para branches. Como `coverage.all` é false e a lane padrão escopa as inclusões de cobertura para testes unitários não rápidos com arquivos-fonte irmãos, o gate mede o código-fonte pertencente a esta lane em vez de cada importação transitiva que ele por acaso carrega.
- `pnpm test:coverage:changed`: Executa cobertura unitária somente para arquivos alterados desde `origin/main`.
- `pnpm test:changed`: execução barata e inteligente de testes alterados. Ela executa alvos precisos a partir de edições diretas de testes, arquivos `*.test.ts` irmãos, mapeamentos explícitos de código-fonte e o grafo de importação local. Alterações amplas/de configuração/de pacote são ignoradas a menos que mapeiem para testes precisos.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: execução ampla explícita de testes alterados. Use quando uma edição em harness de teste/configuração/pacote deve recorrer ao comportamento mais amplo de testes alterados do Vitest.
- `pnpm changed:lanes`: mostra as lanes arquiteturais acionadas pelo diff contra `origin/main`.
- `pnpm check:changed`: executa o gate inteligente de verificação de alterações para o diff contra `origin/main`. Ele executa typecheck, lint e comandos de guarda para as lanes arquiteturais afetadas, mas não executa testes Vitest. Use `pnpm test:changed` ou `pnpm test <target>` explícito para prova de teste.
- `pnpm test`: roteia alvos explícitos de arquivo/diretório por lanes Vitest escopadas. Execuções sem alvo usam grupos de shards fixos e se expandem para configurações folha para execução paralela local; o grupo de extensões sempre se expande para as configurações de shard por extensão em vez de um processo gigante de projeto raiz.
- Execuções do wrapper de testes terminam com um resumo curto `[test] passed|failed|skipped ... in ...`. A linha de duração própria do Vitest permanece como detalhe por shard.
- Estado de teste compartilhado do OpenClaw: use `src/test-utils/openclaw-test-state.ts` a partir do Vitest quando um teste precisar de `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture de configuração, workspace, diretório de agente ou armazenamento de perfis de autenticação isolados.
- Helpers de E2E de processo: use `test/helpers/openclaw-test-instance.ts` quando um teste E2E em nível de processo do Vitest precisar de um Gateway em execução, env de CLI, captura de logs e limpeza em um só lugar.
- Helpers de E2E Docker/Bash: lanes que fazem source de `scripts/lib/docker-e2e-image.sh` podem passar `docker_e2e_test_state_shell_b64 <label> <scenario>` para dentro do contêiner e decodificá-lo com `scripts/lib/openclaw-e2e-instance.sh`; scripts multi-home podem passar `docker_e2e_test_state_function_b64` e chamar `openclaw_test_state_create <label> <scenario>` em cada fluxo. Chamadores de nível mais baixo podem usar `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` para um snippet de shell dentro do contêiner, ou `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` para um arquivo env do host que possa receber source. O `--` antes de `create` impede runtimes Node mais novos de tratarem `--env-file` como uma flag do Node. Lanes Docker/Bash que iniciam um Gateway podem fazer source de `scripts/lib/openclaw-e2e-instance.sh` dentro do contêiner para resolução de entrypoint, inicialização de OpenAI simulado, lançamento do Gateway em foreground/background, probes de prontidão, exportação de env de estado, dumps de logs e limpeza de processo.
- Execuções de shards completos, de extensão e de padrões de inclusão atualizam dados locais de timing em `.artifacts/vitest-shard-timings.json`; execuções posteriores de configuração inteira usam esses timings para equilibrar shards lentos e rápidos. Shards de CI com padrões de inclusão acrescentam o nome do shard à chave de timing, o que mantém os timings de shards filtrados visíveis sem substituir os dados de timing da configuração inteira. Defina `OPENCLAW_TEST_PROJECTS_TIMINGS=0` para ignorar o artefato local de timing.
- Arquivos de teste selecionados de `plugin-sdk` e `commands` agora são roteados por lanes leves dedicadas que mantêm apenas `test/setup.ts`, deixando casos pesados de runtime em suas lanes existentes.
- Arquivos-fonte com testes irmãos mapeiam para esse irmão antes de recorrer a globs de diretório mais amplos. Edições de helpers em `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` e `src/plugins/contracts` usam um grafo de importação local para executar testes importadores em vez de rodar amplamente todos os shards quando o caminho de dependência é preciso.
- `auto-reply` agora também se divide em três configurações dedicadas (`core`, `top-level`, `reply`) para que o harness de resposta não domine os testes mais leves de status/token/helper de nível superior.
- A configuração base do Vitest agora usa por padrão `pool: "threads"` e `isolate: false`, com o runner não isolado compartilhado habilitado nas configurações do repositório.
- `pnpm test:channels` executa `vitest.channels.config.ts`.
- `pnpm test:extensions` e `pnpm test extensions` executam todos os shards de extensões/Plugins. Plugins de canal pesados, o Plugin de navegador e o OpenAI executam como shards dedicados; outros grupos de Plugins permanecem em lote. Use `pnpm test extensions/<id>` para uma lane de um Plugin empacotado.
- `pnpm test:perf:imports`: habilita relatórios de duração de importação + decomposição de importações do Vitest, enquanto ainda usa roteamento de lanes escopadas para alvos explícitos de arquivo/diretório.
- `pnpm test:perf:imports:changed`: o mesmo perfilamento de importação, mas somente para arquivos alterados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` faz benchmark do caminho roteado em modo alterado contra a execução nativa do projeto raiz para o mesmo diff git commitado.
- `pnpm test:perf:changed:bench -- --worktree` faz benchmark do conjunto de alterações da worktree atual sem fazer commit antes.
- `pnpm test:perf:profile:main`: grava um perfil de CPU para a thread principal do Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: grava perfis de CPU + heap para o runner unitário (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: executa serialmente cada configuração folha Vitest da suíte completa e grava dados de duração agrupados, além de artefatos JSON/log por configuração. O Test Performance Agent usa isto como baseline antes de tentar correções de testes lentos.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: compara relatórios agrupados após uma alteração focada em desempenho.
- Integração do Gateway: opt-in via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e`: Executa testes smoke end-to-end do Gateway (pareamento multi-instância WS/HTTP/node). O padrão é `threads` + `isolate: false` com workers adaptativos em `vitest.e2e.config.ts`; ajuste com `OPENCLAW_E2E_WORKERS=<n>` e defina `OPENCLAW_E2E_VERBOSE=1` para logs verbosos.
- `pnpm test:live`: Executa testes live de provider (minimax/zai). Exige chaves de API e `LIVE=1` (ou `*_LIVE_TEST=1` específico do provider) para deixar de ignorar.
- `pnpm test:docker:all`: Compila a imagem compartilhada de teste live, empacota o OpenClaw uma vez como um tarball npm, compila/reutiliza uma imagem runner básica Node/Git mais uma imagem funcional que instala esse tarball em `/app` e, em seguida, executa lanes smoke do Docker com `OPENCLAW_SKIP_DOCKER_BUILD=1` por meio de um scheduler ponderado. A imagem básica (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) é usada para lanes de instalador/atualização/dependência de Plugin; essas lanes montam o tarball pré-compilado em vez de usar fontes copiadas do repositório. A imagem funcional (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) é usada para lanes normais de funcionalidade do app compilado. `scripts/package-openclaw-for-docker.mjs` é o empacotador único local/CI e valida o tarball mais `dist/postinstall-inventory.json` antes de o Docker consumi-lo. As definições de lane do Docker ficam em `scripts/lib/docker-e2e-scenarios.mjs`; a lógica do planner fica em `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` executa o plano selecionado. `node scripts/test-docker-all.mjs --plan-json` emite o plano de CI pertencente ao scheduler para lanes selecionadas, tipos de imagem, necessidades de pacote/imagem live, cenários de estado e verificações de credenciais sem compilar nem executar Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` controla slots de processo e tem padrão 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` controla o pool tail sensível a providers e tem padrão 10. Caps de lanes pesadas usam por padrão `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; caps de provider usam por padrão uma lane pesada por provider via `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` e `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Use `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` para hosts maiores. Se uma lane exceder o peso efetivo ou o cap de recurso em um host de baixa paralelização, ela ainda pode iniciar a partir de um pool vazio e executará sozinha até liberar capacidade. Inícios de lane são escalonados com 2 segundos por padrão para evitar tempestades de criação no daemon Docker local; substitua com `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. O runner faz preflight do Docker por padrão, limpa contêineres E2E obsoletos do OpenClaw, emite status de lanes ativas a cada 30 segundos, compartilha caches de ferramentas CLI de providers entre lanes compatíveis, tenta novamente falhas transitórias de providers live uma vez por padrão (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) e armazena timings de lane em `.artifacts/docker-tests/lane-timings.json` para ordenação longest-first em execuções posteriores. Use `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir o manifesto de lanes sem executar Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` para ajustar a saída de status, ou `OPENCLAW_DOCKER_ALL_TIMINGS=0` para desabilitar a reutilização de timings. Use `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` apenas para lanes determinísticas/locais ou `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` apenas para lanes de providers live; aliases de pacote são `pnpm test:docker:local:all` e `pnpm test:docker:live:all`. O modo somente live mescla lanes live principais e tail em um único pool longest-first para que buckets de provider possam empacotar trabalho de Claude, Codex e Gemini em conjunto. O runner para de agendar novas lanes em pool após a primeira falha, a menos que `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` esteja definido, e cada lane tem um timeout fallback de 120 minutos substituível com `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; lanes live/tail selecionadas usam caps por lane mais apertados. Comandos de configuração Docker de backend CLI têm seu próprio timeout via `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (padrão 180). Logs por lane, `summary.json`, `failures.json` e timings de fases são gravados em `.artifacts/docker-tests/<run-id>/`; use `pnpm test:docker:timings <summary.json>` para inspecionar lanes lentas e `pnpm test:docker:rerun <run-id|summary.json|failures.json>` para imprimir comandos baratos de reexecução direcionada.
- `pnpm test:docker:browser-cdp-snapshot`: Compila um contêiner E2E de fonte com Chromium, inicia CDP bruto mais um Gateway isolado, executa `browser doctor --deep` e verifica que snapshots de função CDP incluem URLs de links, clicáveis promovidos por cursor, refs de iframe e metadados de frame.
- Probes Docker live de backend CLI podem ser executados como lanes focadas, por exemplo `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` ou `pnpm test:docker:live-cli-backend:codex:mcp`. Claude e Gemini têm aliases `:resume` e `:mcp` correspondentes.
- `pnpm test:docker:openwebui`: Inicia OpenClaw + Open WebUI dockerizados, faz login pelo Open WebUI, verifica `/api/models` e, em seguida, executa um chat real com proxy por `/api/chat/completions`. Exige uma chave de modelo live utilizável (por exemplo OpenAI em `~/.profile`), baixa uma imagem externa do Open WebUI e não se espera que seja estável em CI como as suítes unit/e2e normais.
- `pnpm test:docker:mcp-channels`: Inicia um contêiner de Gateway semeado e um segundo contêiner cliente que gera `openclaw mcp serve`, depois verifica a descoberta de conversas roteadas, leituras de transcrição, metadados de anexos, comportamento da fila de eventos em tempo real, roteamento de envio de saída e notificações de canal + permissões em estilo Claude pela ponte stdio real. A asserção de notificação do Claude lê diretamente os quadros MCP stdio brutos, para que o smoke reflita o que a ponte realmente emite.
- `pnpm test:docker:upgrade-survivor`: Instala o tarball empacotado do OpenClaw sobre uma fixture suja de usuário antigo, executa atualização de pacote mais doctor não interativo sem chaves de provedor ou canal em tempo real, depois inicia um Gateway de loopback e verifica se agentes, configuração de canal, listas de permissão de Plugin, arquivos de workspace/sessão, estado obsoleto de dependências de Plugin legado, inicialização e status RPC sobrevivem.
- `pnpm test:docker:published-upgrade-survivor`: Instala `openclaw@latest` por padrão, semeia arquivos realistas de usuário existente sem chaves de provedor ou canal em tempo real, configura essa linha de base com uma receita embutida de comando `openclaw config set`, atualiza essa instalação publicada para o tarball empacotado do OpenClaw, executa doctor não interativo, grava `.artifacts/upgrade-survivor/summary.json`, depois inicia um Gateway de loopback e verifica se intents configuradas, arquivos de workspace/sessão, configuração obsoleta de Plugin e estado de dependências legadas, inicialização, `/healthz`, `/readyz` e status RPC sobrevivem ou são reparados corretamente. Substitua uma linha de base com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, expanda uma matriz local exata com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, como `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, ou adicione fixtures de cenário com `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; o conjunto reported-issues inclui `configured-plugin-installs` para verificar se Plugins externos configurados do OpenClaw são instalados automaticamente durante a atualização e `stale-source-plugin-shadow` para impedir que sombras de Plugin somente de código-fonte quebrem a inicialização. Package Acceptance expõe essas opções como `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` e `published_upgrade_survivor_scenarios`, e resolve tokens de metadados de linha de base, como `last-stable-4` ou `all-since-2026.4.23`, antes de entregar especificações exatas de pacote às lanes Docker.
- `pnpm test:docker:update-migration`: Executa o harness de sobrevivência de atualização publicada no cenário `plugin-deps-cleanup`, intensivo em limpeza, começando em `openclaw@2026.4.23` por padrão. O workflow separado `Update Migration` expande esta lane com `baselines=all-since-2026.4.23`, para que cada pacote estável publicado a partir de `.23` seja atualizado para o candidato e comprove a limpeza de dependências de Plugin configuradas fora da Full Release CI.
- `pnpm test:docker:plugins`: Executa smoke de instalação/atualização para caminho local, `file:`, pacotes do registro npm com dependências içadas, refs móveis de git, fixtures do ClawHub, atualizações de marketplace e habilitação/inspeção do pacote Claude.

## Gate local de PR

Para verificações locais de land/gate de PR, execute:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Se `pnpm test` apresentar flakiness em um host carregado, execute novamente uma vez antes de tratar como regressão; depois, isole com `pnpm test <path/to/test>`. Para hosts com restrição de memória, use:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark de latência de modelo (chaves locais)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env opcional: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt padrão: "Responda com uma única palavra: ok. Sem pontuação nem texto extra."

Última execução (2025-12-31, 20 execuções):

- mediana minimax 1279ms (mín. 1114, máx. 2431)
- mediana opus 2454ms (mín. 1224, máx. 3170)

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

A saída inclui `sampleCount`, média, p50, p95, mín./máx., distribuição de código de saída/sinal e resumos de RSS máximo para cada comando. Opcionalmente, `--cpu-prof-dir` / `--heap-prof-dir` grava perfis V8 por execução, para que a medição de tempo e a captura de perfil usem o mesmo harness.

Convenções de saída salva:

- `pnpm test:startup:bench:smoke` grava o artefato de smoke direcionado em `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` grava o artefato da suíte completa em `.artifacts/cli-startup-bench-all.json` usando `runs=5` e `warmup=1`
- `pnpm test:startup:bench:update` atualiza a fixture de baseline versionada em `test/fixtures/cli-startup-bench.json` usando `runs=5` e `warmup=1`

Fixture versionada:

- `test/fixtures/cli-startup-bench.json`
- Atualize com `pnpm test:startup:bench:update`
- Compare os resultados atuais com a fixture usando `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker é opcional; isto só é necessário para testes smoke de onboarding em contêiner.

Fluxo completo de cold start em um contêiner Linux limpo:

```bash
scripts/e2e/onboard-docker.sh
```

Este script conduz o assistente interativo por meio de um pseudo-tty, verifica arquivos de configuração/workspace/sessão, depois inicia o Gateway e executa `openclaw health`.

## Smoke de importação de QR (Docker)

Garante que o helper mantido de runtime de QR seja carregado nos runtimes Docker Node compatíveis (Node 24 por padrão, Node 22 compatível):

```bash
pnpm test:docker:qr
```

## Relacionado

- [Testes](/pt-BR/help/testing)
- [Testes live](/pt-BR/help/testing-live)
- [Testes de atualizações e plugins](/pt-BR/help/testing-updates-plugins)
