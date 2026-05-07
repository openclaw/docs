---
read_when:
    - Procurando definições de canais de lançamento públicos
    - Executando a validação de lançamento ou a aceitação de pacote
    - Procurando nomenclatura e cadência de versões
summary: Trilhas de lançamento, lista de verificação do operador, caixas de validação, nomenclatura de versões e cadência
title: Política de lançamento
x-i18n:
    generated_at: "2026-05-07T13:24:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3b9f4875496d7278ba18a8b5cb2735fb870cf32254bfc1fd819e4f233db489e
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw tem três canais públicos de lançamento:

- estável: lançamentos marcados por tag que publicam no npm `beta` por padrão, ou no npm `latest` quando solicitado explicitamente
- beta: tags de pré-lançamento que publicam no npm `beta`
- desenvolvimento: a ponta móvel de `main`

## Nomeação de versões

- Versão de lançamento estável: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versão de lançamento de correção estável: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versão de pré-lançamento beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Não preencha mês ou dia com zero à esquerda
- `latest` significa o lançamento npm estável promovido atual
- `beta` significa o alvo atual de instalação beta
- Lançamentos estáveis e lançamentos de correção estável publicam no npm `beta` por padrão; operadores de lançamento podem direcionar para `latest` explicitamente, ou promover uma build beta validada posteriormente
- Todo lançamento estável do OpenClaw entrega o pacote npm e o app para macOS juntos;
  lançamentos beta normalmente validam e publicam primeiro o caminho npm/pacote, com
  build/assinatura/notarização do app para Mac reservadas para estável, salvo solicitação explícita

## Cadência de lançamentos

- Lançamentos avançam primeiro por beta
- Estável vem somente depois que o beta mais recente é validado
- Mantenedores normalmente criam lançamentos a partir de um branch `release/YYYY.M.D` criado
  a partir do `main` atual, para que a validação e as correções do lançamento não bloqueiem novo
  desenvolvimento em `main`
- Se uma tag beta foi enviada ou publicada e precisa de uma correção, mantenedores criam
  a próxima tag `-beta.N` em vez de excluir ou recriar a tag beta antiga
- Procedimento detalhado de lançamento, aprovações, credenciais e notas de recuperação são
  somente para mantenedores

## Lista de verificação do operador de lançamento

Esta lista de verificação é o formato público do fluxo de lançamento. Credenciais privadas,
assinatura, notarização, recuperação de dist-tag e detalhes de rollback de emergência ficam no
runbook de lançamento somente para mantenedores.

1. Comece pelo `main` atual: puxe a versão mais recente, confirme que o commit alvo foi enviado,
   e confirme que o CI atual de `main` está verde o suficiente para criar um branch a partir dele.
2. Reescreva a seção superior de `CHANGELOG.md` a partir do histórico real de commits com
   `/changelog`, mantenha as entradas voltadas ao usuário, faça commit, envie, e faça rebase/pull
   mais uma vez antes de criar o branch.
3. Revise os registros de compatibilidade de lançamento em
   `src/plugins/compat/registry.ts` e
   `src/commands/doctor/shared/deprecation-compat.ts`. Remova compatibilidade expirada
   somente quando o caminho de upgrade continuar coberto, ou registre por que ela é
   intencionalmente mantida.
4. Crie `release/YYYY.M.D` a partir do `main` atual; não faça trabalho normal de lançamento
   diretamente em `main`.
