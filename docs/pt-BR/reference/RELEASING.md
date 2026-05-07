---
read_when:
    - Procurando definições de canais públicos de lançamento
    - Executando a validação de lançamento ou a aceitação de pacote
    - Buscando nomenclatura e cadência de versões
    - Planejamento de linhas de lançamento de suporte mensal ou LTS
summary: Faixas de lançamento, checklist do operador, caixas de validação, nomenclatura de versões, linhas planejadas de suporte mensal e cadência
title: Política de lançamento
x-i18n:
    generated_at: "2026-05-07T01:53:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: cbd86faf2aa3eeeb465203431c19c778719f291a2e2732fca1463bde89e42e80
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw tem três canais públicos de lançamento:

- stable: lançamentos marcados com tag que publicam no npm `beta` por padrão, ou no npm `latest` quando solicitado explicitamente
- beta: tags de pré-lançamento que publicam no npm `beta`
- dev: a ponta móvel de `main`

## Nomenclatura de versões

- Versão de lançamento estável: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versão legada de lançamento estável de correção: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versão de pré-lançamento beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Não preencha mês ou dia com zero à esquerda
- `latest` significa o lançamento npm estável atualmente promovido
- `beta` significa o destino atual de instalação beta
- Lançamentos estáveis e correções legadas publicam no npm `beta` por padrão; operadores de lançamento podem direcionar para `latest` explicitamente ou promover uma build beta verificada posteriormente
- Todo lançamento estável do OpenClaw entrega o pacote npm e o app para macOS juntos;
  lançamentos beta normalmente validam e publicam primeiro o caminho de npm/pacote, com
  build/assinatura/notarização do app para Mac reservados para stable, a menos que solicitados explicitamente

### Versionamento planejado para suporte mensal

OpenClaw ainda não tem um canal LTS ou de suporte mensal. Mantenedores estão
trabalhando rumo a linhas de suporte mensal compatíveis com SemVer, mas os canais
de atualização entregues hoje ainda são `stable`, `beta` e `dev`.

O formato de versão planejado é `YYYY.M.PATCH`:

- `YYYY` é o ano.
- `M` é a linha de lançamento mensal, sem zero à esquerda.
- `PATCH` incrementa dentro dessa linha mensal e pode crescer tanto quanto necessário.

Por exemplo, `2026.6.0`, `2026.6.1` e `2026.6.2` estariam todos na linha de junho
de 2026. Uma futura dist-tag de suporte mensal, como `stable-2026-6` ou
`lts-2026-6`, pode apontar para essa linha, enquanto `latest` continua avançando rapidamente.

Esse modelo futuro substitui a necessidade de novos lançamentos de correção `YYYY.M.D-N`.
Versões legadas de correção existentes continuam reconhecidas para que pacotes antigos e
caminhos de upgrade continuem funcionando.

## Cadência de lançamento

- Lançamentos avançam primeiro pelo beta
- Stable vem apenas depois que o beta mais recente é validado
- Mantenedores normalmente criam lançamentos a partir de um branch `release/YYYY.M.D` criado
  do `main` atual, para que validação e correções de lançamento não bloqueiem novo
  desenvolvimento em `main`
- Se uma tag beta foi enviada por push ou publicada e precisa de correção, mantenedores criam
  a próxima tag `-beta.N` em vez de excluir ou recriar a tag beta antiga
- O procedimento detalhado de lançamento, aprovações, credenciais e notas de recuperação são
  apenas para mantenedores

## Checklist do operador de lançamento

Este checklist é o formato público do fluxo de lançamento. Credenciais privadas,
assinatura, notarização, recuperação de dist-tag e detalhes de rollback emergencial ficam no
runbook de lançamento apenas para mantenedores.

1. Comece do `main` atual: faça pull do mais recente, confirme que o commit de destino foi enviado por push,
   e confirme que o CI atual de `main` está verde o suficiente para criar um branch a partir dele.
2. Reescreva a seção superior de `CHANGELOG.md` a partir do histórico real de commits com
   `/changelog`, mantenha as entradas voltadas ao usuário, faça commit, faça push e faça rebase/pull
   mais uma vez antes de criar o branch.
3. Revise os registros de compatibilidade de lançamento em
   `src/plugins/compat/registry.ts` e
   `src/commands/doctor/shared/deprecation-compat.ts`. Remova compatibilidade expirada
   apenas quando o caminho de upgrade continuar coberto, ou registre por que ela está
   sendo mantida intencionalmente.
4. Crie `release/YYYY.M.D` a partir do `main` atual; não faça o trabalho normal de lançamento
   diretamente em `main`.
