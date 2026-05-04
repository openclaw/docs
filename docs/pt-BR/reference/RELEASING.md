---
read_when:
    - Procurando definições de canais de lançamento públicos
    - Executando a validação de release ou a aceitação de pacote
    - Buscando nomenclatura e cadência de versões
summary: Faixas de lançamento, lista de verificação do operador, caixas de validação, nomenclatura de versões e cadência
title: Política de lançamento
x-i18n:
    generated_at: "2026-05-04T07:03:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef50d3ef5d1e23b4e2c2b097fc4ca9f6d46bf8acb9aea0c9bca6d14e213b88b6
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw tem três canais públicos de release:

- estável: releases marcadas que publicam no npm `beta` por padrão, ou no npm `latest` quando solicitado explicitamente
- beta: tags de pré-release que publicam no npm `beta`
- dev: o head móvel de `main`

## Nomenclatura de versões

- Versão de release estável: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versão de release de correção estável: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versão de pré-release beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Não preencha mês ou dia com zero à esquerda
- `latest` significa o release npm estável promovido atual
- `beta` significa o destino atual de instalação beta
- Releases estáveis e releases de correção estáveis publicam no npm `beta` por padrão; operadores de release podem direcionar para `latest` explicitamente, ou promover uma build beta validada posteriormente
- Todo release estável do OpenClaw entrega o pacote npm e o app macOS juntos;
  releases beta normalmente validam e publicam primeiro o caminho npm/pacote, com
  build/assinatura/notarização do app Mac reservados para estável, salvo solicitação explícita

## Cadência de release

- Releases avançam primeiro para beta
- Estável vem somente depois que a beta mais recente é validada
- Mantenedores normalmente criam releases a partir de uma branch `release/YYYY.M.D` criada
  a partir da `main` atual, para que validação e correções de release não bloqueiem novo
  desenvolvimento na `main`
- Se uma tag beta tiver sido enviada ou publicada e precisar de correção, mantenedores criam
  a próxima tag `-beta.N` em vez de excluir ou recriar a tag beta antiga
- Procedimento detalhado de release, aprovações, credenciais e notas de recuperação são
  apenas para mantenedores

## Checklist do operador de release

Este checklist é o formato público do fluxo de release. Credenciais privadas,
assinatura, notarização, recuperação de dist-tag e detalhes de rollback de emergência ficam no
runbook de release restrito a mantenedores.

1. Comece pela `main` atual: puxe a versão mais recente, confirme que o commit de destino foi enviado,
   e confirme que o CI da `main` atual está verde o suficiente para criar uma branch a partir dele.
2. Reescreva a seção superior de `CHANGELOG.md` a partir do histórico real de commits com
   `/changelog`, mantenha as entradas voltadas ao usuário, faça commit, envie, e faça rebase/pull
   mais uma vez antes de criar a branch.
3. Revise os registros de compatibilidade de release em
   `src/plugins/compat/registry.ts` e
   `src/commands/doctor/shared/deprecation-compat.ts`. Remova compatibilidade expirada
   somente quando o caminho de upgrade continuar coberto, ou registre por que ela está
   sendo mantida intencionalmente.
4. Crie `release/YYYY.M.D` a partir da `main` atual; não faça trabalho normal de release
   diretamente na `main`.
