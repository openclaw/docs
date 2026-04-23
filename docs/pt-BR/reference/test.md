---
read_when:
    - Executando ou corrigindo testes
summary: Como executar testes localmente (vitest) e quando usar os modos force/coverage
title: Testes
x-i18n:
    generated_at: "2026-04-23T14:07:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0bcecb0868b3b68361e5ef78afc3170f2a481771bda8f7d54200b1d778d044a
    source_path: reference/test.md
    workflow: 15
---

# Testes

- Kit completo de testes (suítes, ao vivo, Docker): [Testing](/pt-BR/help/testing)

- `pnpm test:force`: encerra qualquer processo remanescente do Gateway que esteja ocupando a porta de controle padrão e então executa a suíte completa do Vitest com uma porta de Gateway isolada, para que testes de servidor não entrem em conflito com uma instância em execução. Use isto quando uma execução anterior do Gateway deixou a porta 18789 ocupada.
- `pnpm test:coverage`: executa a suíte unitária com cobertura V8 (via `vitest.unit.config.ts`). Este é um gate de cobertura unitária de arquivos carregados, não uma cobertura de todos os arquivos de todo o repositório. Os limites são 70% para linhas/funções/instruções e 55% para branches. Como `coverage.all` é false, o gate mede os arquivos carregados pela suíte de cobertura unitária em vez de tratar cada arquivo-fonte de lane dividida como não coberto.
- `pnpm test:coverage:changed`: executa cobertura unitária apenas para arquivos alterados desde `origin/main`.
- `pnpm test:changed`: expande caminhos git alterados em lanes do Vitest com escopo quando o diff toca apenas arquivos de origem/teste roteáveis. Alterações de config/setup ainda recorrem à execução nativa dos projetos raiz, para que edições de wiring sejam reexecutadas amplamente quando necessário.
- `pnpm changed:lanes`: mostra as lanes arquiteturais acionadas pelo diff contra `origin/main`.
- `pnpm check:changed`: executa o gate inteligente de alterações para o diff contra `origin/main`. Ele executa trabalho do core com lanes de teste do core, trabalho de extensão com lanes de teste de extensão, trabalho apenas de teste com apenas typecheck/testes de teste, expande alterações públicas do SDK de Plugin ou de contrato de plugin para validação de extensão e mantém bumps de versão apenas de metadados de release em verificações direcionadas de versão/config/dependências raiz.
- `pnpm test`: roteia destinos explícitos de arquivo/diretório por lanes do Vitest com escopo. Execuções sem alvo usam grupos fixos de shards e se expandem para configs folha para execução local paralela; o grupo de extensões sempre se expande para as configs de shard por extensão em vez de um único processo gigante de projeto raiz.
- Execuções completas e de shards de extensões atualizam dados locais de tempo em `.artifacts/vitest-shard-timings.json`; execuções posteriores usam esses tempos para equilibrar shards lentos e rápidos. Defina `OPENCLAW_TEST_PROJECTS_TIMINGS=0` para ignorar o artefato local de tempos.
- Arquivos de teste selecionados de `plugin-sdk` e `commands` agora são roteados por lanes leves dedicadas que mantêm apenas `test/setup.ts`, deixando casos pesados de runtime em suas lanes existentes.
- Arquivos-fonte auxiliares selecionados de `plugin-sdk` e `commands` também mapeiam `pnpm test:changed` para testes irmãos explícitos nessas lanes leves, para que pequenas edições de helper evitem reexecutar as suítes pesadas com suporte de runtime.
- `auto-reply` agora também é dividido em três configs dedicadas (`core`, `top-level`, `reply`), para que o harness de reply não domine os testes mais leves de status/token/helper de nível superior.
- A config base do Vitest agora usa por padrão `pool: "threads"` e `isolate: false`, com o executor compartilhado não isolado ativado em todas as configs do repositório.
- `pnpm test:channels` executa `vitest.channels.config.ts`.
- `pnpm test:extensions` e `pnpm test extensions` executam todos os shards de extensão/plugin. Extensões pesadas de canal e OpenAI são executadas como shards dedicados; outros grupos de extensões permanecem em lote. Use `pnpm test extensions/<id>` para uma lane de Plugin integrado.
- `pnpm test:perf:imports`: ativa relatórios do Vitest de duração de import + detalhamento de import, ainda usando roteamento por lane com escopo para destinos explícitos de arquivo/diretório.
- `pnpm test:perf:imports:changed`: mesmo profiling de import, mas apenas para arquivos alterados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` faz benchmark do caminho roteado do modo changed contra a execução nativa do projeto raiz para o mesmo diff git commitado.
- `pnpm test:perf:changed:bench -- --worktree` faz benchmark do conjunto atual de alterações no worktree sem precisar commitar antes.
- `pnpm test:perf:profile:main`: grava um perfil de CPU para a thread principal do Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: grava perfis de CPU + heap para o executor unitário (`.artifacts/vitest-runner-profile`).
- Integração com Gateway: opt-in via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e`: executa testes smoke end-to-end do Gateway (pareamento multi-instância WS/HTTP/Node). Usa por padrão `threads` + `isolate: false` com workers adaptativos em `vitest.e2e.config.ts`; ajuste com `OPENCLAW_E2E_WORKERS=<n>` e defina `OPENCLAW_E2E_VERBOSE=1` para logs detalhados.
- `pnpm test:live`: executa testes ao vivo de provedores (minimax/zai). Exige chaves de API e `LIVE=1` (ou `*_LIVE_TEST=1` específico do provedor) para deixar de ignorar.
- `pnpm test:docker:all`: constrói uma vez a imagem compartilhada de testes ao vivo e a imagem Docker E2E, depois executa as lanes smoke Docker com `OPENCLAW_SKIP_DOCKER_BUILD=1` com concorrência 4 por padrão. Ajuste com `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>`. O executor para de agendar novas lanes do pool após a primeira falha, a menos que `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` esteja definido, e cada lane tem um timeout de 120 minutos que pode ser sobrescrito com `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Lanes sensíveis à inicialização ou ao provedor são executadas de forma exclusiva após o pool paralelo. Logs por lane são gravados em `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:openwebui`: inicia OpenClaw + Open WebUI em Docker, faz login pelo Open WebUI, verifica `/api/models` e depois executa um chat real com proxy por `/api/chat/completions`. Exige uma chave de modelo ao vivo utilizável (por exemplo, OpenAI em `~/.profile`), baixa uma imagem externa do Open WebUI e não deve ser considerado estável em CI como as suítes normais unit/e2e.
- `pnpm test:docker:mcp-channels`: inicia um contêiner Gateway com seed e um segundo contêiner cliente que executa `openclaw mcp serve`, depois verifica descoberta de conversas roteadas, leituras de transcrição, metadados de anexos, comportamento da fila de eventos ao vivo, roteamento de envio de saída e notificações de canal + permissão no estilo Claude sobre a bridge stdio real. A asserção de notificação do Claude lê diretamente os frames MCP stdio brutos para que o smoke reflita o que a bridge realmente emite.

## Gate local de PR

Para verificações locais de gate/land de PR, execute:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Se `pnpm test` falhar de forma intermitente em um host carregado, execute novamente uma vez antes de tratar como regressão e então isole com `pnpm test <path/to/test>`. Para hosts com restrição de memória, use:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark de latência de modelo (chaves locais)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env opcional: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt padrão: “Reply with a single word: ok. No punctuation or extra text.”

Última execução (2025-12-31, 20 execuções):

- mediana do minimax 1279ms (mín 1114, máx 2431)
- mediana do opus 2454ms (mín 1224, máx 3170)

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

A saída inclui `sampleCount`, avg, p50, p95, min/max, distribuição de exit-code/signal e resumos de RSS máximo para cada comando. `--cpu-prof-dir` / `--heap-prof-dir` opcionais gravam perfis V8 por execução para que a captura de tempo e perfil use o mesmo harness.

Convenções de saída salva:

- `pnpm test:startup:bench:smoke` grava o artefato smoke direcionado em `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` grava o artefato da suíte completa em `.artifacts/cli-startup-bench-all.json` usando `runs=5` e `warmup=1`
- `pnpm test:startup:bench:update` atualiza o fixture baseline versionado em `test/fixtures/cli-startup-bench.json` usando `runs=5` e `warmup=1`

Fixture versionado:

- `test/fixtures/cli-startup-bench.json`
- Atualize com `pnpm test:startup:bench:update`
- Compare os resultados atuais com o fixture usando `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker é opcional; isso só é necessário para testes smoke de onboarding em contêiner.

Fluxo completo de cold-start em um contêiner Linux limpo:

```bash
scripts/e2e/onboard-docker.sh
```

Esse script conduz o assistente interativo por um pseudo-tty, verifica arquivos de config/workspace/sessão, depois inicia o Gateway e executa `openclaw health`.

## Smoke de importação de QR (Docker)

Garante que `qrcode-terminal` seja carregado nos runtimes Node compatíveis no Docker (Node 24 padrão, Node 22 compatível):

```bash
pnpm test:docker:qr
```
