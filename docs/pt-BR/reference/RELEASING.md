---
read_when:
    - Procurando definições públicas de canais de lançamento
    - Executando validação de lançamento ou aceitação de pacote
    - Procurando nomenclatura e cadência de versões
summary: Canais de lançamento, checklist do operador, caixas de validação, nomenclatura de versões e cadência
title: Política de lançamento
x-i18n:
    generated_at: "2026-05-03T21:36:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 566088d826e1e2bac21b11443b82b62cb73ed1fd9c508c3fb865149cf8a428ba
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw tem três canais públicos de lançamento:

- estável: versões marcadas que publicam no npm `beta` por padrão, ou no npm `latest` quando solicitado explicitamente
- beta: tags de pré-lançamento que publicam no npm `beta`
- dev: o head móvel de `main`

## Nomenclatura de versões

- Versão de lançamento estável: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versão de correção estável: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versão beta de pré-lançamento: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Não preencha mês ou dia com zeros à esquerda
- `latest` significa a versão npm estável promovida atual
- `beta` significa o alvo atual de instalação beta
- Lançamentos estáveis e de correção estável publicam no npm `beta` por padrão; operadores de release podem mirar `latest` explicitamente, ou promover uma build beta validada posteriormente
- Todo lançamento estável do OpenClaw entrega o pacote npm e o app macOS juntos;
  lançamentos beta normalmente validam e publicam primeiro o caminho npm/pacote, com
  build/assinatura/notarização do app Mac reservados para estável, salvo solicitação explícita

## Cadência de lançamento

- Lançamentos seguem primeiro para beta
- Estável vem somente depois que o beta mais recente é validado
- Mantenedores normalmente criam lançamentos a partir de uma branch `release/YYYY.M.D` criada
  a partir do `main` atual, para que validação e correções de release não bloqueiem novo
  desenvolvimento no `main`
- Se uma tag beta tiver sido enviada ou publicada e precisar de correção, mantenedores criam
  a próxima tag `-beta.N` em vez de excluir ou recriar a tag beta antiga
- Procedimento detalhado de release, aprovações, credenciais e notas de recuperação são
  exclusivos para mantenedores

## Checklist do operador de release

Este checklist é a forma pública do fluxo de release. Credenciais privadas,
assinatura, notarização, recuperação de dist-tag e detalhes de rollback de emergência ficam no
runbook de release exclusivo para mantenedores.

1. Comece do `main` atual: baixe a versão mais recente, confirme que o commit alvo foi enviado,
   e confirme que o CI atual do `main` está verde o suficiente para criar uma branch a partir dele.
2. Reescreva a seção superior do `CHANGELOG.md` a partir do histórico real de commits com
   `/changelog`, mantenha as entradas voltadas ao usuário, faça commit, envie e faça rebase/pull
   mais uma vez antes de criar a branch.
3. Revise registros de compatibilidade de release em
   `src/plugins/compat/registry.ts` e
   `src/commands/doctor/shared/deprecation-compat.ts`. Remova compatibilidade expirada
   somente quando o caminho de upgrade continuar coberto, ou registre por que ela está
   sendo mantida intencionalmente.
4. Crie `release/YYYY.M.D` a partir do `main` atual; não faça trabalho normal de release
   diretamente no `main`.
