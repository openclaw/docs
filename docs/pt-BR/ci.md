---
read_when:
    - Você precisa entender por que um job de CI foi executado ou não
    - Você está depurando uma verificação do GitHub Actions que está falhando
    - Você está coordenando uma execução ou reexecução da validação de lançamento
    - Você está alterando o acionamento do ClawSweeper ou o encaminhamento de atividades do GitHub
summary: Grafo de tarefas de CI, controles de escopo, guarda-chuvas de lançamento e equivalentes de comandos locais
title: Pipeline de CI
x-i18n:
    generated_at: "2026-05-04T05:52:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72959d0feaf1339f01c9da263153fd89cc4727da6f928933819931991222714d
    source_path: ci.md
    workflow: 16
---

A CI do OpenClaw é executada em cada push para `main` e em cada pull request. O job `preflight` classifica o diff e desativa lanes caras quando apenas áreas não relacionadas mudaram. Execuções manuais de `workflow_dispatch` ignoram intencionalmente o escopo inteligente e expandem o grafo completo para candidatos a release e validação ampla. As lanes de Android continuam opcionais por meio de `include_android`. A cobertura de Plugins somente de release fica no workflow separado [`Plugin Prerelease`](#plugin-prerelease) e só é executada a partir de [`Full Release Validation`](#full-release-validation) ou de um disparo manual explícito.

## Visão geral do pipeline

| Job                              | Finalidade                                                                                                 | Quando é executado                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Detecta alterações somente de docs, escopos alterados, extensions alteradas e constrói o manifesto de CI   | Sempre em pushes e PRs não rascunho |
| `security-scm-fast`              | Detecção de chaves privadas e auditoria de workflow via `zizmor`                                           | Sempre em pushes e PRs não rascunho |
| `security-dependency-audit`      | Auditoria do lockfile de produção sem dependências contra avisos do npm                                    | Sempre em pushes e PRs não rascunho |
| `security-fast`                  | Agregado obrigatório para os jobs rápidos de segurança                                                     | Sempre em pushes e PRs não rascunho |
| `check-dependencies`             | Passagem do Knip somente para dependências de produção mais a guarda da lista de permissões de arquivos não usados | Alterações relevantes para Node    |
| `build-artifacts`                | Compila `dist/`, Control UI, verificações de artefatos compilados e artefatos downstream reutilizáveis     | Alterações relevantes para Node    |
| `checks-fast-core`               | Lanes rápidas de correção no Linux, como verificações de Plugins empacotados/contratos de Plugin/protocolo | Alterações relevantes para Node    |
| `checks-fast-contracts-channels` | Verificações fragmentadas de contratos de canais com um resultado agregado estável                         | Alterações relevantes para Node    |
| `checks-node-core-test`          | Fragmentos de testes do Node principal, excluindo lanes de canais, Plugins empacotados, contratos e extensions | Alterações relevantes para Node    |
| `check`                          | Equivalente fragmentado do gate local principal: tipos de produção, lint, guardas, tipos de teste e smoke estrito | Alterações relevantes para Node    |
| `check-additional`               | Arquitetura, drift fragmentado de limites/prompts, guardas de extensions, limite de pacote e Gateway watch | Alterações relevantes para Node    |
| `build-smoke`                    | Testes smoke da CLI compilada e smoke de memória de inicialização                                          | Alterações relevantes para Node    |
| `checks`                         | Verificador para testes de canal de artefatos compilados                                                   | Alterações relevantes para Node    |
| `checks-node-compat-node22`      | Lane de build e smoke de compatibilidade com Node 22                                                       | Disparo manual de CI para releases |
| `check-docs`                     | Formatação, lint e verificações de links quebrados da documentação                                         | Docs alteradas                     |
| `skills-python`                  | Ruff + pytest para Skills apoiadas por Python                                                              | Alterações relevantes para Skills em Python |
| `checks-windows`                 | Testes específicos de processo/caminho no Windows mais regressões compartilhadas de especificadores de importação em runtime | Alterações relevantes para Windows |
| `macos-node`                     | Lane de testes TypeScript no macOS usando os artefatos compilados compartilhados                           | Alterações relevantes para macOS   |
| `macos-swift`                    | Lint, build e testes Swift para o app macOS                                                                | Alterações relevantes para macOS   |
| `android`                        | Testes unitários de Android para ambos os flavors mais um build de APK de debug                            | Alterações relevantes para Android |
| `test-performance-agent`         | Otimização diária de testes lentos pelo Codex após atividade confiável                                     | Sucesso da CI principal ou disparo manual |
| `openclaw-performance`           | Relatórios diários/sob demanda de performance do runtime Kova com lanes de mock-provider, deep-profile e GPT 5.4 ao vivo | Disparo agendado e manual          |

## Ordem de falha rápida

1. `preflight` decide quais lanes existem. A lógica de `docs-scope` e `changed-scope` são etapas dentro deste job, não jobs independentes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falham rapidamente sem esperar pelos jobs mais pesados de matriz de artefatos e plataformas.
3. `build-artifacts` se sobrepõe às lanes rápidas de Linux para que consumidores downstream possam começar assim que o build compartilhado estiver pronto.
4. Lanes mais pesadas de plataforma e runtime se expandem depois disso: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

O GitHub pode marcar jobs substituídos como `cancelled` quando um push mais novo chega ao mesmo PR ou ref `main`. Trate isso como ruído de CI, a menos que a execução mais nova para a mesma ref também esteja falhando. Verificações agregadas de fragmentos usam `!cancelled() && always()` para que ainda relatem falhas normais de fragmentos, mas não entrem na fila depois que o workflow inteiro já tiver sido substituído. A chave de concorrência automática da CI é versionada (`CI-v7-*`) para que um zumbi do lado do GitHub em um grupo de fila antigo não possa bloquear indefinidamente execuções mais novas da main. Execuções manuais da suíte completa usam `CI-manual-v1-*` e não cancelam execuções em andamento.

## Escopo e roteamento

A lógica de escopo fica em `scripts/ci-changed-scope.mjs` e é coberta por testes unitários em `src/scripts/ci-changed-scope.test.ts`. O disparo manual pula a detecção de escopo alterado e faz o manifesto de preflight agir como se todas as áreas com escopo tivessem mudado.

- **Edições de workflow de CI** validam o grafo de CI do Node mais linting de workflow, mas não forçam builds nativos de Windows, Android ou macOS por si só; essas lanes de plataforma permanecem escopadas a alterações de código-fonte de plataforma.
- **Edições apenas de roteamento de CI, edições selecionadas de fixtures baratas de testes do núcleo e edições estreitas de helpers/roteamento de testes de contrato de Plugin** usam um caminho rápido de manifesto somente Node: `preflight`, segurança e uma única tarefa `checks-fast-core`. Esse caminho pula artefatos de build, compatibilidade com Node 22, contratos de canais, fragmentos completos do núcleo, fragmentos de Plugins empacotados e matrizes adicionais de guardas quando a alteração se limita às superfícies de roteamento ou helpers que a tarefa rápida exercita diretamente.
- **Verificações de Node no Windows** são escopadas a wrappers específicos de processo/caminho do Windows, helpers de execução npm/pnpm/UI, configuração do gerenciador de pacotes e superfícies do workflow de CI que executam essa lane; alterações não relacionadas de código-fonte, Plugin, smoke de instalação e somente testes permanecem nas lanes de Node no Linux.

As famílias mais lentas de testes Node são divididas ou balanceadas para que cada job continue pequeno sem reservar runners em excesso: contratos de canais rodam como três fragmentos ponderados, lanes rápidas/de suporte de unidade do núcleo rodam separadamente, a infraestrutura de runtime do núcleo é dividida entre fragmentos de estado e processo/configuração, auto-reply roda como workers balanceados (com a subárvore de respostas dividida em fragmentos de agent-runner, dispatch e commands/state-routing), e configurações agentic de Gateway/servidor são divididas entre lanes de chat/auth/model/http-plugin/runtime/startup em vez de esperar por artefatos compilados. Testes amplos de navegador, QA, mídia e Plugins diversos usam suas configurações Vitest dedicadas em vez do catch-all compartilhado de Plugins. Fragmentos com padrão de inclusão registram entradas de tempo usando o nome do fragmento de CI, para que `.artifacts/vitest-shard-timings.json` possa distinguir uma configuração inteira de um fragmento filtrado. `check-additional` mantém juntos o trabalho de compilação/canário de limite de pacote e separa a arquitetura de topologia de runtime da cobertura de Gateway watch; a lista de guardas de limite é distribuída em quatro fragmentos de matriz, cada um executando guardas independentes selecionadas em paralelo e imprimindo tempos por verificação, incluindo `pnpm prompt:snapshots:check`, para que drift de prompt do caminho feliz do runtime Codex fique preso ao PR que o causou. Gateway watch, testes de canais e o fragmento de limite de suporte do núcleo rodam em paralelo dentro de `build-artifacts` depois que `dist/` e `dist-runtime/` já foram compilados.

A CI de Android executa `testPlayDebugUnitTest` e `testThirdPartyDebugUnitTest` e depois compila o APK de debug Play. O flavor third-party não tem source set ou manifesto separado; sua lane de testes unitários ainda compila o flavor com as flags BuildConfig de SMS/call-log, evitando ao mesmo tempo um job duplicado de empacotamento de APK de debug em cada push relevante para Android.

O fragmento `check-dependencies` executa `pnpm deadcode:dependencies` (uma passagem do Knip somente para dependências de produção fixada na versão mais recente do Knip, com a idade mínima de release do pnpm desativada para a instalação `dlx`) e `pnpm deadcode:unused-files`, que compara as descobertas de arquivos de produção não usados do Knip com `scripts/deadcode-unused-files.allowlist.mjs`. A guarda de arquivos não usados falha quando um PR adiciona um novo arquivo não usado sem revisão ou deixa uma entrada obsoleta na lista de permissões, preservando superfícies intencionais de Plugins dinâmicos, geradas, de build, testes ao vivo e pontes de pacote que o Knip não consegue resolver estaticamente.

## Encaminhamento de atividade do ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` é a ponte do lado de destino da atividade do repositório OpenClaw para o ClawSweeper. Ele não faz checkout nem executa código não confiável de pull requests. O workflow cria um token de GitHub App a partir de `CLAWSWEEPER_APP_PRIVATE_KEY` e então dispara payloads compactos de `repository_dispatch` para `openclaw/clawsweeper`.

O workflow tem quatro lanes:

- `clawsweeper_item` para solicitações exatas de revisão de issues e pull requests;
- `clawsweeper_comment` para comandos explícitos do ClawSweeper em comentários de issues;
- `clawsweeper_commit_review` para solicitações de revisão no nível de commit em pushes para `main`;
- `github_activity` para atividade geral do GitHub que o agente ClawSweeper pode inspecionar.

A lane `github_activity` encaminha apenas metadados normalizados: tipo de evento, ação, ator, repositório, número do item, URL, título, estado e trechos curtos de comentários ou revisões quando presentes. Ela evita intencionalmente encaminhar o corpo completo do Webhook. O workflow receptor em `openclaw/clawsweeper` é `.github/workflows/github-activity.yml`, que publica o evento normalizado no hook do OpenClaw Gateway para o agente ClawSweeper.

Atividade geral é observação, não entrega por padrão. O agente ClawSweeper recebe o destino do Discord no prompt e deve publicar em `#clawsweeper` somente quando o evento for surpreendente, acionável, arriscado ou operacionalmente útil. Aberturas rotineiras, edições, atividade repetitiva de bots, ruído de Webhook duplicado e tráfego normal de revisão devem resultar em `NO_REPLY`.

Trate títulos, comentários, corpos, texto de revisão, nomes de branches e mensagens de commit do GitHub como dados não confiáveis em todo este caminho. Eles são entrada para sumarização e triagem, não instruções para o workflow ou o runtime do agente.

## Disparos manuais

Os dispatches manuais de CI executam o mesmo grafo de jobs que a CI normal, mas forçam a ativação de toda lane com escopo não Android: shards Linux Node, shards de plugins agrupados, contratos de canal, compatibilidade com Node 22, `check`, `check-additional`, smoke de build, verificações de documentação, Skills Python, Windows, macOS e i18n da Control UI. Dispatches manuais independentes de CI executam apenas Android com `include_android=true`; o guarda-chuva completo de release habilita Android passando `include_android=true`. Verificações estáticas de pré-release de Plugin, o shard exclusivo de release `agentic-plugins`, a varredura completa em lote de extensions e as lanes Docker de pré-release de Plugin ficam excluídos da CI. A suíte Docker de pré-release é executada somente quando `Full Release Validation` dispara o workflow separado `Plugin Prerelease` com o gate de validação de release habilitado.

Execuções manuais usam um grupo de concorrência único para que uma suíte completa de candidato a release não seja cancelada por outra execução de push ou PR na mesma ref. A entrada opcional `target_ref` permite que um chamador confiável execute esse grafo contra uma branch, tag ou SHA completo de commit usando o arquivo de workflow da ref de dispatch selecionada.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Executores

| Executor                         | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, jobs rápidos de segurança e agregados (`security-scm-fast`, `security-dependency-audit`, `security-fast`), verificações rápidas de protocolo/contrato/plugins agrupados, verificações fragmentadas de contratos de canal, shards de `check` exceto lint, shards e agregados de `check-additional`, verificadores agregados de testes Node, verificações de documentação, Skills Python, workflow-sanity, labeler, auto-response; o preflight de install-smoke também usa Ubuntu hospedado pelo GitHub para que a matriz Blacksmith possa entrar na fila mais cedo |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shards de extensions mais leves, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` e `check-test-types`                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shards de testes Linux Node, shards de testes de plugins agrupados, `android`                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (sensível a CPU a ponto de 8 vCPU custar mais do que economizou); builds Docker de install-smoke (o tempo de fila de 32 vCPU custou mais do que economizou)                                                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` em `openclaw/openclaw`; forks voltam para `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` em `openclaw/openclaw`; forks voltam para `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                               |

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

`OpenClaw Performance` é o workflow de desempenho de produto/runtime. Ele é executado diariamente em `main` e pode ser disparado manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

O dispatch manual normalmente mede a ref do workflow. Defina `target_ref` para medir uma tag de release ou outra branch com a implementação atual do workflow. Os caminhos de relatórios publicados e ponteiros mais recentes são indexados pela ref testada, e cada `index.md` registra a ref/SHA testada, a ref/SHA do workflow, a ref do Kova, perfil, modo de autenticação da lane, modelo, contagem de repetições e filtros de cenário.

O workflow instala OCM a partir de uma release fixada e Kova a partir de `openclaw/Kova` na entrada fixada `kova_ref`, depois executa três lanes:

- `mock-provider`: cenários diagnósticos do Kova contra um runtime de build local com autenticação fake determinística compatível com OpenAI.
- `mock-deep-profile`: profiling de CPU/heap/trace para pontos críticos de inicialização, Gateway e turnos de agente.
- `live-gpt54`: um turno real de agente OpenAI `openai/gpt-5.4`, ignorado quando `OPENAI_API_KEY` não está disponível.

A lane mock-provider também executa sondagens de origem nativas do OpenClaw após a passagem do Kova: tempo de inicialização e memória do Gateway nos casos de inicialização padrão, com hook e com 50 plugins; loops repetidos de hello `channel-chat-baseline` com mock-OpenAI; e comandos de inicialização da CLI contra o Gateway iniciado. O resumo Markdown da sondagem de origem fica em `source/index.md` no pacote de relatório, com JSON bruto ao lado.

Cada lane envia artefatos do GitHub. Quando `CLAWGRIT_REPORTS_TOKEN` está configurado, o workflow também faz commit de `report.json`, `report.md`, pacotes, `index.md` e artefatos de sondagem de origem em `openclaw/clawgrit-reports` sob `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. O ponteiro atual da ref testada é gravado como `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validação Completa de Release

`Full Release Validation` é o workflow manual guarda-chuva para "executar tudo antes da release." Ele aceita uma branch, tag ou SHA completo de commit, dispara o workflow manual `CI` com esse alvo, dispara `Plugin Prerelease` para comprovação exclusiva de release de plugin/pacote/estática/Docker e dispara `OpenClaw Release Checks` para smoke de instalação, aceitação de pacote, suítes de caminho de release Docker, live/E2E, OpenWebUI, paridade QA Lab, Matrix e lanes Telegram. Com `rerun_group=all` e `release_profile=full`, ele também executa `NPM Telegram Beta E2E` contra o artefato `release-package-under-test` das verificações de release. Depois da publicação, passe `npm_telegram_package_spec` para reexecutar a mesma lane de pacote Telegram contra o pacote npm publicado.

Consulte [validação completa de release](/pt-BR/reference/full-release-validation) para a matriz de estágios, nomes exatos de jobs do workflow, diferenças de perfil, artefatos e identificadores de reexecução focada.

`OpenClaw Release Publish` é o workflow manual mutável de release. Dispare-o de `release/YYYY.M.D` ou `main` depois que a tag de release existir e depois que o preflight npm do OpenClaw tiver sido concluído com sucesso. Ele verifica `pnpm plugins:sync:check`, dispara `Plugin NPM Release` para todos os pacotes de Plugin publicáveis, dispara `Plugin ClawHub Release` para o mesmo SHA de release e só então dispara `OpenClaw NPM Release` com o `preflight_run_id` salvo.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Para comprovação de commit fixado em uma branch que se move rápido, use o helper em vez de `gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Refs de dispatch de workflow do GitHub devem ser branches ou tags, não SHAs brutos de commit. O helper envia uma branch temporária `release-ci/<sha>-...` no SHA alvo, dispara `Full Release Validation` a partir dessa ref fixada, verifica se cada `headSha` de workflow filho corresponde ao alvo e exclui a branch temporária quando a execução termina. O verificador guarda-chuva também falha se qualquer workflow filho tiver executado em um SHA diferente.

`release_profile` controla a amplitude live/provedor passada para as verificações de lançamento. Os fluxos de trabalho manuais de lançamento usam `stable` por padrão; use `full` somente quando você intencionalmente quiser a matriz ampla consultiva de provedores/mídia.

- `minimum` mantém as linhas OpenAI/núcleo críticas para lançamento mais rápidas.
- `stable` adiciona o conjunto estável de provedores/backends.
- `full` executa a matriz ampla consultiva de provedores/mídia.

O guarda-chuva registra os ids das execuções filhas disparadas, e o trabalho final `Verify full validation` verifica novamente as conclusões atuais das execuções filhas e acrescenta tabelas dos trabalhos mais lentos de cada execução filha. Se um fluxo de trabalho filho for reexecutado e ficar verde, reexecute apenas o trabalho verificador pai para atualizar o resultado guarda-chuva e o resumo de tempos.

Para recuperação, tanto `Full Release Validation` quanto `OpenClaw Release Checks` aceitam `rerun_group`. Use `all` para um candidato a lançamento, `ci` apenas para o filho de CI completo normal, `plugin-prerelease` apenas para o filho de pré-lançamento de plugins, `release-checks` para todos os filhos de lançamento, ou um grupo mais estreito: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` no guarda-chuva. Isso mantém limitada a reexecução de uma caixa de lançamento com falha após uma correção focada.

`OpenClaw Release Checks` usa a ref confiável do fluxo de trabalho para resolver a ref selecionada uma vez em um tarball `release-package-under-test`, depois passa esse artefato tanto para o fluxo de trabalho Docker live/E2E do caminho de lançamento quanto para o shard de aceitação de pacote. Isso mantém os bytes do pacote consistentes entre as caixas de lançamento e evita reempacotar o mesmo candidato em vários trabalhos filhos.

Execuções duplicadas de `Full Release Validation` para `ref=main` e `rerun_group=all` substituem o guarda-chuva mais antigo. O monitor pai cancela qualquer fluxo de trabalho filho que já tenha disparado quando o pai é cancelado, então a validação mais nova da main não fica atrás de uma execução obsoleta de duas horas de verificações de lançamento. A validação de branch/tag de lançamento e grupos de reexecução focados mantêm `cancel-in-progress: false`.

## Shards live e E2E

O filho live/E2E de lançamento mantém cobertura ampla nativa de `pnpm test:live`, mas a executa como shards nomeados por meio de `scripts/test-live-shard.mjs` em vez de um trabalho serial:

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
- shards de áudio/vídeo de mídia divididos e shards de música filtrados por provedor

Isso mantém a mesma cobertura de arquivos enquanto torna falhas lentas de provedores live mais fáceis de reexecutar e diagnosticar. Os nomes de shard agregados `native-live-extensions-o-z`, `native-live-extensions-media` e `native-live-extensions-media-music` continuam válidos para reexecuções manuais únicas.

Os shards nativos de mídia live executam em `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, criado pelo fluxo de trabalho `Live Media Runner Image`. Essa imagem pré-instala `ffmpeg` e `ffprobe`; os trabalhos de mídia apenas verificam os binários antes da configuração. Mantenha suítes live baseadas em Docker em runners Blacksmith normais — trabalhos em contêiner são o lugar errado para iniciar testes Docker aninhados.

Shards live de modelo/backend baseados em Docker usam uma imagem compartilhada separada `ghcr.io/openclaw/openclaw-live-test:<sha>` por commit selecionado. O fluxo de trabalho live de lançamento cria e envia essa imagem uma vez, depois os shards de modelo live Docker, Gateway divididos por provedor, backend CLI, vínculo ACP e harness Codex executam com `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shards Docker do Gateway carregam limites explícitos de `timeout` em nível de script abaixo do timeout do trabalho do fluxo de trabalho, para que um contêiner travado ou caminho de limpeza falhe rápido em vez de consumir todo o orçamento das verificações de lançamento. Se esses shards recriarem o alvo Docker de código-fonte completo independentemente, a execução de lançamento está mal configurada e desperdiçará tempo de relógio com builds duplicados de imagem.

## Aceitação de Pacote

Use `Package Acceptance` quando a pergunta for "este pacote OpenClaw instalável funciona como produto?" Ela é diferente da CI normal: a CI normal valida a árvore de código-fonte, enquanto a aceitação de pacote valida um único tarball pelo mesmo harness Docker E2E que os usuários exercitam após instalar ou atualizar.

### Trabalhos

1. `resolve_package` faz checkout de `workflow_ref`, resolve um candidato de pacote, grava `.artifacts/docker-e2e-package/openclaw-current.tgz`, grava `.artifacts/docker-e2e-package/package-candidate.json`, envia ambos como o artefato `package-under-test` e imprime a origem, ref do fluxo de trabalho, ref do pacote, versão, SHA-256 e perfil no resumo da etapa do GitHub.
2. `docker_acceptance` chama `openclaw-live-and-e2e-checks-reusable.yml` com `ref=workflow_ref` e `package_artifact_name=package-under-test`. O fluxo de trabalho reutilizável baixa esse artefato, valida o inventário do tarball, prepara imagens Docker de resumo de pacote quando necessário e executa as linhas Docker selecionadas contra esse pacote em vez de empacotar o checkout do fluxo de trabalho. Quando um perfil seleciona vários `docker_lanes` direcionados, o fluxo de trabalho reutilizável prepara o pacote e as imagens compartilhadas uma vez, depois distribui essas linhas como trabalhos Docker direcionados paralelos com artefatos únicos.
3. `package_telegram` opcionalmente chama `NPM Telegram Beta E2E`. Ele executa quando `telegram_mode` não é `none` e instala o mesmo artefato `package-under-test` quando Package Acceptance resolveu um; um disparo autônomo do Telegram ainda pode instalar uma especificação npm publicada.
4. `summary` falha o fluxo de trabalho se a resolução do pacote, a aceitação Docker ou a linha opcional do Telegram falhar.

### Origens de candidatos

- `source=npm` aceita somente `openclaw@beta`, `openclaw@latest` ou uma versão exata de lançamento do OpenClaw, como `openclaw@2026.4.27-beta.2`. Use isso para aceitação de pré-lançamento/estável publicado.
- `source=ref` empacota um branch, tag ou SHA completo de commit confiável em `package_ref`. O resolvedor busca branches/tags do OpenClaw, verifica se o commit selecionado é alcançável pelo histórico de branches do repositório ou por uma tag de lançamento, instala dependências em uma árvore de trabalho destacada e o empacota com `scripts/package-openclaw-for-docker.mjs`.
- `source=url` baixa um `.tgz` HTTPS; `package_sha256` é obrigatório.
- `source=artifact` baixa um `.tgz` de `artifact_run_id` e `artifact_name`; `package_sha256` é opcional, mas deve ser fornecido para artefatos compartilhados externamente.

Mantenha `workflow_ref` e `package_ref` separados. `workflow_ref` é o código confiável de fluxo de trabalho/harness que executa o teste. `package_ref` é o commit de origem que é empacotado quando `source=ref`. Isso permite que o harness de teste atual valide commits de origem confiáveis mais antigos sem executar lógica antiga de fluxo de trabalho.

### Perfis de suíte

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` mais `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — blocos completos Docker do caminho de lançamento com OpenWebUI
- `custom` — `docker_lanes` exatos; obrigatório quando `suite_profile=custom`

O perfil `package` usa cobertura offline de plugins para que a validação de pacote publicado não dependa da disponibilidade live do ClawHub. A linha opcional do Telegram reutiliza o artefato `package-under-test` em `NPM Telegram Beta E2E`, mantendo o caminho de especificação npm publicada para disparos autônomos.

Para a política dedicada de testes de atualização e plugins, incluindo comandos locais, linhas Docker, entradas de Package Acceptance, padrões de lançamento e triagem de falhas, consulte [Testar atualizações e plugins](/pt-BR/help/testing-updates-plugins).

As verificações de lançamento chamam Package Acceptance com `source=artifact`, o artefato de pacote de lançamento preparado, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` e `telegram_mode=mock-openai`. Isso mantém a prova de migração de pacote, atualização, limpeza de dependência obsoleta de plugin, reparo de instalação de plugin configurado, plugin offline, atualização de plugin e Telegram no mesmo tarball de pacote resolvido. Defina `package_acceptance_package_spec` em Full Release Validation ou OpenClaw Release Checks para executar essa mesma matriz contra um pacote npm enviado em vez do artefato criado a partir do SHA. As verificações de lançamento entre sistemas operacionais ainda cobrem integração inicial específica de SO, instalador e comportamento de plataforma; a validação de produto de pacote/atualização deve começar com Package Acceptance. A linha Docker `published-upgrade-survivor` valida uma linha de base de pacote publicado por execução. Em Package Acceptance, o tarball `package-under-test` resolvido é sempre o candidato, e `published_upgrade_survivor_baseline` seleciona a linha de base publicada de fallback, com padrão `openclaw@latest`; comandos de reexecução de linha com falha preservam essa linha de base. Defina `published_upgrade_survivor_baselines=all-since-2026.4.23` para expandir a CI de Full Release por todos os lançamentos npm estáveis de `2026.4.23` até `latest`; `release-history` continua disponível para amostragem manual mais ampla com a âncora pré-data mais antiga. Defina `published_upgrade_survivor_scenarios=reported-issues` para expandir as mesmas linhas de base por fixtures em formato de issues para configuração do Feishu, arquivos bootstrap/persona preservados, instalações configuradas de plugin OpenClaw, caminhos de log com til e raízes obsoletas de dependência de plugins legados. O fluxo de trabalho separado `Update Migration` usa a linha Docker `update-migration` com `all-since-2026.4.23` e `plugin-deps-cleanup` quando a pergunta é limpeza exaustiva de atualização publicada, não a amplitude normal da CI de Full Release. Execuções agregadas locais podem passar especificações exatas de pacote com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, manter uma única linha com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, como `openclaw@2026.4.15`, ou definir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para a matriz de cenários. A linha publicada configura a linha de base com uma receita incorporada de comando `openclaw config set`, registra etapas da receita em `summary.json` e sonda `/healthz`, `/readyz`, além do status RPC após o início do Gateway. As linhas frescas empacotadas e de instalador do Windows também verificam que um pacote instalado consegue importar uma substituição de controle de navegador de um caminho Windows absoluto bruto. O smoke de turno de agente OpenAI entre sistemas operacionais usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` por padrão quando definido; caso contrário, `openai/gpt-5.4`, para que a prova de instalação e Gateway permaneça em um modelo de teste GPT-5 enquanto evita padrões GPT-4.x.

### Janelas de compatibilidade legada

Package Acceptance tem janelas limitadas de compatibilidade legada para pacotes já publicados. Pacotes até `2026.4.25`, incluindo `2026.4.25-beta.*`, podem usar o caminho de compatibilidade:

- entradas QA privadas conhecidas em `dist/postinstall-inventory.json` podem apontar para arquivos omitidos do tarball;
- `doctor-switch` pode pular o subcaso de persistência de `gateway install --wrapper` quando o pacote não expõe essa flag;
- `update-channel-switch` pode remover `pnpm.patchedDependencies` ausentes da fixture git falsa derivada do tarball e pode registrar `update.channel` persistido ausente;
- smokes de plugin podem ler locais legados de registro de instalação ou aceitar persistência ausente de registro de instalação do marketplace;
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

Ao depurar uma execução de aceitação de pacote com falha, comece pelo resumo de `resolve_package` para confirmar a origem do pacote, a versão e o SHA-256. Em seguida, inspecione a execução filha `docker_acceptance` e seus artefatos Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logs de lanes, tempos de fase e comandos de reexecução. Prefira reexecutar o perfil de pacote com falha ou as lanes Docker exatas em vez de reexecutar a validação completa de lançamento.

## Smoke de instalação

O workflow separado `Install Smoke` reutiliza o mesmo script de escopo por meio do próprio job `preflight`. Ele divide a cobertura smoke em `run_fast_install_smoke` e `run_full_install_smoke`.

- **Caminho rápido** é executado para pull requests que tocam superfícies Docker/pacote, alterações em pacote/manifesto de Plugin empacotado ou superfícies centrais de Plugin/canal/Gateway/Plugin SDK exercitadas pelos jobs de smoke Docker. Alterações somente de código-fonte em Plugin empacotado, edições somente de teste e edições somente de documentação não reservam workers Docker. O caminho rápido cria a imagem do Dockerfile raiz uma vez, verifica a CLI, executa o smoke de CLI de exclusão de agentes em workspace compartilhado, executa o E2E de rede do Gateway em contêiner, verifica um argumento de build de extensão empacotada e executa o perfil Docker limitado de Plugin empacotado sob um timeout agregado de comando de 240 segundos (cada execução Docker de cenário é limitada separadamente).
- **Caminho completo** mantém a cobertura de instalação de pacote QR e Docker/atualização do instalador para execuções agendadas noturnas, disparos manuais, verificações de lançamento por chamada de workflow e pull requests que realmente tocam superfícies de instalador/pacote/Docker. No modo completo, o install-smoke prepara ou reutiliza uma imagem smoke GHCR do Dockerfile raiz para o SHA de destino e, então, executa a instalação de pacote QR, smokes do Dockerfile raiz/Gateway, smokes de instalador/atualização e o E2E Docker rápido de Plugin empacotado como jobs separados para que o trabalho de instalador não espere atrás dos smokes da imagem raiz.

Pushes para `main` (incluindo commits de merge) não forçam o caminho completo; quando a lógica de escopo de alterações solicitaria cobertura completa em um push, o workflow mantém o smoke Docker rápido e deixa o smoke completo de instalação para a validação noturna ou de lançamento.

O smoke lento de provedor de imagem com instalação global via Bun é controlado separadamente por `run_bun_global_install_smoke`. Ele é executado na agenda noturna e a partir do workflow de verificações de lançamento, e disparos manuais de `Install Smoke` podem optar por incluí-lo, mas pull requests e pushes para `main` não. Testes Docker de QR e instalador mantêm seus próprios Dockerfiles focados em instalação.

## E2E Docker local

`pnpm test:docker:all` pré-compila uma imagem compartilhada de teste live, empacota o OpenClaw uma vez como um tarball npm e cria duas imagens compartilhadas de `scripts/e2e/Dockerfile`:

- um runner básico Node/Git para lanes de instalador/atualização/dependência de Plugin;
- uma imagem funcional que instala o mesmo tarball em `/app` para lanes de funcionalidade normal.

As definições de lanes Docker ficam em `scripts/lib/docker-e2e-scenarios.mjs`, a lógica do planejador fica em `scripts/lib/docker-e2e-plan.mjs`, e o runner executa apenas o plano selecionado. O agendador seleciona a imagem por lane com `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, depois executa as lanes com `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parâmetros ajustáveis

| Variável                               | Padrão  | Finalidade                                                                                                    |
| -------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Contagem de slots do pool principal para lanes normais.                                                       |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Contagem de slots do pool final sensível a provedores.                                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Limite de lanes live concorrentes para que provedores não apliquem throttling.                                |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Limite de lanes concorrentes de instalação npm.                                                               |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Limite de lanes concorrentes com múltiplos serviços.                                                          |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Intervalo escalonado entre inícios de lanes para evitar tempestades de criação no daemon Docker; defina `0` para sem escalonamento. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Timeout de fallback por lane (120 minutos); lanes live/finais selecionadas usam limites mais estritos.        |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` imprime o plano do agendador sem executar lanes.                                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Lista separada por vírgulas de lanes exatas; pula o smoke de limpeza para que agentes possam reproduzir uma lane com falha. |

Uma lane mais pesada que seu limite efetivo ainda pode começar de um pool vazio e, então, roda sozinha até liberar capacidade. Os preflights agregados locais verificam o Docker, removem contêineres E2E obsoletos do OpenClaw, emitem status de lanes ativas, persistem tempos de lanes para ordenação da mais longa para a mais curta e param de agendar novas lanes em pool após a primeira falha por padrão.

### Workflow live/E2E reutilizável

O workflow live/E2E reutilizável pergunta a `scripts/test-docker-all.mjs --plan-json` qual pacote, tipo de imagem, imagem live, lane e cobertura de credenciais são necessários. `scripts/docker-e2e.mjs` então converte esse plano em saídas e resumos do GitHub. Ele empacota o OpenClaw por meio de `scripts/package-openclaw-for-docker.mjs`, baixa um artefato de pacote da execução atual ou baixa um artefato de pacote de `package_artifact_run_id`; valida o inventário do tarball; cria e envia imagens Docker E2E bare/funcionais GHCR marcadas com digest de pacote por meio do cache de camadas Docker do Blacksmith quando o plano precisa de lanes com pacote instalado; e reutiliza entradas `docker_e2e_bare_image`/`docker_e2e_functional_image` fornecidas ou imagens existentes com digest de pacote em vez de reconstruir. Pulls de imagens Docker são repetidos com um timeout limitado de 180 segundos por tentativa para que um fluxo travado de registro/cache tente novamente rapidamente em vez de consumir a maior parte do caminho crítico da CI.

### Fragmentos do caminho de lançamento

A cobertura Docker de lançamento executa jobs menores em fragmentos com `OPENCLAW_SKIP_DOCKER_BUILD=1`, de modo que cada fragmento puxe apenas o tipo de imagem de que precisa e execute várias lanes pelo mesmo agendador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Os fragmentos Docker de lançamento atuais são `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` e `plugins-runtime-install-a` até `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` permanecem aliases agregados de Plugin/runtime. O alias de lane `install-e2e` permanece o alias agregado de reexecução manual para ambas as lanes de instalador de provedor.

OpenWebUI é incorporado em `plugins-runtime-services` quando a cobertura completa de release-path o solicita, e mantém um fragmento independente `openwebui` apenas para disparos somente do OpenWebUI. Lanes de atualização de canais empacotados tentam novamente uma vez em caso de falhas transitórias de rede npm.

Cada fragmento faz upload de `.artifacts/docker-tests/` com logs de lanes, tempos, `summary.json`, `failures.json`, tempos de fase, JSON do plano do agendador, tabelas de lanes lentas e comandos de reexecução por lane. A entrada `docker_lanes` do workflow executa lanes selecionadas contra as imagens preparadas em vez dos jobs de fragmento, o que mantém a depuração de lane com falha limitada a um job Docker direcionado e prepara, baixa ou reutiliza o artefato de pacote para essa execução; se uma lane selecionada for uma lane Docker live, o job direcionado cria a imagem de teste live localmente para essa reexecução. Comandos gerados de reexecução por lane no GitHub incluem `package_artifact_run_id`, `package_artifact_name` e entradas de imagem preparadas quando esses valores existem, para que uma lane com falha possa reutilizar o pacote e as imagens exatos da execução com falha.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

O workflow live/E2E agendado executa diariamente a suíte Docker completa de release-path.

## Pré-lançamento de Plugin

`Plugin Prerelease` é uma cobertura de produto/pacote mais cara, portanto é um workflow separado disparado por `Full Release Validation` ou por um operador explícito. Pull requests normais, pushes para `main` e disparos manuais independentes de CI mantêm essa suíte desativada. Ele balanceia testes de Plugins empacotados entre oito workers de extensão; esses jobs de shard de extensão executam até dois grupos de configuração de Plugin por vez, com um worker Vitest por grupo e um heap Node maior para que lotes de Plugins pesados em importação não criem jobs extras de CI. O caminho Docker de pré-lançamento exclusivo de lançamento agrupa lanes Docker direcionadas em pequenos grupos para evitar reservar dezenas de runners para jobs de um a três minutos.

## QA Lab

O QA Lab tem lanes dedicadas de CI fora do workflow principal com escopo inteligente. A paridade agêntica fica aninhada sob os harnesses amplos de QA e lançamento, não como um workflow autônomo de PR. Use `Full Release Validation` com `rerun_group=qa-parity` quando a paridade deve acompanhar uma execução ampla de validação.

- O workflow `QA-Lab - All Lanes` é executado todas as noites em `main` e por disparo manual; ele distribui a lane de paridade mock, a lane live Matrix e as lanes live Telegram e Discord como jobs paralelos. Jobs live usam o ambiente `qa-live-shared`, e Telegram/Discord usam leases Convex.

As verificações de lançamento executam lanes de transporte live Matrix e Telegram com o provedor mock determinístico e modelos qualificados por mock (`mock-openai/gpt-5.5` e `mock-openai/gpt-5.5-alt`) para que o contrato do canal fique isolado da latência de modelos live e da inicialização normal de Plugin de provedor. O Gateway de transporte live desativa a busca de memória porque a paridade de QA cobre o comportamento de memória separadamente; a conectividade de provedores é coberta pelas suítes separadas de modelo live, provedor nativo e provedor Docker.

Matrix usa `--profile fast` para gates agendados e de lançamento, adicionando `--fail-fast` apenas quando a CLI em checkout oferece suporte a isso. O padrão da CLI e a entrada manual do workflow permanecem `all`; o disparo manual `matrix_profile=all` sempre fragmenta a cobertura Matrix completa em jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`.

`OpenClaw Release Checks` também executa as lanes críticas de lançamento do QA Lab antes da aprovação de lançamento; seu gate de paridade de QA executa os pacotes candidato e baseline como jobs de lanes paralelos e, então, baixa ambos os artefatos em um pequeno job de relatório para a comparação final de paridade.

Para PRs normais, siga evidências de CI/verificações com escopo em vez de tratar a paridade como um status obrigatório.

## CodeQL

O fluxo de trabalho `CodeQL` é intencionalmente um verificador de segurança inicial e estreito, não uma varredura completa do repositório. Execuções de proteção diárias, manuais e de solicitações de pull não rascunho verificam o código de fluxos de trabalho do Actions, além das superfícies JavaScript/TypeScript de maior risco, com consultas de segurança de alta confiança filtradas para `security-severity` alta/crítica.

A proteção de solicitação de pull permanece leve: ela só inicia para alterações em `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` ou `src`, e executa a mesma matriz de segurança de alta confiança do fluxo de trabalho agendado. CodeQL para Android e macOS fica fora dos padrões de PR.

### Categorias de segurança

| Categoria                                         | Superfície                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Linha de base de autenticação, segredos, sandbox, cron e Gateway                                                                    |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementação de canal do núcleo, além do runtime do plugin de canal, Gateway, Plugin SDK, segredos e pontos de auditoria |
| `/codeql-security-high/network-ssrf-boundary`     | Superfícies de SSRF do núcleo, análise de IP, proteção de rede, busca web e política de SSRF do Plugin SDK                          |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, auxiliares de execução de processo, entrega de saída e proteções de execução de ferramentas de agentes              |
| `/codeql-security-high/plugin-trust-boundary`     | Superfícies de confiança de instalação de Plugin, carregador, manifesto, registro, instalação do gerenciador de pacotes, carregamento de código-fonte e contrato de pacote do Plugin SDK |

### Shards de segurança específicos de plataforma

- `CodeQL Android Critical Security` — shard agendado de segurança do Android. Compila o aplicativo Android manualmente para o CodeQL no menor executor Linux do Blacksmith aceito pela sanidade do fluxo de trabalho. Envia em `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard semanal/manual de segurança do macOS. Compila o aplicativo macOS manualmente para o CodeQL no Blacksmith macOS, filtra resultados de compilação de dependências fora do SARIF enviado e envia em `/codeql-critical-security/macos`. Mantido fora dos padrões diários porque a compilação do macOS domina o tempo de execução mesmo quando está limpa.

### Categorias de qualidade crítica

`CodeQL Critical Quality` é o shard não relacionado a segurança correspondente. Ele executa apenas consultas de qualidade JavaScript/TypeScript sem segurança e com severidade de erro sobre superfícies estreitas de alto valor no executor Linux menor do Blacksmith. Sua proteção de solicitação de pull é intencionalmente menor que o perfil agendado: PRs não rascunho executam apenas os shards correspondentes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` e `plugin-sdk-reply-runtime` para alterações em código de execução de comando/modelo/ferramenta de agente e despacho de respostas, código de esquema/migração/IO de configuração, código de autenticação/segredos/sandbox/segurança, canal do núcleo e runtime de plugin de canal empacotado, protocolo/método de servidor do Gateway, cola de runtime/SDK de memória, MCP/processo/entrega de saída, catálogo de runtime/modelos de provedores, diagnósticos de sessão/filas de entrega, carregador de Plugin, contrato de Plugin SDK/pacote ou runtime de respostas do Plugin SDK. Alterações na configuração do CodeQL e no fluxo de trabalho de qualidade executam todos os doze shards de qualidade de PR.

O despacho manual aceita:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Os perfis estreitos são ganchos de ensino/iteração para executar um shard de qualidade isoladamente.

| Categoria                                               | Superfície                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Código de fronteira de segurança de autenticação, segredos, sandbox, cron e Gateway                                                                               |
| `/codeql-critical-quality/config-boundary`              | Contratos de esquema, migração, normalização e IO de configuração                                                                                                  |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Esquemas do protocolo do Gateway e contratos de métodos de servidor                                                                                                |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementação de canal do núcleo e de plugin de canal empacotado                                                                                      |
| `/codeql-critical-quality/agent-runtime-boundary`       | Execução de comandos, despacho de modelo/provedor, despacho e filas de resposta automática e contratos de runtime do plano de controle ACP                         |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP e pontes de ferramentas, auxiliares de supervisão de processo e contratos de entrega de saída                                                       |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK de host de memória, fachadas de runtime de memória, aliases de memória do Plugin SDK, cola de ativação de runtime de memória e comandos doctor de memória     |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internos de fila de resposta, filas de entrega de sessão, auxiliares de vinculação/entrega de sessão de saída, superfícies de evento diagnóstico/pacote de logs e contratos de CLI doctor de sessão |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de respostas de entrada do Plugin SDK, auxiliares de payload/fragmentação/runtime de resposta, opções de resposta de canal, filas de entrega e auxiliares de vinculação de sessão/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalização de catálogo de modelos, autenticação e descoberta de provedores, registro de runtime de provedores, padrões/catálogos de provedores e registros de web/pesquisa/busca/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Inicialização da UI de controle, persistência local, fluxos de controle do Gateway e contratos de runtime do plano de controle de tarefas                         |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Busca/pesquisa web do núcleo, IO de mídia, compreensão de mídia, geração de imagens e contratos de runtime de geração de mídia                                    |
| `/codeql-critical-quality/plugin-boundary`              | Contratos de carregador, registro, superfície pública e pontos de entrada do Plugin SDK                                                                            |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Código-fonte do Plugin SDK do lado do pacote publicado e auxiliares de contrato de pacote de plugin                                                               |

Qualidade fica separada de segurança para que achados de qualidade possam ser agendados, medidos, desativados ou expandidos sem obscurecer o sinal de segurança. A expansão do CodeQL para Swift, Python e plugins empacotados deve ser adicionada de volta como trabalho de acompanhamento com escopo ou sharding apenas depois que os perfis estreitos tiverem runtime e sinal estáveis.

## Fluxos de trabalho de manutenção

### Docs Agent

O fluxo de trabalho `Docs Agent` é uma via de manutenção do Codex orientada por eventos para manter a documentação existente alinhada com alterações recém-integradas. Ele não tem agendamento puro: uma execução de CI bem-sucedida de push não bot em `main` pode acioná-lo, e o despacho manual pode executá-lo diretamente. Invocações por workflow-run são ignoradas quando `main` já avançou ou quando outra execução não ignorada do Docs Agent foi criada na última hora. Quando ele executa, revisa o intervalo de commits desde o SHA de origem anterior não ignorado do Docs Agent até o `main` atual, então uma execução horária pode cobrir todas as alterações em main acumuladas desde a última passagem de documentação.

### Test Performance Agent

O fluxo de trabalho `Test Performance Agent` é uma via de manutenção do Codex orientada por eventos para testes lentos. Ele não tem agendamento puro: uma execução de CI bem-sucedida de push não bot em `main` pode acioná-lo, mas ele é ignorado se outra invocação por workflow-run já foi executada ou está em execução naquele dia UTC. O despacho manual ignora essa proteção de atividade diária. A via cria um relatório de desempenho agrupado de Vitest da suíte completa, permite que o Codex faça apenas pequenas correções de desempenho de testes que preservem a cobertura, em vez de refatorações amplas, depois reexecuta o relatório da suíte completa e rejeita alterações que reduzam a contagem de testes aprovados da linha de base. Se a linha de base tiver testes falhando, o Codex pode corrigir apenas falhas óbvias, e o relatório da suíte completa pós-agente deve passar antes de qualquer coisa ser commitada. Quando `main` avança antes que o push do bot seja integrado, a via faz rebase do patch validado, reexecuta `pnpm check:changed` e tenta o push novamente; patches obsoletos com conflito são ignorados. Ela usa Ubuntu hospedado no GitHub para que a ação do Codex possa manter a mesma postura de segurança drop-sudo do agente de documentação.

### PRs duplicados após merge

O fluxo de trabalho `Duplicate PRs After Merge` é um fluxo de trabalho manual de mantenedor para limpeza de duplicatas pós-integração. Ele usa dry-run por padrão e só fecha PRs explicitamente listados quando `apply=true`. Antes de alterar o GitHub, ele verifica se o PR integrado foi mesclado e se cada duplicata tem um problema referenciado compartilhado ou hunks alterados sobrepostos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Proteções de verificação local e roteamento de alterações

A lógica local de changed-lane vive em `scripts/changed-lanes.mjs` e é executada por `scripts/check-changed.mjs`. Essa proteção de verificação local é mais estrita sobre fronteiras de arquitetura do que o escopo amplo da plataforma de CI:

- alterações de produção do núcleo executam typecheck de produção do núcleo e de testes do núcleo, além de lint/proteções do núcleo;
- alterações apenas em testes do núcleo executam somente typecheck de testes do núcleo, além de lint do núcleo;
- alterações de produção de extensão executam typecheck de produção e de testes de extensão, além de lint de extensão;
- alterações apenas em testes de extensão executam typecheck de testes de extensão, além de lint de extensão;
- alterações no Plugin SDK público ou no contrato de plugins expandem para typecheck de extensões porque extensões dependem desses contratos do núcleo (varreduras de extensão do Vitest continuam sendo trabalho explícito de teste);
- bumps de versão somente de metadados de release executam verificações direcionadas de versão/configuração/dependência raiz;
- alterações desconhecidas de raiz/configuração falham de modo seguro para todas as vias de verificação.

O roteamento local de changed-test vive em `scripts/test-projects.test-support.mjs` e é intencionalmente mais barato que `check:changed`: edições diretas de testes executam a si mesmas, edições de código-fonte preferem mapeamentos explícitos, depois testes irmãos e dependentes do grafo de importação. A configuração compartilhada de entrega em salas de grupo é um dos mapeamentos explícitos: alterações na configuração de resposta visível de grupo, no modo de entrega de resposta de origem ou no prompt de sistema da ferramenta de mensagens passam pelos testes de resposta do núcleo, além de regressões de entrega do Discord e Slack, para que uma alteração de padrão compartilhado falhe antes do primeiro push de PR. Use `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` apenas quando a alteração for ampla o suficiente no harness para que o conjunto mapeado barato não seja um proxy confiável.

## Validação Testbox

Execute o Testbox a partir da raiz do repositório e prefira uma box recém-aquecida para comprovação ampla. Antes de gastar um gate lento em uma box que foi reutilizada, expirou ou acabou de relatar uma sincronização inesperadamente grande, execute `pnpm testbox:sanity` dentro da box primeiro.

A verificação de sanidade falha rapidamente quando arquivos obrigatórios da raiz, como `pnpm-lock.yaml`, desapareceram ou quando `git status --short` mostra pelo menos 200 exclusões rastreadas. Isso normalmente significa que o estado da sincronização remota não é uma cópia confiável do PR; pare essa box e aqueça uma nova em vez de depurar a falha do teste do produto. Para PRs com grandes exclusões intencionais, defina `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para essa execução de sanidade.

`pnpm testbox:run` também encerra uma invocação local da CLI do Blacksmith que permanece na fase de sincronização por mais de cinco minutos sem saída pós-sincronização. Defina `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` para desativar essa proteção, ou use um valor maior em milissegundos para diffs locais incomumente grandes.

Crabbox é o wrapper de box remota mantido pelo repositório para comprovação Linux de mantenedores. Use-o quando uma verificação for ampla demais para um ciclo local de edição, quando a paridade com CI for importante ou quando a comprovação precisar de segredos, Docker, lanes de pacote, boxes reutilizáveis ou logs remotos. O backend normal do OpenClaw é `blacksmith-testbox`; a capacidade própria em AWS/Hetzner é uma alternativa para indisponibilidades do Blacksmith, problemas de cota ou testes explícitos em capacidade própria.

Antes de uma primeira execução, verifique o wrapper a partir da raiz do repositório:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

O wrapper do repositório recusa um binário Crabbox obsoleto que não anuncia `blacksmith-testbox`. Passe o provider explicitamente, mesmo que `.crabbox.yaml` tenha padrões de nuvem própria.

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

Leia o resumo JSON final. Os campos úteis são `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` e `totalMs`. Execuções Crabbox únicas com suporte do Blacksmith devem parar o Testbox automaticamente; se uma execução for interrompida ou a limpeza não estiver clara, inspecione as boxes ativas e pare somente as boxes que você criou:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

Use reutilização somente quando você precisar intencionalmente de vários comandos na mesma box hidratada:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Se o Crabbox for a camada quebrada, mas o próprio Blacksmith funcionar, use o Blacksmith direto como alternativa restrita:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Escalone para capacidade própria do Crabbox somente quando o Blacksmith estiver indisponível, limitado por cota, sem o ambiente necessário ou quando a capacidade própria for explicitamente o objetivo:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` controla os padrões de provider, sincronização e hidratação do GitHub Actions para lanes de nuvem própria. Ele exclui o `.git` local para que o checkout hidratado do Actions mantenha seus próprios metadados Git remotos em vez de sincronizar remotos e armazenamentos de objetos locais dos mantenedores, e exclui artefatos locais de runtime/build que nunca devem ser transferidos. `.github/workflows/crabbox-hydrate.yml` controla o checkout, a configuração do Node/pnpm, o fetch de `origin/main` e a transferência de ambiente sem segredos para comandos `crabbox run --id <cbx_id>` em nuvem própria.

## Relacionados

- [Visão geral da instalação](/pt-BR/install)
- [Canais de desenvolvimento](/pt-BR/install/development-channels)
