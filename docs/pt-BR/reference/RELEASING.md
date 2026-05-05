---
read_when:
    - Procurando definições de canais públicos de lançamento
    - Executando validação de release ou aceitação de pacote
    - Procurando nomenclatura e cadência de versões
summary: Faixas de lançamento, checklist do operador, caixas de validação, nomenclatura de versões e cadência
title: Política de lançamento
x-i18n:
    generated_at: "2026-05-05T01:49:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41886d3bb2f970e6a86944e5ff207b1b29b1b64b1f234d45f626fed19cf032b3
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw tem três canais públicos de lançamento:

- stable: lançamentos com tag que publicam no npm `beta` por padrão, ou no npm `latest` quando solicitado explicitamente
- beta: tags de pré-lançamento que publicam no npm `beta`
- dev: o ponto mais recente em movimento de `main`

## Nomenclatura de versões

- Versão de lançamento estável: `YYYY.M.D`
  - Tag do Git: `vYYYY.M.D`
- Versão de lançamento estável de correção: `YYYY.M.D-N`
  - Tag do Git: `vYYYY.M.D-N`
- Versão beta de pré-lançamento: `YYYY.M.D-beta.N`
  - Tag do Git: `vYYYY.M.D-beta.N`
- Não adicione zeros à esquerda ao mês ou ao dia
- `latest` significa a versão estável atual promovida no npm
- `beta` significa o destino atual de instalação beta
- Lançamentos estáveis e lançamentos estáveis de correção publicam no npm `beta` por padrão; operadores de lançamento podem direcionar explicitamente para `latest` ou promover uma compilação beta validada posteriormente
- Todo lançamento estável do OpenClaw entrega o pacote npm e o app para macOS juntos;
  lançamentos beta normalmente validam e publicam primeiro o caminho npm/pacote, com
  compilação/assinatura/notarização do app para Mac reservadas para stable, salvo solicitação explícita

## Cadência de lançamentos

- Lançamentos seguem primeiro para beta
- Stable vem somente depois que o beta mais recente é validado
- Mantenedores normalmente criam lançamentos a partir de uma branch `release/YYYY.M.D` criada
  a partir da `main` atual, para que a validação e as correções de lançamento não bloqueiem novos
  desenvolvimentos em `main`
- Se uma tag beta tiver sido enviada ou publicada e precisar de correção, os mantenedores criam
  a próxima tag `-beta.N` em vez de excluir ou recriar a tag beta antiga
- O procedimento detalhado de lançamento, aprovações, credenciais e notas de recuperação são
  exclusivos para mantenedores

## Lista de verificação do operador de lançamento

Esta lista de verificação é o formato público do fluxo de lançamento. Credenciais privadas,
assinatura, notarização, recuperação de dist-tag e detalhes de rollback de emergência ficam no
runbook de lançamento exclusivo para mantenedores.

1. Comece pela `main` atual: baixe as alterações mais recentes, confirme que o commit de destino foi enviado
   e confirme que o CI atual da `main` está verde o suficiente para criar uma branch a partir dela.
2. Reescreva a seção superior de `CHANGELOG.md` a partir do histórico real de commits com
   `/changelog`, mantenha as entradas voltadas ao usuário, faça commit, envie, e faça rebase/pull
   mais uma vez antes de criar a branch.
3. Revise os registros de compatibilidade de lançamento em
   `src/plugins/compat/registry.ts` e
   `src/commands/doctor/shared/deprecation-compat.ts`. Remova compatibilidade expirada
   somente quando o caminho de atualização continuar coberto, ou registre por que ela está
   sendo mantida intencionalmente.
4. Crie `release/YYYY.M.D` a partir da `main` atual; não faça o trabalho normal de lançamento
   diretamente em `main`.