5. Atualize todos os locais de versão obrigatórios para a tag pretendida, execute
   `pnpm plugins:sync` para que pacotes de Plugin publicáveis compartilhem a versão de release
   e os metadados de compatibilidade, então execute o preflight determinístico local:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` e
   `pnpm release:check`.
6. Execute `OpenClaw NPM Release` com `preflight_only=true`. Antes de existir uma tag,
   um SHA completo de 40 caracteres da branch de release é permitido somente para validação
   preflight. Salve o `preflight_run_id` bem-sucedido.
7. Inicie todos os testes de pré-release com `Full Release Validation` para a
   branch de release, tag ou SHA completo do commit. Este é o único ponto de entrada manual
   para as quatro grandes caixas de teste de release: Vitest, Docker, QA Lab e Package.
8. Se a validação falhar, corrija na branch de release e execute novamente o menor
   arquivo, canal, job de workflow, perfil de pacote, provedor ou allowlist de modelo que
   comprove a correção. Execute novamente o guarda-chuva completo somente quando a superfície
   alterada tornar evidências anteriores obsoletas.
9. Para beta, marque `vYYYY.M.D-beta.N`, então execute `OpenClaw Release Publish` a partir
   da branch `release/YYYY.M.D` correspondente. Ele verifica `pnpm plugins:sync:check`,
   publica todos os pacotes de Plugin publicáveis no npm primeiro, publica o mesmo
   conjunto no ClawHub em seguida como tarballs npm-pack ClawPack e então promove o
   artefato preflight npm preparado do OpenClaw com a dist-tag correspondente. Após
   publicar, execute a aceitação de pacote pós-publicação contra o pacote
   `openclaw@YYYY.M.D-beta.N` ou `openclaw@beta` publicado. Se um pré-lançamento enviado
   ou publicado precisar de correção, crie o próximo número de pré-lançamento correspondente;
   não exclua nem reescreva o pré-lançamento antigo.
10. Para estável, continue somente depois que o beta validado ou candidato a release tiver a
    evidência de validação necessária. A publicação npm estável também passa por
    `OpenClaw Release Publish`, reutilizando o artefato preflight bem-sucedido via
    `preflight_run_id`; a prontidão para release estável do macOS também exige os
    `.zip`, `.dmg`, `.dSYM.zip` empacotados e o `appcast.xml` atualizado no `main`.
11. Após publicar, execute o verificador npm pós-publicação, o E2E opcional do Telegram
    publicado via npm independente quando você precisar de prova de canal pós-publicação,
    promoção de dist-tag quando necessário, notas de release/pré-release do GitHub a partir da
    seção completa correspondente do `CHANGELOG.md` e as etapas de anúncio de release.

## Preflight de release

- Execute `pnpm check:test-types` antes do preflight de release para que o TypeScript dos testes continue
  coberto fora do gate local mais rápido `pnpm check`
- Execute `pnpm check:architecture` antes do preflight de release para que as verificações mais amplas de ciclo de importação
  e limites de arquitetura estejam verdes fora do gate local mais rápido
- Execute `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que os artefatos de release esperados
  `dist/*` e o pacote da Control UI existam para a etapa de validação
  do pacote
- Execute `pnpm plugins:sync` depois do bump da versão raiz e antes de marcar a tag. Ele
  atualiza as versões dos pacotes de Plugin publicáveis, os metadados de compatibilidade
  de peer/API do OpenClaw, os metadados de build e os stubs de changelog dos plugins para corresponder à versão
  de release do core. `pnpm plugins:sync:check` é a proteção de release sem mutação;
  o workflow de publicação falha antes de qualquer mutação no registro se esta etapa tiver sido
  esquecida.
- Execute o workflow manual `Full Release Validation` antes da aprovação de release para
  iniciar todas as caixas de teste de pré-release a partir de um único ponto de entrada. Ele aceita uma branch,
  tag ou SHA completo de commit, dispara `CI` manual e dispara
  `OpenClaw Release Checks` para smoke de instalação, aceitação de pacote, suítes de caminho de release Docker,
  live/E2E, OpenWebUI, paridade do QA Lab, Matrix e faixas Telegram. Com
  `release_profile=full` e `rerun_group=all`, ele também executa o E2E de pacote
  Telegram contra o artefato `release-package-under-test` dos checks de release. Forneça
  `npm_telegram_package_spec` após a publicação quando o mesmo E2E Telegram também deve comprovar o pacote npm publicado. Forneça
  `package_acceptance_package_spec` após a publicação quando Package Acceptance
  deve executar sua matriz de pacote/atualização contra o pacote npm entregue em vez
  do artefato construído a partir do SHA. Forneça
  `evidence_package_spec` quando o relatório privado de evidências deve comprovar que a
  validação corresponde a um pacote npm publicado sem forçar o E2E Telegram.
  Exemplo:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Execute o workflow manual `Package Acceptance` quando quiser uma comprovação paralela
  para um candidato a pacote enquanto o trabalho de release continua. Use `source=npm` para
  `openclaw@beta`, `openclaw@latest` ou uma versão exata de release; `source=ref`
  para empacotar uma branch/tag/SHA confiável de `package_ref` com o harness atual
  `workflow_ref`; `source=url` para um tarball HTTPS com um SHA-256 obrigatório;
  ou `source=artifact` para um tarball enviado por outro run do GitHub
  Actions. O workflow resolve o candidato para
  `package-under-test`, reutiliza o agendador de release Docker E2E contra esse
  tarball e pode executar QA Telegram contra o mesmo tarball com
  `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`. Quando as
  faixas Docker selecionadas incluem `published-upgrade-survivor`, o artefato do pacote
  é o candidato e `published_upgrade_survivor_baseline` seleciona
  a baseline publicada.
  Exemplo: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Perfis comuns:
  - `smoke`: faixas de instalação/canal/agente, rede do Gateway e recarregamento de config
  - `package`: faixas nativas de artefato para pacote/atualização/Plugin sem OpenWebUI ou ClawHub live
  - `product`: perfil de pacote mais canais MCP, limpeza de cron/subagente,
    busca web da OpenAI e OpenWebUI
  - `full`: blocos de caminho de release Docker com OpenWebUI
  - `custom`: seleção exata de `docker_lanes` para uma nova execução focada
