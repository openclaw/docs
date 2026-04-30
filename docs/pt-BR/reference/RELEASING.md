---
read_when:
    - Procurando definições de canais de lançamento públicos
    - Executando a validação de lançamento ou a aceitação de pacote
    - Procurando nomenclatura e cadência de versões
summary: Faixas de lançamento, checklist do operador, caixas de validação, nomenclatura de versões e cadência
title: Política de lançamento
x-i18n:
    generated_at: "2026-04-30T10:07:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 54dc9ad7918ac95ec535a0404bbcbc04461a2b977151db0c2039b91e7e69c15c
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw tem três faixas públicas de lançamento:

- stable: lançamentos com tag que publicam no npm `beta` por padrão, ou no npm `latest` quando solicitado explicitamente
- beta: tags de pré-lançamento que publicam no npm `beta`
- dev: a ponta móvel de `main`

## Nomenclatura de versões

- Versão de lançamento estável: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versão de lançamento de correção estável: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versão de pré-lançamento beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Não preencha mês ou dia com zero à esquerda
- `latest` significa o lançamento npm estável promovido atual
- `beta` significa o alvo atual de instalação beta
- Lançamentos estáveis e lançamentos de correção estáveis publicam no npm `beta` por padrão; operadores de lançamento podem direcionar para `latest` explicitamente, ou promover uma build beta validada posteriormente
- Todo lançamento estável do OpenClaw envia junto o pacote npm e o app macOS;
  lançamentos beta normalmente validam e publicam primeiro o caminho npm/pacote, com
  build/assinatura/notarização do app Mac reservados para estável, a menos que solicitados explicitamente

## Cadência de lançamentos

- Lançamentos seguem primeiro pelo beta
- O estável vem somente depois que o beta mais recente é validado
- Mantenedores normalmente criam lançamentos a partir de uma branch `release/YYYY.M.D` criada
  a partir do `main` atual, para que a validação e as correções de lançamento não bloqueiem o novo
  desenvolvimento em `main`
- Se uma tag beta foi enviada ou publicada e precisa de uma correção, os mantenedores criam
  a próxima tag `-beta.N` em vez de excluir ou recriar a tag beta antiga
- Procedimento detalhado de lançamento, aprovações, credenciais e notas de recuperação são
  exclusivos para mantenedores

## Checklist do operador de lançamento

Este checklist é o formato público do fluxo de lançamento. Credenciais privadas,
assinatura, notarização, recuperação de dist-tag e detalhes de rollback de emergência permanecem no
manual de execução de lançamento exclusivo para mantenedores.

1. Comece a partir do `main` atual: puxe o mais recente, confirme que o commit de destino foi enviado,
   e confirme que o CI do `main` atual está verde o suficiente para criar uma branch a partir dele.
2. Reescreva a seção superior de `CHANGELOG.md` a partir do histórico real de commits com
   `/changelog`, mantenha as entradas voltadas ao usuário, faça commit, envie, e faça rebase/pull
   mais uma vez antes de criar a branch.
3. Revise os registros de compatibilidade de lançamento em
   `src/plugins/compat/registry.ts` e
   `src/commands/doctor/shared/deprecation-compat.ts`. Remova compatibilidade expirada
   somente quando o caminho de atualização continuar coberto, ou registre por que ela está
   sendo mantida intencionalmente.
4. Crie `release/YYYY.M.D` a partir do `main` atual; não faça trabalho normal de lançamento
   diretamente em `main`.
