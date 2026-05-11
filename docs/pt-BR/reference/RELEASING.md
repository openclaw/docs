---
read_when:
    - Procurando definições de canais de lançamento públicos
    - Executando validação de release ou aceitação de pacote
    - Procurando nomenclatura e cadência de versões
summary: Faixas de lançamento, checklist do operador, caixas de validação, nomenclatura de versões e cadência
title: Política de lançamento
x-i18n:
    generated_at: "2026-05-11T20:35:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4f3aaa53534bb6d1af5e72900a48f52fc89ff8188af7b19ecf75543bfcb1ecb
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw tem três linhas de lançamento públicas:

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
- Não preencha mês ou dia com zero à esquerda
- `latest` significa o lançamento npm estável promovido atual
- `beta` significa o alvo atual de instalação beta
- Lançamentos estáveis e de correção estável publicam no npm `beta` por padrão; operadores de lançamento podem mirar `latest` explicitamente, ou promover uma build beta validada depois
- Todo lançamento estável do OpenClaw entrega o pacote npm e o app macOS juntos;
  lançamentos beta normalmente validam e publicam primeiro o caminho npm/pacote, com
  build/assinatura/notarização do app Mac reservados para estável, salvo solicitação explícita

## Cadência de lançamentos

- Os lançamentos avançam primeiro pelo beta
- Estável vem somente depois que o beta mais recente é validado
- Mantenedores normalmente cortam lançamentos a partir de um branch `release/YYYY.M.D` criado
  a partir do `main` atual, para que validação e correções de lançamento não bloqueiem novo
  desenvolvimento em `main`
- Se uma tag beta foi enviada ou publicada e precisa de correção, os mantenedores cortam
  a próxima tag `-beta.N` em vez de excluir ou recriar a tag beta antiga
- Procedimento detalhado de lançamento, aprovações, credenciais e notas de recuperação são
  exclusivos dos mantenedores

## Checklist do operador de lançamento

Este checklist é o formato público do fluxo de lançamento. Credenciais privadas,
assinatura, notarização, recuperação de dist-tag e detalhes de rollback emergencial ficam no
runbook de lançamento exclusivo dos mantenedores.

1. Comece do `main` atual: faça pull do mais recente, confirme que o commit alvo foi enviado
   e confirme que a CI atual do `main` está verde o suficiente para criar um branch a partir dele.
2. Reescreva a seção superior de `CHANGELOG.md` a partir do histórico real de commits com
   `/changelog`, mantenha as entradas voltadas ao usuário, faça commit, envie, e faça rebase/pull
   mais uma vez antes de criar o branch.
3. Revise os registros de compatibilidade de lançamento em
   `src/plugins/compat/registry.ts` e
   `src/commands/doctor/shared/deprecation-compat.ts`. Remova compatibilidade expirada
   somente quando o caminho de upgrade continuar coberto, ou registre por que ela está sendo
   mantida intencionalmente.
4. Crie `release/YYYY.M.D` a partir do `main` atual; não faça trabalho normal de lançamento
   diretamente em `main`.
5. Atualize todos os locais de versão necessários para a tag pretendida e então execute
   `pnpm release:prep`. Ele atualiza versões de plugins, inventário de plugins, esquema de
   configuração, metadados de configuração de canais empacotados, baseline da documentação de
   configuração, exportações do Plugin SDK e baseline da API do Plugin SDK na ordem certa. Faça
   commit de qualquer desvio gerado antes de criar a tag. Depois execute o preflight determinístico local:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, e `pnpm release:check`.
6. Execute `OpenClaw NPM Release` com `preflight_only=true`. Antes de existir uma tag,
   um SHA completo de 40 caracteres do branch de lançamento é permitido para preflight
   somente de validação. Salve o `preflight_run_id` bem-sucedido.
7. Inicie todos os testes de pré-lançamento com `Full Release Validation` para o
   branch de lançamento, tag ou SHA completo do commit. Este é o único ponto de entrada manual
   para as quatro grandes caixas de teste de lançamento: Vitest, Docker, QA Lab e Package.
8. Se a validação falhar, corrija no branch de lançamento e reexecute o menor
   arquivo, linha, job de workflow, perfil de pacote, provedor ou allowlist de modelo com falha que
   prove a correção. Reexecute o guarda-chuva completo somente quando a superfície alterada tornar
   evidências anteriores obsoletas.