- Execute o workflow manual `CI` diretamente quando precisar apenas da cobertura completa normal de CI
  para o candidato a release. Disparos manuais de CI ignoram o escopo por mudanças
  e forçam os shards Linux Node, shards de plugins incluídos, contratos de canal,
  compatibilidade com Node 22, `check`, `check-additional`, smoke de build,
  checks de documentação, Skills Python, Windows, macOS, Android e faixas de i18n
  da Control UI.
  Exemplo: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Execute `pnpm qa:otel:smoke` ao validar a telemetria de release. Ele exercita
  o QA-lab por meio de um receptor OTLP/HTTP local e verifica os nomes de spans
  de trace exportados, atributos limitados e redação de conteúdo/identificador sem
  exigir Opik, Langfuse ou outro coletor externo.
- Execute `pnpm release:check` antes de todo release com tag
- Execute `OpenClaw Release Publish` para a sequência de publicação com mutação depois que a
  tag existir. Dispare-o a partir de `release/YYYY.M.D` (ou `main` ao publicar uma
  tag alcançável por main), passe a tag de release e o `preflight_run_id` bem-sucedido
  do npm do OpenClaw, e mantenha o escopo padrão de publicação de Plugin
  `all-publishable`, a menos que você esteja executando deliberadamente um reparo focado. O
  workflow serializa a publicação npm de Plugin, a publicação de Plugin no ClawHub e a publicação npm
  do OpenClaw para que o pacote core não seja publicado antes de seus
  plugins externalizados.
- Os checks de release agora rodam em um workflow manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` também executa a faixa de paridade mock do QA Lab mais o perfil rápido
  live Matrix e a faixa QA Telegram antes da aprovação de release. As faixas live
  usam o ambiente `qa-live-shared`; Telegram também usa concessões de credenciais Convex CI.
  Execute o workflow manual `QA-Lab - All Lanes` com
  `matrix_profile=all` e `matrix_shards=true` quando quiser o inventário completo de transporte,
  mídia e E2EE do Matrix em paralelo.
- A validação de runtime de instalação e upgrade entre sistemas operacionais faz parte dos
  `OpenClaw Release Checks` e `Full Release Validation` públicos, que chamam diretamente
  o workflow reutilizável
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Essa separação é intencional: manter o caminho real de release npm curto,
  determinístico e focado em artefatos, enquanto checks live mais lentos ficam em sua
  própria faixa para não atrasarem nem bloquearem a publicação
- Checks de release com segredos devem ser disparados por meio de `Full Release
Validation` ou a partir da ref de workflow `main`/release para que a lógica do workflow e os
  segredos permaneçam controlados
- `OpenClaw Release Checks` aceita uma branch, tag ou SHA completo de commit desde que
  o commit resolvido seja alcançável a partir de uma branch do OpenClaw ou tag de release
- O preflight somente de validação de `OpenClaw NPM Release` também aceita o SHA completo
  atual de 40 caracteres do commit da branch do workflow sem exigir uma tag enviada
- Esse caminho por SHA é somente de validação e não pode ser promovido para uma publicação real
- No modo SHA, o workflow sintetiza `v<package.json version>` apenas para a
  verificação de metadados do pacote; a publicação real ainda exige uma tag real de release
- Ambos os workflows mantêm o caminho real de publicação e promoção em runners hospedados pelo GitHub,
  enquanto o caminho de validação sem mutação pode usar os runners Linux maiores
  da Blacksmith
- Esse workflow executa
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando os segredos de workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- O preflight de release npm não espera mais pela faixa separada de checks de release
- Execute `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou a tag beta/correção correspondente) antes da aprovação
- Depois da publicação npm, execute
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou a versão beta/correção correspondente) para verificar o caminho de instalação
  do registro publicado em um prefixo temporário novo
