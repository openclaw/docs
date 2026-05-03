---
read_when:
    - Você precisa entender por que um job de CI foi ou não executado
    - Você está depurando uma verificação do GitHub Actions que está falhando
    - Você está coordenando uma execução ou reexecução de validação de lançamento
    - Você está alterando o despacho do ClawSweeper ou o encaminhamento de atividades do GitHub
summary: Grafo de tarefas de CI, critérios de aprovação de escopo, agrupadores de lançamento e equivalentes de comandos locais
title: pipeline de CI
x-i18n:
    generated_at: "2026-05-03T05:48:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321fe0a061044f75b8e1d03b4d3e76d4f8dd2dae0ebc58831887fc20af953cf1
    source_path: ci.md
    workflow: 16
---

OpenClaw CI é executado em cada push para `main` e em cada pull request. O job `preflight` classifica o diff e desativa lanes caras quando apenas áreas não relacionadas mudaram. Execuções manuais via `workflow_dispatch` contornam intencionalmente o escopo inteligente e espalham o grafo completo para candidatos a release e validação ampla. As lanes de Android permanecem opt-in por meio de `include_android`. A cobertura de Plugin exclusiva de release fica no workflow separado [`Pré-release de Plugin`](#plugin-prerelease) e só executa a partir de [`Validação Completa de Release`](#full-release-validation) ou de um disparo manual explícito.

## Visão geral do pipeline

| Job                              | Finalidade                                                                                                          | Quando executa                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Detectar alterações apenas em docs, escopos alterados, extensions alteradas e criar o manifesto de CI               | Sempre em pushes e PRs não draft   |
| `security-scm-fast`              | Detecção de chave privada e auditoria de workflow via `zizmor`                                                      | Sempre em pushes e PRs não draft   |
| `security-dependency-audit`      | Auditoria de lockfile de produção sem dependências contra avisos do npm                                             | Sempre em pushes e PRs não draft   |
| `security-fast`                  | Agregado obrigatório para os jobs rápidos de segurança                                                              | Sempre em pushes e PRs não draft   |
| `check-dependencies`             | Passagem do Knip somente para dependências de produção mais a guarda de allowlist de arquivos não usados            | Alterações relevantes para Node    |
| `build-artifacts`                | Compilar `dist/`, Control UI, verificações de artefatos compilados e artefatos downstream reutilizáveis             | Alterações relevantes para Node    |
| `checks-fast-core`               | Lanes rápidas de correção no Linux, como verificações de bundled/plugin-contract/protocol                           | Alterações relevantes para Node    |
| `checks-fast-contracts-channels` | Verificações fragmentadas de contratos de canais com resultado de verificação agregado estável                      | Alterações relevantes para Node    |
| `checks-node-core-test`          | Shards de teste core do Node, excluindo lanes de canal, bundled, contrato e extension                               | Alterações relevantes para Node    |
| `check`                          | Equivalente fragmentado do gate local principal: tipos de produção, lint, guardas, tipos de teste e smoke estrito   | Alterações relevantes para Node    |
| `check-additional`               | Arquitetura, limites, drift de snapshots de prompt, guardas de superfície de extension, limite de pacote e shards de gateway-watch | Alterações relevantes para Node |
| `build-smoke`                    | Testes smoke da CLI compilada e smoke de memória de inicialização                                                   | Alterações relevantes para Node    |
| `checks`                         | Verificador para testes de canal de artefatos compilados                                                            | Alterações relevantes para Node    |
| `checks-node-compat-node22`      | Lane de build e smoke de compatibilidade com Node 22                                                                | Disparo manual de CI para releases |
| `check-docs`                     | Formatação, lint e verificações de links quebrados da documentação                                                  | Docs alterados                     |
| `skills-python`                  | Ruff + pytest para Skills com suporte em Python                                                                     | Alterações relevantes a Skills em Python |
| `checks-windows`                 | Testes específicos de processo/caminho no Windows mais regressões compartilhadas de especificadores de import runtime | Alterações relevantes para Windows |
| `macos-node`                     | Lane de teste TypeScript no macOS usando os artefatos compilados compartilhados                                     | Alterações relevantes para macOS   |
| `macos-swift`                    | Swift lint, build e testes para o app macOS                                                                         | Alterações relevantes para macOS   |
| `android`                        | Testes unitários Android para ambos os flavors mais um build de APK debug                                           | Alterações relevantes para Android |
| `test-performance-agent`         | Otimização diária de testes lentos do Codex após atividade confiável                                                | Sucesso da CI principal ou disparo manual |
| `openclaw-performance`           | Relatórios diários/sob demanda de desempenho do runtime Kova com lanes mock-provider, deep-profile e GPT 5.4 live   | Agendado e disparo manual          |

## Ordem de falha rápida

1. `preflight` decide quais lanes existem. As lógicas `docs-scope` e `changed-scope` são etapas dentro desse job, não jobs independentes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falham rapidamente sem esperar pelos jobs mais pesados de artefatos e matriz de plataformas.
3. `build-artifacts` se sobrepõe às lanes rápidas de Linux para que consumidores downstream possam iniciar assim que o build compartilhado estiver pronto.
4. Lanes mais pesadas de plataforma e runtime se espalham depois disso: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

O GitHub pode marcar jobs substituídos como `cancelled` quando um push mais novo chega ao mesmo PR ou ref `main`. Trate isso como ruído de CI, a menos que a execução mais nova para o mesmo ref também esteja falhando. Verificações agregadas de shards usam `!cancelled() && always()` para que ainda relatem falhas normais de shard, mas não entrem na fila depois que todo o workflow já foi substituído. A chave automática de concorrência da CI é versionada (`CI-v7-*`) para que um zumbi do lado do GitHub em um grupo de fila antigo não possa bloquear indefinidamente execuções mais novas da main. Execuções manuais da suíte completa usam `CI-manual-v1-*` e não cancelam execuções em andamento.

## Escopo e roteamento

A lógica de escopo fica em `scripts/ci-changed-scope.mjs` e é coberta por testes unitários em `src/scripts/ci-changed-scope.test.ts`. O disparo manual ignora a detecção de changed-scope e faz o manifesto de preflight agir como se todas as áreas com escopo tivessem mudado.

- **Edições no workflow de CI** validam o grafo de CI do Node mais linting de workflow, mas não forçam builds nativos de Windows, Android ou macOS por si só; essas lanes de plataforma permanecem limitadas a alterações de código-fonte da plataforma.
- **Edições apenas de roteamento de CI, edições selecionadas de fixtures baratas de core-test e edições estreitas de helper/roteamento de teste de contrato de Plugin** usam um caminho rápido de manifesto somente Node: `preflight`, segurança e uma única tarefa `checks-fast-core`. Esse caminho pula artefatos de build, compatibilidade com Node 22, contratos de canal, shards completos de core, shards de bundled-plugin e matrizes adicionais de guardas quando a alteração se limita às superfícies de roteamento ou helpers que a tarefa rápida exercita diretamente.
- **Verificações Node no Windows** são escopadas para wrappers específicos de processo/caminho do Windows, helpers de runner npm/pnpm/UI, configuração de gerenciador de pacotes e as superfícies de workflow de CI que executam essa lane; alterações não relacionadas de código-fonte, Plugin, install-smoke e apenas teste permanecem nas lanes Node do Linux.

As famílias mais lentas de testes Node são divididas ou balanceadas para que cada job permaneça pequeno sem reservar runners em excesso: contratos de canal rodam como três shards ponderados, lanes pequenas de unidades core são pareadas, auto-reply roda como quatro workers balanceados (com a subárvore de reply dividida em shards agent-runner, dispatch e commands/state-routing), e configurações agentic de Gateway/Plugin são distribuídas pelos jobs Node agentic existentes somente de código-fonte em vez de esperar por artefatos compilados. Testes amplos de navegador, QA, mídia e Plugins diversos usam suas configurações dedicadas do Vitest em vez do catch-all compartilhado de Plugin. Shards include-pattern registram entradas de tempo usando o nome do shard de CI, para que `.artifacts/vitest-shard-timings.json` possa distinguir uma configuração inteira de um shard filtrado. `check-additional` mantém juntos o trabalho de compilação/canary de limite de pacote e separa a arquitetura de topologia de runtime da cobertura de gateway watch; o shard de guarda de limite executa suas pequenas guardas independentes concorrentemente dentro de um job, incluindo `pnpm prompt:snapshots:check`, para que o drift de prompt do caminho feliz do runtime Codex fique fixado ao PR que o causou. Gateway watch, testes de canal e o shard core support-boundary executam concorrentemente dentro de `build-artifacts` depois que `dist/` e `dist-runtime/` já foram compilados.

A CI Android executa `testPlayDebugUnitTest` e `testThirdPartyDebugUnitTest` e depois compila o APK debug Play. O flavor third-party não tem source set nem manifesto separados; sua lane de teste unitário ainda compila o flavor com as flags BuildConfig de SMS/call-log, evitando ao mesmo tempo um job duplicado de empacotamento de APK debug em cada push relevante para Android.

O shard `check-dependencies` executa `pnpm deadcode:dependencies` (uma passagem do Knip somente para dependências de produção fixada à versão mais recente do Knip, com a idade mínima de release do pnpm desativada para a instalação via `dlx`) e `pnpm deadcode:unused-files`, que compara os achados de arquivos de produção não usados do Knip com `scripts/deadcode-unused-files.allowlist.mjs`. A guarda de arquivos não usados falha quando um PR adiciona um novo arquivo não usado sem revisão ou deixa uma entrada obsoleta na allowlist, preservando superfícies intencionais de Plugin dinâmico, geradas, build, live-test e bridges de pacote que o Knip não consegue resolver estaticamente.

## Encaminhamento de atividade do ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` é a ponte do lado de destino da atividade do repositório OpenClaw para o ClawSweeper. Ele não faz checkout nem executa código de pull request não confiável. O workflow cria um token de GitHub App a partir de `CLAWSWEEPER_APP_PRIVATE_KEY` e então dispara payloads compactos de `repository_dispatch` para `openclaw/clawsweeper`.

O workflow tem quatro lanes:

- `clawsweeper_item` para solicitações exatas de revisão de issue e pull request;
- `clawsweeper_comment` para comandos explícitos do ClawSweeper em comentários de issue;
- `clawsweeper_commit_review` para solicitações de revisão em nível de commit em pushes para `main`;
- `github_activity` para atividade geral do GitHub que o agente ClawSweeper pode inspecionar.

A lane `github_activity` encaminha apenas metadados normalizados: tipo de evento, ação, ator, repositório, número do item, URL, título, estado e trechos curtos de comentários ou revisões quando presentes. Ela evita intencionalmente encaminhar o corpo completo do Webhook. O workflow receptor em `openclaw/clawsweeper` é `.github/workflows/github-activity.yml`, que publica o evento normalizado no hook do OpenClaw Gateway para o agente ClawSweeper.

Atividade geral é observação, não entrega por padrão. O agente ClawSweeper recebe o destino do Discord em seu prompt e deve publicar em `#clawsweeper` somente quando o evento for surpreendente, acionável, arriscado ou operacionalmente útil. Aberturas rotineiras, edições, ruído de bots, ruído de Webhook duplicado e tráfego normal de revisão devem resultar em `NO_REPLY`.

Trate títulos, comentários, corpos, texto de revisão, nomes de branches e mensagens de commit do GitHub como dados não confiáveis em todo esse caminho. Eles são entrada para resumo e triagem, não instruções para o workflow ou o runtime do agente.

## Disparos manuais

As execuções manuais de CI executam o mesmo grafo de jobs que a CI normal, mas forçam a ativação de todas as faixas com escopo não Android: fragmentos Linux Node, fragmentos de Plugin empacotado, contratos de canal, compatibilidade com Node 22, `check`, `check-additional`, smoke de build, verificações de documentação, Skills em Python, Windows, macOS e i18n da Control UI. Execuções manuais autônomas de CI executam apenas Android com `include_android=true`; o guarda-chuva de release completo habilita Android passando `include_android=true`. Verificações estáticas de pré-lançamento de Plugin, o fragmento exclusivo de release `agentic-plugins`, a varredura em lote completa de extensão e as faixas Docker de pré-lançamento de Plugin são excluídos da CI. A suíte Docker de pré-lançamento roda apenas quando `Full Release Validation` dispara o workflow separado `Plugin Prerelease` com o gate de validação de release habilitado.

Execuções manuais usam um grupo de concorrência exclusivo para que uma suíte completa de candidato a release não seja cancelada por outra execução de push ou PR na mesma ref. A entrada opcional `target_ref` permite que um chamador confiável execute esse grafo em relação a uma branch, tag ou SHA de commit completo enquanto usa o arquivo de workflow da ref de disparo selecionada.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, jobs e agregações rápidas de segurança (`security-scm-fast`, `security-dependency-audit`, `security-fast`), verificações rápidas de protocolo/contrato/empacotados, verificações fragmentadas de contrato de canal, fragmentos de `check` exceto lint, fragmentos e agregações de `check-additional`, verificadores agregados de testes Node, verificações de documentação, Skills em Python, workflow-sanity, labeler, auto-response; o preflight de install-smoke também usa Ubuntu hospedado pelo GitHub para que a matriz Blacksmith possa entrar na fila mais cedo |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, fragmentos de extensão de menor peso, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` e `check-test-types`                                                                                                                                                                                                                                                                                                             |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, fragmentos de teste Linux Node, fragmentos de teste de Plugin empacotado, `android`                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (sensível o suficiente a CPU para que 8 vCPU custassem mais do que economizaram); builds Docker de install-smoke (o tempo de fila de 32 vCPU custou mais do que economizou)                                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` em `openclaw/openclaw`; forks recorrem a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` em `openclaw/openclaw`; forks recorrem a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                |

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

`OpenClaw Performance` é o workflow de desempenho do produto/runtime. Ele roda diariamente em `main` e pode ser disparado manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

O workflow instala o OCM de um release fixado e o Kova da entrada `kova_ref` fixada, depois executa três faixas:

- `mock-provider`: cenários de diagnóstico Kova em relação a um runtime de build local com autenticação falsa determinística compatível com OpenAI.
- `mock-deep-profile`: perfilamento de CPU/heap/trace para pontos críticos de inicialização, Gateway e turno de agente.
- `live-gpt54`: um turno real de agente OpenAI `openai/gpt-5.4`, ignorado quando `OPENAI_API_KEY` não está disponível.

A faixa mock-provider também executa sondagens de fonte nativas do OpenClaw após a passagem Kova: tempo de boot e memória do Gateway nos casos de inicialização padrão, com hook e com 50 Plugins; loops repetidos de hello `channel-chat-baseline` com mock-OpenAI; e comandos de inicialização da CLI em relação ao Gateway inicializado. O resumo Markdown da sondagem de fonte fica em `source/index.md` no pacote de relatório, com JSON bruto ao lado.

Todas as faixas enviam artefatos do GitHub. Quando `CLAWGRIT_REPORTS_TOKEN` está configurado, o workflow também comita `report.json`, `report.md`, pacotes, `index.md` e artefatos de sondagem de fonte em `openclaw/clawgrit-reports` sob `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`. O ponteiro da branch atual é gravado como `openclaw-performance/<ref>/latest-<lane>.json`.

## Validação Completa de Release

`Full Release Validation` é o workflow guarda-chuva manual para "executar tudo antes do release." Ele aceita uma branch, tag ou SHA de commit completo, dispara o workflow manual `CI` com esse alvo, dispara `Plugin Prerelease` para provas exclusivas de release de Plugin/pacote/estáticas/Docker e dispara `OpenClaw Release Checks` para smoke de instalação, aceitação de pacote, suítes Docker de caminho de release, live/E2E, OpenWebUI, paridade QA Lab, Matrix e faixas Telegram. Com `rerun_group=all` e `release_profile=full`, ele também executa `NPM Telegram Beta E2E` em relação ao artefato `release-package-under-test` das verificações de release. Após a publicação, passe `npm_telegram_package_spec` para executar novamente a mesma faixa de pacote Telegram em relação ao pacote npm publicado.

Consulte [Validação completa de release](/pt-BR/reference/full-release-validation) para a
matriz de estágios, nomes exatos dos jobs de workflow, diferenças de perfil, artefatos e
identificadores de reexecução focada.

`OpenClaw Release Publish` é o workflow manual mutável de release. Dispare-o
de `release/YYYY.M.D` ou `main` depois que a tag de release existir e depois que o
preflight npm do OpenClaw tiver sido bem-sucedido. Ele verifica `pnpm plugins:sync:check`,
dispara `Plugin NPM Release` para todos os pacotes de Plugin publicáveis, dispara
`Plugin ClawHub Release` para o mesmo SHA de release e só então dispara
`OpenClaw NPM Release` com o `preflight_run_id` salvo.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Para prova de commit fixado em uma branch de movimento rápido, use o helper em vez de
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Refs de dispatch de workflow do GitHub devem ser branches ou tags, não SHAs de commit brutos. O
helper envia uma branch temporária `release-ci/<sha>-...` no SHA alvo,
dispara `Full Release Validation` a partir dessa ref fixada, verifica se todo
`headSha` de workflow filho corresponde ao alvo e exclui a branch temporária quando a
execução termina. O verificador guarda-chuva também falha se qualquer workflow filho tiver rodado em um
SHA diferente.

`release_profile` controla a amplitude live/provedor passada para as verificações de release. Os
workflows manuais de release usam `stable` por padrão; use `full` apenas quando você
intencionalmente quiser a matriz ampla consultiva de provedores/mídia.

- `minimum` mantém as faixas críticas de release mais rápidas de OpenAI/core.
- `stable` adiciona o conjunto estável de provedores/backends.
- `full` executa a matriz ampla consultiva de provedores/mídia.

O guarda-chuva registra os ids das execuções filhas disparadas, e o job final `Verify full validation` verifica novamente as conclusões atuais das execuções filhas e anexa tabelas dos jobs mais lentos para cada execução filha. Se um workflow filho for reexecutado e ficar verde, reexecute apenas o job verificador pai para atualizar o resultado do guarda-chuva e o resumo de tempos.

Para recuperação, tanto `Full Release Validation` quanto `OpenClaw Release Checks` aceitam `rerun_group`. Use `all` para um candidato a lançamento, `ci` somente para o filho de CI completo normal, `plugin-prerelease` somente para o filho de pré-lançamento do plugin, `release-checks` para todos os filhos de lançamento, ou um grupo mais estreito: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` no guarda-chuva. Isso mantém limitada a nova execução de uma caixa de lançamento com falha após uma correção focada.

`OpenClaw Release Checks` usa a ref de workflow confiável para resolver a ref selecionada uma vez em um tarball `release-package-under-test`, depois passa esse artefato tanto para o workflow Docker de caminho de lançamento live/E2E quanto para o fragmento de aceitação de pacote. Isso mantém os bytes do pacote consistentes entre as caixas de lançamento e evita reempacotar o mesmo candidato em vários trabalhos filhos.

Execuções duplicadas de `Full Release Validation` para `ref=main` e `rerun_group=all`
substituem o guarda-chuva mais antigo. O monitor pai cancela qualquer workflow filho que
já tenha disparado quando o pai é cancelado, então a validação mais nova de main
não fica atrás de uma execução obsoleta de duas horas de release-check. A validação
de branch/tag de lançamento e os grupos de nova execução focada mantêm `cancel-in-progress: false`.

## Fragmentos live e E2E

O filho live/E2E de lançamento mantém ampla cobertura nativa de `pnpm test:live`, mas a executa como fragmentos nomeados por meio de `scripts/test-live-shard.mjs` em vez de um trabalho serial:

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
- fragmentos separados de áudio/vídeo de mídia e fragmentos de música filtrados por provedor

Isso mantém a mesma cobertura de arquivos enquanto torna falhas lentas de provedores live mais fáceis de executar novamente e diagnosticar. Os nomes agregados de fragmentos `native-live-extensions-o-z`, `native-live-extensions-media` e `native-live-extensions-media-music` continuam válidos para novas execuções manuais de tentativa única.

Os fragmentos nativos de mídia live rodam em `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, criado pelo workflow `Live Media Runner Image`. Essa imagem pré-instala `ffmpeg` e `ffprobe`; trabalhos de mídia apenas verificam os binários antes da configuração. Mantenha suítes live com suporte de Docker em runners Blacksmith normais — trabalhos em contêiner são o lugar errado para iniciar testes Docker aninhados.

Fragmentos live de modelo/backend com suporte de Docker usam uma imagem compartilhada separada `ghcr.io/openclaw/openclaw-live-test:<sha>` por commit selecionado. O workflow live de lançamento cria e envia essa imagem uma vez, depois os fragmentos de modelo live Docker, Gateway fragmentado por provedor, backend de CLI, vínculo ACP e harness Codex rodam com `OPENCLAW_SKIP_DOCKER_BUILD=1`. Fragmentos Docker de Gateway carregam limites explícitos de `timeout` em nível de script abaixo do timeout do trabalho do workflow, para que um contêiner travado ou caminho de limpeza falhe rápido em vez de consumir todo o orçamento de release-check. Se esses fragmentos recriarem o alvo Docker de código-fonte completo de forma independente, a execução de lançamento está mal configurada e desperdiçará tempo de relógio em builds de imagem duplicados.

## Aceitação de pacote

Use `Package Acceptance` quando a pergunta for "este pacote OpenClaw instalável funciona como um produto?" Ela é diferente da CI normal: a CI normal valida a árvore de código-fonte, enquanto a aceitação de pacote valida um único tarball pelo mesmo harness Docker E2E que os usuários exercitam após instalar ou atualizar.

### Trabalhos

1. `resolve_package` faz checkout de `workflow_ref`, resolve um candidato de pacote, grava `.artifacts/docker-e2e-package/openclaw-current.tgz`, grava `.artifacts/docker-e2e-package/package-candidate.json`, envia ambos como o artefato `package-under-test` e imprime a origem, a ref do workflow, a ref do pacote, a versão, SHA-256 e o perfil no resumo de etapa do GitHub.
2. `docker_acceptance` chama `openclaw-live-and-e2e-checks-reusable.yml` com `ref=workflow_ref` e `package_artifact_name=package-under-test`. O workflow reutilizável baixa esse artefato, valida o inventário do tarball, prepara imagens Docker de package-digest quando necessário e executa as lanes Docker selecionadas contra esse pacote em vez de empacotar o checkout do workflow. Quando um perfil seleciona várias `docker_lanes` direcionadas, o workflow reutilizável prepara o pacote e as imagens compartilhadas uma vez, depois distribui essas lanes como trabalhos Docker direcionados paralelos com artefatos exclusivos.
3. `package_telegram` chama opcionalmente `NPM Telegram Beta E2E`. Ele roda quando `telegram_mode` não é `none` e instala o mesmo artefato `package-under-test` quando Package Acceptance resolveu um; o disparo independente do Telegram ainda pode instalar uma especificação npm publicada.
4. `summary` falha o workflow se a resolução de pacote, a aceitação Docker ou a lane opcional do Telegram falhou.

### Fontes de candidatos

- `source=npm` aceita apenas `openclaw@beta`, `openclaw@latest` ou uma versão exata de lançamento do OpenClaw, como `openclaw@2026.4.27-beta.2`. Use isso para aceitação de pré-lançamento/estável publicada.
- `source=ref` empacota uma branch, tag ou SHA completo de commit de `package_ref` confiável. O resolvedor busca branches/tags do OpenClaw, verifica se o commit selecionado é alcançável a partir do histórico de branches do repositório ou de uma tag de lançamento, instala dependências em uma worktree destacada e o empacota com `scripts/package-openclaw-for-docker.mjs`.
- `source=url` baixa um `.tgz` HTTPS; `package_sha256` é obrigatório.
- `source=artifact` baixa um `.tgz` de `artifact_run_id` e `artifact_name`; `package_sha256` é opcional, mas deve ser fornecido para artefatos compartilhados externamente.

Mantenha `workflow_ref` e `package_ref` separados. `workflow_ref` é o código confiável de workflow/harness que executa o teste. `package_ref` é o commit de origem que é empacotado quando `source=ref`. Isso permite que o harness de teste atual valide commits de origem confiáveis mais antigos sem executar lógica antiga de workflow.

### Perfis de suíte

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` mais `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — blocos Docker completos de caminho de lançamento com OpenWebUI
- `custom` — `docker_lanes` exatas; obrigatório quando `suite_profile=custom`

O perfil `package` usa cobertura de Plugin offline para que a validação de pacote publicado não dependa da disponibilidade live do ClawHub. A lane opcional do Telegram reutiliza o artefato `package-under-test` em `NPM Telegram Beta E2E`, mantendo o caminho de especificação npm publicada para disparos independentes.

Para a política dedicada de testes de atualização e Plugin, incluindo comandos locais,
lanes Docker, entradas de Package Acceptance, padrões de lançamento e triagem de falhas,
consulte [Testando atualizações e plugins](/pt-BR/help/testing-updates-plugins).

As verificações de lançamento chamam Package Acceptance com `source=artifact`, o artefato de pacote de lançamento preparado, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` e `telegram_mode=mock-openai`. Isso mantém migração de pacote, atualização, limpeza de dependência obsoleta de Plugin, reparo de instalação de Plugin configurado, Plugin offline, atualização de Plugin e prova do Telegram no mesmo tarball de pacote resolvido. Defina `package_acceptance_package_spec` em Full Release Validation ou OpenClaw Release Checks para executar essa mesma matriz contra um pacote npm enviado em vez do artefato criado a partir do SHA. As verificações de lançamento entre sistemas operacionais ainda cobrem onboarding, instalador e comportamento de plataforma específicos do sistema operacional; a validação de produto de pacote/atualização deve começar com Package Acceptance. A lane Docker `published-upgrade-survivor` valida uma linha de base de pacote publicado por execução. Em Package Acceptance, o tarball `package-under-test` resolvido é sempre o candidato e `published_upgrade_survivor_baseline` seleciona a linha de base publicada reserva, com padrão para `openclaw@latest`; comandos de nova execução de lane com falha preservam essa linha de base. Defina `published_upgrade_survivor_baselines=all-since-2026.4.23` para expandir a CI de Full Release por todas as versões npm estáveis de `2026.4.23` até `latest`; `release-history` continua disponível para amostragem manual mais ampla com a âncora anterior à data mais antiga. Defina `published_upgrade_survivor_scenarios=reported-issues` para expandir as mesmas linhas de base por fixtures em formato de issues para configuração do Feishu, arquivos de bootstrap/persona preservados, instalações configuradas de Plugin do OpenClaw, caminhos de log com til e raízes obsoletas de dependência de Plugin legado. O workflow separado `Update Migration` usa a lane Docker `update-migration` com `all-since-2026.4.23` e `plugin-deps-cleanup` quando a pergunta é limpeza exaustiva de atualização publicada, não a amplitude normal de CI de Full Release. Execuções agregadas locais podem passar especificações exatas de pacote com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, manter uma única lane com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, como `openclaw@2026.4.15`, ou definir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para a matriz de cenários. A lane publicada configura a linha de base com uma receita de comando `openclaw config set` embutida, registra etapas da receita em `summary.json` e sonda `/healthz`, `/readyz`, além do status RPC após o início do Gateway. As lanes novas de pacote e instalador no Windows também verificam que um pacote instalado pode importar uma substituição de controle de navegador a partir de um caminho Windows absoluto bruto. O smoke de turno de agente OpenAI entre sistemas operacionais usa como padrão `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando definido, caso contrário `openai/gpt-5.4`, para que a prova de instalação e Gateway permaneça em um modelo de teste GPT-5 enquanto evita padrões GPT-4.x.

### Janelas de compatibilidade legadas

Package Acceptance tem janelas delimitadas de compatibilidade legada para pacotes já publicados. Pacotes até `2026.4.25`, incluindo `2026.4.25-beta.*`, podem usar o caminho de compatibilidade:

- entradas privadas conhecidas de QA em `dist/postinstall-inventory.json` podem apontar para arquivos omitidos do tarball;
- `doctor-switch` pode pular o subcaso de persistência de `gateway install --wrapper` quando o pacote não expõe essa flag;
- `update-channel-switch` pode remover `pnpm.patchedDependencies` ausentes da fixture git falsa derivada do tarball e pode registrar `update.channel` persistido ausente;
- smokes de Plugin podem ler locais legados de registro de instalação ou aceitar persistência ausente de registro de instalação do marketplace;
- `plugin-update` pode permitir migração de metadados de configuração enquanto ainda exige que o registro de instalação e o comportamento de não reinstalação permaneçam inalterados.

O pacote publicado `2026.4.26` também pode avisar sobre arquivos de carimbo de metadados de build local que já foram enviados. Pacotes posteriores devem satisfazer os contratos modernos; as mesmas condições falham em vez de avisar ou pular.

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

Ao depurar uma execução de aceitação de pacote com falha, comece pelo resumo `resolve_package` para confirmar a origem, a versão e o SHA-256 do pacote. Em seguida, inspecione a execução filha `docker_acceptance` e seus artefatos Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logs de lanes, tempos de fases e comandos de reexecução. Prefira reexecutar o perfil de pacote com falha ou as lanes Docker exatas em vez de reexecutar a validação completa de release.

## Smoke de instalação

O workflow separado `Install Smoke` reutiliza o mesmo script de escopo por meio do próprio job `preflight`. Ele divide a cobertura de smoke em `run_fast_install_smoke` e `run_full_install_smoke`.

- **Caminho rápido** é executado para pull requests que tocam superfícies Docker/pacote, mudanças de pacote/manifesto de plugins incluídos ou superfícies principais de plugin/canal/gateway/Plugin SDK que os jobs de smoke Docker exercitam. Mudanças somente de código-fonte em plugins incluídos, edições somente de teste e edições somente de documentação não reservam workers Docker. O caminho rápido compila a imagem do Dockerfile raiz uma vez, verifica a CLI, executa o smoke de CLI de exclusão de agentes em workspace compartilhado, executa o e2e de gateway-network em contêiner, verifica um argumento de build de extensão incluída e executa o perfil Docker limitado de plugins incluídos sob um timeout agregado de comando de 240 segundos (com cada execução Docker de cenário limitada separadamente).
- **Caminho completo** mantém a instalação de pacote QR e a cobertura Docker/update do instalador para execuções agendadas noturnas, disparos manuais, verificações de release via workflow-call e pull requests que realmente tocam superfícies de instalador/pacote/Docker. No modo completo, install-smoke prepara ou reutiliza uma imagem de smoke do Dockerfile raiz GHCR no SHA de destino, depois executa instalação de pacote QR, smokes do Dockerfile raiz/gateway, smokes de instalador/update e o E2E Docker rápido de plugins incluídos como jobs separados para que o trabalho do instalador não fique esperando atrás dos smokes da imagem raiz.

Pushes para `main` (incluindo commits de merge) não forçam o caminho completo; quando a lógica de escopo alterado pediria cobertura completa em um push, o workflow mantém o smoke Docker rápido e deixa o smoke de instalação completo para a validação noturna ou de release.

O smoke lento de instalação global Bun do image-provider é controlado separadamente por `run_bun_global_install_smoke`. Ele é executado na agenda noturna e a partir do workflow de verificações de release, e disparos manuais de `Install Smoke` podem optar por incluí-lo, mas pull requests e pushes para `main` não. Testes Docker de QR e instalador mantêm seus próprios Dockerfiles focados em instalação.

## E2E Docker local

`pnpm test:docker:all` pré-compila uma imagem compartilhada de teste live, empacota o OpenClaw uma vez como tarball npm e compila duas imagens compartilhadas de `scripts/e2e/Dockerfile`:

- um executor Node/Git básico para lanes de instalador/update/dependência de plugin;
- uma imagem funcional que instala o mesmo tarball em `/app` para lanes de funcionalidade normal.

As definições de lanes Docker ficam em `scripts/lib/docker-e2e-scenarios.mjs`, a lógica do planejador fica em `scripts/lib/docker-e2e-plan.mjs`, e o executor só executa o plano selecionado. O escalonador seleciona a imagem por lane com `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, depois executa as lanes com `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Ajustes

| Variável                               | Padrão | Finalidade                                                                                         |
| -------------------------------------- | ------ | -------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10     | Contagem de slots do pool principal para lanes normais.                                            |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10     | Contagem de slots do pool final sensível a provedores.                                             |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9      | Limite de lanes live concorrentes para que os provedores não apliquem throttling.                   |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10     | Limite de lanes de instalação npm concorrentes.                                                     |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7      | Limite de lanes multisserviço concorrentes.                                                         |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000   | Intervalo entre inícios de lanes para evitar tempestades de criação no daemon Docker; defina `0` para não escalonar. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Timeout de fallback por lane (120 minutos); lanes live/finais selecionadas usam limites mais rígidos. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset  | `1` imprime o plano do escalonador sem executar lanes.                                             |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset  | Lista de lanes exatas separadas por vírgula; pula o smoke de limpeza para que agentes possam reproduzir uma lane com falha. |

Uma lane mais pesada que seu limite efetivo ainda pode iniciar a partir de um pool vazio, depois roda sozinha até liberar capacidade. Os preflights agregados locais verificam o Docker, removem contêineres E2E obsoletos do OpenClaw, emitem status de lanes ativas, persistem tempos de lanes para ordenação da mais longa para a mais curta e deixam de agendar novas lanes em pool após a primeira falha por padrão.

### Workflow live/E2E reutilizável

O workflow live/E2E reutilizável pergunta a `scripts/test-docker-all.mjs --plan-json` qual pacote, tipo de imagem, imagem live, lane e cobertura de credenciais são necessários. `scripts/docker-e2e.mjs` então converte esse plano em saídas e resumos do GitHub. Ele empacota o OpenClaw por meio de `scripts/package-openclaw-for-docker.mjs`, baixa um artefato de pacote da execução atual ou baixa um artefato de pacote de `package_artifact_run_id`; valida o inventário do tarball; compila e envia imagens GHCR Docker E2E básicas/funcionais marcadas por digest do pacote por meio do cache de camadas Docker do Blacksmith quando o plano precisa de lanes com pacote instalado; e reutiliza entradas `docker_e2e_bare_image`/`docker_e2e_functional_image` fornecidas ou imagens existentes por digest de pacote em vez de recompilar. Pulls de imagem Docker são repetidos com timeout limitado de 180 segundos por tentativa para que um stream travado de registro/cache seja repetido rapidamente em vez de consumir a maior parte do caminho crítico de CI.

### Chunks do caminho de release

A cobertura Docker de release executa jobs menores em chunks com `OPENCLAW_SKIP_DOCKER_BUILD=1`, para que cada chunk baixe apenas o tipo de imagem de que precisa e execute várias lanes pelo mesmo escalonador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Os chunks Docker de release atuais são `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` e de `plugins-runtime-install-a` até `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` permanecem aliases agregados de plugin/runtime. O alias de lane `install-e2e` permanece o alias agregado de reexecução manual para ambas as lanes de instalador de provedor.

OpenWebUI é incorporado em `plugins-runtime-services` quando a cobertura completa do caminho de release o solicita, e mantém um chunk autônomo `openwebui` apenas para disparos somente de OpenWebUI. Lanes de atualização de canais incluídos tentam novamente uma vez em caso de falhas transitórias de rede npm.

Cada chunk envia `.artifacts/docker-tests/` com logs de lanes, tempos, `summary.json`, `failures.json`, tempos de fases, JSON do plano do escalonador, tabelas de lanes lentas e comandos de reexecução por lane. A entrada `docker_lanes` do workflow executa lanes selecionadas contra as imagens preparadas em vez dos jobs em chunks, o que mantém a depuração de lane com falha limitada a um job Docker direcionado e prepara, baixa ou reutiliza o artefato de pacote para essa execução; se uma lane selecionada for uma lane Docker live, o job direcionado compila a imagem de teste live localmente para essa reexecução. Comandos de reexecução GitHub gerados por lane incluem `package_artifact_run_id`, `package_artifact_name` e entradas de imagem preparada quando esses valores existem, para que uma lane com falha possa reutilizar exatamente o pacote e as imagens da execução com falha.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

O workflow live/E2E agendado executa diariamente toda a suíte Docker do caminho de release.

## Pré-release de Plugin

`Plugin Prerelease` é uma cobertura de produto/pacote mais cara, portanto é um workflow separado disparado por `Full Release Validation` ou por um operador explícito. Pull requests normais, pushes para `main` e disparos manuais autônomos de CI mantêm essa suíte desligada. Ele equilibra testes de plugins incluídos entre oito workers de extensão; esses jobs de shards de extensão executam até dois grupos de configuração de plugin por vez, com um worker Vitest por grupo e um heap Node maior para que lotes de plugins pesados em importação não criem jobs de CI extras. O caminho Docker de pré-release somente para release agrupa lanes Docker direcionadas em pequenos grupos para evitar reservar dezenas de executores para jobs de um a três minutos.

## QA Lab

O QA Lab tem lanes de CI dedicadas fora do workflow principal com escopo inteligente. A paridade agêntica fica aninhada sob os harnesses amplos de QA e release, não em um workflow de PR autônomo. Use `Full Release Validation` com `rerun_group=qa-parity` quando a paridade deve acompanhar uma execução de validação ampla.

- O workflow `QA-Lab - All Lanes` roda todas as noites em `main` e em disparo manual; ele distribui a lane de paridade mock, a lane live Matrix e as lanes live Telegram e Discord como jobs paralelos. Jobs live usam o ambiente `qa-live-shared`, e Telegram/Discord usam leases Convex.

As verificações de release executam lanes de transporte live Matrix e Telegram com o provedor mock determinístico e modelos qualificados por mock (`mock-openai/gpt-5.5` e `mock-openai/gpt-5.5-alt`) para que o contrato de canal fique isolado da latência de modelo live e da inicialização normal de plugin de provedor. O Gateway de transporte live desativa a busca de memória porque a paridade de QA cobre o comportamento de memória separadamente; a conectividade de provedores é coberta pelas suítes separadas de modelo live, provedor nativo e provedor Docker.

Matrix usa `--profile fast` para gates agendados e de release, adicionando `--fail-fast` apenas quando a CLI em checkout oferece suporte a isso. O padrão da CLI e a entrada manual do workflow continuam sendo `all`; o disparo manual `matrix_profile=all` sempre divide a cobertura Matrix completa em jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`.

`OpenClaw Release Checks` também executa as lanes críticas de release do QA Lab antes da aprovação de release; seu gate de paridade de QA executa os pacotes candidato e baseline como jobs de lane paralelos, depois baixa ambos os artefatos em um pequeno job de relatório para a comparação final de paridade.

Para PRs normais, siga evidências de CI/verificação com escopo em vez de tratar paridade como um status obrigatório.

## CodeQL

O workflow `CodeQL` é intencionalmente um scanner inicial de segurança restrito, não uma varredura completa do repositório. Execuções de guarda diárias, manuais e de pull requests que não sejam rascunho examinam código de workflows do Actions mais as superfícies JavaScript/TypeScript de maior risco com consultas de segurança de alta confiança filtradas para `security-severity` alta/crítica.

O guarda de pull requests permanece leve: ele só inicia para mudanças em `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` ou `src`, e executa a mesma matriz de segurança de alta confiança do workflow agendado. O CodeQL para Android e macOS fica fora dos padrões de PR.

### Categorias de segurança

| Categoria                                         | Superfície                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Linha de base de autenticação, segredos, sandbox, Cron e Gateway                                                                    |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementação de canais centrais mais runtime de Plugin de canal, Gateway, Plugin SDK, segredos e pontos de auditoria  |
| `/codeql-security-high/network-ssrf-boundary`     | Superfícies centrais de SSRF, análise de IP, guarda de rede, web-fetch e política de SSRF do Plugin SDK                             |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, auxiliares de execução de processos, entrega de saída e gates de execução de ferramentas de agente                  |
| `/codeql-security-high/plugin-trust-boundary`     | Superfícies de confiança de instalação de Plugin, loader, manifesto, registro, instalação por gerenciador de pacotes, carregamento de fonte e contrato de pacote do Plugin SDK |

### Shards de segurança específicos de plataforma

- `CodeQL Android Critical Security` — shard agendado de segurança do Android. Compila o app Android manualmente para CodeQL no menor runner Blacksmith Linux aceito pela sanidade do workflow. Envia para `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard semanal/manual de segurança do macOS. Compila o app macOS manualmente para CodeQL no Blacksmith macOS, filtra resultados de compilação de dependências para fora do SARIF enviado e envia para `/codeql-critical-security/macos`. Mantido fora dos padrões diários porque a compilação do macOS domina o runtime mesmo quando está limpa.

### Categorias de qualidade crítica

`CodeQL Critical Quality` é o shard não relacionado a segurança correspondente. Ele executa apenas consultas de qualidade JavaScript/TypeScript sem segurança e com severidade de erro sobre superfícies restritas de alto valor no runner Blacksmith Linux menor. Seu guarda de pull requests é intencionalmente menor que o perfil agendado: PRs que não sejam rascunho executam apenas os shards correspondentes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` e `plugin-sdk-reply-runtime` para mudanças em código de execução de comando/modelo/ferramenta de agente e despacho de resposta, schema/migração/IO de configuração, código de autenticação/segredos/sandbox/segurança, canal central e runtime de Plugin de canal incluído, protocolo Gateway/método de servidor, runtime de memória/cola do SDK, MCP/processo/entrega de saída, runtime de provedor/catálogo de modelos, diagnósticos de sessão/filas de entrega, loader de Plugin, Plugin SDK/contrato de pacote ou runtime de resposta do Plugin SDK. Mudanças na configuração do CodeQL e no workflow de qualidade executam todos os doze shards de qualidade de PR.

O despacho manual aceita:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Os perfis restritos são ganchos de ensino/iteração para executar um shard de qualidade isoladamente.

| Categoria                                               | Superfície                                                                                                                                                                      |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Código de limite de segurança de autenticação, segredos, sandbox, Cron e Gateway                                                                                                |
| `/codeql-critical-quality/config-boundary`              | Contratos de schema de configuração, migração, normalização e IO                                                                                                                |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schemas do protocolo Gateway e contratos de métodos de servidor                                                                                                                 |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementação de canal central e Plugin de canal incluído                                                                                                          |
| `/codeql-critical-quality/agent-runtime-boundary`       | Execução de comandos, despacho de modelo/provedor, despacho e filas de resposta automática e contratos de runtime do plano de controle ACP                                      |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP e pontes de ferramentas, auxiliares de supervisão de processos e contratos de entrega de saída                                                                   |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK do host de memória, facades de runtime de memória, aliases de memória do Plugin SDK, cola de ativação do runtime de memória e comandos de doctor de memória                 |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internos de fila de respostas, filas de entrega de sessão, auxiliares de vinculação/entrega de sessão de saída, superfícies de evento diagnóstico/pacote de logs e contratos CLI de doctor de sessão |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de resposta de entrada do Plugin SDK, auxiliares de payload/fragmentação/runtime de resposta, opções de resposta de canal, filas de entrega e auxiliares de vinculação de sessão/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalização de catálogo de modelos, autenticação e descoberta de provedor, registro de runtime de provedor, padrões/catálogos de provedor e registros de web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap da UI de controle, persistência local, fluxos de controle do Gateway e contratos de runtime do plano de controle de tarefas                                           |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Web fetch/search central, IO de mídia, entendimento de mídia, geração de imagens e contratos de runtime de geração de mídia                                                     |
| `/codeql-critical-quality/plugin-boundary`              | Contratos de loader, registro, superfície pública e pontos de entrada do Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Código-fonte publicado do lado do pacote do Plugin SDK e auxiliares de contrato de pacote de Plugin                                                                             |

A qualidade fica separada da segurança para que achados de qualidade possam ser agendados, medidos, desativados ou expandidos sem obscurecer o sinal de segurança. A expansão do CodeQL para Swift, Python e plugins incluídos deve ser adicionada de volta como trabalho de acompanhamento escopado ou fragmentado somente depois que os perfis restritos tiverem runtime e sinal estáveis.

## Workflows de manutenção

### Docs Agent

O workflow `Docs Agent` é uma lane de manutenção Codex orientada a eventos para manter a documentação existente alinhada com mudanças recém-integradas. Ele não tem agenda pura: uma execução de CI bem-sucedida de push que não seja de bot em `main` pode acioná-lo, e o despacho manual pode executá-lo diretamente. Invocações por workflow-run são ignoradas quando `main` avançou ou quando outra execução não ignorada do Docs Agent foi criada na última hora. Quando executa, ele revisa o intervalo de commits do SHA de origem anterior não ignorado do Docs Agent até o `main` atual, para que uma execução horária possa cobrir todas as mudanças em main acumuladas desde a última passada de documentação.

### Test Performance Agent

O workflow `Test Performance Agent` é uma lane de manutenção Codex orientada a eventos para testes lentos. Ele não tem agenda pura: uma execução de CI bem-sucedida de push que não seja de bot em `main` pode acioná-lo, mas ele é ignorado se outra invocação por workflow-run já executou ou está executando naquele dia UTC. O despacho manual contorna esse gate de atividade diária. A lane cria um relatório de desempenho agrupado do Vitest para a suíte completa, permite que o Codex faça apenas pequenas correções de desempenho de testes preservando a cobertura em vez de refatorações amplas, depois reexecuta o relatório da suíte completa e rejeita mudanças que reduzam a contagem de testes aprovados da linha de base. Se a linha de base tiver testes falhando, o Codex pode corrigir apenas falhas óbvias e o relatório de suíte completa pós-agente deve passar antes que qualquer coisa seja commitada. Quando `main` avança antes do push do bot entrar, a lane faz rebase do patch validado, reexecuta `pnpm check:changed` e tenta o push novamente; patches obsoletos com conflito são ignorados. Ela usa Ubuntu hospedado no GitHub para que a ação Codex possa manter a mesma postura de segurança drop-sudo do agente de documentação.

### PRs duplicados após merge

O workflow `Duplicate PRs After Merge` é um workflow manual de mantenedor para limpeza de duplicatas pós-integração. Ele usa dry-run por padrão e só fecha PRs listados explicitamente quando `apply=true`. Antes de modificar o GitHub, ele verifica que o PR integrado recebeu merge e que cada duplicata tem uma issue referenciada compartilhada ou hunks alterados sobrepostos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gates de verificação local e roteamento de mudanças

A lógica local de changed-lane fica em `scripts/changed-lanes.mjs` e é executada por `scripts/check-changed.mjs`. Esse gate de verificação local é mais rigoroso sobre limites de arquitetura que o escopo amplo da plataforma de CI:

- mudanças de produção no core executam typecheck de produção e de testes do core mais lint/guardas do core;
- mudanças somente em testes do core executam apenas typecheck de testes do core mais lint do core;
- mudanças de produção em extensão executam typecheck de produção e de testes de extensão mais lint de extensão;
- mudanças somente em testes de extensão executam typecheck de testes de extensão mais lint de extensão;
- mudanças no Plugin SDK público ou em contrato de Plugin expandem para typecheck de extensão porque extensões dependem desses contratos centrais (varreduras de extensão do Vitest continuam sendo trabalho de teste explícito);
- bumps de versão somente de metadados de release executam verificações direcionadas de versão/configuração/dependência raiz;
- mudanças desconhecidas em raiz/configuração falham com segurança para todas as lanes de verificação.

O roteamento local de testes alterados fica em `scripts/test-projects.test-support.mjs` e é intencionalmente mais barato que `check:changed`: edições diretas de testes executam a si mesmas, edições de fonte preferem mapeamentos explícitos, depois testes irmãos e dependentes do grafo de importação. A configuração compartilhada de entrega em salas de grupo é um dos mapeamentos explícitos: mudanças na configuração de resposta visível em grupo, no modo de entrega de resposta de origem ou no prompt de sistema da ferramenta de mensagens passam pelos testes centrais de resposta mais regressões de entrega do Discord e Slack, para que uma mudança de padrão compartilhado falhe antes do primeiro push de PR. Use `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` somente quando a mudança for ampla o suficiente no harness para que o conjunto mapeado barato não seja uma proxy confiável.

## Validação Testbox

Execute o Testbox a partir da raiz do repositório e prefira uma box aquecida nova para comprovação ampla. Antes de gastar uma verificação lenta em uma box que foi reutilizada, expirou ou acabou de relatar uma sincronização inesperadamente grande, execute `pnpm testbox:sanity` dentro da box primeiro.

A verificação de sanidade falha rápido quando arquivos raiz obrigatórios, como `pnpm-lock.yaml`, desaparecem ou quando `git status --short` mostra pelo menos 200 exclusões rastreadas. Isso geralmente significa que o estado de sincronização remota não é uma cópia confiável do PR; interrompa essa box e aqueça uma nova em vez de depurar a falha do teste do produto. Para PRs com grandes exclusões intencionais, defina `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para essa execução de sanidade.

`pnpm testbox:run` também encerra uma invocação local do Blacksmith CLI que permanece na fase de sincronização por mais de cinco minutos sem saída pós-sincronização. Defina `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` para desativar essa proteção, ou use um valor maior em milissegundos para diffs locais incomumente grandes.

Crabbox é o segundo caminho de box remota mantido pelo repositório para comprovação no Linux quando o Blacksmith não está disponível ou quando a capacidade de nuvem própria é preferível. Aqueça uma box, hidrate-a pelo workflow do projeto e então execute comandos pelo Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` controla os padrões de provedor, sincronização e hidratação do GitHub Actions. Ele exclui o `.git` local para que o checkout hidratado do Actions mantenha seus próprios metadados Git remotos, em vez de sincronizar remotos e armazenamentos de objetos locais de mantenedores, e exclui artefatos locais de runtime/build que nunca devem ser transferidos. `.github/workflows/crabbox-hydrate.yml` controla checkout, configuração de Node/pnpm, busca de `origin/main` e o repasse de ambiente não secreto que comandos posteriores `crabbox run --id <cbx_id>` usam como fonte.

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Canais de desenvolvimento](/pt-BR/install/development-channels)
