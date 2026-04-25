---
read_when:
    - Você precisa entender por que um job de CI foi ou não executado
    - Você está depurando verificações com falha no GitHub Actions
summary: Grafo de jobs de CI, gates de escopo e equivalentes de comandos locais
title: Pipeline de CI
x-i18n:
    generated_at: "2026-04-25T13:42:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: fc363efb98c9f82b585161a017ba1c599344a4e38c3fe683d81b0997d1d2fd4d
    source_path: ci.md
    workflow: 15
---

A CI é executada em cada push para `main` e em toda pull request. Ela usa escopo inteligente para pular jobs caros quando apenas áreas não relacionadas foram alteradas.

O QA Lab tem lanes de CI dedicadas fora do workflow principal com escopo inteligente. O
workflow `Parity gate` é executado em mudanças correspondentes na PR e por disparo manual; ele
faz o build do runtime privado de QA e compara os pacotes agentic simulados GPT-5.4 e Opus 4.6.
O workflow `QA-Lab - All Lanes` é executado todas as noites em `main` e por
disparo manual; ele distribui o parity gate simulado, a lane Matrix ao vivo e a lane
Telegram ao vivo como jobs paralelos. Os jobs ao vivo usam o ambiente
`qa-live-shared`, e a lane do Telegram usa leases do Convex. `OpenClaw Release
Checks` também executa essas mesmas lanes do QA Lab antes da aprovação de release.

O workflow `Duplicate PRs After Merge` é um workflow manual de mantenedor para
limpeza de PRs duplicadas após merge. Ele usa dry-run por padrão e só fecha PRs
explicitamente listadas quando `apply=true`. Antes de modificar o GitHub, ele verifica que a
PR integrada foi mesclada e que cada duplicata tem um issue referenciado em comum
ou hunks alterados sobrepostos.

O workflow `Docs Agent` é uma lane de manutenção Codex orientada a eventos para manter a
documentação existente alinhada com mudanças integradas recentemente. Ele não tem agendamento puro: uma
execução de CI bem-sucedida em push não-bot em `main` pode acioná-lo, e o disparo manual pode
executá-lo diretamente. Invocações por workflow-run são ignoradas quando `main` já avançou ou quando
outra execução `Docs Agent` não ignorada foi criada na última hora. Quando é executado, ele
analisa o intervalo de commits do SHA de origem do `Docs Agent` anterior não ignorado até a
`main` atual, então uma execução por hora pode cobrir todas as mudanças em main acumuladas desde
a última passada na documentação.

O workflow `Test Performance Agent` é uma lane de manutenção Codex orientada a eventos
para testes lentos. Ele não tem agendamento puro: uma execução de CI bem-sucedida em push não-bot em
`main` pode acioná-lo, mas ele é ignorado se outra invocação por workflow-run já
foi executada ou está em execução naquele dia UTC. O disparo manual ignora esse
gate diário de atividade. A lane gera um relatório completo de desempenho do Vitest agrupado da suíte inteira, permite que o Codex
faça apenas pequenas correções de desempenho de testes preservando cobertura, em vez de refatorações amplas,
depois executa novamente o relatório da suíte inteira e rejeita mudanças que reduzam a
contagem de testes aprovados na linha de base. Se a linha de base tiver testes com falha, o Codex pode corrigir
apenas falhas óbvias, e o relatório completo após o agente deve passar antes de qualquer
commit ser feito. Quando `main` avança antes de o push do bot ser integrado, a lane
faz rebase do patch validado, executa novamente `pnpm check:changed` e tenta o push de novo;
patches antigos com conflito são ignorados. Ela usa Ubuntu hospedado pelo GitHub para que a
ação Codex possa manter a mesma postura de segurança drop-sudo do docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Visão geral dos jobs