5. Atualize todos os locais de versão necessários para a tag pretendida, execute
   `pnpm plugins:sync` para que os pacotes de Plugin publicáveis compartilhem a versão de lançamento
   e os metadados de compatibilidade, depois execute o preflight determinístico local:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` e
   `pnpm release:check`.
6. Execute `OpenClaw NPM Release` com `preflight_only=true`. Antes de uma tag existir,
   um SHA completo de 40 caracteres da branch de lançamento é permitido para preflight
   apenas de validação. Salve o `preflight_run_id` bem-sucedido.
7. Inicie todos os testes de pré-lançamento com `Full Release Validation` para a
   branch de lançamento, tag ou SHA de commit completo. Este é o único ponto de entrada manual
   para as quatro grandes caixas de teste de lançamento: Vitest, Docker, QA Lab e Package.
8. Se a validação falhar, corrija na branch de lançamento e execute novamente o menor
   arquivo, canal, job de workflow, perfil de pacote, provedor ou allowlist de modelo com falha que
   comprove a correção. Execute novamente o guarda-chuva completo somente quando a superfície alterada tornar
   as evidências anteriores obsoletas.
9. Para beta, crie a tag `vYYYY.M.D-beta.N` e execute `OpenClaw Release Publish` a partir
   da branch `release/YYYY.M.D` correspondente. Ele verifica `pnpm plugins:sync:check`,
   publica primeiro todos os pacotes de Plugin publicáveis no npm, publica o mesmo
   conjunto no ClawHub em seguida como tarballs ClawPack npm-pack e então promove o
   artefato de preflight npm preparado do OpenClaw com a dist-tag correspondente. Após
   publicar, execute a aceitação de pacote pós-publicação contra o pacote
   `openclaw@YYYY.M.D-beta.N` ou `openclaw@beta` publicado. Se um pré-lançamento enviado ou publicado precisar de correção,
   crie o próximo número de pré-lançamento correspondente; não exclua nem reescreva o pré-lançamento antigo.
10. Para stable, continue somente depois que o beta validado ou candidato a lançamento tiver as
    evidências de validação exigidas. A publicação npm stable também passa por
    `OpenClaw Release Publish`, reutilizando o artefato de preflight bem-sucedido via
    `preflight_run_id`; a prontidão do lançamento stable para macOS também exige o
    `.zip`, `.dmg`, `.dSYM.zip` empacotados e o `appcast.xml` atualizado em `main`.
11. Após publicar, execute o verificador npm pós-publicação, o E2E opcional do Telegram
    standalone publicado no npm quando você precisar de comprovação de canal pós-publicação,
    a promoção de dist-tag quando necessário, notas de release/pré-release do GitHub a partir da
    seção completa correspondente de `CHANGELOG.md` e as etapas de anúncio do lançamento.

## Preflight de lançamento

- Execute `pnpm check:test-types` antes do preflight de release para que o TypeScript de teste permaneça coberto fora do gate local mais rápido `pnpm check`
- Execute `pnpm check:architecture` antes do preflight de release para que as verificações mais amplas de ciclos de importação e limites de arquitetura fiquem verdes fora do gate local mais rápido
- Execute `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que os artefatos de release esperados em `dist/*` e o bundle da Control UI existam para a etapa de validação do pacote
- Execute `pnpm plugins:sync` depois do bump da versão raiz e antes de criar a tag. Ele atualiza as versões de pacotes de plugins publicáveis, os metadados de compatibilidade de peer/API do OpenClaw, os metadados de build e os stubs de changelog dos plugins para corresponder à versão de release do núcleo. `pnpm plugins:sync:check` é a proteção de release não mutável; o workflow de publicação falha antes de qualquer mutação de registry se essa etapa tiver sido esquecida.
- Execute o workflow manual `Full Release Validation` antes da aprovação do release para iniciar todas as caixas de teste pré-release a partir de um único ponto de entrada. Ele aceita um branch, tag ou SHA completo de commit, dispara `CI` manual e dispara `OpenClaw Release Checks` para install smoke, aceitação de pacote, verificações de pacote entre sistemas operacionais, paridade do QA Lab, Matrix e lanes do Telegram. Execuções estáveis/padrão mantêm o soak exaustivo live/E2E e do caminho de release do Docker atrás de `run_release_soak=true`; `release_profile=full` força o soak. Com `release_profile=full` e `rerun_group=all`, ele também executa E2E de pacote do Telegram contra o artefato `release-package-under-test` das verificações de release. Forneça `npm_telegram_package_spec` após a publicação quando o mesmo E2E do Telegram também deve provar o pacote npm publicado. Forneça `package_acceptance_package_spec` após a publicação quando Package Acceptance deve executar sua matriz de pacote/atualização contra o pacote npm enviado em vez do artefato criado a partir do SHA. Forneça `evidence_package_spec` quando o relatório de evidências privado deve provar que a validação corresponde a um pacote npm publicado sem forçar o E2E do Telegram. Exemplo: `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Execute o workflow manual `Package Acceptance` quando quiser uma prova por canal lateral para um candidato de pacote enquanto o trabalho de release continua. Use `source=npm` para `openclaw@beta`, `openclaw@latest` ou uma versão exata de release; `source=ref` para empacotar um branch/tag/SHA confiável de `package_ref` com o harness atual de `workflow_ref`; `source=url` para um tarball HTTPS com SHA-256 obrigatório; ou `source=artifact` para um tarball enviado por outra execução do GitHub Actions. O workflow resolve o candidato para `package-under-test`, reutiliza o agendador de release Docker E2E contra esse tarball e pode executar QA do Telegram contra o mesmo tarball com `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`. Quando as lanes Docker selecionadas incluem `published-upgrade-survivor`, o artefato de pacote é o candidato e `published_upgrade_survivor_baseline` seleciona a baseline publicada.
  Exemplo: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Perfis comuns:
  - `smoke`: lanes de instalação/canal/agente, rede do Gateway e recarregamento de configuração
  - `package`: lanes nativas de artefato para pacote/atualização/plugin sem OpenWebUI ou ClawHub live
  - `product`: perfil de pacote mais canais MCP, limpeza de cron/subagente, busca na web da OpenAI e OpenWebUI
  - `full`: partes do caminho de release Docker com OpenWebUI
  - `custom`: seleção exata de `docker_lanes` para uma reexecução focada
- Execute o workflow manual `CI` diretamente quando precisar apenas da cobertura completa normal de CI para o candidato de release. Disparos manuais de CI ignoram o escopo por alterações e forçam as shards Linux Node, shards de plugins empacotados, contratos de canais, compatibilidade com Node 22, `check`, `check-additional`, smoke de build, verificações de docs, Skills Python, Windows, macOS, Android e lanes de i18n da Control UI.
  Exemplo: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Execute `pnpm qa:otel:smoke` ao validar telemetria de release. Ele exercita o QA-lab por meio de um receptor OTLP/HTTP local e verifica os nomes de spans de trace exportados, atributos limitados e redação de conteúdo/identificador sem exigir Opik, Langfuse ou outro coletor externo.
- Execute `pnpm release:check` antes de cada release com tag
- Execute `OpenClaw Release Publish` para a sequência mutável de publicação depois que a tag existir. Dispare-o a partir de `release/YYYY.M.D` (ou `main` ao publicar uma tag alcançável por main), passe a tag de release e o `preflight_run_id` bem-sucedido do npm do OpenClaw, e mantenha o escopo padrão de publicação de plugins `all-publishable`, a menos que esteja executando deliberadamente um reparo focado. O workflow serializa a publicação npm de plugins, a publicação de plugins no ClawHub e a publicação npm do OpenClaw para que o pacote central não seja publicado antes de seus plugins externalizados.
- As verificações de release agora são executadas em um workflow manual separado: `OpenClaw Release Checks`
- `OpenClaw Release Checks` também executa a lane de paridade mock do QA Lab, além do perfil rápido live do Matrix e da lane de QA do Telegram antes da aprovação do release. As lanes live usam o ambiente `qa-live-shared`; o Telegram também usa leases de credenciais de CI do Convex. Execute o workflow manual `QA-Lab - All Lanes` com `matrix_profile=all` e `matrix_shards=true` quando quiser o inventário completo de transporte, mídia e E2EE do Matrix em paralelo.
- A validação de runtime de instalação e upgrade entre sistemas operacionais faz parte dos workflows públicos `OpenClaw Release Checks` e `Full Release Validation`, que chamam diretamente o workflow reutilizável `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Essa divisão é intencional: manter o caminho real de release npm curto, determinístico e focado em artefatos, enquanto verificações live mais lentas permanecem em sua própria lane para que não atrasem nem bloqueiem a publicação
- Verificações de release que carregam segredos devem ser disparadas por meio de `Full Release Validation` ou a partir da ref de workflow `main`/release para que a lógica do workflow e os segredos permaneçam controlados
- `OpenClaw Release Checks` aceita um branch, tag ou SHA completo de commit desde que o commit resolvido seja alcançável a partir de um branch do OpenClaw ou tag de release
- O preflight somente de validação de `OpenClaw NPM Release` também aceita o SHA completo atual de 40 caracteres do commit do branch de workflow sem exigir uma tag enviada
- Esse caminho de SHA é somente de validação e não pode ser promovido para uma publicação real
- No modo SHA, o workflow sintetiza `v<package.json version>` apenas para a verificação de metadados do pacote; a publicação real ainda exige uma tag de release real
- Ambos os workflows mantêm o caminho real de publicação e promoção em runners hospedados pelo GitHub, enquanto o caminho de validação não mutável pode usar os runners Linux maiores da Blacksmith
- Esse workflow executa `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` usando os segredos de workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- O preflight de release npm não espera mais pela lane separada de verificações de release
- Execute `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts` (ou a tag beta/correção correspondente) antes da aprovação
- Após a publicação npm, execute `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D` (ou a versão beta/correção correspondente) para verificar o caminho de instalação no registry publicado em um prefixo temporário novo
- Após uma publicação beta, execute `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` para verificar onboarding do pacote instalado, configuração do Telegram e E2E real do Telegram contra o pacote npm publicado usando o pool compartilhado de credenciais alugadas do Telegram. Execuções pontuais locais de mantenedores podem omitir as vars do Convex e passar diretamente as três credenciais de env `OPENCLAW_QA_TELEGRAM_*`.
- Para executar o smoke beta completo pós-publicação a partir da máquina de um mantenedor, use `pnpm release:beta-smoke -- --beta betaN`. O helper executa validação de atualização npm/fresh-target no Parallels, dispara `NPM Telegram Beta E2E`, faz polling da execução exata do workflow, baixa o artefato e imprime o relatório do Telegram.
- Mantenedores podem executar a mesma verificação pós-publicação a partir do GitHub Actions por meio do workflow manual `NPM Telegram Beta E2E`. Ele é intencionalmente apenas manual e não executa a cada merge.
- A automação de release dos mantenedores agora usa preflight-then-promote:
  - a publicação npm real deve passar por um `preflight_run_id` npm bem-sucedido
  - a publicação npm real deve ser disparada a partir do mesmo branch `main` ou `release/YYYY.M.D` da execução de preflight bem-sucedida
  - releases npm estáveis usam `beta` por padrão
  - a publicação npm estável pode mirar explicitamente `latest` via input do workflow
  - a mutação de dist-tag npm baseada em token agora fica em `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` por segurança, porque `npm dist-tag add` ainda precisa de `NPM_TOKEN`, enquanto o repositório público mantém publicação somente por OIDC
  - `macOS Release` público é somente de validação; quando uma tag existe apenas em um branch de release, mas o workflow é disparado a partir de `main`, defina `public_release_branch=release/YYYY.M.D`
  - a publicação privada real para mac deve passar por `preflight_run_id` e `validate_run_id` privados de mac bem-sucedidos
  - os caminhos reais de publicação promovem artefatos preparados em vez de reconstruí-los novamente
