---
read_when:
    - Procurando definições de canais de lançamento públicos
    - Executando validação de lançamento ou aceitação de pacote
    - Procurando nomenclatura e cadência de versões
summary: Faixas de lançamento, lista de verificação do operador, caixas de validação, nomenclatura de versões e cadência
title: Política de lançamento
x-i18n:
    generated_at: "2026-05-02T21:03:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 493cb8b42f0e15f3bf5f8fb9be7d01fd626f4f16db9ac0a85e6efa747ef12d12
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw tem quatro canais públicos de lançamento:

- estável: lançamentos marcados com tag que publicam no npm `beta` por padrão, ou no npm `latest` quando solicitado explicitamente
- alfa: tags de pré-lançamento que publicam no npm `alpha`
- beta: tags de pré-lançamento que publicam no npm `beta`
- desenvolvimento: a ponta móvel de `main`

## Nomenclatura de versões

- Versão de lançamento estável: `YYYY.M.D`
  - Tag do Git: `vYYYY.M.D`
- Versão de lançamento de correção estável: `YYYY.M.D-N`
  - Tag do Git: `vYYYY.M.D-N`
- Versão de pré-lançamento alfa: `YYYY.M.D-alpha.N`
  - Tag do Git: `vYYYY.M.D-alpha.N`
- Versão de pré-lançamento beta: `YYYY.M.D-beta.N`
  - Tag do Git: `vYYYY.M.D-beta.N`
- Não preencha mês ou dia com zero à esquerda
- `latest` significa o lançamento estável atual promovido no npm
- `alpha` significa o alvo atual de instalação alfa
- `beta` significa o alvo atual de instalação beta
- Lançamentos estáveis e lançamentos de correção estáveis publicam no npm `beta` por padrão; operadores de lançamento podem mirar `latest` explicitamente, ou promover uma compilação beta verificada depois
- Todo lançamento estável do OpenClaw envia o pacote npm e o aplicativo macOS juntos;
  lançamentos beta normalmente validam e publicam primeiro o caminho npm/pacote, com
  compilação/assinatura/notarização do aplicativo mac reservadas para estáveis, a menos que solicitado explicitamente

## Cadência de lançamentos

- Lançamentos seguem primeiro para beta
- O estável vem somente depois que o beta mais recente é validado
- Mantenedores normalmente criam lançamentos a partir de uma ramificação `release/YYYY.M.D` criada
  a partir do `main` atual, para que validação e correções de lançamento não bloqueiem novo
  desenvolvimento no `main`
- Se uma tag beta tiver sido enviada ou publicada e precisar de uma correção, os mantenedores criam
  a próxima tag `-beta.N` em vez de excluir ou recriar a tag beta antiga
- Procedimento detalhado de lançamento, aprovações, credenciais e notas de recuperação são
  somente para mantenedores

## Lista de verificação do operador de lançamento

Esta lista de verificação é o formato público do fluxo de lançamento. Credenciais privadas,
assinatura, notarização, recuperação de dist-tag e detalhes de reversão emergencial ficam no
manual de execução de lançamento exclusivo para mantenedores.

1. Comece do `main` atual: puxe o mais recente, confirme que o commit alvo foi enviado,
   e confirme que a CI atual do `main` está verde o suficiente para criar uma ramificação a partir dele.
2. Reescreva a seção superior de `CHANGELOG.md` a partir do histórico real de commits com
   `/changelog`, mantenha as entradas voltadas ao usuário, faça commit, envie, e faça rebase/pull
   mais uma vez antes de criar a ramificação.
3. Revise os registros de compatibilidade de lançamento em
   `src/plugins/compat/registry.ts` e
   `src/commands/doctor/shared/deprecation-compat.ts`. Remova compatibilidade expirada
   somente quando o caminho de atualização continuar coberto, ou registre por que ela está
   sendo mantida intencionalmente.
4. Crie `release/YYYY.M.D` a partir do `main` atual; não faça trabalho normal de lançamento
   diretamente no `main`.
