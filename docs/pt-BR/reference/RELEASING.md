---
read_when:
    - Procurando definições públicas de canais de lançamento
    - Procurando nomenclatura de versões e cadência
summary: Canais de lançamento públicos, nomenclatura de versões e cadência
title: Política de lançamento
x-i18n:
    generated_at: "2026-04-25T13:55:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc20f30345cbc6c0897e63c9f6a554f9c25be0b52df3efc7d2bbd8827891984a
    source_path: reference/RELEASING.md
    workflow: 15
---

O OpenClaw tem três canais públicos de lançamento:

- stable: lançamentos com tag que publicam no npm `beta` por padrão, ou no npm `latest` quando solicitado explicitamente
- beta: tags de pré-lançamento que publicam no npm `beta`
- dev: o head móvel de `main`

## Nomenclatura de versões

- Versão de lançamento stable: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versão de lançamento de correção stable: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versão de pré-lançamento beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Não adicione zero à esquerda ao mês ou ao dia
- `latest` significa o lançamento stable promovido atual no npm
- `beta` significa o alvo de instalação beta atual
- Lançamentos stable e de correção stable publicam no npm `beta` por padrão; operadores de release podem direcionar para `latest` explicitamente ou promover uma build beta validada depois
- Todo lançamento stable do OpenClaw envia o pacote npm e o app macOS juntos;
  lançamentos beta normalmente validam e publicam primeiro o caminho do pacote/npm, com
  build/assinatura/notarização do app mac reservadas para stable, a menos que solicitado explicitamente

## Cadência de lançamento

- Os lançamentos seguem o fluxo beta-first
- Stable só vem depois que o beta mais recente é validado
- Os mantenedores normalmente criam lançamentos a partir de uma branch `release/YYYY.M.D` criada
  a partir da `main` atual, para que a validação e as correções do release não bloqueiem novo
  desenvolvimento na `main`
- Se uma tag beta tiver sido enviada ou publicada e precisar de correção, os mantenedores criam
  a próxima tag `-beta.N` em vez de excluir ou recriar a tag beta antiga
- Procedimento detalhado de release, aprovações, credenciais e notas de recuperação são
  restritos a mantenedores

## Pré-verificação de release

- Execute `pnpm check:test-types` antes da pré-verificação de release para que o TypeScript de teste continue
  coberto fora do gate local mais rápido `pnpm check`
- Execute `pnpm check:architecture` antes da pré-verificação de release para que as verificações mais amplas de
  ciclos de importação e limites de arquitetura estejam verdes fora do gate local mais rápido
