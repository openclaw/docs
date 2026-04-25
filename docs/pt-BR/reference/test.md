---
read_when:
    - Executando ou corrigindo testes
summary: Como executar testes localmente (Vitest) e quando usar os modos force/coverage
title: Testes
x-i18n:
    generated_at: "2026-04-25T13:55:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc138f5e3543b45598ab27b9f7bc9ce43979510b4508580a0cf95c43f97bac53
    source_path: reference/test.md
    workflow: 15
---

- Kit completo de testes (suites, live, Docker): [Testes](/pt-BR/help/testing)

- `pnpm test:force`: Encerra qualquer processo remanescente do gateway que esteja ocupando a porta de controle padrão e, em seguida, executa a suite completa do Vitest com uma porta de gateway isolada para que os testes de servidor não colidam com uma instância em execução. Use isto quando uma execução anterior do gateway tiver deixado a porta 18789 ocupada.
- `pnpm test:coverage`: Executa a suite unitária com cobertura V8 (via `vitest.unit.config.ts`). Este é um gate de cobertura unitária dos arquivos carregados, não uma cobertura de todos os arquivos de todo o repositório. Os limites são 70% para linhas/funções/instruções e 55% para branches. Como `coverage.all` é falso, o gate mede os arquivos carregados pela suite unitária de cobertura em vez de tratar todos os arquivos-fonte das lanes divididas como não cobertos.
- `pnpm test:coverage:changed`: Executa cobertura unitária apenas para arquivos alterados desde `origin/main`.
- `pnpm test:changed`: expande os caminhos alterados no git em lanes do Vitest com escopo quando o diff toca apenas arquivos de código/teste roteáveis. Alterações de configuração/setup ainda recorrem à execução nativa dos projetos raiz, para que edições de wiring reexecutem de forma ampla quando necessário.
- `pnpm changed:lanes`: mostra as lanes de arquitetura acionadas pelo diff em relação a `origin/main`.
- `pnpm check:changed`: executa o gate inteligente de alterações para o diff em relação a `origin/main`. Ele executa trabalho de core com as lanes de teste de core, trabalho de extensão com as lanes de teste de extensão, trabalho apenas de teste com typecheck/testes apenas de teste, expande alterações públicas do SDK de Plugin ou de contrato de plugin para uma passada de validação de extensão e mantém version bumps apenas de metadados de release em verificações direcionadas de versão/configuração/dependências raiz.
- `pnpm test`: roteia alvos explícitos de arquivo/diretório por lanes do Vitest com escopo. Execuções sem alvo usam grupos fixos de shards e se expandem para configs leaf para execução paralela local; o grupo de extensões sempre se expande para as configs de shard por extensão, em vez de um único processo gigante de projeto raiz.
- Execuções completas e de shards de extensão atualizam dados locais de tempo em `.artifacts/vitest-shard-timings.json`; execuções posteriores usam esses tempos para balancear shards lentos e rápidos. Defina `OPENCLAW_TEST_PROJECTS_TIMINGS=0` para ignorar o artefato local de tempos.
- Alguns arquivos de teste selecionados de `plugin-sdk` e `commands` agora são roteados por lanes leves dedicadas que mantêm apenas `test/setup.ts`, deixando os casos pesados em tempo de execução em suas lanes existentes.
- Alguns arquivos-fonte helper selecionados de `plugin-sdk` e `commands` também mapeiam `pnpm test:changed` para testes irmãos explícitos nessas lanes leves, de modo que pequenas edições em helpers evitem reexecutar as suites pesadas apoiadas em runtime.
- `auto-reply` agora também se divide em três configs dedicadas (`core`, `top-level`, `reply`), para que o harness de reply não domine os testes mais leves de status/token/helper de nível superior.
- A config base do Vitest agora usa por padrão `pool: "threads"` e `isolate: false`, com o runner compartilhado não isolado habilitado em todas as configs do repositório.
- `pnpm test:channels` executa `vitest.channels.config.ts`.
- `pnpm test:extensions` e `pnpm test extensions` executam todos os shards de extensão/plugin. Plugins pesados de canal, o plugin de navegador e OpenAI executam como shards dedicados; outros grupos de plugins permanecem em lote. Use `pnpm test extensions/<id>` para uma lane de plugin agrupado.
- `pnpm test:perf:imports`: habilita relatórios de duração e detalhamento de importações do Vitest, ainda usando roteamento por lane com escopo para alvos explícitos de arquivo/diretório.
- `pnpm test:perf:imports:changed`: o mesmo profiling de importação, mas apenas para arquivos alterados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` faz benchmark do caminho roteado em modo changed contra a execução nativa do projeto raiz para o mesmo diff git commitado.
- `pnpm test:perf:changed:bench -- --worktree` faz benchmark do conjunto atual de alterações da worktree sem precisar commitar primeiro.
- `pnpm test:perf:profile:main`: grava um perfil de CPU para a thread principal do Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: grava perfis de CPU + heap para o runner unitário (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: executa serialmente cada config leaf do Vitest da suite completa e grava dados agrupados de duração, além de artefatos JSON/log por config. O agente de desempenho de testes usa isso como linha de base antes de tentar corrigir testes lentos.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: compara relatórios agrupados após uma alteração focada em desempenho.
- Integração do Gateway: opt-in via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e`: Executa testes smoke end-to-end do gateway (pareamento multi-instância WS/HTTP/node). Usa por padrão `threads` + `isolate: false` com workers adaptativos em `vitest.e2e.config.ts`; ajuste com `OPENCLAW_E2E_WORKERS=<n>` e defina `OPENCLAW_E2E_VERBOSE=1` para logs detalhados.
- `pnpm test:live`: Executa testes live de provedores (minimax/zai). Requer chaves de API e `LIVE=1` (ou `*_LIVE_TEST=1` específico do provedor) para deixar de ignorá-los.
- `pnpm test:docker:all`: Constrói uma vez a imagem compartilhada de teste live e a imagem Docker E2E e, depois, executa as lanes smoke do Docker com `OPENCLAW_SKIP_DOCKER_BUILD=1` por meio de um scheduler ponderado. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` controla os slots de processo e o padrão é 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` controla o pool final sensível a provedores e o padrão é 10. Os limites de lanes pesadas usam por padrão `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; os limites de provedores usam por padrão uma lane pesada por provedor via `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` e `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Use `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` para hosts maiores. O início das lanes é escalonado em 2 segundos por padrão para evitar tempestades de criação no daemon local do Docker; substitua com `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. O runner faz preflight do Docker por padrão, limpa contêineres E2E antigos do OpenClaw, emite status de lanes ativas a cada 30 segundos, compartilha caches de ferramentas CLI de provedores entre lanes compatíveis, tenta novamente uma vez por padrão falhas transitórias de provedores live (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) e armazena tempos das lanes em `.artifacts/docker-tests/lane-timings.json` para ordenação longest-first em execuções futuras. Use `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir o manifesto de lanes sem executar o Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` para ajustar a saída de status ou `OPENCLAW_DOCKER_ALL_TIMINGS=0` para desabilitar a reutilização de tempos. Use `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` para apenas lanes determinísticas/locais ou `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` para apenas lanes de provedores live; os aliases de pacote são `pnpm test:docker:local:all` e `pnpm test:docker:live:all`. O modo somente live mescla as lanes live principais e finais em um único pool longest-first para que os buckets de provedores possam empacotar juntos trabalhos de Claude, Codex e Gemini. O runner para de agendar novas lanes agrupadas após a primeira falha, a menos que `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` esteja definido, e cada lane tem um timeout de fallback de 120 minutos, substituível com `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; algumas lanes live/finais selecionadas usam limites por lane mais restritos. Os comandos de configuração Docker do backend CLI live têm seu próprio timeout via `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (padrão 180). Os logs por lane são gravados em `.artifacts/docker-tests/<run-id>/`.
- Sondas Docker live do backend CLI podem ser executadas como lanes focadas, por exemplo `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` ou `pnpm test:docker:live-cli-backend:codex:mcp`. Claude e Gemini têm aliases correspondentes `:resume` e `:mcp`.
- `pnpm test:docker:openwebui`: Inicia OpenClaw + Open WebUI em Docker, faz login pelo Open WebUI, verifica `/api/models` e então executa um chat real via proxy por `/api/chat/completions`. Requer uma chave válida de modelo live (por exemplo, OpenAI em `~/.profile`), faz pull de uma imagem externa do Open WebUI e não deve ser considerado estável em CI como as suites normais unit/e2e.
- `pnpm test:docker:mcp-channels`: Inicia um contêiner Gateway pré-carregado e um segundo contêiner cliente que executa `openclaw mcp serve`, e então verifica descoberta de conversas roteadas, leitura de transcrições, metadados de anexos, comportamento da fila de eventos live, roteamento de envio de saída e notificações de canal + permissão no estilo Claude sobre a ponte stdio real. A asserção de notificação do Claude lê diretamente os frames MCP brutos do stdio para que o smoke reflita o que a ponte realmente emite.

## Gate local de PR

Para verificações locais de landing/gate de PR, execute:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Se `pnpm test` falhar de forma intermitente em uma máquina carregada, execute novamente uma vez antes de tratar como regressão e, depois, isole com `pnpm test <path/to/test>`. Para máquinas com restrição de memória, use:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark de latência de modelo (chaves locais)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Variáveis de ambiente opcionais: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt padrão: “Responda com uma única palavra: ok. Sem pontuação nem texto extra.”

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
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Presets:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: ambos os presets

A saída inclui `sampleCount`, avg, p50, p95, min/max, distribuição de exit-code/signal e resumos de RSS máximo para cada comando. `--cpu-prof-dir` / `--heap-prof-dir` opcionais gravam perfis V8 por execução para que medição de tempo e captura de perfil usem o mesmo harness.

Convenções de saída salva:

- `pnpm test:startup:bench:smoke` grava o artefato smoke direcionado em `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` grava o artefato da suite completa em `.artifacts/cli-startup-bench-all.json` usando `runs=5` e `warmup=1`
- `pnpm test:startup:bench:update` atualiza o fixture de linha de base versionado em `test/fixtures/cli-startup-bench.json` usando `runs=5` e `warmup=1`

Fixture versionado:

- `test/fixtures/cli-startup-bench.json`
- Atualize com `pnpm test:startup:bench:update`
- Compare os resultados atuais com o fixture usando `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

O Docker é opcional; isso só é necessário para testes smoke de onboarding em contêiner.

Fluxo completo de cold start em um contêiner Linux limpo:

```bash
scripts/e2e/onboard-docker.sh
```

Este script conduz o assistente interativo por meio de um pseudo-TTY, verifica arquivos de config/workspace/session e, em seguida, inicia o gateway e executa `openclaw health`.

## Smoke de importação de QR (Docker)

Garante que o helper de runtime de QR mantido carregue nos runtimes Node compatíveis com Docker (Node 24 padrão, Node 22 compatível):

```bash
pnpm test:docker:qr
```

## Relacionado

- [Testes](/pt-BR/help/testing)
- [Testes live](/pt-BR/help/testing-live)
