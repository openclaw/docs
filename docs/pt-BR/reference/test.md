---
read_when:
    - Executar ou corrigir testes
summary: Como executar testes localmente (vitest) e quando usar os modos force/cobertura
title: Testes
x-i18n:
    generated_at: "2026-04-26T11:37:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 24eb2d122c806237bd4b90dffbd293479763c11a42cfcd195e1aed59efc71a5b
    source_path: reference/test.md
    workflow: 15
---

- Kit completo de testes (suítes, live, Docker): [Testes](/pt-BR/help/testing)

- `pnpm test:force`: Encerra qualquer processo de gateway remanescente que esteja mantendo a porta de controle padrão, depois executa a suíte completa do Vitest com uma porta de gateway isolada para que os testes de servidor não entrem em conflito com uma instância em execução. Use isto quando uma execução anterior do gateway deixou a porta 18789 ocupada.
- `pnpm test:coverage`: Executa a suíte unitária com cobertura V8 (via `vitest.unit.config.ts`). Este é um gate de cobertura unitária para arquivos carregados, não uma cobertura de todos os arquivos do repositório inteiro. Os limites são 70% para linhas/funções/instruções e 55% para branches. Como `coverage.all` é false, o gate mede os arquivos carregados pela suíte de cobertura unitária em vez de tratar cada arquivo-fonte de faixa dividida como não coberto.
- `pnpm test:coverage:changed`: Executa cobertura unitária apenas para arquivos alterados desde `origin/main`.
- `pnpm test:changed`: expande caminhos alterados no git em faixas do Vitest com escopo quando o diff toca apenas arquivos-fonte/de teste roteáveis. Alterações de configuração/setup ainda recorrem à execução nativa dos projetos raiz para que edições de integração disparem uma reexecução ampla quando necessário.
- `pnpm test:changed:focused`: execução de teste de loop interno para alterações. Ele executa apenas alvos precisos a partir de edições diretas em testes, arquivos `*.test.ts` irmãos, mapeamentos explícitos de origem e o grafo local de importações. Alterações amplas/de configuração/de pacote são ignoradas em vez de expandirem para o fallback completo de testes alterados.
- `pnpm changed:lanes`: mostra as faixas arquiteturais disparadas pelo diff em relação a `origin/main`.
- `pnpm check:changed`: executa o gate inteligente de alterações para o diff em relação a `origin/main`. Ele executa o trabalho do core com as faixas de teste do core, o trabalho de extensões com as faixas de teste de extensões, trabalho somente de teste com apenas typecheck/testes de teste, expande alterações públicas do Plugin SDK ou do contrato de plugin para uma passagem de validação de extensão e mantém bumps de versão apenas de metadados de release em verificações direcionadas de versão/configuração/dependência raiz.
- `pnpm test`: roteia alvos explícitos de arquivo/diretório por faixas do Vitest com escopo. Execuções sem alvo usam grupos fixos de shards e expandem para configs folha para execução paralela local; o grupo de extensões sempre expande para as configs de shard por extensão em vez de um único processo gigante de projeto raiz.
- Execuções de shards completas, de extensão e com padrão de inclusão atualizam dados locais de timing em `.artifacts/vitest-shard-timings.json`; execuções posteriores de configuração completa usam esses timings para balancear shards lentos e rápidos. Shards de CI com padrão de inclusão acrescentam o nome do shard à chave de timing, o que mantém visíveis os timings de shards filtrados sem substituir os dados de timing da configuração completa. Defina `OPENCLAW_TEST_PROJECTS_TIMINGS=0` para ignorar o artefato local de timing.
- Arquivos de teste selecionados de `plugin-sdk` e `commands` agora são roteados por faixas leves dedicadas que mantêm apenas `test/setup.ts`, deixando casos pesados de runtime em suas faixas existentes.
- Arquivos-fonte com testes irmãos mapeiam para esse irmão antes de recorrer a globs mais amplos de diretório. Edições em helpers sob `test/helpers/channels` e `test/helpers/plugins` usam um grafo local de importações para executar testes importadores em vez de executar amplamente todos os shards quando o caminho de dependência é preciso.
- `auto-reply` agora também é dividido em três configs dedicadas (`core`, `top-level`, `reply`) para que o harness de reply não domine os testes mais leves de status/token/helper de nível superior.
- A config base do Vitest agora usa por padrão `pool: "threads"` e `isolate: false`, com o runner compartilhado não isolado habilitado nas configs do repositório.
- `pnpm test:channels` executa `vitest.channels.config.ts`.
- `pnpm test:extensions` e `pnpm test extensions` executam todos os shards de extensão/plugin. Plugins pesados de canal, o plugin de navegador e OpenAI são executados como shards dedicados; outros grupos de plugins permanecem em lote. Use `pnpm test extensions/<id>` para uma única faixa de plugin agrupada.
- `pnpm test:perf:imports`: habilita relatórios de duração de importação + detalhamento de importação do Vitest, enquanto ainda usa roteamento de faixas com escopo para alvos explícitos de arquivo/diretório.
- `pnpm test:perf:imports:changed`: o mesmo perfilamento de importação, mas apenas para arquivos alterados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` faz benchmark do caminho roteado no modo de alterações em relação à execução nativa do projeto raiz para o mesmo diff de git commitado.
- `pnpm test:perf:changed:bench -- --worktree` faz benchmark do conjunto de alterações atual da worktree sem precisar commitar antes.
- `pnpm test:perf:profile:main`: grava um perfil de CPU para a thread principal do Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: grava perfis de CPU + heap para o runner unitário (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: executa serialmente cada config folha do Vitest da suíte completa e grava dados agrupados de duração mais artefatos JSON/log por config. O Agente de Performance de Testes usa isso como baseline antes de tentar corrigir testes lentos.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: compara relatórios agrupados após uma alteração focada em performance.
- Integração do Gateway: opt-in via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e`: Executa testes smoke end-to-end do gateway (pareamento WS/HTTP/node com múltiplas instâncias). Usa por padrão `threads` + `isolate: false` com workers adaptativos em `vitest.e2e.config.ts`; ajuste com `OPENCLAW_E2E_WORKERS=<n>` e defina `OPENCLAW_E2E_VERBOSE=1` para logs detalhados.
- `pnpm test:live`: Executa testes live de provider (minimax/zai). Requer chaves de API e `LIVE=1` (ou `*_LIVE_TEST=1` específico do provider) para sair do estado skipped.
- `pnpm test:docker:all`: Compila a imagem compartilhada de teste live e a imagem Docker de E2E uma vez, depois executa as faixas smoke do Docker com `OPENCLAW_SKIP_DOCKER_BUILD=1` por meio de um escalonador ponderado. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` controla os slots de processo e usa 10 por padrão; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` controla o pool de cauda sensível a providers e usa 10 por padrão. Limites de faixas pesadas usam por padrão `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; limites por provider usam por padrão uma faixa pesada por provider via `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` e `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Use `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` para hosts maiores. O início das faixas é escalonado em 2 segundos por padrão para evitar tempestades de criação no daemon local do Docker; substitua com `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. O runner faz preflight do Docker por padrão, limpa contêineres E2E obsoletos do OpenClaw, emite status de faixas ativas a cada 30 segundos, compartilha caches de ferramentas CLI de provider entre faixas compatíveis, tenta novamente falhas transitórias de provider live uma vez por padrão (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) e armazena timings de faixas em `.artifacts/docker-tests/lane-timings.json` para ordenação do mais longo para o mais curto em execuções posteriores. Use `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir o manifesto de faixas sem executar o Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` para ajustar a saída de status ou `OPENCLAW_DOCKER_ALL_TIMINGS=0` para desativar a reutilização de timings. Use `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` para apenas faixas determinísticas/locais ou `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` para apenas faixas de provider live; aliases de pacote são `pnpm test:docker:local:all` e `pnpm test:docker:live:all`. O modo somente live mescla as faixas live principais e de cauda em um único pool do mais longo para o mais curto para que os buckets de providers possam agrupar trabalhos de Claude, Codex e Gemini. O runner para de agendar novas faixas do pool após a primeira falha, a menos que `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` esteja definido, e cada faixa tem um timeout de fallback de 120 minutos substituível com `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; algumas faixas live/cauda selecionadas usam limites mais restritos por faixa. Comandos de setup Docker do backend CLI têm seu próprio timeout via `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (padrão 180). Logs por faixa são gravados em `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:browser-cdp-snapshot`: Compila um contêiner E2E de origem com Chromium, inicia CDP bruto mais um Gateway isolado, executa `browser doctor --deep` e verifica se snapshots de papéis do CDP incluem URLs de links, clickables promovidos por cursor, refs de iframe e metadados de frame.
- Probes live Docker do backend CLI podem ser executados como faixas focadas, por exemplo `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` ou `pnpm test:docker:live-cli-backend:codex:mcp`. Claude e Gemini têm aliases correspondentes `:resume` e `:mcp`.
- `pnpm test:docker:openwebui`: Inicia OpenClaw + Open WebUI em Docker, faz login pelo Open WebUI, verifica `/api/models` e então executa um chat proxy real por `/api/chat/completions`. Requer uma chave de modelo live utilizável (por exemplo OpenAI em `~/.profile`), baixa uma imagem externa do Open WebUI e não deve ser considerado estável em CI como as suítes normais unitárias/e2e.
- `pnpm test:docker:mcp-channels`: Inicia um contêiner Gateway semeado e um segundo contêiner cliente que executa `openclaw mcp serve`, depois verifica descoberta de conversa roteada, leituras de transcrição, metadados de anexos, comportamento de fila de eventos live, roteamento de envio de saída e notificações de canal + permissão no estilo Claude pela bridge stdio real. A asserção de notificação Claude lê diretamente os frames MCP brutos do stdio para que o smoke reflita o que a bridge realmente emite.

## Gate local de PR

Para verificações locais de land/gate de PR, execute:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Se `pnpm test` apresentar flakes em um host sobrecarregado, execute novamente uma vez antes de tratar isso como regressão; depois isole com `pnpm test <path/to/test>`. Para hosts com restrição de memória, use:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark de latência de modelo (chaves locais)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env opcional: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt padrão: “Responda com uma única palavra: ok. Sem pontuação nem texto extra.”

Última execução (2025-12-31, 20 execuções):

- minimax mediana de 1279ms (mín. 1114, máx. 2431)
- opus mediana de 2454ms (mín. 1224, máx. 3170)

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
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Presets:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: ambos os presets

A saída inclui `sampleCount`, avg, p50, p95, mín/máx, distribuição de código de saída/sinal e resumos de RSS máximo para cada comando. `--cpu-prof-dir` / `--heap-prof-dir` opcionais gravam perfis V8 por execução para que a captura de timing e perfil use o mesmo harness.

Convenções de saída salva:

- `pnpm test:startup:bench:smoke` grava o artefato smoke direcionado em `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` grava o artefato da suíte completa em `.artifacts/cli-startup-bench-all.json` usando `runs=5` e `warmup=1`
- `pnpm test:startup:bench:update` atualiza a fixture baseline versionada em `test/fixtures/cli-startup-bench.json` usando `runs=5` e `warmup=1`

Fixture versionada:

- `test/fixtures/cli-startup-bench.json`
- Atualize com `pnpm test:startup:bench:update`
- Compare os resultados atuais com a fixture usando `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker é opcional; isto só é necessário para testes smoke de onboarding em contêineres.

Fluxo completo de cold start em um contêiner Linux limpo:

```bash
scripts/e2e/onboard-docker.sh
```

Este script conduz o assistente interativo por meio de um pseudo-TTY, verifica arquivos de config/workspace/session, depois inicia o gateway e executa `openclaw health`.

## Smoke de importação de QR (Docker)

Garante que o helper de runtime de QR mantido seja carregado nos runtimes Node do Docker compatíveis (Node 24 por padrão, Node 22 compatível):

```bash
pnpm test:docker:qr
```

## Relacionado

- [Testes](/pt-BR/help/testing)
- [Testes live](/pt-BR/help/testing-live)