5. Atualize cada local obrigatório de versão para a tag pretendida, execute
   `pnpm plugins:sync` para que pacotes de Plugin publicáveis compartilhem a versão de lançamento
   e os metadados de compatibilidade, então execute a pré-verificação determinística local:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` e
   `pnpm release:check`.
6. Execute `OpenClaw NPM Release` com `preflight_only=true`. Antes de existir uma tag,
   um SHA completo de 40 caracteres do branch de lançamento é permitido para pré-verificação
   apenas de validação. Salve o `preflight_run_id` bem-sucedido.
7. Inicie todos os testes de pré-lançamento com `Full Release Validation` para o
   branch de lançamento, tag ou SHA completo do commit. Este é o único ponto de entrada manual
   para as quatro grandes caixas de teste de lançamento: Vitest, Docker, QA Lab e Package.
8. Se a validação falhar, corrija no branch de lançamento e reexecute o menor arquivo,
   canal, job de workflow, perfil de pacote, provedor ou allowlist de modelo com falha que
   comprove a correção. Reexecute o guarda-chuva completo apenas quando a superfície alterada tornar
   as evidências anteriores obsoletas.
9. Para beta, marque `vYYYY.M.D-beta.N`, então execute `OpenClaw Release Publish` a partir
   do branch `release/YYYY.M.D` correspondente. Ele verifica `pnpm plugins:sync:check`,
   despacha todos os pacotes de Plugin publicáveis para o npm e o mesmo conjunto para
   ClawHub em paralelo, e então promove o artefato preparado de pré-verificação npm do OpenClaw
   com a dist-tag correspondente assim que a publicação npm do Plugin tiver sucesso.
   A publicação no ClawHub ainda pode estar em execução enquanto o npm do OpenClaw publica, mas o
   workflow de publicação de lançamento não termina até que ambos os caminhos de publicação do Plugin e
   o caminho de publicação npm do OpenClaw tenham sido concluídos com sucesso. Após publicar, execute
   a aceitação de pacote pós-publicação contra o pacote `openclaw@YYYY.M.D-beta.N` ou
   `openclaw@beta` publicado. Se um pré-lançamento enviado por push ou publicado precisar de correção,
   crie o próximo número de pré-lançamento correspondente; não exclua nem reescreva o
   pré-lançamento antigo.
10. Para stable, continue apenas depois que o beta verificado ou candidato a lançamento tiver as
    evidências de validação exigidas. A publicação npm estável também passa por
    `OpenClaw Release Publish`, reutilizando o artefato de pré-verificação bem-sucedido via
    `preflight_run_id`; a prontidão de lançamento estável para macOS também exige o
    `.zip`, `.dmg`, `.dSYM.zip` empacotados e o `appcast.xml` atualizado em `main`.
11. Após publicar, execute o verificador npm pós-publicação, o E2E Telegram opcional
    autônomo de npm publicado quando você precisar de prova de canal pós-publicação,
    promoção de dist-tag quando necessário, notas de lançamento/pré-lançamento do GitHub a partir da
    seção completa correspondente de `CHANGELOG.md`, e as etapas de anúncio de lançamento.

## Pré-verificação de lançamento

- Execute `pnpm check:test-types` antes do preflight de lançamento para que o TypeScript de teste permaneça
  coberto fora do gate local mais rápido `pnpm check`
- Execute `pnpm check:architecture` antes do preflight de lançamento para que as verificações mais amplas de
  ciclos de importação e limites de arquitetura fiquem verdes fora do gate local mais rápido
- Execute `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que os artefatos de lançamento
  `dist/*` esperados e o pacote da Control UI existam para a etapa de validação
  do pacote
- Execute `pnpm plugins:sync` após o bump de versão na raiz e antes de criar a tag. Ele
  atualiza as versões dos pacotes de plugins publicáveis, os metadados de compatibilidade
  de API/pares do OpenClaw, os metadados de build e os stubs de changelog dos plugins para corresponder à versão de
  lançamento do núcleo. `pnpm plugins:sync:check` é a guarda de lançamento não mutável;
  o workflow de publicação falha antes de qualquer mutação de registry se esta etapa tiver sido
  esquecida.
