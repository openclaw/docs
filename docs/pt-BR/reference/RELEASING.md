---
read_when:
    - Procurando definições públicas de canais de lançamento
    - Executando validação de release ou aceitação de pacote
    - Procurando nomenclatura e cadência de versões
summary: Canais de lançamento, checklist do operador, caixas de validação, nomenclatura de versões e cadência
title: Política de lançamento
x-i18n:
    generated_at: "2026-05-01T05:58:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfe579099a9580e2d0400cd0b24f26d3fa3ee917899423604ebc13aa2519b4ee
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw tem três canais públicos de lançamento:

- estável: lançamentos marcados com tags que publicam no npm `beta` por padrão, ou no npm `latest` quando solicitado explicitamente
- beta: tags de pré-lançamento que publicam no npm `beta`
- desenvolvimento: o topo móvel de `main`

## Nomeação de versões

- Versão de lançamento estável: `YYYY.M.D`
  - Tag do Git: `vYYYY.M.D`
- Versão de lançamento de correção estável: `YYYY.M.D-N`
  - Tag do Git: `vYYYY.M.D-N`
- Versão de pré-lançamento beta: `YYYY.M.D-beta.N`
  - Tag do Git: `vYYYY.M.D-beta.N`
- Não adicione zero à esquerda no mês ou no dia
- `latest` significa o lançamento npm estável promovido atual
- `beta` significa o destino de instalação beta atual
- Lançamentos estáveis e de correção estável publicam no npm `beta` por padrão; operadores de lançamento podem direcionar para `latest` explicitamente, ou promover uma compilação beta validada posteriormente
- Todo lançamento estável do OpenClaw distribui o pacote npm e o app macOS juntos;
  lançamentos beta normalmente validam e publicam primeiro o caminho npm/pacote, com
  compilação/assinatura/notarização do app Mac reservadas para estáveis, salvo solicitação explícita

## Cadência de lançamento

- Os lançamentos seguem primeiro para beta
- O estável vem somente depois que o beta mais recente é validado
- Mantenedores normalmente criam lançamentos a partir de uma branch `release/YYYY.M.D` criada
  a partir do `main` atual, para que a validação e as correções do lançamento não bloqueiem novos
  desenvolvimentos em `main`
- Se uma tag beta foi enviada ou publicada e precisa de uma correção, mantenedores criam
  a próxima tag `-beta.N` em vez de excluir ou recriar a tag beta antiga
- Procedimento detalhado de lançamento, aprovações, credenciais e notas de recuperação são
  apenas para mantenedores

## Checklist do operador de lançamento

Este checklist é o formato público do fluxo de lançamento. Credenciais privadas,
assinatura, notarização, recuperação de dist-tag e detalhes de rollback emergencial ficam no
runbook de lançamento restrito a mantenedores.

1. Comece do `main` atual: puxe a versão mais recente, confirme que o commit de destino foi enviado
   e confirme que o CI atual de `main` está verde o suficiente para criar uma branch a partir dele.
2. Reescreva a seção superior de `CHANGELOG.md` a partir do histórico real de commits com
   `/changelog`, mantenha as entradas voltadas ao usuário, faça commit, envie, e faça rebase/pull
   mais uma vez antes de criar a branch.
3. Revise os registros de compatibilidade de lançamento em
   `src/plugins/compat/registry.ts` e
   `src/commands/doctor/shared/deprecation-compat.ts`. Remova compatibilidade expirada
   somente quando o caminho de atualização continuar coberto, ou registre por que ela está
   sendo mantida intencionalmente.
4. Crie `release/YYYY.M.D` a partir do `main` atual; não faça o trabalho normal de lançamento
   diretamente em `main`.
