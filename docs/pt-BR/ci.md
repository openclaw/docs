---
read_when:
    - Você precisa entender por que uma tarefa de CI foi ou não executada
    - Você está depurando verificações do GitHub Actions com falha
summary: Grafo de tarefas do CI, gates de escopo e equivalentes de comandos locais
title: pipeline de CI
x-i18n:
    generated_at: "2026-04-26T11:24:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a6c14f785434585f2b3a72bcd2cff3a281e51fe12cc4c14aa7613d47cd8efc4
    source_path: ci.md
    workflow: 15
---

O CI é executado em cada push para `main` e em cada pull request. Ele usa escopo inteligente para ignorar tarefas caras quando apenas áreas não relacionadas foram alteradas.

O QA Lab tem lanes de CI dedicadas fora do workflow principal com escopo inteligente. O
workflow `Parity gate` é executado em alterações correspondentes de PR e em disparo manual; ele
faz build do runtime privado de QA e compara os pacotes agentic simulados GPT-5.5 e Opus 4.6.
O workflow `QA-Lab - All Lanes` é executado nightly em `main` e em
disparo manual; ele distribui em paralelo o mock parity gate, a lane Matrix ao vivo e a lane
Telegram ao vivo. As tarefas ao vivo usam o ambiente `qa-live-shared`,
e a lane do Telegram usa leases do Convex. `OpenClaw Release
Checks` também executa as mesmas lanes do QA Lab antes da aprovação da release.

O workflow `Duplicate PRs After Merge` é um workflow manual para mantenedores voltado à
limpeza de PRs duplicadas após merge. Por padrão, ele usa dry-run e só fecha PRs listadas
explicitamente quando `apply=true`. Antes de alterar o GitHub, ele verifica se a
PR integrada realmente foi merged e se cada duplicata tem ou um problema referenciado em comum
ou hunks alterados sobrepostos.

O workflow `Docs Agent` é uma lane de manutenção orientada a eventos do Codex para manter a
documentação existente alinhada com alterações integradas recentemente. Ele não tem agendamento puro:
uma execução bem-sucedida de CI em `main` por push não feito por bot pode acioná-lo, e o
disparo manual pode executá-lo diretamente. Invocações via workflow-run são ignoradas quando `main`
já avançou ou quando outra execução não ignorada do Docs Agent foi criada na última hora.
Quando ele é executado, revisa o intervalo de commits do SHA de origem da execução não ignorada
anterior do Docs Agent até o `main` atual, então uma execução horária pode cobrir todas as
mudanças acumuladas em main desde a última passagem pela documentação.

O workflow `Test Performance Agent` é uma lane de manutenção orientada a eventos do Codex
para testes lentos. Ele não tem agendamento puro: uma execução bem-sucedida de CI em `main`
por push não feito por bot pode acioná-lo, mas ele é ignorado se outra invocação por workflow-run
já tiver sido executada ou estiver em execução naquele dia UTC. O disparo manual ignora esse
gate diário de atividade. A lane gera um relatório de performance do Vitest da suíte completa
agrupado, permite que o Codex faça apenas pequenas correções de performance de teste que preservem
cobertura em vez de refatorações amplas, depois executa novamente o relatório da suíte completa
e rejeita alterações que reduzam a contagem de testes aprovados da baseline. Se a baseline tiver
testes com falha, o Codex pode corrigir apenas falhas óbvias, e o relatório pós-agente da suíte
completa precisa passar antes que qualquer coisa seja commitada. Quando `main` avança antes que
o push do bot seja integrado, a lane faz rebase do patch validado, executa `pnpm check:changed`
novamente e tenta o push de novo; patches obsoletos com conflito são ignorados. Ela usa Ubuntu
hospedado pelo GitHub para que a ação do Codex possa manter a mesma postura de segurança
drop-sudo do docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Visão geral das tarefas

