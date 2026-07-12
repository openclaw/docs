---
read_when:
    - Executando ou reexecutando a Validação Completa da Versão
    - Comparando os perfis de validação das versões estável e completa
    - Depuração de falhas nas etapas de validação de lançamento
summary: Etapas da Validação Completa de Versão, fluxos de trabalho filhos, perfis de versão, identificadores de reexecução e evidências
title: Validação completa da versão
x-i18n:
    generated_at: "2026-07-12T00:21:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0c152128a27b173f131bcf2754c7f06d7bf3e9f7d2d1d0f745ab999f53c78c9
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` é o processo abrangente de lançamento: o ponto de entrada manual único
para comprovação de pré-lançamento. A maior parte do trabalho ocorre em fluxos de trabalho filhos, para que uma máquina com falha possa
ser executada novamente sem reiniciar todo o lançamento.

Execute-o a partir de uma referência confiável do fluxo de trabalho, normalmente `main`, e informe o branch de lançamento,
a tag ou o SHA completo do commit como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

`provider` também aceita `anthropic` ou `minimax` para a integração inicial entre sistemas operacionais e o
turno de ponta a ponta do agente. Os jobs filhos reutilizáveis resolvem o mecanismo do fluxo de trabalho chamado
a partir de `job.workflow_repository` e `job.workflow_sha`, enquanto a entrada `ref`
seleciona o candidato em teste. Isso mantém a lógica de validação confiável atual
disponível ao validar um branch ou uma tag de lançamento mais antigos.

Cada filho disparado deve informar o mesmo SHA do fluxo de trabalho que a execução pai de
`Full Release Validation`. Se `main` avançar entre os disparos do pai e dos filhos,
o processo abrangente falhará de forma segura mesmo que o próprio filho seja bem-sucedido. Para
uma comprovação imutável de um commit exato, use
`pnpm ci:full-release --sha <target-sha>`. O auxiliar cria uma referência temporária
`release-ci/*` fixada no `origin/main` confiável atual, transmite o SHA de destino
somente como a `ref` candidata, reutiliza evidências estritas do destino exato quando
disponíveis e exclui a referência após a validação. Informe
`-f reuse_evidence=false` para forçar uma nova execução ou
`--workflow-sha <trusted-main-sha>` para selecionar um commit mais antigo do fluxo de trabalho que ainda
seja alcançável a partir do `origin/main` atual. O fluxo de trabalho nunca cria nem atualiza
referências do repositório por conta própria.

`release_profile=stable` e `release_profile=full` sempre executam o teste prolongado
exaustivo ao vivo/no Docker. Informe `run_release_soak=true` para incluir as mesmas faixas de teste prolongado
com o perfil `beta`. A publicação estável rejeita um manifesto de validação
sem esse teste prolongado e sem evidências bloqueantes de desempenho do produto.

O Package Acceptance normalmente compila o tarball candidato a partir da
`ref` resolvida, incluindo execuções com SHA completo disparadas por `pnpm ci:full-release`. Após uma
publicação beta, informe `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` para reutilizar
o pacote npm publicado nas verificações de lançamento, no Package Acceptance, entre sistemas operacionais,
no caminho de lançamento do Docker e no Telegram com pacote. Use `package_acceptance_package_spec`
somente quando o Package Acceptance precisar comprovar intencionalmente um pacote diferente.
A faixa de pacote ao vivo do Plugin Codex segue o mesmo estado: valores publicados de
`release_package_spec` derivam `codex_plugin_spec=npm:@openclaw/codex@<version>`;
execuções por SHA/artefato empacotam `extensions/codex` a partir da referência selecionada; e os operadores
podem definir `codex_plugin_spec` diretamente para fontes de Plugin
`npm:`, `npm-pack:` ou `git:`. A faixa concede a aprovação explícita de instalação da CLI do Codex exigida por
esse Plugin e, em seguida, executa a pré-verificação da CLI do Codex e turnos do agente OpenAI na mesma sessão.

## Etapas de nível superior

Para `rerun_group=all`, um job `Check for reusable validation evidence` é executado
primeiro: ele procura a validação completa anterior bem-sucedida mais recente para exatamente o mesmo
SHA de destino, perfil de lançamento, configuração efetiva de teste prolongado e entradas de validação.
Quando essa evidência existe, todas as faixas são ignoradas, e o verificador abrangente
verifica novamente o artefato imutável do pai, as execuções filhas e os logs de disparo. Isso serve
somente para recuperação de reexecução do mesmo candidato; não autoriza reutilização entre SHAs. Para
um candidato alterado, execute novamente cada verificação de pacote, artefato, instalação, Docker ou provedor
afetada por essa diferença. Informe `reuse_evidence=false` para forçar uma nova execução completa.
A reutilização de evidências é executada somente a partir de `main` ou de uma referência canônica
`release-ci/*` fixada por SHA, cujo commit do fluxo de trabalho permaneça na linhagem confiável de `main`;
outras referências do fluxo de trabalho executam novamente as faixas selecionadas.

Também para `rerun_group=all`, um job `Verify Docker runtime image assets` compila
o destino Docker `runtime-assets` com
`OPENCLAW_EXTENSIONS=diagnostics-otel,codex`. Ele é executado em paralelo com as
outras etapas e é imposto pelo verificador abrangente; as faixas não aguardam mais por
ele antes do disparo. Um `rerun_group` mais restrito ignora essa pré-verificação.

| Etapa                   | Detalhes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resolução do destino       | **Job:** `Resolve target ref`<br />**Fluxo de trabalho filho:** nenhum<br />**Comprova:** resolve o branch de lançamento, a tag ou o SHA completo do commit e registra as entradas selecionadas.<br />**Reexecução:** execute novamente o processo abrangente se isso falhar.                                                                                                                                                                                                                                                                                                            |
| Pré-verificação de artefatos do Docker | **Job:** `Verify Docker runtime image assets`<br />**Fluxo de trabalho filho:** nenhum<br />**Comprova:** o destino de compilação Docker `runtime-assets` continua sendo bem-sucedido antes do disparo de qualquer outra etapa. É executado somente para `rerun_group=all`.<br />**Reexecução:** execute novamente o processo abrangente com `rerun_group=all`.                                                                                                                                                                                                                                         |
| Vitest e CI normal    | **Job:** `Run normal full CI`<br />**Fluxo de trabalho filho:** `CI`<br />**Comprova:** o grafo manual completo de CI em relação à referência de destino, incluindo faixas Linux Node, fragmentos de Plugins integrados, fragmentos de contratos de Plugins e canais, compatibilidade com Node 22, `check-*`, `check-additional-*`, verificações rápidas de artefatos compilados, verificações da documentação, Skills em Python, Windows, macOS, internacionalização da Control UI e Android por meio do processo abrangente.<br />**Reexecução:** `rerun_group=ci`.                                                                                          |
| Pré-lançamento de Plugins       | **Job:** `Run plugin prerelease validation`<br />**Fluxo de trabalho filho:** `Plugin Prerelease`<br />**Comprova:** verificações estáticas de Plugins exclusivas do lançamento, cobertura agêntica de Plugins, fragmentos completos de lotes de Plugins, faixas Docker de pré-lançamento de Plugins e um artefato não bloqueante `plugin-inspector-advisory` para triagem de compatibilidade.<br />**Reexecução:** `rerun_group=plugin-prerelease`.                                                                                                                                                          |
| Verificações de lançamento          | **Job:** `Run release/live/Docker/QA validation`<br />**Fluxo de trabalho filho:** `OpenClaw Release Checks`<br />**Comprova:** verificação rápida de instalação, verificações de pacote entre sistemas operacionais, Package Acceptance, paridade do QA Lab, Matrix ao vivo e Telegram ao vivo. Os perfis estável e completo também executam conjuntos exaustivos ao vivo/E2E e blocos do caminho de lançamento do Docker; a versão beta pode ativá-los com `run_release_soak=true`.<br />**Reexecução:** `rerun_group=release-checks` ou um identificador mais restrito de verificações de lançamento.                                                                |
| Telegram com pacote        | **Job:** `Run package Telegram E2E`<br />**Fluxo de trabalho filho:** `NPM Telegram Beta E2E`<br />**Comprova:** um E2E focado do Telegram com pacote publicado quando `release_package_spec` ou `npm_telegram_package_spec` está definido. A validação completa do candidato usa, em vez disso, o E2E canônico do Telegram do Package Acceptance.<br />**Reexecução:** `rerun_group=npm-telegram` com `release_package_spec` ou `npm_telegram_package_spec`.                                                                                                              |
| Desempenho do produto     | **Job:** `Run product performance evidence`<br />**Fluxo de trabalho filho:** `OpenClaw Performance`<br />**Comprova:** execução de desempenho do perfil de lançamento (`profile=release`, `repeat=3`, `fail_on_regression=true`, `publish_reports=false`) em relação ao SHA de destino. A saída do Kova permanece nos artefatos do fluxo de trabalho, e o filho deve comprovar que o publicador de relatórios foi ignorado. Obrigatório (bloqueante) somente para `rerun_group=all` ou `rerun_group=performance`; não é obrigatório para grupos de reexecução mais restritos.<br />**Reexecução:** `rerun_group=performance`. |
| Verificador abrangente       | **Job:** `Verify full validation`<br />**Fluxo de trabalho filho:** nenhum<br />**Comprova:** verifica novamente as conclusões registradas das execuções filhas e acrescenta tabelas dos jobs mais lentos dos fluxos de trabalho filhos.<br />**Reexecução:** execute novamente somente este job após executar novamente um filho com falha até que ele seja bem-sucedido.                                                                                                                                                                                                                                                                 |

O processo abrangente sempre dispara o desempenho do produto no modo somente artefato.
`OpenClaw Performance` permite a publicação de relatórios somente para execuções agendadas ou para um
disparo manual que defina explicitamente `publish_reports=true`. A proteção do modo somente artefato
deve ser concluída com êxito, comprovando que o job de publicação permaneceu ignorado.
Evidências novas e reutilizadas registram
`controls.performanceReportPublication=artifact-only`; o verificador e o seletor de reutilização
rejeitam evidências sem a comprovação normalizada correspondente do filho de desempenho.

O verificador envia o manifesto canônico como
`full-release-validation-<run-id>-<run-attempt>`. As ferramentas de evidência validam
o ID do artefato, o resumo criptográfico, a execução produtora e a tentativa antes de baixar exatamente esse
ID de artefato. Elas limitam o tamanho do ZIP baixado, verificam seus bytes em relação ao resumo
`sha256:` da API REST e transmitem a única entrada delimitada permitida do manifesto sem
extrair o arquivo. Um alias com nome estável permanece temporariamente para consumidores de
publicação mais antigos. O verificador sempre prefere o artefato qualificado pela tentativa;
como transição, ele aceita o nome estável somente para um produtor de manifesto v2 na tentativa 1.
Ele rejeita esse nome legado para tentativas posteriores e para o manifesto v3.

Para `ref=main` com `rerun_group=all`, para referências `release/*` e para referências alfa
do Tideclaw, uma execução abrangente mais recente substitui uma anterior com a mesma referência e
o mesmo grupo de reexecução. Quando o pai é cancelado, seu monitor cancela todos os fluxos de trabalho
filhos que ele já tenha disparado. Execuções de validação por tag e por SHA fixado não
cancelam umas às outras.

## Etapas das verificações de lançamento

`OpenClaw Release Checks` é o maior fluxo de trabalho filho. Ele resolve o destino
uma vez e prepara um artefato compartilhado `release-package-under-test` quando etapas
voltadas a pacotes ou ao Docker precisam dele.

| Etapa                    | Detalhes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Destino da versão           | **Job:** `Resolve target ref`<br />**Workflow subjacente:** nenhum<br />**Testes:** referência selecionada, SHA esperado opcional, perfil, grupo de nova execução e filtro da suíte live focada.<br />**Nova execução:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                                                                                                             |
| Artefato do pacote         | **Job:** `Prepare release package artifact`<br />**Workflow subjacente:** nenhum<br />**Testes:** empacota ou resolve um único tarball candidato e carrega `release-package-under-test` para verificações posteriores relacionadas ao pacote.<br />**Nova execução:** o grupo afetado de pacote, multiplataforma ou live/E2E.                                                                                                                                                                                                                                                                                             |
| Smoke de instalação            | **Job:** `Run install smoke`<br />**Workflow subjacente:** `Install Smoke`<br />**Testes:** caminho completo de instalação com reutilização da imagem de smoke do Dockerfile raiz, instalação de pacote por QR, smokes Docker da raiz e do Gateway, testes Docker do instalador e smoke do provedor de imagens com instalação global pelo Bun.<br />**Nova execução:** `rerun_group=install-smoke`.                                                                                                                                                                                                                                                           |
| Multiplataforma                 | **Job:** `cross_os_release_checks`<br />**Workflow subjacente:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Testes:** fluxos de instalação nova e atualização no Linux, Windows e macOS para o provedor e o modo selecionados, usando o tarball candidato e um pacote de referência.<br />**Nova execução:** `rerun_group=cross-os`.                                                                                                                                                                                                                                                                 |
| E2E do repositório e live        | **Job:** `Run repo/live E2E validation`<br />**Workflow subjacente:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testes:** E2E do repositório, cache live, streaming por websocket da OpenAI, fragmentos do provedor live nativo e de plugins, além de ambientes de teste de modelo/backend/Gateway live baseados em Docker, selecionados por `release_profile`.<br />**Execuções:** `run_release_soak=true`, `release_profile=full` ou `rerun_group=live-e2e` focado.<br />**Nova execução:** `rerun_group=live-e2e`, opcionalmente com `live_suite_filter`.                                                                                |
| Caminho de versão do Docker      | **Job:** `Run Docker release-path validation`<br />**Workflow subjacente:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testes:** blocos Docker do caminho de versão usando o artefato de pacote compartilhado.<br />**Execuções:** `run_release_soak=true`, `release_profile=full` ou `rerun_group=live-e2e` focado.<br />**Nova execução:** `rerun_group=live-e2e`.                                                                                                                                                                                                                                     |
| Aceitação do pacote       | **Job:** `Run package acceptance`<br />**Workflow subjacente:** `Package Acceptance`<br />**Testes:** fixtures offline de pacotes de plugins, atualização de plugin, o E2E canônico do pacote do Telegram com simulação da OpenAI e verificações de sobrevivência à atualização publicada usando o mesmo tarball. As verificações bloqueantes da versão usam, por padrão, a versão de referência publicada mais recente; as verificações de imersão (`run_release_soak=true`) abrangem as últimas 4 versões estáveis do npm, além de 3 versões históricas fixadas (`2026.4.23`, `2026.5.2`, `2026.4.15`), executadas com fixtures de atualização de problemas relatados.<br />**Nova execução:** `rerun_group=package`. |
| Tabela de pontuação de maturidade       | **Job:** `Render maturity scorecard release docs`<br />**Workflow subjacente:** `maturity-scorecard.yml`<br />**Testes:** renderiza a documentação consultiva da tabela de pontuação de maturidade usando a referência de destino. É executado somente quando `run_maturity_scorecard=true` é fornecido.<br />**Nova execução:** `rerun_group=qa` com `run_maturity_scorecard=true`.                                                                                                                                                                                                                                                           |
| Paridade de QA                | **Job:** `Run QA Lab parity lane` e `Run QA Lab parity report`<br />**Workflow subjacente:** jobs diretos<br />**Testes:** pacotes de paridade agêntica do candidato e da referência, seguidos pelo relatório de paridade.<br />**Nova execução:** `rerun_group=qa-parity` ou `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                         |
| Paridade de runtime de QA        | **Job:** `Run QA Lab runtime parity lane`<br />**Workflow subjacente:** job direto<br />**Testes:** um fluxo de paridade agêntica para o par de runtimes `openclaw`/`codex` (`pnpm openclaw qa suite --runtime-pair openclaw,codex`), incluindo um nível padrão e, com `run_release_soak=true`, um nível de imersão. Consultivo: falhas individuais não bloqueiam o verificador das verificações da versão.<br />**Nova execução:** `rerun_group=qa-parity` ou `rerun_group=qa`.                                                                                                                                                    |
| Cobertura de ferramentas do runtime de QA | **Job:** `Enforce QA Lab runtime tool coverage`<br />**Workflow subjacente:** job direto<br />**Testes:** divergência dinâmica de ferramentas entre `openclaw` e `codex` no nível padrão de paridade de runtime (`pnpm openclaw qa coverage --tools`), usando a saída do fluxo de paridade de runtime de QA. Bloqueante: este job não pode ser substituído por uma condição consultiva.<br />**Nova execução:** `rerun_group=qa-parity` ou `rerun_group=qa`.                                                                                                                                                                                        |
| Matrix live de QA           | **Job:** `Run QA Lab live Matrix lane`<br />**Workflow subjacente:** job direto<br />**Testes:** perfil rápido de QA live do Matrix no ambiente `qa-live-shared`.<br />**Nova execução:** `rerun_group=qa-live` ou `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                                                          |
| Telegram live de QA         | **Job:** `Run QA Lab live Telegram lane`<br />**Workflow subjacente:** job direto<br />**Testes:** QA live do Telegram com concessões de credenciais de CI do Convex.<br />**Nova execução:** `rerun_group=qa-live` ou `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                                                                      |
| Verificador da versão         | **Job:** `Verify release checks`<br />**Workflow subjacente:** nenhum<br />**Testes:** jobs obrigatórios de verificação da versão para o grupo de nova execução selecionado.<br />**Nova execução:** execute novamente após a aprovação dos jobs filhos focados.                                                                                                                                                                                                                                                                                                                                                                                   |

## Blocos do caminho de versão do Docker

A etapa do caminho de versão do Docker executa estes blocos quando `live_suite_filter` está
vazio:

| Bloco                                                           | Cobertura                                                                                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | Fluxos de smoke do caminho de versão do Docker principal.                                                                                      |
| `package-update-openai`                                         | Comportamento de instalação/atualização do pacote da OpenAI, instalação sob demanda do Codex, interações live do plugin Codex e chamadas de ferramentas do Chat Completions. |
| `package-update-anthropic`                                      | Comportamento de instalação e atualização do pacote da Anthropic.                                                                             |
| `package-update-core`                                           | Comportamento de pacote e atualização independente de provedor.                                                                              |
| `plugins-runtime-plugins`                                       | Fluxos de runtime de plugins que exercitam o comportamento dos plugins.                                                                        |
| `plugins-runtime-services`                                      | Fluxos de runtime de plugins live e com serviços de apoio.                                                                              |
| `plugins-runtime-install-a` a `plugins-runtime-install-h` | Lotes de instalação/runtime de plugins divididos para validação paralela da versão.                                                      |
| `openwebui`                                                     | Smoke de compatibilidade com o OpenWebUI isolado em um executor dedicado com disco grande quando solicitado.                                    |

Use `docker_lanes=<lane[,lane]>` direcionado no workflow live/E2E reutilizável quando
apenas um fluxo do Docker tiver falhado. Os artefatos da versão incluem comandos
de nova execução por fluxo, com entradas de reutilização do artefato do pacote e da imagem quando disponíveis.

## Perfis de versão

`release_profile` controla principalmente a abrangência de execução ao vivo/provedores nas verificações de lançamento.
Ele não remove a CI completa normal, o pré-lançamento de Plugins, o teste rápido de instalação, a
aceitação de pacotes nem o QA Lab. Os perfis estável e completo sempre executam uma cobertura
exaustiva de E2E do repositório/ao vivo e de testes prolongados do caminho de lançamento no Docker. O perfil beta pode optar por essa cobertura com
`run_release_soak=true`. A Aceitação de Pacotes fornece o E2E canônico do Telegram para o pacote
de cada candidato completo, portanto o fluxo abrangente não duplica esse verificador
ao vivo.

| Perfil   | Uso pretendido                                | Cobertura ao vivo/de provedores incluída                                                                                                                                                                         |
| -------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beta`   | Teste rápido crítico para lançamento.         | Caminho ao vivo do OpenAI/núcleo, modelos ao vivo no Docker para OpenAI, núcleo nativo do Gateway, perfil nativo do Gateway da OpenAI, Plugin nativo da OpenAI e Gateway ao vivo da OpenAI no Docker.              |
| `stable` | Perfil padrão de aprovação de lançamento.     | `beta` mais teste rápido da Anthropic, Google, MiniMax, backend, infraestrutura nativa de testes ao vivo, backend da CLI ao vivo no Docker, vínculo ACP no Docker, infraestrutura do Codex no Docker, anúncio de subagente no Docker e um fragmento de teste rápido do OpenCode Go. |
| `full`   | Verificação consultiva abrangente.            | `stable` mais provedores consultivos, fragmentos de Plugins ao vivo e fragmentos de mídia ao vivo.                                                                                                                |

## Adições exclusivas do perfil completo

Estas suítes são ignoradas por `stable` e incluídas por `full`:

| Área                                      | Cobertura exclusiva do perfil completo                                                                                                       |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Modelos ao vivo no Docker                 | OpenCode Go, OpenRouter, xAI, Z.ai e Fireworks.                                                                                               |
| Gateway ao vivo no Docker                 | Provedores consultivos divididos nos fragmentos DeepSeek/Fireworks, OpenCode Go/OpenRouter e xAI/Z.ai.                                        |
| Perfis de provedores do Gateway nativo    | Fragmentos completos Anthropic Opus e Sonnet/Haiku, Fireworks, DeepSeek, fragmentos completos de modelos OpenCode Go, OpenRouter, xAI e Z.ai. |
| Fragmentos nativos de Plugins ao vivo     | Plugins A-K, L-N, outros O-Z, Moonshot e xAI.                                                                                                 |
| Fragmentos nativos de mídia ao vivo       | Áudio, música do Google, música do MiniMax e grupos de vídeo A-D.                                                                             |

`stable` inclui `native-live-src-gateway-profiles-anthropic-smoke` e
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` usa, em vez disso, os fragmentos
mais abrangentes de modelos da Anthropic e do OpenCode Go. Reexecuções específicas ainda podem usar os
identificadores agregados `native-live-src-gateway-profiles-anthropic` ou
`native-live-src-gateway-profiles-opencode-go`.

## Reexecuções específicas

Use `rerun_group` para evitar repetir ambientes de lançamento não relacionados:

| Identificador        | Escopo                                                                                                            |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `all`                | Todas as etapas da Validação Completa de Lançamento.                                                             |
| `ci`                 | Somente o fluxo filho manual de CI completa.                                                                     |
| `plugin-prerelease`  | Somente o fluxo filho de pré-lançamento de Plugins.                                                              |
| `release-checks`     | Todas as etapas das Verificações de Lançamento do OpenClaw.                                                      |
| `install-smoke`      | Do teste rápido de instalação até as verificações de lançamento.                                                 |
| `cross-os`           | Verificações de lançamento entre sistemas operacionais.                                                         |
| `live-e2e`           | Validação E2E do repositório/ao vivo e do caminho de lançamento no Docker.                                       |
| `package`            | Aceitação de Pacotes.                                                                                            |
| `qa`                 | Paridade de QA mais faixas de QA ao vivo.                                                                        |
| `qa-parity`          | Somente faixas e relatório de paridade de QA.                                                                    |
| `qa-live`            | Matrix/Telegram de QA ao vivo mais faixas condicionadas do Discord, WhatsApp e Slack, quando habilitadas.       |
| `npm-telegram`       | E2E do Telegram com pacote publicado; requer `release_package_spec` ou `npm_telegram_package_spec`.              |
| `performance`        | Somente evidências de desempenho do produto.                                                                     |

Use `live_suite_filter` com `rerun_group=live-e2e` quando uma suíte ao vivo falhar.
Os IDs de filtro válidos são definidos no fluxo reutilizável de execução ao vivo/E2E, incluindo
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` e
`live-codex-harness-docker`.

O identificador `live-gateway-advisory-docker` é um identificador agregado de reexecução para seus
três fragmentos de provedores, portanto ele ainda distribui a execução para todos os trabalhos consultivos do Gateway
no Docker.

Use `cross_os_suite_filter` com `rerun_group=cross-os` quando uma faixa entre sistemas operacionais
falhar. O filtro aceita um ID de sistema operacional, um ID de suíte ou um par sistema operacional/suíte, por
exemplo, `windows/packaged-upgrade`, `windows` ou `packaged-fresh`. Os resumos entre sistemas operacionais
incluem tempos por fase para as faixas de atualização com pacote, e comandos de longa duração
imprimem linhas de Heartbeat para que uma atualização travada fique visível antes do tempo limite
do trabalho.

Falhas nas verificações de lançamento de QA bloqueiam a validação normal de lançamento. A verificação de
cobertura das ferramentas de execução de QA (divergência dinâmica de ferramentas entre `openclaw` e `codex` na
camada padrão) também bloqueia o verificador das verificações de lançamento, embora a
faixa subjacente de paridade de execução de QA seja consultiva. As execuções alfa do Tideclaw ainda podem
tratar como consultivas as faixas de verificação de lançamento não relacionadas à segurança de pacotes. Com
`release_profile=beta`, as suítes de provedores ao vivo de `Run repo/live E2E validation`
são consultivas: as implantações de modelos de terceiros mudam independentemente de um lançamento, portanto
o beta apresenta suas falhas como avisos, enquanto os perfis estável e completo as mantêm
como bloqueantes. Quando
`live_suite_filter` solicita explicitamente uma faixa condicionada de QA ao vivo, como Discord,
WhatsApp ou Slack, a variável correspondente do repositório `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED`
deve estar habilitada; caso contrário, a captura da entrada falha em vez de ignorar silenciosamente a faixa.
Execute novamente com `rerun_group=qa`, `qa-parity` ou `qa-live` quando
precisar de evidências atualizadas de QA.

## Evidências a manter

Mantenha o resumo de `Full Release Validation` como índice no nível do lançamento. Ele contém links para
os IDs das execuções filhas e inclui tabelas dos trabalhos mais lentos. Em caso de falhas, inspecione primeiro o fluxo
filho e depois execute novamente o menor identificador correspondente acima.

Artefatos úteis:

- `release-package-under-test` de `OpenClaw Release Checks`
- Artefatos do caminho de lançamento no Docker em `.artifacts/docker-tests/`
- `package-under-test` da Aceitação de Pacotes e artefatos de aceitação no Docker
- Artefatos de verificação de lançamento entre sistemas operacionais para cada sistema operacional e suíte
- Artefatos de paridade de QA, paridade de execução, Matrix e Telegram

## Arquivos de fluxo de trabalho

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
