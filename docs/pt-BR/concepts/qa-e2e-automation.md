---
read_when:
    - Entendendo como a pilha de QA se integra
    - Estendendo qa-lab, qa-channel ou um adaptador de transporte
    - Adicionando cenários de QA baseados em repositório
    - Criando uma automação de controle de qualidade mais realista para o painel do Gateway
summary: 'Visão geral da pilha de QA: qa-lab, qa-channel, cenários respaldados pelo repositório, faixas de transporte ao vivo, adaptadores de transporte e relatórios.'
title: Visão geral de QA
x-i18n:
    generated_at: "2026-05-07T13:15:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9b767fff432112ff20cae738e40da45cdbf00a2431cb17c025e098b97eafa3e8
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

A stack privado de QA foi criado para exercitar o OpenClaw de uma forma mais realista,
com formato de canal, do que um único teste unitário consegue.

Componentes atuais:

- `extensions/qa-channel`: canal de mensagens sintético com superfícies de DM, canal, thread,
  reação, edição e exclusão.
- `extensions/qa-lab`: UI de depuração e barramento de QA para observar a transcrição,
  injetar mensagens de entrada e exportar um relatório em Markdown.
- `extensions/qa-matrix`, futuros plugins executores: adaptadores de transporte ao vivo que
  conduzem um canal real dentro de um Gateway de QA filho.
- `qa/`: ativos de seed apoiados pelo repositório para a tarefa inicial e cenários
  básicos de QA.
- [Mantis](/pt-BR/concepts/mantis): verificação ao vivo antes e depois para bugs que
  precisam de transportes reais, capturas de tela do navegador, estado de VM e evidências de PR.

## Superfície de comandos

Todo fluxo de QA roda sob `pnpm openclaw qa <subcommand>`. Muitos têm aliases de script `pnpm qa:*`;
as duas formas são compatíveis.