9. Para beta, crie a tag `vYYYY.M.D-beta.N` e então execute `OpenClaw Release Publish` a partir
   do branch `release/YYYY.M.D` correspondente. Ele verifica `pnpm plugins:sync:check`,
   despacha todos os pacotes de Plugin publicáveis para o npm e o mesmo conjunto para o
   ClawHub em paralelo, e então promove o artefato de preflight npm preparado do OpenClaw
   com a dist-tag correspondente assim que a publicação de plugins no npm for bem-sucedida.
   Depois que o filho de publicação npm do OpenClaw é bem-sucedido, ele cria ou atualiza a
   página de release/prerelease correspondente do GitHub a partir da seção completa correspondente de
   `CHANGELOG.md`. Lançamentos estáveis publicados no npm `latest` tornam-se o
   lançamento mais recente do GitHub; lançamentos de manutenção estáveis mantidos no npm `beta` são
   criados com GitHub `latest=false`.
   A publicação no ClawHub ainda pode estar em execução enquanto o npm do OpenClaw publica, mas o
   workflow de publicação de lançamento imprime os IDs de execução filhos imediatamente. Por padrão ele
   não espera pelo ClawHub depois de despachá-lo, então a disponibilidade npm do OpenClaw
   não é bloqueada por aprovações do ClawHub ou trabalho de registro mais lentos; defina
   `wait_for_clawhub=true` quando o ClawHub precisar bloquear a conclusão do workflow. O
   caminho do ClawHub tenta novamente falhas transitórias de instalação de dependências da CLI, publica
   plugins que passaram no preview mesmo quando uma célula de preview falha de forma intermitente, e termina com
   verificação do registro para cada versão esperada de Plugin, para que publicações parciais
   permaneçam visíveis e possam ser tentadas novamente. Após a publicação, execute
   a aceitação de pacote pós-publicação
   contra o pacote publicado `openclaw@YYYY.M.D-beta.N` ou
   `openclaw@beta`. Se um pré-lançamento enviado ou publicado precisar de correção,
   corte o próximo número de pré-lançamento correspondente; não exclua nem reescreva o
   pré-lançamento antigo.
10. Para estável, continue somente depois que o beta validado ou release candidate tiver as
    evidências de validação exigidas. A publicação npm estável também passa por
    `OpenClaw Release Publish`, reutilizando o artefato de preflight bem-sucedido via
    `preflight_run_id`; a prontidão do lançamento macOS estável também exige o
    `.zip`, `.dmg`, `.dSYM.zip` empacotados e o `appcast.xml` atualizado em `main`.
    O workflow privado de publicação do macOS publica o appcast assinado para o `main`
    público automaticamente depois que os ativos de lançamento são verificados; se a proteção de branch bloquear
    o push direto, ele abre ou atualiza um PR de appcast.
11. Após a publicação, execute o verificador npm pós-publicação, o E2E Telegram publicado-npm
    autônomo opcional quando você precisar de prova de canal pós-publicação,
    promoção de dist-tag quando necessário, verifique a página de lançamento gerada no GitHub
    e execute as etapas de anúncio de lançamento.

## Preflight de lançamento

- Execute `pnpm check:test-types` antes do preflight de lançamento para que o TypeScript de testes permaneça
  coberto fora da verificação local mais rápida de `pnpm check`
- Execute `pnpm check:architecture` antes do preflight de lançamento para que as verificações mais amplas de ciclos
  de importação e limites de arquitetura fiquem verdes fora da verificação local mais rápida