- Depois de uma publicação beta, execute `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  para verificar o onboarding do pacote instalado, a configuração do Telegram e o E2E real do Telegram
  contra o pacote npm publicado usando o pool compartilhado de credenciais Telegram concedidas.
  Execuções locais pontuais de mantenedores podem omitir as vars Convex e passar diretamente as três
  credenciais de env `OPENCLAW_QA_TELEGRAM_*`.
- Mantenedores podem executar o mesmo check pós-publicação pelo GitHub Actions por meio do
  workflow manual `NPM Telegram Beta E2E`. Ele é intencionalmente apenas manual e
  não roda a cada merge.
- A automação de release de mantenedores agora usa preflight-depois-promover:
  - a publicação npm real deve passar por um `preflight_run_id` npm bem-sucedido
  - a publicação npm real deve ser disparada a partir da mesma branch `main` ou
    `release/YYYY.M.D` que o run de preflight bem-sucedido
  - releases npm estáveis usam `beta` por padrão
  - a publicação npm estável pode mirar `latest` explicitamente via input do workflow
  - a mutação de dist-tag npm baseada em token agora fica em
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    por segurança, porque `npm dist-tag add` ainda precisa de `NPM_TOKEN` enquanto o
    repositório público mantém publicação somente por OIDC
  - `macOS Release` público é somente de validação; quando uma tag existe apenas em uma
    branch de release, mas o workflow é disparado a partir de `main`, defina
    `public_release_branch=release/YYYY.M.D`
  - a publicação privada real para mac deve passar por `preflight_run_id` e `validate_run_id`
    privados de mac bem-sucedidos
  - os caminhos reais de publicação promovem artefatos preparados em vez de reconstruí-los
    novamente
- Para releases estáveis de correção como `YYYY.M.D-N`, o verificador pós-publicação
  também verifica o mesmo caminho de upgrade com prefixo temporário de `YYYY.M.D` para `YYYY.M.D-N`,
  para que correções de release não deixem silenciosamente instalações globais mais antigas no
  payload estável base
- O preflight de release npm falha fechado a menos que o tarball inclua tanto
  `dist/control-ui/index.html` quanto um payload não vazio de `dist/control-ui/assets/`
  para que não publiquemos novamente um painel de navegador vazio
- A verificação pós-publicação também confere que os entrypoints de Plugin publicados e
  os metadados de pacote estão presentes no layout instalado do registro. Um release que
  entrega payloads de runtime de Plugin ausentes falha no verificador pós-publicação e
  não pode ser promovido para `latest`.
- `pnpm test:install:smoke` também aplica o orçamento de `unpackedSize` do pacote npm no
  tarball candidato de atualização, para que o e2e do instalador capture crescimento acidental do pacote
  antes do caminho de publicação de release
- Se o trabalho de release tocou o planejamento de CI, manifests de timing de extensions ou
  matrizes de teste de extensions, regenere e revise as saídas de matriz
  `plugin-prerelease-extension-shard` pertencentes ao planejador de
  `.github/workflows/plugin-prerelease.yml` antes da aprovação para que as notas de release não
  descrevam um layout de CI obsoleto
- A prontidão de release estável para macOS também inclui as superfícies do atualizador:
  - o release no GitHub deve terminar com os arquivos `.zip`, `.dmg` e `.dSYM.zip` empacotados
  - `appcast.xml` em `main` deve apontar para o novo zip estável depois da publicação
  - o app empacotado deve manter um bundle id que não seja de debug, uma URL de feed Sparkle
    não vazia e um `CFBundleVersion` no piso canônico de build Sparkle
    ou acima dele para essa versão de release

## Caixas de teste de release

`Full Release Validation` é como operadores iniciam todos os testes de pré-release a partir de
um único ponto de entrada. Para uma comprovação de commit fixado em uma branch que muda rapidamente, use o
helper para que todo workflow filho rode a partir de uma branch temporária fixada no SHA
alvo:

```bash
pnpm ci:full-release --sha <full-sha>
```

O auxiliar faz push de `release-ci/<sha>-...`, dispara `Full Release Validation`
a partir dessa branch com `ref=<sha>`, verifica se cada workflow filho `headSha`
corresponde ao alvo e então exclui a branch temporária. Isso evita validar por
acidente uma execução filha de um `main` mais recente.

Para validação de branch ou tag de lançamento, execute-o a partir da ref
confiável de workflow `main` e passe a branch ou tag de lançamento como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

O fluxo de trabalho resolve o ref de destino, dispara o `CI` manual com
`target_ref=<release-ref>`, dispara `OpenClaw Release Checks`, prepara um
artefato pai `release-package-under-test` para verificações voltadas a pacote e
dispara o E2E independente do pacote Telegram quando `release_profile=full` com
`rerun_group=all` ou quando `npm_telegram_package_spec` está definido. `OpenClaw Release
Checks` então expande para smoke de instalação, verificações de lançamento entre sistemas operacionais, cobertura live/E2E do caminho de lançamento do Docker, Package Acceptance com QA do pacote Telegram, paridade do QA Lab, Matrix ao vivo e Telegram ao vivo. Uma execução completa só é aceitável quando o
resumo de `Full Release Validation`
mostra `normal_ci` e `release_checks` como bem-sucedidos. No modo full/all,
o filho `npm_telegram` também deve ser bem-sucedido; fora de full/all ele é ignorado
a menos que um `npm_telegram_package_spec` publicado tenha sido fornecido. O resumo final
do verificador inclui tabelas dos jobs mais lentos para cada execução filha, para que o gerente de lançamento possa ver o caminho crítico atual sem baixar logs.
Consulte [Validação completa de lançamento](/pt-BR/reference/full-release-validation) para a
matriz completa de estágios, nomes exatos dos jobs do fluxo de trabalho, diferenças entre perfis estável e completo, artefatos e identificadores de reexecução focada.
Fluxos de trabalho filhos são disparados a partir do ref confiável que executa `Full Release
Validation`, normalmente `--ref main`, mesmo quando o `ref` de destino aponta para um
branch ou tag de lançamento mais antigo. Não há uma entrada separada de ref de fluxo de trabalho para Full Release Validation; escolha o harness confiável escolhendo o ref da execução do fluxo de trabalho.
Não use `--ref main -f ref=<sha>` para comprovação exata de commit em `main` móvel;
SHAs de commit brutos não podem ser refs de despacho de fluxo de trabalho, então use
`pnpm ci:full-release --sha <sha>` para criar o branch temporário fixado.

Use `release_profile` para selecionar a abrangência live/provedor:

- `minimum`: caminho mais rápido crítico para lançamento de OpenAI/core live e Docker
- `stable`: mínimo mais cobertura estável de provedor/backend para aprovação de lançamento
- `full`: estável mais cobertura ampla de provedor/mídia consultiva

`OpenClaw Release Checks` usa o ref confiável do fluxo de trabalho para resolver o ref de destino
uma vez como `release-package-under-test` e reutiliza esse artefato tanto nas verificações Docker de caminho de lançamento quanto no Package Acceptance. Isso mantém todas as caixas voltadas a pacote nos mesmos bytes e evita builds repetidos de pacote.
O smoke de instalação OpenAI entre sistemas operacionais usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando a
variável de repositório/org está definida, caso contrário `openai/gpt-5.4`, porque essa lane está
comprovando instalação do pacote, onboarding, inicialização do gateway e uma rodada de agente ao vivo
em vez de medir o desempenho do modelo padrão mais lento. A matriz live de provedores mais ampla
continua sendo o local para cobertura específica de modelo.

Use estas variantes dependendo do estágio de lançamento:

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

Não use o guarda-chuva completo como a primeira reexecução após uma correção focada. Se uma caixa
falhar, use o fluxo de trabalho filho, job, lane Docker, perfil de pacote, provedor de modelo
ou lane de QA que falhou para a próxima comprovação. Execute o guarda-chuva completo novamente apenas quando
a correção alterou a orquestração compartilhada de lançamento ou tornou obsoleta a evidência anterior de todas as caixas. O verificador final do guarda-chuva verifica novamente os ids registrados das execuções dos fluxos de trabalho filhos, então, depois que um fluxo de trabalho filho for reexecutado com sucesso, reexecute apenas o job pai
`Verify full validation` que falhou.

Para recuperação delimitada, passe `rerun_group` para o guarda-chuva. `all` é a execução real
de candidato a lançamento, `ci` executa apenas o filho normal de CI, `plugin-prerelease`
executa apenas o filho de plugin exclusivo de lançamento, `release-checks` executa todas as caixas de lançamento, e os grupos de lançamento mais estreitos são `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` e `npm-telegram`.
Reexecuções focadas de `npm-telegram` exigem `npm_telegram_package_spec`; execuções full/all
com `release_profile=full` usam o artefato de pacote de release-checks.

### Vitest

A caixa Vitest é o fluxo de trabalho filho `CI` manual. O CI manual intencionalmente
contorna o escopo por alterações e força o grafo normal de testes para o candidato a lançamento: shards Linux Node, shards de plugins empacotados, contratos de canais, compatibilidade com Node 22, `check`, `check-additional`, smoke de build, verificações de docs, Skills Python, Windows, macOS, Android e i18n da Control UI.

Use esta caixa para responder "a árvore de código-fonte passou pela suíte normal completa de testes?"
Ela não é o mesmo que validação de produto no caminho de lançamento. Evidências a manter:

- resumo de `Full Release Validation` mostrando a URL da execução de `CI` disparada
- execução de `CI` verde no SHA exato de destino
- nomes de shards com falha ou lentos dos jobs de CI ao investigar regressões
- artefatos de tempo do Vitest, como `.artifacts/vitest-shard-timings.json`, quando
  uma execução precisar de análise de desempenho

Execute o CI manual diretamente apenas quando o lançamento precisar de CI normal determinístico, mas
não das caixas Docker, QA Lab, live, entre sistemas operacionais ou de pacote:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

A caixa Docker vive em `OpenClaw Release Checks` por meio de
`openclaw-live-and-e2e-checks-reusable.yml`, além do fluxo de trabalho `install-smoke`
em modo de lançamento. Ela valida o candidato a lançamento por ambientes Docker empacotados
em vez de apenas testes em nível de código-fonte.

A cobertura Docker de lançamento inclui:

- smoke completo de instalação com o smoke lento de instalação global Bun habilitado
- preparação/reutilização da imagem de smoke do Dockerfile raiz por SHA de destino, com QR,
  root/gateway e jobs de smoke de instalador/Bun executando como shards separados de install-smoke
- lanes E2E do repositório
- chunks Docker de caminho de lançamento: `core`, `package-update-openai`,
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
- suítes de provedores live/E2E e cobertura de modelo Docker live quando as verificações de lançamento
  incluem suítes live

Use artefatos Docker antes de reexecutar. O agendador de caminho de lançamento envia
`.artifacts/docker-tests/` com logs de lanes, `summary.json`, `failures.json`,
tempos de fases, JSON do plano do agendador e comandos de reexecução. Para recuperação focada,
use `docker_lanes=<lane[,lane]>` no fluxo de trabalho live/E2E reutilizável em vez de
reexecutar todos os chunks de lançamento. Comandos de reexecução gerados incluem
`package_artifact_run_id` anterior e entradas de imagem Docker preparadas quando disponíveis, para que uma
lane com falha possa reutilizar o mesmo tarball e imagens GHCR.

### QA Lab

A caixa QA Lab também faz parte de `OpenClaw Release Checks`. Ela é o gate de lançamento de comportamento agêntico e de nível de canal, separada da mecânica de pacote do Vitest e do Docker.

A cobertura QA Lab de lançamento inclui:

- lane de paridade mock comparando a lane candidata OpenAI com a baseline Opus 4.6
  usando o pacote de paridade agêntica
- perfil rápido de QA Matrix live usando o ambiente `qa-live-shared`
- lane de QA Telegram live usando leases de credenciais Convex CI
- `pnpm qa:otel:smoke` quando a telemetria de lançamento precisa de comprovação local explícita

Use esta caixa para responder "o lançamento se comporta corretamente em cenários de QA e
fluxos de canais live?" Mantenha as URLs de artefatos para as lanes de paridade, Matrix e Telegram ao aprovar o lançamento. A cobertura completa de Matrix continua disponível como uma
execução manual shardada do QA-Lab, em vez da lane crítica padrão de lançamento.

### Pacote

A caixa Package é o gate de produto instalável. Ela é apoiada por
`Package Acceptance` e pelo resolvedor
`scripts/resolve-openclaw-package-candidate.mjs`. O resolvedor normaliza um
candidato no tarball `package-under-test` consumido pelo Docker E2E, valida
o inventário do pacote, registra a versão do pacote e o SHA-256, e mantém o
ref do harness do fluxo de trabalho separado do ref de origem do pacote.

Fontes de candidato compatíveis:

- `source=npm`: `openclaw@beta`, `openclaw@latest` ou uma versão exata de lançamento do OpenClaw
- `source=ref`: empacote um branch, tag ou SHA completo de commit de `package_ref` confiável
  com o harness `workflow_ref` selecionado
- `source=url`: baixe um `.tgz` HTTPS com `package_sha256` obrigatório
- `source=artifact`: reutilize um `.tgz` enviado por outra execução do GitHub Actions

`OpenClaw Release Checks` executa Package Acceptance com `source=artifact`, o
artefato preparado do pacote de lançamento, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues` e
`telegram_mode=mock-openai`. Package Acceptance mantém migração, atualização, limpeza de dependências obsoletas de plugins, fixtures de plugins offline, atualização de plugins e QA de pacote Telegram contra o mesmo tarball resolvido. A matriz de upgrade cobre toda baseline estável publicada no npm de `2026.4.23` até `latest`; use
Package Acceptance com `source=npm` para um candidato já lançado, ou
`source=ref`/`source=artifact` para um tarball npm local respaldado por SHA antes da
publicação. Ela é a substituição nativa do GitHub
para a maior parte da cobertura de pacote/atualização que antes exigia
Parallels. Verificações de lançamento entre sistemas operacionais ainda importam para onboarding,
instalador e comportamento específicos de SO, mas a validação de produto de pacote/atualização deve
preferir Package Acceptance.