5. Atualize todas as localizações de versão exigidas para a tag pretendida, execute
   `pnpm plugins:sync` para que os pacotes de Plugin publicáveis compartilhem a versão
   de release e os metadados de compatibilidade, depois execute o preflight determinístico local:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` e
   `pnpm release:check`.
6. Execute `OpenClaw NPM Release` com `preflight_only=true`. Antes de existir uma tag,
   um SHA completo de 40 caracteres da branch de release é permitido para preflight
   apenas de validação. Salve o `preflight_run_id` bem-sucedido.
7. Inicie todos os testes de pré-release com `Full Release Validation` para a
   branch de release, tag ou SHA completo do commit. Este é o único ponto de entrada manual
   para as quatro grandes caixas de teste de release: Vitest, Docker, QA Lab e Package.
8. Se a validação falhar, corrija na branch de release e reexecute o menor
   arquivo, canal, job de workflow, perfil de pacote, provedor ou allowlist de modelo com falha que
   comprove a correção. Reexecute o guarda-chuva completo somente quando a superfície alterada tornar
   as evidências anteriores obsoletas.
9. Para beta, marque `vYYYY.M.D-beta.N`, depois execute `OpenClaw Release Publish` a partir
   da branch `release/YYYY.M.D` correspondente. Ele verifica `pnpm plugins:sync:check`,
   publica primeiro todos os pacotes de Plugin publicáveis no npm, publica o mesmo
   conjunto no ClawHub em segundo lugar como tarballs ClawPack npm-pack, e então promove o
   artefato de preflight npm preparado do OpenClaw com a dist-tag correspondente. Após
   publicar, execute a aceitação de pacote pós-publicação
   contra o pacote publicado `openclaw@YYYY.M.D-beta.N` ou
   `openclaw@beta`. Se uma pré-release enviada ou publicada precisar de correção,
   crie o próximo número de pré-release correspondente; não exclua nem reescreva a pré-release
   antiga.
10. Para estável, continue somente depois que a beta validada ou o release candidate tiver as
    evidências de validação exigidas. A publicação npm estável também passa por
    `OpenClaw Release Publish`, reutilizando o artefato de preflight bem-sucedido via
    `preflight_run_id`; a prontidão do release macOS estável também exige os
    `.zip`, `.dmg`, `.dSYM.zip` empacotados e o `appcast.xml` atualizado na `main`.
11. Após publicar, execute o verificador npm pós-publicação, o E2E opcional do Telegram
    usando npm publicado independente quando precisar de prova de canal pós-publicação,
    promoção de dist-tag quando necessário, notas de release/pré-release do GitHub a partir da
    seção completa correspondente de `CHANGELOG.md`, e as etapas de anúncio de release.

## Preflight de release

- Execute `pnpm check:test-types` antes do preflight de release para que o TypeScript de teste continue coberto fora do gate local mais rápido `pnpm check`
- Execute `pnpm check:architecture` antes do preflight de release para que as verificações mais amplas de ciclos de importação e limites de arquitetura fiquem verdes fora do gate local mais rápido
- Execute `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que os artefatos de release esperados em `dist/*` e o bundle da Control UI existam para a etapa de validação do pack
- Execute `pnpm plugins:sync` depois do bump da versão raiz e antes de criar a tag. Ele atualiza versões de pacotes de plugins publicáveis, metadados de compatibilidade de peer/API do OpenClaw, metadados de build e stubs de changelog dos plugins para corresponder à versão de release do core. `pnpm plugins:sync:check` é o guardião de release não mutável; o workflow de publicação falha antes de qualquer mutação no registry se esta etapa tiver sido esquecida.
- Execute o workflow manual `Full Release Validation` antes da aprovação de release para iniciar todas as caixas de teste pré-release a partir de um único ponto de entrada. Ele aceita uma branch, tag ou SHA completo de commit, dispara `CI` manual e dispara `OpenClaw Release Checks` para smoke de instalação, aceitação de pacote, suítes de caminho de release do Docker, live/E2E, OpenWebUI, paridade do QA Lab, Matrix e faixas do Telegram. Com `release_profile=full` e `rerun_group=all`, ele também executa o E2E de pacote do Telegram contra o artefato `release-package-under-test` das verificações de release. Forneça `npm_telegram_package_spec` depois da publicação quando o mesmo E2E do Telegram também precisar comprovar o pacote npm publicado. Forneça `package_acceptance_package_spec` depois da publicação quando Package Acceptance precisar executar sua matriz de pacote/atualização contra o pacote npm entregue em vez do artefato criado a partir do SHA. Forneça `evidence_package_spec` quando o relatório privado de evidências precisar comprovar que a validação corresponde a um pacote npm publicado sem forçar E2E do Telegram. Exemplo:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Execute o workflow manual `Package Acceptance` quando quiser prova por canal lateral para um candidato de pacote enquanto o trabalho de release continua. Use `source=npm` para `openclaw@beta`, `openclaw@latest` ou uma versão exata de release; `source=ref` para empacotar uma branch/tag/SHA `package_ref` confiável com o harness `workflow_ref` atual; `source=url` para um tarball HTTPS com SHA-256 obrigatório; ou `source=artifact` para um tarball enviado por outra execução do GitHub Actions. O workflow resolve o candidato para `package-under-test`, reutiliza o agendador de release Docker E2E contra esse tarball e pode executar QA do Telegram contra o mesmo tarball com `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`. Quando as faixas Docker selecionadas incluem `published-upgrade-survivor`, o artefato do pacote é o candidato e `published_upgrade_survivor_baseline` seleciona a linha de base publicada.
  Exemplo: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Perfis comuns:
  - `smoke`: faixas de instalação/canal/agente, rede do Gateway e recarregamento de configuração
  - `package`: faixas nativas de artefato para pacote/atualização/plugin sem OpenWebUI ou ClawHub live
  - `product`: perfil de pacote mais canais MCP, limpeza de cron/subagente,
    busca web da OpenAI e OpenWebUI
  - `full`: partes do caminho de release Docker com OpenWebUI
  - `custom`: seleção exata de `docker_lanes` para uma reexecução focada
