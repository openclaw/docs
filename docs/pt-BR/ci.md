---
read_when:
    - Você precisa entender por que um job de CI foi ou não executado
    - Você está depurando uma verificação com falha do GitHub Actions
    - Você está coordenando uma execução ou reexecução de validação de release
    - Você está alterando o despacho do ClawSweeper ou o encaminhamento de atividades do GitHub
summary: Grafo de jobs de CI, gates de escopo, guarda-chuvas de release e equivalentes de comandos locais
title: Pipeline de CI
x-i18n:
    generated_at: "2026-07-04T17:52:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af8650cc7f194a7770c0f997d3c7a6a8f0307a9ce0a00525250e6a853ddecef1
    source_path: ci.md
    workflow: 16
---

OpenClaw CI é executado em cada push para `main` e em cada pull request. Pushes canônicos para
`main` primeiro passam por uma janela de admissão de 90 segundos do executor hospedado.
O grupo de concorrência `CI` existente cancela essa execução em espera quando um commit
mais novo chega, então merges sequenciais não registram cada um uma matriz Blacksmith
completa. Pull requests e disparos manuais ignoram a espera. O job `preflight`
então classifica o diff e desativa lanes caras quando apenas áreas não relacionadas
mudaram. Execuções manuais de `workflow_dispatch` ignoram intencionalmente o escopo
inteligente e expandem o grafo completo para candidatos a lançamento e validação
ampla. Lanes Android continuam opt-in por meio de `include_android`. A cobertura de
Plugin apenas de lançamento fica no workflow separado [`Pré-lançamento de Plugin`](#plugin-prerelease)
e só é executada a partir de [`Validação Completa de Lançamento`](#full-release-validation)
ou de um disparo manual explícito.

## Visão geral do pipeline

| Job                                | Finalidade                                                                                                  | Quando é executado                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Detecta mudanças apenas em docs, escopos alterados, extensions alteradas e cria o manifesto de CI          | Sempre em pushes e PRs que não sejam rascunho       |
| `runner-admission`                 | Debounce hospedado de 90 segundos para pushes canônicos em `main` antes de o trabalho Blacksmith ser registrado | Toda execução de CI; espera apenas em pushes canônicos para `main` |
| `security-fast`                    | Detecção de chave privada, auditoria de workflow alterado via `zizmor` e auditoria de lockfile de produção | Sempre em pushes e PRs que não sejam rascunho       |
| `check-dependencies`               | Passagem do Knip apenas para dependências de produção mais a guarda da allowlist de arquivos não usados     | Mudanças relevantes para Node                       |
| `build-artifacts`                  | Cria `dist/`, Control UI, smoke checks da CLI compilada, checks de artefatos compilados incorporados e artefatos reutilizáveis | Mudanças relevantes para Node                       |
| `checks-fast-core`                 | Lanes rápidas de correção no Linux, como bundled, protocolo, QA Smoke CI e checks de roteamento de CI       | Mudanças relevantes para Node                       |
| `checks-fast-contracts-plugins-*`  | Dois checks fragmentados de contrato de Plugin                                                              | Mudanças relevantes para Node                       |
| `checks-fast-contracts-channels-*` | Dois checks fragmentados de contrato de canal                                                               | Mudanças relevantes para Node                       |
| `checks-node-core-*`               | Shards de testes Node centrais, excluindo lanes de canal, bundled, contrato e extension                     | Mudanças relevantes para Node                       |
| `check-*`                          | Equivalente fragmentado do gate local principal: tipos de produção, lint, guardas, tipos de teste e smoke estrito | Mudanças relevantes para Node                       |
| `check-additional-*`               | Arquitetura, drift fragmentado de limites/prompt, guardas de extension, limite de pacote e topologia de runtime | Mudanças relevantes para Node                       |
| `checks-node-compat-node22`        | Build de compatibilidade com Node 22 e lane de smoke                                                        | Disparo manual de CI para lançamentos               |
| `check-docs`                       | Formatação, lint e checks de links quebrados dos docs                                                       | Docs alterados                                      |
| `skills-python`                    | Ruff + pytest para Skills baseadas em Python                                                               | Mudanças relevantes para Skills Python              |
| `checks-windows`                   | Testes de processo/caminho específicos do Windows mais regressões compartilhadas de especificador de importação de runtime | Mudanças relevantes para Windows                    |
| `macos-node`                       | Lane de testes TypeScript do macOS usando os artefatos compilados compartilhados                            | Mudanças relevantes para macOS                      |
| `macos-swift`                      | Lint, build e testes Swift para o app macOS                                                                 | Mudanças relevantes para macOS                      |
| `ios-build`                        | Geração de projeto Xcode mais build do app iOS no simulador                                                 | App iOS, kit de app compartilhado ou mudanças no Swabble |
| `android`                          | Testes unitários Android para ambos os flavors mais um build de APK debug                                   | Mudanças relevantes para Android                    |
| `test-performance-agent`           | Otimização diária de testes lentos do Codex após atividade confiável                                        | Sucesso da CI principal ou disparo manual           |
| `openclaw-performance`             | Relatórios diários/sob demanda de desempenho do runtime Kova com lanes mock-provider, deep-profile e GPT 5.5 live | Agendado e disparo manual                           |

## Ordem de falha rápida

1. `runner-admission` espera apenas por pushes canônicos em `main`; um push mais novo cancela a execução antes do registro no Blacksmith.
2. `preflight` decide quais lanes sequer existem. A lógica `docs-scope` e `changed-scope` são etapas dentro deste job, não jobs independentes.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` e `skills-python` falham rapidamente sem esperar pelos jobs mais pesados de artefatos e matriz de plataformas.
4. `build-artifacts` se sobrepõe às lanes rápidas de Linux para que consumidores downstream possam começar assim que o build compartilhado estiver pronto.
5. Lanes mais pesadas de plataforma e runtime se expandem depois disso: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` e `android`.

O GitHub pode marcar jobs substituídos como `cancelled` quando um push mais novo chega ao mesmo PR ou ref `main`. Trate isso como ruído de CI, a menos que a execução mais nova para a mesma ref também esteja falhando. Jobs de matriz usam `fail-fast: false`, e `build-artifacts` relata falhas incorporadas de channel, core-support-boundary e gateway-watch diretamente em vez de enfileirar pequenos jobs verificadores. A chave automática de concorrência de CI é versionada (`CI-v7-*`) para que uma execução zumbi do lado do GitHub em um grupo de fila antigo não bloqueie indefinidamente execuções mais novas da main. Execuções manuais da suíte completa usam `CI-manual-v1-*` e não cancelam execuções em andamento.

Use `pnpm ci:timings`, `pnpm ci:timings:recent` ou `node scripts/ci-run-timings.mjs <run-id>` para resumir tempo de parede, tempo de fila, jobs mais lentos, falhas e a barreira de fanout `pnpm-store-warmup` do GitHub Actions. A CI também faz upload do mesmo resumo da execução como artefato `ci-timings-summary`. Para tempo de build, verifique a etapa `Build dist` do job `build-artifacts`: `pnpm build:ci-artifacts` imprime `[build-all] phase timings:` e inclui `ui:build`; o job também faz upload do artefato `startup-memory`.

Para execuções de pull request, o job terminal de resumo de tempos executa o helper a partir da revisão base confiável antes de passar `GH_TOKEN` para `gh run view`. Isso mantém a consulta com token fora do código controlado pela branch, enquanto ainda resume a execução de CI atual do pull request.

## Contexto e evidência de PR

PRs de contribuidores externos executam um gate de contexto e evidência de PR a partir de
`.github/workflows/real-behavior-proof.yml`. O workflow faz checkout do commit base confiável
e avalia apenas o corpo do PR; ele não executa código da branch do contribuidor.

O gate se aplica a autores de PR que não são proprietários do repositório, membros,
colaboradores ou bots. Ele passa quando o corpo do PR contém seções autorais
`What Problem This Solves` e `Evidence`. Evidência pode ser um teste focado,
resultado de CI, captura de tela, gravação, saída de terminal, observação live,
log redigido ou link de artefato. O corpo fornece intenção e validação útil;
revisores inspecionam o código, os testes e a CI para avaliar a correção.

Quando o check falhar, atualize o corpo do PR em vez de enviar outro commit de código.

## Escopo e roteamento

A lógica de escopo fica em `scripts/ci-changed-scope.mjs` e é coberta por testes unitários em `src/scripts/ci-changed-scope.test.ts`. O disparo manual ignora a detecção de escopo alterado e faz o manifesto de preflight agir como se toda área com escopo tivesse mudado.

- **Edições de workflow de CI** validam o grafo de CI do Node mais linting de workflow, mas não forçam builds nativos de Windows, iOS, Android ou macOS por si só; essas lanes de plataforma continuam restritas a mudanças de código-fonte de plataforma.
- **Workflow Sanity** executa `actionlint`, `zizmor` em todos os arquivos YAML de workflow, a guarda de interpolação de ação composta e a guarda de marcadores de conflito. O job `security-fast` com escopo de PR também executa `zizmor` sobre arquivos de workflow alterados, para que achados de segurança de workflow falhem cedo no grafo principal de CI.
- **Docs em pushes para `main`** são verificados pelo workflow independente `Docs` com o mesmo espelho de docs do ClawHub usado pela CI, então pushes mistos de código+docs não enfileiram também o shard `check-docs` da CI. Pull requests e CI manual ainda executam `check-docs` a partir da CI quando docs mudaram.
- **TUI PTY** é executado no shard Linux Node `checks-node-core-runtime-tui-pty` para mudanças de TUI. O shard executa `test/vitest/vitest.tui-pty.config.ts` com `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, então cobre tanto a lane determinística de fixture `TuiBackend` quanto o smoke mais lento `tui --local`, que simula apenas o endpoint de modelo externo.
- **Edições apenas de roteamento de CI, edições selecionadas de fixtures baratas de testes core e edições estreitas de helper/roteamento de testes de contrato de Plugin** usam um caminho rápido de manifesto apenas Node: `preflight`, segurança e uma única tarefa `checks-fast-core`. Esse caminho ignora artefatos de build, compatibilidade com Node 22, contratos de canal, shards core completos, shards de Plugin bundled e matrizes adicionais de guardas quando a mudança é limitada às superfícies de roteamento ou helper que a tarefa rápida exercita diretamente.
- **Checks Node do Windows** são restritos a wrappers de processo/caminho específicos do Windows, helpers de executor npm/pnpm/UI, config de gerenciador de pacotes e superfícies de workflow de CI que executam essa lane; mudanças não relacionadas de código-fonte, Plugin, install-smoke e apenas testes ficam nas lanes Linux Node.

As famílias de testes Node mais lentas são divididas ou balanceadas para que cada job permaneça pequeno sem reservar runners em excesso: contratos de plugins e contratos de canais rodam cada um como dois shards ponderados com suporte do Blacksmith e fallback para o runner padrão do GitHub, as lanes rápidas/de suporte de unidade do core rodam separadamente, a infraestrutura de runtime do core é dividida entre estado, processo/configuração, compartilhado e três shards de domínio cron, a resposta automática roda como workers balanceados (com a subárvore de resposta dividida em shards de executor de agente, despacho e comandos/roteamento de estado), e as configurações agentivas de gateway/servidor são divididas entre lanes de chat/autenticação/modelo/http-plugin/runtime/inicialização em vez de esperar por artefatos construídos. A CI normal então empacota apenas shards isolados de padrões de inclusão de infraestrutura em pacotes determinísticos de no máximo 64 arquivos de teste, reduzindo a matriz Node sem mesclar suítes não isoladas de comandos/cron, agents-core com estado ou gateway/servidor; suítes fixas pesadas permanecem em 8 vCPU, enquanto as lanes empacotadas e de menor peso usam 4 vCPU. Pull requests no repositório canônico usam um plano adicional compacto de admissão: os mesmos grupos por configuração rodam em subprocessos isolados dentro do plano Linux Node atual de 34 jobs, de modo que um único PR não registre a matriz Node completa com mais de 70 jobs. Pushes para `main`, despachos manuais e gates de release mantêm a matriz completa. Testes amplos de navegador, QA, mídia e plugins diversos usam suas configurações Vitest dedicadas em vez do catch-all compartilhado de plugins. Shards de padrões de inclusão registram entradas de temporização usando o nome do shard de CI, para que `.artifacts/vitest-shard-timings.json` possa distinguir uma configuração inteira de um shard filtrado. `check-additional-*` mantém juntos o trabalho de compilação/canário de limites de pacote e separa a arquitetura de topologia de runtime da cobertura de observação do Gateway; a lista de guardas de limites é listrada em um shard pesado em prompts e um shard combinado para as listras de guardas restantes, cada um executando guardas independentes selecionados em paralelo e imprimindo tempos por verificação. A verificação cara de drift de snapshot de prompt do caminho feliz do Codex roda como seu próprio job adicional apenas para CI manual e para mudanças que afetam prompts, de modo que mudanças Node normais não relacionadas não esperem atrás da geração fria de snapshots de prompt e os shards de limites permaneçam balanceados, enquanto o drift de prompt ainda fica vinculado ao PR que o causou; a mesma flag pula a geração Vitest de snapshot de prompt dentro do shard de limite de suporte do core com artefato construído. Observação do Gateway, testes de canais e o shard de limite de suporte do core rodam em paralelo dentro de `build-artifacts` depois que `dist/` e `dist-runtime/` já estão construídos.

Depois de admitida, a CI Linux canônica permite até 24 jobs de teste Node simultâneos e
12 para as lanes menores rápidas/de verificação; Windows e Android permanecem em dois porque
esses pools de runners são mais estreitos.

O plano compacto de PR emite 18 jobs Node para a suíte atual: grupos de configuração inteira
são agrupados em subprocessos isolados com timeout de lote de 120 minutos,
enquanto grupos de padrões de inclusão compartilham o mesmo orçamento limitado de jobs.

A CI Android executa tanto `testPlayDebugUnitTest` quanto `testThirdPartyDebugUnitTest` e depois constrói o APK debug Play. O flavor de terceiros não tem source set nem manifesto separado; sua lane de testes unitários ainda compila o flavor com as flags BuildConfig de SMS/log de chamadas, evitando ao mesmo tempo um job duplicado de empacotamento de APK debug em todo push relevante para Android.

O shard `check-dependencies` executa `pnpm deadcode:dependencies` (uma passagem Knip de produção somente para dependências fixada na versão mais recente do Knip, com a idade mínima de lançamento do pnpm desativada para a instalação `dlx`) e `pnpm deadcode:unused-files`, que compara os achados de arquivos não usados em produção do Knip com `scripts/deadcode-unused-files.allowlist.mjs`. O guarda de arquivos não usados falha quando um PR adiciona um novo arquivo não usado sem revisão ou deixa uma entrada obsoleta na allowlist, preservando ao mesmo tempo superfícies intencionais de plugins dinâmicos, geradas, de build, de teste live e de ponte de pacotes que o Knip não consegue resolver estaticamente.

## Encaminhamento de atividade do ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` é a ponte do lado de destino da atividade do repositório OpenClaw para o ClawSweeper. Ele não faz checkout nem executa código de pull request não confiável. O workflow cria um token de GitHub App a partir de `CLAWSWEEPER_APP_PRIVATE_KEY` e então despacha payloads compactos de `repository_dispatch` para `openclaw/clawsweeper`.

O workflow tem quatro lanes:

- `clawsweeper_item` para solicitações exatas de revisão de issues e pull requests;
- `clawsweeper_comment` para comandos explícitos do ClawSweeper em comentários de issues;
- `clawsweeper_commit_review` para solicitações de revisão em nível de commit em pushes para `main`;
- `github_activity` para atividade geral do GitHub que o agente ClawSweeper pode inspecionar.

A lane `github_activity` encaminha apenas metadados normalizados: tipo de evento, ação, ator, repositório, número do item, URL, título, estado e trechos curtos de comentários ou revisões quando presentes. Ela evita intencionalmente encaminhar o corpo completo do Webhook. O workflow receptor em `openclaw/clawsweeper` é `.github/workflows/github-activity.yml`, que publica o evento normalizado no hook do OpenClaw Gateway para o agente ClawSweeper.

Atividade geral é observação, não entrega por padrão. O agente ClawSweeper recebe o destino Discord em seu prompt e deve publicar em `#clawsweeper` somente quando o evento for surpreendente, acionável, arriscado ou operacionalmente útil. Aberturas rotineiras, edições, ruído de bots, ruído duplicado de Webhook e tráfego normal de revisão devem resultar em `NO_REPLY`.

Trate títulos, comentários, corpos, texto de revisão, nomes de branches e mensagens de commit do GitHub como dados não confiáveis em todo esse caminho. Eles são entrada para sumarização e triagem, não instruções para o workflow ou runtime do agente.

## Despachos manuais

Despachos manuais de CI executam o mesmo grafo de jobs da CI normal, mas forçam toda lane com escopo não Android a ficar ativa: shards Linux Node, shards de plugins empacotados, shards de contratos de plugins e canais, compatibilidade Node 22, `check-*`, `check-additional-*`, verificações smoke de artefatos construídos, verificações de docs, Skills Python, Windows, macOS, build iOS e i18n da Control UI. Despachos manuais independentes de CI executam Android apenas com `include_android=true`; o guarda-chuva de release completo habilita Android passando `include_android=true`. Verificações estáticas de pré-release de plugins, o shard somente de release `agentic-plugins`, a varredura completa em lote de extensões e lanes Docker de pré-release de plugins são excluídos da CI. A suíte Docker de pré-release roda somente quando `Full Release Validation` despacha o workflow separado `Plugin Prerelease` com o gate de validação de release habilitado.

Execuções manuais usam um grupo de concorrência exclusivo para que uma suíte completa de candidato a release não seja cancelada por outro push ou execução de PR na mesma ref. A entrada opcional `target_ref` permite que um chamador confiável execute esse grafo contra uma branch, tag ou SHA completo de commit enquanto usa o arquivo de workflow da ref de despacho selecionada.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

O caminho monthly npm-only extended-stable é a exceção: despache tanto o preflight `OpenClaw NPM
Release` quanto `Full Release Validation` a partir da branch exata
`extended-stable/YYYY.M.33`, preserve seus IDs de execução e passe ambos os IDs para a
execução direta de publicação npm. Consulte [Publicação monthly npm-only extended-stable
](/pt-BR/reference/RELEASING#monthly-npm-only-extended-stable-publication) para
os comandos, requisitos exatos de identidade, leitura de volta do registry e procedimento de
reparo do seletor. Esse caminho não despacha publicação de plugins, macOS, Windows, GitHub
Release, dist-tag privado ou outra plataforma.

## Runners

| Runner                          | Jobs                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | Despacho manual de CI e fallbacks de repositórios não canônicos, varreduras de qualidade CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, workflows de docs fora da CI e preflight install-smoke para que a matriz Blacksmith possa entrar na fila mais cedo                         |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, shards de extensões de menor peso, `checks-fast-core` exceto QA Smoke CI, shards de contratos de plugins/canais, a maioria dos shards Linux Node empacotados/de menor peso, `check-guards`, `check-prod-types`, `check-test-types`, shards `check-additional-*` selecionados e `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Suítes Linux Node pesadas retidas, shards `check-additional-*` pesados em limites/extensões e `android`                                                                                                                                                                                                 |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI, `build-artifacts` na CI e Testbox, `check-lint` (sensível a CPU o bastante para que 8 vCPU custassem mais do que economizavam); builds Docker install-smoke (o custo de tempo de fila de 32 vCPU era maior do que a economia)                                                            |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-15`     | `macos-node` em `openclaw/openclaw`; forks fazem fallback para `macos-15`                                                                                                                                                                                                                               |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` e `ios-build` em `openclaw/openclaw`; forks fazem fallback para `macos-26`                                                                                                                                                                                                                |

## Orçamento de registro de runners

O bucket atual de registro de runners do GitHub do OpenClaw informa 10.000 registros de
runners self-hosted por 5 minutos em `ghx api rate_limit`. Verifique novamente
`actions_runner_registration` antes de cada rodada de ajuste porque o GitHub pode alterar
esse bucket. O limite é compartilhado por todos os registros de runners Blacksmith na
organização `openclaw`, portanto adicionar outra instalação Blacksmith não adiciona
um novo bucket.

Trate os labels do Blacksmith como o recurso escasso para controle de rajadas. Jobs que
apenas roteiam, notificam, resumem, selecionam shards ou executam varreduras curtas do CodeQL devem
permanecer em runners hospedados pelo GitHub, a menos que tenham necessidades específicas do Blacksmith
medidas. Qualquer nova matriz Blacksmith, `max-parallel` maior ou workflow de alta frequência
deve mostrar sua contagem de registros no pior caso e manter o alvo em nível de organização
abaixo de cerca de 60% do bucket vivo. Com o bucket atual de 10.000 registros,
isso significa um alvo operacional de 6.000 registros, deixando folga para
repositórios simultâneos, novas tentativas e sobreposição de rajadas.

A CI do repositório canônico mantém o Blacksmith como o caminho padrão de runner para execuções normais de push e pull request. `workflow_dispatch` e execuções de repositórios não canônicos usam runners hospedados pelo GitHub, mas execuções canônicas normais atualmente não sondam a saúde da fila do Blacksmith nem fazem fallback automaticamente para labels hospedados pelo GitHub quando o Blacksmith está indisponível.

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

O disparo manual normalmente mede o desempenho do ref do fluxo de trabalho. Defina `target_ref` para medir uma tag de lançamento ou outro branch com a implementação atual do fluxo de trabalho. Os caminhos de relatórios publicados e os ponteiros mais recentes são indexados pelo ref testado, e cada `index.md` registra o ref/SHA testado, o ref/SHA do fluxo de trabalho, o ref do Kova, o perfil, o modo de autenticação da lane, o modelo, a contagem de repetições e os filtros de cenário.

O fluxo de trabalho instala o OCM a partir de um lançamento fixado e o Kova a partir de `openclaw/Kova` no input `kova_ref` fixado, depois executa três lanes:

- `mock-provider`: cenários de diagnóstico do Kova contra um runtime de build local com autenticação falsa determinística compatível com OpenAI.
- `mock-deep-profile`: perfilamento de CPU/heap/trace para hotspots de inicialização, Gateway e turno de agente.
- `live-openai-candidate`: um turno de agente real da OpenAI `openai/gpt-5.5`, ignorado quando `OPENAI_API_KEY` não está disponível.

A lane mock-provider também executa sondagens de origem nativas do OpenClaw depois da passagem do Kova: tempo e memória de inicialização do Gateway nos casos de inicialização padrão, com hook e com 50 plugins; RSS de importação de plugin empacotado, loops repetidos de hello `channel-chat-baseline` com mock-OpenAI, comandos de inicialização da CLI contra o Gateway iniciado e a sondagem de desempenho smoke de estado SQLite. Quando o relatório de origem mock-provider publicado anteriormente está disponível para o ref testado, o resumo de origem compara os valores atuais de RSS e heap com essa linha de base e marca grandes aumentos de RSS como `watch`. O resumo Markdown da sondagem de origem fica em `source/index.md` no pacote do relatório, com o JSON bruto ao lado.

Cada lane envia artefatos para o GitHub. Quando `CLAWGRIT_REPORTS_TOKEN` está configurado, o fluxo de trabalho também faz commit de `report.json`, `report.md`, pacotes, `index.md` e artefatos de sondagem de origem em `openclaw/clawgrit-reports` sob `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. O ponteiro atual do ref testado é gravado como `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validação completa de lançamento

`Full Release Validation` é o fluxo de trabalho manual abrangente para "executar tudo antes do lançamento". Ele aceita um branch, tag ou SHA completo de commit, dispara o fluxo de trabalho manual `CI` com esse alvo, dispara `Plugin Prerelease` para prova somente de lançamento de plugin/pacote/estática/Docker e dispara `OpenClaw Release Checks` para smoke de instalação, aceitação de pacote, verificações de pacote entre sistemas operacionais, renderização do scorecard de maturidade a partir de evidências de perfil de QA, paridade do QA Lab, Matrix e lanes do Telegram. Os perfis estável e completo sempre incluem cobertura exaustiva live/E2E e soak do caminho de lançamento Docker; o perfil beta pode optar por isso com `run_release_soak=true`. O E2E canônico de Telegram do pacote é executado dentro de Package Acceptance, então um candidato completo não inicia um poller live duplicado. Após a publicação, passe `release_package_spec` para reutilizar o pacote npm enviado nas verificações de lançamento, Package Acceptance, Docker, entre sistemas operacionais e Telegram sem reconstruir. Use `npm_telegram_package_spec` somente para uma nova execução focada de Telegram com pacote publicado. A lane de pacote live do plugin Codex usa o mesmo estado selecionado por padrão: `release_package_spec=openclaw@<tag>` publicado deriva `codex_plugin_spec=npm:@openclaw/codex@<tag>`, enquanto execuções por SHA/artefato empacotam `extensions/codex` a partir do ref selecionado. Defina `codex_plugin_spec` explicitamente para fontes de plugin personalizadas, como specs `npm:`, `npm-pack:` ou `git:`.

Consulte [validação completa de lançamento](/pt-BR/reference/full-release-validation) para a
matriz de estágios, nomes exatos dos jobs do fluxo de trabalho, diferenças entre perfis, artefatos e
identificadores de nova execução focada.

`OpenClaw Release Publish` é o fluxo de trabalho manual mutável de lançamento. Dispare-o
a partir de `release/YYYY.M.PATCH` ou `main` depois que a tag de lançamento existir e depois que o
preflight npm do OpenClaw tiver sido bem-sucedido. Ele verifica `pnpm plugins:sync:check`,
dispara `Plugin NPM Release` para todos os pacotes de plugin publicáveis, dispara
`Plugin ClawHub Release` para o mesmo SHA de lançamento e só então dispara
`OpenClaw NPM Release` com o `preflight_run_id` salvo. A publicação estável também
exige um `windows_node_tag` exato; o fluxo de trabalho verifica o lançamento de origem do Windows
e compara seus instaladores x64/ARM64 com o input
`windows_node_installer_digests` aprovado para o candidato antes de qualquer filho de publicação, depois promove
e verifica esses mesmos digests de instalador fixados, além do ativo complementar exato
e do contrato de checksum antes de publicar o rascunho do lançamento no GitHub.

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

Refs de disparo de fluxo de trabalho do GitHub devem ser branches ou tags, não SHAs brutos de commit. O
helper envia um branch temporário `release-ci/<sha>-...` no SHA alvo,
dispara `Full Release Validation` a partir desse ref fixado, verifica se o `headSha` de cada fluxo de trabalho
filho corresponde ao alvo e exclui o branch temporário quando a
execução é concluída. O verificador abrangente também falha se qualquer fluxo de trabalho filho for executado em um
SHA diferente.

`release_profile` controla a amplitude live/provedor passada para as verificações de lançamento. Os
fluxos de trabalho manuais de lançamento usam `stable` por padrão; use `full` somente quando você
quiser intencionalmente a matriz ampla consultiva de provedor/mídia. As verificações de lançamento
estável e completo sempre executam o soak exaustivo live/E2E e do caminho de lançamento Docker;
o perfil beta pode optar por isso com `run_release_soak=true`.

- `minimum` mantém as lanes OpenAI/core críticas para lançamento mais rápidas.
- `stable` adiciona o conjunto estável de provedores/backends.
- `full` executa a matriz ampla consultiva de provedor/mídia.

O abrangente registra os ids das execuções filhas disparadas, e o job final `Verify full validation` verifica novamente as conclusões atuais das execuções filhas e anexa tabelas dos jobs mais lentos para cada execução filha. Se um fluxo de trabalho filho for reexecutado e ficar verde, reexecute somente o job verificador pai para atualizar o resultado abrangente e o resumo de tempos.

Para recuperação, tanto `Full Release Validation` quanto `OpenClaw Release Checks` aceitam `rerun_group`. Use `all` para um candidato a lançamento, `ci` apenas para o filho normal de CI completo, `plugin-prerelease` apenas para o filho de pré-lançamento de plugin, `release-checks` para todos os filhos de lançamento ou um grupo mais estreito: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` no abrangente. Isso mantém limitada a nova execução de uma caixa de lançamento com falha após uma correção focada. Para uma lane entre sistemas operacionais com falha, combine `rerun_group=cross-os` com `cross_os_suite_filter`, por exemplo `windows/packaged-upgrade`; comandos longos entre sistemas operacionais emitem linhas de Heartbeat, e resumos packaged-upgrade incluem tempos por fase. As lanes de QA das verificações de lançamento são consultivas, exceto o gate padrão de cobertura de ferramentas de runtime, que bloqueia quando ferramentas dinâmicas obrigatórias do OpenClaw divergem ou desaparecem do resumo do nível padrão.

`OpenClaw Release Checks` usa o ref confiável do fluxo de trabalho para resolver o ref selecionado uma vez em um tarball `release-package-under-test`, depois passa esse artefato para verificações entre sistemas operacionais e Package Acceptance, além do fluxo de trabalho Docker live/E2E do caminho de lançamento quando a cobertura soak é executada. Isso mantém os bytes do pacote consistentes entre caixas de lançamento e evita reempacotar o mesmo candidato em vários jobs filhos. Para a lane live do plugin npm Codex, as verificações de lançamento passam uma spec de plugin publicado correspondente derivada de `release_package_spec`, passam o `codex_plugin_spec` fornecido pelo operador ou deixam o input em branco para que o script Docker empacote o plugin Codex do checkout selecionado.

Execuções duplicadas de `Full Release Validation` para `ref=main` e `rerun_group=all`
substituem o abrangente mais antigo. O monitor pai cancela qualquer fluxo de trabalho filho que
já tenha disparado quando o pai é cancelado, então uma validação mais nova em main
não fica atrás de uma execução obsoleta de duas horas de verificações de lançamento. Validações de branch/tag
de lançamento e grupos de nova execução focada mantêm `cancel-in-progress: false`.

## Shards live e E2E

O filho live/E2E de lançamento mantém cobertura ampla nativa de `pnpm test:live`, mas a executa como shards nomeados por meio de `scripts/test-live-shard.mjs` em vez de um único job serial:

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
- shards divididos de mídia áudio/vídeo e shards de música filtrados por provedor

Isso mantém a mesma cobertura de arquivos enquanto torna falhas lentas de provedor live mais fáceis de reexecutar e diagnosticar. Os nomes de shard agregados `native-live-extensions-o-z`, `native-live-extensions-media` e `native-live-extensions-media-music` continuam válidos para novas execuções manuais únicas.

Os shards nativos de mídia live são executados em `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, criado pelo fluxo de trabalho `Live Media Runner Image`. Essa imagem pré-instala `ffmpeg` e `ffprobe`; os jobs de mídia apenas verificam os binários antes da configuração. Mantenha suítes live com suporte Docker em runners Blacksmith normais: jobs em container são o lugar errado para iniciar testes Docker aninhados.

Fragmentos de modelo/backend ao vivo com suporte de Docker usam uma imagem compartilhada separada `ghcr.io/openclaw/openclaw-live-test:<sha>` por commit selecionado. O fluxo de trabalho de release ao vivo cria e envia essa imagem uma vez; depois, os fragmentos de modelo ao vivo Docker, Gateway fragmentado por provedor, backend da CLI, bind ACP e harness do Codex rodam com `OPENCLAW_SKIP_DOCKER_BUILD=1`. Fragmentos Docker do Gateway carregam limites explícitos de `timeout` no nível do script abaixo do timeout da tarefa do fluxo de trabalho, para que um contêiner travado ou caminho de limpeza falhe rapidamente em vez de consumir todo o orçamento de verificação da release. Se esses fragmentos reconstruírem o alvo Docker completo do código-fonte de forma independente, a execução de release está mal configurada e desperdiçará tempo de relógio em compilações duplicadas de imagem.

## Aceitação de Pacote

Use `Package Acceptance` quando a pergunta for "este pacote instalável do OpenClaw funciona como produto?" Ela é diferente da CI normal: a CI normal valida a árvore de código-fonte, enquanto a aceitação de pacote valida um único tarball pelo mesmo harness E2E Docker que os usuários exercitam após instalar ou atualizar.

### Tarefas

1. `resolve_package` faz checkout de `workflow_ref`, resolve um candidato de pacote, grava `.artifacts/docker-e2e-package/openclaw-current.tgz`, grava `.artifacts/docker-e2e-package/package-candidate.json`, envia ambos como o artefato `package-under-test` e imprime a origem, ref do fluxo de trabalho, ref do pacote, versão, SHA-256 e perfil no resumo da etapa do GitHub.
2. `docker_acceptance` chama `openclaw-live-and-e2e-checks-reusable.yml` com `ref=workflow_ref` e `package_artifact_name=package-under-test`. O fluxo de trabalho reutilizável baixa esse artefato, valida o inventário do tarball, prepara imagens Docker com digest do pacote quando necessário e executa as faixas Docker selecionadas contra esse pacote em vez de empacotar o checkout do fluxo de trabalho. Quando um perfil seleciona múltiplas `docker_lanes` direcionadas, o fluxo de trabalho reutilizável prepara o pacote e as imagens compartilhadas uma vez; depois, distribui essas faixas como tarefas Docker direcionadas paralelas com artefatos únicos.
3. `package_telegram` opcionalmente chama `NPM Telegram Beta E2E`. Ele roda quando `telegram_mode` não é `none` e instala o mesmo artefato `package-under-test` quando a Aceitação de Pacote resolveu um; o dispatch independente do Telegram ainda pode instalar uma especificação npm publicada.
4. `summary` falha o fluxo de trabalho se a resolução do pacote, a aceitação Docker ou a faixa opcional do Telegram falhar.

### Fontes candidatas

- `source=npm` aceita apenas `openclaw@beta`, `openclaw@latest` ou uma versão exata de release do OpenClaw, como `openclaw@2026.4.27-beta.2`. Use isso para aceitação de pré-release/stable publicada.
- `source=ref` empacota um branch, tag ou SHA completo de commit confiável em `package_ref`. O resolvedor busca branches/tags do OpenClaw, verifica se o commit selecionado é alcançável pelo histórico de branch do repositório ou por uma tag de release, instala dependências em uma worktree destacada e o empacota com `scripts/package-openclaw-for-docker.mjs`.
- `source=url` baixa um `.tgz` HTTPS público; `package_sha256` é obrigatório. Esse caminho rejeita credenciais em URL, portas HTTPS não padrão, nomes de host ou IPs resolvidos privados/internos/de uso especial e redirecionamentos fora da mesma política pública de segurança.
- `source=trusted-url` baixa um `.tgz` HTTPS de uma política de fonte confiável nomeada em `.github/package-trusted-sources.json`; `package_sha256` e `trusted_source_id` são obrigatórios. Use isso apenas para mirrors empresariais mantidos por mantenedores ou repositórios de pacotes privados que precisam de hosts, portas, prefixos de caminho, hosts de redirecionamento ou resolução de rede privada configurados. Se a política declarar autenticação bearer, o fluxo de trabalho usa o segredo fixo `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; credenciais embutidas na URL ainda são rejeitadas.
- `source=artifact` baixa um `.tgz` de `artifact_run_id` e `artifact_name`; `package_sha256` é opcional, mas deve ser fornecido para artefatos compartilhados externamente.

Mantenha `workflow_ref` e `package_ref` separados. `workflow_ref` é o código confiável do fluxo de trabalho/harness que executa o teste. `package_ref` é o commit de origem que é empacotado quando `source=ref`. Isso permite que o harness de teste atual valide commits de origem confiáveis mais antigos sem executar lógica antiga de fluxo de trabalho.

### Perfis de suíte

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` mais `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — blocos completos de caminho de release Docker com OpenWebUI
- `custom` — `docker_lanes` exatas; obrigatório quando `suite_profile=custom`

O perfil `package` usa cobertura offline de plugins, para que a validação de pacote publicado não seja bloqueada pela disponibilidade ao vivo do ClawHub. A faixa opcional do Telegram reutiliza o artefato `package-under-test` em `NPM Telegram Beta E2E`, mantendo o caminho de especificação npm publicada para dispatches independentes.

Para a política dedicada de teste de atualização e plugins, incluindo comandos locais,
faixas Docker, entradas de Aceitação de Pacote, padrões de release e triagem de falhas,
consulte [Testando atualizações e plugins](/pt-BR/help/testing-updates-plugins).

As verificações de release chamam Aceitação de Pacote com `source=artifact`, o artefato de pacote de release preparado, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` e `telegram_mode=mock-openai`. Isso mantém a migração de pacote, atualização, instalação de skill ao vivo do ClawHub, limpeza de dependência de plugin obsoleta, reparo de instalação de plugin configurado, plugin offline, atualização de plugin e prova do Telegram no mesmo tarball de pacote resolvido. Defina `release_package_spec` em Validação Completa de Release ou Verificações de Release do OpenClaw após publicar uma beta para executar a mesma matriz contra o pacote npm enviado sem reconstruir; defina `package_acceptance_package_spec` apenas quando a Aceitação de Pacote precisar de um pacote diferente do restante da validação de release. Verificações de release entre sistemas operacionais ainda cobrem onboarding, instalador e comportamento de plataforma específicos de OS; a validação de produto de pacote/atualização deve começar com Aceitação de Pacote. A faixa Docker `published-upgrade-survivor` valida uma linha de base de pacote publicado por execução no caminho bloqueante de release. Na Aceitação de Pacote, o tarball `package-under-test` resolvido é sempre o candidato e `published_upgrade_survivor_baseline` seleciona a linha de base publicada de fallback, com padrão `openclaw@latest`; comandos de reexecução de faixas com falha preservam essa linha de base. A Validação Completa de Release com `run_release_soak=true` ou `release_profile=full` define `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` e `published_upgrade_survivor_scenarios=reported-issues` para expandir pelas quatro releases npm stable mais recentes, além de releases fixadas de limite de compatibilidade de plugin e fixtures em formato de issue para configuração do Feishu, arquivos preservados de bootstrap/persona, instalações configuradas de plugin do OpenClaw, caminhos de log com til e raízes de dependência de plugin legado obsoletas. Seleções multi-linha de base de sobrevivente de upgrade publicado são fragmentadas por linha de base em tarefas separadas de executor Docker direcionado. O fluxo de trabalho separado `Update Migration` usa a faixa Docker `update-migration` com `all-since-2026.4.23` e `plugin-deps-cleanup` quando a pergunta é limpeza exaustiva de atualização publicada, não a amplitude normal de CI de Release Completa. Execuções agregadas locais podem passar especificações exatas de pacote com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, manter uma única faixa com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, como `openclaw@2026.4.15`, ou definir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para a matriz de cenários. A faixa publicada configura a linha de base com uma receita incorporada de comando `openclaw config set`, registra as etapas da receita em `summary.json` e sonda `/healthz`, `/readyz` e o status RPC após o início do Gateway. As faixas novas de pacote Windows e instalador também verificam que um pacote instalado consegue importar uma substituição de controle de navegador de um caminho Windows absoluto bruto. O smoke de turno de agente OpenAI entre sistemas operacionais usa como padrão `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando definido; caso contrário, `openai/gpt-5.5`, para que a prova de instalação e Gateway permaneça em um modelo de teste GPT-5 enquanto evita padrões GPT-4.x.

### Janelas de compatibilidade legada

A Aceitação de Pacote tem janelas limitadas de compatibilidade legada para pacotes já publicados. Pacotes até `2026.4.25`, incluindo `2026.4.25-beta.*`, podem usar o caminho de compatibilidade:

- entradas conhecidas de QA privada em `dist/postinstall-inventory.json` podem apontar para arquivos omitidos do tarball;
- `doctor-switch` pode pular o subcaso de persistência `gateway install --wrapper` quando o pacote não expõe essa flag;
- `update-channel-switch` pode remover `patchedDependencies` ausentes do pnpm da fixture fake git derivada do tarball e pode registrar `update.channel` persistido ausente;
- smokes de plugin podem ler locais legados de registro de instalação ou aceitar persistência ausente de registro de instalação de marketplace;
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

Ao depurar uma execução de aceitação de pacote com falha, comece pelo resumo de `resolve_package` para confirmar a origem do pacote, a versão e o SHA-256. Em seguida, inspecione a execução filha `docker_acceptance` e seus artefatos Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logs de faixa, tempos de fase e comandos de reexecução. Prefira reexecutar o perfil de pacote com falha ou as faixas Docker exatas em vez de reexecutar a validação completa de release.

## Smoke de instalação

O fluxo de trabalho separado `Install Smoke` reutiliza o mesmo script de escopo por meio de sua própria tarefa `preflight`. Ele divide a cobertura de smoke em `run_fast_install_smoke` e `run_full_install_smoke`.

- **Caminho rápido** é executado para solicitações pull que tocam superfícies Docker/de pacote, alterações de pacote/manifesto de Plugin empacotado ou superfícies centrais de Plugin/canal/gateway/SDK de Plugin que as tarefas de teste de fumaça Docker exercitam. Alterações apenas de código-fonte em Plugins empacotados, edições apenas de teste e edições apenas de documentação não reservam trabalhadores Docker. O caminho rápido compila a imagem do Dockerfile raiz uma vez, verifica a CLI, executa o teste de fumaça da CLI de exclusão de agentes em workspace compartilhado, executa o E2E de rede do Gateway em contêiner, verifica um argumento de build de extensão empacotada e executa o perfil Docker delimitado de Plugin empacotado sob um tempo limite agregado de comando de 240 segundos (cada execução Docker de cenário é limitada separadamente).
- **Caminho completo** mantém a instalação de pacote QR e a cobertura Docker/de atualização do instalador para execuções noturnas agendadas, disparos manuais, verificações de lançamento via chamada de fluxo de trabalho e solicitações pull que realmente tocam superfícies de instalador/pacote/Docker. No modo completo, install-smoke prepara ou reutiliza uma imagem GHCR de teste de fumaça do Dockerfile raiz para um SHA de destino, depois executa instalação de pacote QR, testes de fumaça do Dockerfile raiz/Gateway, testes de fumaça de instalador/atualização e o E2E Docker rápido de Plugin empacotado como tarefas separadas, para que o trabalho do instalador não espere atrás dos testes de fumaça da imagem raiz.

Pushes para `main` (incluindo commits de merge) não forçam o caminho completo; quando a lógica de escopo alterado solicitaria cobertura completa em um push, o fluxo de trabalho mantém o teste de fumaça Docker rápido e deixa o teste de fumaça de instalação completo para a validação noturna ou de lançamento.

O teste de fumaça lento do provedor de imagem com instalação global Bun é controlado separadamente por `run_bun_global_install_smoke`. Ele roda na agenda noturna e a partir do fluxo de trabalho de verificações de lançamento, e disparos manuais de `Install Smoke` podem optar por incluí-lo, mas solicitações pull e pushes para `main` não. A CI normal de PR ainda executa a faixa rápida de regressão do lançador Bun para alterações relevantes ao Node. Testes Docker de QR e instalador mantêm seus próprios Dockerfiles focados em instalação.

## E2E Docker local

`pnpm test:docker:all` pré-compila uma imagem compartilhada de teste ao vivo, empacota o OpenClaw uma vez como tarball npm e compila duas imagens compartilhadas de `scripts/e2e/Dockerfile`:

- um executor Node/Git básico para faixas de instalador/atualização/dependência de Plugin;
- uma imagem funcional que instala o mesmo tarball em `/app` para faixas de funcionalidade normais.

As definições de faixas Docker ficam em `scripts/lib/docker-e2e-scenarios.mjs`, a lógica do planejador fica em `scripts/lib/docker-e2e-plan.mjs`, e o executor só executa o plano selecionado. O agendador seleciona a imagem por faixa com `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, depois executa faixas com `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Ajustes

| Variável                               | Padrão | Finalidade                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Contagem de slots do pool principal para faixas normais.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Contagem de slots do pool final sensível a provedor.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Limite de faixas ao vivo concorrentes para que provedores não imponham limitação.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | Limite de faixas concorrentes de instalação npm.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Limite de faixas concorrentes com múltiplos serviços.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Intervalo entre inícios de faixas para evitar tempestades de criação no daemon Docker; defina `0` para nenhum intervalo.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Tempo limite de contingência por faixa (120 minutos); faixas ao vivo/finais selecionadas usam limites mais rígidos.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` imprime o plano do agendador sem executar faixas.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Lista exata de faixas separada por vírgulas; ignora o teste de fumaça de limpeza para que agentes possam reproduzir uma faixa com falha. |

Uma faixa mais pesada que seu limite efetivo ainda pode iniciar a partir de um pool vazio, depois roda sozinha até liberar capacidade. O agregado local faz pré-verificações do Docker, remove contêineres E2E obsoletos do OpenClaw, emite status de faixas ativas, persiste tempos de faixas para ordenação da mais longa primeiro e, por padrão, para de agendar novas faixas em pool após a primeira falha.

### Fluxo de trabalho ao vivo/E2E reutilizável

O fluxo de trabalho ao vivo/E2E reutilizável pergunta a `scripts/test-docker-all.mjs --plan-json` qual pacote, tipo de imagem, imagem ao vivo, faixa e cobertura de credenciais são necessários. `scripts/docker-e2e.mjs` então converte esse plano em saídas e resumos do GitHub. Ele empacota o OpenClaw por meio de `scripts/package-openclaw-for-docker.mjs`, baixa um artefato de pacote da execução atual ou baixa um artefato de pacote de `package_artifact_run_id`; valida o inventário do tarball; compila e envia imagens GHCR Docker E2E básicas/funcionais marcadas por digest do pacote por meio do cache de camadas Docker da Blacksmith quando o plano precisa de faixas com pacote instalado; e reutiliza entradas `docker_e2e_bare_image`/`docker_e2e_functional_image` fornecidas ou imagens existentes por digest do pacote em vez de recompilar. Pulls de imagem Docker são repetidos com um tempo limite delimitado de 180 segundos por tentativa, para que um fluxo de registro/cache travado tente novamente rapidamente em vez de consumir a maior parte do caminho crítico da CI.

### Partes do caminho de lançamento

A cobertura Docker de lançamento executa tarefas menores em partes com `OPENCLAW_SKIP_DOCKER_BUILD=1`, para que cada parte baixe apenas o tipo de imagem de que precisa e execute múltiplas faixas pelo mesmo agendador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

As partes Docker de lançamento atuais são `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` e `plugins-runtime-install-a` até `plugins-runtime-install-h`. `package-update-openai` inclui a faixa ao vivo de pacote do Plugin Codex, que instala o pacote candidato do OpenClaw, instala o Plugin Codex a partir de `codex_plugin_spec` ou de um tarball da mesma referência com aprovação explícita de instalação da CLI Codex, executa a pré-verificação da CLI Codex e, então, executa múltiplos turnos de agente OpenClaw na mesma sessão contra a OpenAI. `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` permanecem aliases agregados de Plugin/runtime. O alias da faixa `install-e2e` permanece o alias agregado de reexecução manual para ambas as faixas de instalador de provedor.

OpenWebUI é incorporado a `plugins-runtime-services` quando a cobertura completa de caminho de lançamento o solicita, e mantém uma parte independente `openwebui` apenas para disparos somente de OpenWebUI. Faixas de atualização de canais empacotados repetem uma vez em caso de falhas transitórias de rede npm.

Cada parte envia `.artifacts/docker-tests/` com logs de faixas, tempos, `summary.json`, `failures.json`, tempos de fases, JSON do plano do agendador, tabelas de faixas lentas e comandos de reexecução por faixa. A entrada `docker_lanes` do fluxo de trabalho executa faixas selecionadas contra as imagens preparadas em vez das tarefas por partes, o que mantém a depuração de faixas com falha limitada a uma tarefa Docker direcionada e prepara, baixa ou reutiliza o artefato de pacote para essa execução; se uma faixa selecionada for uma faixa Docker ao vivo, a tarefa direcionada compila localmente a imagem de teste ao vivo para essa reexecução. Comandos de reexecução do GitHub gerados por faixa incluem `package_artifact_run_id`, `package_artifact_name` e entradas de imagem preparadas quando esses valores existem, para que uma faixa com falha possa reutilizar o pacote e as imagens exatos da execução com falha.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

O fluxo de trabalho ao vivo/E2E agendado executa diariamente a suíte Docker completa do caminho de lançamento.

## Pré-lançamento de Plugin

`Plugin Prerelease` é uma cobertura mais cara de produto/pacote, por isso é um fluxo de trabalho separado disparado por `Full Release Validation` ou por um operador explícito. Solicitações pull normais, pushes para `main` e disparos manuais independentes de CI mantêm essa suíte desligada. Ele balanceia testes de Plugins empacotados entre oito trabalhadores de extensão; essas tarefas de shards de extensão executam até dois grupos de configuração de Plugin por vez, com um trabalhador Vitest por grupo e um heap Node maior para que lotes de Plugins pesados em importações não criem tarefas extras de CI. O caminho de pré-lançamento Docker exclusivo de lançamento agrupa faixas Docker direcionadas em pequenos grupos para evitar reservar dezenas de executores para tarefas de um a três minutos. O fluxo de trabalho também envia um artefato informativo `plugin-inspector-advisory` de `@openclaw/plugin-inspector`; achados do inspetor são entrada de triagem e não alteram o gate bloqueante do Pré-lançamento de Plugin.

## Laboratório de QA

O Laboratório de QA tem faixas de CI dedicadas fora do fluxo de trabalho principal com escopo inteligente. A paridade agêntica fica aninhada sob os harnesses amplos de QA e lançamento, não em um fluxo de trabalho independente de PR. Use `Full Release Validation` com `rerun_group=qa-parity` quando a paridade deve acompanhar uma execução ampla de validação.

- O fluxo de trabalho `QA-Lab - All Lanes` roda todas as noites em `main` e em disparo manual; ele distribui a faixa de paridade simulada, a faixa Matrix ao vivo e as faixas Telegram e Discord ao vivo como tarefas paralelas. Tarefas ao vivo usam o ambiente `qa-live-shared`, e Telegram/Discord usam concessões Convex.

As verificações de lançamento executam faixas de transporte Matrix e Telegram ao vivo com o provedor simulado determinístico e modelos qualificados por mock (`mock-openai/gpt-5.5` e `mock-openai/gpt-5.5-alt`), para que o contrato de canal fique isolado da latência de modelo ao vivo e da inicialização normal de Plugin de provedor. O Gateway de transporte ao vivo desabilita a busca de memória porque a paridade de QA cobre o comportamento de memória separadamente; a conectividade de provedor é coberta pelas suítes separadas de modelo ao vivo, provedor nativo e provedor Docker.

Matrix usa `--profile fast` para gates agendados e de lançamento, adicionando `--fail-fast` apenas quando a CLI em checkout tem suporte a isso. O padrão da CLI e a entrada manual do fluxo de trabalho permanecem `all`; o disparo manual `matrix_profile=all` sempre divide em shards a cobertura completa do Matrix nas tarefas `transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`.

`OpenClaw Release Checks` também executa as faixas críticas de lançamento do Laboratório de QA antes da aprovação de lançamento; seu gate de paridade de QA executa os pacotes candidato e baseline como tarefas paralelas de faixas, depois baixa ambos os artefatos em uma pequena tarefa de relatório para a comparação final de paridade.

Para PRs normais, siga evidências de CI/verificação com escopo em vez de tratar a paridade como um status obrigatório.

## CodeQL

O fluxo de trabalho `CodeQL` é intencionalmente um scanner de segurança restrito de primeira passagem, não uma varredura completa do repositório. Execuções diárias, manuais e de guarda para solicitações pull não rascunho examinam código de fluxos de trabalho do Actions mais as superfícies JavaScript/TypeScript de maior risco, com consultas de segurança de alta confiança filtradas para `security-severity` alta/crítica.

A guarda de solicitação pull permanece leve: ela só inicia para alterações em `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src` ou caminhos de runtime de Plugin empacotado que possuem processo, e executa a mesma matriz de segurança de alta confiança do fluxo de trabalho agendado. CodeQL para Android e macOS ficam fora dos padrões de PR.

### Categorias de segurança

| Categoria                                         | Superfície                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, segredos, sandbox, cron e baseline do gateway                                                                                 |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementação de canais principais, além do runtime de plugin de canal, gateway, Plugin SDK, segredos e pontos de auditoria |
| `/codeql-security-high/network-ssrf-boundary`     | Superfícies de SSRF principal, análise de IP, proteção de rede, web-fetch e política de SSRF do Plugin SDK                          |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, auxiliares de execução de processo, entrega de saída e gates de execução de ferramentas de agente                   |
| `/codeql-security-high/process-exec-boundary`     | Shell local, auxiliares de spawn de processos, runtimes de plugins empacotados que controlam subprocessos e cola de scripts de workflow |
| `/codeql-security-high/plugin-trust-boundary`     | Instalação de Plugin, loader, manifest, registry, instalação por gerenciador de pacotes, carregamento de código-fonte e superfícies de confiança do contrato de pacote do Plugin SDK |

### Shards de segurança específicos da plataforma

- `CodeQL Android Critical Security` — shard agendado de segurança do Android. Compila manualmente o app Android para CodeQL no menor runner Blacksmith Linux aceito pela validação de sanidade do workflow. Faz upload em `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard semanal/manual de segurança do macOS. Compila manualmente o app macOS para CodeQL no Blacksmith macOS, filtra resultados de build de dependências para fora do SARIF enviado e faz upload em `/codeql-critical-security/macos`. Mantido fora dos padrões diários porque o build do macOS domina o tempo de execução mesmo quando limpo.

### Categorias de qualidade crítica

`CodeQL Critical Quality` é o shard não relacionado a segurança correspondente. Ele executa apenas consultas de qualidade JavaScript/TypeScript sem segurança e com severidade de erro em superfícies estreitas de alto valor em runners Linux hospedados pelo GitHub, para que varreduras de qualidade não gastem o orçamento de registro de runners Blacksmith. Seu guard de pull request é intencionalmente menor que o perfil agendado: PRs não draft executam apenas os shards correspondentes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` e `plugin-sdk-reply-runtime` para alterações em código de execução de comandos/modelos/ferramentas de agente e despacho de respostas, schema/migração/IO de configuração, código de auth/segredos/sandbox/segurança, canal principal e runtime de plugin de canal empacotado, protocolo/método de servidor do gateway, cola de runtime/SDK de memória, MCP/processo/entrega de saída, runtime de provider/catálogo de modelos, diagnósticos de sessão/filas de entrega, loader de plugin, Plugin SDK/contrato de pacote ou runtime de respostas do Plugin SDK. Alterações na configuração do CodeQL e no workflow de qualidade executam todos os doze shards de qualidade de PR.

O dispatch manual aceita:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Os perfis estreitos são hooks de ensino/iteração para executar um shard de qualidade isoladamente.

| Categoria                                               | Superfície                                                                                                                                                        |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Código de limite de segurança de auth, segredos, sandbox, cron e gateway                                                                                         |
| `/codeql-critical-quality/config-boundary`              | Contratos de schema, migração, normalização e IO de configuração                                                                                                  |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schemas do protocolo Gateway e contratos de métodos de servidor                                                                                                   |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementação de canais principais e plugins de canal empacotados                                                                                    |
| `/codeql-critical-quality/agent-runtime-boundary`       | Contratos de runtime de execução de comandos, despacho de modelo/provider, despacho e filas de resposta automática e plano de controle ACP                        |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP e pontes de ferramentas, auxiliares de supervisão de processos e contratos de entrega de saída                                                     |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host de memória, facades de runtime de memória, aliases de memória do Plugin SDK, cola de ativação do runtime de memória e comandos doctor de memória         |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internos da fila de respostas, filas de entrega de sessão, auxiliares de vinculação/entrega de sessão de saída, superfícies de eventos diagnósticos/pacotes de logs e contratos da CLI doctor de sessão |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de respostas recebidas do Plugin SDK, auxiliares de payload/fragmentação/runtime de respostas, opções de resposta de canal, filas de entrega e auxiliares de vinculação de sessão/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalização de catálogo de modelos, auth e discovery de providers, registro de runtime de provider, padrões/catálogos de provider e registries de web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap da UI de controle, persistência local, fluxos de controle do gateway e contratos de runtime do plano de controle de tarefas                             |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratos de runtime de fetch/search web principal, IO de mídia, compreensão de mídia, geração de imagens e geração de mídia                                      |
| `/codeql-critical-quality/plugin-boundary`              | Contratos de loader, registry, superfície pública e entrypoint do Plugin SDK                                                                                      |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Código-fonte do Plugin SDK no lado do pacote publicado e auxiliares de contrato de pacote de plugin                                                               |

Qualidade permanece separada de segurança para que achados de qualidade possam ser agendados, medidos, desativados ou expandidos sem obscurecer o sinal de segurança. A expansão de CodeQL para Swift, Python e plugins empacotados deve ser adicionada de volta como trabalho de acompanhamento com escopo ou shard somente depois que os perfis estreitos tiverem runtime e sinal estáveis.

## Workflows de manutenção

### Docs Agent

O workflow `Docs Agent` é uma trilha de manutenção Codex orientada por eventos para manter a documentação existente alinhada a alterações integradas recentemente. Ele não tem agendamento puro: uma execução de CI de push bem-sucedida e não bot em `main` pode acioná-lo, e o dispatch manual pode executá-lo diretamente. Invocações por workflow-run são ignoradas quando `main` avançou ou quando outra execução não ignorada do Docs Agent foi criada na última hora. Quando executado, ele revisa o intervalo de commits do SHA de origem anterior não ignorado do Docs Agent até a `main` atual, de modo que uma execução por hora possa cobrir todas as alterações na main acumuladas desde a última passagem de docs.

### Test Performance Agent

O workflow `Test Performance Agent` é uma trilha de manutenção Codex orientada por eventos para testes lentos. Ele não tem agendamento puro: uma execução de CI de push bem-sucedida e não bot em `main` pode acioná-lo, mas ele é ignorado se outra invocação por workflow-run já executou ou está executando naquele dia UTC. O dispatch manual ignora esse gate de atividade diária. A trilha gera um relatório de desempenho Vitest agrupado de suíte completa, permite que Codex faça apenas pequenas correções de desempenho de testes que preservem cobertura em vez de refactors amplos, depois executa novamente o relatório de suíte completa e rejeita alterações que reduzam a contagem de testes aprovados no baseline. O relatório agrupado registra tempo de parede por configuração e RSS máximo no Linux e macOS, portanto a comparação antes/depois expõe deltas de memória de testes junto aos deltas de duração. Se o baseline tiver testes falhando, o Codex pode corrigir apenas falhas óbvias, e o relatório de suíte completa pós-agente deve passar antes que qualquer coisa seja commitada. Quando `main` avança antes do push do bot ser integrado, a trilha faz rebase do patch validado, executa novamente `pnpm check:changed` e tenta o push de novo; patches antigos conflitantes são ignorados. Ela usa Ubuntu hospedado pelo GitHub para que a action Codex possa manter a mesma postura de segurança drop-sudo do agente de docs.

### PRs duplicados após merge

O workflow `Duplicate PRs After Merge` é um workflow manual de mantenedor para limpeza de duplicados pós-integração. Ele usa dry-run por padrão e só fecha PRs explicitamente listados quando `apply=true`. Antes de alterar o GitHub, ele verifica se o PR integrado foi mergeado e se cada duplicado tem uma issue referenciada compartilhada ou hunks alterados sobrepostos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gates de verificação locais e roteamento de alterações

A lógica local de changed-lane vive em `scripts/changed-lanes.mjs` e é executada por `scripts/check-changed.mjs`. Esse gate de verificação local é mais rígido quanto a limites de arquitetura do que o escopo amplo da plataforma de CI:

- alterações de produção no core executam typecheck de prod e teste do core, além de lint/guards do core;
- alterações apenas de teste no core executam apenas typecheck de teste do core, além de lint do core;
- alterações de produção em extensões executam typecheck de prod e teste de extensões, além de lint de extensões;
- alterações apenas de teste em extensões executam typecheck de teste de extensões, além de lint de extensões;
- alterações públicas no Plugin SDK ou no contrato de plugin expandem para typecheck de extensões porque extensões dependem desses contratos do core (varreduras Vitest de extensões continuam sendo trabalho de teste explícito);
- incrementos de versão apenas em metadados de release executam verificações direcionadas de versão/configuração/dependência raiz;
- alterações desconhecidas na raiz/configuração falham de forma segura para todas as lanes de verificação.

O roteamento local de testes alterados vive em `scripts/test-projects.test-support.mjs` e é intencionalmente mais barato que `check:changed`: edições diretas de testes executam a si mesmas, edições de código-fonte preferem mapeamentos explícitos, depois testes irmãos e dependentes do grafo de imports. A configuração compartilhada de entrega para group-room é um dos mapeamentos explícitos: alterações na configuração de respostas visíveis ao grupo, modo de entrega de respostas de origem ou prompt de sistema da ferramenta de mensagens passam pelos testes principais de respostas, além de regressões de entrega do Discord e Slack, para que uma alteração de padrão compartilhado falhe antes do primeiro push de PR. Use `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` somente quando a alteração for ampla o suficiente no harness para que o conjunto mapeado barato não seja um proxy confiável.

## Validação Testbox

Crabbox é o wrapper de caixa remota mantido pelo repositório para prova Linux de mantenedor. Use-o
a partir da raiz do repositório quando uma verificação for ampla demais para um ciclo local de edição, quando a paridade com a CI
importar, ou quando a prova precisar de segredos, Docker, lanes de pacote,
caixas reutilizáveis ou logs remotos. O backend normal do OpenClaw é
`blacksmith-testbox`; a capacidade própria da AWS/Hetzner é uma alternativa para indisponibilidades do Blacksmith,
problemas de cota ou testes explícitos em capacidade própria.

Execuções do Blacksmith via Crabbox aquecem, reivindicam, sincronizam, executam, reportam e limpam
Testboxes de execução única. A verificação de sanidade de sincronização embutida falha rapidamente quando arquivos
raiz obrigatórios, como `pnpm-lock.yaml`, desaparecem ou quando `git status --short`
mostra pelo menos 200 exclusões rastreadas. Para PRs intencionais com muitas exclusões, defina
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para o comando remoto.

Crabbox também encerra uma invocação local da CLI do Blacksmith que permanece na
fase de sincronização por mais de cinco minutos sem saída pós-sincronização. Defina
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` para desabilitar essa proteção, ou use um valor maior
em milissegundos para diffs locais incomumente grandes.

Antes de uma primeira execução, verifique o wrapper a partir da raiz do repositório:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

O wrapper do repositório recusa um binário Crabbox obsoleto que não anuncia `blacksmith-testbox`. Passe o provedor explicitamente, mesmo que `.crabbox.yaml` tenha padrões de nuvem própria. Em worktrees do Codex ou checkouts vinculados/esparsos, evite o script local `pnpm crabbox:run`, porque o pnpm pode reconciliar dependências antes que o Crabbox inicie; invoque o wrapper Node diretamente:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Execuções via Blacksmith exigem Crabbox 0.22.0 ou mais recente para que o wrapper obtenha o comportamento atual de sincronização, fila e limpeza do Testbox. Ao usar o checkout irmão, recompile o binário local ignorado antes de trabalhos de medição de tempo ou prova:

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

Reexecução de teste focada:

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
`syncDelegated`, `exitCode`, `commandMs` e `totalMs`. Para execuções delegadas do
Blacksmith Testbox, o código de saída do wrapper Crabbox e o resumo JSON são o
resultado do comando. A execução vinculada do GitHub Actions é responsável pela hidratação e pelo keepalive; ela
pode terminar como `cancelled` quando o Testbox é interrompido externamente depois que o comando SSH
já retornou. Trate isso como um artefato de limpeza/status, a menos que
o `exitCode` do wrapper seja diferente de zero ou a saída do comando mostre um teste com falha.
Execuções Crabbox de execução única via Blacksmith devem interromper o Testbox automaticamente;
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

Se o Crabbox for a camada quebrada, mas o Blacksmith em si funcionar, use o
Blacksmith direto apenas para diagnósticos como `list`, `status` e limpeza. Corrija o
caminho do Crabbox antes de tratar uma execução direta do Blacksmith como prova de mantenedor.

Se `blacksmith testbox list --all` e `blacksmith testbox status` funcionarem, mas novos
aquecimentos ficarem `queued` sem IP ou URL de execução do Actions após alguns minutos,
trate isso como pressão de provedor, fila, cobrança ou limite organizacional do Blacksmith. Interrompa os
ids enfileirados que você criou, evite iniciar mais Testboxes e mova a prova para o
caminho de capacidade própria do Crabbox abaixo enquanto alguém verifica o painel do Blacksmith,
a cobrança e os limites organizacionais.

Escale para capacidade própria do Crabbox apenas quando o Blacksmith estiver fora do ar, limitado por cota, sem o ambiente necessário, ou quando a capacidade própria for explicitamente o objetivo:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Sob pressão da AWS, evite `class=beast` a menos que a tarefa realmente precise de CPU de classe 48xlarge. Uma solicitação `beast` começa em 192 vCPUs e é a maneira mais fácil de acionar a cota regional de EC2 Spot ou On-Demand Standard. O `.crabbox.yaml` mantido pelo repositório usa como padrão `standard`, várias regiões de capacidade e `capacity.hints: true`, para que leases AWS intermediados imprimam região/mercado selecionado, pressão de cota, fallback de Spot e avisos de classe sob alta pressão. Use `fast` para verificações amplas mais pesadas, `large` apenas depois que standard/fast não forem suficientes, e `beast` apenas para lanes excepcionais limitadas por CPU, como suíte completa ou matrizes Docker de todos os Plugins, validação explícita de lançamento/bloqueador ou profiling de desempenho com muitos núcleos. Não use `beast` para `pnpm check:changed`, testes focados, trabalho somente de docs, lint/typecheck comum, pequenas reproduções E2E ou triagem de indisponibilidade do Blacksmith. Use `--market on-demand` para diagnóstico de capacidade, para que a instabilidade do mercado Spot não seja misturada ao sinal.

`.crabbox.yaml` controla os padrões de provedor, sincronização e hidratação do GitHub Actions para lanes de nuvem própria. Ele exclui o `.git` local para que o checkout hidratado do Actions mantenha seus próprios metadados Git remotos em vez de sincronizar remotes e armazenamentos de objetos locais do mantenedor, e exclui artefatos locais de runtime/build que nunca devem ser transferidos. `.github/workflows/crabbox-hydrate.yml` controla checkout, configuração de Node/pnpm, busca de `origin/main` e o repasse de ambiente sem segredos para comandos `crabbox run --id <cbx_id>` em nuvem própria.

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Canais de desenvolvimento](/pt-BR/install/development-channels)
