---
read_when:
    - Executando ou corrigindo testes
summary: Como executar testes localmente (vitest) e quando usar os modos force/cobertura
title: Testes
x-i18n:
    generated_at: "2026-04-22T04:27:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed665840ef2c7728da8ec923eb3ea2878d9b20a841cb2fe4116a7f6334567b8e
    source_path: reference/test.md
    workflow: 15
---

# Testes

- Kit completo de testes (suítes, ao vivo, Docker): [Testing](/pt-BR/help/testing)

- `pnpm test:force`: Encerra qualquer processo residual do gateway que esteja segurando a porta de controle padrão e depois executa a suíte completa do Vitest com uma porta isolada do gateway para que testes de servidor não colidam com uma instância em execução. Use isso quando uma execução anterior do gateway tiver deixado a porta 18789 ocupada.
- `pnpm test:coverage`: Executa a suíte unitária com cobertura V8 (via `vitest.unit.config.ts`). Este é um gate de cobertura unitária de arquivos carregados, não cobertura de todos os arquivos do repositório. Os thresholds são 70% para linhas/funções/statements e 55% para branches. Como `coverage.all` é false, o gate mede os arquivos carregados pela suíte de cobertura unitária em vez de tratar todo arquivo-fonte de lane dividida como não coberto.
- `pnpm test:coverage:changed`: Executa cobertura unitária apenas para arquivos alterados desde `origin/main`.
- `pnpm test:changed`: expande caminhos git alterados em lanes Vitest com escopo quando o diff toca apenas arquivos-fonte/de teste roteáveis. Alterações de config/setup ainda fazem fallback para a execução nativa de projetos raiz, para que edições de wiring sejam reexecutadas amplamente quando necessário.
- `pnpm changed:lanes`: mostra as lanes arquiteturais acionadas pelo diff contra `origin/main`.
- `pnpm check:changed`: executa o gate inteligente de alterações para o diff contra `origin/main`. Ele executa trabalho do core com lanes de teste do core, trabalho de extensão com lanes de teste de extensão, trabalho apenas de teste com typecheck/testes apenas de teste, expande alterações públicas de Plugin SDK ou contrato de plugin para validação de extensão e mantém bumps de versão apenas de metadados de release em verificações direcionadas de versão/config/dependências raiz.
- `pnpm test`: roteia alvos explícitos de arquivo/diretório por lanes Vitest com escopo. Execuções sem alvo usam grupos fixos de shards e expandem para configs folha para execução paralela local; o grupo de extensões sempre expande para as configs de shard por extensão/plugin em vez de um único processo gigante de projeto raiz.
- Execuções completas e de shard de extensão atualizam dados locais de tempo em `.artifacts/vitest-shard-timings.json`; execuções posteriores usam esses tempos para balancear shards lentos e rápidos. Defina `OPENCLAW_TEST_PROJECTS_TIMINGS=0` para ignorar o artefato local de tempo.
- Arquivos de teste selecionados de `plugin-sdk` e `commands` agora são roteados por lanes leves dedicadas que mantêm apenas `test/setup.ts`, deixando casos pesados de runtime em suas lanes existentes.
- Arquivos-fonte auxiliares selecionados de `plugin-sdk` e `commands` também mapeiam `pnpm test:changed` para testes irmãos explícitos nessas lanes leves, para que pequenas edições em helpers evitem reexecutar as suítes pesadas com suporte de runtime.
- `auto-reply` agora também se divide em três configs dedicadas (`core`, `top-level`, `reply`) para que o harness de resposta não domine os testes mais leves de status/token/helper de nível superior.
- A config base do Vitest agora usa por padrão `pool: "threads"` e `isolate: false`, com o runner compartilhado não isolado ativado em todas as configs do repositório.
- `pnpm test:channels` executa `vitest.channels.config.ts`.
- `pnpm test:extensions` e `pnpm test extensions` executam todos os shards de extensão/plugin. Extensões pesadas de canal e OpenAI executam como shards dedicados; outros grupos de extensão permanecem em lote. Use `pnpm test extensions/<id>` para uma lane de plugin empacotado.
- `pnpm test:perf:imports`: ativa relatórios do Vitest de duração de import + detalhamento de import, ainda usando roteamento por lanes com escopo para alvos explícitos de arquivo/diretório.
- `pnpm test:perf:imports:changed`: mesmo profiling de import, mas apenas para arquivos alterados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` faz benchmark do caminho roteado do modo changed em comparação com a execução nativa de projeto raiz para o mesmo diff git commitado.
- `pnpm test:perf:changed:bench -- --worktree` faz benchmark do conjunto de alterações atual da worktree sem fazer commit primeiro.
- `pnpm test:perf:profile:main`: grava um perfil de CPU para a thread principal do Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: grava perfis de CPU + heap para o runner unitário (`.artifacts/vitest-runner-profile`).
- Integração do Gateway: opt-in via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e`: Executa testes smoke end-to-end do gateway (pareamento WS/HTTP/node com múltiplas instâncias). Usa por padrão `threads` + `isolate: false` com workers adaptativos em `vitest.e2e.config.ts`; ajuste com `OPENCLAW_E2E_WORKERS=<n>` e defina `OPENCLAW_E2E_VERBOSE=1` para logs detalhados.
- `pnpm test:live`: Executa testes ao vivo de provedor (minimax/zai). Exige chaves de API e `LIVE=1` (ou `*_LIVE_TEST=1` específico do provedor) para sair de skip.
- `pnpm test:docker:openwebui`: Inicia OpenClaw + Open WebUI em Docker, faz login via Open WebUI, verifica `/api/models` e então executa um chat real com proxy via `/api/chat/completions`. Exige uma chave de modelo ao vivo utilizável (por exemplo OpenAI em `~/.profile`), baixa uma imagem externa do Open WebUI e não se espera que seja estável em CI como as suítes normais unit/e2e.
- `pnpm test:docker:mcp-channels`: Inicia um contêiner Gateway semeado e um segundo contêiner cliente que inicia `openclaw mcp serve`, então verifica descoberta de conversa roteada, leituras de transcrição, metadados de anexo, comportamento de fila de eventos ao vivo, roteamento de envio de saída e notificações no estilo Claude de canal + permissão sobre a bridge stdio real. A asserção de notificação Claude lê diretamente os frames MCP stdio brutos para que o smoke reflita o que a bridge realmente emite.