- Execute o workflow manual `CI` diretamente quando você só precisar da cobertura completa normal de CI para o candidato de release. Disparos manuais de CI ignoram o escopo por alterações e forçam as shards Linux Node, shards de plugins agrupados, contratos de canais, compatibilidade com Node 22, `check`, `check-additional`, smoke de build, verificações de docs, Skills em Python, Windows, macOS, Android e faixas de i18n da Control UI.
  Exemplo: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Execute `pnpm qa:otel:smoke` ao validar telemetria de release. Ele exercita o QA-lab por meio de um receptor OTLP/HTTP local e verifica os nomes de spans de trace exportados, atributos limitados e redação de conteúdo/identificadores sem exigir Opik, Langfuse ou outro coletor externo.
- Execute `pnpm release:check` antes de toda release com tag
- Execute `OpenClaw Release Publish` para a sequência de publicação mutável depois que a tag existir. Dispare-o a partir de `release/YYYY.M.D` (ou `main` ao publicar uma tag alcançável por main), passe a tag de release e o `preflight_run_id` npm do OpenClaw bem-sucedido, e mantenha o escopo padrão de publicação de plugins `all-publishable`, a menos que você esteja executando deliberadamente um reparo focado. O workflow serializa a publicação npm de plugins, a publicação ClawHub de plugins e a publicação npm do OpenClaw para que o pacote core não seja publicado antes dos seus plugins externalizados.
- As verificações de release agora são executadas em um workflow manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` também executa a faixa de paridade mock do QA Lab mais o perfil Matrix live rápido e a faixa QA do Telegram antes da aprovação de release. As faixas live usam o ambiente `qa-live-shared`; o Telegram também usa concessões de credenciais CI do Convex. Execute o workflow manual `QA-Lab - All Lanes` com `matrix_profile=all` e `matrix_shards=true` quando quiser o inventário completo de transporte Matrix, mídia e E2EE em paralelo.
- A validação de runtime de instalação e atualização entre sistemas operacionais faz parte dos workflows públicos `OpenClaw Release Checks` e `Full Release Validation`, que chamam diretamente o workflow reutilizável `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Essa divisão é intencional: manter o caminho real de release npm curto, determinístico e focado em artefatos, enquanto verificações live mais lentas permanecem na própria faixa para não atrasarem nem bloquearem a publicação
- Verificações de release que carregam segredos devem ser disparadas por meio de `Full Release Validation` ou a partir do ref de workflow `main`/release para que a lógica do workflow e os segredos permaneçam controlados
- `OpenClaw Release Checks` aceita uma branch, tag ou SHA completo de commit desde que o commit resolvido seja alcançável a partir de uma branch OpenClaw ou tag de release
- O preflight apenas de validação de `OpenClaw NPM Release` também aceita o SHA completo de 40 caracteres do commit atual da branch do workflow sem exigir uma tag enviada
- Esse caminho por SHA é apenas de validação e não pode ser promovido para uma publicação real
- No modo SHA, o workflow sintetiza `v<package.json version>` apenas para a verificação de metadados do pacote; a publicação real ainda exige uma tag de release real
- Ambos os workflows mantêm o caminho real de publicação e promoção em runners hospedados pelo GitHub, enquanto o caminho de validação não mutável pode usar os runners Linux maiores do Blacksmith
- Esse workflow executa
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando os segredos de workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- O preflight de release npm não espera mais pela faixa separada de verificações de release
- Execute `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou a tag beta/correção correspondente) antes da aprovação
- Depois da publicação npm, execute
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou a versão beta/correção correspondente) para verificar o caminho de instalação pelo registry publicado em um prefixo temporário novo
- Depois de uma publicação beta, execute `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  para verificar onboarding do pacote instalado, configuração do Telegram e E2E real do Telegram contra o pacote npm publicado usando o pool compartilhado de credenciais alugadas do Telegram. Execuções pontuais locais de mantenedores podem omitir as vars do Convex e passar diretamente as três credenciais de env `OPENCLAW_QA_TELEGRAM_*`.
- Para executar o smoke beta pós-publicação completo a partir de uma máquina de mantenedor, use `pnpm release:beta-smoke -- --beta betaN`. O helper executa validação de atualização npm/fresh-target do Parallels, dispara `NPM Telegram Beta E2E`, consulta a execução exata do workflow, baixa o artefato e imprime o relatório do Telegram.
- Mantenedores podem executar a mesma verificação pós-publicação a partir do GitHub Actions por meio do workflow manual `NPM Telegram Beta E2E`. Ele é intencionalmente apenas manual e não roda em todo merge.
- A automação de release de mantenedores agora usa preflight-depois-promote:
  - a publicação npm real deve passar um `preflight_run_id` npm bem-sucedido
  - a publicação npm real deve ser disparada a partir da mesma branch `main` ou
    `release/YYYY.M.D` da execução de preflight bem-sucedida
  - releases npm estáveis usam `beta` por padrão
  - a publicação npm estável pode mirar `latest` explicitamente via input do workflow
  - a mutação de dist-tag npm baseada em token agora vive em
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    por segurança, porque `npm dist-tag add` ainda precisa de `NPM_TOKEN`, enquanto o repo público mantém publicação somente com OIDC
  - `macOS Release` público é apenas validação; quando uma tag existe apenas em uma
    branch de release, mas o workflow é disparado a partir de `main`, defina
    `public_release_branch=release/YYYY.M.D`
  - a publicação privada real do mac deve passar por `preflight_run_id` e `validate_run_id` privados de mac bem-sucedidos
  - os caminhos reais de publicação promovem artefatos preparados em vez de reconstruí-los novamente
