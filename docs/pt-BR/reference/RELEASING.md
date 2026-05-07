---
read_when:
    - Procurando definições de canais públicos de lançamento
    - Executando validação de lançamento ou aceitação de pacote
    - Procurando nomenclatura e cadência de versões
summary: Faixas de lançamento, lista de verificação do operador, caixas de validação, nomenclatura de versões e cadência
title: Política de lançamento
x-i18n:
    generated_at: "2026-05-07T15:08:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6843c7bd0d0a4f3815661f7d392ae7e60b0485a03f1cc53a4c3f13ad3e9a5f8
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw tem três faixas de lançamento públicas:

- stable: lançamentos marcados por tag que publicam no npm `beta` por padrão, ou no npm `latest` quando solicitado explicitamente
- beta: tags de pré-lançamento que publicam no npm `beta`
- dev: a ponta móvel de `main`

## Nomenclatura de versões

- Versão de lançamento estável: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versão de lançamento de correção estável: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versão de pré-lançamento beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Não preencha mês nem dia com zero à esquerda
- `latest` significa o lançamento npm estável promovido atual
- `beta` significa o destino atual de instalação beta
- Lançamentos estáveis e lançamentos de correção estável publicam no npm `beta` por padrão; operadores de lançamento podem mirar `latest` explicitamente, ou promover uma build beta validada posteriormente
- Todo lançamento estável do OpenClaw entrega o pacote npm e o aplicativo macOS juntos;
  lançamentos beta normalmente validam e publicam primeiro o caminho npm/pacote, com
  build/assinatura/notarização do app mac reservados para estável, salvo solicitação explícita

## Cadência de lançamentos

- Lançamentos avançam com beta primeiro
- Estável vem somente depois que o beta mais recente é validado
- Mantenedores normalmente fazem lançamentos a partir de um branch `release/YYYY.M.D` criado
  a partir do `main` atual, para que validação e correções de lançamento não bloqueiem novo
  desenvolvimento no `main`
- Se uma tag beta foi enviada ou publicada e precisa de uma correção, mantenedores criam
  a próxima tag `-beta.N` em vez de excluir ou recriar a tag beta antiga
- Procedimento detalhado de lançamento, aprovações, credenciais e notas de recuperação são
  exclusivos para mantenedores

## Checklist do operador de lançamento

Este checklist é o formato público do fluxo de lançamento. Credenciais privadas,
assinatura, notarização, recuperação de dist-tag e detalhes de rollback de emergência ficam no
runbook de lançamento exclusivo para mantenedores.

1. Comece pelo `main` atual: puxe a versão mais recente, confirme que o commit de destino foi enviado
   e confirme que o CI atual do `main` está verde o suficiente para criar um branch a partir dele.
2. Reescreva a seção superior de `CHANGELOG.md` a partir do histórico real de commits com
   `/changelog`, mantenha as entradas voltadas ao usuário, faça commit, envie e faça rebase/pull
   mais uma vez antes de criar o branch.
3. Revise os registros de compatibilidade de lançamento em
   `src/plugins/compat/registry.ts` e
   `src/commands/doctor/shared/deprecation-compat.ts`. Remova compatibilidade expirada
   somente quando o caminho de upgrade continuar coberto, ou registre por que ela está
   sendo mantida intencionalmente.
4. Crie `release/YYYY.M.D` a partir do `main` atual; não faça trabalho normal de lançamento
   diretamente no `main`.
