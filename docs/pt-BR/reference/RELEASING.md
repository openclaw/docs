---
read_when:
    - Procurando definições de canais públicos de lançamento
    - Executando validação de lançamento ou aceitação de pacote
    - Procurando nomenclatura e cadência de versões
summary: Canais de lançamento, lista de verificação do operador, caixas de validação, nomenclatura de versões e cadência
title: Política de lançamento
x-i18n:
    generated_at: "2026-05-06T18:00:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3b9f4875496d7278ba18a8b5cb2735fb870cf32254bfc1fd819e4f233db489e
    source_path: reference/RELEASING.md
    workflow: 16
---

O OpenClaw tem três canais públicos de lançamento:

- estável: releases marcadas que publicam no npm `beta` por padrão, ou no npm `latest` quando solicitado explicitamente
- beta: tags de pré-release que publicam no npm `beta`
- desenvolvimento: a ponta móvel de `main`

## Nomeação de versões

- Versão de release estável: `YYYY.M.D`
  - Tag do Git: `vYYYY.M.D`
- Versão de release estável de correção: `YYYY.M.D-N`
  - Tag do Git: `vYYYY.M.D-N`
- Versão de pré-release beta: `YYYY.M.D-beta.N`
  - Tag do Git: `vYYYY.M.D-beta.N`
- Não preencha mês ou dia com zero à esquerda
- `latest` significa a release npm estável promovida atual
- `beta` significa o alvo de instalação beta atual
- Releases estáveis e releases estáveis de correção publicam no npm `beta` por padrão; operadores de release podem direcionar para `latest` explicitamente, ou promover uma build beta validada depois
- Cada release estável do OpenClaw entrega o pacote npm e o app para macOS juntos;
  releases beta normalmente validam e publicam primeiro o caminho npm/pacote, com
  build/assinatura/notarização do app para Mac reservados para estável, a menos que solicitados explicitamente

## Cadência de releases

- Releases seguem beta primeiro
- Estável vem somente depois que o beta mais recente é validado
- Mantenedores normalmente criam releases a partir de uma branch `release/YYYY.M.D` criada
  a partir do `main` atual, para que a validação e as correções de release não bloqueiem novo
  desenvolvimento em `main`
- Se uma tag beta foi enviada ou publicada e precisa de uma correção, mantenedores criam
  a próxima tag `-beta.N` em vez de excluir ou recriar a tag beta antiga
- Procedimento detalhado de release, aprovações, credenciais e notas de recuperação são
  exclusivos para mantenedores

## Checklist do operador de release

Este checklist é a forma pública do fluxo de release. Credenciais privadas,
assinatura, notarização, recuperação de dist-tag e detalhes de rollback de emergência ficam no
runbook de release exclusivo para mantenedores.

1. Comece pelo `main` atual: puxe o mais recente, confirme que o commit alvo foi enviado
   e confirme que o CI atual de `main` está verde o suficiente para criar a branch a partir dele.
2. Reescreva a seção superior de `CHANGELOG.md` a partir do histórico real de commits com
   `/changelog`, mantenha as entradas voltadas ao usuário, faça commit, faça push e rebase/pull
   mais uma vez antes de criar a branch.
3. Revise os registros de compatibilidade de release em
   `src/plugins/compat/registry.ts` e
   `src/commands/doctor/shared/deprecation-compat.ts`. Remova compatibilidade expirada
   somente quando o caminho de upgrade permanecer coberto, ou registre por que ela está
   sendo mantida intencionalmente.
4. Crie `release/YYYY.M.D` a partir do `main` atual; não faça trabalho normal de release
   diretamente em `main`.
