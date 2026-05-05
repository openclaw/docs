---
read_when:
    - Procurando definições de canais de lançamento públicos
    - Executando a validação de lançamento ou a aceitação de pacote
    - Buscando nomenclatura e cadência de versões
summary: Canais de lançamento, checklist do operador, caixas de validação, nomenclatura de versões e cadência
title: Política de lançamento
x-i18n:
    generated_at: "2026-05-05T05:44:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9980265c30c6a6571db5512749ec173cca79ac70494fd09968add793be9717a5
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw tem três faixas públicas de lançamento:

- stable: lançamentos com tags que publicam no npm `beta` por padrão, ou no npm `latest` quando solicitado explicitamente
- beta: tags de pré-lançamento que publicam no npm `beta`
- dev: a ponta móvel de `main`

## Nomenclatura de versões

- Versão de lançamento estável: `YYYY.M.D`
  - Tag do Git: `vYYYY.M.D`
- Versão de lançamento de correção estável: `YYYY.M.D-N`
  - Tag do Git: `vYYYY.M.D-N`
- Versão de pré-lançamento beta: `YYYY.M.D-beta.N`
  - Tag do Git: `vYYYY.M.D-beta.N`
- Não adicione zero à esquerda no mês ou no dia
- `latest` significa o lançamento npm estável promovido atual
- `beta` significa o destino atual de instalação beta
- Lançamentos estáveis e de correção estável publicam no npm `beta` por padrão; operadores de lançamento podem direcionar explicitamente para `latest`, ou promover uma build beta validada posteriormente
- Todo lançamento estável do OpenClaw entrega o pacote npm e o app macOS juntos;
  lançamentos beta normalmente validam e publicam primeiro o caminho npm/pacote,
  com build/assinatura/notarização do app Mac reservados para estáveis, salvo solicitação explícita

## Cadência de lançamentos

- Os lançamentos avançam primeiro pelo beta
- O estável vem somente depois que o beta mais recente é validado
- Mantenedores normalmente cortam lançamentos a partir de uma branch `release/YYYY.M.D` criada
  a partir do `main` atual, para que a validação e as correções de lançamento não bloqueiem novo
  desenvolvimento no `main`
- Se uma tag beta tiver sido enviada ou publicada e precisar de correção, os mantenedores cortam
  a próxima tag `-beta.N` em vez de excluir ou recriar a tag beta antiga
- Procedimento detalhado de lançamento, aprovações, credenciais e notas de recuperação são
  exclusivos de mantenedores

## Checklist do operador de lançamento

Este checklist é a forma pública do fluxo de lançamento. Credenciais privadas,
assinatura, notarização, recuperação de dist-tag e detalhes de rollback de emergência ficam no
runbook de lançamento exclusivo de mantenedores.

1. Comece pelo `main` atual: puxe o mais recente, confirme que o commit de destino foi enviado,
   e confirme que o CI atual do `main` está verde o suficiente para criar a branch a partir dele.
2. Reescreva a seção superior de `CHANGELOG.md` a partir do histórico real de commits com
   `/changelog`, mantenha as entradas voltadas ao usuário, faça commit, envie, e faça rebase/pull
   mais uma vez antes de criar a branch.
3. Revise os registros de compatibilidade de lançamento em
   `src/plugins/compat/registry.ts` e
   `src/commands/doctor/shared/deprecation-compat.ts`. Remova compatibilidade expirada
   somente quando o caminho de atualização continuar coberto, ou registre por que ela está
   sendo mantida intencionalmente.
4. Crie `release/YYYY.M.D` a partir do `main` atual; não faça trabalho normal de lançamento
   diretamente no `main`.
