---
read_when:
    - Você precisa entender por que um job de CI foi ou não executado
    - Você está depurando uma verificação com falha do GitHub Actions
    - Você está coordenando uma execução ou reexecução de validação de lançamento
    - Você está alterando o despacho do ClawSweeper ou o encaminhamento de atividades do GitHub
summary: Grafo de tarefas de CI, controles de escopo, agrupadores de lançamento e equivalentes de comandos locais
title: Esteira de integração contínua
x-i18n:
    generated_at: "2026-05-03T21:27:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: e07fc44aa844cb66ce529c570cbbbbf502a61bcbcbc3d9488557abb459ef7678
    source_path: ci.md
    workflow: 16
---

OpenClaw CI é executado em cada push para `main` e em cada pull request. A tarefa `preflight` classifica o diff e desativa lanes caras quando apenas áreas não relacionadas mudaram. Execuções manuais de `workflow_dispatch` ignoram intencionalmente o escopo inteligente e expandem o grafo completo para candidatos a lançamento e validação ampla. As lanes Android permanecem opcionais por meio de `include_android`. A cobertura de Plugin exclusiva de lançamento fica no workflow separado [`Pré-lançamento de Plugin`](#plugin-prerelease) e só é executada a partir de [`Validação Completa de Lançamento`](#full-release-validation) ou de um disparo manual explícito.

## Visão geral do pipeline

| Tarefa                           | Finalidade                                                                                                | Quando é executada                 |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Detecta mudanças somente em docs, escopos alterados, extensões alteradas e gera o manifesto de CI         | Sempre em pushes e PRs não rascunho |
| `security-scm-fast`              | Detecção de chave privada e auditoria de workflow via `zizmor`                                            | Sempre em pushes e PRs não rascunho |
| `security-dependency-audit`      | Auditoria do lockfile de produção sem dependências contra avisos do npm                                   | Sempre em pushes e PRs não rascunho |
| `security-fast`                  | Agregado obrigatório para as tarefas rápidas de segurança                                                 | Sempre em pushes e PRs não rascunho |
| `check-dependencies`             | Passagem somente de dependências de produção do Knip mais a guarda da lista de permissões de arquivos não usados | Mudanças relevantes para Node      |
| `build-artifacts`                | Gera `dist/`, Control UI, verificações de artefatos gerados e artefatos downstream reutilizáveis          | Mudanças relevantes para Node      |
| `checks-fast-core`               | Lanes rápidas de correção no Linux, como verificações de bundled/plugin-contract/protocol                  | Mudanças relevantes para Node      |
| `checks-fast-contracts-channels` | Verificações fragmentadas de contrato de canais com um resultado agregado estável                         | Mudanças relevantes para Node      |
| `checks-node-core-test`          | Shards de teste do núcleo Node, excluindo lanes de canal, bundled, contrato e extensão                    | Mudanças relevantes para Node      |
| `check`                          | Equivalente fragmentado do gate local principal: tipos prod, lint, guardas, tipos de teste e smoke estrito | Mudanças relevantes para Node      |
| `check-additional`               | Arquitetura, drift fragmentado de fronteira/prompt, guardas de extensão, fronteira de pacote e gateway watch | Mudanças relevantes para Node      |
| `build-smoke`                    | Testes smoke da CLI gerada e smoke de memória de inicialização                                            | Mudanças relevantes para Node      |
| `checks`                         | Verificador para testes de canal de artefatos gerados                                                     | Mudanças relevantes para Node      |
| `checks-node-compat-node22`      | Lane de build e smoke de compatibilidade com Node 22                                                      | Disparo manual de CI para lançamentos |
| `check-docs`                     | Formatação, lint e verificações de links quebrados da documentação                                        | Docs alterados                     |
| `skills-python`                  | Ruff + pytest para skills com suporte em Python                                                           | Mudanças relevantes para skills Python |
| `checks-windows`                 | Testes de processo/caminho específicos do Windows mais regressões compartilhadas de especificadores de importação em runtime | Mudanças relevantes para Windows   |
| `macos-node`                     | Lane de teste TypeScript no macOS usando os artefatos gerados compartilhados                              | Mudanças relevantes para macOS     |
| `macos-swift`                    | Lint, build e testes Swift para o app macOS                                                               | Mudanças relevantes para macOS     |
| `android`                        | Testes unitários Android para ambos os flavors mais um build de APK debug                                 | Mudanças relevantes para Android   |
| `test-performance-agent`         | Otimização diária de testes lentos pelo Codex após atividade confiável                                    | Sucesso da CI principal ou disparo manual |
| `openclaw-performance`           | Relatórios diários/sob demanda de desempenho do runtime Kova com lanes mock-provider, deep-profile e GPT 5.4 live | Agendamento e disparo manual       |

## Ordem de falha rápida

1. `preflight` decide quais lanes existem. A lógica de `docs-scope` e `changed-scope` são etapas dentro dessa tarefa, não tarefas independentes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falham rapidamente sem esperar pelas tarefas mais pesadas de matriz de artefatos e plataformas.
3. `build-artifacts` se sobrepõe às lanes rápidas do Linux para que consumidores downstream possam começar assim que o build compartilhado estiver pronto.
4. Lanes mais pesadas de plataforma e runtime se expandem depois disso: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

O GitHub pode marcar tarefas substituídas como `cancelled` quando um push mais novo chega no mesmo PR ou ref `main`. Trate isso como ruído de CI, a menos que a execução mais recente para a mesma ref também esteja falhando. Verificações agregadas de shard usam `!cancelled() && always()` para que ainda relatem falhas normais de shards, mas não entrem na fila depois que todo o workflow já foi substituído. A chave automática de concorrência da CI é versionada (`CI-v7-*`) para que um zumbi do lado do GitHub em um grupo de fila antigo não possa bloquear indefinidamente execuções mais novas da main. Execuções manuais da suíte completa usam `CI-manual-v1-*` e não cancelam execuções em andamento.

## Escopo e roteamento

A lógica de escopo fica em `scripts/ci-changed-scope.mjs` e é coberta por testes unitários em `src/scripts/ci-changed-scope.test.ts`. O disparo manual ignora a detecção de escopo alterado e faz o manifesto de preflight agir como se todas as áreas com escopo tivessem mudado.

- **Edições no workflow de CI** validam o grafo de CI Node mais o lint de workflow, mas não forçam builds nativos de Windows, Android ou macOS por si só; essas lanes de plataforma permanecem restritas a mudanças no código-fonte da plataforma.
- **Edições somente de roteamento de CI, edições selecionadas baratas de fixtures de core-test e edições estreitas em helpers/test-routing de contrato de Plugin** usam um caminho rápido de manifesto somente Node: `preflight`, segurança e uma única tarefa `checks-fast-core`. Esse caminho pula artefatos de build, compatibilidade com Node 22, contratos de canal, shards completos do núcleo, shards de bundled-plugin e matrizes adicionais de guardas quando a mudança se limita às superfícies de roteamento ou helpers que a tarefa rápida exercita diretamente.
- **Verificações Node no Windows** são restritas a wrappers específicos de processo/caminho do Windows, helpers de runners npm/pnpm/UI, configuração de gerenciador de pacotes e superfícies de workflow de CI que executam essa lane; mudanças não relacionadas de código-fonte, Plugin, install-smoke e somente testes permanecem nas lanes Node do Linux.

As famílias mais lentas de testes Node são divididas ou balanceadas para que cada tarefa permaneça pequena sem reservar runners em excesso: contratos de canal rodam como três shards ponderados, lanes rápidas/de suporte de unidades do núcleo rodam separadamente, infra de runtime do núcleo é dividida entre shards de estado e processo/config, auto-reply roda como workers balanceados (com a subárvore de respostas dividida em shards agent-runner, dispatch e commands/state-routing), e configurações agentic de gateway/server são divididas entre lanes chat/auth/model/http-plugin/runtime/startup em vez de esperar por artefatos gerados. Testes amplos de navegador, QA, mídia e Plugins diversos usam suas configurações Vitest dedicadas em vez do catch-all compartilhado de Plugins. Shards com padrões de inclusão registram entradas de tempo usando o nome do shard de CI, para que `.artifacts/vitest-shard-timings.json` possa distinguir uma configuração inteira de um shard filtrado. `check-additional` mantém juntos o trabalho de compilação/canary de package-boundary e separa a arquitetura de topologia de runtime da cobertura de gateway watch; a lista de guardas de fronteira é distribuída por quatro shards de matriz, cada um executando guardas independentes selecionadas simultaneamente e imprimindo tempos por verificação, incluindo `pnpm prompt:snapshots:check`, para que o drift de prompt do caminho feliz do runtime Codex fique fixado ao PR que o causou. Gateway watch, testes de canal e o shard de fronteira de suporte do núcleo rodam simultaneamente dentro de `build-artifacts` depois que `dist/` e `dist-runtime/` já foram gerados.

A CI Android executa `testPlayDebugUnitTest` e `testThirdPartyDebugUnitTest` e então gera o APK debug Play. O flavor de terceiros não tem source set ou manifesto separado; sua lane de testes unitários ainda compila o flavor com as flags BuildConfig de SMS/call-log, evitando ao mesmo tempo uma tarefa duplicada de empacotamento de APK debug em todo push relevante para Android.

O shard `check-dependencies` executa `pnpm deadcode:dependencies` (uma passagem somente de dependências de produção do Knip fixada na versão mais recente do Knip, com a idade mínima de lançamento do pnpm desativada para a instalação via `dlx`) e `pnpm deadcode:unused-files`, que compara as descobertas de arquivos de produção não usados do Knip contra `scripts/deadcode-unused-files.allowlist.mjs`. A guarda de arquivos não usados falha quando um PR adiciona um novo arquivo não usado sem revisão ou deixa uma entrada obsoleta na allowlist, preservando superfícies intencionais de Plugins dinâmicos, geradas, de build, testes live e bridge de pacote que o Knip não consegue resolver estaticamente.

## Encaminhamento de atividade do ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` é a ponte do lado do destino da atividade do repositório OpenClaw para o ClawSweeper. Ele não faz checkout nem executa código não confiável de pull requests. O workflow cria um token de GitHub App a partir de `CLAWSWEEPER_APP_PRIVATE_KEY` e então dispara payloads compactos de `repository_dispatch` para `openclaw/clawsweeper`.

O workflow tem quatro lanes:

- `clawsweeper_item` para solicitações exatas de revisão de issues e pull requests;
- `clawsweeper_comment` para comandos explícitos do ClawSweeper em comentários de issues;
- `clawsweeper_commit_review` para solicitações de revisão em nível de commit em pushes para `main`;
- `github_activity` para atividade geral do GitHub que o agente ClawSweeper pode inspecionar.

A lane `github_activity` encaminha apenas metadados normalizados: tipo de evento, ação, ator, repositório, número do item, URL, título, estado e trechos curtos para comentários ou revisões quando presentes. Ela evita intencionalmente encaminhar o corpo completo do webhook. O workflow receptor em `openclaw/clawsweeper` é `.github/workflows/github-activity.yml`, que publica o evento normalizado no hook do OpenClaw Gateway para o agente ClawSweeper.

Atividade geral é observação, não entrega por padrão. O agente ClawSweeper recebe o destino do Discord em seu prompt e deve publicar em `#clawsweeper` apenas quando o evento for surpreendente, acionável, arriscado ou operacionalmente útil. Aberturas rotineiras, edições, ruído de bots, ruído duplicado de webhook e tráfego normal de revisão devem resultar em `NO_REPLY`.

Trate títulos, comentários, corpos, texto de revisão, nomes de branches e mensagens de commit do GitHub como dados não confiáveis em todo esse caminho. Eles são entrada para sumarização e triagem, não instruções para o workflow ou runtime do agente.

## Disparos manuais

Disparos manuais de CI executam o mesmo grafo de jobs da CI normal, mas forçam todas as lanes com escopo não Android: shards Linux Node, shards de plugins incluídos, contratos de canais, compatibilidade com Node 22, `check`, `check-additional`, smoke de build, verificações de docs, Python skills, Windows, macOS e i18n da Control UI. Disparos manuais independentes de CI executam somente Android com `include_android=true`; o guarda-chuva completo de release habilita Android passando `include_android=true`. Verificações estáticas de pré-lançamento de plugin, o shard `agentic-plugins` exclusivo de release, a varredura completa em lote de extensões e as lanes Docker de pré-lançamento de plugin são excluídas da CI. A suíte Docker de pré-lançamento roda somente quando `Full Release Validation` dispara o workflow separado `Plugin Prerelease` com o gate de validação de release habilitado.

Execuções manuais usam um grupo de concorrência único para que uma suíte completa de candidato a release não seja cancelada por outro push ou execução de PR no mesmo ref. A entrada opcional `target_ref` permite que um chamador confiável execute esse grafo contra uma branch, tag ou SHA completo de commit enquanto usa o arquivo de workflow do ref de disparo selecionado.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Executores

| Executor                         | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, jobs rápidos de segurança e agregados (`security-scm-fast`, `security-dependency-audit`, `security-fast`), verificações rápidas de protocolo/contrato/incluídos, verificações fragmentadas de contratos de canais, shards de `check` exceto lint, shards e agregados de `check-additional`, verificadores agregados de testes Node, verificações de docs, Python skills, workflow-sanity, labeler, auto-response; o preflight de install-smoke também usa Ubuntu hospedado no GitHub para que a matriz Blacksmith possa entrar na fila mais cedo |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shards de extensões de menor peso, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` e `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shards de testes Linux Node, shards de testes de plugins incluídos, `android`                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (sensível o bastante a CPU para que 8 vCPU custassem mais do que economizavam); builds Docker de install-smoke (o tempo de fila de 32 vCPU custava mais do que economizava)                                                                                                                                                                                                                                                                                |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` em `openclaw/openclaw`; forks recorrem a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` em `openclaw/openclaw`; forks recorrem a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                   |

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

`OpenClaw Performance` é o workflow de desempenho de produto/runtime. Ele roda diariamente em `main` e pode ser disparado manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

O disparo manual normalmente mede o ref do workflow. Defina `target_ref` para medir uma tag de release ou outra branch com a implementação atual do workflow. Caminhos de relatórios publicados e ponteiros mais recentes são indexados pelo ref testado, e cada `index.md` registra o ref/SHA testado, ref/SHA do workflow, ref Kova, perfil, modo de autenticação da lane, modelo, contagem de repetições e filtros de cenário.

O workflow instala OCM a partir de um release fixado e Kova de `openclaw/Kova` na entrada fixada `kova_ref`, depois executa três lanes:

- `mock-provider`: cenários diagnósticos Kova contra um runtime de build local com autenticação falsa determinística compatível com OpenAI.
- `mock-deep-profile`: profiling de CPU/heap/trace para hotspots de inicialização, Gateway e turnos de agente.
- `live-gpt54`: um turno real de agente OpenAI `openai/gpt-5.4`, ignorado quando `OPENAI_API_KEY` não está disponível.

A lane mock-provider também executa sondas de código-fonte nativas do OpenClaw depois da passagem do Kova: tempo de boot e memória do Gateway em casos de inicialização padrão, hook e com 50 plugins; loops repetidos de hello `channel-chat-baseline` com mock de OpenAI; e comandos de inicialização da CLI contra o Gateway iniciado. O resumo Markdown da sonda de código-fonte fica em `source/index.md` no pacote de relatório, com JSON bruto ao lado.

Cada lane envia artefatos ao GitHub. Quando `CLAWGRIT_REPORTS_TOKEN` está configurado, o workflow também commita `report.json`, `report.md`, pacotes, `index.md` e artefatos de sonda de código-fonte em `openclaw/clawgrit-reports` sob `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. O ponteiro atual do ref testado é escrito como `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validação Completa de Release

`Full Release Validation` é o workflow guarda-chuva manual para "executar tudo antes do release." Ele aceita uma branch, tag ou SHA completo de commit, dispara o workflow manual `CI` com esse alvo, dispara `Plugin Prerelease` para prova exclusiva de release de plugin/pacote/estática/Docker, e dispara `OpenClaw Release Checks` para smoke de instalação, aceitação de pacote, suítes Docker do caminho de release, live/E2E, OpenWebUI, paridade do QA Lab, Matrix e lanes Telegram. Com `rerun_group=all` e `release_profile=full`, ele também executa `NPM Telegram Beta E2E` contra o artefato `release-package-under-test` das verificações de release. Depois da publicação, passe `npm_telegram_package_spec` para executar novamente a mesma lane de pacote Telegram contra o pacote npm publicado.

Consulte [Validação completa de release](/pt-BR/reference/full-release-validation) para a
matriz de estágios, nomes exatos de jobs de workflow, diferenças de perfil, artefatos e
identificadores de reexecução focada.

`OpenClaw Release Publish` é o workflow manual mutável de release. Dispare-o
a partir de `release/YYYY.M.D` ou `main` depois que a tag de release existir e depois que o
preflight npm do OpenClaw tiver sido bem-sucedido. Ele verifica `pnpm plugins:sync:check`,
dispara `Plugin NPM Release` para todos os pacotes de plugins publicáveis, dispara
`Plugin ClawHub Release` para o mesmo SHA de release e só então dispara
`OpenClaw NPM Release` com o `preflight_run_id` salvo.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Para prova de commit fixado em uma branch que muda rapidamente, use o helper em vez de
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Refs de disparo de workflow do GitHub devem ser branches ou tags, não SHAs brutos de commit. O
helper envia uma branch temporária `release-ci/<sha>-...` no SHA alvo,
dispara `Full Release Validation` a partir desse ref fixado, verifica se todo
`headSha` de workflow filho corresponde ao alvo e exclui a branch temporária quando a
execução termina. O verificador guarda-chuva também falha se algum workflow filho tiver rodado em um
SHA diferente.

`release_profile` controla a abrangência de live/provedor passada para as verificações de lançamento. Os
workflows manuais de lançamento usam `stable` por padrão; use `full` somente quando você
quiser intencionalmente a matriz ampla de provedores/mídia de consultoria.

- `minimum` mantém as lanes OpenAI/núcleo críticas para lançamento mais rápidas.
- `stable` adiciona o conjunto estável de provedores/backend.
- `full` executa a matriz ampla de provedores/mídia de consultoria.

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

Ao depurar uma execução de aceitação de pacote com falha, comece pelo resumo `resolve_package` para confirmar a origem, a versão e o SHA-256 do pacote. Depois, inspecione a execução filha `docker_acceptance` e seus artefatos Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logs de lanes, tempos de fase e comandos de nova execução. Prefira executar novamente o perfil de pacote com falha ou as lanes Docker exatas em vez de executar novamente a validação completa de release.

## Smoke de instalação

O workflow separado `Install Smoke` reutiliza o mesmo script de escopo por meio do próprio job `preflight`. Ele divide a cobertura de smoke em `run_fast_install_smoke` e `run_full_install_smoke`.

- **Caminho rápido** roda para pull requests que tocam superfícies de Docker/pacote, mudanças de pacote/manifesto de plugins empacotados, ou superfícies de plugin/canal/Gateway/Plugin SDK do core que os jobs de smoke Docker exercitam. Mudanças somente de código-fonte em plugins empacotados, edições somente de testes e edições somente de docs não reservam workers Docker. O caminho rápido cria a imagem do Dockerfile raiz uma vez, verifica a CLI, roda o smoke da CLI de exclusão de agents em workspace compartilhado, roda o e2e de rede do Gateway em contêiner, verifica um argumento de build de Plugin empacotado e roda o perfil Docker limitado de plugins empacotados com um tempo limite agregado de comando de 240 segundos (cada execução Docker de cenário é limitada separadamente).
- **Caminho completo** mantém a instalação de pacote QR e a cobertura Docker/de atualização do instalador para execuções noturnas agendadas, despachos manuais, verificações de release por workflow-call e pull requests que realmente tocam superfícies de instalador/pacote/Docker. No modo completo, o install-smoke prepara ou reutiliza uma imagem de smoke GHCR do Dockerfile raiz para um SHA de destino, depois roda a instalação de pacote QR, smokes do Dockerfile raiz/Gateway, smokes de instalador/atualização e o E2E Docker rápido de plugins empacotados como jobs separados para que o trabalho de instalador não espere atrás dos smokes da imagem raiz.

Pushes para `main` (incluindo commits de merge) não forçam o caminho completo; quando a lógica de escopo de mudanças pediria cobertura completa em um push, o workflow mantém o smoke Docker rápido e deixa o smoke de instalação completo para a validação noturna ou de release.

O smoke lento do provedor de imagem de instalação global com Bun é controlado separadamente por `run_bun_global_install_smoke`. Ele roda no agendamento noturno e a partir do workflow de verificações de release, e despachos manuais de `Install Smoke` podem optar por incluí-lo, mas pull requests e pushes para `main` não. Os testes Docker de QR e instalador mantêm seus próprios Dockerfiles focados em instalação.

## E2E Docker local

`pnpm test:docker:all` pré-cria uma imagem compartilhada de teste live, empacota o OpenClaw uma vez como um tarball npm e cria duas imagens compartilhadas de `scripts/e2e/Dockerfile`:

- um runner Node/Git básico para lanes de instalador/atualização/dependência de plugin;
- uma imagem funcional que instala o mesmo tarball em `/app` para lanes de funcionalidade normal.

As definições de lanes Docker ficam em `scripts/lib/docker-e2e-scenarios.mjs`, a lógica do planejador fica em `scripts/lib/docker-e2e-plan.mjs`, e o runner executa somente o plano selecionado. O agendador seleciona a imagem por lane com `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, depois roda lanes com `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Ajustes

| Variável                               | Padrão  | Finalidade                                                                                    |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Contagem de slots do pool principal para lanes normais.                                       |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Contagem de slots do pool final sensível a provedores.                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Limite de lanes live simultâneas para que os provedores não limitem a taxa.                   |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Limite de lanes simultâneas de instalação npm.                                                |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Limite de lanes simultâneas com múltiplos serviços.                                          |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Intervalo entre inícios de lanes para evitar rajadas de criação do daemon Docker; defina `0` para não intervalar. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Tempo limite fallback por lane (120 minutos); lanes live/finais selecionadas usam limites mais rígidos. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` imprime o plano do agendador sem executar lanes.                                         |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Lista de lanes exatas separadas por vírgulas; pula o smoke de limpeza para que agents possam reproduzir uma lane com falha. |

Uma lane mais pesada que seu limite efetivo ainda pode iniciar a partir de um pool vazio, depois roda sozinha até liberar capacidade. Os preflights agregados locais verificam Docker, removem contêineres E2E obsoletos do OpenClaw, emitem status de lanes ativas, persistem tempos de lanes para ordenação das mais longas primeiro e, por padrão, param de agendar novas lanes em pool após a primeira falha.

### Workflow live/E2E reutilizável

O workflow live/E2E reutilizável pergunta a `scripts/test-docker-all.mjs --plan-json` qual cobertura de pacote, tipo de imagem, imagem live, lane e credenciais é necessária. `scripts/docker-e2e.mjs` então converte esse plano em outputs e resumos do GitHub. Ele empacota o OpenClaw por meio de `scripts/package-openclaw-for-docker.mjs`, baixa um artefato de pacote da execução atual ou baixa um artefato de pacote de `package_artifact_run_id`; valida o inventário do tarball; cria e envia imagens GHCR Docker E2E básicas/funcionais com tag de digest do pacote por meio do cache de camadas Docker do Blacksmith quando o plano precisa de lanes com pacote instalado; e reutiliza inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` fornecidos ou imagens existentes com digest de pacote em vez de recriar. Pulls de imagens Docker são tentados novamente com um tempo limite limitado de 180 segundos por tentativa para que um stream travado de registry/cache tente novamente rapidamente em vez de consumir a maior parte do caminho crítico de CI.

### Chunks do caminho de release

A cobertura Docker de release roda jobs menores em chunks com `OPENCLAW_SKIP_DOCKER_BUILD=1`, para que cada chunk baixe somente o tipo de imagem necessário e execute várias lanes pelo mesmo agendador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Os chunks Docker de release atuais são `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` e `plugins-runtime-install-a` até `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` continuam sendo aliases agregados de plugin/runtime. O alias de lane `install-e2e` continua sendo o alias agregado de nova execução manual para ambas as lanes de instalador de provedores.

OpenWebUI é incorporado a `plugins-runtime-services` quando a cobertura completa de release-path o solicita, e mantém um chunk independente `openwebui` somente para despachos exclusivos do OpenWebUI. Lanes de atualização de canais empacotados tentam novamente uma vez em caso de falhas transitórias de rede npm.

Cada chunk envia `.artifacts/docker-tests/` com logs de lanes, tempos, `summary.json`, `failures.json`, tempos de fase, JSON do plano do agendador, tabelas de lanes lentas e comandos de nova execução por lane. O input `docker_lanes` do workflow roda lanes selecionadas contra as imagens preparadas em vez dos jobs de chunk, o que mantém a depuração de lanes com falha limitada a um job Docker direcionado e prepara, baixa ou reutiliza o artefato de pacote para essa execução; se uma lane selecionada for uma lane Docker live, o job direcionado cria a imagem de teste live localmente para essa nova execução. Comandos gerados de nova execução por lane no GitHub incluem `package_artifact_run_id`, `package_artifact_name` e inputs de imagem preparada quando esses valores existem, para que uma lane com falha possa reutilizar o pacote e as imagens exatos da execução com falha.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

O workflow live/E2E agendado roda diariamente a suíte Docker release-path completa.

## Pré-release de Plugin

`Plugin Prerelease` é uma cobertura de produto/pacote mais cara, então é um workflow separado despachado por `Full Release Validation` ou por um operador explícito. Pull requests normais, pushes para `main` e despachos manuais independentes de CI mantêm essa suíte desligada. Ele equilibra testes de plugins empacotados entre oito workers de extensão; esses jobs de shard de extensão rodam até dois grupos de configuração de plugins por vez, com um worker Vitest por grupo e um heap Node maior, para que lotes de plugins pesados em imports não criem jobs extras de CI. O caminho de pré-release Docker exclusivo de release agrupa lanes Docker direcionadas em pequenos grupos para evitar reservar dezenas de runners para jobs de um a três minutos.

## QA Lab

QA Lab tem lanes dedicadas de CI fora do workflow principal com escopo inteligente. A paridade agentic fica aninhada nos harnesses amplos de QA e release, não em um workflow de PR independente. Use `Full Release Validation` com `rerun_group=qa-parity` quando a paridade deve acompanhar uma execução ampla de validação.

- O workflow `QA-Lab - All Lanes` roda todas as noites em `main` e em despacho manual; ele distribui a lane de paridade mock, a lane Matrix live e as lanes live de Telegram e Discord como jobs paralelos. Jobs live usam o ambiente `qa-live-shared`, e Telegram/Discord usam leases do Convex.

As verificações de release rodam lanes de transporte live Matrix e Telegram com o provedor mock determinístico e modelos qualificados por mock (`mock-openai/gpt-5.5` e `mock-openai/gpt-5.5-alt`), para que o contrato do canal fique isolado da latência de modelos live e da inicialização normal do plugin de provedor. O Gateway de transporte live desativa a busca de memória porque a paridade de QA cobre o comportamento de memória separadamente; a conectividade de provedores é coberta pelas suítes separadas de modelo live, provedor nativo e provedor Docker.

Matrix usa `--profile fast` para gates agendados e de release, adicionando `--fail-fast` somente quando a CLI em checkout tem suporte a ele. O padrão da CLI e o input manual do workflow continuam sendo `all`; o despacho manual com `matrix_profile=all` sempre divide a cobertura Matrix completa em jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`.

`OpenClaw Release Checks` também roda as lanes críticas de release do QA Lab antes da aprovação de release; seu gate de paridade de QA roda os pacotes candidato e baseline como jobs de lane paralelos, depois baixa ambos os artefatos em um pequeno job de relatório para a comparação final de paridade.

Para PRs normais, siga evidências de CI/verificações com escopo em vez de tratar paridade como um status obrigatório.

## CodeQL

O fluxo de trabalho `CodeQL` é intencionalmente um scanner de segurança estreito de primeira passagem, não a varredura completa do repositório. Execuções diárias, manuais e de guarda de pull requests não rascunho analisam código de fluxos de trabalho do Actions mais as superfícies JavaScript/TypeScript de maior risco com consultas de segurança de alta confiança filtradas para `security-severity` alta/crítica.

A guarda de pull request permanece leve: ela só inicia para alterações em `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` ou `src`, e executa a mesma matriz de segurança de alta confiança que o fluxo de trabalho agendado. O CodeQL para Android e macOS fica fora dos padrões de PR.

### Categorias de segurança

| Categoria                                         | Superfície                                                                                                                         |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Linha de base de autenticação, segredos, sandbox, cron e gateway                                                                   |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementação de canal do núcleo mais o runtime do plugin de canal, gateway, Plugin SDK, segredos e pontos de auditoria |
| `/codeql-security-high/network-ssrf-boundary`     | Superfícies de SSRF do núcleo, análise de IP, guarda de rede, web-fetch e política de SSRF do Plugin SDK                           |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, auxiliares de execução de processos, entrega de saída e gates de execução de ferramentas de agentes                |
| `/codeql-security-high/plugin-trust-boundary`     | Superfícies de confiança de instalação de Plugin, loader, manifesto, registro, instalação de gerenciador de pacotes, carregamento de código-fonte e contrato de pacote do Plugin SDK |

### Shards de segurança específicos de plataforma

- `CodeQL Android Critical Security` — shard agendado de segurança do Android. Compila o aplicativo Android manualmente para o CodeQL no menor runner Blacksmith Linux aceito pela sanidade do fluxo de trabalho. Faz upload em `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard semanal/manual de segurança do macOS. Compila o aplicativo macOS manualmente para o CodeQL no Blacksmith macOS, filtra resultados de build de dependências para fora do SARIF enviado e faz upload em `/codeql-critical-security/macos`. Mantido fora dos padrões diários porque o build do macOS domina o tempo de execução mesmo quando está limpo.

### Categorias de Qualidade Crítica

`CodeQL Critical Quality` é o shard não relacionado a segurança correspondente. Ele executa apenas consultas de qualidade JavaScript/TypeScript sem segurança e com severidade de erro sobre superfícies estreitas de alto valor no runner Blacksmith Linux menor. Sua guarda de pull request é intencionalmente menor que o perfil agendado: PRs não rascunho só executam os shards correspondentes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` e `plugin-sdk-reply-runtime` para alterações em código de execução de comando/modelo/ferramenta de agente e despacho de resposta, schema/migração/IO de configuração, código de autenticação/segredos/sandbox/segurança, runtime de canal do núcleo e de plugin de canal incluído, protocolo/método de servidor do gateway, cola de runtime/SDK de memória, MCP/processo/entrega de saída, runtime de provider/catálogo de modelos, diagnósticos de sessão/filas de entrega, loader de Plugin, contrato de pacote/Plugin SDK ou runtime de resposta do Plugin SDK. Alterações na configuração do CodeQL e no fluxo de trabalho de qualidade executam todos os doze shards de qualidade de PR.

O despacho manual aceita:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Os perfis estreitos são ganchos de ensino/iteração para executar um shard de qualidade isoladamente.

| Categoria                                               | Superfície                                                                                                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-critical-quality/core-auth-secrets`            | Código de fronteira de segurança de autenticação, segredos, sandbox, cron e gateway                                                                                |
| `/codeql-critical-quality/config-boundary`              | Contratos de schema, migração, normalização e IO de configuração                                                                                                   |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schemas de protocolo do Gateway e contratos de métodos de servidor                                                                                                 |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementação de canal do núcleo e de plugin de canal incluído                                                                                        |
| `/codeql-critical-quality/agent-runtime-boundary`       | Contratos de runtime de execução de comandos, despacho de modelo/provider, despacho e filas de resposta automática, e plano de controle ACP                         |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP e pontes de ferramentas, auxiliares de supervisão de processos e contratos de entrega de saída                                                      |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK do host de memória, facades de runtime de memória, aliases de memória do Plugin SDK, cola de ativação do runtime de memória e comandos doctor de memória       |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internos da fila de respostas, filas de entrega de sessão, auxiliares de vinculação/entrega de sessão de saída, superfícies de eventos diagnósticos/bundles de logs e contratos de CLI doctor de sessão |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de resposta de entrada do Plugin SDK, auxiliares de payload/fragmentação/runtime de resposta, opções de resposta de canal, filas de entrega e auxiliares de vinculação de sessão/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalização de catálogo de modelos, autenticação e descoberta de providers, registro de runtime de provider, padrões/catálogos de provider e registros web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap da UI de controle, persistência local, fluxos de controle do Gateway e contratos de runtime do plano de controle de tarefas                              |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratos de runtime de fetch/search web do núcleo, IO de mídia, entendimento de mídia, geração de imagens e geração de mídia                                      |
| `/codeql-critical-quality/plugin-boundary`              | Contratos de ponto de entrada de loader, registro, superfície pública e Plugin SDK                                                                                 |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Código-fonte do Plugin SDK no lado do pacote publicado e auxiliares de contrato de pacote de plugin                                                                |

A qualidade permanece separada da segurança para que achados de qualidade possam ser agendados, medidos, desabilitados ou expandidos sem obscurecer o sinal de segurança. A expansão do CodeQL para Swift, Python e plugins incluídos deve ser adicionada de volta como trabalho de acompanhamento com escopo ou dividido em shards somente depois que os perfis estreitos tiverem tempo de execução e sinal estáveis.

## Fluxos de trabalho de manutenção

### Docs Agent

O fluxo de trabalho `Docs Agent` é uma via de manutenção Codex orientada por eventos para manter a documentação existente alinhada com alterações integradas recentemente. Ele não tem agendamento puro: uma execução de CI bem-sucedida em `main` após push que não seja de bot pode acioná-lo, e o despacho manual pode executá-lo diretamente. Invocações por workflow-run são ignoradas quando `main` avançou ou quando outra execução não ignorada do Docs Agent foi criada na última hora. Quando executa, ele revisa o intervalo de commits do SHA de origem anterior não ignorado do Docs Agent até o `main` atual, de modo que uma execução horária possa cobrir todas as alterações acumuladas em main desde a última passagem de documentação.

### Test Performance Agent

O fluxo de trabalho `Test Performance Agent` é uma via de manutenção Codex orientada por eventos para testes lentos. Ele não tem agendamento puro: uma execução de CI bem-sucedida em `main` após push que não seja de bot pode acioná-lo, mas ele é ignorado se outra invocação por workflow-run já executou ou está executando naquele dia UTC. O despacho manual ignora esse gate diário de atividade. A via constrói um relatório de performance Vitest agrupado de suíte completa, permite que o Codex faça apenas pequenas correções de performance de testes que preservem a cobertura em vez de refatorações amplas, depois executa novamente o relatório de suíte completa e rejeita alterações que reduzam a contagem de testes aprovados da linha de base. Se a linha de base tiver testes falhando, o Codex pode corrigir apenas falhas óbvias, e o relatório de suíte completa após o agente precisa passar antes que qualquer coisa seja commitada. Quando `main` avança antes do push do bot ser integrado, a via aplica rebase ao patch validado, executa novamente `pnpm check:changed` e tenta o push de novo; patches obsoletos com conflito são ignorados. Ela usa Ubuntu hospedado pelo GitHub para que a action do Codex possa manter a mesma postura de segurança drop-sudo do agente de documentação.

### PRs duplicados após merge

O fluxo de trabalho `Duplicate PRs After Merge` é um fluxo de trabalho manual de mantenedor para limpeza de duplicatas após integração. Ele usa dry-run por padrão e só fecha PRs listados explicitamente quando `apply=true`. Antes de modificar o GitHub, ele verifica que o PR integrado recebeu merge e que cada duplicado tem uma issue referenciada em comum ou hunks alterados sobrepostos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gates de verificação local e roteamento de alterações

A lógica local de changed-lane fica em `scripts/changed-lanes.mjs` e é executada por `scripts/check-changed.mjs`. Esse gate de verificação local é mais rígido quanto a fronteiras de arquitetura do que o escopo amplo da plataforma de CI:

- alterações de produção no núcleo executam typecheck de produção do núcleo e testes do núcleo mais lint/guardas do núcleo;
- alterações somente de teste no núcleo executam apenas typecheck de testes do núcleo mais lint do núcleo;
- alterações de produção em extensão executam typecheck de produção e de testes de extensão mais lint de extensão;
- alterações somente de teste em extensão executam typecheck de testes de extensão mais lint de extensão;
- alterações públicas no Plugin SDK ou no contrato de plugin expandem para typecheck de extensões porque as extensões dependem desses contratos do núcleo (varreduras Vitest de extensões permanecem como trabalho de teste explícito);
- incrementos de versão somente em metadados de release executam verificações direcionadas de versão/configuração/dependências raiz;
- alterações desconhecidas em raiz/configuração falham com segurança para todas as vias de verificação.

O roteamento local de changed-test fica em `scripts/test-projects.test-support.mjs` e é intencionalmente mais barato que `check:changed`: edições diretas de testes executam os próprios testes, edições de código-fonte preferem mapeamentos explícitos, depois testes irmãos e dependentes do grafo de importação. A configuração compartilhada de entrega de sala de grupo é um dos mapeamentos explícitos: alterações na configuração de resposta visível para grupo, modo de entrega de resposta de origem ou prompt de sistema da ferramenta de mensagem passam pelos testes de resposta do núcleo mais regressões de entrega do Discord e Slack, de modo que uma alteração compartilhada de padrão falhe antes do primeiro push de PR. Use `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` somente quando a alteração for ampla o suficiente no harness para que o conjunto mapeado barato não seja um proxy confiável.

## Validação no Testbox

Execute o Testbox a partir da raiz do repositório e prefira uma box nova e aquecida para validação ampla. Antes de gastar uma verificação lenta em uma box que foi reutilizada, expirou ou acabou de relatar uma sincronização inesperadamente grande, execute `pnpm testbox:sanity` dentro da box primeiro.

A verificação de sanidade falha rapidamente quando arquivos obrigatórios da raiz, como `pnpm-lock.yaml`, desaparecem ou quando `git status --short` mostra pelo menos 200 exclusões rastreadas. Isso geralmente significa que o estado de sincronização remota não é uma cópia confiável do PR; pare essa box e aqueça uma nova em vez de depurar a falha do teste do produto. Para PRs intencionais com muitas exclusões, defina `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para essa execução de sanidade.

`pnpm testbox:run` também encerra uma invocação local da Blacksmith CLI que permanece na fase de sincronização por mais de cinco minutos sem saída pós-sincronização. Defina `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` para desativar essa proteção, ou use um valor maior em milissegundos para diffs locais excepcionalmente grandes.

Crabbox é o segundo caminho de box remota de propriedade do repositório para validação em Linux quando o Blacksmith está indisponível ou quando a capacidade de nuvem própria é preferível. Aqueça uma box, hidrate-a pelo workflow do projeto e então execute comandos pela Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` controla os padrões de provedor, sincronização e hidratação do GitHub Actions. Ele exclui o `.git` local para que o checkout hidratado do Actions mantenha seus próprios metadados Git remotos em vez de sincronizar remotos e armazenamentos de objetos locais do mantenedor, e exclui artefatos locais de runtime/build que nunca devem ser transferidos. `.github/workflows/crabbox-hydrate.yml` controla o checkout, a configuração de Node/pnpm, o fetch de `origin/main` e o repasse de ambiente não secreto que comandos posteriores de `crabbox run --id <cbx_id>` carregam.

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Canais de desenvolvimento](/pt-BR/install/development-channels)
