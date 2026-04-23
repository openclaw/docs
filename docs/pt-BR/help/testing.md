---
read_when:
    - Executando testes localmente ou no CI
    - Adicionando testes de regressão para bugs de modelo/provedor
    - Depurando comportamento do Gateway + agente
summary: 'Kit de testes: suítes unit/e2e/live, runners Docker e o que cada teste cobre'
title: Testes
x-i18n:
    generated_at: "2026-04-23T14:03:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe0e9bdea78cba7e512358d2e4d428da04a2071188e74af2d5419d2c85eafe15
    source_path: help/testing.md
    workflow: 15
---

# Testes

O OpenClaw tem três suítes Vitest (unit/integration, e2e, live) e um pequeno conjunto de runners Docker.

Este documento é um guia de “como testamos”:

- O que cada suíte cobre (e o que deliberadamente _não_ cobre)
- Quais comandos executar em fluxos de trabalho comuns (local, antes de enviar, depuração)
- Como os testes live descobrem credenciais e selecionam modelos/provedores
- Como adicionar regressões para problemas reais de modelo/provedor

## Início rápido

Na maioria dos dias:

- Verificação completa (esperada antes de enviar): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Execução local mais rápida da suíte completa em uma máquina folgada: `pnpm test:max`
- Loop direto de watch do Vitest: `pnpm test:watch`
- O direcionamento direto por arquivo agora também encaminha caminhos de extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefira primeiro execuções direcionadas quando estiver iterando sobre uma única falha.
- Site de QA com Docker: `pnpm qa:lab:up`
- Faixa de QA com VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando você altera testes ou quer mais confiança:

- Verificação de cobertura: `pnpm test:coverage`
- Suíte E2E: `pnpm test:e2e`

Ao depurar provedores/modelos reais (exige credenciais reais):

- Suíte live (modelos + sondas de ferramenta/imagem do Gateway): `pnpm test:live`
- Direcionar silenciosamente um arquivo live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Varredura live de modelos em Docker: `pnpm test:docker:live-models`
  - Cobertura de CI: as execuções diárias `OpenClaw Scheduled Live And E2E Checks` e manuais
    `OpenClaw Release Checks` chamam ambas o workflow reutilizável live/E2E com
    `include_live_suites: true`, que inclui jobs separados da matriz live Docker
    fragmentados por provedor.
  - Para novas execuções direcionadas de CI, dispare `OpenClaw Live And E2E Checks (Reusable)`
    com `include_live_suites: true` e `live_models_only: true`.
  - Adicione novos segredos de provedores de alto sinal a `scripts/ci-hydrate-live-auth.sh`
    e também a `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` e seus
    chamadores agendados/de release.
- Verificação de custo Moonshot/Kimi: com `MOONSHOT_API_KEY` definido, execute
  `openclaw models list --provider moonshot --json` e depois execute um
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolado contra `moonshot/kimi-k2.6`. Verifique se o JSON informa Moonshot/K2.6 e se a
  transcrição do assistente armazena `usage.cost` normalizado.

Dica: quando você só precisa de um caso com falha, prefira restringir os testes live pelas variáveis de ambiente de allowlist descritas abaixo.

## Runners específicos de QA

Esses comandos ficam ao lado das suítes principais de teste quando você precisa do realismo do qa-lab:

O CI executa o QA Lab em workflows dedicados. `Parity gate` é executado em PRs correspondentes e
por acionamento manual com provedores simulados. `QA-Lab - All Lanes` é executado à noite em
`main` e por acionamento manual com a verificação de paridade simulada, a faixa Matrix live e a
faixa Telegram live gerenciada por Convex como jobs paralelos. `OpenClaw Release Checks`
executa as mesmas faixas antes da aprovação de release.

- `pnpm openclaw qa suite`
  - Executa cenários de QA respaldados pelo repositório diretamente no host.
  - Executa vários cenários selecionados em paralelo por padrão com workers
    isolados do gateway. `qa-channel` usa concorrência 4 por padrão (limitada pela
    contagem de cenários selecionados). Use `--concurrency <count>` para ajustar a
    contagem de workers, ou `--concurrency 1` para a faixa serial antiga.
  - Sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando
    quiser artefatos sem um código de saída com falha.
  - Oferece suporte aos modos de provedor `live-frontier`, `mock-openai` e `aimock`.
    `aimock` inicia um servidor local de provedor respaldado por AIMock para cobertura experimental
    de fixtures e mocks de protocolo sem substituir a faixa `mock-openai`
    orientada por cenários.
- `pnpm openclaw qa suite --runner multipass`
  - Executa a mesma suíte de QA dentro de uma VM Linux Multipass descartável.
  - Mantém o mesmo comportamento de seleção de cenários de `qa suite` no host.
  - Reutiliza os mesmos sinalizadores de seleção de provedor/modelo de `qa suite`.
  - Execuções live encaminham as entradas compatíveis de autenticação de QA que são práticas para o guest:
    chaves de provedor baseadas em env, o caminho de configuração do provedor live de QA e `CODEX_HOME`
    quando presente.
  - Diretórios de saída devem permanecer sob a raiz do repositório para que o guest possa gravar de volta por meio
    do workspace montado.
  - Grava o relatório + resumo normais de QA mais os logs do Multipass em
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia o site de QA com Docker para trabalho de QA no estilo operador.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Cria um tarball npm a partir do checkout atual, instala-o globalmente no
    Docker, executa onboarding não interativo com chave de API da OpenAI, configura Telegram
    por padrão, verifica se ativar o plugin instala dependências de runtime sob demanda, executa
    doctor e executa um turno local de agente contra um endpoint OpenAI simulado.
  - Use `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para executar a mesma
    faixa de instalação empacotada com Discord.
- `pnpm test:docker:bundled-channel-deps`
  - Empacota e instala a build atual do OpenClaw no Docker, inicia o Gateway
    com OpenAI configurado e então ativa channel/plugins empacotados por meio
    de edições de configuração.
  - Verifica se a descoberta de configuração deixa ausentes as dependências de runtime de plugin não configuradas,
    se a primeira execução configurada do Gateway ou doctor instala sob demanda as dependências de runtime de cada plugin empacotado
    e se uma segunda reinicialização não reinstala dependências
    que já foram ativadas.
  - Também instala uma baseline npm antiga conhecida, ativa Telegram antes de executar
    `openclaw update --tag <candidate>` e verifica se o
    doctor pós-atualização do candidato repara dependências de runtime de canais empacotados sem um reparo pós-instalação do lado do harness.
- `pnpm openclaw qa aimock`
  - Inicia apenas o servidor local de provedor AIMock para testes diretos
    de fumaça do protocolo.
- `pnpm openclaw qa matrix`
  - Executa a faixa de QA Matrix live contra um homeserver Tuwunel respaldado por Docker descartável.
  - Este host de QA hoje é apenas para repositório/desenvolvimento. Instalações empacotadas do OpenClaw não incluem
    `qa-lab`, portanto não expõem `openclaw qa`.
  - Checkouts do repositório carregam o runner empacotado diretamente; nenhuma etapa separada
    de instalação de plugin é necessária.
  - Provisiona três usuários temporários do Matrix (`driver`, `sut`, `observer`) mais uma sala privada, então inicia um processo filho do gateway de QA com o plugin Matrix real como transporte do SUT.
  - Usa por padrão a imagem estável fixada do Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Substitua com `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` quando precisar testar outra imagem.
  - O Matrix não expõe sinalizadores compartilhados de origem de credenciais porque a faixa provisiona usuários descartáveis localmente.
  - Grava um relatório de QA Matrix, resumo, artefato de eventos observados e log combinado de saída stdout/stderr em `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Executa a faixa de QA Telegram live contra um grupo privado real usando os tokens de bot do driver e do SUT vindos do env.
  - Exige `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. O id do grupo deve ser o id numérico do chat do Telegram.
  - Oferece suporte a `--credential-source convex` para credenciais compartilhadas em pool. Use o modo env por padrão, ou defina `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por leases em pool.
  - Sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando
    quiser artefatos sem um código de saída com falha.
  - Exige dois bots distintos no mesmo grupo privado, com o bot SUT expondo um nome de usuário do Telegram.
  - Para observação estável de bot para bot, ative Bot-to-Bot Communication Mode em `@BotFather` para ambos os bots e garanta que o bot driver consiga observar o tráfego de bots no grupo.
  - Grava um relatório de QA Telegram, resumo e artefato de mensagens observadas em `.artifacts/qa-e2e/...`. Cenários de resposta incluem RTT desde a solicitação de envio do driver até a resposta observada do SUT.

