---
read_when:
    - Executando testes localmente ou em CI
    - Adicionando testes de regressão para bugs de modelo/provedor
    - Depuração do comportamento do Gateway + do agente
summary: 'Kit de testes: suítes unitárias/e2e/em ambiente real, executores Docker e o que cada teste cobre'
title: Testes
x-i18n:
    generated_at: "2026-05-02T20:49:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: a5bfbd2ea78b05ca23e97318943e0043645814d2aa4ccb7540a2bf7c601d0d09
    source_path: help/testing.md
    workflow: 16
---

OpenClaw tem três suítes Vitest (unitários/integração, e2e, live) e um pequeno conjunto
de executores Docker. Este documento é um guia de "como testamos":

- O que cada suíte cobre (e o que ela deliberadamente _não_ cobre).
- Quais comandos executar para fluxos de trabalho comuns (local, pré-push, depuração).
- Como os testes live descobrem credenciais e selecionam modelos/provedores.
- Como adicionar regressões para problemas reais de modelo/provedor.

<Note>
**Pilha de QA (qa-lab, qa-channel, faixas de transporte live)** é documentada separadamente:

- [Visão geral de QA](/pt-BR/concepts/qa-e2e-automation) — arquitetura, superfície de comandos, autoria de cenários.
- [QA de Matrix](/pt-BR/concepts/qa-matrix) — referência para `pnpm openclaw qa matrix`.
- [Canal de QA](/pt-BR/channels/qa-channel) — o plugin de transporte sintético usado por cenários baseados no repositório.

