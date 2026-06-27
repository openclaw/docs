---
read_when:
    - Você precisa entender por que um job de CI foi ou não executado
    - Você está depurando uma verificação com falha do GitHub Actions
    - Você está coordenando uma execução ou reexecução de validação de lançamento
    - Você está alterando o despacho do ClawSweeper ou o encaminhamento de atividade do GitHub
summary: Grafo de tarefas de CI, barreiras de escopo, agrupadores de lançamento e equivalentes de comandos locais
title: Pipeline de CI
x-i18n:
    generated_at: "2026-06-27T17:14:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 630a787d9855000d49902445982c4d9b458604c2556214afa3f7e90a87804c71
    source_path: ci.md
    workflow: 16
---

OpenClaw CI é executado em cada push para `main` e em cada pull request. Pushes canônicos para `main` passam primeiro por uma janela de admissão de 90 segundos em runner hospedado. O grupo de concorrência `CI` existente cancela essa execução em espera quando um commit mais novo chega, para que merges sequenciais não registrem, cada um, uma matriz Blacksmith completa. Pull requests e disparos manuais pulam a espera. O job `preflight` então classifica o diff e desativa faixas caras quando apenas áreas não relacionadas mudaram. Execuções manuais de `workflow_dispatch` intencionalmente contornam o escopo inteligente e expandem o grafo completo para candidatos a lançamento e validação ampla. As faixas Android permanecem opcionais por meio de `include_android`. A cobertura de Plugin exclusiva de lançamento fica no workflow separado [`Pré-lançamento de Plugin`](#plugin-prerelease) e só é executada a partir de [`Validação completa de lançamento`](#full-release-validation) ou de um disparo manual explícito.

## Visão geral do pipeline

| Job                                | Finalidade                                                                                                  | Quando é executado                                      |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `preflight`                        | Detecta mudanças somente em docs, escopos alterados, extensões alteradas e gera o manifesto de CI           | Sempre em pushes e PRs que não são rascunho             |
| `runner-admission`                 | Debounce hospedado de 90 segundos para pushes canônicos em `main` antes de o trabalho Blacksmith ser registrado | Toda execução de CI; espera apenas em pushes canônicos para `main` |
| `security-fast`                    | Detecção de chave privada, auditoria de workflows alterados via `zizmor` e auditoria de lockfile de produção | Sempre em pushes e PRs que não são rascunho             |
| `check-dependencies`               | Passagem somente de dependências de produção do Knip mais o guard da allowlist de arquivos não usados        | Mudanças relevantes para Node                           |
| `build-artifacts`                  | Gera `dist/`, Control UI, smoke checks da CLI gerada, checks de artefatos gerados incorporados e artefatos reutilizáveis | Mudanças relevantes para Node                           |
| `checks-fast-core`                 | Faixas rápidas de correção no Linux, como bundled, protocol, QA Smoke CI e checks de roteamento de CI        | Mudanças relevantes para Node                           |
| `checks-fast-contracts-plugins-*`  | Duas verificações fragmentadas de contrato de plugins                                                       | Mudanças relevantes para Node                           |
| `checks-fast-contracts-channels-*` | Duas verificações fragmentadas de contrato de canais                                                        | Mudanças relevantes para Node                           |
| `checks-node-core-*`               | Fragmentos de teste Node do core, excluindo faixas de canal, bundled, contrato e extensão                   | Mudanças relevantes para Node                           |
| `check-*`                          | Equivalente fragmentado do gate local principal: tipos de prod, lint, guards, tipos de teste e smoke estrito | Mudanças relevantes para Node                           |
| `check-additional-*`               | Arquitetura, drift fragmentado de boundary/prompt, guards de extensão, boundary de pacote e topologia de runtime | Mudanças relevantes para Node                           |
| `checks-node-compat-node22`        | Build de compatibilidade com Node 22 e faixa de smoke                                                       | Disparo manual de CI para lançamentos                   |
| `check-docs`                       | Formatação de docs, lint e checks de links quebrados                                                        | Docs alterados                                          |
| `skills-python`                    | Ruff + pytest para Skills com suporte em Python                                                             | Mudanças relevantes para Skills em Python               |
| `checks-windows`                   | Testes de processo/caminho específicos do Windows mais regressões compartilhadas de especificadores de importação de runtime | Mudanças relevantes para Windows                        |
| `macos-node`                       | Faixa de teste TypeScript no macOS usando os artefatos gerados compartilhados                               | Mudanças relevantes para macOS                          |
| `macos-swift`                      | Lint, build e testes Swift para o app macOS                                                                 | Mudanças relevantes para macOS                          |
| `ios-build`                        | Geração de projeto Xcode mais build do app iOS no simulador                                                 | App iOS, kit de app compartilhado ou mudanças no Swabble |
| `android`                          | Testes unitários Android para ambos os sabores mais um build de APK debug                                   | Mudanças relevantes para Android                        |
| `test-performance-agent`           | Otimização diária de testes lentos do Codex após atividade confiável                                        | Sucesso da CI principal ou disparo manual               |
| `openclaw-performance`             | Relatórios diários/sob demanda de performance de runtime Kova com faixas mock-provider, deep-profile e GPT 5.5 live | Agendado e disparo manual                               |

## Ordem de falha rápida

1. `runner-admission` espera apenas por pushes canônicos para `main`; um push mais novo cancela a execução antes do registro no Blacksmith.
2. `preflight` decide quais faixas existem. A lógica de `docs-scope` e `changed-scope` são etapas dentro desse job, não jobs independentes.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` e `skills-python` falham rapidamente sem esperar pelos jobs mais pesados de artefatos e matriz de plataformas.
4. `build-artifacts` se sobrepõe às faixas rápidas do Linux para que consumidores downstream possam iniciar assim que o build compartilhado estiver pronto.
5. Faixas mais pesadas de plataforma e runtime se expandem depois disso: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` e `android`.

O GitHub pode marcar jobs substituídos como `cancelled` quando um push mais novo chega ao mesmo PR ou ref `main`. Trate isso como ruído da CI, a menos que a execução mais nova para a mesma ref também esteja falhando. Jobs de matriz usam `fail-fast: false`, e `build-artifacts` relata falhas incorporadas de channel, core-support-boundary e gateway-watch diretamente, em vez de enfileirar pequenos jobs verificadores. A chave automática de concorrência da CI é versionada (`CI-v7-*`) para que um zumbi do lado do GitHub em um grupo de fila antigo não bloqueie indefinidamente execuções mais novas da main. Execuções manuais da suíte completa usam `CI-manual-v1-*` e não cancelam execuções em andamento.

Use `pnpm ci:timings`, `pnpm ci:timings:recent` ou `node scripts/ci-run-timings.mjs <run-id>` para resumir tempo de parede, tempo de fila, jobs mais lentos, falhas e a barreira de expansão `pnpm-store-warmup` do GitHub Actions. A CI também faz upload do mesmo resumo de execução como um artefato `ci-timings-summary`. Para timing de build, verifique a etapa `Build dist` do job `build-artifacts`: `pnpm build:ci-artifacts` imprime `[build-all] phase timings:` e inclui `ui:build`; o job também faz upload do artefato `startup-memory`.

Para execuções de pull request, o job terminal de resumo de timing executa o helper a partir da revisão base confiável antes de passar `GH_TOKEN` para `gh run view`. Isso mantém a consulta com token fora do código controlado pelo branch, enquanto ainda resume a execução atual de CI do pull request.

## Contexto e evidência de PR

PRs de contribuidores externos executam um gate de contexto e evidência de PR a partir de `.github/workflows/real-behavior-proof.yml`. O workflow faz checkout do commit base confiável e avalia apenas o corpo do PR; ele não executa código do branch do contribuidor.

O gate se aplica a autores de PR que não são proprietários, membros, colaboradores ou bots do repositório. Ele passa quando o corpo do PR contém seções autorais `What Problem This Solves` e `Evidence`. A evidência pode ser um teste focado, resultado de CI, captura de tela, gravação, saída de terminal, observação ao vivo, log redigido ou link de artefato. O corpo fornece intenção e validação útil; revisores inspecionam o código, os testes e a CI para avaliar a correção.

Quando o check falhar, atualize o corpo do PR em vez de enviar outro commit de código.

## Escopo e roteamento

A lógica de escopo fica em `scripts/ci-changed-scope.mjs` e é coberta por testes unitários em `src/scripts/ci-changed-scope.test.ts`. O disparo manual pula a detecção de escopo alterado e faz o manifesto de preflight agir como se todas as áreas com escopo tivessem mudado.

- **Edições no workflow de CI** validam o grafo de CI Node mais o lint de workflow, mas não forçam builds nativos de Windows, iOS, Android ou macOS por si só; essas faixas de plataforma permanecem restritas a mudanças de código-fonte de plataforma.
- **Sanidade de workflow** executa `actionlint`, `zizmor` sobre todos os arquivos YAML de workflow, o guard de interpolação de composite-action e o guard de marcadores de conflito. O job `security-fast` com escopo de PR também executa `zizmor` sobre arquivos de workflow alterados para que achados de segurança de workflow falhem cedo no grafo principal de CI.
- **Docs em pushes para `main`** são verificados pelo workflow independente `Docs` com o mesmo espelho de docs do ClawHub usado pela CI, então pushes mistos de código+docs não enfileiram também o fragmento `check-docs` da CI. Pull requests e CI manual ainda executam `check-docs` a partir da CI quando docs mudam.
- **TUI PTY** executa no fragmento Linux Node `checks-node-core-runtime-tui-pty` para mudanças de TUI. O fragmento executa `test/vitest/vitest.tui-pty.config.ts` com `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, então cobre tanto a faixa determinística de fixture `TuiBackend` quanto o smoke mais lento `tui --local`, que mocka apenas o endpoint externo do modelo.
- **Edições somente de roteamento de CI, edições selecionadas de fixtures baratas de testes do core e edições estreitas de helper/roteamento de teste de contrato de Plugin** usam um caminho rápido de manifesto somente Node: `preflight`, segurança e uma única tarefa `checks-fast-core`. Esse caminho pula artefatos de build, compatibilidade com Node 22, contratos de canal, fragmentos completos do core, fragmentos de bundled-plugin e matrizes adicionais de guards quando a mudança é limitada às superfícies de roteamento ou helper que a tarefa rápida exercita diretamente.
- **Checks Node no Windows** têm escopo restrito a wrappers de processo/caminho específicos do Windows, helpers de runner npm/pnpm/UI, configuração de gerenciador de pacotes e superfícies do workflow de CI que executam essa faixa; mudanças não relacionadas de código-fonte, Plugin, install-smoke e somente testes permanecem nas faixas Linux Node.

As famílias de testes Node mais lentas são divididas ou balanceadas para que cada job permaneça pequeno sem reservar runners em excesso: contratos de plugins e contratos de canais rodam cada um como dois shards ponderados com suporte do Blacksmith e fallback padrão para runner do GitHub, as lanes rápidas/de suporte de unidade do core rodam separadamente, a infraestrutura de runtime do core é dividida entre state, process/config, shared e três shards de domínio cron, auto-reply roda como workers balanceados (com a subárvore de reply dividida em shards agent-runner, dispatch e commands/state-routing), e as configurações agentic gateway/server são divididas entre lanes chat/auth/model/http-plugin/runtime/startup em vez de esperar por artefatos gerados. A CI normal então empacota apenas shards de padrões de inclusão de infraestrutura isolada em pacotes determinísticos de no máximo 64 arquivos de teste, reduzindo a matriz Node sem mesclar suítes não isoladas de command/cron, agents-core com estado, ou gateway/server; suítes fixas pesadas permanecem em 8 vCPU, enquanto as lanes empacotadas e de menor peso usam 4 vCPU. Pull requests no repositório canônico usam um plano de admissão compacto adicional: os mesmos grupos por configuração rodam em subprocessos isolados dentro do plano Linux Node atual de 34 jobs, então um único PR não registra a matriz Node completa de mais de 70 jobs. Pushes para `main`, dispatches manuais e gates de release mantêm a matriz completa. Testes amplos de navegador, QA, mídia e plugins diversos usam suas configurações Vitest dedicadas em vez do catch-all compartilhado de plugins. Shards de padrões de inclusão registram entradas de tempo usando o nome do shard de CI, para que `.artifacts/vitest-shard-timings.json` consiga distinguir uma configuração inteira de um shard filtrado. `check-additional-*` mantém o trabalho de compilação/canário de fronteira de pacote junto e separa a arquitetura de topologia de runtime da cobertura de gateway watch; a lista de guardas de fronteira é distribuída em um shard pesado de prompts e um shard combinado para as faixas de guardas restantes, cada um executando guardas independentes selecionados em paralelo e imprimindo tempos por verificação. A verificação cara de drift de snapshot de prompt do caminho feliz do Codex roda como seu próprio job adicional apenas para CI manual e para mudanças que afetam prompts, então mudanças Node normais e não relacionadas não ficam esperando atrás da geração fria de snapshots de prompt, e os shards de fronteira permanecem balanceados enquanto o drift de prompt ainda fica preso ao PR que o causou; a mesma flag pula a geração Vitest de snapshots de prompt dentro do shard support-boundary do core com artefatos gerados. Gateway watch, testes de canais e o shard support-boundary do core rodam em paralelo dentro de `build-artifacts` depois que `dist/` e `dist-runtime/` já foram gerados.

Depois de admitida, a CI Linux canônica permite até 24 jobs de teste Node simultâneos e
12 para as lanes menores rápidas/de verificação; Windows e Android permanecem em dois porque
esses pools de runners são mais estreitos.

O plano compacto de PR emite 18 jobs Node para a suíte atual: grupos de configuração inteira
são agrupados em subprocessos isolados com timeout de lote de 120 minutos,
enquanto grupos de padrões de inclusão compartilham o mesmo orçamento limitado de jobs.

A CI Android roda tanto `testPlayDebugUnitTest` quanto `testThirdPartyDebugUnitTest` e depois gera o APK de debug Play. O flavor de terceiros não tem source set nem manifesto separado; sua lane de teste unitário ainda compila o flavor com as flags BuildConfig de SMS/call-log, evitando ao mesmo tempo um job duplicado de empacotamento de APK de debug em todo push relevante para Android.

O shard `check-dependencies` roda `pnpm deadcode:dependencies` (uma passagem Knip de produção somente para dependências, fixada na versão mais recente do Knip, com a idade mínima de release do pnpm desativada para a instalação via `dlx`) e `pnpm deadcode:unused-files`, que compara os achados de arquivos de produção não usados do Knip com `scripts/deadcode-unused-files.allowlist.mjs`. O guarda de arquivos não usados falha quando um PR adiciona um novo arquivo não usado sem revisão ou deixa uma entrada obsoleta na allowlist, preservando ao mesmo tempo superfícies intencionais de plugins dinâmicos, geradas, de build, testes live e pontes de pacote que o Knip não consegue resolver estaticamente.

## Encaminhamento de atividade do ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` é a ponte do lado de destino da atividade do repositório OpenClaw para o ClawSweeper. Ele não faz checkout nem executa código de pull request não confiável. O workflow cria um token de GitHub App a partir de `CLAWSWEEPER_APP_PRIVATE_KEY` e então despacha payloads compactos de `repository_dispatch` para `openclaw/clawsweeper`.

O workflow tem quatro lanes:

- `clawsweeper_item` para solicitações exatas de revisão de issue e pull request;
- `clawsweeper_comment` para comandos explícitos do ClawSweeper em comentários de issues;
- `clawsweeper_commit_review` para solicitações de revisão em nível de commit em pushes para `main`;
- `github_activity` para atividade geral do GitHub que o agente ClawSweeper pode inspecionar.

A lane `github_activity` encaminha apenas metadados normalizados: tipo de evento, ação, ator, repositório, número do item, URL, título, estado e trechos curtos para comentários ou revisões quando presentes. Ela evita intencionalmente encaminhar o corpo completo do webhook. O workflow receptor em `openclaw/clawsweeper` é `.github/workflows/github-activity.yml`, que publica o evento normalizado no hook do Gateway OpenClaw para o agente ClawSweeper.

Atividade geral é observação, não entrega por padrão. O agente ClawSweeper recebe o destino Discord em seu prompt e deve publicar em `#clawsweeper` apenas quando o evento for surpreendente, acionável, arriscado ou operacionalmente útil. Aberturas rotineiras, edições, rotatividade de bots, ruído duplicado de webhook e tráfego normal de revisão devem resultar em `NO_REPLY`.

Trate títulos, comentários, corpos, texto de revisão, nomes de branches e mensagens de commit do GitHub como dados não confiáveis ao longo de todo esse caminho. Eles são entrada para sumarização e triagem, não instruções para o workflow ou runtime do agente.

## Dispatches manuais

Dispatches manuais de CI rodam o mesmo grafo de jobs que a CI normal, mas forçam toda lane com escopo não Android a ficar ativada: shards Linux Node, shards de plugins empacotados, shards de contratos de plugins e canais, compatibilidade Node 22, `check-*`, `check-additional-*`, smoke checks de artefatos gerados, verificações de docs, Skills Python, Windows, macOS, build iOS e i18n da Control UI. Dispatches manuais autônomos de CI rodam Android apenas com `include_android=true`; o guarda-chuva de release completo habilita Android passando `include_android=true`. Verificações estáticas de pré-release de plugins, o shard `agentic-plugins` exclusivo de release, a varredura completa em lote de extensões e lanes Docker de pré-release de plugins são excluídos da CI. A suíte Docker de pré-release roda apenas quando `Full Release Validation` despacha o workflow separado `Plugin Prerelease` com o gate de validação de release habilitado.

Execuções manuais usam um grupo de concorrência único para que uma suíte completa de release candidate não seja cancelada por outro push ou execução de PR na mesma ref. A entrada opcional `target_ref` permite que um chamador confiável rode esse grafo contra uma branch, tag ou SHA de commit completo enquanto usa o arquivo de workflow da ref de dispatch selecionada.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                          | Jobs                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Dispatch manual de CI e fallbacks de repositórios não canônicos, varreduras de qualidade CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, workflows de docs fora da CI e preflight install-smoke para que a matriz Blacksmith possa entrar na fila mais cedo       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, shards de extensões de menor peso, `checks-fast-core`, shards de contratos de plugins/canais, a maioria dos shards Linux Node empacotados/de menor peso, `check-guards`, `check-prod-types`, `check-test-types`, shards `check-additional-*` selecionados e `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Suítes Linux Node pesadas mantidas, shards `check-additional-*` pesados de fronteira/extensão e `android`                                                                                                                                                                            |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (sensível a CPU o suficiente para que 8 vCPU custassem mais do que economizavam); builds Docker install-smoke (o tempo de fila de 32 vCPU custava mais do que economizava)                                                                           |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` em `openclaw/openclaw`; forks fazem fallback para `macos-15`                                                                                                                                                                                                            |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` e `ios-build` em `openclaw/openclaw`; forks fazem fallback para `macos-26`                                                                                                                                                                                            |

## Orçamento de registro de runners

O bucket atual de registro de runners do GitHub do OpenClaw permite 3.000 registros de
runners auto-hospedados a cada 5 minutos. O limite é compartilhado por todos os registros de runners
Blacksmith na organização `openclaw`, então adicionar outra instalação
Blacksmith não adiciona um novo bucket.

Trate labels Blacksmith como o recurso escasso para controle de rajadas. Jobs que
apenas roteiam, notificam, resumem, selecionam shards ou rodam varreduras CodeQL curtas devem
permanecer em runners hospedados pelo GitHub, a menos que tenham necessidades específicas do Blacksmith
medidas. Qualquer nova matriz Blacksmith, `max-parallel` maior ou workflow de alta frequência
deve mostrar sua contagem de registros no pior caso e manter a meta em nível de organização
abaixo de 2.000 registros a cada 5 minutos, deixando folga para repositórios
concorrentes e jobs reexecutados.

A CI do repositório canônico mantém Blacksmith como o caminho padrão de runner para execuções normais de push e pull request. `workflow_dispatch` e execuções de repositórios não canônicos usam runners hospedados pelo GitHub, mas execuções canônicas normais atualmente não sondam a saúde da fila do Blacksmith nem fazem fallback automaticamente para labels hospedadas pelo GitHub quando o Blacksmith está indisponível.

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

O disparo manual normalmente faz benchmark da ref do fluxo de trabalho. Defina `target_ref` para fazer benchmark de uma tag de release ou de outro branch com a implementação atual do fluxo de trabalho. Os caminhos de relatórios publicados e os ponteiros mais recentes são indexados pela ref testada, e cada `index.md` registra a ref/SHA testada, a ref/SHA do fluxo de trabalho, a ref do Kova, o perfil, o modo de autenticação da lane, o modelo, a contagem de repetições e os filtros de cenário.

O fluxo de trabalho instala o OCM a partir de uma release fixada e o Kova a partir de `openclaw/Kova` na entrada fixada `kova_ref`, depois executa três lanes:

- `mock-provider`: cenários de diagnóstico do Kova contra um runtime de build local com autenticação falsa determinística compatível com OpenAI.
- `mock-deep-profile`: criação de perfil de CPU/heap/trace para pontos críticos de inicialização, Gateway e turno de agente.
- `live-openai-candidate`: um turno real de agente OpenAI `openai/gpt-5.5`, ignorado quando `OPENAI_API_KEY` não está disponível.

A lane mock-provider também executa sondagens de origem nativas do OpenClaw após a passagem do Kova: tempo de inicialização do Gateway e memória nos casos de inicialização padrão, com hook e com 50 plugins; RSS de importação de Plugin empacotado, loops repetidos de hello `channel-chat-baseline` com OpenAI simulado, comandos de inicialização da CLI contra o Gateway inicializado e a sondagem de desempenho de smoke do estado SQLite. Quando o relatório de origem mock-provider publicado anteriormente está disponível para a ref testada, o resumo de origem compara os valores atuais de RSS e heap com essa linha de base e marca grandes aumentos de RSS como `watch`. O resumo em Markdown da sondagem de origem fica em `source/index.md` no pacote do relatório, com o JSON bruto ao lado.

Cada lane envia artefatos do GitHub. Quando `CLAWGRIT_REPORTS_TOKEN` está configurado, o fluxo de trabalho também commita `report.json`, `report.md`, pacotes, `index.md` e artefatos de sondagem de origem em `openclaw/clawgrit-reports` sob `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. O ponteiro atual da ref testada é gravado como `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validação completa de release

`Full Release Validation` é o fluxo de trabalho manual guarda-chuva para "executar tudo antes da release". Ele aceita um branch, tag ou SHA completo de commit, dispara o fluxo de trabalho manual `CI` com esse alvo, dispara `Plugin Prerelease` para prova somente de release de plugin/pacote/estático/Docker e dispara `OpenClaw Release Checks` para smoke de instalação, aceitação de pacote, verificações de pacote entre sistemas operacionais, renderização do scorecard de maturidade a partir de evidência de perfil de QA, paridade do QA Lab, Matrix e lanes do Telegram. Os perfis stable e full sempre incluem cobertura live/E2E exaustiva e soak do caminho de release com Docker; o perfil beta pode optar por isso com `run_release_soak=true`. O E2E canônico do pacote Telegram é executado dentro de Package Acceptance, portanto um candidato completo não inicia um poller live duplicado. Após a publicação, passe `release_package_spec` para reutilizar o pacote npm entregue nas verificações de release, Package Acceptance, Docker, entre sistemas operacionais e Telegram sem rebuild. Use `npm_telegram_package_spec` apenas para uma reexecução focada de Telegram com pacote publicado. A lane de pacote live do Plugin Codex usa o mesmo estado selecionado por padrão: `release_package_spec=openclaw@<tag>` publicado deriva `codex_plugin_spec=npm:@openclaw/codex@<tag>`, enquanto execuções por SHA/artefato empacotam `extensions/codex` a partir da ref selecionada. Defina `codex_plugin_spec` explicitamente para fontes de Plugin customizadas, como specs `npm:`, `npm-pack:` ou `git:`.

Consulte [Validação completa de release](/pt-BR/reference/full-release-validation) para a
matriz de estágios, nomes exatos dos jobs do fluxo de trabalho, diferenças de perfil, artefatos e
identificadores de reexecução focada.

`OpenClaw Release Publish` é o fluxo de trabalho manual mutante de release. Dispare-o
a partir de `release/YYYY.M.PATCH` ou `main` depois que a tag de release existir e depois que o
preflight npm do OpenClaw tiver sido bem-sucedido. Ele verifica `pnpm plugins:sync:check`,
dispara `Plugin NPM Release` para todos os pacotes de Plugin publicáveis, dispara
`Plugin ClawHub Release` para o mesmo SHA de release e só então dispara
`OpenClaw NPM Release` com o `preflight_run_id` salvo. A publicação stable também
exige um `windows_node_tag` exato; o fluxo de trabalho verifica a release de origem do Windows
e compara seus instaladores x64/ARM64 com a entrada aprovada pelo candidato
`windows_node_installer_digests` antes de qualquer filho de publicação, depois promove
e verifica esses mesmos digests de instalador fixados mais o contrato exato de ativo companheiro
e checksum antes de publicar o rascunho de release do GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Para prova de commit fixado em um branch que muda rapidamente, use o auxiliar em vez de
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Refs de disparo de fluxo de trabalho do GitHub devem ser branches ou tags, não SHAs brutos de commit. O
auxiliar envia um branch temporário `release-ci/<sha>-...` no SHA alvo,
dispara `Full Release Validation` a partir dessa ref fixada, verifica se cada
`headSha` de fluxo de trabalho filho corresponde ao alvo e exclui o branch temporário quando a
execução termina. O verificador guarda-chuva também falha se qualquer fluxo de trabalho filho foi executado em um
SHA diferente.

`release_profile` controla a abrangência live/provedor passada para as verificações de release. Os
fluxos de trabalho manuais de release usam `stable` por padrão; use `full` apenas quando você
intencionalmente quiser a matriz ampla consultiva de provedores/mídia. As verificações de release
stable e full sempre executam o soak exaustivo live/E2E e do caminho de release com Docker;
o perfil beta pode optar por isso com `run_release_soak=true`.

- `minimum` mantém as lanes mais rápidas críticas para release de OpenAI/core.
- `stable` adiciona o conjunto estável de provedores/backends.
- `full` executa a matriz ampla consultiva de provedores/mídia.

O guarda-chuva registra os ids das execuções filhas disparadas, e o job final `Verify full validation` reverifica as conclusões atuais das execuções filhas e anexa tabelas dos jobs mais lentos para cada execução filha. Se um fluxo de trabalho filho for reexecutado e ficar verde, reexecute apenas o job verificador pai para atualizar o resultado do guarda-chuva e o resumo de tempos.

Para recuperação, tanto `Full Release Validation` quanto `OpenClaw Release Checks` aceitam `rerun_group`. Use `all` para um candidato a release, `ci` apenas para o filho de CI completo normal, `plugin-prerelease` apenas para o filho de pré-release de plugin, `release-checks` para todos os filhos de release ou um grupo mais estreito: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` no guarda-chuva. Isso mantém delimitada a reexecução de uma caixa de release com falha após uma correção focada. Para uma lane entre sistemas operacionais com falha, combine `rerun_group=cross-os` com `cross_os_suite_filter`, por exemplo `windows/packaged-upgrade`; comandos longos entre sistemas operacionais emitem linhas de Heartbeat e resumos de packaged-upgrade incluem tempos por fase. As lanes de verificação de release de QA são consultivas, exceto o gate padrão de cobertura de ferramentas de runtime, que bloqueia quando ferramentas dinâmicas obrigatórias do OpenClaw divergem ou desaparecem do resumo do nível padrão.

`OpenClaw Release Checks` usa a ref confiável do fluxo de trabalho para resolver a ref selecionada uma vez em um tarball `release-package-under-test`, depois passa esse artefato para verificações entre sistemas operacionais e Package Acceptance, além do fluxo de trabalho Docker live/E2E do caminho de release quando a cobertura de soak é executada. Isso mantém os bytes do pacote consistentes entre caixas de release e evita reempacotar o mesmo candidato em vários jobs filhos. Para a lane live do Plugin npm Codex, as verificações de release passam uma spec de Plugin publicado correspondente derivada de `release_package_spec`, passam o `codex_plugin_spec` fornecido pelo operador ou deixam a entrada em branco para que o script Docker empacote o Plugin Codex do checkout selecionado.

Execuções duplicadas de `Full Release Validation` para `ref=main` e `rerun_group=all`
substituem o guarda-chuva mais antigo. O monitor pai cancela qualquer fluxo de trabalho filho que
já tenha disparado quando o pai é cancelado, para que uma validação mais nova de main
não fique atrás de uma execução obsoleta de duas horas de verificação de release. A validação de branch/tag
de release e grupos de reexecução focada mantêm `cancel-in-progress: false`.

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
- shards de mídia separados de áudio/vídeo e shards de música filtrados por provedor

Isso mantém a mesma cobertura de arquivos enquanto facilita reexecutar e diagnosticar falhas lentas de provedores live. Os nomes agregados de shard `native-live-extensions-o-z`, `native-live-extensions-media` e `native-live-extensions-media-music` continuam válidos para reexecuções manuais de tentativa única.

Os shards nativos de mídia live executam em `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, criado pelo fluxo de trabalho `Live Media Runner Image`. Essa imagem pré-instala `ffmpeg` e `ffprobe`; jobs de mídia apenas verificam os binários antes da configuração. Mantenha suítes live apoiadas por Docker em runners Blacksmith normais — jobs em contêiner são o lugar errado para iniciar testes Docker aninhados.

Os shards de modelo/backend ao vivo baseados em Docker usam uma imagem compartilhada separada `ghcr.io/openclaw/openclaw-live-test:<sha>` por commit selecionado. O fluxo de trabalho de lançamento ao vivo constrói e envia essa imagem uma vez; depois, os shards de modelo ao vivo Docker, Gateway dividido por provider, backend da CLI, bind ACP e harness Codex são executados com `OPENCLAW_SKIP_DOCKER_BUILD=1`. Os shards Docker do Gateway carregam limites explícitos de `timeout` no nível do script abaixo do tempo limite do job do fluxo de trabalho, para que um contêiner travado ou caminho de limpeza falhe rapidamente em vez de consumir todo o orçamento das verificações de lançamento. Se esses shards reconstruírem o alvo Docker completo do código-fonte de forma independente, a execução de lançamento está mal configurada e desperdiçará tempo de relógio em builds duplicados de imagem.

## Aceitação de Pacote

Use `Package Acceptance` quando a pergunta for "este pacote instalável do OpenClaw funciona como produto?" Ela é diferente da CI normal: a CI normal valida a árvore de código-fonte, enquanto a aceitação de pacote valida um único tarball pelo mesmo harness Docker E2E que os usuários exercitam após instalar ou atualizar.

### Jobs

1. `resolve_package` faz checkout de `workflow_ref`, resolve um candidato de pacote, grava `.artifacts/docker-e2e-package/openclaw-current.tgz`, grava `.artifacts/docker-e2e-package/package-candidate.json`, envia ambos como o artefato `package-under-test` e imprime a origem, a referência do fluxo de trabalho, a referência do pacote, a versão, o SHA-256 e o perfil no resumo da etapa do GitHub.
2. `docker_acceptance` chama `openclaw-live-and-e2e-checks-reusable.yml` com `ref=workflow_ref` e `package_artifact_name=package-under-test`. O fluxo de trabalho reutilizável baixa esse artefato, valida o inventário do tarball, prepara imagens Docker com digest do pacote quando necessário e executa as lanes Docker selecionadas contra esse pacote em vez de empacotar o checkout do fluxo de trabalho. Quando um perfil seleciona várias `docker_lanes` direcionadas, o fluxo de trabalho reutilizável prepara o pacote e as imagens compartilhadas uma vez, depois distribui essas lanes como jobs Docker direcionados paralelos com artefatos únicos.
3. `package_telegram` chama opcionalmente `NPM Telegram Beta E2E`. Ele é executado quando `telegram_mode` não é `none` e instala o mesmo artefato `package-under-test` quando a Aceitação de Pacote resolveu um; um dispatch independente do Telegram ainda pode instalar uma especificação npm publicada.
4. `summary` falha o fluxo de trabalho se a resolução do pacote, a aceitação Docker ou a lane opcional do Telegram falhar.

### Origens de candidatos

- `source=npm` aceita apenas `openclaw@beta`, `openclaw@latest` ou uma versão exata de lançamento do OpenClaw, como `openclaw@2026.4.27-beta.2`. Use isto para aceitação de pré-lançamento/estável publicado.
- `source=ref` empacota uma branch, tag ou SHA completo de commit confiável de `package_ref`. O resolvedor busca branches/tags do OpenClaw, verifica se o commit selecionado é alcançável a partir do histórico de branches do repositório ou de uma tag de lançamento, instala dependências em uma worktree separada e o empacota com `scripts/package-openclaw-for-docker.mjs`.
- `source=url` baixa um `.tgz` HTTPS público; `package_sha256` é obrigatório. Este caminho rejeita credenciais em URL, portas HTTPS não padrão, hostnames privados/internos/de uso especial ou IPs resolvidos, e redirecionamentos fora da mesma política pública de segurança.
- `source=trusted-url` baixa um `.tgz` HTTPS de uma política de origem confiável nomeada em `.github/package-trusted-sources.json`; `package_sha256` e `trusted_source_id` são obrigatórios. Use isto apenas para mirrors empresariais mantidos por mantenedores ou repositórios de pacotes privados que precisem de hosts, portas, prefixos de caminho, hosts de redirecionamento ou resolução de rede privada configurados. Se a política declarar autenticação bearer, o fluxo de trabalho usa o segredo fixo `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; credenciais embutidas em URL continuam sendo rejeitadas.
- `source=artifact` baixa um `.tgz` de `artifact_run_id` e `artifact_name`; `package_sha256` é opcional, mas deve ser fornecido para artefatos compartilhados externamente.

Mantenha `workflow_ref` e `package_ref` separados. `workflow_ref` é o código confiável do fluxo de trabalho/harness que executa o teste. `package_ref` é o commit de origem que é empacotado quando `source=ref`. Isso permite que o harness de teste atual valide commits de origem confiáveis mais antigos sem executar lógica antiga de fluxo de trabalho.

### Perfis de suíte

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` mais `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — blocos completos do caminho de lançamento Docker com OpenWebUI
- `custom` — `docker_lanes` exatas; obrigatório quando `suite_profile=custom`

O perfil `package` usa cobertura offline de Plugin para que a validação de pacote publicado não dependa da disponibilidade ao vivo do ClawHub. A lane opcional do Telegram reutiliza o artefato `package-under-test` em `NPM Telegram Beta E2E`, com o caminho de especificação npm publicada mantido para dispatches independentes.

Para a política dedicada de testes de atualização e Plugin, incluindo comandos locais,
lanes Docker, entradas de Aceitação de Pacote, padrões de lançamento e triagem de falhas,
veja [Testando atualizações e plugins](/pt-BR/help/testing-updates-plugins).

As verificações de lançamento chamam a Aceitação de Pacote com `source=artifact`, o artefato de pacote de lançamento preparado, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` e `telegram_mode=mock-openai`. Isso mantém a migração de pacote, atualização, instalação de Skills ao vivo do ClawHub, limpeza de dependência obsoleta de Plugin, reparo de instalação de Plugin configurado, Plugin offline, atualização de Plugin e prova do Telegram no mesmo tarball de pacote resolvido. Defina `release_package_spec` em Full Release Validation ou OpenClaw Release Checks após publicar um beta para executar a mesma matriz contra o pacote npm enviado sem reconstruir; defina `package_acceptance_package_spec` apenas quando a Aceitação de Pacote precisar de um pacote diferente do restante da validação de lançamento. As verificações de lançamento entre sistemas operacionais ainda cobrem onboarding, instalador e comportamento de plataforma específicos de OS; a validação de produto de pacote/atualização deve começar com a Aceitação de Pacote. A lane Docker `published-upgrade-survivor` valida uma linha de base de pacote publicado por execução no caminho bloqueante de lançamento. Na Aceitação de Pacote, o tarball `package-under-test` resolvido é sempre o candidato e `published_upgrade_survivor_baseline` seleciona a linha de base publicada de fallback, com padrão `openclaw@latest`; comandos de reexecução de lane com falha preservam essa linha de base. Full Release Validation com `run_release_soak=true` ou `release_profile=full` define `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` e `published_upgrade_survivor_scenarios=reported-issues` para expandir pelas quatro versões estáveis npm mais recentes, além de lançamentos fixados de limite de compatibilidade de Plugin e fixtures em formato de issue para configuração do Feishu, arquivos de bootstrap/persona preservados, instalações configuradas de Plugin do OpenClaw, caminhos de log com til e raízes obsoletas de dependências legadas de Plugin. Seleções multi-linha de base do survivor de upgrade publicado são divididas por linha de base em jobs separados de executor Docker direcionado. O fluxo de trabalho separado `Update Migration` usa a lane Docker `update-migration` com `all-since-2026.4.23` e `plugin-deps-cleanup` quando a pergunta é limpeza exaustiva de atualização publicada, não a amplitude normal da CI de Full Release. Execuções agregadas locais podem passar especificações exatas de pacote com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, manter uma única lane com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, como `openclaw@2026.4.15`, ou definir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para a matriz de cenários. A lane publicada configura a linha de base com uma receita embutida de comando `openclaw config set`, registra etapas da receita em `summary.json` e sonda `/healthz`, `/readyz`, além do status RPC após o início do Gateway. As lanes frescas empacotada e de instalador no Windows também verificam que um pacote instalado pode importar uma substituição de controle de navegador a partir de um caminho Windows absoluto bruto. O smoke de turno de agente OpenAI entre sistemas operacionais usa por padrão `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando definido; caso contrário, `openai/gpt-5.5`, para que a prova de instalação e Gateway permaneça em um modelo de teste GPT-5 enquanto evita padrões GPT-4.x.

### Janelas de compatibilidade legada

A Aceitação de Pacote tem janelas limitadas de compatibilidade legada para pacotes já publicados. Pacotes até `2026.4.25`, incluindo `2026.4.25-beta.*`, podem usar o caminho de compatibilidade:

- entradas conhecidas de QA privada em `dist/postinstall-inventory.json` podem apontar para arquivos omitidos do tarball;
- `doctor-switch` pode pular o subcaso de persistência `gateway install --wrapper` quando o pacote não expõe essa flag;
- `update-channel-switch` pode remover `patchedDependencies` ausentes do pnpm do fixture git falso derivado do tarball e pode registrar `update.channel` persistido ausente;
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

Ao depurar uma execução de aceitação de pacote com falha, comece pelo resumo de `resolve_package` para confirmar a origem, a versão e o SHA-256 do pacote. Depois inspecione a execução filha de `docker_acceptance` e seus artefatos Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logs de lane, tempos de fase e comandos de reexecução. Prefira reexecutar o perfil de pacote com falha ou as lanes Docker exatas em vez de reexecutar a validação completa de lançamento.

## Smoke de instalação

O fluxo de trabalho separado `Install Smoke` reutiliza o mesmo script de escopo por meio de seu próprio job `preflight`. Ele divide a cobertura de smoke em `run_fast_install_smoke` e `run_full_install_smoke`.

- **Caminho rápido** é executado para pull requests que tocam superfícies de Docker/pacote, alterações de pacote/manifesto de Plugin empacotado ou superfícies centrais de Plugin/canal/Gateway/Plugin SDK que os jobs de smoke do Docker exercitam. Alterações somente de código-fonte em Plugins empacotados, edições somente de teste e edições somente de docs não reservam workers de Docker. O caminho rápido cria a imagem do Dockerfile raiz uma vez, verifica a CLI, executa o smoke da CLI de exclusão de agentes em workspace compartilhado, executa o E2E de rede de Gateway em contêiner, verifica um argumento de build de extensão empacotada e executa o perfil Docker limitado de Plugin empacotado sob um timeout agregado de comando de 240 segundos (cada execução Docker de cenário é limitada separadamente).
- **Caminho completo** mantém a instalação do pacote QR e a cobertura de Docker/atualização do instalador para execuções noturnas agendadas, disparos manuais, verificações de release por workflow-call e pull requests que realmente tocam superfícies de instalador/pacote/Docker. No modo completo, o install-smoke prepara ou reutiliza uma imagem de smoke GHCR do Dockerfile raiz para um SHA-alvo, depois executa instalação de pacote QR, smokes do Dockerfile raiz/Gateway, smokes de instalador/atualização e o E2E Docker rápido de Plugin empacotado como jobs separados para que o trabalho de instalador não espere atrás dos smokes da imagem raiz.

Pushes para `main` (incluindo commits de merge) não forçam o caminho completo; quando a lógica de escopo alterado solicitaria cobertura completa em um push, o workflow mantém o smoke Docker rápido e deixa o smoke completo de instalação para a validação noturna ou de release.

O smoke lento de provedor de imagem com instalação global do Bun é controlado separadamente por `run_bun_global_install_smoke`. Ele roda no agendamento noturno e a partir do workflow de verificações de release, e disparos manuais de `Install Smoke` podem optar por incluí-lo, mas pull requests e pushes para `main` não. A CI normal de PR ainda executa a faixa rápida de regressão do launcher Bun para alterações relevantes ao Node. Testes Docker de QR e instalador mantêm seus próprios Dockerfiles focados em instalação.

## E2E Docker local

`pnpm test:docker:all` pré-constrói uma imagem compartilhada de live-test, empacota o OpenClaw uma vez como tarball npm e constrói duas imagens compartilhadas de `scripts/e2e/Dockerfile`:

- um executor Node/Git básico para faixas de instalador/atualização/dependência de Plugin;
- uma imagem funcional que instala o mesmo tarball em `/app` para faixas de funcionalidade normais.

As definições de faixas Docker ficam em `scripts/lib/docker-e2e-scenarios.mjs`, a lógica do planejador fica em `scripts/lib/docker-e2e-plan.mjs`, e o executor apenas executa o plano selecionado. O agendador seleciona a imagem por faixa com `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, depois executa faixas com `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Ajustes

| Variável                               | Padrão | Propósito                                                                                     |
| -------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10     | Contagem de slots do pool principal para faixas normais.                                      |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10     | Contagem de slots do pool final sensível a provedores.                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9      | Limite de faixas live simultâneas para que provedores não apliquem throttling.                 |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5      | Limite de faixas simultâneas de instalação npm.                                               |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7      | Limite de faixas simultâneas com múltiplos serviços.                                          |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000   | Intervalo entre inícios de faixas para evitar tempestades de criação no daemon Docker; defina `0` para nenhum intervalo. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Timeout de fallback por faixa (120 minutos); faixas live/finais selecionadas usam limites mais rígidos. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | não definido | `1` imprime o plano do agendador sem executar faixas.                                         |
| `OPENCLAW_DOCKER_ALL_LANES`            | não definido | Lista exata de faixas separada por vírgulas; ignora o smoke de limpeza para que agentes possam reproduzir uma faixa com falha. |

Uma faixa mais pesada que seu limite efetivo ainda pode iniciar a partir de um pool vazio, depois roda sozinha até liberar capacidade. O agregado local faz preflights do Docker, remove contêineres E2E obsoletos do OpenClaw, emite status de faixas ativas, persiste tempos de faixas para ordenação das mais longas primeiro e, por padrão, para de agendar novas faixas em pool após a primeira falha.

### Workflow reutilizável live/E2E

O workflow reutilizável live/E2E pergunta a `scripts/test-docker-all.mjs --plan-json` qual pacote, tipo de imagem, imagem live, faixa e cobertura de credenciais são necessários. `scripts/docker-e2e.mjs` então converte esse plano em outputs e resumos do GitHub. Ele empacota o OpenClaw por meio de `scripts/package-openclaw-for-docker.mjs`, baixa um artefato de pacote da execução atual ou baixa um artefato de pacote de `package_artifact_run_id`; valida o inventário do tarball; constrói e publica imagens Docker E2E GHCR básicas/funcionais marcadas por digest de pacote por meio do cache de camadas Docker do Blacksmith quando o plano precisa de faixas com pacote instalado; e reutiliza entradas fornecidas de `docker_e2e_bare_image`/`docker_e2e_functional_image` ou imagens existentes por digest de pacote em vez de reconstruir. Pulls de imagens Docker são tentados novamente com um timeout limitado de 180 segundos por tentativa para que um fluxo travado de registro/cache tente novamente rapidamente em vez de consumir a maior parte do caminho crítico da CI.

### Blocos do caminho de release

A cobertura Docker de release executa jobs menores em blocos com `OPENCLAW_SKIP_DOCKER_BUILD=1`, para que cada bloco baixe apenas o tipo de imagem de que precisa e execute várias faixas pelo mesmo agendador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Os blocos Docker de release atuais são `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` e `plugins-runtime-install-a` até `plugins-runtime-install-h`. `package-update-openai` inclui a faixa live do pacote do Plugin Codex, que instala o pacote candidato do OpenClaw, instala o Plugin Codex a partir de `codex_plugin_spec` ou de um tarball da mesma ref com aprovação explícita de instalação da CLI Codex, executa o preflight da CLI Codex e então executa várias interações de agente OpenClaw na mesma sessão contra a OpenAI. `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` permanecem aliases agregados de Plugin/runtime. O alias de faixa `install-e2e` permanece como o alias agregado de reexecução manual para ambas as faixas de instalador de provedor.

OpenWebUI é incorporado a `plugins-runtime-services` quando a cobertura completa de caminho de release o solicita, e mantém um bloco `openwebui` autônomo apenas para disparos somente de OpenWebUI. Faixas de atualização de canais empacotados tentam novamente uma vez em caso de falhas transitórias de rede npm.

Cada bloco envia `.artifacts/docker-tests/` com logs de faixas, tempos, `summary.json`, `failures.json`, tempos de fase, JSON do plano do agendador, tabelas de faixas lentas e comandos de reexecução por faixa. A entrada `docker_lanes` do workflow executa faixas selecionadas contra as imagens preparadas em vez dos jobs em bloco, o que mantém a depuração de faixas com falha limitada a um job Docker direcionado e prepara, baixa ou reutiliza o artefato de pacote para essa execução; se uma faixa selecionada for uma faixa Docker live, o job direcionado constrói a imagem live-test localmente para essa reexecução. Comandos gerados de reexecução por faixa no GitHub incluem `package_artifact_run_id`, `package_artifact_name` e entradas de imagem preparadas quando esses valores existem, para que uma faixa com falha possa reutilizar exatamente o pacote e as imagens da execução com falha.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

O workflow live/E2E agendado executa diariamente a suíte Docker completa do caminho de release.

## Pré-lançamento de Plugin

`Plugin Prerelease` é uma cobertura de produto/pacote mais cara, portanto é um workflow separado disparado por `Full Release Validation` ou por um operador explícito. Pull requests normais, pushes para `main` e disparos manuais autônomos de CI mantêm essa suíte desativada. Ele equilibra testes de Plugins empacotados em oito workers de extensão; esses jobs de shards de extensão executam até dois grupos de configuração de Plugin por vez com um worker Vitest por grupo e uma heap maior de Node, para que lotes de Plugins com muitas importações não criem jobs extras de CI. O caminho Docker de pré-lançamento exclusivo de release agrupa faixas Docker direcionadas em pequenos grupos para evitar reservar dezenas de runners para jobs de um a três minutos. O workflow também envia um artefato informativo `plugin-inspector-advisory` de `@openclaw/plugin-inspector`; achados do inspector são entrada de triagem e não alteram o gate bloqueante de Plugin Prerelease.

## QA Lab

QA Lab tem faixas de CI dedicadas fora do workflow principal com escopo inteligente. A paridade agêntica fica aninhada sob os harnesses amplos de QA e release, não em um workflow autônomo de PR. Use `Full Release Validation` com `rerun_group=qa-parity` quando a paridade deve acompanhar uma execução ampla de validação.

- O workflow `QA-Lab - All Lanes` roda todas as noites em `main` e em disparo manual; ele distribui a faixa de paridade mock, a faixa live Matrix e as faixas live Telegram e Discord como jobs paralelos. Jobs live usam o ambiente `qa-live-shared`, e Telegram/Discord usam leases Convex.

As verificações de release executam faixas de transporte live Matrix e Telegram com o provedor mock determinístico e modelos qualificados por mock (`mock-openai/gpt-5.5` e `mock-openai/gpt-5.5-alt`) para que o contrato do canal seja isolado da latência do modelo live e da inicialização normal de Plugin de provedor. O Gateway de transporte live desabilita a busca de memória porque a paridade de QA cobre comportamento de memória separadamente; a conectividade de provedor é coberta pelas suítes separadas de modelo live, provedor nativo e provedor Docker.

Matrix usa `--profile fast` para gates agendados e de release, adicionando `--fail-fast` apenas quando a CLI em checkout oferece suporte. O padrão da CLI e a entrada manual do workflow permanecem `all`; o disparo manual `matrix_profile=all` sempre divide a cobertura Matrix completa em jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`.

`OpenClaw Release Checks` também executa as faixas críticas de release do QA Lab antes da aprovação de release; seu gate de paridade de QA executa os pacotes candidato e baseline como jobs de faixa paralelos, depois baixa ambos os artefatos em um pequeno job de relatório para a comparação final de paridade.

Para PRs normais, siga evidências de CI/verificação com escopo em vez de tratar a paridade como um status obrigatório.

## CodeQL

O workflow `CodeQL` é intencionalmente um scanner de segurança estreito de primeira passagem, não a varredura completa do repositório. Execuções diárias, manuais e de proteção de pull requests não draft escaneiam código de workflows Actions mais as superfícies JavaScript/TypeScript de maior risco com consultas de segurança de alta confiança filtradas para `security-severity` alta/crítica.

A proteção de pull request permanece leve: ela só inicia para alterações em `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` ou `src`, e executa a mesma matriz de segurança de alta confiança do workflow agendado. CodeQL de Android e macOS ficam fora dos padrões de PR.

### Categorias de segurança

| Categoria                                        | Superfície                                                                                                                               |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, segredos, sandbox, Cron e linha de base do Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementação de canal do core mais o runtime do Plugin de canal, Gateway, Plugin SDK, segredos e pontos de contato de auditoria |
| `/codeql-security-high/network-ssrf-boundary`     | SSRF do core, análise de IP, guarda de rede, busca web e superfícies de política de SSRF do Plugin SDK                                 |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, auxiliares de execução de processos, entrega de saída e gates de execução de ferramentas de agente                       |
| `/codeql-security-high/plugin-trust-boundary`     | Instalação de Plugin, carregador, manifesto, registro, instalação por gerenciador de pacotes, carregamento de código-fonte e superfícies de confiança do contrato de pacote do Plugin SDK |

### Shards de segurança específicos por plataforma

- `CodeQL Android Critical Security` — shard de segurança Android agendado. Compila o app Android manualmente para o CodeQL no menor runner Blacksmith Linux aceito pela sanidade do workflow. Envia em `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard de segurança macOS semanal/manual. Compila o app macOS manualmente para o CodeQL no Blacksmith macOS, filtra os resultados de build de dependências do SARIF enviado e envia em `/codeql-critical-security/macos`. Mantido fora dos padrões diários porque o build do macOS domina o tempo de execução mesmo quando está limpo.

### Categorias de Critical Quality

`CodeQL Critical Quality` é o shard correspondente que não é de segurança. Ele executa apenas consultas de qualidade JavaScript/TypeScript sem segurança e com severidade de erro sobre superfícies estreitas de alto valor em runners Linux hospedados pelo GitHub, para que as varreduras de qualidade não consumam orçamento de registro de runners Blacksmith. Sua guarda de pull request é intencionalmente menor que o perfil agendado: PRs que não são rascunho executam apenas os shards correspondentes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` e `plugin-sdk-reply-runtime` para mudanças em código de execução de comando/modelo/ferramenta do agente e despacho de resposta, esquema/migração/IO de configuração, Auth/segredos/sandbox/segurança, canal do core e runtime de Plugin de canal incluído, protocolo/método de servidor do Gateway, runtime de memória/cola do SDK, MCP/processo/entrega de saída, runtime de provedor/catálogo de modelos, diagnósticos de sessão/filas de entrega, carregador de Plugin, contrato de Plugin SDK/pacote ou runtime de resposta do Plugin SDK. Mudanças na configuração do CodeQL e no workflow de qualidade executam todos os doze shards de qualidade de PR.

O disparo manual aceita:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Os perfis estreitos são ganchos de ensino/iteração para executar um shard de qualidade isoladamente.

| Categoria                                              | Superfície                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, segredos, sandbox, Cron e código de limite de segurança do Gateway                                                                                          |
| `/codeql-critical-quality/config-boundary`              | Esquema de configuração, migração, normalização e contratos de IO                                                                                                  |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Esquemas de protocolo do Gateway e contratos de métodos de servidor                                                                                                |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementação do canal do core e do Plugin de canal incluído                                                                                          |
| `/codeql-critical-quality/agent-runtime-boundary`       | Execução de comandos, despacho de modelo/provedor, despacho e filas de resposta automática, e contratos de runtime do plano de controle ACP                         |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP e pontes de ferramentas, auxiliares de supervisão de processos e contratos de entrega de saída                                                       |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK do host de memória, facades de runtime de memória, aliases de memória do Plugin SDK, cola de ativação do runtime de memória e comandos doctor de memória       |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internos da fila de respostas, filas de entrega de sessão, auxiliares de vinculação/entrega de sessão de saída, superfícies de eventos diagnósticos/pacotes de logs e contratos de CLI doctor de sessão |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de respostas de entrada do Plugin SDK, auxiliares de payload/fragmentação/runtime de resposta, opções de resposta de canal, filas de entrega e auxiliares de vinculação de sessão/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalização do catálogo de modelos, Auth e descoberta de provedores, registro de runtime de provedor, padrões/catálogos de provedores e registros de web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap da Control UI, persistência local, fluxos de controle do Gateway e contratos de runtime do plano de controle de tarefas                                  |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Fetch/search web do core, IO de mídia, entendimento de mídia, geração de imagens e contratos de runtime de geração de mídia                                        |
| `/codeql-critical-quality/plugin-boundary`              | Contratos de carregador, registro, superfície pública e ponto de entrada do Plugin SDK                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Código-fonte publicado do Plugin SDK no lado do pacote e auxiliares de contrato de pacote de Plugin                                                               |

Qualidade permanece separada de segurança para que achados de qualidade possam ser agendados, medidos, desabilitados ou expandidos sem obscurecer o sinal de segurança. A expansão do CodeQL para Swift, Python e Plugins incluídos deve ser adicionada de volta como trabalho de acompanhamento escopado ou em shards somente depois que os perfis estreitos tiverem runtime e sinal estáveis.

## Workflows de manutenção

### Docs Agent

O workflow `Docs Agent` é uma trilha de manutenção Codex orientada por eventos para manter a documentação existente alinhada com mudanças incorporadas recentemente. Ele não tem agenda pura: uma execução de CI bem-sucedida de push não bot em `main` pode acioná-lo, e o disparo manual pode executá-lo diretamente. Invocações por workflow-run são ignoradas quando `main` avançou ou quando outra execução não ignorada do Docs Agent foi criada na última hora. Quando executado, ele revisa o intervalo de commits do SHA de origem anterior não ignorado do Docs Agent até o `main` atual, então uma execução horária pode cobrir todas as mudanças de main acumuladas desde a última passagem de documentação.

### Test Performance Agent

O workflow `Test Performance Agent` é uma trilha de manutenção Codex orientada por eventos para testes lentos. Ele não tem agenda pura: uma execução de CI bem-sucedida de push não bot em `main` pode acioná-lo, mas ele é ignorado se outra invocação por workflow-run já executou ou está executando naquele dia UTC. O disparo manual contorna esse gate de atividade diária. A trilha cria um relatório de performance Vitest agrupado da suíte completa, permite que o Codex faça apenas pequenas correções de performance de testes que preservem cobertura em vez de refatorações amplas, depois executa novamente o relatório da suíte completa e rejeita mudanças que reduzam a contagem de testes aprovados da linha de base. O relatório agrupado registra tempo de parede por configuração e RSS máximo no Linux e no macOS, então a comparação antes/depois expõe deltas de memória de testes ao lado de deltas de duração. Se a linha de base tiver testes com falha, o Codex pode corrigir apenas falhas óbvias e o relatório da suíte completa após o agente deve passar antes que qualquer coisa seja commitada. Quando `main` avança antes do push do bot ser incorporado, a trilha faz rebase do patch validado, executa novamente `pnpm check:changed` e tenta o push outra vez; patches obsoletos conflitantes são ignorados. Ela usa Ubuntu hospedado pelo GitHub para que a ação Codex possa manter a mesma postura de segurança drop-sudo do agente de documentação.

### PRs Duplicados Após Merge

O workflow `Duplicate PRs After Merge` é um workflow manual de mantenedor para limpeza de duplicatas pós-incorporação. Ele usa dry-run por padrão e só fecha PRs listados explicitamente quando `apply=true`. Antes de modificar o GitHub, ele verifica que o PR incorporado foi mesclado e que cada duplicata tem uma issue referenciada compartilhada ou hunks alterados sobrepostos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gates de verificação local e roteamento de mudanças

A lógica local de changed-lane fica em `scripts/changed-lanes.mjs` e é executada por `scripts/check-changed.mjs`. Esse gate de verificação local é mais rígido sobre limites de arquitetura que o escopo amplo da plataforma de CI:

- mudanças de produção do core executam typecheck de produção do core e de testes do core, mais lint/guardas do core;
- mudanças apenas de teste do core executam somente typecheck de testes do core mais lint do core;
- mudanças de produção de extensão executam typecheck de produção de extensão e de testes de extensão, mais lint de extensão;
- mudanças apenas de teste de extensão executam typecheck de testes de extensão mais lint de extensão;
- mudanças no Plugin SDK público ou no contrato de Plugin expandem para typecheck de extensões porque extensões dependem desses contratos do core (varreduras Vitest de extensões continuam sendo trabalho explícito de teste);
- incrementos de versão apenas de metadados de release executam verificações direcionadas de versão/configuração/dependência raiz;
- mudanças desconhecidas de raiz/configuração falham com segurança para todas as lanes de verificação.

O roteamento local de testes alterados fica em `scripts/test-projects.test-support.mjs` e é intencionalmente mais barato que `check:changed`: edições diretas de teste executam a si mesmas, edições de código-fonte preferem mapeamentos explícitos, depois testes irmãos e dependentes do grafo de imports. A configuração compartilhada de entrega em sala de grupo é um dos mapeamentos explícitos: mudanças na configuração de resposta visível em grupo, no modo de entrega de resposta de origem ou no prompt de sistema da ferramenta de mensagens passam pelos testes de resposta do core mais regressões de entrega do Discord e Slack, para que uma mudança de padrão compartilhado falhe antes do primeiro push de PR. Use `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` somente quando a mudança for ampla o suficiente no harness para que o conjunto mapeado barato não seja um proxy confiável.

## Validação Testbox

Crabbox é o wrapper de caixa remota pertencente ao repo para prova Linux de mantenedor. Use-o
a partir da raiz do repo quando uma verificação for ampla demais para um loop de edição local, quando a paridade
com CI importar, ou quando a prova precisar de segredos, Docker, lanes de pacote,
caixas reutilizáveis ou logs remotos. O backend normal do OpenClaw é
`blacksmith-testbox`; capacidade AWS/Hetzner própria é fallback para
interrupções do Blacksmith, problemas de cota ou testes explícitos com capacidade própria.

Execuções Blacksmith apoiadas por Crabbox aquecem, reivindicam, sincronizam, executam, relatam e limpam
Testboxes de uso único. A verificação de sanidade de sincronização integrada falha rapidamente quando arquivos
raiz obrigatórios, como `pnpm-lock.yaml`, desaparecem ou quando `git status --short`
mostra pelo menos 200 exclusões rastreadas. Para PRs intencionais com muitas exclusões, defina
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para o comando remoto.

O Crabbox também encerra uma invocação local da CLI do Blacksmith que permanece na
fase de sincronização por mais de cinco minutos sem saída pós-sincronização. Defina
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` para desativar essa proteção, ou use um valor maior
em milissegundos para diffs locais excepcionalmente grandes.

Antes de uma primeira execução, verifique o wrapper a partir da raiz do repositório:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

O wrapper do repositório recusa um binário Crabbox obsoleto que não anuncia `blacksmith-testbox`. Passe o provedor explicitamente, embora `.crabbox.yaml` tenha padrões de nuvem própria. Em worktrees Codex ou checkouts vinculados/esparsos, evite o script local `pnpm crabbox:run` porque o pnpm pode reconciliar dependências antes que o Crabbox inicie; invoque o wrapper node diretamente em vez disso:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Execuções apoiadas por Blacksmith exigem Crabbox 0.22.0 ou mais recente para que o wrapper obtenha o comportamento atual de sincronização, fila e limpeza do Testbox. Ao usar o checkout irmão, recompile o binário local ignorado antes de trabalho de medição ou prova:

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

Reexecução focada de teste:

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

Suite completa:

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

Leia o resumo JSON final. Os campos úteis são `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` e `totalMs`. Execuções Crabbox de uso único apoiadas por Blacksmith devem parar o Testbox automaticamente; se uma execução for interrompida ou a limpeza não estiver clara, inspecione as boxes ativas e pare apenas as boxes que você criou:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Use reutilização apenas quando você precisar intencionalmente de vários comandos na mesma box hidratada:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Se o Crabbox for a camada quebrada, mas o próprio Blacksmith funcionar, use Blacksmith direto
somente para diagnósticos como `list`, `status` e limpeza. Corrija o caminho do
Crabbox antes de tratar uma execução direta do Blacksmith como prova de mantenedor.

Se `blacksmith testbox list --all` e `blacksmith testbox status` funcionarem, mas novos
aquecimentos ficarem `queued` sem IP ou URL de execução do Actions após alguns minutos,
trate isso como pressão de provedor, fila, cobrança ou limite de organização do Blacksmith. Pare os
ids em fila que você criou, evite iniciar mais Testboxes e mova a prova para o
caminho de capacidade Crabbox própria abaixo enquanto alguém verifica o painel do Blacksmith,
a cobrança e os limites da organização.

Escalone para capacidade Crabbox própria somente quando o Blacksmith estiver fora do ar, limitado por cota, sem o ambiente necessário, ou quando capacidade própria for explicitamente o objetivo:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Sob pressão na AWS, evite `class=beast` a menos que a tarefa realmente precise de CPU de classe 48xlarge. Uma solicitação `beast` começa em 192 vCPUs e é a maneira mais fácil de acionar cotas regionais do EC2 Spot ou On-Demand Standard. O `.crabbox.yaml` de propriedade do repositório usa como padrão `standard`, várias regiões de capacidade e `capacity.hints: true`, de modo que leases AWS intermediados imprimam região/mercado selecionados, pressão de cota, fallback de Spot e avisos de classe sob alta pressão. Use `fast` para verificações amplas mais pesadas, `large` somente depois que standard/fast não forem suficientes, e `beast` apenas para lanes excepcionais limitadas por CPU, como suite completa ou matrizes Docker de todos os Plugins, validação explícita de release/bloqueador ou profiling de desempenho com muitos núcleos. Não use `beast` para `pnpm check:changed`, testes focados, trabalho somente de docs, lint/typecheck comuns, pequenas reproduções E2E ou triagem de indisponibilidade do Blacksmith. Use `--market on-demand` para diagnóstico de capacidade, para que a instabilidade do mercado Spot não seja misturada ao sinal.

`.crabbox.yaml` controla os padrões de provedor, sincronização e hidratação do GitHub Actions para lanes de nuvem própria. Ele exclui `.git` local para que o checkout hidratado do Actions mantenha seus próprios metadados Git remotos em vez de sincronizar remotos locais de mantenedor e armazenamentos de objetos, e exclui artefatos locais de runtime/build que nunca devem ser transferidos. `.github/workflows/crabbox-hydrate.yml` controla checkout, configuração de Node/pnpm, busca de `origin/main` e a transferência de ambiente sem segredos para comandos de nuvem própria `crabbox run --id <cbx_id>`.

## Relacionados

- [Visão geral da instalação](/pt-BR/install)
- [Canais de desenvolvimento](/pt-BR/install/development-channels)