A checklist canônica para validação de atualização e plugin é
[Testando atualizações e plugins](/pt-BR/help/testing-updates-plugins). Use-a ao
decidir qual lane local, Docker, Package Acceptance ou release-check comprova uma
instalação/atualização de plugin, limpeza do doctor ou alteração de migração de pacote publicado.
A migração exaustiva de atualização publicada de todo pacote estável `2026.4.23+` é
um fluxo de trabalho manual `Update Migration` separado, não parte do Full Release CI.

A leniência legada de package-acceptance é intencionalmente limitada no tempo. Pacotes até
`2026.4.25` podem usar o caminho de compatibilidade para lacunas de metadados já publicadas
no npm: entradas privadas de inventário de QA ausentes no tarball, ausência de
`gateway install --wrapper`, arquivos de patch ausentes na fixture git derivada do tarball,
ausência de `update.channel` persistido, locais legados de registro de instalação de plugins,
ausência de persistência de registro de instalação do marketplace e migração de metadados de configuração durante `plugins update`. O pacote publicado `2026.4.26` pode avisar
sobre arquivos locais de carimbo de metadados de build que já foram lançados. Pacotes posteriores
devem satisfazer os contratos modernos de pacote; essas mesmas lacunas falham na validação de lançamento.

Use perfis mais amplos de Package Acceptance quando a pergunta de lançamento for sobre um
pacote realmente instalável:

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