5. Atualize todos os locais de versão exigidos para a tag pretendida, execute
   `pnpm plugins:sync` para que pacotes de plugin publicáveis compartilhem a versão de lançamento
   e os metadados de compatibilidade, depois execute a pré-verificação determinística local:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` e
   `pnpm release:check`.
6. Execute `OpenClaw NPM Release` com `preflight_only=true`. Antes de uma tag existir,
   um SHA completo de 40 caracteres da ramificação de lançamento é permitido para pré-verificação
   somente de validação. Salve o `preflight_run_id` bem-sucedido.
7. Inicie todos os testes de pré-lançamento com `Full Release Validation` para a
   ramificação de lançamento, tag ou SHA completo de commit. Este é o único ponto de entrada manual
   para as quatro grandes caixas de teste de lançamento: Vitest, Docker, QA Lab e Package.
8. Se a validação falhar, corrija na ramificação de lançamento e execute novamente o menor
   arquivo, canal, tarefa de fluxo de trabalho, perfil de pacote, provedor ou lista de modelos permitidos com falha que
   prove a correção. Execute novamente o guarda-chuva completo somente quando a superfície alterada tornar
   evidências anteriores obsoletas.
9. Para alfa ou beta, marque `vYYYY.M.D-alpha.N` ou `vYYYY.M.D-beta.N`, depois execute `OpenClaw Release Publish` a partir
   da ramificação `release/YYYY.M.D` correspondente. Ele verifica `pnpm plugins:sync:check`,
   publica primeiro todos os pacotes de plugin publicáveis no npm, publica o mesmo
   conjunto no ClawHub em segundo lugar, e então promove o artefato de pré-verificação npm preparado do OpenClaw
   com a dist-tag correspondente. Após a publicação, execute a aceitação de pacote pós-publicação
   contra o pacote publicado `openclaw@YYYY.M.D-alpha.N`, `openclaw@alpha`,
   `openclaw@YYYY.M.D-beta.N` ou `openclaw@beta`. Se um pré-lançamento enviado ou
   publicado precisar de correção, crie o próximo número de pré-lançamento correspondente;
   não exclua nem reescreva o pré-lançamento antigo.
10. Para estável, continue somente depois que o beta verificado ou candidato a lançamento tiver as
    evidências de validação exigidas. A publicação npm estável também passa por
    `OpenClaw Release Publish`, reutilizando o artefato de pré-verificação bem-sucedido via
    `preflight_run_id`; a prontidão do lançamento macOS estável também requer os
    `.zip`, `.dmg`, `.dSYM.zip` empacotados e o `appcast.xml` atualizado no `main`.
11. Após a publicação, execute o verificador npm pós-publicação, o E2E opcional do Telegram
    publicado via npm independente quando precisar de prova de canal pós-publicação,
    promoção de dist-tag quando necessário, notas de lançamento/pré-lançamento do GitHub a partir da
    seção completa correspondente de `CHANGELOG.md`, e as etapas de anúncio de lançamento.

## Pré-verificação de lançamento

- Execute `pnpm check:test-types` antes da pré-validação de lançamento para que o TypeScript dos testes permaneça coberto fora da barreira local mais rápida `pnpm check`
- Execute `pnpm check:architecture` antes da pré-validação de lançamento para que as verificações mais amplas de ciclos de importação e limites de arquitetura fiquem verdes fora da barreira local mais rápida
- Execute `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que os artefatos de lançamento esperados em `dist/*` e o pacote da Control UI existam para a etapa de validação do pacote
- Execute `pnpm plugins:sync` depois do incremento de versão na raiz e antes da criação da tag. Ele atualiza as versões de pacotes de Plugin publicáveis, os metadados de compatibilidade de peer/API do OpenClaw, os metadados de build e os stubs de changelog de plugins para corresponder à versão de lançamento do núcleo. `pnpm plugins:sync:check` é a proteção de lançamento não mutável; o fluxo de publicação falha antes de qualquer mutação no registro se essa etapa tiver sido esquecida.
- Execute o workflow manual `Full Release Validation` antes da aprovação do lançamento para iniciar todas as caixas de teste de pré-lançamento a partir de um único ponto de entrada. Ele aceita uma branch, tag ou SHA completo de commit, dispara o `CI` manual e dispara `OpenClaw Release Checks` para smoke de instalação, aceitação de pacote, suítes de caminho de lançamento do Docker, live/E2E, OpenWebUI, paridade do QA Lab, Matrix e trilhas do Telegram. Com `release_profile=full` e `rerun_group=all`, ele também executa E2E de pacote do Telegram contra o artefato `release-package-under-test` das verificações de lançamento. Forneça `npm_telegram_package_spec` depois da publicação quando o mesmo E2E do Telegram também precisar comprovar o pacote npm publicado. Forneça `package_acceptance_package_spec` depois da publicação quando Package Acceptance precisar executar sua matriz de pacote/atualização contra o pacote npm enviado em vez do artefato construído a partir do SHA. Forneça `evidence_package_spec` quando o relatório de evidência privado precisar comprovar que a validação corresponde a um pacote npm publicado sem forçar o E2E do Telegram. Exemplo: `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Execute o workflow manual `Package Acceptance` quando quiser uma comprovação por canal lateral para um candidato a pacote enquanto o trabalho de lançamento continua. Use `source=npm` para `openclaw@alpha`, `openclaw@beta`, `openclaw@latest` ou uma versão exata de lançamento; `source=ref` para empacotar uma branch/tag/SHA confiável de `package_ref` com o harness atual de `workflow_ref`; `source=url` para um tarball HTTPS com SHA-256 obrigatório; ou `source=artifact` para um tarball enviado por outra execução do GitHub Actions. O workflow resolve o candidato para `package-under-test`, reutiliza o agendador de lançamento Docker E2E contra esse tarball e pode executar QA do Telegram contra o mesmo tarball com `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`. Quando as trilhas Docker selecionadas incluem `published-upgrade-survivor`, o artefato do pacote é o candidato e `published_upgrade_survivor_baseline` seleciona a linha de base publicada.
  Exemplo: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Perfis comuns:
  - `smoke`: trilhas de instalação/canal/agente, rede do Gateway e recarregamento de configuração
  - `package`: trilhas nativas de artefato para pacote/atualização/Plugin sem OpenWebUI nem ClawHub live
  - `product`: perfil de pacote mais canais MCP, limpeza de cron/subagente, busca na web da OpenAI e OpenWebUI
  - `full`: partes do caminho de lançamento do Docker com OpenWebUI
  - `custom`: seleção exata de `docker_lanes` para uma reexecução focada
- Execute o workflow manual `CI` diretamente quando você precisar apenas da cobertura completa normal de CI para o candidato a lançamento. Disparos manuais de CI ignoram o escopo de alterações e forçam os shards Linux Node, shards de plugins incluídos, contratos de canal, compatibilidade com Node 22, `check`, `check-additional`, smoke de build, verificações de docs, Skills Python, Windows, macOS, Android e trilhas de i18n da Control UI.
  Exemplo: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Execute `pnpm qa:otel:smoke` ao validar a telemetria de lançamento. Ele exercita o QA-lab por meio de um receptor local OTLP/HTTP e verifica os nomes dos spans de trace exportados, atributos limitados e redação de conteúdo/identificadores sem exigir Opik, Langfuse ou outro coletor externo.
- Execute `pnpm release:check` antes de cada lançamento com tag
- Execute `OpenClaw Release Publish` para a sequência de publicação mutável depois que a tag existir. Dispare-o a partir de `release/YYYY.M.D` (ou `main` ao publicar uma tag alcançável a partir de main), passe a tag de lançamento e o `preflight_run_id` bem-sucedido do npm do OpenClaw, e mantenha o escopo padrão de publicação de Plugin `all-publishable`, a menos que você esteja executando deliberadamente um reparo focado. O workflow serializa a publicação npm de Plugin, a publicação ClawHub de Plugin e a publicação npm do OpenClaw para que o pacote central não seja publicado antes de seus plugins externalizados.
- As verificações de lançamento agora são executadas em um workflow manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` também executa a trilha de paridade mock do QA Lab mais o perfil rápido live do Matrix e a trilha de QA do Telegram antes da aprovação do lançamento. As trilhas live usam o ambiente `qa-live-shared`; o Telegram também usa concessões de credenciais do Convex CI. Execute o workflow manual `QA-Lab - All Lanes` com `matrix_profile=all` e `matrix_shards=true` quando quiser inventário completo de transporte Matrix, mídia e E2EE em paralelo.
- A validação de runtime de instalação e atualização entre sistemas operacionais faz parte dos workflows públicos `OpenClaw Release Checks` e `Full Release Validation`, que chamam diretamente o workflow reutilizável `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Essa divisão é intencional: manter o caminho real de lançamento npm curto, determinístico e focado em artefatos, enquanto verificações live mais lentas ficam em sua própria trilha para não travar nem bloquear a publicação
- Verificações de lançamento que carregam segredos devem ser disparadas por meio de `Full Release Validation` ou a partir da ref de workflow `main`/release para que a lógica do workflow e os segredos permaneçam controlados
- `OpenClaw Release Checks` aceita uma branch, tag ou SHA completo de commit desde que o commit resolvido seja alcançável a partir de uma branch do OpenClaw ou tag de lançamento
- A pré-validação apenas de validação de `OpenClaw NPM Release` também aceita o SHA completo atual de 40 caracteres do commit da branch do workflow sem exigir uma tag enviada
- Esse caminho por SHA é apenas de validação e não pode ser promovido para uma publicação real
- No modo SHA, o workflow sintetiza `v<package.json version>` apenas para a verificação de metadados do pacote; a publicação real ainda exige uma tag real de lançamento
- Ambos os workflows mantêm o caminho real de publicação e promoção em runners hospedados pelo GitHub, enquanto o caminho de validação não mutável pode usar os runners Linux maiores do Blacksmith
- Esse workflow executa
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando os segredos de workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- A pré-validação de lançamento npm não espera mais pela trilha separada de verificações de lançamento
- Execute `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts` (ou a tag beta/correção correspondente) antes da aprovação
- Depois da publicação npm, execute
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou a versão beta/correção correspondente) para verificar o caminho de instalação do registro publicado em um prefixo temporário novo
- Depois de uma publicação beta, execute `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  para verificar onboarding do pacote instalado, configuração do Telegram e E2E real do Telegram contra o pacote npm publicado usando o pool compartilhado de credenciais concedidas do Telegram. Execuções avulsas locais de mantenedores podem omitir as variáveis do Convex e passar diretamente as três credenciais de ambiente `OPENCLAW_QA_TELEGRAM_*`.
- Mantenedores podem executar a mesma verificação pós-publicação a partir do GitHub Actions por meio do workflow manual `NPM Telegram Beta E2E`. Ele é intencionalmente apenas manual e não é executado a cada merge.
- A automação de lançamento de mantenedores agora usa pré-validação seguida de promoção:
  - a publicação npm real deve passar um `preflight_run_id` npm bem-sucedido
  - a publicação npm real deve ser disparada a partir da mesma branch `main` ou `release/YYYY.M.D` da execução de pré-validação bem-sucedida
  - lançamentos npm estáveis usam `beta` por padrão
  - a publicação npm estável pode mirar explicitamente em `latest` via entrada do workflow
  - a mutação de dist-tag npm baseada em token agora fica em `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` por segurança, porque `npm dist-tag add` ainda precisa de `NPM_TOKEN`, enquanto o repositório público mantém publicação apenas com OIDC
  - `macOS Release` público é apenas de validação; quando uma tag existe apenas em uma branch de lançamento, mas o workflow é disparado a partir de `main`, defina `public_release_branch=release/YYYY.M.D`
  - a publicação real privada para mac deve passar por `preflight_run_id` e `validate_run_id` privados de mac bem-sucedidos
  - os caminhos de publicação real promovem artefatos preparados em vez de reconstruí-los novamente
