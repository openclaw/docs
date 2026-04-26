---
read_when:
    - Procurando definições públicas de canais de lançamento
    - Procurando nomenclatura de versões e cadência
summary: Canais de lançamento público, nomenclatura de versões e cadência
title: Política de lançamento
x-i18n:
    generated_at: "2026-04-26T11:37:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48ac0ca7d9c6a6ce011e8adda54e1e49beab30456c0dc2bffaec6acec41094df
    source_path: reference/RELEASING.md
    workflow: 15
---

O OpenClaw tem três canais públicos de lançamento:

- stable: lançamentos com tag que publicam no npm `beta` por padrão, ou no npm `latest` quando solicitado explicitamente
- beta: tags de pré-lançamento que publicam no npm `beta`
- dev: a ponta móvel de `main`

## Nomenclatura de versões

- Versão de lançamento stable: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versão de lançamento de correção stable: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versão de pré-lançamento beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Não adicione zero à esquerda no mês nem no dia
- `latest` significa o lançamento stable promovido atual no npm
- `beta` significa o destino de instalação beta atual
- Lançamentos stable e de correção stable publicam no npm `beta` por padrão; operadores de lançamento podem direcionar explicitamente para `latest` ou promover depois um build beta validado
- Todo lançamento stable do OpenClaw envia juntos o pacote npm e o app macOS;
  lançamentos beta normalmente validam e publicam primeiro o caminho do npm/pacote, com
  build/assinatura/notarização do app mac reservados para stable, a menos que sejam solicitados explicitamente

## Cadência de lançamento

- Os lançamentos seguem beta-first
- stable só vem depois que o beta mais recente é validado
- Normalmente, os mantenedores fazem lançamentos a partir de um branch `release/YYYY.M.D` criado
  do `main` atual, para que a validação e as correções do lançamento não bloqueiem
  novo desenvolvimento em `main`
- Se uma tag beta tiver sido enviada ou publicada e precisar de correção, os mantenedores criam
  a próxima tag `-beta.N` em vez de excluir ou recriar a tag beta anterior
- Procedimento detalhado de lançamento, aprovações, credenciais e notas de recuperação são
  apenas para mantenedores

## Verificações prévias de lançamento

- Execute `pnpm check:test-types` antes das verificações prévias de lançamento para que o TypeScript de teste continue
  coberto fora da verificação local mais rápida `pnpm check`
- Execute `pnpm check:architecture` antes das verificações prévias de lançamento para que as verificações mais amplas de
  ciclos de importação e limites de arquitetura estejam verdes fora da verificação local mais rápida