- Para releases estáveis de correção como `YYYY.M.D-N`, o verificador pós-publicação também verifica o mesmo caminho de upgrade em prefixo temporário de `YYYY.M.D` para `YYYY.M.D-N`, para que correções de release não deixem silenciosamente instalações globais antigas no payload estável base
- O preflight de release npm falha fechado a menos que o tarball inclua tanto `dist/control-ui/index.html` quanto um payload não vazio em `dist/control-ui/assets/`, para que não enviemos novamente um dashboard de navegador vazio
- A verificação pós-publicação também verifica que entrypoints de plugins publicados e metadados de pacote estão presentes no layout instalado do registry. Um release que envia payloads de runtime de plugins ausentes falha no verificador pós-publicação e não pode ser promovido para `latest`.
- `pnpm test:install:smoke` também impõe o orçamento de `unpackedSize` do pacote npm no tarball candidato de atualização, para que o e2e do instalador capture bloat acidental de pacote antes do caminho de publicação do release
- Se o trabalho de release tocou planejamento de CI, manifests de timing de extensões ou matrizes de teste de extensões, regenere e revise as saídas de matriz `plugin-prerelease-extension-shard` pertencentes ao planner em `.github/workflows/plugin-prerelease.yml` antes da aprovação, para que as notas de release não descrevam um layout de CI obsoleto
- A prontidão de release estável para macOS também inclui as superfícies de atualizador:
  - o release do GitHub deve terminar com os pacotes `.zip`, `.dmg` e `.dSYM.zip`
  - `appcast.xml` em `main` deve apontar para o novo zip estável após a publicação
  - o app empacotado deve manter um bundle id não debug, uma URL de feed Sparkle não vazia e um `CFBundleVersion` igual ou superior ao piso canônico de build do Sparkle para essa versão de release