5. Atualize todas as localizações de versão exigidas para a tag pretendida, execute
   `pnpm plugins:sync` para que pacotes Plugin publicáveis compartilhem a versão de lançamento
   e os metadados de compatibilidade, depois execute o preflight determinístico local:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` e
   `pnpm release:check`.
6. Execute `OpenClaw NPM Release` com `preflight_only=true`. Antes de uma tag existir,
   um SHA completo de 40 caracteres do branch de lançamento é permitido para preflight
   somente de validação. Salve o `preflight_run_id` bem-sucedido.
7. Inicie todos os testes de pré-lançamento com `Full Release Validation` para o
   branch de lançamento, tag ou SHA completo do commit. Este é o único ponto de entrada manual
   para as quatro grandes caixas de teste de lançamento: Vitest, Docker, QA Lab e Package.
8. Se a validação falhar, corrija no branch de lançamento e execute novamente o menor
   arquivo, canal, job de workflow, perfil de pacote, provedor ou allowlist de modelo com falha que
   comprove a correção. Execute novamente o guarda-chuva completo somente quando a superfície alterada tornar
   evidências anteriores obsoletas.
9. Para beta, marque `vYYYY.M.D-beta.N`, depois execute `OpenClaw Release Publish` a partir
   do branch `release/YYYY.M.D` correspondente. Ele verifica `pnpm plugins:sync:check`,
   dispara todos os pacotes Plugin publicáveis para o npm e o mesmo conjunto para
   ClawHub em paralelo, e então promove o artefato de preflight npm preparado do OpenClaw
   com a dist-tag correspondente assim que a publicação npm do Plugin for bem-sucedida.
   A publicação no ClawHub ainda pode estar em execução enquanto o npm do OpenClaw publica, mas o
   workflow de publicação de lançamento não termina até que ambos os caminhos de publicação de Plugin e
   o caminho de publicação npm do OpenClaw tenham sido concluídos com sucesso. Após a publicação, execute
   a aceitação de pacote pós-publicação
   contra o pacote `openclaw@YYYY.M.D-beta.N` ou
   `openclaw@beta` publicado. Se um pré-lançamento enviado ou publicado precisar de uma correção,
   crie o próximo número de pré-lançamento correspondente; não exclua nem reescreva o pré-lançamento antigo.
10. Para estável, continue somente depois que o beta ou candidato a lançamento validado tiver as
    evidências de validação exigidas. A publicação npm estável também passa por
    `OpenClaw Release Publish`, reutilizando o artefato de preflight bem-sucedido por meio de
    `preflight_run_id`; a prontidão do lançamento estável para macOS também exige os
    `.zip`, `.dmg`, `.dSYM.zip` empacotados e o `appcast.xml` atualizado em `main`.
11. Após a publicação, execute o verificador npm pós-publicação, o E2E Telegram opcional independente
    de npm publicado quando você precisar de prova de canal pós-publicação,
    promoção de dist-tag quando necessário, notas de lançamento/pré-lançamento do GitHub a partir da
    seção completa correspondente de `CHANGELOG.md`, e as etapas de anúncio do lançamento.

## Preflight de lançamento

- Execute `pnpm check:test-types` antes do preflight de release para que o TypeScript de testes permaneça
  coberto fora do gate local mais rápido `pnpm check`
- Execute `pnpm check:architecture` antes do preflight de release para que as verificações mais amplas de ciclos de importação
  e limites de arquitetura estejam verdes fora do gate local mais rápido
- Execute `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que os artefatos de release esperados
  `dist/*` e o bundle da Control UI existam para a etapa de validação
  do pack
- Execute `pnpm plugins:sync` após o bump da versão raiz e antes de criar a tag. Ele
  atualiza as versões de pacotes de plugin publicáveis, os metadados de compatibilidade
  de peer/API do OpenClaw, os metadados de build e os stubs de changelog de plugin para corresponder à versão
  de release do núcleo. `pnpm plugins:sync:check` é a proteção de release não mutável;
  o workflow de publicação falha antes de qualquer mutação de registro se esta etapa tiver sido
  esquecida.
- Execute o workflow manual `Full Release Validation` antes da aprovação de release para
  iniciar todas as caixas de teste de pré-release a partir de um único ponto de entrada. Ele aceita uma branch,
  tag ou SHA completo de commit, dispara `CI` manual e dispara
  `OpenClaw Release Checks` para smoke de instalação, aceitação de pacote, verificações de pacote
  entre sistemas operacionais, paridade do QA Lab, Matrix e lanes do Telegram. Execuções estáveis/padrão
  mantêm o soak exaustivo live/E2E e do caminho de release do Docker atrás de
  `run_release_soak=true`; `release_profile=full` força o soak. Com
  `release_profile=full` e `rerun_group=all`, ele também executa E2E de pacote do Telegram
  contra o artefato `release-package-under-test` das verificações de release.
  Forneça `npm_telegram_package_spec` após a publicação quando o mesmo
  E2E do Telegram também deve comprovar o pacote npm publicado. Forneça
  `package_acceptance_package_spec` após a publicação quando Package Acceptance
  deve executar sua matriz de pacote/atualização contra o pacote npm enviado em vez
  do artefato criado a partir do SHA. Forneça
  `evidence_package_spec` quando o relatório privado de evidências deve comprovar que a
  validação corresponde a um pacote npm publicado sem forçar o E2E do Telegram.
  Exemplo:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Execute o workflow manual `Package Acceptance` quando quiser uma comprovação de canal lateral
  para um candidato de pacote enquanto o trabalho de release continua. Use `source=npm` para
  `openclaw@beta`, `openclaw@latest` ou uma versão exata de release; `source=ref`
  para empacotar uma branch/tag/SHA confiável de `package_ref` com o harness atual
  `workflow_ref`; `source=url` para um tarball HTTPS com um
  SHA-256 obrigatório; ou `source=artifact` para um tarball enviado por outra execução do GitHub
  Actions. O workflow resolve o candidato para
  `package-under-test`, reutiliza o scheduler de release Docker E2E contra esse
  tarball e pode executar QA do Telegram contra o mesmo tarball com
  `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`. Quando as
  lanes Docker selecionadas incluem `published-upgrade-survivor`, o artefato
  de pacote é o candidato e `published_upgrade_survivor_baseline` seleciona
  a linha de base publicada. `update-restart-auth` usa o pacote candidato como
  tanto a CLI instalada quanto o package-under-test, para que ele exercite o caminho
  de reinicialização gerenciada do comando de atualização candidato.
  Exemplo: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Perfis comuns:
  - `smoke`: lanes de instalação/canal/agente, rede do gateway e recarregamento de configuração
  - `package`: lanes nativas do artefato para pacote/atualização/reinicialização/plugin sem OpenWebUI ou ClawHub live
  - `product`: perfil de pacote mais canais MCP, limpeza de cron/subagente,
    pesquisa na web da OpenAI e OpenWebUI
  - `full`: blocos do caminho de release Docker com OpenWebUI
  - `custom`: seleção exata de `docker_lanes` para uma reexecução focada
