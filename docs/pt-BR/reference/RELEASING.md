---
read_when:
    - Procurando definições de canais públicos de lançamento
    - Executando validação de lançamento ou aceitação de pacote
    - Buscando nomenclatura e cadência de versões
summary: Faixas de lançamento, lista de verificação do operador, caixas de validação, nomenclatura de versões e cadência
title: Política de lançamento
x-i18n:
    generated_at: "2026-05-02T05:55:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ce380a8277e7c8764359e4ded86d1042dcb250691ac62fbee28651f20aa0580
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw tem três canais públicos de lançamento:

- estável: versões marcadas que publicam no npm `beta` por padrão, ou no npm `latest` quando solicitado explicitamente
- beta: tags de pré-lançamento que publicam no npm `beta`
- dev: o ponteiro móvel de `main`

## Nomeação de versões

- Versão de lançamento estável: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versão de lançamento estável de correção: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versão de pré-lançamento beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Não preencha mês ou dia com zero à esquerda
- `latest` significa a versão estável atual promovida no npm
- `beta` significa o alvo atual de instalação beta
- Lançamentos estáveis e lançamentos estáveis de correção publicam no npm `beta` por padrão; operadores de lançamento podem direcionar explicitamente para `latest`, ou promover uma compilação beta validada posteriormente
- Todo lançamento estável do OpenClaw envia o pacote npm e o app macOS juntos;
  lançamentos beta normalmente validam e publicam primeiro o caminho npm/pacote, com
  compilação/assinatura/notarização do app Mac reservadas para versões estáveis, salvo solicitação explícita

## Cadência de lançamento

- Os lançamentos avançam primeiro pelo beta
- O estável vem somente depois que o beta mais recente é validado
- Mantenedores normalmente criam lançamentos a partir de uma branch `release/YYYY.M.D` criada
  a partir do `main` atual, para que validação e correções de lançamento não bloqueiem novo
  desenvolvimento em `main`
- Se uma tag beta tiver sido enviada ou publicada e precisar de correção, mantenedores criam
  a próxima tag `-beta.N` em vez de excluir ou recriar a tag beta antiga
- Procedimento detalhado de lançamento, aprovações, credenciais e notas de recuperação são
  exclusivos para mantenedores

## Checklist do operador de lançamento

Este checklist é a forma pública do fluxo de lançamento. Credenciais privadas,
assinatura, notarização, recuperação de dist-tag e detalhes de rollback de emergência ficam no
runbook de lançamento exclusivo para mantenedores.

1. Comece do `main` atual: puxe o mais recente, confirme que o commit alvo foi enviado,
   e confirme que o CI do `main` atual está verde o suficiente para criar uma branch a partir dele.
2. Reescreva a seção superior de `CHANGELOG.md` a partir do histórico real de commits com
   `/changelog`, mantenha as entradas voltadas ao usuário, faça commit, envie, e faça rebase/pull
   mais uma vez antes de criar a branch.
3. Revise os registros de compatibilidade de lançamento em
   `src/plugins/compat/registry.ts` e
   `src/commands/doctor/shared/deprecation-compat.ts`. Remova compatibilidade
   expirada somente quando o caminho de atualização continuar coberto, ou registre por que ela está
   sendo mantida intencionalmente.
4. Crie `release/YYYY.M.D` a partir do `main` atual; não faça trabalho normal de lançamento
   diretamente em `main`.
5. Atualize cada local obrigatório de versão para a tag pretendida, então execute o
   preflight determinístico local:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, e `pnpm release:check`.
6. Execute `OpenClaw NPM Release` com `preflight_only=true`. Antes de existir uma tag,
   um SHA completo de 40 caracteres da branch de lançamento é permitido para preflight
   apenas de validação. Salve o `preflight_run_id` bem-sucedido.
7. Inicie todos os testes de pré-lançamento com `Full Release Validation` para a
   branch de lançamento, tag ou SHA completo do commit. Este é o único ponto de entrada manual
   para as quatro grandes caixas de teste de lançamento: Vitest, Docker, QA Lab e Package.
