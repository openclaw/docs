---
read_when:
    - Executando testes localmente ou na CI
    - Adicionando testes de regressão para erros de modelo/provedor
    - Depuração do Gateway + comportamento do agente
summary: 'Kit de testes: suítes unitárias/e2e/live, executores Docker e o que cada teste cobre'
title: Testes
x-i18n:
    generated_at: "2026-05-03T21:34:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7fb57bee958c4e6243f02193a657d7b19ca633c7a27f70eac6b590931390671
    source_path: help/testing.md
    workflow: 16
---

OpenClaw tem três suítes Vitest (unitária/integração, e2e, live) e um pequeno conjunto
de executores Docker. Este documento é um guia de "como testamos":

- O que cada suíte cobre (e o que ela deliberadamente _não_ cobre).
- Quais comandos executar para fluxos de trabalho comuns (local, pré-push, depuração).
- Como os testes live descobrem credenciais e selecionam modelos/provedores.
- Como adicionar regressões para problemas reais de modelo/provedor.

<Note>
**A pilha de QA (qa-lab, qa-channel, lanes de transporte live)** é documentada separadamente:

- [Visão geral de QA](/pt-BR/concepts/qa-e2e-automation) — arquitetura, superfície de comandos, autoria de cenários.
- [QA de matriz](/pt-BR/concepts/qa-matrix) — referência para `pnpm openclaw qa matrix`.
- [Canal de QA](/pt-BR/channels/qa-channel) — o Plugin de transporte sintético usado por cenários respaldados pelo repositório.