5. Atualize todos os locais de versão obrigatórios para a tag pretendida, execute
   `pnpm plugins:sync` para que pacotes de Plugin publicáveis compartilhem a versão de release
   e os metadados de compatibilidade, então execute o preflight determinístico local:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` e
   `pnpm release:check`.
6. Execute `OpenClaw NPM Release` com `preflight_only=true`. Antes de uma tag existir,
   um SHA completo de 40 caracteres da branch de release é permitido apenas para validação
   de preflight. Salve o `preflight_run_id` bem-sucedido.
7. Inicie todos os testes de pré-release com `Full Release Validation` para a
   branch de release, tag ou SHA completo do commit. Este é o único ponto de entrada manual
   para as quatro grandes caixas de teste de release: Vitest, Docker, QA Lab e Package.
8. Se a validação falhar, corrija na branch de release e execute novamente o menor
   arquivo, canal, job de workflow, perfil de pacote, provedor ou lista de permissões de modelo com falha que
   prove a correção. Reexecute o guarda-chuva completo somente quando a superfície alterada tornar
   evidências anteriores obsoletas.
9. Para beta, marque `vYYYY.M.D-beta.N`, então execute `OpenClaw Release Publish` a partir
   da branch `release/YYYY.M.D` correspondente. Ele verifica `pnpm plugins:sync:check`,
   despacha todos os pacotes de Plugin publicáveis para o npm e o mesmo conjunto para
   ClawHub em paralelo, e então promove o artefato de preflight npm preparado do OpenClaw
   com a dist-tag correspondente assim que a publicação dos Plugins no npm tiver sucesso.
   A publicação no ClawHub ainda pode estar em execução enquanto o npm do OpenClaw publica, mas o
   workflow de publicação de release não termina até que os dois caminhos de publicação de Plugin e
   o caminho de publicação npm do OpenClaw sejam concluídos com sucesso. Após publicar, execute
   a aceitação de pacote pós-publicação
   contra o pacote `openclaw@YYYY.M.D-beta.N` ou
   `openclaw@beta` publicado. Se uma pré-release enviada ou publicada precisar de correção,
   crie o próximo número de pré-release correspondente; não exclua nem reescreva a pré-release antiga.
10. Para estável, continue somente depois que o beta validado ou candidato a release tiver as
    evidências de validação exigidas. A publicação npm estável também passa pelo
    `OpenClaw Release Publish`, reutilizando o artefato de preflight bem-sucedido via
    `preflight_run_id`; a prontidão da release macOS estável também requer os
    arquivos `.zip`, `.dmg`, `.dSYM.zip` empacotados e o `appcast.xml` atualizado em `main`.
11. Após publicar, execute o verificador npm pós-publicação, o E2E Telegram opcional
    independente do npm publicado quando precisar de prova de canal pós-publicação,
    promoção de dist-tag quando necessário, notas de release/pré-release do GitHub a partir da
    seção completa correspondente de `CHANGELOG.md` e as etapas de anúncio da release.

## Preflight de release

- Execute `pnpm check:test-types` antes do preflight de release para que o TypeScript de teste continue coberto fora do gate local mais rápido `pnpm check`
- Execute `pnpm check:architecture` antes do preflight de release para que as verificações mais amplas de ciclos de importação e limites de arquitetura fiquem verdes fora do gate local mais rápido
- Execute `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que os artefatos de release esperados em `dist/*` e o pacote da Control UI existam para a etapa de validação do pacote
- Execute `pnpm plugins:sync` depois do bump da versão raiz e antes de criar a tag. Ele atualiza as versões dos pacotes de plugins publicáveis, os metadados de compatibilidade de peer/API do OpenClaw, os metadados de build e os stubs de changelog de plugins para corresponder à versão de release do core. `pnpm plugins:sync:check` é a guarda de release não mutável; o workflow de publicação falha antes de qualquer mutação de registry se esta etapa tiver sido esquecida.
- Execute o workflow manual `Full Release Validation` antes da aprovação da release para iniciar todas as caixas de teste de pré-release a partir de um único ponto de entrada. Ele aceita uma branch, tag ou SHA completo de commit, dispara `CI` manual e dispara `OpenClaw Release Checks` para smoke de instalação, aceitação de pacote, verificações de pacote entre sistemas operacionais, paridade do QA Lab, Matrix e lanes do Telegram. Execuções estáveis/padrão mantêm o soak exaustivo live/E2E e do caminho de release Docker atrás de `run_release_soak=true`; `release_profile=full` força o soak. Com `release_profile=full` e `rerun_group=all`, ele também executa E2E de pacote do Telegram contra o artefato `release-package-under-test` das verificações de release. Forneça `npm_telegram_package_spec` depois da publicação quando o mesmo E2E do Telegram também deve comprovar o pacote npm publicado. Forneça `package_acceptance_package_spec` depois da publicação quando Package Acceptance deve executar sua matriz de pacote/atualização contra o pacote npm entregue em vez do artefato criado a partir do SHA. Forneça `evidence_package_spec` quando o relatório privado de evidências deve comprovar que a validação corresponde a um pacote npm publicado sem forçar E2E do Telegram. Exemplo:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Execute o workflow manual `Package Acceptance` quando quiser prova por canal lateral para um candidato de pacote enquanto o trabalho de release continua. Use `source=npm` para `openclaw@beta`, `openclaw@latest` ou uma versão exata de release; `source=ref` para empacotar uma branch/tag/SHA confiável de `package_ref` com o harness atual de `workflow_ref`; `source=url` para um tarball HTTPS com SHA-256 obrigatório; ou `source=artifact` para um tarball enviado por outra execução do GitHub Actions. O workflow resolve o candidato para `package-under-test`, reutiliza o agendador de release Docker E2E contra esse tarball e pode executar QA do Telegram contra o mesmo tarball com `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`. Quando as lanes Docker selecionadas incluem `published-upgrade-survivor`, o artefato de pacote é o candidato e `published_upgrade_survivor_baseline` seleciona a baseline publicada. `update-restart-auth` usa o pacote candidato tanto como a CLI instalada quanto como o package-under-test para exercitar o caminho de reinicialização gerenciada do comando de atualização candidato.
  Exemplo: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Perfis comuns:
  - `smoke`: lanes de instalação/canal/agente, rede do gateway e recarregamento de configuração
  - `package`: lanes nativas de artefato para pacote/atualização/reinicialização/plugin sem OpenWebUI ou ClawHub live
  - `product`: perfil de pacote mais canais MCP, limpeza de cron/subagente, pesquisa web da OpenAI e OpenWebUI
  - `full`: partes do caminho de release Docker com OpenWebUI
  - `custom`: seleção exata de `docker_lanes` para uma reexecução focada
