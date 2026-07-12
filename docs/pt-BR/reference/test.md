---
read_when:
    - Executando ou corrigindo testes
summary: Como executar testes localmente (vitest) e quando usar os modos de força/cobertura
title: Testes
x-i18n:
    generated_at: "2026-07-12T00:23:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 63806ea72da1579f4aa0b92c14a6d2d3e67990d6c10cb6d9b1b2bb4a63c8e140
    source_path: reference/test.md
    workflow: 16
---

- Kit completo de testes (suítes, ao vivo, Docker): [Testes](/pt-BR/help/testing)
- Validação de atualizações e pacotes de plugins: [Testes de atualizações e plugins](/pt-BR/help/testing-updates-plugins)

## Padrão do agente

As sessões do agente executam testes e validações computacionalmente intensivas remotamente
por meio do Crabbox. O código confiável de mantenedores usa o Blacksmith Testbox por padrão. O
fluxo de trabalho configurado do Testbox carrega credenciais; portanto, código não confiável de
colaboradores ou forks deve usar CI de fork sem segredos ou o AWS Crabbox direto e sanitizado.

Quando uma tarefa com código confiável provavelmente exigir testes ou comprovação intensiva, faça
o pré-aquecimento imediatamente em uma sessão de comando em segundo plano, continue trabalhando
enquanto ela é preparada, reutilize o ID `tbx_...` retornado, sincronize o checkout atual em cada
execução e interrompa-o antes da entrega:

```bash
node scripts/crabbox-wrapper.mjs warmup --provider blacksmith-testbox --keep --timing-json
```

Após a primeira reutilização bem-sucedida, o wrapper registra a base da concessão,
as dependências e a impressão digital do fluxo de trabalho do Testbox em `.crabbox/testbox-leases/`.
Edições somente no código-fonte continuam reutilizando a máquina pré-aquecida. Uma alteração na base de mesclagem, no lockfile,
na entrada do gerenciador de pacotes, no wrapper ou no fluxo de trabalho do Testbox resulta em falha segura e exige uma
nova concessão. Cada execução ainda sincroniza o checkout atual.
`OPENCLAW_TESTBOX_ALLOW_STALE=1` serve apenas para diagnósticos intencionais, não para
comprovação de versão.

Os comandos de teste local abaixo destinam-se a fluxos de trabalho humanos ou a uma alternativa explícita do agente
solicitada pelo usuário. A indisponibilidade do provedor remoto deve ser informada; ela
não concede permissão para executar silenciosamente uma verificação local ampla.

Para código não confiável, faça o pré-aquecimento com `--provider aws`. Cada execução deve definir
`CRABBOX_ENV_ALLOW=CI`, passar `--provider aws --no-hydrate` e usar
um `HOME` remoto temporário novo antes de instalar dependências ou executar
testes. Use uma concessão recém-aquecida dedicada a essa fonte não confiável; nunca reutilize
uma concessão confiável ou previamente carregada com credenciais. Inicie um binário Crabbox confiável instalado
a partir de um checkout limpo e confiável de `main` e busque apenas o PR remoto com
`--fresh-pr`; nunca execute localmente o wrapper ou a configuração do checkout não confiável.
Remova a definição de `CRABBOX_AWS_INSTANCE_PROFILE` e resulte em falha segura, a menos que o valor resolvido de
`aws.instanceProfile` esteja vazio. Antes de qualquer instalação ou teste, use ferramentas confiáveis
com caminho absoluto para exigir um token IMDSv2, comprovar que o endpoint de credenciais do IAM
retorna 404 e verificar se o `git rev-parse HEAD` remoto é igual ao SHA completo
revisado do HEAD do PR. Vincule a concessão a esse SHA e interrompa/refaça o aquecimento quando o HEAD
mudar. Envie o `scripts/crabbox-untrusted-bootstrap.sh` confiável a partir de uma
`main` limpa junto com `--fresh-pr`; ele instala versões fixadas do Node/pnpm, verifica o SHA
e a versão fixada do gerenciador de pacotes, isola o `HOME`, instala as dependências e então executa
o teste solicitado. Se o intermediário não conseguir comprovar a ausência de função ou se não existir PR remoto,
use CI de fork sem segredos. Não use `hydrate-github`, `--no-sync` nem um
fluxo de trabalho do Testbox carregado com credenciais.
Remova a definição de todas as substituições `CRABBOX_TAILSCALE*`, force `--network public
--tailscale=false`, limpe as opções de nó de saída/LAN e exija que `crabbox inspect`
informe rede pública sem estado do Tailscale antes de enviar qualquer script.

