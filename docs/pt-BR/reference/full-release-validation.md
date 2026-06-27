---
read_when:
    - Executando ou reexecutando a Validação Completa de Release
    - Comparando perfis de validação de release estável e completa
    - Depuração de falhas na etapa de validação de release
summary: Estágios de validação de versão completa, workflows filhos, perfis de versão, identificadores de reexecução e evidências
title: Validação completa da release
x-i18n:
    generated_at: "2026-06-27T18:08:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 791930254e3cac7da101d809cfc9b56773225159574d3727189f67cf85bd3fce
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` é o guarda-chuva da release. Ele é o único ponto de entrada
manual para comprovação pré-release, mas a maior parte do trabalho acontece em workflows
filhos para que uma caixa com falha possa ser reexecutada sem reiniciar toda a release.

Execute-o a partir de uma referência de workflow confiável, normalmente `main`, e passe a branch,
tag ou SHA completo do commit da release como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Os workflows filhos usam a referência de workflow confiável para o harness e o input
`ref` para o candidato em teste. Isso mantém a nova lógica de validação disponível
ao validar uma branch ou tag de release mais antiga.

`release_profile=stable` e `release_profile=full` sempre executam o soak
live/Docker exaustivo. Passe `run_release_soak=true` para incluir as mesmas lanes de soak
com o perfil beta. A publicação stable rejeita um manifesto de validação sem esse
soak e sem evidência bloqueante de desempenho do produto.

Package Acceptance normalmente cria o tarball candidato a partir do
`ref` resolvido, incluindo execuções com SHA completo despachadas com `pnpm ci:full-release`. Depois de uma
publicação beta, passe `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` para reutilizar o
pacote npm publicado nos checks de release, Package Acceptance, cross-OS,
Docker de release-path e pacote Telegram. Use `package_acceptance_package_spec`
somente quando Package Acceptance deve comprovar intencionalmente um pacote diferente.
A lane de pacote live do Plugin Codex segue o mesmo estado: valores publicados de
`release_package_spec` derivam `codex_plugin_spec=npm:@openclaw/codex@<version>`;
execuções por SHA/artefato empacotam `extensions/codex` a partir do ref selecionado; e operadores
podem definir `codex_plugin_spec` diretamente para fontes de Plugin
`npm:`, `npm-pack:` ou `git:`. A lane concede a aprovação explícita de instalação do Codex CLI exigida por
esse Plugin, depois executa o preflight do Codex CLI e turnos de agente OpenAI na mesma sessão.

## Estágios de nível superior

| Estágio              | Detalhes                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Resolução do alvo    | **Job:** `Resolve target ref`<br />**Workflow filho:** nenhum<br />**Comprova:** resolve a branch, tag ou SHA completo do commit da release e registra os inputs selecionados.<br />**Reexecutar:** reexecute o guarda-chuva se isso falhar.                                                                                                                                                                                                                 |
| Vitest e CI normal   | **Job:** `Run normal full CI`<br />**Workflow filho:** `CI`<br />**Comprova:** grafo manual de CI completo contra o ref alvo, incluindo lanes Linux Node, shards de Plugins agrupados, shards de contrato de Plugin e canal, compatibilidade com Node 22, `check-*`, `check-additional-*`, checks de smoke de artefato construído, checks de docs, Skills Python, Windows, macOS, i18n da Control UI e Android via guarda-chuva.<br />**Reexecutar:** `rerun_group=ci`. |
| Pré-release de Plugin | **Job:** `Run plugin prerelease validation`<br />**Workflow filho:** `Plugin Prerelease`<br />**Comprova:** checks estáticos de Plugin exclusivos de release, cobertura agentic de Plugin, shards de batch completo de extensão, lanes Docker de pré-release de Plugin e um artefato não bloqueante `plugin-inspector-advisory` para triagem de compatibilidade.<br />**Reexecutar:** `rerun_group=plugin-prerelease`.                                            |
| Checks de release    | **Job:** `Run release/live/Docker/QA validation`<br />**Workflow filho:** `OpenClaw Release Checks`<br />**Comprova:** smoke de instalação, checks de pacote cross-OS, Package Acceptance, paridade do QA Lab, Matrix live e Telegram live. Perfis stable e full também executam suítes live/E2E exaustivas e chunks Docker de release-path; beta pode optar por isso com `run_release_soak=true`.<br />**Reexecutar:** `rerun_group=release-checks` ou um handle mais estreito de release-checks. |
| Pacote Telegram      | **Job:** `Run package Telegram E2E`<br />**Workflow filho:** `NPM Telegram Beta E2E`<br />**Comprova:** um E2E Telegram focado em pacote publicado quando `release_package_spec` ou `npm_telegram_package_spec` está definido. A validação completa de candidato usa, em vez disso, o E2E Telegram canônico de Package Acceptance.<br />**Reexecutar:** `rerun_group=npm-telegram` com `release_package_spec` ou `npm_telegram_package_spec`.                     |
| Verificador do guarda-chuva | **Job:** `Verify full validation`<br />**Workflow filho:** nenhum<br />**Comprova:** verifica novamente as conclusões registradas das execuções filhas e anexa tabelas de jobs mais lentos dos workflows filhos.<br />**Reexecutar:** reexecute apenas este job depois de reexecutar um filho com falha até ficar verde.                                                                                                                                       |

Para `ref=main` e `rerun_group=all`, um guarda-chuva mais novo substitui um mais antigo.
Quando o pai é cancelado, seu monitor cancela qualquer workflow filho que ele já
tenha despachado. Execuções de validação de branches e tags de release não se cancelam entre si por
padrão.

## Estágios dos checks de release

`OpenClaw Release Checks` é o maior workflow filho. Ele resolve o alvo
uma vez e prepara um artefato compartilhado `release-package-under-test` quando estágios voltados a pacote
ou Docker precisam dele.

| Estágio               | Detalhes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alvo da release      | **Tarefa:** `Resolve target ref`<br />**Fluxo de trabalho de apoio:** nenhum<br />**Testes:** ref selecionada, SHA esperado opcional, perfil, grupo de nova execução e filtro da suíte ao vivo focada.<br />**Nova execução:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                              |
| Artefato de pacote    | **Tarefa:** `Prepare release package artifact`<br />**Fluxo de trabalho de apoio:** nenhum<br />**Testes:** empacota ou resolve um tarball candidato e envia `release-package-under-test` para verificações downstream voltadas a pacote.<br />**Nova execução:** o pacote afetado, o grupo entre sistemas operacionais ou o grupo ao vivo/E2E.                                                                                                                                                                                                              |
| Smoke de instalação       | **Tarefa:** `Run install smoke`<br />**Fluxo de trabalho de apoio:** `Install Smoke`<br />**Testes:** caminho completo de instalação com reutilização da imagem de smoke do Dockerfile raiz, instalação do pacote por QR, smokes de Docker raiz e do Gateway, testes Docker do instalador, smoke de provedor de imagem com instalação global Bun e E2E rápido de instalação/desinstalação de plugin empacotado.<br />**Nova execução:** `rerun_group=install-smoke`.                                                                                                                                 |
| Entre sistemas operacionais            | **Tarefa:** `cross_os_release_checks`<br />**Fluxo de trabalho de apoio:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Testes:** lanes novas e de upgrade no Linux, Windows e macOS para o provedor e modo selecionados, usando o tarball candidato mais um pacote de linha de base.<br />**Nova execução:** `rerun_group=cross-os`.                                                                                                                                                                                  |
| Repositório e E2E ao vivo   | **Tarefa:** `Run repo/live E2E validation`<br />**Fluxo de trabalho de apoio:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testes:** E2E de repositório, cache ao vivo, streaming por websocket da OpenAI, shards de provedor ao vivo nativo e Plugin, e harnesses de modelo/backend/Gateway ao vivo apoiados por Docker selecionados por `release_profile`.<br />**Execuções:** `run_release_soak=true`, `release_profile=full` ou `rerun_group=live-e2e` focado.<br />**Nova execução:** `rerun_group=live-e2e`, opcionalmente com `live_suite_filter`. |
| Caminho de release Docker | **Tarefa:** `Run Docker release-path validation`<br />**Fluxo de trabalho de apoio:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testes:** partes Docker do caminho de release contra o artefato de pacote compartilhado.<br />**Execuções:** `run_release_soak=true`, `release_profile=full` ou `rerun_group=live-e2e` focado.<br />**Nova execução:** `rerun_group=live-e2e`.                                                                                                                                                      |
| Aceitação de pacote  | **Tarefa:** `Run package acceptance`<br />**Fluxo de trabalho de apoio:** `Package Acceptance`<br />**Testes:** fixtures offline de pacote de Plugin, atualização de Plugin, E2E canônico de pacote Telegram com mock da OpenAI e verificações de sobrevivência de upgrade publicado contra o mesmo tarball. Verificações bloqueantes de release usam a linha de base publicada mais recente padrão; verificações de soak expandem para todas as releases estáveis do npm em ou após `2026.4.23`, mais fixtures de issues relatadas.<br />**Nova execução:** `rerun_group=package`.                   |
| Paridade de QA           | **Tarefa:** `Run QA Lab parity lane` e `Run QA Lab parity report`<br />**Fluxo de trabalho de apoio:** tarefas diretas<br />**Testes:** pacotes de paridade agêntica candidata e de linha de base, depois o relatório de paridade.<br />**Nova execução:** `rerun_group=qa-parity` ou `rerun_group=qa`.                                                                                                                                                                                                                                          |
| Matrix ao vivo de QA      | **Tarefa:** `Run QA Lab live Matrix lane`<br />**Fluxo de trabalho de apoio:** tarefa direta<br />**Testes:** perfil rápido de QA Matrix ao vivo no ambiente `qa-live-shared`.<br />**Nova execução:** `rerun_group=qa-live` ou `rerun_group=qa`.                                                                                                                                                                                                                                                                           |
| Telegram ao vivo de QA    | **Tarefa:** `Run QA Lab live Telegram lane`<br />**Fluxo de trabalho de apoio:** tarefa direta<br />**Testes:** QA Telegram ao vivo com concessões de credenciais de CI do Convex.<br />**Nova execução:** `rerun_group=qa-live` ou `rerun_group=qa`.                                                                                                                                                                                                                                                                                       |
| Verificador de release    | **Tarefa:** `Verify release checks`<br />**Fluxo de trabalho de apoio:** nenhum<br />**Testes:** tarefas obrigatórias de verificação de release para o grupo de nova execução selecionado.<br />**Nova execução:** executar novamente depois que as tarefas filhas focadas passarem.                                                                                                                                                                                                                                                                                                    |

## Partes do caminho de release Docker

O estágio do caminho de release Docker executa estas partes quando `live_suite_filter` está
vazio:

| Parte                                                           | Cobertura                                                                                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | Lanes de smoke do caminho de release Docker do núcleo.                                                                                      |
| `package-update-openai`                                         | Comportamento de instalação/atualização do pacote OpenAI, instalação sob demanda do Codex, turnos ao vivo do Plugin Codex e chamadas de ferramentas do Chat Completions. |
| `package-update-anthropic`                                      | Comportamento de instalação e atualização do pacote Anthropic.                                                                             |
| `package-update-core`                                           | Comportamento de pacote e atualização neutro em relação a provedor.                                                                              |
| `plugins-runtime-plugins`                                       | Lanes de runtime de Plugin que exercitam comportamento de Plugin.                                                                        |
| `plugins-runtime-services`                                      | Lanes de runtime de Plugin apoiadas por serviços e ao vivo; inclui OpenWebUI quando solicitado.                                           |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Lotes de instalação/runtime de Plugin divididos para validação paralela de release.                                                      |

Use `docker_lanes=<lane[,lane]>` direcionado no fluxo de trabalho reutilizável ao vivo/E2E quando
apenas uma lane Docker falhar. Os artefatos de release incluem comandos de nova execução
por lane com entradas de artefato de pacote e reutilização de imagem quando disponíveis.

## Perfis de release

`release_profile` controla principalmente a amplitude ao vivo/de provedores dentro das verificações de release.
Ele não remove a CI completa normal, Pré-release de Plugin, smoke de instalação, aceitação de
pacote nem QA Lab. Perfis estáveis e completos sempre executam cobertura exaustiva de soak
E2E de repositório/ao vivo e de caminho de release Docker. O perfil beta pode aderir com
`run_release_soak=true`. A Aceitação de Pacote fornece o E2E Telegram de pacote canônico
para cada candidato completo, então o guarda-chuva não duplica esse poller ao vivo.

| Perfil   | Uso pretendido                      | Cobertura ao vivo/de provedor incluída                                                                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Smoke mais rápido crítico para release.   | Caminho ao vivo OpenAI/núcleo, modelos ao vivo Docker para OpenAI, núcleo do gateway nativo, perfil de Gateway OpenAI nativo, Plugin OpenAI nativo e Gateway OpenAI ao vivo Docker.                     |
| `stable`  | Perfil padrão de aprovação de release. | `minimum` mais smoke Anthropic, Google, MiniMax, backend, harness de teste ao vivo nativo, backend de CLI ao vivo Docker, bind ACP Docker, harness Codex Docker e um shard de smoke OpenCode Go. |
| `full`    | Varredura consultiva ampla.             | `stable` mais provedores consultivos, shards ao vivo de Plugin e shards ao vivo de mídia.                                                                                                        |

## Adições somente completas

Estas suítes são ignoradas por `stable` e incluídas por `full`:

| Área                             | Cobertura somente completa                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Modelos ao vivo Docker               | OpenCode Go, OpenRouter, xAI, Z.ai e Fireworks.                                                                          |
| Gateway ao vivo Docker              | Provedores consultivos divididos em shards DeepSeek/Fireworks, OpenCode Go/OpenRouter e xAI/Z.ai.                              |
| Perfis de provedor do Gateway nativo | Shards completos Anthropic Opus e Sonnet/Haiku, Fireworks, DeepSeek, shards completos de modelo OpenCode Go, OpenRouter, xAI e Z.ai. |
| Shards ao vivo de Plugin nativo        | Plugins A-K, L-N, O-Z outros, Moonshot e xAI.                                                                             |
| Shards ao vivo de mídia nativa         | Áudio, música Google, música MiniMax e grupos de vídeo A-D.                                                                   |

`stable` inclui `native-live-src-gateway-profiles-anthropic-smoke` e
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` usa os shards mais amplos
de modelos Anthropic e OpenCode Go. Novas execuções focadas ainda podem usar os
identificadores agregados `native-live-src-gateway-profiles-anthropic` ou
`native-live-src-gateway-profiles-opencode-go`.

