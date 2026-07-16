---
read_when:
    - Executando ou corrigindo testes
summary: Como executar testes localmente (vitest) e quando usar os modos de força/cobertura
title: Testes
x-i18n:
    generated_at: "2026-07-16T12:59:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 391185703e853bb523e1396eb22da4693d10d47b1644d3b2a51707d329f67dae
    source_path: reference/test.md
    workflow: 16
---

- Kit completo de testes (suítes, testes ao vivo, Docker): [Testes](/pt-BR/help/testing)
- Validação de atualizações e pacotes de plugins: [Testes de atualizações e plugins](/pt-BR/help/testing-updates-plugins)

## Padrão do agente

As sessões do agente executam um ou alguns testes focados e verificações estáticas de baixo custo localmente somente
para fontes confiáveis e quando a instalação de dependências existente está pronta. Nunca
execute localmente ferramentas de repositórios não confiáveis. Suítes maiores, gates de alterações com
distribuição de verificação de tipos/lint, builds, Docker, lanes de pacotes, E2E, comprovação
ao vivo e validação multiplataforma são executados remotamente pelo Crabbox. Comprovações pesadas
de mantenedores confiáveis usam o Blacksmith Testbox por padrão. O fluxo de trabalho configurado do Testbox
carrega credenciais, portanto código de colaboradores não confiáveis ou de forks deve usar
CI de fork sem segredos ou, em vez disso, um Crabbox direto e sanitizado na AWS.

Não faça pré-aquecimento para trabalhos previstos. Adquira o backend sob demanda quando o
primeiro comando pesado estiver pronto, reutilize o id `tbx_...` retornado nos comandos pesados
posteriores, sincronize o checkout atual em cada execução e interrompa-o antes da entrega.

Após a primeira reutilização bem-sucedida, o wrapper registra a base, as dependências
e a impressão digital do fluxo de trabalho do Testbox da concessão em `.crabbox/testbox-leases/`.
Edições apenas no código-fonte continuam reutilizando a máquina aquecida. Uma alteração na base de mesclagem, no lockfile,
na entrada do gerenciador de pacotes, no wrapper ou no fluxo de trabalho do Testbox falha de forma segura e exige uma
nova concessão. Cada execução ainda sincroniza o checkout atual.
`OPENCLAW_TESTBOX_ALLOW_STALE=1` destina-se somente a diagnósticos intencionais, não à
comprovação de versões.

Os comandos de teste local abaixo destinam-se a fluxos de trabalho humanos e comprovações limitadas de agentes.
A indisponibilidade do provedor remoto deve ser informada; ela não concede permissão para
executar silenciosamente um gate local abrangente.

Para comprovações pesadas não confiáveis, aqueça sob demanda com `--provider aws`. Cada execução deve definir
`CRABBOX_ENV_ALLOW=CI`, passar `--provider aws --no-hydrate` e usar
um `HOME` remoto temporário novo antes de instalar dependências ou executar
testes. Use uma concessão recém-aquecida dedicada a essa fonte não confiável; nunca reutilize
uma concessão confiável ou previamente carregada com credenciais. Inicie um binário Crabbox confiável instalado
a partir de um checkout `main` limpo e confiável e busque somente o PR remoto com
`--fresh-pr`; nunca execute localmente o wrapper ou a configuração do checkout não confiável.
Remova a definição de `CRABBOX_AWS_INSTANCE_PROFILE` e falhe de forma segura, a menos que o
`aws.instanceProfile` resolvido esteja vazio. Antes de qualquer instalação/teste, use ferramentas
confiáveis com caminho absoluto para exigir um token IMDSv2, comprovar que o endpoint de credenciais
IAM retorna 404 e verificar se o `git rev-parse HEAD` remoto é igual ao SHA completo
do head do PR revisado. Vincule a concessão a esse SHA e interrompa/reaqueça quando o head
mudar. Envie o `scripts/crabbox-untrusted-bootstrap.sh` confiável a partir do
`main` limpo junto com `--fresh-pr`; ele instala versões fixadas do Node/pnpm, verifica o SHA
e a versão fixada do gerenciador de pacotes, isola `HOME`, instala dependências e então executa
o teste solicitado. Se o broker não puder comprovar a ausência de uma função ou se não existir um PR remoto,
use CI de fork sem segredos. Não use `hydrate-github`, `--no-sync` nem um
fluxo de trabalho do Testbox carregado com credenciais.
Remova todas as substituições de `CRABBOX_TAILSCALE*`, force `--network public
--tailscale=false`, limpe os sinalizadores de nó de saída/LAN e exija que `crabbox inspect`
informe rede pública sem estado do Tailscale antes de enviar qualquer script.