- Execute o workflow manual `CI` diretamente quando você só precisa de cobertura completa normal de CI
  para o candidato de release. Disparos manuais de CI ignoram o escopo de alterações
  e forçam os shards Linux Node, shards de plugins empacotados, contratos de canal,
  compatibilidade com Node 22, `check`, `check-additional`, smoke de build,
  verificações de docs, Python skills, Windows, macOS, Android e lanes de i18n da Control UI.
  Exemplo: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Execute `pnpm qa:otel:smoke` ao validar a telemetria de release. Ele exercita o
  QA-lab por meio de um receptor OTLP/HTTP local e verifica os nomes de spans de trace
  exportados, atributos limitados e redação de conteúdo/identificadores sem
  exigir Opik, Langfuse ou outro coletor externo.
- Execute `pnpm release:check` antes de todo release com tag
- Execute `OpenClaw Release Publish` para a sequência de publicação mutável depois que a
  tag existir. Dispare-o a partir de `release/YYYY.M.D` (ou `main` ao publicar uma
  tag acessível a partir de main), passe a tag de release e o `preflight_run_id`
  bem-sucedido do npm do OpenClaw, e mantenha o escopo padrão de publicação de plugins
  `all-publishable`, a menos que você esteja executando deliberadamente um reparo focado. O
  workflow serializa a publicação de plugin no npm, a publicação de plugin no ClawHub e a publicação do OpenClaw
  no npm para que o pacote principal não seja publicado antes de seus plugins
  externalizados.
- As verificações de release agora são executadas em um workflow manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` também executa a lane de paridade mock do QA Lab mais o perfil rápido
  live do Matrix e a lane de QA do Telegram antes da aprovação de release. As lanes live
  usam o ambiente `qa-live-shared`; o Telegram também usa leases de credenciais do Convex CI.
  Execute o workflow manual `QA-Lab - All Lanes` com
  `matrix_profile=all` e `matrix_shards=true` quando quiser todo o inventário de transporte,
  mídia e E2EE do Matrix em paralelo.
- A validação de runtime de instalação e upgrade entre sistemas operacionais faz parte do
  `OpenClaw Release Checks` público e do `Full Release Validation`, que chamam o
  workflow reutilizável
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` diretamente
- Essa divisão é intencional: manter o caminho real de release npm curto,
  determinístico e focado em artefatos, enquanto verificações live mais lentas permanecem em sua
  própria lane para que não atrasem nem bloqueiem a publicação
- Verificações de release que carregam segredos devem ser disparadas por meio de `Full Release
Validation` ou a partir do ref de workflow `main`/release para que a lógica do workflow e os
  segredos permaneçam controlados
- `OpenClaw Release Checks` aceita uma branch, tag ou SHA completo de commit, desde que
  o commit resolvido seja acessível a partir de uma branch ou tag de release do OpenClaw
- O preflight somente de validação de `OpenClaw NPM Release` também aceita o SHA completo atual
  de 40 caracteres do commit da branch do workflow sem exigir uma tag enviada
- Esse caminho de SHA é somente de validação e não pode ser promovido para uma publicação real
- No modo SHA, o workflow sintetiza `v<package.json version>` apenas para a
  verificação de metadados do pacote; a publicação real ainda exige uma tag real de release
- Ambos os workflows mantêm o caminho real de publicação e promoção em runners hospedados no GitHub,
  enquanto o caminho de validação não mutável pode usar os runners Linux maiores
  da Blacksmith