## Gate local de PR

Para verificações locais de land/gate de PR, execute:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Se `pnpm test` falhar intermitentemente em um host carregado, execute novamente uma vez antes de tratar como regressão e então isole com `pnpm test <path/to/test>`. Para hosts com restrição de memória, use:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark de latência de modelo (chaves locais)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env opcional: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt padrão: “Reply with a single word: ok. No punctuation or extra text.”

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
- `pnpm test:startup:bench:update` atualiza a fixture de linha de base versionada em `test/fixtures/cli-startup-bench.json` usando `runs=5` e `warmup=1`

Fixture versionada:

- `test/fixtures/cli-startup-bench.json`
- Atualize com `pnpm test:startup:bench:update`
- Compare os resultados atuais com a fixture usando `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker é opcional; isso só é necessário para testes smoke de onboarding em contêiner.

Fluxo completo de cold-start em um contêiner Linux limpo:

```bash
scripts/e2e/onboard-docker.sh
```

Esse script conduz o assistente interativo por meio de um pseudo-tty, verifica arquivos de config/workspace/sessão e então inicia o gateway e executa `openclaw health`.

## Smoke de importação de QR (Docker)

Garante que `qrcode-terminal` carregue nos runtimes Node compatíveis do Docker (Node 24 por padrão, Node 22 compatível):

```bash
pnpm test:docker:qr
```