- `smoke`: lanes rápidas de instalação de pacote/canal/agente, rede do Gateway e
  recarregamento de configuração
- `package`: contratos de instalação/atualização/pacote de Plugin sem ClawHub ao vivo; este é o padrão de
  verificação de release
- `product`: `package` mais canais MCP, limpeza de cron/subagente, pesquisa na web da OpenAI
  e OpenWebUI
- `full`: partes do caminho de release do Docker com OpenWebUI
- `custom`: lista exata de `docker_lanes` para reexecuções focadas

Para comprovação de Telegram de pacote candidato, habilite `telegram_mode=mock-openai` ou
`telegram_mode=live-frontier` em Package Acceptance. O workflow passa o
tarball `package-under-test` resolvido para a lane do Telegram; o workflow
independente do Telegram ainda aceita uma especificação npm publicada para verificações pós-publicação.

## Automação de publicação de release

`OpenClaw Release Publish` é o ponto de entrada normal de publicação mutante. Ele
orquestra os workflows de publicador confiável na ordem necessária para a release:

1. Fazer checkout da tag da release e resolver seu SHA de commit.
2. Verificar se a tag é acessível a partir de `main` ou `release/*`.
3. Executar `pnpm plugins:sync:check`.
4. Disparar `Plugin NPM Release` com `publish_scope=all-publishable` e
   `ref=<release-sha>`.