- Para releases de correção estáveis como `YYYY.M.D-N`, o verificador pós-publicação também checa o mesmo caminho de atualização com prefixo temporário de `YYYY.M.D` para `YYYY.M.D-N`, para que correções de release não deixem silenciosamente instalações globais antigas no payload estável base
- O preflight de release npm falha fechado, a menos que o tarball inclua tanto `dist/control-ui/index.html` quanto um payload não vazio em `dist/control-ui/assets/`, para que não entreguemos novamente um dashboard de navegador vazio
- A verificação pós-publicação também checa se os entrypoints de plugins publicados e os metadados de pacote estão presentes no layout instalado do registry. Uma release que entrega payloads de runtime de plugins ausentes falha no verificador postpublish e não pode ser promovida para `latest`.
- `pnpm test:install:smoke` também impõe o orçamento de `unpackedSize` do pack npm no tarball candidato de atualização, para que o e2e do instalador detecte crescimento acidental do pack antes do caminho de publicação de release
- Se o trabalho de release tocou planejamento de CI, manifests de timing de extensões ou matrizes de teste de extensões, regenere e revise as saídas de matriz `plugin-prerelease-extension-shard`, de propriedade do planejador, a partir de `.github/workflows/plugin-prerelease.yml` antes da aprovação para que as notas de release não descrevam um layout de CI obsoleto
- A prontidão de release estável do macOS também inclui as superfícies do atualizador:
  - a release do GitHub deve acabar com os `.zip`, `.dmg` e `.dSYM.zip` empacotados
  - `appcast.xml` em `main` deve apontar para o novo zip estável depois da publicação
  - o app empacotado deve manter um bundle id não debug, uma URL de feed Sparkle não vazia e um `CFBundleVersion` igual ou superior ao piso canônico de build do Sparkle para essa versão de release

## Caixas de teste de release

`Full Release Validation` é como operadores iniciam todos os testes pré-release a partir de um único ponto de entrada. Para uma prova de commit fixado em uma branch de movimentação rápida, use o helper para que todo workflow filho rode a partir de uma branch temporária fixada no SHA de destino:

```bash
pnpm ci:full-release --sha <full-sha>
```

O helper envia `release-ci/<sha>-...`, dispara `Full Release Validation` a partir dessa branch com `ref=<sha>`, verifica se todo `headSha` de workflow filho corresponde ao alvo e então exclui a branch temporária. Isso evita comprovar por acidente uma execução filha de `main` mais nova.

Para validação de branch ou tag de release, execute a partir do ref de workflow confiável `main` e passe a branch ou tag de release como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

