---
read_when:
    - Executando ou reexecutando a Validação Completa de Release
    - Comparando os perfis estável e completo de validação de release
    - Depurando falhas na etapa de validação de lançamento
summary: Estágios da validação completa de lançamento, fluxos de trabalho filhos, perfis de lançamento, identificadores de reexecução e evidências
title: Validação completa da versão
x-i18n:
    generated_at: "2026-05-02T05:56:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: feb4edec850fb97405575c869547b4851bc773507321690670553e6faafc8b0b
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` é o guarda-chuva de lançamento. Ele é o único ponto de entrada manual para a comprovação pré-lançamento, mas a maior parte do trabalho acontece em fluxos de trabalho filhos, para que uma caixa com falha possa ser executada novamente sem reiniciar todo o lançamento.

Execute-o a partir de uma referência de fluxo de trabalho confiável, normalmente `main`, e passe a branch de lançamento, tag ou SHA completo do commit como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Os fluxos de trabalho filhos usam a referência de fluxo de trabalho confiável para o harness e o `ref` de entrada para o candidato em teste. Isso mantém a nova lógica de validação disponível ao validar uma branch ou tag de lançamento mais antiga.

## Estágios de nível superior

| Estágio              | Detalhes                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resolução do alvo    | **Job:** `Resolve target ref`<br />**Fluxo de trabalho filho:** nenhum<br />**Comprova:** resolve a branch de lançamento, tag ou SHA completo do commit e registra as entradas selecionadas.<br />**Reexecutar:** reexecute o guarda-chuva se isso falhar.                                                                                                                                                         |
| Vitest e CI normal   | **Job:** `Run normal full CI`<br />**Fluxo de trabalho filho:** `CI`<br />**Comprova:** grafo completo manual de CI contra o ref alvo, incluindo lanes Linux Node, shards de Plugin empacotados, contratos de canal, compatibilidade com Node 22, `check`, `check-additional`, smoke de build, verificações de docs, Skills Python, Windows, macOS, i18n da Control UI e Android via guarda-chuva.<br />**Reexecutar:** `rerun_group=ci`. |
| Pré-lançamento de Plugin | **Job:** `Run plugin prerelease validation`<br />**Fluxo de trabalho filho:** `Plugin Prerelease`<br />**Comprova:** verificações estáticas de Plugin somente de lançamento, cobertura agêntica de Plugin, shards completos de lote de extensão e lanes Docker de pré-lançamento de Plugin.<br />**Reexecutar:** `rerun_group=plugin-prerelease`.                                                               |
| Verificações de lançamento | **Job:** `Run release/live/Docker/QA validation`<br />**Fluxo de trabalho filho:** `OpenClaw Release Checks`<br />**Comprova:** smoke de instalação, verificações de pacote entre sistemas operacionais, suítes live/E2E, chunks de caminho de lançamento Docker, Package Acceptance, paridade QA Lab, Matrix live e Telegram live.<br />**Reexecutar:** `rerun_group=release-checks` ou um handle de release-checks mais estreito. |
| Pacote Telegram      | **Job:** `Run package Telegram E2E`<br />**Fluxo de trabalho filho:** `NPM Telegram Beta E2E`<br />**Comprova:** comprovação de pacote Telegram baseada em artefato para `rerun_group=all` com `release_profile=full`, ou comprovação Telegram de pacote publicado quando `npm_telegram_package_spec` está definido.<br />**Reexecutar:** `rerun_group=npm-telegram` com `npm_telegram_package_spec`.             |
| Verificador guarda-chuva | **Job:** `Verify full validation`<br />**Fluxo de trabalho filho:** nenhum<br />**Comprova:** verifica novamente as conclusões registradas das execuções filhas e acrescenta tabelas dos jobs mais lentos dos fluxos de trabalho filhos.<br />**Reexecutar:** reexecute apenas este job depois de reexecutar um filho com falha até ficar verde.                                                                 |

Para `ref=main` e `rerun_group=all`, um guarda-chuva mais novo substitui um mais antigo. Quando o pai é cancelado, o monitor dele cancela qualquer fluxo de trabalho filho que já tenha disparado. Execuções de validação de branch e tag de lançamento não cancelam umas às outras por padrão.

## Estágios das verificações de lançamento

`OpenClaw Release Checks` é o maior fluxo de trabalho filho. Ele resolve o alvo uma vez e prepara um artefato compartilhado `release-package-under-test` quando estágios voltados a pacote ou Docker precisam dele.

| Estágio             | Detalhes                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alvo de lançamento  | **Job:** `Resolve target ref`<br />**Fluxo de trabalho de suporte:** nenhum<br />**Testes:** ref selecionado, SHA esperado opcional, perfil, grupo de reexecução e filtro focado de suíte live.<br />**Reexecutar:** `rerun_group=release-checks`.                                                                                                                                                               |
| Artefato de pacote  | **Job:** `Prepare release package artifact`<br />**Fluxo de trabalho de suporte:** nenhum<br />**Testes:** empacota ou resolve um tarball candidato e envia `release-package-under-test` para verificações downstream voltadas a pacote.<br />**Reexecutar:** o grupo afetado de pacote, cross-OS ou live/E2E.                                                                                                 |
| Smoke de instalação | **Job:** `Run install smoke`<br />**Fluxo de trabalho de suporte:** `Install Smoke`<br />**Testes:** caminho completo de instalação com reutilização da imagem smoke do Dockerfile raiz, instalação de pacote QR, smokes Docker raiz e de Gateway, testes Docker do instalador, smoke de provedor de imagem em instalação global Bun e E2E rápido de instalação/desinstalação de Plugin empacotado.<br />**Reexecutar:** `rerun_group=install-smoke`. |
| Cross-OS            | **Job:** `cross_os_release_checks`<br />**Fluxo de trabalho de suporte:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Testes:** lanes novas e de upgrade no Linux, Windows e macOS para o provedor e modo selecionados, usando o tarball candidato mais um pacote baseline.<br />**Reexecutar:** `rerun_group=cross-os`.                                                                                |
| Repo e E2E live     | **Job:** `Run repo/live E2E validation`<br />**Fluxo de trabalho de suporte:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testes:** E2E do repositório, cache live, streaming websocket da OpenAI, shards nativos live de provedor e Plugin, e harnesses live baseados em Docker para modelo/backend/Gateway selecionados por `release_profile`.<br />**Reexecutar:** `rerun_group=live-e2e`, opcionalmente com `live_suite_filter`. |
| Caminho de lançamento Docker | **Job:** `Run Docker release-path validation`<br />**Fluxo de trabalho de suporte:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testes:** chunks Docker de caminho de lançamento contra o artefato de pacote compartilhado.<br />**Reexecutar:** `rerun_group=live-e2e`.                                                                                                                               |
| Package Acceptance  | **Job:** `Run package acceptance`<br />**Fluxo de trabalho de suporte:** `Package Acceptance`<br />**Testes:** fixtures offline de pacote de Plugin, atualização de Plugin e aceitação de pacote Telegram com mock da OpenAI contra o mesmo tarball.<br />**Reexecutar:** `rerun_group=package`.                                                                                                                   |
| Paridade QA         | **Job:** `Run QA Lab parity lane` e `Run QA Lab parity report`<br />**Fluxo de trabalho de suporte:** jobs diretos<br />**Testes:** pacotes de paridade agêntica do candidato e do baseline, depois o relatório de paridade.<br />**Reexecutar:** `rerun_group=qa-parity` ou `rerun_group=qa`.                                                                                                                    |
| Matrix QA live      | **Job:** `Run QA Lab live Matrix lane`<br />**Fluxo de trabalho de suporte:** job direto<br />**Testes:** perfil rápido de QA Matrix live no ambiente `qa-live-shared`.<br />**Reexecutar:** `rerun_group=qa-live` ou `rerun_group=qa`.                                                                                                                                                                           |
| Telegram QA live    | **Job:** `Run QA Lab live Telegram lane`<br />**Fluxo de trabalho de suporte:** job direto<br />**Testes:** QA Telegram live com leases de credenciais Convex CI.<br />**Reexecutar:** `rerun_group=qa-live` ou `rerun_group=qa`.                                                                                                                                                                                  |
| Verificador de lançamento | **Job:** `Verify release checks`<br />**Fluxo de trabalho de suporte:** nenhum<br />**Testes:** jobs obrigatórios de release-checks para o grupo de reexecução selecionado.<br />**Reexecutar:** reexecute depois que jobs filhos focados passarem.                                                                                                                                                             |

## Chunks de caminho de lançamento Docker

O estágio de caminho de lançamento Docker executa estes chunks quando `live_suite_filter` está vazio:

| Chunk                                                           | Cobertura                                                               |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Lanes smoke de caminho de lançamento Docker do core.                    |
| `package-update-openai`                                         | Comportamento de instalação e atualização de pacote OpenAI.             |
| `package-update-anthropic`                                      | Comportamento de instalação e atualização de pacote Anthropic.          |
| `package-update-core`                                           | Comportamento de pacote e atualização independente de provedor.         |
| `plugins-runtime-plugins`                                       | Lanes de runtime de Plugin que exercitam comportamento de Plugin.       |
| `plugins-runtime-services`                                      | Lanes de runtime de Plugin com suporte de serviço; inclui OpenWebUI quando solicitado. |
| `plugins-runtime-install-a` até `plugins-runtime-install-h`     | Lotes de instalação/runtime de Plugin divididos para validação de lançamento paralela. |

Use `docker_lanes=<lane[,lane]>` direcionado no fluxo de trabalho live/E2E reutilizável quando apenas uma lane Docker falhar. Os artefatos de lançamento incluem comandos de reexecução por lane com entradas de artefato de pacote e reutilização de imagem quando disponíveis.

## Perfis de lançamento

`release_profile` controla principalmente a amplitude live/provedor dentro das verificações de lançamento. Ele não remove CI completo normal, Plugin Prerelease, smoke de instalação, aceitação de pacote, QA Lab nem chunks de caminho de lançamento Docker. `full` também faz o guarda-chuva executar E2E de pacote Telegram contra o artefato de pacote de lançamento quando `rerun_group=all`, para que um candidato completo pré-publicação não pule silenciosamente essa lane de pacote Telegram.

| Perfil    | Uso pretendido                           | Cobertura live/provedor incluída                                                                                                                                                          |
| --------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `minimum` | Smoke mais rápido crítico para release.  | Caminho live OpenAI/core, modelos live do Docker para OpenAI, core do Gateway nativo, perfil de Gateway OpenAI nativo, Plugin OpenAI nativo e Gateway OpenAI live do Docker.              |
| `stable`  | Perfil padrão de aprovação de release.   | `minimum` mais Anthropic, Google, MiniMax, backend, harness de teste live nativo, backend de CLI live do Docker, bind ACP do Docker, harness Codex do Docker e um shard de smoke OpenCode Go. |
| `full`    | Varredura consultiva ampla.              | `stable` mais provedores consultivos, shards live de Plugin e shards live de mídia.                                                                                                       |

## Adições exclusivas de full

Estas suítes são ignoradas por `stable` e incluídas por `full`:

| Área                              | Cobertura exclusiva de full                                                       |
| --------------------------------- | --------------------------------------------------------------------------------- |
| Modelos live do Docker            | OpenCode Go, OpenRouter, xAI, Z.ai e Fireworks.                                   |
| Gateway live do Docker            | Shard consultivo para DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI e Z.ai.   |
| Perfis de provedor do Gateway nativo | Fireworks, DeepSeek, shards completos de modelo OpenCode Go, OpenRouter, xAI e Z.ai. |
| Shards live de Plugin nativo      | Plugins A-K, L-N, O-Z outros, Moonshot e xAI.                                     |
| Shards live de mídia nativa       | Áudio, música do Google, música do MiniMax e grupos de vídeo A-D.                 |

`stable` inclui `native-live-src-gateway-profiles-opencode-go-smoke`; `full`
usa os shards mais amplos de modelo OpenCode Go em vez disso.

## Reexecuções focadas

Use `rerun_group` para evitar repetir caixas de release não relacionadas:

| Handle              | Escopo                                                                 |
| ------------------- | ---------------------------------------------------------------------- |
| `all`               | Todos os estágios de Validação Completa de Release.                    |
| `ci`                | Apenas filho manual de CI completo.                                    |
| `plugin-prerelease` | Apenas filho de Pré-lançamento de Plugin.                              |
| `release-checks`    | Todos os estágios de Verificações de Release do OpenClaw.              |
| `install-smoke`     | Smoke de instalação até verificações de release.                       |
| `cross-os`          | Verificações de release entre sistemas operacionais.                   |
| `live-e2e`          | Validação E2E repo/live e do caminho de release do Docker.             |
| `package`           | Aceitação de Pacote.                                                   |
| `qa`                | Paridade de QA mais lanes live de QA.                                  |
| `qa-parity`         | Apenas lanes de paridade de QA e relatório.                            |
| `qa-live`           | Apenas Matrix e Telegram live de QA.                                   |
| `npm-telegram`      | E2E de Telegram de pacote publicado; requer `npm_telegram_package_spec`. |

Use `live_suite_filter` com `rerun_group=live-e2e` quando uma suíte live falhar.
IDs de filtro válidos são definidos no workflow live/E2E reutilizável, incluindo
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` e
`live-codex-harness-docker`.

## Evidências a manter

Mantenha o resumo de `Full Release Validation` como o índice em nível de release. Ele vincula
IDs de execução filhos e inclui tabelas dos jobs mais lentos. Para falhas, inspecione primeiro o
workflow filho e depois reexecute o menor handle correspondente acima.

Artefatos úteis:

- `release-package-under-test` de `OpenClaw Release Checks`
- Artefatos do caminho de release do Docker em `.artifacts/docker-tests/`
- `package-under-test` de Aceitação de Pacote e artefatos de aceitação do Docker
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
