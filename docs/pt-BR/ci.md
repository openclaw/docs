---
read_when:
    - Você precisa entender por que um job de CI foi ou não executado
    - Você está depurando uma verificação do GitHub Actions com falha
    - Você está coordenando uma execução ou reexecução de validação de lançamento
    - Você está alterando o despacho do ClawSweeper ou o encaminhamento de atividades do GitHub
summary: Grafo de jobs de CI, gates de escopo, guarda-chuvas de release e equivalentes de comandos locais
title: Pipeline de CI
x-i18n:
    generated_at: "2026-07-04T06:24:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e97c378598fadcbaef12e5f9abd1d99261dd4594ce88ce4aa3293af0744fc5a
    source_path: ci.md
    workflow: 16
---

A CI do OpenClaw é executada em cada push para `main` e em cada pull request. Pushes
canônicos para `main` passam primeiro por uma janela de admissão de 90 segundos
em runner hospedado. O grupo de concorrência `CI` existente cancela essa execução
em espera quando um commit mais novo chega, então merges sequenciais não registram
cada um uma matriz completa do Blacksmith. Pull requests e despachos manuais pulam
a espera. O job `preflight` então classifica o diff e desativa trilhas caras
quando apenas áreas não relacionadas foram alteradas. Execuções manuais por
`workflow_dispatch` intencionalmente ignoram o escopo inteligente e expandem o
grafo completo para candidatos a lançamento e validação ampla. As trilhas Android
permanecem opcionais por meio de `include_android`. A cobertura de Plugin apenas
para lançamentos fica no workflow separado [`Pré-lançamento de Plugin`](#plugin-prerelease)
e só é executada a partir de [`Validação Completa de Lançamento`](#full-release-validation)
ou de um despacho manual explícito.

## Visão geral do pipeline

| Job                                | Finalidade                                                                                                | Quando é executado                                  |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Detectar alterações apenas em docs, escopos alterados, extensões alteradas e criar o manifesto da CI      | Sempre em pushes e PRs que não sejam rascunho       |
| `runner-admission`                 | Debounce hospedado de 90 segundos para pushes canônicos em `main` antes que o trabalho do Blacksmith seja registrado | Em toda execução de CI; espera apenas em pushes canônicos para `main` |
| `security-fast`                    | Detecção de chave privada, auditoria de workflow alterado via `zizmor` e auditoria de lockfile de produção | Sempre em pushes e PRs que não sejam rascunho       |
| `check-dependencies`               | Passagem do Knip apenas para dependências de produção, mais a guarda de lista permitida de arquivos não usados | Alterações relevantes para Node                     |
| `build-artifacts`                  | Criar `dist/`, Control UI, verificações de fumaça da CLI compilada, verificações de artefatos compilados embutidos e artefatos reutilizáveis | Alterações relevantes para Node                     |
| `checks-fast-core`                 | Trilhas rápidas de correção no Linux, como bundled, protocol, QA Smoke CI e verificações de roteamento de CI | Alterações relevantes para Node                     |
| `checks-fast-contracts-plugins-*`  | Duas verificações fragmentadas de contrato de Plugin                                                      | Alterações relevantes para Node                     |
| `checks-fast-contracts-channels-*` | Duas verificações fragmentadas de contrato de canal                                                       | Alterações relevantes para Node                     |
| `checks-node-core-*`               | Shards de teste do Node central, excluindo trilhas de canal, bundled, contrato e extensão                 | Alterações relevantes para Node                     |
| `check-*`                          | Equivalente fragmentado do gate local principal: tipos de produção, lint, guardas, tipos de teste e fumaça estrita | Alterações relevantes para Node                     |
| `check-additional-*`               | Arquitetura, drift de boundary/prompt fragmentado, guardas de extensão, boundary de pacote e topologia de runtime | Alterações relevantes para Node                     |
| `checks-node-compat-node22`        | Build de compatibilidade com Node 22 e trilha de fumaça                                                   | Despacho manual de CI para lançamentos              |
| `check-docs`                       | Formatação de docs, lint e verificações de links quebrados                                                | Docs alterados                                      |
| `skills-python`                    | Ruff + pytest para Skills baseadas em Python                                                              | Alterações relevantes para Skills Python            |
| `checks-windows`                   | Testes específicos do Windows para processo/caminho, mais regressões compartilhadas de especificadores de importação de runtime | Alterações relevantes para Windows                  |
| `macos-node`                       | Trilha de teste TypeScript no macOS usando os artefatos compilados compartilhados                         | Alterações relevantes para macOS                    |
| `macos-swift`                      | Lint, build e testes Swift para o app macOS                                                               | Alterações relevantes para macOS                    |
| `ios-build`                        | Geração de projeto Xcode mais build do app iOS no simulador                                               | App iOS, kit de app compartilhado ou alterações no Swabble |
| `android`                          | Testes unitários Android para ambos os flavors mais um build de APK debug                                 | Alterações relevantes para Android                  |
| `test-performance-agent`           | Otimização diária de testes lentos do Codex após atividade confiável                                      | Sucesso da CI principal ou despacho manual          |
| `openclaw-performance`             | Relatórios diários/sob demanda de performance do runtime Kova com provedor simulado, perfil profundo e trilhas ao vivo do GPT 5.5 | Agendado e despacho manual                          |

## Ordem de falha rápida

1. `runner-admission` espera apenas por pushes canônicos para `main`; um push mais novo cancela a execução antes do registro no Blacksmith.
2. `preflight` decide quais trilhas existem. As lógicas `docs-scope` e `changed-scope` são etapas dentro deste job, não jobs autônomos.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` e `skills-python` falham rapidamente sem esperar pelos jobs mais pesados de artefatos e matriz de plataformas.
4. `build-artifacts` se sobrepõe às trilhas rápidas de Linux para que consumidores downstream possam começar assim que o build compartilhado estiver pronto.
5. Trilhas mais pesadas de plataforma e runtime se expandem depois disso: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` e `android`.

O GitHub pode marcar jobs substituídos como `cancelled` quando um push mais novo chega ao mesmo PR ou ref `main`. Trate isso como ruído de CI, a menos que a execução mais nova para o mesmo ref também esteja falhando. Jobs de matriz usam `fail-fast: false`, e `build-artifacts` relata falhas embutidas de channel, core-support-boundary e gateway-watch diretamente, em vez de enfileirar jobs verificadores pequenos. A chave automática de concorrência da CI é versionada (`CI-v7-*`) para que um zumbi do lado do GitHub em um grupo antigo de fila não possa bloquear indefinidamente execuções mais novas da main. Execuções manuais da suíte completa usam `CI-manual-v1-*` e não cancelam execuções em andamento.

Use `pnpm ci:timings`, `pnpm ci:timings:recent` ou `node scripts/ci-run-timings.mjs <run-id>` para resumir tempo de parede, tempo de fila, jobs mais lentos, falhas e a barreira de fanout `pnpm-store-warmup` do GitHub Actions. A CI também envia o mesmo resumo de execução como um artefato `ci-timings-summary`. Para temporização de build, verifique a etapa `Build dist` do job `build-artifacts`: `pnpm build:ci-artifacts` imprime `[build-all] phase timings:` e inclui `ui:build`; o job também envia o artefato `startup-memory`.

Para execuções de pull request, o job terminal de resumo de temporização executa o helper a partir da revisão base confiável antes de passar `GH_TOKEN` para `gh run view`. Isso mantém a consulta com token fora do código controlado pela branch, enquanto ainda resume a execução atual da CI do pull request.

## Contexto e evidência de PR

PRs de colaboradores externos executam um gate de contexto e evidência de PR a partir de
`.github/workflows/real-behavior-proof.yml`. O workflow faz checkout do commit base
confiável e avalia apenas o corpo do PR; ele não executa código da branch do
colaborador.

O gate se aplica a autores de PR que não são proprietários, membros,
colaboradores nem bots do repositório. Ele passa quando o corpo do PR contém seções
autoriais `What Problem This Solves` e `Evidence`. A evidência pode ser um teste
focado, resultado de CI, captura de tela, gravação, saída de terminal, observação
ao vivo, log redigido ou link de artefato. O corpo fornece intenção e validação útil;
revisores inspecionam o código, os testes e a CI para avaliar a correção.

Quando a verificação falhar, atualize o corpo do PR em vez de enviar outro commit de código.

## Escopo e roteamento

A lógica de escopo fica em `scripts/ci-changed-scope.mjs` e é coberta por testes unitários em `src/scripts/ci-changed-scope.test.ts`. O despacho manual pula a detecção de escopo alterado e faz o manifesto de preflight agir como se todas as áreas escopadas tivessem sido alteradas.

- **Edições de workflow de CI** validam o grafo de CI do Node mais lint de workflow, mas não forçam builds nativos de Windows, iOS, Android ou macOS por si só; essas trilhas de plataforma permanecem escopadas a alterações de código-fonte de plataforma.
- **Sanidade de Workflow** executa `actionlint`, `zizmor` em todos os arquivos YAML de workflow, a guarda de interpolação de ação composta e a guarda de marcadores de conflito. O job `security-fast` escopado ao PR também executa `zizmor` em arquivos de workflow alterados para que achados de segurança de workflow falhem cedo no grafo principal da CI.
- **Docs em pushes para `main`** são verificadas pelo workflow autônomo `Docs` com o mesmo espelho de docs do ClawHub usado pela CI, então pushes mistos de código+docs não enfileiram também o shard `check-docs` da CI. Pull requests e CI manual ainda executam `check-docs` a partir da CI quando docs mudaram.
- **TUI PTY** é executado no shard Linux Node `checks-node-core-runtime-tui-pty` para alterações de TUI. O shard executa `test/vitest/vitest.tui-pty.config.ts` com `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, então cobre tanto a trilha determinística de fixture `TuiBackend` quanto a fumaça mais lenta `tui --local`, que simula apenas o endpoint externo do modelo.
- **Edições apenas de roteamento de CI, edições selecionadas baratas de fixtures de teste central e edições estreitas de helper/roteamento de teste de contrato de Plugin** usam um caminho rápido de manifesto apenas Node: `preflight`, segurança e uma única tarefa `checks-fast-core`. Esse caminho pula artefatos de build, compatibilidade com Node 22, contratos de canal, shards centrais completos, shards de Plugin bundled e matrizes adicionais de guardas quando a alteração é limitada às superfícies de roteamento ou helper que a tarefa rápida exercita diretamente.
- **Verificações Windows Node** são escopadas para wrappers específicos de processo/caminho do Windows, helpers de runner npm/pnpm/UI, configuração de gerenciador de pacotes e as superfícies de workflow de CI que executam essa trilha; alterações não relacionadas de código-fonte, Plugin, fumaça de instalação e apenas testes permanecem nas trilhas Linux Node.

As famílias de testes Node mais lentas são divididas ou balanceadas para que cada job permaneça pequeno sem reservar executores em excesso: contratos de Plugin e contratos de canal rodam cada um como dois shards ponderados com suporte do Blacksmith e fallback padrão para o executor do GitHub, as faixas rápidas/de suporte de unidade do core rodam separadamente, a infraestrutura de runtime do core é dividida entre estado, processo/configuração, compartilhado e três shards de domínio Cron, auto-reply roda como workers balanceados (com a subárvore de resposta dividida em shards de agent-runner, dispatch e commands/state-routing), e as configurações agentic de gateway/server são divididas entre faixas chat/auth/model/http-plugin/runtime/startup em vez de aguardarem artefatos compilados. A CI normal então empacota apenas shards isolados de padrões de inclusão de infraestrutura em pacotes determinísticos de no máximo 64 arquivos de teste, reduzindo a matriz Node sem mesclar suítes não isoladas de comando/cron, agents-core com estado ou gateway/server; suítes fixas pesadas permanecem em 8 vCPU, enquanto as faixas empacotadas e de menor peso usam 4 vCPU. Pull requests no repositório canônico usam um plano compacto adicional de admissão: os mesmos grupos por configuração rodam em subprocessos isolados dentro do plano Linux Node atual de 34 jobs, para que um único PR não registre a matriz Node completa de mais de 70 jobs. Pushes para `main`, dispatches manuais e gates de release mantêm a matriz completa. Testes amplos de navegador, QA, mídia e Plugins diversos usam suas configurações Vitest dedicadas em vez do catch-all compartilhado de Plugins. Shards de padrões de inclusão registram entradas de tempo usando o nome do shard de CI, para que `.artifacts/vitest-shard-timings.json` consiga distinguir uma configuração inteira de um shard filtrado. `check-additional-*` mantém juntos os trabalhos de compilação/canário de fronteira de pacotes e separa a arquitetura de topologia de runtime da cobertura de observação do Gateway; a lista de guardas de fronteira é distribuída em um shard pesado em prompts e um shard combinado para as faixas de guardas restantes, cada um executando guardas independentes selecionados em paralelo e imprimindo tempos por verificação. A verificação cara de drift do snapshot de prompt do caminho feliz do Codex roda como seu próprio job adicional apenas para CI manual e mudanças que afetam prompts, para que mudanças Node normais e não relacionadas não esperem pela geração fria de snapshots de prompt e os shards de fronteira permaneçam balanceados enquanto o drift de prompt ainda fica vinculado ao PR que o causou; a mesma flag pula a geração Vitest de snapshots de prompt dentro do shard de fronteira de suporte do core com artefatos compilados. A observação do Gateway, os testes de canal e o shard de fronteira de suporte do core rodam em paralelo dentro de `build-artifacts` depois que `dist/` e `dist-runtime/` já foram compilados.

Depois de admitida, a CI Linux canônica permite até 24 jobs de teste Node simultâneos e
12 para as faixas menores de fast/check; Windows e Android permanecem em dois porque
esses pools de executores são mais estreitos.

O plano compacto de PR emite 18 jobs Node para a suíte atual: grupos de configuração inteira
são agrupados em subprocessos isolados com timeout de lote de 120 minutos,
enquanto grupos de padrões de inclusão compartilham o mesmo orçamento limitado de jobs.

A CI Android roda tanto `testPlayDebugUnitTest` quanto `testThirdPartyDebugUnitTest` e depois compila o APK debug Play. O flavor de terceiros não tem source set ou manifesto separado; sua faixa de testes unitários ainda compila o flavor com as flags BuildConfig de SMS/call-log, evitando ao mesmo tempo um job duplicado de empacotamento de APK debug em todo push relevante para Android.

O shard `check-dependencies` roda `pnpm deadcode:dependencies` (uma passagem Knip de produção apenas para dependências, fixada na versão mais recente do Knip, com a idade mínima de release do pnpm desativada para a instalação `dlx`) e `pnpm deadcode:unused-files`, que compara os achados de arquivos de produção não usados do Knip com `scripts/deadcode-unused-files.allowlist.mjs`. O guard de arquivos não usados falha quando um PR adiciona um novo arquivo não usado e não revisado ou deixa uma entrada obsoleta na allowlist, preservando ao mesmo tempo superfícies intencionais de Plugins dinâmicos, geradas, de build, de testes live e de ponte de pacote que o Knip não consegue resolver estaticamente.

## Encaminhamento de atividade do ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` é a ponte do lado de destino entre a atividade do repositório OpenClaw e o ClawSweeper. Ele não faz checkout nem executa código não confiável de pull requests. O workflow cria um token de GitHub App a partir de `CLAWSWEEPER_APP_PRIVATE_KEY` e então dispara payloads compactos de `repository_dispatch` para `openclaw/clawsweeper`.

O workflow tem quatro faixas:

- `clawsweeper_item` para solicitações exatas de revisão de issue e pull request;
- `clawsweeper_comment` para comandos explícitos do ClawSweeper em comentários de issues;
- `clawsweeper_commit_review` para solicitações de revisão em nível de commit em pushes para `main`;
- `github_activity` para atividade geral do GitHub que o agente ClawSweeper pode inspecionar.

A faixa `github_activity` encaminha apenas metadados normalizados: tipo de evento, ação, ator, repositório, número do item, URL, título, estado e trechos curtos de comentários ou revisões quando presentes. Ela evita intencionalmente encaminhar o corpo completo do Webhook. O workflow receptor em `openclaw/clawsweeper` é `.github/workflows/github-activity.yml`, que publica o evento normalizado no hook do OpenClaw Gateway para o agente ClawSweeper.

Atividade geral é observação, não entrega por padrão. O agente ClawSweeper recebe o destino do Discord em seu prompt e deve publicar em `#clawsweeper` apenas quando o evento for surpreendente, acionável, arriscado ou operacionalmente útil. Aberturas rotineiras, edições, rotatividade de bots, ruído duplicado de Webhook e tráfego normal de revisão devem resultar em `NO_REPLY`.

Trate títulos, comentários, corpos, texto de revisão, nomes de branches e mensagens de commit do GitHub como dados não confiáveis ao longo de todo este caminho. Eles são entrada para sumarização e triagem, não instruções para o workflow ou o runtime do agente.

## Dispatches manuais

Dispatches manuais de CI rodam o mesmo grafo de jobs da CI normal, mas forçam a ativação de toda faixa com escopo não Android: shards Linux Node, shards de Plugins empacotados, shards de contratos de Plugin e canal, compatibilidade com Node 22, `check-*`, `check-additional-*`, smoke checks de artefatos compilados, verificações de docs, Skills Python, Windows, macOS, build iOS e i18n do Control UI. Dispatches manuais independentes de CI rodam Android apenas com `include_android=true`; o guarda-chuva completo de release habilita Android passando `include_android=true`. Verificações estáticas de pré-release de Plugins, o shard exclusivo de release `agentic-plugins`, a varredura completa em lote de extensões e as faixas Docker de pré-release de Plugins são excluídos da CI. A suíte Docker de pré-release roda apenas quando `Full Release Validation` dispara o workflow separado `Plugin Prerelease` com o gate de validação de release habilitado.

Execuções manuais usam um grupo de concorrência único para que uma suíte completa de release candidate não seja cancelada por outro push ou execução de PR na mesma ref. A entrada opcional `target_ref` permite que um chamador confiável rode esse grafo contra uma branch, tag ou SHA completo de commit usando o arquivo de workflow da ref de dispatch selecionada.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Executores

| Executor                        | Jobs                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | Dispatch manual de CI e fallbacks de repositório não canônico, varreduras de qualidade CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, workflows de docs fora da CI e preflight de install-smoke para que a matriz Blacksmith possa enfileirar mais cedo                                                          |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, shards de extensões de menor peso, `checks-fast-core` exceto QA Smoke CI, shards de contratos de Plugin/canal, a maioria dos shards Linux Node empacotados/de menor peso, `check-guards`, `check-prod-types`, `check-test-types`, shards `check-additional-*` selecionados e `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Suítes Linux Node pesadas mantidas, shards `check-additional-*` pesados em fronteira/extensão e `android`                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI, `build-artifacts` em CI e Testbox, `check-lint` (sensível o suficiente a CPU para que 8 vCPU custassem mais do que economizavam); builds Docker de install-smoke (o tempo de fila de 32 vCPU custava mais do que economizava)                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-15`     | `macos-node` em `openclaw/openclaw`; forks fazem fallback para `macos-15`                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` e `ios-build` em `openclaw/openclaw`; forks fazem fallback para `macos-26`                                                                                                                                                                                                                     |

## Orçamento de registro de executores

O bucket atual de registro de executores do GitHub da OpenClaw reporta 10.000 registros de executores
self-hosted por 5 minutos em `ghx api rate_limit`. Verifique novamente
`actions_runner_registration` antes de cada rodada de ajuste porque o GitHub pode alterar
esse bucket. O limite é compartilhado por todos os registros de executores Blacksmith na
organização `openclaw`, portanto adicionar outra instalação do Blacksmith não adiciona
um novo bucket.

Trate labels Blacksmith como o recurso escasso para controle de rajadas. Jobs que
apenas roteiam, notificam, resumem, selecionam shards ou rodam varreduras curtas do CodeQL devem
permanecer em executores hospedados pelo GitHub, a menos que tenham necessidades específicas do Blacksmith
medidas. Qualquer nova matriz Blacksmith, `max-parallel` maior ou workflow de alta frequência
deve mostrar sua contagem de registros no pior caso e manter a meta em nível da organização
abaixo de cerca de 60% do bucket live. Com o bucket atual de 10.000 registros,
isso significa uma meta operacional de 6.000 registros, deixando folga para
repositórios simultâneos, novas tentativas e sobreposição de rajadas.

A CI do repositório canônico mantém o Blacksmith como o caminho padrão de executor para execuções normais de push e pull request. Execuções `workflow_dispatch` e de repositórios não canônicos usam executores hospedados pelo GitHub, mas execuções canônicas normais atualmente não sondam a saúde da fila do Blacksmith nem fazem fallback automático para labels hospedados pelo GitHub quando o Blacksmith está indisponível.

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

O disparo manual normalmente executa benchmarks da referência do workflow. Defina `target_ref` para executar benchmark de uma tag de release ou de outro branch com a implementação atual do workflow. Os caminhos de relatórios publicados e os ponteiros mais recentes são indexados pela referência testada, e cada `index.md` registra a referência/SHA testada, a referência/SHA do workflow, a referência do Kova, o perfil, o modo de autenticação da lane, o modelo, a contagem de repetições e os filtros de cenário.

O workflow instala o OCM a partir de uma release fixada e o Kova a partir de `openclaw/Kova` no input `kova_ref` fixado, depois executa três lanes:

- `mock-provider`: cenários de diagnóstico do Kova contra um runtime de build local com autenticação falsa determinística compatível com OpenAI.
- `mock-deep-profile`: profiling de CPU/heap/trace para pontos críticos de inicialização, gateway e turnos de agente.
- `live-openai-candidate`: um turno real de agente OpenAI `openai/gpt-5.5`, ignorado quando `OPENAI_API_KEY` não está disponível.

A lane mock-provider também executa sondas de código-fonte nativas do OpenClaw após a passagem do Kova: tempo de boot e memória do Gateway nos casos de inicialização padrão, com hook e com 50 plugins; RSS de importação de plugins integrados, loops repetidos de saudação `channel-chat-baseline` com mock de OpenAI, comandos de inicialização da CLI contra o Gateway iniciado e a sonda de desempenho smoke do estado SQLite. Quando o relatório de origem mock-provider publicado anteriormente está disponível para a referência testada, o resumo de origem compara os valores atuais de RSS e heap com essa baseline e marca grandes aumentos de RSS como `watch`. O resumo em Markdown da sonda de origem fica em `source/index.md` no pacote de relatório, com o JSON bruto ao lado.

Toda lane envia artifacts do GitHub. Quando `CLAWGRIT_REPORTS_TOKEN` está configurado, o workflow também faz commit de `report.json`, `report.md`, pacotes, `index.md` e artifacts de sondas de origem em `openclaw/clawgrit-reports` sob `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. O ponteiro atual da referência testada é escrito como `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validação Completa de Release

`Full Release Validation` é o workflow guarda-chuva manual para "rodar tudo antes da release". Ele aceita um branch, uma tag ou um SHA completo de commit, dispara o workflow manual `CI` com esse alvo, dispara `Plugin Prerelease` para prova de plugin/pacote/estático/Docker exclusiva de release e dispara `OpenClaw Release Checks` para smoke de instalação, aceitação de pacote, verificações de pacote entre sistemas operacionais, renderização do scorecard de maturidade a partir de evidências do perfil de QA, paridade do QA Lab, Matrix e lanes do Telegram. Os perfis estável e completo sempre incluem cobertura exaustiva live/E2E e soak do caminho de release Docker; o perfil beta pode optar por isso com `run_release_soak=true`. O E2E canônico de pacote do Telegram roda dentro de Package Acceptance, então um candidato completo não inicia um poller live duplicado. Depois da publicação, passe `release_package_spec` para reutilizar o pacote npm publicado entre release checks, Package Acceptance, Docker, sistemas operacionais e Telegram sem reconstruir. Use `npm_telegram_package_spec` apenas para uma nova execução focada de Telegram com pacote publicado. A lane de pacote live do plugin Codex usa o mesmo estado selecionado por padrão: `release_package_spec=openclaw@<tag>` publicado deriva `codex_plugin_spec=npm:@openclaw/codex@<tag>`, enquanto execuções por SHA/artifact empacotam `extensions/codex` a partir da referência selecionada. Defina `codex_plugin_spec` explicitamente para fontes de plugin personalizadas, como specs `npm:`, `npm-pack:` ou `git:`.

Consulte [Validação completa de release](/pt-BR/reference/full-release-validation) para a
matriz de estágios, nomes exatos dos jobs do workflow, diferenças de perfil, artifacts e
identificadores de nova execução focada.

`OpenClaw Release Publish` é o workflow manual de release com mutações. Dispare-o
a partir de `release/YYYY.M.PATCH` ou `main` depois que a tag de release existir e depois que o
preflight npm do OpenClaw tiver sido bem-sucedido. Ele verifica `pnpm plugins:sync:check`,
dispara `Plugin NPM Release` para todos os pacotes de plugin publicáveis, dispara
`Plugin ClawHub Release` para o mesmo SHA de release e só então dispara
`OpenClaw NPM Release` com o `preflight_run_id` salvo. A publicação estável também
exige um `windows_node_tag` exato; o workflow verifica a release de origem do Windows
e compara seus instaladores x64/ARM64 com o input
`windows_node_installer_digests` aprovado para o candidato antes de qualquer filho de publicação, depois promove
e verifica esses mesmos digests fixados de instalador mais o contrato exato de asset complementar
e checksum antes de publicar o rascunho da release no GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Para prova de commit fixado em um branch que muda rápido, use o helper em vez de
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

As referências de dispatch de workflows do GitHub devem ser branches ou tags, não SHAs brutos de commit. O
helper envia um branch temporário `release-ci/<sha>-...` no SHA de destino,
dispara `Full Release Validation` a partir dessa referência fixada, verifica se o `headSha` de todo workflow
filho corresponde ao alvo e exclui o branch temporário quando a
execução termina. O verificador guarda-chuva também falha se qualquer workflow filho tiver rodado em um
SHA diferente.

`release_profile` controla a amplitude live/provedor passada para release checks. Os
workflows manuais de release usam `stable` por padrão; use `full` somente quando você
intencionalmente quiser a ampla matriz consultiva de provedores/mídia. Release checks
estáveis e completos sempre executam o soak exaustivo live/E2E e do caminho de release Docker;
o perfil beta pode optar por isso com `run_release_soak=true`.

- `minimum` mantém as lanes críticas de release mais rápidas de OpenAI/core.
- `stable` adiciona o conjunto estável de provedores/backends.
- `full` executa a ampla matriz consultiva de provedores/mídia.

O guarda-chuva registra os ids das execuções filhas disparadas, e o job final `Verify full validation` verifica novamente as conclusões atuais das execuções filhas e anexa tabelas dos jobs mais lentos para cada execução filha. Se um workflow filho for reexecutado e ficar verde, reexecute apenas o job verificador pai para atualizar o resultado do guarda-chuva e o resumo de tempos.

Para recuperação, tanto `Full Release Validation` quanto `OpenClaw Release Checks` aceitam `rerun_group`. Use `all` para um candidato de release, `ci` apenas para o filho normal de CI completo, `plugin-prerelease` apenas para o filho de prerelease de plugins, `release-checks` para todos os filhos de release ou um grupo mais estreito: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` no guarda-chuva. Isso mantém limitada a nova execução de uma caixa de release com falha depois de uma correção focada. Para uma lane cross-OS com falha, combine `rerun_group=cross-os` com `cross_os_suite_filter`, por exemplo `windows/packaged-upgrade`; comandos longos cross-OS emitem linhas de Heartbeat, e os resumos packaged-upgrade incluem tempos por fase. As lanes de QA de release-check são consultivas, exceto o gate padrão de cobertura de ferramentas de runtime, que bloqueia quando ferramentas dinâmicas obrigatórias do OpenClaw divergem ou desaparecem do resumo do tier padrão.

`OpenClaw Release Checks` usa a referência confiável do workflow para resolver a referência selecionada uma vez em um tarball `release-package-under-test`, depois passa esse artifact para verificações cross-OS e Package Acceptance, além do workflow Docker live/E2E de caminho de release quando a cobertura soak roda. Isso mantém os bytes do pacote consistentes entre as caixas de release e evita reempacotar o mesmo candidato em vários jobs filhos. Para a lane live do plugin npm Codex, release checks passam uma spec de plugin publicado correspondente derivada de `release_package_spec`, passam o `codex_plugin_spec` fornecido pelo operador ou deixam o input em branco para que o script Docker empacote o plugin Codex do checkout selecionado.

Execuções duplicadas de `Full Release Validation` para `ref=main` e `rerun_group=all`
substituem o guarda-chuva mais antigo. O monitor pai cancela qualquer workflow filho que
já tenha disparado quando o pai é cancelado, então uma validação de main mais nova
não fica atrás de uma execução obsoleta de release-check de duas horas. Validação de branch/tag de release
e grupos de nova execução focada mantêm `cancel-in-progress: false`.

## Shards live e E2E

O filho live/E2E de release mantém ampla cobertura nativa de `pnpm test:live`, mas a executa como shards nomeados por meio de `scripts/test-live-shard.mjs` em vez de um único job serial:

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

Isso mantém a mesma cobertura de arquivos enquanto facilita reexecutar e diagnosticar falhas lentas de provedores live. Os nomes agregados de shard `native-live-extensions-o-z`, `native-live-extensions-media` e `native-live-extensions-media-music` continuam válidos para novas execuções manuais pontuais.

Os shards de mídia live nativos rodam em `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, criado pelo workflow `Live Media Runner Image`. Essa imagem pré-instala `ffmpeg` e `ffprobe`; os jobs de mídia apenas verificam os binários antes da configuração. Mantenha suítes live apoiadas por Docker em runners Blacksmith normais — jobs de contêiner são o lugar errado para iniciar testes Docker aninhados.

Fragmentos de modelo/backend ao vivo com suporte do Docker usam uma imagem compartilhada separada `ghcr.io/openclaw/openclaw-live-test:<sha>` por commit selecionado. O workflow de lançamento ao vivo cria e envia essa imagem uma vez; depois, os fragmentos do modelo ao vivo do Docker, do Gateway fragmentado por provedor, do backend da CLI, do vínculo ACP e do harness Codex são executados com `OPENCLAW_SKIP_DOCKER_BUILD=1`. Os fragmentos Docker do Gateway carregam limites explícitos de `timeout` em nível de script abaixo do tempo limite do job do workflow, para que um contêiner travado ou um caminho de limpeza falhe rapidamente em vez de consumir todo o orçamento da verificação de lançamento. Se esses fragmentos reconstruírem o alvo Docker completo do código-fonte de forma independente, a execução de lançamento está mal configurada e desperdiçará tempo de relógio em builds duplicados de imagem.

## Aceitação de Pacote

Use `Package Acceptance` quando a pergunta for "este pacote OpenClaw instalável funciona como produto?" Ela é diferente da CI normal: a CI normal valida a árvore de código-fonte, enquanto a aceitação de pacote valida um único tarball pelo mesmo harness Docker E2E que os usuários exercitam após instalar ou atualizar.

### Jobs

1. `resolve_package` faz checkout de `workflow_ref`, resolve um candidato de pacote, grava `.artifacts/docker-e2e-package/openclaw-current.tgz`, grava `.artifacts/docker-e2e-package/package-candidate.json`, envia ambos como o artefato `package-under-test` e imprime a origem, a referência do workflow, a referência do pacote, a versão, o SHA-256 e o perfil no resumo da etapa do GitHub.
2. `docker_acceptance` chama `openclaw-live-and-e2e-checks-reusable.yml` com `ref=workflow_ref` e `package_artifact_name=package-under-test`. O workflow reutilizável baixa esse artefato, valida o inventário do tarball, prepara imagens Docker de digest do pacote quando necessário e executa as lanes Docker selecionadas contra esse pacote em vez de empacotar o checkout do workflow. Quando um perfil seleciona várias `docker_lanes` direcionadas, o workflow reutilizável prepara o pacote e as imagens compartilhadas uma vez, depois distribui essas lanes como jobs Docker direcionados paralelos com artefatos únicos.
3. `package_telegram` opcionalmente chama `NPM Telegram Beta E2E`. Ele é executado quando `telegram_mode` não é `none` e instala o mesmo artefato `package-under-test` quando a Aceitação de Pacote resolveu um; o dispatch avulso do Telegram ainda pode instalar uma especificação npm publicada.
4. `summary` falha o workflow se a resolução do pacote, a aceitação Docker ou a lane opcional do Telegram falhar.

### Origens de candidatos

- `source=npm` aceita apenas `openclaw@beta`, `openclaw@latest` ou uma versão exata de lançamento do OpenClaw, como `openclaw@2026.4.27-beta.2`. Use isso para aceitação publicada de pré-lançamento/estável.
- `source=ref` empacota um branch, tag ou SHA de commit completo confiável de `package_ref`. O resolvedor busca branches/tags do OpenClaw, verifica se o commit selecionado é alcançável a partir do histórico de branches do repositório ou de uma tag de lançamento, instala dependências em uma worktree destacada e o empacota com `scripts/package-openclaw-for-docker.mjs`.
- `source=url` baixa um `.tgz` HTTPS público; `package_sha256` é obrigatório. Esse caminho rejeita credenciais em URL, portas HTTPS não padrão, nomes de host ou IPs resolvidos privados/internos/de uso especial e redirecionamentos fora da mesma política pública de segurança.
- `source=trusted-url` baixa um `.tgz` HTTPS de uma política de origem confiável nomeada em `.github/package-trusted-sources.json`; `package_sha256` e `trusted_source_id` são obrigatórios. Use isso apenas para espelhos empresariais mantidos por mantenedores ou repositórios privados de pacotes que precisam de hosts, portas, prefixos de caminho, hosts de redirecionamento ou resolução de rede privada configurados. Se a política declarar autenticação bearer, o workflow usa o segredo fixo `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; credenciais embutidas na URL ainda são rejeitadas.
- `source=artifact` baixa um `.tgz` de `artifact_run_id` e `artifact_name`; `package_sha256` é opcional, mas deve ser fornecido para artefatos compartilhados externamente.

Mantenha `workflow_ref` e `package_ref` separados. `workflow_ref` é o código confiável de workflow/harness que executa o teste. `package_ref` é o commit de origem que é empacotado quando `source=ref`. Isso permite que o harness de teste atual valide commits de origem confiáveis mais antigos sem executar lógica antiga de workflow.

### Perfis de suíte

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` mais `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — blocos completos do caminho de lançamento Docker com OpenWebUI
- `custom` — `docker_lanes` exatas; obrigatório quando `suite_profile=custom`

O perfil `package` usa cobertura offline de Plugin para que a validação de pacote publicado não dependa da disponibilidade ao vivo do ClawHub. A lane opcional do Telegram reutiliza o artefato `package-under-test` em `NPM Telegram Beta E2E`, com o caminho de especificação npm publicada mantido para dispatches avulsos.

Para a política dedicada de testes de atualização e Plugin, incluindo comandos locais, lanes Docker, entradas da Aceitação de Pacote, padrões de lançamento e triagem de falhas, consulte [Testar atualizações e Plugins](/pt-BR/help/testing-updates-plugins).

As verificações de lançamento chamam a Aceitação de Pacote com `source=artifact`, o artefato de pacote de lançamento preparado, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` e `telegram_mode=mock-openai`. Isso mantém a migração de pacote, atualização, instalação de Skills ao vivo do ClawHub, limpeza de dependência obsoleta de Plugin, reparo de instalação de Plugin configurado, Plugin offline, atualização de Plugin e prova do Telegram no mesmo tarball de pacote resolvido. Defina `release_package_spec` em Full Release Validation ou OpenClaw Release Checks depois de publicar um beta para executar a mesma matriz contra o pacote npm enviado sem reconstruir; defina `package_acceptance_package_spec` apenas quando a Aceitação de Pacote precisar de um pacote diferente do restante da validação de lançamento. As verificações de lançamento entre sistemas operacionais ainda cobrem onboarding específico do sistema operacional, instalador e comportamento de plataforma; a validação de produto de pacote/atualização deve começar com a Aceitação de Pacote. A lane Docker `published-upgrade-survivor` valida uma linha de base de pacote publicado por execução no caminho bloqueante de lançamento. Na Aceitação de Pacote, o tarball resolvido `package-under-test` é sempre o candidato, e `published_upgrade_survivor_baseline` seleciona a linha de base publicada de fallback, com padrão `openclaw@latest`; comandos de reexecução de lane com falha preservam essa linha de base. Full Release Validation com `run_release_soak=true` ou `release_profile=full` define `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` e `published_upgrade_survivor_scenarios=reported-issues` para expandir pelas quatro versões npm estáveis mais recentes, além de lançamentos fixados de fronteira de compatibilidade de Plugin e fixtures em formato de issue para configuração do Feishu, arquivos de bootstrap/persona preservados, instalações configuradas de Plugin do OpenClaw, caminhos de log com til e raízes obsoletas de dependências legadas de Plugin. Seleções publicadas de sobrevivente de atualização com várias linhas de base são fragmentadas por linha de base em jobs separados de runner Docker direcionado. O workflow separado `Update Migration` usa a lane Docker `update-migration` com `all-since-2026.4.23` e `plugin-deps-cleanup` quando a pergunta é limpeza exaustiva de atualização publicada, não a amplitude normal da CI de Full Release. Execuções agregadas locais podem passar especificações exatas de pacote com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, manter uma única lane com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, como `openclaw@2026.4.15`, ou definir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para a matriz de cenários. A lane publicada configura a linha de base com uma receita embutida de comando `openclaw config set`, registra etapas da receita em `summary.json` e sonda `/healthz`, `/readyz`, além do status RPC após a inicialização do Gateway. As lanes frescas de pacote e instalador no Windows também verificam se um pacote instalado consegue importar uma substituição de controle de navegador a partir de um caminho bruto absoluto do Windows. O smoke de turno de agente OpenAI entre sistemas operacionais usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` como padrão quando definido; caso contrário, usa `openai/gpt-5.5`, para que a prova de instalação e Gateway permaneça em um modelo de teste GPT-5, evitando padrões GPT-4.x.

### Janelas de compatibilidade legada

A Aceitação de Pacote tem janelas limitadas de compatibilidade legada para pacotes já publicados. Pacotes até `2026.4.25`, incluindo `2026.4.25-beta.*`, podem usar o caminho de compatibilidade:

- entradas privadas conhecidas de QA em `dist/postinstall-inventory.json` podem apontar para arquivos omitidos do tarball;
- `doctor-switch` pode pular o subcaso de persistência `gateway install --wrapper` quando o pacote não expõe essa flag;
- `update-channel-switch` pode podar `patchedDependencies` ausentes do pnpm a partir da fixture git falsa derivada do tarball e pode registrar `update.channel` persistido ausente;
- smokes de Plugin podem ler locais legados de registros de instalação ou aceitar persistência ausente de registro de instalação do marketplace;
- `plugin-update` pode permitir migração de metadados de configuração, ainda exigindo que o registro de instalação e o comportamento sem reinstalação permaneçam inalterados.

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

Ao depurar uma execução de aceitação de pacote com falha, comece pelo resumo de `resolve_package` para confirmar a origem, a versão e o SHA-256 do pacote. Depois inspecione a execução filha de `docker_acceptance` e seus artefatos Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logs de lanes, tempos de fases e comandos de reexecução. Prefira reexecutar o perfil de pacote com falha ou as lanes Docker exatas em vez de reexecutar a validação completa de lançamento.

## Smoke de instalação

O workflow separado `Install Smoke` reutiliza o mesmo script de escopo por meio do próprio job `preflight`. Ele divide a cobertura smoke em `run_fast_install_smoke` e `run_full_install_smoke`.

- O **caminho rápido** é executado para pull requests que tocam superfícies de Docker/pacote, mudanças em pacote/manifesto de Plugin empacotado ou superfícies centrais de Plugin/canal/gateway/SDK de Plugin que os jobs de smoke do Docker exercitam. Mudanças somente em código-fonte de Plugin empacotado, edições somente em testes e edições somente em docs não reservam workers do Docker. O caminho rápido cria a imagem do Dockerfile raiz uma vez, verifica a CLI, executa o smoke da CLI de exclusão de agentes em workspace compartilhado, executa o e2e de rede do gateway no contêiner, verifica um argumento de build de extensão empacotada e executa o perfil Docker limitado de Plugin empacotado sob um timeout agregado de comando de 240 segundos (cada execução Docker de cenário é limitada separadamente).
- O **caminho completo** mantém a instalação de pacote QR e a cobertura Docker/update do instalador para execuções noturnas agendadas, disparos manuais, verificações de release por workflow-call e pull requests que realmente tocam superfícies de instalador/pacote/Docker. No modo completo, install-smoke prepara ou reutiliza uma imagem GHCR de smoke do Dockerfile raiz para um SHA alvo, depois executa instalação de pacote QR, smokes do Dockerfile raiz/gateway, smokes de instalador/update e o E2E Docker rápido de Plugin empacotado como jobs separados para que o trabalho do instalador não espere atrás dos smokes da imagem raiz.

Pushes para `main` (incluindo commits de merge) não forçam o caminho completo; quando a lógica de escopo alterado pediria cobertura completa em um push, o workflow mantém o smoke Docker rápido e deixa o smoke de instalação completo para validação noturna ou de release.

O smoke lento de provedor de imagem com instalação global do Bun é controlado separadamente por `run_bun_global_install_smoke`. Ele roda no agendamento noturno e a partir do workflow de verificações de release, e disparos manuais de `Install Smoke` podem optar por incluí-lo, mas pull requests e pushes para `main` não. O CI normal de PR ainda executa a lane rápida de regressão do launcher Bun para mudanças relevantes ao Node. Testes Docker de QR e instalador mantêm seus próprios Dockerfiles focados em instalação.

## E2E Docker Local

`pnpm test:docker:all` pré-cria uma imagem compartilhada de teste live, empacota o OpenClaw uma vez como tarball npm e cria duas imagens compartilhadas de `scripts/e2e/Dockerfile`:

- um runner Node/Git mínimo para lanes de instalador/update/dependência de Plugin;
- uma imagem funcional que instala o mesmo tarball em `/app` para lanes de funcionalidade normal.

As definições de lanes Docker ficam em `scripts/lib/docker-e2e-scenarios.mjs`, a lógica do planejador fica em `scripts/lib/docker-e2e-plan.mjs`, e o runner executa apenas o plano selecionado. O agendador seleciona a imagem por lane com `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, depois executa lanes com `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Ajustáveis

| Variável                               | Padrão  | Finalidade                                                                                       |
| -------------------------------------- | ------- | ------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Contagem de slots do pool principal para lanes normais.                                          |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Contagem de slots do pool final sensível a provedor.                                             |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Limite de lanes live concorrentes para que os provedores não façam throttling.                   |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | Limite de lanes concorrentes de instalação npm.                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Limite de lanes concorrentes de múltiplos serviços.                                              |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Intervalo entre inícios de lanes para evitar picos de criação no daemon Docker; defina `0` para sem intervalo. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Timeout de fallback por lane (120 minutos); lanes live/finais selecionadas usam limites mais rígidos. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` imprime o plano do agendador sem executar lanes.                                             |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Lista exata de lanes separada por vírgulas; ignora smoke de limpeza para que agentes possam reproduzir uma lane com falha. |

Uma lane mais pesada que seu limite efetivo ainda pode iniciar a partir de um pool vazio, e então roda sozinha até liberar capacidade. O agregado local faz preflights do Docker, remove contêineres E2E antigos do OpenClaw, emite status de lanes ativas, persiste tempos de lanes para ordenação das mais longas primeiro e, por padrão, para de agendar novas lanes em pool após a primeira falha.

### Workflow reutilizável live/E2E

O workflow reutilizável live/E2E pergunta a `scripts/test-docker-all.mjs --plan-json` qual pacote, tipo de imagem, imagem live, lane e cobertura de credenciais são necessários. `scripts/docker-e2e.mjs` então converte esse plano em saídas e resumos do GitHub. Ele empacota o OpenClaw por meio de `scripts/package-openclaw-for-docker.mjs`, baixa um artefato de pacote da execução atual ou baixa um artefato de pacote de `package_artifact_run_id`; valida o inventário do tarball; cria e envia imagens GHCR Docker E2E bare/funcionais marcadas por digest de pacote pelo cache de camadas Docker da Blacksmith quando o plano precisa de lanes com pacote instalado; e reutiliza entradas `docker_e2e_bare_image`/`docker_e2e_functional_image` fornecidas ou imagens existentes por digest de pacote em vez de recriar. Pulls de imagem Docker são repetidos com um timeout limitado de 180 segundos por tentativa para que um stream travado de registro/cache tente novamente rapidamente em vez de consumir a maior parte do caminho crítico do CI.

### Partes do caminho de release

A cobertura Docker de release executa jobs menores em partes com `OPENCLAW_SKIP_DOCKER_BUILD=1`, para que cada parte puxe apenas o tipo de imagem de que precisa e execute várias lanes pelo mesmo agendador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

As partes Docker de release atuais são `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` e `plugins-runtime-install-a` até `plugins-runtime-install-h`. `package-update-openai` inclui a lane live do pacote do Plugin Codex, que instala o pacote candidato do OpenClaw, instala o Plugin Codex a partir de `codex_plugin_spec` ou de um tarball da mesma referência com aprovação explícita de instalação da CLI Codex, executa o preflight da CLI Codex e então executa vários turnos do agente OpenClaw na mesma sessão contra a OpenAI. `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` permanecem aliases agregados de Plugin/runtime. O alias da lane `install-e2e` permanece o alias agregado de reexecução manual para ambas as lanes de instalador de provedor.

OpenWebUI é incorporado a `plugins-runtime-services` quando a cobertura completa de release-path o solicita, e mantém uma parte `openwebui` independente apenas para disparos somente de OpenWebUI. Lanes de atualização de canais empacotados tentam novamente uma vez para falhas transitórias de rede npm.

Cada parte envia `.artifacts/docker-tests/` com logs de lanes, tempos, `summary.json`, `failures.json`, tempos de fases, JSON do plano do agendador, tabelas de lanes lentas e comandos de reexecução por lane. A entrada `docker_lanes` do workflow executa lanes selecionadas contra as imagens preparadas em vez dos jobs em partes, o que mantém a depuração de lane com falha limitada a um job Docker direcionado e prepara, baixa ou reutiliza o artefato de pacote para essa execução; se uma lane selecionada for uma lane Docker live, o job direcionado cria a imagem de teste live localmente para essa reexecução. Comandos gerados de reexecução por lane no GitHub incluem `package_artifact_run_id`, `package_artifact_name` e entradas de imagem preparada quando esses valores existem, para que uma lane com falha possa reutilizar o pacote e as imagens exatos da execução com falha.

```bash
pnpm test:docker:rerun <run-id>      # baixa artefatos Docker e imprime comandos direcionados combinados/por lane para reexecução
pnpm test:docker:timings <summary>   # resumos de lanes lentas e caminho crítico de fases
```

O workflow live/E2E agendado executa diariamente a suíte Docker completa de release-path.

## Pré-release de Plugin

`Plugin Prerelease` é uma cobertura de produto/pacote mais cara, portanto é um workflow separado disparado por `Full Release Validation` ou por um operador explícito. Pull requests normais, pushes para `main` e disparos manuais independentes de CI mantêm essa suíte desativada. Ele balanceia testes de Plugins empacotados entre oito workers de extensão; esses jobs de shards de extensão executam até dois grupos de configuração de Plugin por vez com um worker Vitest por grupo e um heap Node maior, para que lotes de Plugins pesados em importação não criem jobs extras de CI. O caminho Docker de pré-release somente de release agrupa lanes Docker direcionadas em grupos pequenos para evitar reservar dezenas de runners para jobs de um a três minutos. O workflow também envia um artefato informativo `plugin-inspector-advisory` de `@openclaw/plugin-inspector`; achados do inspetor são entrada de triagem e não alteram o gate bloqueante de Plugin Prerelease.

## QA Lab

QA Lab tem lanes dedicadas de CI fora do workflow principal com escopo inteligente. A paridade agêntica fica aninhada sob os harnesses amplos de QA e release, não em um workflow de PR independente. Use `Full Release Validation` com `rerun_group=qa-parity` quando a paridade deve acompanhar uma execução ampla de validação.

- O workflow `QA-Lab - All Lanes` roda todas as noites em `main` e em disparo manual; ele expande a lane de paridade mock, a lane live Matrix e as lanes live Telegram e Discord como jobs paralelos. Jobs live usam o ambiente `qa-live-shared`, e Telegram/Discord usam leases Convex.

As verificações de release executam lanes de transporte live Matrix e Telegram com o provedor mock determinístico e modelos qualificados por mock (`mock-openai/gpt-5.5` e `mock-openai/gpt-5.5-alt`) para que o contrato do canal fique isolado da latência de modelo live e da inicialização normal de Plugin de provedor. O gateway de transporte live desativa busca de memória porque a paridade de QA cobre comportamento de memória separadamente; conectividade de provedor é coberta pelas suítes separadas de modelo live, provedor nativo e provedor Docker.

Matrix usa `--profile fast` para gates agendados e de release, adicionando `--fail-fast` somente quando a CLI em checkout oferece suporte a isso. O padrão da CLI e a entrada manual do workflow permanecem `all`; disparos manuais com `matrix_profile=all` sempre dividem a cobertura Matrix completa em jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`.

`OpenClaw Release Checks` também executa as lanes QA Lab críticas de release antes da aprovação de release; seu gate de paridade QA executa os pacotes candidato e baseline como jobs de lanes paralelos, depois baixa ambos os artefatos em um pequeno job de relatório para a comparação final de paridade.

Para PRs normais, siga evidências de CI/verificação com escopo em vez de tratar paridade como um status obrigatório.

## CodeQL

O workflow `CodeQL` é intencionalmente um scanner de segurança estreito de primeira passagem, não uma varredura completa do repositório. Execuções diárias, manuais e de proteção de pull request não rascunho escaneiam código de workflows do Actions mais as superfícies JavaScript/TypeScript de maior risco com consultas de segurança de alta confiança filtradas para `security-severity` alta/crítica.

A proteção de pull request permanece leve: ela só começa para mudanças em `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src` ou caminhos de runtime de Plugin empacotado que possuem processo, e executa a mesma matriz de segurança de alta confiança do workflow agendado. CodeQL de Android e macOS ficam fora dos padrões de PR.

### Categorias de segurança

| Categoria                                        | Superfície                                                                                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, segredos, sandbox, cron e linha de base do Gateway                                                                            |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementação de canal do core, além do runtime de Plugin de canal, Gateway, Plugin SDK, segredos e pontos de auditoria |
| `/codeql-security-high/network-ssrf-boundary`     | Superfícies de SSRF do core, parsing de IP, proteção de rede, web-fetch e política de SSRF do Plugin SDK                            |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, helpers de execução de processo, entrega de saída e gates de execução de ferramentas de agente                       |
| `/codeql-security-high/process-exec-boundary`     | Shell local, helpers de spawn de processo, runtimes de Plugins incluídos que possuem subprocessos e cola de scripts de workflow      |
| `/codeql-security-high/plugin-trust-boundary`     | Superfícies de confiança de instalação de Plugin, loader, manifesto, registry, instalação por gerenciador de pacotes, carregamento de código-fonte e contrato de pacote do Plugin SDK |

### Fragmentos de segurança específicos da plataforma

- `CodeQL Android Critical Security` — fragmento agendado de segurança do Android. Compila o app Android manualmente para CodeQL no menor runner Linux da Blacksmith aceito pela sanidade do workflow. Faz upload em `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — fragmento semanal/manual de segurança do macOS. Compila o app macOS manualmente para CodeQL no macOS da Blacksmith, filtra resultados de build de dependências para fora do SARIF enviado e faz upload em `/codeql-critical-security/macos`. Mantido fora dos padrões diários porque o build do macOS domina o runtime mesmo quando está limpo.

### Categorias de Qualidade Crítica

`CodeQL Critical Quality` é o fragmento não relacionado a segurança correspondente. Ele executa apenas consultas de qualidade JavaScript/TypeScript de severidade de erro e não relacionadas a segurança sobre superfícies estreitas de alto valor em runners Linux hospedados pelo GitHub, para que scans de qualidade não gastem o orçamento de registro de runners da Blacksmith. Seu guard de pull request é intencionalmente menor que o perfil agendado: PRs que não são rascunho executam apenas os fragmentos correspondentes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` e `plugin-sdk-reply-runtime` para mudanças em código de execução de comandos/modelos/ferramentas de agente e despacho de respostas, schema/migração/IO de config, código de auth/segredos/sandbox/segurança, runtime de canal do core e Plugin de canal incluído, protocolo/método de servidor do Gateway, cola de runtime/SDK de memória, MCP/processo/entrega de saída, runtime de provider/catálogo de modelos, diagnósticos de sessão/filas de entrega, loader de Plugin, Plugin SDK/contrato de pacote ou runtime de resposta do Plugin SDK. Mudanças na config do CodeQL e no workflow de qualidade executam todos os doze fragmentos de qualidade de PR.

O disparo manual aceita:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Os perfis estreitos são ganchos de ensino/iteração para executar um fragmento de qualidade isoladamente.

| Categoria                                              | Superfície                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Código de fronteira de segurança de auth, segredos, sandbox, cron e Gateway                                                                                       |
| `/codeql-critical-quality/config-boundary`              | Contratos de schema de config, migração, normalização e IO                                                                                                        |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schemas de protocolo do Gateway e contratos de métodos de servidor                                                                                                |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementação de canal do core e Plugin de canal incluído                                                                                            |
| `/codeql-critical-quality/agent-runtime-boundary`       | Contratos de runtime de execução de comandos, despacho de modelo/provider, despacho e filas de resposta automática e plano de controle ACP                         |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP e pontes de ferramentas, helpers de supervisão de processo e contratos de entrega de saída                                                         |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK do host de memória, facades de runtime de memória, aliases de memória do Plugin SDK, cola de ativação do runtime de memória e comandos doctor de memória       |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internos da fila de respostas, filas de entrega de sessão, helpers de vinculação/entrega de sessão de saída, superfícies de eventos diagnósticos/pacotes de logs e contratos da CLI doctor de sessão |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de resposta de entrada do Plugin SDK, payload de resposta/helpers de fragmentação/runtime, opções de resposta de canal, filas de entrega e helpers de vinculação de sessão/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalização do catálogo de modelos, auth e descoberta de provider, registro de runtime de provider, padrões/catálogos de provider e registries de web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap da Control UI, persistência local, fluxos de controle do Gateway e contratos de runtime do plano de controle de tarefas                                  |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratos de runtime de fetch/search web do core, IO de mídia, entendimento de mídia, geração de imagem e geração de mídia                                        |
| `/codeql-critical-quality/plugin-boundary`              | Contratos de loader, registry, superfície pública e entrypoint do Plugin SDK                                                                                       |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Código-fonte publicado do Plugin SDK no lado do pacote e helpers de contrato de pacote de Plugin                                                                  |

Qualidade permanece separada de segurança para que achados de qualidade possam ser agendados, medidos, desabilitados ou expandidos sem obscurecer o sinal de segurança. A expansão de CodeQL para Swift, Python e Plugins incluídos deve ser readicionada como trabalho de acompanhamento escopado ou fragmentado somente depois que os perfis estreitos tiverem runtime e sinal estáveis.

## Workflows de manutenção

### Agente de Docs

O workflow `Docs Agent` é uma lane de manutenção do Codex orientada a eventos para manter a documentação existente alinhada com mudanças recém-integradas. Ele não tem agendamento puro: uma execução de CI de push sem bot bem-sucedida em `main` pode acioná-lo, e o disparo manual pode executá-lo diretamente. Invocações por workflow-run são ignoradas quando `main` avançou ou quando outra execução não ignorada do Docs Agent foi criada na última hora. Quando executa, ele revisa o intervalo de commits do SHA de origem anterior não ignorado do Docs Agent até a `main` atual, então uma execução horária pode cobrir todas as mudanças da main acumuladas desde a última passagem de docs.

### Agente de Performance de Testes

O workflow `Test Performance Agent` é uma lane de manutenção do Codex orientada a eventos para testes lentos. Ele não tem agendamento puro: uma execução de CI de push sem bot bem-sucedida em `main` pode acioná-lo, mas ele é ignorado se outra invocação por workflow-run já tiver executado ou estiver executando naquele dia UTC. O disparo manual ignora esse gate de atividade diária. A lane cria um relatório de performance Vitest agrupado da suíte completa, permite que o Codex faça apenas pequenas correções de performance de teste que preservem cobertura em vez de refatorações amplas, então reexecuta o relatório da suíte completa e rejeita mudanças que reduzam a contagem de testes aprovados da baseline. O relatório agrupado registra tempo de parede por config e RSS máximo no Linux e macOS, então a comparação antes/depois expõe deltas de memória dos testes junto aos deltas de duração. Se a baseline tiver testes falhando, o Codex pode corrigir apenas falhas óbvias e o relatório da suíte completa pós-agente deve passar antes que qualquer coisa seja commitada. Quando `main` avança antes do push do bot ser integrado, a lane rebaseia o patch validado, reexecuta `pnpm check:changed` e tenta o push novamente; patches obsoletos conflitantes são ignorados. Ela usa Ubuntu hospedado pelo GitHub para que a action do Codex possa manter a mesma postura de segurança drop-sudo do agente de docs.

### PRs duplicados após merge

O workflow `Duplicate PRs After Merge` é um workflow manual de mantenedor para limpeza de duplicados pós-integração. Ele usa dry-run por padrão e só fecha PRs explicitamente listados quando `apply=true`. Antes de modificar o GitHub, ele verifica que o PR integrado teve merge e que cada duplicado tem uma issue referenciada compartilhada ou hunks alterados sobrepostos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gates de verificação locais e roteamento de mudanças

A lógica local de lanes alteradas vive em `scripts/changed-lanes.mjs` e é executada por `scripts/check-changed.mjs`. Esse gate de verificação local é mais rigoroso sobre fronteiras de arquitetura do que o escopo amplo da plataforma de CI:

- mudanças de produção no core executam typecheck de produção do core e de testes do core, além de lint/guards do core;
- mudanças apenas em testes do core executam somente typecheck de testes do core, além de lint do core;
- mudanças de produção em extensão executam typecheck de produção da extensão e de testes da extensão, além de lint da extensão;
- mudanças apenas em testes de extensão executam typecheck de testes da extensão, além de lint da extensão;
- mudanças públicas no Plugin SDK ou no contrato de Plugin expandem para typecheck de extensão porque extensões dependem desses contratos do core (varreduras de extensões do Vitest continuam sendo trabalho de teste explícito);
- bumps de versão apenas em metadados de release executam verificações direcionadas de versão/config/dependências raiz;
- mudanças desconhecidas em raiz/config falham de forma segura para todas as lanes de verificação.

O roteamento local de testes alterados vive em `scripts/test-projects.test-support.mjs` e é intencionalmente mais barato que `check:changed`: edições diretas de teste executam a si mesmas, edições de código-fonte preferem mapeamentos explícitos, depois testes irmãos e dependentes do grafo de imports. A config compartilhada de entrega de sala em grupo é um dos mapeamentos explícitos: mudanças na config de resposta visível para grupo, no modo de entrega de resposta de origem ou no prompt de sistema da ferramenta de mensagens passam pelos testes de resposta do core, além de regressões de entrega do Discord e Slack, para que uma mudança compartilhada de padrão falhe antes do primeiro push do PR. Use `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` somente quando a mudança for ampla o suficiente no harness para que o conjunto mapeado barato não seja uma proxy confiável.

## Validação Testbox

Crabbox é o wrapper de caixa remota pertencente ao repositório para prova de mantenedor em Linux. Use-o
a partir da raiz do repositório quando uma verificação for ampla demais para um ciclo de edição local, quando a paridade
com a CI importar, ou quando a prova precisar de segredos, Docker, lanes de pacote,
caixas reutilizáveis ou logs remotos. O backend normal do OpenClaw é
`blacksmith-testbox`; a capacidade própria em AWS/Hetzner é um fallback para interrupções do Blacksmith,
problemas de cota ou testes explícitos com capacidade própria.

Execuções do Blacksmith apoiadas por Crabbox aquecem, reivindicam, sincronizam, executam, relatam e limpam
Testboxes de uso único. A verificação de sanidade de sincronização integrada falha rapidamente quando arquivos
obrigatórios da raiz, como `pnpm-lock.yaml`, desaparecem ou quando `git status --short`
mostra pelo menos 200 exclusões rastreadas. Para PRs intencionais com muitas exclusões, defina
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para o comando remoto.

O Crabbox também encerra uma invocação local da CLI do Blacksmith que permanece na
fase de sincronização por mais de cinco minutos sem saída pós-sincronização. Defina
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` para desabilitar essa proteção, ou use um valor maior
em milissegundos para diffs locais excepcionalmente grandes.

Antes da primeira execução, verifique o wrapper a partir da raiz do repositório:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

O wrapper do repositório recusa um binário Crabbox obsoleto que não anuncia `blacksmith-testbox`. Passe o provedor explicitamente, mesmo que `.crabbox.yaml` tenha padrões de nuvem própria. Em worktrees do Codex ou checkouts vinculados/esparsos, evite o script local `pnpm crabbox:run`, porque o pnpm pode reconciliar dependências antes de o Crabbox iniciar; invoque o wrapper de node diretamente em vez disso:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Execuções apoiadas por Blacksmith exigem Crabbox 0.22.0 ou mais recente para que o wrapper obtenha o comportamento atual de sincronização, fila e limpeza do Testbox. Ao usar o checkout irmão, reconstrua o binário local ignorado antes de trabalho de cronometragem ou prova:

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

Nova execução de teste focado:

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
Execuções Crabbox de uso único apoiadas por Blacksmith devem interromper o Testbox automaticamente;
se uma execução for interrompida ou a limpeza estiver incerta, inspecione as caixas ativas e interrompa somente
as caixas que você criou:

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

Se o Crabbox for a camada quebrada, mas o próprio Blacksmith funcionar, use Blacksmith direto
somente para diagnósticos como `list`, `status` e limpeza. Corrija o
caminho do Crabbox antes de tratar uma execução direta do Blacksmith como prova de mantenedor.

Se `blacksmith testbox list --all` e `blacksmith testbox status` funcionarem, mas novos
aquecimentos ficarem `queued` sem IP ou URL de execução do Actions após alguns minutos,
trate isso como pressão de provedor, fila, faturamento ou limite de organização do Blacksmith. Interrompa os
ids enfileirados que você criou, evite iniciar mais Testboxes e mova a prova para o
caminho de capacidade própria do Crabbox abaixo enquanto alguém verifica o painel do Blacksmith,
o faturamento e os limites da organização.

Escale para a capacidade própria do Crabbox somente quando o Blacksmith estiver fora do ar, limitado por cota, sem o ambiente necessário, ou quando a capacidade própria for explicitamente o objetivo:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Sob pressão na AWS, evite `class=beast`, a menos que a tarefa realmente precise de CPU da classe 48xlarge. Uma solicitação `beast` começa em 192 vCPUs e é a forma mais fácil de esbarrar na cota regional de EC2 Spot ou On-Demand Standard. O `.crabbox.yaml` pertencente ao repositório usa como padrão `standard`, várias regiões de capacidade e `capacity.hints: true`, para que concessões AWS intermediadas imprimam região/mercado selecionados, pressão de cota, fallback Spot e avisos de classe sob alta pressão. Use `fast` para verificações amplas mais pesadas, `large` somente depois que standard/fast não forem suficientes, e `beast` somente para lanes excepcionais vinculadas a CPU, como suíte completa ou matrizes Docker de todos os Plugin, validação explícita de release/bloqueador ou profiling de desempenho com muitos núcleos. Não use `beast` para `pnpm check:changed`, testes focados, trabalho somente de documentação, lint/typecheck comum, pequenas reproduções E2E ou triagem de interrupção do Blacksmith. Use `--market on-demand` para diagnóstico de capacidade, para que a oscilação do mercado Spot não se misture ao sinal.

`.crabbox.yaml` é dono dos padrões de provedor, sincronização e hidratação do GitHub Actions para lanes de nuvem própria. Ele exclui o `.git` local para que o checkout hidratado do Actions mantenha seus próprios metadados remotos de Git, em vez de sincronizar remotos e object stores locais de mantenedores, e exclui artefatos locais de runtime/build que nunca devem ser transferidos. `.github/workflows/crabbox-hydrate.yml` é dono do checkout, configuração de Node/pnpm, fetch de `origin/main` e repasse de ambiente sem segredos para comandos `crabbox run --id <cbx_id>` em nuvem própria.

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Canais de desenvolvimento](/pt-BR/install/development-channels)
