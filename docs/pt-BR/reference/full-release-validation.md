---
read_when:
    - Executando ou reexecutando a validação completa de lançamento
    - Comparando os perfis de validação de lançamento estável e completo
    - Depuração de falhas no estágio de validação de lançamento
summary: Etapas, fluxos de trabalho filhos, perfis de lançamento, identificadores de reexecução e evidências da Validação completa de lançamento
title: Validação completa do lançamento
x-i18n:
    generated_at: "2026-05-05T01:49:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6cf696761f516fc7f8e9606a2a06fab61a644731330eb484a388f276767a9e0d
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` é o guarda-chuva de validação de lançamento. Ele é o único
ponto de entrada manual para a comprovação de pré-lançamento, mas a maior parte do
trabalho acontece em fluxos de trabalho filhos, para que uma caixa com falha possa
ser executada novamente sem reiniciar todo o lançamento.

Execute-o a partir de uma referência de fluxo de trabalho confiável, normalmente `main`, e passe a branch de lançamento,
tag ou SHA completo do commit como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Os fluxos de trabalho filhos usam a referência de fluxo de trabalho confiável para o harness e a entrada
`ref` para o candidato em teste. Isso mantém a nova lógica de validação disponível
ao validar uma branch ou tag de lançamento mais antiga.

Por padrão, `release_profile=stable` executa as faixas bloqueadoras de lançamento e ignora
o soak live/Docker exaustivo. Passe `run_release_soak=true` para incluir as
faixas de soak em uma execução estável. `release_profile=full` sempre habilita as faixas de soak, para que
o perfil consultivo amplo nunca perca cobertura silenciosamente.

Package Acceptance normalmente compila o tarball candidato a partir do
`ref` resolvido, incluindo execuções com SHA completo disparadas com `pnpm ci:full-release`. Após
a publicação, passe `package_acceptance_package_spec=openclaw@YYYY.M.D` (ou
`openclaw@beta`/`openclaw@latest`) para executar a mesma matriz de pacote/atualização contra
o pacote npm publicado.

## Estágios de nível superior

| Estágio              | Detalhes                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resolução do alvo    | **Job:** `Resolve target ref`<br />**Fluxo de trabalho filho:** nenhum<br />**Comprova:** resolve a branch de lançamento, tag ou SHA completo do commit e registra as entradas selecionadas.<br />**Executar novamente:** execute o guarda-chuva novamente se isso falhar.                                                                                                                                                                    |
| Vitest e CI normal   | **Job:** `Run normal full CI`<br />**Fluxo de trabalho filho:** `CI`<br />**Comprova:** grafo manual completo de CI contra o ref alvo, incluindo faixas Linux Node, shards de Plugin agrupados, contratos de canal, compatibilidade com Node 22, `check`, `check-additional`, smoke de build, verificações de docs, Skills Python, Windows, macOS, i18n da Control UI e Android via guarda-chuva.<br />**Executar novamente:** `rerun_group=ci`. |
| Pré-lançamento de Plugin | **Job:** `Run plugin prerelease validation`<br />**Fluxo de trabalho filho:** `Plugin Prerelease`<br />**Comprova:** verificações estáticas de Plugin somente de lançamento, cobertura agentic de Plugin, shards completos de lote de extensão e faixas Docker de pré-lançamento de Plugin.<br />**Executar novamente:** `rerun_group=plugin-prerelease`.                                                                                   |
| Verificações de lançamento | **Job:** `Run release/live/Docker/QA validation`<br />**Fluxo de trabalho filho:** `OpenClaw Release Checks`<br />**Comprova:** smoke de instalação, verificações de pacote entre OSs, Package Acceptance, paridade do QA Lab, Matrix live e Telegram live. Com `run_release_soak=true` ou `release_profile=full`, também executa suítes live/E2E exaustivas e chunks de caminho de lançamento Docker.<br />**Executar novamente:** `rerun_group=release-checks` ou um identificador release-checks mais restrito. |
| Artefato de pacote   | **Job:** `Prepare release package artifact`<br />**Fluxo de trabalho filho:** nenhum<br />**Comprova:** cria o tarball pai `release-package-under-test` cedo o suficiente para verificações voltadas a pacote que não precisam aguardar `OpenClaw Release Checks`.<br />**Executar novamente:** execute o guarda-chuva novamente ou forneça `npm_telegram_package_spec` para `rerun_group=npm-telegram`.                                      |
| Package Telegram    | **Job:** `Run package Telegram E2E`<br />**Fluxo de trabalho filho:** `NPM Telegram Beta E2E`<br />**Comprova:** comprovação de pacote Telegram baseada em artefato pai para `rerun_group=all` com `release_profile=full`, ou comprovação de Telegram de pacote publicado quando `npm_telegram_package_spec` está definido.<br />**Executar novamente:** `rerun_group=npm-telegram` com `npm_telegram_package_spec`.                              |
| Verificador do guarda-chuva | **Job:** `Verify full validation`<br />**Fluxo de trabalho filho:** nenhum<br />**Comprova:** verifica novamente as conclusões registradas das execuções filhas e anexa tabelas dos jobs mais lentos dos fluxos de trabalho filhos.<br />**Executar novamente:** execute novamente apenas este job depois de reexecutar um filho com falha até ficar verde.                                                                                  |

Para `ref=main` e `rerun_group=all`, um guarda-chuva mais novo substitui um mais antigo.
Quando o pai é cancelado, seu monitor cancela qualquer fluxo de trabalho filho que ele já
tenha disparado. Execuções de validação de branch e tag de lançamento não se cancelam
por padrão.

## Estágios de verificações de lançamento

`OpenClaw Release Checks` é o maior fluxo de trabalho filho. Ele resolve o alvo
uma vez e prepara um artefato compartilhado `release-package-under-test` quando estágios
voltados a pacote ou Docker precisam dele.

| Etapa               | Detalhes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alvo de release      | **Job:** `Resolve target ref`<br />**Workflow de suporte:** nenhum<br />**Testes:** ref selecionada, SHA esperado opcional, perfil, grupo de reexecução e filtro de suíte live focada.<br />**Reexecução:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                              |
| Artefato de pacote    | **Job:** `Prepare release package artifact`<br />**Workflow de suporte:** nenhum<br />**Testes:** empacota ou resolve um tarball candidato e faz upload de `release-package-under-test` para verificações downstream voltadas a pacotes.<br />**Reexecução:** o pacote afetado, grupo cross-OS ou live/E2E.                                                                                                                                                                                                              |
| Smoke de instalação       | **Job:** `Run install smoke`<br />**Workflow de suporte:** `Install Smoke`<br />**Testes:** caminho completo de instalação com reutilização da imagem smoke do Dockerfile raiz, instalação de pacote QR, smokes Docker raiz e Gateway, testes Docker do instalador, smoke de provedor de imagem com instalação global Bun e E2E rápido de instalação/desinstalação de Plugin empacotado.<br />**Reexecução:** `rerun_group=install-smoke`.                                                                                                                                 |
| Cross-OS            | **Job:** `cross_os_release_checks`<br />**Workflow de suporte:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Testes:** lanes novas e de upgrade no Linux, Windows e macOS para o provedor e modo selecionados, usando o tarball candidato mais um pacote de linha de base.<br />**Reexecução:** `rerun_group=cross-os`.                                                                                                                                                                                  |
| Repo e E2E live   | **Job:** `Run repo/live E2E validation`<br />**Workflow de suporte:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testes:** E2E do repositório, cache live, streaming websocket OpenAI, provedor live nativo e shards de Plugin, além de harnesses de modelo/backend/Gateway live com Docker selecionados por `release_profile`.<br />**Execuções:** `run_release_soak=true`, `release_profile=full` ou `rerun_group=live-e2e` focado.<br />**Reexecução:** `rerun_group=live-e2e`, opcionalmente com `live_suite_filter`. |
| Caminho de release Docker | **Job:** `Run Docker release-path validation`<br />**Workflow de suporte:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testes:** chunks Docker do caminho de release contra o artefato de pacote compartilhado.<br />**Execuções:** `run_release_soak=true`, `release_profile=full` ou `rerun_group=live-e2e` focado.<br />**Reexecução:** `rerun_group=live-e2e`.                                                                                                                                                      |
| Aceitação de pacote  | **Job:** `Run package acceptance`<br />**Workflow de suporte:** `Package Acceptance`<br />**Testes:** fixtures offline de pacote de Plugin, atualização de Plugin, aceitação de pacote Telegram com OpenAI simulada e verificações de sobrevivência de upgrade publicado contra o mesmo tarball. Verificações de release bloqueantes usam a linha de base publicada mais recente padrão; verificações soak expandem para cada release npm estável em ou após `2026.4.23` mais fixtures de problemas reportados.<br />**Reexecução:** `rerun_group=package`.                          |
| Paridade de QA           | **Job:** `Run QA Lab parity lane` e `Run QA Lab parity report`<br />**Workflow de suporte:** jobs diretos<br />**Testes:** pacotes de paridade agêntica do candidato e da linha de base, depois o relatório de paridade.<br />**Reexecução:** `rerun_group=qa-parity` ou `rerun_group=qa`.                                                                                                                                                                                                                                          |
| Matriz live de QA      | **Job:** `Run QA Lab live Matrix lane`<br />**Workflow de suporte:** job direto<br />**Testes:** perfil rápido de QA live Matrix no ambiente `qa-live-shared`.<br />**Reexecução:** `rerun_group=qa-live` ou `rerun_group=qa`.                                                                                                                                                                                                                                                                           |
| Telegram live de QA    | **Job:** `Run QA Lab live Telegram lane`<br />**Workflow de suporte:** job direto<br />**Testes:** QA live Telegram com concessões de credenciais do Convex CI.<br />**Reexecução:** `rerun_group=qa-live` ou `rerun_group=qa`.                                                                                                                                                                                                                                                                                       |
| Verificador de release    | **Job:** `Verify release checks`<br />**Workflow de suporte:** nenhum<br />**Testes:** jobs obrigatórios de verificação de release para o grupo de reexecução selecionado.<br />**Reexecução:** reexecute depois que os jobs filhos focados passarem.                                                                                                                                                                                                                                                                                                    |

## Chunks do caminho de release Docker

A etapa do caminho de release Docker executa estes chunks quando `live_suite_filter` está
vazio:

| Chunk                                                           | Cobertura                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Lanes smoke centrais do caminho de release Docker.                                   |
| `package-update-openai`                                         | Comportamento de instalação e atualização de pacote OpenAI.                             |
| `package-update-anthropic`                                      | Comportamento de instalação e atualização de pacote Anthropic.                          |
| `package-update-core`                                           | Comportamento de pacote e atualização neutro em relação a provedor.                           |
| `plugins-runtime-plugins`                                       | Lanes de runtime de Plugin que exercitam o comportamento de Plugin.                     |
| `plugins-runtime-services`                                      | Lanes de runtime de Plugin com suporte por serviço; inclui OpenWebUI quando solicitado. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Lotes de instalação/runtime de Plugin divididos para validação paralela de release.   |

Use `docker_lanes=<lane[,lane]>` direcionado no workflow live/E2E reutilizável quando
apenas uma lane Docker falhar. Os artefatos de release incluem comandos de
reexecução por lane com entradas de artefato de pacote e reutilização de imagem quando disponíveis.

## Perfis de release

`release_profile` controla principalmente a amplitude live/provedor dentro das verificações de release.
Ele não remove CI completa normal, pré-lançamento de Plugin, smoke de instalação, aceitação de
pacote ou QA Lab. Para `stable`, E2E repo/live exaustivo e chunks de
caminho de release Docker são cobertura soak e são executados quando `run_release_soak=true`.
`full` força a cobertura soak e também faz a execução guarda-chuva executar o E2E Telegram de pacote
contra o artefato de pacote de release pai quando `rerun_group=all`, para que um candidato completo
de pré-publicação não pule silenciosamente essa lane de pacote Telegram.

| Perfil   | Uso pretendido                      | Cobertura live/provedor incluída                                                                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Smoke mais rápido crítico para release.   | Caminho live OpenAI/core, modelos live Docker para OpenAI, core do Gateway nativo, perfil de Gateway OpenAI nativo, Plugin OpenAI nativo e Gateway live Docker OpenAI.                     |
| `stable`  | Perfil padrão de aprovação de release. | `minimum` mais smoke Anthropic, Google, MiniMax, backend, harness de teste live nativo, backend de CLI live Docker, bind ACP Docker, harness Codex Docker e um shard smoke OpenCode Go. |
| `full`    | Varredura consultiva ampla.             | `stable` mais provedores consultivos, shards live de Plugin e shards live de mídia.                                                                                                        |

## Adições apenas do full

Estas suítes são ignoradas por `stable` e incluídas por `full`:

| Área                             | Cobertura apenas do full                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Modelos live Docker               | OpenCode Go, OpenRouter, xAI, Z.ai e Fireworks.                                                                          |
| Gateway live Docker              | Provedores consultivos divididos em shards DeepSeek/Fireworks, OpenCode Go/OpenRouter e xAI/Z.ai.                              |
| Perfis de provedor do Gateway nativo | Shards Anthropic completos Opus e Sonnet/Haiku, Fireworks, DeepSeek, shards completos de modelo OpenCode Go, OpenRouter, xAI e Z.ai. |
| Shards live de Plugin nativo        | Plugins A-K, L-N, O-Z outros, Moonshot e xAI.                                                                             |
| Shards live de mídia nativa         | Áudio, música Google, música MiniMax e grupos de vídeo A-D.                                                                   |

`stable` inclui `native-live-src-gateway-profiles-anthropic-smoke` e
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` usa os shards
mais amplos de modelos Anthropic e OpenCode Go em vez disso. Reexecuções focadas ainda podem usar os
identificadores agregados `native-live-src-gateway-profiles-anthropic` ou
`native-live-src-gateway-profiles-opencode-go`.