- Execute o workflow manual `CI` diretamente quando precisar apenas de cobertura completa da CI normal para o candidato de release. Disparos manuais de CI ignoram o escopo por mudanças e forçam os shards Linux Node, shards de plugins agrupados, contratos de canal, compatibilidade com Node 22, `check`, `check-additional`, smoke de build, verificações de docs, Python skills, Windows, macOS, Android e lanes de i18n da Control UI.
  Exemplo: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Execute `pnpm qa:otel:smoke` ao validar a telemetria de release. Ele exercita o QA-lab por meio de um receptor OTLP/HTTP local e verifica os nomes de spans de trace exportados, atributos limitados e redação de conteúdo/identificador sem exigir Opik, Langfuse ou outro coletor externo.
- Execute `pnpm release:check` antes de cada release com tag
- Execute `OpenClaw Release Publish` para a sequência mutável de publicação depois que a tag existir. Dispare-o a partir de `release/YYYY.M.D` (ou `main` ao publicar uma tag alcançável a partir de main), passe a tag de release e o `preflight_run_id` bem-sucedido do npm do OpenClaw, e mantenha o escopo padrão de publicação de plugins `all-publishable`, a menos que você esteja deliberadamente executando um reparo focado. O workflow serializa a publicação de plugins no npm, a publicação de plugins no ClawHub e a publicação do OpenClaw no npm para que o pacote core não seja publicado antes de seus plugins externalizados.
- As verificações de release agora executam em um workflow manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` também executa a lane de paridade mock do QA Lab, além do perfil live rápido do Matrix e da lane de QA do Telegram antes da aprovação da release. As lanes live usam o ambiente `qa-live-shared`; o Telegram também usa leases de credenciais da CI do Convex. Execute o workflow manual `QA-Lab - All Lanes` com `matrix_profile=all` e `matrix_shards=true` quando quiser o inventário completo de transporte, mídia e E2EE do Matrix em paralelo.
- A validação de runtime de instalação e upgrade entre sistemas operacionais faz parte de `OpenClaw Release Checks` público e `Full Release Validation`, que chamam diretamente o workflow reutilizável `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Essa divisão é intencional: mantenha o caminho real de release npm curto, determinístico e focado em artefatos, enquanto verificações live mais lentas permanecem em sua própria lane para não atrasar nem bloquear a publicação
- Verificações de release que carregam segredos devem ser disparadas por meio de `Full Release Validation` ou a partir da ref de workflow `main`/release para que a lógica do workflow e os segredos permaneçam controlados
- `OpenClaw Release Checks` aceita uma branch, tag ou SHA completo de commit, desde que o commit resolvido seja alcançável a partir de uma branch do OpenClaw ou tag de release
- O preflight somente de validação de `OpenClaw NPM Release` também aceita o SHA completo de 40 caracteres do commit atual da branch do workflow sem exigir uma tag enviada
- Esse caminho por SHA é somente para validação e não pode ser promovido para uma publicação real
- No modo SHA, o workflow sintetiza `v<package.json version>` apenas para a verificação de metadados do pacote; a publicação real ainda exige uma tag real de release
- Ambos os workflows mantêm o caminho real de publicação e promoção em runners hospedados pelo GitHub, enquanto o caminho de validação não mutável pode usar os runners Linux maiores do Blacksmith
- Esse workflow executa `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` usando os segredos de workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- O preflight de release npm não espera mais pela lane separada de verificações de release
- Execute `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts` (ou a tag beta/correção correspondente) antes da aprovação
- Depois da publicação no npm, execute `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D` (ou a versão beta/correção correspondente) para verificar o caminho de instalação do registry publicado em um prefixo temporário novo
- Depois de uma publicação beta, execute `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` para verificar onboarding de pacote instalado, configuração do Telegram e E2E real do Telegram contra o pacote npm publicado usando o pool compartilhado de credenciais alugadas do Telegram. Execuções locais pontuais de mantenedores podem omitir as vars do Convex e passar diretamente as três credenciais de env `OPENCLAW_QA_TELEGRAM_*`.
- Para executar o smoke beta completo pós-publicação a partir da máquina de um mantenedor, use `pnpm release:beta-smoke -- --beta betaN`. O helper executa a validação de atualização npm/fresh-target no Parallels, dispara `NPM Telegram Beta E2E`, consulta a execução exata do workflow, baixa o artefato e imprime o relatório do Telegram.
- Mantenedores podem executar a mesma verificação pós-publicação pelo GitHub Actions via workflow manual `NPM Telegram Beta E2E`. Ele é intencionalmente apenas manual e não executa a cada merge.
- A automação de release de mantenedores agora usa preflight-e-depois-promote:
  - a publicação npm real deve passar um `preflight_run_id` npm bem-sucedido
  - a publicação npm real deve ser disparada a partir da mesma branch `main` ou `release/YYYY.M.D` da execução de preflight bem-sucedida
  - releases npm estáveis usam `beta` por padrão
  - a publicação npm estável pode direcionar para `latest` explicitamente via entrada do workflow
  - a mutação de dist-tag npm baseada em token agora fica em `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` por segurança, porque `npm dist-tag add` ainda precisa de `NPM_TOKEN`, enquanto o repo público mantém publicação somente por OIDC
  - `macOS Release` público é somente de validação; quando uma tag existe apenas em uma branch de release, mas o workflow é disparado a partir de `main`, defina `public_release_branch=release/YYYY.M.D`
  - a publicação mac privada real deve passar em `preflight_run_id` e `validate_run_id` mac privados bem-sucedidos
  - os caminhos de publicação real promovem artefatos preparados em vez de reconstruí-los novamente