5. Incremente todos os locais de versão obrigatórios para a tag pretendida, execute
   `pnpm plugins:sync` para que os pacotes de Plugin publicáveis compartilhem a versão de lançamento
   e os metadados de compatibilidade, então execute o preflight determinístico local:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` e
   `pnpm release:check`.
6. Execute `OpenClaw NPM Release` com `preflight_only=true`. Antes de existir uma tag,
   um SHA completo de 40 caracteres da branch de lançamento é permitido para preflight
   apenas de validação. Salve o `preflight_run_id` bem-sucedido.
7. Inicie todos os testes de pré-lançamento com `Full Release Validation` para a
   branch de lançamento, tag ou SHA completo do commit. Este é o único ponto de entrada manual
   para as quatro grandes caixas de teste de lançamento: Vitest, Docker, QA Lab e Package.
8. Se a validação falhar, corrija na branch de lançamento e execute novamente o menor
   arquivo, faixa, job de workflow, perfil de pacote, provedor ou allowlist de modelo com falha que
   comprove a correção. Execute novamente o guarda-chuva completo somente quando a superfície alterada tornar
   as evidências anteriores obsoletas.
9. Para beta, crie a tag `vYYYY.M.D-beta.N`, então execute `OpenClaw Release Publish` a partir
   da branch `release/YYYY.M.D` correspondente. Ele verifica `pnpm plugins:sync:check`,
   publica primeiro todos os pacotes de Plugin publicáveis no npm, publica o mesmo
   conjunto no ClawHub em seguida como tarballs ClawPack npm-pack, e então promove o
   artefato de preflight npm preparado do OpenClaw com a dist-tag correspondente. Após
   publicar, execute a aceitação de pacote pós-publicação
   contra o pacote `openclaw@YYYY.M.D-beta.N` ou
   `openclaw@beta` publicado. Se um pré-lançamento enviado ou publicado precisar de correção,
   corte o próximo número de pré-lançamento correspondente; não exclua nem reescreva o
   pré-lançamento antigo.
10. Para estável, continue somente depois que o beta validado ou candidato a lançamento tiver a
    evidência de validação exigida. A publicação npm estável também passa por
    `OpenClaw Release Publish`, reutilizando o artefato de preflight bem-sucedido via
    `preflight_run_id`; a prontidão do lançamento macOS estável também exige o
    `.zip`, `.dmg`, `.dSYM.zip` empacotados e o `appcast.xml` atualizado no `main`.
11. Após publicar, execute o verificador npm pós-publicação, o E2E opcional do Telegram
    publicado no npm standalone quando precisar de prova de canal pós-publicação,
    promoção de dist-tag quando necessário, notas de release/pré-release do GitHub a partir da
    seção completa correspondente de `CHANGELOG.md`, e as etapas de anúncio do lançamento.

## Preflight de lançamento

- Execute `pnpm check:test-types` antes da pré-verificação de lançamento para que o TypeScript dos testes continue
  coberto fora do gate local mais rápido `pnpm check`
- Execute `pnpm check:architecture` antes da pré-verificação de lançamento para que as verificações mais amplas de ciclos de importação
  e limites de arquitetura fiquem verdes fora do gate local mais rápido
- Execute `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que os artefatos de lançamento esperados
  `dist/*` e o pacote da Control UI existam para a etapa de validação
  do pacote
- Execute `pnpm plugins:sync` depois do bump de versão raiz e antes de criar a tag. Ele
  atualiza as versões dos pacotes de plugin publicáveis, os metadados de compatibilidade
  de peer/API do OpenClaw, os metadados de build e os stubs de changelog de plugin para corresponder
  à versão de lançamento do núcleo. `pnpm plugins:sync:check` é a proteção de lançamento sem mutação;
  o fluxo de publicação falha antes de qualquer mutação de registro se essa etapa tiver sido
  esquecida.
- Execute o workflow manual `Full Release Validation` antes da aprovação do lançamento para
  iniciar todas as caixas de teste de pré-lançamento a partir de um único ponto de entrada. Ele aceita uma branch,
  tag ou SHA completo de commit, dispara `CI` manual e dispara
  `OpenClaw Release Checks` para smoke de instalação, aceitação de pacote, verificações de pacote
  entre sistemas operacionais, paridade do QA Lab, Matrix e lanes do Telegram. Execuções estáveis/padrão
  mantêm live/E2E exaustivos e soak do caminho de lançamento do Docker atrás de
  `run_release_soak=true`; `release_profile=full` força o soak. Com
  `release_profile=full` e `rerun_group=all`, ele também executa E2E de pacote do Telegram
  contra o artefato `release-package-under-test` das verificações de lançamento.
  Forneça `npm_telegram_package_spec` depois da publicação quando o mesmo
  E2E do Telegram também deve provar o pacote npm publicado. Forneça
  `package_acceptance_package_spec` depois da publicação quando Package Acceptance
  deve executar sua matriz de pacote/atualização contra o pacote npm enviado em vez
  do artefato construído a partir do SHA. Forneça
  `evidence_package_spec` quando o relatório privado de evidências deve provar que a
  validação corresponde a um pacote npm publicado sem forçar E2E do Telegram.
  Exemplo:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Execute o workflow manual `Package Acceptance` quando quiser prova em canal lateral
  para um candidato de pacote enquanto o trabalho de lançamento continua. Use `source=npm` para
  `openclaw@beta`, `openclaw@latest` ou uma versão exata de lançamento; `source=ref`
  para empacotar uma branch/tag/SHA confiável de `package_ref` com o harness
  `workflow_ref` atual; `source=url` para um tarball HTTPS com SHA-256
  obrigatório; ou `source=artifact` para um tarball enviado por outra execução do GitHub
  Actions. O workflow resolve o candidato para
  `package-under-test`, reutiliza o agendador de lançamento Docker E2E contra esse
  tarball e pode executar QA do Telegram contra o mesmo tarball com
  `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`. Quando as lanes
  Docker selecionadas incluem `published-upgrade-survivor`, o artefato do pacote
  é o candidato e `published_upgrade_survivor_baseline` seleciona
  a baseline publicada. `update-restart-auth` usa o pacote candidato como
  a CLI instalada e o package-under-test, para exercitar o caminho de reinicialização
  gerenciada do comando de atualização candidato.
  Exemplo: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Perfis comuns:
  - `smoke`: lanes de instalação/canal/agente, rede do gateway e recarregamento de configuração
  - `package`: lanes nativas de artefato para pacote/atualização/reinicialização/plugin sem OpenWebUI ou ClawHub live
  - `product`: perfil de pacote mais canais MCP, limpeza de cron/subagente,
    pesquisa web da OpenAI e OpenWebUI
  - `full`: blocos do caminho de lançamento Docker com OpenWebUI
  - `custom`: seleção exata de `docker_lanes` para uma reexecução focada
