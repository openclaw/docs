---
read_when:
    - Procurando definições públicas de canais de lançamento
    - Executando validação de release ou aceitação de pacote
    - Procurando nomenclatura e cadência de versões
summary: Faixas de lançamento, lista de verificação do operador, caixas de validação, nomenclatura de versões e cadência
title: Política de lançamento
x-i18n:
    generated_at: "2026-05-12T08:46:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01fed02c15c4d1950c055f25117fd236942a8858f843022597fe5f56ba2eb724
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw tem três faixas de lançamento públicas:

- stable: lançamentos marcados com tag que publicam no npm `beta` por padrão, ou no npm `latest` quando solicitado explicitamente
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
- Lançamentos estáveis e de correção estável publicam no npm `beta` por padrão; operadores de lançamento podem direcionar explicitamente para `latest` ou promover uma build beta validada posteriormente
- Todo lançamento estável do OpenClaw entrega o pacote npm e o app macOS juntos;
  lançamentos beta normalmente validam e publicam primeiro o caminho npm/pacote, com
  build/assinatura/notarização do app Mac reservados para stable, salvo solicitação explícita

## Cadência de lançamentos

- Os lançamentos seguem beta primeiro
- Stable vem somente depois que o beta mais recente é validado
- Mantenedores normalmente cortam lançamentos a partir de uma branch `release/YYYY.M.D` criada
  a partir do `main` atual, para que a validação e as correções do lançamento não bloqueiem novo
  desenvolvimento em `main`
- Se uma tag beta foi enviada ou publicada e precisa de uma correção, mantenedores cortam
  a próxima tag `-beta.N` em vez de excluir ou recriar a tag beta antiga
- Procedimento detalhado de lançamento, aprovações, credenciais e notas de recuperação são
  restritos a mantenedores

## Checklist do operador de lançamento

Este checklist é o formato público do fluxo de lançamento. Credenciais privadas,
assinatura, notarização, recuperação de dist-tag e detalhes de rollback emergencial ficam no
runbook de lançamento restrito a mantenedores.

1. Comece do `main` atual: puxe a versão mais recente, confirme que o commit-alvo foi enviado
   e confirme que a CI atual de `main` está verde o suficiente para criar uma branch a partir dele.
2. Reescreva a seção superior de `CHANGELOG.md` a partir do histórico real de commits com
   `/changelog`, mantenha as entradas voltadas ao usuário, faça commit, envie e faça rebase/pull
   mais uma vez antes de criar a branch.
3. Revise os registros de compatibilidade de lançamento em
   `src/plugins/compat/registry.ts` e
   `src/commands/doctor/shared/deprecation-compat.ts`. Remova compatibilidade expirada
   somente quando o caminho de upgrade continuar coberto, ou registre por que ela está sendo
   mantida intencionalmente.
4. Crie `release/YYYY.M.D` a partir do `main` atual; não faça trabalho normal de lançamento
   diretamente em `main`.
