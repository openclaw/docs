---
read_when:
    - Você precisa entender por que um job de CI foi ou não executado
    - Você está depurando uma verificação do GitHub Actions com falha
    - Você está coordenando uma execução ou reexecução de validação de release
    - Você está alterando o despacho do ClawSweeper ou o encaminhamento de atividades do GitHub
summary: Grafo de trabalhos de CI, gates de escopo, guarda-chuvas de release e equivalentes de comandos locais
title: Pipeline de CI
x-i18n:
    generated_at: "2026-06-30T13:51:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 885202dd0f52b237e93a520999ac98ef3ad0fc1f8a03ccaceae9d38a2a4aca3b
    source_path: ci.md
    workflow: 16
---

O CI do OpenClaw roda em cada push para `main` e em cada pull request. Pushes
canônicos para `main` primeiro passam por uma janela de admissão de 90 segundos
no executor hospedado. O grupo de concorrência `CI` existente cancela essa
execução em espera quando um commit mais novo chega, então merges sequenciais
não registram, cada um, uma matriz Blacksmith completa. Pull requests e
execuções manuais pulam a espera. O job `preflight` então classifica o diff e
desativa lanes caras quando apenas áreas não relacionadas mudaram. Execuções
manuais de `workflow_dispatch` ignoram intencionalmente o escopo inteligente e
expandem o grafo completo para candidatos a release e validação ampla. Lanes de
Android permanecem opt-in por meio de `include_android`. A cobertura de Plugin
somente para release fica no fluxo de trabalho separado [`Plugin Prerelease`](#plugin-prerelease)
e roda apenas a partir de [`Full Release Validation`](#full-release-validation)
ou de um disparo manual explícito.

## Visão geral do pipeline

| Job                                | Finalidade                                                                                                  | Quando roda                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `preflight`                        | Detecta alterações somente de docs, escopos alterados, extensões alteradas e cria o manifesto do CI         | Sempre em pushes e PRs não rascunho                  |
| `runner-admission`                 | Debounce hospedado de 90 segundos para pushes canônicos em `main` antes de registrar trabalho no Blacksmith | Toda execução de CI; espera apenas em pushes canônicos para `main` |
| `security-fast`                    | Detecção de chave privada, auditoria de fluxo de trabalho alterado via `zizmor` e auditoria do lockfile de produção | Sempre em pushes e PRs não rascunho                  |
| `check-dependencies`               | Passagem de dependências de produção somente do Knip mais a guarda da lista de permissões de arquivos não usados | Alterações relevantes para Node                      |
| `build-artifacts`                  | Compila `dist/`, Control UI, smoke checks da CLI compilada, checks de artefatos compilados embutidos e artefatos reutilizáveis | Alterações relevantes para Node                      |
| `checks-fast-core`                 | Lanes rápidas de correção no Linux, como bundled, protocol, QA Smoke CI e checks de roteamento de CI        | Alterações relevantes para Node                      |
| `checks-fast-contracts-plugins-*`  | Dois checks fragmentados de contrato de plugins                                                             | Alterações relevantes para Node                      |
| `checks-fast-contracts-channels-*` | Dois checks fragmentados de contrato de canais                                                              | Alterações relevantes para Node                      |
| `checks-node-core-*`               | Shards de testes do Node core, excluindo lanes de canal, bundled, contrato e extensão                       | Alterações relevantes para Node                      |
| `check-*`                          | Equivalente fragmentado do gate local principal: tipos de prod, lint, guards, tipos de teste e smoke estrito | Alterações relevantes para Node                      |
| `check-additional-*`               | Arquitetura, drift fragmentado de limite/prompt, guards de extensão, limite de pacote e topologia de runtime | Alterações relevantes para Node                      |
| `checks-node-compat-node22`        | Lane de build de compatibilidade com Node 22 e smoke                                                        | Disparo manual de CI para releases                   |
| `check-docs`                       | Formatação, lint e checks de links quebrados da documentação                                                | Docs alterados                                       |
| `skills-python`                    | Ruff + pytest para Skills apoiadas por Python                                                               | Alterações relevantes para Skills de Python          |
| `checks-windows`                   | Testes específicos de processo/caminho no Windows mais regressões compartilhadas de especificadores de import de runtime | Alterações relevantes para Windows                   |
| `macos-node`                       | Lane de testes TypeScript no macOS usando os artefatos compilados compartilhados                            | Alterações relevantes para macOS                     |
| `macos-swift`                      | Lint, build e testes Swift para o app macOS                                                                 | Alterações relevantes para macOS                     |
| `ios-build`                        | Geração de projeto Xcode mais build do app iOS no simulador                                                 | App iOS, kit compartilhado do app ou alterações no Swabble |
| `android`                          | Testes unitários de Android para ambos os flavors mais um build de APK debug                                | Alterações relevantes para Android                   |
| `test-performance-agent`           | Otimização diária de testes lentos do Codex após atividade confiável                                        | Sucesso do CI principal ou disparo manual            |
| `openclaw-performance`             | Relatórios diários/sob demanda de performance do runtime Kova com lanes de provedor mock, perfil profundo e GPT 5.5 live | Disparo agendado e manual                            |

## Ordem de falha rápida

1. `runner-admission` espera apenas por pushes canônicos em `main`; um push mais novo cancela a execução antes do registro no Blacksmith.
2. `preflight` decide quais lanes existem. A lógica `docs-scope` e `changed-scope` são etapas dentro desse job, não jobs independentes.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` e `skills-python` falham rapidamente sem esperar pelos jobs mais pesados de matriz de artefatos e plataformas.
4. `build-artifacts` sobrepõe as lanes rápidas de Linux para que consumidores downstream possam começar assim que o build compartilhado estiver pronto.
5. Lanes mais pesadas de plataforma e runtime se expandem depois disso: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` e `android`.

O GitHub pode marcar jobs substituídos como `cancelled` quando um push mais novo chega no mesmo PR ou ref `main`. Trate isso como ruído de CI, a menos que a execução mais nova para a mesma ref também esteja falhando. Jobs de matriz usam `fail-fast: false`, e `build-artifacts` relata falhas embutidas de canal, core-support-boundary e gateway-watch diretamente em vez de enfileirar pequenos jobs verificadores. A chave automática de concorrência do CI é versionada (`CI-v7-*`) para que um zumbi do lado do GitHub em um grupo de fila antigo não bloqueie indefinidamente execuções mais novas de main. Execuções manuais da suíte completa usam `CI-manual-v1-*` e não cancelam execuções em andamento.

Use `pnpm ci:timings`, `pnpm ci:timings:recent` ou `node scripts/ci-run-timings.mjs <run-id>` para resumir tempo de parede, tempo de fila, jobs mais lentos, falhas e a barreira de fanout `pnpm-store-warmup` do GitHub Actions. O CI também envia o mesmo resumo de execução como um artefato `ci-timings-summary`. Para tempo de build, confira a etapa `Build dist` do job `build-artifacts`: `pnpm build:ci-artifacts` imprime `[build-all] phase timings:` e inclui `ui:build`; o job também envia o artefato `startup-memory`.

Para execuções de pull request, o job terminal de resumo de tempos executa o helper a partir da revisão base confiável antes de passar `GH_TOKEN` para `gh run view`. Isso mantém a consulta com token fora do código controlado pela branch enquanto ainda resume a execução atual de CI do pull request.

## Contexto de PR e evidências

PRs de contribuidores externos executam um gate de contexto de PR e evidências a partir de
`.github/workflows/real-behavior-proof.yml`. O fluxo de trabalho faz checkout do
commit base confiável e avalia apenas o corpo do PR; ele não executa código da
branch do contribuidor.

O gate se aplica a autores de PR que não são proprietários, membros,
colaboradores ou bots do repositório. Ele passa quando o corpo do PR contém as
seções autoradas `What Problem This Solves` e `Evidence`. A evidência pode ser um
teste focado, resultado de CI, captura de tela, gravação, saída de terminal,
observação live, log redigido ou link de artefato. O corpo fornece intenção e
validação útil; revisores inspecionam o código, os testes e o CI para avaliar a correção.

Quando o check falhar, atualize o corpo do PR em vez de enviar outro commit de código.

## Escopo e roteamento

A lógica de escopo fica em `scripts/ci-changed-scope.mjs` e é coberta por testes unitários em `src/scripts/ci-changed-scope.test.ts`. Disparos manuais pulam a detecção de escopo alterado e fazem o manifesto de preflight agir como se toda área com escopo tivesse mudado.

- **Edições no fluxo de trabalho de CI** validam o grafo de CI de Node mais linting de fluxos de trabalho, mas não forçam builds nativos de Windows, iOS, Android ou macOS por si só; essas lanes de plataforma permanecem escopadas a alterações de código-fonte da plataforma.
- **Workflow Sanity** executa `actionlint`, `zizmor` em todos os arquivos YAML de fluxo de trabalho, a guarda de interpolação de composite-action e a guarda de marcadores de conflito. O job `security-fast` escopado ao PR também executa `zizmor` sobre arquivos de fluxo de trabalho alterados para que achados de segurança de fluxo de trabalho falhem cedo no grafo principal de CI.
- **Docs em pushes para `main`** são verificadas pelo fluxo de trabalho independente `Docs` com o mesmo espelho de docs do ClawHub usado pelo CI, então pushes mistos de código+docs não enfileiram também o shard `check-docs` do CI. Pull requests e CI manual ainda executam `check-docs` a partir do CI quando docs mudaram.
- **TUI PTY** roda no shard Linux Node `checks-node-core-runtime-tui-pty` para alterações de TUI. O shard executa `test/vitest/vitest.tui-pty.config.ts` com `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, então cobre tanto a lane determinística de fixture `TuiBackend` quanto o smoke mais lento `tui --local`, que mocka apenas o endpoint externo de modelo.
- **Edições apenas de roteamento de CI, edições selecionadas e baratas em fixtures de testes do core e edições estreitas em helpers/roteamento de testes de contrato de plugins** usam um caminho rápido de manifesto somente Node: `preflight`, segurança e uma única tarefa `checks-fast-core`. Esse caminho pula artefatos de build, compatibilidade com Node 22, contratos de canais, shards completos do core, shards de plugins bundled e matrizes adicionais de guards quando a alteração é limitada às superfícies de roteamento ou helper que a tarefa rápida exercita diretamente.
- **Checks Node no Windows** são escopados para wrappers específicos de processo/caminho do Windows, helpers de runner npm/pnpm/UI, configuração de gerenciador de pacotes e as superfícies de fluxo de trabalho de CI que executam essa lane; alterações não relacionadas de código-fonte, Plugin, smoke de instalação e somente de testes permanecem nas lanes Linux Node.

Os conjuntos de testes Node mais lentos são divididos ou balanceados para que cada job permaneça pequeno sem reservar runners em excesso: contratos de plugin e contratos de canal rodam cada um como dois shards ponderados apoiados pelo Blacksmith com fallback para o runner padrão do GitHub, as lanes rápidas/de suporte de unidade do core rodam separadamente, a infraestrutura de runtime do core é dividida entre state, process/config, shared e três shards de domínio cron, auto-reply roda como workers balanceados (com a subárvore de reply dividida em shards de agent-runner, dispatch e commands/state-routing), e as configurações agentic gateway/server são divididas entre lanes chat/auth/model/http-plugin/runtime/startup em vez de aguardarem artefatos compilados. Em seguida, a CI normal empacota apenas shards de padrões de inclusão de infraestrutura isolada em pacotes determinísticos de no máximo 64 arquivos de teste, reduzindo a matriz Node sem mesclar suítes command/cron não isoladas, agents-core com estado ou gateway/server; suítes fixas pesadas permanecem em 8 vCPU, enquanto as lanes empacotadas e de menor peso usam 4 vCPU. Pull requests no repositório canônico usam um plano compacto adicional de admissão: os mesmos grupos por configuração rodam em subprocessos isolados dentro do plano Linux Node atual de 34 jobs, de modo que um único PR não registre a matriz Node completa de mais de 70 jobs. Pushes para `main`, disparos manuais e gates de release mantêm a matriz completa. Testes amplos de navegador, QA, mídia e plugins diversos usam suas configurações Vitest dedicadas em vez do catch-all compartilhado de plugins. Shards de padrões de inclusão registram entradas de tempo usando o nome do shard da CI, para que `.artifacts/vitest-shard-timings.json` consiga distinguir uma configuração inteira de um shard filtrado. `check-additional-*` mantém juntos o trabalho de compilação/canário de fronteira de pacote e separa a arquitetura de topologia de runtime da cobertura de gateway watch; a lista de guards de fronteira é distribuída em um shard pesado de prompts e um shard combinado para as demais faixas de guards, cada um executando guards independentes selecionados em paralelo e imprimindo tempos por verificação. A verificação cara de drift de snapshot de prompt do caminho feliz do Codex roda como seu próprio job adicional somente para CI manual e mudanças que afetam prompts, de modo que mudanças Node normais e não relacionadas não esperem atrás da geração fria de snapshots de prompt, e os shards de fronteira permaneçam balanceados enquanto o drift de prompt ainda fica associado ao PR que o causou; a mesma flag pula a geração Vitest de snapshots de prompt dentro do shard core support-boundary de artefatos compilados. Gateway watch, testes de canal e o shard core support-boundary rodam em paralelo dentro de `build-artifacts` depois que `dist/` e `dist-runtime/` já foram compilados.

Uma vez admitida, a CI Linux canônica permite até 24 jobs de teste Node simultâneos e
12 para as lanes menores fast/check; Windows e Android permanecem em dois porque
esses pools de runners são mais restritos.

O plano compacto de PR emite 18 jobs Node para a suíte atual: grupos de configuração
inteira são agrupados em subprocessos isolados com timeout de lote de 120 minutos,
enquanto grupos de padrões de inclusão compartilham o mesmo orçamento limitado de jobs.

A CI Android roda tanto `testPlayDebugUnitTest` quanto `testThirdPartyDebugUnitTest` e depois compila o APK de debug Play. O flavor third-party não tem source set nem manifest separado; sua lane de testes unitários ainda compila o flavor com as flags BuildConfig de SMS/call-log, evitando ao mesmo tempo um job duplicado de empacotamento de APK de debug em todo push relevante para Android.

O shard `check-dependencies` roda `pnpm deadcode:dependencies` (uma passagem Knip de produção apenas para dependências fixada na versão mais recente do Knip, com a idade mínima de release do pnpm desativada para a instalação `dlx`) e `pnpm deadcode:unused-files`, que compara os achados de arquivos não usados em produção do Knip com `scripts/deadcode-unused-files.allowlist.mjs`. O guard de arquivos não usados falha quando um PR adiciona um novo arquivo não usado sem revisão ou deixa uma entrada obsoleta na allowlist, preservando ao mesmo tempo superfícies intencionais de plugin dinâmico, geradas, de build, de teste live e de ponte de pacote que o Knip não consegue resolver estaticamente.

## Encaminhamento de atividade do ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` é a ponte do lado de destino da atividade do repositório OpenClaw para o ClawSweeper. Ele não faz checkout nem executa código não confiável de pull requests. O workflow cria um token de GitHub App a partir de `CLAWSWEEPER_APP_PRIVATE_KEY` e então dispara payloads compactos de `repository_dispatch` para `openclaw/clawsweeper`.

O workflow tem quatro lanes:

- `clawsweeper_item` para solicitações exatas de revisão de issues e pull requests;
- `clawsweeper_comment` para comandos explícitos do ClawSweeper em comentários de issues;
- `clawsweeper_commit_review` para solicitações de revisão em nível de commit em pushes para `main`;
- `github_activity` para atividade geral do GitHub que o agente ClawSweeper pode inspecionar.

A lane `github_activity` encaminha apenas metadados normalizados: tipo de evento, ação, ator, repositório, número do item, URL, título, estado e trechos curtos de comentários ou revisões quando presentes. Ela evita intencionalmente encaminhar o corpo completo do webhook. O workflow receptor em `openclaw/clawsweeper` é `.github/workflows/github-activity.yml`, que publica o evento normalizado no hook do OpenClaw Gateway para o agente ClawSweeper.

Atividade geral é observação, não entrega por padrão. O agente ClawSweeper recebe o destino do Discord em seu prompt e deve publicar em `#clawsweeper` somente quando o evento for surpreendente, acionável, arriscado ou operacionalmente útil. Aberturas de rotina, edições, rotatividade de bots, ruído de webhooks duplicados e tráfego normal de revisão devem resultar em `NO_REPLY`.

Trate títulos, comentários, corpos, textos de revisão, nomes de branches e mensagens de commit do GitHub como dados não confiáveis em todo este caminho. Eles são entrada para sumarização e triagem, não instruções para o workflow ou runtime do agente.

## Disparos manuais

Disparos manuais da CI rodam o mesmo grafo de jobs da CI normal, mas forçam todas as lanes com escopo não Android: shards Linux Node, shards de plugins empacotados, shards de contratos de plugin e canal, compatibilidade com Node 22, `check-*`, `check-additional-*`, smoke checks de artefatos compilados, verificações de documentação, Skills em Python, Windows, macOS, build iOS e i18n da Control UI. Disparos manuais autônomos da CI rodam Android somente com `include_android=true`; o guarda-chuva completo de release habilita Android passando `include_android=true`. Verificações estáticas de pré-release de plugins, o shard exclusivo de release `agentic-plugins`, a varredura completa em lote de extensões e as lanes Docker de pré-release de plugins são excluídos da CI. A suíte Docker de pré-release roda somente quando `Full Release Validation` dispara o workflow separado `Plugin Prerelease` com o gate de validação de release habilitado.

Execuções manuais usam um grupo de concorrência único para que uma suíte completa de candidato a release não seja cancelada por outro push ou execução de PR no mesmo ref. A entrada opcional `target_ref` permite que um chamador confiável rode esse grafo contra uma branch, tag ou SHA de commit completo usando o arquivo de workflow do ref de disparo selecionado.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                          | Jobs                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Disparo manual da CI e fallbacks de repositórios não canônicos, verificações de qualidade CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, workflows de documentação fora da CI e preflight install-smoke para que a matriz Blacksmith possa entrar na fila mais cedo                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, shards de extensão de menor peso, `checks-fast-core`, shards de contrato de plugin/canal, a maioria dos shards Linux Node empacotados/de menor peso, `check-guards`, `check-prod-types`, `check-test-types`, shards selecionados de `check-additional-*` e `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Suítes Linux Node pesadas mantidas, shards `check-additional-*` pesados em fronteiras/extensões e `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (sensível o bastante a CPU para que 8 vCPU custassem mais do que economizavam); builds Docker install-smoke (o tempo de fila de 32 vCPU custava mais do que economizava)                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` em `openclaw/openclaw`; forks usam fallback para `macos-15`                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` e `ios-build` em `openclaw/openclaw`; forks usam fallback para `macos-26`                                                                                                                                                                                                  |

## Orçamento de registro de runners

O bucket atual de registro de runners do GitHub da OpenClaw relata 10.000
registros de runners self-hosted a cada 5 minutos em `ghx api rate_limit`. Verifique novamente
`actions_runner_registration` antes de cada rodada de ajuste porque o GitHub pode alterar
esse bucket. O limite é compartilhado por todos os registros de runners Blacksmith na
organização `openclaw`, portanto adicionar outra instalação Blacksmith não adiciona
um novo bucket.

Trate os labels Blacksmith como o recurso escasso para controle de rajadas. Jobs que
apenas roteiam, notificam, resumem, selecionam shards ou rodam varreduras curtas do CodeQL devem
permanecer em runners hospedados pelo GitHub, a menos que tenham necessidades específicas do Blacksmith
medidas. Qualquer nova matriz Blacksmith, `max-parallel` maior ou workflow de alta frequência
deve mostrar sua contagem de registros de pior caso e manter a meta em nível de organização
abaixo de cerca de 60% do bucket live. Com o bucket atual de 10.000 registros,
isso significa uma meta operacional de 6.000 registros, deixando folga para
repositórios simultâneos, novas tentativas e sobreposição de rajadas.

A CI do repositório canônico mantém o Blacksmith como o caminho padrão de runner para execuções normais de push e pull request. `workflow_dispatch` e execuções em repositórios não canônicos usam runners hospedados pelo GitHub, mas execuções canônicas normais atualmente não sondam a saúde da fila do Blacksmith nem fazem fallback automaticamente para labels hospedados pelo GitHub quando o Blacksmith está indisponível.

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

`OpenClaw Performance` é o fluxo de trabalho de desempenho do produto/runtime. Ele é executado diariamente em `main` e pode ser disparado manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

O disparo manual normalmente mede o desempenho da ref do fluxo de trabalho. Defina `target_ref` para medir uma tag de lançamento ou outro branch com a implementação atual do fluxo de trabalho. Os caminhos dos relatórios publicados e os ponteiros mais recentes são indexados pela ref testada, e cada `index.md` registra a ref/SHA testada, a ref/SHA do fluxo de trabalho, a ref do Kova, o perfil, o modo de autenticação da lane, o modelo, a contagem de repetições e os filtros de cenário.

O fluxo de trabalho instala o OCM a partir de um lançamento fixado e o Kova de `openclaw/Kova` na entrada fixada `kova_ref`, então executa três lanes:

- `mock-provider`: cenários de diagnóstico do Kova contra um runtime de build local com autenticação falsa determinística compatível com OpenAI.
- `mock-deep-profile`: criação de perfis de CPU/heap/trace para pontos críticos de inicialização, gateway e turno do agente.
- `live-openai-candidate`: um turno real de agente OpenAI `openai/gpt-5.5`, ignorado quando `OPENAI_API_KEY` não está disponível.

A lane mock-provider também executa sondas de código-fonte nativas do OpenClaw depois da passagem do Kova: tempo de inicialização e memória do gateway nos casos de inicialização padrão, com hook e com 50 plugins; RSS de importação de plugins agrupados, loops repetidos de hello `channel-chat-baseline` com OpenAI simulado, comandos de inicialização da CLI contra o gateway inicializado e a sonda de desempenho de smoke do estado SQLite. Quando o relatório de código-fonte mock-provider publicado anteriormente está disponível para a ref testada, o resumo de código-fonte compara os valores atuais de RSS e heap com essa linha de base e marca grandes aumentos de RSS como `watch`. O resumo em Markdown da sonda de código-fonte fica em `source/index.md` no pacote do relatório, com o JSON bruto ao lado.

Cada lane envia artefatos para o GitHub. Quando `CLAWGRIT_REPORTS_TOKEN` está configurado, o fluxo de trabalho também faz commit de `report.json`, `report.md`, pacotes, `index.md` e artefatos de sonda de código-fonte em `openclaw/clawgrit-reports` sob `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. O ponteiro atual da ref testada é gravado como `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validação Completa de Lançamento

`Full Release Validation` é o fluxo de trabalho guarda-chuva manual para "executar tudo antes do lançamento". Ele aceita um branch, tag ou SHA de commit completo, dispara o fluxo de trabalho manual `CI` com esse alvo, dispara `Plugin Prerelease` para prova exclusiva de lançamento de plugin/pacote/estática/Docker e dispara `OpenClaw Release Checks` para smoke de instalação, aceitação de pacote, verificações de pacote entre sistemas operacionais, renderização de scorecard de maturidade a partir de evidências de perfil de QA, paridade do QA Lab, Matrix e lanes do Telegram. Os perfis estável e completo sempre incluem cobertura exaustiva live/E2E e soak do caminho de lançamento Docker; o perfil beta pode optar por isso com `run_release_soak=true`. O E2E canônico do pacote Telegram é executado dentro de Package Acceptance, portanto um candidato completo não inicia um poller live duplicado. Depois da publicação, passe `release_package_spec` para reutilizar o pacote npm entregue nos checks de lançamento, Package Acceptance, Docker, entre sistemas operacionais e Telegram sem reconstruir. Use `npm_telegram_package_spec` apenas para uma nova execução focada do Telegram com pacote publicado. A lane de pacote live do plugin Codex usa o mesmo estado selecionado por padrão: `release_package_spec=openclaw@<tag>` publicado deriva `codex_plugin_spec=npm:@openclaw/codex@<tag>`, enquanto execuções por SHA/artefato empacotam `extensions/codex` a partir da ref selecionada. Defina `codex_plugin_spec` explicitamente para fontes de plugin personalizadas, como especificações `npm:`, `npm-pack:` ou `git:`.

Consulte [Validação completa de lançamento](/pt-BR/reference/full-release-validation) para a
matriz de estágios, os nomes exatos dos jobs do fluxo de trabalho, diferenças
de perfil, artefatos e identificadores de nova execução focada.

`OpenClaw Release Publish` é o fluxo de trabalho manual mutável de lançamento. Dispare-o
a partir de `release/YYYY.M.PATCH` ou `main` depois que a tag de lançamento existir e depois que o
preflight npm do OpenClaw tiver sido bem-sucedido. Ele verifica `pnpm plugins:sync:check`,
dispara `Plugin NPM Release` para todos os pacotes de plugin publicáveis, dispara
`Plugin ClawHub Release` para o mesmo SHA de lançamento e só então dispara
`OpenClaw NPM Release` com o `preflight_run_id` salvo. A publicação estável também
exige um `windows_node_tag` exato; o fluxo de trabalho verifica o lançamento de código-fonte
do Windows e compara seus instaladores x64/ARM64 com a entrada
`windows_node_installer_digests` aprovada pelo candidato antes de qualquer filho de publicação, então promove
e verifica esses mesmos resumos fixados de instalador mais o ativo complementar exato
e o contrato de checksum antes de publicar o rascunho de lançamento do GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Para prova de commit fixado em um branch que muda rapidamente, use o helper em vez de
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Refs de disparo de fluxo de trabalho do GitHub devem ser branches ou tags, não SHAs de commit brutos. O
helper envia um branch temporário `release-ci/<sha>-...` no SHA alvo,
dispara `Full Release Validation` a partir dessa ref fixada, verifica se cada
`headSha` de fluxo de trabalho filho corresponde ao alvo e exclui o branch temporário quando a
execução termina. O verificador guarda-chuva também falha se qualquer fluxo de trabalho filho for executado em um
SHA diferente.

`release_profile` controla a amplitude live/provedor passada para os checks de lançamento. Os
fluxos de trabalho manuais de lançamento usam `stable` por padrão; use `full` apenas quando você
intencionalmente quiser a ampla matriz consultiva de provedor/mídia. Os checks de lançamento
estável e completo sempre executam o soak exaustivo live/E2E e do caminho de lançamento Docker;
o perfil beta pode optar por isso com `run_release_soak=true`.

- `minimum` mantém as lanes OpenAI/core críticas para lançamento mais rápidas.
- `stable` adiciona o conjunto estável de provedores/backends.
- `full` executa a ampla matriz consultiva de provedor/mídia.

O guarda-chuva registra os ids de execução dos filhos disparados, e o job final `Verify full validation` verifica novamente as conclusões atuais das execuções filhas e acrescenta tabelas dos jobs mais lentos para cada execução filha. Se um fluxo de trabalho filho for reexecutado e ficar verde, reexecute apenas o job verificador pai para atualizar o resultado do guarda-chuva e o resumo de tempos.

Para recuperação, tanto `Full Release Validation` quanto `OpenClaw Release Checks` aceitam `rerun_group`. Use `all` para um candidato a lançamento, `ci` apenas para o filho normal de CI completo, `plugin-prerelease` apenas para o filho de pré-lançamento de plugin, `release-checks` para cada filho de lançamento ou um grupo mais restrito: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` no guarda-chuva. Isso mantém limitada a nova execução de uma caixa de lançamento com falha depois de uma correção focada. Para uma lane entre sistemas operacionais com falha, combine `rerun_group=cross-os` com `cross_os_suite_filter`, por exemplo `windows/packaged-upgrade`; comandos longos entre sistemas operacionais emitem linhas de Heartbeat, e resumos packaged-upgrade incluem tempos por fase. As lanes de QA dos checks de lançamento são consultivas, exceto o gate padrão de cobertura de ferramentas de runtime, que bloqueia quando ferramentas dinâmicas obrigatórias do OpenClaw desviam ou desaparecem do resumo de tier padrão.

`OpenClaw Release Checks` usa a ref confiável do fluxo de trabalho para resolver a ref selecionada uma vez em um tarball `release-package-under-test`, depois passa esse artefato para verificações entre sistemas operacionais e Package Acceptance, além do fluxo de trabalho Docker live/E2E do caminho de lançamento quando a cobertura de soak é executada. Isso mantém os bytes do pacote consistentes entre caixas de lançamento e evita reempacotar o mesmo candidato em vários jobs filhos. Para a lane live do plugin npm Codex, os checks de lançamento passam uma especificação de plugin publicado correspondente derivada de `release_package_spec`, passam o `codex_plugin_spec` fornecido pelo operador ou deixam a entrada em branco para que o script Docker empacote o plugin Codex do checkout selecionado.

Execuções duplicadas de `Full Release Validation` para `ref=main` e `rerun_group=all`
substituem o guarda-chuva mais antigo. O monitor pai cancela qualquer fluxo de trabalho filho que
já tenha disparado quando o pai é cancelado, então uma validação mais nova de main
não fica atrás de uma execução obsoleta de duas horas de checks de lançamento. A validação
de branch/tag de lançamento e grupos de nova execução focada mantêm `cancel-in-progress: false`.

## Shards Live e E2E

O filho live/E2E de lançamento mantém ampla cobertura nativa de `pnpm test:live`, mas a executa como shards nomeados por meio de `scripts/test-live-shard.mjs` em vez de um job serial:

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

Isso mantém a mesma cobertura de arquivos enquanto torna falhas lentas de provedores live mais fáceis de reexecutar e diagnosticar. Os nomes agregados de shards `native-live-extensions-o-z`, `native-live-extensions-media` e `native-live-extensions-media-music` continuam válidos para novas execuções manuais únicas.

Os shards nativos de mídia live são executados em `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, criado pelo fluxo de trabalho `Live Media Runner Image`. Essa imagem pré-instala `ffmpeg` e `ffprobe`; os jobs de mídia apenas verificam os binários antes da configuração. Mantenha suítes live baseadas em Docker em runners Blacksmith normais — jobs em contêiner são o lugar errado para iniciar testes Docker aninhados.

Shards de modelo/backend ao vivo baseados em Docker usam uma imagem compartilhada separada `ghcr.io/openclaw/openclaw-live-test:<sha>` por commit selecionado. O workflow de release ao vivo constrói e publica essa imagem uma vez; depois, os shards de modelo Docker ao vivo, Gateway fragmentado por provedor, backend da CLI, vínculo ACP e harness Codex executam com `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shards Docker do Gateway carregam limites explícitos de `timeout` no nível de script abaixo do timeout do job do workflow, para que um contêiner travado ou caminho de limpeza falhe rapidamente em vez de consumir todo o orçamento da verificação de release. Se esses shards reconstruírem o alvo Docker completo do código-fonte de forma independente, a execução de release está mal configurada e desperdiçará tempo de relógio em builds de imagem duplicados.

## Aceitação de pacote

Use `Package Acceptance` quando a pergunta for "este pacote instalável do OpenClaw funciona como produto?" Ela é diferente da CI normal: a CI normal valida a árvore de código-fonte, enquanto a aceitação de pacote valida um único tarball pelo mesmo harness Docker E2E que os usuários exercitam depois da instalação ou atualização.

### Jobs

1. `resolve_package` faz checkout de `workflow_ref`, resolve um candidato de pacote, grava `.artifacts/docker-e2e-package/openclaw-current.tgz`, grava `.artifacts/docker-e2e-package/package-candidate.json`, envia ambos como o artefato `package-under-test` e imprime a origem, a ref do workflow, a ref do pacote, a versão, o SHA-256 e o perfil no resumo da etapa do GitHub.
2. `docker_acceptance` chama `openclaw-live-and-e2e-checks-reusable.yml` com `ref=workflow_ref` e `package_artifact_name=package-under-test`. O workflow reutilizável baixa esse artefato, valida o inventário do tarball, prepara imagens Docker com digest de pacote quando necessário e executa as lanes Docker selecionadas contra esse pacote em vez de empacotar o checkout do workflow. Quando um perfil seleciona múltiplas `docker_lanes` direcionadas, o workflow reutilizável prepara o pacote e as imagens compartilhadas uma vez, depois distribui essas lanes como jobs Docker direcionados paralelos com artefatos únicos.
3. `package_telegram` opcionalmente chama `NPM Telegram Beta E2E`. Ele executa quando `telegram_mode` não é `none` e instala o mesmo artefato `package-under-test` quando a Aceitação de pacote resolveu um; o dispatch independente do Telegram ainda pode instalar uma especificação npm publicada.
4. `summary` falha o workflow se a resolução de pacote, a aceitação Docker ou a lane opcional do Telegram falhou.

### Origens de candidatos

- `source=npm` aceita apenas `openclaw@beta`, `openclaw@latest` ou uma versão exata de release do OpenClaw, como `openclaw@2026.4.27-beta.2`. Use isto para aceitação de pré-release/stable publicado.
- `source=ref` empacota uma branch, tag ou SHA de commit completo confiável de `package_ref`. O resolvedor busca branches/tags do OpenClaw, verifica se o commit selecionado é alcançável a partir do histórico de branches do repositório ou de uma tag de release, instala dependências em uma worktree detached e o empacota com `scripts/package-openclaw-for-docker.mjs`.
- `source=url` baixa um `.tgz` HTTPS público; `package_sha256` é obrigatório. Esse caminho rejeita credenciais na URL, portas HTTPS não padrão, nomes de host ou IPs resolvidos privados/internos/de uso especial, e redirecionamentos fora da mesma política pública de segurança.
- `source=trusted-url` baixa um `.tgz` HTTPS de uma política de origem confiável nomeada em `.github/package-trusted-sources.json`; `package_sha256` e `trusted_source_id` são obrigatórios. Use isto apenas para espelhos empresariais ou repositórios privados de pacotes mantidos por mantenedores que precisem de hosts, portas, prefixos de caminho, hosts de redirecionamento ou resolução de rede privada configurados. Se a política declara autenticação bearer, o workflow usa o secret fixo `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; credenciais incorporadas à URL ainda são rejeitadas.
- `source=artifact` baixa um `.tgz` de `artifact_run_id` e `artifact_name`; `package_sha256` é opcional, mas deve ser fornecido para artefatos compartilhados externamente.

Mantenha `workflow_ref` e `package_ref` separados. `workflow_ref` é o código confiável de workflow/harness que executa o teste. `package_ref` é o commit de origem que é empacotado quando `source=ref`. Isso permite que o harness de teste atual valide commits de origem confiáveis mais antigos sem executar lógica antiga de workflow.

### Perfis de suíte

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` mais `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunks completos do caminho de release Docker com OpenWebUI
- `custom` — `docker_lanes` exatas; obrigatório quando `suite_profile=custom`

O perfil `package` usa cobertura offline de Plugin para que a validação de pacote publicado não dependa da disponibilidade ao vivo do ClawHub. A lane opcional do Telegram reutiliza o artefato `package-under-test` em `NPM Telegram Beta E2E`, mantendo o caminho de especificação npm publicada para dispatches independentes.

Para a política dedicada de testes de atualização e Plugin, incluindo comandos locais, lanes Docker, entradas de Aceitação de pacote, padrões de release e triagem de falhas, consulte [Testando atualizações e Plugins](/pt-BR/help/testing-updates-plugins).

Verificações de release chamam a Aceitação de pacote com `source=artifact`, o artefato de pacote de release preparado, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` e `telegram_mode=mock-openai`. Isso mantém a migração de pacote, atualização, instalação ao vivo de Skills do ClawHub, limpeza de dependências obsoletas de Plugin, reparo de instalação de Plugin configurado, Plugin offline, atualização de Plugin e prova do Telegram no mesmo tarball de pacote resolvido. Defina `release_package_spec` em Full Release Validation ou OpenClaw Release Checks depois de publicar um beta para executar a mesma matriz contra o pacote npm enviado sem reconstruir; defina `package_acceptance_package_spec` apenas quando a Aceitação de pacote precisar de um pacote diferente do restante da validação de release. Verificações de release cross-OS ainda cobrem onboarding, instalador e comportamento de plataforma específicos de OS; validação de produto de pacote/atualização deve começar com a Aceitação de pacote. A lane Docker `published-upgrade-survivor` valida uma linha de base de pacote publicado por execução no caminho bloqueante de release. Na Aceitação de pacote, o tarball `package-under-test` resolvido é sempre o candidato, e `published_upgrade_survivor_baseline` seleciona a linha de base publicada de fallback, com padrão `openclaw@latest`; comandos de reexecução de lane com falha preservam essa linha de base. Full Release Validation com `run_release_soak=true` ou `release_profile=full` define `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` e `published_upgrade_survivor_scenarios=reported-issues` para expandir entre os quatro releases npm stable mais recentes, além de releases fixados de fronteira de compatibilidade de Plugin e fixtures em formato de issues para configuração do Feishu, arquivos bootstrap/persona preservados, instalações configuradas de Plugin do OpenClaw, caminhos de log com til, e raízes obsoletas de dependências legadas de Plugin. Seleções multibase de published-upgrade survivor são fragmentadas por linha de base em jobs separados de runner Docker direcionado. O workflow separado `Update Migration` usa a lane Docker `update-migration` com `all-since-2026.4.23` e `plugin-deps-cleanup` quando a pergunta é limpeza exaustiva de atualização publicada, não a amplitude normal de CI de Full Release. Execuções agregadas locais podem passar especificações exatas de pacote com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, manter uma única lane com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` como `openclaw@2026.4.15`, ou definir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para a matriz de cenários. A lane publicada configura a linha de base com uma receita embutida de comando `openclaw config set`, registra etapas da receita em `summary.json` e sonda `/healthz`, `/readyz`, além do status RPC depois do início do Gateway. As lanes Windows fresh empacotada e de instalador também verificam que um pacote instalado consegue importar uma substituição de controle de navegador a partir de um caminho Windows absoluto bruto. O smoke de turno de agente OpenAI cross-OS usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` como padrão quando definido; caso contrário, `openai/gpt-5.5`, para que a prova de instalação e Gateway permaneça em um modelo de teste GPT-5 enquanto evita padrões GPT-4.x.

### Janelas de compatibilidade legada

A Aceitação de pacote tem janelas limitadas de compatibilidade legada para pacotes já publicados. Pacotes até `2026.4.25`, incluindo `2026.4.25-beta.*`, podem usar o caminho de compatibilidade:

- entradas privadas conhecidas de QA em `dist/postinstall-inventory.json` podem apontar para arquivos omitidos do tarball;
- `doctor-switch` pode pular o subcaso de persistência `gateway install --wrapper` quando o pacote não expõe essa flag;
- `update-channel-switch` pode remover `patchedDependencies` ausentes do pnpm da fixture falsa de git derivada do tarball e pode registrar `update.channel` persistido ausente;
- smokes de Plugin podem ler locais legados de registro de instalação ou aceitar persistência ausente de registro de instalação do marketplace;
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

Ao depurar uma execução de aceitação de pacote com falha, comece pelo resumo de `resolve_package` para confirmar a origem, a versão e o SHA-256 do pacote. Depois, inspecione a execução filha `docker_acceptance` e seus artefatos Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logs de lane, tempos de fase e comandos de reexecução. Prefira reexecutar o perfil de pacote com falha ou as lanes Docker exatas em vez de reexecutar a validação completa de release.

## Smoke de instalação

O workflow separado `Install Smoke` reutiliza o mesmo script de escopo por meio de seu próprio job `preflight`. Ele divide a cobertura de smoke entre `run_fast_install_smoke` e `run_full_install_smoke`.

- **Caminho rápido** é executado para solicitações de pull que tocam superfícies de Docker/pacote, alterações de pacote/manifesto de Plugin empacotado ou superfícies centrais de Plugin/canal/Gateway/SDK de Plugin que os jobs de smoke do Docker exercitam. Alterações somente de código-fonte em Plugins empacotados, edições somente de testes e edições somente de documentação não reservam workers do Docker. O caminho rápido cria a imagem do Dockerfile raiz uma vez, verifica a CLI, executa o smoke da CLI de exclusão de agents com workspace compartilhado, executa o e2e de gateway-network do contêiner, verifica um argumento de build de extensão empacotada e executa o perfil de Docker de Plugin empacotado limitado sob um tempo limite agregado de comando de 240 segundos (com a execução de Docker de cada cenário limitada separadamente).
- **Caminho completo** mantém a instalação de pacote QR e a cobertura de Docker/atualização do instalador para execuções agendadas noturnas, acionamentos manuais, verificações de release por workflow-call e solicitações de pull que realmente tocam superfícies de instalador/pacote/Docker. No modo completo, install-smoke prepara ou reutiliza uma imagem de smoke GHCR do Dockerfile raiz para um SHA de destino, então executa instalação de pacote QR, smokes do Dockerfile raiz/Gateway, smokes de instalador/atualização e o E2E de Docker rápido de Plugin empacotado como jobs separados para que o trabalho de instalador não espere atrás dos smokes da imagem raiz.

Envios para `main` (incluindo commits de merge) não forçam o caminho completo; quando a lógica de escopo alterado pediria cobertura completa em um envio, o fluxo de trabalho mantém o smoke rápido do Docker e deixa o smoke completo de instalação para validação noturna ou de release.

O smoke lento de image-provider com instalação global do Bun é controlado separadamente por `run_bun_global_install_smoke`. Ele é executado no agendamento noturno e a partir do fluxo de trabalho de verificações de release, e acionamentos manuais de `Install Smoke` podem optar por incluí-lo, mas solicitações de pull e envios para `main` não. A CI normal de PR ainda executa a lane rápida de regressão do launcher Bun para alterações relevantes ao Node. Os testes de Docker de QR e instalador mantêm seus próprios Dockerfiles focados em instalação.

## E2E local do Docker

`pnpm test:docker:all` pré-compila uma imagem compartilhada de teste live, empacota o OpenClaw uma vez como tarball npm e cria duas imagens compartilhadas de `scripts/e2e/Dockerfile`:

- um runner básico de Node/Git para lanes de instalador/atualização/dependência de Plugin;
- uma imagem funcional que instala o mesmo tarball em `/app` para lanes de funcionalidade normal.

As definições de lanes do Docker ficam em `scripts/lib/docker-e2e-scenarios.mjs`, a lógica do planejador fica em `scripts/lib/docker-e2e-plan.mjs`, e o runner executa apenas o plano selecionado. O agendador seleciona a imagem por lane com `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, depois executa lanes com `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Ajustáveis

| Variável                               | Padrão | Finalidade                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Contagem de slots do pool principal para lanes normais.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Contagem de slots do pool final sensível a provider.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Limite de lanes live simultâneas para que providers não apliquem limitação.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | Limite de lanes simultâneas de instalação npm.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Limite de lanes simultâneas de múltiplos serviços.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Intervalo entre inícios de lanes para evitar tempestades de criação no daemon do Docker; defina `0` para nenhum intervalo.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Tempo limite de fallback por lane (120 minutos); lanes live/finais selecionadas usam limites mais apertados.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` imprime o plano do agendador sem executar lanes.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Lista exata de lanes separada por vírgulas; pula o smoke de limpeza para que agents possam reproduzir uma lane com falha. |

Uma lane mais pesada que seu limite efetivo ainda pode iniciar a partir de um pool vazio, então executa sozinha até liberar capacidade. O agregado local pré-verifica o Docker, remove contêineres E2E antigos do OpenClaw, emite status de lanes ativas, persiste tempos de lanes para ordenação pelas mais longas primeiro e para de agendar novas lanes em pool após a primeira falha por padrão.

### Fluxo de trabalho live/E2E reutilizável

O fluxo de trabalho live/E2E reutilizável pergunta a `scripts/test-docker-all.mjs --plan-json` qual cobertura de pacote, tipo de imagem, imagem live, lane e credenciais é necessária. `scripts/docker-e2e.mjs` então converte esse plano em saídas e resumos do GitHub. Ele empacota o OpenClaw por meio de `scripts/package-openclaw-for-docker.mjs`, baixa um artefato de pacote da execução atual ou baixa um artefato de pacote de `package_artifact_run_id`; valida o inventário do tarball; cria e envia imagens E2E Docker GHCR básicas/funcionais marcadas pelo digest do pacote por meio do cache de camada Docker da Blacksmith quando o plano precisa de lanes com pacote instalado; e reutiliza entradas fornecidas de `docker_e2e_bare_image`/`docker_e2e_functional_image` ou imagens existentes por digest de pacote em vez de recriar. Puxadas de imagem Docker são repetidas com um tempo limite limitado de 180 segundos por tentativa para que um fluxo travado de registro/cache tente novamente rapidamente em vez de consumir a maior parte do caminho crítico da CI.

### Partes do caminho de release

A cobertura de Docker de release executa jobs menores em partes com `OPENCLAW_SKIP_DOCKER_BUILD=1`, para que cada parte puxe apenas o tipo de imagem de que precisa e execute várias lanes pelo mesmo agendador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

As partes atuais de Docker de release são `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` e `plugins-runtime-install-a` até `plugins-runtime-install-h`. `package-update-openai` inclui a lane live do pacote do Plugin Codex, que instala o pacote candidato do OpenClaw, instala o Plugin Codex a partir de `codex_plugin_spec` ou de um tarball da mesma referência com aprovação explícita de instalação da CLI do Codex, executa a pré-verificação da CLI do Codex e então executa várias interações de agent do OpenClaw na mesma sessão contra a OpenAI. `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` continuam sendo aliases agregados de Plugin/runtime. O alias de lane `install-e2e` continua sendo o alias agregado de reexecução manual para ambas as lanes de instalador de provider.

OpenWebUI é incorporado a `plugins-runtime-services` quando a cobertura completa de release-path o solicita, e mantém uma parte independente `openwebui` apenas para acionamentos somente de OpenWebUI. Lanes de atualização de canais empacotados tentam novamente uma vez para falhas transitórias de rede npm.

Cada parte envia `.artifacts/docker-tests/` com logs de lanes, tempos, `summary.json`, `failures.json`, tempos de fases, JSON do plano do agendador, tabelas de lanes lentas e comandos de reexecução por lane. A entrada `docker_lanes` do fluxo de trabalho executa lanes selecionadas contra as imagens preparadas em vez dos jobs de partes, o que mantém a depuração de lane com falha limitada a um job Docker direcionado e prepara, baixa ou reutiliza o artefato de pacote para essa execução; se uma lane selecionada for uma lane live de Docker, o job direcionado cria a imagem de teste live localmente para essa reexecução. Comandos gerados de reexecução do GitHub por lane incluem `package_artifact_run_id`, `package_artifact_name` e entradas de imagens preparadas quando esses valores existem, para que uma lane com falha possa reutilizar o pacote e as imagens exatos da execução com falha.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

O fluxo de trabalho live/E2E agendado executa diariamente a suíte completa de Docker de release-path.

## Pré-release de Plugin

`Plugin Prerelease` é uma cobertura de produto/pacote mais cara, então é um fluxo de trabalho separado acionado por `Full Release Validation` ou por um operador explícito. Solicitações de pull normais, envios para `main` e acionamentos manuais independentes de CI mantêm essa suíte desligada. Ele balanceia testes de Plugins empacotados entre oito workers de extensão; esses jobs de shards de extensão executam até dois grupos de configuração de Plugin por vez, com um worker do Vitest por grupo e um heap maior do Node para que lotes de Plugins com muitas importações não criem jobs extras de CI. O caminho de pré-release de Docker exclusivo de release agrupa lanes de Docker direcionadas em pequenos grupos para evitar reservar dezenas de runners para jobs de um a três minutos. O fluxo de trabalho também envia um artefato informativo `plugin-inspector-advisory` de `@openclaw/plugin-inspector`; achados do inspetor são entrada de triagem e não alteram o gate bloqueante de Plugin Prerelease.

## QA Lab

O QA Lab tem lanes dedicadas de CI fora do fluxo de trabalho principal com escopo inteligente. A paridade agêntica fica aninhada sob os harnesses amplos de QA e release, não como um fluxo de trabalho independente de PR. Use `Full Release Validation` com `rerun_group=qa-parity` quando a paridade deve acompanhar uma execução ampla de validação.

- O fluxo de trabalho `QA-Lab - All Lanes` executa todas as noites em `main` e em acionamento manual; ele expande a lane de paridade mock, a lane live Matrix e as lanes live Telegram e Discord como jobs paralelos. Jobs live usam o ambiente `qa-live-shared`, e Telegram/Discord usam leases Convex.

Verificações de release executam lanes de transporte live Matrix e Telegram com o provider mock determinístico e modelos qualificados por mock (`mock-openai/gpt-5.5` e `mock-openai/gpt-5.5-alt`), para que o contrato de canal fique isolado da latência de modelo live e da inicialização normal de Plugin de provider. O Gateway de transporte live desativa busca de memória porque a paridade de QA cobre comportamento de memória separadamente; conectividade de provider é coberta pelas suítes separadas de modelo live, provider nativo e provider Docker.

Matrix usa `--profile fast` para gates agendados e de release, adicionando `--fail-fast` apenas quando a CLI em checkout dá suporte a isso. O padrão da CLI e a entrada manual do fluxo de trabalho continuam sendo `all`; acionamento manual com `matrix_profile=all` sempre divide a cobertura completa do Matrix em jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`.

`OpenClaw Release Checks` também executa as lanes críticas de release do QA Lab antes da aprovação de release; seu gate de paridade de QA executa os pacotes candidato e baseline como jobs de lanes paralelos, então baixa ambos os artefatos em um pequeno job de relatório para a comparação final de paridade.

Para PRs normais, siga evidências de CI/verificação escopadas em vez de tratar paridade como um status obrigatório.

## CodeQL

O fluxo de trabalho `CodeQL` é intencionalmente um scanner de segurança estreito de primeira passagem, não a varredura completa do repositório. Execuções diárias, manuais e de guarda de solicitações de pull que não sejam rascunho analisam código de fluxos de trabalho do Actions mais as superfícies JavaScript/TypeScript de maior risco com consultas de segurança de alta confiança filtradas para `security-severity` alta/crítica.

A guarda de solicitação de pull permanece leve: ela só começa para alterações em `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` ou `src`, e executa a mesma matriz de segurança de alta confiança que o fluxo de trabalho agendado. CodeQL de Android e macOS ficam fora dos padrões de PR.

### Categorias de segurança

| Categoria                                         | Superfície                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, segredos, sandbox, cron e linha de base do gateway                                                                            |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementação do canal principal, além do runtime do Plugin de canal, gateway, Plugin SDK, segredos e pontos de auditoria |
| `/codeql-security-high/network-ssrf-boundary`     | Superfícies principais de SSRF, análise de IP, proteção de rede, web-fetch e política de SSRF do Plugin SDK                         |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, auxiliares de execução de processo, entrega de saída e gates de execução de ferramentas do agente                   |
| `/codeql-security-high/plugin-trust-boundary`     | Superfícies de confiança de instalação de Plugin, loader, manifesto, registro, instalação pelo gerenciador de pacotes, carregamento de código-fonte e contrato de pacote do Plugin SDK |

### Fragmentos de segurança específicos de plataforma

- `CodeQL Android Critical Security` — fragmento agendado de segurança do Android. Compila o app Android manualmente para CodeQL no menor runner Blacksmith Linux aceito pela sanidade do fluxo de trabalho. Envia para `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — fragmento semanal/manual de segurança do macOS. Compila o app macOS manualmente para CodeQL no Blacksmith macOS, filtra resultados de build de dependências fora do SARIF enviado e envia para `/codeql-critical-security/macos`. Mantido fora dos padrões diários porque o build do macOS domina o tempo de execução mesmo quando está limpo.

### Categorias de Qualidade Crítica

`CodeQL Critical Quality` é o fragmento correspondente sem foco em segurança. Ele executa apenas consultas de qualidade JavaScript/TypeScript sem segurança e com severidade de erro sobre superfícies estreitas de alto valor em runners Linux hospedados no GitHub, para que as varreduras de qualidade não gastem o orçamento de registro de runners Blacksmith. Sua proteção de pull request é intencionalmente menor que o perfil agendado: PRs que não são rascunho executam apenas os fragmentos correspondentes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` e `plugin-sdk-reply-runtime` para alterações em código de execução de comandos/modelos/ferramentas do agente e despacho de respostas, código de schema/migração/IO de configuração, código de auth/segredos/sandbox/segurança, canal principal e runtime de Plugin de canal empacotado, protocolo do gateway/método de servidor, runtime de memória/cola do SDK, MCP/processo/entrega de saída, catálogo de runtime/modelo do provedor, diagnósticos de sessão/filas de entrega, loader de Plugin, Plugin SDK/contrato de pacote ou runtime de resposta do Plugin SDK. Alterações na configuração do CodeQL e no fluxo de trabalho de qualidade executam todos os doze fragmentos de qualidade de PR.

O despacho manual aceita:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Os perfis estreitos são ganchos de ensino/iteração para executar um fragmento de qualidade isoladamente.

| Categoria                                               | Superfície                                                                                                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-critical-quality/core-auth-secrets`            | Código de limite de segurança de auth, segredos, sandbox, cron e gateway                                                                                           |
| `/codeql-critical-quality/config-boundary`              | Contratos de schema de configuração, migração, normalização e IO                                                                                                   |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schemas de protocolo do Gateway e contratos de métodos de servidor                                                                                                 |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementação do canal principal e do Plugin de canal empacotado                                                                                      |
| `/codeql-critical-quality/agent-runtime-boundary`       | Contratos de runtime de execução de comandos, despacho de modelo/provedor, despacho e filas de resposta automática e plano de controle ACP                          |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP e pontes de ferramentas, auxiliares de supervisão de processo e contratos de entrega de saída                                                       |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK do host de memória, facades de runtime de memória, aliases de memória do Plugin SDK, cola de ativação do runtime de memória e comandos doctor de memória       |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internos da fila de resposta, filas de entrega de sessão, auxiliares de vinculação/entrega de sessão de saída, superfícies de evento diagnóstico/pacote de logs e contratos da CLI doctor de sessão |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de resposta de entrada do Plugin SDK, auxiliares de payload/fragmentação/runtime de resposta, opções de resposta de canal, filas de entrega e auxiliares de vinculação de sessão/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalização de catálogo de modelos, auth e descoberta de provedor, registro de runtime de provedor, padrões/catálogos de provedor e registros de web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap da Control UI, persistência local, fluxos de controle do gateway e contratos de runtime do plano de controle de tarefas                                  |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratos de runtime de fetch/search web principal, IO de mídia, compreensão de mídia, geração de imagens e geração de mídia                                       |
| `/codeql-critical-quality/plugin-boundary`              | Contratos de loader, registro, superfície pública e ponto de entrada do Plugin SDK                                                                                 |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Código-fonte publicado do Plugin SDK no lado do pacote e auxiliares de contrato de pacote de Plugin                                                               |

Qualidade fica separada de segurança para que achados de qualidade possam ser agendados, medidos, desativados ou expandidos sem obscurecer o sinal de segurança. A expansão de CodeQL para Swift, Python e Plugins empacotados deve ser adicionada de volta como trabalho de acompanhamento escopado ou fragmentado somente depois que os perfis estreitos tiverem runtime e sinal estáveis.

## Fluxos de trabalho de manutenção

### Agente de Docs

O fluxo de trabalho `Docs Agent` é uma trilha de manutenção Codex orientada a eventos para manter a documentação existente alinhada com alterações recém-integradas. Ele não tem agendamento puro: uma execução bem-sucedida de CI de push não bot em `main` pode acioná-lo, e o despacho manual pode executá-lo diretamente. Invocações por workflow-run são ignoradas quando `main` avançou ou quando outra execução não ignorada do Docs Agent foi criada na última hora. Quando ele roda, revisa o intervalo de commits do SHA de origem do Docs Agent não ignorado anterior até o `main` atual, então uma execução horária pode cobrir todas as alterações em main acumuladas desde a última passagem de docs.

### Agente de Performance de Testes

O fluxo de trabalho `Test Performance Agent` é uma trilha de manutenção Codex orientada a eventos para testes lentos. Ele não tem agendamento puro: uma execução bem-sucedida de CI de push não bot em `main` pode acioná-lo, mas ele é ignorado se outra invocação por workflow-run já executou ou está executando naquele dia UTC. O despacho manual contorna esse gate de atividade diária. A trilha cria um relatório de performance Vitest agrupado da suíte completa, permite que o Codex faça apenas pequenas correções de performance de testes preservando cobertura em vez de refatorações amplas, depois reexecuta o relatório da suíte completa e rejeita alterações que reduzam a contagem de testes aprovados da linha de base. O relatório agrupado registra tempo de parede por configuração e RSS máximo no Linux e no macOS, então a comparação antes/depois expõe deltas de memória de teste ao lado dos deltas de duração. Se a linha de base tiver testes falhando, o Codex pode corrigir apenas falhas óbvias, e o relatório da suíte completa pós-agente deve passar antes que qualquer coisa seja commitada. Quando `main` avança antes do push do bot ser integrado, a trilha faz rebase do patch validado, reexecuta `pnpm check:changed` e tenta o push novamente; patches obsoletos com conflito são ignorados. Ela usa Ubuntu hospedado no GitHub para que a ação Codex possa manter a mesma postura de segurança sem sudo do agente de docs.

### PRs duplicados após merge

O fluxo de trabalho `Duplicate PRs After Merge` é um fluxo de trabalho manual de mantenedor para limpeza de duplicatas pós-integração. Ele usa dry-run por padrão e só fecha PRs explicitamente listados quando `apply=true`. Antes de modificar o GitHub, verifica que o PR integrado recebeu merge e que cada duplicata tem uma issue referenciada compartilhada ou hunks alterados sobrepostos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gates de verificação local e roteamento de alterações

A lógica local de trilhas alteradas vive em `scripts/changed-lanes.mjs` e é executada por `scripts/check-changed.mjs`. Esse gate de verificação local é mais rígido sobre limites de arquitetura do que o escopo amplo da plataforma de CI:

- alterações de produção no core executam typecheck de produção e de teste do core, além de lint/guards do core;
- alterações somente de teste no core executam apenas typecheck de teste do core, além de lint do core;
- alterações de produção em extensão executam typecheck de produção e de teste da extensão, além de lint da extensão;
- alterações somente de teste em extensão executam typecheck de teste da extensão, além de lint da extensão;
- alterações no Plugin SDK público ou em contratos de Plugin expandem para typecheck de extensão porque extensões dependem desses contratos do core (varreduras Vitest de extensão continuam sendo trabalho de teste explícito);
- incrementos de versão somente de metadados de release executam verificações direcionadas de versão/configuração/dependência raiz;
- alterações desconhecidas em raiz/configuração falham de forma segura para todas as trilhas de verificação.

O roteamento local de testes alterados vive em `scripts/test-projects.test-support.mjs` e é intencionalmente mais barato que `check:changed`: edições diretas em testes executam os próprios testes, edições de código-fonte preferem mapeamentos explícitos, depois testes irmãos e dependentes do grafo de imports. A configuração compartilhada de entrega em sala de grupo é um dos mapeamentos explícitos: alterações na configuração de resposta visível ao grupo, no modo de entrega de resposta de origem ou no prompt de sistema da ferramenta de mensagem passam pelos testes principais de resposta, além de regressões de entrega do Discord e Slack, para que uma alteração compartilhada de padrão falhe antes do primeiro push do PR. Use `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` somente quando a alteração for ampla o suficiente no harness para que o conjunto mapeado barato não seja um proxy confiável.

## Validação do Testbox

Crabbox é o wrapper de caixa remota pertencente ao repositório para prova Linux de mantenedor. Use-o
a partir da raiz do repositório quando uma verificação for ampla demais para um loop de edição local, quando a paridade com CI
importar, ou quando a prova precisar de segredos, Docker, trilhas de pacote,
caixas reutilizáveis ou logs remotos. O backend normal do OpenClaw é
`blacksmith-testbox`; a capacidade própria AWS/Hetzner é um fallback para interrupções do Blacksmith,
problemas de cota ou testes explícitos com capacidade própria.

Execuções Blacksmith com suporte do Crabbox aquecem, reivindicam, sincronizam, executam, relatam e limpam
Testboxes avulsos. A verificação de sanidade de sincronização integrada falha rapidamente quando arquivos
raiz obrigatórios como `pnpm-lock.yaml` desaparecem ou quando `git status --short`
mostra pelo menos 200 exclusões rastreadas. Para PRs intencionais com grandes exclusões, defina
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para o comando remoto.

O Crabbox também encerra uma invocação local da CLI do Blacksmith que permanece na
fase de sincronização por mais de cinco minutos sem saída pós-sincronização. Defina
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` para desativar essa proteção, ou use um valor maior
em milissegundos para diffs locais excepcionalmente grandes.

Antes de uma primeira execução, verifique o wrapper a partir da raiz do repositório:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

O wrapper do repositório recusa um binário Crabbox obsoleto que não anuncia `blacksmith-testbox`. Passe o provedor explicitamente, mesmo que `.crabbox.yaml` tenha padrões de nuvem própria. Em worktrees do Codex ou checkouts vinculados/esparsos, evite o script local `pnpm crabbox:run` porque o pnpm pode reconciliar dependências antes que o Crabbox inicie; invoque o wrapper node diretamente em vez disso:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Execuções com suporte do Blacksmith exigem Crabbox 0.22.0 ou mais recente para que o wrapper obtenha o comportamento atual de sincronização, fila e limpeza do Testbox. Ao usar o checkout irmão, recompile o binário local ignorado antes de trabalho de temporização ou prova:

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
resultado do comando. A execução vinculada do GitHub Actions é responsável pela hidratação e pelo keepalive; ela
pode terminar como `cancelled` quando o Testbox é interrompido externamente depois que o comando SSH
já retornou. Trate isso como um artefato de limpeza/status, a menos que
o `exitCode` do wrapper seja diferente de zero ou a saída do comando mostre um teste com falha.
Execuções avulsas do Crabbox com suporte do Blacksmith devem interromper o Testbox automaticamente;
se uma execução for interrompida ou a limpeza não estiver clara, inspecione as caixas ativas e pare apenas
as caixas que você criou:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Use reutilização somente quando você intencionalmente precisar de vários comandos na mesma caixa hidratada:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Se o Crabbox for a camada quebrada, mas o próprio Blacksmith funcionar, use o
Blacksmith direto apenas para diagnósticos como `list`, `status` e limpeza. Corrija o
caminho do Crabbox antes de tratar uma execução direta do Blacksmith como prova de mantenedor.

Se `blacksmith testbox list --all` e `blacksmith testbox status` funcionarem, mas novos
aquecimentos ficarem `queued` sem IP ou URL de execução do Actions depois de alguns minutos,
trate isso como pressão do provedor Blacksmith, fila, cobrança ou limite da organização. Interrompa os
ids em fila que você criou, evite iniciar mais Testboxes e mova a prova para o
caminho de capacidade Crabbox própria abaixo enquanto alguém verifica o painel do Blacksmith,
a cobrança e os limites da organização.

Escale para capacidade Crabbox própria somente quando o Blacksmith estiver fora do ar, limitado por cota, sem o ambiente necessário, ou quando capacidade própria for explicitamente o objetivo:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Sob pressão da AWS, evite `class=beast` a menos que a tarefa realmente precise de CPU de classe 48xlarge. Uma solicitação `beast` começa em 192 vCPUs e é a maneira mais fácil de acionar a cota regional EC2 Spot ou On-Demand Standard. O `.crabbox.yaml` pertencente ao repositório usa por padrão `standard`, várias regiões de capacidade e `capacity.hints: true`, para que concessões AWS mediadas imprimam região/mercado selecionados, pressão de cota, fallback de Spot e avisos de classe de alta pressão. Use `fast` para verificações amplas mais pesadas, `large` somente depois que standard/fast não forem suficientes, e `beast` somente para lanes excepcionais limitadas por CPU, como suíte completa ou matrizes Docker de todos os Plugins, validação explícita de release/bloqueador ou profiling de desempenho com muitos núcleos. Não use `beast` para `pnpm check:changed`, testes focados, trabalho somente de docs, lint/typecheck comum, pequenas reproduções E2E ou triagem de indisponibilidade do Blacksmith. Use `--market on-demand` para diagnóstico de capacidade, para que a rotatividade do mercado Spot não se misture ao sinal.

`.crabbox.yaml` define padrões de provedor, sincronização e hidratação do GitHub Actions para lanes de nuvem própria. Ele exclui o `.git` local para que o checkout hidratado do Actions mantenha seus próprios metadados Git remotos em vez de sincronizar remotos e armazenamentos de objetos locais de mantenedores, e exclui artefatos locais de runtime/build que nunca devem ser transferidos. `.github/workflows/crabbox-hydrate.yml` define checkout, configuração de Node/pnpm, fetch de `origin/main` e o repasse de ambiente sem segredos para comandos de nuvem própria `crabbox run --id <cbx_id>`.

## Relacionados

- [Visão geral da instalação](/pt-BR/install)
- [Canais de desenvolvimento](/pt-BR/install/development-channels)
