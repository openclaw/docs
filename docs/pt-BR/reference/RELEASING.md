---
read_when:
    - Procurando definições públicas de canais de release
    - Procurando nomenclatura de versões e cadência
summary: Canais públicos de release, nomenclatura de versões e cadência
title: Política de release
x-i18n:
    generated_at: "2026-04-12T23:33:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: dffc1ee5fdbb20bd1bf4b3f817d497fc0d87f70ed6c669d324fea66dc01d0b0b
    source_path: reference/RELEASING.md
    workflow: 15
---

# Política de release

O OpenClaw tem três lanes públicas de release:

- stable: releases com tag que publicam no npm `beta` por padrão, ou no npm `latest` quando solicitado explicitamente
- beta: tags de prerelease que publicam no npm `beta`
- dev: a ponta móvel da `main`

## Nomenclatura de versões

- Versão de release stable: `YYYY.M.D`
  - Tag git: `vYYYY.M.D`
- Versão de release de correção stable: `YYYY.M.D-N`
  - Tag git: `vYYYY.M.D-N`
- Versão de prerelease beta: `YYYY.M.D-beta.N`
  - Tag git: `vYYYY.M.D-beta.N`
- Não use zero à esquerda no mês nem no dia
- `latest` significa a release stable atual promovida no npm
- `beta` significa o alvo atual de instalação beta
- Releases stable e correções stable publicam no npm `beta` por padrão; operadores de release podem direcionar para `latest` explicitamente, ou promover depois um build beta validado
- Toda release do OpenClaw envia o pacote npm e o app macOS juntos

## Cadência de release

- Releases passam primeiro por beta
- Stable só vem depois que o beta mais recente é validado
- Procedimento detalhado de release, aprovações, credenciais e observações de recuperação são
  apenas para mantenedores

## Preflight de release