5. Atualize todos os locais de versão necessários para a tag pretendida e execute
   `pnpm release:prep`. Ele atualiza versões de plugins, inventário de plugins, esquema de
   configuração, metadados de configuração de canal empacotado, baseline de docs de configuração,
   exports do SDK de Plugin e baseline de API do SDK de Plugin na ordem correta. Faça commit de
   qualquer desvio gerado antes de marcar a tag. Em seguida, execute o preflight determinístico local:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` e `pnpm release:check`.
6. Execute `OpenClaw NPM Release` com `preflight_only=true`. Antes de uma tag existir,
   um SHA completo de 40 caracteres do branch de lançamento é permitido somente para
   validação de preflight. Salve o `preflight_run_id` bem-sucedido.
7. Inicie todos os testes de pré-lançamento com `Full Release Validation` para o
   branch de lançamento, tag ou SHA completo do commit. Este é o único ponto de entrada manual
   para as quatro grandes caixas de teste de lançamento: Vitest, Docker, QA Lab e Package.
8. Se a validação falhar, corrija no branch de lançamento e reexecute o menor
   arquivo, faixa, job de workflow, perfil de pacote, provedor ou allowlist de modelo que
   comprove a correção. Reexecute o guarda-chuva completo somente quando a superfície alterada tornar
   evidências anteriores obsoletas.
9. Para beta, marque `vYYYY.M.D-beta.N` e então execute `OpenClaw Release Publish` a partir
   do branch `release/YYYY.M.D` correspondente. Ele verifica `pnpm plugins:sync:check`,
   dispara todos os pacotes de Plugin publicáveis para o npm e o mesmo conjunto para
   o ClawHub em paralelo, e então promove o artefato de preflight npm do OpenClaw preparado
   com a dist-tag correspondente assim que a publicação npm do Plugin tiver êxito.
   A publicação no ClawHub ainda pode estar em execução enquanto o npm do OpenClaw publica, mas o
   workflow de publicação de lançamento imprime os IDs dos runs filhos imediatamente. Por padrão, ele
   não espera pelo ClawHub após dispará-lo, então a disponibilidade do npm do OpenClaw
   não é bloqueada por aprovações mais lentas do ClawHub ou trabalho de registro; defina
   `wait_for_clawhub=true` quando o ClawHub precisar bloquear a conclusão do workflow. O
   caminho do ClawHub tenta novamente falhas transitórias de instalação de dependências da CLI, publica
   plugins que passaram na prévia mesmo quando uma célula de prévia oscila, e termina com
   verificação de registro para cada versão de Plugin esperada, para que publicações parciais
   permaneçam visíveis e passíveis de nova tentativa. Após a publicação, execute
   a aceitação de pacote pós-publicação
   contra o pacote `openclaw@YYYY.M.D-beta.N` ou
   `openclaw@beta` publicado. Se um pré-lançamento enviado ou publicado precisar de correção,
   crie o próximo número de pré-lançamento correspondente; não exclua nem reescreva o
   pré-lançamento antigo.
10. Para estável, continue somente depois que o beta validado ou candidato a lançamento tiver as
    evidências de validação exigidas. A publicação npm estável também passa por
    `OpenClaw Release Publish`, reutilizando o artefato de preflight bem-sucedido via
    `preflight_run_id`; a prontidão do lançamento estável macOS também exige o
    `.zip`, `.dmg`, `.dSYM.zip` empacotados e o `appcast.xml` atualizado no `main`.
11. Após a publicação, execute o verificador npm pós-publicação, o E2E Telegram publicado-npm
    standalone opcional quando precisar de prova de canal pós-publicação,
    promoção de dist-tag quando necessário, notas de lançamento/pré-lançamento do GitHub a partir da
    seção completa correspondente de `CHANGELOG.md` e as etapas de anúncio do lançamento.

## Preflight de lançamento

- Execute `pnpm check:test-types` antes do preflight de lançamento para que o TypeScript dos testes continue coberto fora do gate local mais rápido `pnpm check`
- Execute `pnpm check:architecture` antes do preflight de lançamento para que as verificações mais amplas de ciclos de importação e limites de arquitetura fiquem verdes fora do gate local mais rápido
- Execute `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que os artefatos de lançamento esperados em `dist/*` e o bundle da Control UI existam para a etapa de validação do pacote
- Execute `pnpm release:prep` após o bump da versão raiz e antes de criar a tag. Ele executa todos os geradores determinísticos de lançamento que comumente divergem após uma mudança de versão/configuração/API: versões de plugins, inventário de plugins, schema de configuração base, metadados de configuração de canais empacotados, baseline de documentação de configuração, exports do SDK de plugins e baseline de API do SDK de plugins. `pnpm release:check` reexecuta essas proteções em modo de verificação e relata, em uma única passada, todas as falhas de divergência gerada que encontra antes de executar as verificações de lançamento de pacote.
- Execute o workflow manual `Full Release Validation` antes da aprovação do lançamento para iniciar todas as caixas de teste de pré-lançamento a partir de um único ponto de entrada. Ele aceita um branch, tag ou SHA completo de commit, dispara `CI` manual e dispara `OpenClaw Release Checks` para smoke de instalação, aceitação de pacote, verificações de pacote entre sistemas operacionais, paridade do QA Lab, Matrix e lanes do Telegram. Execuções estáveis/padrão mantêm live/E2E exaustivo e soak do caminho de lançamento Docker atrás de `run_release_soak=true`; `release_profile=full` força o soak. Com `release_profile=full` e `rerun_group=all`, ele também executa E2E de pacote Telegram contra o artefato `release-package-under-test` das verificações de lançamento. Forneça `npm_telegram_package_spec` após publicar quando o mesmo E2E do Telegram também deve comprovar o pacote npm publicado. Forneça `package_acceptance_package_spec` após publicar quando Package Acceptance deve executar sua matriz de pacote/atualização contra o pacote npm enviado em vez do artefato criado a partir do SHA. Forneça `evidence_package_spec` quando o relatório de evidências privado deve comprovar que a validação corresponde a um pacote npm publicado sem forçar E2E do Telegram. Exemplo:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Execute o workflow manual `Package Acceptance` quando quiser prova por canal paralelo para um candidato de pacote enquanto o trabalho de lançamento continua. Use `source=npm` para `openclaw@beta`, `openclaw@latest` ou uma versão exata de lançamento; `source=ref` para empacotar um branch/tag/SHA confiável em `package_ref` com o harness atual em `workflow_ref`; `source=url` para um tarball HTTPS com SHA-256 obrigatório; ou `source=artifact` para um tarball enviado por outra execução do GitHub Actions. O workflow resolve o candidato para `package-under-test`, reutiliza o agendador de lançamento Docker E2E contra esse tarball e pode executar QA do Telegram contra o mesmo tarball com `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`. Quando as lanes Docker selecionadas incluem `published-upgrade-survivor`, o artefato de pacote é o candidato e `published_upgrade_survivor_baseline` seleciona a baseline publicada. `update-restart-auth` usa o pacote candidato tanto como CLI instalada quanto como package-under-test, de modo que exercita o caminho de reinício gerenciado do comando de atualização do candidato.
  Exemplo: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Perfis comuns:
  - `smoke`: lanes de instalação/canal/agente, rede Gateway e recarregamento de configuração
  - `package`: lanes nativas de artefato para pacote/atualização/reinício/plugin sem OpenWebUI ou ClawHub live
  - `product`: perfil de pacote mais canais MCP, limpeza de cron/subagente, pesquisa web da OpenAI e OpenWebUI
  - `full`: blocos do caminho de lançamento Docker com OpenWebUI
  - `custom`: seleção exata de `docker_lanes` para uma reexecução focada