- Para lançamentos estáveis de correção como `YYYY.M.D-N`, o verificador pós-publicação também verifica o mesmo caminho de atualização em prefixo temporário de `YYYY.M.D` para `YYYY.M.D-N`, para que correções de lançamento não possam deixar silenciosamente instalações globais antigas no payload estável base
- A pré-validação de lançamento npm falha de modo fechado, a menos que o tarball inclua `dist/control-ui/index.html` e um payload não vazio em `dist/control-ui/assets/`, para que não enviemos novamente um painel de navegador vazio
- A verificação pós-publicação também verifica se os entrypoints de Plugin publicados e os metadados de pacote estão presentes no layout do registro instalado. Um lançamento que envia payloads de runtime de Plugin ausentes falha no verificador pós-publicação e não pode ser promovido para `latest`.
- `pnpm test:install:smoke` também impõe o orçamento de `unpackedSize` do npm pack no tarball de atualização candidato, para que o e2e do instalador capture crescimento acidental do pacote antes do caminho de publicação do lançamento
- Se o trabalho de lançamento tocou o planejamento de CI, manifestos de tempo de extensão ou matrizes de teste de extensão, regenere e revise as saídas da matriz `plugin-prerelease-extension-shard` pertencentes ao planejador a partir de `.github/workflows/plugin-prerelease.yml` antes da aprovação, para que as notas de lançamento não descrevam um layout de CI obsoleto
- A prontidão de lançamento estável do macOS também inclui as superfícies do atualizador:
  - o lançamento do GitHub deve acabar com os pacotes `.zip`, `.dmg` e `.dSYM.zip`
  - `appcast.xml` em `main` deve apontar para o novo zip estável depois da publicação
  - o app empacotado deve manter um bundle id sem debug, uma URL não vazia de feed Sparkle e um `CFBundleVersion` igual ou superior ao piso canônico de build do Sparkle para essa versão de lançamento