- Execute diretamente o workflow manual `CI` quando você só precisar de cobertura completa de CI normal
  para o candidato de lançamento. Disparos manuais de CI ignoram o escopo por mudanças
  e forçam os shards Linux Node, shards de plugin empacotado, contratos de canal,
  compatibilidade com Node 22, `check`, `check-additional`, smoke de build,
  verificações de docs, skills Python, Windows, macOS, Android e lanes de i18n da Control UI.
  Exemplo: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Execute `pnpm qa:otel:smoke` ao validar a telemetria de lançamento. Ele exercita
  o QA-lab por meio de um receptor OTLP/HTTP local e verifica os nomes dos spans
  de trace exportados, atributos limitados e redação de conteúdo/identificador sem
  exigir Opik, Langfuse ou outro coletor externo.
- Execute `pnpm release:check` antes de todo lançamento com tag
- Execute `OpenClaw Release Publish` para a sequência de publicação com mutação depois que a
  tag existir. Dispare-o a partir de `release/YYYY.M.D` (ou `main` ao publicar uma
  tag alcançável a partir de main), informe a tag de lançamento e o `preflight_run_id`
  bem-sucedido do npm do OpenClaw, e mantenha o escopo padrão de publicação de plugins
  `all-publishable`, a menos que você esteja executando deliberadamente um reparo focado. O
  workflow serializa a publicação npm de plugins, a publicação de plugins no ClawHub e a publicação npm do OpenClaw
  para que o pacote principal não seja publicado antes de seus plugins externalizados.
- As verificações de lançamento agora rodam em um workflow manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` também executa a lane de paridade mock do QA Lab mais o perfil rápido
  live Matrix e a lane QA do Telegram antes da aprovação do lançamento. As lanes live
  usam o ambiente `qa-live-shared`; o Telegram também usa leases de credenciais CI
  do Convex. Execute o workflow manual `QA-Lab - All Lanes` com
  `matrix_profile=all` e `matrix_shards=true` quando quiser inventário completo de transporte,
  mídia e E2EE do Matrix em paralelo.
- A validação de runtime de instalação e upgrade entre sistemas operacionais faz parte dos
  `OpenClaw Release Checks` públicos e do `Full Release Validation`, que chamam diretamente
  o workflow reutilizável
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Essa divisão é intencional: manter o caminho real de lançamento npm curto,
  determinístico e focado em artefatos, enquanto verificações live mais lentas ficam em sua
  própria lane para que não atrasem nem bloqueiem a publicação
- Verificações de lançamento que carregam segredos devem ser disparadas por meio de `Full Release
Validation` ou a partir da ref de workflow `main`/release para que a lógica do workflow e
  os segredos permaneçam controlados
- `OpenClaw Release Checks` aceita uma branch, tag ou SHA completo de commit, desde que
  o commit resolvido seja alcançável a partir de uma branch ou tag de lançamento do OpenClaw
- A pré-verificação somente de validação de `OpenClaw NPM Release` também aceita o SHA completo
  de 40 caracteres do commit atual da branch do workflow sem exigir uma tag enviada
- Esse caminho por SHA é somente de validação e não pode ser promovido a uma publicação real
- No modo SHA, o workflow sintetiza `v<package.json version>` apenas para a verificação
  de metadados do pacote; a publicação real ainda exige uma tag real de lançamento
- Ambos os workflows mantêm o caminho real de publicação e promoção em runners hospedados pelo GitHub,
  enquanto o caminho de validação sem mutação pode usar os runners Linux maiores
  da Blacksmith
- Esse workflow executa
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando os segredos de workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- A pré-verificação de lançamento npm não espera mais pela lane separada de verificações de lançamento
- Execute `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou a tag beta/correção correspondente) antes da aprovação
- Depois da publicação npm, execute
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou a versão beta/correção correspondente) para verificar o caminho de instalação
  do registro publicado em um prefixo temporário novo