8. Se a validação falhar, corrija na branch de lançamento e execute novamente o menor
   arquivo, canal, job de workflow, perfil de pacote, provedor ou allowlist de modelo que
   prove a correção. Reexecute o guarda-chuva completo somente quando a superfície alterada tornar
   evidências anteriores obsoletas.
9. Para beta, marque `vYYYY.M.D-beta.N`, publique com a dist-tag npm `beta`, então execute
   a aceitação de pacote pós-publicação contra o pacote publicado `openclaw@YYYY.M.D-beta.N`
   ou `openclaw@beta`. Se um beta enviado ou publicado precisar de correção, crie
   o próximo `-beta.N`; não exclua nem reescreva o beta antigo.
10. Para estável, continue somente depois que o beta validado ou candidato a lançamento tiver as
    evidências de validação exigidas. A publicação npm estável reutiliza o artefato de
    preflight bem-sucedido via `preflight_run_id`; a prontidão do lançamento estável macOS
    também exige o `.zip`, `.dmg`, `.dSYM.zip` empacotados e o
    `appcast.xml` atualizado em `main`.
11. Após a publicação, execute o verificador npm pós-publicação, o E2E Telegram opcional
    independente de npm publicado quando precisar de prova de canal pós-publicação,
    promoção de dist-tag quando necessário, notas de lançamento/pré-lançamento do GitHub a partir da
    seção completa correspondente de `CHANGELOG.md`, e as etapas de anúncio do lançamento.

## Preflight de lançamento

- Execute `pnpm check:test-types` antes do preflight de lançamento para que o TypeScript dos testes continue
  coberto fora do gate local mais rápido `pnpm check`
- Execute `pnpm check:architecture` antes do preflight de lançamento para que as verificações mais amplas de
  ciclo de importação e limites de arquitetura fiquem verdes fora do gate local mais rápido