O fluxo de trabalho resolve a ref de destino, despacha o `CI` manual com
`target_ref=<release-ref>`, despacha `OpenClaw Release Checks`, prepara um
artefato pai `release-package-under-test` para verificações voltadas a pacotes e
despacha o E2E independente do pacote Telegram quando `release_profile=full` com
`rerun_group=all` ou quando `npm_telegram_package_spec` está definido. Em
seguida, `OpenClaw Release Checks` distribui smoke de instalação, verificações de
lançamento entre sistemas operacionais, cobertura do caminho de lançamento
live/E2E em Docker, Package Acceptance com QA do pacote Telegram, paridade do QA
Lab, Matrix live e Telegram live. Uma execução completa só é aceitável quando o
resumo de `Full Release Validation` mostra `normal_ci` e `release_checks` como
bem-sucedidos. No modo full/all, o filho `npm_telegram` também deve ser
bem-sucedido; fora de full/all, ele é ignorado, a menos que um
`npm_telegram_package_spec` publicado tenha sido fornecido. O resumo final do
verificador inclui tabelas dos jobs mais lentos para cada execução filha, para
que o gerente de lançamento possa ver o caminho crítico atual sem baixar logs.
Consulte [Validação completa de lançamento](/pt-BR/reference/full-release-validation)
para ver a matriz de estágios completa, os nomes exatos dos jobs de workflow, as
diferenças entre os perfis stable e full, artefatos e identificadores de nova
execução focada.
Os workflows filhos são despachados a partir da ref confiável que executa
`Full Release Validation`, normalmente `--ref main`, mesmo quando a `ref` de
destino aponta para um branch ou tag de lançamento mais antigo. Não há uma
entrada separada de ref do workflow Full Release Validation; escolha o harness
confiável escolhendo a ref da execução do workflow. Não use `--ref main -f
ref=<sha>` para prova de commit exata em uma `main` móvel; SHAs brutos de commit
não podem ser refs de despacho de workflow, então use `pnpm ci:full-release
--sha <sha>` para criar o branch temporário fixado.

Use `release_profile` para selecionar a amplitude live/de provedor:

- `minimum`: caminho live e Docker mais rápido, crítico para lançamento, de OpenAI/core
- `stable`: minimum mais cobertura estável de provedor/backend para aprovação de lançamento
- `full`: stable mais cobertura ampla de provedores/mídia consultiva

`OpenClaw Release Checks` usa a ref confiável do workflow para resolver a ref de
destino uma vez como `release-package-under-test` e reutiliza esse artefato tanto
nas verificações Docker do caminho de lançamento quanto no Package Acceptance.
Isso mantém todas as caixas voltadas a pacotes nos mesmos bytes e evita builds de
pacote repetidos. O smoke de instalação OpenAI entre sistemas operacionais usa
`OPENCLAW_CROSS_OS_OPENAI_MODEL` quando a variável de repo/org está definida;
caso contrário, usa `openai/gpt-5.4`, porque esta lane prova a instalação do
pacote, onboarding, inicialização do Gateway e uma interação live de agente, em
vez de fazer benchmark do modelo padrão mais lento. A matriz live mais ampla de
provedores continua sendo o lugar para cobertura específica por modelo.

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

Não use o guarda-chuva completo como a primeira nova execução após uma correção
focada. Se uma caixa falhar, use o workflow filho, job, lane Docker, perfil de
pacote, provedor de modelo ou lane de QA que falhou para a próxima prova.
Execute o guarda-chuva completo novamente somente quando a correção tiver
alterado a orquestração compartilhada de lançamento ou tornado obsoleta a
evidência anterior de todas as caixas. O verificador final do guarda-chuva
reverifica os ids registrados das execuções de workflows filhos; portanto, depois
que um workflow filho for reexecutado com sucesso, reexecute apenas o job pai
`Verify full validation` que falhou.

Para recuperação limitada, passe `rerun_group` ao guarda-chuva. `all` é a
execução real do candidato a lançamento, `ci` executa apenas o filho de CI normal,
`plugin-prerelease` executa apenas o filho de plugin exclusivo de lançamento,
`release-checks` executa todas as caixas de lançamento, e os grupos de lançamento
mais estreitos são `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`,
`qa-parity`, `qa-live` e `npm-telegram`. Novas execuções focadas de
`npm-telegram` exigem `npm_telegram_package_spec`; execuções full/all com
`release_profile=full` usam o artefato de pacote de release-checks.

### Vitest

A caixa Vitest é o workflow filho `CI` manual. O CI manual ignora
intencionalmente o escopo por mudanças e força o grafo de testes normal para o
candidato a lançamento: shards Linux Node, shards de plugins agrupados,
contratos de canais, compatibilidade com Node 22, `check`, `check-additional`,
smoke de build, verificações de docs, Skills Python, Windows, macOS, Android e
i18n da Control UI.