## Ordem local de rotina

1. `pnpm test:changed` para comprovação do Vitest no escopo alterado.
2. `pnpm test <path-or-filter>` para um arquivo, diretório ou destino explícito.
3. `pnpm test` somente quando for necessário intencionalmente executar a suíte local completa do Vitest.

Em uma árvore de trabalho do Codex ou em um checkout vinculado/esparso, os agentes evitam executar diretamente e localmente
`pnpm test*` / `pnpm check*` / `pnpm crabbox:run`:

- Comprovação focada e limitada com dependências prontas:
  `node scripts/run-vitest.mjs <path-or-filter>`.
- Verificação de alterações com classificação primeiro: `node scripts/check-changed.mjs`; planos somente de documentação,
  sem alterações e de metadados pequenos permanecem locais quando as dependências estão prontas,
  enquanto planos pesados ou com dependências ausentes são delegados ao Testbox.
- Comprovação abrangente explícita com concessão mantida: `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed`, para que o pnpm seja executado dentro do Testbox.
- O `exitCode` final do wrapper e o JSON de temporização são o resultado do comando. Uma execução delegada do Blacksmith GitHub Actions pode exibir `cancelled` após um comando SSH bem-sucedido porque o Testbox é interrompido fora da ação de keepalive; verifique o resumo do wrapper e a saída do comando antes de considerar isso uma falha.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: mantém a serialização de verificações pesadas dentro da árvore de trabalho atual, em vez do diretório comum do Git, para comandos como `pnpm check:changed` e `pnpm test ...` direcionado. Use-o somente em hosts locais de alta capacidade quando executar intencionalmente verificações independentes em árvores de trabalho vinculadas.

## Comandos principais

As execuções do wrapper de testes terminam com um breve resumo `[test] passed|failed|skipped ... in ...`; a linha de duração do próprio Vitest permanece como o detalhe por shard.

| Comando                                           | O que faz                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                       | Destinos explícitos de arquivo/diretório são encaminhados por lanes do Vitest com escopo definido. Execuções sem destino são comprovações da suíte completa: grupos fixos de shards se expandem em configurações folha para execução paralela local, e a distribuição esperada de shards é exibida antes do início. O grupo de extensões sempre se expande em configurações de shard por extensão, em vez de um único processo gigante do projeto raiz.           |
| `pnpm test:changed`                               | Execução inteligente e econômica de testes alterados: destinos precisos provenientes de edições diretas em testes, arquivos `*.test.ts` irmãos, mapeamentos explícitos de código-fonte e o grafo local de importações. Alterações abrangentes/de configuração/de pacote são ignoradas, a menos que sejam mapeadas para testes precisos.                                                                                                                               |
| `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` | Execução abrangente explícita de testes alterados; use quando uma edição no harness/configuração/pacote de testes precisar recorrer ao comportamento mais abrangente de testes alterados do Vitest.                                                                                                                                                                                                                        |
| `pnpm test:force`                                 | Libera a porta configurada do Gateway do OpenClaw (padrão `18789`) e então executa a suíte completa com uma porta isolada do Gateway, para que os testes de servidor não entrem em conflito com uma instância em execução.                                                                                                                                                                                    |
| `pnpm test:coverage`                              | Gera um relatório informativo de cobertura V8 para a lane de unidade padrão (`vitest.unit.config.ts`); nenhum limite de cobertura é imposto.                                                                                                                                                                                                                             |
| `pnpm test:coverage:changed`                      | Cobertura de unidade somente para arquivos alterados desde `origin/main`.                                                                                                                                                                                                                                                                                                       |
| `pnpm changed:lanes`                              | Mostra as lanes arquiteturais acionadas pelo diff em relação a `origin/main`.                                                                                                                                                                                                                                                                                      |
| `pnpm check:changed`                              | Classifica as lanes alteradas antes de escolher a execução. Planos somente de documentação, sem alterações e de metadados pequenos permanecem locais quando as dependências estão prontas; planos com distribuição de verificação de tipos/lint, outras lanes pesadas ou dependências locais ausentes são delegados ao Crabbox/Testbox fora da CI. Não executa o Vitest; use `pnpm test:changed` ou `pnpm test <target>` para comprovação de testes. |