- Execute o workflow manual `CI` diretamente quando você só precisa da cobertura completa de CI normal para o candidato de lançamento. Disparos manuais de CI ignoram o escopo por mudanças e forçam as shards Linux Node, shards de plugins empacotados, contratos de canais, compatibilidade com Node 22, `check`, `check-additional`, smoke de build, verificações de docs, Skills Python, Windows, macOS, Android e lanes de i18n da Control UI.
  Exemplo: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Execute `pnpm qa:otel:smoke` ao validar telemetria de lançamento. Ele exercita o QA-lab por meio de um receptor OTLP/HTTP local e verifica os nomes de spans de trace exportados, atributos limitados e redação de conteúdo/identificadores sem exigir Opik, Langfuse ou outro coletor externo.
- Execute `pnpm release:check` antes de cada lançamento tagueado
- Execute `OpenClaw Release Publish` para a sequência mutável de publicação depois que a tag existir. Dispare-o a partir de `release/YYYY.M.D` (ou `main` ao publicar uma tag acessível a partir de main), informe a tag de lançamento e o `preflight_run_id` bem-sucedido do npm do OpenClaw, e mantenha o escopo padrão de publicação de plugins `all-publishable` a menos que você esteja executando deliberadamente um reparo focado. O workflow serializa a publicação npm de plugins, a publicação ClawHub de plugins e a publicação npm do OpenClaw para que o pacote core não seja publicado antes de seus plugins externalizados.
- As verificações de lançamento agora são executadas em um workflow manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` também executa a lane de paridade mock do QA Lab, além do perfil rápido live do Matrix e da lane de QA do Telegram antes da aprovação do lançamento. As lanes live usam o ambiente `qa-live-shared`; o Telegram também usa leases de credenciais CI do Convex. Execute o workflow manual `QA-Lab - All Lanes` com `matrix_profile=all` e `matrix_shards=true` quando quiser todo o inventário de transporte, mídia e E2EE do Matrix em paralelo.
- A validação de instalação e atualização entre sistemas operacionais faz parte dos workflows públicos `OpenClaw Release Checks` e `Full Release Validation`, que chamam diretamente o workflow reutilizável `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Essa divisão é intencional: manter o caminho real de lançamento npm curto, determinístico e focado em artefatos, enquanto verificações live mais lentas ficam em sua própria lane para não atrasar nem bloquear a publicação
- Verificações de lançamento com segredos devem ser disparadas por meio de `Full Release Validation` ou a partir da ref de workflow `main`/release para que a lógica do workflow e os segredos permaneçam controlados
- `OpenClaw Release Checks` aceita um branch, tag ou SHA completo de commit, desde que o commit resolvido seja acessível a partir de um branch do OpenClaw ou tag de lançamento
- O preflight somente de validação de `OpenClaw NPM Release` também aceita o SHA completo de 40 caracteres do commit atual do branch de workflow sem exigir uma tag enviada
- Esse caminho por SHA é somente de validação e não pode ser promovido para uma publicação real
- No modo SHA, o workflow sintetiza `v<package.json version>` apenas para a verificação de metadados do pacote; a publicação real ainda exige uma tag de lançamento real
- Ambos os workflows mantêm o caminho real de publicação e promoção em runners hospedados pelo GitHub, enquanto o caminho de validação não mutável pode usar os runners Linux maiores do Blacksmith
- Esse workflow executa `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` usando os segredos de workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- O preflight de lançamento npm não espera mais pela lane separada de verificações de lançamento
- Execute `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts` (ou a tag beta/correção correspondente) antes da aprovação
- Após publicar no npm, execute `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D` (ou a versão beta/correção correspondente) para verificar o caminho de instalação do registro publicado em um prefixo temporário limpo
- Após uma publicação beta, execute `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` para verificar onboarding de pacote instalado, configuração do Telegram e E2E real do Telegram contra o pacote npm publicado usando o pool compartilhado de credenciais alugadas do Telegram. Execuções avulsas locais de mantenedores podem omitir as variáveis do Convex e passar diretamente as três credenciais de ambiente `OPENCLAW_QA_TELEGRAM_*`.
- Para executar o smoke beta completo pós-publicação a partir de uma máquina de mantenedor, use `pnpm release:beta-smoke -- --beta betaN`. O helper executa validação de atualização npm/fresh-target no Parallels, dispara `NPM Telegram Beta E2E`, consulta a execução exata do workflow, baixa o artefato e imprime o relatório do Telegram.
- Mantenedores podem executar a mesma verificação pós-publicação a partir do GitHub Actions pelo workflow manual `NPM Telegram Beta E2E`. Ele é intencionalmente apenas manual e não é executado em cada merge.
- A automação de lançamento dos mantenedores agora usa preflight-depois-promote:
  - a publicação npm real deve passar um `preflight_run_id` npm bem-sucedido
  - a publicação npm real deve ser disparada a partir do mesmo branch `main` ou `release/YYYY.M.D` da execução de preflight bem-sucedida
  - lançamentos npm estáveis usam `beta` por padrão
  - a publicação npm estável pode apontar explicitamente para `latest` via input do workflow
  - mutação de dist-tag npm baseada em token agora vive em `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` por segurança, porque `npm dist-tag add` ainda precisa de `NPM_TOKEN` enquanto o repositório público mantém publicação somente com OIDC
  - `macOS Release` público é somente validação; quando uma tag existe apenas em um branch de lançamento, mas o workflow é disparado a partir de `main`, defina `public_release_branch=release/YYYY.M.D`
  - a publicação mac privada real deve passar por `preflight_run_id` e `validate_run_id` mac privados bem-sucedidos
  - os caminhos reais de publicação promovem artefatos preparados em vez de reconstruí-los novamente
