---
read_when:
    - Executando ou reexecutando a validação completa do lançamento
    - Comparando os perfis estável e completo de validação de lançamento
    - Depuração de falhas na etapa de validação de lançamento
summary: Estágios de Validação completa de lançamento, fluxos de trabalho filhos, perfis de lançamento, identificadores de reexecução e evidências
title: Validação completa do lançamento
x-i18n:
    generated_at: "2026-05-01T05:58:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcbfafd744437c160c09a9c508a639781549193669b300e5249023f9f5dd4afe
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` é o guarda-chuva da versão. Ele é o único ponto de entrada
manual para a prova de pré-lançamento, mas a maior parte do trabalho acontece em
workflows filhos para que uma caixa com falha possa ser executada novamente sem
reiniciar a versão inteira.

Execute-o a partir de uma ref de workflow confiável, normalmente `main`, e passe
o branch de versão, a tag ou o SHA completo do commit como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Os workflows filhos usam a ref de workflow confiável para o harness e a entrada
`ref` para o candidato em teste. Isso mantém a nova lógica de validação
disponível ao validar um branch ou uma tag de versão mais antiga.

## Estágios de nível superior

| Estágio               | Detalhes                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resolução do alvo     | **Job:** `Resolve target ref`<br />**Workflow filho:** nenhum<br />**Prova:** resolve o branch de versão, a tag ou o SHA completo do commit e registra as entradas selecionadas.<br />**Executar novamente:** execute novamente o guarda-chuva se isso falhar.                                                                                                                                                    |
| Vitest e CI normal    | **Job:** `Run normal full CI`<br />**Workflow filho:** `CI`<br />**Prova:** grafo de CI completo manual contra a ref alvo, incluindo lanes de Node no Linux, shards de plugins incluídos, contratos de canais, compatibilidade com Node 22, `check`, `check-additional`, smoke de build, verificações de docs, skills Python, Windows, macOS, i18n da Control UI e Android via guarda-chuva.<br />**Executar novamente:** `rerun_group=ci`. |
| Pré-lançamento de Plugin | **Job:** `Run plugin prerelease validation`<br />**Workflow filho:** `Plugin Prerelease`<br />**Prova:** verificações estáticas de plugins somente de versão, cobertura de plugins agênticos, shards de lote completo de extensões e lanes Docker de pré-lançamento de plugins.<br />**Executar novamente:** `rerun_group=plugin-prerelease`.                                                                 |
| Verificações de versão | **Job:** `Run release/live/Docker/QA validation`<br />**Workflow filho:** `OpenClaw Release Checks`<br />**Prova:** smoke de instalação, verificações de pacote entre sistemas operacionais, suítes live/E2E, partes do caminho de versão Docker, Package Acceptance, paridade do QA Lab, Matrix live e Telegram live.<br />**Executar novamente:** `rerun_group=release-checks` ou um handle mais estreito de release-checks. |
| Telegram pós-publicação | **Job:** `Run post-publish Telegram E2E`<br />**Workflow filho:** `NPM Telegram Beta E2E`<br />**Prova:** prova opcional do Telegram com pacote publicado quando `npm_telegram_package_spec` está definido.<br />**Executar novamente:** `rerun_group=npm-telegram`.                                                                                                                                             |
| Verificador do guarda-chuva | **Job:** `Verify full validation`<br />**Workflow filho:** nenhum<br />**Prova:** verifica novamente as conclusões registradas das execuções filhas e acrescenta tabelas dos jobs mais lentos dos workflows filhos.<br />**Executar novamente:** execute novamente apenas este job depois de executar novamente um filho com falha até ficar verde.                                                                 |

Para `ref=main` e `rerun_group=all`, um guarda-chuva mais novo substitui um mais antigo.
Quando o pai é cancelado, seu monitor cancela qualquer workflow filho que já tenha
disparado. Execuções de validação de branch e tag de versão não se cancelam entre
si por padrão.

## Estágios das verificações de versão

`OpenClaw Release Checks` é o maior workflow filho. Ele resolve o alvo uma vez e
prepara um artefato compartilhado `release-package-under-test` quando estágios
voltados a pacotes ou Docker precisam dele.

| Estágio             | Detalhes                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Alvo da versão      | **Job:** `Resolve target ref`<br />**Workflow de suporte:** nenhum<br />**Testes:** ref selecionada, SHA esperado opcional, perfil, grupo de reexecução e filtro focado de suíte live.<br />**Executar novamente:** `rerun_group=release-checks`.                                                                                                                                                                  |
| Artefato de pacote  | **Job:** `Prepare release package artifact`<br />**Workflow de suporte:** nenhum<br />**Testes:** empacota ou resolve um tarball candidato e envia `release-package-under-test` para verificações downstream voltadas a pacotes.<br />**Executar novamente:** o grupo de pacote, cross-OS ou live/E2E afetado.                                                                                                      |
| Smoke de instalação | **Job:** `Run install smoke`<br />**Workflow de suporte:** `Install Smoke`<br />**Testes:** caminho completo de instalação com reutilização da imagem smoke do Dockerfile raiz, instalação de pacote QR, smokes Docker raiz e Gateway, testes Docker do instalador, smoke de provedor de imagem com instalação global via Bun e E2E Docker rápido de plugins incluídos.<br />**Executar novamente:** `rerun_group=install-smoke`. |
| Cross-OS            | **Job:** `cross_os_release_checks`<br />**Workflow de suporte:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Testes:** lanes frescas e de upgrade em Linux, Windows e macOS para o provedor e modo selecionados, usando o tarball candidato mais um pacote de baseline.<br />**Executar novamente:** `rerun_group=cross-os`.                                                                            |
| E2E de repo e live  | **Job:** `Run repo/live E2E validation`<br />**Workflow de suporte:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testes:** E2E de repositório, cache live, streaming websocket da OpenAI, shards de provedor live nativo e plugins, e harnesses live com Docker para modelo/backend/Gateway selecionados por `release_profile`.<br />**Executar novamente:** `rerun_group=live-e2e`, opcionalmente com `live_suite_filter`. |
| Caminho de versão Docker | **Job:** `Run Docker release-path validation`<br />**Workflow de suporte:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testes:** partes Docker do caminho de versão contra o artefato de pacote compartilhado.<br />**Executar novamente:** `rerun_group=live-e2e`.                                                                                                                                         |
| Package Acceptance  | **Job:** `Run package acceptance`<br />**Workflow de suporte:** `Package Acceptance`<br />**Testes:** compatibilidade de dependências de canal incluído nativas do artefato, fixtures offline de pacote de plugin e aceitação de pacote Telegram com OpenAI simulada contra o mesmo tarball.<br />**Executar novamente:** `rerun_group=package`.                                                                   |
| Paridade QA         | **Job:** `Run QA Lab parity lane` e `Run QA Lab parity report`<br />**Workflow de suporte:** jobs diretos<br />**Testes:** pacotes de paridade agêntica do candidato e do baseline, depois o relatório de paridade.<br />**Executar novamente:** `rerun_group=qa-parity` ou `rerun_group=qa`.                                                                                                                      |
| Matrix live QA      | **Job:** `Run QA Lab live Matrix lane`<br />**Workflow de suporte:** job direto<br />**Testes:** perfil QA rápido da Matrix live no ambiente `qa-live-shared`.<br />**Executar novamente:** `rerun_group=qa-live` ou `rerun_group=qa`.                                                                                                                                                                          |
| Telegram live QA    | **Job:** `Run QA Lab live Telegram lane`<br />**Workflow de suporte:** job direto<br />**Testes:** QA live do Telegram com concessões de credenciais Convex CI.<br />**Executar novamente:** `rerun_group=qa-live` ou `rerun_group=qa`.                                                                                                                                                                         |
| Verificador de versão | **Job:** `Verify release checks`<br />**Workflow de suporte:** nenhum<br />**Testes:** jobs obrigatórios de release-check para o grupo de reexecução selecionado.<br />**Executar novamente:** execute novamente após os jobs filhos focados passarem.                                                                                                                                                         |

## Partes do caminho de versão Docker

O estágio de caminho de versão Docker executa estas partes quando `live_suite_filter`
está vazio:

| Parte                                                                                       | Cobertura                                                               |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                                                      | Lanes smoke do caminho de versão Docker do core.                        |
| `package-update-openai`                                                                     | Comportamento de instalação e atualização de pacote OpenAI.             |
| `package-update-anthropic`                                                                  | Comportamento de instalação e atualização de pacote Anthropic.          |
| `package-update-core`                                                                       | Comportamento de pacote e atualização neutro em relação a provedor.     |
| `plugins-runtime-plugins`                                                                   | Lanes de runtime de Plugin que exercitam comportamento de plugin.       |
| `plugins-runtime-services`                                                                  | Lanes de runtime de Plugin com suporte de serviços; inclui OpenWebUI quando solicitado. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h`                             | Lotes de instalação/runtime de Plugin divididos para validação paralela de versão. |
| `bundled-channels-core`                                                                     | Comportamento Docker de canal incluído.                                 |
| `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` | Comportamento de atualização de canal incluído.                         |
| `bundled-channels-contracts`                                                                | Verificações de contrato de canal incluído no caminho de versão Docker. |

