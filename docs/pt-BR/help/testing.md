---
read_when:
    - Executando testes localmente ou na CI
    - Adicionando regressões para bugs de modelo/provider
    - Depurando o comportamento do gateway + agente
summary: 'Kit de testes: suítes unit/e2e/live, runners Docker e o que cada teste cobre'
title: Testes
x-i18n:
    generated_at: "2026-04-24T05:56:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b3aa0a785daa5d43dfd2b352cf8c3013c408231c000ff40852bac534211ec54
    source_path: help/testing.md
    workflow: 15
---

O OpenClaw tem três suítes Vitest (unit/integration, e2e, live) e um pequeno conjunto
de runners Docker. Esta documentação é um guia de “como testamos”:

- O que cada suíte cobre (e o que ela deliberadamente _não_ cobre).
- Quais comandos executar para workflows comuns (local, pré-push, depuração).
- Como os testes live descobrem credenciais e selecionam modelos/providers.
- Como adicionar regressões para problemas reais de modelo/provider.

## Início rápido

Na maioria dos dias:

- Gate completo (esperado antes de push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Execução local mais rápida da suíte completa em uma máquina folgada: `pnpm test:max`
- Loop direto de watch do Vitest: `pnpm test:watch`
- O direcionamento direto por arquivo agora também roteia caminhos de extensão/canal: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefira primeiro execuções direcionadas quando estiver iterando sobre uma única falha.
- Site QA com backend Docker: `pnpm qa:lab:up`
- Lane QA com backend Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando você altera testes ou quer confiança extra:

- Gate de cobertura: `pnpm test:coverage`
- Suíte E2E: `pnpm test:e2e`

Ao depurar providers/modelos reais (requer credenciais reais):

- Suíte live (probes de modelos + tools/imagem do gateway): `pnpm test:live`
- Direcionar silenciosamente um único arquivo live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Varredura Docker live de modelos: `pnpm test:docker:live-models`
  - Cada modelo selecionado agora executa um turno de texto mais um probe pequeno no estilo leitura de arquivo.
    Modelos cujos metadados anunciam entrada `image` também executam um pequeno turno de imagem.
    Desabilite os probes extras com `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` ou
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` ao isolar falhas de provider.
  - Cobertura de CI: as execuções diárias `OpenClaw Scheduled Live And E2E Checks` e as manuais
    `OpenClaw Release Checks` chamam o workflow reutilizável live/E2E com
    `include_live_suites: true`, que inclui jobs separados de matriz Docker live de modelos
    fragmentados por provider.
  - Para reruns focados na CI, dispare `OpenClaw Live And E2E Checks (Reusable)`
    com `include_live_suites: true` e `live_models_only: true`.
  - Adicione novos segredos de provider de alto sinal a `scripts/ci-hydrate-live-auth.sh`
    mais `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` e seus
    callers agendados/de release.
- Smoke nativo bound-chat do Codex: `pnpm test:docker:live-codex-bind`
  - Executa uma lane live em Docker contra o caminho app-server do Codex, vincula uma DM sintética
    do Slack com `/codex bind`, exercita `/codex fast` e
    `/codex permissions`, e depois verifica uma resposta simples e um anexo de imagem
    roteados pelo binding nativo do plugin em vez de ACP.
- Smoke de custo Moonshot/Kimi: com `MOONSHOT_API_KEY` definido, execute
  `openclaw models list --provider moonshot --json`, depois execute um
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolado contra `moonshot/kimi-k2.6`. Verifique se o JSON informa Moonshot/K2.6 e se a
  transcrição do assistente armazena `usage.cost` normalizado.

Dica: quando você precisa apenas de um caso com falha, prefira restringir os testes live com as variáveis de ambiente de lista de permissões descritas abaixo.

## Runners específicos de QA

Esses comandos ficam ao lado das suítes principais de teste quando você precisa do realismo do qa-lab:

A CI executa o QA Lab em workflows dedicados. `Parity gate` roda em PRs correspondentes e
a partir de dispatch manual com providers simulados. `QA-Lab - All Lanes` roda nightly em
`main` e a partir de dispatch manual com o mock parity gate, lane Matrix live e
lane Telegram live gerenciada por Convex como jobs paralelos. `OpenClaw Release Checks`
executa as mesmas lanes antes da aprovação da release.

- `pnpm openclaw qa suite`
  - Executa cenários de QA baseados no repositório diretamente no host.
  - Executa vários cenários selecionados em paralelo por padrão com workers
    de gateway isolados. `qa-channel` usa por padrão concorrência 4 (limitada pela
    contagem de cenários selecionados). Use `--concurrency <count>` para ajustar a
    quantidade de workers, ou `--concurrency 1` para a antiga lane serial.
  - Sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando
    quiser artefatos sem uma saída com falha.
  - Oferece suporte aos modos de provider `live-frontier`, `mock-openai` e `aimock`.
    `aimock` inicia um servidor de provider local com backend AIMock para cobertura experimental
    de fixtures e de protocolo simulado sem substituir a lane `mock-openai`
    sensível ao cenário.
- `pnpm openclaw qa suite --runner multipass`
  - Executa a mesma suíte de QA dentro de uma VM Linux descartável do Multipass.
  - Mantém o mesmo comportamento de seleção de cenário de `qa suite` no host.
  - Reutiliza os mesmos flags de seleção de provider/modelo de `qa suite`.
  - Execuções live encaminham as entradas de autenticação de QA compatíveis que são práticas para o guest:
    chaves de provider baseadas em env, o caminho de configuração do provider live de QA e `CODEX_HOME`
    quando presente.
  - Diretórios de saída devem permanecer sob a raiz do repositório para que o guest possa gravar de volta pelo
    workspace montado.
  - Grava o relatório + resumo normais de QA mais logs do Multipass em
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia o site QA com backend Docker para trabalho de QA em estilo operador.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Faz build de um tarball npm a partir do checkout atual, instala-o globalmente em
    Docker, executa onboarding não interativo com chave de API OpenAI, configura Telegram
    por padrão, verifica que habilitar o plugin instala dependências de runtime sob demanda,
    executa doctor e executa um turno local de agente contra um endpoint simulado da OpenAI.
  - Use `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para executar a mesma
    lane de instalação empacotada com Discord.
- `pnpm test:docker:npm-telegram-live`
  - Instala um pacote OpenClaw publicado em Docker, executa onboarding do pacote instalado,
    configura Telegram por meio da CLI instalada e depois reutiliza a
    lane live de QA do Telegram com esse pacote instalado como Gateway SUT.
  - Usa por padrão `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`.
  - Usa as mesmas credenciais Telegram por env ou a mesma fonte de credenciais Convex de
    `pnpm openclaw qa telegram`.
- `pnpm test:docker:bundled-channel-deps`
  - Empacota e instala o build atual do OpenClaw em Docker, inicia o Gateway
    com OpenAI configurado e depois habilita canais/plugins integrados via
    edições de configuração.
  - Verifica que a descoberta da configuração deixa ausentes dependências de runtime de plugin
    não configuradas, que a primeira execução configurada do Gateway ou doctor instala sob demanda
    as dependências de runtime de cada plugin integrado e que um segundo restart não reinstala
    dependências que já foram ativadas.
  - Também instala uma baseline npm antiga conhecida, habilita o Telegram antes de executar
    `openclaw update --tag <candidate>` e verifica que o
    doctor pós-update do candidato repara dependências de runtime de canal integrado sem um
    reparo postinstall no lado do harness.
- `pnpm openclaw qa aimock`
  - Inicia apenas o servidor local de provider AIMock para smoke direto de protocolo.
- `pnpm openclaw qa matrix`
  - Executa a lane QA live do Matrix contra um homeserver Tuwunel descartável com backend Docker.
  - Esse host de QA é apenas para repositório/dev hoje. Instalações empacotadas do OpenClaw não incluem
    `qa-lab`, portanto não expõem `openclaw qa`.
  - Checkouts do repositório carregam o runner integrado diretamente; não é necessária
    nenhuma etapa separada de instalação de plugin.
  - Provisiona três usuários Matrix temporários (`driver`, `sut`, `observer`) mais uma sala privada e depois inicia um processo filho do gateway QA com o plugin Matrix real como transporte SUT.
  - Usa por padrão a imagem estável fixada do Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Substitua com `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` quando precisar testar uma imagem diferente.
  - O Matrix não expõe flags compartilhados de fonte de credenciais porque a lane provisiona usuários descartáveis localmente.
  - Grava um relatório Matrix QA, resumo, artefato de eventos observados e log combinado de stdout/stderr em `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Executa a lane QA live do Telegram contra um grupo privado real usando os tokens do bot driver e do bot SUT vindos do env.
  - Requer `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. O ID do grupo deve ser o ID numérico do chat do Telegram.
  - Oferece suporte a `--credential-source convex` para credenciais compartilhadas em pool. Use o modo env por padrão, ou defina `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por leases compartilhados.
  - Sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando
    quiser artefatos sem uma saída com falha.
  - Requer dois bots distintos no mesmo grupo privado, com o bot SUT expondo um nome de usuário do Telegram.
  - Para observação estável bot-a-bot, habilite Bot-to-Bot Communication Mode no `@BotFather` para ambos os bots e garanta que o bot driver possa observar tráfego de bots no grupo.
  - Grava um relatório Telegram QA, resumo e artefato de mensagens observadas em `.artifacts/qa-e2e/...`. Cenários com respostas incluem RTT da requisição de envio do driver até a resposta observada do SUT.

Lanes de transporte live compartilham um contrato padrão para que novos transportes não se desviem:

`qa-channel` continua sendo a ampla suíte QA sintética e não faz parte da matriz de cobertura de transporte live.

| Lane     | Canary | Gating por menção | Bloco por lista de permissões | Resposta de nível superior | Retomada após reinício | Follow-up em thread | Isolamento de thread | Observação de reação | Comando help |
| -------- | ------ | ----------------- | ----------------------------- | -------------------------- | ---------------------- | ------------------- | -------------------- | -------------------- | ------------ |
| Matrix   | x      | x                 | x                             | x                          | x                      | x                   | x                    | x                    |              |
| Telegram | x      |                   |                               |                            |                        |                     |                      |                      | x            |

### Credenciais compartilhadas do Telegram via Convex (v1)

Quando `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) está habilitado para
`openclaw qa telegram`, o QA lab adquire um lease exclusivo de um pool com backend Convex, envia Heartbeat
desse lease enquanto a lane está em execução e libera o lease ao encerrar.

