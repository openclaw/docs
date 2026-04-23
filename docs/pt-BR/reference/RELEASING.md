---
read_when:
    - Procurando definições de canais de lançamento público
    - Procurando nomenclatura de versão e cadência
summary: Canais de lançamento público, nomenclatura de versão e cadência
title: Política de lançamento
x-i18n:
    generated_at: "2026-04-23T14:07:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: b31a9597d656ef33633e6aa1c1019287f7197bebff1e6b11d572e41c149c7cff
    source_path: reference/RELEASING.md
    workflow: 15
---

# Política de lançamento

O OpenClaw tem três trilhas públicas de lançamento:

- stable: lançamentos com tag que publicam no npm `beta` por padrão, ou no npm `latest` quando solicitado explicitamente
- beta: tags de pré-lançamento que publicam no npm `beta`
- dev: a cabeça móvel de `main`

## Nomenclatura de versão

- Versão de lançamento stable: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versão de lançamento de correção stable: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versão de pré-lançamento beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Não use zero à esquerda no mês ou no dia
- `latest` significa o lançamento stable atual promovido no npm
- `beta` significa o alvo atual de instalação beta
- Lançamentos stable e de correção stable publicam no npm `beta` por padrão; operadores de lançamento podem direcionar para `latest` explicitamente, ou promover depois uma build beta validada
- Todo lançamento stable do OpenClaw entrega o pacote npm e o app macOS juntos;
  lançamentos beta normalmente validam e publicam primeiro o caminho npm/pacote, com
  build/assinatura/notarização do app Mac reservados para stable, salvo solicitação explícita

## Cadência de lançamento

- Lançamentos avançam primeiro por beta
- Stable só vem depois que o beta mais recente é validado
- Mantenedores normalmente criam lançamentos a partir de uma branch `release/YYYY.M.D` criada
  da `main` atual, para que validação e correções de lançamento não bloqueiem novo
  desenvolvimento em `main`
- Se uma tag beta tiver sido enviada ou publicada e precisar de correção, mantenedores criam
  a próxima tag `-beta.N` em vez de excluir ou recriar a tag beta antiga
- Procedimento detalhado de lançamento, aprovações, credenciais e notas de recuperação são
  apenas para mantenedores

## Pré-verificação de lançamento

- Execute `pnpm check:test-types` antes da pré-verificação de lançamento para que o TypeScript de teste continue
  coberto fora do gate local mais rápido `pnpm check`
- Execute `pnpm check:architecture` antes da pré-verificação de lançamento para que as verificações mais amplas de ciclo
  de importação e limites de arquitetura fiquem verdes fora do gate local mais rápido