- Execute o workflow manual `Full Release Validation` antes da aprovação do lançamento para
  iniciar todas as caixas de teste de pré-lançamento a partir de um único ponto de entrada. Ele aceita uma branch,
  tag ou SHA completo de commit, despacha o `CI` manual e despacha
  `OpenClaw Release Checks` para smoke de instalação, aceitação de pacote, verificações de pacote
  entre sistemas operacionais, paridade do QA Lab, Matrix e lanes do Telegram. Execuções estáveis/padrão
  mantêm o live/E2E exaustivo e o soak do caminho de lançamento Docker atrás de
  `run_release_soak=true`; `release_profile=full` força o soak. Com
  `release_profile=full` e `rerun_group=all`, ele também executa o E2E de pacote do Telegram
  contra o artefato `release-package-under-test` das verificações de lançamento.
  Forneça `npm_telegram_package_spec` após a publicação quando o mesmo
  E2E do Telegram também deve provar o pacote npm publicado. Forneça
  `package_acceptance_package_spec` após a publicação quando o Package Acceptance
  deve executar sua matriz de pacote/atualização contra o pacote npm enviado, em vez
  do artefato criado a partir do SHA. Forneça
  `evidence_package_spec` quando o relatório privado de evidências deve provar que a
  validação corresponde a um pacote npm publicado sem forçar o E2E do Telegram.
  Exemplo:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Execute o workflow manual `Package Acceptance` quando quiser prova por canal lateral
  para uma candidata de pacote enquanto o trabalho de lançamento continua. Use `source=npm` para
  `openclaw@beta`, `openclaw@latest` ou uma versão exata de lançamento; `source=ref`
  para empacotar uma branch/tag/SHA `package_ref` confiável com o harness
  `workflow_ref` atual; `source=url` para um tarball HTTPS com um
  SHA-256 obrigatório; ou `source=artifact` para um tarball enviado por outra execução do GitHub
  Actions. O workflow resolve a candidata para
  `package-under-test`, reutiliza o agendador de lançamento Docker E2E contra esse
  tarball e pode executar QA do Telegram contra o mesmo tarball com
  `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`. Quando as
  lanes Docker selecionadas incluem `published-upgrade-survivor`, o artefato do pacote
  é a candidata e `published_upgrade_survivor_baseline` seleciona
  a linha de base publicada. `update-restart-auth` usa o pacote candidato como
  a CLI instalada e o package-under-test para exercitar o caminho de reinicialização
  gerenciada do comando de atualização da candidata.
  Exemplo: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Perfis comuns:
  - `smoke`: lanes de instalação/canal/agente, rede do Gateway e recarregamento de configuração
  - `package`: lanes nativas de artefato para pacote/atualização/reinicialização/plugin sem OpenWebUI ou ClawHub live
  - `product`: perfil de pacote mais canais MCP, limpeza de cron/subagente,
    busca na web da OpenAI e OpenWebUI
  - `full`: partes do caminho de lançamento Docker com OpenWebUI
  - `custom`: seleção exata de `docker_lanes` para uma reexecução focada
- Execute o workflow manual `CI` diretamente quando precisar apenas de cobertura completa do CI normal
  para a candidata de lançamento. Despachos manuais de CI ignoram o escopo por alterações
  e forçam os shards Linux Node, shards de plugins empacotados, contratos de canal,
  compatibilidade com Node 22, `check`, `check-additional`, smoke de build,
  verificações de docs, Skills Python, Windows, macOS, Android e lanes de i18n da Control UI.
  Exemplo: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Execute `pnpm qa:otel:smoke` ao validar a telemetria de lançamento. Ele exercita
  o QA-lab por meio de um receptor OTLP/HTTP local e verifica os nomes de spans
  de traces exportados, atributos limitados e redação de conteúdo/identificador sem
  exigir Opik, Langfuse ou outro coletor externo.
- Execute `pnpm release:check` antes de todo lançamento com tag
- Execute `OpenClaw Release Publish` para a sequência mutável de publicação depois que a
  tag existir. Dispare a partir de `release/YYYY.M.D` (ou `main` ao publicar uma
  tag alcançável a partir de main), passe a tag de lançamento e o
  `preflight_run_id` npm bem-sucedido do OpenClaw, e mantenha o escopo padrão de publicação de plugins
  `all-publishable`, a menos que esteja executando deliberadamente um reparo focado. O
  workflow serializa a publicação npm de plugins, a publicação de plugins no ClawHub e a publicação npm do OpenClaw
  para que o pacote do núcleo não seja publicado antes de seus
  plugins externalizados.