5. Atualize todas as localizações de versão exigidas para a tag pretendida e então execute
   `pnpm release:prep`. Ele atualiza versões de plugins, inventário de plugins, esquema de configuração,
   metadados de configuração de canais empacotados, baseline de docs de configuração, exports do SDK de Plugin
   e baseline de API do SDK de Plugin na ordem correta. Faça commit de qualquer divergência gerada
   antes de criar a tag. Em seguida, execute o preflight determinístico local:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` e `pnpm release:check`.
6. Execute `OpenClaw NPM Release` com `preflight_only=true`. Antes de existir uma tag,
   um SHA completo de 40 caracteres da branch de lançamento é permitido para preflight
   apenas de validação. Salve o `preflight_run_id` bem-sucedido.
7. Inicie todos os testes de pré-lançamento com `Full Release Validation` para a
   branch de lançamento, tag ou SHA completo do commit. Este é o único ponto de entrada manual
   para as quatro grandes caixas de teste de lançamento: Vitest, Docker, QA Lab e Package.
8. Se a validação falhar, corrija na branch de lançamento e reexecute o menor arquivo,
   faixa, job de workflow, perfil de pacote, provedor ou allowlist de modelo com falha que
   comprove a correção. Reexecute o guarda-chuva completo somente quando a superfície alterada tornar
   evidências anteriores obsoletas.
9. Para beta, marque `vYYYY.M.D-beta.N` e então execute `OpenClaw Release Publish` a partir
   da branch `release/YYYY.M.D` correspondente. Ele verifica `pnpm plugins:sync:check`,
   despacha todos os pacotes de plugins publicáveis para o npm e o mesmo conjunto para
   o ClawHub em paralelo, e então promove o artefato de preflight npm do OpenClaw preparado
   com a dist-tag correspondente assim que a publicação npm dos plugins for bem-sucedida.
   Depois que o processo filho de publicação npm do OpenClaw for bem-sucedido, ele cria ou atualiza a
   página de lançamento/pré-lançamento correspondente do GitHub a partir da seção completa correspondente de
   `CHANGELOG.md`. Lançamentos estáveis publicados no npm `latest` se tornam o
   lançamento mais recente do GitHub; lançamentos estáveis de manutenção mantidos no npm `beta` são
   criados com GitHub `latest=false`.
   A publicação no ClawHub ainda pode estar em execução enquanto o OpenClaw publica no npm, mas o
   workflow de publicação de lançamento imprime os IDs de execução filhos imediatamente. Por padrão, ele
   não espera pelo ClawHub após despachá-lo, então a disponibilidade do OpenClaw no npm
   não é bloqueada por aprovações ou trabalho de registro mais lentos do ClawHub; defina
   `wait_for_clawhub=true` quando o ClawHub precisar bloquear a conclusão do workflow. O
   caminho do ClawHub tenta novamente falhas transitórias de instalação de dependências da CLI, publica
   plugins aprovados no preview mesmo quando uma célula de preview falha de forma intermitente, e termina com
   verificação de registro para cada versão de plugin esperada, para que publicações parciais
   permaneçam visíveis e possam ser tentadas novamente. Após publicar, execute
   `pnpm release:verify-beta -- YYYY.M.D-beta.N --openclaw-npm-run <run-id> --plugin-npm-run <run-id> --plugin-clawhub-run <run-id>`
   para verificar, com um único comando, o pré-lançamento do GitHub, as dist-tags npm `beta`, a integridade npm,
   o caminho de instalação publicado, versões exatas no ClawHub, artefatos do ClawHub e conclusões de
   workflows filhos. Adicione `--rerun-failed-clawhub` quando o sidecar do
   ClawHub tiver falhado somente em jobs repetíveis e deva ser reexecutado no lugar.
   Em seguida, execute a aceitação de pacote pós-publicação contra o pacote publicado
   `openclaw@YYYY.M.D-beta.N` ou
   `openclaw@beta`. Se um pré-lançamento enviado ou publicado precisar de correção,
   corte o próximo número de pré-lançamento correspondente; não exclua nem reescreva o
   pré-lançamento antigo.
10. Para stable, continue somente depois que o beta validado ou candidato a lançamento tiver a
    evidência de validação exigida. A publicação npm estável também passa por
    `OpenClaw Release Publish`, reutilizando o artefato de preflight bem-sucedido via
    `preflight_run_id`; a prontidão do lançamento macOS estável também exige os arquivos
    `.zip`, `.dmg`, `.dSYM.zip` empacotados e o `appcast.xml` atualizado em `main`.
    O workflow privado de publicação macOS publica o appcast assinado no `main`
    público automaticamente depois que os ativos de lançamento são verificados; se a proteção de branch bloquear
    o push direto, ele abre ou atualiza um PR de appcast.
11. Após publicar, execute o verificador npm pós-publicação, o E2E Telegram standalone
    opcional do npm publicado quando precisar de prova de canal pós-publicação,
    promoção de dist-tag quando necessário, verifique a página de lançamento gerada no GitHub
    e execute as etapas de anúncio do lançamento.

## Preflight de lançamento

- Execute `pnpm check:test-types` antes do preflight de lançamento para que o TypeScript dos testes permaneça
  coberto fora da gate local mais rápida `pnpm check`
- Execute `pnpm check:architecture` antes do preflight de lançamento para que as verificações mais amplas de ciclos
  de importação e limites de arquitetura estejam verdes fora da gate local mais rápida
- Execute `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que os artefatos de lançamento esperados
  em `dist/*` e o pacote da UI de Controle existam para a etapa de validação de empacotamento
- Execute `pnpm release:prep` após o incremento da versão raiz e antes de criar a tag. Ele
  executa todos os geradores determinísticos de lançamento que costumam divergir após uma
  alteração de versão/configuração/API: versões de plugin, inventário de plugins, esquema de configuração
  base, metadados de configuração de canais empacotados, baseline da documentação de configuração, exportações do SDK
  de plugin e baseline da API do SDK de plugin. `pnpm release:check` reexecuta essas
  proteções em modo de verificação e relata, em uma única passagem, todas as falhas de divergência gerada que encontra
  antes de executar as verificações de lançamento de pacote.
