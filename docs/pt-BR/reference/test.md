---
read_when:
    - Executando ou corrigindo testes
summary: Como executar testes localmente (vitest) e quando usar os modos de força/cobertura
title: Testes
x-i18n:
    generated_at: "2026-04-30T18:38:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 131f2bad3b2806d28394213cec38d632d106ddbf8ff04d06345ab8046fb8bcf2
    source_path: reference/test.md
    workflow: 16
---

- Kit completo de testes (suítes, ao vivo, Docker): [Testes](/pt-BR/help/testing)

- `pnpm test:force`: Encerra qualquer processo de Gateway remanescente que esteja ocupando a porta de controle padrão e, em seguida, executa a suíte Vitest completa com uma porta de Gateway isolada para que testes de servidor não colidam com uma instância em execução. Use isto quando uma execução anterior do Gateway deixou a porta 18789 ocupada.
- `pnpm test:coverage`: Executa a suíte unitária com cobertura V8 (via `vitest.unit.config.ts`). Este é um gate de cobertura unitária de arquivos carregados, não cobertura de todos os arquivos do repositório inteiro. Os limites são 70% para linhas/funções/instruções e 55% para branches. Como `coverage.all` é false, o gate mede arquivos carregados pela suíte de cobertura unitária em vez de tratar cada arquivo-fonte de lane dividida como não coberto.
- `pnpm test:coverage:changed`: Executa cobertura unitária apenas para arquivos alterados desde `origin/main`.
- `pnpm test:changed`: execução barata e inteligente de testes alterados. Ela executa alvos precisos a partir de edições diretas em testes, arquivos `*.test.ts` irmãos, mapeamentos explícitos de código-fonte e o grafo de imports local. Alterações amplas/de configuração/de pacote são ignoradas, a menos que mapeiem para testes precisos.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: execução ampla explícita de testes alterados. Use quando uma edição de harness/configuração/pacote de teste deve voltar ao comportamento mais amplo de testes alterados do Vitest.
- `pnpm changed:lanes`: mostra as lanes arquiteturais acionadas pelo diff contra `origin/main`.
- `pnpm check:changed`: executa o gate inteligente de verificação de alterações para o diff contra `origin/main`. Ele executa comandos de typecheck, lint e guard para as lanes arquiteturais afetadas, mas não executa testes Vitest. Use `pnpm test:changed` ou `pnpm test <target>` explícito para prova de teste.
- `pnpm test`: direciona alvos explícitos de arquivo/diretório por lanes Vitest com escopo. Execuções sem alvo usam grupos fixos de shards e se expandem para configurações folha para execução paralela local; o grupo de plugins sempre se expande para as configurações de shard por plugin, em vez de um único processo gigante de projeto raiz.
- Execuções do wrapper de teste terminam com um breve resumo `[test] passed|failed|skipped ... in ...`. A própria linha de duração do Vitest permanece como detalhe por shard.
- Estado de teste compartilhado do OpenClaw: use `src/test-utils/openclaw-test-state.ts` a partir do Vitest quando um teste precisar de um `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture de configuração, workspace, diretório de agente ou armazenamento de perfil de autenticação isolado.
- Helpers de E2E de processo: use `test/helpers/openclaw-test-instance.ts` quando um teste E2E em nível de processo do Vitest precisar de um Gateway em execução, ambiente de CLI, captura de logs e limpeza em um só lugar.
- Helpers de E2E Docker/Bash: lanes que carregam `scripts/lib/docker-e2e-image.sh` podem passar `docker_e2e_test_state_shell_b64 <label> <scenario>` para dentro do contêiner e decodificá-lo com `scripts/lib/openclaw-e2e-instance.sh`; scripts com múltiplos homes podem passar `docker_e2e_test_state_function_b64` e chamar `openclaw_test_state_create <label> <scenario>` em cada fluxo. Chamadores de nível mais baixo podem usar `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` para um snippet de shell dentro do contêiner, ou `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` para um arquivo de ambiente do host que pode ser carregado. O `--` antes de `create` impede que runtimes Node mais novos tratem `--env-file` como uma flag do Node. Lanes Docker/Bash que iniciam um Gateway podem carregar `scripts/lib/openclaw-e2e-instance.sh` dentro do contêiner para resolução de entrypoint, inicialização mock do OpenAI, inicialização do Gateway em foreground/background, probes de prontidão, exportação de ambiente de estado, dumps de log e limpeza de processos.
- Execuções completas, de plugin e de shard com padrão de inclusão atualizam dados de timing locais em `.artifacts/vitest-shard-timings.json`; execuções posteriores de configuração inteira usam esses timings para equilibrar shards lentos e rápidos. Shards de CI com padrão de inclusão acrescentam o nome do shard à chave de timing, o que mantém timings de shards filtrados visíveis sem substituir dados de timing de configuração inteira. Defina `OPENCLAW_TEST_PROJECTS_TIMINGS=0` para ignorar o artefato local de timing.
- Arquivos de teste selecionados de `plugin-sdk` e `commands` agora são roteados por lanes leves dedicadas que mantêm apenas `test/setup.ts`, deixando casos pesados de runtime nas lanes existentes.
- Arquivos-fonte com testes irmãos mapeiam para esse irmão antes de voltar a globs de diretório mais amplos. Edições de helpers em `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` e `src/plugins/contracts` usam um grafo de imports local para executar testes que os importam, em vez de executar amplamente todos os shards quando o caminho de dependência é preciso.
- `auto-reply` agora também se divide em três configurações dedicadas (`core`, `top-level`, `reply`) para que o harness de resposta não domine os testes mais leves de status/token/helper de nível superior.
- A configuração base do Vitest agora usa por padrão `pool: "threads"` e `isolate: false`, com o runner não isolado compartilhado habilitado nas configurações do repositório.
- `pnpm test:channels` executa `vitest.channels.config.ts`.
- `pnpm test:extensions` e `pnpm test extensions` executam todos os shards de extensões/plugins. Plugins de canal pesados, o Plugin de navegador e OpenAI executam como shards dedicados; outros grupos de plugins permanecem em lotes. Use `pnpm test extensions/<id>` para uma lane de um Plugin incluído.
- `pnpm test:perf:imports`: habilita relatórios de duração de import e detalhamento de imports do Vitest, ainda usando roteamento de lanes com escopo para alvos explícitos de arquivo/diretório.
- `pnpm test:perf:imports:changed`: o mesmo profiling de imports, mas apenas para arquivos alterados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` mede o caminho roteado em modo de alterações contra a execução nativa de projeto raiz para o mesmo diff git commitado.
- `pnpm test:perf:changed:bench -- --worktree` mede o conjunto de alterações da worktree atual sem exigir commit primeiro.
- `pnpm test:perf:profile:main`: grava um perfil de CPU para a thread principal do Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: grava perfis de CPU + heap para o runner unitário (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: executa serialmente todas as configurações folha do Vitest da suíte completa e grava dados de duração agrupados, além de artefatos JSON/log por configuração. O Test Performance Agent usa isto como sua linha de base antes de tentar correções de testes lentos.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: compara relatórios agrupados após uma alteração focada em desempenho.
- Integração do Gateway: opte explicitamente via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e`: Executa testes smoke end-to-end do Gateway (pareamento multi-instância WS/HTTP/node). Usa por padrão `threads` + `isolate: false` com workers adaptativos em `vitest.e2e.config.ts`; ajuste com `OPENCLAW_E2E_WORKERS=<n>` e defina `OPENCLAW_E2E_VERBOSE=1` para logs verbosos.
- `pnpm test:live`: Executa testes live de provider (minimax/zai). Exige chaves de API e `LIVE=1` (ou `*_LIVE_TEST=1` específico do provider) para deixar de ser ignorado.
- `pnpm test:docker:all`: Compila a imagem compartilhada de testes live, empacota o OpenClaw uma vez como tarball npm, compila/reusa uma imagem runner Node/Git básica mais uma imagem funcional que instala esse tarball em `/app` e, em seguida, executa lanes smoke de Docker com `OPENCLAW_SKIP_DOCKER_BUILD=1` por meio de um escalonador ponderado. A imagem básica (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) é usada para lanes de instalador/atualização/dependência de Plugin; essas lanes montam o tarball pré-compilado em vez de usar fontes copiadas do repositório. A imagem funcional (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) é usada para lanes normais de funcionalidade do app compilado. `scripts/package-openclaw-for-docker.mjs` é o único empacotador local/CI e valida o tarball mais `dist/postinstall-inventory.json` antes que o Docker o consuma. As definições de lanes Docker ficam em `scripts/lib/docker-e2e-scenarios.mjs`; a lógica do planejador fica em `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` executa o plano selecionado. `node scripts/test-docker-all.mjs --plan-json` emite o plano de CI controlado pelo escalonador para lanes selecionadas, tipos de imagem, necessidades de pacote/imagem live, cenários de estado e verificações de credenciais sem compilar nem executar Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` controla slots de processo e usa 10 por padrão; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` controla o pool final sensível a provider e usa 10 por padrão. Os limites de lanes pesadas usam por padrão `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; os limites de provider usam por padrão uma lane pesada por provider via `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` e `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Use `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` para hosts maiores. Se uma lane exceder o peso efetivo ou o limite de recursos em um host de baixo paralelismo, ela ainda pode iniciar a partir de um pool vazio e será executada sozinha até liberar capacidade. O início das lanes é escalonado em 2 segundos por padrão para evitar tempestades de criação no daemon Docker local; sobrescreva com `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. O runner faz preflight do Docker por padrão, limpa contêineres E2E antigos do OpenClaw, emite status de lanes ativas a cada 30 segundos, compartilha caches de ferramentas CLI de provider entre lanes compatíveis, tenta novamente falhas transitórias de provider live uma vez por padrão (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) e armazena timings de lanes em `.artifacts/docker-tests/lane-timings.json` para ordenação do mais longo para o mais curto em execuções posteriores. Use `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir o manifesto de lanes sem executar Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` para ajustar a saída de status ou `OPENCLAW_DOCKER_ALL_TIMINGS=0` para desabilitar a reutilização de timings. Use `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` apenas para lanes determinísticas/locais ou `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` apenas para lanes de provider live; os aliases de pacote são `pnpm test:docker:local:all` e `pnpm test:docker:live:all`. O modo apenas live combina lanes live principais e finais em um único pool do mais longo para o mais curto, para que buckets de provider possam agrupar trabalho de Claude, Codex e Gemini juntos. O runner para de agendar novas lanes em pool após a primeira falha, a menos que `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` esteja definido, e cada lane tem um timeout fallback de 120 minutos, sobrescritível com `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; lanes live/finais selecionadas usam limites por lane mais rígidos. Comandos de configuração Docker de backend CLI têm seu próprio timeout via `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (padrão 180). Logs por lane, `summary.json`, `failures.json` e timings de fases são gravados em `.artifacts/docker-tests/<run-id>/`; use `pnpm test:docker:timings <summary.json>` para inspecionar lanes lentas e `pnpm test:docker:rerun <run-id|summary.json|failures.json>` para imprimir comandos baratos de reexecução direcionada.
- `pnpm test:docker:browser-cdp-snapshot`: Compila um contêiner E2E de fonte com Chromium, inicia CDP bruto mais um Gateway isolado, executa `browser doctor --deep` e verifica se snapshots de papel do CDP incluem URLs de links, elementos clicáveis promovidos por cursor, refs de iframe e metadados de frame.
- Probes Docker live de backend CLI podem ser executados como lanes focadas, por exemplo `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` ou `pnpm test:docker:live-cli-backend:codex:mcp`. Claude e Gemini têm aliases `:resume` e `:mcp` correspondentes.
- `pnpm test:docker:openwebui`: Inicia OpenClaw + Open WebUI em Docker, faz login pelo Open WebUI, verifica `/api/models` e, em seguida, executa um chat real proxyado por `/api/chat/completions`. Exige uma chave de modelo live utilizável (por exemplo OpenAI em `~/.profile`), baixa uma imagem externa do Open WebUI e não se espera que seja estável em CI como as suítes unit/e2e normais.
- `pnpm test:docker:mcp-channels`: Inicia um contêiner de Gateway com seed e um segundo contêiner cliente que executa `openclaw mcp serve`; em seguida, verifica descoberta de conversas roteadas, leituras de transcrição, metadados de anexos, comportamento da fila de eventos live, roteamento de envio de saída e notificações de canal + permissão ao estilo Claude pela ponte stdio real. A asserção de notificação do Claude lê diretamente os frames MCP stdio brutos para que o smoke reflita o que a ponte realmente emite.
- `pnpm test:docker:upgrade-survivor`: Instala o tarball empacotado do OpenClaw sobre um fixture sujo de usuário antigo, executa a atualização do pacote mais o doctor não interativo sem chaves de provedor ou canal ao vivo, depois inicia um Gateway de local loopback e verifica se agentes, configuração de canal, listas de permissões de Plugin, arquivos de workspace/sessão, estado obsoleto de runtime-deps de Plugin, inicialização e status de RPC sobrevivem.

## Gate de PR local

Para verificações locais de land/gate de PR, execute:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Se `pnpm test` apresentar flakes em um host carregado, execute novamente uma vez antes de tratar como regressão; depois, isole com `pnpm test <path/to/test>`. Para hosts com restrição de memória, use:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Bench de latência de modelo (chaves locais)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env opcionais: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt padrão: “Responda com uma única palavra: ok. Sem pontuação nem texto extra.”

Última execução (2025-12-31, 20 execuções):

- minimax mediana 1279ms (mín. 1114, máx. 2431)
- opus mediana 2454ms (mín. 1224, máx. 3170)

## Bench de inicialização da CLI

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

A saída inclui `sampleCount`, média, p50, p95, mín./máx., distribuição de código de saída/sinal e resumos de RSS máximo para cada comando. `--cpu-prof-dir` / `--heap-prof-dir` opcionais gravam perfis V8 por execução, para que a medição de tempo e a captura de perfil usem o mesmo harness.

Convenções de saída salva:

- `pnpm test:startup:bench:smoke` grava o artefato de smoke direcionado em `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` grava o artefato da suíte completa em `.artifacts/cli-startup-bench-all.json` usando `runs=5` e `warmup=1`
- `pnpm test:startup:bench:update` atualiza o fixture de baseline versionado em `test/fixtures/cli-startup-bench.json` usando `runs=5` e `warmup=1`

Fixture versionado:

- `test/fixtures/cli-startup-bench.json`
- Atualize com `pnpm test:startup:bench:update`
- Compare os resultados atuais com o fixture usando `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker é opcional; isso só é necessário para testes de smoke de onboarding em contêiner.

Fluxo completo de cold-start em um contêiner Linux limpo:

```bash
scripts/e2e/onboard-docker.sh
```

Este script conduz o assistente interativo por meio de um pseudo-tty, verifica arquivos de configuração/workspace/sessão, depois inicia o Gateway e executa `openclaw health`.

## Smoke de importação de QR (Docker)

Garante que o helper mantido de runtime de QR seja carregado nos runtimes Node Docker compatíveis (Node 24 por padrão, Node 22 compatível):

```bash
pnpm test:docker:qr
```

## Relacionado

- [Testes](/pt-BR/help/testing)
- [Testes live](/pt-BR/help/testing-live)
