---
read_when:
    - Executando testes localmente ou no CI
    - Adicionando testes de regressão para bugs de modelo/provedor
    - Depuração do comportamento do Gateway + agente
summary: 'Kit de testes: suítes unit/e2e/live, executores Docker e o que cada teste cobre'
title: Testes
x-i18n:
    generated_at: "2026-05-10T19:38:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: af4c839e5557ddbe8350a022afa06f2d73b455323d8e3928e1ee1ed8910da76e
    source_path: help/testing.md
    workflow: 16
---

O OpenClaw tem três suítes Vitest (unitária/integração, e2e, live) e um pequeno conjunto
de executores Docker. Este documento é um guia de "como testamos":

- O que cada suíte cobre (e o que ela deliberadamente _não_ cobre).
- Quais comandos executar para fluxos de trabalho comuns (local, pré-push, depuração).
- Como os testes live descobrem credenciais e selecionam modelos/provedores.
- Como adicionar regressões para problemas reais de modelos/provedores.

<Note>
**A pilha de QA (qa-lab, qa-channel, trilhas de transporte live)** é documentada separadamente:

- [Visão geral de QA](/pt-BR/concepts/qa-e2e-automation) - arquitetura, superfície de comandos, autoria de cenários.
- [QA de matriz](/pt-BR/concepts/qa-matrix) - referência para `pnpm openclaw qa matrix`.
- [Canal de QA](/pt-BR/channels/qa-channel) - o plugin de transporte sintético usado por cenários apoiados pelo repo.

