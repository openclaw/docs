---
read_when:
    - Você precisa entender por que uma tarefa de CI foi ou não executada
    - Você está depurando uma verificação com falha do GitHub Actions
    - Você está coordenando uma execução ou reexecução de validação de lançamento
    - Você está alterando o acionamento do ClawSweeper ou o encaminhamento de atividades do GitHub
summary: Grafo de tarefas de CI, critérios de escopo, abrangências de lançamento e equivalentes de comandos locais
title: Pipeline de CI
x-i18n:
    generated_at: "2026-05-05T01:44:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16771940889d1fa944a5bfafe1152a033d96625595a2d89ff2cedbd3022cee66
    source_path: ci.md
    workflow: 16
---

OpenClaw CI é executado em cada push para `main` e em cada pull request. O job `preflight` classifica o diff e desativa lanes caras quando apenas áreas não relacionadas mudaram. Execuções manuais por `workflow_dispatch` ignoram intencionalmente o escopo inteligente e expandem o grafo completo para candidatos a release e validação ampla. As lanes de Android continuam opt-in por meio de `include_android`. A cobertura de plugins exclusiva de release fica no workflow separado [`Pré-lançamento de Plugin`](#plugin-prerelease) e só é executada a partir de [`Validação Completa de Release`](#full-release-validation) ou de um disparo manual explícito.

## Visão geral do pipeline

| Job                              | Finalidade                                                                                                   | Quando é executado                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `preflight`                      | Detecta mudanças apenas em docs, escopos alterados, extensões alteradas e cria o manifesto de CI              | Sempre em pushes e PRs não rascunho      |
| `security-scm-fast`              | Detecção de chave privada e auditoria de workflows via `zizmor`                                               | Sempre em pushes e PRs não rascunho      |
| `security-dependency-audit`      | Auditoria do lockfile de produção, sem dependências, contra avisos do npm                                     | Sempre em pushes e PRs não rascunho      |
| `security-fast`                  | Agregado obrigatório para os jobs rápidos de segurança                                                        | Sempre em pushes e PRs não rascunho      |
| `check-dependencies`             | Passo Knip de produção apenas para dependências mais a guarda da allowlist de arquivos não usados              | Mudanças relevantes para Node            |
| `build-artifacts`                | Cria `dist/`, Control UI, verificações de artefatos criados e artefatos reutilizáveis downstream               | Mudanças relevantes para Node            |
| `checks-fast-core`               | Lanes rápidas de correção no Linux, como verificações de bundled/contrato de plugin/protocolo                 | Mudanças relevantes para Node            |
| `checks-fast-contracts-channels` | Verificações fragmentadas de contratos de canais com um resultado de verificação agregado estável              | Mudanças relevantes para Node            |
| `checks-node-core-test`          | Shards de testes principais de Node, excluindo lanes de canal, bundled, contrato e extensão                    | Mudanças relevantes para Node            |
| `check`                          | Equivalente fragmentado do gate local principal: tipos de prod, lint, guardas, tipos de teste e smoke estrito | Mudanças relevantes para Node            |
| `check-additional`               | Arquitetura, drift fragmentado de boundary/prompt, guardas de extensão, package boundary e gateway watch       | Mudanças relevantes para Node            |
| `build-smoke`                    | Testes smoke da CLI criada e smoke de memória de inicialização                                                | Mudanças relevantes para Node            |
| `checks`                         | Verificador para testes de canais com artefatos criados                                                       | Mudanças relevantes para Node            |
| `checks-node-compat-node22`      | Lane de build e smoke de compatibilidade com Node 22                                                          | Disparo manual de CI para releases       |
| `check-docs`                     | Formatação, lint e verificações de links quebrados da documentação                                            | Docs alteradas                           |
| `skills-python`                  | Ruff + pytest para skills baseadas em Python                                                                  | Mudanças relevantes para skills Python   |
| `checks-windows`                 | Testes específicos do Windows para processos/caminhos mais regressões compartilhadas de especificadores de importação em runtime | Mudanças relevantes para Windows         |
| `macos-node`                     | Lane de testes TypeScript no macOS usando os artefatos criados compartilhados                                 | Mudanças relevantes para macOS           |
| `macos-swift`                    | Lint, build e testes Swift para o app macOS                                                                   | Mudanças relevantes para macOS           |
| `android`                        | Testes unitários Android para ambos os flavors mais um build de APK debug                                     | Mudanças relevantes para Android         |
| `test-performance-agent`         | Otimização diária de testes lentos do Codex após atividade confiável                                          | Sucesso do CI principal ou disparo manual |
| `openclaw-performance`           | Relatórios diários/sob demanda de performance do runtime Kova com mock-provider, deep-profile e lanes live GPT 5.4 | Disparo agendado e manual                |

## Ordem de fail-fast

1. `preflight` decide quais lanes existem. A lógica de `docs-scope` e `changed-scope` são etapas dentro desse job, não jobs independentes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falham rapidamente sem esperar pelos jobs mais pesados de artefatos e matriz de plataformas.
3. `build-artifacts` se sobrepõe às lanes rápidas de Linux para que consumidores downstream possam começar assim que o build compartilhado estiver pronto.
4. Depois disso, lanes mais pesadas de plataforma e runtime se expandem: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

O GitHub pode marcar jobs substituídos como `cancelled` quando um push mais recente chega ao mesmo PR ou ref `main`. Trate isso como ruído de CI, a menos que a execução mais recente para a mesma ref também esteja falhando. Verificações agregadas de shards usam `!cancelled() && always()` para ainda relatar falhas normais de shard, mas não entrar na fila depois que o workflow inteiro já foi substituído. A chave automática de concorrência do CI é versionada (`CI-v7-*`) para que um zumbi do lado do GitHub em um grupo de fila antigo não possa bloquear indefinidamente execuções mais novas de main. Execuções manuais da suíte completa usam `CI-manual-v1-*` e não cancelam execuções em andamento.

## Escopo e roteamento

A lógica de escopo fica em `scripts/ci-changed-scope.mjs` e é coberta por testes unitários em `src/scripts/ci-changed-scope.test.ts`. O disparo manual pula a detecção de escopo alterado e faz o manifesto de preflight agir como se todas as áreas com escopo tivessem mudado.

- **Edições no workflow de CI** validam o grafo de CI do Node mais o lint de workflow, mas não forçam builds nativos de Windows, Android ou macOS por si só; essas lanes de plataforma continuam limitadas ao escopo de mudanças no código-fonte da plataforma.
- **Edições apenas de roteamento de CI, edições selecionadas baratas de fixtures de testes principais e edições estreitas de helpers/test-routing de contrato de plugin** usam um caminho rápido de manifesto apenas para Node: `preflight`, segurança e uma única tarefa `checks-fast-core`. Esse caminho pula artefatos de build, compatibilidade com Node 22, contratos de canais, shards principais completos, shards de bundled-plugin e matrizes adicionais de guardas quando a mudança se limita às superfícies de roteamento ou helpers que a tarefa rápida exercita diretamente.
- **Verificações de Node no Windows** têm escopo limitado a wrappers de processos/caminhos específicos do Windows, helpers de runner npm/pnpm/UI, configuração do gerenciador de pacotes e superfícies do workflow de CI que executam essa lane; mudanças não relacionadas em código-fonte, plugin, install-smoke e apenas testes ficam nas lanes de Node do Linux.

As famílias de testes Node mais lentas são divididas ou balanceadas para que cada job permaneça pequeno sem reservar runners em excesso: contratos de canais rodam como três shards ponderados, lanes fast/support de unidades do core rodam separadamente, a infraestrutura de runtime do core é dividida entre shards de estado e processo/config, auto-reply roda como workers balanceados (com a subárvore de reply dividida em shards de agent-runner, dispatch e commands/state-routing), e configs agentic de gateway/server são divididas entre lanes de chat/auth/model/http-plugin/runtime/startup em vez de esperar por artefatos criados. Testes amplos de navegador, QA, mídia e plugins diversos usam suas configs Vitest dedicadas em vez do catch-all compartilhado de plugins. Shards de include-pattern registram entradas de tempo usando o nome do shard de CI, para que `.artifacts/vitest-shard-timings.json` possa distinguir uma config inteira de um shard filtrado. `check-additional` mantém o trabalho de compile/canary de package-boundary junto e separa arquitetura de topologia de runtime da cobertura de gateway watch; a lista de guardas de boundary é distribuída em quatro shards de matriz, cada um executando guardas independentes selecionadas em paralelo e imprimindo tempos por verificação, incluindo `pnpm prompt:snapshots:check`, para que o drift de prompt do caminho feliz do runtime Codex fique fixado ao PR que o causou. Gateway watch, testes de canais e o shard de support-boundary do core rodam em paralelo dentro de `build-artifacts` depois que `dist/` e `dist-runtime/` já foram criados.

O CI de Android executa tanto `testPlayDebugUnitTest` quanto `testThirdPartyDebugUnitTest` e depois cria o APK debug Play. O flavor third-party não tem source set ou manifesto separado; sua lane de testes unitários ainda compila o flavor com as flags BuildConfig de SMS/call-log, evitando ao mesmo tempo um job duplicado de empacotamento de APK debug em todo push relevante para Android.

O shard `check-dependencies` executa `pnpm deadcode:dependencies` (um passo Knip de produção apenas para dependências, fixado na versão mais recente do Knip, com a idade mínima de release do pnpm desativada para a instalação `dlx`) e `pnpm deadcode:unused-files`, que compara as descobertas de arquivos de produção não usados do Knip com `scripts/deadcode-unused-files.allowlist.mjs`. A guarda de arquivos não usados falha quando um PR adiciona um novo arquivo não usado sem revisão ou deixa uma entrada obsoleta na allowlist, preservando ao mesmo tempo superfícies intencionais de plugin dinâmico, geradas, de build, live-test e bridge de pacote que o Knip não consegue resolver estaticamente.

## Encaminhamento de atividade do ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` é a ponte do lado de destino da atividade do repositório OpenClaw para o ClawSweeper. Ele não faz checkout nem executa código não confiável de pull requests. O workflow cria um token de GitHub App a partir de `CLAWSWEEPER_APP_PRIVATE_KEY` e então dispara payloads compactos de `repository_dispatch` para `openclaw/clawsweeper`.

O workflow tem quatro lanes:

- `clawsweeper_item` para solicitações exatas de revisão de issues e pull requests;
- `clawsweeper_comment` para comandos explícitos do ClawSweeper em comentários de issues;
- `clawsweeper_commit_review` para solicitações de revisão em nível de commit em pushes para `main`;
- `github_activity` para atividade geral do GitHub que o agente ClawSweeper pode inspecionar.

A lane `github_activity` encaminha apenas metadados normalizados: tipo de evento, ação, ator, repositório, número do item, URL, título, estado e trechos curtos para comentários ou reviews quando presentes. Ela evita intencionalmente encaminhar o corpo completo do webhook. O workflow receptor em `openclaw/clawsweeper` é `.github/workflows/github-activity.yml`, que publica o evento normalizado no hook do OpenClaw Gateway para o agente ClawSweeper.

Atividade geral é observação, não entrega por padrão. O agente ClawSweeper recebe o destino Discord em seu prompt e deve publicar em `#clawsweeper` apenas quando o evento for surpreendente, acionável, arriscado ou operacionalmente útil. Aberturas rotineiras, edições, ruído de bots, ruído duplicado de webhook e tráfego normal de reviews devem resultar em `NO_REPLY`.

Trate títulos, comentários, corpos, texto de reviews, nomes de branches e mensagens de commit do GitHub como dados não confiáveis ao longo de todo esse caminho. Eles são entrada para sumarização e triagem, não instruções para o workflow ou runtime do agente.

## Disparos manuais

Os despachos manuais de CI executam o mesmo grafo de jobs da CI normal, mas forçam todos os lanes com escopo não Android: shards Linux Node, shards de plugins agrupados, contratos de canais, compatibilidade com Node 22, `check`, `check-additional`, smoke de build, verificações de docs, Skills Python, Windows, macOS e i18n da Control UI. Despachos manuais independentes de CI executam apenas Android com `include_android=true`; o guarda-chuva de release completo habilita Android passando `include_android=true`. Verificações estáticas de pré-lançamento de Plugin, o shard exclusivo de release `agentic-plugins`, a varredura completa em lote de plugins e lanes Docker de pré-lançamento de Plugin são excluídos da CI. A suíte Docker de pré-lançamento é executada apenas quando `Full Release Validation` despacha o workflow separado `Plugin Prerelease` com o gate de validação de release habilitado.

Execuções manuais usam um grupo de concorrência exclusivo para que uma suíte completa de candidato a release não seja cancelada por outra execução de push ou PR no mesmo ref. A entrada opcional `target_ref` permite que um chamador confiável execute esse grafo contra uma branch, tag ou SHA de commit completo enquanto usa o arquivo de workflow do ref de despacho selecionado.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, jobs e agregados de segurança rápidos (`security-scm-fast`, `security-dependency-audit`, `security-fast`), verificações rápidas de protocolo/contrato/agrupados, verificações de contrato de canal em shards, shards de `check` exceto lint, shards e agregados de `check-additional`, verificadores agregados de testes Node, verificações de docs, Skills Python, workflow-sanity, labeler, auto-response; o preflight de install-smoke também usa Ubuntu hospedado no GitHub para que a matriz do Blacksmith possa entrar na fila mais cedo |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shards de extensão mais leves, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` e `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shards de testes Linux Node, shards de testes de Plugin agrupado, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (sensível a CPU o bastante para que 8 vCPU custassem mais do que economizavam); builds Docker de install-smoke (o tempo de fila de 32 vCPU custou mais do que economizou)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` em `openclaw/openclaw`; forks usam `macos-latest` como fallback                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` em `openclaw/openclaw`; forks usam `macos-latest` como fallback                                                                                                                                                                                                                                                                                                                                                                                                 |

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

## Performance do OpenClaw

`OpenClaw Performance` é o workflow de performance do produto/runtime. Ele é executado diariamente em `main` e pode ser despachado manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

O despacho manual normalmente mede o ref do workflow. Defina `target_ref` para medir uma tag de release ou outra branch com a implementação atual do workflow. Caminhos de relatórios publicados e ponteiros mais recentes são indexados pelo ref testado, e cada `index.md` registra o ref/SHA testado, ref/SHA do workflow, ref do Kova, perfil, modo de autenticação do lane, modelo, contagem de repetições e filtros de cenário.

O workflow instala o OCM a partir de uma release fixada e o Kova a partir de `openclaw/Kova` na entrada fixada `kova_ref`, depois executa três lanes:

- `mock-provider`: cenários diagnósticos do Kova contra um runtime de build local com autenticação falsa determinística compatível com OpenAI.
- `mock-deep-profile`: profiling de CPU/heap/trace para hotspots de inicialização, Gateway e turno de agente.
- `live-gpt54`: um turno real de agente OpenAI `openai/gpt-5.4`, ignorado quando `OPENAI_API_KEY` não está disponível.

O lane mock-provider também executa sondagens de origem nativas do OpenClaw após a passagem do Kova: tempo de boot e memória do Gateway em casos de inicialização padrão, com hook e com 50 plugins; loops repetidos de hello `channel-chat-baseline` com mock-OpenAI; e comandos de inicialização da CLI contra o Gateway inicializado. O resumo Markdown da sondagem de origem fica em `source/index.md` no pacote do relatório, com JSON bruto ao lado.

Cada lane envia artefatos do GitHub. Quando `CLAWGRIT_REPORTS_TOKEN` está configurado, o workflow também faz commit de `report.json`, `report.md`, pacotes, `index.md` e artefatos de sondagem de origem em `openclaw/clawgrit-reports` sob `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. O ponteiro atual do ref testado é escrito como `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Full Release Validation

`Full Release Validation` é o workflow guarda-chuva manual para "executar tudo antes da release". Ele aceita uma branch, tag ou SHA de commit completo, despacha o workflow manual `CI` com esse alvo, despacha `Plugin Prerelease` para prova exclusiva de release de plugin/pacote/estática/Docker e despacha `OpenClaw Release Checks` para install smoke, aceitação de pacote, verificações de pacote entre sistemas operacionais, paridade do QA Lab, Matrix e lanes do Telegram. Execuções estáveis/padrão mantêm cobertura exaustiva live/E2E e de caminho de release Docker atrás de `run_release_soak=true`; `release_profile=full` força essa cobertura de soak para que validações amplas de advisory continuem amplas. Com `rerun_group=all` e `release_profile=full`, ele também executa `NPM Telegram Beta E2E` contra o artefato `release-package-under-test` das verificações de release. Após publicar, passe `npm_telegram_package_spec` para reexecutar o mesmo lane de pacote Telegram contra o pacote npm publicado.

Consulte [Validação completa de release](/pt-BR/reference/full-release-validation) para a
matriz de estágios, nomes exatos dos jobs de workflow, diferenças de perfil, artefatos e
identificadores de reexecução focada.

`OpenClaw Release Publish` é o workflow manual mutável de release. Despache-o
a partir de `release/YYYY.M.D` ou `main` depois que a tag de release existir e depois que o
preflight npm do OpenClaw tiver sido bem-sucedido. Ele verifica `pnpm plugins:sync:check`,
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

Para prova de commit fixado em uma branch que muda rapidamente, use o helper em vez de
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Refs de despacho de workflow do GitHub devem ser branches ou tags, não SHAs de commit brutos. O
helper envia uma branch temporária `release-ci/<sha>-...` no SHA de destino,
despacha `Full Release Validation` a partir desse ref fixado, verifica se cada `headSha`
de workflow filho corresponde ao alvo e exclui a branch temporária quando a
execução termina. O verificador guarda-chuva também falha se qualquer workflow filho for executado em um
SHA diferente.

`release_profile` controla a amplitude live/provedor passada para as verificações de lançamento. Os fluxos de trabalho manuais de lançamento usam `stable` por padrão; use `full` apenas quando você intencionalmente quiser a ampla matriz consultiva de provedores/mídia. `run_release_soak` controla se as verificações de lançamento estáveis/padrão executam o soak exaustivo live/E2E e do caminho de lançamento do Docker; `full` força o soak.

- `minimum` mantém as lanes críticas de lançamento mais rápidas de OpenAI/core.
- `stable` adiciona o conjunto estável de provedores/backends.
- `full` executa a ampla matriz consultiva de provedores/mídia.

O guarda-chuva registra os ids das execuções filhas despachadas, e o job final `Verify full validation` verifica novamente as conclusões atuais das execuções filhas e acrescenta tabelas dos jobs mais lentos para cada execução filha. Se um fluxo de trabalho filho for reexecutado e ficar verde, reexecute apenas o job verificador pai para atualizar o resultado do guarda-chuva e o resumo de tempos.

Para recuperação, tanto `Full Release Validation` quanto `OpenClaw Release Checks` aceitam `rerun_group`. Use `all` para um candidato a lançamento, `ci` somente para o filho normal de CI completo, `plugin-prerelease` somente para o filho de pré-lançamento de plugin, `release-checks` para todos os filhos de lançamento, ou um grupo mais estreito: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` no guarda-chuva. Isso mantém limitada a reexecução de uma caixa de lançamento com falha após uma correção focada. Para uma lane cross-OS com falha, combine `rerun_group=cross-os` com `cross_os_suite_filter`, por exemplo `windows/packaged-upgrade`; comandos cross-OS longos emitem linhas de heartbeat, e resumos packaged-upgrade incluem tempos por fase. Lanes de verificação de lançamento de QA são consultivas, então falhas somente de QA avisam, mas não bloqueiam o verificador de release-check.

`OpenClaw Release Checks` usa a referência confiável do fluxo de trabalho para resolver a ref selecionada uma vez em um tarball `release-package-under-test`, depois passa esse artefato para verificações cross-OS e Package Acceptance, além do fluxo de trabalho Docker live/E2E do caminho de lançamento quando a cobertura de soak é executada. Isso mantém os bytes do pacote consistentes entre caixas de lançamento e evita reempacotar o mesmo candidato em vários jobs filhos.

Execuções duplicadas de `Full Release Validation` para `ref=main` e `rerun_group=all`
substituem o guarda-chuva mais antigo. O monitor pai cancela qualquer fluxo de trabalho filho que
já tenha despachado quando o pai é cancelado, então a validação mais nova de main
não fica atrás de uma execução obsoleta de duas horas de release-check. Validações de branch/tag
de lançamento e grupos de reexecução focada mantêm `cancel-in-progress: false`.

## Fragmentos live e E2E

O filho live/E2E de lançamento mantém ampla cobertura nativa de `pnpm test:live`, mas a executa como fragmentos nomeados por meio de `scripts/test-live-shard.mjs` em vez de um job serial:

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
- fragmentos separados de mídia de áudio/vídeo e fragmentos de música filtrados por provedor

Isso mantém a mesma cobertura de arquivos e torna falhas lentas de provedores live mais fáceis de reexecutar e diagnosticar. Os nomes agregados de fragmentos `native-live-extensions-o-z`, `native-live-extensions-media` e `native-live-extensions-media-music` continuam válidos para reexecuções manuais únicas.

Os fragmentos nativos de mídia live são executados em `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, criado pelo fluxo de trabalho `Live Media Runner Image`. Essa imagem pré-instala `ffmpeg` e `ffprobe`; jobs de mídia apenas verificam os binários antes da configuração. Mantenha suítes live baseadas em Docker em runners normais da Blacksmith — jobs em contêiner são o lugar errado para iniciar testes Docker aninhados.

Fragmentos live de modelo/backend baseados em Docker usam uma imagem compartilhada separada `ghcr.io/openclaw/openclaw-live-test:<sha>` por commit selecionado. O fluxo de trabalho live de lançamento cria e envia essa imagem uma vez, depois os fragmentos de modelo live Docker, Gateway dividido por provedor, backend de CLI, vínculo ACP e harness Codex executam com `OPENCLAW_SKIP_DOCKER_BUILD=1`. Fragmentos Docker de Gateway carregam limites explícitos de `timeout` no nível do script abaixo do timeout do job do fluxo de trabalho para que um contêiner travado ou caminho de limpeza falhe rápido em vez de consumir todo o orçamento de release-check. Se esses fragmentos reconstruírem independentemente o alvo Docker completo do código-fonte, a execução de lançamento está configurada incorretamente e desperdiçará tempo de relógio em builds duplicados de imagem.

## Package Acceptance

Use `Package Acceptance` quando a pergunta for “este pacote instalável do OpenClaw funciona como produto?”. Ele é diferente do CI normal: o CI normal valida a árvore de código-fonte, enquanto o package acceptance valida um único tarball pelo mesmo harness Docker E2E que usuários exercitam após instalar ou atualizar.

### Jobs

1. `resolve_package` faz checkout de `workflow_ref`, resolve um candidato de pacote, escreve `.artifacts/docker-e2e-package/openclaw-current.tgz`, escreve `.artifacts/docker-e2e-package/package-candidate.json`, envia ambos como o artefato `package-under-test` e imprime a fonte, a ref do fluxo de trabalho, a ref do pacote, a versão, o SHA-256 e o perfil no resumo de etapa do GitHub.
2. `docker_acceptance` chama `openclaw-live-and-e2e-checks-reusable.yml` com `ref=workflow_ref` e `package_artifact_name=package-under-test`. O fluxo de trabalho reutilizável baixa esse artefato, valida o inventário do tarball, prepara imagens Docker com digest do pacote quando necessário e executa as lanes Docker selecionadas contra esse pacote em vez de empacotar o checkout do fluxo de trabalho. Quando um perfil seleciona vários `docker_lanes` direcionados, o fluxo de trabalho reutilizável prepara o pacote e as imagens compartilhadas uma vez, depois distribui essas lanes como jobs Docker direcionados paralelos com artefatos únicos.
3. `package_telegram` opcionalmente chama `NPM Telegram Beta E2E`. Ele é executado quando `telegram_mode` não é `none` e instala o mesmo artefato `package-under-test` quando Package Acceptance resolveu um; um despacho autônomo do Telegram ainda pode instalar uma especificação npm publicada.
4. `summary` falha o fluxo de trabalho se a resolução do pacote, a aceitação Docker ou a lane opcional do Telegram falhar.

### Fontes de candidatos

- `source=npm` aceita apenas `openclaw@beta`, `openclaw@latest` ou uma versão exata de lançamento do OpenClaw, como `openclaw@2026.4.27-beta.2`. Use isto para aceitação de pré-lançamento/estável publicado.
- `source=ref` empacota uma branch, tag ou SHA completo de commit confiável de `package_ref`. O resolvedor busca branches/tags do OpenClaw, verifica se o commit selecionado é alcançável pelo histórico de branches do repositório ou por uma tag de lançamento, instala dependências em uma worktree destacada e o empacota com `scripts/package-openclaw-for-docker.mjs`.
- `source=url` baixa um `.tgz` HTTPS; `package_sha256` é obrigatório.
- `source=artifact` baixa um `.tgz` de `artifact_run_id` e `artifact_name`; `package_sha256` é opcional, mas deve ser fornecido para artefatos compartilhados externamente.

Mantenha `workflow_ref` e `package_ref` separados. `workflow_ref` é o código confiável do fluxo de trabalho/harness que executa o teste. `package_ref` é o commit de origem que é empacotado quando `source=ref`. Isso permite que o harness de teste atual valide commits de origem confiáveis mais antigos sem executar lógica antiga de fluxo de trabalho.

### Perfis de suíte

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` mais `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — blocos completos do caminho de lançamento Docker com OpenWebUI
- `custom` — `docker_lanes` exatos; obrigatório quando `suite_profile=custom`

O perfil `package` usa cobertura offline de plugins para que a validação de pacote publicado não dependa da disponibilidade live do ClawHub. A lane opcional do Telegram reutiliza o artefato `package-under-test` em `NPM Telegram Beta E2E`, mantendo o caminho de especificação npm publicada para despachos autônomos.

Para a política dedicada de testes de atualização e plugin, incluindo comandos locais,
lanes Docker, entradas de Package Acceptance, padrões de lançamento e triagem de falhas,
consulte [Testando atualizações e plugins](/pt-BR/help/testing-updates-plugins).

As verificações de lançamento chamam Package Acceptance com `source=artifact`, o artefato de pacote de lançamento preparado, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` e `telegram_mode=mock-openai`. Isso mantém a prova de migração de pacote, atualização, limpeza de dependência obsoleta de plugin, reparo de instalação de plugin configurado, plugin offline, atualização de plugin e Telegram no mesmo tarball de pacote resolvido. Defina `package_acceptance_package_spec` em Full Release Validation ou OpenClaw Release Checks para executar essa mesma matriz contra um pacote npm enviado em vez do artefato criado a partir do SHA. Verificações de lançamento cross-OS ainda cobrem onboarding, instalador e comportamento de plataforma específicos de SO; a validação de produto de pacote/atualização deve começar com Package Acceptance. A lane Docker `published-upgrade-survivor` valida uma linha de base de pacote publicado por execução no caminho de lançamento bloqueante. Em Package Acceptance, o tarball `package-under-test` resolvido é sempre o candidato, e `published_upgrade_survivor_baseline` seleciona a linha de base publicada alternativa, com padrão `openclaw@latest`; comandos de reexecução de lane com falha preservam essa linha de base. Full Release Validation com `run_release_soak=true` ou `release_profile=full` define `published_upgrade_survivor_baselines=all-since-2026.4.23` e `published_upgrade_survivor_scenarios=reported-issues` para expandir por todos os lançamentos npm estáveis de `2026.4.23` até `latest` e fixtures com formato de issues para configuração do Feishu, arquivos bootstrap/persona preservados, instalações configuradas de plugins OpenClaw, caminhos de log com til e raízes obsoletas de dependências legadas de plugins. O fluxo de trabalho separado `Update Migration` usa a lane Docker `update-migration` com `all-since-2026.4.23` e `plugin-deps-cleanup` quando a pergunta é limpeza exaustiva de atualização publicada, não a amplitude normal do Full Release CI. Execuções agregadas locais podem passar especificações exatas de pacote com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, manter uma única lane com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, como `openclaw@2026.4.15`, ou definir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para a matriz de cenários. A lane publicada configura a linha de base com uma receita incorporada de comando `openclaw config set`, registra etapas da receita em `summary.json` e sonda `/healthz`, `/readyz`, além do status RPC após o início do Gateway. As lanes fresh empacotada e de instalador do Windows também verificam se um pacote instalado consegue importar uma substituição de controle de navegador de um caminho absoluto bruto do Windows. O smoke cross-OS de turno de agente OpenAI usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` por padrão quando definido; caso contrário, `openai/gpt-5.4`, para que a prova de instalação e Gateway permaneça em um modelo de teste GPT-5 evitando padrões GPT-4.x.

### Janelas de compatibilidade legada

Package Acceptance tem janelas limitadas de compatibilidade legada para pacotes já publicados. Pacotes até `2026.4.25`, incluindo `2026.4.25-beta.*`, podem usar o caminho de compatibilidade:

- entradas privadas de QA conhecidas em `dist/postinstall-inventory.json` podem apontar para arquivos omitidos do tarball;
- `doctor-switch` pode pular o subcaso de persistência `gateway install --wrapper` quando o pacote não expõe essa flag;
- `update-channel-switch` pode remover `pnpm.patchedDependencies` ausentes do fixture git falso derivado do tarball e pode registrar `update.channel` persistido ausente;
- smokes de plugin podem ler locais legados de registro de instalação ou aceitar persistência ausente de registro de instalação do marketplace;
- `plugin-update` pode permitir migração de metadados de configuração enquanto ainda exige que o registro de instalação e o comportamento de não reinstalar permaneçam inalterados.

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

Ao depurar uma execução de aceitação de pacote com falha, comece pelo resumo `resolve_package` para confirmar a origem, a versão e o SHA-256 do pacote. Em seguida, inspecione a execução filha `docker_acceptance` e seus artefatos Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logs de lanes, tempos de fase e comandos de reexecução. Prefira reexecutar o perfil de pacote com falha ou as lanes Docker exatas em vez de reexecutar a validação completa de release.

## Smoke de instalação

O workflow separado `Install Smoke` reutiliza o mesmo script de escopo por meio de seu próprio job `preflight`. Ele divide a cobertura de smoke em `run_fast_install_smoke` e `run_full_install_smoke`.

- **Caminho rápido** é executado para pull requests que tocam superfícies Docker/pacote, alterações em pacote/manifesto de plugin incluído ou superfícies principais de plugin/canal/gateway/Plugin SDK que os jobs de smoke Docker exercitam. Alterações apenas em código-fonte de plugins incluídos, edições apenas de testes e edições apenas de documentação não reservam workers Docker. O caminho rápido compila a imagem do Dockerfile raiz uma vez, verifica a CLI, executa o smoke da CLI de exclusão de agents em workspace compartilhado, executa o e2e de gateway-network do contêiner, verifica um argumento de build de extensão incluída e executa o perfil Docker limitado de plugin incluído sob um timeout agregado de comando de 240 segundos (cada execução Docker de cenário é limitada separadamente).
- **Caminho completo** mantém a instalação de pacote QR e a cobertura Docker/de atualização do instalador para execuções noturnas agendadas, dispatches manuais, verificações de release por workflow-call e pull requests que realmente tocam superfícies de instalador/pacote/Docker. No modo completo, install-smoke prepara ou reutiliza uma imagem de smoke GHCR do Dockerfile raiz para o SHA de destino, depois executa instalação de pacote QR, smokes do Dockerfile raiz/gateway, smokes de instalador/atualização e o Docker E2E rápido de plugin incluído como jobs separados, para que o trabalho do instalador não espere atrás dos smokes da imagem raiz.

Pushes para `main` (incluindo commits de merge) não forçam o caminho completo; quando a lógica de escopo de alterações pediria cobertura completa em um push, o workflow mantém o smoke Docker rápido e deixa o smoke completo de instalação para a validação noturna ou de release.

O smoke lento do provedor de imagens com instalação global Bun é controlado separadamente por `run_bun_global_install_smoke`. Ele é executado na agenda noturna e a partir do workflow de verificações de release, e dispatches manuais de `Install Smoke` podem optar por incluí-lo, mas pull requests e pushes para `main` não. Testes Docker de QR e instalador mantêm seus próprios Dockerfiles focados em instalação.

## Docker E2E local

`pnpm test:docker:all` pré-compila uma imagem compartilhada de teste live, empacota o OpenClaw uma vez como um tarball npm e compila duas imagens compartilhadas de `scripts/e2e/Dockerfile`:

- um runner Node/Git básico para lanes de instalador/atualização/dependência de plugin;
- uma imagem funcional que instala o mesmo tarball em `/app` para lanes de funcionalidade normais.

As definições de lanes Docker ficam em `scripts/lib/docker-e2e-scenarios.mjs`, a lógica do planejador fica em `scripts/lib/docker-e2e-plan.mjs`, e o runner executa apenas o plano selecionado. O agendador seleciona a imagem por lane com `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, depois executa lanes com `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Ajustes

| Variável                               | Padrão | Finalidade                                                                                       |
| -------------------------------------- | ------ | ------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10     | Contagem de slots do pool principal para lanes normais.                                          |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10     | Contagem de slots do pool final sensível a provedores.                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9      | Limite de lanes live simultâneas para que os provedores não façam throttle.                      |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10     | Limite de lanes simultâneas de instalação npm.                                                    |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7      | Limite de lanes simultâneas com múltiplos serviços.                                               |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000   | Intervalo entre inícios de lanes para evitar tempestades de criação no daemon Docker; defina `0` para não escalonar. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Timeout de fallback por lane (120 minutos); lanes live/finais selecionadas usam limites mais rígidos. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset  | `1` imprime o plano do agendador sem executar lanes.                                             |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset  | Lista de lanes exatas separadas por vírgulas; pula o smoke de limpeza para que agents possam reproduzir uma lane com falha. |

Uma lane mais pesada do que seu limite efetivo ainda pode iniciar a partir de um pool vazio, depois roda sozinha até liberar capacidade. Os preflights agregados locais verificam o Docker, removem contêineres OpenClaw E2E obsoletos, emitem status de lanes ativas, persistem tempos de lanes para ordenação pelas mais longas primeiro e, por padrão, param de agendar novas lanes em pool após a primeira falha.

### Workflow live/E2E reutilizável

O workflow live/E2E reutilizável pergunta a `scripts/test-docker-all.mjs --plan-json` qual pacote, tipo de imagem, imagem live, lane e cobertura de credenciais são necessários. `scripts/docker-e2e.mjs` então converte esse plano em outputs e resumos do GitHub. Ele empacota o OpenClaw por meio de `scripts/package-openclaw-for-docker.mjs`, baixa um artefato de pacote da execução atual ou baixa um artefato de pacote de `package_artifact_run_id`; valida o inventário do tarball; compila e envia imagens Docker E2E GHCR básicas/funcionais marcadas pelo digest do pacote por meio do cache de camadas Docker da Blacksmith quando o plano precisa de lanes com pacote instalado; e reutiliza entradas `docker_e2e_bare_image`/`docker_e2e_functional_image` fornecidas ou imagens existentes por digest de pacote em vez de recompilar. Pulls de imagens Docker são repetidos com um timeout limitado de 180 segundos por tentativa, para que um stream preso de registry/cache tente novamente rapidamente em vez de consumir a maior parte do caminho crítico da CI.

### Chunks do caminho de release

A cobertura Docker de release executa jobs menores em chunks com `OPENCLAW_SKIP_DOCKER_BUILD=1`, para que cada chunk puxe apenas o tipo de imagem de que precisa e execute várias lanes pelo mesmo agendador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Os chunks Docker de release atuais são `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` e `plugins-runtime-install-a` até `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` permanecem aliases agregados de plugin/runtime. O alias de lane `install-e2e` permanece o alias agregado de reexecução manual para ambas as lanes de instalador de provedor.

OpenWebUI é incorporado a `plugins-runtime-services` quando a cobertura completa do caminho de release o solicita, e mantém um chunk autônomo `openwebui` apenas para dispatches somente de OpenWebUI. Lanes de atualização de canais incluídos tentam novamente uma vez em caso de falhas transitórias de rede npm.

Cada chunk envia `.artifacts/docker-tests/` com logs de lanes, tempos, `summary.json`, `failures.json`, tempos de fase, JSON do plano do agendador, tabelas de lanes lentas e comandos de reexecução por lane. A entrada `docker_lanes` do workflow executa lanes selecionadas contra as imagens preparadas em vez dos jobs de chunk, o que mantém a depuração de lanes com falha limitada a um job Docker direcionado e prepara, baixa ou reutiliza o artefato de pacote para essa execução; se uma lane selecionada for uma lane Docker live, o job direcionado compila a imagem de teste live localmente para essa reexecução. Comandos de reexecução do GitHub gerados por lane incluem `package_artifact_run_id`, `package_artifact_name` e entradas de imagens preparadas quando esses valores existem, para que uma lane com falha possa reutilizar o pacote e as imagens exatos da execução com falha.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

O workflow live/E2E agendado executa diariamente a suíte Docker completa do caminho de release.

## Pré-release de Plugin

`Plugin Prerelease` é uma cobertura de produto/pacote mais cara, portanto é um workflow separado disparado por `Full Release Validation` ou por um operador explícito. Pull requests normais, pushes para `main` e dispatches manuais autônomos de CI mantêm essa suíte desativada. Ele balanceia testes de plugins incluídos entre oito workers de extensão; esses jobs de shards de extensão executam até dois grupos de configuração de plugin por vez, com um worker Vitest por grupo e um heap Node maior, para que lotes de plugins pesados em imports não criem jobs extras de CI. O caminho Docker de pré-release somente para release agrupa lanes Docker direcionadas em pequenos grupos para evitar reservar dezenas de runners para jobs de um a três minutos.

## QA Lab

QA Lab tem lanes de CI dedicadas fora do workflow principal com escopo inteligente. A paridade agentic fica aninhada nos harnesses amplos de QA e release, não em um workflow autônomo de PR. Use `Full Release Validation` com `rerun_group=qa-parity` quando a paridade deve acompanhar uma execução ampla de validação.

- O workflow `QA-Lab - All Lanes` é executado todas as noites em `main` e em dispatch manual; ele distribui em leque a lane de paridade mock, a lane live Matrix e as lanes live Telegram e Discord como jobs paralelos. Jobs live usam o ambiente `qa-live-shared`, e Telegram/Discord usam leases Convex.

As verificações de release executam lanes de transporte live Matrix e Telegram com o provedor mock determinístico e modelos qualificados por mock (`mock-openai/gpt-5.5` e `mock-openai/gpt-5.5-alt`), para que o contrato de canal fique isolado da latência de modelo live e da inicialização normal de plugin de provedor. O gateway de transporte live desativa a busca de memória porque a paridade de QA cobre o comportamento de memória separadamente; a conectividade de provedores é coberta pelas suítes separadas de modelo live, provedor nativo e provedor Docker.

Matrix usa `--profile fast` para gates agendados e de release, adicionando `--fail-fast` apenas quando a CLI com checkout dá suporte a isso. O padrão da CLI e a entrada manual do workflow permanecem `all`; dispatch manual `matrix_profile=all` sempre fragmenta a cobertura Matrix completa em jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`.

`OpenClaw Release Checks` também executa as lanes críticas de release do QA Lab antes da aprovação de release; seu gate de paridade de QA executa os pacotes candidato e baseline como jobs de lane paralelos, depois baixa ambos os artefatos em um pequeno job de relatório para a comparação final de paridade.

Para PRs normais, siga evidências de CI/check com escopo em vez de tratar a paridade como um status obrigatório.

## CodeQL

O workflow `CodeQL` é intencionalmente um scanner de segurança inicial restrito, não uma varredura completa do repositório. Execuções diárias, manuais e de proteção de pull requests que não são rascunho escaneiam código de workflows do Actions e as superfícies JavaScript/TypeScript de maior risco com consultas de segurança de alta confiança filtradas para `security-severity` alta/crítica.

A proteção de pull request permanece leve: ela só inicia para alterações em `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` ou `src`, e executa a mesma matriz de segurança de alta confiança do workflow agendado. O CodeQL de Android e macOS fica fora dos padrões de PR.

### Categorias de segurança

| Categoria                                          | Superfície                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Linha de base de autenticação, segredos, sandbox, Cron e Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementação de canal do core mais o runtime de Plugin de canal, Gateway, Plugin SDK, segredos e pontos de contato de auditoria              |
| `/codeql-security-high/network-ssrf-boundary`     | Superfícies de SSRF do core, parsing de IP, proteção de rede, web-fetch e política de SSRF do Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, helpers de execução de processos, entrega de saída e gates de execução de ferramentas de agentes                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Superfícies de confiança de instalação de Plugin, loader, manifesto, registro, instalação por gerenciador de pacotes, carregamento de código-fonte e contrato de pacote do Plugin SDK |

### Shards de segurança específicos por plataforma

- `CodeQL Android Critical Security` — shard agendado de segurança do Android. Compila o app Android manualmente para o CodeQL no menor runner Blacksmith Linux aceito pela sanidade do workflow. Faz upload em `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard semanal/manual de segurança do macOS. Compila o app macOS manualmente para o CodeQL no Blacksmith macOS, filtra resultados de build de dependências do SARIF enviado e faz upload em `/codeql-critical-security/macos`. Mantido fora dos padrões diários porque o build do macOS domina o tempo de execução mesmo quando está limpo.

### Categorias de qualidade crítica

`CodeQL Critical Quality` é o shard não relacionado a segurança correspondente. Ele executa apenas consultas de qualidade JavaScript/TypeScript de severidade de erro e não relacionadas a segurança sobre superfícies restritas de alto valor no runner Blacksmith Linux menor. Sua proteção de pull request é intencionalmente menor que o perfil agendado: PRs que não são rascunho executam apenas os shards correspondentes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` e `plugin-sdk-reply-runtime` para alterações em código de execução de comando/modelo/ferramenta de agente e despacho de resposta, código de schema/migração/IO de config, código de autenticação/segredos/sandbox/segurança, runtime de canal do core e Plugin de canal incluído, protocolo/método de servidor do Gateway, runtime de memória/cola do SDK, MCP/processo/entrega de saída, catálogo de runtime/modelo de provedor, diagnósticos de sessão/filas de entrega, loader de Plugin, contrato de Plugin SDK/pacote ou runtime de resposta do Plugin SDK. Alterações de configuração do CodeQL e workflow de qualidade executam todos os doze shards de qualidade de PR.

O despacho manual aceita:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Os perfis restritos são ganchos de ensino/iteração para executar um shard de qualidade isoladamente.

| Categoria                                                | Superfície                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Código de fronteira de segurança de autenticação, segredos, sandbox, Cron e Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Schema de configuração, migração, normalização e contratos de IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schemas de protocolo do Gateway e contratos de método de servidor                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementação de canal do core e Plugin de canal incluído                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Execução de comandos, despacho de modelo/provedor, despacho e filas de resposta automática, e contratos de runtime do plano de controle ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP e bridges de ferramentas, helpers de supervisão de processos e contratos de entrega de saída                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK do host de memória, facades de runtime de memória, aliases de Plugin SDK de memória, cola de ativação de runtime de memória e comandos doctor de memória                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internos da fila de respostas, filas de entrega de sessão, helpers de vinculação/entrega de sessão de saída, superfícies de eventos diagnósticos/pacote de logs e contratos de CLI de doctor de sessão |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de respostas de entrada do Plugin SDK, helpers de payload/fragmentação/runtime de resposta, opções de resposta de canal, filas de entrega e helpers de vinculação de sessão/thread             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalização de catálogo de modelos, autenticação e descoberta de provedores, registro de runtime de provedor, padrões/catálogos de provedor e registros de web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap da UI de controle, persistência local, fluxos de controle do Gateway e contratos de runtime do plano de controle de tarefas                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Fetch/search web do core, IO de mídia, entendimento de mídia, geração de imagens e contratos de runtime de geração de mídia                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Contratos de loader, registro, superfície pública e ponto de entrada do Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Código-fonte do Plugin SDK do lado do pacote publicado e helpers de contrato de pacote de Plugin                                                                                      |

A qualidade fica separada da segurança para que achados de qualidade possam ser agendados, medidos, desabilitados ou expandidos sem obscurecer o sinal de segurança. A expansão do CodeQL para Swift, Python e Plugins incluídos deve ser adicionada novamente como trabalho de acompanhamento escopado ou fragmentado apenas depois que os perfis restritos tiverem tempo de execução e sinal estáveis.

## Workflows de manutenção

### Docs Agent

O workflow `Docs Agent` é uma faixa de manutenção Codex orientada a eventos para manter a documentação existente alinhada com alterações aterrissadas recentemente. Ele não tem agendamento puro: uma execução de CI bem-sucedida de push não bot em `main` pode acioná-lo, e o despacho manual pode executá-lo diretamente. Invocações por workflow-run são ignoradas quando `main` já avançou ou quando outra execução não ignorada do Docs Agent foi criada na última hora. Quando executado, ele revisa o intervalo de commits do SHA de origem anterior não ignorado do Docs Agent até o `main` atual, então uma execução horária pode cobrir todas as alterações em main acumuladas desde a última passada de documentação.

### Test Performance Agent

O workflow `Test Performance Agent` é uma faixa de manutenção Codex orientada a eventos para testes lentos. Ele não tem agendamento puro: uma execução de CI bem-sucedida de push não bot em `main` pode acioná-lo, mas ele ignora se outra invocação por workflow-run já executou ou está executando naquele dia UTC. O despacho manual contorna esse gate de atividade diária. A faixa gera um relatório agrupado de performance do Vitest para a suíte completa, permite que o Codex faça apenas pequenas correções de performance de testes que preservem cobertura em vez de refatorações amplas, depois reexecuta o relatório da suíte completa e rejeita alterações que reduzam a contagem de testes aprovados da linha de base. Se a linha de base tiver testes falhando, o Codex pode corrigir apenas falhas óbvias e o relatório da suíte completa após o agente deve passar antes que qualquer coisa seja commitada. Quando `main` avança antes do push do bot aterrissar, a faixa faz rebase do patch validado, reexecuta `pnpm check:changed` e tenta o push novamente; patches obsoletos com conflito são ignorados. Ela usa Ubuntu hospedado pelo GitHub para que a ação Codex possa manter a mesma postura de segurança sem sudo do agente de documentação.

### PRs duplicados após merge

O workflow `Duplicate PRs After Merge` é um workflow manual de mantenedor para limpeza de duplicatas pós-aterrissagem. Ele usa dry-run por padrão e só fecha PRs listados explicitamente quando `apply=true`. Antes de alterar o GitHub, ele verifica se o PR aterrissado foi mesclado e se cada duplicata tem uma issue referenciada compartilhada ou hunks alterados sobrepostos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gates de verificação local e roteamento de alterações

A lógica local de changed-lane vive em `scripts/changed-lanes.mjs` e é executada por `scripts/check-changed.mjs`. Esse gate de verificação local é mais rigoroso sobre fronteiras de arquitetura do que o escopo amplo da plataforma de CI:

- alterações de produção do core executam typecheck de core prod e core test mais lint/guards do core;
- alterações apenas de teste do core executam apenas typecheck de core test mais lint do core;
- alterações de produção de extensão executam typecheck de extension prod e extension test mais lint de extension;
- alterações apenas de teste de extensão executam typecheck de extension test mais lint de extension;
- alterações públicas do Plugin SDK ou contrato de Plugin expandem para typecheck de extension porque extensões dependem desses contratos do core (varreduras de extensão do Vitest continuam sendo trabalho de teste explícito);
- aumentos de versão apenas de metadados de release executam verificações direcionadas de versão/config/dependência raiz;
- alterações desconhecidas em root/config falham com segurança para todas as faixas de verificação.

O roteamento local de changed-test vive em `scripts/test-projects.test-support.mjs` e é intencionalmente mais barato que `check:changed`: edições diretas de teste executam os próprios testes, edições de código-fonte preferem mapeamentos explícitos, depois testes irmãos e dependentes do grafo de imports. A configuração de entrega de sala de grupo compartilhada é um dos mapeamentos explícitos: alterações na configuração de resposta visível de grupo, no modo de entrega de resposta de origem ou no prompt de sistema da ferramenta de mensagens passam pelos testes de resposta do core mais regressões de entrega do Discord e Slack para que uma alteração de padrão compartilhado falhe antes do primeiro push do PR. Use `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` apenas quando a alteração for ampla o suficiente no harness para que o conjunto mapeado barato não seja um proxy confiável.

## Validação Testbox

Execute o Testbox a partir da raiz do repositório e prefira uma máquina recém-aquecida para comprovação ampla. Antes de gastar um gate lento em uma máquina que foi reutilizada, expirou ou acabou de relatar uma sincronização inesperadamente grande, execute `pnpm testbox:sanity` dentro da máquina primeiro.

A verificação de sanidade falha rapidamente quando arquivos obrigatórios da raiz, como `pnpm-lock.yaml`, desapareceram ou quando `git status --short` mostra pelo menos 200 exclusões rastreadas. Isso geralmente significa que o estado de sincronização remoto não é uma cópia confiável do PR; pare essa máquina e aqueça uma nova em vez de depurar a falha do teste do produto. Para PRs intencionais com grandes exclusões, defina `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para essa execução de sanidade.

`pnpm testbox:run` também encerra uma invocação local da CLI do Blacksmith que permanece na fase de sincronização por mais de cinco minutos sem saída pós-sincronização. Defina `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` para desabilitar essa proteção ou use um valor maior em milissegundos para diffs locais incomumente grandes.

Crabbox é o wrapper de máquina remota pertencente ao repositório para comprovação Linux de mantenedores. Use-o quando uma verificação for ampla demais para um ciclo local de edição, quando a paridade com CI importar ou quando a comprovação precisar de segredos, Docker, lanes de pacote, máquinas reutilizáveis ou logs remotos. O backend normal do OpenClaw é `blacksmith-testbox`; capacidade própria em AWS/Hetzner é um fallback para indisponibilidades do Blacksmith, problemas de cota ou testes explícitos de capacidade própria.

Antes de uma primeira execução, verifique o wrapper a partir da raiz do repositório:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

O wrapper do repositório recusa um binário obsoleto do Crabbox que não anuncia `blacksmith-testbox`. Passe o provedor explicitamente, mesmo que `.crabbox.yaml` tenha padrões de nuvem própria.

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

Leia o resumo JSON final. Os campos úteis são `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` e `totalMs`. Execuções únicas do Crabbox com suporte do Blacksmith devem parar o Testbox automaticamente; se uma execução for interrompida ou a limpeza não estiver clara, inspecione as máquinas ativas e pare apenas as máquinas que você criou:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

Use reutilização somente quando precisar intencionalmente de vários comandos na mesma máquina hidratada:

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

Escale para capacidade própria do Crabbox somente quando o Blacksmith estiver fora do ar, limitado por cota, sem o ambiente necessário ou quando a capacidade própria for explicitamente o objetivo:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` controla os padrões de provedor, sincronização e hidratação do GitHub Actions para lanes de nuvem própria. Ele exclui o `.git` local para que o checkout hidratado do Actions mantenha seus próprios metadados remotos do Git em vez de sincronizar remotos e armazenamentos de objetos locais do mantenedor, e exclui artefatos locais de runtime/build que nunca devem ser transferidos. `.github/workflows/crabbox-hydrate.yml` controla checkout, configuração de Node/pnpm, busca de `origin/main` e repasse de ambiente não secreto para comandos `crabbox run --id <cbx_id>` em nuvem própria.

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Canais de desenvolvimento](/pt-BR/install/development-channels)