- Esse workflow executa
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando os segredos de workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- O preflight de release npm não aguarda mais a lane separada de verificações de release
- Execute `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou a tag beta/correção correspondente) antes da aprovação
- Após a publicação no npm, execute
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou a versão beta/correção correspondente) para verificar o caminho de instalação do registro
  publicado em um prefixo temporário novo
- Após uma publicação beta, execute `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  para verificar o onboarding do pacote instalado, a configuração do Telegram e E2E real do Telegram
  contra o pacote npm publicado usando o pool compartilhado de credenciais alugadas do Telegram.
  Execuções pontuais locais de mantenedores podem omitir as vars do Convex e passar as três
  credenciais env `OPENCLAW_QA_TELEGRAM_*` diretamente.
- Para executar o smoke beta completo pós-publicação a partir de uma máquina de mantenedor, use `pnpm release:beta-smoke -- --beta betaN`. O helper executa validação de atualização npm/fresh-target no Parallels, dispara `NPM Telegram Beta E2E`, faz polling da execução exata do workflow, baixa o artefato e imprime o relatório do Telegram.
- Mantenedores podem executar a mesma verificação pós-publicação a partir do GitHub Actions por meio do
  workflow manual `NPM Telegram Beta E2E`. Ele é intencionalmente somente manual e
  não é executado a cada merge.
- A automação de release dos mantenedores agora usa preflight e depois promoção:
  - a publicação real no npm deve passar um `preflight_run_id` npm bem-sucedido
  - a publicação real no npm deve ser disparada a partir da mesma branch `main` ou
    `release/YYYY.M.D` da execução de preflight bem-sucedida
  - releases npm estáveis usam `beta` por padrão
  - a publicação npm estável pode mirar `latest` explicitamente por meio da entrada do workflow
  - a mutação de dist-tag npm baseada em token agora vive em
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    por segurança, porque `npm dist-tag add` ainda precisa de `NPM_TOKEN`, enquanto o
    repositório público mantém publicação somente com OIDC
  - o `macOS Release` público é somente de validação; quando uma tag vive apenas em uma
    branch de release, mas o workflow é disparado a partir de `main`, defina
    `public_release_branch=release/YYYY.M.D`
  - a publicação privada real do mac deve passar por `preflight_run_id` e
    `validate_run_id` privados do mac bem-sucedidos
  - os caminhos reais de publicação promovem artefatos preparados em vez de recriá-los
    novamente
- Para releases estáveis de correção como `YYYY.M.D-N`, o verificador pós-publicação
  também verifica o mesmo caminho de upgrade com prefixo temporário de `YYYY.M.D` para `YYYY.M.D-N`
  para que correções de release não possam deixar silenciosamente instalações globais antigas no
  payload estável base
- O preflight de release npm falha fechado a menos que o tarball inclua tanto
  `dist/control-ui/index.html` quanto um payload não vazio em `dist/control-ui/assets/`
  para que não enviemos novamente um painel de navegador vazio
- A verificação pós-publicação também verifica que entrypoints de plugin publicados e
  metadados de pacote estejam presentes no layout instalado do registro. Um release que
  envia payloads de runtime de plugin ausentes falha no verificador pós-publicação e
  não pode ser promovido para `latest`.
- `pnpm test:install:smoke` também impõe o orçamento de `unpackedSize` do pack npm no
  tarball de atualização candidato, para que o e2e do instalador capture aumento acidental do pack
  antes do caminho de publicação de release
- Se o trabalho de release tocou no planejamento de CI, manifestos de timing de extensões ou
  matrizes de teste de extensões, regenere e revise as saídas de matriz
  `plugin-prerelease-extension-shard` pertencentes ao planner em
  `.github/workflows/plugin-prerelease.yml` antes da aprovação, para que as notas de release não
  descrevam um layout de CI obsoleto
- A prontidão de release estável do macOS também inclui as superfícies do atualizador:
  - o release do GitHub deve acabar com os `.zip`, `.dmg` e `.dSYM.zip` empacotados
  - `appcast.xml` em `main` deve apontar para o novo zip estável após a publicação
  - o app empacotado deve manter um bundle id não debug, uma URL de feed Sparkle
    não vazia e um `CFBundleVersion` igual ou acima do piso canônico de build do Sparkle
    para essa versão de release

## Caixas de teste de release

`Full Release Validation` é como operadores iniciam todos os testes de pré-release a partir de
um único ponto de entrada. Para uma comprovação de commit fixado em uma branch que muda rapidamente, use o
helper para que cada workflow filho seja executado a partir de uma branch temporária fixa no SHA
alvo:

```bash
pnpm ci:full-release --sha <full-sha>
```

O helper envia `release-ci/<sha>-...`, dispara `Full Release Validation`
a partir dessa branch com `ref=<sha>`, verifica que cada `headSha` de workflow filho
corresponde ao alvo e então exclui a branch temporária. Isso evita comprovar por acidente uma
execução filha de `main` mais recente.

