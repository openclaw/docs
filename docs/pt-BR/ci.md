---
read_when:
    - Você precisa entender por que um job da CI executou ou não executou
    - Você está depurando verificações com falha do GitHub Actions
summary: Grafo de jobs da CI, portões de escopo e equivalentes de comandos locais
title: Pipeline de CI
x-i18n:
    generated_at: "2026-04-25T18:17:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 841b8036e59b5b03620b301918549670870842cc42681321a9b8f9d01792d950
    source_path: ci.md
    workflow: 15
---

A CI executa em cada push para `main` e em cada pull request. Ela usa escopo inteligente para pular jobs caros quando apenas áreas não relacionadas foram alteradas.

O QA Lab tem lanes de CI dedicadas fora do workflow principal com escopo inteligente. O
workflow `Parity gate` executa em alterações de PR correspondentes e em disparo manual; ele
faz o build do runtime privado de QA e compara os pacotes agênticos mock GPT-5.5 e Opus 4.6.
O workflow `QA-Lab - All Lanes` executa todas as noites em `main` e em
disparo manual; ele distribui o parity gate mock, a lane Matrix ao vivo e a lane Telegram ao vivo como jobs paralelos. Os jobs ao vivo usam o ambiente `qa-live-shared`,
e a lane Telegram usa leases do Convex. `OpenClaw Release
Checks` também executa as mesmas lanes do QA Lab antes da aprovação de release.

O workflow `Duplicate PRs After Merge` é um workflow manual para mantenedores para
limpeza de duplicatas após o merge. Ele usa dry-run por padrão e só fecha PRs listadas explicitamente
quando `apply=true`. Antes de alterar o GitHub, ele verifica se a PR aterrissada foi mesclada e se cada duplicata tem ou uma issue referenciada em comum
ou hunks alterados sobrepostos.

O workflow `Docs Agent` é uma lane de manutenção orientada por eventos do Codex para manter
a documentação existente alinhada com alterações aterrissadas recentemente. Ele não tem agendamento puro: uma execução bem-sucedida da CI em push para `main` sem bot pode acioná-lo, e o disparo manual pode
executá-lo diretamente. Invocações via workflow-run são puladas quando `main` avançou ou quando
outra execução não pulada do Docs Agent foi criada na última hora. Quando ele executa,
revisa o intervalo de commits do SHA de origem anterior do Docs Agent não pulado até a
`main` atual, então uma execução horária pode cobrir todas as alterações em main acumuladas desde
a última passada na documentação.

O workflow `Test Performance Agent` é uma lane de manutenção orientada por eventos do Codex
para testes lentos. Ele não tem agendamento puro: uma execução bem-sucedida da CI em push para
`main` sem bot pode acioná-lo, mas ele é pulado se outra invocação via workflow-run já
executou ou está executando naquele dia UTC. O disparo manual ignora essa trava diária
de atividade. A lane gera um relatório de performance do Vitest da suíte completa agrupado, permite que o Codex
faça apenas pequenas correções de performance de testes preservando cobertura em vez de refatorações amplas, depois reexecuta o relatório da suíte completa e rejeita alterações que reduzam a contagem de testes aprovados da linha de base. Se a linha de base tiver testes com falha, o Codex pode corrigir apenas falhas óbvias e o relatório pós-agente da suíte completa deve passar antes que qualquer coisa seja commitada. Quando a `main` avança antes de o push do bot aterrissar, a lane
faz rebase do patch validado, reexecuta `pnpm check:changed` e tenta o push novamente;
patches obsoletos com conflito são pulados. Ela usa Ubuntu hospedado pelo GitHub para que a action do Codex
possa manter a mesma postura de segurança de drop-sudo do docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Visão geral dos jobs