## Caixas de teste de lançamento

`Full Release Validation` é como operadores iniciam todos os testes de pré-lançamento a partir de um único ponto de entrada. Para uma comprovação de commit fixado em uma branch que se move rapidamente, use o helper para que cada workflow filho seja executado a partir de uma branch temporária fixada no SHA alvo:

```bash
pnpm ci:full-release --sha <full-sha>
```

O helper envia `release-ci/<sha>-...`, dispara `Full Release Validation` a partir dessa branch com `ref=<sha>`, verifica se o `headSha` de cada workflow filho corresponde ao alvo e então exclui a branch temporária. Isso evita comprovar acidentalmente uma execução filha mais nova de `main`.

Para validação de branch ou tag de lançamento, execute-a a partir da ref confiável de workflow `main` e passe a branch ou tag de lançamento como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

O fluxo de trabalho resolve a ref de destino, dispara manualmente `CI` com
`target_ref=<release-ref>`, dispara `OpenClaw Release Checks` e dispara o E2E
standalone do pacote do Telegram quando `release_profile=full` com
`rerun_group=all` ou quando `npm_telegram_package_spec` está definido. `OpenClaw Release
Checks` então expande para smoke de instalação, verificações de lançamento entre SOs,
cobertura live/E2E Docker do caminho de lançamento, Package Acceptance com QA
do pacote Telegram, paridade do QA Lab, Matrix live e Telegram live. Uma execução
completa só é aceitável quando o resumo de
`Full Release Validation`
mostra `normal_ci` e `release_checks` como bem-sucedidos. No modo full/all,
o filho `npm_telegram` também deve ser bem-sucedido; fora de full/all, ele é ignorado
a menos que um `npm_telegram_package_spec` publicado tenha sido fornecido. O resumo
final do verificador inclui tabelas dos jobs mais lentos de cada execução filha,
para que o gerente de lançamento possa ver o caminho crítico atual sem baixar logs.
Consulte [Validação completa de lançamento](/pt-BR/reference/full-release-validation) para a
matriz completa de estágios, nomes exatos dos jobs do workflow, diferenças entre
os perfis stable e full, artefatos e identificadores de reexecução focada.
Workflows filhos são disparados a partir da ref confiável que executa `Full Release
Validation`, normalmente `--ref main`, mesmo quando a `ref` de destino aponta para
uma branch ou tag de lançamento mais antiga. Não há uma entrada separada de ref
de workflow de Full Release Validation; escolha o harness confiável escolhendo a
ref de execução do workflow.
Não use `--ref main -f ref=<sha>` para prova de commit exato em `main` móvel;
SHAs de commit brutos não podem ser refs de disparo de workflow, então use
`pnpm ci:full-release --sha <sha>` para criar a branch temporária fixada.