Esta página cobre a execução das suítes de teste regulares e dos executores Docker/Parallels. A seção de executores específicos de QA abaixo ([executores específicos de QA](#qa-specific-runners)) lista as invocações `qa` concretas e aponta de volta para as referências acima.
</Note>

## Início rápido

Na maioria dos dias:

- Gate completo (esperado antes do push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Execução local mais rápida da suíte completa em uma máquina espaçosa: `pnpm test:max`
- Loop direto de observação do Vitest: `pnpm test:watch`
- O direcionamento direto por arquivo agora também roteia caminhos de extensão/canal: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefira execuções direcionadas primeiro quando estiver iterando em uma única falha.
- Site de QA apoiado por Docker: `pnpm qa:lab:up`
- Faixa de QA apoiada por VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando você toca em testes ou quer confiança extra:

- Gate de cobertura: `pnpm test:coverage`
- Suíte E2E: `pnpm test:e2e`

Ao depurar provedores/modelos reais (requer credenciais reais):

- Suíte live (modelos + sondas de ferramenta/imagem do Gateway): `pnpm test:live`
- Direcione um arquivo live silenciosamente: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Relatórios de desempenho em runtime: dispare `OpenClaw Performance` com
  `live_gpt54=true` para uma rodada real de agente `openai/gpt-5.4` ou
  `deep_profile=true` para artefatos de CPU/heap/trace do Kova. Execuções agendadas diárias
  publicam artefatos das faixas de provedor simulado, perfil profundo e GPT 5.4 em
  `openclaw/clawgrit-reports` quando `CLAWGRIT_REPORTS_TOKEN` está configurado. O
  relatório de provedor simulado também inclui números em nível de código-fonte para inicialização do Gateway, memória,
  pressão de plugin, loop de saudação repetido com modelo falso e inicialização da CLI.
- Varredura live de modelos em Docker: `pnpm test:docker:live-models`
  - Cada modelo selecionado agora executa uma rodada de texto mais uma pequena sonda no estilo leitura de arquivo.
    Modelos cujos metadados anunciam entrada de `image` também executam uma rodada pequena de imagem.
    Desative as sondas extras com `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` ou
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` ao isolar falhas de provedor.
  - Cobertura de CI: `OpenClaw Scheduled Live And E2E Checks` diário e
    `OpenClaw Release Checks` manual chamam o fluxo de trabalho live/E2E reutilizável com
    `include_live_suites: true`, que inclui jobs separados de matriz de modelos live em Docker
    divididos por provedor.
  - Para reexecuções focadas em CI, dispare `OpenClaw Live And E2E Checks (Reusable)`
    com `include_live_suites: true` e `live_models_only: true`.
  - Adicione novos segredos de provedor de alto sinal a `scripts/ci-hydrate-live-auth.sh`
    mais `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` e seus
    chamadores agendados/de release.
- Smoke de chat vinculado nativo do Codex: `pnpm test:docker:live-codex-bind`
  - Executa uma faixa live Docker contra o caminho do app-server do Codex, vincula uma DM sintética do
    Slack com `/codex bind`, exercita `/codex fast` e
    `/codex permissions`, então verifica uma resposta simples e um anexo de imagem
    roteados pela vinculação de plugin nativa em vez de ACP.
- Smoke do harness do app-server do Codex: `pnpm test:docker:live-codex-harness`
  - Executa rodadas de agente do Gateway pelo harness do app-server do Codex pertencente ao plugin,
    verifica `/codex status` e `/codex models` e, por padrão, exercita sondas de imagem,
    MCP de cron, subagente e Guardian. Desative a sonda de subagente com
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` ao isolar outras falhas do
    app-server do Codex. Para uma verificação focada de subagente, desative as outras sondas:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Isso sai após a sonda de subagente, a menos que
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` esteja definido.
- Smoke do comando de resgate do Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Verificação opcional de dupla segurança para a superfície de comando de resgate do canal de mensagens.
    Ela exercita `/crestodian status`, enfileira uma alteração persistente de modelo,
    responde `/crestodian yes` e verifica o caminho de escrita de auditoria/configuração.
- Smoke Docker do planejador do Crestodian: `pnpm test:docker:crestodian-planner`
  - Executa o Crestodian em um contêiner sem configuração com uma CLI Claude falsa no `PATH`
    e verifica que o fallback do planejador fuzzy se traduz em uma escrita de configuração tipada auditada.
- Smoke Docker de primeira execução do Crestodian: `pnpm test:docker:crestodian-first-run`
  - Começa de um diretório de estado vazio do OpenClaw, roteia `openclaw` simples para
    Crestodian, aplica setup/modelo/agente/plugin do Discord + escritas SecretRef,
    valida a configuração e verifica entradas de auditoria. O mesmo caminho de setup Ring 0 também é
    coberto no QA Lab por
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke de custo Moonshot/Kimi: com `MOONSHOT_API_KEY` definido, execute
  `openclaw models list --provider moonshot --json`, então execute um
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolado contra `moonshot/kimi-k2.6`. Verifique que o JSON relata Moonshot/K2.6 e que a
  transcrição do assistente armazena `usage.cost` normalizado.

<Tip>
Quando você só precisa de um caso com falha, prefira restringir testes live por meio das variáveis de ambiente de allowlist descritas abaixo.
</Tip>

## Executores específicos de QA

Estes comandos ficam ao lado das principais suítes de teste quando você precisa do realismo do QA-lab:

A CI executa o QA Lab em fluxos de trabalho dedicados. A paridade agêntica fica aninhada em
`QA-Lab - All Lanes` e na validação de release, não em um fluxo de trabalho de PR independente.
A validação ampla deve usar `Full Release Validation` com
`rerun_group=qa-parity` ou o grupo de QA de verificações de release. `QA-Lab - All Lanes`
executa todas as noites em `main` e por disparo manual com a faixa de paridade simulada, a faixa
live de Matrix, a faixa live de Telegram gerenciada por Convex e a faixa live de Discord
gerenciada por Convex como jobs paralelos. QA agendado e verificações de release passam
`--profile fast` do Matrix explicitamente, enquanto a CLI do Matrix e a entrada manual do fluxo de trabalho
permanecem com o padrão `all`; o disparo manual pode dividir `all` em jobs
`transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`. `OpenClaw Release
Checks` executa paridade mais as faixas rápidas de Matrix e Telegram antes da aprovação de release,
usando `mock-openai/gpt-5.5` para verificações de transporte de release para que elas permaneçam
determinísticas e evitem a inicialização normal de plugin de provedor. Esses Gateways de transporte live
desativam a busca de memória; o comportamento de memória continua coberto pelas suítes de paridade de QA.

Os shards live de mídia de release completo usam
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, que já tem
`ffmpeg` e `ffprobe`. Os shards live de modelo/backend em Docker usam a imagem compartilhada
`ghcr.io/openclaw/openclaw-live-test:<sha>` criada uma vez por commit selecionado,
então a baixam com `OPENCLAW_SKIP_DOCKER_BUILD=1` em vez de recompilar
dentro de cada shard.

- `pnpm openclaw qa suite`
  - Executa cenários de QA respaldados pelo repositório diretamente no host.
  - Executa vários cenários selecionados em paralelo por padrão com workers de
    gateway isolados. `qa-channel` usa concorrência 4 por padrão (limitada pela
    contagem de cenários selecionados). Use `--concurrency <count>` para ajustar
    a contagem de workers, ou `--concurrency 1` para a lane serial mais antiga.
  - Sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando você
    quiser artefatos sem um código de saída de falha.
  - Oferece suporte aos modos de provedor `live-frontier`, `mock-openai` e `aimock`.
    `aimock` inicia um servidor de provedor local respaldado por AIMock para
    cobertura experimental de fixtures e mocks de protocolo sem substituir a lane
    `mock-openai` ciente de cenários.
- `pnpm test:gateway:cpu-scenarios`
  - Executa o bench de inicialização do gateway mais um pequeno pacote de cenários mock do QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) e grava um resumo combinado de observação de CPU
    em `.artifacts/gateway-cpu-scenarios/`.
  - Sinaliza por padrão apenas observações sustentadas de CPU quente (`--cpu-core-warn`
    mais `--hot-wall-warn-ms`), então rajadas curtas de inicialização são registradas como métricas
    sem parecerem a regressão de travamento do gateway por vários minutos.
  - Usa artefatos `dist` compilados; execute uma build primeiro quando o checkout ainda não
    tiver saída de runtime recente.
- `pnpm openclaw qa suite --runner multipass`
  - Executa a mesma suíte de QA dentro de uma VM Linux Multipass descartável.
  - Mantém o mesmo comportamento de seleção de cenários que `qa suite` no host.
  - Reutiliza as mesmas flags de seleção de provedor/modelo que `qa suite`.
  - Execuções live encaminham as entradas de autenticação de QA suportadas que são práticas para o guest:
    chaves de provedor baseadas em env, o caminho de configuração do provedor live de QA e `CODEX_HOME`
    quando presente.
  - Diretórios de saída devem permanecer sob a raiz do repositório para que o guest possa gravar de volta pelo
    workspace montado.
  - Grava o relatório + resumo normais de QA mais logs do Multipass em
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia o site de QA respaldado por Docker para trabalho de QA no estilo de operador.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Cria um tarball npm a partir do checkout atual, instala-o globalmente no
    Docker, executa onboarding não interativo com chave da API OpenAI, configura Telegram
    por padrão, verifica se o runtime do plugin empacotado carrega sem reparo de
    dependência na inicialização, executa doctor e executa uma rodada local de agente contra um
    endpoint OpenAI mockado.
  - Use `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para executar a mesma lane de instalação empacotada
    com Discord.
- `pnpm test:docker:session-runtime-context`
  - Executa um smoke determinístico em Docker do app compilado para transcrições de contexto de runtime
    embutido. Ele verifica que o contexto oculto de runtime do OpenClaw é persistido como uma
    mensagem customizada não exibida em vez de vazar para a rodada visível do usuário,
    depois semeia um JSONL de sessão quebrada afetada e verifica que
    `openclaw doctor --fix` o reescreve para a branch ativa com backup.
- `pnpm test:docker:npm-telegram-live`
  - Instala um candidato de pacote OpenClaw no Docker, executa onboarding de pacote instalado,
    configura Telegram por meio da CLI instalada e então reutiliza a lane live de QA do Telegram
    com esse pacote instalado como o Gateway SUT.
  - O padrão é `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; defina
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` ou
    `OPENCLAW_CURRENT_PACKAGE_TGZ` para testar um tarball local resolvido em vez de
    instalar do registro.
  - Usa as mesmas credenciais env do Telegram ou fonte de credencial Convex que
    `pnpm openclaw qa telegram`. Para automação de CI/release, defina
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` mais
    `OPENCLAW_QA_CONVEX_SITE_URL` e o segredo de função. Se
    `OPENCLAW_QA_CONVEX_SITE_URL` e um segredo de função Convex estiverem presentes no CI,
    o wrapper Docker seleciona Convex automaticamente.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` sobrescreve o
    `OPENCLAW_QA_CREDENTIAL_ROLE` compartilhado apenas para esta lane.
  - GitHub Actions expõe esta lane como o workflow manual de mantenedor
    `NPM Telegram Beta E2E`. Ele não é executado em merge. O workflow usa o ambiente
    `qa-live-shared` e leases de credenciais CI do Convex.
- GitHub Actions também expõe `Package Acceptance` para prova de produto em execução lateral
  contra um pacote candidato. Ele aceita uma ref confiável, especificação npm publicada,
  URL HTTPS de tarball mais SHA-256, ou artefato de tarball de outra execução, envia
  o `openclaw-current.tgz` normalizado como `package-under-test`, então executa o
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

- Prova por URL exata de tarball requer um digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Prova por artefato baixa um artefato de tarball de outra execução do Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Empacota e instala a build atual do OpenClaw no Docker, inicia o Gateway
    com OpenAI configurado, então habilita canais/plugins agrupados por meio de edições
    de configuração.
  - Verifica que a descoberta de setup deixa ausentes os plugins baixáveis não configurados,
    que o primeiro reparo configurado pelo doctor instala explicitamente cada
    plugin baixável ausente, e que uma segunda reinicialização não executa reparo
    oculto de dependência.
  - Também instala uma baseline npm mais antiga conhecida, habilita Telegram antes de executar
    `openclaw update --tag <candidate>`, e verifica que o doctor pós-update do candidato
    limpa resíduos legados de dependências de plugin sem um reparo postinstall
    do lado do harness.
- `pnpm test:parallels:npm-update`
  - Executa o smoke nativo de atualização de instalação empacotada nos guests do Parallels. Cada
    plataforma selecionada primeiro instala o pacote baseline solicitado, depois executa
    o comando instalado `openclaw update` no mesmo guest e verifica a
    versão instalada, status de atualização, prontidão do gateway e uma rodada local
    de agente.
  - Use `--platform macos`, `--platform windows` ou `--platform linux` enquanto
    itera em um guest. Use `--json` para o caminho do artefato de resumo e
    status por lane.
  - A lane OpenAI usa `openai/gpt-5.5` para a prova live de rodada de agente por
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
  - A atualização do Windows pode passar de 10 a 15 minutos no doctor pós-update e no trabalho de
    atualização de pacote em um guest frio; isso ainda está saudável quando o log
    debug npm aninhado está avançando.
  - Não execute este wrapper agregado em paralelo com lanes individuais de smoke do Parallels
    macOS, Windows ou Linux. Elas compartilham estado de VM e podem colidir na
    restauração de snapshot, no serviço de pacotes ou no estado do gateway do guest.
  - A prova pós-update executa a superfície normal de plugins agrupados porque
    facades de capacidade como fala, geração de imagem e entendimento de mídia
    são carregadas por meio de APIs de runtime agrupadas mesmo quando a própria rodada
    de agente verifica apenas uma resposta de texto simples.

- `pnpm openclaw qa aimock`
  - Inicia apenas o servidor local de provedor AIMock para testes diretos de smoke
    de protocolo.
- `pnpm openclaw qa matrix`
  - Executa a lane live de QA do Matrix contra um homeserver Tuwunel descartável respaldado por Docker. Somente checkout de código-fonte — instalações empacotadas não distribuem `qa-lab`.
  - CLI completa, catálogo de perfis/cenários, variáveis env e layout de artefatos: [QA do Matrix](/pt-BR/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Executa a lane live de QA do Telegram contra um grupo privado real usando os tokens de bot do driver e do SUT vindos do env.
  - Requer `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. O id do grupo deve ser o id numérico do chat do Telegram.
  - Oferece suporte a `--credential-source convex` para credenciais compartilhadas em pool. Use o modo env por padrão, ou defina `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por leases em pool.
  - Sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando você
    quiser artefatos sem um código de saída de falha.
  - Requer dois bots distintos no mesmo grupo privado, com o bot SUT expondo um nome de usuário do Telegram.
  - Para observação bot-a-bot estável, habilite Bot-to-Bot Communication Mode em `@BotFather` para ambos os bots e garanta que o bot driver possa observar o tráfego de bots do grupo.
  - Grava um relatório de QA do Telegram, resumo e artefato de mensagens observadas em `.artifacts/qa-e2e/...`. Cenários de resposta incluem RTT da solicitação de envio do driver até a resposta observada do SUT.

Lanes de transporte live compartilham um contrato padrão para que novos transportes não divirjam; a matriz de cobertura por lane fica em [visão geral de QA → Cobertura de transporte live](/pt-BR/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` é a suíte sintética ampla e não faz parte dessa matriz.

### Credenciais compartilhadas do Telegram via Convex (v1)

Quando `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) é habilitado para
`openclaw qa telegram`, o QA lab adquire um lease exclusivo de um pool respaldado por Convex, envia heartbeats
desse lease enquanto a lane está em execução e libera o lease no desligamento.

Scaffold de projeto Convex de referência:

- `qa/convex-credential-broker/`

Variáveis env obrigatórias:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por exemplo `https://your-deployment.convex.site`)
- Um segredo para a função selecionada:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Seleção da função de credencial:
  - CLI: `--credential-role maintainer|ci`
  - Padrão env: `OPENCLAW_QA_CREDENTIAL_ROLE` (o padrão é `ci` no CI, `maintainer` caso contrário)

Variáveis env opcionais:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (padrão `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (padrão `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (padrão `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (padrão `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (padrão `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de rastreamento opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URLs Convex `http://` de loopback para desenvolvimento apenas local.

`OPENCLAW_QA_CONVEX_SITE_URL` deve usar `https://` em operação normal.

Comandos admin de mantenedor (adicionar/remover/listar pool) requerem
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` especificamente.

Auxiliares de CLI para mantenedores:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Use `doctor` antes de execuções live para verificar a URL do site Convex, segredos do broker,
prefixo de endpoint, timeout HTTP e acessibilidade admin/list sem imprimir
valores secretos. Use `--json` para saída legível por máquina em scripts e
utilitários de CI.

Contrato padrão do endpoint (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Solicitação: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Sucesso: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Esgotado/repetível: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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

### Como adicionar um canal ao QA

A arquitetura e os nomes dos auxiliares de cenário para novos adaptadores de canal ficam em [visão geral do QA → Como adicionar um canal](/pt-BR/concepts/qa-e2e-automation#adding-a-channel). O mínimo exigido: implementar o runner de transporte no seam compartilhado do host `qa-lab`, declarar `qaRunners` no manifesto do plugin, montar como `openclaw qa <runner>` e criar cenários em `qa/scenarios/`.

## Suítes de teste (o que roda onde)

Pense nas suítes como “realismo crescente” (e instabilidade/custo crescentes):

### Unidade / integração (padrão)

- Comando: `pnpm test`
- Configuração: execuções sem alvo usam o conjunto de shards `vitest.full-*.config.ts` e podem expandir shards multiprojeto para configurações por projeto para agendamento paralelo
- Arquivos: inventários de núcleo/unidade em `src/**/*.test.ts`, `packages/**/*.test.ts` e `test/**/*.test.ts`; testes unitários de UI rodam no shard dedicado `unit-ui`
- Escopo:
  - Testes unitários puros
  - Testes de integração em processo (autenticação do Gateway, roteamento, ferramentas, parsing, configuração)
  - Regressões determinísticas para bugs conhecidos
- Expectativas:
  - Roda no CI
  - Não exige chaves reais
  - Deve ser rápido e estável
  - Testes do resolvedor e do carregador de superfície pública devem comprovar o comportamento de fallback amplo de `api.js` e
    `runtime-api.js` com fixtures minúsculas de plugin geradas, não com
    APIs de código-fonte reais de plugins empacotados. Carregamentos de API de plugins reais pertencem às
    suítes de contrato/integração de propriedade do plugin.

<AccordionGroup>
  <Accordion title="Projetos, shards e lanes com escopo">

    - `pnpm test` sem alvo roda doze configurações de shard menores (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) em vez de um processo gigante nativo de projeto raiz. Isso reduz o pico de RSS em máquinas carregadas e evita que trabalho de auto-reply/extensão prejudique suítes não relacionadas.
    - `pnpm test --watch` ainda usa o grafo de projeto raiz nativo `vitest.config.ts`, porque um loop de watch multishard não é prático.
    - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` encaminham alvos explícitos de arquivo/diretório primeiro por lanes com escopo, então `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar o custo completo de inicialização do projeto raiz.
    - `pnpm test:changed` expande caminhos git alterados para lanes baratas com escopo por padrão: edições diretas de testes, arquivos irmãos `*.test.ts`, mapeamentos explícitos de código-fonte e dependentes locais do grafo de imports. Edições de configuração/setup/pacote não executam testes amplamente, a menos que você use explicitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` é o gate normal de verificação local inteligente para trabalho restrito. Ele classifica o diff em núcleo, testes do núcleo, extensões, testes de extensões, apps, docs, metadados de release, ferramentas live Docker e tooling, depois executa os comandos correspondentes de typecheck, lint e guard. Ele não executa testes Vitest; chame `pnpm test:changed` ou `pnpm test <target>` explícito para comprovação por testes. Version bumps somente de metadados de release rodam verificações direcionadas de versão/configuração/dependência raiz, com um guard que rejeita alterações de pacote fora do campo de versão de nível superior.
    - Edições no harness live Docker ACP rodam verificações focadas: sintaxe de shell para os scripts de autenticação live Docker e um dry-run do agendador live Docker. Alterações em `package.json` são incluídas somente quando o diff se limita a `scripts["test:docker:live-*"]`; edições de dependência, exportação, versão e outras superfícies de pacote ainda usam os guards mais amplos.
    - Testes unitários leves em imports de agents, comandos, plugins, auxiliares de auto-reply, `plugin-sdk` e áreas semelhantes de utilitários puros são encaminhados pela lane `unit-fast`, que ignora `test/setup-openclaw-runtime.ts`; arquivos stateful/pesados em runtime permanecem nas lanes existentes.
    - Arquivos de código-fonte auxiliares selecionados de `plugin-sdk` e `commands` também mapeiam execuções em modo changed para testes irmãos explícitos nessas lanes leves, então edições em auxiliares evitam reexecutar toda a suíte pesada desse diretório.
    - `auto-reply` tem buckets dedicados para auxiliares de núcleo de nível superior, testes de integração `reply.*` de nível superior e a subárvore `src/auto-reply/reply/**`. O CI divide ainda mais a subárvore de reply em shards de agent-runner, dispatch e commands/state-routing para que um bucket pesado em imports não retenha toda a cauda do Node.
    - O CI normal de PR/main intencionalmente ignora a varredura em lote de extensões e o shard `agentic-plugins` somente de release. A Validação Completa de Release despacha o workflow filho separado `Plugin Prerelease` para essas suítes pesadas de plugins/extensões em candidatos a release.

  </Accordion>

  <Accordion title="Cobertura do runner incorporado">

    - Ao alterar entradas de descoberta da ferramenta de mensagens ou o contexto
      de runtime de compaction, mantenha os dois níveis de cobertura.
    - Adicione regressões focadas de auxiliares para limites puros de roteamento
      e normalização.
    - Mantenha saudáveis as suítes de integração do runner incorporado:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Essas suítes verificam que ids com escopo e o comportamento de compaction ainda fluem
      pelos caminhos reais de `run.ts` / `compact.ts`; testes somente de auxiliares
      não substituem suficientemente esses caminhos de integração.

  </Accordion>

  <Accordion title="Padrões do pool e isolamento do Vitest">

    - A configuração base do Vitest usa `threads` por padrão.
    - A configuração compartilhada do Vitest fixa `isolate: false` e usa o
      runner não isolado nos projetos raiz, e2e e configurações live.
    - A lane de UI raiz mantém seu setup `jsdom` e otimizador, mas também roda no
      runner compartilhado não isolado.
    - Cada shard de `pnpm test` herda os mesmos padrões `threads` + `isolate: false`
      da configuração compartilhada do Vitest.
    - `scripts/run-vitest.mjs` adiciona `--no-maglev` por padrão aos processos
      Node filhos do Vitest para reduzir churn de compilação do V8 durante grandes execuções locais.
      Defina `OPENCLAW_VITEST_ENABLE_MAGLEV=1` para comparar com o comportamento
      padrão do V8.

  </Accordion>

  <Accordion title="Iteração local rápida">

    - `pnpm changed:lanes` mostra quais lanes arquiteturais um diff aciona.
    - O hook de pre-commit é somente de formatação. Ele reencena arquivos formatados e
      não roda lint, typecheck nem testes.
    - Rode `pnpm check:changed` explicitamente antes de handoff ou push quando você
      precisar do gate de verificação local inteligente.
    - `pnpm test:changed` encaminha por lanes baratas com escopo por padrão. Use
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` somente quando o agente
      decidir que uma edição de harness, configuração, pacote ou contrato realmente precisa de cobertura
      Vitest mais ampla.
    - `pnpm test:max` e `pnpm test:changed:max` mantêm o mesmo comportamento de roteamento,
      apenas com um limite maior de workers.
    - O autoescalonamento de workers locais é intencionalmente conservador e recua
      quando a média de carga do host já está alta, então múltiplas execuções
      concorrentes do Vitest causam menos impacto por padrão.
    - A configuração base do Vitest marca os projetos/arquivos de configuração como
      `forceRerunTriggers` para que reexecuções em modo changed permaneçam corretas quando a
      fiação de testes muda.
    - A configuração mantém `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado em hosts
      compatíveis; defina `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se quiser
      um local explícito de cache para profiling direto.

  </Accordion>

  <Accordion title="Depuração de desempenho">

    - `pnpm test:perf:imports` habilita o relatório de duração de imports do Vitest mais
      a saída de detalhamento de imports.
    - `pnpm test:perf:imports:changed` limita a mesma visão de profiling aos
      arquivos alterados desde `origin/main`.
    - Dados de temporização de shards são gravados em `.artifacts/vitest-shard-timings.json`.
      Execuções de configuração inteira usam o caminho da configuração como chave; shards de CI com
      padrão de inclusão acrescentam o nome do shard para que shards filtrados possam ser acompanhados
      separadamente.
    - Quando um teste quente ainda passa a maior parte do tempo em imports de inicialização,
      mantenha dependências pesadas atrás de um seam local estreito `*.runtime.ts` e
      simule esse seam diretamente em vez de fazer deep import de auxiliares de runtime apenas
      para passá-los por `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compara o
      `test:changed` roteado com o caminho nativo de projeto raiz para esse diff commitado
      e imprime o tempo de parede mais o RSS máximo no macOS.
    - `pnpm test:perf:changed:bench -- --worktree` mede a árvore suja atual
      encaminhando a lista de arquivos alterados por
      `scripts/test-projects.mjs` e pela configuração raiz do Vitest.
    - `pnpm test:perf:profile:main` grava um perfil de CPU da thread principal para
      overhead de inicialização e transformação do Vitest/Vite.
    - `pnpm test:perf:profile:runner` grava perfis de CPU+heap do runner para a
      suíte unitária com paralelismo de arquivos desabilitado.

  </Accordion>
</AccordionGroup>

### Estabilidade (Gateway)

- Comando: `pnpm test:stability:gateway`
- Configuração: `vitest.gateway.config.ts`, forçado para um worker
- Escopo:
  - Inicia um Gateway real em local loopback com diagnósticos habilitados por padrão
  - Direciona churn sintético de mensagens, memória e payloads grandes do gateway pelo caminho de eventos de diagnóstico
  - Consulta `diagnostics.stability` sobre o RPC WS do Gateway
  - Cobre auxiliares de persistência do bundle de estabilidade de diagnóstico
  - Afirma que o recorder permanece limitado, amostras sintéticas de RSS ficam abaixo do orçamento de pressão, e as profundidades de fila por sessão drenam de volta para zero
- Expectativas:
  - Seguro para CI e sem chaves
  - Lane estreita para acompanhamento de regressão de estabilidade, não um substituto para a suíte completa do Gateway

### E2E (smoke do gateway)

- Comando: `pnpm test:e2e`
- Configuração: `vitest.e2e.config.ts`
- Arquivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` e testes E2E de plugins empacotados em `extensions/`
- Padrões de runtime:
  - Usa `threads` do Vitest com `isolate: false`, correspondendo ao restante do repositório.
  - Usa workers adaptativos (CI: até 2, local: 1 por padrão).
  - Roda em modo silencioso por padrão para reduzir overhead de I/O do console.
- Substituições úteis:
  - `OPENCLAW_E2E_WORKERS=<n>` para forçar a contagem de workers (limitada a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para reabilitar saída verbosa do console.
- Escopo:
  - Comportamento end-to-end do gateway com múltiplas instâncias
  - Superfícies WebSocket/HTTP, pareamento de node e networking mais pesado
- Expectativas:
  - Roda no CI (quando habilitado no pipeline)
  - Não exige chaves reais
  - Mais partes móveis do que testes unitários (pode ser mais lento)

### E2E: smoke do backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- Arquivo: `extensions/openshell/src/backend.e2e.test.ts`
- Escopo:
  - Inicia um Gateway OpenShell isolado no host via Docker
  - Cria uma sandbox a partir de um Dockerfile local temporário
  - Exercita o backend OpenShell do OpenClaw com `sandbox ssh-config` real + execução SSH
  - Verifica o comportamento canônico-remoto do sistema de arquivos por meio da ponte fs da sandbox
- Expectativas:
  - Somente opt-in; não faz parte da execução padrão de `pnpm test:e2e`
  - Requer uma CLI `openshell` local e um daemon Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` isolados e depois destrói o Gateway de teste e a sandbox
- Sobrescritas úteis:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar o teste ao executar manualmente a suíte e2e mais ampla
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apontar para um binário de CLI não padrão ou script wrapper

### Ao vivo (provedores reais + modelos reais)

- Comando: `pnpm test:live`
- Configuração: `vitest.live.config.ts`
- Arquivos: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` e testes ao vivo de plugins incluídos em `extensions/`
- Padrão: **habilitado** por `pnpm test:live` (define `OPENCLAW_LIVE_TEST=1`)
- Escopo:
  - “Este provedor/modelo realmente funciona _hoje_ com credenciais reais?”
  - Detectar mudanças de formato de provedor, peculiaridades de chamada de ferramentas, problemas de autenticação e comportamento de limites de taxa
- Expectativas:
  - Não é estável em CI por design (redes reais, políticas reais de provedores, cotas, indisponibilidades)
  - Custa dinheiro / usa limites de taxa
  - Prefira executar subconjuntos restritos em vez de “tudo”
- Execuções ao vivo carregam `~/.profile` para obter chaves de API ausentes.
- Por padrão, execuções ao vivo ainda isolam `HOME` e copiam material de config/autenticação para uma home temporária de teste, para que fixtures de unidade não possam modificar seu `~/.openclaw` real.
- Defina `OPENCLAW_LIVE_USE_REAL_HOME=1` somente quando você precisar intencionalmente que os testes ao vivo usem seu diretório home real.
- `pnpm test:live` agora usa por padrão um modo mais silencioso: mantém a saída de progresso `[live] ...`, mas suprime o aviso extra de `~/.profile` e silencia logs de bootstrap do Gateway/conversa do Bonjour. Defina `OPENCLAW_LIVE_TEST_QUIET=0` se quiser os logs completos de inicialização de volta.
- Rotação de chaves de API (específica por provedor): defina `*_API_KEYS` com formato de vírgula/ponto e vírgula ou `*_API_KEY_1`, `*_API_KEY_2` (por exemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou uma sobrescrita por execução ao vivo via `OPENCLAW_LIVE_*_KEY`; os testes tentam novamente em respostas de limite de taxa.
- Saída de progresso/Heartbeat:
  - Suítes ao vivo agora emitem linhas de progresso em stderr para que chamadas longas a provedores fiquem visivelmente ativas mesmo quando a captura de console do Vitest está silenciosa.
  - `vitest.live.config.ts` desabilita a interceptação de console do Vitest para que linhas de progresso de provedor/Gateway sejam transmitidas imediatamente durante execuções ao vivo.
  - Ajuste Heartbeats de modelo direto com `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajuste Heartbeats de Gateway/probe com `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Qual suíte devo executar?

Use esta tabela de decisão:

- Editando lógica/testes: execute `pnpm test` (e `pnpm test:coverage` se você alterou muita coisa)
- Mexendo em rede do Gateway / protocolo WS / pareamento: adicione `pnpm test:e2e`
- Depurando “meu bot caiu” / falhas específicas de provedor / chamada de ferramentas: execute um `pnpm test:live` restrito

## Testes ao vivo (que tocam na rede)

Para a matriz de modelos ao vivo, smokes de backend da CLI, smokes de ACP, harness de servidor de app do Codex e todos os testes ao vivo de provedores de mídia (Deepgram, BytePlus, ComfyUI, imagem, música, vídeo, harness de mídia) — além do tratamento de credenciais para execuções ao vivo — consulte [Testando suítes ao vivo](/pt-BR/help/testing-live). Para a checklist dedicada de atualização e validação de plugins, consulte [Testando atualizações e plugins](/pt-BR/help/testing-updates-plugins).

## Runners Docker (verificações opcionais de "funciona no Linux")

Esses runners Docker se dividem em dois grupos:

- Runners de modelo ao vivo: `test:docker:live-models` e `test:docker:live-gateway` executam somente o arquivo ao vivo de chave de perfil correspondente dentro da imagem Docker do repositório (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando seu diretório de configuração local e workspace (e carregando `~/.profile` se montado). Os pontos de entrada locais correspondentes são `test:live:models-profiles` e `test:live:gateway-profiles`.
- Runners Docker ao vivo usam por padrão um limite de smoke menor para que uma varredura Docker completa continue prática:
  `test:docker:live-models` usa por padrão `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa por padrão `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sobrescreva essas variáveis de ambiente quando você
  quiser explicitamente a varredura exaustiva maior.
- `test:docker:all` constrói a imagem Docker ao vivo uma vez via `test:docker:live-build`, empacota o OpenClaw uma vez como um tarball npm por meio de `scripts/package-openclaw-for-docker.mjs` e então constrói/reutiliza duas imagens de `scripts/e2e/Dockerfile`. A imagem básica é somente o runner Node/Git para lanes de instalação/atualização/dependência de Plugin; essas lanes montam o tarball pré-construído. A imagem funcional instala o mesmo tarball em `/app` para lanes de funcionalidade do app construído. As definições de lanes Docker ficam em `scripts/lib/docker-e2e-scenarios.mjs`; a lógica do planejador fica em `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` executa o plano selecionado. O agregado usa um agendador local ponderado: `OPENCLAW_DOCKER_ALL_PARALLELISM` controla slots de processos, enquanto limites de recursos impedem que lanes pesadas ao vivo, de instalação npm e de múltiplos serviços iniciem todas ao mesmo tempo. Se uma única lane for mais pesada que os limites ativos, o agendador ainda poderá iniciá-la quando o pool estiver vazio e então a manterá rodando sozinha até haver capacidade disponível novamente. Os padrões são 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ajuste `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` somente quando o host Docker tiver mais folga. O runner executa um preflight do Docker por padrão, remove contêineres E2E obsoletos do OpenClaw, imprime status a cada 30 segundos, armazena tempos de lanes bem-sucedidas em `.artifacts/docker-tests/lane-timings.json` e usa esses tempos para iniciar lanes mais longas primeiro em execuções posteriores. Use `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir o manifesto ponderado de lanes sem construir ou executar Docker, ou `node scripts/test-docker-all.mjs --plan-json` para imprimir o plano de CI das lanes selecionadas, necessidades de pacote/imagem e credenciais.
- `Package Acceptance` é o gate de pacote nativo do GitHub para "este tarball instalável funciona como produto?" Ele resolve um pacote candidato a partir de `source=npm`, `source=ref`, `source=url` ou `source=artifact`, faz upload dele como `package-under-test` e então executa as lanes Docker E2E reutilizáveis contra esse tarball exato em vez de reempacotar a ref selecionada. Os perfis são ordenados por abrangência: `smoke`, `package`, `product` e `full`. Consulte [Testando atualizações e plugins](/pt-BR/help/testing-updates-plugins) para o contrato de pacote/atualização/Plugin, matriz de sobrevivência de upgrade publicado, padrões de release e triagem de falhas.
- Verificações de build e release executam `scripts/check-cli-bootstrap-imports.mjs` após o tsdown. A proteção percorre o grafo estático construído a partir de `dist/entry.js` e `dist/cli/run-main.js` e falha se imports de inicialização pré-dispatch trouxerem dependências de pacote como Commander, UI de prompts, undici ou logging antes do dispatch do comando; ela também mantém o chunk empacotado de execução do Gateway abaixo do orçamento e rejeita imports estáticos de caminhos frios conhecidos do Gateway. O smoke da CLI empacotada também cobre ajuda raiz, ajuda de onboard, ajuda de doctor, status, esquema de config e um comando de listagem de modelos.
- A compatibilidade legada do Package Acceptance é limitada a `2026.4.25` (`2026.4.25-beta.*` incluído). Até esse corte, o harness tolera somente lacunas de metadados de pacotes lançados: entradas omitidas de inventário privado de QA, ausência de `gateway install --wrapper`, ausência de arquivos de patch na fixture git derivada do tarball, ausência de `update.channel` persistido, locais legados de registros de instalação de Plugin, ausência de persistência de registros de instalação do marketplace e migração de metadados de config durante `plugins update`. Para pacotes após `2026.4.25`, esses caminhos são falhas estritas.
- Runners de smoke de contêiner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` e `test:docker:config-reload` inicializam um ou mais contêineres reais e verificam caminhos de integração de nível mais alto.

Os runners Docker de modelo ao vivo também fazem bind mount somente das homes de autenticação de CLI necessárias (ou todas as compatíveis quando a execução não está restrita), depois as copiam para a home do contêiner antes da execução para que o OAuth de CLI externa possa atualizar tokens sem modificar o armazenamento de autenticação do host:

- Modelos diretos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke de bind ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; cobre Claude, Codex e Gemini por padrão, com cobertura estrita de Droid/OpenCode via `pnpm test:docker:live-acp-bind:droid` e `pnpm test:docker:live-acp-bind:opencode`)
- Smoke de backend da CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke do harness do servidor de app do Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente de desenvolvimento: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke de observabilidade: `pnpm qa:otel:smoke` é uma lane privada de checkout de origem de QA. Ela intencionalmente não faz parte das lanes de lançamento Docker do pacote porque o tarball npm omite o QA Lab.
- Smoke live do Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Assistente de onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke de onboarding/canal/agente do tarball npm: `pnpm test:docker:npm-onboard-channel-agent` instala o tarball OpenClaw empacotado globalmente no Docker, configura a OpenAI via onboarding com referência de env mais Telegram por padrão, executa doctor e executa um turno de agente OpenAI simulado. Reutilize um tarball pré-criado com `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pule a reconstrução do host com `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ou troque o canal com `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke de troca de canal de atualização: `pnpm test:docker:update-channel-switch` instala o tarball OpenClaw empacotado globalmente no Docker, troca de pacote `stable` para git `dev`, verifica o canal persistido e o funcionamento pós-atualização do plugin, depois volta para o pacote `stable` e verifica o status de atualização.
- Smoke de sobrevivência de upgrade: `pnpm test:docker:upgrade-survivor` instala o tarball OpenClaw empacotado sobre uma fixture de usuário antigo suja com agentes, configuração de canal, listas de permissão de plugins, estado obsoleto de dependências de plugin e arquivos existentes de workspace/sessão. Ele executa a atualização do pacote mais doctor não interativo sem provedor live ou chaves de canal, depois inicia um Gateway de loopback e verifica a preservação de config/estado mais orçamentos de inicialização/status.
- Smoke de sobrevivência de upgrade publicado: `pnpm test:docker:published-upgrade-survivor` instala `openclaw@latest` por padrão, semeia arquivos realistas de usuário existente, configura essa baseline com uma receita de comando incorporada, valida a configuração resultante, atualiza essa instalação publicada para o tarball candidato, executa doctor não interativo, grava `.artifacts/upgrade-survivor/summary.json`, depois inicia um Gateway de loopback e verifica intents configuradas, preservação de estado, inicialização, `/healthz`, `/readyz` e orçamentos de status RPC. Sobrescreva uma baseline com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, peça ao agendador agregado para expandir baselines exatas com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, como `all-since-2026.4.23`, e expanda fixtures no formato de issues com `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, como `reported-issues`; o conjunto reported-issues inclui `configured-plugin-installs` para reparo automático de instalação de plugin OpenClaw externo. Package Acceptance expõe isso como `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` e `published_upgrade_survivor_scenarios`.
- Smoke de contexto de runtime de sessão: `pnpm test:docker:session-runtime-context` verifica a persistência oculta do transcript de contexto de runtime mais o reparo por doctor de branches duplicadas afetadas de reescrita de prompt.
- Smoke de instalação global com Bun: `bash scripts/e2e/bun-global-install-smoke.sh` empacota a árvore atual, instala-a com `bun install -g` em um home isolado e verifica que `openclaw infer image providers --json` retorna provedores de imagem agrupados em vez de travar. Reutilize um tarball pré-criado com `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pule o build do host com `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ou copie `dist/` de uma imagem Docker criada com `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker do instalador: `bash scripts/test-install-sh-docker.sh` compartilha um cache npm entre seus contêineres root, update e direct-npm. O smoke de atualização usa por padrão npm `latest` como baseline stable antes de atualizar para o tarball candidato. Sobrescreva com `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` localmente ou com o input `update_baseline_version` do workflow Install Smoke no GitHub. As verificações do instalador não root mantêm um cache npm isolado para que entradas de cache pertencentes ao root não mascarem o comportamento de instalação local do usuário. Defina `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` para reutilizar o cache root/update/direct-npm em novas execuções locais.
- O CI Install Smoke pula a atualização global direct-npm duplicada com `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; execute o script localmente sem essa env quando a cobertura direta de `npm install -g` for necessária.
- Smoke de CLI para excluir workspace compartilhado de agentes: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) cria a imagem do Dockerfile raiz por padrão, semeia dois agentes com um workspace em um home de contêiner isolado, executa `agents delete --json` e verifica JSON válido mais comportamento de workspace retido. Reutilize a imagem install-smoke com `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Rede do Gateway (dois contêineres, autenticação WS + integridade): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Smoke de snapshot CDP do navegador: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) cria a imagem E2E de origem mais uma camada Chromium, inicia o Chromium com CDP bruto, executa `browser doctor --deep` e verifica que snapshots de função CDP cobrem URLs de links, clicáveis promovidos por cursor, refs de iframe e metadados de frame.
- Regressão de raciocínio mínimo do OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) executa um servidor OpenAI simulado pelo Gateway, verifica que `web_search` eleva `reasoning.effort` de `minimal` para `low`, depois força a rejeição do schema do provedor e verifica que o detalhe bruto aparece nos logs do Gateway.
- Ponte de canal MCP (Gateway semeado + ponte stdio + smoke bruto de frame de notificação do Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Ferramentas MCP do bundle Pi (servidor MCP stdio real + smoke de allow/deny do perfil Pi incorporado): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Limpeza MCP de Cron/subagente (Gateway real + encerramento de filho MCP stdio após execuções isoladas de cron e subagente one-shot): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke de instalação/atualização para caminho local, `file:`, registro npm com dependências içadas, refs móveis do git, kitchen-sink do ClawHub, atualizações do marketplace e habilitação/inspeção de bundle Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Defina `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para pular o bloco ClawHub, ou sobrescreva o par padrão de pacote/runtime kitchen-sink com `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` e `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sem `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, o teste usa um servidor local hermético de fixture ClawHub.
- Smoke de atualização sem alteração de plugin: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke de metadados de recarregamento de config: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` cobre smoke de instalação/atualização para caminho local, `file:`, registro npm com dependências içadas, refs móveis do git, fixtures ClawHub, atualizações do marketplace e habilitação/inspeção de bundle Claude. `pnpm test:docker:plugin-update` cobre comportamento de atualização sem alterações para plugins instalados.

Para pré-criar e reutilizar manualmente a imagem funcional compartilhada:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Sobrescritas de imagem específicas da suíte, como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, ainda prevalecem quando definidas. Quando `OPENCLAW_SKIP_DOCKER_BUILD=1` aponta para uma imagem remota compartilhada, os scripts fazem pull dela se ainda não estiver local. Os testes Docker de QR e instalador mantêm seus próprios Dockerfiles porque validam comportamento de pacote/instalação em vez do runtime de app criado compartilhado.

Os runners Docker de modelos live também montam via bind o checkout atual como somente leitura e
o preparam em um workdir temporário dentro do contêiner. Isso mantém a imagem de runtime
enxuta, ainda executando Vitest contra sua origem/config local exata.
A etapa de preparação pula caches grandes somente locais e saídas de build de app, como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e diretórios de saída `.build` locais de app ou
Gradle, para que execuções Docker live não passem minutos copiando
artefatos específicos da máquina.
Eles também definem `OPENCLAW_SKIP_CHANNELS=1` para que probes live do gateway não iniciem
workers reais de canal Telegram/Discord/etc. dentro do contêiner.
`test:docker:live-models` ainda executa `pnpm test:live`, então repasse também
`OPENCLAW_LIVE_GATEWAY_*` quando precisar restringir ou excluir a cobertura live de gateway
dessa lane Docker.
`test:docker:openwebui` é um smoke de compatibilidade de nível mais alto: ele inicia um
contêiner de gateway OpenClaw com endpoints HTTP compatíveis com OpenAI habilitados,
inicia um contêiner Open WebUI fixado contra esse gateway, faz login pelo
Open WebUI, verifica que `/api/models` expõe `openclaw/default`, depois envia uma
solicitação real de chat pelo proxy `/api/chat/completions` do Open WebUI.
A primeira execução pode ser perceptivelmente mais lenta porque o Docker talvez precise fazer pull da
imagem Open WebUI e o Open WebUI talvez precise concluir sua própria configuração de inicialização fria.
Essa lane espera uma chave de modelo live utilizável, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` por padrão) é a forma principal de fornecê-la em execuções Dockerizadas.
Execuções bem-sucedidas imprimem um pequeno payload JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` é intencionalmente determinístico e não precisa de uma
conta real do Telegram, Discord ou iMessage. Ele inicializa um contêiner Gateway
semeado, inicia um segundo contêiner que gera `openclaw mcp serve`, depois
verifica descoberta de conversas roteadas, leituras de transcript, metadados de anexos,
comportamento da fila de eventos live, roteamento de envio de saída e notificações de canal +
permissão no estilo Claude pela ponte MCP stdio real. A verificação de notificação
inspeciona diretamente os frames MCP stdio brutos para que o smoke valide o que a
ponte realmente emite, não apenas o que um SDK de cliente específico por acaso expõe.
`test:docker:pi-bundle-mcp-tools` é determinístico e não precisa de uma chave de modelo
live. Ele cria a imagem Docker do repo, inicia um servidor de probe MCP stdio real
dentro do contêiner, materializa esse servidor pelo runtime MCP do bundle Pi
incorporado, executa a ferramenta, depois verifica que `coding` e `messaging` mantêm
ferramentas `bundle-mcp`, enquanto `minimal` e `tools.deny: ["bundle-mcp"]` as filtram.
`test:docker:cron-mcp-cleanup` é determinístico e não precisa de uma chave de modelo live.
Ele inicia um Gateway semeado com um servidor de probe MCP stdio real, executa um
turno cron isolado e um turno filho one-shot de `/subagents spawn`, depois verifica
que o processo filho MCP sai após cada execução.

Smoke manual de thread ACP em linguagem simples (não CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantenha este script para workflows de regressão/debug. Ele pode ser necessário novamente para validação de roteamento de thread ACP, portanto não o exclua.

Variáveis de env úteis:

- `OPENCLAW_CONFIG_DIR=...` (padrão: `~/.openclaw`) montado em `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (padrão: `~/.openclaw/workspace`) montado em `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (padrão: `~/.profile`) montado em `/home/node/.profile` e carregado antes de executar testes
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar apenas variáveis de ambiente carregadas de `OPENCLAW_PROFILE_FILE`, usando diretórios temporários de configuração/espaço de trabalho e sem montagens externas de autenticação de CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (padrão: `~/.cache/openclaw/docker-cli-tools`) montado em `/home/node/.npm-global` para instalações de CLI em cache dentro do Docker
- Diretórios/arquivos externos de autenticação de CLI em `$HOME` são montados somente leitura em `/host-auth...` e depois copiados para `/home/node/...` antes do início dos testes
  - Diretórios padrão: `.minimax`
  - Arquivos padrão: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Execuções restritas de provedores montam apenas os diretórios/arquivos necessários inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Substitua manualmente com `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` ou uma lista separada por vírgulas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para restringir a execução
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar provedores no contêiner
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar uma imagem `openclaw:local-live` existente em reexecuções que não precisam de uma recompilação
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para garantir que as credenciais venham do repositório de perfis (não do ambiente)
- `OPENCLAW_OPENWEBUI_MODEL=...` para escolher o modelo exposto pelo gateway para o smoke do Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para substituir o prompt de verificação de nonce usado pelo smoke do Open WebUI
- `OPENWEBUI_IMAGE=...` para substituir a tag fixada da imagem do Open WebUI

## Sanidade da documentação

Execute verificações da documentação após edições na documentação: `pnpm check:docs`.
Execute a validação completa de âncoras do Mintlify quando também precisar de verificações de títulos dentro da página: `pnpm docs:check-links:anchors`.

## Regressão offline (segura para CI)

Estas são regressões de “pipeline real” sem provedores reais:

- Chamada de ferramenta do Gateway (OpenAI simulado, gateway real + loop de agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistente do Gateway (WS `wizard.start`/`wizard.next`, grava configuração + autenticação aplicada): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Avaliações de confiabilidade de agentes (Skills)

Já temos alguns testes seguros para CI que se comportam como “avaliações de confiabilidade de agentes”:

- Chamada de ferramenta simulada pelo gateway real + loop de agente (`src/gateway/gateway.test.ts`).
- Fluxos de assistente de ponta a ponta que validam a conexão da sessão e os efeitos da configuração (`src/gateway/gateway.test.ts`).

O que ainda falta para Skills (consulte [Skills](/pt-BR/tools/skills)):

- **Tomada de decisão:** quando Skills são listadas no prompt, o agente escolhe a skill certa (ou evita as irrelevantes)?
- **Conformidade:** o agente lê `SKILL.md` antes do uso e segue as etapas/argumentos necessários?
- **Contratos de fluxo de trabalho:** cenários de múltiplos turnos que verificam a ordem das ferramentas, a continuidade do histórico da sessão e os limites da sandbox.

Avaliações futuras devem permanecer determinísticas primeiro:

- Um executor de cenários usando provedores simulados para verificar chamadas de ferramenta + ordem, leituras de arquivos de skill e conexão de sessão.
- Um pequeno conjunto de cenários focados em Skills (usar vs evitar, bloqueios, injeção de prompt).
- Avaliações ao vivo opcionais (opt-in, controladas por variáveis de ambiente) somente depois que o conjunto seguro para CI estiver implementado.

## Testes de contrato (formato de Plugin e canal)

Testes de contrato verificam se cada Plugin e canal registrado está em conformidade com seu
contrato de interface. Eles iteram por todos os Plugins descobertos e executam um conjunto de
asserções de formato e comportamento. A lane unitária padrão de `pnpm test` intencionalmente
ignora estes arquivos compartilhados de pontos de integração e smoke; execute os comandos de contrato explicitamente
quando tocar em superfícies compartilhadas de canal ou provedor.

### Comandos

- Todos os contratos: `pnpm test:contracts`
- Apenas contratos de canais: `pnpm test:contracts:channels`
- Apenas contratos de provedores: `pnpm test:contracts:plugins`

### Contratos de canal

Localizados em `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Formato básico do Plugin (id, nome, capacidades)
- **setup** - Contrato do assistente de configuração
- **session-binding** - Comportamento de vinculação de sessão
- **outbound-payload** - Estrutura de payload de mensagem
- **inbound** - Manipulação de mensagens de entrada
- **actions** - Manipuladores de ações de canal
- **threading** - Manipulação de ID de conversa
- **directory** - API de diretório/lista de membros
- **group-policy** - Aplicação de política de grupo

### Contratos de status de provedores

Localizados em `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondagens de status de canal
- **registry** - Formato do registro de Plugins

### Contratos de provedores

Localizados em `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato de fluxo de autenticação
- **auth-choice** - Escolha/seleção de autenticação
- **catalog** - API de catálogo de modelos
- **discovery** - Descoberta de Plugins
- **loader** - Carregamento de Plugins
- **runtime** - Runtime do provedor
- **shape** - Formato/interface do Plugin
- **wizard** - Assistente de configuração

### Quando executar

- Depois de alterar exportações ou subpaths de plugin-sdk
- Depois de adicionar ou modificar um canal ou Plugin de provedor
- Depois de refatorar registro ou descoberta de Plugins

Testes de contrato são executados no CI e não exigem chaves de API reais.

## Adicionando regressões (orientação)

Quando você corrigir um problema de provedor/modelo descoberto ao vivo:

- Adicione uma regressão segura para CI, se possível (provedor mock/stub, ou capture a transformação exata do formato da requisição)
- Se for inerentemente apenas ao vivo (limites de taxa, políticas de autenticação), mantenha o teste ao vivo restrito e opt-in via variáveis de ambiente
- Prefira mirar na menor camada que captura o bug:
  - bug de conversão/replay de requisição do provedor → teste direto de modelos
  - bug de sessão/histórico/pipeline de ferramentas do gateway → smoke ao vivo do gateway ou teste simulado do gateway seguro para CI
- Guardrail de travessia de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva um alvo amostrado por classe de SecretRef a partir dos metadados do registro (`listSecretTargetRegistryEntries()`) e então verifica se IDs de exec com segmentos de travessia são rejeitados.
  - Se você adicionar uma nova família de alvos SecretRef `includeInPlan` em `src/secrets/target-registry-data.ts`, atualize `classifyTargetClass` nesse teste. O teste falha intencionalmente em IDs de alvo não classificados para que novas classes não possam ser ignoradas silenciosamente.

## Relacionado

- [Testes ao vivo](/pt-BR/help/testing-live)
- [Testes de atualizações e Plugins](/pt-BR/help/testing-updates-plugins)
- [CI](/pt-BR/ci)
