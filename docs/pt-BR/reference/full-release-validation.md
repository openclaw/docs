---
read_when:
    - Executando ou reexecutando a Validação Completa da Versão
    - Comparando os perfis de validação de versão estável e completa
    - Depuração de falhas nas etapas de validação da versão
summary: Estágios da Validação Completa da Versão, fluxos de trabalho filhos, perfis de versão, identificadores de reexecução e evidências
title: Validação completa da versão
x-i18n:
    generated_at: "2026-07-12T15:43:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a0c152128a27b173f131bcf2754c7f06d7bf3e9f7d2d1d0f745ab999f53c78c9
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` é o mecanismo abrangente de release: o único ponto de entrada manual
para comprovação de pré-release. A maior parte do trabalho ocorre em workflows filhos, para que uma máquina com falha possa
ser executada novamente sem reiniciar todo o release.

Execute-o a partir de uma referência de workflow confiável, normalmente `main`, e forneça a branch de release,
a tag ou o SHA completo do commit como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

`provider` também aceita `anthropic` ou `minimax` para o onboarding entre sistemas operacionais e o
turno de agente de ponta a ponta. Os jobs filhos reutilizáveis resolvem o ambiente do workflow chamado
a partir de `job.workflow_repository` e `job.workflow_sha`, enquanto a entrada `ref`
seleciona o candidato em teste. Isso mantém a lógica de validação confiável atual
disponível ao validar uma branch de release ou tag mais antiga.

Cada filho disparado deve informar o mesmo SHA de workflow que a execução
`Full Release Validation` pai. Se `main` avançar entre os disparos do pai e dos filhos,
o mecanismo abrangente falhará de forma fechada mesmo que o próprio filho seja bem-sucedido. Para
uma comprovação imutável de commit exato, use
`pnpm ci:full-release --sha <target-sha>`. O auxiliar cria uma referência
`release-ci/*` temporária fixada na `origin/main` confiável atual, fornece o SHA de destino
somente como a `ref` candidata, reutiliza evidências estritas do destino exato quando
disponíveis e exclui a referência após a validação. Forneça
`-f reuse_evidence=false` para forçar uma nova execução ou
`--workflow-sha <trusted-main-sha>` para selecionar um commit de workflow mais antigo que ainda esteja
acessível a partir da `origin/main` atual. O workflow nunca cria nem atualiza
referências do repositório por conta própria.

`release_profile=stable` e `release_profile=full` sempre executam o teste prolongado
live/Docker completo. Forneça `run_release_soak=true` para incluir as mesmas etapas de teste prolongado
com o perfil `beta`. A publicação estável rejeita um manifesto de validação
sem esse teste prolongado e sem evidências bloqueantes de desempenho do produto.

Package Acceptance normalmente compila o tarball candidato a partir da `ref`
resolvida, incluindo execuções com SHA completo disparadas por `pnpm ci:full-release`. Após uma
publicação beta, forneça `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` para reutilizar
o pacote npm publicado nas verificações de release, no Package Acceptance, entre sistemas operacionais,
no Docker do caminho de release e no Telegram do pacote. Use `package_acceptance_package_spec`
somente quando o Package Acceptance precisar comprovar intencionalmente um pacote diferente.
A etapa de pacote live do plugin Codex segue o mesmo estado: valores publicados de
`release_package_spec` derivam `codex_plugin_spec=npm:@openclaw/codex@<version>`;
execuções por SHA/artefato empacotam `extensions/codex` a partir da referência selecionada; e os operadores
podem definir `codex_plugin_spec` diretamente para fontes de plugin `npm:`, `npm-pack:` ou `git:`.
A etapa concede a aprovação explícita de instalação da CLI do Codex exigida por
esse plugin e, em seguida, executa a pré-verificação da CLI do Codex e turnos do agente OpenAI na mesma sessão.

## Estágios de nível superior

Para `rerun_group=all`, um job `Check for reusable validation evidence` é executado
primeiro: ele procura a validação completa verde anterior mais recente para exatamente o mesmo
SHA de destino, perfil de release, configuração efetiva do teste prolongado e entradas de validação.
Quando essa evidência existe, todas as etapas são ignoradas e o verificador abrangente
verifica novamente o artefato imutável do pai, as execuções filhas e os logs de disparo. Isso serve
somente para recuperação de nova execução do mesmo candidato; não autoriza reutilização entre SHAs. Para
um candidato alterado, execute novamente cada porta de pacote, artefato, instalação, Docker ou provedor
afetada por essa diferença. Forneça `reuse_evidence=false` para forçar uma nova execução
completa. A reutilização de evidências ocorre somente a partir de `main` ou de uma referência canônica
`release-ci/*` fixada por SHA cujo commit de workflow permaneça na linhagem confiável de `main`;
outras referências de workflow executam novamente as etapas selecionadas.

Também para `rerun_group=all`, um job `Verify Docker runtime image assets` compila
o destino Docker `runtime-assets` com
`OPENCLAW_EXTENSIONS=diagnostics-otel,codex`. Ele é executado em paralelo com os
outros estágios e é aplicado pelo verificador abrangente; as etapas não aguardam mais
por ele antes do disparo. Um `rerun_group` mais restrito ignora essa pré-verificação.

| Estágio                 | Detalhes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resolução do destino    | **Job:** `Resolve target ref`<br />**Workflow filho:** nenhum<br />**Comprova:** resolve a branch de release, a tag ou o SHA completo do commit e registra as entradas selecionadas.<br />**Nova execução:** execute novamente o mecanismo abrangente se isso falhar.                                                                                                                                                                                                                                                      |
| Pré-verificação de ativos Docker | **Job:** `Verify Docker runtime image assets`<br />**Workflow filho:** nenhum<br />**Comprova:** o destino de compilação Docker `runtime-assets` continua sendo bem-sucedido antes que qualquer outro estágio seja disparado. Executado somente para `rerun_group=all`.<br />**Nova execução:** execute novamente o mecanismo abrangente com `rerun_group=all`.                                                                                                                                                            |
| Vitest e CI normal      | **Job:** `Run normal full CI`<br />**Workflow filho:** `CI`<br />**Comprova:** o grafo completo de CI manual com a referência de destino, incluindo etapas do Node no Linux, shards de plugins incluídos, shards de contratos de plugins e canais, compatibilidade com Node 22, `check-*`, `check-additional-*`, verificações rápidas de artefatos compilados, verificações de documentação, Skills em Python, Windows, macOS, internacionalização da Control UI e Android por meio do mecanismo abrangente.<br />**Nova execução:** `rerun_group=ci`. |
| Pré-release de plugins  | **Job:** `Run plugin prerelease validation`<br />**Workflow filho:** `Plugin Prerelease`<br />**Comprova:** verificações estáticas de plugins exclusivas de release, cobertura agêntica de plugins, shards completos de lotes de plugins, etapas Docker de pré-release de plugins e um artefato não bloqueante `plugin-inspector-advisory` para triagem de compatibilidade.<br />**Nova execução:** `rerun_group=plugin-prerelease`.                                                                                                           |
| Verificações de release | **Job:** `Run release/live/Docker/QA validation`<br />**Workflow filho:** `OpenClaw Release Checks`<br />**Comprova:** verificação rápida de instalação, verificações de pacote entre sistemas operacionais, Package Acceptance, paridade do QA Lab, Matrix live e Telegram live. Os perfis estável e completo também executam suítes live/E2E completas e blocos Docker do caminho de release; beta pode habilitá-los com `run_release_soak=true`.<br />**Nova execução:** `rerun_group=release-checks` ou um identificador de release-checks mais restrito. |
| Telegram do pacote      | **Job:** `Run package Telegram E2E`<br />**Workflow filho:** `NPM Telegram Beta E2E`<br />**Comprova:** um E2E focado do Telegram com o pacote publicado quando `release_package_spec` ou `npm_telegram_package_spec` está definido. A validação completa do candidato usa, em vez disso, o E2E canônico do Telegram no Package Acceptance.<br />**Nova execução:** `rerun_group=npm-telegram` com `release_package_spec` ou `npm_telegram_package_spec`.                                                                                      |
| Desempenho do produto   | **Job:** `Run product performance evidence`<br />**Workflow filho:** `OpenClaw Performance`<br />**Comprova:** execução de desempenho do perfil de release (`profile=release`, `repeat=3`, `fail_on_regression=true`, `publish_reports=false`) com o SHA de destino. A saída do Kova permanece nos artefatos do workflow, e o filho deve comprovar que seu publicador de relatórios foi ignorado. Obrigatório (bloqueante) somente para `rerun_group=all` ou `rerun_group=performance`; não é obrigatório para grupos de nova execução mais restritos.<br />**Nova execução:** `rerun_group=performance`. |
| Verificador abrangente  | **Job:** `Verify full validation`<br />**Workflow filho:** nenhum<br />**Comprova:** verifica novamente as conclusões registradas das execuções filhas e adiciona tabelas dos jobs mais lentos dos workflows filhos.<br />**Nova execução:** execute novamente somente este job após executar novamente um filho com falha até ele ficar verde.                                                                                                                                                                                       |

O mecanismo abrangente sempre dispara o desempenho do produto no modo somente artefato.
`OpenClaw Performance` permite a publicação de relatórios somente para execuções agendadas ou para um
disparo manual que defina explicitamente `publish_reports=true`. A proteção de somente artefato
deve ser concluída com sucesso, comprovando que o job publicador permaneceu ignorado.
Evidências novas e reutilizadas registram
`controls.performanceReportPublication=artifact-only`; o verificador e o seletor de reutilização
rejeitam evidências sem a comprovação normalizada correspondente do filho de desempenho.

O verificador envia o manifesto canônico como
`full-release-validation-<run-id>-<run-attempt>`. As ferramentas de evidência validam
o ID do artefato, o resumo, a execução produtora e a tentativa antes de baixar exatamente esse
ID de artefato. Elas limitam o ZIP baixado, verificam seus bytes em relação ao resumo REST
`sha256:` e transmitem a única entrada de manifesto limitada permitida sem
extrair o arquivo. Um alias de nome estável permanece temporariamente para consumidores de
publicação mais antigos. O verificador sempre prefere o artefato qualificado pela tentativa;
como transição, ele aceita o nome estável somente para um produtor de manifesto v2 na tentativa 1.
Ele rejeita esse nome legado em tentativas posteriores e no manifesto v3.

Para `ref=main` com `rerun_group=all`, para referências `release/*` e para referências alfa do Tideclaw,
uma execução abrangente mais nova substitui uma mais antiga com a mesma referência e
o mesmo grupo de nova execução. Quando o pai é cancelado, seu monitor cancela qualquer workflow
filho que ele já tenha disparado. Execuções de validação com tag e SHA fixado não
cancelam umas às outras.

## Estágios das verificações de release

`OpenClaw Release Checks` é o maior workflow filho. Ele resolve o destino
uma vez e prepara um artefato compartilhado `release-package-under-test` quando estágios
relacionados a pacotes ou ao Docker precisam dele.

| Etapa                    | Detalhes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Destino da versão        | **Job:** `Resolve target ref`<br />**Workflow subjacente:** nenhum<br />**Testes:** ref selecionada, SHA esperado opcional, perfil, grupo de reexecução e filtro específico da suíte live.<br />**Reexecução:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                                                                                      |
| Artefato do pacote       | **Job:** `Prepare release package artifact`<br />**Workflow subjacente:** nenhum<br />**Testes:** empacota ou resolve um tarball candidato e envia `release-package-under-test` para verificações subsequentes relacionadas ao pacote.<br />**Reexecução:** o grupo de pacote, multiplataforma ou live/E2E afetado.                                                                                                                                                                                                                                                            |
| Smoke de instalação      | **Job:** `Run install smoke`<br />**Workflow subjacente:** `Install Smoke`<br />**Testes:** caminho completo de instalação com reutilização da imagem de smoke do Dockerfile raiz, instalação do pacote por QR, smokes do Docker raiz e do Gateway, testes do instalador no Docker e smoke do provedor de imagens com instalação global pelo Bun.<br />**Reexecução:** `rerun_group=install-smoke`.                                                                                                                                                                                  |
| Multiplataforma          | **Job:** `cross_os_release_checks`<br />**Workflow subjacente:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Testes:** fluxos de instalação nova e atualização no Linux, Windows e macOS para o provedor e o modo selecionados, usando o tarball candidato e um pacote de referência.<br />**Reexecução:** `rerun_group=cross-os`.                                                                                                                                                                                                                                         |
| E2E do repositório e live | **Job:** `Run repo/live E2E validation`<br />**Workflow subjacente:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testes:** E2E do repositório, cache live, streaming por websocket da OpenAI, fragmentos de provedor live nativo e de plugins, além de harnesses baseados em Docker para modelo/backend/Gateway live selecionados por `release_profile`.<br />**Execuções:** `run_release_soak=true`, `release_profile=full` ou `rerun_group=live-e2e` específico.<br />**Reexecução:** `rerun_group=live-e2e`, opcionalmente com `live_suite_filter`.                                                                                |
| Caminho de versão no Docker | **Job:** `Run Docker release-path validation`<br />**Workflow subjacente:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testes:** blocos do caminho de versão no Docker com o artefato de pacote compartilhado.<br />**Execuções:** `run_release_soak=true`, `release_profile=full` ou `rerun_group=live-e2e` específico.<br />**Reexecução:** `rerun_group=live-e2e`.                                                                                                                                                                                                                                     |
| Aceitação do pacote      | **Job:** `Run package acceptance`<br />**Workflow subjacente:** `Package Acceptance`<br />**Testes:** fixtures offline de pacotes de plugins, atualização de plugins, o E2E canônico do pacote Telegram com simulação da OpenAI e verificações de sobrevivência após atualização de versões publicadas usando o mesmo tarball. As verificações bloqueantes da versão usam como referência padrão a versão publicada mais recente; as verificações de soak (`run_release_soak=true`) abrangem as últimas 4 versões estáveis do npm mais 3 versões históricas fixadas (`2026.4.23`, `2026.5.2`, `2026.4.15`) e são executadas com fixtures de atualização de problemas relatados.<br />**Reexecução:** `rerun_group=package`. |
| Painel de maturidade     | **Job:** `Render maturity scorecard release docs`<br />**Workflow subjacente:** `maturity-scorecard.yml`<br />**Testes:** renderiza a documentação consultiva do painel de maturidade com base na ref de destino. Executado somente quando `run_maturity_scorecard=true` é informado.<br />**Reexecução:** `rerun_group=qa` com `run_maturity_scorecard=true`.                                                                                                                                                                                                                              |
| Paridade de QA           | **Job:** `Run QA Lab parity lane` e `Run QA Lab parity report`<br />**Workflow subjacente:** jobs diretos<br />**Testes:** pacotes de paridade agêntica do candidato e da referência, seguidos pelo relatório de paridade.<br />**Reexecução:** `rerun_group=qa-parity` ou `rerun_group=qa`.                                                                                                                                                                                                                                                                                    |
| Paridade de runtime de QA | **Job:** `Run QA Lab runtime parity lane`<br />**Workflow subjacente:** job direto<br />**Testes:** um fluxo de paridade agêntica para o par de runtimes `openclaw`/`codex` (`pnpm openclaw qa suite --runtime-pair openclaw,codex`), incluindo um nível padrão e, com `run_release_soak=true`, um nível de soak. Consultivo: falhas individuais não bloqueiam o verificador das verificações da versão.<br />**Reexecução:** `rerun_group=qa-parity` ou `rerun_group=qa`.                                                                                                                                                    |
| Cobertura de ferramentas do runtime de QA | **Job:** `Enforce QA Lab runtime tool coverage`<br />**Workflow subjacente:** job direto<br />**Testes:** divergência dinâmica de ferramentas entre `openclaw` e `codex` no nível padrão de paridade de runtime (`pnpm openclaw qa coverage --tools`), usando a saída do fluxo de paridade de runtime de QA. Bloqueante: este job não pode ser substituído por uma classificação consultiva.<br />**Reexecução:** `rerun_group=qa-parity` ou `rerun_group=qa`.                                                                                                                                                                                        |
| Matrix live de QA        | **Job:** `Run QA Lab live Matrix lane`<br />**Workflow subjacente:** job direto<br />**Testes:** perfil rápido de QA live do Matrix no ambiente `qa-live-shared`.<br />**Reexecução:** `rerun_group=qa-live` ou `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                                                          |
| Telegram live de QA      | **Job:** `Run QA Lab live Telegram lane`<br />**Workflow subjacente:** job direto<br />**Testes:** QA live do Telegram com concessões de credenciais de CI do Convex.<br />**Reexecução:** `rerun_group=qa-live` ou `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                                                     |
| Verificador da versão    | **Job:** `Verify release checks`<br />**Workflow subjacente:** nenhum<br />**Testes:** jobs obrigatórios de verificação da versão para o grupo de reexecução selecionado.<br />**Reexecução:** reexecute após a aprovação dos jobs filhos específicos.                                                                                                                                                                                                                                                                                                                            |

## Blocos do caminho de versão no Docker

A etapa do caminho de versão no Docker executa estes blocos quando `live_suite_filter` está
vazio:

| Bloco                                                           | Cobertura                                                                                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | Fluxos de smoke principais do caminho de versão no Docker.                                                                 |
| `package-update-openai`                                         | Comportamento de instalação/atualização do pacote da OpenAI, instalação sob demanda do Codex, interações live do plugin Codex e chamadas de ferramentas do Chat Completions. |
| `package-update-anthropic`                                      | Comportamento de instalação e atualização do pacote da Anthropic.                                                          |
| `package-update-core`                                           | Comportamento de pacote e atualização independente de provedor.                                                            |
| `plugins-runtime-plugins`                                       | Fluxos de runtime de plugins que exercitam o comportamento dos plugins.                                                     |
| `plugins-runtime-services`                                      | Fluxos de runtime de plugins live e apoiados por serviços.                                                                 |
| `plugins-runtime-install-a` até `plugins-runtime-install-h`     | Lotes de instalação/runtime de plugins divididos para validação paralela da versão.                                         |
| `openwebui`                                                     | Smoke de compatibilidade com o OpenWebUI isolado em um runner dedicado com disco grande quando solicitado.                  |

Use `docker_lanes=<lane[,lane]>` específico no workflow reutilizável live/E2E quando
apenas um fluxo do Docker falhar. Os artefatos da versão incluem comandos de reexecução
por fluxo com entradas para reutilização do artefato de pacote e da imagem, quando disponíveis.

## Perfis de versão

`release_profile` controla principalmente a abrangência de execução ao vivo/provedores nas verificações de lançamento.
Ele não remove a CI completa normal, o Pré-lançamento de Plugins, o smoke de instalação, a
aceitação de pacotes nem o Laboratório de QA. Os perfis estável e completo sempre executam uma cobertura exaustiva de
E2E de repositório/ao vivo e de soak do caminho de lançamento no Docker. O perfil beta pode optar por incluí-la com
`run_release_soak=true`. A Aceitação de Pacotes fornece o E2E canônico de pacote no
Telegram para cada candidato completo, portanto o fluxo abrangente não duplica esse
poller ao vivo.

| Perfil   | Uso pretendido                              | Cobertura ao vivo/de provedores incluída                                                                                                                                                                        |
| -------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beta`   | Smoke crítico de lançamento mais rápido.   | Caminho ao vivo do OpenAI/core, modelos ao vivo no Docker para OpenAI, core nativo do gateway, perfil nativo do Gateway do OpenAI, Plugin nativo do OpenAI e Gateway ao vivo do OpenAI no Docker.                   |
| `stable` | Perfil padrão de aprovação de lançamento.   | `beta` mais smoke do Anthropic, Google, MiniMax, backend, harness nativo de testes ao vivo, backend da CLI ao vivo no Docker, bind de ACP no Docker, harness do Codex no Docker, anúncio de subagente no Docker e um shard de smoke do OpenCode Go. |
| `full`   | Varredura consultiva abrangente.            | `stable` mais provedores consultivos, shards ao vivo de Plugins e shards de mídia ao vivo.                                                                                                                        |

## Adições exclusivas do perfil completo

Estas suítes são ignoradas por `stable` e incluídas por `full`:

| Área                                 | Cobertura exclusiva do perfil completo                                                                                         |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Modelos ao vivo no Docker            | OpenCode Go, OpenRouter, xAI, Z.ai e Fireworks.                                                                                 |
| Gateway ao vivo no Docker            | Provedores consultivos divididos nos shards DeepSeek/Fireworks, OpenCode Go/OpenRouter e xAI/Z.ai.                              |
| Perfis de provedor do Gateway nativo | Shards completos Anthropic Opus e Sonnet/Haiku, Fireworks, DeepSeek, shards completos de modelos OpenCode Go, OpenRouter, xAI e Z.ai. |
| Shards ao vivo de Plugins nativos    | Plugins A-K, L-N, outros O-Z, Moonshot e xAI.                                                                                   |
| Shards de mídia ao vivo nativos      | Áudio, música do Google, música do MiniMax e grupos de vídeo A-D.                                                               |

`stable` inclui `native-live-src-gateway-profiles-anthropic-smoke` e
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` usa, em vez disso, os shards mais abrangentes de
modelos Anthropic e OpenCode Go. Reexecuções direcionadas ainda podem usar os
identificadores agregados `native-live-src-gateway-profiles-anthropic` ou
`native-live-src-gateway-profiles-opencode-go`.

## Reexecuções direcionadas

Use `rerun_group` para evitar repetir caixas de lançamento não relacionadas:

| Identificador       | Escopo                                                                                              |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| `all`               | Todas as etapas da Validação Completa de Lançamento.                                                |
| `ci`                | Somente o fluxo filho manual de CI completa.                                                        |
| `plugin-prerelease` | Somente o fluxo filho de Pré-lançamento de Plugins.                                                 |
| `release-checks`    | Todas as etapas das Verificações de Lançamento do OpenClaw.                                         |
| `install-smoke`     | Smoke de Instalação até as verificações de lançamento.                                              |
| `cross-os`          | Verificações de lançamento entre sistemas operacionais.                                             |
| `live-e2e`          | E2E de repositório/ao vivo e validação do caminho de lançamento no Docker.                           |
| `package`           | Aceitação de Pacotes.                                                                               |
| `qa`                | Paridade de QA mais trilhas ao vivo de QA.                                                          |
| `qa-parity`         | Somente trilhas e relatório de paridade de QA.                                                      |
| `qa-live`           | Trilhas ao vivo de QA para Matrix/Telegram, além de Discord, WhatsApp e Slack condicionadas quando habilitadas. |
| `npm-telegram`      | E2E do Telegram com pacote publicado; requer `release_package_spec` ou `npm_telegram_package_spec`.  |
| `performance`       | Somente evidências de desempenho do produto.                                                        |

Use `live_suite_filter` com `rerun_group=live-e2e` quando uma suíte ao vivo falhar.
Os ids de filtro válidos são definidos no workflow reutilizável ao vivo/E2E, incluindo
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` e
`live-codex-harness-docker`.

O identificador `live-gateway-advisory-docker` é um identificador de reexecução agregado para seus
três shards de provedores, portanto ele ainda se desdobra em todos os jobs consultivos do Gateway no Docker.

Use `cross_os_suite_filter` com `rerun_group=cross-os` quando uma trilha entre sistemas operacionais
falhar. O filtro aceita um id de sistema operacional, um id de suíte ou um par sistema operacional/suíte, por
exemplo, `windows/packaged-upgrade`, `windows` ou `packaged-fresh`. Os resumos entre sistemas operacionais
incluem tempos por fase para trilhas de upgrade empacotado, e comandos de longa duração
imprimem linhas de Heartbeat para que uma atualização travada fique visível antes do
tempo limite do job.

Falhas nas verificações de lançamento de QA bloqueiam a validação normal de lançamento. A verificação da
cobertura de ferramentas do runtime de QA (desvio dinâmico de ferramentas entre `openclaw` e `codex` no
nível padrão) também bloqueia o verificador das verificações de lançamento, embora a
trilha subjacente de paridade do runtime de QA seja consultiva. Execuções alpha do Tideclaw ainda podem
tratar como consultivas as trilhas de verificação de lançamento que não envolvam a segurança do pacote. Com
`release_profile=beta`, as suítes de provedores ao vivo de `Run repo/live E2E validation`
são consultivas: implantações de modelos de terceiros mudam durante um lançamento, portanto
o beta apresenta suas falhas como avisos, enquanto os perfis estável e completo continuam
tratando-as como bloqueadoras. Quando
`live_suite_filter` solicita explicitamente uma trilha ao vivo de QA condicionada, como Discord,
WhatsApp ou Slack, a variável correspondente do repositório `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED`
deve estar habilitada; caso contrário, a captura da entrada falha em vez de ignorar silenciosamente a trilha.
Execute novamente `rerun_group=qa`, `qa-parity` ou `qa-live` quando você
precisar de evidências atualizadas de QA.

## Evidências a manter

Mantenha o resumo de `Full Release Validation` como o índice no nível do lançamento. Ele contém links para
ids de execuções filhas e inclui tabelas dos jobs mais lentos. Em caso de falhas, inspecione primeiro o
workflow filho e, em seguida, execute novamente o menor identificador correspondente acima.

Artefatos úteis:

- `release-package-under-test` de `OpenClaw Release Checks`
- Artefatos do caminho de lançamento no Docker em `.artifacts/docker-tests/`
- `package-under-test` da Aceitação de Pacotes e artefatos de aceitação no Docker
- Artefatos de verificação de lançamento entre sistemas operacionais para cada sistema operacional e suíte
- Artefatos de paridade de QA, paridade de runtime, Matrix e Telegram

## Arquivos de workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/install-smoke-reusable.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
- `.github/workflows/openclaw-performance.yml`
- `.github/workflows/npm-telegram-beta-e2e.yml`