## Caixas de teste de release

`Full Release Validation` é como operadores iniciam todos os testes pré-release a partir de um único ponto de entrada. Para uma prova de commit fixado em um branch que se move rapidamente, use o helper para que cada workflow filho execute a partir de um branch temporário fixado no SHA alvo:

```bash
pnpm ci:full-release --sha <full-sha>
```

O helper envia `release-ci/<sha>-...`, dispara `Full Release Validation` a partir desse branch com `ref=<sha>`, verifica que cada `headSha` de workflow filho corresponde ao alvo e então exclui o branch temporário. Isso evita provar acidentalmente uma execução filha de `main` mais nova.

Para validação de branch de release ou tag, execute-a a partir da ref confiável de workflow `main` e passe o branch de release ou tag como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

O workflow resolve a ref de destino, dispara o `CI` manual com
`target_ref=<release-ref>`, dispara `OpenClaw Release Checks`, prepara um
artefato pai `release-package-under-test` para verificações voltadas a pacote e
dispara o E2E autônomo do pacote Telegram quando `release_profile=full` com
`rerun_group=all` ou quando `npm_telegram_package_spec` está definido. `OpenClaw Release
Checks` então distribui para install smoke, verificações de release entre SOs, cobertura live/E2E Docker
do caminho de release quando o soak está habilitado, Package Acceptance com QA do pacote Telegram, paridade QA Lab, Matrix live e Telegram live. Uma execução completa só é aceitável quando o
resumo de `Full Release Validation`
mostra `normal_ci` e `release_checks` como bem-sucedidos. No modo full/all,
o filho `npm_telegram` também deve ser bem-sucedido; fora de full/all, ele é ignorado
a menos que um `npm_telegram_package_spec` publicado tenha sido fornecido. O resumo final do
verificador inclui tabelas dos jobs mais lentos para cada execução filha, para que o gerente de release
possa ver o caminho crítico atual sem baixar logs.
Consulte [Validação completa de release](/pt-BR/reference/full-release-validation) para a
matriz completa de etapas, os nomes exatos dos jobs do workflow, diferenças entre perfis stable e full,
artefatos e identificadores de reexecução focada.
Workflows filhos são disparados a partir da ref confiável que executa `Full Release
Validation`, normalmente `--ref main`, mesmo quando a `ref` de destino aponta para uma
branch ou tag de release mais antiga. Não há uma entrada separada de ref do workflow Full Release Validation;
escolha o harness confiável escolhendo a ref da execução do workflow.
Não use `--ref main -f ref=<sha>` para prova de commit exato em `main` móvel;
SHAs brutos de commit não podem ser refs de dispatch de workflow, então use
`pnpm ci:full-release --sha <sha>` para criar a branch temporária fixada.