Para validação de branch ou tag de release, execute-a a partir do ref de workflow confiável `main`
e passe a branch ou tag de release como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

O workflow resolve a ref de destino, despacha o `CI` manual com
`target_ref=<release-ref>`, despacha `OpenClaw Release Checks`, prepara um
artefato pai `release-package-under-test` para verificações voltadas a pacotes e
despacha o E2E autônomo de pacote do Telegram quando `release_profile=full` com
`rerun_group=all` ou quando `npm_telegram_package_spec` está definido. Em
seguida, `OpenClaw Release Checks` se desdobra em teste smoke de instalação,
verificações de lançamento cross-OS, cobertura live/E2E do caminho de lançamento
Docker quando o soak está habilitado, Package Acceptance com QA de pacote do
Telegram, paridade do QA Lab, Matrix live e Telegram live. Uma execução completa
só é aceitável quando o resumo de `Full Release Validation` mostra `normal_ci` e
`release_checks` como bem-sucedidos. No modo full/all, o filho `npm_telegram`
também precisa ser bem-sucedido; fora de full/all, ele é ignorado, a menos que
um `npm_telegram_package_spec` publicado tenha sido fornecido. O resumo final do
verificador inclui tabelas dos jobs mais lentos para cada execução filha, para
que o gerente de lançamento possa ver o caminho crítico atual sem baixar logs.
Consulte [Validação completa de lançamento](/pt-BR/reference/full-release-validation)
para ver a matriz completa de etapas, os nomes exatos dos jobs do workflow, as
diferenças entre os perfis stable e full, os artefatos e os identificadores de
reexecução focada.
Workflows filhos são despachados da ref confiável que executa
`Full Release Validation`, normalmente `--ref main`, mesmo quando a `ref` de
destino aponta para uma branch ou tag de lançamento mais antiga. Não há uma
entrada workflow-ref separada de Full Release Validation; escolha o harness
confiável escolhendo a ref de execução do workflow. Não use
`--ref main -f ref=<sha>` para prova de commit exato em `main` móvel; SHAs de
commit brutos não podem ser refs de dispatch de workflow, então use
`pnpm ci:full-release --sha <sha>` para criar a branch temporária fixada.

Use `release_profile` para selecionar a abrangência live/de provedor:

- `minimum`: caminho live e Docker mais rápido, crítico para lançamento, de OpenAI/core
- `stable`: minimum mais cobertura estável de provedor/backend para aprovação de lançamento
- `full`: stable mais cobertura ampla consultiva de provedor/mídia

Use `run_release_soak=true` com `stable` quando as faixas bloqueadoras de
lançamento estiverem verdes e você quiser a varredura exaustiva live/E2E, do
caminho de lançamento Docker e limitada de sobrevivência a upgrade publicado
antes da promoção. Essa varredura cobre os quatro pacotes estáveis mais recentes
mais as linhas de base fixadas `2026.4.23` e `2026.5.2`, além da cobertura mais
antiga `2026.4.15`, com linhas de base duplicadas removidas e cada linha de base
dividida em seu próprio job executor Docker. `full` implica
`run_release_soak=true`.

`OpenClaw Release Checks` usa a ref confiável do workflow para resolver a ref de
destino uma vez como `release-package-under-test` e reutiliza esse artefato nas
verificações cross-OS, Package Acceptance e Docker do caminho de lançamento
quando o soak é executado. Isso mantém todos os ambientes voltados a pacotes nos
mesmos bytes e evita builds repetidos de pacote. O smoke de instalação OpenAI
cross-OS usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando a variável do repo/org está
definida; caso contrário, usa `openai/gpt-5.4`, porque essa faixa está provando
instalação do pacote, integração inicial, inicialização do Gateway e uma rodada
de agente real, em vez de medir o modelo padrão mais lento. A matriz live mais
ampla de provedores continua sendo o lugar para cobertura específica de modelo.

Use estas variantes dependendo da etapa do lançamento:

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

Não use o guarda-chuva completo como a primeira reexecução após uma correção
focada. Se um ambiente falhar, use o workflow filho, job, faixa Docker, perfil
de pacote, provedor de modelo ou faixa de QA com falha para a próxima prova.
Execute o guarda-chuva completo novamente apenas quando a correção tiver mudado
a orquestração compartilhada de lançamento ou tornado obsoleta a evidência
anterior de todos os ambientes. O verificador final do guarda-chuva revalida os
ids registrados das execuções de workflows filhos; portanto, depois que um
workflow filho for reexecutado com sucesso, reexecute apenas o job pai
`Verify full validation` com falha.

