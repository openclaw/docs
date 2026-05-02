---
read_when:
    - Executando ou reexecutando a validação completa de lançamento
    - Comparação entre os perfis de validação de lançamento estável e completo
    - Depuração de falhas na etapa de validação de lançamento
summary: Estágios da Validação Completa de Release, fluxos de trabalho filhos, perfis de release, identificadores de reexecução e evidências
title: Validação completa de lançamento
x-i18n:
    generated_at: "2026-05-02T21:03:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ce1e5a72227ca202335fe68b537491a0b68a0bb2af431aa56c41cf20989e88c
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` é o guarda-chuva de release. Ele é o único ponto de entrada
manual para prova de pré-release, mas a maior parte do trabalho acontece em
workflows filhos para que uma máquina com falha possa ser executada novamente sem
reiniciar todo o release.

Execute-o a partir de uma referência de workflow confiável, normalmente `main`, e
passe o branch de release, a tag ou o SHA completo do commit como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Os workflows filhos usam a referência de workflow confiável para o harness e o
`ref` de entrada para o candidato em teste. Isso mantém a nova lógica de
validação disponível ao validar um branch ou uma tag de release mais antigo.

A aceitação de pacote normalmente compila o tarball candidato a partir do `ref`
resolvido, incluindo execuções com SHA completo disparadas com
`pnpm ci:full-release`. Após a publicação, passe
`package_acceptance_package_spec=openclaw@YYYY.M.D` (ou `openclaw@beta`/
`openclaw@latest`) para executar a mesma matriz de pacote/atualização contra o
pacote npm enviado.

## Estágios de nível superior

| Estágio              | Detalhes                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resolução do alvo    | **Job:** `Resolve target ref`<br />**Workflow filho:** nenhum<br />**Comprova:** resolve o branch de release, a tag ou o SHA completo do commit e registra as entradas selecionadas.<br />**Reexecução:** reexecute o guarda-chuva se isto falhar.                                                                                                                                          |
| Vitest e CI normal   | **Job:** `Run normal full CI`<br />**Workflow filho:** `CI`<br />**Comprova:** grafo manual completo de CI contra o ref alvo, incluindo lanes Linux Node, shards de Plugin incluídos, contratos de canais, compatibilidade com Node 22, `check`, `check-additional`, smoke de build, verificações de docs, Skills Python, Windows, macOS, i18n da Control UI e Android via o guarda-chuva.<br />**Reexecução:** `rerun_group=ci`. |
| Pré-release de Plugin | **Job:** `Run plugin prerelease validation`<br />**Workflow filho:** `Plugin Prerelease`<br />**Comprova:** verificações estáticas de Plugin somente de release, cobertura agentic de Plugin, shards completos de lote de extensão e lanes Docker de pré-release de Plugin.<br />**Reexecução:** `rerun_group=plugin-prerelease`.                                                           |
| Verificações de release | **Job:** `Run release/live/Docker/QA validation`<br />**Workflow filho:** `OpenClaw Release Checks`<br />**Comprova:** smoke de instalação, verificações de pacote entre sistemas operacionais, suítes live/E2E, partes do caminho de release Docker, aceitação de pacote, paridade do QA Lab, Matrix live e Telegram live.<br />**Reexecução:** `rerun_group=release-checks` ou um identificador de release-checks mais estreito. |
| Telegram de pacote   | **Job:** `Run package Telegram E2E`<br />**Workflow filho:** `NPM Telegram Beta E2E`<br />**Comprova:** prova de pacote Telegram com base em artefato para `rerun_group=all` com `release_profile=full`, ou prova de Telegram com pacote publicado quando `npm_telegram_package_spec` estiver definido.<br />**Reexecução:** `rerun_group=npm-telegram` com `npm_telegram_package_spec`. |
| Verificador do guarda-chuva | **Job:** `Verify full validation`<br />**Workflow filho:** nenhum<br />**Comprova:** verifica novamente as conclusões registradas das execuções filhas e anexa tabelas dos jobs mais lentos dos workflows filhos.<br />**Reexecução:** reexecute somente este job depois de reexecutar um filho com falha até ficar verde.                                                       |

Para `ref=main` e `rerun_group=all`, um guarda-chuva mais novo substitui um mais
antigo. Quando o pai é cancelado, seu monitor cancela qualquer workflow filho que
já tenha disparado. Execuções de validação de branch e tag de release não se
cancelam por padrão.

## Estágios de verificações de release

`OpenClaw Release Checks` é o maior workflow filho. Ele resolve o alvo uma vez e
prepara um artefato `release-package-under-test` compartilhado quando estágios
voltados a pacote ou Docker precisam dele.

| Estágio             | Detalhes                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alvo de release     | **Job:** `Resolve target ref`<br />**Workflow de suporte:** nenhum<br />**Testa:** ref selecionado, SHA esperado opcional, perfil, grupo de reexecução e filtro focado de suíte live.<br />**Reexecução:** `rerun_group=release-checks`.                                                                                                                                                       |
| Artefato de pacote  | **Job:** `Prepare release package artifact`<br />**Workflow de suporte:** nenhum<br />**Testa:** empacota ou resolve um tarball candidato e envia `release-package-under-test` para verificações downstream voltadas a pacote.<br />**Reexecução:** o grupo de pacote, cross-OS ou live/E2E afetado.                                                                                              |
| Smoke de instalação | **Job:** `Run install smoke`<br />**Workflow de suporte:** `Install Smoke`<br />**Testa:** caminho completo de instalação com reutilização da imagem de smoke do Dockerfile raiz, instalação de pacote QR, smokes Docker raiz e Gateway, testes Docker do instalador, smoke de provedor de imagem com instalação global Bun e E2E rápido de instalar/desinstalar Plugin incluído.<br />**Reexecução:** `rerun_group=install-smoke`. |
| Cross-OS            | **Job:** `cross_os_release_checks`<br />**Workflow de suporte:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Testa:** lanes novas e de upgrade no Linux, Windows e macOS para o provedor e modo selecionados, usando o tarball candidato mais um pacote de baseline.<br />**Reexecução:** `rerun_group=cross-os`.                                                                    |
| E2E de repo e live  | **Job:** `Run repo/live E2E validation`<br />**Workflow de suporte:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testa:** E2E do repositório, cache live, streaming websocket da OpenAI, shards de provedor live nativo e Plugin, e harnesses live com Docker para modelo/backend/Gateway selecionados por `release_profile`.<br />**Reexecução:** `rerun_group=live-e2e`, opcionalmente com `live_suite_filter`. |
| Caminho de release Docker | **Job:** `Run Docker release-path validation`<br />**Workflow de suporte:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testa:** partes Docker do caminho de release contra o artefato de pacote compartilhado.<br />**Reexecução:** `rerun_group=live-e2e`.                                                                                                                             |
| Aceitação de pacote | **Job:** `Run package acceptance`<br />**Workflow de suporte:** `Package Acceptance`<br />**Testa:** fixtures offline de pacote de Plugin, atualização de Plugin, aceitação de pacote Telegram com mock da OpenAI e verificações de sobrevivência de upgrade publicado de todos os releases npm estáveis em ou após `2026.4.23` contra o mesmo tarball.<br />**Reexecução:** `rerun_group=package`. |
| Paridade de QA      | **Job:** `Run QA Lab parity lane` e `Run QA Lab parity report`<br />**Workflow de suporte:** jobs diretos<br />**Testa:** pacotes de paridade agentic do candidato e da baseline, depois o relatório de paridade.<br />**Reexecução:** `rerun_group=qa-parity` ou `rerun_group=qa`.                                                                                                             |
| Matrix live de QA   | **Job:** `Run QA Lab live Matrix lane`<br />**Workflow de suporte:** job direto<br />**Testa:** perfil rápido de QA Matrix live no ambiente `qa-live-shared`.<br />**Reexecução:** `rerun_group=qa-live` ou `rerun_group=qa`.                                                                                                                                                                    |
| Telegram live de QA | **Job:** `Run QA Lab live Telegram lane`<br />**Workflow de suporte:** job direto<br />**Testa:** QA Telegram live com locações de credenciais Convex CI.<br />**Reexecução:** `rerun_group=qa-live` ou `rerun_group=qa`.                                                                                                                                                                        |
| Verificador de release | **Job:** `Verify release checks`<br />**Workflow de suporte:** nenhum<br />**Testa:** jobs obrigatórios de release-check para o grupo de reexecução selecionado.<br />**Reexecução:** reexecute depois que jobs filhos focados passarem.                                                                                                                                                    |

## Partes do caminho de release Docker

O estágio de caminho de release Docker executa estas partes quando
`live_suite_filter` está vazio:

| Parte                                                           | Cobertura                                                               |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Lanes de smoke do caminho de release Docker do core.                    |
| `package-update-openai`                                         | Comportamento de instalação e atualização de pacote OpenAI.             |
| `package-update-anthropic`                                      | Comportamento de instalação e atualização de pacote Anthropic.          |
| `package-update-core`                                           | Comportamento de pacote e atualização neutro em relação a provedor.     |
| `plugins-runtime-plugins`                                       | Lanes de runtime de Plugin que exercitam comportamento de Plugin.       |
| `plugins-runtime-services`                                      | Lanes de runtime de Plugin com suporte de serviços; inclui OpenWebUI quando solicitado. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Lotes de instalação/runtime de Plugin divididos para validação paralela de release. |

Use `docker_lanes=<lane[,lane]>` direcionado no workflow live/E2E reutilizável
quando apenas uma lane Docker falhar. Os artefatos de release incluem comandos
de reexecução por lane com artefato de pacote e entradas de reutilização de
imagem quando disponíveis.

## Perfis de release

`release_profile` controla principalmente a abrangência live/de provedores dentro das verificações de release.
Ele não remove a CI completa normal, Plugin Prerelease, install smoke, aceitação de pacote, QA Lab nem trechos do caminho de release do Docker. `full` também faz a execução guarda-chuva rodar o E2E do pacote Telegram contra o artefato do pacote de release quando `rerun_group=all`, para que um candidato completo de pré-publicação não pule silenciosamente essa faixa de pacote Telegram.

| Perfil    | Uso pretendido                    | Cobertura live/de provedores incluída                                                                                                                                                    |
| --------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Smoke mais rápido crítico para release. | Caminho live do OpenAI/núcleo, modelos live Docker para OpenAI, núcleo do Gateway nativo, perfil de Gateway OpenAI nativo, Plugin OpenAI nativo e Gateway OpenAI live Docker.          |
| `stable`  | Perfil padrão de aprovação de release. | `minimum` mais Anthropic, Google, MiniMax, backend, harness de teste live nativo, backend de CLI live Docker, bind ACP Docker, harness Codex Docker e um shard de smoke OpenCode Go. |
| `full`    | Varredura consultiva ampla.       | `stable` mais provedores consultivos, shards live de Plugins e shards live de mídia.                                                                                                     |

## Adições somente do perfil completo

Estas suítes são ignoradas por `stable` e incluídas por `full`:

| Área                             | Cobertura somente do perfil completo                                           |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Modelos live Docker              | OpenCode Go, OpenRouter, xAI, Z.ai e Fireworks.                                 |
| Gateway live Docker              | Shard consultivo para DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI e Z.ai. |
| Perfis de provedor do Gateway nativo | Fireworks, DeepSeek, shards completos de modelo OpenCode Go, OpenRouter, xAI e Z.ai. |
| Shards live de Plugin nativo     | Plugins A-K, L-N, O-Z outros, Moonshot e xAI.                                   |
| Shards live de mídia nativa      | Áudio, música do Google, música do MiniMax e grupos de vídeo A-D.               |

`stable` inclui `native-live-src-gateway-profiles-opencode-go-smoke`; `full`
usa os shards mais amplos de modelo OpenCode Go em vez disso.

## Reexecuções focadas

Use `rerun_group` para evitar repetir caixas de release não relacionadas:

| Identificador       | Escopo                                                                |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Todos os estágios de Full Release Validation.                         |
| `ci`                | Somente filho de CI completa manual.                                  |
| `plugin-prerelease` | Somente filho de Plugin Prerelease.                                   |
| `release-checks`    | Todos os estágios de OpenClaw Release Checks.                         |
| `install-smoke`     | Install Smoke por meio das verificações de release.                   |
| `cross-os`          | Verificações de release Cross-OS.                                     |
| `live-e2e`          | Validação E2E repo/live e do caminho de release Docker.               |
| `package`           | Package Acceptance.                                                   |
| `qa`                | Paridade de QA mais faixas live de QA.                                |
| `qa-parity`         | Somente faixas e relatório de paridade de QA.                         |
| `qa-live`           | Somente Matrix live de QA e Telegram.                                 |
| `npm-telegram`      | E2E Telegram de pacote publicado; requer `npm_telegram_package_spec`. |

Use `live_suite_filter` com `rerun_group=live-e2e` quando uma suíte live falhar.
IDs de filtro válidos são definidos no workflow live/E2E reutilizável, incluindo
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` e
`live-codex-harness-docker`.

## Evidências a manter

Mantenha o resumo de `Full Release Validation` como o índice no nível de release. Ele vincula
IDs de execução filhos e inclui tabelas dos jobs mais lentos. Para falhas, inspecione primeiro o
workflow filho e depois reexecute o menor identificador correspondente acima.

Artefatos úteis:

- `release-package-under-test` de `OpenClaw Release Checks`
- Artefatos do caminho de release Docker em `.artifacts/docker-tests/`
- `package-under-test` de Package Acceptance e artefatos de aceitação Docker
- Artefatos de verificação de release Cross-OS para cada SO e suíte
- Artefatos de paridade de QA, Matrix e Telegram

## Arquivos de workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