- Execute `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que os artefatos de lançamento
  esperados em `dist/*` e o bundle da Control UI existam para a etapa de
  validação de empacotamento
- Execute `pnpm qa:otel:smoke` ao validar a telemetria de lançamento. Ele exercita
  o QA-lab por meio de um receptor local OTLP/HTTP e verifica os nomes dos spans
  de trace exportados, atributos limitados e redação de conteúdo/identificadores sem
  exigir Opik, Langfuse ou outro coletor externo.
- Execute `pnpm release:check` antes de todo lançamento com tag
- As verificações de lançamento agora são executadas em um workflow manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` também executa o gate de paridade mock do QA Lab mais os lanes QA ao vivo de
  Matrix e Telegram antes da aprovação do lançamento. Os lanes ao vivo usam o
  ambiente `qa-live-shared`; Telegram também usa leases de credenciais Convex CI.
- A validação em tempo de execução de instalação e atualização em vários OS é despachada a partir do
  workflow chamador privado
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  que invoca o workflow público reutilizável
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Essa divisão é intencional: manter o caminho real de lançamento npm curto,
  determinístico e focado em artefatos, enquanto verificações ao vivo mais lentas ficam em seu
  próprio lane para não atrasar nem bloquear a publicação
- As verificações de lançamento devem ser despachadas a partir da ref de workflow de `main` ou de uma
  ref de workflow `release/YYYY.M.D`, para que a lógica do workflow e os secrets permaneçam
  controlados
- Esse workflow aceita uma tag de lançamento existente ou o SHA completo atual de 40 caracteres do commit do branch do workflow
- No modo de commit-SHA, ele aceita apenas o HEAD atual do branch do workflow; use uma
  tag de lançamento para commits de lançamento mais antigos
- A verificação prévia somente de validação de `OpenClaw NPM Release` também aceita o SHA completo atual
  de 40 caracteres do commit do branch do workflow sem exigir uma tag enviada
- Esse caminho por SHA é somente de validação e não pode ser promovido para uma publicação real
- No modo SHA, o workflow sintetiza `v<package.json version>` apenas para a verificação de metadados
  do pacote; a publicação real ainda exige uma tag de lançamento real
- Ambos os workflows mantêm o caminho real de publicação e promoção em runners hospedados pelo GitHub,
  enquanto o caminho de validação sem mutação pode usar os runners Linux maiores do
  Blacksmith
- Esse workflow executa
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando os secrets de workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- A verificação prévia de lançamento npm não espera mais pelo lane separado de verificações de lançamento
- Execute `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou a tag beta/correção correspondente) antes da aprovação
- Após a publicação no npm, execute
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou a versão beta/correção correspondente) para verificar o caminho de instalação
  publicado no registro em um prefixo temporário novo
- Após uma publicação beta, execute `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  para verificar onboarding do pacote instalado, configuração do Telegram e E2E real do Telegram
  em relação ao pacote npm publicado usando o pool compartilhado de credenciais Telegram alugadas.
  Casos pontuais locais de mantenedores podem omitir as variáveis Convex e passar diretamente as três
  credenciais env `OPENCLAW_QA_TELEGRAM_*`.
- Mantenedores podem executar a mesma verificação pós-publicação a partir do GitHub Actions por meio do
  workflow manual `NPM Telegram Beta E2E`. Ele é intencionalmente apenas manual e
  não é executado em todo merge.
- A automação de lançamento de mantenedor agora usa pré-verificação seguida de promoção:
  - a publicação npm real deve passar por um `preflight_run_id` npm bem-sucedido
  - a publicação npm real deve ser despachada a partir do mesmo branch `main` ou
    `release/YYYY.M.D` da execução de pré-verificação bem-sucedida
  - lançamentos npm stable usam `beta` por padrão
  - a publicação npm stable pode direcionar explicitamente para `latest` via entrada do workflow
  - a mutação de dist-tag npm baseada em token agora fica em
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    por segurança, porque `npm dist-tag add` ainda precisa de `NPM_TOKEN`, enquanto o
    repositório público mantém publicação apenas com OIDC
  - `macOS Release` público é somente de validação
  - a publicação mac privada real deve passar por `preflight_run_id` e `validate_run_id`
    privados bem-sucedidos
  - os caminhos de publicação real promovem artefatos preparados em vez de reconstruí-los
    novamente
- Para lançamentos de correção stable como `YYYY.M.D-N`, o verificador pós-publicação
  também verifica o mesmo caminho de atualização em prefixo temporário de `YYYY.M.D` para `YYYY.M.D-N`,
  para que correções de lançamento não deixem silenciosamente instalações globais mais antigas com a
  carga do stable base
- A verificação prévia de lançamento npm falha de forma fechada, a menos que o tarball inclua
  ambos `dist/control-ui/index.html` e uma carga útil não vazia em `dist/control-ui/assets/`,
  para que não enviemos novamente um painel de navegador vazio
- A verificação pós-publicação também verifica se a instalação publicada no registro
  contém dependências de runtime de Plugin empacotadas e não vazias sob o layout raiz
  `dist/*`. Um lançamento que seja enviado com cargas de dependência de
  Plugin empacotadas ausentes ou vazias falha no verificador pós-publicação e não pode ser promovido
  para `latest`.
- `pnpm test:install:smoke` também impõe o orçamento de `unpackedSize` do npm pack no
  tarball candidato de atualização, para que o e2e do instalador detecte aumento acidental do pack
  antes do caminho de publicação do lançamento
- Se o trabalho de lançamento tiver alterado o planejamento de CI, manifestos de temporização de extension ou
  matrizes de teste de extension, regenere e revise as saídas de matriz do workflow
  `checks-node-extensions` de propriedade do planner em `.github/workflows/ci.yml`
  antes da aprovação, para que as notas de lançamento não descrevam um layout de CI desatualizado
- A prontidão de lançamento stable do macOS também inclui as superfícies do atualizador:
  - o lançamento no GitHub deve terminar com `.zip`, `.dmg` e `.dSYM.zip` empacotados
  - `appcast.xml` em `main` deve apontar para o novo zip stable após a publicação
  - o app empacotado deve manter um bundle id não debug, uma URL de feed Sparkle não vazia
    e um `CFBundleVersion` igual ou acima do piso canônico de build do Sparkle
    para essa versão de lançamento

## Entradas do workflow npm

`OpenClaw NPM Release` aceita estas entradas controladas pelo operador:

- `tag`: tag de lançamento obrigatória, como `v2026.4.2`, `v2026.4.2-1`, ou
  `v2026.4.2-beta.1`; quando `preflight_only=true`, também pode ser o SHA completo atual de
  40 caracteres do commit do branch do workflow para verificação prévia somente de validação
- `preflight_only`: `true` para apenas validação/build/pacote, `false` para o
  caminho de publicação real
- `preflight_run_id`: obrigatório no caminho de publicação real para que o workflow reutilize
  o tarball preparado da execução de pré-verificação bem-sucedida
- `npm_dist_tag`: tag npm de destino para o caminho de publicação; o padrão é `beta`

`OpenClaw Release Checks` aceita estas entradas controladas pelo operador:

- `ref`: tag de lançamento existente ou o SHA completo atual de 40 caracteres do commit de `main`
  para validar quando despachado de `main`; em um branch de lançamento, use uma
  tag de lançamento existente ou o SHA completo atual de 40 caracteres do commit do branch de lançamento

Regras:

- Tags stable e de correção podem publicar em `beta` ou `latest`
- Tags de pré-lançamento beta podem publicar apenas em `beta`
- Para `OpenClaw NPM Release`, a entrada de SHA completo de commit só é permitida quando
  `preflight_only=true`
- `OpenClaw Release Checks` é sempre somente de validação e também aceita o
  SHA de commit atual do branch do workflow
- O modo commit-SHA das verificações de lançamento também exige o HEAD atual do branch do workflow
- O caminho de publicação real deve usar o mesmo `npm_dist_tag` usado durante a pré-verificação;
  o workflow verifica esses metadados antes que a publicação continue

## Sequência de lançamento npm stable

Ao fazer um lançamento npm stable:

1. Execute `OpenClaw NPM Release` com `preflight_only=true`
   - Antes de existir uma tag, você pode usar o SHA completo atual do commit do branch do workflow
     para uma execução de teste somente de validação do workflow de pré-verificação
2. Escolha `npm_dist_tag=beta` para o fluxo normal beta-first, ou `latest` apenas
   quando você quiser intencionalmente uma publicação stable direta
3. Execute `OpenClaw Release Checks` separadamente com a mesma tag ou o
   SHA completo atual do branch do workflow quando quiser cobertura ao vivo de prompt cache,
   paridade do QA Lab, Matrix e Telegram
   - Isso é separado de propósito para que a cobertura ao vivo permaneça disponível sem
     reacoplar verificações longas ou instáveis ao workflow de publicação
4. Salve o `preflight_run_id` bem-sucedido
5. Execute `OpenClaw NPM Release` novamente com `preflight_only=false`, a mesma
   `tag`, o mesmo `npm_dist_tag` e o `preflight_run_id` salvo
6. Se o lançamento chegou em `beta`, use o workflow privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover essa versão stable de `beta` para `latest`
7. Se o lançamento foi intencionalmente publicado diretamente em `latest` e `beta`
   deve seguir o mesmo build stable imediatamente, use esse mesmo workflow privado
   para apontar ambas as dist-tags para a versão stable, ou deixe a sincronização
   automática agendada movê-las depois

A mutação de dist-tag fica no repositório privado por segurança porque ainda
exige `NPM_TOKEN`, enquanto o repositório público mantém publicação apenas com OIDC.

Isso mantém o caminho de publicação direta e o caminho de promoção beta-first ambos
documentados e visíveis para o operador.

Se um mantenedor precisar recorrer à autenticação npm local, execute quaisquer comandos da CLI do 1Password
(`op`) apenas dentro de uma sessão tmux dedicada. Não chame `op`
diretamente no shell principal do agente; mantê-lo dentro do tmux torna prompts,
alertas e o tratamento de OTP observáveis e evita alertas repetidos do host.

## Referências públicas

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Os mantenedores usam a documentação privada de lançamento em
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
como runbook real.

## Relacionado

- [Canais de lançamento](/pt-BR/install/development-channels)