- Para releases estáveis de correção como `YYYY.M.D-N`, o verificador pós-publicação também verifica o mesmo caminho de upgrade com prefixo temporário de `YYYY.M.D` para `YYYY.M.D-N`, para que correções de release não possam deixar silenciosamente instalações globais antigas no payload estável base
- O preflight de release npm falha fechado a menos que o tarball inclua tanto `dist/control-ui/index.html` quanto um payload não vazio em `dist/control-ui/assets/`, para que não entreguemos novamente um painel de navegador vazio
- A verificação pós-publicação também confere se os entrypoints de plugins publicados e os metadados de pacote estão presentes no layout do registry instalado. Uma release que entrega payloads de runtime de plugins ausentes falha no verificador pós-publicação e não pode ser promovida para `latest`.
- `pnpm test:install:smoke` também aplica o orçamento de `unpackedSize` do npm pack ao tarball candidato de atualização, para que o e2e do instalador detecte aumento acidental do pacote antes do caminho de publicação da release
- Se o trabalho de release tocou no planejamento de CI, manifests de timing de extensões ou matrizes de teste de extensões, regenere e revise antes da aprovação as saídas de matriz `plugin-prerelease-extension-shard` pertencentes ao planejador em `.github/workflows/plugin-prerelease.yml`, para que as notas de release não descrevam um layout de CI obsoleto
- A prontidão de release estável do macOS também inclui as superfícies do atualizador:
  - a release do GitHub deve acabar com os pacotes `.zip`, `.dmg` e `.dSYM.zip`
  - `appcast.xml` em `main` deve apontar para o novo zip estável depois da publicação
  - o app empacotado deve manter um bundle id não debug, uma URL de feed Sparkle não vazia e um `CFBundleVersion` igual ou superior ao piso canônico de build Sparkle para essa versão de release

## Caixas de teste de release

`Full Release Validation` é como operadores iniciam todos os testes de pré-release a partir de um único ponto de entrada. Para uma prova de commit fixado em uma branch que se move rapidamente, use o helper para que cada workflow filho execute a partir de uma branch temporária fixada no SHA alvo:

```bash
pnpm ci:full-release --sha <full-sha>
```

O helper envia `release-ci/<sha>-...`, dispara `Full Release Validation` a partir dessa branch com `ref=<sha>`, verifica se cada `headSha` de workflow filho corresponde ao alvo e então exclui a branch temporária. Isso evita comprovar acidentalmente uma execução filha mais nova de `main`.

Para validação de branch ou tag de release, execute-a a partir da ref confiável de workflow `main` e passe a branch ou tag de release como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