## Ordem local rotineira

1. `pnpm test:changed` para comprovação com Vitest no escopo alterado.
2. `pnpm test <path-or-filter>` para um arquivo, diretório ou destino explícito.
3. `pnpm test` somente quando você precisar intencionalmente da suíte local completa do Vitest.

Em uma árvore de trabalho do Codex ou em um checkout vinculado/esparso, os agentes evitam executar localmente
`pnpm test*` / `pnpm check*` / `pnpm crabbox:run` diretamente:

- Alternativa local solicitada explicitamente pelo usuário para um arquivo pequeno:
  `node scripts/run-vitest.mjs <path-or-filter>`.
- Verificações de alterações ou comprovação ampla: `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed`, para que o pnpm seja executado dentro do Testbox.
- O `exitCode` final e o JSON de tempos do wrapper são o resultado do comando. Uma execução delegada do Blacksmith GitHub Actions pode aparecer como `cancelled` após um comando SSH bem-sucedido porque o Testbox é interrompido externamente à ação de manutenção de atividade; verifique o resumo do wrapper e a saída do comando antes de considerar isso uma falha.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: mantém a serialização das verificações intensivas dentro da árvore de trabalho atual, em vez do diretório comum do Git, para comandos como `pnpm check:changed` e `pnpm test ...` direcionado. Use-o somente em hosts locais de alta capacidade quando executar intencionalmente verificações independentes em árvores de trabalho vinculadas.

## Comandos principais

As execuções do wrapper de testes terminam com um breve resumo `[test] passed|failed|skipped ... in ...`; a linha de duração do próprio Vitest permanece como o detalhamento por fragmento.

| Comando                                           | O que ele faz                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                       | Destinos explícitos de arquivo/diretório são encaminhados por faixas de execução do Vitest com escopo definido. Execuções sem destino servem como comprovação da suíte completa: grupos fixos de fragmentos são expandidos para configurações de folha para execução local paralela, com a distribuição esperada de fragmentos exibida antes do início. O grupo de extensões sempre é expandido em configurações de fragmentos por extensão, em vez de um único processo gigantesco do projeto raiz. |
| `pnpm test:changed`                               | Execução inteligente e econômica dos testes alterados: destinos precisos provenientes de edições diretas em testes, arquivos `*.test.ts` irmãos, mapeamentos explícitos de código-fonte e o grafo de importações local. Alterações amplas/de configuração/de pacote são ignoradas, a menos que sejam mapeadas para testes precisos.                                                                                                                     |
| `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` | Execução ampla e explícita dos testes alterados; use quando uma edição no mecanismo de testes, na configuração ou no pacote precisar recorrer ao comportamento mais amplo de testes alterados do Vitest.                                                                                                                                                                                                              |
| `pnpm test:force`                                 | Libera a porta configurada do Gateway do OpenClaw (padrão `18789`) e então executa a suíte completa com uma porta isolada do Gateway, para que testes de servidor não entrem em conflito com uma instância em execução.                                                                                                                                                                          |
| `pnpm test:coverage`                              | Gera um relatório informativo de cobertura V8 para a faixa padrão de testes unitários (`vitest.unit.config.ts`); nenhum limite mínimo de cobertura é aplicado.                                                                                                                                                                                                                   |
| `pnpm test:coverage:changed`                      | Cobertura unitária somente para arquivos alterados desde `origin/main`.                                                                                                                                                                                                                                                                                             |
| `pnpm changed:lanes`                              | Exibe as faixas arquiteturais acionadas pelo diff em relação a `origin/main`.                                                                                                                                                                                                                                                                            |
| `pnpm check:changed`                              | Delega ao Crabbox/Testbox por padrão fora da CI e então executa a verificação inteligente de alterações dentro do processo remoto filho: formatação, verificação de tipos, lint e comandos de proteção para as faixas afetadas. Não executa o Vitest; use `pnpm test:changed` ou `pnpm test <target>` para comprovação de testes.                                                                      |

## Estado de teste compartilhado e auxiliares de processo

