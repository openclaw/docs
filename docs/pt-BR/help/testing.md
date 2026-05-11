---
read_when:
    - Executando testes localmente ou em CI
    - Adicionando testes de regressão para falhas de modelo/provedor
    - Depuração do comportamento do Gateway + agente
summary: 'Kit de testes: suítes unitárias/e2e/ao vivo, executores Docker e o que cada teste cobre'
title: Testes
x-i18n:
    generated_at: "2026-05-11T20:31:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: cfc73e8b86188dbc58a92f36a90b9fb4d59ac4cce2c60e0bd81aca662a524561
    source_path: help/testing.md
    workflow: 16
---

OpenClaw tem três suítes Vitest (unitária/integração, e2e, live) e um pequeno conjunto
de executores Docker. Este documento é um guia de "como testamos":

- O que cada suíte cobre (e o que ela deliberadamente _não_ cobre).
- Quais comandos executar para fluxos de trabalho comuns (local, pré-push, depuração).
- Como os testes live descobrem credenciais e selecionam modelos/provedores.
- Como adicionar regressões para problemas reais de modelos/provedores.

<Note>
**A pilha de QA (qa-lab, qa-channel, faixas de transporte live)** é documentada separadamente:

- [Visão geral de QA](/pt-BR/concepts/qa-e2e-automation) - arquitetura, superfície de comandos, criação de cenários.
- [QA de matriz](/pt-BR/concepts/qa-matrix) - referência para `pnpm openclaw qa matrix`.
- [Canal de QA](/pt-BR/channels/qa-channel) - o Plugin de transporte sintético usado por cenários respaldados pelo repositório.

