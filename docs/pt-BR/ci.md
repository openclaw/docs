---
read_when:
    - Você precisa entender por que uma tarefa de CI foi ou não executada
    - Você está depurando uma verificação do GitHub Actions com falha
    - Você está coordenando uma execução ou reexecução de validação de lançamento
summary: Grafo de tarefas de CI, critérios de escopo, guarda-chuvas de lançamento e equivalentes de comandos locais
title: pipeline de CI
x-i18n:
    generated_at: "2026-05-01T05:55:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: aea06f9f336f9a478a284473b5c5f38730b87837b1acb0390161bf2c455f6c41
    source_path: ci.md
    workflow: 16
---

OpenClaw CI é executado em cada push para `main` e em cada pull request. O job `preflight` classifica o diff e desativa lanes caras quando apenas áreas não relacionadas foram alteradas. Execuções manuais de `workflow_dispatch` ignoram intencionalmente o escopo inteligente e expandem o grafo completo para candidatos a release e validação ampla. As lanes do Android continuam opt-in por meio de `include_android`. A cobertura de Plugin exclusiva de release fica no workflow separado [`Pré-lançamento de Plugin`](#plugin-prerelease) e só é executada a partir de [`Validação Completa de Release`](#full-release-validation) ou de um dispatch manual explícito.

## Visão geral do pipeline

| Job                              | Finalidade                                                                                   | Quando é executado                 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Detectar mudanças só em docs, escopos alterados, extensões alteradas e criar o manifesto da CI | Sempre em pushes e PRs que não sejam rascunho |
| `security-scm-fast`              | Detecção de chave privada e auditoria de workflow via `zizmor`                                | Sempre em pushes e PRs que não sejam rascunho |
| `security-dependency-audit`      | Auditoria do lockfile de produção sem dependências contra avisos do npm                       | Sempre em pushes e PRs que não sejam rascunho |
| `security-fast`                  | Agregado obrigatório para os jobs rápidos de segurança                                        | Sempre em pushes e PRs que não sejam rascunho |
| `check-dependencies`             | Passagem do Knip somente para dependências de produção mais o guard da allowlist de arquivos não usados | Mudanças relevantes para Node      |
| `build-artifacts`                | Compilar `dist/`, Control UI, checks de artefatos compilados e artefatos downstream reutilizáveis | Mudanças relevantes para Node      |
| `checks-fast-core`               | Lanes rápidas de correção no Linux, como checks de bundled/plugin-contract/protocol           | Mudanças relevantes para Node      |
| `checks-fast-contracts-channels` | Checks de contrato de canal fragmentados com um resultado de check agregado estável           | Mudanças relevantes para Node      |
| `checks-node-core-test`          | Shards de testes do core Node, excluindo lanes de canais, bundled, contrato e extensões       | Mudanças relevantes para Node      |
| `check`                          | Equivalente fragmentado do gate local principal: tipos de produção, lint, guards, tipos de teste e smoke estrito | Mudanças relevantes para Node      |
| `check-additional`               | Shards de arquitetura, boundary, guards de superfície de extensão, package-boundary e gateway-watch | Mudanças relevantes para Node      |
| `build-smoke`                    | Testes smoke da CLI compilada e smoke de memória de inicialização                             | Mudanças relevantes para Node      |
| `checks`                         | Verificador para testes de canal de artefato compilado                                        | Mudanças relevantes para Node      |
| `checks-node-compat-node22`      | Lane de build e smoke de compatibilidade com Node 22                                          | Dispatch manual da CI para releases |
| `check-docs`                     | Formatação, lint e checks de links quebrados da documentação                                  | Docs alterados                     |
| `skills-python`                  | Ruff + pytest para skills baseadas em Python                                                  | Mudanças relevantes para Skills em Python |
| `checks-windows`                 | Testes específicos de processo/caminho no Windows mais regressões compartilhadas de especificadores de importação em runtime | Mudanças relevantes para Windows   |
| `macos-node`                     | Lane de testes TypeScript no macOS usando os artefatos compilados compartilhados              | Mudanças relevantes para macOS     |
| `macos-swift`                    | Swift lint, build e testes para o app macOS                                                   | Mudanças relevantes para macOS     |
| `android`                        | Testes unitários do Android para ambos os flavors mais uma build de APK de debug              | Mudanças relevantes para Android   |
| `test-performance-agent`         | Otimização diária de testes lentos pelo Codex após atividade confiável                        | Sucesso da CI principal ou dispatch manual |

## Ordem de falha rápida

1. `preflight` decide quais lanes existem. A lógica de `docs-scope` e `changed-scope` são etapas dentro desse job, não jobs independentes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falham rapidamente sem esperar pelos jobs mais pesados de artefatos e matriz de plataformas.
3. `build-artifacts` se sobrepõe às lanes rápidas de Linux para que consumidores downstream possam começar assim que a build compartilhada estiver pronta.
4. Lanes mais pesadas de plataforma e runtime se expandem depois disso: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

O GitHub pode marcar jobs substituídos como `cancelled` quando um push mais novo chega ao mesmo PR ou ref de `main`. Trate isso como ruído da CI, a menos que a execução mais nova para a mesma ref também esteja falhando. Checks agregados de shard usam `!cancelled() && always()` para que ainda relatem falhas normais de shard, mas não entrem na fila depois que todo o workflow já foi substituído. A chave automática de concorrência da CI é versionada (`CI-v7-*`) para que um zumbi do lado do GitHub em um grupo de fila antigo não possa bloquear indefinidamente execuções mais novas da main. Execuções manuais da suíte completa usam `CI-manual-v1-*` e não cancelam execuções em andamento.

## Escopo e roteamento

A lógica de escopo fica em `scripts/ci-changed-scope.mjs` e é coberta por testes unitários em `src/scripts/ci-changed-scope.test.ts`. O dispatch manual pula a detecção de changed-scope e faz o manifesto de preflight agir como se todas as áreas escopadas tivessem mudado.

- **Edições no workflow de CI** validam o grafo da CI de Node mais o lint de workflow, mas não forçam builds nativas de Windows, Android ou macOS por si só; essas lanes de plataforma continuam escopadas a mudanças no código-fonte da plataforma.
- **Edições apenas de roteamento da CI, edições selecionadas de fixtures baratas de testes do core e edições estreitas de helpers/test-routing de contrato de Plugin** usam um caminho de manifesto rápido somente de Node: `preflight`, segurança e uma única tarefa `checks-fast-core`. Esse caminho pula artefatos de build, compatibilidade com Node 22, contratos de canal, shards completos do core, shards de Plugin bundled e matrizes adicionais de guard quando a mudança se limita às superfícies de roteamento ou helper que a tarefa rápida exercita diretamente.
- **Checks de Node no Windows** são escopados para wrappers específicos de processo/caminho no Windows, helpers de runner npm/pnpm/UI, configuração de gerenciador de pacotes e as superfícies do workflow de CI que executam essa lane; mudanças não relacionadas de código-fonte, Plugin, install-smoke e somente testes permanecem nas lanes Linux Node.

As famílias mais lentas de testes Node são divididas ou balanceadas para que cada job continue pequeno sem reservar runners em excesso: contratos de canal rodam como três shards ponderados, lanes pequenas de unidade do core são pareadas, auto-reply roda como quatro workers balanceados (com a subárvore de reply dividida em shards de agent-runner, dispatch e commands/state-routing), e configs agentic de Gateway/Plugin são distribuídas pelos jobs Node agentic somente de código-fonte existentes em vez de esperar por artefatos compilados. Testes amplos de navegador, QA, mídia e Plugins diversos usam suas configs Vitest dedicadas em vez do catch-all compartilhado de Plugin. Shards de include-pattern registram entradas de tempo usando o nome do shard da CI, para que `.artifacts/vitest-shard-timings.json` consiga distinguir uma config inteira de um shard filtrado. `check-additional` mantém o trabalho de compilação/canário de package-boundary junto e separa arquitetura de topologia de runtime da cobertura de gateway watch; o shard de guard de boundary executa seus pequenos guards independentes concorrentemente dentro de um job. Gateway watch, testes de canal e o shard de support-boundary do core rodam concorrentemente dentro de `build-artifacts` depois que `dist/` e `dist-runtime/` já foram compilados.

A CI do Android executa tanto `testPlayDebugUnitTest` quanto `testThirdPartyDebugUnitTest` e depois compila o APK de debug Play. O flavor third-party não tem source set nem manifesto separado; sua lane de teste unitário ainda compila o flavor com as flags BuildConfig de SMS/call-log, evitando ao mesmo tempo um job duplicado de empacotamento de APK de debug em cada push relevante para Android.

O shard `check-dependencies` executa `pnpm deadcode:dependencies` (uma passagem do Knip somente para dependências de produção fixada na versão mais recente do Knip, com a idade mínima de release do pnpm desativada para a instalação via `dlx`) e `pnpm deadcode:unused-files`, que compara os achados de arquivos de produção não usados do Knip com `scripts/deadcode-unused-files.allowlist.mjs`. O guard de arquivos não usados falha quando um PR adiciona um novo arquivo não usado sem revisão ou deixa uma entrada obsoleta na allowlist, preservando ao mesmo tempo superfícies intencionais de Plugin dinâmico, geradas, de build, teste live e bridge de pacote que o Knip não consegue resolver estaticamente.

## Dispatches manuais

Dispatches manuais da CI executam o mesmo grafo de jobs que a CI normal, mas forçam todas as lanes escopadas que não são Android: shards Linux Node, shards de Plugin bundled, contratos de canal, compatibilidade com Node 22, `check`, `check-additional`, build smoke, checks de docs, Skills Python, Windows, macOS e i18n da Control UI. Dispatches manuais autônomos da CI executam Android apenas com `include_android=true`; o guarda-chuva de release completo habilita Android passando `include_android=true`. Checks estáticos de pré-lançamento de Plugin, o shard `agentic-plugins` exclusivo de release, a varredura completa em lote de extensões e as lanes Docker de pré-lançamento de Plugin são excluídos da CI. A suíte Docker de pré-lançamento só roda quando `Full Release Validation` dispara o workflow separado `Plugin Prerelease` com o gate de validação de release habilitado.

Execuções manuais usam um grupo de concorrência exclusivo para que uma suíte completa de candidato a release não seja cancelada por outro push ou execução de PR na mesma ref. A entrada opcional `target_ref` permite que um chamador confiável execute esse grafo contra uma branch, tag ou SHA completo de commit enquanto usa o arquivo de workflow da ref de dispatch selecionada.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Executor                         | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, jobs rápidos de segurança e agregados (`security-scm-fast`, `security-dependency-audit`, `security-fast`), verificações rápidas de protocolo/contrato/empacotadas, verificações fragmentadas de contrato de canais, fragmentos de `check` exceto lint, fragmentos e agregados de `check-additional`, verificadores agregados de testes Node, verificações de documentação, skills Python, workflow-sanity, labeler, auto-response; o preflight de install-smoke também usa Ubuntu hospedado no GitHub para que a matriz Blacksmith possa entrar na fila mais cedo |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, fragmentos de extensões de menor peso, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` e `check-test-types`                                                                                                                                                                                                                                                                                                            |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, fragmentos de teste Node no Linux, fragmentos de teste de Plugins empacotados, `android`                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (sensível a CPU o suficiente para que 8 vCPU custassem mais do que economizaram); builds Docker de install-smoke (o tempo de fila de 32 vCPU custou mais do que economizou)                                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` em `openclaw/openclaw`; forks usam `macos-latest` como fallback                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` em `openclaw/openclaw`; forks usam `macos-latest` como fallback                                                                                                                                                                                                                                                                                                                                                                                        |

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
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/build-smoke lanes matter
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Validação Completa de Lançamento

`Full Release Validation` é o workflow guarda-chuva manual para "executar tudo antes do lançamento". Ele aceita uma branch, tag ou SHA completo de commit, dispara o workflow manual `CI` com esse alvo, dispara `Plugin Prerelease` para prova exclusiva de lançamento de Plugin/pacote/estático/Docker e dispara `OpenClaw Release Checks` para smoke de instalação, aceitação de pacote, suítes de caminho de lançamento Docker, live/E2E, OpenWebUI, paridade QA Lab, Matrix e lanes do Telegram. Ele também pode executar o workflow pós-publicação `NPM Telegram Beta E2E` quando uma especificação de pacote publicado é fornecida.

Veja [validação completa de lançamento](/pt-BR/reference/full-release-validation) para a
matriz de estágios, nomes exatos dos jobs de workflow, diferenças de perfil, artefatos e
identificadores de reexecução focada.

`release_profile` controla a amplitude live/provedor passada para as verificações de lançamento. Os
workflows manuais de lançamento usam `stable` por padrão; use `full` somente quando você
intencionalmente quiser a matriz consultiva ampla de provedores/mídia.

- `minimum` mantém as lanes mais rápidas críticas para lançamento de OpenAI/core.
- `stable` adiciona o conjunto estável de provedores/backends.
- `full` executa a matriz consultiva ampla de provedores/mídia.

O guarda-chuva registra os IDs das execuções filhas disparadas, e o job final `Verify full validation` revalida as conclusões atuais das execuções filhas e anexa tabelas dos jobs mais lentos de cada execução filha. Se um workflow filho for reexecutado e ficar verde, reexecute apenas o job verificador pai para atualizar o resultado do guarda-chuva e o resumo de tempos.

Para recuperação, tanto `Full Release Validation` quanto `OpenClaw Release Checks` aceitam `rerun_group`. Use `all` para um candidato a lançamento, `ci` para somente o filho de CI completo normal, `plugin-prerelease` para somente o filho de pré-lançamento de Plugin, `release-checks` para todos os filhos de lançamento, ou um grupo mais restrito: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` no guarda-chuva. Isso mantém limitada a reexecução de uma caixa de lançamento com falha após uma correção focada.

`OpenClaw Release Checks` usa a referência confiável do workflow para resolver a referência selecionada uma vez em um tarball `release-package-under-test` e então passa esse artefato tanto para o workflow Docker live/E2E de caminho de lançamento quanto para o fragmento de aceitação de pacote. Isso mantém os bytes do pacote consistentes entre as caixas de lançamento e evita reempacotar o mesmo candidato em vários jobs filhos.

Execuções duplicadas de `Full Release Validation` para `ref=main` e `rerun_group=all`
substituem o guarda-chuva mais antigo. O monitor pai cancela qualquer workflow filho que
já tenha disparado quando o pai é cancelado, para que uma validação mais nova de main
não fique atrás de uma execução obsoleta de release-check de duas horas. A validação de branch/tag
de lançamento e grupos de reexecução focada mantêm `cancel-in-progress: false`.

## Fragmentos Live e E2E

O filho live/E2E de lançamento mantém cobertura nativa ampla de `pnpm test:live`, mas a executa como fragmentos nomeados por meio de `scripts/test-live-shard.mjs`, em vez de um job serial:

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
- fragmentos separados de mídia de áudio/vídeo e fragmentos de música filtrados por provedor

Isso mantém a mesma cobertura de arquivos enquanto torna falhas lentas de provedores live mais fáceis de reexecutar e diagnosticar. Os nomes agregados dos fragmentos `native-live-extensions-o-z`, `native-live-extensions-media` e `native-live-extensions-media-music` continuam válidos para reexecuções manuais únicas.

Os fragmentos nativos de mídia live são executados em `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, criado pelo workflow `Live Media Runner Image`. Essa imagem pré-instala `ffmpeg` e `ffprobe`; os jobs de mídia apenas verificam os binários antes da configuração. Mantenha suítes live baseadas em Docker em runners Blacksmith normais — jobs em contêiner são o lugar errado para iniciar testes Docker aninhados.

Fragmentos live de modelo/backend baseados em Docker usam uma imagem compartilhada separada `ghcr.io/openclaw/openclaw-live-test:<sha>` por commit selecionado. O workflow de lançamento live cria e envia essa imagem uma vez; depois, os fragmentos de modelo live Docker, Gateway fragmentado por provedor, backend CLI, bind ACP e harness Codex são executados com `OPENCLAW_SKIP_DOCKER_BUILD=1`. Fragmentos Docker do Gateway carregam limites explícitos de `timeout` em nível de script abaixo do timeout do job do workflow para que um contêiner travado ou caminho de limpeza falhe rapidamente em vez de consumir todo o orçamento de release-check. Se esses fragmentos reconstruírem o alvo Docker completo de origem de forma independente, a execução de lançamento está mal configurada e desperdiçará tempo de relógio em builds duplicados de imagem.

## Aceitação de Pacote

Use `Package Acceptance` quando a pergunta for "este pacote instalável do OpenClaw funciona como produto?" Ela é diferente do CI normal: o CI normal valida a árvore de origem, enquanto a aceitação de pacote valida um único tarball por meio do mesmo harness Docker E2E que os usuários exercitam após instalar ou atualizar.

### Jobs

1. `resolve_package` faz checkout de `workflow_ref`, resolve um candidato de pacote, grava `.artifacts/docker-e2e-package/openclaw-current.tgz`, grava `.artifacts/docker-e2e-package/package-candidate.json`, carrega ambos como o artefato `package-under-test` e imprime a origem, a ref do workflow, a ref do pacote, a versão, o SHA-256 e o perfil no resumo da etapa do GitHub.
2. `docker_acceptance` chama `openclaw-live-and-e2e-checks-reusable.yml` com `ref=workflow_ref` e `package_artifact_name=package-under-test`. O workflow reutilizável baixa esse artefato, valida o inventário do tarball, prepara imagens Docker com digest do pacote quando necessário e executa as lanes Docker selecionadas contra esse pacote em vez de empacotar o checkout do workflow. Quando um perfil seleciona várias `docker_lanes` direcionadas, o workflow reutilizável prepara o pacote e as imagens compartilhadas uma vez, depois distribui essas lanes como jobs Docker direcionados paralelos com artefatos exclusivos.
3. `package_telegram` chama opcionalmente `NPM Telegram Beta E2E`. Ele executa quando `telegram_mode` não é `none` e instala o mesmo artefato `package-under-test` quando o Package Acceptance resolveu um; o dispatch independente do Telegram ainda pode instalar uma especificação npm publicada.
4. `summary` falha o workflow se a resolução do pacote, a aceitação Docker ou a lane opcional do Telegram falhou.

### Origens candidatas

- `source=npm` aceita apenas `openclaw@beta`, `openclaw@latest` ou uma versão exata de release do OpenClaw, como `openclaw@2026.4.27-beta.2`. Use isto para aceitação de beta/estável publicado.
- `source=ref` empacota uma branch, tag ou SHA de commit completo confiável de `package_ref`. O resolvedor busca branches/tags do OpenClaw, verifica se o commit selecionado é alcançável a partir do histórico de branches do repositório ou de uma tag de release, instala dependências em uma worktree destacada e o empacota com `scripts/package-openclaw-for-docker.mjs`.
- `source=url` baixa um `.tgz` HTTPS; `package_sha256` é obrigatório.
- `source=artifact` baixa um `.tgz` de `artifact_run_id` e `artifact_name`; `package_sha256` é opcional, mas deve ser fornecido para artefatos compartilhados externamente.

Mantenha `workflow_ref` e `package_ref` separados. `workflow_ref` é o código confiável de workflow/harness que executa o teste. `package_ref` é o commit de origem que é empacotado quando `source=ref`. Isso permite que o harness de teste atual valide commits de origem confiáveis mais antigos sem executar lógica antiga de workflow.

### Perfis de suíte

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` mais `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — blocos completos do caminho de release Docker com OpenWebUI
- `custom` — `docker_lanes` exatas; obrigatório quando `suite_profile=custom`

O perfil `package` usa cobertura de Plugin offline para que a validação do pacote publicado não dependa da disponibilidade ao vivo do ClawHub. A lane opcional do Telegram reutiliza o artefato `package-under-test` em `NPM Telegram Beta E2E`, mantendo o caminho da especificação npm publicada para dispatches independentes.

As verificações de release chamam Package Acceptance com `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` e `telegram_mode=mock-openai`. Os blocos Docker de caminho de release cobrem as lanes sobrepostas de pacote/atualização/Plugin; Package Acceptance mantém a prova nativa de artefato de compatibilidade de canais empacotados, Plugin offline e Telegram contra o mesmo tarball de pacote resolvido. As verificações de release entre sistemas operacionais ainda cobrem onboarding, instalador e comportamento de plataforma específicos de SO; a validação de produto de pacote/atualização deve começar com Package Acceptance. A lane Docker `published-upgrade-survivor` valida uma linha de base de pacote publicado por execução. Em Package Acceptance, o tarball resolvido `package-under-test` é sempre o candidato e `published_upgrade_survivor_baseline` seleciona a linha de base publicada, usando `openclaw@latest` como padrão; comandos de reexecução de lanes com falha preservam essa linha de base. Execuções locais podem definir `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` para um pacote exato, como `openclaw@2026.4.15`. A lane publicada configura a linha de base com uma receita incorporada de comando `openclaw config set`, depois registra as etapas da receita em `summary.json`. Cobertura mais ampla de versões anteriores deve fragmentar Package Acceptance entre valores exatos de `published_upgrade_survivor_baseline`. As lanes Windows novas de pacote e instalador também verificam que um pacote instalado consegue importar uma substituição de controle de navegador de um caminho Windows absoluto bruto. O smoke de turno de agente OpenAI entre sistemas operacionais usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` como padrão quando definido; caso contrário, usa `openai/gpt-5.4-mini`, para que a prova de instalação e Gateway permaneça rápida e determinística.

### Janelas de compatibilidade legada

Package Acceptance tem janelas limitadas de compatibilidade legada para pacotes já publicados. Pacotes até `2026.4.25`, incluindo `2026.4.25-beta.*`, podem usar o caminho de compatibilidade:

- entradas privadas de QA conhecidas em `dist/postinstall-inventory.json` podem apontar para arquivos omitidos do tarball;
- `doctor-switch` pode pular o subcaso de persistência `gateway install --wrapper` quando o pacote não expõe essa flag;
- `update-channel-switch` pode remover `pnpm.patchedDependencies` ausentes da fixture fake de git derivada do tarball e pode registrar `update.channel` persistido ausente;
- smokes de Plugin podem ler locais legados de registro de instalação ou aceitar persistência ausente de registro de instalação do marketplace;
- `plugin-update` pode permitir migração de metadados de config enquanto ainda exige que o registro de instalação e o comportamento de não reinstalação permaneçam inalterados.

O pacote publicado `2026.4.26` também pode avisar sobre arquivos de carimbo de metadados de build local que já foram entregues. Pacotes posteriores devem satisfazer os contratos modernos; as mesmas condições falham em vez de avisar ou pular.

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
  -f package_ref=release/YYYY.M.D \
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

Ao depurar uma execução de aceitação de pacote com falha, comece pelo resumo de `resolve_package` para confirmar a origem do pacote, a versão e o SHA-256. Depois inspecione a execução filha de `docker_acceptance` e seus artefatos Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logs de lane, tempos de fases e comandos de reexecução. Prefira reexecutar o perfil de pacote com falha ou as lanes Docker exatas em vez de reexecutar a validação completa de release.

## Smoke de instalação

O workflow separado `Install Smoke` reutiliza o mesmo script de escopo por meio do seu próprio job `preflight`. Ele divide a cobertura de smoke em `run_fast_install_smoke` e `run_full_install_smoke`.

- **Caminho rápido** executa para pull requests que tocam superfícies Docker/pacote, alterações de pacote/manifesto de Plugin empacotado ou superfícies centrais de Plugin/canal/Gateway/SDK de Plugin que os jobs de smoke Docker exercitam. Alterações somente de origem em Plugin empacotado, edições somente de teste e edições somente de docs não reservam workers Docker. O caminho rápido cria a imagem Dockerfile raiz uma vez, verifica a CLI, executa o smoke de CLI de agentes delete com workspace compartilhado, executa o e2e gateway-network em container, verifica um argumento de build de Plugin empacotado e executa o perfil Docker de Plugin empacotado limitado sob um timeout agregado de comando de 240 segundos (cada execução Docker de cenário é limitada separadamente).
- **Caminho completo** mantém a instalação de pacote QR e a cobertura Docker/atualização de instalador para execuções agendadas noturnas, dispatches manuais, verificações de release por workflow-call e pull requests que realmente tocam superfícies de instalador/pacote/Docker. No modo completo, install-smoke prepara ou reutiliza uma imagem GHCR de smoke do Dockerfile raiz no SHA-alvo, depois executa instalação de pacote QR, smokes de Dockerfile raiz/Gateway, smokes de instalador/atualização e o E2E Docker rápido de Plugin empacotado como jobs separados para que o trabalho de instalador não espere pelos smokes da imagem raiz.

Pushes para `main` (incluindo commits de merge) não forçam o caminho completo; quando a lógica de escopo alterado solicitaria cobertura completa em um push, o workflow mantém o smoke Docker rápido e deixa o smoke completo de instalação para a validação noturna ou de release.

O smoke lento de provedor de imagem com instalação global Bun é controlado separadamente por `run_bun_global_install_smoke`. Ele executa no agendamento noturno e a partir do workflow de verificações de release, e dispatches manuais de `Install Smoke` podem optar por incluí-lo, mas pull requests e pushes para `main` não. Testes Docker de QR e instalador mantêm seus próprios Dockerfiles focados em instalação.

## E2E Docker local

`pnpm test:docker:all` pré-compila uma imagem compartilhada de teste ao vivo, empacota o OpenClaw uma vez como um tarball npm e cria duas imagens compartilhadas de `scripts/e2e/Dockerfile`:

- um runner Node/Git básico para lanes de instalador/atualização/dependência de Plugin;
- uma imagem funcional que instala o mesmo tarball em `/app` para lanes de funcionalidade normal.

As definições de lane Docker ficam em `scripts/lib/docker-e2e-scenarios.mjs`, a lógica de planner fica em `scripts/lib/docker-e2e-plan.mjs`, e o runner executa apenas o plano selecionado. O escalonador seleciona a imagem por lane com `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, depois executa lanes com `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Ajustes

| Variável                               | Padrão  | Finalidade                                                                                         |
| -------------------------------------- | ------- | -------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Contagem de slots do pool principal para lanes normais.                                            |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Contagem de slots do pool final sensível a provedor.                                               |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Limite de lanes ao vivo concorrentes para que provedores não apliquem throttling.                  |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Limite de lanes concorrentes de instalação npm.                                                    |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Limite de lanes concorrentes com vários serviços.                                                  |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Intervalo entre inícios de lanes para evitar tempestades de criação no daemon Docker; defina `0` para nenhum intervalo. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Timeout fallback por lane (120 minutos); lanes ao vivo/finais selecionadas usam limites menores.   |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` imprime o plano do escalonador sem executar lanes.                                             |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Lista exata de lanes separada por vírgulas; pula o smoke de limpeza para que agentes possam reproduzir uma lane com falha. |

Uma lane mais pesada que seu limite efetivo ainda pode iniciar a partir de um pool vazio e então executar sozinha até liberar capacidade. O agregado local faz preflight do Docker, remove containers E2E obsoletos do OpenClaw, emite status das lanes ativas, persiste tempos de lanes para ordenação da mais longa primeiro e, por padrão, para de agendar novas lanes agrupadas após a primeira falha.

### Fluxo de trabalho live/E2E reutilizável

O fluxo de trabalho live/E2E reutilizável pergunta a `scripts/test-docker-all.mjs --plan-json` qual pacote, tipo de imagem, imagem live, lane e cobertura de credenciais são necessários. `scripts/docker-e2e.mjs` então converte esse plano em saídas e resumos do GitHub. Ele empacota o OpenClaw por meio de `scripts/package-openclaw-for-docker.mjs`, baixa um artefato de pacote da execução atual ou baixa um artefato de pacote de `package_artifact_run_id`; valida o inventário do tarball; constrói e envia imagens Docker E2E GHCR bare/functional marcadas pelo digest do pacote por meio do cache de camadas Docker da Blacksmith quando o plano precisa de lanes com pacote instalado; e reutiliza entradas `docker_e2e_bare_image`/`docker_e2e_functional_image` fornecidas ou imagens existentes de digest de pacote em vez de reconstruir. Pulls de imagem Docker são repetidos com um tempo limite limitado de 180 segundos por tentativa, para que um fluxo travado de registro/cache seja repetido rapidamente em vez de consumir a maior parte do caminho crítico da CI.

### Partes do caminho de lançamento

A cobertura Docker de lançamento executa jobs menores em partes com `OPENCLAW_SKIP_DOCKER_BUILD=1`, para que cada parte baixe apenas o tipo de imagem de que precisa e execute várias lanes por meio do mesmo scheduler ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

As partes Docker de lançamento atuais são `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, de `plugins-runtime-install-a` até `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` e `bundled-channels-contracts`. A parte agregada `bundled-channels` continua disponível para reexecuções manuais únicas, e `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` continuam sendo aliases agregados de plugin/runtime. O alias de lane `install-e2e` continua sendo o alias agregado de reexecução manual para ambas as lanes de instalador de provedor. A parte `bundled-channels` executa lanes divididas `bundled-channel-*` e `bundled-channel-update-*` em vez da lane serial tudo-em-um `bundled-channel-deps`.

OpenWebUI é incorporado a `plugins-runtime-services` quando a cobertura completa de release-path o solicita, e mantém uma parte independente `openwebui` apenas para despachos exclusivos de OpenWebUI. Lanes de atualização de canais empacotados repetem uma vez em caso de falhas transitórias de rede do npm.

Cada parte envia `.artifacts/docker-tests/` com logs de lanes, tempos, `summary.json`, `failures.json`, tempos de fase, JSON do plano do scheduler, tabelas de lanes lentas e comandos de reexecução por lane. A entrada `docker_lanes` do fluxo de trabalho executa lanes selecionadas contra as imagens preparadas em vez dos jobs em partes, o que mantém a depuração de lanes com falha limitada a um job Docker direcionado e prepara, baixa ou reutiliza o artefato de pacote para essa execução; se uma lane selecionada for uma lane Docker live, o job direcionado constrói localmente a imagem de teste live para essa reexecução. Comandos gerados de reexecução por lane no GitHub incluem `package_artifact_run_id`, `package_artifact_name` e entradas de imagem preparadas quando esses valores existem, para que uma lane com falha possa reutilizar o pacote e as imagens exatos da execução com falha.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

O fluxo de trabalho live/E2E agendado executa diariamente a suíte Docker completa de release-path.

## Pré-lançamento de Plugin

`Plugin Prerelease` é uma cobertura de produto/pacote mais cara, então é um fluxo de trabalho separado disparado por `Full Release Validation` ou por um operador explícito. Pull requests normais, pushes em `main` e despachos manuais independentes de CI mantêm essa suíte desativada. Ele balanceia testes de plugins empacotados entre oito workers de extensão; esses jobs de shard de extensão executam até dois grupos de configuração de plugin por vez, com um worker Vitest por grupo e um heap Node maior, para que lotes de plugins pesados em importação não criem jobs extras de CI. O caminho Docker de pré-lançamento exclusivo de lançamento agrupa lanes Docker direcionadas em pequenos grupos para evitar reservar dezenas de runners para jobs de um a três minutos.

## QA Lab

O QA Lab tem lanes de CI dedicadas fora do principal fluxo de trabalho com escopo inteligente.

- O fluxo de trabalho `Parity gate` executa em mudanças de PR correspondentes e despacho manual; ele constrói o runtime privado de QA e compara os pacotes agênticos mock GPT-5.5 e Opus 4.6.
- O fluxo de trabalho `QA-Lab - All Lanes` executa todas as noites em `main` e por despacho manual; ele distribui o gate de paridade mock, a lane Matrix live e as lanes live de Telegram e Discord como jobs paralelos. Jobs live usam o ambiente `qa-live-shared`, e Telegram/Discord usam leases do Convex.

As verificações de lançamento executam lanes de transporte live Matrix e Telegram com o provedor mock determinístico e modelos qualificados por mock (`mock-openai/gpt-5.5` e `mock-openai/gpt-5.5-alt`), para que o contrato do canal fique isolado da latência de modelo live e da inicialização normal de plugin de provedor. O gateway de transporte live desativa a busca de memória porque a paridade de QA cobre o comportamento de memória separadamente; a conectividade de provedor é coberta pelas suítes separadas de modelo live, provedor nativo e provedor Docker.

Matrix usa `--profile fast` para gates agendados e de lançamento, adicionando `--fail-fast` somente quando a CLI em checkout oferece suporte a isso. O padrão da CLI e a entrada manual do fluxo de trabalho continuam sendo `all`; o despacho manual `matrix_profile=all` sempre divide a cobertura completa do Matrix em jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`.

`OpenClaw Release Checks` também executa as lanes críticas de lançamento do QA Lab antes da aprovação de lançamento; seu gate de paridade de QA executa os pacotes candidato e baseline como jobs de lane paralelos, depois baixa ambos os artefatos em um pequeno job de relatório para a comparação final de paridade.

Não coloque o caminho de landing de PR atrás do `Parity gate` a menos que a mudança realmente toque no runtime de QA, na paridade de pacotes de modelo ou em uma superfície pertencente ao fluxo de trabalho de paridade. Para correções normais de canal, configuração, docs ou teste unitário, trate isso como um sinal opcional e siga as evidências de CI/verificação com escopo.

## CodeQL

O fluxo de trabalho `CodeQL` é intencionalmente um scanner de segurança estreito de primeira passagem, não uma varredura completa do repositório. Execuções diárias, manuais e de guarda de pull requests que não são rascunho escaneiam código de fluxos de trabalho do Actions mais as superfícies JavaScript/TypeScript de maior risco com consultas de segurança de alta confiança filtradas para `security-severity` alta/crítica.

A guarda de pull request permanece leve: ela só inicia para mudanças em `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` ou `src`, e executa a mesma matriz de segurança de alta confiança que o fluxo de trabalho agendado. CodeQL de Android e macOS ficam fora dos padrões de PR.

### Categorias de segurança

| Categoria                                         | Superfície                                                                                                                             |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron e baseline de gateway                                                                                     |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementação de canais core mais runtime de plugin de canal, gateway, Plugin SDK, secrets e pontos de contato de auditoria |
| `/codeql-security-high/network-ssrf-boundary`     | Superfícies core de SSRF, parsing de IP, guarda de rede, web-fetch e política de SSRF do Plugin SDK                                    |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, helpers de execução de processo, entrega de saída e gates de execução de ferramentas por agentes                       |
| `/codeql-security-high/plugin-trust-boundary`     | Superfícies de confiança de instalação de Plugin, loader, manifesto, registro, staging de dependências de runtime, carregamento de fonte e contrato de pacote do Plugin SDK |

### Shards de segurança específicos por plataforma

- `CodeQL Android Critical Security` — shard agendado de segurança do Android. Constrói o app Android manualmente para CodeQL no menor runner Linux Blacksmith aceito pela sanidade do fluxo de trabalho. Envia em `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard semanal/manual de segurança do macOS. Constrói o app macOS manualmente para CodeQL no Blacksmith macOS, filtra resultados de build de dependências do SARIF enviado e envia em `/codeql-critical-security/macos`. Mantido fora dos padrões diários porque o build do macOS domina o tempo de execução mesmo quando limpo.

### Categorias de qualidade crítica

`CodeQL Critical Quality` é o shard não relacionado a segurança correspondente. Ele executa apenas consultas de qualidade JavaScript/TypeScript sem segurança e com severidade de erro em superfícies estreitas de alto valor no runner Linux Blacksmith menor. Sua guarda de pull request é intencionalmente menor que o perfil agendado: PRs que não são rascunho executam apenas os shards correspondentes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` e `plugin-sdk-reply-runtime` para mudanças em código de execução de comando/modelo/ferramenta de agente e despacho de resposta, schema/migração/IO de configuração, código de auth/secrets/sandbox/segurança, runtime de canal core e plugin de canal empacotado, protocolo de gateway/método de servidor, cola de runtime de memória/SDK, MCP/processo/entrega de saída, runtime de provedor/catálogo de modelos, diagnósticos de sessão/filas de entrega, loader de plugin, contrato de pacote/Plugin SDK ou runtime de resposta do Plugin SDK. Mudanças de configuração do CodeQL e de fluxo de trabalho de qualidade executam todos os doze shards de qualidade de PR.

Despacho manual aceita:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Os perfis estreitos são hooks de ensino/iteração para executar um shard de qualidade isoladamente.

| Categoria                                               | Superfície                                                                                                                                                                         |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Código de limite de segurança de autenticação, segredos, sandbox, Cron e Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Esquema de configuração, migração, normalização e contratos de IO                                                                                                                  |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Esquemas de protocolo do Gateway e contratos de métodos do servidor                                                                                                                |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementação do canal central e do Plugin de canal incluído                                                                                                          |
| `/codeql-critical-quality/agent-runtime-boundary`       | Execução de comandos, despacho de modelo/provedor, despacho e filas de resposta automática, e contratos de runtime do plano de controle ACP                                        |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP e pontes de ferramentas, helpers de supervisão de processos e contratos de entrega de saída                                                                         |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK do host de memória, fachadas de runtime de memória, aliases do SDK de Plugin de memória, cola de ativação do runtime de memória e comandos de doctor de memória                |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internos da fila de respostas, filas de entrega de sessão, helpers de vinculação/entrega de sessão de saída, superfícies de eventos diagnósticos/pacotes de logs e contratos da CLI de doctor de sessão |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de respostas de entrada do SDK de Plugin, helpers de payload/fragmentação/runtime de resposta, opções de resposta de canal, filas de entrega e helpers de vinculação de sessão/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalização de catálogo de modelos, autenticação e descoberta de provedores, registro de runtime de provedores, padrões/catálogos de provedores e registros de web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Inicialização da UI de controle, persistência local, fluxos de controle do Gateway e contratos de runtime do plano de controle de tarefas                                         |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Busca/pesquisa web central, IO de mídia, compreensão de mídia, geração de imagens e contratos de runtime de geração de mídia                                                       |
| `/codeql-critical-quality/plugin-boundary`              | Contratos de loader, registro, superfície pública e pontos de entrada do SDK de Plugin                                                                                            |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Fonte do SDK de Plugin no lado do pacote publicado e helpers de contrato de pacote de Plugin                                                                                       |

Qualidade permanece separada de segurança para que achados de qualidade possam ser agendados, medidos, desabilitados ou expandidos sem obscurecer o sinal de segurança. A expansão de CodeQL para Swift, Python e Plugins incluídos deve ser adicionada novamente como trabalho de acompanhamento com escopo ou fragmentado somente depois que os perfis estreitos tiverem runtime e sinal estáveis.

## Fluxos de manutenção

### Docs Agent

O workflow `Docs Agent` é uma lane de manutenção do Codex orientada por eventos para manter a documentação existente alinhada com alterações recém-integradas. Ele não tem agenda pura: uma execução bem-sucedida de CI de push não bot em `main` pode acioná-lo, e o disparo manual pode executá-lo diretamente. Invocações por workflow-run são ignoradas quando `main` já avançou ou quando outra execução não ignorada do Docs Agent foi criada na última hora. Quando executa, ele revisa o intervalo de commits do SHA de origem anterior não ignorado do Docs Agent até o `main` atual, de modo que uma execução por hora possa cobrir todas as alterações da main acumuladas desde a última passada de docs.

### Test Performance Agent

O workflow `Test Performance Agent` é uma lane de manutenção do Codex orientada por eventos para testes lentos. Ele não tem agenda pura: uma execução bem-sucedida de CI de push não bot em `main` pode acioná-lo, mas ele é ignorado se outra invocação por workflow-run já executou ou está executando naquele dia UTC. O disparo manual contorna esse bloqueio de atividade diária. A lane cria um relatório de desempenho Vitest agrupado da suíte completa, permite que o Codex faça apenas pequenas correções de desempenho de testes que preservem a cobertura, em vez de refatorações amplas, depois executa novamente o relatório da suíte completa e rejeita alterações que reduzam a contagem de testes aprovados da linha de base. Se a linha de base tiver testes com falha, o Codex pode corrigir apenas falhas óbvias, e o relatório da suíte completa pós-agente deve passar antes que qualquer coisa seja commitada. Quando `main` avança antes de o push do bot entrar, a lane faz rebase do patch validado, executa novamente `pnpm check:changed` e tenta o push de novo; patches obsoletos com conflito são ignorados. Ela usa Ubuntu hospedado pelo GitHub para que a ação do Codex possa manter a mesma postura de segurança drop-sudo que o agente de docs.

### PRs duplicados após merge

O workflow `Duplicate PRs After Merge` é um workflow manual de mantenedor para limpeza de duplicatas pós-integração. Por padrão, ele roda em modo dry-run e só fecha PRs listados explicitamente quando `apply=true`. Antes de modificar o GitHub, ele verifica se o PR integrado foi mesclado e se cada duplicata tem uma issue referenciada compartilhada ou hunks alterados sobrepostos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gates de verificação local e roteamento de alterações

A lógica local de lanes alteradas fica em `scripts/changed-lanes.mjs` e é executada por `scripts/check-changed.mjs`. Esse gate de verificação local é mais estrito sobre limites de arquitetura do que o escopo amplo da plataforma de CI:

- alterações de produção no core executam typecheck de produção e de teste do core, além de lint/guards do core;
- alterações apenas de teste no core executam somente typecheck de teste do core, além de lint do core;
- alterações de produção em extensão executam typecheck de produção e de teste da extensão, além de lint da extensão;
- alterações apenas de teste em extensão executam typecheck de teste da extensão, além de lint da extensão;
- alterações públicas do SDK de Plugin ou de contrato de Plugin expandem para typecheck de extensões porque as extensões dependem desses contratos centrais (varreduras Vitest de extensões continuam sendo trabalho de teste explícito);
- aumentos de versão apenas de metadados de release executam verificações direcionadas de versão/configuração/dependência raiz;
- alterações desconhecidas de raiz/configuração falham de forma segura para todas as lanes de verificação.

O roteamento local de testes alterados fica em `scripts/test-projects.test-support.mjs` e é intencionalmente mais barato que `check:changed`: edições diretas de teste executam os próprios testes, edições de código-fonte preferem mapeamentos explícitos, depois testes irmãos e dependentes do grafo de imports. A configuração compartilhada de entrega em sala de grupo é um dos mapeamentos explícitos: alterações na configuração de resposta visível em grupo, no modo de entrega de resposta de origem ou na rota do prompt de sistema da ferramenta de mensagens passam pelos testes centrais de resposta, além de regressões de entrega do Discord e Slack, para que uma alteração de padrão compartilhado falhe antes do primeiro push do PR. Use `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` somente quando a alteração for ampla o suficiente no harness para que o conjunto mapeado barato não seja uma proxy confiável.

## Validação no Testbox

Execute o Testbox a partir da raiz do repo e prefira uma caixa nova aquecida para prova ampla. Antes de gastar um gate lento em uma caixa que foi reutilizada, expirou ou acabou de relatar uma sincronização inesperadamente grande, execute primeiro `pnpm testbox:sanity` dentro da caixa.

A verificação de sanidade falha rápido quando arquivos raiz obrigatórios, como `pnpm-lock.yaml`, desapareceram ou quando `git status --short` mostra pelo menos 200 exclusões rastreadas. Isso geralmente significa que o estado de sincronização remota não é uma cópia confiável do PR; pare essa caixa e aqueça uma nova em vez de depurar a falha de teste do produto. Para PRs intencionais com grandes exclusões, defina `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para essa execução de sanidade.

`pnpm testbox:run` também encerra uma invocação local da CLI do Blacksmith que permanece na fase de sincronização por mais de cinco minutos sem saída pós-sincronização. Defina `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` para desabilitar esse guard, ou use um valor maior em milissegundos para diffs locais excepcionalmente grandes.

## Relacionados

- [Visão geral da instalação](/pt-BR/install)
- [Canais de desenvolvimento](/pt-BR/install/development-channels)