| Comando                                             | Finalidade                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Autoverificação de QA incluída; grava um relatório em Markdown.                                                                                                                                                                                                                        |
| `qa suite`                                          | Executa cenários apoiados pelo repositório contra a lane do Gateway de QA. Aliases: `pnpm openclaw qa suite --runner multipass` para uma VM Linux descartável.                                                                                                                                  |
| `qa coverage`                                       | Imprime o inventário de cobertura de cenários em markdown (`--json` para saída de máquina).                                                                                                                                                                                           |
| `qa parity-report`                                  | Compara dois arquivos `qa-suite-summary.json` e grava o relatório de paridade agêntico.                                                                                                                                                                                          |
| `qa character-eval`                                 | Executa o cenário de QA de personagem em vários modelos ao vivo com um relatório julgado. Consulte [Relatórios](#reporting).                                                                                                                                                            |
| `qa manual`                                         | Executa um prompt avulso contra a lane do provedor/modelo selecionado.                                                                                                                                                                                                          |
| `qa ui`                                             | Inicia a UI do depurador de QA e o barramento local de QA (alias: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | Compila a imagem Docker de QA pré-preparada.                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | Grava um scaffold docker-compose para o painel de QA + lane do Gateway.                                                                                                                                                                                                    |
| `qa up`                                             | Compila o site de QA, inicia a stack apoiada por Docker, imprime a URL (alias: `pnpm qa:lab:up`; a variante `:fast` adiciona `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                  |
| `qa aimock`                                         | Inicia apenas o servidor do provedor AIMock.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | Inicia apenas o servidor do provedor `mock-openai` ciente de cenários.                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | Gerencia o pool compartilhado de credenciais Convex.                                                                                                                                                                                                                               |
| `qa matrix`                                         | Lane de transporte ao vivo contra um homeserver Tuwunel descartável. Consulte [QA Matrix](/pt-BR/concepts/qa-matrix).                                                                                                                                                                      |
| `qa telegram`                                       | Lane de transporte ao vivo contra um grupo privado real do Telegram.                                                                                                                                                                                                              |
| `qa discord`                                        | Lane de transporte ao vivo contra um canal real de guild privado do Discord.                                                                                                                                                                                                       |
| `qa slack`                                          | Lane de transporte ao vivo contra um canal privado real do Slack.                                                                                                                                                                                                               |
| `qa mantis`                                         | Executor de verificação antes e depois para bugs de transporte ao vivo, com evidências de reações de status do Discord, smoke de desktop/navegador no Crabbox e smoke do Slack em VNC. Consulte [Mantis](/pt-BR/concepts/mantis) e [Runbook do Mantis Slack Desktop](/pt-BR/concepts/mantis-slack-desktop-runbook). |

## Fluxo do operador

O fluxo atual do operador de QA é um site de QA com dois painéis:

- Esquerda: painel do Gateway (Control UI) com o agente.
- Direita: QA Lab, mostrando a transcrição no estilo Slack e o plano do cenário.

Execute com:

```bash
pnpm qa:lab:up
```

Isso compila o site de QA, inicia a lane do Gateway apoiada por Docker e expõe a
página do QA Lab, onde um operador ou loop de automação pode dar ao agente uma
missão de QA, observar o comportamento real do canal e registrar o que funcionou, falhou ou
permaneceu bloqueado.

Para iteração mais rápida da UI do QA Lab sem reconstruir a imagem Docker a cada vez,
inicie a stack com um bundle do QA Lab montado por bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantém os serviços Docker em uma imagem pré-compilada e monta por bind
`extensions/qa-lab/web/dist` no contêiner `qa-lab`. `qa:lab:watch`
recompila esse bundle quando houver alterações, e o navegador recarrega automaticamente quando o hash de ativos do QA Lab
muda.

Para um smoke local de rastreamento OpenTelemetry, execute:

```bash
pnpm qa:otel:smoke
```

Esse script inicia um receptor local de rastreamentos OTLP/HTTP, executa o
cenário de QA `otel-trace-smoke` com o Plugin `diagnostics-otel` habilitado, então
decodifica os spans protobuf exportados e valida o formato crítico para release:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` e `openclaw.message.delivery` devem estar presentes;
chamadas de modelo não devem exportar `StreamAbandoned` em turnos bem-sucedidos; IDs diagnósticos brutos e
atributos `openclaw.content.*` devem ficar fora do rastreamento. Ele grava
`otel-smoke-summary.json` ao lado dos artefatos da suíte de QA.

O QA de observabilidade permanece apenas para checkout de código-fonte. O tarball npm omite intencionalmente o
QA Lab, então lanes de release Docker de pacote não executam comandos `qa`. Use
`pnpm qa:otel:smoke` a partir de um checkout de código-fonte compilado ao alterar a instrumentação
de diagnósticos.

Para uma lane de smoke Matrix com transporte real, execute:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

A referência completa da CLI, o catálogo de perfis/cenários, variáveis de ambiente e layout de artefatos desta lane ficam em [QA Matrix](/pt-BR/concepts/qa-matrix). Em resumo: ela provisiona um homeserver Tuwunel descartável no Docker, registra usuários temporários driver/SUT/observador, executa o Plugin Matrix real dentro de um Gateway de QA filho escopado para esse transporte (sem `qa-channel`), então grava um relatório em Markdown, resumo JSON, artefato de eventos observados e log de saída combinado em `.artifacts/qa-e2e/matrix-<timestamp>/`.

Os cenários cobrem comportamento de transporte que testes unitários não conseguem provar de ponta a ponta: gating de menções, políticas allow-bot, allowlists, respostas de nível superior e em threads, roteamento de DM, tratamento de reações, supressão de edição de entrada, dedupe de replay após reinício, recuperação de interrupção do homeserver, entrega de metadados de aprovação, tratamento de mídia e fluxos de bootstrap/recuperação/verificação de E2EE do Matrix. O perfil CLI de E2EE também conduz `openclaw matrix encryption setup` e comandos de verificação pelo mesmo homeserver descartável antes de verificar as respostas do Gateway.

O Discord também tem cenários opcionais somente do Mantis para reprodução de bugs. Use
`--scenario discord-status-reactions-tool-only` para a timeline explícita de reação de status,
ou `--scenario discord-thread-reply-filepath-attachment` para criar uma
thread real do Discord e verificar que `message.thread-reply` preserva um anexo
`filePath`. Esses cenários ficam fora da lane padrão ao vivo do Discord
porque são sondas de reprodução antes/depois, e não cobertura ampla de smoke.
O workflow Mantis de anexo em thread também pode adicionar um vídeo testemunha do Discord Web
com login quando `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` ou
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` estiver configurado no ambiente de QA.
Esse perfil de visualizador serve apenas para captura visual; a decisão de aprovado/reprovado
ainda vem do oráculo REST do Discord.

A CI usa a mesma superfície de comandos em `.github/workflows/qa-live-transports-convex.yml`. Execuções agendadas e manuais padrão executam o perfil Matrix rápido com credenciais frontier ao vivo, `--fast` e `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. O `matrix_profile=all` manual se divide nos cinco shards de perfil para que o catálogo exaustivo rode em paralelo, mantendo um diretório de artefatos por shard.

Para lanes de smoke com transporte real do Telegram, Discord e Slack:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Elas têm como alvo um canal real preexistente com dois bots (driver + SUT). Variáveis de ambiente obrigatórias, listas de cenários, artefatos de saída e o pool de credenciais Convex estão documentados na [referência de QA do Telegram, Discord e Slack](#telegram-discord-and-slack-qa-reference) abaixo.

Para uma execução completa de VM de desktop Slack com resgate por VNC, execute:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Esse comando aluga uma máquina desktop/navegador do Crabbox, executa a lane ao vivo do Slack
dentro da VM, abre o Slack Web no navegador VNC, captura o desktop e
copia `slack-qa/`, `slack-desktop-smoke.png` e `slack-desktop-smoke.mp4`,
quando a captura de vídeo está disponível, de volta para o diretório de artefatos do Mantis. Os leases
desktop/navegador do Crabbox fornecem previamente as ferramentas de captura e os pacotes auxiliares
de navegador/build nativo, portanto o cenário deve instalar fallbacks apenas em
leases mais antigos. O Mantis informa os tempos totais e por fase em
`mantis-slack-desktop-smoke-report.md`, para que execuções lentas mostrem se o tempo foi gasto em
aquecimento do lease, obtenção de credenciais, configuração remota ou cópia de artefatos. Reutilize
`--lease-id <cbx_...>` depois de fazer login manualmente no Slack Web pelo VNC;
leases reutilizados também mantêm o cache da loja pnpm do Crabbox aquecido. O padrão
`--hydrate-mode source` verifica a partir de um checkout de código-fonte e executa install/build
dentro da VM. Use `--hydrate-mode prehydrated` apenas quando o workspace remoto reutilizado
já tiver `node_modules` e um `dist/` construído; esse modo ignora a
etapa cara de install/build e falha de forma fechada quando o workspace não está pronto.
Com `--gateway-setup`, o Mantis deixa um Gateway OpenClaw Slack persistente
em execução dentro da VM na porta `38973`; sem isso, o comando executa a lane normal
de QA Slack bot-para-bot e sai após a captura dos artefatos.

A checklist do operador, o comando de dispatch do workflow do GitHub, o contrato de comentário de evidência,
a tabela de decisão de modo de hidratação, a interpretação de tempos e as etapas de tratamento
de falhas ficam em [Runbook de Desktop Slack do Mantis](/pt-BR/concepts/mantis-slack-desktop-runbook).

Para uma tarefa de desktop em estilo agente/CV, execute:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` aluga ou reutiliza uma máquina desktop/navegador do Crabbox, inicia
`crabbox record --while`, controla o navegador visível por meio de um
`visual-driver` aninhado, captura `visual-task.png`, executa `openclaw infer image describe`
contra a captura de tela quando `--vision-mode image-describe` está selecionado e
grava `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` e `mantis-visual-task-report.md`.
Quando `--expect-text` está definido, o prompt de visão pede um veredito JSON
estruturado e só passa quando o modelo informa evidência visível positiva; uma
resposta negativa que apenas cita o texto-alvo falha na asserção.
Use `--vision-mode metadata` para um smoke sem modelo que prova o encanamento de desktop,
navegador, captura de tela e vídeo sem chamar um provedor de entendimento de imagem.
A gravação é um artefato obrigatório para `visual-task`; se o Crabbox não gravar
um `visual-task.mp4` não vazio, a tarefa falha mesmo quando o driver visual
passou. Em caso de falha, o Mantis mantém o lease para VNC, a menos que a tarefa já
tenha passado e `--keep-lease` não tenha sido definido.

Antes de usar credenciais ao vivo em pool, execute:

```bash
pnpm openclaw qa credentials doctor
```

O doctor verifica o env do broker Convex, valida configurações de endpoint e verifica a acessibilidade de admin/list quando o segredo do mantenedor está presente. Ele informa apenas o status definido/ausente para segredos.

## Cobertura de transporte ao vivo

As lanes de transporte ao vivo compartilham um contrato em vez de cada uma inventar seu próprio formato de lista de cenários. `qa-channel` é a suíte ampla de comportamento de produto sintético e não faz parte da matriz de cobertura de transporte ao vivo.

| Lane     | Canário | Controle por menção | Bot para bot | Bloqueio por lista de permissões | Resposta de nível superior | Retomada após reinicialização | Acompanhamento em thread | Isolamento de thread | Observação de reação | Comando de ajuda | Registro de comando nativo |
| -------- | ------- | ------------------- | ------------ | -------------------------------- | -------------------------- | ----------------------------- | ------------------------ | -------------------- | -------------------- | ---------------- | -------------------------- |
| Matrix   | x       | x                   | x            | x                                | x                          | x                             | x                        | x                    | x                    |                  |                            |
| Telegram | x       | x                   | x            |                                  |                            |                               |                          |                      |                      | x                |                            |
| Discord  | x       | x                   | x            |                                  |                            |                               |                          |                      |                      |                  | x                          |
| Slack    | x       | x                   | x            | x                                | x                          | x                             | x                        | x                    |                      |                  |                            |

Isso mantém `qa-channel` como a suíte ampla de comportamento de produto, enquanto Matrix,
Telegram e futuros transportes ao vivo compartilham uma checklist explícita de contrato
de transporte.

Para uma lane de VM Linux descartável sem trazer Docker para o caminho de QA, execute:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Isso inicializa um convidado Multipass novo, instala dependências, constrói o OpenClaw
dentro do convidado, executa `qa suite` e então copia o relatório e o
resumo normais de QA de volta para `.artifacts/qa-e2e/...` no host.
Ele reutiliza o mesmo comportamento de seleção de cenários que `qa suite` no host.
Execuções da suíte no host e no Multipass executam vários cenários selecionados em paralelo
com workers de Gateway isolados por padrão. `qa-channel` usa concorrência
4 por padrão, limitada pela contagem de cenários selecionados. Use `--concurrency <count>` para ajustar
a contagem de workers ou `--concurrency 1` para execução serial.
O comando sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando
quiser artefatos sem um código de saída de falha.
Execuções ao vivo encaminham as entradas de autenticação de QA compatíveis que são práticas para o
convidado: chaves de provedor baseadas em env, o caminho da configuração do provedor ao vivo de QA e
`CODEX_HOME` quando presente. Mantenha `--output-dir` sob a raiz do repositório para que o convidado
possa gravar de volta pelo workspace montado.

## Referência de QA do Telegram, Discord e Slack

Matrix tem uma [página dedicada](/pt-BR/concepts/qa-matrix) por causa de sua contagem de cenários e do provisionamento de homeserver apoiado por Docker. Telegram, Discord e Slack são menores - alguns cenários cada, sem sistema de perfis, contra canais reais preexistentes - portanto sua referência fica aqui.

### Flags de CLI compartilhadas

Estas lanes são registradas por meio de `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` e aceitam as mesmas flags:

| Flag                                  | Padrão                                                         | Descrição                                                                                                             |
| ------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                              | Execute apenas este cenário. Repetível.                                                                              |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Onde relatórios/resumo/mensagens observadas e o log de saída são gravados. Caminhos relativos são resolvidos em relação a `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                | Raiz do repositório ao invocar a partir de um cwd neutro.                                                            |
| `--sut-account <id>`                  | `sut`                                                          | ID de conta temporária dentro da configuração do Gateway de QA.                                                       |
| `--provider-mode <mode>`              | `live-frontier`                                                | `mock-openai` ou `live-frontier` (`live-openai` legado ainda funciona).                                              |
| `--model <ref>` / `--alt-model <ref>` | padrão do provedor                                             | Refs de modelo primário/alternativo.                                                                                 |
| `--fast`                              | desativado                                                     | Modo rápido do provedor quando compatível.                                                                           |
| `--credential-source <env\|convex>`   | `env`                                                          | Consulte [pool de credenciais Convex](#convex-credential-pool).                                                      |
| `--credential-role <maintainer\|ci>`  | `ci` no CI, `maintainer` caso contrário                         | Papel usado quando `--credential-source convex`.                                                                     |

Cada lane sai com código diferente de zero em qualquer cenário com falha. `--allow-failures` grava artefatos sem definir um código de saída de falha.

### QA do Telegram

```bash
pnpm openclaw qa telegram
```

Mira um grupo privado real do Telegram com dois bots distintos (driver + SUT). O bot SUT deve ter um nome de usuário do Telegram; a observação bot-para-bot funciona melhor quando ambos os bots têm **Bot-to-Bot Communication Mode** habilitado em `@BotFather`.

Env obrigatório quando `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - ID numérico do chat (string).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Opcional:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` mantém os corpos das mensagens nos artefatos de mensagens observadas (o padrão redige).

Cenários (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

Artefatos de saída:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` - inclui RTT por resposta (envio do driver → resposta observada do SUT) começando pelo canário.
- `telegram-qa-observed-messages.json` - corpos redigidos, a menos que `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA do Discord

```bash
pnpm openclaw qa discord
```

Mira um canal real de guild privado do Discord com dois bots: um bot driver controlado pelo harness e um bot SUT iniciado pelo Gateway OpenClaw filho por meio do Plugin Discord incluído. Verifica o tratamento de menções no canal, que o bot SUT registrou o comando nativo `/help` com o Discord, e cenários de evidência Mantis opcionais.

Env obrigatório quando `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - deve corresponder ao ID de usuário do bot SUT retornado pelo Discord (caso contrário, a lane falha rapidamente).

Opcional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` mantém os corpos das mensagens em artefatos de mensagens observadas.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` seleciona o canal de voz/palco para `discord-voice-autojoin`; sem isso, o cenário escolhe o primeiro canal de voz/palco visível para o bot SUT.

Cenários (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - cenário de voz de ativação opcional. É executado sozinho, habilita `channels.discord.voice.autoJoin` e verifica se o estado de voz atual no Discord do bot SUT é o canal de voz/palco de destino. As credenciais do Convex para Discord podem incluir `voiceChannelId` opcional; caso contrário, o executor descobre o primeiro canal de voz/palco visível na guilda.
- `discord-status-reactions-tool-only` - cenário Mantis de ativação opcional. É executado sozinho porque alterna o SUT para respostas de guilda sempre ativas e somente por ferramenta com `messages.statusReactions.enabled=true`, depois captura uma linha do tempo de reações REST e artefatos visuais HTML/PNG. Os relatórios Mantis antes/depois também preservam artefatos MP4 fornecidos pelo cenário como `baseline.mp4` e `candidate.mp4`.

Execute explicitamente o cenário de entrada automática em voz no Discord:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Execute explicitamente o cenário de reação de status do Mantis:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

Artefatos de saída:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` - corpos redigidos, a menos que `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` e `discord-status-reactions-tool-only-timeline.png` quando o cenário de reação de status é executado.

### QA do Slack

```bash
pnpm openclaw qa slack
```

Mira um canal privado real do Slack com dois bots distintos: um bot condutor controlado pelo harness e um bot SUT iniciado pelo Gateway filho do OpenClaw por meio do Plugin Slack incluído.

Env obrigatórias quando `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Opcional:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` mantém os corpos das mensagens nos artefatos de mensagens observadas.

Cenários (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`

Artefatos de saída:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` - corpos redigidos, a menos que `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### Configurando o workspace do Slack

A lane precisa de dois apps Slack distintos em um workspace, além de um canal do qual ambos os bots sejam membros:

- `channelId` - o id `Cxxxxxxxxxx` de um canal para o qual ambos os bots foram convidados. Use um canal dedicado; a lane publica em toda execução.
- `driverBotToken` - token de bot (`xoxb-...`) do app **Driver**.
- `sutBotToken` - token de bot (`xoxb-...`) do app **SUT**, que deve ser um app Slack separado do driver para que seu id de usuário de bot seja distinto.
- `sutAppToken` - token em nível de app (`xapp-...`) do app SUT com `connections:write`, usado pelo Socket Mode para que o app SUT possa receber eventos.

Prefira um workspace do Slack dedicado a QA em vez de reutilizar um workspace de produção.

O manifesto SUT abaixo reduz intencionalmente a instalação de produção do Plugin Slack incluído (`extensions/slack/src/setup-shared.ts:10`) às permissões e eventos cobertos pela suíte de QA ao vivo do Slack. Para a configuração do canal de produção como os usuários a veem, consulte [configuração rápida do canal Slack](/pt-BR/channels/slack#quick-setup); o par QA Driver/SUT é intencionalmente separado porque a lane precisa de dois ids distintos de usuário de bot em um workspace.

**1. Crie o app Driver**

Acesse [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → escolha o workspace de QA, cole o manifesto a seguir e depois _Install to Workspace_:

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Test driver bot for OpenClaw QA Slack live lane"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA Driver",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": ["chat:write", "channels:history", "groups:history", "users:read"]
    }
  },
  "settings": {
    "socket_mode_enabled": false
  }
}
```

Copie o _Bot User OAuth Token_ (`xoxb-...`) - isso se torna `driverBotToken`. O driver só precisa publicar mensagens e identificar a si mesmo; sem eventos, sem Socket Mode.

**2. Crie o app SUT**

Repita _Create New App → From a manifest_ no mesmo workspace. Este app de QA usa intencionalmente uma versão mais restrita do manifesto de produção do Plugin Slack incluído (`extensions/slack/src/setup-shared.ts:10`): escopos e eventos de reação são omitidos porque a suíte de QA ao vivo do Slack ainda não cobre o tratamento de reações.

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "OpenClaw QA SUT connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA SUT",
      "always_online": true
    },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed"
      ]
    }
  }
}
```

Depois que o Slack criar o app, faça duas coisas na página de configurações dele:

- _Install to Workspace_ → copie o _Bot User OAuth Token_ → isso se torna `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → adicione o escopo `connections:write` → salve → copie o valor `xapp-...` → isso se torna `sutAppToken`.

Verifique se os dois bots têm ids de usuário distintos chamando `auth.test` em cada token. O runtime distingue driver e SUT por id de usuário; reutilizar um app para ambos fará o mention-gating falhar imediatamente.

**3. Crie o canal**

No workspace de QA, crie um canal (por exemplo, `#openclaw-qa`) e convide ambos os bots de dentro do canal:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Copie o id `Cxxxxxxxxxx` de _channel info → About → Channel ID_ - isso se torna `channelId`. Um canal público funciona; se você usar um canal privado, ambos os apps já têm `groups:history`, então as leituras de histórico do harness ainda terão sucesso.

**4. Registre as credenciais**

Duas opções. Use variáveis de ambiente para depuração em uma única máquina (defina as quatro variáveis `OPENCLAW_QA_SLACK_*` e passe `--credential-source env`), ou alimente o pool compartilhado do Convex para que CI e outros mantenedores possam reservá-las.

Para o pool do Convex, grave os quatro campos em um arquivo JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Com `OPENCLAW_QA_CONVEX_SITE_URL` e `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` exportados no seu shell, registre e verifique:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Espere `count: 1`, `status: "active"`, sem campo `lease`.

**5. Verifique de ponta a ponta**

Execute a lane localmente para confirmar que ambos os bots conseguem conversar entre si por meio do broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Uma execução verde é concluída bem abaixo de 30 segundos e `slack-qa-report.md` mostra tanto `slack-canary` quanto `slack-mention-gating` com status `pass`. Se a lane travar por cerca de 90 segundos e sair com `Convex credential pool exhausted for kind "slack"`, o pool está vazio ou todas as linhas estão reservadas - `qa credentials list --kind slack --status all --json` dirá qual é o caso.

### Pool de credenciais do Convex

As lanes de Telegram, Discord e Slack podem reservar credenciais de um pool compartilhado do Convex em vez de ler as variáveis de ambiente acima. Passe `--credential-source convex` (ou defina `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); o QA Lab obtém uma reserva exclusiva, envia Heartbeats durante a execução e a libera no encerramento. Os tipos do pool são `"telegram"`, `"discord"` e `"slack"`.

Formatos de payload que o broker valida em `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` deve ser uma string numérica de chat-id.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` - `channelId` deve corresponder a `^[A-Z][A-Z0-9]+$` (um id do Slack como `Cxxxxxxxxxx`). Consulte [Configurando o workspace do Slack](#setting-up-the-slack-workspace) para provisionamento de app e escopo.

As variáveis de ambiente operacionais e o contrato do endpoint do broker Convex ficam em [Teste → Credenciais compartilhadas do Telegram via Convex](/pt-BR/help/testing#shared-telegram-credentials-via-convex-v1) (o nome da seção é anterior ao suporte a Discord; a semântica do broker é idêntica para ambos os tipos).

## Seeds apoiados pelo repo

Os ativos seed ficam em `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Eles ficam intencionalmente no git para que o plano de QA seja visível tanto para humanos quanto para o agente.

`qa-lab` deve permanecer um executor markdown genérico. Cada arquivo markdown de cenário é a fonte da verdade para uma execução de teste e deve definir:

- metadados do cenário
- metadados opcionais de categoria, capacidade, lane e risco
- referências de docs e código
- requisitos opcionais de Plugin
- patch opcional de configuração do Gateway
- o `qa-flow` executável

A superfície de runtime reutilizável que sustenta `qa-flow` pode permanecer genérica e transversal. Por exemplo, cenários markdown podem combinar helpers do lado do transporte com helpers do lado do navegador que controlam a Control UI incorporada por meio do seam `browser.request` do Gateway sem adicionar um executor de caso especial.

Arquivos de cenário devem ser agrupados por capacidade do produto, não por pasta da árvore de código-fonte. Mantenha ids de cenário estáveis quando os arquivos forem movidos; use `docsRefs` e `codeRefs` para rastreabilidade de implementação.

A lista de baseline deve permanecer ampla o bastante para cobrir:

- chats em DM e canal
- comportamento de threads
- ciclo de vida de ações de mensagem
- callbacks Cron
- recuperação de memória
- troca de modelo
- handoff de subagente
- leitura de repo e leitura de docs
- uma pequena tarefa de build, como Lobster Invaders

## Lanes de mock de provider

`qa suite` tem duas lanes locais de mock de provider:

- `mock-openai` é o mock OpenClaw ciente de cenários. Ele continua sendo a lane de mock determinística padrão para QA apoiado pelo repo e gates de paridade.
- `aimock` inicia um servidor de provider apoiado pelo AIMock para cobertura experimental de protocolo, fixture, gravação/reprodução e caos. Ele é aditivo e não substitui o dispatcher de cenários `mock-openai`.

A implementação de lane de provider fica em `extensions/qa-lab/src/providers/`. Cada provider é dono dos próprios padrões, inicialização de servidor local, configuração de modelo do Gateway, necessidades de staging de perfil de autenticação e flags de capacidade live/mock. Código da suíte compartilhada e do Gateway deve rotear pelo registro de provider em vez de ramificar por nomes de provider.

## Adaptadores de transporte

`qa-lab` possui uma camada genérica de transporte para cenários de QA em markdown. `qa-channel` é o primeiro adaptador nessa camada, mas o alvo de design é mais amplo: futuros canais reais ou sintéticos devem se conectar ao mesmo executor de suites em vez de adicionar um executor de QA específico de transporte.

No nível de arquitetura, a divisão é:

- `qa-lab` é responsável pela execução genérica de cenários, concorrência de workers, gravação de artefatos e relatórios.
- O adaptador de transporte é responsável pela configuração do gateway, prontidão, observação de entrada e saída, ações de transporte e estado de transporte normalizado.
- Arquivos de cenário em Markdown em `qa/scenarios/` definem a execução do teste; `qa-lab` fornece a superfície de runtime reutilizável que os executa.

### Adicionando um canal

Adicionar um canal ao sistema de QA em Markdown exige exatamente duas coisas:

1. Um adaptador de transporte para o canal.
2. Um pacote de cenários que exercite o contrato do canal.

Não adicione uma nova raiz de comando de QA de nível superior quando o host compartilhado `qa-lab` puder ser responsável pelo fluxo.

`qa-lab` é responsável pela mecânica compartilhada do host:

- a raiz de comando `openclaw qa`
- inicialização e encerramento da suite
- concorrência de workers
- gravação de artefatos
- geração de relatórios
- execução de cenários
- aliases de compatibilidade para cenários `qa-channel` mais antigos

Plugins executores são responsáveis pelo contrato de transporte:

- como `openclaw qa <runner>` é montado abaixo da raiz compartilhada `qa`
- como o gateway é configurado para esse transporte
- como a prontidão é verificada
- como eventos de entrada são injetados
- como mensagens de saída são observadas
- como transcrições e estado de transporte normalizado são expostos
- como ações apoiadas por transporte são executadas
- como reset ou limpeza específicos de transporte são tratados

A barra mínima de adoção para um novo canal:

1. Mantenha `qa-lab` como o proprietário da raiz compartilhada `qa`.
2. Implemente o executor de transporte na camada compartilhada do host `qa-lab`.
3. Mantenha a mecânica específica de transporte dentro do plugin executor ou do harness do canal.
4. Monte o executor como `openclaw qa <runner>` em vez de registrar um comando raiz concorrente. Plugins executores devem declarar `qaRunners` em `openclaw.plugin.json` e exportar um array `qaRunnerCliRegistrations` correspondente de `runtime-api.ts`. Mantenha `runtime-api.ts` leve; a CLI lazy e a execução do executor devem permanecer atrás de entrypoints separados.
5. Crie ou adapte cenários em Markdown nos diretórios temáticos `qa/scenarios/`.
6. Use os helpers genéricos de cenário para novos cenários.
7. Mantenha aliases de compatibilidade existentes funcionando, a menos que o repositório esteja fazendo uma migração intencional.

A regra de decisão é estrita:

- Se um comportamento puder ser expresso uma vez em `qa-lab`, coloque-o em `qa-lab`.
- Se um comportamento depender de um transporte de canal, mantenha-o nesse plugin executor ou harness do plugin.
- Se um cenário precisar de uma nova capacidade que mais de um canal possa usar, adicione um helper genérico em vez de uma ramificação específica de canal em `suite.ts`.
- Se um comportamento só fizer sentido para um transporte, mantenha o cenário específico de transporte e deixe isso explícito no contrato do cenário.

### Nomes de helpers de cenário

Helpers genéricos preferenciais para novos cenários:

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

Aliases de compatibilidade continuam disponíveis para cenários existentes - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - mas a criação de novos cenários deve usar os nomes genéricos. Os aliases existem para evitar uma migração em uma única virada, não como o modelo daqui em diante.

## Relatórios

`qa-lab` exporta um relatório de protocolo em Markdown a partir da linha do tempo observada do barramento.
O relatório deve responder:

- O que funcionou
- O que falhou
- O que permaneceu bloqueado
- Quais cenários de acompanhamento valem a pena adicionar

Para o inventário de cenários disponíveis - útil ao dimensionar trabalho de acompanhamento ou conectar um novo transporte - execute `pnpm openclaw qa coverage` (adicione `--json` para saída legível por máquina).

Para verificações de caráter e estilo, execute o mesmo cenário em várias refs de modelos live
e escreva um relatório julgado em Markdown:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

O comando executa processos filhos locais do gateway de QA, não Docker. Cenários de avaliação de caráter
devem definir a persona por meio de `SOUL.md` e então executar turnos comuns de usuário,
como chat, ajuda no workspace e pequenas tarefas de arquivo. O modelo candidato
não deve ser informado de que está sendo avaliado. O comando preserva cada
transcrição completa, registra estatísticas básicas da execução e então pede aos modelos juízes em modo rápido com
raciocínio `xhigh`, quando compatível, que classifiquem as execuções por naturalidade, vibe e humor.
Use `--blind-judge-models` ao comparar provedores: o prompt do juiz ainda recebe
todas as transcrições e o status da execução, mas as refs candidatas são substituídas por
rótulos neutros como `candidate-01`; o relatório mapeia os rankings de volta para as refs reais após
o parsing.
Execuções candidatas usam `high` thinking por padrão, com `medium` para GPT-5.5 e `xhigh`
para refs de avaliação OpenAI mais antigas que tenham suporte. Sobrescreva um candidato específico inline com
`--model provider/model,thinking=<level>`. `--thinking <level>` ainda define um
fallback global, e a forma antiga `--model-thinking <provider/model=level>` é
mantida por compatibilidade.
Refs candidatas da OpenAI usam modo rápido por padrão para que o processamento prioritário seja usado quando
o provedor tiver suporte. Adicione `,fast`, `,no-fast` ou `,fast=false` inline quando um
único candidato ou juiz precisar de uma sobrescrita. Passe `--fast` apenas quando quiser
forçar o modo rápido para todos os modelos candidatos. Durações de candidatos e juízes são
registradas no relatório para análise de benchmark, mas os prompts dos juízes dizem explicitamente
para não classificar por velocidade.
Execuções de modelos candidatos e juízes usam concorrência 16 por padrão. Reduza
`--concurrency` ou `--judge-concurrency` quando limites do provedor ou pressão no gateway local
tornarem a execução ruidosa demais.
Quando nenhum candidato `--model` é passado, a avaliação de caráter usa por padrão
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` e
`google/gemini-3.1-pro-preview` quando nenhum `--model` é passado.
Quando nenhum `--judge-model` é passado, os juízes usam por padrão
`openai/gpt-5.5,thinking=xhigh,fast` e
`anthropic/claude-opus-4-6,thinking=high`.

## Documentação relacionada

- [QA de matriz](/pt-BR/concepts/qa-matrix)
- [Canal de QA](/pt-BR/channels/qa-channel)
- [Testes](/pt-BR/help/testing)
- [Dashboard](/pt-BR/web/dashboard)
