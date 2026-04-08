---
read_when:
    - Ao executar ou corrigir testes
summary: Como executar testes localmente (vitest) e quando usar os modos force/coverage
title: Testes
x-i18n:
    generated_at: "2026-04-08T02:18:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: f7c19390f7577b3a29796c67514c96fe4c86c9fa0c7686cd4e377c6e31dcd085
    source_path: reference/test.md
    workflow: 15
---

# Testes

- Kit completo de testes (suítes, live, Docker): [Testing](/pt-BR/help/testing)

- `pnpm test:force`: Encerra qualquer processo de gateway remanescente que esteja mantendo a porta de controle padrão ocupada e depois executa a suíte completa do Vitest com uma porta de gateway isolada para que os testes de servidor não entrem em conflito com uma instância em execução. Use isso quando uma execução anterior do gateway tiver deixado a porta 18789 ocupada.
- `pnpm test:coverage`: Executa a suíte unitária com cobertura V8 (via `vitest.unit.config.ts`). Os limites globais são 70% de linhas/branches/functions/statements. A cobertura exclui entrypoints com muita integração (wiring da CLI, bridges gateway/Telegram, servidor estático do webchat) para manter o alvo focado em lógica testável por testes unitários.
- `pnpm test:coverage:changed`: Executa cobertura unitária apenas para arquivos alterados desde `origin/main`.
- `pnpm test:changed`: expande caminhos alterados no git em lanes escopadas do Vitest quando o diff toca apenas arquivos de código/teste roteáveis. Alterações em config/setup ainda recorrem à execução nativa dos projetos raiz para que edições na fiação reexecutem de forma ampla quando necessário.
- `pnpm test`: encaminha alvos explícitos de arquivo/diretório por lanes escopadas do Vitest. Execuções sem alvo agora executam onze configs sequenciais de shard (`vitest.full-core-unit-src.config.ts`, `vitest.full-core-unit-security.config.ts`, `vitest.full-core-unit-ui.config.ts`, `vitest.full-core-unit-support.config.ts`, `vitest.full-core-support-boundary.config.ts`, `vitest.full-core-contracts.config.ts`, `vitest.full-core-bundled.config.ts`, `vitest.full-core-runtime.config.ts`, `vitest.full-agentic.config.ts`, `vitest.full-auto-reply.config.ts`, `vitest.full-extensions.config.ts`) em vez de um único processo gigante do projeto raiz.
- Arquivos de teste selecionados de `plugin-sdk` e `commands` agora são encaminhados por lanes leves dedicadas que mantêm apenas `test/setup.ts`, deixando casos pesados de runtime em suas lanes existentes.
- Arquivos de código helper selecionados de `plugin-sdk` e `commands` também mapeiam `pnpm test:changed` para testes irmãos explícitos nessas lanes leves, para que pequenas edições em helpers evitem reexecutar as suítes pesadas com suporte de runtime.
- `auto-reply` agora também se divide em três configs dedicadas (`core`, `top-level`, `reply`) para que o harness de reply não domine os testes mais leves de status/token/helper de nível superior.
- A configuração base do Vitest agora usa por padrão `pool: "threads"` e `isolate: false`, com o runner compartilhado não isolado habilitado em todas as configs do repositório.
- `pnpm test:channels` executa `vitest.channels.config.ts`.
- `pnpm test:extensions` executa `vitest.extensions.config.ts`.
- `pnpm test:extensions`: executa suítes de extensão/plugin.
- `pnpm test:perf:imports`: habilita relatórios de duração de importação + detalhamento de importações do Vitest, enquanto continua usando roteamento por lanes escopadas para alvos explícitos de arquivo/diretório.
- `pnpm test:perf:imports:changed`: mesmo profiling de importação, mas apenas para arquivos alterados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` faz benchmark do caminho roteado do modo changed em relação à execução nativa do projeto raiz para o mesmo diff git commitado.
- `pnpm test:perf:changed:bench -- --worktree` faz benchmark do conjunto atual de alterações da worktree sem precisar fazer commit antes.
- `pnpm test:perf:profile:main`: grava um perfil de CPU para a thread principal do Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: grava perfis de CPU + heap para o runner unitário (`.artifacts/vitest-runner-profile`).
- Integração do gateway: opt-in via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e`: Executa testes smoke end-to-end do gateway (múltiplas instâncias WS/HTTP/pareamento de nós). Usa por padrão `threads` + `isolate: false` com workers adaptativos em `vitest.e2e.config.ts`; ajuste com `OPENCLAW_E2E_WORKERS=<n>` e defina `OPENCLAW_E2E_VERBOSE=1` para logs detalhados.
- `pnpm test:live`: Executa testes live de provedores (minimax/zai). Requer chaves de API e `LIVE=1` (ou `*_LIVE_TEST=1` específico do provedor) para deixar de ignorá-los.
- `pnpm test:docker:openwebui`: Inicia OpenClaw + Open WebUI em Docker, faz login pelo Open WebUI, verifica `/api/models` e depois executa um chat real via proxy por `/api/chat/completions`. Requer uma chave de modelo live utilizável (por exemplo OpenAI em `~/.profile`), baixa uma imagem externa do Open WebUI e não deve ser estável na CI como as suítes unit/e2e normais.
- `pnpm test:docker:mcp-channels`: Inicia um contêiner Gateway semeado e um segundo contêiner cliente que executa `openclaw mcp serve`, depois verifica descoberta de conversas roteadas, leituras de transcrição, metadados de attachment, comportamento da fila de eventos live, roteamento de envio de saída e notificações no estilo Claude de canal + permissão pela bridge stdio real. A asserção de notificação do Claude lê diretamente os frames MCP stdio brutos para que o smoke reflita o que a bridge realmente emite.

## Gate local de PR

Para verificações locais de land/gate de PR, execute:

- `pnpm check`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Se `pnpm test` falhar de forma intermitente em um host carregado, execute novamente uma vez antes de tratar isso como regressão e depois isole com `pnpm test <path/to/test>`. Para hosts com pouca memória, use:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark de latência de modelo (chaves locais)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Variáveis de ambiente opcionais: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt padrão: “Reply with a single word: ok. No punctuation or extra text.”

Última execução (2025-12-31, 20 execuções):

- minimax mediana de 1279ms (mín 1114, máx 2431)
- opus mediana de 2454ms (mín 1224, máx 3170)

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
- `pnpm test:startup:bench:update` atualiza a fixture de baseline versionada em `test/fixtures/cli-startup-bench.json` usando `runs=5` e `warmup=1`

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

Esse script conduz o assistente interativo via pseudo-tty, verifica arquivos de config/workspace/sessão, depois inicia o gateway e executa `openclaw health`.

## Smoke de importação de QR (Docker)

Garante que `qrcode-terminal` carregue nos runtimes Node com suporte no Docker (Node 24 padrão, Node 22 compatível):

```bash
pnpm test:docker:qr
```
