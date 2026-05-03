---
read_when:
    - Procurando definições de canais de lançamento públicos
    - Executando a validação de lançamento ou a aceitação de pacote
    - Buscando a nomenclatura e a cadência das versões
summary: Raias de lançamento, lista de verificação do operador, ambientes de validação, nomenclatura de versões e cadência
title: Política de lançamento
x-i18n:
    generated_at: "2026-05-03T05:54:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: ba316d1736eae8edd2fb0a71b9a3da345f8895c3b536e9a1f619718ea12fc851
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw tem três canais públicos de lançamento:

- stable: lançamentos marcados por tag que publicam no npm `beta` por padrão, ou no npm `latest` quando solicitado explicitamente
- beta: tags de pré-lançamento que publicam no npm `beta`
- dev: o topo móvel de `main`

## Nomenclatura de versões

- Versão de lançamento estável: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versão de lançamento de correção estável: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versão de pré-lançamento beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Não preencha mês ou dia com zero à esquerda
- `latest` significa o lançamento npm estável promovido atual
- `beta` significa o destino atual de instalação beta
- Lançamentos estáveis e de correção estável publicam no npm `beta` por padrão; operadores de lançamento podem direcionar para `latest` explicitamente, ou promover depois uma compilação beta validada
- Todo lançamento estável do OpenClaw entrega o pacote npm e o app macOS juntos;
  lançamentos beta normalmente validam e publicam primeiro o caminho npm/pacote, com
  compilação/assinatura/notarização do app Mac reservadas para estável, a menos que solicitadas explicitamente

## Cadência de lançamento

- Os lançamentos avançam primeiro pelo beta
- O estável vem somente depois que o beta mais recente é validado
- Mantenedores normalmente criam lançamentos a partir de uma branch `release/YYYY.M.D` criada
  a partir do `main` atual, para que a validação e as correções do lançamento não bloqueiem novo
  desenvolvimento em `main`
- Se uma tag beta tiver sido enviada por push ou publicada e precisar de correção, mantenedores criam
  a próxima tag `-beta.N` em vez de excluir ou recriar a tag beta antiga
- O procedimento detalhado de lançamento, aprovações, credenciais e notas de recuperação são
  exclusivos para mantenedores

## Checklist do operador de lançamento

Este checklist é o formato público do fluxo de lançamento. Credenciais privadas,
assinatura, notarização, recuperação de dist-tag e detalhes de rollback de emergência permanecem no
runbook de lançamento exclusivo para mantenedores.

1. Comece a partir do `main` atual: puxe a versão mais recente, confirme que o commit de destino foi enviado por push
   e confirme que o CI do `main` atual está suficientemente verde para criar a branch a partir dele.
2. Reescreva a seção superior de `CHANGELOG.md` a partir do histórico real de commits com
   `/changelog`, mantenha as entradas voltadas ao usuário, faça commit, envie por push e faça rebase/pull
   mais uma vez antes de criar a branch.
3. Revise os registros de compatibilidade de lançamento em
   `src/plugins/compat/registry.ts` e
   `src/commands/doctor/shared/deprecation-compat.ts`. Remova compatibilidade expirada
   somente quando o caminho de atualização continuar coberto, ou registre por que ela está sendo
   mantida intencionalmente.
4. Crie `release/YYYY.M.D` a partir do `main` atual; não faça trabalho normal de lançamento
   diretamente em `main`.
