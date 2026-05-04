---
read_when:
    - Entendendo como a pilha de QA se encaixa
    - Estendendo o qa-lab, o qa-channel ou um adaptador de transporte
    - Adicionar cenários de QA baseados no repositório
    - Criando automação de QA de maior realismo em torno do dashboard do Gateway
summary: 'Visão geral da pilha de QA: qa-lab, qa-channel, cenários baseados no repositório, faixas de transporte ao vivo, adaptadores de transporte e geração de relatórios.'
title: Visão geral de QA
x-i18n:
    generated_at: "2026-05-04T05:52:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 067f5aa0831724659ae36d548ef2e7bd28b40aad9cef45f325a01a2748003b29
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

A stack privada de QA foi pensada para exercitar o OpenClaw de uma forma mais realista,
moldada por canais, do que um único teste unitário consegue.

Componentes atuais:

- `extensions/qa-channel`: canal de mensagens sintético com superfícies de DM,
  canal, thread, reação, edição e exclusão.
- `extensions/qa-lab`: UI de depuração e barramento de QA para observar a transcrição,
  injetar mensagens de entrada e exportar um relatório em Markdown.
- `extensions/qa-matrix`, plugins executores futuros: adaptadores de transporte ao vivo que
  controlam um canal real dentro de um Gateway de QA filho.
- `qa/`: ativos de semente respaldados pelo repositório para a tarefa inicial e cenários
  de QA de linha de base.
- [Mantis](/pt-BR/concepts/mantis): verificação ao vivo antes e depois para bugs que
  precisam de transportes reais, capturas de tela do navegador, estado da VM e evidências de PR.

## Superfície de comandos

Todo fluxo de QA é executado em `pnpm openclaw qa <subcommand>`. Muitos têm aliases de script `pnpm qa:*`;
ambas as formas são compatíveis.