5. Disparar `Plugin ClawHub Release` com o mesmo escopo e SHA.
6. Disparar `OpenClaw NPM Release` com a tag da release, a dist-tag npm e
   o `preflight_run_id` salvo.

Exemplo de publicação beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Publicação estável para a dist-tag beta padrão:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Promoção estável diretamente para `latest` é explícita:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Use os workflows de nível mais baixo `Plugin NPM Release` e `Plugin ClawHub Release`
somente para trabalho focado de reparo ou republicação. Para um reparo de Plugin selecionado, passe
`plugin_publish_scope=selected` e `plugins=@openclaw/name` para
`OpenClaw Release Publish`, ou dispare o workflow filho diretamente quando o
pacote OpenClaw não deve ser publicado.

## Entradas do workflow NPM

`OpenClaw NPM Release` aceita estas entradas controladas pelo operador:

- `tag`: tag de release obrigatória, como `v2026.4.2`, `v2026.4.2-1` ou
  `v2026.4.2-beta.1`; quando `preflight_only=true`, também pode ser o SHA de commit completo
  atual de 40 caracteres da branch do workflow para preflight somente de validação
- `preflight_only`: `true` apenas para validação/build/pacote, `false` para o
  caminho real de publicação
- `preflight_run_id`: obrigatório no caminho real de publicação para que o workflow reutilize
  o tarball preparado da execução de preflight bem-sucedida