5. Incremente todos os locais de versão necessários para a tag pretendida, execute
   `pnpm plugins:sync` para que pacotes de Plugin publicáveis compartilhem a versão de lançamento
   e os metadados de compatibilidade, depois execute a pré-verificação determinística local:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` e
   `pnpm release:check`.
6. Execute `OpenClaw NPM Release` com `preflight_only=true`. Antes de uma tag existir,
   um SHA completo de 40 caracteres da branch de lançamento é permitido para pré-verificação
   somente de validação. Salve o `preflight_run_id` bem-sucedido.
7. Inicie todos os testes de pré-lançamento com `Full Release Validation` para a
   branch de lançamento, tag ou SHA completo de commit. Este é o único ponto de entrada manual
   para as quatro grandes caixas de teste de lançamento: Vitest, Docker, QA Lab e Package.
8. Se a validação falhar, corrija na branch de lançamento e execute novamente o menor
   arquivo, canal, job de workflow, perfil de pacote, provedor ou lista de permissão de modelo que
   comprove a correção. Execute novamente o guarda-chuva completo somente quando a superfície alterada tornar
   evidências anteriores obsoletas.
9. Para beta, crie a tag `vYYYY.M.D-beta.N` e então execute `OpenClaw Release Publish` a partir
   da branch `release/YYYY.M.D` correspondente. Ele verifica `pnpm plugins:sync:check`,
   publica primeiro todos os pacotes de Plugin publicáveis no npm, publica o mesmo
   conjunto no ClawHub em seguida e então promove o artefato de pré-verificação npm do OpenClaw
   preparado com a dist-tag correspondente. Após a publicação, execute a aceitação de pacote
   pós-publicação contra o pacote `openclaw@YYYY.M.D-beta.N` ou
   `openclaw@beta` publicado. Se um pré-lançamento enviado por push ou publicado precisar de correção,
   crie o próximo número de pré-lançamento correspondente; não exclua nem reescreva o
   pré-lançamento antigo.
10. Para estável, continue somente depois que o beta validado ou candidato a lançamento tiver as
    evidências de validação necessárias. A publicação npm estável também passa por
    `OpenClaw Release Publish`, reutilizando o artefato de pré-verificação bem-sucedido via
    `preflight_run_id`; a prontidão do lançamento macOS estável também exige o
    `.zip`, `.dmg`, `.dSYM.zip` empacotados e o `appcast.xml` atualizado em `main`.
11. Após a publicação, execute o verificador npm pós-publicação, o E2E Telegram
    publicado-npm autônomo opcional quando precisar de prova de canal pós-publicação,
    promoção de dist-tag quando necessário, notas de lançamento/pré-lançamento do GitHub a partir da
    seção completa correspondente de `CHANGELOG.md` e as etapas de anúncio do lançamento.

## Pré-verificação de lançamento

- Execute `pnpm check:test-types` antes da validação prévia da versão para que o TypeScript de teste permaneça coberto fora da barreira local mais rápida `pnpm check`
- Execute `pnpm check:architecture` antes da validação prévia da versão para que as verificações mais amplas de ciclos de importação e limites de arquitetura fiquem verdes fora da barreira local mais rápida
- Execute `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que os artefatos de versão esperados em `dist/*` e o pacote da Control UI existam para a etapa de validação do pacote
- Execute `pnpm plugins:sync` depois do bump da versão raiz e antes de criar a tag. Ele atualiza as versões dos pacotes de plugins publicáveis, os metadados de compatibilidade de peer/API do OpenClaw, os metadados de build e os stubs de changelog dos plugins para corresponder à versão do core. `pnpm plugins:sync:check` é a guarda de versão não mutante; o fluxo de publicação falha antes de qualquer mutação no registro se essa etapa tiver sido esquecida.
- Execute o workflow manual `Full Release Validation` antes da aprovação da versão para iniciar todas as caixas de teste de pré-lançamento a partir de um único ponto de entrada. Ele aceita uma branch, tag ou SHA completo de commit, dispara `CI` manual e dispara `OpenClaw Release Checks` para smoke de instalação, aceitação de pacote, suítes de caminho de release do Docker, live/E2E, OpenWebUI, paridade do QA Lab, Matrix e lanes do Telegram. Com `release_profile=full` e `rerun_group=all`, ele também executa o E2E de pacote do Telegram contra o artefato `release-package-under-test` das verificações de versão. Forneça `npm_telegram_package_spec` depois da publicação quando o mesmo E2E do Telegram também deve comprovar o pacote npm publicado. Forneça `package_acceptance_package_spec` depois da publicação quando Package Acceptance deve executar sua matriz de pacote/atualização contra o pacote npm enviado, em vez do artefato criado a partir do SHA. Forneça `evidence_package_spec` quando o relatório privado de evidências deve comprovar que a validação corresponde a um pacote npm publicado sem forçar o E2E do Telegram. Exemplo: `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Execute o workflow manual `Package Acceptance` quando quiser prova por canal lateral para um candidato de pacote enquanto o trabalho de release continua. Use `source=npm` para `openclaw@beta`, `openclaw@latest` ou uma versão exata de release; `source=ref` para empacotar uma branch/tag/SHA confiável de `package_ref` com o harness atual de `workflow_ref`; `source=url` para um tarball HTTPS com SHA-256 obrigatório; ou `source=artifact` para um tarball enviado por outro run do GitHub Actions. O workflow resolve o candidato para `package-under-test`, reutiliza o agendador de release Docker E2E contra esse tarball e pode executar QA do Telegram contra o mesmo tarball com `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`. Quando as lanes Docker selecionadas incluem `published-upgrade-survivor`, o artefato do pacote é o candidato e `published_upgrade_survivor_baseline` seleciona a baseline publicada.
  Exemplo: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Perfis comuns:
  - `smoke`: lanes de instalação/canal/agente, rede do Gateway e recarga de configuração
  - `package`: lanes nativas de artefato para pacote/atualização/plugin sem OpenWebUI ou ClawHub live
  - `product`: perfil de pacote mais canais MCP, limpeza de cron/subagente, busca web da OpenAI e OpenWebUI
  - `full`: partes do caminho de release Docker com OpenWebUI
  - `custom`: seleção exata de `docker_lanes` para uma nova execução focada
- Execute o workflow manual `CI` diretamente quando você precisar apenas de cobertura completa de CI normal para o candidato de release. Disparos manuais de CI ignoram o escopo por mudanças e forçam as partes Linux Node, partes de plugins empacotados, contratos de canal, compatibilidade com Node 22, `check`, `check-additional`, smoke de build, verificações de docs, Skills em Python, Windows, macOS, Android e lanes de i18n da Control UI.
  Exemplo: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Execute `pnpm qa:otel:smoke` ao validar telemetria de release. Ele exercita o QA-lab por meio de um receptor OTLP/HTTP local e verifica os nomes de spans de trace exportados, atributos limitados e redação de conteúdo/identificador sem exigir Opik, Langfuse ou outro coletor externo.
- Execute `pnpm release:check` antes de toda versão com tag
- Execute `OpenClaw Release Publish` para a sequência de publicação mutante depois que a tag existir. Dispare-o a partir de `release/YYYY.M.D` (ou `main` ao publicar uma tag alcançável por main), passe a tag de release e o `preflight_run_id` bem-sucedido do npm do OpenClaw, e mantenha o escopo padrão de publicação de plugin `all-publishable`, a menos que você esteja executando deliberadamente um reparo focado. O workflow serializa a publicação npm de plugins, a publicação ClawHub de plugins e a publicação npm do OpenClaw para que o pacote core não seja publicado antes de seus plugins externalizados.
- As verificações de release agora rodam em um workflow manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` também executa a lane de paridade mock do QA Lab, além do perfil rápido live do Matrix e da lane de QA do Telegram antes da aprovação da release. As lanes live usam o ambiente `qa-live-shared`; o Telegram também usa leases de credenciais do Convex CI. Execute o workflow manual `QA-Lab - All Lanes` com `matrix_profile=all` e `matrix_shards=true` quando quiser inventário completo de transporte, mídia e E2EE do Matrix em paralelo.
- A validação em runtime de instalação e upgrade entre sistemas operacionais faz parte dos workflows públicos `OpenClaw Release Checks` e `Full Release Validation`, que chamam diretamente o workflow reutilizável `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Essa separação é intencional: manter o caminho real de release npm curto, determinístico e focado em artefatos, enquanto verificações live mais lentas ficam em sua própria lane para que não atrasem nem bloqueiem a publicação
- Verificações de release que carregam segredos devem ser disparadas por meio de `Full Release Validation` ou a partir da ref de workflow `main`/release para que a lógica do workflow e os segredos permaneçam controlados
- `OpenClaw Release Checks` aceita uma branch, tag ou SHA completo de commit, desde que o commit resolvido seja alcançável a partir de uma branch do OpenClaw ou tag de release
- A validação somente de preflight de `OpenClaw NPM Release` também aceita o SHA completo atual de 40 caracteres do commit da branch do workflow sem exigir uma tag enviada
- Esse caminho por SHA é somente de validação e não pode ser promovido para uma publicação real
- No modo SHA, o workflow sintetiza `v<package.json version>` apenas para a verificação dos metadados do pacote; a publicação real ainda exige uma tag de release real
- Ambos os workflows mantêm o caminho real de publicação e promoção em runners hospedados pelo GitHub, enquanto o caminho de validação não mutante pode usar os runners Linux maiores da Blacksmith
- Esse workflow executa
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando os secrets de workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- O preflight de release npm não espera mais pela lane separada de verificações de release
- Execute `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou a tag beta/correção correspondente) antes da aprovação
- Depois da publicação npm, execute
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou a versão beta/correção correspondente) para verificar o caminho de instalação no registro publicado em um prefixo temporário novo
- Depois de uma publicação beta, execute `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  para verificar onboarding do pacote instalado, configuração do Telegram e E2E real do Telegram contra o pacote npm publicado usando o pool compartilhado de credenciais alugadas do Telegram. Execuções locais avulsas de mantenedores podem omitir as variáveis do Convex e passar diretamente as três credenciais de ambiente `OPENCLAW_QA_TELEGRAM_*`.
- Mantenedores podem executar a mesma verificação pós-publicação pelo GitHub Actions usando o workflow manual `NPM Telegram Beta E2E`. Ele é intencionalmente apenas manual e não roda a cada merge.
- A automação de release dos mantenedores agora usa preflight seguido de promoção:
  - a publicação npm real deve passar por um `preflight_run_id` npm bem-sucedido
  - a publicação npm real deve ser disparada a partir da mesma branch `main` ou `release/YYYY.M.D` do run de preflight bem-sucedido
  - releases npm estáveis usam `beta` por padrão
  - a publicação npm estável pode mirar explicitamente em `latest` via input do workflow
  - a mutação de dist-tag npm baseada em token agora fica em `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` por segurança, porque `npm dist-tag add` ainda precisa de `NPM_TOKEN`, enquanto o repositório público mantém publicação somente com OIDC
  - `macOS Release` público é somente de validação; quando uma tag existe apenas em uma branch de release, mas o workflow é disparado a partir de `main`, defina `public_release_branch=release/YYYY.M.D`
  - a publicação real privada do Mac deve passar por `preflight_run_id` e `validate_run_id` privados do Mac bem-sucedidos
  - os caminhos reais de publicação promovem artefatos preparados em vez de reconstruí-los novamente
- Para releases estáveis de correção como `YYYY.M.D-N`, o verificador pós-publicação também verifica o mesmo caminho de upgrade em prefixo temporário de `YYYY.M.D` para `YYYY.M.D-N`, para que correções de release não deixem silenciosamente instalações globais antigas no payload estável base
- O preflight de release npm falha fechado, a menos que o tarball inclua tanto `dist/control-ui/index.html` quanto um payload não vazio em `dist/control-ui/assets/`, para que não enviemos novamente um dashboard de navegador vazio
- A verificação pós-publicação também verifica se os entrypoints de plugins publicados e os metadados de pacote estão presentes no layout instalado do registro. Uma release que envia payloads ausentes de runtime de plugin falha no verificador postpublish e não pode ser promovida para `latest`.
- `pnpm test:install:smoke` também aplica o orçamento de `unpackedSize` do pacote npm no tarball candidato de atualização, então o e2e do instalador captura crescimento acidental do pacote antes do caminho de publicação da release
- Se o trabalho de release tocou o planejamento de CI, manifestos de tempo de extensões ou matrizes de teste de extensões, regenere e revise as saídas de matriz `plugin-prerelease-extension-shard` pertencentes ao planejador em `.github/workflows/plugin-prerelease.yml` antes da aprovação, para que as notas de release não descrevam um layout de CI obsoleto
- A prontidão de release estável para macOS também inclui as superfícies de atualização:
  - a release do GitHub deve terminar com os pacotes `.zip`, `.dmg` e `.dSYM.zip`
  - `appcast.xml` em `main` deve apontar para o novo zip estável depois da publicação
  - o app empacotado deve manter um bundle id não debug, uma URL de feed Sparkle não vazia e um `CFBundleVersion` igual ou superior ao piso canônico de build do Sparkle para essa versão de release

## Caixas de teste de release

`Full Release Validation` é como operadores iniciam todos os testes de pré-release a partir de um único ponto de entrada. Para prova de commit fixado em uma branch que muda rapidamente, use o helper para que cada workflow filho rode a partir de uma branch temporária fixada no SHA alvo:

```bash
pnpm ci:full-release --sha <full-sha>
```

O helper envia `release-ci/<sha>-...`, dispara `Full Release Validation` a partir dessa branch com `ref=<sha>`, verifica se o `headSha` de cada workflow filho corresponde ao alvo e então exclui a branch temporária. Isso evita comprovar por acidente um run filho de `main` mais novo.

Para validação de branch ou tag de release, execute a partir da ref confiável de workflow `main` e passe a branch ou tag de release como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

O workflow resolve a ref de destino, dispara manualmente `CI` com
`target_ref=<release-ref>`, dispara `OpenClaw Release Checks` e dispara o E2E
standalone do pacote Telegram quando `release_profile=full` com
`rerun_group=all` ou quando `npm_telegram_package_spec` está definido. Em
seguida, `OpenClaw Release Checks` distribui smoke de instalação, verificações
de release entre sistemas operacionais, cobertura live/E2E Docker do caminho de
release, Package Acceptance com QA do pacote Telegram, paridade do QA Lab, Matrix
live e Telegram live. Uma execução completa só é aceitável quando o resumo de
`Full Release Validation` mostra `normal_ci` e `release_checks` como
bem-sucedidos. No modo full/all, o filho `npm_telegram` também precisa ser
bem-sucedido; fora de full/all, ele é ignorado, a menos que um
`npm_telegram_package_spec` publicado tenha sido fornecido. O resumo final do
verificador inclui tabelas dos jobs mais lentos para cada execução filha, para
que o gerente de release possa ver o caminho crítico atual sem baixar logs.
Consulte [validação completa de release](/pt-BR/reference/full-release-validation)
para a matriz completa de estágios, nomes exatos dos jobs de workflow,
diferenças entre perfis stable e full, artefatos e identificadores de reexecução
focada.
Os workflows filhos são disparados a partir da ref confiável que executa
`Full Release Validation`, normalmente `--ref main`, mesmo quando a `ref` de
destino aponta para uma branch ou tag de release mais antiga. Não há uma entrada
separada de ref de workflow para Full Release Validation; escolha o harness
confiável escolhendo a ref de execução do workflow. Não use
`--ref main -f ref=<sha>` para prova de commit exata em uma `main` móvel; SHAs
brutos de commit não podem ser refs de dispatch de workflow, então use
`pnpm ci:full-release --sha <sha>` para criar a branch temporária fixada.

Use `release_profile` para selecionar a abrangência live/provedor:

- `minimum`: caminho mais rápido e crítico para release em OpenAI/core live e Docker
- `stable`: minimum mais cobertura estável de provedores/backends para aprovação de release
- `full`: stable mais cobertura ampla de provedores/mídia consultiva

`OpenClaw Release Checks` usa a ref confiável do workflow para resolver a ref de
destino uma vez como `release-package-under-test` e reutiliza esse artefato nas
verificações Docker de caminho de release e no Package Acceptance. Isso mantém
todas as caixas voltadas a pacote nos mesmos bytes e evita builds repetidos de
pacote.
O smoke de instalação OpenAI entre sistemas operacionais usa
`OPENCLAW_CROSS_OS_OPENAI_MODEL` quando a variável do repo/org está definida;
caso contrário, usa `openai/gpt-5.4`, porque esta lane comprova instalação do
pacote, onboarding, inicialização do Gateway e uma rodada live de agente, em vez
de medir o modelo padrão mais lento. A matriz live mais ampla de provedores
continua sendo o lugar para cobertura específica de modelo.

Use estas variantes conforme o estágio de release:

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

Não use o guarda-chuva completo como a primeira reexecução depois de uma
correção focada. Se uma caixa falhar, use o workflow filho, job, lane Docker,
perfil de pacote, provedor de modelo ou lane de QA que falhou para a próxima
prova. Execute o guarda-chuva completo novamente apenas quando a correção alterar
a orquestração compartilhada de release ou tornar obsoleta a evidência anterior
de todas as caixas. O verificador final do guarda-chuva revalida os ids
registrados de execução dos workflows filhos, então, depois que um workflow filho
for reexecutado com sucesso, reexecute apenas o job pai `Verify full validation`
que falhou.

Para recuperação delimitada, passe `rerun_group` ao guarda-chuva. `all` é a
execução real de candidato a release, `ci` executa apenas o filho de CI normal,
`plugin-prerelease` executa apenas o filho de Plugin exclusivo de release,
`release-checks` executa todas as caixas de release, e os grupos de release mais
estreitos são `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`,
`qa-parity`, `qa-live` e `npm-telegram`. Reexecuções focadas de `npm-telegram`
exigem `npm_telegram_package_spec`; execuções full/all com
`release_profile=full` usam o artefato de pacote de release-checks.

### Vitest

A caixa Vitest é o workflow filho manual `CI`. A CI manual ignora
intencionalmente o escopo por mudanças e força o grafo normal de testes para o
candidato a release: shards Linux Node, shards de Plugins empacotados, contratos
de canal, compatibilidade com Node 22, `check`, `check-additional`, smoke de
build, verificações de docs, Skills Python, Windows, macOS, Android e i18n da
Control UI.

Use esta caixa para responder "a árvore de código-fonte passou pela suíte normal
completa de testes?" Ela não é o mesmo que validação de produto do caminho de
release. Evidência a manter:

- resumo de `Full Release Validation` mostrando a URL da execução `CI` disparada
- execução `CI` verde no SHA de destino exato
- nomes de shards lentos ou com falha dos jobs de CI ao investigar regressões
- artefatos de temporização do Vitest, como `.artifacts/vitest-shard-timings.json`, quando uma execução precisa de análise de desempenho

Execute CI manual diretamente apenas quando o release precisar de CI normal
determinística, mas não das caixas Docker, QA Lab, live, cross-OS ou de pacote:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

A caixa Docker vive em `OpenClaw Release Checks` por meio de
`openclaw-live-and-e2e-checks-reusable.yml`, além do workflow `install-smoke` em
modo de release. Ela valida o candidato a release por meio de ambientes Docker
empacotados, em vez de apenas testes no nível do código-fonte.

A cobertura Docker de release inclui:

- smoke completo de instalação com o smoke lento de instalação global Bun habilitado
- preparação/reutilização da imagem de smoke do Dockerfile raiz por SHA de destino, com jobs de QR, root/gateway e installer/Bun smoke executando como shards separados de install-smoke
- lanes E2E do repositório
- chunks Docker do caminho de release: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` e `plugins-runtime-install-h`
- cobertura do OpenWebUI dentro do chunk `plugins-runtime-services` quando solicitado
- lanes divididas de instalação/desinstalação de Plugins empacotados
  `bundled-plugin-install-uninstall-0` até
  `bundled-plugin-install-uninstall-23`