5. Atualize cada local obrigatório de versão para a tag pretendida, depois execute a
   pré-validação determinística local:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` e `pnpm release:check`.
6. Execute `OpenClaw NPM Release` com `preflight_only=true`. Antes de uma tag existir,
   um SHA completo de 40 caracteres da branch de lançamento é permitido para pré-validação
   somente de validação. Salve o `preflight_run_id` bem-sucedido.
7. Inicie todos os testes de pré-lançamento com `Full Release Validation` para a
   branch de lançamento, tag ou SHA completo do commit. Este é o único ponto de entrada manual
   para as quatro grandes caixas de teste de lançamento: Vitest, Docker, QA Lab e Package.
8. Se a validação falhar, corrija na branch de lançamento e execute novamente o menor
   arquivo, faixa, job de workflow, perfil de pacote, provedor ou lista de permissão de modelos com falha que
   comprove a correção. Execute novamente o guarda-chuva completo somente quando a superfície alterada tornar
   as evidências anteriores obsoletas.
9. Para beta, crie a tag `vYYYY.M.D-beta.N`, publique com a dist-tag npm `beta`, depois execute
   a aceitação de pacote pós-publicação contra o pacote publicado `openclaw@YYYY.M.D-beta.N`
   ou `openclaw@beta`. Se um beta enviado ou publicado precisar de correção, crie
   o próximo `-beta.N`; não exclua nem reescreva o beta antigo.
10. Para estável, continue somente depois que o beta validado ou candidato a lançamento tiver as
    evidências de validação obrigatórias. A publicação npm estável reutiliza o artefato de
    pré-validação bem-sucedido via `preflight_run_id`; a prontidão de lançamento macOS estável
    também exige o `.zip`, `.dmg`, `.dSYM.zip` empacotados e o
    `appcast.xml` atualizado em `main`.
11. Após a publicação, execute o verificador npm pós-publicação, o E2E Telegram independente opcional
    do npm publicado quando você precisar de prova de canal pós-publicação,
    promoção de dist-tag quando necessária, notas de lançamento/pré-lançamento do GitHub a partir da
    seção completa correspondente de `CHANGELOG.md` e as etapas de anúncio do lançamento.

## Pré-validação de lançamento

- Execute `pnpm check:test-types` antes do preflight de release para que o TypeScript dos testes continue
  coberto fora do gate local mais rápido `pnpm check`
- Execute `pnpm check:architecture` antes do preflight de release para que as verificações mais amplas de ciclos de importação
  e limites de arquitetura fiquem verdes fora do gate local mais rápido
- Execute `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que os artefatos de release esperados
  `dist/*` e o pacote da Control UI existam para a etapa de validação
  do empacotamento
- Execute o workflow manual `Full Release Validation` antes da aprovação de release para
  iniciar todas as caixas de teste pré-release a partir de um único ponto de entrada. Ele aceita uma branch,
  tag ou SHA completo de commit, dispara `CI` manual e dispara
  `OpenClaw Release Checks` para smoke de instalação, aceitação de pacote, suítes de caminho
  de release do Docker, live/E2E, OpenWebUI, paridade do QA Lab, Matrix e lanes do Telegram.
  Forneça `npm_telegram_package_spec` somente depois que um pacote tiver sido
  publicado e o E2E pós-publicação do Telegram também deva ser executado. Forneça
  `evidence_package_spec` quando o relatório privado de evidências deve provar que a
  validação corresponde a um pacote npm publicado sem forçar o E2E do Telegram.
  Exemplo:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Execute o workflow manual `Package Acceptance` quando quiser prova por canal lateral
  para um candidato a pacote enquanto o trabalho de release continua. Use `source=npm` para
  `openclaw@beta`, `openclaw@latest` ou uma versão exata de release; `source=ref`
  para empacotar uma branch/tag/SHA confiável de `package_ref` com o harness atual
  `workflow_ref`; `source=url` para um tarball HTTPS com um SHA-256 obrigatório;
  ou `source=artifact` para um tarball enviado por outra execução do GitHub
  Actions. O workflow resolve o candidato para
  `package-under-test`, reutiliza o agendador de release E2E do Docker contra esse
  tarball e pode executar QA do Telegram contra o mesmo tarball com
  `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`.
  Exemplo: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  Perfis comuns:
  - `smoke`: lanes de instalação/canal/agente, rede do Gateway e recarregamento de configuração
  - `package`: lanes nativas de artefato para pacote/atualização/plugin sem OpenWebUI ou ClawHub live
  - `product`: perfil de pacote mais canais MCP, limpeza de cron/subagente,
    busca web da OpenAI e OpenWebUI
  - `full`: partes do caminho de release do Docker com OpenWebUI
  - `custom`: seleção exata de `docker_lanes` para uma reexecução focada