Use `release_profile` para selecionar a abrangência live/provedor:

- `minimum`: caminho OpenAI/core live e Docker mais rápido e crítico para lançamento
- `stable`: minimum mais cobertura estável de provedor/backend para aprovação de lançamento
- `full`: stable mais ampla cobertura consultiva de provedor/mídia

`OpenClaw Release Checks` usa a ref confiável do workflow para resolver a ref
de destino uma vez como `release-package-under-test` e reutiliza esse artefato tanto
nas verificações Docker do caminho de lançamento quanto no Package Acceptance.
Isso mantém todos os ambientes voltados a pacote nos mesmos bytes e evita builds
repetidos de pacote.
O smoke de instalação OpenAI entre SOs usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando a
variável do repo/org está definida; caso contrário, usa `openai/gpt-5.4`, porque esta lane
prova instalação do pacote, onboarding, inicialização do Gateway e uma interação
live de agente, em vez de comparar o modelo padrão mais lento. A matriz live mais ampla
de provedores continua sendo o lugar para cobertura específica de modelo.

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

Não use o guarda-chuva completo como a primeira reexecução após uma correção focada. Se um ambiente
falhar, use o workflow filho, job, lane Docker, perfil de pacote, provedor
de modelo ou lane de QA com falha para a próxima prova. Execute o guarda-chuva completo novamente
somente quando a correção alterar a orquestração compartilhada de lançamento ou tornar obsoleta
a evidência anterior de todos os ambientes. O verificador final do guarda-chuva revalida os ids
registrados das execuções dos workflows filhos, então, depois que um workflow filho for reexecutado
com sucesso, reexecute apenas o job pai `Verify full validation` com falha.

