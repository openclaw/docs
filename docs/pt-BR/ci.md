---
read_when:
    - Você precisa entender por que um job de CI foi ou não executado
    - Você está depurando uma verificação do GitHub Actions que está falhando
    - Você está coordenando uma execução ou reexecução da validação de lançamento
summary: Grafo de jobs de CI, controles de escopo, agrupadores de lançamento e equivalentes de comandos locais
title: Pipeline de CI
x-i18n:
    generated_at: "2026-04-30T18:38:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: a24afc27606ac7f4e9ead89acdd319bffa23336610f8a6cd8b576ea1a5b233dd
    source_path: ci.md
    workflow: 16
---

OpenClaw CI é executado a cada push para `main` e em toda pull request. O job `preflight` classifica o diff e desativa lanes caras quando apenas áreas não relacionadas mudaram. Execuções manuais via `workflow_dispatch` intencionalmente ignoram o escopo inteligente e expandem o grafo completo para candidatos a release e validação ampla. As lanes de Android permanecem opt-in por meio de `include_android`. A cobertura de plugins exclusiva de release fica no workflow separado [`Plugin Prerelease`](#plugin-prerelease) e só é executada a partir de [`Full Release Validation`](#full-release-validation) ou de um disparo manual explícito.

## Visão geral do pipeline

| Job                              | Propósito                                                                                         | Quando é executado                            |
| -------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `preflight`                      | Detecta alterações apenas de docs, escopos alterados, extensões alteradas e cria o manifesto de CI | Sempre em pushes e PRs que não sejam rascunho |
| `security-scm-fast`              | Detecção de chave privada e auditoria de workflow via `zizmor`                                     | Sempre em pushes e PRs que não sejam rascunho |
| `security-dependency-audit`      | Auditoria de lockfile de produção sem dependências contra advisories do npm                        | Sempre em pushes e PRs que não sejam rascunho |
| `security-fast`                  | Agregado obrigatório para os jobs rápidos de segurança                                             | Sempre em pushes e PRs que não sejam rascunho |
| `check-dependencies`             | Passagem do Knip somente para dependências de produção mais o guarda da allowlist de arquivos não usados | Alterações relevantes para Node               |
| `build-artifacts`                | Compila `dist/`, Control UI, checks de artefatos compilados e artefatos downstream reutilizáveis   | Alterações relevantes para Node               |
| `checks-fast-core`               | Lanes rápidas de correção no Linux, como checks bundled/plugin-contract/protocol                   | Alterações relevantes para Node               |
| `checks-fast-contracts-channels` | Checks fragmentados de contrato de canais com um resultado agregado estável                        | Alterações relevantes para Node               |
| `checks-node-core-test`          | Shards de testes do core Node, excluindo lanes de canal, bundled, contrato e extensão              | Alterações relevantes para Node               |
| `check`                          | Equivalente fragmentado do gate local principal: tipos de produção, lint, guardas, tipos de teste e smoke estrito | Alterações relevantes para Node               |
| `check-additional`               | Shards de arquitetura, boundary, guardas de superfície de extensão, package-boundary e gateway-watch | Alterações relevantes para Node               |
| `build-smoke`                    | Testes smoke da CLI compilada e smoke de memória de inicialização                                  | Alterações relevantes para Node               |
| `checks`                         | Verificador para testes de canal com artefatos compilados                                          | Alterações relevantes para Node               |
| `checks-node-compat-node22`      | Lane de build e smoke de compatibilidade com Node 22                                               | Disparo manual de CI para releases            |
| `check-docs`                     | Formatação, lint e checks de links quebrados da documentação                                       | Docs alterados                                |
| `skills-python`                  | Ruff + pytest para skills baseadas em Python                                                       | Alterações relevantes para skills Python      |
| `checks-windows`                 | Testes específicos de processo/caminho no Windows mais regressões de especificadores de importação do runtime compartilhado | Alterações relevantes para Windows            |
| `macos-node`                     | Lane de testes TypeScript no macOS usando os artefatos compilados compartilhados                   | Alterações relevantes para macOS              |
| `macos-swift`                    | Lint, build e testes Swift para o app macOS                                                        | Alterações relevantes para macOS              |
| `android`                        | Testes unitários Android para ambos os flavors mais um build de APK debug                          | Alterações relevantes para Android            |
| `test-performance-agent`         | Otimização diária de testes lentos do Codex após atividade confiável                               | Sucesso da CI principal ou disparo manual     |

## Ordem de falha rápida

1. `preflight` decide quais lanes existem. A lógica de `docs-scope` e `changed-scope` é composta por etapas dentro desse job, não jobs independentes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falham rapidamente sem esperar pelos jobs mais pesados de artefatos e matriz de plataformas.
3. `build-artifacts` sobrepõe as lanes rápidas do Linux para que consumidores downstream possam começar assim que o build compartilhado estiver pronto.
4. Lanes mais pesadas de plataforma e runtime se expandem depois disso: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

O GitHub pode marcar jobs substituídos como `cancelled` quando um push mais novo chega na mesma PR ou ref `main`. Trate isso como ruído de CI, a menos que a execução mais nova para a mesma ref também esteja falhando. Checks agregados de shards usam `!cancelled() && always()` para que ainda relatem falhas normais de shards, mas não entrem na fila depois que todo o workflow já foi substituído. A chave automática de concorrência da CI é versionada (`CI-v7-*`), então um zumbi do lado do GitHub em um grupo de fila antigo não consegue bloquear indefinidamente execuções mais novas da main. Execuções manuais da suíte completa usam `CI-manual-v1-*` e não cancelam execuções em andamento.

## Escopo e roteamento

A lógica de escopo fica em `scripts/ci-changed-scope.mjs` e é coberta por testes unitários em `src/scripts/ci-changed-scope.test.ts`. O disparo manual ignora a detecção de changed-scope e faz o manifesto de preflight agir como se todas as áreas com escopo tivessem mudado.

- **Edições no workflow de CI** validam o grafo de CI Node mais o lint de workflows, mas não forçam builds nativos de Windows, Android ou macOS por si só; essas lanes de plataforma permanecem escopadas a alterações de código-fonte da plataforma.
- **Edições apenas de roteamento de CI, edições selecionadas de fixtures baratas de testes do core e edições estreitas de helpers/roteamento de testes de contrato de Plugin** usam um caminho rápido de manifesto somente Node: `preflight`, segurança e uma única tarefa `checks-fast-core`. Esse caminho ignora artefatos de build, compatibilidade com Node 22, contratos de canais, shards completos do core, shards de plugins bundled e matrizes de guardas adicionais quando a alteração se limita às superfícies de roteamento ou helpers que a tarefa rápida exercita diretamente.
- **Checks Node no Windows** são escopados a wrappers de processo/caminho específicos do Windows, helpers de runners npm/pnpm/UI, configuração de gerenciador de pacotes e superfícies de workflow de CI que executam essa lane; alterações não relacionadas de código-fonte, Plugin, install-smoke e somente testes permanecem nas lanes Node do Linux.

As famílias mais lentas de testes Node são divididas ou balanceadas para que cada job permaneça pequeno sem reservar runners em excesso: contratos de canais rodam como três shards ponderados, pequenas lanes unitárias do core são pareadas, auto-reply roda como quatro workers balanceados (com a subárvore de reply dividida em shards de agent-runner, dispatch e commands/state-routing), e configurações agentic de Gateway/Plugin são distribuídas entre os jobs Node agentic somente de código-fonte existentes, em vez de esperar por artefatos compilados. Testes amplos de browser, QA, mídia e plugins diversos usam suas configs Vitest dedicadas em vez do catch-all compartilhado de plugins. Shards com padrões de inclusão registram entradas de timing usando o nome do shard de CI, então `.artifacts/vitest-shard-timings.json` consegue distinguir uma config inteira de um shard filtrado. `check-additional` mantém o trabalho de compile/canary de package-boundary junto e separa a arquitetura de topologia de runtime da cobertura de gateway watch; o shard de guarda de boundary executa seus pequenos guardas independentes concorrentemente dentro de um job. Gateway watch, testes de canal e o shard de support-boundary do core rodam concorrentemente dentro de `build-artifacts` depois que `dist/` e `dist-runtime/` já foram compilados.

A CI do Android executa tanto `testPlayDebugUnitTest` quanto `testThirdPartyDebugUnitTest` e depois compila o APK debug Play. O flavor third-party não tem source set ou manifesto separado; sua lane de testes unitários ainda compila o flavor com as flags BuildConfig de SMS/call-log, evitando ao mesmo tempo um job duplicado de empacotamento de APK debug em todo push relevante para Android.

O shard `check-dependencies` executa `pnpm deadcode:dependencies` (uma passagem do Knip somente para dependências de produção fixada na versão mais recente do Knip, com a idade mínima de release do pnpm desativada para a instalação `dlx`) e `pnpm deadcode:unused-files`, que compara as descobertas de arquivos de produção não usados do Knip com `scripts/deadcode-unused-files.allowlist.mjs`. O guarda de arquivos não usados falha quando uma PR adiciona um novo arquivo não usado sem revisão ou deixa uma entrada obsoleta na allowlist, preservando superfícies intencionais de Plugin dinâmico, geradas, de build, de testes live e de ponte de pacote que o Knip não consegue resolver estaticamente.

## Disparos manuais

Disparos manuais de CI executam o mesmo grafo de jobs da CI normal, mas forçam todas as lanes escopadas não Android: shards Node do Linux, shards de plugins bundled, contratos de canais, compatibilidade com Node 22, `check`, `check-additional`, smoke de build, checks de docs, Skills Python, Windows, macOS e i18n do Control UI. Disparos manuais independentes de CI executam Android somente com `include_android=true`; o guarda-chuva de release completo habilita Android passando `include_android=true`. Checks estáticos de prerelease de Plugin, o shard `agentic-plugins` exclusivo de release, a varredura completa em lote de extensões e as lanes Docker de prerelease de plugins são excluídos da CI. A suíte Docker de prerelease só roda quando `Full Release Validation` dispara o workflow separado `Plugin Prerelease` com o gate de release-validation habilitado.

Execuções manuais usam um grupo de concorrência único para que uma suíte completa de candidato a release não seja cancelada por outro push ou execução de PR na mesma ref. A entrada opcional `target_ref` permite que um chamador confiável execute esse grafo contra uma branch, tag ou SHA completo de commit enquanto usa o arquivo de workflow da ref de disparo selecionada.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Executores

| Executor                           | Trabalhos                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, trabalhos rápidos de segurança e agregados (`security-scm-fast`, `security-dependency-audit`, `security-fast`), verificações rápidas de protocolo/contrato/empacotadas, verificações fragmentadas de contrato de canal, fragmentos de `check`, exceto lint, fragmentos e agregados de `check-additional`, verificadores agregados de testes Node, verificações de docs, Skills de Python, workflow-sanity, labeler, auto-response; o preflight de install-smoke também usa Ubuntu hospedado pelo GitHub para que a matriz Blacksmith possa entrar na fila mais cedo |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, fragmentos de menor peso de extensões, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` e `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, fragmentos de testes Node no Linux, fragmentos de testes de Plugin empacotados, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (sensível a CPU o suficiente para que 8 vCPU custasse mais do que economizava); builds Docker de install-smoke (o tempo de fila de 32 vCPU custava mais do que economizava)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` em `openclaw/openclaw`; forks usam `macos-latest` como fallback                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` em `openclaw/openclaw`; forks usam `macos-latest` como fallback                                                                                                                                                                                                                                                                                                                                                                                                 |

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

## Validação completa de lançamento

`Full Release Validation` é o workflow guarda-chuva manual para "executar tudo antes do lançamento". Ele aceita uma branch, tag ou SHA completo de commit, dispara o workflow manual `CI` com esse alvo, dispara `Plugin Prerelease` para comprovação somente de lançamento de Plugin/pacote/estático/Docker e dispara `OpenClaw Release Checks` para install smoke, aceitação de pacote, suítes de caminho de lançamento Docker, live/E2E, OpenWebUI, paridade do QA Lab, Matrix e canais do Telegram. Ele também pode executar o workflow pós-publicação `NPM Telegram Beta E2E` quando uma especificação de pacote publicado é fornecida.

`release_profile` controla a amplitude live/provedor passada para as verificações de lançamento:

- `minimum` mantém os canais críticos de lançamento OpenAI/núcleo mais rápidos.
- `stable` adiciona o conjunto estável de provedores/backends.
- `full` executa a matriz ampla consultiva de provedores/mídia.

O guarda-chuva registra os IDs das execuções filhas disparadas, e o trabalho final `Verify full validation` verifica novamente as conclusões atuais das execuções filhas e anexa tabelas dos trabalhos mais lentos para cada execução filha. Se um workflow filho for reexecutado e ficar verde, reexecute apenas o trabalho verificador pai para atualizar o resultado do guarda-chuva e o resumo de tempos.

Para recuperação, tanto `Full Release Validation` quanto `OpenClaw Release Checks` aceitam `rerun_group`. Use `all` para um candidato de lançamento, `ci` para apenas o filho de CI completo normal, `release-checks` para todos os filhos de lançamento ou um grupo mais estreito: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` no guarda-chuva. Isso mantém a reexecução de uma caixa de lançamento com falha delimitada após uma correção focada.

`OpenClaw Release Checks` usa a referência confiável do workflow para resolver a referência selecionada uma vez em um tarball `release-package-under-test` e então passa esse artefato tanto para o workflow Docker de caminho de lançamento live/E2E quanto para o fragmento de aceitação de pacote. Isso mantém os bytes do pacote consistentes entre as caixas de lançamento e evita reempacotar o mesmo candidato em vários trabalhos filhos.

## Fragmentos live e E2E

O filho live/E2E de lançamento mantém ampla cobertura nativa de `pnpm test:live`, mas a executa como fragmentos nomeados por meio de `scripts/test-live-shard.mjs` em vez de um trabalho serial:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- trabalhos `native-live-src-gateway-profiles` filtrados por provedor
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- fragmentos separados de mídia de áudio/vídeo e fragmentos de música filtrados por provedor

Isso mantém a mesma cobertura de arquivos enquanto torna falhas lentas de provedores live mais fáceis de reexecutar e diagnosticar. Os nomes de fragmentos agregados `native-live-extensions-o-z`, `native-live-extensions-media` e `native-live-extensions-media-music` permanecem válidos para reexecuções manuais de disparo único.

Os fragmentos nativos de mídia live são executados em `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, criado pelo workflow `Live Media Runner Image`. Essa imagem pré-instala `ffmpeg` e `ffprobe`; os trabalhos de mídia apenas verificam os binários antes da configuração. Mantenha as suítes live com Docker em executores Blacksmith normais — trabalhos em contêiner são o lugar errado para iniciar testes Docker aninhados.

Fragmentos live de modelo/backend com Docker usam uma imagem compartilhada separada `ghcr.io/openclaw/openclaw-live-test:<sha>` por commit selecionado. O workflow de lançamento live cria e envia essa imagem uma vez, então os fragmentos Docker live de modelo, Gateway, backend CLI, associação ACP e harness Codex são executados com `OPENCLAW_SKIP_DOCKER_BUILD=1`. Se esses fragmentos recriarem o alvo Docker completo do código-fonte de forma independente, a execução de lançamento está configurada incorretamente e desperdiçará tempo de relógio em builds de imagem duplicados.

## Aceitação de pacote

Use `Package Acceptance` quando a pergunta for "este pacote OpenClaw instalável funciona como produto?" Ela é diferente da CI normal: a CI normal valida a árvore de código-fonte, enquanto a aceitação de pacote valida um único tarball por meio do mesmo harness Docker E2E que usuários exercitam após instalar ou atualizar.

### Trabalhos

1. `resolve_package` faz checkout de `workflow_ref`, resolve um candidato de pacote, escreve `.artifacts/docker-e2e-package/openclaw-current.tgz`, escreve `.artifacts/docker-e2e-package/package-candidate.json`, faz upload de ambos como o artefato `package-under-test` e imprime a origem, a referência do workflow, a referência do pacote, a versão, o SHA-256 e o perfil no resumo da etapa do GitHub.
2. `docker_acceptance` chama `openclaw-live-and-e2e-checks-reusable.yml` com `ref=workflow_ref` e `package_artifact_name=package-under-test`. O workflow reutilizável baixa esse artefato, valida o inventário do tarball, prepara imagens Docker de resumo de pacote quando necessário e executa os canais Docker selecionados contra esse pacote em vez de empacotar o checkout do workflow. Quando um perfil seleciona múltiplos `docker_lanes` direcionados, o workflow reutilizável prepara o pacote e as imagens compartilhadas uma vez e então distribui esses canais como trabalhos Docker direcionados paralelos com artefatos exclusivos.
3. `package_telegram` chama opcionalmente `NPM Telegram Beta E2E`. Ele é executado quando `telegram_mode` não é `none` e instala o mesmo artefato `package-under-test` quando Package Acceptance resolveu um; o disparo autônomo do Telegram ainda pode instalar uma especificação npm publicada.
4. `summary` falha o workflow se a resolução do pacote, a aceitação Docker ou o canal opcional do Telegram falharem.

### Origens de candidatos

- `source=npm` aceita apenas `openclaw@beta`, `openclaw@latest` ou uma versão exata de lançamento do OpenClaw, como `openclaw@2026.4.27-beta.2`. Use isto para aceitação beta/estável publicada.
- `source=ref` empacota uma branch, tag ou SHA completo de commit `package_ref` confiável. O resolvedor busca branches/tags do OpenClaw, verifica se o commit selecionado é alcançável a partir do histórico de branches do repositório ou de uma tag de lançamento, instala dependências em uma worktree desanexada e o empacota com `scripts/package-openclaw-for-docker.mjs`.
- `source=url` baixa um `.tgz` HTTPS; `package_sha256` é obrigatório.
- `source=artifact` baixa um `.tgz` de `artifact_run_id` e `artifact_name`; `package_sha256` é opcional, mas deve ser fornecido para artefatos compartilhados externamente.

Mantenha `workflow_ref` e `package_ref` separados. `workflow_ref` é o código confiável de workflow/harness que executa o teste. `package_ref` é o commit de origem que é empacotado quando `source=ref`. Isso permite que o harness de teste atual valide commits de origem confiáveis mais antigos sem executar lógica antiga de workflow.

### Perfis de suíte

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` mais `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — blocos completos do caminho de lançamento do Docker com OpenWebUI
- `custom` — `docker_lanes` exatos; obrigatório quando `suite_profile=custom`

O perfil `package` usa cobertura offline de plugins, para que a validação de pacote publicado não dependa da disponibilidade live do ClawHub. A lane opcional do Telegram reutiliza o artefato `package-under-test` em `NPM Telegram Beta E2E`, com o caminho da especificação npm publicada mantido para despachos independentes.

As verificações de lançamento chamam Package Acceptance com `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` e `telegram_mode=mock-openai`. Os blocos Docker do caminho de lançamento cobrem as lanes sobrepostas de pacote/atualização/plugin; Package Acceptance mantém a prova nativa do artefato para compatibilidade de canais incluídos, plugin offline e Telegram contra o mesmo tarball de pacote resolvido. As verificações de lançamento entre sistemas operacionais ainda cobrem onboarding, instalador e comportamento de plataforma específicos de SO; a validação de produto de pacote/atualização deve começar com Package Acceptance. As lanes novas de pacote e instalador do Windows também verificam que um pacote instalado pode importar uma substituição de controle de navegador a partir de um caminho absoluto bruto do Windows. O smoke de turno de agente OpenAI entre sistemas operacionais usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` por padrão quando definido; caso contrário, usa `openai/gpt-5.4-mini`, para que a prova de instalação e Gateway permaneça rápida e determinística.

### Janelas de compatibilidade legada

Package Acceptance tem janelas limitadas de compatibilidade legada para pacotes já publicados. Pacotes até `2026.4.25`, incluindo `2026.4.25-beta.*`, podem usar o caminho de compatibilidade:

- entradas privadas de QA conhecidas em `dist/postinstall-inventory.json` podem apontar para arquivos omitidos do tarball;
- `doctor-switch` pode pular o subcaso de persistência de `gateway install --wrapper` quando o pacote não expõe essa flag;
- `update-channel-switch` pode remover `pnpm.patchedDependencies` ausentes do fixture fake de git derivado do tarball e pode registrar em log `update.channel` persistido ausente;
- smokes de plugin podem ler locais legados de registro de instalação ou aceitar persistência ausente de registro de instalação do marketplace;
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

Ao depurar uma execução com falha de aceitação de pacote, comece pelo resumo `resolve_package` para confirmar a origem, a versão e o SHA-256 do pacote. Em seguida, inspecione a execução filha `docker_acceptance` e seus artefatos Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logs de lane, tempos de fase e comandos de nova execução. Prefira executar novamente o perfil de pacote com falha ou as lanes Docker exatas em vez de executar novamente a validação completa de lançamento.

## Smoke de instalação

O workflow separado `Install Smoke` reutiliza o mesmo script de escopo por meio do seu próprio job `preflight`. Ele divide a cobertura de smoke em `run_fast_install_smoke` e `run_full_install_smoke`.

- **Caminho rápido** executa para pull requests que tocam superfícies Docker/pacote, alterações de pacote/manifesto de plugin incluído ou superfícies centrais de plugin/canal/Gateway/Plugin SDK que os jobs de smoke Docker exercitam. Alterações somente de código-fonte em plugin incluído, edições somente de teste e edições somente de documentação não reservam workers Docker. O caminho rápido constrói a imagem do Dockerfile raiz uma vez, verifica a CLI, executa o smoke da CLI de exclusão de agents em workspace compartilhado, executa o e2e gateway-network no contêiner, verifica um argumento de build de plugin incluído e executa o perfil Docker limitado de plugins incluídos sob um tempo limite agregado de comando de 240 segundos (cada execução Docker de cenário limitada separadamente).
- **Caminho completo** mantém a instalação de pacote por QR e a cobertura Docker/update do instalador para execuções noturnas agendadas, despachos manuais, verificações de lançamento via workflow-call e pull requests que realmente tocam superfícies de instalador/pacote/Docker. No modo completo, install-smoke prepara ou reutiliza uma imagem de smoke do Dockerfile raiz GHCR de SHA alvo, depois executa instalação de pacote por QR, smokes do Dockerfile raiz/Gateway, smokes de instalador/update e o E2E Docker rápido de plugin incluído como jobs separados, para que o trabalho do instalador não espere atrás dos smokes da imagem raiz.

Pushes para `main` (incluindo commits de merge) não forçam o caminho completo; quando a lógica de escopo alterado solicitaria cobertura completa em um push, o workflow mantém o smoke Docker rápido e deixa o smoke completo de instalação para a validação noturna ou de lançamento.

O smoke lento de provedor de imagem com instalação global Bun é controlado separadamente por `run_bun_global_install_smoke`. Ele executa na agenda noturna e a partir do workflow de verificações de lançamento, e despachos manuais de `Install Smoke` podem optar por incluí-lo, mas pull requests e pushes para `main` não. Testes Docker de QR e instalador mantêm seus próprios Dockerfiles focados em instalação.

## E2E Docker local

`pnpm test:docker:all` pré-constrói uma imagem compartilhada de teste live, empacota o OpenClaw uma vez como um tarball npm e constrói duas imagens compartilhadas de `scripts/e2e/Dockerfile`:

- um executor Node/Git básico para lanes de instalador/atualização/dependência de plugin;
- uma imagem funcional que instala o mesmo tarball em `/app` para lanes de funcionalidade normal.

As definições de lane Docker ficam em `scripts/lib/docker-e2e-scenarios.mjs`, a lógica de planejamento fica em `scripts/lib/docker-e2e-plan.mjs`, e o executor apenas executa o plano selecionado. O agendador seleciona a imagem por lane com `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, depois executa lanes com `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Ajustáveis

| Variável                               | Padrão | Finalidade                                                                                    |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Contagem de slots do pool principal para lanes normais.                                       |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Contagem de slots do pool final sensível a provedores.                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Limite de lanes live simultâneas para que os provedores não apliquem throttling.              |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Limite de lanes simultâneas de instalação npm.                                                |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Limite de lanes simultâneas com múltiplos serviços.                                           |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Escalonamento entre inícios de lanes para evitar rajadas de criação do daemon Docker; defina `0` para sem escalonamento. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Tempo limite de fallback por lane (120 minutos); lanes live/finais selecionadas usam limites mais rígidos. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` imprime o plano do agendador sem executar lanes.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Lista separada por vírgulas de lanes exatas; pula o smoke de limpeza para que agents possam reproduzir uma lane com falha. |

Uma lane mais pesada que seu limite efetivo ainda pode iniciar a partir de um pool vazio, depois executa sozinha até liberar capacidade. O agregado local pré-verifica Docker, remove contêineres E2E obsoletos do OpenClaw, emite status de lanes ativas, persiste tempos de lane para ordenação do mais longo primeiro e, por padrão, para de agendar novas lanes em pool após a primeira falha.

### Workflow live/E2E reutilizável

O workflow live/E2E reutilizável pergunta a `scripts/test-docker-all.mjs --plan-json` quais coberturas de pacote, tipo de imagem, imagem live, lane e credenciais são necessárias. `scripts/docker-e2e.mjs` então converte esse plano em saídas e resumos do GitHub. Ele empacota o OpenClaw por meio de `scripts/package-openclaw-for-docker.mjs`, baixa um artefato de pacote da execução atual ou baixa um artefato de pacote de `package_artifact_run_id`; valida o inventário do tarball; constrói e envia imagens GHCR Docker E2E básicas/funcionais tagueadas por digest de pacote por meio do cache de camadas Docker da Blacksmith quando o plano precisa de lanes com pacote instalado; e reutiliza entradas fornecidas `docker_e2e_bare_image`/`docker_e2e_functional_image` ou imagens existentes por digest de pacote em vez de reconstruir. Pulls de imagens Docker são tentados novamente com um tempo limite limitado de 180 segundos por tentativa, para que um fluxo travado de registry/cache tente novamente rapidamente em vez de consumir a maior parte do caminho crítico de CI.

### Blocos do caminho de lançamento

A cobertura Docker de lançamento executa jobs menores em blocos com `OPENCLAW_SKIP_DOCKER_BUILD=1`, para que cada bloco puxe apenas o tipo de imagem de que precisa e execute múltiplas lanes pelo mesmo agendador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Os chunks atuais do Docker de release são `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` até `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` e `bundled-channels-contracts`. O chunk agregado `bundled-channels` continua disponível para reexecuções manuais de uma só vez, e `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` continuam sendo aliases agregados de Plugin/runtime. O alias de faixa `install-e2e` continua sendo o alias agregado de reexecução manual para ambas as faixas de instalador de provedor. O chunk `bundled-channels` executa faixas divididas `bundled-channel-*` e `bundled-channel-update-*` em vez da faixa serial tudo-em-um `bundled-channel-deps`.

OpenWebUI é incorporado a `plugins-runtime-services` quando a cobertura completa do caminho de release o solicita, e mantém um chunk independente `openwebui` apenas para dispatches exclusivos do OpenWebUI. As faixas de atualização de canais incluídos tentam novamente uma vez em caso de falhas transitórias de rede do npm.

Cada chunk envia `.artifacts/docker-tests/` com logs de faixas, tempos, `summary.json`, `failures.json`, tempos de fases, JSON do plano do scheduler, tabelas de faixas lentas e comandos de reexecução por faixa. A entrada `docker_lanes` do workflow executa as faixas selecionadas contra as imagens preparadas em vez dos jobs de chunk, o que mantém a depuração de faixas com falha limitada a um job Docker direcionado e prepara, baixa ou reutiliza o artefato de pacote para essa execução; se uma faixa selecionada for uma faixa Docker live, o job direcionado cria a imagem de teste live localmente para essa reexecução. Os comandos gerados de reexecução por faixa do GitHub incluem `package_artifact_run_id`, `package_artifact_name` e entradas de imagem preparada quando esses valores existem, para que uma faixa com falha possa reutilizar o pacote e as imagens exatos da execução com falha.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

O workflow live/E2E agendado executa diariamente a suíte Docker completa do caminho de release.

## Pré-lançamento de Plugin

`Plugin Prerelease` é uma cobertura de produto/pacote mais cara, portanto é um workflow separado disparado por `Full Release Validation` ou por um operador explícito. Pull requests normais, pushes para `main` e dispatches manuais de CI independentes mantêm essa suíte desligada. Ele balanceia os testes de plugins incluídos em oito workers de extensões; esses jobs de shard de extensão executam até dois grupos de configuração de Plugin por vez com um worker Vitest por grupo e um heap Node maior, para que lotes de plugins pesados em importações não criem jobs extras de CI.

## QA Lab

QA Lab tem faixas de CI dedicadas fora do workflow principal com escopo inteligente.

- O workflow `Parity gate` roda em alterações correspondentes de PR e em dispatch manual; ele cria o runtime privado de QA e compara os pacotes agentic simulados de GPT-5.5 e Opus 4.6.
- O workflow `QA-Lab - All Lanes` roda todas as noites em `main` e em dispatch manual; ele distribui o gate de paridade simulado, a faixa Matrix live e as faixas live de Telegram e Discord como jobs paralelos. Jobs live usam o ambiente `qa-live-shared`, e Telegram/Discord usam leases do Convex.

As verificações de release executam faixas de transporte live de Matrix e Telegram com o provedor simulado determinístico e modelos qualificados por mock (`mock-openai/gpt-5.5` e `mock-openai/gpt-5.5-alt`) para que o contrato de canal fique isolado da latência de modelo live e da inicialização normal de Plugin de provedor. O Gateway de transporte live desabilita a busca de memória porque a paridade de QA cobre o comportamento de memória separadamente; a conectividade de provedor é coberta pelas suítes separadas de modelo live, provedor nativo e provedor Docker.

Matrix usa `--profile fast` para gates agendados e de release, adicionando `--fail-fast` apenas quando a CLI no checkout oferece suporte. O padrão da CLI e a entrada manual do workflow continuam sendo `all`; dispatch manual com `matrix_profile=all` sempre fragmenta a cobertura completa de Matrix nos jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`.

`OpenClaw Release Checks` também executa as faixas críticas de release do QA Lab antes da aprovação de release; seu gate de paridade de QA executa os pacotes candidato e baseline como jobs de faixa paralelos, depois baixa ambos os artefatos para um job pequeno de relatório para a comparação final de paridade.

Não coloque o caminho de landing do PR atrás de `Parity gate` a menos que a alteração realmente toque no runtime de QA, na paridade de pacote de modelo ou em uma superfície que o workflow de paridade possui. Para correções normais de canal, configuração, docs ou testes de unidade, trate-o como um sinal opcional e siga as evidências de CI/verificação com escopo.

## CodeQL

O workflow `CodeQL` é intencionalmente um scanner de segurança estreito de primeira passagem, não a varredura completa do repositório. Execuções diárias, manuais e de guarda de pull request não rascunho escaneiam código de workflows do Actions mais as superfícies JavaScript/TypeScript de maior risco com consultas de segurança de alta confiança filtradas para `security-severity` alta/crítica.

A guarda de pull request permanece leve: ela só começa para alterações em `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` ou `src`, e executa a mesma matriz de segurança de alta confiança do workflow agendado. CodeQL de Android e macOS ficam fora dos padrões de PR.

### Categorias de segurança

| Categoria                                         | Superfície                                                                                                                             |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, segredos, sandbox, cron e baseline de Gateway                                                                                    |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementação de canais core mais runtime de Plugin de canal, Gateway, Plugin SDK, segredos, pontos de contato de auditoria |
| `/codeql-security-high/network-ssrf-boundary`     | Superfícies core de SSRF, parsing de IP, guarda de rede, web-fetch e política SSRF do Plugin SDK                                       |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, helpers de execução de processo, entrega de saída e gates de execução de ferramentas de agentes                        |
| `/codeql-security-high/plugin-trust-boundary`     | Superfícies de confiança de instalação de Plugin, loader, manifesto, registro, staging de dependências de runtime, carregamento de fonte e contrato de pacote do Plugin SDK |

### Shards de segurança específicos de plataforma

- `CodeQL Android Critical Security` — shard agendado de segurança Android. Cria o app Android manualmente para o CodeQL no menor runner Blacksmith Linux aceito pela sanidade do workflow. Envia em `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard semanal/manual de segurança macOS. Cria o app macOS manualmente para o CodeQL no Blacksmith macOS, filtra os resultados de build de dependências para fora do SARIF enviado e envia em `/codeql-critical-security/macos`. Mantido fora dos padrões diários porque o build macOS domina o tempo de execução mesmo quando limpo.

### Categorias de Qualidade Crítica

`CodeQL Critical Quality` é o shard não relacionado a segurança correspondente. Ele executa apenas consultas de qualidade JavaScript/TypeScript sem segurança, com severidade de erro, sobre superfícies estreitas de alto valor no runner Blacksmith Linux menor. Sua guarda de pull request é intencionalmente menor que o perfil agendado: PRs não rascunho executam apenas os shards correspondentes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` e `plugin-sdk-reply-runtime` para alterações em código de execução de comando/modelo/ferramenta de agente e dispatch de resposta, código de schema/migração/IO de configuração, código de auth/segredos/sandbox/segurança, runtime de canais core e Plugin de canais incluídos, protocolo de Gateway/método de servidor, runtime de memória/glue de SDK, MCP/processo/entrega de saída, runtime de provedor/catálogo de modelos, diagnósticos de sessão/filas de entrega, loader de Plugin, contrato de Plugin SDK/pacote ou runtime de resposta do Plugin SDK. Alterações na configuração do CodeQL e no workflow de qualidade executam todos os doze shards de qualidade de PR.

Dispatch manual aceita:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Os perfis estreitos são hooks de ensino/iteração para executar um shard de qualidade isoladamente.

| Categoria                                                | Superfície                                                                                                                                                                      |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`             | Autenticação, segredos, sandbox, cron e código de limite de segurança do gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`               | Contratos de esquema de configuração, migração, normalização e IO                                                                                                                |
| `/codeql-critical-quality/gateway-runtime-boundary`      | Esquemas de protocolo do Gateway e contratos de métodos do servidor                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`      | Contratos de implementação de canais centrais e plugins de canal empacotados                                                                                                     |
| `/codeql-critical-quality/agent-runtime-boundary`        | Execução de comandos, despacho de modelo/provedor, despacho e filas de resposta automática, e contratos de runtime do plano de controle ACP                                      |
| `/codeql-critical-quality/mcp-process-runtime-boundary`  | Servidores MCP e pontes de ferramentas, auxiliares de supervisão de processos e contratos de entrega de saída                                                                    |
| `/codeql-critical-quality/memory-runtime-boundary`       | SDK de host de memória, fachadas de runtime de memória, aliases do SDK de Plugin de memória, cola de ativação do runtime de memória e comandos de doctor de memória             |
| `/codeql-critical-quality/session-diagnostics-boundary`  | Internos da fila de respostas, filas de entrega de sessão, auxiliares de vinculação/entrega de sessão de saída, superfícies de evento diagnóstico/pacote de logs e contratos da CLI de doctor de sessão |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`      | Despacho de respostas de entrada do SDK de Plugin, auxiliares de payload/fragmentação/runtime de resposta, opções de resposta de canal, filas de entrega e auxiliares de vinculação de sessão/thread |
| `/codeql-critical-quality/provider-runtime-boundary`     | Normalização de catálogo de modelos, autenticação e descoberta de provedor, registro de runtime de provedor, padrões/catálogos de provedor e registros de web/pesquisa/busca/embedding |
| `/codeql-critical-quality/ui-control-plane`              | Inicialização da UI de controle, persistência local, fluxos de controle do Gateway e contratos de runtime do plano de controle de tarefas                                        |
| `/codeql-critical-quality/web-media-runtime-boundary`    | Contratos de runtime de busca/pesquisa web central, IO de mídia, entendimento de mídia, geração de imagens e geração de mídia                                                   |
| `/codeql-critical-quality/plugin-boundary`               | Contratos de carregador, registro, superfície pública e pontos de entrada do SDK de Plugin                                                                                       |
| `/codeql-critical-quality/plugin-sdk-package-contract`   | Código-fonte do SDK de Plugin no lado do pacote publicado e auxiliares de contrato de pacote de plugin                                                                           |

Qualidade permanece separada de segurança para que descobertas de qualidade possam ser agendadas, medidas, desabilitadas ou expandidas sem obscurecer o sinal de segurança. A expansão do CodeQL para Swift, Python e plugins empacotados deve ser adicionada de volta como trabalho de acompanhamento com escopo definido ou fragmentado somente depois que os perfis estreitos tiverem runtime e sinal estáveis.

## Fluxos de manutenção

### Docs Agent

O fluxo de trabalho `Docs Agent` é uma trilha de manutenção do Codex orientada por eventos para manter a documentação existente alinhada com mudanças recém-integradas. Ele não tem agenda pura: uma execução de CI bem-sucedida de push não bot em `main` pode acioná-lo, e o despacho manual pode executá-lo diretamente. Invocações por execução de fluxo de trabalho são ignoradas quando `main` avançou ou quando outra execução não ignorada do Docs Agent foi criada na última hora. Quando ele é executado, revisa o intervalo de commits do SHA de origem anterior não ignorado do Docs Agent até o `main` atual, de modo que uma execução por hora possa cobrir todas as mudanças no main acumuladas desde a última passagem de documentação.

### Test Performance Agent

O fluxo de trabalho `Test Performance Agent` é uma trilha de manutenção do Codex orientada por eventos para testes lentos. Ele não tem agenda pura: uma execução de CI bem-sucedida de push não bot em `main` pode acioná-lo, mas ele é ignorado se outra invocação por execução de fluxo de trabalho já tiver rodado ou estiver em execução naquele dia UTC. O despacho manual ignora esse bloqueio de atividade diária. A trilha cria um relatório completo de desempenho agrupado do Vitest, permite que o Codex faça apenas pequenas correções de desempenho de testes que preservem a cobertura em vez de refatorações amplas, depois executa novamente o relatório completo e rejeita mudanças que reduzam a contagem de testes aprovados na linha de base. Se a linha de base tiver testes com falha, o Codex pode corrigir apenas falhas óbvias, e o relatório completo pós-agente deve passar antes que qualquer coisa seja commitada. Quando `main` avança antes que o push do bot seja integrado, a trilha rebaseia o patch validado, executa novamente `pnpm check:changed` e tenta o push novamente; patches obsoletos conflitantes são ignorados. Ela usa Ubuntu hospedado pelo GitHub para que a ação do Codex possa manter a mesma postura de segurança sem sudo do agente de documentação.

### PRs duplicados após merge

O fluxo de trabalho `Duplicate PRs After Merge` é um fluxo manual de mantenedor para limpeza de duplicatas após integração. Ele usa dry-run por padrão e só fecha PRs listados explicitamente quando `apply=true`. Antes de modificar o GitHub, ele verifica que o PR integrado foi mesclado e que cada duplicata tem uma issue referenciada compartilhada ou hunks alterados sobrepostos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Portões de verificação local e roteamento de alterações

A lógica local de trilhas alteradas fica em `scripts/changed-lanes.mjs` e é executada por `scripts/check-changed.mjs`. Esse portão de verificação local é mais rigoroso sobre limites de arquitetura do que o escopo amplo da plataforma de CI:

- mudanças de produção no núcleo executam typecheck de produção e de testes do núcleo, além de lint/guardas do núcleo;
- mudanças somente de testes do núcleo executam apenas typecheck de testes do núcleo, além de lint do núcleo;
- mudanças de produção em extensão executam typecheck de produção e de testes da extensão, além de lint da extensão;
- mudanças somente de testes de extensão executam typecheck de testes da extensão, além de lint da extensão;
- mudanças públicas no SDK de Plugin ou no contrato de plugin expandem para typecheck de extensão porque extensões dependem desses contratos centrais (varreduras Vitest de extensão permanecem trabalho de teste explícito);
- aumentos de versão somente de metadados de release executam verificações direcionadas de versão/configuração/dependências raiz;
- mudanças desconhecidas na raiz/configuração falham com segurança para todas as trilhas de verificação.

O roteamento local de testes alterados fica em `scripts/test-projects.test-support.mjs` e é intencionalmente mais barato que `check:changed`: edições diretas de teste executam a si mesmas, edições de código-fonte preferem mapeamentos explícitos, depois testes irmãos e dependentes do grafo de importação. A configuração compartilhada de entrega de sala de grupo é um dos mapeamentos explícitos: mudanças na configuração de resposta visível ao grupo, no modo de entrega de resposta de origem ou no prompt do sistema da ferramenta de mensagens passam pelos testes centrais de resposta, além de regressões de entrega do Discord e Slack, para que uma mudança de padrão compartilhado falhe antes do primeiro push do PR. Use `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` somente quando a mudança for ampla o suficiente no harness para que o conjunto mapeado barato não seja um proxy confiável.

## Validação do Testbox

Execute o Testbox a partir da raiz do repositório e prefira uma caixa nova aquecida para prova ampla. Antes de gastar um portão lento em uma caixa que foi reutilizada, expirou ou acabou de relatar uma sincronização inesperadamente grande, execute primeiro `pnpm testbox:sanity` dentro da caixa.

A verificação de sanidade falha rapidamente quando arquivos raiz obrigatórios, como `pnpm-lock.yaml`, desapareceram ou quando `git status --short` mostra pelo menos 200 exclusões rastreadas. Isso geralmente significa que o estado de sincronização remoto não é uma cópia confiável do PR; pare essa caixa e aqueça uma nova em vez de depurar a falha de teste do produto. Para PRs intencionais com grande volume de exclusões, defina `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para essa execução de sanidade.

`pnpm testbox:run` também encerra uma invocação local da CLI do Blacksmith que permanece na fase de sincronização por mais de cinco minutos sem saída pós-sincronização. Defina `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` para desabilitar essa guarda, ou use um valor maior em milissegundos para diffs locais incomumente grandes.

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Canais de desenvolvimento](/pt-BR/install/development-channels)