- Execute `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que os artefatos esperados de release em
  `dist/*` e o bundle do Control UI existam para a etapa de validação do pack
- Execute `pnpm release:check` antes de cada release com tag
- As verificações de release agora são executadas em um workflow manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` também executa o gate de paridade mock do QA Lab mais os fluxos QA ao vivo de
  Matrix e Telegram antes da aprovação do release. Os fluxos ao vivo usam o ambiente
  `qa-live-shared`; o Telegram também usa leases de credenciais do Convex CI.
- A validação de runtime de instalação e upgrade cross-OS é despachada a partir do
  workflow chamador privado
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  que invoca o workflow público reutilizável
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Essa divisão é intencional: manter o caminho real de release npm curto,
  determinístico e focado em artefatos, enquanto verificações ao vivo mais lentas ficam em seu
  próprio canal para não atrasar nem bloquear a publicação
- As verificações de release devem ser despachadas a partir da referência de workflow `main` ou de uma
  referência de workflow `release/YYYY.M.D`, para que a lógica do workflow e os segredos permaneçam
  controlados
- Esse workflow aceita uma tag de release existente ou o commit SHA completo atual de 40 caracteres da branch do workflow
- No modo commit-SHA, ele aceita apenas o HEAD atual da branch do workflow; use uma
  tag de release para commits de release mais antigos
- A pré-verificação apenas de validação de `OpenClaw NPM Release` também aceita o commit SHA completo atual de 40 caracteres da branch do workflow sem exigir uma tag enviada
- Esse caminho por SHA é apenas para validação e não pode ser promovido para uma publicação real
- No modo SHA, o workflow sintetiza `v<package.json version>` apenas para a verificação de metadados do pacote; a publicação real ainda exige uma tag de release real
- Ambos os workflows mantêm o caminho real de publicação e promoção em runners hospedados no GitHub, enquanto o caminho de validação sem mutação pode usar os runners Linux maiores do Blacksmith
- Esse workflow executa
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando os segredos de workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- A pré-verificação do release npm não espera mais pelo canal separado de verificações de release
- Execute `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou a tag beta/correção correspondente) antes da aprovação
- Depois da publicação no npm, execute
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou a versão beta/correção correspondente) para verificar o caminho de instalação do registro publicado em um prefixo temporário limpo
- Depois de uma publicação beta, execute `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  para verificar onboarding do pacote instalado, configuração do Telegram e E2E real do Telegram
  contra o pacote npm publicado usando o pool compartilhado de credenciais alugadas do Telegram.
  Execuções locais pontuais de mantenedores podem omitir as variáveis do Convex e passar diretamente as três
  credenciais de ambiente `OPENCLAW_QA_TELEGRAM_*`.
- Os mantenedores podem executar a mesma verificação pós-publicação a partir do GitHub Actions por meio do
  workflow manual `NPM Telegram Beta E2E`. Ele é intencionalmente apenas manual e
  não roda em todo merge.
- A automação de release dos mantenedores agora usa pré-verificação e depois promoção:
  - a publicação real no npm deve passar por um `preflight_run_id` bem-sucedido no npm
  - a publicação real no npm deve ser despachada da mesma branch `main` ou
    `release/YYYY.M.D` da execução de pré-verificação bem-sucedida
  - releases npm stable usam `beta` por padrão
  - a publicação npm stable pode direcionar para `latest` explicitamente via input do workflow
  - a mutação de dist-tag npm baseada em token agora fica em
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    por segurança, porque `npm dist-tag add` ainda precisa de `NPM_TOKEN`, enquanto o
    repositório público mantém publicação apenas com OIDC
  - `macOS Release` público é apenas para validação
  - a publicação real privada do mac deve passar por `preflight_run_id` e `validate_run_id`
    privados e bem-sucedidos
  - os caminhos de publicação real promovem artefatos preparados em vez de reconstruí-los
    novamente
- Para releases de correção stable como `YYYY.M.D-N`, o verificador pós-publicação
  também verifica o mesmo caminho de upgrade em prefixo temporário de `YYYY.M.D` para `YYYY.M.D-N`,
  para que correções de release não deixem silenciosamente instalações globais mais antigas no
  payload stable base
- A pré-verificação do release npm falha de forma fechada, a menos que o tarball inclua ambos
  `dist/control-ui/index.html` e uma carga útil não vazia em `dist/control-ui/assets/`,
  para que não enviemos novamente um painel de navegador vazio
- A verificação pós-publicação também verifica se a instalação publicada no registro
  contém dependências de runtime de Plugin incluídas e não vazias sob o layout raiz `dist/*`.
  Um release enviado com cargas úteis ausentes ou vazias de dependências de Plugin incluídas
  falha no verificador pós-publicação e não pode ser promovido
  para `latest`.
- `pnpm test:install:smoke` também aplica o orçamento de `unpackedSize` do npm pack ao
  tarball candidato de atualização, para que o e2e do instalador detecte aumento acidental do pack
  antes do caminho de publicação do release
- Se o trabalho de release tocou no planejamento de CI, manifestos de timing de extensões ou
  matrizes de teste de extensões, regenere e revise as saídas da matriz de workflow
  `checks-node-extensions` de propriedade do planejador em `.github/workflows/ci.yml`
  antes da aprovação, para que as notas de release não descrevam um layout de CI desatualizado
- A prontidão de release stable do macOS também inclui as superfícies do atualizador:
  - o release do GitHub deve terminar com os arquivos empacotados `.zip`, `.dmg` e `.dSYM.zip`
  - `appcast.xml` em `main` deve apontar para o novo zip stable após a publicação
  - o app empacotado deve manter um bundle id não debug, uma URL de feed do Sparkle não vazia
    e um `CFBundleVersion` igual ou acima do piso canônico de build do Sparkle
    para essa versão de release

## Inputs do workflow npm

`OpenClaw NPM Release` aceita estes inputs controlados pelo operador:

- `tag`: tag de release obrigatória, como `v2026.4.2`, `v2026.4.2-1`, ou
  `v2026.4.2-beta.1`; quando `preflight_only=true`, também pode ser o commit SHA completo atual de 40 caracteres da branch do workflow para pré-verificação apenas de validação
- `preflight_only`: `true` para apenas validação/build/package, `false` para o caminho de publicação real
- `preflight_run_id`: obrigatório no caminho de publicação real para que o workflow reutilize o tarball preparado da execução de pré-verificação bem-sucedida
- `npm_dist_tag`: tag npm de destino para o caminho de publicação; o padrão é `beta`

`OpenClaw Release Checks` aceita estes inputs controlados pelo operador:

- `ref`: tag de release existente ou o commit SHA completo atual de 40 caracteres de `main`
  para validar quando despachado a partir de `main`; a partir de uma branch de release, use uma
  tag de release existente ou o commit SHA completo atual de 40 caracteres da branch de release

Regras:

- Tags stable e de correção podem publicar em `beta` ou `latest`
- Tags de pré-lançamento beta podem publicar apenas em `beta`
- Para `OpenClaw NPM Release`, input de commit SHA completo é permitido apenas quando
  `preflight_only=true`
- `OpenClaw Release Checks` é sempre apenas para validação e também aceita o
  commit SHA atual da branch do workflow
- O modo commit-SHA das verificações de release também exige o HEAD atual da branch do workflow
- O caminho de publicação real deve usar o mesmo `npm_dist_tag` usado durante a pré-verificação;
  o workflow verifica esses metadados antes de a publicação continuar

## Sequência de release npm stable

Ao criar um release npm stable:

1. Execute `OpenClaw NPM Release` com `preflight_only=true`
   - Antes de existir uma tag, você pode usar o commit SHA completo atual da branch do workflow
     para uma execução de teste apenas de validação do workflow de pré-verificação
2. Escolha `npm_dist_tag=beta` para o fluxo beta-first normal, ou `latest` apenas
   quando você quiser intencionalmente uma publicação stable direta
3. Execute `OpenClaw Release Checks` separadamente com a mesma tag ou o
   commit SHA completo atual da branch do workflow quando quiser cobertura ao vivo de prompt cache,
   paridade do QA Lab, Matrix e Telegram
   - Isso é separado de propósito para que a cobertura ao vivo continue disponível sem
     reacoplar verificações demoradas ou instáveis ao workflow de publicação
4. Salve o `preflight_run_id` bem-sucedido
5. Execute `OpenClaw NPM Release` novamente com `preflight_only=false`, a mesma
   `tag`, o mesmo `npm_dist_tag` e o `preflight_run_id` salvo
6. Se o release tiver chegado em `beta`, use o workflow privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover essa versão stable de `beta` para `latest`
7. Se o release tiver sido publicado intencionalmente diretamente em `latest` e `beta`
   deve seguir imediatamente a mesma build stable, use esse mesmo workflow privado
   para apontar ambas as dist-tags para a versão stable, ou deixe sua sincronização
   programada de autocorreção mover `beta` depois

A mutação de dist-tag fica no repositório privado por segurança porque ainda
requer `NPM_TOKEN`, enquanto o repositório público mantém publicação apenas com OIDC.

Isso mantém documentados e visíveis para o operador tanto o caminho de publicação direta quanto o caminho de promoção beta-first.

Se um mantenedor precisar recorrer à autenticação npm local, execute quaisquer comandos do
CLI do 1Password (`op`) apenas dentro de uma sessão tmux dedicada. Não chame `op`
diretamente do shell principal do agente; mantê-lo dentro do tmux torna prompts,
alertas e o tratamento de OTP observáveis e evita alertas repetidos no host.

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

- [Canais de lançamento](/pt-BR/install/development-channels)
