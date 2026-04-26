---
read_when:
    - Executando testes localmente ou na CI
    - Adicionando regressões para bugs de modelo/provider
    - Depurando o comportamento do Gateway + do agente
summary: 'Kit de testes: suítes unit/e2e/live, runners Docker e o que cada teste cobre'
title: Testes
x-i18n:
    generated_at: "2026-04-26T11:31:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 46c01493284511d99c37a18fc695cc0af19f87eb6d99eb2ef1beec331c290155
    source_path: help/testing.md
    workflow: 15
---

O OpenClaw tem três suítes Vitest (unit/integration, e2e, live) e um pequeno conjunto
de runners Docker. Este documento é um guia de "como testamos":

- O que cada suíte cobre (e o que deliberadamente _não_ cobre).
- Quais comandos executar para fluxos de trabalho comuns (local, pré-push, depuração).
- Como os testes live descobrem credenciais e selecionam modelos/providers.
- Como adicionar regressões para problemas reais de modelo/provider.

## Início rápido

Na maioria dos dias:

- Gate completo (esperado antes do push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Execução local mais rápida da suíte completa em uma máquina folgada: `pnpm test:max`
- Loop de watch direto do Vitest: `pnpm test:watch`
- O direcionamento direto por arquivo agora também roteia caminhos de extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefira execuções direcionadas primeiro quando estiver iterando sobre uma única falha.
- Site de QA com Docker: `pnpm qa:lab:up`
- Lane de QA com VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando você altera testes ou quer confiança extra:

- Gate de cobertura: `pnpm test:coverage`
- Suíte E2E: `pnpm test:e2e`

Ao depurar providers/modelos reais (requer credenciais reais):

- Suíte live (modelos + sondas de ferramenta/imagem do Gateway): `pnpm test:live`
- Direcione um único arquivo live de forma silenciosa: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Varredura live de modelos com Docker: `pnpm test:docker:live-models`
  - Cada modelo selecionado agora executa um turno de texto mais uma pequena sonda no estilo leitura de arquivo.
    Modelos cujos metadados anunciam entrada `image` também executam um pequeno turno de imagem.
    Desative as sondas extras com `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` ou
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` ao isolar falhas de provider.
  - Cobertura na CI: os workflows diários `OpenClaw Scheduled Live And E2E Checks` e manuais
    `OpenClaw Release Checks` ambos chamam o workflow reutilizável live/E2E com
    `include_live_suites: true`, que inclui jobs separados da matriz Docker live de modelos
    fragmentados por provider.
  - Para reexecuções focadas na CI, dispare `OpenClaw Live And E2E Checks (Reusable)`
    com `include_live_suites: true` e `live_models_only: true`.
  - Adicione novos segredos de provider de alto sinal em `scripts/ci-hydrate-live-auth.sh`
    mais `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` e seus
    chamadores agendados/de release.
- Smoke nativo de chat vinculado do Codex: `pnpm test:docker:live-codex-bind`
  - Executa uma lane live Docker contra o caminho do app-server Codex, vincula uma
    DM sintética do Slack com `/codex bind`, exercita `/codex fast` e
    `/codex permissions`, depois verifica que uma resposta simples e um anexo de imagem
    passam pelo binding nativo do Plugin em vez de ACP.
- Smoke do harness do app-server Codex: `pnpm test:docker:live-codex-harness`
  - Executa turnos de agente do Gateway pelo harness do app-server Codex de propriedade do Plugin,
    verifica `/codex status` e `/codex models` e, por padrão, exercita sondas de imagem,
    Cron MCP, subagente e Guardian. Desative a sonda de subagente com
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` ao isolar outras falhas do
    app-server Codex. Para uma verificação focada de subagente, desative as outras sondas:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Isso termina após a sonda de subagente, a menos que
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` esteja definido.
- Smoke do comando de resgate Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Verificação opcional belt-and-suspenders da superfície do comando de resgate do canal de mensagens.
    Exercita `/crestodian status`, enfileira uma mudança persistente de modelo,
    responde `/crestodian yes` e verifica o caminho de escrita em audit/config.
- Smoke Docker do planejador Crestodian: `pnpm test:docker:crestodian-planner`
  - Executa o Crestodian em um contêiner sem config com um Claude CLI falso em `PATH`
    e verifica que o fallback do planejador difuso se traduz em uma escrita de config tipada auditada.
- Smoke Docker da primeira execução do Crestodian: `pnpm test:docker:crestodian-first-run`
  - Começa com um diretório de estado do OpenClaw vazio, roteia `openclaw` puro para
    o Crestodian, aplica escritas de setup/model/agent/Plugin do Discord + SecretRef,
    valida a config e verifica entradas de auditoria. O mesmo caminho de setup Ring 0
    também é coberto no QA Lab por
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke de custo Moonshot/Kimi: com `MOONSHOT_API_KEY` definido, execute
  `openclaw models list --provider moonshot --json`, depois execute um
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolado contra `moonshot/kimi-k2.6`. Verifique se o JSON informa Moonshot/K2.6 e se a
  transcrição do assistente armazena `usage.cost` normalizado.

Dica: quando você precisa apenas de um caso com falha, prefira restringir testes live por meio das variáveis env de allowlist descritas abaixo.

## Runners específicos de QA

Esses comandos ficam ao lado das suítes principais de teste quando você precisa do realismo do QA-lab:

A CI executa o QA Lab em workflows dedicados. `Parity gate` roda em PRs correspondentes e
em execução manual com providers simulados. `QA-Lab - All Lanes` roda à noite em
`main` e por execução manual com o parity gate simulado, a lane live do Matrix e a
lane live do Telegram gerenciada pelo Convex como jobs paralelos. `OpenClaw Release Checks`
executa as mesmas lanes antes da aprovação de release.

- `pnpm openclaw qa suite`
  - Executa cenários de QA apoiados no repositório diretamente no host.
  - Executa vários cenários selecionados em paralelo por padrão com workers de
    Gateway isolados. `qa-channel` usa por padrão concorrência 4 (limitada pela
    contagem de cenários selecionados). Use `--concurrency <count>` para ajustar a
    quantidade de workers, ou `--concurrency 1` para a antiga lane serial.
  - Sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando
    quiser artefatos sem código de saída de falha.
  - Oferece suporte aos modos de provider `live-frontier`, `mock-openai` e `aimock`.
    `aimock` inicia um servidor local de provider baseado em AIMock para cobertura experimental
    de fixture e mock de protocolo sem substituir a lane `mock-openai`
    com reconhecimento de cenário.
- `pnpm openclaw qa suite --runner multipass`
  - Executa a mesma suíte de QA dentro de uma VM Linux descartável do Multipass.
  - Mantém o mesmo comportamento de seleção de cenário que `qa suite` no host.
  - Reutiliza as mesmas flags de seleção de provider/modelo que `qa suite`.
  - Execuções live encaminham as entradas de autenticação de QA compatíveis que fazem sentido para o guest:
    chaves de provider baseadas em env, o caminho da config de provider live de QA e `CODEX_HOME`
    quando presente.
  - Diretórios de saída devem permanecer sob a raiz do repositório para que o guest possa gravar de volta por meio
    do workspace montado.
  - Grava o relatório + resumo normais de QA, além de logs do Multipass em
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia o site de QA com Docker para trabalho de QA no estilo operator.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Gera um tarball npm a partir do checkout atual, instala-o globalmente no
    Docker, executa onboarding não interativo com chave de API OpenAI, configura
    Telegram por padrão, verifica se habilitar o Plugin instala dependências de runtime sob demanda,
    executa doctor e executa um turno local de agente contra um endpoint OpenAI simulado.
  - Use `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para executar a mesma
    lane de instalação empacotada com Discord.
- `pnpm test:docker:session-runtime-context`
  - Executa um smoke determinístico Docker do app compilado para transcrições de
    contexto de runtime incorporado. Verifica que o contexto oculto de runtime do OpenClaw é persistido como
    uma mensagem personalizada não exibida em vez de vazar para o turno visível do usuário,
    então injeta um JSONL de sessão quebrado afetado e verifica se
    `openclaw doctor --fix` o reescreve para a branch ativa com backup.
- `pnpm test:docker:npm-telegram-live`
  - Instala um pacote OpenClaw publicado no Docker, executa onboarding do pacote instalado,
    configura Telegram por meio da CLI instalada e então reutiliza a lane live Telegram QA
    com esse pacote instalado como o Gateway SUT.
  - O padrão é `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`.
  - Usa as mesmas credenciais env do Telegram ou a mesma fonte de credenciais Convex que
    `pnpm openclaw qa telegram`. Para automação de CI/release, defina
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` mais
    `OPENCLAW_QA_CONVEX_SITE_URL` e o segredo de role. Se
    `OPENCLAW_QA_CONVEX_SITE_URL` e um segredo de role do Convex estiverem presentes na CI,
    o wrapper Docker seleciona Convex automaticamente.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` substitui o
    `OPENCLAW_QA_CREDENTIAL_ROLE` compartilhado apenas para essa lane.
  - O GitHub Actions expõe essa lane como o workflow manual de mantenedor
    `NPM Telegram Beta E2E`. Ele não roda em merge. O workflow usa o ambiente
    `qa-live-shared` e leases de credenciais CI do Convex.
- `pnpm test:docker:bundled-channel-deps`
  - Empacota e instala a build atual do OpenClaw no Docker, inicia o Gateway
    com OpenAI configurado e então habilita canais/Plugins incluídos no pacote por meio de
    edições de config.
  - Verifica se a descoberta de setup deixa ausentes as dependências de runtime de Plugin não configurado,
    se a primeira execução configurada do Gateway ou doctor instala as dependências de runtime
    de cada Plugin incluído no pacote sob demanda e se uma segunda reinicialização não
    reinstala dependências que já foram ativadas.
  - Também instala uma baseline npm antiga conhecida, habilita Telegram antes de executar
    `openclaw update --tag <candidate>` e verifica se o
    doctor pós-atualização do candidato repara dependências de runtime de canais incluídos no pacote sem
    reparo pós-install do lado do harness.
- `pnpm test:parallels:npm-update`
  - Executa o smoke nativo de atualização de instalação empacotada em guests do Parallels. Cada
    plataforma selecionada primeiro instala o pacote baseline solicitado, depois executa o
    comando `openclaw update` instalado no mesmo guest e verifica a versão instalada,
    status da atualização, prontidão do Gateway e um turno local de agente.
  - Use `--platform macos`, `--platform windows` ou `--platform linux` ao
    iterar em um único guest. Use `--json` para o caminho do artefato de resumo e o
    status de cada lane.
  - A lane OpenAI usa `openai/gpt-5.5` para a prova live de turno de agente por
    padrão. Passe `--model <provider/model>` ou defina
    `OPENCLAW_PARALLELS_OPENAI_MODEL` quando quiser validar deliberadamente outro
    modelo OpenAI.
  - Envolva execuções locais longas em um timeout do host para que travamentos do transporte do Parallels não
    consumam o restante da janela de testes:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - O script grava logs aninhados de lane em `/tmp/openclaw-parallels-npm-update.*`.
    Inspecione `windows-update.log`, `macos-update.log` ou `linux-update.log`
    antes de supor que o wrapper externo travou.
  - A atualização no Windows pode gastar de 10 a 15 minutos em doctor/reparo de dependências de runtime
    pós-atualização em um guest frio; isso ainda é saudável quando o log npm aninhado
    está avançando.
  - Não execute esse wrapper agregado em paralelo com lanes individuais de smoke do Parallels
    macOS, Windows ou Linux. Eles compartilham estado de VM e podem colidir em
    restauração de snapshot, serviço de pacote ou estado do Gateway no guest.
  - A prova pós-atualização executa a superfície normal de Plugin incluído no pacote porque
    fachadas de capacidade como fala, geração de imagem e compreensão de
    mídia são carregadas por APIs de runtime incluídas no pacote mesmo quando o turno do agente
    em si só verifica uma resposta de texto simples.

- `pnpm openclaw qa aimock`
  - Inicia apenas o servidor local AIMock provider para smoke testing direto de protocolo.
- `pnpm openclaw qa matrix`
  - Executa a lane live QA do Matrix contra um homeserver Tuwunel descartável baseado em Docker.
  - Esse host de QA hoje é apenas para repositório/dev. Instalações empacotadas do OpenClaw não incluem
    `qa-lab`, então não expõem `openclaw qa`.
  - Checkouts do repositório carregam o runner incluído no pacote diretamente; não é necessário
    um passo separado de instalação de Plugin.
  - Provisiona três usuários temporários do Matrix (`driver`, `sut`, `observer`) mais uma sala privada, e então inicia um processo filho do Gateway de QA com o Plugin Matrix real como transporte SUT.
  - Usa por padrão a imagem estável fixada do Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Substitua com `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` quando precisar testar outra imagem.
  - O Matrix não expõe flags compartilhadas de fonte de credenciais porque a lane provisiona usuários descartáveis localmente.
  - Grava um relatório QA do Matrix, resumo, artefato de eventos observados e log combinado de stdout/stderr em `.artifacts/qa-e2e/...`.
  - Emite progresso por padrão e impõe um timeout rígido de execução com `OPENCLAW_QA_MATRIX_TIMEOUT_MS` (padrão 30 minutos). A limpeza é limitada por `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS`, e falhas incluem o comando de recuperação `docker compose ... down --remove-orphans`.
- `pnpm openclaw qa telegram`
  - Executa a lane live QA do Telegram contra um grupo privado real usando os tokens de bot driver e SUT vindos de env.
  - Requer `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. O id do grupo deve ser o id numérico do chat do Telegram.
  - Oferece suporte a `--credential-source convex` para credenciais compartilhadas em pool. Use o modo env por padrão, ou defina `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por leases em pool.
  - Sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando
    quiser artefatos sem código de saída de falha.
  - Requer dois bots distintos no mesmo grupo privado, com o bot SUT expondo um nome de usuário do Telegram.
  - Para observação estável entre bots, ative o modo Bot-to-Bot Communication Mode no `@BotFather` para ambos os bots e garanta que o bot driver possa observar o tráfego de bots do grupo.
  - Grava um relatório QA do Telegram, resumo e artefato de mensagens observadas em `.artifacts/qa-e2e/...`. Cenários de resposta incluem RTT da solicitação de envio do driver até a resposta observada do SUT.

As lanes de transporte live compartilham um contrato padrão para que novos transportes não derivem:

`qa-channel` continua sendo a suíte ampla de QA sintética e não faz parte da matriz de cobertura de transporte live.

| Lane     | Canary | Controle por menção | Bloco por allowlist | Resposta de nível superior | Retomada após reinício | Seguimento em thread | Isolamento de thread | Observação de reação | Comando help |
| -------- | ------ | ------------------- | ------------------- | -------------------------- | ---------------------- | -------------------- | -------------------- | -------------------- | ------------ |
| Matrix   | x      | x                   | x                   | x                          | x                      | x                    | x                    | x                    |              |
| Telegram | x      |                     |                     |                            |                        |                      |                      |                      | x            |

### Credenciais compartilhadas do Telegram via Convex (v1)

Quando `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) é ativado para
`openclaw qa telegram`, o QA lab adquire um lease exclusivo de um pool com backend Convex, envia heartbeats
desse lease enquanto a lane está em execução e libera o lease no desligamento.

Scaffold de referência do projeto Convex:

- `qa/convex-credential-broker/`

Variáveis de ambiente obrigatórias:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por exemplo `https://your-deployment.convex.site`)
- Um segredo para a role selecionada:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Seleção de role de credencial:
  - CLI: `--credential-role maintainer|ci`
  - Padrão por env: `OPENCLAW_QA_CREDENTIAL_ROLE` (o padrão é `ci` na CI, `maintainer` fora dela)

Variáveis de ambiente opcionais:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (padrão `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (padrão `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (padrão `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (padrão `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (padrão `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de rastreamento opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URLs Convex `http://` em loopback para desenvolvimento apenas local.

`OPENCLAW_QA_CONVEX_SITE_URL` deve usar `https://` em operação normal.

Comandos administrativos de mantenedor (adicionar/remover/listar pool) exigem
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` especificamente.

Auxiliares CLI para mantenedores:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Use `doctor` antes de execuções live para verificar a URL do site Convex, segredos do broker,
prefixo de endpoint, timeout HTTP e alcance de admin/list sem imprimir
valores secretos. Use `--json` para saída legível por máquina em scripts e utilitários de CI.

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
- `POST /admin/add` (somente segredo de mantenedor)
  - Requisição: `{ kind, actorId, payload, note?, status? }`
  - Sucesso: `{ status: "ok", credential }`
- `POST /admin/remove` (somente segredo de mantenedor)
  - Requisição: `{ credentialId, actorId }`
  - Sucesso: `{ status: "ok", changed, credential }`
  - Proteção de lease ativo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (somente segredo de mantenedor)
  - Requisição: `{ kind?, status?, includePayload?, limit? }`
  - Sucesso: `{ status: "ok", credentials, count }`

Formato do payload para o tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` deve ser uma string numérica de id de chat do Telegram.
- `admin/add` valida esse formato para `kind: "telegram"` e rejeita payloads malformados.

### Adicionando um canal ao QA

Adicionar um canal ao sistema markdown de QA exige exatamente duas coisas:

1. Um adaptador de transporte para o canal.
2. Um pacote de cenários que exercite o contrato do canal.

Não adicione uma nova raiz de comando de QA de nível superior quando o host compartilhado `qa-lab` puder
ser o dono do fluxo.

`qa-lab` é dono da mecânica compartilhada do host:

- a raiz de comando `openclaw qa`
- inicialização e desligamento da suíte
- concorrência de workers
- gravação de artefatos
- geração de relatório
- execução de cenários
- aliases de compatibilidade para cenários `qa-channel` mais antigos

Plugins de runner são donos do contrato de transporte:

- como `openclaw qa <runner>` é montado sob a raiz compartilhada `qa`
- como o Gateway é configurado para esse transporte
- como a prontidão é verificada
- como eventos de entrada são injetados
- como mensagens de saída são observadas
- como transcrições e estado de transporte normalizado são expostos
- como ações apoiadas no transporte são executadas
- como reset ou limpeza específicos do transporte são tratados

A barra mínima de adoção para um novo canal é:

1. Manter `qa-lab` como dono da raiz compartilhada `qa`.
2. Implementar o runner de transporte na costura compartilhada do host `qa-lab`.
3. Manter a mecânica específica de transporte dentro do Plugin do runner ou do harness do canal.
4. Montar o runner como `openclaw qa <runner>` em vez de registrar uma raiz de comando concorrente.
   Plugins de runner devem declarar `qaRunners` em `openclaw.plugin.json` e exportar um array correspondente `qaRunnerCliRegistrations` de `runtime-api.ts`.
   Mantenha `runtime-api.ts` leve; a CLI lazy e a execução do runner devem permanecer atrás de entrypoints separados.
5. Criar ou adaptar cenários markdown em diretórios temáticos `qa/scenarios/`.
6. Usar os auxiliares genéricos de cenário para novos cenários.
7. Manter aliases de compatibilidade existentes funcionando, a menos que o repositório esteja fazendo uma migração intencional.

A regra de decisão é estrita:

- Se o comportamento pode ser expresso uma vez em `qa-lab`, coloque-o em `qa-lab`.
- Se o comportamento depende de um transporte de canal, mantenha-o no Plugin desse runner ou no harness do Plugin.
- Se um cenário precisa de uma nova capacidade que mais de um canal pode usar, adicione um auxiliar genérico em vez de um branch específico de canal em `suite.ts`.
- Se um comportamento só faz sentido para um transporte, mantenha o cenário específico de transporte e deixe isso explícito no contrato do cenário.

Nomes preferidos de auxiliares genéricos para novos cenários:

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

Trabalho em novos canais deve usar os nomes genéricos de auxiliares.
Aliases de compatibilidade existem para evitar uma migração flag day, não como modelo para
criação de novos cenários.

## Suítes de teste (o que roda onde)

Pense nas suítes como “realismo crescente” (e aumento de instabilidade/custo):

### Unit / integration (padrão)

- Comando: `pnpm test`
- Config: execuções sem alvo usam o conjunto fragmentado `vitest.full-*.config.ts` e podem expandir shards de vários projetos em configs por projeto para agendamento em paralelo
- Arquivos: inventários core/unit em `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` e os testes node permitidos de `ui` cobertos por `vitest.unit.config.ts`
- Escopo:
  - Testes unitários puros
  - Testes de integração no processo (autenticação do Gateway, roteamento, ferramentas, parsing, config)
  - Regressões determinísticas para bugs conhecidos
- Expectativas:
  - Roda na CI
  - Não requer chaves reais
  - Deve ser rápido e estável

<AccordionGroup>
  <Accordion title="Projetos, shards e lanes com escopo">

    - Execuções sem alvo de `pnpm test` usam doze configs menores de shard (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) em vez de um único processo gigante do projeto-raiz nativo. Isso reduz o pico de RSS em máquinas carregadas e evita que trabalho de auto-reply/extension sufoque suítes não relacionadas.
    - `pnpm test --watch` ainda usa o grafo de projetos nativo da raiz `vitest.config.ts`, porque um loop de watch multi-shard não é prático.
    - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` roteiam primeiro alvos explícitos de arquivo/diretório por lanes com escopo, então `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar o custo de inicialização completo do projeto-raiz.
    - `pnpm test:changed` expande caminhos alterados no git para as mesmas lanes com escopo quando o diff toca apenas arquivos de código/teste roteáveis; edições de config/setup ainda fazem fallback para a reexecução ampla do projeto-raiz.
    - `pnpm check:changed` é o gate local inteligente normal para trabalho estreito. Ele classifica o diff em core, testes core, extensions, testes de extension, apps, docs, metadados de release, tooling live Docker e tooling, e então executa as lanes correspondentes de typecheck/lint/test. Mudanças públicas no Plugin SDK e no contrato de plugin incluem uma passada de validação de extension porque extensions dependem desses contratos do core. Bumps de versão apenas em metadados de release executam verificações direcionadas de versão/config/dependência raiz em vez da suíte completa, com uma proteção que rejeita mudanças em package fora do campo de versão de nível superior.
    - Edições no harness ACP live Docker executam um gate local focado: sintaxe shell para os scripts de autenticação live Docker, dry-run do agendador live Docker, testes unitários de bind ACP e testes da extension ACPX. Mudanças em `package.json` são incluídas apenas quando o diff está limitado a `scripts["test:docker:live-*"]`; edições de dependência, export, versão e outras superfícies do package ainda usam as proteções mais amplas.
    - Testes unitários leves de import vindos de agentes, comandos, plugins, auxiliares de auto-reply, `plugin-sdk` e áreas similares de utilitário puro passam pela lane `unit-fast`, que ignora `test/setup-openclaw-runtime.ts`; arquivos com estado/runtime pesado permanecem nas lanes existentes.
    - Arquivos-fonte auxiliares selecionados de `plugin-sdk` e `commands` também mapeiam execuções em modo changed para testes irmãos explícitos nessas lanes leves, para que edições em auxiliares evitem reexecutar toda a suíte pesada daquele diretório.
    - `auto-reply` tem buckets dedicados para auxiliares core de nível superior, testes de integração `reply.*` de nível superior e a subárvore `src/auto-reply/reply/**`. A CI ainda divide a subárvore reply em shards de agent-runner, dispatch e commands/state-routing para que um bucket pesado de import não seja dono de toda a cauda Node.

  </Accordion>

  <Accordion title="Cobertura do runner incorporado">

    - Quando você altera entradas de descoberta da ferramenta de mensagem ou contexto
      de runtime de Compaction, mantenha ambos os níveis de cobertura.
    - Adicione regressões focadas em auxiliares para limites puros de roteamento e normalização.
    - Mantenha saudáveis as suítes de integração do runner incorporado:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Essas suítes verificam que ids com escopo e comportamento de Compaction ainda fluem
      pelos caminhos reais `run.ts` / `compact.ts`; testes apenas de auxiliar
      não são substituto suficiente para esses caminhos de integração.

  </Accordion>

  <Accordion title="Pool do Vitest e padrões de isolamento">

    - A config base do Vitest usa `threads` por padrão.
    - A config compartilhada do Vitest fixa `isolate: false` e usa o
      runner não isolado nas configs de projetos-raiz, e2e e live.
    - A lane UI da raiz mantém seu setup e otimizador `jsdom`, mas também roda no
      runner compartilhado não isolado.
    - Cada shard de `pnpm test` herda os mesmos padrões
      `threads` + `isolate: false` da config compartilhada do Vitest.
    - `scripts/run-vitest.mjs` adiciona `--no-maglev` por padrão aos processos
      filhos Node do Vitest para reduzir churn de compilação do V8 durante grandes execuções locais.
      Defina `OPENCLAW_VITEST_ENABLE_MAGLEV=1` para comparar com o
      comportamento padrão do V8.

  </Accordion>

  <Accordion title="Iteração local rápida">

    - `pnpm changed:lanes` mostra quais lanes arquiteturais um diff aciona.
    - O hook de pre-commit é apenas de formatação. Ele re-stageia arquivos
      formatados e não executa lint, typecheck ou testes.
    - Execute `pnpm check:changed` explicitamente antes de handoff ou push quando
      precisar do gate local inteligente. Mudanças públicas no Plugin SDK e no plugin-contract
      incluem uma passada de validação de extension.
    - `pnpm test:changed` roteia por lanes com escopo quando os caminhos alterados
      mapeiam claramente para uma suíte menor.
    - `pnpm test:max` e `pnpm test:changed:max` mantêm o mesmo comportamento de roteamento,
      apenas com limite maior de workers.
    - O autoescalonamento local de workers é intencionalmente conservador e recua
      quando a média de carga do host já está alta, então múltiplas execuções
      concorrentes do Vitest causam menos dano por padrão.
    - A config base do Vitest marca os arquivos de projetos/config como
      `forceRerunTriggers`, então reexecuções em modo changed permanecem corretas quando a
      fiação de teste muda.
    - A config mantém `OPENCLAW_VITEST_FS_MODULE_CACHE` ativado em hosts
      compatíveis; defina `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se quiser
      um local explícito de cache para profiling direto.

  </Accordion>

  <Accordion title="Depuração de desempenho">

    - `pnpm test:perf:imports` ativa relatório de duração de import do Vitest mais
      saída de breakdown de imports.
    - `pnpm test:perf:imports:changed` aplica a mesma visualização de profiling aos
      arquivos alterados desde `origin/main`.
    - Dados de timing de shard são gravados em `.artifacts/vitest-shard-timings.json`.
      Execuções da config completa usam o caminho da config como chave; shards da CI por
      padrão include-pattern acrescentam o nome do shard para que shards filtrados possam ser acompanhados
      separadamente.
    - Quando um teste quente ainda gasta a maior parte do tempo em imports de inicialização,
      mantenha dependências pesadas atrás de uma costura local estreita `*.runtime.ts` e
      simule essa costura diretamente em vez de fazer deep-import de auxiliares de runtime apenas
      para passá-los por `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compara o roteamento de
      `test:changed` com o caminho nativo do projeto-raiz para esse diff commitado
      e imprime wall time mais max RSS no macOS.
    - `pnpm test:perf:changed:bench -- --worktree` faz benchmark da árvore suja atual
      roteando a lista de arquivos alterados por
      `scripts/test-projects.mjs` e pela config raiz do Vitest.
    - `pnpm test:perf:profile:main` grava um perfil de CPU da thread principal para
      overhead de inicialização e transformação do Vitest/Vite.
    - `pnpm test:perf:profile:runner` grava perfis de CPU+heap do runner para a
      suíte unitária com paralelismo por arquivo desativado.

  </Accordion>
</AccordionGroup>

### Estabilidade (Gateway)

- Comando: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, forçado para um worker
- Escopo:
  - Inicia um Gateway loopback real com diagnósticos ativados por padrão
  - Conduz churn sintético de mensagens, memória e payload grande do gateway pelo caminho do evento de diagnóstico
  - Consulta `diagnostics.stability` pelo WS RPC do Gateway
  - Cobre auxiliares de persistência do pacote de estabilidade de diagnóstico
  - Garante que o registrador permaneça limitado, que amostras sintéticas de RSS fiquem sob o orçamento de pressão e que profundidades de fila por sessão drenem de volta para zero
- Expectativas:
  - Seguro para CI e sem chaves
  - Lane estreita para acompanhamento de regressão de estabilidade, não substitui a suíte completa do Gateway

### E2E (smoke do Gateway)

- Comando: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- Arquivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` e testes E2E de Plugins incluídos no pacote em `extensions/`
- Padrões de runtime:
  - Usa `threads` do Vitest com `isolate: false`, combinando com o restante do repositório.
  - Usa workers adaptativos (CI: até 2, local: 1 por padrão).
  - Roda em modo silencioso por padrão para reduzir overhead de I/O de console.
- Substituições úteis:
  - `OPENCLAW_E2E_WORKERS=<n>` para forçar a quantidade de workers (limitada a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para reativar saída detalhada no console.
- Escopo:
  - Comportamento end-to-end do Gateway com várias instâncias
  - Superfícies WebSocket/HTTP, pareamento de node e networking mais pesado
- Expectativas:
  - Roda na CI (quando ativado no pipeline)
  - Não requer chaves reais
  - Tem mais partes móveis do que testes unitários (pode ser mais lento)

### E2E: smoke do backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- Arquivo: `extensions/openshell/src/backend.e2e.test.ts`
- Escopo:
  - Inicia um Gateway OpenShell isolado no host via Docker
  - Cria um sandbox a partir de um Dockerfile local temporário
  - Exercita o backend OpenShell do OpenClaw por meio de `sandbox ssh-config` + SSH exec reais
  - Verifica o comportamento de sistema de arquivos canônico remoto pela bridge fs do sandbox
- Expectativas:
  - Apenas opt-in; não faz parte da execução padrão `pnpm test:e2e`
  - Requer um CLI `openshell` local mais um daemon Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` isolados e então destrói o Gateway de teste e o sandbox
- Substituições úteis:
  - `OPENCLAW_E2E_OPENSHELL=1` para ativar o teste ao executar manualmente a suíte e2e mais ampla
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apontar para um binário CLI não padrão ou script wrapper

### Live (providers reais + modelos reais)

- Comando: `pnpm test:live`
- Config: `vitest.live.config.ts`
- Arquivos: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` e testes live de Plugins incluídos no pacote em `extensions/`
- Padrão: **ativado** por `pnpm test:live` (define `OPENCLAW_LIVE_TEST=1`)
- Escopo:
  - “Esse provider/modelo realmente funciona _hoje_ com credenciais reais?”
  - Detectar mudanças de formato de provider, peculiaridades de chamada de ferramenta, problemas de autenticação e comportamento de limite de taxa
- Expectativas:
  - Por design, não é estável para CI (redes reais, políticas reais de provider, cotas, indisponibilidades)
  - Custa dinheiro / usa limites de taxa
  - Prefira executar subconjuntos reduzidos em vez de “tudo”
- Execuções live fazem source de `~/.profile` para obter chaves de API ausentes.
- Por padrão, execuções live ainda isolam `HOME` e copiam material de config/auth para um diretório home temporário de teste para que fixtures unitários não possam alterar seu `~/.openclaw` real.
- Defina `OPENCLAW_LIVE_USE_REAL_HOME=1` apenas quando quiser intencionalmente que testes live usem seu diretório home real.
- `pnpm test:live` agora usa por padrão um modo mais silencioso: mantém a saída de progresso `[live] ...`, mas suprime o aviso extra sobre `~/.profile` e silencia logs de bootstrap do Gateway/chatter do Bonjour. Defina `OPENCLAW_LIVE_TEST_QUIET=0` se quiser os logs completos de inicialização de volta.
- Rotação de chave de API (específica por provider): defina `*_API_KEYS` com formato separado por vírgula/ponto e vírgula ou `*_API_KEY_1`, `*_API_KEY_2` (por exemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou substituição por live via `OPENCLAW_LIVE_*_KEY`; os testes tentam novamente em respostas de limite de taxa.
- Saída de progresso/heartbeat:
  - Suítes live agora emitem linhas de progresso em stderr para que chamadas longas de provider fiquem visivelmente ativas mesmo quando a captura de console do Vitest está silenciosa.
  - `vitest.live.config.ts` desativa a interceptação de console do Vitest para que linhas de progresso do provider/Gateway sejam transmitidas imediatamente durante execuções live.
  - Ajuste heartbeats de modelo direto com `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajuste heartbeats de Gateway/sonda com `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Qual suíte devo executar?

Use esta tabela de decisão:

- Editando lógica/testes: execute `pnpm test` (e `pnpm test:coverage` se mudou muita coisa)
- Tocando networking do Gateway / protocolo WS / pareamento: adicione `pnpm test:e2e`
- Depurando “meu bot caiu” / falhas específicas de provider / chamada de ferramenta: execute um `pnpm test:live` reduzido

## Testes live (que tocam a rede)

Para a matriz live de modelos, smokes de backend CLI, smokes de ACP, harness do
app-server Codex e todos os testes live de provider de mídia (Deepgram, BytePlus, ComfyUI, image,
music, video, harness de mídia) — além do tratamento de credenciais para execuções live — veja
[Testes — suítes live](/pt-BR/help/testing-live).

## Runners Docker (verificações opcionais de "funciona em Linux")

Esses runners Docker se dividem em dois grupos:

- Runners live de modelos: `test:docker:live-models` e `test:docker:live-gateway` executam apenas o arquivo live correspondente à sua profile-key dentro da imagem Docker do repositório (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando seu diretório local de config e workspace (e fazendo source de `~/.profile` se montado). Os entrypoints locais correspondentes são `test:live:models-profiles` e `test:live:gateway-profiles`.
- Runners live Docker usam por padrão um limite de smoke menor para que uma varredura Docker completa permaneça prática:
  `test:docker:live-models` usa por padrão `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa por padrão `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Substitua essas env vars quando
  quiser explicitamente a varredura exaustiva maior.
- `test:docker:all` compila a imagem Docker live uma vez por meio de `test:docker:live-build`, então a reutiliza para as lanes live Docker. Também compila uma imagem compartilhada `scripts/e2e/Dockerfile` por meio de `test:docker:e2e-build` e a reutiliza para os runners smoke em contêiner E2E que exercitam o app compilado. O agregador usa um agendador local ponderado: `OPENCLAW_DOCKER_ALL_PARALLELISM` controla os slots de processo, enquanto limites de recursos impedem que lanes pesadas live, de instalação npm e de múltiplos serviços iniciem todas ao mesmo tempo. Os padrões são 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ajuste `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` apenas quando o host Docker tiver mais folga. O runner executa um preflight Docker por padrão, remove contêineres E2E obsoletos do OpenClaw, imprime status a cada 30 segundos, armazena os timings das lanes bem-sucedidas em `.artifacts/docker-tests/lane-timings.json` e usa esses timings para iniciar primeiro as lanes mais longas em execuções posteriores. Use `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir o manifesto ponderado das lanes sem compilar nem executar Docker.
- Runners smoke de contêiner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` e `test:docker:config-reload` inicializam um ou mais contêineres reais e verificam caminhos de integração de nível superior.

Os runners Docker live de modelos também fazem bind-mount apenas dos diretórios home de autenticação CLI necessários (ou de todos os compatíveis quando a execução não está reduzida), depois os copiam para o diretório home do contêiner antes da execução para que OAuth de CLI externo possa atualizar tokens sem alterar o armazenamento de autenticação do host:

- Modelos diretos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke de bind ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; cobre Claude, Codex e Gemini por padrão, com cobertura estrita de Droid/OpenCode via `pnpm test:docker:live-acp-bind:droid` e `pnpm test:docker:live-acp-bind:opencode`)
- Smoke de backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke do harness do app-server Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live do Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Assistente de onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke de onboarding/canal/agente com tarball npm: `pnpm test:docker:npm-onboard-channel-agent` instala globalmente no Docker o tarball OpenClaw empacotado, configura OpenAI via onboarding por ref env mais Telegram por padrão, verifica se doctor repara dependências de runtime de Plugin ativadas e executa um turno de agente OpenAI simulado. Reutilize um tarball pré-compilado com `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignore a recompilação do host com `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ou troque de canal com `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke de troca de canal de update: `pnpm test:docker:update-channel-switch` instala globalmente no Docker o tarball OpenClaw empacotado, muda do pacote `stable` para `dev` git, verifica que o canal persistido e o Plugin pós-update funcionam, então volta para o pacote `stable` e verifica o status do update.
- Smoke de contexto de runtime de sessão: `pnpm test:docker:session-runtime-context` verifica a persistência oculta da transcrição de contexto de runtime mais o reparo do doctor de branches afetados de reescrita duplicada de prompt.
- Smoke de instalação global Bun: `bash scripts/e2e/bun-global-install-smoke.sh` empacota a árvore atual, instala com `bun install -g` em um diretório home isolado e verifica se `openclaw infer image providers --json` retorna providers de image incluídos no pacote em vez de travar. Reutilize um tarball pré-compilado com `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignore a compilação do host com `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ou copie `dist/` de uma imagem Docker já compilada com `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker do instalador: `bash scripts/test-install-sh-docker.sh` compartilha um único cache npm entre seus contêineres root, update e direct-npm. O smoke de update usa por padrão npm `latest` como baseline estável antes de atualizar para o tarball candidato. Verificações do instalador sem root mantêm um cache npm isolado para que entradas de cache com dono root não mascarem o comportamento de instalação local do usuário. Defina `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` para reutilizar o cache root/update/direct-npm em reexecuções locais.
- A CI Install Smoke ignora o update global direct-npm duplicado com `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; execute o script localmente sem essa env quando precisar da cobertura direta de `npm install -g`.
- Smoke CLI de exclusão de workspace compartilhado de agentes: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) compila por padrão a imagem Dockerfile raiz, inicializa dois agentes com um workspace em um diretório home isolado do contêiner, executa `agents delete --json` e verifica JSON válido mais o comportamento de retenção do workspace. Reutilize a imagem install-smoke com `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Gateway networking (dois contêineres, autenticação WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Smoke de snapshot CDP do Browser: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) compila a imagem E2E de origem mais uma camada Chromium, inicia Chromium com CDP bruto, executa `browser doctor --deep` e verifica se snapshots de role do CDP cobrem URLs de link, elementos clicáveis promovidos por cursor, refs de iframe e metadados de frame.
- Regressão mínima de reasoning de web_search da OpenAI Responses: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) executa um servidor OpenAI simulado por meio do Gateway, verifica se `web_search` eleva `reasoning.effort` de `minimal` para `low`, então força a rejeição do schema do provider e verifica se o detalhe bruto aparece nos logs do Gateway.
- Bridge de canal MCP (Gateway inicializado + bridge stdio + smoke bruto de frame de notificação Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Ferramentas MCP do bundle Pi (servidor MCP stdio real + smoke de allow/deny do perfil Pi incorporado): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Limpeza MCP de Cron/subagente (Gateway real + encerramento do processo filho stdio MCP após execuções Cron isoladas e subagente one-shot): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke de instalação, instalação/desinstalação do ClawHub, atualizações do marketplace e enable/inspect de bundle Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Defina `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para ignorar o bloco live do ClawHub, ou substitua o pacote padrão com `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` e `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`.
- Smoke de atualização de Plugin sem mudanças: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke de metadados de reload de config: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Dependências de runtime de Plugin incluído no pacote: `pnpm test:docker:bundled-channel-deps` compila por padrão uma pequena imagem runner Docker, compila e empacota o OpenClaw uma vez no host, então monta esse tarball em cada cenário de instalação Linux. Reutilize a imagem com `OPENCLAW_SKIP_DOCKER_BUILD=1`, ignore a recompilação do host após uma build local recente com `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` ou aponte para um tarball existente com `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. O agregador Docker completo pré-empacota esse tarball uma vez, então fragmenta as verificações de canais incluídos no pacote em lanes independentes, incluindo lanes separadas de update para Telegram, Discord, Slack, Feishu, memory-lancedb e ACPX. Use `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` para reduzir a matriz de canais ao executar a lane incluída diretamente, ou `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` para reduzir o cenário de update. A lane também verifica se `channels.<id>.enabled=false` e `plugins.entries.<id>.enabled=false` suprimem reparo de doctor/dependência de runtime.
- Reduza dependências de runtime de Plugins incluídos no pacote durante iteração desativando cenários não relacionados, por exemplo:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Para pré-compilar e reutilizar manualmente a imagem compartilhada do app compilado:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Substituições de imagem específicas da suíte, como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, ainda têm prioridade quando definidas. Quando `OPENCLAW_SKIP_DOCKER_BUILD=1` aponta para uma imagem compartilhada remota, os scripts fazem pull dela se ainda não estiver localmente. Os testes Docker de QR e do instalador mantêm seus próprios Dockerfiles porque validam comportamento de pacote/instalação, não o runtime compartilhado do app compilado.

Os runners Docker live de modelos também fazem bind-mount do checkout atual em modo somente leitura e
o preparam em um workdir temporário dentro do contêiner. Isso mantém a imagem de runtime
enxuta enquanto ainda executa Vitest exatamente contra seu source/config local.
A etapa de preparação ignora caches locais grandes e saídas de build do app, como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e diretórios locais de `.build` do app ou saídas
do Gradle, para que execuções live Docker não gastem minutos copiando
artefatos específicos da máquina.
Eles também definem `OPENCLAW_SKIP_CHANNELS=1` para que sondas live do Gateway não iniciem
workers reais de canais Telegram/Discord/etc. dentro do contêiner.
`test:docker:live-models` ainda executa `pnpm test:live`, então encaminhe também
`OPENCLAW_LIVE_GATEWAY_*` quando precisar restringir ou excluir a cobertura
live do Gateway dessa lane Docker.
`test:docker:openwebui` é um smoke de compatibilidade de nível mais alto: ele inicia um
contêiner Gateway do OpenClaw com endpoints HTTP compatíveis com OpenAI ativados,
inicia um contêiner fixado do Open WebUI contra esse Gateway, faz login pelo
Open WebUI, verifica se `/api/models` expõe `openclaw/default` e então envia uma
requisição de chat real pelo proxy `/api/chat/completions` do Open WebUI.
A primeira execução pode ser perceptivelmente mais lenta porque o Docker pode precisar fazer pull da
imagem do Open WebUI e o Open WebUI pode precisar concluir seu próprio setup de inicialização fria.
Essa lane espera uma chave de modelo live utilizável, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` por padrão) é a forma principal de fornecê-la em execuções com Docker.
Execuções bem-sucedidas imprimem um pequeno payload JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` é intencionalmente determinístico e não precisa de uma
conta real de Telegram, Discord ou iMessage. Ele inicializa um contêiner Gateway
preparado, inicia um segundo contêiner que executa `openclaw mcp serve`, e então
verifica descoberta de conversa roteada, leitura de transcrição, metadados de anexo,
comportamento da fila de eventos live, roteamento de envio de saída e notificações
de canal + permissão no estilo Claude pela bridge MCP stdio real. A verificação de notificação
inspeciona diretamente os frames MCP stdio brutos para que o smoke valide o que a
bridge realmente emite, não apenas o que um SDK cliente específico resolve expor.
`test:docker:pi-bundle-mcp-tools` é determinístico e não precisa de uma chave de
modelo live. Ele compila a imagem Docker do repositório, inicia um servidor de sonda MCP stdio real
dentro do contêiner, materializa esse servidor pelo runtime MCP do bundle Pi incorporado,
executa a ferramenta e então verifica que `coding` e `messaging` mantêm
ferramentas `bundle-mcp`, enquanto `minimal` e `tools.deny: ["bundle-mcp"]` as filtram.
`test:docker:cron-mcp-cleanup` é determinístico e não precisa de uma chave de modelo
live. Ele inicia um Gateway preparado com um servidor de sonda MCP stdio real, executa um
turno Cron isolado e um turno filho one-shot de `/subagents spawn`, então verifica
se o processo filho MCP termina após cada execução.

Smoke manual de thread ACP em linguagem simples (não CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantenha este script para fluxos de trabalho de regressão/depuração. Ele pode voltar a ser necessário para validação de roteamento de thread ACP, então não o exclua.

Variáveis de ambiente úteis:

- `OPENCLAW_CONFIG_DIR=...` (padrão: `~/.openclaw`) montado em `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (padrão: `~/.openclaw/workspace`) montado em `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (padrão: `~/.profile`) montado em `/home/node/.profile` e carregado antes da execução dos testes
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar apenas variáveis de ambiente carregadas de `OPENCLAW_PROFILE_FILE`, usando diretórios temporários de config/workspace e sem mounts externos de autenticação CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (padrão: `~/.cache/openclaw/docker-cli-tools`) montado em `/home/node/.npm-global` para instalações CLI em cache dentro do Docker
- Diretórios/arquivos externos de autenticação CLI sob `$HOME` são montados em modo somente leitura sob `/host-auth...`, depois copiados para `/home/node/...` antes do início dos testes
  - Diretórios padrão: `.minimax`
  - Arquivos padrão: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Execuções reduzidas por provider montam apenas os diretórios/arquivos necessários inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Substitua manualmente com `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` ou uma lista separada por vírgulas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para restringir a execução
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar providers dentro do contêiner
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar uma imagem `openclaw:local-live` existente em reexecuções que não precisam de recompilação
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para garantir que as credenciais venham do armazenamento de perfil (não de env)
- `OPENCLAW_OPENWEBUI_MODEL=...` para escolher o modelo exposto pelo Gateway para o smoke do Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para substituir o prompt de verificação de nonce usado pelo smoke do Open WebUI
- `OPENWEBUI_IMAGE=...` para substituir a tag fixada da imagem Open WebUI

## Sanidade da documentação

Execute verificações de docs após edições em documentação: `pnpm check:docs`.
Execute a validação completa de âncoras do Mintlify quando também precisar verificar headings na página: `pnpm docs:check-links:anchors`.

## Regressão offline (segura para CI)

Estas são regressões de “pipeline real” sem providers reais:

- Chamada de ferramenta do Gateway (OpenAI simulado, Gateway real + loop de agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistente do Gateway (WS `wizard.start`/`wizard.next`, grava config + auth obrigatório): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Avaliações de confiabilidade do agente (Skills)

Já temos alguns testes seguros para CI que se comportam como “avaliações de confiabilidade do agente”:

- Chamada de ferramenta simulada pelo Gateway real + loop de agente (`src/gateway/gateway.test.ts`).
- Fluxos end-to-end do assistente que validam wiring de sessão e efeitos de config (`src/gateway/gateway.test.ts`).

O que ainda falta para Skills (veja [Skills](/pt-BR/tools/skills)):

- **Decisioning:** quando Skills são listados no prompt, o agente escolhe o Skill certo (ou evita os irrelevantes)?
- **Compliance:** o agente lê `SKILL.md` antes do uso e segue os passos/args obrigatórios?
- **Workflow contracts:** cenários de vários turnos que validam ordem de ferramentas, persistência de histórico de sessão e limites de sandbox.

Avaliações futuras devem permanecer determinísticas primeiro:

- Um runner de cenários usando providers simulados para validar chamadas de ferramenta + ordem, leituras de arquivo de Skill e wiring de sessão.
- Uma pequena suíte de cenários focados em Skill (usar vs evitar, gating, injeção de prompt).
- Avaliações live opcionais (opt-in, controladas por env) somente depois que a suíte segura para CI estiver pronta.

## Testes de contrato (formato de Plugin e canal)

Testes de contrato verificam que todo Plugin e canal registrado está em conformidade com seu
contrato de interface. Eles iteram sobre todos os plugins descobertos e executam uma suíte de
validações de formato e comportamento. A lane unitária padrão `pnpm test`
intencionalmente ignora esses arquivos compartilhados de costura e smoke; execute os comandos
de contrato explicitamente quando tocar superfícies compartilhadas de canal ou provider.

### Comandos

- Todos os contratos: `pnpm test:contracts`
- Apenas contratos de canal: `pnpm test:contracts:channels`
- Apenas contratos de provider: `pnpm test:contracts:plugins`

### Contratos de canal

Localizados em `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Formato básico do Plugin (id, nome, capacidades)
- **setup** - Contrato do assistente de setup
- **session-binding** - Comportamento de binding de sessão
- **outbound-payload** - Estrutura de payload de mensagem
- **inbound** - Tratamento de mensagem recebida
- **actions** - Manipuladores de ação do canal
- **threading** - Tratamento de ID de thread
- **directory** - API de diretório/lista
- **group-policy** - Aplicação da política de grupo

### Contratos de status do provider

Localizados em `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondas de status de canal
- **registry** - Formato do registro de Plugin

### Contratos de provider

Localizados em `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato de fluxo de autenticação
- **auth-choice** - Escolha/seleção de autenticação
- **catalog** - API de catálogo de modelos
- **discovery** - Descoberta de Plugin
- **loader** - Carregamento de Plugin
- **runtime** - Runtime do provider
- **shape** - Formato/interface do Plugin
- **wizard** - Assistente de setup

### Quando executar

- Depois de alterar exports ou subpaths do plugin-sdk
- Depois de adicionar ou modificar um canal ou Plugin de provider
- Depois de refatorar registro ou descoberta de Plugin

Os testes de contrato rodam na CI e não exigem chaves de API reais.

## Adicionando regressões (orientação)

Quando você corrigir um problema de provider/modelo descoberto em live:

- Adicione uma regressão segura para CI se possível (provider simulado/stub, ou capture a transformação exata do formato da requisição)
- Se for inerentemente apenas live (limites de taxa, políticas de autenticação), mantenha o teste live estreito e opt-in via env vars
- Prefira mirar na menor camada que capture o bug:
  - bug de conversão/replay de requisição do provider → teste direto de modelos
  - bug de pipeline de sessão/histórico/ferramenta do Gateway → smoke live do Gateway ou teste simulado seguro para CI do Gateway
- Proteção contra travessia de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva um alvo amostrado por classe de SecretRef a partir dos metadados do registro (`listSecretTargetRegistryEntries()`), depois garante que ids exec com segmentos de travessia sejam rejeitados.
  - Se você adicionar uma nova família de alvo SecretRef `includeInPlan` em `src/secrets/target-registry-data.ts`, atualize `classifyTargetClass` nesse teste. O teste falha intencionalmente em ids de alvo não classificados para que novas classes não possam ser ignoradas silenciosamente.

## Relacionado

- [Testes live](/pt-BR/help/testing-live)
- [CI](/pt-BR/ci)
