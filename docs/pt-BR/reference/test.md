---
read_when:
    - Executando ou corrigindo testes
summary: Como executar testes localmente (vitest) e quando usar os modos forçado/cobertura
title: Testes
x-i18n:
    generated_at: "2026-05-02T05:56:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1100eb4c5990de1a56c8fd65c6152318316232414078cdaad122d4525bf27fee
    source_path: reference/test.md
    workflow: 16
---

- Kit completo de testes (suítes, ao vivo, Docker): [Testes](/pt-BR/help/testing)
- Validação de atualizações e pacotes de Plugin: [Testando atualizações e plugins](/pt-BR/help/testing-updates-plugins)

- `pnpm test:force`: Encerra qualquer processo de Gateway remanescente que esteja segurando a porta de controle padrão e, em seguida, executa a suíte completa do Vitest com uma porta de Gateway isolada para que os testes de servidor não entrem em conflito com uma instância em execução. Use isto quando uma execução anterior do Gateway tiver deixado a porta 18789 ocupada.
- `pnpm test:coverage`: Executa a suíte unitária com cobertura V8 (via `vitest.unit.config.ts`). Este é um gate de cobertura unitária de arquivos carregados, não cobertura de todos os arquivos do repositório inteiro. Os limites são 70% para linhas/funções/instruções e 55% para branches. Como `coverage.all` é false, o gate mede os arquivos carregados pela suíte de cobertura unitária em vez de tratar cada arquivo-fonte de lane dividida como descoberto.
- `pnpm test:coverage:changed`: Executa cobertura unitária apenas para arquivos alterados desde `origin/main`.
- `pnpm test:changed`: execução barata e inteligente de testes alterados. Ela executa alvos precisos a partir de edições diretas de testes, arquivos irmãos `*.test.ts`, mapeamentos explícitos de origem e o grafo de importação local. Alterações amplas/de configuração/de pacote são ignoradas, a menos que sejam mapeadas para testes precisos.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: execução ampla explícita de testes alterados. Use quando uma edição de harness/configuração/pacote de teste deve recorrer ao comportamento mais amplo de testes alterados do Vitest.
- `pnpm changed:lanes`: mostra as lanes arquiteturais acionadas pelo diff em relação a `origin/main`.
- `pnpm check:changed`: executa o gate inteligente de verificação de alterações para o diff em relação a `origin/main`. Ele executa typecheck, lint e comandos de guarda para as lanes arquiteturais afetadas, mas não executa testes Vitest. Use `pnpm test:changed` ou `pnpm test <target>` explícito para comprovação por testes.
- `pnpm test`: roteia alvos explícitos de arquivo/diretório por lanes Vitest com escopo. Execuções sem alvo usam grupos de shards fixos e se expandem para configurações folha para execução paralela local; o grupo de plugins sempre se expande para as configurações de shard por plugin em vez de um único processo gigante de projeto raiz.
- Execuções do wrapper de teste terminam com um resumo curto `[test] passed|failed|skipped ... in ...`. A própria linha de duração do Vitest permanece como o detalhe por shard.
- Estado de teste compartilhado do OpenClaw: use `src/test-utils/openclaw-test-state.ts` a partir do Vitest quando um teste precisar de `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture de configuração, workspace, diretório de agente ou armazenamento de perfil de autenticação isolados.
- Helpers de E2E de processo: use `test/helpers/openclaw-test-instance.ts` quando um teste E2E em nível de processo do Vitest precisar de um Gateway em execução, ambiente de CLI, captura de logs e limpeza em um só lugar.
- Helpers de E2E Docker/Bash: lanes que usam `scripts/lib/docker-e2e-image.sh` como source podem passar `docker_e2e_test_state_shell_b64 <label> <scenario>` para dentro do contêiner e decodificá-lo com `scripts/lib/openclaw-e2e-instance.sh`; scripts multi-home podem passar `docker_e2e_test_state_function_b64` e chamar `openclaw_test_state_create <label> <scenario>` em cada fluxo. Chamadores de nível mais baixo podem usar `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` para um snippet de shell dentro do contêiner, ou `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` para um arquivo de ambiente do host que possa ser carregado como source. O `--` antes de `create` impede que runtimes mais novos do Node tratem `--env-file` como uma flag do Node. Lanes Docker/Bash que iniciam um Gateway podem carregar `scripts/lib/openclaw-e2e-instance.sh` como source dentro do contêiner para resolução de entrypoint, inicialização simulada da OpenAI, inicialização do Gateway em foreground/background, probes de prontidão, exportação de ambiente de estado, dumps de logs e limpeza de processos.
- Execuções de shards completas, de plugins e com padrão de inclusão atualizam dados locais de temporização em `.artifacts/vitest-shard-timings.json`; execuções posteriores de configuração inteira usam essas temporizações para balancear shards lentos e rápidos. Shards de CI com padrão de inclusão acrescentam o nome do shard à chave de temporização, o que mantém as temporizações filtradas de shards visíveis sem substituir os dados de temporização da configuração inteira. Defina `OPENCLAW_TEST_PROJECTS_TIMINGS=0` para ignorar o artefato local de temporização.
- Arquivos de teste selecionados de `plugin-sdk` e `commands` agora são roteados por lanes leves dedicadas que mantêm apenas `test/setup.ts`, deixando os casos pesados de runtime em suas lanes existentes.
- Arquivos-fonte com testes irmãos mapeiam para esse irmão antes de recorrer a globs de diretório mais amplos. Edições de helpers em `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` e `src/plugins/contracts` usam um grafo de importação local para executar testes importadores em vez de rodar amplamente todos os shards quando o caminho de dependência é preciso.
- `auto-reply` agora também se divide em três configurações dedicadas (`core`, `top-level`, `reply`) para que o harness de resposta não domine os testes mais leves de status/token/helper de nível superior.
- A configuração base do Vitest agora usa por padrão `pool: "threads"` e `isolate: false`, com o runner não isolado compartilhado habilitado nas configurações do repositório.
- `pnpm test:channels` executa `vitest.channels.config.ts`.
- `pnpm test:extensions` e `pnpm test extensions` executam todos os shards de plugins. Plugins pesados de canais, o plugin de navegador e OpenAI executam como shards dedicados; outros grupos de plugins permanecem em lotes. Use `pnpm test extensions/<id>` para uma lane de um plugin incluído.
- `pnpm test:perf:imports`: habilita relatórios de duração de importação + detalhamento de importações do Vitest, ainda usando roteamento de lanes com escopo para alvos explícitos de arquivo/diretório.
- `pnpm test:perf:imports:changed`: o mesmo perfilamento de importação, mas apenas para arquivos alterados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` mede o desempenho do caminho roteado em modo de alterações contra a execução nativa do projeto raiz para o mesmo diff git commitado.
- `pnpm test:perf:changed:bench -- --worktree` mede o desempenho do conjunto de alterações atual da worktree sem commitar antes.
- `pnpm test:perf:profile:main`: grava um perfil de CPU da thread principal do Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: grava perfis de CPU + heap do runner unitário (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: executa serialmente cada configuração folha do Vitest da suíte completa e grava dados de duração agrupados, além de artefatos JSON/log por configuração. O Test Performance Agent usa isso como baseline antes de tentar correções de testes lentos.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: compara relatórios agrupados após uma alteração focada em desempenho.
- Integração do Gateway: opte por incluir via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e`: Executa testes smoke end-to-end do Gateway (multi-instância WS/HTTP/pareamento de node). Usa por padrão `threads` + `isolate: false` com workers adaptativos em `vitest.e2e.config.ts`; ajuste com `OPENCLAW_E2E_WORKERS=<n>` e defina `OPENCLAW_E2E_VERBOSE=1` para logs verbosos.
- `pnpm test:live`: Executa testes live de providers (minimax/zai). Requer chaves de API e `LIVE=1` (ou `*_LIVE_TEST=1` específico do provider) para deixar de pular.
- `pnpm test:docker:all`: Compila a imagem compartilhada de teste live, empacota o OpenClaw uma vez como um tarball npm, compila/reutiliza uma imagem runner básica de Node/Git mais uma imagem funcional que instala esse tarball em `/app` e, em seguida, executa lanes smoke Docker com `OPENCLAW_SKIP_DOCKER_BUILD=1` por meio de um scheduler ponderado. A imagem básica (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) é usada para lanes de instalador/atualização/dependência de plugin; essas lanes montam o tarball pré-compilado em vez de usar fontes copiadas do repositório. A imagem funcional (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) é usada para lanes normais de funcionalidade do app compilado. `scripts/package-openclaw-for-docker.mjs` é o único empacotador local/CI de pacotes e valida o tarball mais `dist/postinstall-inventory.json` antes de o Docker consumi-lo. Definições de lanes Docker vivem em `scripts/lib/docker-e2e-scenarios.mjs`; a lógica do planejador vive em `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` executa o plano selecionado. `node scripts/test-docker-all.mjs --plan-json` emite o plano de CI controlado pelo scheduler para lanes selecionadas, tipos de imagem, necessidades de pacote/imagem live, cenários de estado e verificações de credenciais sem compilar nem executar Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` controla slots de processo e usa 10 por padrão; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` controla o pool final sensível a providers e usa 10 por padrão. Limites de lanes pesadas usam por padrão `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; limites de providers usam por padrão uma lane pesada por provider via `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` e `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Use `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` para hosts maiores. Se uma lane exceder o limite efetivo de peso ou recurso em um host de baixo paralelismo, ela ainda pode iniciar a partir de um pool vazio e será executada sozinha até liberar capacidade. Os inícios de lanes são escalonados em 2 segundos por padrão para evitar tempestades de criação no daemon Docker local; substitua com `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. O runner faz preflight do Docker por padrão, limpa contêineres E2E obsoletos do OpenClaw, emite status de lanes ativas a cada 30 segundos, compartilha caches de ferramentas CLI de providers entre lanes compatíveis, tenta novamente uma vez por padrão falhas transitórias de providers live (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) e armazena temporizações de lanes em `.artifacts/docker-tests/lane-timings.json` para ordenação do mais longo primeiro em execuções posteriores. Use `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir o manifesto de lanes sem executar Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` para ajustar a saída de status ou `OPENCLAW_DOCKER_ALL_TIMINGS=0` para desabilitar a reutilização de temporizações. Use `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` apenas para lanes determinísticas/locais ou `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` apenas para lanes de providers live; aliases de pacote são `pnpm test:docker:local:all` e `pnpm test:docker:live:all`. O modo somente live mescla lanes live principais e finais em um pool único do mais longo primeiro para que buckets de providers possam agrupar trabalho de Claude, Codex e Gemini juntos. O runner para de agendar novas lanes em pool após a primeira falha, a menos que `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` esteja definido, e cada lane tem um timeout fallback de 120 minutos que pode ser substituído com `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; lanes live/finais selecionadas usam limites por lane mais restritos. Comandos de configuração Docker de backend CLI têm seu próprio timeout via `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (padrão 180). Logs por lane, `summary.json`, `failures.json` e temporizações de fases são gravados em `.artifacts/docker-tests/<run-id>/`; use `pnpm test:docker:timings <summary.json>` para inspecionar lanes lentas e `pnpm test:docker:rerun <run-id|summary.json|failures.json>` para imprimir comandos baratos de reexecução direcionada.
- `pnpm test:docker:browser-cdp-snapshot`: Compila um contêiner E2E de origem com suporte a Chromium, inicia CDP bruto mais um Gateway isolado, executa `browser doctor --deep` e verifica que snapshots de função CDP incluem URLs de links, clicáveis promovidos por cursor, refs de iframe e metadados de frame.
- Probes Docker live de backend CLI podem ser executados como lanes focadas, por exemplo `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` ou `pnpm test:docker:live-cli-backend:codex:mcp`. Claude e Gemini têm aliases `:resume` e `:mcp` correspondentes.
- `pnpm test:docker:openwebui`: Inicia OpenClaw + Open WebUI em Docker, faz login pelo Open WebUI, verifica `/api/models` e, em seguida, executa um chat real via proxy por `/api/chat/completions`. Requer uma chave de modelo live utilizável (por exemplo, OpenAI em `~/.profile`), puxa uma imagem externa do Open WebUI e não se espera que seja estável em CI como as suítes unitárias/e2e normais.
- `pnpm test:docker:mcp-channels`: Inicia um contêiner de Gateway semeado e um segundo contêiner cliente que invoca `openclaw mcp serve`; então verifica descoberta de conversas roteadas, leituras de transcritos, metadados de anexos, comportamento de fila de eventos live, roteamento de envio de saída e notificações de canal + permissão no estilo Claude pela ponte stdio real. A asserção de notificação do Claude lê diretamente os frames MCP stdio brutos, então o smoke reflete o que a ponte realmente emite.
- `pnpm test:docker:upgrade-survivor`: Instala o tarball empacotado do OpenClaw sobre uma fixture suja de usuário antigo, executa a atualização do pacote mais o doctor não interativo sem chaves de provedor ou canal ao vivo, depois inicia um Gateway em loopback e verifica se agentes, configuração de canal, listas de permissões de plugins, arquivos de workspace/sessão, estado obsoleto de dependências de plugins legados, inicialização e status de RPC sobrevivem.
- `pnpm test:docker:published-upgrade-survivor`: Instala `openclaw@latest` por padrão, semeia arquivos realistas de usuário existente sem chaves de provedor ou canal ao vivo, configura essa linha de base com uma receita incorporada de comando `openclaw config set`, atualiza essa instalação publicada para o tarball empacotado do OpenClaw, executa o doctor não interativo, grava `.artifacts/upgrade-survivor/summary.json`, depois inicia um Gateway em loopback e verifica se intents configuradas, arquivos de workspace/sessão, configuração obsoleta de plugins e estado de dependências legadas, inicialização, `/healthz`, `/readyz` e status de RPC sobrevivem ou são reparados corretamente. Substitua uma linha de base com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, expanda uma matriz exata com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ou adicione fixtures de cenário com `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; Package Acceptance expõe esses valores como `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` e `published_upgrade_survivor_scenarios`.
- `pnpm test:docker:update-migration`: Executa o harness de sobrevivência de upgrade publicado no cenário `plugin-deps-cleanup`, com uso intenso de limpeza, começando em `openclaw@2026.4.23` por padrão. O workflow separado `Update Migration` expande esta faixa com `baselines=all-since-2026.4.23`, para que todo pacote publicado estável a partir da `.23` seja atualizado para o candidato e comprove a limpeza de dependências de plugins configurados fora do Full Release CI.
- `pnpm test:docker:plugins`: Executa smoke de instalação/atualização para caminho local, pacotes `file:`, pacotes do registro npm com dependências hoisted, refs móveis do git, fixtures do ClawHub, atualizações de marketplace e habilitação/inspeção do pacote Claude.

## Gate local de PR

Para verificações locais de merge/gate de PR, execute:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Se `pnpm test` falhar de forma intermitente em um host sobrecarregado, execute novamente uma vez antes de tratar como regressão e, em seguida, isole com `pnpm test <path/to/test>`. Para hosts com memória restrita, use:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark de latência de modelo (chaves locais)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env opcional: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
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

A saída inclui `sampleCount`, média, p50, p95, mín./máx., distribuição de código de saída/sinal e resumos de RSS máximo para cada comando. `--cpu-prof-dir` / `--heap-prof-dir` opcionais gravam perfis V8 por execução, de modo que a medição de tempo e a captura de perfis usem o mesmo harness.

Convenções de saída salva:

- `pnpm test:startup:bench:smoke` grava o artefato de smoke direcionado em `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` grava o artefato da suíte completa em `.artifacts/cli-startup-bench-all.json` usando `runs=5` e `warmup=1`
- `pnpm test:startup:bench:update` atualiza a fixture de baseline versionada em `test/fixtures/cli-startup-bench.json` usando `runs=5` e `warmup=1`

Fixture versionada:

- `test/fixtures/cli-startup-bench.json`
- Atualize com `pnpm test:startup:bench:update`
- Compare os resultados atuais com a fixture usando `pnpm test:startup:bench:check`

## E2E de onboarding (Docker)

Docker é opcional; isto só é necessário para testes de smoke de onboarding conteinerizados.

Fluxo completo de inicialização a frio em um contêiner Linux limpo:

```bash
scripts/e2e/onboard-docker.sh
```

Este script conduz o assistente interativo por meio de um pseudo-tty, verifica arquivos de configuração/workspace/sessão, depois inicia o Gateway e executa `openclaw health`.

## Smoke de importação de QR (Docker)

Garante que o helper de runtime de QR mantido seja carregado nos runtimes Node Docker compatíveis (Node 24 por padrão, Node 22 compatível):

```bash
pnpm test:docker:qr
```

## Relacionados

- [Testes](/pt-BR/help/testing)
- [Testes ao vivo](/pt-BR/help/testing-live)
- [Testes de atualizações e plugins](/pt-BR/help/testing-updates-plugins)