Use `release_profile` para selecionar a abrangência live/provedor:

- `minimum`: caminho Docker e live OpenAI/core crítico de release mais rápido
- `stable`: minimum mais cobertura estável de provedor/backend para aprovação de release
- `full`: stable mais cobertura ampla de provedor/mídia consultiva

Use `run_release_soak=true` com `stable` quando as lanes bloqueantes de release estiverem
verdes e você quiser a varredura exaustiva live/E2E, do caminho de release Docker e
upgrade-survivor all-since-2026.4.23 antes da promoção. `full` implica
`run_release_soak=true`.

`OpenClaw Release Checks` usa a ref confiável do workflow para resolver a ref de destino
uma vez como `release-package-under-test` e reutiliza esse artefato em verificações entre SOs,
Package Acceptance e verificações Docker do caminho de release quando o soak executa. Isso mantém
todas as máquinas voltadas a pacote nos mesmos bytes e evita builds de pacote repetidos.
O install smoke OpenAI entre SOs usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando a
variável de repo/org está definida; caso contrário, `openai/gpt-5.4`, porque esta lane está
provando instalação do pacote, onboarding, inicialização do Gateway e uma rodada de agente live,
em vez de comparar o modelo padrão mais lento. A matriz live de provedores mais ampla
continua sendo o lugar para cobertura específica de modelo.

Use estas variantes dependendo da etapa de release:

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

Não use o guarda-chuva completo como a primeira reexecução após uma correção focada. Se uma máquina
falhar, use o workflow filho, job, lane Docker, perfil de pacote, provedor de modelo
ou lane QA que falhou para a próxima prova. Execute o guarda-chuva completo novamente somente quando
a correção alterou a orquestração de release compartilhada ou tornou obsoleta a evidência anterior
de todas as máquinas. O verificador final do guarda-chuva verifica novamente os ids registrados das execuções de workflow
filhas, então, depois que um workflow filho for reexecutado com sucesso, reexecute somente o job pai
`Verify full validation` que falhou.