Use esta caixa para responder "a árvore de código-fonte passou na suíte completa
normal de testes?" Ela não é a mesma coisa que validação de produto no caminho de
lançamento. Evidências a manter:

- resumo de `Full Release Validation` mostrando a URL da execução `CI` despachada
- execução `CI` verde no SHA de destino exato
- nomes de shards com falha ou lentos dos jobs de CI ao investigar regressões
- artefatos de temporização do Vitest, como `.artifacts/vitest-shard-timings.json`, quando
  uma execução precisa de análise de desempenho

Execute o CI manual diretamente somente quando o lançamento precisar de CI normal
determinístico, mas não das caixas Docker, QA Lab, live, entre sistemas
operacionais ou de pacote:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

A caixa Docker fica em `OpenClaw Release Checks` por meio de
`openclaw-live-and-e2e-checks-reusable.yml`, além do workflow `install-smoke` em
modo de lançamento. Ela valida o candidato a lançamento por meio de ambientes
Docker empacotados, em vez de apenas testes em nível de código-fonte.

A cobertura Docker de lançamento inclui:

- smoke completo de instalação com o smoke lento de instalação global Bun habilitado
- preparação/reutilização da imagem smoke do Dockerfile raiz por SHA de destino, com QR,
  raiz/Gateway e jobs de smoke de instalador/Bun executando como shards separados de install-smoke
- lanes E2E do repositório
- chunks Docker do caminho de lançamento: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` e `plugins-runtime-install-h`
- cobertura OpenWebUI dentro do chunk `plugins-runtime-services` quando solicitada
- lanes divididas de instalação/desinstalação de plugin agrupado,
  de `bundled-plugin-install-uninstall-0` até
  `bundled-plugin-install-uninstall-23`
- suítes live/E2E de provedores e cobertura de modelo live em Docker quando as verificações
  de lançamento incluem suítes live

Use os artefatos Docker antes de reexecutar. O agendador do caminho de lançamento
envia `.artifacts/docker-tests/` com logs de lanes, `summary.json`,
`failures.json`, temporizações de fases, JSON do plano do agendador e comandos de
nova execução. Para recuperação focada, use `docker_lanes=<lane[,lane]>` no
workflow reutilizável live/E2E em vez de reexecutar todos os chunks de
lançamento. Comandos gerados de nova execução incluem o
`package_artifact_run_id` anterior e entradas preparadas de imagem Docker quando
disponíveis, para que uma lane com falha possa reutilizar o mesmo tarball e as
mesmas imagens GHCR.

### QA Lab

A caixa QA Lab também faz parte de `OpenClaw Release Checks`. Ela é o gate de
lançamento de comportamento agentivo e em nível de canal, separado do Vitest e
dos mecanismos de pacote do Docker.

A cobertura QA Lab de lançamento inclui:

- lane de paridade mock comparando a lane candidata OpenAI com a baseline Opus 4.6
  usando o pacote de paridade agentiva
- perfil rápido de QA Matrix live usando o ambiente `qa-live-shared`
- lane de QA Telegram live usando locações de credenciais CI do Convex
- `pnpm qa:otel:smoke` quando a telemetria de lançamento precisa de prova local explícita

Use esta caixa para responder "o lançamento se comporta corretamente em cenários
de QA e fluxos live de canal?" Mantenha as URLs de artefatos para as lanes de
paridade, Matrix e Telegram ao aprovar o lançamento. A cobertura Matrix completa
continua disponível como uma execução QA-Lab manual em shards, em vez da lane
padrão crítica para lançamento.

### Pacote

A caixa Pacote é o gate do produto instalável. Ela é apoiada por
`Package Acceptance` e pelo resolvedor
`scripts/resolve-openclaw-package-candidate.mjs`. O resolvedor normaliza um
candidato no tarball `package-under-test` consumido pelo Docker E2E, valida o
inventário do pacote, registra a versão do pacote e o SHA-256, e mantém a ref do
harness do workflow separada da ref do código-fonte do pacote.

Fontes de candidato compatíveis:

- `source=npm`: `openclaw@beta`, `openclaw@latest` ou uma versão exata de lançamento do OpenClaw
- `source=ref`: empacota um branch, tag ou SHA completo de commit de `package_ref` confiável
  com o harness `workflow_ref` selecionado
- `source=url`: baixa um `.tgz` HTTPS com `package_sha256` obrigatório
- `source=artifact`: reutiliza um `.tgz` enviado por outra execução do GitHub Actions

`OpenClaw Release Checks` executa Package Acceptance com `source=artifact`, o
artefato de pacote de lançamento preparado, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues` e
`telegram_mode=mock-openai`. Package Acceptance mantém migração, atualização,
limpeza de dependências obsoletas de plugin, fixtures de plugin offline,
atualização de plugin e QA de pacote Telegram contra o mesmo tarball resolvido. A
matriz de upgrade cobre todas as baselines estáveis publicadas no npm de
`2026.4.23` até `latest`; use Package Acceptance com `source=npm` para um
candidato já enviado, ou `source=ref`/`source=artifact` para um tarball npm local
com base em SHA antes da publicação. Ele é o substituto nativo do GitHub para a
maior parte da cobertura de pacote/atualização que antes exigia Parallels. As
verificações de lançamento entre sistemas operacionais ainda importam para
onboarding, instalador e comportamento de plataforma específicos de SO, mas a
validação de produto de pacote/atualização deve preferir Package Acceptance.