O fluxo de trabalho resolve a ref de destino, dispara o `CI` manual com
`target_ref=<release-ref>`, dispara `OpenClaw Release Checks`, prepara um
artefato pai `release-package-under-test` para verificações voltadas a pacotes e
dispara o E2E autônomo do pacote Telegram quando `release_profile=full` com
`rerun_group=all` ou quando `npm_telegram_package_spec` está definido. Em seguida,
`OpenClaw Release Checks` distribui a execução entre smoke de instalação,
verificações de release entre sistemas operacionais, cobertura live/E2E do caminho
de release do Docker quando o soak está habilitado, Package Acceptance com QA do
pacote Telegram, paridade do QA Lab, Matrix live e Telegram live. Uma execução
completa só é aceitável quando o resumo de `Full Release Validation` mostra
`normal_ci` e `release_checks` como bem-sucedidos. No modo full/all, o filho
`npm_telegram` também precisa ser bem-sucedido; fora de full/all, ele é ignorado,
a menos que um `npm_telegram_package_spec` publicado tenha sido fornecido. O
resumo final do verificador inclui tabelas dos jobs mais lentos de cada execução
filha, para que o gerente de release possa ver o caminho crítico atual sem baixar
logs. Consulte [Validação completa de release](/pt-BR/reference/full-release-validation)
para a matriz completa de estágios, os nomes exatos dos jobs do fluxo de
trabalho, as diferenças entre os perfis stable e full, artefatos e identificadores
de reexecução focada. Os fluxos de trabalho filhos são disparados a partir da ref
confiável que executa `Full Release Validation`, normalmente `--ref main`, mesmo
quando a `ref` de destino aponta para um branch ou tag de release mais antigo. Não
há uma entrada separada de ref do fluxo de trabalho para Full Release Validation;
escolha o harness confiável escolhendo a ref da execução do fluxo de trabalho. Não
use `--ref main -f ref=<sha>` para prova exata de commit em uma `main` móvel; SHAs
brutos de commit não podem ser refs de despacho de fluxo de trabalho, então use
`pnpm ci:full-release --sha <sha>` para criar o branch temporário fixado.

Use `release_profile` para selecionar a amplitude live/provedor:

- `minimum`: caminho mais rápido crítico para release com OpenAI/core live e Docker
- `stable`: minimum mais cobertura estável de provedor/backend para aprovação de release
- `full`: stable mais cobertura ampla consultiva de provedor/mídia

Use `run_release_soak=true` com `stable` quando as lanes bloqueadoras de release
estiverem verdes e você quiser a varredura exaustiva live/E2E, do caminho de
release do Docker e limitada de sobrevivência a upgrades publicados antes da
promoção. Essa varredura cobre os quatro pacotes estáveis mais recentes, além das
baselines fixadas `2026.4.23` e `2026.5.2`, mais cobertura mais antiga de
`2026.4.15`, com baselines duplicadas removidas e cada baseline dividida em seu
próprio job executor Docker. `full` implica `run_release_soak=true`.

`OpenClaw Release Checks` usa a ref confiável do fluxo de trabalho para resolver a
ref de destino uma vez como `release-package-under-test` e reutiliza esse artefato
nas verificações entre sistemas operacionais, Package Acceptance e Docker de
caminho de release quando o soak é executado. Isso mantém todas as caixas voltadas
a pacotes nos mesmos bytes e evita builds repetidos de pacote. O smoke de
instalação OpenAI entre sistemas operacionais usa `OPENCLAW_CROSS_OS_OPENAI_MODEL`
quando a variável de repo/org está definida; caso contrário, usa
`openai/gpt-5.4`, porque essa lane prova instalação do pacote, onboarding,
inicialização do Gateway e uma interação live de agente, em vez de fazer benchmark
do modelo padrão mais lento. A matriz live mais ampla de provedores continua sendo
o lugar para cobertura específica de modelo.

Use estas variantes dependendo do estágio do release:

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
focada. Se uma caixa falhar, use o fluxo de trabalho filho, job, lane Docker,
perfil de pacote, provedor de modelo ou lane de QA que falhou para a próxima
prova. Execute o guarda-chuva completo novamente apenas quando a correção tiver
alterado a orquestração compartilhada de release ou tornado obsoleta a evidência
anterior de todas as caixas. O verificador final do guarda-chuva verifica
novamente os IDs registrados das execuções de fluxos de trabalho filhos, então,
depois que um fluxo de trabalho filho for reexecutado com sucesso, reexecute
apenas o job pai `Verify full validation` que falhou.

Para recuperação limitada, passe `rerun_group` ao guarda-chuva. `all` é a execução
real de candidato a release, `ci` executa apenas o filho de CI normal,
`plugin-prerelease` executa apenas o filho de plugin exclusivo de release,
`release-checks` executa todas as caixas de release, e os grupos de release mais
estreitos são `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`,
`qa-parity`, `qa-live` e `npm-telegram`. Reexecuções focadas de `npm-telegram`
exigem `npm_telegram_package_spec`; execuções full/all com `release_profile=full`
usam o artefato de pacote de release-checks. Reexecuções focadas entre sistemas
operacionais podem adicionar `cross_os_suite_filter=windows/packaged-upgrade` ou
outro filtro de SO/suíte. Falhas de QA em release-checks são consultivas; uma
falha somente de QA não bloqueia a validação de release.