- Para lançamentos estáveis de correção como `YYYY.M.D-N`, o verificador pós-publicação também verifica o mesmo caminho de atualização em prefixo temporário de `YYYY.M.D` para `YYYY.M.D-N`, para que correções de lançamento não deixem silenciosamente instalações globais antigas na carga estável base
- O preflight de lançamento npm falha fechado a menos que o tarball inclua tanto `dist/control-ui/index.html` quanto uma carga não vazia em `dist/control-ui/assets/`, para que não enviemos novamente um dashboard de navegador vazio
- A verificação pós-publicação também confirma que os entrypoints de plugins publicados e os metadados de pacote estão presentes no layout do registro instalado. Um lançamento que envia payloads de runtime de plugins ausentes falha no verificador pós-publicação e não pode ser promovido para `latest`.
- `pnpm test:install:smoke` também aplica o orçamento de `unpackedSize` do npm pack no tarball candidato de atualização, para que o e2e do instalador capture inchaço acidental do pacote antes do caminho de publicação do lançamento
- Se o trabalho de lançamento tocou no planejamento de CI, manifests de tempo de extensões ou matrizes de testes de extensões, regenere e revise antes da aprovação as saídas de matriz `plugin-prerelease-extension-shard` pertencentes ao planejador em `.github/workflows/plugin-prerelease.yml`, para que as notas de lançamento não descrevam um layout de CI obsoleto
- A prontidão de lançamento estável do macOS também inclui as superfícies do atualizador:
  - o lançamento no GitHub deve acabar com os pacotes `.zip`, `.dmg` e `.dSYM.zip`
  - `appcast.xml` em `main` deve apontar para o novo zip estável após a publicação
  - o app empacotado deve manter um bundle id não debug, uma URL de feed Sparkle não vazia e um `CFBundleVersion` igual ou superior ao piso canônico de build do Sparkle para essa versão de lançamento

## Caixas de teste de lançamento

`Full Release Validation` é como operadores iniciam todos os testes de pré-lançamento a partir de um único ponto de entrada. Para uma prova de commit fixado em um branch que avança rapidamente, use o helper para que cada workflow filho execute a partir de um branch temporário fixado no SHA de destino:

```bash
pnpm ci:full-release --sha <full-sha>
```

