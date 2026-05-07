---
read_when:
    - Você precisa entender por que um job de CI foi ou não executado
    - Você está depurando uma verificação do GitHub Actions com falha
    - Você está coordenando uma execução ou reexecução de validação de lançamento
    - Você está alterando o despacho do ClawSweeper ou o encaminhamento de atividades do GitHub
summary: Grafo de jobs de CI, gates de escopo, guarda-chuvas de release e equivalentes de comandos locais
title: Pipeline de CI
x-i18n:
    generated_at: "2026-05-07T01:51:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 284b83d7baf451a3e6bb557832f53513d7191f0b6d7c34fc4f7483a0851676cd
    source_path: ci.md
    workflow: 16
---

A CI do OpenClaw é executada em cada push para `main` e em cada pull request. O job `preflight` classifica o diff e desativa lanes caras quando apenas áreas não relacionadas mudaram. Execuções manuais de `workflow_dispatch` ignoram intencionalmente o escopo inteligente e expandem o grafo completo para release candidates e validação ampla. As lanes de Android continuam opt-in via `include_android`. A cobertura de Plugin exclusiva de release fica no fluxo de trabalho separado [`Plugin de pré-lançamento`](#plugin-prerelease) e só é executada a partir de [`Validação completa de release`](#full-release-validation) ou de um disparo manual explícito.

## Visão geral do pipeline

| Job                              | Finalidade                                                                                                | Quando é executado                 |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Detecta mudanças apenas em docs, escopos alterados, extensões alteradas e cria o manifesto de CI          | Sempre em pushes e PRs não rascunho |
| `security-scm-fast`              | Detecção de chave privada e auditoria de workflow via `zizmor`                                            | Sempre em pushes e PRs não rascunho |
| `security-dependency-audit`      | Auditoria do lockfile de produção sem dependências contra avisos do npm                                   | Sempre em pushes e PRs não rascunho |
| `security-fast`                  | Agregado obrigatório para os jobs rápidos de segurança                                                    | Sempre em pushes e PRs não rascunho |
| `check-dependencies`             | Passagem de dependências de produção do Knip, apenas dependências, mais guarda da allowlist de arquivos não usados | Mudanças relevantes para Node |
| `build-artifacts`                | Cria `dist/`, Control UI, verificações de artefatos gerados e artefatos downstream reutilizáveis          | Mudanças relevantes para Node      |
| `checks-fast-core`               | Lanes rápidas de correção no Linux, como verificações de bundled/plugin-contract/protocol                 | Mudanças relevantes para Node      |
| `checks-fast-contracts-channels` | Verificações fragmentadas de contrato de canal com resultado de verificação agregado estável              | Mudanças relevantes para Node      |
| `checks-node-core-test`          | Shards de testes do núcleo Node, excluindo lanes de canal, bundled, contrato e extensão                   | Mudanças relevantes para Node      |
| `check`                          | Equivalente ao gate local principal fragmentado: tipos de prod, lint, guards, tipos de teste e smoke estrito | Mudanças relevantes para Node   |
| `check-additional`               | Arquitetura, drift fragmentado de boundary/prompt, guards de extensão, boundary de pacote e gateway watch | Mudanças relevantes para Node      |
| `build-smoke`                    | Testes smoke da CLI compilada e smoke de memória de inicialização                                         | Mudanças relevantes para Node      |
| `checks`                         | Verificador para testes de canal de artefato compilado                                                    | Mudanças relevantes para Node      |
| `checks-node-compat-node22`      | Lane de build e smoke de compatibilidade com Node 22                                                      | Disparo manual de CI para releases |
| `check-docs`                     | Formatação, lint e verificações de links quebrados da documentação                                        | Docs alterados                     |
| `skills-python`                  | Ruff + pytest para skills apoiadas por Python                                                             | Mudanças relevantes para skills Python |
| `checks-windows`                 | Testes específicos de processo/caminho no Windows mais regressões compartilhadas de especificador de importação em runtime | Mudanças relevantes para Windows |
| `macos-node`                     | Lane de testes TypeScript no macOS usando os artefatos compilados compartilhados                          | Mudanças relevantes para macOS     |
| `macos-swift`                    | Lint, build e testes Swift para o app macOS                                                               | Mudanças relevantes para macOS     |
| `android`                        | Testes unitários Android para ambos os flavors mais um build de APK de debug                              | Mudanças relevantes para Android   |
| `test-performance-agent`         | Otimização diária de testes lentos do Codex após atividade confiável                                      | Sucesso da CI principal ou disparo manual |
| `openclaw-performance`           | Relatórios diários/sob demanda de desempenho do runtime Kova com lanes mock-provider, deep-profile e GPT 5.4 live | Disparo agendado e manual |

## Ordem de fail-fast

1. `preflight` decide quais lanes existem. A lógica de `docs-scope` e `changed-scope` são etapas dentro desse job, não jobs independentes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falham rapidamente sem esperar pelos jobs mais pesados de artefatos e matriz de plataformas.
3. `build-artifacts` se sobrepõe às lanes rápidas de Linux para que consumidores downstream possam começar assim que o build compartilhado estiver pronto.
4. Lanes mais pesadas de plataforma e runtime se expandem depois disso: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

O GitHub pode marcar jobs substituídos como `cancelled` quando um push mais novo chega ao mesmo PR ou ref `main`. Trate isso como ruído de CI, a menos que a execução mais nova para a mesma ref também esteja falhando. Verificações agregadas de shard usam `!cancelled() && always()` para que ainda relatem falhas normais de shard, mas não entrem na fila depois que o workflow inteiro já foi substituído. A chave automática de concorrência da CI é versionada (`CI-v7-*`), então um zumbi do lado do GitHub em um grupo de fila antigo não consegue bloquear indefinidamente execuções mais novas da main. Execuções manuais da suíte completa usam `CI-manual-v1-*` e não cancelam execuções em andamento.

O job `ci-timings-summary` envia um artefato compacto `ci-timings-summary` para cada execução de CI não rascunho. Ele registra tempo de parede, tempo de fila, jobs mais lentos e jobs com falha da execução atual, para que verificações de saúde da CI não precisem raspar repetidamente o payload completo do Actions.

## Escopo e roteamento

A lógica de escopo fica em `scripts/ci-changed-scope.mjs` e é coberta por testes unitários em `src/scripts/ci-changed-scope.test.ts`. O disparo manual pula a detecção de escopo alterado e faz o manifesto de preflight agir como se todas as áreas com escopo tivessem mudado.

- **Edições no workflow de CI** validam o grafo de CI Node mais o linting de workflow, mas não forçam builds nativos de Windows, Android ou macOS por si só; essas lanes de plataforma continuam restritas a mudanças de código-fonte da plataforma.
- **Edições apenas de roteamento de CI, edições selecionadas e baratas em fixtures de teste do núcleo e edições estreitas em helpers/roteamento de teste de contrato de Plugin** usam um caminho rápido de manifesto somente Node: `preflight`, segurança e uma única tarefa `checks-fast-core`. Esse caminho pula artefatos de build, compatibilidade com Node 22, contratos de canal, shards completos do núcleo, shards de plugins bundled e matrizes adicionais de guards quando a mudança se limita às superfícies de roteamento ou helper que a tarefa rápida exercita diretamente.
- **Verificações Node no Windows** são restritas a wrappers específicos de processo/caminho do Windows, helpers de runner npm/pnpm/UI, configuração de gerenciador de pacotes e superfícies do workflow de CI que executam essa lane; mudanças não relacionadas de código-fonte, Plugin, install-smoke e apenas testes permanecem nas lanes Node do Linux.

As famílias mais lentas de testes Node são divididas ou balanceadas para que cada job permaneça pequeno sem reservar runners em excesso: contratos de canal rodam como três shards ponderados, lanes rápidas/de suporte de unidade do núcleo rodam separadamente, a infraestrutura de runtime do núcleo é dividida entre shards de estado, processo/configuração, Cron e compartilhados, auto-reply roda como workers balanceados (com a subárvore de reply dividida em shards de agent-runner, dispatch e commands/state-routing), e configurações agentic de gateway/server são divididas entre lanes chat/auth/model/http-plugin/runtime/startup em vez de esperar por artefatos compilados. Testes amplos de browser, QA, mídia e Plugins diversos usam suas configs Vitest dedicadas em vez do catch-all compartilhado de Plugins. Shards com include-pattern registram entradas de timing usando o nome do shard da CI, para que `.artifacts/vitest-shard-timings.json` consiga distinguir uma config inteira de um shard filtrado. `check-additional` mantém juntos o trabalho de compilação/canary de package-boundary e separa a arquitetura de topologia de runtime da cobertura de gateway watch; a lista de guards de boundary é distribuída em quatro shards de matriz, cada um executando guards independentes selecionados em paralelo e imprimindo timings por verificação. A verificação cara de drift de snapshot de prompt do caminho feliz do Codex roda para CI manual e apenas para mudanças que afetam prompts, então mudanças normais não relacionadas de Node não esperam atrás da geração fria de snapshot de prompt enquanto o drift de prompt ainda fica preso ao PR que o causou; a mesma flag pula a geração de Vitest de snapshot de prompt dentro do shard compilado de core support-boundary. Gateway watch, testes de canal e o shard de core support-boundary rodam concorrentemente dentro de `build-artifacts` depois que `dist/` e `dist-runtime/` já foram compilados.

A CI Android executa tanto `testPlayDebugUnitTest` quanto `testThirdPartyDebugUnitTest` e depois cria o APK Play de debug. O flavor de terceiros não tem source set nem manifesto separados; sua lane de teste unitário ainda compila o flavor com as flags BuildConfig de SMS/call-log, enquanto evita um job duplicado de empacotamento de APK de debug a cada push relevante para Android.

O shard `check-dependencies` executa `pnpm deadcode:dependencies` (uma passagem Knip de produção apenas para dependências, fixada na versão mais recente do Knip, com a idade mínima de release do pnpm desativada para a instalação `dlx`) e `pnpm deadcode:unused-files`, que compara as descobertas de arquivos de produção não usados do Knip contra `scripts/deadcode-unused-files.allowlist.mjs`. O guard de arquivos não usados falha quando um PR adiciona um novo arquivo não usado e não revisado ou deixa uma entrada obsoleta na allowlist, preservando superfícies intencionais de Plugin dinâmico, geradas, de build, de live-test e pontes de pacote que o Knip não consegue resolver estaticamente.

## Encaminhamento de atividade do ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` é a ponte do lado de destino da atividade do repositório OpenClaw para o ClawSweeper. Ele não faz checkout nem executa código de pull request não confiável. O workflow cria um token de GitHub App a partir de `CLAWSWEEPER_APP_PRIVATE_KEY` e então dispara payloads compactos de `repository_dispatch` para `openclaw/clawsweeper`.

O workflow tem quatro lanes:

- `clawsweeper_item` para solicitações exatas de revisão de issue e pull request;
- `clawsweeper_comment` para comandos explícitos do ClawSweeper em comentários de issue;
- `clawsweeper_commit_review` para solicitações de revisão em nível de commit em pushes para `main`;
- `github_activity` para atividade geral do GitHub que o agente ClawSweeper pode inspecionar.

A lane `github_activity` encaminha apenas metadados normalizados: tipo de evento, ação, ator, repositório, número do item, URL, título, estado e trechos curtos de comentários ou revisões quando presentes. Ela evita intencionalmente encaminhar o corpo completo do Webhook. O workflow receptor em `openclaw/clawsweeper` é `.github/workflows/github-activity.yml`, que publica o evento normalizado no hook do OpenClaw Gateway para o agente ClawSweeper.

Atividade geral é observação, não entrega por padrão. O agente ClawSweeper recebe o destino do Discord em seu prompt e deve postar em `#clawsweeper` apenas quando o evento for surpreendente, acionável, arriscado ou operacionalmente útil. Aberturas rotineiras, edições, ruído de bot, ruído de Webhook duplicado e tráfego normal de revisão devem resultar em `NO_REPLY`.

Trate títulos, comentários, corpos, textos de revisão, nomes de branches e mensagens de commit do GitHub como dados não confiáveis em todo este caminho. Eles são entrada para resumo e triagem, não instruções para o fluxo de trabalho ou o runtime do agente.

## Disparos manuais

Disparos manuais de CI executam o mesmo grafo de tarefas da CI normal, mas forçam todas as lanes com escopo não Android: shards de Linux Node, shards de Plugins empacotados, contratos de canais, compatibilidade com Node 22, `check`, `check-additional`, smoke de build, verificações de docs, Python skills, Windows, macOS e i18n da Control UI. Disparos manuais autônomos de CI executam somente Android com `include_android=true`; o guarda-chuva de release completa habilita Android passando `include_android=true`. Verificações estáticas de pré-release de Plugins, o shard somente de release `agentic-plugins`, a varredura completa em lote de extensões e as lanes Docker de pré-release de Plugins são excluídas da CI. A suíte Docker de pré-release executa somente quando `Full Release Validation` dispara o fluxo de trabalho `Plugin Prerelease` separado com o gate de validação de release habilitado.

Execuções manuais usam um grupo de concorrência único para que uma suíte completa de candidata a release não seja cancelada por outro push ou execução de PR na mesma ref. A entrada opcional `target_ref` permite que um chamador confiável execute esse grafo contra uma branch, tag ou SHA de commit completo usando o arquivo de fluxo de trabalho da ref de disparo selecionada.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Executores

| Executor                         | Tarefas                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, tarefas rápidas de segurança e agregados (`security-scm-fast`, `security-dependency-audit`, `security-fast`), verificações rápidas de protocolo/contrato/empacotadas, verificações fragmentadas de contrato de canal, shards de `check` exceto lint, agregados de `check-additional`, verificadores agregados de testes Node, verificações de docs, Python skills, workflow-sanity, labeler, auto-response; o preflight de install-smoke também usa Ubuntu hospedado pelo GitHub para que a matriz Blacksmith possa entrar na fila mais cedo |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shards de extensões de menor peso, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` e `check-test-types`                                                                                                                                                                                                                                                                                                       |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shards de testes Linux Node, shards de testes de Plugins empacotados, shards de `check-additional`, `android`                                                                                                                                                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (sensível a CPU o suficiente para que 8 vCPU custassem mais do que economizavam); builds Docker de install-smoke (o tempo de fila de 32 vCPU custou mais do que economizou)                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` em `openclaw/openclaw`; forks recorrem a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` em `openclaw/openclaw`; forks recorrem a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                        |

A CI do repositório canônico mantém Blacksmith como o caminho padrão de executor. Durante `preflight`, `scripts/ci-runner-labels.mjs` verifica execuções recentes de Actions em fila e em andamento em busca de tarefas Blacksmith em fila. Se uma etiqueta Blacksmith específica já tiver tarefas em fila, as tarefas posteriores que usariam essa etiqueta exata recorrem ao executor hospedado pelo GitHub correspondente (`ubuntu-24.04`, `windows-2025` ou `macos-latest`) somente para essa execução. Outros tamanhos Blacksmith na mesma família de SO permanecem nas etiquetas primárias. Se a sondagem da API falhar, nenhum fallback é aplicado.

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

`OpenClaw Performance` é o fluxo de trabalho de desempenho do produto/runtime. Ele executa diariamente em `main` e pode ser disparado manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

O disparo manual normalmente mede o benchmark da ref do fluxo de trabalho. Defina `target_ref` para medir o benchmark de uma tag de release ou outra branch com a implementação atual do fluxo de trabalho. Caminhos de relatórios publicados e ponteiros mais recentes são indexados pela ref testada, e cada `index.md` registra a ref/SHA testada, a ref/SHA do fluxo de trabalho, a ref do Kova, o perfil, o modo de autenticação da lane, o modelo, a contagem de repetições e os filtros de cenário.

O fluxo de trabalho instala OCM de uma release fixada e Kova de `openclaw/Kova` na entrada `kova_ref` fixada, e então executa três lanes:

- `mock-provider`: cenários diagnósticos do Kova contra um runtime de build local com autenticação falsa determinística compatível com OpenAI.
- `mock-deep-profile`: criação de perfil de CPU/heap/trace para pontos críticos de inicialização, Gateway e turnos de agente.
- `live-gpt54`: um turno real de agente OpenAI `openai/gpt-5.4`, ignorado quando `OPENAI_API_KEY` está indisponível.

A lane mock-provider também executa sondagens de origem nativas do OpenClaw após a passagem do Kova: tempo de boot e memória do Gateway nos casos de inicialização padrão, hook e 50 Plugins; loops repetidos de hello `channel-chat-baseline` com mock-OpenAI; e comandos de inicialização da CLI contra o Gateway inicializado. O resumo Markdown da sondagem de origem fica em `source/index.md` no pacote de relatório, com JSON bruto ao lado.

Cada lane envia artefatos do GitHub. Quando `CLAWGRIT_REPORTS_TOKEN` está configurado, o fluxo de trabalho também commita `report.json`, `report.md`, pacotes, `index.md` e artefatos de sondagem de origem em `openclaw/clawgrit-reports` sob `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. O ponteiro atual da ref testada é escrito como `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validação Completa de Release

`Full Release Validation` é o fluxo de trabalho manual guarda-chuva para "executar tudo antes da release." Ele aceita uma branch, tag ou SHA de commit completo, dispara o fluxo de trabalho manual `CI` com esse alvo, dispara `Plugin Prerelease` para prova de Plugins/pacotes/estática/Docker somente de release e dispara `OpenClaw Release Checks` para smoke de instalação, aceitação de pacote, verificações de pacote entre sistemas operacionais, paridade do QA Lab, Matrix e lanes do Telegram. Execuções estáveis/padrão mantêm cobertura exaustiva live/E2E e do caminho de release Docker atrás de `run_release_soak=true`; `release_profile=full` força essa cobertura soak, para que a validação ampla de avisos continue ampla. Com `rerun_group=all` e `release_profile=full`, ele também executa `NPM Telegram Beta E2E` contra o artefato `release-package-under-test` das verificações de release. Após publicar, passe `npm_telegram_package_spec` para reexecutar a mesma lane de pacote Telegram contra o pacote npm publicado.

Consulte [validação completa de release](/pt-BR/reference/full-release-validation) para a
matriz de estágios, nomes exatos de tarefas de fluxo de trabalho, diferenças de
perfil, artefatos e identificadores de reexecução focada.

`OpenClaw Release Publish` é o fluxo de trabalho manual mutável de release. Dispare-o
de `release/YYYY.M.D` ou `main` depois que a tag de release existir e depois que o
preflight npm do OpenClaw tiver sido bem-sucedido. Ele verifica `pnpm plugins:sync:check`,
dispara `Plugin NPM Release` para todos os pacotes de Plugins publicáveis, dispara
`Plugin ClawHub Release` para o mesmo SHA de release e só então dispara
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

As refs de despacho de workflow do GitHub devem ser branches ou tags, não SHAs de commit brutos. O
auxiliar envia uma branch temporária `release-ci/<sha>-...` no SHA de destino,
despacha `Full Release Validation` a partir dessa ref fixada, verifica se cada
workflow filho `headSha` corresponde ao destino e exclui a branch temporária quando a
execução é concluída. O verificador guarda-chuva também falha se algum workflow filho executou em um
SHA diferente.

`release_profile` controla a amplitude live/provedor passada para as verificações de release. Os
workflows manuais de release usam `stable` por padrão; use `full` somente quando você
intencionalmente quiser a matriz consultiva ampla de provedores/mídia. `run_release_soak`
controla se as verificações de release stable/padrão executam o soak live/E2E exaustivo e
de caminho de release Docker; `full` força o soak a ficar ativo.

- `minimum` mantém as lanes críticas de release mais rápidas de OpenAI/core.
- `stable` adiciona o conjunto stable de provedores/backends.
- `full` executa a matriz consultiva ampla de provedores/mídia.

O guarda-chuva registra os ids das execuções filhas despachadas, e o job final `Verify full validation` verifica novamente as conclusões atuais das execuções filhas e anexa tabelas dos jobs mais lentos para cada execução filha. Se um workflow filho for reexecutado e ficar verde, reexecute apenas o job verificador pai para atualizar o resultado do guarda-chuva e o resumo de tempos.

Para recuperação, tanto `Full Release Validation` quanto `OpenClaw Release Checks` aceitam `rerun_group`. Use `all` para uma candidata a release, `ci` para somente o filho normal de CI completo, `plugin-prerelease` para somente o filho de pré-release de Plugin, `release-checks` para todos os filhos de release, ou um grupo mais restrito: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` no guarda-chuva. Isso mantém a reexecução de uma caixa de release com falha delimitada depois de uma correção focada. Para uma lane cross-OS com falha, combine `rerun_group=cross-os` com `cross_os_suite_filter`, por exemplo `windows/packaged-upgrade`; comandos cross-OS longos emitem linhas de Heartbeat e os resumos de packaged-upgrade incluem tempos por fase. As lanes de QA de release-check são consultivas, então falhas somente de QA alertam, mas não bloqueiam o verificador de release-check.

`OpenClaw Release Checks` usa a ref confiável do workflow para resolver a ref selecionada uma vez em um tarball `release-package-under-test`, depois passa esse artefato para verificações cross-OS e Package Acceptance, além do workflow Docker de caminho de release live/E2E quando a cobertura de soak executa. Isso mantém os bytes do pacote consistentes entre as caixas de release e evita reempacotar a mesma candidata em vários jobs filhos.

Execuções duplicadas de `Full Release Validation` para `ref=main` e `rerun_group=all`
substituem o guarda-chuva mais antigo. O monitor pai cancela qualquer workflow filho que
já tenha despachado quando o pai é cancelado, então uma validação mais nova da main
não fica atrás de uma execução obsoleta de release-check de duas horas. A validação de branch/tag de
release e grupos de reexecução focados mantêm `cancel-in-progress: false`.

## Fragmentos live e E2E

O filho live/E2E de release mantém a cobertura nativa ampla de `pnpm test:live`, mas a executa como fragmentos nomeados por meio de `scripts/test-live-shard.mjs` em vez de um job serial:

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
- fragmentos separados de áudio/vídeo de mídia e fragmentos de música filtrados por provedor

Isso mantém a mesma cobertura de arquivos enquanto torna falhas lentas de provedores live mais fáceis de reexecutar e diagnosticar. Os nomes agregados de fragmentos `native-live-extensions-o-z`, `native-live-extensions-media` e `native-live-extensions-media-music` continuam válidos para reexecuções manuais pontuais.

Os fragmentos nativos live de mídia executam em `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, construído pelo workflow `Live Media Runner Image`. Essa imagem pré-instala `ffmpeg` e `ffprobe`; jobs de mídia apenas verificam os binários antes da configuração. Mantenha suítes live baseadas em Docker nos runners Blacksmith normais — jobs em contêiner são o lugar errado para iniciar testes Docker aninhados.

Fragmentos live de modelo/backend baseados em Docker usam uma imagem compartilhada separada `ghcr.io/openclaw/openclaw-live-test:<sha>` por commit selecionado. O workflow live de release constrói e envia essa imagem uma vez; depois os fragmentos Docker live de modelo, Gateway fragmentado por provedor, backend de CLI, bind de ACP e harness Codex executam com `OPENCLAW_SKIP_DOCKER_BUILD=1`. Fragmentos Docker de Gateway carregam limites explícitos de `timeout` no nível do script abaixo do timeout do job do workflow, para que um contêiner travado ou caminho de limpeza falhe rápido em vez de consumir todo o orçamento de release-check. Se esses fragmentos reconstruírem independentemente o target Docker completo de origem, a execução de release está mal configurada e desperdiçará tempo de relógio em builds de imagem duplicados.

## Aceitação de Pacote

Use `Package Acceptance` quando a pergunta for "este pacote instalável do OpenClaw funciona como produto?" Ela é diferente da CI normal: a CI normal valida a árvore de origem, enquanto a aceitação de pacote valida um único tarball pelo mesmo harness Docker E2E que os usuários exercitam depois de instalar ou atualizar.

### Jobs

1. `resolve_package` faz checkout de `workflow_ref`, resolve uma candidata de pacote, grava `.artifacts/docker-e2e-package/openclaw-current.tgz`, grava `.artifacts/docker-e2e-package/package-candidate.json`, envia ambos como o artefato `package-under-test` e imprime a origem, a ref do workflow, a ref do pacote, a versão, o SHA-256 e o perfil no resumo da etapa do GitHub.
2. `docker_acceptance` chama `openclaw-live-and-e2e-checks-reusable.yml` com `ref=workflow_ref` e `package_artifact_name=package-under-test`. O workflow reutilizável baixa esse artefato, valida o inventário do tarball, prepara imagens Docker com digest do pacote quando necessário e executa as lanes Docker selecionadas contra esse pacote em vez de empacotar o checkout do workflow. Quando um perfil seleciona várias `docker_lanes` direcionadas, o workflow reutilizável prepara o pacote e as imagens compartilhadas uma vez, depois distribui essas lanes como jobs Docker direcionados paralelos com artefatos únicos.
3. `package_telegram` opcionalmente chama `NPM Telegram Beta E2E`. Ele executa quando `telegram_mode` não é `none` e instala o mesmo artefato `package-under-test` quando Package Acceptance resolveu um; despachos Telegram autônomos ainda podem instalar uma spec npm publicada.
4. `summary` falha o workflow se a resolução do pacote, a aceitação Docker ou a lane Telegram opcional falhou.

### Origens de candidatas

- `source=npm` aceita apenas `openclaw@beta`, `openclaw@latest` ou uma versão exata de release do OpenClaw, como `openclaw@2026.4.27-beta.2`. Use isto para aceitação de pré-release/stable publicado.
- `source=ref` empacota uma branch, tag ou SHA de commit completo confiável de `package_ref`. O resolvedor busca branches/tags do OpenClaw, verifica se o commit selecionado é alcançável a partir do histórico de branches do repositório ou de uma tag de release, instala dependências em uma worktree destacada e empacota com `scripts/package-openclaw-for-docker.mjs`.
- `source=url` baixa um `.tgz` HTTPS; `package_sha256` é obrigatório.
- `source=artifact` baixa um `.tgz` de `artifact_run_id` e `artifact_name`; `package_sha256` é opcional, mas deve ser fornecido para artefatos compartilhados externamente.

Mantenha `workflow_ref` e `package_ref` separados. `workflow_ref` é o código confiável de workflow/harness que executa o teste. `package_ref` é o commit de origem que é empacotado quando `source=ref`. Isso permite que o harness de teste atual valide commits de origem confiáveis mais antigos sem executar lógica antiga de workflow.

### Perfis de suíte

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` mais `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — blocos completos Docker de caminho de release com OpenWebUI
- `custom` — `docker_lanes` exatas; obrigatório quando `suite_profile=custom`

O perfil `package` usa cobertura offline de Plugin para que a validação de pacote publicado não dependa da disponibilidade live do ClawHub. A lane Telegram opcional reutiliza o artefato `package-under-test` em `NPM Telegram Beta E2E`, mantendo o caminho de spec npm publicada para despachos autônomos.

Para a política dedicada de testes de atualização e Plugin, incluindo comandos locais,
lanes Docker, entradas de Package Acceptance, padrões de release e triagem de falhas,
consulte [Testando atualizações e plugins](/pt-BR/help/testing-updates-plugins).

Verificações de release chamam Package Acceptance com `source=artifact`, o artefato de pacote de release preparado, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` e `telegram_mode=mock-openai`. Isso mantém a prova de migração de pacote, atualização, limpeza de dependência de Plugin obsoleta, reparo de instalação de Plugin configurado, Plugin offline, atualização de Plugin e Telegram no mesmo tarball de pacote resolvido. Defina `package_acceptance_package_spec` em Full Release Validation ou OpenClaw Release Checks para executar essa mesma matriz contra um pacote npm enviado em vez do artefato construído a partir do SHA. Verificações de release cross-OS ainda cobrem onboarding, instalador e comportamento de plataforma específicos de SO; a validação de produto de pacote/atualização deve começar por Package Acceptance. A lane Docker `published-upgrade-survivor` valida uma linha de base de pacote publicado por execução no caminho bloqueante de release. Em Package Acceptance, o tarball resolvido `package-under-test` é sempre a candidata e `published_upgrade_survivor_baseline` seleciona a linha de base publicada de fallback, com padrão `openclaw@latest`; comandos de reexecução de lane com falha preservam essa linha de base. Full Release Validation com `run_release_soak=true` ou `release_profile=full` define `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` e `published_upgrade_survivor_scenarios=reported-issues` para expandir entre os quatro releases npm stable mais recentes, mais releases fixados de limite de compatibilidade de Plugin e fixtures em formato de issues para configuração Feishu, arquivos bootstrap/persona preservados, instalações configuradas de Plugin OpenClaw, caminhos de log com til e raízes obsoletas de dependências legadas de Plugin. Seleções multi-linha de base de published-upgrade survivor são fragmentadas por linha de base em jobs separados de runner Docker direcionado. O workflow separado `Update Migration` usa a lane Docker `update-migration` com `all-since-2026.4.23` e `plugin-deps-cleanup` quando a pergunta é limpeza exaustiva de atualização publicada, não amplitude normal de Full Release CI. Execuções agregadas locais podem passar specs de pacote exatas com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, manter uma única lane com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, como `openclaw@2026.4.15`, ou definir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para a matriz de cenários. A lane publicada configura a linha de base com uma receita de comando `openclaw config set` incorporada, registra etapas da receita em `summary.json` e sonda `/healthz`, `/readyz`, além do status RPC após a inicialização do Gateway. As lanes Windows de packaged e installer fresh também verificam se um pacote instalado pode importar uma substituição de controle de navegador a partir de um caminho Windows absoluto bruto. O smoke de agent-turn cross-OS da OpenAI usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` por padrão quando definido; caso contrário, usa `openai/gpt-5.4`, para que a prova de instalação e Gateway permaneça em um modelo de teste GPT-5 enquanto evita padrões GPT-4.x.

### Janelas de compatibilidade legadas

A Aceitação de Pacotes tem janelas delimitadas de compatibilidade legada para pacotes já publicados. Pacotes até `2026.4.25`, incluindo `2026.4.25-beta.*`, podem usar o caminho de compatibilidade:

- entradas privadas conhecidas de QA em `dist/postinstall-inventory.json` podem apontar para arquivos omitidos do tarball;
- `doctor-switch` pode ignorar o subcaso de persistência de `gateway install --wrapper` quando o pacote não expõe essa flag;
- `update-channel-switch` pode remover `pnpm.patchedDependencies` ausentes do fixture git falso derivado do tarball e pode registrar em log a ausência de `update.channel` persistido;
- smokes de Plugin podem ler locais legados de registro de instalação ou aceitar a ausência de persistência do registro de instalação do marketplace;
- `plugin-update` pode permitir a migração de metadados de configuração, ainda exigindo que o registro de instalação e o comportamento sem reinstalação permaneçam inalterados.

O pacote `2026.4.26` publicado também pode avisar sobre arquivos de carimbo de metadados de build local que já foram enviados. Pacotes posteriores devem atender aos contratos modernos; as mesmas condições falham em vez de avisar ou ignorar.

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

Ao depurar uma execução com falha da aceitação de pacotes, comece pelo resumo `resolve_package` para confirmar a origem, a versão e o SHA-256 do pacote. Depois inspecione a execução filha `docker_acceptance` e seus artefatos Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logs de faixas, tempos de fase e comandos de nova execução. Prefira executar novamente o perfil de pacote com falha ou as faixas Docker exatas em vez de executar novamente a validação completa de lançamento.

## Smoke de instalação

O fluxo de trabalho separado `Install Smoke` reutiliza o mesmo script de escopo por meio do próprio job `preflight`. Ele divide a cobertura de smoke em `run_fast_install_smoke` e `run_full_install_smoke`.

- **Caminho rápido** é executado para pull requests que tocam superfícies Docker/pacote, mudanças em pacote/manifesto de Plugin empacotado ou superfícies principais de Plugin/canal/Gateway/SDK de Plugin que os jobs de smoke Docker exercitam. Mudanças apenas de código-fonte em Plugin empacotado, edições apenas de teste e edições apenas de docs não reservam workers Docker. O caminho rápido cria a imagem do Dockerfile raiz uma vez, verifica a CLI, executa o smoke da CLI de exclusão de agentes em workspace compartilhado, executa o e2e de rede do Gateway no contêiner, verifica um argumento de build de extensão empacotada e executa o perfil Docker delimitado de Plugin empacotado sob um timeout agregado de comando de 240 segundos (cada execução Docker de cenário é limitada separadamente).
- **Caminho completo** mantém a instalação de pacote QR e a cobertura Docker/de atualização do instalador para execuções noturnas agendadas, disparos manuais, verificações de lançamento via workflow-call e pull requests que realmente tocam superfícies de instalador/pacote/Docker. No modo completo, o install-smoke prepara ou reutiliza uma imagem de smoke GHCR do Dockerfile raiz para um SHA alvo, depois executa a instalação de pacote QR, smokes do Dockerfile raiz/Gateway, smokes de instalador/atualização e o E2E Docker rápido de Plugin empacotado como jobs separados, para que o trabalho de instalador não espere atrás dos smokes da imagem raiz.

Pushes para `main` (incluindo commits de merge) não forçam o caminho completo; quando a lógica de escopo alterado solicitar cobertura completa em um push, o fluxo de trabalho mantém o smoke Docker rápido e deixa o smoke completo de instalação para a validação noturna ou de lançamento.

O smoke lento de provedor de imagem com instalação global Bun é controlado separadamente por `run_bun_global_install_smoke`. Ele é executado na agenda noturna e a partir do fluxo de trabalho de verificações de lançamento, e disparos manuais de `Install Smoke` podem optar por incluí-lo, mas pull requests e pushes para `main` não. Testes Docker de QR e instalador mantêm seus próprios Dockerfiles focados em instalação.

## E2E Docker local

`pnpm test:docker:all` pré-cria uma imagem compartilhada de teste live, empacota o OpenClaw uma vez como um tarball npm e cria duas imagens compartilhadas de `scripts/e2e/Dockerfile`:

- um executor Node/Git básico para faixas de instalador/atualização/dependência de Plugin;
- uma imagem funcional que instala o mesmo tarball em `/app` para faixas de funcionalidade normal.

As definições de faixas Docker ficam em `scripts/lib/docker-e2e-scenarios.mjs`, a lógica do planejador fica em `scripts/lib/docker-e2e-plan.mjs`, e o executor apenas executa o plano selecionado. O agendador seleciona a imagem por faixa com `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, depois executa faixas com `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Ajustes

| Variável                               | Padrão | Finalidade                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Contagem de slots do pool principal para faixas normais.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Contagem de slots do pool final sensível a provedores.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Limite de faixas live simultâneas para que os provedores não limitem a taxa.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Limite de faixas simultâneas de instalação npm.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Limite de faixas simultâneas com múltiplos serviços.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Intervalo entre inícios de faixas para evitar tempestades de criação no daemon Docker; defina `0` para não usar intervalo.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Timeout de fallback por faixa (120 minutos); faixas live/finais selecionadas usam limites mais rígidos.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` imprime o plano do agendador sem executar faixas.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Lista separada por vírgulas de faixas exatas; ignora o smoke de limpeza para que agentes possam reproduzir uma faixa com falha. |

Uma faixa mais pesada que seu limite efetivo ainda pode iniciar a partir de um pool vazio, depois executa sozinha até liberar capacidade. Os preflights agregados locais verificam o Docker, removem contêineres E2E obsoletos do OpenClaw, emitem o status de faixas ativas, persistem tempos de faixas para ordenação da mais longa para a mais curta e, por padrão, param de agendar novas faixas em pool após a primeira falha.

### Fluxo de trabalho live/E2E reutilizável

O fluxo de trabalho live/E2E reutilizável pergunta a `scripts/test-docker-all.mjs --plan-json` qual pacote, tipo de imagem, imagem live, faixa e cobertura de credenciais são necessários. `scripts/docker-e2e.mjs` então converte esse plano em saídas e resumos do GitHub. Ele empacota o OpenClaw por meio de `scripts/package-openclaw-for-docker.mjs`, baixa um artefato de pacote da execução atual ou baixa um artefato de pacote de `package_artifact_run_id`; valida o inventário do tarball; cria e envia imagens Docker E2E GHCR básicas/funcionais marcadas por digest de pacote por meio do cache de camadas Docker da Blacksmith quando o plano precisa de faixas com pacote instalado; e reutiliza entradas `docker_e2e_bare_image`/`docker_e2e_functional_image` fornecidas ou imagens existentes por digest de pacote em vez de recriar. Pulls de imagem Docker são repetidos com um timeout delimitado de 180 segundos por tentativa, para que um fluxo travado de registro/cache tente novamente rapidamente em vez de consumir a maior parte do caminho crítico de CI.

### Blocos do caminho de lançamento

A cobertura Docker de lançamento executa jobs menores em blocos com `OPENCLAW_SKIP_DOCKER_BUILD=1`, para que cada bloco baixe apenas o tipo de imagem necessário e execute múltiplas faixas por meio do mesmo agendador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Os blocos Docker de lançamento atuais são `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` e `plugins-runtime-install-a` até `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` permanecem aliases agregados de Plugin/runtime. O alias de faixa `install-e2e` permanece o alias agregado de nova execução manual para ambas as faixas de instalador de provedor.

OpenWebUI é incorporado em `plugins-runtime-services` quando a cobertura completa do caminho de lançamento o solicita, e mantém um bloco independente `openwebui` apenas para disparos somente de OpenWebUI. Faixas de atualização de canais empacotados tentam novamente uma vez para falhas transitórias de rede npm.

Cada bloco envia `.artifacts/docker-tests/` com logs de faixas, tempos, `summary.json`, `failures.json`, tempos de fase, JSON do plano do agendador, tabelas de faixas lentas e comandos de nova execução por faixa. A entrada `docker_lanes` do fluxo de trabalho executa faixas selecionadas contra as imagens preparadas em vez dos jobs de bloco, o que mantém a depuração de faixas com falha delimitada a um job Docker direcionado e prepara, baixa ou reutiliza o artefato de pacote para essa execução; se uma faixa selecionada for uma faixa Docker live, o job direcionado cria a imagem de teste live localmente para essa nova execução. Comandos de nova execução por faixa gerados para GitHub incluem `package_artifact_run_id`, `package_artifact_name` e entradas de imagem preparada quando esses valores existem, para que uma faixa com falha possa reutilizar o pacote e as imagens exatos da execução com falha.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

O fluxo de trabalho live/E2E agendado executa diariamente a suíte Docker completa do caminho de lançamento.

## Pré-lançamento de Plugin

`Plugin Prerelease` é uma cobertura mais cara de produto/pacote, então é um fluxo de trabalho separado disparado por `Full Release Validation` ou por um operador explícito. Pull requests normais, pushes para `main` e disparos manuais independentes de CI mantêm essa suíte desligada. Ele balanceia testes de Plugin empacotados entre oito workers de extensão; esses jobs de shard de extensão executam até dois grupos de configuração de Plugin por vez, com um worker Vitest por grupo e um heap Node maior, para que lotes de Plugin com importações pesadas não criem jobs extras de CI. O caminho Docker de pré-lançamento exclusivo de lançamento agrupa faixas Docker direcionadas em pequenos grupos para evitar reservar dezenas de executores para jobs de um a três minutos.

## Laboratório de QA

O Laboratório de QA tem faixas de CI dedicadas fora do fluxo de trabalho principal com escopo inteligente. A paridade agêntica fica aninhada sob os harnesses amplos de QA e lançamento, não em um fluxo de trabalho independente de PR. Use `Full Release Validation` com `rerun_group=qa-parity` quando a paridade deve acompanhar uma execução de validação ampla.

- O fluxo de trabalho `QA-Lab - All Lanes` executa todas as noites em `main` e por disparo manual; ele espalha a faixa de paridade mock, a faixa Matrix live e as faixas live de Telegram e Discord como jobs paralelos. Jobs live usam o ambiente `qa-live-shared`, e Telegram/Discord usam leases Convex.

As verificações de release executam lanes de transporte ao vivo Matrix e Telegram com o provedor simulado determinístico e modelos qualificados por simulação (`mock-openai/gpt-5.5` e `mock-openai/gpt-5.5-alt`) para que o contrato de canal fique isolado da latência do modelo ao vivo e da inicialização normal do Plugin de provedor. O Gateway de transporte ao vivo desativa a busca de memória porque a paridade de QA cobre o comportamento de memória separadamente; a conectividade do provedor é coberta pelas suítes separadas de modelo ao vivo, provedor nativo e provedor Docker.

Matrix usa `--profile fast` para gates agendados e de release, adicionando `--fail-fast` somente quando a CLI em checkout oferece suporte a isso. O padrão da CLI e a entrada manual do workflow permanecem `all`; o despacho manual `matrix_profile=all` sempre divide a cobertura completa de Matrix em jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`.

`OpenClaw Release Checks` também executa as lanes críticas de release do QA Lab antes da aprovação de release; seu gate de paridade de QA executa os pacotes candidato e baseline como jobs de lane paralelos e, em seguida, baixa ambos os artefatos em um job pequeno de relatório para a comparação final de paridade.

Para PRs normais, siga evidências de CI/verificações com escopo em vez de tratar a paridade como um status obrigatório.

## CodeQL

O workflow `CodeQL` é intencionalmente um scanner de segurança estreito de primeira passagem, não a varredura completa do repositório. Execuções diárias, manuais e de proteção de pull request não draft verificam código de workflows do Actions mais as superfícies JavaScript/TypeScript de maior risco com consultas de segurança de alta confiança filtradas para `security-severity` alta/crítica.

A proteção de pull request permanece leve: ela só inicia para alterações em `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` ou `src`, e executa a mesma matriz de segurança de alta confiança que o workflow agendado. Android e macOS CodeQL ficam fora dos padrões de PR.

### Categorias de segurança

| Categoria                                          | Superfície                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron e baseline de Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementação de canal do core mais o ambiente de execução do Plugin de canal, Gateway, Plugin SDK, secrets e pontos de auditoria              |
| `/codeql-security-high/network-ssrf-boundary`     | Superfícies de SSRF do core, parsing de IP, proteção de rede, busca web e política de SSRF do Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, helpers de execução de processo, entrega de saída e gates de execução de ferramentas de agente                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Superfícies de confiança de instalação de Plugin, loader, manifesto, registro, instalação pelo gerenciador de pacotes, carregamento de origem e contrato de pacote do Plugin SDK |

### Shards de segurança específicos de plataforma

- `CodeQL Android Critical Security` — shard agendado de segurança do Android. Compila o app Android manualmente para CodeQL no menor runner Blacksmith Linux aceito pela sanidade do workflow. Faz upload em `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard semanal/manual de segurança do macOS. Compila o app macOS manualmente para CodeQL no Blacksmith macOS, filtra resultados de build de dependências do SARIF enviado e faz upload em `/codeql-critical-security/macos`. Mantido fora dos padrões diários porque o build do macOS domina o tempo de execução mesmo quando está limpo.

### Categorias de qualidade crítica

`CodeQL Critical Quality` é o shard não relacionado a segurança correspondente. Ele executa somente consultas de qualidade JavaScript/TypeScript de severidade de erro e não relacionadas a segurança em superfícies estreitas de alto valor no runner Blacksmith Linux menor. Sua proteção de pull request é intencionalmente menor que o perfil agendado: PRs não draft executam apenas os shards correspondentes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` e `plugin-sdk-reply-runtime` para alterações em código de execução de comandos/modelos/ferramentas de agente e despacho de respostas, código de schema/migração/IO de configuração, código de auth/secrets/sandbox/security, core channel e ambiente de execução de Plugin de canal incluído, protocolo de Gateway/método de servidor, runtime de memória/cola de SDK, MCP/processo/entrega de saída, runtime de provedor/catálogo de modelos, diagnósticos de sessão/filas de entrega, loader de Plugin, contrato de Plugin SDK/pacote ou runtime de respostas do Plugin SDK. Alterações na configuração do CodeQL e no workflow de qualidade executam todos os doze shards de qualidade de PR.

O despacho manual aceita:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Os perfis estreitos são ganchos de ensino/iteração para executar um shard de qualidade isoladamente.

| Categoria                                                | Superfície                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Código de auth, secrets, sandbox, cron e fronteira de segurança do Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Contratos de schema, migração, normalização e IO de configuração                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schemas de protocolo do Gateway e contratos de métodos de servidor                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementação de core channel e Plugin de canal incluído                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Execução de comandos, despacho de modelo/provedor, despacho e filas de resposta automática, e contratos de runtime do plano de controle ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP e pontes de ferramentas, helpers de supervisão de processo e contratos de entrega de saída                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK do host de memória, fachadas de runtime de memória, aliases de memória do Plugin SDK, cola de ativação do runtime de memória e comandos doctor de memória                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internos da fila de respostas, filas de entrega de sessão, helpers de vinculação/entrega de sessão de saída, superfícies de eventos diagnósticos/pacotes de log e contratos da CLI doctor de sessão |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de resposta recebida do Plugin SDK, helpers de payload/fragmentação/runtime de resposta, opções de resposta de canal, filas de entrega e helpers de vinculação de sessão/thread             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalização de catálogo de modelos, auth e descoberta de provedor, registro de runtime de provedor, padrões/catálogos de provedor e registros de web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap da UI de controle, persistência local, fluxos de controle do Gateway e contratos de runtime do plano de controle de tarefas                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Busca/pesquisa web do core, IO de mídia, entendimento de mídia, geração de imagens e contratos de runtime de geração de mídia                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Contratos de loader, registro, superfície pública e entrypoint do Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Fonte do Plugin SDK do lado do pacote publicado e helpers de contrato de pacote de Plugin                                                                                      |

Qualidade permanece separada de segurança para que achados de qualidade possam ser agendados, medidos, desativados ou expandidos sem obscurecer o sinal de segurança. A expansão de CodeQL para Swift, Python e Plugins incluídos deve ser adicionada de volta como trabalho de acompanhamento com escopo ou em shards somente depois que os perfis estreitos tiverem tempo de execução e sinal estáveis.

## Workflows de manutenção

### Agente de docs

O workflow `Docs Agent` é uma lane de manutenção do Codex orientada a eventos para manter a documentação existente alinhada com alterações recém-integradas. Ele não tem agenda pura: uma execução de CI bem-sucedida de push não bot em `main` pode acioná-lo, e o despacho manual pode executá-lo diretamente. Invocações por workflow-run são ignoradas quando `main` avançou ou quando outra execução não ignorada do Docs Agent foi criada na última hora. Quando é executado, ele revisa o intervalo de commits do SHA de origem anterior não ignorado do Docs Agent até o `main` atual, de modo que uma execução horária possa cobrir todas as alterações em main acumuladas desde a última passagem de docs.

### Agente de performance de testes

O workflow `Test Performance Agent` é uma lane de manutenção do Codex orientada a eventos para testes lentos. Ele não tem agenda pura: uma execução de CI bem-sucedida de push não bot em `main` pode acioná-lo, mas ele é ignorado se outra invocação por workflow-run já foi executada ou está em execução naquele dia UTC. O despacho manual ignora esse gate de atividade diária. A lane cria um relatório de performance do Vitest agrupado para a suíte completa, permite que o Codex faça apenas pequenas correções de performance de testes que preservem cobertura em vez de refactors amplos, depois executa novamente o relatório da suíte completa e rejeita alterações que reduzam a contagem baseline de testes aprovados. Se o baseline tiver testes falhando, o Codex pode corrigir apenas falhas óbvias, e o relatório da suíte completa após o agente deve passar antes que qualquer coisa seja commitada. Quando `main` avança antes do push do bot aterrissar, a lane faz rebase do patch validado, executa novamente `pnpm check:changed` e tenta o push de novo; patches obsoletos conflitantes são ignorados. Ele usa Ubuntu hospedado pelo GitHub para que a action do Codex possa manter a mesma postura de segurança sem sudo que o agente de docs.

### PRs duplicados após merge

O workflow `Duplicate PRs After Merge` é um workflow manual de mantenedor para limpeza de duplicatas pós-aterrissagem. Seu padrão é dry-run e ele só fecha PRs explicitamente listados quando `apply=true`. Antes de modificar o GitHub, ele verifica que o PR aterrissado está mergeado e que cada duplicata tem uma issue referenciada compartilhada ou hunks alterados sobrepostos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gates de verificação local e roteamento de alterações

A lógica local de lanes alteradas fica em `scripts/changed-lanes.mjs` e é executada por `scripts/check-changed.mjs`. Esse gate de verificação local é mais rigoroso sobre fronteiras de arquitetura do que o escopo amplo da plataforma de CI:

- alterações de produção no núcleo executam typecheck de produção e de testes do núcleo, mais lint/guards do núcleo;
- alterações apenas de teste no núcleo executam somente typecheck de testes do núcleo, mais lint do núcleo;
- alterações de produção em extensões executam typecheck de produção e de testes de extensões, mais lint de extensões;
- alterações apenas de teste em extensões executam typecheck de testes de extensões, mais lint de extensões;
- alterações públicas no Plugin SDK ou no contrato de Plugin expandem para typecheck de extensões porque as extensões dependem desses contratos do núcleo (varreduras de extensões do Vitest continuam sendo trabalho de teste explícito);
- incrementos de versão apenas em metadados de release executam verificações direcionadas de versão/configuração/dependências-raiz;
- alterações desconhecidas na raiz/configuração falham com segurança para todas as lanes de verificação.

O roteamento local de testes alterados fica em `scripts/test-projects.test-support.mjs` e é intencionalmente mais barato que `check:changed`: edições diretas de testes executam a si mesmas, edições de código-fonte preferem mapeamentos explícitos, depois testes irmãos e dependentes do grafo de importação. A configuração compartilhada de entrega para salas de grupo é um dos mapeamentos explícitos: alterações na configuração de resposta visível ao grupo, no modo de entrega de resposta de origem ou na mensagem de sistema da ferramenta de mensagens passam pelos testes principais de resposta, além das regressões de entrega do Discord e Slack, para que uma alteração de padrão compartilhado falhe antes do primeiro push do PR. Use `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` somente quando a alteração for ampla o bastante no harness para que o conjunto mapeado barato não seja um proxy confiável.

## Validação com Testbox

Execute o Testbox a partir da raiz do repositório e prefira uma box aquecida nova para provas amplas. Antes de gastar uma gate lenta em uma box reutilizada, expirada ou que acabou de relatar uma sincronização inesperadamente grande, execute `pnpm testbox:sanity` dentro da box primeiro.

A verificação de sanidade falha rapidamente quando arquivos obrigatórios da raiz, como `pnpm-lock.yaml`, desapareceram ou quando `git status --short` mostra pelo menos 200 exclusões rastreadas. Isso geralmente significa que o estado de sincronização remoto não é uma cópia confiável do PR; pare essa box e aqueça uma nova em vez de depurar a falha de teste do produto. Para PRs intencionais com grandes exclusões, defina `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para essa execução de sanidade.

`pnpm testbox:run` também encerra uma invocação local da Blacksmith CLI que permanece na fase de sincronização por mais de cinco minutos sem saída pós-sincronização. Defina `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` para desativar essa proteção, ou use um valor maior em milissegundos para diffs locais incomumente grandes.

Crabbox é o wrapper de box remota pertencente ao repositório para prova Linux de mantenedores. Use-o quando uma verificação for ampla demais para um ciclo local de edição, quando a paridade com CI importar ou quando a prova precisar de segredos, Docker, lanes de pacote, boxes reutilizáveis ou logs remotos. O backend normal do OpenClaw é `blacksmith-testbox`; a capacidade AWS/Hetzner própria é um fallback para indisponibilidades da Blacksmith, problemas de cota ou testes explícitos em capacidade própria.

Antes da primeira execução, verifique o wrapper a partir da raiz do repositório:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

O wrapper do repositório recusa um binário Crabbox obsoleto que não anuncia `blacksmith-testbox`. Passe o provedor explicitamente mesmo que `.crabbox.yaml` tenha padrões de nuvem própria.

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

Leia o resumo JSON final. Os campos úteis são `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` e `totalMs`. Execuções Crabbox pontuais com backend Blacksmith devem parar o Testbox automaticamente; se uma execução for interrompida ou a limpeza não estiver clara, inspecione as boxes ativas e pare apenas as boxes que você criou:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Use reutilização somente quando você precisar intencionalmente de vários comandos na mesma box hidratada:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Se o Crabbox for a camada quebrada, mas a própria Blacksmith funcionar, use Blacksmith diretamente como fallback estreito:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Se `blacksmith testbox list --all` e `blacksmith testbox status` funcionarem, mas novos aquecimentos ficarem `queued` sem IP ou URL de execução do Actions depois de alguns minutos, trate isso como pressão no provedor Blacksmith, fila, cobrança ou limite da organização. Pare os ids enfileirados que você criou, evite iniciar mais Testboxes e mova a prova para o caminho de capacidade própria do Crabbox abaixo enquanto alguém verifica o painel da Blacksmith, a cobrança e os limites da organização.

Escalone para capacidade própria do Crabbox somente quando a Blacksmith estiver fora do ar, limitada por cota, sem o ambiente necessário, ou quando capacidade própria for explicitamente o objetivo:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Sob pressão da AWS, evite `class=beast` a menos que a tarefa realmente precise de CPU de classe 48xlarge. Uma solicitação `beast` começa em 192 vCPUs e é a forma mais fácil de acionar cotas regionais EC2 Spot ou On-Demand Standard. O `.crabbox.yaml` pertencente ao repositório usa como padrão `standard`, várias regiões de capacidade e `capacity.hints: true`, para que leases AWS intermediados imprimam a região/mercado selecionados, pressão de cota, fallback Spot e avisos de classe sob alta pressão. Use `fast` para verificações amplas mais pesadas, `large` somente depois que standard/fast não forem suficientes, e `beast` somente para lanes excepcionais limitadas por CPU, como suíte completa ou matrizes Docker de todos os plugins, validação explícita de release/bloqueador ou profiling de desempenho com muitos núcleos. Não use `beast` para `pnpm check:changed`, testes focados, trabalho apenas de docs, lint/typecheck comum, pequenas reproduções E2E ou triagem de indisponibilidade da Blacksmith. Use `--market on-demand` para diagnóstico de capacidade, para que a oscilação do mercado Spot não seja misturada ao sinal.

`.crabbox.yaml` é dono dos padrões de provedor, sincronização e hidratação do GitHub Actions para lanes de nuvem própria. Ele exclui o `.git` local para que o checkout hidratado do Actions mantenha seus próprios metadados Git remotos em vez de sincronizar remotes e armazenamentos de objetos locais do mantenedor, e exclui artefatos locais de runtime/build que nunca devem ser transferidos. `.github/workflows/crabbox-hydrate.yml` é dono do checkout, configuração de Node/pnpm, fetch de `origin/main` e handoff de ambiente não secreto para comandos `crabbox run --id <cbx_id>` em nuvem própria.

## Relacionados

- [Visão geral da instalação](/pt-BR/install)
- [Canais de desenvolvimento](/pt-BR/install/development-channels)
