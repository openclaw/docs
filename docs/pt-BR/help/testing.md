---
read_when:
    - Executando testes localmente ou em CI
    - Adicionando testes de regressão para falhas de modelo/provedor
    - Depurando o comportamento do Gateway + agente
summary: 'Kit de testes: suítes unit/e2e/live, executores Docker e o que cada teste cobre'
title: Testes
x-i18n:
    generated_at: "2026-05-05T05:43:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63f27190fb00b7091c99f64edcb990be14b1025db89bc091d9c54bd1322dda24
    source_path: help/testing.md
    workflow: 16
---

OpenClaw tem três suítes Vitest (unidade/integração, e2e, ao vivo) e um pequeno conjunto
de executores Docker. Este documento é um guia de "como testamos":

- O que cada suíte cobre (e o que ela deliberadamente _não_ cobre).
- Quais comandos executar para fluxos de trabalho comuns (local, pré-push, depuração).
- Como os testes ao vivo descobrem credenciais e selecionam modelos/provedores.
- Como adicionar regressões para problemas reais de modelo/provedor.

<Note>
**Pilha de QA (qa-lab, qa-channel, faixas de transporte ao vivo)** é documentada separadamente:

- [Visão geral de QA](/pt-BR/concepts/qa-e2e-automation) — arquitetura, superfície de comandos, autoria de cenários.
- [QA de matriz](/pt-BR/concepts/qa-matrix) — referência para `pnpm openclaw qa matrix`.
- [Canal de QA](/pt-BR/channels/qa-channel) — o Plugin de transporte sintético usado por cenários apoiados pelo repositório.