| Comando                                             | Finalidade                                                                                                                                                                                   |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Autoverificação de QA incluída; grava um relatório em Markdown.                                                                                                                              |
| `qa suite`                                          | Executa cenários respaldados pelo repositório contra a faixa do Gateway de QA. Aliases: `pnpm openclaw qa suite --runner multipass` para uma VM Linux descartável.                          |
| `qa coverage`                                       | Imprime o inventário markdown de cobertura de cenários (`--json` para saída de máquina).                                                                                                    |
| `qa parity-report`                                  | Compara dois arquivos `qa-suite-summary.json` e grava o relatório de paridade agêntica.                                                                                                     |
| `qa character-eval`                                 | Executa o cenário de QA de personagem em vários modelos ao vivo com um relatório julgado. Consulte [Relatórios](#reporting).                                                                |
| `qa manual`                                         | Executa um prompt avulso contra a faixa de provedor/modelo selecionada.                                                                                                                     |
| `qa ui`                                             | Inicia a UI de depuração de QA e o barramento local de QA (alias: `pnpm qa:lab:ui`).                                                                                                        |
| `qa docker-build-image`                             | Compila a imagem Docker pré-preparada de QA.                                                                                                                                                 |
| `qa docker-scaffold`                                | Grava um scaffold docker-compose para o painel de QA + faixa do Gateway.                                                                                                                     |
| `qa up`                                             | Compila o site de QA, inicia a stack apoiada por Docker e imprime a URL (alias: `pnpm qa:lab:up`; a variante `:fast` adiciona `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).       |
| `qa aimock`                                         | Inicia apenas o servidor do provedor AIMock.                                                                                                                                                 |
| `qa mock-openai`                                    | Inicia apenas o servidor do provedor `mock-openai` ciente de cenários.                                                                                                                       |
| `qa credentials doctor` / `add` / `list` / `remove` | Gerencia o pool compartilhado de credenciais do Convex.                                                                                                                                      |
| `qa matrix`                                         | Faixa de transporte ao vivo contra um homeserver Tuwunel descartável. Consulte [QA do Matrix](/pt-BR/concepts/qa-matrix).                                                                         |
| `qa telegram`                                       | Faixa de transporte ao vivo contra um grupo privado real do Telegram.                                                                                                                        |
| `qa discord`                                        | Faixa de transporte ao vivo contra um canal real de guild privada do Discord.                                                                                                                |
| `qa slack`                                          | Faixa de transporte ao vivo contra um canal privado real do Slack.                                                                                                                           |
| `qa mantis`                                         | Executor de verificação antes e depois para bugs de transporte ao vivo, com evidências de reações de status no Discord, smoke de desktop/navegador Crabbox e smoke de Slack em VNC. Consulte [Mantis](/pt-BR/concepts/mantis). |

## Fluxo do operador

O fluxo atual do operador de QA é um site de QA com dois painéis:

- Esquerda: painel do Gateway (UI de Controle) com o agente.
- Direita: QA Lab, mostrando a transcrição estilo Slack e o plano do cenário.

Execute com:

```bash
pnpm qa:lab:up
```

Isso compila o site de QA, inicia a faixa do Gateway apoiada por Docker e expõe a
página do QA Lab onde um operador ou loop de automação pode dar ao agente uma missão
de QA, observar o comportamento real do canal e registrar o que funcionou, falhou ou
permaneceu bloqueado.

Para uma iteração mais rápida da UI do QA Lab sem recompilar a imagem Docker a cada vez,
inicie a stack com um pacote do QA Lab montado por bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantém os serviços Docker em uma imagem pré-compilada e monta por bind
`extensions/qa-lab/web/dist` no contêiner `qa-lab`. `qa:lab:watch`
recompila esse pacote em mudanças, e o navegador recarrega automaticamente quando o hash
do ativo do QA Lab muda.

Para um smoke local de trace do OpenTelemetry, execute:

```bash
pnpm qa:otel:smoke
```

Esse script inicia um receptor local de trace OTLP/HTTP, executa o cenário de QA
`otel-trace-smoke` com o plugin `diagnostics-otel` habilitado, depois decodifica os spans
protobuf exportados e verifica o formato crítico para release:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` e `openclaw.message.delivery` devem estar presentes;
chamadas de modelo não devem exportar `StreamAbandoned` em turnos bem-sucedidos; IDs diagnósticos brutos e
atributos `openclaw.content.*` devem permanecer fora do trace. Ele grava
`otel-smoke-summary.json` ao lado dos artefatos da suíte de QA.

QA de observabilidade permanece restrito ao checkout do código-fonte. O tarball npm omite intencionalmente
o QA Lab, então as faixas de release Docker do pacote não executam comandos `qa`. Use
`pnpm qa:otel:smoke` a partir de um checkout de código-fonte compilado ao alterar a instrumentação
de diagnósticos.

Para uma faixa de smoke do Matrix com transporte real, execute:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

A referência completa da CLI, catálogo de perfis/cenários, vars de env e layout de artefatos desta faixa ficam em [QA do Matrix](/pt-BR/concepts/qa-matrix). Em resumo: ela provisiona um homeserver Tuwunel descartável em Docker, registra usuários temporários de driver/SUT/observer, executa o plugin real do Matrix dentro de um Gateway de QA filho escopado para esse transporte (sem `qa-channel`), depois grava um relatório em Markdown, resumo JSON, artefato de eventos observados e log de saída combinado em `.artifacts/qa-e2e/matrix-<timestamp>/`.

Para faixas de smoke com transporte real de Telegram, Discord e Slack:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Elas miram um canal real pré-existente com dois bots (driver + SUT). Vars de env obrigatórias, listas de cenários, artefatos de saída e o pool de credenciais do Convex estão documentados na [referência de QA para Telegram, Discord e Slack](#telegram-discord-and-slack-qa-reference) abaixo.

Para uma execução completa de VM desktop do Slack com resgate por VNC, execute:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Esse comando aluga uma máquina desktop/navegador Crabbox, executa a faixa ao vivo do Slack
dentro da VM, abre o Slack Web no navegador VNC, captura o desktop e copia
`slack-qa/` mais `slack-desktop-smoke.png` de volta para o diretório de artefatos do Mantis.
Reutilize `--lease-id <cbx_...>` depois de fazer login no Slack Web manualmente
pelo VNC. Com `--gateway-setup`, o Mantis deixa um Gateway Slack persistente do OpenClaw
em execução dentro da VM na porta `38973`; sem isso, o comando executa a
faixa normal de QA Slack bot a bot e sai após a captura de artefatos.

Antes de usar credenciais ao vivo em pool, execute:

```bash
pnpm openclaw qa credentials doctor
```

O doctor verifica o env do broker Convex, valida configurações de endpoint e verifica a acessibilidade de admin/list quando o segredo de mantenedor está presente. Ele relata apenas o status definido/ausente dos segredos.

## Cobertura de transporte ao vivo

As faixas de transporte ao vivo compartilham um contrato em vez de cada uma inventar seu próprio formato de lista de cenários. `qa-channel` é a suíte ampla de comportamento de produto sintético e não faz parte da matriz de cobertura de transporte ao vivo.

| Faixa    | Canary | Gating de menção | Bot a bot | Bloqueio por lista de permissões | Resposta de nível superior | Retomada após reinício | Continuação de thread | Isolamento de thread | Observação de reação | Comando de ajuda | Registro de comando nativo |
| -------- | ------ | ---------------- | --------- | -------------------------------- | -------------------------- | ---------------------- | --------------------- | -------------------- | -------------------- | ---------------- | -------------------------- |
| Matrix   | x      | x                | x         | x                                | x                          | x                      | x                     | x                    | x                    |                  |                            |
| Telegram | x      | x                | x         |                                  |                            |                        |                       |                      |                      | x                |                            |
| Discord  | x      | x                | x         |                                  |                            |                        |                       |                      |                      |                  | x                          |
| Slack    | x      | x                | x         |                                  |                            |                        |                       |                      |                      |                  |                            |

Isso mantém `qa-channel` como a suíte ampla de comportamento de produto, enquanto Matrix,
Telegram e transportes ao vivo futuros compartilham uma checklist explícita de contrato
de transporte.

Para uma faixa de VM Linux descartável sem levar Docker para o caminho de QA, execute:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Isso inicializa um guest Multipass novo, instala dependências, compila o OpenClaw
dentro do guest, executa `qa suite` e então copia o relatório de QA normal e o
resumo de volta para `.artifacts/qa-e2e/...` no host.
Ele reutiliza o mesmo comportamento de seleção de cenários que `qa suite` no host.
As execuções das suítes no host e no Multipass executam vários cenários selecionados em paralelo
com workers de Gateway isolados por padrão. `qa-channel` usa concorrência
4 por padrão, limitada pela quantidade de cenários selecionados. Use `--concurrency <count>` para ajustar
a quantidade de workers, ou `--concurrency 1` para execução serial.
O comando sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando
você quiser artefatos sem um código de saída com falha.
Execuções live encaminham as entradas de autenticação de QA compatíveis que são práticas para o
guest: chaves de provedores baseadas em env, o caminho da configuração do provedor live de QA e
`CODEX_HOME` quando presente. Mantenha `--output-dir` sob a raiz do repositório para que o guest
possa escrever de volta pelo workspace montado.

## Referência de QA do Telegram, Discord e Slack

Matrix tem uma [página dedicada](/pt-BR/concepts/qa-matrix) por causa da sua quantidade de cenários e do provisionamento de homeserver apoiado por Docker. Telegram, Discord e Slack são menores — alguns cenários cada, sem sistema de perfis, contra canais reais preexistentes — então a referência deles fica aqui.

### Flags de CLI compartilhadas

Essas lanes são registradas por meio de `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` e aceitam as mesmas flags:

| Flag                                  | Padrão                                                         | Descrição                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | Executa somente este cenário. Repetível.                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Onde os relatórios/resumo/mensagens observadas e o log de saída são gravados. Caminhos relativos são resolvidos em relação a `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Raiz do repositório ao invocar a partir de um cwd neutro.                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | ID temporário da conta dentro da configuração do Gateway de QA.                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` ou `live-frontier` (`live-openai` legado ainda funciona).                                                  |
| `--model <ref>` / `--alt-model <ref>` | padrão do provedor                                                | Refs do modelo primário/alternativo.                                                                                         |
| `--fast`                              | desativado                                                             | Modo rápido do provedor quando compatível.                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | Consulte [pool de credenciais Convex](#convex-credential-pool).                                                                |
| `--credential-role <maintainer\|ci>`  | `ci` em CI, `maintainer` caso contrário                              | Papel usado quando `--credential-source convex`.                                                                          |

Cada lane sai com código diferente de zero em qualquer cenário com falha. `--allow-failures` grava artefatos sem definir um código de saída com falha.

### QA do Telegram

```bash
pnpm openclaw qa telegram
```

Tem como alvo um grupo privado real do Telegram com dois bots distintos (driver + SUT). O bot SUT deve ter um nome de usuário do Telegram; a observação bot-a-bot funciona melhor quando ambos os bots têm **Bot-to-Bot Communication Mode** habilitado no `@BotFather`.

Env obrigatório quando `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — ID numérico do chat (string).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Opcional:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` mantém os corpos das mensagens nos artefatos de mensagens observadas (o padrão é redigir).

Cenários (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`

Artefatos de saída:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — inclui RTT por resposta (envio do driver → resposta SUT observada), começando pelo canary.
- `telegram-qa-observed-messages.json` — corpos redigidos, a menos que `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA do Discord

```bash
pnpm openclaw qa discord
```

Tem como alvo um canal real de guilda privada do Discord com dois bots: um bot driver controlado pelo harness e um bot SUT iniciado pelo Gateway filho do OpenClaw por meio do Plugin Discord empacotado. Verifica o tratamento de menções de canal, que o bot SUT registrou o comando nativo `/help` com o Discord, e cenários de evidência Mantis opcionais.

Env obrigatório quando `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — deve corresponder ao ID de usuário do bot SUT retornado pelo Discord (caso contrário, a lane falha rapidamente).

Opcional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` mantém os corpos das mensagens nos artefatos de mensagens observadas.

Cenários (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — cenário Mantis opcional. Executa sozinho porque muda o SUT para respostas de guilda sempre ativas e somente por ferramenta com `messages.statusReactions.enabled=true`, e então captura uma linha do tempo de reações REST mais um artefato visual HTML/PNG.

Execute explicitamente o cenário de reações de status do Mantis:

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
- `discord-qa-observed-messages.json` — corpos redigidos, a menos que `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` e `discord-status-reactions-tool-only-timeline.png` quando o cenário de reação de status é executado.

### QA do Slack

```bash
pnpm openclaw qa slack
```

Tem como alvo um canal privado real do Slack com dois bots distintos: um bot driver controlado pelo harness e um bot SUT iniciado pelo Gateway filho do OpenClaw por meio do Plugin Slack empacotado.

Env obrigatório quando `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Opcional:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` mantém os corpos das mensagens nos artefatos de mensagens observadas.

Cenários (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`

Artefatos de saída:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — corpos redigidos, a menos que `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

### Pool de credenciais Convex

As lanes do Telegram, Discord e Slack podem alugar credenciais de um pool Convex compartilhado em vez de ler as variáveis de env acima. Passe `--credential-source convex` (ou defina `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); o QA Lab adquire uma locação exclusiva, envia heartbeats durante a execução e a libera no desligamento. Os tipos de pool são `"telegram"`, `"discord"` e `"slack"`.

Formatos de payload que o broker valida em `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` deve ser uma string de ID numérico de chat.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

As variáveis de env operacionais e o contrato do endpoint do broker Convex ficam em [Testes → Credenciais compartilhadas do Telegram via Convex](/pt-BR/help/testing#shared-telegram-credentials-via-convex-v1) (o nome da seção é anterior ao suporte ao Discord; a semântica do broker é idêntica para ambos os tipos).

## Seeds apoiados pelo repositório

Os ativos de seed ficam em `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Eles ficam intencionalmente no git para que o plano de QA fique visível tanto para humanos quanto para o
agente.

`qa-lab` deve continuar sendo um executor genérico de markdown. Cada arquivo markdown de cenário é
a fonte da verdade para uma execução de teste e deve definir:

- metadados do cenário
- metadados opcionais de categoria, capacidade, lane e risco
- refs de docs e código
- requisitos opcionais de Plugin
- patch opcional de configuração do Gateway
- o `qa-flow` executável

A superfície de runtime reutilizável que sustenta `qa-flow` pode continuar genérica
e transversal. Por exemplo, cenários markdown podem combinar auxiliares do lado do transporte
com auxiliares do lado do navegador que conduzem a Control UI incorporada por meio da
seam `browser.request` do Gateway sem adicionar um runner especial.

Os arquivos de cenário devem ser agrupados por capacidade de produto, em vez de pasta
da árvore de código-fonte. Mantenha os IDs de cenário estáveis quando arquivos forem movidos; use `docsRefs` e `codeRefs`
para rastreabilidade da implementação.

A lista de base deve permanecer ampla o suficiente para cobrir:

- chat por DM e canal
- comportamento de threads
- ciclo de vida de ações de mensagem
- callbacks de cron
- recall de memória
- troca de modelo
- handoff para subagente
- leitura de repositório e leitura de docs
- uma pequena tarefa de build, como Lobster Invaders

## Lanes de mock de provedor

`qa suite` tem duas lanes locais de mock de provedor:

- `mock-openai` é o mock do OpenClaw ciente de cenários. Ele continua sendo a lane de mock determinística
  padrão para QA apoiado pelo repositório e gates de paridade.
- `aimock` inicia um servidor de provedor apoiado pelo AIMock para cobertura experimental de protocolo,
  fixture, gravação/reprodução e caos. Ele é aditivo e não
  substitui o dispatcher de cenários `mock-openai`.

A implementação de lanes de provedor fica em `extensions/qa-lab/src/providers/`.
Cada provedor possui seus padrões, inicialização de servidor local, configuração de modelo do Gateway,
necessidades de preparação de perfil de autenticação e flags de capacidade live/mock. O código compartilhado da suíte e do
Gateway deve rotear pelo registro de provedores em vez de ramificar por
nomes de provedores.

## Adaptadores de transporte

`qa-lab` possui uma seam de transporte genérica para cenários de QA em markdown. `qa-channel` é o primeiro adaptador nessa seam, mas o alvo de design é mais amplo: canais reais ou sintéticos futuros devem se conectar ao mesmo runner de suíte em vez de adicionar um runner de QA específico para transporte.

No nível de arquitetura, a divisão é:

- `qa-lab` possui execução genérica de cenários, concorrência de workers, gravação de artefatos e relatórios.
- O adaptador de transporte possui configuração do Gateway, prontidão, observação de entrada e saída, ações de transporte e estado de transporte normalizado.
- Arquivos de cenário markdown em `qa/scenarios/` definem a execução de teste; `qa-lab` fornece a superfície de runtime reutilizável que os executa.

### Adicionando um canal

Adicionar um canal ao sistema de QA em markdown exige exatamente duas coisas:

1. Um adaptador de transporte para o canal.
2. Um pacote de cenários que exercite o contrato do canal.

Não adicione uma nova raiz de comando de QA de nível superior quando o host `qa-lab` compartilhado puder ser dono do fluxo.

`qa-lab` é responsável pela mecânica compartilhada do host:

- a raiz do comando `openclaw qa`
- inicialização e encerramento da suíte
- concorrência de workers
- gravação de artefatos
- geração de relatórios
- execução de cenários
- aliases de compatibilidade para cenários `qa-channel` mais antigos

Os plugins executores são responsáveis pelo contrato de transporte:

- como `openclaw qa <runner>` é montado abaixo da raiz `qa` compartilhada
- como o gateway é configurado para esse transporte
- como a prontidão é verificada
- como eventos de entrada são injetados
- como mensagens de saída são observadas
- como transcrições e o estado normalizado do transporte são expostos
- como ações respaldadas pelo transporte são executadas
- como redefinições ou limpezas específicas do transporte são tratadas

O nível mínimo de adoção para um novo canal:

1. Mantenha `qa-lab` como responsável pela raiz `qa` compartilhada.
2. Implemente o executor de transporte na interface compartilhada de host do `qa-lab`.
3. Mantenha a mecânica específica de transporte dentro do plugin executor ou do harness de canal.
4. Monte o executor como `openclaw qa <runner>` em vez de registrar um comando raiz concorrente. Plugins executores devem declarar `qaRunners` em `openclaw.plugin.json` e exportar um array `qaRunnerCliRegistrations` correspondente de `runtime-api.ts`. Mantenha `runtime-api.ts` leve; a CLI preguiçosa e a execução do executor devem ficar atrás de pontos de entrada separados.
5. Crie ou adapte cenários Markdown nos diretórios temáticos `qa/scenarios/`.
6. Use os auxiliares genéricos de cenário para novos cenários.
7. Mantenha os aliases de compatibilidade existentes funcionando, a menos que o repo esteja fazendo uma migração intencional.

A regra de decisão é estrita:

- Se o comportamento puder ser expresso uma vez em `qa-lab`, coloque-o em `qa-lab`.
- Se o comportamento depender de um transporte de canal, mantenha-o nesse plugin executor ou harness de plugin.
- Se um cenário precisar de um novo recurso que mais de um canal possa usar, adicione um auxiliar genérico em vez de uma ramificação específica de canal em `suite.ts`.
- Se um comportamento só fizer sentido para um transporte, mantenha o cenário específico de transporte e deixe isso explícito no contrato do cenário.

### Nomes dos auxiliares de cenário

Auxiliares genéricos preferidos para novos cenários:

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

Aliases de compatibilidade continuam disponíveis para cenários existentes — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — mas a criação de novos cenários deve usar os nomes genéricos. Os aliases existem para evitar uma migração completa de uma só vez, não como o modelo daqui em diante.

## Relatórios

`qa-lab` exporta um relatório de protocolo em Markdown a partir da linha do tempo observada do barramento.
O relatório deve responder:

- O que funcionou
- O que falhou
- O que permaneceu bloqueado
- Quais cenários de acompanhamento valem a pena adicionar

Para o inventário de cenários disponíveis — útil ao dimensionar trabalho de acompanhamento ou conectar um novo transporte — execute `pnpm openclaw qa coverage` (adicione `--json` para saída legível por máquina).

Para verificações de personagem e estilo, execute o mesmo cenário em várias refs de modelos ao vivo
e grave um relatório julgado em Markdown:

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

O comando executa processos filhos locais do Gateway de QA, não Docker. Cenários de avaliação de personagem
devem definir a persona por meio de `SOUL.md` e depois executar turnos comuns de usuário,
como chat, ajuda no workspace e pequenas tarefas de arquivo. O modelo candidato
não deve ser informado de que está sendo avaliado. O comando preserva cada
transcrição completa, registra estatísticas básicas de execução e depois pede aos modelos juízes em modo rápido com
raciocínio `xhigh`, quando houver suporte, para classificar as execuções por naturalidade, vibe e humor.
Use `--blind-judge-models` ao comparar provedores: o prompt do juiz ainda recebe
todas as transcrições e estados de execução, mas as refs candidatas são substituídas por
rótulos neutros como `candidate-01`; o relatório mapeia as classificações de volta para as refs reais após
a análise.
Execuções candidatas usam `high` thinking por padrão, com `medium` para GPT-5.5 e `xhigh`
para refs de avaliação OpenAI mais antigas que oferecem suporte. Substitua um candidato específico em linha com
`--model provider/model,thinking=<level>`. `--thinking <level>` ainda define um
fallback global, e a forma mais antiga `--model-thinking <provider/model=level>` é
mantida para compatibilidade.
Refs candidatas OpenAI usam modo rápido por padrão para que o processamento prioritário seja usado onde
o provedor oferece suporte. Adicione `,fast`, `,no-fast` ou `,fast=false` em linha quando um
único candidato ou juiz precisar de uma substituição. Passe `--fast` somente quando quiser
forçar o modo rápido para todos os modelos candidatos. As durações de candidatos e juízes são
registradas no relatório para análise de benchmark, mas os prompts dos juízes dizem explicitamente
para não classificar por velocidade.
Execuções dos modelos candidatos e juízes usam concorrência 16 por padrão. Reduza
`--concurrency` ou `--judge-concurrency` quando limites do provedor ou pressão local do Gateway
tornarem uma execução ruidosa demais.
Quando nenhum candidato `--model` é passado, a avaliação de personagem usa por padrão
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` e
`google/gemini-3.1-pro-preview` quando nenhum `--model` é passado.
Quando nenhum `--judge-model` é passado, os juízes usam por padrão
`openai/gpt-5.5,thinking=xhigh,fast` e
`anthropic/claude-opus-4-6,thinking=high`.

## Documentos relacionados

- [QA de matriz](/pt-BR/concepts/qa-matrix)
- [Canal de QA](/pt-BR/channels/qa-channel)
- [Testes](/pt-BR/help/testing)
- [Dashboard](/pt-BR/web/dashboard)