Para recuperação limitada, passe `rerun_group` para o guarda-chuva. `all` é a
execução real de candidato de lançamento, `ci` executa apenas o filho de CI
normal, `plugin-prerelease` executa apenas o filho de plugin exclusivo de
lançamento, `release-checks` executa todos os ambientes de lançamento, e os
grupos de lançamento mais estreitos são `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` e `npm-telegram`.
Reexecuções focadas de `npm-telegram` exigem `npm_telegram_package_spec`;
execuções full/all com `release_profile=full` usam o artefato de pacote de
release-checks. Reexecuções cross-OS focadas podem adicionar
`cross_os_suite_filter=windows/packaged-upgrade` ou outro filtro de OS/suíte.
Falhas de QA em release-checks são consultivas; uma falha somente de QA não
bloqueia a validação de lançamento.

### Vitest

O ambiente Vitest é o workflow filho de `CI` manual. O CI manual ignora
intencionalmente o escopo por alterações e força o grafo normal de testes para o
candidato de lançamento: shards Linux Node, shards de plugins agrupados,
contratos de canal, compatibilidade com Node 22, `check`, `check-additional`,
smoke de build, verificações de docs, Skills Python, Windows, macOS, Android e
i18n da Control UI.

Use este ambiente para responder "a árvore de código-fonte passou pela suíte
normal completa de testes?" Ele não é igual à validação de produto do caminho de
lançamento. Evidências a manter:

- resumo de `Full Release Validation` mostrando a URL da execução de `CI` despachada
- execução de `CI` verde no SHA de destino exato
- nomes de shards com falha ou lentos dos jobs de CI ao investigar regressões
- artefatos de tempo do Vitest, como `.artifacts/vitest-shard-timings.json`, quando
  uma execução precisa de análise de desempenho

Execute o CI manual diretamente apenas quando o lançamento precisar de CI normal
determinístico, mas não dos ambientes Docker, QA Lab, live, cross-OS ou de
pacote:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

O ambiente Docker fica em `OpenClaw Release Checks` por meio de
`openclaw-live-and-e2e-checks-reusable.yml`, além do workflow `install-smoke` em
modo de lançamento. Ele valida o candidato de lançamento por meio de ambientes
Docker empacotados, em vez de apenas testes em nível de código-fonte.

A cobertura Docker de lançamento inclui:

- smoke completo de instalação com o smoke lento de instalação global Bun habilitado
- preparação/reutilização da imagem smoke do Dockerfile raiz por SHA de destino, com jobs de smoke QR,
  raiz/Gateway e instalador/Bun executando como shards separados de install-smoke