Esta página cobre a execução das suítes de teste regulares e dos executores Docker/Parallels. A seção de executores específicos de QA abaixo ([Executores específicos de QA](#qa-specific-runners)) lista as invocações concretas de `qa` e aponta de volta para as referências acima.
</Note>

## Início rápido

Na maioria dos dias:

- Gate completo (esperado antes de push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Execução local mais rápida da suíte completa em uma máquina espaçosa: `pnpm test:max`
- Loop direto de observação do Vitest: `pnpm test:watch`
- O direcionamento direto de arquivos agora também roteia caminhos de extensão/canal: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefira execuções direcionadas primeiro quando estiver iterando em uma única falha.
- Site de QA com suporte do Docker: `pnpm qa:lab:up`
- Faixa de QA com suporte de VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando você tocar em testes ou quiser confiança extra:

- Gate de cobertura: `pnpm test:coverage`
- Suíte E2E: `pnpm test:e2e`

Ao depurar provedores/modelos reais (requer credenciais reais):

- Suíte live (modelos + sondas de ferramenta/imagem do Gateway): `pnpm test:live`
- Direcione um arquivo live silenciosamente: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Relatórios de desempenho em runtime: dispare `OpenClaw Performance` com
  `live_gpt54=true` para uma rodada de agente `openai/gpt-5.4` real ou
  `deep_profile=true` para artefatos de CPU/heap/trace do Kova. Execuções agendadas diárias
  publicam artefatos das faixas mock-provider, deep-profile e GPT 5.4 em
  `openclaw/clawgrit-reports` quando `CLAWGRIT_REPORTS_TOKEN` está configurado. O
  relatório mock-provider também inclui números de boot do Gateway em nível de origem, memória,
  pressão de Plugin, hello-loop repetido de modelo falso e inicialização da CLI.
- Varredura live de modelos no Docker: `pnpm test:docker:live-models`
  - Cada modelo selecionado agora executa uma rodada de texto mais uma pequena sonda no estilo de leitura de arquivo.
    Modelos cujos metadados anunciam entrada `image` também executam uma pequena rodada de imagem.
    Desabilite as sondas extras com `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` ou
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` ao isolar falhas de provedor.
  - Cobertura de CI: `OpenClaw Scheduled Live And E2E Checks` diário e
    `OpenClaw Release Checks` manual chamam o fluxo de trabalho reutilizável live/E2E com
    `include_live_suites: true`, que inclui jobs separados de matriz de modelos live no Docker
    fragmentados por provedor.
  - Para reexecuções focadas de CI, dispare `OpenClaw Live And E2E Checks (Reusable)`
    com `include_live_suites: true` e `live_models_only: true`.
  - Adicione novos segredos de provedor de alto sinal a `scripts/ci-hydrate-live-auth.sh`
    mais `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` e seus
    chamadores agendados/de release.
- Smoke de chat vinculado nativo do Codex: `pnpm test:docker:live-codex-bind`
  - Executa uma faixa live no Docker contra o caminho do app-server do Codex, vincula uma
    DM sintética do Slack com `/codex bind`, exercita `/codex fast` e
    `/codex permissions`, então verifica uma resposta simples e um anexo de imagem
    roteados pela vinculação nativa do Plugin em vez de ACP.
- Smoke do harness do app-server do Codex: `pnpm test:docker:live-codex-harness`
  - Executa rodadas de agente do Gateway pelo harness do app-server do Codex pertencente ao Plugin,
    verifica `/codex status` e `/codex models` e, por padrão, exercita sondas de imagem,
    MCP de Cron, subagente e Guardian. Desabilite a sonda de subagente com
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` ao isolar outras falhas do app-server
    do Codex. Para uma verificação focada de subagente, desabilite as outras sondas:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Isso sai após a sonda de subagente, a menos que
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` esteja definido.
- Smoke de instalação sob demanda do Codex: `pnpm test:docker:codex-on-demand`
  - Instala o tarball empacotado do OpenClaw no Docker, executa o onboarding com chave de API
    da OpenAI e verifica que o Plugin Codex e a dependência `@openai/codex`
    foram baixados sob demanda para a raiz npm gerenciada.
- Smoke live de dependência de ferramenta de Plugin: `pnpm test:docker:live-plugin-tool`
  - Empacota um Plugin fixture com uma dependência real `slugify`, instala-o por
    `npm-pack:`, verifica a dependência sob a raiz npm gerenciada e então pede a um
    modelo OpenAI live para chamar a ferramenta do Plugin e retornar o slug oculto.
- Smoke do comando de resgate do Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Verificação opcional de cinto e suspensórios para a superfície do comando de resgate
    do canal de mensagens. Ele exercita `/crestodian status`, enfileira uma alteração
    persistente de modelo, responde `/crestodian yes` e verifica o caminho de gravação de auditoria/configuração.
- Smoke Docker do planejador do Crestodian: `pnpm test:docker:crestodian-planner`
  - Executa o Crestodian em um contêiner sem configuração com uma CLI Claude falsa em `PATH`
    e verifica que o fallback de planejador fuzzy se traduz em uma gravação de configuração tipada auditada.
- Smoke Docker de primeira execução do Crestodian: `pnpm test:docker:crestodian-first-run`
  - Começa de um diretório de estado vazio do OpenClaw, roteia `openclaw` simples para
    Crestodian, aplica setup/modelo/agente/Plugin Discord + gravações SecretRef,
    valida a configuração e verifica entradas de auditoria. O mesmo caminho de setup Ring 0
    também é coberto no QA Lab por
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke de custo Moonshot/Kimi: com `MOONSHOT_API_KEY` definido, execute
  `openclaw models list --provider moonshot --json`, então execute um
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolado contra `moonshot/kimi-k2.6`. Verifique se o JSON informa Moonshot/K2.6 e se a
  transcrição do assistente armazena `usage.cost` normalizado.

<Tip>
Quando você precisar de apenas um caso com falha, prefira restringir testes live pelas variáveis de ambiente de allowlist descritas abaixo.
</Tip>

## Executores específicos de QA

Estes comandos ficam ao lado das suítes de teste principais quando você precisa do realismo do QA-lab:

A CI executa o QA Lab em fluxos de trabalho dedicados. A paridade agentic fica aninhada em
`QA-Lab - All Lanes` e na validação de release, não em um fluxo de trabalho de PR independente.
Validação ampla deve usar `Full Release Validation` com
`rerun_group=qa-parity` ou o grupo de QA de verificações de release. Verificações de release
estáveis/padrão mantêm o soak live/Docker exaustivo atrás de `run_release_soak=true`; o
perfil `full` força o soak. `QA-Lab - All Lanes`
é executado todas as noites em `main` e por disparo manual com a faixa de paridade mock, a faixa live
Matrix, a faixa live Telegram gerenciada pelo Convex e a faixa live Discord
gerenciada pelo Convex como jobs paralelos. QA agendado e verificações de release passam Matrix
`--profile fast` explicitamente, enquanto a CLI Matrix e a entrada de fluxo de trabalho manual
mantêm o padrão `all`; o disparo manual pode fragmentar `all` em jobs `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`. `OpenClaw Release
Checks` executa paridade mais as faixas rápidas Matrix e Telegram antes da aprovação de release,
usando `mock-openai/gpt-5.5` para verificações de transporte de release, para que permaneçam
determinísticas e evitem a inicialização normal de Plugin de provedor. Esses Gateways de transporte
live desabilitam a busca de memória; o comportamento de memória continua coberto pelas suítes
de paridade de QA.

Fragmentos de mídia live de release completo usam
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, que já tem
`ffmpeg` e `ffprobe`. Fragmentos Docker de modelo/backend live usam a imagem compartilhada
`ghcr.io/openclaw/openclaw-live-test:<sha>` criada uma vez por commit selecionado,
então a puxam com `OPENCLAW_SKIP_DOCKER_BUILD=1` em vez de reconstruir
dentro de cada fragmento.

- `pnpm openclaw qa suite`
  - Executa cenários de QA apoiados pelo repositório diretamente no host.
  - Executa vários cenários selecionados em paralelo por padrão com workers de
    gateway isolados. `qa-channel` usa concorrência 4 por padrão (limitada pela
    contagem de cenários selecionados). Use `--concurrency <count>` para ajustar
    a contagem de workers, ou `--concurrency 1` para a faixa serial mais antiga.
  - Sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando você
    quiser artefatos sem um código de saída de falha.
  - Oferece suporte aos modos de provedor `live-frontier`, `mock-openai` e `aimock`.
    `aimock` inicia um servidor de provedor local baseado em AIMock para cobertura
    experimental de fixtures e mocks de protocolo sem substituir a faixa
    `mock-openai` ciente de cenários.
- `pnpm test:plugins:kitchen-sink-live`
  - Executa a bateria do Plugin Kitchen Sink OpenAI ao vivo pelo QA Lab. Ele
    instala o pacote externo Kitchen Sink, verifica o inventário da superfície do SDK de Plugin,
    testa `/healthz` e `/readyz`, registra evidências de CPU/RSS do Gateway,
    executa um turno OpenAI ao vivo e verifica diagnósticos adversariais.
    Requer autenticação OpenAI ao vivo, como `OPENAI_API_KEY`. Em sessões Testbox
    hidratadas, ele carrega automaticamente o perfil de autenticação ao vivo do Testbox quando o
    helper `openclaw-testbox-env` está presente.
- `pnpm test:gateway:cpu-scenarios`
  - Executa o benchmark de inicialização do Gateway mais um pequeno pacote de cenários mock do QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) e grava um resumo combinado de observação de CPU
    em `.artifacts/gateway-cpu-scenarios/`.
  - Sinaliza apenas observações sustentadas de CPU alta por padrão (`--cpu-core-warn`
    mais `--hot-wall-warn-ms`), então rajadas curtas de inicialização são registradas como métricas
    sem parecer a regressão de Gateway travado por minutos.
  - Usa artefatos `dist` compilados; execute uma build primeiro quando o checkout ainda não
    tiver saída de runtime recente.
- `pnpm openclaw qa suite --runner multipass`
  - Executa a mesma suíte de QA dentro de uma VM Linux Multipass descartável.
  - Mantém o mesmo comportamento de seleção de cenários que `qa suite` no host.
  - Reutiliza as mesmas flags de seleção de provedor/modelo que `qa suite`.
  - Execuções ao vivo encaminham as entradas de autenticação de QA compatíveis que são práticas para o guest:
    chaves de provedor baseadas em env, o caminho de configuração do provedor ao vivo de QA e `CODEX_HOME`
    quando presente.
  - Diretórios de saída devem permanecer sob a raiz do repositório para que o guest possa gravar de volta pelo
    workspace montado.
  - Grava o relatório + resumo normais de QA mais logs do Multipass em
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia o site de QA apoiado por Docker para trabalho de QA no estilo operador.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Cria um tarball npm a partir do checkout atual, instala-o globalmente no
    Docker, executa onboarding não interativo com chave de API OpenAI, configura Telegram
    por padrão, verifica se o runtime do Plugin empacotado carrega sem reparo de dependência
    na inicialização, executa doctor e executa um turno de agente local contra um
    endpoint OpenAI simulado.
  - Use `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para executar a mesma faixa de instalação empacotada
    com Discord.
- `pnpm test:docker:session-runtime-context`
  - Executa um smoke determinístico de app compilado no Docker para transcritos de contexto de runtime
    embutido. Ele verifica que o contexto de runtime oculto do OpenClaw é persistido como uma
    mensagem personalizada não exibida em vez de vazar para o turno visível do usuário,
    depois semeia um JSONL de sessão quebrada afetada e verifica que
    `openclaw doctor --fix` o reescreve para o branch ativo com um backup.
- `pnpm test:docker:npm-telegram-live`
  - Instala um pacote candidato do OpenClaw no Docker, executa onboarding de pacote instalado,
    configura Telegram pela CLI instalada e então reutiliza a
    faixa de QA ao vivo do Telegram com esse pacote instalado como o Gateway SUT.
  - O wrapper monta apenas o código-fonte do harness `qa-lab` do checkout; o
    pacote instalado é dono de `dist`, `openclaw/plugin-sdk` e do runtime de Plugin
    agrupado, para que a faixa não misture plugins do checkout atual ao pacote
    em teste.
  - O padrão é `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; defina
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` ou
    `OPENCLAW_CURRENT_PACKAGE_TGZ` para testar um tarball local resolvido em vez de
    instalar a partir do registry.
  - Usa as mesmas credenciais env do Telegram ou a mesma fonte de credenciais Convex que
    `pnpm openclaw qa telegram`. Para automação de CI/release, defina
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` mais
    `OPENCLAW_QA_CONVEX_SITE_URL` e o segredo da função. Se
    `OPENCLAW_QA_CONVEX_SITE_URL` e um segredo de função Convex estiverem presentes no CI,
    o wrapper Docker seleciona Convex automaticamente.
  - O wrapper valida env de credenciais Telegram ou Convex no host antes do
    trabalho de build/instalação do Docker. Defina `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    apenas ao depurar deliberadamente a configuração pré-credenciais.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` sobrescreve o
    `OPENCLAW_QA_CREDENTIAL_ROLE` compartilhado apenas para esta faixa.
  - GitHub Actions expõe esta faixa como o workflow manual de mantenedores
    `NPM Telegram Beta E2E`. Ele não é executado em merge. O workflow usa o
    ambiente `qa-live-shared` e leases de credenciais CI Convex.
- GitHub Actions também expõe `Package Acceptance` para prova de produto em execução lateral
  contra um pacote candidato. Ele aceita uma ref confiável, especificação npm publicada,
  URL HTTPS de tarball mais SHA-256, ou artefato de tarball de outra execução, faz upload
  do `openclaw-current.tgz` normalizado como `package-under-test` e então executa o
  agendador Docker E2E existente com perfis de faixa smoke, pacote, produto, completo ou personalizado.
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

- Prova com URL exata de tarball requer um digest:

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
    com OpenAI configurado e então habilita canais/plugins agrupados via edições de configuração.
  - Verifica que a descoberta de configuração deixa ausentes plugins baixáveis não configurados,
    que o primeiro reparo configurado do doctor instala explicitamente cada
    Plugin baixável ausente e que uma segunda reinicialização não executa reparo de dependência
    oculto.
  - Também instala uma linha de base npm mais antiga conhecida, habilita Telegram antes de executar
    `openclaw update --tag <candidate>` e verifica que o doctor pós-atualização do candidato
    limpa resíduos de dependência de Plugin legado sem um reparo postinstall
    do lado do harness.
- `pnpm test:parallels:npm-update`
  - Executa o smoke nativo de atualização de instalação empacotada em guests Parallels. Cada
    plataforma selecionada primeiro instala o pacote de linha de base solicitado e então executa
    o comando `openclaw update` instalado no mesmo guest e verifica a
    versão instalada, o status de atualização, a prontidão do Gateway e um turno de agente local.
  - Use `--platform macos`, `--platform windows` ou `--platform linux` ao
    iterar em um guest. Use `--json` para o caminho do artefato de resumo e
    o status por faixa.
  - A faixa OpenAI usa `openai/gpt-5.5` para a prova de turno de agente ao vivo por
    padrão. Passe `--model <provider/model>` ou defina
    `OPENCLAW_PARALLELS_OPENAI_MODEL` ao validar deliberadamente outro
    modelo OpenAI.
  - Envolva execuções locais longas em um timeout do host para que travamentos de transporte do Parallels não
    consumam o restante da janela de testes:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - O script grava logs de faixa aninhados em `/tmp/openclaw-parallels-npm-update.*`.
    Inspecione `windows-update.log`, `macos-update.log` ou `linux-update.log`
    antes de presumir que o wrapper externo travou.
  - A atualização do Windows pode passar de 10 a 15 minutos no doctor pós-atualização e no trabalho de
    atualização de pacote em um guest frio; isso ainda está saudável quando o log de debug npm
    aninhado está avançando.
  - Não execute este wrapper agregado em paralelo com faixas de smoke individuais do Parallels
    macOS, Windows ou Linux. Elas compartilham estado da VM e podem colidir na
    restauração de snapshot, no serviço de pacotes ou no estado do Gateway do guest.
  - A prova pós-atualização executa a superfície normal de plugins agrupados porque
    fachadas de capacidade como fala, geração de imagens e compreensão de mídia
    são carregadas por APIs de runtime agrupadas mesmo quando o turno do agente
    em si verifica apenas uma resposta de texto simples.

- `pnpm openclaw qa aimock`
  - Inicia apenas o servidor de provedor AIMock local para testes smoke diretos de protocolo.
- `pnpm openclaw qa matrix`
  - Executa a faixa de QA ao vivo do Matrix contra um homeserver Tuwunel descartável apoiado por Docker. Somente checkout de código-fonte - instalações empacotadas não incluem `qa-lab`.
  - CLI completa, catálogo de perfis/cenários, variáveis env e layout de artefatos: [QA do Matrix](/pt-BR/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Executa a faixa de QA ao vivo do Telegram contra um grupo privado real usando os tokens do driver e do bot SUT vindos do env.
  - Requer `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. O id do grupo deve ser o id numérico do chat Telegram.
  - Oferece suporte a `--credential-source convex` para credenciais compartilhadas em pool. Use o modo env por padrão, ou defina `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por leases em pool.
  - Os padrões cobrem canary, bloqueio por menção, endereçamento por comando, `/status`, respostas mencionadas de bot para bot e respostas de comando nativo do core. Os padrões `mock-openai` também cobrem regressões determinísticas de cadeia de respostas e streaming de mensagem final do Telegram. Use `--list-scenarios` para sondas opcionais como `session_status`.
  - Sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando você
    quiser artefatos sem um código de saída de falha.
  - Requer dois bots distintos no mesmo grupo privado, com o bot SUT expondo um nome de usuário Telegram.
  - Para observação estável de bot para bot, habilite Bot-to-Bot Communication Mode em `@BotFather` para ambos os bots e garanta que o bot driver possa observar tráfego de bots no grupo.
  - Grava um relatório de QA do Telegram, resumo e artefato de mensagens observadas em `.artifacts/qa-e2e/...`. Cenários com resposta incluem RTT desde a solicitação de envio do driver até a resposta observada do SUT.

`Mantis Telegram Live` é o wrapper de evidência de PR em torno desta faixa. Ele executa a
ref candidata com credenciais Telegram alugadas via Convex, renderiza o transcrito
redigido de mensagens observadas em um navegador desktop Crabbox, grava evidência MP4,
gera um GIF recortado por movimento, faz upload do pacote de artefatos e publica evidência
inline no PR pelo Mantis GitHub App quando `pr_number` está definido. Mantenedores podem
iniciá-lo pela UI do Actions por meio de `Mantis Scenario` (`scenario_id:
telegram-live`) ou diretamente a partir de um comentário em pull request:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` é o wrapper agentic nativo do Telegram Desktop
antes/depois para prova visual de PR. Inicie-o pela UI do Actions com
`instructions` de formato livre, por meio de `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) ou a partir de um comentário em PR:

```text
@Mantis telegram desktop proof
```

O agente Mantis lê o PR, decide qual comportamento visível no Telegram comprova a
alteração, executa a lane de comprovação do Crabbox Telegram Desktop com usuário real nas refs de baseline e
candidate, itera até que os GIFs nativos sejam úteis, escreve um manifesto
`motionPreview` pareado e publica a mesma tabela de GIFs em 2 colunas pelo
Mantis GitHub App quando `pr_number` está definido.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Aluga ou reutiliza um desktop Linux do Crabbox, instala o Telegram Desktop nativo, configura o OpenClaw com um token de bot SUT do Telegram alugado, inicia o Gateway e grava evidências de screenshot/MP4 a partir do desktop VNC visível.
  - O padrão é `--credential-source convex`, para que os workflows precisem apenas do segredo do broker Convex. Use `--credential-source env` com as mesmas variáveis `OPENCLAW_QA_TELEGRAM_*` de `pnpm openclaw qa telegram`.
  - O Telegram Desktop ainda precisa de um login/perfil de usuário. O token do bot configura apenas o OpenClaw. Use `--telegram-profile-archive-env <name>` para um arquivo de perfil `.tgz` em base64, ou use `--keep-lease` e faça login manualmente pelo VNC uma vez.
  - Escreve `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` e `telegram-desktop-builder.mp4` no diretório de saída.

As lanes de transporte live compartilham um contrato padrão para que novos transportes não divirjam; a matriz de cobertura por lane fica em [Visão geral de QA → Cobertura de transporte live](/pt-BR/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` é a suíte sintética ampla e não faz parte dessa matriz.

### Credenciais compartilhadas do Telegram via Convex (v1)

Quando `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) está habilitado para
QA de transporte live, o QA lab adquire um lease exclusivo de um pool apoiado por Convex, envia Heartbeats desse
lease enquanto a lane está rodando e libera o lease no encerramento. O nome da seção é anterior ao
suporte a Discord, Slack e WhatsApp; o contrato de lease é compartilhado entre os tipos.

Scaffold de projeto Convex de referência:

- `qa/convex-credential-broker/`

Variáveis de ambiente obrigatórias:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por exemplo, `https://your-deployment.convex.site`)
- Um segredo para a função selecionada:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Seleção da função da credencial:
  - CLI: `--credential-role maintainer|ci`
  - Padrão de env: `OPENCLAW_QA_CREDENTIAL_ROLE` (o padrão é `ci` em CI, caso contrário `maintainer`)

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
especificamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Auxiliares da CLI para mantenedores:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Use `doctor` antes de execuções live para verificar a URL do site Convex, os segredos do broker,
o prefixo do endpoint, o tempo limite HTTP e a acessibilidade de admin/list sem imprimir
valores secretos. Use `--json` para saída legível por máquina em scripts e utilitários de CI.

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
  - Guarda de lease ativo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (somente segredo de mantenedor)
  - Requisição: `{ kind?, status?, includePayload?, limit? }`
  - Sucesso: `{ status: "ok", credentials, count }`

Formato do payload para o tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` deve ser uma string numérica de id de chat do Telegram.
- `admin/add` valida esse formato para `kind: "telegram"` e rejeita payloads malformados.

Formato do payload para o tipo usuário real do Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` e `telegramApiId` devem ser strings numéricas.
- `tdlibArchiveSha256` e `desktopTdataArchiveSha256` devem ser strings hexadecimais SHA-256.
- `kind: "telegram-user"` representa uma conta burner do Telegram. Trate o lease como abrangente para a conta: o driver CLI TDLib e a testemunha visual do Telegram Desktop restauram a partir do mesmo payload, e apenas um job deve manter o lease por vez.

Restauração de lease de usuário real do Telegram:

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

Use o perfil Desktop restaurado com `Telegram -workdir "$tmp/desktop"` quando uma gravação visual for necessária. Em ambientes locais de operador, `scripts/e2e/telegram-user-credential.ts` lê `~/.codex/skills/custom/telegram-e2e-bot-to-bot/convex.local.env` por padrão se as variáveis de ambiente do processo estiverem ausentes.

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

`start` aluga a credencial `telegram-user`, restaura a mesma conta no
TDLib e no Telegram Desktop em um desktop Linux do Crabbox, inicia um Gateway SUT
mock local a partir do checkout atual, abre o chat visível do Telegram, inicia
a gravação do desktop e escreve um `session.json` privado. Enquanto a sessão estiver
ativa, um agente pode continuar testando até ficar satisfeito:

- `send --session <file> --text <message>` envia pelo usuário TDLib real e aguarda a resposta do SUT.
- `run --session <file> -- <remote command>` executa um comando arbitrário no Crabbox e salva sua saída, por exemplo `bash -lc 'source /tmp/openclaw-telegram-user-crabbox/env.sh && python3 /tmp/openclaw-telegram-user-crabbox/user-driver.py transcript --limit 20 --json'`.
- `screenshot --session <file>` captura o desktop visível atual.
- `status --session <file>` imprime o lease e o comando WebVNC.
- `finish --session <file>` interrompe o gravador, captura artefatos de screenshot/vídeo/motion-trim, libera a credencial Convex, interrompe os processos SUT locais e interrompe o lease Crabbox, a menos que `--keep-box` seja passado.
- `publish --session <file> --pr <number>` publica um comentário de PR somente com GIF por padrão. Passe `--full-artifacts` apenas quando logs ou artefatos JSON forem intencionalmente necessários.

Para repros visuais determinísticos, passe `--mock-response-file <path>` para `start`
ou para o atalho de um comando `probe`. O runner usa por padrão uma classe
Crabbox padrão, gravação a 24fps, prévias GIF de movimento a 24fps e largura de GIF de
1920px. Substitua com `--class`, `--record-fps`, `--preview-fps` e
`--preview-width` apenas quando a comprovação precisar de configurações de captura diferentes.

Comprovação Crabbox em um comando:

```bash
pnpm qa:telegram-user:crabbox -- --text /status
```

O comando `probe` padrão é um atalho para um ciclo start/send/finish. Use-o
para um smoke rápido de `/status`. Use os comandos de sessão para revisão de PR,
trabalho de reprodução de bugs ou qualquer caso em que o agente precise de minutos de experimentação
arbitrária antes de decidir que a comprovação está completa. Use `--id <cbx_...>` para
reutilizar um lease de desktop aquecido, `--keep-box` para manter o VNC aberto após finish,
`--desktop-chat-title <name>` para escolher o chat visível e `--tdlib-url <tgz>`
ao usar um arquivo Linux `libtdjson.so` pré-preparado em vez de compilar o TDLib em
uma máquina nova. O runner verifica `--tdlib-url` com `--tdlib-sha256 <hex>` ou,
por padrão, um arquivo irmão `<url>.sha256`.

Payloads multicanal validados pelo broker:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

As lanes Slack também podem alugar do pool, mas a validação de payload do Slack atualmente
fica no runner de QA do Slack em vez de no broker. Use
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
para linhas Slack.

### Adicionando um canal à QA

A arquitetura e os nomes dos auxiliares de cenário para novos adaptadores de canal ficam em [Visão geral de QA → Adicionando um canal](/pt-BR/concepts/qa-e2e-automation#adding-a-channel). O requisito mínimo: implemente o runner de transporte no seam de host `qa-lab` compartilhado, declare `qaRunners` no manifesto do Plugin, monte como `openclaw qa <runner>` e escreva cenários em `qa/scenarios/`.

## Suítes de teste (o que roda onde)

Pense nas suítes como "realismo crescente" (e instabilidade/custo crescentes):

### Unitário / integração (padrão)

- Comando: `pnpm test`
- Configuração: execuções não direcionadas usam o conjunto de shards `vitest.full-*.config.ts` e podem expandir shards multiprojeto em configurações por projeto para agendamento paralelo
- Arquivos: inventários core/unit em `src/**/*.test.ts`, `packages/**/*.test.ts` e `test/**/*.test.ts`; testes unitários da UI rodam no shard dedicado `unit-ui`
- Escopo:
  - Testes puramente unitários
  - Testes de integração no processo (autenticação do Gateway, roteamento, ferramentas, parsing, configuração)
  - Regressões determinísticas para bugs conhecidos
- Expectativas:
  - Roda em CI
  - Não exige chaves reais
  - Deve ser rápido e estável
  - Testes de resolver e loader de superfície pública devem comprovar comportamento amplo de fallback de `api.js` e
    `runtime-api.js` com fixtures de Plugin minúsculas geradas, não com
    APIs de código-fonte reais de Plugin empacotado. Carregamentos de API de Plugin real pertencem a
    suítes de contrato/integração pertencentes ao Plugin.

Política de dependências nativas:

- Instalações de teste padrão ignoram builds nativas opcionais do opus do Discord. O recebimento de voz do Discord usa o decodificador `opusscript` em JS puro, e `@discordjs/opus` permanece desabilitado em `allowBuilds` para que testes locais e lanes do Testbox não compilem o addon nativo.
- Use uma lane dedicada de desempenho de voz do Discord ou uma lane live se você precisar intencionalmente comparar uma build nativa do opus. Não defina `@discordjs/opus` como `true` no `allowBuilds` padrão; isso faz loops de instalação/teste não relacionados compilarem código nativo.

<AccordionGroup>
  <Accordion title="Projetos, shards e lanes com escopo">

    - `pnpm test` sem alvo executa doze configurações menores de shard (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) em vez de um processo gigante nativo de projeto raiz. Isso reduz o pico de RSS em máquinas sob carga e evita que trabalhos de auto-reply/extensão privem suites não relacionadas de recursos.
    - `pnpm test --watch` ainda usa o grafo de projetos raiz nativo de `vitest.config.ts`, porque um loop watch com múltiplos shards não é prático.
    - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` roteiam alvos explícitos de arquivo/diretório primeiro por lanes com escopo, então `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar o custo de inicialização completo do projeto raiz.
    - `pnpm test:changed` expande caminhos git alterados em lanes baratas com escopo por padrão: edições diretas de testes, arquivos irmãos `*.test.ts`, mapeamentos explícitos de origem e dependentes locais do grafo de importação. Edições de config/setup/package não executam testes amplamente, a menos que você use explicitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` é o gate local inteligente normal para trabalho estreito. Ele classifica o diff em core, testes do core, extensões, testes de extensão, apps, docs, metadados de release, tooling live Docker e tooling, depois executa os comandos correspondentes de typecheck, lint e guard. Ele não executa testes Vitest; chame `pnpm test:changed` ou `pnpm test <target>` explícito para prova de teste. Bumps de versão somente em metadados de release executam verificações direcionadas de versão/config/dependência raiz, com um guard que rejeita alterações de pacote fora do campo de versão de nível superior.
    - Edições no harness live Docker ACP executam verificações focadas: sintaxe shell para os scripts de autenticação live Docker e um dry-run do agendador live Docker. Alterações em `package.json` são incluídas somente quando o diff se limita a `scripts["test:docker:live-*"]`; edições de dependências, exportações, versão e outras superfícies de pacote ainda usam os guards mais amplos.
    - Testes unitários leves em importação de agentes, comandos, plugins, helpers de auto-reply, `plugin-sdk` e áreas semelhantes de utilitários puros são roteados pela lane `unit-fast`, que ignora `test/setup-openclaw-runtime.ts`; arquivos stateful/pesados de runtime permanecem nas lanes existentes.
    - Arquivos de origem selecionados de helpers de `plugin-sdk` e `commands` também mapeiam execuções em modo changed para testes irmãos explícitos nessas lanes leves, então edições de helpers evitam reexecutar a suite pesada completa desse diretório.
    - `auto-reply` tem buckets dedicados para helpers core de nível superior, testes de integração `reply.*` de nível superior e a subárvore `src/auto-reply/reply/**`. O CI divide ainda mais a subárvore de reply em shards de agent-runner, dispatch e commands/state-routing, para que um bucket pesado em importações não detenha toda a cauda do Node.
    - O CI normal de PR/main ignora intencionalmente a varredura em lote de extensões e o shard `agentic-plugins` exclusivo de release. A Full Release Validation dispara o workflow filho separado `Plugin Prerelease` para essas suites pesadas de plugin/extensão em candidatos de release.

  </Accordion>

  <Accordion title="Cobertura do runner embutido">

    - Quando você alterar entradas de descoberta de ferramentas de mensagem ou contexto de runtime de Compaction, mantenha ambos os níveis de cobertura.
    - Adicione regressões focadas de helpers para limites puros de roteamento e normalização.
    - Mantenha saudáveis as suites de integração do runner embutido:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Essas suites verificam que ids com escopo e comportamento de Compaction ainda fluem pelos caminhos reais `run.ts` / `compact.ts`; testes somente de helpers não são um substituto suficiente para esses caminhos de integração.

  </Accordion>

  <Accordion title="Padrões de pool e isolamento do Vitest">

    - A configuração base do Vitest usa `threads` por padrão.
    - A configuração compartilhada do Vitest fixa `isolate: false` e usa o runner não isolado nos projetos raiz, configurações e2e e configurações live.
    - A lane raiz de UI mantém sua configuração `jsdom` e otimizador, mas também roda no runner compartilhado não isolado.
    - Cada shard de `pnpm test` herda os mesmos padrões `threads` + `isolate: false` da configuração compartilhada do Vitest.
    - `scripts/run-vitest.mjs` adiciona `--no-maglev` por padrão aos processos Node filhos do Vitest para reduzir churn de compilação do V8 durante grandes execuções locais. Defina `OPENCLAW_VITEST_ENABLE_MAGLEV=1` para comparar com o comportamento padrão do V8.

  </Accordion>

  <Accordion title="Iteração local rápida">

    - `pnpm changed:lanes` mostra quais lanes arquiteturais um diff aciona.
    - O hook de pre-commit é somente de formatação. Ele reencena arquivos formatados e não executa lint, typecheck nem testes.
    - Execute `pnpm check:changed` explicitamente antes de handoff ou push quando precisar do gate local inteligente de verificação.
    - `pnpm test:changed` roteia por lanes baratas com escopo por padrão. Use `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` somente quando o agente decidir que uma edição de harness, config, package ou contrato realmente precisa de cobertura Vitest mais ampla.
    - `pnpm test:max` e `pnpm test:changed:max` mantêm o mesmo comportamento de roteamento, apenas com um limite maior de workers.
    - O autoescalonamento local de workers é intencionalmente conservador e recua quando a média de carga do host já está alta, então várias execuções Vitest simultâneas causam menos impacto por padrão.
    - A configuração base do Vitest marca os arquivos de projetos/configuração como `forceRerunTriggers`, para que reexecuções em modo changed continuem corretas quando a fiação de testes muda.
    - A configuração mantém `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado em hosts compatíveis; defina `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se quiser um local explícito de cache para profiling direto.

  </Accordion>

  <Accordion title="Depuração de desempenho">

    - `pnpm test:perf:imports` habilita o relatório de duração de importações do Vitest mais a saída de detalhamento de importações.
    - `pnpm test:perf:imports:changed` aplica a mesma visualização de profiling aos arquivos alterados desde `origin/main`.
    - Dados de tempo dos shards são gravados em `.artifacts/vitest-shard-timings.json`. Execuções de configuração inteira usam o caminho da configuração como chave; shards de CI com padrão de inclusão acrescentam o nome do shard para que shards filtrados possam ser acompanhados separadamente.
    - Quando um teste quente ainda passa a maior parte do tempo em importações de inicialização, mantenha dependências pesadas atrás de um seam local estreito `*.runtime.ts` e faça mock desse seam diretamente em vez de importar profundamente helpers de runtime apenas para passá-los por `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compara `test:changed` roteado com o caminho nativo de projeto raiz para aquele diff commitado e imprime wall time mais RSS máximo no macOS.
    - `pnpm test:perf:changed:bench -- --worktree` faz benchmark da árvore suja atual roteando a lista de arquivos alterados por `scripts/test-projects.mjs` e pela configuração raiz do Vitest.
    - `pnpm test:perf:profile:main` grava um perfil de CPU da thread principal para overhead de inicialização e transformação do Vitest/Vite.
    - `pnpm test:perf:profile:runner` grava perfis de CPU+heap do runner para a suite unitária com paralelismo de arquivos desabilitado.

  </Accordion>
</AccordionGroup>

### Estabilidade (gateway)

- Comando: `pnpm test:stability:gateway`
- Configuração: `vitest.gateway.config.ts`, forçada para um worker
- Escopo:
  - Inicia um Gateway loopback real com diagnósticos habilitados por padrão
  - Conduz churn sintético de mensagem de gateway, memória e payload grande pelo caminho de eventos de diagnóstico
  - Consulta `diagnostics.stability` pelo RPC WS do Gateway
  - Cobre helpers de persistência do pacote de estabilidade de diagnóstico
  - Afirma que o gravador permanece limitado, que amostras sintéticas de RSS ficam abaixo do orçamento de pressão e que profundidades de fila por sessão drenam de volta para zero
- Expectativas:
  - Seguro para CI e sem chaves
  - Lane estreita para acompanhamento de regressão de estabilidade, não um substituto para a suite completa do Gateway

### E2E (smoke de gateway)

- Comando: `pnpm test:e2e`
- Configuração: `vitest.e2e.config.ts`
- Arquivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` e testes E2E de plugins empacotados em `extensions/`
- Padrões de runtime:
  - Usa `threads` do Vitest com `isolate: false`, correspondendo ao restante do repo.
  - Usa workers adaptativos (CI: até 2, local: 1 por padrão).
  - Roda em modo silencioso por padrão para reduzir overhead de E/S do console.
- Substituições úteis:
  - `OPENCLAW_E2E_WORKERS=<n>` para forçar a contagem de workers (limitada a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para reabilitar saída detalhada do console.
- Escopo:
  - Comportamento ponta a ponta de gateway com múltiplas instâncias
  - Superfícies WebSocket/HTTP, pareamento de node e networking mais pesado
- Expectativas:
  - Roda no CI (quando habilitado no pipeline)
  - Nenhuma chave real necessária
  - Mais partes móveis que testes unitários (pode ser mais lento)

### E2E: smoke do backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- Arquivo: `extensions/openshell/src/backend.e2e.test.ts`
- Escopo:
  - Inicia um gateway OpenShell isolado no host via Docker
  - Cria um sandbox a partir de um Dockerfile local temporário
  - Exercita o backend OpenShell do OpenClaw sobre `sandbox ssh-config` real + SSH exec
  - Verifica o comportamento de sistema de arquivos remoto-canônico pela ponte fs do sandbox
- Expectativas:
  - Somente opt-in; não faz parte da execução padrão de `pnpm test:e2e`
  - Requer uma CLI `openshell` local mais um daemon Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` isolados, depois destrói o gateway e o sandbox de teste
- Substituições úteis:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar o teste ao executar manualmente a suite e2e mais ampla
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apontar para um binário CLI não padrão ou script wrapper

### Live (provedores reais + modelos reais)

- Comando: `pnpm test:live`
- Configuração: `vitest.live.config.ts`
- Arquivos: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` e testes live de Plugins empacotados em `extensions/`
- Padrão: **habilitado** por `pnpm test:live` (define `OPENCLAW_LIVE_TEST=1`)
- Escopo:
  - "Este provedor/modelo realmente funciona _hoje_ com credenciais reais?"
  - Detectar mudanças de formato do provedor, peculiaridades de chamada de ferramentas, problemas de autenticação e comportamento de limite de taxa
- Expectativas:
  - Não é estável para CI por definição (redes reais, políticas reais de provedores, cotas, indisponibilidades)
  - Custa dinheiro / usa limites de taxa
  - Prefira executar subconjuntos reduzidos em vez de "tudo"
- Execuções live carregam `~/.profile` para obter chaves de API ausentes.
- Por padrão, execuções live ainda isolam `HOME` e copiam material de configuração/autenticação para uma home de teste temporária para que fixtures de unidade não possam modificar seu `~/.openclaw` real.
- Defina `OPENCLAW_LIVE_USE_REAL_HOME=1` somente quando você precisar intencionalmente que testes live usem seu diretório home real.
- `pnpm test:live` agora usa por padrão um modo mais silencioso: mantém a saída de progresso `[live] ...`, mas suprime o aviso extra de `~/.profile` e silencia logs de bootstrap do Gateway/conversa do Bonjour. Defina `OPENCLAW_LIVE_TEST_QUIET=0` se quiser os logs completos de inicialização de volta.
- Rotação de chaves de API (específica do provedor): defina `*_API_KEYS` com formato separado por vírgula/ponto e vírgula ou `*_API_KEY_1`, `*_API_KEY_2` (por exemplo, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou substituição por live via `OPENCLAW_LIVE_*_KEY`; os testes tentam novamente em respostas de limite de taxa.
- Saída de progresso/Heartbeat:
  - Suites live agora emitem linhas de progresso para stderr para que chamadas longas a provedores fiquem visivelmente ativas mesmo quando a captura de console do Vitest estiver silenciosa.
  - `vitest.live.config.ts` desabilita a interceptação de console do Vitest para que linhas de progresso de provedor/Gateway sejam transmitidas imediatamente durante execuções live.
  - Ajuste Heartbeats de modelo direto com `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajuste Heartbeats de Gateway/probe com `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Qual suite devo executar?

Use esta tabela de decisão:

- Editando lógica/testes: execute `pnpm test` (e `pnpm test:coverage` se você mudou muita coisa)
- Tocando networking do Gateway / protocolo WS / pareamento: adicione `pnpm test:e2e`
- Depurando "meu bot está fora do ar" / falhas específicas de provedor / chamada de ferramentas: execute um `pnpm test:live` reduzido

## Testes live (que acessam a rede)

Para a matriz live de modelos, smokes do backend da CLI, smokes de ACP, harness do app-server do Codex e todos os testes live de provedores de mídia (Deepgram, BytePlus, ComfyUI, imagem, música, vídeo, harness de mídia) - além do tratamento de credenciais para execuções live - consulte [Testando suites live](/pt-BR/help/testing-live). Para o checklist dedicado de atualização e validação de Plugin, consulte [Testando atualizações e Plugins](/pt-BR/help/testing-updates-plugins).

## Executores Docker (verificações opcionais de "funciona no Linux")

Estes executores Docker se dividem em dois grupos:

- Executores de modelo live: `test:docker:live-models` e `test:docker:live-gateway` executam somente o arquivo live de profile-key correspondente dentro da imagem Docker do repositório (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando seu diretório de configuração local e workspace (e carregando `~/.profile` se montado). Os entrypoints locais correspondentes são `test:live:models-profiles` e `test:live:gateway-profiles`.
- Executores Docker live usam por padrão um limite de smoke menor para que uma varredura Docker completa continue prática:
  `test:docker:live-models` usa por padrão `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa por padrão `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Substitua essas variáveis de ambiente quando você
  quiser explicitamente a varredura exaustiva maior.
- `test:docker:all` constrói a imagem Docker live uma vez via `test:docker:live-build`, empacota o OpenClaw uma vez como um tarball npm por meio de `scripts/package-openclaw-for-docker.mjs` e então constrói/reutiliza duas imagens `scripts/e2e/Dockerfile`. A imagem básica é apenas o executor Node/Git para lanes de instalação/atualização/dependências de Plugin; essas lanes montam o tarball pré-construído. A imagem funcional instala o mesmo tarball em `/app` para lanes de funcionalidade do app construído. As definições de lanes Docker ficam em `scripts/lib/docker-e2e-scenarios.mjs`; a lógica do planejador fica em `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` executa o plano selecionado. O agregado usa um agendador local ponderado: `OPENCLAW_DOCKER_ALL_PARALLELISM` controla slots de processo, enquanto limites de recursos impedem que lanes live pesadas, de instalação npm e multi-serviço comecem todas de uma vez. Se uma única lane for mais pesada que os limites ativos, o agendador ainda poderá iniciá-la quando o pool estiver vazio e então mantê-la rodando sozinha até que a capacidade esteja disponível novamente. Os padrões são 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ajuste `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` somente quando o host Docker tiver mais folga. O executor faz um preflight do Docker por padrão, remove contêineres E2E obsoletos do OpenClaw, imprime status a cada 30 segundos, armazena temporizações de lanes bem-sucedidas em `.artifacts/docker-tests/lane-timings.json` e usa essas temporizações para iniciar lanes mais longas primeiro em execuções posteriores. Use `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir o manifesto ponderado de lanes sem construir ou executar Docker, ou `node scripts/test-docker-all.mjs --plan-json` para imprimir o plano de CI para lanes selecionadas, necessidades de pacote/imagem e credenciais.
- `Package Acceptance` é o gate de pacote nativo do GitHub para "este tarball instalável funciona como produto?" Ele resolve um pacote candidato a partir de `source=npm`, `source=ref`, `source=url` ou `source=artifact`, envia-o como `package-under-test` e então executa as lanes Docker E2E reutilizáveis contra esse tarball exato em vez de reempacotar a ref selecionada. Os perfis são ordenados por abrangência: `smoke`, `package`, `product` e `full`. Consulte [Testando atualizações e Plugins](/pt-BR/help/testing-updates-plugins) para o contrato de pacote/atualização/Plugin, matriz de sobrevivência de upgrade publicado, padrões de release e triagem de falhas.
- Verificações de build e release executam `scripts/check-cli-bootstrap-imports.mjs` após o tsdown. A proteção percorre o grafo construído estático a partir de `dist/entry.js` e `dist/cli/run-main.js` e falha se a inicialização pré-dispatch importar dependências de pacote como Commander, UI de prompt, undici ou logging antes do dispatch do comando; ela também mantém o chunk empacotado de execução do Gateway dentro do orçamento e rejeita importações estáticas de caminhos conhecidos frios do Gateway. O smoke da CLI empacotada também cobre ajuda raiz, ajuda de onboard, ajuda de doctor, status, schema de configuração e um comando de lista de modelos.
- A compatibilidade legada do Package Acceptance é limitada a `2026.4.25` (`2026.4.25-beta.*` incluído). Até esse limite, o harness tolera apenas lacunas de metadados de pacote já enviado: entradas omitidas de inventário privado de QA, `gateway install --wrapper` ausente, arquivos de patch ausentes na fixture git derivada do tarball, `update.channel` persistido ausente, locais legados de registro de instalação de Plugin, persistência ausente de registro de instalação do marketplace e migração de metadados de configuração durante `plugins update`. Para pacotes após `2026.4.25`, esses caminhos são falhas estritas.
- Executores de smoke em contêiner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` e `test:docker:config-reload` inicializam um ou mais contêineres reais e verificam caminhos de integração de nível mais alto.

Os executores Docker de modelo live também fazem bind mount apenas das homes de autenticação da CLI necessárias (ou todas as compatíveis quando a execução não está reduzida) e então as copiam para a home do contêiner antes da execução para que OAuth de CLI externa possa atualizar tokens sem modificar o armazenamento de autenticação do host:

- Modelos diretos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke de vinculação ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; cobre Claude, Codex e Gemini por padrão, com cobertura estrita de Droid/OpenCode via `pnpm test:docker:live-acp-bind:droid` e `pnpm test:docker:live-acp-bind:opencode`)
- Smoke de backend da CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke do harness app-server do Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente de desenvolvimento: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke de observabilidade: `pnpm qa:otel:smoke` é uma trilha privada de QA com checkout do código-fonte. Ela intencionalmente não faz parte das trilhas de lançamento Docker do pacote porque o tarball npm omite o QA Lab.
- Smoke live do Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Assistente de onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke de onboarding/canal/agente do tarball npm: `pnpm test:docker:npm-onboard-channel-agent` instala o tarball OpenClaw empacotado globalmente no Docker, configura o OpenAI via onboarding com referência de env mais Telegram por padrão, executa o doctor e executa uma interação de agente OpenAI simulada. Reutilize um tarball pré-compilado com `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignore a recompilação no host com `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ou troque o canal com `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` ou `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- Smoke de instalação de Skills: `pnpm test:docker:skill-install` instala o tarball OpenClaw empacotado globalmente no Docker, desabilita instalações de arquivos enviados na configuração, resolve o slug da Skill live atual do ClawHub a partir da busca, instala-a com `openclaw skills install` e verifica a Skill instalada mais metadados de origem/bloqueio de `.clawhub`.
- Smoke de troca de canal de atualização: `pnpm test:docker:update-channel-switch` instala o tarball OpenClaw empacotado globalmente no Docker, troca do pacote `stable` para git `dev`, verifica o canal persistido e o funcionamento de Plugin pós-atualização, depois volta para o pacote `stable` e verifica o status de atualização.
- Smoke de sobrevivência a upgrade: `pnpm test:docker:upgrade-survivor` instala o tarball OpenClaw empacotado sobre uma fixture suja de usuário antigo com agentes, configuração de canal, allowlists de plugins, estado obsoleto de dependências de plugins e arquivos existentes de workspace/sessão. Ele executa a atualização do pacote mais o doctor não interativo sem provedor live nem chaves de canal, depois inicia um Gateway de loopback e verifica preservação de configuração/estado mais orçamentos de inicialização/status.
- Smoke de sobrevivência a upgrade publicado: `pnpm test:docker:published-upgrade-survivor` instala `openclaw@latest` por padrão, semeia arquivos realistas de usuário existente, configura essa baseline com uma receita de comando incorporada, valida a configuração resultante, atualiza essa instalação publicada para o tarball candidato, executa o doctor não interativo, grava `.artifacts/upgrade-survivor/summary.json`, depois inicia um Gateway de loopback e verifica intenções configuradas, preservação de estado, inicialização, `/healthz`, `/readyz` e orçamentos de status RPC. Sobrescreva uma baseline com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, peça ao agendador agregado para expandir baselines locais exatas com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, como `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, e expanda fixtures no formato de issues com `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, como `reported-issues`; o conjunto reported-issues inclui `configured-plugin-installs` para reparo automático de instalação de Plugin OpenClaw externo. A Aceitação de Pacote expõe isso como `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` e `published_upgrade_survivor_scenarios`, resolve tokens de baseline meta como `last-stable-4` ou `all-since-2026.4.23`, e a Validação de Lançamento Completa expande o gate de soak de pacote de lançamento para `last-stable-4 2026.4.23 2026.5.2 2026.4.15` mais `reported-issues`.
- Smoke de contexto de runtime da sessão: `pnpm test:docker:session-runtime-context` verifica a persistência oculta do transcript de contexto de runtime mais o reparo pelo doctor de ramificações afetadas duplicadas de reescrita de prompt.
- Smoke de instalação global do Bun: `bash scripts/e2e/bun-global-install-smoke.sh` empacota a árvore atual, instala-a com `bun install -g` em uma home isolada e verifica se `openclaw infer image providers --json` retorna provedores de imagem incluídos em vez de travar. Reutilize um tarball pré-compilado com `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignore a compilação no host com `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ou copie `dist/` de uma imagem Docker compilada com `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker do instalador: `bash scripts/test-install-sh-docker.sh` compartilha um cache npm entre seus contêineres root, update e direct-npm. O smoke de atualização usa por padrão o npm `latest` como baseline estável antes de atualizar para o tarball candidato. Sobrescreva com `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` localmente ou com a entrada `update_baseline_version` do workflow Install Smoke no GitHub. As verificações do instalador não root mantêm um cache npm isolado para que entradas de cache pertencentes ao root não mascarem o comportamento de instalação local do usuário. Defina `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` para reutilizar o cache root/update/direct-npm em reexecuções locais.
- O CI Install Smoke ignora a atualização global direct-npm duplicada com `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; execute o script localmente sem essa env quando for necessária cobertura direta de `npm install -g`.
- Smoke de CLI para exclusão de workspace compartilhado por agentes: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) compila a imagem do Dockerfile raiz por padrão, semeia dois agentes com um workspace em uma home de contêiner isolada, executa `agents delete --json` e verifica JSON válido mais comportamento de workspace retido. Reutilize a imagem install-smoke com `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Rede do Gateway (dois contêineres, autenticação WS + saúde): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Smoke de snapshot CDP do navegador: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) compila a imagem E2E de código-fonte mais uma camada Chromium, inicia o Chromium com CDP bruto, executa `browser doctor --deep` e verifica se os snapshots de função CDP cobrem URLs de links, clicáveis promovidos por cursor, refs de iframe e metadados de frame.
- Regressão de raciocínio mínimo de web_search do OpenAI Responses: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) executa um servidor OpenAI simulado pelo Gateway, verifica se `web_search` eleva `reasoning.effort` de `minimal` para `low`, depois força a rejeição do esquema do provedor e verifica se o detalhe bruto aparece nos logs do Gateway.
- Ponte de canal MCP (Gateway semeado + ponte stdio + smoke de frame de notificação bruta do Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Ferramentas MCP do pacote Pi (servidor MCP stdio real + smoke de permissão/negação do perfil Pi incorporado): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Limpeza MCP de Cron/subagente (Gateway real + encerramento de filho MCP stdio após execuções isoladas de cron e subagente one-shot): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke de instalação/atualização para caminho local, `file:`, registro npm com dependências hoisted, refs móveis de git, ClawHub kitchen-sink, atualizações de marketplace e habilitação/inspeção de pacote Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Defina `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para ignorar o bloco ClawHub ou sobrescreva o par padrão de pacote/runtime kitchen-sink com `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` e `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sem `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, o teste usa um servidor de fixture ClawHub local hermético.
- Smoke de atualização inalterada de Plugin: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke de matriz de ciclo de vida de Plugin: `pnpm test:docker:plugin-lifecycle-matrix` instala o tarball OpenClaw empacotado em um contêiner vazio, instala um Plugin npm, alterna habilitar/desabilitar, faz upgrade e downgrade dele por meio de um registro npm local, exclui o código instalado e então verifica se a desinstalação ainda remove estado obsoleto enquanto registra métricas RSS/CPU para cada fase do ciclo de vida.
- Smoke de metadados de recarregamento de configuração: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` cobre smoke de instalação/atualização para caminho local, `file:`, registro npm com dependências hoisted, refs móveis de git, fixtures ClawHub, atualizações de marketplace e habilitação/inspeção de pacote Claude. `pnpm test:docker:plugin-update` cobre o comportamento de atualização inalterada para plugins instalados. `pnpm test:docker:plugin-lifecycle-matrix` cobre instalação, habilitação, desabilitação, upgrade, downgrade e desinstalação com código ausente de Plugin npm com recursos rastreados.

Para pré-compilar e reutilizar manualmente a imagem funcional compartilhada:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Sobrescritas de imagem específicas de suíte, como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, ainda têm precedência quando definidas. Quando `OPENCLAW_SKIP_DOCKER_BUILD=1` aponta para uma imagem remota compartilhada, os scripts a baixam se ela ainda não estiver local. Os testes Docker de QR e instalador mantêm seus próprios Dockerfiles porque validam comportamento de pacote/instalação em vez do runtime de aplicativo compilado compartilhado.

Os executores Docker de modelos ao vivo também montam o checkout atual como somente leitura e
o preparam em um diretório de trabalho temporário dentro do contêiner. Isso mantém a imagem
de runtime enxuta, enquanto ainda executa o Vitest contra sua fonte/configuração local exata.
A etapa de preparação ignora caches grandes apenas locais e saídas de build de apps, como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e diretórios `.build` locais de app ou
diretórios de saída do Gradle, para que execuções ao vivo no Docker não passem minutos copiando
artefatos específicos da máquina.
Eles também definem `OPENCLAW_SKIP_CHANNELS=1` para que as sondagens ao vivo do gateway não iniciem
workers de canal reais do Telegram/Discord/etc. dentro do contêiner.
`test:docker:live-models` ainda executa `pnpm test:live`, portanto também repasse
`OPENCLAW_LIVE_GATEWAY_*` quando você precisar restringir ou excluir a cobertura ao vivo do gateway
dessa faixa do Docker.
`test:docker:openwebui` é um smoke de compatibilidade de nível mais alto: ele inicia um
contêiner do Gateway OpenClaw com os endpoints HTTP compatíveis com OpenAI ativados,
inicia um contêiner fixado do Open WebUI contra esse gateway, faz login pelo
Open WebUI, verifica se `/api/models` expõe `openclaw/default` e então envia uma
solicitação de chat real pelo proxy `/api/chat/completions` do Open WebUI.
Defina `OPENWEBUI_SMOKE_MODE=models` para verificações de CI do caminho de release que devem parar
após o login no Open WebUI e a descoberta de modelos, sem aguardar uma conclusão de modelo ao vivo.
A primeira execução pode ser perceptivelmente mais lenta porque o Docker pode precisar baixar a
imagem do Open WebUI e o Open WebUI pode precisar concluir sua própria configuração de inicialização a frio.
Essa faixa espera uma chave de modelo ao vivo utilizável, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` por padrão) é a principal forma de fornecê-la em execuções Dockerizadas.
Execuções bem-sucedidas imprimem um pequeno payload JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` é intencionalmente determinístico e não precisa de uma
conta real do Telegram, Discord ou iMessage. Ele inicializa um contêiner Gateway
semeado, inicia um segundo contêiner que executa `openclaw mcp serve` e então
verifica descoberta de conversas roteadas, leituras de transcrição, metadados de anexo,
comportamento da fila de eventos ao vivo, roteamento de envio de saída e notificações
de canal + permissão no estilo Claude pela ponte stdio MCP real. A verificação de notificação
inspeciona diretamente os frames stdio MCP brutos, de modo que o smoke valida o que a
ponte realmente emite, não apenas o que um SDK de cliente específico por acaso expõe.
`test:docker:pi-bundle-mcp-tools` é determinístico e não precisa de uma chave de modelo ao vivo.
Ele cria a imagem Docker do repositório, inicia um servidor de sondagem stdio MCP real
dentro do contêiner, materializa esse servidor pelo runtime MCP do pacote Pi incorporado,
executa a ferramenta e então verifica se `coding` e `messaging` mantêm
ferramentas `bundle-mcp`, enquanto `minimal` e `tools.deny: ["bundle-mcp"]` as filtram.
`test:docker:cron-mcp-cleanup` é determinístico e não precisa de uma chave de modelo ao vivo.
Ele inicia um Gateway semeado com um servidor de sondagem stdio MCP real, executa um
turno Cron isolado e um turno filho avulso `/subagents spawn`, e então verifica
se o processo filho MCP sai após cada execução.

Smoke manual de thread ACP em linguagem simples (não CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantenha este script para fluxos de regressão/debug. Ele pode ser necessário novamente para validação de roteamento de thread ACP, portanto não o exclua.

Variáveis de ambiente úteis:

- `OPENCLAW_CONFIG_DIR=...` (padrão: `~/.openclaw`) montado em `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (padrão: `~/.openclaw/workspace`) montado em `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (padrão: `~/.profile`) montado em `/home/node/.profile` e carregado antes de executar testes
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar apenas variáveis de ambiente carregadas de `OPENCLAW_PROFILE_FILE`, usando diretórios temporários de configuração/workspace e sem montagens externas de autenticação da CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (padrão: `~/.cache/openclaw/docker-cli-tools`) montado em `/home/node/.npm-global` para instalações de CLI em cache dentro do Docker
- Diretórios/arquivos externos de autenticação de CLI em `$HOME` são montados como somente leitura em `/host-auth...` e então copiados para `/home/node/...` antes do início dos testes
  - Diretórios padrão: `.minimax`
  - Arquivos padrão: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Execuções restringidas por provedor montam apenas os diretórios/arquivos necessários inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Sobrescreva manualmente com `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` ou uma lista separada por vírgulas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para restringir a execução
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar provedores dentro do contêiner
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar uma imagem `openclaw:local-live` existente em reexecuções que não precisam de rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para garantir que as credenciais venham do armazenamento de perfis (não do ambiente)
- `OPENCLAW_OPENWEBUI_MODEL=...` para escolher o modelo exposto pelo gateway para o smoke do Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para substituir o prompt de verificação de nonce usado pelo smoke do Open WebUI
- `OPENWEBUI_IMAGE=...` para substituir a tag fixada da imagem do Open WebUI

## Sanidade da documentação

Execute verificações da documentação após edições de docs: `pnpm check:docs`.
Execute a validação completa de âncoras do Mintlify quando também precisar de verificações de títulos na página: `pnpm docs:check-links:anchors`.

## Regressão offline (segura para CI)

Estas são regressões de "pipeline real" sem provedores reais:

- Chamada de ferramenta do Gateway (OpenAI mockado, gateway real + loop de agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistente de configuração do Gateway (WS `wizard.start`/`wizard.next`, grava configuração + autenticação aplicada): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Avaliações de confiabilidade do agente (skills)

Já temos alguns testes seguros para CI que se comportam como "avaliações de confiabilidade do agente":

- Chamada de ferramenta mockada pelo Gateway real + loop de agente (`src/gateway/gateway.test.ts`).
- Fluxos de assistente de configuração ponta a ponta que validam a ligação de sessão e efeitos de configuração (`src/gateway/gateway.test.ts`).

O que ainda falta para Skills (consulte [Skills](/pt-BR/tools/skills)):

- **Decisão:** quando Skills são listadas no prompt, o agente escolhe a skill certa (ou evita as irrelevantes)?
- **Conformidade:** o agente lê `SKILL.md` antes do uso e segue as etapas/argumentos exigidos?
- **Contratos de workflow:** cenários multi-turno que verificam ordem de ferramentas, preservação do histórico da sessão e limites do sandbox.

Avaliações futuras devem permanecer determinísticas primeiro:

- Um executor de cenários usando provedores mockados para verificar chamadas de ferramenta + ordem, leituras de arquivos de skill e ligação de sessão.
- Uma pequena suíte de cenários focados em skill (usar vs evitar, bloqueios, injeção de prompt).
- Avaliações ao vivo opcionais (opt-in, controladas por env) apenas depois que a suíte segura para CI estiver pronta.

## Testes de contrato (formato de plugin e canal)

Testes de contrato verificam se cada plugin e canal registrado está em conformidade com seu
contrato de interface. Eles iteram sobre todos os plugins descobertos e executam uma suíte de
asserções de formato e comportamento. A faixa unitária padrão de `pnpm test` intencionalmente
ignora esses arquivos compartilhados de integração e smoke; execute os comandos de contrato explicitamente
quando tocar superfícies compartilhadas de canal ou provedor.

### Comandos

- Todos os contratos: `pnpm test:contracts`
- Apenas contratos de canal: `pnpm test:contracts:channels`
- Apenas contratos de provedor: `pnpm test:contracts:plugins`

### Contratos de canal

Localizados em `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Formato básico do plugin (id, nome, capacidades)
- **setup** - Contrato do assistente de configuração
- **session-binding** - Comportamento de vinculação de sessão
- **outbound-payload** - Estrutura do payload de mensagem
- **inbound** - Tratamento de mensagens de entrada
- **actions** - Handlers de ação de canal
- **threading** - Tratamento de ID de thread
- **directory** - API de diretório/lista
- **group-policy** - Aplicação de política de grupo

### Contratos de status de provedor

Localizados em `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondagens de status de canal
- **registry** - Formato do registro de plugins

### Contratos de provedor

Localizados em `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato do fluxo de autenticação
- **auth-choice** - Escolha/seleção de autenticação
- **catalog** - API de catálogo de modelos
- **discovery** - Descoberta de plugins
- **loader** - Carregamento de plugins
- **runtime** - Runtime do provedor
- **shape** - Formato/interface do plugin
- **wizard** - Assistente de configuração

### Quando executar

- Após alterar exports ou subcaminhos do plugin-sdk
- Após adicionar ou modificar um plugin de canal ou provedor
- Após refatorar registro ou descoberta de plugins

Testes de contrato rodam em CI e não exigem chaves de API reais.

## Como adicionar regressões (orientação)

Quando você corrigir um problema de provedor/modelo descoberto ao vivo:

- Adicione uma regressão segura para CI se possível (provedor mock/stub, ou capture a transformação exata do formato da requisição)
- Se for inerentemente apenas ao vivo (limites de taxa, políticas de autenticação), mantenha o teste ao vivo restrito e opt-in por variáveis de ambiente
- Prefira direcionar à menor camada que captura o bug:
  - bug de conversão/reprodução de requisição do provedor → teste direto de modelos
  - bug de sessão/histórico/pipeline de ferramentas do gateway → smoke ao vivo do gateway ou teste mockado de gateway seguro para CI
- Proteção de travessia SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva um alvo amostrado por classe SecretRef a partir dos metadados do registro (`listSecretTargetRegistryEntries()`) e então afirma que ids de execução com segmentos de travessia são rejeitados.
  - Se você adicionar uma nova família de alvos SecretRef `includeInPlan` em `src/secrets/target-registry-data.ts`, atualize `classifyTargetClass` nesse teste. O teste falha intencionalmente em ids de alvo não classificados para que novas classes não possam ser ignoradas silenciosamente.

## Relacionado

- [Teste ao vivo](/pt-BR/help/testing-live)
- [Teste de atualizações e plugins](/pt-BR/help/testing-updates-plugins)
- [CI](/pt-BR/ci)