- Depois de uma publicação beta, execute `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  para verificar onboarding do pacote instalado, configuração do Telegram e E2E real do Telegram
  contra o pacote npm publicado usando o pool compartilhado de credenciais alugadas do Telegram.
  Execuções locais avulsas de mantenedores podem omitir as variáveis Convex e passar diretamente
  as três credenciais de ambiente `OPENCLAW_QA_TELEGRAM_*`.
- Para executar o smoke beta completo pós-publicação a partir da máquina de um mantenedor, use `pnpm release:beta-smoke -- --beta betaN`. O helper executa validação de atualização npm Parallels/alvo limpo, dispara `NPM Telegram Beta E2E`, faz polling da execução exata do workflow, baixa o artefato e imprime o relatório do Telegram.
- Mantenedores podem executar a mesma verificação pós-publicação pelo GitHub Actions por meio do
  workflow manual `NPM Telegram Beta E2E`. Ele é intencionalmente apenas manual e
  não roda em cada merge.
- A automação de lançamento dos mantenedores agora usa pré-verificação e depois promoção:
  - a publicação npm real deve passar um `preflight_run_id` npm bem-sucedido
  - a publicação npm real deve ser disparada a partir da mesma branch `main` ou
    `release/YYYY.M.D` da execução de pré-verificação bem-sucedida
  - lançamentos npm estáveis usam `beta` por padrão
  - a publicação npm estável pode mirar `latest` explicitamente por meio de input do workflow
  - a mutação de npm dist-tag baseada em token agora fica em
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    por segurança, porque `npm dist-tag add` ainda precisa de `NPM_TOKEN`, enquanto o
    repositório público mantém publicação somente por OIDC
  - o `macOS Release` público é somente de validação; quando uma tag existe apenas em uma
    branch de lançamento, mas o workflow é disparado a partir de `main`, defina
    `public_release_branch=release/YYYY.M.D`
  - a publicação mac privada real deve passar por `preflight_run_id` e `validate_run_id`
    mac privados bem-sucedidos
  - os caminhos de publicação real promovem artefatos preparados em vez de reconstruí-los
    novamente
- Para lançamentos estáveis de correção como `YYYY.M.D-N`, o verificador pós-publicação
  também verifica o mesmo caminho de upgrade com prefixo temporário de `YYYY.M.D` para `YYYY.M.D-N`
  para que correções de lançamento não deixem silenciosamente instalações globais mais antigas no
  payload estável base
- A pré-verificação de lançamento npm falha fechada a menos que o tarball inclua tanto
  `dist/control-ui/index.html` quanto um payload não vazio em `dist/control-ui/assets/`,
  para que não enviemos novamente um painel de navegador vazio
- A verificação pós-publicação também confere se entrypoints de plugin publicados e
  metadados de pacote estão presentes no layout de registro instalado. Um lançamento que
  envia payloads de runtime de plugin ausentes falha no verificador pós-publicação e
  não pode ser promovido para `latest`.
- `pnpm test:install:smoke` também impõe o orçamento de `unpackedSize` do pacote npm no
  tarball de atualização candidato, para que o e2e do instalador capture bloat acidental
  do pacote antes do caminho de publicação do lançamento
- Se o trabalho de lançamento tocou no planejamento de CI, manifests de timing de extensões ou
  matrizes de teste de extensões, regenere e revise os outputs da matriz
  `plugin-prerelease-extension-shard`, de propriedade do planejador, de
  `.github/workflows/plugin-prerelease.yml` antes da aprovação, para que as notas de lançamento
  não descrevam um layout de CI obsoleto
- A prontidão de lançamento estável para macOS também inclui as superfícies de atualização:
  - o release do GitHub deve acabar com os pacotes `.zip`, `.dmg` e `.dSYM.zip`
  - `appcast.xml` em `main` deve apontar para o novo zip estável depois da publicação
  - o app empacotado deve manter um bundle id que não seja de debug, uma URL de feed Sparkle
    não vazia e um `CFBundleVersion` igual ou acima do piso canônico de build do Sparkle
    para essa versão de lançamento

## Caixas de teste de lançamento

`Full Release Validation` é como operadores iniciam todos os testes de pré-lançamento a partir de
um único ponto de entrada. Para uma prova de commit fixado em uma branch que muda rapidamente, use o
helper para que cada workflow filho rode a partir de uma branch temporária fixa no SHA
alvo:

```bash
pnpm ci:full-release --sha <full-sha>
```

O helper envia `release-ci/<sha>-...`, dispara `Full Release Validation`
a partir dessa branch com `ref=<sha>`, verifica se cada `headSha` de workflow filho
corresponde ao alvo e depois exclui a branch temporária. Isso evita provar por acidente
uma execução filha mais nova de `main`.

Para validação de branch ou tag de lançamento, execute-a a partir da ref de workflow confiável
`main` e passe a branch ou tag de lançamento como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

O fluxo de trabalho resolve a ref de destino, aciona o `CI` manual com
`target_ref=<release-ref>`, aciona `OpenClaw Release Checks`, prepara um
artefato pai `release-package-under-test` para verificações voltadas a pacotes e
aciona o E2E standalone do pacote Telegram quando `release_profile=full` com
`rerun_group=all` ou quando `npm_telegram_package_spec` está definido. Em seguida,
`OpenClaw Release Checks` expande para smoke de instalação, verificações de
lançamento entre sistemas operacionais, cobertura live/E2E do caminho de
lançamento Docker quando o soak está habilitado, Package Acceptance com QA do
pacote Telegram, paridade do QA Lab, Matrix live e Telegram live. Uma execução completa só é aceitável quando o
resumo de `Full Release Validation`
mostra `normal_ci` e `release_checks` como bem-sucedidos. No modo full/all,
o filho `npm_telegram` também precisa ser bem-sucedido; fora de full/all, ele é ignorado
a menos que um `npm_telegram_package_spec` publicado tenha sido fornecido. O resumo final
do verificador inclui tabelas dos jobs mais lentos para cada execução filha, para que o gerente de lançamento
possa ver o caminho crítico atual sem baixar logs.
Consulte [Validação completa de lançamento](/pt-BR/reference/full-release-validation) para a
matriz completa de estágios, nomes exatos dos jobs do fluxo de trabalho, diferenças
entre os perfis stable e full, artefatos e identificadores de reexecução focada.
Os fluxos de trabalho filhos são acionados a partir da ref confiável que executa `Full Release
Validation`, normalmente `--ref main`, mesmo quando a `ref` de destino aponta para uma
branch ou tag de lançamento mais antiga. Não há uma entrada separada de ref do fluxo de trabalho
Full Release Validation; escolha o harness confiável escolhendo a ref da execução do fluxo de trabalho.
Não use `--ref main -f ref=<sha>` para prova de commit exato em uma `main` móvel;
SHAs brutos de commit não podem ser refs de dispatch de fluxo de trabalho, então use
`pnpm ci:full-release --sha <sha>` para criar a branch temporária fixada.

Use `release_profile` para selecionar a abrangência live/provedor:

- `minimum`: caminho mais rápido crítico de lançamento para OpenAI/core live e Docker
- `stable`: minimum mais cobertura estável de provedor/backend para aprovação de lançamento
- `full`: stable mais cobertura ampla consultiva de provedores/mídia

Use `run_release_soak=true` com `stable` quando as lanes bloqueadoras de lançamento estiverem
verdes e você quiser a varredura exaustiva live/E2E, caminho de lançamento Docker e
upgrade-survivor publicado limitado antes da promoção. Essa varredura cobre
os quatro pacotes estáveis mais recentes, além das linhas de base fixadas `2026.4.23` e `2026.5.2`
e cobertura mais antiga de `2026.4.15`, com linhas de base duplicadas removidas e
cada linha de base fragmentada em seu próprio job runner Docker. `full` implica
`run_release_soak=true`.

`OpenClaw Release Checks` usa a ref confiável do fluxo de trabalho para resolver a ref de destino
uma vez como `release-package-under-test` e reutiliza esse artefato nas verificações entre sistemas operacionais,
Package Acceptance e Docker de caminho de lançamento quando o soak é executado. Isso mantém
todas as caixas voltadas a pacotes nos mesmos bytes e evita builds repetidos de pacote.
O smoke de instalação OpenAI entre sistemas operacionais usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando a
variável de repo/org está definida, caso contrário `openai/gpt-5.4`, porque essa lane está
provando a instalação do pacote, o onboarding, a inicialização do Gateway e um turno live de agente,
em vez de fazer benchmark do modelo padrão mais lento. A matriz live mais ampla de provedores
continua sendo o lugar para cobertura específica por modelo.

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

Não use o umbrella completo como a primeira reexecução após uma correção focada. Se uma caixa
falhar, use o fluxo de trabalho filho, job, lane Docker, perfil de pacote, provedor de modelo
ou lane de QA com falha para a próxima prova. Execute o umbrella completo novamente somente quando
a correção tiver alterado a orquestração compartilhada de lançamento ou tornado obsoleta a evidência
anterior de todas as caixas. O verificador final do umbrella verifica novamente os ids registrados de execução dos fluxos de trabalho filhos, então, depois que um fluxo de trabalho filho for reexecutado com sucesso, reexecute somente o job pai
`Verify full validation` que falhou.

Para recuperação limitada, passe `rerun_group` ao umbrella. `all` é a execução real
de candidato a lançamento, `ci` executa somente o filho normal de CI, `plugin-prerelease`
executa somente o filho de Plugin exclusivo de lançamento, `release-checks` executa todas as caixas
de lançamento, e os grupos de lançamento mais estreitos são `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` e `npm-telegram`.
Reexecuções focadas de `npm-telegram` exigem `npm_telegram_package_spec`; execuções full/all
com `release_profile=full` usam o artefato de pacote de release-checks. Reexecuções focadas
entre sistemas operacionais podem adicionar `cross_os_suite_filter=windows/packaged-upgrade` ou
outro filtro de sistema operacional/suite. Falhas de QA em release-checks são consultivas; uma falha
somente de QA não bloqueia a validação de lançamento.

### Vitest

A caixa Vitest é o fluxo de trabalho filho `CI` manual. O CI manual intencionalmente
ignora o escopo por alterações e força o grafo normal de testes para o candidato
a lançamento: shards Linux Node, shards de Plugins empacotados, contratos de canais, compatibilidade com Node 22,
`check`, `check-additional`, smoke de build, verificações de documentação, Skills em Python, Windows, macOS, Android e Control UI i18n.

Use esta caixa para responder "a árvore de código-fonte passou na suíte completa normal de testes?"
Ela não é a mesma coisa que validação de produto do caminho de lançamento. Evidências a manter:

- resumo de `Full Release Validation` mostrando a URL da execução de `CI` acionada
- execução de `CI` verde no SHA exato de destino
- nomes de shards com falha ou lentos nos jobs de CI ao investigar regressões
- artefatos de tempo do Vitest, como `.artifacts/vitest-shard-timings.json`, quando
  uma execução precisa de análise de desempenho

Execute o CI manual diretamente somente quando o lançamento precisar de CI normal determinístico, mas
não das caixas Docker, QA Lab, live, entre sistemas operacionais ou de pacotes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

A caixa Docker fica em `OpenClaw Release Checks` por meio de
`openclaw-live-and-e2e-checks-reusable.yml`, além do fluxo de trabalho
`install-smoke` em modo de lançamento. Ela valida o candidato a lançamento por meio de ambientes
Docker empacotados, em vez de apenas testes em nível de código-fonte.

A cobertura Docker de lançamento inclui:

- smoke completo de instalação com o smoke lento de instalação global do Bun habilitado
- preparação/reutilização da imagem de smoke do Dockerfile raiz por SHA de destino, com jobs de smoke de QR,
  root/Gateway e instalador/Bun sendo executados como shards separados de install-smoke
- lanes E2E do repositório
- chunks Docker de caminho de lançamento: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` e `plugins-runtime-install-h`
- cobertura OpenWebUI dentro do chunk `plugins-runtime-services` quando solicitada
- lanes divididas de instalação/desinstalação de Plugins empacotados
  `bundled-plugin-install-uninstall-0` até
  `bundled-plugin-install-uninstall-23`
