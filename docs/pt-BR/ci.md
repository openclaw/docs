---
read_when:
    - Você precisa entender por que um job de CI foi ou não executado
    - Você está depurando verificações do GitHub Actions com falha
summary: Grafo de jobs de CI, gates de escopo e equivalentes de comandos locais
title: Pipeline de CI
x-i18n:
    generated_at: "2026-04-23T13:59:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5a8ea0d8e428826169b0e6aced1caeb993106fe79904002125ace86b48cae1f
    source_path: ci.md
    workflow: 15
---

# Pipeline de CI

A CI é executada em cada push para `main` e em cada pull request. Ela usa escopo inteligente para pular jobs caros quando apenas áreas não relacionadas foram alteradas.

O QA Lab tem lanes de CI dedicadas fora do workflow principal com escopo inteligente. O
workflow `Parity gate` é executado em alterações correspondentes de PR e em acionamento manual; ele
faz build do runtime privado do QA e compara os pacotes agentic simulados GPT-5.4 e Opus 4.6.
O workflow `QA-Lab - All Lanes` é executado nightly em `main` e em
acionamento manual; ele distribui em paralelo o parity gate simulado, a lane Matrix ao vivo e a lane
Telegram ao vivo como jobs paralelos. Os jobs ao vivo usam o ambiente `qa-live-shared`,
e a lane do Telegram usa leases do Convex. `OpenClaw Release
Checks` também executa essas mesmas lanes do QA Lab antes da aprovação de release.

## Visão geral dos jobs

| Job                              | Finalidade                                                                                   | Quando é executado                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------- |
| `preflight`                      | Detectar alterações somente em docs, escopos alterados, extensões alteradas e montar o manifesto de CI | Sempre em pushes e PRs que não são draft |
| `security-scm-fast`              | Detecção de chave privada e auditoria de workflow via `zizmor`                              | Sempre em pushes e PRs que não são draft |
| `security-dependency-audit`      | Auditoria do lockfile de produção sem dependências contra avisos do npm                     | Sempre em pushes e PRs que não são draft |
| `security-fast`                  | Agregador obrigatório para os jobs rápidos de segurança                                     | Sempre em pushes e PRs que não são draft |
| `build-artifacts`                | Build de `dist/`, UI de controle, verificações de artefatos construídos e artefatos reutilizáveis para jobs downstream | Alterações relevantes para Node       |
| `checks-fast-core`               | Lanes rápidas de correção em Linux, como verificações de plugins integrados/contratos de plugin/protocolo | Alterações relevantes para Node       |
| `checks-fast-contracts-channels` | Verificações fragmentadas de contratos de canal com um resultado agregado estável            | Alterações relevantes para Node       |
| `checks-node-extensions`         | Shards completos de teste de plugins integrados em toda a suíte de extensões                | Alterações relevantes para Node       |
| `checks-node-core-test`          | Shards de teste do core Node, excluindo lanes de canais, integrados, contratos e extensões  | Alterações relevantes para Node       |
| `extension-fast`                 | Testes focados apenas nos plugins integrados alterados                                      | Pull requests com alterações em extensões |
| `check`                          | Equivalente local principal fragmentado: tipos de prod, lint, guards, tipos de teste e smoke estrito | Alterações relevantes para Node       |
| `check-additional`               | Arquitetura, limites, guards de superfície de extensão, limites de pacote e shards de gateway-watch | Alterações relevantes para Node       |
| `build-smoke`                    | Testes smoke da CLI construída e smoke de memória na inicialização                          | Alterações relevantes para Node       |
| `checks`                         | Verificador para testes de canal com artefatos construídos mais compatibilidade Node 22 apenas em push | Alterações relevantes para Node       |
| `check-docs`                     | Verificações de formatação, lint e links quebrados da documentação                          | Docs alteradas                        |
| `skills-python`                  | Ruff + pytest para Skills baseadas em Python                                                | Alterações relevantes para Skills em Python |
| `checks-windows`                 | Lanes de teste específicas do Windows                                                       | Alterações relevantes para Windows    |
| `macos-node`                     | Lane de teste TypeScript no macOS usando os artefatos construídos compartilhados            | Alterações relevantes para macOS      |
| `macos-swift`                    | Lint, build e testes Swift para o app macOS                                                 | Alterações relevantes para macOS      |
| `android`                        | Testes unitários Android para ambas as variantes mais um build de APK debug                 | Alterações relevantes para Android    |

## Ordem de fail-fast

Os jobs são ordenados para que verificações baratas falhem antes que as caras sejam executadas:

1. `preflight` decide quais lanes existirão. A lógica `docs-scope` e `changed-scope` são etapas dentro desse job, não jobs independentes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falham rapidamente sem esperar pelos jobs mais pesados de artefatos e matriz de plataforma.
3. `build-artifacts` se sobrepõe às lanes rápidas de Linux para que consumidores downstream possam começar assim que o build compartilhado estiver pronto.
4. Depois disso, as lanes mais pesadas de plataforma e runtime se distribuem: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` apenas para PR, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

A lógica de escopo fica em `scripts/ci-changed-scope.mjs` e é coberta por testes unitários em `src/scripts/ci-changed-scope.test.ts`.
Edições no workflow de CI validam o grafo de CI Node mais lint de workflow, mas não forçam por si só builds nativos de Windows, Android ou macOS; essas lanes de plataforma continuam com escopo restrito a alterações no código-fonte da plataforma.
As verificações Node do Windows têm escopo restrito a wrappers específicos de processo/caminho do Windows, auxiliares de runner npm/pnpm/UI, configuração do gerenciador de pacotes e superfícies do workflow de CI que executam essa lane; alterações não relacionadas em código-fonte, plugins, install-smoke e somente testes permanecem nas lanes Node de Linux para que não reservem um worker Windows de 16 vCPU para cobertura que já é exercitada pelos shards normais de teste.
O workflow separado `install-smoke` reutiliza o mesmo script de escopo por meio do seu próprio job `preflight`. Ele calcula `run_install_smoke` a partir do sinal mais restrito de smoke alterado, então o smoke de Docker/instalação é executado para alterações relevantes de instalação, empacotamento, contêiner, produção de extensão integrada e nas superfícies do core de plugin/canal/Gateway/Plugin SDK que os jobs smoke de Docker exercitam. Edições somente de teste e somente de docs não reservam workers Docker. O smoke de pacote QR dele força a camada Docker de `pnpm install` a ser executada novamente enquanto preserva o cache do BuildKit pnpm store, então ainda exercita a instalação sem baixar novamente as dependências em cada execução. O e2e `gateway-network` reutiliza a imagem de runtime criada anteriormente no job, então adiciona cobertura real de WebSocket entre contêineres sem adicionar outro build Docker. O `test:docker:all` local faz prebuild de uma imagem compartilhada de teste ao vivo e uma imagem compartilhada de app construído de `scripts/e2e/Dockerfile`, depois executa em paralelo as lanes smoke live/E2E com `OPENCLAW_SKIP_DOCKER_BUILD=1`; ajuste o paralelismo padrão de 4 com `OPENCLAW_DOCKER_ALL_PARALLELISM`. O agregador local para de agendar novas lanes no pool após a primeira falha por padrão, e cada lane tem um timeout de 120 minutos que pode ser substituído com `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Lanes sensíveis à inicialização ou ao provedor são executadas exclusivamente após o pool paralelo. O workflow reutilizável live/E2E espelha o padrão de imagem compartilhada ao fazer build e push de uma imagem Docker E2E GHCR com tag SHA antes da matriz Docker, depois executa a matriz com `OPENCLAW_SKIP_DOCKER_BUILD=1`. O workflow agendado live/E2E executa diariamente a suíte Docker completa do caminho de release. Testes Docker de QR e instalador mantêm seus próprios Dockerfiles focados em instalação. Um job separado `docker-e2e-fast` executa o perfil Docker limitado de plugins integrados sob um timeout de comando de 120 segundos: reparo de dependência no setup-entry mais isolamento sintético de falha do bundled-loader. A matriz completa de atualização/canal integrado permanece manual/suíte completa porque realiza repetidas passagens reais de atualização npm e reparo doctor.

A lógica local de lane alterada fica em `scripts/changed-lanes.mjs` e é executada por `scripts/check-changed.mjs`. Esse gate local é mais rigoroso quanto aos limites de arquitetura do que o escopo amplo de plataforma da CI: alterações de produção do core executam typecheck de produção do core mais testes do core, alterações somente em testes do core executam apenas typecheck/testes de teste do core, alterações de produção de extensão executam typecheck de produção de extensão mais testes de extensão, e alterações somente em testes de extensão executam apenas typecheck/testes de teste de extensão. Alterações no Plugin SDK público ou no contrato de plugin expandem para validação de extensões porque as extensões dependem desses contratos do core. Bumps de versão apenas em metadados de release executam verificações direcionadas de versão/configuração/dependência raiz. Alterações desconhecidas em raiz/configuração falham para o lado seguro em todas as lanes.