O helper envia `release-ci/<sha>-...`, dispara `Full Release Validation` a partir desse branch com `ref=<sha>`, verifica que cada `headSha` de workflow filho corresponde ao alvo e então exclui o branch temporário. Isso evita comprovar acidentalmente uma execução filha mais nova de `main`.

Para validação de branch ou tag de lançamento, execute-o a partir da ref de workflow
`main` confiável e passe a branch ou tag de lançamento como `ref`:

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
artefato pai `release-package-under-test` para verificações voltadas a pacotes e
dispara o E2E Telegram de pacote autônomo quando `release_profile=full` com
`rerun_group=all` ou quando `npm_telegram_package_spec` está definido. Em seguida,
`OpenClaw Release Checks` expande para smoke de instalação, verificações de
lançamento entre sistemas operacionais, cobertura de caminho de lançamento
live/E2E Docker quando o soak está habilitado, Package Acceptance com QA de
pacote Telegram, paridade do QA Lab, Matrix live e Telegram live. Uma execução
completa só é aceitável quando o resumo de `Full Release Validation` mostra
`normal_ci` e `release_checks` como bem-sucedidos. No modo full/all, o filho
`npm_telegram` também deve ser bem-sucedido; fora de full/all, ele é ignorado
a menos que um `npm_telegram_package_spec` publicado tenha sido fornecido. O
resumo final do verificador inclui tabelas dos jobs mais lentos para cada
execução filha, para que o gerente de lançamento veja o caminho crítico atual
sem baixar logs.
Consulte [Validação completa de lançamento](/pt-BR/reference/full-release-validation)
para a matriz completa de estágios, nomes exatos dos jobs do workflow,
diferenças entre os perfis stable e full, artefatos e identificadores de
reexecução focada.
Workflows filhos são disparados a partir da ref confiável que executa
`Full Release Validation`, normalmente `--ref main`, mesmo quando a `ref` de
destino aponta para uma branch ou tag de lançamento mais antiga. Não há uma
entrada separada de ref de workflow para Full Release Validation; escolha o
harness confiável escolhendo a ref de execução do workflow.
Não use `--ref main -f ref=<sha>` para prova de commit exato em uma `main`
móvel; SHAs de commit brutos não podem ser refs de disparo de workflow, então use
`pnpm ci:full-release --sha <sha>` para criar a branch temporária fixada.

Use `release_profile` para selecionar a abrangência live/provedor:

- `minimum`: caminho OpenAI/core live e Docker crítico para lançamento mais rápido
- `stable`: minimum mais cobertura estável de provedor/backend para aprovação de lançamento
- `full`: stable mais cobertura ampla de provedores/mídia consultiva

Use `run_release_soak=true` com `stable` quando as lanes bloqueadoras de
lançamento estiverem verdes e você quiser a varredura exaustiva live/E2E, de
caminho de lançamento Docker e de sobrevivência a upgrade publicado com limites
antes da promoção. Essa varredura cobre os quatro pacotes stable mais recentes,
mais as baselines fixadas `2026.4.23` e `2026.5.2`, além da cobertura mais
antiga de `2026.4.15`, com baselines duplicadas removidas e cada baseline
fragmentada em seu próprio job de runner Docker. `full` implica
`run_release_soak=true`.

`OpenClaw Release Checks` usa a ref de workflow confiável para resolver a ref de
destino uma vez como `release-package-under-test` e reutiliza esse artefato em
verificações entre sistemas operacionais, Package Acceptance e verificações
Docker de caminho de lançamento quando o soak é executado. Isso mantém todas as
máquinas voltadas a pacotes nos mesmos bytes e evita builds repetidos de pacote.
O smoke de instalação OpenAI entre sistemas operacionais usa
`OPENCLAW_CROSS_OS_OPENAI_MODEL` quando a variável do repo/org está definida;
caso contrário, usa `openai/gpt-5.4`, porque essa lane prova instalação do
pacote, onboarding, inicialização do Gateway e um turno live de agente, em vez
de medir o desempenho do modelo padrão mais lento. A matriz mais ampla de
provedores live continua sendo o local para cobertura específica de modelo.

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

Não use o guarda-chuva completo como a primeira reexecução após uma correção
focada. Se uma máquina falhar, use o workflow filho, job, lane Docker, perfil de
pacote, provedor de modelo ou lane de QA com falha para a próxima prova. Execute
o guarda-chuva completo novamente somente quando a correção tiver alterado a
orquestração compartilhada de lançamento ou tornado obsoleta a evidência
anterior de todas as máquinas. O verificador final do guarda-chuva verifica
novamente os IDs registrados de execução dos workflows filhos; portanto, depois
que um workflow filho for reexecutado com sucesso, reexecute somente o job pai
`Verify full validation` que falhou.