- suítes live/E2E de provedores e cobertura Docker de modelos live quando as verificações de lançamento
  incluem suítes live

Use artefatos Docker antes de reexecutar. O agendador de caminho de lançamento envia
`.artifacts/docker-tests/` com logs de lanes, `summary.json`, `failures.json`,
tempos de fases, JSON do plano do agendador e comandos de reexecução. Para recuperação focada,
use `docker_lanes=<lane[,lane]>` no fluxo de trabalho reutilizável live/E2E em vez de
reexecutar todos os chunks de lançamento. Os comandos de reexecução gerados incluem o
`package_artifact_run_id` anterior e entradas de imagens Docker preparadas quando disponíveis, para que uma
lane com falha possa reutilizar o mesmo tarball e as imagens GHCR.

### QA Lab

A caixa QA Lab também faz parte de `OpenClaw Release Checks`. Ela é o gate de lançamento
de comportamento agêntico e em nível de canal, separado do Vitest e da mecânica de pacotes
Docker.

A cobertura de QA Lab de lançamento inclui:

- lane de paridade mock comparando a lane candidata OpenAI com a linha de base Opus 4.6
  usando o pacote de paridade agêntica
- perfil rápido de QA Matrix live usando o ambiente `qa-live-shared`
- lane de QA Telegram live usando leases de credenciais de CI do Convex
- `pnpm qa:otel:smoke` quando a telemetria de lançamento precisa de prova local explícita