A checklist canônica para validação de atualização e plugin é
[Testando atualizações e plugins](/pt-BR/help/testing-updates-plugins). Use-a ao
decidir qual lane local, Docker, Package Acceptance ou de release-check prova uma
instalação/atualização de plugin, limpeza pelo doctor ou mudança de migração de
pacote publicado. A migração exaustiva de atualização publicada a partir de cada
pacote estável `2026.4.23+` é um workflow manual separado `Update Migration`, não
parte do Full Release CI.

A leniência legada de package-acceptance é intencionalmente limitada no tempo.
Pacotes até `2026.4.25` podem usar o caminho de compatibilidade para lacunas de
metadados já publicadas no npm: entradas privadas de inventário de QA ausentes no
tarball, `gateway install --wrapper` ausente, arquivos de patch ausentes no
fixture git derivado do tarball, `update.channel` persistido ausente, locais
legados de registro de instalação de plugin, persistência ausente de registro de
instalação do marketplace e migração de metadados de configuração durante
`plugins update`. O pacote `2026.4.26` publicado pode avisar sobre arquivos de
carimbo de metadados de build local que já foram enviados. Pacotes posteriores
devem satisfazer os contratos modernos de pacote; essas mesmas lacunas fazem a
validação de lançamento falhar.

Use perfis Package Acceptance mais amplos quando a pergunta de lançamento for
sobre um pacote instalável real:

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

- `smoke`: faixas rápidas de instalação de pacote/canal/agente, rede do Gateway e
  recarregamento de configuração
- `package`: contratos de instalação/atualização/pacote de Plugin sem ClawHub ao vivo; este é o
  padrão de verificação de lançamento
- `product`: `package` mais canais MCP, limpeza de cron/subagente, pesquisa web da OpenAI
  e OpenWebUI
- `full`: partes do caminho de lançamento Docker com OpenWebUI
- `custom`: lista exata de `docker_lanes` para reexecuções focadas

Para prova do Telegram com pacote candidato, habilite `telegram_mode=mock-openai` ou
`telegram_mode=live-frontier` em Package Acceptance. O workflow passa o tarball
resolvido de `package-under-test` para a faixa do Telegram; o workflow avulso do
Telegram ainda aceita uma especificação npm publicada para verificações pós-publicação.

## Automação de publicação de lançamento

`OpenClaw Release Publish` é o ponto de entrada mutável normal de publicação. Ele
orquestra os workflows de publicador confiável na ordem exigida pelo lançamento:

1. Fazer checkout da tag de lançamento e resolver seu SHA de commit.
2. Verificar se a tag é alcançável a partir de `main` ou `release/*`.
3. Executar `pnpm plugins:sync:check`.
4. Disparar `Plugin NPM Release` com `publish_scope=all-publishable` e
   `ref=<release-sha>`.
5. Disparar `Plugin ClawHub Release` com o mesmo escopo e SHA.
6. Disparar `OpenClaw NPM Release` com a tag de lançamento, a dist-tag npm e o
   `preflight_run_id` salvo.

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

A promoção estável diretamente para `latest` é explícita:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Use os workflows de nível mais baixo `Plugin NPM Release` e `Plugin ClawHub Release`
apenas para trabalhos focados de reparo ou republicação. Para um reparo de Plugin
selecionado, passe `plugin_publish_scope=selected` e `plugins=@openclaw/name` para
`OpenClaw Release Publish`, ou dispare o workflow filho diretamente quando o pacote
OpenClaw não deve ser publicado.

## Entradas do workflow NPM

`OpenClaw NPM Release` aceita estas entradas controladas pelo operador:

- `tag`: tag de lançamento obrigatória, como `v2026.4.2`, `v2026.4.2-1` ou
  `v2026.4.2-beta.1`; quando `preflight_only=true`, também pode ser o SHA de commit
  completo de 40 caracteres do branch do workflow atual para preflight apenas de validação
- `preflight_only`: `true` apenas para validação/build/pacote, `false` para o
  caminho real de publicação
- `preflight_run_id`: obrigatório no caminho real de publicação para que o workflow reutilize
  o tarball preparado da execução de preflight bem-sucedida
- `npm_dist_tag`: tag npm de destino para o caminho de publicação; o padrão é `beta`

`OpenClaw Release Publish` aceita estas entradas controladas pelo operador:

- `tag`: tag de lançamento obrigatória; já deve existir
- `preflight_run_id`: id da execução de preflight bem-sucedida de `OpenClaw NPM Release`;
  obrigatório quando `publish_openclaw_npm=true`
- `npm_dist_tag`: tag npm de destino para o pacote OpenClaw
- `plugin_publish_scope`: o padrão é `all-publishable`; use `selected` apenas
  para trabalho focado de reparo
- `plugins`: nomes de pacotes `@openclaw/*` separados por vírgula quando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: o padrão é `true`; defina como `false` apenas ao usar o
  workflow como orquestrador de reparo somente de Plugins

`OpenClaw Release Checks` aceita estas entradas controladas pelo operador:

- `ref`: branch, tag ou SHA de commit completo a validar. Verificações que carregam segredos
  exigem que o commit resolvido seja alcançável a partir de um branch do OpenClaw ou
  tag de lançamento.

Regras:

- Tags estáveis e de correção podem publicar em `beta` ou `latest`
- Tags beta de pré-lançamento podem publicar apenas em `beta`
- Para `OpenClaw NPM Release`, a entrada de SHA de commit completo é permitida apenas quando
  `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` são sempre
  apenas de validação
- O caminho real de publicação deve usar o mesmo `npm_dist_tag` usado durante o preflight;
  o workflow verifica esses metadados antes de a publicação continuar

## Sequência de lançamento npm estável

Ao preparar um lançamento npm estável:

1. Execute `OpenClaw NPM Release` com `preflight_only=true`
   - Antes de uma tag existir, você pode usar o SHA de commit completo do branch do workflow atual
     para uma execução simulada apenas de validação do workflow de preflight
2. Escolha `npm_dist_tag=beta` para o fluxo normal beta primeiro, ou `latest` apenas
   quando você quiser intencionalmente uma publicação estável direta
3. Execute `Full Release Validation` no branch de lançamento, tag de lançamento ou SHA de
   commit completo quando quiser CI normal mais cobertura de cache de prompt ao vivo,
   Docker, QA Lab, Matrix e Telegram em um único workflow manual
4. Se você intencionalmente precisar apenas do grafo de testes normal determinístico, execute o
   workflow manual `CI` na ref de lançamento
5. Salve o `preflight_run_id` bem-sucedido
6. Execute `OpenClaw Release Publish` com a mesma `tag`, o mesmo `npm_dist_tag`
   e o `preflight_run_id` salvo; ele publica Plugins externalizados no npm
   e no ClawHub antes de promover o pacote npm do OpenClaw
7. Se o lançamento chegou a `beta`, use o workflow privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover essa versão estável de `beta` para `latest`
8. Se o lançamento foi publicado intencionalmente diretamente em `latest` e `beta`
   deve seguir a mesma build estável imediatamente, use esse mesmo workflow privado
   para apontar ambas as dist-tags para a versão estável, ou deixe a sincronização
   autorreparadora agendada mover `beta` depois

A mutação de dist-tag fica no repositório privado por segurança, porque ainda
exige `NPM_TOKEN`, enquanto o repositório público mantém publicação apenas com OIDC.

Isso mantém tanto o caminho de publicação direta quanto o caminho de promoção beta primeiro
documentados e visíveis ao operador.

Se um mantenedor precisar recorrer à autenticação npm local, execute quaisquer comandos da CLI
do 1Password (`op`) apenas dentro de uma sessão tmux dedicada. Não chame `op`
diretamente do shell principal do agente; mantê-lo dentro do tmux torna prompts,
alertas e o manuseio de OTP observáveis e evita alertas repetidos no host.

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

Mantenedores usam os documentos privados de lançamento em
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
para o runbook real.

## Relacionado

- [Canais de lançamento](/pt-BR/install/development-channels)
