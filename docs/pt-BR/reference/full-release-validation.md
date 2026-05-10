---
read_when:
    - Executar ou reexecutar a Validação completa de lançamento
    - Comparando perfis de validação de versão estável e completa
    - Depuração de falhas na etapa de validação da versão
summary: Estágios, workflows filhos, perfis de lançamento, identificadores de reexecução e evidências da Validação completa de lançamento
title: Validação completa da versão
x-i18n:
    generated_at: "2026-05-10T19:49:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a479b2d79ae2710c501d583ad14f913a32382bba8dfd7ec9d25124357743e20
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` é o guarda-chuva da versão. Ele é o único ponto de
entrada manual para a prova de pré-lançamento, mas a maior parte do trabalho
acontece em fluxos de trabalho filhos para que uma máquina com falha possa ser
reexecutada sem reiniciar a versão inteira.

Execute-o a partir de uma referência de workflow confiável, normalmente `main`,
e passe o branch de lançamento, a tag ou o SHA completo do commit como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Os fluxos de trabalho filhos usam a referência de workflow confiável para o
harness e o `ref` de entrada para o candidato em teste. Isso mantém a nova lógica
de validação disponível ao validar um branch ou tag de lançamento mais antigo.

Por padrão, `release_profile=stable` executa as lanes bloqueadoras da versão e
pula o soak exaustivo ao vivo/Docker. Passe `run_release_soak=true` para incluir
as lanes de soak em uma execução estável. `release_profile=full` sempre habilita
as lanes de soak, para que o perfil consultivo amplo nunca perca cobertura
silenciosamente.

A Aceitação de Pacote normalmente cria o tarball candidato a partir do `ref`
resolvido, incluindo execuções com SHA completo disparadas com
`pnpm ci:full-release`. Após a publicação, passe
`package_acceptance_package_spec=openclaw@YYYY.M.D` (ou
`openclaw@beta`/`openclaw@latest`) para executar a mesma matriz de
pacote/atualização contra o pacote npm publicado.

## Estágios de nível superior

| Estágio              | Detalhes                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resolução do alvo    | **Job:** `Resolve target ref`<br />**Workflow filho:** nenhum<br />**Prova:** resolve o branch de lançamento, a tag ou o SHA completo do commit e registra as entradas selecionadas.<br />**Reexecução:** reexecute o guarda-chuva se isso falhar.                                                                                                                                                                                                  |
| Vitest e CI normal   | **Job:** `Run normal full CI`<br />**Workflow filho:** `CI`<br />**Prova:** grafo manual de CI completo contra o ref de destino, incluindo lanes Linux Node, shards de Plugins empacotados, contratos de canais, compatibilidade com Node 22, `check`, `check-additional`, smoke de build, verificações de docs, Skills Python, Windows, macOS, i18n da UI de Controle e Android via o guarda-chuva.<br />**Reexecução:** `rerun_group=ci`.       |
| Pré-lançamento de Plugin | **Job:** `Run plugin prerelease validation`<br />**Workflow filho:** `Plugin Prerelease`<br />**Prova:** verificações estáticas de Plugins exclusivas de lançamento, cobertura de Plugins agênticos, shards completos de lote de extensões e lanes Docker de pré-lançamento de Plugins.<br />**Reexecução:** `rerun_group=plugin-prerelease`.                                                                                              |
| Verificações de lançamento | **Job:** `Run release/live/Docker/QA validation`<br />**Workflow filho:** `OpenClaw Release Checks`<br />**Prova:** smoke de instalação, verificações de pacote entre sistemas operacionais, Aceitação de Pacote, paridade do QA Lab, Matrix ao vivo e Telegram ao vivo. Com `run_release_soak=true` ou `release_profile=full`, também executa suítes ao vivo/E2E exaustivas e partes do caminho de lançamento Docker.<br />**Reexecução:** `rerun_group=release-checks` ou um handle mais estreito de release-checks. |
| Artefato de pacote   | **Job:** `Prepare release package artifact`<br />**Workflow filho:** nenhum<br />**Prova:** cria o tarball pai `release-package-under-test` cedo o suficiente para verificações voltadas a pacotes que não precisam esperar por `OpenClaw Release Checks`.<br />**Reexecução:** reexecute o guarda-chuva ou forneça `npm_telegram_package_spec` para `rerun_group=npm-telegram`.                                                                |
| Telegram do pacote   | **Job:** `Run package Telegram E2E`<br />**Workflow filho:** `NPM Telegram Beta E2E`<br />**Prova:** prova de pacote Telegram apoiada por artefato pai para `rerun_group=all` com `release_profile=full`, ou prova de Telegram com pacote publicado quando `npm_telegram_package_spec` estiver definido.<br />**Reexecução:** `rerun_group=npm-telegram` com `npm_telegram_package_spec`.                                                        |
| Verificador do guarda-chuva | **Job:** `Verify full validation`<br />**Workflow filho:** nenhum<br />**Prova:** verifica novamente as conclusões registradas das execuções filhas e anexa tabelas dos jobs mais lentos dos fluxos de trabalho filhos.<br />**Reexecução:** reexecute somente este job depois de reexecutar um filho com falha até ficar verde.                                                                                                             |

Para `ref=main` e `rerun_group=all`, um guarda-chuva mais novo substitui um mais
antigo. Quando o pai é cancelado, seu monitor cancela qualquer workflow filho
que ele já tenha disparado. Execuções de validação de branches e tags de
lançamento não se cancelam por padrão.

## Estágios das verificações de lançamento

`OpenClaw Release Checks` é o maior workflow filho. Ele resolve o alvo uma vez e
prepara um artefato compartilhado `release-package-under-test` quando estágios
voltados a pacote ou Docker precisam dele.

| Etapa               | Detalhes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Destino da versão      | **Tarefa:** `Resolve target ref`<br />**Fluxo de trabalho de apoio:** nenhum<br />**Testes:** ref selecionada, SHA esperado opcional, perfil, grupo de reexecução e filtro de suíte live focada.<br />**Reexecução:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                              |
| Artefato de pacote    | **Tarefa:** `Prepare release package artifact`<br />**Fluxo de trabalho de apoio:** nenhum<br />**Testes:** empacota ou resolve um tarball candidato e envia `release-package-under-test` para verificações posteriores voltadas a pacotes.<br />**Reexecução:** o pacote afetado, grupo entre sistemas operacionais ou live/E2E.                                                                                                                                                                                                              |
| Smoke de instalação       | **Tarefa:** `Run install smoke`<br />**Fluxo de trabalho de apoio:** `Install Smoke`<br />**Testes:** caminho completo de instalação com reutilização da imagem smoke do Dockerfile raiz, instalação de pacote por QR, smokes Docker da raiz e do Gateway, testes Docker do instalador, smoke de provedor de imagem com instalação global do Bun e E2E rápido de instalação/desinstalação de Plugin incluído.<br />**Reexecução:** `rerun_group=install-smoke`.                                                                                                                                 |
| Entre sistemas operacionais            | **Tarefa:** `cross_os_release_checks`<br />**Fluxo de trabalho de apoio:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Testes:** trilhas de instalação nova e atualização no Linux, Windows e macOS para o provedor e modo selecionados, usando o tarball candidato mais um pacote de linha de base.<br />**Reexecução:** `rerun_group=cross-os`.                                                                                                                                                                                  |
| Repositório e E2E live   | **Tarefa:** `Run repo/live E2E validation`<br />**Fluxo de trabalho de apoio:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testes:** E2E de repositório, cache live, streaming por websocket da OpenAI, provedor live nativo e shards de Plugin, além de harnesses de modelo/backend/Gateway live com suporte Docker selecionados por `release_profile`.<br />**Execuções:** `run_release_soak=true`, `release_profile=full` ou `rerun_group=live-e2e` focado.<br />**Reexecução:** `rerun_group=live-e2e`, opcionalmente com `live_suite_filter`. |
| Caminho de versão Docker | **Tarefa:** `Run Docker release-path validation`<br />**Fluxo de trabalho de apoio:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testes:** partes Docker do caminho de versão contra o artefato de pacote compartilhado.<br />**Execuções:** `run_release_soak=true`, `release_profile=full` ou `rerun_group=live-e2e` focado.<br />**Reexecução:** `rerun_group=live-e2e`.                                                                                                                                                      |
| Aceitação de pacote  | **Tarefa:** `Run package acceptance`<br />**Fluxo de trabalho de apoio:** `Package Acceptance`<br />**Testes:** fixtures offline de pacotes de Plugin, atualização de Plugin, aceitação de pacote do Telegram com OpenAI simulada e verificações de sobrevivência a atualização publicada contra o mesmo tarball. As verificações bloqueantes de versão usam a linha de base publicada mais recente padrão; as verificações soak expandem para toda versão npm estável em ou após `2026.4.23`, mais fixtures de problemas relatados.<br />**Reexecução:** `rerun_group=package`.                          |
| Paridade de QA           | **Tarefa:** `Run QA Lab parity lane` e `Run QA Lab parity report`<br />**Fluxo de trabalho de apoio:** tarefas diretas<br />**Testes:** pacotes de paridade agêntica de candidato e linha de base, depois o relatório de paridade.<br />**Reexecução:** `rerun_group=qa-parity` ou `rerun_group=qa`.                                                                                                                                                                                                                                          |
| Matriz live de QA      | **Tarefa:** `Run QA Lab live Matrix lane`<br />**Fluxo de trabalho de apoio:** tarefa direta<br />**Testes:** perfil de QA live rápido do Matrix no ambiente `qa-live-shared`.<br />**Reexecução:** `rerun_group=qa-live` ou `rerun_group=qa`.                                                                                                                                                                                                                                                                           |
| Telegram live de QA    | **Tarefa:** `Run QA Lab live Telegram lane`<br />**Fluxo de trabalho de apoio:** tarefa direta<br />**Testes:** QA live do Telegram com concessões de credenciais de CI do Convex.<br />**Reexecução:** `rerun_group=qa-live` ou `rerun_group=qa`.                                                                                                                                                                                                                                                                                       |
| Verificador de versão    | **Tarefa:** `Verify release checks`<br />**Fluxo de trabalho de apoio:** nenhum<br />**Testes:** tarefas obrigatórias de verificação de versão para o grupo de reexecução selecionado.<br />**Reexecução:** reexecute depois que as tarefas-filhas focadas passarem.                                                                                                                                                                                                                                                                                                    |

## Partes do caminho de versão Docker

A etapa de caminho de versão Docker executa estas partes quando `live_suite_filter` está
vazio:

| Parte                                                           | Cobertura                                                                         |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `core`                                                          | Trilhas smoke principais do caminho de versão Docker.                                            |
| `package-update-openai`                                         | Comportamento de instalação/atualização de pacote da OpenAI, incluindo instalação sob demanda do Codex.       |
| `package-update-anthropic`                                      | Comportamento de instalação e atualização de pacote da Anthropic.                                   |
| `package-update-core`                                           | Comportamento de pacote e atualização neutro em relação a provedor.                                    |
| `plugins-runtime-plugins`                                       | Trilhas de runtime de Plugin que exercitam comportamento de Plugin.                              |
| `plugins-runtime-services`                                      | Trilhas de runtime de Plugin com suporte de serviço e live; inclui OpenWebUI quando solicitado. |
| `plugins-runtime-install-a` a `plugins-runtime-install-h` | Lotes de instalação/runtime de Plugin divididos para validação paralela de versão.            |

Use `docker_lanes=<lane[,lane]>` direcionado no fluxo de trabalho live/E2E reutilizável quando
apenas uma trilha Docker falhar. Os artefatos de versão incluem comandos de reexecução
por trilha com entradas de artefato de pacote e reutilização de imagem quando disponíveis.

## Perfis de versão

`release_profile` controla principalmente a abrangência live/provedor dentro das verificações de versão.
Ele não remove a CI completa normal, pré-lançamento de Plugin, smoke de instalação, aceitação de pacote
ou QA Lab. Para `stable`, E2E exaustivo de repositório/live e partes do
caminho de versão Docker são cobertura soak e executam quando `run_release_soak=true`.
`full` força a cobertura soak e também faz a execução guarda-chuva rodar E2E do Telegram de pacote
contra o artefato de pacote de versão pai quando `rerun_group=all`, para que um candidato completo
pré-publicação não ignore silenciosamente essa trilha de pacote do Telegram.

| Perfil   | Uso pretendido                      | Cobertura live/provedor incluída                                                                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Smoke crítico de versão mais rápido.   | Caminho live OpenAI/core, modelos live Docker para OpenAI, núcleo do Gateway nativo, perfil de Gateway OpenAI nativo, Plugin OpenAI nativo e Gateway OpenAI live Docker.                     |
| `stable`  | Perfil padrão de aprovação de versão. | `minimum` mais smoke Anthropic, Google, MiniMax, backend, harness de teste live nativo, backend de CLI live Docker, bind ACP Docker, harness Docker do Codex e um shard smoke do OpenCode Go. |
| `full`    | Varredura consultiva ampla.             | `stable` mais provedores consultivos, shards live de Plugin e shards live de mídia.                                                                                                        |

## Adições somente em full

Estas suítes são ignoradas por `stable` e incluídas por `full`:

| Área                             | Cobertura somente em full                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Modelos live Docker               | OpenCode Go, OpenRouter, xAI, Z.ai e Fireworks.                                                                          |
| Gateway live Docker              | Provedores consultivos divididos em shards DeepSeek/Fireworks, OpenCode Go/OpenRouter e xAI/Z.ai.                              |
| Perfis de provedor do Gateway nativo | Shards completos Anthropic Opus e Sonnet/Haiku, Fireworks, DeepSeek, shards completos de modelo OpenCode Go, OpenRouter, xAI e Z.ai. |
| Shards live de Plugin nativo        | Plugins A-K, L-N, O-Z outros, Moonshot e xAI.                                                                             |
| Shards live de mídia nativa         | Áudio, música Google, música MiniMax e grupos de vídeo A-D.                                                                   |

`stable` inclui `native-live-src-gateway-profiles-anthropic-smoke` e
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` usa os shards mais amplos
de modelos Anthropic e OpenCode Go em vez disso. Reexecuções focadas ainda podem usar os
identificadores agregados `native-live-src-gateway-profiles-anthropic` ou
`native-live-src-gateway-profiles-opencode-go`.