| Tarefa                           | Objetivo                                                                                     | Quando é executada                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Detectar alterações somente de docs, escopos alterados, extensões alteradas e montar o manifesto do CI | Sempre em pushes e PRs não draft    |
| `security-scm-fast`              | Detecção de chave privada e auditoria de workflow via `zizmor`                              | Sempre em pushes e PRs não draft    |
| `security-dependency-audit`      | Auditoria do lockfile de produção sem dependências contra avisos do npm                      | Sempre em pushes e PRs não draft    |
| `security-fast`                  | Agregador obrigatório para as tarefas rápidas de segurança                                   | Sempre em pushes e PRs não draft    |
| `build-artifacts`                | Fazer build de `dist/`, Control UI, verificações de artefatos compilados e artefatos reutilizáveis para downstream | Alterações relevantes para Node     |
| `checks-fast-core`               | Lanes rápidas de correção no Linux, como verificações de bundled/plugin-contract/protocol    | Alterações relevantes para Node     |
| `checks-fast-contracts-channels` | Verificações fragmentadas de contratos de canais com um resultado agregado estável           | Alterações relevantes para Node     |
| `checks-node-extensions`         | Shards completos de teste de plugins incluídos em toda a suíte de extensões                  | Alterações relevantes para Node     |
| `checks-node-core-test`          | Shards de testes principais do Node, excluindo lanes de canais, bundled, contratos e extensões | Alterações relevantes para Node   |
| `extension-fast`                 | Testes focados apenas nos plugins incluídos alterados                                        | Pull requests com alterações em extensões |
| `check`                          | Equivalente fragmentado do gate principal local: tipos de produção, lint, guards, tipos de teste e smoke estrito | Alterações relevantes para Node |
| `check-additional`               | Shards de arquitetura, limites, guards de superfície de extensão, package-boundary e gateway-watch | Alterações relevantes para Node |
| `build-smoke`                    | Testes smoke da CLI compilada e smoke de memória na inicialização                            | Alterações relevantes para Node     |
| `checks`                         | Verificador para testes de canais de artefatos compilados mais compatibilidade Node 22 apenas em push | Alterações relevantes para Node |
| `check-docs`                     | Verificações de formatação, lint e links quebrados da documentação                           | Docs alteradas                      |
| `skills-python`                  | Ruff + pytest para Skills com backend em Python                                              | Alterações relevantes para Skills em Python |
| `checks-windows`                 | Lanes de teste específicas do Windows                                                        | Alterações relevantes para Windows  |
| `macos-node`                     | Lane de teste TypeScript no macOS usando os artefatos compilados compartilhados              | Alterações relevantes para macOS    |
| `macos-swift`                    | Lint, build e testes Swift para o app macOS                                                  | Alterações relevantes para macOS    |
| `android`                        | Testes unitários Android para ambas as variantes mais um build de APK de debug               | Alterações relevantes para Android  |
| `test-performance-agent`         | Otimização diária de testes lentos pelo Codex após atividade confiável                       | Sucesso do CI em main ou disparo manual |

## Ordem de falha rápida

As tarefas são ordenadas para que verificações baratas falhem antes que tarefas caras sejam executadas:

1. `preflight` decide quais lanes existem de fato. A lógica `docs-scope` e `changed-scope` são etapas dentro desta tarefa, não tarefas independentes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falham rapidamente sem esperar pelas tarefas mais pesadas de artefatos e matriz de plataforma.
3. `build-artifacts` se sobrepõe às lanes rápidas de Linux para que consumidores downstream possam começar assim que o build compartilhado estiver pronto.
4. Depois disso, as lanes mais pesadas de plataforma e runtime são distribuídas: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` apenas para PR, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

A lógica de escopo fica em `scripts/ci-changed-scope.mjs` e é coberta por testes unitários em `src/scripts/ci-changed-scope.test.ts`.
Edições no workflow de CI validam o grafo de CI do Node mais o lint de workflow, mas não forçam por si só builds nativos de Windows, Android ou macOS; essas lanes de plataforma continuam restritas a alterações no código-fonte da plataforma.
Edições apenas de roteamento de CI, edições selecionadas e baratas de fixtures de testes centrais e edições estreitas de helper/roteamento de testes de contrato de Plugin usam um caminho rápido de manifesto apenas para Node: preflight, segurança e uma única tarefa `checks-fast-core`. Esse caminho evita artefatos de build, compatibilidade com Node 22, contratos de canais, shards completos do core, shards de plugins incluídos e matrizes adicionais de guards quando os arquivos alterados se limitam às superfícies de roteamento ou helper que a tarefa rápida exercita diretamente.
As verificações de Node no Windows ficam restritas a wrappers específicos de processo/caminho do Windows, helpers de runner npm/pnpm/UI, configuração do gerenciador de pacotes e às superfícies de workflow de CI que executam essa lane; alterações não relacionadas no código-fonte, em Plugin, em install-smoke e alterações apenas de teste permanecem nas lanes de Node para Linux para que não reservem um worker Windows de 16 vCPU para cobertura que já é exercitada pelos shards normais de teste.
O workflow separado `install-smoke` reutiliza o mesmo script de escopo por meio da sua própria tarefa `preflight`. Ele divide a cobertura smoke em `run_fast_install_smoke` e `run_full_install_smoke`. Pull requests executam o caminho rápido para superfícies de Docker/pacote, alterações em pacote/manifesto de Plugin incluído e superfícies centrais de Plugin/canal/Gateway/SDK de Plugin que as tarefas smoke de Docker exercitam. Alterações apenas no código-fonte de Plugin incluído, edições apenas de teste e edições apenas de docs não reservam workers de Docker. O caminho rápido faz build da imagem do Dockerfile raiz uma vez, verifica a CLI, executa o smoke da CLI agents delete shared-workspace, executa o e2e container gateway-network, verifica um argumento de build de extensão incluída e executa o perfil Docker de Plugin incluído limitado sob um timeout agregado de comando de 240 segundos, com o `docker run` de cada cenário limitado separadamente. O caminho completo mantém a cobertura de instalação de pacote QR e de Docker/update do instalador para execuções agendadas nightly, disparos manuais, verificações de release por workflow-call e pull requests que realmente tocam superfícies de instalador/pacote/Docker. Pushes para `main`, incluindo commits de merge, não forçam o caminho completo; quando a lógica de escopo alterado pedir cobertura completa em um push, o workflow mantém o Docker smoke rápido e deixa o install smoke completo para a validação nightly ou de release. O smoke lento do provider de imagem de instalação global do Bun é controlado separadamente por `run_bun_global_install_smoke`; ele é executado no agendamento nightly e a partir do workflow de verificações de release, e disparos manuais de `install-smoke` podem optar por incluí-lo, mas pull requests e pushes para `main` não o executam. Testes QR e Docker do instalador mantêm seus próprios Dockerfiles focados em instalação. O `test:docker:all` local faz prebuild de uma imagem compartilhada de teste ao vivo e uma imagem compartilhada de app compilado `scripts/e2e/Dockerfile`, depois executa as lanes smoke live/E2E com um agendador ponderado e `OPENCLAW_SKIP_DOCKER_BUILD=1`; ajuste a contagem padrão de 10 slots do pool principal com `OPENCLAW_DOCKER_ALL_PARALLELISM` e a contagem de 10 slots do tail-pool sensível a provider com `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Os limites de lanes pesadas têm como padrão `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, para que lanes de instalação npm e com múltiplos serviços não sobrecarreguem o Docker enquanto lanes mais leves ainda ocupam os slots disponíveis. O início das lanes é escalonado em 2 segundos por padrão para evitar tempestades locais de criação no daemon do Docker; substitua com `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` ou outro valor em milissegundos. O agregado local faz preflight do Docker, remove contêineres E2E antigos do OpenClaw, emite o status das lanes ativas, persiste os tempos das lanes para ordenação da mais longa primeiro e oferece suporte a `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para inspeção do agendador. Ele para de agendar novas lanes em pool após a primeira falha por padrão, e cada lane tem um timeout de fallback de 120 minutos substituível com `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; lanes selecionadas live/tail usam limites por lane mais restritos. O workflow reutilizável live/E2E replica o padrão de imagem compartilhada ao fazer build e push de uma imagem Docker E2E GHCR com tag SHA antes da matriz Docker e depois executar a matriz com `OPENCLAW_SKIP_DOCKER_BUILD=1`. O workflow live/E2E agendado executa diariamente a suíte Docker completa do caminho de release. A matriz de atualização incluída é dividida por alvo de atualização para que passes repetidos de npm update e doctor repair possam ser fragmentados em paralelo com outras verificações incluídas.

A lógica local de lanes alteradas fica em `scripts/changed-lanes.mjs` e é executada por `scripts/check-changed.mjs`. Esse gate local é mais rigoroso em relação aos limites de arquitetura do que o escopo amplo de plataforma do CI: alterações de produção do core executam typecheck de produção do core mais testes do core, alterações apenas de teste do core executam apenas typecheck/testes de teste do core, alterações de produção de extensão executam typecheck de produção de extensão mais testes de extensão, e alterações apenas de teste de extensão executam apenas typecheck/testes de teste de extensão. Alterações públicas no SDK de Plugin ou no contrato de Plugin expandem para validação de extensão porque extensões dependem desses contratos centrais. Incrementos de versão apenas de metadados de release executam verificações direcionadas de versão/configuração/dependência de raiz. Alterações desconhecidas em raiz/configuração falham de forma segura para todas as lanes.

Em pushes, a matriz `checks` adiciona a lane `compat-node22`, executada apenas em push. Em pull requests, essa lane é ignorada e a matriz permanece focada nas lanes normais de teste/canal.

As famílias de testes Node mais lentas são divididas ou balanceadas para que cada tarefa permaneça pequena sem reservar runners em excesso: contratos de canais são executados como três shards ponderados, testes de plugins incluídos são balanceados entre seis workers de extensão, pequenas lanes unitárias do core são emparelhadas, auto-reply é executado como quatro workers balanceados com a subárvore de respostas dividida em shards agent-runner, dispatch e commands/state-routing, e configurações agentic de gateway/Plugin são distribuídas entre as tarefas Node agentic já existentes apenas de código-fonte em vez de esperar por artefatos compilados. Testes amplos de navegador, QA, mídia e plugins diversos usam suas configurações dedicadas do Vitest em vez do catch-all compartilhado de plugins. Tarefas de shard de extensão executam até dois grupos de configuração de Plugin por vez, com um worker do Vitest por grupo e um heap Node maior, para que lotes de plugins pesados em importação não criem tarefas extras de CI. A lane ampla de agents usa o agendador compartilhado de paralelismo por arquivo do Vitest porque é dominada por importação/agendamento, em vez de pertencer a um único arquivo de teste lento. `runtime-config` é executado com o shard infra core-runtime para que o shard compartilhado de runtime não concentre a cauda. Shards por padrão de inclusão registram entradas de tempo usando o nome do shard de CI, para que `.artifacts/vitest-shard-timings.json` possa distinguir uma configuração inteira de um shard filtrado. `check-additional` mantém juntos o trabalho de compilação/canary de limite de pacote e separa a arquitetura de topologia de runtime da cobertura de gateway watch; o shard de guard de limites executa seus pequenos guards independentes simultaneamente dentro de uma única tarefa. Gateway watch, testes de canais e o shard core support-boundary executam simultaneamente dentro de `build-artifacts` depois que `dist/` e `dist-runtime/` já foram compilados, mantendo seus nomes antigos de verificação como tarefas leves de verificação enquanto evitam dois workers extras do Blacksmith e uma segunda fila consumidora de artefatos.
O CI Android executa tanto `testPlayDebugUnitTest` quanto `testThirdPartyDebugUnitTest` e depois faz build do APK de debug Play. A variante third-party não tem conjunto de fontes nem manifesto separados; sua lane de teste unitário ainda compila essa variante com as flags BuildConfig de SMS/log de chamadas, evitando ao mesmo tempo um trabalho duplicado de empacotamento do APK de debug em cada push relevante para Android.
`extension-fast` é apenas para PR porque execuções de push já executam os shards completos de plugins incluídos. Isso mantém o feedback de plugins alterados para revisão sem reservar um worker extra do Blacksmith em `main` para uma cobertura já presente em `checks-node-extensions`.

O GitHub pode marcar tarefas substituídas como `cancelled` quando um push mais novo chega à mesma PR ou ref `main`. Trate isso como ruído de CI, a menos que a execução mais recente para a mesma ref também esteja falhando. Verificações agregadas de shard usam `!cancelled() && always()` para que ainda relatem falhas normais de shard, mas não entrem na fila depois que todo o workflow já tiver sido substituído.
A chave de concorrência do CI é versionada (`CI-v7-*`) para que um zumbi do lado do GitHub em um grupo antigo de fila não possa bloquear indefinidamente execuções mais novas de main.

## Runners

| Runner                           | Tarefas                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, tarefas rápidas de segurança e agregadores (`security-scm-fast`, `security-dependency-audit`, `security-fast`), verificações rápidas de protocolo/contrato/bundled, verificações fragmentadas de contrato de canais, shards de `check` exceto lint, shards e agregadores de `check-additional`, verificadores agregados de testes Node, verificações de docs, Skills em Python, workflow-sanity, labeler, auto-response; o preflight de install-smoke também usa Ubuntu hospedado pelo GitHub para que a matriz Blacksmith possa entrar na fila mais cedo |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shards de testes Node para Linux, shards de testes de plugins incluídos, `android`                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, que continua sensível o suficiente a CPU para que 8 vCPU custassem mais do que economizavam; builds Docker de install-smoke, em que o custo do tempo de fila de 32 vCPU superava o benefício                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` em `openclaw/openclaw`; forks usam `macos-latest` como fallback                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` em `openclaw/openclaw`; forks usam `macos-latest` como fallback                                                                                                                                                                                                                                                                                                                                                                                            |

## Equivalentes locais

```bash
pnpm changed:lanes   # inspeciona o classificador local de lanes alteradas para origin/main...HEAD
pnpm check:changed   # gate local inteligente: typecheck/lint/testes alterados por lane de limite
pnpm check          # gate local rápido: tsgo de produção + lint fragmentado + guards rápidos em paralelo
pnpm check:test-types
pnpm check:timed    # mesmo gate com tempos por estágio
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # testes do vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # formatação + lint + links quebrados da documentação
pnpm build          # compila dist quando as lanes de artefato/build-smoke do CI são relevantes
pnpm ci:timings                               # resume a execução mais recente do CI por push em origin/main
pnpm ci:timings:recent                        # compara execuções recentes bem-sucedidas do CI em main
node scripts/ci-run-timings.mjs <run-id>      # resume tempo total, tempo em fila e tarefas mais lentas
node scripts/ci-run-timings.mjs --latest-main # ignora ruído de issues/comentários e escolhe o CI por push em origin/main
node scripts/ci-run-timings.mjs --recent 10   # compara execuções recentes bem-sucedidas do CI em main
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Canais de release](/pt-BR/install/development-channels)
