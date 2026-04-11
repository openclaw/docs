---
read_when:
    - Procurando definições públicas dos canais de lançamento
    - Procurando nomenclatura de versões e cadência
summary: Canais de lançamento públicos, nomenclatura de versões e cadência
title: Política de lançamento
x-i18n:
    generated_at: "2026-04-11T02:47:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca613d094c93670c012f0b79720fad0d5d85be802f54b0acb7a8f22aca5bde12
    source_path: reference/RELEASING.md
    workflow: 15
---

# Política de lançamento

O OpenClaw tem três trilhas públicas de lançamento:

- stable: lançamentos com tag que publicam no npm `beta` por padrão, ou no npm `latest` quando solicitado explicitamente
- beta: tags de pré-lançamento que publicam no npm `beta`
- dev: a ponta móvel de `main`

## Nomenclatura de versões

- Versão de lançamento estável: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versão de lançamento de correção estável: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versão de pré-lançamento beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Não use zero à esquerda no mês ou no dia
- `latest` significa a versão estável atual promovida no npm
- `beta` significa o destino de instalação beta atual
- Lançamentos estáveis e de correção estável publicam no npm `beta` por padrão; operadores de lançamento podem direcionar para `latest` explicitamente ou promover depois uma versão beta validada
- Todo lançamento do OpenClaw envia juntos o pacote npm e o app para macOS

## Cadência de lançamento

- Os lançamentos passam primeiro por beta
- A stable só vem depois que a beta mais recente for validada
- O procedimento detalhado de lançamento, aprovações, credenciais e notas de recuperação são
  exclusivos para mantenedores

## Verificação prévia do lançamento

- Execute `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que os
  artefatos de lançamento esperados em `dist/*` e o bundle da Control UI existam para a etapa
  de validação do pacote
- Execute `pnpm release:check` antes de todo lançamento com tag
- A verificação prévia de npm da branch principal também executa
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  antes de empacotar o tarball, usando os segredos de workflow `OPENAI_API_KEY` e
  `ANTHROPIC_API_KEY`
- Execute `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou a tag beta/correção correspondente) antes da aprovação
- Após publicar no npm, execute
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou a versão beta/correção correspondente) para verificar o caminho de instalação publicado no registro
  em um prefixo temporário novo
- A automação de lançamento dos mantenedores agora usa verificação prévia e depois promoção:
  - a publicação real no npm precisa passar por um `preflight_run_id` bem-sucedido no npm
  - lançamentos estáveis no npm usam `beta` por padrão
  - a publicação estável no npm pode direcionar para `latest` explicitamente por meio da entrada do workflow
  - a promoção estável no npm de `beta` para `latest` continua disponível como um modo manual explícito no workflow confiável `OpenClaw NPM Release`
  - esse modo de promoção ainda precisa de um `NPM_TOKEN` válido no ambiente `npm-release`, porque o gerenciamento de `dist-tag` do npm é separado da publicação confiável
  - o `macOS Release` público é apenas de validação
  - a publicação privada real para macOS precisa passar por `preflight_run_id` e `validate_run_id` privados e bem-sucedidos
  - os caminhos de publicação real promovem artefatos preparados em vez de reconstruí-los novamente
- Para lançamentos estáveis de correção como `YYYY.M.D-N`, o verificador pós-publicação
  também verifica o mesmo caminho de atualização em prefixo temporário de `YYYY.M.D` para `YYYY.M.D-N`,
  para que correções de lançamento não deixem silenciosamente instalações globais antigas no
  payload estável base
- A verificação prévia de lançamento npm falha em modo fechado, a menos que o tarball inclua tanto
  `dist/control-ui/index.html` quanto um payload não vazio em `dist/control-ui/assets/`,
  para que não publiquemos novamente um painel do navegador vazio
- Se o trabalho de lançamento tiver alterado o planejamento de CI, manifestos de temporização de extensões ou
  matrizes de teste de extensões, regenere e revise as saídas da matriz do workflow
  `checks-node-extensions`, sob posse do planejador, a partir de `.github/workflows/ci.yml`
  antes da aprovação, para que as notas de lançamento não descrevam um layout de CI desatualizado
- A prontidão do lançamento estável para macOS também inclui as superfícies do atualizador:
  - o lançamento no GitHub precisa terminar com os arquivos empacotados `.zip`, `.dmg` e `.dSYM.zip`
  - `appcast.xml` em `main` precisa apontar para o novo zip estável após a publicação
  - o app empacotado precisa manter um bundle id não debug, uma URL de feed do Sparkle não vazia
    e um `CFBundleVersion` igual ou acima do piso canônico de build do Sparkle
    para essa versão de lançamento

## Entradas do workflow de npm

`OpenClaw NPM Release` aceita estas entradas controladas pelo operador:

- `tag`: tag de lançamento obrigatória, como `v2026.4.2`, `v2026.4.2-1` ou
  `v2026.4.2-beta.1`
- `preflight_only`: `true` para apenas validação/build/pacote, `false` para o
  caminho de publicação real
- `preflight_run_id`: obrigatório no caminho de publicação real para que o workflow reutilize
  o tarball preparado da execução de verificação prévia bem-sucedida
- `npm_dist_tag`: tag de destino do npm para o caminho de publicação; o padrão é `beta`
- `promote_beta_to_latest`: `true` para pular a publicação e mover uma
  versão estável `beta` já publicada para `latest`

Regras:

- Tags estáveis e de correção podem publicar em `beta` ou `latest`
- Tags de pré-lançamento beta podem publicar apenas em `beta`
- O caminho de publicação real precisa usar o mesmo `npm_dist_tag` usado durante a verificação prévia;
  o workflow verifica esses metadados antes de continuar a publicação
- O modo de promoção precisa usar uma tag estável ou de correção, `preflight_only=false`,
  `preflight_run_id` vazio e `npm_dist_tag=beta`
- O modo de promoção também exige um `NPM_TOKEN` válido no ambiente `npm-release`,
  porque `npm dist-tag add` ainda precisa de autenticação npm normal

## Sequência de lançamento estável no npm

Ao criar um lançamento estável no npm:

1. Execute `OpenClaw NPM Release` com `preflight_only=true`
2. Escolha `npm_dist_tag=beta` para o fluxo normal beta-primeiro, ou `latest` apenas
   quando você quiser intencionalmente uma publicação estável direta
3. Salve o `preflight_run_id` bem-sucedido
4. Execute `OpenClaw NPM Release` novamente com `preflight_only=false`, a mesma
   `tag`, o mesmo `npm_dist_tag` e o `preflight_run_id` salvo
5. Se o lançamento chegou a `beta`, execute `OpenClaw NPM Release` depois com a
   mesma `tag` estável, `promote_beta_to_latest=true`, `preflight_only=false`,
   `preflight_run_id` vazio e `npm_dist_tag=beta` quando quiser mover essa
   versão publicada para `latest`

O modo de promoção ainda exige a aprovação do ambiente `npm-release` e um
`NPM_TOKEN` válido nesse ambiente.

Isso mantém documentados e visíveis para o operador tanto o caminho de publicação direta quanto o caminho de
promoção beta-primeiro.

## Referências públicas

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Os mantenedores usam a documentação privada de lançamento em
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
como runbook real.
