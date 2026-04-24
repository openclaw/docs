---
read_when:
    - Você precisa entender por que um job de CI foi ou não executado
    - Você está depurando checks com falha no GitHub Actions
summary: Grafo de jobs de CI, gates de escopo e equivalentes locais de comandos
title: Pipeline de CI
x-i18n:
    generated_at: "2026-04-24T05:43:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e24efec145ff144b007e248ef0f9c56287619eb9af204d45d49984909a6136b
    source_path: ci.md
    workflow: 15
---

A CI é executada em cada push para `main` e em cada pull request. Ela usa escopo inteligente para pular jobs caros quando apenas áreas não relacionadas foram alteradas.

O QA Lab tem lanes dedicadas de CI fora do workflow principal com escopo inteligente. O
workflow `Parity gate` é executado em alterações correspondentes de PR e em dispatch manual; ele
faz build do runtime privado do QA e compara os pacotes agentic simulados GPT-5.4 e Opus 4.6.
O workflow `QA-Lab - All Lanes` é executado nightly em `main` e em
dispatch manual; ele distribui o mock parity gate, a lane Matrix live e a lane Telegram live como jobs paralelos. Os jobs live usam o ambiente `qa-live-shared`,
e a lane Telegram usa leases do Convex. `OpenClaw Release
Checks` também executa as mesmas lanes do QA Lab antes da aprovação da release.

O workflow `Duplicate PRs After Merge` é um workflow manual de mantenedor para
limpeza de duplicatas após o merge. Ele usa dry-run por padrão e só fecha PRs explicitamente
listadas quando `apply=true`. Antes de alterar o GitHub, ele verifica se a
PR landed foi merged e se cada duplicata tem uma issue referenciada compartilhada
ou hunks alterados sobrepostos.

O workflow `Docs Agent` é uma lane de manutenção Codex orientada a eventos para manter a
documentação existente alinhada com alterações landed recentemente. Ele não tem agendamento puro: uma
execução de CI bem-sucedida em `main` originada de push não-bot pode dispará-lo, e
o dispatch manual pode executá-lo diretamente. Invocações por workflow run são ignoradas quando
`main` já avançou ou quando outra execução do Docs Agent que não foi ignorada foi criada na última hora. Quando ele é executado,
ele revisa o intervalo de commits do SHA de origem do Docs Agent anterior que não foi ignorado até a
`main` atual, então uma execução horária pode cobrir todas as alterações em main acumuladas desde
a última passada na documentação.

O workflow `Test Performance Agent` é uma lane de manutenção Codex orientada a eventos
para testes lentos. Ele não tem agendamento puro: uma execução de CI bem-sucedida em `main` originada de push não-bot pode dispará-lo, mas ele é ignorado se outra invocação por workflow run já
executou ou está executando naquele dia UTC. O dispatch manual ignora esse
gate diário de atividade. A lane cria um relatório de desempenho do Vitest da suíte completa agrupado, permite que o Codex
faça apenas pequenas correções de desempenho de testes preservando cobertura em vez de refatorações amplas,
depois executa novamente o relatório da suíte completa e rejeita mudanças que reduzam a
contagem de testes aprovados da baseline. Se a baseline tiver testes com falha, o Codex pode corrigir
apenas falhas óbvias e o relatório pós-agente da suíte completa deve passar antes
que qualquer coisa seja commitada. Quando `main` avança antes de o push do bot chegar,
a lane aplica rebase no patch validado, executa novamente `pnpm check:changed` e tenta o push de novo;
patches obsoletos com conflito são ignorados. Ela usa Ubuntu hospedado pelo GitHub para que a
ação Codex possa manter a mesma postura de segurança drop-sudo do docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Visão geral dos jobs

