---
read_when:
    - Executar testes localmente ou no CI
    - Adicionar regressões para bugs de modelo/provedor
    - Depurar comportamento do Gateway + agente
summary: 'Kit de testes: suítes unit/e2e/live, executores Docker e o que cada teste cobre'
title: Testes
x-i18n:
    generated_at: "2026-04-25T13:48:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8352a695890b2bef8d15337c6371f33363222ec371f91dd0e6a8ba84cccbbc8
    source_path: help/testing.md
    workflow: 15
---

O OpenClaw tem três suítes Vitest (unit/integration, e2e, live) e um pequeno conjunto
de executores Docker. Este documento é um guia de "como testamos":

- O que cada suíte cobre (e o que ela deliberadamente _não_ cobre).
- Quais comandos executar para fluxos comuns (local, pré-push, depuração).
- Como os testes live descobrem credenciais e selecionam modelos/provedores.
- Como adicionar regressões para problemas reais de modelo/provedor.

## Início rápido

Na maioria dos dias:

- Gate completo (esperado antes do push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Execução local mais rápida da suíte completa em uma máquina folgada: `pnpm test:max`
- Loop direto de watch do Vitest: `pnpm test:watch`
- O direcionamento direto de arquivo agora também roteia caminhos de extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefira execuções direcionadas primeiro quando estiver iterando sobre uma única falha.
- Site QA com suporte de Docker: `pnpm qa:lab:up`
- Lane QA com suporte de VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando você mexe em testes ou quer confiança extra:

- Gate de cobertura: `pnpm test:coverage`
- Suíte E2E: `pnpm test:e2e`

Ao depurar provedores/modelos reais (exige credenciais reais):

- Suíte live (modelos + sondas de ferramenta/imagem do gateway): `pnpm test:live`
- Direcione um arquivo live em modo silencioso: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Varredura Docker de modelos live: `pnpm test:docker:live-models`
  - Cada modelo selecionado agora executa um turno de texto mais uma pequena sonda no estilo leitura de arquivo.
    Modelos cujos metadados anunciam entrada `image` também executam um pequeno turno de imagem.
    Desabilite as sondas extras com `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` ou
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` ao isolar falhas do provedor.
  - Cobertura em CI: as verificações diárias `OpenClaw Scheduled Live And E2E Checks` e manuais
    `OpenClaw Release Checks` chamam ambas o workflow reutilizável live/E2E com
    `include_live_suites: true`, que inclui jobs separados de matriz Docker live
    fragmentados por provedor.
  - Para novas execuções focadas em CI, dispare `OpenClaw Live And E2E Checks (Reusable)`
    com `include_live_suites: true` e `live_models_only: true`.
  - Adicione novos segredos de provedor de alto sinal a `scripts/ci-hydrate-live-auth.sh`
    mais `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` e seus
    chamadores agendados/de release.
- Smoke nativo de chat vinculado do Codex: `pnpm test:docker:live-codex-bind`
  - Executa uma lane Docker live no caminho do app-server do Codex, vincula uma
    DM sintética do Slack com `/codex bind`, exercita `/codex fast` e
    `/codex permissions`, depois verifica uma resposta simples e um anexo de imagem
    passando pelo vínculo nativo do plugin em vez de ACP.
- Smoke do comando de resgate do Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Verificação opcional de segurança extra da superfície do comando de resgate por canal de mensagem.
    Ela exercita `/crestodian status`, enfileira uma alteração persistente de modelo,
    responde `/crestodian yes` e verifica o caminho de gravação de auditoria/configuração.
- Smoke Docker do planejador do Crestodian: `pnpm test:docker:crestodian-planner`
  - Executa o Crestodian em um container sem configuração com um Claude CLI falso no `PATH`
    e verifica que o fallback do planejador vago se traduz em uma gravação
    tipada e auditada de configuração.
- Smoke Docker da primeira execução do Crestodian: `pnpm test:docker:crestodian-first-run`
  - Começa de um diretório de estado vazio do OpenClaw, roteia `openclaw` sem argumentos para o
    Crestodian, aplica gravações de setup/modelo/agente/Plugin do Discord + SecretRef,
    valida a configuração e verifica entradas de auditoria. O mesmo caminho de setup Ring 0
    também é coberto no QA Lab por
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke de custo Moonshot/Kimi: com `MOONSHOT_API_KEY` definido, execute
  `openclaw models list --provider moonshot --json`, depois execute um
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolado contra `moonshot/kimi-k2.6`. Verifique se o JSON informa Moonshot/K2.6 e se o
  transcript do assistente armazena `usage.cost` normalizado.

Dica: quando você precisa apenas de um caso com falha, prefira restringir testes live via as variáveis de ambiente de allowlist descritas abaixo.

## Executores específicos de QA

Esses comandos ficam ao lado das suítes principais de teste quando você precisa do realismo do QA Lab:

O CI executa o QA Lab em workflows dedicados. `Parity gate` roda em PRs correspondentes e
a partir de dispatch manual com provedores simulados. `QA-Lab - All Lanes` roda à noite em
`main` e a partir de dispatch manual com o parity gate simulado, a lane Matrix live e a
lane Telegram live gerenciada por Convex como jobs paralelos. `OpenClaw Release Checks`
roda as mesmas lanes antes da aprovação de release.

- `pnpm openclaw qa suite`
  - Executa cenários de QA com suporte de repositório diretamente no host.
  - Executa vários cenários selecionados em paralelo por padrão com workers isolados
    do gateway. `qa-channel` usa por padrão concorrência 4 (limitada pela contagem
    de cenários selecionados). Use `--concurrency <count>` para ajustar a contagem
    de workers, ou `--concurrency 1` para a antiga lane serial.
  - Sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando
    quiser artefatos sem um código de saída de falha.
  - Suporta modos de provedor `live-frontier`, `mock-openai` e `aimock`.
    `aimock` inicia um servidor local de provedor com suporte de AIMock para cobertura experimental
    de fixture e de mock de protocolo sem substituir a lane `mock-openai`
    com reconhecimento de cenário.
- `pnpm openclaw qa suite --runner multipass`
  - Executa a mesma suíte QA dentro de uma VM Linux descartável do Multipass.
  - Mantém o mesmo comportamento de seleção de cenário de `qa suite` no host.
  - Reutiliza as mesmas flags de seleção de provedor/modelo de `qa suite`.
  - Execuções live encaminham as entradas de autenticação QA suportadas que são práticas para o guest:
    chaves de provedor baseadas em env, o caminho de configuração do provedor live QA e `CODEX_HOME`
    quando presente.
  - Diretórios de saída devem permanecer sob a raiz do repositório para que o guest possa escrever de volta pelo
    workspace montado.
  - Grava o relatório + resumo normais de QA, além de logs do Multipass em
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia o site QA com suporte de Docker para trabalho de QA no estilo operador.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Gera um tarball npm a partir do checkout atual, instala-o globalmente em
    Docker, executa onboarding não interativo com chave de API da OpenAI, configura o Telegram
    por padrão, verifica se a habilitação do Plugin instala dependências de runtime sob demanda, executa
    doctor e executa um turno de agente local contra um endpoint OpenAI simulado.
  - Use `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para executar a mesma
    lane de instalação empacotada com Discord.
- `pnpm test:docker:npm-telegram-live`
  - Instala um pacote OpenClaw publicado em Docker, executa o onboarding do pacote instalado,
    configura o Telegram pela CLI instalada e depois reutiliza a lane QA live do Telegram com esse pacote instalado como Gateway do SUT.
  - Usa por padrão `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`.
  - Usa as mesmas credenciais de ambiente do Telegram ou a mesma fonte de credenciais Convex que
    `pnpm openclaw qa telegram`. Para automação de CI/release, defina
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` mais
    `OPENCLAW_QA_CONVEX_SITE_URL` e o segredo de papel apropriado. Se
    `OPENCLAW_QA_CONVEX_SITE_URL` e um segredo de papel do Convex estiverem presentes em CI,
    o wrapper Docker seleciona Convex automaticamente.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` substitui o
    `OPENCLAW_QA_CREDENTIAL_ROLE` compartilhado apenas para esta lane.
  - O GitHub Actions expõe esta lane como o workflow manual de mantenedor
    `NPM Telegram Beta E2E`. Ele não roda em merge. O workflow usa o
    ambiente `qa-live-shared` e concessões de credenciais de CI do Convex.
- `pnpm test:docker:bundled-channel-deps`
  - Empacota e instala a build atual do OpenClaw em Docker, inicia o Gateway
    com OpenAI configurado e então habilita canais/Plugins agrupados por meio
    de edições de configuração.
  - Verifica se a descoberta de setup deixa ausentes dependências de runtime de Plugin não configuradas, se a primeira execução configurada do Gateway ou do doctor instala sob demanda as dependências de runtime de cada Plugin agrupado e se uma segunda reinicialização não reinstala dependências já ativadas.
  - Também instala uma baseline npm mais antiga conhecida, habilita o Telegram antes de executar
    `openclaw update --tag <candidate>` e verifica se o doctor pós-atualização do candidato repara dependências de runtime de canal agrupado sem um reparo pós-install do lado do harness.
- `pnpm test:parallels:npm-update`
  - Executa o smoke nativo de atualização de instalação empacotada em guests do Parallels. Cada
    plataforma selecionada primeiro instala o pacote baseline solicitado, depois executa o comando
    `openclaw update` instalado no mesmo guest e verifica a versão instalada, o status de atualização, a prontidão do gateway e um turno de agente local.
  - Use `--platform macos`, `--platform windows` ou `--platform linux` enquanto
    estiver iterando em um único guest. Use `--json` para o caminho do artefato de resumo e o
    status por lane.
  - Envolva execuções locais longas em um timeout do host para que travamentos no transporte do Parallels não
    consumam o restante da janela de teste:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - O script grava logs aninhados de lane em `/tmp/openclaw-parallels-npm-update.*`.
    Inspecione `windows-update.log`, `macos-update.log` ou `linux-update.log`
    antes de supor que o wrapper externo travou.
  - A atualização do Windows pode passar de 10 a 15 minutos em reparo pós-atualização de doctor/dependência de runtime em um guest frio; isso ainda é saudável quando o log de depuração npm aninhado está avançando.
  - Não execute esse wrapper agregado em paralelo com lanes individuais de smoke do Parallels
    para macOS, Windows ou Linux. Eles compartilham o estado da VM e podem colidir em
    restauração de snapshot, publicação de pacote ou estado do gateway do guest.
  - A prova pós-atualização executa a superfície normal de Plugin agrupado porque
    fachadas de capacidade como fala, geração de imagem e entendimento
    de mídia são carregadas por APIs agrupadas de runtime mesmo quando o turno do agente
    verifica apenas uma resposta de texto simples.

- `pnpm openclaw qa aimock`
  - Inicia apenas o servidor local de provedor AIMock para testes smoke diretos
    de protocolo.
- `pnpm openclaw qa matrix`
  - Executa a lane QA live do Matrix contra um homeserver Tuwunel descartável com suporte de Docker.
  - Esse host de QA hoje é apenas para repositório/desenvolvimento. Instalações empacotadas do OpenClaw não incluem
    `qa-lab`, portanto não expõem `openclaw qa`.
  - Checkouts de repositório carregam diretamente o runner agrupado; não é necessário
    nenhum passo separado de instalação de Plugin.
  - Provisiona três usuários Matrix temporários (`driver`, `sut`, `observer`) mais uma sala privada, depois inicia um processo filho de gateway QA com o Plugin real do Matrix como transporte do SUT.
  - Usa por padrão a imagem estável fixada do Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Substitua com `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` quando precisar testar uma imagem diferente.
  - O Matrix não expõe flags compartilhadas de origem de credenciais porque a lane provisiona usuários descartáveis localmente.
  - Grava um relatório QA do Matrix, resumo, artefato de eventos observados e log combinado de saída padrão/erro padrão em `.artifacts/qa-e2e/...`.
  - Emite progresso por padrão e impõe um timeout rígido de execução com `OPENCLAW_QA_MATRIX_TIMEOUT_MS` (padrão 30 minutos). A limpeza é limitada por `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` e falhas incluem o comando de recuperação `docker compose ... down --remove-orphans`.
- `pnpm openclaw qa telegram`
  - Executa a lane QA live do Telegram contra um grupo privado real usando os tokens de bot do driver e do SUT do ambiente.
  - Exige `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. O id do grupo deve ser o id numérico do chat do Telegram.
  - Oferece suporte a `--credential-source convex` para credenciais compartilhadas em pool. Use o modo env por padrão ou defina `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por leases em pool.
  - Sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando
    quiser artefatos sem um código de saída de falha.
  - Exige dois bots distintos no mesmo grupo privado, com o bot do SUT expondo um nome de usuário do Telegram.
  - Para observação estável bot-para-bot, habilite o Bot-to-Bot Communication Mode em `@BotFather` para ambos os bots e garanta que o bot driver consiga observar o tráfego de bots no grupo.
  - Grava um relatório QA do Telegram, resumo e artefato de mensagens observadas em `.artifacts/qa-e2e/...`. Cenários com resposta incluem RTT desde a requisição de envio do driver até a resposta observada do SUT.

Lanes de transporte live compartilham um contrato padrão para que novos transportes não se desviem:

`qa-channel` continua sendo a suíte QA sintética ampla e não faz parte da matriz de cobertura de transporte live.

| Lane     | Canary | Bloqueio por menção | Bloqueio por allowlist | Resposta de nível superior | Retomada após reinício | Acompanhamento em thread | Isolamento de thread | Observação de reação | Comando de ajuda |
| -------- | ------ | ------------------- | ---------------------- | -------------------------- | ---------------------- | ------------------------ | -------------------- | -------------------- | ---------------- |
| Matrix   | x      | x                   | x                      | x                          | x                      | x                        | x                    | x                    |                  |
| Telegram | x      |                     |                        |                            |                        |                          |                      |                      | x                |

### Credenciais compartilhadas do Telegram via Convex (v1)

Quando `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) está habilitado para
`openclaw qa telegram`, o QA lab adquire um lease exclusivo de um pool com suporte de Convex, envia Heartbeats
desse lease enquanto a lane está em execução e libera o lease ao encerrar.

Scaffold de projeto Convex de referência:

- `qa/convex-credential-broker/`

Variáveis de ambiente obrigatórias:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por exemplo `https://your-deployment.convex.site`)
- Um segredo para o papel selecionado:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Seleção do papel da credencial:
  - CLI: `--credential-role maintainer|ci`
  - Padrão por ambiente: `OPENCLAW_QA_CREDENTIAL_ROLE` (usa `ci` por padrão em CI, `maintainer` caso contrário)

Variáveis de ambiente opcionais:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (padrão `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (padrão `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (padrão `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (padrão `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (padrão `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de rastreio opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URLs Convex `http://` em loopback para desenvolvimento apenas local.

`OPENCLAW_QA_CONVEX_SITE_URL` deve usar `https://` em operação normal.

Comandos administrativos de maintainer (adicionar/remover/listar pool) exigem
especificamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Helpers de CLI para maintainers:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Use `doctor` antes de execuções live para verificar a URL do site Convex, segredos do broker,
prefixo do endpoint, timeout HTTP e acessibilidade de admin/list sem imprimir
valores secretos. Use `--json` para saída legível por máquina em scripts e utilitários de CI.

Contrato de endpoint padrão (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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
- `POST /admin/add` (apenas segredo de maintainer)
  - Requisição: `{ kind, actorId, payload, note?, status? }`
  - Sucesso: `{ status: "ok", credential }`
- `POST /admin/remove` (apenas segredo de maintainer)
  - Requisição: `{ credentialId, actorId }`
  - Sucesso: `{ status: "ok", changed, credential }`
  - Proteção de lease ativo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (apenas segredo de maintainer)
  - Requisição: `{ kind?, status?, includePayload?, limit? }`
  - Sucesso: `{ status: "ok", credentials, count }`

Formato do payload para o tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` deve ser uma string numérica de id de chat do Telegram.
- `admin/add` valida esse formato para `kind: "telegram"` e rejeita payloads malformados.

### Adicionar um canal ao QA

Adicionar um canal ao sistema de QA em Markdown exige exatamente duas coisas:

1. Um adaptador de transporte para o canal.
2. Um pacote de cenários que exercite o contrato do canal.

Não adicione uma nova raiz de comando QA de nível superior quando o host compartilhado `qa-lab` puder
assumir o fluxo.

`qa-lab` controla a mecânica compartilhada do host:

- a raiz de comando `openclaw qa`
- inicialização e encerramento da suíte
- concorrência de workers
- gravação de artefatos
- geração de relatórios
- execução de cenários
- aliases de compatibilidade para cenários antigos `qa-channel`

Plugins de runner controlam o contrato de transporte:

- como `openclaw qa <runner>` é montado sob a raiz compartilhada `qa`
- como o gateway é configurado para esse transporte
- como a prontidão é verificada
- como eventos de entrada são injetados
- como mensagens de saída são observadas
- como transcripts e o estado normalizado do transporte são expostos
- como ações com suporte de transporte são executadas
- como reset ou limpeza específicos do transporte são tratados

A barra mínima de adoção para um novo canal é:

1. Manter `qa-lab` como controlador da raiz compartilhada `qa`.
2. Implementar o runner de transporte na interface compartilhada do host `qa-lab`.
3. Manter a mecânica específica do transporte dentro do Plugin runner ou do harness do canal.
4. Montar o runner como `openclaw qa <runner>` em vez de registrar uma raiz de comando concorrente.
   Plugins runner devem declarar `qaRunners` em `openclaw.plugin.json` e exportar um array correspondente `qaRunnerCliRegistrations` em `runtime-api.ts`.
   Mantenha `runtime-api.ts` leve; CLI preguiçosa e execução do runner devem ficar atrás de entrypoints separados.
5. Escrever ou adaptar cenários em Markdown sob os diretórios temáticos `qa/scenarios/`.
6. Usar os helpers genéricos de cenário para novos cenários.
7. Manter aliases de compatibilidade existentes funcionando, a menos que o repositório esteja fazendo uma migração intencional.

A regra de decisão é rígida:

- Se o comportamento puder ser expresso uma única vez em `qa-lab`, coloque-o em `qa-lab`.
- Se o comportamento depender de um transporte de canal, mantenha-o nesse Plugin runner ou harness do Plugin.
- Se um cenário precisar de uma nova capacidade que mais de um canal possa usar, adicione um helper genérico em vez de um branch específico de canal em `suite.ts`.
- Se um comportamento só fizer sentido para um transporte, mantenha o cenário específico daquele transporte e deixe isso explícito no contrato do cenário.

Nomes preferenciais de helper genérico para novos cenários:

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
Aliases de compatibilidade existem para evitar uma migração do tipo flag day, e não como o modelo para
a autoria de novos cenários.

## Suítes de teste (o que roda onde)

Pense nas suítes como “realismo crescente” (e instabilidade/custo crescentes):

### Unit / integration (padrão)

- Comando: `pnpm test`
- Configuração: execuções não direcionadas usam o conjunto fragmentado `vitest.full-*.config.ts` e podem expandir fragments de múltiplos projetos em configs por projeto para agendamento paralelo
- Arquivos: inventários core/unit em `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` e os testes Node allowlist de `ui` cobertos por `vitest.unit.config.ts`
- Escopo:
  - Testes unitários puros
  - Testes de integração em processo (autenticação do gateway, roteamento, ferramental, parsing, config)
  - Regressões determinísticas para bugs conhecidos
- Expectativas:
  - Roda em CI
  - Não exige chaves reais
  - Deve ser rápido e estável

<AccordionGroup>
  <Accordion title="Projetos, fragments e lanes com escopo">

    - Execuções `pnpm test` não direcionadas usam doze configurações shard menores (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) em vez de um único processo gigante do projeto raiz nativo. Isso reduz o RSS de pico em máquinas carregadas e evita que o trabalho de auto-reply/extensions prejudique suítes não relacionadas.
    - `pnpm test --watch` ainda usa o grafo de projetos da raiz nativa `vitest.config.ts`, porque um loop de watch com múltiplos shards não é prático.
    - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` primeiro roteiam alvos explícitos de arquivo/diretório por lanes com escopo, então `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar o custo total de inicialização do projeto raiz.
    - `pnpm test:changed` expande caminhos alterados do git nas mesmas lanes com escopo quando o diff toca apenas arquivos de código-fonte/teste roteáveis; edições de config/setup ainda usam fallback para a reexecução ampla do projeto raiz.
    - `pnpm check:changed` é o gate local inteligente normal para trabalho estreito. Ele classifica o diff em core, testes do core, extensions, testes de extension, apps, docs, metadados de release e tooling, depois executa as lanes correspondentes de typecheck/lint/teste. Mudanças públicas de Plugin SDK e contrato de plugin incluem uma passada de validação de extension porque extensions dependem desses contratos do core. Aumentos de versão apenas em metadados de release executam verificações direcionadas de versão/config/dependência raiz em vez da suíte completa, com uma proteção que rejeita alterações de pacote fora do campo de versão de nível superior.
    - Testes unitários leves de importação de agents, commands, plugins, helpers de auto-reply, `plugin-sdk` e áreas utilitárias puras semelhantes passam pela lane `unit-fast`, que ignora `test/setup-openclaw-runtime.ts`; arquivos pesados de runtime/estado permanecem nas lanes existentes.
    - Arquivos auxiliares selecionados de `plugin-sdk` e `commands` também mapeiam execuções em modo changed para testes explícitos irmãos nessas lanes leves, então edições auxiliares evitam reexecutar a suíte pesada completa daquele diretório.
    - `auto-reply` tem três buckets dedicados: helpers core de nível superior, testes de integração `reply.*` de nível superior e a subárvore `src/auto-reply/reply/**`. Isso mantém o trabalho mais pesado do harness de reply fora dos testes baratos de status/chunk/token.

  </Accordion>

  <Accordion title="Cobertura do runner embutido">

    - Quando você altera entradas de descoberta da ferramenta de mensagem ou o
      contexto de runtime da Compaction, mantenha ambos os níveis de cobertura.
    - Adicione regressões auxiliares focadas para limites puros de roteamento e normalização.
    - Mantenha saudáveis as suítes de integração do runner embutido:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Essas suítes verificam que ids com escopo e o comportamento da Compaction ainda passam
      pelos caminhos reais de `run.ts` / `compact.ts`; testes apenas de helper
      não são um substituto suficiente para esses caminhos de integração.

  </Accordion>

  <Accordion title="Padrões de pool e isolamento do Vitest">

    - A configuração base do Vitest usa `threads` por padrão.
    - A configuração compartilhada do Vitest fixa `isolate: false` e usa o
      runner não isolado nas configs de projetos raiz, e2e e live.
    - A lane UI raiz mantém seu setup `jsdom` e optimizer, mas roda no
      runner compartilhado não isolado também.
    - Cada shard de `pnpm test` herda os mesmos padrões `threads` + `isolate: false`
      da configuração compartilhada do Vitest.
    - `scripts/run-vitest.mjs` adiciona `--no-maglev` por padrão para processos Node filhos do Vitest
      para reduzir churn de compilação do V8 durante grandes execuções locais.
      Defina `OPENCLAW_VITEST_ENABLE_MAGLEV=1` para comparar com o
      comportamento padrão do V8.

  </Accordion>

  <Accordion title="Iteração local rápida">

    - `pnpm changed:lanes` mostra quais lanes arquiteturais um diff aciona.
    - O hook de pre-commit é apenas de formatação. Ele refaz o stage dos arquivos formatados e
      não executa lint, typecheck nem testes.
    - Execute `pnpm check:changed` explicitamente antes de handoff ou push quando
      precisar do gate local inteligente. Mudanças públicas de Plugin SDK e contrato de plugin
      incluem uma passada de validação de extension.
    - `pnpm test:changed` roteia por lanes com escopo quando os caminhos alterados
      mapeiam claramente para uma suíte menor.
    - `pnpm test:max` e `pnpm test:changed:max` mantêm o mesmo comportamento
      de roteamento, apenas com um limite maior de workers.
    - O autoescalonamento local de workers é intencionalmente conservador e recua
      quando a carga média do host já está alta, para que múltiplas execuções concorrentes
      do Vitest causem menos dano por padrão.
    - A configuração base do Vitest marca os arquivos de projetos/configuração como
      `forceRerunTriggers`, para que reexecuções em modo changed permaneçam corretas quando o wiring dos testes muda.
    - A configuração mantém `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado em
      hosts compatíveis; defina `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se quiser
      um local explícito de cache para profiling direto.

  </Accordion>

  <Accordion title="Depuração de desempenho">

    - `pnpm test:perf:imports` habilita relatórios de duração de importação do Vitest mais
      saída de detalhamento de importação.
    - `pnpm test:perf:imports:changed` restringe a mesma visualização de profiling a
      arquivos alterados desde `origin/main`.
    - Quando um teste quente ainda gasta a maior parte do tempo em importações de inicialização,
      mantenha dependências pesadas atrás de uma interface local estreita `*.runtime.ts` e
      faça mock dessa interface diretamente em vez de importar profundamente helpers de runtime apenas
      para passá-los via `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compara o
      `test:changed` roteado com o caminho nativo do projeto raiz para aquele diff commitado
      e imprime tempo total mais RSS máximo no macOS.
    - `pnpm test:perf:changed:bench -- --worktree` faz benchmark da árvore suja atual
      roteando a lista de arquivos alterados por
      `scripts/test-projects.mjs` e a config raiz do Vitest.
    - `pnpm test:perf:profile:main` grava um perfil de CPU da thread principal para
      overhead de inicialização e transformação do Vitest/Vite.
    - `pnpm test:perf:profile:runner` grava perfis de CPU+heap do runner para a
      suíte unitária com paralelismo de arquivos desabilitado.

  </Accordion>
</AccordionGroup>

### Estabilidade (gateway)

- Comando: `pnpm test:stability:gateway`
- Configuração: `vitest.gateway.config.ts`, forçada para um worker
- Escopo:
  - Inicia um Gateway loopback real com diagnósticos habilitados por padrão
  - Conduz churn sintético de mensagens, memória e payload grande do gateway pelo caminho de evento de diagnóstico
  - Consulta `diagnostics.stability` pela RPC WS do Gateway
  - Cobre helpers de persistência do bundle de estabilidade de diagnósticos
  - Garante que o recorder permaneça limitado, amostras sintéticas de RSS fiquem abaixo do orçamento de pressão e profundidades de fila por sessão escoem de volta para zero
- Expectativas:
  - Seguro para CI e sem chaves
  - Lane estreita para acompanhamento de regressão de estabilidade, não um substituto da suíte completa do Gateway

### E2E (smoke do gateway)

- Comando: `pnpm test:e2e`
- Configuração: `vitest.e2e.config.ts`
- Arquivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` e testes E2E de Plugin agrupado em `extensions/`
- Padrões de runtime:
  - Usa `threads` do Vitest com `isolate: false`, em linha com o restante do repositório.
  - Usa workers adaptativos (CI: até 2, local: 1 por padrão).
  - Executa em modo silencioso por padrão para reduzir overhead de I/O no console.
- Substituições úteis:
  - `OPENCLAW_E2E_WORKERS=<n>` para forçar a contagem de workers (limitada a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para reabilitar saída detalhada no console.
- Escopo:
  - Comportamento end-to-end de várias instâncias do gateway
  - Superfícies WebSocket/HTTP, pareamento de Node e rede mais pesada
- Expectativas:
  - Roda em CI (quando habilitado no pipeline)
  - Não exige chaves reais
  - Mais partes móveis do que testes unitários (pode ser mais lento)

### E2E: smoke do backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- Arquivo: `extensions/openshell/src/backend.e2e.test.ts`
- Escopo:
  - Inicia um gateway OpenShell isolado no host via Docker
  - Cria um sandbox a partir de um Dockerfile local temporário
  - Exercita o backend OpenShell do OpenClaw por `sandbox ssh-config` + exec SSH reais
  - Verifica o comportamento remoto-canônico do sistema de arquivos via a ponte fs do sandbox
- Expectativas:
  - Apenas opt-in; não faz parte da execução padrão de `pnpm test:e2e`
  - Exige uma CLI local `openshell` mais um daemon Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` isolados, depois destrói o gateway e o sandbox de teste
- Substituições úteis:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar o teste ao executar manualmente a suíte e2e mais ampla
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apontar para um binário CLI não padrão ou script wrapper

### Live (provedores reais + modelos reais)

- Comando: `pnpm test:live`
- Configuração: `vitest.live.config.ts`
- Arquivos: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` e testes live de Plugin agrupado em `extensions/`
- Padrão: **habilitado** por `pnpm test:live` (define `OPENCLAW_LIVE_TEST=1`)
- Escopo:
  - “Esse provedor/modelo realmente funciona _hoje_ com credenciais reais?”
  - Capturar mudanças de formato de provedor, particularidades de chamada de ferramenta, problemas de autenticação e comportamento de limite de taxa
- Expectativas:
  - Não é estável para CI por design (redes reais, políticas reais de provedores, cotas, indisponibilidades)
  - Custa dinheiro / consome limites de taxa
  - Prefira executar subconjuntos restritos em vez de “tudo”
- Execuções live usam `~/.profile` para encontrar chaves de API ausentes.
- Por padrão, execuções live ainda isolam `HOME` e copiam material de config/autenticação para um home temporário de teste, para que fixtures unitárias não alterem seu `~/.openclaw` real.
- Defina `OPENCLAW_LIVE_USE_REAL_HOME=1` apenas quando quiser intencionalmente que os testes live usem seu diretório home real.
- `pnpm test:live` agora usa por padrão um modo mais silencioso: mantém a saída de progresso `[live] ...`, mas suprime o aviso extra de `~/.profile` e silencia logs de bootstrap do gateway/ruído de Bonjour. Defina `OPENCLAW_LIVE_TEST_QUIET=0` se quiser de volta os logs completos de inicialização.
- Rotação de chave de API (específica por provedor): defina `*_API_KEYS` no formato vírgula/ponto e vírgula ou `*_API_KEY_1`, `*_API_KEY_2` (por exemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou use substituição por live via `OPENCLAW_LIVE_*_KEY`; os testes tentam novamente em respostas de limite de taxa.
- Saída de progresso/Heartbeat:
  - Suítes live agora emitem linhas de progresso em stderr, para que chamadas longas de provedor mostrem atividade visível mesmo quando a captura de console do Vitest está silenciosa.
  - `vitest.live.config.ts` desabilita a interceptação de console do Vitest, então linhas de progresso de provedor/gateway são transmitidas imediatamente durante execuções live.
  - Ajuste Heartbeats diretos de modelo com `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajuste Heartbeats de gateway/sonda com `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Qual suíte devo executar?

Use esta tabela de decisão:

- Editando lógica/testes: execute `pnpm test` (e `pnpm test:coverage` se mudou muita coisa)
- Tocando rede do gateway / protocolo WS / pareamento: adicione `pnpm test:e2e`
- Depurando “meu bot caiu” / falhas específicas de provedor / chamada de ferramenta: execute um `pnpm test:live` restrito

## Testes live (com toque de rede)

Para a matriz live de modelos, smokes de backend CLI, smokes ACP, harness
app-server do Codex e todos os testes live de provedor de mídia (Deepgram, BytePlus, ComfyUI, imagem,
música, vídeo, media harness) — além do tratamento de credenciais para execuções live — consulte
[Testes — suítes live](/pt-BR/help/testing-live).

## Executores Docker (verificações opcionais “funciona em Linux”)

Esses executores Docker se dividem em dois grupos:

- Executores live-model: `test:docker:live-models` e `test:docker:live-gateway` executam apenas o arquivo live correspondente à sua chave de perfil dentro da imagem Docker do repositório (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando seu diretório local de config e workspace (e carregando `~/.profile` se montado). Os entrypoints locais correspondentes são `test:live:models-profiles` e `test:live:gateway-profiles`.
- Os executores Docker live usam por padrão um limite smoke menor para que uma varredura Docker completa continue prática:
  `test:docker:live-models` usa por padrão `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa por padrão `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Substitua essas variáveis de ambiente quando
  quiser explicitamente a varredura exaustiva maior.
- `test:docker:all` gera a imagem Docker live uma vez via `test:docker:live-build`, depois a reutiliza para as lanes Docker live. Ele também gera uma imagem compartilhada `scripts/e2e/Dockerfile` via `test:docker:e2e-build` e a reutiliza para os executores smoke em container E2E que exercitam o app gerado. O agregado usa um agendador local ponderado: `OPENCLAW_DOCKER_ALL_PARALLELISM` controla slots de processo, enquanto limites de recurso evitam que lanes pesadas live, de instalação npm e de múltiplos serviços comecem todas ao mesmo tempo. Os padrões são 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ajuste `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` apenas quando o host Docker tiver mais folga. O runner executa um preflight do Docker por padrão, remove containers E2E obsoletos do OpenClaw, imprime status a cada 30 segundos, armazena tempos bem-sucedidos das lanes em `.artifacts/docker-tests/lane-timings.json` e usa esses tempos para iniciar primeiro as lanes mais longas em execuções posteriores. Use `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir o manifesto ponderado de lanes sem gerar nem executar Docker.
- Executores smoke em container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` e `test:docker:config-reload` inicializam um ou mais containers reais e verificam caminhos de integração de nível superior.

Os executores Docker live-model também fazem bind-mount apenas dos homes de autenticação CLI necessários (ou de todos os compatíveis quando a execução não está restringida), depois os copiam para o home do container antes da execução, para que OAuth de CLI externa possa atualizar tokens sem alterar o armazenamento de autenticação do host:

- Modelos diretos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke de bind ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; cobre Claude, Codex e Gemini por padrão, com cobertura estrita de OpenCode via `pnpm test:docker:live-acp-bind:opencode`)
- Smoke de backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke de harness app-server do Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live do Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Assistente de onboarding (TTY, scaffold completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke de onboarding/canal/agente com tarball npm: `pnpm test:docker:npm-onboard-channel-agent` instala globalmente o tarball empacotado do OpenClaw em Docker, configura OpenAI por onboarding com ref env mais Telegram por padrão, verifica se o doctor repara dependências de runtime de Plugin ativadas e executa um turno de agente simulado da OpenAI. Reutilize um tarball pré-gerado com `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignore a nova geração no host com `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ou troque de canal com `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke de instalação global com Bun: `bash scripts/e2e/bun-global-install-smoke.sh` empacota a árvore atual, instala com `bun install -g` em um home isolado e verifica se `openclaw infer image providers --json` retorna provedores de imagem agrupados em vez de travar. Reutilize um tarball pré-gerado com `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignore a build do host com `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ou copie `dist/` de uma imagem Docker já gerada com `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker do instalador: `bash scripts/test-install-sh-docker.sh` compartilha um único cache npm entre seus containers root, update e direct-npm. O smoke de update usa por padrão npm `latest` como baseline estável antes de atualizar para o tarball candidato. Verificações do instalador sem root mantêm um cache npm isolado para que entradas de cache de propriedade do root não ocultem o comportamento de instalação local do usuário. Defina `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` para reutilizar o cache root/update/direct-npm em reexecuções locais.
- O CI de Install Smoke ignora a atualização global direct-npm duplicada com `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; execute o script localmente sem essa env quando precisar de cobertura de `npm install -g` direto.
- Smoke de CLI para exclusão de agentes com workspace compartilhado: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) gera a imagem do Dockerfile raiz por padrão, prepara dois agentes com um workspace em um home de container isolado, executa `agents delete --json` e verifica JSON válido mais o comportamento de retenção do workspace. Reutilize a imagem de install-smoke com `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Rede do Gateway (dois containers, autenticação WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Regressão mínima de reasoning para `web_search` do OpenAI Responses: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) executa um servidor OpenAI simulado pelo Gateway, verifica que `web_search` eleva `reasoning.effort` de `minimal` para `low`, depois força a rejeição do schema do provedor e verifica se o detalhe bruto aparece nos logs do Gateway.
- Ponte de canal MCP (Gateway preparado + bridge stdio + smoke bruto de frame de notificação do Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Ferramentas MCP do pacote Pi (servidor MCP stdio real + smoke de allow/deny do perfil Pi embutido): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Limpeza MCP de Cron/subagent (Gateway real + desmontagem de processo filho MCP stdio após execuções isoladas de Cron e subagent one-shot): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke de instalação + alias `/plugin` + semântica de reinício do pacote Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
- Smoke de atualização de Plugin sem alterações: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke de metadados de recarga de configuração: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Dependências de runtime de Plugin agrupado: `pnpm test:docker:bundled-channel-deps` gera por padrão uma pequena imagem Docker de runner, gera e empacota o OpenClaw uma vez no host e então monta esse tarball em cada cenário de instalação Linux. Reutilize a imagem com `OPENCLAW_SKIP_DOCKER_BUILD=1`, ignore a nova build do host após uma build local recente com `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` ou aponte para um tarball existente com `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. O agregado Docker completo pré-empacota esse tarball uma vez, depois fragmenta as verificações de canal agrupado em lanes independentes, incluindo lanes separadas de atualização para Telegram, Discord, Slack, Feishu, memory-lancedb e ACPX. Use `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` para restringir a matriz de canais ao executar diretamente a lane agrupada, ou `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` para restringir o cenário de atualização. A lane também verifica se `channels.<id>.enabled=false` e `plugins.entries.<id>.enabled=false` suprimem reparos de doctor/dependência de runtime.
- Restrinja dependências de runtime de Plugin agrupado durante a iteração desabilitando cenários não relacionados, por exemplo:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Para gerar previamente e reutilizar manualmente a imagem compartilhada do app gerado:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Substituições de imagem específicas da suíte, como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, ainda prevalecem quando definidas. Quando `OPENCLAW_SKIP_DOCKER_BUILD=1` aponta para uma imagem compartilhada remota, os scripts fazem pull dela se ainda não estiver local. Os testes Docker de QR e instalador mantêm seus próprios Dockerfiles porque validam comportamento de pacote/instalação, e não o runtime compartilhado do app gerado.

Os executores Docker live-model também fazem bind-mount do checkout atual como somente leitura e
o preparam em um workdir temporário dentro do container. Isso mantém a imagem de runtime
enxuta, mas ainda executa o Vitest contra seu código-fonte/configuração local exato.
A etapa de preparação ignora caches locais grandes e saídas de build de apps, como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e diretórios locais de app `.build` ou
saída do Gradle, para que execuções Docker live não gastem minutos copiando
artefatos específicos da máquina.
Eles também definem `OPENCLAW_SKIP_CHANNELS=1`, para que sondas live do gateway não iniciem
workers reais de canal de Telegram/Discord/etc. dentro do container.
`test:docker:live-models` ainda executa `pnpm test:live`, então repasse
`OPENCLAW_LIVE_GATEWAY_*` também quando precisar restringir ou excluir cobertura
live do gateway dessa lane Docker.
`test:docker:openwebui` é um smoke de compatibilidade de nível mais alto: ele inicia um
container Gateway do OpenClaw com os endpoints HTTP compatíveis com OpenAI habilitados,
inicia um container fixado do Open WebUI contra esse gateway, faz login pelo
Open WebUI, verifica se `/api/models` expõe `openclaw/default`, depois envia uma
requisição de chat real pelo proxy `/api/chat/completions` do Open WebUI.
A primeira execução pode ser visivelmente mais lenta porque o Docker pode precisar baixar a
imagem do Open WebUI e o Open WebUI pode precisar concluir sua própria configuração de cold start.
Essa lane espera uma chave live de modelo utilizável, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` por padrão) é a forma principal de fornecê-la em execuções Dockerizadas.
Execuções bem-sucedidas imprimem um pequeno payload JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` é intencionalmente determinístico e não precisa de uma
conta real de Telegram, Discord ou iMessage. Ele inicializa um container Gateway
preparado, inicia um segundo container que executa `openclaw mcp serve`, depois
verifica descoberta de conversa roteada, leituras de transcript, metadados de anexos,
comportamento da fila de eventos live, roteamento de envio de saída e notificações
de canal + permissão no estilo Claude pela bridge MCP stdio real. A verificação
de notificação inspeciona diretamente os frames MCP stdio brutos, para que o smoke valide o que a
bridge realmente emite, e não apenas o que um SDK específico de cliente expõe.
`test:docker:pi-bundle-mcp-tools` é determinístico e não precisa de uma chave live
de modelo. Ele gera a imagem Docker do repositório, inicia um servidor de sonda MCP stdio real
dentro do container, materializa esse servidor pelo runtime MCP do pacote Pi embutido,
executa a ferramenta e depois verifica se `coding` e `messaging` mantêm ferramentas
`bundle-mcp`, enquanto `minimal` e `tools.deny: ["bundle-mcp"]` as filtram.
`test:docker:cron-mcp-cleanup` é determinístico e não precisa de uma chave live
de modelo. Ele inicia um Gateway preparado com um servidor de sonda MCP stdio real, executa um
turno de Cron isolado e um turno filho one-shot de `/subagents spawn`, depois verifica
se o processo filho MCP é encerrado após cada execução.

Smoke manual de thread ACP em linguagem natural (não CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantenha esse script para fluxos de regressão/depuração. Ele pode ser necessário novamente para validação de roteamento de thread ACP, então não o exclua.

Variáveis de ambiente úteis:

- `OPENCLAW_CONFIG_DIR=...` (padrão: `~/.openclaw`) montado em `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (padrão: `~/.openclaw/workspace`) montado em `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (padrão: `~/.profile`) montado em `/home/node/.profile` e carregado antes de executar os testes
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar apenas variáveis de ambiente carregadas de `OPENCLAW_PROFILE_FILE`, usando diretórios temporários de config/workspace e sem mounts externos de autenticação de CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (padrão: `~/.cache/openclaw/docker-cli-tools`) montado em `/home/node/.npm-global` para instalações CLI em cache dentro do Docker
- Diretórios/arquivos externos de autenticação CLI em `$HOME` são montados como somente leitura em `/host-auth...`, depois copiados para `/home/node/...` antes do início dos testes
  - Diretórios padrão: `.minimax`
  - Arquivos padrão: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Execuções com provedor restrito montam apenas os diretórios/arquivos necessários inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Substitua manualmente com `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` ou uma lista separada por vírgulas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para restringir a execução
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar provedores dentro do container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar uma imagem `openclaw:local-live` existente em reexecuções que não precisem de nova build
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para garantir que credenciais venham do armazenamento do profile (não de env)
- `OPENCLAW_OPENWEBUI_MODEL=...` para escolher o modelo exposto pelo gateway para o smoke do Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para substituir o prompt de verificação de nonce usado pelo smoke do Open WebUI
- `OPENWEBUI_IMAGE=...` para substituir a tag fixada da imagem do Open WebUI

## Sanidade da documentação

Execute verificações de docs após editar documentação: `pnpm check:docs`.
Execute a validação completa de âncoras do Mintlify quando também precisar de verificações de títulos na página: `pnpm docs:check-links:anchors`.

## Regressão offline (segura para CI)

Estas são regressões de “pipeline real” sem provedores reais:

- Chamada de ferramenta do Gateway (OpenAI simulado, gateway real + loop do agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistente do Gateway (WS `wizard.start`/`wizard.next`, grava config + autenticação aplicada): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Avaliações de confiabilidade do agente (Skills)

Já temos alguns testes seguros para CI que se comportam como “avaliações de confiabilidade do agente”:

- Chamada simulada de ferramenta pelo gateway real + loop do agente (`src/gateway/gateway.test.ts`).
- Fluxos end-to-end do assistente que validam wiring de sessão e efeitos de configuração (`src/gateway/gateway.test.ts`).

O que ainda falta para Skills (consulte [Skills](/pt-BR/tools/skills)):

- **Tomada de decisão:** quando Skills estão listadas no prompt, o agente escolhe a Skill certa (ou evita as irrelevantes)?
- **Conformidade:** o agente lê `SKILL.md` antes de usar e segue as etapas/args exigidos?
- **Contratos de fluxo:** cenários de vários turnos que verifiquem ordem de ferramentas, manutenção do histórico da sessão e limites de sandbox.

Avaliações futuras devem permanecer determinísticas primeiro:

- Um runner de cenários usando provedores simulados para verificar chamadas de ferramenta + ordem, leituras de arquivo de Skill e wiring de sessão.
- Uma pequena suíte de cenários focados em Skill (usar vs evitar, controle, injeção de prompt).
- Avaliações live opcionais (opt-in, controladas por env) apenas depois que a suíte segura para CI estiver implementada.

## Testes de contrato (forma de Plugin e canal)

Testes de contrato verificam se cada Plugin e canal registrado está em conformidade com seu
contrato de interface. Eles iteram sobre todos os Plugins descobertos e executam um conjunto de
verificações de forma e comportamento. A lane unitária padrão `pnpm test`
deliberadamente ignora esses arquivos compartilhados de interface e smoke; execute os comandos de contrato explicitamente
quando tocar em superfícies compartilhadas de canal ou provedor.

### Comandos

- Todos os contratos: `pnpm test:contracts`
- Apenas contratos de canal: `pnpm test:contracts:channels`
- Apenas contratos de provedor: `pnpm test:contracts:plugins`

### Contratos de canal

Localizados em `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma básica do plugin (id, nome, capacidades)
- **setup** - Contrato do assistente de configuração
- **session-binding** - Comportamento de vínculo de sessão
- **outbound-payload** - Estrutura do payload de mensagem
- **inbound** - Tratamento de mensagem recebida
- **actions** - Handlers de ação do canal
- **threading** - Tratamento de ID de thread
- **directory** - API de diretório/roster
- **group-policy** - Aplicação da política de grupo

### Contratos de status de provedor

Localizados em `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondas de status do canal
- **registry** - Forma do registro de Plugin

### Contratos de provedor

Localizados em `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato do fluxo de autenticação
- **auth-choice** - Escolha/seleção de autenticação
- **catalog** - API do catálogo de modelos
- **discovery** - Descoberta de Plugin
- **loader** - Carregamento de Plugin
- **runtime** - Runtime do provedor
- **shape** - Forma/interface do Plugin
- **wizard** - Assistente de configuração

### Quando executar

- Após alterar exports ou subpaths do plugin-sdk
- Após adicionar ou modificar um canal ou Plugin de provedor
- Após refatorar o registro ou a descoberta de Plugins

Testes de contrato rodam em CI e não exigem chaves de API reais.

## Adicionando regressões (orientação)

Quando você corrige um problema de provedor/modelo descoberto em live:

- Adicione uma regressão segura para CI, se possível (provedor simulado/stub ou capture a transformação exata do formato da requisição)
- Se for inerentemente apenas live (limites de taxa, políticas de autenticação), mantenha o teste live restrito e opt-in por variáveis de ambiente
- Prefira atingir a menor camada que capture o bug:
  - bug de conversão/replay de requisição do provedor → teste de modelos diretos
  - bug de sessão/histórico/pipeline de ferramenta do gateway → smoke live do gateway ou teste mock seguro para CI do gateway
- Proteção para travessia de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva um alvo amostrado por classe de SecretRef a partir dos metadados do registro (`listSecretTargetRegistryEntries()`), depois verifica se ids de exec de segmento de travessia são rejeitados.
  - Se você adicionar uma nova família de destino SecretRef `includeInPlan` em `src/secrets/target-registry-data.ts`, atualize `classifyTargetClass` nesse teste. O teste falha intencionalmente em ids de destino não classificados para que novas classes não sejam ignoradas silenciosamente.

## Relacionado

- [Testing live](/pt-BR/help/testing-live)
- [CI](/pt-BR/ci)
