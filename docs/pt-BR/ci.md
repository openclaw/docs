---
read_when:
    - Você precisa entender por que um job de CI foi ou não foi executado
    - Você está depurando uma verificação do GitHub Actions que está falhando
    - Você está coordenando uma execução ou reexecução de validação de lançamento
summary: Grafo de jobs de CI, gates de escopo, guarda-chuvas de release e equivalentes de comandos locais
title: Pipeline de CI
x-i18n:
    generated_at: "2026-04-30T09:39:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9c18f0801864ca1030aac9ea81117b011bd7936388984a1809ce3ae6e906e62
    source_path: ci.md
    workflow: 16
---

OpenClaw CI é executado em cada push para `main` e em cada pull request. O job `preflight` classifica o diff e desativa lanes caras quando apenas áreas não relacionadas mudaram. Execuções manuais de `workflow_dispatch` ignoram intencionalmente o escopo inteligente e expandem o grafo completo para candidatos a lançamento e validação ampla. As lanes do Android permanecem opt-in por meio de `include_android`. A cobertura de Plugin exclusiva de lançamento fica no workflow separado [`Pré-lançamento de Plugin`](#plugin-prerelease) e só é executada a partir de [`Validação Completa de Lançamento`](#full-release-validation) ou de um dispatch manual explícito.

## Visão geral do pipeline

| Job                              | Finalidade                                                                                   | Quando é executado                 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Detectar alterações somente em docs, escopos alterados, extensions alteradas e criar o manifesto de CI | Sempre em pushes e PRs não rascunho |
| `security-scm-fast`              | Detecção de chave privada e auditoria de workflow via `zizmor`                                | Sempre em pushes e PRs não rascunho |
| `security-dependency-audit`      | Auditoria de lockfile de produção sem dependências contra avisos do npm                      | Sempre em pushes e PRs não rascunho |
| `security-fast`                  | Agregado obrigatório para os jobs rápidos de segurança                                        | Sempre em pushes e PRs não rascunho |
| `check-dependencies`             | Passagem do Knip somente para dependências de produção mais a guarda da allowlist de arquivos não usados | Alterações relevantes para Node    |
| `build-artifacts`                | Compilar `dist/`, Control UI, verificações de artefatos compilados e artefatos downstream reutilizáveis | Alterações relevantes para Node    |
| `checks-fast-core`               | Lanes rápidas de correção no Linux, como verificações de bundled/contrato de Plugin/protocolo | Alterações relevantes para Node    |
| `checks-fast-contracts-channels` | Verificações de contrato de canais em shards com um resultado agregado estável                | Alterações relevantes para Node    |
| `checks-node-core-test`          | Shards de testes core do Node, excluindo lanes de canal, bundled, contrato e extension        | Alterações relevantes para Node    |
| `check`                          | Equivalente ao gate local principal em shards: tipos de produção, lint, guardas, tipos de teste e smoke estrito | Alterações relevantes para Node    |
| `check-additional`               | Shards de arquitetura, boundary, guardas de superfície de extension, package-boundary e gateway-watch | Alterações relevantes para Node    |
| `build-smoke`                    | Testes smoke da CLI compilada e smoke de memória de inicialização                             | Alterações relevantes para Node    |
| `checks`                         | Verificador para testes de canal com artefatos compilados                                     | Alterações relevantes para Node    |
| `checks-node-compat-node22`      | Lane de build e smoke de compatibilidade com Node 22                                         | Dispatch manual de CI para lançamentos |
| `check-docs`                     | Formatação de docs, lint e verificações de links quebrados                                    | Docs alteradas                     |
| `skills-python`                  | Ruff + pytest para Skills apoiadas por Python                                                 | Alterações relevantes para Skills em Python |
| `checks-windows`                 | Testes específicos do Windows para processo/caminho mais regressões compartilhadas de especificadores de importação em runtime | Alterações relevantes para Windows |
| `macos-node`                     | Lane de testes TypeScript no macOS usando os artefatos compilados compartilhados              | Alterações relevantes para macOS   |
| `macos-swift`                    | Lint, build e testes Swift para o app macOS                                                   | Alterações relevantes para macOS   |
| `android`                        | Testes unitários Android para ambos os flavors mais um build de APK debug                     | Alterações relevantes para Android |
| `test-performance-agent`         | Otimização diária de testes lentos pelo Codex após atividade confiável                        | Sucesso da CI principal ou dispatch manual |

## Ordem de fail-fast

1. `preflight` decide quais lanes existem. A lógica de `docs-scope` e `changed-scope` são etapas dentro desse job, não jobs independentes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falham rapidamente sem esperar pelos jobs mais pesados de artefatos e matriz de plataformas.
3. `build-artifacts` se sobrepõe às lanes rápidas de Linux para que consumidores downstream possam começar assim que o build compartilhado estiver pronto.
4. Lanes mais pesadas de plataforma e runtime se expandem depois disso: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

O GitHub pode marcar jobs substituídos como `cancelled` quando um push mais novo chega ao mesmo PR ou ref `main`. Trate isso como ruído de CI, a menos que a execução mais nova para a mesma ref também esteja falhando. Verificações agregadas de shards usam `!cancelled() && always()` para que ainda reportem falhas normais de shards, mas não entrem na fila depois que todo o workflow já foi substituído. A chave automática de concorrência da CI é versionada (`CI-v7-*`), para que um zumbi no lado do GitHub em um grupo de fila antigo não bloqueie indefinidamente execuções mais novas da main. Execuções manuais da suíte completa usam `CI-manual-v1-*` e não cancelam execuções em andamento.

## Escopo e roteamento

A lógica de escopo fica em `scripts/ci-changed-scope.mjs` e é coberta por testes unitários em `src/scripts/ci-changed-scope.test.ts`. O dispatch manual ignora a detecção de changed-scope e faz o manifesto de preflight agir como se todas as áreas com escopo tivessem mudado.

- **Edições de workflow de CI** validam o grafo de CI do Node mais o lint de workflow, mas não forçam builds nativos de Windows, Android ou macOS por si só; essas lanes de plataforma permanecem escopadas a alterações de código-fonte da plataforma.
- **Edições apenas de roteamento de CI, edições selecionadas e baratas de fixtures de testes core, e edições estreitas de helper/roteamento de teste de contrato de Plugin** usam um caminho rápido de manifesto somente Node: `preflight`, segurança e uma única tarefa `checks-fast-core`. Esse caminho pula artefatos de build, compatibilidade com Node 22, contratos de canais, shards core completos, shards de Plugin bundled e matrizes adicionais de guardas quando a alteração é limitada às superfícies de roteamento ou helper que a tarefa rápida exercita diretamente.
- **Verificações Node no Windows** são escopadas para wrappers específicos do Windows de processo/caminho, helpers de runner npm/pnpm/UI, configuração de gerenciador de pacotes e as superfícies de workflow de CI que executam essa lane; alterações não relacionadas de código-fonte, Plugin, install-smoke e somente testes permanecem nas lanes Node de Linux.

As famílias de testes Node mais lentas são divididas ou balanceadas para que cada job permaneça pequeno sem reservar runners em excesso: contratos de canais rodam como três shards ponderados, pequenas lanes unitárias core são pareadas, auto-reply roda como quatro workers balanceados (com a subárvore de reply dividida em shards de agent-runner, dispatch e commands/state-routing), e configurações agentic de Gateway/Plugin são distribuídas pelos jobs Node agentic existentes somente de código-fonte em vez de esperar por artefatos compilados. Testes amplos de navegador, QA, mídia e Plugins diversos usam suas configurações Vitest dedicadas em vez do catch-all compartilhado de Plugin. Shards com padrões de inclusão registram entradas de timing usando o nome do shard de CI, para que `.artifacts/vitest-shard-timings.json` consiga distinguir uma configuração inteira de um shard filtrado. `check-additional` mantém trabalho de compile/canary de package-boundary junto e separa a arquitetura de topologia de runtime da cobertura de gateway watch; o shard de guarda de boundary executa suas pequenas guardas independentes concorrentemente dentro de um job. Gateway watch, testes de canais e o shard core de support-boundary rodam concorrentemente dentro de `build-artifacts` depois que `dist/` e `dist-runtime/` já foram compilados.

A CI do Android executa tanto `testPlayDebugUnitTest` quanto `testThirdPartyDebugUnitTest` e então compila o APK debug Play. O flavor de terceiros não tem source set nem manifesto separados; sua lane de testes unitários ainda compila o flavor com as flags BuildConfig de SMS/call-log, enquanto evita um job duplicado de empacotamento de APK debug em cada push relevante para Android.

O shard `check-dependencies` executa `pnpm deadcode:dependencies` (uma passagem do Knip somente para dependências de produção, fixada na versão mais recente do Knip, com a idade mínima de lançamento do pnpm desativada para a instalação via `dlx`) e `pnpm deadcode:unused-files`, que compara os achados de arquivos de produção não usados do Knip contra `scripts/deadcode-unused-files.allowlist.mjs`. A guarda de arquivos não usados falha quando um PR adiciona um novo arquivo não usado sem revisão ou deixa uma entrada obsoleta na allowlist, enquanto preserva superfícies intencionais de Plugin dinâmico, geradas, de build, live-test e bridges de pacote que o Knip não consegue resolver estaticamente.

## Dispatches manuais

Dispatches manuais de CI executam o mesmo grafo de jobs da CI normal, mas forçam todas as lanes com escopo não Android: shards Linux Node, shards de Plugin bundled, contratos de canais, compatibilidade com Node 22, `check`, `check-additional`, build smoke, verificações de docs, Skills em Python, Windows, macOS e i18n da Control UI. Dispatches manuais independentes de CI executam Android somente com `include_android=true`; o umbrella de lançamento completo habilita Android passando `include_android=true`. Verificações estáticas de pré-lançamento de Plugin, o shard exclusivo de lançamento `agentic-plugins`, a varredura completa em lote de extensions e lanes Docker de pré-lançamento de Plugin são excluídos da CI. A suíte Docker de pré-lançamento roda somente quando `Validação Completa de Lançamento` despacha o workflow separado `Pré-lançamento de Plugin` com o gate de validação de lançamento habilitado.

Execuções manuais usam um grupo de concorrência único, para que uma suíte completa de candidato a lançamento não seja cancelada por outro push ou execução de PR na mesma ref. A entrada opcional `target_ref` permite que um chamador confiável execute esse grafo contra uma branch, tag ou SHA completo de commit usando o arquivo de workflow da ref de dispatch selecionada.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Executor                         | Tarefas                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, tarefas e agregações rápidas de segurança (`security-scm-fast`, `security-dependency-audit`, `security-fast`), verificações rápidas de protocolo/contrato/empacotadas, verificações fragmentadas de contrato de canais, fragmentos de `check` exceto lint, fragmentos e agregações de `check-additional`, verificadores de agregação de testes Node, verificações de docs, Skills Python, workflow-sanity, labeler, auto-response; o preflight de install-smoke também usa Ubuntu hospedado no GitHub para que a matriz Blacksmith possa entrar na fila mais cedo |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, fragmentos de extensões de menor peso, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` e `check-test-types`                                                                                                                                                                                                                                                                                                                |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, fragmentos de testes Node no Linux, fragmentos de testes de plugins empacotados, `android`                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (sensível a CPU o suficiente para que 8 vCPU custassem mais do que economizavam); builds Docker de install-smoke (o tempo de fila de 32 vCPU custava mais do que economizava)                                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` em `openclaw/openclaw`; forks recorrem a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` em `openclaw/openclaw`; forks recorrem a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |

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

## Validação Completa de Release

`Full Release Validation` é o workflow guarda-chuva manual para "executar tudo antes do release." Ele aceita um branch, tag ou SHA completo de commit, dispara o workflow manual `CI` com esse alvo, dispara `Plugin Prerelease` para comprovação exclusiva de release de plugin/pacote/estáticos/Docker e dispara `OpenClaw Release Checks` para smoke de instalação, aceitação de pacote, suítes de caminho de release Docker, live/E2E, OpenWebUI, paridade do QA Lab, Matrix e lanes do Telegram. Ele também pode executar o workflow pós-publicação `NPM Telegram Beta E2E` quando uma especificação de pacote publicado é fornecida.

`release_profile` controla a abrangência live/provedor passada para as verificações de release:

- `minimum` mantém as lanes críticas de release OpenAI/core mais rápidas.
- `stable` adiciona o conjunto estável de provedores/backends.
- `full` executa a matriz ampla consultiva de provedores/mídia.

O guarda-chuva registra os IDs das execuções filhas disparadas, e a tarefa final `Verify full validation` verifica novamente as conclusões atuais das execuções filhas e anexa tabelas das tarefas mais lentas de cada execução filha. Se um workflow filho for reexecutado e ficar verde, reexecute apenas a tarefa verificadora pai para atualizar o resultado do guarda-chuva e o resumo de tempo.

Para recuperação, tanto `Full Release Validation` quanto `OpenClaw Release Checks` aceitam `rerun_group`. Use `all` para um candidato a release, `ci` apenas para o filho de CI completo normal, `release-checks` para todos os filhos de release ou um grupo mais restrito: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` no guarda-chuva. Isso mantém uma reexecução de caixa de release com falha limitada após uma correção focada.

`OpenClaw Release Checks` usa a ref de workflow confiável para resolver a ref selecionada uma vez em um tarball `release-package-under-test`, depois passa esse artefato tanto para o workflow Docker de caminho de release live/E2E quanto para o fragmento de aceitação de pacote. Isso mantém os bytes do pacote consistentes entre as caixas de release e evita reempacotar o mesmo candidato em várias tarefas filhas.

## Fragmentos Live e E2E

O filho live/E2E de release mantém cobertura ampla nativa de `pnpm test:live`, mas a executa como fragmentos nomeados por meio de `scripts/test-live-shard.mjs` em vez de uma tarefa serial:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- tarefas `native-live-src-gateway-profiles` filtradas por provedor
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- fragmentos separados de mídia de áudio/vídeo e fragmentos de música filtrados por provedor

Isso mantém a mesma cobertura de arquivos enquanto torna falhas lentas de provedores live mais fáceis de reexecutar e diagnosticar. Os nomes agregados de fragmentos `native-live-extensions-o-z`, `native-live-extensions-media` e `native-live-extensions-media-music` continuam válidos para reexecuções manuais únicas.

Os fragmentos nativos live de mídia rodam em `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, criado pelo workflow `Live Media Runner Image`. Essa imagem pré-instala `ffmpeg` e `ffprobe`; tarefas de mídia apenas verificam os binários antes da configuração. Mantenha suítes live apoiadas por Docker em executores Blacksmith normais — tarefas em contêiner são o lugar errado para iniciar testes Docker aninhados.

Fragmentos live de modelo/backend apoiados por Docker usam uma imagem compartilhada separada `ghcr.io/openclaw/openclaw-live-test:<sha>` por commit selecionado. O workflow live de release cria e envia essa imagem uma vez, depois os fragmentos Docker de modelo live, Gateway, backend CLI, associação ACP e harness Codex rodam com `OPENCLAW_SKIP_DOCKER_BUILD=1`. Se esses fragmentos recompilarem o alvo Docker de código-fonte completo de forma independente, a execução de release está mal configurada e desperdiçará tempo de relógio em builds de imagem duplicados.

## Aceitação de Pacote

Use `Package Acceptance` quando a pergunta for "este pacote OpenClaw instalável funciona como produto?" Ela é diferente da CI normal: a CI normal valida a árvore de código-fonte, enquanto a aceitação de pacote valida um único tarball por meio do mesmo harness Docker E2E que os usuários exercitam após instalar ou atualizar.

### Tarefas

1. `resolve_package` faz checkout de `workflow_ref`, resolve um candidato de pacote, escreve `.artifacts/docker-e2e-package/openclaw-current.tgz`, escreve `.artifacts/docker-e2e-package/package-candidate.json`, envia ambos como o artefato `package-under-test` e imprime a origem, ref do workflow, ref do pacote, versão, SHA-256 e perfil no resumo da etapa do GitHub.
2. `docker_acceptance` chama `openclaw-live-and-e2e-checks-reusable.yml` com `ref=workflow_ref` e `package_artifact_name=package-under-test`. O workflow reutilizável baixa esse artefato, valida o inventário do tarball, prepara imagens Docker de package-digest quando necessário e executa as lanes Docker selecionadas contra esse pacote em vez de empacotar o checkout do workflow. Quando um perfil seleciona várias `docker_lanes` direcionadas, o workflow reutilizável prepara o pacote e as imagens compartilhadas uma vez, depois distribui essas lanes como tarefas Docker direcionadas paralelas com artefatos únicos.
3. `package_telegram` chama opcionalmente `NPM Telegram Beta E2E`. Ele roda quando `telegram_mode` não é `none` e instala o mesmo artefato `package-under-test` quando Package Acceptance resolveu um; uma execução autônoma do Telegram ainda pode instalar uma especificação npm publicada.
4. `summary` falha o workflow se a resolução de pacote, a aceitação Docker ou a lane opcional do Telegram falharem.

### Origens de candidatos

- `source=npm` aceita apenas `openclaw@beta`, `openclaw@latest` ou uma versão exata de lançamento do OpenClaw, como `openclaw@2026.4.27-beta.2`. Use isto para aceitação beta/estável publicada.
- `source=ref` empacota uma branch, tag ou SHA completo de commit confiável de `package_ref`. O resolvedor busca branches/tags do OpenClaw, verifica se o commit selecionado é alcançável a partir do histórico de branches do repositório ou de uma tag de lançamento, instala dependências em um worktree desanexado e o empacota com `scripts/package-openclaw-for-docker.mjs`.
- `source=url` baixa um `.tgz` HTTPS; `package_sha256` é obrigatório.
- `source=artifact` baixa um `.tgz` de `artifact_run_id` e `artifact_name`; `package_sha256` é opcional, mas deve ser fornecido para artefatos compartilhados externamente.

Mantenha `workflow_ref` e `package_ref` separados. `workflow_ref` é o código confiável de workflow/harness que executa o teste. `package_ref` é o commit de origem que é empacotado quando `source=ref`. Isso permite que o harness de teste atual valide commits de origem confiáveis mais antigos sem executar lógica antiga de workflow.

### Perfis de suíte

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` mais `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — blocos completos do caminho de lançamento Docker com OpenWebUI
- `custom` — `docker_lanes` exatos; obrigatório quando `suite_profile=custom`

O perfil `package` usa cobertura de plugin offline para que a validação de pacote publicado não dependa da disponibilidade ao vivo do ClawHub. A lane opcional do Telegram reutiliza o artefato `package-under-test` em `NPM Telegram Beta E2E`, com o caminho de especificação npm publicado mantido para dispatches independentes.

As verificações de lançamento chamam Package Acceptance com `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` e `telegram_mode=mock-openai`. Os blocos Docker do caminho de lançamento cobrem as lanes sobrepostas de package/update/plugin; Package Acceptance mantém a compatibilidade artifact-native de bundled-channel, plugin offline e prova do Telegram contra o mesmo tarball de pacote resolvido. As verificações de lançamento entre sistemas operacionais ainda cobrem onboarding, instalador e comportamento de plataforma específicos de SO; a validação de produto package/update deve começar com Package Acceptance. As lanes novas de pacote e instalador no Windows também verificam que um pacote instalado consegue importar uma substituição de browser-control a partir de um caminho absoluto bruto do Windows. O smoke de turno de agente OpenAI entre sistemas operacionais usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` por padrão quando definido; caso contrário, usa `openai/gpt-5.4-mini`, para que a prova de instalação e Gateway permaneça rápida e determinística.

### Janelas de compatibilidade legada

Package Acceptance tem janelas limitadas de compatibilidade legada para pacotes já publicados. Pacotes até `2026.4.25`, incluindo `2026.4.25-beta.*`, podem usar o caminho de compatibilidade:

- entradas privadas conhecidas de QA em `dist/postinstall-inventory.json` podem apontar para arquivos omitidos do tarball;
- `doctor-switch` pode pular o subcaso de persistência de `gateway install --wrapper` quando o pacote não expõe essa flag;
- `update-channel-switch` pode remover `pnpm.patchedDependencies` ausentes do fixture git falso derivado do tarball e pode registrar `update.channel` persistido ausente;
- smokes de plugin podem ler locais legados de install-record ou aceitar persistência ausente de install-record do marketplace;
- `plugin-update` pode permitir migração de metadados de configuração, ainda exigindo que o registro de instalação e o comportamento sem reinstalação permaneçam inalterados.

O pacote publicado `2026.4.26` também pode alertar sobre arquivos de carimbo de metadados de build local que já foram enviados. Pacotes posteriores devem satisfazer os contratos modernos; as mesmas condições falham em vez de alertar ou pular.

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

Ao depurar uma execução de aceitação de pacote com falha, comece pelo resumo de `resolve_package` para confirmar a origem, a versão e o SHA-256 do pacote. Depois inspecione a execução filha de `docker_acceptance` e seus artefatos Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logs de lane, tempos de fase e comandos de reexecução. Prefira reexecutar o perfil de pacote com falha ou as lanes Docker exatas em vez de reexecutar a validação completa de lançamento.

## Smoke de instalação

O workflow separado `Install Smoke` reutiliza o mesmo script de escopo por meio de seu próprio job `preflight`. Ele divide a cobertura de smoke em `run_fast_install_smoke` e `run_full_install_smoke`.

- **Caminho rápido** é executado para pull requests que tocam superfícies Docker/package, alterações em pacote/manifesto de plugin agrupado ou superfícies centrais de plugin/channel/gateway/Plugin SDK que os jobs de smoke Docker exercitam. Alterações apenas de origem em plugin agrupado, edições apenas em testes e edições apenas em docs não reservam workers Docker. O caminho rápido cria a imagem do Dockerfile raiz uma vez, verifica a CLI, executa o smoke da CLI de exclusão de agents shared-workspace, executa o e2e de gateway-network em contêiner, verifica um argumento de build de extensão agrupada e executa o perfil Docker limitado de bundled-plugin sob um timeout agregado de comando de 240 segundos (cada execução Docker de cenário é limitada separadamente).
- **Caminho completo** mantém a instalação de pacote QR e a cobertura Docker/update de instalador para execuções noturnas agendadas, dispatches manuais, verificações de lançamento por workflow-call e pull requests que realmente tocam superfícies de instalador/package/Docker. No modo completo, install-smoke prepara ou reutiliza uma imagem de smoke do Dockerfile raiz GHCR de SHA-alvo, depois executa instalação de pacote QR, smokes do Dockerfile raiz/Gateway, smokes de instalador/update e o E2E Docker rápido de bundled-plugin como jobs separados para que o trabalho de instalador não espere atrás dos smokes da imagem raiz.

Pushes para `main` (incluindo commits de merge) não forçam o caminho completo; quando a lógica de escopo alterado pediria cobertura completa em um push, o workflow mantém o smoke Docker rápido e deixa o smoke completo de instalação para validação noturna ou de lançamento.

O smoke lento de provedor de imagem com instalação global Bun é controlado separadamente por `run_bun_global_install_smoke`. Ele roda no agendamento noturno e a partir do workflow de verificações de lançamento, e dispatches manuais de `Install Smoke` podem optar por incluí-lo, mas pull requests e pushes para `main` não. Testes Docker de QR e instalador mantêm seus próprios Dockerfiles focados em instalação.

## E2E Docker local

`pnpm test:docker:all` pré-compila uma imagem compartilhada de teste ao vivo, empacota o OpenClaw uma vez como tarball npm e cria duas imagens compartilhadas de `scripts/e2e/Dockerfile`:

- um runner Node/Git mínimo para lanes de instalador/update/dependência de plugin;
- uma imagem funcional que instala o mesmo tarball em `/app` para lanes de funcionalidade normal.

As definições de lane Docker ficam em `scripts/lib/docker-e2e-scenarios.mjs`, a lógica do planejador fica em `scripts/lib/docker-e2e-plan.mjs` e o runner executa apenas o plano selecionado. O agendador seleciona a imagem por lane com `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, depois executa lanes com `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Ajustáveis

| Variável                               | Padrão | Finalidade                                                                                    |
| -------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10     | Contagem de slots do pool principal para lanes normais.                                       |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10     | Contagem de slots do pool final sensível a provedores.                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9      | Limite de lanes ao vivo concorrentes para que provedores não apliquem throttle.               |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10     | Limite de lanes concorrentes de instalação npm.                                               |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7      | Limite de lanes concorrentes de múltiplos serviços.                                           |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000   | Intervalo escalonado entre inícios de lanes para evitar tempestades de criação do daemon Docker; defina `0` para nenhum escalonamento. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Timeout fallback por lane (120 minutos); lanes ao vivo/finais selecionadas usam limites mais restritos. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset  | `1` imprime o plano do agendador sem executar lanes.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset  | Lista separada por vírgulas de lanes exatas; pula o smoke de limpeza para que agents possam reproduzir uma lane com falha. |

Uma lane mais pesada que seu limite efetivo ainda pode iniciar a partir de um pool vazio, depois roda sozinha até liberar capacidade. Os preflights agregados locais verificam Docker, removem contêineres E2E obsoletos do OpenClaw, emitem status de lanes ativas, persistem tempos de lane para ordenação do mais longo primeiro e param de agendar novas lanes agrupadas após a primeira falha por padrão.

### Workflow reutilizável ao vivo/E2E

O workflow reutilizável ao vivo/E2E pergunta a `scripts/test-docker-all.mjs --plan-json` quais coberturas de pacote, tipo de imagem, imagem ao vivo, lane e credencial são necessárias. `scripts/docker-e2e.mjs` então converte esse plano em outputs e resumos do GitHub. Ele empacota o OpenClaw por meio de `scripts/package-openclaw-for-docker.mjs`, baixa um artefato de pacote da execução atual ou baixa um artefato de pacote de `package_artifact_run_id`; valida o inventário do tarball; cria e envia imagens Docker E2E bare/functional do GHCR com tags de digest de pacote por meio do cache de camadas Docker do Blacksmith quando o plano precisa de lanes com pacote instalado; e reutiliza entradas `docker_e2e_bare_image`/`docker_e2e_functional_image` fornecidas ou imagens existentes de digest de pacote em vez de recriá-las. Pulls de imagem Docker são repetidos com um timeout limitado de 180 segundos por tentativa para que um fluxo travado de registry/cache tente novamente rapidamente em vez de consumir a maior parte do caminho crítico da CI.

### Blocos do caminho de lançamento

A cobertura Docker de lançamento executa jobs menores em blocos com `OPENCLAW_SKIP_DOCKER_BUILD=1`, para que cada bloco baixe apenas o tipo de imagem de que precisa e execute várias lanes pelo mesmo agendador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Os chunks Docker da versão atual são `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` até `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` e `bundled-channels-contracts`. O chunk agregado `bundled-channels` continua disponível para reexecuções manuais únicas, e `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` continuam sendo aliases agregados de plugin/runtime. O alias de lane `install-e2e` continua sendo o alias agregado de reexecução manual para ambas as lanes de instalador de provedores. O chunk `bundled-channels` executa lanes divididas `bundled-channel-*` e `bundled-channel-update-*` em vez da lane serial tudo-em-um `bundled-channel-deps`.

OpenWebUI é incorporado a `plugins-runtime-services` quando a cobertura completa do caminho de release a solicita, e mantém um chunk autônomo `openwebui` apenas para despachos exclusivos do OpenWebUI. As lanes de atualização de canais empacotados tentam novamente uma vez em caso de falhas transitórias de rede do npm.

Cada chunk envia `.artifacts/docker-tests/` com logs de lane, tempos, `summary.json`, `failures.json`, tempos de fase, JSON do plano do agendador, tabelas de lanes lentas e comandos de reexecução por lane. A entrada `docker_lanes` do workflow executa lanes selecionadas contra as imagens preparadas em vez dos jobs de chunk, o que mantém a depuração de lanes com falha limitada a um job Docker direcionado e prepara, baixa ou reutiliza o artefato do pacote para essa execução; se uma lane selecionada for uma lane Docker live, o job direcionado compila a imagem de teste live localmente para essa reexecução. Os comandos de reexecução por lane gerados para o GitHub incluem `package_artifact_run_id`, `package_artifact_name` e entradas de imagem preparada quando esses valores existem, para que uma lane com falha possa reutilizar exatamente o mesmo pacote e as mesmas imagens da execução com falha.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

O workflow live/E2E agendado executa diariamente a suíte Docker completa do caminho de release.

## Pré-release de Plugin

`Plugin Prerelease` é uma cobertura de produto/pacote mais cara, então é um workflow separado despachado por `Full Release Validation` ou por um operador explícito. Pull requests normais, pushes para `main` e despachos manuais autônomos de CI mantêm essa suíte desativada. Ele balanceia testes de plugins empacotados entre oito workers de extensão; esses jobs de shard de extensão executam até dois grupos de configuração de plugin por vez, com um worker Vitest por grupo e um heap Node maior para que lotes de plugins com muitas importações não criem jobs extras de CI.

## Laboratório de QA

O Laboratório de QA tem lanes dedicadas de CI fora do workflow principal com escopo inteligente.

- O workflow `Parity gate` executa em alterações correspondentes de PR e por despacho manual; ele compila o runtime privado de QA e compara os pacotes agênticos mock GPT-5.5 e Opus 4.6.
- O workflow `QA-Lab - All Lanes` executa todas as noites em `main` e por despacho manual; ele distribui o mock parity gate, a lane live Matrix e as lanes live Telegram e Discord como jobs paralelos. Jobs live usam o ambiente `qa-live-shared`, e Telegram/Discord usam leases Convex.

As verificações de release executam lanes de transporte live Matrix e Telegram com o provedor mock determinístico e modelos qualificados como mock (`mock-openai/gpt-5.5` e `mock-openai/gpt-5.5-alt`), para que o contrato do canal fique isolado da latência de modelo live e da inicialização normal do plugin de provedor. O Gateway de transporte live desativa a busca de memória porque a paridade de QA cobre o comportamento de memória separadamente; a conectividade de provedor é coberta pelas suítes separadas de modelo live, provedor nativo e provedor Docker.

Matrix usa `--profile fast` para gates agendados e de release, adicionando `--fail-fast` apenas quando a CLI em checkout oferece suporte a isso. O padrão da CLI e a entrada manual do workflow continuam sendo `all`; o despacho manual `matrix_profile=all` sempre divide a cobertura completa do Matrix em jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`.

`OpenClaw Release Checks` também executa as lanes críticas de release do Laboratório de QA antes da aprovação de release; seu gate de paridade de QA executa os pacotes candidato e baseline como jobs de lane paralelos e, em seguida, baixa ambos os artefatos para um pequeno job de relatório para a comparação final de paridade.

Não coloque o caminho de aterrissagem de PR atrás de `Parity gate` a menos que a alteração realmente toque o runtime de QA, a paridade de pacote de modelos ou uma superfície de propriedade do workflow de paridade. Para correções normais de canal, configuração, docs ou testes unitários, trate-o como um sinal opcional e siga a evidência de CI/verificação com escopo.

## CodeQL

O workflow `CodeQL` é intencionalmente um scanner de segurança inicial e estreito, não a varredura completa do repositório. Execuções diárias, manuais e de guarda para pull requests não rascunho analisam código de workflows Actions e as superfícies JavaScript/TypeScript de maior risco com consultas de segurança de alta confiança filtradas para `security-severity` alto/crítico.

A guarda de pull request permanece leve: ela só inicia para alterações em `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` ou `src`, e executa a mesma matriz de segurança de alta confiança que o workflow agendado. CodeQL Android e macOS ficam fora dos padrões de PR.

### Categorias de segurança

| Categoria                                         | Superfície                                                                                                                            |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron e baseline do gateway                                                                                     |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementação de canais core mais runtime do plugin de canal, gateway, Plugin SDK, secrets e pontos de auditoria          |
| `/codeql-security-high/network-ssrf-boundary`     | Superfícies core de SSRF, parsing de IP, proteção de rede, web-fetch e política SSRF do Plugin SDK                                     |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, helpers de execução de processo, entrega de saída e gates de execução de ferramentas de agente                         |
| `/codeql-security-high/plugin-trust-boundary`     | Superfícies de confiança de instalação de Plugin, loader, manifesto, registry, staging de dependências de runtime, carregamento de fontes e contrato de pacote do Plugin SDK |

### Shards de segurança específicos da plataforma

- `CodeQL Android Critical Security` — shard agendado de segurança Android. Compila o app Android manualmente para CodeQL no menor runner Linux Blacksmith aceito pela sanidade do workflow. Envia para `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard semanal/manual de segurança macOS. Compila o app macOS manualmente para CodeQL no Blacksmith macOS, filtra resultados de build de dependências para fora do SARIF enviado e envia para `/codeql-critical-security/macos`. Mantido fora dos padrões diários porque o build macOS domina o tempo de execução mesmo quando está limpo.

### Categorias de qualidade crítica

`CodeQL Critical Quality` é o shard não relacionado a segurança correspondente. Ele executa apenas consultas de qualidade JavaScript/TypeScript sem segurança e com severidade de erro sobre superfícies estreitas de alto valor no runner Linux Blacksmith menor. Sua guarda de pull request é intencionalmente menor que o perfil agendado: PRs não rascunho executam apenas os shards correspondentes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` e `plugin-sdk-reply-runtime` para alterações em código de execução de comandos/modelos/ferramentas de agente e despacho de respostas, código de esquema/migração/IO de configuração, código de auth/secrets/sandbox/segurança, runtime de canal core e plugin de canal empacotado, protocolo/método de servidor do gateway, runtime de memória/glue de SDK, MCP/processo/entrega de saída, runtime de provedor/catálogo de modelos, diagnósticos de sessão/filas de entrega, loader de plugin, contrato de Plugin SDK/pacote ou runtime de resposta do Plugin SDK. Alterações de configuração do CodeQL e do workflow de qualidade executam todos os doze shards de qualidade de PR.

O despacho manual aceita:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Os perfis estreitos são ganchos de ensino/iteração para executar um shard de qualidade isoladamente.

| Categoria                                               | Superfície                                                                                                                                                                |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Código de limite de segurança de autenticação, segredos, sandbox, Cron e Gateway                                                                                         |
| `/codeql-critical-quality/config-boundary`              | Esquema de configuração, migração, normalização e contratos de IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Esquemas de protocolo do Gateway e contratos de métodos do servidor                                                                                                       |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementação do canal principal e de plugins de canal incluídos                                                                                             |
| `/codeql-critical-quality/agent-runtime-boundary`       | Execução de comandos, despacho de modelo/provedor, despacho e filas de resposta automática, e contratos de runtime do plano de controle ACP                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP e pontes de ferramentas, helpers de supervisão de processos e contratos de entrega de saída                                                               |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK do host de memória, facades de runtime de memória, aliases do SDK de Plugin de memória, cola de ativação do runtime de memória e comandos doctor de memória           |
| `/codeql-critical-quality/session-diagnostics-boundary` | Componentes internos da fila de respostas, filas de entrega de sessão, helpers de vinculação/entrega de sessão de saída, superfícies de eventos diagnósticos/pacotes de logs e contratos da CLI doctor de sessão |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de respostas de entrada do SDK de Plugin, helpers de payload/fragmentação/runtime de resposta, opções de resposta de canal, filas de entrega e helpers de vinculação de sessão/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalização do catálogo de modelos, autenticação e descoberta de provedores, registro de runtime de provedores, padrões/catálogos de provedores e registros de web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Inicialização da interface de controle, persistência local, fluxos de controle do Gateway e contratos de runtime do plano de controle de tarefas                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratos de runtime de fetch/search web principal, IO de mídia, compreensão de mídia, geração de imagens e geração de mídia                                             |
| `/codeql-critical-quality/plugin-boundary`              | Contratos de loader, registro, superfície pública e entrypoint do SDK de Plugin                                                                                           |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Fonte publicada do SDK de Plugin no lado do pacote e helpers de contrato de pacote de plugin                                                                              |

Qualidade permanece separada de segurança para que achados de qualidade possam ser agendados, medidos, desativados ou expandidos sem obscurecer o sinal de segurança. A expansão do CodeQL para Swift, Python e plugins incluídos deve ser adicionada de volta como trabalho de acompanhamento escopado ou fragmentado somente depois que os perfis estreitos tiverem runtime e sinal estáveis.

## Fluxos de manutenção

### Agente de Docs

O workflow `Docs Agent` é uma faixa de manutenção do Codex orientada por eventos para manter a documentação existente alinhada com mudanças recém-integradas. Ele não tem uma agenda pura: uma execução de CI bem-sucedida de push não bot em `main` pode acioná-lo, e a execução manual pode rodá-lo diretamente. Invocações por workflow-run são ignoradas quando `main` avançou ou quando outra execução não ignorada do Docs Agent foi criada na última hora. Quando ele roda, revisa o intervalo de commits do SHA de origem anterior não ignorado do Docs Agent até o `main` atual, então uma execução por hora pode cobrir todas as mudanças em main acumuladas desde a última passada de documentação.

### Agente de desempenho de testes

O workflow `Test Performance Agent` é uma faixa de manutenção do Codex orientada por eventos para testes lentos. Ele não tem uma agenda pura: uma execução de CI bem-sucedida de push não bot em `main` pode acioná-lo, mas ele é ignorado se outra invocação por workflow-run já tiver rodado ou estiver rodando naquele dia UTC. A execução manual contorna esse gate de atividade diária. A faixa gera um relatório de desempenho agrupado de Vitest da suíte completa, permite que o Codex faça apenas pequenas correções de desempenho de testes que preservem a cobertura em vez de refatorações amplas, depois roda novamente o relatório da suíte completa e rejeita mudanças que reduzam a contagem de testes aprovados da linha de base. Se a linha de base tiver testes com falha, o Codex pode corrigir somente falhas óbvias e o relatório de suíte completa pós-agente deve passar antes que qualquer coisa seja commitada. Quando `main` avança antes do push do bot ser integrado, a faixa faz rebase do patch validado, roda novamente `pnpm check:changed` e tenta o push de novo; patches obsoletos conflitantes são ignorados. Ela usa Ubuntu hospedado pelo GitHub para que a action do Codex possa manter a mesma postura de segurança drop-sudo do agente de docs.

### PRs duplicados após merge

O workflow `Duplicate PRs After Merge` é um workflow manual de mantenedor para limpeza de duplicatas após integração. Ele usa dry-run por padrão e só fecha PRs listados explicitamente quando `apply=true`. Antes de alterar o GitHub, verifica que o PR integrado recebeu merge e que cada duplicata tem uma issue referenciada compartilhada ou hunks alterados sobrepostos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gates de verificação local e roteamento de mudanças

A lógica local de faixas alteradas fica em `scripts/changed-lanes.mjs` e é executada por `scripts/check-changed.mjs`. Esse gate de verificação local é mais rigoroso sobre limites de arquitetura do que o escopo amplo da plataforma de CI:

- mudanças de produção no core executam typecheck de produção e de teste do core, além de lint/guards do core;
- mudanças somente de teste no core executam apenas typecheck de teste do core, além de lint do core;
- mudanças de produção em extensão executam typecheck de produção e de teste de extensão, além de lint de extensão;
- mudanças somente de teste em extensão executam typecheck de teste de extensão, além de lint de extensão;
- mudanças no SDK de Plugin público ou em contrato de plugin expandem para typecheck de extensão porque extensões dependem desses contratos do core (varreduras Vitest de extensão permanecem trabalho de teste explícito);
- aumentos de versão somente de metadados de release executam verificações direcionadas de versão/configuração/dependência de raiz;
- mudanças desconhecidas de raiz/configuração falham com segurança para todas as faixas de verificação.

O roteamento local de testes alterados fica em `scripts/test-projects.test-support.mjs` e é intencionalmente mais barato que `check:changed`: edições diretas de testes rodam a si mesmas, edições de fonte preferem mapeamentos explícitos, depois testes irmãos e dependentes do grafo de imports. A configuração compartilhada de entrega para salas de grupo é um dos mapeamentos explícitos: mudanças na configuração de resposta visível ao grupo, no modo de entrega de resposta de origem ou no prompt de sistema da ferramenta de mensagens passam pelos testes principais de resposta, além das regressões de entrega do Discord e do Slack, para que uma mudança de padrão compartilhado falhe antes do primeiro push do PR. Use `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` somente quando a mudança for ampla o bastante no harness para que o conjunto mapeado barato não seja um proxy confiável.

## Validação do Testbox

Rode o Testbox a partir da raiz do repositório e prefira uma caixa recém-aquecida para prova ampla. Antes de gastar um gate lento em uma caixa que foi reutilizada, expirou ou acabou de relatar uma sincronização inesperadamente grande, rode primeiro `pnpm testbox:sanity` dentro da caixa.

A verificação de sanidade falha rápido quando arquivos raiz obrigatórios como `pnpm-lock.yaml` desapareceram ou quando `git status --short` mostra pelo menos 200 exclusões rastreadas. Isso geralmente significa que o estado de sincronização remota não é uma cópia confiável do PR; pare essa caixa e aqueça uma nova em vez de depurar a falha de teste do produto. Para PRs intencionais com grandes exclusões, defina `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para essa execução de sanidade.

`pnpm testbox:run` também encerra uma invocação local da CLI Blacksmith que permanece na fase de sincronização por mais de cinco minutos sem saída pós-sincronização. Defina `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` para desativar esse guard, ou use um valor maior em milissegundos para diffs locais incomumente grandes.

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Canais de desenvolvimento](/pt-BR/install/development-channels)