| Job                              | Finalidade                                                                                   | Quando é executado                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Detectar mudanças somente em docs, escopos alterados, extensions alteradas e gerar o manifesto da CI | Sempre em pushes e PRs não draft    |
| `security-scm-fast`              | Detecção de chave privada e auditoria de workflow via `zizmor`                              | Sempre em pushes e PRs não draft    |
| `security-dependency-audit`      | Auditoria do lockfile de produção sem dependências contra advisories do npm                 | Sempre em pushes e PRs não draft    |
| `security-fast`                  | Agregado obrigatório para os jobs rápidos de segurança                                      | Sempre em pushes e PRs não draft    |
| `build-artifacts`                | Build de `dist/`, Control UI, verificações de artefatos compilados e artefatos reutilizáveis para downstream | Mudanças relevantes para Node       |
| `checks-fast-core`               | Lanes rápidas de correção no Linux, como verificações de pacote incluído/contrato de Plugin/protocolo | Mudanças relevantes para Node       |
| `checks-fast-contracts-channels` | Verificações fragmentadas de contratos de canais com um resultado agregado estável          | Mudanças relevantes para Node       |
| `checks-node-extensions`         | Shards completos de testes de plugins incluídos em toda a suíte de extensions               | Mudanças relevantes para Node       |
| `checks-node-core-test`          | Shards de testes Node do núcleo, excluindo lanes de canais, pacote incluído, contrato e extension | Mudanças relevantes para Node       |
| `extension-fast`                 | Testes focados apenas nos plugins incluídos alterados                                       | Pull requests com mudanças em extension |
| `check`                          | Equivalente ao gate local principal em shards: tipos de produção, lint, guards, tipos de teste e smoke estrito | Mudanças relevantes para Node       |
| `check-additional`               | Arquitetura, limites, guards de superfície de extension, limites de pacote e shards de gateway-watch | Mudanças relevantes para Node       |
| `build-smoke`                    | Testes smoke da CLI compilada e smoke de memória na inicialização                           | Mudanças relevantes para Node       |
| `checks`                         | Verificador para testes de canal com artefatos compilados mais compatibilidade Node 22 apenas em push | Mudanças relevantes para Node       |
| `check-docs`                     | Verificações de formatação, lint e links quebrados da documentação                          | Docs alteradas                      |
| `skills-python`                  | Ruff + pytest para Skills com backend em Python                                             | Mudanças relevantes para Skills em Python |
| `checks-windows`                 | Lanes de teste específicas do Windows                                                       | Mudanças relevantes para Windows    |
| `macos-node`                     | Lane de teste TypeScript no macOS usando os artefatos compilados compartilhados             | Mudanças relevantes para macOS      |
| `macos-swift`                    | Lint, build e testes Swift para o app macOS                                                 | Mudanças relevantes para macOS      |
| `android`                        | Testes unitários Android para ambos os sabores mais um build de APK debug                   | Mudanças relevantes para Android    |
| `test-performance-agent`         | Otimização diária de testes lentos com Codex após atividade confiável                       | Sucesso da CI em main ou disparo manual |

## Ordem de fail-fast

Os jobs são ordenados para que verificações baratas falhem antes que as mais caras sejam executadas:

1. `preflight` decide quais lanes existem de fato. A lógica `docs-scope` e `changed-scope` são steps dentro deste job, não jobs independentes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falham rapidamente sem esperar os jobs mais pesados de artefatos e matriz de plataforma.
3. `build-artifacts` se sobrepõe às lanes rápidas de Linux para que consumidores downstream possam começar assim que o build compartilhado estiver pronto.
4. As lanes mais pesadas de plataforma e runtime se distribuem depois disso: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` apenas para PR, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

A lógica de escopo fica em `scripts/ci-changed-scope.mjs` e é coberta por testes unitários em `src/scripts/ci-changed-scope.test.ts`.
Edições no workflow de CI validam o grafo de CI de Node mais o lint de workflow, mas não forçam, por si só, builds nativos de Windows, Android ou macOS; essas lanes de plataforma continuam limitadas a mudanças no código-fonte da própria plataforma.
Edições apenas de roteamento de CI, edições selecionadas e baratas de fixtures de testes do núcleo e edições estreitas de helpers/roteamento de testes de contrato de plugin usam um caminho rápido de manifesto somente para Node: preflight, segurança e uma única tarefa `checks-fast-core`. Esse caminho evita artefatos de build, compatibilidade com Node 22, contratos de canais, shards completos do núcleo, shards de plugins incluídos e matrizes adicionais de guard quando os arquivos alterados se limitam às superfícies de roteamento ou helper que a tarefa rápida exercita diretamente.
As verificações de Node no Windows têm escopo limitado a wrappers de processo/caminho específicos do Windows, helpers de runner npm/pnpm/UI, configuração do gerenciador de pacotes e às superfícies de workflow de CI que executam essa lane; mudanças não relacionadas em código-fonte, plugin, install-smoke e somente testes permanecem nas lanes de Node em Linux para não reservar um worker Windows de 16 vCPU para cobertura que já é exercitada pelos shards normais de teste.
O workflow separado `install-smoke` reutiliza o mesmo script de escopo por meio do próprio job `preflight`. Ele divide a cobertura smoke em `run_fast_install_smoke` e `run_full_install_smoke`. Pull requests executam o caminho rápido para superfícies Docker/pacote, mudanças de pacote/manifest de plugins incluídos e superfícies de núcleo plugin/canal/gateway/Plugin SDK que os jobs smoke de Docker exercitam. Mudanças somente em código-fonte de plugins incluídos, edições somente de teste e edições somente de docs não reservam workers Docker. O caminho rápido faz o build da imagem Dockerfile raiz uma vez, verifica a CLI, executa o smoke da CLI `agents delete shared-workspace`, executa o e2e `gateway-network` em contêiner, verifica um argumento de build de extension incluída e executa o perfil Docker limitado de plugin incluído sob um timeout agregado de comando de 240 segundos, com o `docker run` de cada cenário limitado separadamente. O caminho completo mantém a cobertura de instalação de pacote por QR e Docker/update do instalador para execuções agendadas noturnas, disparos manuais, verificações de release por workflow-call e pull requests que realmente tocam superfícies de instalador/pacote/Docker. Pushes para `main`, incluindo commits de merge, não forçam o caminho completo; quando a lógica de changed-scope pedir cobertura completa em um push, o workflow mantém o smoke rápido de Docker e deixa o install smoke completo para a validação noturna ou de release. O smoke lento do provedor de imagem de instalação global Bun é controlado separadamente por `run_bun_global_install_smoke`; ele é executado no agendamento noturno e a partir do workflow de verificações de release, e disparos manuais de `install-smoke` podem optar por ele, mas pull requests e pushes para `main` não o executam. Os testes Docker de QR e instalador mantêm seus próprios Dockerfiles focados em instalação. O `test:docker:all` local faz prebuild de uma imagem compartilhada de live-test e uma imagem compartilhada de app compilado `scripts/e2e/Dockerfile`, depois executa as lanes smoke live/E2E com um agendador ponderado e `OPENCLAW_SKIP_DOCKER_BUILD=1`; ajuste a contagem padrão de slots do pool principal de 10 com `OPENCLAW_DOCKER_ALL_PARALLELISM` e a contagem de slots do tail-pool sensível a provider de 10 com `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Os limites de lanes pesadas usam por padrão `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` para que lanes de instalação npm e multi-serviço não sobrecarreguem o Docker, enquanto lanes mais leves ainda ocupam os slots disponíveis. Os inícios das lanes são escalonados em 2 segundos por padrão para evitar tempestades de criação no daemon Docker local; substitua com `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` ou outro valor em milissegundos. O agregado local faz preflight do Docker, remove contêineres E2E obsoletos do OpenClaw, emite o status de lanes ativas, persiste tempos de execução das lanes para ordenação do maior para o menor e oferece suporte a `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para inspeção do agendador. Ele interrompe o agendamento de novas lanes agrupadas após a primeira falha por padrão, e cada lane tem um timeout de fallback de 120 minutos, substituível com `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; algumas lanes live/tail selecionadas usam limites mais apertados por lane. O workflow reutilizável live/E2E espelha o padrão de imagem compartilhada ao compilar e publicar uma única imagem Docker E2E no GHCR com tag SHA antes da matriz Docker e depois executar a matriz com `OPENCLAW_SKIP_DOCKER_BUILD=1`. O workflow agendado live/E2E executa diariamente a suíte Docker completa do caminho de release. A matriz de atualização incluída é dividida por alvo de atualização para que passes repetidos de npm update e doctor repair possam ser fragmentados junto com outras verificações incluídas.

A lógica local de changed-lane fica em `scripts/changed-lanes.mjs` e é executada por `scripts/check-changed.mjs`. Esse gate local é mais rigoroso quanto a limites de arquitetura do que o amplo escopo de plataforma da CI: mudanças de produção do núcleo executam typecheck de produção do núcleo mais testes do núcleo, mudanças somente em testes do núcleo executam apenas typecheck/testes de testes do núcleo, mudanças de produção de extension executam typecheck de produção de extension mais testes de extension, e mudanças somente em testes de extension executam apenas typecheck/testes de testes de extension. Mudanças públicas de Plugin SDK ou contrato de plugin expandem para validação de extension porque extensions dependem desses contratos do núcleo. Incrementos de versão somente em metadados de release executam verificações direcionadas de versão/configuração/dependências de raiz. Mudanças desconhecidas em raiz/configuração falham de forma segura para todas as lanes.

