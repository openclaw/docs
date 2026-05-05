---
read_when:
    - Entendendo como a pilha de QA se integra
    - Estendendo qa-lab, qa-channel ou um adaptador de transporte
    - Adicionando cenários de QA baseados em repositório
    - Criando automação de QA com maior realismo para o painel do Gateway
summary: 'Visão geral da pilha de controle de qualidade: qa-lab, qa-channel, cenários baseados no repositório, faixas de transporte ao vivo, adaptadores de transporte e geração de relatórios.'
title: Visão geral de QA
x-i18n:
    generated_at: "2026-05-05T05:42:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: d313abf9e0f13a159ce28c023e2a1c4c1518529da1354a130e9f495e65faac19
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

A pilha privada de QA serve para exercitar o OpenClaw de uma forma mais realista,
orientada a canais, do que um único teste unitário consegue.

Peças atuais:

- `extensions/qa-channel`: canal de mensagens sintético com superfícies de DM, canal, thread,
  reação, edição e exclusão.
- `extensions/qa-lab`: UI de depuração e barramento de QA para observar a transcrição,
  injetar mensagens de entrada e exportar um relatório em Markdown.
- `extensions/qa-matrix`, Plugins executores futuros: adaptadores de transporte ao vivo que
  conduzem um canal real dentro de um Gateway de QA filho.
- `qa/`: ativos de seed mantidos no repo para a tarefa de kickoff e cenários de QA
  baseline.
- [Mantis](/pt-BR/concepts/mantis): verificação ao vivo antes e depois para bugs que
  precisam de transportes reais, capturas de tela do navegador, estado de VM e evidências de PR.

## Superfície de comandos

Todo fluxo de QA roda em `pnpm openclaw qa <subcommand>`. Muitos têm aliases de script `pnpm qa:*`;
ambas as formas são compatíveis.

