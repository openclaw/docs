---
read_when:
    - Você precisa entender por que um job de CI foi ou não executado
    - Você está depurando uma verificação do GitHub Actions com falha
    - Você está coordenando uma execução ou reexecução da validação de lançamento
    - Você está alterando o disparo do ClawSweeper ou o encaminhamento de atividades do GitHub
summary: Grafo de tarefas de CI, barreiras de escopo, guarda-chuvas de lançamento e equivalentes de comandos locais
title: Pipeline de CI
x-i18n:
    generated_at: "2026-05-02T20:42:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39410c5ceb3598e9e1771f98fba79485b13967df372c7a3f55ef5a5350416435
    source_path: ci.md
    workflow: 16
---

OpenClaw CI é executado em cada push para `main` e em cada pull request. O job `preflight` classifica o diff e desativa lanes caras quando apenas áreas não relacionadas mudaram. Execuções manuais de `workflow_dispatch` ignoram intencionalmente o escopo inteligente e expandem o grafo completo para candidatos a release e validação ampla. As lanes de Android permanecem opt-in por meio de `include_android`. A cobertura de Plugin exclusiva de release fica no workflow separado [`Pré-lançamento de Plugin`](#plugin-prerelease) e só é executada a partir de [`Validação completa de release`](#full-release-validation) ou de um disparo manual explícito.

## Visão geral do pipeline

| Job                              | Finalidade                                                                                                       | Quando é executado                              |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `preflight`                      | Detecta alterações somente em docs, escopos alterados, extensões alteradas e cria o manifesto da CI              | Sempre em pushes e PRs que não sejam rascunhos  |
| `security-scm-fast`              | Detecção de chave privada e auditoria de workflow via `zizmor`                                                   | Sempre em pushes e PRs que não sejam rascunhos  |
| `security-dependency-audit`      | Auditoria do lockfile de produção sem dependências em relação a advisories do npm                                | Sempre em pushes e PRs que não sejam rascunhos  |
| `security-fast`                  | Agregado obrigatório para os jobs rápidos de segurança                                                           | Sempre em pushes e PRs que não sejam rascunhos  |
| `check-dependencies`             | Passagem somente de dependências do Knip em produção, mais o guard da allowlist de arquivos não usados           | Alterações relevantes para Node                 |
| `build-artifacts`                | Compila `dist/`, Control UI, verificações de artefatos compilados e artefatos reutilizáveis downstream           | Alterações relevantes para Node                 |
| `checks-fast-core`               | Lanes rápidas de correção no Linux, como verificações de bundled/plugin-contract/protocol                         | Alterações relevantes para Node                 |
| `checks-fast-contracts-channels` | Verificações fragmentadas de contratos de canais com um resultado agregado de verificação estável                | Alterações relevantes para Node                 |
| `checks-node-core-test`          | Fragmentos de testes do core Node, excluindo lanes de canais, bundled, contratos e extensões                     | Alterações relevantes para Node                 |
| `check`                          | Equivalente fragmentado do gate local principal: tipos de produção, lint, guards, tipos de teste e smoke estrito | Alterações relevantes para Node                 |
| `check-additional`               | Fragmentos de arquitetura, limites, guards de superfície de extensão, package-boundary e gateway-watch           | Alterações relevantes para Node                 |
| `build-smoke`                    | Testes smoke da CLI compilada e smoke de memória de inicialização                                                | Alterações relevantes para Node                 |
| `checks`                         | Verificador para testes de canal de artefatos compilados                                                         | Alterações relevantes para Node                 |
| `checks-node-compat-node22`      | Lane de build e smoke de compatibilidade com Node 22                                                             | Disparo manual de CI para releases              |
| `check-docs`                     | Formatação, lint e verificações de links quebrados das docs                                                      | Docs alteradas                                  |
| `skills-python`                  | Ruff + pytest para Skills com suporte em Python                                                                  | Alterações relevantes para Skills em Python     |
| `checks-windows`                 | Testes específicos de processo/caminho no Windows, mais regressões compartilhadas de especificadores de import runtime | Alterações relevantes para Windows              |
| `macos-node`                     | Lane de testes TypeScript no macOS usando os artefatos compilados compartilhados                                 | Alterações relevantes para macOS                |
| `macos-swift`                    | Lint, build e testes Swift para o app macOS                                                                      | Alterações relevantes para macOS                |
| `android`                        | Testes unitários Android para ambos os flavors, mais uma build de APK debug                                      | Alterações relevantes para Android              |
| `test-performance-agent`         | Otimização diária de testes lentos do Codex após atividade confiável                                             | Sucesso da CI principal ou disparo manual       |
| `openclaw-performance`           | Relatórios diários/sob demanda de desempenho runtime Kova com lanes mock-provider, deep-profile e GPT 5.4 live   | Disparo agendado e manual                       |

## Ordem de fail-fast

1. `preflight` decide quais lanes sequer existem. A lógica `docs-scope` e `changed-scope` são etapas dentro desse job, não jobs independentes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falham rapidamente sem esperar pelos jobs mais pesados de artefatos e matriz de plataformas.
3. `build-artifacts` se sobrepõe às lanes rápidas do Linux para que consumidores downstream possam começar assim que a build compartilhada estiver pronta.
4. Lanes mais pesadas de plataforma e runtime se expandem depois disso: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

O GitHub pode marcar jobs substituídos como `cancelled` quando um push mais novo chega ao mesmo PR ou ref `main`. Trate isso como ruído da CI, a menos que a execução mais nova para a mesma ref também esteja falhando. Verificações agregadas de fragmentos usam `!cancelled() && always()` para que ainda relatem falhas normais de fragmentos, mas não entrem na fila depois que todo o workflow já tiver sido substituído. A chave automática de concorrência da CI é versionada (`CI-v7-*`) para que um zumbi do lado do GitHub em um grupo de fila antigo não bloqueie indefinidamente execuções mais novas da main. Execuções manuais da suíte completa usam `CI-manual-v1-*` e não cancelam execuções em andamento.

## Escopo e roteamento

A lógica de escopo fica em `scripts/ci-changed-scope.mjs` e é coberta por testes unitários em `src/scripts/ci-changed-scope.test.ts`. O disparo manual ignora a detecção de changed-scope e faz o manifesto do preflight agir como se todas as áreas com escopo tivessem mudado.

- **Edições no workflow de CI** validam o grafo de CI do Node mais o lint de workflow, mas não forçam builds nativas de Windows, Android ou macOS por si só; essas lanes de plataforma continuam com escopo limitado a alterações de código-fonte da plataforma.
- **Edições somente de roteamento de CI, edições selecionadas de fixtures baratas de testes do core e edições estreitas de helper/test-routing de contrato de Plugin** usam um caminho rápido de manifesto somente Node: `preflight`, segurança e uma única tarefa `checks-fast-core`. Esse caminho pula artefatos de build, compatibilidade com Node 22, contratos de canal, fragmentos completos do core, fragmentos de bundled-plugin e matrizes adicionais de guards quando a alteração está limitada às superfícies de roteamento ou helper que a tarefa rápida exercita diretamente.
- **Verificações Node no Windows** têm escopo limitado a wrappers específicos de processo/caminho do Windows, helpers de runner npm/pnpm/UI, configuração de gerenciador de pacotes e as superfícies de workflow de CI que executam essa lane; alterações não relacionadas de código-fonte, Plugin, install-smoke e somente testes permanecem nas lanes Node do Linux.

As famílias mais lentas de testes Node são divididas ou balanceadas para que cada job permaneça pequeno sem reservar runners em excesso: contratos de canal rodam em três fragmentos ponderados, lanes pequenas de unit do core são pareadas, auto-reply roda como quatro workers balanceados (com a subárvore de reply dividida em fragmentos de agent-runner, dispatch e commands/state-routing), e configurações agentic de Gateway/Plugin são distribuídas pelos jobs Node agentic existentes somente de código-fonte em vez de esperar por artefatos compilados. Testes amplos de navegador, QA, mídia e Plugins diversos usam suas configs Vitest dedicadas em vez do catch-all compartilhado de Plugin. Fragmentos com padrões de inclusão registram entradas de tempo usando o nome do fragmento de CI, para que `.artifacts/vitest-shard-timings.json` consiga distinguir uma config inteira de um fragmento filtrado. `check-additional` mantém o trabalho de compile/canary de package-boundary junto e separa a arquitetura de topologia runtime da cobertura de gateway watch; o fragmento de guard de boundary executa seus pequenos guards independentes concorrentemente dentro de um job. Gateway watch, testes de canal e o fragmento de support-boundary do core rodam concorrentemente dentro de `build-artifacts` depois que `dist/` e `dist-runtime/` já foram compilados.

A CI do Android executa `testPlayDebugUnitTest` e `testThirdPartyDebugUnitTest` e depois compila o APK debug Play. O flavor third-party não tem source set ou manifesto separado; sua lane de testes unitários ainda compila o flavor com as flags BuildConfig de SMS/call-log, evitando ao mesmo tempo um job duplicado de empacotamento de APK debug em cada push relevante para Android.

O fragmento `check-dependencies` executa `pnpm deadcode:dependencies` (uma passagem somente de dependências do Knip em produção fixada na versão mais recente do Knip, com a idade mínima de release do pnpm desativada para a instalação `dlx`) e `pnpm deadcode:unused-files`, que compara as descobertas de arquivos não usados em produção do Knip com `scripts/deadcode-unused-files.allowlist.mjs`. O guard de arquivos não usados falha quando um PR adiciona um novo arquivo não usado sem revisão ou deixa uma entrada obsoleta na allowlist, preservando superfícies intencionais de Plugin dinâmico, geradas, de build, de teste live e pontes de pacote que o Knip não consegue resolver estaticamente.

## Encaminhamento de atividade do ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` é a ponte do lado de destino da atividade do repositório OpenClaw para o ClawSweeper. Ele não faz checkout nem executa código não confiável de pull request. O workflow cria um token de GitHub App a partir de `CLAWSWEEPER_APP_PRIVATE_KEY` e então dispara payloads compactos de `repository_dispatch` para `openclaw/clawsweeper`.

O workflow tem quatro lanes:

- `clawsweeper_item` para solicitações exatas de revisão de issue e pull request;
- `clawsweeper_comment` para comandos explícitos do ClawSweeper em comentários de issue;
- `clawsweeper_commit_review` para solicitações de revisão em nível de commit em pushes para `main`;
- `github_activity` para atividade geral do GitHub que o agente ClawSweeper pode inspecionar.

A lane `github_activity` encaminha apenas metadados normalizados: tipo de evento, ação, ator, repositório, número do item, URL, título, estado e trechos curtos de comentários ou revisões quando presentes. Ela evita intencionalmente encaminhar o corpo completo do Webhook. O workflow receptor em `openclaw/clawsweeper` é `.github/workflows/github-activity.yml`, que publica o evento normalizado no hook do OpenClaw Gateway para o agente ClawSweeper.

Atividade geral é observação, não entrega por padrão. O agente ClawSweeper recebe o destino do Discord em seu prompt e deve publicar em `#clawsweeper` somente quando o evento for surpreendente, acionável, arriscado ou operacionalmente útil. Aberturas rotineiras, edições, movimentação de bot, ruído duplicado de Webhook e tráfego normal de revisão devem resultar em `NO_REPLY`.

Trate títulos, comentários, corpos, texto de revisão, nomes de branch e mensagens de commit do GitHub como dados não confiáveis durante todo esse caminho. Eles são entrada para sumarização e triagem, não instruções para o workflow ou runtime do agente.

## Disparos manuais

As execuções manuais de CI rodam o mesmo grafo de jobs da CI normal, mas forçam todas as lanes com escopo não Android a ficarem ativadas: shards Linux Node, shards de plugins incluídos, contratos de canais, compatibilidade com Node 22, `check`, `check-additional`, smoke de build, verificações de docs, Python skills, Windows, macOS e i18n da Control UI. Execuções manuais independentes de CI rodam apenas Android com `include_android=true`; o guarda-chuva completo de release habilita Android passando `include_android=true`. Verificações estáticas de pré-lançamento de plugins, o shard exclusivo de release `agentic-plugins`, a varredura completa em lote de extensões e as lanes Docker de pré-lançamento de plugins são excluídos da CI. A suíte Docker de pré-lançamento roda apenas quando `Full Release Validation` despacha o workflow separado `Plugin Prerelease` com o gate de validação de release habilitado.

Execuções manuais usam um grupo de concorrência exclusivo para que uma suíte completa de candidato a release não seja cancelada por outra execução de push ou PR na mesma ref. A entrada opcional `target_ref` permite que um chamador confiável rode esse grafo contra uma branch, tag ou SHA completo de commit usando o arquivo de workflow da ref de despacho selecionada.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Executores

| Executor                         | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, jobs rápidos de segurança e agregados (`security-scm-fast`, `security-dependency-audit`, `security-fast`), verificações rápidas de protocolo/contrato/plugins incluídos, verificações de contrato de canais em shards, shards de `check` exceto lint, shards e agregados de `check-additional`, verificadores agregados de testes Node, verificações de docs, Python skills, workflow-sanity, labeler, auto-response; o preflight de install-smoke também usa Ubuntu hospedado no GitHub para que a matriz Blacksmith possa entrar na fila mais cedo |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shards de extensões mais leves, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` e `check-test-types`                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shards de testes Linux Node, shards de testes de plugins incluídos, `android`                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (sensível a CPU o suficiente para que 8 vCPU custassem mais do que economizavam); builds Docker de install-smoke (o tempo de fila de 32 vCPU custava mais do que economizava)                                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` em `openclaw/openclaw`; forks usam fallback para `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` em `openclaw/openclaw`; forks usam fallback para `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                           |

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

`OpenClaw Performance` é o workflow de desempenho de produto/runtime. Ele roda diariamente em `main` e pode ser despachado manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

O workflow instala o OCM a partir de um release fixado e o Kova a partir da entrada fixada `kova_ref`, depois roda três lanes:

- `mock-provider`: cenários de diagnóstico Kova contra um runtime de build local com autenticação falsa determinística compatível com OpenAI.
- `mock-deep-profile`: profiling de CPU/heap/trace para pontos críticos de inicialização, Gateway e turnos de agente.
- `live-gpt54`: um turno real de agente OpenAI `openai/gpt-5.4`, ignorado quando `OPENAI_API_KEY` não está disponível.

A lane mock-provider também roda sondas de código-fonte nativas do OpenClaw após a passada do Kova: tempo de boot e memória do gateway nos casos de inicialização padrão, com hook e com 50 plugins; loops repetidos de hello `channel-chat-baseline` com mock-OpenAI; e comandos de inicialização da CLI contra o gateway inicializado. O resumo Markdown da sonda de código-fonte fica em `source/index.md` no pacote de relatório, com o JSON bruto ao lado.

Todas as lanes enviam artefatos do GitHub. Quando `CLAWGRIT_REPORTS_TOKEN` está configurado, o workflow também commita `report.json`, `report.md`, pacotes, `index.md` e artefatos de sonda de código-fonte em `openclaw/clawgrit-reports` sob `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`. O ponteiro da branch atual é escrito como `openclaw-performance/<ref>/latest-<lane>.json`.

## Validação completa de release

`Full Release Validation` é o workflow guarda-chuva manual para "rodar tudo antes do release". Ele aceita uma branch, tag ou SHA completo de commit, despacha o workflow manual `CI` com esse alvo, despacha `Plugin Prerelease` para prova exclusiva de release de plugin/pacote/estática/Docker e despacha `OpenClaw Release Checks` para smoke de instalação, aceitação de pacote, suítes de caminho de release Docker, live/E2E, OpenWebUI, paridade QA Lab, Matrix e lanes do Telegram. Com `rerun_group=all` e `release_profile=full`, ele também roda `NPM Telegram Beta E2E` contra o artefato `release-package-under-test` das verificações de release. Após publicar, passe `npm_telegram_package_spec` para rodar novamente a mesma lane de pacote Telegram contra o pacote npm publicado.

Consulte [validação completa de release](/pt-BR/reference/full-release-validation) para a
matriz de estágios, os nomes exatos de jobs de workflow, as diferenças de perfil, artefatos e
identificadores de nova execução focada.

`OpenClaw Release Publish` é o workflow manual mutável de release. Despache-o
a partir de `release/YYYY.M.D` ou `main` depois que a tag de release existir e depois que o
preflight npm do OpenClaw tiver sido bem-sucedido. Ele verifica `pnpm plugins:sync:check`,
despacha `Plugin NPM Release` para todos os pacotes de plugins publicáveis, despacha
`Plugin ClawHub Release` para o mesmo SHA de release e só então despacha
`OpenClaw NPM Release` com o `preflight_run_id` salvo.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Para prova de commit fixado em uma branch de movimento rápido, use o auxiliar em vez de
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Refs de despacho de workflow do GitHub devem ser branches ou tags, não SHAs brutos de commit. O
auxiliar envia uma branch temporária `release-ci/<sha>-...` no SHA alvo,
despacha `Full Release Validation` a partir dessa ref fixada, verifica se todo `headSha` de workflow
filho corresponde ao alvo e exclui a branch temporária quando a
execução termina. O verificador guarda-chuva também falha se qualquer workflow filho tiver rodado em um
SHA diferente.

`release_profile` controla a amplitude live/provider passada para as verificações de release. Os
workflows manuais de release usam `stable` por padrão; use `full` apenas quando você
intencionalmente quiser a ampla matriz consultiva de provider/mídia.

- `minimum` mantém as lanes OpenAI/core críticas para release mais rápidas.
- `stable` adiciona o conjunto estável de providers/backends.
- `full` roda a ampla matriz consultiva de provider/mídia.

O guarda-chuva registra os ids das execuções filhas despachadas, e o job final `Verify full validation` verifica novamente as conclusões atuais das execuções filhas e acrescenta tabelas dos jobs mais lentos para cada execução filha. Se um workflow filho for reexecutado e ficar verde, reexecute apenas o job verificador pai para atualizar o resultado do guarda-chuva e o resumo de tempos.

Para recuperação, tanto `Full Release Validation` quanto `OpenClaw Release Checks` aceitam `rerun_group`. Use `all` para um candidato a release, `ci` apenas para o filho normal de CI completo, `plugin-prerelease` apenas para o filho de pré-release de Plugin, `release-checks` para todos os filhos de release, ou um grupo mais restrito: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` no guarda-chuva. Isso mantém limitada a reexecução de uma caixa de release com falha após uma correção focada.

`OpenClaw Release Checks` usa a referência de workflow confiável para resolver a referência selecionada uma vez em um tarball `release-package-under-test`, depois passa esse artefato tanto para o workflow Docker de caminho de release live/E2E quanto para o shard de aceitação de pacote. Isso mantém os bytes do pacote consistentes entre as caixas de release e evita reempacotar o mesmo candidato em vários trabalhos filhos.

Execuções duplicadas de `Full Release Validation` para `ref=main` e `rerun_group=all`
substituem o guarda-chuva mais antigo. O monitor pai cancela qualquer workflow filho que ele
já tenha despachado quando o pai é cancelado, então a validação mais nova de main
não fica atrás de uma execução obsoleta de duas horas de verificação de release. A validação de branch/tag
de release e os grupos de reexecução focados mantêm `cancel-in-progress: false`.

## Shards live e E2E

O filho live/E2E de release mantém a cobertura nativa ampla de `pnpm test:live`, mas a executa como shards nomeados por meio de `scripts/test-live-shard.mjs` em vez de um único trabalho serial:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- trabalhos `native-live-src-gateway-profiles` filtrados por provedor
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- shards separados de mídia de áudio/vídeo e shards de música filtrados por provedor

Isso mantém a mesma cobertura de arquivos, ao mesmo tempo que torna falhas lentas de provedores live mais fáceis de reexecutar e diagnosticar. Os nomes de shard agregados `native-live-extensions-o-z`, `native-live-extensions-media` e `native-live-extensions-media-music` continuam válidos para reexecuções manuais únicas.

Os shards nativos de mídia live são executados em `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, criado pelo workflow `Live Media Runner Image`. Essa imagem pré-instala `ffmpeg` e `ffprobe`; os trabalhos de mídia apenas verificam os binários antes da configuração. Mantenha suítes live baseadas em Docker em runners Blacksmith normais — trabalhos em contêiner são o lugar errado para iniciar testes Docker aninhados.

Shards live de modelo/backend baseados em Docker usam uma imagem compartilhada separada `ghcr.io/openclaw/openclaw-live-test:<sha>` por commit selecionado. O workflow de release live cria e envia essa imagem uma vez, então os shards live Docker de modelo, Gateway com shards por provedor, backend CLI, bind ACP e harness Codex são executados com `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shards Docker de Gateway carregam limites explícitos de `timeout` em nível de script abaixo do timeout do trabalho do workflow, para que um contêiner travado ou caminho de limpeza falhe rápido em vez de consumir todo o orçamento da verificação de release. Se esses shards recriarem o alvo Docker de código-fonte completo de forma independente, a execução de release está mal configurada e desperdiçará tempo de relógio em builds de imagem duplicados.

## Aceitação de Pacote

Use `Package Acceptance` quando a pergunta for "este pacote instalável do OpenClaw funciona como produto?" Ela é diferente da CI normal: a CI normal valida a árvore de código-fonte, enquanto a aceitação de pacote valida um único tarball pelo mesmo harness Docker E2E que os usuários exercitam após instalar ou atualizar.

### Trabalhos

1. `resolve_package` faz checkout de `workflow_ref`, resolve um candidato de pacote, grava `.artifacts/docker-e2e-package/openclaw-current.tgz`, grava `.artifacts/docker-e2e-package/package-candidate.json`, envia ambos como o artefato `package-under-test` e imprime a origem, a referência do workflow, a referência do pacote, a versão, o SHA-256 e o perfil no resumo da etapa do GitHub.
2. `docker_acceptance` chama `openclaw-live-and-e2e-checks-reusable.yml` com `ref=workflow_ref` e `package_artifact_name=package-under-test`. O workflow reutilizável baixa esse artefato, valida o inventário do tarball, prepara imagens Docker com digest do pacote quando necessário e executa as lanes Docker selecionadas contra esse pacote em vez de empacotar o checkout do workflow. Quando um perfil seleciona vários `docker_lanes` direcionados, o workflow reutilizável prepara o pacote e as imagens compartilhadas uma vez, depois distribui essas lanes como trabalhos Docker direcionados paralelos com artefatos únicos.
3. `package_telegram` opcionalmente chama `NPM Telegram Beta E2E`. Ele é executado quando `telegram_mode` não é `none` e instala o mesmo artefato `package-under-test` quando a Aceitação de Pacote resolveu um; o despacho autônomo do Telegram ainda pode instalar uma especificação npm publicada.
4. `summary` faz o workflow falhar se a resolução do pacote, a aceitação Docker ou a lane opcional do Telegram falhar.

### Origens de candidatos

- `source=npm` aceita apenas `openclaw@alpha`, `openclaw@beta`, `openclaw@latest` ou uma versão exata de release do OpenClaw, como `openclaw@2026.4.27-beta.2`. Use isso para aceitação de pré-releases/estáveis publicados.
- `source=ref` empacota um branch, tag ou SHA completo de commit confiável em `package_ref`. O resolvedor busca branches/tags do OpenClaw, verifica se o commit selecionado é alcançável a partir do histórico de branches do repositório ou de uma tag de release, instala dependências em uma worktree desanexada e o empacota com `scripts/package-openclaw-for-docker.mjs`.
- `source=url` baixa um `.tgz` HTTPS; `package_sha256` é obrigatório.
- `source=artifact` baixa um `.tgz` de `artifact_run_id` e `artifact_name`; `package_sha256` é opcional, mas deve ser fornecido para artefatos compartilhados externamente.

Mantenha `workflow_ref` e `package_ref` separados. `workflow_ref` é o código confiável de workflow/harness que executa o teste. `package_ref` é o commit de origem que é empacotado quando `source=ref`. Isso permite que o harness de teste atual valide commits de origem confiáveis mais antigos sem executar lógica de workflow antiga.

### Perfis de suíte

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` mais `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — blocos completos do caminho de release Docker com OpenWebUI
- `custom` — `docker_lanes` exatas; obrigatório quando `suite_profile=custom`

O perfil `package` usa cobertura offline de Plugin para que a validação de pacote publicado não dependa da disponibilidade live do ClawHub. A lane opcional do Telegram reutiliza o artefato `package-under-test` em `NPM Telegram Beta E2E`, com o caminho de especificação npm publicada mantido para despachos autônomos.

Para a política dedicada de testes de atualização e Plugin, incluindo comandos locais,
lanes Docker, entradas de Aceitação de Pacote, padrões de release e triagem de falhas,
consulte [Testando atualizações e plugins](/pt-BR/help/testing-updates-plugins).

As verificações de release chamam a Aceitação de Pacote com `source=artifact`, o artefato de pacote de release preparado, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` e `telegram_mode=mock-openai`. Isso mantém a migração de pacote, atualização, limpeza de dependência obsoleta de Plugin, reparo de instalação de Plugin configurado, Plugin offline, atualização de Plugin e prova do Telegram no mesmo tarball de pacote resolvido. Defina `package_acceptance_package_spec` em Full Release Validation ou OpenClaw Release Checks para executar essa mesma matriz contra um pacote npm enviado em vez do artefato criado a partir do SHA. As verificações de release entre sistemas operacionais ainda cobrem integração inicial específica de sistema operacional, instalador e comportamento de plataforma; a validação de produto de pacote/atualização deve começar com a Aceitação de Pacote. A lane Docker `published-upgrade-survivor` valida uma linha de base de pacote publicado por execução. Na Aceitação de Pacote, o tarball `package-under-test` resolvido é sempre o candidato e `published_upgrade_survivor_baseline` seleciona a linha de base publicada de fallback, com padrão `openclaw@latest`; comandos de reexecução de lane com falha preservam essa linha de base. Defina `published_upgrade_survivor_baselines=all-since-2026.4.23` para expandir a CI de Full Release por todos os releases npm estáveis de `2026.4.23` até `latest`; `release-history` continua disponível para amostragem manual mais ampla com a âncora anterior à data mais antiga. Defina `published_upgrade_survivor_scenarios=reported-issues` para expandir as mesmas linhas de base por fixtures em formato de issue para configuração do Feishu, arquivos de bootstrap/persona preservados, instalações configuradas de Plugin OpenClaw, caminhos de log com til e raízes de dependências obsoletas de Plugin legado. O workflow separado `Update Migration` usa a lane Docker `update-migration` com `all-since-2026.4.23` e `plugin-deps-cleanup` quando a pergunta é limpeza exaustiva de atualização publicada, não a amplitude normal da CI de Full Release. Execuções agregadas locais podem passar especificações exatas de pacote com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, manter uma única lane com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, como `openclaw@2026.4.15`, ou definir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para a matriz de cenários. A lane publicada configura a linha de base com uma receita incorporada de comando `openclaw config set`, registra etapas da receita em `summary.json` e testa `/healthz`, `/readyz` mais o status RPC após a inicialização do Gateway. As lanes frescas de pacote e instalador do Windows também verificam se um pacote instalado consegue importar uma substituição de controle de navegador a partir de um caminho absoluto bruto do Windows. O smoke de turno de agente OpenAI entre sistemas operacionais usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` por padrão quando definido, caso contrário `openai/gpt-5.4`, para que a prova de instalação e Gateway permaneça em um modelo de teste GPT-5 enquanto evita padrões GPT-4.x.

### Janelas de compatibilidade legada

A Aceitação de Pacote tem janelas limitadas de compatibilidade legada para pacotes já publicados. Pacotes até `2026.4.25`, incluindo `2026.4.25-beta.*`, podem usar o caminho de compatibilidade:

- entradas conhecidas de QA privado em `dist/postinstall-inventory.json` podem apontar para arquivos omitidos do tarball;
- `doctor-switch` pode ignorar o subcaso de persistência de `gateway install --wrapper` quando o pacote não expõe essa flag;
- `update-channel-switch` pode remover `pnpm.patchedDependencies` ausentes do fixture git falso derivado do tarball e pode registrar `update.channel` persistido ausente;
- smokes de Plugin podem ler locais legados de registro de instalação ou aceitar persistência ausente de registro de instalação do marketplace;
- `plugin-update` pode permitir migração de metadados de configuração enquanto ainda exige que o registro de instalação e o comportamento sem reinstalação permaneçam inalterados.

O pacote publicado `2026.4.26` também pode emitir aviso para arquivos de carimbo de metadados de build local que já foram enviados. Pacotes posteriores devem satisfazer os contratos modernos; as mesmas condições falham em vez de avisar ou serem ignoradas.

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

Ao depurar uma execução de aceitação de pacote com falha, comece pelo resumo `resolve_package` para confirmar a origem, a versão e o SHA-256 do pacote. Em seguida, inspecione a execução filha `docker_acceptance` e seus artefatos Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logs das lanes, tempos das fases e comandos de reexecução. Prefira reexecutar o perfil de pacote com falha ou as lanes Docker exatas em vez de reexecutar a validação completa de release.

## Smoke de instalação

O workflow separado `Install Smoke` reutiliza o mesmo script de escopo por meio do seu próprio job `preflight`. Ele divide a cobertura de smoke entre `run_fast_install_smoke` e `run_full_install_smoke`.

- **Caminho rápido** é executado para pull requests que tocam superfícies de Docker/pacote, mudanças em pacote/manifesto de Plugin incluído ou superfícies principais de Plugin/canal/Gateway/Plugin SDK que os jobs de smoke Docker exercitam. Mudanças somente de código-fonte em Plugins incluídos, edições somente de testes e edições somente de docs não reservam workers Docker. O caminho rápido cria a imagem do Dockerfile raiz uma vez, verifica a CLI, executa o smoke da CLI de exclusão de agentes em workspace compartilhado, executa o e2e do gateway-network em contêiner, verifica um argumento de build de extensão incluída e executa o perfil Docker limitado de Plugin incluído sob um timeout agregado de comando de 240 segundos (cada execução Docker de cenário é limitada separadamente).
- **Caminho completo** mantém a instalação de pacote QR e a cobertura Docker/de atualização do instalador para execuções noturnas agendadas, dispatches manuais, verificações de release por workflow-call e pull requests que realmente tocam superfícies de instalador/pacote/Docker. No modo completo, install-smoke prepara ou reutiliza uma imagem de smoke do Dockerfile raiz no GHCR para um target-SHA, então executa instalação de pacote QR, smokes de Dockerfile raiz/Gateway, smokes de instalador/atualização e o E2E Docker rápido de Plugin incluído como jobs separados, para que o trabalho do instalador não espere pelos smokes da imagem raiz.

Pushes para `main` (incluindo commits de merge) não forçam o caminho completo; quando a lógica de escopo de mudanças solicitaria cobertura completa em um push, o workflow mantém o smoke Docker rápido e deixa o smoke completo de instalação para a validação noturna ou de release.

O smoke lento de provedor de imagem com instalação global Bun é controlado separadamente por `run_bun_global_install_smoke`. Ele roda na agenda noturna e a partir do workflow de verificações de release, e dispatches manuais de `Install Smoke` podem optar por incluí-lo, mas pull requests e pushes para `main` não. Os testes Docker de QR e instalador mantêm seus próprios Dockerfiles focados em instalação.

## E2E Docker local

`pnpm test:docker:all` pré-compila uma imagem compartilhada de teste live, empacota o OpenClaw uma vez como um tarball npm e cria duas imagens compartilhadas de `scripts/e2e/Dockerfile`:

- um runner Node/Git básico para lanes de instalador/atualização/dependência de Plugin;
- uma imagem funcional que instala o mesmo tarball em `/app` para lanes de funcionalidade normal.

As definições de lanes Docker ficam em `scripts/lib/docker-e2e-scenarios.mjs`, a lógica do planejador fica em `scripts/lib/docker-e2e-plan.mjs`, e o runner executa apenas o plano selecionado. O agendador seleciona a imagem por lane com `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, depois executa as lanes com `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Ajustes

| Variável                               | Padrão | Finalidade                                                                                     |
| -------------------------------------- | ------ | ---------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10     | Contagem de slots do pool principal para lanes normais.                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10     | Contagem de slots do pool final sensível a provedores.                                         |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9      | Limite de lanes live concorrentes para que provedores não apliquem throttling.                  |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10     | Limite de lanes concorrentes de instalação npm.                                                 |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7      | Limite de lanes concorrentes com múltiplos serviços.                                           |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000   | Intervalo entre inícios de lanes para evitar tempestades de criação no daemon Docker; defina `0` para sem intervalo. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Timeout reserva por lane (120 minutos); lanes live/finais selecionadas usam limites mais rígidos. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset  | `1` imprime o plano do agendador sem executar lanes.                                           |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset  | Lista exata de lanes separada por vírgulas; pula o smoke de limpeza para que agentes possam reproduzir uma lane com falha. |

Uma lane mais pesada que seu limite efetivo ainda pode iniciar a partir de um pool vazio, e então roda sozinha até liberar capacidade. O agregado local faz preflight do Docker, remove contêineres E2E antigos do OpenClaw, emite status de lanes ativas, persiste tempos de lanes para ordenação das mais longas primeiro e, por padrão, para de agendar novas lanes em pool após a primeira falha.

### Workflow live/E2E reutilizável

O workflow live/E2E reutilizável pergunta a `scripts/test-docker-all.mjs --plan-json` qual pacote, tipo de imagem, imagem live, lane e cobertura de credenciais são necessários. `scripts/docker-e2e.mjs` então converte esse plano em saídas e resumos do GitHub. Ele empacota o OpenClaw por meio de `scripts/package-openclaw-for-docker.mjs`, baixa um artefato de pacote da execução atual ou baixa um artefato de pacote de `package_artifact_run_id`; valida o inventário do tarball; cria e envia imagens Docker E2E básicas/funcionais do GHCR marcadas pelo digest do pacote por meio do cache de camada Docker do Blacksmith quando o plano precisa de lanes com pacote instalado; e reutiliza entradas `docker_e2e_bare_image`/`docker_e2e_functional_image` fornecidas ou imagens existentes com digest do pacote em vez de recriar. Pulls de imagem Docker são tentados novamente com um timeout limitado de 180 segundos por tentativa, para que um stream travado de registry/cache tente novamente rapidamente em vez de consumir a maior parte do caminho crítico da CI.

### Blocos do caminho de release

A cobertura Docker de release executa jobs menores em blocos com `OPENCLAW_SKIP_DOCKER_BUILD=1`, para que cada bloco puxe apenas o tipo de imagem de que precisa e execute várias lanes pelo mesmo agendador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Os blocos Docker de release atuais são `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` e de `plugins-runtime-install-a` até `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` continuam sendo aliases agregados de Plugin/runtime. O alias de lane `install-e2e` continua sendo o alias agregado de reexecução manual para ambas as lanes de instalador de provedores.

OpenWebUI é incorporado a `plugins-runtime-services` quando a cobertura completa de release-path o solicita, e mantém um bloco independente `openwebui` apenas para dispatches exclusivos do OpenWebUI. Lanes de atualização de canais incluídos tentam novamente uma vez em caso de falhas transitórias de rede npm.

Cada bloco envia `.artifacts/docker-tests/` com logs de lanes, tempos, `summary.json`, `failures.json`, tempos de fases, JSON do plano do agendador, tabelas de lanes lentas e comandos de reexecução por lane. A entrada `docker_lanes` do workflow executa lanes selecionadas contra as imagens preparadas em vez dos jobs de bloco, o que mantém a depuração de lane com falha limitada a um job Docker direcionado e prepara, baixa ou reutiliza o artefato de pacote para essa execução; se uma lane selecionada for uma lane Docker live, o job direcionado cria a imagem de teste live localmente para essa reexecução. Os comandos GitHub de reexecução gerados por lane incluem `package_artifact_run_id`, `package_artifact_name` e entradas de imagem preparadas quando esses valores existem, para que uma lane com falha possa reutilizar o pacote e as imagens exatos da execução com falha.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

O workflow live/E2E agendado executa diariamente a suíte Docker completa de release-path.

## Pré-release de Plugin

`Plugin Prerelease` é uma cobertura de produto/pacote mais cara, então é um workflow separado disparado por `Full Release Validation` ou por um operador explícito. Pull requests normais, pushes para `main` e dispatches manuais independentes de CI mantêm essa suíte desativada. Ele balanceia testes de Plugins incluídos entre oito workers de extensão; esses jobs de shards de extensão executam até dois grupos de configuração de Plugin por vez, com um worker Vitest por grupo e um heap Node maior, para que lotes de Plugins pesados em imports não criem jobs extras de CI. O caminho Docker de pré-release exclusivo de release agrupa lanes Docker direcionadas em pequenos grupos para evitar reservar dezenas de runners para jobs de um a três minutos.

## Laboratório QA

O Laboratório QA tem lanes dedicadas de CI fora do workflow principal com escopo inteligente. A paridade agêntica fica aninhada nos harnesses amplos de QA e release, não em um workflow independente de PR. Use `Full Release Validation` com `rerun_group=qa-parity` quando a paridade deve acompanhar uma execução ampla de validação.

- O workflow `QA-Lab - All Lanes` roda todas as noites em `main` e em dispatch manual; ele distribui a lane de paridade mock, a lane Matrix live e as lanes live de Telegram e Discord como jobs paralelos. Jobs live usam o ambiente `qa-live-shared`, e Telegram/Discord usam leases Convex.

As verificações de release executam lanes de transporte live de Matrix e Telegram com o provedor mock determinístico e modelos qualificados por mock (`mock-openai/gpt-5.5` e `mock-openai/gpt-5.5-alt`), para que o contrato do canal fique isolado da latência de modelos live e da inicialização normal de Plugin de provedor. O Gateway de transporte live desativa a busca de memória porque a paridade QA cobre o comportamento de memória separadamente; a conectividade de provedores é coberta pelas suítes separadas de modelo live, provedor nativo e provedor Docker.

Matrix usa `--profile fast` para gates agendados e de release, adicionando `--fail-fast` apenas quando a CLI em checkout oferece suporte. O padrão da CLI e a entrada manual do workflow continuam sendo `all`; o dispatch manual `matrix_profile=all` sempre fragmenta a cobertura Matrix completa em jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`.

`OpenClaw Release Checks` também executa as lanes críticas de release do Laboratório QA antes da aprovação de release; seu gate de paridade QA executa os pacotes candidato e baseline como jobs de lane paralelos, depois baixa ambos os artefatos para um job pequeno de relatório para a comparação final de paridade.

Para PRs normais, siga evidências de CI/verificação com escopo em vez de tratar a paridade como um status obrigatório.

## CodeQL

O fluxo de trabalho `CodeQL` é intencionalmente um scanner de segurança inicial e restrito, não uma varredura completa do repositório. As execuções de proteção diárias, manuais e de pull requests que não são rascunho verificam o código dos fluxos de trabalho do Actions mais as superfícies JavaScript/TypeScript de maior risco com consultas de segurança de alta confiança filtradas para `security-severity` alta/crítica.

A proteção de pull request permanece leve: ela só inicia para alterações em `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` ou `src`, e executa a mesma matriz de segurança de alta confiança que o fluxo de trabalho agendado. O CodeQL para Android e macOS fica fora dos padrões de PR.

### Categorias de segurança

| Categoria                                         | Superfície                                                                                                                         |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Autenticação, segredos, sandbox, Cron e linha de base do Gateway                                                                   |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementação dos canais centrais mais o runtime de plugin de canal, Gateway, Plugin SDK, segredos, pontos de auditoria |
| `/codeql-security-high/network-ssrf-boundary`     | SSRF central, análise de IP, guarda de rede, web-fetch e superfícies de política de SSRF do Plugin SDK                             |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, auxiliares de execução de processos, entrega de saída e portas de execução de ferramentas do agente                |
| `/codeql-security-high/plugin-trust-boundary`     | Instalação de Plugin, carregador, manifesto, registro, instalação do gerenciador de pacotes, carregamento de origem e superfícies de confiança do contrato de pacote do Plugin SDK |

### Shards de segurança específicos da plataforma

- `CodeQL Android Critical Security` — shard agendado de segurança para Android. Compila o app Android manualmente para o CodeQL no menor executor Blacksmith Linux aceito pela sanidade do fluxo de trabalho. Envia em `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard semanal/manual de segurança para macOS. Compila o app macOS manualmente para o CodeQL no Blacksmith macOS, filtra os resultados de build de dependências para fora do SARIF enviado e envia em `/codeql-critical-security/macos`. Mantido fora dos padrões diários porque o build para macOS domina o runtime mesmo quando está limpo.

### Categorias de qualidade crítica

`CodeQL Critical Quality` é o shard não relacionado a segurança correspondente. Ele executa apenas consultas de qualidade JavaScript/TypeScript sem segurança, com severidade de erro, sobre superfícies restritas de alto valor no menor executor Blacksmith Linux. Sua proteção de pull request é intencionalmente menor que o perfil agendado: PRs que não são rascunho executam apenas os shards correspondentes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` e `plugin-sdk-reply-runtime` para alterações no código de execução de comandos/modelos/ferramentas do agente e despacho de respostas, código de schema/migração/IO de configuração, código de autenticação/segredos/sandbox/segurança, runtime dos canais centrais e plugins de canal incluídos, protocolo/método de servidor do Gateway, runtime de memória/cola do SDK, MCP/processo/entrega de saída, runtime de provedor/catálogo de modelos, diagnósticos de sessão/filas de entrega, carregador de Plugin, contrato de pacote/Plugin SDK ou runtime de resposta do Plugin SDK. Alterações na configuração do CodeQL e no fluxo de trabalho de qualidade executam todos os doze shards de qualidade de PR.

O disparo manual aceita:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Os perfis restritos são ganchos de ensino/iteração para executar um shard de qualidade isoladamente.

| Categoria                                               | Superfície                                                                                                                                                       |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Código de fronteira de segurança de autenticação, segredos, sandbox, Cron e Gateway                                                                              |
| `/codeql-critical-quality/config-boundary`              | Schema de configuração, migração, normalização e contratos de IO                                                                                                 |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schemas de protocolo do Gateway e contratos de método do servidor                                                                                                 |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementação dos canais centrais e dos plugins de canal incluídos                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Execução de comandos, despacho de modelo/provedor, despacho e filas de resposta automática e contratos de runtime do plano de controle ACP                       |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP e pontes de ferramentas, auxiliares de supervisão de processos e contratos de entrega de saída                                                    |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK do host de memória, fachadas de runtime de memória, aliases de memória do Plugin SDK, cola de ativação do runtime de memória e comandos doctor de memória   |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internos da fila de respostas, filas de entrega de sessão, auxiliares de vinculação/entrega de sessão de saída, superfícies de eventos diagnósticos/pacotes de log e contratos da CLI doctor de sessão |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de respostas de entrada do Plugin SDK, payload de resposta/fragmentação/auxiliares de runtime, opções de resposta de canal, filas de entrega e auxiliares de vinculação de sessão/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalização do catálogo de modelos, autenticação e descoberta de provedores, registro de runtime de provedor, padrões/catálogos de provedores e registros de web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap da UI de controle, persistência local, fluxos de controle do Gateway e contratos de runtime do plano de controle de tarefas                           |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Fetch/search web centrais, IO de mídia, compreensão de mídia, geração de imagem e contratos de runtime de geração de mídia                                       |
| `/codeql-critical-quality/plugin-boundary`              | Contratos do carregador, registro, superfície pública e entrypoint do Plugin SDK                                                                                 |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Origem do Plugin SDK no lado do pacote publicado e auxiliares de contrato de pacote de plugin                                                                    |

A qualidade permanece separada da segurança para que achados de qualidade possam ser agendados, medidos, desabilitados ou expandidos sem obscurecer o sinal de segurança. A expansão do CodeQL para Swift, Python e plugins incluídos deve ser adicionada de volta como trabalho de acompanhamento com escopo ou shards somente depois que os perfis restritos tiverem runtime e sinal estáveis.

## Fluxos de trabalho de manutenção

### Docs Agent

O fluxo de trabalho `Docs Agent` é uma faixa de manutenção Codex orientada por eventos para manter a documentação existente alinhada com alterações integradas recentemente. Ele não tem agendamento puro: uma execução de CI bem-sucedida de push não bot em `main` pode acioná-lo, e o disparo manual pode executá-lo diretamente. Invocações por workflow-run são ignoradas quando `main` avançou ou quando outra execução não ignorada do Docs Agent foi criada na última hora. Quando ele executa, revisa o intervalo de commits do SHA de origem anterior não ignorado do Docs Agent até o `main` atual, então uma execução horária pode cobrir todas as alterações em main acumuladas desde a última passagem de documentação.

### Test Performance Agent

O fluxo de trabalho `Test Performance Agent` é uma faixa de manutenção Codex orientada por eventos para testes lentos. Ele não tem agendamento puro: uma execução de CI bem-sucedida de push não bot em `main` pode acioná-lo, mas ele é ignorado se outra invocação por workflow-run já executou ou está em execução naquele dia UTC. O disparo manual contorna essa porta de atividade diária. A faixa cria um relatório agrupado de desempenho do Vitest para a suíte completa, permite que o Codex faça apenas pequenas correções de desempenho de testes que preservem cobertura em vez de refatorações amplas, depois executa novamente o relatório da suíte completa e rejeita alterações que reduzam a contagem de testes aprovados da linha de base. Se a linha de base tiver testes falhando, o Codex pode corrigir apenas falhas óbvias e o relatório da suíte completa pós-agente deve passar antes que qualquer coisa seja commitada. Quando `main` avança antes do push do bot aterrissar, a faixa aplica rebase ao patch validado, executa novamente `pnpm check:changed` e tenta o push novamente; patches obsoletos conflitantes são ignorados. Ela usa Ubuntu hospedado pelo GitHub para que a ação do Codex possa manter a mesma postura de segurança drop-sudo do agente de documentação.

### PRs duplicados após merge

O fluxo de trabalho `Duplicate PRs After Merge` é um fluxo de trabalho manual de mantenedor para limpeza de duplicados pós-integração. Ele usa dry-run por padrão e só fecha PRs listados explicitamente quando `apply=true`. Antes de modificar o GitHub, ele verifica se o PR integrado teve merge e se cada duplicado tem uma issue referenciada em comum ou hunks alterados sobrepostos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Portas de verificação locais e roteamento de alterações

A lógica local de changed-lane fica em `scripts/changed-lanes.mjs` e é executada por `scripts/check-changed.mjs`. Essa porta de verificação local é mais estrita sobre fronteiras de arquitetura do que o escopo amplo da plataforma de CI:

- alterações de produção no core executam typecheck de produção do core e de testes do core, mais lint/guardas do core;
- alterações apenas em testes do core executam somente typecheck de testes do core, mais lint do core;
- alterações de produção em extensões executam typecheck de produção e de testes de extensão, mais lint de extensão;
- alterações apenas em testes de extensão executam typecheck de testes de extensão, mais lint de extensão;
- alterações públicas no Plugin SDK ou em contratos de plugin se expandem para typecheck de extensão porque as extensões dependem desses contratos do core (varreduras de extensões no Vitest permanecem trabalho de teste explícito);
- incrementos de versão apenas em metadados de release executam verificações direcionadas de versão/configuração/dependências raiz;
- alterações desconhecidas de raiz/configuração falham com segurança para todas as faixas de verificação.

O roteamento local de testes alterados fica em `scripts/test-projects.test-support.mjs` e é intencionalmente mais barato que `check:changed`: edições diretas de teste executam a si mesmas, edições de código-fonte preferem mapeamentos explícitos, depois testes irmãos e dependentes do grafo de imports. A configuração compartilhada de entrega de salas de grupo é um dos mapeamentos explícitos: alterações na configuração de resposta visível do grupo, no modo de entrega de resposta de origem ou no prompt de sistema da ferramenta de mensagens passam pelos testes centrais de resposta mais regressões de entrega do Discord e Slack, para que uma alteração de padrão compartilhado falhe antes do primeiro push de PR. Use `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` somente quando a alteração for ampla o bastante no harness para que o conjunto mapeado barato não seja um proxy confiável.

## Validação Testbox

Execute o Testbox a partir da raiz do repositório e prefira uma caixa recém-aquecida para validação ampla. Antes de gastar uma verificação lenta em uma caixa que foi reutilizada, expirou ou acabou de relatar uma sincronização inesperadamente grande, execute `pnpm testbox:sanity` dentro da caixa primeiro.

A verificação de sanidade falha rapidamente quando arquivos obrigatórios da raiz, como `pnpm-lock.yaml`, desapareceram ou quando `git status --short` mostra pelo menos 200 exclusões rastreadas. Isso geralmente significa que o estado de sincronização remoto não é uma cópia confiável do PR; pare essa caixa e aqueça uma nova em vez de depurar a falha do teste do produto. Para PRs intencionais com muitas exclusões, defina `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para essa execução de sanidade.

`pnpm testbox:run` também encerra uma invocação local do Blacksmith CLI que permanece na fase de sincronização por mais de cinco minutos sem saída pós-sincronização. Defina `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` para desativar essa proteção, ou use um valor maior em milissegundos para diffs locais excepcionalmente grandes.

Crabbox é o segundo caminho de caixa remota mantido pelo repositório para validação no Linux quando o Blacksmith está indisponível ou quando a capacidade de nuvem própria é preferível. Aqueça uma caixa, hidrate-a pelo fluxo de trabalho do projeto e então execute comandos pela Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` controla os padrões de provedor, sincronização e hidratação do GitHub Actions. Ele exclui o `.git` local para que o checkout hidratado do Actions mantenha seus próprios metadados Git remotos em vez de sincronizar remotos e armazenamentos de objetos locais do mantenedor, e exclui artefatos locais de runtime/build que nunca devem ser transferidos. `.github/workflows/crabbox-hydrate.yml` controla o checkout, a configuração de Node/pnpm, a busca de `origin/main` e o repasse do ambiente sem segredos que comandos posteriores de `crabbox run --id <cbx_id>` usam como fonte.

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Canais de desenvolvimento](/pt-BR/install/development-channels)