Para recuperação delimitada, passe `rerun_group` ao guarda-chuva. `all` é a execução real
do candidato a release, `ci` executa somente o filho de CI normal, `plugin-prerelease`
executa somente o filho de Plugin exclusivo de release, `release-checks` executa todas as máquinas de release,
e os grupos de release mais estreitos são `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` e `npm-telegram`.
Reexecuções focadas de `npm-telegram` exigem `npm_telegram_package_spec`; execuções full/all
com `release_profile=full` usam o artefato de pacote de release-checks. Reexecuções focadas
entre SOs podem adicionar `cross_os_suite_filter=windows/packaged-upgrade` ou
outro filtro de SO/suíte. Falhas QA de release-checks são consultivas; uma falha somente em QA
não bloqueia a validação de release.

### Vitest

A máquina Vitest é o workflow filho `CI` manual. O CI manual intencionalmente
ignora o escopo de alterações e força o grafo de testes normal para o candidato a release:
shards Linux Node, shards de Plugins empacotados, contratos de canal, compatibilidade Node 22,
`check`, `check-additional`, build smoke, verificações de docs, Skills Python, Windows, macOS, Android e i18n da Control UI.

Use esta máquina para responder "a árvore de código-fonte passou na suíte normal completa de testes?"
Ela não é o mesmo que validação de produto no caminho de release. Evidências a manter:

- resumo de `Full Release Validation` mostrando a URL da execução de `CI` disparada
- execução de `CI` verde no SHA de destino exato
- nomes de shards com falha ou lentos dos jobs de CI ao investigar regressões
- artefatos de temporização do Vitest, como `.artifacts/vitest-shard-timings.json`, quando
  uma execução precisa de análise de desempenho

Execute o CI manual diretamente somente quando o release precisar de CI normal determinístico, mas
não das máquinas Docker, QA Lab, live, entre SOs ou de pacote:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

A máquina Docker vive em `OpenClaw Release Checks` por meio de
`openclaw-live-and-e2e-checks-reusable.yml`, além do workflow `install-smoke`
em modo release. Ela valida o candidato a release por meio de ambientes Docker
empacotados, em vez de apenas testes em nível de código-fonte.

A cobertura Docker de release inclui:

- install smoke completo com o smoke de instalação global Bun lento habilitado
- preparação/reutilização de imagem smoke do Dockerfile raiz por SHA de destino, com jobs de QR,
  root/gateway e installer/Bun smoke executando como shards install-smoke separados
