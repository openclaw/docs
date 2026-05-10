---
read_when:
    - Procurando definições de canais de lançamento públicos
    - Executando a validação de lançamento ou a aceitação de pacote
    - Buscando nomenclatura de versões e cadência
summary: Faixas de lançamento, checklist do operador, caixas de validação, nomenclatura de versões e cadência
title: Política de lançamento
x-i18n:
    generated_at: "2026-05-10T19:49:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ac11cfd0b5b1ebcc2fc010463c60e257a7e51802116b4b86d38d3a0da8a1dab
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw tem três canais públicos de lançamento:

- stable: lançamentos marcados por tag que publicam no npm `beta` por padrão, ou no npm `latest` quando solicitado explicitamente
- beta: tags de pré-lançamento que publicam no npm `beta`
- dev: a ponta móvel de `main`

## Nomenclatura de versões

- Versão de lançamento stable: `YYYY.M.D`
  - Tag do Git: `vYYYY.M.D`
- Versão de lançamento de correção stable: `YYYY.M.D-N`
  - Tag do Git: `vYYYY.M.D-N`
- Versão de pré-lançamento beta: `YYYY.M.D-beta.N`
  - Tag do Git: `vYYYY.M.D-beta.N`
- Não preencha mês ou dia com zero à esquerda
- `latest` significa o lançamento stable atual promovido no npm
- `beta` significa o destino atual de instalação beta
- Lançamentos stable e lançamentos de correção stable publicam no npm `beta` por padrão; operadores de lançamento podem direcionar para `latest` explicitamente, ou promover uma compilação beta validada depois
- Cada lançamento stable do OpenClaw entrega o pacote npm e o app para macOS juntos;
  lançamentos beta normalmente validam e publicam primeiro o caminho npm/pacote, com
  compilação/assinatura/notarização do app para Mac reservadas para stable, a menos que solicitadas explicitamente

## Cadência de lançamentos

- Lançamentos seguem primeiro pelo beta
- Stable vem somente depois que o beta mais recente é validado
- Mantenedores normalmente criam lançamentos a partir de uma branch `release/YYYY.M.D` criada
  a partir do `main` atual, para que a validação e as correções do lançamento não bloqueiem novos
  desenvolvimentos em `main`
- Se uma tag beta tiver sido enviada ou publicada e precisar de uma correção, os mantenedores criam
  a próxima tag `-beta.N` em vez de excluir ou recriar a tag beta antiga
- Procedimento detalhado de lançamento, aprovações, credenciais e notas de recuperação são
  exclusivos dos mantenedores

## Checklist do operador de lançamento

Este checklist é o formato público do fluxo de lançamento. Credenciais privadas,
assinatura, notarização, recuperação de dist-tag e detalhes de rollback de emergência ficam no
runbook de lançamento exclusivo dos mantenedores.

1. Comece a partir do `main` atual: baixe as alterações mais recentes, confirme que o commit de destino foi enviado,
   e confirme que o CI atual de `main` está suficientemente verde para criar uma branch a partir dele.
2. Reescreva a seção superior de `CHANGELOG.md` a partir do histórico real de commits com
   `/changelog`, mantenha as entradas voltadas ao usuário, faça commit, envie, e faça rebase/pull
   mais uma vez antes de criar a branch.
3. Revise os registros de compatibilidade de lançamento em
   `src/plugins/compat/registry.ts` e
   `src/commands/doctor/shared/deprecation-compat.ts`. Remova compatibilidade expirada
   somente quando o caminho de atualização continuar coberto, ou registre por que ela está sendo
   mantida intencionalmente.
4. Crie `release/YYYY.M.D` a partir do `main` atual; não faça o trabalho normal de lançamento
   diretamente em `main`.
5. Atualize cada local de versão necessário para a tag pretendida, depois execute
   `pnpm release:prep`. Ele atualiza versões de plugins, inventário de plugins, esquema de configuração,
   metadados de configuração de canais incluídos, baseline de documentação de configuração, exportações do SDK de plugins,
   e baseline da API do SDK de plugins na ordem correta. Faça commit de qualquer desvio gerado
   antes de marcar a tag. Depois execute a pré-verificação determinística local:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, e `pnpm release:check`.
6. Execute `OpenClaw NPM Release` com `preflight_only=true`. Antes de existir uma tag,
   um SHA completo de 40 caracteres da branch de lançamento é permitido para pré-verificação
   somente de validação. Salve o `preflight_run_id` bem-sucedido.
7. Inicie todos os testes de pré-lançamento com `Full Release Validation` para a
   branch de lançamento, tag, ou SHA completo do commit. Este é o único ponto de entrada manual
   para as quatro grandes caixas de teste de lançamento: Vitest, Docker, QA Lab e Package.
8. Se a validação falhar, corrija na branch de lançamento e execute novamente o menor
   arquivo, canal, job de workflow, perfil de pacote, provedor ou allowlist de modelo que
   comprove a correção. Execute novamente o guarda-chuva completo somente quando a superfície alterada tornar
   as evidências anteriores obsoletas.