- Execute `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que os artefatos de lançamento
  esperados em `dist/*` e o bundle da Control UI existam para a etapa de validação
  do pacote
- Execute o workflow manual `Full Release Validation` antes da aprovação do lançamento para
  iniciar todas as caixas de teste de pré-lançamento a partir de um único ponto de entrada. Ele aceita uma branch,
  tag ou SHA de commit completo, dispara o `CI` manual e dispara
  `OpenClaw Release Checks` para install smoke, package acceptance, suítes de caminho de
  lançamento do Docker, live/E2E, OpenWebUI, paridade do QA Lab, Matrix e lanes do Telegram. Com
  `release_profile=full` e `rerun_group=all`, ele também executa package
  Telegram E2E contra o artefato `release-package-under-test` dos checks de lançamento.
  Forneça `npm_telegram_package_spec` após publicar quando o mesmo
  Telegram E2E também deve comprovar o pacote npm publicado. Forneça
  `evidence_package_spec` quando o relatório privado de evidências deve comprovar que a
  validação corresponde a um pacote npm publicado sem forçar o Telegram E2E.
  Exemplo:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Execute o workflow manual `Package Acceptance` quando quiser uma prova por canal lateral
  para um candidato de pacote enquanto o trabalho de lançamento continua. Use `source=npm` para
  `openclaw@beta`, `openclaw@latest` ou uma versão exata de lançamento; `source=ref`
  para empacotar uma branch/tag/SHA `package_ref` confiável com o harness
  `workflow_ref` atual; `source=url` para um tarball HTTPS com SHA-256 obrigatório;
  ou `source=artifact` para um tarball enviado por outro run do GitHub
  Actions. O workflow resolve o candidato para
  `package-under-test`, reutiliza o agendador de lançamento Docker E2E contra esse
  tarball e pode executar QA do Telegram contra o mesmo tarball com
  `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`. Quando as
  lanes Docker selecionadas incluem `published-upgrade-survivor`, o artefato do pacote
  é o candidato e `published_upgrade_survivor_baseline` seleciona
  o baseline publicado.
  Exemplo: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Perfis comuns:
  - `smoke`: lanes de instalação/canal/agente, rede do Gateway e recarregamento de configuração
  - `package`: lanes nativas do artefato para pacote/atualização/Plugin sem OpenWebUI ou ClawHub live
  - `product`: perfil de pacote mais canais MCP, limpeza de cron/subagente,
    pesquisa web OpenAI e OpenWebUI
  - `full`: partes do caminho de lançamento Docker com OpenWebUI
  - `custom`: seleção exata de `docker_lanes` para uma reexecução focada
- Execute o workflow manual `CI` diretamente quando você só precisar da cobertura
  completa de CI normal para o candidato de lançamento. Disparos manuais do CI
  ignoram o escopo por alterações e forçam os shards Linux Node, shards de plugins
  incluídos, contratos de canal, compatibilidade com Node 22, `check`,
  `check-additional`, build smoke, verificações de docs, Skills Python, Windows,
  macOS, Android e lanes de i18n da Control UI.
  Exemplo: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Execute `pnpm qa:otel:smoke` ao validar telemetria de lançamento. Ele exercita
  o QA-lab por meio de um receptor OTLP/HTTP local e verifica os nomes de spans
  de trace exportados, atributos limitados e redação de conteúdo/identificadores sem
  exigir Opik, Langfuse ou outro coletor externo.
- Execute `pnpm release:check` antes de todo lançamento marcado com tag
- As verificações de lançamento agora rodam em um workflow manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` também executa o gate de paridade mock do QA Lab mais o perfil
  Matrix live rápido e a lane de QA do Telegram antes da aprovação do lançamento. As lanes live
  usam o ambiente `qa-live-shared`; o Telegram também usa concessões de credenciais
  do Convex CI. Execute o workflow manual `QA-Lab - All Lanes` com
  `matrix_profile=all` e `matrix_shards=true` quando quiser o inventário completo de transporte
  Matrix, mídia e E2EE em paralelo.
- A validação de runtime de instalação e atualização entre sistemas operacionais faz parte dos
  `OpenClaw Release Checks` públicos e do `Full Release Validation`, que chamam o
  workflow reutilizável
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` diretamente
- Essa divisão é intencional: manter o caminho real de lançamento npm curto,
  determinístico e focado em artefatos, enquanto verificações live mais lentas ficam em sua
  própria lane para que não atrasem nem bloqueiem a publicação
- Verificações de lançamento com segredos devem ser disparadas por meio de `Full Release
Validation` ou a partir do ref de workflow `main`/release para que a lógica do workflow e
  os segredos permaneçam controlados
- `OpenClaw Release Checks` aceita uma branch, tag ou SHA de commit completo desde que
  o commit resolvido esteja alcançável a partir de uma branch do OpenClaw ou tag de lançamento
- O preflight somente de validação do `OpenClaw NPM Release` também aceita o SHA completo
  de 40 caracteres do commit atual da branch do workflow sem exigir uma tag enviada por push
- Esse caminho por SHA é somente de validação e não pode ser promovido para uma publicação real
- No modo SHA, o workflow sintetiza `v<package.json version>` apenas para a
  verificação de metadados do pacote; a publicação real ainda exige uma tag de lançamento real
- Ambos os workflows mantêm o caminho real de publicação e promoção nos runners hospedados pelo GitHub,
  enquanto o caminho de validação sem mutação pode usar os runners Linux maiores da Blacksmith
- Esse workflow executa
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando os segredos de workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- O preflight de lançamento npm não espera mais pela lane separada de verificações de lançamento
- Execute `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou a tag beta/correção correspondente) antes da aprovação
- Após a publicação npm, execute
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou a versão beta/correção correspondente) para verificar o caminho de instalação do registry
  publicado em um prefixo temporário novo
- Após uma publicação beta, execute `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  para verificar onboarding do pacote instalado, configuração do Telegram e Telegram E2E real
  contra o pacote npm publicado usando o pool compartilhado de credenciais alugadas do Telegram.
  Execuções locais avulsas de mantenedores podem omitir as vars do Convex e passar as três
  credenciais de ambiente `OPENCLAW_QA_TELEGRAM_*` diretamente.
- Mantenedores podem executar a mesma verificação pós-publicação a partir do GitHub Actions por meio do
  workflow manual `NPM Telegram Beta E2E`. Ele é intencionalmente apenas manual e
  não roda em todo merge.
- A automação de lançamento dos mantenedores agora usa preflight-e-depois-promote:
  - publicação npm real deve passar por um `preflight_run_id` npm bem-sucedido
  - a publicação npm real deve ser disparada a partir da mesma branch `main` ou
    `release/YYYY.M.D` do run de preflight bem-sucedido
  - lançamentos npm estáveis usam `beta` por padrão
  - publicação npm estável pode mirar `latest` explicitamente por entrada do workflow
  - mutação de npm dist-tag baseada em token agora fica em
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    por segurança, porque `npm dist-tag add` ainda precisa de `NPM_TOKEN`, enquanto o
    repositório público mantém publicação apenas com OIDC
  - `macOS Release` público é somente de validação; quando uma tag existe apenas em uma
    branch de lançamento, mas o workflow é disparado a partir de `main`, defina
    `public_release_branch=release/YYYY.M.D`
  - publicação privada real para mac deve passar por `preflight_run_id` e
    `validate_run_id` privados de mac bem-sucedidos
  - os caminhos de publicação reais promovem artefatos preparados em vez de reconstruí-los
    novamente
- Para lançamentos estáveis de correção como `YYYY.M.D-N`, o verificador pós-publicação
  também verifica o mesmo caminho de atualização em prefixo temporário de `YYYY.M.D` para `YYYY.M.D-N`
  para que correções de lançamento não deixem silenciosamente instalações globais antigas no
  payload estável base
- O preflight de lançamento npm falha fechado a menos que o tarball inclua tanto
  `dist/control-ui/index.html` quanto um payload não vazio em `dist/control-ui/assets/`
  para que não enviemos novamente um dashboard de navegador vazio
- A verificação pós-publicação também verifica se os entrypoints de Plugin publicados e
  os metadados do pacote estão presentes no layout instalado a partir do registry. Um lançamento que
  envia payloads de runtime de Plugin ausentes falha no verificador pós-publicação e
  não pode ser promovido para `latest`.
- `pnpm test:install:smoke` também impõe o orçamento de `unpackedSize` do npm pack no
  tarball candidato de atualização, para que o e2e do instalador capture aumento acidental do pacote
  antes do caminho de publicação do lançamento
- Se o trabalho de lançamento tocou no planejamento de CI, manifestos de timing de extensão ou
  matrizes de teste de extensão, regenere e revise as saídas da matriz
  `plugin-prerelease-extension-shard` de propriedade do planejador em
  `.github/workflows/plugin-prerelease.yml` antes da aprovação para que as notas de lançamento
  não descrevam um layout de CI obsoleto
- A prontidão do lançamento estável de macOS também inclui as superfícies de atualização:
  - a release do GitHub deve acabar com os pacotes `.zip`, `.dmg` e `.dSYM.zip`
  - `appcast.xml` em `main` deve apontar para o novo zip estável após a publicação
  - o app empacotado deve manter um bundle id não debug, uma URL de feed Sparkle
    não vazia e um `CFBundleVersion` igual ou superior ao piso canônico de build do Sparkle
    para essa versão de lançamento

## Caixas de teste de lançamento

`Full Release Validation` é como operadores iniciam todos os testes de pré-lançamento a partir de
um único ponto de entrada. Para uma prova de commit fixado em uma branch que muda rapidamente, use o
helper para que cada workflow filho rode a partir de uma branch temporária fixada no SHA
alvo:

```bash
pnpm ci:full-release --sha <full-sha>
```

O helper envia por push `release-ci/<sha>-...`, dispara `Full Release Validation`
a partir dessa branch com `ref=<sha>`, verifica se cada `headSha` de workflow filho
corresponde ao alvo e então exclui a branch temporária. Isso evita comprovar por acidente
um run filho mais novo de `main`.

Para validação de branch ou tag de lançamento, execute-o a partir do ref de workflow `main`
confiável e passe a branch ou tag de lançamento como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

O workflow resolve a ref de destino, despacha `CI` manual com
`target_ref=<release-ref>`, despacha `OpenClaw Release Checks` e despacha
E2E standalone do pacote Telegram quando `release_profile=full` com
`rerun_group=all` ou quando `npm_telegram_package_spec` está definido. `OpenClaw Release
Checks` então expande para smoke de instalação, verificações de release entre sistemas operacionais, cobertura live/E2E Docker
do caminho de release, Package Acceptance com QA de pacote Telegram, QA Lab
parity, Matrix live e Telegram live. Uma execução completa só é aceitável quando o
resumo de `Full Release Validation`
mostra `normal_ci` e `release_checks` como bem-sucedidos. No modo full/all,
o filho `npm_telegram` também deve ser bem-sucedido; fora de full/all ele é ignorado
a menos que um `npm_telegram_package_spec` publicado tenha sido fornecido. O resumo
final do verificador inclui tabelas dos jobs mais lentos para cada execução filha, para que o gerente de release possa ver o caminho crítico atual sem baixar logs.
Consulte [validação completa de release](/pt-BR/reference/full-release-validation) para a
matriz de estágios completa, os nomes exatos dos jobs do workflow, as diferenças entre os perfis stable e full, artefatos e identificadores de reexecução focados.
Workflows filhos são despachados a partir da ref confiável que executa `Full Release
Validation`, normalmente `--ref main`, mesmo quando a `ref` de destino aponta para um
branch ou tag de release mais antigo. Não há uma entrada workflow-ref separada para Full Release Validation; escolha o harness confiável escolhendo a ref da execução do workflow.
Não use `--ref main -f ref=<sha>` para prova de commit exato em `main` móvel;
SHAs de commit brutos não podem ser refs de despacho de workflow, então use
`pnpm ci:full-release --sha <sha>` para criar o branch temporário fixado.

Use `release_profile` para selecionar a amplitude live/provider:

- `minimum`: caminho OpenAI/core live e Docker mais rápido e crítico para release
- `stable`: minimum mais cobertura stable de provider/backend para aprovação de release
- `full`: stable mais cobertura ampla de providers/media consultivos

`OpenClaw Release Checks` usa a ref confiável do workflow para resolver a ref de destino
uma vez como `release-package-under-test` e reutiliza esse artefato tanto nas
verificações Docker do caminho de release quanto em Package Acceptance. Isso mantém todas as
boxes voltadas a pacote nos mesmos bytes e evita builds repetidos de pacote.
O smoke de instalação OpenAI entre sistemas operacionais usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando a
variável do repo/org está definida, caso contrário `openai/gpt-5.5`, porque esta lane está
provando instalação de pacote, onboarding, inicialização do Gateway e uma interação live de agente
em vez de medir o modelo padrão mais lento. A matriz live mais ampla de provider
continua sendo o lugar para cobertura específica de modelo.

Use estas variantes dependendo do estágio da release:

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Validate an exact pushed commit.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# After publishing a beta, add published-package Telegram E2E.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Não use o guarda-chuva completo como a primeira reexecução depois de uma correção focada. Se uma box
falhar, use o workflow filho, job, lane Docker, perfil de pacote, provider de modelo
ou lane de QA que falhou para a próxima prova. Execute o guarda-chuva completo novamente somente quando
a correção alterou a orquestração compartilhada de release ou tornou obsoleta a evidência anterior
de todas as boxes. O verificador final do guarda-chuva verifica novamente os ids registrados das execuções de workflows filhos, então depois que um workflow filho for reexecutado com sucesso, reexecute somente o job pai
`Verify full validation` que falhou.

Para recuperação limitada, passe `rerun_group` para o guarda-chuva. `all` é a execução real
de candidato a release, `ci` executa somente o filho de CI normal, `plugin-prerelease`
executa somente o filho de plugin exclusivo de release, `release-checks` executa todas as boxes de release, e os grupos de release mais estreitos são `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` e `npm-telegram`.
Reexecuções focadas de `npm-telegram` exigem `npm_telegram_package_spec`; execuções full/all
com `release_profile=full` usam o artefato de pacote de release-checks.

### Vitest

A box Vitest é o workflow filho `CI` manual. A CI manual intencionalmente
ignora o escopo por mudanças e força o grafo de testes normal para o candidato
a release: shards Linux Node, shards de plugins empacotados, contratos de canal, compatibilidade com Node 22, `check`, `check-additional`, smoke de build, verificações de docs, Skills em Python, Windows, macOS, Android e i18n da Control UI.

Use esta box para responder "a árvore de código-fonte passou pela suíte completa normal de testes?"
Ela não é o mesmo que validação de produto no caminho de release. Evidências a manter:

- resumo de `Full Release Validation` mostrando a URL da execução de `CI` despachada
- execução de `CI` verde no SHA exato de destino
- nomes de shards com falha ou lentos dos jobs de CI ao investigar regressões
- artefatos de tempo do Vitest, como `.artifacts/vitest-shard-timings.json`, quando
  uma execução precisa de análise de desempenho

Execute a CI manual diretamente somente quando a release precisar de CI normal determinística, mas
não das boxes Docker, QA Lab, live, entre sistemas operacionais ou de pacote:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

A box Docker fica em `OpenClaw Release Checks` por meio de
`openclaw-live-and-e2e-checks-reusable.yml`, mais o workflow
`install-smoke` em modo release. Ela valida o candidato a release por meio de ambientes
Docker empacotados em vez de apenas testes no nível do código-fonte.

A cobertura Docker de release inclui:

- smoke de instalação completo com o smoke lento de instalação global do Bun ativado
- preparação/reutilização da imagem de smoke do Dockerfile raiz pelo SHA de destino, com jobs de QR,
  raiz/gateway e smoke de instalador/Bun rodando como shards install-smoke separados
- lanes E2E do repositório
- chunks Docker do caminho de release: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` e `plugins-runtime-install-h`
- cobertura OpenWebUI dentro do chunk `plugins-runtime-services` quando solicitada
- lanes divididas de instalação/desinstalação de plugins empacotados
  `bundled-plugin-install-uninstall-0` até
  `bundled-plugin-install-uninstall-23`
- suítes live/E2E de provider e cobertura live de modelo Docker quando release checks
  incluem suítes live

Use artefatos Docker antes de reexecutar. O agendador do caminho de release faz upload de
`.artifacts/docker-tests/` com logs de lanes, `summary.json`, `failures.json`,
tempos de fases, JSON do plano do agendador e comandos de reexecução. Para recuperação focada,
use `docker_lanes=<lane[,lane]>` no workflow reutilizável live/E2E em vez de
reexecutar todos os chunks de release. Comandos de reexecução gerados incluem
`package_artifact_run_id` anterior e entradas de imagens Docker preparadas quando disponíveis, para que uma
lane com falha possa reutilizar o mesmo tarball e imagens GHCR.

### QA Lab

A box QA Lab também faz parte de `OpenClaw Release Checks`. Ela é o gate de release
de comportamento agente e nível de canal, separado da mecânica de pacote do Vitest e Docker.

A cobertura QA Lab de release inclui:

- gate de parity mock comparando a lane candidata OpenAI com a baseline Opus 4.6
  usando o pacote de parity agente
- perfil rápido de QA Matrix live usando o ambiente `qa-live-shared`
- lane QA live Telegram usando leases de credenciais Convex CI
- `pnpm qa:otel:smoke` quando a telemetria de release precisa de prova local explícita

Use esta box para responder "a release se comporta corretamente em cenários de QA e
fluxos live de canal?" Mantenha as URLs dos artefatos para as lanes de parity, Matrix e Telegram
ao aprovar a release. A cobertura Matrix completa continua disponível como uma
execução manual fragmentada do QA-Lab, em vez da lane padrão crítica para release.

### Pacote

A box Package é o gate do produto instalável. Ela é apoiada por
`Package Acceptance` e pelo resolvedor
`scripts/resolve-openclaw-package-candidate.mjs`. O resolvedor normaliza um
candidato no tarball `package-under-test` consumido pelo Docker E2E, valida
o inventário do pacote, registra a versão e o SHA-256 do pacote, e mantém a
ref do harness do workflow separada da ref de origem do pacote.

Fontes de candidato aceitas:

- `source=npm`: `openclaw@beta`, `openclaw@latest` ou uma versão exata de release do OpenClaw
- `source=ref`: empacota um branch, tag ou SHA de commit completo de `package_ref` confiável
  com o harness `workflow_ref` selecionado
- `source=url`: baixa um `.tgz` HTTPS com `package_sha256` obrigatório
- `source=artifact`: reutiliza um `.tgz` enviado por outra execução do GitHub Actions

`OpenClaw Release Checks` executa Package Acceptance com `source=artifact`, o
artefato preparado do pacote de release, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=release-history`,
`published_upgrade_survivor_scenarios=reported-issues` e
`telegram_mode=mock-openai`. Package Acceptance mantém migração, atualização, limpeza de dependências obsoletas de plugin, fixtures offline de plugin, atualização de plugin e QA de pacote Telegram contra o mesmo tarball resolvido. Ela é a substituição nativa do GitHub para a maior parte da cobertura de pacote/atualização que antes exigia Parallels. Verificações de release entre sistemas operacionais ainda importam para onboarding, instalador e comportamento específicos de sistema operacional, mas a validação de produto de pacote/atualização deve
preferir Package Acceptance.

A checklist canônica para validação de atualização e plugin é
[Testando atualizações e plugins](/pt-BR/help/testing-updates-plugins). Use-a ao
decidir qual lane local, Docker, Package Acceptance ou release-check prova uma
mudança de instalação/atualização de plugin, limpeza pelo doctor ou migração de pacote publicado.
A migração exaustiva de atualização publicada a partir de todo pacote stable `2026.4.23+` é
um workflow manual `Update Migration` separado, não parte da Full Release CI.

A leniência legada de package-acceptance é intencionalmente limitada no tempo. Pacotes até
`2026.4.25` podem usar o caminho de compatibilidade para lacunas de metadados já publicadas
no npm: entradas privadas de inventário QA ausentes do tarball, ausência de
`gateway install --wrapper`, arquivos de patch ausentes na fixture git derivada do tarball, ausência de `update.channel` persistido, locais legados de registro de instalação de plugin, persistência ausente de registro de instalação do marketplace e migração de metadados de configuração durante `plugins update`. O pacote publicado `2026.4.26` pode avisar
sobre arquivos locais de carimbo de metadados de build que já foram enviados. Pacotes posteriores
devem satisfazer os contratos modernos de pacote; essas mesmas lacunas falham na validação
de release.

Use perfis mais amplos de Package Acceptance quando a pergunta de release for sobre um
pacote instalável real:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

Perfis comuns de pacote:

- `smoke`: instalação rápida de pacote/canal/agente, rede do Gateway e lanes de recarregamento de configuração
- `package`: contratos de instalação/atualização/pacote de plugin sem ClawHub live; este é o padrão
  de release-check
- `product`: `package` mais canais MCP, limpeza de cron/subagente, busca web OpenAI
  e OpenWebUI
- `full`: chunks Docker do caminho de release com OpenWebUI
- `custom`: lista exata de `docker_lanes` para reexecuções focadas

Para prova do Telegram de candidato a pacote, habilite `telegram_mode=mock-openai` ou
`telegram_mode=live-frontier` no Aceitação de Pacote. O workflow passa o tarball
`package-under-test` resolvido para a faixa do Telegram; o workflow autônomo do
Telegram ainda aceita uma especificação npm publicada para verificações pós-publicação.

## Entradas do workflow NPM

`OpenClaw NPM Release` aceita estas entradas controladas pelo operador:

- `tag`: tag de lançamento obrigatória, como `v2026.4.2`, `v2026.4.2-1` ou
  `v2026.4.2-beta.1`; quando `preflight_only=true`, também pode ser o SHA de
  commit completo de 40 caracteres atual da branch do workflow para preflight
  apenas de validação
- `preflight_only`: `true` apenas para validação/build/pacote, `false` para o
  caminho real de publicação
- `preflight_run_id`: obrigatório no caminho real de publicação para que o workflow reutilize
  o tarball preparado da execução de preflight bem-sucedida
- `npm_dist_tag`: tag npm de destino para o caminho de publicação; o padrão é `beta`

`OpenClaw Release Checks` aceita estas entradas controladas pelo operador:

- `ref`: branch, tag ou SHA de commit completo a validar. Verificações que usam secrets
  exigem que o commit resolvido seja alcançável a partir de uma branch do OpenClaw ou
  de uma tag de lançamento.

Regras:

- Tags estáveis e de correção podem publicar em `beta` ou `latest`
- Tags de pré-lançamento beta podem publicar apenas em `beta`
- Para `OpenClaw NPM Release`, entrada de SHA de commit completo só é permitida quando
  `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` são sempre
  apenas de validação
- O caminho real de publicação deve usar o mesmo `npm_dist_tag` usado durante o preflight;
  o workflow verifica esses metadados antes de a publicação continuar

## Sequência de lançamento npm estável

Ao fazer um lançamento npm estável:

1. Execute `OpenClaw NPM Release` com `preflight_only=true`
   - Antes de existir uma tag, você pode usar o SHA de commit completo atual da branch
     do workflow para uma execução de ensaio apenas de validação do workflow de preflight
2. Escolha `npm_dist_tag=beta` para o fluxo normal beta-primeiro, ou `latest` apenas
   quando você intencionalmente quiser uma publicação estável direta
3. Execute `Full Release Validation` na branch de lançamento, tag de lançamento ou SHA de
   commit completo quando quiser CI normal mais cache de prompt ao vivo, Docker, QA Lab,
   Matrix e cobertura do Telegram em um único workflow manual
4. Se você intencionalmente precisar apenas do grafo de testes normal determinístico, execute o
   workflow manual `CI` na ref de lançamento
5. Salve o `preflight_run_id` bem-sucedido
6. Execute `OpenClaw NPM Release` novamente com `preflight_only=false`, a mesma
   `tag`, o mesmo `npm_dist_tag` e o `preflight_run_id` salvo
7. Se o lançamento chegou em `beta`, use o workflow privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover essa versão estável de `beta` para `latest`
8. Se o lançamento foi publicado intencionalmente diretamente em `latest` e `beta`
   deve seguir imediatamente o mesmo build estável, use esse mesmo workflow privado
   para apontar ambas as dist-tags para a versão estável, ou deixe a sincronização
   de autocorreção agendada mover `beta` depois

A mutação de dist-tag fica no repositório privado por segurança, porque ainda
exige `NPM_TOKEN`, enquanto o repositório público mantém publicação somente com OIDC.

Isso mantém o caminho de publicação direta e o caminho de promoção beta-primeiro
documentados e visíveis ao operador.

Se um mantenedor precisar recorrer à autenticação npm local, execute quaisquer comandos
da CLI (`op`) do 1Password apenas dentro de uma sessão tmux dedicada. Não chame `op`
diretamente do shell principal do agente; mantê-lo dentro do tmux torna prompts,
alertas e manuseio de OTP observáveis e evita alertas repetidos do host.

## Referências públicas

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Mantenedores usam os docs privados de lançamento em
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
para o runbook real.

## Relacionado

- [Canais de lançamento](/pt-BR/install/development-channels)