Use esta caixa para responder "o lançamento se comporta corretamente em cenários de QA e
fluxos de canais live?" Mantenha as URLs dos artefatos para as lanes de paridade, Matrix e Telegram
ao aprovar o lançamento. A cobertura completa de Matrix continua disponível como uma execução
manual fragmentada do QA-Lab, em vez da lane crítica de lançamento padrão.

### Pacote

A caixa Package é o gate do produto instalável. Ela é apoiada por
`Package Acceptance` e pelo resolvedor
`scripts/resolve-openclaw-package-candidate.mjs`. O resolvedor normaliza um
candidato no tarball `package-under-test` consumido pelo Docker E2E, valida
o inventário do pacote, registra a versão do pacote e o SHA-256, e mantém a
ref do harness do fluxo de trabalho separada da ref de origem do pacote.

Fontes de candidato compatíveis:

- `source=npm`: `openclaw@beta`, `openclaw@latest` ou uma versão exata de lançamento do OpenClaw
- `source=ref`: empacotar uma branch, tag ou SHA completo de commit confiável em `package_ref`
  com o harness `workflow_ref` selecionado
- `source=url`: baixar um `.tgz` HTTPS com `package_sha256` obrigatório
- `source=artifact`: reutilizar um `.tgz` enviado por outra execução do GitHub Actions