- Execute o workflow manual `CI` diretamente quando precisar apenas da cobertura completa da CI
  normal para o candidato a release. Disparos manuais de CI ignoram o escopo por mudanças
  e forçam os shards Linux Node, shards de plugins empacotados, contratos de canal,
  compatibilidade com Node 22, `check`, `check-additional`, smoke de build,
  verificações de documentação, Skills Python, Windows, macOS, Android e lanes de i18n
  da Control UI.
  Exemplo: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Execute `pnpm qa:otel:smoke` ao validar telemetria de release. Ele exercita o
  QA-lab por meio de um receptor OTLP/HTTP local e verifica os nomes dos spans
  de trace exportados, atributos limitados e redação de conteúdo/identificador sem
  exigir Opik, Langfuse ou outro coletor externo.
- Execute `pnpm release:check` antes de toda release marcada com tag
- As verificações de release agora rodam em um workflow manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` também executa o gate de paridade mock do QA Lab mais o perfil Matrix
  live rápido e a lane de QA do Telegram antes da aprovação de release. As lanes live
  usam o ambiente `qa-live-shared`; o Telegram também usa concessões de credenciais
  Convex CI. Execute o workflow manual `QA-Lab - All Lanes` com
  `matrix_profile=all` e `matrix_shards=true` quando quiser inventário completo de transporte
  Matrix, mídia e E2EE em paralelo.
- A validação de runtime de instalação e atualização entre sistemas operacionais faz parte dos
  `OpenClaw Release Checks` públicos e do `Full Release Validation`, que chamam o
  workflow reutilizável
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` diretamente
- Essa divisão é intencional: manter o caminho real de release npm curto,
  determinístico e focado em artefatos, enquanto verificações live mais lentas permanecem em sua
  própria lane para não atrasar nem bloquear a publicação
- Verificações de release que carregam segredos devem ser disparadas por meio de `Full Release
Validation` ou a partir da referência de workflow `main`/release para que a lógica do workflow e
  os segredos permaneçam controlados
- `OpenClaw Release Checks` aceita uma branch, tag ou SHA completo de commit desde que
  o commit resolvido seja alcançável a partir de uma branch ou tag de release do OpenClaw
- O preflight somente de validação de `OpenClaw NPM Release` também aceita o SHA completo
  atual de 40 caracteres do commit da branch do workflow sem exigir uma tag enviada
- Esse caminho por SHA é somente para validação e não pode ser promovido para uma publicação real
- No modo SHA, o workflow sintetiza `v<package.json version>` apenas para a
  verificação de metadados do pacote; a publicação real ainda exige uma tag de release real
- Ambos os workflows mantêm o caminho real de publicação e promoção em runners hospedados no GitHub,
  enquanto o caminho de validação sem mutação pode usar os runners Linux maiores
  da Blacksmith
- Esse workflow executa
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando os segredos de workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- O preflight de release npm não espera mais pela lane separada de verificações de release
- Execute `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou a tag beta/correção correspondente) antes da aprovação
- Depois da publicação npm, execute
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou a versão beta/correção correspondente) para verificar o caminho de instalação do registro
  publicado em um prefixo temporário novo
- Depois de uma publicação beta, execute `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  para verificar o onboarding do pacote instalado, configuração do Telegram e E2E real do Telegram
  contra o pacote npm publicado usando o pool compartilhado de credenciais alugadas do Telegram.
  Execuções avulsas locais de mantenedores podem omitir as vars Convex e passar as três
  credenciais de ambiente `OPENCLAW_QA_TELEGRAM_*` diretamente.
- Mantenedores podem executar a mesma verificação pós-publicação a partir do GitHub Actions pelo
  workflow manual `NPM Telegram Beta E2E`. Ele é intencionalmente apenas manual e
  não roda em todo merge.
- A automação de release de mantenedores agora usa preflight-depois-promoção:
  - a publicação npm real deve passar um `preflight_run_id` npm bem-sucedido
  - a publicação npm real deve ser disparada a partir da mesma branch `main` ou
    `release/YYYY.M.D` da execução de preflight bem-sucedida
  - releases npm estáveis usam `beta` por padrão
  - a publicação npm estável pode mirar `latest` explicitamente por input do workflow
  - a mutação de dist-tag do npm baseada em token agora fica em
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    por segurança, porque `npm dist-tag add` ainda precisa de `NPM_TOKEN`, enquanto o
    repositório público mantém publicação somente com OIDC
  - `macOS Release` público é somente validação
  - a publicação privada real para Mac deve passar por `preflight_run_id` e `validate_run_id`
    privados de Mac bem-sucedidos
  - os caminhos reais de publicação promovem artefatos preparados em vez de reconstruí-los
    novamente