Para recuperação delimitada, passe `rerun_group` para o guarda-chuva. `all` é a execução real
de release candidate, `ci` executa apenas o filho normal de CI, `plugin-prerelease`
executa apenas o filho de Plugin somente de lançamento, `release-checks` executa todos os ambientes
de lançamento, e os grupos de lançamento mais estreitos são `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` e `npm-telegram`.
Reexecuções focadas de `npm-telegram` exigem `npm_telegram_package_spec`; execuções full/all
com `release_profile=full` usam o artefato de pacote de release-checks.

### Vitest

O ambiente Vitest é o workflow filho manual `CI`. O CI manual ignora intencionalmente
o escopo por mudanças e força o grafo de testes normal para o release candidate:
shards Linux Node, shards de plugins agrupados, contratos de canal, compatibilidade com Node 22,
`check`, `check-additional`, smoke de build, verificações de docs, Skills em Python, Windows,
macOS, Android e i18n da Control UI.

Use este ambiente para responder "a árvore de código-fonte passou na suíte completa normal de testes?"
Isso não é o mesmo que validação de produto no caminho de lançamento. Evidências a manter:

- resumo de `Full Release Validation` mostrando a URL da execução `CI` disparada
- execução `CI` verde no SHA de destino exato
- nomes de shards com falha ou lentos dos jobs de CI ao investigar regressões
- artefatos de temporização do Vitest, como `.artifacts/vitest-shard-timings.json`, quando
  uma execução precisa de análise de desempenho

Execute o CI manual diretamente apenas quando o lançamento precisar de CI normal determinístico, mas
não dos ambientes Docker, QA Lab, live, entre SOs ou de pacote:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

O ambiente Docker fica em `OpenClaw Release Checks` por meio de
`openclaw-live-and-e2e-checks-reusable.yml`, além do workflow `install-smoke`
em modo de lançamento. Ele valida o release candidate por meio de ambientes Docker
empacotados, em vez de apenas testes em nível de código-fonte.

A cobertura Docker de lançamento inclui:

- smoke completo de instalação com o smoke lento de instalação global Bun habilitado
- preparação/reutilização de imagem de smoke do Dockerfile raiz por SHA de destino, com QR,
  root/gateway e jobs de smoke do instalador/Bun executando como shards separados de install-smoke
- lanes E2E do repositório
- chunks Docker do caminho de lançamento: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` e `plugins-runtime-install-h`
- cobertura OpenWebUI dentro do chunk `plugins-runtime-services` quando solicitada
- lanes divididas de instalação/desinstalação de Plugin agrupado
  `bundled-plugin-install-uninstall-0` até
  `bundled-plugin-install-uninstall-23`
- suítes live/E2E de provedor e cobertura Docker live de modelo quando as verificações de lançamento
  incluem suítes live

Use artefatos Docker antes de reexecutar. O agendador do caminho de lançamento envia
`.artifacts/docker-tests/` com logs de lane, `summary.json`, `failures.json`,
tempos de fase, JSON do plano do agendador e comandos de reexecução. Para recuperação focada,
use `docker_lanes=<lane[,lane]>` no workflow reutilizável live/E2E em vez de
reexecutar todos os chunks de lançamento. Comandos de reexecução gerados incluem
`package_artifact_run_id` anterior e entradas de imagem Docker preparada quando disponíveis, para que uma
lane com falha possa reutilizar o mesmo tarball e imagens GHCR.

### QA Lab

O ambiente QA Lab também faz parte de `OpenClaw Release Checks`. Ele é o gate de lançamento
de comportamento agêntico e em nível de canal, separado do Vitest e da mecânica de pacote
Docker.

A cobertura QA Lab de lançamento inclui:

- lane de paridade mock comparando a lane candidata OpenAI contra a linha de base Opus 4.6
  usando o pacote de paridade agêntica
- perfil rápido de QA live do Matrix usando o ambiente `qa-live-shared`
- lane de QA live do Telegram usando leases de credenciais de CI do Convex
- `pnpm qa:otel:smoke` quando a telemetria de lançamento precisa de prova local explícita

Use este ambiente para responder "o lançamento se comporta corretamente nos cenários de QA e
fluxos de canais live?" Mantenha as URLs dos artefatos das lanes de paridade, Matrix e Telegram
ao aprovar o lançamento. A cobertura completa de Matrix continua disponível como uma
execução manual fragmentada do QA-Lab, em vez da lane crítica de lançamento padrão.

### Pacote

O ambiente Package é o gate de produto instalável. Ele é apoiado por
`Package Acceptance` e pelo resolvedor
`scripts/resolve-openclaw-package-candidate.mjs`. O resolvedor normaliza um
candidato no tarball `package-under-test` consumido pelo Docker E2E, valida
o inventário do pacote, registra a versão do pacote e SHA-256, e mantém a
ref do harness do workflow separada da ref de origem do pacote.

Fontes de candidato compatíveis:

- `source=npm`: `openclaw@beta`, `openclaw@latest` ou uma versão exata de lançamento do OpenClaw
- `source=ref`: empacota uma branch, tag ou SHA de commit completo `package_ref` confiável
  com o harness `workflow_ref` selecionado
- `source=url`: baixa um `.tgz` HTTPS com `package_sha256` obrigatório
- `source=artifact`: reutiliza um `.tgz` enviado por outra execução do GitHub Actions

`OpenClaw Release Checks` executa Package Acceptance com `source=artifact`, o
artefato de pacote de lançamento preparado, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues` e
`telegram_mode=mock-openai`. Package Acceptance mantém migração, atualização, limpeza
de dependências obsoletas de Plugin, fixtures offline de Plugin, atualização de Plugin e QA
de pacote Telegram contra o mesmo tarball resolvido. A matriz de upgrade cobre todas as linhas de base estáveis publicadas no npm de `2026.4.23` até `latest`; use
Package Acceptance com `source=npm` para um candidato já enviado, ou
`source=ref`/`source=artifact` para um tarball npm local respaldado por SHA antes da
publicação. Ele é o substituto nativo do GitHub para a maior parte da
cobertura de pacote/atualização que antes exigia Parallels. Verificações de lançamento entre SOs
ainda importam para onboarding, instalador e comportamento de plataforma específicos de SO, mas a
validação de produto de pacote/atualização deve preferir Package Acceptance.