- lanes E2E de repositório
- chunks Docker de caminho de release: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` e `plugins-runtime-install-h`
- cobertura OpenWebUI dentro do chunk `plugins-runtime-services` quando solicitada
- lanes divididas de instalação/desinstalação de Plugin empacotado
  `bundled-plugin-install-uninstall-0` até
  `bundled-plugin-install-uninstall-23`
- suítes live/E2E de provedores e cobertura de modelo Docker live quando release checks
  incluem suítes live

Use artefatos Docker antes de reexecutar. O agendador de caminho de release envia
`.artifacts/docker-tests/` com logs de lane, `summary.json`, `failures.json`,
temporizações de fase, JSON do plano do agendador e comandos de reexecução. Para recuperação focada,
use `docker_lanes=<lane[,lane]>` no workflow live/E2E reutilizável em vez de
reexecutar todos os chunks de release. Comandos de reexecução gerados incluem
`package_artifact_run_id` anterior e entradas de imagem Docker preparadas quando disponíveis, para que uma
lane com falha possa reutilizar o mesmo tarball e as imagens GHCR.

### QA Lab

A máquina QA Lab também faz parte de `OpenClaw Release Checks`. Ela é o gate de release de
comportamento agêntico e em nível de canal, separado da mecânica de pacote Vitest e Docker.

A cobertura QA Lab de release inclui:

- lane de paridade mock comparando a lane candidata OpenAI contra a linha de base Opus 4.6
  usando o pacote de paridade agêntica
- perfil QA Matrix live rápido usando o ambiente `qa-live-shared`
- lane QA Telegram live usando leases de credenciais CI do Convex
- `pnpm qa:otel:smoke` quando a telemetria de release precisa de prova local explícita

Use esta máquina para responder "o release se comporta corretamente em cenários QA e
fluxos de canais live?" Mantenha as URLs de artefatos das lanes de paridade, Matrix e Telegram
ao aprovar o release. A cobertura Matrix completa continua disponível como uma execução QA-Lab
manual em shards, em vez da lane padrão crítica de release.

### Pacote

A máquina Package é o gate do produto instalável. Ela é respaldada por
`Package Acceptance` e pelo resolvedor
`scripts/resolve-openclaw-package-candidate.mjs`. O resolvedor normaliza um
candidato no tarball `package-under-test` consumido pelo Docker E2E, valida
o inventário do pacote, registra a versão do pacote e SHA-256 e mantém a
ref do harness do workflow separada da ref de origem do pacote.

Fontes de candidato compatíveis:

- `source=npm`: `openclaw@beta`, `openclaw@latest` ou uma versão exata de release do OpenClaw
- `source=ref`: empacotar uma branch, tag ou SHA completo de commit `package_ref` confiável
  com o harness `workflow_ref` selecionado
- `source=url`: baixar um `.tgz` HTTPS com `package_sha256` obrigatório
- `source=artifact`: reutilizar um `.tgz` enviado por outra execução do GitHub Actions

`OpenClaw Release Checks` executa Package Acceptance com `source=artifact`, o
artefato de pacote de release preparado, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance mantém migração, atualização, limpeza de
dependências obsoletas de Plugin, fixtures de Plugin offline, atualização de Plugin e QA de pacote
Telegram contra o mesmo tarball resolvido. Verificações bloqueantes de release usam a
linha de base padrão do pacote publicado latest; `run_release_soak=true` ou
`release_profile=full` expande para todas as linhas de base estáveis publicadas no npm de
`2026.4.23` até `latest`, além de fixtures de problemas reportados. Use
Package Acceptance com `source=npm` para um candidato já enviado, ou
`source=ref`/`source=artifact` para um tarball npm local respaldado por SHA antes da
publicação. Ele é a substituição nativa do GitHub para a maior parte da cobertura de
pacote/atualização que anteriormente exigia Parallels. Verificações de release entre SOs ainda importam
para onboarding, instalador e comportamento de plataforma específicos de SO, mas a validação de produto
de pacote/atualização deve preferir Package Acceptance.

O checklist canônico para atualização e validação de Plugin é
[Testando atualizações e Plugins](/pt-BR/help/testing-updates-plugins). Use-o ao
decidir qual lane local, Docker, Package Acceptance ou release-check prova uma
instalação/atualização de Plugin, limpeza do doctor ou alteração de migração de pacote publicado.
A migração exaustiva de atualização publicada de todo pacote estável `2026.4.23+` é
um workflow manual `Update Migration` separado, não parte do Full Release CI.

A tolerância legada de package-acceptance é intencionalmente limitada no tempo. Pacotes até
`2026.4.25` podem usar o caminho de compatibilidade para lacunas de metadados já publicadas
no npm: entradas privadas de inventário QA ausentes do tarball, ausência de
`gateway install --wrapper`, arquivos de patch ausentes na fixture git derivada do tarball,
ausência de `update.channel` persistido, locais legados de registros de instalação de Plugin,
ausência de persistência de registro de instalação do marketplace e migração de metadados
de configuração durante `plugins update`. O pacote `2026.4.26` publicado pode avisar
sobre arquivos de carimbo de metadados de build local que já foram enviados. Pacotes posteriores
devem satisfazer os contratos modernos de pacote; essas mesmas lacunas falham na validação
de release.

Use perfis Package Acceptance mais amplos quando a pergunta de release for sobre um
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

- `smoke`: lanes rápidas de instalação de pacote/canal/agente, rede do Gateway e
  recarregamento de configuração
- `package`: contratos de instalação/atualização/pacote de Plugin sem ClawHub ao vivo; este é o padrão
  da verificação de release
- `product`: `package` mais canais MCP, limpeza de cron/subagente, pesquisa
  web da OpenAI e OpenWebUI
- `full`: partes do caminho de release do Docker com OpenWebUI
- `custom`: lista exata de `docker_lanes` para reexecuções focadas

Para prova de Telegram de candidato a pacote, habilite `telegram_mode=mock-openai` ou
`telegram_mode=live-frontier` no Package Acceptance. O workflow passa o tarball
`package-under-test` resolvido para a lane do Telegram; o workflow independente
do Telegram ainda aceita uma especificação npm publicada para verificações pós-publicação.

## Automação de publicação de release

`OpenClaw Release Publish` é o ponto de entrada mutável normal de publicação. Ele
orquestra os workflows de publicador confiável na ordem que o release exige:

1. Fazer checkout da tag de release e resolver seu SHA de commit.
2. Verificar se a tag é alcançável a partir de `main` ou `release/*`.
3. Executar `pnpm plugins:sync:check`.
4. Disparar `Plugin NPM Release` com `publish_scope=all-publishable` e
   `ref=<release-sha>`.
5. Disparar `Plugin ClawHub Release` com o mesmo escopo e SHA.
6. Disparar `OpenClaw NPM Release` com a tag de release, a dist-tag npm e
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

A promoção estável diretamente para `latest` é explícita:

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
  `v2026.4.2-beta.1`; quando `preflight_only=true`, também pode ser o SHA de commit
  completo de 40 caracteres da branch de workflow atual para preflight somente de validação
- `preflight_only`: `true` somente para validação/build/pacote, `false` para o
  caminho real de publicação
- `preflight_run_id`: obrigatório no caminho real de publicação para que o workflow reutilize
  o tarball preparado da execução de preflight bem-sucedida
- `npm_dist_tag`: tag npm de destino para o caminho de publicação; o padrão é `beta`

`OpenClaw Release Publish` aceita estas entradas controladas pelo operador:

- `tag`: tag de release obrigatória; já deve existir
- `preflight_run_id`: id de execução de preflight bem-sucedida de `OpenClaw NPM Release`;
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
  exigem que o commit resolvido seja alcançável a partir de uma branch OpenClaw ou
  tag de release.
- `run_release_soak`: opta por soak exaustivo ao vivo/E2E, caminho de release do Docker e
  soak de sobrevivente de upgrade all-since em verificações de release estável/padrão. Ele é forçado
  por `release_profile=full`.

Regras:

- Tags estáveis e de correção podem publicar em `beta` ou `latest`
- Tags beta de pré-release podem publicar somente em `beta`
- Para `OpenClaw NPM Release`, a entrada de SHA de commit completo é permitida somente quando
  `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` são sempre
  somente de validação
- O caminho real de publicação deve usar o mesmo `npm_dist_tag` usado durante o preflight;
  o workflow verifica esses metadados antes de a publicação continuar

## Sequência de release npm estável

Ao cortar um release npm estável:

1. Execute `OpenClaw NPM Release` com `preflight_only=true`
   - Antes de existir uma tag, você pode usar o SHA de commit completo da branch de workflow atual
     para um ensaio somente de validação do workflow de preflight
2. Escolha `npm_dist_tag=beta` para o fluxo normal beta-primeiro, ou `latest` somente
   quando você intencionalmente quiser uma publicação estável direta
3. Execute `Full Release Validation` na branch de release, tag de release ou SHA de
   commit completo quando quiser CI normal mais cobertura de cache de prompt ao vivo, Docker, QA Lab,
   Matrix e Telegram a partir de um único workflow manual
4. Se você intencionalmente só precisar do grafo normal determinístico de testes, execute o
   workflow manual `CI` na ref de release em vez disso
5. Salve o `preflight_run_id` bem-sucedido
6. Execute `OpenClaw Release Publish` com a mesma `tag`, o mesmo `npm_dist_tag`
   e o `preflight_run_id` salvo; ele publica Plugins externalizados no npm
   e no ClawHub antes de promover o pacote npm OpenClaw
7. Se o release foi lançado em `beta`, use o workflow privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover essa versão estável de `beta` para `latest`
8. Se o release foi publicado intencionalmente diretamente em `latest` e `beta`
   deve seguir a mesma build estável imediatamente, use esse mesmo workflow privado
   para apontar ambas as dist-tags para a versão estável, ou deixe a sincronização
   auto-reparadora agendada dele mover `beta` depois

A mutação de dist-tag fica no repo privado por segurança porque ela ainda
exige `NPM_TOKEN`, enquanto o repo público mantém publicação somente por OIDC.

Isso mantém tanto o caminho de publicação direta quanto o caminho de promoção beta-primeiro
documentados e visíveis ao operador.

Se um mantenedor precisar recorrer à autenticação npm local, execute quaisquer comandos
da CLI (`op`) do 1Password somente dentro de uma sessão tmux dedicada. Não chame `op`
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