- `src/test-utils/openclaw-test-state.ts`: use-o no Vitest quando um teste precisar de um `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture de configuração, espaço de trabalho, diretório do agente ou armazenamento de perfis de autenticação isolado.
- `pnpm test:env-mutations:report`: relatório não bloqueante de testes/mecanismos que modificam diretamente `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` ou chaves de ambiente relacionadas. Use-o para encontrar candidatos à migração para o auxiliar de estado de teste compartilhado.
- `test/helpers/openclaw-test-instance.ts`: para testes E2E em nível de processo que precisam de um Gateway em execução, ambiente da CLI, captura de logs e limpeza em um só lugar.
- Faixas E2E de Docker/Bash que carregam `scripts/lib/docker-e2e-image.sh` podem passar `docker_e2e_test_state_shell_b64 <label> <scenario>` para o contêiner e decodificá-lo com `scripts/lib/openclaw-e2e-instance.sh`; scripts com vários diretórios iniciais podem passar `docker_e2e_test_state_function_b64` e chamar `openclaw_test_state_create <label> <scenario>` em cada fluxo. `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` grava um arquivo de ambiente do host que pode ser carregado (o `--` antes de `create` impede que runtimes mais recentes do Node tratem `--env-file` como uma opção do Node). Faixas que iniciam um Gateway podem carregar `scripts/lib/openclaw-e2e-instance.sh` para resolução do ponto de entrada, inicialização simulada da OpenAI, execução em primeiro/segundo plano, sondagens de prontidão, exportação do ambiente de estado, despejos de logs e limpeza de processos.

## Faixas da interface de controle, TUI e extensões

- **E2E simulado da interface de controle:** `pnpm test:ui:e2e` executa a faixa Vitest + Playwright que inicia a interface de controle do Vite e conduz uma página real do Chromium usando um WebSocket do Gateway simulado. Os testes ficam em `ui/src/**/*.e2e.test.ts`; as simulações e os controles compartilhados ficam em `ui/src/test-helpers/control-ui-e2e.ts`. `pnpm test:e2e` inclui essa faixa. As execuções do agente usam Testbox/Crabbox por padrão, incluindo provas direcionadas; use `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` somente como alternativa local explícita.
- **Testes de PTY da TUI:** `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` executa a faixa rápida de PTY com backend simulado. `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` ou `pnpm tui:pty:test:watch --mode local` executa o teste de fumaça mais lento de `tui --local`, que simula somente o endpoint externo do modelo. Verifique texto visível estável ou chamadas de fixtures, não snapshots ANSI brutos.
- `pnpm test:extensions` e `pnpm test extensions` executam todos os shards de extensões/plugins. Plugins pesados de canais, o plugin de navegador e a OpenAI são executados como shards dedicados; outros grupos de plugins permanecem agrupados. `pnpm test extensions/<id>` executa a faixa de um Plugin incluído.
- Arquivos-fonte com testes irmãos são mapeados primeiro para esses testes, antes de recorrer a globs mais amplos de diretórios. Edições em auxiliares dentro de `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` e `src/plugins/contracts` usam um grafo de importação local para executar os testes que os importam, em vez de executar amplamente todos os shards quando o caminho de dependência é preciso.
- Alvos de diretórios de contratos se distribuem entre suas respectivas faixas de contratos: `pnpm test src/channels/plugins/contracts` executa as quatro configurações de contratos de canais, e `pnpm test src/plugins/contracts` executa a configuração de contratos de plugins, pois os projetos genéricos `channels`/`plugins` excluem `contracts/**`.
- `auto-reply` é dividido em três configurações dedicadas (`core`, `top-level`, `reply`) para que o mecanismo de testes de resposta não domine os testes mais leves de status/tokens/auxiliares de nível superior.
- Arquivos de teste selecionados de `plugin-sdk` e `commands` são encaminhados por faixas leves dedicadas que mantêm apenas `test/setup.ts`, deixando os casos que exigem mais do runtime em suas faixas existentes.
- A configuração básica do Vitest usa por padrão `pool: "threads"` e `isolate: false`, com o executor compartilhado não isolado habilitado em todas as configurações do repositório.
- `pnpm test:channels` executa `vitest.channels.config.ts`.

## Gateway e E2E

- A integração com o Gateway é opcional: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e`: agregado E2E do repositório = `pnpm test:e2e:gateway && pnpm test:ui:e2e`.
- `pnpm test:e2e:gateway`: testes de fumaça de ponta a ponta do Gateway (emparelhamento de múltiplas instâncias por WS/HTTP/Node). Usa por padrão `threads` + `isolate: false`, com workers adaptativos em `vitest.e2e.config.ts`; ajuste com `OPENCLAW_E2E_WORKERS=<n>` e habilite logs detalhados com `OPENCLAW_E2E_VERBOSE=1`.
- `pnpm test:live`: testes em ambiente real dos provedores (Claude/Minimax/DeepSeek/z.ai/etc., controlados por `*.live.test.ts`). Exige chaves de API e `LIVE=1` (ou `OPENCLAW_LIVE_TEST=1`) para deixar de ignorá-los; habilite saída detalhada com `OPENCLAW_LIVE_TEST_QUIET=0`.

## Suíte completa do Docker (`pnpm test:docker:all`)

Compila a imagem compartilhada de testes em ambiente real, empacota o OpenClaw uma única vez como tarball npm, compila/reutiliza uma imagem básica de execução com Node/Git e uma imagem funcional que instala esse tarball em `/app` e, em seguida, executa as faixas de testes de fumaça do Docker por meio de um agendador ponderado. `scripts/package-openclaw-for-docker.mjs` é o único empacotador local/de CI e valida o tarball e `dist/postinstall-inventory.json` antes que o Docker o consuma.

- Imagem básica (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`): faixas de instalador/atualização/dependências de plugins; monta o tarball pré-compilado em vez de copiar os fontes do repositório.
- Imagem funcional (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`): faixas normais de funcionalidade do aplicativo compilado.
- Definições das faixas: `scripts/lib/docker-e2e-scenarios.mjs`. Planejador: `scripts/lib/docker-e2e-plan.mjs`. Executor: `scripts/test-docker-all.mjs`.
- `node scripts/test-docker-all.mjs --plan-json` emite o plano de CI controlado pelo agendador (faixas, tipos de imagem, necessidades de pacote/imagem para ambiente real, cenários de estado e verificações de credenciais) sem compilar nem executar o Docker.

Opções de agendamento (variáveis de ambiente, padrões entre parênteses):

| Variável de ambiente                                                                                             | Padrão              | Finalidade                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`                                                                               | 10                  | Vagas de processos.                                                                                                                                                                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`                                                                          | 10                  | Pool final sensível a provedores.                                                                                                                                                                                                                                                                                                                          |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`                                                                                | 9                   | Limite de faixas pesadas de provedores em ambiente real.                                                                                                                                                                                                                                                                                                  |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`                                                                                 | 5                   | Limite de faixas que usam recursos do npm.                                                                                                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`                                                                             | 7                   | Limite de faixas que usam recursos de serviços.                                                                                                                                                                                                                                                                                                            |
| `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT` / `_CODEX_LIMIT` / `_GEMINI_LIMIT` / `_DROID_LIMIT` / `_OPENCODE_LIMIT` | 4                   | Limites de faixas pesadas por provedor.                                                                                                                                                                                                                                                                                                                    |
| `OPENCLAW_DOCKER_ALL_LIVE_OPENAI_LIMIT` / `_TELEGRAM_LIMIT`                                                     | 1                   | Limites mais restritos por provedor.                                                                                                                                                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` / `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`                                         | -                   | Substituição para hosts maiores.                                                                                                                                                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS`                                                                          | 2000                | Atraso entre o início das faixas, evitando tempestades de criação no daemon local do Docker.                                                                                                                                                                                                                                                               |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`                                                                           | 7.200.000 (120 min) | Tempo limite alternativo por faixa; faixas selecionadas de ambiente real/finais usam limites mais restritos.                                                                                                                                                                                                                                               |
| `OPENCLAW_DOCKER_ALL_LIVE_RETRIES`                                                                              | 1                   | Novas tentativas para falhas transitórias de provedores em ambiente real.                                                                                                                                                                                                                                                                                  |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`                                                                                   | desativado          | Exibe o manifesto das faixas sem executar o Docker.                                                                                                                                                                                                                                                                                                        |
| `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS`                                                                        | 30000               | Intervalo de exibição do status das faixas ativas.                                                                                                                                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_TIMINGS`                                                                                   | ativado             | Reutiliza `.artifacts/docker-tests/lane-timings.json` para ordenar da mais longa para a mais curta; defina como `0` para desabilitar.                                                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_LIVE_MODE`                                                                                 | -                   | Use `skip` somente para faixas determinísticas/locais ou `only` somente para faixas de provedores em ambiente real. Aliases: `pnpm test:docker:local:all`, `pnpm test:docker:live:all`. O modo exclusivo para ambiente real combina as faixas principais e finais em um único pool ordenado da mais longa para a mais curta, para que os grupos de provedores reúnam trabalhos do Claude/Codex/Gemini. |
| `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`                                                               | 180                 | Tempo limite de configuração do Docker para o backend da CLI.                                                                                                                                                                                                                                                                                              |

O padrão das variáveis de ambiente para limites de recursos é `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` (nome do recurso em maiúsculas, com caracteres não alfanuméricos convertidos em `_`).

Outro comportamento: por padrão, o executor faz uma verificação preliminar do Docker, limpa contêineres E2E obsoletos do OpenClaw, compartilha os caches das ferramentas de CLI dos provedores entre faixas compatíveis e deixa de agendar novas faixas agrupadas após a primeira falha, a menos que `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` esteja definido. Se uma faixa exceder o limite efetivo de peso/recursos em um host com baixo paralelismo, ela ainda poderá iniciar em um pool vazio e ser executada sozinha até liberar capacidade. Os logs por faixa, `summary.json`, `failures.json` e as durações das fases são gravados em `.artifacts/docker-tests/<run-id>/`; use `pnpm test:docker:timings <summary.json>` para inspecionar faixas lentas e `pnpm test:docker:rerun <run-id|summary.json|failures.json>` para exibir comandos econômicos de reexecução direcionada.

### Faixas Docker de destaque

| Comando                                                                     | Verifica                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:docker:browser-cdp-snapshot`                                     | Contêiner E2E de origem baseado no Chromium, com CDP bruto e Gateway isolado; os instantâneos de funções CDP de `browser doctor --deep` incluem URLs de links, elementos clicáveis promovidos pelo cursor, referências de iframe e metadados de quadros.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `pnpm test:docker:skill-install`                                            | Instala o tarball empacotado em um executor Docker básico com `skills.install.allowUploadedArchives: false`, resolve o slug atual de uma skill por meio de uma busca em tempo real no ClawHub, instala usando `openclaw skills install` e verifica `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` e `skills info --json`.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `pnpm test:docker:live-cli-backend:claude`, `:claude:resume`, `:claude:mcp` | Sondagens em tempo real direcionadas do backend da CLI; o Gemini tem aliases correspondentes `:resume` e `:mcp`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `pnpm test:docker:openwebui`                                                | OpenClaw + Open WebUI em Docker: faz login, verifica `/api/models` e executa um chat real por proxy por meio de `/api/chat/completions`. Exige uma chave válida de modelo em tempo real e baixa uma imagem externa; não se espera que seja estável na CI como as suítes unitárias/E2E.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `pnpm test:docker:mcp-channels`                                             | Contêiner do Gateway com dados iniciais, além de um contêiner cliente que inicia `openclaw mcp serve`: descoberta de conversas roteadas, leitura de transcrições, metadados de anexos, comportamento da fila de eventos em tempo real, roteamento de envios de saída e notificações de canais e permissões no estilo Claude pela ponte stdio real (a asserção lê diretamente os quadros MCP brutos de stdio).                                                                                                                                                                                                                                                                                                                                                                                                               |
| `pnpm test:docker:upgrade-survivor`                                         | Instala o tarball empacotado sobre um fixture antigo e modificado de usuário, executa a atualização do pacote e o doctor não interativo sem chaves ativas de provedores/canais, inicia um Gateway de local loopback e verifica se agentes, configuração de canais, listas de permissões de plugins, arquivos de workspace/sessão, estado obsoleto de dependências de plugins legados, inicialização e status de RPC sobrevivem.                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `pnpm test:docker:published-upgrade-survivor`                               | Instala `openclaw@latest` por padrão, preenche arquivos realistas de usuários existentes, configura por meio de uma receita incorporada de `openclaw config set`, atualiza para o tarball empacotado, executa o doctor não interativo, grava `.artifacts/upgrade-survivor/summary.json` e verifica `/healthz`, `/readyz` e o status de RPC. Substitua com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, expanda uma matriz com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ou adicione fixtures de cenários com `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` (inclui `configured-plugin-installs` e `stale-source-plugin-shadow`). A Aceitação de Pacotes expõe esses itens como `published_upgrade_survivor_baseline(s)` / `_scenarios` e resolve metatokens como `last-stable-4` ou `all-since-2026.4.23`. |
| `pnpm test:docker:update-migration`                                         | Harness de sobrevivência a atualizações publicadas no cenário `plugin-deps-cleanup`, começando em `openclaw@2026.4.23` por padrão. O fluxo de trabalho `Update Migration` expande isso com `baselines=all-since-2026.4.23` para comprovar a limpeza de dependências de plugins configurados fora da CI de Lançamento Completa.                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `pnpm test:docker:plugins`                                                  | Teste de fumaça de instalação/atualização para caminho local, pacotes `file:` e pacotes do registro npm com dependências elevadas, referências móveis do git, fixtures do ClawHub, atualizações do marketplace e ativação/inspeção do pacote do Claude.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

## Verificação local de PR

Para verificações locais de integração/validação de PR, execute:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Se `pnpm test` apresentar uma falha intermitente em um host sobrecarregado, execute-o novamente uma vez antes de tratá-la como uma regressão e, depois, isole-a com `pnpm test <path/to/test>`. Para hosts com restrição de memória:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Ferramentas de desempenho de testes

- `pnpm test:perf:imports`: habilita relatórios de duração e detalhamento de importações do Vitest, mantendo o roteamento por faixa com escopo para destinos explícitos de arquivos/diretórios. `pnpm test:perf:imports:changed` limita o mesmo perfilamento aos arquivos alterados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` mede o desempenho do caminho roteado do modo de alterações em comparação com a execução nativa do projeto raiz para o mesmo diff do git confirmado; `pnpm test:perf:changed:bench -- --worktree` mede o conjunto atual de alterações da árvore de trabalho sem exigir uma confirmação primeiro.
- `pnpm test:perf:profile:main` grava um perfil de CPU para a thread principal do Vitest (`.artifacts/vitest-main-profile`); `pnpm test:perf:profile:runner` grava perfis de CPU e heap para o executor de testes unitários (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: executa em série cada configuração folha do Vitest da suíte completa e grava dados agrupados de duração, além de artefatos JSON/log por configuração. Por padrão, os relatórios da suíte completa isolam os arquivos para que grafos de módulos retidos e pausas de GC de arquivos anteriores não sejam atribuídos a asserções posteriores; passe `-- --no-isolate` somente ao perfilar intencionalmente o acúmulo em workers compartilhados. O Agente de Desempenho de Testes usa isso como linha de base antes de tentar corrigir testes lentos. `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` compara relatórios agrupados após uma alteração voltada ao desempenho.
- Execuções fragmentadas completas, de extensões e por padrão de inclusão atualizam os dados locais de tempo em `.artifacts/vitest-shard-timings.json`; execuções completas posteriores da configuração usam esses tempos para equilibrar fragmentos lentos e rápidos. Os fragmentos de CI por padrão de inclusão acrescentam o nome do fragmento à chave de tempo, mantendo visíveis os tempos dos fragmentos filtrados sem substituir os dados de tempo da configuração completa. Defina `OPENCLAW_TEST_PROJECTS_TIMINGS=0` para ignorar o artefato local de tempos.

## Benchmarks

<Accordion title="Latência do modelo (scripts/bench-model.ts)">

```bash
pnpm tsx scripts/bench-model.ts --runs 10
```

Variáveis de ambiente opcionais: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`. Prompt padrão: "Responda com uma única palavra: ok. Sem pontuação nem texto adicional."

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

Saída salva: `pnpm test:startup:bench:smoke` grava `.artifacts/cli-startup-bench-smoke.json`; `pnpm test:startup:bench:save` grava `.artifacts/cli-startup-bench-all.json` (`runs=5 warmup=1`). Fixture versionada: `test/fixtures/cli-startup-bench.json`, atualizada por `pnpm test:startup:bench:update` e comparada por `pnpm test:startup:bench:check`.

</Accordion>

<Accordion title="Inicialização do Gateway (scripts/bench-gateway-startup.ts)">

Por padrão, usa o ponto de entrada compilado da CLI em `dist/entry.js`; execute `pnpm build` primeiro. Passe `--entry scripts/run-node.mjs` para medir o executor do código-fonte em vez disso e mantenha esses resultados separados das linhas de base do ponto de entrada compilado.

```bash
pnpm test:startup:gateway -- --runs 5 --warmup 1
pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5
node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json
```

IDs dos casos: `default`, `skipChannels` (inicialização dos canais ignorada), `oneInternalHook`, `allInternalHooks`, `fiftyPlugins` (50 plugins de manifesto), `fiftyStartupLazyPlugins` (50 plugins de manifesto com inicialização sob demanda).

A saída inclui a primeira saída do processo, `/healthz`, `/readyz`, tempo do log de escuta HTTP, tempo do log de prontidão do Gateway, tempo de CPU, proporção de núcleos de CPU, RSS máximo, heap, métricas de rastreamento da inicialização, atraso do loop de eventos e métricas detalhadas da tabela de consulta de plugins. O script define `OPENCLAW_GATEWAY_STARTUP_TRACE=1` no ambiente do Gateway filho.

`/healthz` indica atividade (o servidor HTTP consegue responder). `/readyz` indica prontidão para uso (processos auxiliares de plugins de inicialização, canais e trabalho pós-anexação crítico para a prontidão foram concluídos). Hooks de inicialização são despachados de forma assíncrona e não fazem parte da garantia de prontidão. O tempo do log de prontidão é o carimbo de data/hora interno do Gateway, útil para atribuição no lado do processo, mas não substitui a sondagem externa de `/readyz`.

Use a saída JSON ou `--output` ao comparar alterações. Use `--cpu-prof-dir` somente depois que a saída de rastreamento apontar para trabalho de importação, compilação ou uso intensivo de CPU que apenas os tempos das fases não consigam explicar.

</Accordion>

<Accordion title="Reinicialização do Gateway (scripts/bench-gateway-restart.ts)">

Somente macOS e Linux (usa SIGUSR1 para reinicializações dentro do processo; falha imediatamente no Windows). Usa o mesmo ponto de entrada compilado padrão e a mesma substituição por `--entry scripts/run-node.mjs` da inicialização do Gateway descrita acima.

```bash
pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5
pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1
```

IDs dos casos: `skipChannels`, `skipChannelsAcpxProbe` (sondagem de inicialização do ACPX ativada), `skipChannelsNoAcpxProbe` (sondagem desativada), `default`, `fiftyPlugins`.

A saída inclui o próximo `/healthz`, o próximo `/readyz`, tempo de inatividade, tempo de prontidão da reinicialização, CPU, RSS, métricas de rastreamento da inicialização do processo substituto e métricas de rastreamento da reinicialização para tratamento de sinais, drenagem do trabalho ativo, fases de encerramento, próxima inicialização, tempo de prontidão e instantâneos de memória. O script define `OPENCLAW_GATEWAY_STARTUP_TRACE=1` e `OPENCLAW_GATEWAY_RESTART_TRACE=1`.

Use este benchmark quando uma alteração afetar a sinalização de reinicialização, manipuladores de encerramento, inicialização após reinicialização, encerramento de processos auxiliares, transferência de serviço ou prontidão após reinicialização. Comece com `skipChannels` para isolar a mecânica do Gateway da inicialização dos canais; use `default` ou casos com muitos plugins somente depois que o caso restrito explicar o caminho de reinicialização. As métricas de rastreamento são indícios de atribuição, não veredictos — avalie uma alteração de reinicialização com base em várias amostras, no trecho correspondente do proprietário, no comportamento de `/healthz`/`/readyz` e no contrato de reinicialização visível ao usuário.

</Accordion>

## Integração E2E (Docker)

Opcional; necessária somente para testes rápidos de integração em contêineres. Fluxo completo de inicialização a frio em um contêiner Linux limpo:

```bash
scripts/e2e/onboard-docker.sh
```

Controla o assistente interativo por meio de um pseudo-TTY, verifica os arquivos de configuração, espaço de trabalho e sessão, depois inicia o Gateway e executa `openclaw health`.

## Teste rápido de importação de QR (Docker)

Garante que o auxiliar de runtime de QR mantido seja carregado nos runtimes Docker Node compatíveis (Node 24 por padrão, compatível com Node 22):

```bash
pnpm test:docker:qr
```

## Relacionado

- [Testes](/pt-BR/help/testing)
- [Testes em ambiente real](/pt-BR/help/testing-live)
- [Testes de atualizações e plugins](/pt-BR/help/testing-updates-plugins)