| Comando                                             | Finalidade                                                                                                                                                                                   |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Autoverificação de QA incluída; grava um relatório em Markdown.                                                                                                                              |
| `qa suite`                                          | Executa cenários mantidos no repo contra a faixa do Gateway de QA. Aliases: `pnpm openclaw qa suite --runner multipass` para uma VM Linux descartável.                                      |
| `qa coverage`                                       | Imprime o inventário markdown de cobertura de cenários (`--json` para saída de máquina).                                                                                                    |
| `qa parity-report`                                  | Compara dois arquivos `qa-suite-summary.json` e grava o relatório de paridade agêntico.                                                                                                     |
| `qa character-eval`                                 | Executa o cenário de QA de personagem em vários modelos ao vivo com um relatório julgado. Consulte [Relatórios](#reporting).                                                                |
| `qa manual`                                         | Executa um prompt avulso contra a faixa de provedor/modelo selecionada.                                                                                                                      |
| `qa ui`                                             | Inicia a UI de depuração de QA e o barramento de QA local (alias: `pnpm qa:lab:ui`).                                                                                                        |
| `qa docker-build-image`                             | Cria a imagem Docker de QA pré-preparada.                                                                                                                                                    |
| `qa docker-scaffold`                                | Grava um scaffold docker-compose para o painel de QA + faixa do Gateway.                                                                                                                     |
| `qa up`                                             | Cria o site de QA, inicia a pilha apoiada por Docker, imprime a URL (alias: `pnpm qa:lab:up`; a variante `:fast` adiciona `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).           |
| `qa aimock`                                         | Inicia apenas o servidor do provedor AIMock.                                                                                                                                                 |
| `qa mock-openai`                                    | Inicia apenas o servidor do provedor `mock-openai` ciente de cenários.                                                                                                                       |
| `qa credentials doctor` / `add` / `list` / `remove` | Gerencia o pool compartilhado de credenciais Convex.                                                                                                                                         |
| `qa matrix`                                         | Faixa de transporte ao vivo contra um homeserver Tuwunel descartável. Consulte [QA de Matrix](/pt-BR/concepts/qa-matrix).                                                                         |
| `qa telegram`                                       | Faixa de transporte ao vivo contra um grupo privado real do Telegram.                                                                                                                        |
| `qa discord`                                        | Faixa de transporte ao vivo contra um canal real de guilda privada do Discord.                                                                                                               |
| `qa slack`                                          | Faixa de transporte ao vivo contra um canal privado real do Slack.                                                                                                                           |
| `qa mantis`                                         | Executor de verificação antes e depois para bugs de transporte ao vivo, com evidência de reações de status no Discord, smoke de desktop/navegador do Crabbox e smoke de Slack em VNC. Consulte [Mantis](/pt-BR/concepts/mantis). |

## Fluxo do operador

O fluxo atual do operador de QA é um site de QA com dois painéis:

- Esquerda: painel do Gateway (Control UI) com o agente.
- Direita: QA Lab, exibindo a transcrição em estilo Slack e o plano do cenário.

Execute com:

```bash
pnpm qa:lab:up
```

Isso cria o site de QA, inicia a faixa do Gateway apoiada por Docker e expõe a
página do QA Lab, onde um operador ou loop de automação pode dar ao agente uma
missão de QA, observar comportamento real do canal e registrar o que funcionou, falhou ou
permaneceu bloqueado.

Para iterar mais rápido na UI do QA Lab local sem recriar a imagem Docker a cada vez,
inicie a pilha com um bundle do QA Lab montado por bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantém os serviços Docker em uma imagem pré-criada e monta por bind
`extensions/qa-lab/web/dist` no contêiner `qa-lab`. `qa:lab:watch`
recria esse bundle quando há mudança, e o navegador recarrega automaticamente quando o hash
dos ativos do QA Lab muda.

Para um smoke local de trace OpenTelemetry, execute:

```bash
pnpm qa:otel:smoke
```

Esse script inicia um receptor local de trace OTLP/HTTP, executa o cenário de QA
`otel-trace-smoke` com o Plugin `diagnostics-otel` habilitado, depois
decodifica os spans protobuf exportados e afirma o formato crítico para release:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` e `openclaw.message.delivery` devem estar presentes;
chamadas de modelo não devem exportar `StreamAbandoned` em turnos bem-sucedidos; IDs diagnósticos brutos e
atributos `openclaw.content.*` devem ficar fora do trace. Ele grava
`otel-smoke-summary.json` ao lado dos artefatos da suíte de QA.

O QA de observabilidade permanece apenas para checkout de código-fonte. O tarball npm omite
intencionalmente o QA Lab, portanto as faixas de release Docker de pacote não executam comandos `qa`.
Use `pnpm qa:otel:smoke` a partir de um checkout de código-fonte compilado ao alterar a instrumentação
de diagnóstico.

Para uma faixa de smoke Matrix com transporte real, execute:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

A referência completa da CLI, o catálogo de perfis/cenários, as variáveis de ambiente e o layout de artefatos para essa faixa ficam em [QA de Matrix](/pt-BR/concepts/qa-matrix). Em resumo: ela provisiona um homeserver Tuwunel descartável no Docker, registra usuários temporários driver/SUT/observador, executa o Plugin Matrix real dentro de um Gateway de QA filho com escopo para esse transporte (sem `qa-channel`) e então grava um relatório em Markdown, resumo JSON, artefato de eventos observados e log de saída combinado em `.artifacts/qa-e2e/matrix-<timestamp>/`.

Para faixas de smoke com transporte real do Telegram, Discord e Slack:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Elas miram um canal real pré-existente com dois bots (driver + SUT). Variáveis de ambiente obrigatórias, listas de cenários, artefatos de saída e o pool de credenciais Convex estão documentados na [referência de QA do Telegram, Discord e Slack](#telegram-discord-and-slack-qa-reference) abaixo.

Para uma execução completa de VM desktop do Slack com resgate por VNC, execute:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Esse comando reserva uma máquina desktop/navegador do Crabbox, executa a faixa ao vivo do Slack
dentro da VM, abre o Slack Web no navegador VNC, captura o desktop e
copia `slack-qa/`, `slack-desktop-smoke.png` e `slack-desktop-smoke.mp4`
quando a captura de vídeo estiver disponível de volta para o diretório de artefatos do Mantis. Reutilize `--lease-id <cbx_...>` depois de fazer login manualmente no Slack Web
por VNC. Com `--gateway-setup`, o Mantis deixa um Gateway Slack persistente do OpenClaw
rodando dentro da VM na porta `38973`; sem isso, o comando executa a
faixa normal de QA do Slack bot-para-bot e sai após a captura dos artefatos.

Para uma tarefa desktop em estilo agente/CV, execute:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` reserva ou reutiliza uma máquina desktop/navegador do Crabbox, inicia
`crabbox record --while`, conduz o navegador visível por meio de um
`visual-driver` aninhado, captura `visual-task.png`, executa `openclaw infer image describe`
contra a captura de tela quando `--vision-mode image-describe` está selecionado e
grava `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` e `mantis-visual-task-report.md`.
Quando `--expect-text` é definido, o prompt de visão pede um veredito JSON
estruturado e só passa quando o modelo relata evidência visível positiva; uma
resposta negativa que apenas cita o texto-alvo falha na asserção.
Use `--vision-mode metadata` para um smoke sem modelo que comprova o encanamento de desktop,
navegador, captura de tela e vídeo sem chamar um provedor de compreensão de imagem.
A gravação é um artefato obrigatório para `visual-task`; se o Crabbox não gravar
um `visual-task.mp4` não vazio, a tarefa falha mesmo quando o visual driver
passou. Em caso de falha, o Mantis mantém a reserva para VNC, a menos que a tarefa já tenha
passado e `--keep-lease` não tenha sido definido.

Antes de usar credenciais ao vivo do pool, execute:

```bash
pnpm openclaw qa credentials doctor
```

O doctor verifica o ambiente do broker Convex, valida configurações de endpoint e verifica a alcançabilidade de admin/list quando o segredo do mantenedor está presente. Ele relata apenas o status definido/ausente para segredos.

## Cobertura de transporte ao vivo

As faixas de transporte ao vivo compartilham um contrato em vez de cada uma inventar seu próprio formato de lista de cenários. `qa-channel` é a suíte sintética ampla de comportamento de produto e não faz parte da matriz de cobertura de transporte ao vivo.

| Faixa   | Canário | Controle de menções | Bot para bot | Bloqueio de lista de permissões | Resposta de nível superior | Retomada após reinicialização | Acompanhamento de thread | Isolamento de thread | Observação de reação | Comando de ajuda | Registro de comando nativo |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          |                 |                 |                |                  |                  |                      |              |                             |

Isso mantém `qa-channel` como a suíte ampla de comportamento do produto, enquanto Matrix,
Telegram e futuros transportes ao vivo compartilham uma checklist explícita de contrato de transporte.

Para uma faixa descartável de VM Linux sem levar Docker para o caminho de QA, execute:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Isso inicializa um convidado Multipass novo, instala dependências, compila o OpenClaw
dentro do convidado, executa `qa suite` e então copia o relatório de QA normal e o
resumo de volta para `.artifacts/qa-e2e/...` no host.
Ele reutiliza o mesmo comportamento de seleção de cenários que `qa suite` no host.
Execuções da suíte no host e no Multipass executam vários cenários selecionados em paralelo
com workers de Gateway isolados por padrão. `qa-channel` usa concorrência 4 por padrão,
limitada pela contagem de cenários selecionados. Use `--concurrency <count>` para ajustar
a contagem de workers, ou `--concurrency 1` para execução serial.
O comando sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando
quiser artefatos sem um código de saída de falha.
Execuções ao vivo encaminham as entradas de autenticação de QA compatíveis que são práticas para o
convidado: chaves de provedor baseadas em env, o caminho de configuração do provedor ao vivo de QA e
`CODEX_HOME` quando presente. Mantenha `--output-dir` sob a raiz do repositório para que o convidado
possa escrever de volta pelo workspace montado.

## Referência de QA do Telegram, Discord e Slack

Matrix tem uma [página dedicada](/pt-BR/concepts/qa-matrix) por causa da contagem de cenários e do provisionamento de homeserver apoiado por Docker. Telegram, Discord e Slack são menores — um punhado de cenários cada, sem sistema de perfis, contra canais reais preexistentes — então a referência deles fica aqui.

### Flags de CLI compartilhadas

Essas faixas são registradas por meio de `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` e aceitam as mesmas flags:

| Flag                                  | Padrão                                                         | Descrição                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | Executa apenas este cenário. Repetível.                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Onde relatórios/resumo/mensagens observadas e o log de saída são gravados. Caminhos relativos são resolvidos em relação a `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Raiz do repositório ao invocar de um cwd neutro.                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | ID de conta temporária dentro da configuração do Gateway de QA.                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` ou `live-frontier` (`live-openai` legado ainda funciona).                                                  |
| `--model <ref>` / `--alt-model <ref>` | padrão do provedor                                                | Refs de modelo primário/alternativo.                                                                                         |
| `--fast`                              | desativado                                                             | Modo rápido do provedor onde houver compatibilidade.                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | Veja [pool de credenciais do Convex](#convex-credential-pool).                                                                |
| `--credential-role <maintainer\|ci>`  | `ci` em CI, caso contrário `maintainer`                              | Função usada quando `--credential-source convex`.                                                                          |

Cada faixa sai com código diferente de zero em qualquer cenário com falha. `--allow-failures` grava artefatos sem definir um código de saída de falha.

### QA do Telegram

```bash
pnpm openclaw qa telegram
```

Mira um grupo privado real do Telegram com dois bots distintos (driver + SUT). O bot SUT deve ter um nome de usuário no Telegram; a observação bot para bot funciona melhor quando ambos os bots têm **Bot-to-Bot Communication Mode** habilitado no `@BotFather`.

Env obrigatório quando `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — ID numérico do chat (string).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Opcional:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` mantém corpos de mensagens nos artefatos de mensagens observadas (o padrão redige).

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
- `telegram-qa-summary.json` — inclui RTT por resposta (envio do driver → resposta SUT observada) começando pelo canário.
- `telegram-qa-observed-messages.json` — corpos redigidos a menos que `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA do Discord

```bash
pnpm openclaw qa discord
```

Mira um canal privado real de guilda do Discord com dois bots: um bot driver controlado pelo harness e um bot SUT iniciado pelo Gateway filho do OpenClaw por meio do Plugin Discord incluído. Verifica o tratamento de menções do canal, se o bot SUT registrou o comando nativo `/help` no Discord e cenários de evidência Mantis opt-in.

Env obrigatório quando `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — deve corresponder ao ID de usuário do bot SUT retornado pelo Discord (caso contrário, a faixa falha rapidamente).

Opcional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` mantém corpos de mensagens nos artefatos de mensagens observadas.

Cenários (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — cenário Mantis opt-in. É executado sozinho porque alterna o SUT para respostas de guilda sempre ativas e apenas por ferramenta com `messages.statusReactions.enabled=true`, e então captura uma linha do tempo de reações REST mais artefatos visuais HTML/PNG. Relatórios antes/depois do Mantis também preservam artefatos MP4 fornecidos pelo cenário como `baseline.mp4` e `candidate.mp4`.

Execute explicitamente o cenário Mantis de reação de status:

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
- `discord-qa-observed-messages.json` — corpos redigidos a menos que `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` e `discord-status-reactions-tool-only-timeline.png` quando o cenário de reação de status é executado.

### QA do Slack

```bash
pnpm openclaw qa slack
```

Mira um canal privado real do Slack com dois bots distintos: um bot driver controlado pelo harness e um bot SUT iniciado pelo Gateway filho do OpenClaw por meio do Plugin Slack incluído.

Env obrigatório quando `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Opcional:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` mantém corpos de mensagens nos artefatos de mensagens observadas.

Cenários (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`

Artefatos de saída:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — corpos redigidos a menos que `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### Configurando o workspace do Slack

A faixa precisa de dois apps distintos do Slack em um workspace, além de um canal do qual ambos os bots sejam membros:

- `channelId` — o ID `Cxxxxxxxxxx` de um canal para o qual ambos os bots foram convidados. Use um canal dedicado; a faixa publica a cada execução.
- `driverBotToken` — token de bot (`xoxb-...`) do app **Driver**.
- `sutBotToken` — token de bot (`xoxb-...`) do app **SUT**, que deve ser um app Slack separado do driver para que seu ID de usuário de bot seja distinto.
- `sutAppToken` — token em nível de app (`xapp-...`) do app SUT com `connections:write`, usado pelo Socket Mode para que o app SUT possa receber eventos.

Prefira um workspace do Slack dedicado a QA em vez de reutilizar um workspace de produção.

O manifesto SUT abaixo espelha a instalação de produção do Plugin Slack incluído (`extensions/slack/src/setup-shared.ts:10`). Para a configuração do canal de produção como os usuários a veem, consulte [configuração rápida de canal Slack](/pt-BR/channels/slack#quick-setup); o par Driver/SUT de QA é intencionalmente separado porque a faixa precisa de dois IDs de usuário de bot distintos em um workspace.

**1. Crie o app Driver**

Acesse [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → escolha o workspace de QA, cole o manifesto a seguir e então _Install to Workspace_:

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

Copie o _Bot User OAuth Token_ (`xoxb-...`) — ele se torna `driverBotToken`. O driver só precisa publicar mensagens e se identificar; sem eventos, sem Socket Mode.

**2. Crie o app SUT**

Repita _Create New App → From a manifest_ no mesmo workspace. O conjunto de escopos espelha a instalação de produção do Plugin Slack incluído (`extensions/slack/src/setup-shared.ts:10`):

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
        "reactions:read",
        "reactions:write",
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
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

Depois que o Slack criar o app, faça duas coisas na página de configurações dele:

- _Install to Workspace_ → copie o _Bot User OAuth Token_ → ele se torna `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → adicione o escopo `connections:write` → salve → copie o valor `xapp-...` → ele se torna `sutAppToken`.

Verifique se os dois bots têm ids de usuário distintos chamando `auth.test` em cada token. O runtime distingue o driver e o SUT pelo id de usuário; reutilizar um app para ambos fará o bloqueio por menção falhar imediatamente.

**3. Crie o canal**

No workspace de QA, crie um canal (por exemplo, `#openclaw-qa`) e convide os dois bots de dentro do canal:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Copie o id `Cxxxxxxxxxx` de _channel info → About → Channel ID_ — ele se torna `channelId`. Um canal público funciona; se você usar um canal privado, ambos os apps já têm `groups:history`, então as leituras de histórico do harness ainda terão sucesso.

**4. Registre as credenciais**

Duas opções. Use variáveis de ambiente para depuração em uma única máquina (defina as quatro variáveis `OPENCLAW_QA_SLACK_*` e passe `--credential-source env`) ou alimente o pool Convex compartilhado para que o CI e outros mantenedores possam alugá-las.

Para o pool Convex, grave os quatro campos em um arquivo JSON:

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

Espere `count: 1`, `status: "active"`, nenhum campo `lease`.

**5. Verifique de ponta a ponta**

Execute a lane localmente para confirmar que os dois bots conseguem conversar entre si pelo broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Uma execução verde termina em bem menos de 30 segundos, e `slack-qa-report.md` mostra `slack-canary` e `slack-mention-gating` com status `pass`. Se a lane travar por ~90 segundos e sair com `Convex credential pool exhausted for kind "slack"`, o pool está vazio ou todas as linhas estão alugadas — `qa credentials list --kind slack --status all --json` informará qual é o caso.

### Pool de credenciais Convex

As lanes Telegram, Discord e Slack podem alugar credenciais de um pool Convex compartilhado em vez de ler as variáveis de ambiente acima. Passe `--credential-source convex` (ou defina `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); o QA Lab adquire um aluguel exclusivo, envia heartbeats durante toda a execução e o libera no encerramento. Os tipos de pool são `"telegram"`, `"discord"` e `"slack"`.

Formatos de payload que o broker valida em `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` deve ser uma string numérica de chat-id.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — `channelId` deve corresponder a `^[A-Z][A-Z0-9]+$` (um id do Slack como `Cxxxxxxxxxx`). Consulte [Configurando o workspace Slack](#setting-up-the-slack-workspace) para provisionamento de app e escopo.

As variáveis de ambiente operacionais e o contrato do endpoint do broker Convex ficam em [Testes → Credenciais Telegram compartilhadas via Convex](/pt-BR/help/testing#shared-telegram-credentials-via-convex-v1) (o nome da seção é anterior ao suporte a Discord; a semântica do broker é idêntica para ambos os tipos).

## Seeds com suporte no repositório

Os assets de seed ficam em `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Eles ficam intencionalmente no git para que o plano de QA seja visível tanto para humanos quanto para o agente.

`qa-lab` deve continuar sendo um executor Markdown genérico. Cada arquivo Markdown de cenário é a fonte da verdade para uma execução de teste e deve definir:

- metadados do cenário
- metadados opcionais de categoria, capacidade, lane e risco
- referências de docs e código
- requisitos opcionais de Plugin
- patch opcional de configuração do Gateway
- o `qa-flow` executável

A superfície de runtime reutilizável que sustenta `qa-flow` pode continuar genérica e transversal. Por exemplo, cenários Markdown podem combinar helpers do lado do transporte com helpers do lado do navegador que controlam a Control UI incorporada pelo seam `browser.request` do Gateway sem adicionar um executor de caso especial.

Os arquivos de cenário devem ser agrupados por capacidade do produto, e não pela pasta da árvore-fonte. Mantenha os IDs de cenário estáveis quando os arquivos forem movidos; use `docsRefs` e `codeRefs` para rastreabilidade da implementação.

A lista de baseline deve continuar ampla o suficiente para cobrir:

- conversa por DM e canal
- comportamento de threads
- ciclo de vida de ações de mensagem
- callbacks de Cron
- recuperação de memória
- troca de modelo
- passagem para subagente
- leitura de repositório e leitura de docs
- uma pequena tarefa de build, como Lobster Invaders

## Lanes de mock de provedor

`qa suite` tem duas lanes locais de mock de provedor:

- `mock-openai` é o mock OpenClaw ciente de cenários. Ele continua sendo a lane de mock determinística padrão para QA com suporte no repositório e gates de paridade.
- `aimock` inicia um servidor de provedor com suporte em AIMock para cobertura experimental de protocolo, fixture, gravação/reprodução e caos. Ele é aditivo e não substitui o dispatcher de cenários `mock-openai`.

A implementação de lane de provedor fica em `extensions/qa-lab/src/providers/`. Cada provedor é dono dos seus padrões, inicialização do servidor local, configuração de modelo do Gateway, necessidades de preparação de perfil de autenticação e flags de capacidade live/mock. Código compartilhado de suíte e Gateway deve rotear pelo registro de provedores em vez de ramificar por nomes de provedores.

## Adaptadores de transporte

`qa-lab` possui um seam de transporte genérico para cenários QA em Markdown. `qa-channel` é o primeiro adaptador nesse seam, mas o alvo de design é mais amplo: canais reais ou sintéticos futuros devem se conectar ao mesmo executor de suíte em vez de adicionar um executor de QA específico de transporte.

No nível da arquitetura, a divisão é:

- `qa-lab` possui execução genérica de cenários, concorrência de workers, gravação de artefatos e relatórios.
- O adaptador de transporte possui configuração do Gateway, prontidão, observação de entrada e saída, ações de transporte e estado de transporte normalizado.
- Arquivos de cenário Markdown em `qa/scenarios/` definem a execução de teste; `qa-lab` fornece a superfície de runtime reutilizável que os executa.

### Adicionando um canal

Adicionar um canal ao sistema de QA em Markdown exige exatamente duas coisas:

1. Um adaptador de transporte para o canal.
2. Um pacote de cenários que exercite o contrato do canal.

Não adicione uma nova raiz de comando QA de nível superior quando o host compartilhado `qa-lab` puder ser dono do fluxo.

`qa-lab` possui a mecânica de host compartilhado:

- a raiz de comando `openclaw qa`
- inicialização e encerramento da suíte
- concorrência de workers
- gravação de artefatos
- geração de relatórios
- execução de cenários
- aliases de compatibilidade para cenários `qa-channel` mais antigos

Plugins de runner possuem o contrato de transporte:

- como `openclaw qa <runner>` é montado sob a raiz compartilhada `qa`
- como o Gateway é configurado para esse transporte
- como a prontidão é verificada
- como eventos de entrada são injetados
- como mensagens de saída são observadas
- como transcrições e estado de transporte normalizado são expostos
- como ações com suporte no transporte são executadas
- como reset ou limpeza específicos do transporte são tratados

O requisito mínimo de adoção para um novo canal:

1. Mantenha `qa-lab` como dono da raiz compartilhada `qa`.
2. Implemente o runner de transporte no seam do host compartilhado `qa-lab`.
3. Mantenha mecânicas específicas de transporte dentro do Plugin runner ou do harness de canal.
4. Monte o runner como `openclaw qa <runner>` em vez de registrar um comando raiz concorrente. Plugins runner devem declarar `qaRunners` em `openclaw.plugin.json` e exportar um array `qaRunnerCliRegistrations` correspondente de `runtime-api.ts`. Mantenha `runtime-api.ts` leve; CLI lazy e execução de runner devem ficar atrás de entrypoints separados.
5. Crie ou adapte cenários Markdown nos diretórios temáticos `qa/scenarios/`.
6. Use os helpers genéricos de cenário para novos cenários.
7. Mantenha os aliases de compatibilidade existentes funcionando, a menos que o repositório esteja fazendo uma migração intencional.

A regra de decisão é estrita:

- Se o comportamento puder ser expresso uma vez em `qa-lab`, coloque-o em `qa-lab`.
- Se o comportamento depender de um transporte de canal, mantenha-o nesse Plugin runner ou harness de Plugin.
- Se um cenário precisar de uma nova capacidade que mais de um canal possa usar, adicione um helper genérico em vez de uma ramificação específica de canal em `suite.ts`.
- Se um comportamento fizer sentido apenas para um transporte, mantenha o cenário específico de transporte e torne isso explícito no contrato do cenário.

### Nomes de helpers de cenário

Helpers genéricos preferidos para novos cenários:

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

Aliases de compatibilidade continuam disponíveis para cenários existentes — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — mas a criação de novos cenários deve usar os nomes genéricos. Os aliases existem para evitar uma migração de uma só vez, não como o modelo daqui em diante.

## Relatórios

`qa-lab` exporta um relatório de protocolo Markdown a partir da linha do tempo do bus observada.
O relatório deve responder:

- O que funcionou
- O que falhou
- O que continuou bloqueado
- Quais cenários de acompanhamento valem a pena adicionar

Para o inventário de cenários disponíveis — útil ao dimensionar trabalho de acompanhamento ou conectar um novo transporte — execute `pnpm openclaw qa coverage` (adicione `--json` para saída legível por máquina).

Para verificações de caracteres e estilo, execute o mesmo cenário em várias refs de modelo live e grave um relatório Markdown avaliado:

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

O comando executa processos filhos locais do Gateway de QA, não Docker. Os
cenários de avaliação de personagem devem definir a persona por meio de `SOUL.md`
e então executar turnos comuns de usuário, como conversa, ajuda com o espaço de
trabalho e pequenas tarefas com arquivos. O modelo candidato não deve ser
informado de que está sendo avaliado. O comando preserva cada transcrição
completa, registra estatísticas básicas da execução e então pede aos modelos
juízes em modo rápido, com raciocínio `xhigh` quando compatível, que classifiquem
as execuções por naturalidade, tom e humor. Use `--blind-judge-models` ao
comparar provedores: o prompt do juiz ainda recebe todas as transcrições e o
status de execução, mas as referências dos candidatos são substituídas por
rótulos neutros, como `candidate-01`; o relatório mapeia as classificações de
volta para as referências reais após a análise.
As execuções candidatas usam raciocínio `high` por padrão, com `medium` para
GPT-5.5 e `xhigh` para referências de avaliação OpenAI mais antigas que oferecem
suporte a isso. Sobrescreva um candidato específico inline com
`--model provider/model,thinking=<level>`. `--thinking <level>` ainda define um
fallback global, e o formato mais antigo `--model-thinking <provider/model=level>`
é mantido para compatibilidade.
As referências candidatas da OpenAI usam modo rápido por padrão, para que o
processamento prioritário seja usado quando o provedor oferecer suporte. Adicione
`,fast`, `,no-fast` ou `,fast=false` inline quando um único candidato ou juiz
precisar de uma sobrescrita. Passe `--fast` somente quando quiser forçar o modo
rápido para todos os modelos candidatos. As durações de candidatos e juízes são
registradas no relatório para análise de benchmark, mas os prompts dos juízes
dizem explicitamente para não classificar por velocidade.
As execuções dos modelos candidatos e juízes usam concorrência 16 por padrão.
Reduza `--concurrency` ou `--judge-concurrency` quando limites do provedor ou
pressão no Gateway local tornarem uma execução ruidosa demais.
Quando nenhum `--model` candidato é passado, a avaliação de personagem usa por
padrão `openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`,
`anthropic/claude-opus-4-6`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` e
`google/gemini-3.1-pro-preview` quando nenhum `--model` é passado.
Quando nenhum `--judge-model` é passado, os juízes usam por padrão
`openai/gpt-5.5,thinking=xhigh,fast` e
`anthropic/claude-opus-4-6,thinking=high`.

## Documentação relacionada

- [QA Matrix](/pt-BR/concepts/qa-matrix)
- [Canal de QA](/pt-BR/channels/qa-channel)
- [Testes](/pt-BR/help/testing)
- [Dashboard](/pt-BR/web/dashboard)
