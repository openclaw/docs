---
read_when:
    - Executando ou reexecutando a validação completa de lançamento
    - Comparando os perfis de validação de lançamento estável e completo
    - Depurando falhas na etapa de validação de lançamento
summary: Estágios de Validação Completa de Lançamento, fluxos de trabalho filhos, perfis de lançamento, identificadores de reexecução e evidências
title: Validação completa de lançamento
x-i18n:
    generated_at: "2026-05-03T21:37:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 038901ad751c00b35f69d7ec5caf74e577dcf2350d7658037c3ecc9ff5fab6d7
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` é o guarda-chuva da release. Ele é o único ponto de entrada
manual para prova pré-release, mas a maior parte do trabalho acontece em workflows
filhos para que uma caixa com falha possa ser executada novamente sem reiniciar a
release inteira.

Execute-o a partir de uma ref de workflow confiável, normalmente `main`, e passe a branch
de release, a tag ou o SHA completo do commit como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Os workflows filhos usam a ref de workflow confiável para o harness e o `ref`
de entrada para o candidato em teste. Isso mantém a nova lógica de validação
disponível ao validar uma branch ou tag de release mais antiga.

A Aceitação de Pacote normalmente cria o tarball candidato a partir do `ref`
resolvido, incluindo execuções com SHA completo disparadas com `pnpm ci:full-release`.
Após a publicação, passe `package_acceptance_package_spec=openclaw@YYYY.M.D` (ou
`openclaw@beta`/`openclaw@latest`) para executar a mesma matriz de pacote/atualização
contra o pacote npm entregue.

## Estágios de nível superior

| Estágio              | Detalhes                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resolução do alvo    | **Job:** `Resolve target ref`<br />**Workflow filho:** nenhum<br />**Comprova:** resolve a branch de release, a tag ou o SHA completo do commit e registra as entradas selecionadas.<br />**Nova execução:** execute novamente o guarda-chuva se isso falhar.                                                                                                                                             |
| Vitest e CI normal   | **Job:** `Run normal full CI`<br />**Workflow filho:** `CI`<br />**Comprova:** grafo de CI completo manual contra a ref alvo, incluindo lanes Linux Node, shards de Plugin empacotados, contratos de canais, compatibilidade com Node 22, `check`, `check-additional`, smoke de build, verificações de docs, Skills Python, Windows, macOS, i18n da Control UI e Android pelo guarda-chuva.<br />**Nova execução:** `rerun_group=ci`. |
| Pré-release de Plugin | **Job:** `Run plugin prerelease validation`<br />**Workflow filho:** `Plugin Prerelease`<br />**Comprova:** verificações estáticas de Plugin exclusivas de release, cobertura agêntica de Plugin, shards do lote completo de extensões e lanes Docker de pré-release de Plugin.<br />**Nova execução:** `rerun_group=plugin-prerelease`.                                                                    |
| Verificações de release | **Job:** `Run release/live/Docker/QA validation`<br />**Workflow filho:** `OpenClaw Release Checks`<br />**Comprova:** smoke de instalação, verificações de pacote entre sistemas operacionais, suítes live/E2E, chunks do caminho de release Docker, Aceitação de Pacote, paridade do QA Lab, Matrix live e Telegram live.<br />**Nova execução:** `rerun_group=release-checks` ou um handle mais restrito de release-checks. |
| Artefato de pacote   | **Job:** `Prepare release package artifact`<br />**Workflow filho:** nenhum<br />**Comprova:** cria o tarball pai `release-package-under-test` cedo o suficiente para verificações voltadas a pacote que não precisam esperar por `OpenClaw Release Checks`.<br />**Nova execução:** execute novamente o guarda-chuva ou forneça `npm_telegram_package_spec` para `rerun_group=npm-telegram`.                      |
| Pacote Telegram      | **Job:** `Run package Telegram E2E`<br />**Workflow filho:** `NPM Telegram Beta E2E`<br />**Comprova:** prova de pacote Telegram baseada no artefato pai para `rerun_group=all` com `release_profile=full`, ou prova de Telegram com pacote publicado quando `npm_telegram_package_spec` está definido.<br />**Nova execução:** `rerun_group=npm-telegram` com `npm_telegram_package_spec`.                    |
| Verificador do guarda-chuva | **Job:** `Verify full validation`<br />**Workflow filho:** nenhum<br />**Comprova:** verifica novamente as conclusões registradas das execuções filhas e anexa tabelas dos jobs mais lentos dos workflows filhos.<br />**Nova execução:** execute novamente apenas este job depois de reexecutar um filho com falha até ficar verde.                                                                 |

Para `ref=main` e `rerun_group=all`, um guarda-chuva mais novo substitui um mais antigo.
Quando o pai é cancelado, seu monitor cancela qualquer workflow filho que ele já
tenha disparado. Execuções de validação de branch e tag de release não se cancelam
por padrão.

## Estágios das verificações de release

`OpenClaw Release Checks` é o maior workflow filho. Ele resolve o alvo uma vez
e prepara um artefato compartilhado `release-package-under-test` quando estágios
voltados a pacote ou Docker precisam dele.

| Estágio             | Detalhes                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alvo da release     | **Job:** `Resolve target ref`<br />**Workflow de apoio:** nenhum<br />**Testa:** ref selecionada, SHA esperado opcional, perfil, grupo de nova execução e filtro focado da suíte live.<br />**Nova execução:** `rerun_group=release-checks`.                                                                                                                                                                      |
| Artefato de pacote  | **Job:** `Prepare release package artifact`<br />**Workflow de apoio:** nenhum<br />**Testa:** empacota ou resolve um tarball candidato e envia `release-package-under-test` para verificações downstream voltadas a pacote.<br />**Nova execução:** o grupo de pacote, cross-OS ou live/E2E afetado.                                                                                                           |
| Smoke de instalação | **Job:** `Run install smoke`<br />**Workflow de apoio:** `Install Smoke`<br />**Testa:** caminho completo de instalação com reutilização da imagem smoke do Dockerfile raiz, instalação de pacote QR, smokes Docker de raiz e Gateway, testes Docker do instalador, smoke de provider de imagem com instalação global Bun e E2E rápido de instalação/desinstalação de Plugin empacotado.<br />**Nova execução:** `rerun_group=install-smoke`. |
| Cross-OS            | **Job:** `cross_os_release_checks`<br />**Workflow de apoio:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Testa:** lanes novas e de upgrade em Linux, Windows e macOS para o provider e modo selecionados, usando o tarball candidato mais um pacote de baseline.<br />**Nova execução:** `rerun_group=cross-os`.                                                                                  |
| Repo e E2E live     | **Job:** `Run repo/live E2E validation`<br />**Workflow de apoio:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testa:** E2E do repositório, cache live, streaming websocket da OpenAI, provider live nativo e shards de Plugin, e harnesses live com Docker para modelo/backend/Gateway selecionados por `release_profile`.<br />**Nova execução:** `rerun_group=live-e2e`, opcionalmente com `live_suite_filter`. |
| Caminho de release Docker | **Job:** `Run Docker release-path validation`<br />**Workflow de apoio:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testa:** chunks Docker do caminho de release contra o artefato de pacote compartilhado.<br />**Nova execução:** `rerun_group=live-e2e`.                                                                                                                                             |
| Aceitação de Pacote | **Job:** `Run package acceptance`<br />**Workflow de apoio:** `Package Acceptance`<br />**Testa:** fixtures offline de pacote de Plugin, atualização de Plugin, aceitação de pacote Telegram com mock da OpenAI e verificações de sobrevivência de upgrade publicado a partir de toda release npm estável em ou após `2026.4.23` contra o mesmo tarball.<br />**Nova execução:** `rerun_group=package`.          |
| Paridade de QA      | **Job:** `Run QA Lab parity lane` e `Run QA Lab parity report`<br />**Workflow de apoio:** jobs diretos<br />**Testa:** pacotes de paridade agêntica do candidato e do baseline, depois o relatório de paridade.<br />**Nova execução:** `rerun_group=qa-parity` ou `rerun_group=qa`.                                                                                                                            |
| Matrix live de QA   | **Job:** `Run QA Lab live Matrix lane`<br />**Workflow de apoio:** job direto<br />**Testa:** perfil rápido de QA live Matrix no ambiente `qa-live-shared`.<br />**Nova execução:** `rerun_group=qa-live` ou `rerun_group=qa`.                                                                                                                                                                                |
| Telegram live de QA | **Job:** `Run QA Lab live Telegram lane`<br />**Workflow de apoio:** job direto<br />**Testa:** QA live do Telegram com leases de credenciais Convex CI.<br />**Nova execução:** `rerun_group=qa-live` ou `rerun_group=qa`.                                                                                                                                                                                     |
| Verificador de release | **Job:** `Verify release checks`<br />**Workflow de apoio:** nenhum<br />**Testa:** jobs de release-check obrigatórios para o grupo de nova execução selecionado.<br />**Nova execução:** execute novamente depois que os jobs filhos focados passarem.                                                                                                                                                       |

## Chunks do caminho de release Docker

O estágio do caminho de release Docker executa estes chunks quando `live_suite_filter` está
vazio:

| Chunk                                                           | Cobertura                                                               |
| --------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `core`                                                          | Lanes smoke do caminho de release Docker do Core.                      |
| `package-update-openai`                                         | Comportamento de instalação e atualização do pacote OpenAI.            |
| `package-update-anthropic`                                      | Comportamento de instalação e atualização do pacote Anthropic.         |
| `package-update-core`                                           | Comportamento de pacote e atualização neutro em relação a provider.    |
| `plugins-runtime-plugins`                                       | Lanes de runtime de Plugin que exercitam comportamento de Plugin.      |
| `plugins-runtime-services`                                      | Lanes de runtime de Plugin apoiadas por serviço; inclui OpenWebUI quando solicitado. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Lotes de instalação/runtime de Plugin divididos para validação de release paralela. |

Use `docker_lanes=<lane[,lane]>` direcionado no workflow reutilizável live/E2E quando
apenas uma lane do Docker falhar. Os artefatos de release incluem comandos de
reexecução por lane com entradas de reutilização de artefato de pacote e imagem
quando disponíveis.

## Perfis de release

`release_profile` controla principalmente a abrangência live/provedor dentro das verificações de release.
Ele não remove a CI completa normal, Pré-lançamento de Plugin, smoke de instalação, aceitação de
pacote, QA Lab nem blocos do caminho de release do Docker. `full` também faz a
execução agregadora rodar o E2E do Telegram do pacote contra o artefato de pacote de release pai quando
`rerun_group=all`, então um candidato completo de pré-publicação não pula silenciosamente essa
lane de pacote do Telegram.

| Perfil    | Uso pretendido                    | Cobertura live/provedor incluída                                                                                                                                                    |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Smoke crítico de release mais rápido. | Caminho live OpenAI/core, modelos live do Docker para OpenAI, núcleo do gateway nativo, perfil de gateway OpenAI nativo, plugin OpenAI nativo e gateway live OpenAI do Docker.      |
| `stable`  | Perfil padrão de aprovação de release. | `minimum` mais smoke do Anthropic, Google, MiniMax, backend, harness de teste live nativo, backend de CLI live do Docker, bind ACP do Docker, harness Codex do Docker e um shard de smoke OpenCode Go. |
| `full`    | Varredura consultiva ampla.       | `stable` mais provedores consultivos, shards live de plugins e shards live de mídia.                                                                                                |

## Adições apenas de full

Estas suítes são puladas por `stable` e incluídas por `full`:

| Área                             | Cobertura apenas de full                                                                                                     |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Modelos live do Docker           | OpenCode Go, OpenRouter, xAI, Z.ai e Fireworks.                                                                              |
| Gateway live do Docker           | Provedores consultivos divididos em shards DeepSeek/Fireworks, OpenCode Go/OpenRouter e xAI/Z.ai.                            |
| Perfis de provedor do gateway nativo | Shards completos Anthropic Opus e Sonnet/Haiku, Fireworks, DeepSeek, shards completos de modelos OpenCode Go, OpenRouter, xAI e Z.ai. |
| Shards live de plugins nativos   | Plugins A-K, L-N, O-Z outros, Moonshot e xAI.                                                                                |
| Shards live de mídia nativos     | Áudio, música do Google, música do MiniMax e grupos de vídeo A-D.                                                            |

`stable` inclui `native-live-src-gateway-profiles-anthropic-smoke` e
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` usa os shards mais amplos
de modelos Anthropic e OpenCode Go em vez disso. Reexecuções focadas ainda podem usar os
identificadores agregados `native-live-src-gateway-profiles-anthropic` ou
`native-live-src-gateway-profiles-opencode-go`.