## Estado de teste compartilhado e auxiliares de processo

- `src/test-utils/openclaw-test-state.ts`: use no Vitest quando um teste precisar de `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture de configuração, espaço de trabalho, diretório do agente ou armazenamento de perfis de autenticação isolados.
- `pnpm test:env-mutations:report`: relatório não bloqueante de testes/harnesses que modificam diretamente `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` ou chaves de ambiente relacionadas. Use-o para encontrar candidatos à migração para o auxiliar de estado de teste compartilhado.
- `test/helpers/openclaw-test-instance.ts`: testes E2E no nível do processo que precisam de um Gateway em execução, ambiente da CLI, captura de logs e limpeza em um só lugar.
- Lanes E2E de Docker/Bash que carregam `scripts/lib/docker-e2e-image.sh` podem passar `docker_e2e_test_state_shell_b64 <label> <scenario>` para o contêiner e decodificá-lo com `scripts/lib/openclaw-e2e-instance.sh`; scripts com múltiplos diretórios pessoais podem passar `docker_e2e_test_state_function_b64` e chamar `openclaw_test_state_create <label> <scenario>` em cada fluxo. `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` grava um arquivo de ambiente do host que pode ser carregado (o `--` antes de `create` impede que runtimes mais recentes do Node tratem `--env-file` como um sinalizador do Node). Lanes que iniciam um Gateway podem carregar `scripts/lib/openclaw-e2e-instance.sh` para resolução do ponto de entrada, inicialização simulada da OpenAI, execução em primeiro plano/segundo plano, sondagens de prontidão, exportação do ambiente de estado, despejos de logs e limpeza de processos.

## Lanes da interface de controle, TUI e extensões

- **E2E simulado da Control UI:** `pnpm test:ui:e2e` executa a faixa do Vitest + Playwright que inicia a Control UI do Vite e conduz uma página real do Chromium em relação a um WebSocket simulado do Gateway. Os testes ficam em `ui/src/**/*.e2e.test.ts`; os controles e mocks compartilhados ficam em `ui/src/test-helpers/control-ui-e2e.ts`. `pnpm test:e2e` inclui essa faixa. As execuções de agentes usam Testbox/Crabbox por padrão, incluindo provas direcionadas; use `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` apenas como fallback local explícito.
- **Testes PTY da TUI:** `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` executa a faixa PTY rápida com backend falso. `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` ou `pnpm tui:pty:test:watch --mode local` executa o smoke mais lento de `tui --local`, que simula apenas o endpoint externo do modelo. Verifique texto visível estável ou chamadas de fixtures, não snapshots ANSI brutos.
- `pnpm test:extensions` e `pnpm test extensions` executam todos os shards de extensões/plugins. Plugins de canal pesados, o plugin de navegador e a OpenAI são executados como shards dedicados; os demais grupos de plugins permanecem agrupados. `pnpm test extensions/<id>` executa uma faixa de plugin incluído.
- Arquivos-fonte com testes irmãos são mapeados para esse teste irmão antes de recorrer a globs de diretório mais amplos. Edições de auxiliares em `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` e `src/plugins/contracts` usam um grafo de importação local para executar os testes que os importam, em vez de executar amplamente todos os shards quando o caminho da dependência é preciso.
- Alvos de diretórios de contratos se distribuem entre suas faixas de contrato: `pnpm test src/channels/plugins/contracts` executa as quatro configurações de contrato de canal, e `pnpm test src/plugins/contracts` executa a configuração de contratos de plugins, pois os projetos genéricos `channels`/`plugins` excluem `contracts/**`.
- `auto-reply` é dividido em três configurações dedicadas (`core`, `top-level`, `reply`) para que o harness de respostas não domine os testes mais leves de status/token/auxiliares de nível superior.
- Arquivos de teste selecionados de `plugin-sdk` e `commands` são direcionados por faixas leves dedicadas que mantêm apenas `test/setup.ts`, deixando os casos pesados de runtime em suas faixas existentes.
- A configuração básica do Vitest usa por padrão `pool: "threads"` e `isolate: false`, com o executor compartilhado não isolado habilitado nas configurações do repositório.
- `pnpm test:channels` executa `vitest.channels.config.ts`.

## Gateway e E2E

- A integração do Gateway é opcional: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e`: agregado E2E do repositório = `pnpm test:e2e:gateway && pnpm test:ui:e2e`.
- `pnpm test:e2e:gateway`: testes smoke de ponta a ponta do Gateway (emparelhamento de várias instâncias de WS/HTTP/Node). Usa por padrão `threads` + `isolate: false`, com workers adaptativos em `vitest.e2e.config.ts`; ajuste com `OPENCLAW_E2E_WORKERS=<n>` e habilite logs detalhados com `OPENCLAW_E2E_VERBOSE=1`.
- `pnpm test:live`: testes ao vivo de provedores (Claude/Minimax/DeepSeek/z.ai/etc., condicionados por `*.live.test.ts`). Requer chaves de API e `LIVE=1` (ou `OPENCLAW_LIVE_TEST=1`) para não serem ignorados; saída detalhada com `OPENCLAW_LIVE_TEST_QUIET=0`.

## Suíte Docker completa (`pnpm test:docker:all`)

Compila a imagem compartilhada de testes ao vivo, empacota o OpenClaw uma vez como um tarball npm, compila/reutiliza uma imagem básica de executor Node/Git e uma imagem funcional que instala esse tarball em `/app` e, em seguida, executa faixas smoke do Docker por meio de um agendador ponderado. `scripts/package-openclaw-for-docker.mjs` é o único empacotador local/de CI e valida o tarball e `dist/postinstall-inventory.json` antes que o Docker os consuma.

- Imagem básica (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`): faixas de instalador/atualização/dependências de plugins; monta o tarball pré-compilado em vez de fontes copiadas do repositório.
- Imagem funcional (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`): faixas normais de funcionalidade do aplicativo compilado.
- Definições das faixas: `scripts/lib/docker-e2e-scenarios.mjs`. Planejador: `scripts/lib/docker-e2e-plan.mjs`. Executor: `scripts/test-docker-all.mjs`.
- `node scripts/test-docker-all.mjs --plan-json` emite o plano de CI controlado pelo agendador (faixas, tipos de imagem, necessidades de pacote/imagem ao vivo, cenários de estado, verificações de credenciais) sem compilar nem executar o Docker.

Controles de agendamento (variáveis de ambiente, padrões entre parênteses):

| Variável de ambiente                                                                                             | Padrão              | Finalidade                                                                                                                                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`                                                                               | 10                  | Slots de processos.                                                                                                                                                                                                                                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`                                                                          | 10                  | Pool final sensível a provedores.                                                                                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`                                                                                | 9                   | Limite de faixas pesadas de provedores ao vivo.                                                                                                                                                                                                                                            |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`                                                                                 | 5                   | Limite de faixas de recursos npm.                                                                                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`                                                                             | 7                   | Limite de faixas de recursos de serviços.                                                                                                                                                                                                                                                   |
| `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT` / `_CODEX_LIMIT` / `_GEMINI_LIMIT` / `_DROID_LIMIT` / `_OPENCODE_LIMIT` | 4                   | Limites de faixas pesadas por provedor.                                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_OPENAI_LIMIT` / `_TELEGRAM_LIMIT`                                                     | 1                   | Limites mais restritos por provedor.                                                                                                                                                                                                                                                        |
| `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` / `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`                                         | -                   | Substituição para hosts maiores.                                                                                                                                                                                                                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS`                                                                          | 2000                | Atraso entre os inícios das faixas, evitando tempestades de criação no daemon local do Docker.                                                                                                                                                                                              |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`                                                                           | 7,200,000 (120 min) | Tempo limite de fallback por faixa; faixas selecionadas ao vivo/finais usam limites mais rígidos.                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_RETRIES`                                                                              | 1                   | Novas tentativas para falhas transitórias de provedores ao vivo.                                                                                                                                                                                                                            |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`                                                                                   | off                 | Imprime o manifesto das faixas sem executar o Docker.                                                                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS`                                                                        | 30000               | Intervalo de impressão do status das faixas ativas.                                                                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_TIMINGS`                                                                                   | on                  | Reutiliza `.artifacts/docker-tests/lane-timings.json` para ordenar da mais longa para a mais curta; defina como `0` para desabilitar.                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_LIVE_MODE`                                                                                 | -                   | `skip` apenas para faixas determinísticas/locais, `only` apenas para faixas de provedores ao vivo. Aliases: `pnpm test:docker:local:all`, `pnpm test:docker:live:all`. O modo somente ao vivo combina as faixas ao vivo principais e finais em um único pool ordenado da mais longa para a mais curta, para que os buckets de provedores agrupem trabalhos do Claude/Codex/Gemini. |
| `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`                                                               | 180                 | Tempo limite de configuração do Docker no backend da CLI.                                                                                                                                                                                                                                   |

O padrão de variável de ambiente para limites de recursos é `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` (nome do recurso em maiúsculas, caracteres não alfanuméricos convertidos em `_`).

Outro comportamento: o executor realiza uma verificação preliminar do Docker por padrão, limpa contêineres E2E obsoletos do OpenClaw, compartilha caches das ferramentas CLI dos provedores entre lanes compatíveis e deixa de agendar novas lanes agrupadas após a primeira falha, a menos que `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` esteja definido. Se uma lane exceder o limite efetivo de peso/recursos em um host com baixo paralelismo, ela ainda poderá iniciar a partir de um pool vazio e ser executada sozinha até liberar capacidade. Os logs por lane, `summary.json`, `failures.json` e as durações das fases são gravados em `.artifacts/docker-tests/<run-id>/`; use `pnpm test:docker:timings <summary.json>` para inspecionar lanes lentas e `pnpm test:docker:rerun <run-id|summary.json|failures.json>` para exibir comandos econômicos de reexecução direcionada.

### Lanes Docker relevantes

| Comando                                                                     | Verifica                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:docker:browser-cdp-snapshot`                                     | Contêiner E2E de origem com Chromium, CDP bruto e Gateway isolado; os instantâneos de funções do CDP de `browser doctor --deep` incluem URLs de links, elementos clicáveis promovidos pelo cursor, referências de iframes e metadados de frames.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `pnpm test:docker:skill-install`                                            | Instala o tarball empacotado em um executor Docker básico com `skills.install.allowUploadedArchives: false`, resolve um slug de skill atual por meio de uma pesquisa em tempo real no ClawHub, instala via `openclaw skills install` e verifica `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` e `skills info --json`.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `pnpm test:docker:live-cli-backend:claude`, `:claude:resume`, `:claude:mcp` | Sondagens em tempo real direcionadas do backend da CLI; o Gemini tem os aliases correspondentes `:resume` e `:mcp`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `pnpm test:docker:openwebui`                                                | OpenClaw + Open WebUI em Docker: faz login, verifica `/api/models` e executa um chat real com proxy por meio de `/api/chat/completions`. Requer uma chave de modelo em tempo real utilizável e baixa uma imagem externa; não se espera que seja estável na CI como as suítes unitárias/E2E.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `pnpm test:docker:mcp-channels`                                             | Contêiner do Gateway com dados iniciais e um contêiner cliente que inicia `openclaw mcp serve`: descoberta de conversas roteadas, leitura de transcrições, metadados de anexos, comportamento da fila de eventos em tempo real, roteamento de envios de saída e notificações de canal e permissão no estilo Claude pela ponte stdio real (a asserção lê diretamente os frames MCP brutos do stdio).                                                                                                                                                                                                                                                                                                                                                                                                               |
| `pnpm test:docker:upgrade-survivor`                                         | Instala o tarball empacotado sobre uma fixture antiga e modificada de usuário, executa a atualização do pacote e o doctor não interativo sem chaves ativas de provedores/canais, inicia um Gateway de loopback e verifica se agentes, configuração de canais, listas de permissões de plugins, arquivos de workspace/sessão, estado obsoleto de dependências de plugins legados, inicialização e status de RPC permanecem intactos.                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `pnpm test:docker:published-upgrade-survivor`                               | Instala `openclaw@latest` por padrão, adiciona arquivos iniciais realistas de um usuário existente, configura por meio de uma receita incorporada de `openclaw config set`, atualiza para o tarball empacotado, executa o doctor não interativo, grava `.artifacts/upgrade-survivor/summary.json` e verifica `/healthz`, `/readyz` e o status de RPC. Substitua com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, expanda uma matriz com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ou adicione fixtures de cenário com `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` (inclui `configured-plugin-installs` e `stale-source-plugin-shadow`). O Package Acceptance os disponibiliza como `published_upgrade_survivor_baseline(s)` / `_scenarios` e resolve metatokens como `last-stable-4` ou `all-since-2026.4.23`. |
| `pnpm test:docker:update-migration`                                         | Harness de sobrevivência à atualização publicada no cenário `plugin-deps-cleanup`, começando em `openclaw@2026.4.23` por padrão. O fluxo de trabalho `Update Migration` expande isso com `baselines=all-since-2026.4.23` para comprovar a limpeza das dependências de plugins configurados fora da CI de versão completa.                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `pnpm test:docker:plugins`                                                  | Teste rápido de instalação/atualização para caminho local, `file:`, pacotes do registro npm com dependências elevadas, referências móveis do git, fixtures do ClawHub, atualizações do marketplace e ativação/inspeção do pacote Claude.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

## Gate local de PR

Para verificações locais de gate/integração de PR, execute:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Se `pnpm test` apresentar uma falha intermitente em um host sobrecarregado, execute-o novamente uma vez antes de tratar isso como uma regressão e, em seguida, isole com `pnpm test <path/to/test>`. Para hosts com restrição de memória:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Ferramentas de desempenho de testes

- `pnpm test:perf:imports`: habilita relatórios de duração e detalhamento de importações do Vitest, mantendo o roteamento de lanes com escopo definido para destinos explícitos de arquivos/diretórios. `pnpm test:perf:imports:changed` restringe o mesmo perfilamento aos arquivos alterados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compara o desempenho do caminho roteado no modo de alterações com a execução nativa do projeto raiz para o mesmo diff do git confirmado; `pnpm test:perf:changed:bench -- --worktree` compara o desempenho do conjunto atual de alterações da árvore de trabalho sem exigir um commit prévio.
- `pnpm test:perf:profile:main` grava um perfil de CPU para a thread principal do Vitest (`.artifacts/vitest-main-profile`); `pnpm test:perf:profile:runner` grava perfis de CPU e heap para o executor de testes unitários (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: executa em série cada configuração folha do Vitest da suíte completa e grava dados de duração agrupados, além de artefatos JSON/log por configuração. Por padrão, os relatórios da suíte completa isolam os arquivos para que grafos de módulos retidos e pausas de GC de arquivos anteriores não sejam atribuídos a asserções posteriores; passe `-- --no-isolate` somente ao analisar intencionalmente o acúmulo em workers compartilhados. O agente de desempenho de testes usa isso como linha de base antes de tentar corrigir testes lentos. `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` compara relatórios agrupados após uma alteração voltada ao desempenho.
- As execuções fragmentadas da suíte completa, das extensões e dos padrões de inclusão atualizam os dados de duração locais em `.artifacts/vitest-shard-timings.json`; execuções posteriores de configurações completas usam essas durações para equilibrar fragmentos lentos e rápidos. Os fragmentos de CI com padrões de inclusão acrescentam o nome do fragmento à chave de duração, o que mantém visíveis as durações dos fragmentos filtrados sem substituir os dados de duração da configuração completa. Defina `OPENCLAW_TEST_PROJECTS_TIMINGS=0` para ignorar o artefato de duração local.

## Benchmarks

<Accordion title="Latência do modelo (scripts/bench-model.ts)">

```bash
pnpm tsx scripts/bench-model.ts --runs 10
```

Variáveis de ambiente opcionais: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`. Prompt padrão: "Responda com uma única palavra: ok. Sem pontuação ou texto adicional."

</Accordion>

<Accordion title="Inicialização da CLI (scripts/bench-cli-startup.ts)">

```bash
pnpm test:startup:bench
pnpm test:startup:bench:smoke
pnpm test:startup:bench:save
pnpm test:startup:bench:update
pnpm test:startup:bench:check
pnpm tsx scripts/bench-cli-startup.ts --runs 12
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3
pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all
```

Predefinições:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: ambas as predefinições combinadas

A saída inclui `sampleCount`, média, p50, p95, mínimo/máximo, distribuição de códigos de saída/sinais e RSS máximo por comando. `--cpu-prof-dir` / `--heap-prof-dir` gravam perfis do V8 por execução.

Saída salva: `pnpm test:startup:bench:smoke` grava `.artifacts/cli-startup-bench-smoke.json`; `pnpm test:startup:bench:save` grava `.artifacts/cli-startup-bench-all.json` (`runs=5 warmup=1`). Fixture versionada: `test/fixtures/cli-startup-bench.json`, atualizada por `pnpm test:startup:bench:update`, comparada por `pnpm test:startup:bench:check`.

</Accordion>

<Accordion title="Inicialização do Gateway (scripts/bench-gateway-startup.ts)">

Por padrão, usa o ponto de entrada compilado da CLI em `dist/entry.js`; execute `pnpm build` primeiro. Passe `--entry scripts/run-node.mjs` para medir o executor do código-fonte em vez disso e mantenha esses resultados separados das linhas de base do ponto de entrada compilado.

```bash
pnpm test:startup:gateway -- --runs 5 --warmup 1
pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5
node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json
```

IDs dos casos: `default`, `skipChannels` (inicialização dos canais ignorada), `oneInternalHook`, `allInternalHooks`, `fiftyPlugins` (50 plugins de manifesto), `fiftyStartupLazyPlugins` (50 plugins de manifesto com inicialização adiada).

A saída inclui a primeira saída do processo, `/healthz`, `/readyz`, tempo do log de escuta HTTP, tempo do log de prontidão do Gateway, tempo de CPU, proporção de núcleos de CPU, RSS máximo, heap, métricas de rastreamento da inicialização, atraso do loop de eventos e métricas detalhadas da tabela de consulta de plugins. O script define `OPENCLAW_GATEWAY_STARTUP_TRACE=1` no ambiente do Gateway filho.

`/healthz` indica atividade (o servidor HTTP consegue responder). `/readyz` indica prontidão operacional (os processos auxiliares dos plugins de inicialização, os canais e o trabalho pós-anexação crítico para a prontidão foram concluídos). Os hooks de inicialização são despachados de forma assíncrona e não fazem parte da garantia de prontidão. O tempo do log de prontidão é o carimbo de data/hora interno do Gateway, útil para atribuição no lado do processo, mas não substitui a sondagem externa `/readyz`.

Use a saída JSON ou `--output` ao comparar alterações. Use `--cpu-prof-dir` somente depois que a saída de rastreamento indicar trabalho de importação, compilação ou limitado pela CPU que os tempos das fases, isoladamente, não conseguem explicar.

</Accordion>

<Accordion title="Reinicialização do Gateway (scripts/bench-gateway-restart.ts)">

Somente macOS e Linux (usa SIGUSR1 para reinicializações dentro do processo; falha imediatamente no Windows). Usa o mesmo ponto de entrada compilado por padrão e a mesma substituição `--entry scripts/run-node.mjs` da inicialização do Gateway acima.

```bash
pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5
pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1
```

IDs dos casos: `skipChannels`, `skipChannelsAcpxProbe` (sondagem de inicialização do ACPX ativada), `skipChannelsNoAcpxProbe` (sondagem desativada), `default`, `fiftyPlugins`.

A saída inclui o próximo `/healthz`, o próximo `/readyz`, tempo de inatividade, tempo de prontidão da reinicialização, CPU, RSS, métricas de rastreamento da inicialização do processo substituto e métricas de rastreamento da reinicialização para tratamento de sinais, drenagem do trabalho ativo, fases de fechamento, próxima inicialização, tempo de prontidão e snapshots de memória. O script define `OPENCLAW_GATEWAY_STARTUP_TRACE=1` e `OPENCLAW_GATEWAY_RESTART_TRACE=1`.

Use este benchmark quando uma alteração afetar a sinalização de reinicialização, os manipuladores de fechamento, a inicialização após reinicialização, o encerramento de processos auxiliares, a transferência do serviço ou a prontidão após a reinicialização. Comece com `skipChannels` para isolar a mecânica do Gateway da inicialização dos canais; use `default` ou casos com muitos plugins somente depois que o caso restrito explicar o caminho da reinicialização. As métricas de rastreamento são indícios de atribuição, não vereditos — avalie uma alteração de reinicialização com base em várias amostras, no intervalo correspondente do componente proprietário, no comportamento de `/healthz`/`/readyz` e no contrato de reinicialização visível ao usuário.

</Accordion>

## E2E de integração inicial (Docker)

Opcional; necessário apenas para testes de fumaça da integração inicial em contêineres. Fluxo completo de inicialização a frio em um contêiner Linux limpo:

```bash
scripts/e2e/onboard-docker.sh
```

Conduz o assistente interativo por meio de um pseudo-TTY, verifica os arquivos de configuração, espaço de trabalho e sessão, depois inicia o Gateway e executa `openclaw health`.

## Teste de fumaça da importação de QR (Docker)

Garante que o helper mantido de runtime de QR seja carregado nos runtimes Node compatíveis com Docker (Node 24 por padrão, compatível com Node 22):

```bash
pnpm test:docker:qr
```

## Relacionado

- [Testes](/pt-BR/help/testing)
- [Testes em ambiente real](/pt-BR/help/testing-live)
- [Testes de atualizações e plugins](/pt-BR/help/testing-updates-plugins)