- Para releases estáveis de correção como `YYYY.M.D-N`, o verificador pós-publicação
  também verifica o mesmo caminho de atualização com prefixo temporário de `YYYY.M.D` para `YYYY.M.D-N`
  para que correções de release não deixem silenciosamente instalações globais antigas no
  payload estável base
- O preflight de release npm falha fechado a menos que o tarball inclua tanto
  `dist/control-ui/index.html` quanto um payload não vazio de `dist/control-ui/assets/`
  para que não enviemos novamente um painel de navegador vazio
- A verificação pós-publicação também verifica que a instalação do registro publicado
  contém dependências de runtime não vazias de plugins empacotados sob o layout raiz `dist/*`.
  Uma release enviada com payloads ausentes ou vazios de dependências de plugins empacotados
  falha no verificador pós-publicação e não pode ser promovida para `latest`.
- `pnpm test:install:smoke` também aplica o orçamento de `unpackedSize` do pacote npm no
  tarball candidato de atualização, para que o e2e do instalador capture inchaço acidental do pacote
  antes do caminho de publicação da release
- Se o trabalho de release tocou planejamento de CI, manifestos de timing de plugins ou
  matrizes de teste de plugins, regenere e revise as saídas de matriz
  `plugin-prerelease-extension-shard` pertencentes ao planejador em
  `.github/workflows/plugin-prerelease.yml` antes da aprovação para que as notas de release não
  descrevam um layout de CI desatualizado
- A prontidão de release estável para macOS também inclui as superfícies do atualizador:
  - a release do GitHub deve acabar com os pacotes `.zip`, `.dmg` e `.dSYM.zip`
  - `appcast.xml` em `main` deve apontar para o novo zip estável depois da publicação
  - o app empacotado deve manter um bundle id não debug, uma URL de feed Sparkle
    não vazia e um `CFBundleVersion` igual ou acima do piso canônico de build do Sparkle
    para essa versão de release

## Caixas de teste de release

`Full Release Validation` é como operadores iniciam todos os testes pré-release a partir de
um único ponto de entrada. Execute-o a partir da referência confiável de workflow `main` e passe a branch
de release, tag ou SHA completo de commit como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

O workflow resolve a referência alvo, dispara `CI` manual com
`target_ref=<release-ref>`, dispara `OpenClaw Release Checks` e
opcionalmente dispara E2E autônomo pós-publicação do Telegram quando
`npm_telegram_package_spec` estiver definido. `OpenClaw Release Checks` então expande para
smoke de instalação, verificações de release entre sistemas operacionais, cobertura live/E2E do caminho de release do Docker,
Package Acceptance com QA de pacote do Telegram, paridade do QA Lab, Matrix live e
Telegram live. Uma execução completa só é aceitável quando o resumo de `Full Release Validation`
mostra `normal_ci` e `release_checks` como bem-sucedidos, e qualquer filho opcional
`npm_telegram` está bem-sucedido ou foi intencionalmente ignorado. O resumo final
do verificador inclui tabelas dos jobs mais lentos para cada execução filha, para que o gerente de release
possa ver o caminho crítico atual sem baixar logs.
Workflows filhos são disparados a partir da referência confiável que executa `Full Release
Validation`, normalmente `--ref main`, mesmo quando o `ref` alvo aponta para uma
branch ou tag de release mais antiga. Não há input separado de referência de workflow para Full Release Validation;
escolha o harness confiável escolhendo a referência da execução do workflow.

Use `release_profile` para selecionar a amplitude live/provedor:

- `minimum`: caminho live e Docker OpenAI/core crítico para release mais rápido
- `stable`: mínimo mais cobertura estável de provedor/backend para aprovação de release
- `full`: estável mais cobertura ampla consultiva de provedor/mídia