- `npm_dist_tag`: tag npm de destino para o caminho de publicação; o padrão é `beta`

`OpenClaw Release Publish` aceita estas entradas controladas pelo operador:

- `tag`: tag de release obrigatória; já deve existir
- `preflight_run_id`: id da execução de preflight bem-sucedida de `OpenClaw NPM Release`;
  obrigatório quando `publish_openclaw_npm=true`
- `npm_dist_tag`: tag npm de destino para o pacote OpenClaw
- `plugin_publish_scope`: o padrão é `all-publishable`; use `selected` somente
  para trabalho focado de reparo
- `plugins`: nomes de pacotes `@openclaw/*` separados por vírgula quando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: o padrão é `true`; defina como `false` somente ao usar o
  workflow como orquestrador de reparo somente de Plugin

`OpenClaw Release Checks` aceita estas entradas controladas pelo operador:

- `ref`: branch, tag ou SHA de commit completo a validar. Verificações com segredos
  exigem que o commit resolvido seja acessível a partir de uma branch do OpenClaw ou
  tag de release.

Regras:

- Tags estáveis e de correção podem publicar em `beta` ou `latest`
- Tags de pré-release beta podem publicar somente em `beta`
- Para `OpenClaw NPM Release`, a entrada de SHA de commit completo é permitida somente quando
  `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` são sempre
  somente validação
- O caminho real de publicação deve usar o mesmo `npm_dist_tag` usado durante o preflight;
  o workflow verifica esses metadados antes que a publicação continue

## Sequência de release npm estável

Ao preparar uma release npm estável:

1. Execute `OpenClaw NPM Release` com `preflight_only=true`
   - Antes de existir uma tag, você pode usar o SHA de commit completo atual da branch do workflow
     para uma simulação somente de validação do workflow de preflight
2. Escolha `npm_dist_tag=beta` para o fluxo normal beta primeiro, ou `latest` somente
   quando você quiser intencionalmente uma publicação estável direta
3. Execute `Full Release Validation` na branch da release, tag da release ou SHA de commit completo
   quando quiser CI normal mais cache de prompt ao vivo, Docker, QA Lab,
   Matrix e cobertura de Telegram a partir de um workflow manual
4. Se você intencionalmente só precisa do grafo de testes normal determinístico, execute o
   workflow manual `CI` na ref da release em vez disso
5. Salve o `preflight_run_id` bem-sucedido
6. Execute `OpenClaw Release Publish` com a mesma `tag`, o mesmo `npm_dist_tag`
   e o `preflight_run_id` salvo; ele publica Plugins externalizados no npm
   e no ClawHub antes de promover o pacote npm do OpenClaw
7. Se a release caiu em `beta`, use o workflow privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover essa versão estável de `beta` para `latest`
8. Se a release foi publicada intencionalmente diretamente em `latest` e `beta`
   deve seguir a mesma build estável imediatamente, use o mesmo workflow privado
   para apontar ambas as dist-tags para a versão estável, ou deixe a sincronização
   agendada de autocorreção mover `beta` depois

A mutação de dist-tag fica no repositório privado por segurança, porque ela ainda
exige `NPM_TOKEN`, enquanto o repositório público mantém publicação somente com OIDC.

Isso mantém o caminho de publicação direta e o caminho de promoção beta primeiro
documentados e visíveis ao operador.

Se um mantenedor precisar recorrer à autenticação npm local, execute quaisquer comandos da CLI
do 1Password (`op`) somente dentro de uma sessão tmux dedicada. Não chame `op`
diretamente a partir do shell principal do agente; mantê-lo dentro do tmux torna prompts,
alertas e tratamento de OTP observáveis e evita alertas repetidos do host.

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

Mantenedores usam a documentação privada de release em
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
para o runbook real.

## Relacionado

- [Canais de release](/pt-BR/install/development-channels)