As faixas de transporte live compartilham um contrato padrão para que novos transportes não sofram desvio:

`qa-channel` continua sendo a suíte ampla de QA sintética e não faz parte da matriz de cobertura de transporte live.

| Faixa    | Canary | Exigência de menção | Bloqueio por allowlist | Resposta de nível superior | Retomada após reinício | Acompanhamento em thread | Isolamento de thread | Observação de reação | Comando de ajuda |
| -------- | ------ | ------------------- | ---------------------- | -------------------------- | ---------------------- | ------------------------ | -------------------- | -------------------- | ---------------- |
| Matrix   | x      | x                   | x                      | x                          | x                      | x                        | x                    | x                    |                  |
| Telegram | x      |                     |                        |                            |                        |                          |                      |                      | x                |

### Credenciais compartilhadas do Telegram via Convex (v1)

Quando `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) está ativado para
`openclaw qa telegram`, o QA lab adquire um lease exclusivo de um pool respaldado por Convex, envia Heartbeat
desse lease enquanto a faixa está em execução e libera o lease no encerramento.

Estrutura de projeto Convex de referência:

- `qa/convex-credential-broker/`

Variáveis de ambiente obrigatórias:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por exemplo `https://your-deployment.convex.site`)
- Um segredo para a função selecionada:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Seleção da função de credencial:
  - CLI: `--credential-role maintainer|ci`
  - Padrão por env: `OPENCLAW_QA_CREDENTIAL_ROLE` (o padrão é `ci` no CI, `maintainer` caso contrário)