`OpenClaw Release Checks` usa a referência confiável de workflow para resolver a referência alvo
uma vez como `release-package-under-test` e reutiliza esse artefato tanto nas
verificações Docker de caminho de release quanto em Package Acceptance. Isso mantém todas as
caixas voltadas a pacote nos mesmos bytes e evita builds repetidos de pacote.
O smoke de instalação OpenAI entre sistemas operacionais usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando a
variável do repositório/org está definida; caso contrário, `openai/gpt-5.4-mini`, porque essa lane está
provando instalação do pacote, onboarding, inicialização do Gateway e uma rodada live de agente
em vez de fazer benchmark do modelo padrão mais lento. A matriz live mais ampla de provedores
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
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Não use o guarda-chuva completo como a primeira reexecução após uma correção focada. Se um bloco
falhar, use o fluxo de trabalho filho, job, lane Docker, perfil de pacote, provedor de modelo
ou lane de QA que falhou para a próxima prova. Execute o guarda-chuva completo novamente somente quando
a correção tiver alterado a orquestração compartilhada de release ou tornado obsoletas as evidências
anteriores de todos os blocos. O verificador final do guarda-chuva verifica novamente os IDs registrados
das execuções dos fluxos de trabalho filhos; portanto, depois que um fluxo de trabalho filho for reexecutado
com sucesso, reexecute somente o job pai `Verify full validation` que falhou.

Para recuperação limitada, passe `rerun_group` para o guarda-chuva. `all` é a execução real
do candidato a release, `ci` executa somente o filho normal de CI, `plugin-prerelease`
executa somente o filho de Plugin exclusivo de release, `release-checks` executa todos os
blocos de release, e os grupos de release mais restritos são `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` e `npm-telegram` quando a
lane autônoma de pacote Telegram é fornecida.

### Vitest

O bloco Vitest é o fluxo de trabalho filho manual `CI`. A CI manual intencionalmente
ignora o escopo de alterações e força o grafo normal de testes para o candidato a
release: shards Linux Node, shards de Plugins agrupados, contratos de canais, compatibilidade
com Node 22, `check`, `check-additional`, smoke de build, verificações de docs, Skills
Python, Windows, macOS, Android e i18n da Control UI.

Use este bloco para responder "a árvore de código-fonte passou pela suíte de testes normal completa?"
Ele não é o mesmo que validação de produto do caminho de release. Evidências a manter:

- resumo de `Full Release Validation` mostrando a URL da execução `CI` disparada
- execução `CI` verde no SHA de destino exato
- nomes de shards com falha ou lentos dos jobs de CI ao investigar regressões
- artefatos de tempo do Vitest, como `.artifacts/vitest-shard-timings.json`, quando
  uma execução precisar de análise de desempenho

Execute a CI manual diretamente somente quando o release precisar de CI normal determinística, mas
não dos blocos Docker, QA Lab, live, entre sistemas operacionais ou de pacote:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

O bloco Docker fica em `OpenClaw Release Checks` por meio de
`openclaw-live-and-e2e-checks-reusable.yml`, além do fluxo de trabalho
`install-smoke` em modo de release. Ele valida o candidato a release por meio de ambientes
Docker empacotados, em vez de apenas testes no nível de código-fonte.

A cobertura Docker de release inclui:

- smoke completo de instalação com o smoke lento de instalação global do Bun habilitado
- preparação/reuso da imagem de smoke do Dockerfile raiz por SHA de destino, com jobs de smoke
  de QR, raiz/Gateway e instalador/Bun executados como shards install-smoke separados
- lanes E2E do repositório
- chunks Docker do caminho de release: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, `plugins-runtime-install-h`,
  `bundled-channels-core`, `bundled-channels-update-a`,
  `bundled-channels-update-discord`, `bundled-channels-update-b` e
  `bundled-channels-contracts`
- cobertura do OpenWebUI dentro do chunk `plugins-runtime-services` quando solicitada
- lanes de dependências de canais agrupados divididas entre chunks de channel-smoke, update-target
  e contratos de setup/runtime, em vez de um único job grande de canais agrupados
- lanes de instalação/desinstalação de Plugins agrupados divididas de
  `bundled-plugin-install-uninstall-0` até
  `bundled-plugin-install-uninstall-23`
- suítes de provedores live/E2E e cobertura de modelo live Docker quando as verificações de release
  incluem suítes live

Use artefatos Docker antes de reexecutar. O agendador do caminho de release envia
`.artifacts/docker-tests/` com logs de lanes, `summary.json`, `failures.json`,
tempos de fases, JSON do plano do agendador e comandos de reexecução. Para recuperação focada,
use `docker_lanes=<lane[,lane]>` no fluxo de trabalho reutilizável live/E2E em vez de
reexecutar todos os chunks de release. Os comandos de reexecução gerados incluem
`package_artifact_run_id` anterior e entradas de imagens Docker preparadas quando disponíveis, para que uma
lane com falha possa reutilizar o mesmo tarball e as imagens GHCR.

