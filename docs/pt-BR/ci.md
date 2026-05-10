---
read_when:
    - Você precisa entender por que um job de CI foi ou não executado
    - Você está depurando uma verificação do GitHub Actions com falha
    - Você está coordenando uma execução ou reexecução de validação de lançamento
    - Você está alterando o dispatch do ClawSweeper ou o encaminhamento de atividades do GitHub
summary: Grafo de jobs de CI, controles de escopo, agrupadores de release e equivalentes de comandos locais
title: Pipeline de CI
x-i18n:
    generated_at: "2026-05-10T19:25:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4317a3985fd34470c4b9fd981a2048af9c395bdc65fe99853286628d1ee47d3
    source_path: ci.md
    workflow: 16
---

A CI do OpenClaw é executada em cada push para `main` e em cada pull request. O job `preflight` classifica o diff e desativa lanes caras quando apenas áreas não relacionadas mudaram. Execuções manuais de `workflow_dispatch` ignoram intencionalmente o escopo inteligente e expandem o grafo completo para candidatos a release e validação ampla. As lanes de Android permanecem opcionais via `include_android`. A cobertura de Plugin exclusiva de release fica no workflow separado [`Pré-lançamento de Plugin`](#plugin-prerelease) e só é executada a partir de [`Validação completa de release`](#full-release-validation) ou de um dispatch manual explícito.

## Visão geral do pipeline

| Job                              | Finalidade                                                                                                   | Quando é executado                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| `preflight`                      | Detecta mudanças apenas em docs, escopos alterados, extensões alteradas e cria o manifesto da CI             | Sempre em pushes e PRs que não são draft |
| `security-scm-fast`              | Detecção de chave privada e auditoria de workflow via `zizmor`                                               | Sempre em pushes e PRs que não são draft |
| `security-dependency-audit`      | Auditoria do lockfile de produção sem dependências contra avisos do npm                                      | Sempre em pushes e PRs que não são draft |
| `security-fast`                  | Agregado obrigatório para os jobs rápidos de segurança                                                       | Sempre em pushes e PRs que não são draft |
| `check-dependencies`             | Passagem do Knip apenas para dependências de produção mais o guard da allowlist de arquivos não usados       | Mudanças relevantes para Node            |
| `build-artifacts`                | Compila `dist/`, Control UI, verificações de artefatos compilados e artefatos reutilizáveis downstream       | Mudanças relevantes para Node            |
| `checks-fast-core`               | Lanes rápidas de correção no Linux, como verificações de bundled/plugin-contract/protocol                    | Mudanças relevantes para Node            |
| `checks-fast-contracts-channels` | Verificações de contrato de canais em shards com um resultado agregado estável                               | Mudanças relevantes para Node            |
| `checks-node-core-test`          | Shards de testes core de Node, excluindo lanes de canais, bundled, contrato e extensão                       | Mudanças relevantes para Node            |
| `check`                          | Equivalente ao gate local principal em shards: tipos de produção, lint, guards, tipos de teste e smoke estrito | Mudanças relevantes para Node          |
| `check-additional`               | Arquitetura, drift de boundary/prompt em shards, guards de extensão, boundary de pacote e observação de Gateway | Mudanças relevantes para Node         |
| `build-smoke`                    | Testes smoke da CLI compilada e smoke de memória de inicialização                                            | Mudanças relevantes para Node            |
| `checks`                         | Verificador para testes de canal de artefatos compilados                                                     | Mudanças relevantes para Node            |
| `checks-node-compat-node22`      | Lane de build e smoke de compatibilidade com Node 22                                                         | Dispatch manual da CI para releases      |
| `check-docs`                     | Formatação, lint e verificações de links quebrados da documentação                                           | Docs alteradas                           |
| `skills-python`                  | Ruff + pytest para Skills com suporte em Python                                                              | Mudanças relevantes para Skills Python   |
| `checks-windows`                 | Testes específicos de processos/caminhos no Windows mais regressões compartilhadas de especificadores de importação em runtime | Mudanças relevantes para Windows |
| `macos-node`                     | Lane de testes TypeScript no macOS usando os artefatos compilados compartilhados                             | Mudanças relevantes para macOS           |
| `macos-swift`                    | Lint, build e testes Swift para o app macOS                                                                  | Mudanças relevantes para macOS           |
| `android`                        | Testes unitários de Android para ambos os flavors mais uma build de APK debug                                | Mudanças relevantes para Android         |
| `test-performance-agent`         | Otimização diária de testes lentos do Codex após atividade confiável                                         | Sucesso da CI principal ou dispatch manual |
| `openclaw-performance`           | Relatórios diários/sob demanda de desempenho do runtime Kova com mock-provider, deep-profile e lanes live de GPT 5.4 | Dispatch agendado e manual       |

## Ordem de fail-fast

1. `preflight` decide quais lanes existem. A lógica de `docs-scope` e `changed-scope` são etapas dentro desse job, não jobs independentes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falham rapidamente sem esperar pelos jobs mais pesados de artefatos e matriz de plataformas.
3. `build-artifacts` se sobrepõe às lanes rápidas de Linux para que consumidores downstream possam começar assim que a build compartilhada estiver pronta.
4. Lanes mais pesadas de plataforma e runtime se expandem depois disso: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

O GitHub pode marcar jobs substituídos como `cancelled` quando um push mais novo chega ao mesmo PR ou ref de `main`. Trate isso como ruído de CI, a menos que a execução mais recente para a mesma ref também esteja falhando. Verificações agregadas de shards usam `!cancelled() && always()` para ainda relatar falhas normais de shards, mas não entrar na fila depois que todo o workflow já foi substituído. A chave automática de concorrência da CI é versionada (`CI-v7-*`) para que um zumbi do lado do GitHub em um grupo de fila antigo não possa bloquear indefinidamente execuções mais novas da main. Execuções manuais da suíte completa usam `CI-manual-v1-*` e não cancelam execuções em andamento.

O job `ci-timings-summary` envia um artefato compacto `ci-timings-summary` para cada execução de CI que não é draft. Ele registra tempo de parede, tempo de fila, jobs mais lentos e jobs com falha da execução atual, para que verificações de saúde da CI não precisem consultar repetidamente o payload completo do Actions.

## Escopo e roteamento

A lógica de escopo fica em `scripts/ci-changed-scope.mjs` e é coberta por testes unitários em `src/scripts/ci-changed-scope.test.ts`. Dispatch manual ignora a detecção de escopo alterado e faz o manifesto de preflight agir como se todas as áreas com escopo tivessem mudado.

- **Edições de workflow de CI** validam o grafo da CI de Node mais o lint de workflow, mas não forçam builds nativas de Windows, Android ou macOS por si só; essas lanes de plataforma permanecem restritas a mudanças no código-fonte da plataforma.
- **Edições apenas de roteamento de CI, edições selecionadas de fixtures baratas de testes core e edições estreitas de helpers/roteamento de testes de contrato de Plugin** usam um caminho rápido de manifesto apenas de Node: `preflight`, segurança e uma única tarefa `checks-fast-core`. Esse caminho pula artefatos de build, compatibilidade com Node 22, contratos de canais, shards core completos, shards de Plugins bundled e matrizes adicionais de guards quando a mudança se limita às superfícies de roteamento ou helper que a tarefa rápida exercita diretamente.
- **Verificações Node no Windows** têm escopo restrito a wrappers de processos/caminhos específicos do Windows, helpers de runner npm/pnpm/UI, configuração do gerenciador de pacotes e superfícies do workflow de CI que executam essa lane; mudanças não relacionadas em código-fonte, Plugin, install-smoke e apenas testes permanecem nas lanes Node de Linux.

As famílias mais lentas de testes Node são divididas ou balanceadas para que cada job permaneça pequeno sem reservar runners em excesso: contratos de canais rodam como três shards ponderados com suporte do Blacksmith e fallback para o runner padrão do GitHub, lanes rápidas/de suporte de unidades core rodam separadamente, a infraestrutura de runtime core é dividida entre shards de state, process/config, Cron e shared, auto-reply roda como workers balanceados (com a subárvore de reply dividida em shards de agent-runner, dispatch e commands/state-routing), e configs agentic de Gateway/server são divididas entre lanes de chat/auth/model/http-plugin/runtime/startup em vez de esperar por artefatos compilados. Testes amplos de navegador, QA, mídia e Plugins diversos usam suas configs Vitest dedicadas em vez do catch-all compartilhado de Plugins. Shards com padrões de inclusão registram entradas de timing usando o nome do shard da CI, para que `.artifacts/vitest-shard-timings.json` possa distinguir uma config inteira de um shard filtrado. `check-additional` mantém o trabalho de compilação/canary de boundary de pacote junto e separa a arquitetura de topologia de runtime da cobertura de observação do Gateway; a lista de guards de boundary é listrada em quatro shards de matriz, cada um executando guards independentes selecionados em paralelo e imprimindo timings por verificação. A verificação cara de drift do snapshot de prompt do caminho feliz do Codex roda como seu próprio job adicional apenas para CI manual e mudanças que afetam prompts, então mudanças Node normais não relacionadas não esperam atrás da geração fria de snapshots de prompt e os shards de boundary permanecem balanceados enquanto o drift de prompt continua preso ao PR que o causou; a mesma flag pula a geração Vitest de snapshots de prompt dentro do shard de boundary de suporte core de artefatos compilados. Observação de Gateway, testes de canais e o shard de boundary de suporte core rodam simultaneamente dentro de `build-artifacts` depois que `dist/` e `dist-runtime/` já foram compilados.

A CI de Android executa tanto `testPlayDebugUnitTest` quanto `testThirdPartyDebugUnitTest` e depois compila o APK debug Play. O flavor de terceiros não tem source set ou manifesto separado; sua lane de testes unitários ainda compila o flavor com as flags BuildConfig de SMS/call-log, evitando ao mesmo tempo um job duplicado de empacotamento de APK debug em cada push relevante para Android.

O shard `check-dependencies` executa `pnpm deadcode:dependencies` (uma passagem do Knip apenas para dependências de produção fixada na versão mais recente do Knip, com a idade mínima de release do pnpm desativada para a instalação via `dlx`) e `pnpm deadcode:unused-files`, que compara as descobertas do Knip de arquivos de produção não usados com `scripts/deadcode-unused-files.allowlist.mjs`. O guard de arquivos não usados falha quando um PR adiciona um novo arquivo não usado sem revisão ou deixa uma entrada obsoleta na allowlist, preservando ao mesmo tempo superfícies intencionais de Plugin dinâmico, geradas, de build, testes live e pontes de pacote que o Knip não consegue resolver estaticamente.

## Encaminhamento de atividade do ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` é a ponte do lado de destino da atividade do repositório OpenClaw para o ClawSweeper. Ele não faz checkout nem executa código não confiável de pull requests. O workflow cria um token de GitHub App a partir de `CLAWSWEEPER_APP_PRIVATE_KEY` e então despacha payloads compactos de `repository_dispatch` para `openclaw/clawsweeper`.

O workflow tem quatro lanes:

- `clawsweeper_item` para solicitações exatas de revisão de issue e pull request;
- `clawsweeper_comment` para comandos explícitos do ClawSweeper em comentários de issues;
- `clawsweeper_commit_review` para solicitações de revisão em nível de commit em pushes para `main`;
- `github_activity` para atividade geral do GitHub que o agente ClawSweeper pode inspecionar.

A lane `github_activity` encaminha apenas metadados normalizados: tipo de evento, ação, ator, repositório, número do item, URL, título, estado e trechos curtos de comentários ou revisões quando presentes. Ela evita intencionalmente encaminhar o corpo completo do Webhook. O workflow receptor em `openclaw/clawsweeper` é `.github/workflows/github-activity.yml`, que publica o evento normalizado no hook do OpenClaw Gateway para o agente ClawSweeper.

Atividade geral é observação, não entrega por padrão. O agente ClawSweeper recebe o destino do Discord em seu prompt e deve postar em `#clawsweeper` apenas quando o evento for surpreendente, acionável, arriscado ou operacionalmente útil. Aberturas rotineiras, edições, ruído de bots, ruído de Webhook duplicado e tráfego normal de revisão devem resultar em `NO_REPLY`.

Trate títulos, comentários, corpos, textos de revisão, nomes de branches e mensagens de commit do GitHub como dados não confiáveis em todo este caminho. Eles são entrada para sumarização e triagem, não instruções para o fluxo de trabalho ou para o runtime do agente.

## Despachos manuais

Despachos manuais de CI executam o mesmo grafo de jobs que a CI normal, mas forçam todas as lanes com escopo não Android a ficarem ativadas: shards Linux Node, shards de Plugin incluído, contratos de canal, compatibilidade com Node 22, `check`, `check-additional`, smoke de build, verificações de docs, Python skills, Windows, macOS e i18n da Control UI. Despachos manuais independentes de CI executam Android somente com `include_android=true`; o guarda-chuva completo de release habilita Android passando `include_android=true`. Verificações estáticas de pré-release de Plugin, o shard exclusivo de release `agentic-plugins`, a varredura completa em lote de extensões e lanes Docker de pré-release de Plugin são excluídos da CI. A suíte Docker de pré-release executa somente quando `Full Release Validation` despacha o workflow separado `Plugin Prerelease` com o gate de validação de release habilitado.

Execuções manuais usam um grupo de concorrência único para que uma suíte completa de candidato a release não seja cancelada por outra execução de push ou PR na mesma ref. A entrada opcional `target_ref` permite que um chamador confiável execute esse grafo contra uma branch, tag ou SHA de commit completo usando o arquivo de workflow da ref de despacho selecionada.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, jobs rápidos de segurança e agregados (`security-scm-fast`, `security-dependency-audit`, `security-fast`), verificações rápidas de protocolo/contrato/itens incluídos, verificações shardadas de contratos de canal, shards de `check` exceto lint, agregados de `check-additional`, verificadores agregados de testes Node, verificações de docs, Python skills, workflow-sanity, labeler, auto-response; o preflight de install-smoke também usa Ubuntu hospedado pelo GitHub para que a matriz Blacksmith possa entrar na fila mais cedo |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shards de extensão mais leves, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` e `check-test-types`                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | build-smoke, shards de teste Linux Node, shards de teste de Plugin incluído, shards de `check-additional`, `android`                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-ubuntu-2404`  | `build-artifacts`, `check-lint` (sensível a CPU o suficiente para que 8 vCPU custassem mais do que economizaram); builds Docker de install-smoke (o tempo de fila de 32 vCPU custou mais do que economizou)                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` em `openclaw/openclaw`; forks recorrem a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` em `openclaw/openclaw`; forks recorrem a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                      |

A CI do repositório canônico mantém Blacksmith como o caminho de runner padrão. Durante `preflight`, `scripts/ci-runner-labels.mjs` verifica execuções recentes de Actions em fila e em andamento para jobs Blacksmith em fila. Se um rótulo Blacksmith específico já tiver jobs em fila, os jobs downstream que usariam exatamente esse rótulo recorrem ao runner hospedado pelo GitHub correspondente (`ubuntu-24.04`, `windows-2025` ou `macos-latest`) apenas para essa execução. Outros tamanhos Blacksmith na mesma família de SO permanecem em seus rótulos primários. Se a sondagem da API falhar, nenhum fallback é aplicado.

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

`OpenClaw Performance` é o workflow de desempenho de produto/runtime. Ele executa diariamente em `main` e pode ser despachado manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

O despacho manual normalmente mede a ref do workflow. Defina `target_ref` para medir uma tag de release ou outra branch com a implementação atual do workflow. Caminhos de relatórios publicados e ponteiros mais recentes são indexados pela ref testada, e cada `index.md` registra a ref/SHA testada, a ref/SHA do workflow, a ref do Kova, o perfil, o modo de autenticação da lane, o modelo, a contagem de repetições e os filtros de cenário.

O workflow instala OCM a partir de um release fixado e Kova a partir de `openclaw/Kova` na entrada `kova_ref` fixada, então executa três lanes:

- `mock-provider`: cenários diagnósticos do Kova contra um runtime de build local com autenticação falsa determinística compatível com OpenAI.
- `mock-deep-profile`: profiling de CPU/heap/trace para pontos críticos de inicialização, Gateway e turno do agente.
- `live-gpt54`: um turno real de agente OpenAI `openai/gpt-5.4`, ignorado quando `OPENAI_API_KEY` está indisponível.

A lane mock-provider também executa sondagens de fonte nativas do OpenClaw após a passagem do Kova: tempo de boot e memória do Gateway nos casos de inicialização padrão, com hook e com 50 Plugins; loops repetidos de hello `channel-chat-baseline` com OpenAI simulado; e comandos de inicialização da CLI contra o Gateway inicializado. O resumo em Markdown da sondagem de fonte fica em `source/index.md` no pacote de relatório, com JSON bruto ao lado.

Toda lane envia artefatos do GitHub. Quando `CLAWGRIT_REPORTS_TOKEN` está configurado, o workflow também commita `report.json`, `report.md`, pacotes, `index.md` e artefatos de sondagem de fonte em `openclaw/clawgrit-reports` sob `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. O ponteiro atual da ref testada é escrito como `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validação Completa de Release

`Full Release Validation` é o workflow guarda-chuva manual para "executar tudo antes do release". Ele aceita uma branch, tag ou SHA de commit completo, despacha o workflow manual `CI` com esse alvo, despacha `Plugin Prerelease` para comprovação exclusiva de release de Plugin/pacote/estática/Docker e despacha `OpenClaw Release Checks` para smoke de instalação, aceitação de pacote, verificações de pacote entre SOs, paridade do QA Lab, Matrix e lanes do Telegram. Execuções estáveis/padrão mantêm cobertura exaustiva live/E2E e do caminho de release Docker atrás de `run_release_soak=true`; `release_profile=full` força essa cobertura de soak a ficar ativada para que a validação ampla de avisos permaneça ampla. Com `rerun_group=all` e `release_profile=full`, ele também executa `NPM Telegram Beta E2E` contra o artefato `release-package-under-test` das verificações de release. Após a publicação, passe `npm_telegram_package_spec` para reexecutar a mesma lane de pacote do Telegram contra o pacote npm publicado.

Consulte [Validação completa de release](/pt-BR/reference/full-release-validation) para a
matriz de estágios, nomes exatos dos jobs de workflow, diferenças de perfil, artefatos e
identificadores de reexecução focada.

`OpenClaw Release Publish` é o workflow manual mutável de release. Despache-o
a partir de `release/YYYY.M.D` ou `main` depois que a tag de release existir e depois que o
preflight npm do OpenClaw tiver sido concluído com sucesso. Ele verifica `pnpm plugins:sync:check`,
despacha `Plugin NPM Release` para todos os pacotes de Plugin publicáveis, despacha
`Plugin ClawHub Release` para o mesmo SHA de release e só então despacha
`OpenClaw NPM Release` com o `preflight_run_id` salvo.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Para comprovação de commit fixado em uma branch que muda rapidamente, use o auxiliar em vez de
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Refs de dispatch de workflows do GitHub devem ser branches ou tags, não SHAs de commit brutos. O
auxiliar envia uma branch temporária `release-ci/<sha>-...` no SHA de destino,
dispara `Full Release Validation` a partir dessa ref fixada, verifica se o
`headSha` de cada workflow filho corresponde ao destino e exclui a branch temporária quando a
execução termina. O verificador abrangente também falha se algum workflow filho for executado em um
SHA diferente.

`release_profile` controla a amplitude de live/provedores passada para as verificações de release. Os
workflows manuais de release usam `stable` por padrão; use `full` apenas quando você
intencionalmente quiser a matriz ampla consultiva de provedores/mídia. `run_release_soak`
controla se as verificações de release estáveis/padrão executam o soak exaustivo live/E2E e
do caminho de release do Docker; `full` força o soak.

- `minimum` mantém as lanes mais rápidas e críticas para release de OpenAI/core.
- `stable` adiciona o conjunto estável de provedores/backends.
- `full` executa a matriz ampla consultiva de provedores/mídia.

O abrangente registra os ids das execuções filhas disparadas, e o job final `Verify full validation` verifica novamente as conclusões atuais das execuções filhas e acrescenta tabelas dos jobs mais lentos para cada execução filha. Se um workflow filho for reexecutado e ficar verde, reexecute apenas o job verificador pai para atualizar o resultado abrangente e o resumo de tempos.

Para recuperação, tanto `Full Release Validation` quanto `OpenClaw Release Checks` aceitam `rerun_group`. Use `all` para uma candidata a release, `ci` apenas para o filho normal de CI completo, `plugin-prerelease` apenas para o filho de pré-release de Plugin, `release-checks` para todos os filhos de release, ou um grupo mais estreito: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` no abrangente. Isso mantém a reexecução de uma caixa de release com falha delimitada depois de uma correção focada. Para uma lane cross-OS com falha, combine `rerun_group=cross-os` com `cross_os_suite_filter`, por exemplo `windows/packaged-upgrade`; comandos cross-OS longos emitem linhas de heartbeat, e resumos de packaged-upgrade incluem tempos por fase. Lanes de verificação de release de QA são consultivas, portanto falhas apenas de QA avisam, mas não bloqueiam o verificador de verificação de release.

`OpenClaw Release Checks` usa a ref confiável do workflow para resolver a ref selecionada uma vez em um tarball `release-package-under-test`, depois passa esse artefato para verificações cross-OS e Aceitação de Pacote, além do workflow Docker live/E2E de caminho de release quando a cobertura de soak é executada. Isso mantém os bytes do pacote consistentes entre caixas de release e evita reempacotar a mesma candidata em vários jobs filhos.

Execuções duplicadas de `Full Release Validation` para `ref=main` e `rerun_group=all`
substituem o abrangente mais antigo. O monitor pai cancela qualquer workflow filho que
já tenha disparado quando o pai é cancelado, então uma validação mais nova da main
não fica atrás de uma execução obsoleta de duas horas de verificação de release. A validação de
branch/tag de release e grupos de reexecução focados mantêm `cancel-in-progress: false`.

## Shards live e E2E

O filho live/E2E de release mantém cobertura nativa ampla de `pnpm test:live`, mas a executa como shards nomeados por meio de `scripts/test-live-shard.mjs` em vez de um job serial:

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
- shards de mídia de áudio/vídeo divididos e shards de música filtrados por provedor

Isso mantém a mesma cobertura de arquivos enquanto torna falhas lentas de provedores live mais fáceis de reexecutar e diagnosticar. Os nomes de shards agregados `native-live-extensions-o-z`, `native-live-extensions-media` e `native-live-extensions-media-music` continuam válidos para reexecuções manuais de tentativa única.

Os shards nativos de mídia live são executados em `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, criado pelo workflow `Live Media Runner Image`. Essa imagem pré-instala `ffmpeg` e `ffprobe`; jobs de mídia apenas verificam os binários antes da configuração. Mantenha suítes live baseadas em Docker em runners Blacksmith normais — jobs em contêiner são o lugar errado para iniciar testes Docker aninhados.

Shards live de modelo/backend baseados em Docker usam uma imagem compartilhada separada `ghcr.io/openclaw/openclaw-live-test:<sha>` por commit selecionado. O workflow live de release cria e envia essa imagem uma vez, depois os shards Docker live de modelo, Gateway com shards por provedor, backend da CLI, bind ACP e harness Codex são executados com `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shards Docker do Gateway carregam limites explícitos de `timeout` no nível do script abaixo do timeout do job do workflow, para que um contêiner ou caminho de limpeza travado falhe rápido em vez de consumir todo o orçamento de verificação de release. Se esses shards recriarem o alvo Docker completo do código-fonte de forma independente, a execução de release está mal configurada e desperdiçará tempo de relógio com builds de imagem duplicados.

## Aceitação de Pacote

Use `Package Acceptance` quando a pergunta for "este pacote instalável do OpenClaw funciona como produto?" Ela é diferente do CI normal: o CI normal valida a árvore de código-fonte, enquanto a aceitação de pacote valida um único tarball por meio do mesmo harness Docker E2E que usuários exercitam após instalação ou atualização.

### Jobs

1. `resolve_package` faz checkout de `workflow_ref`, resolve uma candidata de pacote, grava `.artifacts/docker-e2e-package/openclaw-current.tgz`, grava `.artifacts/docker-e2e-package/package-candidate.json`, envia ambos como o artefato `package-under-test` e imprime a origem, ref do workflow, ref do pacote, versão, SHA-256 e perfil no resumo de etapa do GitHub.
2. `docker_acceptance` chama `openclaw-live-and-e2e-checks-reusable.yml` com `ref=workflow_ref` e `package_artifact_name=package-under-test`. O workflow reutilizável baixa esse artefato, valida o inventário do tarball, prepara imagens Docker de resumo do pacote quando necessário e executa as lanes Docker selecionadas contra esse pacote em vez de empacotar o checkout do workflow. Quando um perfil seleciona múltiplas `docker_lanes` direcionadas, o workflow reutilizável prepara o pacote e as imagens compartilhadas uma vez, depois distribui essas lanes como jobs Docker direcionados paralelos com artefatos únicos.
3. `package_telegram` opcionalmente chama `NPM Telegram Beta E2E`. Ele é executado quando `telegram_mode` não é `none` e instala o mesmo artefato `package-under-test` quando a Aceitação de Pacote resolveu um; o dispatch independente do Telegram ainda pode instalar uma spec npm publicada.
4. `summary` falha o workflow se a resolução do pacote, a aceitação Docker ou a lane opcional do Telegram falharem.

### Origens de candidatas

- `source=npm` aceita apenas `openclaw@beta`, `openclaw@latest` ou uma versão exata de release do OpenClaw, como `openclaw@2026.4.27-beta.2`. Use isso para aceitação de pré-release/estável publicado.
- `source=ref` empacota uma branch, tag ou SHA de commit completo confiável de `package_ref`. O resolvedor busca branches/tags do OpenClaw, verifica se o commit selecionado é alcançável a partir do histórico de branch do repositório ou de uma tag de release, instala dependências em uma worktree desanexada e o empacota com `scripts/package-openclaw-for-docker.mjs`.
- `source=url` baixa um `.tgz` HTTPS; `package_sha256` é obrigatório.
- `source=artifact` baixa um `.tgz` de `artifact_run_id` e `artifact_name`; `package_sha256` é opcional, mas deve ser fornecido para artefatos compartilhados externamente.

Mantenha `workflow_ref` e `package_ref` separados. `workflow_ref` é o código confiável de workflow/harness que executa o teste. `package_ref` é o commit de origem que é empacotado quando `source=ref`. Isso permite que o harness de teste atual valide commits de origem confiáveis mais antigos sem executar lógica antiga de workflow.

### Perfis de suíte

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` mais `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunks completos Docker de caminho de release com OpenWebUI
- `custom` — `docker_lanes` exatas; obrigatório quando `suite_profile=custom`

O perfil `package` usa cobertura de Plugins offline para que a validação de pacote publicado não dependa da disponibilidade live do ClawHub. A lane opcional do Telegram reutiliza o artefato `package-under-test` em `NPM Telegram Beta E2E`, com o caminho de spec npm publicado mantido para dispatches independentes.

Para a política dedicada de testes de atualização e Plugins, incluindo comandos locais,
lanes Docker, entradas de Aceitação de Pacote, padrões de release e triagem de falhas,
consulte [Como testar atualizações e Plugins](/pt-BR/help/testing-updates-plugins).

As verificações de release chamam a Aceitação de Pacote com `source=artifact`, o artefato de pacote de release preparado, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` e `telegram_mode=mock-openai`. Isso mantém a migração de pacote, atualização, instalação live de Skills do ClawHub, limpeza de dependências obsoletas de Plugins, reparo de instalação de Plugins configurados, Plugin offline, atualização de Plugin e prova do Telegram no mesmo tarball de pacote resolvido. Defina `package_acceptance_package_spec` em Full Release Validation ou OpenClaw Release Checks para executar essa mesma matriz contra um pacote npm enviado em vez do artefato criado a partir do SHA. Verificações cross-OS de release ainda cobrem onboarding, instalador e comportamento de plataforma específicos do SO; a validação de produto de pacote/atualização deve começar com a Aceitação de Pacote. A lane Docker `published-upgrade-survivor` valida um baseline de pacote publicado por execução no caminho bloqueante de release. Na Aceitação de Pacote, o tarball `package-under-test` resolvido é sempre a candidata e `published_upgrade_survivor_baseline` seleciona o baseline publicado de fallback, usando `openclaw@latest` por padrão; comandos de reexecução de lanes com falha preservam esse baseline. Full Release Validation com `run_release_soak=true` ou `release_profile=full` define `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` e `published_upgrade_survivor_scenarios=reported-issues` para expandir pelas quatro releases estáveis mais recentes do npm, além de releases fixadas de limite de compatibilidade de Plugins e fixtures moldadas por issues para configuração do Feishu, arquivos de bootstrap/persona preservados, instalações configuradas de Plugin do OpenClaw, caminhos de log com til e raízes obsoletas de dependências de Plugins legados. Seleções multibaseline de sobrevivente de upgrade publicado são shardadas por baseline em jobs separados e direcionados de runner Docker. O workflow separado `Update Migration` usa a lane Docker `update-migration` com `all-since-2026.4.23` e `plugin-deps-cleanup` quando a pergunta é limpeza exaustiva de atualização publicada, não a amplitude normal do CI de Full Release. Execuções agregadas locais podem passar specs exatas de pacote com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, manter uma única lane com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, como `openclaw@2026.4.15`, ou definir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para a matriz de cenários. A lane publicada configura o baseline com uma receita incorporada de comando `openclaw config set`, registra etapas da receita em `summary.json` e sonda `/healthz`, `/readyz`, além de status RPC depois do início do Gateway. As lanes frescas empacotadas e de instalador do Windows também verificam se um pacote instalado consegue importar uma substituição de controle de navegador a partir de um caminho absoluto bruto do Windows. O smoke de agent-turn cross-OS da OpenAI usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` por padrão quando definido; caso contrário, usa `openai/gpt-5.4`, para que a prova de instalação e Gateway permaneça em um modelo de teste GPT-5, evitando padrões GPT-4.x.

### Janelas de compatibilidade legada

A Aceitação de Pacote tem janelas limitadas de compatibilidade legada para pacotes já publicados. Pacotes até `2026.4.25`, incluindo `2026.4.25-beta.*`, podem usar o caminho de compatibilidade:

- entradas conhecidas de QA privada em `dist/postinstall-inventory.json` podem apontar para arquivos omitidos do tarball;
- `doctor-switch` pode ignorar o subcaso de persistência `gateway install --wrapper` quando o pacote não expõe essa flag;
- `update-channel-switch` pode remover `pnpm.patchedDependencies` ausentes do fixture git falso derivado do tarball e pode registrar `update.channel` persistido ausente;
- smokes de plugins podem ler locais legados de registros de instalação ou aceitar a ausência de persistência do registro de instalação do marketplace;
- `plugin-update` pode permitir a migração de metadados de configuração enquanto ainda exige que o registro de instalação e o comportamento sem reinstalação permaneçam inalterados.

O pacote `2026.4.26` publicado também pode alertar sobre arquivos de marcação de metadados de build local que já foram enviados. Pacotes posteriores devem satisfazer os contratos modernos; as mesmas condições falham em vez de alertar ou serem ignoradas.

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

Ao depurar uma execução com falha de aceitação de pacote, comece pelo resumo `resolve_package` para confirmar a origem, a versão e o SHA-256 do pacote. Em seguida, inspecione a execução filha `docker_acceptance` e seus artefatos Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logs de lanes, tempos de fases e comandos de reexecução. Prefira reexecutar o perfil de pacote com falha ou as lanes Docker exatas em vez de reexecutar a validação completa de release.

## Smoke de instalação

O workflow separado `Install Smoke` reutiliza o mesmo script de escopo por meio de seu próprio job `preflight`. Ele divide a cobertura de smoke em `run_fast_install_smoke` e `run_full_install_smoke`.

- **Caminho rápido** é executado para pull requests que tocam superfícies Docker/pacote, alterações de pacote/manifesto de plugins incluídos ou superfícies centrais de plugin/canal/Gateway/Plugin SDK que os jobs de smoke Docker exercitam. Alterações somente de código-fonte em plugins incluídos, edições somente de teste e edições somente de docs não reservam workers Docker. O caminho rápido constrói a imagem do Dockerfile raiz uma vez, verifica a CLI, executa o smoke da CLI de exclusão de agentes em workspace compartilhado, executa o e2e de rede do Gateway em container, verifica um argumento de build de extensão incluída e executa o perfil Docker limitado de plugins incluídos sob um timeout agregado de comando de 240 segundos (cada execução Docker de cenário é limitada separadamente).
- **Caminho completo** mantém a instalação de pacote QR e a cobertura Docker/de atualização do instalador para execuções agendadas noturnas, dispatches manuais, verificações de release por workflow-call e pull requests que realmente tocam superfícies de instalador/pacote/Docker. No modo completo, install-smoke prepara ou reutiliza uma imagem GHCR de smoke do Dockerfile raiz para o SHA alvo, depois executa a instalação de pacote QR, smokes do Dockerfile raiz/Gateway, smokes de instalador/atualização e o E2E Docker rápido de plugins incluídos como jobs separados, para que o trabalho de instalador não espere pelos smokes da imagem raiz.

Pushes para `main` (incluindo commits de merge) não forçam o caminho completo; quando a lógica de escopo alterado solicitar cobertura completa em um push, o workflow mantém o smoke Docker rápido e deixa o smoke completo de instalação para a validação noturna ou de release.

O smoke lento de provedor de imagem com instalação global Bun é controlado separadamente por `run_bun_global_install_smoke`. Ele é executado no agendamento noturno e a partir do workflow de verificações de release, e dispatches manuais de `Install Smoke` podem optar por incluí-lo, mas pull requests e pushes para `main` não. Testes Docker de QR e instalador mantêm seus próprios Dockerfiles focados em instalação.

## E2E Docker local

`pnpm test:docker:all` pré-constrói uma imagem compartilhada de teste live, empacota o OpenClaw uma vez como um tarball npm e constrói duas imagens compartilhadas de `scripts/e2e/Dockerfile`:

- um runner Node/Git básico para lanes de instalador/atualização/dependência de plugin;
- uma imagem funcional que instala o mesmo tarball em `/app` para lanes de funcionalidade normal.

As definições de lanes Docker ficam em `scripts/lib/docker-e2e-scenarios.mjs`, a lógica do planejador fica em `scripts/lib/docker-e2e-plan.mjs`, e o runner executa apenas o plano selecionado. O agendador seleciona a imagem por lane com `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, depois executa lanes com `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Ajustáveis

| Variável                               | Padrão | Finalidade                                                                                   |
| -------------------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10     | Contagem de slots do pool principal para lanes normais.                                      |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10     | Contagem de slots do pool de cauda sensível a provedores.                                    |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9      | Limite de lanes live simultâneas para que provedores não façam throttling.                   |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10     | Limite de lanes simultâneas de instalação npm.                                               |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7      | Limite de lanes simultâneas com múltiplos serviços.                                          |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000   | Intervalo entre inícios de lanes para evitar tempestades de criação no daemon Docker; defina `0` para sem intervalo. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Timeout de fallback por lane (120 minutos); lanes live/de cauda selecionadas usam limites mais rígidos. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset  | `1` imprime o plano do agendador sem executar lanes.                                         |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset  | Lista de lanes exatas separadas por vírgulas; ignora o smoke de limpeza para que agentes possam reproduzir uma lane com falha. |

Uma lane mais pesada que seu limite efetivo ainda pode iniciar a partir de um pool vazio, depois é executada sozinha até liberar capacidade. Os preflights agregados locais verificam Docker, removem containers E2E obsoletos do OpenClaw, emitem status de lanes ativas, persistem tempos de lanes para ordenação longest-first e, por padrão, param de agendar novas lanes em pool após a primeira falha.

### Workflow live/E2E reutilizável

O workflow live/E2E reutilizável pergunta a `scripts/test-docker-all.mjs --plan-json` qual cobertura de pacote, tipo de imagem, imagem live, lane e credenciais é necessária. `scripts/docker-e2e.mjs` então converte esse plano em outputs e resumos do GitHub. Ele empacota o OpenClaw por meio de `scripts/package-openclaw-for-docker.mjs`, baixa um artefato de pacote da execução atual ou baixa um artefato de pacote de `package_artifact_run_id`; valida o inventário do tarball; constrói e envia imagens Docker E2E GHCR básicas/funcionais marcadas com digest do pacote por meio do cache de camadas Docker da Blacksmith quando o plano precisa de lanes com pacote instalado; e reutiliza entradas `docker_e2e_bare_image`/`docker_e2e_functional_image` fornecidas ou imagens existentes por digest do pacote em vez de reconstruir. Pulls de imagens Docker são tentados novamente com um timeout limitado de 180 segundos por tentativa para que um stream preso de registry/cache tente novamente rapidamente em vez de consumir a maior parte do caminho crítico de CI.

### Blocos do caminho de release

A cobertura Docker de release executa jobs menores em blocos com `OPENCLAW_SKIP_DOCKER_BUILD=1`, para que cada bloco baixe apenas o tipo de imagem necessário e execute múltiplas lanes pelo mesmo agendador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Os blocos Docker de release atuais são `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` e `plugins-runtime-install-a` até `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` permanecem aliases agregados de plugin/runtime. O alias de lane `install-e2e` permanece o alias agregado de reexecução manual para ambas as lanes de instalador de provedor.

OpenWebUI é incorporado em `plugins-runtime-services` quando a cobertura completa do caminho de release o solicita, e mantém um bloco independente `openwebui` apenas para dispatches somente de OpenWebUI. Lanes de atualização de canais incluídos tentam novamente uma vez em caso de falhas transitórias de rede npm.

Cada bloco faz upload de `.artifacts/docker-tests/` com logs de lanes, tempos, `summary.json`, `failures.json`, tempos de fases, JSON do plano do agendador, tabelas de lanes lentas e comandos de reexecução por lane. A entrada `docker_lanes` do workflow executa lanes selecionadas contra as imagens preparadas em vez dos jobs de bloco, o que mantém a depuração de lanes com falha limitada a um job Docker direcionado e prepara, baixa ou reutiliza o artefato de pacote para essa execução; se uma lane selecionada for uma lane Docker live, o job direcionado constrói a imagem de teste live localmente para essa reexecução. Comandos de reexecução por lane gerados para GitHub incluem `package_artifact_run_id`, `package_artifact_name` e entradas de imagem preparadas quando esses valores existem, para que uma lane com falha possa reutilizar o pacote e as imagens exatos da execução com falha.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

O workflow live/E2E agendado executa diariamente a suíte Docker completa do caminho de release.

## Pré-release de Plugin

`Plugin Prerelease` é uma cobertura de produto/pacote mais cara, portanto é um workflow separado disparado por `Full Release Validation` ou por um operador explícito. Pull requests normais, pushes para `main` e dispatches manuais independentes de CI mantêm essa suíte desativada. Ele balanceia testes de plugins incluídos entre oito workers de extensão; esses jobs de shards de extensão executam até dois grupos de configuração de plugin por vez, com um worker Vitest por grupo e um heap Node maior para que lotes de plugins com muitas importações não criem jobs extras de CI. O caminho Docker de pré-release exclusivo de release agrupa lanes Docker direcionadas em pequenos grupos para evitar reservar dezenas de runners para jobs de um a três minutos.

## QA Lab

QA Lab tem lanes de CI dedicadas fora do workflow principal com escopo inteligente. A paridade agentic fica aninhada sob os harnesses amplos de QA e release, não como um workflow independente de PR. Use `Full Release Validation` com `rerun_group=qa-parity` quando a paridade deve acompanhar uma execução de validação ampla.

- O workflow `QA-Lab - All Lanes` é executado toda noite em `main` e em dispatch manual; ele distribui a lane de paridade mock, a lane Matrix live e as lanes live de Telegram e Discord como jobs paralelos. Jobs live usam o ambiente `qa-live-shared`, e Telegram/Discord usam leases Convex.

As verificações de release executam lanes de transporte live do Matrix e Telegram com o provedor mock determinístico e modelos qualificados por mock (`mock-openai/gpt-5.5` e `mock-openai/gpt-5.5-alt`) para que o contrato do canal fique isolado da latência do modelo live e da inicialização normal do provider-plugin. O gateway de transporte live desabilita a busca de memória porque a paridade de QA cobre o comportamento de memória separadamente; a conectividade do provedor é coberta pelas suítes separadas de modelo live, provedor nativo e provedor Docker.

O Matrix usa `--profile fast` para gates agendados e de release, adicionando `--fail-fast` somente quando a CLI em checkout oferece suporte a isso. O padrão da CLI e a entrada manual do workflow permanecem `all`; o dispatch manual `matrix_profile=all` sempre fragmenta a cobertura completa do Matrix em jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`.

`OpenClaw Release Checks` também executa as lanes críticas de release do QA Lab antes da aprovação do release; seu gate de paridade de QA executa os pacotes candidato e baseline como jobs de lane paralelos, depois baixa ambos os artefatos em um pequeno job de relatório para a comparação final de paridade.

Para PRs normais, siga evidências de CI/verificação com escopo em vez de tratar a paridade como um status obrigatório.

## CodeQL

O workflow `CodeQL` é intencionalmente um scanner de segurança inicial e restrito, não uma varredura completa do repositório. Execuções diárias, manuais e de guarda de pull requests que não são rascunho analisam código de workflows do Actions mais as superfícies JavaScript/TypeScript de maior risco com consultas de segurança de alta confiança filtradas para `security-severity` alta/crítica.

O guarda de pull request permanece leve: ele só inicia para alterações em `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` ou `src`, e executa a mesma matriz de segurança de alta confiança do workflow agendado. Android e macOS CodeQL ficam fora dos padrões de PR.

### Categorias de segurança

| Categoria                                         | Superfície                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, segredos, sandbox, cron e baseline do gateway                                                                                 |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementação do canal core mais o runtime do plugin de canal, gateway, Plugin SDK, segredos e pontos de auditoria     |
| `/codeql-security-high/network-ssrf-boundary`     | Superfícies core de SSRF, análise de IP, guarda de rede, web-fetch e política de SSRF do Plugin SDK                                 |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, auxiliares de execução de processos, entrega de saída e gates de execução de ferramentas do agente                  |
| `/codeql-security-high/plugin-trust-boundary`     | Superfícies de confiança de instalação de Plugin, loader, manifesto, registro, instalação por gerenciador de pacotes, carregamento de fonte e contrato de pacote do Plugin SDK |

### Shards de segurança específicos da plataforma

- `CodeQL Android Critical Security` — shard agendado de segurança do Android. Compila o app Android manualmente para CodeQL no menor runner Blacksmith Linux aceito pela sanidade do workflow. Envia uploads em `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard semanal/manual de segurança do macOS. Compila o app macOS manualmente para CodeQL no Blacksmith macOS, filtra resultados de build de dependências para fora do SARIF enviado e envia uploads em `/codeql-critical-security/macos`. Mantido fora dos padrões diários porque o build do macOS domina o tempo de execução mesmo quando está limpo.

### Categorias de qualidade crítica

`CodeQL Critical Quality` é o shard não relacionado a segurança correspondente. Ele executa somente consultas JavaScript/TypeScript de qualidade, sem segurança e com severidade de erro, sobre superfícies restritas de alto valor no runner Blacksmith Linux menor. Seu guarda de pull request é intencionalmente menor que o perfil agendado: PRs que não são rascunho executam apenas os shards correspondentes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` e `plugin-sdk-reply-runtime` para alterações em código de execução de comandos/modelos/ferramentas de agente e despacho de respostas, código de schema/migração/IO de configuração, código de auth/segredos/sandbox/segurança, runtime core de canal e de Plugin de canal agrupado, protocolo/método de servidor do gateway, runtime de memória/cola do SDK, MCP/processo/entrega de saída, runtime de provedor/catálogo de modelos, diagnósticos de sessão/filas de entrega, loader de Plugin, contrato de pacote/Plugin SDK ou runtime de resposta do Plugin SDK. Alterações na configuração do CodeQL e no workflow de qualidade executam todos os doze shards de qualidade de PR.

O dispatch manual aceita:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Os perfis restritos são ganchos de ensino/iteração para executar um shard de qualidade isoladamente.

| Categoria                                               | Superfície                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Código de Auth, segredos, sandbox, cron e limite de segurança do gateway                                                                                          |
| `/codeql-critical-quality/config-boundary`              | Contratos de schema de configuração, migração, normalização e IO                                                                                                  |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schemas de protocolo do Gateway e contratos de métodos do servidor                                                                                                |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementação do canal core e do Plugin de canal agrupado                                                                                            |
| `/codeql-critical-quality/agent-runtime-boundary`       | Execução de comandos, despacho de modelos/provedores, despacho e filas de respostas automáticas e contratos de runtime do plano de controle ACP                    |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP e bridges de ferramentas, auxiliares de supervisão de processos e contratos de entrega de saída                                                    |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK de host de memória, facades de runtime de memória, aliases de memória do Plugin SDK, cola de ativação do runtime de memória e comandos doctor de memória       |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internos da fila de respostas, filas de entrega de sessão, auxiliares de vínculo/entrega de sessão de saída, superfícies de pacote de eventos/logs de diagnóstico e contratos da CLI de doctor de sessão |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de respostas inbound do Plugin SDK, payload de resposta/fragmentação/auxiliares de runtime, opções de resposta de canal, filas de entrega e auxiliares de vínculo de sessão/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalização de catálogo de modelos, auth e descoberta de provedores, registro de runtime de provedores, padrões/catálogos de provedores e registros de web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap da UI de controle, persistência local, fluxos de controle do gateway e contratos de runtime do plano de controle de tarefas                             |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratos de runtime core de web fetch/search, IO de mídia, compreensão de mídia, geração de imagens e geração de mídia                                           |
| `/codeql-critical-quality/plugin-boundary`              | Contratos de loader, registro, superfície pública e pontos de entrada do Plugin SDK                                                                               |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Fonte do Plugin SDK do lado do pacote publicado e auxiliares de contrato de pacote de plugin                                                                      |

A qualidade permanece separada da segurança para que achados de qualidade possam ser agendados, medidos, desabilitados ou expandidos sem obscurecer o sinal de segurança. A expansão do CodeQL para Swift, Python e plugins agrupados deve ser adicionada novamente como trabalho de acompanhamento com escopo ou fragmentado somente depois que os perfis restritos tiverem runtime e sinal estáveis.

## Workflows de manutenção

### Agente de docs

O workflow `Docs Agent` é uma lane de manutenção Codex orientada por eventos para manter a documentação existente alinhada com alterações que chegaram recentemente. Ele não tem agendamento puro: uma execução de CI bem-sucedida de push não bot em `main` pode acioná-lo, e o dispatch manual pode executá-lo diretamente. Invocações por workflow-run são ignoradas quando `main` avançou ou quando outra execução não ignorada do Docs Agent foi criada na última hora. Quando ele executa, revisa o intervalo de commits desde o SHA de origem anterior não ignorado do Docs Agent até o `main` atual, de modo que uma execução horária possa cobrir todas as alterações acumuladas em main desde a última passada de docs.

### Agente de performance de testes

O workflow `Test Performance Agent` é uma lane de manutenção Codex orientada por eventos para testes lentos. Ele não tem agendamento puro: uma execução de CI bem-sucedida de push não bot em `main` pode acioná-lo, mas ele é ignorado se outra invocação por workflow-run já executou ou está executando naquele dia UTC. O dispatch manual ignora esse gate de atividade diária. A lane cria um relatório de performance Vitest agrupado da suíte completa, permite que o Codex faça apenas pequenas correções de performance de testes que preservem a cobertura em vez de refatorações amplas, depois executa novamente o relatório da suíte completa e rejeita alterações que reduzam a contagem baseline de testes passando. Se o baseline tiver testes falhando, o Codex pode corrigir apenas falhas óbvias e o relatório da suíte completa pós-agente deve passar antes de qualquer commit. Quando `main` avança antes do push do bot chegar, a lane faz rebase do patch validado, executa novamente `pnpm check:changed` e tenta novamente o push; patches obsoletos conflitantes são ignorados. Ela usa Ubuntu hospedado pelo GitHub para que a action do Codex possa manter a mesma postura de segurança drop-sudo do agente de docs.

### PRs duplicados após merge

O workflow `Duplicate PRs After Merge` é um workflow manual de mantenedor para limpeza de duplicados após aterrissagem. Ele usa dry-run por padrão e só fecha PRs explicitamente listados quando `apply=true`. Antes de mutar o GitHub, ele verifica que o PR aterrissado foi mesclado e que cada duplicado tem uma issue referenciada compartilhada ou hunks alterados sobrepostos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gates de verificação locais e roteamento de alterações

A lógica local de changed-lane vive em `scripts/changed-lanes.mjs` e é executada por `scripts/check-changed.mjs`. Esse gate de verificação local é mais rigoroso quanto a limites de arquitetura do que o escopo amplo da plataforma de CI:

- alterações de produção no core executam typecheck de produção do core e de testes do core, além de lint/guards do core;
- alterações somente em testes do core executam apenas typecheck de testes do core, além de lint do core;
- alterações de produção em extensões executam typecheck de produção da extensão e de testes da extensão, além de lint da extensão;
- alterações somente em testes de extensões executam typecheck de testes da extensão, além de lint da extensão;
- alterações no Plugin SDK público ou em contratos de plugins expandem para typecheck de extensões porque as extensões dependem desses contratos do core (varreduras de extensões do Vitest continuam sendo trabalho de teste explícito);
- incrementos de versão somente em metadados de release executam verificações direcionadas de versão/configuração/dependência raiz;
- alterações desconhecidas de raiz/configuração falham com segurança para todas as faixas de verificação.

O roteamento local de testes alterados fica em `scripts/test-projects.test-support.mjs` e é intencionalmente mais barato que `check:changed`: edições diretas de testes executam os próprios testes, edições de código-fonte preferem mapeamentos explícitos, depois testes irmãos e dependentes do grafo de importação. A configuração compartilhada de entrega em salas de grupo é um dos mapeamentos explícitos: alterações na configuração de resposta visível ao grupo, no modo de entrega de resposta de origem ou no prompt de sistema da ferramenta de mensagens passam pelos testes de resposta do core, além de regressões de entrega do Discord e do Slack, para que uma alteração de padrão compartilhado falhe antes do primeiro push do PR. Use `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` somente quando a alteração for ampla o suficiente no harness para que o conjunto mapeado barato não seja um proxy confiável.

## Validação no Testbox

Execute o Testbox a partir da raiz do repositório e prefira uma caixa aquecida nova para prova ampla. Antes de gastar uma verificação lenta em uma caixa que foi reutilizada, expirou ou acabou de relatar uma sincronização inesperadamente grande, execute `pnpm testbox:sanity` dentro da caixa primeiro.

A verificação de sanidade falha rapidamente quando arquivos raiz obrigatórios como `pnpm-lock.yaml` desapareceram ou quando `git status --short` mostra pelo menos 200 exclusões rastreadas. Isso normalmente significa que o estado de sincronização remota não é uma cópia confiável do PR; pare essa caixa e aqueça uma nova em vez de depurar a falha do teste do produto. Para PRs intencionais com muitas exclusões, defina `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para essa execução de sanidade.

`pnpm testbox:run` também encerra uma invocação local da CLI do Blacksmith que permanece na fase de sincronização por mais de cinco minutos sem saída pós-sincronização. Defina `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` para desabilitar essa proteção ou use um valor maior em milissegundos para diffs locais excepcionalmente grandes.

Crabbox é o wrapper de caixa remota pertencente ao repositório para prova Linux de mantenedores. Use-o quando uma verificação for ampla demais para um ciclo local de edição, quando a paridade com CI importar ou quando a prova precisar de segredos, Docker, faixas de pacote, caixas reutilizáveis ou logs remotos. O backend normal do OpenClaw é `blacksmith-testbox`; a capacidade própria da AWS/Hetzner é uma alternativa para indisponibilidades do Blacksmith, problemas de cota ou testes explícitos em capacidade própria.

Antes de uma primeira execução, verifique o wrapper a partir da raiz do repositório:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

O wrapper do repositório recusa um binário Crabbox desatualizado que não anuncia `blacksmith-testbox`. Passe o provedor explicitamente, mesmo que `.crabbox.yaml` tenha padrões de nuvem própria.

Verificação de alterações:

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

Reexecução de teste focado:

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

Leia o resumo JSON final. Os campos úteis são `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` e `totalMs`. Execuções Crabbox únicas com suporte do Blacksmith devem parar o Testbox automaticamente; se uma execução for interrompida ou a limpeza não estiver clara, inspecione as caixas ativas e pare somente as caixas que você criou:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Use reutilização somente quando você precisar intencionalmente de vários comandos na mesma caixa hidratada:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Se o Crabbox for a camada quebrada, mas o próprio Blacksmith funcionar, use o Blacksmith direto como uma alternativa restrita:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Se `blacksmith testbox list --all` e `blacksmith testbox status` funcionarem, mas novos aquecimentos ficarem `queued` sem IP ou URL de execução do Actions depois de alguns minutos, trate isso como pressão de provedor, fila, cobrança ou limite de organização do Blacksmith. Pare os ids em fila que você criou, evite iniciar mais Testboxes e mova a prova para o caminho de capacidade própria do Crabbox abaixo enquanto alguém verifica o painel do Blacksmith, a cobrança e os limites da organização.

Escalone para capacidade própria do Crabbox somente quando o Blacksmith estiver indisponível, limitado por cota, sem o ambiente necessário, ou quando a capacidade própria for explicitamente o objetivo:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Sob pressão da AWS, evite `class=beast`, a menos que a tarefa realmente precise de CPU de classe 48xlarge. Uma solicitação `beast` começa em 192 vCPUs e é a maneira mais fácil de esbarrar em cotas regionais de EC2 Spot ou On-Demand Standard. O `.crabbox.yaml` pertencente ao repositório usa por padrão `standard`, várias regiões de capacidade e `capacity.hints: true`, de modo que leases AWS intermediados imprimem região/mercado selecionados, pressão de cota, fallback para Spot e avisos de classe sob alta pressão. Use `fast` para verificações amplas mais pesadas, `large` somente depois que standard/fast não forem suficientes, e `beast` apenas para faixas excepcionais limitadas por CPU, como suíte completa ou matrizes Docker de todos os plugins, validação explícita de release/bloqueador ou profiling de desempenho com muitos núcleos. Não use `beast` para `pnpm check:changed`, testes focados, trabalho somente de documentação, lint/typecheck comuns, pequenas reproduções E2E ou triagem de indisponibilidade do Blacksmith. Use `--market on-demand` para diagnóstico de capacidade, para que a oscilação do mercado Spot não seja misturada ao sinal.

`.crabbox.yaml` controla os padrões de provedor, sincronização e hidratação do GitHub Actions para faixas de nuvem própria. Ele exclui o `.git` local para que o checkout hidratado do Actions mantenha seus próprios metadados Git remotos em vez de sincronizar remotos e repositórios de objetos locais de mantenedores, e exclui artefatos locais de runtime/build que nunca devem ser transferidos. `.github/workflows/crabbox-hydrate.yml` controla checkout, configuração de Node/pnpm, fetch de `origin/main` e transferência de ambiente sem segredos para comandos `crabbox run --id <cbx_id>` em nuvem própria.

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Canais de desenvolvimento](/pt-BR/install/development-channels)