- Execute `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que os artefatos esperados
  de lançamento `dist/*` e o bundle da Control UI existam para a etapa de
  validação do pack
- Execute `pnpm release:check` antes de todo lançamento com tag
- As verificações de lançamento agora são executadas em um workflow manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` também executa o gate de paridade mock do QA Lab mais as trilhas QA
  ativas de Matrix e Telegram antes da aprovação do lançamento. As trilhas ativas usam o
  ambiente `qa-live-shared`; o Telegram também usa leases de credenciais Convex CI.
- A validação de runtime de instalação e upgrade entre SOs é despachada a partir do
  workflow chamador privado
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  que invoca o workflow público reutilizável
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Essa divisão é intencional: manter o caminho real de lançamento npm curto,
  determinístico e focado em artefatos, enquanto verificações ativas mais lentas ficam em sua
  própria trilha para não atrasar nem bloquear a publicação
- As verificações de lançamento devem ser despachadas a partir da ref de workflow `main` ou de uma
  ref de workflow `release/YYYY.M.D` para que a lógica do workflow e os segredos permaneçam
  controlados
- Esse workflow aceita tanto uma tag de lançamento existente quanto o SHA de commit completo de 40 caracteres da branch de workflow atual
- No modo SHA de commit, ele aceita apenas o HEAD atual da branch de workflow; use uma
  tag de lançamento para commits de lançamento mais antigos
- A pré-verificação somente de validação `OpenClaw NPM Release` também aceita o SHA de commit completo de 40 caracteres da branch de workflow atual sem exigir uma tag enviada
- Esse caminho via SHA é somente de validação e não pode ser promovido a uma publicação real
- No modo SHA o workflow sintetiza `v<package.json version>` apenas para a verificação de metadados do
  pacote; a publicação real ainda exige uma tag de lançamento real
- Ambos os workflows mantêm o caminho real de publicação e promoção em runners hospedados pelo GitHub, enquanto o caminho de validação sem mutação pode usar os runners Linux maiores da
  Blacksmith
- Esse workflow executa
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando os segredos de workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- A pré-verificação de lançamento npm não espera mais a trilha separada de verificações de lançamento
- Execute `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou a tag beta/correção correspondente) antes da aprovação
- Após a publicação no npm, execute
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou a versão beta/correção correspondente) para verificar o caminho publicado de
  instalação a partir do registro em um prefixo temporário novo
- A automação de lançamento dos mantenedores agora usa pré-verificação e depois promoção:
  - a publicação npm real precisa passar por um `preflight_run_id` npm bem-sucedido
  - a publicação npm real deve ser despachada da mesma branch `main` ou
    `release/YYYY.M.D` da execução de pré-verificação bem-sucedida
  - lançamentos npm stable usam `beta` por padrão
  - a publicação npm stable pode direcionar `latest` explicitamente via entrada do workflow
  - a mutação de dist-tag npm baseada em token agora fica em
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    por segurança, porque `npm dist-tag add` ainda precisa de `NPM_TOKEN` enquanto o
    repositório público mantém publicação apenas com OIDC
  - `macOS Release` público é apenas de validação
  - a publicação privada real para Mac deve passar por `preflight_run_id` e `validate_run_id`
    privados para Mac bem-sucedidos
  - os caminhos reais de publicação promovem artefatos preparados em vez de reconstruí-los
    novamente
- Para lançamentos de correção stable como `YYYY.M.D-N`, o verificador pós-publicação
  também verifica o mesmo caminho de upgrade em prefixo temporário de `YYYY.M.D` para `YYYY.M.D-N`
  para que correções de lançamento não possam silenciosamente deixar instalações globais mais antigas na
  carga base stable
- A pré-verificação de lançamento npm falha de forma fechada a menos que o tarball inclua ambos
  `dist/control-ui/index.html` e uma carga não vazia de `dist/control-ui/assets/`
  para que não entreguemos novamente um dashboard de navegador vazio
- A verificação pós-publicação também confere se a instalação publicada do registro
  contém dependências de runtime de plugins incluídos não vazias sob o layout raiz
  `dist/*`. Um lançamento enviado com cargas de dependência de
  plugins incluídos ausentes ou vazias falha no verificador pós-publicação e não pode ser promovido
  para `latest`.
- `pnpm test:install:smoke` também aplica o orçamento de `unpackedSize` do pack npm no
  tarball candidato a atualização, para que o e2e do instalador detecte aumento acidental do pack
  antes do caminho de publicação do lançamento
- Se o trabalho de lançamento tocou no planejamento de CI, manifestos de timing de extensões ou
  matrizes de teste de extensões, regenere e revise as saídas da matriz de workflow
  `checks-node-extensions` pertencentes ao planejador a partir de `.github/workflows/ci.yml`
  antes da aprovação para que as notas de lançamento não descrevam um layout de CI obsoleto
- A prontidão de lançamento stable de macOS também inclui as superfícies do atualizador:
  - o lançamento no GitHub deve terminar com os arquivos empacotados `.zip`, `.dmg` e `.dSYM.zip`
  - `appcast.xml` em `main` deve apontar para o novo zip stable após a publicação
  - o app empacotado deve manter um bundle id não de depuração, uma URL de feed Sparkle
    não vazia e um `CFBundleVersion` igual ou superior ao piso canônico de build Sparkle
    para essa versão de lançamento

## Entradas do workflow NPM

`OpenClaw NPM Release` aceita estas entradas controladas pelo operador:

- `tag`: tag de lançamento obrigatória, como `v2026.4.2`, `v2026.4.2-1` ou
  `v2026.4.2-beta.1`; quando `preflight_only=true`, também pode ser o
  SHA de commit completo atual de 40 caracteres da branch de workflow para pré-verificação somente de validação
- `preflight_only`: `true` para apenas validação/build/pacote, `false` para o
  caminho de publicação real
- `preflight_run_id`: obrigatório no caminho de publicação real para que o workflow reutilize
  o tarball preparado da execução de pré-verificação bem-sucedida
- `npm_dist_tag`: tag npm de destino para o caminho de publicação; usa `beta` por padrão

`OpenClaw Release Checks` aceita estas entradas controladas pelo operador:

- `ref`: tag de lançamento existente ou o SHA de commit `main` completo atual de 40 caracteres
  para validar quando despachado a partir de `main`; a partir de uma branch de lançamento, use uma
  tag de lançamento existente ou o SHA de commit completo atual de 40 caracteres da branch de lançamento

Regras:

- Tags stable e de correção podem publicar em `beta` ou `latest`
- Tags de pré-lançamento beta podem publicar apenas em `beta`
- Para `OpenClaw NPM Release`, entrada com SHA completo de commit é permitida apenas quando
  `preflight_only=true`
- `OpenClaw Release Checks` é sempre apenas de validação e também aceita o
  SHA de commit atual da branch de workflow
- O modo de SHA de commit das verificações de lançamento também exige o HEAD atual da branch de workflow
- O caminho de publicação real deve usar o mesmo `npm_dist_tag` usado durante a pré-verificação;
  o workflow verifica esses metadados antes de a publicação continuar

## Sequência de lançamento npm stable

Ao criar um lançamento npm stable:

1. Execute `OpenClaw NPM Release` com `preflight_only=true`
   - Antes de existir uma tag, você pode usar o SHA de commit completo atual da branch de workflow
     para uma execução a seco somente de validação do workflow de pré-verificação
2. Escolha `npm_dist_tag=beta` para o fluxo normal beta-first, ou `latest` apenas
   quando você intencionalmente quiser uma publicação stable direta
3. Execute `OpenClaw Release Checks` separadamente com a mesma tag ou o
   SHA completo atual da branch de workflow quando quiser cobertura ativa de cache de prompt,
   paridade do QA Lab, Matrix e Telegram
   - Isso é separado de propósito para que a cobertura ativa continue disponível sem
     reacoplar verificações longas ou instáveis ao workflow de publicação
4. Salve o `preflight_run_id` bem-sucedido
5. Execute `OpenClaw NPM Release` novamente com `preflight_only=false`, a mesma
   `tag`, o mesmo `npm_dist_tag` e o `preflight_run_id` salvo
6. Se o lançamento cair em `beta`, use o workflow privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover essa versão stable de `beta` para `latest`
7. Se o lançamento foi intencionalmente publicado diretamente em `latest` e `beta`
   deve seguir a mesma build stable imediatamente, use esse mesmo workflow privado
   para apontar ambas as dist-tags para a versão stable, ou deixe a sincronização
   automática agendada mover `beta` depois

A mutação de dist-tag fica no repositório privado por segurança porque ainda
exige `NPM_TOKEN`, enquanto o repositório público mantém publicação apenas com OIDC.

Isso mantém tanto o caminho de publicação direta quanto o caminho de promoção beta-first
documentados e visíveis para o operador.

## Referências públicas

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Mantenedores usam a documentação privada de lançamento em
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
como runbook real.
