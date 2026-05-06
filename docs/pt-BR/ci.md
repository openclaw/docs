---
read_when:
    - Você precisa entender por que uma tarefa de CI foi ou não executada
    - Você está depurando uma verificação do GitHub Actions com falha
    - Você está coordenando uma execução ou reexecução de validação de lançamento
    - Você está alterando o disparo do ClawSweeper ou o encaminhamento de atividade do GitHub
summary: Grafo de jobs de CI, gates de escopo, guarda-chuvas de release e equivalentes de comandos locais
title: pipeline de CI
x-i18n:
    generated_at: "2026-05-06T09:03:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 189f717fac369d6374102612308c73705f19eca9baca81b24f052dbd5357e15f
    source_path: ci.md
    workflow: 16
---

OpenClaw CI é executado em cada push para `main` e em cada pull request. O job `preflight` classifica o diff e desativa lanes caras quando apenas áreas não relacionadas mudaram. Execuções manuais de `workflow_dispatch` intencionalmente ignoram o escopo inteligente e espalham o grafo completo para release candidates e validação ampla. As lanes de Android continuam opt-in por meio de `include_android`. A cobertura de Plugin exclusiva de release fica no workflow separado [`Pré-lançamento de Plugin`](#plugin-prerelease) e só é executada a partir de [`Validação de Release Completa`](#full-release-validation) ou de um dispatch manual explícito.

## Visão geral do pipeline

| Job                              | Finalidade                                                                                                | Quando é executado                 |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Detectar alterações apenas em docs, escopos alterados, extensões alteradas e montar o manifesto da CI     | Sempre em pushes e PRs não draft   |
| `security-scm-fast`              | Detecção de chaves privadas e auditoria de workflow via `zizmor`                                          | Sempre em pushes e PRs não draft   |
| `security-dependency-audit`      | Auditoria do lockfile de produção sem dependências contra avisos do npm                                   | Sempre em pushes e PRs não draft   |
| `security-fast`                  | Agregado obrigatório para os jobs rápidos de segurança                                                    | Sempre em pushes e PRs não draft   |
| `check-dependencies`             | Passagem do Knip somente para dependências de produção, mais a guarda da allowlist de arquivos não usados | Alterações relevantes para Node    |
| `build-artifacts`                | Compilar `dist/`, Control UI, verificações de artefatos compilados e artefatos downstream reutilizáveis   | Alterações relevantes para Node    |
| `checks-fast-core`               | Lanes rápidas de correção no Linux, como verificações de empacotados/contrato de Plugin/protocolo         | Alterações relevantes para Node    |
| `checks-fast-contracts-channels` | Verificações shardizadas de contrato de canais com resultado agregado estável                             | Alterações relevantes para Node    |
| `checks-node-core-test`          | Shards de testes core em Node, excluindo lanes de canal, empacotados, contrato e extensão                 | Alterações relevantes para Node    |
| `check`                          | Equivalente shardizado do gate local principal: tipos prod, lint, guardas, tipos de teste e smoke estrito | Alterações relevantes para Node    |
| `check-additional`               | Arquitetura, drift shardizado de boundary/prompt, guardas de extensão, boundary de pacote e watch Gateway | Alterações relevantes para Node    |
| `build-smoke`                    | Testes smoke da CLI compilada e smoke de memória de inicialização                                         | Alterações relevantes para Node    |
| `checks`                         | Verificador para testes de canal de artefatos compilados                                                  | Alterações relevantes para Node    |
| `checks-node-compat-node22`      | Lane de build e smoke de compatibilidade com Node 22                                                      | Dispatch manual da CI para releases |
| `check-docs`                     | Formatação, lint e verificações de links quebrados da documentação                                        | Docs alteradas                     |
| `skills-python`                  | Ruff + pytest para Skills baseadas em Python                                                              | Alterações relevantes para Skills em Python |
| `checks-windows`                 | Testes específicos de processo/caminho no Windows mais regressões compartilhadas de especificadores de importação em runtime | Alterações relevantes para Windows |
| `macos-node`                     | Lane de testes TypeScript no macOS usando os artefatos compilados compartilhados                          | Alterações relevantes para macOS   |
| `macos-swift`                    | Lint, build e testes Swift para o app macOS                                                               | Alterações relevantes para macOS   |
| `android`                        | Testes unitários Android para ambos os flavors mais um build de APK debug                                 | Alterações relevantes para Android |
| `test-performance-agent`         | Otimização diária de testes lentos pelo Codex após atividade confiável                                    | Sucesso da CI principal ou dispatch manual |
| `openclaw-performance`           | Relatórios diários/sob demanda de performance do runtime Kova com lanes mock-provider, deep-profile e GPT 5.4 live | Dispatch agendado e manual         |

## Ordem de falha rápida

1. `preflight` decide quais lanes sequer existem. A lógica de `docs-scope` e `changed-scope` são etapas dentro deste job, não jobs independentes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falham rapidamente sem esperar pelos jobs mais pesados de artefatos e matriz de plataformas.
3. `build-artifacts` se sobrepõe às lanes rápidas de Linux para que consumidores downstream possam começar assim que o build compartilhado estiver pronto.
4. Lanes mais pesadas de plataforma e runtime se espalham depois disso: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

O GitHub pode marcar jobs substituídos como `cancelled` quando um push mais novo chega ao mesmo PR ou ref `main`. Trate isso como ruído de CI, a menos que a execução mais recente para a mesma ref também esteja falhando. Verificações agregadas de shards usam `!cancelled() && always()` para ainda relatarem falhas normais de shards, mas não entrarem na fila depois que todo o workflow já foi substituído. A chave automática de concorrência da CI é versionada (`CI-v7-*`) para que um zumbi do lado do GitHub em um grupo antigo de fila não consiga bloquear indefinidamente execuções mais novas da main. Execuções manuais da suíte completa usam `CI-manual-v1-*` e não cancelam execuções em andamento.

## Escopo e roteamento

A lógica de escopo fica em `scripts/ci-changed-scope.mjs` e é coberta por testes unitários em `src/scripts/ci-changed-scope.test.ts`. O dispatch manual ignora a detecção de escopo alterado e faz o manifesto de preflight agir como se todas as áreas com escopo tivessem mudado.

- **Edições no workflow de CI** validam o grafo da CI em Node mais o lint de workflow, mas não forçam builds nativos de Windows, Android ou macOS por si só; essas lanes de plataforma continuam restritas a alterações no código-fonte da plataforma.
- **Edições apenas de roteamento da CI, edições selecionadas de fixtures baratas de testes core e edições estreitas de helper/roteamento de testes de contrato de Plugin** usam um caminho rápido de manifesto somente Node: `preflight`, segurança e uma única tarefa `checks-fast-core`. Esse caminho pula artefatos de build, compatibilidade com Node 22, contratos de canais, shards core completos, shards de Plugin empacotado e matrizes adicionais de guardas quando a alteração se limita às superfícies de roteamento ou helper que a tarefa rápida exercita diretamente.
- **Verificações Node no Windows** têm escopo limitado a wrappers específicos de processo/caminho no Windows, helpers de runner npm/pnpm/UI, configuração de gerenciador de pacotes e as superfícies do workflow de CI que executam essa lane; alterações não relacionadas em código-fonte, Plugin, install-smoke e apenas testes ficam nas lanes Node do Linux.

As famílias mais lentas de testes Node são divididas ou balanceadas para que cada job permaneça pequeno sem reservar runners em excesso: contratos de canais rodam como três shards ponderados, lanes core unit fast/support rodam separadamente, a infraestrutura core de runtime é dividida entre shards de state e process/config, auto-reply roda como workers balanceados (com a subárvore de reply dividida em shards agent-runner, dispatch e commands/state-routing), e configurações agentic de Gateway/server são divididas entre lanes chat/auth/model/http-plugin/runtime/startup em vez de esperar por artefatos compilados. Testes amplos de browser, QA, mídia e Plugins diversos usam suas configs Vitest dedicadas em vez do catch-all compartilhado de Plugin. Shards de include-pattern registram entradas de tempo usando o nome do shard da CI, para que `.artifacts/vitest-shard-timings.json` consiga distinguir uma config inteira de um shard filtrado. `check-additional` mantém o trabalho de compile/canary de package-boundary junto e separa a arquitetura de topologia de runtime da cobertura de watch do Gateway; a lista de guardas de boundary é distribuída por quatro shards de matriz, cada um executando guardas independentes selecionadas concorrentemente e imprimindo tempos por verificação, incluindo `pnpm prompt:snapshots:check`, para que o drift de prompt do caminho feliz do runtime do Codex fique preso ao PR que o causou. Gateway watch, testes de canais e o shard core support-boundary rodam concorrentemente dentro de `build-artifacts` depois que `dist/` e `dist-runtime/` já foram compilados.

A CI do Android executa tanto `testPlayDebugUnitTest` quanto `testThirdPartyDebugUnitTest` e depois compila o APK debug do Play. O flavor third-party não tem source set nem manifesto separados; sua lane de testes unitários ainda compila o flavor com as flags BuildConfig de SMS/call-log, evitando ao mesmo tempo um job duplicado de empacotamento de APK debug em cada push relevante para Android.

O shard `check-dependencies` executa `pnpm deadcode:dependencies` (uma passagem do Knip somente para dependências de produção fixada na versão mais recente do Knip, com a idade mínima de release do pnpm desabilitada para a instalação via `dlx`) e `pnpm deadcode:unused-files`, que compara as descobertas de arquivos de produção não usados pelo Knip com `scripts/deadcode-unused-files.allowlist.mjs`. A guarda de arquivos não usados falha quando um PR adiciona um novo arquivo não usado sem revisão ou deixa uma entrada obsoleta na allowlist, preservando superfícies intencionais de Plugin dinâmico, geradas, de build, de testes live e de ponte de pacote que o Knip não consegue resolver estaticamente.

## Encaminhamento de atividade do ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` é a ponte do lado de destino da atividade do repositório OpenClaw para o ClawSweeper. Ele não faz checkout nem executa código não confiável de pull requests. O workflow cria um token de GitHub App a partir de `CLAWSWEEPER_APP_PRIVATE_KEY` e então despacha payloads compactos de `repository_dispatch` para `openclaw/clawsweeper`.

O workflow tem quatro lanes:

- `clawsweeper_item` para solicitações exatas de revisão de issues e pull requests;
- `clawsweeper_comment` para comandos explícitos do ClawSweeper em comentários de issues;
- `clawsweeper_commit_review` para solicitações de revisão em nível de commit em pushes para `main`;
- `github_activity` para atividade geral do GitHub que o agente ClawSweeper pode inspecionar.

A lane `github_activity` encaminha apenas metadados normalizados: tipo de evento, ação, ator, repositório, número do item, URL, título, estado e trechos curtos de comentários ou reviews quando presentes. Ela evita intencionalmente encaminhar o corpo completo do Webhook. O workflow receptor em `openclaw/clawsweeper` é `.github/workflows/github-activity.yml`, que publica o evento normalizado no hook do OpenClaw Gateway para o agente ClawSweeper.

Atividade geral é observação, não entrega por padrão. O agente ClawSweeper recebe o destino Discord em seu prompt e deve postar em `#clawsweeper` somente quando o evento for surpreendente, acionável, arriscado ou operacionalmente útil. Aberturas rotineiras, edições, ruído de bots, ruído de Webhook duplicado e tráfego normal de reviews devem resultar em `NO_REPLY`.

Trate títulos, comentários, corpos, textos de review, nomes de branches e mensagens de commit do GitHub como dados não confiáveis em todo este caminho. Eles são entrada para sumarização e triagem, não instruções para o workflow ou runtime do agente.

## Dispatches manuais

As execuções manuais de CI executam o mesmo grafo de jobs da CI normal, mas forçam a ativação de todas as lanes com escopo não Android: shards Linux Node, shards de Plugins incluídos, contratos de canal, compatibilidade com Node 22, `check`, `check-additional`, smoke de build, verificações da documentação, Skills Python, Windows, macOS e i18n da Control UI. Execuções manuais autônomas de CI executam apenas Android com `include_android=true`; o guarda-chuva de lançamento completo habilita Android passando `include_android=true`. Verificações estáticas de pré-lançamento de Plugin, o shard exclusivo de lançamento `agentic-plugins`, a varredura completa em lote de extensão e as lanes Docker de pré-lançamento de Plugin são excluídos da CI. A suíte Docker de pré-lançamento executa apenas quando `Full Release Validation` despacha o workflow separado `Plugin Prerelease` com o gate de validação de lançamento habilitado.

Execuções manuais usam um grupo de concorrência exclusivo, para que uma suíte completa candidata a lançamento não seja cancelada por outra execução de push ou PR na mesma ref. A entrada opcional `target_ref` permite que um chamador confiável execute esse grafo em relação a uma branch, tag ou SHA completo de commit usando o arquivo de workflow da ref de despacho selecionada.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, jobs rápidos de segurança e agregados (`security-scm-fast`, `security-dependency-audit`, `security-fast`), verificações rápidas de protocolo/contrato/itens incluídos, verificações shardizadas de contrato de canal, shards de `check` exceto lint, agregados de `check-additional`, verificadores agregados de teste Node, verificações da documentação, Skills Python, workflow-sanity, labeler, auto-response; o preflight de install-smoke também usa Ubuntu hospedado pelo GitHub para que a matriz Blacksmith possa entrar na fila mais cedo |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shards de extensão mais leves, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` e `check-test-types`                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shards de teste Linux Node, shards de teste de Plugin incluído, shards de `check-additional`, `android`                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (sensível a CPU o bastante para que 8 vCPU custassem mais do que economizavam); builds Docker de install-smoke (o tempo de fila de 32 vCPU custava mais do que economizava)                                                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` em `openclaw/openclaw`; forks usam `macos-latest` como fallback                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` em `openclaw/openclaw`; forks usam `macos-latest` como fallback                                                                                                                                                                                                                                                                                                                                                                                      |

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

O despacho manual normalmente mede a ref do workflow. Defina `target_ref` para medir uma tag de lançamento ou outra branch com a implementação atual do workflow. Caminhos de relatórios publicados e ponteiros mais recentes são indexados pela ref testada, e cada `index.md` registra a ref/SHA testada, a ref/SHA do workflow, a ref do Kova, o perfil, o modo de autenticação da lane, o modelo, a contagem de repetições e filtros de cenário.

O workflow instala o OCM de um lançamento fixado e o Kova de `openclaw/Kova` na entrada fixada `kova_ref`, depois executa três lanes:

- `mock-provider`: cenários de diagnóstico Kova contra um runtime de build local com autenticação falsa determinística compatível com OpenAI.
- `mock-deep-profile`: profiling de CPU/heap/trace para pontos críticos de inicialização, Gateway e turno de agente.
- `live-gpt54`: um turno real de agente OpenAI `openai/gpt-5.4`, ignorado quando `OPENAI_API_KEY` está indisponível.

A lane mock-provider também executa probes de origem nativos do OpenClaw após a passagem do Kova: timing de boot e memória do Gateway nos casos de inicialização padrão, hook e 50 Plugins; loops hello repetidos `channel-chat-baseline` com OpenAI simulado; e comandos de inicialização da CLI contra o Gateway iniciado. O resumo Markdown do probe de origem fica em `source/index.md` no pacote de relatório, com JSON bruto ao lado.

Cada lane envia artefatos do GitHub. Quando `CLAWGRIT_REPORTS_TOKEN` está configurado, o workflow também faz commit de `report.json`, `report.md`, pacotes, `index.md` e artefatos de probe de origem em `openclaw/clawgrit-reports` sob `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. O ponteiro atual da ref testada é gravado como `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validação completa de lançamento

`Full Release Validation` é o workflow manual guarda-chuva para "executar tudo antes do lançamento". Ele aceita uma branch, tag ou SHA completo de commit, despacha o workflow manual `CI` com esse alvo, despacha `Plugin Prerelease` para prova exclusiva de lançamento de Plugin/pacote/estática/Docker e despacha `OpenClaw Release Checks` para smoke de instalação, aceitação de pacote, verificações de pacote entre sistemas operacionais, paridade do QA Lab, Matrix e lanes Telegram. Execuções estáveis/padrão mantêm cobertura live/E2E exaustiva e de caminho de lançamento Docker atrás de `run_release_soak=true`; `release_profile=full` força essa cobertura de soak para que validações amplas de advisory permaneçam amplas. Com `rerun_group=all` e `release_profile=full`, ele também executa `NPM Telegram Beta E2E` contra o artefato `release-package-under-test` das verificações de lançamento. Após a publicação, passe `npm_telegram_package_spec` para executar novamente a mesma lane de pacote Telegram contra o pacote npm publicado.

Consulte [Validação completa de lançamento](/pt-BR/reference/full-release-validation) para a
matriz de estágios, nomes exatos de jobs do workflow, diferenças de perfil, artefatos e
identificadores de nova execução focada.

`OpenClaw Release Publish` é o workflow manual de lançamento com mutação. Despache-o
a partir de `release/YYYY.M.D` ou `main` depois que a tag de lançamento existir e depois que o
preflight npm do OpenClaw tiver sido bem-sucedido. Ele verifica `pnpm plugins:sync:check`,
despacha `Plugin NPM Release` para todos os pacotes de Plugin publicáveis, despacha
`Plugin ClawHub Release` para o mesmo SHA de lançamento e só então despacha
`OpenClaw NPM Release` com o `preflight_run_id` salvo.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Para prova de commit fixado em uma branch de movimentação rápida, use o helper em vez de
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Refs de despacho de workflow do GitHub devem ser branches ou tags, não SHAs brutos de commit. O
helper envia uma branch temporária `release-ci/<sha>-...` no SHA alvo,
despacha `Full Release Validation` a partir dessa ref fixada, verifica se o `headSha` de cada workflow
filho corresponde ao alvo e exclui a branch temporária quando a execução é concluída. O verificador
guarda-chuva também falha se qualquer workflow filho tiver executado em um SHA
diferente.

`release_profile` controla a abrangência de live/provedores passada para as verificações de lançamento. Os workflows manuais de lançamento usam `stable` por padrão; use `full` somente quando você quiser intencionalmente a matriz ampla consultiva de provedores/mídia. `run_release_soak` controla se as verificações de lançamento estáveis/padrão executam o soak exaustivo de live/E2E e de caminho de lançamento Docker; `full` força o soak.

- `minimum` mantém as lanes OpenAI/core críticas de lançamento mais rápidas.
- `stable` adiciona o conjunto estável de provedores/backends.
- `full` executa a matriz ampla consultiva de provedores/mídia.

O guarda-chuva registra os ids das execuções filhas disparadas, e o job final `Verify full validation` verifica novamente as conclusões atuais das execuções filhas e acrescenta tabelas dos jobs mais lentos para cada execução filha. Se um workflow filho for executado novamente e ficar verde, execute novamente apenas o job verificador pai para atualizar o resultado do guarda-chuva e o resumo de tempos.

Para recuperação, tanto `Full Release Validation` quanto `OpenClaw Release Checks` aceitam `rerun_group`. Use `all` para um candidato de lançamento, `ci` somente para o filho normal de CI completo, `plugin-prerelease` somente para o filho de pré-lançamento de Plugin, `release-checks` para todos os filhos de lançamento, ou um grupo mais estreito: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` no guarda-chuva. Isso mantém delimitada a reexecução de uma caixa de lançamento com falha depois de uma correção focada. Para uma lane cross-OS com falha, combine `rerun_group=cross-os` com `cross_os_suite_filter`, por exemplo `windows/packaged-upgrade`; comandos cross-OS longos emitem linhas de Heartbeat, e resumos de packaged-upgrade incluem tempos por fase. As lanes de verificação de lançamento de QA são consultivas, portanto falhas somente de QA avisam, mas não bloqueiam o verificador de release-check.

`OpenClaw Release Checks` usa a ref de workflow confiável para resolver a ref selecionada uma vez em um tarball `release-package-under-test`, depois passa esse artefato para verificações cross-OS e Package Acceptance, além do workflow Docker de caminho de lançamento live/E2E quando a cobertura de soak é executada. Isso mantém os bytes do pacote consistentes entre caixas de lançamento e evita reempacotar o mesmo candidato em vários jobs filhos.

Execuções duplicadas de `Full Release Validation` para `ref=main` e `rerun_group=all`
substituem o guarda-chuva mais antigo. O monitor pai cancela qualquer workflow filho que
já tenha disparado quando o pai é cancelado, para que validações mais novas de main
não fiquem atrás de uma execução obsoleta de release-check de duas horas. Validação de branch/tag
de lançamento e grupos de reexecução focados mantêm `cancel-in-progress: false`.

## Shards live e E2E

O filho live/E2E de lançamento mantém cobertura ampla nativa de `pnpm test:live`, mas a executa como shards nomeados por meio de `scripts/test-live-shard.mjs` em vez de um job serial:

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
- shards separados de mídia de áudio/vídeo e shards de música filtrados por provedor

Isso mantém a mesma cobertura de arquivos, enquanto torna falhas lentas de provedores live mais fáceis de reexecutar e diagnosticar. Os nomes agregados de shard `native-live-extensions-o-z`, `native-live-extensions-media` e `native-live-extensions-media-music` continuam válidos para reexecuções manuais pontuais.

Os shards de mídia live nativos são executados em `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, construído pelo workflow `Live Media Runner Image`. Essa imagem pré-instala `ffmpeg` e `ffprobe`; jobs de mídia apenas verificam os binários antes da configuração. Mantenha suítes live baseadas em Docker em runners Blacksmith normais — jobs em contêiner são o lugar errado para iniciar testes Docker aninhados.

Shards live de modelo/backend baseados em Docker usam uma imagem compartilhada separada `ghcr.io/openclaw/openclaw-live-test:<sha>` por commit selecionado. O workflow de lançamento live constrói e envia essa imagem uma vez, depois os shards de modelo live Docker, Gateway particionado por provedor, backend de CLI, bind ACP e harness Codex rodam com `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shards Docker de Gateway carregam limites explícitos de `timeout` no nível de script abaixo do timeout do job de workflow, para que um contêiner travado ou caminho de limpeza falhe rapidamente em vez de consumir todo o orçamento de release-check. Se esses shards reconstruírem independentemente o alvo Docker completo do código-fonte, a execução de lançamento está mal configurada e desperdiçará tempo de parede com builds de imagem duplicados.

## Package Acceptance

Use `Package Acceptance` quando a pergunta for "este pacote instalável do OpenClaw funciona como produto?" Ele é diferente do CI normal: o CI normal valida a árvore de código-fonte, enquanto a aceitação de pacote valida um único tarball pelo mesmo harness Docker E2E que usuários exercitam após instalar ou atualizar.

### Jobs

1. `resolve_package` faz checkout de `workflow_ref`, resolve um candidato de pacote, grava `.artifacts/docker-e2e-package/openclaw-current.tgz`, grava `.artifacts/docker-e2e-package/package-candidate.json`, envia ambos como o artefato `package-under-test` e imprime a origem, a ref do workflow, a ref do pacote, a versão, o SHA-256 e o perfil no resumo da etapa do GitHub.
2. `docker_acceptance` chama `openclaw-live-and-e2e-checks-reusable.yml` com `ref=workflow_ref` e `package_artifact_name=package-under-test`. O workflow reutilizável baixa esse artefato, valida o inventário do tarball, prepara imagens Docker com digest de pacote quando necessário e executa as lanes Docker selecionadas contra esse pacote em vez de empacotar o checkout do workflow. Quando um perfil seleciona múltiplas `docker_lanes` direcionadas, o workflow reutilizável prepara o pacote e as imagens compartilhadas uma vez, depois distribui essas lanes como jobs Docker direcionados paralelos com artefatos únicos.
3. `package_telegram` opcionalmente chama `NPM Telegram Beta E2E`. Ele roda quando `telegram_mode` não é `none` e instala o mesmo artefato `package-under-test` quando Package Acceptance resolveu um; um disparo independente do Telegram ainda pode instalar uma especificação npm publicada.
4. `summary` falha o workflow se a resolução de pacote, a aceitação Docker ou a lane opcional do Telegram falharem.

### Origens de candidatos

- `source=npm` aceita somente `openclaw@beta`, `openclaw@latest` ou uma versão exata de lançamento do OpenClaw, como `openclaw@2026.4.27-beta.2`. Use isso para aceitação de pré-lançamento/estável publicado.
- `source=ref` empacota uma branch, tag ou SHA de commit completo confiável em `package_ref`. O resolvedor busca branches/tags do OpenClaw, verifica se o commit selecionado é alcançável pelo histórico de branches do repositório ou por uma tag de lançamento, instala dependências em uma worktree destacada e o empacota com `scripts/package-openclaw-for-docker.mjs`.
- `source=url` baixa um `.tgz` HTTPS; `package_sha256` é obrigatório.
- `source=artifact` baixa um `.tgz` de `artifact_run_id` e `artifact_name`; `package_sha256` é opcional, mas deve ser fornecido para artefatos compartilhados externamente.

Mantenha `workflow_ref` e `package_ref` separados. `workflow_ref` é o código confiável de workflow/harness que executa o teste. `package_ref` é o commit de origem que é empacotado quando `source=ref`. Isso permite que o harness de teste atual valide commits de origem confiáveis mais antigos sem executar lógica antiga de workflow.

### Perfis de suíte

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` mais `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — blocos completos Docker de caminho de lançamento com OpenWebUI
- `custom` — `docker_lanes` exatas; obrigatório quando `suite_profile=custom`

O perfil `package` usa cobertura de Plugin offline para que a validação de pacote publicado não dependa da disponibilidade live do ClawHub. A lane opcional do Telegram reutiliza o artefato `package-under-test` em `NPM Telegram Beta E2E`, com o caminho de especificação npm publicada mantido para disparos independentes.

Para a política dedicada de teste de atualizações e Plugins, incluindo comandos locais,
lanes Docker, entradas de Package Acceptance, padrões de lançamento e triagem de falhas,
consulte [Testando atualizações e Plugins](/pt-BR/help/testing-updates-plugins).

As verificações de lançamento chamam Package Acceptance com `source=artifact`, o artefato preparado de pacote de lançamento, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` e `telegram_mode=mock-openai`. Isso mantém a migração de pacote, atualização, limpeza de dependência de Plugin obsoleta, reparo de instalação de Plugin configurado, Plugin offline, atualização de Plugin e prova do Telegram no mesmo tarball de pacote resolvido. Defina `package_acceptance_package_spec` em Full Release Validation ou OpenClaw Release Checks para executar essa mesma matriz contra um pacote npm enviado em vez do artefato construído a partir do SHA. Verificações de lançamento cross-OS ainda cobrem onboarding, instalador e comportamento de plataforma específicos de SO; validação de produto de pacote/atualização deve começar com Package Acceptance. A lane Docker `published-upgrade-survivor` valida uma baseline de pacote publicado por execução no caminho de lançamento bloqueante. Em Package Acceptance, o tarball `package-under-test` resolvido é sempre o candidato, e `published_upgrade_survivor_baseline` seleciona a baseline publicada de fallback, com padrão `openclaw@latest`; comandos de reexecução de lane com falha preservam essa baseline. Full Release Validation com `run_release_soak=true` ou `release_profile=full` define `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` e `published_upgrade_survivor_scenarios=reported-issues` para expandir entre os quatro lançamentos npm estáveis mais recentes, além de lançamentos fixados de fronteira de compatibilidade de Plugin e fixtures com formato de issues para configuração Feishu, arquivos bootstrap/persona preservados, instalações configuradas de Plugin do OpenClaw, caminhos de log com til e raízes obsoletas de dependência de Plugin legado. Seleções multi-baseline de published-upgrade survivor são particionadas por baseline em jobs separados de runner Docker direcionado. O workflow separado `Update Migration` usa a lane Docker `update-migration` com `all-since-2026.4.23` e `plugin-deps-cleanup` quando a pergunta é limpeza exaustiva de atualização publicada, não a abrangência normal de Full Release CI. Execuções agregadas locais podem passar especificações exatas de pacote com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, manter uma única lane com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, como `openclaw@2026.4.15`, ou definir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para a matriz de cenários. A lane publicada configura a baseline com uma receita embutida de comando `openclaw config set`, registra etapas da receita em `summary.json` e testa `/healthz`, `/readyz` e status RPC após o início do Gateway. As lanes frescas empacotadas e de instalador no Windows também verificam que um pacote instalado consegue importar uma substituição de browser-control de um caminho absoluto bruto do Windows. O smoke cross-OS de turno de agente OpenAI usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` por padrão quando definido, caso contrário `openai/gpt-5.4`, para que a prova de instalação e Gateway permaneça em um modelo de teste GPT-5, evitando padrões GPT-4.x.

### Janelas de compatibilidade legada

Package Acceptance tem janelas delimitadas de compatibilidade legada para pacotes já publicados. Pacotes até `2026.4.25`, incluindo `2026.4.25-beta.*`, podem usar o caminho de compatibilidade:

- entradas QA privadas conhecidas em `dist/postinstall-inventory.json` podem apontar para arquivos omitidos do tarball;
- `doctor-switch` pode pular o subcaso de persistência de `gateway install --wrapper` quando o pacote não expõe essa flag;
- `update-channel-switch` pode remover `pnpm.patchedDependencies` ausentes da fixture git falsa derivada do tarball e pode registrar `update.channel` persistido ausente;
- smokes de Plugin podem ler locais legados de install-record ou aceitar persistência ausente de install-record do marketplace;
- `plugin-update` pode permitir migração de metadados de configuração, ainda exigindo que o registro de instalação e o comportamento de não reinstalação permaneçam inalterados.

O pacote `2026.4.26` publicado também pode avisar sobre arquivos de carimbo de metadados de build local que já foram enviados. Pacotes posteriores devem satisfazer os contratos modernos; as mesmas condições falham em vez de avisar ou pular.

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

Ao depurar uma execução de aceitação de pacote com falha, comece pelo resumo de `resolve_package` para confirmar a origem, a versão e o SHA-256 do pacote. Depois inspecione a execução filha `docker_acceptance` e seus artefatos Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logs de lanes, tempos de fases e comandos de reexecução. Prefira reexecutar o perfil de pacote que falhou ou as lanes Docker exatas em vez de reexecutar a validação completa de release.

## Smoke de instalação

O workflow `Install Smoke` separado reutiliza o mesmo script de escopo por meio do seu próprio job `preflight`. Ele divide a cobertura smoke em `run_fast_install_smoke` e `run_full_install_smoke`.

- **Caminho rápido** é executado para pull requests que tocam superfícies Docker/pacote, alterações em pacote/manifesto de Plugin empacotado ou superfícies centrais de plugin/canal/gateway/Plugin SDK que os jobs de smoke Docker exercitam. Alterações apenas de código-fonte em Plugin empacotado, edições apenas de teste e edições apenas de documentação não reservam workers Docker. O caminho rápido cria a imagem do Dockerfile raiz uma vez, verifica a CLI, executa o smoke da CLI de exclusão de agents em workspace compartilhado, executa o e2e de rede de gateway em contêiner, verifica um argumento de build de extensão empacotada e executa o perfil Docker limitado de Plugin empacotado sob um timeout agregado de comando de 240 segundos (com cada execução Docker de cenário limitada separadamente).
- **Caminho completo** mantém a instalação de pacote por QR e a cobertura Docker/update do instalador para execuções agendadas noturnas, dispatches manuais, verificações de release por workflow-call e pull requests que realmente tocam superfícies de instalador/pacote/Docker. No modo completo, install-smoke prepara ou reutiliza uma imagem de smoke do Dockerfile raiz GHCR para o SHA alvo e depois executa instalação de pacote por QR, smokes do Dockerfile raiz/gateway, smokes de instalador/update e o E2E Docker rápido de Plugin empacotado como jobs separados, para que o trabalho de instalador não espere pelos smokes da imagem raiz.

Pushes para `main` (incluindo commits de merge) não forçam o caminho completo; quando a lógica de escopo alterado solicitaria cobertura completa em um push, o workflow mantém o smoke Docker rápido e deixa o smoke completo de instalação para a validação noturna ou de release.

O smoke lento de instalação global Bun do provedor de imagem é controlado separadamente por `run_bun_global_install_smoke`. Ele é executado no agendamento noturno e a partir do workflow de verificações de release, e dispatches manuais de `Install Smoke` podem optar por incluí-lo, mas pull requests e pushes para `main` não. Os testes Docker de QR e instalador mantêm seus próprios Dockerfiles focados em instalação.

## E2E Docker local

`pnpm test:docker:all` pré-cria uma imagem compartilhada de teste live, empacota o OpenClaw uma vez como um tarball npm e cria duas imagens `scripts/e2e/Dockerfile` compartilhadas:

- um executor Node/Git básico para lanes de instalador/update/dependência de plugin;
- uma imagem funcional que instala o mesmo tarball em `/app` para lanes de funcionalidade normal.

As definições de lanes Docker ficam em `scripts/lib/docker-e2e-scenarios.mjs`, a lógica do planejador fica em `scripts/lib/docker-e2e-plan.mjs`, e o executor apenas executa o plano selecionado. O agendador seleciona a imagem por lane com `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, depois executa as lanes com `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Ajustes

| Variável                               | Padrão  | Finalidade                                                                                     |
| -------------------------------------- | ------- | ---------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Contagem de slots do pool principal para lanes normais.                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Contagem de slots do pool final sensível a provedores.                                         |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Limite de lanes live simultâneas para que provedores não apliquem throttling.                  |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Limite de lanes simultâneas de instalação npm.                                                 |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Limite de lanes simultâneas com múltiplos serviços.                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Intervalo entre inícios de lanes para evitar tempestades de criação no daemon Docker; defina `0` para nenhum intervalo. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Timeout de fallback por lane (120 minutos); lanes live/finais selecionadas usam limites mais rígidos. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` imprime o plano do agendador sem executar lanes.                                           |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Lista separada por vírgulas de lanes exatas; pula o smoke de limpeza para que agents possam reproduzir uma lane com falha. |

Uma lane mais pesada que seu limite efetivo ainda pode iniciar a partir de um pool vazio, depois roda sozinha até liberar capacidade. O agregado local faz preflights do Docker, remove contêineres E2E obsoletos do OpenClaw, emite status de lanes ativas, persiste tempos de lanes para ordenação das mais longas primeiro e, por padrão, para de agendar novas lanes em pool após a primeira falha.

### Workflow live/E2E reutilizável

O fluxo de trabalho reutilizável ao vivo/E2E pergunta a `scripts/test-docker-all.mjs --plan-json` qual pacote, tipo de imagem, imagem ao vivo, lane e cobertura de credenciais são necessários. Em seguida, `scripts/docker-e2e.mjs` converte esse plano em saídas e resumos do GitHub. Ele empacota o OpenClaw por meio de `scripts/package-openclaw-for-docker.mjs`, baixa um artefato de pacote da execução atual ou baixa um artefato de pacote de `package_artifact_run_id`; valida o inventário do tarball; compila e envia imagens Docker E2E GHCR bare/functional com tags de digest do pacote por meio do cache de camadas Docker da Blacksmith quando o plano precisa de lanes com pacote instalado; e reutiliza entradas `docker_e2e_bare_image`/`docker_e2e_functional_image` fornecidas ou imagens existentes de digest do pacote em vez de recompilar. As extrações de imagem Docker são repetidas com um timeout limitado de 180 segundos por tentativa, para que um fluxo de registry/cache travado tente novamente rapidamente em vez de consumir a maior parte do caminho crítico da CI.

### Blocos do caminho de lançamento

A cobertura Docker de lançamento executa jobs menores em blocos com `OPENCLAW_SKIP_DOCKER_BUILD=1`, para que cada bloco extraia apenas o tipo de imagem de que precisa e execute várias lanes pelo mesmo agendador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Os blocos Docker de lançamento atuais são `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` e de `plugins-runtime-install-a` até `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` continuam sendo aliases agregados de plugin/runtime. O alias de lane `install-e2e` continua sendo o alias agregado de reexecução manual para ambas as lanes de instalador de provedor.

OpenWebUI é incorporado a `plugins-runtime-services` quando a cobertura completa do caminho de lançamento o solicita, e mantém um bloco independente `openwebui` apenas para dispatches exclusivos de OpenWebUI. Lanes de atualização de canais incluídos tentam novamente uma vez em caso de falhas transitórias de rede do npm.

Cada bloco envia `.artifacts/docker-tests/` com logs de lane, tempos, `summary.json`, `failures.json`, tempos de fase, JSON do plano do agendador, tabelas de lanes lentas e comandos de reexecução por lane. A entrada `docker_lanes` do fluxo de trabalho executa lanes selecionadas contra as imagens preparadas em vez dos jobs de bloco, o que mantém a depuração de lanes com falha limitada a um job Docker direcionado e prepara, baixa ou reutiliza o artefato de pacote para essa execução; se uma lane selecionada for uma lane Docker ao vivo, o job direcionado compila localmente a imagem de teste ao vivo para essa reexecução. Os comandos de reexecução por lane gerados para o GitHub incluem `package_artifact_run_id`, `package_artifact_name` e entradas de imagem preparadas quando esses valores existem, para que uma lane com falha possa reutilizar o pacote e as imagens exatos da execução com falha.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

O fluxo de trabalho agendado ao vivo/E2E executa diariamente a suíte Docker completa do caminho de lançamento.

## Pré-lançamento de Plugin

`Plugin Prerelease` é uma cobertura de produto/pacote mais cara, portanto é um fluxo de trabalho separado disparado por `Full Release Validation` ou por um operador explícito. Pull requests normais, pushes para `main` e dispatches manuais independentes de CI mantêm essa suíte desativada. Ele equilibra testes de plugins incluídos em oito workers de extensão; esses jobs de shard de extensão executam até dois grupos de configuração de plugin por vez, com um worker Vitest por grupo e um heap Node maior, para que lotes de plugin com muitas importações não criem jobs extras de CI. O caminho Docker de pré-lançamento exclusivo de lançamento agrupa lanes Docker direcionadas em pequenos grupos para evitar reservar dezenas de runners para jobs de um a três minutos.

## QA Lab

QA Lab tem lanes de CI dedicadas fora do fluxo de trabalho principal com escopo inteligente. A paridade agêntica fica aninhada nos harnesses amplos de QA e lançamento, não em um fluxo de trabalho independente de PR. Use `Full Release Validation` com `rerun_group=qa-parity` quando a paridade deve acompanhar uma execução ampla de validação.

- O fluxo de trabalho `QA-Lab - All Lanes` é executado todas as noites em `main` e em dispatch manual; ele distribui a lane de paridade mock, a lane Matrix ao vivo e as lanes Telegram e Discord ao vivo como jobs paralelos. Jobs ao vivo usam o ambiente `qa-live-shared`, e Telegram/Discord usam leases Convex.

As verificações de lançamento executam lanes de transporte ao vivo Matrix e Telegram com o provedor mock determinístico e modelos qualificados para mock (`mock-openai/gpt-5.5` e `mock-openai/gpt-5.5-alt`), para que o contrato do canal seja isolado da latência do modelo ao vivo e da inicialização normal do plugin de provedor. O Gateway de transporte ao vivo desativa a busca de memória porque a paridade de QA cobre o comportamento de memória separadamente; a conectividade do provedor é coberta pelas suítes separadas de modelo ao vivo, provedor nativo e provedor Docker.

Matrix usa `--profile fast` para gates agendados e de lançamento, adicionando `--fail-fast` apenas quando a CLI em checkout oferece suporte. O padrão da CLI e a entrada manual do fluxo de trabalho continuam sendo `all`; o dispatch manual `matrix_profile=all` sempre divide a cobertura completa da Matrix em jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`.

`OpenClaw Release Checks` também executa as lanes críticas de lançamento do QA Lab antes da aprovação de lançamento; seu gate de paridade de QA executa os pacotes candidato e baseline como jobs de lane paralelos, depois baixa ambos os artefatos em um pequeno job de relatório para a comparação final de paridade.

Para PRs normais, siga a evidência de CI/verificação em escopo em vez de tratar paridade como um status obrigatório.

## CodeQL

O workflow `CodeQL` é intencionalmente um scanner de segurança inicial e restrito, não uma varredura completa do repositório. Execuções diárias, manuais e de proteção de pull requests que não sejam rascunho analisam código de workflows do Actions, além das superfícies JavaScript/TypeScript de maior risco com consultas de segurança de alta confiança filtradas para `security-severity` alta/crítica.

A proteção de pull requests permanece leve: ela só inicia para alterações em `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` ou `src`, e executa a mesma matriz de segurança de alta confiança do workflow agendado. CodeQL para Android e macOS ficam fora dos padrões de PR.

### Categorias de segurança

| Categoria                                         | Superfície                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Linha de base de auth, segredos, sandbox, cron e gateway                                                                            |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementação do canal principal, além do runtime do Plugin de canal, gateway, Plugin SDK, segredos e pontos de auditoria |
| `/codeql-security-high/network-ssrf-boundary`     | Superfícies de SSRF principal, análise de IP, proteção de rede, web-fetch e política de SSRF do Plugin SDK                          |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, auxiliares de execução de processos, entrega de saída e gates de execução de ferramentas de agentes                 |
| `/codeql-security-high/plugin-trust-boundary`     | Superfícies de confiança de instalação de Plugin, loader, manifesto, registro, instalação do gerenciador de pacotes, carregamento de código-fonte e contrato de pacote do Plugin SDK |

### Fragmentos de segurança específicos de plataforma

- `CodeQL Android Critical Security` — fragmento agendado de segurança para Android. Compila o app Android manualmente para CodeQL no menor runner Blacksmith Linux aceito pela sanidade do workflow. Envia para `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — fragmento semanal/manual de segurança para macOS. Compila o app macOS manualmente para CodeQL no Blacksmith macOS, filtra resultados de build de dependências para fora do SARIF enviado e envia para `/codeql-critical-security/macos`. Mantido fora dos padrões diários porque o build do macOS domina o tempo de execução mesmo quando está limpo.

### Categorias de qualidade crítica

`CodeQL Critical Quality` é o fragmento correspondente que não é de segurança. Ele executa apenas consultas de qualidade JavaScript/TypeScript de severidade erro e não relacionadas a segurança sobre superfícies restritas de alto valor no runner Blacksmith Linux menor. Sua proteção de pull requests é intencionalmente menor que o perfil agendado: PRs que não sejam rascunho executam apenas os fragmentos correspondentes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` e `plugin-sdk-reply-runtime` para alterações em código de execução de comandos/modelos/ferramentas de agentes e despacho de respostas, código de schema/migração/IO de configuração, código de auth/segredos/sandbox/segurança, canal principal e runtime de Plugin de canal integrado, protocolo/método de servidor de gateway, runtime de memória/cola do SDK, MCP/processo/entrega de saída, runtime de provider/catálogo de modelos, diagnósticos de sessão/filas de entrega, loader de Plugin, Plugin SDK/contrato de pacote ou runtime de resposta do Plugin SDK. Alterações na configuração do CodeQL e no workflow de qualidade executam todos os doze fragmentos de qualidade de PR.

O despacho manual aceita:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Os perfis restritos são hooks de ensino/iteração para executar um fragmento de qualidade isoladamente.

| Categoria                                               | Superfície                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Código de limite de segurança de auth, segredos, sandbox, cron e gateway                                                                                          |
| `/codeql-critical-quality/config-boundary`              | Contratos de schema de configuração, migração, normalização e IO                                                                                                  |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schemas de protocolo do Gateway e contratos de métodos de servidor                                                                                                |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementação do canal principal e do Plugin de canal integrado                                                                                       |
| `/codeql-critical-quality/agent-runtime-boundary`       | Execução de comandos, despacho de modelos/providers, despacho e filas de resposta automática, e contratos de runtime do plano de controle ACP                      |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP e pontes de ferramentas, auxiliares de supervisão de processos e contratos de entrega de saída                                                     |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK do host de memória, facades de runtime de memória, aliases de memória do Plugin SDK, cola de ativação do runtime de memória e comandos doctor de memória      |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internos da fila de respostas, filas de entrega de sessão, auxiliares de associação/entrega de sessão de saída, superfícies de eventos diagnósticos/pacotes de logs e contratos de CLI doctor de sessão |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de respostas recebidas do Plugin SDK, auxiliares de payload/fragmentação/runtime de respostas, opções de resposta de canal, filas de entrega e auxiliares de associação de sessão/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalização de catálogo de modelos, auth e descoberta de provider, registro de runtime de provider, padrões/catálogos de provider e registros de web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap da UI de controle, persistência local, fluxos de controle do Gateway e contratos de runtime do plano de controle de tarefas                             |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratos de runtime de fetch/search web principal, IO de mídia, entendimento de mídia, geração de imagens e geração de mídia                                     |
| `/codeql-critical-quality/plugin-boundary`              | Contratos de loader, registro, superfície pública e ponto de entrada do Plugin SDK                                                                                |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Código-fonte do Plugin SDK do lado do pacote publicado e auxiliares de contrato de pacote de Plugin                                                               |

Qualidade permanece separada de segurança para que descobertas de qualidade possam ser agendadas, medidas, desabilitadas ou expandidas sem obscurecer o sinal de segurança. A expansão de CodeQL para Swift, Python e Plugins integrados deve ser adicionada de volta como trabalho subsequente em escopo ou fragmentado somente depois que os perfis restritos tiverem runtime e sinal estáveis.

## Workflows de manutenção

### Agente de docs

O workflow `Docs Agent` é uma lane de manutenção Codex orientada a eventos para manter docs existentes alinhados com alterações recém-integradas. Ele não tem agendamento puro: uma execução de CI bem-sucedida de push não bot em `main` pode acioná-lo, e o despacho manual pode executá-lo diretamente. Invocações por workflow-run são ignoradas quando `main` avançou ou quando outra execução não ignorada do Docs Agent foi criada na última hora. Quando ele executa, revisa o intervalo de commits desde o SHA de origem anterior não ignorado do Docs Agent até o `main` atual, para que uma execução horária consiga cobrir todas as alterações em main acumuladas desde a última passada de docs.

### Agente de performance de testes

O workflow `Test Performance Agent` é uma lane de manutenção Codex orientada a eventos para testes lentos. Ele não tem agendamento puro: uma execução de CI bem-sucedida de push não bot em `main` pode acioná-lo, mas ele é ignorado se outra invocação por workflow-run já executou ou está em execução naquele dia UTC. O despacho manual ignora esse gate de atividade diária. A lane cria um relatório de performance Vitest agrupado da suíte completa, permite que o Codex faça apenas pequenas correções de performance de testes que preservem cobertura em vez de refatorações amplas, depois reexecuta o relatório da suíte completa e rejeita alterações que reduzam a contagem de testes aprovados na linha de base. Se a linha de base tiver testes falhando, o Codex pode corrigir apenas falhas óbvias, e o relatório de suíte completa pós-agente deve passar antes que qualquer coisa seja commitada. Quando `main` avança antes do push do bot ser integrado, a lane faz rebase do patch validado, reexecuta `pnpm check:changed` e tenta o push novamente; patches obsoletos com conflito são ignorados. Ela usa Ubuntu hospedado pelo GitHub para que a action do Codex possa manter a mesma postura de segurança sem sudo do agente de docs.

### PRs duplicados após o merge

O workflow `Duplicate PRs After Merge` é um workflow manual de mantenedor para limpeza pós-integração de duplicados. Ele usa dry-run por padrão e só fecha PRs explicitamente listados quando `apply=true`. Antes de alterar o GitHub, ele verifica se o PR integrado recebeu merge e se cada duplicado tem uma issue referenciada em comum ou hunks alterados sobrepostos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gates de verificação local e roteamento de alterações

A lógica local de lanes alteradas fica em `scripts/changed-lanes.mjs` e é executada por `scripts/check-changed.mjs`. Esse gate de verificação local é mais estrito sobre limites de arquitetura do que o escopo amplo da plataforma de CI:

- alterações de produção do core executam typecheck de produção do core e de testes do core, além de lint/guards do core;
- alterações apenas em testes do core executam somente typecheck de testes do core, além de lint do core;
- alterações de produção de extensão executam typecheck de produção da extensão e de testes da extensão, além de lint da extensão;
- alterações apenas em testes de extensão executam typecheck de testes da extensão, além de lint da extensão;
- alterações no Plugin SDK público ou no contrato de Plugin expandem para typecheck de extensões porque extensões dependem desses contratos do core (varreduras Vitest de extensões permanecem trabalho explícito de teste);
- aumentos de versão apenas em metadados de release executam verificações direcionadas de versão/configuração/dependências raiz;
- alterações desconhecidas de raiz/configuração falham com segurança para todas as lanes de verificação.

O roteamento local de testes alterados fica em `scripts/test-projects.test-support.mjs` e é intencionalmente mais barato que `check:changed`: edições diretas de testes executam a si mesmas, edições de código-fonte preferem mapeamentos explícitos, depois testes irmãos e dependentes do grafo de importação. A configuração compartilhada de entrega de sala de grupo é um dos mapeamentos explícitos: alterações na configuração de resposta visível em grupo, no modo de entrega de resposta de origem ou no prompt de sistema da ferramenta de mensagens passam pelos testes de resposta do core, além de regressões de entrega do Discord e Slack, para que uma alteração de padrão compartilhado falhe antes do primeiro push de PR. Use `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` somente quando a alteração for ampla o suficiente no harness para que o conjunto barato mapeado não seja um proxy confiável.

## Validação do Testbox

Execute o Testbox a partir da raiz do repositório e prefira uma caixa recém-aquecida para provas amplas. Antes de gastar um gate lento em uma caixa que foi reutilizada, expirou ou acabou de relatar uma sincronização inesperadamente grande, execute `pnpm testbox:sanity` dentro da caixa primeiro.

A verificação de sanidade falha rapidamente quando arquivos raiz obrigatórios, como `pnpm-lock.yaml`, desapareceram ou quando `git status --short` mostra pelo menos 200 exclusões rastreadas. Isso geralmente significa que o estado de sincronização remoto não é uma cópia confiável do PR; pare essa caixa e aqueça uma nova em vez de depurar a falha do teste do produto. Para PRs intencionais com muitas exclusões, defina `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para essa execução de sanidade.

`pnpm testbox:run` também encerra uma invocação local da Blacksmith CLI que permanece na fase de sincronização por mais de cinco minutos sem saída pós-sincronização. Defina `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` para desabilitar essa proteção, ou use um valor maior em milissegundos para diffs locais excepcionalmente grandes.

Crabbox é o wrapper de caixa remota de propriedade do repositório para prova Linux de mantenedores. Use-o quando uma verificação for ampla demais para um loop local de edição, quando a paridade com CI for importante ou quando a prova precisar de segredos, Docker, lanes de pacote, caixas reutilizáveis ou logs remotos. O backend normal do OpenClaw é `blacksmith-testbox`; a capacidade própria em AWS/Hetzner é um fallback para indisponibilidades do Blacksmith, problemas de cota ou testes explícitos em capacidade própria.

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

Leia o resumo JSON final. Os campos úteis são `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` e `totalMs`. Execuções Crabbox únicas com suporte do Blacksmith devem parar o Testbox automaticamente; se uma execução for interrompida ou a limpeza não estiver clara, inspecione as caixas ativas e pare apenas as caixas que você criou:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

Use reutilização somente quando você precisar intencionalmente de vários comandos na mesma caixa hidratada:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Se o Crabbox for a camada quebrada, mas o próprio Blacksmith funcionar, use o Blacksmith direto como um fallback estreito:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Escale para capacidade própria do Crabbox somente quando o Blacksmith estiver fora do ar, limitado por cota, sem o ambiente necessário, ou quando capacidade própria for explicitamente o objetivo:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` controla os padrões de provedor, sincronização e hidratação do GitHub Actions para lanes de nuvem própria. Ele exclui o `.git` local para que o checkout hidratado do Actions mantenha seus próprios metadados remotos do Git em vez de sincronizar remotos e armazenamentos de objetos locais de mantenedores, e exclui artefatos locais de runtime/build que nunca devem ser transferidos. `.github/workflows/crabbox-hydrate.yml` controla checkout, configuração de Node/pnpm, busca de `origin/main` e a transferência de ambiente sem segredos para comandos `crabbox run --id <cbx_id>` em nuvem própria.

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Canais de desenvolvimento](/pt-BR/install/development-channels)