- Execute o workflow manual `Full Release Validation` antes da aprovação de lançamento para
  iniciar todas as caixas de teste de pré-lançamento a partir de um único ponto de entrada. Ele aceita uma branch,
  tag ou SHA completo de commit, dispara manualmente `CI` e dispara
  `OpenClaw Release Checks` para smoke de instalação, aceitação de pacote, verificações de pacote entre SOs,
  paridade do QA Lab, Matrix e lanes do Telegram. Execuções estáveis/padrão
  mantêm o soak exaustivo live/E2E e de caminho de lançamento Docker atrás de
  `run_release_soak=true`; `release_profile=full` força o soak. Com
  `release_profile=full` e `rerun_group=all`, ele também executa E2E de Telegram
  de pacote contra o artefato `release-package-under-test` das verificações de lançamento.
  Forneça `release_package_spec` após publicar um beta para reutilizar o pacote npm
  lançado nas verificações de lançamento, na Aceitação de Pacote e no E2E de Telegram
  de pacote sem reconstruir o tarball de lançamento. Forneça
  `npm_telegram_package_spec` somente quando o Telegram deve usar um pacote publicado
  diferente do restante da validação de lançamento. Forneça
  `package_acceptance_package_spec` quando a Aceitação de Pacote deve usar um
  pacote publicado diferente da especificação do pacote de lançamento. Forneça
  `evidence_package_spec` quando o relatório privado de evidência deve provar que a
  validação corresponde a um pacote npm publicado sem forçar o E2E de Telegram.
  Exemplo:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Execute o workflow manual `Package Acceptance` quando quiser uma prova de canal lateral
  para um candidato de pacote enquanto o trabalho de lançamento continua. Use `source=npm` para
  `openclaw@beta`, `openclaw@latest` ou uma versão exata de lançamento; `source=ref`
  para empacotar uma branch/tag/SHA confiável de `package_ref` com o harness
  `workflow_ref` atual; `source=url` para um tarball HTTPS com SHA-256
  obrigatório; ou `source=artifact` para um tarball enviado por outra execução do GitHub
  Actions. O workflow resolve o candidato para
  `package-under-test`, reutiliza o agendador de lançamento Docker E2E contra esse
  tarball e pode executar QA do Telegram contra o mesmo tarball com
  `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`. Quando as lanes
  Docker selecionadas incluem `published-upgrade-survivor`, o artefato de pacote
  é o candidato e `published_upgrade_survivor_baseline` seleciona a baseline
  publicada. `update-restart-auth` usa o pacote candidato tanto como a CLI instalada
  quanto como o package-under-test, para exercitar o caminho de reinicialização gerenciada
  do comando de atualização candidato.
  Exemplo: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Perfis comuns:
  - `smoke`: lanes de instalação/canal/agente, rede do Gateway e recarregamento de configuração
  - `package`: lanes nativas de artefato para pacote/atualização/reinicialização/plugin sem OpenWebUI ou ClawHub live
  - `product`: perfil de pacote mais canais MCP, limpeza de cron/subagente,
    busca web da OpenAI e OpenWebUI
  - `full`: blocos de caminho de lançamento Docker com OpenWebUI
  - `custom`: seleção exata de `docker_lanes` para uma reexecução focada
- Execute o workflow manual `CI` diretamente quando precisar apenas da cobertura normal completa de CI
  para o candidato de lançamento. Disparos manuais de CI ignoram o escopo por alterações
  e forçam os shards Linux Node, shards de plugins empacotados, contratos de canal,
  compatibilidade com Node 22, `check`, `check-additional`, smoke de build,
  verificações de documentação, Skills Python, Windows, macOS, Android e lanes de i18n da UI
  de Controle.
  Exemplo: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Execute `pnpm qa:otel:smoke` ao validar telemetria de lançamento. Ele exercita
  o QA-lab por meio de um receptor OTLP/HTTP local e verifica os nomes de spans
  de trace exportados, atributos limitados e redação de conteúdo/identificador sem
  exigir Opik, Langfuse ou outro coletor externo.
- Execute `pnpm release:check` antes de todo lançamento com tag
- Execute `OpenClaw Release Publish` para a sequência mutável de publicação depois que a
  tag existir. Dispare-o a partir de `release/YYYY.M.D` (ou `main` ao publicar uma
  tag alcançável por main), passe a tag de lançamento e o `preflight_run_id`
  bem-sucedido do npm do OpenClaw, e mantenha o escopo padrão de publicação de plugins
  `all-publishable`, a menos que você esteja executando deliberadamente um reparo focado. O
  workflow serializa a publicação npm de plugins, a publicação de plugins no ClawHub e a publicação npm do OpenClaw
  para que o pacote central não seja publicado antes de seus plugins externalizados.
- As verificações de lançamento agora rodam em um workflow manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` também executa a lane de paridade mock do QA Lab mais o perfil
  Matrix live rápido e a lane de QA do Telegram antes da aprovação de lançamento. As lanes live
  usam o ambiente `qa-live-shared`; o Telegram também usa leases de credenciais CI do Convex.
  Execute o workflow manual `QA-Lab - All Lanes` com
  `matrix_profile=all` e `matrix_shards=true` quando quiser inventário completo de transporte
  Matrix, mídia e E2EE em paralelo.
- A validação de runtime de instalação e upgrade entre SOs faz parte dos workflows públicos
  `OpenClaw Release Checks` e `Full Release Validation`, que chamam diretamente o
  workflow reutilizável
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Essa separação é intencional: mantenha o caminho real de lançamento npm curto,
  determinístico e focado em artefatos, enquanto verificações live mais lentas ficam em sua
  própria lane para que não travem nem bloqueiem a publicação
- Verificações de lançamento que carregam segredos devem ser disparadas por meio de `Full Release
Validation` ou a partir da ref de workflow `main`/release para que a lógica do workflow e os
  segredos permaneçam controlados
- `OpenClaw Release Checks` aceita uma branch, tag ou SHA completo de commit, desde que
  o commit resolvido seja alcançável a partir de uma branch do OpenClaw ou tag de lançamento
- O preflight somente de validação `OpenClaw NPM Release` também aceita o SHA completo
  atual de 40 caracteres do commit da branch do workflow sem exigir uma tag enviada
- Esse caminho por SHA é somente de validação e não pode ser promovido para uma publicação real
- No modo SHA, o workflow sintetiza `v<package.json version>` apenas para a
  verificação de metadados do pacote; a publicação real ainda exige uma tag de lançamento real
- Ambos os workflows mantêm o caminho real de publicação e promoção em runners hospedados pelo GitHub,
  enquanto o caminho de validação não mutável pode usar os runners Linux maiores da
  Blacksmith
- Esse workflow executa
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando os segredos de workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- O preflight de lançamento npm não espera mais pela lane separada de verificações de lançamento
- Antes de criar localmente a tag de um candidato de lançamento, execute
  `RELEASE_TAG=vYYYY.M.D-beta.N pnpm release:fast-pretag-check`. O helper
  executa as proteções rápidas de lançamento, verificações de lançamento npm/ClawHub de plugins, build,
  build da UI e `release:openclaw:npm:check` na ordem que captura erros comuns que bloqueiam
  aprovação antes de o workflow de publicação do GitHub começar.
- Execute `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou a tag beta/correção correspondente) antes da aprovação
- Após a publicação npm, execute
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou a versão beta/correção correspondente) para verificar o caminho de instalação do registro publicado
  em um prefixo temporário novo