- As verificações de lançamento agora executam em um workflow manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` também executa a lane de paridade mock do QA Lab mais o perfil
  rápido live do Matrix e a lane de QA do Telegram antes da aprovação do lançamento. As lanes live
  usam o ambiente `qa-live-shared`; o Telegram também usa leases de credenciais do Convex CI.
  Execute o workflow manual `QA-Lab - All Lanes` com
  `matrix_profile=all` e `matrix_shards=true` quando quiser o inventário completo de transporte,
  mídia e E2EE do Matrix em paralelo.
- A validação em runtime de instalação e upgrade entre sistemas operacionais faz parte dos
  `OpenClaw Release Checks` e `Full Release Validation` públicos, que chamam diretamente o
  workflow reutilizável
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Esta divisão é intencional: manter o caminho real de lançamento npm curto,
  determinístico e focado em artefatos, enquanto verificações live mais lentas ficam na sua
  própria lane para que não atrasem nem bloqueiem a publicação
- Verificações de lançamento que carregam segredos devem ser despachadas por meio de `Full Release
Validation` ou a partir do ref de workflow `main`/release para que a lógica do workflow e
  os segredos permaneçam controlados
- `OpenClaw Release Checks` aceita uma branch, tag ou SHA completo de commit, desde que
  o commit resolvido seja alcançável a partir de uma branch ou tag de lançamento do OpenClaw
- O preflight somente de validação `OpenClaw NPM Release` também aceita o SHA completo
  atual de 40 caracteres do commit da branch do workflow sem exigir uma tag enviada
- Esse caminho de SHA é somente de validação e não pode ser promovido para uma publicação real
- No modo SHA, o workflow sintetiza `v<package.json version>` apenas para a
  verificação de metadados do pacote; a publicação real ainda exige uma tag real de lançamento
- Ambos os workflows mantêm o caminho real de publicação e promoção em runners hospedados pelo GitHub,
  enquanto o caminho de validação não mutável pode usar os runners Linux maiores
  do Blacksmith
- Esse workflow executa
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando os segredos de workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- O preflight de lançamento npm não espera mais pela lane separada de verificações de lançamento
- Execute `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou a tag beta/correção correspondente) antes da aprovação
- Após a publicação npm, execute
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou a versão beta/correção correspondente) para verificar o caminho de instalação do registry
  publicado em um prefixo temporário limpo