Em pushes, a matriz `checks` adiciona a lane `compat-node22`, exclusiva para push. Em pull requests, essa lane é ignorada e a matriz permanece focada nas lanes normais de teste/canal.

As famílias de testes Node mais lentas são divididas ou balanceadas para que cada job permaneça pequeno sem reservar runners em excesso: contratos de canais executam como três shards ponderados, testes de plugins incluídos são balanceados em seis workers de extension, pequenas lanes unitárias do núcleo são agrupadas em pares, auto-reply executa como três workers balanceados em vez de seis workers minúsculos, e configurações agentic de gateway/plugin são distribuídas entre os jobs Node agentic existentes somente de código-fonte em vez de esperar por artefatos compilados. Testes amplos de navegador, QA, mídia e plugins diversos usam suas configurações Vitest dedicadas em vez do catch-all compartilhado de plugin. Jobs shard de extension executam até dois grupos de configuração de plugin por vez com um worker Vitest por grupo e um heap Node maior para que lotes de plugins com muitas importações não criem jobs extras de CI. A lane ampla de agentes usa o agendador compartilhado de paralelismo por arquivo do Vitest porque é dominada por importação/agendamento, e não por um único arquivo de teste lento. `runtime-config` é executado com o shard `infra core-runtime` para evitar que o shard de runtime compartilhado fique com o tail. `check-additional` mantém juntos o trabalho de compilação/canary de limite de pacote e separa a arquitetura de topologia de runtime da cobertura de gateway watch; o shard de guard de limites executa seus pequenos guards independentes em paralelo dentro de um único job. Gateway watch, testes de canal e o shard de limite de suporte do núcleo executam em paralelo dentro de `build-artifacts` depois que `dist/` e `dist-runtime/` já foram compilados, mantendo seus nomes antigos de check como jobs leves de verificação, enquanto evitam dois workers Blacksmith extras e uma segunda fila de consumidores de artefatos.
A CI de Android executa `testPlayDebugUnitTest` e `testThirdPartyDebugUnitTest`, depois compila o APK debug Play. O flavor third-party não tem source set nem manifest separado; sua lane de testes unitários ainda compila esse flavor com as flags SMS/call-log de BuildConfig, evitando ao mesmo tempo um job duplicado de empacotamento de APK debug em todo push relevante para Android.
`extension-fast` é exclusiva para PR porque execuções em push já executam os shards completos de plugins incluídos. Isso mantém o feedback de plugins alterados para revisão sem reservar um worker Blacksmith extra em `main` para cobertura já presente em `checks-node-extensions`.

O GitHub pode marcar jobs substituídos como `cancelled` quando um push mais novo chega na mesma PR ou ref `main`. Trate isso como ruído de CI, a menos que a execução mais recente para a mesma ref também esteja falhando. Checks agregados de shard usam `!cancelled() && always()` para continuar relatando falhas normais de shard, mas não entram na fila quando todo o workflow já foi substituído.
A chave de concorrência da CI é versionada (`CI-v7-*`) para que um zumbi do lado do GitHub em um grupo de fila antigo não bloqueie indefinidamente execuções mais novas em main.

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, jobs rápidos de segurança e agregados (`security-scm-fast`, `security-dependency-audit`, `security-fast`), verificações rápidas de protocolo/contrato/pacote incluído, verificações fragmentadas de contrato de canal, shards de `check` exceto lint, shards e agregados de `check-additional`, verificadores agregados de testes Node, verificações de docs, Skills em Python, workflow-sanity, labeler, auto-response; o preflight de install-smoke também usa Ubuntu hospedado pelo GitHub para que a matriz Blacksmith possa entrar na fila mais cedo |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shards de testes Node em Linux, shards de testes de plugins incluídos, `android`                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, que continua sensível o bastante a CPU a ponto de 8 vCPU custarem mais do que economizarem; builds Docker de install-smoke, nos quais o custo de tempo em fila de 32 vCPU foi maior do que a economia                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` em `openclaw/openclaw`; forks usam `macos-latest` como fallback                                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` em `openclaw/openclaw`; forks usam `macos-latest` como fallback                                                                                                                                                                                                                                                                                                                                                                                          |

## Equivalentes locais

```bash
pnpm changed:lanes   # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed   # smart local gate: changed typecheck/lint/tests by boundary lane
pnpm check          # fast local gate: production tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed    # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest tests
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docs format + lint + broken links
pnpm build          # build dist when CI artifact/build-smoke lanes matter
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Relacionado

- [Visão geral de instalação](/pt-BR/install)
- [Canais de release](/pt-BR/install/development-channels)