- faixas E2E do repositório
- partes Docker do caminho de lançamento: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` e `plugins-runtime-install-h`
- cobertura OpenWebUI dentro da parte `plugins-runtime-services` quando solicitada
- faixas divididas de instalação/desinstalação de plugins agrupados
  `bundled-plugin-install-uninstall-0` até
  `bundled-plugin-install-uninstall-23`
- suítes live/E2E de provedores e cobertura Docker de modelo live quando release checks
  incluem suítes live

Use artefatos Docker antes de reexecutar. O agendador do caminho de lançamento
envia `.artifacts/docker-tests/` com logs de faixas, `summary.json`,
`failures.json`, tempos de fases, JSON do plano do agendador e comandos de
reexecução. Para recuperação focada, use `docker_lanes=<lane[,lane]>` no
workflow reutilizável live/E2E em vez de reexecutar todas as partes de
lançamento. Os comandos de reexecução gerados incluem `package_artifact_run_id`
anterior e entradas de imagens Docker preparadas quando disponíveis, para que
uma faixa com falha possa reutilizar o mesmo tarball e as mesmas imagens GHCR.

### QA Lab

O ambiente QA Lab também faz parte de `OpenClaw Release Checks`. Ele é o gate de
lançamento de comportamento agentic e nível de canal, separado do Vitest e da
mecânica de pacotes Docker.

A cobertura de lançamento do QA Lab inclui:

- faixa de paridade mock comparando a faixa candidata OpenAI com a linha de base
  Opus 4.6 usando o pacote de paridade agentic
- perfil rápido de QA Matrix live usando o ambiente `qa-live-shared`
- faixa de QA Telegram live usando concessões de credenciais Convex CI
- `pnpm qa:otel:smoke` quando a telemetria de lançamento precisa de prova local explícita

Use este ambiente para responder "o lançamento se comporta corretamente em
cenários de QA e fluxos de canais live?" Mantenha as URLs de artefatos das
faixas de paridade, Matrix e Telegram ao aprovar o lançamento. A cobertura
Matrix completa continua disponível como uma execução manual fragmentada do
QA-Lab, em vez da faixa crítica padrão de lançamento.

### Pacote

O ambiente de pacote é o gate de produto instalável. Ele é respaldado por
`Package Acceptance` e pelo resolvedor
`scripts/resolve-openclaw-package-candidate.mjs`. O resolvedor normaliza um
candidato no tarball `package-under-test` consumido pelo Docker E2E, valida o
inventário do pacote, registra a versão do pacote e o SHA-256, e mantém a ref do
harness do workflow separada da ref de origem do pacote.

Fontes de candidato compatíveis:

- `source=npm`: `openclaw@beta`, `openclaw@latest` ou uma versão exata de lançamento do OpenClaw
- `source=ref`: empacota uma branch, tag ou SHA de commit completo `package_ref` confiável
  com o harness `workflow_ref` selecionado
- `source=url`: baixa um `.tgz` HTTPS com `package_sha256` obrigatório
- `source=artifact`: reutiliza um `.tgz` enviado por outra execução do GitHub Actions

`OpenClaw Release Checks` executa Package Acceptance com `source=artifact`, o
artefato de pacote de lançamento preparado, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance mantém migração, atualização,
reinicialização de atualização com autenticação configurada, limpeza de
dependências obsoletas de plugins, fixtures de plugins offline, atualização de
plugins e QA de pacote Telegram contra o mesmo tarball resolvido. Verificações
bloqueadoras de lançamento usam a linha de base padrão do pacote publicado mais
recente; `run_release_soak=true` ou `release_profile=full` expande para todas as
linhas de base estáveis publicadas no npm de `2026.4.23` até `latest`, além de
fixtures de problemas reportados. Use Package Acceptance com `source=npm` para
um candidato já lançado, ou `source=ref`/`source=artifact` para um tarball npm
local respaldado por SHA antes da publicação. Ele é o substituto nativo do
GitHub para a maior parte da cobertura de pacote/atualização que antes exigia
Parallels. Verificações de lançamento cross-OS ainda importam para integração
inicial, instalador e comportamento de plataforma específicos de OS, mas a
validação de produto de pacote/atualização deve preferir Package Acceptance.

A checklist canônica para validação de atualizações e plugins é
[Testando atualizações e plugins](/pt-BR/help/testing-updates-plugins). Use-a ao
decidir qual faixa local, Docker, Package Acceptance ou release-check comprova
uma instalação/atualização de plugin, limpeza do doctor ou mudança de migração
de pacote publicado. A migração exaustiva de atualizações publicadas de todos os
pacotes estáveis `2026.4.23+` é um workflow manual `Update Migration` separado,
não parte do Full Release CI.

A tolerância legada de aceitação de pacote é intencionalmente limitada no tempo. Pacotes até
`2026.4.25` podem usar o caminho de compatibilidade para lacunas de metadados já publicadas
no npm: entradas privadas de inventário de QA ausentes do tarball, ausência de
`gateway install --wrapper`, arquivos de patch ausentes na fixture git derivada do tarball,
ausência de `update.channel` persistido, locais legados de registro de instalação de Plugin,
ausência de persistência de registro de instalação do marketplace e migração de metadados de
configuração durante `plugins update`. O pacote `2026.4.26` publicado pode emitir aviso
para arquivos locais de carimbo de metadados de build que já foram distribuídos. Pacotes posteriores
devem satisfazer os contratos modernos de pacote; essas mesmas lacunas falham na validação de
lançamento.

Use perfis mais amplos de Aceitação de Pacote quando a pergunta de lançamento for sobre um
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

- `smoke`: rotas rápidas de instalação de pacote/canal/agente, rede do Gateway e
  recarregamento de configuração
- `package`: contratos de pacote de instalação/atualização/reinicialização/Plugin sem ClawHub
  ao vivo; este é o padrão de verificação de lançamento
- `product`: `package` mais canais MCP, limpeza de cron/subagente, pesquisa web da OpenAI
  e OpenWebUI
- `full`: blocos de caminho de lançamento Docker com OpenWebUI
- `custom`: lista exata de `docker_lanes` para reexecuções focadas

Para prova do Telegram de candidato a pacote, habilite `telegram_mode=mock-openai` ou
`telegram_mode=live-frontier` na Aceitação de Pacote. O workflow passa o tarball
`package-under-test` resolvido para a rota do Telegram; o workflow autônomo do
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
6. Disparar `OpenClaw NPM Release` com a tag de lançamento, dist-tag do npm e
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

Use os workflows de nível inferior `Plugin NPM Release` e `Plugin ClawHub Release`
apenas para trabalho focado de reparo ou republicação. Para um reparo de Plugin selecionado, passe
`plugin_publish_scope=selected` e `plugins=@openclaw/name` para
`OpenClaw Release Publish`, ou dispare o workflow filho diretamente quando o
pacote OpenClaw não deve ser publicado.

## Entradas do workflow NPM

`OpenClaw NPM Release` aceita estas entradas controladas pelo operador:

- `tag`: tag de lançamento obrigatória, como `v2026.4.2`, `v2026.4.2-1` ou
  `v2026.4.2-beta.1`; quando `preflight_only=true`, ela também pode ser o SHA de commit
  completo de 40 caracteres do branch de workflow atual para preflight somente de validação
- `preflight_only`: `true` apenas para validação/build/pacote, `false` para o
  caminho real de publicação
- `preflight_run_id`: obrigatório no caminho real de publicação para que o workflow reutilize
  o tarball preparado da execução de preflight bem-sucedida
- `npm_dist_tag`: tag de destino do npm para o caminho de publicação; o padrão é `beta`

`OpenClaw Release Publish` aceita estas entradas controladas pelo operador:

- `tag`: tag de lançamento obrigatória; já deve existir
- `preflight_run_id`: id da execução de preflight bem-sucedida de `OpenClaw NPM Release`;
  obrigatório quando `publish_openclaw_npm=true`
- `npm_dist_tag`: tag de destino do npm para o pacote OpenClaw
- `plugin_publish_scope`: o padrão é `all-publishable`; use `selected` somente
  para trabalho focado de reparo
- `plugins`: nomes de pacotes `@openclaw/*` separados por vírgula quando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: o padrão é `true`; defina `false` somente ao usar o
  workflow como orquestrador de reparo apenas de Plugins

`OpenClaw Release Checks` aceita estas entradas controladas pelo operador:

- `ref`: branch, tag ou SHA de commit completo a validar. Verificações que contêm segredos
  exigem que o commit resolvido seja alcançável a partir de um branch OpenClaw ou
  tag de lançamento.
- `run_release_soak`: habilita soak exaustivo ao vivo/E2E, caminho de lançamento Docker e
  upgrade-survivor de todos desde a origem em verificações de lançamento estável/padrão. Ele é forçado
  por `release_profile=full`.

Regras:

- Tags estáveis e de correção podem publicar em `beta` ou `latest`
- Tags beta de pré-lançamento podem publicar apenas em `beta`
- Para `OpenClaw NPM Release`, entrada de SHA de commit completo é permitida somente quando
  `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` são sempre
  somente validação
- O caminho real de publicação deve usar o mesmo `npm_dist_tag` usado durante o preflight;
  o workflow verifica esses metadados antes que a publicação continue

## Sequência de lançamento npm estável

Ao preparar um lançamento npm estável:

1. Execute `OpenClaw NPM Release` com `preflight_only=true`
   - Antes de uma tag existir, você pode usar o SHA de commit completo do branch de workflow atual
     para uma execução simulada somente de validação do workflow de preflight
2. Escolha `npm_dist_tag=beta` para o fluxo normal beta primeiro, ou `latest` somente
   quando você quiser intencionalmente uma publicação estável direta
3. Execute `Full Release Validation` no branch de lançamento, na tag de lançamento ou no SHA de commit completo
   quando quiser CI normal mais cobertura de cache de prompt ao vivo, Docker, QA Lab,
   Matrix e Telegram em um único workflow manual
4. Se você intencionalmente precisa apenas do grafo de teste normal determinístico, execute o
   workflow manual `CI` na ref de lançamento
5. Salve o `preflight_run_id` bem-sucedido
6. Execute `OpenClaw Release Publish` com a mesma `tag`, o mesmo `npm_dist_tag`
   e o `preflight_run_id` salvo; ele publica Plugins externalizados no npm
   e no ClawHub antes de promover o pacote npm OpenClaw
7. Se o lançamento entrou em `beta`, use o workflow privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover essa versão estável de `beta` para `latest`
8. Se o lançamento publicou intencionalmente direto em `latest` e `beta`
   deve seguir imediatamente o mesmo build estável, use o mesmo workflow privado
   para apontar ambas as dist-tags para a versão estável, ou deixe a sincronização agendada
   de autocorreção mover `beta` depois

A mutação de dist-tag fica no repositório privado por segurança porque ainda
exige `NPM_TOKEN`, enquanto o repositório público mantém publicação apenas por OIDC.

Isso mantém tanto o caminho de publicação direta quanto o caminho de promoção beta primeiro
documentados e visíveis ao operador.

Se um mantenedor precisar recorrer à autenticação npm local, execute quaisquer comandos da CLI
do 1Password (`op`) somente dentro de uma sessão tmux dedicada. Não chame `op`
diretamente pelo shell principal do agente; mantê-lo dentro do tmux torna prompts,
alertas e tratamento de OTP observáveis e evita alertas repetidos no host.

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

Mantenedores usam a documentação privada de lançamento em
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
para o runbook real.

## Relacionado

- [Canais de lançamento](/pt-BR/install/development-channels)