- suítes live/E2E de provedores e cobertura Docker live de modelos quando as verificações de release incluem suítes live

Use artefatos Docker antes de reexecutar. O agendador do caminho de release
envia `.artifacts/docker-tests/` com logs de lane, `summary.json`,
`failures.json`, tempos de fase, JSON do plano do agendador e comandos de
reexecução. Para recuperação focada, use `docker_lanes=<lane[,lane]>` no
workflow reutilizável live/E2E em vez de reexecutar todos os chunks de release.
Os comandos de reexecução gerados incluem `package_artifact_run_id` anterior e
entradas de imagem Docker preparada quando disponíveis, para que uma lane com
falha possa reutilizar o mesmo tarball e imagens GHCR.

### QA Lab

A caixa QA Lab também faz parte de `OpenClaw Release Checks`. Ela é o gate de
release para comportamento agêntico e em nível de canal, separado da mecânica de
pacotes do Vitest e Docker.

A cobertura QA Lab de release inclui:

- lane de paridade mock comparando a lane candidata OpenAI com a baseline Opus 4.6 usando o pacote de paridade agêntica
- perfil rápido de QA Matrix live usando o ambiente `qa-live-shared`
- lane de QA Telegram live usando leases de credenciais CI do Convex
- `pnpm qa:otel:smoke` quando a telemetria de release precisa de prova local explícita