- Após uma publicação beta, execute `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  para verificar onboarding do pacote instalado, configuração do Telegram e E2E real do Telegram
  contra o pacote npm publicado usando o pool compartilhado de credenciais do Telegram em lease.
  Execuções locais pontuais de mantenedores podem omitir as vars do Convex e passar as três
  credenciais de env `OPENCLAW_QA_TELEGRAM_*` diretamente.
- Para executar o smoke beta completo pós-publicação a partir de uma máquina de mantenedor, use `pnpm release:beta-smoke -- --beta betaN`. O helper executa validação de atualização npm/target limpo no Parallels, despacha `NPM Telegram Beta E2E`, monitora a execução exata do workflow, baixa o artefato e imprime o relatório do Telegram.
- Mantenedores podem executar a mesma verificação pós-publicação pelo GitHub Actions por meio do
  workflow manual `NPM Telegram Beta E2E`. Ele é intencionalmente apenas manual e
  não executa a cada merge.
- A automação de lançamento de mantenedores agora usa preflight e depois promoção:
  - a publicação npm real deve passar um `preflight_run_id` npm bem-sucedido
  - a publicação npm real deve ser despachada a partir da mesma branch `main` ou
    `release/YYYY.M.D` que a execução bem-sucedida de preflight
  - lançamentos npm estáveis usam `beta` por padrão
  - publicações npm estáveis podem mirar explicitamente `latest` por meio de input do workflow
  - a mutação de dist-tag npm baseada em token agora vive em
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    por segurança, porque `npm dist-tag add` ainda precisa de `NPM_TOKEN`, enquanto o
    repositório público mantém publicação somente com OIDC
  - o `macOS Release` público é somente de validação; quando uma tag vive apenas em uma
    branch de lançamento, mas o workflow é despachado a partir de `main`, defina
    `public_release_branch=release/YYYY.M.D`
  - a publicação real privada para Mac deve passar por `preflight_run_id` e `validate_run_id`
    privados de Mac bem-sucedidos
  - os caminhos reais de publicação promovem artefatos preparados em vez de reconstruí-los
    novamente
- Para lançamentos legados de correção estável como `YYYY.M.D-N`, o verificador pós-publicação
  também verifica o mesmo caminho de upgrade com prefixo temporário de `YYYY.M.D` para `YYYY.M.D-N`
  para que correções de lançamento não deixem silenciosamente instalações globais mais antigas com o
  payload estável base
- O preflight de lançamento npm falha de modo fechado, a menos que o tarball inclua tanto
  `dist/control-ui/index.html` quanto um payload `dist/control-ui/assets/` não vazio
  para que não enviemos novamente um painel de navegador vazio
- A verificação pós-publicação também verifica se os entrypoints de plugins publicados e
  os metadados de pacote estão presentes no layout instalado do registry. Um lançamento que
  envia payloads ausentes de runtime de plugins falha no verificador pós-publicação e
  não pode ser promovido para `latest`.
- `pnpm test:install:smoke` também impõe o orçamento de `unpackedSize` do pacote npm no
  tarball candidato de atualização, para que o e2e do instalador capture inchaço acidental do pacote
  antes do caminho de publicação do lançamento
- Se o trabalho de lançamento tocou planejamento de CI, manifestos de timing de plugins ou
  matrizes de teste de plugins, regenere e revise as saídas de matriz
  `plugin-prerelease-extension-shard` pertencentes ao planejador a partir de
  `.github/workflows/plugin-prerelease.yml` antes da aprovação para que as notas de lançamento não
  descrevam um layout de CI obsoleto
- A prontidão de lançamento estável para macOS também inclui as superfícies do atualizador:
  - a release do GitHub deve terminar com o `.zip`, `.dmg` e `.dSYM.zip` empacotados
  - `appcast.xml` em `main` deve apontar para o novo zip estável após a publicação
  - o app empacotado deve manter um bundle id sem debug, uma URL de feed do Sparkle
    não vazia e um `CFBundleVersion` igual ou acima do piso canônico de build do Sparkle
    para essa versão de lançamento

## Caixas de teste de lançamento

`Full Release Validation` é como operadores iniciam todos os testes de pré-lançamento a partir de
um único ponto de entrada. Para uma prova de commit fixado em uma branch que muda rapidamente, use o
helper para que todo workflow filho execute a partir de uma branch temporária fixada no SHA
alvo:

```bash
pnpm ci:full-release --sha <full-sha>
```

O helper envia `release-ci/<sha>-...`, despacha `Full Release Validation`
a partir dessa branch com `ref=<sha>`, verifica que todo `headSha` de workflow filho
corresponde ao alvo e então exclui a branch temporária. Isso evita provar por
acidente uma execução filha de `main` mais nova.

Para validação de branch ou tag de lançamento, execute a partir do ref de workflow `main`
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

O workflow resolve o ref de destino, dispara o `CI` manual com
`target_ref=<release-ref>`, dispara `OpenClaw Release Checks`, prepara um
artefato pai `release-package-under-test` para verificações voltadas a pacotes e
dispara o E2E independente de pacote Telegram quando `release_profile=full` com
`rerun_group=all` ou quando `npm_telegram_package_spec` está definido. Em seguida,
`OpenClaw Release Checks` distribui smoke de instalação, verificações de release
entre sistemas operacionais, cobertura live/E2E do caminho de release Docker
quando o soak está habilitado, Package Acceptance com QA de pacote Telegram,
paridade do QA Lab, Matrix live e Telegram live. Uma execução completa só é aceitável quando o
resumo de `Full Release Validation`
mostra `normal_ci` e `release_checks` como bem-sucedidos. No modo full/all,
o filho `npm_telegram` também deve ser bem-sucedido; fora de full/all, ele é ignorado
a menos que um `npm_telegram_package_spec` publicado tenha sido fornecido. O resumo final
do verificador inclui tabelas dos jobs mais lentos para cada execução filha, para que o gerente de release
possa ver o caminho crítico atual sem baixar logs.
Consulte [validação completa de release](/pt-BR/reference/full-release-validation) para a
matriz completa de etapas, nomes exatos dos jobs do workflow, diferenças entre perfis
stable e full, artefatos e identificadores de reexecução focada.
Os workflows filhos são disparados a partir do ref confiável que executa `Full Release
Validation`, normalmente `--ref main`, mesmo quando o `ref` de destino aponta para uma
branch ou tag de release mais antiga. Não há uma entrada separada de ref do workflow
Full Release Validation; escolha o harness confiável escolhendo o ref da execução do workflow.
Não use `--ref main -f ref=<sha>` para prova exata de commit em uma `main` móvel;
SHAs brutos de commit não podem ser refs de despacho de workflow, então use
`pnpm ci:full-release --sha <sha>` para criar a branch temporária fixada.

Use `release_profile` para selecionar a amplitude live/provedor:

- `minimum`: caminho live OpenAI/core e Docker mais rápido e crítico para release
- `stable`: minimum mais cobertura estável de provedor/backend para aprovação de release
- `full`: stable mais cobertura ampla consultiva de provedor/mídia

Use `run_release_soak=true` com `stable` quando as lanes bloqueadoras de release estiverem
verdes e você quiser a varredura exaustiva live/E2E, do caminho de release Docker e
limitada de sobrevivência a upgrades publicados antes da promoção. Essa varredura cobre
os quatro pacotes stable mais recentes, além das linhas de base fixadas `2026.4.23` e `2026.5.2`,
mais a cobertura antiga `2026.4.15`, com linhas de base duplicadas removidas e
cada linha de base fragmentada em seu próprio job de runner Docker. `full` implica
`run_release_soak=true`.

`OpenClaw Release Checks` usa o ref confiável do workflow para resolver o ref de destino
uma vez como `release-package-under-test` e reutiliza esse artefato nas verificações Docker
entre sistemas operacionais, Package Acceptance e de caminho de release quando o soak é executado. Isso mantém
todas as máquinas voltadas a pacotes nos mesmos bytes e evita builds repetidos de pacote.
O smoke de instalação OpenAI entre sistemas operacionais usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando a
variável de repo/org está definida, caso contrário `openai/gpt-5.4`, porque essa lane está
provando instalação de pacote, onboarding, inicialização do Gateway e uma rodada de agente live
em vez de fazer benchmark do modelo padrão mais lento. A matriz live mais ampla de provedores
continua sendo o lugar para cobertura específica de modelos.

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
falhar, use o workflow filho, job, lane Docker, perfil de pacote, provedor de modelo ou lane de QA
com falha para a próxima prova. Execute o guarda-chuva completo novamente apenas quando
a correção alterar a orquestração compartilhada de release ou tornar obsoleta a evidência anterior
de todas as máquinas. O verificador final do guarda-chuva verifica novamente os IDs registrados de execução
dos workflows filhos, então, depois que um workflow filho for reexecutado com sucesso, reexecute apenas o job pai
`Verify full validation` que falhou.

Para recuperação limitada, passe `rerun_group` ao guarda-chuva. `all` é a execução real
de candidato a release, `ci` executa apenas o filho de CI normal, `plugin-prerelease`
executa apenas o filho de Plugin exclusivo de release, `release-checks` executa todas as máquinas
de release, e os grupos de release mais estreitos são `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` e `npm-telegram`.
Reexecuções focadas de `npm-telegram` exigem `npm_telegram_package_spec`; execuções full/all
com `release_profile=full` usam o artefato de pacote de release-checks. Reexecuções focadas
entre sistemas operacionais podem adicionar `cross_os_suite_filter=windows/packaged-upgrade` ou
outro filtro de sistema operacional/suite. Falhas de QA em release-check são consultivas; uma falha somente de QA
não bloqueia a validação de release.

### Vitest

A máquina Vitest é o workflow filho `CI` manual. O CI manual intencionalmente
ignora o escopo de alterações e força o grafo normal de testes para o candidato
a release: shards Linux Node, shards de plugins empacotados, contratos de canais, compatibilidade Node 22,
`check`, `check-additional`, smoke de build, verificações de documentação, Skills Python,
Windows, macOS, Android e i18n da Control UI.

Use esta máquina para responder "a árvore de código-fonte passou no conjunto completo normal de testes?"
Ela não é o mesmo que validação de produto no caminho de release. Evidências a manter:

- resumo de `Full Release Validation` mostrando a URL da execução `CI` disparada
- execução `CI` verde no SHA exato de destino
- nomes de shards com falha ou lentos dos jobs de CI ao investigar regressões
- artefatos de temporização do Vitest, como `.artifacts/vitest-shard-timings.json`, quando
  uma execução precisa de análise de performance

Execute CI manual diretamente apenas quando o release precisar de CI normal determinístico, mas
não das máquinas Docker, QA Lab, live, entre sistemas operacionais ou de pacote:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

A máquina Docker vive em `OpenClaw Release Checks` por meio de
`openclaw-live-and-e2e-checks-reusable.yml`, além do workflow
`install-smoke` em modo de release. Ela valida o candidato a release por meio de ambientes
Docker empacotados em vez de apenas testes em nível de código-fonte.

A cobertura Docker de release inclui:

- smoke completo de instalação com o smoke lento de instalação global Bun habilitado
- preparação/reutilização da imagem de smoke do Dockerfile raiz por SHA de destino, com jobs de smoke de QR,
  raiz/Gateway e instalador/Bun executando como shards separados de install-smoke
- lanes E2E do repositório
- chunks Docker de caminho de release: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` e `plugins-runtime-install-h`
- cobertura OpenWebUI dentro do chunk `plugins-runtime-services` quando solicitada
- lanes separadas de instalação/desinstalação de Plugin empacotado
  `bundled-plugin-install-uninstall-0` até
  `bundled-plugin-install-uninstall-23`