Esta página cobre a execução das suítes de teste regulares e dos executores Docker/Parallels. A seção de executores específicos de QA abaixo ([Executores específicos de QA](#qa-specific-runners)) lista as invocações `qa` concretas e aponta de volta para as referências acima.
</Note>

## Início rápido

Na maioria dos dias:

- Gate completo (esperado antes do push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Execução mais rápida da suíte completa local em uma máquina espaçosa: `pnpm test:max`
- Loop direto de observação do Vitest: `pnpm test:watch`
- O direcionamento direto de arquivo agora também roteia caminhos de extensões/canais: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefira execuções direcionadas primeiro quando estiver iterando em uma única falha.
- Site de QA apoiado por Docker: `pnpm qa:lab:up`
- Trilha de QA apoiada por VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando você tocar em testes ou quiser confiança extra:

- Gate de cobertura: `pnpm test:coverage`
- Suíte E2E: `pnpm test:e2e`

Ao depurar provedores/modelos reais (requer credenciais reais):

- Suíte live (modelos + sondas de ferramenta/imagem do gateway): `pnpm test:live`
- Direcione um arquivo live silenciosamente: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Relatórios de desempenho em runtime: despache `OpenClaw Performance` com
  `live_gpt54=true` para uma rodada real de agente `openai/gpt-5.4` ou
  `deep_profile=true` para artefatos de CPU/heap/trace do Kova. Execuções diárias agendadas
  publicam artefatos das trilhas mock-provider, deep-profile e GPT 5.4 em
  `openclaw/clawgrit-reports` quando `CLAWGRIT_REPORTS_TOKEN` está configurado. O
  relatório mock-provider também inclui inicialização de gateway em nível de fonte, memória,
  plugin-pressure, hello-loop repetido com modelo falso e números de inicialização da CLI.
- Varredura live de modelos em Docker: `pnpm test:docker:live-models`
  - Cada modelo selecionado agora executa uma rodada de texto mais uma pequena sonda no estilo de leitura de arquivo.
    Modelos cujos metadados anunciam entrada `image` também executam uma pequena rodada de imagem.
    Desative as sondas extras com `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` ou
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` ao isolar falhas de provedor.
  - Cobertura de CI: `OpenClaw Scheduled Live And E2E Checks` diário e
    `OpenClaw Release Checks` manual chamam o workflow live/E2E reutilizável com
    `include_live_suites: true`, que inclui jobs separados de matriz live de modelos em Docker
    particionados por provedor.
  - Para reexecuções focadas de CI, despache `OpenClaw Live And E2E Checks (Reusable)`
    com `include_live_suites: true` e `live_models_only: true`.
  - Adicione novos segredos de provedor de alto sinal a `scripts/ci-hydrate-live-auth.sh`
    mais `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` e seus
    chamadores agendados/de release.
- Smoke de chat vinculado nativo do Codex: `pnpm test:docker:live-codex-bind`
  - Executa uma trilha live em Docker contra o caminho do app-server do Codex, vincula uma DM sintética do
    Slack com `/codex bind`, exercita `/codex fast` e
    `/codex permissions`, depois verifica uma resposta simples e uma rota de anexo de imagem
    pela vinculação nativa do plugin em vez de ACP.
- Smoke do harness do app-server do Codex: `pnpm test:docker:live-codex-harness`
  - Executa rodadas de agente de gateway pelo harness do app-server do Codex pertencente ao plugin,
    verifica `/codex status` e `/codex models` e, por padrão, exercita sondas de imagem,
    cron MCP, subagente e Guardian. Desative a sonda de subagente com
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` ao isolar outras falhas do
    app-server do Codex. Para uma checagem focada de subagente, desative as outras sondas:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Isto sai após a sonda de subagente, a menos que
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` esteja definido.
- Smoke de instalação sob demanda do Codex: `pnpm test:docker:codex-on-demand`
  - Instala o tarball empacotado do OpenClaw no Docker, executa o onboarding com chave de API
    da OpenAI e verifica que o plugin Codex mais a dependência `@openai/codex`
    foram baixados sob demanda para a raiz npm gerenciada.
- Smoke live de dependência de ferramenta de plugin: `pnpm test:docker:live-plugin-tool`
  - Empacota um plugin de fixture com uma dependência real `slugify`, instala-o por meio de
    `npm-pack:`, verifica a dependência sob a raiz npm gerenciada e então pede a um
    modelo OpenAI live que chame a ferramenta do plugin e retorne o slug oculto.
- Smoke de comando de resgate do Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Checagem opt-in de garantia extra para a superfície de comando de resgate do canal de mensagens.
    Ela exercita `/crestodian status`, enfileira uma alteração persistente de modelo,
    responde `/crestodian yes` e verifica o caminho de escrita de auditoria/configuração.
- Smoke Docker do planejador do Crestodian: `pnpm test:docker:crestodian-planner`
  - Executa o Crestodian em um contêiner sem configuração com uma CLI Claude falsa no `PATH`
    e verifica que o fallback do planejador fuzzy se traduz em uma escrita tipada
    de configuração auditada.
- Smoke Docker de primeira execução do Crestodian: `pnpm test:docker:crestodian-first-run`
  - Começa com um diretório de estado OpenClaw vazio, roteia `openclaw` puro para
    o Crestodian, aplica escritas de setup/modelo/agente/plugin Discord + SecretRef,
    valida a configuração e verifica entradas de auditoria. O mesmo caminho de setup Ring 0
    também é coberto no QA Lab por
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke de custo Moonshot/Kimi: com `MOONSHOT_API_KEY` definido, execute
  `openclaw models list --provider moonshot --json`, depois execute um
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolado contra `moonshot/kimi-k2.6`. Verifique que o JSON informa Moonshot/K2.6 e que a
  transcrição do assistente armazena `usage.cost` normalizado.

<Tip>
Quando você precisa de apenas um caso com falha, prefira estreitar testes live pelas variáveis de ambiente allowlist descritas abaixo.
</Tip>

## Executores específicos de QA

Estes comandos ficam ao lado das suítes de teste principais quando você precisa do realismo do QA-lab:

A CI executa o QA Lab em workflows dedicados. A paridade agêntica está aninhada sob
`QA-Lab - All Lanes` e validação de release, não em um workflow de PR independente.
A validação ampla deve usar `Full Release Validation` com
`rerun_group=qa-parity` ou o grupo de QA de release-checks. Checagens de release
estável/padrão mantêm o soak live/Docker exaustivo atrás de `run_release_soak=true`; o
perfil `full` força o soak. `QA-Lab - All Lanes`
executa todas as noites em `main` e a partir de despacho manual com a trilha de paridade mock, trilha live
Matrix, trilha live Telegram gerenciada pelo Convex e trilha live Discord
gerenciada pelo Convex como jobs paralelos. QA agendado e checagens de release passam Matrix
`--profile fast` explicitamente, enquanto a CLI Matrix e a entrada de workflow manual
continuam com padrão `all`; o despacho manual pode fragmentar `all` em jobs `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`. `OpenClaw Release
Checks` executa paridade mais as trilhas rápidas Matrix e Telegram antes da aprovação de release,
usando `mock-openai/gpt-5.5` para checagens de transporte de release, para que elas permaneçam
determinísticas e evitem a inicialização normal do plugin de provedor. Esses gateways de transporte live
desativam a busca de memória; o comportamento de memória permanece coberto pelas suítes de paridade
de QA.

Os shards live de mídia da release completa usam
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, que já tem
`ffmpeg` e `ffprobe`. Shards live de modelo/backend em Docker usam a imagem compartilhada
`ghcr.io/openclaw/openclaw-live-test:<sha>` construída uma vez por commit
selecionado e então a baixam com `OPENCLAW_SKIP_DOCKER_BUILD=1` em vez de reconstruir
dentro de cada shard.

- `pnpm openclaw qa suite`
  - Executa cenários de QA apoiados pelo repositório diretamente no host.
  - Executa vários cenários selecionados em paralelo por padrão, com workers
    de Gateway isolados. `qa-channel` usa concorrência 4 por padrão (limitada
    pela contagem de cenários selecionados). Use `--concurrency <count>` para ajustar a contagem de workers
    ou `--concurrency 1` para a lane serial mais antiga.
  - Sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando você
    quiser artefatos sem um código de saída com falha.
  - Compatível com os modos de provedor `live-frontier`, `mock-openai` e `aimock`.
    `aimock` inicia um servidor de provedor local apoiado por AIMock para cobertura experimental
    de fixture e mock de protocolo sem substituir a lane `mock-openai`
    ciente de cenários.
- `pnpm test:plugins:kitchen-sink-live`
  - Executa a bateria do Plugin Kitchen Sink da OpenAI ao vivo por meio do QA Lab. Ele
    instala o pacote externo Kitchen Sink, verifica o inventário da superfície do SDK do Plugin,
    consulta `/healthz` e `/readyz`, registra evidências de CPU/RSS do Gateway,
    executa um turno ao vivo da OpenAI e verifica diagnósticos adversariais.
    Requer autenticação ao vivo da OpenAI, como `OPENAI_API_KEY`. Em sessões Testbox
    hidratadas, ele carrega automaticamente o perfil de autenticação ao vivo do Testbox quando o auxiliar
    `openclaw-testbox-env` está presente.
- `pnpm test:gateway:cpu-scenarios`
  - Executa o benchmark de inicialização do Gateway mais um pequeno pacote de cenários mock do QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) e grava um resumo combinado de observação de CPU
    em `.artifacts/gateway-cpu-scenarios/`.
  - Por padrão, sinaliza apenas observações sustentadas de CPU quente (`--cpu-core-warn`
    mais `--hot-wall-warn-ms`), então breves picos de inicialização são registrados como métricas
    sem parecerem a regressão de Gateway travado por vários minutos.
  - Usa artefatos `dist` compilados; execute uma build primeiro quando o checkout ainda não
    tiver saída de runtime recente.
- `pnpm openclaw qa suite --runner multipass`
  - Executa a mesma suíte de QA dentro de uma VM Linux Multipass descartável.
  - Mantém o mesmo comportamento de seleção de cenários que `qa suite` no host.
  - Reutiliza as mesmas flags de seleção de provedor/modelo que `qa suite`.
  - Execuções ao vivo encaminham as entradas de autenticação de QA compatíveis que são práticas para o guest:
    chaves de provedor baseadas em env, o caminho da configuração de provedor ao vivo de QA e `CODEX_HOME`
    quando presente.
  - Diretórios de saída devem permanecer sob a raiz do repositório para que o guest possa gravar de volta pelo
    workspace montado.
  - Grava o relatório e resumo normais de QA, mais logs do Multipass, em
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia o site de QA apoiado por Docker para trabalho de QA no estilo operador.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Cria um tarball npm a partir do checkout atual, instala-o globalmente no
    Docker, executa onboarding não interativo com chave de API da OpenAI, configura Telegram
    por padrão, verifica que o runtime do Plugin empacotado carrega sem reparo de dependência
    na inicialização, executa doctor e executa um turno de agente local contra um
    endpoint OpenAI mockado.
  - Use `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para executar a mesma lane de instalação empacotada
    com Discord.
- `pnpm test:docker:session-runtime-context`
  - Executa um smoke determinístico em Docker da aplicação compilada para transcrições de contexto de runtime
    incorporado. Ele verifica que o contexto de runtime oculto do OpenClaw é persistido como uma
    mensagem customizada não exibida em vez de vazar para o turno visível do usuário,
    depois semeia um JSONL de sessão quebrada afetada e verifica que
    `openclaw doctor --fix` o reescreve para a ramificação ativa com backup.
- `pnpm test:docker:npm-telegram-live`
  - Instala um candidato de pacote OpenClaw no Docker, executa onboarding de pacote instalado,
    configura Telegram pela CLI instalada e então reutiliza a lane de QA ao vivo do Telegram
    com esse pacote instalado como o Gateway SUT.
  - O wrapper monta apenas o código-fonte do harness `qa-lab` do checkout; o
    pacote instalado possui `dist`, `openclaw/plugin-sdk` e o runtime de Plugin
    empacotado, para que a lane não misture plugins do checkout atual no pacote
    em teste.
  - O padrão é `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; defina
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` ou
    `OPENCLAW_CURRENT_PACKAGE_TGZ` para testar um tarball local resolvido em vez de
    instalar do registro.
  - Usa as mesmas credenciais env do Telegram ou fonte de credenciais Convex que
    `pnpm openclaw qa telegram`. Para automação de CI/release, defina
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` mais
    `OPENCLAW_QA_CONVEX_SITE_URL` e o segredo da função. Se
    `OPENCLAW_QA_CONVEX_SITE_URL` e um segredo de função Convex estiverem presentes no CI,
    o wrapper Docker seleciona Convex automaticamente.
  - O wrapper valida o env de credenciais do Telegram ou Convex no host antes do
    trabalho de build/instalação no Docker. Defina `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    apenas ao depurar deliberadamente a configuração pré-credencial.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` substitui o
    `OPENCLAW_QA_CREDENTIAL_ROLE` compartilhado apenas para esta lane.
  - GitHub Actions expõe esta lane como o workflow manual de mantenedor
    `NPM Telegram Beta E2E`. Ele não é executado em merge. O workflow usa o ambiente
    `qa-live-shared` e leases de credenciais Convex de CI.
- GitHub Actions também expõe `Package Acceptance` para prova de produto em execução lateral
  contra um pacote candidato. Ele aceita uma ref confiável, especificação npm publicada,
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
    com OpenAI configurada e então habilita canais/plugins empacotados por meio de edições
    de configuração.
  - Verifica que a descoberta de configuração deixa ausentes os plugins baixáveis não configurados,
    que o primeiro reparo configurado pelo doctor instala explicitamente cada Plugin baixável
    ausente, e que uma segunda reinicialização não executa reparo de dependência
    oculto.
  - Também instala um baseline npm antigo conhecido, habilita Telegram antes de executar
    `openclaw update --tag <candidate>` e verifica que o doctor pós-atualização
    do candidato limpa detritos de dependências legadas de Plugin sem um
    reparo pós-instalação do lado do harness.
- `pnpm test:parallels:npm-update`
  - Executa o smoke nativo de atualização de instalação empacotada entre guests Parallels. Cada
    plataforma selecionada primeiro instala o pacote baseline solicitado, depois executa
    o comando `openclaw update` instalado no mesmo guest e verifica a
    versão instalada, status de atualização, prontidão do Gateway e um turno de agente local.
  - Use `--platform macos`, `--platform windows` ou `--platform linux` enquanto
    itera em um guest. Use `--json` para o caminho do artefato de resumo e
    status por lane.
  - A lane OpenAI usa `openai/gpt-5.5` para a prova de turno de agente ao vivo por
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
  - A atualização no Windows pode passar de 10 a 15 minutos no doctor pós-atualização e em trabalho de
    atualização de pacotes em um guest frio; isso ainda é saudável quando o log debug
    npm aninhado está avançando.
  - Não execute este wrapper agregado em paralelo com lanes individuais de smoke do Parallels
    macOS, Windows ou Linux. Elas compartilham estado de VM e podem colidir na
    restauração de snapshot, no serviço de pacotes ou no estado do Gateway do guest.
  - A prova pós-atualização executa a superfície normal de Plugin empacotado porque
    fachadas de capability como fala, geração de imagem e compreensão de mídia
    são carregadas por meio de APIs de runtime empacotadas, mesmo quando o turno
    do agente em si verifica apenas uma resposta simples de texto.

- `pnpm openclaw qa aimock`
  - Inicia apenas o servidor de provedor AIMock local para testes smoke diretos
    de protocolo.
- `pnpm openclaw qa matrix`
  - Executa a lane de QA ao vivo Matrix contra um homeserver Tuwunel descartável apoiado por Docker. Apenas checkout de código-fonte - instalações empacotadas não distribuem `qa-lab`.
  - CLI completa, catálogo de perfis/cenários, variáveis env e layout de artefatos: [QA Matrix](/pt-BR/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Executa a lane de QA ao vivo do Telegram contra um grupo privado real usando os tokens do bot driver e do bot SUT do env.
  - Requer `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. O id do grupo deve ser o id numérico do chat do Telegram.
  - Compatível com `--credential-source convex` para credenciais compartilhadas em pool. Use o modo env por padrão ou defina `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por leases em pool.
  - Os padrões cobrem canary, bloqueio por menção, endereçamento de comandos, `/status`, respostas mencionadas de bot para bot e respostas de comandos nativos do core. Os padrões de `mock-openai` também cobrem regressões determinísticas de cadeia de respostas e streaming de mensagem final do Telegram. Use `--list-scenarios` para probes opcionais como `session_status`.
  - Sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando você
    quiser artefatos sem um código de saída com falha.
  - Requer dois bots distintos no mesmo grupo privado, com o bot SUT expondo um nome de usuário do Telegram.
  - Para observação estável de bot para bot, habilite o Bot-to-Bot Communication Mode em `@BotFather` para ambos os bots e garanta que o bot driver possa observar tráfego de bots no grupo.
  - Grava um relatório de QA do Telegram, resumo e artefato de mensagens observadas em `.artifacts/qa-e2e/...`. Cenários de resposta incluem RTT da solicitação de envio do driver até a resposta observada do SUT.

`Mantis Telegram Live` é o wrapper de evidências de PR em torno desta lane. Ele executa a
ref candidata com credenciais Telegram alugadas pelo Convex, renderiza a transcrição
redigida de mensagens observadas em um navegador desktop no Crabbox, grava evidências em MP4,
gera um GIF com corte de movimento, faz upload do pacote de artefatos e publica evidências
inline no PR por meio do Mantis GitHub App quando `pr_number` está definido. Mantenedores podem
iniciá-lo pela UI do Actions por meio de `Mantis Scenario` (`scenario_id:
telegram-live`) ou diretamente de um comentário em pull request:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Aloca ou reutiliza um desktop Linux Crabbox, instala o Telegram Desktop nativo, configura o OpenClaw com um token de bot Telegram SUT alocado, inicia o Gateway e grava evidências de captura de tela/MP4 do desktop VNC visível.
  - O padrão é `--credential-source convex`, para que os fluxos de trabalho precisem apenas do segredo do broker Convex. Use `--credential-source env` com as mesmas variáveis `OPENCLAW_QA_TELEGRAM_*` de `pnpm openclaw qa telegram`.
  - O Telegram Desktop ainda precisa de um login/perfil de usuário. O token do bot configura apenas o OpenClaw. Use `--telegram-profile-archive-env <name>` para um arquivo de perfil `.tgz` em base64, ou use `--keep-lease` e faça login manualmente pelo VNC uma vez.
  - Escreve `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` e `telegram-desktop-builder.mp4` no diretório de saída.

As vias de transporte ao vivo compartilham um contrato padrão para que novos transportes não divirjam; a matriz de cobertura por via fica em [Visão geral de QA → Cobertura de transporte ao vivo](/pt-BR/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` é a suíte sintética ampla e não faz parte dessa matriz.

### Credenciais compartilhadas do Telegram via Convex (v1)

Quando `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) está habilitado para
QA de transporte ao vivo, o laboratório de QA adquire uma concessão exclusiva de um pool apoiado por Convex, envia Heartbeats para essa
concessão enquanto a via está em execução e libera a concessão no encerramento. O nome da seção é anterior ao
suporte a Discord, Slack e WhatsApp; o contrato de concessão é compartilhado entre tipos.

Scaffold de referência do projeto Convex:

- `qa/convex-credential-broker/`

Variáveis de ambiente obrigatórias:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por exemplo `https://your-deployment.convex.site`)
- Um segredo para o papel selecionado:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Seleção do papel da credencial:
  - CLI: `--credential-role maintainer|ci`
  - Padrão de ambiente: `OPENCLAW_QA_CREDENTIAL_ROLE` (usa `ci` como padrão em CI, `maintainer` caso contrário)

Variáveis de ambiente opcionais:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (padrão `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (padrão `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (padrão `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (padrão `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (padrão `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (ID de rastreamento opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URLs Convex `http://` de loopback para desenvolvimento apenas local.

`OPENCLAW_QA_CONVEX_SITE_URL` deve usar `https://` em operação normal.

Comandos administrativos de mantenedor (adicionar/remover/listar pool) exigem
especificamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Auxiliares de CLI para mantenedores:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Use `doctor` antes de execuções ao vivo para verificar a URL do site Convex, segredos do broker,
prefixo do endpoint, tempo limite HTTP e alcançabilidade de admin/list sem imprimir
valores secretos. Use `--json` para saída legível por máquina em scripts e utilitários
de CI.

Contrato de endpoint padrão (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Requisição: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Sucesso: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Esgotado/repetível: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Requisição: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Sucesso: `{ status: "ok", index, data }`
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
  - Proteção de concessão ativa: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (somente segredo de mantenedor)
  - Requisição: `{ kind?, status?, includePayload?, limit? }`
  - Sucesso: `{ status: "ok", credentials, count }`

Formato do payload para o tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` deve ser uma string numérica de ID de chat do Telegram.
- `admin/add` valida esse formato para `kind: "telegram"` e rejeita payloads malformados.

Formato do payload para o tipo usuário real do Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` e `telegramApiId` devem ser strings numéricas.
- `tdlibArchiveSha256` e `desktopTdataArchiveSha256` devem ser strings hexadecimais SHA-256.
- `kind: "telegram-user"` representa uma conta descartável do Telegram. Trate a concessão como abrangendo a conta inteira: o driver CLI TDLib e a testemunha visual do Telegram Desktop restauram a partir do mesmo payload, e apenas um job deve manter a concessão por vez.

Restauração de concessão de usuário real do Telegram:

```bash
tmp=$(mktemp -d /tmp/openclaw-telegram-user.XXXXXX)
node --import tsx scripts/e2e/telegram-user-credential.ts lease-restore \
  --user-driver-dir "$tmp/user-driver" \
  --desktop-workdir "$tmp/desktop" \
  --lease-file "$tmp/lease.json"
TELEGRAM_USER_DRIVER_STATE_DIR="$tmp/user-driver" \
  uv run ~/.codex/skills/custom/telegram-e2e-bot-to-bot/scripts/user-driver.py status --json
node --import tsx scripts/e2e/telegram-user-credential.ts release --lease-file "$tmp/lease.json"
```

Use o perfil restaurado do Desktop com `Telegram -workdir "$tmp/desktop"` quando uma gravação visual for necessária. Em ambientes de operador local, `scripts/e2e/telegram-user-credential.ts` lê `~/.codex/skills/custom/telegram-e2e-bot-to-bot/convex.local.env` por padrão se as variáveis de ambiente do processo estiverem ausentes.

Sessão Crabbox conduzida por agente:

```bash
pnpm qa:telegram-user:crabbox -- start \
  --tdlib-url http://artifacts.openclaw.ai/tdlib-v1.8.0-linux-x64.tgz \
  --output-dir .artifacts/qa-e2e/telegram-user-crabbox/pr-review
pnpm qa:telegram-user:crabbox -- send \
  --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json \
  --text /status
pnpm qa:telegram-user:crabbox -- finish \
  --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json
```

`start` aloca a credencial `telegram-user`, restaura a mesma conta no
TDLib e no Telegram Desktop em um desktop Linux Crabbox, inicia um Gateway SUT
mock local a partir do checkout atual, abre o chat visível do Telegram, inicia
a gravação do desktop e escreve um `session.json` privado. Enquanto a sessão estiver
ativa, um agente pode continuar testando até ficar satisfeito:

- `send --session <file> --text <message>` envia pelo usuário real TDLib e espera pela resposta do SUT.
- `run --session <file> -- <remote command>` executa um comando arbitrário no Crabbox e salva sua saída, por exemplo `bash -lc 'source /tmp/openclaw-telegram-user-crabbox/env.sh && python3 /tmp/openclaw-telegram-user-crabbox/user-driver.py transcript --limit 20 --json'`.
- `screenshot --session <file>` captura o desktop visível atual.
- `status --session <file>` imprime a concessão e o comando WebVNC.
- `finish --session <file>` para o gravador, captura artefatos de captura de tela/vídeo/GIF com corte por movimento, libera a credencial Convex, interrompe processos SUT locais e encerra a concessão do Crabbox, a menos que `--keep-box` seja passado.
- `publish --session <file> --pr <number>` publica por padrão um comentário de PR somente com GIF. Passe `--full-artifacts` somente quando logs ou artefatos JSON forem intencionalmente necessários.

Para reproduções visuais determinísticas, passe `--mock-response-file <path>` para `start`
ou para o atalho de um comando `probe`. O executor usa por padrão uma classe
Crabbox padrão, gravação a 24 fps, pré-visualizações GIF de movimento a 24 fps e largura de GIF de
1920 px. Sobrescreva com `--class`, `--record-fps`, `--preview-fps` e
`--preview-width` somente quando a prova precisar de configurações de captura diferentes.

Prova Crabbox de um comando:

```bash
pnpm qa:telegram-user:crabbox -- --text /status
```

O comando padrão `probe` é um atalho para um ciclo start/send/finish. Use-o
para um smoke rápido de `/status`. Use os comandos de sessão para revisão de PR,
trabalho de reprodução de bug ou qualquer caso em que o agente precise de minutos de experimentação
arbitrária antes de decidir que a prova está completa. Use `--id <cbx_...>` para
reutilizar uma concessão de desktop aquecida, `--keep-box` para manter o VNC aberto após finish,
`--desktop-chat-title <name>` para escolher o chat visível e `--tdlib-url <tgz>`
ao usar um arquivo Linux `libtdjson.so` pré-preparado em vez de compilar TDLib em
uma caixa nova. O executor verifica `--tdlib-url` com `--tdlib-sha256 <hex>` ou,
por padrão, um arquivo irmão `<url>.sha256`.

Payloads multicanal validados pelo broker:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

As vias Slack também podem alocar a partir do pool, mas a validação de payload do Slack atualmente
fica no executor de QA do Slack, e não no broker. Use
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
para linhas Slack.

### Adicionar um canal ao QA

A arquitetura e os nomes dos auxiliares de cenário para novos adaptadores de canal ficam em [Visão geral de QA → Adicionar um canal](/pt-BR/concepts/qa-e2e-automation#adding-a-channel). O requisito mínimo: implemente o executor de transporte na interface de host compartilhada `qa-lab`, declare `qaRunners` no manifesto do Plugin, monte como `openclaw qa <runner>` e escreva cenários em `qa/scenarios/`.

## Suítes de teste (o que executa onde)

Pense nas suítes como "realismo crescente" (e maior instabilidade/custo):

### Unitários / integração (padrão)

- Comando: `pnpm test`
- Configuração: execuções sem alvo usam o conjunto de shards `vitest.full-*.config.ts` e podem expandir shards multiprojeto em configurações por projeto para agendamento paralelo
- Arquivos: inventários core/unit em `src/**/*.test.ts`, `packages/**/*.test.ts` e `test/**/*.test.ts`; testes unitários de UI executam no shard dedicado `unit-ui`
- Escopo:
  - Testes unitários puros
  - Testes de integração no processo (autenticação de Gateway, roteamento, ferramentas, parsing, configuração)
  - Regressões determinísticas para bugs conhecidos
- Expectativas:
  - Executa em CI
  - Não exige chaves reais
  - Deve ser rápido e estável
  - Testes de resolvedor e carregador de superfície pública devem provar comportamento amplo de fallback de `api.js` e
    `runtime-api.js` com fixtures de Plugin mínimas geradas, não
    APIs de código-fonte de Plugins empacotados reais. Carregamentos de API de Plugin real pertencem a
    suítes de contrato/integração pertencentes ao Plugin.

Política de dependências nativas:

- Instalações de teste padrão pulam builds opcionais nativos do opus do Discord. O recebimento de voz do Discord usa o decodificador `opusscript` em JS puro, e `@discordjs/opus` permanece em `ignoredBuiltDependencies` para que testes locais e vias Testbox não compilem o addon nativo.
- Use uma via dedicada de desempenho ou ao vivo de voz do Discord se você intencionalmente precisar comparar um build nativo de opus. Não adicione `@discordjs/opus` de volta ao `onlyBuiltDependencies` padrão; isso faz loops de instalação/teste não relacionados compilarem código nativo.

<AccordionGroup>
  <Accordion title="Projetos, shards e vias com escopo">

    - Execuções não direcionadas de `pnpm test` rodam doze configurações menores em shards (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) em vez de um processo nativo gigante do projeto raiz. Isso reduz o pico de RSS em máquinas carregadas e evita que o trabalho de resposta automática/extensão prive suítes não relacionadas.
    - `pnpm test --watch` ainda usa o grafo de projeto raiz nativo `vitest.config.ts`, porque um loop de observação com vários shards não é prático.
    - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` direcionam alvos explícitos de arquivo/diretório primeiro por lanes com escopo, então `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar o custo completo de inicialização do projeto raiz.
    - `pnpm test:changed` expande caminhos git alterados em lanes baratas com escopo por padrão: edições diretas de testes, arquivos irmãos `*.test.ts`, mapeamentos explícitos de código-fonte e dependentes locais do grafo de importação. Edições de configuração/setup/pacote não executam testes amplamente, a menos que você use explicitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` é o gate local inteligente normal para trabalho estreito. Ele classifica o diff em core, testes de core, extensions, testes de extension, apps, docs, metadados de release, ferramental Docker live e ferramental, então executa os comandos correspondentes de typecheck, lint e guard. Ele não executa testes Vitest; chame `pnpm test:changed` ou `pnpm test <target>` explícito para comprovação de teste. Alterações de versão apenas em metadados de release executam verificações direcionadas de versão/config/dependência raiz, com um guard que rejeita mudanças de pacote fora do campo de versão no nível superior.
    - Edições no harness Docker live de ACP executam verificações focadas: sintaxe de shell para os scripts de autenticação Docker live e uma simulação do agendador Docker live. Alterações em `package.json` são incluídas apenas quando o diff é limitado a `scripts["test:docker:live-*"]`; edições de dependência, exportação, versão e outras superfícies de pacote ainda usam os guards mais amplos.
    - Testes unitários leves em importação de agentes, comandos, plugins, helpers de resposta automática, `plugin-sdk` e áreas semelhantes de utilitários puros passam pela lane `unit-fast`, que ignora `test/setup-openclaw-runtime.ts`; arquivos com estado/pesados de runtime permanecem nas lanes existentes.
    - Arquivos de código-fonte de helpers selecionados de `plugin-sdk` e `commands` também mapeiam execuções em modo alterado para testes irmãos explícitos nessas lanes leves, então edições em helpers evitam reexecutar a suíte pesada completa desse diretório.
    - `auto-reply` tem buckets dedicados para helpers de core de nível superior, testes de integração `reply.*` de nível superior e a subárvore `src/auto-reply/reply/**`. A CI divide ainda mais a subárvore de resposta em shards de agent-runner, dispatch e commands/state-routing, para que um bucket pesado em importação não fique responsável por toda a cauda do Node.
    - A CI normal de PR/main intencionalmente ignora a varredura em lote de extensions e o shard `agentic-plugins` exclusivo de release. A Validação Completa de Release despacha o workflow filho separado `Plugin Prerelease` para essas suítes pesadas de plugin/extension em candidatos a release.

  </Accordion>

  <Accordion title="Cobertura do executor incorporado">

    - Quando você alterar entradas de descoberta de ferramentas de mensagem ou contexto
      de runtime de Compaction, mantenha ambos os níveis de cobertura.
    - Adicione regressões focadas de helpers para limites puros de roteamento e
      normalização.
    - Mantenha saudáveis as suítes de integração do executor incorporado:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Essas suítes verificam que ids com escopo e comportamento de Compaction ainda fluem
      pelos caminhos reais `run.ts` / `compact.ts`; testes apenas de helpers
      não são um substituto suficiente para esses caminhos de integração.

  </Accordion>

  <Accordion title="Padrões de pool e isolamento do Vitest">

    - A configuração base do Vitest usa `threads` por padrão.
    - A configuração compartilhada do Vitest fixa `isolate: false` e usa o
      executor não isolado nos projetos raiz, e2e e configurações live.
    - A lane de UI raiz mantém seu setup `jsdom` e otimizador, mas também roda no
      executor compartilhado não isolado.
    - Cada shard de `pnpm test` herda os mesmos padrões `threads` + `isolate: false`
      da configuração compartilhada do Vitest.
    - `scripts/run-vitest.mjs` adiciona `--no-maglev` por padrão aos processos
      Node filhos do Vitest para reduzir churn de compilação do V8 durante grandes execuções locais.
      Defina `OPENCLAW_VITEST_ENABLE_MAGLEV=1` para comparar com o comportamento padrão do V8.

  </Accordion>

  <Accordion title="Iteração local rápida">

    - `pnpm changed:lanes` mostra quais lanes arquiteturais um diff aciona.
    - O hook de pre-commit apenas formata. Ele adiciona novamente ao stage os arquivos formatados e
      não executa lint, typecheck nem testes.
    - Execute `pnpm check:changed` explicitamente antes do handoff ou push quando você
      precisar do gate local inteligente.
    - `pnpm test:changed` passa por lanes baratas com escopo por padrão. Use
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` apenas quando o agente
      decidir que uma edição de harness, configuração, pacote ou contrato realmente precisa de cobertura
      Vitest mais ampla.
    - `pnpm test:max` e `pnpm test:changed:max` mantêm o mesmo comportamento de
      roteamento, apenas com um limite maior de workers.
    - O autoescalonamento local de workers é intencionalmente conservador e recua
      quando a média de carga do host já está alta, então múltiplas execuções
      concorrentes do Vitest causam menos impacto por padrão.
    - A configuração base do Vitest marca os arquivos de projetos/configuração como
      `forceRerunTriggers`, para que reexecuções em modo alterado permaneçam corretas quando a fiação
      de testes muda.
    - A configuração mantém `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado em hosts
      compatíveis; defina `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se você quiser
      um local de cache explícito para profiling direto.

  </Accordion>

  <Accordion title="Depuração de desempenho">

    - `pnpm test:perf:imports` habilita o relatório de duração de importações do Vitest mais
      a saída de detalhamento de importações.
    - `pnpm test:perf:imports:changed` restringe a mesma visão de profiling a
      arquivos alterados desde `origin/main`.
    - Dados de tempo dos shards são gravados em `.artifacts/vitest-shard-timings.json`.
      Execuções de configuração inteira usam o caminho da configuração como chave; shards de CI
      com padrão de inclusão acrescentam o nome do shard para que shards filtrados possam ser rastreados
      separadamente.
    - Quando um teste quente ainda passa a maior parte do tempo em importações de inicialização,
      mantenha dependências pesadas atrás de uma divisão local estreita `*.runtime.ts` e
      faça mock dessa divisão diretamente, em vez de importar profundamente helpers de runtime apenas
      para passá-los por `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compara o
      `test:changed` roteado com o caminho nativo do projeto raiz para esse diff com commit
      e imprime o tempo de parede mais o RSS máximo no macOS.
    - `pnpm test:perf:changed:bench -- --worktree` executa benchmark da árvore atual
      suja roteando a lista de arquivos alterados por
      `scripts/test-projects.mjs` e pela configuração raiz do Vitest.
    - `pnpm test:perf:profile:main` grava um perfil de CPU da thread principal para
      overhead de inicialização e transformação do Vitest/Vite.
    - `pnpm test:perf:profile:runner` grava perfis de CPU+heap do executor para a
      suíte unitária com paralelismo de arquivos desabilitado.

  </Accordion>
</AccordionGroup>

### Estabilidade (Gateway)

- Comando: `pnpm test:stability:gateway`
- Configuração: `vitest.gateway.config.ts`, forçada a um worker
- Escopo:
  - Inicia um Gateway local loopback real com diagnósticos habilitados por padrão
  - Conduz churn sintético de mensagens de gateway, memória e payloads grandes pelo caminho de eventos de diagnóstico
  - Consulta `diagnostics.stability` pelo RPC WS do Gateway
  - Cobre helpers de persistência do pacote de estabilidade de diagnóstico
  - Afirma que o gravador permanece limitado, amostras sintéticas de RSS ficam abaixo do orçamento de pressão e profundidades de fila por sessão drenam de volta para zero
- Expectativas:
  - Seguro para CI e sem necessidade de chaves
  - Lane estreita para acompanhamento de regressão de estabilidade, não um substituto para a suíte completa do Gateway

### E2E (smoke do gateway)

- Comando: `pnpm test:e2e`
- Configuração: `vitest.e2e.config.ts`
- Arquivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` e testes E2E de plugins agrupados em `extensions/`
- Padrões de runtime:
  - Usa `threads` do Vitest com `isolate: false`, combinando com o restante do repositório.
  - Usa workers adaptativos (CI: até 2, local: 1 por padrão).
  - Roda em modo silencioso por padrão para reduzir overhead de I/O no console.
- Sobrescritas úteis:
  - `OPENCLAW_E2E_WORKERS=<n>` para forçar a contagem de workers (limitada a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para reabilitar saída detalhada no console.
- Escopo:
  - Comportamento end-to-end do gateway com múltiplas instâncias
  - Superfícies WebSocket/HTTP, pareamento de nodes e networking mais pesado
- Expectativas:
  - Roda em CI (quando habilitado no pipeline)
  - Nenhuma chave real necessária
  - Mais partes móveis do que testes unitários (pode ser mais lento)

### E2E: smoke do backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- Arquivo: `extensions/openshell/src/backend.e2e.test.ts`
- Escopo:
  - Inicia um gateway OpenShell isolado no host via Docker
  - Cria um sandbox a partir de um Dockerfile local temporário
  - Exercita o backend OpenShell do OpenClaw sobre `sandbox ssh-config` real + execução SSH
  - Verifica comportamento de sistema de arquivos canônico remoto pela ponte fs do sandbox
- Expectativas:
  - Apenas opt-in; não faz parte da execução padrão de `pnpm test:e2e`
  - Requer uma CLI `openshell` local mais um daemon Docker funcionando
  - Usa `HOME` / `XDG_CONFIG_HOME` isolados, depois destrói o gateway e sandbox de teste
- Sobrescritas úteis:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar o teste ao executar manualmente a suíte e2e mais ampla
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apontar para um binário de CLI ou script wrapper não padrão

### Live (provedores reais + modelos reais)

- Comando: `pnpm test:live`
- Configuração: `vitest.live.config.ts`
- Arquivos: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` e testes live de plugins agrupados em `extensions/`
- Padrão: **habilitado** por `pnpm test:live` (define `OPENCLAW_LIVE_TEST=1`)
- Escopo:
  - "Este provedor/modelo realmente funciona _hoje_ com credenciais reais?"
  - Capturar mudanças de formato de provedores, peculiaridades de tool-calling, problemas de autenticação e comportamento de limite de taxa
- Expectativas:
  - Não é estável em CI por design (redes reais, políticas reais de provedores, cotas, indisponibilidades)
  - Custa dinheiro / usa limites de taxa
  - Prefira executar subconjuntos estreitos em vez de "tudo"
- Execuções live carregam `~/.profile` para obter chaves de API ausentes.
- Por padrão, execuções live ainda isolam `HOME` e copiam material de config/autenticação para uma home de teste temporária para que fixtures unitárias não possam mutar seu `~/.openclaw` real.
- Defina `OPENCLAW_LIVE_USE_REAL_HOME=1` apenas quando você intencionalmente precisar que testes live usem seu diretório home real.
- `pnpm test:live` agora usa por padrão um modo mais silencioso: ele mantém a saída de progresso `[live] ...`, mas suprime o aviso extra de `~/.profile` e silencia logs de bootstrap do gateway/ruído do Bonjour. Defina `OPENCLAW_LIVE_TEST_QUIET=0` se quiser os logs completos de inicialização de volta.
- Rotação de chaves de API (específica por provedor): defina `*_API_KEYS` com formato separado por vírgulas/ponto e vírgula ou `*_API_KEY_1`, `*_API_KEY_2` (por exemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou sobrescrita por live via `OPENCLAW_LIVE_*_KEY`; os testes tentam novamente em respostas de limite de taxa.
- Saída de progresso/Heartbeat:
  - Suítes live agora emitem linhas de progresso para stderr para que chamadas longas a provedores fiquem visivelmente ativas mesmo quando a captura de console do Vitest está silenciosa.
  - `vitest.live.config.ts` desabilita a interceptação de console do Vitest para que linhas de progresso de provedor/gateway sejam transmitidas imediatamente durante execuções live.
  - Ajuste heartbeats de modelo direto com `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajuste heartbeats de gateway/probe com `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Qual suíte devo executar?

Use esta tabela de decisão:

- Lógica/testes de edição: execute `pnpm test` (e `pnpm test:coverage` se você alterou bastante)
- Ao tocar em rede do gateway / protocolo WS / pareamento: adicione `pnpm test:e2e`
- Ao depurar "meu bot está fora do ar" / falhas específicas de provedor / chamada de ferramenta: execute um `pnpm test:live` reduzido

## Testes ao vivo (que tocam a rede)

Para a matriz de modelos ao vivo, testes de fumaça do backend da CLI, testes de fumaça de ACP, harness de servidor de aplicativo do Codex e todos os testes ao vivo de provedores de mídia (Deepgram, BytePlus, ComfyUI, imagem, música, vídeo, harness de mídia) - além do tratamento de credenciais para execuções ao vivo - consulte
[Testando suítes ao vivo](/pt-BR/help/testing-live). Para a lista de verificação dedicada de atualização e validação de plugins, consulte
[Testando atualizações e plugins](/pt-BR/help/testing-updates-plugins).

## Executores Docker (verificações opcionais de "funciona no Linux")

Esses executores Docker se dividem em dois grupos:

- Executores de modelos ao vivo: `test:docker:live-models` e `test:docker:live-gateway` executam apenas o arquivo ao vivo de chave de perfil correspondente dentro da imagem Docker do repositório (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando seu diretório de configuração local e workspace (e carregando `~/.profile` se estiver montado). Os pontos de entrada locais correspondentes são `test:live:models-profiles` e `test:live:gateway-profiles`.
- Executores Docker ao vivo usam por padrão um limite menor de fumaça para que uma varredura Docker completa continue prática:
  `test:docker:live-models` usa por padrão `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa por padrão `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sobrescreva essas variáveis de ambiente quando você
  quiser explicitamente a varredura exaustiva maior.
- `test:docker:all` constrói a imagem Docker ao vivo uma vez via `test:docker:live-build`, empacota o OpenClaw uma vez como tarball npm por meio de `scripts/package-openclaw-for-docker.mjs` e então constrói/reutiliza duas imagens de `scripts/e2e/Dockerfile`. A imagem básica é apenas o executor Node/Git para trilhas de instalação/atualização/dependência de plugin; essas trilhas montam o tarball pré-construído. A imagem funcional instala o mesmo tarball em `/app` para trilhas de funcionalidade do aplicativo construído. As definições de trilhas Docker ficam em `scripts/lib/docker-e2e-scenarios.mjs`; a lógica do planejador fica em `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` executa o plano selecionado. O agregado usa um agendador local ponderado: `OPENCLAW_DOCKER_ALL_PARALLELISM` controla os slots de processo, enquanto limites de recursos impedem que trilhas pesadas ao vivo, de instalação npm e de múltiplos serviços iniciem todas ao mesmo tempo. Se uma única trilha for mais pesada que os limites ativos, o agendador ainda pode iniciá-la quando o pool estiver vazio e então mantê-la executando sozinha até que a capacidade esteja disponível novamente. Os padrões são 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ajuste `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` somente quando o host Docker tiver mais folga. O executor faz uma pré-verificação Docker por padrão, remove contêineres E2E obsoletos do OpenClaw, imprime status a cada 30 segundos, armazena tempos de trilhas bem-sucedidas em `.artifacts/docker-tests/lane-timings.json` e usa esses tempos para iniciar primeiro as trilhas mais longas em execuções posteriores. Use `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir o manifesto ponderado de trilhas sem construir nem executar Docker, ou `node scripts/test-docker-all.mjs --plan-json` para imprimir o plano de CI para trilhas selecionadas, necessidades de pacote/imagem e credenciais.
- `Package Acceptance` é o gate de pacote nativo do GitHub para "este tarball instalável funciona como produto?" Ele resolve um pacote candidato a partir de `source=npm`, `source=ref`, `source=url` ou `source=artifact`, faz upload dele como `package-under-test` e então executa as trilhas Docker E2E reutilizáveis contra esse tarball exato em vez de reempacotar a ref selecionada. Os perfis são ordenados por abrangência: `smoke`, `package`, `product` e `full`. Consulte [Testando atualizações e plugins](/pt-BR/help/testing-updates-plugins) para o contrato de pacote/atualização/plugin, matriz de sobrevivência de upgrade publicado, padrões de release e triagem de falhas.
- Verificações de build e release executam `scripts/check-cli-bootstrap-imports.mjs` após tsdown. A proteção percorre o grafo construído estático a partir de `dist/entry.js` e `dist/cli/run-main.js` e falha se a inicialização pré-dispatch importar dependências de pacote como Commander, UI de prompt, undici ou logging antes do dispatch de comando; ela também mantém o chunk de execução do gateway empacotado dentro do orçamento e rejeita importações estáticas de caminhos conhecidos frios do gateway. O teste de fumaça da CLI empacotada também cobre ajuda raiz, ajuda de onboarding, ajuda do doctor, status, esquema de configuração e um comando de listagem de modelos.
- A compatibilidade legada do Package Acceptance é limitada a `2026.4.25` (`2026.4.25-beta.*` incluído). Até esse corte, o harness tolera apenas lacunas de metadados de pacotes enviados: entradas omitidas de inventário de QA privado, `gateway install --wrapper` ausente, arquivos de patch ausentes no fixture git derivado do tarball, `update.channel` persistido ausente, locais legados de registros de instalação de plugin, persistência ausente de registros de instalação do marketplace e migração de metadados de configuração durante `plugins update`. Para pacotes após `2026.4.25`, esses caminhos são falhas estritas.
- Executores de fumaça em contêiner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` e `test:docker:config-reload` inicializam um ou mais contêineres reais e verificam caminhos de integração de nível mais alto.

Os executores Docker de modelos ao vivo também fazem bind mount apenas das homes de autenticação da CLI necessárias (ou todas as suportadas quando a execução não está reduzida) e então as copiam para a home do contêiner antes da execução para que OAuth de CLI externa possa atualizar tokens sem alterar o armazenamento de autenticação do host:

- Modelos diretos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke de vinculação ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; cobre Claude, Codex e Gemini por padrão, com cobertura estrita de Droid/OpenCode via `pnpm test:docker:live-acp-bind:droid` e `pnpm test:docker:live-acp-bind:opencode`)
- Smoke de backend da CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke do harness do servidor de app Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente de desenvolvimento: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke de observabilidade: `pnpm qa:otel:smoke` é uma faixa privada de QA com checkout do código-fonte. Intencionalmente, ela não faz parte das faixas de release Docker do pacote porque o tarball npm omite o QA Lab.
- Smoke ao vivo do Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Assistente de onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke de onboarding/canal/agente do tarball npm: `pnpm test:docker:npm-onboard-channel-agent` instala o tarball empacotado do OpenClaw globalmente no Docker, configura o OpenAI via onboarding com referência de env mais Telegram por padrão, executa o doctor e executa um turno de agente OpenAI simulado. Reutilize um tarball pré-compilado com `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pule a recompilação do host com `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ou troque o canal com `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` ou `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- Smoke de instalação de Skill: `pnpm test:docker:skill-install` instala o tarball empacotado do OpenClaw globalmente no Docker, desabilita instalações de arquivos enviados na config, resolve o slug da Skill ClawHub ao vivo atual pela busca, instala-a com `openclaw skills install` e verifica a Skill instalada mais os metadados de origem/bloqueio de `.clawhub`.
- Smoke de troca de canal de atualização: `pnpm test:docker:update-channel-switch` instala o tarball empacotado do OpenClaw globalmente no Docker, troca do pacote `stable` para git `dev`, verifica o canal persistido e o trabalho pós-atualização do Plugin, depois troca de volta para o pacote `stable` e verifica o status de atualização.
- Smoke de sobrevivência a upgrade: `pnpm test:docker:upgrade-survivor` instala o tarball empacotado do OpenClaw sobre uma fixture suja de usuário antigo com agentes, config de canal, allowlists de Plugin, estado obsoleto de dependências de Plugin e arquivos existentes de workspace/sessão. Ele executa atualização de pacote mais doctor não interativo sem provedor ao vivo ou chaves de canal, depois inicia um Gateway de loopback e verifica a preservação de config/estado mais orçamentos de inicialização/status.
- Smoke de sobrevivência a upgrade publicado: `pnpm test:docker:published-upgrade-survivor` instala `openclaw@latest` por padrão, semeia arquivos realistas de usuário existente, configura essa linha de base com uma receita de comando embutida, valida a config resultante, atualiza essa instalação publicada para o tarball candidato, executa doctor não interativo, escreve `.artifacts/upgrade-survivor/summary.json`, depois inicia um Gateway de loopback e verifica intents configuradas, preservação de estado, inicialização, `/healthz`, `/readyz` e orçamentos de status RPC. Sobrescreva uma linha de base com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, peça ao agendador agregado para expandir linhas de base locais exatas com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, como `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, e expanda fixtures em formato de issues com `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, como `reported-issues`; o conjunto reported-issues inclui `configured-plugin-installs` para reparo automático de instalação de Plugin OpenClaw externo. Package Acceptance expõe isso como `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` e `published_upgrade_survivor_scenarios`, resolve tokens meta de linha de base como `last-stable-4` ou `all-since-2026.4.23`, e Full Release Validation expande o gate de pacote release-soak para `last-stable-4 2026.4.23 2026.5.2 2026.4.15` mais `reported-issues`.
- Smoke de contexto de runtime de sessão: `pnpm test:docker:session-runtime-context` verifica a persistência oculta da transcrição de contexto de runtime mais o reparo pelo doctor de branches duplicados afetados de reescrita de prompt.
- Smoke de instalação global com Bun: `bash scripts/e2e/bun-global-install-smoke.sh` empacota a árvore atual, instala-a com `bun install -g` em uma home isolada e verifica se `openclaw infer image providers --json` retorna provedores de imagem incluídos em vez de travar. Reutilize um tarball pré-compilado com `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pule o build do host com `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ou copie `dist/` de uma imagem Docker já compilada com `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker do instalador: `bash scripts/test-install-sh-docker.sh` compartilha um cache npm entre seus contêineres root, update e direct-npm. O smoke de update usa npm `latest` como linha de base estável por padrão antes de atualizar para o tarball candidato. Sobrescreva com `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` localmente ou com a entrada `update_baseline_version` do workflow Install Smoke no GitHub. As verificações do instalador non-root mantêm um cache npm isolado para que entradas de cache pertencentes ao root não mascarem o comportamento de instalação local do usuário. Defina `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` para reutilizar o cache root/update/direct-npm entre reexecuções locais.
- O CI Install Smoke pula a atualização global direct-npm duplicada com `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; execute o script localmente sem essa env quando for necessária cobertura direta de `npm install -g`.
- Smoke de CLI de exclusão de workspace compartilhado por agentes: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) compila a imagem Dockerfile raiz por padrão, semeia dois agentes com um workspace em uma home isolada de contêiner, executa `agents delete --json` e verifica JSON válido mais comportamento de workspace retido. Reutilize a imagem install-smoke com `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Rede do Gateway (dois contêineres, autenticação WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Smoke de snapshot CDP do navegador: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) compila a imagem E2E de código-fonte mais uma camada Chromium, inicia o Chromium com CDP bruto, executa `browser doctor --deep` e verifica se snapshots de funções CDP cobrem URLs de links, clicáveis promovidos por cursor, refs de iframe e metadados de frame.
- Regressão de reasoning mínimo do OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) executa um servidor OpenAI simulado pelo Gateway, verifica que `web_search` eleva `reasoning.effort` de `minimal` para `low`, depois força a rejeição do schema do provedor e confere que o detalhe bruto aparece nos logs do Gateway.
- Ponte de canal MCP (Gateway semeado + ponte stdio + smoke de raw Claude notification-frame): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Ferramentas MCP do bundle Pi (servidor MCP stdio real + smoke de allow/deny do perfil Pi embutido): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Limpeza Cron/subagente MCP (Gateway real + desmontagem de filho MCP stdio após execuções isoladas de cron e subagente one-shot): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke de instalação/atualização para caminho local, `file:`, registro npm com dependências hoisted, refs git móveis, kitchen-sink ClawHub, atualizações de marketplace e habilitação/inspeção do bundle Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Defina `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para pular o bloco ClawHub, ou sobrescreva o par pacote/runtime kitchen-sink padrão com `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` e `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sem `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, o teste usa um servidor hermético local de fixture ClawHub.
- Smoke de atualização inalterada de Plugin: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke de matriz de ciclo de vida de Plugin: `pnpm test:docker:plugin-lifecycle-matrix` instala o tarball empacotado do OpenClaw em um contêiner vazio, instala um Plugin npm, alterna habilitar/desabilitar, faz upgrade e downgrade dele por um registro npm local, exclui o código instalado e então verifica que a desinstalação ainda remove estado obsoleto enquanto registra métricas de RSS/CPU para cada fase do ciclo de vida.
- Smoke de metadados de recarregamento de config: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` cobre smoke de instalação/atualização para caminho local, `file:`, registro npm com dependências hoisted, refs git móveis, fixtures ClawHub, atualizações de marketplace e habilitação/inspeção do bundle Claude. `pnpm test:docker:plugin-update` cobre o comportamento de atualização inalterada para Plugins instalados. `pnpm test:docker:plugin-lifecycle-matrix` cobre instalação, habilitação, desabilitação, upgrade, downgrade e desinstalação com código ausente de Plugin npm com recursos rastreados.

Para pré-compilar e reutilizar manualmente a imagem funcional compartilhada:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Sobrescritas de imagem específicas da suíte, como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, ainda prevalecem quando definidas. Quando `OPENCLAW_SKIP_DOCKER_BUILD=1` aponta para uma imagem compartilhada remota, os scripts fazem pull dela se ela ainda não estiver local. Os testes Docker de QR e instalador mantêm seus próprios Dockerfiles porque validam comportamento de pacote/instalação em vez do runtime de app compilado compartilhado.

Os runners Docker de modelos ao vivo também fazem bind mount do checkout atual como somente leitura e
o preparam em um diretório de trabalho temporário dentro do contêiner. Isso mantém a imagem de runtime
enxuta enquanto ainda executa o Vitest contra seu código-fonte/configuração local exatos.
A etapa de preparação ignora caches grandes apenas locais e saídas de build de apps, como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e diretórios de saída `.build` locais do app ou
do Gradle, para que execuções ao vivo no Docker não passem minutos copiando
artefatos específicos da máquina.
Eles também definem `OPENCLAW_SKIP_CHANNELS=1` para que probes ao vivo do gateway não iniciem
workers de canais reais do Telegram/Discord/etc. dentro do contêiner.
`test:docker:live-models` ainda executa `pnpm test:live`, então repasse
`OPENCLAW_LIVE_GATEWAY_*` também quando precisar restringir ou excluir a cobertura ao vivo
do gateway dessa lane Docker.
`test:docker:openwebui` é um smoke de compatibilidade de nível mais alto: ele inicia um
contêiner de gateway OpenClaw com os endpoints HTTP compatíveis com OpenAI habilitados,
inicia um contêiner fixado do Open WebUI contra esse gateway, faz login pelo
Open WebUI, verifica se `/api/models` expõe `openclaw/default` e então envia uma
solicitação real de chat por meio do proxy `/api/chat/completions` do Open WebUI.
Defina `OPENWEBUI_SMOKE_MODE=models` para verificações de CI do caminho de release que devem parar
após o login no Open WebUI e a descoberta de modelos, sem aguardar uma conclusão de modelo
ao vivo.
A primeira execução pode ser perceptivelmente mais lenta porque o Docker pode precisar baixar a
imagem do Open WebUI e o Open WebUI pode precisar concluir sua própria configuração de inicialização a frio.
Essa lane espera uma chave de modelo ao vivo utilizável, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` por padrão) é a principal forma de fornecê-la em execuções dockerizadas.
Execuções bem-sucedidas imprimem um pequeno payload JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` é intencionalmente determinístico e não precisa de uma
conta real do Telegram, Discord ou iMessage. Ele inicializa um contêiner Gateway
com seed, inicia um segundo contêiner que executa `openclaw mcp serve` e então
verifica descoberta de conversas roteadas, leituras de transcrições, metadados de anexos,
comportamento da fila de eventos ao vivo, roteamento de envio de saída e notificações de canal +
permissão no estilo Claude pela ponte MCP stdio real. A verificação de notificação
inspeciona diretamente os frames MCP stdio brutos para que o smoke valide o que a
ponte realmente emite, não apenas o que um SDK de cliente específico por acaso expõe.
`test:docker:pi-bundle-mcp-tools` é determinístico e não precisa de uma chave de modelo
ao vivo. Ele cria a imagem Docker do repositório, inicia um servidor de probe MCP stdio real
dentro do contêiner, materializa esse servidor por meio do runtime MCP do pacote Pi
embutido, executa a ferramenta e então verifica se `coding` e `messaging` mantêm
ferramentas `bundle-mcp`, enquanto `minimal` e `tools.deny: ["bundle-mcp"]` as filtram.
`test:docker:cron-mcp-cleanup` é determinístico e não precisa de uma chave de modelo
ao vivo. Ele inicia um Gateway com seed e um servidor de probe MCP stdio real, executa
um turno cron isolado e um turno filho one-shot de `/subagents spawn`, e então verifica
se o processo filho MCP sai após cada execução.

Smoke manual de thread ACP em linguagem simples (não CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantenha este script para fluxos de regressão/depuração. Ele pode ser necessário novamente para validação de roteamento de threads ACP, então não o exclua.

Variáveis de ambiente úteis:

- `OPENCLAW_CONFIG_DIR=...` (padrão: `~/.openclaw`) montado em `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (padrão: `~/.openclaw/workspace`) montado em `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (padrão: `~/.profile`) montado em `/home/node/.profile` e carregado antes de executar testes
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar apenas variáveis de ambiente carregadas de `OPENCLAW_PROFILE_FILE`, usando diretórios temporários de configuração/workspace e nenhum mount externo de autenticação de CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (padrão: `~/.cache/openclaw/docker-cli-tools`) montado em `/home/node/.npm-global` para instalações de CLI em cache dentro do Docker
- Diretórios/arquivos externos de autenticação de CLI em `$HOME` são montados como somente leitura em `/host-auth...` e então copiados para `/home/node/...` antes do início dos testes
  - Diretórios padrão: `.minimax`
  - Arquivos padrão: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Execuções restritas por provedor montam apenas os diretórios/arquivos necessários inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Sobrescreva manualmente com `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` ou uma lista separada por vírgulas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para restringir a execução
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar provedores dentro do contêiner
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar uma imagem `openclaw:local-live` existente em reexecuções que não precisam de rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para garantir que credenciais venham do armazenamento de perfil (não do ambiente)
- `OPENCLAW_OPENWEBUI_MODEL=...` para escolher o modelo exposto pelo gateway para o smoke do Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para sobrescrever o prompt de verificação de nonce usado pelo smoke do Open WebUI
- `OPENWEBUI_IMAGE=...` para sobrescrever a tag fixada da imagem do Open WebUI

## Sanidade dos docs

Execute verificações de docs após edições de documentação: `pnpm check:docs`.
Execute a validação completa de âncoras do Mintlify quando também precisar de verificações de cabeçalhos na página: `pnpm docs:check-links:anchors`.

## Regressão offline (segura para CI)

Estas são regressões de "pipeline real" sem provedores reais:

- Chamadas de ferramenta do Gateway (OpenAI mockado, gateway real + loop de agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistente do Gateway (WS `wizard.start`/`wizard.next`, grava configuração + autenticação aplicada): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Evals de confiabilidade de agentes (Skills)

Já temos alguns testes seguros para CI que se comportam como "evals de confiabilidade de agentes":

- Chamadas de ferramenta mockadas pelo gateway real + loop de agente (`src/gateway/gateway.test.ts`).
- Fluxos de assistente de ponta a ponta que validam a fiação da sessão e os efeitos de configuração (`src/gateway/gateway.test.ts`).

O que ainda falta para Skills (veja [Skills](/pt-BR/tools/skills)):

- **Tomada de decisão:** quando Skills são listadas no prompt, o agente escolhe a skill certa (ou evita as irrelevantes)?
- **Conformidade:** o agente lê `SKILL.md` antes de usar e segue as etapas/argumentos obrigatórios?
- **Contratos de workflow:** cenários multi-turno que validam ordem de ferramentas, preservação do histórico da sessão e limites do sandbox.

Evals futuros devem permanecer determinísticos primeiro:

- Um runner de cenários usando provedores mockados para validar chamadas de ferramentas + ordem, leituras de arquivos de skills e fiação da sessão.
- Uma pequena suíte de cenários focados em skills (usar vs evitar, gates, prompt injection).
- Evals ao vivo opcionais (opt-in, controlados por env) somente depois que a suíte segura para CI estiver pronta.

## Testes de contrato (formato de plugin e canal)

Testes de contrato verificam se cada plugin e canal registrado está em conformidade com seu
contrato de interface. Eles iteram por todos os plugins descobertos e executam uma suíte de
asserções de formato e comportamento. A lane unitária padrão de `pnpm test` intencionalmente
ignora esses arquivos compartilhados de seam e smoke; execute os comandos de contrato explicitamente
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
- **outbound-payload** - Estrutura de payload de mensagem
- **inbound** - Tratamento de mensagens de entrada
- **actions** - Handlers de ação de canal
- **threading** - Tratamento de ID de thread
- **directory** - API de diretório/lista
- **group-policy** - Aplicação de política de grupo

### Contratos de status de provedor

Localizados em `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probes de status de canal
- **registry** - Formato do registro de plugins

### Contratos de provedor

Localizados em `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato de fluxo de autenticação
- **auth-choice** - Escolha/seleção de autenticação
- **catalog** - API de catálogo de modelos
- **discovery** - Descoberta de plugins
- **loader** - Carregamento de plugins
- **runtime** - Runtime de provedor
- **shape** - Formato/interface de plugin
- **wizard** - Assistente de configuração

### Quando executar

- Depois de alterar exports ou subpaths do plugin-sdk
- Depois de adicionar ou modificar um plugin de canal ou provedor
- Depois de refatorar registro ou descoberta de plugins

Testes de contrato rodam no CI e não exigem chaves reais de API.

## Adicionando regressões (orientação)

Quando você corrige um problema de provedor/modelo descoberto ao vivo:

- Adicione uma regressão segura para CI se possível (provedor mock/stub, ou capture a transformação exata do formato da solicitação)
- Se for inerentemente apenas ao vivo (limites de taxa, políticas de autenticação), mantenha o teste ao vivo restrito e opt-in via variáveis de ambiente
- Prefira mirar na menor camada que detecta o bug:
  - bug de conversão/replay de solicitação do provedor → teste direto de modelos
  - bug no pipeline de sessão/histórico/ferramentas do gateway → smoke ao vivo do gateway ou teste mock do gateway seguro para CI
- Guardrail de travessia de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva um alvo amostrado por classe de SecretRef a partir dos metadados do registro (`listSecretTargetRegistryEntries()`) e então afirma que ids exec com segmento de travessia são rejeitados.
  - Se você adicionar uma nova família de alvo SecretRef `includeInPlan` em `src/secrets/target-registry-data.ts`, atualize `classifyTargetClass` nesse teste. O teste falha intencionalmente em ids de alvo não classificados para que novas classes não possam ser ignoradas silenciosamente.

## Relacionado

- [Testes ao vivo](/pt-BR/help/testing-live)
- [Testes de atualizações e plugins](/pt-BR/help/testing-updates-plugins)
- [CI](/pt-BR/ci)