### Vitest

A caixa Vitest é o fluxo de trabalho filho `CI` manual. O CI manual ignora
intencionalmente o escopo por alterações e força o grafo normal de testes para o
candidato a release: shards Linux Node, shards de plugins empacotados, contratos
de canais, compatibilidade com Node 22, `check`, `check-additional`, smoke de
build, verificações de docs, Skills Python, Windows, macOS, Android e i18n da
Control UI.

Use esta caixa para responder "a árvore de código-fonte passou na suíte completa
normal de testes?" Ela não é o mesmo que validação de produto no caminho de
release. Evidências a manter:

- resumo de `Full Release Validation` mostrando a URL da execução de `CI` disparada
- execução de `CI` verde no SHA exato de destino
- nomes de shards com falha ou lentos dos jobs de CI ao investigar regressões
- artefatos de tempo do Vitest, como `.artifacts/vitest-shard-timings.json`, quando
  uma execução precisa de análise de desempenho

Execute o CI manual diretamente apenas quando o release precisar de CI normal
determinístico, mas não das caixas Docker, QA Lab, live, entre sistemas
operacionais ou de pacote:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

A caixa Docker fica em `OpenClaw Release Checks` por meio de
`openclaw-live-and-e2e-checks-reusable.yml`, além do fluxo de trabalho
`install-smoke` em modo release. Ela valida o candidato a release por meio de
ambientes Docker empacotados, em vez de apenas testes em nível de código-fonte.

A cobertura Docker de release inclui:

- smoke de instalação completo com o smoke lento de instalação global do Bun habilitado
- preparação/reutilização da imagem de smoke do Dockerfile raiz por SHA de destino,
  com jobs de QR, root/Gateway e instalador/Bun smoke executando como shards
  separados de install-smoke
