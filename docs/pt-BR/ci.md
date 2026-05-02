---
read_when:
    - Você precisa entender por que um trabalho de CI foi ou não executado
    - Você está depurando uma verificação do GitHub Actions com falha
    - Você está coordenando uma execução ou reexecução de validação de lançamento
    - Você está alterando o despacho do ClawSweeper ou o encaminhamento de atividade do GitHub
summary: Grafo de jobs de CI, gates de escopo, guarda-chuvas de lançamento e equivalentes de comandos locais
title: pipeline de CI
x-i18n:
    generated_at: "2026-05-02T05:42:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2da3014e67b8d2d4bb4c1c9d4c6134eed29309bb176544864df568809ae3ac7
    source_path: ci.md
    workflow: 16
---

OpenClaw CI é executado em cada push para `main` e em cada pull request. O job `preflight` classifica o diff e desativa lanes caras quando apenas áreas não relacionadas mudaram. Execuções manuais por `workflow_dispatch` ignoram intencionalmente o escopo inteligente e expandem o grafo completo para candidatos a release e validação ampla. As lanes Android continuam opt-in por meio de `include_android`. A cobertura de plugins exclusiva de release fica no workflow separado [`Pré-release de Plugin`](#plugin-prerelease) e só é executada a partir de [`Validação Completa de Release`](#full-release-validation) ou de um dispatch manual explícito.

## Visão geral do pipeline

| Job                              | Finalidade                                                                                   | Quando é executado                 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Detectar mudanças apenas em docs, escopos alterados, extensões alteradas e montar o manifesto de CI | Sempre em pushes e PRs não draft |
| `security-scm-fast`              | Detecção de chave privada e auditoria de workflow via `zizmor`                                | Sempre em pushes e PRs não draft |
| `security-dependency-audit`      | Auditoria do lockfile de produção, sem dependências, contra advisories do npm                 | Sempre em pushes e PRs não draft |
| `security-fast`                  | Agregado obrigatório para os jobs rápidos de segurança                                        | Sempre em pushes e PRs não draft |
| `check-dependencies`             | Passagem somente de dependências do Knip de produção mais o guard da allowlist de arquivos não usados | Mudanças relevantes para Node |
| `build-artifacts`                | Criar `dist/`, Control UI, verificações de artefatos gerados e artefatos reutilizáveis downstream | Mudanças relevantes para Node |
| `checks-fast-core`               | Lanes rápidas de correção no Linux, como verificações bundled/plugin-contract/protocol        | Mudanças relevantes para Node |
| `checks-fast-contracts-channels` | Verificações de contrato de canais em shards com um resultado agregado estável                | Mudanças relevantes para Node |
| `checks-node-core-test`          | Shards de teste do Core Node, excluindo lanes de canal, bundled, contrato e extensão          | Mudanças relevantes para Node |
| `check`                          | Equivalente ao gate local principal em shards: tipos de prod, lint, guards, tipos de teste e smoke estrito | Mudanças relevantes para Node |
| `check-additional`               | Shards de arquitetura, limites, guards de superfície de extensão, limite de pacote e gateway-watch | Mudanças relevantes para Node |
| `build-smoke`                    | Testes smoke da CLI gerada e smoke de memória de inicialização                                | Mudanças relevantes para Node |
| `checks`                         | Verificador para testes de canais com artefatos gerados                                       | Mudanças relevantes para Node |
| `checks-node-compat-node22`      | Lane de build e smoke de compatibilidade com Node 22                                          | Dispatch manual de CI para releases |
| `check-docs`                     | Formatação de docs, lint e verificações de links quebrados                                    | Docs alteradas                     |
| `skills-python`                  | Ruff + pytest para Skills apoiadas por Python                                                 | Mudanças relevantes para Skills Python |
| `checks-windows`                 | Testes específicos de processo/caminho no Windows mais regressões compartilhadas de especificadores de importação em runtime | Mudanças relevantes para Windows |
| `macos-node`                     | Lane de testes TypeScript no macOS usando os artefatos gerados compartilhados                 | Mudanças relevantes para macOS     |
| `macos-swift`                    | Swift lint, build e testes para o app macOS                                                   | Mudanças relevantes para macOS     |
| `android`                        | Testes unitários Android para ambos os flavors mais um build de APK debug                     | Mudanças relevantes para Android   |
| `test-performance-agent`         | Otimização diária de testes lentos do Codex após atividade confiável                          | Sucesso da CI principal ou dispatch manual |

## Ordem de fail-fast

1. `preflight` decide quais lanes existem. A lógica de `docs-scope` e `changed-scope` é composta por etapas dentro desse job, não jobs independentes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falham rapidamente sem esperar pelos jobs mais pesados de artefatos e matriz de plataformas.
3. `build-artifacts` se sobrepõe às lanes rápidas do Linux para que consumidores downstream possam iniciar assim que o build compartilhado estiver pronto.
4. Lanes mais pesadas de plataforma e runtime se expandem depois disso: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

O GitHub pode marcar jobs substituídos como `cancelled` quando um push mais novo chega no mesmo PR ou ref `main`. Trate isso como ruído de CI, a menos que a execução mais recente para a mesma ref também esteja falhando. Verificações agregadas de shards usam `!cancelled() && always()` para ainda reportarem falhas normais de shards, mas não entrarem na fila depois que todo o workflow já foi substituído. A chave de concorrência automática da CI é versionada (`CI-v7-*`), para que um zumbi do lado do GitHub em um grupo de fila antigo não bloqueie indefinidamente execuções mais novas na main. Execuções manuais da suíte completa usam `CI-manual-v1-*` e não cancelam execuções em andamento.

## Escopo e roteamento

A lógica de escopo fica em `scripts/ci-changed-scope.mjs` e é coberta por testes unitários em `src/scripts/ci-changed-scope.test.ts`. Dispatch manual pula a detecção de changed-scope e faz o manifesto de preflight agir como se todas as áreas com escopo tivessem mudado.

- **Edições de workflow de CI** validam o grafo de CI do Node mais o lint de workflows, mas não forçam builds nativos de Windows, Android ou macOS por si só; essas lanes de plataforma permanecem escopadas a mudanças de código-fonte da plataforma.
- **Edições apenas de roteamento de CI, edições baratas selecionadas de fixtures de teste do core e edições estreitas em helpers/roteamento de testes de contrato de plugins** usam um caminho rápido de manifesto somente Node: `preflight`, segurança e uma única tarefa `checks-fast-core`. Esse caminho pula artefatos de build, compatibilidade com Node 22, contratos de canais, shards completos do core, shards de plugins bundled e matrizes adicionais de guards quando a mudança se limita às superfícies de roteamento ou helper que a tarefa rápida exercita diretamente.
- **Verificações Node no Windows** são escopadas a wrappers de processo/caminho específicos do Windows, helpers de runner npm/pnpm/UI, configuração de gerenciador de pacotes e superfícies de workflow de CI que executam essa lane; mudanças não relacionadas de código-fonte, plugin, install-smoke e somente testes permanecem nas lanes Node do Linux.

As famílias mais lentas de testes Node são divididas ou balanceadas para que cada job permaneça pequeno sem reservar runners em excesso: contratos de canais rodam como três shards ponderados, lanes pequenas de unidades do core são pareadas, auto-reply roda como quatro workers balanceados (com a subárvore de reply dividida em shards de agent-runner, dispatch e commands/state-routing), e configurações agentic de Gateway/plugin são distribuídas pelos jobs Node agentic somente de código-fonte existentes em vez de esperar por artefatos gerados. Testes amplos de navegador, QA, mídia e plugins diversos usam suas configs Vitest dedicadas em vez do catch-all compartilhado de plugins. Shards com padrões de inclusão registram entradas de timing usando o nome do shard de CI, para que `.artifacts/vitest-shard-timings.json` possa distinguir uma configuração inteira de um shard filtrado. `check-additional` mantém o trabalho de compilação/canary de limite de pacote junto e separa a arquitetura de topologia de runtime da cobertura de gateway watch; o shard de guard de limite executa seus pequenos guards independentes concorrentemente dentro de um job. Gateway watch, testes de canais e o shard de limite de suporte do core rodam concorrentemente dentro de `build-artifacts` depois que `dist/` e `dist-runtime/` já foram gerados.

A CI Android executa `testPlayDebugUnitTest` e `testThirdPartyDebugUnitTest` e depois cria o APK debug Play. O flavor third-party não tem source set ou manifesto separado; sua lane de testes unitários ainda compila o flavor com as flags BuildConfig de SMS/call-log, enquanto evita um job duplicado de empacotamento de APK debug em cada push relevante para Android.

O shard `check-dependencies` executa `pnpm deadcode:dependencies` (uma passagem somente de dependências do Knip de produção fixada na versão mais recente do Knip, com a idade mínima de release do pnpm desativada para a instalação via `dlx`) e `pnpm deadcode:unused-files`, que compara os achados de arquivos de produção não usados do Knip contra `scripts/deadcode-unused-files.allowlist.mjs`. O guard de arquivos não usados falha quando um PR adiciona um novo arquivo não usado sem revisão ou deixa uma entrada obsoleta na allowlist, preservando superfícies intencionais de plugin dinâmico, geradas, de build, de live-test e de ponte de pacote que o Knip não consegue resolver estaticamente.

## Encaminhamento de atividade do ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` é a ponte do lado de destino da atividade do repositório OpenClaw para o ClawSweeper. Ele não faz checkout nem executa código não confiável de pull requests. O workflow cria um token de GitHub App a partir de `CLAWSWEEPER_APP_PRIVATE_KEY` e então dispara payloads compactos de `repository_dispatch` para `openclaw/clawsweeper`.

O workflow tem quatro lanes:

- `clawsweeper_item` para solicitações exatas de revisão de issue e pull request;
- `clawsweeper_comment` para comandos explícitos do ClawSweeper em comentários de issues;
- `clawsweeper_commit_review` para solicitações de revisão no nível de commit em pushes para `main`;
- `github_activity` para atividade geral do GitHub que o agente ClawSweeper pode inspecionar.

A lane `github_activity` encaminha apenas metadados normalizados: tipo de evento, ação, ator, repositório, número do item, URL, título, estado e trechos curtos para comentários ou revisões quando presentes. Ela evita intencionalmente encaminhar o corpo completo do webhook. O workflow receptor em `openclaw/clawsweeper` é `.github/workflows/github-activity.yml`, que publica o evento normalizado no hook do OpenClaw Gateway para o agente ClawSweeper.

Atividade geral é observação, não entrega por padrão. O agente ClawSweeper recebe o destino do Discord em seu prompt e deve publicar em `#clawsweeper` somente quando o evento for surpreendente, acionável, arriscado ou operacionalmente útil. Aberturas rotineiras, edições, atividade de bots, ruído duplicado de webhook e tráfego normal de revisão devem resultar em `NO_REPLY`.

Trate títulos, comentários, corpos, texto de revisão, nomes de branches e mensagens de commit do GitHub como dados não confiáveis em todo esse caminho. Eles são entrada para sumarização e triagem, não instruções para o workflow ou runtime do agente.

## Dispatches manuais

Dispatches manuais de CI executam o mesmo grafo de jobs que a CI normal, mas forçam todas as lanes com escopo não Android a ficarem ativas: shards Linux Node, shards de plugins bundled, contratos de canais, compatibilidade com Node 22, `check`, `check-additional`, smoke de build, verificações de docs, Skills Python, Windows, macOS e i18n da Control UI. Dispatches manuais independentes de CI executam Android somente com `include_android=true`; o guarda-chuva completo de release habilita Android passando `include_android=true`. Verificações estáticas de pré-release de plugins, o shard `agentic-plugins` exclusivo de release, a varredura completa em lote de extensões e as lanes Docker de pré-release de plugins são excluídos da CI. A suíte Docker de pré-release roda apenas quando `Full Release Validation` dispara o workflow separado `Plugin Prerelease` com o gate de validação de release habilitado.

Execuções manuais usam um grupo de concorrência único para que uma suíte completa de candidato a release não seja cancelada por outro push ou execução de PR na mesma ref. A entrada opcional `target_ref` permite que um chamador confiável execute esse grafo contra uma branch, tag ou SHA completo de commit enquanto usa o arquivo de workflow da ref de dispatch selecionada.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Tarefas                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, tarefas rápidas de segurança e agregações (`security-scm-fast`, `security-dependency-audit`, `security-fast`), verificações rápidas de protocolo/contrato/itens incluídos, verificações fragmentadas de contrato de canais, shards de `check` exceto lint, shards e agregações de `check-additional`, verificadores de agregação de testes Node, verificações de docs, Skills em Python, workflow-sanity, labeler, auto-response; o preflight de install-smoke também usa Ubuntu hospedado pelo GitHub para que a matriz do Blacksmith possa entrar na fila mais cedo |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shards de extensão de menor peso, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` e `check-test-types`                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shards de teste Node no Linux, shards de teste de Plugin incluído, `android`                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (sensível a CPU o suficiente para que 8 vCPU custassem mais do que economizaram); builds Docker de install-smoke (o tempo de fila de 32 vCPU custou mais do que economizou)                                                                                                                                                                                                                                                                                |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` em `openclaw/openclaw`; forks usam `macos-latest` como fallback                                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` em `openclaw/openclaw`; forks usam `macos-latest` como fallback                                                                                                                                                                                                                                                                                                                                                                                           |

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
```

## Validação completa de lançamento

`Full Release Validation` é o workflow guarda-chuva manual para "executar tudo antes do lançamento". Ele aceita um branch, tag ou SHA completo de commit, dispara o workflow manual `CI` com esse alvo, dispara `Plugin Prerelease` para prova exclusiva de lançamento de Plugin/pacote/estático/Docker e dispara `OpenClaw Release Checks` para smoke de instalação, aceitação de pacote, suítes Docker de caminho de lançamento, live/E2E, OpenWebUI, paridade do QA Lab, Matrix e lanes do Telegram. Com `rerun_group=all` e `release_profile=full`, ele também executa `NPM Telegram Beta E2E` contra o artefato `release-package-under-test` das verificações de lançamento. Após publicar, passe `npm_telegram_package_spec` para reexecutar a mesma lane de pacote do Telegram contra o pacote npm publicado.

Consulte [Validação completa de lançamento](/pt-BR/reference/full-release-validation) para a
matriz de estágios, nomes exatos de tarefas do workflow, diferenças entre perfis, artefatos e
identificadores de reexecução focada.

Para prova de commit fixado em um branch que se move rápido, use o helper em vez de
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Refs de dispatch de workflow do GitHub devem ser branches ou tags, não SHAs brutos de commit. O
helper envia um branch temporário `release-ci/<sha>-...` no SHA de destino,
dispara `Full Release Validation` a partir desse ref fixado, verifica se todo `headSha` de
workflow filho corresponde ao alvo e exclui o branch temporário quando a
execução termina. O verificador guarda-chuva também falha se algum workflow filho tiver executado em um
SHA diferente.

`release_profile` controla a amplitude live/provedor passada para as verificações de lançamento. Os
workflows manuais de lançamento usam `stable` por padrão; use `full` apenas quando você
quiser intencionalmente a matriz ampla consultiva de provedores/mídia.

- `minimum` mantém as lanes mais rápidas críticas para lançamento de OpenAI/core.
- `stable` adiciona o conjunto estável de provedores/backends.
- `full` executa a matriz ampla consultiva de provedores/mídia.

O guarda-chuva registra os ids das execuções filhas disparadas, e a tarefa final `Verify full validation` verifica novamente as conclusões atuais das execuções filhas e acrescenta tabelas das tarefas mais lentas para cada execução filha. Se um workflow filho for reexecutado e ficar verde, reexecute apenas a tarefa verificadora pai para atualizar o resultado do guarda-chuva e o resumo de tempos.

Para recuperação, tanto `Full Release Validation` quanto `OpenClaw Release Checks` aceitam `rerun_group`. Use `all` para um candidato a lançamento, `ci` apenas para o filho de CI completo normal, `plugin-prerelease` apenas para o filho de pré-lançamento de Plugin, `release-checks` para cada filho de lançamento ou um grupo mais estreito: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` no guarda-chuva. Isso mantém a reexecução de uma caixa de lançamento com falha limitada após uma correção focada.

`OpenClaw Release Checks` usa o ref confiável do workflow para resolver uma vez o ref selecionado em um tarball `release-package-under-test` e, em seguida, passa esse artefato tanto para o workflow Docker de caminho de lançamento live/E2E quanto para o shard de aceitação de pacote. Isso mantém os bytes do pacote consistentes entre caixas de lançamento e evita reempacotar o mesmo candidato em várias tarefas filhas.

Execuções duplicadas de `Full Release Validation` para `ref=main` e `rerun_group=all`
substituem o guarda-chuva mais antigo. O monitor pai cancela qualquer workflow filho que
já tenha disparado quando o pai é cancelado, para que a validação mais nova da main
não fique atrás de uma execução obsoleta de duas horas de release-check. Validações de branch/tag de
lançamento e grupos de reexecução focada mantêm `cancel-in-progress: false`.

## Shards live e E2E

O filho live/E2E de lançamento mantém ampla cobertura nativa de `pnpm test:live`, mas a executa como shards nomeados por meio de `scripts/test-live-shard.mjs` em vez de uma tarefa serial:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- tarefas `native-live-src-gateway-profiles` filtradas por provedor
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- shards divididos de mídia de áudio/vídeo e shards de música filtrados por provedor

Isso mantém a mesma cobertura de arquivos enquanto torna falhas lentas de provedores live mais fáceis de reexecutar e diagnosticar. Os nomes agregados de shard `native-live-extensions-o-z`, `native-live-extensions-media` e `native-live-extensions-media-music` continuam válidos para reexecuções manuais únicas.

Os shards nativos de mídia live executam em `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, criado pelo workflow `Live Media Runner Image`. Essa imagem pré-instala `ffmpeg` e `ffprobe`; as tarefas de mídia apenas verificam os binários antes da configuração. Mantenha suítes live baseadas em Docker em runners normais do Blacksmith — tarefas em contêiner são o lugar errado para iniciar testes Docker aninhados.

Shards live de modelo/backend baseados em Docker usam uma imagem compartilhada separada `ghcr.io/openclaw/openclaw-live-test:<sha>` por commit selecionado. O workflow live de lançamento cria e envia essa imagem uma vez; depois, os shards Docker live de modelo, Gateway fragmentado por provedor, backend CLI, bind ACP e harness Codex executam com `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shards Docker de Gateway carregam limites explícitos de `timeout` em nível de script abaixo do timeout da tarefa do workflow, para que um contêiner travado ou caminho de limpeza falhe rápido em vez de consumir todo o orçamento de release-check. Se esses shards reconstruírem independentemente o alvo Docker completo do código-fonte, a execução de lançamento está mal configurada e desperdiçará tempo de relógio com builds duplicados de imagem.

## Aceitação de pacote

Use `Package Acceptance` quando a pergunta for "este pacote instalável do OpenClaw funciona como produto?" Ele é diferente da CI normal: a CI normal valida a árvore de código-fonte, enquanto a aceitação de pacote valida um único tarball pelo mesmo harness Docker E2E que os usuários exercitam após instalar ou atualizar.

### Jobs

1. `resolve_package` faz checkout de `workflow_ref`, resolve um candidato de pacote, grava `.artifacts/docker-e2e-package/openclaw-current.tgz`, grava `.artifacts/docker-e2e-package/package-candidate.json`, envia ambos como o artefato `package-under-test` e imprime a fonte, a ref do workflow, a ref do pacote, a versão, o SHA-256 e o perfil no resumo da etapa do GitHub.
2. `docker_acceptance` chama `openclaw-live-and-e2e-checks-reusable.yml` com `ref=workflow_ref` e `package_artifact_name=package-under-test`. O workflow reutilizável baixa esse artefato, valida o inventário do tarball, prepara imagens Docker com digest de pacote quando necessário e executa as lanes Docker selecionadas contra esse pacote em vez de empacotar o checkout do workflow. Quando um perfil seleciona várias `docker_lanes` direcionadas, o workflow reutilizável prepara o pacote e as imagens compartilhadas uma vez, depois distribui essas lanes como jobs Docker direcionados paralelos com artefatos únicos.
3. `package_telegram` opcionalmente chama `NPM Telegram Beta E2E`. Ele é executado quando `telegram_mode` não é `none` e instala o mesmo artefato `package-under-test` quando Package Acceptance resolveu um; o dispatch standalone do Telegram ainda pode instalar uma spec npm publicada.
4. `summary` falha o workflow se a resolução do pacote, a aceitação Docker ou a lane opcional do Telegram falhar.

### Fontes candidatas

- `source=npm` aceita apenas `openclaw@beta`, `openclaw@latest` ou uma versão exata de release do OpenClaw, como `openclaw@2026.4.27-beta.2`. Use isso para aceitação beta/estável publicada.
- `source=ref` empacota uma branch, tag ou SHA completo de commit confiável em `package_ref`. O resolvedor busca branches/tags do OpenClaw, verifica se o commit selecionado é alcançável pelo histórico de branches do repositório ou por uma tag de release, instala dependências em uma worktree detached e o empacota com `scripts/package-openclaw-for-docker.mjs`.
- `source=url` baixa um `.tgz` via HTTPS; `package_sha256` é obrigatório.
- `source=artifact` baixa um `.tgz` de `artifact_run_id` e `artifact_name`; `package_sha256` é opcional, mas deve ser fornecido para artefatos compartilhados externamente.

Mantenha `workflow_ref` e `package_ref` separados. `workflow_ref` é o código confiável do workflow/harness que executa o teste. `package_ref` é o commit de origem que é empacotado quando `source=ref`. Isso permite que o harness de teste atual valide commits de origem confiáveis mais antigos sem executar lógica de workflow antiga.

### Perfis de suíte

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` mais `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — blocos completos do caminho de release Docker com OpenWebUI
- `custom` — `docker_lanes` exatas; obrigatório quando `suite_profile=custom`

O perfil `package` usa cobertura de Plugin offline para que a validação de pacote publicado não dependa da disponibilidade ao vivo do ClawHub. A lane opcional do Telegram reutiliza o artefato `package-under-test` em `NPM Telegram Beta E2E`, com o caminho de spec npm publicada mantido para dispatches standalone.

Para a política dedicada de testes de atualização e Plugin, incluindo comandos locais,
lanes Docker, entradas de Package Acceptance, padrões de release e triagem de falhas,
consulte [Testando atualizações e plugins](/pt-BR/help/testing-updates-plugins).

As verificações de release chamam Package Acceptance com `source=artifact`, o artefato de pacote de release preparado, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=release-history`, `published_upgrade_survivor_scenarios=reported-issues` e `telegram_mode=mock-openai`. Isso mantém a prova de migração de pacote, atualização, limpeza de dependência obsoleta de Plugin, Plugin offline, atualização de Plugin e Telegram no mesmo tarball de pacote resolvido. As verificações de release entre OS ainda cobrem onboarding específico de OS, instalador e comportamento de plataforma; a validação de produto de pacote/atualização deve começar com Package Acceptance. A lane Docker `published-upgrade-survivor` valida um baseline de pacote publicado por execução. Em Package Acceptance, o tarball `package-under-test` resolvido é sempre o candidato e `published_upgrade_survivor_baseline` seleciona o baseline publicado de fallback, com padrão `openclaw@latest`; comandos de reexecução de lane com falha preservam esse baseline. Defina `published_upgrade_survivor_baselines=release-history` para expandir a lane por uma matriz de histórico deduplicada: as seis releases estáveis mais recentes, `2026.4.23` e a release estável mais recente antes de `2026-03-15`. Defina `published_upgrade_survivor_scenarios=reported-issues` para expandir os mesmos baselines por fixtures moldadas por issues para configuração do Feishu, arquivos de bootstrap/persona preservados, caminhos de log com til e raízes obsoletas de dependência de Plugin legado. O workflow separado `Update Migration` usa a lane Docker `update-migration` com `all-since-2026.4.23` e `plugin-deps-cleanup` quando a pergunta é limpeza exaustiva de atualização publicada, não a abrangência normal da CI de Full Release. Execuções agregadas locais podem passar specs exatas de pacote com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, manter uma única lane com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, como `openclaw@2026.4.15`, ou definir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para a matriz de cenários. A lane publicada configura o baseline com uma receita embutida de comando `openclaw config set`, registra etapas da receita em `summary.json` e sonda `/healthz`, `/readyz`, além do status RPC após o início do Gateway. As lanes frescas de pacote e instalador do Windows também verificam que um pacote instalado consegue importar uma substituição de controle de navegador de um caminho Windows absoluto bruto. O smoke de turno de agente OpenAI entre OS usa por padrão `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando definido; caso contrário, `openai/gpt-5.5`, para que a prova de instalação e Gateway permaneça no modelo de teste GPT-5 preferido.

### Janelas de compatibilidade legada

Package Acceptance tem janelas delimitadas de compatibilidade legada para pacotes já publicados. Pacotes até `2026.4.25`, incluindo `2026.4.25-beta.*`, podem usar o caminho de compatibilidade:

- entradas privadas conhecidas de QA em `dist/postinstall-inventory.json` podem apontar para arquivos omitidos do tarball;
- `doctor-switch` pode ignorar o subcaso de persistência `gateway install --wrapper` quando o pacote não expõe essa flag;
- `update-channel-switch` pode remover `pnpm.patchedDependencies` ausentes da fixture git falsa derivada do tarball e pode registrar `update.channel` persistido ausente;
- smokes de Plugin podem ler locais legados de registro de instalação ou aceitar persistência ausente de registro de instalação do marketplace;
- `plugin-update` pode permitir migração de metadados de configuração, ainda exigindo que o registro de instalação e o comportamento sem reinstalação permaneçam inalterados.

O pacote publicado `2026.4.26` também pode avisar sobre arquivos locais de carimbo de metadados de build que já foram enviados. Pacotes posteriores devem satisfazer os contratos modernos; as mesmas condições falham em vez de avisar ou ignorar.

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

Ao depurar uma execução de aceitação de pacote com falha, comece pelo resumo de `resolve_package` para confirmar a fonte do pacote, a versão e o SHA-256. Depois, inspecione a execução filha `docker_acceptance` e seus artefatos Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logs de lane, tempos de fase e comandos de reexecução. Prefira reexecutar o perfil de pacote com falha ou as lanes Docker exatas em vez de reexecutar a validação completa de release.

## Smoke de instalação

O workflow separado `Install Smoke` reutiliza o mesmo script de escopo por meio do próprio job `preflight`. Ele divide a cobertura de smoke em `run_fast_install_smoke` e `run_full_install_smoke`.

- **Caminho rápido** é executado para pull requests que tocam superfícies Docker/pacote, alterações de pacote/manifesto de Plugin empacotado ou superfícies centrais de Plugin/canal/gateway/Plugin SDK que os jobs de smoke Docker exercitam. Alterações apenas de código-fonte em Plugin empacotado, edições apenas de teste e edições apenas de documentação não reservam workers Docker. O caminho rápido cria a imagem do Dockerfile raiz uma vez, verifica a CLI, executa o smoke de CLI de exclusão de agentes em workspace compartilhado, executa o e2e de gateway-network no contêiner, verifica um argumento de build de extensão empacotada e executa o perfil Docker delimitado de Plugin empacotado sob um timeout agregado de comando de 240 segundos (com cada execução Docker do cenário limitada separadamente).
- **Caminho completo** mantém instalação de pacote QR e cobertura Docker/atualização de instalador para execuções noturnas agendadas, dispatches manuais, verificações de release via workflow-call e pull requests que realmente tocam superfícies de instalador/pacote/Docker. No modo completo, install-smoke prepara ou reutiliza uma imagem de smoke do Dockerfile raiz GHCR de SHA alvo, depois executa instalação de pacote QR, smokes de Dockerfile raiz/Gateway, smokes de instalador/atualização e o E2E Docker rápido de Plugin empacotado como jobs separados para que o trabalho de instalador não espere pelos smokes da imagem raiz.

Pushes para `main` (incluindo commits de merge) não forçam o caminho completo; quando a lógica de escopo alterado solicitaria cobertura completa em um push, o workflow mantém o smoke Docker rápido e deixa o smoke completo de instalação para a validação noturna ou de release.

O smoke lento de provedor de imagem por instalação global Bun é controlado separadamente por `run_bun_global_install_smoke`. Ele é executado no agendamento noturno e a partir do workflow de verificações de release, e dispatches manuais de `Install Smoke` podem optar por ele, mas pull requests e pushes para `main` não. Testes Docker de QR e instalador mantêm seus próprios Dockerfiles focados em instalação.

## Docker E2E local

`pnpm test:docker:all` pré-compila uma imagem compartilhada de teste ao vivo, empacota o OpenClaw uma vez como tarball npm e cria duas imagens compartilhadas de `scripts/e2e/Dockerfile`:

- um executor Node/Git básico para lanes de instalador/atualização/dependência de Plugin;
- uma imagem funcional que instala o mesmo tarball em `/app` para lanes de funcionalidade normal.

As definições de lane Docker vivem em `scripts/lib/docker-e2e-scenarios.mjs`, a lógica do planejador vive em `scripts/lib/docker-e2e-plan.mjs` e o executor apenas executa o plano selecionado. O agendador seleciona a imagem por lane com `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, depois executa lanes com `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Ajustáveis

| Variável                              | Padrão | Finalidade                                                                                                  |
| ------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10     | Contagem de slots do pool principal para lanes normais.                                                     |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10     | Contagem de slots do pool final sensível a provedores.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9      | Limite de lanes live simultâneas para que os provedores não façam throttling.                               |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10     | Limite de lanes simultâneas de instalação npm.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7      | Limite de lanes simultâneas com vários serviços.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000   | Intervalo entre inícios de lanes para evitar tempestades de criação do daemon Docker; defina `0` para nenhum intervalo. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Tempo limite reserva por lane (120 minutos); lanes live/finais selecionadas usam limites mais restritos.    |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | não definido | `1` imprime o plano do agendador sem executar lanes.                                                   |
| `OPENCLAW_DOCKER_ALL_LANES`            | não definido | Lista exata de lanes separadas por vírgula; ignora o smoke de limpeza para que agentes possam reproduzir uma lane com falha. |

Uma lane mais pesada do que seu limite efetivo ainda pode iniciar a partir de um pool vazio e, então, é executada sozinha até liberar capacidade. O agregado local faz preflights do Docker, remove contêineres E2E obsoletos do OpenClaw, emite status de lanes ativas, persiste tempos de lanes para ordenação da mais longa para a mais curta e para de agendar novas lanes em pool após a primeira falha por padrão.

### Fluxo de trabalho live/E2E reutilizável

O fluxo de trabalho live/E2E reutilizável pergunta a `scripts/test-docker-all.mjs --plan-json` qual cobertura de pacote, tipo de imagem, imagem live, lane e credenciais é necessária. `scripts/docker-e2e.mjs` então converte esse plano em outputs e resumos do GitHub. Ele empacota o OpenClaw por meio de `scripts/package-openclaw-for-docker.mjs`, baixa um artefato de pacote da execução atual ou baixa um artefato de pacote de `package_artifact_run_id`; valida o inventário do tarball; compila e envia imagens GHCR Docker E2E bare/funcionais com tag de digest do pacote por meio do cache de camadas Docker da Blacksmith quando o plano precisa de lanes instaladas por pacote; e reutiliza entradas `docker_e2e_bare_image`/`docker_e2e_functional_image` fornecidas ou imagens existentes por digest de pacote em vez de recompilar. Pulls de imagens Docker são tentados novamente com um tempo limite delimitado de 180 segundos por tentativa, para que um stream de registro/cache travado tente novamente rapidamente em vez de consumir a maior parte do caminho crítico do CI.

### Partes do caminho de release

A cobertura Docker de release executa jobs menores em partes com `OPENCLAW_SKIP_DOCKER_BUILD=1`, para que cada parte puxe apenas o tipo de imagem de que precisa e execute várias lanes pelo mesmo agendador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

As partes Docker de release atuais são `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` e de `plugins-runtime-install-a` até `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` continuam sendo aliases agregados de Plugin/runtime. O alias de lane `install-e2e` continua sendo o alias agregado de reexecução manual para ambas as lanes de instalador de provedor.

OpenWebUI é incorporado a `plugins-runtime-services` quando a cobertura completa do caminho de release o solicita, e mantém uma parte `openwebui` independente apenas para dispatches exclusivos de OpenWebUI. Lanes de atualização de canais incluídos tentam novamente uma vez para falhas transitórias de rede do npm.

Cada parte envia `.artifacts/docker-tests/` com logs de lanes, tempos, `summary.json`, `failures.json`, tempos de fases, JSON do plano do agendador, tabelas de lanes lentas e comandos de reexecução por lane. A entrada `docker_lanes` do fluxo de trabalho executa lanes selecionadas contra as imagens preparadas em vez dos jobs por partes, o que mantém a depuração de lane com falha limitada a um job Docker direcionado e prepara, baixa ou reutiliza o artefato de pacote para essa execução; se uma lane selecionada for uma lane Docker live, o job direcionado compila a imagem de teste live localmente para essa reexecução. Comandos de reexecução GitHub gerados por lane incluem `package_artifact_run_id`, `package_artifact_name` e entradas de imagens preparadas quando esses valores existem, para que uma lane com falha possa reutilizar o pacote e as imagens exatos da execução com falha.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

O fluxo de trabalho live/E2E agendado executa diariamente toda a suíte Docker do caminho de release.

## Pré-lançamento de Plugin

`Plugin Prerelease` é uma cobertura de produto/pacote mais cara, por isso é um fluxo de trabalho separado, disparado por `Full Release Validation` ou por um operador explícito. Pull requests normais, pushes para `main` e dispatches manuais independentes de CI mantêm essa suíte desativada. Ele balanceia testes de Plugins incluídos entre oito workers de extensão; esses jobs de shard de extensão executam até dois grupos de configuração de Plugin por vez, com um worker Vitest por grupo e um heap Node maior para que lotes de Plugins com muitos imports não criem jobs extras de CI. O caminho de pré-lançamento Docker exclusivo de release agrupa lanes Docker direcionadas em pequenos grupos para evitar reservar dezenas de runners para jobs de um a três minutos.

## Laboratório de QA

O Laboratório de QA tem lanes dedicadas de CI fora do fluxo de trabalho principal com escopo inteligente.

- O fluxo de trabalho `Parity gate` é executado em alterações correspondentes de PR e em dispatch manual; ele compila o runtime privado de QA e compara os pacotes agênticos mock GPT-5.5 e Opus 4.6.
- O fluxo de trabalho `QA-Lab - All Lanes` é executado todas as noites em `main` e em dispatch manual; ele expande o mock parity gate, a lane Matrix live e as lanes Telegram e Discord live como jobs paralelos. Jobs live usam o ambiente `qa-live-shared`, e Telegram/Discord usam leases Convex.

As verificações de release executam lanes de transporte live Matrix e Telegram com o provedor mock determinístico e modelos qualificados por mock (`mock-openai/gpt-5.5` e `mock-openai/gpt-5.5-alt`), para que o contrato de canal fique isolado da latência de modelos live e da inicialização normal de Plugin de provedor. O Gateway de transporte live desativa a busca de memória porque a paridade de QA cobre o comportamento de memória separadamente; a conectividade de provedores é coberta pelas suítes separadas de modelo live, provedor nativo e provedor Docker.

Matrix usa `--profile fast` para gates agendados e de release, adicionando `--fail-fast` apenas quando a CLI em checkout oferece suporte a isso. O padrão da CLI e a entrada manual do fluxo de trabalho continuam sendo `all`; o dispatch manual `matrix_profile=all` sempre fragmenta a cobertura completa de Matrix em jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`.

`OpenClaw Release Checks` também executa as lanes de QA Lab críticas para release antes da aprovação do release; seu gate de paridade de QA executa os pacotes candidato e baseline como jobs de lane paralelos e, em seguida, baixa ambos os artefatos em um pequeno job de relatório para a comparação final de paridade.

Não coloque o caminho de landing de PR atrás de `Parity gate`, a menos que a alteração realmente toque no runtime de QA, na paridade de pacotes de modelo ou em uma superfície que o fluxo de trabalho de paridade possua. Para correções normais de canal, configuração, docs ou testes unitários, trate-o como um sinal opcional e siga a evidência de CI/verificação com escopo.

## CodeQL

O fluxo de trabalho `CodeQL` é intencionalmente um scanner de segurança estreito de primeira passada, não a varredura completa do repositório. Execuções diárias, manuais e de proteção de pull requests que não são rascunho escaneiam código de fluxos de trabalho Actions mais as superfícies JavaScript/TypeScript de maior risco com consultas de segurança de alta confiança filtradas para `security-severity` alta/crítica.

A proteção de pull request permanece leve: ela só começa para alterações em `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` ou `src`, e executa a mesma matriz de segurança de alta confiança que o fluxo de trabalho agendado. Android e macOS CodeQL ficam fora dos padrões de PR.

### Categorias de segurança

| Categoria                                         | Superfície                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, segredos, sandbox, cron e baseline de Gateway                                                                                 |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementação do canal central mais runtime de Plugin de canal, Gateway, Plugin SDK, segredos e pontos de auditoria    |
| `/codeql-security-high/network-ssrf-boundary`     | Superfícies de SSRF central, parsing de IP, proteção de rede, web-fetch e política SSRF do Plugin SDK                               |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, helpers de execução de processos, entrega de saída e gates de execução de ferramentas de agente                     |
| `/codeql-security-high/plugin-trust-boundary`     | Superfícies de confiança de instalação de Plugin, loader, manifesto, registro, instalação por gerenciador de pacotes, carregamento de origem e contrato de pacote do Plugin SDK |

### Shards de segurança específicos por plataforma

- `CodeQL Android Critical Security` — shard agendado de segurança Android. Compila o app Android manualmente para CodeQL no menor runner Blacksmith Linux aceito pela sanidade do fluxo de trabalho. Envia em `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard semanal/manual de segurança macOS. Compila o app macOS manualmente para CodeQL no Blacksmith macOS, filtra resultados de build de dependências para fora do SARIF enviado e envia em `/codeql-critical-security/macos`. Mantido fora dos padrões diários porque o build macOS domina o tempo de execução mesmo quando está limpo.

### Categorias críticas de qualidade

`CodeQL Critical Quality` é o shard não relacionado a segurança correspondente. Ele executa apenas consultas de qualidade JavaScript/TypeScript de severidade de erro e não relacionadas a segurança sobre superfícies estreitas de alto valor no runner Blacksmith Linux menor. Sua proteção de pull request é intencionalmente menor que o perfil agendado: PRs que não são rascunho executam apenas os shards correspondentes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` e `plugin-sdk-reply-runtime` para alterações em código de execução de comandos/modelos/ferramentas de agente e dispatch de respostas, código de schema/migração/IO de configuração, código de auth/segredos/sandbox/segurança, canal central e runtime de Plugin de canal incluído, protocolo/método de servidor do Gateway, runtime de memória/cola SDK, MCP/processo/entrega de saída, runtime de provedor/catálogo de modelos, diagnósticos de sessão/filas de entrega, loader de Plugin, Plugin SDK/contrato de pacote ou runtime de respostas do Plugin SDK. Alterações na configuração do CodeQL e no fluxo de trabalho de qualidade executam todos os doze shards de qualidade de PR.

O dispatch manual aceita:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Os perfis estreitos são hooks de ensino/iteração para executar um shard de qualidade isoladamente.

| Categoria                                               | Superfície                                                                                                                                                        |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Código de limite de segurança de autenticação, segredos, sandbox, cron e Gateway                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Esquema de configuração, migração, normalização e contratos de IO                                                                                                 |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Esquemas de protocolo do Gateway e contratos de métodos do servidor                                                                                               |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementação do canal principal e do Plugin de canal incluído                                                                                       |
| `/codeql-critical-quality/agent-runtime-boundary`       | Execução de comandos, despacho de modelo/provedor, despacho e filas de resposta automática, e contratos de runtime do plano de controle ACP                        |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP e pontes de ferramentas, auxiliares de supervisão de processos e contratos de entrega de saída                                                     |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK do host de memória, fachadas de runtime de memória, aliases do SDK de Plugin de memória, cola de ativação de runtime de memória e comandos doctor de memória  |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internos da fila de respostas, filas de entrega de sessão, auxiliares de vinculação/entrega de sessão de saída, superfícies de pacote de eventos/logs de diagnóstico e contratos da CLI doctor de sessão |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de resposta de entrada do SDK de Plugin, auxiliares de payload/fragmentação/runtime de resposta, opções de resposta de canal, filas de entrega e auxiliares de vinculação de sessão/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalização de catálogo de modelos, autenticação e descoberta de provedores, registro de runtime de provedor, padrões/catálogos de provedores e registros de web/pesquisa/busca/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap da UI de controle, persistência local, fluxos de controle do Gateway e contratos de runtime do plano de controle de tarefas                             |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratos de runtime de busca/pesquisa web principal, IO de mídia, compreensão de mídia, geração de imagens e geração de mídia                                    |
| `/codeql-critical-quality/plugin-boundary`              | Contratos de carregador, registro, superfície pública e pontos de entrada do SDK de Plugin                                                                        |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Fonte publicada do SDK de Plugin no lado do pacote e auxiliares de contrato de pacote de Plugin                                                                   |

Qualidade fica separada de segurança para que achados de qualidade possam ser agendados, medidos, desativados ou expandidos sem obscurecer o sinal de segurança. A expansão do CodeQL para Swift, Python e Plugin incluído deve ser adicionada de volta como trabalho de acompanhamento com escopo ou particionado somente depois que os perfis estreitos tiverem runtime e sinal estáveis.

## Fluxos de manutenção

### Agente de documentação

O fluxo de trabalho `Docs Agent` é uma trilha de manutenção do Codex orientada por eventos para manter a documentação existente alinhada com mudanças recém-integradas. Ele não tem uma agenda pura: uma execução de CI bem-sucedida de push não bot em `main` pode acioná-lo, e o disparo manual pode executá-lo diretamente. Invocações por execução de fluxo de trabalho são ignoradas quando `main` avançou ou quando outra execução não ignorada do Docs Agent foi criada na última hora. Quando ele roda, revisa o intervalo de commits do SHA de origem anterior não ignorado do Docs Agent até o `main` atual, então uma execução horária pode cobrir todas as mudanças em main acumuladas desde a última passagem de documentação.

### Agente de desempenho de testes

O fluxo de trabalho `Test Performance Agent` é uma trilha de manutenção do Codex orientada por eventos para testes lentos. Ele não tem uma agenda pura: uma execução de CI bem-sucedida de push não bot em `main` pode acioná-lo, mas ele é ignorado se outra invocação por execução de fluxo de trabalho já tiver rodado ou estiver rodando naquele dia UTC. O disparo manual contorna esse gate de atividade diária. A trilha cria um relatório de desempenho agrupado do Vitest para a suíte completa, permite que o Codex faça apenas pequenas correções de desempenho de testes que preservem a cobertura, em vez de refatorações amplas, depois executa novamente o relatório da suíte completa e rejeita mudanças que reduzam a contagem de testes aprovados da linha de base. Se a linha de base tiver testes falhando, o Codex pode corrigir apenas falhas óbvias, e o relatório de suíte completa pós-agente deve passar antes que qualquer coisa seja commitada. Quando `main` avança antes do push do bot chegar, a trilha faz rebase do patch validado, executa novamente `pnpm check:changed` e tenta o push outra vez; patches obsoletos conflitantes são ignorados. Ela usa Ubuntu hospedado no GitHub para que a ação do Codex possa manter a mesma postura de segurança sem sudo do agente de documentação.

### PRs duplicados após merge

O fluxo de trabalho `Duplicate PRs After Merge` é um fluxo manual de mantenedor para limpeza de duplicados após integração. Ele usa dry-run por padrão e só fecha PRs listados explicitamente quando `apply=true`. Antes de modificar o GitHub, ele verifica que o PR integrado passou por merge e que cada duplicado tem uma issue referenciada compartilhada ou hunks alterados sobrepostos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gates de verificação local e roteamento de alterações

A lógica local de trilhas alteradas vive em `scripts/changed-lanes.mjs` e é executada por `scripts/check-changed.mjs`. Esse gate de verificação local é mais rigoroso quanto a limites de arquitetura do que o escopo amplo da plataforma de CI:

- mudanças de produção no núcleo executam typecheck de produção do núcleo e de testes do núcleo, além de lint/guards do núcleo;
- mudanças apenas em testes do núcleo executam somente typecheck de testes do núcleo, além de lint do núcleo;
- mudanças de produção em extensão executam typecheck de produção e de testes de extensão, além de lint de extensão;
- mudanças apenas em testes de extensão executam typecheck de testes de extensão, além de lint de extensão;
- mudanças no SDK de Plugin público ou em contrato de Plugin expandem para typecheck de extensão porque extensões dependem desses contratos do núcleo (varreduras de extensão do Vitest continuam sendo trabalho de teste explícito);
- aumentos de versão apenas de metadados de release executam verificações direcionadas de versão/configuração/dependência raiz;
- mudanças desconhecidas de raiz/configuração falham em segurança para todas as trilhas de verificação.

O roteamento local de testes alterados vive em `scripts/test-projects.test-support.mjs` e é intencionalmente mais barato que `check:changed`: edições diretas de testes executam os próprios testes, edições de fonte preferem mapeamentos explícitos, depois testes irmãos e dependentes do grafo de imports. A configuração compartilhada de entrega para salas de grupo é um dos mapeamentos explícitos: mudanças na configuração de resposta visível ao grupo, no modo de entrega de resposta de origem ou no prompt do sistema da ferramenta de mensagem passam pelos testes de resposta do núcleo, além de regressões de entrega do Discord e Slack, para que uma mudança de padrão compartilhado falhe antes do primeiro push do PR. Use `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` somente quando a mudança for ampla o suficiente no harness para que o conjunto mapeado barato não seja um proxy confiável.

## Validação no Testbox

Execute o Testbox a partir da raiz do repositório e prefira uma caixa aquecida nova para prova ampla. Antes de gastar um gate lento em uma caixa que foi reutilizada, expirou ou acabou de relatar uma sincronização inesperadamente grande, execute `pnpm testbox:sanity` dentro da caixa primeiro.

A verificação de sanidade falha rapidamente quando arquivos raiz obrigatórios, como `pnpm-lock.yaml`, desapareceram ou quando `git status --short` mostra pelo menos 200 exclusões rastreadas. Isso geralmente significa que o estado de sincronização remota não é uma cópia confiável do PR; pare essa caixa e aqueça uma nova em vez de depurar a falha de teste do produto. Para PRs intencionais com grandes exclusões, defina `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para essa execução de sanidade.

`pnpm testbox:run` também encerra uma invocação local da CLI Blacksmith que permanece na fase de sincronização por mais de cinco minutos sem saída pós-sincronização. Defina `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` para desativar esse guard, ou use um valor maior em milissegundos para diffs locais incomumente grandes.

Crabbox é o segundo caminho de caixa remota pertencente ao repositório para prova em Linux quando o Blacksmith não está disponível ou quando capacidade de nuvem própria é preferível. Aqueça uma caixa, hidrate-a pelo fluxo de trabalho do projeto e então execute comandos pela CLI do Crabbox:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` controla os padrões de provedor, sincronização e hidratação do GitHub Actions. Ele exclui `.git` local para que o checkout hidratado do Actions mantenha seus próprios metadados Git remotos em vez de sincronizar remotes e object stores locais de mantenedor, e exclui artefatos locais de runtime/build que nunca devem ser transferidos. `.github/workflows/crabbox-hydrate.yml` controla checkout, configuração de Node/pnpm, fetch de `origin/main` e o repasse de ambiente não secreto que comandos posteriores `crabbox run --id <cbx_id>` usam como fonte.

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Canais de desenvolvimento](/pt-BR/install/development-channels)
