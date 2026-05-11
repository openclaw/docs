---
read_when:
    - Você precisa entender por que uma tarefa de CI foi ou não executada
    - Você está depurando uma verificação com falha do GitHub Actions
    - Você está coordenando uma execução ou reexecução de validação de release
    - Você está alterando o acionamento do ClawSweeper ou o encaminhamento de atividades do GitHub
summary: Grafo de tarefas de CI, controles de escopo, guarda-chuvas de lançamento e equivalentes de comandos locais
title: Pipeline de CI
x-i18n:
    generated_at: "2026-05-11T20:22:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: b377be491770211595b12833b9bb18e5757839ef761539d5caa8eda6f63d75dc
    source_path: ci.md
    workflow: 16
---

OpenClaw CI é executado em cada push para `main` e em cada pull request. O job `preflight` classifica o diff e desativa lanes caras quando apenas áreas não relacionadas mudaram. Execuções manuais de `workflow_dispatch` ignoram intencionalmente o escopo inteligente e expandem o grafo completo para candidatos a release e validação ampla. As lanes Android permanecem opcionais por meio de `include_android`. A cobertura de plugins apenas para release vive no workflow separado [`Pré-lançamento de Plugin`](#plugin-prerelease) e só é executada a partir da [`Validação Completa de Release`](#full-release-validation) ou de um disparo manual explícito.

## Visão geral do pipeline

| Job                              | Finalidade                                                                                                | Quando é executado                 |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Detecta alterações somente em docs, escopos alterados, extensões alteradas e cria o manifesto de CI       | Sempre em pushes e PRs não rascunho |
| `security-scm-fast`              | Detecção de chave privada e auditoria de workflow via `zizmor`                                            | Sempre em pushes e PRs não rascunho |
| `security-dependency-audit`      | Auditoria do lockfile de produção sem dependências contra advisories do npm                               | Sempre em pushes e PRs não rascunho |
| `security-fast`                  | Agregado obrigatório para os jobs rápidos de segurança                                                    | Sempre em pushes e PRs não rascunho |
| `check-dependencies`             | Passagem Knip somente de dependências de produção mais a guarda da allowlist de arquivos não usados       | Alterações relevantes para Node    |
| `build-artifacts`                | Compila `dist/`, Control UI, verificações de artefatos compilados e artefatos downstream reutilizáveis    | Alterações relevantes para Node    |
| `checks-fast-core`               | Lanes rápidas de correção no Linux, como verificações bundled/contrato de plugin/protocolo                | Alterações relevantes para Node    |
| `checks-fast-contracts-channels` | Verificações de contrato de canal em shards com um resultado agregado estável                             | Alterações relevantes para Node    |
| `checks-node-core-test`          | Shards de testes core do Node, excluindo lanes de canal, bundled, contrato e extensão                     | Alterações relevantes para Node    |
| `check`                          | Equivalente ao gate local principal em shards: tipos de produção, lint, guardas, tipos de teste e smoke estrito | Alterações relevantes para Node |
| `check-additional`               | Arquitetura, drift de boundary/prompt em shards, guardas de extensão, boundary de pacote e gateway watch  | Alterações relevantes para Node    |
| `build-smoke`                    | Testes smoke da CLI compilada e smoke de memória de inicialização                                         | Alterações relevantes para Node    |
| `checks`                         | Verificador para testes de canal com artefatos compilados                                                 | Alterações relevantes para Node    |
| `checks-node-compat-node22`      | Lane de build e smoke de compatibilidade com Node 22                                                      | Disparo manual de CI para releases |
| `check-docs`                     | Formatação, lint e verificações de links quebrados da documentação                                        | Docs alteradas                     |
| `skills-python`                  | Ruff + pytest para Skills apoiadas em Python                                                              | Alterações relevantes para skills Python |
| `checks-windows`                 | Testes específicos do Windows para processos/caminhos mais regressões de especificadores de importação de runtime compartilhado | Alterações relevantes para Windows |
| `macos-node`                     | Lane de testes TypeScript no macOS usando os artefatos compilados compartilhados                          | Alterações relevantes para macOS   |
| `macos-swift`                    | Lint, build e testes Swift para o app macOS                                                               | Alterações relevantes para macOS   |
| `android`                        | Testes unitários Android para ambos os flavors mais uma build de APK debug                                | Alterações relevantes para Android |
| `test-performance-agent`         | Otimização diária de testes lentos do Codex após atividade confiável                                      | Sucesso da CI principal ou disparo manual |
| `openclaw-performance`           | Relatórios diários/sob demanda de performance de runtime Kova com lanes mock-provider, deep-profile e GPT 5.4 live | Agendado e disparo manual |

## Ordem fail-fast

1. `preflight` decide quais lanes sequer existem. A lógica `docs-scope` e `changed-scope` são etapas dentro desse job, não jobs independentes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falham rapidamente sem esperar pelos jobs mais pesados de artefatos e matriz de plataformas.
3. `build-artifacts` se sobrepõe às lanes rápidas do Linux para que consumidores downstream possam começar assim que a build compartilhada estiver pronta.
4. Lanes mais pesadas de plataforma e runtime se expandem depois disso: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

O GitHub pode marcar jobs substituídos como `cancelled` quando um push mais novo chega ao mesmo PR ou ref `main`. Trate isso como ruído de CI, a menos que a execução mais nova para a mesma ref também esteja falhando. Verificações agregadas de shards usam `!cancelled() && always()` para que ainda relatem falhas normais de shard, mas não entrem na fila depois que todo o workflow já foi substituído. A chave automática de concorrência da CI é versionada (`CI-v7-*`) para que um zumbi do lado do GitHub em um grupo de fila antigo não possa bloquear indefinidamente execuções mais novas da main. Execuções manuais da suíte completa usam `CI-manual-v1-*` e não cancelam execuções em andamento.

O job `ci-timings-summary` envia um artefato compacto `ci-timings-summary` para cada execução de CI não rascunho. Ele registra tempo de parede, tempo de fila, jobs mais lentos e jobs com falha para a execução atual, de modo que verificações de saúde da CI não precisem raspar repetidamente todo o payload do Actions.

## Escopo e roteamento

A lógica de escopo vive em `scripts/ci-changed-scope.mjs` e é coberta por testes unitários em `src/scripts/ci-changed-scope.test.ts`. O disparo manual pula a detecção de escopo alterado e faz o manifesto de preflight agir como se todas as áreas com escopo tivessem mudado.

- **Edições no workflow de CI** validam o grafo de CI do Node mais o lint de workflow, mas não forçam builds nativas de Windows, Android ou macOS por si só; essas lanes de plataforma permanecem escopadas a alterações no código-fonte da plataforma.
- **Edições apenas de roteamento de CI, edições selecionadas e baratas de fixtures de core-test, e edições estreitas em helpers/testes de roteamento de contrato de plugin** usam um caminho rápido de manifesto somente Node: `preflight`, segurança e uma única tarefa `checks-fast-core`. Esse caminho pula artefatos de build, compatibilidade com Node 22, contratos de canais, shards core completos, shards de plugin bundled e matrizes de guardas adicionais quando a alteração se limita às superfícies de roteamento ou helpers que a tarefa rápida exercita diretamente.
- **Verificações Node no Windows** são escopadas a wrappers específicos de processo/caminho do Windows, helpers de runner npm/pnpm/UI, configuração do gerenciador de pacotes e superfícies do workflow de CI que executam essa lane; alterações não relacionadas em código-fonte, plugin, install-smoke e somente testes permanecem nas lanes Node do Linux.

As famílias de teste Node mais lentas são divididas ou balanceadas para que cada job permaneça pequeno sem reservar runners em excesso: contratos de canais rodam como três shards ponderados apoiados pelo Blacksmith, com fallback para o runner padrão do GitHub; lanes core unit fast/support rodam separadamente; a infraestrutura core de runtime é dividida entre shards de estado, processo/configuração, cron e compartilhados; auto-reply roda como workers balanceados (com a subárvore de reply dividida em shards agent-runner, dispatch e commands/state-routing); e configurações agentic de gateway/server são divididas entre lanes chat/auth/model/http-plugin/runtime/startup em vez de esperar por artefatos compilados. Testes amplos de browser, QA, mídia e plugins diversos usam suas configs dedicadas do Vitest em vez do catch-all compartilhado de plugins. Shards com padrões de inclusão registram entradas de timing usando o nome do shard de CI, para que `.artifacts/vitest-shard-timings.json` consiga distinguir uma config inteira de um shard filtrado. `check-additional` mantém junto o trabalho de compilação/canary de package-boundary e separa a arquitetura de topologia de runtime da cobertura de gateway watch; a lista de guardas de boundary é distribuída em quatro shards de matriz, cada um executando guardas independentes selecionadas concorrentemente e imprimindo timings por verificação. A verificação cara de drift de snapshot de prompt no caminho feliz do Codex roda como seu próprio job adicional apenas para CI manual e para alterações que afetam prompts, de modo que alterações Node normais e não relacionadas não esperem por geração fria de snapshot de prompt e os shards de boundary permaneçam balanceados enquanto o drift de prompt ainda fica preso ao PR que o causou; a mesma flag pula a geração de Vitest de snapshot de prompt dentro do shard core support-boundary de artefato compilado. Gateway watch, testes de canal e o shard core support-boundary rodam concorrentemente dentro de `build-artifacts` depois que `dist/` e `dist-runtime/` já foram compilados.

A CI Android executa tanto `testPlayDebugUnitTest` quanto `testThirdPartyDebugUnitTest` e então compila o APK debug Play. O flavor de terceiros não tem source set nem manifest separados; sua lane de testes unitários ainda compila o flavor com as flags BuildConfig de SMS/call-log, evitando ao mesmo tempo um job duplicado de empacotamento de APK debug em cada push relevante para Android.

O shard `check-dependencies` executa `pnpm deadcode:dependencies` (uma passagem Knip somente de dependências de produção fixada na versão mais recente do Knip, com a idade mínima de release do pnpm desativada para a instalação via `dlx`) e `pnpm deadcode:unused-files`, que compara os achados de arquivos não usados de produção do Knip contra `scripts/deadcode-unused-files.allowlist.mjs`. A guarda de arquivos não usados falha quando um PR adiciona um novo arquivo não usado e não revisado ou deixa uma entrada obsoleta na allowlist, preservando ao mesmo tempo superfícies intencionais de plugin dinâmico, geradas, de build, de live-test e de ponte de pacote que o Knip não consegue resolver estaticamente.

## Encaminhamento de atividade do ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` é a ponte do lado do destino da atividade do repositório OpenClaw para o ClawSweeper. Ele não faz checkout nem executa código não confiável de pull requests. O workflow cria um token de GitHub App a partir de `CLAWSWEEPER_APP_PRIVATE_KEY` e então dispara payloads compactos de `repository_dispatch` para `openclaw/clawsweeper`.

O workflow tem quatro lanes:

- `clawsweeper_item` para solicitações exatas de revisão de issues e pull requests;
- `clawsweeper_comment` para comandos explícitos do ClawSweeper em comentários de issues;
- `clawsweeper_commit_review` para solicitações de revisão em nível de commit em pushes para `main`;
- `github_activity` para atividade geral do GitHub que o agente ClawSweeper pode inspecionar.

A lane `github_activity` encaminha apenas metadados normalizados: tipo de evento, ação, ator, repositório, número do item, URL, título, estado e trechos curtos de comentários ou revisões quando presentes. Ela evita intencionalmente encaminhar o corpo completo do webhook. O workflow receptor em `openclaw/clawsweeper` é `.github/workflows/github-activity.yml`, que publica o evento normalizado no hook do OpenClaw Gateway para o agente ClawSweeper.

Atividade geral é observação, não entrega por padrão. O agente ClawSweeper recebe o destino do Discord em seu prompt e deve postar em `#clawsweeper` somente quando o evento for surpreendente, acionável, arriscado ou operacionalmente útil. Aberturas rotineiras, edições, churn de bots, ruído duplicado de webhook e tráfego normal de revisões devem resultar em `NO_REPLY`.

Trate títulos, comentários, corpos, textos de revisão, nomes de branches e mensagens de commit do GitHub como dados não confiáveis em todo este caminho. Eles são entrada para sumarização e triagem, não instruções para o fluxo de trabalho ou para o runtime do agente.

## Disparos manuais

Disparos manuais de CI executam o mesmo grafo de jobs que a CI normal, mas forçam a ativação de todas as lanes com escopo não Android: shards Linux Node, shards de Plugins empacotados, contratos de canais, compatibilidade com Node 22, `check`, `check-additional`, smoke de build, verificações de documentação, Skills de Python, Windows, macOS e i18n da Control UI. Disparos manuais autônomos de CI executam apenas Android com `include_android=true`; o guarda-chuva de release completo habilita Android passando `include_android=true`. Verificações estáticas de pré-release de Plugin, o shard exclusivo de release `agentic-plugins`, a varredura completa em lote de extensões e as lanes Docker de pré-release de Plugin são excluídos da CI. A suíte Docker de pré-release roda somente quando `Full Release Validation` dispara o fluxo de trabalho separado `Plugin Prerelease` com o gate de validação de release habilitado.

Execuções manuais usam um grupo de concorrência único para que uma suíte completa de candidata a release não seja cancelada por outra execução de push ou PR na mesma ref. A entrada opcional `target_ref` permite que um chamador confiável execute esse grafo contra uma branch, tag ou SHA completo de commit usando o arquivo de fluxo de trabalho da ref de disparo selecionada.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Executores

| Executor                         | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, jobs rápidos de segurança e agregados (`security-scm-fast`, `security-dependency-audit`, `security-fast`), verificações rápidas de protocolo/contrato/empacotados, verificações fragmentadas de contrato de canal, shards de `check` exceto lint, agregados de `check-additional`, verificadores agregados de testes Node, verificações de documentação, Skills de Python, workflow-sanity, labeler, auto-response; o preflight de install-smoke também usa Ubuntu hospedado no GitHub para que a matriz do Blacksmith possa entrar na fila mais cedo |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shards de extensões de menor peso, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` e `check-test-types`                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | build-smoke, shards de teste Linux Node, shards de teste de Plugin empacotado, shards de `check-additional`, `android`                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404`  | `build-artifacts`, `check-lint` (sensível a CPU o suficiente para que 8 vCPU custassem mais do que economizavam); builds Docker de install-smoke (o tempo de fila de 32 vCPU custava mais do que economizava)                                                                                                                                                                                                                                                |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` em `openclaw/openclaw`; forks usam `macos-latest` como fallback                                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` em `openclaw/openclaw`; forks usam `macos-latest` como fallback                                                                                                                                                                                                                                                                                                                                                                                |

A CI do repositório canônico mantém o Blacksmith como o caminho padrão de executores. Durante `preflight`, `scripts/ci-runner-labels.mjs` verifica execuções recentes de Actions em fila e em andamento em busca de jobs do Blacksmith em fila. Se uma label específica do Blacksmith já tiver jobs em fila, jobs downstream que usariam exatamente essa label usam como fallback o executor hospedado no GitHub correspondente (`ubuntu-24.04`, `windows-2025` ou `macos-latest`) apenas para aquela execução. Outros tamanhos do Blacksmith na mesma família de SO permanecem em suas labels primárias. Se a sonda da API falhar, nenhum fallback é aplicado.

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

## OpenClaw Performance

`OpenClaw Performance` é o fluxo de trabalho de desempenho do produto/runtime. Ele roda diariamente em `main` e pode ser disparado manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

O disparo manual normalmente mede a ref do fluxo de trabalho. Defina `target_ref` para medir uma tag de release ou outra branch com a implementação atual do fluxo de trabalho. Caminhos de relatórios publicados e ponteiros mais recentes são indexados pela ref testada, e cada `index.md` registra a ref/SHA testada, ref/SHA do fluxo de trabalho, ref do Kova, perfil, modo de autenticação da lane, modelo, contagem de repetições e filtros de cenário.

O fluxo de trabalho instala o OCM a partir de uma release fixada e o Kova a partir de `openclaw/Kova` na entrada fixada `kova_ref`, depois executa três lanes:

- `mock-provider`: cenários diagnósticos do Kova contra um runtime de build local com autenticação falsa determinística compatível com OpenAI.
- `mock-deep-profile`: criação de perfis de CPU/heap/trace para hotspots de inicialização, Gateway e turno de agente.
- `live-gpt54`: um turno real de agente OpenAI `openai/gpt-5.4`, ignorado quando `OPENAI_API_KEY` não está disponível.

A lane mock-provider também executa sondas de código-fonte nativas do OpenClaw após a passada do Kova: tempo de boot e memória do Gateway em casos de inicialização padrão, com hook e com 50 Plugins; loops repetidos de hello `channel-chat-baseline` com mock-OpenAI; e comandos de inicialização da CLI contra o Gateway iniciado. O resumo Markdown da sonda de código-fonte fica em `source/index.md` no pacote de relatório, com JSON bruto ao lado.

Toda lane envia artefatos do GitHub. Quando `CLAWGRIT_REPORTS_TOKEN` está configurado, o fluxo de trabalho também faz commit de `report.json`, `report.md`, pacotes, `index.md` e artefatos de sonda de código-fonte em `openclaw/clawgrit-reports` sob `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. O ponteiro atual da ref testada é escrito como `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validação Completa de Release

`Full Release Validation` é o fluxo de trabalho guarda-chuva manual para "executar tudo antes da release". Ele aceita uma branch, tag ou SHA completo de commit, dispara o fluxo de trabalho manual `CI` com esse alvo, dispara `Plugin Prerelease` para prova exclusiva de release de Plugin/pacote/estática/Docker e dispara `OpenClaw Release Checks` para smoke de instalação, aceitação de pacote, verificações de pacote entre SOs, paridade do QA Lab, Matrix e lanes do Telegram. Execuções estáveis/padrão mantêm cobertura live/E2E exaustiva e de caminho de release Docker atrás de `run_release_soak=true`; `release_profile=full` força essa cobertura de soak a ser ativada para que uma validação ampla de advisory continue ampla. Com `rerun_group=all` e `release_profile=full`, ele também executa `NPM Telegram Beta E2E` contra o artefato `release-package-under-test` das verificações de release. Após publicar, passe `release_package_spec` para reutilizar o pacote npm enviado em verificações de release, Package Acceptance, Docker, entre SOs e Telegram sem rebuild. Use `npm_telegram_package_spec` somente quando o Telegram precisar provar um pacote diferente.

Consulte [Validação completa de release](/pt-BR/reference/full-release-validation) para a
matriz de estágios, nomes exatos de jobs do fluxo de trabalho, diferenças de perfil, artefatos e
handles de reexecução focada.

`OpenClaw Release Publish` é o fluxo de trabalho manual mutável de release. Dispare-o
a partir de `release/YYYY.M.D` ou `main` depois que a tag de release existir e depois que o
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

Para comprovação de commit fixado em um branch que muda rapidamente, use o helper em vez de
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

As refs de dispatch de workflow do GitHub devem ser branches ou tags, não SHAs de commit brutos. O
helper envia um branch temporário `release-ci/<sha>-...` no SHA de destino,
dispara `Full Release Validation` a partir dessa ref fixada, verifica se todo
`headSha` de workflow filho corresponde ao destino e exclui o branch temporário quando a
execução é concluída. O verificador guarda-chuva também falha se algum workflow filho tiver sido executado em um
SHA diferente.

`release_profile` controla a abrangência live/provedor passada para as verificações de release. Os
workflows manuais de release usam `stable` por padrão; use `full` somente quando você
quiser intencionalmente a matriz ampla consultiva de provedores/mídia. `run_release_soak`
controla se as verificações de release stable/padrão executam o soak exaustivo live/E2E e
Docker do caminho de release; `full` força a ativação do soak.

- `minimum` mantém as lanes OpenAI/core críticas para release mais rápidas.
- `stable` adiciona o conjunto estável de provedores/backends.
- `full` executa a matriz ampla consultiva de provedores/mídia.

O guarda-chuva registra os IDs das execuções filhas disparadas, e o job final `Verify full validation` verifica novamente as conclusões atuais das execuções filhas e acrescenta tabelas dos jobs mais lentos para cada execução filha. Se um workflow filho for reexecutado e ficar verde, reexecute apenas o job verificador pai para atualizar o resultado do guarda-chuva e o resumo de tempos.

Para recuperação, tanto `Full Release Validation` quanto `OpenClaw Release Checks` aceitam `rerun_group`. Use `all` para um candidato a release, `ci` somente para o filho normal de CI completo, `plugin-prerelease` somente para o filho de pré-release de plugin, `release-checks` para todos os filhos de release, ou um grupo mais restrito: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` no guarda-chuva. Isso mantém a reexecução de uma caixa de release com falha limitada após uma correção focada. Para uma lane cross-OS com falha, combine `rerun_group=cross-os` com `cross_os_suite_filter`, por exemplo `windows/packaged-upgrade`; comandos cross-OS longos emitem linhas de Heartbeat e resumos de packaged-upgrade incluem tempos por fase. As lanes de verificações de release de QA são consultivas, portanto falhas somente de QA geram aviso, mas não bloqueiam o verificador de verificações de release.

`OpenClaw Release Checks` usa a ref confiável do workflow para resolver a ref selecionada uma única vez em um tarball `release-package-under-test`, depois passa esse artefato para verificações cross-OS e Aceitação de Pacote, além do workflow Docker live/E2E do caminho de release quando a cobertura de soak é executada. Isso mantém os bytes do pacote consistentes entre caixas de release e evita reempacotar o mesmo candidato em vários jobs filhos.

Execuções duplicadas de `Full Release Validation` para `ref=main` e `rerun_group=all`
substituem o guarda-chuva mais antigo. O monitor pai cancela qualquer workflow filho que
já tenha disparado quando o pai é cancelado, então a validação mais recente de main
não fica atrás de uma execução obsoleta de verificações de release de duas horas. A validação de branch/tag
de release e grupos de reexecução focados mantêm `cancel-in-progress: false`.

## Fragmentos live e E2E

O filho live/E2E de release mantém ampla cobertura nativa de `pnpm test:live`, mas a executa como fragmentos nomeados por meio de `scripts/test-live-shard.mjs`, em vez de um job serial:

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

Isso mantém a mesma cobertura de arquivos, ao mesmo tempo que torna falhas lentas de provedores ao vivo mais fáceis de executar novamente e diagnosticar. Os nomes de shard agregados `native-live-extensions-o-z`, `native-live-extensions-media` e `native-live-extensions-media-music` continuam válidos para reexecuções manuais pontuais.

Os shards de mídia nativa ao vivo são executados em `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, criado pelo workflow `Live Media Runner Image`. Essa imagem pré-instala `ffmpeg` e `ffprobe`; os jobs de mídia apenas verificam os binários antes da configuração. Mantenha suítes ao vivo baseadas em Docker em runners Blacksmith normais — jobs em contêiner não são o lugar certo para iniciar testes Docker aninhados.

Shards ao vivo de modelo/backend baseados em Docker usam uma imagem compartilhada separada `ghcr.io/openclaw/openclaw-live-test:<sha>` por commit selecionado. O workflow de release ao vivo cria e envia essa imagem uma vez; em seguida, os shards de modelo ao vivo Docker, Gateway dividido por provedor, backend de CLI, bind de ACP e harness do Codex são executados com `OPENCLAW_SKIP_DOCKER_BUILD=1`. Os shards Docker do Gateway carregam limites explícitos de `timeout` no nível do script abaixo do timeout do job do workflow, para que um contêiner travado ou caminho de limpeza falhe rápido em vez de consumir todo o orçamento da verificação de release. Se esses shards recriarem independentemente o alvo Docker completo do código-fonte, a execução de release está mal configurada e desperdiçará tempo de relógio em builds duplicados de imagem.

## Aceitação de pacotes

Use `Package Acceptance` quando a pergunta for "este pacote instalável do OpenClaw funciona como produto?" Ela é diferente da CI normal: a CI normal valida a árvore de código-fonte, enquanto a aceitação de pacotes valida um único tarball pelo mesmo harness E2E Docker que os usuários exercitam após instalar ou atualizar.

### Jobs

1. `resolve_package` faz checkout de `workflow_ref`, resolve um candidato de pacote, grava `.artifacts/docker-e2e-package/openclaw-current.tgz`, grava `.artifacts/docker-e2e-package/package-candidate.json`, envia ambos como o artefato `package-under-test` e imprime a origem, ref do workflow, ref do pacote, versão, SHA-256 e perfil no resumo da etapa do GitHub.
2. `docker_acceptance` chama `openclaw-live-and-e2e-checks-reusable.yml` com `ref=workflow_ref` e `package_artifact_name=package-under-test`. O workflow reutilizável baixa esse artefato, valida o inventário do tarball, prepara imagens Docker com digest do pacote quando necessário e executa as lanes Docker selecionadas contra esse pacote em vez de empacotar o checkout do workflow. Quando um perfil seleciona várias `docker_lanes` direcionadas, o workflow reutilizável prepara o pacote e as imagens compartilhadas uma vez e então distribui essas lanes como jobs Docker direcionados paralelos com artefatos exclusivos.
3. `package_telegram` opcionalmente chama `NPM Telegram Beta E2E`. Ele é executado quando `telegram_mode` não é `none` e instala o mesmo artefato `package-under-test` quando a Aceitação de pacotes resolveu um; o dispatch independente do Telegram ainda pode instalar uma especificação npm publicada.
4. `summary` faz o workflow falhar se a resolução do pacote, a aceitação Docker ou a lane opcional do Telegram falhar.

### Origens de candidatos

- `source=npm` aceita apenas `openclaw@beta`, `openclaw@latest` ou uma versão exata de release do OpenClaw, como `openclaw@2026.4.27-beta.2`. Use isto para aceitação de pré-release/estável publicada.
- `source=ref` empacota uma branch, tag ou SHA completo de commit confiável em `package_ref`. O resolvedor busca branches/tags do OpenClaw, verifica se o commit selecionado é alcançável pelo histórico de branches do repositório ou por uma tag de release, instala dependências em uma worktree desanexada e o empacota com `scripts/package-openclaw-for-docker.mjs`.
- `source=url` baixa um `.tgz` HTTPS; `package_sha256` é obrigatório.
- `source=artifact` baixa um `.tgz` de `artifact_run_id` e `artifact_name`; `package_sha256` é opcional, mas deve ser fornecido para artefatos compartilhados externamente.

Mantenha `workflow_ref` e `package_ref` separados. `workflow_ref` é o código confiável do workflow/harness que executa o teste. `package_ref` é o commit de origem que é empacotado quando `source=ref`. Isso permite que o harness de teste atual valide commits de origem confiáveis mais antigos sem executar lógica antiga de workflow.

### Perfis de suíte

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` mais `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunks completos do caminho de release Docker com OpenWebUI
- `custom` — `docker_lanes` exatas; obrigatório quando `suite_profile=custom`

O perfil `package` usa cobertura offline de plugins para que a validação de pacote publicado não dependa da disponibilidade ao vivo do ClawHub. A lane opcional do Telegram reutiliza o artefato `package-under-test` em `NPM Telegram Beta E2E`, com o caminho de especificação npm publicada mantido para dispatches independentes.

Para a política dedicada de testes de atualização e Plugin, incluindo comandos locais, lanes Docker, entradas da Aceitação de pacotes, padrões de release e triagem de falhas, consulte [Testando atualizações e plugins](/pt-BR/help/testing-updates-plugins).

As verificações de release chamam a Aceitação de Pacote com `source=artifact`, o artefato de pacote de release preparado, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` e `telegram_mode=mock-openai`. Isso mantém a migração de pacote, atualização, instalação de skill do ClawHub ao vivo, limpeza de dependências de plugins obsoletos, reparo de instalação de plugin configurado, plugin offline, atualização de plugin e prova do Telegram no mesmo tarball de pacote resolvido. Defina `release_package_spec` na Validação Completa de Release ou nas Verificações de Release do OpenClaw depois de publicar um beta para executar a mesma matriz contra o pacote npm enviado sem reconstruir; defina `package_acceptance_package_spec` somente quando a Aceitação de Pacote precisar de um pacote diferente do restante da validação de release. As verificações de release entre sistemas operacionais ainda cobrem integração, instalador e comportamento de plataforma específicos de cada sistema operacional; a validação de produto de pacote/atualização deve começar com a Aceitação de Pacote. A lane Docker `published-upgrade-survivor` valida uma linha de base de pacote publicado por execução no caminho bloqueante de release. Na Aceitação de Pacote, o tarball `package-under-test` resolvido é sempre o candidato e `published_upgrade_survivor_baseline` seleciona a linha de base publicada de fallback, com padrão `openclaw@latest`; comandos de reexecução de lanes com falha preservam essa linha de base. A Validação Completa de Release com `run_release_soak=true` ou `release_profile=full` define `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` e `published_upgrade_survivor_scenarios=reported-issues` para expandir entre as quatro versões npm estáveis mais recentes, além de releases fixadas de limite de compatibilidade de plugins e fixtures em formato de issues para configuração do Feishu, arquivos de bootstrap/persona preservados, instalações configuradas de plugins do OpenClaw, caminhos de log com til e raízes de dependências de plugins legados obsoletas. Seleções publicadas de sobrevivente de atualização com várias linhas de base são fragmentadas por linha de base em jobs separados e direcionados do executor Docker. O workflow separado `Update Migration` usa a lane Docker `update-migration` com `all-since-2026.4.23` e `plugin-deps-cleanup` quando a questão é limpeza exaustiva de atualizações publicadas, não a amplitude normal de CI da Validação Completa de Release. Execuções agregadas locais podem passar especificações exatas de pacote com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, manter uma única lane com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, como `openclaw@2026.4.15`, ou definir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para a matriz de cenários. A lane publicada configura a linha de base com uma receita embutida de comando `openclaw config set`, registra etapas da receita em `summary.json` e testa `/healthz`, `/readyz`, além do status RPC depois do início do Gateway. As lanes fresh empacotada e de instalador do Windows também verificam que um pacote instalado consegue importar uma substituição de controle de navegador a partir de um caminho absoluto bruto do Windows. O smoke de turno de agente da OpenAI entre sistemas operacionais usa como padrão `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando definido; caso contrário, usa `openai/gpt-5.4`, para que a prova de instalação e gateway permaneça em um modelo de teste GPT-5 enquanto evita padrões GPT-4.x.

### Janelas de compatibilidade legada

A Aceitação de Pacote tem janelas delimitadas de compatibilidade legada para pacotes já publicados. Pacotes até `2026.4.25`, incluindo `2026.4.25-beta.*`, podem usar o caminho de compatibilidade:

- entradas conhecidas de QA privadas em `dist/postinstall-inventory.json` podem apontar para arquivos omitidos do tarball;
- `doctor-switch` pode pular o subcaso de persistência `gateway install --wrapper` quando o pacote não expõe essa flag;
- `update-channel-switch` pode podar `patchedDependencies` do pnpm ausentes da fixture fake git derivada do tarball e pode registrar `update.channel` persistido ausente;
- smokes de plugin podem ler locais legados de registros de instalação ou aceitar persistência ausente do registro de instalação do marketplace;
- `plugin-update` pode permitir migração de metadados de configuração enquanto ainda exige que o registro de instalação e o comportamento sem reinstalação permaneçam inalterados.

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

Ao depurar uma execução de aceitação de pacote com falha, comece pelo resumo `resolve_package` para confirmar a origem, a versão e o SHA-256 do pacote. Em seguida, inspecione a execução filha `docker_acceptance` e seus artefatos Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logs de lane, tempos de fase e comandos de reexecução. Prefira reexecutar o perfil de pacote com falha ou as lanes Docker exatas em vez de reexecutar a validação completa de release.

## Smoke de Instalação

O workflow separado `Install Smoke` reutiliza o mesmo script de escopo por meio do seu próprio job `preflight`. Ele divide a cobertura de smoke em `run_fast_install_smoke` e `run_full_install_smoke`.

- **Caminho rápido** é executado para pull requests que tocam superfícies de Docker/pacote, mudanças de pacote/manifesto de plugins incluídos ou superfícies centrais de plugin/canal/gateway/Plugin SDK exercitadas pelos jobs de smoke Docker. Mudanças somente de código-fonte em plugins incluídos, edições somente de teste e edições somente de documentação não reservam workers Docker. O caminho rápido compila a imagem do Dockerfile raiz uma vez, verifica a CLI, executa o smoke da CLI de exclusão de agents em workspace compartilhado, executa o e2e de rede de gateway em contêiner, verifica um argumento de build de extensão incluída e executa o perfil Docker delimitado de plugins incluídos sob um timeout agregado de comando de 240 segundos (cada execução Docker de cenário é limitada separadamente).
- **Caminho completo** mantém a instalação de pacote QR e a cobertura Docker/update de instalador para execuções noturnas agendadas, dispatches manuais, verificações de release via workflow-call e pull requests que realmente tocam superfícies de instalador/pacote/Docker. No modo completo, o install-smoke prepara ou reutiliza uma imagem de smoke do Dockerfile raiz GHCR de SHA alvo, depois executa instalação de pacote QR, smokes do Dockerfile raiz/gateway, smokes de instalador/update e o E2E Docker rápido de plugins incluídos como jobs separados, para que o trabalho de instalador não espere pelos smokes da imagem raiz.

Pushes para `main` (incluindo commits de merge) não forçam o caminho completo; quando a lógica de escopo alterado solicitaria cobertura completa em um push, o workflow mantém o smoke Docker rápido e deixa o smoke de instalação completo para a validação noturna ou de release.

O smoke lento de provedor de imagem com instalação global Bun é controlado separadamente por `run_bun_global_install_smoke`. Ele é executado no agendamento noturno e a partir do workflow de verificações de release, e dispatches manuais de `Install Smoke` podem optar por incluí-lo, mas pull requests e pushes para `main` não. Testes Docker de QR e instalador mantêm seus próprios Dockerfiles focados em instalação.

## E2E Docker Local

`pnpm test:docker:all` pré-compila uma imagem compartilhada de teste ao vivo, empacota o OpenClaw uma vez como um tarball npm e compila duas imagens compartilhadas de `scripts/e2e/Dockerfile`:

- um executor Node/Git básico para lanes de instalador/atualização/dependência de plugin;
- uma imagem funcional que instala o mesmo tarball em `/app` para lanes de funcionalidade normal.

As definições de lanes Docker ficam em `scripts/lib/docker-e2e-scenarios.mjs`, a lógica do planejador fica em `scripts/lib/docker-e2e-plan.mjs`, e o executor apenas executa o plano selecionado. O escalonador seleciona a imagem por lane com `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, depois executa lanes com `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Ajustáveis

| Variável                               | Padrão | Finalidade                                                                                     |
| -------------------------------------- | ------ | ---------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10     | Contagem de slots do pool principal para lanes normais.                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10     | Contagem de slots do pool final sensível a providers.                                          |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9      | Limite de lanes ao vivo concorrentes para que providers não limitem por throttling.             |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10     | Limite de lanes de instalação npm concorrentes.                                                |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7      | Limite de lanes multisserviço concorrentes.                                                    |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000   | Escalonamento entre inícios de lanes para evitar tempestades de criação do daemon Docker; defina `0` para nenhum escalonamento. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Timeout de fallback por lane (120 minutos); lanes ao vivo/finais selecionadas usam limites mais rígidos. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset  | `1` imprime o plano do escalonador sem executar lanes.                                         |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset  | Lista exata de lanes separada por vírgulas; pula o smoke de limpeza para que agents possam reproduzir uma lane com falha. |

Uma lane mais pesada que seu limite efetivo ainda pode iniciar a partir de um pool vazio, depois roda sozinha até liberar capacidade. O agregado local faz preflight do Docker, remove contêineres E2E obsoletos do OpenClaw, emite status de lanes ativas, persiste tempos de lanes para ordenação da mais longa primeiro e, por padrão, para de escalonar novas lanes em pool após a primeira falha.

### Workflow ao vivo/E2E reutilizável

O workflow ao vivo/E2E reutilizável pergunta a `scripts/test-docker-all.mjs --plan-json` qual pacote, tipo de imagem, imagem ao vivo, lane e cobertura de credenciais são necessários. `scripts/docker-e2e.mjs` então converte esse plano em outputs e resumos do GitHub. Ele empacota o OpenClaw por meio de `scripts/package-openclaw-for-docker.mjs`, baixa um artefato de pacote da execução atual ou baixa um artefato de pacote de `package_artifact_run_id`; valida o inventário do tarball; compila e envia imagens Docker E2E bare/functional do GHCR com tag de digest de pacote por meio do cache de camadas Docker da Blacksmith quando o plano precisa de lanes com pacote instalado; e reutiliza entradas `docker_e2e_bare_image`/`docker_e2e_functional_image` fornecidas ou imagens existentes com digest de pacote em vez de reconstruir. Pulls de imagem Docker são repetidos com um timeout delimitado de 180 segundos por tentativa, para que um stream travado de registro/cache tente novamente rapidamente em vez de consumir a maior parte do caminho crítico de CI.

### Partes do caminho de release

A cobertura Docker de release executa jobs menores em partes com `OPENCLAW_SKIP_DOCKER_BUILD=1`, para que cada parte puxe apenas o tipo de imagem de que precisa e execute várias lanes por meio do mesmo escalonador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Os chunks Docker da versão atual são `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` e `plugins-runtime-install-a` até `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` permanecem aliases agregados de Plugin/runtime. O alias de lane `install-e2e` permanece o alias agregado de nova execução manual para ambas as lanes de instalador de provedor.

OpenWebUI é incorporado a `plugins-runtime-services` quando a cobertura completa do caminho de release solicita isso, e mantém um chunk `openwebui` independente apenas para dispatches exclusivos de OpenWebUI. As lanes de atualização de canais empacotados tentam novamente uma vez em caso de falhas transitórias de rede do npm.

Cada chunk envia `.artifacts/docker-tests/` com logs de lane, tempos, `summary.json`, `failures.json`, tempos de fase, JSON do plano do agendador, tabelas de lanes lentas e comandos de nova execução por lane. A entrada `docker_lanes` do workflow executa as lanes selecionadas contra as imagens preparadas em vez dos jobs de chunk, o que mantém a depuração de lanes com falha limitada a um job Docker direcionado e prepara, baixa ou reutiliza o artefato de pacote para essa execução; se uma lane selecionada for uma lane Docker live, o job direcionado compila a imagem de teste live localmente para essa nova execução. Os comandos gerados de nova execução por lane no GitHub incluem `package_artifact_run_id`, `package_artifact_name` e entradas de imagens preparadas quando esses valores existem, para que uma lane com falha possa reutilizar o pacote e as imagens exatos da execução com falha.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

O workflow agendado live/E2E executa diariamente a suíte Docker completa do caminho de release.

## Pré-lançamento de Plugin

`Plugin Prerelease` é uma cobertura de produto/pacote mais cara, portanto é um workflow separado disparado por `Full Release Validation` ou por um operador explícito. Pull requests normais, pushes para `main` e dispatches manuais de CI independentes mantêm essa suíte desativada. Ele balanceia os testes de Plugins empacotados entre oito workers de extensão; esses jobs de shard de extensão executam até dois grupos de configuração de Plugin por vez, com um worker Vitest por grupo e um heap Node maior, para que lotes de Plugins com muitas importações não criem jobs de CI extras. O caminho Docker de pré-lançamento exclusivo de release agrupa lanes Docker direcionadas em pequenos grupos para evitar reservar dezenas de runners para jobs de um a três minutos. O workflow também envia um artefato informativo `plugin-inspector-advisory` de `@openclaw/plugin-inspector`; as descobertas do inspetor são entrada de triagem e não alteram o gate bloqueante de Pré-lançamento de Plugin.

## QA Lab

QA Lab tem lanes de CI dedicadas fora do workflow principal com escopo inteligente. A paridade agentic fica aninhada sob os harnesses amplos de QA e release, não em um workflow de PR independente. Use `Full Release Validation` com `rerun_group=qa-parity` quando a paridade deve acompanhar uma execução ampla de validação.

- O workflow `QA-Lab - All Lanes` executa todas as noites em `main` e em dispatch manual; ele distribui a lane de paridade mock, a lane Matrix live e as lanes live de Telegram e Discord como jobs paralelos. Jobs live usam o ambiente `qa-live-shared`, e Telegram/Discord usam leases Convex.

As verificações de release executam lanes de transporte live Matrix e Telegram com o provedor mock determinístico e modelos qualificados para mock (`mock-openai/gpt-5.5` e `mock-openai/gpt-5.5-alt`), para que o contrato de canal seja isolado da latência de modelos live e da inicialização normal de Plugins de provedor. O Gateway de transporte live desativa a busca de memória porque a paridade de QA cobre o comportamento de memória separadamente; a conectividade de provedores é coberta pelas suítes separadas de modelo live, provedor nativo e provedor Docker.

Matrix usa `--profile fast` para gates agendados e de release, adicionando `--fail-fast` apenas quando a CLI em checkout oferece suporte a isso. O padrão da CLI e a entrada manual do workflow permanecem `all`; o dispatch manual `matrix_profile=all` sempre divide a cobertura completa de Matrix nos jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`.

`OpenClaw Release Checks` também executa as lanes críticas de release do QA Lab antes da aprovação de release; seu gate de paridade de QA executa os pacotes candidato e baseline como jobs de lane paralelos, depois baixa ambos os artefatos em um pequeno job de relatório para a comparação final de paridade.

Para PRs normais, siga as evidências de CI/verificação com escopo em vez de tratar a paridade como um status obrigatório.

## CodeQL

O workflow `CodeQL` é intencionalmente um scanner de segurança estreito de primeira passagem, não a varredura completa do repositório. Execuções diárias, manuais e de proteção de pull requests não draft escaneiam código de workflow do Actions mais as superfícies JavaScript/TypeScript de maior risco com consultas de segurança de alta confiança filtradas por `security-severity` alta/crítica.

A proteção de pull request permanece leve: ela só inicia para alterações em `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` ou `src`, e executa a mesma matriz de segurança de alta confiança do workflow agendado. CodeQL Android e macOS ficam fora dos padrões de PR.

### Categorias de segurança

| Categoria                                         | Superfície                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, segredos, sandbox, Cron e baseline do Gateway                                                                                 |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementação de canal do core mais runtime de Plugin de canal, Gateway, Plugin SDK, segredos e pontos de auditoria    |
| `/codeql-security-high/network-ssrf-boundary`     | Superfícies de SSRF do core, parsing de IP, guarda de rede, web-fetch e política de SSRF do Plugin SDK                              |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, helpers de execução de processo, entrega de saída e gates de execução de ferramentas de agente                      |
| `/codeql-security-high/plugin-trust-boundary`     | Superfícies de confiança de instalação de Plugin, loader, manifest, registry, instalação por gerenciador de pacotes, carregamento de código-fonte e contrato de pacote do Plugin SDK |

### Shards de segurança específicos de plataforma

- `CodeQL Android Critical Security` — shard agendado de segurança do Android. Compila manualmente o app Android para CodeQL no menor runner Blacksmith Linux aceito pela sanidade do workflow. Envia sob `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard semanal/manual de segurança do macOS. Compila manualmente o app macOS para CodeQL no Blacksmith macOS, filtra resultados de compilação de dependências do SARIF enviado e envia sob `/codeql-critical-security/macos`. Mantido fora dos padrões diários porque a compilação macOS domina o tempo de execução mesmo quando está limpa.

### Categorias de qualidade crítica

`CodeQL Critical Quality` é o shard não relacionado a segurança correspondente. Ele executa apenas consultas de qualidade JavaScript/TypeScript de severidade de erro e não relacionadas a segurança sobre superfícies estreitas de alto valor no runner Blacksmith Linux menor. Sua proteção de pull request é intencionalmente menor que o perfil agendado: PRs não draft executam apenas os shards correspondentes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` e `plugin-sdk-reply-runtime` para alterações em código de execução de comandos/modelos/ferramentas de agente e dispatch de respostas, código de schema/migração/IO de configuração, código de auth/segredos/sandbox/segurança, runtime de canal do core e de Plugin de canal empacotado, protocolo/método de servidor do Gateway, runtime de memória/glue do SDK, MCP/processo/entrega de saída, runtime de provedor/catálogo de modelos, filas de diagnóstico/entrega de sessão, loader de Plugin, contrato de pacote do Plugin SDK ou runtime de resposta do Plugin SDK. Alterações na configuração do CodeQL e no workflow de qualidade executam todos os doze shards de qualidade de PR.

O dispatch manual aceita:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Os perfis estreitos são hooks de ensino/iteração para executar um shard de qualidade isoladamente.

| Categoria                                              | Superfície                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, segredos, sandbox, Cron e código de limite de segurança do Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Esquema de configuração, migração, normalização e contratos de IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Esquemas de protocolo do Gateway e contratos de métodos do servidor                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementação do canal principal e do Plugin de canal empacotado                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Execução de comandos, despacho de modelo/provedor, despacho e filas de resposta automática, e contratos de runtime do plano de controle ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP e pontes de ferramentas, auxiliares de supervisão de processo e contratos de entrega de saída                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK do host de memória, facades de runtime de memória, aliases do SDK de Plugin de memória, cola de ativação de runtime de memória e comandos doctor de memória                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internos da fila de respostas, filas de entrega de sessão, auxiliares de vinculação/entrega de sessão de saída, superfícies de evento diagnóstico/pacote de logs e contratos da CLI doctor de sessão |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de resposta de entrada do SDK de Plugin, auxiliares de payload/fragmentação/runtime de resposta, opções de resposta de canal, filas de entrega e auxiliares de vinculação de sessão/thread             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalização de catálogo de modelos, autenticação e descoberta de provedores, registro de runtime de provedores, padrões/catálogos de provedores e registros de web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap da UI de controle, persistência local, fluxos de controle do Gateway e contratos de runtime do plano de controle de tarefas                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratos de runtime de fetch/search web principal, IO de mídia, compreensão de mídia, geração de imagens e geração de mídia                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Contratos de loader, registro, superfície pública e entrypoint do SDK de Plugin                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Fonte do SDK de Plugin no lado do pacote publicado e auxiliares de contrato de pacote de Plugin                                                                                      |

Qualidade permanece separada de segurança para que achados de qualidade possam ser agendados, medidos, desabilitados ou expandidos sem obscurecer o sinal de segurança. A expansão do CodeQL para Swift, Python e Plugins empacotados deve ser adicionada de volta como trabalho de acompanhamento escopado ou fragmentado somente depois que os perfis estreitos tiverem runtime e sinal estáveis.

## Fluxos de manutenção

### Agente de Docs

O fluxo de trabalho `Docs Agent` é uma faixa de manutenção do Codex orientada por eventos para manter a documentação existente alinhada com alterações integradas recentemente. Ele não tem uma agenda pura: uma execução de CI bem-sucedida de push não bot em `main` pode acioná-lo, e o dispatch manual pode executá-lo diretamente. Invocações por workflow-run são ignoradas quando `main` já avançou ou quando outra execução não ignorada do Docs Agent foi criada na última hora. Quando ele roda, revisa o intervalo de commits do SHA de origem do Docs Agent não ignorado anterior até o `main` atual, então uma execução por hora pode cobrir todas as alterações em main acumuladas desde a última passada de docs.

### Agente de Performance de Testes

O fluxo de trabalho `Test Performance Agent` é uma faixa de manutenção do Codex orientada por eventos para testes lentos. Ele não tem uma agenda pura: uma execução de CI bem-sucedida de push não bot em `main` pode acioná-lo, mas ele é ignorado se outra invocação por workflow-run já executou ou está executando naquele dia UTC. O dispatch manual ignora esse gate de atividade diária. A faixa cria um relatório de performance do Vitest agrupado da suíte completa, permite que o Codex faça apenas pequenas correções de performance de testes que preservem cobertura em vez de refatorações amplas, depois executa novamente o relatório da suíte completa e rejeita alterações que reduzam a contagem de testes aprovados da linha de base. Se a linha de base tiver testes falhando, o Codex pode corrigir apenas falhas óbvias e o relatório da suíte completa pós-agente deve passar antes que qualquer coisa seja commitada. Quando `main` avança antes que o push do bot seja integrado, a faixa faz rebase do patch validado, executa novamente `pnpm check:changed` e tenta o push de novo; patches obsoletos com conflitos são ignorados. Ela usa Ubuntu hospedado pelo GitHub para que a ação do Codex possa manter a mesma postura de segurança sem sudo do agente de docs.

### PRs Duplicados Após Merge

O fluxo de trabalho `Duplicate PRs After Merge` é um fluxo manual de mantenedor para limpeza de duplicados pós-integração. Ele usa dry-run por padrão e só fecha PRs listados explicitamente quando `apply=true`. Antes de modificar o GitHub, ele verifica que o PR integrado foi mesclado e que cada duplicado tem um issue referenciado compartilhado ou hunks alterados sobrepostos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gates de verificação locais e roteamento de alterações

A lógica local de faixas alteradas vive em `scripts/changed-lanes.mjs` e é executada por `scripts/check-changed.mjs`. Esse gate de verificação local é mais estrito sobre limites de arquitetura do que o escopo amplo da plataforma de CI:

- alterações de produção no core executam typecheck de produção do core e de testes do core, além de lint/guards do core;
- alterações apenas em testes do core executam somente typecheck de testes do core, além de lint do core;
- alterações de produção em extensão executam typecheck de produção da extensão e de testes da extensão, além de lint da extensão;
- alterações apenas em testes de extensão executam typecheck de testes da extensão, além de lint da extensão;
- alterações no SDK público de Plugin ou em contratos de Plugin expandem para typecheck de extensões porque as extensões dependem desses contratos do core (varreduras Vitest de extensões permanecem trabalho de teste explícito);
- aumentos de versão apenas de metadados de release executam verificações direcionadas de versão/configuração/dependência raiz;
- alterações desconhecidas de raiz/configuração falham de forma segura para todas as faixas de verificação.

O roteamento local de testes alterados vive em `scripts/test-projects.test-support.mjs` e é intencionalmente mais barato que `check:changed`: edições diretas em testes executam os próprios testes, edições em fonte preferem mapeamentos explícitos, depois testes irmãos e dependentes do grafo de imports. A configuração compartilhada de entrega em sala de grupo é um dos mapeamentos explícitos: alterações na configuração de resposta visível ao grupo, no modo de entrega de resposta de origem ou no prompt de sistema da ferramenta de mensagens passam pelos testes de resposta do core, além de regressões de entrega do Discord e Slack, para que uma alteração de padrão compartilhado falhe antes do primeiro push do PR. Use `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` somente quando a alteração for ampla o bastante no harness para que o conjunto mapeado barato não seja um proxy confiável.

## Validação Testbox

Crabbox é o wrapper de caixa remota pertencente ao repositório para prova Linux de mantenedor. Use-o
a partir da raiz do repositório quando uma verificação for ampla demais para um loop de edição local, quando a paridade
com CI importar ou quando a prova precisar de segredos, Docker, faixas de pacote,
caixas reutilizáveis ou logs remotos. O backend normal do OpenClaw é
`blacksmith-testbox`; capacidade AWS/Hetzner própria é um fallback para panes do Blacksmith,
problemas de cota ou testes explícitos em capacidade própria.

Execuções Blacksmith apoiadas pelo Crabbox aquecem, reivindicam, sincronizam, executam, reportam e limpam
Testboxes one-shot. A verificação de sanidade de sincronização integrada falha rapidamente quando arquivos
raiz obrigatórios como `pnpm-lock.yaml` desaparecem ou quando `git status --short`
mostra pelo menos 200 exclusões rastreadas. Para PRs intencionais com grandes exclusões, defina
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para o comando remoto.

Crabbox também encerra uma invocação local da CLI Blacksmith que permanece na
fase de sincronização por mais de cinco minutos sem saída pós-sincronização. Defina
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` para desabilitar esse guard, ou use um valor maior
em milissegundos para diffs locais incomumente grandes.

Antes de uma primeira execução, verifique o wrapper a partir da raiz do repositório:

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

Leia o resumo JSON final. Os campos úteis são `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` e `totalMs`. Execuções Crabbox one-shot apoiadas pelo Blacksmith devem parar o Testbox automaticamente; se uma execução for interrompida ou a limpeza estiver incerta, inspecione as caixas ativas e pare somente as caixas que você criou:

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

Se Crabbox for a camada quebrada, mas o próprio Blacksmith funcionar, use Blacksmith direto
somente para diagnósticos como `list`, `status` e limpeza. Corrija o caminho do
Crabbox antes de tratar uma execução direta do Blacksmith como prova de mantenedor.

Se `blacksmith testbox list --all` e `blacksmith testbox status` funcionarem, mas novos
aquecimentos ficarem `queued` sem IP ou URL de execução do Actions depois de alguns minutos,
trate como pressão de provedor, fila, cobrança ou limite de org do Blacksmith. Pare os
ids enfileirados que você criou, evite iniciar mais Testboxes e mova a prova para o
caminho de capacidade própria do Crabbox abaixo enquanto alguém verifica o painel do Blacksmith,
a cobrança e os limites da org.

Escale para capacidade própria do Crabbox somente quando o Blacksmith estiver fora do ar, limitado por cota, sem o ambiente necessário ou quando capacidade própria for explicitamente o objetivo:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Sob pressão da AWS, evite `class=beast` a menos que a tarefa realmente precise de CPU da classe 48xlarge. Uma solicitação `beast` começa em 192 vCPUs e é a forma mais fácil de esbarrar na cota regional de EC2 Spot ou On-Demand Standard. O `.crabbox.yaml` pertencente ao repositório usa `standard`, várias regiões de capacidade e `capacity.hints: true` como padrão, para que alocações intermediadas da AWS imprimam região/mercado selecionados, pressão de cota, fallback de Spot e avisos de classe sob alta pressão. Use `fast` para verificações amplas mais pesadas, `large` somente depois que standard/fast não forem suficientes, e `beast` apenas para faixas excepcionais limitadas por CPU, como matrizes Docker de suíte completa ou todos os plugins, validação explícita de release/bloqueador ou profiling de desempenho com muitos núcleos. Não use `beast` para `pnpm check:changed`, testes focados, trabalho somente de documentação, lint/typecheck comum, pequenas reproduções E2E ou triagem de indisponibilidade do Blacksmith. Use `--market on-demand` para diagnóstico de capacidade, para que a oscilação do mercado Spot não se misture ao sinal.

`.crabbox.yaml` define os padrões de provedor, sincronização e hidratação do GitHub Actions para faixas de nuvem própria. Ele exclui o `.git` local para que o checkout hidratado do Actions mantenha seus próprios metadados Git remotos em vez de sincronizar remotos e armazenamentos de objetos locais do mantenedor, e exclui artefatos locais de runtime/build que nunca devem ser transferidos. `.github/workflows/crabbox-hydrate.yml` define checkout, configuração de Node/pnpm, busca de `origin/main` e repasse de ambiente sem segredos para comandos `crabbox run --id <cbx_id>` de nuvem própria.

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Canais de desenvolvimento](/pt-BR/install/development-channels)