Esta página cobre a execução das suítes de teste regulares e dos executores Docker/Parallels. A seção de executores específicos de QA abaixo ([Executores específicos de QA](#qa-specific-runners)) lista as invocações concretas de `qa` e aponta de volta para as referências acima.
</Note>

## Início rápido

Na maioria dos dias:

- Gate completo (esperado antes do push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Execução local mais rápida da suíte completa em uma máquina espaçosa: `pnpm test:max`
- Loop direto de observação do Vitest: `pnpm test:watch`
- O direcionamento direto de arquivo agora também roteia caminhos de extensão/canal: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefira execuções direcionadas primeiro quando estiver iterando sobre uma única falha.
- Site de QA apoiado por Docker: `pnpm qa:lab:up`
- Faixa de QA apoiada por VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando você tocar em testes ou quiser confiança extra:

- Gate de cobertura: `pnpm test:coverage`
- Suíte E2E: `pnpm test:e2e`

Ao depurar provedores/modelos reais (exige credenciais reais):

- Suíte ao vivo (modelos + probes de ferramenta/imagem do Gateway): `pnpm test:live`
- Direcione um arquivo ao vivo silenciosamente: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Relatórios de desempenho em runtime: dispare `OpenClaw Performance` com
  `live_gpt54=true` para uma rodada real de agente `openai/gpt-5.4` ou
  `deep_profile=true` para artefatos de CPU/heap/trace do Kova. Execuções agendadas diárias
  publicam artefatos das faixas de provedor simulado, perfil profundo e GPT 5.4 em
  `openclaw/clawgrit-reports` quando `CLAWGRIT_REPORTS_TOKEN` está configurado. O
  relatório de provedor simulado também inclui números em nível de código-fonte de inicialização do Gateway, memória,
  pressão de Plugin, loop repetido de saudação com modelo falso e inicialização da CLI.
- Varredura de modelos ao vivo no Docker: `pnpm test:docker:live-models`
  - Cada modelo selecionado agora executa uma rodada de texto mais uma pequena probe no estilo leitura de arquivo.
    Modelos cujos metadados anunciam entrada `image` também executam uma pequena rodada de imagem.
    Desabilite as probes extras com `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` ou
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` ao isolar falhas de provedor.
  - Cobertura de CI: `OpenClaw Scheduled Live And E2E Checks` diário e
    `OpenClaw Release Checks` manual chamam o fluxo de trabalho reutilizável ao vivo/E2E com
    `include_live_suites: true`, que inclui jobs separados de matriz de modelos ao vivo no Docker
    fragmentados por provedor.
  - Para reexecuções focadas em CI, dispare `OpenClaw Live And E2E Checks (Reusable)`
    com `include_live_suites: true` e `live_models_only: true`.
  - Adicione novos segredos de provedor de alto sinal a `scripts/ci-hydrate-live-auth.sh`
    mais `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` e seus
    chamadores agendados/de release.
- Smoke de chat vinculado nativo do Codex: `pnpm test:docker:live-codex-bind`
  - Executa uma faixa ao vivo no Docker contra o caminho do app-server Codex, vincula uma DM sintética do
    Slack com `/codex bind`, exercita `/codex fast` e
    `/codex permissions`, depois verifica uma resposta simples e uma rota de anexo de imagem
    pela vinculação nativa do Plugin em vez de ACP.
- Smoke do harness do app-server Codex: `pnpm test:docker:live-codex-harness`
  - Executa rodadas de agente do Gateway pelo harness do app-server Codex pertencente ao Plugin,
    verifica `/codex status` e `/codex models`, e por padrão exercita probes de imagem,
    cron MCP, subagente e Guardian. Desabilite a probe de subagente com
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` ao isolar outras falhas do
    app-server Codex. Para uma verificação focada de subagente, desabilite as outras probes:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Isso sai depois da probe de subagente, a menos que
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` esteja definido.
- Smoke do comando de resgate do Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Verificação opcional de cinto e suspensórios para a superfície do comando de resgate de canal de mensagens.
    Ela exercita `/crestodian status`, enfileira uma alteração persistente de modelo,
    responde `/crestodian yes` e verifica o caminho de escrita de auditoria/configuração.
- Smoke Docker do planejador Crestodian: `pnpm test:docker:crestodian-planner`
  - Executa o Crestodian em um contêiner sem configuração com uma CLI Claude falsa no `PATH`
    e verifica se o fallback do planejador fuzzy é traduzido em uma escrita de configuração tipada auditada.
- Smoke Docker de primeira execução do Crestodian: `pnpm test:docker:crestodian-first-run`
  - Começa a partir de um diretório de estado vazio do OpenClaw, roteia `openclaw` simples para
    o Crestodian, aplica escritas de configuração/modelo/agente/Plugin Discord + SecretRef,
    valida a configuração e verifica entradas de auditoria. O mesmo caminho de configuração Ring 0 também é
    coberto no QA Lab por
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke de custo Moonshot/Kimi: com `MOONSHOT_API_KEY` definido, execute
  `openclaw models list --provider moonshot --json`, depois execute um
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolado contra `moonshot/kimi-k2.6`. Verifique se o JSON relata Moonshot/K2.6 e se a
  transcrição do assistente armazena `usage.cost` normalizado.

<Tip>
Quando você precisar de apenas um caso com falha, prefira restringir os testes ao vivo pelas variáveis de ambiente de lista de permissões descritas abaixo.
</Tip>

## Executores específicos de QA

Estes comandos ficam ao lado das principais suítes de teste quando você precisa do realismo do QA-lab:

A CI executa o QA Lab em fluxos de trabalho dedicados. A paridade agentic fica aninhada em
`QA-Lab - All Lanes` e na validação de release, não em um fluxo de trabalho de PR autônomo.
Validações amplas devem usar `Full Release Validation` com
`rerun_group=qa-parity` ou o grupo de QA de release-checks. Verificações de release estáveis/padrão
mantêm o soak ao vivo/Docker exaustivo atrás de `run_release_soak=true`; o
perfil `full` força o soak. `QA-Lab - All Lanes`
é executado todas as noites em `main` e por disparo manual com a faixa de paridade simulada, faixa Matrix ao vivo, faixa Telegram ao vivo gerenciada pelo Convex e faixa Discord ao vivo gerenciada pelo Convex como jobs paralelos. QA agendado e verificações de release passam Matrix
`--profile fast` explicitamente, enquanto a CLI Matrix e a entrada de fluxo de trabalho manual
permanecem com o padrão `all`; o disparo manual pode fragmentar `all` em jobs `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`. `OpenClaw Release
Checks` executa paridade mais as faixas rápidas Matrix e Telegram antes da aprovação do release,
usando `mock-openai/gpt-5.5` para verificações de transporte de release para que elas permaneçam
determinísticas e evitem a inicialização normal de Plugin de provedor. Esses Gateways de transporte ao vivo
desabilitam a busca de memória; o comportamento de memória permanece coberto pelas suítes de paridade de QA.

Os fragmentos de mídia ao vivo de release completo usam
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, que já tem
`ffmpeg` e `ffprobe`. Fragmentos Docker de modelo/backend ao vivo usam a imagem compartilhada
`ghcr.io/openclaw/openclaw-live-test:<sha>` criada uma vez por commit selecionado,
depois a baixam com `OPENCLAW_SKIP_DOCKER_BUILD=1` em vez de recriar dentro
de cada fragmento.

- `pnpm openclaw qa suite`
  - Executa cenários de QA baseados no repositório diretamente no host.
  - Executa vários cenários selecionados em paralelo por padrão com workers de
    gateway isolados. `qa-channel` usa concorrência 4 por padrão (limitada pela
    quantidade de cenários selecionados). Use `--concurrency <count>` para ajustar
    a quantidade de workers, ou `--concurrency 1` para a lane serial antiga.
  - Sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando você
    quiser artefatos sem um código de saída de falha.
  - Suporta os modos de provedor `live-frontier`, `mock-openai` e `aimock`.
    `aimock` inicia um servidor de provedor local baseado em AIMock para cobertura
    experimental de fixtures e mocks de protocolo sem substituir a lane
    `mock-openai` ciente de cenários.
- `pnpm test:plugins:kitchen-sink-live`
  - Executa a maratona live do Plugin OpenAI Kitchen Sink pelo QA Lab. Ele
    instala o pacote externo Kitchen Sink, verifica o inventário da superfície do plugin SDK,
    consulta `/healthz` e `/readyz`, registra evidências de CPU/RSS do gateway,
    executa um turno live da OpenAI e verifica diagnósticos adversariais.
    Requer autenticação live da OpenAI, como `OPENAI_API_KEY`. Em sessões Testbox
    hidratadas, ele carrega automaticamente o perfil de autenticação live do Testbox quando o
    helper `openclaw-testbox-env` está presente.
- `pnpm test:gateway:cpu-scenarios`
  - Executa o benchmark de inicialização do gateway mais um pequeno pacote de cenários mock do QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) e grava um resumo combinado de observação de CPU
    em `.artifacts/gateway-cpu-scenarios/`.
  - Sinaliza por padrão apenas observações sustentadas de CPU quente (`--cpu-core-warn`
    mais `--hot-wall-warn-ms`), então picos curtos de inicialização são registrados como métricas
    sem parecer a regressão de gateway travado por minutos.
  - Usa artefatos compilados em `dist`; execute uma build primeiro quando o checkout ainda não
    tiver saída de runtime atualizada.
- `pnpm openclaw qa suite --runner multipass`
  - Executa a mesma suíte de QA dentro de uma VM Linux descartável do Multipass.
  - Mantém o mesmo comportamento de seleção de cenários que `qa suite` no host.
  - Reutiliza as mesmas flags de seleção de provedor/modelo que `qa suite`.
  - Execuções live encaminham as entradas de autenticação de QA compatíveis que são práticas para o convidado:
    chaves de provedor baseadas em env, o caminho da configuração do provedor live de QA e `CODEX_HOME`
    quando presente.
  - Diretórios de saída devem permanecer sob a raiz do repositório para que o convidado possa gravar de volta pelo
    workspace montado.
  - Grava o relatório + resumo normais de QA mais logs do Multipass em
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia o site de QA baseado em Docker para trabalho de QA no estilo operador.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Cria um tarball npm a partir do checkout atual, instala-o globalmente no
    Docker, executa onboarding não interativo com chave de API da OpenAI, configura Telegram
    por padrão, verifica que o runtime do plugin empacotado carrega sem reparo de dependência
    na inicialização, executa doctor e executa um turno de agente local contra um
    endpoint mock da OpenAI.
  - Use `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para executar a mesma lane de instalação empacotada
    com Discord.
- `pnpm test:docker:session-runtime-context`
  - Executa um smoke determinístico em Docker do app compilado para transcripts de contexto de runtime
    embutido. Ele verifica que o contexto de runtime oculto do OpenClaw é persistido como uma
    mensagem customizada não exibida em vez de vazar para o turno visível do usuário,
    depois semeia um JSONL de sessão quebrada afetada e verifica que
    `openclaw doctor --fix` o reescreve para a branch ativa com um backup.
- `pnpm test:docker:npm-telegram-live`
  - Instala um candidato de pacote OpenClaw no Docker, executa onboarding do pacote instalado,
    configura Telegram pela CLI instalada, depois reutiliza a lane live de QA do Telegram
    com esse pacote instalado como o Gateway SUT.
  - O padrão é `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; defina
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` ou
    `OPENCLAW_CURRENT_PACKAGE_TGZ` para testar um tarball local resolvido em vez de
    instalar a partir do registro.
  - Usa as mesmas credenciais env do Telegram ou a mesma fonte de credenciais Convex que
    `pnpm openclaw qa telegram`. Para automação de CI/release, defina
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` mais
    `OPENCLAW_QA_CONVEX_SITE_URL` e o segredo da função. Se
    `OPENCLAW_QA_CONVEX_SITE_URL` e um segredo de função Convex estiverem presentes no CI,
    o wrapper Docker seleciona Convex automaticamente.
  - O wrapper valida o env de credenciais do Telegram ou Convex no host antes do
    trabalho de build/instalação no Docker. Defina `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    somente ao depurar deliberadamente a configuração pré-credenciais.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` substitui o
    `OPENCLAW_QA_CREDENTIAL_ROLE` compartilhado apenas para esta lane.
  - GitHub Actions expõe esta lane como o workflow manual de mantenedor
    `NPM Telegram Beta E2E`. Ele não é executado em merge. O workflow usa o
    ambiente `qa-live-shared` e leases de credenciais CI do Convex.
- GitHub Actions também expõe `Package Acceptance` para prova de produto em execução lateral
  contra um pacote candidato. Ele aceita uma ref confiável, especificação npm publicada,
  URL HTTPS de tarball mais SHA-256, ou artefato de tarball de outra execução, faz upload
  do `openclaw-current.tgz` normalizado como `package-under-test`, depois executa o
  scheduler Docker E2E existente com perfis de lane smoke, pacote, produto, completo ou customizado.
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
    com OpenAI configurada, depois habilita canais/plugins incluídos por meio de edições
    na configuração.
  - Verifica que a descoberta de configuração deixa plugins baixáveis não configurados ausentes,
    que o primeiro reparo configurado do doctor instala cada plugin baixável ausente
    explicitamente, e que uma segunda reinicialização não executa reparo oculto de
    dependências.
  - Também instala uma baseline npm mais antiga conhecida, habilita Telegram antes de executar
    `openclaw update --tag <candidate>`, e verifica que o doctor pós-atualização
    do candidato limpa detritos de dependências de plugins legados sem um
    reparo postinstall no lado do harness.
- `pnpm test:parallels:npm-update`
  - Executa o smoke nativo de atualização de instalação empacotada entre convidados do Parallels. Cada
    plataforma selecionada primeiro instala o pacote baseline solicitado, depois executa o comando
    `openclaw update` instalado no mesmo convidado e verifica a
    versão instalada, status de atualização, prontidão do gateway e um turno de agente local.
  - Use `--platform macos`, `--platform windows` ou `--platform linux` ao
    iterar em um convidado. Use `--json` para o caminho do artefato de resumo e
    status por lane.
  - A lane OpenAI usa `openai/gpt-5.5` para a prova live de turno de agente por
    padrão. Passe `--model <provider/model>` ou defina
    `OPENCLAW_PARALLELS_OPENAI_MODEL` ao validar deliberadamente outro
    modelo OpenAI.
  - Envolva execuções locais longas em um timeout de host para que travamentos no transporte do Parallels não
    consumam o restante da janela de testes:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - O script grava logs aninhados de lane em `/tmp/openclaw-parallels-npm-update.*`.
    Inspecione `windows-update.log`, `macos-update.log` ou `linux-update.log`
    antes de assumir que o wrapper externo travou.
  - A atualização do Windows pode passar de 10 a 15 minutos em doctor pós-atualização e trabalho de
    atualização de pacote em um convidado frio; isso ainda é saudável quando o log
    debug aninhado do npm está avançando.
  - Não execute este wrapper agregado em paralelo com lanes smoke individuais do Parallels
    macOS, Windows ou Linux. Eles compartilham estado de VM e podem colidir na
    restauração de snapshot, no fornecimento de pacote ou no estado do gateway convidado.
  - A prova pós-atualização executa a superfície normal de plugins incluídos porque
    facades de capability como fala, geração de imagem e compreensão de mídia
    são carregadas por APIs de runtime incluídas mesmo quando o próprio turno do agente
    verifica apenas uma resposta de texto simples.

- `pnpm openclaw qa aimock`
  - Inicia apenas o servidor local de provedor AIMock para testes smoke diretos de
    protocolo.
- `pnpm openclaw qa matrix`
  - Executa a lane live de QA do Matrix contra um homeserver Tuwunel descartável baseado em Docker. Somente checkout de origem — instalações empacotadas não incluem `qa-lab`.
  - CLI completa, catálogo de perfis/cenários, env vars e layout de artefatos: [QA do Matrix](/pt-BR/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Executa a lane live de QA do Telegram contra um grupo privado real usando os tokens do bot driver e do SUT vindos do env.
  - Requer `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. O id do grupo deve ser o id numérico do chat do Telegram.
  - Suporta `--credential-source convex` para credenciais compartilhadas em pool. Use o modo env por padrão, ou defina `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por leases em pool.
  - Sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando você
    quiser artefatos sem um código de saída de falha.
  - Requer dois bots distintos no mesmo grupo privado, com o bot SUT expondo um nome de usuário do Telegram.
  - Para observação estável de bot para bot, habilite o Bot-to-Bot Communication Mode em `@BotFather` para ambos os bots e garanta que o bot driver consiga observar o tráfego de bots do grupo.
  - Grava um relatório de QA do Telegram, resumo e artefato de mensagens observadas em `.artifacts/qa-e2e/...`. Cenários de resposta incluem RTT desde a solicitação de envio do driver até a resposta observada do SUT.

Lanes de transporte live compartilham um contrato padrão para que novos transportes não divirjam; a matriz de cobertura por lane fica em [visão geral de QA → cobertura de transporte live](/pt-BR/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` é a suíte sintética ampla e não faz parte dessa matriz.

### Credenciais compartilhadas do Telegram via Convex (v1)

Quando `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) está habilitado para
`openclaw qa telegram`, o QA lab adquire um lease exclusivo de um pool baseado em Convex, envia heartbeats
para esse lease enquanto a lane está em execução e libera o lease no encerramento.

Scaffold de projeto Convex de referência:

- `qa/convex-credential-broker/`

Env vars obrigatórias:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por exemplo `https://your-deployment.convex.site`)
- Um segredo para a função selecionada:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Seleção de função de credencial:
  - CLI: `--credential-role maintainer|ci`
  - Padrão de env: `OPENCLAW_QA_CREDENTIAL_ROLE` (o padrão é `ci` no CI, `maintainer` caso contrário)

Env vars opcionais:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (padrão `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (padrão `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (padrão `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (padrão `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (padrão `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de rastreamento opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URLs Convex `http://` de loopback para desenvolvimento somente local.

`OPENCLAW_QA_CONVEX_SITE_URL` deve usar `https://` em operação normal.

Comandos administrativos de mantenedor (pool add/remove/list) exigem
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` especificamente.

Helpers de CLI para mantenedores:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Use `doctor` antes de execuções live para verificar a URL do site Convex, segredos do broker,
prefixo do endpoint, timeout HTTP e alcançabilidade de admin/list sem imprimir
valores secretos. Use `--json` para saída legível por máquina em scripts e utilitários
de CI.

Contrato de endpoint padrão (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Requisição: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Sucesso: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Esgotado/tentável novamente: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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

### Adicionar um canal ao QA

A arquitetura e os nomes de helpers de cenário para novos adaptadores de canal ficam em [Visão geral do QA → Adicionar um canal](/pt-BR/concepts/qa-e2e-automation#adding-a-channel). O requisito mínimo: implementar o runner de transporte no seam compartilhado do host `qa-lab`, declarar `qaRunners` no manifesto do plugin, montar como `openclaw qa <runner>` e criar cenários em `qa/scenarios/`.

## Suítes de teste (o que roda onde)

Pense nas suítes como “realismo crescente” (e instabilidade/custo crescentes):

### Unidade / integração (padrão)

- Comando: `pnpm test`
- Configuração: execuções sem alvo usam o conjunto de shards `vitest.full-*.config.ts` e podem expandir shards multiprojeto em configurações por projeto para agendamento paralelo
- Arquivos: inventários core/unidade em `src/**/*.test.ts`, `packages/**/*.test.ts` e `test/**/*.test.ts`; testes unitários de UI rodam no shard dedicado `unit-ui`
- Escopo:
  - Testes unitários puros
  - Testes de integração em processo (autenticação do gateway, roteamento, tooling, parsing, configuração)
  - Regressões determinísticas para bugs conhecidos
- Expectativas:
  - Roda em CI
  - Não exige chaves reais
  - Deve ser rápido e estável
  - Testes de resolvedor e loader de superfície pública devem comprovar o comportamento amplo de fallback de `api.js` e
    `runtime-api.js` com fixtures de plugin minúsculas geradas, não
    APIs de origem de plugin real empacotado. Cargas de API de plugins reais pertencem a
    suítes de contrato/integração de propriedade do plugin.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - `pnpm test` sem alvo roda doze configurações de shard menores (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) em vez de um processo gigante nativo de projeto raiz. Isso reduz o pico de RSS em máquinas carregadas e evita que trabalho de auto-reply/extensão prive suítes não relacionadas.
    - `pnpm test --watch` ainda usa o grafo nativo de projetos raiz de `vitest.config.ts`, porque um loop de observação multishard não é prático.
    - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` encaminham alvos explícitos de arquivo/diretório primeiro por lanes com escopo, então `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar o custo total de inicialização do projeto raiz.
    - `pnpm test:changed` expande caminhos git alterados em lanes baratas com escopo por padrão: edições diretas de teste, arquivos irmãos `*.test.ts`, mapeamentos explícitos de origem e dependentes locais do grafo de importação. Edições de config/setup/package não executam testes amplos, a menos que você use explicitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` é o gate normal inteligente de verificação local para trabalho restrito. Ele classifica o diff em core, testes do core, extensions, testes de extensão, apps, docs, metadados de release, tooling Docker live e tooling, depois executa os comandos correspondentes de typecheck, lint e guard. Ele não executa testes Vitest; chame `pnpm test:changed` ou `pnpm test <target>` explícito para prova de teste. Aumentos de versão somente de metadados de release executam verificações direcionadas de versão/config/dependência raiz, com uma proteção que rejeita alterações de package fora do campo de versão de nível superior.
    - Edições no harness ACP Docker live executam verificações focadas: sintaxe de shell para os scripts de autenticação Docker live e um dry-run do agendador Docker live. Alterações em `package.json` são incluídas somente quando o diff é limitado a `scripts["test:docker:live-*"]`; edições de dependência, exportação, versão e outras superfícies de package ainda usam as proteções mais amplas.
    - Testes unitários leves em importações de agents, commands, plugins, helpers de auto-reply, `plugin-sdk` e áreas utilitárias puras semelhantes passam pela lane `unit-fast`, que pula `test/setup-openclaw-runtime.ts`; arquivos com estado/pesados de runtime permanecem nas lanes existentes.
    - Arquivos-fonte de helper selecionados de `plugin-sdk` e `commands` também mapeiam execuções em modo alterado para testes irmãos explícitos nessas lanes leves, então edições de helper evitam reexecutar a suíte pesada inteira desse diretório.
    - `auto-reply` tem buckets dedicados para helpers core de nível superior, testes de integração `reply.*` de nível superior e a subárvore `src/auto-reply/reply/**`. O CI divide ainda mais a subárvore de reply em shards de agent-runner, dispatch e commands/state-routing para que um bucket pesado em importações não fique com toda a cauda do Node.
    - CI normal de PR/main ignora intencionalmente a varredura em lote de extensão e o shard `agentic-plugins` somente de release. Full Release Validation despacha o workflow filho separado `Plugin Prerelease` para essas suítes pesadas de plugins/extensions em candidatos a release.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Ao alterar entradas de descoberta de ferramenta de mensagem ou contexto de runtime de compaction,
      mantenha os dois níveis de cobertura.
    - Adicione regressões focadas de helper para limites puros de roteamento e normalização.
    - Mantenha saudáveis as suítes de integração do runner embutido:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Essas suítes verificam que ids com escopo e comportamento de compaction ainda fluem
      pelos caminhos reais de `run.ts` / `compact.ts`; testes apenas de helper
      não são substituto suficiente para esses caminhos de integração.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - A configuração base do Vitest usa `threads` por padrão.
    - A configuração compartilhada do Vitest fixa `isolate: false` e usa o
      runner não isolado entre os projetos raiz, e2e e configurações live.
    - A lane raiz de UI mantém seu setup `jsdom` e otimizador, mas também roda no
      runner compartilhado não isolado.
    - Cada shard de `pnpm test` herda os mesmos padrões `threads` + `isolate: false`
      da configuração compartilhada do Vitest.
    - `scripts/run-vitest.mjs` adiciona `--no-maglev` aos processos Node filhos do Vitest
      por padrão para reduzir churn de compilação do V8 durante grandes execuções locais.
      Defina `OPENCLAW_VITEST_ENABLE_MAGLEV=1` para comparar com o comportamento padrão do V8.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` mostra quais lanes arquiteturais um diff aciona.
    - O hook de pre-commit é apenas de formatação. Ele recoloca em stage arquivos formatados e
      não executa lint, typecheck nem testes.
    - Execute `pnpm check:changed` explicitamente antes do handoff ou push quando você
      precisar do gate inteligente de verificação local.
    - `pnpm test:changed` passa por lanes baratas com escopo por padrão. Use
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` somente quando o agente
      decidir que uma edição de harness, config, package ou contrato realmente precisa de cobertura
      Vitest mais ampla.
    - `pnpm test:max` e `pnpm test:changed:max` mantêm o mesmo comportamento de roteamento,
      apenas com um limite maior de workers.
    - O autoescalonamento de workers local é intencionalmente conservador e recua
      quando a média de carga do host já está alta, então várias execuções
      Vitest simultâneas causam menos impacto por padrão.
    - A configuração base do Vitest marca os arquivos de projetos/config como
      `forceRerunTriggers` para que reexecuções em modo alterado permaneçam corretas quando a fiação
      de testes muda.
    - A configuração mantém `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado em hosts
      compatíveis; defina `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se você quiser
      um local de cache explícito para profiling direto.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` habilita o relatório de duração de importação do Vitest, além de
      saída de detalhamento de importações.
    - `pnpm test:perf:imports:changed` restringe a mesma visualização de profiling a
      arquivos alterados desde `origin/main`.
    - Dados de timing de shard são gravados em `.artifacts/vitest-shard-timings.json`.
      Execuções de configuração inteira usam o caminho da configuração como chave; shards de CI
      com padrão de inclusão acrescentam o nome do shard para que shards filtrados possam ser acompanhados
      separadamente.
    - Quando um teste quente ainda gasta a maior parte do tempo em importações de inicialização,
      mantenha dependências pesadas atrás de um seam local estreito `*.runtime.ts` e
      faça mock desse seam diretamente em vez de importar profundamente helpers de runtime apenas
      para passá-los por `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compara o
      `test:changed` roteado com o caminho nativo de projeto raiz para esse diff comitado
      e imprime o tempo de parede mais o RSS máximo no macOS.
    - `pnpm test:perf:changed:bench -- --worktree` faz benchmark da árvore suja
      atual roteando a lista de arquivos alterados por
      `scripts/test-projects.mjs` e pela configuração raiz do Vitest.
    - `pnpm test:perf:profile:main` grava um perfil de CPU da thread principal para
      overhead de inicialização e transformação do Vitest/Vite.
    - `pnpm test:perf:profile:runner` grava perfis de CPU+heap do runner para a
      suíte unitária com paralelismo de arquivos desabilitado.

  </Accordion>
</AccordionGroup>

### Estabilidade (Gateway)

- Comando: `pnpm test:stability:gateway`
- Configuração: `vitest.gateway.config.ts`, forçada a um worker
- Escopo:
  - Inicia um Gateway local loopback real com diagnósticos habilitados por padrão
  - Conduz churn sintético de mensagens do gateway, memória e payloads grandes pelo caminho de eventos de diagnóstico
  - Consulta `diagnostics.stability` pelo RPC WS do Gateway
  - Cobre helpers de persistência do bundle de estabilidade de diagnóstico
  - Afirma que o gravador permanece limitado, amostras sintéticas de RSS ficam abaixo do orçamento de pressão e profundidades de fila por sessão drenam de volta para zero
- Expectativas:
  - Seguro para CI e sem chaves
  - Lane estreita para acompanhamento de regressão de estabilidade, não um substituto para a suíte completa do Gateway

### E2E (smoke do gateway)

- Comando: `pnpm test:e2e`
- Configuração: `vitest.e2e.config.ts`
- Arquivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` e testes E2E de Plugins empacotados em `extensions/`
- Padrões de runtime:
  - Usa `threads` do Vitest com `isolate: false`, correspondendo ao restante do repositório.
  - Usa workers adaptativos (CI: até 2, local: 1 por padrão).
  - Executa em modo silencioso por padrão para reduzir a sobrecarga de E/S do console.
- Sobrescritas úteis:
  - `OPENCLAW_E2E_WORKERS=<n>` para forçar a contagem de workers (limitada a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para reativar a saída detalhada do console.
- Escopo:
  - Comportamento de ponta a ponta de Gateway com múltiplas instâncias
  - Superfícies WebSocket/HTTP, pareamento de nós e rede mais pesada
- Expectativas:
  - Executa na CI (quando habilitado no pipeline)
  - Não requer chaves reais
  - Mais partes móveis do que testes unitários (pode ser mais lento)

### E2E: smoke do backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- Arquivo: `extensions/openshell/src/backend.e2e.test.ts`
- Escopo:
  - Inicia um Gateway OpenShell isolado no host via Docker
  - Cria uma sandbox a partir de um Dockerfile local temporário
  - Exercita o backend OpenShell do OpenClaw por meio de `sandbox ssh-config` real + execução SSH
  - Verifica o comportamento de sistema de arquivos canônico remoto pela ponte fs da sandbox
- Expectativas:
  - Apenas opt-in; não faz parte da execução padrão de `pnpm test:e2e`
  - Requer uma CLI `openshell` local, além de um daemon Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` isolados e depois destrói o Gateway de teste e a sandbox
- Sobrescritas úteis:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar o teste ao executar manualmente a suíte e2e mais ampla
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apontar para um binário da CLI não padrão ou script wrapper

### Live (provedores reais + modelos reais)

- Comando: `pnpm test:live`
- Configuração: `vitest.live.config.ts`
- Arquivos: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` e testes live de Plugins empacotados em `extensions/`
- Padrão: **habilitado** por `pnpm test:live` (define `OPENCLAW_LIVE_TEST=1`)
- Escopo:
  - “Este provedor/modelo realmente funciona _hoje_ com credenciais reais?”
  - Detectar mudanças de formato de provedores, peculiaridades de chamadas de ferramentas, problemas de autenticação e comportamento de limites de taxa
- Expectativas:
  - Não é estável para CI por design (redes reais, políticas reais de provedores, cotas, indisponibilidades)
  - Custa dinheiro / usa limites de taxa
  - Prefira executar subconjuntos reduzidos em vez de “tudo”
- Execuções live carregam `~/.profile` para obter chaves de API ausentes.
- Por padrão, execuções live ainda isolam `HOME` e copiam material de configuração/autenticação para um diretório home temporário de teste, para que fixtures unitárias não possam modificar seu `~/.openclaw` real.
- Defina `OPENCLAW_LIVE_USE_REAL_HOME=1` apenas quando você precisar intencionalmente que os testes live usem seu diretório home real.
- `pnpm test:live` agora usa por padrão um modo mais silencioso: mantém a saída de progresso `[live] ...`, mas suprime o aviso extra de `~/.profile` e silencia logs de bootstrap do Gateway/conversa do Bonjour. Defina `OPENCLAW_LIVE_TEST_QUIET=0` se quiser os logs completos de inicialização de volta.
- Rotação de chave de API (específica por provedor): defina `*_API_KEYS` com formato separado por vírgula/ponto e vírgula ou `*_API_KEY_1`, `*_API_KEY_2` (por exemplo, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou uma sobrescrita por live via `OPENCLAW_LIVE_*_KEY`; os testes repetem em respostas de limite de taxa.
- Saída de progresso/Heartbeat:
  - Suítes live agora emitem linhas de progresso para stderr, para que chamadas longas a provedores fiquem visivelmente ativas mesmo quando a captura do console do Vitest estiver silenciosa.
  - `vitest.live.config.ts` desabilita a interceptação do console do Vitest, para que linhas de progresso do provedor/Gateway sejam transmitidas imediatamente durante execuções live.
  - Ajuste heartbeats de modelo direto com `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajuste heartbeats de Gateway/probe com `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Qual suíte devo executar?

Use esta tabela de decisão:

- Editando lógica/testes: execute `pnpm test` (e `pnpm test:coverage` se você alterou muita coisa)
- Tocando rede do Gateway / protocolo WS / pareamento: adicione `pnpm test:e2e`
- Depurando “meu bot está fora do ar” / falhas específicas de provedor / chamadas de ferramentas: execute um `pnpm test:live` reduzido

## Testes live (que tocam rede)

Para a matriz de modelos live, smokes de backend da CLI, smokes ACP, harness do servidor de aplicativo Codex
e todos os testes live de provedores de mídia (Deepgram, BytePlus, ComfyUI, imagem,
música, vídeo, harness de mídia) — além do tratamento de credenciais para execuções live — consulte
[Testando suítes live](/pt-BR/help/testing-live). Para o checklist dedicado de atualização e
validação de Plugins, consulte
[Testando atualizações e Plugins](/pt-BR/help/testing-updates-plugins).

## Runners Docker (verificações opcionais de "funciona no Linux")

Estes runners Docker se dividem em dois grupos:

- Runners de modelo live: `test:docker:live-models` e `test:docker:live-gateway` executam apenas o arquivo live de chave de perfil correspondente dentro da imagem Docker do repositório (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando seu diretório de configuração local e workspace (e carregando `~/.profile` se montado). Os pontos de entrada locais correspondentes são `test:live:models-profiles` e `test:live:gateway-profiles`.
- Runners live Docker usam por padrão um limite de smoke menor para que uma varredura Docker completa permaneça prática:
  `test:docker:live-models` usa por padrão `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa por padrão `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sobrescreva essas variáveis de ambiente quando você
  quiser explicitamente a varredura exaustiva maior.
- `test:docker:all` constrói a imagem Docker live uma vez via `test:docker:live-build`, empacota o OpenClaw uma vez como um tarball npm por meio de `scripts/package-openclaw-for-docker.mjs` e então constrói/reutiliza duas imagens `scripts/e2e/Dockerfile`. A imagem básica é apenas o runner Node/Git para lanes de instalação/atualização/dependências de Plugins; essas lanes montam o tarball pré-construído. A imagem funcional instala o mesmo tarball em `/app` para lanes de funcionalidade do aplicativo construído. As definições de lanes Docker ficam em `scripts/lib/docker-e2e-scenarios.mjs`; a lógica do planner fica em `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` executa o plano selecionado. O agregado usa um agendador local ponderado: `OPENCLAW_DOCKER_ALL_PARALLELISM` controla slots de processo, enquanto limites de recursos impedem que lanes pesadas live, de instalação npm e multisserviço iniciem todas ao mesmo tempo. Se uma única lane for mais pesada do que os limites ativos, o agendador ainda pode iniciá-la quando o pool estiver vazio e então a mantém executando sozinha até que a capacidade esteja disponível novamente. Os padrões são 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ajuste `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` apenas quando o host Docker tiver mais folga. O runner executa um preflight Docker por padrão, remove containers E2E OpenClaw obsoletos, imprime status a cada 30 segundos, armazena tempos de lanes bem-sucedidas em `.artifacts/docker-tests/lane-timings.json` e usa esses tempos para iniciar lanes mais longas primeiro em execuções posteriores. Use `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir o manifesto ponderado de lanes sem construir ou executar Docker, ou `node scripts/test-docker-all.mjs --plan-json` para imprimir o plano de CI para lanes selecionadas, necessidades de pacote/imagem e credenciais.
- `Package Acceptance` é o gate de pacote nativo do GitHub para "este tarball instalável funciona como produto?" Ele resolve um pacote candidato a partir de `source=npm`, `source=ref`, `source=url` ou `source=artifact`, faz upload dele como `package-under-test` e então executa as lanes Docker E2E reutilizáveis contra esse tarball exato em vez de reempacotar a ref selecionada. Os perfis são ordenados por abrangência: `smoke`, `package`, `product` e `full`. Consulte [Testando atualizações e Plugins](/pt-BR/help/testing-updates-plugins) para o contrato de pacote/atualização/Plugin, a matriz de sobrevivência de upgrade publicado, os padrões de release e a triagem de falhas.
- Verificações de build e release executam `scripts/check-cli-bootstrap-imports.mjs` após tsdown. A proteção percorre o grafo estático construído a partir de `dist/entry.js` e `dist/cli/run-main.js` e falha se importações de inicialização pré-despacho carregarem dependências de pacote como Commander, UI de prompt, undici ou logging antes do despacho do comando; ela também mantém o chunk empacotado de execução do Gateway dentro do orçamento e rejeita importações estáticas de caminhos frios conhecidos do Gateway. O smoke da CLI empacotada também cobre ajuda raiz, ajuda de onboard, ajuda de doctor, status, esquema de configuração e um comando de lista de modelos.
- A compatibilidade legada do Package Acceptance é limitada a `2026.4.25` (`2026.4.25-beta.*` incluído). Até esse ponto de corte, o harness tolera apenas lacunas de metadados de pacotes lançados: entradas de inventário QA privadas omitidas, `gateway install --wrapper` ausente, arquivos de patch ausentes no fixture git derivado do tarball, `update.channel` persistido ausente, locais legados de registros de instalação de Plugins, persistência ausente de registros de instalação do marketplace e migração de metadados de configuração durante `plugins update`. Para pacotes posteriores a `2026.4.25`, esses caminhos são falhas estritas.
- Runners de smoke de container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` e `test:docker:config-reload` inicializam um ou mais containers reais e verificam caminhos de integração de nível mais alto.

Os runners Docker de modelo live também montam por bind apenas os diretórios home de autenticação da CLI necessários (ou todos os compatíveis quando a execução não é reduzida) e então os copiam para o home do container antes da execução, para que OAuth de CLIs externas possa atualizar tokens sem modificar o armazenamento de autenticação do host:

- Modelos diretos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke de vínculo ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; cobre Claude, Codex e Gemini por padrão, com cobertura estrita de Droid/OpenCode via `pnpm test:docker:live-acp-bind:droid` e `pnpm test:docker:live-acp-bind:opencode`)
- Smoke de backend da CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke do harness do servidor de aplicativo Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente de desenvolvimento: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke de observabilidade: `pnpm qa:otel:smoke` é uma faixa privada de verificação de checkout de código-fonte de QA. Intencionalmente, ela não faz parte das faixas de lançamento de pacote Docker porque o tarball npm omite o QA Lab.
- Smoke ao vivo do Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Assistente de onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke de onboarding/canal/agente do tarball npm: `pnpm test:docker:npm-onboard-channel-agent` instala o tarball OpenClaw empacotado globalmente no Docker, configura OpenAI via onboarding por referência de ambiente e Telegram por padrão, executa o doctor e executa uma rodada de agente OpenAI simulada. Reutilize um tarball pré-criado com `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pule a recompilação do host com `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ou troque o canal com `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` ou `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- Smoke de troca de canal de atualização: `pnpm test:docker:update-channel-switch` instala o tarball OpenClaw empacotado globalmente no Docker, troca de pacote `stable` para git `dev`, verifica o canal persistido e o funcionamento do plugin após a atualização, depois troca de volta para o pacote `stable` e verifica o status de atualização.
- Smoke de sobrevivente de upgrade: `pnpm test:docker:upgrade-survivor` instala o tarball OpenClaw empacotado sobre um fixture sujo de usuário antigo com agentes, configuração de canal, allowlists de plugins, estado obsoleto de dependências de plugins e arquivos existentes de workspace/sessão. Ele executa atualização de pacote e doctor não interativo sem provedor ao vivo nem chaves de canal, depois inicia um Gateway de loopback e verifica a preservação de configuração/estado mais orçamentos de inicialização/status.
- Smoke de sobrevivente de upgrade publicado: `pnpm test:docker:published-upgrade-survivor` instala `openclaw@latest` por padrão, semeia arquivos realistas de usuário existente, configura essa linha de base com uma receita de comando incorporada, valida a configuração resultante, atualiza essa instalação publicada para o tarball candidato, executa doctor não interativo, grava `.artifacts/upgrade-survivor/summary.json`, depois inicia um Gateway de loopback e verifica intents configuradas, preservação de estado, inicialização, `/healthz`, `/readyz` e orçamentos de status RPC. Substitua uma linha de base com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, peça ao agendador agregado para expandir linhas de base locais exatas com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, como `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, e expanda fixtures em formato de issue com `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, como `reported-issues`; o conjunto reported-issues inclui `configured-plugin-installs` para reparo automático de instalação de Plugin externo do OpenClaw. Package Acceptance expõe isso como `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` e `published_upgrade_survivor_scenarios`, resolve tokens de linha de base meta como `last-stable-4` ou `all-since-2026.4.23`, e Full Release Validation expande o gate de pacote release-soak para `last-stable-4 2026.4.23 2026.5.2 2026.4.15` mais `reported-issues`.
- Smoke de contexto de runtime de sessão: `pnpm test:docker:session-runtime-context` verifica a persistência oculta de transcrição de contexto de runtime mais o reparo pelo doctor de ramificações duplicadas afetadas de reescrita de prompt.
- Smoke de instalação global Bun: `bash scripts/e2e/bun-global-install-smoke.sh` empacota a árvore atual, instala-a com `bun install -g` em um home isolado e verifica que `openclaw infer image providers --json` retorna provedores de imagem incluídos em vez de travar. Reutilize um tarball pré-criado com `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pule a compilação do host com `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ou copie `dist/` de uma imagem Docker compilada com `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker do instalador: `bash scripts/test-install-sh-docker.sh` compartilha um cache npm entre seus contêineres root, update e direct-npm. O smoke de atualização usa npm `latest` como linha de base estável por padrão antes de atualizar para o tarball candidato. Substitua com `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` localmente, ou com a entrada `update_baseline_version` do workflow Install Smoke no GitHub. As verificações do instalador sem root mantêm um cache npm isolado para que entradas de cache pertencentes ao root não mascarem o comportamento de instalação local do usuário. Defina `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` para reutilizar o cache root/update/direct-npm em novas execuções locais.
- A CI Install Smoke pula a atualização global direct-npm duplicada com `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; execute o script localmente sem esse ambiente quando for necessária cobertura direta de `npm install -g`.
- Smoke da CLI de exclusão de workspace compartilhado de agentes: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) compila a imagem do Dockerfile raiz por padrão, semeia dois agentes com um workspace em um home de contêiner isolado, executa `agents delete --json` e verifica JSON válido mais o comportamento de workspace retido. Reutilize a imagem install-smoke com `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Rede do Gateway (dois contêineres, autenticação WS + integridade): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Smoke de snapshot CDP do navegador: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) compila a imagem E2E de código-fonte mais uma camada Chromium, inicia o Chromium com CDP bruto, executa `browser doctor --deep` e verifica que snapshots de função CDP cobrem URLs de links, clicáveis promovidos por cursor, refs de iframe e metadados de frame.
- Regressão de raciocínio mínimo do OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) executa um servidor OpenAI simulado através do Gateway, verifica que `web_search` eleva `reasoning.effort` de `minimal` para `low`, depois força a rejeição do esquema do provedor e confere que o detalhe bruto aparece nos logs do Gateway.
- Ponte de canal MCP (Gateway semeado + ponte stdio + smoke de frame de notificação bruto do Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Ferramentas MCP do pacote Pi (servidor MCP stdio real + smoke de permitir/negar do perfil Pi incorporado): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Limpeza MCP de Cron/subagente (Gateway real + encerramento de filho MCP stdio após execuções isoladas de cron e subagente one-shot): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke de instalação/atualização para caminho local, `file:`, registro npm com dependências içadas, refs git móveis, kitchen-sink do ClawHub, atualizações de marketplace e ativação/inspeção do pacote Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Defina `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para pular o bloco ClawHub, ou substitua o par pacote/runtime kitchen-sink padrão com `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` e `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sem `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, o teste usa um servidor de fixture ClawHub local hermético.
- Smoke de atualização inalterada de Plugin: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke de matriz de ciclo de vida de Plugin: `pnpm test:docker:plugin-lifecycle-matrix` instala o tarball OpenClaw empacotado em um contêiner limpo, instala um Plugin npm, alterna habilitar/desabilitar, faz upgrade e downgrade dele através de um registro npm local, exclui o código instalado, depois verifica que a desinstalação ainda remove estado obsoleto enquanto registra métricas de RSS/CPU para cada fase do ciclo de vida.
- Smoke de metadados de recarga de configuração: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` cobre smoke de instalação/atualização para caminho local, `file:`, registro npm com dependências içadas, refs git móveis, fixtures do ClawHub, atualizações de marketplace e ativação/inspeção do pacote Claude. `pnpm test:docker:plugin-update` cobre o comportamento de atualização inalterada para plugins instalados. `pnpm test:docker:plugin-lifecycle-matrix` cobre instalação, habilitação, desabilitação, upgrade, downgrade e desinstalação com código ausente de Plugin npm com rastreamento de recursos.

Para pré-compilar e reutilizar manualmente a imagem funcional compartilhada:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Substituições de imagem específicas da suíte, como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, ainda prevalecem quando definidas. Quando `OPENCLAW_SKIP_DOCKER_BUILD=1` aponta para uma imagem remota compartilhada, os scripts a baixam se ela ainda não estiver local. Os testes Docker de QR e instalador mantêm seus próprios Dockerfiles porque validam comportamento de pacote/instalação, em vez do runtime de aplicativo compilado compartilhado.

Os executores Docker de modelos ao vivo também montam a checkout atual como somente leitura e
a preparam em um diretório de trabalho temporário dentro do contêiner. Isso mantém a imagem de runtime
enxuta enquanto ainda executa o Vitest contra sua fonte/configuração local exata.
A etapa de preparação ignora caches grandes somente locais e saídas de build de apps, como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e diretórios `.build` locais de apps ou
diretórios de saída do Gradle, para que execuções Docker ao vivo não gastem minutos copiando
artefatos específicos da máquina.
Eles também definem `OPENCLAW_SKIP_CHANNELS=1` para que sondas ao vivo do gateway não iniciem
workers reais de canais Telegram/Discord/etc. dentro do contêiner.
`test:docker:live-models` ainda executa `pnpm test:live`, então repasse também
`OPENCLAW_LIVE_GATEWAY_*` quando você precisar limitar ou excluir a cobertura ao vivo do gateway
dessa faixa Docker.
`test:docker:openwebui` é um smoke de compatibilidade de nível mais alto: ele inicia um
contêiner de Gateway OpenClaw com os endpoints HTTP compatíveis com OpenAI habilitados,
inicia um contêiner Open WebUI fixado contra esse Gateway, faz login pelo
Open WebUI, verifica se `/api/models` expõe `openclaw/default` e então envia uma
solicitação real de chat pelo proxy `/api/chat/completions` do Open WebUI.
A primeira execução pode ser visivelmente mais lenta porque o Docker talvez precise baixar a
imagem do Open WebUI e o Open WebUI talvez precise concluir sua própria configuração de inicialização fria.
Essa faixa espera uma chave de modelo ao vivo utilizável, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` por padrão) é a principal forma de fornecê-la em execuções dockerizadas.
Execuções bem-sucedidas imprimem uma pequena carga útil JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` é intencionalmente determinístico e não precisa de uma
conta real do Telegram, Discord ou iMessage. Ele inicializa um contêiner Gateway
semeado, inicia um segundo contêiner que gera `openclaw mcp serve` e então
verifica descoberta de conversas roteadas, leituras de transcrição, metadados de anexos,
comportamento da fila de eventos ao vivo, roteamento de envio de saída e notificações de canal +
permissão no estilo Claude pela ponte MCP stdio real. A verificação de notificação
inspeciona diretamente os quadros MCP stdio brutos, para que o smoke valide o que a
ponte realmente emite, não apenas o que um SDK de cliente específico por acaso expõe.
`test:docker:pi-bundle-mcp-tools` é determinístico e não precisa de uma chave de modelo
ao vivo. Ele cria a imagem Docker do repositório, inicia um servidor de sondagem MCP stdio real
dentro do contêiner, materializa esse servidor pelo runtime MCP do bundle Pi
embutido, executa a ferramenta e então verifica se `coding` e `messaging` mantêm
ferramentas `bundle-mcp`, enquanto `minimal` e `tools.deny: ["bundle-mcp"]` as filtram.
`test:docker:cron-mcp-cleanup` é determinístico e não precisa de uma chave de modelo
ao vivo. Ele inicia um Gateway semeado com um servidor de sondagem MCP stdio real, executa
um turno cron isolado e um turno filho único de `/subagents spawn` e então verifica
se o processo filho MCP termina após cada execução.

Smoke manual de thread ACP em linguagem natural (não CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantenha este script para fluxos de trabalho de regressão/debug. Ele pode ser necessário novamente para validação de roteamento de threads ACP, então não o exclua.

Variáveis de ambiente úteis:

- `OPENCLAW_CONFIG_DIR=...` (padrão: `~/.openclaw`) montado em `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (padrão: `~/.openclaw/workspace`) montado em `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (padrão: `~/.profile`) montado em `/home/node/.profile` e carregado antes de executar os testes
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar apenas variáveis de ambiente carregadas de `OPENCLAW_PROFILE_FILE`, usando diretórios temporários de configuração/workspace e sem montagens externas de autenticação da CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (padrão: `~/.cache/openclaw/docker-cli-tools`) montado em `/home/node/.npm-global` para instalações de CLI em cache dentro do Docker
- Diretórios/arquivos externos de autenticação da CLI em `$HOME` são montados como somente leitura em `/host-auth...` e depois copiados para `/home/node/...` antes do início dos testes
  - Diretórios padrão: `.minimax`
  - Arquivos padrão: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Execuções com provedor limitado montam apenas os diretórios/arquivos necessários inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Sobrescreva manualmente com `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` ou uma lista separada por vírgulas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para limitar a execução
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar provedores dentro do contêiner
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar uma imagem `openclaw:local-live` existente em reexecuções que não precisam de rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para garantir que as credenciais venham do repositório de perfis (não do ambiente)
- `OPENCLAW_OPENWEBUI_MODEL=...` para escolher o modelo exposto pelo gateway para o smoke do Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para substituir o prompt de verificação de nonce usado pelo smoke do Open WebUI
- `OPENWEBUI_IMAGE=...` para substituir a tag fixada da imagem Open WebUI

## Sanidade da documentação

Execute verificações da documentação após edições em docs: `pnpm check:docs`.
Execute a validação completa de âncoras do Mintlify quando você também precisar de verificações de títulos dentro da página: `pnpm docs:check-links:anchors`.

## Regressão offline (segura para CI)

Estas são regressões de “pipeline real” sem provedores reais:

- Chamada de ferramenta do Gateway (OpenAI simulado, gateway real + loop de agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistente de configuração do Gateway (WS `wizard.start`/`wizard.next`, grava configuração + autenticação aplicada): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Evals de confiabilidade de agentes (Skills)

Já temos alguns testes seguros para CI que se comportam como “evals de confiabilidade de agentes”:

- Chamada de ferramenta simulada pelo gateway real + loop de agente (`src/gateway/gateway.test.ts`).
- Fluxos de assistente de configuração de ponta a ponta que validam a fiação de sessão e efeitos de configuração (`src/gateway/gateway.test.ts`).

O que ainda falta para Skills (veja [Skills](/pt-BR/tools/skills)):

- **Tomada de decisão:** quando Skills são listadas no prompt, o agente escolhe a skill correta (ou evita as irrelevantes)?
- **Conformidade:** o agente lê `SKILL.md` antes do uso e segue as etapas/args obrigatórios?
- **Contratos de fluxo de trabalho:** cenários multi-turno que validam ordem de ferramentas, transporte do histórico da sessão e limites do sandbox.

Evals futuros devem permanecer determinísticos primeiro:

- Um executor de cenários usando provedores simulados para validar chamadas de ferramentas + ordem, leituras de arquivos de skill e fiação de sessão.
- Uma pequena suíte de cenários focados em skills (usar vs. evitar, gates, injeção de prompt).
- Evals ao vivo opcionais (opt-in, protegidos por env) somente depois que a suíte segura para CI estiver implementada.

## Testes de contrato (formato de Plugin e canal)

Testes de contrato verificam se cada Plugin e canal registrado está em conformidade com seu
contrato de interface. Eles iteram sobre todos os Plugins descobertos e executam uma suíte de
asserções de formato e comportamento. A faixa unitária padrão de `pnpm test` intencionalmente
ignora esses arquivos compartilhados de smoke e seams; execute os comandos de contrato explicitamente
quando tocar em superfícies compartilhadas de canal ou provedor.

### Comandos

- Todos os contratos: `pnpm test:contracts`
- Somente contratos de canal: `pnpm test:contracts:channels`
- Somente contratos de provedor: `pnpm test:contracts:plugins`

### Contratos de canal

Localizados em `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Formato básico de Plugin (id, nome, capacidades)
- **setup** - Contrato do assistente de configuração
- **session-binding** - Comportamento de vinculação de sessão
- **outbound-payload** - Estrutura da carga útil da mensagem
- **inbound** - Tratamento de mensagens de entrada
- **actions** - Handlers de ação de canal
- **threading** - Tratamento de ID de thread
- **directory** - API de diretório/lista
- **group-policy** - Aplicação de política de grupo

### Contratos de status de provedor

Localizados em `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondas de status de canal
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

- Após alterar exports ou subcaminhos do plugin-sdk
- Após adicionar ou modificar um canal ou Plugin de provedor
- Após refatorar registro ou descoberta de Plugins

Testes de contrato são executados no CI e não exigem chaves reais de API.

## Adicionar regressões (orientação)

Quando você corrigir um problema de provedor/modelo descoberto ao vivo:

- Adicione uma regressão segura para CI se possível (provedor mock/stub, ou capture a transformação exata do formato da solicitação)
- Se for inerentemente apenas ao vivo (limites de taxa, políticas de autenticação), mantenha o teste ao vivo limitado e opt-in via variáveis de ambiente
- Prefira mirar na menor camada que captura o bug:
  - bug de conversão/replay de solicitação do provedor → teste direto de modelos
  - bug de pipeline de sessão/histórico/ferramentas do gateway → smoke ao vivo do gateway ou teste simulado do gateway seguro para CI
- Proteção de travessia SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva um alvo amostrado por classe SecretRef a partir dos metadados do registro (`listSecretTargetRegistryEntries()`) e então afirma que ids de exec com segmentos de travessia são rejeitados.
  - Se você adicionar uma nova família de alvo SecretRef `includeInPlan` em `src/secrets/target-registry-data.ts`, atualize `classifyTargetClass` nesse teste. O teste falha intencionalmente em ids de alvo não classificados para que novas classes não possam ser ignoradas silenciosamente.

## Relacionado

- [Testes ao vivo](/pt-BR/help/testing-live)
- [Testes de atualizações e plugins](/pt-BR/help/testing-updates-plugins)
- [CI](/pt-BR/ci)