- lanes E2E do repositório
- chunks Docker de caminho de release: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` e `plugins-runtime-install-h`
- cobertura do OpenWebUI dentro do chunk `plugins-runtime-services` quando solicitada
- lanes divididas de instalação/desinstalação de plugins empacotados
  `bundled-plugin-install-uninstall-0` até
  `bundled-plugin-install-uninstall-23`
- suítes live/E2E de provedores e cobertura de modelo live Docker quando as
  verificações de release incluem suítes live

Use artefatos Docker antes de reexecutar. O agendador de caminho de release envia
`.artifacts/docker-tests/` com logs de lanes, `summary.json`, `failures.json`,
tempos de fases, JSON do plano do agendador e comandos de reexecução. Para
recuperação focada, use `docker_lanes=<lane[,lane]>` no fluxo de trabalho
reutilizável live/E2E em vez de reexecutar todos os chunks de release. Comandos
de reexecução gerados incluem `package_artifact_run_id` anterior e entradas de
imagens Docker preparadas quando disponíveis, para que uma lane com falha possa
reutilizar o mesmo tarball e imagens GHCR.

### QA Lab

A caixa QA Lab também faz parte de `OpenClaw Release Checks`. Ela é o gate de
release de comportamento agêntico e em nível de canal, separado da mecânica de
pacotes do Vitest e Docker.

A cobertura do QA Lab de release inclui:

- lane de paridade mock comparando a lane candidata OpenAI com a baseline Opus 4.6
  usando o pacote de paridade agêntica
- perfil rápido de QA Matrix live usando o ambiente `qa-live-shared`
- lane de QA Telegram live usando concessões de credenciais Convex CI
- `pnpm qa:otel:smoke` quando a telemetria de release precisa de prova local explícita

Use esta caixa para responder "o release se comporta corretamente em cenários de
QA e fluxos de canais live?" Mantenha as URLs de artefatos para lanes de paridade,
Matrix e Telegram ao aprovar o release. A cobertura completa do Matrix continua
disponível como uma execução manual fragmentada do QA-Lab, em vez da lane crítica
padrão de release.

### Pacote

A caixa Pacote é o gate do produto instalável. Ela é apoiada por
`Package Acceptance` e pelo resolvedor
`scripts/resolve-openclaw-package-candidate.mjs`. O resolvedor normaliza um
candidato no tarball `package-under-test` consumido pelo Docker E2E, valida o
inventário do pacote, registra a versão do pacote e o SHA-256 e mantém a ref do
harness do fluxo de trabalho separada da ref de origem do pacote.

Fontes de candidatos compatíveis:

- `source=npm`: `openclaw@beta`, `openclaw@latest` ou uma versão exata de release do OpenClaw
- `source=ref`: empacota um branch, tag ou SHA completo de commit de `package_ref`
  confiável com o harness `workflow_ref` selecionado
- `source=url`: baixa um `.tgz` HTTPS com `package_sha256` obrigatório
- `source=artifact`: reutiliza um `.tgz` enviado por outra execução do GitHub Actions

`OpenClaw Release Checks` executa Package Acceptance com `source=artifact`, o
artefato preparado de pacote de release, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance mantém migração, atualização,
reinicialização de atualização com auth configurada, limpeza de dependência
obsoleta de plugin, fixtures de plugin offline, atualização de plugin e QA do
pacote Telegram contra o mesmo tarball resolvido. Verificações bloqueadoras de
release usam a baseline padrão do pacote publicado mais recente; `run_release_soak=true`
ou `release_profile=full` expande para todas as baselines estáveis publicadas no
npm de `2026.4.23` até `latest`, além de fixtures de issues relatadas. Use Package
Acceptance com `source=npm` para um candidato já lançado, ou `source=ref`/`source=artifact`
para um tarball npm local respaldado por SHA antes da publicação. Ele é o
substituto nativo do GitHub para a maior parte da cobertura de pacote/atualização
que antes exigia Parallels. Verificações de release entre sistemas operacionais
ainda importam para onboarding, instalador e comportamento de plataforma
específicos de SO, mas a validação de produto de pacote/atualização deve preferir
Package Acceptance.

A checklist canônica para validação de atualização e plugin é
[Testando atualizações e plugins](/pt-BR/help/testing-updates-plugins). Use-a ao decidir
qual lane local, Docker, Package Acceptance ou release-check prova uma mudança de
instalação/atualização de plugin, limpeza do doctor ou migração de pacote
publicado. A migração exaustiva de atualização publicada a partir de todos os
pacotes estáveis `2026.4.23+` é um fluxo de trabalho manual separado `Update Migration`,
não parte do Full Release CI.

A leniência legada de aceitação de pacotes é intencionalmente limitada no tempo. Pacotes até
`2026.4.25` podem usar o caminho de compatibilidade para lacunas de metadados já publicadas
no npm: entradas privadas do inventário de QA ausentes no tarball, ausência de
`gateway install --wrapper`, arquivos de patch ausentes no fixture git derivado do tarball,
ausência de `update.channel` persistido, locais legados de registro de instalação de plugins,
ausência de persistência do registro de instalação do marketplace e migração de metadados de configuração
durante `plugins update`. O pacote `2026.4.26` publicado pode avisar
sobre arquivos locais de carimbo de metadados de build que já foram distribuídos. Pacotes posteriores
devem satisfazer os contratos de pacote modernos; essas mesmas lacunas falham na validação
de lançamento.

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

- `smoke`: lanes rápidas de instalação de pacote/canal/agente, rede do gateway e
  recarregamento de configuração
- `package`: contratos de instalação/atualização/reinicialização/pacote de plugin sem ClawHub
  ao vivo; este é o padrão da verificação de lançamento
- `product`: `package` mais canais MCP, limpeza de cron/subagente, pesquisa web da OpenAI
  e OpenWebUI
- `full`: partes do caminho de lançamento do Docker com OpenWebUI
- `custom`: lista exata de `docker_lanes` para reexecuções focadas

Para prova de Telegram de candidato a pacote, habilite `telegram_mode=mock-openai` ou
`telegram_mode=live-frontier` no Package Acceptance. O workflow passa o tarball
`package-under-test` resolvido para a lane do Telegram; o workflow independente do
Telegram ainda aceita uma especificação npm publicada para verificações pós-publicação.

## Automação de publicação de lançamento

`OpenClaw Release Publish` é o ponto de entrada mutável normal de publicação. Ele
orquestra os workflows de publicador confiável na ordem que o lançamento precisa:

1. Fazer checkout da tag de lançamento e resolver seu SHA de commit.
2. Verificar se a tag é alcançável a partir de `main` ou `release/*`.
3. Executar `pnpm plugins:sync:check`.
4. Disparar `Plugin NPM Release` com `publish_scope=all-publishable` e
   `ref=<release-sha>`.
5. Disparar `Plugin ClawHub Release` com o mesmo escopo e SHA.
6. Disparar `OpenClaw NPM Release` com a tag de lançamento, a dist-tag do npm e
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
somente para reparo focado ou republicação. Para um reparo de plugin selecionado, passe
`plugin_publish_scope=selected` e `plugins=@openclaw/name` para
`OpenClaw Release Publish`, ou dispare o workflow filho diretamente quando o pacote
OpenClaw não deve ser publicado.

## Entradas do workflow NPM

`OpenClaw NPM Release` aceita estas entradas controladas pelo operador:

- `tag`: tag de lançamento obrigatória, como `v2026.4.2`, `v2026.4.2-1` ou
  `v2026.4.2-beta.1`; quando `preflight_only=true`, ela também pode ser o SHA de commit completo
  de 40 caracteres do branch de workflow atual para preflight apenas de validação
- `preflight_only`: `true` somente para validação/build/pacote, `false` para o
  caminho real de publicação
- `preflight_run_id`: obrigatório no caminho real de publicação para que o workflow reutilize
  o tarball preparado da execução de preflight bem-sucedida
- `npm_dist_tag`: tag npm de destino para o caminho de publicação; o padrão é `beta`

`OpenClaw Release Publish` aceita estas entradas controladas pelo operador:

- `tag`: tag de lançamento obrigatória; já deve existir
- `preflight_run_id`: id da execução de preflight bem-sucedida de `OpenClaw NPM Release`;
  obrigatório quando `publish_openclaw_npm=true`
- `npm_dist_tag`: tag npm de destino para o pacote OpenClaw
- `plugin_publish_scope`: o padrão é `all-publishable`; use `selected` somente
  para trabalho de reparo focado
- `plugins`: nomes de pacotes `@openclaw/*` separados por vírgula quando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: o padrão é `true`; defina como `false` somente ao usar o
  workflow como orquestrador de reparo apenas de plugins

`OpenClaw Release Checks` aceita estas entradas controladas pelo operador:

- `ref`: branch, tag ou SHA de commit completo a validar. Verificações que usam segredos
  exigem que o commit resolvido seja alcançável a partir de um branch OpenClaw ou
  tag de lançamento.
- `run_release_soak`: opta por soak exaustivo ao vivo/E2E, caminho de lançamento do Docker e
  all-since upgrade-survivor em verificações estáveis/padrão de lançamento. Ele é forçado
  por `release_profile=full`.

Regras:

- Tags estáveis e de correção podem publicar em `beta` ou `latest`
- Tags beta de pré-lançamento podem publicar somente em `beta`
- Para `OpenClaw NPM Release`, a entrada de SHA de commit completo é permitida somente quando
  `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` são sempre
  apenas validação
- O caminho real de publicação deve usar o mesmo `npm_dist_tag` usado durante o preflight;
  o workflow verifica esses metadados antes que a publicação continue

## Sequência de lançamento npm estável

Ao preparar um lançamento npm estável:

1. Execute `OpenClaw NPM Release` com `preflight_only=true`
   - Antes de uma tag existir, você pode usar o SHA de commit completo do branch de workflow
     atual para uma simulação apenas de validação do workflow de preflight
2. Escolha `npm_dist_tag=beta` para o fluxo normal beta-primeiro, ou `latest` somente
   quando você quiser intencionalmente uma publicação estável direta
3. Execute `Full Release Validation` no branch de lançamento, na tag de lançamento ou no SHA
   de commit completo quando quiser CI normal mais cache de prompt ao vivo, Docker, QA Lab,
   Matrix e cobertura de Telegram em um workflow manual
4. Se você intencionalmente precisa apenas do grafo de testes normal determinístico, execute o
   workflow manual `CI` na ref de lançamento
5. Salve o `preflight_run_id` bem-sucedido
6. Execute `OpenClaw Release Publish` com a mesma `tag`, o mesmo `npm_dist_tag`
   e o `preflight_run_id` salvo; ele publica plugins externalizados no npm
   e no ClawHub antes de promover o pacote npm OpenClaw
7. Se o lançamento chegou em `beta`, use o workflow privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover essa versão estável de `beta` para `latest`
8. Se o lançamento publicou intencionalmente diretamente em `latest` e `beta`
   deve seguir a mesma build estável imediatamente, use esse mesmo workflow privado
   para apontar ambas as dist-tags para a versão estável, ou deixe a sincronização agendada
   de autocorreção mover `beta` depois

A mutação de dist-tag fica no repositório privado por segurança, porque ela ainda
exige `NPM_TOKEN`, enquanto o repositório público mantém publicação somente via OIDC.

Isso mantém o caminho de publicação direta e o caminho de promoção beta-primeiro ambos
documentados e visíveis ao operador.

Se um mantenedor precisar recorrer à autenticação npm local, execute quaisquer comandos da CLI
1Password (`op`) somente dentro de uma sessão tmux dedicada. Não chame `op`
diretamente do shell principal do agente; mantê-lo dentro do tmux torna prompts,
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

Mantenedores usam a documentação privada de lançamento em
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
para o runbook real.

## Relacionado

- [Canais de lançamento](/pt-BR/install/development-channels)