| Job                              | Finalidade                                                                                   | Quando executa                       |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Detectar alterações somente em docs, escopos alterados, extensões alteradas e montar o manifesto da CI | Sempre em pushes e PRs que não sejam draft |
| `security-scm-fast`              | Detecção de chave privada e auditoria de workflow via `zizmor`                               | Sempre em pushes e PRs que não sejam draft |
| `security-dependency-audit`      | Auditoria do lockfile de produção sem dependências contra avisos do npm                      | Sempre em pushes e PRs que não sejam draft |
| `security-fast`                  | Agregador obrigatório para os jobs rápidos de segurança                                       | Sempre em pushes e PRs que não sejam draft |
| `build-artifacts`                | Build de `dist/`, Control UI, verificações de artefatos de build e artefatos reutilizáveis para downstream | Alterações relevantes para Node      |
| `checks-fast-core`               | Lanes rápidas de correção no Linux, como verificações de bundled/plugin-contract/protocol     | Alterações relevantes para Node      |
| `checks-fast-contracts-channels` | Verificações fragmentadas de contratos de canais com um resultado agregado estável            | Alterações relevantes para Node      |
| `checks-node-extensions`         | Shards completos de testes de plugins empacotados em toda a suíte de extensões               | Alterações relevantes para Node      |
| `checks-node-core-test`          | Shards de testes centrais do Node, excluindo lanes de canais, bundled, contratos e extensões | Alterações relevantes para Node      |
| `extension-fast`                 | Testes focados apenas nos plugins empacotados alterados                                       | Pull requests com alterações em extensões |
| `check`                          | Equivalente principal local fragmentado do gate: tipos de produção, lint, guards, tipos de teste e smoke estrito | Alterações relevantes para Node      |
| `check-additional`               | Arquitetura, limites, guards de superfície de extensões, limite entre pacotes e shards de gateway-watch | Alterações relevantes para Node      |
| `build-smoke`                    | Testes smoke da CLI compilada e smoke de memória na inicialização                            | Alterações relevantes para Node      |
| `checks`                         | Verificador para testes de canais com artefatos compilados mais compatibilidade Node 22 apenas em push | Alterações relevantes para Node      |
| `check-docs`                     | Verificações de formatação, lint e links quebrados da documentação                           | Docs alteradas                       |
| `skills-python`                  | Ruff + pytest para Skills com backend em Python                                               | Alterações relevantes para Skills em Python |
| `checks-windows`                 | Lanes de teste específicas do Windows                                                         | Alterações relevantes para Windows   |
| `macos-node`                     | Lane de teste TypeScript no macOS usando os artefatos compilados compartilhados              | Alterações relevantes para macOS     |
| `macos-swift`                    | Lint, build e testes em Swift para o app macOS                                               | Alterações relevantes para macOS     |
| `android`                        | Testes unitários Android para ambos os flavors mais um build de APK de debug                 | Alterações relevantes para Android   |
| `test-performance-agent`         | Otimização diária de testes lentos pelo Codex após atividade confiável                       | Sucesso da CI na main ou disparo manual |

## Ordem de fail-fast

Os jobs são ordenados para que verificações baratas falhem antes de as caras executarem:

1. `preflight` decide quais lanes existem afinal. A lógica `docs-scope` e `changed-scope` são etapas dentro deste job, não jobs independentes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falham rapidamente sem esperar pelos jobs mais pesados de artefatos e matriz de plataformas.
3. `build-artifacts` sobrepõe com as lanes rápidas do Linux para que consumidores downstream possam começar assim que o build compartilhado estiver pronto.
4. Depois disso, as lanes mais pesadas de plataforma e runtime se distribuem: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` apenas para PR, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

A lógica de escopo fica em `scripts/ci-changed-scope.mjs` e é coberta por testes unitários em `src/scripts/ci-changed-scope.test.ts`.
Edições no workflow de CI validam o grafo da CI de Node e o lint dos workflows, mas por si só não forçam builds nativos de Windows, Android ou macOS; essas lanes de plataforma continuam limitadas a alterações no código-fonte da respectiva plataforma.
Edições somente de roteamento da CI, edições selecionadas e baratas de fixtures de testes centrais e edições estreitas de helper/test-routing de contratos de plugins usam um caminho rápido de manifesto somente para Node: preflight, segurança e uma única tarefa `checks-fast-core`. Esse caminho evita artefatos de build, compatibilidade com Node 22, contratos de canais, shards completos do core, shards de plugins empacotados e matrizes adicionais de guards quando os arquivos alterados se limitam às superfícies de roteamento ou helper que a tarefa rápida exercita diretamente.
As verificações de Node no Windows são limitadas a wrappers específicos de processo/caminho do Windows, helpers de executor npm/pnpm/UI, configuração do gerenciador de pacotes e as superfícies de workflow da CI que executam essa lane; alterações não relacionadas em código-fonte, plugins, install-smoke e somente em testes permanecem nas lanes de Node Linux para que não reservem um worker Windows de 16 vCPU para cobertura que já é exercida pelos shards normais de teste.
O workflow separado `install-smoke` reutiliza o mesmo script de escopo por meio do seu próprio job `preflight`. Ele divide a cobertura smoke em `run_fast_install_smoke` e `run_full_install_smoke`. Pull requests executam o caminho rápido para superfícies de Docker/pacote, alterações em pacote/manifesto de plugin empacotado e superfícies centrais de plugin/canal/gateway/Plugin SDK que os jobs smoke de Docker exercitam. Alterações somente no código-fonte de plugins empacotados, edições somente de teste e edições somente de docs não reservam workers de Docker. O caminho rápido faz o build da imagem do Dockerfile raiz uma vez, verifica a CLI, executa o smoke de CLI de exclusão de workspace compartilhado de agents, executa o e2e de gateway-network em container, verifica um argumento de build de extensão empacotada e executa o perfil Docker limitado de plugin empacotado sob um timeout agregado de comando de 240 segundos, com cada `docker run` de cenário limitado separadamente. O caminho completo mantém a instalação de pacote QR e a cobertura de Docker/update do instalador para execuções noturnas agendadas, disparos manuais, verificações de release por workflow-call e pull requests que realmente toquem superfícies de instalador/pacote/Docker. Pushes para `main`, incluindo commits de merge, não forçam o caminho completo; quando a lógica de changed-scope pedir cobertura completa em um push, o workflow mantém o smoke rápido de Docker e deixa o install smoke completo para a validação noturna ou de release. O smoke lento de provedor de imagem com instalação global de Bun é controlado separadamente por `run_bun_global_install_smoke`; ele executa no agendamento noturno e a partir do workflow de verificações de release, e disparos manuais de `install-smoke` podem optar por incluí-lo, mas pull requests e pushes para `main` não o executam. Os testes Docker de QR e instalador mantêm seus próprios Dockerfiles focados em instalação. O `test:docker:all` local faz prebuild de uma imagem compartilhada de live-test e de uma imagem built-app compartilhada de `scripts/e2e/Dockerfile`, depois executa as lanes smoke live/E2E com um agendador ponderado e `OPENCLAW_SKIP_DOCKER_BUILD=1`; ajuste a contagem padrão de slots do pool principal de 10 com `OPENCLAW_DOCKER_ALL_PARALLELISM` e a contagem de slots padrão de 10 do tail-pool sensível a provider com `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Os limites das lanes pesadas usam por padrão `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, para que as lanes de instalação npm e de múltiplos serviços não sobrecarreguem o Docker enquanto lanes mais leves ainda ocupam os slots disponíveis. Os inícios das lanes são escalonados por 2 segundos por padrão para evitar tempestades locais de criação no daemon do Docker; substitua com `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` ou outro valor em milissegundos. O agregador local primeiro valida o Docker, remove containers E2E obsoletos do OpenClaw, emite o status das lanes ativas, persiste tempos das lanes para ordenação do mais demorado primeiro e oferece suporte a `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para inspeção do agendador. Ele para de agendar novas lanes em pool após a primeira falha por padrão, e cada lane tem um timeout de contingência de 120 minutos, substituível com `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; algumas lanes live/tail selecionadas usam limites por lane mais apertados. O workflow reutilizável live/E2E espelha o padrão de imagem compartilhada ao fazer build e push de uma única imagem Docker E2E no GHCR com tag do SHA antes da matriz Docker, depois executa a matriz com `OPENCLAW_SKIP_DOCKER_BUILD=1`. O workflow agendado live/E2E executa diariamente a suíte Docker completa do caminho de release. A matriz de atualização empacotada é dividida por alvo de atualização para que passes repetidos de atualização npm e reparo doctor possam ser fragmentados junto com outras verificações empacotadas.

A lógica local de changed-lane fica em `scripts/changed-lanes.mjs` e é executada por `scripts/check-changed.mjs`. Esse gate local é mais estrito quanto a limites de arquitetura do que o escopo amplo de plataforma da CI: alterações de produção do core executam typecheck de produção do core mais testes do core, alterações somente em testes do core executam apenas typecheck/testes de teste do core, alterações de produção de extensões executam typecheck de produção de extensões mais testes de extensões, e alterações somente em testes de extensões executam apenas typecheck/testes de teste de extensões. Alterações públicas de Plugin SDK ou de contrato de plugin expandem para validação de extensões porque as extensões dependem desses contratos centrais. Bumps de versão somente em metadados de release executam verificações direcionadas de versão/config/dependência de raiz. Alterações desconhecidas em raiz/config falham com segurança para todas as lanes.

Em pushes, a matriz `checks` adiciona a lane `compat-node22`, somente para push. Em pull requests, essa lane é pulada e a matriz permanece focada nas lanes normais de teste/canal.

As famílias mais lentas de testes de Node são divididas ou balanceadas para que cada job permaneça pequeno sem reservar runners em excesso: contratos de canais executam como três shards ponderados, testes de plugins empacotados se equilibram entre seis workers de extensão, pequenas lanes unitárias do core são emparelhadas, auto-reply executa em três workers balanceados em vez de seis workers minúsculos, e configurações agênticas de gateway/plugin são distribuídas entre os jobs existentes de Node agêntico somente de código-fonte em vez de esperar por artefatos compilados. Testes amplos de browser, QA, mídia e plugins diversos usam suas configurações Vitest dedicadas em vez do catch-all compartilhado de plugins. Jobs de shards de extensão executam até dois grupos de configuração de plugin por vez, com um worker Vitest por grupo e um heap Node maior, para que lotes pesados de plugins em importação não criem jobs extras na CI. A lane ampla de agents usa o agendador compartilhado de paralelismo por arquivo do Vitest porque é dominada por importação/agendamento, e não por um único arquivo de teste lento. `runtime-config` executa com o shard infra core-runtime para evitar que o shard de runtime compartilhado concentre a cauda. `check-additional` mantém juntos o trabalho de compile/canary de package-boundary e separa a arquitetura de topologia de runtime da cobertura de gateway watch; o shard de boundary guard executa seus pequenos guards independentes de forma concorrente dentro de um job. Gateway watch, testes de canais e o shard core support-boundary executam de forma concorrente dentro de `build-artifacts` depois que `dist/` e `dist-runtime/` já foram compilados, mantendo seus nomes antigos de check como jobs verificadores leves e evitando dois workers extras do Blacksmith e uma segunda fila de consumo de artefatos.
A CI de Android executa `testPlayDebugUnitTest` e `testThirdPartyDebugUnitTest`, depois faz o build do APK Play debug. O flavor third-party não tem source set nem manifesto separado; sua lane de teste unitário ainda compila esse flavor com os sinalizadores BuildConfig de SMS/log de chamadas, ao mesmo tempo que evita um job duplicado de empacotamento de APK debug em cada push relevante para Android.
`extension-fast` é somente para PR porque execuções em push já executam os shards completos de plugins empacotados. Isso mantém o feedback de plugins alterados para revisão sem reservar um worker extra do Blacksmith em `main` para cobertura já presente em `checks-node-extensions`.

O GitHub pode marcar jobs substituídos como `cancelled` quando um push mais novo chega na mesma PR ou na mesma ref `main`. Trate isso como ruído de CI, a menos que a execução mais recente para a mesma ref também esteja falhando. Verificações agregadas de shards usam `!cancelled() && always()` para ainda reportarem falhas normais de shard, mas não entrarem na fila depois que o workflow inteiro já foi substituído.
A chave de concorrência da CI é versionada (`CI-v7-*`) para que um processo zumbi do lado do GitHub em um grupo antigo de fila não possa bloquear indefinidamente execuções mais novas da main.

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, jobs rápidos de segurança e agregadores (`security-scm-fast`, `security-dependency-audit`, `security-fast`), verificações rápidas de protocolo/contrato/bundled, verificações fragmentadas de contratos de canais, shards de `check` exceto lint, shards e agregadores de `check-additional`, verificadores agregados de testes Node, verificações de docs, Skills em Python, workflow-sanity, labeler, auto-response; o preflight de install-smoke também usa Ubuntu hospedado pelo GitHub para que a matriz do Blacksmith possa entrar na fila mais cedo |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shards de testes Node no Linux, shards de testes de plugins empacotados, `android`                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, que continua sensível a CPU o bastante para que 8 vCPU custem mais do que economizam; builds Docker de install-smoke, em que o custo de tempo de fila de 32 vCPU era maior do que a economia                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` em `openclaw/openclaw`; forks usam `macos-latest` como fallback                                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` em `openclaw/openclaw`; forks usam `macos-latest` como fallback                                                                                                                                                                                                                                                                                                                                                                                          |

## Equivalentes locais

```bash
pnpm changed:lanes   # inspeciona o classificador local de changed-lane para origin/main...HEAD
pnpm check:changed   # gate local inteligente: typecheck/lint/testes alterados por lane de boundary
pnpm check          # gate local rápido: tsgo de produção + lint fragmentado + guards rápidos em paralelo
pnpm check:test-types
pnpm check:timed    # mesmo gate com tempos por estágio
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # testes do vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # formato + lint + links quebrados da documentação
pnpm build          # compila dist/ quando as lanes de artefato/build-smoke da CI são relevantes
node scripts/ci-run-timings.mjs <run-id>      # resume tempo total, tempo em fila e os jobs mais lentos
node scripts/ci-run-timings.mjs --recent 10   # compara execuções recentes bem-sucedidas da CI na main
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Relacionados

- [Visão geral da instalação](/pt-BR/install)
- [Canais de release](/pt-BR/install/development-channels)