- suítes live/E2E de provedores e cobertura de modelo Docker live quando as release checks
  incluem suítes live

Use artefatos Docker antes de reexecutar. O agendador de caminho de release envia
`.artifacts/docker-tests/` com logs de lane, `summary.json`, `failures.json`,
tempos de fase, JSON do plano do agendador e comandos de reexecução. Para recuperação focada,
use `docker_lanes=<lane[,lane]>` no workflow reutilizável live/E2E em vez de
reexecutar todos os chunks de release. Comandos de reexecução gerados incluem
`package_artifact_run_id` anterior e entradas de imagens Docker preparadas quando disponíveis, para que uma
lane com falha possa reutilizar o mesmo tarball e as imagens GHCR.

### QA Lab

A máquina QA Lab também faz parte de `OpenClaw Release Checks`. Ela é o gate de release
de comportamento agentic e em nível de canal, separado do Vitest e da mecânica de pacote
Docker.

A cobertura QA Lab de release inclui:

- lane de paridade mock comparando a lane candidata OpenAI com a linha de base Opus 4.6
  usando o pacote de paridade agentic
- perfil rápido de QA Matrix live usando o ambiente `qa-live-shared`
- lane de QA Telegram live usando leases de credenciais Convex CI
- `pnpm qa:otel:smoke` quando a telemetria de release precisa de prova local explícita