Use `docker_lanes=<lane[,lane]>` direcionado no workflow live/E2E reutilizável quando
apenas uma lane do Docker falhou. Os artefatos de release incluem comandos de
rerun por lane com entradas de reutilização de artefato de pacote e imagem quando disponíveis.

## Perfis de release

`release_profile` controla apenas a abrangência live/provider dentro das verificações de release. Ele
não remove CI completa normal, pré-release de Plugin, install smoke, aceitação de pacote,
QA Lab nem partes do caminho de release do Docker.

| Perfil    | Uso pretendido                         | Cobertura live/provider incluída                                                                                                                                               |
| --------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `minimum` | Smoke crítico de release mais rápido.  | Caminho live OpenAI/core, modelos live do Docker para OpenAI, núcleo do gateway nativo, perfil de gateway OpenAI nativo, Plugin OpenAI nativo e gateway live Docker OpenAI.    |
| `stable`  | Perfil padrão de aprovação de release. | `minimum` mais Anthropic, Google, MiniMax, backend, harness de teste live nativo, backend CLI live do Docker, bind ACP do Docker, harness Codex do Docker e um shard smoke OpenCode Go. |
| `full`    | Varredura consultiva ampla.            | `stable` mais providers consultivos, shards live de Plugin e shards live de mídia.                                                                                             |

