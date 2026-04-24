---
read_when:
    - Executando ou corrigindo testes
summary: Como executar testes localmente (vitest) e quando usar modos force/coverage
title: Testes
x-i18n:
    generated_at: "2026-04-24T06:12:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: df4ad5808ddbc06c704c9bcf9f780b06f9be94ac213ed22e79d880dedcaa6d3b
    source_path: reference/test.md
    workflow: 15
---

- Kit completo de testes (suites, live, Docker): [Testing](/pt-BR/help/testing)

- `pnpm test:force`: encerra qualquer processo de gateway remanescente que esteja usando a porta de controle padrão e então executa a suíte completa do Vitest com uma porta de gateway isolada, para que testes de servidor não entrem em conflito com uma instância em execução. Use isto quando uma execução anterior do gateway tiver deixado a porta 18789 ocupada.
- `pnpm test:coverage`: executa a suíte de testes unitários com cobertura V8 (via `vitest.unit.config.ts`). Este é um gate de cobertura de unidades para arquivos carregados, não cobertura de todos os arquivos do repositório. Os limites são 70% para linhas/funções/instruções e 55% para branches. Como `coverage.all` é false, o gate mede arquivos carregados pela suíte de cobertura unitária em vez de tratar todos os arquivos-fonte de lanes divididas como não cobertos.
- `pnpm test:coverage:changed`: executa cobertura unitária apenas para arquivos alterados desde `origin/main`.
- `pnpm test:changed`: expande caminhos git alterados em lanes Vitest com escopo quando o diff toca apenas arquivos roteáveis de código-fonte/teste. Alterações em config/setup ainda usam fallback para a execução nativa dos projetos raiz, para que edições de wiring reexecutem de forma ampla quando necessário.
- `pnpm changed:lanes`: mostra as lanes arquiteturais acionadas pelo diff em relação a `origin/main`.
- `pnpm check:changed`: executa o gate inteligente de alterados para o diff em relação a `origin/main`. Ele executa trabalho do core com lanes de teste do core, trabalho de extensão com lanes de teste de extensão, trabalho apenas de teste com apenas typecheck/testes de teste, expande mudanças públicas de Plugin SDK ou plugin-contract para uma passagem de validação de extensão e mantém bumps de versão apenas em metadados de release em verificações direcionadas de versão/config/dependências raiz.
- `pnpm test`: roteia alvos explícitos de arquivo/diretório por lanes Vitest com escopo. Execuções sem alvo usam grupos fixos de shards e se expandem para configs leaf para execução paralela local; o grupo de extensão sempre se expande para as configs de shard por extensão, em vez de um único processo gigante de projeto raiz.
- Execuções completas e de shards de extensão atualizam dados locais de temporização em `.artifacts/vitest-shard-timings.json`; execuções posteriores usam esses tempos para equilibrar shards lentos e rápidos. Defina `OPENCLAW_TEST_PROJECTS_TIMINGS=0` para ignorar o artefato local de temporização.
- Arquivos de teste selecionados de `plugin-sdk` e `commands` agora são roteados por lanes leves dedicadas que mantêm apenas `test/setup.ts`, deixando casos pesados de runtime em suas lanes existentes.
- Arquivos-fonte auxiliares selecionados de `plugin-sdk` e `commands` também mapeiam `pnpm test:changed` para testes irmãos explícitos nessas lanes leves, para que pequenas edições de helpers evitem reexecutar as suítes pesadas com suporte de runtime.
- `auto-reply` agora também se divide em três configs dedicadas (`core`, `top-level`, `reply`), para que o harness de reply não domine os testes mais leves de status/token/helper de nível superior.
- A config base do Vitest agora usa por padrão `pool: "threads"` e `isolate: false`, com o runner compartilhado sem isolamento habilitado em todas as configs do repositório.
- `pnpm test:channels` executa `vitest.channels.config.ts`.
- `pnpm test:extensions` e `pnpm test extensions` executam todos os shards de extensão/plugin. Plugins pesados de canal, o plugin de browser e OpenAI rodam como shards dedicados; outros grupos de plugin permanecem em lote. Use `pnpm test extensions/<id>` para uma lane de Plugin incluído.
- `pnpm test:perf:imports`: habilita relatórios de duração de importação + breakdown de importação do Vitest, enquanto ainda usa roteamento de lanes com escopo para alvos explícitos de arquivo/diretório.
- `pnpm test:perf:imports:changed`: mesmo profiling de importação, mas apenas para arquivos alterados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compara em benchmark o caminho roteado do modo de alterados com a execução nativa de projeto raiz para o mesmo diff git commitado.
- `pnpm test:perf:changed:bench -- --worktree` compara em benchmark o conjunto de alterações atual do worktree sem precisar fazer commit primeiro.
- `pnpm test:perf:profile:main`: grava um perfil de CPU para a thread principal do Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: grava perfis de CPU + heap para o runner unitário (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: executa serialmente cada config leaf do Vitest da suíte completa e grava dados agrupados de duração mais artefatos JSON/log por config. O Test Performance Agent usa isso como baseline antes de tentar correções de testes lentos.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: compara relatórios agrupados após uma mudança focada em desempenho.
- Integração de Gateway: opt-in via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e`: executa testes smoke end-to-end do gateway (pareamento multi-instância WS/HTTP/node). Usa por padrão `threads` + `isolate: false` com workers adaptativos em `vitest.e2e.config.ts`; ajuste com `OPENCLAW_E2E_WORKERS=<n>` e defina `OPENCLAW_E2E_VERBOSE=1` para logs detalhados.
- `pnpm test:live`: executa testes live de provedores (minimax/zai). Exige chaves de API e `LIVE=1` (ou `*_LIVE_TEST=1` específico do provedor) para não pular os testes.
- `pnpm test:docker:all`: faz build da imagem compartilhada de live-test e da imagem Docker E2E uma vez, depois executa as lanes smoke Docker com `OPENCLAW_SKIP_DOCKER_BUILD=1` com concorrência 8 por padrão. Ajuste o pool principal com `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` e o pool final sensível a provedores com `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>`; ambos usam 8 por padrão. O runner para de agendar novas lanes em pool após a primeira falha, a menos que `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` esteja definido, e cada lane tem timeout de 120 minutos, substituível com `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Logs por lane são gravados em `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:openwebui`: inicia OpenClaw em Docker + Open WebUI, faz login pelo Open WebUI, verifica `/api/models` e então executa um chat real com proxy por `/api/chat/completions`. Exige uma chave de modelo live utilizável (por exemplo OpenAI em `~/.profile`), baixa uma imagem externa do Open WebUI e não deve ser considerado estável em CI como as suítes normais unit/e2e.
- `pnpm test:docker:mcp-channels`: inicia um container Gateway semeado e um segundo container cliente que inicia `openclaw mcp serve`, então verifica descoberta de conversa roteada, leitura de transcrição, metadados de anexos, comportamento da fila de eventos live, roteamento de envio de saída e notificações no estilo Claude de canal + permissão pela bridge stdio real. A asserção de notificação Claude lê diretamente os frames MCP stdio brutos, para que o smoke reflita o que a bridge realmente emite.

## Gate local de PR

Para verificações locais de land/gate de PR, execute:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Se `pnpm test` apresentar flakiness em um host carregado, execute novamente uma vez antes de tratá-lo como regressão; depois isole com `pnpm test <path/to/test>`. Para hosts com memória limitada, use:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark de latência de modelo (chaves locais)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env opcional: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt padrão: “Reply with a single word: ok. No punctuation or extra text.”

Última execução (2025-12-31, 20 execuções):

- minimax median 1279ms (min 1114, max 2431)
- opus median 2454ms (min 1224, max 3170)

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

A saída inclui `sampleCount`, avg, p50, p95, min/max, distribuição de exit-code/signal e resumos de RSS máximo para cada comando. `--cpu-prof-dir` / `--heap-prof-dir` opcionais gravam perfis V8 por execução, para que a captura de tempo e de perfil use o mesmo harness.

Convenções de saída salva:

- `pnpm test:startup:bench:smoke` grava o artefato smoke direcionado em `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` grava o artefato da suíte completa em `.artifacts/cli-startup-bench-all.json` usando `runs=5` e `warmup=1`
- `pnpm test:startup:bench:update` atualiza o fixture baseline versionado em `test/fixtures/cli-startup-bench.json` usando `runs=5` e `warmup=1`

Fixture versionado:

- `test/fixtures/cli-startup-bench.json`
- Atualize com `pnpm test:startup:bench:update`
- Compare os resultados atuais com o fixture usando `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker é opcional; isso só é necessário para testes smoke de onboarding em container.

Fluxo completo de cold-start em um container Linux limpo:

```bash
scripts/e2e/onboard-docker.sh
```

Esse script conduz o assistente interativo por um pseudo-tty, verifica arquivos de config/workspace/session, depois inicia o gateway e executa `openclaw health`.

## Smoke de importação de QR (Docker)

Garante que o helper de runtime de QR mantido carregue nos runtimes Node Docker compatíveis (Node 24 padrão, Node 22 compatível):

```bash
pnpm test:docker:qr
```

## Relacionado

- [Testing](/pt-BR/help/testing)
- [Testing live](/pt-BR/help/testing-live)