Use esta máquina para responder "o release se comporta corretamente em cenários de QA e
fluxos de canais live?" Mantenha as URLs de artefatos das lanes de paridade, Matrix e Telegram
ao aprovar o release. A cobertura completa de Matrix continua disponível como uma execução
QA-Lab manual fragmentada, em vez da lane crítica de release padrão.

### Pacote

A máquina de pacote é o gate de produto instalável. Ela é apoiada por
`Package Acceptance` e pelo resolvedor
`scripts/resolve-openclaw-package-candidate.mjs`. O resolvedor normaliza um
candidato no tarball `package-under-test` consumido pelo Docker E2E, valida
o inventário do pacote, registra a versão do pacote e o SHA-256 e mantém o
ref do harness do workflow separado do ref de origem do pacote.

Fontes de candidato compatíveis:

- `source=npm`: `openclaw@beta`, `openclaw@latest` ou uma versão exata de release do OpenClaw
- `source=ref`: empacotar uma branch, tag ou SHA completo de commit `package_ref` confiável
  com o harness `workflow_ref` selecionado
- `source=url`: baixar um `.tgz` HTTPS com `package_sha256` obrigatório
- `source=artifact`: reutilizar um `.tgz` enviado por outra execução do GitHub Actions

`OpenClaw Release Checks` executa Package Acceptance com `source=artifact`, o
artefato preparado de pacote de release, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance mantém migração, atualização,
reinicialização de atualização com autenticação configurada, limpeza de dependências obsoletas de Plugin, fixtures de Plugin
offline, atualização de Plugin e QA de pacote Telegram contra o mesmo tarball resolvido.
Verificações bloqueadoras de release usam a linha de base padrão do pacote publicado mais recente;
`run_release_soak=true` ou
`release_profile=full` expande para cada linha de base stable publicada no npm de
`2026.4.23` até `latest`, além de fixtures de problemas relatados. Use
Package Acceptance com `source=npm` para um candidato já lançado, ou
`source=ref`/`source=artifact` para um tarball npm local apoiado por SHA antes da
publicação. Ele é a substituição nativa do GitHub
para a maior parte da cobertura de pacote/atualização que antes exigia
Parallels. As verificações de release entre sistemas operacionais ainda importam para onboarding,
instalador e comportamento de plataforma específicos de sistema operacional, mas a validação de produto
de pacote/atualização deve preferir Package Acceptance.

A checklist canônica para validação de atualização e Plugin é
[Testando atualizações e plugins](/pt-BR/help/testing-updates-plugins). Use-a ao
decidir qual lane local, Docker, Package Acceptance ou release-check prova uma
instalação/atualização de Plugin, limpeza por doctor ou alteração de migração de pacote publicado.
A migração exaustiva de atualização publicada a partir de cada pacote stable `2026.4.23+` é
um workflow manual `Update Migration` separado, não parte do Full Release CI.

A tolerância legada de aceitação de pacotes é intencionalmente limitada no tempo. Pacotes até
`2026.4.25` podem usar o caminho de compatibilidade para lacunas de metadados já publicadas
no npm: entradas privadas do inventário de QA ausentes do tarball, ausência de
`gateway install --wrapper`, arquivos de patch ausentes no fixture git derivado do tarball,
ausência de `update.channel` persistido, locais legados de registro de instalação de Plugin,
ausência de persistência do registro de instalação do marketplace e migração de metadados de
configuração durante `plugins update`. O pacote `2026.4.26` publicado pode avisar
sobre arquivos locais de carimbo de metadados de build que já foram enviados. Pacotes posteriores
devem satisfazer os contratos modernos de pacote; essas mesmas lacunas falham na validação de
release.

Use perfis mais amplos do Package Acceptance quando a pergunta de release for sobre um
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
- `package`: contratos de instalação/atualização/reinicialização/pacote de Plugin sem ClawHub
  ao vivo; este é o padrão de verificação de release
- `product`: `package` mais canais MCP, limpeza de cron/subagente, busca na web da OpenAI
  e OpenWebUI
- `full`: trechos do caminho de release do Docker com OpenWebUI
- `custom`: lista exata de `docker_lanes` para reexecuções focadas

Para prova de Telegram de candidato a pacote, habilite `telegram_mode=mock-openai` ou
`telegram_mode=live-frontier` no Package Acceptance. O workflow passa o tarball
resolvido `package-under-test` para a lane do Telegram; o workflow independente do
Telegram ainda aceita uma especificação npm publicada para verificações pós-publicação.

## Automação de publicação de release

`OpenClaw Release Publish` é o ponto de entrada mutável normal de publicação. Ele
orquestra os workflows de publicador confiável na ordem necessária para a release:

1. Fazer checkout da tag de release e resolver seu SHA de commit.
2. Verificar se a tag é alcançável a partir de `main` ou `release/*`.
3. Executar `pnpm plugins:sync:check`.
4. Disparar `Plugin NPM Release` com `publish_scope=all-publishable` e
   `ref=<release-sha>`.
5. Disparar `Plugin ClawHub Release` com o mesmo escopo e SHA.
6. Disparar `OpenClaw NPM Release` com a tag de release, a dist-tag do npm e
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
  `v2026.4.2-beta.1`; quando `preflight_only=true`, ela também pode ser o SHA de commit
  completo de 40 caracteres do branch de workflow atual para preflight somente de validação
- `preflight_only`: `true` somente para validação/build/pacote, `false` para o
  caminho de publicação real
- `preflight_run_id`: obrigatório no caminho de publicação real para que o workflow reutilize
  o tarball preparado da execução de preflight bem-sucedida
- `npm_dist_tag`: tag de destino do npm para o caminho de publicação; o padrão é `beta`

`OpenClaw Release Publish` aceita estas entradas controladas pelo operador:

- `tag`: tag de release obrigatória; já deve existir
- `preflight_run_id`: id de execução de preflight bem-sucedida de `OpenClaw NPM Release`;
  obrigatório quando `publish_openclaw_npm=true`
- `npm_dist_tag`: tag de destino do npm para o pacote OpenClaw
- `plugin_publish_scope`: o padrão é `all-publishable`; use `selected` somente
  para trabalho focado de reparo
- `plugins`: nomes de pacotes `@openclaw/*` separados por vírgula quando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: o padrão é `true`; defina como `false` somente ao usar o
  workflow como orquestrador de reparo apenas de Plugin

`OpenClaw Release Checks` aceita estas entradas controladas pelo operador:

- `ref`: branch, tag ou SHA de commit completo a validar. Verificações que contêm segredos
  exigem que o commit resolvido seja alcançável a partir de um branch do OpenClaw ou
  de uma tag de release.
- `run_release_soak`: opte por soak exaustivo ao vivo/E2E, caminho de release do Docker e
  sobrevivente de upgrade desde todas as versões em verificações de release estável/padrão. Ele é forçado
  por `release_profile=full`.

Regras:

- Tags estáveis e de correção podem publicar em `beta` ou `latest`
- Tags de pré-release beta podem publicar somente em `beta`
- Para `OpenClaw NPM Release`, a entrada de SHA de commit completo é permitida somente quando
  `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` são sempre
  somente validação
- O caminho de publicação real deve usar o mesmo `npm_dist_tag` usado durante o preflight;
  o workflow verifica esses metadados antes de continuar a publicação

## Sequência de release estável npm

Ao preparar uma release estável npm:

1. Execute `OpenClaw NPM Release` com `preflight_only=true`
   - Antes de existir uma tag, você pode usar o SHA de commit completo do branch de workflow atual
     para uma execução simulada somente de validação do workflow de preflight
2. Escolha `npm_dist_tag=beta` para o fluxo normal beta-primeiro, ou `latest` somente
   quando você quiser intencionalmente uma publicação estável direta
3. Execute `Full Release Validation` no branch de release, na tag de release ou no SHA de commit
   completo quando quiser CI normal mais cobertura de cache de prompt ao vivo, Docker, QA Lab,
   Matrix e Telegram a partir de um workflow manual
4. Se você intencionalmente precisa apenas do grafo de testes normal determinístico, execute o
   workflow manual `CI` na ref de release
5. Salve o `preflight_run_id` bem-sucedido
6. Execute `OpenClaw Release Publish` com a mesma `tag`, a mesma `npm_dist_tag`
   e o `preflight_run_id` salvo; ele publica plugins externalizados no npm
   e no ClawHub antes de promover o pacote npm do OpenClaw
7. Se a release caiu em `beta`, use o workflow privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover essa versão estável de `beta` para `latest`
8. Se a release foi publicada intencionalmente diretamente em `latest` e `beta`
   deve seguir imediatamente o mesmo build estável, use esse mesmo workflow privado
   para apontar ambas as dist-tags para a versão estável, ou deixe a sincronização agendada
   de autorrecuperação mover `beta` depois

A mutação de dist-tag fica no repositório privado por segurança, porque ela ainda
exige `NPM_TOKEN`, enquanto o repositório público mantém publicação somente com OIDC.

Isso mantém tanto o caminho de publicação direta quanto o caminho de promoção beta-primeiro
documentados e visíveis para o operador.

Se um mantenedor precisar recorrer à autenticação local do npm, execute quaisquer comandos da
CLI do 1Password (`op`) somente dentro de uma sessão tmux dedicada. Não chame `op`
diretamente a partir do shell principal do agente; mantê-lo dentro do tmux torna prompts,
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

Mantenedores usam a documentação privada de release em
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
para o runbook real.

## Relacionado

- [Canais de release](/pt-BR/install/development-channels)