## Adições somente full

Estas suítes são ignoradas por `stable` e incluídas por `full`:

| Área                              | Cobertura somente full                                                         |
| --------------------------------- | ------------------------------------------------------------------------------ |
| Modelos live do Docker            | OpenCode Go, OpenRouter, xAI, Z.ai e Fireworks.                                |
| Gateway live do Docker            | Shard consultivo para DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI e Z.ai. |
| Perfis de provider do gateway nativo | Fireworks, DeepSeek, shards completos de modelo OpenCode Go, OpenRouter, xAI e Z.ai. |
| Shards live de Plugin nativo      | Plugins A-K, L-N, O-Z outros, Moonshot e xAI.                                  |
| Shards live de mídia nativa       | Áudio, música Google, música MiniMax e grupos de vídeo A-D.                    |

`stable` inclui `native-live-src-gateway-profiles-opencode-go-smoke`; `full`
usa os shards mais amplos de modelo OpenCode Go em vez disso.

## Reruns focados

Use `rerun_group` para evitar repetir caixas de release não relacionadas:

| Identificador       | Escopo                                            |
| ------------------- | ------------------------------------------------- |
| `all`               | Todos os estágios de Full Release Validation.     |
| `ci`                | Apenas o filho de CI completa manual.             |
| `plugin-prerelease` | Apenas o filho de pré-release de Plugin.          |
| `release-checks`    | Todos os estágios de OpenClaw Release Checks.     |
| `install-smoke`     | Install Smoke até verificações de release.        |
| `cross-os`          | Verificações de release entre sistemas operacionais. |
| `live-e2e`          | Validação de E2E repo/live e caminho de release do Docker. |
| `package`           | Package Acceptance.                               |
| `qa`                | Paridade de QA mais lanes live de QA.             |
| `qa-parity`         | Apenas lanes de paridade de QA e relatório.       |
| `qa-live`           | Apenas Matrix live de QA e Telegram.              |
| `npm-telegram`      | Apenas E2E opcional de Telegram pós-publicação.   |

Use `live_suite_filter` com `rerun_group=live-e2e` quando uma suíte live falhar.
Os ids de filtro válidos são definidos no workflow live/E2E reutilizável, incluindo
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` e
`live-codex-harness-docker`.

## Evidência a manter

Mantenha o resumo `Full Release Validation` como índice no nível de release. Ele vincula
ids de execuções filhas e inclui tabelas dos jobs mais lentos. Para falhas, inspecione primeiro
o workflow filho e depois faça rerun do menor identificador correspondente acima.

Artefatos úteis:

- `release-package-under-test` de `OpenClaw Release Checks`
- Artefatos do caminho de release do Docker em `.artifacts/docker-tests/`
- `package-under-test` de Package Acceptance e artefatos de aceitação do Docker
- Artefatos de verificações de release entre sistemas operacionais para cada sistema operacional e suíte
- Artefatos de paridade de QA, Matrix e Telegram

## Arquivos de workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