## Reexecuções focadas

Use `rerun_group` para evitar repetir caixas de release não relacionadas:

| Identificador       | Escopo                                                                |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Todos os estágios de Validação Completa de Release.                   |
| `ci`                | Apenas filho de CI completa manual.                                   |
| `plugin-prerelease` | Apenas filho de Pré-lançamento de Plugin.                             |
| `release-checks`    | Todos os estágios de Verificações de Release do OpenClaw.             |
| `install-smoke`     | Smoke de instalação por meio das verificações de release.             |
| `cross-os`          | Verificações de release entre sistemas operacionais.                  |
| `live-e2e`          | Validação E2E do repo/live e do caminho de release do Docker.         |
| `package`           | Aceitação de Pacote.                                                  |
| `qa`                | Paridade de QA mais lanes live de QA.                                 |
| `qa-parity`         | Apenas lanes e relatório de paridade de QA.                           |
| `qa-live`           | Apenas Matrix live de QA e Telegram.                                  |
| `npm-telegram`      | E2E do Telegram de pacote publicado; exige `npm_telegram_package_spec`. |

Use `live_suite_filter` com `rerun_group=live-e2e` quando uma suíte live falhar.
IDs de filtro válidos são definidos no workflow reutilizável live/E2E, incluindo
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` e
`live-codex-harness-docker`.

O identificador `live-gateway-advisory-docker` é um identificador de reexecução agregada para seus
três shards de provedor, então ele ainda se expande para todos os jobs consultivos de gateway Docker.

## Evidências a manter

Mantenha o resumo de `Full Release Validation` como o índice em nível de release. Ele vincula
IDs de execuções filhas e inclui tabelas dos jobs mais lentos. Para falhas, inspecione primeiro o workflow filho
e depois reexecute o menor identificador correspondente acima.

Artefatos úteis:

- `release-package-under-test` do pai de Validação Completa de Release e `OpenClaw Release Checks`
- Artefatos do caminho de release do Docker em `.artifacts/docker-tests/`
- `package-under-test` da Aceitação de Pacote e artefatos de aceitação do Docker
- Artefatos de verificação de release entre sistemas operacionais para cada SO e suíte
- Artefatos de paridade de QA, Matrix e Telegram

## Arquivos de workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