Estrutura de referência do projeto Convex:

- `qa/convex-credential-broker/`

Variáveis de ambiente obrigatórias:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por exemplo `https://your-deployment.convex.site`)
- Um segredo para o papel selecionado:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Seleção do papel de credencial:
  - CLI: `--credential-role maintainer|ci`
  - Padrão por env: `OPENCLAW_QA_CREDENTIAL_ROLE` (usa `ci` por padrão em CI, `maintainer` caso contrário)

Variáveis de ambiente opcionais:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (padrão `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (padrão `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (padrão `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (padrão `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (padrão `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (ID opcional de rastreamento)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URLs Convex `http://` loopback para desenvolvimento apenas local.

`OPENCLAW_QA_CONVEX_SITE_URL` deve usar `https://` em operação normal.

Comandos administrativos de mantenedor (adicionar/remover/listar do pool) exigem
especificamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Helpers de CLI para mantenedores:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Use `--json` para saída legível por máquina em scripts e utilitários de CI.

Contrato padrão de endpoint (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Requisição: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Sucesso: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Esgotado/repetível: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Requisição: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Sucesso: `{ status: "ok" }` (ou `2xx` vazio)
- `POST /release`
  - Requisição: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Sucesso: `{ status: "ok" }` (ou `2xx` vazio)
- `POST /admin/add` (apenas segredo de mantenedor)
  - Requisição: `{ kind, actorId, payload, note?, status? }`
  - Sucesso: `{ status: "ok", credential }`
- `POST /admin/remove` (apenas segredo de mantenedor)
  - Requisição: `{ credentialId, actorId }`
  - Sucesso: `{ status: "ok", changed, credential }`
  - Proteção de lease ativo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (apenas segredo de mantenedor)
  - Requisição: `{ kind?, status?, includePayload?, limit? }`
  - Sucesso: `{ status: "ok", credentials, count }`

Formato do payload para o tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` deve ser uma string com o ID numérico do chat do Telegram.
- `admin/add` valida esse formato para `kind: "telegram"` e rejeita payloads malformados.

### Adicionando um canal ao QA

Adicionar um canal ao sistema QA em Markdown exige exatamente duas coisas:

1. Um adaptador de transporte para o canal.
2. Um pacote de cenários que exercite o contrato do canal.

Não adicione uma nova raiz de comando QA de nível superior quando o host compartilhado `qa-lab` puder
assumir o fluxo.

`qa-lab` é responsável pela mecânica compartilhada do host:

- a raiz do comando `openclaw qa`
- inicialização e encerramento da suíte
- concorrência de workers
- gravação de artefatos
- geração de relatórios
- execução de cenários
- aliases de compatibilidade para cenários antigos de `qa-channel`

Plugins de runner são donos do contrato de transporte:

- como `openclaw qa <runner>` é montado abaixo da raiz compartilhada `qa`
- como o gateway é configurado para esse transporte
- como a prontidão é verificada
- como eventos de entrada são injetados
- como mensagens de saída são observadas
- como transcrições e estado de transporte normalizado são expostos
- como ações com backend de transporte são executadas
- como reset ou limpeza específicos do transporte são tratados

A barra mínima de adoção para um novo canal é:

1. Manter `qa-lab` como dono da raiz compartilhada `qa`.
2. Implementar o runner de transporte na interface compartilhada do host `qa-lab`.
3. Manter a mecânica específica do transporte dentro do plugin de runner ou do harness do canal.
4. Montar o runner como `openclaw qa <runner>` em vez de registrar uma raiz de comando concorrente.
   Plugins de runner devem declarar `qaRunners` em `openclaw.plugin.json` e exportar um array correspondente `qaRunnerCliRegistrations` de `runtime-api.ts`.
   Mantenha `runtime-api.ts` leve; CLI lazy e execução do runner devem ficar atrás de entrypoints separados.
5. Criar ou adaptar cenários em Markdown nos diretórios temáticos `qa/scenarios/`.
6. Usar os helpers genéricos de cenário para novos cenários.
7. Manter aliases de compatibilidade existentes funcionando, a menos que o repositório esteja fazendo uma migração intencional.

A regra de decisão é estrita:

- Se um comportamento puder ser expresso uma vez em `qa-lab`, coloque-o em `qa-lab`.
- Se um comportamento depender de um único transporte de canal, mantenha-o nesse plugin de runner ou harness de plugin.
- Se um cenário precisar de uma nova capacidade que mais de um canal possa usar, adicione um helper genérico em vez de um ramo específico de canal em `suite.ts`.
- Se um comportamento só fizer sentido para um transporte, mantenha o cenário específico do transporte e deixe isso explícito no contrato do cenário.

Nomes preferidos de helper genérico para novos cenários são:

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
Aliases de compatibilidade existem para evitar uma migração em um único dia, não como modelo para
autoria de novos cenários.

## Suítes de teste (o que roda onde)

Pense nas suítes como “realismo crescente” (e flakiness/custo crescentes):

### Unit / integration (padrão)

- Comando: `pnpm test`
- Configuração: execuções sem alvo usam o conjunto fragmentado `vitest.full-*.config.ts` e podem expandir shards de vários projetos em configs por projeto para agendamento paralelo
- Arquivos: inventários core/unit em `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` e os testes node permitidos de `ui` cobertos por `vitest.unit.config.ts`
- Escopo:
  - Testes unitários puros
  - Testes de integração em processo (autenticação do gateway, roteamento, tooling, parsing, configuração)
  - Regressões determinísticas para bugs conhecidos
- Expectativas:
  - Roda na CI
  - Não requer chaves reais
  - Deve ser rápida e estável
    <AccordionGroup>
    <Accordion title="Projetos, shards e lanes com escopo"> - Execuções sem alvo de `pnpm test` usam doze configurações menores de shard (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) em vez de um único processo gigante do projeto raiz nativo. Isso reduz o pico de RSS em máquinas carregadas e evita que o trabalho de auto-reply/extensões atrapalhe suítes não relacionadas. - `pnpm test --watch` ainda usa o grafo de projetos nativo da raiz em `vitest.config.ts`, porque um loop watch com vários shards não é prático. - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` roteiam primeiro alvos explícitos de arquivo/diretório por lanes com escopo, então `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar o custo de inicialização do projeto raiz completo. - `pnpm test:changed` expande caminhos alterados do git nas mesmas lanes com escopo quando o diff toca apenas arquivos roteáveis de source/test; edições de config/setup ainda usam como fallback a reexecução ampla do projeto raiz. - `pnpm check:changed` é o gate local inteligente normal para trabalho estreito. Ele classifica o diff em core, testes do core, extensões, testes de extensão, apps, docs, metadados de release e tooling, e então executa as lanes correspondentes de typecheck/lint/teste. Alterações no SDK público de Plugin e em plugin-contract incluem uma passada de validação de extensão porque extensões dependem desses contratos do core. Bumps de versão apenas em metadados de release executam verificações direcionadas de versão/config/dependência raiz em vez da suíte completa, com uma proteção que rejeita mudanças de pacote fora do campo de versão de nível superior. - Testes unitários leves em import de agents, commands, plugins, helpers de auto-reply, `plugin-sdk` e áreas utilitárias puras semelhantes passam pela lane `unit-fast`, que ignora `test/setup-openclaw-runtime.ts`; arquivos com muito estado/runtime permanecem nas lanes existentes. - Arquivos de source helper selecionados de `plugin-sdk` e `commands` também mapeiam execuções em modo changed para testes irmãos explícitos nessas lanes leves, de modo que alterações em helpers evitem reexecutar a suíte pesada completa desse diretório. - `auto-reply` tem três buckets dedicados: helpers principais de nível superior, testes de integração `reply.*` de nível superior e a subárvore `src/auto-reply/reply/**`. Isso mantém o trabalho mais pesado do harness de reply fora dos testes baratos de status/chunk/token.
    </Accordion>

      <Accordion title="Cobertura do runner incorporado">
        - Ao alterar entradas de descoberta de tool de mensagem ou contexto de
          runtime de Compaction, mantenha ambos os níveis de cobertura.
        - Adicione regressões focadas em helper para boundaries puros de roteamento e normalização.
        - Mantenha saudáveis as suítes de integração do runner incorporado:
          `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
          `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
          `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
        - Essas suítes verificam que IDs com escopo e comportamento de Compaction ainda fluem
          pelos caminhos reais de `run.ts` / `compact.ts`; testes apenas de helper
          não são um substituto suficiente para esses caminhos de integração.
      </Accordion>

      <Accordion title="Pool Vitest e padrões de isolamento">
        - A configuração base do Vitest usa por padrão `threads`.
        - A configuração compartilhada do Vitest fixa `isolate: false` e usa o
          runner não isolado nos projetos raiz, e2e e live.
        - A lane UI raiz mantém sua configuração e otimizador `jsdom`, mas também roda no
          runner compartilhado não isolado.
        - Cada shard de `pnpm test` herda os mesmos padrões `threads` + `isolate: false`
          da configuração compartilhada do Vitest.
        - `scripts/run-vitest.mjs` adiciona `--no-maglev` por padrão aos processos
          Node filhos do Vitest para reduzir churn de compilação do V8 durante grandes execuções locais.
          Defina `OPENCLAW_VITEST_ENABLE_MAGLEV=1` para comparar com o
          comportamento padrão do V8.
      </Accordion>

      <Accordion title="Iteração local rápida">
        - `pnpm changed:lanes` mostra quais lanes arquiteturais um diff aciona.
        - O hook pre-commit é apenas de formatação. Ele reaplica stage em arquivos formatados e
          não executa lint, typecheck nem testes.
        - Execute `pnpm check:changed` explicitamente antes de handoff ou push quando
          precisar do gate local inteligente. Alterações no SDK público de Plugin e em plugin-contract
          incluem uma passada de validação de extensão.
        - `pnpm test:changed` roteia por lanes com escopo quando os caminhos alterados
          mapeiam claramente para uma suíte menor.
        - `pnpm test:max` e `pnpm test:changed:max` mantêm o mesmo comportamento de roteamento,
          apenas com um limite maior de workers.
        - O autoescalonamento local de workers é intencionalmente conservador e reduz
          quando a carga média do host já está alta, então várias execuções simultâneas de
          Vitest causam menos dano por padrão.
        - A configuração base do Vitest marca projetos/arquivos de config como
          `forceRerunTriggers`, para que reruns em modo changed permaneçam corretos quando a
          ligação dos testes muda.
        - A configuração mantém `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado em
          hosts compatíveis; defina `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se quiser
          um local de cache explícito para profiling direto.
      </Accordion>

      <Accordion title="Depuração de desempenho">
        - `pnpm test:perf:imports` habilita relatório de duração de import do Vitest mais
          saída de detalhamento de import.
        - `pnpm test:perf:imports:changed` limita a mesma visão de profiling a
          arquivos alterados desde `origin/main`.
        - Quando um teste quente ainda gasta a maior parte do tempo em imports de inicialização,
          mantenha dependências pesadas atrás de uma interface local estreita `*.runtime.ts` e
          faça mock dessa interface diretamente em vez de importar profundamente helpers de runtime
          apenas para passá-los a `vi.mock(...)`.
        - `pnpm test:perf:changed:bench -- --ref <git-ref>` compara o
          `test:changed` roteado com o caminho nativo do projeto raiz para esse diff commitado
          e imprime wall time mais RSS máximo no macOS.
        - `pnpm test:perf:changed:bench -- --worktree` mede a árvore atual suja
          roteando a lista de arquivos alterados por
          `scripts/test-projects.mjs` e a config raiz do Vitest.
        - `pnpm test:perf:profile:main` grava um perfil de CPU da thread principal para
          overhead de inicialização e transformação do Vitest/Vite.
        - `pnpm test:perf:profile:runner` grava perfis de CPU+heap do runner para a
          suíte unitária com paralelismo por arquivo desabilitado.
      </Accordion>
    </AccordionGroup>

### Stability (gateway)

- Comando: `pnpm test:stability:gateway`
- Configuração: `vitest.gateway.config.ts`, forçada a um worker
- Escopo:
  - Inicia um Gateway loopback real com diagnósticos habilitados por padrão
  - Conduz churn sintético de mensagens, memória e payload grande do gateway pelo caminho de evento de diagnóstico
  - Consulta `diagnostics.stability` pelo RPC WS do Gateway
  - Cobre helpers de persistência do bundle de estabilidade de diagnóstico
  - Assegura que o gravador permaneça limitado, que amostras sintéticas de RSS permaneçam abaixo do orçamento de pressão e que profundidades de fila por sessão voltem a zero
- Expectativas:
  - Seguro para CI e sem chaves
  - Lane estreita para acompanhamento de regressão de estabilidade, não substitui a suíte completa do Gateway

### E2E (smoke do gateway)

- Comando: `pnpm test:e2e`
- Configuração: `vitest.e2e.config.ts`
- Arquivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` e testes E2E de plugins integrados em `extensions/`
- Padrões de runtime:
  - Usa Vitest `threads` com `isolate: false`, acompanhando o restante do repositório.
  - Usa workers adaptativos (CI: até 2, local: 1 por padrão).
  - Executa em modo silencioso por padrão para reduzir overhead de I/O no console.
- Substituições úteis:
  - `OPENCLAW_E2E_WORKERS=<n>` para forçar a contagem de workers (limitada a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para reabilitar saída detalhada no console.
- Escopo:
  - Comportamento E2E de várias instâncias do gateway
  - Superfícies WebSocket/HTTP, pareamento de Node e rede mais pesada
- Expectativas:
  - Roda na CI (quando habilitado no pipeline)
  - Não requer chaves reais
  - Tem mais partes móveis do que testes unitários (pode ser mais lento)

### E2E: smoke do backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- Arquivo: `extensions/openshell/src/backend.e2e.test.ts`
- Escopo:
  - Inicia um gateway OpenShell isolado no host via Docker
  - Cria um sandbox a partir de um Dockerfile local temporário
  - Exercita o backend OpenShell do OpenClaw por `sandbox ssh-config` + SSH exec reais
  - Verifica comportamento de sistema de arquivos canônico remoto por meio da bridge fs do sandbox
- Expectativas:
  - Apenas opt-in; não faz parte da execução padrão `pnpm test:e2e`
  - Requer uma CLI `openshell` local mais um daemon Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` isolados e depois destrói o gateway e o sandbox de teste
- Substituições úteis:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar o teste ao executar manualmente a suíte e2e mais ampla
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apontar para um binário CLI não padrão ou script wrapper

### Live (providers reais + modelos reais)

- Comando: `pnpm test:live`
- Configuração: `vitest.live.config.ts`
- Arquivos: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` e testes live de plugins integrados em `extensions/`
- Padrão: **habilitado** por `pnpm test:live` (define `OPENCLAW_LIVE_TEST=1`)
- Escopo:
  - “Esse provider/modelo realmente funciona _hoje_ com credenciais reais?”
  - Capturar mudanças de formato de provider, peculiaridades de chamada de tools, problemas de autenticação e comportamento de rate limit
- Expectativas:
  - Não é estável em CI por design (redes reais, políticas reais de provider, cotas, indisponibilidades)
  - Custa dinheiro / usa rate limits
  - Prefira executar subconjuntos limitados em vez de “tudo”
- Execuções live carregam `~/.profile` para obter chaves de API ausentes.
- Por padrão, execuções live ainda isolam `HOME` e copiam material de config/auth para um home temporário de teste, para que fixtures unitários não modifiquem seu `~/.openclaw` real.
- Defina `OPENCLAW_LIVE_USE_REAL_HOME=1` apenas quando você quiser intencionalmente que testes live usem seu diretório home real.
- `pnpm test:live` agora usa por padrão um modo mais silencioso: ele mantém a saída de progresso `[live] ...`, mas suprime o aviso extra de `~/.profile` e silencia logs de bootstrap do gateway/chatter Bonjour. Defina `OPENCLAW_LIVE_TEST_QUIET=0` se quiser os logs completos de inicialização de volta.
- Rotação de chave de API (específica por provider): defina `*_API_KEYS` no formato vírgula/ponto e vírgula ou `*_API_KEY_1`, `*_API_KEY_2` (por exemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou substituição por live via `OPENCLAW_LIVE_*_KEY`; os testes tentam novamente em respostas de rate limit.
- Saída de progresso/heartbeat:
  - As suítes live agora emitem linhas de progresso em stderr para que chamadas longas de provider permaneçam visivelmente ativas, mesmo quando a captura de console do Vitest está silenciosa.
  - `vitest.live.config.ts` desabilita a interceptação de console do Vitest para que linhas de progresso de provider/gateway sejam transmitidas imediatamente durante execuções live.
  - Ajuste heartbeats de modelo direto com `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajuste heartbeats de gateway/probe com `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Qual suíte devo executar?

Use esta tabela de decisão:

- Editando lógica/testes: execute `pnpm test` (e `pnpm test:coverage` se você mudou muita coisa)
- Tocando em rede do gateway / protocolo WS / pareamento: adicione `pnpm test:e2e`
- Depurando “meu bot caiu” / falhas específicas de provider / chamada de tools: execute um `pnpm test:live` limitado

## Testes live (que tocam rede)

Para a matriz live de modelos, smokes de backend CLI, smokes ACP, harness
app-server do Codex e todos os testes live de provider de mídia (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — além do tratamento de credenciais para execuções live — consulte
[Testes — suítes live](/pt-BR/help/testing-live).

## Runners Docker (verificações opcionais de “funciona em Linux”)

Esses runners Docker se dividem em dois grupos:

- Runners de modelo live: `test:docker:live-models` e `test:docker:live-gateway` executam apenas seu arquivo live correspondente por chave de perfil dentro da imagem Docker do repositório (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando seu diretório local de config e workspace (e carregando `~/.profile` se montado). Os entrypoints locais correspondentes são `test:live:models-profiles` e `test:live:gateway-profiles`.
- Runners Docker live usam por padrão um limite menor de smoke para que uma varredura Docker completa continue prática:
  `test:docker:live-models` usa por padrão `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa por padrão `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Substitua essas variáveis de ambiente quando
  quiser explicitamente a varredura exaustiva maior.
- `test:docker:all` faz build da imagem Docker live uma vez via `test:docker:live-build`, depois a reutiliza para as duas lanes Docker live. Também faz build de uma imagem compartilhada `scripts/e2e/Dockerfile` via `test:docker:e2e-build` e a reutiliza para os runners smoke E2E em contêiner que exercitam o app construído.
- Runners smoke em contêiner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` e `test:docker:config-reload` inicializam um ou mais contêineres reais e verificam caminhos de integração de nível superior.

Os runners Docker de modelo live também fazem bind-mount apenas dos homes de autenticação CLI necessários (ou de todos os compatíveis quando a execução não está limitada), depois os copiam para o home do contêiner antes da execução para que OAuth de CLI externa possa atualizar tokens sem modificar o armazenamento de autenticação do host:

- Modelos diretos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke de bind ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`)
- Smoke de backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke do harness app-server Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live do Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Assistente de onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke npm tarball onboarding/canal/agente: `pnpm test:docker:npm-onboard-channel-agent` instala o tarball empacotado do OpenClaw globalmente em Docker, configura OpenAI via onboarding por env-ref mais Telegram por padrão, verifica que habilitar o plugin instala suas dependências de runtime sob demanda, executa doctor e roda um turno de agente OpenAI simulado. Reutilize um tarball pré-construído com `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pule o rebuild no host com `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ou troque o canal com `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke de instalação global Bun: `bash scripts/e2e/bun-global-install-smoke.sh` empacota a árvore atual, instala com `bun install -g` em um home isolado e verifica que `openclaw infer image providers --json` retorna providers de imagem integrados em vez de travar. Reutilize um tarball pré-construído com `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pule o build no host com `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ou copie `dist/` de uma imagem Docker já construída com `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker do instalador: `bash scripts/test-install-sh-docker.sh` compartilha um único cache npm entre seus contêineres root, update e direct-npm. O smoke de update usa por padrão npm `latest` como baseline estável antes de atualizar para o tarball candidato. Verificações de instalador sem root mantêm um cache npm isolado para que entradas de cache com dono root não escondam comportamento de instalação local do usuário. Defina `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` para reutilizar o cache root/update/direct-npm em reruns locais.
- A CI de Install Smoke pula a atualização global duplicada de direct-npm com `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; execute o script localmente sem esse env quando for necessária cobertura direta de `npm install -g`.
- Rede do Gateway (dois contêineres, autenticação WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Regressão de reasoning mínimo do OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) executa um servidor OpenAI simulado via Gateway, verifica que `web_search` eleva `reasoning.effort` de `minimal` para `low`, depois força a rejeição do schema do provider e verifica se o detalhe bruto aparece nos logs do Gateway.
- Bridge de canal MCP (Gateway com seed + bridge stdio + smoke bruto de frame de notificação Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Pi bundle MCP tools (servidor MCP stdio real + smoke de allow/deny de perfil Pi incorporado): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Limpeza de MCP Cron/subagent (Gateway real + teardown de processo filho MCP stdio após execuções cron isoladas e de subagent one-shot): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke de instalação + alias `/plugin` + semântica de reinício do bundle Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
- Smoke inalterado de update de plugin: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke de metadados de reload de config: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Dependências de runtime de plugin integrado: `pnpm test:docker:bundled-channel-deps` faz build de uma pequena imagem runner Docker por padrão, constrói e empacota o OpenClaw uma vez no host e depois monta esse tarball em cada cenário de instalação Linux. Reutilize a imagem com `OPENCLAW_SKIP_DOCKER_BUILD=1`, pule o rebuild no host após um build local recente com `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` ou aponte para um tarball existente com `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`.
- Restrinja dependências de runtime de plugin integrado durante iteração desabilitando cenários não relacionados, por exemplo:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Para pré-construir e reutilizar manualmente a imagem compartilhada do app construído:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Substituições de imagem específicas da suíte, como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, ainda têm prioridade quando definidas. Quando `OPENCLAW_SKIP_DOCKER_BUILD=1` aponta para uma imagem remota compartilhada, os scripts fazem pull dela se ainda não estiver localmente. Os testes Docker de QR e do instalador mantêm seus próprios Dockerfiles porque validam comportamento de pacote/instalação, e não o runtime compartilhado do app construído.

Os runners Docker de modelo live também fazem bind-mount somente leitura do checkout atual e
o preparam em um workdir temporário dentro do contêiner. Isso mantém a imagem de runtime
enxuta, mas ainda executa o Vitest exatamente sobre seu source/config local.
A etapa de preparação ignora caches locais grandes e saídas de build de apps, como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e diretórios locais de `.build` ou
saída do Gradle, para que execuções Docker live não gastem minutos copiando
artefatos específicos da máquina.
Eles também definem `OPENCLAW_SKIP_CHANNELS=1` para que probes live do gateway não iniciem
workers reais de canais como Telegram/Discord/etc. dentro do contêiner.
`test:docker:live-models` ainda executa `pnpm test:live`, então também passe
`OPENCLAW_LIVE_GATEWAY_*` quando precisar restringir ou excluir cobertura
live do gateway dessa lane Docker.
`test:docker:openwebui` é um smoke de compatibilidade de nível superior: ele inicia um
contêiner Gateway OpenClaw com os endpoints HTTP compatíveis com OpenAI habilitados,
inicia um contêiner Open WebUI fixado contra esse gateway, faz login via
Open WebUI, verifica que `/api/models` expõe `openclaw/default` e então envia uma
requisição real de chat pelo proxy `/api/chat/completions` do Open WebUI.
A primeira execução pode ser visivelmente mais lenta porque o Docker pode precisar fazer pull da
imagem Open WebUI e o Open WebUI pode precisar concluir sua própria inicialização a frio.
Essa lane espera uma chave live de modelo utilizável, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` por padrão) é o meio principal de fornecê-la em execuções Dockerizadas.
Execuções bem-sucedidas imprimem um pequeno payload JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` é intencionalmente determinístico e não precisa de uma
conta real de Telegram, Discord ou iMessage. Ele inicializa um contêiner Gateway com seed,
inicia um segundo contêiner que executa `openclaw mcp serve` e então
verifica descoberta de conversa roteada, leitura de transcrição, metadados de anexo,
comportamento da fila de eventos live, roteamento de envio de saída e canal no estilo Claude +
notificações de permissão sobre a bridge MCP stdio real. A verificação de notificação
inspeciona diretamente os frames brutos stdio MCP, de forma que o smoke valida o que a
bridge realmente emite, não apenas o que um SDK de cliente específico por acaso expõe.
`test:docker:pi-bundle-mcp-tools` é determinístico e não precisa de uma chave live de
modelo. Ele faz build da imagem Docker do repositório, inicia um servidor probe MCP stdio real
dentro do contêiner, materializa esse servidor por meio do runtime MCP bundle
Pi incorporado, executa a tool e então verifica que `coding` e `messaging` mantêm
tools `bundle-mcp`, enquanto `minimal` e `tools.deny: ["bundle-mcp"]` as filtram.
`test:docker:cron-mcp-cleanup` é determinístico e não precisa de uma chave live de
modelo. Ele inicia um Gateway com seed com um servidor probe MCP stdio real, executa um
turno Cron isolado e um turno filho one-shot de `/subagents spawn`, e então verifica
que o processo filho MCP é encerrado após cada execução.

Smoke manual de thread ACP em linguagem simples (não CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantenha este script para workflows de regressão/depuração. Ele pode ser necessário novamente para validação de roteamento de thread ACP, então não o exclua.

Variáveis de ambiente úteis:

- `OPENCLAW_CONFIG_DIR=...` (padrão: `~/.openclaw`) montado em `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (padrão: `~/.openclaw/workspace`) montado em `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (padrão: `~/.profile`) montado em `/home/node/.profile` e carregado antes da execução dos testes
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar apenas variáveis de ambiente carregadas de `OPENCLAW_PROFILE_FILE`, usando diretórios temporários de config/workspace e sem mounts de autenticação de CLI externa
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (padrão: `~/.cache/openclaw/docker-cli-tools`) montado em `/home/node/.npm-global` para instalações em cache de CLI dentro do Docker
- Diretórios/arquivos de autenticação de CLI externa sob `$HOME` são montados como somente leitura em `/host-auth...` e depois copiados para `/home/node/...` antes do início dos testes
  - Diretórios padrão: `.minimax`
  - Arquivos padrão: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Execuções limitadas por provider montam apenas os diretórios/arquivos necessários inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Substitua manualmente com `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` ou uma lista separada por vírgulas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para restringir a execução
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar providers dentro do contêiner
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar uma imagem existente `openclaw:local-live` em reruns que não precisem de rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para garantir que credenciais venham do armazenamento de perfil (não de env)
- `OPENCLAW_OPENWEBUI_MODEL=...` para escolher o modelo exposto pelo gateway para o smoke do Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para substituir o prompt de verificação com nonce usado pelo smoke do Open WebUI
- `OPENWEBUI_IMAGE=...` para substituir a tag de imagem fixada do Open WebUI

## Verificação de documentação

Execute verificações de docs após edições de documentação: `pnpm check:docs`.
Execute a validação completa de âncoras Mintlify quando também precisar de verificações de cabeçalhos na página: `pnpm docs:check-links:anchors`.

## Regressão offline (segura para CI)

Estas são regressões de “pipeline real” sem providers reais:

- Chamada de tool do gateway (OpenAI simulado, gateway real + loop do agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistente do gateway (WS `wizard.start`/`wizard.next`, grava config + auth aplicada): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Avaliações de confiabilidade do agente (Skills)

Já temos alguns testes seguros para CI que se comportam como “avaliações de confiabilidade do agente”:

- Chamada de tool simulada pelo gateway real + loop do agente (`src/gateway/gateway.test.ts`).
- Fluxos de assistente end-to-end que validam wiring de sessão e efeitos de configuração (`src/gateway/gateway.test.ts`).

O que ainda falta para Skills (consulte [Skills](/pt-BR/tools/skills)):

- **Tomada de decisão:** quando Skills são listadas no prompt, o agente escolhe a Skill certa (ou evita as irrelevantes)?
- **Conformidade:** o agente lê `SKILL.md` antes de usar e segue as etapas/args exigidos?
- **Contratos de workflow:** cenários com vários turnos que afirmem ordem de tools, continuidade do histórico de sessão e boundaries de sandbox.

Avaliações futuras devem permanecer determinísticas primeiro:

- Um runner de cenários usando providers simulados para afirmar chamadas de tool + ordem, leituras de arquivos de Skill e wiring de sessão.
- Um pequeno conjunto de cenários focados em Skill (usar vs evitar, gating, prompt injection).
- Avaliações live opcionais (opt-in, controladas por env) somente depois que a suíte segura para CI estiver pronta.

## Testes de contrato (formato de plugin e canal)

Testes de contrato verificam se todo plugin e canal registrado está em conformidade com seu
contrato de interface. Eles iteram sobre todos os plugins descobertos e executam uma suíte de
afirmações de formato e comportamento. A lane unit padrão `pnpm test` ignora intencionalmente esses arquivos compartilhados de interface e smoke; execute os comandos de contrato explicitamente
quando tocar em superfícies compartilhadas de canal ou provider.

### Comandos

- Todos os contratos: `pnpm test:contracts`
- Apenas contratos de canal: `pnpm test:contracts:channels`
- Apenas contratos de provider: `pnpm test:contracts:plugins`

### Contratos de canal

Localizados em `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Formato básico do plugin (id, name, capabilities)
- **setup** - Contrato do assistente de configuração
- **session-binding** - Comportamento de binding de sessão
- **outbound-payload** - Estrutura do payload de mensagem
- **inbound** - Tratamento de mensagem de entrada
- **actions** - Handlers de ações do canal
- **threading** - Tratamento de ID de thread
- **directory** - API de diretório/lista
- **group-policy** - Aplicação da política de grupo

### Contratos de status de provider

Localizados em `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probes de status do canal
- **registry** - Formato do registro de plugins

### Contratos de provider

Localizados em `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato do fluxo de autenticação
- **auth-choice** - Escolha/seleção de autenticação
- **catalog** - API de catálogo de modelos
- **discovery** - Descoberta de plugin
- **loader** - Carregamento de plugin
- **runtime** - Runtime do provider
- **shape** - Formato/interface do plugin
- **wizard** - Assistente de configuração

### Quando executar

- Depois de alterar exports ou subpaths do plugin-sdk
- Depois de adicionar ou modificar um plugin de canal ou provider
- Depois de refatorar registro ou descoberta de plugin

Os testes de contrato rodam na CI e não exigem chaves reais de API.

## Adicionando regressões (orientação)

Quando você corrige um problema de provider/modelo descoberto em live:

- Adicione uma regressão segura para CI se possível (provider simulado/stub ou capture a transformação exata do formato da requisição)
- Se for inerentemente apenas live (rate limits, políticas de autenticação), mantenha o teste live estreito e opt-in via variáveis de ambiente
- Prefira mirar na menor camada que captura o bug:
  - bug de conversão/replay de requisição do provider → teste direto de modelos
  - bug de pipeline de sessão/histórico/tool do gateway → smoke live do gateway ou teste simulado do gateway seguro para CI
- Proteção de traversal de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva um alvo amostrado por classe SecretRef a partir dos metadados do registro (`listSecretTargetRegistryEntries()`), então afirma que IDs exec de segmentos de traversal são rejeitados.
  - Se você adicionar uma nova família de alvo SecretRef com `includeInPlan` em `src/secrets/target-registry-data.ts`, atualize `classifyTargetClass` nesse teste. O teste falha intencionalmente em IDs de alvo não classificados para que novas classes não possam ser ignoradas silenciosamente.

## Relacionado

- [Testes live](/pt-BR/help/testing-live)
- [CI](/pt-BR/ci)