Esta página cobre a execução das suítes de testes regulares e dos executores Docker/Parallels. A seção de executores específicos de QA abaixo ([Executores específicos de QA](#qa-specific-runners)) lista as invocações `qa` concretas e aponta de volta para as referências acima.
</Note>

## Início rápido

Na maioria dos dias:

- Gate completo (esperado antes do push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Execução local mais rápida da suíte completa em uma máquina espaçosa: `pnpm test:max`
- Loop de observação direto do Vitest: `pnpm test:watch`
- O direcionamento direto de arquivos agora também roteia caminhos de extensão/canal: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefira execuções direcionadas primeiro quando estiver iterando sobre uma única falha.
- Site de QA respaldado por Docker: `pnpm qa:lab:up`
- Lane de QA respaldada por VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando você toca em testes ou quer confiança extra:

- Gate de cobertura: `pnpm test:coverage`
- Suíte E2E: `pnpm test:e2e`

Ao depurar provedores/modelos reais (requer credenciais reais):

- Suíte live (modelos + sondagens de ferramenta/imagem do Gateway): `pnpm test:live`
- Direcione um arquivo live silenciosamente: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Relatórios de desempenho em tempo de execução: dispare `OpenClaw Performance` com
  `live_gpt54=true` para um turno de agente real `openai/gpt-5.4` ou
  `deep_profile=true` para artefatos de CPU/heap/trace do Kova. Execuções diárias agendadas
  publicam artefatos de lanes mock-provider, deep-profile e GPT 5.4 em
  `openclaw/clawgrit-reports` quando `CLAWGRIT_REPORTS_TOKEN` está configurado. O
  relatório mock-provider também inclui números de inicialização do Gateway no nível de código-fonte, memória,
  pressão de Plugin, loop hello repetido de modelo falso e inicialização da CLI.
- Varredura live de modelos com Docker: `pnpm test:docker:live-models`
  - Cada modelo selecionado agora executa um turno de texto mais uma pequena sondagem no estilo leitura de arquivo.
    Modelos cujos metadados anunciam entrada `image` também executam um pequeno turno de imagem.
    Desative as sondagens extras com `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` ou
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` ao isolar falhas de provedor.
  - Cobertura de CI: `OpenClaw Scheduled Live And E2E Checks` diário e
    `OpenClaw Release Checks` manual chamam o fluxo de trabalho live/E2E reutilizável com
    `include_live_suites: true`, que inclui jobs separados de matriz live de modelos Docker
    fragmentados por provedor.
  - Para reexecuções focadas em CI, dispare `OpenClaw Live And E2E Checks (Reusable)`
    com `include_live_suites: true` e `live_models_only: true`.
  - Adicione novos segredos de provedor de alto sinal a `scripts/ci-hydrate-live-auth.sh`
    mais `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` e seus
    chamadores agendados/de release.
- Smoke de chat vinculado nativo do Codex: `pnpm test:docker:live-codex-bind`
  - Executa uma lane live Docker contra o caminho do app-server do Codex, vincula uma DM sintética
    do Slack com `/codex bind`, exercita `/codex fast` e
    `/codex permissions`, depois verifica uma resposta simples e um anexo de imagem
    roteados pela vinculação nativa do Plugin em vez de ACP.
- Smoke do harness do app-server do Codex: `pnpm test:docker:live-codex-harness`
  - Executa turnos do agente do Gateway pelo harness do app-server do Codex de propriedade do Plugin,
    verifica `/codex status` e `/codex models` e, por padrão, exercita sondagens de imagem,
    cron MCP, subagente e Guardian. Desative a sondagem de subagente com
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` ao isolar outras falhas do app-server
    do Codex. Para uma verificação focada de subagente, desative as outras sondagens:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Isso sai após a sondagem de subagente, a menos que
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` esteja definido.
- Smoke do comando de resgate do Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Verificação opcional de cinto e suspensórios para a superfície de comando de resgate do canal de mensagens.
    Ela exercita `/crestodian status`, enfileira uma alteração persistente de modelo,
    responde `/crestodian yes` e verifica o caminho de gravação de auditoria/configuração.
- Smoke Docker do planejador do Crestodian: `pnpm test:docker:crestodian-planner`
  - Executa o Crestodian em um contêiner sem configuração com uma CLI Claude falsa no `PATH`
    e verifica que o fallback do planejador fuzzy se traduz em uma gravação de configuração tipada auditada.
- Smoke Docker da primeira execução do Crestodian: `pnpm test:docker:crestodian-first-run`
  - Começa a partir de um diretório de estado vazio do OpenClaw, roteia `openclaw` puro para
    o Crestodian, aplica gravações de configuração/modelo/agente/Plugin do Discord + SecretRef,
    valida a configuração e verifica entradas de auditoria. O mesmo caminho de configuração Ring 0 também é
    coberto no QA Lab por
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke de custo Moonshot/Kimi: com `MOONSHOT_API_KEY` definido, execute
  `openclaw models list --provider moonshot --json`, depois execute um
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolado contra `moonshot/kimi-k2.6`. Verifique que o JSON relata Moonshot/K2.6 e que a
  transcrição do assistente armazena `usage.cost` normalizado.

<Tip>
Quando você só precisa de um caso com falha, prefira restringir os testes live por meio das variáveis de ambiente de allowlist descritas abaixo.
</Tip>

## Executores específicos de QA

Estes comandos ficam ao lado das suítes de teste principais quando você precisa do realismo do QA Lab:

O CI executa o QA Lab em fluxos de trabalho dedicados. A paridade agentic fica aninhada sob
`QA-Lab - All Lanes` e validação de release, não em um fluxo de trabalho de PR independente.
A validação ampla deve usar `Full Release Validation` com
`rerun_group=qa-parity` ou o grupo de QA de release-checks. `QA-Lab - All Lanes`
executa todas as noites em `main` e por disparo manual com a lane de paridade mock, lane live
Matrix, lane live Telegram gerenciada pelo Convex e lane live Discord
gerenciada pelo Convex como jobs paralelos. QA agendado e verificações de release passam
`--profile fast` da Matrix explicitamente, enquanto a CLI Matrix e a entrada manual do fluxo de trabalho
permanecem por padrão como `all`; o disparo manual pode fragmentar `all` em jobs
`transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`. `OpenClaw Release
Checks` executa paridade mais as lanes rápidas Matrix e Telegram antes da aprovação de release,
usando `mock-openai/gpt-5.5` para verificações de transporte de release para que permaneçam
determinísticas e evitem a inicialização normal de Plugin de provedor. Esses Gateways de transporte live
desativam a busca de memória; o comportamento de memória permanece coberto pelas suítes de paridade de QA.

Os fragmentos live media de release completo usam
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, que já tem
`ffmpeg` e `ffprobe`. Fragmentos Docker live de modelo/backend usam a imagem compartilhada
`ghcr.io/openclaw/openclaw-live-test:<sha>` criada uma vez por commit selecionado,
depois a puxam com `OPENCLAW_SKIP_DOCKER_BUILD=1` em vez de reconstruir
dentro de cada fragmento.

- `pnpm openclaw qa suite`
  - Executa cenários de QA apoiados pelo repositório diretamente no host.
  - Executa vários cenários selecionados em paralelo por padrão com workers de
    gateway isolados. `qa-channel` usa concorrência 4 por padrão (limitada pela
    contagem de cenários selecionados). Use `--concurrency <count>` para ajustar
    a contagem de workers, ou `--concurrency 1` para a lane serial mais antiga.
  - Sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando você
    quiser artefatos sem um código de saída com falha.
  - Oferece suporte aos modos de provedor `live-frontier`, `mock-openai` e `aimock`.
    `aimock` inicia um servidor de provedor local apoiado por AIMock para cobertura
    experimental de fixture e mock de protocolo sem substituir a lane
    `mock-openai` ciente de cenários.
- `pnpm test:gateway:cpu-scenarios`
  - Executa o benchmark de inicialização do Gateway mais um pequeno pacote de cenários mock do QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) e grava um resumo combinado de observação de CPU
    em `.artifacts/gateway-cpu-scenarios/`.
  - Sinaliza apenas observações sustentadas de CPU alta por padrão (`--cpu-core-warn`
    mais `--hot-wall-warn-ms`), então rajadas curtas de inicialização são registradas como métricas
    sem parecer a regressão de Gateway travado por vários minutos.
  - Usa artefatos `dist` compilados; execute uma build primeiro quando o checkout ainda não
    tiver saída de runtime recente.
- `pnpm openclaw qa suite --runner multipass`
  - Executa a mesma suíte de QA dentro de uma VM Linux descartável do Multipass.
  - Mantém o mesmo comportamento de seleção de cenários que `qa suite` no host.
  - Reutiliza as mesmas flags de seleção de provedor/modelo que `qa suite`.
  - Execuções ao vivo encaminham as entradas de autenticação de QA compatíveis que são práticas para o convidado:
    chaves de provedor baseadas em env, o caminho da configuração de provedor ao vivo de QA e `CODEX_HOME`
    quando presente.
  - Diretórios de saída devem permanecer sob a raiz do repositório para que o convidado possa gravar de volta pelo
    workspace montado.
  - Grava o relatório + resumo normais de QA mais logs do Multipass em
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia o site de QA apoiado por Docker para trabalho de QA no estilo de operador.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Cria um tarball npm a partir do checkout atual, instala globalmente no
    Docker, executa onboarding não interativo de chave de API da OpenAI, configura Telegram
    por padrão, verifica que o runtime do Plugin empacotado carrega sem reparo de dependência
    na inicialização, executa doctor e executa uma rodada de agente local contra um
    endpoint OpenAI mockado.
  - Use `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para executar a mesma lane de instalação empacotada
    com Discord.
- `pnpm test:docker:session-runtime-context`
  - Executa um smoke determinístico em Docker do app compilado para transcrições de contexto de runtime
    embutido. Ele verifica que o contexto oculto de runtime do OpenClaw é persistido como uma
    mensagem customizada sem exibição em vez de vazar para a rodada visível do usuário,
    então semeia uma sessão JSONL quebrada afetada e verifica que
    `openclaw doctor --fix` a reescreve para a branch ativa com um backup.
- `pnpm test:docker:npm-telegram-live`
  - Instala um pacote candidato do OpenClaw no Docker, executa onboarding de pacote instalado,
    configura Telegram pela CLI instalada e então reutiliza a lane de QA ao vivo do Telegram
    com esse pacote instalado como o Gateway SUT.
  - Usa `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` por padrão; defina
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` ou
    `OPENCLAW_CURRENT_PACKAGE_TGZ` para testar um tarball local resolvido em vez de
    instalar pelo registro.
  - Usa as mesmas credenciais env do Telegram ou fonte de credenciais Convex que
    `pnpm openclaw qa telegram`. Para automação de CI/release, defina
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` mais
    `OPENCLAW_QA_CONVEX_SITE_URL` e o segredo da função. Se
    `OPENCLAW_QA_CONVEX_SITE_URL` e um segredo de função Convex estiverem presentes no CI,
    o wrapper Docker seleciona Convex automaticamente.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` substitui o
    `OPENCLAW_QA_CREDENTIAL_ROLE` compartilhado apenas para esta lane.
  - GitHub Actions expõe esta lane como o workflow manual de mantenedor
    `NPM Telegram Beta E2E`. Ele não roda no merge. O workflow usa o
    ambiente `qa-live-shared` e leases de credenciais CI do Convex.
- GitHub Actions também expõe `Package Acceptance` para prova de produto executada em paralelo
  contra um pacote candidato. Ele aceita um ref confiável, especificação npm publicada,
  URL HTTPS de tarball mais SHA-256, ou artefato de tarball de outra execução, faz upload
  do `openclaw-current.tgz` normalizado como `package-under-test`, então executa o
  agendador Docker E2E existente com perfis de lane smoke, package, product, full ou custom.
  Defina `telegram_mode=mock-openai` ou `live-frontier` para executar o
  workflow de QA do Telegram contra o mesmo artefato `package-under-test`.
  - Prova de produto da beta mais recente:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Prova de URL exata de tarball exige um digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Prova de artefato baixa um artefato de tarball de outra execução do Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Empacota e instala a build atual do OpenClaw no Docker, inicia o Gateway
    com OpenAI configurado e então habilita channels/plugins empacotados por edições de config.
  - Verifica que a descoberta de setup deixa Plugins baixáveis não configurados ausentes,
    que o primeiro reparo configurado do doctor instala explicitamente cada Plugin
    baixável ausente e que uma segunda reinicialização não executa reparo oculto de dependência.
  - Também instala uma baseline npm mais antiga conhecida, habilita Telegram antes de executar
    `openclaw update --tag <candidate>` e verifica que o doctor pós-atualização do candidato
    limpa detritos de dependência de Plugin legado sem um reparo postinstall do lado do harness.
- `pnpm test:parallels:npm-update`
  - Executa o smoke nativo de atualização de instalação empacotada em convidados Parallels. Cada
    plataforma selecionada primeiro instala o pacote baseline solicitado, então executa
    o comando `openclaw update` instalado no mesmo convidado e verifica a
    versão instalada, o status de atualização, a prontidão do Gateway e uma rodada de agente local.
  - Use `--platform macos`, `--platform windows` ou `--platform linux` enquanto
    itera em um convidado. Use `--json` para o caminho do artefato de resumo e
    o status por lane.
  - A lane OpenAI usa `openai/gpt-5.5` para a prova de rodada de agente ao vivo por
    padrão. Passe `--model <provider/model>` ou defina
    `OPENCLAW_PARALLELS_OPENAI_MODEL` ao validar deliberadamente outro
    modelo OpenAI.
  - Envolva execuções locais longas em um timeout do host para que travamentos de transporte do Parallels não
    consumam o restante da janela de testes:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - O script grava logs de lane aninhados em `/tmp/openclaw-parallels-npm-update.*`.
    Inspecione `windows-update.log`, `macos-update.log` ou `linux-update.log`
    antes de presumir que o wrapper externo travou.
  - A atualização do Windows pode passar 10 a 15 minutos no doctor pós-atualização e no trabalho de
    atualização de pacote em um convidado frio; isso ainda é saudável quando o log de debug npm
    aninhado está avançando.
  - Não execute este wrapper agregado em paralelo com lanes individuais de smoke do Parallels
    macOS, Windows ou Linux. Elas compartilham estado de VM e podem colidir na
    restauração de snapshot, serviço de pacote ou estado do Gateway convidado.
  - A prova pós-atualização executa a superfície normal de Plugins empacotados porque
    facades de capacidade como fala, geração de imagem e entendimento de mídia
    são carregadas por APIs de runtime empacotadas mesmo quando a própria rodada do agente
    verifica apenas uma resposta de texto simples.

- `pnpm openclaw qa aimock`
  - Inicia apenas o servidor de provedor AIMock local para testes smoke diretos de protocolo.
- `pnpm openclaw qa matrix`
  - Executa a lane de QA ao vivo do Matrix contra um homeserver Tuwunel descartável apoiado por Docker. Apenas checkout de origem — instalações empacotadas não incluem `qa-lab`.
  - CLI completa, catálogo de perfis/cenários, vars de env e layout de artefatos: [QA do Matrix](/pt-BR/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Executa a lane de QA ao vivo do Telegram contra um grupo privado real usando os tokens de bot do driver e do SUT vindos do env.
  - Exige `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. O id do grupo deve ser o id numérico do chat do Telegram.
  - Oferece suporte a `--credential-source convex` para credenciais compartilhadas em pool. Use o modo env por padrão, ou defina `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por leases em pool.
  - Sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando você
    quiser artefatos sem um código de saída com falha.
  - Exige dois bots distintos no mesmo grupo privado, com o bot SUT expondo um username do Telegram.
  - Para observação estável de bot para bot, habilite o Modo de Comunicação Bot-to-Bot em `@BotFather` para ambos os bots e garanta que o bot driver consiga observar tráfego de bots no grupo.
  - Grava um relatório de QA do Telegram, resumo e artefato de mensagens observadas em `.artifacts/qa-e2e/...`. Cenários de resposta incluem RTT desde a requisição de envio do driver até a resposta observada do SUT.

Lanes de transporte ao vivo compartilham um contrato padrão para que novos transportes não divirjam; a matriz de cobertura por lane fica em [visão geral de QA → Cobertura de transporte ao vivo](/pt-BR/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` é a suíte sintética ampla e não faz parte dessa matriz.

### Credenciais compartilhadas do Telegram via Convex (v1)

Quando `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) está habilitado para
`openclaw qa telegram`, o QA lab adquire um lease exclusivo de um pool apoiado por Convex, envia heartbeats
desse lease enquanto a lane está em execução e libera o lease no desligamento.

Scaffold de projeto Convex de referência:

- `qa/convex-credential-broker/`

Vars de env obrigatórias:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por exemplo `https://your-deployment.convex.site`)
- Um segredo para a função selecionada:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Seleção da função de credencial:
  - CLI: `--credential-role maintainer|ci`
  - Padrão env: `OPENCLAW_QA_CREDENTIAL_ROLE` (usa `ci` por padrão no CI, `maintainer` caso contrário)

Vars de env opcionais:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (padrão `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (padrão `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (padrão `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (padrão `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (padrão `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de rastreamento opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URLs Convex `http://` de loopback para desenvolvimento apenas local.

`OPENCLAW_QA_CONVEX_SITE_URL` deve usar `https://` em operação normal.

Comandos administrativos de mantenedor (adicionar/remover/listar pool) exigem
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` especificamente.

Helpers de CLI para mantenedores:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Use `doctor` antes de execuções ao vivo para verificar a URL do site Convex, segredos do broker,
prefixo de endpoint, timeout HTTP e alcance de admin/list sem imprimir
valores secretos. Use `--json` para saída legível por máquina em scripts e
utilitários de CI.

Contrato padrão do endpoint (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Solicitação: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Sucesso: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Esgotado/com nova tentativa: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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
  - Proteção de lease ativo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (somente segredo de mantenedor)
  - Solicitação: `{ kind?, status?, includePayload?, limit? }`
  - Sucesso: `{ status: "ok", credentials, count }`

Formato do payload para o tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` deve ser uma string numérica de id de chat do Telegram.
- `admin/add` valida esse formato para `kind: "telegram"` e rejeita payloads malformados.

### Adicionando um canal ao QA

A arquitetura e os nomes de helpers de cenário para novos adaptadores de canal ficam em [Visão geral de QA → Adicionando um canal](/pt-BR/concepts/qa-e2e-automation#adding-a-channel). O requisito mínimo: implemente o runner de transporte no seam de host compartilhado `qa-lab`, declare `qaRunners` no manifesto do plugin, monte como `openclaw qa <runner>` e crie cenários em `qa/scenarios/`.

## Suites de teste (o que roda onde)

Pense nas suites como “realismo crescente” (e também instabilidade/custo crescentes):

### Unitário / integração (padrão)

- Comando: `pnpm test`
- Configuração: execuções sem alvo específico usam o conjunto de shards `vitest.full-*.config.ts` e podem expandir shards multiprojeto em configurações por projeto para agendamento paralelo
- Arquivos: inventários core/unit em `src/**/*.test.ts`, `packages/**/*.test.ts` e `test/**/*.test.ts`; testes unitários de UI rodam no shard dedicado `unit-ui`
- Escopo:
  - Testes unitários puros
  - Testes de integração no mesmo processo (autenticação do Gateway, roteamento, ferramentas, parsing, configuração)
  - Regressões determinísticas para bugs conhecidos
- Expectativas:
  - Roda em CI
  - Não exige chaves reais
  - Deve ser rápido e estável
  - Testes do resolvedor e do loader de superfície pública devem provar o comportamento amplo de fallback de `api.js` e
    `runtime-api.js` com pequenas fixtures de plugin geradas, não
    APIs de fonte reais de plugins incluídos. Carregamentos reais de API de plugin pertencem a
    suites de contrato/integração de responsabilidade do plugin.

<AccordionGroup>
  <Accordion title="Projetos, shards e lanes com escopo">

    - `pnpm test` sem alvo específico executa doze configurações de shard menores (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) em vez de um único processo nativo gigante do projeto raiz. Isso reduz o pico de RSS em máquinas carregadas e evita que o trabalho de auto-reply/extensões deixe suites não relacionadas sem recursos.
    - `pnpm test --watch` ainda usa o grafo de projeto raiz nativo `vitest.config.ts`, porque um loop de watch com vários shards não é prático.
    - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` encaminham alvos explícitos de arquivo/diretório primeiro por lanes com escopo, então `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar o custo de inicialização completo do projeto raiz.
    - `pnpm test:changed` expande caminhos git alterados em lanes baratas com escopo por padrão: alterações diretas em testes, arquivos `*.test.ts` irmãos, mapeamentos explícitos de fonte e dependentes locais do grafo de importação. Alterações de configuração/setup/package não disparam testes amplos, a menos que você use explicitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` é o gate inteligente normal de checagem local para trabalho estreito. Ele classifica o diff em core, testes de core, extensões, testes de extensão, apps, docs, metadados de release, ferramentas de Docker live e tooling, depois executa os comandos correspondentes de typecheck, lint e guard. Ele não executa testes Vitest; chame `pnpm test:changed` ou `pnpm test <target>` explícito para prova de teste. Bumps de versão somente de metadados de release executam checagens direcionadas de versão/configuração/dependências raiz, com um guard que rejeita alterações de package fora do campo de versão de nível superior.
    - Alterações no harness de Docker live do ACP executam checagens focadas: sintaxe de shell para os scripts de autenticação Docker live e um dry-run do agendador Docker live. Alterações em `package.json` são incluídas somente quando o diff está limitado a `scripts["test:docker:live-*"]`; alterações de dependência, exportação, versão e outra superfície de package ainda usam os guards mais amplos.
    - Testes unitários leves em importações de agents, comandos, plugins, helpers de auto-reply, `plugin-sdk` e áreas semelhantes de utilitários puros passam pela lane `unit-fast`, que pula `test/setup-openclaw-runtime.ts`; arquivos com estado/pesados em runtime permanecem nas lanes existentes.
    - Arquivos-fonte selecionados de helpers de `plugin-sdk` e `commands` também mapeiam execuções em modo alterado para testes irmãos explícitos nessas lanes leves, então alterações em helpers evitam reexecutar a suite pesada completa desse diretório.
    - `auto-reply` tem buckets dedicados para helpers de core de nível superior, testes de integração `reply.*` de nível superior e a subárvore `src/auto-reply/reply/**`. O CI divide ainda mais a subárvore de reply em shards de agent-runner, dispatch e commands/state-routing para que um bucket pesado em importações não concentre toda a cauda de execução do Node.
    - O CI normal de PR/main pula intencionalmente a varredura em lote de extensões e o shard somente de release `agentic-plugins`. A Validação Completa de Release dispara o workflow filho separado de Pré-release de Plugin para essas suites pesadas em plugins/extensões em candidatos a release.

  </Accordion>

  <Accordion title="Cobertura do runner embarcado">

    - Quando você alterar entradas de descoberta de ferramenta de mensagem ou contexto de runtime de Compaction,
      mantenha ambos os níveis de cobertura.
    - Adicione regressões focadas de helpers para limites puros de roteamento e normalização.
    - Mantenha saudáveis as suites de integração do runner embarcado:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Essas suites verificam que ids com escopo e comportamento de Compaction ainda fluem
      pelos caminhos reais `run.ts` / `compact.ts`; testes somente de helpers
      não são substituto suficiente para esses caminhos de integração.

  </Accordion>

  <Accordion title="Pool do Vitest e padrões de isolamento">

    - A configuração base do Vitest usa `threads` por padrão.
    - A configuração compartilhada do Vitest fixa `isolate: false` e usa o
      runner não isolado nos projetos raiz, configurações e2e e live.
    - A lane raiz de UI mantém seu setup `jsdom` e otimizador, mas também roda no
      runner compartilhado não isolado.
    - Cada shard de `pnpm test` herda os mesmos padrões `threads` + `isolate: false`
      da configuração compartilhada do Vitest.
    - `scripts/run-vitest.mjs` adiciona `--no-maglev` por padrão aos processos Node
      filhos do Vitest para reduzir retrabalho de compilação do V8 durante execuções locais grandes.
      Defina `OPENCLAW_VITEST_ENABLE_MAGLEV=1` para comparar com o comportamento padrão do V8.

  </Accordion>

  <Accordion title="Iteração local rápida">

    - `pnpm changed:lanes` mostra quais lanes arquiteturais um diff aciona.
    - O hook de pre-commit é somente de formatação. Ele recoloca arquivos formatados no stage e
      não executa lint, typecheck nem testes.
    - Execute `pnpm check:changed` explicitamente antes da entrega ou push quando você
      precisar do gate inteligente de checagem local.
    - `pnpm test:changed` passa por lanes baratas com escopo por padrão. Use
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` somente quando o agente
      decidir que uma alteração de harness, configuração, package ou contrato realmente precisa de cobertura
      Vitest mais ampla.
    - `pnpm test:max` e `pnpm test:changed:max` mantêm o mesmo comportamento de roteamento,
      apenas com um limite maior de workers.
    - O autoescalonamento local de workers é intencionalmente conservador e recua
      quando a média de carga do host já está alta, então várias execuções
      Vitest concorrentes causam menos impacto por padrão.
    - A configuração base do Vitest marca os projetos/arquivos de configuração como
      `forceRerunTriggers` para que reexecuções em modo alterado permaneçam corretas quando a
      configuração dos testes muda.
    - A configuração mantém `OPENCLAW_VITEST_FS_MODULE_CACHE` ativado em hosts compatíveis;
      defina `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se você quiser
      um local de cache explícito para profiling direto.

  </Accordion>

  <Accordion title="Depuração de desempenho">

    - `pnpm test:perf:imports` ativa relatórios de duração de importação do Vitest, além de
      saída de detalhamento de importações.
    - `pnpm test:perf:imports:changed` limita a mesma visão de profiling aos
      arquivos alterados desde `origin/main`.
    - Dados de tempo dos shards são gravados em `.artifacts/vitest-shard-timings.json`.
      Execuções de configuração inteira usam o caminho da configuração como chave; shards de CI
      por padrão de inclusão acrescentam o nome do shard para que shards filtrados possam ser acompanhados
      separadamente.
    - Quando um teste de alto custo ainda passa a maior parte do tempo em importações de inicialização,
      mantenha dependências pesadas atrás de um seam local estreito `*.runtime.ts` e
      simule esse seam diretamente, em vez de fazer importação profunda de helpers de runtime apenas
      para repassá-los por `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compara o
      `test:changed` roteado com o caminho nativo do projeto raiz para esse diff commitado
      e imprime tempo de parede mais RSS máximo no macOS.
    - `pnpm test:perf:changed:bench -- --worktree` faz benchmark da árvore
      suja atual encaminhando a lista de arquivos alterados por
      `scripts/test-projects.mjs` e pela configuração raiz do Vitest.
    - `pnpm test:perf:profile:main` grava um perfil de CPU da thread principal para
      startup do Vitest/Vite e overhead de transform.
    - `pnpm test:perf:profile:runner` grava perfis de CPU+heap do runner para a
      suite unitária com paralelismo de arquivos desativado.

  </Accordion>
</AccordionGroup>

### Estabilidade (Gateway)

- Comando: `pnpm test:stability:gateway`
- Configuração: `vitest.gateway.config.ts`, forçada a um worker
- Escopo:
  - Inicia um Gateway de loopback real com diagnósticos ativados por padrão
  - Simula carga sintética de mensagens do Gateway, memória e payloads grandes pelo caminho de eventos de diagnóstico
  - Consulta `diagnostics.stability` via RPC WS do Gateway
  - Cobre helpers de persistência do pacote de estabilidade de diagnóstico
  - Confirma que o gravador permanece limitado, amostras sintéticas de RSS ficam abaixo do orçamento de pressão e profundidades de fila por sessão drenam de volta para zero
- Expectativas:
  - Seguro para CI e sem chaves
  - Lane estreita para acompanhamento de regressão de estabilidade, não substituto para a suite completa do Gateway

### E2E (smoke do Gateway)

- Comando: `pnpm test:e2e`
- Configuração: `vitest.e2e.config.ts`
- Arquivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` e testes E2E de plugins incluídos em `extensions/`
- Padrões de runtime:
  - Usa `threads` do Vitest com `isolate: false`, correspondendo ao restante do repo.
  - Usa workers adaptativos (CI: até 2, local: 1 por padrão).
  - Roda em modo silencioso por padrão para reduzir overhead de I/O do console.
- Overrides úteis:
  - `OPENCLAW_E2E_WORKERS=<n>` para forçar a contagem de workers (limitada a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para reativar saída verbose do console.
- Escopo:
  - Comportamento end-to-end de Gateway multi-instância
  - Superfícies WebSocket/HTTP, pareamento de Node e networking mais pesado
- Expectativas:
  - Roda em CI (quando habilitado no pipeline)
  - Não exige chaves reais
  - Mais partes móveis do que testes unitários (pode ser mais lento)

### E2E: smoke do back-end OpenShell

- Comando: `pnpm test:e2e:openshell`
- Arquivo: `extensions/openshell/src/backend.e2e.test.ts`
- Escopo:
  - Inicia um Gateway OpenShell isolado no host via Docker
  - Cria uma sandbox a partir de um Dockerfile local temporário
  - Exercita o backend OpenShell do OpenClaw sobre `sandbox ssh-config` real + execução SSH
  - Verifica o comportamento de sistema de arquivos canônico remoto por meio da ponte fs da sandbox
- Expectativas:
  - Somente opt-in; não faz parte da execução padrão de `pnpm test:e2e`
  - Requer uma CLI local `openshell` mais um daemon Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` isolados e depois destrói o Gateway de teste e a sandbox
- Substituições úteis:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar o teste ao executar manualmente a suíte e2e mais ampla
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apontar para um binário de CLI não padrão ou um script wrapper

### Ao vivo (provedores reais + modelos reais)

- Comando: `pnpm test:live`
- Configuração: `vitest.live.config.ts`
- Arquivos: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` e testes ao vivo de Plugins incluídos em `extensions/`
- Padrão: **habilitado** por `pnpm test:live` (define `OPENCLAW_LIVE_TEST=1`)
- Escopo:
  - “Este provedor/modelo realmente funciona _hoje_ com credenciais reais?”
  - Capturar mudanças de formato de provedor, peculiaridades de chamadas de ferramenta, problemas de autenticação e comportamento de limite de taxa
- Expectativas:
  - Não é estável para CI por design (redes reais, políticas reais de provedores, cotas, indisponibilidades)
  - Custa dinheiro / usa limites de taxa
  - Prefira executar subconjuntos reduzidos em vez de “tudo”
- Execuções ao vivo carregam `~/.profile` para obter chaves de API ausentes.
- Por padrão, execuções ao vivo ainda isolam `HOME` e copiam material de configuração/autenticação para um diretório home temporário de teste para que fixtures unitárias não possam modificar seu `~/.openclaw` real.
- Defina `OPENCLAW_LIVE_USE_REAL_HOME=1` somente quando você precisar intencionalmente que os testes ao vivo usem seu diretório home real.
- `pnpm test:live` agora usa por padrão um modo mais silencioso: mantém a saída de progresso `[live] ...`, mas suprime o aviso extra de `~/.profile` e silencia logs de bootstrap do Gateway/ruído do Bonjour. Defina `OPENCLAW_LIVE_TEST_QUIET=0` se quiser recuperar todos os logs de inicialização.
- Rotação de chaves de API (específica por provedor): defina `*_API_KEYS` com formato separado por vírgula/ponto e vírgula ou `*_API_KEY_1`, `*_API_KEY_2` (por exemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou substituição por execução ao vivo via `OPENCLAW_LIVE_*_KEY`; os testes tentam novamente em respostas de limite de taxa.
- Saída de progresso/Heartbeat:
  - As suítes ao vivo agora emitem linhas de progresso para stderr para que chamadas longas a provedores fiquem visivelmente ativas mesmo quando a captura de console do Vitest estiver silenciosa.
  - `vitest.live.config.ts` desabilita a interceptação de console do Vitest para que linhas de progresso do provedor/Gateway sejam transmitidas imediatamente durante execuções ao vivo.
  - Ajuste Heartbeats de modelo direto com `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajuste Heartbeats de Gateway/sonda com `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Qual suíte devo executar?

Use esta tabela de decisão:

- Editando lógica/testes: execute `pnpm test` (e `pnpm test:coverage` se você mudou muita coisa)
- Tocando rede do Gateway / protocolo WS / pareamento: adicione `pnpm test:e2e`
- Depurando “meu bot caiu” / falhas específicas de provedor / chamada de ferramentas: execute um `pnpm test:live` reduzido

## Testes ao vivo (que tocam a rede)

Para a matriz de modelos ao vivo, smokes de backend da CLI, smokes ACP, harness de servidor de app Codex
e todos os testes ao vivo de provedores de mídia (Deepgram, BytePlus, ComfyUI, imagem,
música, vídeo, harness de mídia) — além do tratamento de credenciais para execuções ao vivo — consulte
[Testando suítes ao vivo](/pt-BR/help/testing-live). Para a lista de verificação dedicada de atualização e
validação de Plugin, consulte
[Testando atualizações e Plugins](/pt-BR/help/testing-updates-plugins).

## Executores Docker (verificações opcionais de "funciona no Linux")

Esses executores Docker se dividem em dois grupos:

- Executores de modelos ao vivo: `test:docker:live-models` e `test:docker:live-gateway` executam apenas o arquivo ao vivo correspondente de chave de perfil dentro da imagem Docker do repositório (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando seu diretório de configuração local e workspace (e carregando `~/.profile` se montado). Os pontos de entrada locais correspondentes são `test:live:models-profiles` e `test:live:gateway-profiles`.
- Executores Docker ao vivo usam por padrão um limite de smoke menor para que uma varredura Docker completa permaneça prática:
  `test:docker:live-models` usa por padrão `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa por padrão `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Substitua essas variáveis de ambiente quando você
  quiser explicitamente a varredura exaustiva maior.
- `test:docker:all` cria a imagem Docker ao vivo uma vez via `test:docker:live-build`, empacota o OpenClaw uma vez como um tarball npm por meio de `scripts/package-openclaw-for-docker.mjs` e depois cria/reutiliza duas imagens `scripts/e2e/Dockerfile`. A imagem base é apenas o executor Node/Git para faixas de instalação/atualização/dependências de Plugin; essas faixas montam o tarball pré-criado. A imagem funcional instala o mesmo tarball em `/app` para faixas de funcionalidade do app criado. As definições de faixas Docker ficam em `scripts/lib/docker-e2e-scenarios.mjs`; a lógica de planejamento fica em `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` executa o plano selecionado. O agregado usa um agendador local ponderado: `OPENCLAW_DOCKER_ALL_PARALLELISM` controla slots de processo, enquanto limites de recursos impedem que faixas pesadas ao vivo, de instalação npm e de múltiplos serviços iniciem todas de uma vez. Se uma única faixa for mais pesada que os limites ativos, o agendador ainda poderá iniciá-la quando o pool estiver vazio e então a manterá rodando sozinha até que a capacidade esteja disponível novamente. Os padrões são 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ajuste `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` somente quando o host Docker tiver mais folga. O executor realiza uma pré-verificação Docker por padrão, remove contêineres OpenClaw E2E obsoletos, imprime status a cada 30 segundos, armazena tempos de faixas bem-sucedidas em `.artifacts/docker-tests/lane-timings.json` e usa esses tempos para iniciar primeiro faixas mais longas em execuções posteriores. Use `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir o manifesto ponderado de faixas sem criar ou executar Docker, ou `node scripts/test-docker-all.mjs --plan-json` para imprimir o plano de CI para faixas selecionadas, necessidades de pacote/imagem e credenciais.
- `Package Acceptance` é o gate de pacote nativo do GitHub para "este tarball instalável funciona como um produto?" Ele resolve um pacote candidato a partir de `source=npm`, `source=ref`, `source=url` ou `source=artifact`, envia-o como `package-under-test` e então executa as faixas Docker E2E reutilizáveis contra esse tarball exato em vez de reempacotar a ref selecionada. Os perfis são ordenados por abrangência: `smoke`, `package`, `product` e `full`. Consulte [Testando atualizações e Plugins](/pt-BR/help/testing-updates-plugins) para o contrato de pacote/atualização/Plugin, a matriz de sobrevivência de upgrade publicado, os padrões de lançamento e a triagem de falhas.
- Verificações de build e release executam `scripts/check-cli-bootstrap-imports.mjs` depois do tsdown. A proteção percorre o grafo estático criado a partir de `dist/entry.js` e `dist/cli/run-main.js` e falha se a inicialização pré-despacho importar dependências de pacote como Commander, interface de prompt, undici ou logging antes do despacho do comando; ela também mantém o chunk de execução do Gateway incluído no pacote dentro do orçamento e rejeita importações estáticas de caminhos frios conhecidos do Gateway. O smoke da CLI empacotada também cobre ajuda raiz, ajuda de onboarding, ajuda de doctor, status, esquema de configuração e um comando de lista de modelos.
- A compatibilidade legada do Package Acceptance é limitada a `2026.4.25` (`2026.4.25-beta.*` incluído). Até esse corte, o harness tolera apenas lacunas de metadados de pacotes já lançados: entradas omitidas de inventário privado de QA, ausência de `gateway install --wrapper`, arquivos de patch ausentes no fixture git derivado do tarball, `update.channel` persistido ausente, locais legados de registros de instalação de Plugin, persistência ausente de registros de instalação do marketplace e migração de metadados de configuração durante `plugins update`. Para pacotes após `2026.4.25`, esses caminhos são falhas estritas.
- Executores de smoke em contêiner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` e `test:docker:config-reload` inicializam um ou mais contêineres reais e verificam caminhos de integração de nível mais alto.

Os executores Docker de modelos ao vivo também fazem bind mount apenas dos diretórios home de autenticação da CLI necessários (ou todos os suportados quando a execução não é reduzida) e depois os copiam para o diretório home do contêiner antes da execução para que o OAuth de CLI externa possa atualizar tokens sem modificar o armazenamento de autenticação do host:

- Modelos diretos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke de bind ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; cobre Claude, Codex e Gemini por padrão, com cobertura estrita de Droid/OpenCode via `pnpm test:docker:live-acp-bind:droid` e `pnpm test:docker:live-acp-bind:opencode`)
- Smoke do backend da CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke do harness do servidor do app Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente de desenvolvimento: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke de observabilidade: `pnpm qa:otel:smoke` é uma lane privada de checkout de código-fonte de QA. Ela intencionalmente não faz parte das lanes de lançamento Docker do pacote porque o tarball npm omite o QA Lab.
- Smoke ao vivo do Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Assistente de onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke de onboarding/canal/agente do tarball npm: `pnpm test:docker:npm-onboard-channel-agent` instala o tarball empacotado do OpenClaw globalmente no Docker, configura a OpenAI via onboarding com referência de env mais Telegram por padrão, executa o doctor e executa uma rodada de agente OpenAI mockada. Reutilize um tarball pré-compilado com `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pule o rebuild do host com `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ou troque o canal com `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke de troca de canal de atualização: `pnpm test:docker:update-channel-switch` instala o tarball empacotado do OpenClaw globalmente no Docker, troca do pacote `stable` para o git `dev`, verifica se o canal persistido e o Plugin pós-atualização funcionam, depois troca de volta para o pacote `stable` e verifica o status de atualização.
- Smoke de sobrevivência de upgrade: `pnpm test:docker:upgrade-survivor` instala o tarball empacotado do OpenClaw sobre uma fixture suja de usuário antigo com agentes, configuração de canal, allowlists de Plugin, estado obsoleto de dependências de Plugin e arquivos existentes de workspace/sessão. Ele executa atualização de pacote mais doctor não interativo sem chaves de provedor ou canal ao vivo, depois inicia um Gateway local loopback e verifica preservação de configuração/estado mais orçamentos de inicialização/status.
- Smoke de sobrevivência de upgrade publicado: `pnpm test:docker:published-upgrade-survivor` instala `openclaw@latest` por padrão, semeia arquivos realistas de usuário existente, configura essa baseline com uma receita de comando embutida, valida a configuração resultante, atualiza essa instalação publicada para o tarball candidato, executa o doctor não interativo, grava `.artifacts/upgrade-survivor/summary.json`, depois inicia um Gateway local loopback e verifica intents configurados, preservação de estado, inicialização, `/healthz`, `/readyz` e orçamentos de status RPC. Sobrescreva uma baseline com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, peça ao agendador agregado para expandir baselines exatas com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, como `all-since-2026.4.23`, e expanda fixtures em formato de issue com `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, como `reported-issues`; o conjunto reported-issues inclui `configured-plugin-installs` para reparo automático de instalação de Plugin externo do OpenClaw. Package Acceptance expõe isso como `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` e `published_upgrade_survivor_scenarios`.
- Smoke de contexto de runtime de sessão: `pnpm test:docker:session-runtime-context` verifica a persistência oculta de transcritos de contexto de runtime mais o reparo pelo doctor de branches duplicados afetados de reescrita de prompt.
- Smoke de instalação global com Bun: `bash scripts/e2e/bun-global-install-smoke.sh` empacota a árvore atual, instala-a com `bun install -g` em uma home isolada e verifica que `openclaw infer image providers --json` retorna provedores de imagem empacotados em vez de travar. Reutilize um tarball pré-compilado com `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pule o build do host com `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ou copie `dist/` de uma imagem Docker compilada com `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker do instalador: `bash scripts/test-install-sh-docker.sh` compartilha um cache npm entre seus contêineres root, update e direct-npm. O smoke de atualização usa por padrão npm `latest` como baseline stable antes de atualizar para o tarball candidato. Sobrescreva com `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` localmente ou com a entrada `update_baseline_version` do workflow Install Smoke no GitHub. As verificações de instalador sem root mantêm um cache npm isolado para que entradas de cache pertencentes ao root não mascarem o comportamento de instalação local do usuário. Defina `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` para reutilizar o cache root/update/direct-npm em novas execuções locais.
- O CI Install Smoke pula a atualização global direct-npm duplicada com `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; execute o script localmente sem essa env quando a cobertura direta de `npm install -g` for necessária.
- Smoke da CLI de exclusão de workspace compartilhado por agentes: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) compila a imagem Dockerfile raiz por padrão, semeia dois agentes com um workspace em uma home isolada no contêiner, executa `agents delete --json` e verifica JSON válido mais o comportamento de workspace retido. Reutilize a imagem install-smoke com `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Rede do Gateway (dois contêineres, autenticação WS + saúde): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Smoke de snapshot CDP do navegador: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) compila a imagem E2E de código-fonte mais uma camada Chromium, inicia o Chromium com CDP bruto, executa `browser doctor --deep` e verifica que snapshots de função CDP cobrem URLs de links, clicáveis promovidos por cursor, refs de iframe e metadados de frame.
- Regressão de raciocínio mínimo em OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) executa um servidor OpenAI mockado por meio do Gateway, verifica que `web_search` eleva `reasoning.effort` de `minimal` para `low`, depois força a rejeição do schema pelo provedor e verifica que o detalhe bruto aparece nos logs do Gateway.
- Ponte de canal MCP (Gateway semeado + ponte stdio + smoke bruto de notification-frame do Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Ferramentas MCP do pacote Pi (servidor MCP stdio real + smoke allow/deny do perfil Pi embutido): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Limpeza MCP de Cron/subagente (Gateway real + teardown de filho MCP stdio após execuções isoladas de cron e subagente one-shot): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke de instalação/atualização para caminho local, `file:`, registro npm com dependências hoisted, refs móveis de git, kitchen-sink do ClawHub, atualizações de marketplace e habilitação/inspeção de pacote Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Defina `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para pular o bloco ClawHub, ou sobrescreva o par pacote/runtime kitchen-sink padrão com `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` e `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sem `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, o teste usa um servidor fixture ClawHub local hermético.
- Smoke de atualização inalterada de Plugin: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke da matriz de ciclo de vida de Plugin: `pnpm test:docker:plugin-lifecycle-matrix` instala o tarball empacotado do OpenClaw em um contêiner vazio, instala um Plugin npm, alterna habilitar/desabilitar, faz upgrade e downgrade dele por meio de um registro npm local, exclui o código instalado e então verifica que a desinstalação ainda remove estado obsoleto enquanto registra métricas de RSS/CPU para cada fase do ciclo de vida.
- Smoke de metadados de recarregamento de configuração: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` cobre smoke de instalação/atualização para caminho local, `file:`, registro npm com dependências hoisted, refs móveis de git, fixtures ClawHub, atualizações de marketplace e habilitação/inspeção de pacote Claude. `pnpm test:docker:plugin-update` cobre comportamento de atualização inalterada para plugins instalados. `pnpm test:docker:plugin-lifecycle-matrix` cobre instalação, habilitação, desabilitação, upgrade, downgrade e desinstalação com código ausente de Plugin npm com rastreamento de recursos.

Para pré-compilar e reutilizar manualmente a imagem funcional compartilhada:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Sobrescritas de imagem específicas da suíte, como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, ainda prevalecem quando definidas. Quando `OPENCLAW_SKIP_DOCKER_BUILD=1` aponta para uma imagem compartilhada remota, os scripts fazem pull dela se ela ainda não estiver local. Os testes Docker de QR e instalador mantêm seus próprios Dockerfiles porque validam comportamento de pacote/instalação em vez do runtime de app compilado compartilhado.

Os executores Docker de modelos ao vivo também montam o checkout atual como somente leitura e
o preparam em um diretório de trabalho temporário dentro do contêiner. Isso mantém a imagem de
runtime enxuta, enquanto ainda executa o Vitest contra seu código-fonte/configuração local exato.
A etapa de preparação ignora caches grandes apenas locais e saídas de build de apps, como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e diretórios de saída `.build` locais de apps ou
do Gradle, para que as execuções live no Docker não passem minutos copiando
artefatos específicos da máquina.
Eles também definem `OPENCLAW_SKIP_CHANNELS=1` para que sondagens live do Gateway não iniciem
workers reais de canais Telegram/Discord/etc. dentro do contêiner.
`test:docker:live-models` ainda executa `pnpm test:live`, então encaminhe também
`OPENCLAW_LIVE_GATEWAY_*` quando precisar restringir ou excluir a cobertura live do Gateway
dessa trilha Docker.
`test:docker:openwebui` é um teste de fumaça de compatibilidade de nível mais alto: ele inicia um
contêiner do Gateway OpenClaw com os endpoints HTTP compatíveis com OpenAI habilitados,
inicia um contêiner Open WebUI fixado contra esse Gateway, entra pelo
Open WebUI, verifica que `/api/models` expõe `openclaw/default` e então envia uma
solicitação de chat real pelo proxy `/api/chat/completions` do Open WebUI.
A primeira execução pode ser perceptivelmente mais lenta porque o Docker pode precisar baixar a
imagem do Open WebUI e o Open WebUI pode precisar concluir sua própria configuração de partida a frio.
Essa trilha espera uma chave de modelo live utilizável, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` por padrão) é a principal forma de fornecê-la em execuções Dockerizadas.
Execuções bem-sucedidas imprimem uma pequena carga JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` é intencionalmente determinístico e não precisa de uma
conta real do Telegram, Discord ou iMessage. Ele inicializa um contêiner Gateway
semeado, inicia um segundo contêiner que executa `openclaw mcp serve`, depois
verifica descoberta de conversas roteadas, leituras de transcrição, metadados de anexos,
comportamento da fila de eventos live, roteamento de envio de saída e notificações de canal +
permissão no estilo Claude sobre a ponte MCP stdio real. A verificação de notificação
inspeciona diretamente os quadros MCP stdio brutos, para que o teste de fumaça valide o que a
ponte realmente emite, não apenas o que um SDK de cliente específico por acaso expõe.
`test:docker:pi-bundle-mcp-tools` é determinístico e não precisa de uma chave de modelo live.
Ele constrói a imagem Docker do repositório, inicia um servidor de sondagem MCP stdio real
dentro do contêiner, materializa esse servidor pelo runtime MCP do pacote Pi
embutido, executa a ferramenta e então verifica que `coding` e `messaging` mantêm
ferramentas `bundle-mcp`, enquanto `minimal` e `tools.deny: ["bundle-mcp"]` as filtram.
`test:docker:cron-mcp-cleanup` é determinístico e não precisa de uma chave de modelo live.
Ele inicia um Gateway semeado com um servidor de sondagem MCP stdio real, executa uma
rodada cron isolada e uma rodada filha única de `/subagents spawn`, depois verifica
que o processo filho MCP encerra após cada execução.

Teste de fumaça manual de thread ACP em linguagem simples (não CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantenha este script para fluxos de regressão/debug. Ele pode ser necessário novamente para validação de roteamento de thread ACP, então não o exclua.

Variáveis de ambiente úteis:

- `OPENCLAW_CONFIG_DIR=...` (padrão: `~/.openclaw`) montado em `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (padrão: `~/.openclaw/workspace`) montado em `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (padrão: `~/.profile`) montado em `/home/node/.profile` e carregado antes de executar os testes
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar apenas variáveis de ambiente carregadas de `OPENCLAW_PROFILE_FILE`, usando diretórios temporários de configuração/workspace e sem montagens externas de autenticação da CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (padrão: `~/.cache/openclaw/docker-cli-tools`) montado em `/home/node/.npm-global` para instalações de CLI em cache dentro do Docker
- Diretórios/arquivos externos de autenticação da CLI em `$HOME` são montados como somente leitura em `/host-auth...` e então copiados para `/home/node/...` antes do início dos testes
  - Diretórios padrão: `.minimax`
  - Arquivos padrão: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Execuções restringidas por provedor montam apenas os diretórios/arquivos necessários inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Sobrescreva manualmente com `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` ou uma lista separada por vírgulas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para restringir a execução
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar provedores dentro do contêiner
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar uma imagem `openclaw:local-live` existente em reexecuções que não precisam de rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para garantir que as credenciais venham do repositório de perfis (não do ambiente)
- `OPENCLAW_OPENWEBUI_MODEL=...` para escolher o modelo exposto pelo Gateway para o teste de fumaça Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para sobrescrever o prompt de verificação de nonce usado pelo teste de fumaça Open WebUI
- `OPENWEBUI_IMAGE=...` para sobrescrever a tag fixada da imagem Open WebUI

## Sanidade da documentação

Execute verificações de documentação após edições na documentação: `pnpm check:docs`.
Execute a validação completa de âncoras Mintlify quando também precisar de verificações de títulos dentro da página: `pnpm docs:check-links:anchors`.

## Regressão offline (segura para CI)

Estas são regressões de “pipeline real” sem provedores reais:

- Chamada de ferramentas do Gateway (OpenAI mockado, Gateway real + loop de agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistente de configuração do Gateway (WS `wizard.start`/`wizard.next`, grava configuração + autenticação imposta): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Evals de confiabilidade de agente (skills)

Já temos alguns testes seguros para CI que se comportam como “evals de confiabilidade de agente”:

- Chamada de ferramentas mockada pelo Gateway real + loop de agente (`src/gateway/gateway.test.ts`).
- Fluxos de assistente de configuração de ponta a ponta que validam o encadeamento de sessão e os efeitos de configuração (`src/gateway/gateway.test.ts`).

O que ainda falta para Skills (veja [Skills](/pt-BR/tools/skills)):

- **Decisão:** quando Skills são listadas no prompt, o agente escolhe a Skill correta (ou evita as irrelevantes)?
- **Conformidade:** o agente lê `SKILL.md` antes do uso e segue as etapas/argumentos exigidos?
- **Contratos de fluxo de trabalho:** cenários de vários turnos que validam ordem de ferramentas, preservação do histórico da sessão e limites de sandbox.

Evals futuras devem permanecer determinísticas primeiro:

- Um executor de cenários usando provedores mockados para validar chamadas de ferramentas + ordem, leituras de arquivos de Skill e encadeamento de sessão.
- Uma pequena suíte de cenários focados em Skills (usar versus evitar, bloqueios, injeção de prompt).
- Evals live opcionais (opt-in, controladas por env) somente depois que a suíte segura para CI estiver pronta.

## Testes de contrato (formato de Plugin e canal)

Testes de contrato verificam que todo Plugin e canal registrado está em conformidade com seu
contrato de interface. Eles iteram por todos os plugins descobertos e executam uma suíte de
asserções de formato e comportamento. A trilha unitária padrão de `pnpm test` ignora intencionalmente
esses arquivos compartilhados de fronteira e fumaça; execute os comandos de contrato explicitamente
quando tocar superfícies compartilhadas de canal ou provedor.

### Comandos

- Todos os contratos: `pnpm test:contracts`
- Apenas contratos de canal: `pnpm test:contracts:channels`
- Apenas contratos de provedor: `pnpm test:contracts:plugins`

### Contratos de canal

Localizados em `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Formato básico do Plugin (id, nome, capacidades)
- **setup** - Contrato do assistente de configuração
- **session-binding** - Comportamento de vinculação de sessão
- **outbound-payload** - Estrutura da carga da mensagem
- **inbound** - Tratamento de mensagens de entrada
- **actions** - Handlers de ação de canal
- **threading** - Tratamento de ID de thread
- **directory** - API de diretório/lista
- **group-policy** - Imposição de política de grupo

### Contratos de status de provedor

Localizados em `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondagens de status de canal
- **registry** - Formato do registro de Plugin

### Contratos de provedor

Localizados em `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato de fluxo de autenticação
- **auth-choice** - Escolha/seleção de autenticação
- **catalog** - API de catálogo de modelos
- **discovery** - Descoberta de Plugin
- **loader** - Carregamento de Plugin
- **runtime** - Runtime de provedor
- **shape** - Formato/interface de Plugin
- **wizard** - Assistente de configuração

### Quando executar

- Depois de alterar exports ou subpaths de plugin-sdk
- Depois de adicionar ou modificar um canal ou Plugin de provedor
- Depois de refatorar registro ou descoberta de plugins

Testes de contrato executam em CI e não exigem chaves de API reais.

## Adicionando regressões (orientação)

Quando você corrige um problema de provedor/modelo descoberto em live:

- Adicione uma regressão segura para CI se possível (provedor mock/stub ou capture a transformação exata do formato da solicitação)
- Se for inerentemente apenas live (limites de taxa, políticas de autenticação), mantenha o teste live restrito e opt-in por variáveis de ambiente
- Prefira mirar a menor camada que captura o bug:
  - bug de conversão/replay de solicitação do provedor → teste direto de modelos
  - bug de sessão/histórico/pipeline de ferramentas do Gateway → teste de fumaça live do Gateway ou teste mock do Gateway seguro para CI
- Proteção de travessia SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva um destino amostrado por classe SecretRef a partir dos metadados do registro (`listSecretTargetRegistryEntries()`) e então afirma que IDs de exec com segmento de travessia são rejeitados.
  - Se você adicionar uma nova família de destinos SecretRef `includeInPlan` em `src/secrets/target-registry-data.ts`, atualize `classifyTargetClass` nesse teste. O teste falha intencionalmente em IDs de destino não classificados para que novas classes não possam ser ignoradas silenciosamente.

## Relacionados

- [Testes live](/pt-BR/help/testing-live)
- [Testes de atualizações e plugins](/pt-BR/help/testing-updates-plugins)
- [CI](/pt-BR/ci)
