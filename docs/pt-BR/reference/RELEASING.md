---
read_when:
    - Procurando definições de canais públicos de release
    - Procurando nomenclatura de versão e cadência
summary: Canais públicos de release, nomenclatura de versão e cadência
title: Política de release
x-i18n:
    generated_at: "2026-04-24T06:10:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32c6d904e21f6d4150cf061ae27594bc2364f0927c48388362b16d8bf97491dc
    source_path: reference/RELEASING.md
    workflow: 15
---

O OpenClaw tem três trilhas públicas de release:

- stable: releases com tag que publicam no npm `beta` por padrão, ou no npm `latest` quando solicitado explicitamente
- beta: tags de prerelease que publicam no npm `beta`
- dev: a ponta móvel de `main`

## Nomenclatura de versão

- Versão de release estável: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versão de release corretiva estável: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versão de prerelease beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Não preencha mês ou dia com zero à esquerda
- `latest` significa a release estável atual promovida no npm
- `beta` significa o alvo de instalação beta atual
- Releases estáveis e releases corretivas estáveis publicam no npm `beta` por padrão; operadores de release podem direcionar explicitamente para `latest` ou promover depois uma build beta validada
- Toda release estável do OpenClaw envia juntos o pacote npm e o app macOS;
  releases beta normalmente validam e publicam primeiro o caminho npm/pacote, com
  build/sign/notarização do app Mac reservados para stable, a menos que solicitado explicitamente

## Cadência de release

- Releases seguem um fluxo beta-first
- Stable só vem depois que a beta mais recente é validada
- Os mantenedores normalmente criam releases a partir de uma branch `release/YYYY.M.D` criada
  a partir da `main` atual, para que validação e correções de release não bloqueiem novo
  desenvolvimento em `main`
- Se uma tag beta tiver sido enviada ou publicada e precisar de correção, os mantenedores criam
  a próxima tag `-beta.N` em vez de excluir ou recriar a tag beta antiga
- Procedimento detalhado de release, aprovações, credenciais e observações de recuperação
  são exclusivos para mantenedores

## Pré-verificação de release

- Execute `pnpm check:test-types` antes da pré-verificação de release para que o TypeScript de testes continue
  coberto fora do gate local mais rápido `pnpm check`
- Execute `pnpm check:architecture` antes da pré-verificação de release para que as verificações mais amplas de ciclo de import
  e limite de arquitetura estejam verdes fora do gate local mais rápido