Em pushes, a matriz `checks` adiciona a lane `compat-node22` apenas para push. Em pull requests, essa lane é ignorada e a matriz continua focada nas lanes normais de teste/canal.

As famílias mais lentas de testes Node são divididas ou balanceadas para que cada job permaneça pequeno: contratos de canal dividem cobertura de registro e core em seis shards ponderados no total, testes de plugins integrados são balanceados em seis workers de extensão, auto-reply roda como três workers balanceados em vez de seis workers minúsculos, e configurações agentic de Gateway/plugin são distribuídas pelos jobs Node agentic já existentes somente de código-fonte em vez de esperarem por artefatos construídos. Testes amplos de navegador, QA, mídia e plugins diversos usam suas configurações dedicadas do Vitest em vez do catch-all compartilhado de plugin. A lane ampla de agents usa o agendador compartilhado de paralelismo por arquivo do Vitest porque é dominada por import/agendamento em vez de pertencer a um único arquivo de teste lento. `runtime-config` roda com o shard `infra core-runtime` para evitar que o shard de runtime compartilhado fique com a cauda. `check-additional` mantém juntos o trabalho de compile/canary de limite de pacote e separa arquitetura de topologia de runtime da cobertura de gateway watch; o shard de boundary guard executa seus pequenos guards independentes concorrentemente dentro de um único job. Gateway watch, testes de canal e o shard de limite de suporte do core executam concorrentemente dentro de `build-artifacts` depois que `dist/` e `dist-runtime/` já foram construídos, mantendo seus antigos nomes de verificação como jobs leves de verificação e evitando dois workers Blacksmith extras e uma segunda fila de consumidor de artefatos.
A CI Android executa tanto `testPlayDebugUnitTest` quanto `testThirdPartyDebugUnitTest`, e depois faz build do APK debug Play. A variante third-party não tem source set nem manifest separado; sua lane de teste unitário ainda compila essa variante com as flags BuildConfig de SMS/log de chamadas, evitando ao mesmo tempo um job duplicado de empacotamento de APK debug em cada push relevante para Android.
`extension-fast` é apenas para PR porque execuções em push já executam os shards completos de plugins integrados. Isso mantém feedback de plugin alterado para revisões sem reservar um worker Blacksmith extra em `main` para cobertura já presente em `checks-node-extensions`.

O GitHub pode marcar jobs substituídos como `cancelled` quando um push mais novo chega na mesma ref de PR ou `main`. Trate isso como ruído de CI, a menos que a execução mais recente da mesma ref também esteja falhando. Verificações agregadas de shard usam `!cancelled() && always()` para que ainda informem falhas normais de shard, mas não entrem na fila depois que o workflow inteiro já tiver sido substituído.
A chave de concorrência da CI é versionada (`CI-v7-*`) para que um zumbi do lado do GitHub em um grupo de fila antigo não possa bloquear indefinidamente execuções mais novas na main.

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, jobs rápidos de segurança e agregadores (`security-scm-fast`, `security-dependency-audit`, `security-fast`), verificações rápidas de protocolo/contrato/integrados, verificações fragmentadas de contratos de canal, shards de `check` exceto lint, shards e agregadores de `check-additional`, verificadores agregados de testes Node, verificações de docs, Skills em Python, workflow-sanity, labeler, auto-response; o preflight de install-smoke também usa Ubuntu hospedado pelo GitHub para que a matriz Blacksmith possa entrar na fila mais cedo |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shards de teste Node em Linux, shards de teste de plugins integrados, `android`                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, que continua sensível o suficiente a CPU a ponto de 8 vCPU custarem mais do que economizaram; builds Docker de install-smoke, em que o tempo de fila de 32 vCPU custou mais do que economizou                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` em `openclaw/openclaw`; forks usam `macos-latest` como fallback                                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` em `openclaw/openclaw`; forks usam `macos-latest` como fallback                                                                                                                                                                                                                                                                                                                                                                                          |

## Equivalentes locais

```bash
pnpm changed:lanes   # inspeciona o classificador local de lanes alteradas para origin/main...HEAD
pnpm check:changed   # gate local inteligente: typecheck/lint/testes alterados por lane de limite
pnpm check          # gate local rápido: tsgo de produção + lint fragmentado + guards rápidos paralelos
pnpm check:test-types
pnpm check:timed    # mesmo gate com tempos por etapa
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # testes Vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # formatação + lint + links quebrados das docs
pnpm build          # faz build de dist quando as lanes de artefato/build-smoke da CI forem relevantes
node scripts/ci-run-timings.mjs <run-id>  # resume tempo total, tempo em fila e jobs mais lentos
```