- Execute `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que os
  artefatos esperados de release em `dist/*` e o bundle da Control UI existam para a etapa
  de validação do pack
- Execute `pnpm release:check` antes de toda release com tag
- As verificações de release agora rodam em um workflow manual separado:
  `OpenClaw Release Checks`
- Essa divisão é intencional: mantenha o caminho real de release no npm curto,
  determinístico e focado em artefatos, enquanto verificações live mais lentas ficam na
  própria lane para não atrasarem nem bloquearem a publicação
- As verificações de release precisam ser disparadas a partir da ref de workflow `main` para que a
  lógica do workflow e os secrets permaneçam canônicos
- Esse workflow aceita uma tag de release existente ou o commit SHA completo atual de 40 caracteres da `main`
- No modo commit-SHA, ele aceita apenas o HEAD atual de `origin/main`; use uma
  tag de release para commits de release mais antigos
- O preflight apenas de validação de `OpenClaw NPM Release` também aceita o commit SHA completo atual de 40 caracteres da `main` sem exigir uma tag enviada
- Esse caminho por SHA é apenas de validação e não pode ser promovido a uma publicação real
- No modo SHA, o workflow sintetiza `v<package.json version>` apenas para a verificação de metadados do pacote; a publicação real ainda exige uma tag de release real
- Ambos os workflows mantêm o caminho real de publicação e promoção em runners hospedados pelo GitHub, enquanto o caminho de validação não mutante pode usar os runners Linux maiores da Blacksmith
- Esse workflow executa
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando os workflow secrets `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- O preflight de release npm não espera mais pela lane separada de verificações de release
- Execute `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou a tag beta/correction correspondente) antes da aprovação
- Depois da publicação no npm, execute
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou a versão beta/correction correspondente) para verificar o caminho de instalação
  publicado no registro em um prefixo temporário novo
- A automação de release dos mantenedores agora usa preflight-then-promote:
  - a publicação real no npm deve passar por um `preflight_run_id` bem-sucedido no npm
  - releases stable no npm usam `beta` por padrão
  - a publicação stable no npm pode direcionar para `latest` explicitamente via entrada do workflow
  - a promoção stable no npm de `beta` para `latest` ainda está disponível como modo manual explícito no workflow confiável `OpenClaw NPM Release`
  - esse modo de promoção ainda precisa de um `NPM_TOKEN` válido no ambiente `npm-release` porque o gerenciamento de `dist-tag` no npm é separado da publicação confiável
  - a `macOS Release` pública é apenas de validação
  - a publicação real privada para mac deve passar por um `preflight_run_id` e `validate_run_id`
    privados do mac bem-sucedidos
  - os caminhos reais de publicação promovem artefatos preparados em vez de reconstruí-los
    novamente
- Para releases de correção stable como `YYYY.M.D-N`, o verificador pós-publicação
  também verifica o mesmo caminho de upgrade em prefixo temporário de `YYYY.M.D` para `YYYY.M.D-N`
  para que correções de release não deixem silenciosamente instalações globais antigas no
  payload stable base
- O preflight de release npm falha de forma fechada a menos que o tarball inclua tanto
  `dist/control-ui/index.html` quanto uma carga útil não vazia em `dist/control-ui/assets/`
  para que não enviemos novamente um dashboard do navegador vazio
- Se o trabalho de release tocou no planejamento de CI, manifests de timing de extensões ou
  matrizes de teste de extensões, regenere e revise as saídas da matriz do workflow
  `checks-node-extensions` pertencentes ao planner a partir de `.github/workflows/ci.yml`
  antes da aprovação para que as notas de release não descrevam um layout de CI desatualizado
- A prontidão de release stable do macOS também inclui as superfícies do updater:
  - a release no GitHub precisa terminar com os pacotes `.zip`, `.dmg` e `.dSYM.zip`
  - `appcast.xml` na `main` precisa apontar para o novo zip stable depois da publicação
  - o app empacotado precisa manter um bundle id não debug, uma URL de feed Sparkle não vazia
    e um `CFBundleVersion` igual ou superior ao piso canônico de build do Sparkle
    para aquela versão de release

## Entradas do workflow NPM

`OpenClaw NPM Release` aceita estas entradas controladas pelo operador:

- `tag`: tag de release obrigatória, como `v2026.4.2`, `v2026.4.2-1` ou
  `v2026.4.2-beta.1`; quando `preflight_only=true`, também pode ser o
  commit SHA completo atual de 40 caracteres da `main` para preflight apenas de validação
- `preflight_only`: `true` para apenas validação/build/package, `false` para o
  caminho de publicação real
- `preflight_run_id`: obrigatório no caminho de publicação real para que o workflow reutilize
  o tarball preparado da execução de preflight bem-sucedida
- `npm_dist_tag`: tag npm de destino para o caminho de publicação; o padrão é `beta`
- `promote_beta_to_latest`: `true` para pular a publicação e mover um build stable
  `beta` já publicado para `latest`

`OpenClaw Release Checks` aceita estas entradas controladas pelo operador:

- `ref`: tag de release existente ou o commit SHA completo atual de 40 caracteres
  da `main` a ser validado

Regras:

- Tags stable e correction podem publicar em `beta` ou `latest`
- Tags beta prerelease podem publicar apenas em `beta`
- Entrada com commit SHA completo é permitida apenas quando `preflight_only=true`
- O modo commit-SHA das verificações de release também exige o HEAD atual de `origin/main`
- O caminho de publicação real deve usar o mesmo `npm_dist_tag` usado durante o preflight;
  o workflow verifica esses metadados antes de a publicação continuar
- O modo de promoção deve usar uma tag stable ou correction, `preflight_only=false`,
  `preflight_run_id` vazio e `npm_dist_tag=beta`
- O modo de promoção também exige um `NPM_TOKEN` válido no ambiente `npm-release`
  porque `npm dist-tag add` ainda precisa de auth npm regular

## Sequência de release stable no npm

Ao criar uma release stable no npm:

1. Execute `OpenClaw NPM Release` com `preflight_only=true`
   - Antes de existir uma tag, você pode usar o commit SHA completo atual da `main` para uma
     execução de validação dry run do workflow de preflight
2. Escolha `npm_dist_tag=beta` para o fluxo normal beta-first, ou `latest` apenas
   quando quiser intencionalmente uma publicação stable direta
3. Execute `OpenClaw Release Checks` separadamente com a mesma tag ou o
   commit SHA completo atual da `main` quando quiser cobertura live do prompt cache
   - Isso é separado de propósito para que a cobertura live continue disponível sem
     reacoplar verificações demoradas ou instáveis ao workflow de publicação
4. Salve o `preflight_run_id` bem-sucedido
5. Execute `OpenClaw NPM Release` novamente com `preflight_only=false`, a mesma
   `tag`, o mesmo `npm_dist_tag` e o `preflight_run_id` salvo
6. Se a release chegou em `beta`, execute `OpenClaw NPM Release` mais tarde com a
   mesma `tag` stable, `promote_beta_to_latest=true`, `preflight_only=false`,
   `preflight_run_id` vazio e `npm_dist_tag=beta` quando quiser mover esse
   build publicado para `latest`

O modo de promoção ainda exige a aprovação do ambiente `npm-release` e um
`NPM_TOKEN` válido nesse ambiente.

Isso mantém documentados e visíveis para o operador tanto o caminho de publicação direta quanto o caminho de promoção beta-first.

## Referências públicas

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Os mantenedores usam a documentação privada de release em
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
como runbook real.
