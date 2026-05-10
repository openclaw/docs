---
read_when:
    - Executar ou corrigir testes
summary: Como executar testes localmente (vitest) e quando usar os modos forçado e de cobertura
title: Testes
x-i18n:
    generated_at: "2026-05-10T19:49:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: be939951f186df407aca8b3e4abbdbbd50f2f87c538c28c91745f9c6833df0d7
    source_path: reference/test.md
    workflow: 16
---

- Kit completo de testes (suítes, ao vivo, Docker): [Testes](/pt-BR/help/testing)
- Validação de atualizações e pacotes de Plugin: [Testando atualizações e plugins](/pt-BR/help/testing-updates-plugins)

- `pnpm test:force`: Encerra qualquer processo persistente do Gateway que esteja ocupando a porta de controle padrão e, em seguida, executa toda a suíte Vitest com uma porta de Gateway isolada para que os testes de servidor não colidam com uma instância em execução. Use isso quando uma execução anterior do Gateway tiver deixado a porta 18789 ocupada.
- `pnpm test:coverage`: Executa a suíte unitária com cobertura V8 (via `vitest.unit.config.ts`). Este é um gate de cobertura da lane unitária padrão, não cobertura de todos os arquivos do repositório inteiro. Os limites são 70% para linhas/funções/instruções e 55% para branches. Como `coverage.all` é falso e os escopos da lane padrão incluem cobertura para testes unitários não rápidos com arquivos-fonte irmãos, o gate mede o código-fonte pertencente a esta lane em vez de cada importação transitiva que por acaso ele carrega.
- `pnpm test:coverage:changed`: Executa cobertura unitária somente para arquivos alterados desde `origin/main`.
- `pnpm test:changed`: execução barata e inteligente de testes alterados. Ela executa alvos precisos a partir de edições diretas em testes, arquivos irmãos `*.test.ts`, mapeamentos explícitos de código-fonte e o grafo de importação local. Alterações amplas/de configuração/de pacote são ignoradas, a menos que mapeiem para testes precisos.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: execução ampla explícita de testes alterados. Use quando uma edição em harness/configuração/pacote de teste deve recorrer ao comportamento mais amplo de testes alterados do Vitest.
- `pnpm changed:lanes`: mostra as lanes arquiteturais acionadas pelo diff em relação a `origin/main`.
- `pnpm check:changed`: executa o gate inteligente de verificação de alterações para o diff em relação a `origin/main`. Ele executa comandos de typecheck, lint e guard para as lanes arquiteturais afetadas, mas não executa testes Vitest. Use `pnpm test:changed` ou `pnpm test <target>` explícito como prova de teste.
- `pnpm test`: roteia alvos explícitos de arquivo/diretório por lanes Vitest com escopo. Execuções sem alvo usam grupos fixos de shards e expandem para configurações folha para execução paralela local; o grupo de extensões sempre expande para as configurações de shard por extensão, em vez de um único processo gigante de projeto raiz.
- As execuções do wrapper de teste terminam com um resumo curto `[test] passed|failed|skipped ... in ...`. A linha de duração própria do Vitest permanece como detalhe por shard.
- Estado de teste compartilhado do OpenClaw: use `src/test-utils/openclaw-test-state.ts` a partir do Vitest quando um teste precisar de `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture de configuração, workspace, diretório de agente ou armazenamento de perfis de autenticação isolados.
- Helpers de E2E de processo: use `test/helpers/openclaw-test-instance.ts` quando um teste E2E em nível de processo do Vitest precisar de um Gateway em execução, ambiente de CLI, captura de logs e limpeza em um só lugar.
- Helpers de E2E Docker/Bash: lanes que carregam `scripts/lib/docker-e2e-image.sh` podem passar `docker_e2e_test_state_shell_b64 <label> <scenario>` para dentro do contêiner e decodificá-lo com `scripts/lib/openclaw-e2e-instance.sh`; scripts com múltiplos homes podem passar `docker_e2e_test_state_function_b64` e chamar `openclaw_test_state_create <label> <scenario>` em cada fluxo. Chamadores de nível mais baixo podem usar `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` para um snippet de shell dentro do contêiner, ou `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` para um arquivo de ambiente do host carregável por `source`. O `--` antes de `create` impede que runtimes Node mais novos tratem `--env-file` como uma flag do Node. Lanes Docker/Bash que iniciam um Gateway podem carregar `scripts/lib/openclaw-e2e-instance.sh` dentro do contêiner para resolução de entrypoint, inicialização mock da OpenAI, inicialização do Gateway em primeiro plano/segundo plano, probes de prontidão, exportação de ambiente de estado, despejos de logs e limpeza de processos.
- Execuções completas, de extensões e de shards com padrão de inclusão atualizam dados de temporização locais em `.artifacts/vitest-shard-timings.json`; execuções posteriores de configuração inteira usam esses tempos para balancear shards lentos e rápidos. Shards de CI com padrão de inclusão acrescentam o nome do shard à chave de temporização, o que mantém os tempos de shards filtrados visíveis sem substituir dados de temporização da configuração inteira. Defina `OPENCLAW_TEST_PROJECTS_TIMINGS=0` para ignorar o artefato local de temporização.
- Arquivos de teste selecionados de `plugin-sdk` e `commands` agora passam por lanes leves dedicadas que mantêm apenas `test/setup.ts`, deixando casos pesados de runtime em suas lanes existentes.
- Arquivos-fonte com testes irmãos mapeiam para esse irmão antes de recorrer a globs de diretório mais amplos. Edições de helpers em `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` e `src/plugins/contracts` usam um grafo de importação local para executar testes que importam esses helpers, em vez de executar amplamente todos os shards quando o caminho da dependência é preciso.
- `auto-reply` agora também se divide em três configurações dedicadas (`core`, `top-level`, `reply`) para que o harness de resposta não domine os testes mais leves de status/token/helper de nível superior.
- A configuração base do Vitest agora usa por padrão `pool: "threads"` e `isolate: false`, com o runner compartilhado não isolado habilitado nas configurações do repositório.
- `pnpm test:channels` executa `vitest.channels.config.ts`.
- `pnpm test:extensions` e `pnpm test extensions` executam todos os shards de extensão/Plugin. Plugins pesados de canal, o Plugin de navegador e a OpenAI executam como shards dedicados; outros grupos de Plugin permanecem em lotes. Use `pnpm test extensions/<id>` para uma lane de um Plugin empacotado.
- `pnpm test:perf:imports`: habilita relatórios de duração de importação e detalhamento de importação do Vitest, enquanto ainda usa roteamento de lanes com escopo para alvos explícitos de arquivo/diretório.
- `pnpm test:perf:imports:changed`: o mesmo profiling de importação, mas somente para arquivos alterados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` mede o desempenho do caminho roteado em modo alterado em relação à execução nativa do projeto raiz para o mesmo diff git commitado.
- `pnpm test:perf:changed:bench -- --worktree` mede o desempenho do conjunto de alterações atual da worktree sem commitá-lo primeiro.
- `pnpm test:perf:profile:main`: grava um perfil de CPU para a thread principal do Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: grava perfis de CPU + heap para o runner unitário (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: executa serialmente todas as configurações folha do Vitest da suíte completa e grava dados de duração agrupados mais artefatos JSON/log por configuração. O Test Performance Agent usa isso como baseline antes de tentar correções de testes lentos.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: compara relatórios agrupados após uma alteração focada em desempenho.
- Integração do Gateway: habilitação opcional via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e`: Executa testes smoke de ponta a ponta do Gateway (pareamento multi-instância WS/HTTP/node). O padrão é `threads` + `isolate: false` com workers adaptativos em `vitest.e2e.config.ts`; ajuste com `OPENCLAW_E2E_WORKERS=<n>` e defina `OPENCLAW_E2E_VERBOSE=1` para logs detalhados.
- `pnpm test:live`: Executa testes live de provedores (minimax/zai). Requer chaves de API e `LIVE=1` (ou `*_LIVE_TEST=1` específico do provedor) para deixar de ignorar.
- `pnpm test:docker:all`: Cria a imagem compartilhada de testes live, empacota o OpenClaw uma vez como um tarball npm, cria/reutiliza uma imagem runner básica Node/Git mais uma imagem funcional que instala esse tarball em `/app`, e então executa lanes smoke Docker com `OPENCLAW_SKIP_DOCKER_BUILD=1` por meio de um escalonador ponderado. A imagem básica (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) é usada para lanes de instalador/atualização/dependência de Plugin; essas lanes montam o tarball pré-construído em vez de usar fontes copiadas do repositório. A imagem funcional (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) é usada para lanes normais de funcionalidade do aplicativo construído. `scripts/package-openclaw-for-docker.mjs` é o empacotador único local/CI e valida o tarball mais `dist/postinstall-inventory.json` antes que o Docker o consuma. As definições de lanes Docker ficam em `scripts/lib/docker-e2e-scenarios.mjs`; a lógica do planejador fica em `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` executa o plano selecionado. `node scripts/test-docker-all.mjs --plan-json` emite o plano de CI controlado pelo escalonador para lanes selecionadas, tipos de imagem, necessidades de pacote/imagem live, cenários de estado e verificações de credenciais sem construir nem executar Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` controla slots de processo e o padrão é 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` controla o pool final sensível a provedores e o padrão é 10. Os limites de lanes pesadas usam por padrão `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; os limites de provedor usam por padrão uma lane pesada por provedor via `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` e `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Use `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` para hosts maiores. Se uma lane exceder o limite efetivo de peso ou recurso em um host com baixo paralelismo, ela ainda pode iniciar a partir de um pool vazio e será executada sozinha até liberar capacidade. Os inícios de lanes são espaçados em 2 segundos por padrão para evitar tempestades locais de criação no daemon Docker; sobrescreva com `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. O runner faz preflight do Docker por padrão, limpa contêineres E2E obsoletos do OpenClaw, emite status de lanes ativas a cada 30 segundos, compartilha caches de ferramentas de CLI de provedores entre lanes compatíveis, tenta novamente uma vez por padrão falhas transitórias de provedores live (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) e armazena temporizações de lanes em `.artifacts/docker-tests/lane-timings.json` para ordenação do mais longo primeiro em execuções posteriores. Use `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir o manifesto de lanes sem executar Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` para ajustar a saída de status ou `OPENCLAW_DOCKER_ALL_TIMINGS=0` para desabilitar o reaproveitamento de temporizações. Use `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` somente para lanes determinísticas/locais ou `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` somente para lanes de provedores live; aliases de pacote são `pnpm test:docker:local:all` e `pnpm test:docker:live:all`. O modo somente live mescla lanes live principais e finais em um único pool do mais longo primeiro para que buckets de provedor possam agrupar trabalhos de Claude, Codex e Gemini juntos. O runner para de escalonar novas lanes em pool após a primeira falha, a menos que `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` esteja definido, e cada lane tem um timeout fallback de 120 minutos sobrescrevível com `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; lanes live/finais selecionadas usam limites por lane mais rígidos. Comandos de configuração Docker de backend de CLI têm seu próprio timeout via `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (padrão 180). Logs por lane, `summary.json`, `failures.json` e temporizações de fases são gravados em `.artifacts/docker-tests/<run-id>/`; use `pnpm test:docker:timings <summary.json>` para inspecionar lanes lentas e `pnpm test:docker:rerun <run-id|summary.json|failures.json>` para imprimir comandos baratos de reexecução direcionada.
- `pnpm test:docker:browser-cdp-snapshot`: Cria um contêiner E2E de origem com Chromium, inicia CDP bruto mais um Gateway isolado, executa `browser doctor --deep` e verifica que snapshots de papel CDP incluem URLs de links, clicáveis promovidos por cursor, refs de iframe e metadados de frame.
- `pnpm test:docker:skill-install`: Instala o tarball empacotado do OpenClaw em um runner Docker básico, desabilita `skills.install.allowUploadedArchives`, resolve um slug atual de skill a partir da busca live do ClawHub, instala-o por meio de `openclaw skills install` e verifica `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` e `skills info --json`.
- Probes live Docker de backend de CLI podem ser executados como lanes focadas, por exemplo `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` ou `pnpm test:docker:live-cli-backend:codex:mcp`. Claude e Gemini têm aliases correspondentes `:resume` e `:mcp`.
- `pnpm test:docker:openwebui`: Inicia OpenClaw + Open WebUI em Docker, faz login pelo Open WebUI, verifica `/api/models` e então executa um chat real com proxy por `/api/chat/completions`. Requer uma chave de modelo live utilizável (por exemplo, OpenAI em `~/.profile`), baixa uma imagem externa do Open WebUI e não se espera que seja estável em CI como as suítes unitárias/e2e normais.
- `pnpm test:docker:mcp-channels`: Inicia um contêiner Gateway semeado e um segundo contêiner cliente que gera `openclaw mcp serve`, depois verifica a descoberta de conversas roteadas, leituras de transcrições, metadados de anexos, comportamento da fila de eventos ao vivo, roteamento de envio de saída e notificações de canal + permissão no estilo Claude pela ponte stdio real. A asserção de notificação do Claude lê os quadros MCP stdio brutos diretamente, para que o smoke reflita o que a ponte realmente emite.
- `pnpm test:docker:upgrade-survivor`: Instala o tarball empacotado do OpenClaw sobre uma fixture suja de usuário antigo, executa atualização de pacote mais doctor não interativo sem chaves de provedor ou canal ao vivo, depois inicia um Gateway loopback e verifica se agentes, configuração de canal, listas de permissões de plugins, arquivos de workspace/sessão, estado obsoleto de dependência de plugin legado, inicialização e status RPC sobrevivem.
- `pnpm test:docker:published-upgrade-survivor`: Instala `openclaw@latest` por padrão, semeia arquivos realistas de usuário existente sem chaves de provedor ou canal ao vivo, configura essa linha de base com uma receita embutida de comando `openclaw config set`, atualiza essa instalação publicada para o tarball empacotado do OpenClaw, executa doctor não interativo, grava `.artifacts/upgrade-survivor/summary.json`, depois inicia um Gateway loopback e verifica se intents configurados, arquivos de workspace/sessão, configuração obsoleta de plugin e estado de dependência legada, inicialização, `/healthz`, `/readyz` e status RPC sobrevivem ou são reparados corretamente. Substitua uma linha de base com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, expanda uma matriz local exata com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, como `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, ou adicione fixtures de cenário com `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; o conjunto reported-issues inclui `configured-plugin-installs` para verificar se plugins externos configurados do OpenClaw são instalados automaticamente durante a atualização e `stale-source-plugin-shadow` para impedir que sombras de plugins somente de origem quebrem a inicialização. Package Acceptance expõe esses itens como `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` e `published_upgrade_survivor_scenarios`, e resolve tokens de linha de base meta, como `last-stable-4` ou `all-since-2026.4.23`, antes de entregar especificações exatas de pacote às lanes Docker.
- `pnpm test:docker:update-migration`: Executa o harness published-upgrade survivor no cenário `plugin-deps-cleanup`, com limpeza pesada, começando em `openclaw@2026.4.23` por padrão. O workflow separado `Update Migration` expande esta lane com `baselines=all-since-2026.4.23`, para que todos os pacotes estáveis publicados a partir de `.23` atualizem para o candidato e comprovem a limpeza de dependências de plugins configurados fora do Full Release CI.
- `pnpm test:docker:plugins`: Executa smoke de instalação/atualização para caminho local, `file:`, pacotes do registro npm com dependências içadas, refs móveis do git, fixtures do ClawHub, atualizações de marketplace e habilitação/inspeção do pacote Claude.

## Gate local de PR

Para verificações locais de landing/gate de PR, execute:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Se `pnpm test` apresentar flakiness em um host sob carga, execute novamente uma vez antes de tratar isso como regressão; depois, isole com `pnpm test <path/to/test>`. Para hosts com restrição de memória, use:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark de latência de modelo (chaves locais)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env opcional: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt padrão: "Responda com uma única palavra: ok. Sem pontuação nem texto extra."

Última execução (2025-12-31, 20 execuções):

- minimax mediana 1279ms (mín 1114, máx 2431)
- opus mediana 2454ms (mín 1224, máx 3170)

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

A saída inclui `sampleCount`, média, p50, p95, mín/máx, distribuição de exit-code/signal e resumos de RSS máximo para cada comando. Os opcionais `--cpu-prof-dir` / `--heap-prof-dir` gravam perfis V8 por execução, para que o tempo e a captura de perfil usem o mesmo harness.

Convenções de saída salva:

- `pnpm test:startup:bench:smoke` grava o artefato de smoke direcionado em `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` grava o artefato da suíte completa em `.artifacts/cli-startup-bench-all.json` usando `runs=5` e `warmup=1`
- `pnpm test:startup:bench:update` atualiza o fixture de baseline versionado em `test/fixtures/cli-startup-bench.json` usando `runs=5` e `warmup=1`

Fixture versionado:

- `test/fixtures/cli-startup-bench.json`
- Atualize com `pnpm test:startup:bench:update`
- Compare os resultados atuais com o fixture usando `pnpm test:startup:bench:check`

## E2E de onboarding (Docker)

Docker é opcional; isso só é necessário para testes smoke de onboarding em contêineres.

Fluxo completo de cold-start em um contêiner Linux limpo:

```bash
scripts/e2e/onboard-docker.sh
```

Este script conduz o assistente interativo por meio de um pseudo-tty, verifica arquivos de config/workspace/session, depois inicia o Gateway e executa `openclaw health`.

## Smoke de importação de QR (Docker)

Garante que o helper mantido de runtime de QR carregue nos runtimes Docker Node compatíveis (Node 24 padrão, Node 22 compatível):

```bash
pnpm test:docker:qr
```

## Relacionado

- [Testes](/pt-BR/help/testing)
- [Testes live](/pt-BR/help/testing-live)
- [Testes de atualizações e plugins](/pt-BR/help/testing-updates-plugins)