5. Atualize todos os locais de versão exigidos para a tag pretendida, depois execute o
   preflight determinístico local:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` e `pnpm release:check`.
6. Execute `OpenClaw NPM Release` com `preflight_only=true`. Antes de uma tag existir,
   um SHA completo de 40 caracteres da branch de lançamento é permitido para preflight
   somente de validação. Salve o `preflight_run_id` bem-sucedido.
7. Inicie todos os testes de pré-lançamento com `Full Release Validation` para a
   branch de lançamento, tag ou SHA completo do commit. Este é o único ponto de entrada manual
   para as quatro grandes caixas de teste de lançamento: Vitest, Docker, QA Lab e Package.
8. Se a validação falhar, corrija na branch de lançamento e reexecute o menor
   arquivo, canal, job de workflow, perfil de pacote, provedor ou allowlist de modelo com falha que
   comprove a correção. Reexecute o guarda-chuva completo somente quando a superfície alterada tornar
   as evidências anteriores obsoletas.
9. Para beta, crie a tag `vYYYY.M.D-beta.N`, publique com a dist-tag npm `beta`, depois execute
   a aceitação de pacote pós-publicação contra o pacote publicado `openclaw@YYYY.M.D-beta.N`
   ou `openclaw@beta`. Se um beta enviado ou publicado precisar de correção, crie
   o próximo `-beta.N`; não exclua nem reescreva o beta antigo.
10. Para estável, continue somente depois que o beta validado ou candidato a lançamento tiver as
    evidências de validação exigidas. A publicação npm estável reutiliza o artefato de
    preflight bem-sucedido via `preflight_run_id`; a prontidão do lançamento macOS estável
    também exige o `.zip`, `.dmg`, `.dSYM.zip` empacotados e o
    `appcast.xml` atualizado em `main`.
11. Após publicar, execute o verificador npm pós-publicação, o E2E Telegram
    opcional autônomo do npm publicado quando precisar de prova de canal pós-publicação,
    promoção de dist-tag quando necessário, notas de lançamento/pré-lançamento no GitHub a partir da
    seção completa correspondente de `CHANGELOG.md`, e as etapas de anúncio do lançamento.

## Preflight de lançamento

- Execute `pnpm check:test-types` antes do preflight de release para que o TypeScript dos testes continue coberto fora do gate local mais rápido `pnpm check`
- Execute `pnpm check:architecture` antes do preflight de release para que as verificações mais amplas de ciclos de importação e limites de arquitetura estejam verdes fora do gate local mais rápido
- Execute `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que os artefatos de release esperados em `dist/*` e o pacote da Control UI existam para a etapa de validação do pacote
- Execute o fluxo de trabalho manual `Full Release Validation` antes da aprovação do release para iniciar todas as caixas de teste pré-release a partir de um único ponto de entrada. Ele aceita uma branch, tag ou SHA completo de commit, dispara `CI` manual e dispara `OpenClaw Release Checks` para install smoke, aceitação de pacote, suítes do caminho de release do Docker, live/E2E, OpenWebUI, paridade do QA Lab, Matrix e lanes do Telegram. Forneça `npm_telegram_package_spec` somente depois que um pacote tiver sido publicado e o E2E pós-publicação do Telegram também precisar ser executado. Forneça `evidence_package_spec` quando o relatório privado de evidências precisar provar que a validação corresponde a um pacote npm publicado sem forçar o E2E do Telegram.
  Exemplo:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Execute o fluxo de trabalho manual `Package Acceptance` quando quiser uma prova por canal lateral para um candidato de pacote enquanto o trabalho de release continua. Use `source=npm` para `openclaw@beta`, `openclaw@latest` ou uma versão exata de release; `source=ref` para empacotar uma branch/tag/SHA confiável em `package_ref` com o harness atual de `workflow_ref`; `source=url` para um tarball HTTPS com SHA-256 obrigatório; ou `source=artifact` para um tarball carregado por outra execução do GitHub Actions. O fluxo de trabalho resolve o candidato para `package-under-test`, reutiliza o agendador de release Docker E2E contra esse tarball e pode executar QA do Telegram contra o mesmo tarball com `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`. Quando as lanes Docker selecionadas incluem `published-upgrade-survivor`, o artefato do pacote é o candidato e `published_upgrade_survivor_baseline` seleciona a linha de base publicada.
  Exemplo: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Perfis comuns:
  - `smoke`: lanes de instalação/canal/agente, rede do Gateway e recarregamento de configuração
  - `package`: lanes nativas do artefato para pacote/atualização/plugin sem OpenWebUI nem ClawHub ao vivo
  - `product`: perfil de pacote mais canais MCP, limpeza de cron/subagente, pesquisa web da OpenAI e OpenWebUI
  - `full`: partes do caminho de release Docker com OpenWebUI
  - `custom`: seleção exata de `docker_lanes` para uma nova execução focada