A checklist canônica para validação de atualização e Plugin é
[Testando atualizações e plugins](/pt-BR/help/testing-updates-plugins). Use-a ao
decidir qual lane local, Docker, Package Acceptance ou release-check prova uma
instalação/atualização de Plugin, limpeza do doctor ou mudança de migração de pacote publicado.
A migração exaustiva de atualização publicada de todos os pacotes estáveis `2026.4.23+` é
um workflow manual separado `Update Migration`, não parte do Full Release CI.

A leniência legada de package-acceptance é intencionalmente limitada no tempo. Pacotes até
`2026.4.25` podem usar o caminho de compatibilidade para lacunas de metadados já publicadas
no npm: entradas de inventário privado de QA ausentes do tarball, ausência de
`gateway install --wrapper`, arquivos de patch ausentes na fixture git derivada do tarball,
`update.channel` persistido ausente, locais legados de registros de instalação de Plugin,
persistência ausente de registros de instalação do marketplace e migração de metadados de configuração
durante `plugins update`. O pacote publicado `2026.4.26` pode avisar
sobre arquivos de carimbo de metadados de build local que já foram enviados. Pacotes posteriores
devem satisfazer os contratos modernos de pacote; essas mesmas lacunas falham na validação
de lançamento.

Use perfis mais amplos de Package Acceptance quando a pergunta de lançamento for sobre um
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

- `smoke`: lanes rápidas de instalação de pacote/canal/agente, rede do Gateway e recarregamento
  de configuração
- `package`: contratos de pacote de instalação/atualização/Plugin sem ClawHub live; este é o padrão
  de release-check
- `product`: `package` mais canais MCP, limpeza de cron/subagente, pesquisa web OpenAI
  e OpenWebUI
- `full`: chunks Docker do caminho de lançamento com OpenWebUI
- `custom`: lista exata de `docker_lanes` para reexecuções focadas

Para prova de candidato a pacote do Telegram, habilite `telegram_mode=mock-openai` ou
`telegram_mode=live-frontier` em Package Acceptance. O workflow passa o tarball
resolvido de `package-under-test` para a lane do Telegram; o workflow autônomo do
Telegram ainda aceita uma especificação npm publicada para verificações pós-publicação.

## Automação de publicação de release

`OpenClaw Release Publish` é o ponto de entrada mutável normal de publicação. Ele
orquestra os workflows de publicador confiável na ordem que a release exige:

1. Fazer checkout da tag da release e resolver seu SHA de commit.
2. Verificar se a tag é alcançável a partir de `main` ou `release/*`.
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

Exemplo de publicação alfa:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-alpha.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=alpha
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
apenas para trabalho focado de reparo ou republicação. Para um reparo de plugin
selecionado, passe `plugin_publish_scope=selected` e `plugins=@openclaw/name` para
`OpenClaw Release Publish`, ou dispare o workflow filho diretamente quando o
pacote OpenClaw não deve ser publicado.

