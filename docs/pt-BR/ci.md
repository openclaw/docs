---
read_when:
    - Você precisa entender por que uma tarefa de CI foi ou não foi executada
    - Você está depurando uma verificação do GitHub Actions que está falhando
    - Você está coordenando uma execução ou reexecução da validação de lançamento
    - Você está alterando o despacho do ClawSweeper ou o encaminhamento de atividades do GitHub
summary: Grafo de jobs de CI, verificações de escopo, guarda-chuvas de lançamento e equivalentes de comandos locais
title: Pipeline de CI
x-i18n:
    generated_at: "2026-05-05T05:42:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 31fe6704e18f9efc519a1a73fc3aa8ae3909d6a27553874eb477e73979a94af2
    source_path: ci.md
    workflow: 16
---

OpenClaw CI runs on every push to `main` and every pull request. The `preflight` job classifies the diff and turns expensive lanes off when only unrelated areas changed. Manual `workflow_dispatch` runs intentionally bypass smart scoping and fan out the full graph for release candidates and broad validation. Android lanes stay opt-in through `include_android`. Release-only plugin coverage lives in the separate [`Plugin Prerelease`](#plugin-prerelease) workflow and only runs from [`Full Release Validation`](#full-release-validation) or an explicit manual dispatch.

## Pipeline overview

| Job                              | Purpose                                                                                                   | When it runs                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Detect docs-only changes, changed scopes, changed extensions, and build the CI manifest                   | Always on non-draft pushes and PRs |
| `security-scm-fast`              | Private key detection and workflow audit via `zizmor`                                                     | Always on non-draft pushes and PRs |
| `security-dependency-audit`      | Dependency-free production lockfile audit against npm advisories                                          | Always on non-draft pushes and PRs |
| `security-fast`                  | Required aggregate for the fast security jobs                                                             | Always on non-draft pushes and PRs |
| `check-dependencies`             | Production Knip dependency-only pass plus the unused-file allowlist guard                                 | Node-relevant changes              |
| `build-artifacts`                | Build `dist/`, Control UI, built-artifact checks, and reusable downstream artifacts                       | Node-relevant changes              |
| `checks-fast-core`               | Fast Linux correctness lanes such as bundled/plugin-contract/protocol checks                              | Node-relevant changes              |
| `checks-fast-contracts-channels` | Sharded channel contract checks with a stable aggregate check result                                      | Node-relevant changes              |
| `checks-node-core-test`          | Core Node test shards, excluding channel, bundled, contract, and extension lanes                          | Node-relevant changes              |
| `check`                          | Sharded main local gate equivalent: prod types, lint, guards, test types, and strict smoke                | Node-relevant changes              |
| `check-additional`               | Architecture, sharded boundary/prompt drift, extension guards, package boundary, and gateway watch        | Node-relevant changes              |
| `build-smoke`                    | Built-CLI smoke tests and startup-memory smoke                                                            | Node-relevant changes              |
| `checks`                         | Verifier for built-artifact channel tests                                                                 | Node-relevant changes              |
| `checks-node-compat-node22`      | Node 22 compatibility build and smoke lane                                                                | Manual CI dispatch for releases    |
| `check-docs`                     | Docs formatting, lint, and broken-link checks                                                             | Docs changed                       |
| `skills-python`                  | Ruff + pytest for Python-backed skills                                                                    | Python-skill-relevant changes      |
| `checks-windows`                 | Windows-specific process/path tests plus shared runtime import specifier regressions                      | Windows-relevant changes           |
| `macos-node`                     | macOS TypeScript test lane using the shared built artifacts                                               | macOS-relevant changes             |
| `macos-swift`                    | Swift lint, build, and tests for the macOS app                                                            | macOS-relevant changes             |
| `android`                        | Android unit tests for both flavors plus one debug APK build                                              | Android-relevant changes           |
| `test-performance-agent`         | Daily Codex slow-test optimization after trusted activity                                                 | Main CI success or manual dispatch |
| `openclaw-performance`           | Daily/on-demand Kova runtime performance reports with mock-provider, deep-profile, and GPT 5.4 live lanes | Scheduled and manual dispatch      |

## Fail-fast order

1. `preflight` decides which lanes exist at all. The `docs-scope` and `changed-scope` logic are steps inside this job, not standalone jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, and `skills-python` fail quickly without waiting on the heavier artifact and platform matrix jobs.
3. `build-artifacts` overlaps with the fast Linux lanes so downstream consumers can start as soon as the shared build is ready.
4. Heavier platform and runtime lanes fan out after that: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, and `android`.

GitHub may mark superseded jobs as `cancelled` when a newer push lands on the same PR or `main` ref. Treat that as CI noise unless the newest run for the same ref is also failing. Aggregate shard checks use `!cancelled() && always()` so they still report normal shard failures but do not queue after the whole workflow has already been superseded. The automatic CI concurrency key is versioned (`CI-v7-*`) so a GitHub-side zombie in an old queue group cannot indefinitely block newer main runs. Manual full-suite runs use `CI-manual-v1-*` and do not cancel in-progress runs.

## Scope and routing

Scope logic lives in `scripts/ci-changed-scope.mjs` and is covered by unit tests in `src/scripts/ci-changed-scope.test.ts`. Manual dispatch skips changed-scope detection and makes the preflight manifest act as if every scoped area changed.

- **CI workflow edits** validate the Node CI graph plus workflow linting, but do not force Windows, Android, or macOS native builds by themselves; those platform lanes stay scoped to platform source changes.
- **CI routing-only edits, selected cheap core-test fixture edits, and narrow plugin contract helper/test-routing edits** use a fast Node-only manifest path: `preflight`, security, and a single `checks-fast-core` task. That path skips build artifacts, Node 22 compatibility, channel contracts, full core shards, bundled-plugin shards, and additional guard matrices when the change is limited to the routing or helper surfaces the fast task exercises directly.
- **Windows Node checks** are scoped to Windows-specific process/path wrappers, npm/pnpm/UI runner helpers, package manager config, and the CI workflow surfaces that execute that lane; unrelated source, plugin, install-smoke, and test-only changes stay on the Linux Node lanes.

The slowest Node test families are split or balanced so each job stays small without over-reserving runners: channel contracts run as three weighted shards, core unit fast/support lanes run separately, core runtime infra is split between state and process/config shards, auto-reply runs as balanced workers (with the reply subtree split into agent-runner, dispatch, and commands/state-routing shards), and agentic gateway/server configs are split across chat/auth/model/http-plugin/runtime/startup lanes instead of waiting on built artifacts. Broad browser, QA, media, and miscellaneous plugin tests use their dedicated Vitest configs instead of the shared plugin catch-all. Include-pattern shards record timing entries using the CI shard name, so `.artifacts/vitest-shard-timings.json` can distinguish a whole config from a filtered shard. `check-additional` keeps package-boundary compile/canary work together and separates runtime topology architecture from gateway watch coverage; the boundary guard list is striped across four matrix shards, each running selected independent guards concurrently and printing per-check timings, including `pnpm prompt:snapshots:check` so Codex runtime happy-path prompt drift is pinned to the PR that caused it. Gateway watch, channel tests, and the core support-boundary shard run concurrently inside `build-artifacts` after `dist/` and `dist-runtime/` are already built.

Android CI runs both `testPlayDebugUnitTest` and `testThirdPartyDebugUnitTest` and then builds the Play debug APK. The third-party flavor has no separate source set or manifest; its unit-test lane still compiles the flavor with the SMS/call-log BuildConfig flags, while avoiding a duplicate debug APK packaging job on every Android-relevant push.

The `check-dependencies` shard runs `pnpm deadcode:dependencies` (a production Knip dependency-only pass pinned to the latest Knip version, with pnpm's minimum release age disabled for the `dlx` install) and `pnpm deadcode:unused-files`, which compares Knip's production unused-file findings against `scripts/deadcode-unused-files.allowlist.mjs`. The unused-file guard fails when a PR adds a new unreviewed unused file or leaves a stale allowlist entry, while preserving intentional dynamic plugin, generated, build, live-test, and package bridge surfaces that Knip cannot resolve statically.

## ClawSweeper activity forwarding

`.github/workflows/clawsweeper-dispatch.yml` is the target-side bridge from OpenClaw repository activity into ClawSweeper. It does not check out or execute untrusted pull request code. The workflow creates a GitHub App token from `CLAWSWEEPER_APP_PRIVATE_KEY`, then dispatches compact `repository_dispatch` payloads to `openclaw/clawsweeper`.

The workflow has four lanes:

- `clawsweeper_item` for exact issue and pull request review requests;
- `clawsweeper_comment` for explicit ClawSweeper commands in issue comments;
- `clawsweeper_commit_review` for commit-level review requests on `main` pushes;
- `github_activity` for general GitHub activity that the ClawSweeper agent may inspect.

The `github_activity` lane forwards normalized metadata only: event type, action, actor, repository, item number, URL, title, state, and short excerpts for comments or reviews when present. It intentionally avoids forwarding the full webhook body. The receiving workflow in `openclaw/clawsweeper` is `.github/workflows/github-activity.yml`, which posts the normalized event to the OpenClaw Gateway hook for the ClawSweeper agent.

General activity is observation, not delivery-by-default. The ClawSweeper agent receives the Discord target in its prompt and should post to `#clawsweeper` only when the event is surprising, actionable, risky, or operationally useful. Routine opens, edits, bot churn, duplicate webhook noise, and normal review traffic should result in `NO_REPLY`.

Treat GitHub titles, comments, bodies, review text, branch names, and commit messages as untrusted data throughout this path. They are input for summarization and triage, not instructions for the workflow or agent runtime.

## Manual dispatches

As execuções manuais de CI rodam o mesmo grafo de jobs que a CI normal, mas forçam todas as lanes com escopo não Android: shards Linux Node, shards de plugins incluídos, contratos de canais, compatibilidade com Node 22, `check`, `check-additional`, smoke de build, verificações de documentação, Skills Python, Windows, macOS e i18n da UI de controle. Execuções manuais autônomas de CI rodam somente Android com `include_android=true`; o guarda-chuva de release completo habilita Android passando `include_android=true`. As verificações estáticas de pré-release de plugins, o shard `agentic-plugins` exclusivo de release, a varredura completa em lote de extensões e as lanes Docker de pré-release de plugins são excluídas da CI. A suíte Docker de pré-release roda somente quando `Full Release Validation` despacha o workflow separado `Plugin Prerelease` com o gate de validação de release habilitado.

Execuções manuais usam um grupo de concorrência único para que uma suíte completa candidata a release não seja cancelada por outra execução de push ou PR no mesmo ref. A entrada opcional `target_ref` permite que um chamador confiável rode esse grafo contra uma branch, tag ou SHA de commit completo enquanto usa o arquivo de workflow do ref de despacho selecionado.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Executores

| Executor                         | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, jobs rápidos de segurança e agregados (`security-scm-fast`, `security-dependency-audit`, `security-fast`), verificações rápidas de protocolo/contrato/plugins incluídos, verificações de contrato de canal em shards, shards de `check` exceto lint, shards e agregados de `check-additional`, verificadores agregados de testes Node, verificações de documentação, Skills Python, workflow-sanity, labeler, auto-response; o preflight de install-smoke também usa Ubuntu hospedado pelo GitHub para que a matriz Blacksmith possa entrar na fila mais cedo |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shards de extensão mais leves, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` e `check-test-types`                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shards de teste Linux Node, shards de teste de plugins incluídos, `android`                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (sensível a CPU o bastante para que 8 vCPU custassem mais do que economizavam); builds Docker de install-smoke (o tempo de fila de 32 vCPU custava mais do que economizava)                                                                                                                                                                                                                                                                                |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` em `openclaw/openclaw`; forks voltam para `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` em `openclaw/openclaw`; forks voltam para `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |

## Equivalentes locais

```bash
pnpm changed:lanes                            # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed                            # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check                                    # fast local gate: prod tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed                              # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/build-smoke lanes matter
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## Desempenho do OpenClaw

`OpenClaw Performance` é o workflow de desempenho do produto/runtime. Ele roda diariamente em `main` e pode ser despachado manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

O despacho manual normalmente mede o benchmark do ref do workflow. Defina `target_ref` para medir uma tag de release ou outra branch com a implementação atual do workflow. Os caminhos de relatórios publicados e os ponteiros mais recentes são indexados pelo ref testado, e cada `index.md` registra o ref/SHA testado, ref/SHA do workflow, ref do Kova, perfil, modo de autenticação da lane, modelo, contagem de repetições e filtros de cenário.

O workflow instala o OCM a partir de uma release fixada e o Kova a partir de `openclaw/Kova` na entrada `kova_ref` fixada, depois roda três lanes:

- `mock-provider`: cenários diagnósticos do Kova contra um runtime de build local com autenticação falsa determinística compatível com OpenAI.
- `mock-deep-profile`: criação de perfis de CPU/heap/trace para pontos críticos de inicialização, gateway e turno de agente.
- `live-gpt54`: um turno real de agente OpenAI `openai/gpt-5.4`, ignorado quando `OPENAI_API_KEY` não está disponível.

A lane mock-provider também roda sondagens de origem nativas do OpenClaw após a passagem do Kova: tempo de boot e memória do gateway nos casos de inicialização padrão, com hook e com 50 plugins; loops repetidos de hello `channel-chat-baseline` com mock OpenAI; e comandos de inicialização da CLI contra o gateway iniciado. O resumo em Markdown da sondagem de origem fica em `source/index.md` no pacote de relatório, com o JSON bruto ao lado.

Cada lane envia artefatos do GitHub. Quando `CLAWGRIT_REPORTS_TOKEN` está configurado, o workflow também commita `report.json`, `report.md`, pacotes, `index.md` e artefatos de sondagem de origem em `openclaw/clawgrit-reports` sob `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. O ponteiro atual do ref testado é gravado como `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validação Completa de Release

`Full Release Validation` é o workflow guarda-chuva manual para "rodar tudo antes da release". Ele aceita uma branch, tag ou SHA de commit completo, despacha o workflow manual `CI` com esse alvo, despacha `Plugin Prerelease` para comprovação exclusiva de release de plugin/pacote/estática/Docker e despacha `OpenClaw Release Checks` para smoke de instalação, aceitação de pacote, verificações de pacote entre sistemas operacionais, paridade do QA Lab, Matrix e lanes do Telegram. Execuções estáveis/padrão mantêm a cobertura exaustiva live/E2E e do caminho de release Docker atrás de `run_release_soak=true`; `release_profile=full` força essa cobertura de soak para que uma validação consultiva ampla continue ampla. Com `rerun_group=all` e `release_profile=full`, ele também roda `NPM Telegram Beta E2E` contra o artefato `release-package-under-test` das verificações de release. Após a publicação, passe `npm_telegram_package_spec` para rodar novamente a mesma lane de pacote Telegram contra o pacote npm publicado.

Veja [validação completa de release](/pt-BR/reference/full-release-validation) para a
matriz de estágios, nomes exatos dos jobs de workflow, diferenças de perfil, artefatos e
identificadores de nova execução focada.

`OpenClaw Release Publish` é o workflow manual mutável de release. Despache-o
a partir de `release/YYYY.M.D` ou `main` depois que a tag de release existir e depois que o
preflight npm do OpenClaw tiver sido concluído com sucesso. Ele verifica `pnpm plugins:sync:check`,
despacha `Plugin NPM Release` para todos os pacotes de plugin publicáveis, despacha
`Plugin ClawHub Release` para o mesmo SHA de release e somente então despacha
`OpenClaw NPM Release` com o `preflight_run_id` salvo.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Para comprovação de commit fixado em uma branch que muda rapidamente, use o helper em vez de
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Refs de despacho de workflow do GitHub devem ser branches ou tags, não SHAs de commit brutos. O
helper envia uma branch temporária `release-ci/<sha>-...` no SHA alvo,
despacha `Full Release Validation` a partir desse ref fixado, verifica se cada
workflow filho `headSha` corresponde ao alvo e exclui a branch temporária quando a
execução termina. O verificador guarda-chuva também falha se qualquer workflow filho rodar em um
SHA diferente.

`release_profile` controla a amplitude live/provedor passada para as verificações de release. Os
workflows manuais de release usam `stable` por padrão; use `full` apenas quando você
quiser intencionalmente a matriz ampla de provedores/mídia consultiva. `run_release_soak`
controla se as verificações de release estáveis/padrão executam o soak exaustivo live/E2E e
do caminho de release do Docker; `full` força o soak.

- `minimum` mantém as lanes críticas de release mais rápidas do OpenAI/core.
- `stable` adiciona o conjunto estável de provedores/backends.
- `full` executa a matriz ampla de provedores/mídia consultiva.

O umbrella registra os ids das execuções filhas disparadas, e o job final `Verify full validation` verifica novamente as conclusões atuais das execuções filhas e acrescenta tabelas dos jobs mais lentos para cada execução filha. Se um workflow filho for reexecutado e ficar verde, reexecute apenas o job verificador pai para atualizar o resultado do umbrella e o resumo de tempo.

Para recuperação, tanto `Full Release Validation` quanto `OpenClaw Release Checks` aceitam `rerun_group`. Use `all` para um candidato a release, `ci` apenas para o filho normal de CI completo, `plugin-prerelease` apenas para o filho de pré-release de Plugin, `release-checks` para todos os filhos de release, ou um grupo mais estreito: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` no umbrella. Isso mantém limitada a reexecução de uma caixa de release com falha depois de uma correção focada. Para uma lane cross-OS com falha, combine `rerun_group=cross-os` com `cross_os_suite_filter`, por exemplo `windows/packaged-upgrade`; comandos cross-OS longos emitem linhas de heartbeat e os resumos de packaged-upgrade incluem tempos por fase. As lanes de QA das verificações de release são consultivas, portanto falhas apenas de QA avisam, mas não bloqueiam o verificador de release-check.

`OpenClaw Release Checks` usa a ref confiável do workflow para resolver a ref selecionada uma vez em um tarball `release-package-under-test`, depois passa esse artefato para verificações cross-OS e Package Acceptance, além do workflow Docker live/E2E do caminho de release quando a cobertura de soak é executada. Isso mantém os bytes do pacote consistentes entre as caixas de release e evita reempacotar o mesmo candidato em vários jobs filhos.

Execuções duplicadas de `Full Release Validation` para `ref=main` e `rerun_group=all`
substituem o umbrella mais antigo. O monitor pai cancela qualquer workflow filho que
ele já tenha disparado quando o pai é cancelado, para que validações mais novas da main
não fiquem atrás de uma execução obsoleta de duas horas de release-check. Validações de branch/tag
de release e grupos de reexecução focados mantêm `cancel-in-progress: false`.

## Shards live e E2E

O filho live/E2E de release mantém ampla cobertura nativa de `pnpm test:live`, mas a executa como shards nomeados por meio de `scripts/test-live-shard.mjs` em vez de um job serial:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- jobs `native-live-src-gateway-profiles` filtrados por provedor
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- shards divididos de áudio/vídeo de mídia e shards de música filtrados por provedor

Isso mantém a mesma cobertura de arquivos enquanto facilita reexecutar e diagnosticar falhas lentas de provedores live. Os nomes agregados de shard `native-live-extensions-o-z`, `native-live-extensions-media` e `native-live-extensions-media-music` continuam válidos para reexecuções manuais únicas.

Os shards nativos de mídia live executam em `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, criado pelo workflow `Live Media Runner Image`. Essa imagem pré-instala `ffmpeg` e `ffprobe`; jobs de mídia apenas verificam os binários antes da configuração. Mantenha suítes live baseadas em Docker em runners Blacksmith normais — jobs em contêiner são o lugar errado para iniciar testes Docker aninhados.

Shards live de modelos/backends baseados em Docker usam uma imagem compartilhada separada `ghcr.io/openclaw/openclaw-live-test:<sha>` por commit selecionado. O workflow live de release cria e publica essa imagem uma vez; então os shards do modelo live Docker, Gateway separado por provedor, backend CLI, bind ACP e harness Codex executam com `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shards Docker do Gateway carregam limites explícitos de `timeout` em nível de script abaixo do timeout do job do workflow para que um contêiner travado ou caminho de limpeza falhe rápido em vez de consumir todo o orçamento do release-check. Se esses shards reconstruírem independentemente o target Docker completo do código-fonte, a execução de release está mal configurada e desperdiçará tempo de relógio em builds de imagem duplicados.

## Package Acceptance

Use `Package Acceptance` quando a pergunta for "este pacote OpenClaw instalável funciona como produto?" Ela é diferente do CI normal: o CI normal valida a árvore de código-fonte, enquanto a package acceptance valida um único tarball por meio do mesmo harness Docker E2E que usuários exercitam após instalar ou atualizar.

### Jobs

1. `resolve_package` faz checkout de `workflow_ref`, resolve um candidato de pacote, grava `.artifacts/docker-e2e-package/openclaw-current.tgz`, grava `.artifacts/docker-e2e-package/package-candidate.json`, envia ambos como o artefato `package-under-test` e imprime a origem, ref do workflow, ref do pacote, versão, SHA-256 e perfil no resumo da etapa do GitHub.
2. `docker_acceptance` chama `openclaw-live-and-e2e-checks-reusable.yml` com `ref=workflow_ref` e `package_artifact_name=package-under-test`. O workflow reutilizável baixa esse artefato, valida o inventário do tarball, prepara imagens Docker com digest do pacote quando necessário e executa as lanes Docker selecionadas contra esse pacote em vez de empacotar o checkout do workflow. Quando um perfil seleciona várias `docker_lanes` direcionadas, o workflow reutilizável prepara o pacote e as imagens compartilhadas uma vez, depois espalha essas lanes como jobs Docker direcionados paralelos com artefatos únicos.
3. `package_telegram` opcionalmente chama `NPM Telegram Beta E2E`. Ele executa quando `telegram_mode` não é `none` e instala o mesmo artefato `package-under-test` quando Package Acceptance resolveu um; o dispatch standalone do Telegram ainda pode instalar uma especificação npm publicada.
4. `summary` falha o workflow se a resolução do pacote, a aceitação Docker ou a lane opcional do Telegram falhou.

### Fontes candidatas

- `source=npm` aceita apenas `openclaw@beta`, `openclaw@latest` ou uma versão exata de release do OpenClaw, como `openclaw@2026.4.27-beta.2`. Use isso para aceitação de pré-release/estável publicado.
- `source=ref` empacota uma branch, tag ou SHA completo de commit confiável de `package_ref`. O resolvedor busca branches/tags do OpenClaw, verifica se o commit selecionado é alcançável pelo histórico de branches do repositório ou por uma tag de release, instala dependências em uma worktree detached e o empacota com `scripts/package-openclaw-for-docker.mjs`.
- `source=url` baixa um `.tgz` HTTPS; `package_sha256` é obrigatório.
- `source=artifact` baixa um `.tgz` de `artifact_run_id` e `artifact_name`; `package_sha256` é opcional, mas deve ser fornecido para artefatos compartilhados externamente.

Mantenha `workflow_ref` e `package_ref` separados. `workflow_ref` é o código confiável de workflow/harness que executa o teste. `package_ref` é o commit de origem que é empacotado quando `source=ref`. Isso permite que o harness de teste atual valide commits de código-fonte confiáveis mais antigos sem executar lógica antiga de workflow.

### Perfis de suíte

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` mais `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunks completos Docker do caminho de release com OpenWebUI
- `custom` — `docker_lanes` exatas; obrigatório quando `suite_profile=custom`

O perfil `package` usa cobertura offline de Plugin para que a validação de pacote publicado não dependa da disponibilidade live do ClawHub. A lane opcional do Telegram reutiliza o artefato `package-under-test` em `NPM Telegram Beta E2E`, com o caminho da especificação npm publicada mantido para dispatches standalone.

Para a política dedicada de testes de atualização e Plugin, incluindo comandos locais,
lanes Docker, entradas de Package Acceptance, padrões de release e triagem de falhas,
consulte [Testando atualizações e plugins](/pt-BR/help/testing-updates-plugins).

As verificações de release chamam Package Acceptance com `source=artifact`, o artefato de pacote de release preparado, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` e `telegram_mode=mock-openai`. Isso mantém a prova de migração de pacote, atualização, limpeza de dependência obsoleta de Plugin, reparo de instalação de Plugin configurado, Plugin offline, atualização de Plugin e Telegram no mesmo tarball de pacote resolvido. Defina `package_acceptance_package_spec` em Full Release Validation ou OpenClaw Release Checks para executar essa mesma matriz contra um pacote npm enviado em vez do artefato construído a partir do SHA. As verificações de release cross-OS ainda cobrem comportamento específico de sistema operacional para onboarding, instalador e plataforma; a validação de produto de pacote/atualização deve começar com Package Acceptance. A lane Docker `published-upgrade-survivor` valida uma linha de base de pacote publicado por execução no caminho de release bloqueante. Em Package Acceptance, o tarball `package-under-test` resolvido é sempre o candidato e `published_upgrade_survivor_baseline` seleciona a linha de base publicada de fallback, com padrão `openclaw@latest`; comandos de reexecução de lane com falha preservam essa linha de base. Full Release Validation com `run_release_soak=true` ou `release_profile=full` define `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` e `published_upgrade_survivor_scenarios=reported-issues` para expandir pelas quatro releases npm estáveis mais recentes, além de releases fixadas de limite de compatibilidade de Plugin e fixtures no formato de issues para configuração Feishu, arquivos bootstrap/persona preservados, instalações configuradas de Plugin do OpenClaw, caminhos de log com til e raízes obsoletas de dependência legada de Plugin. Seleções multi-linha de base de published-upgrade survivor são fragmentadas por linha de base em jobs separados de runner Docker direcionado. O workflow separado `Update Migration` usa a lane Docker `update-migration` com `all-since-2026.4.23` e `plugin-deps-cleanup` quando a pergunta é limpeza exaustiva de atualizações publicadas, não a amplitude normal de CI de Full Release. Execuções agregadas locais podem passar especificações exatas de pacote com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, manter uma única lane com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, como `openclaw@2026.4.15`, ou definir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para a matriz de cenários. A lane publicada configura a linha de base com uma receita embutida de comando `openclaw config set`, registra etapas da receita em `summary.json` e verifica `/healthz`, `/readyz`, além do status RPC após o início do Gateway. As lanes fresh de pacote e instalador no Windows também verificam que um pacote instalado consegue importar uma substituição de controle de navegador a partir de um caminho absoluto bruto do Windows. O smoke de turno de agente cross-OS do OpenAI usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` por padrão quando definido, caso contrário `openai/gpt-5.4`, para que a prova de instalação e Gateway permaneça em um modelo de teste GPT-5 enquanto evita padrões GPT-4.x.

### Janelas de compatibilidade legada

Package Acceptance tem janelas limitadas de compatibilidade legada para pacotes já publicados. Pacotes até `2026.4.25`, incluindo `2026.4.25-beta.*`, podem usar o caminho de compatibilidade:

- entradas privadas conhecidas de QA em `dist/postinstall-inventory.json` podem apontar para arquivos omitidos do tarball;
- `doctor-switch` pode pular o subcaso de persistência `gateway install --wrapper` quando o pacote não expõe essa flag;
- `update-channel-switch` pode remover `pnpm.patchedDependencies` ausentes da fixture fake git derivada do tarball e pode registrar `update.channel` persistido ausente;
- smokes de Plugin podem ler locais legados de registro de instalação ou aceitar persistência ausente do registro de instalação do marketplace;
- `plugin-update` pode permitir migração de metadados de configuração enquanto ainda exige que o registro de instalação e o comportamento de não reinstalação permaneçam inalterados.

O pacote publicado `2026.4.26` também pode emitir avisos para arquivos locais de carimbo de metadados de build que já foram enviados. Pacotes posteriores devem satisfazer os contratos modernos; as mesmas condições falham em vez de avisar ou pular.

### Exemplos

```bash
# Validate the current beta package with product-level coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Pack and validate a release branch with the current harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Validate a tarball URL. SHA-256 is mandatory for source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Reuse a tarball uploaded by another Actions run.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

Ao depurar uma execução de aceitação de pacote com falha, comece pelo resumo `resolve_package` para confirmar a origem, a versão e o SHA-256 do pacote. Em seguida, inspecione a execução filha `docker_acceptance` e seus artefatos do Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logs de lanes, tempos de fase e comandos de reexecução. Prefira reexecutar o perfil de pacote com falha ou as lanes exatas do Docker em vez de reexecutar a validação completa de release.

## Smoke de instalação

O workflow separado `Install Smoke` reutiliza o mesmo script de escopo por meio do seu próprio job `preflight`. Ele divide a cobertura de smoke em `run_fast_install_smoke` e `run_full_install_smoke`.

- **Caminho rápido** é executado para pull requests que tocam superfícies de Docker/pacote, mudanças em pacote/manifesto de Plugin incluído, ou superfícies principais de Plugin/canal/Gateway/Plugin SDK que os jobs de smoke do Docker exercitam. Mudanças somente no código-fonte de Plugins incluídos, edições somente de testes e edições somente de documentação não reservam workers do Docker. O caminho rápido constrói a imagem do Dockerfile raiz uma vez, verifica a CLI, executa o smoke da CLI de exclusão de agentes em workspace compartilhado, executa o E2E de rede de Gateway em contêiner, verifica um argumento de build de extensão incluída e executa o perfil Docker limitado de Plugin incluído sob um timeout agregado de comando de 240 segundos (cada execução Docker de cenário é limitada separadamente).
- **Caminho completo** mantém a instalação de pacote QR e a cobertura Docker/de atualização do instalador para execuções noturnas agendadas, dispatches manuais, verificações de release por workflow-call e pull requests que realmente tocam superfícies de instalador/pacote/Docker. No modo completo, install-smoke prepara ou reutiliza uma imagem de smoke do Dockerfile raiz GHCR de SHA-alvo, depois executa instalação de pacote QR, smokes do Dockerfile raiz/Gateway, smokes de instalador/atualização e o E2E Docker rápido de Plugin incluído como jobs separados, para que o trabalho do instalador não espere atrás dos smokes da imagem raiz.

Pushes para `main` (incluindo commits de merge) não forçam o caminho completo; quando a lógica de escopo de mudanças solicitaria cobertura completa em um push, o workflow mantém o smoke rápido do Docker e deixa o smoke completo de instalação para a validação noturna ou de release.

O smoke lento de instalação global Bun de provedor de imagem é gateado separadamente por `run_bun_global_install_smoke`. Ele é executado no agendamento noturno e a partir do workflow de verificações de release, e dispatches manuais de `Install Smoke` podem optar por incluí-lo, mas pull requests e pushes para `main` não. Os testes Docker de QR e instalador mantêm seus próprios Dockerfiles focados em instalação.

## E2E Docker local

`pnpm test:docker:all` pré-constrói uma imagem compartilhada de teste live, empacota o OpenClaw uma vez como um tarball npm e constrói duas imagens compartilhadas de `scripts/e2e/Dockerfile`:

- um runner Node/Git básico para lanes de instalador/atualização/dependência de Plugin;
- uma imagem funcional que instala o mesmo tarball em `/app` para lanes de funcionalidade normal.

As definições de lanes Docker ficam em `scripts/lib/docker-e2e-scenarios.mjs`, a lógica do planejador fica em `scripts/lib/docker-e2e-plan.mjs`, e o runner executa apenas o plano selecionado. O agendador seleciona a imagem por lane com `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, depois executa lanes com `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parâmetros ajustáveis

| Variável                               | Padrão | Finalidade                                                                                   |
| -------------------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10     | Contagem de slots do pool principal para lanes normais.                                      |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10     | Contagem de slots do pool final sensível a provedores.                                       |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9      | Limite de lanes live simultâneas para que provedores não apliquem throttling.                 |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10     | Limite de lanes simultâneas de instalação npm.                                               |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7      | Limite de lanes simultâneas com múltiplos serviços.                                          |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000   | Intervalo entre inícios de lanes para evitar tempestades de criação do daemon Docker; defina `0` para não usar intervalo. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Timeout fallback por lane (120 minutos); lanes live/finais selecionadas usam limites mais rígidos. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset  | `1` imprime o plano do agendador sem executar lanes.                                         |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset  | Lista separada por vírgulas de lanes exatas; pula o smoke de limpeza para que agentes possam reproduzir uma lane com falha. |

Uma lane mais pesada que seu limite efetivo ainda pode iniciar a partir de um pool vazio e então roda sozinha até liberar capacidade. Os preflights agregados locais verificam Docker, removem contêineres E2E obsoletos do OpenClaw, emitem status de lanes ativas, persistem tempos de lane para ordenação do maior para o menor e, por padrão, param de agendar novas lanes em pool após a primeira falha.

### Workflow live/E2E reutilizável

O workflow live/E2E reutilizável pergunta a `scripts/test-docker-all.mjs --plan-json` qual pacote, tipo de imagem, imagem live, lane e cobertura de credenciais são necessários. `scripts/docker-e2e.mjs` então converte esse plano em saídas e resumos do GitHub. Ele empacota o OpenClaw por meio de `scripts/package-openclaw-for-docker.mjs`, baixa um artefato de pacote da execução atual ou baixa um artefato de pacote de `package_artifact_run_id`; valida o inventário do tarball; constrói e envia imagens E2E Docker GHCR básicas/funcionais marcadas com digest do pacote por meio do cache de camadas Docker do Blacksmith quando o plano precisa de lanes com pacote instalado; e reutiliza entradas `docker_e2e_bare_image`/`docker_e2e_functional_image` fornecidas ou imagens existentes com digest do pacote em vez de reconstruir. Pulls de imagem Docker são repetidos com timeout limitado de 180 segundos por tentativa para que um stream travado de registry/cache tente novamente rapidamente em vez de consumir a maior parte do caminho crítico da CI.

### Partes do caminho de release

A cobertura Docker de release executa jobs menores em partes com `OPENCLAW_SKIP_DOCKER_BUILD=1`, para que cada parte baixe apenas o tipo de imagem de que precisa e execute várias lanes pelo mesmo agendador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

As partes Docker de release atuais são `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` e `plugins-runtime-install-a` até `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` continuam sendo aliases agregados de Plugin/runtime. O alias de lane `install-e2e` continua sendo o alias agregado de reexecução manual para ambas as lanes de instalador de provedor.

OpenWebUI é incluído em `plugins-runtime-services` quando a cobertura completa de release-path o solicita, e mantém uma parte independente `openwebui` apenas para dispatches somente de OpenWebUI. Lanes de atualização de canais incluídos tentam novamente uma vez em caso de falhas transitórias de rede npm.

Cada parte envia `.artifacts/docker-tests/` com logs de lanes, tempos, `summary.json`, `failures.json`, tempos de fase, JSON do plano do agendador, tabelas de lanes lentas e comandos de reexecução por lane. A entrada `docker_lanes` do workflow executa lanes selecionadas contra as imagens preparadas em vez dos jobs em partes, o que mantém a depuração de lane com falha limitada a um job Docker direcionado e prepara, baixa ou reutiliza o artefato de pacote para essa execução; se uma lane selecionada for uma lane Docker live, o job direcionado constrói a imagem de teste live localmente para essa reexecução. Comandos gerados de reexecução por lane no GitHub incluem `package_artifact_run_id`, `package_artifact_name` e entradas de imagem preparada quando esses valores existem, para que uma lane com falha possa reutilizar exatamente o pacote e as imagens da execução com falha.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

O workflow live/E2E agendado executa diariamente a suíte Docker release-path completa.

## Pré-lançamento de Plugin

`Plugin Prerelease` é uma cobertura de produto/pacote mais cara, por isso é um workflow separado disparado por `Full Release Validation` ou por um operador explícito. Pull requests normais, pushes para `main` e dispatches manuais independentes de CI mantêm essa suíte desativada. Ele balanceia testes de Plugins incluídos entre oito workers de extensão; esses jobs de shard de extensão executam até dois grupos de configuração de Plugin por vez com um worker Vitest por grupo e um heap Node maior, para que lotes de Plugins com muitas importações não criem jobs extras de CI. O caminho Docker de pré-release exclusivo de release agrupa lanes Docker direcionadas em grupos pequenos para evitar reservar dezenas de runners para jobs de um a três minutos.

## QA Lab

QA Lab tem lanes dedicadas de CI fora do workflow principal com escopo inteligente. A paridade agentic fica aninhada sob os harnesses amplos de QA e release, não em um workflow de PR independente. Use `Full Release Validation` com `rerun_group=qa-parity` quando a paridade deve acompanhar uma execução ampla de validação.

- O workflow `QA-Lab - All Lanes` executa todas as noites em `main` e por dispatch manual; ele distribui em paralelo a lane de paridade mock, a lane Matrix live e as lanes live de Telegram e Discord. Jobs live usam o ambiente `qa-live-shared`, e Telegram/Discord usam leases do Convex.

As verificações de release executam lanes de transporte live de Matrix e Telegram com o provedor mock determinístico e modelos qualificados por mock (`mock-openai/gpt-5.5` e `mock-openai/gpt-5.5-alt`), para que o contrato de canal fique isolado da latência de modelo live e da inicialização normal do Plugin de provedor. O Gateway de transporte live desativa a busca de memória porque a paridade de QA cobre o comportamento de memória separadamente; a conectividade de provedor é coberta pelas suítes separadas de modelo live, provedor nativo e provedor Docker.

Matrix usa `--profile fast` para gates agendados e de release, adicionando `--fail-fast` apenas quando a CLI em checkout oferece suporte a isso. O padrão da CLI e a entrada manual do workflow continuam sendo `all`; dispatch manual com `matrix_profile=all` sempre divide a cobertura completa de Matrix em jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`.

`OpenClaw Release Checks` também executa as lanes críticas de release do QA Lab antes da aprovação de release; seu gate de paridade de QA executa os pacotes candidato e baseline como jobs de lane paralelos, depois baixa ambos os artefatos em um pequeno job de relatório para a comparação final de paridade.

Para PRs normais, siga evidências de CI/verificação com escopo em vez de tratar paridade como um status obrigatório.

## CodeQL

O fluxo de trabalho `CodeQL` é intencionalmente um verificador de segurança inicial e restrito, não uma varredura completa do repositório. Execuções diárias, manuais e de guarda para pull requests que não sejam rascunho examinam código de fluxos de trabalho do Actions mais as superfícies JavaScript/TypeScript de maior risco com consultas de segurança de alta confiança filtradas para `security-severity` alta/crítica.

A guarda de pull request permanece leve: ela só inicia para mudanças em `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` ou `src`, e executa a mesma matriz de segurança de alta confiança do fluxo de trabalho agendado. CodeQL para Android e macOS ficam fora dos padrões de PR.

### Categorias de segurança

| Categoria                                         | Superfície                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, segredos, sandbox, cron e linha de base do gateway                                                                            |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementação de canais core mais runtime de Plugin de canal, Gateway, Plugin SDK, segredos, pontos de contato de auditoria |
| `/codeql-security-high/network-ssrf-boundary`     | Superfícies core de SSRF, análise de IP, guarda de rede, web-fetch e política de SSRF do Plugin SDK                                 |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, auxiliares de execução de processo, entrega de saída e gates de execução de ferramentas de agentes                  |
| `/codeql-security-high/plugin-trust-boundary`     | Superfícies de confiança de instalação de Plugin, loader, manifesto, registro, instalação do gerenciador de pacotes, carregamento de fonte e contrato de pacote do Plugin SDK |

### Fragmentos de segurança específicos de plataforma

- `CodeQL Android Critical Security` — fragmento agendado de segurança do Android. Compila o aplicativo Android manualmente para CodeQL no menor runner Blacksmith Linux aceito pela sanidade do fluxo de trabalho. Envia em `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — fragmento de segurança macOS semanal/manual. Compila o aplicativo macOS manualmente para CodeQL no Blacksmith macOS, filtra resultados de build de dependências para fora do SARIF enviado e envia em `/codeql-critical-security/macos`. Mantido fora dos padrões diários porque o build macOS domina o tempo de execução mesmo quando limpo.

### Categorias de Qualidade Crítica

`CodeQL Critical Quality` é o fragmento não relacionado a segurança correspondente. Ele executa apenas consultas de qualidade JavaScript/TypeScript sem segurança e com severidade de erro em superfícies restritas de alto valor no runner Blacksmith Linux menor. Sua guarda de pull request é intencionalmente menor que o perfil agendado: PRs que não sejam rascunho executam apenas os fragmentos correspondentes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` e `plugin-sdk-reply-runtime` para execução de comandos/modelos/ferramentas de agentes e código de despacho de respostas, código de schema/migração/IO de configuração, código de auth/segredos/sandbox/segurança, runtime core de canal e Plugin de canal incluído, protocolo Gateway/método de servidor, cola de runtime/SDK de memória, entrega MCP/processo/saída, catálogo de runtime/modelos de provedor, filas de diagnósticos/entrega de sessão, loader de Plugin, contrato Plugin SDK/pacote ou mudanças no runtime de respostas do Plugin SDK. Mudanças na configuração do CodeQL e no fluxo de trabalho de qualidade executam todos os doze fragmentos de qualidade de PR.

O disparo manual aceita:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Os perfis restritos são ganchos de ensino/iteração para executar um fragmento de qualidade isoladamente.

| Categoria                                               | Superfície                                                                                                                                                       |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, segredos, sandbox, cron e código de fronteira de segurança do Gateway                                                                                       |
| `/codeql-critical-quality/config-boundary`              | Schema de configuração, migração, normalização e contratos de IO                                                                                                  |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schemas de protocolo Gateway e contratos de métodos de servidor                                                                                                   |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementação de canal core e Plugin de canal incluído                                                                                               |
| `/codeql-critical-quality/agent-runtime-boundary`       | Execução de comandos, despacho de modelo/provedor, despacho e filas de resposta automática e contratos de runtime do plano de controle ACP                         |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP e pontes de ferramentas, auxiliares de supervisão de processo e contratos de entrega de saída                                                      |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK do host de memória, facades de runtime de memória, aliases de memória do Plugin SDK, cola de ativação de runtime de memória e comandos doctor de memória       |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internos da fila de respostas, filas de entrega de sessão, auxiliares de vinculação/entrega de sessão de saída, superfícies de eventos de diagnóstico/pacote de logs e contratos da CLI doctor de sessão |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de respostas recebidas do Plugin SDK, auxiliares de payload/fragmentação/runtime de respostas, opções de resposta de canal, filas de entrega e auxiliares de vinculação de sessão/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalização de catálogo de modelos, auth e descoberta de provedores, registro de runtime de provedores, padrões/catálogos de provedores e registros de web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap da UI de controle, persistência local, fluxos de controle do Gateway e contratos de runtime do plano de controle de tarefas                             |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratos de runtime core para web fetch/search, IO de mídia, compreensão de mídia, geração de imagens e geração de mídia                                         |
| `/codeql-critical-quality/plugin-boundary`              | Contratos de loader, registro, superfície pública e ponto de entrada do Plugin SDK                                                                                |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Fonte do Plugin SDK no lado do pacote publicado e auxiliares de contrato de pacote de plugin                                                                      |

Qualidade permanece separada de segurança para que achados de qualidade possam ser agendados, medidos, desabilitados ou expandidos sem obscurecer o sinal de segurança. A expansão do CodeQL para Swift, Python e plugins incluídos deve ser adicionada de volta como trabalho de acompanhamento com escopo ou fragmentado somente depois que os perfis restritos tiverem runtime e sinal estáveis.

## Fluxos de trabalho de manutenção

### Docs Agent

O fluxo de trabalho `Docs Agent` é uma lane de manutenção Codex orientada a eventos para manter docs existentes alinhados com mudanças recém-integradas. Ele não tem agendamento puro: uma execução bem-sucedida de CI de push não bot em `main` pode dispará-lo, e o disparo manual pode executá-lo diretamente. Invocações por workflow-run são ignoradas quando `main` avançou ou quando outra execução não ignorada do Docs Agent foi criada na última hora. Quando executa, ele revisa o intervalo de commits desde o SHA de origem do Docs Agent não ignorado anterior até o `main` atual, para que uma execução horária possa cobrir todas as mudanças em main acumuladas desde a última passada de docs.

### Test Performance Agent

O fluxo de trabalho `Test Performance Agent` é uma lane de manutenção Codex orientada a eventos para testes lentos. Ele não tem agendamento puro: uma execução bem-sucedida de CI de push não bot em `main` pode dispará-lo, mas ele ignora se outra invocação por workflow-run já executou ou está executando naquele dia UTC. O disparo manual contorna esse gate de atividade diária. A lane cria um relatório de performance Vitest agrupado da suíte completa, permite que o Codex faça apenas pequenas correções de performance de testes que preservem a cobertura em vez de refatorações amplas, depois reexecuta o relatório da suíte completa e rejeita mudanças que reduzam a contagem de testes aprovados da linha de base. Se a linha de base tiver testes falhando, o Codex pode corrigir apenas falhas óbvias e o relatório da suíte completa pós-agente deve passar antes que qualquer coisa seja commitada. Quando `main` avança antes do push do bot aterrissar, a lane faz rebase do patch validado, reexecuta `pnpm check:changed` e tenta o push novamente; patches obsoletos conflitantes são ignorados. Ele usa Ubuntu hospedado no GitHub para que a ação Codex possa manter a mesma postura de segurança drop-sudo do agente de docs.

### PRs duplicados após merge

O fluxo de trabalho `Duplicate PRs After Merge` é um fluxo manual de mantenedor para limpeza de duplicados pós-landing. Ele usa dry-run por padrão e só fecha PRs explicitamente listados quando `apply=true`. Antes de modificar o GitHub, ele verifica que o PR aterrissado foi mesclado e que cada duplicado tem uma issue referenciada compartilhada ou hunks alterados sobrepostos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gates de verificação local e roteamento de mudanças

A lógica local de changed-lane vive em `scripts/changed-lanes.mjs` e é executada por `scripts/check-changed.mjs`. Esse gate de verificação local é mais rigoroso sobre fronteiras de arquitetura do que o escopo amplo da plataforma de CI:

- mudanças de produção core executam typecheck de prod core e teste core mais lint/guardas core;
- mudanças somente de teste core executam apenas typecheck de teste core mais lint core;
- mudanças de produção de extensão executam typecheck de prod de extensão e teste de extensão mais lint de extensão;
- mudanças somente de teste de extensão executam typecheck de teste de extensão mais lint de extensão;
- mudanças públicas do Plugin SDK ou de contrato de plugin expandem para typecheck de extensão porque extensões dependem desses contratos core (varreduras de extensão do Vitest permanecem trabalho de teste explícito);
- incrementos de versão somente de metadados de release executam verificações direcionadas de versão/configuração/dependência raiz;
- mudanças desconhecidas de raiz/configuração falham com segurança para todas as lanes de verificação.

O roteamento local de testes alterados vive em `scripts/test-projects.test-support.mjs` e é intencionalmente mais barato que `check:changed`: edições diretas de teste executam a si mesmas, edições de fonte preferem mapeamentos explícitos, depois testes irmãos e dependentes do grafo de importação. A configuração compartilhada de entrega em salas de grupo é um dos mapeamentos explícitos: mudanças na configuração de resposta visível de grupo, no modo de entrega de resposta de origem ou no prompt de sistema da ferramenta de mensagens passam pelos testes core de resposta mais regressões de entrega do Discord e Slack, para que uma mudança de padrão compartilhado falhe antes do primeiro push de PR. Use `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` somente quando a mudança for ampla o bastante no harness para que o conjunto mapeado barato não seja um proxy confiável.

## Validação do Testbox

Execute o Testbox a partir da raiz do repositório e prefira uma box nova já aquecida para validação ampla. Antes de gastar um gate lento em uma box que foi reutilizada, expirou ou acabou de relatar uma sincronização inesperadamente grande, execute primeiro `pnpm testbox:sanity` dentro da box.

A verificação de sanidade falha rapidamente quando arquivos obrigatórios da raiz, como `pnpm-lock.yaml`, desapareceram ou quando `git status --short` mostra pelo menos 200 exclusões rastreadas. Isso geralmente significa que o estado de sincronização remoto não é uma cópia confiável do PR; pare essa box e aqueça uma nova em vez de depurar a falha do teste do produto. Para PRs com grandes exclusões intencionais, defina `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para essa execução de sanidade.

`pnpm testbox:run` também encerra uma invocação local da CLI do Blacksmith que permanece na fase de sincronização por mais de cinco minutos sem saída pós-sincronização. Defina `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` para desativar essa proteção, ou use um valor maior em milissegundos para diffs locais incomumente grandes.

Crabbox é o wrapper de box remota pertencente ao repositório para validação Linux de mantenedores. Use-o quando uma verificação for ampla demais para um ciclo local de edição, quando a paridade com a CI importar ou quando a validação precisar de segredos, Docker, lanes de pacote, boxes reutilizáveis ou logs remotos. O backend normal do OpenClaw é `blacksmith-testbox`; a capacidade própria em AWS/Hetzner é um fallback para indisponibilidades do Blacksmith, problemas de cota ou testes explícitos com capacidade própria.

Antes de uma primeira execução, verifique o wrapper a partir da raiz do repositório:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

O wrapper do repositório recusa um binário Crabbox obsoleto que não anuncia `blacksmith-testbox`. Passe o provedor explicitamente, mesmo que `.crabbox.yaml` tenha padrões de nuvem própria.

Gate de alterações:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
```

Reexecução de teste focada:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test <path-or-filter>"
```

Suíte completa:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test"
```

Leia o resumo JSON final. Os campos úteis são `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` e `totalMs`. Execuções únicas do Crabbox com backend Blacksmith devem parar o Testbox automaticamente; se uma execução for interrompida ou a limpeza não estiver clara, inspecione as boxes ativas e pare apenas as boxes que você criou:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

Use reutilização apenas quando você precisar intencionalmente executar vários comandos na mesma box hidratada:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Se o Crabbox for a camada quebrada, mas o próprio Blacksmith funcionar, use o Blacksmith direto como um fallback restrito:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Escale para capacidade própria do Crabbox apenas quando o Blacksmith estiver fora do ar, limitado por cota, sem o ambiente necessário ou quando capacidade própria for explicitamente o objetivo:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` controla os padrões de provedor, sincronização e hidratação do GitHub Actions para lanes de nuvem própria. Ele exclui `.git` local para que o checkout hidratado do Actions mantenha seus próprios metadados Git remotos em vez de sincronizar remotos e armazenamentos de objetos locais do mantenedor, e exclui artefatos locais de runtime/build que nunca devem ser transferidos. `.github/workflows/crabbox-hydrate.yml` controla checkout, configuração de Node/pnpm, fetch de `origin/main` e repasse de ambiente não secreto para comandos `crabbox run --id <cbx_id>` em nuvem própria.

## Relacionados

- [Visão geral da instalação](/pt-BR/install)
- [Canais de desenvolvimento](/pt-BR/install/development-channels)
