---
read_when:
    - Você precisa entender por que um job de CI foi ou não executado
    - Você está depurando uma verificação com falha no GitHub Actions
    - Você está coordenando uma execução ou reexecução da validação de uma versão distribuída
    - Você está alterando o encaminhamento de atividade do ClawSweeper ou do GitHub
summary: Grafo de jobs de CI, gates de escopo, conjuntos de verificações de lançamento e comandos locais equivalentes
title: Pipeline de CI
x-i18n:
    generated_at: "2026-07-12T14:57:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a8ff447c56fabf3148d4368567c2365e6940f00aded8b7212ae3d232a777d92a
    source_path: ci.md
    workflow: 16
---

O CI do OpenClaw é executado em pushes para `main` (caminhos de Markdown e `docs/**` são ignorados
no gatilho), em pull requests que não sejam rascunhos (diffs somente de CHANGELOG são ignorados)
e em acionamentos manuais. Os pushes canônicos para `main` passam primeiro por uma janela de admissão de 90 segundos
em um executor hospedado; o grupo de concorrência `CI` cancela essa execução em espera
quando um commit mais recente chega, para que merges sequenciais não registrem, cada um, uma matriz
completa do Blacksmith. Pull requests e acionamentos manuais não aguardam. Em seguida, o job
`preflight` classifica o diff e desativa as etapas dispendiosas quando
apenas áreas não relacionadas foram alteradas. As execuções manuais de `workflow_dispatch` ignoram
intencionalmente o escopo inteligente e distribuem o grafo completo para candidatos a lançamento e
validação ampla. As etapas do Android permanecem opcionais por meio de `include_android` (ou da
entrada `release_gate`). A cobertura de plugins exclusiva para lançamentos fica no fluxo de trabalho
separado [`Plugin Prerelease`](#plugin-prerelease) e só é executada a partir de
[`Full Release Validation`](#full-release-validation) ou de um acionamento manual
explícito.

## Visão geral do pipeline

| Job                                | Finalidade                                                                                                                                                                                                                    | Quando é executado                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `preflight`                        | Detectar alterações somente na documentação, escopos alterados e extensões alteradas, além de criar o manifesto de CI                                                                                                        | Sempre em pushes e PRs que não sejam rascunhos              |
| `runner-admission`                 | Debounce hospedado de 90 segundos para pushes canônicos em `main` antes que o trabalho do Blacksmith seja registrado                                                                                                         | Em toda execução de CI; aguarda apenas em pushes canônicos em `main` |
| `security-fast`                    | Detecção de chaves privadas, auditoria de workflows alterados via `zizmor` e auditoria do lockfile de produção                                                                                                               | Sempre em pushes e PRs que não sejam rascunhos              |
| `pnpm-store-warmup`                | Aquecer o cache do store do pnpm fixado pelo lockfile sem bloquear os shards Linux do Node                                                                                                                                    | Quando as lanes do Node ou de verificação da documentação são selecionadas |
| `build-artifacts`                  | Compilar `dist/` e a Control UI, executar verificações de fumaça da CLI compilada e verificar a memória de inicialização e os artefatos compilados incorporados                                                              | Alterações relevantes para o Node                            |
| `control-ui-i18n`                  | Verificar bundles de localidade gerados da Control UI, metadados e memória de tradução; informativo em execuções automáticas e bloqueante na CI de lançamento manual                                                         | Alterações relevantes para i18n da Control UI e CI manual   |
| `checks-fast-core`                 | Lanes rápidas de correção no Linux: bundle + protocolo, inicializador do Bun e tarefa rápida de roteamento de CI                                                                                                             | Alterações relevantes para o Node                            |
| `qa-smoke-ci-profile`              | Duas partes equilibradas e autocontidas do conjunto representativo limitado e automático de QA Smoke; a cobertura completa da taxonomia continua disponível por meio de perfis de QA explícitos                              | Alterações relevantes para o Node                            |
| `checks-fast-contracts-plugins-*`  | Dois shards ponderados de contratos de plugins                                                                                                                                                                                | Alterações relevantes para o Node                            |
| `checks-fast-contracts-channels-*` | Dois shards ponderados de contratos de canais                                                                                                                                                                                 | Alterações relevantes para o Node                            |
| `checks-node-*`                    | Shards dos testes principais do Node, excluindo as lanes de canais, bundles, contratos e extensões                                                                                                                           | Alterações relevantes para o Node                            |
| `check-*`                          | Equivalente fragmentado do gate local principal: proteções, shrinkwrap, metadados de configuração de canais em bundle, tipos de produção, lint, dependências e tipos de teste                                               | Alterações relevantes para o Node                            |
| `check-additional-*`               | Faixas de verificação de limites (incluindo desvio de snapshots de prompts), limites de acessores de sessão/leitores de transcrição/transações SQLite, grupos de lint de extensões, compilação/canário de limites de pacotes e arquitetura da topologia de runtime | Alterações relevantes para o Node                            |
| `checks-node-compat-node22`        | Lane de compilação e verificação de fumaça de compatibilidade com o Node 22                                                                                                                                                    | Acionamento manual de CI para lançamentos                    |
| `check-docs`                       | Verificações de formatação, lint e links quebrados da documentação                                                                                                                                                            | Documentação alterada (PRs e acionamento manual)             |
| `native-i18n`                      | Verificações de inventário de i18n do aplicativo nativo, Android e Apple                                                                                                                                                       | Alterações relevantes para i18n nativa                       |
| `skills-python`                    | Ruff + pytest para Skills com suporte de Python                                                                                                                                                                               | Alterações relevantes para Skills em Python                  |
| `checks-windows`                   | Testes de processos/caminhos específicos do Windows e regressões compartilhadas de especificadores de importação do runtime                                                                                                 | Alterações relevantes para o Windows                         |
| `macos-node`                       | Testes focados de TypeScript no macOS: launchd, Homebrew, caminhos de runtime, scripts de empacotamento e wrapper de grupos de processos                                                                                     | Alterações relevantes para o macOS                           |
| `macos-swift`                      | Lint, compilação e testes de Swift para o aplicativo macOS                                                                                                                                                                    | Alterações relevantes para o macOS                           |
| `ios-build`                        | Geração do projeto Xcode e compilação do aplicativo iOS no simulador                                                                                                                                                           | Alterações no aplicativo iOS, no kit compartilhado de aplicativos ou no Swabble |
| `android`                          | Testes unitários do Android para ambas as variantes e compilação de um APK de depuração                                                                                                                                       | Alterações relevantes para o Android                         |
| `test-performance-agent`           | Workflow separado: otimização diária de testes lentos do Codex após atividade confiável                                                                                                                                       | Sucesso da CI principal ou acionamento manual                |
| `openclaw-performance`             | Workflow separado: relatórios diários/sob demanda de desempenho do runtime Kova com provedor simulado, perfil profundo e lanes ao vivo do GPT 5.6                                                                           | Acionamento agendado e manual                                |

## Ordem de interrupção rápida

1. `runner-admission` aguarda apenas pushes canônicos para `main`; um push mais recente cancela a execução antes do registro no Blacksmith.
2. `preflight` decide quais lanes chegam a existir. As lógicas `docs-scope` e `changed-scope` são etapas dentro desse job, não jobs independentes.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` e `skills-python` falham rapidamente, sem aguardar os jobs mais pesados da matriz de artefatos e plataformas.
4. `build-artifacts` e a verificação consultiva `control-ui-i18n` são executados em paralelo com as lanes rápidas do Linux. A divergência nas localidades geradas permanece visível enquanto o workflow independente de atualização a corrige em segundo plano.
5. Depois disso, as lanes mais pesadas de plataforma e runtime são distribuídas: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` e `android`.

O GitHub pode marcar jobs substituídos como `cancelled` quando um push mais recente chega ao mesmo PR ou ref `main`. Trate isso como ruído de CI, a menos que a execução mais recente para o mesmo ref também esteja falhando. Os jobs de Matrix usam `fail-fast: false`, e `build-artifacts` relata diretamente falhas de canal incorporado, limite de suporte do núcleo e monitoramento do Gateway, em vez de enfileirar pequenos jobs de verificação. A chave automática de concorrência da CI é versionada (`CI-v7-*`), para que um processo zumbi do lado do GitHub em um grupo de fila antigo não possa bloquear indefinidamente execuções mais recentes da main. As execuções manuais da suíte completa usam `CI-manual-v1-*` e não cancelam execuções em andamento. A proteção de memória na inicialização da lista de plugins mantém um limite de 350 MiB no Linux Blacksmith auto-hospedado e permite 425 MiB no Linux hospedado pelo GitHub, cuja linha de base de RSS é maior para a mesma CLI compilada.

Use `pnpm ci:timings`, `pnpm ci:timings:recent` ou `node scripts/ci-run-timings.mjs <run-id>` para resumir o tempo decorrido, o tempo na fila, os jobs mais lentos, as falhas e a barreira de fanout `pnpm-store-warmup` do GitHub Actions. O job `ci-timings-summary` no workflow existe em `ci.yml`, mas está desativado no momento (`if: false`); em vez disso, execute localmente o auxiliar de medição de tempo. Para verificar o tempo de build, consulte a etapa `Build dist` do job `build-artifacts`: `pnpm build:ci-artifacts` exibe `[build-all] phase timings:` e inclui `ui:build`; o job também envia o artefato `startup-memory`.

## Contexto e evidências do PR

Os PRs de colaboradores externos executam uma verificação de contexto e evidências do PR por meio de
`.github/workflows/real-behavior-proof.yml`. O workflow faz checkout da
revisão confiável do workflow (`github.workflow_sha`) e avalia apenas o corpo do PR;
ele não executa código da branch do colaborador.

O gate se aplica a autores de PR que não sejam proprietários, membros,
colaboradores ou bots do repositório. Ele é aprovado quando o corpo do PR contém as seções
`What Problem This Solves` e `Evidence` redigidas pelo autor. A evidência pode ser um
teste focado, resultado de CI, captura de tela, gravação, saída do terminal, observação em tempo real,
log com dados sensíveis removidos ou link para um artefato. O corpo apresenta a intenção e uma validação útil;
os revisores inspecionam o código, os testes e a CI para avaliar a correção.

Quando a verificação falhar, atualize o corpo do PR em vez de enviar outro commit de código.

## Escopo e roteamento

A lógica de escopo fica em `scripts/ci-changed-scope.mjs` e é coberta por testes unitários em `src/scripts/ci-changed-scope.test.ts`. O disparo manual ignora a detecção de escopo alterado e faz o manifesto de pré-verificação agir como se todas as áreas no escopo tivessem sido alteradas.

- **Alterações no fluxo de trabalho de CI** validam o grafo de CI do Node, a análise estática dos fluxos de trabalho e a faixa do Windows (`ci.yml` a executa), mas não forçam, por si só, compilações nativas de iOS, Android ou macOS; essas faixas de plataforma permanecem restritas às alterações no código-fonte da plataforma.
- **Workflow Sanity** executa `actionlint`, `zizmor` em todos os arquivos YAML de fluxo de trabalho, a proteção contra interpolação de ações compostas e a proteção contra marcadores de conflito. O job `security-fast`, restrito ao PR, também executa `zizmor` nos arquivos de fluxo de trabalho alterados para que as descobertas de segurança dos fluxos de trabalho causem falha antecipadamente no grafo principal de CI.
- **Documentação em pushes para `main`** é verificada pelo fluxo de trabalho independente `Docs` com o mesmo espelho de documentação do ClawHub usado pela CI, portanto pushes mistos de código+documentação não colocam também o fragmento `check-docs` da CI na fila. Pull requests e execuções manuais da CI ainda executam `check-docs` pela CI quando a documentação é alterada.
- **TUI PTY** é executado no fragmento Linux Node `checks-node-core-runtime-tui-pty` para alterações da TUI. O fragmento executa `test/vitest/vitest.tui-pty.config.ts` com `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, portanto cobre tanto a faixa determinística de fixture `TuiBackend` quanto o smoke test mais lento de `tui --local`, que simula apenas o endpoint externo do modelo.
- **Alterações apenas no roteamento da CI, o pequeno conjunto de fixtures de testes do núcleo que a tarefa rápida executa diretamente e alterações restritas nos auxiliares de contrato dos plugins** usam um caminho rápido de manifesto exclusivo do Node: `preflight`, `security-fast` e apenas as faixas rápidas afetadas pela alteração — uma única tarefa de roteamento de CI `checks-fast-core`, os dois fragmentos de contrato de plugins ou ambos. Esse caminho ignora artefatos de compilação, compatibilidade com Node 22, contratos de canais, fragmentos completos do núcleo, fragmentos de plugins incluídos e matrizes adicionais de proteções.
- **Verificações do Node no Windows** são restritas a wrappers de processo/caminho específicos do Windows, auxiliares de execução de npm/pnpm/UI, configuração do gerenciador de pacotes e superfícies do fluxo de trabalho de CI que executam essa faixa; alterações não relacionadas no código-fonte, em plugins, no smoke test de instalação e apenas em testes permanecem nas faixas Linux Node.

As famílias de testes do Node mais lentas são divididas ou balanceadas para que cada job permaneça pequeno sem reservar runners em excesso:

- Os contratos de plugins e os contratos de canais são executados, cada um, como dois fragmentos ponderados com suporte do Blacksmith e o runner padrão do GitHub como fallback.
- As faixas rápida/de suporte das unidades do núcleo são executadas separadamente; a infraestrutura de runtime do núcleo é dividida em processo, compartilhada, hooks, segredos e três fragmentos de domínio do cron.
- A resposta automática é executada em workers balanceados, com a subárvore de respostas dividida em fragmentos de executor de agentes, comandos, despacho, sessão e roteamento de estado.
- As configurações de gateway/servidor agêntico (plano de controle) são divididas entre faixas de chat, autenticação, modelo, HTTP/plugin, runtime e inicialização, em vez de aguardarem os artefatos compilados.
- A CI normal agrupa apenas fragmentos isolados por padrão de inclusão da infraestrutura em pacotes determinísticos de, no máximo, 64 arquivos de teste, reduzindo a matriz do Node sem mesclar suítes não isoladas de comando/cron, agents-core com estado ou gateway/servidor. As suítes fixas pesadas permanecem em 8 vCPU, enquanto as faixas agrupadas e de menor peso usam 4 vCPU.
- Pull requests no repositório canônico usam um plano compacto de admissão: os mesmos grupos por configuração são executados em subprocessos isolados, atualmente 19 jobs de teste do Node em vez da matriz completa de 74 jobs. Um único lote de configuração completa é distribuído entre os jobs compactos existentes no mesmo runner, mantendo seu tempo limite de 120 minutos, e a configuração serial de ferramentas é distribuída entre três grupos exclusivos de PR; pushes para `main`, disparos manuais e gates de release mantêm a matriz completa.
- Testes amplos de navegador, QA, mídia e plugins diversos usam suas configurações dedicadas do Vitest em vez do agrupador genérico compartilhado de plugins. Os fragmentos por padrão de inclusão registram entradas de tempo usando o nome do fragmento de CI, para que `.artifacts/vitest-shard-timings.json` possa distinguir uma configuração completa de um fragmento filtrado.
- `check-additional-*` distribui a lista suplementar de proteções de limites (`scripts/run-additional-boundary-checks.mjs`) em um fragmento com uso intensivo de prompts (`check-additional-boundaries-a`, que inclui a verificação de desvio dos snapshots de prompt do Codex) e um fragmento combinado para as faixas restantes (`check-additional-boundaries-bcd`), cada um executando proteções independentes simultaneamente e exibindo os tempos de cada verificação. O trabalho de compilação/canário dos limites de pacotes permanece agrupado, e a arquitetura da topologia de runtime é executada separadamente da cobertura de observação do gateway incorporada em `build-artifacts`.
- A observação do Gateway, os testes de canais e o fragmento de limites de suporte do núcleo são executados simultaneamente dentro de `build-artifacts` depois que `dist/` e `dist-runtime/` já foram compilados.

Após a admissão, a CI canônica do Linux permite até 28 jobs simultâneos de testes do Node e
12 para as faixas rápidas/de verificação menores; Windows e Android permanecem em dois porque
esses pools de runners são mais restritos. Os lotes compactos de configuração completa são executados com um
tempo limite de lote de 120 minutos, enquanto os grupos por padrão de inclusão compartilham o mesmo orçamento
limitado de jobs.

A CI do Android executa `testPlayDebugUnitTest` e `testThirdPartyDebugUnitTest` e depois compila o APK de depuração do Play. A variante de terceiros não tem um conjunto de código-fonte nem manifesto separado; sua faixa de testes unitários ainda compila a variante com os sinalizadores BuildConfig de SMS/log de chamadas, evitando um job duplicado de empacotamento do APK de depuração em cada push relevante para Android.

O fragmento `check-dependencies` executa `pnpm deadcode:dependencies` (uma passagem do Knip exclusiva para dependências de produção, fixada em uma versão exata do Knip, com a idade mínima de lançamento do pnpm desativada para a instalação via `dlx`) e `pnpm deadcode:unused-files`, que compara as descobertas de arquivos de produção não utilizados do Knip com `scripts/deadcode-unused-files.allowlist.mjs`, além de um relatório informativo `pnpm deadcode:report:ci:ts-unused` enviado como o artefato `deadcode-reports`. A proteção de arquivos não utilizados falha quando um PR adiciona um novo arquivo não utilizado e não revisado ou mantém uma entrada obsoleta na lista de permissões, preservando superfícies intencionais de plugins dinâmicos, arquivos gerados, compilação, testes em tempo real e pontes de pacotes que o Knip não consegue resolver estaticamente.

## Encaminhamento de atividades do ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` é a ponte no lado de destino entre a atividade do repositório OpenClaw e o ClawSweeper. Ele não faz checkout nem executa código não confiável de pull requests. O fluxo de trabalho cria um token de GitHub App a partir de `CLAWSWEEPER_APP_PRIVATE_KEY` e então despacha payloads compactos de `repository_dispatch` para `openclaw/clawsweeper`.

O fluxo de trabalho tem quatro faixas:

- `clawsweeper_item` para solicitações de revisão exatas de issues e pull requests;
- `clawsweeper_comment` para comandos explícitos do ClawSweeper em comentários de issues;
- `clawsweeper_commit_review` para solicitações de revisão no nível de commit em pushes para `main`;
- `github_activity` para atividades gerais do GitHub que o agente ClawSweeper pode inspecionar.

A faixa `github_activity` encaminha apenas metadados normalizados: tipo de evento, ação, ator, repositório, número do item, URL, título, estado e pequenos trechos de comentários ou revisões quando presentes. Ela evita intencionalmente encaminhar o corpo completo do Webhook. O fluxo de trabalho receptor em `openclaw/clawsweeper` é `.github/workflows/github-activity.yml`, que envia o evento normalizado para o hook do Gateway do OpenClaw destinado ao agente ClawSweeper.

Atividades gerais são para observação, não para entrega por padrão. O agente ClawSweeper recebe o destino do Discord em seu prompt e deve publicar em `#clawsweeper` somente quando o evento for surpreendente, acionável, arriscado ou operacionalmente útil. Aberturas e edições rotineiras, movimentação de bots, ruído de Webhooks duplicados e tráfego normal de revisões devem resultar em `NO_REPLY`.

Trate títulos, comentários, corpos, textos de revisão, nomes de branches e mensagens de commit do GitHub como dados não confiáveis em todo esse caminho. Eles são entradas para resumo e triagem, não instruções para o fluxo de trabalho ou para o runtime do agente.

## Disparos manuais

Os disparos manuais da CI executam o mesmo grafo de jobs que a CI normal, mas forçam a ativação de todas as faixas no escopo que não sejam do Android: fragmentos Linux Node, fragmentos de plugins incluídos, fragmentos de contratos de plugins e canais, compatibilidade com Node 22, `check-*`, `check-additional-*`, smoke tests de artefatos compilados, verificações de documentação, Skills em Python, Windows, macOS, compilação de iOS e internacionalização da Control UI. A paridade de localidades da Control UI é informativa em execuções automáticas de PR e de `main`, porque o fluxo de trabalho independente de atualização corrige desvios gerados em segundo plano; ela é bloqueante na CI manual e, portanto, na Full Release Validation. Disparos manuais independentes da CI executam o Android somente com `include_android=true` (a entrada `release_gate` também força o Android); o fluxo completo abrangente de release habilita o Android passando `include_android=true`. Verificações estáticas de pré-release de plugins, o fragmento exclusivo de release `agentic-plugins`, a varredura completa em lote de extensões e as faixas Docker de pré-release de plugins são excluídos da CI. A suíte Docker de pré-release é executada somente quando `Full Release Validation` dispara o fluxo de trabalho separado `Plugin Prerelease` com o gate de validação de release habilitado.

As execuções manuais usam um grupo de simultaneidade exclusivo para que uma suíte completa de candidato a release não seja cancelada por outro push ou execução de PR na mesma referência. A entrada opcional `target_ref` permite que um chamador confiável execute esse grafo em uma branch, tag ou SHA completo de commit, usando o arquivo de fluxo de trabalho da referência de disparo selecionada. A entrada `release_gate` é um fallback de mantenedor com SHA exato para casos em que a CI do PR está paralisada por falta de capacidade: ela exige que `target_ref` seja um SHA completo de commit correspondente ao topo da branch disparada.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

O caminho mensal extended-stable somente para npm é a exceção: dispare tanto a pré-verificação `OpenClaw NPM
Release` quanto a `Full Release Validation` a partir da branch exata
`extended-stable/YYYY.M.33`, preserve os IDs de suas execuções e passe ambos os IDs para a
execução de publicação direta no npm. Consulte [Publicação mensal extended-stable
somente para npm](/pt-BR/reference/RELEASING#monthly-npm-only-extended-stable-publication) para
os comandos, requisitos exatos de identidade, releitura do registro e procedimento de
reparo do seletor. Esse caminho não dispara a publicação de plugins, macOS, Windows, GitHub
Release, dist-tag privada nem de outras plataformas.

## Runners

| Executor                        | Tarefas                                                                                                                                                                                                                                                                                             |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | Acionamento manual da CI e fallbacks para repositórios não canônicos, o agregado QA Smoke, verificações de segurança e qualidade do CodeQL, workflow-sanity, labeler, auto-response, o workflow autônomo Docs e todo o workflow Install Smoke                                                          |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, `pnpm-store-warmup`, `native-i18n`, `checks-fast-core`, exceto a CI do QA Smoke, shards de contrato de plugins/canais, a maioria dos shards Linux Node incluídos/de menor carga, lanes `check-*`, exceto `check-lint`, shards `check-additional-*` selecionados, `check-docs` e `skills-python` |
| `blacksmith-8vcpu-ubuntu-2404`  | Suítes pesadas do Linux Node mantidas, shards `check-additional-*` com uso intenso de limites/extensões e `android`                                                                                                                                                                                 |
| `blacksmith-16vcpu-ubuntu-2404` | Shards automáticos da CI do QA Smoke, `build-artifacts` na CI e no Testbox e `check-lint` (sensível o bastante à CPU para que 8 vCPUs custassem mais do que economizavam)                                                                                                                           |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                   |
| `blacksmith-6vcpu-macos-15`     | `macos-node` em `openclaw/openclaw`; forks usam `macos-15` como fallback                                                                                                                                                                                                                           |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` e `ios-build` em `openclaw/openclaw`; forks usam `macos-26` como fallback                                                                                                                                                                                                             |

## Orçamento de registro de executores

O bucket atual de registro de executores do GitHub do OpenClaw informa 10.000 registros de executores auto-hospedados a cada 5 minutos em `ghx api rate_limit`. Verifique novamente `actions_runner_registration` antes de cada rodada de ajuste, pois o GitHub pode alterar esse bucket. O limite é compartilhado por todos os registros de executores do Blacksmith na organização `openclaw`, portanto, adicionar outra instalação do Blacksmith não adiciona um novo bucket.

Trate os rótulos do Blacksmith como o recurso escasso para controle de picos. Tarefas que apenas roteiam, notificam, resumem, selecionam shards ou executam verificações curtas do CodeQL devem permanecer em executores hospedados pelo GitHub, a menos que tenham necessidades específicas do Blacksmith comprovadas por medições. Qualquer nova matriz do Blacksmith, `max-parallel` maior ou workflow de alta frequência deve apresentar sua contagem de registros no pior caso e manter a meta no nível da organização abaixo de aproximadamente 60% do bucket ativo. Com o bucket atual de 10.000 registros, isso significa uma meta operacional de 6.000 registros, deixando margem para repositórios simultâneos, novas tentativas e sobreposição de picos.

A CI do repositório canônico mantém o Blacksmith como caminho padrão de execução para execuções normais de push e pull request. Execuções de `workflow_dispatch` e de repositórios não canônicos usam executores hospedados pelo GitHub, mas as execuções canônicas normais atualmente não verificam a integridade da fila do Blacksmith nem usam automaticamente rótulos hospedados pelo GitHub como fallback quando o Blacksmith está indisponível.

## Equivalentes locais

```bash
pnpm changed:lanes                            # inspeciona o classificador local de lanes alteradas para origin/main...HEAD
pnpm check:changed                            # gate de verificação local inteligente: formatação/typecheck/lint/guardas alterados por lane de limite
pnpm check                                    # gate local rápido: tsgo de produção + lint em shards + guardas rápidos em paralelo
pnpm check:test-types
pnpm check:timed                              # mesmo gate com tempos por etapa
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # testes do vitest
pnpm test:changed                             # alvos Vitest alterados, econômicos e inteligentes
pnpm test:ui                                  # suíte unitária/de navegador da interface de controle
pnpm ui:i18n:check                            # paridade gerada das localidades da interface de controle (gate de lançamento)
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # formatação + lint + links quebrados da documentação
pnpm build                                    # compila dist quando as verificações de artefatos/smoke da CI importam
pnpm ios:build                                # gera e compila o projeto do aplicativo para iOS
pnpm ci:timings                               # resume a execução de CI do push mais recente em origin/main
pnpm ci:timings:recent                        # compara execuções recentes e bem-sucedidas da CI da main
node scripts/ci-run-timings.mjs <run-id>      # resume o tempo total, o tempo de fila e as tarefas mais lentas
node scripts/ci-run-timings.mjs --latest-main # ignora ruído de issues/comentários e escolhe a CI de push de origin/main
node scripts/ci-run-timings.mjs --recent 10   # compara execuções recentes e bem-sucedidas da CI da main
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## Desempenho do OpenClaw

`OpenClaw Performance` é o workflow de desempenho do produto/runtime. Ele é executado diariamente na `main` e pode ser acionado manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

O acionamento manual normalmente mede o desempenho da referência do workflow. Defina `target_ref` para medir uma tag de lançamento ou outra branch com a implementação atual do workflow. Os caminhos dos relatórios publicados e os ponteiros mais recentes são indexados pela referência testada, e cada `index.md` registra a referência/SHA testada, a referência/SHA do workflow, a referência do Kova, o perfil, o modo de autenticação da lane, o modelo, a contagem de repetições e os filtros de cenários.

O workflow instala o OCM de uma versão fixada e o Kova de `openclaw/Kova` na entrada `kova_ref` fixada e, em seguida, executa três lanes:

- `mock-provider`: cenários de diagnóstico do Kova em um runtime de compilação local com autenticação falsa determinística compatível com OpenAI.
- `mock-deep-profile`: criação de perfis de CPU/heap/rastreamento para pontos críticos de inicialização, Gateway e turnos do agente. É executada conforme o agendamento ou por acionamento com `deep_profile=true`.
- `live-openai-candidate`: um turno real do agente OpenAI `openai/gpt-5.6-luna`, ignorado quando `OPENAI_API_KEY` não está disponível. É executada conforme o agendamento ou por acionamento com `live_openai_candidate=true`.

A lane mock-provider também executa sondagens de origem nativas do OpenClaw após a passagem do Kova: tempo de inicialização e memória do Gateway nos casos de inicialização padrão, canal ignorado, hook interno e cinquenta plugins; RSS da importação de plugins incluídos, loops repetidos de saudação `channel-chat-baseline` com OpenAI simulado, comandos de inicialização da CLI no Gateway inicializado e a sondagem de desempenho smoke do estado SQLite. Quando o relatório de origem mock-provider publicado anteriormente está disponível para a referência testada, o resumo da origem compara os valores atuais de RSS e heap com essa linha de base e marca grandes aumentos de RSS como `watch`. O resumo Markdown da sondagem de origem fica em `source/index.md` no pacote de relatórios, com o JSON bruto ao lado.

Cada lane envia seu artefato completo do GitHub, incluindo pacotes de CPU, heap, rastreamento e diagnóstico compactado. Uma tarefa separada de publicação baixa e valida esses artefatos e, em seguida, gera um token de curta duração do GitHub App ClawSweeper, com escopo limitado apenas ao conteúdo de `openclaw/clawgrit-reports`, e o transmite somente à etapa de push do Git. Ela faz commit de `report.json`, `report.md`, `index.md`, artefatos da sondagem de origem e metadados/somas de verificação do pacote em `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`; o arquivo de diagnóstico completo permanece no artefato vinculado do Actions. O publicador rejeita qualquer arquivo de relatório com mais de 50 MB antes de tentar um push. O ponteiro atual da referência testada é `openclaw-performance/<tested-ref>/latest-<lane>.json`. Execuções agendadas e acionamentos com `profile=release` falham se a criação do token do aplicativo ou a publicação do relatório falhar. Acionamentos manuais que não são de lançamento mantêm a publicação como recomendação e preservam os artefatos do GitHub quando a autenticação ou a publicação falha. A linha de base de origem anterior é obtida anonimamente do repositório público de relatórios; portanto, uma obtenção bem-sucedida da linha de base não comprova a autenticação do publicador.

## Validação completa do lançamento

`Full Release Validation` é o workflow abrangente manual para "executar tudo antes do lançamento". Ele aceita uma branch, tag ou SHA completo de commit, aciona o workflow manual `CI` com esse alvo (incluindo Android), aciona `Plugin Prerelease` para comprovação exclusiva de lançamento de plugin/pacote/estática/Docker, aciona `OpenClaw Performance` no SHA de destino e aciona `OpenClaw Release Checks` para smoke de instalação, aceitação de pacote, verificações de pacote entre sistemas operacionais, paridade do QA Lab, Matrix e lanes do Telegram (a renderização consultiva do placar de maturidade é opcional por meio de `run_maturity_scorecard`). Os perfis estável e completo sempre incluem cobertura exaustiva ao vivo/E2E e de soak do caminho de lançamento do Docker; o perfil beta pode ativá-la com `run_release_soak=true`. O E2E canônico do Telegram para o pacote é executado dentro de Package Acceptance, portanto, um candidato completo não inicia um poller ao vivo duplicado. Após a publicação, forneça `release_package_spec` para reutilizar o pacote npm lançado nas verificações de lançamento, Package Acceptance, Docker, verificações entre sistemas operacionais e Telegram sem recompilação. Use `npm_telegram_package_spec` apenas para uma nova execução focada do Telegram com pacote publicado. A lane de pacote ao vivo do plugin Codex usa o mesmo estado selecionado por padrão: `release_package_spec=openclaw@<tag>` publicado deriva `codex_plugin_spec=npm:@openclaw/codex@<tag>`, enquanto execuções por SHA/artefato empacotam `extensions/codex` da referência selecionada. Defina `codex_plugin_spec` explicitamente para fontes personalizadas de plugin, como especificações `npm:`, `npm-pack:` ou `git:`.

Consulte [Validação completa do lançamento](/pt-BR/reference/full-release-validation) para ver a matriz de etapas, os nomes exatos das tarefas do workflow, as diferenças entre perfis, os artefatos e os identificadores de novas execuções focadas.

`OpenClaw Release Publish` é o fluxo de trabalho manual de publicação de versão que realiza alterações. Dispare
publicações beta e estáveis regulares a partir da `main` confiável depois que a tag da versão
existir e depois que a pré-verificação do npm do OpenClaw tiver sido concluída com sucesso (a pré-verificação executa
`pnpm plugins:sync:check` entre suas verificações). A tag ainda seleciona o commit exato
da versão, incluindo um commit em `release/YYYY.M.PATCH`; as publicações alfa do Tideclaw
continuam usando seu branch alfa correspondente. Ele exige o
`preflight_run_id` salvo e um
`full_release_validation_run_id` bem-sucedido e seu
`full_release_validation_run_attempt` exato, dispara `Plugin NPM Release` para todos
os pacotes de Plugin publicáveis, dispara `Plugin ClawHub Release` para o mesmo
SHA da versão e somente então dispara `OpenClaw NPM Release`. A publicação estável também
exige um `windows_node_tag` exato; o fluxo de trabalho verifica a versão de origem
do Windows e compara seus instaladores x64/ARM64 com a entrada
`windows_node_installer_digests` aprovada para o candidato antes de qualquer fluxo filho de publicação, depois promove
e verifica esses mesmos resumos fixados dos instaladores, além do contrato exato do ativo complementar
e da soma de verificação, antes de publicar o rascunho da versão no GitHub.
Reparos direcionados somente a plugins usam `plugin_publish_scope=selected` com uma lista
não vazia de pacotes. Execuções `all-publishable` somente de plugins exigem as mesmas evidências imutáveis
da pré-verificação do npm e da Validação Completa da Versão que uma publicação do núcleo.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

Para comprovar um commit fixado em um branch que muda rapidamente, use o auxiliar em vez de
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

As referências de disparo de fluxos de trabalho do GitHub devem ser branches ou tags, não SHAs brutos de commits. O
auxiliar envia um branch temporário `release-ci/<sha>-...` em um SHA de fluxo de trabalho
da `main` confiável, passa o SHA de destino solicitado pela entrada `ref` do fluxo de trabalho,
reutiliza evidências estritas do destino exato quando disponíveis, verifica se o
`headSha` de cada fluxo de trabalho filho corresponde ao SHA confiável do fluxo de trabalho e exclui o branch temporário
quando a execução é concluída. Passe `-f reuse_evidence=false` para forçar uma
nova validação. O verificador agregador também falha se algum fluxo de trabalho filho tiver sido executado
em um SHA de fluxo de trabalho diferente.

`release_profile` controla a abrangência de ambientes reais/provedores transmitida às verificações da versão. Os
fluxos de trabalho manuais de versão usam `stable` por padrão; use `full` somente quando você
quiser intencionalmente a ampla matriz consultiva de provedores/mídia. As verificações estáveis e completas
da versão sempre executam o soak exaustivo de ambiente real/E2E e do caminho de versão no Docker;
o perfil beta pode optar por executá-lo com `run_release_soak=true`.

- `minimum` mantém as rotas críticas mais rápidas de versão do OpenAI/núcleo.
- `stable` adiciona o conjunto estável de provedores/backends.
- `full` executa a ampla matriz consultiva de provedores/mídia.

O agregador registra os IDs das execuções filhas disparadas, e o job final `Verify full validation` verifica novamente as conclusões atuais das execuções filhas e anexa tabelas dos jobs mais lentos de cada execução filha. Se um fluxo de trabalho filho for executado novamente e ficar verde, execute novamente somente o job verificador pai para atualizar o resultado do agregador e o resumo de tempos.

Para recuperação, tanto `Full Release Validation` quanto `OpenClaw Release Checks` aceitam `rerun_group`. Use `all` para um candidato a versão, `ci` somente para o filho normal de CI completa, `plugin-prerelease` somente para o filho de pré-lançamento de plugins, `performance` somente para o filho OpenClaw Performance, `release-checks` para todos os filhos de versão ou um grupo mais restrito: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` no agregador. Isso mantém delimitada a nova execução de uma máquina de versão que falhou após uma correção direcionada. Para uma única rota entre sistemas operacionais que falhou, combine `rerun_group=cross-os` com `cross_os_suite_filter`, por exemplo, `windows/packaged-upgrade`; comandos longos entre sistemas operacionais emitem linhas de Heartbeat, e os resumos de atualização por pacote incluem tempos por fase. As rotas de verificação de versão de QA são consultivas, exceto pela verificação padrão de cobertura de ferramentas do runtime, que bloqueia quando ferramentas dinâmicas obrigatórias do OpenClaw divergem ou desaparecem do resumo do nível padrão.

`OpenClaw Release Checks` usa a referência confiável do fluxo de trabalho para resolver uma vez a referência selecionada em um tarball `release-package-under-test` e então transmite esse artefato às verificações entre sistemas operacionais e à Aceitação de Pacote, além do fluxo de trabalho Docker do caminho de versão em ambiente real/E2E quando a cobertura de soak é executada. Isso mantém os bytes do pacote consistentes entre as máquinas de versão e evita reempacotar o mesmo candidato em vários jobs filhos. Para a rota em ambiente real do plugin npm do Codex, as verificações da versão transmitem uma especificação correspondente do Plugin publicado derivada de `release_package_spec`, transmitem o `codex_plugin_spec` fornecido pelo operador ou deixam a entrada em branco para que o script do Docker empacote o Plugin do Codex do checkout selecionado.

Execuções duplicadas de `Full Release Validation` para `ref=main` e `rerun_group=all`
substituem o agregador mais antigo. O monitor pai cancela qualquer fluxo de trabalho filho que
já tenha disparado quando o pai é cancelado, para que uma validação mais nova da main
não fique atrás de uma execução obsoleta de duas horas das verificações da versão. A validação de
branch/tag de versão e os grupos de nova execução direcionada mantêm `cancel-in-progress: false`.

## Fragmentos de ambiente real e E2E

O filho de ambiente real/E2E da versão mantém uma ampla cobertura nativa de `pnpm test:live`, mas a executa como fragmentos nomeados por meio de `scripts/test-live-shard.mjs`, em vez de um job serial:

- `native-live-src-agents` e `native-live-src-agents-zai-coding`
- `native-live-src-gateway-core`
- jobs `native-live-src-gateway-profiles` filtrados por provedor
- `native-live-src-gateway-backends`
- `native-live-src-infra`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-moonshot`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- fragmentos separados de áudio/vídeo de mídia e fragmentos de música filtrados por provedor

Isso mantém a mesma cobertura de arquivos e facilita executar novamente e diagnosticar falhas lentas de provedores em ambiente real. Os nomes de fragmentos agregados `native-live-src-gateway`, `native-live-extensions-o-z`, `native-live-extensions-media` e `native-live-extensions-media-music` continuam válidos para novas execuções manuais únicas.

Os fragmentos nativos de mídia em ambiente real são executados em `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, criado pelo fluxo de trabalho `Live Media Runner Image`. Essa imagem pré-instala `ffmpeg` e `ffprobe`; os jobs de mídia apenas verificam os binários antes da configuração. Mantenha as suítes em ambiente real baseadas em Docker em executores normais do Blacksmith — jobs em contêineres são o lugar errado para iniciar testes Docker aninhados.

Os fragmentos de modelo/backend em ambiente real baseados em Docker usam uma imagem compartilhada separada `ghcr.io/openclaw/openclaw-live-test:<sha>-<extensions>` por commit selecionado. O fluxo de trabalho de versão em ambiente real cria e envia essa imagem uma vez; em seguida, os fragmentos de modelo Docker em ambiente real, Gateway dividido por provedor, backend da CLI, vinculação ACP e harness do Codex são executados com `OPENCLAW_SKIP_DOCKER_BUILD=1`. Os fragmentos do Gateway no Docker têm limites explícitos de `timeout` no nível do script, inferiores ao tempo limite do job do fluxo de trabalho, para que um contêiner ou caminho de limpeza travado falhe rapidamente, em vez de consumir todo o orçamento das verificações da versão. Se esses fragmentos recriarem de forma independente o destino Docker completo do código-fonte, a execução da versão estará configurada incorretamente e desperdiçará tempo decorrido com criações duplicadas da imagem.

## Aceitação de Pacote

Use `Package Acceptance` quando a pergunta for "este pacote instalável do OpenClaw funciona como produto?". Ela é diferente da CI normal: a CI normal valida a árvore de código-fonte, enquanto a aceitação de pacote valida um único tarball por meio do mesmo harness E2E do Docker que os usuários utilizam após instalar ou atualizar.

### Jobs

1. `resolve_package` faz checkout de `workflow_ref`, resolve um candidato de pacote, grava `.artifacts/docker-e2e-package/openclaw-current.tgz`, grava `.artifacts/docker-e2e-package/package-candidate.json`, envia ambos como o artefato `package-under-test` e imprime a origem, a referência do fluxo de trabalho, a referência do pacote, a versão, o SHA-256 e o perfil no resumo da etapa do GitHub.
2. `package_integrity` baixa o artefato `package-under-test` e aplica o contrato público do tarball do pacote com `scripts/check-openclaw-package-tarball.mjs`.
3. `docker_acceptance` chama `openclaw-live-and-e2e-checks-reusable.yml` com o SHA de origem resolvido do pacote (usando `workflow_ref` como alternativa) e `package_artifact_name=package-under-test`. O fluxo de trabalho reutilizável baixa esse artefato, valida o inventário do tarball, prepara imagens Docker com o resumo do pacote quando necessário e executa as rotas Docker selecionadas usando esse pacote, em vez de empacotar o checkout do fluxo de trabalho. Quando um perfil seleciona várias `docker_lanes` direcionadas, o fluxo de trabalho reutilizável prepara o pacote e as imagens compartilhadas uma vez e então distribui essas rotas como jobs Docker direcionados em paralelo, com artefatos exclusivos.
4. `package_telegram` chama opcionalmente `NPM Telegram Beta E2E`. Ele é executado quando `telegram_mode` não é `none` e instala o mesmo artefato `package-under-test` quando a Aceitação de Pacote tiver resolvido um; o disparo independente do Telegram ainda pode instalar uma especificação publicada do npm.
5. `summary` faz o fluxo de trabalho falhar se a resolução do pacote, a integridade, a aceitação do Docker ou a rota opcional do Telegram falhar. A entrada `advisory` rebaixa falhas de aceitação para avisos para chamadores consultivos.

### Origens de candidatos

- `source=npm` aceita somente `openclaw@extended-stable`, `openclaw@beta`, `openclaw@latest` ou uma versão exata do OpenClaw, como `openclaw@2026.4.27-beta.2`. Use isso para a aceitação publicada de versão estável estendida, pré-lançamento ou estável.
- `source=ref` empacota um branch, uma tag ou um SHA completo de commit confiável de `package_ref`. O resolvedor busca branches/tags do OpenClaw, verifica se o commit selecionado é alcançável pelo histórico de branches do repositório ou por uma tag de versão, instala as dependências em uma árvore de trabalho desvinculada e o empacota com `scripts/package-openclaw-for-docker.mjs`.
- `source=url` baixa um `.tgz` HTTPS público; `package_sha256` é obrigatório. Esse caminho rejeita credenciais na URL, portas HTTPS não padrão, nomes de host ou IPs resolvidos privados/internos/de uso especial e redirecionamentos fora da mesma política pública de segurança.
- `source=trusted-url` baixa um `.tgz` HTTPS de uma política de origem confiável nomeada em `.github/package-trusted-sources.json`; `package_sha256` e `trusted_source_id` são obrigatórios. Use isso somente para espelhos empresariais mantidos pelos responsáveis ou repositórios privados de pacotes que precisem de hosts, portas, prefixos de caminho, hosts de redirecionamento ou resolução em rede privada configurados. Se a política declarar autenticação por bearer, o fluxo de trabalho usará o segredo fixo `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; credenciais incorporadas à URL ainda serão rejeitadas.
- `source=artifact` baixa um `.tgz` de `artifact_run_id` e `artifact_name`; `package_sha256` é opcional, mas deve ser fornecido para artefatos compartilhados externamente.

Mantenha `workflow_ref` e `package_ref` separados. `workflow_ref` é o código confiável do fluxo de trabalho/harness que executa o teste. `package_ref` é o commit de origem que é empacotado quando `source=ref`. Isso permite que o harness de teste atual valide commits de origem confiáveis mais antigos sem executar a lógica antiga do fluxo de trabalho.

### Perfis de suíte

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `root-managed-vps-upgrade`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — o conjunto `package` com cobertura de `plugins` em ambiente real no lugar de `plugins-offline`, além de `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — fragmentos completos do caminho de versão no Docker com OpenWebUI
- `custom` — `docker_lanes` exatas; obrigatório quando `suite_profile=custom`

O perfil `package` usa cobertura de plugins offline para que a validação do pacote publicado não dependa da disponibilidade do ClawHub em tempo real. A etapa opcional do Telegram reutiliza o artefato `package-under-test` em `NPM Telegram Beta E2E`, mantendo o caminho da especificação npm publicada para execuções independentes.

Para consultar a política dedicada de testes de atualizações e plugins, incluindo comandos locais,
etapas do Docker, entradas de Aceitação de Pacote, padrões de lançamento e triagem de falhas,
consulte [Testes de atualizações e plugins](/pt-BR/help/testing-updates-plugins).

As verificações de lançamento chamam a Aceitação de Pacote com `source=artifact`, o artefato preparado do pacote de lançamento, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape'` e `telegram_mode=mock-openai`. Isso mantém a migração do pacote, a atualização, a instalação de Skills pelo ClawHub em tempo real, a limpeza de dependências obsoletas de plugins, o reparo da instalação de plugins configurados e as provas de plugin offline, atualização de plugin e Telegram no mesmo tarball de pacote resolvido. Defina `release_package_spec` na Validação Completa de Lançamento ou nas Verificações de Lançamento do OpenClaw após publicar uma versão beta para executar a mesma matriz no pacote npm distribuído sem recompilá-lo; defina `package_acceptance_package_spec` somente quando a Aceitação de Pacote precisar de um pacote diferente do restante da validação de lançamento. As verificações de lançamento entre sistemas operacionais continuam cobrindo integração inicial, instalador e comportamento específico da plataforma; a validação do produto relacionada a pacotes e atualizações deve começar pela Aceitação de Pacote.

A etapa do Docker `published-upgrade-survivor` valida uma referência de pacote publicado por execução no caminho de bloqueio do lançamento. Na Aceitação de Pacote, o tarball `package-under-test` resolvido é sempre o candidato, e `published_upgrade_survivor_baseline` seleciona a referência publicada de contingência, cujo padrão é `openclaw@latest`; os comandos para reexecutar etapas com falha preservam essa referência. A Validação Completa de Lançamento com `run_release_soak=true` ou `release_profile=full` define `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` e `published_upgrade_survivor_scenarios=reported-issues` para abranger as quatro versões npm estáveis mais recentes, além de versões fixadas nos limites de compatibilidade de plugins e fixtures baseadas em problemas para configuração do Feishu, arquivos preservados de bootstrap/persona, instalações configuradas de plugins do OpenClaw, caminhos de log com til e raízes obsoletas de dependências de plugins legados. As seleções de sobrevivência à atualização publicada com várias referências são fragmentadas por referência em trabalhos separados e direcionados do executor do Docker. O fluxo de trabalho separado `Update Migration` usa a etapa do Docker `update-migration` com referências `all-since-2026.4.23` e cenários `plugin-deps-cleanup` quando a questão é a limpeza completa de atualizações publicadas, e não a abrangência normal da CI de Validação Completa de Lançamento. Execuções agregadas locais podem fornecer especificações exatas de pacotes com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, manter uma única etapa com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, como `openclaw@2026.4.15`, ou definir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para a matriz de cenários. A etapa publicada configura a referência com uma receita incorporada de comandos `openclaw config set`, registra as etapas da receita em `summary.json` e verifica `/healthz`, `/readyz` e o status de RPC após a inicialização do Gateway. As etapas de instalação do zero do pacote e do instalador no Windows também verificam se um pacote instalado consegue importar uma substituição do controle do navegador usando um caminho absoluto bruto do Windows. O teste de fumaça de turno do agente OpenAI entre sistemas operacionais usa por padrão `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando definido; caso contrário, usa `openai/gpt-5.6-luna`, para que a prova de instalação e do Gateway utilize a camada de testes GPT-5.6 de menor custo.

### Janelas de compatibilidade legada

A Aceitação de Pacote tem janelas limitadas de compatibilidade legada para pacotes já publicados. Pacotes até `2026.4.25`, incluindo `2026.4.25-beta.*`, podem usar o caminho de compatibilidade:

- entradas privadas conhecidas de QA em `dist/postinstall-inventory.json` podem apontar para arquivos omitidos do tarball;
- `doctor-switch` pode ignorar o subcaso de persistência `gateway install --wrapper` quando o pacote não expõe essa opção;
- `update-channel-switch` pode remover `patchedDependencies` ausentes do pnpm da fixture falsa de git derivada do tarball e pode registrar a ausência de `update.channel` persistido;
- testes de fumaça de plugins podem ler locais legados de registros de instalação ou aceitar a ausência da persistência de registros de instalação do marketplace;
- `plugin-update` pode permitir a migração de metadados de configuração, ainda exigindo que o registro de instalação e o comportamento sem reinstalação permaneçam inalterados.

O pacote publicado `2026.4.26` também pode emitir um aviso para arquivos de carimbo de metadados de compilação local que já haviam sido distribuídos, e pacotes até `2026.5.20` podem emitir um aviso em vez de falhar quando `npm-shrinkwrap.json` estiver ausente. Pacotes posteriores devem cumprir os contratos modernos; as mesmas condições causam falha em vez de aviso ou omissão.

### Exemplos

```bash
# Valide o pacote beta atual com cobertura no nível do produto.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Valide o pacote extended-stable publicado com cobertura de pacote.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@extended-stable \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Empacote e valide uma ramificação de lançamento com o harness atual.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.PATCH \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Valide a URL de um tarball. O SHA-256 é obrigatório para source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Valide um tarball de uma política nomeada e confiável de espelho privado.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Reutilize um tarball enviado por outra execução do Actions.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

Ao depurar uma execução de aceitação de pacote com falha, comece pelo resumo `resolve_package` para confirmar a origem, a versão e o SHA-256 do pacote. Em seguida, inspecione a execução filha `docker_acceptance` e seus artefatos do Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logs das etapas, tempos das fases e comandos de reexecução. Prefira reexecutar o perfil de pacote com falha ou as etapas exatas do Docker em vez de reexecutar toda a validação completa de lançamento.

## Teste de fumaça da instalação

O fluxo de trabalho `Install Smoke` não é mais executado em pull requests nem em envios para `main`. Seu wrapper noturno/manual e a validação de lançamento chamam o núcleo somente leitura `install-smoke-reusable.yml`, e cada execução percorre todo o caminho do teste de fumaça da instalação em executores hospedados pelo GitHub:

- A imagem de teste de fumaça do Dockerfile raiz é compilada uma vez por SHA de destino, vinculada à revisão do fluxo de trabalho e à tentativa do produtor em um artefato imutável e, depois, carregada pelo teste de fumaça da CLI, pelo teste de fumaça da CLI de exclusão de agentes em espaço de trabalho compartilhado, pelo E2E de rede do Gateway em contêiner e pelo teste de fumaça do argumento de compilação do plugin `matrix` incluído. O teste de fumaça do plugin verifica o espelhamento da instalação das dependências de runtime e se o plugin é carregado sem diagnósticos de escape do ponto de entrada.
- A instalação do pacote QR e os testes de fumaça do Docker para instalador/atualização (incluindo etapas do instalador no Rocky Linux e uma etapa de atualização usando uma referência npm configurável em `update_baseline_version`) são executados como trabalhos separados para que o trabalho do instalador não espere pelos testes de fumaça da imagem raiz.

O teste de fumaça lento do provedor de imagens com instalação global do Bun é controlado separadamente por `run_bun_global_install_smoke`. Ele é executado na programação noturna, fica ativado por padrão para chamadas do fluxo de trabalho originadas das verificações de lançamento, e execuções manuais de `Install Smoke` podem optar por incluí-lo. A CI normal de PR ainda executa a etapa rápida de regressão do inicializador do Bun para alterações relevantes ao Node. Os testes do Docker para QR e instalador mantêm seus próprios Dockerfiles voltados à instalação.

## E2E local do Docker

`pnpm test:docker:all` pré-compila uma imagem compartilhada de testes em tempo real, empacota o OpenClaw uma vez como tarball npm e compila duas imagens compartilhadas de `scripts/e2e/Dockerfile`:

- um executor básico de Node/Git para etapas de instalador, atualização e dependências de plugins;
- uma imagem funcional que instala o mesmo tarball em `/app` para etapas de funcionalidade normal.

As definições das etapas do Docker ficam em `scripts/lib/docker-e2e-scenarios.mjs`, a lógica do planejador fica em `scripts/lib/docker-e2e-plan.mjs`, e o executor executa somente o plano selecionado. O agendador seleciona a imagem por etapa com `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` e, depois, executa as etapas com `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parâmetros ajustáveis

| Variável                               | Padrão       | Finalidade                                                                                                                         |
| -------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10           | Quantidade de slots do pool principal para etapas normais.                                                                         |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10           | Quantidade de slots do pool final sensível a provedores.                                                                            |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9            | Limite de etapas simultâneas em tempo real para que os provedores não restrinjam a taxa.                                            |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5            | Limite de etapas simultâneas de instalação do npm.                                                                                   |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7            | Limite de etapas simultâneas com vários serviços.                                                                                    |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000         | Intervalo entre os inícios das etapas para evitar picos de criação no daemon do Docker; defina `0` para não usar intervalo.          |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000      | Tempo limite de contingência por etapa (120 minutos); etapas selecionadas em tempo real/finais usam limites mais restritos.          |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | não definido | `1` exibe o plano do agendador sem executar as etapas.                                                                               |
| `OPENCLAW_DOCKER_ALL_LANES`            | não definido | Lista exata de etapas separadas por vírgulas; ignora o teste de fumaça de limpeza para que agentes possam reproduzir uma etapa falha. |

Uma etapa mais pesada que seu limite efetivo ainda pode começar a partir de um pool vazio e, então, é executada sozinha até liberar capacidade. O agregado local faz uma pré-verificação do Docker, remove contêineres E2E obsoletos do OpenClaw, emite o status das etapas ativas, persiste os tempos das etapas para ordenação da mais longa para a mais curta e, por padrão, deixa de agendar novas etapas agrupadas após a primeira falha.

### Fluxo de trabalho reutilizável em tempo real/E2E

O fluxo de trabalho reutilizável de validação ao vivo/E2E consulta `scripts/test-docker-all.mjs --plan-json` para determinar quais pacotes, tipos de imagem, imagens de validação ao vivo, lanes e coberturas de credenciais são necessários. Em seguida, `scripts/docker-e2e.mjs` converte esse plano em saídas e resumos do GitHub. Ele empacota o OpenClaw por meio de `scripts/package-openclaw-for-docker.mjs`, baixa um artefato de pacote da execução atual ou baixa um artefato de pacote de `package_artifact_run_id` e, depois, valida o inventário do tarball. O caminho padrão `no-push-artifact` cria imagens básicas/funcionais com tags baseadas no digest do pacote usando o cache de camadas do Docker do Blacksmith, empacota os bytes exatos da imagem em um artefato imutável do fluxo de trabalho e faz com que cada consumidor verifique e carregue esse artefato. Por sua vez, `existing-only` exige referências explícitas do GHCR em `docker_e2e_bare_image`/`docker_e2e_functional_image` e nunca cria nem envia imagens. Essas obtenções do registro usam um tempo limite de 180 segundos por tentativa, para que um fluxo travado seja repetido rapidamente, em vez de consumir a maior parte do caminho crítico da CI. Após uma validação agendada bem-sucedida, `openclaw-scheduled-live-checks.yml` transmite o manifesto imutável das imagens testadas ao publicador separado com permissão de gravação de pacotes; os chamadores somente leitura de versões finais e de pré-lançamento nunca passam por esse gravador.

### Blocos do caminho de lançamento

A cobertura do Docker para lançamentos executa tarefas menores em blocos com `OPENCLAW_SKIP_DOCKER_BUILD=1`, para que cada bloco verifique e carregue somente o tipo de imagem baseado em artefato de que precisa (ou o obtenha com a reutilização explícita `existing-only`) e execute várias lanes por meio do mesmo agendador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | openwebui`

Os blocos atuais do Docker para lançamentos são `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, de `plugins-runtime-install-a` a `plugins-runtime-install-h` e `openwebui`. `package-update-openai` inclui a lane de pacote ao vivo do Plugin Codex, que instala o pacote candidato do OpenClaw, instala o Plugin Codex de `codex_plugin_spec` ou de um tarball da mesma referência com aprovação explícita para instalação da CLI do Codex, executa a verificação preliminar da CLI do Codex e, depois, executa várias interações do agente do OpenClaw na mesma sessão com a OpenAI. `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` continuam sendo aliases agregados de plugins/runtime. O alias da lane `install-e2e` continua sendo o alias agregado para repetição manual das duas lanes de instalação de provedores.

O OpenWebUI é executado como um bloco `openwebui` independente em um executor Blacksmith dedicado com disco grande sempre que a cobertura estável ou completa do caminho de lançamento o solicita, mesmo quando o fluxo de trabalho reutilizável direciona tarefas compatíveis a executores hospedados pelo GitHub. Manter separada a obtenção da imagem externa evita que a imagem grande concorra com as imagens compartilhadas de pacotes e plugins em `plugins-runtime-services`; os blocos agregados legados de plugins/runtime ainda incluem o OpenWebUI para repetições manuais compatíveis. As lanes de atualização de canais incluídos no pacote repetem uma vez em caso de falhas transitórias de rede do npm.

Cada bloco envia `.artifacts/docker-tests/` com logs das lanes, tempos, `summary.json`, `failures.json`, tempos das fases, JSON do plano do agendador, tabelas de lanes lentas e comandos de repetição por lane. A entrada `docker_lanes` do fluxo de trabalho executa as lanes selecionadas usando imagens preparadas para essa execução, em vez das tarefas de blocos, o que limita a depuração de lanes com falha a uma única tarefa direcionada do Docker; se uma lane selecionada for uma lane ao vivo do Docker, a tarefa direcionada cria localmente a imagem de teste ao vivo para essa repetição. O auxiliar de repetição valida o SHA de destino selecionado exato do artefato de falha, e o disparo manual reempacota essa referência, pois a tupla interna de pacote do fluxo de trabalho reutilizável não faz parte do esquema de `workflow_dispatch`. Os comandos gerados incluem entradas das imagens preparadas e `shared_image_policy=existing-only` somente quando essas entradas são baseadas no GHCR; as tags de artefato locais do executor são omitidas para que um executor novo as recrie. Uma substituição explícita do destino descarta as referências recuperadas de imagens do GHCR, a menos que o artefato comprove que elas correspondem à substituição. As referências da definição do fluxo de trabalho geradas por artefatos também são omitidas porque os branches temporários da validação completa de lançamento são excluídos; o disparo usa o branch padrão do repositório, a menos que o operador o substitua explicitamente.

```bash
pnpm test:docker:rerun <run-id>      # baixa os artefatos do Docker e exibe comandos combinados/direcionados por lane para repetição
pnpm test:docker:timings <summary>   # resumos das lanes lentas e do caminho crítico das fases
```

O fluxo de trabalho agendado de validação ao vivo/E2E executa diariamente a suíte completa do Docker para o caminho de lançamento e, após sua conclusão bem-sucedida, invoca o publicador explícito para os artefatos exatos das imagens testadas.

## Pré-lançamento de plugins

`Plugin Prerelease` oferece uma cobertura de produto/pacote mais cara; por isso, é um fluxo de trabalho separado, disparado por `Full Release Validation` ou explicitamente por um operador. Pull requests normais, envios para `main` e disparos manuais independentes da CI mantêm essa suíte desativada. Ele distribui os testes dos plugins incluídos no pacote entre oito workers de extensões; essas tarefas de shards de extensões executam até dois grupos de configuração de plugins simultaneamente, com um worker do Vitest por grupo e um heap maior do Node, para que lotes de plugins com muitas importações não criem tarefas extras de CI. O caminho de pré-lançamento do Docker exclusivo de lançamentos (ativado pela entrada `full_release_validation`) agrupa as lanes direcionadas do Docker em grupos de quatro, para evitar reservar dezenas de executores para tarefas de um a três minutos. O fluxo de trabalho também envia um artefato informativo `plugin-inspector-advisory` de `@openclaw/plugin-inspector`; as constatações do inspetor são dados de entrada para triagem e não alteram o bloqueio imposto pelo gate Plugin Prerelease.

## Laboratório de QA

O Laboratório de QA possui lanes dedicadas de CI fora do fluxo de trabalho principal com escopo inteligente. A paridade agêntica está incluída nos harnesses amplos de QA e lançamento, não em um fluxo de trabalho independente para pull requests. Use `Full Release Validation` com `rerun_group=qa-parity` quando a paridade precisar acompanhar uma execução ampla de validação.

- O fluxo de trabalho `QA-Lab - All Lanes` é executado todas as noites em `main` e por disparo manual; ele distribui a lane de paridade simulada, a lane ao vivo do Matrix e as lanes ao vivo do Telegram e Discord como tarefas paralelas. As tarefas ao vivo usam o ambiente `qa-live-shared`, e Telegram/Discord usam concessões do Convex.

As verificações de lançamento executam as lanes de transporte ao vivo do Matrix e Telegram com o provedor simulado determinístico e modelos qualificados como simulados (`mock-openai/gpt-5.6-luna` e `mock-openai/gpt-5.6-luna-alt`), para que o contrato do canal seja isolado da latência do modelo ao vivo e da inicialização normal do Plugin do provedor. O gateway de transporte ao vivo desativa a busca de memória porque a paridade de QA cobre separadamente o comportamento da memória; a conectividade do provedor é coberta pelas suítes separadas de modelos ao vivo, provedores nativos e provedores do Docker.

O Matrix usa `--profile fast` para gates agendados e de lançamento, adicionando `--fail-fast` somente quando a CLI obtida oferece suporte a ele. O padrão da CLI e a entrada manual do fluxo de trabalho continuam sendo `all`; um disparo manual com `matrix_profile=all` sempre divide a cobertura completa do Matrix nas tarefas `transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`.

`OpenClaw Release Checks` também executa as lanes essenciais para o lançamento do Laboratório de QA antes da aprovação do lançamento; seu gate de paridade de QA executa os pacotes candidato e de referência como tarefas paralelas de lanes e, depois, baixa os dois artefatos em uma pequena tarefa de relatório para a comparação final de paridade.

Para pull requests normais, siga as evidências de CI/verificações com escopo definido, em vez de tratar a paridade como um status obrigatório.

## CodeQL

O fluxo de trabalho `CodeQL` é intencionalmente um scanner de segurança restrito para a primeira análise, não uma varredura completa do repositório. As execuções diárias, manuais, por envio para `main` e de proteção de pull requests que não sejam rascunhos verificam o código dos fluxos de trabalho do Actions e as superfícies JavaScript/TypeScript de maior risco, usando consultas de segurança de alta confiança filtradas para `security-severity` alta/crítica.

A proteção de pull requests permanece leve: ela só é iniciada para alterações em `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src` ou caminhos de runtime dos plugins incluídos no pacote que controlam processos, e executa a mesma matriz de segurança de alta confiança do fluxo de trabalho agendado. O CodeQL para Android e macOS permanece fora dos padrões para pull requests.

### Categorias de segurança

| Categoria                                          | Superfície                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Referência básica de autenticação, segredos, sandbox, cron e gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementação dos canais principais, além do runtime do Plugin de canal, gateway, Plugin SDK, segredos e pontos de contato de auditoria              |
| `/codeql-security-high/network-ssrf-boundary`     | Superfícies principais de política de SSRF, análise de IP, proteção de rede, busca na Web e SSRF do Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, auxiliares de execução de processos, entrega de saída e gates de execução de ferramentas do agente                                           |
| `/codeql-security-high/process-exec-boundary`     | Shell local, auxiliares de criação de processos, runtimes de plugins incluídos no pacote que controlam subprocessos e código de integração dos scripts de fluxo de trabalho                             |
| `/codeql-security-high/plugin-trust-boundary`     | Superfícies de confiança da instalação, carregador, manifesto, registro, instalação pelo gerenciador de pacotes, carregamento de código-fonte e contrato de pacote do Plugin SDK |

### Shards de segurança específicos por plataforma

- `CodeQL Android Critical Security` — shard agendado de segurança para Android. Compila manualmente o aplicativo Android para o CodeQL no menor executor Linux do Blacksmith aceito pela verificação de integridade do fluxo de trabalho. Envia os resultados em `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard semanal/manual de segurança para macOS. Compila manualmente o aplicativo para macOS para o CodeQL no Blacksmith macOS, filtra dos resultados SARIF enviados os resultados da compilação de dependências e envia os resultados em `/codeql-critical-security/macos`. Mantido fora dos padrões diários porque a compilação para macOS domina o tempo de execução mesmo quando não encontra problemas.

### Categorias críticas de qualidade

`CodeQL Critical Quality` é o shard correspondente não relacionado à segurança. Ele executa somente consultas de qualidade JavaScript/TypeScript não relacionadas à segurança e com severidade de erro em superfícies restritas de alto valor, usando executores Linux hospedados pelo GitHub, para que as verificações de qualidade não consumam o orçamento de registro de executores do Blacksmith. Sua proteção de pull requests é intencionalmente menor do que o perfil agendado: pull requests que não sejam rascunhos executam somente os shards correspondentes às superfícies alteradas, dentre treze shards que podem ser roteados para pull requests — `agent-runtime-boundary`, `channel-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `gateway-runtime-boundary`, `mcp-process-runtime-boundary`, `memory-runtime-boundary`, `network-runtime-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, `plugin-sdk-reply-runtime`, `provider-runtime-boundary` e `session-diagnostics-boundary`. `ui-control-plane` e `web-media-runtime-boundary` permanecem fora das execuções de pull requests. Alterações na configuração do CodeQL e no fluxo de trabalho de qualidade executam o conjunto completo de shards para pull requests (o shard de runtime de rede é ativado por seus próprios arquivos de configuração do CodeQL e caminhos de código-fonte que controlam a rede).

O disparo manual aceita:

```text
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|network-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Os perfis restritos são recursos para aprendizado/iteração que permitem executar um shard de qualidade isoladamente.

| Categoria                                               | Superfície                                                                                                                                                                                     |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Código de autenticação, segredos, sandbox, cron e limites de segurança do Gateway                                                                                                              |
| `/codeql-critical-quality/config-boundary`              | Contratos de esquema de configuração, migração, normalização e E/S                                                                                                                             |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Esquemas do protocolo do Gateway e contratos de métodos do servidor                                                                                                                            |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementação dos canais principais e dos plugins de canal incluídos                                                                                                              |
| `/codeql-critical-quality/agent-runtime-boundary`       | Contratos de execução de comandos, encaminhamento de modelos/provedores, encaminhamento e filas de respostas automáticas e runtime do plano de controle ACP                                    |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP e pontes de ferramentas, auxiliares de supervisão de processos e contratos de entrega de saída                                                                                  |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK do host de memória, fachadas do runtime de memória, aliases do Plugin SDK de memória, código de integração para ativação do runtime de memória e comandos de diagnóstico de memória         |
| `/codeql-critical-quality/network-runtime-boundary`     | Pacote de políticas de rede, runtime de soquete bruto e captura de proxy, túnel SSH, bloqueio do Gateway, soquete JSONL e superfícies de transporte por push                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Componentes internos da fila de respostas, filas de entrega de sessão, auxiliares de vinculação/entrega de sessões de saída, superfícies de pacotes de eventos/logs de diagnóstico e contratos da CLI de diagnóstico de sessão |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Encaminhamento de respostas de entrada do Plugin SDK, auxiliares de payload/fracionamento/runtime de respostas, opções de resposta de canal, filas de entrega e auxiliares de vinculação de sessão/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalização do catálogo de modelos, autenticação e descoberta de provedores, registro do runtime de provedores, padrões/catálogos de provedores e registros de web/pesquisa/busca/embedding   |
| `/codeql-critical-quality/ui-control-plane`             | Inicialização da interface de controle, persistência local, fluxos de controle do Gateway e contratos do runtime do plano de controle de tarefas                                               |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratos de busca/pesquisa web do núcleo, E/S de mídia, compreensão de mídia, geração de imagens e runtime de geração de mídia                                                                |
| `/codeql-critical-quality/plugin-boundary`              | Contratos do carregador, registro, superfície pública e pontos de entrada do Plugin SDK                                                                                                        |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Código-fonte publicado do Plugin SDK no pacote e auxiliares de contratos de pacotes de plugins                                                                                                 |

A qualidade permanece separada da segurança para que as constatações de qualidade possam ser agendadas, medidas, desativadas ou expandidas sem obscurecer os sinais de segurança. A expansão do CodeQL para Swift, Python e plugins incluídos deve ser adicionada novamente como trabalho de acompanhamento com escopo definido ou dividido em shards somente depois que os perfis restritos tiverem runtime e sinais estáveis.

## Fluxos de trabalho de manutenção

### Agente de documentação

O fluxo de trabalho `Docs Agent` é uma linha de manutenção do Codex orientada a eventos para manter a documentação existente alinhada às alterações incorporadas recentemente. Ele não tem um agendamento independente: uma execução de CI bem-sucedida de um push não realizado por bot em `main` pode acioná-lo, e um acionamento manual pode executá-lo diretamente. As invocações por execução de fluxo de trabalho são ignoradas quando `main` já avançou ou quando outra execução não ignorada do Docs Agent foi criada na última hora. Quando executado, ele analisa o intervalo de commits desde o SHA de origem da execução anterior não ignorada do Docs Agent até a `main` atual, de modo que uma execução por hora pode abranger todas as alterações da main acumuladas desde a última revisão da documentação.

### Agente de desempenho de testes

O fluxo de trabalho `Test Performance Agent` é uma linha de manutenção do Codex orientada a eventos para testes lentos. Ele não tem um agendamento independente: uma execução de CI bem-sucedida de um push não realizado por bot em `main` pode acioná-lo, mas ele é ignorado se outra invocação por execução de fluxo de trabalho já tiver sido executada ou estiver em execução naquele dia UTC. O acionamento manual ignora essa restrição de atividade diária. A linha gera um relatório de desempenho agrupado do Vitest para a suíte completa, permite que o Codex faça somente pequenas correções de desempenho nos testes que preservem a cobertura, em vez de refatorações amplas, depois executa novamente o relatório da suíte completa e rejeita alterações que reduzam a contagem de referência de testes aprovados. O relatório agrupado registra o tempo decorrido por configuração e o RSS máximo no Linux e no macOS, de modo que a comparação entre antes e depois apresente as diferenças de memória dos testes junto às diferenças de duração. Se a referência tiver testes com falha, o Codex poderá corrigir apenas falhas óbvias, e o relatório da suíte completa após a execução do agente deverá ser aprovado antes que qualquer conteúdo seja registrado em commit. Quando `main` avança antes que o push do bot seja incorporado, a linha faz rebase do patch validado, executa novamente `pnpm check:changed` e tenta o push outra vez; patches obsoletos com conflitos são ignorados. Ela usa o Ubuntu hospedado pelo GitHub para que a ação do Codex possa manter a mesma postura de segurança de remoção do sudo usada pelo agente de documentação.

### PRs duplicados após a mesclagem

O fluxo de trabalho `Duplicate PRs After Merge` é um fluxo manual para mantenedores destinado à limpeza de duplicatas após a incorporação. Por padrão, ele executa uma simulação e só fecha os PRs listados explicitamente quando `apply=true`. Antes de modificar o GitHub, ele verifica se o PR incorporado foi mesclado e se cada duplicata tem uma issue referenciada em comum ou trechos alterados sobrepostos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Barreiras de verificação local e roteamento de alterações

A lógica local das linhas de alterações fica em `scripts/changed-lanes.mjs` e é executada por `scripts/check-changed.mjs`. Essa barreira de verificação local é mais rigorosa quanto aos limites de arquitetura do que o amplo escopo de plataforma da CI:

- alterações de produção no núcleo executam a verificação de tipos de produção e de testes do núcleo, além do lint/das proteções do núcleo;
- alterações somente de testes no núcleo executam apenas a verificação de tipos de testes do núcleo, além do lint do núcleo;
- alterações de produção em extensões executam a verificação de tipos de produção e de testes da extensão, além do lint da extensão;
- alterações somente de testes em extensões executam a verificação de tipos de testes da extensão, além do lint da extensão;
- alterações no SDK público de Plugin ou no contrato de plugins ampliam a execução para incluir a verificação de tipos das extensões, pois elas dependem desses contratos do núcleo (as varreduras de extensões com Vitest continuam sendo trabalho de teste explícito);
- incrementos de versão somente nos metadados da versão executam verificações direcionadas de versão/configuração/dependências da raiz;
- alterações desconhecidas na raiz/configuração falham de modo seguro, executando todas as trilhas de verificação.

O roteamento local dos testes alterados fica em `scripts/test-projects.test-support.mjs` e é intencionalmente mais econômico que `check:changed`: edições diretas em testes executam os próprios testes; edições no código-fonte priorizam mapeamentos explícitos e, depois, testes irmãos e dependentes no grafo de importações. A configuração compartilhada de entrega em salas de grupo é um dos mapeamentos explícitos: alterações na configuração de respostas visíveis do grupo, no modo de entrega de respostas da origem ou no prompt de sistema da ferramenta de mensagens são encaminhadas pelos testes de resposta do núcleo, além das regressões de entrega do Discord e do Slack, para que uma alteração em um padrão compartilhado falhe antes do primeiro envio do PR. Use `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` somente quando a alteração afetar o harness de forma tão ampla que o conjunto mapeado econômico não seja uma aproximação confiável.

## Validação com Testbox

Crabbox é o wrapper de caixas remotas mantido pelo repositório para comprovação em Linux pelos mantenedores. As sessões de agentes o utilizam por padrão para testes e trabalhos computacionalmente intensivos, incluindo builds, verificações de tipos, execução distribuída de lint, Docker, trilhas de pacotes, E2E, comprovação ao vivo e paridade com a CI. Código confiável de mantenedores usa `blacksmith-testbox` por padrão, e `.crabbox.yaml` agora também o usa como padrão. O workflow configurado fornece credenciais de provedores e agentes, portanto código não confiável de contribuidores ou forks deve usar CI de fork sem segredos ou Crabbox direto na AWS devidamente sanitizado. Execuções sanitizadas na AWS definem `CRABBOX_ENV_ALLOW=CI`, passam `--no-hydrate` e usam um `HOME` remoto temporário novo; isso impede que a lista de permissões `OPENCLAW_*` do repositório e perfis de autenticação existentes cheguem ao código não confiável. Elas usam uma concessão recém-aquecida dedicada a essa origem não confiável, nunca uma concessão confiável ou previamente provisionada. Inicie um binário confiável e instalado do Crabbox a partir de um checkout limpo e confiável de `main` e busque somente o PR remoto com `--fresh-pr`; nunca execute localmente o wrapper ou a configuração do checkout não confiável. Remova a definição de `CRABBOX_AWS_INSTANCE_PROFILE` e falhe de modo seguro, a menos que o valor resolvido de `aws.instanceProfile` esteja vazio. Antes de qualquer instalação/teste, use ferramentas confiáveis por caminho absoluto para exigir um token IMDSv2, comprovar que o endpoint de credenciais do IAM retorna 404 e comparar o `git rev-parse HEAD` remoto com o SHA completo do head do PR revisado. Vincule a concessão a esse SHA e interrompa/reaqueça quando o head mudar. Envie o `scripts/crabbox-untrusted-bootstrap.sh` confiável a partir de um `main` limpo junto com `--fresh-pr`; ele instala as versões fixadas do Node/pnpm, verifica o SHA e a versão fixada do gerenciador de pacotes, isola o `HOME`, instala as dependências e, em seguida, executa o teste solicitado.
Remova todas as definições alternativas de `CRABBOX_TAILSCALE*`, force `--network public
--tailscale=false`, limpe os sinalizadores de nó de saída/LAN e exija que `crabbox inspect` informe uma rede pública sem estado do Tailscale antes de enviar qualquer script. A capacidade própria na AWS/Hetzner também continua sendo a alternativa para indisponibilidades do Blacksmith, problemas de cota ou testes explicitamente realizados em capacidade própria.

No início de uma tarefa de código confiável que provavelmente exigirá testes ou comprovação pesada, os agentes devem iniciar o aquecimento imediatamente em uma sessão de comando em segundo plano, continuar a inspeção e a edição enquanto o provisionamento é executado, reutilizar o id `tbx_...` retornado, sincronizar o checkout atual em cada execução e interrompê-lo antes da entrega:

```bash
node scripts/crabbox-wrapper.mjs warmup --provider blacksmith-testbox --keep --timing-json
```

As execuções do Blacksmith com suporte do Crabbox aquecem, reivindicam, sincronizam, executam, geram relatórios e limpam Testboxes de uso único. A verificação de integridade de sincronização integrada falha rapidamente quando `git status --short` na caixa sincronizada mostra pelo menos 200 exclusões de arquivos rastreados, o que detecta o desaparecimento de arquivos da raiz, como `pnpm-lock.yaml`. Para PRs com grandes exclusões intencionais, defina `CRABBOX_ALLOW_MASS_DELETIONS=1` no comando remoto.

O Crabbox também encerra uma invocação local da CLI do Blacksmith que permanece na fase de sincronização por mais de cinco minutos sem saída posterior à sincronização. Defina `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` para desabilitar essa proteção ou use um valor maior em milissegundos para diffs locais excepcionalmente grandes.

Antes da primeira execução, verifique o wrapper a partir da raiz do repositório:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

O wrapper do repositório recusa um binário desatualizado do Crabbox que não anuncie o provedor selecionado, e as execuções com suporte do Blacksmith exigem Crabbox 0.22.0 ou mais recente para que o wrapper obtenha o comportamento atual de sincronização, fila e limpeza do Testbox. Em worktrees do Codex ou checkouts vinculados/esparsos, evite o script local `pnpm crabbox:run`, pois o pnpm pode reconciliar dependências antes que o Crabbox seja iniciado; em vez disso, invoque diretamente o wrapper do Node:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Ao usar o checkout irmão, recompile o binário local ignorado antes de trabalhos de medição de tempo ou comprovação:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

O bloco `blacksmith:` em `.crabbox.yaml` já fixa os padrões de organização, workflow, job e ref, portanto os sinalizadores explícitos abaixo são opcionais. Verificação de alterações:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm check:changed"
```

Nova execução de teste específico:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test <path-or-filter>"
```

Suíte completa:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test"
```

Leia o resumo JSON final. Os campos úteis são `provider`, `leaseId`,
`syncDelegated`, `exitCode`, `commandMs` e `totalMs`. Para execuções delegadas
do Blacksmith Testbox, o código de saída do wrapper do Crabbox e o resumo JSON são
o resultado do comando. A execução vinculada do GitHub Actions é responsável pela hidratação e pelo keepalive;
ela pode terminar como `cancelled` quando o Testbox é interrompido externamente após o comando
SSH já ter retornado. Trate isso como um artefato de limpeza/status, a menos que
o `exitCode` do wrapper seja diferente de zero ou a saída do comando mostre um teste com falha.
Execuções únicas do Crabbox com suporte do Blacksmith devem interromper o Testbox automaticamente;
se uma execução for interrompida ou a limpeza não estiver clara, inspecione os ambientes ativos e interrompa apenas
os ambientes que você criou:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Use a reutilização somente quando precisar intencionalmente executar vários comandos no mesmo ambiente hidratado:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --id <tbx_id> --timing-json --shell -- "corepack pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Reutilize a concessão, não código-fonte obsoleto. Omita `--no-sync` para que cada execução envie o
checkout atual; use-o somente para executar novamente, de forma intencional, uma árvore inalterada e já sincronizada.
Código não confiável de contribuidor/fork deve usar
`CRABBOX_ENV_ALLOW=CI`, `--provider aws --no-hydrate` e um `HOME`
remoto temporário novo para cada comando; instale as dependências dentro desse
comando sanitizado antes dos testes. Reutilize somente uma concessão recém-preparada dedicada ao
mesmo código-fonte não confiável; nunca uma concessão confiável ou previamente hidratada. Nunca
execute localmente o wrapper ou a configuração do checkout não confiável: inicie o binário
confiável instalado do Crabbox a partir de uma `main` confiável e limpa e passe `--fresh-pr` em cada
execução. Mantenha `CRABBOX_AWS_INSTANCE_PROFILE` não definido, rejeite um perfil
de instância resolvido que não esteja vazio, exija uma prova confiável no IMDS remoto de que não há função e verifique o
SHA do head revisado antes da instalação/dos testes. Vincule a concessão a esse SHA; interrompa e
prepare novamente após qualquer alteração no head. Se não houver PR remoto, use a CI do fork sem segredos.
Nunca selecione `hydrate-github` nem o workflow do Blacksmith hidratado com credenciais
para código-fonte não confiável.

Se o Crabbox for a camada com problema, mas o próprio Blacksmith funcionar, use diretamente o
Blacksmith apenas para diagnósticos, como `list`, `status` e limpeza. Corrija o
caminho do Crabbox antes de tratar uma execução direta do Blacksmith como prova de mantenedor.

Se `blacksmith testbox list --all` e `blacksmith testbox status` funcionarem, mas novos
aquecimentos permanecerem em `queued` sem IP ou URL de execução do Actions após alguns minutos,
trate isso como pressão do provedor, da fila, do faturamento ou do limite da organização do Blacksmith. Interrompa os
ids em fila que você criou, evite iniciar mais Testboxes e mova a prova para o
caminho de capacidade própria do Crabbox abaixo enquanto alguém verifica o painel do Blacksmith,
o faturamento e os limites da organização.

Escale para a capacidade própria do Crabbox somente quando o Blacksmith estiver indisponível, limitado por cota, sem o ambiente necessário ou quando a capacidade própria for explicitamente o objetivo:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --provider aws --id <cbx_id-or-slug>
pnpm crabbox:run -- --provider aws --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- --provider aws <cbx_id-or-slug>
```

Sob pressão da AWS, evite `class=beast`, a menos que a tarefa realmente precise de CPU da classe 48xlarge. Uma solicitação `beast` começa com 192 vCPUs e é a maneira mais fácil de atingir a cota regional Standard do EC2 Spot ou On-Demand. O `.crabbox.yaml` pertencente ao repositório usa por padrão `class: standard`, mercado on-demand e `capacity.hints: true`, para que as concessões intermediadas da AWS exibam a região/o mercado selecionados, a pressão de cota, o fallback para Spot e avisos de classe sob alta pressão. Use `fast` para verificações amplas mais pesadas, `large` somente quando standard/fast não forem suficientes e `beast` somente para lanes excepcionais limitadas por CPU, como a suíte completa ou matrizes Docker de todos os plugins, validação explícita de release/bloqueio ou criação de perfis de desempenho com grande número de núcleos. Não use `beast` para `pnpm check:changed`, testes específicos, trabalho somente de documentação, lint/verificação de tipos comum, pequenas reproduções E2E ou triagem de indisponibilidade do Blacksmith. Use `--market on-demand` para diagnóstico de capacidade, para que a oscilação do mercado Spot não seja misturada ao sinal.

O `.crabbox.yaml` controla os padrões de provedor, sincronização e hidratação do GitHub Actions. A sincronização do Crabbox nunca transfere `.git`, portanto o checkout hidratado do Actions mantém seus próprios metadados Git remotos, em vez de sincronizar remotos e armazenamentos de objetos locais do mantenedor, e a configuração do repositório também exclui artefatos locais de runtime/build (como `.artifacts` e relatórios de testes) que nunca devem ser transferidos. `.github/workflows/crabbox-hydrate.yml` controla o checkout, a configuração de Node/pnpm, o fetch de `origin/main` e o repasse de ambiente sem segredos para comandos `crabbox run --id <cbx_id>` na nuvem própria.

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Canais de desenvolvimento](/pt-BR/install/development-channels)