- Execute `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que os artefatos de release
  esperados em `dist/*` e o bundle da Control UI existam para a etapa de
  validação de pack
- Execute `pnpm release:check` antes de toda release com tag
- As verificações de release agora são executadas em um workflow manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` também executa o gate de paridade mock do QA Lab mais as trilhas live
  de Matrix e Telegram QA antes da aprovação da release. As trilhas live usam o
  ambiente `qa-live-shared`; o Telegram também usa leases de credenciais Convex CI.
- A validação cross-OS de instalação e upgrade em runtime é disparada a partir do
  workflow chamador privado
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  que invoca o workflow público reutilizável
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Essa divisão é intencional: mantenha o caminho real de release npm curto,
  determinístico e focado em artefatos, enquanto verificações live mais lentas ficam em sua
  própria trilha para não atrasar nem bloquear a publicação
- As verificações de release devem ser disparadas a partir da referência de workflow `main` ou de uma
  referência de workflow `release/YYYY.M.D`, para que a lógica do workflow e os segredos permaneçam
  controlados
- Esse workflow aceita tanto uma tag de release existente quanto o commit SHA completo de
  40 caracteres da branch de workflow atual
- No modo commit-SHA, ele aceita apenas o HEAD atual da branch de workflow; use uma
  tag de release para commits de release mais antigos
- A pré-verificação apenas de validação de `OpenClaw NPM Release` também aceita o SHA completo de 40 caracteres atual da branch de workflow sem exigir uma tag enviada
- Esse caminho por SHA é apenas para validação e não pode ser promovido a uma publicação real
- No modo SHA, o workflow sintetiza `v<package.json version>` apenas para a verificação de metadados
  do pacote; a publicação real ainda exige uma tag de release real
- Ambos os workflows mantêm o caminho real de publicação e promoção em runners hospedados no GitHub, enquanto o caminho de validação não mutante pode usar os runners Linux
  maiores da Blacksmith
- Esse workflow executa
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando os segredos de workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- A pré-verificação de release npm não espera mais a trilha separada de verificações de release
- Execute `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou a tag beta/corretiva correspondente) antes da aprovação
- Após a publicação no npm, execute
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou a versão beta/corretiva correspondente) para verificar o caminho de instalação
  publicado no registro em um prefixo temporário novo
- Após uma publicação beta, execute `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N pnpm test:docker:npm-telegram-live`
  para verificar onboarding de pacote instalado, configuração do Telegram e E2E real de Telegram
  contra o pacote npm publicado.
- A automação de release de mantenedores agora usa preflight-then-promote:
  - a publicação real no npm deve passar por um `preflight_run_id` bem-sucedido
  - a publicação real no npm deve ser disparada da mesma branch `main` ou
    `release/YYYY.M.D` da execução bem-sucedida de preflight
  - releases estáveis no npm usam `beta` por padrão
  - uma publicação npm estável pode mirar explicitamente `latest` via input do workflow
  - a mutação de dist-tag do npm baseada em token agora fica em
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    por segurança, porque `npm dist-tag add` ainda precisa de `NPM_TOKEN`, enquanto o
    repositório público mantém publicação apenas com OIDC
  - a `macOS Release` pública é apenas para validação
  - a publicação real privada do Mac deve passar por `preflight_run_id` e `validate_run_id`
    privados e bem-sucedidos do Mac
  - os caminhos reais de publicação promovem artefatos preparados em vez de recriá-los
    novamente
- Para releases corretivas estáveis como `YYYY.M.D-N`, o verificador pós-publicação
  também verifica o mesmo caminho de upgrade em prefixo temporário de `YYYY.M.D` para `YYYY.M.D-N`
  para que correções de release não deixem silenciosamente instalações globais mais antigas presas
  à carga estável base
- A pré-verificação de release npm falha de forma fechada, a menos que o tarball inclua tanto
  `dist/control-ui/index.html` quanto uma carga não vazia de `dist/control-ui/assets/`
  para não enviarmos novamente um dashboard de navegador vazio
- A verificação pós-publicação também verifica se a instalação publicada do registro
  contém dependências de runtime de Plugins incluídos não vazias sob o layout
  raiz `dist/*`. Uma release enviada com payloads ausentes ou vazios de dependências
  de Plugin incluído falha no verificador pós-publicação e não pode ser promovida
  a `latest`.
- `pnpm test:install:smoke` também aplica o orçamento de `unpackedSize` do npm pack no
  tarball candidato à atualização, então o e2e do instalador detecta crescimento acidental do pack
  antes do caminho de publicação da release
- Se o trabalho de release tiver tocado planejamento de CI, manifests de tempo de extensão ou
  matrizes de teste de extensão, regenere e revise as saídas do workflow de
  matriz `checks-node-extensions` controlado pelo planejador a partir de `.github/workflows/ci.yml`
  antes da aprovação para que as notas de release não descrevam um layout de CI desatualizado
- A prontidão de release estável do macOS também inclui as superfícies do atualizador:
  - a release do GitHub deve terminar com `.zip`, `.dmg` e `.dSYM.zip` empacotados
  - `appcast.xml` em `main` deve apontar para o novo zip estável após a publicação
  - o app empacotado deve manter um bundle id sem debug, uma URL de feed do Sparkle não vazia
    e um `CFBundleVersion` igual ou superior ao piso canônico de build do Sparkle
    para aquela versão de release

## Inputs do workflow npm

`OpenClaw NPM Release` aceita estes inputs controlados pelo operador:

- `tag`: tag de release obrigatória, como `v2026.4.2`, `v2026.4.2-1` ou
  `v2026.4.2-beta.1`; quando `preflight_only=true`, também pode ser o SHA completo atual de 40 caracteres do commit da branch de workflow para pré-verificação apenas de validação
- `preflight_only`: `true` para apenas validação/build/package, `false` para o
  caminho real de publicação
- `preflight_run_id`: obrigatório no caminho real de publicação para que o workflow reutilize
  o tarball preparado da execução bem-sucedida de preflight
- `npm_dist_tag`: tag de destino no npm para o caminho de publicação; padrão `beta`

`OpenClaw Release Checks` aceita estes inputs controlados pelo operador:

- `ref`: tag de release existente ou o SHA completo de 40 caracteres atual do commit de `main`
  para validar quando disparado a partir de `main`; a partir de uma release branch, use uma
  tag de release existente ou o SHA completo de 40 caracteres atual do commit da release branch

Regras:

- Tags estáveis e corretivas podem publicar tanto em `beta` quanto em `latest`
- Tags beta de prerelease podem publicar apenas em `beta`
- Para `OpenClaw NPM Release`, input de commit SHA completo só é permitido quando
  `preflight_only=true`
- `OpenClaw Release Checks` é sempre apenas para validação e também aceita o
  commit SHA atual da branch de workflow
- O modo commit-SHA das verificações de release também exige o HEAD atual da branch de workflow
- O caminho real de publicação deve usar o mesmo `npm_dist_tag` usado durante o preflight;
  o workflow valida esses metadados antes de a publicação continuar

## Sequência de release estável no npm

Ao criar uma release estável no npm:

1. Execute `OpenClaw NPM Release` com `preflight_only=true`
   - Antes de existir uma tag, você pode usar o SHA completo atual do commit da branch de workflow
     para uma execução dry run de validação do workflow de preflight
2. Escolha `npm_dist_tag=beta` para o fluxo normal beta-first, ou `latest` apenas
   quando você quiser intencionalmente uma publicação estável direta
3. Execute `OpenClaw Release Checks` separadamente com a mesma tag ou o
   SHA completo atual da branch de workflow quando quiser cobertura live de cache de prompt,
   paridade do QA Lab, Matrix e Telegram
   - Isso é separado de propósito para que a cobertura live continue disponível sem
     reacoplar verificações longas ou instáveis ao workflow de publicação
4. Salve o `preflight_run_id` bem-sucedido
5. Execute `OpenClaw NPM Release` novamente com `preflight_only=false`, a mesma
   `tag`, o mesmo `npm_dist_tag` e o `preflight_run_id` salvo
6. Se a release tiver caído em `beta`, use o workflow privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover essa versão estável de `beta` para `latest`
7. Se a release tiver sido publicada intencionalmente diretamente em `latest` e `beta`
   também precisar seguir imediatamente a mesma build estável, use esse mesmo workflow privado
   para apontar ambas as dist-tags para a versão estável, ou deixe a sincronização
   automática agendada movê-la depois

A mutação de dist-tag fica no repositório privado por segurança porque ela ainda
exige `NPM_TOKEN`, enquanto o repositório público mantém publicação apenas com OIDC.

Isso mantém documentados e visíveis para operadores tanto o caminho de publicação direta quanto o caminho de promoção beta-first.

## Referências públicas

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Os mantenedores usam a documentação privada de release em
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
como runbook real.

## Relacionado

- [Canais de release](/pt-BR/install/development-channels)
