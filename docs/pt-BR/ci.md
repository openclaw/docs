---
read_when:
    - Você precisa entender por que um job de CI foi ou não executado
    - Você está depurando uma verificação com falha do GitHub Actions
    - Você está coordenando uma execução ou reexecução de validação de lançamento
    - Você está alterando o despacho do ClawSweeper ou o encaminhamento de atividades do GitHub
summary: Grafo de jobs de CI, controles de escopo, agrupamentos de lançamento e equivalentes de comandos locais
title: Pipeline de CI
x-i18n:
    generated_at: "2026-07-02T13:59:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc5ce77eadea695e98926326767dde4c8ea2d19c69a4c782d164e0f87201b227
    source_path: ci.md
    workflow: 16
---

OpenClaw CI é executado em cada push para `main` e em cada pull request. Pushes canônicos para `main` passam primeiro por uma janela de admissão de 90 segundos em hosted-runner. O grupo de concorrência `CI` existente cancela essa execução em espera quando um commit mais novo chega, para que mesclagens sequenciais não registrem cada uma uma matriz Blacksmith completa. Pull requests e disparos manuais pulam a espera. O job `preflight` então classifica o diff e desativa lanes caras quando apenas áreas não relacionadas mudaram. Execuções manuais de `workflow_dispatch` intencionalmente ignoram o escopo inteligente e expandem o grafo completo para candidatas a release e validação ampla. Lanes Android continuam opt-in por meio de `include_android`. A cobertura de plugins apenas para release fica no workflow separado [`Pré-lançamento de Plugin`](#plugin-prerelease) e só é executada a partir de [`Validação de Release Completa`](#full-release-validation) ou de um disparo manual explícito.

## Visão geral do pipeline

| Job                                | Propósito                                                                                                   | Quando é executado                                        |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `preflight`                        | Detectar alterações apenas de documentação, escopos alterados, extensões alteradas e criar o manifesto de CI | Sempre em pushes e PRs não rascunho                       |
| `runner-admission`                 | Debounce hospedado de 90 segundos para pushes canônicos em `main` antes do trabalho Blacksmith ser registrado | Toda execução de CI; espera apenas em pushes canônicos para `main` |
| `security-fast`                    | Detecção de chaves privadas, auditoria de workflows alterados via `zizmor` e auditoria do lockfile de produção | Sempre em pushes e PRs não rascunho                       |
| `check-dependencies`               | Passagem Knip apenas de dependências de produção mais a guarda de allowlist de arquivos não usados           | Alterações relevantes para Node                           |
| `build-artifacts`                  | Build de `dist/`, Control UI, verificações smoke da CLI construída, verificações de artefatos construídos embutidos e artefatos reutilizáveis | Alterações relevantes para Node                           |
| `checks-fast-core`                 | Lanes rápidas de correção em Linux, como bundled, protocol, QA Smoke CI e verificações de roteamento de CI   | Alterações relevantes para Node                           |
| `checks-fast-contracts-plugins-*`  | Duas verificações fragmentadas de contrato de plugin                                                         | Alterações relevantes para Node                           |
| `checks-fast-contracts-channels-*` | Duas verificações fragmentadas de contrato de canal                                                          | Alterações relevantes para Node                           |
| `checks-node-core-*`               | Shards de testes Node centrais, excluindo lanes de canal, bundled, contrato e extensão                       | Alterações relevantes para Node                           |
| `check-*`                          | Equivalente fragmentado do gate local principal: tipos de produção, lint, guards, tipos de teste e smoke estrito | Alterações relevantes para Node                           |
| `check-additional-*`               | Arquitetura, drift fragmentado de boundary/prompt, guards de extensão, limite de pacote e topologia de runtime | Alterações relevantes para Node                           |
| `checks-node-compat-node22`        | Build de compatibilidade com Node 22 e lane smoke                                                           | Disparo manual de CI para releases                        |
| `check-docs`                       | Formatação, lint e verificações de links quebrados da documentação                                          | Documentação alterada                                     |
| `skills-python`                    | Ruff + pytest para Skills baseadas em Python                                                                | Alterações relevantes para Skills Python                  |
| `checks-windows`                   | Testes específicos de processo/caminho no Windows mais regressões compartilhadas de especificadores de importação em runtime | Alterações relevantes para Windows                        |
| `macos-node`                       | Lane de testes TypeScript no macOS usando os artefatos construídos compartilhados                           | Alterações relevantes para macOS                          |
| `macos-swift`                      | Lint, build e testes Swift para o app macOS                                                                 | Alterações relevantes para macOS                          |
| `ios-build`                        | Geração do projeto Xcode mais build do app iOS no simulador                                                 | App iOS, kit de app compartilhado ou alterações Swabble   |
| `android`                          | Testes unitários Android para ambos os flavors mais um build de APK de depuração                            | Alterações relevantes para Android                        |
| `test-performance-agent`           | Otimização diária de testes lentos do Codex após atividade confiável                                        | Sucesso da CI principal ou disparo manual                 |
| `openclaw-performance`             | Relatórios diários/sob demanda de desempenho do runtime Kova com lanes de mock-provider, deep-profile e GPT 5.5 ao vivo | Disparo agendado e manual                                 |

## Ordem fail-fast

1. `runner-admission` espera apenas por pushes canônicos para `main`; um push mais novo cancela a execução antes do registro no Blacksmith.
2. `preflight` decide quais lanes sequer existem. As lógicas `docs-scope` e `changed-scope` são etapas dentro desse job, não jobs independentes.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` e `skills-python` falham rapidamente sem esperar pelos jobs mais pesados de artefatos e matriz de plataformas.
4. `build-artifacts` se sobrepõe às lanes rápidas de Linux para que consumidores downstream possam começar assim que o build compartilhado estiver pronto.
5. Lanes mais pesadas de plataforma e runtime se expandem depois disso: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` e `android`.

O GitHub pode marcar jobs substituídos como `cancelled` quando um push mais novo chega no mesmo PR ou ref `main`. Trate isso como ruído de CI, a menos que a execução mais recente para a mesma ref também esteja falhando. Jobs de matriz usam `fail-fast: false`, e `build-artifacts` relata falhas embutidas de channel, core-support-boundary e gateway-watch diretamente em vez de enfileirar pequenos jobs verificadores. A chave automática de concorrência da CI é versionada (`CI-v7-*`), para que um zumbi do lado do GitHub em um grupo de fila antigo não consiga bloquear indefinidamente execuções mais novas da main. Execuções manuais da suíte completa usam `CI-manual-v1-*` e não cancelam execuções em andamento.

Use `pnpm ci:timings`, `pnpm ci:timings:recent` ou `node scripts/ci-run-timings.mjs <run-id>` para resumir tempo total, tempo de fila, jobs mais lentos, falhas e a barreira de expansão `pnpm-store-warmup` do GitHub Actions. A CI também envia o mesmo resumo da execução como artefato `ci-timings-summary`. Para timing de build, verifique a etapa `Build dist` do job `build-artifacts`: `pnpm build:ci-artifacts` imprime `[build-all] phase timings:` e inclui `ui:build`; o job também envia o artefato `startup-memory`.

Para execuções de pull request, o job terminal de resumo de timing executa o helper a partir da revisão base confiável antes de passar `GH_TOKEN` para `gh run view`. Isso mantém a consulta com token fora do código controlado pela branch, enquanto ainda resume a execução de CI atual do pull request.

## Contexto e evidência de PR

PRs de contribuidores externos executam um gate de contexto e evidência de PR a partir de `.github/workflows/real-behavior-proof.yml`. O workflow faz checkout do commit base confiável e avalia apenas o corpo do PR; ele não executa código da branch do contribuidor.

O gate se aplica a autores de PR que não são proprietários, membros, colaboradores ou bots do repositório. Ele passa quando o corpo do PR contém seções autorais `What Problem This Solves` e `Evidence`. Evidência pode ser um teste focado, resultado de CI, captura de tela, gravação, saída de terminal, observação ao vivo, log redigido ou link de artefato. O corpo fornece intenção e validação útil; revisores inspecionam o código, os testes e a CI para avaliar a correção.

Quando a verificação falhar, atualize o corpo do PR em vez de enviar outro commit de código.

## Escopo e roteamento

A lógica de escopo fica em `scripts/ci-changed-scope.mjs` e é coberta por testes unitários em `src/scripts/ci-changed-scope.test.ts`. Disparo manual pula a detecção de escopo alterado e faz o manifesto de preflight agir como se todas as áreas com escopo tivessem mudado.

- **Edições no workflow de CI** validam o grafo de CI Node mais lint de workflow, mas não forçam por si só builds nativos de Windows, iOS, Android ou macOS; essas lanes de plataforma continuam restritas a alterações de código-fonte da plataforma.
- **Sanidade do workflow** executa `actionlint`, `zizmor` em todos os arquivos YAML de workflow, a guarda de interpolação de composite-action e a guarda de marcadores de conflito. O job `security-fast` com escopo de PR também executa `zizmor` nos arquivos de workflow alterados para que achados de segurança de workflow falhem cedo no grafo principal de CI.
- **Documentação em pushes para `main`** é verificada pelo workflow independente `Docs` com o mesmo espelho de documentação do ClawHub usado pela CI, então pushes mistos de código+documentação não enfileiram também o shard `check-docs` da CI. Pull requests e CI manual ainda executam `check-docs` a partir da CI quando a documentação mudou.
- **TUI PTY** é executado no shard Linux Node `checks-node-core-runtime-tui-pty` para alterações de TUI. O shard executa `test/vitest/vitest.tui-pty.config.ts` com `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, então cobre tanto a lane determinística de fixture `TuiBackend` quanto o smoke mais lento `tui --local`, que faz mock apenas do endpoint externo do modelo.
- **Edições apenas de roteamento de CI, edições selecionadas e baratas de fixtures de teste core, e edições estreitas de helper/roteamento de testes de contrato de plugin** usam um caminho rápido de manifesto apenas Node: `preflight`, segurança e uma única tarefa `checks-fast-core`. Esse caminho pula artefatos de build, compatibilidade com Node 22, contratos de canal, shards core completos, shards de bundled-plugin e matrizes de guards adicionais quando a alteração é limitada às superfícies de roteamento ou helper que a tarefa rápida exercita diretamente.
- **Verificações Node no Windows** têm escopo restrito a wrappers de processo/caminho específicos do Windows, helpers de runner npm/pnpm/UI, configuração do gerenciador de pacotes e superfícies de workflow de CI que executam essa lane; alterações não relacionadas de código-fonte, plugin, install-smoke e apenas de teste continuam nas lanes Linux Node.

Os conjuntos de testes Node mais lentos são divididos ou balanceados para que cada job permaneça pequeno sem reservar executores em excesso: contratos de Plugin e contratos de canal rodam cada um como dois shards ponderados com suporte do Blacksmith e fallback padrão para executor do GitHub, lanes rápidas/de suporte de unidade do núcleo rodam separadamente, a infraestrutura de runtime do núcleo é dividida entre estado, processo/configuração, compartilhado e três shards de domínio Cron, a resposta automática roda como workers balanceados (com a subárvore de resposta dividida em shards de agent-runner, dispatch e comandos/roteamento de estado), e configurações agentic de Gateway/servidor são divididas entre lanes de chat/auth/model/http-plugin/runtime/startup em vez de esperar por artefatos construídos. A CI normal então empacota apenas shards isolados de padrões de inclusão de infraestrutura em pacotes determinísticos de no máximo 64 arquivos de teste, reduzindo a matriz Node sem mesclar suítes não isoladas de comandos/Cron, agents-core com estado ou Gateway/servidor; suítes fixas pesadas permanecem em 8 vCPU, enquanto as lanes empacotadas e de menor peso usam 4 vCPU. Pull requests no repositório canônico usam um plano adicional compacto de admissão: os mesmos grupos por configuração rodam em subprocessos isolados dentro do plano atual de 34 jobs Linux Node, então um único PR não registra a matriz Node completa com mais de 70 jobs. Pushes para `main`, dispatches manuais e gates de release mantêm a matriz completa. Testes amplos de navegador, QA, mídia e Plugins diversos usam suas configurações Vitest dedicadas em vez do catch-all compartilhado de Plugins. Shards de padrões de inclusão registram entradas de tempo usando o nome do shard de CI, para que `.artifacts/vitest-shard-timings.json` consiga distinguir uma configuração inteira de um shard filtrado. `check-additional-*` mantém o trabalho de compilação/canary de fronteira de pacotes junto e separa a arquitetura de topologia de runtime da cobertura de observação do Gateway; a lista de guardas de fronteira é distribuída em um shard intensivo em prompts e um shard combinado para as listras de guardas restantes, cada um executando guardas independentes selecionados em paralelo e imprimindo tempos por verificação. A verificação cara de drift de snapshot de prompt do caminho feliz do Codex roda como seu próprio job adicional apenas para CI manual e para mudanças que afetam prompts, então mudanças Node normais e não relacionadas não esperam pela geração fria de snapshots de prompt, e os shards de fronteira permanecem balanceados enquanto o drift de prompt ainda fica preso ao PR que o causou; a mesma flag pula a geração Vitest de snapshots de prompt dentro do shard de fronteira de suporte do núcleo com artefato construído. A observação do Gateway, testes de canal e o shard de fronteira de suporte do núcleo rodam em paralelo dentro de `build-artifacts` depois que `dist/` e `dist-runtime/` já foram construídos.

Depois de admitida, a CI Linux canônica permite até 24 jobs de teste Node simultâneos e
12 para as lanes menores rápidas/de verificação; Windows e Android permanecem em dois porque
esses pools de executores são mais estreitos.

O plano compacto de PR emite 18 jobs Node para a suíte atual: grupos de configuração inteira
são agrupados em subprocessos isolados com timeout de lote de 120 minutos,
enquanto grupos de padrões de inclusão compartilham o mesmo orçamento limitado de jobs.

A CI Android roda `testPlayDebugUnitTest` e `testThirdPartyDebugUnitTest` e depois constrói o APK de debug Play. O flavor de terceiros não tem source set ou manifesto separado; sua lane de testes unitários ainda compila o flavor com as flags BuildConfig de SMS/call-log, evitando ao mesmo tempo um job duplicado de empacotamento de APK de debug em cada push relevante para Android.

O shard `check-dependencies` roda `pnpm deadcode:dependencies` (uma passagem Knip de produção somente para dependências, fixada na versão mais recente do Knip, com a idade mínima de release do pnpm desativada para a instalação `dlx`) e `pnpm deadcode:unused-files`, que compara as descobertas de arquivos não usados em produção do Knip com `scripts/deadcode-unused-files.allowlist.mjs`. O guarda de arquivos não usados falha quando um PR adiciona um novo arquivo não usado sem revisão ou deixa uma entrada obsoleta na allowlist, preservando superfícies intencionais de Plugin dinâmico, geradas, de build, de teste live e de ponte de pacotes que o Knip não consegue resolver estaticamente.

## Encaminhamento de atividade do ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` é a ponte do lado de destino da atividade do repositório OpenClaw para o ClawSweeper. Ele não faz checkout nem executa código não confiável de pull request. O workflow cria um token de GitHub App a partir de `CLAWSWEEPER_APP_PRIVATE_KEY` e então envia payloads compactos de `repository_dispatch` para `openclaw/clawsweeper`.

O workflow tem quatro lanes:

- `clawsweeper_item` para solicitações exatas de revisão de issue e pull request;
- `clawsweeper_comment` para comandos explícitos do ClawSweeper em comentários de issues;
- `clawsweeper_commit_review` para solicitações de revisão em nível de commit em pushes para `main`;
- `github_activity` para atividade geral do GitHub que o agente ClawSweeper pode inspecionar.

A lane `github_activity` encaminha apenas metadados normalizados: tipo de evento, ação, ator, repositório, número do item, URL, título, estado e trechos curtos de comentários ou revisões quando presentes. Ela evita intencionalmente encaminhar o corpo completo do Webhook. O workflow receptor em `openclaw/clawsweeper` é `.github/workflows/github-activity.yml`, que publica o evento normalizado no hook do OpenClaw Gateway para o agente ClawSweeper.

Atividade geral é observação, não entrega por padrão. O agente ClawSweeper recebe o destino Discord em seu prompt e deve postar em `#clawsweeper` apenas quando o evento for surpreendente, acionável, arriscado ou operacionalmente útil. Aberturas rotineiras, edições, ruído de bots, ruído duplicado de Webhook e tráfego normal de revisão devem resultar em `NO_REPLY`.

Trate títulos, comentários, corpos, texto de revisão, nomes de branches e mensagens de commit do GitHub como dados não confiáveis em todo este caminho. Eles são entrada para sumarização e triagem, não instruções para o workflow ou runtime do agente.

## Dispatches manuais

Dispatches manuais de CI rodam o mesmo grafo de jobs da CI normal, mas forçam todas as lanes escopadas não Android: shards Linux Node, shards de Plugins empacotados, shards de contratos de Plugin e canal, compatibilidade com Node 22, `check-*`, `check-additional-*`, smoke checks de artefatos construídos, verificações de docs, Skills Python, Windows, macOS, build iOS e i18n da Control UI. Dispatches manuais autônomos de CI rodam Android apenas com `include_android=true`; o guarda-chuva completo de release habilita Android passando `include_android=true`. Verificações estáticas de pré-release de Plugin, o shard exclusivo de release `agentic-plugins`, a varredura completa em lote de extensões e lanes Docker de pré-release de Plugin são excluídos da CI. A suíte Docker de pré-release roda apenas quando `Full Release Validation` despacha o workflow separado `Plugin Prerelease` com o gate de validação de release habilitado.

Execuções manuais usam um grupo de concorrência único para que uma suíte completa de release candidate não seja cancelada por outro push ou execução de PR na mesma ref. A entrada opcional `target_ref` permite que um chamador confiável rode esse grafo contra uma branch, tag ou SHA completo de commit, usando o arquivo de workflow da ref de dispatch selecionada.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Executores

| Executor                        | Jobs                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Dispatch manual de CI e fallbacks de repositórios não canônicos, varreduras de qualidade CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, workflows de docs fora da CI e preflight de install-smoke para que a matriz Blacksmith possa entrar na fila mais cedo |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, shards de extensão de menor peso, `checks-fast-core`, shards de contrato de Plugin/canal, a maioria dos shards Linux Node empacotados/de menor peso, `check-guards`, `check-prod-types`, `check-test-types`, shards `check-additional-*` selecionados e `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Suítes Linux Node pesadas mantidas, shards `check-additional-*` pesados de fronteira/extensão e `android`                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (sensível a CPU o suficiente para que 8 vCPU custassem mais do que economizavam); builds Docker de install-smoke (o tempo de fila de 32 vCPU custava mais do que economizava)                                                                        |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` em `openclaw/openclaw`; forks usam fallback para `macos-15`                                                                                                                                                                                                             |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` e `ios-build` em `openclaw/openclaw`; forks usam fallback para `macos-26`                                                                                                                                                                                             |

## Orçamento de registro de executores

O bucket atual de registro de executores do GitHub da OpenClaw informa 10.000 registros de
executores self-hosted a cada 5 minutos em `ghx api rate_limit`. Verifique novamente
`actions_runner_registration` antes de cada rodada de ajuste porque o GitHub pode alterar
esse bucket. O limite é compartilhado por todos os registros de executores Blacksmith na
organização `openclaw`, então adicionar outra instalação Blacksmith não adiciona
um novo bucket.

Trate labels Blacksmith como o recurso escasso para controle de rajadas. Jobs que
apenas roteiam, notificam, sumarizam, selecionam shards ou rodam varreduras curtas de CodeQL devem
permanecer em executores hospedados pelo GitHub, a menos que tenham necessidades específicas de Blacksmith
medidas. Qualquer nova matriz Blacksmith, `max-parallel` maior ou workflow de alta frequência
deve mostrar sua contagem de registros no pior caso e manter o alvo no nível da organização
abaixo de cerca de 60% do bucket live. Com o bucket atual de 10.000 registros,
isso significa uma meta operacional de 6.000 registros, deixando margem para
repositórios simultâneos, novas tentativas e sobreposição de rajadas.

A CI do repositório canônico mantém o Blacksmith como o caminho de executor padrão para execuções normais de push e pull request. `workflow_dispatch` e execuções de repositórios não canônicos usam executores hospedados pelo GitHub, mas execuções canônicas normais não sondam atualmente a saúde da fila do Blacksmith nem fazem fallback automaticamente para labels hospedados pelo GitHub quando o Blacksmith está indisponível.

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
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/smoke checks matter
pnpm ios:build                                # generate and build the iOS app project
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## Desempenho do OpenClaw

`OpenClaw Performance` é o fluxo de trabalho de desempenho do produto/runtime. Ele roda diariamente em `main` e pode ser disparado manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

O disparo manual normalmente mede o benchmark do ref do fluxo de trabalho. Defina `target_ref` para medir o benchmark de uma tag de release ou outra branch com a implementação atual do fluxo de trabalho. Os caminhos de relatórios publicados e os ponteiros mais recentes são indexados pelo ref testado, e cada `index.md` registra o ref/SHA testado, o ref/SHA do fluxo de trabalho, o ref do Kova, o perfil, o modo de autenticação da lane, o modelo, a contagem de repetições e os filtros de cenário.

O fluxo de trabalho instala o OCM a partir de uma release fixada e o Kova a partir de `openclaw/Kova` no input `kova_ref` fixado, depois executa três lanes:

- `mock-provider`: cenários de diagnóstico do Kova contra um runtime de build local com autenticação falsa determinística compatível com OpenAI.
- `mock-deep-profile`: perfilamento de CPU/heap/trace para pontos críticos de inicialização, Gateway e turno de agente.
- `live-openai-candidate`: um turno real de agente OpenAI `openai/gpt-5.5`, ignorado quando `OPENAI_API_KEY` não está disponível.

A lane mock-provider também executa sondas de código-fonte nativas do OpenClaw após a passagem do Kova: tempo de boot e memória do Gateway nos casos de inicialização padrão, com hook e com 50 plugins; RSS de importação de plugin empacotado; loops repetidos de saudação `channel-chat-baseline` com OpenAI simulada; comandos de inicialização da CLI contra o Gateway iniciado; e a sonda de desempenho smoke do estado SQLite. Quando o relatório de código-fonte mock-provider publicado anteriormente está disponível para o ref testado, o resumo de código-fonte compara os valores atuais de RSS e heap com essa baseline e marca grandes aumentos de RSS como `watch`. O resumo Markdown da sonda de código-fonte fica em `source/index.md` no pacote do relatório, com o JSON bruto ao lado.

Cada lane envia artifacts do GitHub. Quando `CLAWGRIT_REPORTS_TOKEN` está configurado, o fluxo de trabalho também faz commit de `report.json`, `report.md`, pacotes, `index.md` e artifacts de sonda de código-fonte em `openclaw/clawgrit-reports` sob `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. O ponteiro atual do ref testado é escrito como `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validação Completa de Release

`Full Release Validation` é o fluxo de trabalho guarda-chuva manual para "rodar tudo antes da release". Ele aceita uma branch, tag ou SHA completo de commit, dispara o fluxo de trabalho manual `CI` com esse alvo, dispara `Plugin Prerelease` para prova de plugin/pacote/estática/Docker exclusiva de release, e dispara `OpenClaw Release Checks` para smoke de instalação, aceitação de pacote, verificações de pacote entre sistemas operacionais, renderização do scorecard de maturidade a partir de evidências de perfil de QA, paridade do QA Lab, Matrix e lanes do Telegram. Os perfis stable e full sempre incluem cobertura exaustiva live/E2E e de soak do caminho de release em Docker; o perfil beta pode optar por isso com `run_release_soak=true`. O E2E canônico de pacote do Telegram roda dentro de Package Acceptance, então um candidato completo não inicia um poller live duplicado. Após publicar, passe `release_package_spec` para reutilizar o pacote npm enviado em verificações de release, Package Acceptance, Docker, entre sistemas operacionais e Telegram sem rebuild. Use `npm_telegram_package_spec` apenas para uma nova execução focada do Telegram com pacote publicado. A lane de pacote live do plugin Codex usa o mesmo estado selecionado por padrão: `release_package_spec=openclaw@<tag>` publicado deriva `codex_plugin_spec=npm:@openclaw/codex@<tag>`, enquanto execuções por SHA/artifact empacotam `extensions/codex` a partir do ref selecionado. Defina `codex_plugin_spec` explicitamente para fontes de plugin customizadas, como specs `npm:`, `npm-pack:` ou `git:`.

Consulte [validação completa de release](/pt-BR/reference/full-release-validation) para a
matriz de estágios, nomes exatos dos jobs do fluxo de trabalho, diferenças entre perfis, artifacts e
identificadores de nova execução focada.

`OpenClaw Release Publish` é o fluxo de trabalho de release manual mutante. Dispare-o
a partir de `release/YYYY.M.PATCH` ou `main` depois que a tag de release existir e depois que o
preflight npm do OpenClaw tiver sido bem-sucedido. Ele verifica `pnpm plugins:sync:check`,
dispara `Plugin NPM Release` para todos os pacotes de plugin publicáveis, dispara
`Plugin ClawHub Release` para o mesmo SHA da release, e só então dispara
`OpenClaw NPM Release` com o `preflight_run_id` salvo. A publicação stable também
exige um `windows_node_tag` exato; o fluxo de trabalho verifica a release de origem do Windows
e compara seus instaladores x64/ARM64 com o input `windows_node_installer_digests`
aprovado pelo candidato antes de qualquer filho de publicação, depois promove
e verifica esses mesmos digests de instalador fixados, além do asset companion exato
e do contrato de checksum antes de publicar o rascunho da release no GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Para prova de commit fixado em uma branch que muda rápido, use o helper em vez de
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Refs de disparo de fluxo de trabalho do GitHub devem ser branches ou tags, não SHAs brutos de commit. O
helper envia uma branch temporária `release-ci/<sha>-...` no SHA alvo,
dispara `Full Release Validation` a partir desse ref fixado, verifica se cada
`headSha` de fluxo de trabalho filho corresponde ao alvo e exclui a branch temporária quando a
execução termina. O verificador guarda-chuva também falha se qualquer fluxo de trabalho filho rodou em um
SHA diferente.

`release_profile` controla a amplitude live/provedor passada para as verificações de release. Os
fluxos de trabalho manuais de release usam `stable` por padrão; use `full` apenas quando você
intencionalmente quiser a matriz consultiva ampla de provedor/mídia. As verificações de release
stable e full sempre executam o soak exaustivo live/E2E e Docker do caminho de release;
o perfil beta pode optar por isso com `run_release_soak=true`.

- `minimum` mantém as lanes mais rápidas críticas para release do OpenAI/core.
- `stable` adiciona o conjunto stable de provedores/backends.
- `full` executa a matriz consultiva ampla de provedor/mídia.

O guarda-chuva registra os ids das execuções filhas disparadas, e o job final `Verify full validation` reverifica as conclusões atuais das execuções filhas e anexa tabelas dos jobs mais lentos para cada execução filha. Se um fluxo de trabalho filho for executado novamente e ficar verde, execute novamente apenas o job verificador pai para atualizar o resultado do guarda-chuva e o resumo de tempos.

Para recuperação, tanto `Full Release Validation` quanto `OpenClaw Release Checks` aceitam `rerun_group`. Use `all` para um candidato de release, `ci` apenas para o filho de CI completo normal, `plugin-prerelease` apenas para o filho de pré-release de plugin, `release-checks` para cada filho de release, ou um grupo mais estreito: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` no guarda-chuva. Isso mantém limitada a nova execução de uma caixa de release com falha após uma correção focada. Para uma lane entre sistemas operacionais com falha, combine `rerun_group=cross-os` com `cross_os_suite_filter`, por exemplo `windows/packaged-upgrade`; comandos longos entre sistemas operacionais emitem linhas de Heartbeat e resumos de packaged-upgrade incluem tempos por fase. As lanes de verificações de release de QA são consultivas, exceto o gate padrão de cobertura de ferramentas de runtime, que bloqueia quando ferramentas dinâmicas obrigatórias do OpenClaw divergem ou desaparecem do resumo do tier padrão.

`OpenClaw Release Checks` usa o ref confiável do fluxo de trabalho para resolver o ref selecionado uma vez em um tarball `release-package-under-test`, depois passa esse artifact para verificações entre sistemas operacionais e Package Acceptance, além do fluxo de trabalho Docker live/E2E do caminho de release quando a cobertura de soak roda. Isso mantém os bytes do pacote consistentes entre caixas de release e evita reempacotar o mesmo candidato em vários jobs filhos. Para a lane live do plugin npm Codex, as verificações de release passam uma spec de plugin publicado correspondente derivada de `release_package_spec`, passam o `codex_plugin_spec` fornecido pelo operador ou deixam o input em branco para que o script Docker empacote o plugin Codex do checkout selecionado.

Execuções duplicadas de `Full Release Validation` para `ref=main` e `rerun_group=all`
substituem o guarda-chuva mais antigo. O monitor pai cancela qualquer fluxo de trabalho filho que
já tenha disparado quando o pai é cancelado, então uma validação mais nova de main
não fica presa atrás de uma execução obsoleta de duas horas de release-check. A validação de branch/tag
de release e grupos de nova execução focados mantêm `cancel-in-progress: false`.

## Shards live e E2E

O filho live/E2E de release mantém cobertura ampla nativa de `pnpm test:live`, mas a executa como shards nomeados por meio de `scripts/test-live-shard.mjs` em vez de um job serial:

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
- shards divididos de mídia de áudio/vídeo e shards de música filtrados por provedor

Isso mantém a mesma cobertura de arquivos, ao mesmo tempo em que torna falhas lentas de provedores live mais fáceis de reexecutar e diagnosticar. Os nomes agregados de shard `native-live-extensions-o-z`, `native-live-extensions-media` e `native-live-extensions-media-music` continuam válidos para novas execuções manuais únicas.

Os shards nativos de mídia live rodam em `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, criado pelo fluxo de trabalho `Live Media Runner Image`. Essa imagem pré-instala `ffmpeg` e `ffprobe`; os jobs de mídia apenas verificam os binários antes da configuração. Mantenha suítes live com suporte a Docker em runners Blacksmith normais — jobs de contêiner não são o lugar certo para iniciar testes Docker aninhados.

Shards de modelo/backend ao vivo apoiados por Docker usam uma imagem compartilhada separada `ghcr.io/openclaw/openclaw-live-test:<sha>` por commit selecionado. O fluxo de trabalho de release ao vivo cria e envia essa imagem uma vez; depois, os shards de modelo ao vivo Docker, Gateway particionado por provedor, backend da CLI, bind ACP e harness Codex são executados com `OPENCLAW_SKIP_DOCKER_BUILD=1`. Os shards Docker do Gateway carregam limites explícitos de `timeout` no nível do script abaixo do timeout do job do fluxo de trabalho, para que um contêiner travado ou caminho de limpeza falhe rápido em vez de consumir todo o orçamento de verificações de release. Se esses shards recompilarem o alvo Docker completo do código-fonte independentemente, a execução de release está mal configurada e desperdiçará tempo de relógio em builds duplicados de imagem.

## Aceitação de pacote

Use `Package Acceptance` quando a pergunta for "este pacote instalável do OpenClaw funciona como produto?" Isso é diferente da CI normal: a CI normal valida a árvore de código-fonte, enquanto a aceitação de pacote valida um único tarball pelo mesmo harness E2E Docker que os usuários exercitam após instalar ou atualizar.

### Jobs

1. `resolve_package` faz checkout de `workflow_ref`, resolve um candidato de pacote, grava `.artifacts/docker-e2e-package/openclaw-current.tgz`, grava `.artifacts/docker-e2e-package/package-candidate.json`, envia ambos como o artefato `package-under-test` e imprime a origem, ref do fluxo de trabalho, ref do pacote, versão, SHA-256 e perfil no resumo da etapa do GitHub.
2. `docker_acceptance` chama `openclaw-live-and-e2e-checks-reusable.yml` com `ref=workflow_ref` e `package_artifact_name=package-under-test`. O fluxo de trabalho reutilizável baixa esse artefato, valida o inventário do tarball, prepara imagens Docker de digest de pacote quando necessário e executa as lanes Docker selecionadas contra esse pacote em vez de empacotar o checkout do fluxo de trabalho. Quando um perfil seleciona múltiplas `docker_lanes` direcionadas, o fluxo de trabalho reutilizável prepara o pacote e as imagens compartilhadas uma vez e então distribui essas lanes como jobs Docker direcionados paralelos com artefatos exclusivos.
3. `package_telegram` opcionalmente chama `NPM Telegram Beta E2E`. Ele é executado quando `telegram_mode` não é `none` e instala o mesmo artefato `package-under-test` quando a Aceitação de pacote resolveu um; o dispatch Telegram independente ainda pode instalar uma especificação npm publicada.
4. `summary` falha o fluxo de trabalho se a resolução do pacote, a aceitação Docker ou a lane opcional do Telegram falhou.

### Origens de candidatos

- `source=npm` aceita apenas `openclaw@beta`, `openclaw@latest` ou uma versão exata de release do OpenClaw, como `openclaw@2026.4.27-beta.2`. Use isso para aceitação de pré-release/estável publicado.
- `source=ref` empacota uma branch, tag ou SHA de commit completo confiável em `package_ref`. O resolvedor busca branches/tags do OpenClaw, verifica se o commit selecionado é alcançável pelo histórico de branches do repositório ou por uma tag de release, instala dependências em uma worktree destacada e o empacota com `scripts/package-openclaw-for-docker.mjs`.
- `source=url` baixa um `.tgz` HTTPS público; `package_sha256` é obrigatório. Esse caminho rejeita credenciais de URL, portas HTTPS não padrão, hostnames ou IPs resolvidos privados/internos/de uso especial e redirecionamentos fora da mesma política pública de segurança.
- `source=trusted-url` baixa um `.tgz` HTTPS a partir de uma política de origem confiável nomeada em `.github/package-trusted-sources.json`; `package_sha256` e `trusted_source_id` são obrigatórios. Use isso somente para mirrors empresariais mantidos por mantenedores ou repositórios privados de pacotes que precisam de hosts, portas, prefixos de caminho, hosts de redirecionamento ou resolução de rede privada configurados. Se a política declarar autenticação bearer, o fluxo de trabalho usa o segredo fixo `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; credenciais embutidas na URL ainda são rejeitadas.
- `source=artifact` baixa um `.tgz` de `artifact_run_id` e `artifact_name`; `package_sha256` é opcional, mas deve ser fornecido para artefatos compartilhados externamente.

Mantenha `workflow_ref` e `package_ref` separados. `workflow_ref` é o código confiável de fluxo de trabalho/harness que executa o teste. `package_ref` é o commit de origem que é empacotado quando `source=ref`. Isso permite que o harness de teste atual valide commits de origem confiáveis mais antigos sem executar lógica antiga de fluxo de trabalho.

### Perfis de suíte

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` mais `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — partes completas do caminho de release Docker com OpenWebUI
- `custom` — `docker_lanes` exatas; obrigatório quando `suite_profile=custom`

O perfil `package` usa cobertura offline de Plugin para que a validação de pacote publicado não dependa da disponibilidade ao vivo do ClawHub. A lane opcional do Telegram reutiliza o artefato `package-under-test` em `NPM Telegram Beta E2E`, com o caminho de especificação npm publicada mantido para dispatches independentes.

Para a política dedicada de atualização e teste de Plugin, incluindo comandos locais,
lanes Docker, entradas de Aceitação de pacote, padrões de release e triagem de falhas,
consulte [Testar atualizações e Plugins](/pt-BR/help/testing-updates-plugins).

As verificações de release chamam a Aceitação de pacote com `source=artifact`, o artefato de pacote de release preparado, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` e `telegram_mode=mock-openai`. Isso mantém migração de pacote, atualização, instalação de Skill do ClawHub ao vivo, limpeza de dependência obsoleta de Plugin, reparo de instalação de Plugin configurado, Plugin offline, atualização de Plugin e prova do Telegram no mesmo tarball de pacote resolvido. Defina `release_package_spec` na Validação Completa de Release ou nas Verificações de Release do OpenClaw após publicar uma beta para executar a mesma matriz contra o pacote npm enviado sem recompilar; defina `package_acceptance_package_spec` somente quando a Aceitação de pacote precisar de um pacote diferente do restante da validação de release. As verificações de release entre sistemas operacionais ainda cobrem onboarding específico de SO, instalador e comportamento de plataforma; a validação de produto de pacote/atualização deve começar com a Aceitação de pacote. A lane Docker `published-upgrade-survivor` valida uma linha de base de pacote publicado por execução no caminho bloqueante de release. Na Aceitação de pacote, o tarball `package-under-test` resolvido é sempre o candidato, e `published_upgrade_survivor_baseline` seleciona a linha de base publicada de fallback, com padrão `openclaw@latest`; comandos de reexecução de lane com falha preservam essa linha de base. A Validação Completa de Release com `run_release_soak=true` ou `release_profile=full` define `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` e `published_upgrade_survivor_scenarios=reported-issues` para expandir pelas quatro releases npm estáveis mais recentes, mais releases fixadas de limite de compatibilidade de Plugin e fixtures em formato de issue para configuração do Feishu, arquivos de bootstrap/persona preservados, instalações configuradas de Plugin do OpenClaw, caminhos de log com til e raízes de dependência de Plugin legado obsoletas. Seleções de sobrevivente de upgrade publicado com múltiplas linhas de base são particionadas por linha de base em jobs de runner Docker direcionados separados. O fluxo de trabalho separado `Update Migration` usa a lane Docker `update-migration` com `all-since-2026.4.23` e `plugin-deps-cleanup` quando a pergunta é limpeza exaustiva de atualização publicada, não a amplitude normal da CI de Release Completo. Execuções agregadas locais podem passar especificações exatas de pacote com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, manter uma única lane com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, como `openclaw@2026.4.15`, ou definir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para a matriz de cenários. A lane publicada configura a linha de base com uma receita de comando `openclaw config set` incorporada, registra etapas da receita em `summary.json` e verifica `/healthz`, `/readyz` e status RPC após a inicialização do Gateway. As lanes frescas empacotadas e de instalador do Windows também verificam que um pacote instalado consegue importar uma substituição de controle de navegador a partir de um caminho absoluto bruto do Windows. O smoke de turno de agente OpenAI entre sistemas operacionais usa por padrão `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando definido; caso contrário, `openai/gpt-5.5`, para que a prova de instalação e Gateway permaneça em um modelo de teste GPT-5 evitando padrões GPT-4.x.

### Janelas de compatibilidade legada

A Aceitação de pacote tem janelas delimitadas de compatibilidade legada para pacotes já publicados. Pacotes até `2026.4.25`, incluindo `2026.4.25-beta.*`, podem usar o caminho de compatibilidade:

- entradas conhecidas de QA privada em `dist/postinstall-inventory.json` podem apontar para arquivos omitidos do tarball;
- `doctor-switch` pode pular o subcaso de persistência `gateway install --wrapper` quando o pacote não expõe essa flag;
- `update-channel-switch` pode podar `patchedDependencies` pnpm ausentes da fixture falsa de git derivada do tarball e pode registrar em log `update.channel` persistido ausente;
- smokes de Plugin podem ler locais legados de registro de instalação ou aceitar persistência ausente de registro de instalação do marketplace;
- `plugin-update` pode permitir migração de metadados de configuração enquanto ainda exige que o registro de instalação e o comportamento de não reinstalação permaneçam inalterados.

O pacote publicado `2026.4.26` também pode alertar para arquivos de carimbo de metadados de build local que já foram enviados. Pacotes posteriores devem satisfazer os contratos modernos; as mesmas condições falham em vez de alertar ou pular.

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
  -f package_ref=release/YYYY.M.PATCH \
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

# Validate a tarball from a named trusted private mirror policy.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
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

Ao depurar uma execução de aceitação de pacote com falha, comece pelo resumo de `resolve_package` para confirmar a origem, a versão e o SHA-256 do pacote. Depois, inspecione a execução filha `docker_acceptance` e seus artefatos Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logs de lanes, tempos de fases e comandos de reexecução. Prefira reexecutar o perfil de pacote com falha ou as lanes Docker exatas em vez de reexecutar a validação completa de release.

## Smoke de instalação

O fluxo de trabalho separado `Install Smoke` reutiliza o mesmo script de escopo por meio de seu próprio job `preflight`. Ele divide a cobertura de smoke entre `run_fast_install_smoke` e `run_full_install_smoke`.

- **Caminho rápido** é executado para pull requests que tocam superfícies de Docker/pacote, alterações de pacote/manifesto de Plugin integrado ou superfícies centrais de plugin/canal/gateway/Plugin SDK exercitadas pelos jobs de smoke de Docker. Alterações somente de código-fonte em Plugin integrado, edições somente de teste e edições somente de documentação não reservam workers de Docker. O caminho rápido cria a imagem do Dockerfile raiz uma vez, verifica a CLI, executa o smoke da CLI de exclusão de agentes em workspace compartilhado, executa o e2e de rede de gateway em contêiner, verifica um argumento de build de extensão integrada e executa o perfil Docker de Plugin integrado limitado sob um timeout agregado de comando de 240 segundos (cada execução Docker de cenário é limitada separadamente).
- **Caminho completo** mantém a instalação do pacote QR e a cobertura Docker/de atualização do instalador para execuções agendadas noturnas, disparos manuais, verificações de release por workflow-call e pull requests que realmente tocam superfícies de instalador/pacote/Docker. No modo completo, install-smoke prepara ou reutiliza uma imagem de smoke do Dockerfile raiz no GHCR para o SHA alvo, então executa a instalação do pacote QR, smokes do Dockerfile raiz/gateway, smokes de instalador/atualização e o E2E Docker rápido de Plugin integrado como jobs separados para que o trabalho de instalador não espere pelos smokes da imagem raiz.

Pushes para `main` (incluindo commits de merge) não forçam o caminho completo; quando a lógica de escopo alterado solicitaria cobertura completa em um push, o workflow mantém o smoke Docker rápido e deixa o smoke completo de instalação para validação noturna ou de release.

O smoke lento do provedor de imagem com instalação global do Bun é controlado separadamente por `run_bun_global_install_smoke`. Ele é executado na agenda noturna e a partir do workflow de verificações de release, e disparos manuais de `Install Smoke` podem optar por incluí-lo, mas pull requests e pushes para `main` não. A CI normal de PR ainda executa a lane rápida de regressão do launcher Bun para alterações relevantes ao Node. Testes Docker de QR e instalador mantêm seus próprios Dockerfiles focados em instalação.

## E2E Docker Local

`pnpm test:docker:all` pré-constrói uma imagem compartilhada de teste live, empacota OpenClaw uma vez como tarball npm e cria duas imagens compartilhadas de `scripts/e2e/Dockerfile`:

- um runner Node/Git básico para lanes de instalador/atualização/dependência de plugin;
- uma imagem funcional que instala o mesmo tarball em `/app` para lanes de funcionalidade normal.

As definições de lanes Docker ficam em `scripts/lib/docker-e2e-scenarios.mjs`, a lógica do planejador fica em `scripts/lib/docker-e2e-plan.mjs`, e o runner executa apenas o plano selecionado. O agendador seleciona a imagem por lane com `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, então executa lanes com `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Ajustes

| Variável                               | Padrão | Finalidade                                                                                       |
| -------------------------------------- | ------ | ------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10     | Contagem de slots do pool principal para lanes normais.                                          |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10     | Contagem de slots do pool de cauda sensível a provedor.                                          |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9      | Limite de lanes live simultâneas para que os provedores não apliquem throttling.                  |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5      | Limite de lanes simultâneas de instalação npm.                                                    |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7      | Limite de lanes simultâneas multi-serviço.                                                        |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000   | Intervalo entre inícios de lanes para evitar tempestades de criação no daemon Docker; defina `0` para sem intervalo. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Timeout de fallback por lane (120 minutos); lanes live/de cauda selecionadas usam limites mais rígidos. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset  | `1` imprime o plano do agendador sem executar lanes.                                             |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset  | Lista exata de lanes separada por vírgulas; ignora o smoke de limpeza para que agentes possam reproduzir uma lane com falha. |

Uma lane mais pesada que seu limite efetivo ainda pode iniciar a partir de um pool vazio, então roda sozinha até liberar capacidade. O agregado local faz preflights do Docker, remove contêineres E2E obsoletos do OpenClaw, emite status de lanes ativas, persiste tempos de lanes para ordenação do mais longo primeiro e, por padrão, para de agendar novas lanes em pool após a primeira falha.

### Workflow live/E2E reutilizável

O workflow live/E2E reutilizável pergunta a `scripts/test-docker-all.mjs --plan-json` qual pacote, tipo de imagem, imagem live, lane e cobertura de credenciais são necessários. `scripts/docker-e2e.mjs` então converte esse plano em saídas e resumos do GitHub. Ele empacota o OpenClaw por meio de `scripts/package-openclaw-for-docker.mjs`, baixa um artefato de pacote da execução atual ou baixa um artefato de pacote de `package_artifact_run_id`; valida o inventário do tarball; cria e envia imagens GHCR Docker E2E bare/funcionais marcadas pelo digest do pacote por meio do cache de camadas Docker da Blacksmith quando o plano precisa de lanes com pacote instalado; e reutiliza entradas `docker_e2e_bare_image`/`docker_e2e_functional_image` fornecidas ou imagens existentes de digest de pacote em vez de reconstruir. Pulls de imagens Docker são repetidos com timeout limitado de 180 segundos por tentativa, para que um stream de registro/cache travado tente de novo rapidamente em vez de consumir a maior parte do caminho crítico da CI.

### Partes do caminho de release

A cobertura Docker de release executa jobs menores em partes com `OPENCLAW_SKIP_DOCKER_BUILD=1`, de modo que cada parte baixa apenas o tipo de imagem de que precisa e executa várias lanes pelo mesmo agendador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

As partes Docker de release atuais são `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` e `plugins-runtime-install-a` até `plugins-runtime-install-h`. `package-update-openai` inclui a lane live de pacote do Plugin Codex, que instala o pacote candidato do OpenClaw, instala o Plugin Codex a partir de `codex_plugin_spec` ou de um tarball da mesma referência com aprovação explícita de instalação da CLI Codex, executa o preflight da CLI Codex e, então, executa várias interações do agente OpenClaw na mesma sessão contra a OpenAI. `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` permanecem aliases agregados de plugin/runtime. O alias de lane `install-e2e` permanece o alias agregado de reexecução manual para ambas as lanes de instalador de provedor.

OpenWebUI é incorporado a `plugins-runtime-services` quando a cobertura completa de release-path o solicita, e mantém uma parte `openwebui` independente apenas para disparos somente de OpenWebUI. Lanes de atualização de canal integrado tentam novamente uma vez para falhas transitórias de rede npm.

Cada parte envia `.artifacts/docker-tests/` com logs de lanes, tempos, `summary.json`, `failures.json`, tempos de fases, JSON do plano do agendador, tabelas de lanes lentas e comandos de reexecução por lane. A entrada `docker_lanes` do workflow executa lanes selecionadas contra as imagens preparadas em vez dos jobs por parte, o que mantém a depuração de lane com falha limitada a um job Docker direcionado e prepara, baixa ou reutiliza o artefato de pacote para essa execução; se uma lane selecionada for uma lane Docker live, o job direcionado cria a imagem de teste live localmente para essa reexecução. Comandos de reexecução do GitHub gerados por lane incluem `package_artifact_run_id`, `package_artifact_name` e entradas de imagem preparada quando esses valores existem, para que uma lane com falha possa reutilizar exatamente o pacote e as imagens da execução com falha.

```bash
pnpm test:docker:rerun <run-id>      # baixar artefatos Docker e imprimir comandos de reexecução direcionados combinados/por lane
pnpm test:docker:timings <summary>   # resumos de lanes lentas e caminho crítico de fases
```

O workflow live/E2E agendado executa diariamente a suíte Docker completa de release-path.

## Pré-release de Plugin

`Plugin Prerelease` é uma cobertura de produto/pacote mais cara, por isso é um workflow separado disparado por `Full Release Validation` ou por um operador explícito. Pull requests normais, pushes para `main` e disparos manuais independentes de CI mantêm essa suíte desativada. Ele balanceia testes de Plugin integrado entre oito workers de extensão; esses jobs de shard de extensão executam até dois grupos de configuração de plugin por vez, com um worker Vitest por grupo e um heap Node maior, para que lotes de plugins pesados em importação não criem jobs extras de CI. O caminho Docker de pré-release exclusivo de release agrupa lanes Docker direcionadas em pequenos grupos para evitar reservar dezenas de runners para jobs de um a três minutos. O workflow também envia um artefato informativo `plugin-inspector-advisory` de `@openclaw/plugin-inspector`; achados do inspector são entrada de triagem e não alteram o gate bloqueante de Plugin Prerelease.

## QA Lab

QA Lab tem lanes de CI dedicadas fora do workflow principal de escopo inteligente. A paridade agêntica fica aninhada sob os harnesses amplos de QA e release, não em um workflow de PR independente. Use `Full Release Validation` com `rerun_group=qa-parity` quando a paridade deve acompanhar uma execução ampla de validação.

- O workflow `QA-Lab - All Lanes` é executado todas as noites em `main` e por disparo manual; ele distribui a lane de paridade mock, a lane live Matrix e as lanes live de Telegram e Discord como jobs paralelos. Jobs live usam o ambiente `qa-live-shared`, e Telegram/Discord usam leases Convex.

Verificações de release executam lanes de transporte live Matrix e Telegram com o provedor mock determinístico e modelos qualificados por mock (`mock-openai/gpt-5.5` e `mock-openai/gpt-5.5-alt`), para que o contrato de canal seja isolado da latência de modelo live e da inicialização normal de plugin de provedor. O gateway de transporte live desativa a busca de memória porque a paridade de QA cobre comportamento de memória separadamente; a conectividade de provedor é coberta pelas suítes separadas de modelo live, provedor nativo e provedor Docker.

Matrix usa `--profile fast` para gates agendados e de release, adicionando `--fail-fast` apenas quando a CLI em checkout dá suporte a isso. O padrão da CLI e a entrada de workflow manual permanecem `all`; disparos manuais com `matrix_profile=all` sempre fragmentam a cobertura Matrix completa em jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`.

`OpenClaw Release Checks` também executa as lanes críticas de release do QA Lab antes da aprovação de release; seu gate de paridade QA executa os pacotes candidato e baseline como jobs de lane paralelos, então baixa ambos os artefatos em um pequeno job de relatório para a comparação final de paridade.

Para PRs normais, siga evidências de CI/verificação com escopo em vez de tratar paridade como status obrigatório.

## CodeQL

O workflow `CodeQL` é intencionalmente um scanner de segurança estreito de primeira passagem, não uma varredura completa do repositório. Execuções diárias, manuais e de guarda em pull requests não draft escaneiam código de workflow de Actions mais as superfícies JavaScript/TypeScript de maior risco com consultas de segurança de alta confiança filtradas para `security-severity` alta/crítica.

A guarda de pull request permanece leve: ela só inicia para alterações em `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src` ou caminhos de runtime de Plugin integrado que possuem processo, e executa a mesma matriz de segurança de alta confiança que o workflow agendado. CodeQL de Android e macOS ficam fora dos padrões de PR.

### Categorias de segurança

| Categoria                                         | Superfície                                                                                                                        |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Linha de base de autenticação, segredos, sandbox, Cron e Gateway                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementação de canais do núcleo mais runtime de Plugin de canal, Gateway, Plugin SDK, segredos, pontos de auditoria |
| `/codeql-security-high/network-ssrf-boundary`     | Superfícies de SSRF do núcleo, análise de IP, proteção de rede, busca web e política de SSRF do Plugin SDK                        |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, auxiliares de execução de processos, entrega de saída e gates de execução de ferramentas de agentes               |
| `/codeql-security-high/process-exec-boundary`     | Shell local, auxiliares de criação de processos, runtimes de Plugins empacotados que possuem subprocessos e cola de scripts de workflow |
| `/codeql-security-high/plugin-trust-boundary`     | Superfícies de confiança de instalação de Plugin, carregador, manifesto, registro, instalação por gerenciador de pacotes, carregamento de código-fonte e contrato de pacote do Plugin SDK |

### Shards de segurança específicas da plataforma

- `CodeQL Android Critical Security` — shard agendado de segurança do Android. Compila o app Android manualmente para CodeQL no menor runner Blacksmith Linux aceito pela sanidade do workflow. Faz upload em `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard semanal/manual de segurança do macOS. Compila o app macOS manualmente para CodeQL no Blacksmith macOS, filtra resultados de build de dependências para fora do SARIF enviado e faz upload em `/codeql-critical-security/macos`. Mantido fora dos padrões diários porque o build do macOS domina o tempo de execução mesmo quando está limpo.

### Categorias de Qualidade Crítica

`CodeQL Critical Quality` é o shard não relacionado a segurança correspondente. Ele executa apenas consultas de qualidade JavaScript/TypeScript sem segurança e com severidade de erro sobre superfícies estreitas de alto valor em runners Linux hospedados no GitHub, para que varreduras de qualidade não consumam orçamento de registro de runners Blacksmith. Seu gate de pull request é intencionalmente menor que o perfil agendado: PRs que não são rascunho executam apenas os shards correspondentes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` e `plugin-sdk-reply-runtime` para mudanças em código de execução de comandos/modelos/ferramentas de agentes e despacho de respostas, código de schema/migração/IO de configuração, código de autenticação/segredos/sandbox/segurança, runtime de canal do núcleo e Plugin de canal empacotado, protocolo do Gateway/método de servidor, cola de runtime/SDK de memória, MCP/processo/entrega de saída, catálogo de modelos/runtime de provedor, diagnósticos de sessão/filas de entrega, carregador de Plugin, Plugin SDK/contrato de pacote ou runtime de resposta do Plugin SDK. Mudanças na configuração do CodeQL e no workflow de qualidade executam todos os doze shards de qualidade de PR.

O dispatch manual aceita:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Os perfis estreitos são ganchos de ensino/iteração para executar um shard de qualidade isoladamente.

| Categoria                                               | Superfície                                                                                                                                                      |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Código de limite de segurança de autenticação, segredos, sandbox, Cron e Gateway                                                                                |
| `/codeql-critical-quality/config-boundary`              | Contratos de schema de configuração, migração, normalização e IO                                                                                                |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schemas do protocolo do Gateway e contratos de métodos de servidor                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementação de canal do núcleo e Plugin de canal empacotado                                                                                      |
| `/codeql-critical-quality/agent-runtime-boundary`       | Contratos de runtime de execução de comandos, despacho de modelos/provedores, despacho e filas de resposta automática e plano de controle ACP                    |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP e pontes de ferramentas, auxiliares de supervisão de processos e contratos de entrega de saída                                                   |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK do host de memória, facades de runtime de memória, aliases do Plugin SDK de memória, cola de ativação do runtime de memória e comandos doctor de memória    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internos da fila de respostas, filas de entrega de sessão, auxiliares de vinculação/entrega de sessão de saída, superfícies de eventos de diagnóstico/pacotes de logs e contratos da CLI doctor de sessão |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de respostas de entrada do Plugin SDK, auxiliares de payload/fragmentação/runtime de respostas, opções de resposta de canal, filas de entrega e auxiliares de vinculação de sessão/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalização de catálogo de modelos, autenticação e descoberta de provedores, registro de runtime de provedores, padrões/catálogos de provedores e registros de web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap da UI de controle, persistência local, fluxos de controle do Gateway e contratos de runtime do plano de controle de tarefas                           |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratos de runtime de busca/pesquisa web do núcleo, IO de mídia, compreensão de mídia, geração de imagens e geração de mídia                                  |
| `/codeql-critical-quality/plugin-boundary`              | Contratos de carregador, registro, superfície pública e ponto de entrada do Plugin SDK                                                                          |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Código-fonte do Plugin SDK no lado do pacote publicado e auxiliares de contrato de pacote de Plugin                                                             |

Qualidade permanece separada de segurança para que achados de qualidade possam ser agendados, medidos, desativados ou expandidos sem obscurecer o sinal de segurança. A expansão de CodeQL para Swift, Python e Plugins empacotados deve ser adicionada de volta como trabalho de acompanhamento com escopo ou shards apenas depois que os perfis estreitos tiverem runtime e sinal estáveis.

## Workflows de manutenção

### Agente de Docs

O workflow `Docs Agent` é uma lane de manutenção do Codex orientada por eventos para manter docs existentes alinhadas com mudanças que chegaram recentemente. Ele não tem agenda pura: uma execução de CI de push sem bot bem-sucedida em `main` pode acioná-lo, e o dispatch manual pode executá-lo diretamente. Invocações por workflow-run são ignoradas quando `main` avançou ou quando outra execução não ignorada do Docs Agent foi criada na última hora. Quando ele executa, revisa o intervalo de commits do SHA de origem anterior não ignorado do Docs Agent até o `main` atual, então uma execução horária pode cobrir todas as mudanças em main acumuladas desde a última passada de docs.

### Agente de Performance de Testes

O workflow `Test Performance Agent` é uma lane de manutenção do Codex orientada por eventos para testes lentos. Ele não tem agenda pura: uma execução de CI de push sem bot bem-sucedida em `main` pode acioná-lo, mas ele pula se outra invocação por workflow-run já executou ou está executando naquele dia UTC. O dispatch manual ignora esse gate de atividade diária. A lane cria um relatório de performance Vitest agrupado de suíte completa, permite que o Codex faça apenas pequenas correções de performance de testes que preservem cobertura em vez de refatorações amplas, então reexecuta o relatório de suíte completa e rejeita mudanças que reduzam a contagem de testes aprovados na linha de base. O relatório agrupado registra tempo de parede por configuração e RSS máximo no Linux e macOS, então a comparação antes/depois expõe deltas de memória de testes ao lado dos deltas de duração. Se a linha de base tiver testes falhando, o Codex pode corrigir apenas falhas óbvias, e o relatório de suíte completa pós-agente deve passar antes que qualquer coisa seja commitada. Quando `main` avança antes que o push do bot chegue, a lane faz rebase do patch validado, reexecuta `pnpm check:changed` e tenta o push novamente; patches obsoletos com conflito são ignorados. Ela usa Ubuntu hospedado pelo GitHub para que a ação do Codex possa manter a mesma postura de segurança drop-sudo do agente de docs.

### PRs duplicados após merge

O workflow `Duplicate PRs After Merge` é um workflow manual de mantenedores para limpeza de duplicatas pós-land. Ele usa dry-run por padrão e só fecha PRs listados explicitamente quando `apply=true`. Antes de modificar o GitHub, ele verifica que o PR que chegou sofreu merge e que cada duplicata tem uma issue referenciada compartilhada ou hunks alterados sobrepostos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gates de verificação local e roteamento de mudanças

A lógica local de lanes alteradas vive em `scripts/changed-lanes.mjs` e é executada por `scripts/check-changed.mjs`. Esse gate de verificação local é mais rigoroso sobre limites de arquitetura do que o escopo amplo da plataforma de CI:

- mudanças de produção do núcleo executam typecheck de produção do núcleo e de testes do núcleo, mais lint/guards do núcleo;
- mudanças apenas em testes do núcleo executam apenas typecheck de testes do núcleo, mais lint do núcleo;
- mudanças de produção em extensão executam typecheck de produção de extensão e de testes de extensão, mais lint de extensão;
- mudanças apenas em testes de extensão executam typecheck de testes de extensão, mais lint de extensão;
- mudanças públicas no Plugin SDK ou no contrato de Plugin expandem para typecheck de extensão porque extensões dependem desses contratos do núcleo (varreduras Vitest de extensão permanecem trabalho de teste explícito);
- bumps de versão apenas de metadados de release executam verificações direcionadas de versão/configuração/dependências raiz;
- mudanças desconhecidas em raiz/configuração falham de forma segura para todas as lanes de verificação.

O roteamento local de testes alterados vive em `scripts/test-projects.test-support.mjs` e é intencionalmente mais barato que `check:changed`: edições diretas em testes executam a si mesmas, edições de código-fonte preferem mapeamentos explícitos, depois testes irmãos e dependentes do grafo de importação. A configuração de entrega compartilhada de grupo é um dos mapeamentos explícitos: mudanças na configuração de resposta visível ao grupo, modo de entrega de resposta da origem ou prompt de sistema da ferramenta de mensagem passam pelos testes de resposta do núcleo mais regressões de entrega do Discord e Slack, para que uma mudança de padrão compartilhado falhe antes do primeiro push de PR. Use `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` apenas quando a mudança for ampla o suficiente no harness para que o conjunto mapeado barato não seja uma proxy confiável.

## Validação Testbox

Crabbox é o wrapper de caixa remota de propriedade do repositório para prova Linux de mantenedor. Use-o
a partir da raiz do repositório quando uma verificação for ampla demais para um ciclo local de edição, quando a paridade com CI
importar, ou quando a prova precisar de segredos, Docker, lanes de pacote,
caixas reutilizáveis ou logs remotos. O backend normal do OpenClaw é
`blacksmith-testbox`; a capacidade AWS/Hetzner própria é um fallback para interrupções do Blacksmith,
problemas de cota ou testes explícitos em capacidade própria.

Execuções Blacksmith com suporte do Crabbox aquecem, reivindicam, sincronizam, executam, relatam e limpam
Testboxes descartáveis. A verificação de sanidade de sincronização integrada falha rapidamente quando arquivos obrigatórios
da raiz, como `pnpm-lock.yaml`, desaparecem ou quando `git status --short`
mostra pelo menos 200 exclusões rastreadas. Para PRs intencionais com exclusão em massa, defina
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para o comando remoto.

Crabbox também encerra uma invocação local da CLI do Blacksmith que permanece na
fase de sincronização por mais de cinco minutos sem saída pós-sincronização. Defina
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` para desativar essa proteção, ou use um valor maior
em milissegundos para diffs locais excepcionalmente grandes.

Antes de uma primeira execução, verifique o wrapper a partir da raiz do repositório:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

O wrapper do repositório recusa um binário Crabbox obsoleto que não anuncia `blacksmith-testbox`. Passe o provedor explicitamente, mesmo que `.crabbox.yaml` tenha padrões de nuvem própria. Em worktrees do Codex ou checkouts vinculados/esparsos, evite o script local `pnpm crabbox:run` porque o pnpm pode reconciliar dependências antes que o Crabbox inicie; em vez disso, invoque o wrapper node diretamente:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Execuções com suporte do Blacksmith exigem Crabbox 0.22.0 ou mais recente para que o wrapper obtenha o comportamento atual de sincronização, fila e limpeza do Testbox. Ao usar o checkout irmão, reconstrua o binário local ignorado antes de trabalho de medição de tempo ou prova:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

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
  "corepack pnpm check:changed"
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
  "corepack pnpm test <path-or-filter>"
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
  "corepack pnpm test"
```

Leia o resumo JSON final. Os campos úteis são `provider`, `leaseId`,
`syncDelegated`, `exitCode`, `commandMs` e `totalMs`. Para execuções delegadas
do Blacksmith Testbox, o código de saída do wrapper Crabbox e o resumo JSON são o
resultado do comando. A execução vinculada do GitHub Actions é dona da hidratação e do keepalive; ela
pode terminar como `cancelled` quando o Testbox é interrompido externamente depois que o comando SSH
já retornou. Trate isso como um artefato de limpeza/status, a menos que
o `exitCode` do wrapper seja diferente de zero ou a saída do comando mostre um teste com falha.
Execuções Crabbox descartáveis com suporte do Blacksmith devem interromper o Testbox automaticamente;
se uma execução for interrompida ou a limpeza não estiver clara, inspecione as caixas ativas e interrompa apenas
as caixas que você criou:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Use reutilização apenas quando você precisar intencionalmente de vários comandos na mesma caixa hidratada:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Se o Crabbox for a camada quebrada, mas o próprio Blacksmith funcionar, use Blacksmith direto
apenas para diagnósticos como `list`, `status` e limpeza. Corrija o
caminho do Crabbox antes de tratar uma execução direta do Blacksmith como prova de mantenedor.

Se `blacksmith testbox list --all` e `blacksmith testbox status` funcionarem, mas novos
aquecimentos ficarem `queued` sem IP ou URL de execução do Actions após alguns minutos,
trate isso como pressão de provedor, fila, cobrança ou limite de organização do Blacksmith. Interrompa os
ids em fila que você criou, evite iniciar mais Testboxes e mova a prova para o
caminho de capacidade própria do Crabbox abaixo enquanto alguém verifica o painel do Blacksmith,
a cobrança e os limites da organização.

Escale para capacidade própria do Crabbox apenas quando o Blacksmith estiver fora do ar, limitado por cota, sem o ambiente necessário, ou quando a capacidade própria for explicitamente o objetivo:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Sob pressão da AWS, evite `class=beast` a menos que a tarefa realmente precise de CPU da classe 48xlarge. Uma solicitação `beast` começa em 192 vCPUs e é a forma mais fácil de acionar a cota regional EC2 Spot ou On-Demand Standard. O `.crabbox.yaml` de propriedade do repositório usa como padrão `standard`, várias regiões de capacidade e `capacity.hints: true`, para que concessões intermediadas da AWS imprimam região/mercado selecionados, pressão de cota, fallback Spot e avisos de classe sob alta pressão. Use `fast` para verificações amplas mais pesadas, `large` apenas depois que standard/fast não forem suficientes, e `beast` apenas para lanes excepcionais dependentes de CPU, como suíte completa ou matrizes Docker de todos os plugins, validação explícita de release/bloqueador ou perfilamento de performance com muitos núcleos. Não use `beast` para `pnpm check:changed`, testes focados, trabalho apenas de documentação, lint/typecheck comuns, pequenas reproduções E2E ou triagem de interrupção do Blacksmith. Use `--market on-demand` para diagnóstico de capacidade, para que a volatilidade do mercado Spot não seja misturada ao sinal.

`.crabbox.yaml` é dono dos padrões de provedor, sincronização e hidratação do GitHub Actions para lanes de nuvem própria. Ele exclui o `.git` local para que o checkout hidratado do Actions mantenha seus próprios metadados Git remotos em vez de sincronizar remotes e object stores locais do mantenedor, e exclui artefatos locais de runtime/build que nunca devem ser transferidos. `.github/workflows/crabbox-hydrate.yml` é dono do checkout, configuração de Node/pnpm, fetch de `origin/main` e repasse de ambiente não secreto para comandos de nuvem própria `crabbox run --id <cbx_id>`.

## Relacionados

- [Visão geral de instalação](/pt-BR/install)
- [Canais de desenvolvimento](/pt-BR/install/development-channels)