- Após uma publicação beta, execute `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  para verificar onboarding de pacote instalado, configuração do Telegram e E2E real de Telegram
  contra o pacote npm publicado usando o pool compartilhado de credenciais leased do Telegram.
  Execuções locais pontuais de mantenedor podem omitir as variáveis do Convex e passar diretamente as três
  credenciais de ambiente `OPENCLAW_QA_TELEGRAM_*`.
- Para executar o smoke beta completo pós-publicação a partir da máquina de um mantenedor, use `pnpm release:beta-smoke -- --beta betaN`. O helper executa validação npm de atualização/novo alvo no Parallels, dispara `NPM Telegram Beta E2E`, faz polling da execução exata do workflow, baixa o artefato e imprime o relatório do Telegram.
- Mantenedores podem executar a mesma verificação pós-publicação pelo GitHub Actions por meio do
  workflow manual `NPM Telegram Beta E2E`. Ele é intencionalmente apenas manual e
  não roda em todo merge.
- A automação de lançamento de mantenedores agora usa preflight-depois-promover:
  - a publicação npm real deve passar um `preflight_run_id` npm bem-sucedido
  - a publicação npm real deve ser disparada a partir da mesma branch `main` ou
    `release/YYYY.M.D` da execução de preflight bem-sucedida
  - lançamentos npm estáveis usam `beta` por padrão
  - a publicação npm estável pode mirar explicitamente em `latest` por meio da entrada do workflow
  - a mutação de dist-tag npm baseada em token agora vive em
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
    por segurança, porque `npm dist-tag add` ainda precisa de `NPM_TOKEN`, enquanto o
    repositório público mantém publicação somente via OIDC
  - o `macOS Release` público é somente de validação; quando uma tag existe apenas em uma
    branch de lançamento, mas o workflow é disparado a partir de `main`, defina
    `public_release_branch=release/YYYY.M.D`
  - a publicação privada real para Mac deve passar por `preflight_run_id` e
    `validate_run_id` privados de Mac bem-sucedidos
  - os caminhos reais de publicação promovem artefatos preparados em vez de reconstruí-los
    novamente
- Para lançamentos estáveis de correção como `YYYY.M.D-N`, o verificador pós-publicação
  também verifica o mesmo caminho de upgrade com prefixo temporário de `YYYY.M.D` para `YYYY.M.D-N`
  para que correções de lançamento não deixem silenciosamente instalações globais antigas no
  payload estável base
- O preflight de lançamento npm falha fechado a menos que o tarball inclua tanto
  `dist/control-ui/index.html` quanto um payload não vazio em `dist/control-ui/assets/`
  para que não enviemos novamente um painel de navegador vazio
- A verificação pós-publicação também verifica se os entrypoints de plugins publicados e
  os metadados de pacote estão presentes no layout instalado do registro. Um lançamento que
  envia payloads de runtime de plugin ausentes falha no verificador pós-publicação e
  não pode ser promovido para `latest`.
- `pnpm test:install:smoke` também aplica o orçamento de `unpackedSize` do npm pack ao
  tarball candidato de atualização, para que o e2e do instalador capture inchaço acidental de pacote
  antes do caminho de publicação de lançamento
- Se o trabalho de lançamento tocou no planejamento de CI, manifestos de temporização de extensões ou
  matrizes de teste de extensões, regenere e revise as saídas de matriz
  `plugin-prerelease-extension-shard`, pertencentes ao planejador, de
  `.github/workflows/plugin-prerelease.yml` antes da aprovação para que as notas de lançamento não
  descrevam um layout de CI desatualizado
- A prontidão de lançamento estável do macOS também inclui as superfícies do atualizador:
  - o release do GitHub deve acabar com o `.zip`, `.dmg` e `.dSYM.zip` empacotados
  - `appcast.xml` em `main` deve apontar para o novo zip estável após a publicação; o
    workflow privado de publicação macOS faz o commit automaticamente ou abre um PR de appcast
    quando push direto é bloqueado
  - o app empacotado deve manter um bundle id não debug, uma URL de feed Sparkle
    não vazia e um `CFBundleVersion` igual ou superior ao piso canônico de build do Sparkle
    para essa versão de lançamento

## Caixas de teste de lançamento

`Full Release Validation` é como operadores iniciam todos os testes de pré-lançamento a partir de
um único ponto de entrada. Para uma prova de commit fixado em um branch que se move rapidamente, use o
helper para que cada workflow filho seja executado a partir de um branch temporário fixado no SHA
alvo:

```bash
pnpm ci:full-release --sha <full-sha>
```

O helper envia `release-ci/<sha>-...`, dispara `Full Release Validation`
a partir desse branch com `ref=<sha>`, verifica se cada `headSha` de workflow filho
corresponde ao alvo e, em seguida, exclui o branch temporário. Isso evita provar acidentalmente uma
execução filha de `main` mais nova.

Para validação de branch ou tag de lançamento, execute a partir da ref confiável de workflow `main`
e passe o branch ou a tag de lançamento como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

O workflow resolve a ref alvo, dispara `CI` manual com
`target_ref=<release-ref>`, dispara `OpenClaw Release Checks`, prepara um
artefato pai `release-package-under-test` para verificações voltadas a pacote e
dispara o E2E de pacote Telegram autônomo quando `release_profile=full` com
`rerun_group=all` ou quando `release_package_spec` ou
`npm_telegram_package_spec` está definido. `OpenClaw Release
Checks` então expande para smoke de instalação, verificações de lançamento entre sistemas operacionais, cobertura live/E2E do caminho de lançamento Docker quando o soak está habilitado, Package Acceptance com QA de pacote Telegram, paridade do QA Lab, Matrix live e Telegram live. Uma execução completa só é aceitável quando o
resumo de `Full Release Validation`
mostra `normal_ci` e `release_checks` como bem-sucedidos. No modo full/all,
o filho `npm_telegram` também deve ser bem-sucedido; fora de full/all, ele é ignorado
a menos que um `release_package_spec` ou `npm_telegram_package_spec` publicado tenha sido
fornecido. O resumo final do
verificador inclui tabelas dos jobs mais lentos para cada execução filha, para que o gerente de lançamento
possa ver o caminho crítico atual sem baixar logs.
Consulte [Validação completa de lançamento](/pt-BR/reference/full-release-validation) para a
matriz completa de estágios, nomes exatos dos jobs de workflow, diferenças entre perfis stable e full,
artefatos e identificadores de reexecução focada.
Workflows filhos são disparados a partir da ref confiável que executa `Full Release
Validation`, normalmente `--ref main`, mesmo quando a `ref` alvo aponta para um
branch ou tag de lançamento mais antigo. Não há uma entrada separada de ref de workflow para Full Release Validation; escolha o harness confiável escolhendo a ref de execução do workflow.
Não use `--ref main -f ref=<sha>` para prova exata de commit em `main` móvel;
SHAs de commit brutos não podem ser refs de dispatch de workflow, então use
`pnpm ci:full-release --sha <sha>` para criar o branch temporário fixado.

Use `release_profile` para selecionar a amplitude live/provedor:

- `minimum`: caminho live e Docker OpenAI/core mais rápido e crítico para lançamento
- `stable`: minimum mais cobertura estável de provedor/backend para aprovação de lançamento
- `full`: stable mais cobertura ampla de provedor/mídia consultiva

Use `run_release_soak=true` com `stable` quando as lanes bloqueadoras de lançamento estiverem
verdes e você quiser a varredura exaustiva live/E2E, de caminho de lançamento Docker e
de sobrevivência a upgrade publicado limitada antes da promoção. Essa varredura cobre
os quatro pacotes stable mais recentes, além das linhas de base fixadas `2026.4.23` e `2026.5.2`
e da cobertura mais antiga `2026.4.15`, com linhas de base duplicadas removidas e
cada linha de base fragmentada em seu próprio job de runner Docker. `full` implica
`run_release_soak=true`.

`OpenClaw Release Checks` usa a ref confiável do workflow para resolver a ref alvo
uma vez como `release-package-under-test` e reutiliza esse artefato nas verificações entre sistemas operacionais,
Package Acceptance e Docker de caminho de lançamento quando o soak é executado. Isso mantém
todas as caixas voltadas a pacote nos mesmos bytes e evita builds repetidos de pacote.
Depois que um beta já estiver no npm, defina `release_package_spec=openclaw@YYYY.M.D-beta.N`
para que as verificações de lançamento baixem o pacote enviado uma vez, extraiam seu SHA de origem de build
de `dist/build-info.json` e reutilizem esse artefato para lanes entre sistemas operacionais,
Package Acceptance, Docker de caminho de lançamento e Telegram de pacote.
O smoke de instalação OpenAI entre sistemas operacionais usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando a
variável de repo/organização está definida; caso contrário, usa `openai/gpt-5.4`, porque essa lane está
provando instalação de pacote, onboarding, inicialização do Gateway e uma rodada live de agente,
não fazendo benchmark do modelo padrão mais lento. A matriz live de provedores mais ampla
continua sendo o lugar para cobertura específica de modelo.

Use estas variantes dependendo do estágio do lançamento:

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
  -f release_package_spec=openclaw@YYYY.M.D-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Não use o guarda-chuva completo como a primeira reexecução após uma correção focada. Se uma caixa
falhar, use o workflow filho, job, lane Docker, perfil de pacote, provedor de modelo
ou lane de QA com falha para a próxima prova. Execute o guarda-chuva completo novamente apenas quando
a correção alterar a orquestração compartilhada de lançamento ou tornar obsoleta a evidência anterior de todas as caixas.
O verificador final do guarda-chuva verifica novamente os ids de execução de workflows filhos registrados,
então, depois que um workflow filho for reexecutado com sucesso, reexecute apenas o job pai
`Verify full validation` com falha.

Para recuperação limitada, passe `rerun_group` ao guarda-chuva. `all` é a execução real de
candidato a lançamento, `ci` executa apenas o filho de CI normal, `plugin-prerelease`
executa apenas o filho de Plugin exclusivo de lançamento, `release-checks` executa todas as caixas de lançamento
e os grupos de lançamento mais estreitos são `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` e `npm-telegram`.
Reexecuções focadas de `npm-telegram` exigem `release_package_spec` ou
`npm_telegram_package_spec`; execuções full/all com `release_profile=full` usam o
artefato de pacote de release-checks. Reexecuções focadas
entre sistemas operacionais podem adicionar `cross_os_suite_filter=windows/packaged-upgrade` ou
outro filtro de sistema operacional/suíte. Falhas de QA em release-check são consultivas; uma falha somente de QA
não bloqueia a validação de lançamento.

### Vitest

A caixa Vitest é o workflow filho `CI` manual. A CI manual intencionalmente
ignora o escopo de alterações e força o grafo normal de testes para o candidato a lançamento:
shards Linux Node, shards de Plugin empacotado, contratos de canal, compatibilidade Node 22,
`check`, `check-additional`, smoke de build, verificações de docs, Skills Python, Windows, macOS, Android e i18n da Control UI.

Use esta caixa para responder "a árvore de código-fonte passou na suíte completa normal de testes?"
Ela não é o mesmo que validação de produto no caminho de lançamento. Evidências a manter:

- resumo de `Full Release Validation` mostrando a URL da execução `CI` disparada
- execução `CI` verde no SHA alvo exato
- nomes de shards com falha ou lentos dos jobs de CI ao investigar regressões
- artefatos de timing do Vitest, como `.artifacts/vitest-shard-timings.json`, quando
  uma execução precisar de análise de desempenho

Execute a CI manual diretamente apenas quando o lançamento precisar de CI normal determinística, mas
não das caixas Docker, QA Lab, live, entre sistemas operacionais ou de pacote:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

A caixa Docker fica em `OpenClaw Release Checks` por meio de
`openclaw-live-and-e2e-checks-reusable.yml`, além do workflow `install-smoke`
em modo de lançamento. Ela valida o candidato a lançamento por meio de ambientes Docker
empacotados, em vez de apenas testes em nível de código-fonte.

A cobertura Docker de lançamento inclui:

- smoke completo de instalação com o smoke lento de instalação global Bun habilitado
- preparação/reutilização da imagem de smoke do Dockerfile raiz por SHA alvo, com jobs de smoke de QR,
  raiz/Gateway e instalador/Bun executando como shards install-smoke separados
- lanes E2E de repositório
- chunks Docker de caminho de lançamento: `core`, `package-update-openai`,
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
- suítes live/E2E de provedor e cobertura live de modelo Docker quando as verificações de lançamento
  incluem suítes live

Use artefatos Docker antes de reexecutar. O agendador de caminho de lançamento faz upload de
`.artifacts/docker-tests/` com logs de lanes, `summary.json`, `failures.json`,
timings de fases, JSON do plano do agendador e comandos de reexecução. Para recuperação focada,
use `docker_lanes=<lane[,lane]>` no workflow reutilizável live/E2E em vez de
reexecutar todos os chunks de lançamento. Comandos de reexecução gerados incluem
`package_artifact_run_id` anterior e entradas de imagem Docker preparada quando disponíveis, para que uma
lane com falha possa reutilizar o mesmo tarball e imagens GHCR.

### QA Lab

A caixa QA Lab também faz parte de `OpenClaw Release Checks`. Ela é o gate de
lançamento de comportamento agentic e em nível de canal, separado da mecânica de pacote
do Vitest e do Docker.

A cobertura QA Lab de lançamento inclui:

- lane de paridade mock comparando a lane candidata OpenAI com a linha de base Opus 4.6
  usando o pacote de paridade agentic
- perfil rápido de QA Matrix live usando o ambiente `qa-live-shared`
- lane de QA Telegram live usando leases de credenciais Convex CI
- `pnpm qa:otel:smoke` quando a telemetria de lançamento precisa de prova local explícita

Use esta caixa para responder "o lançamento se comporta corretamente em cenários de QA e
fluxos de canal live?" Mantenha as URLs de artefatos para as lanes de paridade, Matrix e Telegram
ao aprovar o lançamento. A cobertura completa de Matrix continua disponível como uma
execução QA-Lab fragmentada manual, em vez da lane padrão crítica para lançamento.

### Pacote

A caixa Package é o gate de produto instalável. Ela é apoiada por
`Package Acceptance` e pelo resolvedor
`scripts/resolve-openclaw-package-candidate.mjs`. O resolvedor normaliza um
candidato no tarball `package-under-test` consumido pelo Docker E2E, valida
o inventário do pacote, registra a versão do pacote e o SHA-256 e mantém a
ref do harness de workflow separada da ref de origem do pacote.

Origens de candidato compatíveis:

- `source=npm`: `openclaw@beta`, `openclaw@latest` ou uma versão exata de lançamento do OpenClaw
- `source=ref`: empacotar um branch, tag ou SHA completo de commit confiável de `package_ref`
  com o harness `workflow_ref` selecionado
- `source=url`: baixar um `.tgz` HTTPS com `package_sha256` obrigatório
- `source=artifact`: reutilizar um `.tgz` enviado por outra execução do GitHub Actions

`OpenClaw Release Checks` executa Package Acceptance com `source=artifact`, o
artefato do pacote de lançamento preparado, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance mantém a migração, a atualização,
a reinicialização de atualização com autenticação configurada, a instalação live de skill do ClawHub, a limpeza de dependência obsoleta de Plugin, os
fixtures de Plugin offline, a atualização de Plugin e a QA de pacote do Telegram no mesmo
tarball resolvido. As verificações bloqueantes de lançamento usam o baseline padrão do pacote publicado mais recente;
`run_release_soak=true` ou
`release_profile=full` expande para todos os baselines estáveis publicados no npm de
`2026.4.23` até `latest`, além dos fixtures de problemas relatados. Use
Package Acceptance com `source=npm` para um candidato já lançado, ou
`source=ref`/`source=artifact` para um tarball npm local com respaldo em SHA antes da
publicação. Ele é o substituto nativo do GitHub para a maior parte da cobertura de pacote/atualização que antes exigia
Parallels. Verificações de lançamento entre sistemas operacionais ainda são importantes para onboarding,
instalador e comportamento de plataforma específicos do sistema operacional, mas a validação de produto de pacote/atualização deve
preferir Package Acceptance.

A checklist canônica para validação de atualização e Plugin é
[Testando atualizações e plugins](/pt-BR/help/testing-updates-plugins). Use-a ao
decidir qual lane local, Docker, Package Acceptance ou de verificação de lançamento prova uma
instalação/atualização de Plugin, limpeza do doctor ou alteração de migração de pacote publicado.
A migração exaustiva de atualização publicada de todos os pacotes estáveis `2026.4.23+` é
um workflow manual separado `Update Migration`, não parte do Full Release CI.

A leniência legada de aceitação de pacote é intencionalmente limitada no tempo. Pacotes até
`2026.4.25` podem usar o caminho de compatibilidade para lacunas de metadados já publicadas
no npm: entradas privadas de inventário de QA ausentes no tarball, ausência de
`gateway install --wrapper`, arquivos de patch ausentes no fixture git derivado do tarball,
ausência de `update.channel` persistido, locais legados de registros de instalação de Plugin,
ausência de persistência de registros de instalação do marketplace e migração de metadados de configuração
durante `plugins update`. O pacote publicado `2026.4.26` pode avisar
sobre arquivos locais de carimbo de metadados de build que já foram lançados. Pacotes posteriores
devem satisfazer os contratos modernos de pacote; essas mesmas lacunas falham a
validação de lançamento.

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

- `smoke`: lanes rápidas de instalação de pacote/canal/agente, rede do Gateway e recarregamento de configuração
- `package`: contratos de pacote de instalação/atualização/reinicialização/Plugin mais prova de instalação live de skill do ClawHub; este é o padrão da verificação de lançamento
- `product`: `package` mais canais MCP, limpeza de cron/subagente, pesquisa web da OpenAI e OpenWebUI
- `full`: blocos de caminho de lançamento Docker com OpenWebUI
- `custom`: lista exata de `docker_lanes` para reexecuções focadas

Para prova do Telegram de candidato a pacote, habilite `telegram_mode=mock-openai` ou
`telegram_mode=live-frontier` em Package Acceptance. O workflow passa o
tarball `package-under-test` resolvido para a lane do Telegram; o workflow autônomo do
Telegram ainda aceita uma especificação npm publicada para verificações pós-publicação.

## Automação de publicação de lançamento

`OpenClaw Release Publish` é o ponto de entrada mutável normal de publicação. Ele
orquestra os workflows de editor confiável na ordem que o lançamento precisa:

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

Promoção estável diretamente para `latest` é explícita:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Use os workflows de nível mais baixo `Plugin NPM Release` e `Plugin ClawHub Release`
apenas para trabalho focado de reparo ou republicação. Para um reparo de Plugin selecionado, passe
`plugin_publish_scope=selected` e `plugins=@openclaw/name` para
`OpenClaw Release Publish`, ou dispare o workflow filho diretamente quando o
pacote OpenClaw não deve ser publicado.

## Entradas do workflow NPM

`OpenClaw NPM Release` aceita estas entradas controladas pelo operador:

- `tag`: tag de lançamento obrigatória, como `v2026.4.2`, `v2026.4.2-1` ou
  `v2026.4.2-beta.1`; quando `preflight_only=true`, também pode ser o SHA de commit completo de 40 caracteres do branch do workflow atual para preflight somente de validação
- `preflight_only`: `true` apenas para validação/build/pacote, `false` para o
  caminho real de publicação
- `preflight_run_id`: obrigatório no caminho real de publicação para que o workflow reutilize
  o tarball preparado da execução de preflight bem-sucedida
- `npm_dist_tag`: tag alvo do npm para o caminho de publicação; o padrão é `beta`

`OpenClaw Release Publish` aceita estas entradas controladas pelo operador:

- `tag`: tag de lançamento obrigatória; já deve existir
- `preflight_run_id`: id da execução de preflight bem-sucedida de `OpenClaw NPM Release`;
  obrigatório quando `publish_openclaw_npm=true`
- `npm_dist_tag`: tag alvo do npm para o pacote OpenClaw
- `plugin_publish_scope`: o padrão é `all-publishable`; use `selected` apenas
  para trabalho focado de reparo
- `plugins`: nomes de pacotes `@openclaw/*` separados por vírgula quando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: o padrão é `true`; defina `false` apenas ao usar o
  workflow como orquestrador de reparo somente de Plugin
- `wait_for_clawhub`: o padrão é `false`, para que a disponibilidade no npm não seja bloqueada pela
  sidecar do ClawHub; defina `true` apenas quando a conclusão do workflow precisar incluir
  a conclusão do ClawHub

`OpenClaw Release Checks` aceita estas entradas controladas pelo operador:

- `ref`: branch, tag ou SHA de commit completo a validar. Verificações que carregam segredos
  exigem que o commit resolvido seja alcançável a partir de um branch OpenClaw ou
  tag de lançamento.
- `run_release_soak`: optar por soak exaustivo live/E2E, caminho de lançamento Docker e
  upgrade-survivor desde todos os lançamentos em verificações de lançamento estável/padrão. É forçado
  por `release_profile=full`.

Regras:

- Tags estáveis e de correção podem publicar para `beta` ou `latest`
- Tags beta de pré-lançamento podem publicar apenas para `beta`
- Para `OpenClaw NPM Release`, entrada de SHA de commit completo é permitida apenas quando
  `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` são sempre
  somente validação
- O caminho real de publicação deve usar a mesma `npm_dist_tag` usada durante o preflight;
  o workflow verifica esses metadados antes que a publicação continue

## Sequência de lançamento npm estável

Ao preparar um lançamento npm estável:

1. Execute `OpenClaw NPM Release` com `preflight_only=true`
   - Antes de uma tag existir, você pode usar o SHA de commit completo do branch do workflow atual
     para uma execução seca somente de validação do workflow de preflight
2. Escolha `npm_dist_tag=beta` para o fluxo normal beta-primeiro, ou `latest` apenas
   quando você intencionalmente quiser uma publicação estável direta
3. Execute `Full Release Validation` no branch de lançamento, tag de lançamento ou SHA de commit completo
   quando quiser CI normal mais cache de prompt live, Docker, QA Lab,
   Matrix e cobertura do Telegram em um workflow manual
4. Se você intencionalmente só precisar do grafo de testes normal determinístico, execute o
   workflow manual `CI` na ref de lançamento
5. Salve o `preflight_run_id` bem-sucedido
6. Execute `OpenClaw Release Publish` com a mesma `tag`, a mesma `npm_dist_tag`,
   e o `preflight_run_id` salvo; ele publica plugins externalizados no npm
   e no ClawHub antes de promover o pacote npm OpenClaw
7. Se o lançamento chegou em `beta`, use o workflow privado
   `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover essa versão estável de `beta` para `latest`
8. Se o lançamento foi publicado intencionalmente diretamente em `latest` e `beta`
   deve seguir imediatamente o mesmo build estável, use esse mesmo workflow privado
   para apontar ambas as dist-tags para a versão estável, ou deixe sua sincronização
   programada de autocorreção mover `beta` posteriormente

A mutação de dist-tag vive no repositório privado por segurança porque ainda
exige `NPM_TOKEN`, enquanto o repositório público mantém publicação somente por OIDC.

Isso mantém o caminho de publicação direta e o caminho de promoção beta-primeiro
documentados e visíveis ao operador.

Se um mantenedor precisar recorrer à autenticação npm local, execute quaisquer comandos da
CLI 1Password (`op`) apenas dentro de uma sessão tmux dedicada. Não chame `op`
diretamente pelo shell principal do agente; mantê-lo dentro do tmux torna prompts,
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