## Novas execuções focadas

Use `rerun_group` para evitar repetir caixas de release não relacionadas:

| Identificador       | Escopo                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | Todos os estágios de Validação Completa de Release.                                             |
| `ci`                | Apenas filho manual de CI completo.                                                             |
| `plugin-prerelease` | Apenas filho de Pré-release de Plugin.                                                          |
| `release-checks`    | Todos os estágios de Verificações de Release do OpenClaw.                                       |
| `install-smoke`     | Smoke de instalação até verificações de release.                                                |
| `cross-os`          | Verificações de release entre sistemas operacionais.                                            |
| `live-e2e`          | Validação de E2E do repo/ao vivo e do caminho de release do Docker.                             |
| `package`           | Aceitação de pacote.                                                                            |
| `qa`                | Paridade de QA mais lanes de QA ao vivo.                                                        |
| `qa-parity`         | Apenas lanes de paridade de QA e relatório.                                                     |
| `qa-live`           | Matrix/Telegram de QA ao vivo mais lanes bloqueadas de Discord, WhatsApp e Slack quando ativadas. |
| `npm-telegram`      | E2E de Telegram com pacote publicado; requer `release_package_spec` ou `npm_telegram_package_spec`. |

Use `live_suite_filter` com `rerun_group=live-e2e` quando uma suíte ao vivo falhar.
Os ids de filtro válidos são definidos no workflow reutilizável de ao vivo/E2E, incluindo
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` e
`live-codex-harness-docker`.

O identificador `live-gateway-advisory-docker` é um identificador de reexecução agregado para seus
três shards de provedor, portanto ele ainda se expande para todos os jobs de Gateway consultivo do Docker.

Use `cross_os_suite_filter` com `rerun_group=cross-os` quando uma lane entre sistemas operacionais
falhar. O filtro aceita um id de SO, um id de suíte ou um par SO/suíte, por
exemplo `windows/packaged-upgrade`, `windows` ou `packaged-fresh`. Os resumos entre sistemas operacionais
incluem tempos por fase para lanes de upgrade empacotado, e comandos de longa duração
imprimem linhas de Heartbeat para que uma atualização travada do Windows fique visível antes do
tempo limite do job.

Falhas nas verificações de release de QA bloqueiam a validação normal de release. Desvio obrigatório de ferramenta dinâmica do OpenClaw
no tier padrão também bloqueia o verificador de verificações de release.
Execuções alpha do Tideclaw ainda podem tratar lanes de verificações de release que não sejam de segurança de pacote como
consultivas. Quando `live_suite_filter` solicita explicitamente uma lane de QA ao vivo bloqueada, como
Discord, WhatsApp ou Slack, a variável correspondente do repo
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` deve estar ativada; caso contrário,
a captura de entrada falha em vez de pular a lane silenciosamente. Reexecute `rerun_group=qa`,
`qa-parity` ou `qa-live` quando precisar de novas evidências de QA.

## Evidências a manter

Mantenha o resumo de `Full Release Validation` como o índice no nível da release. Ele vincula
ids de execuções filhas e inclui tabelas dos jobs mais lentos. Em caso de falhas, inspecione primeiro o workflow
filho e depois reexecute o menor identificador correspondente acima.

Artefatos úteis:

- `release-package-under-test` de `OpenClaw Release Checks`
- Artefatos do caminho de release do Docker em `.artifacts/docker-tests/`
- `package-under-test` da Aceitação de Pacote e artefatos de aceitação do Docker
- Artefatos de verificações de release entre sistemas operacionais para cada SO e suíte
- Artefatos de paridade de QA, Matrix e Telegram

## Arquivos de workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