Use esta caixa para responder "o release se comporta corretamente em cenários de
QA e fluxos de canal live?" Mantenha as URLs de artefatos para as lanes de
paridade, Matrix e Telegram ao aprovar o release. A cobertura completa Matrix
continua disponível como uma execução manual shardada do QA-Lab, em vez da lane
padrão crítica para release.

### Pacote

A caixa de pacote é o gate do produto instalável. Ela é apoiada pelo
`Package Acceptance` e pelo resolvedor
`scripts/resolve-openclaw-package-candidate.mjs`. O resolvedor normaliza um
candidato no tarball `package-under-test` consumido pelo Docker E2E, valida o
inventário do pacote, registra a versão do pacote e o SHA-256, e mantém a ref do
harness de workflow separada da ref de origem do pacote.

Fontes de candidato compatíveis:

- `source=npm`: `openclaw@beta`, `openclaw@latest` ou uma versão exata de release do OpenClaw
- `source=ref`: empacota uma branch, tag ou SHA completo de commit de `package_ref` confiável com o harness `workflow_ref` selecionado
- `source=url`: baixa um `.tgz` HTTPS com `package_sha256` obrigatório
- `source=artifact`: reutiliza um `.tgz` enviado por outra execução do GitHub Actions

`OpenClaw Release Checks` executa Package Acceptance com `source=artifact`, o
artefato de pacote de release preparado, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues` e
`telegram_mode=mock-openai`. Package Acceptance mantém migração, atualização,
limpeza de dependências obsoletas de Plugin, fixtures offline de Plugin,
atualização de Plugin e QA do pacote Telegram contra o mesmo tarball resolvido.
A matriz de upgrade cobre todas as baselines estáveis publicadas no npm de
`2026.4.23` até `latest`; use Package Acceptance com `source=npm` para um
candidato já entregue, ou `source=ref`/`source=artifact` para um tarball npm
local respaldado por SHA antes da publicação. Ele é o substituto nativo do GitHub
para a maior parte da cobertura de pacote/atualização que antes exigia
Parallels. As verificações de release cross-OS ainda importam para onboarding,
instalador e comportamento específicos do sistema operacional, mas a validação
de produto de pacote/atualização deve preferir Package Acceptance.

A checklist canônica para validação de atualização e Plugin é
[Testando atualizações e Plugins](/pt-BR/help/testing-updates-plugins). Use-a ao
decidir qual lane local, Docker, Package Acceptance ou release-check comprova uma
mudança de instalação/atualização de Plugin, limpeza do doctor ou migração de
pacote publicado. A migração exaustiva de atualização publicada a partir de cada
pacote estável `2026.4.23+` é um workflow manual separado `Update Migration`,
não parte da Full Release CI.

A tolerância legada de package-acceptance é intencionalmente limitada no tempo.
Pacotes até `2026.4.25` podem usar o caminho de compatibilidade para lacunas de
metadados já publicadas no npm: entradas privadas de inventário de QA ausentes
do tarball, `gateway install --wrapper` ausente, arquivos de patch ausentes no
fixture git derivado do tarball, `update.channel` persistido ausente, locais
legados de registros de instalação de Plugin, persistência ausente de registros
de instalação do marketplace e migração de metadados de configuração durante
`plugins update`. O pacote publicado `2026.4.26` pode alertar para arquivos de
stamp de metadados de build local que já foram entregues. Pacotes posteriores
devem atender aos contratos modernos de pacote; essas mesmas lacunas falham na
validação de release.

Use perfis mais amplos de Package Acceptance quando a pergunta de release for
sobre um pacote realmente instalável:

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

- `smoke`: lanes rápidas de instalação/canal/agente do pacote, rede do Gateway e recarregamento de configuração
- `package`: contratos de pacote de instalação/atualização/Plugin sem ClawHub live; este é o padrão de release-check
- `product`: `package` mais canais MCP, limpeza de cron/subagente, pesquisa web OpenAI e OpenWebUI
- `full`: chunks Docker do caminho de release com OpenWebUI
- `custom`: lista exata de `docker_lanes` para reexecuções focadas

Para prova de Telegram de candidato a pacote, habilite `telegram_mode=mock-openai` ou
`telegram_mode=live-frontier` em Package Acceptance. O fluxo de trabalho passa o
tarball `package-under-test` resolvido para a trilha do Telegram; o fluxo de trabalho
independente do Telegram ainda aceita uma especificação npm publicada para verificações pós-publicação.

## Automação de publicação de release

`OpenClaw Release Publish` é o ponto de entrada normal de publicação com mutação. Ele
orquestra os fluxos de trabalho de publicação confiável na ordem exigida pelo release:

1. Fazer checkout da tag do release e resolver seu SHA de commit.
2. Verificar se a tag é alcançável a partir de `main` ou `release/*`.
3. Executar `pnpm plugins:sync:check`.
4. Despachar `Plugin NPM Release` com `publish_scope=all-publishable` e
   `ref=<release-sha>`.
5. Despachar `Plugin ClawHub Release` com o mesmo escopo e SHA.
6. Despachar `OpenClaw NPM Release` com a tag do release, a dist-tag npm e o
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

Promoção estável diretamente para `latest` é explícita:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Use os fluxos de trabalho de nível mais baixo `Plugin NPM Release` e `Plugin ClawHub Release`
somente para trabalho focado de reparo ou republicação. Para um reparo de Plugin selecionado, passe
`plugin_publish_scope=selected` e `plugins=@openclaw/name` para
`OpenClaw Release Publish`, ou despache o fluxo de trabalho filho diretamente quando o
pacote OpenClaw não deve ser publicado.

## Entradas do fluxo de trabalho NPM

`OpenClaw NPM Release` aceita estas entradas controladas por operador:

- `tag`: tag de release obrigatória, como `v2026.4.2`, `v2026.4.2-1` ou
  `v2026.4.2-beta.1`; quando `preflight_only=true`, também pode ser o SHA de commit
  completo de 40 caracteres atual do branch do fluxo de trabalho para preflight somente de validação
- `preflight_only`: `true` apenas para validação/build/pacote, `false` para o
  caminho de publicação real
- `preflight_run_id`: obrigatório no caminho de publicação real para que o fluxo de trabalho reutilize
  o tarball preparado da execução de preflight bem-sucedida
- `npm_dist_tag`: tag de destino npm para o caminho de publicação; o padrão é `beta`

`OpenClaw Release Publish` aceita estas entradas controladas por operador:

- `tag`: tag de release obrigatória; já deve existir
- `preflight_run_id`: id de execução de preflight bem-sucedida de `OpenClaw NPM Release`;
  obrigatório quando `publish_openclaw_npm=true`
- `npm_dist_tag`: tag de destino npm para o pacote OpenClaw
- `plugin_publish_scope`: o padrão é `all-publishable`; use `selected` somente
  para trabalho focado de reparo
- `plugins`: nomes de pacote `@openclaw/*` separados por vírgulas quando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: o padrão é `true`; defina como `false` somente ao usar o
  fluxo de trabalho como orquestrador de reparo apenas de Plugin

`OpenClaw Release Checks` aceita estas entradas controladas por operador:

- `ref`: branch, tag ou SHA de commit completo a validar. Verificações que usam segredos
  exigem que o commit resolvido seja alcançável a partir de um branch do OpenClaw ou
  tag de release.

Regras:

- Tags estáveis e de correção podem publicar em `beta` ou `latest`
- Tags de pré-release beta podem publicar somente em `beta`
- Para `OpenClaw NPM Release`, entrada de SHA de commit completo é permitida somente quando
  `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` são sempre
  somente validação
- O caminho de publicação real deve usar o mesmo `npm_dist_tag` usado durante o preflight;
  o fluxo de trabalho verifica esses metadados antes de a publicação continuar

## Sequência de release npm estável

Ao preparar um release npm estável:

1. Execute `OpenClaw NPM Release` com `preflight_only=true`
   - Antes de existir uma tag, você pode usar o SHA de commit completo atual do branch
     do fluxo de trabalho para uma simulação somente de validação do fluxo de trabalho de preflight
2. Escolha `npm_dist_tag=beta` para o fluxo normal beta-primeiro, ou `latest` somente
   quando você quiser intencionalmente uma publicação estável direta
3. Execute `Full Release Validation` no branch de release, na tag de release ou no SHA
   de commit completo quando quiser CI normal, além de cache de prompt ao vivo, Docker, QA Lab,
   Matrix e cobertura do Telegram a partir de um fluxo de trabalho manual
4. Se você intencionalmente só precisar do grafo de testes normal determinístico, execute o
   fluxo de trabalho manual `CI` na ref do release
5. Salve o `preflight_run_id` bem-sucedido
6. Execute `OpenClaw Release Publish` com a mesma `tag`, o mesmo `npm_dist_tag`
   e o `preflight_run_id` salvo; ele publica Plugins externalizados no npm
   e no ClawHub antes de promover o pacote npm do OpenClaw
7. Se o release caiu em `beta`, use o fluxo de trabalho privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover essa versão estável de `beta` para `latest`
8. Se o release foi publicado intencionalmente diretamente em `latest` e `beta`
   deve seguir a mesma build estável imediatamente, use esse mesmo fluxo de trabalho privado
   para apontar ambas as dist-tags para a versão estável, ou deixe a sincronização agendada
   de autocorreção mover `beta` depois

A mutação de dist-tag fica no repositório privado por segurança, porque ainda
exige `NPM_TOKEN`, enquanto o repositório público mantém publicação somente por OIDC.

Isso mantém tanto o caminho de publicação direta quanto o caminho de promoção beta-primeiro
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