## Reexecuções focadas

Use `rerun_group` para evitar repetir caixas de versão não relacionadas:

| Identificador       | Escopo                                                                |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Todos os estágios de Validação Completa da Versão.                    |
| `ci`                | Apenas o filho manual de CI completa.                                 |
| `plugin-prerelease` | Apenas o filho de Pré-lançamento de Plugin.                           |
| `release-checks`    | Todos os estágios de Verificações de Versão do OpenClaw.              |
| `install-smoke`     | Smoke de Instalação por meio das verificações de versão.               |
| `cross-os`          | Verificações de versão entre sistemas operacionais.                    |
| `live-e2e`          | Validação E2E de repositório/ao vivo e do caminho de versão do Docker. |
| `package`           | Aceitação de Pacote.                                                  |
| `qa`                | Paridade de QA mais faixas de QA ao vivo.                              |
| `qa-parity`         | Apenas faixas de paridade de QA e relatório.                           |
| `qa-live`           | Apenas Matrix e Telegram ao vivo de QA.                                |
| `npm-telegram`      | E2E de Telegram do pacote publicado; requer `npm_telegram_package_spec`. |

Use `live_suite_filter` com `rerun_group=live-e2e` quando uma suíte ao vivo falhar.
IDs de filtro válidos são definidos no workflow reutilizável ao vivo/E2E, incluindo
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` e
`live-codex-harness-docker`.

O identificador `live-gateway-advisory-docker` é um identificador de reexecução agregado para seus
três shards de provedor, então ele ainda se expande para todos os jobs de Gateway Docker de advisory.

Use `cross_os_suite_filter` com `rerun_group=cross-os` quando uma faixa entre sistemas operacionais
falhar. O filtro aceita um ID de sistema operacional, um ID de suíte ou um par sistema operacional/suíte, por
exemplo `windows/packaged-upgrade`, `windows` ou `packaged-fresh`. Resumos entre sistemas operacionais
incluem tempos por fase para faixas de upgrade empacotado, e comandos de longa duração
imprimem linhas de Heartbeat para que uma atualização do Windows travada fique visível antes do
timeout do job.

As faixas de verificações de versão de QA são consultivas. Uma falha somente de QA é relatada como aviso
e não bloqueia o verificador de verificações de versão; reexecute `rerun_group=qa`,
`qa-parity` ou `qa-live` quando precisar de evidências novas de QA.

## Evidências a manter

Mantenha o resumo de `Validação Completa da Versão` como o índice no nível da versão. Ele vincula
IDs de execuções filhas e inclui tabelas dos jobs mais lentos. Para falhas, inspecione primeiro o
workflow filho e depois reexecute o menor identificador correspondente acima.

Artefatos úteis:

- `release-package-under-test` do pai de Validação Completa da Versão e `Verificações de Versão do OpenClaw`
- Artefatos do caminho de versão do Docker em `.artifacts/docker-tests/`
- `package-under-test` da Aceitação de Pacote e artefatos de aceitação do Docker
- Artefatos de verificações de versão entre sistemas operacionais para cada sistema operacional e suíte
- Artefatos de paridade de QA, Matrix e Telegram

## Arquivos de workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