| Job                              | Finalidade                                                                                   | Quando é executado                   |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Detectar alterações só de docs, escopos alterados, extensões alteradas e montar o manifesto da CI | Sempre em pushes e PRs não draft     |
| `security-scm-fast`              | Detecção de chave privada e auditoria de workflow via `zizmor`                               | Sempre em pushes e PRs não draft     |
| `security-dependency-audit`      | Auditoria do lockfile de produção sem dependências contra advisories do npm                  | Sempre em pushes e PRs não draft     |
| `security-fast`                  | Agregado obrigatório para os jobs rápidos de segurança                                       | Sempre em pushes e PRs não draft     |
| `build-artifacts`                | Build de `dist/`, Control UI, verificações de artefatos construídos e artefatos reutilizáveis para downstream | Alterações relevantes para Node      |
| `checks-fast-core`               | Lanes rápidas de correção no Linux, como verificações de bundled/plugin-contract/protocol    | Alterações relevantes para Node      |
| `checks-fast-contracts-channels` | Verificações sharded de contrato de canal com resultado agregado estável                     | Alterações relevantes para Node      |
| `checks-node-extensions`         | Shards completos de testes de plugins integrados em toda a suíte de extensões                | Alterações relevantes para Node      |
| `checks-node-core-test`          | Shards de testes do core Node, excluindo lanes de canal, integradas, de contrato e de extensão | Alterações relevantes para Node   |
| `extension-fast`                 | Testes focados apenas nos plugins integrados alterados                                       | Pull requests com alterações em extensões |
| `check`                          | Equivalente principal local sharded: types de produção, lint, guards, tipos de teste e smoke estrito | Alterações relevantes para Node |
| `check-additional`               | Shards de arquitetura, boundary, guards de superfície de extensão, package-boundary e gateway-watch | Alterações relevantes para Node |
| `build-smoke`                    | Testes smoke da CLI construída e smoke de memória na inicialização                           | Alterações relevantes para Node      |
| `checks`                         | Verificador para testes de canal com artefatos construídos mais compatibilidade Node 22 apenas em push | Alterações relevantes para Node |
| `check-docs`                     | Formatação, lint e verificação de links quebrados da documentação                            | Docs alteradas                       |
| `skills-python`                  | Ruff + pytest para Skills com backend em Python                                              | Alterações relevantes para Python Skills |
| `checks-windows`                 | Lanes de teste específicas do Windows                                                        | Alterações relevantes para Windows   |
| `macos-node`                     | Lane de teste TypeScript no macOS usando artefatos construídos compartilhados                | Alterações relevantes para macOS     |
| `macos-swift`                    | Lint, build e testes Swift para o app macOS                                                  | Alterações relevantes para macOS     |
| `android`                        | Testes unitários Android para ambos os flavors mais um build de APK debug                    | Alterações relevantes para Android   |
| `test-performance-agent`         | Otimização diária de testes lentos pelo Codex após atividade confiável                       | Sucesso da CI na main ou dispatch manual |

## Ordem fail-fast

Os jobs são ordenados para que verificações baratas falhem antes de as caras começarem:

1. `preflight` decide quais lanes existem. A lógica `docs-scope` e `changed-scope` são steps dentro deste job, não jobs independentes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falham rapidamente sem esperar os jobs mais pesados de artefatos e matriz de plataforma.
3. `build-artifacts` se sobrepõe às lanes rápidas de Linux para que consumidores downstream possam começar assim que o build compartilhado estiver pronto.
4. Depois disso, as lanes mais pesadas de plataforma e runtime se distribuem: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` apenas para PR, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

A lógica de escopo fica em `scripts/ci-changed-scope.mjs` e é coberta por testes unitários em `src/scripts/ci-changed-scope.test.ts`.
Edições no workflow de CI validam o grafo da CI de Node mais o lint do workflow, mas não forçam por si só builds nativos de Windows, Android ou macOS; essas lanes de plataforma continuam limitadas a alterações no código-fonte da plataforma.
As verificações Node de Windows são limitadas a wrappers de processo/caminho específicos do Windows, helpers de runner npm/pnpm/UI, configuração do package manager e superfícies de workflow de CI que executam essa lane; alterações não relacionadas em código-fonte, plugin, install-smoke e apenas testes permanecem nas lanes Linux Node para que não reservem um worker Windows de 16 vCPU para cobertura que já é exercida pelos shards normais de teste.
O workflow separado `install-smoke` reutiliza o mesmo script de escopo por meio do próprio job `preflight`. Ele divide a cobertura smoke em `run_fast_install_smoke` e `run_full_install_smoke`. Pull requests executam o caminho rápido para superfícies Docker/package, alterações de pacote/manifesto de plugin integrado e superfícies do core de plugin/channel/gateway/SDK de Plugin que os jobs smoke Docker exercitam. Alterações apenas no código-fonte de plugin integrado, edições apenas de teste e edições apenas de docs não reservam workers Docker. O caminho rápido faz build da imagem root Dockerfile uma vez, verifica a CLI, executa o e2e de gateway-network no contêiner, verifica um argumento de build de extensão integrada e executa o perfil Docker limitado de plugin integrado sob timeout de comando de 120 segundos. O caminho completo mantém a cobertura de instalação de pacote por QR e de Docker/update do instalador para execuções agendadas nightly, dispatches manuais, workflow-call de checks de release e pull requests que realmente tocam superfícies de instalador/package/Docker. Pushes para `main`, incluindo merge commits, não forçam o caminho completo; quando a lógica de changed-scope pedir cobertura completa em um push, o workflow mantém o Docker smoke rápido e deixa o install smoke completo para validação nightly ou de release. O smoke lento de global install do provedor de imagem Bun é controlado separadamente por `run_bun_global_install_smoke`; ele é executado no agendamento nightly e a partir do workflow de checks de release, e dispatches manuais de `install-smoke` podem optar por incluí-lo, mas pull requests e pushes para `main` não o executam. Testes Docker de QR e do instalador mantêm seus próprios Dockerfiles focados em instalação. O agregado local `test:docker:all` faz prebuild de uma imagem live-test compartilhada e uma imagem built-app compartilhada de `scripts/e2e/Dockerfile`, depois executa as lanes smoke live/E2E em paralelo com `OPENCLAW_SKIP_DOCKER_BUILD=1`; ajuste a concorrência padrão de 8 do pool principal com `OPENCLAW_DOCKER_ALL_PARALLELISM` e a concorrência de 8 do pool final sensível a providers com `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. O agregado local para de agendar novas lanes do pool após a primeira falha por padrão, e cada lane tem timeout de 120 minutos substituível por `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. O workflow reutilizável live/E2E espelha o padrão de imagem compartilhada fazendo build e push de uma imagem Docker E2E GHCR marcada com SHA antes da matriz Docker, depois executando a matriz com `OPENCLAW_SKIP_DOCKER_BUILD=1`. O workflow agendado live/E2E executa diariamente a suíte completa Docker do caminho de release. A matriz completa de update/channel integrado continua manual/suíte completa porque faz repetidas passagens reais de update npm e reparo doctor.

A lógica local de changed-lane fica em `scripts/changed-lanes.mjs` e é executada por `scripts/check-changed.mjs`. Esse gate local é mais estrito quanto a boundaries de arquitetura do que o amplo escopo de plataforma da CI: alterações de produção do core executam typecheck de produção do core mais testes do core, alterações apenas em testes do core executam apenas typecheck/testes de teste do core, alterações de produção de extensão executam typecheck de produção de extensão mais testes de extensão, e alterações apenas em testes de extensão executam apenas typecheck/testes de teste de extensão. Alterações no SDK público de Plugin ou em plugin-contract expandem para validação de extensão porque extensões dependem desses contratos do core. Bumps de versão apenas em metadados de release executam verificações direcionadas de versão/config/dependência raiz. Alterações desconhecidas em root/config falham com segurança para todas as lanes.

Em pushes, a matriz `checks` adiciona a lane `compat-node22`, apenas para push. Em pull requests, essa lane é ignorada e a matriz permanece focada nas lanes normais de teste/canal.

As famílias de testes Node mais lentas são divididas ou balanceadas para que cada job permaneça pequeno sem reservar runners em excesso: contratos de canal são executados como três shards ponderados, testes de plugins integrados são balanceados entre seis workers de extensões, pequenas lanes unitárias do core são emparelhadas, auto-reply é executado como três workers balanceados em vez de seis workers minúsculos, e configurações agentic de gateway/plugin são distribuídas pelos jobs Node agentic existentes apenas de source em vez de esperar por artefatos construídos. Testes amplos de browser, QA, mídia e plugins diversos usam suas configs Vitest dedicadas em vez do catch-all compartilhado de plugin. Jobs de shard de extensão executam grupos de configuração de plugin em série com um worker Vitest e um heap Node maior para que lotes de plugins pesados em import não comprometam demais runners pequenos de CI. A lane ampla de agents usa o agendador compartilhado de paralelismo por arquivo do Vitest porque é dominada por import/agendamento, e não por um único arquivo de teste lento. `runtime-config` é executado com o shard infra core-runtime para evitar que o shard compartilhado de runtime fique com a cauda. `check-additional` mantém juntos o trabalho de compile/canary de package-boundary e separa a arquitetura de topologia de runtime da cobertura de gateway watch; o shard de boundary guard executa seus pequenos guards independentes concorrentemente dentro de um único job. Gateway watch, testes de canal e o shard core support-boundary são executados concorrentemente dentro de `build-artifacts` depois que `dist/` e `dist-runtime/` já foram construídos, mantendo seus nomes antigos de check como jobs leves de verificação, ao mesmo tempo evitando dois workers Blacksmith extras e uma segunda fila de consumidores de artefatos.
A CI do Android executa `testPlayDebugUnitTest` e `testThirdPartyDebugUnitTest`, depois faz o build do APK Play debug. O flavor third-party não tem source set nem manifesto separados; sua lane de teste unitário ainda compila esse flavor com os flags BuildConfig de SMS/call-log, enquanto evita um job duplicado de empacotamento de APK debug em cada push relevante para Android.
`extension-fast` é apenas para PR porque execuções em push já executam os shards completos de plugins integrados. Isso mantém o feedback de plugins alterados para revisões sem reservar um worker Blacksmith extra em `main` para cobertura já presente em `checks-node-extensions`.

O GitHub pode marcar jobs substituídos como `cancelled` quando um push mais novo chega à mesma ref de PR ou `main`. Trate isso como ruído de CI, a menos que a execução mais nova para a mesma ref também esteja falhando. Checks agregados de shard usam `!cancelled() && always()` para ainda relatar falhas normais de shard, mas não entram na fila depois que todo o workflow já foi substituído.
A chave de concorrência da CI é versionada (`CI-v7-*`) para que um processo zumbi do lado do GitHub em um grupo de fila antigo não possa bloquear indefinidamente execuções mais novas em main.

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, jobs rápidos de segurança e agregados (`security-scm-fast`, `security-dependency-audit`, `security-fast`), checks rápidos de protocolo/contrato/integrados, checks sharded de contrato de canal, shards de `check` exceto lint, shards e agregados de `check-additional`, verificadores agregados de testes Node, checks de docs, Python Skills, workflow-sanity, labeler, auto-response; o preflight de install-smoke também usa Ubuntu hospedado pelo GitHub para que a matriz Blacksmith possa entrar na fila mais cedo |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shards de testes Linux Node, shards de testes de plugins integrados, `android`                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, que continua sensível o bastante a CPU para que 8 vCPU custassem mais do que economizavam; builds Docker de install-smoke, onde o custo de tempo de fila de 32 vCPU foi maior do que a economia                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` em `openclaw/openclaw`; forks usam `macos-latest` como fallback                                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` em `openclaw/openclaw`; forks usam `macos-latest` como fallback                                                                                                                                                                                                                                                                                                                                                                                          |

## Equivalentes locais

```bash
pnpm changed:lanes   # inspeciona o classificador local de changed-lane para origin/main...HEAD
pnpm check:changed   # gate local inteligente: typecheck/lint/testes alterados por lane de boundary
pnpm check          # gate local rápido: tsgo de produção + lint sharded + guards rápidos em paralelo
pnpm check:test-types
pnpm check:timed    # mesmo gate com tempos por estágio
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # testes vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # formatação + lint + links quebrados de docs
pnpm build          # faz build de dist quando as lanes de artefato/build-smoke da CI importam
node scripts/ci-run-timings.mjs <run-id>      # resume wall time, queue time e jobs mais lentos
node scripts/ci-run-timings.mjs --recent 10   # compara execuções recentes bem-sucedidas da CI em main
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Canais de release](/pt-BR/install/development-channels)