`OpenClaw Release Checks` executa Package Acceptance com `source=artifact`, o
artefato preparado do pacote de lançamento, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance mantém migração, atualização,
reinício de atualização com autenticação configurada, limpeza de dependências obsoletas de Plugins, fixtures offline de Plugins, atualização de Plugins e QA do pacote Telegram contra o mesmo tarball resolvido. Verificações de lançamento bloqueadoras usam a linha de base padrão do pacote publicado mais recente; `run_release_soak=true` ou
`release_profile=full` expande para todas as linhas de base estáveis publicadas no npm de
`2026.4.23` até `latest`, além de fixtures de problemas reportados. Use
Package Acceptance com `source=npm` para um candidato já lançado, ou
`source=ref`/`source=artifact` para um tarball npm local respaldado por SHA antes da
publicação. Ele é o substituto nativo do GitHub
para a maior parte da cobertura de pacote/atualização que antes exigia
Parallels. Verificações de lançamento entre sistemas operacionais ainda importam para onboarding,
instalador e comportamento específico de plataforma, mas a validação de produto de pacote/atualização deve
preferir Package Acceptance.

A checklist canônica para validação de atualização e Plugin é
[Testando atualizações e Plugins](/pt-BR/help/testing-updates-plugins). Use-a ao
decidir qual lane local, Docker, Package Acceptance ou release-check comprova uma
instalação/atualização de Plugin, limpeza do doctor ou alteração de migração de pacote publicado.
Migração exaustiva de atualização publicada a partir de cada pacote estável `2026.4.23+` é
um fluxo de trabalho manual separado `Update Migration`, não faz parte do Full Release CI.

A leniência legada de aceitação de pacotes é intencionalmente limitada no tempo. Pacotes até
`2026.4.25` podem usar o caminho de compatibilidade para lacunas de metadados já publicadas
no npm: entradas privadas de inventário de QA ausentes do tarball, ausência de
`gateway install --wrapper`, arquivos de patch ausentes no fixture git derivado do tarball,
ausência de `update.channel` persistido, locais legados de registros de instalação de Plugin,
ausência de persistência de registros de instalação do marketplace e migração de metadados de
configuração durante `plugins update`. O pacote publicado `2026.4.26` pode emitir avisos
para arquivos locais de carimbo de metadados de build que já foram enviados. Pacotes posteriores
devem atender aos contratos modernos de pacote; essas mesmas lacunas falham na validação de
release.

Use perfis mais amplos de Aceitação de Pacote quando a questão de release for sobre um
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

- `smoke`: trilhas rápidas de instalação de pacote/canal/agente, rede do Gateway e
  recarregamento de configuração
- `package`: contratos de pacote de instalação/atualização/reinicialização/Plugin sem ClawHub
  ao vivo; este é o padrão de verificação de release
- `product`: `package` mais canais MCP, limpeza de cron/subagente, pesquisa web da OpenAI
  e OpenWebUI
- `full`: partes do caminho de release do Docker com OpenWebUI
- `custom`: lista exata de `docker_lanes` para reexecuções focadas

Para prova de Telegram de candidato a pacote, habilite `telegram_mode=mock-openai` ou
`telegram_mode=live-frontier` na Aceitação de Pacote. O workflow passa o tarball
resolvido de `package-under-test` para a trilha do Telegram; o workflow avulso do
Telegram ainda aceita uma especificação npm publicada para verificações pós-publicação.

## Automação de publicação de release

`OpenClaw Release Publish` é o ponto de entrada normal de publicação mutante. Ele
orquestra os workflows de publicador confiável na ordem que o release exige:

1. Fazer checkout da tag de release e resolver seu SHA de commit.
2. Verificar se a tag é alcançável a partir de `main` ou `release/*`.
3. Executar `pnpm plugins:sync:check`.
4. Disparar `Plugin NPM Release` com `publish_scope=all-publishable` e
   `ref=<release-sha>`.