9. Para beta, marque `vYYYY.M.D-beta.N`, depois execute `OpenClaw Release Publish` a partir
   da branch `release/YYYY.M.D` correspondente. Ele verifica `pnpm plugins:sync:check`,
   despacha todos os pacotes de plugins publicáveis para o npm e o mesmo conjunto para
   ClawHub em paralelo, e então promove o artefato de pré-verificação npm preparado do OpenClaw
   com a dist-tag correspondente assim que a publicação dos plugins no npm é bem-sucedida.
   Depois que o filho de publicação npm do OpenClaw é bem-sucedido, ele cria ou atualiza a
   página correspondente de release/pré-release do GitHub a partir da seção completa correspondente de
   `CHANGELOG.md`. Lançamentos stable publicados no npm `latest` se tornam o
   release mais recente do GitHub; lançamentos de manutenção stable mantidos no npm `beta` são
   criados com `latest=false` no GitHub.
   A publicação no ClawHub ainda pode estar em execução enquanto o OpenClaw publica no npm, mas o
   workflow de publicação do lançamento imprime os IDs das execuções filhas imediatamente. Por padrão, ele
   não espera pelo ClawHub após despachá-lo, então a disponibilidade do OpenClaw no npm
   não é bloqueada por aprovações ou trabalho de registro mais lentos do ClawHub; defina
   `wait_for_clawhub=true` quando o ClawHub precisar bloquear a conclusão do workflow. O
   caminho do ClawHub tenta novamente falhas transitórias de instalação de dependências da CLI, publica
   plugins aprovados na prévia mesmo quando uma célula de prévia falha de forma instável, e termina com
   verificação do registro para cada versão esperada de plugin, para que publicações parciais
   permaneçam visíveis e possam ser repetidas. Após publicar, execute
   a aceitação de pacote pós-publicação
   contra o pacote publicado `openclaw@YYYY.M.D-beta.N` ou
   `openclaw@beta`. Se um pré-lançamento enviado ou publicado precisar de correção,
   crie o próximo número de pré-lançamento correspondente; não exclua nem reescreva o
   pré-lançamento antigo.
10. Para stable, prossiga somente depois que o beta validado ou release candidate tiver as
    evidências de validação exigidas. A publicação stable no npm também passa por
    `OpenClaw Release Publish`, reutilizando o artefato de pré-verificação bem-sucedido via
    `preflight_run_id`; a prontidão do lançamento stable para macOS também exige o
    `.zip`, `.dmg`, `.dSYM.zip` empacotados e o `appcast.xml` atualizado em `main`.
    O workflow privado de publicação para macOS publica o appcast assinado para o `main`
    público automaticamente após os ativos de lançamento serem verificados; se a proteção da branch bloquear
    o push direto, ele abre ou atualiza um PR de appcast.
11. Após publicar, execute o verificador npm pós-publicação, o E2E standalone opcional do Telegram
    via npm publicado quando você precisar de comprovação de canal pós-publicação,
    promoção de dist-tag quando necessário, verifique a página de release gerada do GitHub,
    e execute as etapas de anúncio do lançamento.

## Pré-verificação do lançamento

- Execute `pnpm check:test-types` antes da pré-validação de lançamento para que o
  TypeScript de teste permaneça coberto fora da porta local mais rápida de `pnpm check`
- Execute `pnpm check:architecture` antes da pré-validação de lançamento para que as
  verificações mais amplas de ciclo de importação e limites de arquitetura fiquem
  verdes fora da porta local mais rápida