## Reexecuções focadas

Use `rerun_group` para evitar repetir caixas de release não relacionadas:

| Identificador       | Escopo                                                                |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Todos os estágios da Validação Completa de Lançamento.                |
| `ci`                | Apenas o filho manual de CI completa.                                 |
| `plugin-prerelease` | Apenas o filho de pré-lançamento de Plugin.                           |
| `release-checks`    | Todos os estágios das Verificações de Lançamento do OpenClaw.         |
| `install-smoke`     | Smoke de instalação até as verificações de lançamento.                |
| `cross-os`          | Verificações de lançamento entre sistemas operacionais.               |
| `live-e2e`          | Validação de E2E ao vivo do repositório e do caminho de lançamento do Docker. |
| `package`           | Aceitação do pacote.                                                  |
| `qa`                | Paridade de QA mais lanes de QA ao vivo.                              |
| `qa-parity`         | Apenas lanes e relatório de paridade de QA.                           |
| `qa-live`           | Apenas Matrix e Telegram de QA ao vivo.                               |
| `npm-telegram`      | E2E do Telegram com pacote publicado; requer `npm_telegram_package_spec`. |

Use `live_suite_filter` com `rerun_group=live-e2e` quando uma suíte ao vivo falhar.
Os ids de filtro válidos são definidos no workflow reutilizável ao vivo/E2E, incluindo
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` e
`live-codex-harness-docker`.

O identificador `live-gateway-advisory-docker` é um identificador agregado de reexecução para seus
três shards de provedor, então ele ainda se espalha para todos os jobs de Gateway Docker de advisories.

Use `cross_os_suite_filter` com `rerun_group=cross-os` quando uma lane entre sistemas operacionais
falhar. O filtro aceita um id de sistema operacional, um id de suíte ou um par sistema operacional/suíte, por
exemplo `windows/packaged-upgrade`, `windows` ou `packaged-fresh`. Os
resumos entre sistemas operacionais incluem tempos por fase para lanes de upgrade empacotado, e comandos
de longa duração imprimem linhas de Heartbeat para que uma atualização do Windows travada fique visível antes do
tempo limite do job.

As lanes de verificações de lançamento de QA são consultivas. Uma falha apenas de QA é relatada como aviso
e não bloqueia o verificador de verificações de lançamento; reexecute `rerun_group=qa`,
`qa-parity` ou `qa-live` quando precisar de evidência de QA atualizada.

## Evidência a manter

Mantenha o resumo de `Full Release Validation` como o índice no nível do lançamento. Ele vincula
ids de execução filhos e inclui tabelas dos jobs mais lentos. Para falhas, inspecione primeiro o workflow
filho e depois reexecute o menor identificador correspondente acima.

Artefatos úteis:

- `release-package-under-test` do pai da Validação Completa de Lançamento e `OpenClaw Release Checks`
- Artefatos do caminho de lançamento do Docker em `.artifacts/docker-tests/`
- `package-under-test` da Aceitação do Pacote e artefatos de aceitação do Docker
- Artefatos de verificação de lançamento entre sistemas operacionais para cada sistema operacional e suíte
- Artefatos de paridade de QA, Matrix e Telegram

## Arquivos de workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