## Entradas do workflow NPM

`OpenClaw NPM Release` aceita estas entradas controladas pelo operador:

- `tag`: tag de release obrigatória, como `v2026.4.2`, `v2026.4.2-1` ou
  `v2026.4.2-alpha.1` ou `v2026.4.2-beta.1`; quando `preflight_only=true`, ela também pode ser o SHA de commit completo atual de 40 caracteres da branch de workflow para preflight somente de validação
- `preflight_only`: `true` apenas para validação/build/pacote, `false` para o
  caminho real de publicação
- `preflight_run_id`: obrigatório no caminho real de publicação para que o workflow reutilize
  o tarball preparado da execução de preflight bem-sucedida
- `npm_dist_tag`: tag npm de destino para o caminho de publicação; o padrão é `beta`

`OpenClaw Release Publish` aceita estas entradas controladas pelo operador:

- `tag`: tag de release obrigatória; já deve existir
- `preflight_run_id`: id de execução de preflight bem-sucedida de `OpenClaw NPM Release`;
  obrigatório quando `publish_openclaw_npm=true`
- `npm_dist_tag`: tag npm de destino para o pacote OpenClaw
- `plugin_publish_scope`: o padrão é `all-publishable`; use `selected` apenas
  para trabalho focado de reparo
- `plugins`: nomes de pacotes `@openclaw/*` separados por vírgula quando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: o padrão é `true`; defina `false` apenas ao usar o
  workflow como orquestrador de reparo somente de plugin

`OpenClaw Release Checks` aceita estas entradas controladas pelo operador:

- `ref`: branch, tag ou SHA de commit completo a validar. Verificações com segredos
  exigem que o commit resolvido seja alcançável a partir de uma branch do OpenClaw ou
  tag de release.

Regras:

- Tags estáveis e de correção podem publicar em `beta` ou `latest`
- Tags de pré-release alfa podem publicar apenas em `alpha`
- Tags de pré-release beta podem publicar apenas em `beta`
- Para `OpenClaw NPM Release`, entrada de SHA de commit completo é permitida apenas quando
  `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` são sempre
  somente validação
- O caminho real de publicação deve usar o mesmo `npm_dist_tag` usado durante o preflight;
  o workflow verifica esses metadados antes de a publicação continuar

## Sequência de release npm estável

Ao preparar uma release npm estável:

1. Execute `OpenClaw NPM Release` com `preflight_only=true`
   - Antes de existir uma tag, você pode usar o SHA de commit completo atual da branch de workflow
     para uma execução simulada somente de validação do workflow de preflight
2. Escolha `npm_dist_tag=beta` para o fluxo normal beta primeiro, ou `latest` apenas
   quando você quiser intencionalmente uma publicação estável direta
3. Execute `Full Release Validation` na branch de release, tag de release ou SHA de
   commit completo quando quiser CI normal mais cache de prompt ao vivo, Docker, QA Lab,
   Matrix e cobertura do Telegram em um workflow manual
4. Se você intencionalmente só precisar do grafo de testes normal determinístico, execute o
   workflow manual `CI` na ref da release
5. Salve o `preflight_run_id` bem-sucedido
6. Execute `OpenClaw Release Publish` com a mesma `tag`, o mesmo `npm_dist_tag`
   e o `preflight_run_id` salvo; ele publica plugins externalizados no npm
   e no ClawHub antes de promover o pacote npm do OpenClaw
7. Se a release chegou em `beta`, use o workflow privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover essa versão estável de `beta` para `latest`
8. Se a release foi publicada intencionalmente diretamente em `latest` e `beta`
   deve seguir a mesma build estável imediatamente, use esse mesmo workflow privado
   para apontar ambas as dist-tags para a versão estável, ou deixe a sincronização
   programada de autocorreção mover `beta` depois

A mutação de dist-tag fica no repositório privado por segurança, porque ela ainda
exige `NPM_TOKEN`, enquanto o repositório público mantém publicação apenas com OIDC.

Isso mantém tanto o caminho de publicação direta quanto o caminho de promoção beta primeiro
documentados e visíveis ao operador.

Se um mantenedor precisar recorrer à autenticação npm local, execute quaisquer comandos da CLI
1Password (`op`) apenas dentro de uma sessão tmux dedicada. Não chame `op`
diretamente do shell principal do agente; mantê-lo dentro do tmux torna prompts,
alertas e o tratamento de OTP observáveis e evita alertas repetidos do host.

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