- Execute `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que os artefatos de lançamento
  esperados em `dist/*` e o pacote da Control UI existam para a etapa de validação do pacote
- Execute `pnpm release:prep` depois do bump da versão raiz e antes da criação da tag. Ele
  executa todos os geradores determinísticos de lançamento que costumam divergir após uma
  alteração de versão/configuração/API: versões de Plugin, inventário de Plugin, esquema de configuração
  base, metadados de configuração de canais incluídos, baseline de documentos de configuração, exportações do SDK
  de Plugin e baseline da API do SDK de Plugin. `pnpm release:check` reexecuta essas
  proteções em modo de verificação e relata todas as falhas de divergência gerada que encontra em uma
  única passagem antes de executar as verificações de lançamento de pacote.
- Execute o workflow manual `Full Release Validation` antes da aprovação do lançamento para
  iniciar todos os ambientes de teste de pré-lançamento a partir de um único ponto de entrada. Ele aceita uma branch,
  tag ou SHA completo de commit, dispara o `CI` manual e dispara
  `OpenClaw Release Checks` para smoke de instalação, aceitação de pacote, verificações de pacote
  entre sistemas operacionais, paridade do QA Lab, Matrix e lanes do Telegram. Execuções estáveis/padrão
  mantêm live/E2E exaustivos e soak do caminho de lançamento Docker atrás de
  `run_release_soak=true`; `release_profile=full` força o soak. Com
  `release_profile=full` e `rerun_group=all`, ele também executa E2E de pacote do Telegram
  contra o artefato `release-package-under-test` das verificações de lançamento.
  Forneça `release_package_spec` depois de publicar um beta para reutilizar o pacote npm
  enviado nas verificações de lançamento, Package Acceptance e E2E de pacote do Telegram
  sem reconstruir o tarball de lançamento. Forneça
  `npm_telegram_package_spec` apenas quando o Telegram precisar usar um pacote publicado
  diferente do restante da validação de lançamento. Forneça
  `package_acceptance_package_spec` quando o Package Acceptance precisar usar um
  pacote publicado diferente da especificação do pacote de lançamento. Forneça
  `evidence_package_spec` quando o relatório privado de evidências precisar comprovar que a
  validação corresponde a um pacote npm publicado sem forçar o E2E do Telegram.
  Exemplo:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Execute o workflow manual `Package Acceptance` quando quiser prova por canal paralelo
  para um candidato de pacote enquanto o trabalho de lançamento continua. Use `source=npm` para
  `openclaw@beta`, `openclaw@latest` ou uma versão exata de lançamento; `source=ref`
  para empacotar uma branch/tag/SHA confiável de `package_ref` com o harness atual de
  `workflow_ref`; `source=url` para um tarball HTTPS com SHA-256 obrigatório;
  ou `source=artifact` para um tarball enviado por outra execução do GitHub
  Actions. O workflow resolve o candidato para
  `package-under-test`, reutiliza o agendador de lançamento Docker E2E contra esse
  tarball e pode executar QA do Telegram contra o mesmo tarball com
  `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`. Quando as
  lanes Docker selecionadas incluem `published-upgrade-survivor`, o artefato de pacote
  é o candidato e `published_upgrade_survivor_baseline` seleciona
  o baseline publicado. `update-restart-auth` usa o pacote candidato como
  a CLI instalada e o package-under-test, para exercitar o caminho de
  reinicialização gerenciada do comando de atualização do candidato.
  Exemplo: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Perfis comuns:
  - `smoke`: lanes de instalação/canal/agente, rede do Gateway e recarregamento de configuração
  - `package`: lanes nativas de artefato para pacote/atualização/reinicialização/Plugin sem OpenWebUI ou ClawHub live
  - `product`: perfil de pacote mais canais MCP, limpeza de cron/subagente,
    pesquisa web da OpenAI e OpenWebUI
  - `full`: partes do caminho de lançamento Docker com OpenWebUI
  - `custom`: seleção exata de `docker_lanes` para uma reexecução focada
- Execute o workflow manual `CI` diretamente quando precisar apenas da cobertura completa
  normal de CI para o candidato de lançamento. Disparos manuais de CI ignoram o escopo
  por alterações e forçam os shards Linux Node, shards de plugins incluídos, contratos de canal,
  compatibilidade com Node 22, `check`, `check-additional`, smoke de build,
  verificações de docs, Skills Python, Windows, macOS, Android e lanes de i18n
  da Control UI.
  Exemplo: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Execute `pnpm qa:otel:smoke` ao validar a telemetria de lançamento. Ele exercita o
  QA-lab por meio de um receptor OTLP/HTTP local e verifica os nomes dos spans de trace
  exportados, atributos limitados e redação de conteúdo/identificadores sem
  exigir Opik, Langfuse ou outro coletor externo.
- Execute `pnpm release:check` antes de cada lançamento com tag
- Execute `OpenClaw Release Publish` para a sequência mutável de publicação depois que a
  tag existir. Dispare-o de `release/YYYY.M.D` (ou `main` ao publicar uma
  tag alcançável a partir de main), passe a tag de lançamento e o
  `preflight_run_id` npm do OpenClaw bem-sucedido, e mantenha o escopo padrão de publicação de plugins
  `all-publishable`, a menos que esteja executando deliberadamente um reparo focado. O
  workflow serializa a publicação npm de plugins, a publicação de plugins no ClawHub e a publicação npm
  do OpenClaw para que o pacote principal não seja publicado antes de seus
  plugins externalizados.
- As verificações de lançamento agora são executadas em um workflow manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` também executa a lane de paridade mock do QA Lab mais o perfil
  Matrix live rápido e a lane de QA do Telegram antes da aprovação do lançamento. As lanes live
  usam o ambiente `qa-live-shared`; o Telegram também usa leases de credenciais CI
  do Convex. Execute o workflow manual `QA-Lab - All Lanes` com
  `matrix_profile=all` e `matrix_shards=true` quando quiser o inventário completo de transporte,
  mídia e E2EE do Matrix em paralelo.
- A validação em tempo de execução de instalação e upgrade entre sistemas operacionais faz parte dos
  `OpenClaw Release Checks` e `Full Release Validation` públicos, que chamam o
  workflow reutilizável
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` diretamente
- Essa separação é intencional: manter o caminho real de lançamento npm curto,
  determinístico e focado em artefatos, enquanto verificações live mais lentas ficam em sua
  própria lane para não atrasarem nem bloquearem a publicação
- Verificações de lançamento que carregam segredos devem ser disparadas por meio de `Full Release
Validation` ou a partir da ref de workflow `main`/release para que a lógica do workflow e
  os segredos permaneçam controlados
- `OpenClaw Release Checks` aceita uma branch, tag ou SHA completo de commit, desde que
  o commit resolvido seja alcançável a partir de uma branch ou tag de lançamento do OpenClaw
- O preflight somente de validação de `OpenClaw NPM Release` também aceita o SHA completo
  atual de 40 caracteres do commit da branch do workflow sem exigir uma tag enviada
- Esse caminho por SHA é somente de validação e não pode ser promovido para uma publicação real
- No modo SHA, o workflow sintetiza `v<package.json version>` apenas para a
  verificação de metadados do pacote; a publicação real ainda exige uma tag de lançamento real
- Ambos os workflows mantêm o caminho real de publicação e promoção nos runners hospedados pelo GitHub,
  enquanto o caminho de validação não mutável pode usar os runners Linux maiores
  da Blacksmith
- Esse workflow executa
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando os segredos de workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- O preflight de lançamento npm não espera mais a lane separada de verificações de lançamento
- Execute `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou a tag beta/correção correspondente) antes da aprovação
- Depois da publicação npm, execute
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou a versão beta/correção correspondente) para verificar o caminho de instalação do registro
  publicado em um prefixo temporário novo
- Depois de uma publicação beta, execute `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  para verificar onboarding do pacote instalado, configuração do Telegram e E2E real do Telegram
  contra o pacote npm publicado usando o pool compartilhado de credenciais alugadas do Telegram.
  Execuções avulsas locais de maintainers podem omitir as variáveis do Convex e passar as três
  credenciais de ambiente `OPENCLAW_QA_TELEGRAM_*` diretamente.
- Para executar o smoke beta completo pós-publicação a partir da máquina de um maintainer, use `pnpm release:beta-smoke -- --beta betaN`. O helper executa a validação npm de atualização/alvo novo no Parallels, dispara `NPM Telegram Beta E2E`, consulta a execução exata do workflow, baixa o artefato e imprime o relatório do Telegram.
- Maintainers podem executar a mesma verificação pós-publicação a partir do GitHub Actions por meio do
  workflow manual `NPM Telegram Beta E2E`. Ele é intencionalmente apenas manual e
  não roda a cada merge.
- A automação de lançamento de maintainers agora usa preflight e depois promoção:
  - a publicação npm real deve passar um `preflight_run_id` npm bem-sucedido
  - a publicação npm real deve ser disparada a partir da mesma branch `main` ou
    `release/YYYY.M.D` da execução de preflight bem-sucedida
  - lançamentos npm estáveis usam `beta` por padrão
  - a publicação npm estável pode mirar explicitamente `latest` via entrada do workflow
  - a mutação de dist-tag npm baseada em token agora fica em
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    por segurança, porque `npm dist-tag add` ainda precisa de `NPM_TOKEN`, enquanto o
    repositório público mantém publicação somente por OIDC
  - o `macOS Release` público é somente de validação; quando uma tag existe apenas em uma
    branch de lançamento, mas o workflow é disparado a partir de `main`, defina
    `public_release_branch=release/YYYY.M.D`
  - a publicação mac privada real deve passar por `preflight_run_id` e
    `validate_run_id` mac privados bem-sucedidos
  - os caminhos reais de publicação promovem artefatos preparados em vez de reconstruí-los
    novamente
- Para lançamentos estáveis de correção como `YYYY.M.D-N`, o verificador pós-publicação
  também verifica o mesmo caminho de upgrade com prefixo temporário de `YYYY.M.D` para `YYYY.M.D-N`,
  para que correções de lançamento não possam deixar silenciosamente instalações globais antigas no
  payload estável base
- O preflight de lançamento npm falha fechado, a menos que o tarball inclua tanto
  `dist/control-ui/index.html` quanto um payload não vazio em `dist/control-ui/assets/`,
  para que não enviemos novamente um dashboard de navegador vazio
- A verificação pós-publicação também verifica se os entrypoints de plugins publicados e
  os metadados de pacote estão presentes no layout instalado do registro. Um lançamento que
  envie payloads ausentes de runtime de plugins falha no verificador pós-publicação e
  não pode ser promovido para `latest`.
- `pnpm test:install:smoke` também impõe o orçamento de `unpackedSize` do npm pack no
  tarball candidato de atualização, para que o e2e do instalador detecte aumento acidental do pacote
  antes do caminho de publicação de lançamento
- Se o trabalho de lançamento tocou planejamento de CI, manifestos de timing de extensões ou
  matrizes de testes de extensões, regenere e revise as saídas de matriz
  `plugin-prerelease-extension-shard` de propriedade do planejador em
  `.github/workflows/plugin-prerelease.yml` antes da aprovação, para que as notas de lançamento não
  descrevam um layout de CI desatualizado
- A prontidão para lançamento estável no macOS também inclui as superfícies do atualizador:
  - o lançamento do GitHub deve acabar com os pacotes `.zip`, `.dmg` e `.dSYM.zip`
  - `appcast.xml` em `main` deve apontar para o novo zip estável depois da publicação; o
    workflow privado de publicação macOS faz commit dele automaticamente ou abre um PR de appcast
    quando o push direto é bloqueado
  - o app empacotado deve manter um bundle id não debug, uma URL não vazia de feed
    Sparkle e um `CFBundleVersion` igual ou superior ao piso canônico de build do Sparkle
    para essa versão de lançamento

## Ambientes de teste de lançamento

`Full Release Validation` é como operadores iniciam todos os testes de pré-lançamento a partir de
um único ponto de entrada. Para prova de commit fixado em uma branch que se move rapidamente, use o
helper para que cada workflow filho rode a partir de uma branch temporária fixada no SHA alvo:

```bash
pnpm ci:full-release --sha <full-sha>
```

O auxiliar envia `release-ci/<sha>-...`, dispara `Full Release Validation`
a partir dessa ramificação com `ref=<sha>`, verifica se cada `headSha` de workflow filho
corresponde ao alvo e, em seguida, exclui a ramificação temporária. Isso evita comprovar por acidente uma execução filha de um `main`
mais novo.

Para validação de ramificação ou tag de release, execute-a a partir do ref de workflow
`main` confiável e passe a ramificação ou tag de release como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

O workflow resolve o ref alvo, dispara o `CI` manual com
`target_ref=<release-ref>`, dispara `OpenClaw Release Checks`, prepara um
artefato pai `release-package-under-test` para verificações voltadas a pacote e
dispara o E2E independente de pacote Telegram quando `release_profile=full` com
`rerun_group=all` ou quando `release_package_spec` ou
`npm_telegram_package_spec` está definido. Em seguida, `OpenClaw Release
Checks` se expande para smoke de instalação, verificações de release entre sistemas operacionais, cobertura live/E2E Docker de caminho de release quando soak está habilitado, Package Acceptance com QA de pacote Telegram, paridade do QA Lab, Matrix live e Telegram live. Uma execução completa só é aceitável quando o
resumo de `Full Release Validation`
mostra `normal_ci` e `release_checks` como bem-sucedidos. No modo full/all,
o filho `npm_telegram` também deve ser bem-sucedido; fora de full/all, ele é ignorado
a menos que um `release_package_spec` ou `npm_telegram_package_spec` publicado tenha sido
fornecido. O resumo final do
verificador inclui tabelas dos jobs mais lentos para cada execução filha, para que o gerente de release
possa ver o caminho crítico atual sem baixar logs.
Consulte [Validação completa de release](/pt-BR/reference/full-release-validation) para a
matriz completa de etapas, nomes exatos de jobs de workflow, diferenças entre os perfis stable e full,
artefatos e identificadores de reexecução focada.
Workflows filhos são disparados a partir do ref confiável que executa `Full Release
Validation`, normalmente `--ref main`, mesmo quando o `ref` alvo aponta para uma
ramificação ou tag de release mais antiga. Não há uma entrada separada de ref de workflow para Full Release Validation; escolha o harness confiável escolhendo o ref da execução do workflow.
Não use `--ref main -f ref=<sha>` para prova de commit exato em um `main` em movimento;
SHAs brutos de commit não podem ser refs de dispatch de workflow, então use
`pnpm ci:full-release --sha <sha>` para criar a ramificação temporária fixada.

Use `release_profile` para selecionar a amplitude live/provedor:

- `minimum`: caminho OpenAI/core live e Docker crítico de release mais rápido
- `stable`: minimum mais cobertura estável de provedor/backend para aprovação de release
- `full`: stable mais cobertura ampla consultiva de provedor/mídia

Use `run_release_soak=true` com `stable` quando as lanes bloqueadoras de release estiverem
verdes e você quiser a varredura exaustiva live/E2E, caminho de release Docker e
sobrevivente de upgrade publicado limitada antes da promoção. Essa varredura cobre
os quatro pacotes estáveis mais recentes, além dos baselines fixados `2026.4.23` e `2026.5.2`
e cobertura mais antiga `2026.4.15`, com baselines duplicados removidos e
cada baseline fragmentado em seu próprio job executor Docker. `full` implica
`run_release_soak=true`.

`OpenClaw Release Checks` usa o ref confiável do workflow para resolver o ref alvo
uma vez como `release-package-under-test` e reutiliza esse artefato em verificações entre sistemas operacionais,
Package Acceptance e verificações Docker de caminho de release quando soak é executado. Isso mantém
todas as caixas voltadas a pacote nos mesmos bytes e evita builds de pacote repetidos.
Depois que um beta já estiver no npm, defina `release_package_spec=openclaw@YYYY.M.D-beta.N`
para que as verificações de release baixem o pacote enviado uma vez, extraiam o SHA de origem do build
de `dist/build-info.json` e reutilizem esse artefato para lanes entre sistemas operacionais,
Package Acceptance, Docker de caminho de release e Telegram de pacote.
O smoke de instalação OpenAI entre sistemas operacionais usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando a
variável do repo/org está definida; caso contrário, usa `openai/gpt-5.4`, porque esta lane está
comprovando instalação de pacote, onboarding, inicialização do Gateway e um turno de agente live,
em vez de aferir o modelo padrão mais lento. A matriz live mais ampla de provedores
continua sendo o lugar para cobertura específica de modelo.

Use estas variantes dependendo da etapa da release:

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
ou lane de QA que falhou para a próxima prova. Execute o guarda-chuva completo novamente somente quando
a correção tiver alterado a orquestração compartilhada de release ou tornado obsoleta a evidência anterior de todas as caixas.
O verificador final do guarda-chuva revalida os ids registrados de execução dos workflows filhos,
então, depois que um workflow filho for reexecutado com sucesso, reexecute apenas o job pai
`Verify full validation` que falhou.

Para recuperação limitada, passe `rerun_group` ao guarda-chuva. `all` é a execução real
da candidata a release, `ci` executa apenas o filho de CI normal, `plugin-prerelease`
executa apenas o filho de Plugin exclusivo de release, `release-checks` executa todas as caixas de release,
e os grupos de release mais estreitos são `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` e `npm-telegram`.
Reexecuções focadas de `npm-telegram` exigem `release_package_spec` ou
`npm_telegram_package_spec`; execuções full/all com `release_profile=full` usam o
artefato de pacote de release-checks. Reexecuções focadas
entre sistemas operacionais podem adicionar `cross_os_suite_filter=windows/packaged-upgrade` ou
outro filtro de sistema operacional/suíte. Falhas de QA em release-checks são consultivas; uma falha apenas de QA
não bloqueia a validação de release.

### Vitest

A caixa Vitest é o workflow filho `CI` manual. O CI manual ignora
intencionalmente o escopo por alterações e força o grafo de testes normal da candidata a release:
shards Linux Node, shards de Plugin empacotado, contratos de canal, compatibilidade Node 22,
`check`, `check-additional`, smoke de build, verificações de docs, Skills
Python, Windows, macOS, Android e i18n da Control UI.

Use esta caixa para responder "a árvore de origem passou na suíte de testes normal completa?"
Ela não é o mesmo que validação de produto de caminho de release. Evidências a manter:

- resumo de `Full Release Validation` mostrando a URL da execução `CI` disparada
- execução `CI` verde no SHA alvo exato
- nomes de shards lentos ou com falha dos jobs de CI ao investigar regressões
- artefatos de temporização do Vitest, como `.artifacts/vitest-shard-timings.json`, quando
  uma execução precisa de análise de desempenho

Execute o CI manual diretamente apenas quando a release precisar de CI normal determinístico, mas
não das caixas Docker, QA Lab, live, entre sistemas operacionais ou de pacote:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

A caixa Docker vive em `OpenClaw Release Checks` por meio de
`openclaw-live-and-e2e-checks-reusable.yml`, além do workflow
`install-smoke` em modo release. Ela valida a candidata a release por meio de ambientes
Docker empacotados, em vez de apenas testes no nível do código-fonte.

A cobertura Docker de release inclui:

- smoke de instalação completo com o smoke lento de instalação global Bun habilitado
- preparação/reutilização da imagem de smoke do Dockerfile raiz por SHA alvo, com jobs de QR,
  root/gateway e installer/Bun smoke executando como shards install-smoke separados
- lanes E2E do repositório
- chunks Docker de caminho de release: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` e `plugins-runtime-install-h`
- cobertura OpenWebUI dentro do chunk `plugins-runtime-services` quando solicitada
- lanes divididas de instalação/desinstalação de Plugins empacotados
  `bundled-plugin-install-uninstall-0` até
  `bundled-plugin-install-uninstall-23`
- suítes live/E2E de provedores e cobertura de modelo live Docker quando as verificações de release
  incluem suítes live

Use artefatos Docker antes de reexecutar. O agendador de caminho de release envia
`.artifacts/docker-tests/` com logs de lanes, `summary.json`, `failures.json`,
temporizações de fases, JSON do plano do agendador e comandos de reexecução. Para recuperação focada,
use `docker_lanes=<lane[,lane]>` no workflow reutilizável live/E2E em vez de
reexecutar todos os chunks de release. Comandos de reexecução gerados incluem
`package_artifact_run_id` anterior e entradas de imagem Docker preparadas quando disponíveis, para que uma
lane com falha possa reutilizar o mesmo tarball e imagens GHCR.

### QA Lab

A caixa QA Lab também faz parte de `OpenClaw Release Checks`. Ela é o gate de release
de comportamento agêntico e nível de canal, separado da mecânica de pacote do Vitest e do Docker.

A cobertura QA Lab de release inclui:

- lane de paridade mock comparando a lane candidata OpenAI com o baseline Opus 4.6
  usando o pacote de paridade agêntica
- perfil rápido de QA Matrix live usando o ambiente `qa-live-shared`
- lane QA Telegram live usando leases de credenciais CI Convex
- `pnpm qa:otel:smoke` quando a telemetria de release precisa de prova local explícita

Use esta caixa para responder "a release se comporta corretamente em cenários de QA e
fluxos de canal live?" Mantenha as URLs de artefatos para as lanes de paridade, Matrix e Telegram
ao aprovar a release. A cobertura completa Matrix continua disponível como uma execução QA-Lab
manual fragmentada, em vez da lane padrão crítica para release.

### Pacote

A caixa Pacote é o gate do produto instalável. Ela é apoiada por
`Package Acceptance` e pelo resolvedor
`scripts/resolve-openclaw-package-candidate.mjs`. O resolvedor normaliza uma
candidata no tarball `package-under-test` consumido pelo Docker E2E, valida
o inventário do pacote, registra a versão do pacote e o SHA-256 e mantém o
ref do harness do workflow separado do ref de origem do pacote.

Fontes de candidata compatíveis:

- `source=npm`: `openclaw@beta`, `openclaw@latest` ou uma versão exata de release do OpenClaw
- `source=ref`: empacotar uma ramificação, tag ou SHA de commit completo `package_ref` confiável
  com o harness `workflow_ref` selecionado
- `source=url`: baixar um `.tgz` HTTPS com `package_sha256` obrigatório
- `source=artifact`: reutilizar um `.tgz` enviado por outra execução do GitHub Actions

`OpenClaw Release Checks` executa Package Acceptance com `source=artifact`, o
artefato de pacote de release preparado, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance mantém migração, atualização,
reinicialização com autenticação configurada após atualização, instalação live de Skill do ClawHub, limpeza de dependências obsoletas de Plugins, fixtures de Plugin offline, atualização de Plugin e QA de pacote Telegram contra o mesmo tarball
resolvido. Verificações de release bloqueadoras usam o baseline padrão do pacote publicado mais recente;
`run_release_soak=true` ou
`release_profile=full` expande para todos os baselines estáveis publicados no npm de
`2026.4.23` até `latest`, além de fixtures de problemas relatados. Use
Package Acceptance com `source=npm` para uma candidata já enviada, ou
`source=ref`/`source=artifact` para um tarball npm local respaldado por SHA antes da
publicação. Ela é a substituição nativa do GitHub
para a maior parte da cobertura de pacote/atualização que antes exigia
Parallels. Verificações de release entre sistemas operacionais ainda importam para onboarding,
instalador e comportamento específicos de sistema operacional, mas a validação de produto de pacote/atualização deve
preferir Package Acceptance.

A lista de verificação canônica para validação de atualização e plugin é
[Testando atualizações e plugins](/pt-BR/help/testing-updates-plugins). Use-a ao
decidir qual trilha local, Docker, Package Acceptance ou de verificação de
release comprova uma instalação/atualização de plugin, limpeza do doctor ou
alteração de migração de pacote publicado. A migração exaustiva de atualização
publicada a partir de todo pacote estável `2026.4.23+` é um fluxo de trabalho
manual `Update Migration` separado, não parte da CI de Release Completo.

A tolerância legada de aceitação de pacotes é intencionalmente limitada no tempo.
Pacotes até `2026.4.25` podem usar o caminho de compatibilidade para lacunas de
metadados já publicadas no npm: entradas privadas de inventário de QA ausentes
do tarball, `gateway install --wrapper` ausente, arquivos de patch ausentes no
fixture git derivado do tarball, `update.channel` persistido ausente, locais
legados de registros de instalação de plugin, persistência ausente de registros
de instalação do marketplace e migração de metadados de configuração durante
`plugins update`. O pacote `2026.4.26` publicado pode emitir avisos para arquivos
locais de marcação de metadados de build que já foram enviados. Pacotes
posteriores devem satisfazer os contratos modernos de pacote; essas mesmas
lacunas falham na validação de release.

Use perfis mais amplos do Package Acceptance quando a pergunta de release for
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

- `smoke`: trilhas rápidas de instalação/canal/agente de pacote, rede do
  Gateway e recarregamento de configuração
- `package`: contratos de instalação/atualização/reinício/pacote de plugin, além
  de comprovação ao vivo de instalação de Skills do ClawHub; este é o padrão de
  verificação de release
- `product`: `package` mais canais MCP, limpeza de cron/subagente, busca web da
  OpenAI e OpenWebUI
- `full`: partes do caminho de release do Docker com OpenWebUI
- `custom`: lista exata de `docker_lanes` para reexecuções focadas

Para comprovação do Telegram em pacote candidato, habilite
`telegram_mode=mock-openai` ou `telegram_mode=live-frontier` no Package
Acceptance. O fluxo de trabalho passa o tarball `package-under-test` resolvido
para a trilha do Telegram; o fluxo de trabalho independente do Telegram ainda
aceita uma especificação npm publicada para verificações pós-publicação.

## Automação de publicação de release

`OpenClaw Release Publish` é o ponto de entrada normal para publicação mutável.
Ele orquestra os fluxos de trabalho de publicador confiável na ordem que o
release exige:

1. Fazer checkout da tag de release e resolver seu SHA de commit.
2. Verificar se a tag é alcançável a partir de `main` ou `release/*`.
3. Executar `pnpm plugins:sync:check`.
4. Disparar `Plugin NPM Release` com `publish_scope=all-publishable` e
   `ref=<release-sha>`.
5. Disparar `Plugin ClawHub Release` com o mesmo escopo e SHA.
6. Disparar `OpenClaw NPM Release` com a tag de release, a dist-tag do npm e o
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

Use os fluxos de trabalho de nível inferior `Plugin NPM Release` e
`Plugin ClawHub Release` apenas para trabalho focado de reparo ou republicação.
Para um reparo de plugin selecionado, passe `plugin_publish_scope=selected` e
`plugins=@openclaw/name` para `OpenClaw Release Publish`, ou dispare o fluxo de
trabalho filho diretamente quando o pacote OpenClaw não deve ser publicado.

## Entradas do fluxo de trabalho NPM

`OpenClaw NPM Release` aceita estas entradas controladas pelo operador:

- `tag`: tag de release obrigatória, como `v2026.4.2`, `v2026.4.2-1` ou
  `v2026.4.2-beta.1`; quando `preflight_only=true`, ela também pode ser o SHA de
  commit completo de 40 caracteres do branch atual do fluxo de trabalho para
  preflight somente de validação
- `preflight_only`: `true` apenas para validação/build/pacote, `false` para o
  caminho de publicação real
- `preflight_run_id`: obrigatório no caminho de publicação real para que o fluxo
  de trabalho reutilize o tarball preparado da execução de preflight bem-sucedida
- `npm_dist_tag`: tag de destino npm para o caminho de publicação; o padrão é
  `beta`

`OpenClaw Release Publish` aceita estas entradas controladas pelo operador:

- `tag`: tag de release obrigatória; já deve existir
- `preflight_run_id`: id da execução de preflight bem-sucedida de
  `OpenClaw NPM Release`; obrigatório quando `publish_openclaw_npm=true`
- `npm_dist_tag`: tag de destino npm para o pacote OpenClaw
- `plugin_publish_scope`: padrão `all-publishable`; use `selected` somente para
  trabalho focado de reparo
- `plugins`: nomes de pacote `@openclaw/*` separados por vírgulas quando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: padrão `true`; defina como `false` somente ao usar o
  fluxo de trabalho como orquestrador de reparo apenas para plugins

`OpenClaw Release Checks` aceita estas entradas controladas pelo operador:

- `ref`: branch, tag ou SHA de commit completo a validar. Verificações que
  carregam segredos exigem que o commit resolvido seja alcançável a partir de um
  branch ou tag de release do OpenClaw.
- `run_release_soak`: opta por soak exaustivo ao vivo/E2E, caminho de release
  do Docker e sobrevivente de upgrade desde todas as versões em verificações de
  release estável/padrão. Ele é forçado por `release_profile=full`.

Regras:

- Tags estáveis e de correção podem publicar para `beta` ou `latest`
- Tags de pré-release beta podem publicar somente para `beta`
- Para `OpenClaw NPM Release`, entrada de SHA de commit completo só é permitida
  quando `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` são sempre somente de
  validação
- O caminho de publicação real deve usar o mesmo `npm_dist_tag` usado durante o
  preflight; o fluxo de trabalho verifica esses metadados antes de continuar a
  publicação

## Sequência de release npm estável

Ao criar um release npm estável:

1. Execute `OpenClaw NPM Release` com `preflight_only=true`
   - Antes de existir uma tag, você pode usar o SHA de commit completo do branch
     atual do fluxo de trabalho para uma execução simulada somente de validação
     do fluxo de trabalho de preflight
2. Escolha `npm_dist_tag=beta` para o fluxo normal beta primeiro, ou `latest`
   somente quando quiser intencionalmente uma publicação estável direta
3. Execute `Full Release Validation` no branch de release, tag de release ou SHA
   de commit completo quando quiser CI normal mais cache de prompt ao vivo,
   Docker, QA Lab, Matrix e cobertura do Telegram a partir de um fluxo de
   trabalho manual
4. Se você intencionalmente precisa apenas do grafo de testes normal
   determinístico, execute o fluxo de trabalho manual `CI` na ref de release
5. Salve o `preflight_run_id` bem-sucedido
6. Execute `OpenClaw Release Publish` com a mesma `tag`, o mesmo `npm_dist_tag` e
   o `preflight_run_id` salvo; ele publica plugins externalizados no npm e no
   ClawHub antes de promover o pacote npm do OpenClaw
7. Se o release caiu em `beta`, use o fluxo de trabalho privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` para
   promover essa versão estável de `beta` para `latest`
8. Se o release foi publicado intencionalmente direto em `latest` e `beta` deve
   seguir a mesma build estável imediatamente, use esse mesmo fluxo de trabalho
   privado para apontar ambas as dist-tags para a versão estável, ou deixe a
   sincronização agendada de autorreparo mover `beta` mais tarde

A mutação da dist-tag vive no repositório privado por segurança porque ela ainda
exige `NPM_TOKEN`, enquanto o repositório público mantém publicação somente com
OIDC.

Isso mantém tanto o caminho de publicação direta quanto o caminho de promoção
beta primeiro documentados e visíveis ao operador.

Se um mantenedor precisar recorrer à autenticação npm local, execute quaisquer
comandos da CLI do 1Password (`op`) apenas dentro de uma sessão tmux dedicada.
Não chame `op` diretamente a partir do shell principal do agente; mantê-lo dentro
do tmux torna prompts, alertas e tratamento de OTP observáveis e evita alertas
repetidos do host.

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