- Execute diretamente o fluxo de trabalho manual `CI` quando você precisar apenas da cobertura completa normal de CI para o candidato de release. Disparos manuais de CI ignoram o escopo por alterações e forçam as shards Linux Node, shards de plugin empacotado, contratos de canal, compatibilidade com Node 22, `check`, `check-additional`, smoke de build, verificações de docs, Skills Python, Windows, macOS, Android e lanes de i18n da Control UI.
  Exemplo: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Execute `pnpm qa:otel:smoke` ao validar a telemetria de release. Ele exercita o QA-lab por meio de um receptor OTLP/HTTP local e verifica os nomes dos spans de trace exportados, atributos limitados e redação de conteúdo/identificadores sem exigir Opik, Langfuse ou outro coletor externo.
- Execute `pnpm release:check` antes de todo release com tag
- As verificações de release agora são executadas em um fluxo de trabalho manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` também executa o gate de paridade mock do QA Lab, além do perfil Matrix live rápido e da lane de QA do Telegram antes da aprovação do release. As lanes live usam o ambiente `qa-live-shared`; o Telegram também usa concessões de credenciais de CI do Convex. Execute o fluxo de trabalho manual `QA-Lab - All Lanes` com `matrix_profile=all` e `matrix_shards=true` quando quiser inventário completo de transporte, mídia e E2EE do Matrix em paralelo.
- A validação de runtime de instalação e upgrade entre sistemas operacionais faz parte dos públicos `OpenClaw Release Checks` e `Full Release Validation`, que chamam diretamente o fluxo de trabalho reutilizável `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Essa divisão é intencional: manter o caminho real de release npm curto, determinístico e focado em artefatos, enquanto verificações live mais lentas ficam na própria lane para não atrasarem nem bloquearem a publicação
- Verificações de release que carregam segredos devem ser disparadas por meio de `Full Release Validation` ou a partir da ref de fluxo de trabalho `main`/release para que a lógica do fluxo de trabalho e os segredos permaneçam controlados
- `OpenClaw Release Checks` aceita uma branch, tag ou SHA completo de commit, desde que o commit resolvido seja alcançável a partir de uma branch ou tag de release do OpenClaw
- O preflight somente de validação de `OpenClaw NPM Release` também aceita o SHA completo de 40 caracteres do commit atual da branch do fluxo de trabalho sem exigir uma tag enviada
- Esse caminho por SHA é somente de validação e não pode ser promovido para uma publicação real
- No modo SHA, o fluxo de trabalho sintetiza `v<package.json version>` somente para a verificação de metadados do pacote; a publicação real ainda exige uma tag de release real
- Ambos os fluxos de trabalho mantêm o caminho real de publicação e promoção em runners hospedados pelo GitHub, enquanto o caminho de validação sem mutações pode usar os runners Linux maiores do Blacksmith
- Esse fluxo de trabalho executa `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` usando os segredos de fluxo de trabalho `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- O preflight de release npm não espera mais pela lane separada de verificações de release
- Execute `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts` (ou a tag beta/correção correspondente) antes da aprovação
- Após a publicação npm, execute `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D` (ou a versão beta/correção correspondente) para verificar o caminho de instalação do registro publicado em um prefixo temporário novo
- Após uma publicação beta, execute `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` para verificar o onboarding do pacote instalado, a configuração do Telegram e o E2E real do Telegram contra o pacote npm publicado usando o pool compartilhado de credenciais Telegram concedidas. Execuções locais avulsas de mantenedores podem omitir as variáveis do Convex e passar diretamente as três credenciais de ambiente `OPENCLAW_QA_TELEGRAM_*`.
- Mantenedores podem executar a mesma verificação pós-publicação pelo GitHub Actions por meio do fluxo de trabalho manual `NPM Telegram Beta E2E`. Ele é intencionalmente apenas manual e não é executado em todo merge.
- A automação de release dos mantenedores agora usa preflight e depois promoção:
  - a publicação npm real deve passar por um `preflight_run_id` npm bem-sucedido
  - a publicação npm real deve ser disparada a partir da mesma branch `main` ou `release/YYYY.M.D` da execução de preflight bem-sucedida
  - releases npm estáveis usam `beta` por padrão
  - a publicação npm estável pode mirar explicitamente em `latest` via entrada do fluxo de trabalho
  - a mutação de dist-tag npm baseada em token agora fica em `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` por segurança, porque `npm dist-tag add` ainda precisa de `NPM_TOKEN`, enquanto o repositório público mantém publicação apenas por OIDC
  - o `macOS Release` público é somente de validação; quando uma tag existe apenas em uma branch de release, mas o fluxo de trabalho é disparado a partir de `main`, defina `public_release_branch=release/YYYY.M.D`
  - a publicação privada real para Mac deve passar por `preflight_run_id` e `validate_run_id` privados de Mac bem-sucedidos
  - os caminhos reais de publicação promovem artefatos preparados em vez de reconstruí-los novamente
- Para releases estáveis de correção como `YYYY.M.D-N`, o verificador pós-publicação também verifica o mesmo caminho de upgrade com prefixo temporário de `YYYY.M.D` para `YYYY.M.D-N`, para que correções de release não deixem silenciosamente instalações globais antigas no payload estável base
- O preflight de release npm falha fechado a menos que o tarball inclua `dist/control-ui/index.html` e um payload não vazio em `dist/control-ui/assets/`, para que não entreguemos novamente um dashboard de navegador vazio
- A verificação pós-publicação também verifica se a instalação publicada do registro contém dependências de runtime não vazias dos plugins empacotados no layout raiz `dist/*`. Um release entregue com payloads ausentes ou vazios de dependências de plugins empacotados falha no verificador pós-publicação e não pode ser promovido para `latest`.
- `pnpm test:install:smoke` também impõe o orçamento de `unpackedSize` do pacote npm no tarball candidato de atualização, para que o e2e do instalador capture aumento acidental de tamanho do pacote antes do caminho de publicação do release
- Se o trabalho de release tocou no planejamento de CI, manifests de tempo de extensões ou matrizes de teste de extensões, regenere e revise as saídas de matriz `plugin-prerelease-extension-shard` pertencentes ao planejador em `.github/workflows/plugin-prerelease.yml` antes da aprovação, para que as notas de release não descrevam um layout de CI obsoleto
- A prontidão do release estável para macOS também inclui as superfícies do atualizador:
  - o release do GitHub deve terminar com os pacotes `.zip`, `.dmg` e `.dSYM.zip`
  - `appcast.xml` em `main` deve apontar para o novo zip estável após a publicação
  - o app empacotado deve manter um ID de bundle não debug, uma URL de feed do Sparkle não vazia e um `CFBundleVersion` no piso canônico de build do Sparkle, ou acima dele, para essa versão de release

## Caixas de teste de release

`Full Release Validation` é como operadores iniciam todos os testes pré-release a partir de um único ponto de entrada. Execute-o a partir da ref confiável de fluxo de trabalho `main` e passe a branch de release, tag ou SHA completo de commit como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

O fluxo de trabalho resolve a ref de destino, dispara `CI` manual com `target_ref=<release-ref>`, dispara `OpenClaw Release Checks` e, opcionalmente, dispara E2E Telegram pós-publicação independente quando `npm_telegram_package_spec` está definido. `OpenClaw Release Checks` então distribui install smoke, verificações de release entre sistemas operacionais, cobertura live/E2E do caminho de release Docker, Package Acceptance com QA de pacote Telegram, paridade do QA Lab, Matrix live e Telegram live. Uma execução completa só é aceitável quando o resumo de `Full Release Validation` mostra `normal_ci` e `release_checks` como bem-sucedidos, e qualquer filho opcional `npm_telegram` está bem-sucedido ou foi pulado intencionalmente. O resumo final do verificador inclui tabelas dos jobs mais lentos para cada execução filha, para que o gerente de release possa ver o caminho crítico atual sem baixar logs.
Consulte [Validação completa de release](/pt-BR/reference/full-release-validation) para a matriz completa de estágios, nomes exatos dos jobs de fluxo de trabalho, diferenças entre perfis estável e completo, artefatos e identificadores de nova execução focada.
Fluxos de trabalho filhos são disparados a partir da ref confiável que executa `Full Release Validation`, normalmente `--ref main`, mesmo quando o `ref` de destino aponta para uma branch ou tag de release mais antiga. Não há entrada separada de ref de fluxo de trabalho para Full Release Validation; escolha o harness confiável escolhendo a ref de execução do fluxo de trabalho.

Use `release_profile` para selecionar a amplitude live/provedor:

- `minimum`: caminho live e Docker mais rápido e crítico para release em OpenAI/core
- `stable`: mínimo mais cobertura estável de provedor/backend para aprovação de release
- `full`: estável mais cobertura ampla de provedores/mídia consultivos

`OpenClaw Release Checks` usa a referência de workflow confiável para resolver a referência de destino uma vez como `release-package-under-test` e reutiliza esse artefato tanto nas verificações Docker de caminho de lançamento quanto no Package Acceptance. Isso mantém todas as caixas voltadas a pacotes nos mesmos bytes e evita compilações repetidas de pacotes. A verificação rápida de instalação OpenAI entre sistemas operacionais usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando a variável de repo/organização está definida; caso contrário, usa `openai/gpt-5.4-mini`, porque esta lane comprova a instalação do pacote, o onboarding, a inicialização do gateway e uma interação de agente ao vivo, em vez de benchmarkar o modelo padrão mais lento. A matriz mais ampla de provedores ao vivo continua sendo o lugar para cobertura específica de modelos.

Use estas variantes dependendo do estágio do lançamento:

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
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Não use o guarda-chuva completo como a primeira reexecução após uma correção focada. Se uma caixa falhar, use o workflow filho, job, lane Docker, perfil de pacote, provedor de modelo ou lane de QA que falhou para a próxima comprovação. Execute o guarda-chuva completo novamente apenas quando a correção alterar a orquestração compartilhada de lançamento ou tornar obsoletas as evidências anteriores de todas as caixas. O verificador final do guarda-chuva revalida os IDs registrados das execuções de workflows filhos; portanto, depois que um workflow filho for reexecutado com sucesso, reexecute apenas o job pai `Verify full validation` que falhou.

Para recuperação delimitada, passe `rerun_group` para o guarda-chuva. `all` é a execução real do candidato a lançamento, `ci` executa apenas o filho de CI normal, `plugin-prerelease` executa apenas o filho de plugin exclusivo de lançamento, `release-checks` executa todas as caixas de lançamento, e os grupos de lançamento mais restritos são `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` e `npm-telegram` quando a lane Telegram de pacote independente é fornecida.

### Vitest

A caixa Vitest é o workflow filho manual `CI`. O CI manual ignora intencionalmente o escopo por alterações e força o grafo de testes normal para o candidato a lançamento: shards Linux Node, shards de plugins empacotados, contratos de canais, compatibilidade com Node 22, `check`, `check-additional`, smoke de build, verificações de documentação, Skills em Python, Windows, macOS, Android e i18n da Control UI.

Use esta caixa para responder “a árvore de código-fonte passou no conjunto completo de testes normal?” Ela não é o mesmo que a validação de produto pelo caminho de lançamento. Evidências a manter:

- resumo de `Full Release Validation` mostrando a URL da execução `CI` disparada
- execução `CI` verde no SHA de destino exato
- nomes de shards com falha ou lentos dos jobs de CI ao investigar regressões
- artefatos de tempo do Vitest, como `.artifacts/vitest-shard-timings.json`, quando uma execução precisa de análise de desempenho

Execute o CI manual diretamente apenas quando o lançamento precisar de CI normal determinístico, mas não das caixas Docker, QA Lab, ao vivo, entre sistemas operacionais ou de pacote:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

A caixa Docker vive em `OpenClaw Release Checks` por meio de `openclaw-live-and-e2e-checks-reusable.yml`, além do workflow `install-smoke` em modo de lançamento. Ela valida o candidato a lançamento por meio de ambientes Docker empacotados, em vez de apenas testes no nível do código-fonte.

A cobertura Docker de lançamento inclui:

- smoke de instalação completo com o smoke de instalação global Bun lento habilitado
- preparação/reutilização de imagem smoke do Dockerfile raiz por SHA de destino, com jobs de smoke de QR, raiz/gateway e instalador/Bun executando como shards install-smoke separados
- lanes E2E do repositório
- chunks Docker do caminho de lançamento: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g`, `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` e `bundled-channels-contracts`
- cobertura do OpenWebUI dentro do chunk `plugins-runtime-services` quando solicitada
- lanes divididas de dependências de canais empacotados entre chunks de channel-smoke, update-target e contratos de setup/runtime, em vez de um grande job único de canais empacotados
- lanes divididas de instalação/desinstalação de plugins empacotados de `bundled-plugin-install-uninstall-0` até `bundled-plugin-install-uninstall-23`
- suítes de provedores ao vivo/E2E e cobertura Docker de modelos ao vivo quando as verificações de lançamento incluem suítes ao vivo

Use artefatos Docker antes de reexecutar. O agendador de caminho de lançamento envia `.artifacts/docker-tests/` com logs de lanes, `summary.json`, `failures.json`, tempos de fases, JSON do plano do agendador e comandos de reexecução. Para recuperação focada, use `docker_lanes=<lane[,lane]>` no workflow reutilizável ao vivo/E2E, em vez de reexecutar todos os chunks de lançamento. Os comandos de reexecução gerados incluem `package_artifact_run_id` anterior e entradas de imagem Docker preparada quando disponíveis, para que uma lane com falha possa reutilizar o mesmo tarball e as imagens GHCR.

### QA Lab

A caixa QA Lab também faz parte de `OpenClaw Release Checks`. Ela é o gate de lançamento de comportamento agêntico e no nível de canais, separado do Vitest e da mecânica de pacote Docker.

A cobertura QA Lab de lançamento inclui:

- gate de paridade mock comparando a lane candidata OpenAI com a linha de base Opus 4.6 usando o pacote de paridade agêntica
- perfil de QA Matrix ao vivo rápido usando o ambiente `qa-live-shared`
- lane QA Telegram ao vivo usando concessões de credenciais Convex CI
- `pnpm qa:otel:smoke` quando a telemetria de lançamento precisa de comprovação local explícita

Use esta caixa para responder “o lançamento se comporta corretamente em cenários de QA e fluxos de canais ao vivo?” Mantenha as URLs dos artefatos das lanes de paridade, Matrix e Telegram ao aprovar o lançamento. A cobertura Matrix completa permanece disponível como uma execução manual QA-Lab em shards, em vez da lane crítica padrão de lançamento.

### Pacote

A caixa Pacote é o gate de produto instalável. Ela é apoiada por `Package Acceptance` e pelo resolvedor `scripts/resolve-openclaw-package-candidate.mjs`. O resolvedor normaliza um candidato para o tarball `package-under-test` consumido pelo Docker E2E, valida o inventário do pacote, registra a versão do pacote e o SHA-256, e mantém a referência do harness do workflow separada da referência de origem do pacote.

Fontes de candidato compatíveis:

- `source=npm`: `openclaw@beta`, `openclaw@latest` ou uma versão exata de lançamento do OpenClaw
- `source=ref`: empacota uma branch, tag ou SHA completo de commit `package_ref` confiável com o harness `workflow_ref` selecionado
- `source=url`: baixa um `.tgz` HTTPS com `package_sha256` obrigatório
- `source=artifact`: reutiliza um `.tgz` enviado por outra execução do GitHub Actions

`OpenClaw Release Checks` executa Package Acceptance com `source=ref`, `package_ref=<release-ref>`, `suite_profile=custom`, `docker_lanes=bundled-channel-deps-compat plugins-offline` e `telegram_mode=mock-openai`. Os chunks Docker do caminho de lançamento cobrem as lanes sobrepostas de instalação, atualização e atualização de plugins; Package Acceptance mantém compatibilidade de canais empacotados nativa de artefato, fixtures de plugins offline e QA de pacote Telegram contra o mesmo tarball resolvido. Ele é o substituto nativo do GitHub para a maior parte da cobertura de pacote/atualização que antes exigia Parallels. As verificações de lançamento entre sistemas operacionais ainda importam para onboarding, instalador e comportamento de plataforma específicos de SO, mas a validação de produto de pacote/atualização deve preferir Package Acceptance.

A leniência legada de package-acceptance é intencionalmente limitada no tempo. Pacotes até `2026.4.25` podem usar o caminho de compatibilidade para lacunas de metadados já publicadas no npm: entradas privadas de inventário de QA ausentes do tarball, `gateway install --wrapper` ausente, arquivos de patch ausentes no fixture git derivado do tarball, `update.channel` persistido ausente, locais legados de registros de instalação de plugins, persistência ausente de registros de instalação do marketplace e migração de metadados de configuração durante `plugins update`. O pacote `2026.4.26` publicado pode avisar sobre arquivos locais de carimbo de metadados de build que já foram enviados. Pacotes posteriores devem satisfazer os contratos de pacote modernos; essas mesmas lacunas fazem a validação de lançamento falhar.

Use perfis mais amplos de Package Acceptance quando a pergunta de lançamento for sobre um pacote realmente instalável:

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

- `smoke`: lanes rápidas de instalação de pacote/canal/agente, rede de gateway e recarregamento de configuração
- `package`: contratos de pacote de instalação/atualização/plugin sem ClawHub ao vivo; este é o padrão de release-check
- `product`: `package` mais canais MCP, limpeza de cron/subagente, pesquisa web OpenAI e OpenWebUI
- `full`: chunks Docker do caminho de lançamento com OpenWebUI
- `custom`: lista exata de `docker_lanes` para reexecuções focadas

Para comprovação Telegram de candidato a pacote, habilite `telegram_mode=mock-openai` ou `telegram_mode=live-frontier` no Package Acceptance. O workflow passa o tarball `package-under-test` resolvido para a lane Telegram; o workflow Telegram independente ainda aceita uma especificação npm publicada para verificações pós-publicação.

## Entradas do workflow NPM

`OpenClaw NPM Release` aceita estas entradas controladas pelo operador:

- `tag`: tag de lançamento obrigatória, como `v2026.4.2`, `v2026.4.2-1` ou `v2026.4.2-beta.1`; quando `preflight_only=true`, também pode ser o SHA completo de commit de 40 caracteres atual da branch de workflow para preflight apenas de validação
- `preflight_only`: `true` para validação/build/pacote apenas, `false` para o caminho real de publicação
- `preflight_run_id`: obrigatório no caminho real de publicação para que o workflow reutilize o tarball preparado da execução de preflight bem-sucedida
- `npm_dist_tag`: tag npm de destino para o caminho de publicação; o padrão é `beta`

`OpenClaw Release Checks` aceita estas entradas controladas pelo operador:

- `ref`: branch, tag ou SHA completo de commit a validar. Verificações com segredos exigem que o commit resolvido seja alcançável a partir de uma branch ou tag de lançamento do OpenClaw.

Regras:

- Tags estáveis e de correção podem publicar em `beta` ou `latest`
- Tags beta de pré-lançamento podem publicar apenas em `beta`
- Para `OpenClaw NPM Release`, entrada de SHA completo de commit é permitida apenas quando `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` são sempre apenas de validação
- O caminho real de publicação deve usar o mesmo `npm_dist_tag` usado durante o preflight; o workflow verifica esses metadados antes que a publicação continue

## Sequência de lançamento npm estável

Ao preparar um lançamento npm estável:

1. Execute `OpenClaw NPM Release` com `preflight_only=true`
   - Antes que uma tag exista, você pode usar o SHA completo atual do commit da branch do fluxo de trabalho
     para uma execução simulada apenas de validação do fluxo de trabalho de preflight
2. Escolha `npm_dist_tag=beta` para o fluxo normal com beta primeiro, ou `latest` somente
   quando você quiser intencionalmente uma publicação estável direta
3. Execute `Full Release Validation` na branch de lançamento, tag de lançamento ou SHA completo
   do commit quando quiser CI normal mais cache de prompts ao vivo, Docker, QA Lab,
   Matrix e cobertura do Telegram a partir de um fluxo de trabalho manual
4. Se você intencionalmente precisa apenas do grafo de testes normal determinístico, execute o
   fluxo de trabalho manual `CI` na referência de lançamento em vez disso
5. Salve o `preflight_run_id` bem-sucedido
6. Execute `OpenClaw NPM Release` novamente com `preflight_only=false`, a mesma
   `tag`, o mesmo `npm_dist_tag` e o `preflight_run_id` salvo
7. Se o lançamento chegou em `beta`, use o fluxo de trabalho privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover essa versão estável de `beta` para `latest`
8. Se o lançamento foi publicado intencionalmente diretamente em `latest` e `beta`
   deve seguir a mesma build estável imediatamente, use esse mesmo fluxo de trabalho privado
   para apontar ambas as dist-tags para a versão estável, ou deixe a sincronização programada
   de autocorreção mover `beta` posteriormente

A mutação de dist-tag fica no repositório privado por segurança, porque ainda
exige `NPM_TOKEN`, enquanto o repositório público mantém publicação somente com OIDC.

Isso mantém tanto o caminho de publicação direta quanto o caminho de promoção com beta primeiro
documentados e visíveis para o operador.

Se um mantenedor precisar recorrer à autenticação npm local, execute quaisquer comandos da CLI
do 1Password (`op`) somente dentro de uma sessão tmux dedicada. Não chame `op`
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

Os mantenedores usam a documentação privada de lançamento em
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
para o runbook real.

## Relacionado

- [Canais de lançamento](/pt-BR/install/development-channels)