Para recuperação limitada, passe `rerun_group` ao guarda-chuva. `all` é a
execução real de candidato a lançamento, `ci` executa apenas o filho CI normal,
`plugin-prerelease` executa apenas o filho de Plugin exclusivo de lançamento,
`release-checks` executa todas as máquinas de lançamento, e os grupos de
lançamento mais restritos são `install-smoke`, `cross-os`, `live-e2e`,
`package`, `qa`, `qa-parity`, `qa-live` e `npm-telegram`. Reexecuções focadas de
`npm-telegram` exigem `npm_telegram_package_spec`; execuções full/all com
`release_profile=full` usam o artefato de pacote de release-checks. Reexecuções
focadas entre sistemas operacionais podem adicionar
`cross_os_suite_filter=windows/packaged-upgrade` ou outro filtro de
sistema/suíte. Falhas de QA em release-checks são consultivas; uma falha apenas
de QA não bloqueia a validação de lançamento.

### Vitest

A máquina Vitest é o workflow filho `CI` manual. O CI manual ignora
intencionalmente o escopo por alterações e força o grafo normal de testes para
o candidato a lançamento: shards Linux Node, shards de Plugins empacotados,
contratos de canais, compatibilidade com Node 22, `check`, `check-additional`,
smoke de build, verificações de docs, skills Python, Windows, macOS, Android e
i18n da Control UI.

Use esta máquina para responder "a árvore de código-fonte passou na suíte normal
completa de testes?" Ela não é a mesma coisa que validação de produto pelo
caminho de lançamento. Evidências a manter:

- resumo de `Full Release Validation` mostrando a URL da execução `CI` disparada
- execução `CI` verde no SHA de destino exato
- nomes de shards com falha ou lentos dos jobs de CI ao investigar regressões
- artefatos de temporização do Vitest, como `.artifacts/vitest-shard-timings.json`, quando uma execução precisa de análise de desempenho

Execute o CI manual diretamente somente quando o lançamento precisar de CI
normal determinístico, mas não das máquinas Docker, QA Lab, live, entre sistemas
operacionais ou de pacote:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

A máquina Docker fica em `OpenClaw Release Checks` por meio de
`openclaw-live-and-e2e-checks-reusable.yml`, além do workflow
`install-smoke` em modo de lançamento. Ela valida o candidato a lançamento por
meio de ambientes Docker empacotados, em vez de apenas testes em nível de
código-fonte.

A cobertura Docker de lançamento inclui:

- smoke completo de instalação com o smoke lento de instalação global Bun habilitado
- preparação/reutilização da imagem smoke do Dockerfile raiz por SHA de destino, com jobs de smoke de QR, root/gateway e instalador/Bun executados como shards separados de install-smoke
- lanes E2E do repositório
- partes Docker de caminho de lançamento: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` e `plugins-runtime-install-h`
- cobertura OpenWebUI dentro da parte `plugins-runtime-services` quando solicitada
- lanes divididas de instalação/desinstalação de Plugins empacotados
  `bundled-plugin-install-uninstall-0` até
  `bundled-plugin-install-uninstall-23`
- suítes live/E2E de provedores e cobertura Docker live de modelos quando as verificações de lançamento incluem suítes live

Use artefatos Docker antes de reexecutar. O agendador de caminho de lançamento
envia `.artifacts/docker-tests/` com logs de lane, `summary.json`,
`failures.json`, temporizações de fases, JSON do plano do agendador e comandos
de reexecução. Para recuperação focada, use `docker_lanes=<lane[,lane]>` no
workflow reutilizável live/E2E em vez de reexecutar todas as partes de
lançamento. Comandos de reexecução gerados incluem `package_artifact_run_id`
anterior e entradas de imagens Docker preparadas quando disponíveis, para que
uma lane com falha possa reutilizar o mesmo tarball e as imagens GHCR.

### QA Lab

A máquina QA Lab também faz parte de `OpenClaw Release Checks`. Ela é o gate de
lançamento de comportamento agêntico e em nível de canal, separado do Vitest e
da mecânica de pacotes Docker.

A cobertura do QA Lab de lançamento inclui:

- lane de paridade mock comparando a lane candidata OpenAI com a baseline Opus 4.6 usando o pacote de paridade agêntica
- perfil rápido de QA Matrix live usando o ambiente `qa-live-shared`
- lane de QA Telegram live usando leases de credenciais de CI Convex
- `pnpm qa:otel:smoke` quando a telemetria de lançamento precisa de prova local explícita

Use esta máquina para responder "o lançamento se comporta corretamente nos
cenários de QA e fluxos de canais live?" Mantenha as URLs de artefatos das lanes
de paridade, Matrix e Telegram ao aprovar o lançamento. A cobertura completa de
Matrix continua disponível como uma execução manual fragmentada do QA-Lab, em
vez da lane padrão crítica para lançamento.

### Pacote

A máquina Package é o gate do produto instalável. Ela é respaldada por
`Package Acceptance` e pelo resolvedor
`scripts/resolve-openclaw-package-candidate.mjs`. O resolvedor normaliza um
candidato no tarball `package-under-test` consumido pelo Docker E2E, valida o
inventário do pacote, registra a versão do pacote e o SHA-256, e mantém a ref do
harness de workflow separada da ref de origem do pacote.

Fontes de candidato compatíveis:

- `source=npm`: `openclaw@beta`, `openclaw@latest` ou uma versão exata de lançamento do OpenClaw
- `source=ref`: empacota uma branch, tag ou SHA completo de commit de `package_ref` confiável com o harness `workflow_ref` selecionado
- `source=url`: baixa um `.tgz` HTTPS com `package_sha256` obrigatório
- `source=artifact`: reutiliza um `.tgz` enviado por outra execução do GitHub Actions

`OpenClaw Release Checks` executa Package Acceptance com `source=artifact`, o
artefato de pacote de lançamento preparado, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance mantém migração, atualização,
reinicialização de atualização com autenticação configurada, limpeza de
dependências obsoletas de Plugin, fixtures de Plugin offline, atualização de
Plugin e QA de pacote Telegram contra o mesmo tarball resolvido. Verificações de
lançamento bloqueadoras usam a baseline padrão do pacote publicado mais recente;
`run_release_soak=true` ou `release_profile=full` expande para cada baseline
stable publicada no npm de `2026.4.23` até `latest`, além de fixtures de issues
relatadas. Use Package Acceptance com `source=npm` para um candidato já
entregue, ou `source=ref`/`source=artifact` para um tarball npm local com
respaldo de SHA antes da publicação. Ele é o substituto nativo do GitHub para a
maior parte da cobertura de pacote/atualização que antes exigia Parallels.
Verificações de lançamento entre sistemas operacionais ainda importam para
onboarding, instalador e comportamento de plataforma específicos de sistema,
mas a validação de produto de pacote/atualização deve preferir Package
Acceptance.

A checklist canônica para validação de atualização e Plugin é
[Testando atualizações e Plugins](/pt-BR/help/testing-updates-plugins). Use-a ao
decidir qual lane local, Docker, Package Acceptance ou release-check prova uma
instalação/atualização de Plugin, limpeza por doctor ou alteração de migração de
pacote publicado. Migração exaustiva de atualização publicada de cada pacote
stable `2026.4.23+` é um workflow manual `Update Migration` separado, não parte
do Full Release CI.

A tolerância legada de aceitação de pacote é intencionalmente limitada no tempo. Pacotes até
`2026.4.25` podem usar o caminho de compatibilidade para lacunas de metadados já publicadas
no npm: entradas privadas do inventário de QA ausentes do tarball, ausência de
`gateway install --wrapper`, arquivos de patch ausentes no fixture git derivado do tarball,
ausência de `update.channel` persistido, locais legados de registros de instalação de Plugin,
ausência de persistência de registros de instalação do marketplace e migração de metadados
de configuração durante `plugins update`. O pacote publicado `2026.4.26` pode avisar
sobre arquivos locais de carimbo de metadados de build que já foram enviados. Pacotes posteriores
devem satisfazer os contratos modernos de pacote; essas mesmas lacunas fazem a validação de
lançamento falhar.

Use perfis mais amplos de Package Acceptance quando a questão de lançamento for sobre um
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
  ao vivo; este é o padrão de verificação de lançamento
- `product`: `package` mais canais MCP, limpeza de cron/subagente, pesquisa web da OpenAI
  e OpenWebUI
- `full`: blocos de caminho de lançamento Docker com OpenWebUI
- `custom`: lista exata de `docker_lanes` para novas execuções focadas

Para prova de Telegram de candidato a pacote, habilite `telegram_mode=mock-openai` ou
`telegram_mode=live-frontier` no Package Acceptance. O workflow passa o tarball
`package-under-test` resolvido para a trilha do Telegram; o workflow independente do
Telegram ainda aceita uma especificação npm publicada para verificações pós-publicação.

## Automação de publicação de lançamento

`OpenClaw Release Publish` é o ponto de entrada mutável normal de publicação. Ele
orquestra os workflows de trusted-publisher na ordem que o lançamento exige:

1. Faça checkout da tag de lançamento e resolva seu SHA de commit.
2. Verifique se a tag é alcançável a partir de `main` ou `release/*`.
3. Execute `pnpm plugins:sync:check`.
4. Dispare `Plugin NPM Release` com `publish_scope=all-publishable` e
   `ref=<release-sha>`.
5. Dispare `Plugin ClawHub Release` com o mesmo escopo e SHA.
6. Dispare `OpenClaw NPM Release` com a tag de lançamento, a dist-tag do npm e
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
somente para reparo ou republicação focados. Para um reparo de Plugin selecionado, passe
`plugin_publish_scope=selected` e `plugins=@openclaw/name` para
`OpenClaw Release Publish`, ou dispare o workflow filho diretamente quando o
pacote OpenClaw não deve ser publicado.

## Entradas do workflow NPM

`OpenClaw NPM Release` aceita estas entradas controladas pelo operador:

- `tag`: tag de lançamento obrigatória, como `v2026.4.2`, `v2026.4.2-1` ou
  `v2026.4.2-beta.1`; quando `preflight_only=true`, também pode ser o SHA de commit
  completo de 40 caracteres do branch de workflow atual para preflight somente de validação
- `preflight_only`: `true` apenas para validação/build/pacote, `false` para o
  caminho real de publicação
- `preflight_run_id`: obrigatório no caminho real de publicação para que o workflow reutilize
  o tarball preparado da execução de preflight bem-sucedida
- `npm_dist_tag`: tag de destino npm para o caminho de publicação; o padrão é `beta`

`OpenClaw Release Publish` aceita estas entradas controladas pelo operador:

- `tag`: tag de lançamento obrigatória; já deve existir
- `preflight_run_id`: id da execução de preflight bem-sucedida de `OpenClaw NPM Release`;
  obrigatório quando `publish_openclaw_npm=true`
- `npm_dist_tag`: tag de destino npm para o pacote OpenClaw
- `plugin_publish_scope`: o padrão é `all-publishable`; use `selected` somente
  para trabalho de reparo focado
- `plugins`: nomes de pacotes `@openclaw/*` separados por vírgulas quando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: o padrão é `true`; defina como `false` somente ao usar o
  workflow como orquestrador de reparo apenas de Plugin

`OpenClaw Release Checks` aceita estas entradas controladas pelo operador:

- `ref`: branch, tag ou SHA de commit completo a validar. Verificações com segredos
  exigem que o commit resolvido seja alcançável a partir de um branch OpenClaw ou
  de uma tag de lançamento.
- `run_release_soak`: opte por soak exaustivo ao vivo/E2E, caminho de lançamento Docker e
  all-since upgrade-survivor em verificações de lançamento estável/padrão. Ele é forçado
  por `release_profile=full`.

Regras:

- Tags estáveis e de correção podem ser publicadas em `beta` ou `latest`
- Tags beta de pré-lançamento só podem ser publicadas em `beta`
- Para `OpenClaw NPM Release`, entrada de SHA de commit completo só é permitida quando
  `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` são sempre
  apenas validação
- O caminho real de publicação deve usar o mesmo `npm_dist_tag` usado durante o preflight;
  o workflow verifica esses metadados antes que a publicação continue

## Sequência de lançamento npm estável

Ao preparar um lançamento npm estável:

1. Execute `OpenClaw NPM Release` com `preflight_only=true`
   - Antes de uma tag existir, você pode usar o SHA de commit completo do branch de workflow
     atual para uma simulação somente de validação do workflow de preflight
2. Escolha `npm_dist_tag=beta` para o fluxo normal beta-first, ou `latest` somente
   quando você quiser intencionalmente uma publicação estável direta
3. Execute `Full Release Validation` no branch de lançamento, na tag de lançamento ou no SHA
   de commit completo quando quiser CI normal mais cache de prompt ao vivo, Docker, QA Lab,
   Matrix e cobertura do Telegram a partir de um único workflow manual
4. Se você intencionalmente precisar apenas do grafo de testes normal determinístico, execute o
   workflow manual `CI` na ref de lançamento
5. Salve o `preflight_run_id` bem-sucedido
6. Execute `OpenClaw Release Publish` com a mesma `tag`, o mesmo `npm_dist_tag`
   e o `preflight_run_id` salvo; ele publica plugins externalizados no npm
   e no ClawHub antes de promover o pacote npm OpenClaw
7. Se o lançamento chegou a `beta`, use o workflow privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover essa versão estável de `beta` para `latest`
8. Se o lançamento foi intencionalmente publicado diretamente em `latest` e `beta`
   deve seguir imediatamente o mesmo build estável, use esse mesmo workflow privado
   para apontar ambas as dist-tags para a versão estável, ou deixe a sincronização
   autocorretiva agendada mover `beta` depois

A mutação de dist-tag fica no repositório privado por segurança porque ainda
exige `NPM_TOKEN`, enquanto o repositório público mantém publicação somente com OIDC.

Isso mantém tanto o caminho de publicação direta quanto o caminho de promoção beta-first
documentados e visíveis ao operador.

Se um mantenedor precisar recorrer à autenticação npm local, execute quaisquer comandos da CLI
do 1Password (`op`) somente dentro de uma sessão tmux dedicada. Não chame `op`
diretamente a partir do shell principal do agente; mantê-lo dentro do tmux torna prompts,
alertas e tratamento de OTP observáveis e impede alertas repetidos do host.

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