Variáveis de ambiente opcionais:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (padrão `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (padrão `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (padrão `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (padrão `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (padrão `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de rastreamento opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URLs Convex `http://` de loopback para desenvolvimento somente local.

`OPENCLAW_QA_CONVEX_SITE_URL` deve usar `https://` em operação normal.

Comandos administrativos de mantenedor (adicionar/remover/listar pool) exigem
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` especificamente.

Helpers de CLI para mantenedores:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Use `--json` para saída legível por máquina em scripts e utilitários de CI.

Contrato de endpoint padrão (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Solicitação: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Sucesso: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Esgotado/tentável novamente: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Solicitação: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Sucesso: `{ status: "ok" }` (ou `2xx` vazio)
- `POST /release`
  - Solicitação: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Sucesso: `{ status: "ok" }` (ou `2xx` vazio)
- `POST /admin/add` (somente segredo de mantenedor)
  - Solicitação: `{ kind, actorId, payload, note?, status? }`
  - Sucesso: `{ status: "ok", credential }`
- `POST /admin/remove` (somente segredo de mantenedor)
  - Solicitação: `{ credentialId, actorId }`
  - Sucesso: `{ status: "ok", changed, credential }`
  - Proteção contra lease ativo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (somente segredo de mantenedor)
  - Solicitação: `{ kind?, status?, includePayload?, limit? }`
  - Sucesso: `{ status: "ok", credentials, count }`

Formato da carga para o tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` deve ser uma string com o id numérico do chat do Telegram.
- `admin/add` valida esse formato para `kind: "telegram"` e rejeita cargas malformadas.

### Adicionar um canal ao QA

Adicionar um canal ao sistema de QA em Markdown exige exatamente duas coisas:

1. Um adaptador de transporte para o canal.
2. Um pacote de cenários que exercite o contrato do canal.

Não adicione uma nova raiz de comando QA de nível superior quando o host compartilhado `qa-lab` puder
ser o responsável pelo fluxo.

`qa-lab` é responsável pela mecânica compartilhada do host:

- a raiz de comando `openclaw qa`
- inicialização e encerramento da suíte
- concorrência de workers
- gravação de artefatos
- geração de relatórios
- execução de cenários
- aliases de compatibilidade para cenários antigos de `qa-channel`

Plugins de runner são responsáveis pelo contrato de transporte:

- como `openclaw qa <runner>` é montado sob a raiz compartilhada `qa`
- como o gateway é configurado para esse transporte
- como a prontidão é verificada
- como eventos de entrada são injetados
- como mensagens de saída são observadas
- como transcrições e o estado normalizado do transporte são expostos
- como ações respaldadas por transporte são executadas
- como reset ou limpeza específicos do transporte são tratados

A barra mínima de adoção para um novo canal é:

1. Manter `qa-lab` como responsável pela raiz compartilhada `qa`.
2. Implementar o runner de transporte na costura compartilhada de host do `qa-lab`.
3. Manter a mecânica específica do transporte dentro do plugin de runner ou do harness do canal.
4. Montar o runner como `openclaw qa <runner>` em vez de registrar uma raiz de comando concorrente.
   Plugins de runner devem declarar `qaRunners` em `openclaw.plugin.json` e exportar um array correspondente `qaRunnerCliRegistrations` de `runtime-api.ts`.
   Mantenha `runtime-api.ts` leve; a CLI lazy e a execução do runner devem ficar atrás de entrypoints separados.
5. Criar ou adaptar cenários em Markdown nos diretórios temáticos `qa/scenarios/`.
6. Usar os helpers genéricos de cenário para novos cenários.
7. Manter aliases de compatibilidade existentes funcionando, a menos que o repositório esteja realizando uma migração intencional.

A regra de decisão é rígida:

- Se o comportamento puder ser expresso uma vez em `qa-lab`, coloque-o em `qa-lab`.
- Se o comportamento depender de um transporte de canal, mantenha-o nesse plugin de runner ou harness de plugin.
- Se um cenário precisar de uma nova capacidade que mais de um canal possa usar, adicione um helper genérico em vez de um branch específico de canal em `suite.ts`.
- Se um comportamento só fizer sentido para um transporte, mantenha o cenário específico do transporte e deixe isso explícito no contrato do cenário.

Nomes preferidos de helpers genéricos para novos cenários são:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Aliases de compatibilidade continuam disponíveis para cenários existentes, incluindo:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Novo trabalho de canal deve usar os nomes genéricos de helper.
Aliases de compatibilidade existem para evitar uma migração em dia D, não como modelo para
autoria de novos cenários.

## Suítes de teste (o que executa onde)

Pense nas suítes como “realismo crescente” (e custo/instabilidade crescentes):

### Unit / integration (padrão)

- Comando: `pnpm test`
- Configuração: execuções não direcionadas usam o conjunto de shards `vitest.full-*.config.ts` e podem expandir shards de vários projetos em configs por projeto para agendamento paralelo
- Arquivos: inventários core/unit em `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` e os testes node permitidos de `ui` cobertos por `vitest.unit.config.ts`
- Escopo:
  - Testes de unidade puros
  - Testes de integração no processo (autenticação do gateway, roteamento, ferramentas, parsing, configuração)
  - Regressões determinísticas para bugs conhecidos
- Expectativas:
  - Executa no CI
  - Não exige chaves reais
  - Deve ser rápido e estável
- Observação sobre projetos:
  - `pnpm test` não direcionado agora executa doze configs menores em shards (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) em vez de um único processo gigante de projeto-raiz nativo. Isso reduz o pico de RSS em máquinas carregadas e evita que trabalho de auto-reply/extension sufoque suítes não relacionadas.
  - `pnpm test --watch` ainda usa o grafo de projetos da raiz nativa `vitest.config.ts`, porque um loop de watch com vários shards não é prático.
  - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` encaminham primeiro destinos explícitos de arquivo/diretório por faixas com escopo, então `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar o custo total de inicialização do projeto-raiz.
  - `pnpm test:changed` expande caminhos git alterados nas mesmas faixas com escopo quando o diff toca apenas arquivos de origem/teste roteáveis; edições de config/setup ainda usam fallback para a reexecução ampla do projeto-raiz.
  - `pnpm check:changed` é a verificação local inteligente normal para trabalho restrito. Ela classifica o diff em core, testes core, extensions, testes de extension, apps, docs, metadados de release e tooling, e então executa as faixas correspondentes de typecheck/lint/teste. Mudanças no SDK público de Plugin e no contrato de plugin incluem validação de extensions porque as extensions dependem desses contratos centrais. Aumentos de versão apenas em metadados de release executam verificações direcionadas de versão/config/dependência-raiz em vez da suíte completa, com uma proteção que rejeita mudanças de pacote fora do campo de versão de nível superior.
  - Testes de unidade leves de importação vindos de agents, commands, plugins, helpers de auto-reply, `plugin-sdk` e áreas semelhantes de utilitário puro são encaminhados pela faixa `unit-fast`, que ignora `test/setup-openclaw-runtime.ts`; arquivos com estado/runtime pesado permanecem nas faixas existentes.
  - Arquivos helper selecionados de origem em `plugin-sdk` e `commands` também mapeiam execuções em modo de alteração para testes irmãos explícitos nessas faixas leves, de modo que edições em helpers evitem reexecutar toda a suíte pesada desse diretório.
  - `auto-reply` agora tem três buckets dedicados: helpers principais de nível superior, testes de integração `reply.*` de nível superior e a subárvore `src/auto-reply/reply/**`. Isso mantém o trabalho mais pesado do harness de reply fora dos testes baratos de status/chunk/token.
- Observação sobre embedded runner:
  - Quando você altera entradas de descoberta de ferramentas de mensagem ou o contexto de runtime de Compaction,
    mantenha ambos os níveis de cobertura.
  - Adicione regressões focadas de helpers para limites puros de roteamento/normalização.
  - Também mantenha saudáveis as suítes de integração do embedded runner:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Essas suítes verificam se ids com escopo e o comportamento de Compaction continuam fluindo
    pelos caminhos reais `run.ts` / `compact.ts`; testes apenas de helper não são um
    substituto suficiente para esses caminhos de integração.
- Observação sobre pool:
  - A configuração base do Vitest agora usa `threads` por padrão.
  - A configuração compartilhada do Vitest também fixa `isolate: false` e usa o runner não isolado em projetos-raiz, configs e2e e live.
  - A faixa UI da raiz mantém sua configuração `jsdom` e otimizador, mas agora também executa no runner compartilhado não isolado.
  - Cada shard de `pnpm test` herda os mesmos padrões `threads` + `isolate: false` da configuração compartilhada do Vitest.
  - O lançador compartilhado `scripts/run-vitest.mjs` agora também adiciona `--no-maglev` por padrão para processos filhos Node do Vitest a fim de reduzir churn de compilação do V8 durante grandes execuções locais. Defina `OPENCLAW_VITEST_ENABLE_MAGLEV=1` se precisar comparar com o comportamento padrão do V8.
- Observação sobre iteração local rápida:
  - `pnpm changed:lanes` mostra quais faixas arquiteturais um diff aciona.
  - O hook de pre-commit executa `pnpm check:changed --staged` após formatação/lint dos arquivos staged, então commits somente de core não pagam o custo de testes de extension, a menos que toquem contratos públicos voltados a extensions. Commits apenas de metadados de release permanecem na faixa direcionada de versão/config/dependência-raiz.
  - Se o conjunto exato de alterações staged já foi validado com verificações equivalentes ou mais fortes, use `scripts/committer --fast "<message>" <files...>` para ignorar apenas a nova execução do hook de escopo alterado. Formatação/lint staged ainda executam. Mencione as verificações concluídas na sua passagem. Isso também é aceitável após uma falha instável isolada do hook ser reexecutada e passar com prova de escopo.
  - `pnpm test:changed` encaminha por faixas com escopo quando os caminhos alterados mapeiam claramente para uma suíte menor.
  - `pnpm test:max` e `pnpm test:changed:max` mantêm o mesmo comportamento de roteamento, apenas com um limite maior de workers.
  - A autoescala local de workers agora é intencionalmente conservadora e também reduz quando a média de carga do host já está alta, então várias execuções simultâneas do Vitest causam menos danos por padrão.
  - A configuração base do Vitest marca os arquivos de projetos/config como `forceRerunTriggers` para que reexecuções em modo de alteração permaneçam corretas quando o encadeamento de testes muda.
  - A configuração mantém `OPENCLAW_VITEST_FS_MODULE_CACHE` ativado em hosts compatíveis; defina `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se quiser um local explícito de cache para profiling direto.
- Observação sobre depuração de desempenho:
  - `pnpm test:perf:imports` ativa relatórios de duração de importação do Vitest mais saída de detalhamento de importações.
  - `pnpm test:perf:imports:changed` aplica o mesmo profiling com escopo aos arquivos alterados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compara `test:changed` roteado com o caminho nativo do projeto-raiz para esse diff commitado e imprime tempo total mais RSS máximo no macOS.
- `pnpm test:perf:changed:bench -- --worktree` mede a árvore suja atual roteando a lista de arquivos alterados por `scripts/test-projects.mjs` e pela configuração raiz do Vitest.
  - `pnpm test:perf:profile:main` grava um perfil de CPU da thread principal para sobrecarga de inicialização e transformação do Vitest/Vite.
  - `pnpm test:perf:profile:runner` grava perfis de CPU+heap do runner para a suíte unit com paralelismo de arquivo desativado.

### Estabilidade (gateway)

- Comando: `pnpm test:stability:gateway`
- Configuração: `vitest.gateway.config.ts`, forçada para um worker
- Escopo:
  - Inicia um Gateway real em loopback com diagnósticos ativados por padrão
  - Conduz churn sintético de mensagem, memória e carga grande do gateway pelo caminho de evento de diagnóstico
  - Consulta `diagnostics.stability` pelo RPC WS do Gateway
  - Cobre helpers de persistência de bundle de estabilidade de diagnóstico
  - Afirma que o registrador permanece limitado, amostras sintéticas de RSS ficam abaixo do orçamento de pressão e profundidades de fila por sessão drenam de volta para zero
- Expectativas:
  - Seguro para CI e sem chaves
  - Faixa estreita para acompanhamento de regressões de estabilidade, não substitui a suíte completa do Gateway

### E2E (smoke do gateway)

- Comando: `pnpm test:e2e`
- Configuração: `vitest.e2e.config.ts`
- Arquivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` e testes E2E de plugins empacotados em `extensions/`
- Padrões de runtime:
  - Usa `threads` do Vitest com `isolate: false`, correspondendo ao restante do repositório.
  - Usa workers adaptativos (CI: até 2, local: 1 por padrão).
  - Executa em modo silencioso por padrão para reduzir overhead de E/S no console.
- Substituições úteis:
  - `OPENCLAW_E2E_WORKERS=<n>` para forçar a contagem de workers (limitada a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para reativar saída detalhada no console.
- Escopo:
  - Comportamento end-to-end do gateway com várias instâncias
  - Superfícies WebSocket/HTTP, pareamento de Node e rede mais pesada
- Expectativas:
  - Executa no CI (quando ativado no pipeline)
  - Não exige chaves reais
  - Mais partes móveis que testes unitários (pode ser mais lento)

### E2E: smoke do backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- Arquivo: `extensions/openshell/src/backend.e2e.test.ts`
- Escopo:
  - Inicia um Gateway OpenShell isolado no host via Docker
  - Cria um sandbox a partir de um Dockerfile local temporário
  - Exercita o backend OpenShell do OpenClaw sobre `sandbox ssh-config` + execução SSH reais
  - Verifica o comportamento canônico remoto do sistema de arquivos por meio da bridge fs do sandbox
- Expectativas:
  - Somente por adesão explícita; não faz parte da execução padrão de `pnpm test:e2e`
  - Exige uma CLI local `openshell` mais um daemon Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` isolados e então destrói o gateway e sandbox de teste
- Substituições úteis:
  - `OPENCLAW_E2E_OPENSHELL=1` para ativar o teste ao executar manualmente a suíte e2e mais ampla
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apontar para um binário CLI não padrão ou script wrapper

### Live (provedores reais + modelos reais)

- Comando: `pnpm test:live`
- Configuração: `vitest.live.config.ts`
- Arquivos: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` e testes live de plugins empacotados em `extensions/`
- Padrão: **ativado** por `pnpm test:live` (define `OPENCLAW_LIVE_TEST=1`)
- Escopo:
  - “Esse provedor/modelo realmente funciona _hoje_ com credenciais reais?”
  - Detecta mudanças de formato de provedor, peculiaridades de tool-calling, problemas de autenticação e comportamento de limite de taxa
- Expectativas:
  - Não é estável em CI por definição (redes reais, políticas reais de provedores, cotas, indisponibilidades)
  - Custa dinheiro / consome limites de taxa
  - Prefira executar subconjuntos restritos em vez de “tudo”
- Execuções live obtêm `~/.profile` para captar chaves de API ausentes.
- Por padrão, execuções live ainda isolam `HOME` e copiam material de config/autenticação para uma home temporária de teste para que fixtures unit não mutem seu `~/.openclaw` real.
- Defina `OPENCLAW_LIVE_USE_REAL_HOME=1` apenas quando você intencionalmente precisar que testes live usem seu diretório home real.
- `pnpm test:live` agora usa por padrão um modo mais silencioso: mantém a saída de progresso `[live] ...`, mas suprime o aviso extra de `~/.profile` e silencia logs de bootstrap do gateway/ruído de Bonjour. Defina `OPENCLAW_LIVE_TEST_QUIET=0` se quiser os logs completos de inicialização de volta.
- Rotação de chave de API (específica do provedor): defina `*_API_KEYS` com formato separado por vírgula/ponto e vírgula ou `*_API_KEY_1`, `*_API_KEY_2` (por exemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou substituição por live via `OPENCLAW_LIVE_*_KEY`; os testes tentam novamente em respostas de limite de taxa.
- Saída de progresso/Heartbeat:
  - As suítes live agora emitem linhas de progresso em stderr para que chamadas longas de provedor mostrem atividade visível mesmo quando a captura de console do Vitest estiver silenciosa.
  - `vitest.live.config.ts` desativa a interceptação de console do Vitest para que linhas de progresso de provedor/gateway sejam transmitidas imediatamente durante execuções live.
  - Ajuste Heartbeat de modelo direto com `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajuste Heartbeat de gateway/sonda com `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Qual suíte devo executar?

Use esta tabela de decisão:

- Editando lógica/testes: execute `pnpm test` (e `pnpm test:coverage` se você mudou muita coisa)
- Tocando rede do gateway / protocolo WS / pareamento: adicione `pnpm test:e2e`
- Depurando “meu bot caiu” / falhas específicas de provedor / tool calling: execute um `pnpm test:live` restrito

## Live: varredura de capacidades de Node Android

- Teste: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Objetivo: invocar **todos os comandos atualmente anunciados** por um Node Android conectado e afirmar o comportamento do contrato de comando.
- Escopo:
  - Configuração manual/pré-condicionada (a suíte não instala/executa/pareia o app).
  - Validação `node.invoke` do gateway comando por comando para o Node Android selecionado.
- Pré-configuração obrigatória:
  - App Android já conectado + pareado ao gateway.
  - App mantido em primeiro plano.
  - Permissões/consentimento de captura concedidos para capacidades que você espera que passem.
- Substituições de destino opcionais:
  - `OPENCLAW_ANDROID_NODE_ID` ou `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detalhes completos de configuração do Android: [App Android](/pt-BR/platforms/android)

## Live: smoke de modelo (chaves de perfil)

Os testes live são divididos em duas camadas para que possamos isolar falhas:

- “Modelo direto” nos diz se o provedor/modelo consegue responder com a chave dada.
- “Smoke do gateway” nos diz se o pipeline completo gateway+agent funciona para esse modelo (sessões, histórico, ferramentas, política de sandbox etc.).

### Camada 1: conclusão direta de modelo (sem gateway)

- Teste: `src/agents/models.profiles.live.test.ts`
- Objetivo:
  - Enumerar modelos descobertos
  - Usar `getApiKeyForModel` para selecionar modelos para os quais você tem credenciais
  - Executar uma pequena conclusão por modelo (e regressões direcionadas quando necessário)
- Como ativar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se invocar Vitest diretamente)
- Defina `OPENCLAW_LIVE_MODELS=modern` (ou `all`, alias para modern) para realmente executar esta suíte; caso contrário ela é ignorada para manter `pnpm test:live` focado no smoke do gateway
- Como selecionar modelos:
  - `OPENCLAW_LIVE_MODELS=modern` para executar a allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` é um alias para a allowlist moderna
  - ou `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist separada por vírgulas)
  - Varreduras modern/all usam por padrão um limite curado de alto sinal; defina `OPENCLAW_LIVE_MAX_MODELS=0` para uma varredura moderna exaustiva ou um número positivo para um limite menor.
- Como selecionar provedores:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist separada por vírgulas)
- De onde vêm as chaves:
  - Por padrão: armazenamento de perfil e fallbacks de env
  - Defina `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para impor **somente armazenamento de perfil**
- Por que isso existe:
  - Separa “a API do provedor está quebrada / a chave é inválida” de “o pipeline do agente do gateway está quebrado”
  - Contém regressões pequenas e isoladas (exemplo: replay de raciocínio do OpenAI Responses/Codex Responses + fluxos de tool-call)

### Camada 2: smoke de Gateway + agente dev (o que `@openclaw` realmente faz)

- Teste: `src/gateway/gateway-models.profiles.live.test.ts`
- Objetivo:
  - Subir um gateway no processo
  - Criar/aplicar patch em uma sessão `agent:dev:*` (substituição de modelo por execução)
  - Iterar modelos com chaves e afirmar:
    - resposta “significativa” (sem ferramentas)
    - uma invocação real de ferramenta funciona (sonda de leitura)
    - sondas extras opcionais de ferramenta (exec+read probe)
    - caminhos de regressão OpenAI (somente tool-call → acompanhamento) continuam funcionando
- Detalhes das sondas (para que você possa explicar falhas rapidamente):
  - sonda `read`: o teste grava um arquivo nonce no workspace e pede que o agente o `read` e devolva o nonce.
  - sonda `exec+read`: o teste pede que o agente grave um nonce em um arquivo temporário com `exec` e depois o `read` de volta.
  - sonda de imagem: o teste anexa um PNG gerado (gato + código aleatório) e espera que o modelo retorne `cat <CODE>`.
  - Referência de implementação: `src/gateway/gateway-models.profiles.live.test.ts` e `src/gateway/live-image-probe.ts`.
- Como ativar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se invocar Vitest diretamente)
- Como selecionar modelos:
  - Padrão: allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` é um alias para a allowlist moderna
  - Ou defina `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (ou lista separada por vírgulas) para restringir
  - Varreduras modern/all do gateway usam por padrão um limite curado de alto sinal; defina `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` para uma varredura moderna exaustiva ou um número positivo para um limite menor.
- Como selecionar provedores (evitar “tudo via OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist separada por vírgulas)
- Sondas de ferramenta + imagem estão sempre ativadas neste teste live:
  - sonda `read` + sonda `exec+read` (estresse de ferramenta)
  - sonda de imagem executa quando o modelo anuncia suporte a entrada de imagem
  - Fluxo (alto nível):
    - O teste gera um PNG minúsculo com “CAT” + código aleatório (`src/gateway/live-image-probe.ts`)
    - Envia via `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - O Gateway faz parsing dos anexos em `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - O agente embutido encaminha uma mensagem multimodal do usuário para o modelo
    - Afirmação: a resposta contém `cat` + o código (tolerância de OCR: pequenos erros são permitidos)

Dica: para ver o que você pode testar na sua máquina (e os ids exatos `provider/model`), execute:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke de backend CLI (Claude, Codex, Gemini ou outras CLIs locais)

- Teste: `src/gateway/gateway-cli-backend.live.test.ts`
- Objetivo: validar o pipeline Gateway + agente usando um backend CLI local, sem tocar na sua configuração padrão.
- Padrões de smoke específicos do backend ficam na definição `cli-backend.ts` da extension proprietária.
- Ativar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se invocar Vitest diretamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Padrões:
  - Provedor/modelo padrão: `claude-cli/claude-sonnet-4-6`
  - Comportamento de comando/args/imagem vem dos metadados do plugin proprietário do backend CLI.
- Substituições opcionais:
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` para enviar um anexo de imagem real (os caminhos são injetados no prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` para passar caminhos de arquivo de imagem como args da CLI em vez de injeção no prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (ou `"list"`) para controlar como args de imagem são passados quando `IMAGE_ARG` está definido.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` para enviar um segundo turno e validar o fluxo de retomada.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` para desativar a sonda padrão de continuidade na mesma sessão Claude Sonnet -> Opus (defina `1` para forçá-la quando o modelo selecionado oferecer suporte a um alvo de troca).

Exemplo:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Receita Docker:

```bash
pnpm test:docker:live-cli-backend
```

Receitas Docker de provedor único:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Observações:

- O runner Docker fica em `scripts/test-live-cli-backend-docker.sh`.
- Ele executa o smoke live do backend CLI dentro da imagem Docker do repositório como o usuário não root `node`.
- Resolve metadados de smoke da CLI a partir da extension proprietária e então instala o pacote CLI Linux correspondente (`@anthropic-ai/claude-code`, `@openai/codex` ou `@google/gemini-cli`) em um prefixo gravável com cache em `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (padrão: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` exige OAuth portátil de assinatura do Claude Code por meio de `~/.claude/.credentials.json` com `claudeAiOauth.subscriptionType` ou `CLAUDE_CODE_OAUTH_TOKEN` de `claude setup-token`. Primeiro ele comprova `claude -p` direto no Docker e depois executa dois turnos do backend CLI do Gateway sem preservar variáveis de ambiente de chave de API da Anthropic. Essa faixa de assinatura desativa por padrão as sondas Claude MCP/tool e imagem porque o Claude atualmente roteia uso de apps de terceiros por cobrança de uso extra em vez dos limites normais do plano de assinatura.
- O smoke live do backend CLI agora exercita o mesmo fluxo end-to-end para Claude, Codex e Gemini: turno de texto, turno de classificação de imagem e depois chamada de ferramenta MCP `cron` verificada pela CLI do gateway.
- O smoke padrão do Claude também aplica patch na sessão de Sonnet para Opus e verifica que a sessão retomada ainda se lembra de uma anotação anterior.

## Live: smoke de vinculação ACP (`/acp spawn ... --bind here`)

- Teste: `src/gateway/gateway-acp-bind.live.test.ts`
- Objetivo: validar o fluxo real de vinculação de conversa ACP com um agente ACP live:
  - enviar `/acp spawn <agent> --bind here`
  - vincular no local uma conversa sintética de canal de mensagem
  - enviar um acompanhamento normal nessa mesma conversa
  - verificar se o acompanhamento chega à transcrição da sessão ACP vinculada
- Ativar:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Padrões:
  - Agentes ACP no Docker: `claude,codex,gemini`
  - Agente ACP para `pnpm test:live ...` direto: `claude`
  - Canal sintético: contexto de conversa no estilo DM do Slack
  - Backend ACP: `acpx`
- Substituições:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.4`
- Observações:
  - Essa faixa usa a superfície `chat.send` do gateway com campos sintéticos de rota de origem somente para admin para que os testes possam anexar contexto de canal de mensagem sem fingir entrega externa.
  - Quando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` não está definido, o teste usa o registro integrado de agentes do plugin embutido `acpx` para o agente de harness ACP selecionado.

Exemplo:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Receita Docker:

```bash
pnpm test:docker:live-acp-bind
```

Receitas Docker de agente único:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Observações do Docker:

- O runner Docker fica em `scripts/test-live-acp-bind-docker.sh`.
- Por padrão, ele executa o smoke de vinculação ACP contra todos os agentes CLI live compatíveis em sequência: `claude`, `codex` e depois `gemini`.
- Use `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` ou `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` para restringir a matriz.
- Ele obtém `~/.profile`, prepara o material de autenticação CLI correspondente no contêiner, instala `acpx` em um prefixo npm gravável e então instala a CLI live solicitada (`@anthropic-ai/claude-code`, `@openai/codex` ou `@google/gemini-cli`) se estiver ausente.
- Dentro do Docker, o runner define `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` para que o acpx mantenha disponíveis para a CLI filha do harness as variáveis de ambiente do provedor vindas do profile carregado.

## Live: smoke do harness de app-server do Codex

- Objetivo: validar o harness do Codex controlado pelo plugin por meio do método normal
  `agent` do gateway:
  - carregar o plugin empacotado `codex`
  - selecionar `OPENCLAW_AGENT_RUNTIME=codex`
  - enviar um primeiro turno de agente do gateway para `codex/gpt-5.4`
  - enviar um segundo turno para a mesma sessão OpenClaw e verificar se a thread
    do app-server pode ser retomada
  - executar `/codex status` e `/codex models` pelo mesmo caminho de comando
    do gateway
  - opcionalmente executar duas sondas de shell elevadas revisadas pelo Guardian: um
    comando benigno que deve ser aprovado e um upload de segredo falso que deve ser
    negado para que o agente pergunte de volta
- Teste: `src/gateway/gateway-codex-harness.live.test.ts`
- Ativar: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modelo padrão: `codex/gpt-5.4`
- Sonda opcional de imagem: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sonda opcional de MCP/tool: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Sonda opcional do Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- O smoke define `OPENCLAW_AGENT_HARNESS_FALLBACK=none` para que um harness
  quebrado do Codex não passe por fallback silencioso para PI.
- Autenticação: `OPENAI_API_KEY` do shell/profile, mais `~/.codex/auth.json` e `~/.codex/config.toml`
  copiados opcionalmente

Receita local:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Receita Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Observações do Docker:

- O runner Docker fica em `scripts/test-live-codex-harness-docker.sh`.
- Ele obtém o `~/.profile` montado, passa `OPENAI_API_KEY`, copia arquivos de autenticação da CLI Codex
  quando presentes, instala `@openai/codex` em um prefixo npm montado e gravável,
  prepara a árvore de origem e então executa apenas o teste live do harness Codex.
- O Docker ativa por padrão as sondas de imagem, MCP/tool e Guardian. Defina
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` ou
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` ou
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` quando precisar de uma execução
  de depuração mais restrita.
- O Docker também exporta `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, correspondendo à configuração do
  teste live para que fallback de `openai-codex/*` ou PI não esconda uma regressão
  do harness Codex.

### Receitas live recomendadas

Allowlists restritas e explícitas são mais rápidas e menos instáveis:

- Modelo único, direto (sem gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modelo único, smoke do gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool calling em vários provedores:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Foco em Google (chave de API Gemini + Antigravity):
  - Gemini (chave de API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Observações:

- `google/...` usa a API Gemini (chave de API).
- `google-antigravity/...` usa a bridge OAuth Antigravity (endpoint de agente no estilo Cloud Code Assist).
- `google-gemini-cli/...` usa a CLI Gemini local na sua máquina (autenticação separada + peculiaridades de ferramentas).
- API Gemini vs CLI Gemini:
  - API: o OpenClaw chama a API Gemini hospedada do Google por HTTP (autenticação por chave de API / profile); é isso que a maioria dos usuários quer dizer com “Gemini”.
  - CLI: o OpenClaw executa um binário `gemini` local; ele tem sua própria autenticação e pode se comportar de forma diferente (streaming/suporte a ferramentas/desvio de versão).

## Live: matriz de modelos (o que cobrimos)

Não há uma “lista fixa de modelos de CI” (live é opt-in), mas estes são os modelos **recomendados** para cobrir regularmente em uma máquina de desenvolvimento com chaves.

### Conjunto smoke moderno (tool calling + imagem)

Esta é a execução de “modelos comuns” que esperamos manter funcionando:

- OpenAI (não Codex): `openai/gpt-5.4` (opcional: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` e `google/gemini-3-flash-preview` (evite modelos antigos Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` e `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Execute o smoke do gateway com ferramentas + imagem:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: tool calling (Read + Exec opcional)

Escolha pelo menos um por família de provedores:

- OpenAI: `openai/gpt-5.4` (ou `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (ou `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Cobertura adicional opcional (bom ter):

- xAI: `xai/grok-4` (ou a mais recente disponível)
- Mistral: `mistral/`… (escolha um modelo com suporte a ferramentas que você tenha ativado)
- Cerebras: `cerebras/`… (se você tiver acesso)
- LM Studio: `lmstudio/`… (local; tool calling depende do modo da API)

### Visão: envio de imagem (anexo → mensagem multimodal)

Inclua pelo menos um modelo compatível com imagem em `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/variantes do OpenAI com suporte a visão etc.) para exercitar a sonda de imagem.

### Agregadores / gateways alternativos

Se você tiver chaves ativadas, também oferecemos suporte a testes via:

- OpenRouter: `openrouter/...` (centenas de modelos; use `openclaw models scan` para encontrar candidatos com suporte a ferramentas + imagem)
- OpenCode: `opencode/...` para Zen e `opencode-go/...` para Go (autenticação via `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Mais provedores que você pode incluir na matriz live (se tiver credenciais/configuração):

- Integrados: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Via `models.providers` (endpoints personalizados): `minimax` (nuvem/API), mais qualquer proxy compatível com OpenAI/Anthropic (LM Studio, vLLM, LiteLLM etc.)

Dica: não tente codificar “todos os modelos” na documentação. A lista autoritativa é o que `discoverModels(...)` retorna na sua máquina + quaisquer chaves disponíveis.

## Credenciais (nunca faça commit)

Os testes live descobrem credenciais da mesma forma que a CLI. Implicações práticas:

- Se a CLI funciona, os testes live devem encontrar as mesmas chaves.
- Se um teste live disser “sem credenciais”, depure da mesma forma que você depuraria `openclaw models list` / seleção de modelo.

- Perfis de autenticação por agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (é isso que “chaves de perfil” significa nos testes live)
- Configuração: `~/.openclaw/openclaw.json` (ou `OPENCLAW_CONFIG_PATH`)
- Diretório de estado legado: `~/.openclaw/credentials/` (copiado para a home live preparada quando presente, mas não é o armazenamento principal de chaves de perfil)
- Execuções live locais copiam por padrão a configuração ativa, arquivos `auth-profiles.json` por agente, `credentials/` legado e diretórios de autenticação CLI externos compatíveis para uma home temporária de teste; homes live preparadas ignoram `workspace/` e `sandboxes/`, e substituições de caminho `agents.*.workspace` / `agentDir` são removidas para que as sondas não toquem seu workspace real do host.

Se você quiser depender de chaves de env (por exemplo, exportadas no seu `~/.profile`), execute os testes locais após `source ~/.profile` ou use os runners Docker abaixo (eles podem montar `~/.profile` no contêiner).

## Deepgram live (transcrição de áudio)

- Teste: `extensions/deepgram/audio.live.test.ts`
- Ativar: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- Teste: `extensions/byteplus/live.test.ts`
- Ativar: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Substituição opcional de modelo: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI live de mídia por workflow

- Teste: `extensions/comfy/comfy.live.test.ts`
- Ativar: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Escopo:
  - Exercita os caminhos empacotados de imagem, vídeo e `music_generate` do comfy
  - Ignora cada capacidade a menos que `models.providers.comfy.<capability>` esteja configurado
  - Útil após alterar envio de workflow do comfy, polling, downloads ou registro do plugin

## Geração de imagem live

- Teste: `test/image-generation.runtime.live.test.ts`
- Comando: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Escopo:
  - Enumera todos os plugins de provedor de geração de imagem registrados
  - Carrega variáveis de ambiente de provedor ausentes do seu shell de login (`~/.profile`) antes da sondagem
  - Usa por padrão chaves de API live/env antes dos perfis de autenticação armazenados, para que chaves de teste desatualizadas em `auth-profiles.json` não escondam credenciais reais do shell
  - Ignora provedores sem autenticação/profile/modelo utilizável
  - Executa as variantes padrão de geração de imagem por meio da capacidade compartilhada de runtime:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Provedores empacotados atualmente cobertos:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `vydra`
  - `xai`
- Restrição opcional:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,xai:default-generate,xai:default-edit"`
- Comportamento opcional de autenticação:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar autenticação do armazenamento de perfil e ignorar substituições somente por env

## Geração de música live

- Teste: `extensions/music-generation-providers.live.test.ts`
- Ativar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Escopo:
  - Exercita o caminho compartilhado de provedores empacotados de geração de música
  - Atualmente cobre Google e MiniMax
  - Carrega variáveis de ambiente de provedor do seu shell de login (`~/.profile`) antes da sondagem
  - Usa por padrão chaves de API live/env antes dos perfis de autenticação armazenados, para que chaves de teste desatualizadas em `auth-profiles.json` não escondam credenciais reais do shell
  - Ignora provedores sem autenticação/profile/modelo utilizável
  - Executa ambos os modos de runtime declarados quando disponíveis:
    - `generate` com entrada apenas por prompt
    - `edit` quando o provedor declara `capabilities.edit.enabled`
  - Cobertura atual da faixa compartilhada:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: arquivo live Comfy separado, não esta varredura compartilhada
- Restrição opcional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Comportamento opcional de autenticação:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar autenticação do armazenamento de perfil e ignorar substituições somente por env

## Geração de vídeo live

- Teste: `extensions/video-generation-providers.live.test.ts`
- Ativar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Escopo:
  - Exercita o caminho compartilhado de provedores empacotados de geração de vídeo
  - Usa por padrão o caminho smoke seguro para release: provedores não FAL, uma solicitação text-to-video por provedor, prompt de lagosta de um segundo e um limite de operação por provedor vindo de `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` por padrão)
  - Ignora FAL por padrão porque a latência de fila do lado do provedor pode dominar o tempo de release; passe `--video-providers fal` ou `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` para executá-lo explicitamente
  - Carrega variáveis de ambiente de provedor do seu shell de login (`~/.profile`) antes da sondagem
  - Usa por padrão chaves de API live/env antes dos perfis de autenticação armazenados, para que chaves de teste desatualizadas em `auth-profiles.json` não escondam credenciais reais do shell
  - Ignora provedores sem autenticação/profile/modelo utilizável
  - Executa apenas `generate` por padrão
  - Defina `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` para também executar modos de transformação declarados quando disponíveis:
    - `imageToVideo` quando o provedor declara `capabilities.imageToVideo.enabled` e o provedor/modelo selecionado aceita entrada local de imagem respaldada por buffer na varredura compartilhada
    - `videoToVideo` quando o provedor declara `capabilities.videoToVideo.enabled` e o provedor/modelo selecionado aceita entrada local de vídeo respaldada por buffer na varredura compartilhada
  - Provedores `imageToVideo` atualmente declarados, mas ignorados na varredura compartilhada:
    - `vydra` porque o `veo3` empacotado é somente texto e o `kling` empacotado exige uma URL remota de imagem
  - Cobertura específica de Vydra por provedor:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - esse arquivo executa `veo3` text-to-video mais uma faixa `kling` que usa por padrão um fixture de URL remota de imagem
  - Cobertura live atual de `videoToVideo`:
    - `runway` somente quando o modelo selecionado é `runway/gen4_aleph`
  - Provedores `videoToVideo` atualmente declarados, mas ignorados na varredura compartilhada:
    - `alibaba`, `qwen`, `xai` porque esses caminhos atualmente exigem URLs de referência remotas `http(s)` / MP4
    - `google` porque a faixa compartilhada atual Gemini/Veo usa entrada local respaldada por buffer e esse caminho não é aceito na varredura compartilhada
    - `openai` porque a faixa compartilhada atual não tem garantias de acesso específico por organização para inpaint/remix de vídeo
- Restrição opcional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` para incluir todos os provedores na varredura padrão, incluindo FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` para reduzir o limite de operação de cada provedor em uma execução smoke mais agressiva
- Comportamento opcional de autenticação:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar autenticação do armazenamento de perfil e ignorar substituições somente por env

## Harness live de mídia

- Comando: `pnpm test:live:media`
- Objetivo:
  - Executa as suítes live compartilhadas de imagem, música e vídeo por um único entrypoint nativo do repositório
  - Carrega automaticamente variáveis de ambiente de provedor ausentes de `~/.profile`
  - Restringe automaticamente por padrão cada suíte aos provedores que atualmente têm autenticação utilizável
  - Reutiliza `scripts/test-live.mjs`, para que o comportamento de Heartbeat e modo silencioso permaneça consistente
- Exemplos:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Runners Docker (verificações opcionais “funciona em Linux”)

Esses runners Docker são divididos em dois grupos:

- Runners live-model: `test:docker:live-models` e `test:docker:live-gateway` executam apenas seu arquivo live correspondente de chaves de perfil dentro da imagem Docker do repositório (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando seu diretório local de configuração e workspace (e obtendo `~/.profile` se montado). Os entrypoints locais correspondentes são `test:live:models-profiles` e `test:live:gateway-profiles`.
- Runners Docker live usam por padrão um limite smoke menor para que uma varredura Docker completa permaneça prática:
  `test:docker:live-models` usa por padrão `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa por padrão `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Substitua essas variáveis de ambiente quando
  quiser explicitamente a varredura maior e exaustiva.
- `test:docker:all` constrói a imagem Docker live uma vez via `test:docker:live-build` e depois a reutiliza para as duas faixas live Docker. Também constrói uma imagem compartilhada `scripts/e2e/Dockerfile` via `test:docker:e2e-build` e a reutiliza para os runners smoke E2E em contêiner que exercitam o app compilado.
- Runners smoke de contêiner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` e `test:docker:config-reload` iniciam um ou mais contêineres reais e verificam caminhos de integração de nível superior.

Os runners Docker live-model também fazem bind-mount apenas das homes de autenticação CLI necessárias (ou de todas as compatíveis quando a execução não está restrita) e então as copiam para a home do contêiner antes da execução, para que OAuth de CLI externa possa atualizar tokens sem modificar o armazenamento de autenticação do host:

- Modelos diretos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke de vinculação ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`)
- Smoke de backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke do harness de app-server Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live do Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Assistente de onboarding (TTY, estrutura completa): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke de onboarding/canal/agente por tarball npm: `pnpm test:docker:npm-onboard-channel-agent` instala globalmente no Docker o tarball empacotado do OpenClaw, configura OpenAI por onboarding com referência de env e Telegram por padrão, verifica que ativar o plugin instala suas dependências de runtime sob demanda, executa doctor e executa um turno de agente OpenAI simulado. Reuse um tarball pré-compilado com `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignore a recompilação no host com `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ou troque o canal com `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Rede do Gateway (dois contêineres, autenticação WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Regressão mínima de raciocínio OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) executa um servidor OpenAI simulado por meio do Gateway, verifica que `web_search` eleva `reasoning.effort` de `minimal` para `low`, depois força a rejeição do schema do provedor e verifica que o detalhe bruto aparece nos logs do Gateway.
- Bridge de canal MCP (Gateway semeado + bridge stdio + smoke bruto de frame de notificação Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Ferramentas MCP do bundle Pi (servidor MCP stdio real + smoke allow/deny do perfil Pi embutido): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Limpeza MCP de Cron/subagent (Gateway real + teardown de filho MCP stdio após execuções isoladas de cron e subagente one-shot): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke de instalação + alias `/plugin` + semântica de reinício do bundle Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
- Smoke sem alterações de atualização de plugin: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke de metadados de recarga de configuração: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Dependências de runtime de plugin empacotado: `pnpm test:docker:bundled-channel-deps` constrói por padrão uma pequena imagem Docker de runner, compila e empacota o OpenClaw uma vez no host e então monta esse tarball em cada cenário de instalação Linux. Reuse a imagem com `OPENCLAW_SKIP_DOCKER_BUILD=1`, ignore a recompilação no host após uma build local recente com `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` ou aponte para um tarball existente com `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`.
- Restrinja dependências de runtime de plugin empacotado durante a iteração desativando cenários não relacionados, por exemplo:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Para pré-compilar e reutilizar manualmente a imagem compartilhada do app compilado:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Substituições de imagem específicas de suíte, como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, ainda têm prioridade quando definidas. Quando `OPENCLAW_SKIP_DOCKER_BUILD=1` aponta para uma imagem remota compartilhada, os scripts fazem pull dela se ainda não estiver localmente. Os testes Docker de QR e instalador mantêm seus próprios Dockerfiles porque validam comportamento de pacote/instalação, não o runtime compartilhado do app compilado.

Os runners Docker live-model também fazem bind-mount do checkout atual em modo somente leitura e
o preparam em um workdir temporário dentro do contêiner. Isso mantém a imagem de runtime
enxuta e ainda assim executa Vitest exatamente contra sua origem/configuração local.
A etapa de preparação ignora caches locais grandes e saídas locais de build de app como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e diretórios locais de `.build` de app ou
saída do Gradle para que execuções live em Docker não passem minutos copiando
artefatos específicos da máquina.
Eles também definem `OPENCLAW_SKIP_CHANNELS=1` para que sondas live do gateway não iniciem
workers reais de canais Telegram/Discord/etc. dentro do contêiner.
`test:docker:live-models` ainda executa `pnpm test:live`, então passe também
`OPENCLAW_LIVE_GATEWAY_*` quando precisar restringir ou excluir cobertura
live do gateway dessa faixa Docker.
`test:docker:openwebui` é um smoke de compatibilidade de nível superior: ele inicia um
contêiner de gateway do OpenClaw com os endpoints HTTP compatíveis com OpenAI ativados,
inicia um contêiner Open WebUI fixado contra esse gateway, faz login pelo
Open WebUI, verifica se `/api/models` expõe `openclaw/default` e então envia uma
solicitação real de chat pelo proxy `/api/chat/completions` do Open WebUI.
A primeira execução pode ser visivelmente mais lenta porque o Docker talvez precise fazer pull da
imagem do Open WebUI e o Open WebUI talvez precise concluir sua própria configuração de cold start.
Essa faixa espera uma chave de modelo live utilizável, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` por padrão) é a forma principal de fornecê-la em execuções Dockerizadas.
Execuções bem-sucedidas imprimem uma pequena carga JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` é intencionalmente determinístico e não precisa de uma
conta real de Telegram, Discord ou iMessage. Ele inicia um contêiner Gateway
pré-semeado, inicia um segundo contêiner que cria `openclaw mcp serve` e então
verifica descoberta de conversas roteadas, leituras de transcrição, metadados de anexos,
comportamento de fila de eventos live, roteamento de envio de saída e notificações
de estilo Claude sobre canal + permissão pela bridge MCP stdio real. A verificação
de notificação inspeciona diretamente os frames MCP stdio brutos, então o smoke valida o que a
bridge realmente emite, não apenas o que por acaso um SDK específico de cliente expõe.
`test:docker:pi-bundle-mcp-tools` é determinístico e não precisa de uma chave de modelo
live. Ele compila a imagem Docker do repositório, inicia um servidor de sonda MCP stdio real
dentro do contêiner, materializa esse servidor pelo runtime embutido MCP do bundle Pi,
executa a ferramenta e então verifica se `coding` e `messaging` mantêm
ferramentas `bundle-mcp` enquanto `minimal` e `tools.deny: ["bundle-mcp"]` as filtram.
`test:docker:cron-mcp-cleanup` é determinístico e não precisa de uma chave de modelo
live. Ele inicia um Gateway pré-semeado com um servidor de sonda MCP stdio real, executa um
turno isolado de Cron e um turno filho one-shot de `/subagents spawn`, e então verifica
se o processo filho MCP é encerrado após cada execução.

Smoke manual ACP de thread em linguagem natural (não CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantenha este script para fluxos de trabalho de regressão/depuração. Ele pode ser necessário novamente para validação de roteamento de thread ACP, então não o exclua.

Variáveis de ambiente úteis:

- `OPENCLAW_CONFIG_DIR=...` (padrão: `~/.openclaw`) montado em `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (padrão: `~/.openclaw/workspace`) montado em `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (padrão: `~/.profile`) montado em `/home/node/.profile` e obtido antes de executar os testes
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar apenas variáveis de ambiente obtidas de `OPENCLAW_PROFILE_FILE`, usando diretórios temporários de config/workspace e sem mounts externos de autenticação de CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (padrão: `~/.cache/openclaw/docker-cli-tools`) montado em `/home/node/.npm-global` para instalações CLI com cache dentro do Docker
- Diretórios/arquivos de autenticação de CLI externos em `$HOME` são montados em modo somente leitura sob `/host-auth...` e depois copiados para `/home/node/...` antes do início dos testes
  - Diretórios padrão: `.minimax`
  - Arquivos padrão: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Execuções restritas por provedor montam apenas os diretórios/arquivos necessários inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Substitua manualmente com `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` ou uma lista separada por vírgulas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para restringir a execução
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar provedores dentro do contêiner
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar uma imagem `openclaw:local-live` existente em novas execuções que não precisem de recompilação
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para garantir que as credenciais venham do armazenamento de perfil (não de env)
- `OPENCLAW_OPENWEBUI_MODEL=...` para escolher o modelo exposto pelo gateway para o smoke do Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para substituir o prompt de verificação de nonce usado pelo smoke do Open WebUI
- `OPENWEBUI_IMAGE=...` para substituir a tag de imagem fixada do Open WebUI

## Sanidade da documentação

Execute verificações da documentação após edições: `pnpm check:docs`.
Execute a validação completa de âncoras do Mintlify quando também precisar de verificações de títulos na página: `pnpm docs:check-links:anchors`.

## Regressão offline (segura para CI)

Estas são regressões de “pipeline real” sem provedores reais:

- Tool calling do Gateway (OpenAI simulado, gateway real + loop de agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistente do Gateway (WS `wizard.start`/`wizard.next`, grava config + auth imposto): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Avaliações de confiabilidade de agente (skills)

Já temos alguns testes seguros para CI que se comportam como “avaliações de confiabilidade de agente”:

- Tool-calling simulado pelo loop real de gateway + agente (`src/gateway/gateway.test.ts`).
- Fluxos end-to-end do assistente que validam encadeamento de sessão e efeitos de configuração (`src/gateway/gateway.test.ts`).

O que ainda falta para Skills (veja [Skills](/pt-BR/tools/skills)):

- **Tomada de decisão:** quando Skills são listadas no prompt, o agente escolhe a skill certa (ou evita as irrelevantes)?
- **Conformidade:** o agente lê `SKILL.md` antes de usar e segue as etapas/args obrigatórios?
- **Contratos de workflow:** cenários de vários turnos que afirmam ordem de ferramentas, continuidade do histórico da sessão e limites de sandbox.

Avaliações futuras devem permanecer determinísticas primeiro:

- Um runner de cenários usando provedores simulados para afirmar chamadas de ferramenta + ordem, leituras de arquivo de skill e encadeamento de sessão.
- Um pequeno conjunto de cenários focados em skill (usar vs evitar, controle, prompt injection).
- Avaliações live opcionais (opt-in, controladas por env) somente depois que a suíte segura para CI estiver pronta.

## Testes de contrato (formato de plugin e canal)

Testes de contrato verificam se todo plugin e canal registrado está em conformidade com seu
contrato de interface. Eles iteram sobre todos os plugins descobertos e executam uma suíte de
afirmações de formato e comportamento. A faixa unit padrão de `pnpm test`
ignora intencionalmente esses arquivos compartilhados de costura e smoke; execute os comandos de contrato explicitamente
quando tocar superfícies compartilhadas de canal ou provedor.

### Comandos

- Todos os contratos: `pnpm test:contracts`
- Somente contratos de canal: `pnpm test:contracts:channels`
- Somente contratos de provedor: `pnpm test:contracts:plugins`

### Contratos de canal

Localizados em `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Formato básico do plugin (id, nome, capacidades)
- **setup** - Contrato do assistente de configuração
- **session-binding** - Comportamento de vinculação de sessão
- **outbound-payload** - Estrutura da carga de mensagem
- **inbound** - Tratamento de mensagem de entrada
- **actions** - Handlers de ação do canal
- **threading** - Tratamento de ID de thread
- **directory** - API de diretório/lista
- **group-policy** - Aplicação da política de grupo

### Contratos de status do provedor

Localizados em `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondas de status de canal
- **registry** - Formato do registro de plugins

### Contratos de provedor

Localizados em `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato do fluxo de autenticação
- **auth-choice** - Escolha/seleção de autenticação
- **catalog** - API de catálogo de modelos
- **discovery** - Descoberta de plugin
- **loader** - Carregamento de plugin
- **runtime** - Runtime de provedor
- **shape** - Formato/interface do plugin
- **wizard** - Assistente de configuração

### Quando executar

- Após alterar exports ou subpaths do plugin-sdk
- Após adicionar ou modificar um canal ou plugin de provedor
- Após refatorar registro ou descoberta de plugins

Os testes de contrato executam no CI e não exigem chaves de API reais.

## Adicionando regressões (orientação)

Quando você corrige um problema de provedor/modelo descoberto em live:

- Adicione uma regressão segura para CI, se possível (provedor simulado/stub ou capture a transformação exata do formato da solicitação)
- Se for inerentemente somente live (limites de taxa, políticas de autenticação), mantenha o teste live restrito e opt-in por meio de variáveis de ambiente
- Prefira mirar na menor camada que detecta o bug:
  - bug de conversão/replay de solicitação do provedor → teste de modelos diretos
  - bug no pipeline de sessão/histórico/ferramenta do gateway → smoke live do gateway ou teste mock do gateway seguro para CI
- Proteção de travessia de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva um destino amostrado por classe de SecretRef a partir dos metadados do registro (`listSecretTargetRegistryEntries()`) e então afirma que ids exec de segmento de travessia são rejeitados.
  - Se você adicionar uma nova família de destino SecretRef `includeInPlan` em `src/secrets/target-registry-data.ts`, atualize `classifyTargetClass` nesse teste. O teste falha intencionalmente em ids de destino não classificados para que novas classes não possam ser ignoradas silenciosamente.