5. Disparar `Plugin ClawHub Release` com o mesmo escopo e SHA.
6. Disparar `OpenClaw NPM Release` com a tag de release, a dist-tag do npm e o
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
somente para trabalho focado de reparo ou republicação. Para um reparo de Plugin
selecionado, passe `plugin_publish_scope=selected` e `plugins=@openclaw/name` para
`OpenClaw Release Publish`, ou dispare o workflow filho diretamente quando o pacote
OpenClaw não deve ser publicado.

## Entradas do workflow NPM

`OpenClaw NPM Release` aceita estas entradas controladas pelo operador:

- `tag`: tag de release obrigatória, como `v2026.4.2`, `v2026.4.2-1` ou
  `v2026.4.2-beta.1`; quando `preflight_only=true`, também pode ser o SHA de commit
  completo de 40 caracteres atual do branch de workflow para preflight somente de validação
- `preflight_only`: `true` apenas para validação/build/pacote, `false` para o caminho
  real de publicação
- `preflight_run_id`: obrigatório no caminho real de publicação para que o workflow reutilize
  o tarball preparado da execução de preflight bem-sucedida
- `npm_dist_tag`: tag de destino do npm para o caminho de publicação; o padrão é `beta`

`OpenClaw Release Publish` aceita estas entradas controladas pelo operador:

- `tag`: tag de release obrigatória; já deve existir
- `preflight_run_id`: id de execução de preflight bem-sucedido de `OpenClaw NPM Release`;
  obrigatório quando `publish_openclaw_npm=true`
- `npm_dist_tag`: tag de destino do npm para o pacote OpenClaw
- `plugin_publish_scope`: o padrão é `all-publishable`; use `selected` somente
  para trabalho de reparo focado
- `plugins`: nomes de pacote `@openclaw/*` separados por vírgulas quando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: o padrão é `true`; defina `false` somente ao usar o
  workflow como orquestrador de reparo apenas de Plugin

`OpenClaw Release Checks` aceita estas entradas controladas pelo operador:

- `ref`: branch, tag ou SHA de commit completo a validar. Verificações com segredos
  exigem que o commit resolvido seja alcançável a partir de um branch do OpenClaw ou
  de uma tag de release.
- `run_release_soak`: opta por soak exaustivo ao vivo/E2E, caminho de release do Docker
  e upgrade-survivor all-since em verificações de release estável/padrão. É forçado
  por `release_profile=full`.

Regras:

- Tags estáveis e de correção podem publicar em `beta` ou `latest`
- Tags de pré-release beta podem publicar somente em `beta`
- Para `OpenClaw NPM Release`, entrada de SHA de commit completo é permitida somente quando
  `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` são sempre
  somente validação
- O caminho real de publicação deve usar o mesmo `npm_dist_tag` usado durante o preflight;
  o workflow verifica esses metadados antes que a publicação continue

## Sequência de release npm estável

Ao preparar um release npm estável:

1. Execute `OpenClaw NPM Release` com `preflight_only=true`
   - Antes que exista uma tag, você pode usar o SHA de commit completo atual do branch
     de workflow para uma execução de teste somente de validação do workflow de preflight
2. Escolha `npm_dist_tag=beta` para o fluxo normal beta-primeiro, ou `latest` somente
   quando você quiser intencionalmente uma publicação estável direta
3. Execute `Full Release Validation` no branch de release, na tag de release ou no SHA
   de commit completo quando quiser CI normal mais cobertura de cache de prompt ao vivo,
   Docker, QA Lab, Matrix e Telegram em um workflow manual
4. Se você intencionalmente só precisar do grafo de testes normal determinístico, execute o
   workflow manual `CI` na ref de release
5. Salve o `preflight_run_id` bem-sucedido
6. Execute `OpenClaw Release Publish` com a mesma `tag`, o mesmo `npm_dist_tag`
   e o `preflight_run_id` salvo; ele publica Plugins externalizados no npm
   e no ClawHub antes de promover o pacote npm OpenClaw
7. Se o release chegou em `beta`, use o workflow privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover essa versão estável de `beta` para `latest`
8. Se o release foi publicado intencionalmente direto em `latest` e `beta`
   deve seguir o mesmo build estável imediatamente, use esse mesmo workflow privado
   para apontar ambas as dist-tags para a versão estável, ou deixe a sincronização
   autocorretiva agendada dele mover `beta` depois

A mutação de dist-tag fica no repositório privado por segurança porque ainda
exige `NPM_TOKEN`, enquanto o repositório público mantém publicação somente por OIDC.

Isso mantém o caminho de publicação direta e o caminho de promoção beta-primeiro
documentados e visíveis para o operador.

Se um mantenedor precisar recorrer à autenticação npm local, execute quaisquer comandos da
CLI (`op`) do 1Password somente dentro de uma sessão tmux dedicada. Não chame `op`
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