### QA Lab

O bloco QA Lab também faz parte de `OpenClaw Release Checks`. Ele é o gate de release de
comportamento agentivo e nível de canal, separado do Vitest e da mecânica de pacotes Docker.

A cobertura de QA Lab de release inclui:

- gate de paridade mock comparando a lane candidata OpenAI com a baseline Opus 4.6
  usando o pacote de paridade agentiva
- perfil rápido de QA Matrix live usando o ambiente `qa-live-shared`
- lane de QA Telegram live usando leases de credenciais Convex CI
- `pnpm qa:otel:smoke` quando a telemetria de release precisa de prova local explícita

Use este bloco para responder "o release se comporta corretamente em cenários de QA e
fluxos de canais live?" Mantenha as URLs dos artefatos das lanes de paridade, Matrix e Telegram
ao aprovar o release. A cobertura Matrix completa continua disponível como uma execução manual
fragmentada do QA-Lab, em vez da lane crítica de release padrão.

### Pacote

O bloco Package é o gate de produto instalável. Ele é baseado em
`Package Acceptance` e no resolvedor
`scripts/resolve-openclaw-package-candidate.mjs`. O resolvedor normaliza um
candidato no tarball `package-under-test` consumido pelo Docker E2E, valida
o inventário do pacote, registra a versão do pacote e o SHA-256, e mantém a
ref do harness do fluxo de trabalho separada da ref de origem do pacote.

Fontes de candidato compatíveis:

- `source=npm`: `openclaw@beta`, `openclaw@latest` ou uma versão exata de release do OpenClaw
- `source=ref`: empacotar uma branch, tag ou SHA completo de commit confiável em `package_ref`
  com o harness `workflow_ref` selecionado
- `source=url`: baixar um `.tgz` HTTPS com `package_sha256` obrigatório
- `source=artifact`: reutilizar um `.tgz` enviado por outra execução do GitHub Actions

`OpenClaw Release Checks` executa Package Acceptance com `source=ref`,
`package_ref=<release-ref>`, `suite_profile=custom`,
`docker_lanes=bundled-channel-deps-compat plugins-offline` e
`telegram_mode=mock-openai`. Os chunks Docker do caminho de release cobrem as
lanes sobrepostas de instalação, atualização e atualização de Plugin; Package Acceptance mantém
compatibilidade de canais agrupados nativa de artefatos, fixtures offline de Plugins e QA de pacote
Telegram contra o mesmo tarball resolvido. Ele é a substituição nativa do GitHub
para a maior parte da cobertura de pacote/atualização que anteriormente exigia
Parallels. As verificações de release entre sistemas operacionais ainda importam para onboarding,
instalador e comportamento específico de plataforma, mas a validação de produto de pacote/atualização deve
preferir Package Acceptance.

A leniência legada de package-acceptance é intencionalmente limitada no tempo. Pacotes até
`2026.4.25` podem usar o caminho de compatibilidade para lacunas de metadados já publicadas
no npm: entradas privadas de inventário de QA ausentes do tarball, ausência de
`gateway install --wrapper`, arquivos de patch ausentes na fixture git derivada do tarball,
ausência de `update.channel` persistido, locais legados de registro de instalação de Plugin,
ausência de persistência de registro de instalação do marketplace e migração de metadados de configuração
durante `plugins update`. O pacote publicado `2026.4.26` pode avisar
sobre arquivos de carimbo de metadados de build local que já foram enviados. Pacotes posteriores
devem satisfazer os contratos de pacote modernos; essas mesmas lacunas falham a validação de
release.

Use perfis mais amplos de Package Acceptance quando a pergunta do release for sobre um
pacote instalável real:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

Perfis comuns de pacote:

- `smoke`: lanes rápidas de instalação/canal/agente de pacote, rede do Gateway e recarregamento
  de configuração
- `package`: contratos de instalação/atualização/pacote de Plugin sem ClawHub live; este é o padrão
  de release-check
- `product`: `package` mais canais MCP, limpeza de Cron/subagente, pesquisa web OpenAI
  e OpenWebUI
- `full`: chunks Docker do caminho de release com OpenWebUI
- `custom`: lista exata de `docker_lanes` para reexecuções focadas