- Execute `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que os
  artefatos de lançamento esperados em `dist/*` e o bundle da UI de Controle existam
  para a etapa de validação do pacote
- Execute `pnpm release:prep` depois do aumento da versão raiz e antes de criar a tag.
  Ele executa todos os geradores determinísticos de lançamento que normalmente divergem
  após uma alteração de versão/configuração/API: versões dos plugins, inventário de
  plugins, esquema de configuração base, metadados de configuração de canal empacotado,
  baseline da documentação de configuração, exportações do SDK de plugin e baseline da
  API do SDK de plugin. `pnpm release:check` reexecuta essas proteções em modo de
  verificação e informa, em uma única passagem, todas as falhas de divergência geradas
  que encontrar antes de executar as verificações de lançamento do pacote.
- Execute o workflow manual `Full Release Validation` antes da aprovação de lançamento
  para iniciar todas as caixas de teste pré-lançamento a partir de um único ponto de
  entrada. Ele aceita um branch, uma tag ou um SHA completo de commit, dispara o
  `CI` manual e dispara `OpenClaw Release Checks` para fumaça de instalação, aceitação
  de pacote, verificações de pacote entre sistemas operacionais, paridade do QA Lab,
  Matrix e faixas do Telegram. Execuções estáveis/padrão mantêm live/E2E exaustivo e
  soak do caminho de lançamento do Docker atrás de `run_release_soak=true`;
  `release_profile=full` força o soak. Com `release_profile=full` e
  `rerun_group=all`, ele também executa E2E de pacote do Telegram contra o artefato
  `release-package-under-test` das verificações de lançamento. Forneça
  `npm_telegram_package_spec` depois da publicação quando o mesmo E2E do Telegram
  também deve provar o pacote npm publicado. Forneça
  `package_acceptance_package_spec` depois da publicação quando Package Acceptance
  deve executar sua matriz de pacote/atualização contra o pacote npm enviado, em vez
  do artefato construído a partir do SHA. Forneça
  `evidence_package_spec` quando o relatório privado de evidências deve provar que a
  validação corresponde a um pacote npm publicado sem forçar E2E do Telegram.
  Exemplo:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Execute o workflow manual `Package Acceptance` quando quiser uma prova por canal
  lateral para um candidato de pacote enquanto o trabalho de lançamento continua. Use
  `source=npm` para `openclaw@beta`, `openclaw@latest` ou uma versão exata de
  lançamento; `source=ref` para empacotar um branch/tag/SHA confiável em `package_ref`
  com o harness `workflow_ref` atual; `source=url` para um tarball HTTPS com SHA-256
  obrigatório; ou `source=artifact` para um tarball enviado por outra execução do
  GitHub Actions. O workflow resolve o candidato para `package-under-test`, reutiliza
  o agendador de lançamento E2E do Docker contra esse tarball e pode executar QA do
  Telegram contra o mesmo tarball com `telegram_mode=mock-openai` ou
  `telegram_mode=live-frontier`. Quando as faixas selecionadas do Docker incluem
  `published-upgrade-survivor`, o artefato de pacote é o candidato e
  `published_upgrade_survivor_baseline` seleciona o baseline publicado.
  `update-restart-auth` usa o pacote candidato tanto como a CLI instalada quanto como
  package-under-test, para exercitar o caminho de reinício gerenciado do comando de
  atualização do candidato.
  Exemplo: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Perfis comuns:
  - `smoke`: faixas de instalação/canal/agente, rede do Gateway e recarregamento de configuração
  - `package`: faixas nativas de artefato para pacote/atualização/reinício/plugin sem OpenWebUI nem ClawHub live
  - `product`: perfil de pacote mais canais MCP, limpeza de cron/subagente,
    pesquisa na web da OpenAI e OpenWebUI
  - `full`: blocos do caminho de lançamento do Docker com OpenWebUI
  - `custom`: seleção exata de `docker_lanes` para uma reexecução focada
- Execute o workflow manual `CI` diretamente quando você só precisar de cobertura
  completa do CI normal para o candidato de lançamento. Disparos manuais de CI
  ignoram o escopo por alterações e forçam as faixas de Linux Node, shards de plugins
  empacotados, contratos de canal, compatibilidade com Node 22, `check`,
  `check-additional`, fumaça de build, verificações de docs, Skills Python, Windows,
  macOS, Android e i18n da UI de Controle.
  Exemplo: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Execute `pnpm qa:otel:smoke` ao validar telemetria de lançamento. Ele exercita o
  QA-lab por meio de um receptor OTLP/HTTP local e verifica os nomes dos spans de
  trace exportados, atributos limitados e redação de conteúdo/identificador sem exigir
  Opik, Langfuse ou outro coletor externo.
- Execute `pnpm release:check` antes de todo lançamento com tag
- Execute `OpenClaw Release Publish` para a sequência mutante de publicação depois que
  a tag existir. Dispare-o a partir de `release/YYYY.M.D` (ou `main` ao publicar uma
  tag alcançável por main), passe a tag de lançamento e o `preflight_run_id` bem-sucedido
  do npm do OpenClaw, e mantenha o escopo padrão de publicação de plugin
  `all-publishable`, a menos que você esteja deliberadamente executando um reparo
  focado. O workflow serializa a publicação npm de plugins, a publicação de plugins no
  ClawHub e a publicação npm do OpenClaw para que o pacote core não seja publicado
  antes de seus plugins externalizados.
- As verificações de lançamento agora rodam em um workflow manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` também executa a faixa de paridade mock do QA Lab, além do
  perfil rápido live da Matrix e da faixa de QA do Telegram antes da aprovação de
  lançamento. As faixas live usam o ambiente `qa-live-shared`; o Telegram também usa
  concessões de credenciais de CI do Convex. Execute o workflow manual
  `QA-Lab - All Lanes` com `matrix_profile=all` e `matrix_shards=true` quando quiser
  inventário completo de transporte, mídia e E2EE da Matrix em paralelo.
- A validação de runtime de instalação e atualização entre sistemas operacionais faz
  parte dos workflows públicos `OpenClaw Release Checks` e `Full Release Validation`,
  que chamam diretamente o workflow reutilizável
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Essa divisão é intencional: mantenha o caminho real de lançamento npm curto,
  determinístico e focado em artefatos, enquanto verificações live mais lentas ficam
  em sua própria faixa para não atrasar nem bloquear a publicação
- Verificações de lançamento que carregam segredos devem ser disparadas por
  `Full Release Validation` ou a partir da ref de workflow `main`/release para que a
  lógica do workflow e os segredos permaneçam controlados
- `OpenClaw Release Checks` aceita um branch, uma tag ou um SHA completo de commit,
  desde que o commit resolvido seja alcançável a partir de um branch ou tag de
  lançamento do OpenClaw
- A pré-validação somente de validação de `OpenClaw NPM Release` também aceita o SHA
  completo atual de 40 caracteres do commit do branch do workflow sem exigir uma tag
  enviada
- Esse caminho por SHA é somente de validação e não pode ser promovido para uma
  publicação real
- No modo SHA, o workflow sintetiza `v<package.json version>` apenas para a verificação
  dos metadados do pacote; a publicação real ainda exige uma tag real de lançamento
- Ambos os workflows mantêm o caminho real de publicação e promoção em runners
  hospedados pelo GitHub, enquanto o caminho de validação não mutante pode usar os
  runners Linux maiores do Blacksmith
- Esse workflow executa
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando os segredos de workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- A pré-validação de lançamento npm não aguarda mais a faixa separada de verificações
  de lançamento
- Execute `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou a tag beta/correção correspondente) antes da aprovação
- Depois da publicação npm, execute
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou a versão beta/correção correspondente) para verificar o caminho de instalação
  do registro publicado em um prefixo temporário novo
- Depois de uma publicação beta, execute `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  para verificar onboarding do pacote instalado, configuração do Telegram e E2E real
  do Telegram contra o pacote npm publicado usando o pool compartilhado de credenciais
  alugadas do Telegram. Execuções pontuais locais de mantenedores podem omitir as vars
  do Convex e passar diretamente as três credenciais de ambiente
  `OPENCLAW_QA_TELEGRAM_*`.
- Para executar a fumaça beta completa pós-publicação a partir de uma máquina de
  mantenedor, use `pnpm release:beta-smoke -- --beta betaN`. O auxiliar executa a
  validação de atualização npm/fresh-target do Parallels, dispara
  `NPM Telegram Beta E2E`, faz polling da execução exata do workflow, baixa o artefato
  e imprime o relatório do Telegram.
- Mantenedores podem executar a mesma verificação pós-publicação pelo GitHub Actions
  por meio do workflow manual `NPM Telegram Beta E2E`. Ele é intencionalmente apenas
  manual e não roda em todo merge.
- A automação de lançamento de mantenedores agora usa pré-validação seguida de promoção:
  - a publicação npm real deve passar um `preflight_run_id` npm bem-sucedido
  - a publicação npm real deve ser disparada a partir do mesmo branch `main` ou
    `release/YYYY.M.D` da execução de pré-validação bem-sucedida
  - lançamentos npm estáveis usam `beta` por padrão
  - a publicação npm estável pode direcionar para `latest` explicitamente pela entrada do workflow
  - a mutação de dist-tag npm baseada em token agora fica em
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    por segurança, porque `npm dist-tag add` ainda precisa de `NPM_TOKEN`, enquanto o
    repositório público mantém publicação apenas com OIDC
  - `macOS Release` público é somente validação; quando uma tag existe apenas em um
    branch de lançamento, mas o workflow é disparado a partir de `main`, defina
    `public_release_branch=release/YYYY.M.D`
  - a publicação mac privada real deve passar em `preflight_run_id` e `validate_run_id`
    mac privados bem-sucedidos
  - os caminhos reais de publicação promovem artefatos preparados em vez de reconstruí-los
- Para lançamentos estáveis de correção como `YYYY.M.D-N`, o verificador pós-publicação
  também verifica o mesmo caminho de atualização com prefixo temporário de `YYYY.M.D`
  para `YYYY.M.D-N`, para que correções de lançamento não deixem silenciosamente
  instalações globais mais antigas no payload estável base
- A pré-validação de lançamento npm falha fechada, a menos que o tarball inclua tanto
  `dist/control-ui/index.html` quanto um payload não vazio em `dist/control-ui/assets/`,
  para que não enviemos novamente um dashboard de navegador vazio
- A verificação pós-publicação também confere se os entrypoints de plugins publicados
  e os metadados do pacote estão presentes no layout instalado do registro. Um
  lançamento que envia payloads de runtime de plugin ausentes falha no verificador
  pós-publicação e não pode ser promovido para `latest`.
- `pnpm test:install:smoke` também impõe o orçamento de `unpackedSize` do pacote npm
  sobre o tarball de atualização candidato, para que o e2e do instalador capture
  crescimento acidental do pacote antes do caminho de publicação de lançamento
- Se o trabalho de lançamento tocou no planejamento de CI, manifestos de temporização
  de extensão ou matrizes de teste de extensão, regenere e revise as saídas da matriz
  `plugin-prerelease-extension-shard` pertencentes ao planejador em
  `.github/workflows/plugin-prerelease.yml` antes da aprovação, para que as notas de
  lançamento não descrevam um layout de CI desatualizado
- A prontidão de lançamento estável para macOS também inclui as superfícies do atualizador:
  - o release do GitHub deve terminar com os pacotes `.zip`, `.dmg` e `.dSYM.zip`
  - `appcast.xml` em `main` deve apontar para o novo zip estável após a publicação; o
    workflow privado de publicação para macOS faz o commit automaticamente, ou abre um
    PR de appcast quando o push direto é bloqueado
  - o app empacotado deve manter um bundle id não debug, uma URL de feed do Sparkle
    não vazia e um `CFBundleVersion` igual ou acima do piso canônico de build do
    Sparkle para essa versão de lançamento

## Caixas de teste de lançamento

`Full Release Validation` é como operadores iniciam todos os testes pré-lançamento a
partir de um único ponto de entrada. Para uma prova de commit fixado em um branch que
se move rapidamente, use o auxiliar para que cada workflow filho rode a partir de um
branch temporário fixado no SHA alvo:

```bash
pnpm ci:full-release --sha <full-sha>
```

O helper envia `release-ci/<sha>-...`, dispara `Full Release Validation`
a partir desse branch com `ref=<sha>`, verifica se cada `headSha` de fluxo de
trabalho filho corresponde ao alvo e então exclui o branch temporário. Isso evita provar por acidente uma execução filha de um `main`
mais novo.

Para validação de branch ou tag de release, execute a partir da ref confiável do fluxo de trabalho `main`
e passe o branch ou a tag de release como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

O fluxo de trabalho resolve a ref alvo, dispara o `CI` manual com
`target_ref=<release-ref>`, dispara `OpenClaw Release Checks`, prepara um
artefato pai `release-package-under-test` para verificações voltadas a pacote e
dispara o E2E independente do pacote Telegram quando `release_profile=full` com
`rerun_group=all` ou quando `npm_telegram_package_spec` está definido. Em seguida, `OpenClaw Release
Checks` distribui install smoke, verificações de release entre sistemas operacionais, cobertura live/E2E Docker
do caminho de release quando soak está habilitado, Package Acceptance com QA de pacote
Telegram, paridade do QA Lab, Matrix ao vivo e Telegram ao vivo. Uma execução completa só é aceitável quando o
resumo de `Full Release Validation`
mostra `normal_ci` e `release_checks` como bem-sucedidos. No modo full/all,
o filho `npm_telegram` também deve ser bem-sucedido; fora de full/all, ele é ignorado
a menos que um `npm_telegram_package_spec` publicado tenha sido fornecido. O resumo final do
verificador inclui tabelas dos jobs mais lentos para cada execução filha, para que o gerente de release possa ver o caminho crítico atual sem baixar logs.
Consulte [Validação completa de release](/pt-BR/reference/full-release-validation) para a
matriz de estágios completa, nomes exatos de jobs do fluxo de trabalho, diferenças entre perfis
stable e full, artefatos e identificadores de reexecução focada.
Fluxos de trabalho filhos são disparados a partir da ref confiável que executa `Full Release
Validation`, normalmente `--ref main`, mesmo quando a `ref` alvo aponta para um
branch ou tag de release mais antigo. Não há uma entrada separada de ref de fluxo de trabalho para Full Release Validation; escolha o harness confiável escolhendo a ref de execução do fluxo de trabalho.
Não use `--ref main -f ref=<sha>` para prova exata de commit em um `main` em movimento;
SHAs brutos de commit não podem ser refs de despacho de fluxo de trabalho, então use
`pnpm ci:full-release --sha <sha>` para criar o branch temporário fixado.

Use `release_profile` para selecionar a amplitude live/provedor:

- `minimum`: caminho OpenAI/core live e Docker crítico de release mais rápido
- `stable`: minimum mais cobertura estável de provedor/backend para aprovação de release
- `full`: stable mais ampla cobertura consultiva de provedor/mídia

Use `run_release_soak=true` com `stable` quando as lanes bloqueadoras de release estiverem
verdes e você quiser a varredura exaustiva live/E2E, do caminho de release Docker e
limitada de sobrevivência a upgrades publicados antes da promoção. Essa varredura cobre
os quatro pacotes estáveis mais recentes, mais as linhas de base fixadas `2026.4.23` e `2026.5.2`,
além da cobertura mais antiga `2026.4.15`, com linhas de base duplicadas removidas e
cada linha de base fragmentada em seu próprio job runner Docker. `full` implica
`run_release_soak=true`.

`OpenClaw Release Checks` usa a ref confiável do fluxo de trabalho para resolver a ref alvo
uma vez como `release-package-under-test` e reutiliza esse artefato em verificações entre sistemas operacionais,
Package Acceptance e verificações Docker do caminho de release quando soak é executado. Isso mantém
todas as caixas voltadas a pacote nos mesmos bytes e evita builds repetidos de pacote.
O install smoke OpenAI entre sistemas operacionais usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando a
variável de repo/organização está definida; caso contrário, usa `openai/gpt-5.4`, porque esta lane está
provando instalação de pacote, onboarding, inicialização do Gateway e uma interação live de agente,
em vez de comparar desempenho com o modelo padrão mais lento. A matriz live mais ampla de provedores
continua sendo o lugar para cobertura específica de modelo.

Use estas variantes dependendo do estágio de release:

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

Não use o guarda-chuva completo como a primeira reexecução após uma correção focada. Se uma caixa
falhar, use o fluxo de trabalho filho, job, lane Docker, perfil de pacote, provedor
de modelo ou lane de QA que falhou para a próxima prova. Execute o guarda-chuva completo novamente apenas quando
a correção alterou a orquestração compartilhada de release ou tornou obsoleta a evidência anterior de todas as caixas.
O verificador final do guarda-chuva verifica novamente os ids registrados das execuções de fluxos de trabalho filhos,
então, depois que um fluxo de trabalho filho é reexecutado com sucesso, reexecute apenas o job pai
`Verify full validation` que falhou.

Para recuperação limitada, passe `rerun_group` ao guarda-chuva. `all` é a execução real
de candidato a release, `ci` executa apenas o filho de CI normal, `plugin-prerelease`
executa apenas o filho de Plugin exclusivo de release, `release-checks` executa todas as caixas de release,
e os grupos de release mais estreitos são `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` e `npm-telegram`.
Reexecuções focadas de `npm-telegram` exigem `npm_telegram_package_spec`; execuções full/all
com `release_profile=full` usam o artefato de pacote de release-checks. Reexecuções focadas
entre sistemas operacionais podem adicionar `cross_os_suite_filter=windows/packaged-upgrade` ou
outro filtro de sistema operacional/suite. Falhas de QA em release-checks são consultivas; uma falha apenas de QA
não bloqueia a validação de release.

### Vitest

A caixa Vitest é o fluxo de trabalho filho `CI` manual. O CI manual intencionalmente
ignora o escopo de alterações e força o grafo normal de testes para o candidato
a release: shards Linux Node, shards de Plugins agrupados, contratos de canal, compatibilidade Node 22,
`check`, `check-additional`, build smoke, verificações de docs, Skills Python, Windows, macOS, Android e i18n da Control UI.

Use esta caixa para responder "a árvore de código-fonte passou na suíte completa normal de testes?"
Ela não é o mesmo que validação de produto no caminho de release. Evidências a manter:

- resumo de `Full Release Validation` mostrando a URL da execução `CI` disparada
- execução `CI` verde no SHA alvo exato
- nomes de shards com falha ou lentos dos jobs de CI ao investigar regressões
- artefatos de temporização do Vitest, como `.artifacts/vitest-shard-timings.json`, quando
  uma execução precisa de análise de desempenho

Execute o CI manual diretamente apenas quando o release precisar de CI normal determinístico, mas
não das caixas Docker, QA Lab, live, entre sistemas operacionais ou pacote:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

A caixa Docker fica em `OpenClaw Release Checks` por meio de
`openclaw-live-and-e2e-checks-reusable.yml`, além do fluxo de trabalho `install-smoke`
em modo de release. Ela valida o candidato a release por meio de ambientes Docker
empacotados, em vez de apenas testes em nível de código-fonte.

A cobertura Docker de release inclui:

- install smoke completo com o smoke de instalação global lenta do Bun habilitado
- preparação/reutilização da imagem de smoke do Dockerfile raiz por SHA alvo, com jobs de QR,
  raiz/Gateway e installer/Bun smoke executando como shards separados de install-smoke
- lanes E2E de repositório
- chunks Docker do caminho de release: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` e `plugins-runtime-install-h`
- cobertura do OpenWebUI dentro do chunk `plugins-runtime-services` quando solicitada
- lanes divididas de instalação/desinstalação de Plugins agrupados
  `bundled-plugin-install-uninstall-0` até
  `bundled-plugin-install-uninstall-23`
- suítes live/E2E de provedores e cobertura de modelos live Docker quando release checks
  incluem suítes live

Use artefatos Docker antes de reexecutar. O agendador do caminho de release envia
`.artifacts/docker-tests/` com logs de lane, `summary.json`, `failures.json`,
tempos de fase, JSON do plano do agendador e comandos de reexecução. Para recuperação focada,
use `docker_lanes=<lane[,lane]>` no fluxo de trabalho reutilizável live/E2E em vez de
reexecutar todos os chunks de release. Comandos de reexecução gerados incluem
`package_artifact_run_id` anterior e entradas de imagem Docker preparada quando disponíveis, para que uma
lane com falha possa reutilizar o mesmo tarball e imagens GHCR.

### QA Lab

A caixa QA Lab também faz parte de `OpenClaw Release Checks`. Ela é o gate de release
de comportamento agêntico e em nível de canal, separado do Vitest e da mecânica de pacotes Docker.

A cobertura QA Lab de release inclui:

- lane de paridade mock comparando a lane candidata OpenAI com a linha de base Opus 4.6
  usando o pacote de paridade agêntica
- perfil rápido live Matrix QA usando o ambiente `qa-live-shared`
- lane live Telegram QA usando concessões de credenciais Convex CI
- `pnpm qa:otel:smoke` quando a telemetria de release precisa de prova local explícita

Use esta caixa para responder "o release se comporta corretamente em cenários de QA e
fluxos de canais live?" Mantenha as URLs dos artefatos para as lanes de paridade, Matrix e Telegram
ao aprovar o release. A cobertura completa Matrix continua disponível como uma
execução manual fragmentada de QA-Lab, em vez da lane crítica de release padrão.

### Pacote

A caixa de Pacote é o gate do produto instalável. Ela é apoiada por
`Package Acceptance` e pelo resolvedor
`scripts/resolve-openclaw-package-candidate.mjs`. O resolvedor normaliza um
candidato no tarball `package-under-test` consumido pelo Docker E2E, valida
o inventário do pacote, registra a versão do pacote e o SHA-256 e mantém a
ref do harness do fluxo de trabalho separada da ref de origem do pacote.

Fontes de candidato compatíveis:

- `source=npm`: `openclaw@beta`, `openclaw@latest` ou uma versão exata de release do OpenClaw
- `source=ref`: empacota um branch, tag ou SHA completo de commit de `package_ref` confiável
  com o harness `workflow_ref` selecionado
- `source=url`: baixa um `.tgz` HTTPS com `package_sha256` obrigatório
- `source=artifact`: reutiliza um `.tgz` enviado por outra execução do GitHub Actions

`OpenClaw Release Checks` executa Package Acceptance com `source=artifact`, o
artefato preparado do pacote de release, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance mantém migração, atualização,
reinício de atualização com autenticação configurada, instalação live de Skills ClawHub, limpeza de dependências obsoletas de Plugin, fixtures de Plugin
offline, atualização de Plugin e QA do pacote Telegram contra o mesmo tarball resolvido.
Verificações bloqueadoras de release usam a linha de base padrão do pacote publicado mais recente;
`run_release_soak=true` ou
`release_profile=full` expande para todas as linhas de base estáveis publicadas no npm de
`2026.4.23` até `latest`, mais fixtures de problemas relatados. Use
Package Acceptance com `source=npm` para um candidato já entregue, ou
`source=ref`/`source=artifact` para um tarball npm local respaldado por SHA antes da
publicação. Ela é a substituição nativa do GitHub
para a maior parte da cobertura de pacote/atualização que antes exigia
Parallels. Verificações de release entre sistemas operacionais ainda importam para onboarding,
instalador e comportamento de plataforma específicos de sistema operacional, mas a validação de produto de pacote/atualização deve
preferir Package Acceptance.

A lista de verificação canônica para validação de atualizações e Plugins é
[Testando atualizações e Plugins](/pt-BR/help/testing-updates-plugins). Use-a ao
decidir qual trilha local, Docker, Package Acceptance ou de verificação de
lançamento comprova uma instalação/atualização de Plugin, limpeza do doctor ou
alteração de migração de pacote publicado. A migração exaustiva de atualização
publicada de todos os pacotes estáveis `2026.4.23+` é um fluxo de trabalho
manual separado `Update Migration`, não parte do Full Release CI.

A tolerância legada de package-acceptance é intencionalmente limitada no tempo.
Pacotes até `2026.4.25` podem usar o caminho de compatibilidade para lacunas de
metadados já publicadas no npm: entradas privadas de inventário de QA ausentes
do tarball, ausência de `gateway install --wrapper`, arquivos de patch ausentes
no fixture git derivado do tarball, ausência de `update.channel` persistido,
locais legados de registros de instalação de Plugin, ausência de persistência de
registro de instalação do marketplace e migração de metadados de configuração
durante `plugins update`. O pacote publicado `2026.4.26` pode emitir avisos para
arquivos locais de carimbo de metadados de build que já foram enviados. Pacotes
posteriores devem satisfazer os contratos modernos de pacote; essas mesmas
lacunas falham na validação de lançamento.

Use perfis mais amplos de Package Acceptance quando a questão de lançamento for
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

- `smoke`: trilhas rápidas de instalação de pacote/canal/agente, rede do Gateway
  e recarregamento de configuração
- `package`: contratos de instalação/atualização/reinicialização/pacote de
  Plugin, além de prova ao vivo de instalação de skill do ClawHub; este é o
  padrão de verificação de lançamento
- `product`: `package` mais canais MCP, limpeza de cron/subagente, pesquisa web
  da OpenAI e OpenWebUI
- `full`: blocos de caminho de lançamento Docker com OpenWebUI
- `custom`: lista exata de `docker_lanes` para reexecuções focadas

Para prova de Telegram de candidato a pacote, habilite
`telegram_mode=mock-openai` ou `telegram_mode=live-frontier` em Package
Acceptance. O fluxo de trabalho passa o tarball `package-under-test` resolvido
para a trilha do Telegram; o fluxo de trabalho independente do Telegram ainda
aceita uma especificação npm publicada para verificações pós-publicação.

## Automação de publicação de lançamento

`OpenClaw Release Publish` é o ponto de entrada mutante normal de publicação.
Ele orquestra os fluxos de trabalho de publicador confiável na ordem que o
lançamento exige:

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

Use os fluxos de trabalho de nível inferior `Plugin NPM Release` e
`Plugin ClawHub Release` somente para reparo focado ou republicação. Para um
reparo de Plugin selecionado, passe `plugin_publish_scope=selected` e
`plugins=@openclaw/name` para `OpenClaw Release Publish`, ou dispare o fluxo de
trabalho filho diretamente quando o pacote OpenClaw não deve ser publicado.

## Entradas do fluxo de trabalho NPM

`OpenClaw NPM Release` aceita estas entradas controladas pelo operador:

- `tag`: tag de lançamento obrigatória, como `v2026.4.2`, `v2026.4.2-1` ou
  `v2026.4.2-beta.1`; quando `preflight_only=true`, também pode ser o SHA de
  commit completo de 40 caracteres da ramificação atual do fluxo de trabalho
  para preflight somente de validação
- `preflight_only`: `true` apenas para validação/build/pacote, `false` para o
  caminho real de publicação
- `preflight_run_id`: obrigatório no caminho real de publicação para que o fluxo
  de trabalho reutilize o tarball preparado da execução de preflight bem-sucedida
- `npm_dist_tag`: tag de destino do npm para o caminho de publicação; o padrão é
  `beta`

`OpenClaw Release Publish` aceita estas entradas controladas pelo operador:

- `tag`: tag de lançamento obrigatória; já deve existir
- `preflight_run_id`: id da execução de preflight bem-sucedida de
  `OpenClaw NPM Release`; obrigatório quando `publish_openclaw_npm=true`
- `npm_dist_tag`: tag de destino do npm para o pacote OpenClaw
- `plugin_publish_scope`: o padrão é `all-publishable`; use `selected` somente
  para trabalho de reparo focado
- `plugins`: nomes de pacotes `@openclaw/*` separados por vírgula quando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: o padrão é `true`; defina como `false` somente ao usar
  o fluxo de trabalho como orquestrador de reparo apenas de Plugin

`OpenClaw Release Checks` aceita estas entradas controladas pelo operador:

- `ref`: ramificação, tag ou SHA de commit completo a validar. Verificações com
  segredos exigem que o commit resolvido seja alcançável a partir de uma
  ramificação OpenClaw ou tag de lançamento.
- `run_release_soak`: optar por soak exaustivo ao vivo/E2E, caminho de lançamento
  Docker e all-since upgrade-survivor em verificações estáveis/padrão de
  lançamento. Ele é forçado por `release_profile=full`.

Regras:

- Tags estáveis e de correção podem publicar para `beta` ou `latest`
- Tags de pré-lançamento beta podem publicar somente para `beta`
- Para `OpenClaw NPM Release`, a entrada de SHA de commit completo é permitida
  somente quando `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` são sempre somente de
  validação
- O caminho real de publicação deve usar o mesmo `npm_dist_tag` usado durante o
  preflight; o fluxo de trabalho verifica esses metadados antes de a publicação
  continuar

## Sequência de lançamento estável no npm

Ao cortar um lançamento estável no npm:

1. Execute `OpenClaw NPM Release` com `preflight_only=true`
   - Antes de existir uma tag, você pode usar o SHA de commit completo da
     ramificação atual do fluxo de trabalho para uma execução de ensaio somente
     de validação do fluxo de trabalho de preflight
2. Escolha `npm_dist_tag=beta` para o fluxo normal beta-first, ou `latest`
   somente quando você quiser intencionalmente uma publicação estável direta
3. Execute `Full Release Validation` na ramificação de lançamento, tag de
   lançamento ou SHA de commit completo quando quiser CI normal mais cobertura de
   cache de prompt ao vivo, Docker, QA Lab, Matrix e Telegram a partir de um
   único fluxo de trabalho manual
4. Se você intencionalmente só precisar do grafo normal de testes determinístico,
   execute o fluxo de trabalho manual `CI` na ref de lançamento
5. Salve o `preflight_run_id` bem-sucedido
6. Execute `OpenClaw Release Publish` com a mesma `tag`, o mesmo `npm_dist_tag` e
   o `preflight_run_id` salvo; ele publica Plugins externalizados no npm e no
   ClawHub antes de promover o pacote npm OpenClaw
7. Se o lançamento caiu em `beta`, use o fluxo de trabalho privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` para
   promover essa versão estável de `beta` para `latest`
8. Se o lançamento foi intencionalmente publicado diretamente em `latest` e
   `beta` deve seguir imediatamente a mesma build estável, use esse mesmo fluxo
   de trabalho privado para apontar ambas as dist-tags para a versão estável, ou
   deixe a sincronização programada de autocorreção mover `beta` depois

A mutação de dist-tag fica no repositório privado por segurança porque ainda
exige `NPM_TOKEN`, enquanto o repositório público mantém publicação somente com
OIDC.

Isso mantém o caminho de publicação direta e o caminho de promoção beta-first
documentados e visíveis ao operador.

Se um mantenedor precisar recorrer à autenticação npm local, execute quaisquer
comandos da CLI do 1Password (`op`) somente dentro de uma sessão tmux dedicada.
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

Mantenedores usam a documentação privada de lançamento em
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
para o runbook real.

## Relacionado

- [Canais de lançamento](/pt-BR/install/development-channels)