Para prova Telegram de candidato a pacote, habilite `telegram_mode=mock-openai` ou
`telegram_mode=live-frontier` em Package Acceptance. O fluxo de trabalho passa o
tarball `package-under-test` resolvido para a lane Telegram; o fluxo de trabalho Telegram
autônomo ainda aceita uma especificação npm publicada para verificações pós-publicação.

## Entradas do fluxo de trabalho NPM

`OpenClaw NPM Release` aceita estas entradas controladas pelo operador:

- `tag`: tag de release obrigatória, como `v2026.4.2`, `v2026.4.2-1` ou
  `v2026.4.2-beta.1`; quando `preflight_only=true`, também pode ser o SHA completo
  de commit de 40 caracteres da branch atual do fluxo de trabalho para preflight apenas de validação
- `preflight_only`: `true` para validação/build/pacote somente, `false` para o
  caminho real de publicação
- `preflight_run_id`: obrigatório no caminho real de publicação para que o fluxo de trabalho reutilize
  o tarball preparado da execução de preflight bem-sucedida
- `npm_dist_tag`: tag de destino npm para o caminho de publicação; o padrão é `beta`

`OpenClaw Release Checks` aceita estas entradas controladas pelo operador:

- `ref`: branch, tag ou SHA completo de commit a validar. Verificações com segredos
  exigem que o commit resolvido seja alcançável a partir de uma branch ou
  tag de release do OpenClaw.

Regras:

- Tags estáveis e de correção podem publicar em `beta` ou `latest`
- Tags de pré-release beta podem publicar somente em `beta`
- Para `OpenClaw NPM Release`, entrada de SHA completo de commit é permitida somente quando
  `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` são sempre
  somente de validação
- O caminho real de publicação deve usar o mesmo `npm_dist_tag` usado durante o preflight;
  o fluxo de trabalho verifica esses metadados antes de a publicação continuar

## Sequência de release npm estável

Ao cortar um release npm estável:

1. Execute `OpenClaw NPM Release` com `preflight_only=true`
   - Antes de existir uma tag, você pode usar o SHA completo de commit atual da branch do fluxo de trabalho
     para uma simulação apenas de validação do fluxo de trabalho de preflight
2. Escolha `npm_dist_tag=beta` para o fluxo normal beta-first, ou `latest` somente
   quando você intencionalmente quiser uma publicação estável direta
3. Execute `Full Release Validation` na branch de release, tag de release ou SHA completo
   de commit quando quiser CI normal mais cache de prompts live, Docker, QA Lab,
   Matrix e cobertura Telegram a partir de um fluxo de trabalho manual
4. Se você intencionalmente precisar apenas do grafo de testes normal determinístico, execute o
   fluxo de trabalho manual `CI` na ref de release
5. Salve o `preflight_run_id` bem-sucedido
6. Execute `OpenClaw NPM Release` novamente com `preflight_only=false`, a mesma
   `tag`, o mesmo `npm_dist_tag` e o `preflight_run_id` salvo
7. Se o release foi lançado em `beta`, use o fluxo de trabalho privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover essa versão estável de `beta` para `latest`
8. Se o release foi publicado intencionalmente diretamente em `latest` e `beta`
   deve seguir o mesmo build estável imediatamente, use esse mesmo fluxo de trabalho privado
   para apontar ambas as dist-tags para a versão estável, ou deixe a sincronização agendada
   de autocorreção mover `beta` posteriormente

A mutação de dist-tag fica no repositório privado por segurança, porque ela ainda
exige `NPM_TOKEN`, enquanto o repositório público mantém publicação somente com OIDC.

Isso mantém o caminho de publicação direta e o caminho de promoção beta-first ambos
documentados e visíveis ao operador.

Se um mantenedor precisar recorrer à autenticação npm local, execute qualquer comando da
CLI (`op`) do 1Password apenas dentro de uma sessão tmux dedicada. Não chame `op`
diretamente do shell principal do agente; mantê-lo dentro do tmux torna prompts,
alertas e o tratamento de OTP observáveis e evita alertas repetidos do host.

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

Os mantenedores usam a documentação privada de lançamento em
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
como o roteiro operacional real.

## Relacionado

- [Canais de lançamento](/pt-BR/install/development-channels)
